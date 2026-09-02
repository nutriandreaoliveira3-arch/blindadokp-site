// Fase 14 — Master Prompt. Monta o prompt dinâmico (Etapa 19, seção 4) com
// os dados do contexto (Fase 13) e chama a IA pra gerar o Diagnóstico 360
// final, no formato do Contrato JSON (Etapa 20). A validação da resposta
// (Fase 15) e o controle de retry (Etapa 20, seção 48) ficam no orquestrador
// (services/processFinalDiagnostic.js, Fase 16) — este arquivo só sabe
// montar prompt e chamar o modelo.
const { getClient } = require('./client');
const { SYSTEM_PROMPT } = require('./finalDiagnosticSystemPrompt');
const { ROOT_FIELDS, CONTRACT_VERSION, LIMITS } = require('./finalDiagnosticContract');

const MODEL = 'claude-sonnet-5';

// Descrição compacta do schema de saída, derivada das mesmas constantes
// usadas pra validar (finalDiagnosticContract.js / finalDiagnosticSchema.js)
// — ver Etapa 20, seção 51: "NÃO DUPLICAR SCHEMAS". O exemplo reduzido
// completo já está na Etapa 20, seção 37; aqui só reforçamos forma e
// limites pro modelo não ter que adivinhar.
const OUTPUT_SCHEMA_DESCRIPTION = `SCHEMA DE SAÍDA — responda com um único objeto JSON contendo exatamente estes campos, nesta forma (sem campos a mais, sem Markdown, sem comentários):
${JSON.stringify(
  {
    meta: { diagnostic_id: 'string', diagnostic_version: CONTRACT_VERSION, contract_version: CONTRACT_VERSION, generated_at: 'ISO_DATE' },
    executive_summary: `string (${LIMITS.EXECUTIVE_SUMMARY_MIN_LENGTH}-${LIMITS.EXECUTIVE_SUMMARY_MAX_LENGTH} caracteres)`,
    scores: '{ general, business, audience, positioning, differentiation, offer, pricing, communication, acquisition, sales, operations, ai, automation, ethics, retention, metrics } — copie exatamente de BLOCK_SCORES/GENERAL_SCORE recebidos, não recalcule',
    business_stage: '{ label: CRITICAL|FRAGILE|FUNCTIONAL|STRUCTURED|OPTIMIZED (copie de BUSINESS_STAGE recebido), title, description }',
    primary_bottleneck: '{ area, title, description, confidence: HIGH|MEDIUM|LOW, evidence: [{source,field,value}] } — exatamente 1',
    secondary_bottlenecks: `array (máx ${LIMITS.SECONDARY_BOTTLENECKS_MAX}) do mesmo schema de primary_bottleneck`,
    main_opportunity: '{ area, title, description, confidence, expected_gain, evidence }',
    key_insights: `array (máx ${LIMITS.KEY_INSIGHTS_MAX}) de { type: CONFIRMADO|HIPOTESE|ALERTA|OPORTUNIDADE|PRIORIDADE, area, title, message, confidence, evidence }`,
    top_priorities: `array (${LIMITS.TOP_PRIORITIES_MIN} a ${LIMITS.TOP_PRIORITIES_MAX}) de { rank: 1|2|3 (sem repetir), area, title, problem, reason, action, expected_operational_result, success_metric, confidence, evidence, dependencies: [area...], unlocks: [area...] }`,
    not_now: `array (máx ${LIMITS.NOT_NOW_MAX}) de { action, area, reason, review_when } — nunca repetir uma área que está em top_priorities`,
    ai_opportunities: `array (máx ${LIMITS.AI_OPPORTUNITIES_MAX}) de { job_to_be_done, area, ai_role, human_role, expected_gain, priority: HIGH|MEDIUM|LOW, risk: LOW|MEDIUM|HIGH, recommended_mode: HUMAN_ONLY|AI_SUPPORT|AI_WITH_HUMAN_APPROVAL|PARTIAL_AUTOMATION|FULL_AUTOMATION|SPECIALIZED_SKILL_OR_AGENT }`,
    automation_opportunities: `array (máx ${LIMITS.AUTOMATION_OPPORTUNITIES_MAX}) de { task, area, classification: MANTER_HUMANO|ORGANIZAR_PRIMEIRO|AUTOMATIZAR_COM_APROVACAO|AUTOMATIZAR_PARCIALMENTE|AUTOMATIZAR|NAO_PRIORITARIO, reason, expected_gain, human_approval_required, risk }`,
    top_metrics: `array (máx ${LIMITS.TOP_METRICS_MAX}) de { metric_id (snake_case em inglês), label, area, reason, cadence: WEEKLY|BIWEEKLY|MONTHLY|QUARTERLY|WHEN_APPLICABLE, decision_use } — cada métrica precisa se relacionar a pelo menos 1 prioridade, 1 gargalo ou o objetivo de 12 meses`,
    ethical_alerts: 'array de { area, title, message, confidence, action, requires_external_validation } — pode ser []',
    plan_30_days: `{ phase: "CORRIGIR", objective, actions: [{title,description,priority_area}] (máx ${LIMITS.PLAN_ACTIONS_MAX}), deliverables: [string] (máx ${LIMITS.PLAN_DELIVERABLES_MAX}), success_metrics: [metric_id] (máx ${LIMITS.PLAN_SUCCESS_METRICS_MAX}) }`,
    plan_60_days: '{ phase: "IMPLEMENTAR", objective, actions, deliverables, success_metrics } — mesmos limites do plan_30_days',
    plan_90_days: '{ phase: "TESTAR_AJUSTAR", objective, actions, deliverables, success_metrics } — mesmos limites do plan_30_days',
    next_step: '{ title, description, area, time_horizon: TODAY|NEXT_7_DAYS|NEXT_30_DAYS } — uma única ação',
    diagnostic_confidence: 'HIGH|MEDIUM|LOW',
  },
  null,
  2
)}
Campos obrigatórios: ${ROOT_FIELDS.join(', ')}.`;

