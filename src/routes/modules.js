const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const modules = db.prepare('SELECT * FROM modules ORDER BY sort_order').all();
  const lessons = db.prepare('SELECT * FROM lessons ORDER BY sort_order').all();
  const products = db.prepare('SELECT * FROM products').all();
  const productById = new Map(products.map((p) => [p.id, p]));

  const isAdmin = req.user.role === 'admin';
  const entitledProductIds = new Set(
    db.prepare('SELECT product_id FROM user_products WHERE user_id = ?').all(req.user.id).map((r) => r.product_id)
  );

  const result = modules.map((mod) => {
    const locked = !isAdmin && !!mod.product_id && !entitledProductIds.has(mod.product_id);
    const modLessons = lessons.filter((l) => l.module_id === mod.id);

    return {
      ...mod,
      product: mod.product_id ? productById.get(mod.product_id) || null : null,
      locked,
      lessons: locked
        ? modLessons.map((l) => ({ id: l.id, title: l.title, locked: true }))
        : modLessons,
    };
  });

  res.json({ modules: result });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, description, product_id } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'Informe o título do módulo.' });
  }
  if (product_id) {
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(400).json({ error: 'Produto inválido.' });
    }
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max FROM modules').get().max;
  const id = uuidv4();
  db.prepare(
    'INSERT INTO modules (id, title, description, product_id, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(id, title, description || '', product_id || null, maxOrder + 1);

  res.status(201).json({ module: db.prepare('SELECT * FROM modules WHERE id = ?').get(id) });
});

router.put('/:moduleId', requireAuth, requireAdmin, (req, res) => {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.moduleId);
  if (!mod) {
    return res.status(404).json({ error: 'Módulo não encontrado.' });
  }

  const { title, description, product_id } = req.body || {};
  if (product_id) {
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(400).json({ error: 'Produto inválido.' });
    }
  }

  db.prepare('UPDATE modules SET title = ?, description = ?, product_id = ? WHERE id = ?').run(
    title ?? mod.title,
    description ?? mod.description,
    product_id === undefined ? mod.product_id : product_id || null,
    mod.id
  );

  res.json({ module: db.prepare('SELECT * FROM modules WHERE id = ?').get(mod.id) });
});

router.delete('/:moduleId', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM modules WHERE id = ?').run(req.params.moduleId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Módulo não encontrado.' });
  }
  res.json({ ok: true });
});

router.post('/:moduleId/lessons', requireAuth, requireAdmin, (req, res) => {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.moduleId);
  if (!mod) {
    return res.status(404).json({ error: 'Módulo não encontrado.' });
  }

  const { title, content, video_url } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'Informe o título da aula.' });
  }

  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max FROM lessons WHERE module_id = ?')
    .get(mod.id).max;
  const id = uuidv4();
  db.prepare(
    'INSERT INTO lessons (id, module_id, title, content, video_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, mod.id, title, content || '', video_url || null, maxOrder + 1);

  res.status(201).json({ lesson: db.prepare('SELECT * FROM lessons WHERE id = ?').get(id) });
});

router.put('/lessons/:lessonId', requireAuth, requireAdmin, (req, res) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.lessonId);
  if (!lesson) {
    return res.status(404).json({ error: 'Aula não encontrada.' });
  }

  const { title, content, video_url } = req.body || {};
  db.prepare('UPDATE lessons SET title = ?, content = ?, video_url = ? WHERE id = ?').run(
    title ?? lesson.title,
    content ?? lesson.content,
    video_url === undefined ? lesson.video_url : video_url,
    lesson.id
  );

  res.json({ lesson: db.prepare('SELECT * FROM lessons WHERE id = ?').get(lesson.id) });
});

router.delete('/lessons/:lessonId', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.lessonId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Aula não encontrada.' });
  }
  res.json({ ok: true });
});

module.exports = router;
