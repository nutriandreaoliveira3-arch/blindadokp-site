// Funções puras (sem IA, sem banco) que agregam as notas de dimensão
// (0-5 ou null) em nota de bloco e nota geral. Mantidas separadas do motor
// de IA de pontuação (src/diagnostic/ai/scoreBlocks.js) para poderem ser
// testadas isoladamente e ficarem 100% determinísticas e auditáveis,
// conforme a "REGRA FUNDAMENTAL" da especificação: os scores vêm do motor
// determinístico, a IA não recalcula nem altera scores depois de gerados.

const { BLOCK_WEIGHTS } = require('./weights');

// null nunca vira 0 (regra explícita da especificação, seção 21 da Etapa
// 22). Um bloco/dimensão sem dado suficiente simplesmente não entra na
// média — nem no numerador, nem no denominador. Aplicamos essa mesma regra
// de forma consistente em todo bloco, mesmo nos que descrevem a fórmula V1
// como "/6" fixo, porque tratar ausência de dado como "conta no
// denominador mas vale 0" produziria exatamente o efeito que a
// especificação proíbe.
function computeBlockScore(dimensionScores) {
  const values = Object.values(dimensionScores || {}).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

// GENERAL_SCORE = SUM(block_score × weight) / SUM(weight dos blocos com
// score disponível). Blocos sem rubrica (1 e 4) ou sem dado suficiente
// (score null) são excluídos do numerador E do denominador, em vez de
// baixar a nota geral artificialmente.
function computeGeneralScore(blockScores) {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [blockId, score] of Object.entries(blockScores || {})) {
    const weight = BLOCK_WEIGHTS[blockId];
    if (!weight || typeof score !== 'number' || !Number.isFinite(score)) continue;
    weightedSum += score * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) return null;
  return Math.round((weightedSum / weightTotal) * 100) / 100;
}

module.exports = { computeBlockScore, computeGeneralScore };
