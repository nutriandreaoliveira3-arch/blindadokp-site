const crypto = require('crypto');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { sendActivationEmail } = require('../lib/email');

const router = express.Router();

// A Greenn permite escolher, no painel, um token de webhook (Integração e Tokens).
// Ela pode enviá-lo como header, query string ou dentro do próprio payload —
// por isso aceitamos qualquer uma dessas formas.
function extractToken(req) {
  return (
    req.headers['x-webhook-token'] ||
    req.headers['x-greenn-token'] ||
    req.query.token ||
    req.body?.token ||
    null
  );
}

function isValidToken(token) {
  const expected = process.env.GREENN_WEBHOOK_TOKEN;
  if (!expected) return false;
  if (!token) return false;
  const a = Buffer.from(String(token));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// O formato exato do payload deve ser conferido na conta real da Greenn
// (Configurações > Integração e Tokens > Webhook) quando for configurado em
// produção; aqui aceitamos as variações mais comuns de nomes de campo.
function extractSaleInfo(body) {
  const data = body?.data || body?.sale || body || {};
  const customer = data.customer || data.client || data.buyer || {};
  const product = data.product || data.item || (Array.isArray(data.items) ? data.items[0] : null) || {};

  return {
    saleId: data.id || data.sale_id || data.saleId || null,
    status: data.status || body?.status || null,
    name: customer.name || customer.full_name || null,
    email: (customer.email || '').toLowerCase().trim() || null,
    productName:
      product.name || product.title || data.product_name || data.productName || data.offer_name || null,
  };
}

function normalizeForMatch(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// A Greenn não documenta um formato fixo pro nome do produto no payload, então
// fazemos correspondência aproximada (normalizada, por substring) contra os
// produtos cadastrados. O raw_payload fica salvo em greenn_events pra calibrar
// esse matching assim que a primeira venda real/teste chegar.
function matchProduct(productName) {
  if (!productName) return null;
  const normalizedName = normalizeForMatch(productName);
  if (!normalizedName) return null;

  const products = db.prepare('SELECT * FROM products').all();
  const exact = products.find((p) => normalizeForMatch(p.name) === normalizedName);
  if (exact) return exact;

  return (
    products.find((p) => {
      const n = normalizeForMatch(p.name);
      return normalizedName.includes(n) || n.includes(normalizedName);
    }) || null
  );
}

router.post('/greenn', express.json(), async (req, res) => {
  const token = extractToken(req);

  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Token de webhook inválido.' });
  }

  const info = extractSaleInfo(req.body);

  db.prepare(
    'INSERT INTO greenn_events (id, sale_id, status, raw_payload) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), info.saleId, info.status, JSON.stringify(req.body));

  if (!info.email) {
    // Evento sem e-mail identificável (ex.: teste de conexão da Greenn). Apenas registramos.
    return res.json({ received: true });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(info.email);
  const product = matchProduct(info.productName);
  if (!product) {
    console.warn(
      `Webhook Greenn: não foi possível identificar o produto a partir de "${info.productName}". ` +
        'Confira greenn_events.raw_payload para calibrar o matching.'
    );
  }

  if (info.status === 'paid') {
    let userId;
    if (existing) {
      userId = existing.id;
      db.prepare(
        `UPDATE users SET status = CASE WHEN password_hash IS NULL THEN 'pending' ELSE 'active' END,
         greenn_sale_id = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(info.saleId, existing.id);
    } else {
      userId = uuidv4();
      const activationToken = uuidv4();
      db.prepare(
        `INSERT INTO users (id, name, email, role, status, activation_token, greenn_sale_id)
         VALUES (?, ?, ?, 'client', 'pending', ?, ?)`
      ).run(userId, info.name || info.email, info.email, activationToken, info.saleId);

      try {
        await sendActivationEmail({ to: info.email, name: info.name || info.email, activationToken });
      } catch (err) {
        console.error(`Falha ao enviar e-mail de ativação para ${info.email}:`, err.message);
      }
    }

    if (product) {
      db.prepare(
        'INSERT OR IGNORE INTO user_products (user_id, product_id) VALUES (?, ?)'
      ).run(userId, product.id);
    }
  } else if (['refunded', 'chargedback', 'refused'].includes(info.status) && existing) {
    if (product) {
      db.prepare('DELETE FROM user_products WHERE user_id = ? AND product_id = ?').run(
        existing.id,
        product.id
      );
    } else {
      // Não deu pra identificar qual produto foi estornado — por segurança,
      // bloqueia a conta inteira até calibrar o matching de produto.
      db.prepare(
        `UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`
      ).run(existing.id);
    }
  }

  res.json({ received: true });
});

module.exports = router;
