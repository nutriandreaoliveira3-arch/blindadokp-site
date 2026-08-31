// BLOCO 14 — EXPERIÊNCIA, RETENÇÃO E RENOVAÇÃO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 14 — EXPERIÊNCIA, RETENÇÃO E
// RENOVAÇÃO"). Objetivo: entender o que acontece depois da compra e se o
// negócio transforma resultado e satisfação em continuidade, renovação e
// indicação.

const VALUE_TRACKING_OPTIONS = [
  { value: 'acompanhamento_estruturado', label: 'Faço acompanhamento estruturado' },
  { value: 'pesquisa_satisfacao', label: 'Realizo pesquisa de satisfação' },
  { value: 'pergunto_durante_atendimento', label: 'Pergunto diretamente durante o atendimento' },
  { value: 'observo_resultados_evolucao', label: 'Observo resultados ou evolução' },
  { value: 'feedback_espontaneo', label: 'Recebo feedback espontâneo' },
  { value: 'so_percebo_quando_reclama', label: 'Só percebo quando o cliente reclama' },
  { value: 'nao_acompanho_forma_definida', label: 'Não acompanho de forma definida' },
  { value: 'outro', label: 'Outro' },
];

const END_OF_JOURNEY_OPTIONS = [
  { value: 'etapa_formal_encerramento', label: 'Existe uma etapa formal de encerramento' },
  { value: 'avaliamos_resultados_proximos_passos', label: 'Avaliamos resultados e próximos passos' },
  { value: 'apresento_continuidade', label: 'Apresento possibilidade de continuidade' },
  { value: 'cliente_renova_quando_sente_necessidade', label: 'O cliente renova quando sente necessidade' },
  { value: 'simply_ends', label: 'O atendimento simplesmente termina' },
  { value: 'continuamos_contato_informalmente', label: 'Continuamos em contato informalmente' },
  { value: 'depends_on_client', label: 'Depende muito do cliente' },
  { value: 'outro', label: 'Outro' },
];

const REAL_NEXT_NEED_OPTIONS = [
  { value: 'sim_continuidade_natural', label: 'Sim, existe uma continuidade natural' },
  { value: 'sim_manutencao_acompanhamento', label: 'Sim, existe manutenção/acompanhamento' },
  { value: 'sim_necessidade_avancada', label: 'Sim, surge uma necessidade mais avançada' },
  { value: 'as_vezes', label: 'Às vezes' },
  { value: 'nao_existe_necessidade_clara', label: 'Não existe necessidade clara' },
  { value: 'nunca_analisei', label: 'Nunca analisei isso' },
];

const RETENTION_AWARENESS_OPTIONS = [
  { value: 'acompanho_claramente', label: 'Sim, acompanho claramente os motivos' },
  { value: 'boa_percepcao', label: 'Tenho uma boa percepção' },
  { value: 'sei_apenas_alguns_motivos', label: 'Sei apenas alguns motivos' },
  { value: 'only_when_customer_mentions', label: 'Normalmente descubro quando o cliente comenta' },
  { value: 'not_tracking', label: 'Não acompanho' },
  { value: 'no_renewal_model', label: 'Meu serviço normalmente não possui renovação' },
];

const RETENTION_CHURN_REASONS_OPTIONS = [
  { value: 'resultado_percebido', label: 'Resultado percebido' },
  { value: 'bom_acompanhamento', label: 'Bom acompanhamento' },
  { value: 'confianca', label: 'Confiança' },
  { value: 'necessidade_continuidade', label: 'Necessidade de continuidade' },
  { value: 'preco', label: 'Preço' },
  { value: 'falta_de_tempo', label: 'Falta de tempo' },
  { value: 'mudanca_prioridade', label: 'Mudança de prioridade' },
  { value: 'nao_percebeu_valor_suficiente', label: 'Não percebeu valor suficiente' },
  { value: 'experiencia_atendimento', label: 'Experiência/atendimento' },
  { value: 'concluiu_o_objetivo', label: 'Concluiu o objetivo' },
  { value: 'outro', label: 'Outro' },
];

const REFERRAL_OPTIONS = [
  { value: 'processo_estruturado', label: 'Existe um processo estruturado para pedir ou facilitar indicações' },
  { value: 'peco_indicacao_alguns_momentos', label: 'Peço indicação em alguns momentos' },
  { value: 'indicacoes_espontaneas', label: 'As indicações acontecem espontaneamente' },
  { value: 'recebo_poucas_indicacoes', label: 'Recebo poucas indicações' },
  { value: 'nunca_pensei_estruturar', label: 'Nunca pensei em estruturar isso' },
  { value: 'nao_considero_relevante', label: 'Não considero indicação relevante para meu negócio' },
];

