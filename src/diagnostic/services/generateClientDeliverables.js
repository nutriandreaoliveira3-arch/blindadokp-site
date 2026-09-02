// Fase seguinte do relatório final: gera os 3 Entregáveis Premium (Dossiê
// de Posicionamento, Manual de Comunicação Ética, Assistente IA Particular)
// a partir do mesmo contexto do Diagnóstico 360. Chamado automaticamente
// assim que o relatório final fica pronto (processFinalDiagnostic.js) —
// cada entregável é independente: se um falhar, os outros dois continuam
// normalmente, e a cliente nunca fica sem o relatório principal por causa
// disso.
const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const { buildAiContext } = require('../ai/buildAiContext');
const { generateDossiePosicionamento } = require('../deliverables/generateDossiePosicionamento');
const { generateManualEtica } = require('../deliverables/generateManualEtica');
const { generateAssistenteIA } = require('../deliverables/generateAssistenteIA');
const { generateLandingPage } = require('../deliverables/generateLandingPage');

const DELIVERABLE_TYPES = [
  { type: 'dossie_posicionamento', generate: generateDossiePosicionamento },
  { type: 'manual_etica', generate: generateManualEtica },
  { type: 'assistente_ia', generate: generateAssistenteIA },
  { type: 'landing_page', generate: generateLandingPage },
];

function upsertDeliverable({ userId, diagnosticId, type, status, content }) {
  const existing = db.prepare('SELECT id FROM client_deliverables WHERE user_id = ? AND type = ?').get(userId, type);
  if (existing) {
    db.prepare(
      `UPDATE client_deliverables
       SET diagnostic_id = ?, status = ?, content = ?, generated_at = CASE WHEN ? = 'COMPLETED' THEN datetime('now') ELSE generated_at END, updated_at = datetime('now')
       WHERE id = ?`
    ).run(diagnosticId, status, content, status, existing.id);
    return existing.id;
  }
  const id = uuidv4();
  db.prepare(
    `INSERT INTO client_deliverables (id, user_id, diagnostic_id, type, status, content, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'COMPLETED' THEN datetime('now') ELSE NULL END)`
  ).run(id, userId, diagnosticId, type, status, content, status);
  return id;
}

function buildReportHighlights(finalReport) {
  if (!finalReport) return null;
  return {
    executive_summary: finalReport.executive_summary,
    primary_bottleneck: finalReport.primary_bottleneck,
    main_opportunity: finalReport.main_opportunity,
    top_priorities: finalReport.top_priorities,
  };
}

async function generateClientDeliverables(userId, diagnosticId) {
  const context = buildAiContext(diagnosticId);
  const diagnostic = db.prepare('SELECT final_report FROM diagnostics WHERE id = ?').get(diagnosticId);
  const finalReport = diagnostic?.final_report ? JSON.parse(diagnostic.final_report) : null;
  context.reportHighlights = buildReportHighlights(finalReport);

  const results = {};
  for (const { type, generate } of DELIVERABLE_TYPES) {
    upsertDeliverable({ userId, diagnosticId, type, status: 'PROCESSING', content: null });
    try {
      const content = await generate(context);
      upsertDeliverable({ userId, diagnosticId, type, status: 'COMPLETED', content: JSON.stringify(content) });
      results[type] = { status: 'COMPLETED' };
    } catch (err) {
      console.error(`Não foi possível gerar o entregável '${type}' pro diagnóstico ${diagnosticId}:`, err.message);
      upsertDeliverable({ userId, diagnosticId, type, status: 'PROCESSING_ERROR', content: null });
      results[type] = { status: 'PROCESSING_ERROR', error: err.message };
    }
  }
  return results;
}

function getClientDeliverables(userId) {
  const rows = db
    .prepare('SELECT type, status, content, generated_at FROM client_deliverables WHERE user_id = ?')
    .all(userId);
  const byType = {};
  rows.forEach((row) => {
    byType[row.type] = {
      status: row.status,
      generatedAt: row.generated_at,
      content: row.content ? JSON.parse(row.content) : null,
    };
  });
  return byType;
}

module.exports = { generateClientDeliverables, getClientDeliverables, DELIVERABLE_TYPES };
