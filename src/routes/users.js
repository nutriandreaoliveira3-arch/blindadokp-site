const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendActivationEmail } = require('../lib/email');
const { getClientUnlockStatus, manualUnlockNextArea } = require('../diagnostic/unlocking/unlockEngine');
const { getFinalDiagnostic, updateFinalDiagnosticFields, releaseFinalDiagnostic } = require('../diagnostic/services/processFinalDiagnostic');
const { getCurrentDiagnostic } = require('../diagnostic/services/getCurrentDiagnostic');
const { unlockRetake, isRetakeUnlocked } = require('../diagnostic/services/retakeDiagnostic');

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

// Cadastro manual (fora do fluxo da Greenn) — venda direta ou cortesia. Se
// "password" for informado, a conta já é criada ativa com essa senha (útil
// quando o e-mail de ativação ainda não está configurado, ou pra criar
// contas de teste rapidamente). Sem "password", segue o fluxo normal: fica
// pendente até a cliente definir a senha pelo link do e-mail de ativação.
router.post('/', async (req, res) => {
  const { name, email, productIds, password } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Informe nome e e-mail.' });
  }
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
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
  const grantProduct = db.prepare('INSERT OR IGNORE INTO user_products (user_id, product_id) VALUES (?, ?)');

  if (password) {
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'client', 'active')`
    ).run(id, name, normalizedEmail, passwordHash);
    ids.forEach((productId) => grantProduct.run(id, productId));
  } else {
    const activationToken = uuidv4();
    db.prepare(
      `INSERT INTO users (id, name, email, role, status, activation_token)
       VALUES (?, ?, ?, 'client', 'pending', ?)`
    ).run(id, name, normalizedEmail, activationToken);
    ids.forEach((productId) => grantProduct.run(id, productId));

    try {
      await sendActivationEmail({ to: normalizedEmail, name, activationToken });
    } catch (err) {
      console.error(`Falha ao enviar e-mail de ativação para ${normalizedEmail}:`, err.message);
    }
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

// Liberação gradual por Diagnóstico 360 — status: pra cada área, na ordem
// de prioridade dessa cliente, mostra o(s) módulo(s) principal(is) e de
// apoio, e se já foram liberados. Precisa do diagnóstico dela já ter
// prioridades calculadas (não precisa do relatório final com IA ainda —
// nesse caso a ordem fica só pelo motor determinístico, sem o Top 3
// ajustado por dependência).
router.get('/:userId/unlock-status', (req, res) => {
  const diagnostic = getCurrentDiagnostic(req.params.userId);
  if (!diagnostic) {
    return res.status(400).json({ error: 'Essa cliente ainda não iniciou o Diagnóstico 360.' });
  }
  try {
    res.json({ ...getClientUnlockStatus(req.params.userId, diagnostic.id), retakeUnlocked: isRetakeUnlocked(req.params.userId) });
  } catch (err) {
    if (err.code === 'PRIORITIES_NOT_GENERATED') {
      return res.status(400).json({ error: err.message });
    }
    console.error(`Erro ao buscar status de liberação da cliente ${req.params.userId}:`, err.message);
    res.status(500).json({ error: 'Não foi possível carregar o status de liberação agora.' });
  }
});

// Liberação manual — avança pra próxima área da ordem de prioridade dessa
// cliente (mesma lógica do gatilho automático que roda depois do
// relatório final, só que disparado por você, na hora que achar certo).
router.post('/:userId/unlock-next', async (req, res) => {
  const diagnostic = getCurrentDiagnostic(req.params.userId);
  if (!diagnostic) {
    return res.status(400).json({ error: 'Essa cliente ainda não iniciou o Diagnóstico 360.' });
  }
  try {
    const result = await manualUnlockNextArea(req.params.userId, diagnostic.id);
    if (!result.area) {
      return res.json({ ok: true, unlocked: [], message: 'Não há próxima área com módulo pra liberar agora.' });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.code === 'PRIORITIES_NOT_GENERATED') {
      return res.status(400).json({ error: err.message });
    }
    console.error(`Erro ao liberar próximo módulo da cliente ${req.params.userId}:`, err.message);
    res.status(500).json({ error: 'Não foi possível liberar o próximo módulo agora.' });
  }
});

// Devolutiva 1:1 — Admin → Clientes: ver o relatório final completo dessa
// cliente (mesmo travado, sem liberar pra ela), pra Andréa revisar antes
// da reunião 1:1.
router.get('/:userId/diagnostic-report', (req, res) => {
  const diagnostic = getCurrentDiagnostic(req.params.userId);
  if (!diagnostic) {
    return res.status(400).json({ error: 'Essa cliente ainda não iniciou o Diagnóstico 360.' });
  }
  try {
    res.json(getFinalDiagnostic(diagnostic.id));
  } catch (err) {
    console.error(`Erro ao buscar o relatório final da cliente ${req.params.userId}:`, err.message);
    res.status(500).json({ error: 'Não foi possível carregar o relatório agora.' });
  }
});

// Edita só os pontos-chave do relatório (resumo executivo, gargalo
// principal, maior oportunidade, próximo passo) antes de liberar pra
// cliente — pra Andréa poder ajustar o texto da IA com o que combinou na
// reunião 1:1, sem mexer nos scores/evidências (que continuam batendo com
// o motor determinístico).
router.put('/:userId/diagnostic-report', (req, res) => {
  const diagnostic = getCurrentDiagnostic(req.params.userId);
  if (!diagnostic) {
    return res.status(400).json({ error: 'Essa cliente ainda não iniciou o Diagnóstico 360.' });
  }
  try {
    const report = updateFinalDiagnosticFields(diagnostic.id, req.body || {});
    res.json({ ok: true, report });
  } catch (err) {
    if (err.code === 'REPORT_NOT_READY') {
      return res.status(400).json({ error: err.message });
    }
    console.error(`Erro ao editar o relatório final da cliente ${req.params.userId}:`, err.message);
    res.status(500).json({ error: 'Não foi possível salvar as alterações agora.' });
  }
});

// Libera o relatório pra cliente ver e, junto, avança a liberação por
// Diagnóstico 360 pra próxima área — o mesmo botão cobre os dois passos
// do fluxo da Andréa ("explico o resultado na reunião 1:1 = libero o
// próximo passo").
router.post('/:userId/diagnostic-report/release', async (req, res) => {
  const diagnostic = getCurrentDiagnostic(req.params.userId);
  if (!diagnostic) {
    return res.status(400).json({ error: 'Essa cliente ainda não iniciou o Diagnóstico 360.' });
  }
  try {
    releaseFinalDiagnostic(diagnostic.id);
  } catch (err) {
    if (err.code === 'REPORT_NOT_READY') {
      return res.status(400).json({ error: err.message });
    }
    console.error(`Erro ao liberar o relatório final da cliente ${req.params.userId}:`, err.message);
    return res.status(500).json({ error: 'Não foi possível liberar o relatório agora.' });
  }
  try {
    const result = await manualUnlockNextArea(req.params.userId, diagnostic.id);
    res.json({ ok: true, released: true, ...result });
  } catch (err) {
    console.error(`Relatório liberado, mas erro ao liberar próxima área da cliente ${req.params.userId}:`, err.message);
    res.json({ ok: true, released: true, unlocked: [], area: null, unlockError: 'Relatório liberado, mas não foi possível liberar a próxima área automaticamente — use "Liberar próxima área" abaixo.' });
  }
});

// Índice histórico — libera a cliente pra refazer o Diagnóstico 360 na
// próxima vez que ela entrar (fica pendente até ela usar). Só a Andréa
// pode liberar, pra evitar custo de IA sem ela saber (cada rodada nova são
// 5 chamadas de IA: relatório + 4 entregáveis).
router.post('/:userId/unlock-retake', (req, res) => {
  try {
    unlockRetake(req.params.userId);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    console.error(`Erro ao liberar refazer diagnóstico da cliente ${req.params.userId}:`, err.message);
    res.status(500).json({ error: 'Não foi possível liberar agora.' });
  }
});

module.exports = router;
