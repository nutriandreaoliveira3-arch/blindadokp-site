// Entregável Premium — Manual de Comunicação Ética da Marca™. Personalizado
// por profissão/conselho de classe da cliente, usando as mesmas referências
// reais de resolução que já alimentam o Bloco 13 (Ética) do Diagnóstico —
// ver PROFESSION_ETHICS_CONTENT em blocks/ethics.js. Nunca inventa regra de
// conselho — quando não tem certeza, orienta a cliente a confirmar direto
// com o conselho dela (mesma regra usada em toda a Skill Blindada Pro).
const { getClient } = require('../ai/client');
const { PROFESSION_ETHICS_CONTENT } = require('../blocks/ethics');
const { PROFESSION_CATEGORY_OPTIONS } = require('../blocks/business_current');

const MODEL = 'claude-sonnet-5';

const PROFESSION_LABELS = new Map(PROFESSION_CATEGORY_OPTIONS.map((p) => [p.value, p.label]));

const OUTPUT_SCHEMA_DESCRIPTION = `Responda com um único objeto JSON, sem markdown, sem comentários, com exatamente estes campos (string, exceto os marcados como array):
{
  "o_que_pode_comunicar": "string",
  "pontos_atencao": ["string", "..."],
  "linguagem_risco": ["string", "..."],
  "divulgacao_resultados": "string",
  "depoimentos": "string",
  "antes_depois": "string",
  "anuncios": "string",
  "promocoes": "string",
  "bio": "string",
  "publicidade": "string",
  "titulos_especialidades": "string",
  "identificacao_profissional": "string",
  "disclaimers": ["string", "..."],
  "regras_redes_sociais": ["string", "..."],
  "nota_atualizacao": "string (lembrete de que as normas oficiais do conselho sempre prevalecem e mudam com o tempo)"
}`;

function buildPrompt({ professionKey, professionLabel, referenceHint, uncertaintyAreas, redFlags }) {
  return `Você é especialista em comunicação ética pra profissionais de saúde regulados por conselho de classe.

Monte o Manual de Comunicação Ética da Marca dessa cliente específica — profissão: ${professionLabel || 'não informada'}.

${referenceHint ? `Referência oficial conhecida pra essa profissão:${referenceHint}` : 'Não temos referência oficial levantada pra essa profissão ainda — seja mais conservador(a) e genérico(a), e deixe claro na nota_atualizacao que ela precisa confirmar direto com o conselho dela.'}

Áreas em que ela mesma disse ter mais dúvida/insegurança na divulgação:
${JSON.stringify(uncertaintyAreas || [], null, 2)}

Alertas identificados no diagnóstico dela sobre ética:
${JSON.stringify(redFlags || [], null, 2)}

${OUTPUT_SCHEMA_DESCRIPTION}

Regras gerais que valem pra qualquer conselho, sempre inclua como base:
- Nunca prometer resultado específico ou prazo garantido.
- Nunca garantir cura, êxito ou eficácia como certeza.
- Nunca usar depoimento de paciente/cliente sem consentimento explícito.
- Nunca fazer comparação depreciativa com outros profissionais.
- Preferir descrever método e processo, nunca prometer o resultado.

As normas oficiais do conselho dela sempre prevalecem sobre este manual, e mudam com o tempo — deixe isso explícito no campo nota_atualizacao. Nunca afirme que algo é permitido sem ter certeza; quando não tiver certeza, oriente a confirmar direto com o conselho. Português do Brasil, direto, sem jargão técnico.`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(candidate);
}

const REQUIRED_FIELDS = [
  'o_que_pode_comunicar',
  'pontos_atencao',
  'linguagem_risco',
  'divulgacao_resultados',
  'depoimentos',
  'antes_depois',
  'anuncios',
  'promocoes',
  'bio',
  'publicidade',
  'titulos_especialidades',
  'identificacao_profissional',
  'disclaimers',
  'regras_redes_sociais',
  'nota_atualizacao',
];
const ARRAY_FIELDS = new Set(['pontos_atencao', 'linguagem_risco', 'disclaimers', 'regras_redes_sociais']);

function validate(output) {
  const errors = [];
  if (!output || typeof output !== 'object') return { valid: false, errors: ['resposta não é um objeto'] };
  REQUIRED_FIELDS.forEach((field) => {
    if (output[field] === undefined || output[field] === null || output[field] === '') {
      errors.push(`campo obrigatório ausente: ${field}`);
      return;
    }
    if (ARRAY_FIELDS.has(field) && !Array.isArray(output[field])) {
      errors.push(`${field} precisa ser um array`);
    }
  });
  return { valid: errors.length === 0, errors };
}

// context: saída de buildAiContext.js. redFlags: os red_flags do bloco de
// ética dessa cliente (deterministic_flags filtrados por área ethics).
async function generateManualEtica(context) {
  const businessAnswers = context.answers_summary.business || {};
  const ethicsAnswers = context.answers_summary.ethics || {};
  const professionKey = businessAnswers.profession_category;
  const professionLabel = PROFESSION_LABELS.get(professionKey) || businessAnswers.profession || null;
  const professionContent = PROFESSION_ETHICS_CONTENT[professionKey];
  const redFlags = (context.deterministic_flags || []).filter((f) => f.area === 'ethics');

  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: 'medium' },
    messages: [
      {
        role: 'user',
        content: buildPrompt({
          professionKey,
          professionLabel,
          referenceHint: professionContent ? professionContent.referenceHint : null,
          uncertaintyAreas: ethicsAnswers.ethical_uncertainty_areas,
          redFlags,
        }),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar o Manual de Comunicação Ética.');
  }

  const parsed = extractJson(textBlock.text);
  const { valid, errors } = validate(parsed);
  if (!valid) {
    throw new Error('Manual de Comunicação Ética gerado com campos inválidos: ' + errors.join('; '));
  }
  return parsed;
}

module.exports = { generateManualEtica };
