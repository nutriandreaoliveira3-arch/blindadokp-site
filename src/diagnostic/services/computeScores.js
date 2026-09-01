// Fase 9 — Scoring. Orquestra: buscar as respostas dos 15 blocos já
// concluídos, mandar pontuar (Fase de IA, restrita às dimensões com
// rubrica documentada), agregar em nota de bloco e nota geral (funções
// puras e determinísticas), e salvar o resultado na tabela diagnostics.
const db = require('../../db');
const { BLOCK_LIST } = require('../blockList');
const { SCORE_RUBRICS } = require('../scoring/rubrics');
const { computeBlockScore, computeGeneralScore } = require('../scoring/aggregate');
const { scoreDiagnosticBlocks } = require('../ai/scoreBlocks');

function getDiagnosticBlockRows(diagnosticId) {
  return db
    .prepare('SELECT block_id, answers, derived, red_flags, completed_at FROM diagnostic_blocks WHERE diagnostic_id = ?')
    .all(diagnosticId);
}

function allBlocksCompleted(rows) {
  const completedIds = new Set(rows.filter((r) => r.completed_at).map((r) => r.block_id));
  return BLOCK_LIST.every((block) => completedIds.has(block.id));
}

// Blocos sem rubrica documentada (Bloco 1 — Negócio Atual e Bloco 4 —
// Diferenciação): a especificação não dá os critérios de 0 a 5 para eles,
// então o score do bloco fica null em vez de inventado. Ver comentário em
// src/diagnostic/scoring/rubrics.js.
const BLOCKS_WITHOUT_RUBRIC = ['business_current', 'differentiation'];

async function computeDiagnosticScores(diagnosticId) {
  const rows = getDiagnosticBlockRows(diagnosticId);
  if (!allBlocksCompleted(rows)) {
    const err = new Error('Todos os 15 blocos do Diagnóstico 360 precisam estar concluídos antes de calcular os scores.');
    err.code = 'BLOCKS_INCOMPLETE';
    throw err;
  }

  const blockContext = {};
  rows.forEach((row) => {
    if (SCORE_RUBRICS[row.block_id]) {
      blockContext[row.block_id] = {
        answers: JSON.parse(row.answers),
        derived: JSON.parse(row.derived),
        red_flags: JSON.parse(row.red_flags),
      };
    }
  });

  const dimensionScores = await scoreDiagnosticBlocks(blockContext);

  const blockScores = {};
  Object.keys(SCORE_RUBRICS).forEach((blockId) => {
    blockScores[blockId] = computeBlockScore(dimensionScores[blockId] || {});
  });
  BLOCKS_WITHOUT_RUBRIC.forEach((blockId) => {
    blockScores[blockId] = null;
  });

  const generalScore = computeGeneralScore(blockScores);

  db.prepare(
    `UPDATE diagnostics
     SET block_scores = ?, general_score = ?, scores_generated_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`
  ).run(JSON.stringify({ dimension_scores: dimensionScores, block_scores: blockScores }), generalScore, diagnosticId);

  return { dimensionScores, blockScores, generalScore };
}

module.exports = { computeDiagnosticScores, allBlocksCompleted, BLOCKS_WITHOUT_RUBRIC };
