// BLOCO 6 — PRECIFICAÇÃO E MONETIZAÇÃO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 06 — PRECIFICAÇÃO E
// MONETIZAÇÃO"). Usa a oferta prioritária definida no Bloco 5 como
// contexto, sem perguntar de novo qual produto está sendo analisado.

const { resolveOfferName } = require('./offer');

const PAYMENT_MODEL_OPTIONS = [
  { value: 'a_vista', label: 'Somente à vista' },
  { value: 'a_vista_parcelado', label: 'À vista + parcelado' },
  { value: 'recorrencia', label: 'Mensalidade/recorrência' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'entrada_parcelas', label: 'Entrada + parcelas' },
  { value: 'outra', label: 'Outra' },
];

const PRICING_METHOD_OPTIONS = [
  { value: 'concorrentes', label: 'Preço dos concorrentes' },
  { value: 'tempo_entrega', label: 'Tempo que gasto para entregar' },
  { value: 'custos_entrega', label: 'Custos da entrega' },
  { value: 'valor_percebido', label: 'Valor percebido pelo cliente' },
  { value: 'capacidade_pagamento', label: 'Capacidade de pagamento do público' },
  { value: 'aumentando_tempo', label: 'Fui aumentando ao longo do tempo' },
  { value: 'intuicao', label: 'Escolhi intuitivamente' },
  { value: 'sem_criterio', label: 'Não tenho um critério definido' },
  { value: 'outro', label: 'Outro' },
];

const COST_AWARENESS_OPTIONS = [
  { value: 'conhece_bem', label: 'Sim, conheço bem' },
  { value: 'tem_estimativa', label: 'Tenho uma estimativa' },
  { value: 'conhece_alguns', label: 'Conheço apenas alguns custos' },
  { value: 'nunca_calculou', label: 'Nunca calculei' },
  { value: 'nao_sei_calcular', label: 'Não sei como calcular' },
];

const TIME_PER_CLIENT_OPTIONS = [
  { value: 'ate_2h', label: 'Até 2 horas' },
  { value: '3_5h', label: '3–5 horas' },
  { value: '6_10h', label: '6–10 horas' },
  { value: '11_20h', label: '11–20 horas' },
  { value: '21_40h', label: '21–40 horas' },
  { value: 'mais_40h', label: 'Mais de 40 horas' },
  { value: 'nao_sei', label: 'Não sei estimar' },
];

const MARKET_REACTION_OPTIONS = [
  { value: 'compram_pouca_resistencia', label: 'Compram com pouca resistência' },
  { value: 'perguntam_parcelamento', label: 'Perguntam sobre parcelamento' },
  { value: 'caro', label: 'Dizem que está caro' },
  { value: 'pedem_desconto', label: 'Pedem desconto' },
  { value: 'comparam_mais_baratas', label: 'Comparam com opções mais baratas' },
  { value: 'interesse_adiam', label: 'Demonstram interesse, mas adiam' },
  { value: 'quase_nunca_apresento', label: 'Quase nunca chego a apresentar o preço' },
  { value: 'sem_dados', label: 'Não tenho dados suficientes' },
];

const CONTINUITY_OPTIONS = [
  { value: 'renovacao_mesma_solucao', label: 'Sim, renovação da mesma solução' },
  { value: 'acompanhamento_recorrente', label: 'Sim, acompanhamento recorrente' },
  { value: 'solucao_avancada', label: 'Sim, uma solução mais avançada' },
  { value: 'outro_servico_complementar', label: 'Sim, outro serviço complementar' },
  { value: 'talvez_nao_estruturado', label: 'Talvez, ainda não está estruturado' },
  { value: 'nao', label: 'Não' },
  { value: 'nunca_analisei', label: 'Nunca analisei' },
];

const HAS_INSTALLMENTS = ['a_vista_parcelado', 'entrada_parcelas'];
const KNOWS_COST = ['conhece_bem', 'tem_estimativa', 'conhece_alguns'];
const CONTINUITY_HAS_NEED = ['renovacao_mesma_solucao', 'acompanhamento_recorrente', 'solucao_avancada', 'outro_servico_complementar'];

