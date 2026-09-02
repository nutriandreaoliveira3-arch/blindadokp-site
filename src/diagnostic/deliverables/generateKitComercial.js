// Entregável Premium — Kit Comercial Blindado. Enquanto a Landing Page
// Premium atrai, esse kit é pro momento de FECHAR a venda: cardápio de
// serviços, scripts de WhatsApp (abordagem, objeções reais que a cliente
// relatou no diagnóstico, fechamento) e uma mini-proposta pronta pra
// mandar. Gerado automaticamente junto com o relatório final (igual aos
// outros 4 entregáveis), a partir do Diagnóstico 360 — nunca inventa
// serviço ou preço que ela não tenha informado.
const { getClient } = require('../ai/client');

const MODEL = 'claude-sonnet-5';

// Vocabulário das duas perguntas de objeção do diagnóstico (Bloco 5 —
// Oferta, pergunta única; Bloco 9 — Vendas, multiescolha) — traduz o
// código salvo pra rótulo em português ANTES de mandar pra IA, pra ela
// nunca precisar adivinhar o que um value tipo "vai_pensar" significa.
const SALES_OBJECTION_LABELS = {
  caro: 'Está caro',
  preciso_pensar: 'Preciso pensar',
  falar_alguem: 'Preciso falar com alguém',
  sem_tempo: 'Não tenho tempo agora',
  comecar_depois: 'Quero começar depois',
  nao_sei_se_e_pra_mim: 'Não sei se é para mim',
  ja_tentei_outras: 'Já tentei outras soluções',
  comparar_opcoes: 'Quero comparar opções',
  medo_nao_resultado: 'Tenho medo de não conseguir o resultado',
  sem_necessidade_agora: 'Não vejo necessidade agora',
  poucas_objecoes: 'Poucas pessoas apresentam objeções',
  outro: 'Outro',
};

const OFFER_OBJECTION_LABELS = {
  price: 'Preço',
  nao_entende_valor: 'Não entende o valor',
  nao_percebe_urgencia: 'Não percebe urgência',
  duvida_se_funciona: 'Tem dúvida se funciona pra ela',
  compara_mais_baratas: 'Compara com alternativas mais baratas',
  falta_confianca: 'Falta de confiança',
  falta_tempo: 'Falta de tempo',
  precisa_conversar: 'Precisa conversar com outra pessoa',
  vai_pensar: 'Diz que vai pensar',
  nao_sei: 'Não sei',
  outro: 'Outro',
};

const PAYMENT_MODEL_LABELS = {
  a_vista: 'Somente à vista',
  a_vista_parcelado: 'À vista + parcelado',
  recorrencia: 'Mensalidade/recorrência',
  assinatura: 'Assinatura',
  entrada_parcelas: 'Entrada + parcelas',
  outra: 'Outra',
};

function translateObjections(values, labelMap) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values)].map((v) => labelMap[v] || v).filter(Boolean);
}

const OUTPUT_SCHEMA_DESCRIPTION = `Responda com um único objeto JSON, sem markdown, sem comentários, com exatamente estes campos:
{
  "sobre_mim": "string (texto institucional, 2 a 4 parágrafos, mais formal/completo que uma bio de Instagram — pra usar em proposta comercial, cardápio ou apresentação)",
  "cardapio_servicos": [
    { "nome": "string", "descricao": "string (1-2 frases)", "preco_texto": "string — ver regra de preço abaixo" }
  ],
  "script_abordagem_inicial": "string (mensagem de primeiro contato via WhatsApp, curta e natural, sem parecer robótica)",
  "scripts_objecao": [
    { "objecao": "string (a objeção real, como veio nos dados)", "resposta": "string (script de resposta pra essa objeção)" }
  ],
  "script_fechamento": "string (mensagem final de fechamento/CTA claro)",
  "mini_proposta": "string (texto de proposta/orçamento pronto pra copiar e mandar pro cliente dela — com o preço ou placeholder, ver regra abaixo)"
}`;

