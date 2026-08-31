// BLOCO 8 — MARKETING E AQUISIÇÃO
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 08 — MARKETING E AQUISIÇÃO").

const SOURCE_OPTIONS = [
  { value: 'indicacoes', label: 'Indicações' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google' },
  { value: 'site_blog', label: 'Site/blog' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'trafego_pago', label: 'Tráfego pago' },
  { value: 'eventos_parcerias', label: 'Eventos/parcerias' },
  { value: 'marketplace', label: 'Marketplace/plataforma' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_sei', label: 'Não sei' },
];

const ACQUISITION_CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google' },
  { value: 'site_blog', label: 'Site/blog' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'trafego_pago', label: 'Tráfego pago' },
  { value: 'indicacoes_estruturadas', label: 'Indicações estruturadas' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'parcerias', label: 'Parcerias' },
  { value: 'prospeccao_ativa', label: 'Prospecção ativa' },
  { value: 'outro', label: 'Outro' },
  { value: 'nenhum_planejado', label: 'Nenhum de forma planejada' },
];

const ATTRIBUTION_OPTIONS = [
  { value: 'acompanho_tudo', label: 'Sim, acompanho contatos e vendas por canal' },
  { value: 'sei_aproximadamente', label: 'Sei aproximadamente' },
  { value: 'sei_contatos_nao_vendas', label: 'Sei quais geram contatos, mas não vendas' },
  { value: 'apenas_percepcao', label: 'Tenho apenas percepção' },
  { value: 'nao_consigo_identificar', label: 'Não consigo identificar' },
  { value: 'nao_acompanho', label: 'Não acompanho' },
];

const FUNNEL_OPTIONS = [
  { value: 'funil_claro', label: 'Sim, existe um funil claro' },
  { value: 'caminho_pouco_estruturado', label: 'Existe um caminho, mas ainda é pouco estruturado' },
  { value: 'cada_cliente_diferente', label: 'Cada cliente chega de uma forma' },
  { value: 'depende_whatsapp', label: 'Depende principalmente de conversa no WhatsApp/Direct' },
  { value: 'sem_processo', label: 'Não existe um processo definido' },
  { value: 'nao_sei', label: 'Não sei' },
];

const INTEREST_RANGE_OPTIONS = [
  { value: 'nenhuma', label: 'Nenhuma ou quase nenhuma' },
  { value: '1_5', label: '1–5' },
  { value: '6_10', label: '6–10' },
  { value: '11_20', label: '11–20' },
  { value: '21_50', label: '21–50' },
  { value: '51_100', label: '51–100' },
  { value: 'mais_100', label: 'Mais de 100' },
  { value: 'nao_sei', label: 'Não sei' },
];

const NEW_CUSTOMERS_RANGE_OPTIONS = [
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: '1_2', label: '1–2' },
  { value: '3_5', label: '3–5' },
  { value: '6_10', label: '6–10' },
  { value: '11_20', label: '11–20' },
  { value: 'mais_20', label: 'Mais de 20' },
  { value: 'nao_sei', label: 'Não sei' },
];

const PAID_TRAFFIC_STATUS_OPTIONS = [
  { value: 'continuo', label: 'Sim, continuamente' },
  { value: 'periodos', label: 'Sim, em alguns períodos' },
  { value: 'parei', label: 'Já investi, mas parei' },
  { value: 'nunca', label: 'Nunca investi' },
  { value: 'pretendo', label: 'Pretendo começar em breve' },
];

const AD_SPEND_OPTIONS = [
  { value: 'ate_500', label: 'Até R$500' },
  { value: '501_1500', label: 'R$501–1.500' },
  { value: '1501_3000', label: 'R$1.501–3.000' },
  { value: '3001_5000', label: 'R$3.001–5.000' },
  { value: '5001_10000', label: 'R$5.001–10.000' },
  { value: 'acima_10000', label: 'Acima de R$10.000' },
  { value: 'varia_muito', label: 'Varia muito' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
];

const TRACKING_LEVEL_OPTIONS = [
  { value: 'sim', label: 'Sim' },
  { value: 'aproximadamente', label: 'Aproximadamente' },
  { value: 'so_leads', label: 'Só acompanho leads' },
  { value: 'nao', label: 'Não' },
];

const OTHER_STRATEGIES_OPTIONS = [
  { value: 'programa_indicacao', label: 'Programa de indicação' },
  { value: 'parcerias_profissionais', label: 'Parcerias profissionais' },
  { value: 'eventos_palestras', label: 'Eventos/palestras' },
  { value: 'networking', label: 'Networking' },
  { value: 'prospeccao_ativa', label: 'Prospecção ativa' },
  { value: 'email_marketing', label: 'E-mail marketing' },
  { value: 'seo_google', label: 'SEO/Google' },
  { value: 'comunidade_grupo', label: 'Comunidade/grupo' },
  { value: 'afiliados', label: 'Afiliados/parceiros comerciais' },
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: 'outra', label: 'Outra' },
];

