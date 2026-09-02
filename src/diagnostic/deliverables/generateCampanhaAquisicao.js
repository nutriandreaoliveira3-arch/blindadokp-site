// Entregável Premium — Campanha de Aquisição Pronta. Pacote de tráfego pago
// pronto pra rodar (Meta Ads): descrição de público-alvo, 3-4 variações de
// anúncio (gancho + corpo + CTA + briefing de criativo) — gerado a partir
// do Diagnóstico 360, reaproveitando o Dossiê já gerado. Nunca inventa
// dado de público, canal ou orçamento que a cliente não tenha informado.
const { getClient } = require('../ai/client');

const MODEL = 'claude-sonnet-5';

const AD_SPEND_LABELS = {
  ate_500: 'até R$500/mês',
  '501_1500': 'R$501–1.500/mês',
  '1501_3000': 'R$1.501–3.000/mês',
  '3001_5000': 'R$3.001–5.000/mês',
  '5001_10000': 'R$5.001–10.000/mês',
  acima_10000: 'acima de R$10.000/mês',
  varia_muito: 'varia muito',
  prefiro_nao_informar: 'não informado',
};

const PREVIOUS_ATTEMPTS_LABELS = {
  resolver_sozinhas: 'tentar resolver sozinhas',
  conteudos_gratuitos: 'conteúdos gratuitos',
  outros_profissionais: 'outros profissionais',
  produtos_mais_baratos: 'produtos ou serviços mais baratos',
  apps_ferramentas: 'aplicativos/ferramentas',
  cursos_programas: 'cursos/programas',
  solucoes_alternativas: 'soluções alternativas',
  nao_sei: 'não sabe',
  outro: 'outro',
};

function translate(values, labelMap) {
  if (!values) return [];
  const arr = Array.isArray(values) ? values : [values];
  return [...new Set(arr)].map((v) => labelMap[v] || v).filter(Boolean);
}

const OUTPUT_SCHEMA_DESCRIPTION = `Responda com um único objeto JSON, sem markdown, sem comentários, com exatamente estes campos:
{
  "publico_alvo": "string (descrição do público-alvo pronta pra configurar no Gerenciador de Anúncios — perfil, dor, momento de busca)",
  "orcamento_texto": "string (nota sobre orçamento — ver regra abaixo, nunca um valor exato inventado)",
  "variacoes_anuncio": [
    { "gancho": "string (primeira linha, pra prender atenção nos 3 primeiros segundos)", "corpo": "string (texto do anúncio, 2-4 frases)", "cta": "string (chamada pra ação curta)", "briefing_criativo": "string (o que a imagem/vídeo do anúncio deveria mostrar — pra ela ou um designer executar, nunca uma imagem pronta)" }
  ]
}`;