function buildUserPrompt(context) {
  return `Analise o Diagnóstico 360 Blindado abaixo.

DIAGNOSTIC_VERSION:
${context.diagnostic_version}

BUSINESS_STAGE:
${context.business_stage}

TWELVE_MONTH_GOAL:
${context.twelve_month_goal || 'não informado'}

GENERAL_SCORE:
${context.general_score}

BLOCK_SCORES:
${JSON.stringify(context.block_scores, null, 2)}

DERIVED_DATA:
${JSON.stringify(context.derived_data, null, 2)}

DETERMINISTIC_FLAGS:
${JSON.stringify(context.deterministic_flags, null, 2)}

CONFIRMED_INSIGHTS:
${JSON.stringify(context.confirmed_insights, null, 2)}

HYPOTHESES:
${JSON.stringify(context.hypotheses, null, 2)}

CANDIDATE_PRIORITIES:
${JSON.stringify(context.candidate_priorities, null, 2)}

DEPENDENCIES:
${JSON.stringify(context.dependencies, null, 2)}

MISSING_CRITICAL_DATA:
${JSON.stringify(context.missing_data, null, 2)}

ANSWER_SUMMARY:
${JSON.stringify(context.answers_summary, null, 2)}

${OUTPUT_SCHEMA_DESCRIPTION}

Gere o diagnóstico final obedecendo integralmente ao System Prompt e ao schema JSON solicitado.

Não invente informações ausentes.
Não altere regras determinísticas.
Não escolha prioridades apenas pelo menor score.`;
}

// Etapa 20, seção 48 — RETRY AUTOMÁTICO.
function buildRetryPrompt(validationErrors) {
  const errorsText = validationErrors.map((e) => `- ${e.code}: ${e.message}`).join('\n');
  return `A resposta anterior não passou na validação.

Corrija exclusivamente os erros abaixo:

${errorsText}

Mantenha todas as informações válidas.
Não adicione campos.
Retorne novamente o JSON completo.`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(candidate);
}

// messages: histórico de tentativas já feito (pra retry) — [] na primeira
// chamada. previousResponseText/validationErrors só são usados a partir da
// segunda tentativa.
async function generateFinalDiagnostic(context, priorAttempts) {
  const client = getClient();
  const userPrompt = buildUserPrompt(context);

  const messages = [{ role: 'user', content: userPrompt }];
  (priorAttempts || []).forEach((attempt) => {
    messages.push({ role: 'assistant', content: attempt.responseText });
    messages.push({ role: 'user', content: buildRetryPrompt(attempt.validationErrors) });
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium' },
    system: SYSTEM_PROMPT,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar o diagnóstico final.');
  }

  let parsed;
  try {
    parsed = extractJson(textBlock.text);
  } catch (err) {
    throw new Error('A IA não retornou um JSON válido ao gerar o diagnóstico final: ' + err.message);
  }

  return { parsed, responseText: textBlock.text };
}

module.exports = { generateFinalDiagnostic, buildUserPrompt, buildRetryPrompt };
