// Pesos oficiais dos 15 blocos pro Score Geral (Etapa 22, seção 20 —
// "FASE 4 — SCORING" da especificação técnica). Somam 100. Não recalibrar
// sem autorização da Andréa — ver seção "63. NÃO MELHORAR AS REGRAS POR
// CONTA PRÓPRIA" do documento mestre.
const BLOCK_WEIGHTS = {
  business_current: 8,
  audience: 8,
  positioning: 7,
  differentiation: 7,
  offer: 10,
  pricing: 7,
  communication: 5,
  acquisition: 8,
  sales: 10,
  operations: 7,
  ai: 5,
  automation: 3,
  ethics: 5,
  retention: 5,
  metrics: 5,
};

// Faixas oficiais de classificação do Score Geral (Etapa 22, seção 22).
const SCORE_BANDS = [
  { max: 1.4, label: 'CRITICAL', title: 'Crítico' },
  { max: 2.4, label: 'FRAGILE', title: 'Frágil' },
  { max: 3.4, label: 'FUNCTIONAL', title: 'Funcional' },
  { max: 4.2, label: 'STRUCTURED', title: 'Estruturado' },
  { max: 5, label: 'OPTIMIZED', title: 'Otimizado' },
];

function classifyGeneralScore(score) {
  if (score === null || score === undefined) return null;
  const band = SCORE_BANDS.find((b) => score <= b.max);
  return band ? band.label : SCORE_BANDS[SCORE_BANDS.length - 1].label;
}

module.exports = { BLOCK_WEIGHTS, SCORE_BANDS, classifyGeneralScore };
