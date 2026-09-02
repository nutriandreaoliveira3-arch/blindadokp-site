const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { signToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../lib/email');

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

// Aceita tanto o token de ativação (primeira senha, sem prazo) quanto o de
// "esqueci minha senha" (redefinição, expira em 1h) — mesma tela
// (definir-senha.html) resolve os dois casos pro lado da cliente.
router.post('/set-password', (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'Token inválido ou senha deve ter ao menos 8 caracteres.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE activation_token = ?').get(token);
  let viaReset = false;
  if (!user) {
    user = db
      .prepare(`SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires_at > datetime('now')`)
      .get(token);
    viaReset = true;
  }
  if (!user) {
    return res.status(400).json({ error: 'Link inválido, expirado ou já utilizado.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  if (viaReset) {
    db.prepare(
      `UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires_at = NULL, status = 'active', updated_at = datetime('now') WHERE id = ?`
    ).run(passwordHash, user.id);
  } else {
    db.prepare(
      `UPDATE users SET password_hash = ?, activation_token = NULL, status = 'active', updated_at = datetime('now') WHERE id = ?`
    ).run(passwordHash, user.id);
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  const authToken = signToken(updated);
  res.json({ token: authToken, user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } });
});

// "Esqueceu sua senha": sempre responde com a mesma mensagem genérica,
// exista ou não o e-mail — evita confirmar pra quem está tentando adivinhar
// e-mails cadastrados se uma conta existe ou não.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Informe o e-mail.' });
  }

  const genericMessage = 'Se esse e-mail estiver cadastrado, enviamos um link pra redefinir a senha — confira sua caixa de entrada (e o spam).';
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (user) {
    const resetToken = uuidv4();
    db.prepare(
      `UPDATE users SET password_reset_token = ?, password_reset_expires_at = datetime('now', '+1 hour'), updated_at = datetime('now') WHERE id = ?`
    ).run(resetToken, user.id);
    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken });
    } catch (err) {
      console.error(`Falha ao enviar e-mail de redefinição de senha para ${user.email}:`, err.message);
    }
  }

  res.json({ ok: true, message: genericMessage });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
