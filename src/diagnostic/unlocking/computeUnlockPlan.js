// Ordem de liberação por prioridade: usa só dado que os motores
// determinísticos do Diagnóstico 360 já calculam — não inventa nenhuma
// prioridade nova aqui.
//
// Ordem final = primeiro as áreas do Top 3 oficial da IA (final_report,
// já ajustado por dependência estratégica), na ordem de rank; depois o
// resto das áreas com nota, na ordem que o motor de prioridades (Fase 12)
// já calculou (candidate_priorities, ordenado por finalPriority) — sem
// repetir área que já apareceu no Top 3.
//
// As duas áreas sem rubrica de nota (business_current, differentiation)
// nunca entram aqui — não têm score, então o motor de prioridades nunca as
// gera como candidato, e a IA não deveria escolhê-las como prioridade
// (não fazem parte de candidate_priorities, que é o insumo dela).
const db = require('../../db');

function computeUnlockPlan(diagnosticId) {
  const diagnostic = db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(diagnosticId);
  if (!diagnostic) {
    const err = new Error('Diagnóstico não encontrado.');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!diagnostic.candidate_priorities) {
    const err = new Error('Calcule as prioridades do diagnóstico antes de montar a ordem de liberação.');
    err.code = 'PRIORITIES_NOT_GENERATED';
    throw err;
  }

  const candidatePriorities = JSON.parse(diagnostic.candidate_priorities);
  const finalReport = diagnostic.final_report ? JSON.parse(diagnostic.final_report) : null;

  const candidateAreaIds = new Set(candidatePriorities.map((c) => c.area));

  const topPriorityAreas = finalReport
    ? [...(finalReport.top_priorities || [])]
        .sort((a, b) => a.rank - b.rank)
        .map((p) => p.area)
        .filter((area) => candidateAreaIds.has(area)) // ignora área que a IA tenha citado fora do que os candidatos permitem (ex.: business/differentiation, sem score)
    : [];

  const orderedAreas = [];
  topPriorityAreas.forEach((area) => {
    if (!orderedAreas.includes(area)) orderedAreas.push(area);
  });
  candidatePriorities.forEach((c) => {
    if (!orderedAreas.includes(c.area)) orderedAreas.push(c.area);
  });

  return {
    orderedAreas,
    topPriorityAreas,
    candidatePriorities,
    hasFinalReport: !!finalReport,
  };
}

module.exports = { computeUnlockPlan };
