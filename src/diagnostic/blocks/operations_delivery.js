// BLOCO 10 — OPERAÇÃO E ENTREGA
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 10 — OPERAÇÃO E ENTREGA").
// Objetivo: identificar onde o negócio perde tempo, quais etapas dependem
// excessivamente do profissional, onde existe repetição/retrabalho e se a
// operação consegue crescer mantendo qualidade.

const JOURNEY_MATURITY_OPTIONS = [
  { value: 'defined', label: 'Existe uma jornada bem definida' },
  { value: 'some_organized', label: 'Algumas etapas são organizadas' },
  { value: 'intuitive', label: 'Acontece de forma mais intuitiva' },
  { value: 'different_each_client', label: 'Cada cliente recebe de um jeito diferente' },
];

const TIME_CONSUMING_TASKS_OPTIONS = [
  { value: 'atendimento_direto', label: 'Atendimento direto' },
  { value: 'preparacao_atendimento', label: 'Preparação antes do atendimento' },
  { value: 'criacao_materiais', label: 'Criação de materiais' },
  { value: 'suporte_whatsapp', label: 'Suporte/WhatsApp' },
  { value: 'organizacao_informacoes', label: 'Organização de informações' },
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'relatorios_registros', label: 'Relatórios/registros' },
  { value: 'cobrancas_pagamentos', label: 'Cobranças/pagamentos' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'tarefas_administrativas', label: 'Tarefas administrativas' },
  { value: 'outro', label: 'Outro' },
];

const REWORK_BOTTLENECKS_OPTIONS = [
  { value: 'entrada_cliente', label: 'Entrada do cliente' },
  { value: 'coleta_informacoes', label: 'Coleta de informações' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'preparacao_materiais', label: 'Preparação de materiais' },
  { value: 'pagamentos_cobrancas', label: 'Pagamentos/cobranças' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'organizacao_documentos', label: 'Organização de documentos/dados' },
  { value: 'nenhum_problema_relevante', label: 'Não percebo problema relevante' },
  { value: 'outro', label: 'Outro' },
];

const PROCESS_DOCUMENTATION_OPTIONS = [
  { value: 'most_organized', label: 'Sim, praticamente tudo que se repete está organizado' },
  { value: 'some_processes', label: 'Tenho processos para algumas atividades' },
  { value: 'loose_materials', label: 'Tenho materiais soltos, mas não um processo definido' },
  { value: 'none', label: 'Não tenho processos ou modelos estruturados' },
];

const DOUBLE_CLIENT_CAPACITY_OPTIONS = [
  { value: 'no_change', label: 'Sim, sem grandes mudanças' },
  { value: 'minor_adjustments', label: 'Sim, com pequenos ajustes' },
  { value: 'overload', label: 'Provavelmente geraria sobrecarga' },
  { value: 'cannot_support', label: 'Não conseguiria' },
  { value: 'unsure', label: 'Não sei avaliar' },
];

const JOURNEY_MATURITY_ALLOWS_STEPS = ['defined', 'some_organized'];
const OVERLOAD_CAPACITY = ['overload', 'cannot_support'];
const ACQUISITION_PRIORITY_GOALS = ['mais_clientes', 'faturamento'];

