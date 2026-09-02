// BLOCO 15 — GESTÃO, MÉTRICAS E TOMADA DE DECISÃO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 15 — GESTÃO, MÉTRICAS E TOMADA
// DE DECISÃO"). Último bloco do Diagnóstico 360: entender se a cliente
// decide com base em dados ou percepção, quais indicadores já acompanha e
// quais métricas ela gostaria de ver num painel essencial.

const HEALTH_TRACKING_OPTIONS = [
  { value: 'painel_sistema_indicadores', label: 'Tenho painel ou sistema com indicadores' },
  { value: 'planilhas_organizadas', label: 'Uso planilhas organizadas' },
  { value: 'alguns_numeros_separadamente', label: 'Acompanho alguns números separadamente' },
  { value: 'faturamento_e_saldo', label: 'Olho principalmente faturamento e saldo' },
  { value: 'quantidade_clientes_movimento', label: 'Avalio pela quantidade de clientes/movimento' },
  { value: 'percepcao', label: 'Decido mais pela percepção' },
  { value: 'sem_forma_definida', label: 'Não tenho uma forma definida de acompanhar' },
];

const TRACKED_METRICS_OPTIONS = [
  { value: 'faturamento', label: 'Faturamento' },
  { value: 'numero_clientes', label: 'Número de clientes' },
  { value: 'ticket_medio', label: 'Ticket médio' },
  { value: 'leads_contatos', label: 'Leads/contatos interessados' },
  { value: 'conversao_vendas', label: 'Conversão em vendas' },
  { value: 'custo_aquisicao', label: 'Custo de aquisição' },
  { value: 'investimento_marketing', label: 'Investimento em marketing' },
  { value: 'margem_lucro', label: 'Margem/lucro' },
  { value: 'renovacao', label: 'Renovação' },
  { value: 'cancelamentos', label: 'Cancelamentos' },
  { value: 'origem_clientes', label: 'Origem dos clientes' },
  { value: 'ocupacao_capacidade', label: 'Ocupação/capacidade' },
  { value: 'tempo_gasto_atividades', label: 'Tempo gasto nas atividades' },
  { value: 'produtividade', label: 'Produtividade' },
  { value: 'indicacoes', label: 'Indicações' },
  { value: 'nenhum_desses', label: 'Nenhum desses' },
  { value: 'outro', label: 'Outro' },
];

const RESULT_ATTRIBUTION_OPTIONS = [
  { value: 'consigo_identificar_com_clareza', label: 'Sim, consigo identificar com clareza' },
  { value: 'boa_nocao', label: 'Tenho uma boa noção' },
  { value: 'identifico_apenas_algumas', label: 'Consigo identificar apenas algumas' },
  { value: 'perception_more_than_data', label: 'Tenho mais percepção do que dados' },
  { value: 'cannot_identify', label: 'Não consigo identificar' },
  { value: 'nao_sei_avaliar', label: 'Não sei avaliar' },
];

const REVIEW_FREQUENCY_OPTIONS = [
  { value: 'semanalmente', label: 'Semanalmente' },
  { value: 'quinzenalmente', label: 'Quinzenalmente' },
  { value: 'mensalmente', label: 'Mensalmente' },
  { value: 'trimestralmente', label: 'A cada trimestre' },
  { value: 'apenas_quando_surge_problema', label: 'Apenas quando surge algum problema' },
  { value: 'raramente', label: 'Raramente' },
  { value: 'nunca_analise_estruturada', label: 'Nunca faço uma análise estruturada' },
];

const DECISION_BOTTLENECK_OPTIONS = [
  { value: 'dados_insuficientes', label: 'Não tenho dados suficientes' },
  { value: 'tenho_dados_mas_nao_sei_interpretar', label: 'Tenho dados, mas não sei interpretar' },
  { value: 'informacoes_espalhadas', label: 'Tenho informações espalhadas em vários lugares' },
  { value: 'nao_sei_quais_numeros_importam', label: 'Não sei quais números realmente importam' },
  { value: 'muitas_ideias_dificuldade_priorizar', label: 'Tenho muitas ideias e dificuldade de priorizar' },
  { value: 'urgencia_do_dia', label: 'Decido mais pela urgência do dia' },
  { value: 'falta_tempo_analisar', label: 'Falta tempo para analisar' },
  { value: 'sem_dificuldade_relevante', label: 'Não tenho dificuldade relevante' },
  { value: 'outro', label: 'Outro' },
];

const DASHBOARD_METRICS_OPTIONS = [
  { value: 'faturamento', label: 'Faturamento' },
  { value: 'novos_clientes', label: 'Novos clientes' },
  { value: 'ticket_medio', label: 'Ticket médio' },
  { value: 'leads', label: 'Leads' },
  { value: 'conversao', label: 'Conversão' },
  { value: 'origem_clientes', label: 'Origem dos clientes' },
  { value: 'cac', label: 'CAC' },
  { value: 'margem', label: 'Margem' },
  { value: 'ocupacao_capacidade', label: 'Ocupação/capacidade' },
  { value: 'horas_trabalhadas', label: 'Horas trabalhadas' },
  { value: 'renovacao', label: 'Renovação' },
  { value: 'cancelamento', label: 'Cancelamento' },
  { value: 'indicacoes', label: 'Indicações' },
  { value: 'outro', label: 'Outro' },
];

// Valores literais dados na especificação para a REGRA da Pergunta 3 e
// REGRA 05 (seções 5 e 17).
const LOW_ATTRIBUTION_LEVELS = ['perception_more_than_data', 'cannot_identify'];

