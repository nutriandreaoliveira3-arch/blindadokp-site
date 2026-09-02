// Fase 15 — Validação do Contrato JSON Final. Implementa literalmente as
// seções 38-47 da Etapa 20 ("VALIDAÇÕES ESTRUTURAIS" até "VALIDAÇÃO 'NÃO
// FAZER AGORA'"). Roda depois de toda resposta da IA (Fase 16), antes de
// salvar. Se inválido, o processamento pode tentar de novo (seção 48 —
// MAX_RETRIES: 2) mandando os erros encontrados de volta pro modelo.
//
// Duas validações da especificação não têm implementação automática aqui,
// por não serem verificáveis com segurança a partir dos campos do schema
// (arriscaria falso positivo/negativo em vez de aplicar a regra de verdade):
// seção 41, segundo exemplo (usa "automation_complexity = high", campo que
// não existe no Contrato JSON — schema de automation_opportunities não tem
// campo de complexidade); e seção 43 (checar se um número devolvido pela IA
// "não existe no input" exigiria parsing de texto livre pra achar números e
// cruzar contra o contexto enviado — não implementado, fica como validação
// manual/futura em vez de regra inventada).
const {
  ROOT_FIELDS,
  VALID_AREA_IDS,
  CONFIDENCE_LEVELS,
  RISK_LEVELS,
  PRIORITY_LEVELS,
  INSIGHT_TYPES,
  BUSINESS_STAGE_LABELS,
  AI_RECOMMENDED_MODES,
  AUTOMATION_CLASSIFICATIONS,
  METRIC_CADENCES,
  TIME_HORIZONS,
  LIMITS,
  FORBIDDEN_ABSOLUTE_CLAIMS,
} = require('./finalDiagnosticContract');
const { GOAL_TO_BLOCKS } = require('../priorities/priorityEngine');
const { STRATEGIC_DEPENDENCIES } = require('./dependencyMap');

