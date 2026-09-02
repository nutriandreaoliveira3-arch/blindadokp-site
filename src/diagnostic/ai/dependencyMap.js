// Dependências estratégicas dadas literalmente no Prompt Mestre (Etapa 19,
// seção "DEPENDÊNCIAS ESTRATÉGICAS"). Estrutura fixa, não calculada — é
// contexto enviado à IA (campo DEPENDENCIES do prompt dinâmico, Etapa 19
// seção 4) pra ela respeitar a ordem antes de priorizar. Ética é transversal
// (não depende de nem bloqueia uma cadeia específica), por isso não aparece
// como chave com "depends_on" — a própria especificação a chama de "camada
// transversal".
const STRATEGIC_DEPENDENCIES = [
  { area: 'positioning', depends_on: ['audience'] },
  { area: 'differentiation', depends_on: ['positioning'] },
  { area: 'offer', depends_on: ['differentiation'] },
  { area: 'pricing', depends_on: ['offer'] },
  { area: 'acquisition', depends_on: ['communication'] },
  { area: 'sales', depends_on: ['acquisition'] },
  { area: 'ai', depends_on: ['operations'] },
  { area: 'automation', depends_on: ['ai'] },
  { area: 'retention', depends_on: ['business'] }, // "EXPERIÊNCIA" na especificação — não existe bloco próprio de "experiência", é o Bloco 14 (retention) que cobre experiência+retenção+renovação.
  { area: 'metrics', depends_on: [] }, // "MÉTRICAS → ANÁLISE → AJUSTE" é um ciclo interno ao próprio bloco, não uma dependência de outra área.
  { area: 'ethics', depends_on: [], transversal: true },
];

module.exports = { STRATEGIC_DEPENDENCIES };
