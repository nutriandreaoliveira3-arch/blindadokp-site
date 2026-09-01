// Fase 10 — Rule Engine (Hard Rules). Regras determinísticas de negócio
// dadas literalmente no documento mestre (Etapa 22, seções 24-30). Rodam
// depois do scoring (Fase 9) e antes do motor de prioridade (Fase 12) e da
// camada de IA. Essas regras têm precedência sobre qualquer recomendação
// da IA — ver "8. DETERMINÍSTICO TEM PRECEDÊNCIA" da Etapa 19.
//
// Cada regra retorna true/false + a evidência que a disparou. Regras que a
// especificação escreve como "reduce_priority(X)" / "increase_priority(X)"
// (sem número dado) ficam como sinal qualitativo — não inventamos aqui uma
// magnitude que a especificação não deu. Quem usa esse sinal pra ajustar
// prioridade é o motor de prioridade (priorityEngine.js) e, na etapa final,
// a IA (que decide o Top 3 considerando dependências, não só o score).

const HAS_AD_SPEND = ['continuo', 'periodos', 'parei'];
const ACTIVE_PAID_TRAFFIC = ['continuo', 'periodos'];

function evaluateHardRules({ blockScores, dimensionScores, businessCurrentDerived, acquisitionAnswers, ethicsDimensionScores }) {
  const flags = [];

  // HARD RULE — OFERTA (seção 24)
  if (typeof blockScores.offer === 'number' && blockScores.offer < 2.5) {
    flags.push({
      rule: 'acquisition_scaling_blocked',
      area: 'offer',
      blocks: ['acquisition'],
      evidence: { source: 'SCORE_OFFER', field: 'offer_score', value: blockScores.offer },
      message: 'A oferta ainda não está clara/forte o suficiente — escalar aquisição agora amplificaria um problema de oferta.',
    });
  }

  // HARD RULE — PÚBLICO (seção 25)
  if (typeof blockScores.audience === 'number' && blockScores.audience < 2.5) {
    flags.push({
      rule: 'reduce_priority_acquisition',
      area: 'audience',
      blocks: ['acquisition'],
      evidence: { source: 'SCORE_AUDIENCE', field: 'audience_score', value: blockScores.audience },
      message: 'O público prioritário ainda não está claro o suficiente para orientar aquisição com eficiência.',
    });
  }

  // HARD RULE — POSICIONAMENTO (seção 26)
  if (
    typeof blockScores.positioning === 'number' &&
    blockScores.positioning < 2.5 &&
    typeof blockScores.communication === 'number' &&
    blockScores.communication < 2.5
  ) {
    flags.push({
      rule: 'positioning_before_more_content',
      area: 'positioning',
      blocks: ['communication'],
      evidence: [
        { source: 'SCORE_POSITIONING', field: 'positioning_score', value: blockScores.positioning },
        { source: 'SCORE_COMMUNICATION', field: 'communication_score', value: blockScores.communication },
      ],
      message: 'Antes de aumentar o volume de conteúdo, o posicionamento precisa ficar mais claro — produzir mais agora não resolve o problema de direção.',
    });
  }

  // HARD RULE — VENDAS (seção 27)
  if (
    typeof blockScores.acquisition === 'number' &&
    blockScores.acquisition >= 3 &&
    typeof blockScores.sales === 'number' &&
    blockScores.sales < 2.5
  ) {
    flags.push({
      rule: 'sales_priority_up_acquisition_priority_down',
      area: 'sales',
      blocks: ['sales', 'acquisition'],
      evidence: [
        { source: 'SCORE_ACQUISITION', field: 'acquisition_score', value: blockScores.acquisition },
        { source: 'SCORE_SALES', field: 'sales_score', value: blockScores.sales },
      ],
      message: 'Existe volume adequado de aquisição, mas a conversão comercial está fraca — vendas merece prioridade antes de ampliar aquisição.',
    });
  }

  // HARD RULE — CAPACIDADE (seção 28)
  const occupancyRate = businessCurrentDerived && businessCurrentDerived.occupancy_rate;
  if (typeof occupancyRate === 'number' && occupancyRate >= 85) {
    flags.push({
      rule: 'investigate_before_acquisition_scale',
      area: 'operations',
      blocks: ['pricing', 'operations'],
      evidence: { source: 'DERIVED_OCCUPANCY_RATE', field: 'occupancy_rate', value: occupancyRate },
      message: 'A ocupação já está próxima do limite — antes de ampliar aquisição, vale investigar precificação, operação e capacidade.',
    });
  }

  // HARD RULE — AUTOMAÇÃO (seção 29)
  const processStandardizationScore = dimensionScores.operations && dimensionScores.operations.process_standardization_score;
  if (typeof processStandardizationScore === 'number' && processStandardizationScore < 2.5) {
    flags.push({
      rule: 'complex_automation_blocked',
      area: 'operations',
      blocks: ['automation'],
      evidence: { source: 'DIMENSION_OPERATIONS', field: 'process_standardization_score', value: processStandardizationScore },
      message: 'O processo ainda não está padronizado o suficiente — automação complexa agora só aceleraria uma bagunça.',
    });
  }

  // HARD RULE — ÉTICA (seção 30). ethics_risk aproximado pela segurança de
  // comunicação/controle de exposição do Bloco 13; external_exposure
  // aproximado por tráfego pago ativo no Bloco 8.
  const communicationSafety = ethicsDimensionScores && ethicsDimensionScores.communication_safety_score;
  const riskExposureControl = ethicsDimensionScores && ethicsDimensionScores.risk_exposure_control_score;
  const ethicsRiskHigh =
    (typeof communicationSafety === 'number' && communicationSafety < 2.5) ||
    (typeof riskExposureControl === 'number' && riskExposureControl < 2.5);
  const paidTrafficActive = acquisitionAnswers && ACTIVE_PAID_TRAFFIC.includes(acquisitionAnswers.paid_traffic_status);
  if (ethicsRiskHigh && paidTrafficActive) {
    flags.push({
      rule: 'review_before_scaling',
      area: 'ethics',
      blocks: ['acquisition', 'communication'],
      evidence: [
        { source: 'DIMENSION_ETHICS', field: 'communication_safety_score', value: communicationSafety },
        { source: 'DIMENSION_ETHICS', field: 'risk_exposure_control_score', value: riskExposureControl },
        { source: 'B08_paid_traffic_status', field: 'paid_traffic_status', value: acquisitionAnswers && acquisitionAnswers.paid_traffic_status },
      ],
      message: 'Existe exposição ampliada por anúncios combinada com pouca segurança na comunicação profissional — revisar antes de escalar mídia.',
    });
  }

  return flags;
}

module.exports = { evaluateHardRules, HAS_AD_SPEND, ACTIVE_PAID_TRAFFIC };
