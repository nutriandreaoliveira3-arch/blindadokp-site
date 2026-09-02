// Fase 15 — Contrato JSON Final. Constantes e limites transcritos
// literalmente da Etapa 20 do documento mestre ("CONTRATO JSON FINAL E
// VALIDAÇÕES"). Fonte única (seção 51: "NÃO DUPLICAR SCHEMAS") usada tanto
// pra descrever o schema no prompt dinâmico (Fase 14) quanto pra validar a
// resposta da IA (Fase 15/16).
const { VALID_AREA_IDS } = require('./areaIds');

const CONTRACT_VERSION = '1.0';

const ROOT_FIELDS = [
  'meta',
  'executive_summary',
  'scores',
  'business_stage',
  'primary_bottleneck',
  'secondary_bottlenecks',
  'main_opportunity',
  'key_insights',
  'top_priorities',
  'not_now',
  'ai_opportunities',
  'automation_opportunities',
  'top_metrics',
  'ethical_alerts',
  'plan_30_days',
  'plan_60_days',
  'plan_90_days',
  'next_step',
  'diagnostic_confidence',
];

const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const PRIORITY_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const INSIGHT_TYPES = ['CONFIRMADO', 'HIPOTESE', 'ALERTA', 'OPORTUNIDADE', 'PRIORIDADE'];
const BUSINESS_STAGE_LABELS = ['CRITICAL', 'FRAGILE', 'FUNCTIONAL', 'STRUCTURED', 'OPTIMIZED'];
const AI_RECOMMENDED_MODES = [
  'HUMAN_ONLY',
  'AI_SUPPORT',
  'AI_WITH_HUMAN_APPROVAL',
  'PARTIAL_AUTOMATION',
  'FULL_AUTOMATION',
  'SPECIALIZED_SKILL_OR_AGENT',
];
const AUTOMATION_CLASSIFICATIONS = [
  'MANTER_HUMANO',
  'ORGANIZAR_PRIMEIRO',
  'AUTOMATIZAR_COM_APROVACAO',
  'AUTOMATIZAR_PARCIALMENTE',
  'AUTOMATIZAR',
  'NAO_PRIORITARIO',
];
const METRIC_CADENCES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'WHEN_APPLICABLE'];
const TIME_HORIZONS = ['TODAY', 'NEXT_7_DAYS', 'NEXT_30_DAYS'];
const PLAN_PHASES = { plan_30_days: 'CORRIGIR', plan_60_days: 'IMPLEMENTAR', plan_90_days: 'TESTAR_AJUSTAR' };

const LIMITS = {
  EXECUTIVE_SUMMARY_MIN_LENGTH: 100,
  EXECUTIVE_SUMMARY_MAX_LENGTH: 1200,
  SECONDARY_BOTTLENECKS_MAX: 2,
  KEY_INSIGHTS_MAX: 10,
  TOP_PRIORITIES_MIN: 1,
  TOP_PRIORITIES_MAX: 3,
  NOT_NOW_MAX: 5,
  AI_OPPORTUNITIES_MAX: 3,
  AUTOMATION_OPPORTUNITIES_MAX: 3,
  TOP_METRICS_MAX: 5,
  PLAN_ACTIONS_MAX: 5,
  PLAN_DELIVERABLES_MAX: 5,
  PLAN_SUCCESS_METRICS_MAX: 3,
};

// Frases que a Etapa 19 ("REGRAS ÉTICAS") e a Etapa 20 (seção 42 —
// "VALIDAÇÃO ÉTICA") proíbem quando não sustentadas explicitamente por
// fonte aplicável e contexto suficiente. Checagem simples de substring
// (case-insensitive) — não é NLP, é o mesmo tipo de guarda literal que a
// especificação pede.
const FORBIDDEN_ABSOLUTE_CLAIMS = ['100% seguro', 'sem risco', 'totalmente permitido', 'aprovado pelo conselho', 'garantido'];

module.exports = {
  CONTRACT_VERSION,
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
  PLAN_PHASES,
  LIMITS,
  FORBIDDEN_ABSOLUTE_CLAIMS,
};
