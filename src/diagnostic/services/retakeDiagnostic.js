// Índice histórico — Fase "refazer o diagnóstico": controla a permissão pra
// cliente refazer o Diagnóstico 360 (só a Andréa libera, Admin → Clientes)
// e o próprio ato de criar uma nova rodada, sem nunca apagar a(s)
// anterior(es) — é isso que permite comparar a evolução dela no tempo
// (getDiagnosticHistory, usado pela tela de resultado pra mostrar
// "Sua Evolução").
const { v4: uuidv4 } = require('uuid');
const db = require('../../db');

// Admin → Clientes: libera a cliente pra refazer o diagnóstico da próxima
// vez que ela entrar. Fica pendente até ela usar (consumido em
// startRetake) — não expira sozinho, mas um novo clique aqui só reafirma a
// mesma permissão.
function unlockRetake(userId) {
  const result = db
    .prepare(`UPDATE users SET retake_diagnostic_unlocked_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
    .run(userId);
  if (result.changes === 0) {
    const err = new Error('Cliente não encontrada.');
    err.code = 'NOT_FOUND';
    throw err;
  }
}

function isRetakeUnlocked(userId) {
  const user = db.prepare('SELECT retake_diagnostic_unlocked_at FROM users WHERE id = ?').get(userId);
  return !!(user && user.retake_diagnostic_unlocked_at);
}

// Cria uma rodada nova do Diagnóstico 360 pra essa cliente — só se a Andréa
// tiver liberado antes. A rodada anterior nunca é apagada nem alterada
// (fica de histórico); os 15 blocos da rodada nova começam em branco.
function startRetake(userId) {
  if (!isRetakeUnlocked(userId)) {
    const err = new Error('Fale com a Andréa pra liberar um novo Diagnóstico Blindado 360 antes de refazer.');
    err.code = 'RETAKE_NOT_UNLOCKED';
    throw err;
  }
  const id = uuidv4();
  db.prepare('INSERT INTO diagnostics (id, user_id) VALUES (?, ?)').run(id, userId);
  db.prepare(`UPDATE users SET retake_diagnostic_unlocked_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(userId);
  return db.prepare('SELECT * FROM diagnostics WHERE id = ?').get(id);
}

// Índice histórico: todas as rodadas já liberadas pra cliente ver (mesma
// regra do relatório principal — nunca mostra uma rodada que a Andréa ainda
// não revisou/liberou), com o score geral e por bloco, em ordem
// cronológica — pra tela de resultado montar a comparação "antes/depois".
function getDiagnosticHistory(userId) {
  const rows = db
    .prepare(
      `SELECT id, created_at, report_generated_at, general_score, block_scores
       FROM diagnostics
       WHERE user_id = ? AND report_status = 'COMPLETED' AND report_released_at IS NOT NULL AND block_scores IS NOT NULL
       ORDER BY report_generated_at ASC`
    )
    .all(userId);
  return rows.map((row) => ({
    diagnosticId: row.id,
    createdAt: row.created_at,
    reportGeneratedAt: row.report_generated_at,
    generalScore: row.general_score,
    blockScores: JSON.parse(row.block_scores).block_scores || {},
  }));
}

module.exports = { unlockRetake, isRetakeUnlocked, startRetake, getDiagnosticHistory };