function pushError(errors, code, message) {
  errors.push({ code, message });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateBottleneckSchema(obj, label, errors) {
  if (!obj || typeof obj !== 'object') {
    pushError(errors, 'INVALID_BOTTLENECK', `${label}: deve ser um objeto.`);
    return;
  }
  ['area', 'title', 'description', 'confidence', 'evidence'].forEach((field) => {
    if (obj[field] === undefined) pushError(errors, 'MISSING_FIELD', `${label}.${field} é obrigatório.`);
  });
  if (obj.area !== undefined && !VALID_AREA_IDS.includes(obj.area)) {
    pushError(errors, 'INVALID_AREA', `${label}.area '${obj.area}' não é uma área válida.`);
  }
  if (obj.confidence !== undefined && !CONFIDENCE_LEVELS.includes(obj.confidence)) {
    pushError(errors, 'INVALID_ENUM', `${label}.confidence '${obj.confidence}' inválido.`);
  }
  if (obj.evidence !== undefined && !Array.isArray(obj.evidence)) {
    pushError(errors, 'INVALID_TYPE', `${label}.evidence deve ser array.`);
  }
}

function validateFinalDiagnostic(output, context) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { valid: false, errors: [{ code: 'NOT_AN_OBJECT', message: 'A resposta não é um objeto JSON.' }] };
  }

  // 38. VALIDAÇÕES ESTRUTURAIS
  const extraFields = Object.keys(output).filter((key) => !ROOT_FIELDS.includes(key));
  if (extraFields.length > 0) {
    pushError(errors, 'EXTRA_FIELDS', `Campos não permitidos na raiz: ${extraFields.join(', ')}.`);
  }
  ROOT_FIELDS.forEach((field) => {
    if (output[field] === undefined) pushError(errors, 'MISSING_FIELD', `Campo obrigatório ausente: ${field}.`);
  });

  // Se faltam campos estruturais básicos, para aqui — o resto das validações
  // pressupõe que os campos existem.
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 5. EXECUTIVE SUMMARY
  if (!isNonEmptyString(output.executive_summary)) {
    pushError(errors, 'INVALID_TYPE', 'executive_summary deve ser texto não vazio.');
  } else {
    const len = output.executive_summary.trim().length;
    if (len < LIMITS.EXECUTIVE_SUMMARY_MIN_LENGTH || len > LIMITS.EXECUTIVE_SUMMARY_MAX_LENGTH) {
      pushError(
        errors,
        'INVALID_LENGTH',
        `executive_summary deve ter entre ${LIMITS.EXECUTIVE_SUMMARY_MIN_LENGTH} e ${LIMITS.EXECUTIVE_SUMMARY_MAX_LENGTH} caracteres (tem ${len}).`
      );
    }
  }

  // 6. SCORES — read-only da IA: precisa bater exatamente com o que o motor
  // determinístico calculou (context.blockScoresByArea + general_score).
  const scores = output.scores || {};
  if (context && context.expectedScoresByArea) {
    Object.entries(context.expectedScoresByArea).forEach(([area, expected]) => {
      if (scores[area] !== expected) {
        pushError(errors, 'SCORE_MISMATCH', `scores.${area} deveria ser ${JSON.stringify(expected)} (motor determinístico), veio ${JSON.stringify(scores[area])}.`);
      }
    });
  }

  // 7. BUSINESS STAGE
  if (!output.business_stage || !BUSINESS_STAGE_LABELS.includes(output.business_stage.label)) {
    pushError(errors, 'INVALID_ENUM', `business_stage.label deve ser um de: ${BUSINESS_STAGE_LABELS.join(', ')}.`);
  }
  if (context && context.expectedBusinessStageLabel && output.business_stage && output.business_stage.label !== context.expectedBusinessStageLabel) {
    pushError(
      errors,
      'BUSINESS_STAGE_MISMATCH',
      `business_stage.label deveria ser '${context.expectedBusinessStageLabel}' (classificação determinística do general_score), veio '${output.business_stage.label}'.`
    );
  }

  // 9. PRIMARY BOTTLENECK
  validateBottleneckSchema(output.primary_bottleneck, 'primary_bottleneck', errors);

  // 10. SECONDARY BOTTLENECKS
  if (!Array.isArray(output.secondary_bottlenecks)) {
    pushError(errors, 'INVALID_TYPE', 'secondary_bottlenecks deve ser array.');
  } else {
    if (output.secondary_bottlenecks.length > LIMITS.SECONDARY_BOTTLENECKS_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `secondary_bottlenecks tem mais que ${LIMITS.SECONDARY_BOTTLENECKS_MAX} itens.`);
    }
    output.secondary_bottlenecks.forEach((item, i) => validateBottleneckSchema(item, `secondary_bottlenecks[${i}]`, errors));
  }

  // 11. MAIN OPPORTUNITY
  if (!output.main_opportunity || typeof output.main_opportunity !== 'object') {
    pushError(errors, 'MISSING_FIELD', 'main_opportunity é obrigatório.');
  } else {
    ['area', 'title', 'description', 'confidence', 'expected_gain', 'evidence'].forEach((field) => {
      if (output.main_opportunity[field] === undefined) pushError(errors, 'MISSING_FIELD', `main_opportunity.${field} é obrigatório.`);
    });
    if (output.main_opportunity.area !== undefined && !VALID_AREA_IDS.includes(output.main_opportunity.area)) {
      pushError(errors, 'INVALID_AREA', `main_opportunity.area '${output.main_opportunity.area}' inválida.`);
    }
  }

  // 12. KEY INSIGHTS
  if (!Array.isArray(output.key_insights)) {
    pushError(errors, 'INVALID_TYPE', 'key_insights deve ser array.');
  } else {
    if (output.key_insights.length > LIMITS.KEY_INSIGHTS_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `key_insights tem mais que ${LIMITS.KEY_INSIGHTS_MAX} itens.`);
    }
    output.key_insights.forEach((insight, i) => {
      if (!insight || !INSIGHT_TYPES.includes(insight.type)) {
        pushError(errors, 'INVALID_ENUM', `key_insights[${i}].type inválido.`);
      }
      if (insight && insight.area !== undefined && !VALID_AREA_IDS.includes(insight.area)) {
        pushError(errors, 'INVALID_AREA', `key_insights[${i}].area '${insight.area}' inválida.`);
      }
      if (insight && insight.confidence !== undefined && !CONFIDENCE_LEVELS.includes(insight.confidence)) {
        pushError(errors, 'INVALID_ENUM', `key_insights[${i}].confidence inválido.`);
      }
    });
  }

  // 13/14 TOP PRIORITIES + RANK, 40. VALIDAÇÃO DE PRIORIDADES
  const topPriorityAreas = [];
  if (!Array.isArray(output.top_priorities)) {
    pushError(errors, 'INVALID_TYPE', 'top_priorities deve ser array.');
  } else {
    if (output.top_priorities.length < LIMITS.TOP_PRIORITIES_MIN || output.top_priorities.length > LIMITS.TOP_PRIORITIES_MAX) {
      pushError(
        errors,
        'INVALID_COUNT',
        `top_priorities deve ter entre ${LIMITS.TOP_PRIORITIES_MIN} e ${LIMITS.TOP_PRIORITIES_MAX} itens (tem ${output.top_priorities.length}).`
      );
    }
    const ranks = [];
    output.top_priorities.forEach((priority, i) => {
      const label = `top_priorities[${i}]`;
      if (!priority || typeof priority !== 'object') {
        pushError(errors, 'INVALID_TYPE', `${label} deve ser um objeto.`);
        return;
      }
      [
        'rank',
        'area',
        'title',
        'problem',
        'reason',
        'action',
        'expected_operational_result',
        'success_metric',
        'confidence',
        'evidence',
        'dependencies',
        'unlocks',
      ].forEach((field) => {
        if (priority[field] === undefined) pushError(errors, 'MISSING_FIELD', `${label}.${field} é obrigatório.`);
      });
      if (![1, 2, 3].includes(priority.rank)) {
        pushError(errors, 'INVALID_RANK', `${label}.rank deve ser 1, 2 ou 3 (veio ${priority.rank}).`);
      } else {
        ranks.push(priority.rank);
      }
      if (priority.area !== undefined) {
        if (!VALID_AREA_IDS.includes(priority.area)) {
          pushError(errors, 'INVALID_AREA', `${label}.area '${priority.area}' inválida.`);
        } else {
          topPriorityAreas.push(priority.area);
        }
      }
      if (priority.confidence !== undefined && !CONFIDENCE_LEVELS.includes(priority.confidence)) {
        pushError(errors, 'INVALID_ENUM', `${label}.confidence inválido.`);
      }
      if (Array.isArray(priority.dependencies)) {
        priority.dependencies.forEach((dep) => {
          if (!VALID_AREA_IDS.includes(dep)) pushError(errors, 'INVALID_AREA', `${label}.dependencies contém área inválida: ${dep}.`);
        });
      }
      if (Array.isArray(priority.unlocks)) {
        priority.unlocks.forEach((area) => {
          if (!VALID_AREA_IDS.includes(area)) pushError(errors, 'INVALID_AREA', `${label}.unlocks contém área inválida: ${area}.`);
        });
      }
      // 44. VALIDAÇÃO DE EVIDÊNCIA
      const confidenceExempt = output.diagnostic_confidence === 'LOW' && priority.confidence === 'LOW';
      if (!confidenceExempt && (!Array.isArray(priority.evidence) || priority.evidence.length === 0)) {
        pushError(errors, 'MISSING_EVIDENCE', `${label} precisa de pelo menos 1 evidence.`);
      }
    });
    if (new Set(ranks).size !== ranks.length) {
      pushError(errors, 'DUPLICATE_RANK', 'top_priorities tem ranks repetidos — cada rank (1, 2, 3) só pode aparecer uma vez.');
    }
  }

  // 44. VALIDAÇÃO DE EVIDÊNCIA — gargalo principal
  {
    const confidenceExempt = output.diagnostic_confidence === 'LOW' && output.primary_bottleneck && output.primary_bottleneck.confidence === 'LOW';
    if (!confidenceExempt && output.primary_bottleneck && (!Array.isArray(output.primary_bottleneck.evidence) || output.primary_bottleneck.evidence.length === 0)) {
      pushError(errors, 'MISSING_EVIDENCE', 'primary_bottleneck precisa de pelo menos 1 evidence (exceto quando diagnostic_confidence = LOW e o gargalo é justamente dados insuficientes).');
    }
  }

  // 17. NOT NOW + 47. VALIDAÇÃO "NÃO FAZER AGORA"
  if (!Array.isArray(output.not_now)) {
    pushError(errors, 'INVALID_TYPE', 'not_now deve ser array.');
  } else {
    if (output.not_now.length > LIMITS.NOT_NOW_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `not_now tem mais que ${LIMITS.NOT_NOW_MAX} itens.`);
    }
    output.not_now.forEach((item, i) => {
      const label = `not_now[${i}]`;
      if (!item || !isNonEmptyString(item.reason)) {
        pushError(errors, 'MISSING_FIELD', `${label}.reason é obrigatório.`);
      }
      if (item && item.area !== undefined && !VALID_AREA_IDS.includes(item.area)) {
        pushError(errors, 'INVALID_AREA', `${label}.area '${item.area}' inválida.`);
      }
      if (item && item.area && topPriorityAreas.includes(item.area)) {
        pushError(errors, 'CONTRADICTS_PRIORITY', `${label} contradiz uma prioridade: área '${item.area}' está em top_priorities e em not_now ao mesmo tempo.`);
      }
    });
  }

  // 18/19 AI OPPORTUNITIES
  if (!Array.isArray(output.ai_opportunities)) {
    pushError(errors, 'INVALID_TYPE', 'ai_opportunities deve ser array.');
  } else {
    if (output.ai_opportunities.length > LIMITS.AI_OPPORTUNITIES_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `ai_opportunities tem mais que ${LIMITS.AI_OPPORTUNITIES_MAX} itens.`);
    }
    output.ai_opportunities.forEach((item, i) => {
      const label = `ai_opportunities[${i}]`;
      if (item && item.area !== undefined && !VALID_AREA_IDS.includes(item.area)) pushError(errors, 'INVALID_AREA', `${label}.area inválida.`);
      if (item && item.priority !== undefined && !PRIORITY_LEVELS.includes(item.priority)) pushError(errors, 'INVALID_ENUM', `${label}.priority inválido.`);
      if (item && item.risk !== undefined && !RISK_LEVELS.includes(item.risk)) pushError(errors, 'INVALID_ENUM', `${label}.risk inválido.`);
      if (item && item.recommended_mode !== undefined && !AI_RECOMMENDED_MODES.includes(item.recommended_mode)) {
        pushError(errors, 'INVALID_ENUM', `${label}.recommended_mode inválido.`);
      }
    });
  }

  // 22/23 AUTOMATION OPPORTUNITIES
  let automatizarComplexBlockedViolation = false;
  if (!Array.isArray(output.automation_opportunities)) {
    pushError(errors, 'INVALID_TYPE', 'automation_opportunities deve ser array.');
  } else {
    if (output.automation_opportunities.length > LIMITS.AUTOMATION_OPPORTUNITIES_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `automation_opportunities tem mais que ${LIMITS.AUTOMATION_OPPORTUNITIES_MAX} itens.`);
    }
    output.automation_opportunities.forEach((item, i) => {
      const label = `automation_opportunities[${i}]`;
      if (item && item.area !== undefined && !VALID_AREA_IDS.includes(item.area)) pushError(errors, 'INVALID_AREA', `${label}.area inválida.`);
      if (item && item.classification !== undefined && !AUTOMATION_CLASSIFICATIONS.includes(item.classification)) {
        pushError(errors, 'INVALID_ENUM', `${label}.classification inválido.`);
      }
      if (item && item.risk !== undefined && !RISK_LEVELS.includes(item.risk)) pushError(errors, 'INVALID_ENUM', `${label}.risk inválido.`);
      // 41. VALIDAÇÃO CONTRA HARD RULES — complex_automation_blocked.
      // classification AUTOMATIZAR = tratada como "automação complexa" pra
      // fins desta checagem (é a classificação mais completa/menos
      // supervisionada do enum) — ver nota no topo do arquivo.
      if (context && context.hardRuleNames && context.hardRuleNames.has('complex_automation_blocked') && item && item.classification === 'AUTOMATIZAR') {
        automatizarComplexBlockedViolation = true;
      }
    });
  }
  if (automatizarComplexBlockedViolation) {
    pushError(
      errors,
      'HARD_RULE_VIOLATION',
      'complex_automation_blocked está ativo (processo ainda não padronizado — ver process_standardization_score), mas há automation_opportunities com classification AUTOMATIZAR.'
    );
  }

  // 24/25/26 TOP METRICS + 45. VALIDAÇÃO DE MÉTRICAS
  if (!Array.isArray(output.top_metrics)) {
    pushError(errors, 'INVALID_TYPE', 'top_metrics deve ser array.');
  } else {
    if (output.top_metrics.length > LIMITS.TOP_METRICS_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `top_metrics tem mais que ${LIMITS.TOP_METRICS_MAX} itens.`);
    }
    const relatedAreas = new Set(topPriorityAreas);
    if (output.primary_bottleneck && output.primary_bottleneck.area) relatedAreas.add(output.primary_bottleneck.area);
    (output.secondary_bottlenecks || []).forEach((b) => b && b.area && relatedAreas.add(b.area));
    if (context && context.twelveMonthGoal) {
      (GOAL_TO_BLOCKS[context.twelveMonthGoal] || []).forEach((blockId) => relatedAreas.add(blockId === 'business_current' ? 'business' : blockId));
    }
    output.top_metrics.forEach((metric, i) => {
      const label = `top_metrics[${i}]`;
      if (!metric || !isNonEmptyString(metric.metric_id)) pushError(errors, 'MISSING_FIELD', `${label}.metric_id é obrigatório.`);
      if (metric && metric.area !== undefined && !VALID_AREA_IDS.includes(metric.area)) pushError(errors, 'INVALID_AREA', `${label}.area inválida.`);
      if (metric && metric.cadence !== undefined && !METRIC_CADENCES.includes(metric.cadence)) pushError(errors, 'INVALID_ENUM', `${label}.cadence inválido.`);
      if (metric && metric.area && relatedAreas.size > 0 && !relatedAreas.has(metric.area)) {
        pushError(
          errors,
          'METRIC_NOT_RELATED',
          `${label} (área '${metric.area}') não está ligada a nenhuma prioridade, gargalo ou ao objetivo de 12 meses.`
        );
      }
    });
  }

  // 27. ETHICAL ALERTS
  if (!Array.isArray(output.ethical_alerts)) {
    pushError(errors, 'INVALID_TYPE', 'ethical_alerts deve ser array.');
  } else {
    output.ethical_alerts.forEach((alert, i) => {
      const label = `ethical_alerts[${i}]`;
      if (alert && alert.area !== undefined && !VALID_AREA_IDS.includes(alert.area)) pushError(errors, 'INVALID_AREA', `${label}.area inválida.`);
      if (alert && alert.confidence !== undefined && !CONFIDENCE_LEVELS.includes(alert.confidence)) pushError(errors, 'INVALID_ENUM', `${label}.confidence inválido.`);
    });
  }

  // 28-31 PLANOS 30/60/90 + 46. VALIDAÇÃO DO PLANO
  const supportingAreas = new Set(topPriorityAreas);
  topPriorityAreas.forEach((area) => {
    const dep = STRATEGIC_DEPENDENCIES.find((d) => d.area === area);
    if (dep) dep.depends_on.forEach((a) => supportingAreas.add(a));
  });
  ['plan_30_days', 'plan_60_days', 'plan_90_days'].forEach((planKey) => {
    const plan = output[planKey];
    if (!plan || typeof plan !== 'object') {
      pushError(errors, 'MISSING_FIELD', `${planKey} é obrigatório.`);
      return;
    }
    ['phase', 'objective', 'actions', 'deliverables', 'success_metrics'].forEach((field) => {
      if (plan[field] === undefined) pushError(errors, 'MISSING_FIELD', `${planKey}.${field} é obrigatório.`);
    });
    if (Array.isArray(plan.actions)) {
      if (plan.actions.length > LIMITS.PLAN_ACTIONS_MAX) pushError(errors, 'TOO_MANY_ITEMS', `${planKey}.actions tem mais que ${LIMITS.PLAN_ACTIONS_MAX} itens.`);
      plan.actions.forEach((action, i) => {
        if (action && action.priority_area && supportingAreas.size > 0 && !supportingAreas.has(action.priority_area)) {
          pushError(
            errors,
            'PLAN_ACTION_NOT_LINKED',
            `${planKey}.actions[${i}] (área '${action.priority_area}') não está ligada a nenhuma top_priority nem a uma dependência de suporte dela.`
          );
        }
      });
    }
    if (Array.isArray(plan.deliverables) && plan.deliverables.length > LIMITS.PLAN_DELIVERABLES_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `${planKey}.deliverables tem mais que ${LIMITS.PLAN_DELIVERABLES_MAX} itens.`);
    }
    if (Array.isArray(plan.success_metrics) && plan.success_metrics.length > LIMITS.PLAN_SUCCESS_METRICS_MAX) {
      pushError(errors, 'TOO_MANY_ITEMS', `${planKey}.success_metrics tem mais que ${LIMITS.PLAN_SUCCESS_METRICS_MAX} itens.`);
    }
  });

  // 32/33 NEXT STEP
  if (!output.next_step || typeof output.next_step !== 'object') {
    pushError(errors, 'MISSING_FIELD', 'next_step é obrigatório.');
  } else {
    ['title', 'description', 'area', 'time_horizon'].forEach((field) => {
      if (output.next_step[field] === undefined) pushError(errors, 'MISSING_FIELD', `next_step.${field} é obrigatório.`);
    });
    if (output.next_step.area !== undefined && !VALID_AREA_IDS.includes(output.next_step.area)) {
      pushError(errors, 'INVALID_AREA', `next_step.area '${output.next_step.area}' inválida.`);
    }
    if (output.next_step.time_horizon !== undefined && !TIME_HORIZONS.includes(output.next_step.time_horizon)) {
      pushError(errors, 'INVALID_ENUM', `next_step.time_horizon inválido.`);
    }
  }

  // 34. DIAGNOSTIC CONFIDENCE
  if (!CONFIDENCE_LEVELS.includes(output.diagnostic_confidence)) {
    pushError(errors, 'INVALID_ENUM', `diagnostic_confidence deve ser um de: ${CONFIDENCE_LEVELS.join(', ')}.`);
  }

  // 41. VALIDAÇÃO CONTRA HARD RULES — acquisition_scaling_blocked (exemplo
  // literal da seção 41: acquisition não pode estar em top_priorities).
  if (context && context.hardRuleNames && context.hardRuleNames.has('acquisition_scaling_blocked') && topPriorityAreas.includes('acquisition')) {
    pushError(
      errors,
      'HARD_RULE_VIOLATION',
      'acquisition_scaling_blocked está ativo (offer_score < 2.5), mas top_priorities inclui a área acquisition.'
    );
  }

  // 42. VALIDAÇÃO ÉTICA — nenhuma alegação absoluta sem base, em nenhum
  // lugar da resposta.
  const fullText = JSON.stringify(output).toLowerCase();
  FORBIDDEN_ABSOLUTE_CLAIMS.forEach((phrase) => {
    if (fullText.includes(phrase.toLowerCase())) {
      pushError(errors, 'ABSOLUTE_ETHICAL_CLAIM', `A resposta contém a expressão proibida "${phrase}" sem base sustentada.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateFinalDiagnostic };
