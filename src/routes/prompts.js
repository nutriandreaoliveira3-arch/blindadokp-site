const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function userHasPromptsAccess(user) {
  if (user.role === 'admin') return true;
  const entitled = db
    .prepare(
      `SELECT 1 FROM user_products up
       JOIN products p ON p.id = up.product_id
       WHERE up.user_id = ? AND p.key = 'maquina_de_prompts'`
    )
    .get(user.id);
  return !!entitled;
}

// Lista os prompts pra quem já comprou a Máquina de Prompts.
router.get('/', requireAuth, (req, res) => {
  if (!userHasPromptsAccess(req.user)) {
    return res.status(403).json({ error: 'Compre a Máquina de Prompts pra acessar essa biblioteca.' });
  }
  const prompts = db.prepare('SELECT * FROM prompts ORDER BY profession, content_type, sort_order').all();
  res.json({ prompts });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, profession, content_type, body } = req.body || {};
  if (!title || !profession || !content_type || !body) {
    return res.status(400).json({ error: 'Informe título, profissão, tipo de conteúdo e o texto do prompt.' });
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max FROM prompts').get().max;
  const id = uuidv4();
  db.prepare(
    'INSERT INTO prompts (id, title, profession, content_type, body, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, title, profession, content_type, body, maxOrder + 1);

  res.status(201).json({ prompt: db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) });
});

router.put('/:promptId', requireAuth, requireAdmin, (req, res) => {
  const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(req.params.promptId);
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt não encontrado.' });
  }

  const { title, profession, content_type, body } = req.body || {};
  db.prepare(
    `UPDATE prompts SET title = ?, profession = ?, content_type = ?, body = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    title ?? prompt.title,
    profession ?? prompt.profession,
    content_type ?? prompt.content_type,
    body ?? prompt.body,
    prompt.id
  );

  res.json({ prompt: db.prepare('SELECT * FROM prompts WHERE id = ?').get(prompt.id) });
});

router.delete('/:promptId', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM prompts WHERE id = ?').run(req.params.promptId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Prompt não encontrado.' });
  }
  res.json({ ok: true });
});

module.exports = router;
