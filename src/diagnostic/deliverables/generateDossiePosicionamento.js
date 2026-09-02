// Entregável Premium — Dossiê de Posicionamento Blindado™. Documento
// estruturado com o posicionamento da cliente, gerado a partir do
// Diagnóstico 360 dela (nunca inventado do zero — usa o que ela já
// respondeu + o que o relatório final já concluiu). Campos definidos pela
// Andréa (RESUMO ESTRATÉGICO — item 8.1).
const { getClient } = require('../ai/client');

const MODEL = 'claude-sonnet-5';

const OUTPUT_SCHEMA_DESCRIPTION = `Responda com um único objeto JSON, sem markdown, sem comentários, com exatamente estes campos (todos string, exceto pilares_autoridade que é array de 3 a 5 strings):
{
  "nicho": "string",
  "especialidade": "string",
  "posicionamento": "string",
  "publico": "string",
  "problema_principal": "string",
  "diferenciacao": "string",
  "proposta_valor": "string",
  "mensagem_central": "string",
  "pilares_autoridade": ["string", "string", "string"],
  "linguagem": "string",
  "bio": "string (pronta pra colar no Instagram, até 150 caracteres)",
  "pitch": "string (pitch curto, 2-3 frases, pra ela se apresentar)",
  "direcionamento_marca": "string"
}`;

function buildPrompt(context) {
  return `Você é redator(a) sênior de posicionamento de marca pessoal pra profissionais da saúde regulados por conselho de classe.

Monte o Dossiê de Posicionamento Blindado dessa cliente específica, usando SÓ o que está nos dados abaixo — nunca invente dado, número, prêmio, cliente ou resultado que não esteja aqui. Se faltar informação pra preencher algum campo com segurança, escreva algo genérico mas honesto (ex.: "a definir com mais detalhe") em vez de inventar.

DIAGNÓSTICO — RESUMO GERAL:
${JSON.stringify({ business_stage: context.business_stage, general_score: context.general_score, twelve_month_goal: context.twelve_month_goal }, null, 2)}

RESPOSTAS — NEGÓCIO ATUAL, PÚBLICO, POSICIONAMENTO, DIFERENCIAÇÃO, OFERTA:
${JSON.stringify(
  {
    business: context.answers_summary.business,
    audience: context.answers_summary.audience,
    positioning: context.answers_summary.positioning,
    differentiation: context.answers_summary.differentiation,
    offer: context.answers_summary.offer,
  },
  null,
  2
)}

GARGALO E OPORTUNIDADE (do relatório final, se disponível):
${JSON.stringify(context.reportHighlights || {}, null, 2)}

${OUTPUT_SCHEMA_DESCRIPTION}

Nunca prometa resultado clínico, financeiro ou de saúde específico em nenhum campo — isso é regra ética, não estilística. Português do Brasil, direto, sem jargão de marketing vazio.`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(candidate);
}

const REQUIRED_FIELDS = [
  'nicho',
  'especialidade',
  'posicionamento',
  'publico',
  'problema_principal',
  'diferenciacao',
  'proposta_valor',
  'mensagem_central',
  'pilares_autoridade',
  'linguagem',
  'bio',
  'pitch',
  'direcionamento_marca',
];

function validate(output) {
  const errors = [];
  if (!output || typeof output !== 'object') return { valid: false, errors: ['resposta não é um objeto'] };
  REQUIRED_FIELDS.forEach((field) => {
    if (output[field] === undefined || output[field] === null || output[field] === '') {
      errors.push(`campo obrigatório ausente: ${field}`);
    }
  });
  if (output.pilares_autoridade && !Array.isArray(output.pilares_autoridade)) {
    errors.push('pilares_autoridade precisa ser um array');
  }
  return { valid: errors.length === 0, errors };
}

async function generateDossiePosicionamento(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildPrompt(context) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar o Dossiê de Posicionamento.');
  }

  const parsed = extractJson(textBlock.text);
  const { valid, errors } = validate(parsed);
  if (!valid) {
    throw new Error('Dossiê de Posicionamento gerado com campos inválidos: ' + errors.join('; '));
  }
  return parsed;
}

module.exports = { generateDossiePosicionamento };
