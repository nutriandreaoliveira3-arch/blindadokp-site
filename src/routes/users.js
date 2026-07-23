const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendActivationEmail } = require('../lib/email');

const router = express.Router();

router.use(requireAuth, requireAdmin);

function withProducts(user) {
  const productIds = db
    .prepare('SELECT product_id FROM user_products WHERE user_id = ?')
    .all(user.id)
    .map((r) => r.product_id);
  return { ...user, productIds };
}

router.get('/', (req, res) => {
  const users = db
    .prepare(
      'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'
    )
    .all();
  res.json({ users: users.map(withProducts) });
});

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order').all();
  res.json({ products });
});

// Cadastro manual (fora do fluxo da Greenn) — venda direta ou cortesia.
router.post('/', async (req, res) => {
  const { name, email, productIds } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Informe nome e e-mail.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'Já existe uma conta com esse e-mail.' });
  }

  const ids = Array.isArray(productIds) ? productIds : [];
  for (const productId of ids) {
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(400).json({ error: 'Produto inválido.' });
    }
  }

  const id = uuidv4();
  const activationToken = uuidv4();
  db.prepare(
    `INSERT INTO users (id, name, email, role, status, activation_token)
     VALUES (?, ?, ?, 'client', 'pending', ?)`
  ).run(id, name, normalizedEmail, activationToken);

  const grantProduct = db.prepare('INSERT OR IGNORE INTO user_products (user_id, product_id) VALUES (?, ?)');
  ids.forEach((productId) => grantProduct.run(id, productId));

  try {
    await sendActivationEmail({ to: normalizedEmail, name, activationToken });
  } catch (err) {
    console.error(`Falha ao enviar e-mail de ativação para ${normalizedEmail}:`, err.message);
  }

  res.status(201).json({
    user: withProducts(
      db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(id)
    ),
  });
});

router.post('/:userId/products/:productId', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuária não encontrada.' });
  }
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  db.prepare('INSERT OR IGNORE INTO user_products (user_id, product_id) VALUES (?, ?)').run(
    user.id,
    product.id
  );
  res.json({ ok: true });
});

router.delete('/:userId/products/:productId', (req, res) => {
  db.prepare('DELETE FROM user_products WHERE user_id = ? AND product_id = ?').run(
    req.params.userId,
    req.params.productId
  );
  res.json({ ok: true });
});

router.post('/:userId/revoke', (req, res) => {
  const result = db
    .prepare(`UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`)
    .run(req.params.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Usuária não encontrada.' });
  }
  res.json({ ok: true });
});

router.post('/:userId/reactivate', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuária não encontrada.' });
  }
  const status = user.password_hash ? 'active' : 'pending';
  db.prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, user.id);
  res.json({ ok: true });
});

module.exports = router;
