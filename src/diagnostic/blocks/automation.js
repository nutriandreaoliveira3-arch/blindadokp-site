// BLOCO 12 — AUTOMAÇÃO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 12 — AUTOMAÇÃO").
// Objetivo: identificar quais tarefas repetitivas merecem ser automatizadas,
// quais ainda precisam ser organizadas antes, e onde a automação pode
// reduzir tempo/erros sem retirar controles importantes.

const REPETITIVE_TASKS_OPTIONS = [
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'confirmacao_horarios', label: 'Confirmação de horários' },
  { value: 'lembretes', label: 'Lembretes' },
  { value: 'responder_duvidas_recorrentes', label: 'Responder dúvidas recorrentes' },
  { value: 'envio_materiais', label: 'Envio de materiais' },
  { value: 'cobrancas_pagamentos', label: 'Cobranças/pagamentos' },
  { value: 'cadastro_clientes', label: 'Cadastro de clientes' },
  { value: 'coleta_informacoes', label: 'Coleta de informações' },
  { value: 'organizacao_documentos', label: 'Organização de documentos' },
  { value: 'followup_leads', label: 'Follow-up de leads' },
  { value: 'followup_clientes', label: 'Follow-up de clientes' },
  { value: 'atualizacao_planilhas_crm', label: 'Atualização de planilhas/CRM' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'publicacao_distribuicao_conteudo', label: 'Publicação/distribuição de conteúdo' },
  { value: 'outro', label: 'Outro' },
];

const AUTOMATION_MATURITY_OPTIONS = [
  { value: 'several_working', label: 'Sim, várias automações funcionando bem' },
  { value: 'some_working', label: 'Tenho algumas automações' },
  { value: 'with_failures', label: 'Tenho automações, mas apresentam falhas' },
  { value: 'abandoned', label: 'Já tentei implementar, mas abandonei' },
  { value: 'none', label: 'Não tenho automações' },
  { value: 'unsure', label: 'Não sei o que poderia automatizar' },
];

const EXISTING_AUTOMATION_AREAS_OPTIONS = [
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'crm', label: 'CRM' },
  { value: 'cobranca', label: 'Cobrança' },
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'marketing_conteudo', label: 'Marketing/conteúdo' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'gestao_interna', label: 'Gestão interna' },
  { value: 'outro', label: 'Outro' },
];

const TIME_RANGE_OPTIONS = [
  { value: 'menos_30min', label: 'Menos de 30 min por semana' },
  { value: '30min_2h', label: '30 min–2h' },
  { value: '2_5h', label: '2–5h' },
  { value: '5_10h', label: '5–10h' },
  { value: 'mais_10h', label: 'Mais de 10h' },
  { value: 'nao_sei_estimar', label: 'Não sei estimar' },
];

const CURRENT_SYSTEMS_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'google_agenda', label: 'Google Agenda' },
  { value: 'planilhas', label: 'Planilhas' },
  { value: 'crm', label: 'CRM' },
  { value: 'sistema_gestao', label: 'Sistema de gestão' },
  { value: 'plataforma_pagamentos', label: 'Plataforma de pagamentos' },
  { value: 'plataforma_agendamento', label: 'Plataforma de agendamento' },
  { value: 'site_formularios', label: 'Site/formulários' },
  { value: 'ferramentas_ia', label: 'Ferramentas de IA' },
  { value: 'automacao_make_zapier_n8n', label: 'Automação como Make/Zapier/n8n' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_utilizo_sistemas', label: 'Não utilizo sistemas organizados' },
];

const CONTROL_PREFERENCE_OPTIONS = [
  { value: 'aprovar_quase_tudo', label: 'Quero aprovar praticamente tudo' },
  { value: 'aprovar_tarefas_importantes', label: 'Quero aprovação apenas em tarefas importantes' },
  { value: 'tarefas_simples_automaticas', label: 'Tarefas simples podem acontecer automaticamente' },
  { value: 'maxima_automacao_baixo_risco', label: 'Prefiro máxima automação quando o risco for baixo' },
  { value: 'nao_sei_avaliar', label: 'Não sei avaliar' },
];

const PRIMARY_OUTCOME_OPTIONS = [
  { value: 'economizar_tempo', label: 'Economizar tempo' },
  { value: 'reduzir_tarefas_manuais', label: 'Reduzir tarefas manuais' },
  { value: 'evitar_esquecimentos', label: 'Evitar esquecimentos' },
  { value: 'reduzir_erros', label: 'Reduzir erros' },
  { value: 'responder_mais_rapido', label: 'Responder mais rápido' },
  { value: 'organizar_clientes_leads', label: 'Organizar melhor clientes/leads' },
  { value: 'melhorar_acompanhamento', label: 'Melhorar acompanhamento' },
  { value: 'aumentar_capacidade_operacional', label: 'Aumentar capacidade operacional' },
  { value: 'integrar_ferramentas', label: 'Integrar ferramentas' },
  { value: 'reduzir_dependencia_de_mim', label: 'Reduzir dependência de mim' },
  { value: 'outro', label: 'Outro' },
];

const HAS_AUTOMATIONS = ['several_working', 'some_working', 'with_failures'];