const QUESTIONS = [
  {
    id: 'q1_jornada',
    title: 'Jornada de entrega',
    content: 'Como acontece a entrega do seu serviço depois que o cliente compra?',
    fields: [
      { id: 'delivery_journey_maturity', label: 'Jornada de entrega', type: 'select', options: JOURNEY_MATURITY_OPTIONS, required: true },
      {
        id: 'delivery_main_steps',
        label: 'Quais são as principais etapas?',
        type: 'text',
        required: false,
        conditional: { field: 'delivery_journey_maturity', oneOf: JOURNEY_MATURITY_ALLOWS_STEPS },
      },
    ],
  },
  {
    id: 'q2_tempo',
    title: 'Maior consumo de tempo',
    content: 'O que mais consome seu tempo durante a entrega? Selecione até 3.',
    fields: [
      { id: 'delivery_time_consuming_tasks', label: 'Atividades', type: 'multiselect', options: TIME_CONSUMING_TASKS_OPTIONS, required: true, maxSelect: 3 },
      {
        id: 'delivery_time_consuming_tasks_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'delivery_time_consuming_tasks', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q3_expertise',
    title: 'O que realmente precisa do profissional',
    content:
      'Quais atividades da entrega realmente dependem da sua expertise e não poderiam ser realizadas por outra pessoa ou sistema sem comprometer a qualidade? Pense nas decisões, análises ou interações em que sua experiência profissional é indispensável.',
    fields: [
      { id: 'expertise_critical_tasks', label: 'Atividades que dependem de você', type: 'textarea', required: true },
    ],
  },
  {
    id: 'q4_retrabalho',
    title: 'Atraso, repetição e retrabalho',
    content: 'Onde mais acontecem atrasos, repetição de tarefas ou retrabalho hoje? Selecione até 3.',
    fields: [
      { id: 'rework_bottlenecks', label: 'Gargalos', type: 'multiselect', options: REWORK_BOTTLENECKS_OPTIONS, required: true, maxSelect: 3 },
      {
        id: 'rework_bottlenecks_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'rework_bottlenecks', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q5_processos',
    title: 'Processos e modelos',
    content: 'Você já possui processos, checklists ou modelos prontos para atividades que se repetem?',
    fields: [
      { id: 'process_documentation_level', label: 'Nível de organização', type: 'select', options: PROCESS_DOCUMENTATION_OPTIONS, required: true },
    ],
  },
  {
    id: 'q6_dobrar',
    title: 'Capacidade de dobrar',
    content: 'Se o número de clientes dobrasse hoje, sua operação conseguiria manter a qualidade?',
    fields: [
      { id: 'double_client_capacity', label: 'Capacidade de dobrar', type: 'select', options: DOUBLE_CLIENT_CAPACITY_OPTIONS, required: true },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 10 (seções 6, 7 e 8).
// As 6 dimensões de score (seções 11-12) e as REGRAS 01, 02, 03, 05 e 06
// (seção 13) dependem de julgamento qualitativo da Blindada Pro sobre a
// própria entrega (padronização, eficiência, independência operacional
// etc.) ou de classificação semântica de texto livre — não têm fórmula
// determinística dada na especificação, ficam para o Motor de IA. A REGRA
// 04 (múltiplas tarefas administrativas) também não é implementada aqui:
// a especificação não define qual subconjunto das 11 opções conta como
// "administrativa" nem o limiar de "múltiplas", e isso não deve ser
// inventado.
function analyze(answers, context) {
  const derived = {
    delivery_journey_maturity: answers.delivery_journey_maturity || null,
    process_documentation_level: answers.process_documentation_level || null,
    double_client_capacity: answers.double_client_capacity || null,
  };

  const redFlags = [];

  const reworkTasks = Array.isArray(answers.rework_bottlenecks) ? answers.rework_bottlenecks : [];
  derived.rework_bottlenecks_count = reworkTasks.length;

  // Seção 6, Pergunta 4 — regra dada literalmente na especificação.
  if (
    reworkTasks.length >= 3 &&
    ['intuitive', 'different_each_client'].includes(answers.delivery_journey_maturity)
  ) {
    redFlags.push({
      rule: 'retrabalho_sem_padronizacao',
      type: 'ALERTA',
      message: 'Existem sinais de retrabalho associados à falta de padronização da operação.',
    });
  }

  // Seção 7, Pergunta 5 — regra dada literalmente na especificação.
  if (answers.process_documentation_level === 'none') {
    derived.automation_priority_modifier = 'reduced';
    derived.process_standardization_priority = 'increased';
  }

  // Seção 8, Pergunta 6 — regra dada literalmente na especificação, cruzando
  // com o objetivo de 12 meses do Bloco 1 (business_current) como sinal de
  // aquisição sendo tratada como prioridade.
  const businessCurrentAnswers = (context && context.business_current) || {};
  const acquisitionIsPriority = ACQUISITION_PRIORITY_GOALS.includes(businessCurrentAnswers.twelve_month_goal);
  if (OVERLOAD_CAPACITY.includes(answers.double_client_capacity) && acquisitionIsPriority) {
    redFlags.push({
      rule: 'crescimento_sem_capacidade_operacional',
      type: 'ALERTA',
      message:
        'A operação ainda não está preparada para absorver um crescimento significativo sem ampliar sobrecarga ou risco de perda de qualidade.',
      cross_with: ['business_current', 'operations'],
    });
  }

  // Cruzamento com Bloco 1 (occupancy_rate) — mesma fórmula usada em
  // business_current.js, recalculada aqui porque o contexto só expõe
  // respostas brutas dos outros blocos, não os dados derivados deles.
  const currentClients = Number(businessCurrentAnswers.current_clients_month);
  const maxClients = Number(businessCurrentAnswers.max_clients_capacity);
  if (Number.isFinite(currentClients) && Number.isFinite(maxClients) && maxClients > 0) {
    derived.business_occupancy_rate = Math.round((currentClients / maxClients) * 100 * 10) / 10;
  }

  return { derived, redFlags };
}

module.exports = { id: 'operations', questions: QUESTIONS, analyze };