const BOTTLENECK_OPTIONS = [
  { value: 'poucas_pessoas_conhecem', label: 'Poucas pessoas conhecem meu trabalho' },
  { value: 'alcance_poucos_contatos', label: 'Tenho alcance, mas poucos contatos interessados' },
  { value: 'contatos_poucos_clientes', label: 'Recebo contatos, mas poucos viram clientes' },
  { value: 'dependo_indicacao', label: 'Dependo muito de indicação' },
  { value: 'nao_sei_canais', label: 'Não sei quais canais funcionam' },
  { value: 'nao_mantenho_constante', label: 'Não consigo manter aquisição constante' },
  { value: 'trafego_sem_retorno', label: 'Tráfego pago não gera retorno claro' },
  { value: 'sem_estrategia', label: 'Não tenho estratégia definida' },
  { value: 'capacidade_no_limite', label: 'Minha capacidade já está próxima do limite' },
  { value: 'nao_e_problema', label: 'Não considero aquisição meu principal problema' },
  { value: 'outro', label: 'Outro' },
];

const WEAK_ATTRIBUTION = ['apenas_percepcao', 'nao_consigo_identificar', 'nao_acompanho'];
const HAS_AD_SPEND = ['continuo', 'periodos', 'parei'];

const QUESTIONS = [
  {
    id: 'q1_origem',
    title: 'Origem dos clientes',
    content: 'De onde vêm a maior parte dos seus clientes atualmente? (até 3)',
    fields: [
      { id: 'customer_sources', label: 'Origens', type: 'multiselect', options: SOURCE_OPTIONS, required: true, maxSelect: 3 },
      {
        id: 'customer_sources_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'customer_sources', includes: 'outro' },
      },
      { id: 'primary_customer_source', label: 'Qual dessas fontes traz mais clientes hoje?', type: 'select', options: SOURCE_OPTIONS, required: true },
    ],
  },
  {
    id: 'q2_canais',
    title: 'Canais de aquisição utilizados',
    content: 'Quais canais você utiliza intencionalmente para atrair novos clientes?',
    fields: [
      { id: 'acquisition_channels', label: 'Canais', type: 'multiselect', options: ACQUISITION_CHANNEL_OPTIONS, required: true },
      {
        id: 'acquisition_channels_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'acquisition_channels', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q3_sabe_o_que_funciona',
    title: 'Sabe o que funciona?',
    content: 'Você consegue identificar quais canais realmente geram contatos interessados e vendas?',
    fields: [{ id: 'channel_attribution_level', label: 'Nível de acompanhamento', type: 'select', options: ATTRIBUTION_OPTIONS, required: true }],
  },
  {
    id: 'q4_caminho',
    title: 'Caminho até a compra',
    content: 'Existe hoje um caminho definido entre a pessoa conhecer você e se tornar cliente?',
    fields: [{ id: 'acquisition_funnel_maturity', label: 'Maturidade do funil', type: 'select', options: FUNNEL_OPTIONS, required: true }],
  },
  {
    id: 'q5_volume',
    title: 'Volume de oportunidades',
    content: 'Em média, quantas pessoas realmente interessadas entram em contato com você por mês?',
    fields: [
      { id: 'monthly_qualified_interest_range', label: 'Interessados por mês', type: 'select', options: INTEREST_RANGE_OPTIONS, required: true },
      {
        id: 'monthly_new_customers_range',
        label: 'E aproximadamente quantas se tornam clientes?',
        type: 'select',
        options: NEW_CUSTOMERS_RANGE_OPTIONS,
        required: true,
      },
    ],
  },
  {
    id: 'q6_trafego_pago',
    title: 'Tráfego pago',
    content: 'Você investe atualmente em anúncios pagos?',
    fields: [
      { id: 'paid_traffic_status', label: 'Investe em anúncios', type: 'select', options: PAID_TRAFFIC_STATUS_OPTIONS, required: true },
      {
        id: 'monthly_ad_spend_range',
        label: 'Qual é aproximadamente o investimento mensal?',
        type: 'select',
        options: AD_SPEND_OPTIONS,
        required: false,
        conditional: { field: 'paid_traffic_status', oneOf: HAS_AD_SPEND },
      },
      {
        id: 'paid_traffic_tracking_level',
        label: 'Você sabe quantos contatos ou vendas esse investimento gera?',
        type: 'select',
        options: TRACKING_LEVEL_OPTIONS,
        required: false,
        conditional: { field: 'paid_traffic_status', oneOf: HAS_AD_SPEND },
      },
    ],
  },
  {
    id: 'q7_outras_formas',
    title: 'Outras formas de aquisição',
    content: 'Além das redes sociais e anúncios, você utiliza alguma estratégia para gerar novos clientes?',
    fields: [
      { id: 'additional_acquisition_strategies', label: 'Estratégias', type: 'multiselect', options: OTHER_STRATEGIES_OPTIONS, required: true },
      {
        id: 'additional_acquisition_strategies_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'additional_acquisition_strategies', includes: 'outra' },
      },
    ],
  },
  {
    id: 'q8_gargalo',
    title: 'Gargalo percebido de aquisição',
    content: 'Qual dessas situações melhor descreve sua maior dificuldade para atrair novos clientes?',
    fields: [
      { id: 'perceived_acquisition_bottleneck', label: 'Maior dificuldade', type: 'select', options: BOTTLENECK_OPTIONS, required: true },
      {
        id: 'perceived_acquisition_bottleneck_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'perceived_acquisition_bottleneck', equals: 'outro' },
      },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 8 (seções 11 e 14, e
// o red flag em linha da Pergunta 3). A ocupação vem recalculada a partir
// das respostas do Bloco 1 (mesma fórmula já usada lá, sem inventar nada
// novo) porque o contexto entre blocos só carrega respostas, não os dados
// já derivados de cada bloco. As demais regras (01, 02, 06, 07) dependem de
// scores qualitativos de outros blocos — ficam pro Motor de IA.
function analyze(answers, context) {
  const derived = {
    primary_acquisition_source: answers.primary_customer_source || null,
    acquisition_bottleneck_hypothesis: answers.perceived_acquisition_bottleneck || null,
  };
  const redFlags = [];

  if (WEAK_ATTRIBUTION.includes(answers.channel_attribution_level)) {
    redFlags.push({
      rule: 'sem_identificar_origem',
      type: 'ALERTA',
      message: 'Sem identificar a origem das oportunidades e vendas, fica difícil decidir onde aumentar ou reduzir investimento.',
    });
  }

  const businessAnswers = (context && context.business_current) || {};
  const current = Number(businessAnswers.current_clients_month);
  const max = Number(businessAnswers.max_clients_capacity);
  if (Number.isFinite(current) && Number.isFinite(max) && max > 0) {
    const occupancyRate = Math.round((current / max) * 100 * 10) / 10;
    derived.occupancy_rate_reference = occupancyRate;
    if (occupancyRate >= 85) {
      redFlags.push({
        rule: 'capacidade_proxima_do_limite',
        type: 'ALERTA',
        message:
          'Sua operação já está próxima da capacidade atual. Antes de atrair significativamente mais clientes, precisamos avaliar como esse crescimento seria absorvido.',
        cross_with: ['pricing', 'operations'],
      });
    }
  }

  if (HAS_AD_SPEND.includes(answers.paid_traffic_status) && answers.paid_traffic_tracking_level === 'nao') {
    redFlags.push({
      rule: 'trafego_pago_sem_rastreamento',
      type: 'ALERTA',
      message: 'Existe investimento em mídia sem rastreamento suficiente para saber se ele gera oportunidades ou vendas.',
    });
  }

  const channelsCount = Array.isArray(answers.acquisition_channels) ? answers.acquisition_channels.length : 0;
  if (channelsCount >= 5 && WEAK_ATTRIBUTION.includes(answers.channel_attribution_level)) {
    redFlags.push({
      rule: 'muitos_canais_pouco_controle',
      type: 'OPORTUNIDADE',
      message: 'Antes de adicionar novos canais, existe oportunidade de identificar quais dos atuais realmente merecem investimento.',
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'acquisition', questions: QUESTIONS, analyze };
