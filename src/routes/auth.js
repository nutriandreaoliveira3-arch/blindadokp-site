const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Sua compra não está ativa no momento.' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/set-password', (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'Token inválido ou senha deve ter ao menos 8 caracteres.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE activation_token = ?').get(token);
  if (!user) {
    return res.status(400).json({ error: 'Link de ativação inválido ou já utilizado.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    `UPDATE users SET password_hash = ?, activation_token = NULL, status = 'active', updated_at = datetime('now') WHERE id = ?`
  ).run(passwordHash, user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  const authToken = signToken(updated);
  res.json({ token: authToken, user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
