const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Devolve as chaves de produto que a usuária logada comprou (ex.: "rota_blindada_pro",
// "maquina_de_prompts"). O front-end usa isso pra liberar ou não cada área do site.
router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    const allKeys = db.prepare('SELECT key FROM products').all().map((p) => p.key);
    return res.json({ products: allKeys });
  }

  const keys = db
    .prepare(
      `SELECT p.key FROM user_products up
       JOIN products p ON p.id = up.product_id
       WHERE up.user_id = ?`
    )
    .all(req.user.id)
    .map((r) => r.key);

  res.json({ products: keys });
});

module.exports = router;