const QUESTIONS = [
  {
    id: 'q1_saude_negocio',
    title: 'Como acompanha a saúde do negócio',
    content: 'Como você acompanha se seu negócio está indo bem ou mal?',
    fields: [
      { id: 'business_health_tracking_method', label: 'Forma de acompanhamento', type: 'select', options: HEALTH_TRACKING_OPTIONS, required: true },
    ],
  },
  {
    id: 'q2_numeros_acompanhados',
    title: 'Quais números acompanha',
    content: 'Quais números você acompanha com alguma frequência hoje?',
    fields: [
      { id: 'tracked_business_metrics', label: 'Números acompanhados', type: 'multiselect', options: TRACKED_METRICS_OPTIONS, required: true },
      {
        id: 'tracked_business_metrics_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'tracked_business_metrics', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q3_atribuicao_resultado',
    title: 'Sabe o que gera resultado?',
    content: 'Hoje você consegue identificar quais ações realmente geram clientes, vendas ou crescimento no seu negócio?',
    fields: [
      { id: 'business_result_attribution_level', label: 'Clareza sobre o que gera resultado', type: 'select', options: RESULT_ATTRIBUTION_OPTIONS, required: true },
    ],
  },
  {
    id: 'q4_frequencia_analise',
    title: 'Frequência de análise',
    content: 'Com que frequência você para para analisar seus números e decidir o que precisa mudar?',
    fields: [
      { id: 'management_review_frequency', label: 'Frequência', type: 'select', options: REVIEW_FREQUENCY_OPTIONS, required: true },
    ],
  },
  {
    id: 'q5_dificuldade_decisao',
    title: 'Maior dificuldade para decidir',
    content: 'Qual é sua maior dificuldade hoje na hora de tomar decisões sobre o negócio?',
    fields: [
      { id: 'decision_making_bottleneck', label: 'Maior dificuldade', type: 'select', options: DECISION_BOTTLENECK_OPTIONS, required: true },
      {
        id: 'decision_making_bottleneck_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'decision_making_bottleneck', equals: 'outro' },
      },
    ],
  },
  {
    id: 'q6_dashboard',
    title: 'Dashboard essencial',
    content: 'Se você pudesse acompanhar apenas 5 números toda semana para entender seu negócio, quais gostaria de ver?',
    fields: [
      { id: 'desired_dashboard_metrics', label: 'Métricas desejadas', type: 'multiselect', options: DASHBOARD_METRICS_OPTIONS, required: true },
      {
        id: 'desired_dashboard_metrics_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'desired_dashboard_metrics', includes: 'outro' },
      },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 15 (seções 5, 9 e
// 13) — último bloco do Diagnóstico 360. As 6 dimensões de score (seção
// 12), a REGRA 02 (precisa de lead_volume_signal de outros blocos), a
// REGRA 03 (revenue_growth_signal e margin_data, não coletados aqui), a
// REGRA 04 (decision_making_score qualitativo) e a REGRA 06
// (data_integration_score qualitativo) dependem de dados que este bloco não
// coleta como campo próprio. A seleção final do "Top 5 Métricas Blindadas"
// (seção 21) cruza os 15 blocos inteiros (gargalos, estágio do negócio,
// objetivo de 12 meses, dados disponíveis) — isso pertence ao motor de
// priorização final, não a este bloco isolado; desired_dashboard_metrics
// fica salvo como a escolha da cliente, não como recomendação final,
// exatamente como a especificação pede.
function analyze(answers) {
  const trackedMetrics = Array.isArray(answers.tracked_business_metrics) ? answers.tracked_business_metrics : [];
  const desiredDashboardMetrics = Array.isArray(answers.desired_dashboard_metrics) ? answers.desired_dashboard_metrics : [];

  const derived = {
    business_health_tracking_method: answers.business_health_tracking_method || null,
    tracked_business_metrics: trackedMetrics,
    tracked_business_metrics_count: trackedMetrics.length,
    business_result_attribution_level: answers.business_result_attribution_level || null,
    management_review_frequency: answers.management_review_frequency || null,
    decision_making_bottleneck: answers.decision_making_bottleneck || null,
    desired_dashboard_metrics: desiredDashboardMetrics,
  };

  const redFlags = [];

  // Seção 5, Pergunta 3 — regra dada literalmente na especificação.
  const lowAttribution = LOW_ATTRIBUTION_LEVELS.includes(answers.business_result_attribution_level);
  if (lowAttribution) {
    redFlags.push({
      rule: 'pouca_clareza_sobre_resultado',
      type: 'ALERTA',
      message:
        'Existe pouca clareza sobre quais ações realmente contribuem para resultado, o que aumenta o risco de investir tempo ou dinheiro nas áreas erradas.',
    });
  }

  // Seção 13, REGRA 01.
  if (trackedMetrics.length === 1 && trackedMetrics[0] === 'faturamento') {
    redFlags.push({
      rule: 'acompanha_apenas_faturamento',
      type: 'ALERTA',
      message:
        'Faturamento mostra o resultado final, mas sozinho não explica o que está gerando crescimento ou perda. Vale buscar indicadores antecedentes como leads, conversão, ticket, capacidade e retenção.',
    });
  }

  // Seção 13, REGRA 05.
  if (answers.business_health_tracking_method === 'percepcao' && lowAttribution) {
    redFlags.push({
      rule: 'gestao_por_sensacao',
      type: 'ALERTA',
      message:
        'Grande parte das decisões está sendo tomada por percepção, sem dados suficientes para confirmar onde estão os principais pontos de ganho ou perda.',
    });
  }

  // Seção 13, REGRA 07.
  if (answers.decision_making_bottleneck === 'urgencia_do_dia') {
    redFlags.push({
      rule: 'decisao_pela_urgencia',
      type: 'ALERTA',
      message:
        'As prioridades podem estar sendo definidas pelo problema mais urgente do dia em vez do gargalo com maior impacto estratégico.',
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'metrics', questions: QUESTIONS, analyze };
