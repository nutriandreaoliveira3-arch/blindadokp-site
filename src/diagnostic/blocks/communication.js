// BLOCO 7 — COMUNICAÇÃO E CONTEÚDO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 07 — COMUNICAÇÃO E CONTEÚDO").

const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'site_blog', label: 'Site/blog' },
  { value: 'google', label: 'Google' },
  { value: 'outro', label: 'Outro' },
];

const FREQUENCY_OPTIONS = [
  { value: 'todos_dias', label: 'Todos os dias' },
  { value: '4_6_semana', label: '4–6 vezes por semana' },
  { value: '2_3_semana', label: '2–3 vezes por semana' },
  { value: '1_semana', label: 'Aproximadamente 1 vez por semana' },
  { value: 'algumas_mes', label: 'Algumas vezes por mês' },
  { value: 'raramente', label: 'Raramente' },
  { value: 'sem_frequencia', label: 'Não tenho frequência definida' },
];

const CLARITY_OPTIONS = [
  { value: 'muito_clara', label: 'Sim, com muita clareza' },
  { value: 'na_maior_parte', label: 'Na maior parte' },
  { value: 'parcialmente', label: 'Parcialmente' },
  { value: 'pouco', label: 'Pouco' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_sei', label: 'Não sei avaliar' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'educacional', label: 'Educacional' },
  { value: 'dicas_praticas', label: 'Dicas práticas' },
  { value: 'opiniao_analise', label: 'Opinião/análise' },
  { value: 'bastidores', label: 'Bastidores' },
  { value: 'pessoal', label: 'Conteúdo pessoal' },
  { value: 'autoridade', label: 'Autoridade' },
  { value: 'explicacao_servicos', label: 'Explicação dos serviços' },
  { value: 'quebra_objecoes', label: 'Quebra de objeções' },
  { value: 'cases_resultados', label: 'Cases/resultados permitidos' },
  { value: 'convites_compra', label: 'Convites para compra/agendamento' },
  { value: 'entretenimento', label: 'Entretenimento' },
  { value: 'noticias_tendencias', label: 'Notícias/tendências' },
  { value: 'outro', label: 'Outro' },
];

const CTA_CLARITY_OPTIONS = [
  { value: 'sim_quase_sempre', label: 'Sim, quase sempre' },
  { value: 'boa_parte', label: 'Em boa parte dos conteúdos' },
  { value: 'as_vezes', label: 'Às vezes' },
  { value: 'raramente', label: 'Raramente' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_sei', label: 'Não sei' },
];

const CTA_OPTIONS = [
  { value: 'enviar_mensagem', label: 'Enviar mensagem' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'agendar', label: 'Agendar conversa/consulta' },
  { value: 'formulario', label: 'Preencher formulário' },
  { value: 'pagina_site', label: 'Acessar página/site' },
  { value: 'grupo_lista', label: 'Entrar em grupo/lista' },
  { value: 'comprar', label: 'Comprar diretamente' },
  { value: 'seguir', label: 'Seguir/acompanhar' },
  { value: 'outro', label: 'Outro' },
];

const RESULT_OPTIONS = [
  { value: 'visualizacoes', label: 'Visualizações' },
  { value: 'curtidas_comentarios', label: 'Curtidas/comentários' },
  { value: 'novos_seguidores', label: 'Novos seguidores' },
  { value: 'mensagens_conversas', label: 'Mensagens e conversas' },
  { value: 'leads', label: 'Leads/contatos interessados' },
  { value: 'agendamentos', label: 'Agendamentos' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'indicacoes', label: 'Indicações' },
  { value: 'pouco_resultado', label: 'Pouco resultado perceptível' },
  { value: 'nao_acompanho', label: 'Não acompanho' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'nao_sei_publicar', label: 'Não sei o que publicar' },
  { value: 'falta_tempo', label: 'Falta de tempo' },
  { value: 'producao_demora', label: 'Produção demora demais' },
  { value: 'nao_mantenho_frequencia', label: 'Não consigo manter frequência' },
  { value: 'nao_sei_transformar', label: 'Não sei transformar conhecimento em conteúdo' },
  { value: 'dificuldade_design', label: 'Tenho dificuldade com design' },
  { value: 'dificuldade_video', label: 'Tenho dificuldade com vídeo' },
  { value: 'nao_sei_vender', label: 'Não sei vender sem parecer insistente' },
  { value: 'produzo_sem_resultado', label: 'Produzo, mas não vejo resultado' },
  { value: 'nao_sei_medir', label: 'Não sei medir o que funciona' },
  { value: 'outro', label: 'Outro' },
];

const ETHICS_CONCERN_OPTIONS = [
  { value: 'frequentemente', label: 'Sim, frequentemente' },
  { value: 'algumas_vezes', label: 'Algumas vezes' },
  { value: 'raramente', label: 'Raramente' },
  { value: 'nao', label: 'Não' },
  { value: 'nao_sei_limites', label: 'Não sei quais são os limites' },
];

const ETHICS_INSECURITY_OPTIONS = [
  { value: 'resultados', label: 'Falar de resultados' },
  { value: 'depoimentos', label: 'Depoimentos' },
  { value: 'antes_depois', label: 'Antes e depois' },
  { value: 'promessas', label: 'Promessas' },
  { value: 'divulgacao_preco', label: 'Divulgação de preço' },
  { value: 'anuncios', label: 'Anúncios' },
  { value: 'uso_imagens', label: 'Uso de imagens' },
  { value: 'titulos_especialidades', label: 'Títulos/especialidades' },
  { value: 'parcerias', label: 'Parcerias' },
  { value: 'conteudo_educativo', label: 'Conteúdo educativo' },
  { value: 'outro', label: 'Outro' },
];

const VANITY_RESULTS = ['visualizacoes', 'curtidas_comentarios', 'novos_seguidores'];
const REVENUE_GOALS = ['faturamento', 'mais_clientes'];

const QUESTIONS = [
  {
    id: 'q1_canais',
    title: 'Canais utilizados',
    content: 'Em quais canais você se comunica profissionalmente hoje?',
    fields: [
      { id: 'communication_channels', label: 'Canais', type: 'multiselect', options: CHANNEL_OPTIONS, required: true },
      {
        id: 'communication_channels_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'communication_channels', includes: 'outro' },
      },
      { id: 'primary_communication_channel', label: 'Qual deles você considera seu principal canal hoje?', type: 'select', options: CHANNEL_OPTIONS, required: true },
    ],
  },
  {
    id: 'q2_frequencia',
    title: 'Frequência',
    content: 'Com que frequência você publica ou se comunica de forma planejada?',
    fields: [{ id: 'content_frequency', label: 'Frequência', type: 'select', options: FREQUENCY_OPTIONS, required: true }],
  },
  {
    id: 'q3_clareza',
    title: 'Clareza da mensagem',
    content:
      'Você acredita que alguém que acompanha sua comunicação entende rapidamente o que você faz, para quem e por que seu trabalho é diferente?',
    fields: [{ id: 'self_perceived_message_clarity', label: 'Clareza percebida', type: 'select', options: CLARITY_OPTIONS, required: true }],
  },
  {
    id: 'q4_tipo_conteudo',
    title: 'Tipo de conteúdo',
    content: 'Que tipos de conteúdo você produz com mais frequência?',
    fields: [
      { id: 'content_types', label: 'Tipos de conteúdo', type: 'multiselect', options: CONTENT_TYPE_OPTIONS, required: true },
      {
        id: 'content_types_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'content_types', includes: 'outro' },
      },
      {
        id: 'best_performing_content_types',
        label: 'Qual desses tipos costuma gerar mais interesse, conversas ou oportunidades?',
        type: 'multiselect',
        options: CONTENT_TYPE_OPTIONS,
        required: true,
      },
    ],
  },
  {
    id: 'q5_proxima_acao',
    title: 'Próxima ação',
    content:
      'Depois de consumir seu conteúdo, normalmente fica claro o que a pessoa deve fazer se quiser conhecer melhor ou contratar seu trabalho?',
    fields: [
      { id: 'cta_clarity', label: 'Clareza do próximo passo', type: 'select', options: CTA_CLARITY_OPTIONS, required: true },
      {
        id: 'primary_cta',
        label: 'Qual ação você costuma indicar?',
        type: 'select',
        options: CTA_OPTIONS,
        required: false,
        conditional: { field: 'cta_clarity', oneOf: ['sim_quase_sempre', 'boa_parte', 'as_vezes'] },
      },
      {
        id: 'primary_cta_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'primary_cta', equals: 'outro' },
      },
    ],
  },
  {
    id: 'q6_resultado',
    title: 'Resultado do conteúdo',
    content: 'Hoje, o que sua comunicação costuma gerar com mais frequência?',
    fields: [
      { id: 'content_results', label: 'Resultados', type: 'multiselect', options: RESULT_OPTIONS, required: true },
    ],
  },
  {
    id: 'q7_dificuldade',
    title: 'Maior dificuldade',
    content: 'Qual é sua maior dificuldade hoje para manter uma comunicação eficiente?',
    fields: [
      { id: 'main_content_difficulty', label: 'Maior dificuldade', type: 'select', options: DIFFICULTY_OPTIONS, required: true },
      {
        id: 'main_content_difficulty_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'main_content_difficulty', equals: 'outro' },
      },
    ],
  },
  {
    id: 'q8_seguranca',
    title: 'Segurança profissional',
    content: 'Existe algum tipo de conteúdo ou comunicação que você evita por medo de ultrapassar limites éticos ou profissionais da sua área?',
    fields: [
      { id: 'communication_ethics_concern', label: 'Insegurança', type: 'select', options: ETHICS_CONCERN_OPTIONS, required: true },
      {
        id: 'ethical_content_insecurities',
        label: 'Em quais situações você sente mais insegurança?',
        type: 'multiselect',
        options: ETHICS_INSECURITY_OPTIONS,
        required: false,
        conditional: { field: 'communication_ethics_concern', oneOf: ['frequentemente', 'algumas_vezes', 'raramente', 'nao_sei_limites'] },
      },
      {
        id: 'ethical_content_insecurities_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'ethical_content_insecurities', includes: 'outro' },
      },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 7 (seções 11 e 14, e
// o red flag em linha da Pergunta 6). As demais regras (01, 02, 03, 05)
// dependem de scores qualitativos de outros blocos (ex. block_03_score) ou
// de sinais agregados sem limite numérico especificado (ex. "conteúdo
// educacional dominante") — ficam pro Motor de IA.
function analyze(answers, context) {
  const derived = {
    channel_focus: answers.primary_communication_channel || null,
    cta_strength: answers.cta_clarity || null,
    ethical_insecurity_signal: answers.communication_ethics_concern || null,
  };
  const redFlags = [];

  const results = Array.isArray(answers.content_results) ? answers.content_results : [];
  const onlyVanity = results.length > 0 && results.every((r) => VANITY_RESULTS.includes(r));
  const twelveMonthGoal = (context && context.business_current && context.business_current.twelve_month_goal) || null;
  if (onlyVanity && REVENUE_GOALS.includes(twelveMonthGoal)) {
    redFlags.push({
      rule: 'atencao_sem_sinal_comercial',
      type: 'ALERTA',
      message: 'A comunicação está gerando atenção, mas ainda não existem sinais suficientes de avanço para oportunidades comerciais.',
    });
  }

  if (['falta_tempo', 'producao_demora'].includes(answers.main_content_difficulty)) {
    redFlags.push({
      rule: 'sobrecarga_de_producao',
      type: 'OPORTUNIDADE',
      message: 'Existe possível oportunidade de reduzir esforço operacional na produção sem necessariamente aumentar volume.',
      cross_with: ['ai', 'automation'],
    });
  }

  if (['frequentemente', 'algumas_vezes'].includes(answers.communication_ethics_concern) || answers.communication_ethics_concern === 'nao_sei_limites') {
    redFlags.push({
      rule: 'inseguranca_etica',
      type: 'ALERTA',
      message: 'Existem sinais de insegurança na comunicação profissional — a análise aprofundada acontece no bloco de Ética.',
      cross_with: ['ethics'],
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'communication', questions: QUESTIONS, analyze };
