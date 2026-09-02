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
// Fases 13-17 — Contexto pra IA, Prompt Mestre, Validação, Processamento e
// Resultado. diagnostic_input_snapshot guarda o contexto exato mandado pra
// IA (Etapa 22, seção 46 — auditoria de "por que recomendamos isso");
// final_report guarda a resposta já validada contra o Contrato JSON (Etapa
// 20) — é o que a tela de resultado lê; report_status acompanha
// PROCESSING/COMPLETED/PROCESSING_ERROR.
if (!diagnosticsColumns.includes('diagnostic_input_snapshot')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN diagnostic_input_snapshot TEXT');
}
if (!diagnosticsColumns.includes('final_report')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN final_report TEXT');
}
if (!diagnosticsColumns.includes('report_status')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN report_status TEXT');
}
if (!diagnosticsColumns.includes('report_generated_at')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN report_generated_at TEXT');
}
// Devolutiva 1:1: o relatório final fica pronto mas travado — a cliente só
// vê depois que a Andréa revisa (e pode editar os pontos-chave) e libera na
// mão, geralmente depois de uma reunião 1:1 explicando o resultado. NULL =
// ainda travado (aguardando revisão); preenchido = liberado pra cliente ver.
if (!diagnosticsColumns.includes('report_released_at')) {
  db.exec('ALTER TABLE diagnostics ADD COLUMN report_released_at TEXT');
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

// Liberação gradual por Diagnóstico 360.
//
// module_diagnostic_areas: um módulo pode ser o recurso PRINCIPAL de várias
// áreas do diagnóstico, e/ou APOIO de outras (ex.: Skill Blindada Pro é
// principal pra posicionamento/oferta/preço/vendas/operação, e apoio pra
// aquisição/comunicação) — por isso é tabela separada (N-pra-N), não uma
// coluna única em modules. Módulo sem nenhuma linha aqui continua se
// comportando exatamente como antes (só trava por produto, disponível pra
// qualquer cliente que tenha o produto vinculado).
//
// module_unlocks guarda, por cliente, quais módulos já foram liberados —
// automaticamente (logo depois do relatório final do Diagnóstico 360, pra
// área de maior prioridade) ou manualmente (Admin → Clientes, quando a
// Andréa quiser avançar pra próxima área). ai_message guarda o textinho
// gerado pela IA explicando por que aquele módulo foi liberado agora, pra
// mostrar na Área de Membros — fica nulo se a geração falhar, nunca
// bloqueia o acesso (o módulo já libera mesmo sem a mensagem).
db.exec(`
CREATE TABLE IF NOT EXISTS module_diagnostic_areas (
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'principal',
  PRIMARY KEY (module_id, area)
);

CREATE TABLE IF NOT EXISTS module_unlocks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  diagnostic_id TEXT REFERENCES diagnostics(id) ON DELETE SET NULL,
  reason_area TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  ai_message TEXT,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, module_id)
);
`);

// Entregáveis Premium: documentos gerados por IA, personalizados por
// cliente, a partir do Diagnóstico 360 dela — não são conteúdo de catálogo
// (como os módulos/aulas), são dado específico de cada cliente. type:
// 'dossie_posicionamento' | 'manual_etica' | 'assistente_ia'. status segue
// o mesmo padrão do relatório final (PROCESSING/COMPLETED/PROCESSING_ERROR)
// — se um entregável falhar, os outros continuam normalmente (nunca trava
// um por causa do outro).
db.exec(`
CREATE TABLE IF NOT EXISTS client_deliverables (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagnostic_id TEXT REFERENCES diagnostics(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSING',
  content TEXT,
  generated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, type)
);
`);

// Business Book Blindado (type 'business_book') é diferente dos outros 4
// entregáveis: não gera sozinho, e não fica visível pra cliente só por
// existir — a Andréa gera quando quiser (Admin → Clientes) e decide
// separadamente quando entregar ("eu entrego quando achar necessário").
// released_at: NULL = gerado mas não entregue ainda (ou nem gerado);
// preenchido = a cliente já pode ver. Pros outros 4 entregáveis (sempre
// visíveis assim que ficam prontos), released_at é preenchido junto com
// generated_at, sem esse passo manual extra.
const clientDeliverablesColumns = db.prepare('PRAGMA table_info(client_deliverables)').all().map((c) => c.name);
if (!clientDeliverablesColumns.includes('released_at')) {
  db.exec('ALTER TABLE client_deliverables ADD COLUMN released_at TEXT');
}

// Configurações gerais do app (chave/valor) — hoje só guarda
// auto_unlock_enabled (Admin → Configurações), pra dar pra Andréa desligar
// a liberação automática enquanto ela valida o método na mão, sem precisar
// mexer em código pra isso.
db.exec(`
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Índice histórico: uma cliente agora pode ter mais de um Diagnóstico 360
// (cada "refazer" grava uma linha nova em diagnostics, nunca sobrescreve a
// anterior — é isso que permite comparar a evolução dela no tempo). Mas
// refazer só é possível se a Andréa liberar antes (Admin → Clientes,
// "Liberar refazer diagnóstico") — evita gerar custo de IA sem ela saber.
// retake_diagnostic_unlocked_at: NULL = sem permissão pendente; preenchido
// = liberado, esperando a cliente usar (é consumido — volta a NULL assim
// que ela começa o novo diagnóstico).
const usersColumns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
if (!usersColumns.includes('retake_diagnostic_unlocked_at')) {
  db.exec('ALTER TABLE users ADD COLUMN retake_diagnostic_unlocked_at TEXT');
}

module.exports = db;
