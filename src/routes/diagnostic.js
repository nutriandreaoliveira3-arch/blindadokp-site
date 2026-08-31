const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { BLOCK_LIST } = require('../diagnostic/blockList');
const { getBlockModule } = require('../diagnostic/blocks');

const router = express.Router();

function userHasDiagnosticAccess(user) {
  if (user.role === 'admin') return true;
  const entitled = db
    .prepare(
      `SELECT 1 FROM user_products up
       JOIN products p ON p.id = up.product_id
       WHERE up.user_id = ? AND p.key = 'mentoria_blindada_pro'`
    )
    .get(user.id);
  return !!entitled;
}

router.use(requireAuth, (req, res, next) => {
  if (!userHasDiagnosticAccess(req.user)) {
    return res.status(403).json({ error: 'O Diagnóstico Blindado 360 é exclusivo de quem tem a Mentoria Blindada Pró.' });
  }
  next();
});

function getOrCreateDiagnostic(userId) {
  let diagnostic = db.prepare('SELECT * FROM diagnostics WHERE user_id = ?').get(userId);
  if (!diagnostic) {
    const id = uuidv4();
    db.prepare('INSERT INTO diagnostics (id, user_id) VALUES (?, ?)').run(id, userId);
    diagnostic = db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(id);
  }
  return diagnostic;
}

// GET /api/diagnostic — visão geral: os 15 blocos e o progresso da usuária.
router.get('/', (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  const rows = db
    .prepare('SELECT block_id, completed_at FROM diagnostic_blocks WHERE diagnostic_id = ?')
    .all(diagnostic.id);
  const completedByBlock = new Map(rows.map((r) => [r.block_id, !!r.completed_at]));

  const blocks = BLOCK_LIST.map((block) => ({
    ...block,
    available: !!getBlockModule(block.id),
    completed: !!completedByBlock.get(block.id),
  }));

  res.json({
    diagnostic: { id: diagnostic.id, status: diagnostic.status },
    blocks,
  });
});

// GET /api/diagnostic/blocks/:blockId — perguntas do bloco + respostas salvas.
router.get('/blocks/:blockId', (req, res) => {
  const blockModule = getBlockModule(req.params.blockId);
  if (!blockModule) {
    return res.status(404).json({ error: 'Esse bloco ainda não está disponível.' });
  }

  const diagnostic = getOrCreateDiagnostic(req.user.id);
  const saved = db
    .prepare('SELECT * FROM diagnostic_blocks WHERE diagnostic_id = ? AND block_id = ?')
    .get(diagnostic.id, blockModule.id);

  res.json({
    block: {
      id: blockModule.id,
      questions: blockModule.questions,
    },
    answers: saved ? JSON.parse(saved.answers) : {},
    completed: !!saved?.completed_at,
  });
});

function isConditionMet(conditional, answers) {
  const target = answers[conditional.field];
  if (conditional.includes !== undefined) {
    return Array.isArray(target) && target.includes(conditional.includes);
  }
  return target === conditional.equals;
}

function validateRequiredFields(blockModule, answers) {
  const missing = [];
  for (const question of blockModule.questions) {
    for (const field of question.fields) {
      if (!field.required) continue;
      if (field.conditional && !isConditionMet(field.conditional, answers)) continue;
      const value = answers[field.id];
      if (field.type === 'multiselect') {
        if (!Array.isArray(value) || value.length === 0) missing.push(field.id);
      } else if (value === undefined || value === null || value === '') {
        missing.push(field.id);
      }
    }
    for (const field of question.fields) {
      if (field.type === 'multiselect' && field.maxSelect) {
        const value = answers[field.id];
        if (Array.isArray(value) && value.length > field.maxSelect) {
          missing.push(`${field.id} (máximo ${field.maxSelect})`);
        }
      }
    }
  }
  return missing;
}

// PUT /api/diagnostic/blocks/:blockId — salva respostas (autosave) e, quando
// completed=true, valida campos obrigatórios e calcula dados derivados/red
// flags conforme a especificação do bloco.
router.put('/blocks/:blockId', (req, res) => {
  const blockModule = getBlockModule(req.params.blockId);
  if (!blockModule) {
    return res.status(404).json({ error: 'Esse bloco ainda não está disponível.' });
  }

  const { answers, completed } = req.body || {};
  if (typeof answers !== 'object' || answers === null) {
    return res.status(400).json({ error: 'Respostas inválidas.' });
  }

  if (completed) {
    const missing = validateRequiredFields(blockModule, answers);
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Preencha os campos obrigatórios.', missing });
    }
  }

  const diagnostic = getOrCreateDiagnostic(req.user.id);
  const { derived, redFlags } = blockModule.analyze(answers);

  db.prepare(
    `INSERT INTO diagnostic_blocks (diagnostic_id, block_id, answers, derived, red_flags, completed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(diagnostic_id, block_id) DO UPDATE SET
       answers = excluded.answers,
       derived = excluded.derived,
       red_flags = excluded.red_flags,
       completed_at = COALESCE(excluded.completed_at, diagnostic_blocks.completed_at),
       updated_at = datetime('now')`
  ).run(
    diagnostic.id,
    blockModule.id,
    JSON.stringify(answers),
    JSON.stringify(derived),
    JSON.stringify(redFlags),
    completed ? new Date().toISOString() : null
  );

  db.prepare(`UPDATE diagnostics SET updated_at = datetime('now') WHERE id = ?`).run(diagnostic.id);

  res.json({ ok: true, completed: !!completed });
});

module.exports = router;
