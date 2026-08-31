// BLOCO 5 — OFERTA
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 05 — OFERTA"). Reaproveita
// contexto dos blocos anteriores: as ofertas cadastradas no Bloco 1
// (Negócio Atual) viram opções prontas na Pergunta 1, e o diferencial
// declarado no Bloco 4 aparece como referência na Pergunta 4.

const DELIVERABLE_OPTIONS = [
  { value: 'consultas_sessoes', label: 'Consultas/sessões' },
  { value: 'acompanhamento', label: 'Acompanhamento' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'avaliacoes', label: 'Avaliações' },
  { value: 'plano_personalizado', label: 'Plano personalizado' },
  { value: 'materiais', label: 'Materiais' },
  { value: 'app_plataforma', label: 'Aplicativo/plataforma' },
  { value: 'grupo_comunidade', label: 'Grupo/comunidade' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'aulas', label: 'Aulas' },
  { value: 'implementacao', label: 'Implementação' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'outro', label: 'Outro' },
];

const OBJECTION_OPTIONS = [
  { value: 'price', label: 'Preço' },
  { value: 'nao_entende_valor', label: 'Não entende o valor' },
  { value: 'nao_percebe_urgencia', label: 'Não percebe urgência' },
  { value: 'duvida_se_funciona', label: 'Tem dúvida se funciona para ela' },
  { value: 'compara_mais_baratas', label: 'Compara com alternativas mais baratas' },
  { value: 'falta_confianca', label: 'Falta de confiança' },
  { value: 'falta_tempo', label: 'Falta de tempo' },
  { value: 'precisa_conversar', label: 'Precisa conversar com outra pessoa' },
  { value: 'vai_pensar', label: 'Diz que vai pensar' },
  { value: 'nao_sei', label: 'Não sei' },
  { value: 'outro', label: 'Outro' },
];

const IMPROVEMENT_OPTIONS = [
  { value: 'clareza_proposta', label: 'Clareza da proposta' },
  { value: 'diferenciacao', label: 'Diferenciação' },
  { value: 'entregaveis', label: 'Entregáveis' },
  { value: 'experiencia_cliente', label: 'Experiência do cliente' },
  { value: 'preco', label: 'Preço' },
  { value: 'forma_pagamento', label: 'Forma de pagamento' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'provas_autoridade', label: 'Provas/autoridade' },
  { value: 'processo_venda', label: 'Processo de venda' },
  { value: 'nao_sei', label: 'Não sei' },
  { value: 'outra', label: 'Outra' },
];

