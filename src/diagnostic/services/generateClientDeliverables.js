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
const { generateKitComercial } = require('../deliverables/generateKitComercial');
const { generateBusinessBook } = require('../deliverables/generateBusinessBook');
const { getCurrentDiagnostic } = require('./getCurrentDiagnostic');
const { getClientUnlockStatus } = require('../unlocking/unlockEngine');
const { getDiagnosticHistory } = require('./retakeDiagnostic');

// Ordem importa: dossie_posicionamento vem primeiro porque
// generateClientDeliverables injeta o conteúdo dele em context.dossie
// assim que termina, pro Kit Comercial (e futuros entregáveis) reaproveitar
// o mesmo posicionamento/tom sem gerar de novo.
const DELIVERABLE_TYPES = [
  { type: 'dossie_posicionamento', generate: generateDossiePosicionamento },
  { type: 'manual_etica', generate: generateManualEtica },
  { type: 'assistente_ia', generate: generateAssistenteIA },
  { type: 'landing_page', generate: generateLandingPage },
  { type: 'kit_comercial', generate: generateKitComercial },
];

// releaseImmediately: true pros 4 entregáveis automáticos (sempre visíveis
// assim que ficam prontos — comportamento de sempre). Pro Business Book
// Blindado (gerado manualmente), fica false — released_at só é preenchido
// depois, por uma ação separada da Andréa (ver releaseDeliverable). Numa
// regeneração (linha já existe), released_at nunca é tocado aqui — se já
// tinha sido liberado antes, continua liberado; se não, continua travado.
function upsertDeliverable({ userId, diagnosticId, type, status, content, releaseImmediately }) {
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
  if (releaseImmediately) {
    db.prepare(
      `INSERT INTO client_deliverables (id, user_id, diagnostic_id, type, status, content, generated_at, released_at)
       VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'COMPLETED' THEN datetime('now') ELSE NULL END, CASE WHEN ? = 'COMPLETED' THEN datetime('now') ELSE NULL END)`
    ).run(id, userId, diagnosticId, type, status, content, status, status);
  } else {
    db.prepare(
      `INSERT INTO client_deliverables (id, user_id, diagnostic_id, type, status, content, generated_at)
       VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'COMPLETED' THEN datetime('now') ELSE NULL END)`
    ).run(id, userId, diagnosticId, type, status, content, status);
  }
  return id;
}

// Marca um entregável já gerado como liberado pra cliente ver (só usado
// pelo Business Book Blindado — os outros 4 já liberam sozinhos).
function releaseDeliverable(userId, type) {
  const result = db
    .prepare(`UPDATE client_deliverables SET released_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ? AND type = ? AND status = 'COMPLETED'`)
    .run(userId, type);
  if (result.changes === 0) {
    const err = new Error('Esse entregável ainda não foi gerado com sucesso.');
    err.code = 'NOT_READY';
    throw err;
  }
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
    upsertDeliverable({ userId, diagnosticId, type, status: 'PROCESSING', content: null, releaseImmediately: true });
    try {
      const content = await generate(context);
      upsertDeliverable({ userId, diagnosticId, type, status: 'COMPLETED', content: JSON.stringify(content), releaseImmediately: true });
      results[type] = { status: 'COMPLETED' };
      if (type === 'dossie_posicionamento') context.dossie = content;
    } catch (err) {
      console.error(`Não foi possível gerar o entregável '${type}' pro diagnóstico ${diagnosticId}:`, err.message);
      upsertDeliverable({ userId, diagnosticId, type, status: 'PROCESSING_ERROR', content: null, releaseImmediately: true });
      results[type] = { status: 'PROCESSING_ERROR', error: err.message };
    }
  }
  return results;
}

// Monta o contexto do Business Book (Dossiê já gerado + Roadmap + Índice
// Histórico + outros ativos) e gera — chamado só sob demanda (Admin →
// Clientes → "Gerar Business Book"), nunca automático. Fica com
// released_at = NULL (não visível pra cliente) até a Andréa liberar
// separadamente (releaseDeliverable).
async function generateBusinessBookForClient(userId) {
  const diagnostic = getCurrentDiagnostic(userId);
  if (!diagnostic) {
    const err = new Error('Essa cliente ainda não iniciou o Diagnóstico 360.');
    err.code = 'NO_DIAGNOSTIC';
    throw err;
  }

  const context = buildAiContext(diagnostic.id);
  const finalReport = diagnostic.final_report ? JSON.parse(diagnostic.final_report) : null;
  context.reportHighlights = buildReportHighlights(finalReport);

  const existing = getAllClientDeliverables(userId);
  context.dossie = existing.dossie_posicionamento?.content || null;
  context.otherAssets = {
    landing_page: existing.landing_page?.content
      ? { headline: existing.landing_page.content.headline, theme_used: existing.landing_page.content.theme_used }
      : null,
    assistente_ia: !!existing.assistente_ia?.content,
    manual_etica: !!existing.manual_etica?.content,
  };

  const unlockStatus = getClientUnlockStatus(userId, diagnostic.id);
  context.roadmap = unlockStatus.areas
    .filter((a) => a.hasPrincipalModules)
    .map((a) => ({ area: a.area, label: a.label, isTopPriority: a.isTopPriority, unlocked: a.allPrincipalUnlocked }));

  context.history = getDiagnosticHistory(userId);

  upsertDeliverable({ userId, diagnosticId: diagnostic.id, type: 'business_book', status: 'PROCESSING', content: null, releaseImmediately: false });
  try {
    const content = await generateBusinessBook(context);
    upsertDeliverable({ userId, diagnosticId: diagnostic.id, type: 'business_book', status: 'COMPLETED', content: JSON.stringify(content), releaseImmediately: false });
    return { status: 'COMPLETED' };
  } catch (err) {
    upsertDeliverable({ userId, diagnosticId: diagnostic.id, type: 'business_book', status: 'PROCESSING_ERROR', content: null, releaseImmediately: false });
    throw err;
  }
}

// Client-facing (GET /api/diagnostic/deliverables): só devolve o que já
// foi liberado — um Business Book gerado mas ainda não entregue nunca
// aparece aqui.
function getClientDeliverables(userId) {
  const rows = db
    .prepare('SELECT type, status, content, generated_at FROM client_deliverables WHERE user_id = ? AND released_at IS NOT NULL')
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

// Admin → Clientes: vê todo entregável dessa cliente, liberado ou não —
// usado no painel do Business Book Blindado, pra Andréa acompanhar
// status/pré-visualizar antes de decidir entregar.
function getAllClientDeliverables(userId) {
  const rows = db
    .prepare('SELECT type, status, content, generated_at, released_at FROM client_deliverables WHERE user_id = ?')
    .all(userId);
  const byType = {};
  rows.forEach((row) => {
    byType[row.type] = {
      status: row.status,
      generatedAt: row.generated_at,
      releasedAt: row.released_at,
      content: row.content ? JSON.parse(row.content) : null,
    };
  });
  return byType;
}

module.exports = {
  generateClientDeliverables,
  generateBusinessBookForClient,
  getClientDeliverables,
  getAllClientDeliverables,
  upsertDeliverable,
  releaseDeliverable,
  DELIVERABLE_TYPES,
};
