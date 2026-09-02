// Motor de pontuação assistido por IA (Fase 9 — Scoring). Para cada
// dimensão de cada bloco que tem rubrica documentada (0-5 dado
// literalmente na especificação), pede pra IA aplicar EXATAMENTE os
// critérios já escritos pela Andréa às respostas já coletadas — a IA não
// decide o critério, só classifica a resposta dentro do critério dado.
// Depois dessa etapa, os scores viram dado read-only: o prompt final
// (finalDiagnosticPrompt.js) recebe os scores prontos e nunca os recalcula
// (ver "REGRA FUNDAMENTAL" da Etapa 20 do documento mestre).
const { getClient } = require('./client');
const { SCORE_RUBRICS } = require('../scoring/rubrics');

const MODEL = 'claude-sonnet-5';

function buildRubricPrompt(blockContext) {
  const blocksPayload = {};
  const expectedFields = {};

  for (const [blockId, rubric] of Object.entries(SCORE_RUBRICS)) {
    const context = blockContext[blockId];
    if (!context) continue; // bloco ainda não respondido — não pontuar
    blocksPayload[blockId] = {
      block_name: rubric.name,
      answers: context.answers || {},
      derived_data: context.derived || {},
      red_flags: context.red_flags || [],
      dimensions: rubric.dimensions.map((d) => ({
        field: d.field,
        label: d.label,
        levels: d.criteria,
        note: d.note || undefined,
      })),
    };
    expectedFields[blockId] = rubric.dimensions.map((d) => d.field);
  }

  return { blocksPayload, expectedFields };
}

const SYSTEM_PROMPT = `Você é um avaliador técnico e objetivo. Sua única função é aplicar rubricas de 0 a 5 já definidas às respostas de um diagnóstico de negócio, exatamente como especificado.

REGRAS OBRIGATÓRIAS:
1. Para cada dimensão de cada bloco recebido, escolha o nível (0 a 5) cujo texto descreve melhor a situação encontrada nas respostas (answers), nos dados derivados (derived_data) e nos alertas (red_flags) daquele bloco.
2. Use SOMENTE as informações fornecidas. Nunca invente fatos, números ou situações que não estejam nos dados recebidos.
3. Se não houver informação suficiente nas respostas para escolher um nível com segurança, responda null para aquela dimensão. Não adivinhe.
4. Cada bloco deve ser avaliado usando apenas os dados daquele bloco (mais o contexto geral do negócio, se ajudar a calibrar), nunca inventando dados de outro bloco que não foram enviados.
5. Se uma dimensão tiver uma "note" explicando um caso especial (ex: "se o custo não é conhecido, retorne null"), siga essa instrução à risca.
6. Responda SOMENTE com um objeto JSON válido, sem markdown, sem comentários, sem texto antes ou depois. Formato exato:
{
  "<block_id>": { "<dimension_field>": <0-5 ou null>, ... },
  ...
}
7. Não adicione blocos, dimensões ou chaves que não foram pedidos. Não omita nenhum bloco ou dimensão pedidos.`;

function buildUserPrompt(blocksPayload) {
  return `Avalie as dimensões abaixo aplicando as rubricas fornecidas. Responda apenas com o JSON no formato pedido.

DADOS:
${JSON.stringify(blocksPayload, null, 2)}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(candidate);
}

// Valida e limpa a resposta da IA: só aceita blocos/campos esperados, só
// aceita números inteiros 0-5 ou null — qualquer outra coisa vira null em
// vez de propagar um valor inventado ou fora do intervalo.
function sanitizeScores(raw, expectedFields) {
  const clean = {};
  for (const [blockId, fields] of Object.entries(expectedFields)) {
    clean[blockId] = {};
    const rawBlock = raw && typeof raw === 'object' ? raw[blockId] : null;
    for (const field of fields) {
      const value = rawBlock && typeof rawBlock === 'object' ? rawBlock[field] : undefined;
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5) {
        clean[blockId][field] = value;
      } else {
        clean[blockId][field] = null;
      }
    }
  }
  return clean;
}

// blockContext: { [blockId]: { answers, derived, red_flags } } — só os
// blocos que já têm rubrica documentada (ver SCORE_RUBRICS) e que já foram
// respondidos precisam estar aqui.
async function scoreDiagnosticBlocks(blockContext) {
  const { blocksPayload, expectedFields } = buildRubricPrompt(blockContext);

  if (Object.keys(blocksPayload).length === 0) {
    return {};
  }

  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'low' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(blocksPayload) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao pontuar os blocos.');
  }

  let parsed;
  try {
    parsed = extractJson(textBlock.text);
  } catch (err) {
    throw new Error('A IA não retornou um JSON válido ao pontuar os blocos: ' + err.message);
  }

  return sanitizeScores(parsed, expectedFields);
}

module.exports = { scoreDiagnosticBlocks, buildRubricPrompt, sanitizeScores };