// Mapeamento literal do significado de cada opção da Pergunta 2 pra
// automation_reliability (dado derivado citado na seção 4 da
// especificação, sem pergunta própria). Só classifica quando a opção
// escolhida afirma claramente o resultado — "algumas automações" (sem
// qualificação) fica sem classificação, não é inventado.
const AUTOMATION_RELIABILITY_MAP = {
  several_working: 'reliable',
  with_failures: 'unreliable',
  abandoned: 'unreliable',
};

const QUESTIONS = [
  {
    id: 'q1_tarefas',
    title: 'Tarefas repetitivas',
    content: 'Quais tarefas você ou sua equipe repetem com frequência no dia a dia?',
    fields: [
      { id: 'repetitive_tasks', label: 'Tarefas', type: 'multiselect', options: REPETITIVE_TASKS_OPTIONS, required: true },
      {
        id: 'repetitive_tasks_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'repetitive_tasks', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q2_automacoes',
    title: 'Automações já existentes',
    content: 'Você já possui alguma automação funcionando no negócio?',
    fields: [
      { id: 'automation_maturity', label: 'Situação atual', type: 'select', options: AUTOMATION_MATURITY_OPTIONS, required: true },
      {
        id: 'existing_automations',
        label: 'Em quais áreas?',
        type: 'multiselect',
        options: EXISTING_AUTOMATION_AREAS_OPTIONS,
        required: false,
        conditional: { field: 'automation_maturity', oneOf: HAS_AUTOMATIONS },
      },
      {
        id: 'existing_automations_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'existing_automations', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q3_maior_perda',
    title: 'Maior perda de tempo repetitiva',
    content: 'Qual tarefa repetitiva mais consome seu tempo ou o tempo da equipe hoje? E quanto tempo ela consome aproximadamente?',
    fields: [
      { id: 'highest_cost_repetitive_task', label: 'Tarefa', type: 'select', options: REPETITIVE_TASKS_OPTIONS, required: true },
      {
        id: 'highest_cost_repetitive_task_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'highest_cost_repetitive_task', equals: 'outro' },
      },
      { id: 'repetitive_task_time_range', label: 'Tempo consumido', type: 'select', options: TIME_RANGE_OPTIONS, required: true },
    ],
  },
  {
    id: 'q4_sistemas',
    title: 'Sistemas utilizados',
    content: 'Quais sistemas ou ferramentas fazem parte da sua operação hoje?',
    fields: [
      { id: 'current_systems', label: 'Sistemas', type: 'multiselect', options: CURRENT_SYSTEMS_OPTIONS, required: true },
    ],
  },
  {
    id: 'q5_controle',
    title: 'Nível de controle desejado',
    content: 'Quando uma tarefa é automatizada, quanto controle você gostaria de manter antes que a ação seja executada?',
    fields: [
      { id: 'automation_control_preference', label: 'Controle desejado', type: 'select', options: CONTROL_PREFERENCE_OPTIONS, required: true },
    ],
  },
  {
    id: 'q6_resultado',
    title: 'Resultado desejado',
    content: 'Qual seria o principal resultado que você gostaria de obter com automação?',
    fields: [
      { id: 'primary_automation_outcome', label: 'Principal resultado', type: 'select', options: PRIMARY_OUTCOME_OPTIONS, required: true },
      {
        id: 'primary_automation_outcome_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'primary_automation_outcome', equals: 'outro' },
      },
    ],
  },
];

// Dados derivados do Bloco 12 (seção 9). Nenhuma das 7 REGRAS da
// especificação (seção 14) é implementada aqui: todas dependem de dados que
// este bloco não coleta como campo próprio — scores qualitativos de outros
// blocos (process_standardization_score do Bloco 10, system_integration_score
// deste próprio bloco), avaliação por tarefa individual (frequency,
// repetitiveness, professional_judgment_required, risk, monitoring,
// business_impact, implementation_complexity, operational_impact) ou
// limiares não definidos ("current_systems_count is high"). Nada disso é
// inventado — fica para o Motor de IA, que vai cruzar essas respostas com
// os outros blocos e com o julgamento qualitativo necessário.
function analyze(answers) {
  const repetitiveTasks = Array.isArray(answers.repetitive_tasks) ? answers.repetitive_tasks : [];
  const currentSystems = Array.isArray(answers.current_systems) ? answers.current_systems : [];
  const existingAutomations = Array.isArray(answers.existing_automations) ? answers.existing_automations : [];

  const derived = {
    automation_maturity: answers.automation_maturity || null,
    automation_control_preference: answers.automation_control_preference || null,
    primary_automation_outcome: answers.primary_automation_outcome || null,
    repetitive_tasks: repetitiveTasks,
    repetitive_tasks_count: repetitiveTasks.length,
    current_systems_count: currentSystems.length,
    existing_automations: existingAutomations,
    automation_reliability: AUTOMATION_RELIABILITY_MAP[answers.automation_maturity] || null,
    highest_cost_repetitive_task: answers.highest_cost_repetitive_task || null,
    repetitive_task_time_range: answers.repetitive_task_time_range || null,
  };

  return { derived, redFlags: [] };
}

module.exports = { id: 'automation', questions: QUESTIONS, analyze };
