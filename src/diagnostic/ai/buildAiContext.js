// Fase 13 — AI Context Builder. Monta o objeto de contexto que a Fase 14
// (Prompt Mestre) serializa no prompt dinâmico (Etapa 19, seção 4), usando
// só dado já calculado pelas fases determinísticas anteriores (scoring,
// rule engine, priority engine) — nunca inventa nem recalcula nada aqui.
const db = require('../../db');
const { BLOCK_LIST } = require('../blockList');
const { classifyGeneralScore } = require('../scoring/weights');
const { toAreaId } = require('./areaIds');
const { STRATEGIC_DEPENDENCIES } = require('./dependencyMap');

const DIAGNOSTIC_VERSION = '1.0';

// Blocos sem rubrica documentada (ver scoring/rubrics.js) — o score deles
// fica sempre null, então entram automaticamente em missing_data.
const BLOCKS_WITHOUT_RUBRIC = new Set(['business_current', 'differentiation']);

function remapKeysToAreaIds(byBlockId) {
  const result = {};
  Object.entries(byBlockId).forEach(([blockId, value]) => {
    result[toAreaId(blockId)] = value;
  });
  return result;
}

function buildAiContext(diagnosticId) {
  const diagnostic = db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(diagnosticId);
  if (!diagnostic) {
    const err = new Error('Diagnóstico não encontrado.');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!diagnostic.block_scores) {
    const err = new Error('Calcule os scores antes de gerar o contexto pra IA.');
    err.code = 'SCORES_NOT_GENERATED';
    throw err;
  }
  if (!diagnostic.candidate_priorities) {
    const err = new Error('Calcule as prioridades antes de gerar o contexto pra IA.');
    err.code = 'PRIORITIES_NOT_GENERATED';
    throw err;
  }

  const { block_scores: blockScores, dimension_scores: dimensionScores } = JSON.parse(diagnostic.block_scores);
  const generalScore = diagnostic.general_score;
  const hardRuleFlags = JSON.parse(diagnostic.hard_rule_flags || '[]');
  const candidatePriorities = JSON.parse(diagnostic.candidate_priorities || '[]');

  const blockRows = db
    .prepare('SELECT block_id, answers, derived, red_flags FROM diagnostic_blocks WHERE diagnostic_id = ?')
    .all(diagnosticId);
  const rowsByBlock = {};
  blockRows.forEach((row) => {
    rowsByBlock[row.block_id] = {
      answers: JSON.parse(row.answers),
      derived: JSON.parse(row.derived),
      red_flags: JSON.parse(row.red_flags),
    };
  });

  const twelveMonthGoal = rowsByBlock.business_current && rowsByBlock.business_current.answers.twelve_month_goal;

  const answersSummary = {};
  const derivedData = {};
  const redFlagsAll = [];
  BLOCK_LIST.forEach((block) => {
    const areaId = toAreaId(block.id);
    const row = rowsByBlock[block.id];
    answersSummary[areaId] = (row && row.answers) || {};
    derivedData[areaId] = (row && row.derived) || {};
    ((row && row.red_flags) || []).forEach((flag) => {
      redFlagsAll.push({ ...flag, area: areaId });
    });
  });

  // deterministic_flags reúne as hard rules (Etapa 22, seções 24-30) e os
  // red flags de cada bloco (calculados nas Fases 3-9) — os dois tipos de
  // sinal 100% determinístico que existem hoje.
  const deterministicFlags = [
    ...hardRuleFlags.map((flag) => ({ ...flag, area: toAreaId(flag.area), blocks: (flag.blocks || []).map(toAreaId), source: 'HARD_RULE' })),
    ...redFlagsAll.map((flag) => ({ ...flag, source: 'RED_FLAG' })),
  ];

  // missing_data: blocos sem rubrica de score (Bloco 1 e 4) — a
  // especificação não deu critério de 0-5 pra eles, então nunca viram
  // score, e isso é justamente o tipo de "dado insuficiente" que a IA
  // precisa saber que existe, sem inventar um valor pra ele.
  const missingData = Array.from(BLOCKS_WITHOUT_RUBRIC).map((blockId) => ({
    area: toAreaId(blockId),
    reason: 'Bloco sem rubrica de pontuação documentada — score não calculado.',
  }));

  return {
    diagnostic_version: DIAGNOSTIC_VERSION,
    business_stage: classifyGeneralScore(generalScore),
    twelve_month_goal: twelveMonthGoal || null,
    general_score: generalScore,
    block_scores: remapKeysToAreaIds(blockScores),
    derived_data: derivedData,
    deterministic_flags: deterministicFlags,
    // Nenhum motor determinístico produz "confirmed_insights"/"hypotheses"
    // como estrutura própria hoje (só red_flags e hard_rule_flags, já
    // cobertos em deterministic_flags acima) — ficam vazios em vez de
    // inventados. A própria IA classifica seus achados como
    // CONFIRMADO/HIPOTESE dentro de key_insights, na saída.
    confirmed_insights: [],
    hypotheses: [],
    candidate_priorities: candidatePriorities.map((c) => ({ ...c, area: toAreaId(c.area) })),
    dependencies: STRATEGIC_DEPENDENCIES,
    missing_data: missingData,
    answers_summary: answersSummary,
    // Não faz parte do prompt dinâmico (Etapa 19, seção 4), mas os dois
    // dados abaixo são usados pela validação pós-IA (Fase 15/16) — ver
    // finalDiagnosticSchema.js.
    _dimensionScores: dimensionScores,
    _hardRuleNames: new Set(hardRuleFlags.map((f) => f.rule)),
  };
}

module.exports = { buildAiContext, DIAGNOSTIC_VERSION };