const VAGUE_TRANSFORMATION_PATTERNS = ['melhorar sua vida', 'ter mais saude', 'ter melhores resultados', 'mudar de vida'];

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const BASE_QUESTIONS = [
  {
    id: 'q1_oferta_principal',
    title: 'Oferta principal',
    content: 'Qual é o principal produto ou serviço que você deseja vender mais nos próximos 12 meses?',
    fields: [{ id: 'primary_growth_offer', label: 'Oferta principal', type: 'text', required: true }],
  },
  {
    id: 'q2_problema_transformacao',
    title: 'Problema e transformação',
    content: 'Qual problema principal essa oferta resolve e qual mudança o cliente busca ao contratar você?',
    fields: [
      { id: 'offer_primary_problem', label: 'Problema que resolve', type: 'text', required: true },
      { id: 'offer_desired_transformation', label: 'Resultado ou transformação buscada', type: 'text', required: true },
    ],
  },
  {
    id: 'q3_entrega',
    title: 'O que o cliente recebe',
    content: 'O que o cliente recebe ao contratar essa oferta? Selecione o que fizer parte da entrega.',
    fields: [
      { id: 'offer_deliverables', label: 'Entrega', type: 'multiselect', options: DELIVERABLE_OPTIONS, required: true },
      {
        id: 'offer_deliverables_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'offer_deliverables', includes: 'outro' },
      },
      {
        id: 'essential_deliverable',
        label: 'Existe algum componente da entrega que você considera essencial para gerar valor?',
        type: 'text',
        required: false,
      },
    ],
  },
  {
    id: 'q4_diferenciacao_oferta',
    title: 'Diferenciação da oferta',
    content:
      'O que existe nesta oferta que torna a experiência ou a entrega diferente de alternativas semelhantes no mercado?',
    fields: [
      { id: 'offer_differentiation', label: 'Diferenciação da oferta', type: 'textarea', required: true },
      {
        id: 'differential_embedded_in_offer',
        label: 'Como esse diferencial aparece na oferta que o cliente compra?',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'q5_objecao',
    title: 'Objeção principal',
    content: 'Qual é a principal razão que faz uma pessoa interessada hesitar ou não comprar essa oferta?',
    fields: [
      { id: 'main_offer_objection', label: 'Principal objeção', type: 'select', options: OBJECTION_OPTIONS, required: true },
      {
        id: 'main_offer_objection_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'main_offer_objection', equals: 'outro' },
      },
    ],
  },
  {
    id: 'q6_percepcao',
    title: 'Percepção da oferta',
    content: 'Se pudesse melhorar apenas uma coisa nessa oferta hoje, o que mudaria?',
    fields: [
      { id: 'self_perceived_offer_gap', label: 'O que mudaria', type: 'select', options: IMPROVEMENT_OPTIONS, required: true },
      {
        id: 'self_perceived_offer_gap_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'self_perceived_offer_gap', equals: 'outra' },
      },
      { id: 'offer_gap_reason', label: 'Por quê?', type: 'text', required: false },
    ],
  },
];

// Personaliza a Pergunta 1 com as ofertas já cadastradas no Bloco 1 (quando
// existirem) e adiciona, na Pergunta 4, o lembrete do diferencial declarado
// no Bloco 4 — exatamente como a especificação pede, pra não perguntar de
// novo o que o sistema já sabe.
function buildQuestions(context) {
  const questions = BASE_QUESTIONS.map((q) => ({ ...q, fields: q.fields.map((f) => ({ ...f })) }));

  const businessAnswers = (context && context.business_current) || {};
  const offers = (Array.isArray(businessAnswers.offers) ? businessAnswers.offers : []).filter((o) => o && o.offer_name);
  if (offers.length > 0) {
    const options = offers.map((o, i) => ({ value: `offer_${i}`, label: o.offer_name }));
    options.push({ value: 'outra', label: 'Outra' });
    questions[0].fields = [
      { id: 'primary_growth_offer_id', label: 'Escolha uma oferta cadastrada, ou "Outra"', type: 'select', options, required: true },
      {
        id: 'primary_growth_offer',
        label: 'Qual?',
        type: 'text',
        required: true,
        conditional: { field: 'primary_growth_offer_id', equals: 'outra' },
      },
    ];
  }

  const differentiationAnswers = (context && context.differentiation) || {};
  const declaredDifferential = differentiationAnswers.client_choice_reason || differentiationAnswers.differential_importance_reason;
  if (declaredDifferential) {
    questions[3] = {
      ...questions[3],
      content:
        questions[3].content +
        ` No diagnóstico anterior, você mencionou como diferencial: "${declaredDifferential}".`,
    };
  }

  return questions;
}

// Dados derivados e red flags determinísticas do Bloco 5 (seções 9 e 12).
// As 7 dimensões do score, e as regras 01, 03 e 06 (que dependem de scores
// qualitativos ou de "benchmark de ticket premium" — proibido inventar
// benchmark universal, ver regra 65 do material da Andréa) ficam pro Motor
// de IA. Implementadas aqui: regra 02 (transformação vaga, com os exemplos
// literais dados na especificação) e regra 04 (diferencial declarado no
// Bloco 4 mas não incorporado à oferta).
// Resolve o nome da oferta prioritária escolhida no Bloco 5, seja ela
// digitada direto (answers.primary_growth_offer) ou selecionada a partir
// das ofertas já cadastradas no Bloco 1 (answers.primary_growth_offer_id).
// Exportada pra outros blocos (ex.: Precificação) que reaproveitam a
// mesma oferta sem perguntar de novo.
function resolveOfferName(offerAnswers, context) {
  if (!offerAnswers) return null;
  return (
    offerAnswers.primary_growth_offer ||
    (context &&
      context.business_current &&
      Array.isArray(context.business_current.offers) &&
      offerAnswers.primary_growth_offer_id &&
      context.business_current.offers[Number(String(offerAnswers.primary_growth_offer_id).replace('offer_', ''))]?.offer_name) ||
    null
  );
}

function analyze(answers, context) {
  const offerName = resolveOfferName(answers, context);

  const derived = {
    offer_focus: offerName,
    offer_problem: answers.offer_primary_problem || null,
    desired_transformation: answers.offer_desired_transformation || null,
    differentiation_inside_offer: answers.differential_embedded_in_offer || null,
    main_objection: answers.main_offer_objection || null,
  };

  const redFlags = [];

  const normalizedTransformation = normalize(answers.offer_desired_transformation);
  if (normalizedTransformation && VAGUE_TRANSFORMATION_PATTERNS.some((p) => normalizedTransformation.includes(p))) {
    redFlags.push({
      rule: 'transformacao_vaga',
      type: 'OPORTUNIDADE',
      message: 'A transformação ainda está genérica e pode dificultar a percepção de valor da oferta.',
    });
  }

  const differentiationAnswers = (context && context.differentiation) || {};
  const declaredDifferential = differentiationAnswers.client_choice_reason || differentiationAnswers.differential_importance_reason;
  if (declaredDifferential && !answers.differential_embedded_in_offer) {
    redFlags.push({
      rule: 'diferencial_fora_da_oferta',
      type: 'OPORTUNIDADE',
      message: 'Existe um diferencial potencial, mas ele ainda não está incorporado de forma clara à experiência ou estrutura da oferta.',
      cross_with: ['differentiation'],
    });
  }

  if (answers.main_offer_objection === 'price') {
    derived.price_objection_guardrail = true;
  }

  return { derived, redFlags };
}

module.exports = { id: 'offer', questions: BASE_QUESTIONS, buildQuestions, analyze, resolveOfferName };
