// Fase 12 — Priority Engine. Calcula candidatos a prioridade pra cada
// bloco com nota disponível, seguindo a fórmula e os modificadores dados
// literalmente no documento mestre (Etapa 22, seções 32-34):
//
//   PRIORITY_GAP = (5 - block_score) / 5
//   BASE_PRIORITY = PRIORITY_GAP × block_weight
//
//   CRITICAL_RED_FLAG      × 1.40
//   BLOCKS_NEXT_STAGE      × 1.30
//   LINKED_TO_12_MONTH_GOAL× 1.20
//   DIRECT_REVENUE_IMPACT  × 1.15
//   SECONDARY_IMPROVEMENT  × 0.80
//
// A especificação não detalha como esses modificadores se combinam quando
// mais de um se aplica ao mesmo bloco, nem dá número pros "reduce_priority"/
// "increase_priority" das próprias hard rules (essas ficam como sinal
// qualitativo em vez de magnitude inventada — ver hardRules.js). A escolha
// feita aqui é: modificadores multiplicam entre si (cada um que se aplica
// entra na conta), e SECONDARY_IMPROVEMENT só entra quando nenhum dos
// outros quatro se aplicou (fallback pra blocos sem sinal de urgência). Os
// VALORES dos modificadores não foram alterados — só a forma de combiná-los,
// que fica documentada aqui como decisão de implementação, não como regra
// de negócio nova.
//
// Isto NÃO decide o Top 3 final — só gera candidatos ordenáveis com a
// evidência de cada modificador aplicado. A escolha final do Top 3,
// respeitando dependências estratégicas (REGRA: menor score não é
// prioridade automática), é feita pela IA no prompt final, usando esta
// lista como um dos inputs.

const { BLOCK_WEIGHTS } = require('../scoring/weights');

const REVENUE_BLOCKS = new Set(['offer', 'pricing', 'sales', 'acquisition']);

// Mapeamento literal do objetivo de 12 meses (Bloco 1) pras áreas que o
// nome da própria opção já indica — não é uma regra de negócio nova, é
// só ligar o rótulo da opção à área correspondente.
const GOAL_TO_BLOCKS = {
  faturamento: ['pricing', 'sales', 'offer'],
  mais_clientes: ['acquisition', 'sales'],
  ticket: ['pricing', 'offer'],
  trabalhar_menos: ['operations', 'automation'],
  novo_produto: ['offer'],
  equipe: ['operations'],
  processos: ['operations'],
  implementar_ia: ['ai'],
  automatizar: ['automation'],
  posicionamento: ['positioning'],
  previsibilidade: ['acquisition', 'metrics'],
  outro: [],
};

function computeCandidatePriorities({ blockScores, redFlagsByBlock, hardRuleFlags, twelveMonthGoal }) {
  const blocksLinkedToGoal = new Set(GOAL_TO_BLOCKS[twelveMonthGoal] || []);
  const blocksThatBlockNextStage = new Set();
  (hardRuleFlags || []).forEach((flag) => {
    if (flag.area) blocksThatBlockNextStage.add(flag.area);
  });

  const candidates = [];

  for (const [blockId, weight] of Object.entries(BLOCK_WEIGHTS)) {
    const score = blockScores[blockId];
    if (typeof score !== 'number' || !Number.isFinite(score)) continue; // sem nota disponível (Blocos 1 e 4) — não vira candidato

    const priorityGap = (5 - score) / 5;
    const basePriority = priorityGap * weight;

    const appliedModifiers = [];
    let multiplier = 1;

    const hasCriticalRedFlag = (redFlagsByBlock[blockId] || []).some((f) => f.type === 'ALERTA');
    if (hasCriticalRedFlag) {
      multiplier *= 1.4;
      appliedModifiers.push('CRITICAL_RED_FLAG');
    }

    if (blocksThatBlockNextStage.has(blockId)) {
      multiplier *= 1.3;
      appliedModifiers.push('BLOCKS_NEXT_STAGE');
    }

    if (blocksLinkedToGoal.has(blockId)) {
      multiplier *= 1.2;
      appliedModifiers.push('LINKED_TO_12_MONTH_GOAL');
    }

    if (REVENUE_BLOCKS.has(blockId)) {
      multiplier *= 1.15;
      appliedModifiers.push('DIRECT_REVENUE_IMPACT');
    }

    if (appliedModifiers.length === 0) {
      multiplier *= 0.8;
      appliedModifiers.push('SECONDARY_IMPROVEMENT');
    }

    // Sinal qualitativo das hard rules que pedem redução/aumento de
    // prioridade sem número dado (ex.: reduce_priority(acquisition)).
    const directionalFlags = (hardRuleFlags || [])
      .filter((flag) => Array.isArray(flag.blocks) && flag.blocks.includes(blockId))
      .map((flag) => flag.rule);

    candidates.push({
      area: blockId,
      score,
      weight,
      priorityGap: Math.round(priorityGap * 100) / 100,
      basePriority: Math.round(basePriority * 100) / 100,
      appliedModifiers,
      directionalFlags,
      finalPriority: Math.round(basePriority * multiplier * 100) / 100,
    });
  }

  candidates.sort((a, b) => b.finalPriority - a.finalPriority);
  return candidates;
}

module.exports = { computeCandidatePriorities, REVENUE_BLOCKS, GOAL_TO_BLOCKS };
