// Fase 10/11/12 — Rule Engine + Cross-Block Engine + Priority Engine.
// Depois que os scores da Fase 9 já foram calculados e salvos, monta o
// contexto necessário (respostas/derivados/red flags dos blocos, notas por
// dimensão), roda as hard rules determinísticas e o motor de prioridade, e
// salva o resultado na tabela diagnostics. Nada aqui chama IA — é tudo
// código determinístico, conforme a "REGRA FUNDAMENTAL": scores e regras
// determinísticas têm precedência sobre qualquer recomendação da IA.
const db = require('../../db');
const { BLOCK_LIST } = require('../blockList');
const { evaluateHardRules } = require('../rules/hardRules');
const { computeCandidatePriorities } = require('../priorities/priorityEngine');

function getDiagnosticRow(diagnosticId) {
  return db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(diagnosticId);
}

function getDiagnosticBlockRows(diagnosticId) {
  return db
    .prepare('SELECT block_id, answers, derived, red_flags, completed_at FROM diagnostic_blocks WHERE diagnostic_id = ?')
    .all(diagnosticId);
}

function allBlocksCompleted(rows) {
  const completedIds = new Set(rows.filter((r) => r.completed_at).map((r) => r.block_id));
  return BLOCK_LIST.every((block) => completedIds.has(block.id));
}

function computeDiagnosticPriorities(diagnosticId) {
  const diagnostic = getDiagnosticRow(diagnosticId);
  if (!diagnostic) {
    const err = new Error('Diagnóstico não encontrado.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const rows = getDiagnosticBlockRows(diagnosticId);
  if (!allBlocksCompleted(rows)) {
    const err = new Error('Todos os 15 blocos do Diagnóstico 360 precisam estar concluídos.');
    err.code = 'BLOCKS_INCOMPLETE';
    throw err;
  }

  if (!diagnostic.block_scores) {
    const err = new Error('Calcule os scores (POST /api/diagnostic/scores) antes de gerar as prioridades.');
    err.code = 'SCORES_NOT_GENERATED';
    throw err;
  }

  const { block_scores: blockScores, dimension_scores: dimensionScores } = JSON.parse(diagnostic.block_scores);

  const rowsByBlock = {};
  rows.forEach((row) => {
    rowsByBlock[row.block_id] = {
      answers: JSON.parse(row.answers),
      derived: JSON.parse(row.derived),
      red_flags: JSON.parse(row.red_flags),
    };
  });

  const redFlagsByBlock = {};
  Object.entries(rowsByBlock).forEach(([blockId, data]) => {
    redFlagsByBlock[blockId] = data.red_flags;
  });

  const hardRuleFlags = evaluateHardRules({
    blockScores,
    dimensionScores,
    businessCurrentDerived: rowsByBlock.business_current && rowsByBlock.business_current.derived,
    acquisitionAnswers: rowsByBlock.acquisition && rowsByBlock.acquisition.answers,
    ethicsDimensionScores: dimensionScores.ethics,
  });

  const twelveMonthGoal =
    rowsByBlock.business_current && rowsByBlock.business_current.answers && rowsByBlock.business_current.answers.twelve_month_goal;

  const candidatePriorities = computeCandidatePriorities({
    blockScores,
    redFlagsByBlock,
    hardRuleFlags,
    twelveMonthGoal,
  });

  db.prepare(
    `UPDATE diagnostics
     SET hard_rule_flags = ?, candidate_priorities = ?, priorities_generated_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`
  ).run(JSON.stringify(hardRuleFlags), JSON.stringify(candidatePriorities), diagnosticId);

  return { hardRuleFlags, candidatePriorities };
}

module.exports = { computeDiagnosticPriorities };