function buildPrompt(context) {
  const businessAnswers = context.answers_summary.business || {};
  const offerAnswers = context.answers_summary.offer || {};
  const salesAnswers = context.answers_summary.sales || {};
  const pricingAnswers = context.answers_summary.pricing || {};

  const offers = Array.isArray(businessAnswers.offers) ? businessAnswers.offers.filter((o) => o && o.offer_name) : [];

  const objections = [
    ...translateObjections([offerAnswers.main_offer_objection], OFFER_OBJECTION_LABELS),
    ...translateObjections(salesAnswers.sales_objections, SALES_OBJECTION_LABELS),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return `Você é redator(a) sênior de vendas consultivas pra profissionais da saúde regulados por conselho de classe — sem promessa de resultado, sem pressão agressiva, tom acolhedor e ético.

Monte o Kit Comercial Blindado dessa cliente específica — script de WhatsApp e material de venda — usando SÓ o que está nos dados abaixo. Nunca invente serviço, preço, resultado ou objeção que ela não tenha relatado.

DADOS DESSA CLIENTE:
${JSON.stringify(
  {
    profissao: businessAnswers.profession,
    positioning: context.answers_summary.positioning,
    differentiation: context.answers_summary.differentiation,
    reportHighlights: context.reportHighlights || {},
  },
  null,
  2
)}

DOSSIÊ DE POSICIONAMENTO (já gerado — reaproveite o tom e os fatos, não reescreva do zero):
${JSON.stringify(context.dossie || {}, null, 2)}

SERVIÇOS QUE ELA JÁ OFERECE (do diagnóstico — use SÓ esses, não invente outros):
${JSON.stringify(offers, null, 2)}
${offers.length === 0 ? '\n(Ela não cadastrou nenhum serviço no diagnóstico — nesse caso, "cardapio_servicos" deve vir como array vazio [], sem inventar nenhum serviço.)' : ''}

FORMA DE PAGAMENTO QUE ELA JÁ USA: ${PAYMENT_MODEL_LABELS[pricingAnswers.payment_model] || 'não informado'}

OBJEÇÕES REAIS QUE ELA RELATOU RECEBER (use exatamente essas, nem mais nem menos):
${JSON.stringify(objections, null, 2)}
${objections.length === 0 ? '\n(Ela não relatou nenhuma objeção específica — nesse caso, "scripts_objecao" deve vir como array vazio [].)' : ''}

REGRA DE PREÇO (campos "preco_texto" no cardápio e o valor citado em "mini_proposta"):
- Se o serviço tiver "offer_price" preenchido nos dados acima, use esse valor, sempre com o texto "a partir de R$ [valor] (aproximado)" — nunca apresente como preço fechado/final.
- Se não tiver "offer_price" (ou o serviço não tiver preço informado), escreva literalmente "[SEU VALOR AQUI]" — nunca invente um número.
- Em "mini_proposta", se pelo menos 1 serviço tiver preço real, pode citá-lo (com "aproximado"); senão, use "[SEU VALOR AQUI]" no lugar do valor.

OUTRAS REGRAS OBRIGATÓRIAS:
- Nunca prometa resultado clínico, financeiro ou de saúde específico, nem escreva como garantia.
- Scripts de WhatsApp: mensagens curtas, tom humano (não parecer copiado/robótico), sem emojis em excesso.
- Português do Brasil, direto.

${OUTPUT_SCHEMA_DESCRIPTION}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(candidate);
}

const REQUIRED_FIELDS = ['sobre_mim', 'cardapio_servicos', 'script_abordagem_inicial', 'scripts_objecao', 'script_fechamento', 'mini_proposta'];

function validate(output) {
  const errors = [];
  if (!output || typeof output !== 'object') return { valid: false, errors: ['resposta não é um objeto'] };
  REQUIRED_FIELDS.forEach((field) => {
    if (output[field] === undefined || output[field] === null) {
      errors.push(`campo obrigatório ausente: ${field}`);
    }
  });
  if (output.cardapio_servicos !== undefined && !Array.isArray(output.cardapio_servicos)) {
    errors.push('cardapio_servicos precisa ser um array');
  }
  if (output.scripts_objecao !== undefined && !Array.isArray(output.scripts_objecao)) {
    errors.push('scripts_objecao precisa ser um array');
  }
  const fullText = JSON.stringify(output);
  const priceMatches = [...fullText.matchAll(/R\$\s?[\d.,]+/g)];
  const suspiciousPrice = priceMatches.some((m) => {
    const context = fullText.slice(Math.max(0, m.index - 40), m.index + 40);
    return !/aproximado/i.test(context);
  });
  if (suspiciousPrice) errors.push('há um valor em R$ sem a marcação "(aproximado)" — pode ser preço inventado');
  return { valid: errors.length === 0, errors };
}

async function generateKitComercial(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildPrompt(context) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar o Kit Comercial Blindado.');
  }

  const parsed = extractJson(textBlock.text);
  const { valid, errors } = validate(parsed);
  if (!valid) {
    throw new Error('Kit Comercial Blindado gerado com problemas: ' + errors.join('; '));
  }
  return parsed;
}

module.exports = { generateKitComercial };
