// Utilitário de admin: cadastra os módulos/aulas de entrega das skills
// (Blindada Pro, Tráfego, TopClaudia) na Área de Membros, usando o conteúdo
// real que a Andréa forneceu (arquivos em scripts/skill-content/).
// Idempotente: se o módulo já existir (mesmo título), atualiza em vez de
// duplicar.
// Uso (rodar no Console do Railway, dentro do container em produção):
//   node scripts/seed-skills-content.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../src/db');

const CONTENT_DIR = path.join(__dirname, 'skill-content');
const read = (file) => fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');

function getProductId(key) {
  const product = db.prepare('SELECT id FROM products WHERE key = ?').get(key);
  if (!product) {
    throw new Error(`Produto '${key}' não encontrado no catálogo (products). Rode o seed.js primeiro.`);
  }
  return product.id;
}

function upsertModule(title, description, productId) {
  const existing = db.prepare('SELECT id FROM modules WHERE title = ?').get(title);
  if (existing) {
    db.prepare('UPDATE modules SET description = ?, product_id = ? WHERE id = ?').run(description, productId, existing.id);
    return existing.id;
  }
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max FROM modules').get().max;
  const id = uuidv4();
  db.prepare('INSERT INTO modules (id, title, description, product_id, sort_order) VALUES (?, ?, ?, ?, ?)').run(
    id,
    title,
    description,
    productId,
    maxOrder + 1
  );
  return id;
}

// Substitui todas as aulas do módulo pelas informadas (evita duplicar se
// rodar o script mais de uma vez).
function replaceLessons(moduleId, lessons) {
  db.prepare('DELETE FROM lessons WHERE module_id = ?').run(moduleId);
  const insert = db.prepare(
    'INSERT INTO lessons (id, module_id, title, content, video_url, copy_content, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  lessons.forEach((lesson, index) => {
    insert.run(uuidv4(), moduleId, lesson.title, lesson.content || '', null, lesson.copy_content || null, index);
  });
}

const INSTALL_INSTRUCTIONS_GERAL = `Como instalar:
1. Abra claude.ai e faça login.
2. Vá em "Habilidades" (menu do canto esquerdo).
3. Clique em "Nova Habilidade".
4. Copie o texto abaixo (botão "Copiar") e cole no campo da nova habilidade.
5. Salve.

Pronto — agora é só abrir uma conversa nova e usar os comandos (ex: /DIAGNOSTICO, /OFERTA, /CARROSSEL).`;

// --- Skill Blindada Pro ---
const blindadaProModuleId = upsertModule(
  'Skill Blindada Pro',
  'Diretor Estratégico de IA — estratégia, oferta, copy, conteúdo, tráfego e automação, com blindagem ética embutida.',
  getProductId('skill_blindada_pro')
);
replaceLessons(blindadaProModuleId, [
  {
    title: 'Instalação e uso',
    content: INSTALL_INSTRUCTIONS_GERAL,
    copy_content: read('skill-blindada-pro.md'),
  },
]);
console.log('Skill Blindada Pro cadastrada.');

// --- Skill de Tráfego ---
const trafegoModuleId = upsertModule(
  'Skill de Tráfego',
  'Diretor de Tráfego + IA — estrutura tráfego pago e orgânico qualificado, com conformidade ética de conselho de classe.',
  getProductId('skill_trafego')
);
replaceLessons(trafegoModuleId, [
  {
    title: 'Instalação e uso',
    content: 'O texto abaixo já inclui as instruções de instalação no começo. Copie tudo e cole numa conversa nova no claude.ai.',
    copy_content: read('skill-trafego.md'),
  },
  {
    title: 'Manual completo',
    content: read('manual-trafego.md'),
  },
]);
console.log('Skill de Tráfego cadastrada.');

// --- Skill TopClaudia ---
// ATENÇÃO: só temos o manual de uso (README) da TopClaudia entre os
// documentos recebidos — o arquivo SKILL.md real dela (o texto técnico que
// a cliente cola no Claude.ai) não veio junto. Por isso o campo de copiar
// fica vazio aqui, de propósito: bloco.io não inventa esse conteúdo. Falta
// a Andréa enviar o SKILL.md real da TopClaudia pra completar isso.
const topClaudiaModuleId = upsertModule(
  'Skill TopClaudia',
  'Complemento visual da Skill Blindada Pro — gera carrossel em HTML pronto pra virar PNG. Exclusiva pra quem já tem a Blindada Pro Premium.',
  getProductId('skill_topclaudia')
);
replaceLessons(topClaudiaModuleId, [
  {
    title: 'Manual de instalação e uso',
    content: read('manual-topclaudia.md') + '\n\n⚠️ PENDENTE: falta cadastrar aqui o texto do arquivo SKILL.md real da TopClaudia (o que a cliente copia e cola pra instalar). Envie esse arquivo pra Andréa completar.',
  },
]);
console.log('Skill TopClaudia cadastrada (PENDENTE: falta o SKILL.md real dela — só o manual foi cadastrado).');

console.log('\nConcluído.');
