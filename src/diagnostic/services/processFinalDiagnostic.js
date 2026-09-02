// Fase 16 — Processing. Orquestra a geração do relatório final:
// 1. confere pré-requisitos (blocos completos, scores e prioridades já
//    calculados — Fases 9-12, tudo determinístico rodando antes da IA,
//    "8. DETERMINÍSTICO TEM PRECEDÊNCIA" da Etapa 19);
// 2. monta o contexto (Fase 13);
// 3. chama a IA (Fase 14) e valida a resposta (Fase 15);
// 4. em caso de erro de validação, tenta de novo mandando os erros
//    encontrados (Etapa 20, seção 48) até MAX_AI_VALIDATION_RETRIES vezes;
// 5. se falhar mesmo depois das tentativas, marca PROCESSING_ERROR em vez
//    de salvar ou mostrar um JSON quebrado (Etapa 20, seção 49).
const db = require('../../db');
const { BLOCK_LIST } = require('../blockList');
const { toAreaId } = require('../ai/areaIds');
const { CONTRACT_VERSION } = require('../ai/finalDiagnosticContract');
const { buildAiContext, DIAGNOSTIC_VERSION } = require('../ai/buildAiContext');
const { generateFinalDiagnostic } = require('../ai/generateFinalDiagnostic');
const { validateFinalDiagnostic } = require('../ai/finalDiagnosticSchema');

const MAX_AI_VALIDATION_RETRIES = 2;

function getDiagnosticRow(diagnosticId) {
  return db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(diagnosticId);
}

function allBlocksCompleted(diagnosticId) {
  const rows = db.prepare('SELECT block_id, completed_at FROM diagnostic_blocks WHERE diagnostic_id = ?').all(diagnosticId);
  const completedIds = new Set(rows.filter((r) => r.completed_at).map((r) => r.block_id));
  return BLOCK_LIST.every((block) => completedIds.has(block.id));
}

function buildValidationContext(context) {
  return {
    expectedScoresByArea: { general: context.general_score, ...context.block_scores },
    expectedBusinessStageLabel: context.business_stage,
    hardRuleNames: context._hardRuleNames,
    twelveMonthGoal: context.twelve_month_goal,
  };
}

function normalizeOutput(output, diagnosticId) {
  output.meta = {
    diagnostic_id: diagnosticId,
    diagnostic_version: DIAGNOSTIC_VERSION,
    contract_version: CONTRACT_VERSION,
    generated_at: new Date().toISOString(),
  };
  if (Array.isArray(output.top_priorities)) {
    output.top_priorities = [...output.top_priorities].sort((a, b) => a.rank - b.rank);
  }
  return output;
}

async function processFinalDiagnostic(diagnosticId) {
  const diagnostic = getDiagnosticRow(diagnosticId);
  if (!diagnostic) {
    const err = new Error('Diagnóstico não encontrado.');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!allBlocksCompleted(diagnosticId)) {
    const err = new Error('Todos os 15 blocos do Diagnóstico 360 precisam estar concluídos.');
    err.code = 'BLOCKS_INCOMPLETE';
    throw err;
  }
  if (!diagnostic.block_scores) {
    const err = new Error('Calcule os scores (POST /api/diagnostic/scores) antes de gerar o relatório final.');
    err.code = 'SCORES_NOT_GENERATED';
    throw err;
  }
  if (!diagnostic.candidate_priorities) {
    const err = new Error('Calcule as prioridades (POST /api/diagnostic/priorities) antes de gerar o relatório final.');
    err.code = 'PRIORITIES_NOT_GENERATED';
    throw err;
  }

  const context = buildAiContext(diagnosticId);
  const validationContext = buildValidationContext(context);

  db.prepare(
    `UPDATE diagnostics SET diagnostic_input_snapshot = ?, report_status = 'PROCESSING', updated_at = datetime('now') WHERE id = ?`
  ).run(JSON.stringify(context), diagnosticId);

  const attempts = [];
  let lastErrors = [];

  for (let attemptNumber = 0; attemptNumber <= MAX_AI_VALIDATION_RETRIES; attemptNumber += 1) {
    const { parsed, responseText } = await generateFinalDiagnostic(context, attempts);
    const { valid, errors } = validateFinalDiagnostic(parsed, validationContext);

    if (valid) {
      const finalReport = normalizeOutput(parsed, diagnosticId);
      db.prepare(
        `UPDATE diagnostics
         SET final_report = ?, report_status = 'COMPLETED', report_generated_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ?`
      ).run(JSON.stringify(finalReport), diagnosticId);
      return { report: finalReport, attempts: attemptNumber + 1 };
    }

    lastErrors = errors;
    attempts.push({ responseText, validationErrors: errors });
  }

  db.prepare(`UPDATE diagnostics SET report_status = 'PROCESSING_ERROR', updated_at = datetime('now') WHERE id = ?`).run(diagnosticId);
  const err = new Error('Não conseguimos concluir sua análise agora. Suas respostas continuam salvas.');
  err.code = 'PROCESSING_ERROR';
  err.validationErrors = lastErrors;
  throw err;
}

function getFinalDiagnostic(diagnosticId) {
  const diagnostic = getDiagnosticRow(diagnosticId);
  if (!diagnostic) {
    const err = new Error('Diagnóstico não encontrado.');
    err.code = 'NOT_FOUND';
    throw err;
  }
  return {
    status: diagnostic.report_status || null,
    generatedAt: diagnostic.report_generated_at || null,
    report: diagnostic.final_report ? JSON.parse(diagnostic.final_report) : null,
  };
}

module.exports = { processFinalDiagnostic, getFinalDiagnostic, MAX_AI_VALIDATION_RETRIES };
