// BLOCO 2 — PÚBLICO E CLIENTE IDEAL
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 02 — PÚBLICO E CLIENTE IDEAL").

const PREVIOUS_ATTEMPTS_OPTIONS = [
  { value: 'resolver_sozinhas', label: 'Resolver sozinhas' },
  { value: 'conteudos_gratuitos', label: 'Conteúdos gratuitos' },
  { value: 'outros_profissionais', label: 'Outros profissionais' },
  { value: 'produtos_mais_baratos', label: 'Produtos ou serviços mais baratos' },
  { value: 'apps_ferramentas', label: 'Aplicativos/ferramentas' },
  { value: 'cursos_programas', label: 'Cursos/programas' },
  { value: 'solucoes_alternativas', label: 'Soluções alternativas' },
  { value: 'nao_sei', label: 'Não sei' },
  { value: 'outro', label: 'Outro' },
];

const PRIORITY_REASON_OPTIONS = [
  { value: 'mais_experiencia', label: 'Tenho mais experiência com ele' },
  { value: 'mais_valor', label: 'Consigo gerar mais valor' },
  { value: 'maior_procura', label: 'Existe maior procura' },
  { value: 'maior_urgencia', label: 'Possui maior urgência' },
  { value: 'valoriza_trabalho', label: 'Valoriza mais meu trabalho' },
  { value: 'maior_capacidade_investimento', label: 'Tem maior capacidade de investimento' },
  { value: 'gosto_atender', label: 'Gosto mais de atender' },
  { value: 'maior_continuidade', label: 'Existe maior possibilidade de continuidade' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_sei', label: 'Ainda não sei' },
];

const DIFFERENTIAL_TYPE_OPTIONS = [
  { value: 'metodo_proprio', label: 'Método próprio' },
  { value: 'especializacao', label: 'Especialização' },
  { value: 'experiencia', label: 'Experiência' },
  { value: 'forma_acompanhamento', label: 'Forma de acompanhamento' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'personalizacao', label: 'Personalização' },
  { value: 'materiais_exclusivos', label: 'Materiais exclusivos' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'processo_atendimento', label: 'Processo de atendimento' },
  { value: 'uso_ia', label: 'Uso de IA' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_sei', label: 'Ainda não sei' },
];

const QUESTIONS = [
  {
    id: 'q1_perfil',
    title: 'Quem procura sua especialidade?',
    content: 'Quem normalmente procura um profissional da sua especialidade?',
    fields: [
      {
        id: 'specialty_seeking_profile',
        label: 'Descreva o perfil de forma simples (não precisa ser uma persona detalhada)',
        type: 'textarea',
        required: true,
      },
    ],
  },
  {
    id: 'q2_problema',
    title: 'Problema e momento de busca',
    content:
      'Qual é o principal problema que faz essas pessoas procurarem sua especialidade e o que geralmente acontece para elas decidirem buscar ajuda?',
    fields: [
      { id: 'primary_client_problem', label: 'Principal problema', type: 'text', required: true },
      { id: 'seeking_trigger', label: 'Momento que leva à busca', type: 'text', required: true },
    ],
  },
  {
    id: 'q3_aderencia',
    title: 'Aderência ao profissional',
    content:
      'Dentro das pessoas que procuram sua especialidade, com qual perfil ou problema você acredita conseguir gerar mais valor?',
    fields: [
      {
        id: 'best_fit_description',
        label: 'Considere sua experiência, especialização e forma de trabalhar',
        type: 'textarea',
        required: true,
      },
    ],
  },
  {
    id: 'q4_tentativas',
    title: 'O que o público já tentou',
    content: 'Antes de procurar um profissional como você, o que essas pessoas normalmente já tentaram?',
    fields: [
      { id: 'previous_attempts', label: 'Já tentaram', type: 'multiselect', options: PREVIOUS_ATTEMPTS_OPTIONS, required: true },
      {
        id: 'previous_attempts_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'previous_attempts', includes: 'outro' },
      },
      {
        id: 'previous_attempts_failure_reason',
        label: 'Na sua percepção, por que essas tentativas não resolveram completamente o problema?',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    id: 'q5_prioridade',
    title: 'Público prioritário',
    content:
      'Se você tivesse que concentrar seu trabalho em apenas um perfil de cliente pelos próximos 12 meses, qual escolheria?',
    fields: [
      { id: 'priority_profile', label: 'Perfil escolhido', type: 'text', required: true },
      {
        id: 'priority_profile_reasons',
        label: 'Por que esse perfil faria mais sentido?',
        type: 'multiselect',
        options: PRIORITY_REASON_OPTIONS,
        required: true,
      },
      {
        id: 'priority_profile_reasons_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'priority_profile_reasons', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q6_diferencial',
    title: 'Diferencial atual',
    content:
      'Qual é o seu principal diferencial hoje? O que você oferece, faz ou entrega a mais que acredita colocar você à frente de outros profissionais da mesma especialidade?',
    fields: [
      {
        id: 'declared_differential_type',
        label: 'Se ajudar a pensar (opcional, pode marcar mais de um)',
        type: 'multiselect',
        options: DIFFERENTIAL_TYPE_OPTIONS,
        required: false,
      },
      {
        id: 'declared_differential_type_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'declared_differential_type', includes: 'outro' },
      },
      { id: 'declared_differential', label: 'Explique brevemente', type: 'textarea', required: true },
    ],
  },
];

const BROAD_AUDIENCE_PATTERNS = [
  'todo mundo',
  'todas as pessoas',
  'qualquer pessoa',
  'qualquer um',
  'qualquer um que',
  'geral',
];

const GENERIC_DIFFERENTIAL_PATTERNS = [
  'qualidade',
  'atendimento humanizado',
  'atenção',
  'personalização',
  'personalizado',
  'humanizado',
];

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Calcula dados derivados e red flags determinísticas do Bloco 2 (seções 9 e
// 12 da especificação). As 6 dimensões de score e os cruzamentos com outros
// blocos (regras 03 e 04, que dependem de professional_fit_score) exigem
// julgamento qualitativo da Blindada Pro (IA) e ficam para a fase do Motor
// de IA — não são inventadas aqui.
function analyze(answers) {
  const derived = {
    market_profile: answers.specialty_seeking_profile || null,
    primary_problem: answers.primary_client_problem || null,
    search_trigger: answers.seeking_trigger || null,
    best_fit_description: answers.best_fit_description || null,
    priority_customer_profile: answers.priority_profile || null,
    declared_differential: answers.declared_differential || null,
  };
  const redFlags = [];

  const normalizedProfile = normalize(answers.specialty_seeking_profile);
  if (normalizedProfile && BROAD_AUDIENCE_PATTERNS.some((p) => normalizedProfile.includes(p))) {
    redFlags.push({
      rule: 'publico_amplo_demais',
      type: 'ALERTA',
      message:
        'Seu público ainda está amplo demais para orientar uma estratégia específica de posicionamento e oferta.',
    });
  }

  const reasons = Array.isArray(answers.priority_profile_reasons) ? answers.priority_profile_reasons : [];
  if (reasons.length === 1 && reasons[0] === 'gosto_atender') {
    redFlags.push({
      rule: 'escolha_apenas_por_afinidade',
      type: 'HIPOTESE',
      message:
        'Afinidade é importante, mas ainda precisamos verificar demanda, aderência e viabilidade econômica antes de confirmar esse público como prioridade.',
      cross_with: ['offer', 'pricing', 'acquisition'],
    });
  }

  const normalizedDifferential = normalize(answers.declared_differential);
  if (
    normalizedDifferential &&
    normalizedDifferential.length < 60 &&
    GENERIC_DIFFERENTIAL_PATTERNS.some((p) => normalizedDifferential.includes(p))
  ) {
    redFlags.push({
      rule: 'diferencial_generico',
      type: 'HIPOTESE',
      message: 'Possível atributo valorizado, mas ainda não confirmado como diferencial competitivo.',
      cross_with: ['differentiation'],
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'audience', questions: QUESTIONS, analyze };
