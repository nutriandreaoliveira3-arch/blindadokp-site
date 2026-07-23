const { verifyToken } = require('../lib/auth');
const db = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    const payload = verifyToken(token);
    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(payload.sub);

    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'Acesso inativo. Verifique sua compra.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
