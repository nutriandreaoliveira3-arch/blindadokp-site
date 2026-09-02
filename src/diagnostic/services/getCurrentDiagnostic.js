// Índice histórico: agora uma cliente pode ter mais de um diagnóstico (cada
// "refazer" cria uma linha nova em diagnostics, nunca sobrescreve a
// anterior — é assim que a comparação de evolução funciona). Esse helper
// centraliza "qual é o diagnóstico atual dessa cliente" (o mais recente),
// usado em todo lugar que antes assumia 1 diagnóstico por cliente pra
// sempre.
const db = require('../../db');

function getCurrentDiagnostic(userId) {
  return db.prepare('SELECT * FROM diagnostics WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId);
}

module.exports = { getCurrentDiagnostic };
