// BLOCO 3 — POSICIONAMENTO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 03 — POSICIONAMENTO").

const CLARITY_OPTIONS = [
  { value: 'very_clear', label: 'Sim, com muita clareza' },
  { value: 'mostly_clear', label: 'Na maior parte' },
  { value: 'partially_clear', label: 'Parcialmente' },
  { value: 'little_clear', label: 'Pouco' },
  { value: 'not_clear', label: 'Não' },
  { value: 'dont_know', label: 'Não sei avaliar' },
];

const AUTHORITY_OPTIONS = [
  { value: 'totally', label: 'Sim, totalmente' },
  { value: 'mostly', label: 'Em boa parte' },
  { value: 'partially', label: 'Parcialmente' },
  { value: 'very_little', label: 'Muito pouco' },
  { value: 'no', label: 'Não' },
  { value: 'dont_know', label: 'Não sei' },
];

const PRICE_ALIGNMENT_OPTIONS = [
  { value: 'yes_clearly', label: 'Sim, claramente' },
  { value: 'probably_yes', label: 'Provavelmente sim' },
  { value: 'doubts', label: 'Tenho dúvidas' },
  { value: 'probably_not', label: 'Provavelmente não' },
  { value: 'no', label: 'Não' },
  { value: 'not_defined', label: 'Ainda não defini o preço desejado' },
];

const QUESTIONS = [
  {
    id: 'q1_apresentacao',
    title: 'Apresentação atual',
    content: 'Se alguém perguntasse hoje "o que você faz?", como você responderia em uma frase?',
    fields: [
      {
        id: 'current_positioning_statement',
        label: 'Ex.: Ajudo mulheres acima de 35 anos a emagrecer com acompanhamento nutricional individualizado.',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'q2_reconhecimento',
    title: 'Reconhecimento desejado',
    content: 'Pelo que você gostaria de ser reconhecido(a) profissionalmente?',
    fields: [
      {
        id: 'desired_market_association',
        label: 'Pense no que gostaria que as pessoas associassem ao seu nome',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    id: 'q3_clareza',
    title: 'Clareza atual',
    content:
      'Hoje, quando alguém acessa seu perfil, site ou apresentação profissional, você acredita que entende rapidamente o que você faz e para quem?',
    fields: [
      { id: 'self_perceived_positioning_clarity', label: 'Clareza percebida', type: 'select', options: CLARITY_OPTIONS, required: true },
    ],
  },
  {
    id: 'q4_autoridade',
    title: 'Percepção de autoridade',
    content: 'Sua comunicação atual transmite o nível de experiência e especialização que você realmente possui?',
    fields: [
      { id: 'authority_perception', label: 'Percepção de autoridade', type: 'select', options: AUTHORITY_OPTIONS, required: true },
      {
        id: 'authority_gap_description',
        label: 'O que acredita que não está sendo percebido?',
        type: 'text',
        required: false,
        conditional: { field: 'authority_perception', oneOf: ['partially', 'very_little', 'no'] },
      },
    ],
  },
  {
    id: 'q5_valor',
    title: 'Posicionamento e valor',
    content: 'Você acredita que a forma como se apresenta hoje sustenta o preço que deseja cobrar pelo seu trabalho?',
    fields: [
      { id: 'positioning_price_alignment', label: 'Sustenta o preço desejado', type: 'select', options: PRICE_ALIGNMENT_OPTIONS, required: true },
    ],
  },
  {
    id: 'q6_posicao',
    title: 'Posição desejada',
    content: 'Se você pudesse ocupar uma única posição na mente do seu cliente ideal, qual gostaria que fosse?',
    fields: [
      {
        id: 'desired_mind_position',
        label: 'Ex.: "A nutricionista que entende emagrecimento feminino depois dos 35."',
        type: 'text',
        required: true,
      },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 3 (seções 9 e 12 da
// especificação). Só a REGRA 04 é totalmente determinística (baseada numa
// resposta de seleção única). As regras 01, 02, 03 e 05 exigem análise de
// texto livre ou comparação semântica entre blocos — julgamento qualitativo
// da Blindada Pro (IA), não inventadas aqui.
function analyze(answers) {
  const derived = {
    current_positioning: answers.current_positioning_statement || null,
    desired_positioning: answers.desired_mind_position || null,
    desired_market_association: answers.desired_market_association || null,
    self_perceived_positioning_clarity: answers.self_perceived_positioning_clarity || null,
    authority_perception: answers.authority_perception || null,
    price_positioning_alignment: answers.positioning_price_alignment || null,
  };
  const redFlags = [];

  if (['probably_not', 'no'].includes(answers.positioning_price_alignment)) {
    redFlags.push({
      rule: 'posicionamento_nao_sustenta_ticket',
      type: 'OPORTUNIDADE',
      message: 'Existe oportunidade de aumentar percepção de valor antes de revisar preço.',
      cross_with: ['pricing'],
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'positioning', questions: QUESTIONS, analyze };