function buildPrompt(context) {
  const businessAnswers = context.answers_summary.business || {};
  const audienceAnswers = context.answers_summary.audience || {};
  const acquisitionAnswers = context.answers_summary.acquisition || {};

  const previousAttempts = translate(audienceAnswers.previous_attempts, PREVIOUS_ATTEMPTS_LABELS);
  const adSpendLabel = AD_SPEND_LABELS[acquisitionAnswers.monthly_ad_spend_range] || null;

  return `Você é estrategista de tráfego pago sênior, especializado em Meta Ads pra profissionais da saúde regulados por conselho de classe — sem promessa de resultado clínico/financeiro, sem alarmismo, sem "antes e depois" fabricado.

Monte a Campanha de Aquisição Pronta dessa cliente específica — descrição de público + variações de anúncio pra Meta Ads — usando SÓ o que está nos dados abaixo. Nunca invente dado de público, canal, orçamento ou resultado que não esteja aqui.

DADOS DESSA CLIENTE:
${JSON.stringify(
  {
    profissao: businessAnswers.profession,
    positioning: context.answers_summary.positioning,
    differentiation: context.answers_summary.differentiation,
    offer: context.answers_summary.offer,
    reportHighlights: context.reportHighlights || {},
  },
  null,
  2
)}

DOSSIÊ DE POSICIONAMENTO (já gerado — reaproveite o tom e os fatos, não reescreva do zero):
${JSON.stringify(context.dossie || {}, null, 2)}

PÚBLICO-ALVO (respostas reais do diagnóstico — Bloco Público e Cliente Ideal):
${JSON.stringify(
  {
    perfil_buscado: audienceAnswers.specialty_seeking_profile,
    problema_principal: audienceAnswers.primary_client_problem,
    momento_da_busca: audienceAnswers.seeking_trigger,
    perfil_ideal: audienceAnswers.best_fit_description,
    ja_tentaram_antes: previousAttempts,
    perfil_prioritario: audienceAnswers.priority_profile,
  },
  null,
  2
)}

CANAIS E ORÇAMENTO ATUAIS (Bloco Marketing e Aquisição — use só se ajudar a calibrar, nunca invente um valor de orçamento):
${JSON.stringify(
  {
    canais_que_ja_usa: acquisitionAnswers.acquisition_channels,
    maior_dificuldade_hoje: acquisitionAnswers.perceived_acquisition_bottleneck,
    faixa_de_investimento_atual: adSpendLabel,
  },
  null,
  2
)}

REGRA DE ORÇAMENTO ("orcamento_texto"):
- Se "faixa_de_investimento_atual" tiver um valor real acima, use essa faixa como referência (ex.: "com a faixa que você já investe hoje, dá pra testar 2-3 públicos diferentes").
- Se não tiver informado (null, "não informado" ou "varia muito"), escreva algo genérico e honesto tipo "defina o orçamento diário com base no que você pode investir agora — comece testando com um valor confortável e ajuste depois", SEM sugerir nenhum número específico em reais.

OUTRAS REGRAS OBRIGATÓRIAS:
- 3 a 4 variações de anúncio, cada uma com um ângulo diferente (ex.: uma focada na dor, outra na transformação/método, outra numa objeção comum) — sempre a partir do que está nos dados, nunca um ângulo inventado do zero.
- "briefing_criativo": só descreve o QUE mostrar (cena, elemento, sensação) — nunca gera uma imagem, nunca referencia uma foto real da cliente.
- Nunca prometa resultado clínico, financeiro ou de saúde específico, nem escreva como garantia — isso é regra ética, não estilística.
- Português do Brasil, direto, sem jargão de marketing vazio.

${OUTPUT_SCHEMA_DESCRIPTION}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(candidate);
}

function validate(output) {
  const errors = [];
  if (!output || typeof output !== 'object') return { valid: false, errors: ['resposta não é um objeto'] };
  if (!output.publico_alvo) errors.push('campo obrigatório ausente: publico_alvo');
  if (!output.orcamento_texto) errors.push('campo obrigatório ausente: orcamento_texto');
  if (!Array.isArray(output.variacoes_anuncio)) {
    errors.push('variacoes_anuncio precisa ser um array');
  } else {
    if (output.variacoes_anuncio.length < 2) errors.push('variacoes_anuncio tem menos de 2 variações — provavelmente incompleto');
    output.variacoes_anuncio.forEach((v, i) => {
      ['gancho', 'corpo', 'cta', 'briefing_criativo'].forEach((field) => {
        if (!v || !v[field]) errors.push(`variacoes_anuncio[${i}].${field} é obrigatório`);
      });
    });
  }
  const fullText = JSON.stringify(output);
  if (/\bsrc\s*=\s*["']https?:\/\//i.test(fullText) || /\.(jpg|jpeg|png|webp)["']/i.test(fullText)) {
    errors.push('resposta referencia uma imagem/arquivo real — não é permitido (briefing de criativo é só texto)');
  }
  return { valid: errors.length === 0, errors };
}

async function generateCampanhaAquisicao(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildPrompt(context) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar a Campanha de Aquisição Pronta.');
  }

  const parsed = extractJson(textBlock.text);
  const { valid, errors } = validate(parsed);
  if (!valid) {
    throw new Error('Campanha de Aquisição Pronta gerada com problemas: ' + errors.join('; '));
  }
  return parsed;
}

module.exports = { generateCampanhaAquisicao };