const POST_PURCHASE_METRICS_OPTIONS = [
  { value: 'satisfacao', label: 'Satisfação' },
  { value: 'evolucao_resultados', label: 'Evolução/resultados' },
  { value: 'engajamento_participacao', label: 'Engajamento/participação' },
  { value: 'renovacao', label: 'Renovação' },
  { value: 'cancelamentos', label: 'Cancelamentos' },
  { value: 'motivos_de_saida', label: 'Motivos de saída' },
  { value: 'indicacoes', label: 'Indicações' },
  { value: 'compras_futuras', label: 'Compras futuras' },
  { value: 'tempo_de_permanencia', label: 'Tempo de permanência' },
  { value: 'valor_total_gerado_por_cliente', label: 'Valor total gerado por cliente' },
  { value: 'nao_acompanho_indicadores', label: 'Não acompanho indicadores pós-compra' },
  { value: 'outro', label: 'Outro' },
];

const SHOW_NEXT_NEED_DESCRIPTION = ['sim_continuidade_natural', 'sim_manutencao_acompanhamento', 'sim_necessidade_avancada', 'as_vezes'];
const SHOW_CHURN_REASONS = ['acompanho_claramente', 'boa_percepcao', 'sei_apenas_alguns_motivos'];
const NO_CLEAR_NEXT_NEED = ['nao_existe_necessidade_clara', 'nunca_analisei'];
const DISAPPEARING_JOURNEY = ['simply_ends', 'depends_on_client'];
const LOW_RETENTION_AWARENESS = ['not_tracking', 'only_when_customer_mentions'];