const BASE_QUESTIONS = [
  {
    id: 'q1_preco',
    title: 'Preço e condições',
    content: 'Quanto você cobra atualmente por essa oferta e como o cliente pode pagar?',
    fields: [
      { id: 'current_offer_price', label: 'Preço principal (R$)', type: 'number', required: true },
      { id: 'payment_model', label: 'Forma de pagamento', type: 'select', options: PAYMENT_MODEL_OPTIONS, required: true },
      {
        id: 'payment_model_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'payment_model', equals: 'outra' },
      },
      {
        id: 'max_installments',
        label: 'Quantidade máxima de parcelas',
        type: 'number',
        required: false,
        conditional: { field: 'payment_model', oneOf: HAS_INSTALLMENTS },
      },
    ],
  },
  {
    id: 'q2_criterio',
    title: 'Como o preço foi definido',
    content: 'Qual foi o principal critério usado para chegar a esse preço?',
    fields: [
      { id: 'pricing_method', label: 'Critério', type: 'multiselect', options: PRICING_METHOD_OPTIONS, required: true },
      {
        id: 'pricing_method_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'pricing_method', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q3_custo',
    title: 'Custo de entrega',
    content: 'Você sabe aproximadamente quanto custa entregar essa oferta para cada cliente?',
    fields: [
      { id: 'delivery_cost_awareness', label: 'Conhecimento do custo', type: 'select', options: COST_AWARENESS_OPTIONS, required: true },
      {
        id: 'estimated_delivery_cost',
        label: 'Custo aproximado por cliente (R$) — considere parceiros, equipe, ferramentas, taxas e materiais',
        type: 'number',
        required: false,
        conditional: { field: 'delivery_cost_awareness', oneOf: KNOWS_COST },
      },
    ],
  },
  {
    id: 'q4_carga',
    title: 'Carga de entrega',
    content: 'Considerando atendimento, preparação, suporte e tarefas administrativas, quanto tempo essa oferta exige de você por cliente?',
    fields: [
      { id: 'owner_time_per_client_range', label: 'Tempo por cliente', type: 'select', options: TIME_PER_CLIENT_OPTIONS, required: true },
    ],
  },
  {
    id: 'q5_reacao',
    title: 'Reação do mercado ao preço',
    content: 'Como as pessoas normalmente reagem quando conhecem o preço dessa oferta?',
    fields: [
      { id: 'price_market_reaction', label: 'Reação mais comum', type: 'select', options: MARKET_REACTION_OPTIONS, required: true },
    ],
  },
  {
    id: 'q6_continuidade',
    title: 'Continuidade e monetização',
    content: 'Depois dessa oferta principal, existe uma necessidade real que pode fazer o cliente continuar comprando de você?',
    fields: [
      { id: 'continuity_model', label: 'Continuidade', type: 'select', options: CONTINUITY_OPTIONS, required: true },
      {
        id: 'next_customer_need',
        label: 'Qual é a próxima necessidade do cliente?',
        type: 'text',
        required: false,
        conditional: { field: 'continuity_model', oneOf: CONTINUITY_HAS_NEED },
      },
    ],
  },
];

// Mostra automaticamente qual oferta está sendo analisada (a prioritária,
// definida no Bloco 5), sem perguntar de novo.
function buildQuestions(context) {
  const questions = BASE_QUESTIONS.map((q) => ({ ...q }));
  const offerName = resolveOfferName((context && context.offer) || {}, context);
  if (offerName) {
    questions[0] = { ...questions[0], content: `Estamos analisando: ${offerName}. ${questions[0].content}` };
  }
  return questions;
}

// Dados derivados e red flags determinísticas do Bloco 6 (seções 9 e 12).
// gross_contribution_margin é a única fórmula numérica dada na
// especificação; as 7 dimensões de score (que exigiriam faixas percentuais
// não especificadas, ex. "margem boa") ficam pro Motor de IA — não
// inventadas aqui.
function analyze(answers, context) {
  const price = Number(answers.current_offer_price);
  const cost = Number(answers.estimated_delivery_cost);
  const derived = {
    payment_model: answers.payment_model || null,
    pricing_method: Array.isArray(answers.pricing_method) ? answers.pricing_method : [],
  };

  if (Number.isFinite(price) && price > 0 && Number.isFinite(cost)) {
    const grossContributionValue = price - cost;
    derived.gross_contribution_value = grossContributionValue;
    derived.gross_contribution_margin = Math.round((grossContributionValue / price) * 100 * 10) / 10;
  }

  const redFlags = [];
  const methods = derived.pricing_method;

  if (methods.includes('concorrentes') || methods.includes('intuicao')) {
    redFlags.push({
      rule: 'preco_sem_criterio_consistente',
      type: 'ALERTA',
      message: 'O preço atual parece ter sido definido com pouca conexão entre valor, custo e sustentabilidade da entrega.',
    });
  }

  if (methods.includes('tempo_entrega')) {
    redFlags.push({
      rule: 'preco_baseado_so_no_tempo',
      type: 'OPORTUNIDADE',
      message: 'Existe oportunidade de revisar a precificação considerando também valor, resultado, estrutura da oferta, custos e mercado.',
    });
  }

  if (['nunca_calculou', 'nao_sei_calcular'].includes(answers.delivery_cost_awareness)) {
    redFlags.push({
      rule: 'nao_sabe_o_custo',
      type: 'ALERTA',
      message: 'Sem conhecer o custo aproximado da entrega, não é possível avaliar corretamente margem e sustentabilidade.',
    });
  }

  if (answers.price_market_reaction === 'caro') {
    derived.price_reaction_guardrail = true;
  }

  return { derived, redFlags };
}

module.exports = { id: 'pricing', questions: BASE_QUESTIONS, buildQuestions, analyze };
