const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { BLOCK_LIST } = require('../diagnostic/blockList');
const { getUnlockedModuleIds } = require('../diagnostic/unlocking/unlockEngine');

const router = express.Router();

// As mesmas 13 áreas com nota do Diagnóstico 360 (Bloco 1 "Negócio Atual" e
// Bloco 4 "Diferenciação" não têm rubrica de pontuação — ver
// scoring/rubrics.js — por isso nunca viram prioridade e não fazem sentido
// como área de liberação de módulo).
const DIAGNOSTIC_AREA_OPTIONS = BLOCK_LIST.filter(
  (b) => b.id !== 'business_current' && b.id !== 'differentiation'
).map((b) => ({ value: b.id, label: b.name }));

router.get('/diagnostic-areas', requireAuth, requireAdmin, (req, res) => {
  res.json({ areas: DIAGNOSTIC_AREA_OPTIONS });
});

const VALID_AREA_VALUES = new Set(DIAGNOSTIC_AREA_OPTIONS.map((a) => a.value));
const VALID_ROLES = new Set(['principal', 'apoio']);

// Substitui todas as áreas de um módulo pelas informadas (evita duplicar se
// a tela de admin reenviar a lista inteira a cada edição, como faz com
// aulas). diagnosticAreas: [{ area, role }] — role default 'principal'.
function replaceModuleAreas(moduleId, diagnosticAreas) {
  const rows = (diagnosticAreas || []).map((entry) => {
    const area = entry?.area;
    const role = entry?.role || 'principal';
    if (!VALID_AREA_VALUES.has(area)) {
      throw Object.assign(new Error(`Área de diagnóstico inválida: ${area}`), { status: 400 });
    }
    if (!VALID_ROLES.has(role)) {
      throw Object.assign(new Error(`Papel inválido pra área ${area}: ${role}`), { status: 400 });
    }
    return { area, role };
  });

  db.prepare('DELETE FROM module_diagnostic_areas WHERE module_id = ?').run(moduleId);
  const insert = db.prepare('INSERT INTO module_diagnostic_areas (module_id, area, role) VALUES (?, ?, ?)');
  rows.forEach((row) => insert.run(moduleId, row.area, row.role));
}

function getModuleAreas(moduleId) {
  return db.prepare('SELECT area, role FROM module_diagnostic_areas WHERE module_id = ?').all(moduleId);
}

router.get('/', requireAuth, (req, res) => {
  const modules = db.prepare('SELECT * FROM modules ORDER BY sort_order').all();
  const lessons = db.prepare('SELECT * FROM lessons ORDER BY sort_order').all();
  const products = db.prepare('SELECT * FROM products').all();
  const productById = new Map(products.map((p) => [p.id, p]));
  const areaRows = db.prepare('SELECT module_id, area, role FROM module_diagnostic_areas').all();
  const areasByModuleId = new Map();
  areaRows.forEach((row) => {
    if (!areasByModuleId.has(row.module_id)) areasByModuleId.set(row.module_id, []);
    areasByModuleId.get(row.module_id).push({ area: row.area, role: row.role });
  });

  const isAdmin = req.user.role === 'admin';
  const entitledProductIds = new Set(
    db.prepare('SELECT product_id FROM user_products WHERE user_id = ?').all(req.user.id).map((r) => r.product_id)
  );
  const unlockRows = isAdmin
    ? []
    : db
        .prepare('SELECT module_id, ai_message, unlocked_at FROM module_unlocks WHERE user_id = ?')
        .all(req.user.id);
  const unlockByModuleId = new Map(unlockRows.map((r) => [r.module_id, r]));

  const result = modules.map((mod) => {
    const diagnosticAreas = areasByModuleId.get(mod.id) || [];
    const hasPrincipalArea = diagnosticAreas.some((a) => a.role === 'principal');
    const lockedByProduct = !!mod.product_id && !entitledProductIds.has(mod.product_id);
    const unlock = unlockByModuleId.get(mod.id);
    // Módulo marcado como principal de alguma área só aparece depois de
    // liberado pra essa cliente (pelo Diagnóstico 360) — mesmo que ela já
    // tenha o produto vinculado. Módulo sem área nenhuma continua se
    // comportando como sempre (só trava por produto).
    const lockedByDiagnostic = hasPrincipalArea && !unlock;
    const locked = !isAdmin && (lockedByProduct || lockedByDiagnostic);
    const modLessons = lessons.filter((l) => l.module_id === mod.id);

    return {
      ...mod,
      product: mod.product_id ? productById.get(mod.product_id) || null : null,
      diagnosticAreas,
      locked,
      lockedByDiagnostic: !isAdmin && lockedByDiagnostic,
      unlockMessage: !locked && hasPrincipalArea ? unlock?.ai_message || null : null,
      unlockedAt: !locked && hasPrincipalArea ? unlock?.unlocked_at || null : null,
      lessons: locked
        ? modLessons.map((l) => ({ id: l.id, title: l.title, locked: true }))
        : modLessons,
    };
  });

  res.json({ modules: result });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { title, description, product_id, diagnostic_areas } = req.body || {};
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

  try {
    replaceModuleAreas(id, diagnostic_areas);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  res.status(201).json({
    module: db.prepare('SELECT * FROM modules WHERE id = ?').get(id),
    diagnosticAreas: getModuleAreas(id),
  });
});

router.put('/:moduleId', requireAuth, requireAdmin, (req, res) => {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.moduleId);
  if (!mod) {
    return res.status(404).json({ error: 'Módulo não encontrado.' });
  }

  const { title, description, product_id, diagnostic_areas } = req.body || {};
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

  if (diagnostic_areas !== undefined) {
    try {
      replaceModuleAreas(mod.id, diagnostic_areas);
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  }

  res.json({
    module: db.prepare('SELECT * FROM modules WHERE id = ?').get(mod.id),
    diagnosticAreas: getModuleAreas(mod.id),
  });
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

  const { title, content, video_url, copy_content } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'Informe o título da aula.' });
  }

  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max FROM lessons WHERE module_id = ?')
    .get(mod.id).max;
  const id = uuidv4();
  db.prepare(
    'INSERT INTO lessons (id, module_id, title, content, video_url, copy_content, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, mod.id, title, content || '', video_url || null, copy_content || null, maxOrder + 1);

  res.status(201).json({ lesson: db.prepare('SELECT * FROM lessons WHERE id = ?').get(id) });
});

router.put('/lessons/:lessonId', requireAuth, requireAdmin, (req, res) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.lessonId);
  if (!lesson) {
    return res.status(404).json({ error: 'Aula não encontrada.' });
  }

  const { title, content, video_url, copy_content } = req.body || {};
  db.prepare('UPDATE lessons SET title = ?, content = ?, video_url = ?, copy_content = ? WHERE id = ?').run(
    title ?? lesson.title,
    content ?? lesson.content,
    video_url === undefined ? lesson.video_url : video_url,
    copy_content === undefined ? lesson.copy_content : copy_content,
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
