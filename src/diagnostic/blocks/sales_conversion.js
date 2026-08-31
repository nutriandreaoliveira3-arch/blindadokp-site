// BLOCO 9 — VENDAS E CONVERSÃO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 09 — VENDAS E CONVERSÃO").

const PROCESS_TYPE_OPTIONS = [
  { value: 'compra_direta', label: 'Compra diretamente' },
  { value: 'whatsapp', label: 'Conversa pelo WhatsApp' },
  { value: 'direct', label: 'Conversa pelo Direct' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'reuniao_diagnostico', label: 'Reunião de diagnóstico' },
  { value: 'consulta_inicial', label: 'Consulta inicial' },
  { value: 'formulario_contato', label: 'Formulário + contato' },
  { value: 'pagina_checkout', label: 'Página de vendas/checkout' },
  { value: 'cada_caso_diferente', label: 'Cada caso acontece de uma forma' },
  { value: 'outro', label: 'Outro' },
];

const SALES_OWNER_OPTIONS = [
  { value: 'eu_mesma', label: 'Eu mesmo(a)' },
  { value: 'secretaria_assistente', label: 'Secretária/assistente' },
  { value: 'vendedor_comercial', label: 'Vendedor/comercial' },
  { value: 'equipe_atendimento', label: 'Equipe de atendimento' },
  { value: 'automacao_parte', label: 'Automação faz parte do processo' },
  { value: 'depende_caso', label: 'Depende do caso' },
  { value: 'ninguem_conduz', label: 'Ninguém conduz de forma definida' },
];

const QUALIFICATION_LEVEL_OPTIONS = [
  { value: 'sim_criterios_claros', label: 'Sim, sigo critérios claros' },
  { value: 'algumas_perguntas', label: 'Faço algumas perguntas, mas sem processo definido' },
  { value: 'avalio_intuitivamente', label: 'Avalio intuitivamente durante a conversa' },
  { value: 'apresento_para_todos', label: 'Apresento a oferta para praticamente todos' },
  { value: 'nao_faco', label: 'Não faço qualificação' },
  { value: 'nao_sei_qualificar', label: 'Não sei como qualificar' },
];

const QUALIFICATION_CRITERIA_OPTIONS = [
  { value: 'problema_necessidade', label: 'Problema/necessidade' },
  { value: 'objetivo', label: 'Objetivo' },
  { value: 'momento_pessoa', label: 'Momento da pessoa' },
  { value: 'adequacao_servico', label: 'Adequação ao serviço' },
  { value: 'capacidade_investimento', label: 'Capacidade de investimento' },
  { value: 'urgencia', label: 'Urgência' },
  { value: 'disponibilidade', label: 'Disponibilidade/comprometimento' },
  { value: 'outro', label: 'Outro' },
];

const PRESENTATION_OPTIONS = [
  { value: 'problema_solucao', label: 'Explico primeiro o problema e a solução' },
  { value: 'transformacao_como_funciona', label: 'Apresento transformação + como funciona' },
  { value: 'sessoes_entregaveis', label: 'Explico principalmente sessões/entregáveis' },
  { value: 'preco_duvidas', label: 'Informo o preço e respondo dúvidas' },
  { value: 'proposta_pronta', label: 'Envio uma proposta/apresentação pronta' },
  { value: 'link_pagina', label: 'Envio link da página' },
  { value: 'cada_vez_diferente', label: 'Cada vez apresento de um jeito' },
  { value: 'sem_apresentacao_definida', label: 'Não tenho uma apresentação definida' },
];

const OBJECTION_OPTIONS = [
  { value: 'caro', label: 'Está caro' },
  { value: 'preciso_pensar', label: 'Preciso pensar' },
  { value: 'falar_alguem', label: 'Preciso falar com alguém' },
  { value: 'sem_tempo', label: 'Não tenho tempo agora' },
  { value: 'comecar_depois', label: 'Quero começar depois' },
  { value: 'nao_sei_se_e_pra_mim', label: 'Não sei se é para mim' },
  { value: 'ja_tentei_outras', label: 'Já tentei outras soluções' },
  { value: 'comparar_opcoes', label: 'Quero comparar opções' },
  { value: 'medo_nao_resultado', label: 'Tenho medo de não conseguir o resultado' },
  { value: 'sem_necessidade_agora', label: 'Não vejo necessidade agora' },
  { value: 'poucas_objecoes', label: 'Poucas pessoas apresentam objeções' },
  { value: 'outro', label: 'Outro' },
];

