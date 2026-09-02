const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(DATA_DIR, 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  status TEXT NOT NULL DEFAULT 'pending',
  activation_token TEXT,
  greenn_sale_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_products (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  profession TEXT NOT NULL,
  content_type TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diagnostics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diagnostic_blocks (
  diagnostic_id TEXT NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  answers TEXT NOT NULL DEFAULT '{}',
  derived TEXT NOT NULL DEFAULT '{}',
  red_flags TEXT NOT NULL DEFAULT '[]',
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (diagnostic_id, block_id)
);

CREATE TABLE IF NOT EXISTS greenn_events (
  id TEXT PRIMARY KEY,
  sale_id TEXT,
  status TEXT,
  raw_payload TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Migração leve: adiciona as colunas de score do Diagnóstico 360 à tabela
// diagnostics quando ainda não existirem (bancos criados antes da Fase 9 —
// Scoring). block_scores/general_score guardam o resultado mais recente do
// motor de pontuação; scores_generated_at marca quando foi calculado pela
// última vez.
const diagnosticsColumns = db.prepare('PRAGMA table_info(diagnostics)').all().map((c) => c.name);
if (!diagnosticsColumns.includes('block_scores')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN block_scores TEXT');
}
if (!diagnosticsColumns.includes('general_score')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN general_score REAL');
}
if (!diagnosticsColumns.includes('scores_generated_at')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN scores_generated_at TEXT');
}
if (!diagnosticsColumns.includes('hard_rule_flags')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN hard_rule_flags TEXT');
}
if (!diagnosticsColumns.includes('candidate_priorities')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN candidate_priorities TEXT');
}
if (!diagnosticsColumns.includes('priorities_generated_at')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN priorities_generated_at TEXT');
}

// Migração leve: adiciona copy_content à tabela lessons quando ainda não
// existir. Usado pras skills vendidas como arquivo de texto (SKILL.md) que a
// cliente precisa copiar e colar no Claude.ai — fica separado de "content"
// (texto explicativo renderizado como prosa) pra poder mostrar um botão
// "Copiar" com o conteúdo exato, sem risco de a formatação de prosa mangling
// o texto que precisa ser colado verbatim.
const lessonsColumns = db.prepare('PRAGMA table_info(lessons)').all().map((c) => c.name);
if (!lessonsColumns.includes('copy_content')) {
  db.exec('ALTER TABLE lessons ADD COLUMN copy_content TEXT');
}

module.exports = db;
