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
const { autoUnlockNextArea } = require('../unlocking/unlockEngine');
const { generateClientDeliverables } = require('./generateClientDeliverables');
const { isAutoUnlockEnabled } = require('../../lib/settings');

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

      // Liberação gradual (autoUnlockNextArea): libera a área de maior
      // prioridade pra essa cliente. Só roda se a liberação automática
      // estiver ligada (Admin → Configurações) — enquanto a Andréa valida
      // o método na mão, ela pode desligar isso e liberar tudo manualmente
      // (Admin → Clientes), sem perder o gatilho automático pra quando
      // quiser religar. Roda depois do relatório já estar salvo — se
      // falhar (ex.: nenhum módulo marcado com área ainda), não invalida
      // o relatório, só fica sem liberar nada dessa vez.
      if (isAutoUnlockEnabled()) {
        try {
          await autoUnlockNextArea(diagnostic.user_id, diagnosticId);
        } catch (err) {
          console.error(`Não foi possível liberar módulo automático pro diagnóstico ${diagnosticId}:`, err.message);
        }
      }

      // Entregáveis Premium (Dossiê, Manual de Ética, Assistente IA
      // Particular) — são 3 chamadas de IA a mais, então rodam em segundo
      // plano (sem await) em vez de atrasar a resposta do relatório
      // principal, que já está salvo e é o que a cliente está esperando
      // ver na hora. Cada entregável já se protege individualmente (ver
      // generateClientDeliverables.js) — a cliente confere o status deles
      // depois em GET /api/diagnostic/deliverables.
      generateClientDeliverables(diagnostic.user_id, diagnosticId).catch((err) => {
        console.error(`Não foi possível gerar os entregáveis premium pro diagnóstico ${diagnosticId}:`, err.message);
      });

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
    releasedAt: diagnostic.report_released_at || null,
    report: diagnostic.final_report ? JSON.parse(diagnostic.final_report) : null,
  };
}

// Devolutiva 1:1 (Admin → Clientes): edita só os pontos-chave do relatório
// já gerado (resumo executivo, gargalo principal, maior oportunidade e
// próximo passo) — nunca os campos read-only (scores, evidence, área),
// que continuam batendo com o motor determinístico. Só funciona com
// relatório já COMPLETED.
function updateFinalDiagnosticFields(diagnosticId, fields) {
  const diagnostic = getDiagnosticRow(diagnosticId);
  if (!diagnostic || diagnostic.report_status !== 'COMPLETED' || !diagnostic.final_report) {
    const err = new Error('Esse diagnóstico ainda não tem um relatório final gerado.');
    err.code = 'REPORT_NOT_READY';
    throw err;
  }
  const report = JSON.parse(diagnostic.final_report);

  if (typeof fields.executive_summary === 'string') report.executive_summary = fields.executive_summary;
  if (fields.primary_bottleneck && report.primary_bottleneck) {
    if (typeof fields.primary_bottleneck.title === 'string') report.primary_bottleneck.title = fields.primary_bottleneck.title;
    if (typeof fields.primary_bottleneck.description === 'string') report.primary_bottleneck.description = fields.primary_bottleneck.description;
  }
  if (fields.main_opportunity && report.main_opportunity) {
    if (typeof fields.main_opportunity.title === 'string') report.main_opportunity.title = fields.main_opportunity.title;
    if (typeof fields.main_opportunity.description === 'string') report.main_opportunity.description = fields.main_opportunity.description;
  }
  if (fields.next_step && report.next_step) {
    if (typeof fields.next_step.title === 'string') report.next_step.title = fields.next_step.title;
    if (typeof fields.next_step.description === 'string') report.next_step.description = fields.next_step.description;
  }

  db.prepare(`UPDATE diagnostics SET final_report = ?, updated_at = datetime('now') WHERE id = ?`).run(
    JSON.stringify(report),
    diagnosticId
  );
  return report;
}

// Libera o relatório final pra cliente ver — chamado pelo Admin → Clientes
// depois que a Andréa revisou (e talvez editado) e já teve a devolutiva
// 1:1. Antes disso, GET /api/diagnostic/report devolve status
// AWAITING_REVIEW pra cliente, sem vazar o conteúdo do relatório.
function releaseFinalDiagnostic(diagnosticId) {
  const diagnostic = getDiagnosticRow(diagnosticId);
  if (!diagnostic || diagnostic.report_status !== 'COMPLETED') {
    const err = new Error('Esse diagnóstico ainda não tem um relatório final gerado.');
    err.code = 'REPORT_NOT_READY';
    throw err;
  }
  db.prepare(`UPDATE diagnostics SET report_released_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(
    diagnosticId
  );
}

module.exports = {
  processFinalDiagnostic,
  getFinalDiagnostic,
  updateFinalDiagnosticFields,
  releaseFinalDiagnostic,
  MAX_AI_VALIDATION_RETRIES,
};