const FOLLOWUP_OPTIONS = [
  { value: 'tenho_processo', label: 'Tenho um processo de follow-up definido' },
  { value: 'alguns_contatos', label: 'Faço alguns contatos de acompanhamento' },
  { value: 'retomo_quando_lembro', label: 'Retomo apenas quando lembro' },
  { value: 'espero_pessoa_voltar', label: 'Espero a pessoa voltar' },
  { value: 'normalmente_nao_faco', label: 'Normalmente não faço follow-up' },
  { value: 'tenho_automacao', label: 'Tenho automação de acompanhamento' },
  { value: 'depende_de_quem_atende', label: 'Depende de quem atende' },
];

const FOLLOWUP_DURATION_OPTIONS = [
  { value: 'ate_3dias', label: 'Até 3 dias' },
  { value: 'ate_7dias', label: 'Até 7 dias' },
  { value: 'ate_15dias', label: 'Até 15 dias' },
  { value: 'ate_30dias', label: 'Até 30 dias' },
  { value: 'mais_30dias', label: 'Mais de 30 dias' },
  { value: 'depende_situacao', label: 'Depende da situação' },
  { value: 'nao_sei', label: 'Não sei' },
];

const CONVERSION_RANGE_OPTIONS = [
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: '1_2', label: '1–2' },
  { value: '3_4', label: '3–4' },
  { value: '5_6', label: '5–6' },
  { value: '7_8', label: '7–8' },
  { value: '9_10', label: '9–10' },
  { value: 'nao_sei', label: 'Não sei' },
];

const CONVERSION_MIDPOINT = {
  nenhuma: 0,
  '1_2': 15,
  '3_4': 35,
  '5_6': 55,
  '7_8': 75,
  '9_10': 95,
};

const LEAD_MANAGEMENT_OPTIONS = [
  { value: 'crm', label: 'CRM estruturado' },
  { value: 'planilha', label: 'Planilha' },
  { value: 'agenda_sistema', label: 'Agenda/sistema interno' },
  { value: 'etiquetas_whatsapp', label: 'Etiquetas no WhatsApp' },
  { value: 'anotacoes_manuais', label: 'Anotações manuais' },
  { value: 'ficam_conversas', label: 'Ficam nas conversas do WhatsApp/Direct' },
  { value: 'nao_organizo', label: 'Não organizo' },
  { value: 'outro', label: 'Outro' },
];

const MODERATE_OR_HIGHER_INTEREST = ['6_10', '11_20', '21_50', '51_100', 'mais_100'];