const QUESTIONS = [
  {
    id: 'q1_percepcao_valor',
    title: 'Percepção de valor e satisfação',
    content: 'Como você verifica se o cliente está satisfeito e percebendo valor durante ou depois da entrega? Até 3 opções.',
    fields: [
      { id: 'customer_value_tracking_methods', label: 'Como você verifica', type: 'multiselect', options: VALUE_TRACKING_OPTIONS, required: true, maxSelect: 3 },
      {
        id: 'customer_value_tracking_methods_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'customer_value_tracking_methods', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q2_final_entrega',
    title: 'O que acontece no final',
    content: 'Quando a entrega principal termina, o que normalmente acontece?',
    fields: [
      { id: 'customer_end_of_journey_process', label: 'O que acontece', type: 'select', options: END_OF_JOURNEY_OPTIONS, required: true },
      {
        id: 'customer_end_of_journey_process_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'customer_end_of_journey_process', equals: 'outro' },
      },
    ],
  },
  {
    id: 'q3_proxima_necessidade',
    title: 'Próxima necessidade real',
    content: 'Depois de concluir sua oferta principal, seu cliente normalmente apresenta alguma nova necessidade que você poderia continuar ajudando a resolver?',
    fields: [
      { id: 'real_next_customer_need', label: 'Existe próxima necessidade?', type: 'select', options: REAL_NEXT_NEED_OPTIONS, required: true },
      {
        id: 'next_customer_need_description',
        label: 'Qual costuma ser essa próxima necessidade?',
        type: 'text',
        required: false,
        conditional: { field: 'real_next_customer_need', oneOf: SHOW_NEXT_NEED_DESCRIPTION },
      },
    ],
  },
  {
    id: 'q4_renovacao',
    title: 'Renovação e cancelamento',
    content: 'Você sabe por que os clientes continuam, renovam ou deixam de continuar com você?',
    fields: [
      { id: 'retention_reason_awareness', label: 'Você acompanha os motivos?', type: 'select', options: RETENTION_AWARENESS_OPTIONS, required: true },
      {
        id: 'retention_and_churn_reasons',
        label: 'Quais motivos aparecem com mais frequência? Até 3 opções.',
        type: 'multiselect',
        options: RETENTION_CHURN_REASONS_OPTIONS,
        required: false,
        maxSelect: 3,
        conditional: { field: 'retention_reason_awareness', oneOf: SHOW_CHURN_REASONS },
      },
      {
        id: 'retention_and_churn_reasons_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'retention_and_churn_reasons', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q5_indicacoes',
    title: 'Indicações',
    content: 'Como as indicações acontecem hoje?',
    fields: [
      { id: 'referral_process_maturity', label: 'Como acontecem', type: 'select', options: REFERRAL_OPTIONS, required: true },
    ],
  },
  {
    id: 'q6_acompanhamento',
    title: 'O que é acompanhado depois da compra',
    content: 'Quais informações você acompanha depois que uma pessoa se torna cliente?',
    fields: [
      { id: 'post_purchase_metrics', label: 'Informações acompanhadas', type: 'multiselect', options: POST_PURCHASE_METRICS_OPTIONS, required: true },
      {
        id: 'post_purchase_metrics_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'post_purchase_metrics', includes: 'outro' },
      },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 14 (seções 5, 6, 9,
// 13). As 7 dimensões de score (seção 12), a REGRA 04 (cruzamento com
// acquisition_pressure do Bloco 8 e retention_score deste próprio bloco), a
// REGRA 05 (customer_experience_score/referral_score, ambos qualitativos) e
// a REGRA 08 (renewal_process, campo não coletado aqui) dependem de dados
// não disponíveis nas respostas brutas deste bloco — ficam para o Motor de
// IA. A REGRA 06 (new_offer_idea) depende de um campo de outro contexto
// (ideia de nova oferta) que este bloco não coleta.
function analyze(answers) {
  const valueTrackingMethods = Array.isArray(answers.customer_value_tracking_methods) ? answers.customer_value_tracking_methods : [];
  const churnReasons = Array.isArray(answers.retention_and_churn_reasons) ? answers.retention_and_churn_reasons : [];
  const postPurchaseMetrics = Array.isArray(answers.post_purchase_metrics) ? answers.post_purchase_metrics : [];

  // continuity_potential (seção 9) é derivado diretamente da Pergunta 3, que
  // é literalmente a pergunta que mede essa dimensão.
  let continuityPotential = null;
  if (['sim_continuidade_natural', 'sim_manutencao_acompanhamento', 'sim_necessidade_avancada'].includes(answers.real_next_customer_need)) {
    continuityPotential = 'high';
  } else if (answers.real_next_customer_need === 'as_vezes') {
    continuityPotential = 'medium';
  } else if (NO_CLEAR_NEXT_NEED.includes(answers.real_next_customer_need)) {
    continuityPotential = 'low';
  }

  const derived = {
    customer_value_tracking_methods: valueTrackingMethods,
    customer_end_of_journey_process: answers.customer_end_of_journey_process || null,
    real_next_customer_need: answers.real_next_customer_need || null,
    continuity_potential: continuityPotential,
    retention_reason_awareness: answers.retention_reason_awareness || null,
    retention_and_churn_reasons: churnReasons,
    referral_process_maturity: answers.referral_process_maturity || null,
    post_purchase_metrics: postPurchaseMetrics,
    post_purchase_metrics_count: postPurchaseMetrics.length,
    // Seção 5, REGRA CENTRAL da Pergunta 3.
    do_not_create_recurring_offer: NO_CLEAR_NEXT_NEED.includes(answers.real_next_customer_need),
    // Seção 6, REGRA da Pergunta 4.
    healthy_exit_possible: churnReasons.includes('concluiu_o_objetivo'),
  };

  const redFlags = [];

  // Seção 4, Pergunta 2 — regra dada literalmente na especificação.
  if (answers.customer_end_of_journey_process === 'simply_ends') {
    redFlags.push({
      rule: 'fim_sem_estrutura',
      type: 'OPORTUNIDADE',
      message: 'A experiência termina sem uma etapa clara de fechamento, avaliação ou definição do próximo passo.',
    });
  }

  // Seção 13, REGRA 01.
  if (DISAPPEARING_JOURNEY.includes(answers.customer_end_of_journey_process) && (continuityPotential === 'high' || continuityPotential === 'medium')) {
    redFlags.push({
      rule: 'cliente_desaparece_apos_entrega',
      type: 'OPORTUNIDADE',
      message: 'Existe uma necessidade de continuidade potencial, mas a jornada atual termina sem um próximo passo estruturado.',
    });
  }

  // Seção 13, REGRA 02.
  if (LOW_RETENTION_AWARENESS.includes(answers.retention_reason_awareness)) {
    redFlags.push({
      rule: 'pouca_visibilidade_motivos_saida',
      type: 'ALERTA',
      message: 'O negócio ainda possui pouca visibilidade sobre os motivos que levam clientes a continuar ou encerrar a relação.',
    });
  }

  // Seção 13, REGRA 03.
  const onlyComplaints = valueTrackingMethods.length === 1 && valueTrackingMethods[0] === 'so_percebo_quando_reclama';
  if (valueTrackingMethods.length === 0 || onlyComplaints) {
    redFlags.push({
      rule: 'sem_medir_satisfacao',
      type: 'OPORTUNIDADE',
      message: 'Problemas de experiência podem estar sendo percebidos apenas quando o cliente já demonstra insatisfação.',
    });
  }

  // Seção 13, REGRA 07.
  if (churnReasons.includes('nao_percebeu_valor_suficiente')) {
    redFlags.push({
      rule: 'cancelamento_por_falta_de_valor',
      type: 'ALERTA',
      message: 'Parte dos cancelamentos pode estar relacionada não apenas ao resultado entregue, mas à forma como o valor é percebido durante a experiência.',
      cross_with: ['offer', 'operations', 'communication'],
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'retention', questions: QUESTIONS, analyze };
