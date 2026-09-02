const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { BLOCK_LIST } = require('../diagnostic/blockList');
const { getBlockModule } = require('../diagnostic/blocks');
const { computeDiagnosticScores, allBlocksCompleted } = require('../diagnostic/services/computeScores');
const { computeDiagnosticPriorities } = require('../diagnostic/services/computePriorities');
const { processFinalDiagnostic, getFinalDiagnostic } = require('../diagnostic/services/processFinalDiagnostic');
const { getClientDeliverables } = require('../diagnostic/services/generateClientDeliverables');
const { getClientUnlockStatus } = require('../diagnostic/unlocking/unlockEngine');
const { getCurrentDiagnostic } = require('../diagnostic/services/getCurrentDiagnostic');
const { isRetakeUnlocked, startRetake, getDiagnosticHistory } = require('../diagnostic/services/retakeDiagnostic');

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

// Devolve o diagnóstico ATUAL da cliente (o mais recente) — cria um novo se
// ela nunca tiver começado nenhum ainda.
function getOrCreateDiagnostic(userId) {
  let diagnostic = getCurrentDiagnostic(userId);
  if (!diagnostic) {
    const id = uuidv4();
    db.prepare('INSERT INTO diagnostics (id, user_id) VALUES (?, ?)').run(id, userId);
    diagnostic = db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(id);
  }
  return diagnostic;
}

// Respostas dos outros blocos já respondidos, pra blocos que reaproveitam
// contexto (ex.: Bloco 5 reutilizando as ofertas cadastradas no Bloco 1 e o
// diferencial do Bloco 4), sem obrigar a usuária a repetir informação.
function getDiagnosticContext(diagnosticId) {
  const rows = db.prepare('SELECT block_id, answers FROM diagnostic_blocks WHERE diagnostic_id = ?').all(diagnosticId);
  const context = {};
  rows.forEach((row) => {
    context[row.block_id] = JSON.parse(row.answers);
  });
  return context;
}

function resolveQuestions(blockModule, context) {
  return blockModule.buildQuestions ? blockModule.buildQuestions(context) : blockModule.questions;
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
    diagnostic: {
      id: diagnostic.id,
      status: diagnostic.status,
      allBlocksCompleted: blocks.every((b) => b.completed),
      generalScore: diagnostic.general_score,
      scoresGeneratedAt: diagnostic.scores_generated_at,
    },
    // Índice histórico: se a Andréa já liberou, a cliente pode refazer o
    // diagnóstico assim que quiser — mesmo com o atual completo.
    retakeUnlocked: isRetakeUnlocked(req.user.id),
    blocks,
  });
});

// POST /api/diagnostic/retake — Índice histórico: começa uma rodada nova
// do Diagnóstico 360, só se a Andréa tiver liberado antes (Admin →
// Clientes). A rodada anterior fica de histórico, nunca é apagada.
router.post('/retake', (req, res) => {
  try {
    const diagnostic = startRetake(req.user.id);
    res.json({ ok: true, diagnostic: { id: diagnostic.id } });
  } catch (err) {
    if (err.code === 'RETAKE_NOT_UNLOCKED') {
      return res.status(403).json({ error: err.message });
    }
    console.error('Erro ao começar um novo Diagnóstico 360:', err.message);
    res.status(500).json({ error: 'Não foi possível começar um novo diagnóstico agora.' });
  }
});

// GET /api/diagnostic/history — Índice histórico: as rodadas já liberadas
// dessa cliente, em ordem cronológica, pra montar a comparação de
// evolução (score geral e por área, antes/depois).
router.get('/history', (req, res) => {
  try {
    res.json({ history: getDiagnosticHistory(req.user.id) });
  } catch (err) {
    console.error('Erro ao buscar o índice histórico:', err.message);
    res.status(500).json({ error: 'Não foi possível carregar seu histórico agora.' });
  }
});