const QUESTIONS = [
  {
    id: 'q1_como_acontece',
    title: 'Como a venda acontece',
    content: 'Quando alguém demonstra interesse no seu serviço, como a venda normalmente acontece?',
    fields: [
      { id: 'sales_process_type', label: 'Processo de venda', type: 'select', options: PROCESS_TYPE_OPTIONS, required: true },
      {
        id: 'sales_process_type_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'sales_process_type', equals: 'outro' },
      },
    ],
  },
  {
    id: 'q2_quem_conduz',
    title: 'Quem conduz a venda',
    content: 'Quem normalmente conversa com o interessado e conduz a venda?',
    fields: [{ id: 'sales_owner', label: 'Quem conduz', type: 'select', options: SALES_OWNER_OPTIONS, required: true }],
  },
  {
    id: 'q3_qualificacao',
    title: 'Qualificação',
    content: 'Antes de apresentar sua oferta, você verifica se aquela pessoa realmente tem perfil para se tornar cliente?',
    fields: [
      { id: 'lead_qualification_level', label: 'Nível de qualificação', type: 'select', options: QUALIFICATION_LEVEL_OPTIONS, required: true },
      {
        id: 'qualification_criteria',
        label: 'O que você costuma avaliar?',
        type: 'multiselect',
        options: QUALIFICATION_CRITERIA_OPTIONS,
        required: false,
        conditional: { field: 'lead_qualification_level', oneOf: ['sim_criterios_claros', 'algumas_perguntas'] },
      },
      {
        id: 'qualification_criteria_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'qualification_criteria', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q4_apresentacao',
    title: 'Apresentação da oferta',
    content: 'Como você normalmente apresenta sua oferta para uma pessoa interessada?',
    fields: [{ id: 'offer_presentation_method', label: 'Forma de apresentação', type: 'select', options: PRESENTATION_OPTIONS, required: true }],
  },
  {
    id: 'q5_objecoes',
    title: 'Principais objeções',
    content: 'Quais objeções você mais escuta antes da decisão de compra? Selecione até 3.',
    fields: [
      { id: 'sales_objections', label: 'Objeções', type: 'multiselect', options: OBJECTION_OPTIONS, required: true, maxSelect: 3 },
      {
        id: 'sales_objections_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'sales_objections', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q6_followup',
    title: 'Follow-up',
    content: 'Quando uma pessoa demonstra interesse, mas não compra naquele momento, o que acontece depois?',
    fields: [
      { id: 'followup_maturity', label: 'Follow-up', type: 'select', options: FOLLOWUP_OPTIONS, required: true },
      {
        id: 'followup_duration',
        label: 'Por quanto tempo normalmente acompanha essa oportunidade?',
        type: 'select',
        options: FOLLOWUP_DURATION_OPTIONS,
        required: false,
        conditional: { field: 'followup_maturity', oneOf: ['tenho_processo', 'alguns_contatos', 'tenho_automacao'] },
      },
    ],
  },
  {
    id: 'q7_conversao',
    title: 'Conversão',
    content: 'De cada 10 pessoas realmente interessadas que chegam até você, aproximadamente quantas costumam comprar?',
    fields: [{ id: 'self_reported_conversion_range', label: 'Conversão aproximada', type: 'select', options: CONVERSION_RANGE_OPTIONS, required: true }],
  },
  {
    id: 'q8_organizacao',
    title: 'Organização dos leads',
    content: 'Como você organiza as pessoas que demonstraram interesse e ainda não compraram?',
    fields: [
      { id: 'lead_management_method', label: 'Organização', type: 'select', options: LEAD_MANAGEMENT_OPTIONS, required: true },
      {
        id: 'lead_management_method_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'lead_management_method', equals: 'outro' },
      },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 9 (seções 11, 14 e
// os red flags em linha das perguntas 2, 4 e 8). O cálculo do ponto médio
// de conversão usa exatamente o exemplo dado na especificação (3–4 de 10 ≈
// 35%). As regras que dependem de scores qualitativos (01, 02 parcialmente,
// 07, 08) ficam pro Motor de IA — não inventadas aqui.
function analyze(answers, context) {
  const derived = {
    sales_process_maturity: answers.sales_process_type || null,
    sales_owner_dependency: answers.sales_owner || null,
    objection_profile: Array.isArray(answers.sales_objections) ? answers.sales_objections : [],
  };

  if (answers.self_reported_conversion_range in CONVERSION_MIDPOINT) {
    derived.estimated_sales_conversion_rate = CONVERSION_MIDPOINT[answers.self_reported_conversion_range];
  }

  const redFlags = [];

  if (answers.sales_owner === 'ninguem_conduz') {
    redFlags.push({
      rule: 'responsabilidade_comercial_indefinida',
      type: 'ALERTA',
      message: 'Não existe uma responsabilidade comercial claramente definida, o que pode aumentar a perda de oportunidades.',
    });
  }

  if (answers.offer_presentation_method === 'preco_duvidas') {
    redFlags.push({
      rule: 'apresentacao_so_preco',
      type: 'ALERTA',
      message: 'A oferta pode estar chegando ao preço antes que o cliente compreenda suficientemente o valor da solução.',
    });
  }

  if (['espero_pessoa_voltar', 'normalmente_nao_faco'].includes(answers.followup_maturity)) {
    redFlags.push({
      rule: 'sem_followup',
      type: 'OPORTUNIDADE',
      message: 'Parte das oportunidades pode estar sendo perdida não por rejeição, mas por ausência de acompanhamento.',
    });
  }

  if (answers.self_reported_conversion_range === 'nao_sei') {
    redFlags.push({
      rule: 'nao_sabe_conversao',
      type: 'ALERTA',
      message: 'Sem acompanhar quantas oportunidades avançam para compra, fica difícil saber se o principal problema está na aquisição ou na conversão.',
    });
  }

  const acquisitionAnswers = (context && context.acquisition) || {};
  const leadVolumeModerateOrHigher = MODERATE_OR_HIGHER_INTEREST.includes(acquisitionAnswers.monthly_qualified_interest_range);

  if (['ficam_conversas', 'nao_organizo'].includes(answers.lead_management_method) && leadVolumeModerateOrHigher) {
    redFlags.push({
      rule: 'leads_sem_organizacao',
      type: 'ALERTA',
      message: 'Existe risco de oportunidades serem esquecidas ou abandonadas por falta de organização comercial.',
    });
  }

  const businessAnswers = (context && context.business_current) || {};
  const ownerDependencyLevel = Number(businessAnswers.owner_dependency_level);
  if (answers.sales_owner === 'eu_mesma' && ownerDependencyLevel <= 2 && leadVolumeModerateOrHigher) {
    redFlags.push({
      rule: 'dependencia_do_proprietario_nas_vendas',
      type: 'OPORTUNIDADE',
      message: 'O processo comercial depende diretamente de você e pode se tornar um gargalo conforme o volume de oportunidades crescer.',
      cross_with: ['operations', 'automation'],
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'sales', questions: QUESTIONS, analyze };
