// Liberação gradual por Diagnóstico 360 — cadastra:
// 1. O módulo "Mentoria Blindada Pró" (boas-vindas/apresentação do pacote
//    inteiro — não trava por área, fica disponível assim que a cliente
//    compra, junto com o Diagnóstico 360).
// 2. O módulo "Redes Sociais com Ética" (conteúdo real, genérico — não é
//    específico da Andréa — que já existia como skill separada, só não
//    tinha sido cadastrado na Área de Membros ainda).
// 3. O mapeamento área do diagnóstico → módulo (principal/apoio), com base
//    no que a Andréa definiu (revisado pra bater com as 13 áreas reais que
//    o Diagnóstico 360 pontua — o dela tinha categorias mais finas, tipo
//    "Landing Page"/"Funil"/"Remarketing", que aqui viram parte da área
//    "acquisition").
//
// PRECISA rodar depois de scripts/seed-skills-content.js (procura os
// módulos de skill por título — se não achar, avisa em vez de duplicar).
//
// Áreas SEM módulo principal ainda (o motor de liberação simplesmente pula
// pra próxima área da lista se a prioridade cair numa dessas — não trava,
// só não libera nada até ter conteúdo real marcado):
//   - ai (Inteligência Artificial)
//   - automation (Automação)
//   - retention (Experiência, Retenção e Renovação)
// Isso porque não existe hoje nenhum módulo com conteúdo de verdade pra
// essas 3 áreas — quando a Andréa criar (provavelmente dentro da própria
// Mentoria Blindada Pró), é só marcar a área dele no Admin → Conteúdo.
//
// Uso (rodar no Console do Railway, depois do seed-skills-content.js):
//   node scripts/seed-diagnostic-unlock-mapping.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../src/db');

const CONTENT_DIR = path.join(__dirname, 'skill-content');
const MENTORIA_DIR = path.join(__dirname, 'mentoria-content');
const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');

function getProductId(key) {
  const product = db.prepare('SELECT id FROM products WHERE key = ?').get(key);
  if (!product) {
    throw new Error(`Produto '${key}' não encontrado no catálogo (products). Rode o seed.js primeiro.`);
  }
  return product.id;
}

function getModuleIdByTitle(title) {
  const mod = db.prepare('SELECT id FROM modules WHERE title = ?').get(title);
  if (!mod) {
    throw new Error(
      `Módulo '${title}' não encontrado. Rode scripts/seed-skills-content.js antes deste script.`
    );
  }
  return mod.id;
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

function replaceLessons(moduleId, lessons) {
  db.prepare('DELETE FROM lessons WHERE module_id = ?').run(moduleId);
  const insert = db.prepare(
    'INSERT INTO lessons (id, module_id, title, content, video_url, copy_content, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  lessons.forEach((lesson, index) => {
    insert.run(uuidv4(), moduleId, lesson.title, lesson.content || '', null, lesson.copy_content || null, index);
  });
}

function setModuleAreas(moduleId, areas) {
  db.prepare('DELETE FROM module_diagnostic_areas WHERE module_id = ?').run(moduleId);
  const insert = db.prepare('INSERT INTO module_diagnostic_areas (module_id, area, role) VALUES (?, ?, ?)');
  areas.forEach(({ area, role }) => insert.run(moduleId, area, role));
}

// --- Mentoria Blindada Pró: boas-vindas, sem trava por área ---
const mentoriaModuleId = upsertModule(
  'Mentoria Blindada Pró',
  'Apresentação do pacote completo — o que tem incluso e como funciona a liberação por prioridade.',
  getProductId('mentoria_blindada_pro')
);
replaceLessons(mentoriaModuleId, [
  {
    title: 'Bem-vinda',
    content: read(MENTORIA_DIR, 'boas-vindas.html'),
  },
]);
console.log('Mentoria Blindada Pró cadastrada (boas-vindas).');

// --- Redes Sociais com Ética: conteúdo real, genérico ---
const INSTALL_INSTRUCTIONS_GERAL = `Como instalar:
1. Abra claude.ai e faça login.
2. Vá em "Habilidades" (menu do canto esquerdo).
3. Clique em "Nova Habilidade".
4. Copie o texto abaixo (botão "Copiar") e cole no campo da nova habilidade.
5. Salve.

Pronto — agora é só abrir uma conversa nova e usar.`;

const eticaModuleId = upsertModule(
  'Redes Sociais com Ética',
  'Identidade visual, bio pronta e checklist de câmera pra quem ainda não tem presença organizada nas redes — sempre revisando conformidade com o conselho de classe.',
  getProductId('claudio_skill_redes_sociais')
);
replaceLessons(eticaModuleId, [
  {
    title: 'Instalação e uso',
    content: INSTALL_INSTRUCTIONS_GERAL,
    copy_content: read(CONTENT_DIR, 'claudio-redes-sociais-com-etica.md'),
  },
]);
console.log('Redes Sociais com Ética cadastrada.');

// --- Mapeamento área do diagnóstico → módulo ---
const blindadaProId = getModuleIdByTitle('Skill Blindada Pro');
const topClaudiaId = getModuleIdByTitle('Skill TopClaudia');
const trafegoId = getModuleIdByTitle('Skill de Tráfego');

setModuleAreas(blindadaProId, [
  { area: 'positioning', role: 'principal' },
  { area: 'audience', role: 'principal' },
  { area: 'offer', role: 'principal' },
  { area: 'pricing', role: 'principal' },
  { area: 'sales', role: 'principal' },
  { area: 'operations', role: 'principal' },
  { area: 'acquisition', role: 'apoio' },
  { area: 'communication', role: 'apoio' },
  { area: 'ethics', role: 'apoio' },
  { area: 'ai', role: 'apoio' },
  { area: 'automation', role: 'apoio' },
  { area: 'metrics', role: 'apoio' },
]);

setModuleAreas(topClaudiaId, [{ area: 'communication', role: 'principal' }]);

setModuleAreas(trafegoId, [
  { area: 'acquisition', role: 'principal' },
  { area: 'metrics', role: 'principal' },
  { area: 'sales', role: 'apoio' },
]);

setModuleAreas(eticaModuleId, [
  { area: 'ethics', role: 'principal' },
  { area: 'communication', role: 'apoio' },
]);

console.log('Mapeamento de áreas do diagnóstico → módulos aplicado.');
console.log('\nConcluído.');