// GET /api/diagnostic/blocks/:blockId — perguntas do bloco + respostas salvas.
router.get('/blocks/:blockId', (req, res) => {
  const blockModule = getBlockModule(req.params.blockId);
  if (!blockModule) {
    return res.status(404).json({ error: 'Esse bloco ainda não está disponível.' });
  }

  const diagnostic = getOrCreateDiagnostic(req.user.id);
  const context = getDiagnosticContext(diagnostic.id);
  const saved = db
    .prepare('SELECT * FROM diagnostic_blocks WHERE diagnostic_id = ? AND block_id = ?')
    .get(diagnostic.id, blockModule.id);

  res.json({
    block: {
      id: blockModule.id,
      questions: resolveQuestions(blockModule, context),
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
  if (conditional.oneOf !== undefined) {
    return conditional.oneOf.includes(target);
  }
  return target === conditional.equals;
}

function validateRequiredFields(questions, answers) {
  const missing = [];
  for (const question of questions) {
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

  const diagnostic = getOrCreateDiagnostic(req.user.id);
  const context = getDiagnosticContext(diagnostic.id);

  if (completed) {
    const missing = validateRequiredFields(resolveQuestions(blockModule, context), answers);
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Preencha os campos obrigatórios.', missing });
    }
  }

  const { derived, redFlags } = blockModule.analyze(answers, context);

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

// POST /api/diagnostic/scores — calcula (ou recalcula) as notas dos 15
// blocos e a nota geral. Exige os 15 blocos concluídos. Chama a IA da
// Anthropic (ANTHROPIC_API_KEY) só pra aplicar as rubricas já definidas —
// não gera o relatório final ainda (isso é uma fase futura).
router.post('/scores', async (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  try {
    const result = await computeDiagnosticScores(diagnostic.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.code === 'BLOCKS_INCOMPLETE') {
      return res.status(400).json({ error: err.message });
    }
    if (String(err.message || '').includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: err.message });
    }
    console.error('Erro ao calcular scores do diagnóstico:', err);
    res.status(500).json({ error: 'Não foi possível calcular os scores agora. Tente novamente em instantes.' });
  }
});

// GET /api/diagnostic/scores — retorna o último resultado de scoring salvo.
router.get('/scores', (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  const rows = db.prepare('SELECT block_id, completed_at FROM diagnostic_blocks WHERE diagnostic_id = ?').all(diagnostic.id);

  res.json({
    allBlocksCompleted: allBlocksCompleted(rows),
    generalScore: diagnostic.general_score,
    blockScores: diagnostic.block_scores ? JSON.parse(diagnostic.block_scores).block_scores : null,
    scoresGeneratedAt: diagnostic.scores_generated_at,
  });
});

// POST /api/diagnostic/priorities — roda as hard rules determinísticas e o
// motor de prioridade em cima dos scores já calculados (não chama IA).
router.post('/priorities', (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  try {
    const result = computeDiagnosticPriorities(diagnostic.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.code === 'BLOCKS_INCOMPLETE' || err.code === 'SCORES_NOT_GENERATED') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Erro ao calcular prioridades do diagnóstico:', err);
    res.status(500).json({ error: 'Não foi possível calcular as prioridades agora. Tente novamente em instantes.' });
  }
});

// GET /api/diagnostic/priorities — retorna o último resultado salvo.
router.get('/priorities', (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  res.json({
    hardRuleFlags: diagnostic.hard_rule_flags ? JSON.parse(diagnostic.hard_rule_flags) : null,
    candidatePriorities: diagnostic.candidate_priorities ? JSON.parse(diagnostic.candidate_priorities) : null,
    prioritiesGeneratedAt: diagnostic.priorities_generated_at,
  });
});

// POST /api/diagnostic/report — Fases 13-16: monta o contexto, chama a IA
// com o Prompt Mestre, valida contra o Contrato JSON e salva o relatório
// final. Exige scores e prioridades já calculados. Pode levar mais tempo
// que os outros endpoints (até 3 chamadas de IA, por causa do retry).
router.post('/report', async (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  try {
    const result = await processFinalDiagnostic(diagnostic.id);
    // Devolutiva 1:1: o relatório recém-gerado também fica travado pra
    // cliente até a Andréa liberar (mesma regra do GET /report) — sem essa
    // checagem aqui, a cliente veria o resultado na hora, só pra sumir na
    // próxima vez que abrisse a tela.
    if (req.user.role !== 'admin') {
      return res.json({ ok: true, status: 'AWAITING_REVIEW', report: null });
    }
    res.json({ ok: true, status: 'COMPLETED', ...result });
  } catch (err) {
    if (['BLOCKS_INCOMPLETE', 'SCORES_NOT_GENERATED', 'PRIORITIES_NOT_GENERATED'].includes(err.code)) {
      return res.status(400).json({ error: err.message });
    }
    if (String(err.message || '').includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: err.message });
    }
    if (err.code === 'PROCESSING_ERROR') {
      return res.status(422).json({ error: err.message, validationErrors: err.validationErrors });
    }
    console.error('Erro ao gerar o relatório final do diagnóstico:', err);
    res.status(500).json({ error: 'Não conseguimos concluir sua análise agora. Suas respostas continuam salvas.' });
  }
});

// GET /api/diagnostic/report — retorna o último relatório final salvo (ou
// status PROCESSING/PROCESSING_ERROR se ainda não tiver um COMPLETED).
//
// Devolutiva 1:1: mesmo com o relatório já COMPLETED, a cliente só vê o
// conteúdo depois que a Andréa libera manualmente (Admin → Clientes),
// geralmente depois de uma reunião 1:1 explicando o resultado — até lá,
// devolve status AWAITING_REVIEW sem o campo "report", pra nunca vazar o
// conteúdo antes da hora. Não se aplica pra admin vendo o próprio
// diagnóstico (ex.: conta de teste).
router.get('/report', (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  try {
    const result = getFinalDiagnostic(diagnostic.id);
    if (req.user.role !== 'admin' && result.status === 'COMPLETED' && !result.releasedAt) {
      return res.json({ status: 'AWAITING_REVIEW', generatedAt: result.generatedAt, report: null });
    }
    res.json(result);
  } catch (err) {
    console.error('Erro ao buscar o relatório final do diagnóstico:', err);
    res.status(500).json({ error: 'Não foi possível carregar o relatório agora.' });
  }
});

// GET /api/diagnostic/deliverables — retorna os Entregáveis Premium
// (Dossiê de Posicionamento, Manual de Comunicação Ética, Assistente IA
// Particular) já gerados pra essa cliente. São gerados automaticamente
// junto com o relatório final (Fase 16) — esse endpoint só lê o que já
// existe, não dispara geração nova.
router.get('/deliverables', (req, res) => {
  try {
    res.json({ deliverables: getClientDeliverables(req.user.id) });
  } catch (err) {
    console.error('Erro ao buscar os entregáveis premium:', err);
    res.status(500).json({ error: 'Não foi possível carregar seus entregáveis agora.' });
  }
});

// GET /api/diagnostic/roadmap — Roadmap Blindado: a trilha completa dessa
// cliente, na ordem de prioridade calculada pelo Diagnóstico 360 — o que já
// foi liberado, o que vem a seguir, o que ainda está por vir. Reaproveita
// o mesmo motor usado no Admin → Clientes (getClientUnlockStatus), só que
// filtrado pro que interessa pra cliente ver (só áreas com módulo
// principal — sem "área sem módulo" nem detalhe de apoio, que são coisa de
// bastidor do Admin).
router.get('/roadmap', (req, res) => {
  const diagnostic = getOrCreateDiagnostic(req.user.id);
  try {
    const status = getClientUnlockStatus(req.user.id, diagnostic.id);
    const areas = status.areas
      .filter((a) => a.hasPrincipalModules)
      .map((a) => ({
        area: a.area,
        label: a.label,
        isTopPriority: a.isTopPriority,
        unlocked: a.allPrincipalUnlocked,
        modules: a.principal.map((m) => ({ title: m.title, aiMessage: (m.unlockInfo && m.unlockInfo.ai_message) || null })),
      }));
    const nextIndex = areas.findIndex((a) => !a.unlocked);
    res.json({ hasFinalReport: status.hasFinalReport, areas, nextArea: nextIndex === -1 ? null : areas[nextIndex].area });
  } catch (err) {
    if (err.code === 'PRIORITIES_NOT_GENERATED') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Erro ao montar o Roadmap Blindado:', err.message);
    res.status(500).json({ error: 'Não foi possível carregar seu roadmap agora.' });
  }
});

module.exports = router;
