// Configurações gerais do app, guardadas em app_settings (chave/valor).
// Uso simples de propósito — só tem 1 configuração até agora
// (auto_unlock_enabled). Valores sempre viram string no banco; quem chama
// converte pro tipo que precisar.
const db = require('../db');

function getSetting(key, defaultValue) {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : defaultValue;
}

function setSetting(key, value) {
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, String(value));
}

function isAutoUnlockEnabled() {
  return getSetting('auto_unlock_enabled', 'true') === 'true';
}

module.exports = { getSetting, setSetting, isAutoUnlockEnabled };
