// Motor de liberação: usa a ordem calculada em computeUnlockPlan.js pra
// decidir quais módulos liberar pra uma cliente, e module_diagnostic_areas
// (Admin → Conteúdo, papel "principal" ou "apoio" por área) pra saber quais
// módulos resolvem qual área.
//
// Só libera módulo marcado como PRINCIPAL da área automaticamente — módulo
// marcado como apoio fica só como recomendação visível no Admin, pra
// Andréa decidir se libera junto ou não. Isso segue a regra que ela deu:
// não liberar tudo que teve nota baixa, só o que é de fato a prioridade
// daquele momento ("não vira Netflix de módulos").
//
// Duas formas de disparo, as duas gravam na mesma tabela (module_unlocks)
// — nenhuma "esquece" a outra:
//   - autoUnlockNextArea: chamado sozinho pelo backend logo que o relatório
//     final do Diagnóstico 360 fica pronto (Fase 16) — libera a área de
//     maior prioridade.
//   - manualUnlockNextArea: chamado pelo Admin → Clientes, quando a Andréa
//     quiser avançar pra próxima área na hora que ela achar certo.
//
// Ética como camada transversal: sempre que uma área é liberada (e não é a
// própria ética), se o diagnóstico também sinalizou um alerta de ética
// pra essa cliente (red flag do bloco de ética, ou hard rule de ética),
// os módulos principais de "ethics" são liberados junto, como camada
// obrigatória de proteção — não é preciso que "ethics" seja a prioridade
// #1 pra isso acontecer.
const db = require('../../db');
const { computeUnlockPlan } = require('./computeUnlockPlan');
const { generateUnlockMessage } = require('../ai/generateUnlockMessage');
const { BLOCK_LIST } = require('../blockList');

const AREA_LABELS = new Map(BLOCK_LIST.map((b) => [b.id, b.name]));

function userEntitledProductIds(userId) {
  return new Set(
    db.prepare('SELECT product_id FROM user_products WHERE user_id = ?').all(userId).map((r) => r.product_id)
  );
}

function modulesForArea(area, role, entitledProductIds) {
  return db
    .prepare(
      `SELECT m.* FROM modules m
       JOIN module_diagnostic_areas mda ON mda.module_id = m.id
       WHERE mda.area = ? AND mda.role = ?
       ORDER BY m.sort_order`
    )
    .all(area, role)
    .filter((mod) => !mod.product_id || entitledProductIds.has(mod.product_id));
}

function getUnlockedModuleIds(userId) {
  return new Set(
    db.prepare('SELECT module_id FROM module_unlocks WHERE user_id = ?').all(userId).map((r) => r.module_id)
  );
}

function unlockModuleRow({ userId, moduleId, diagnosticId, area, source, aiMessage }) {
  db.prepare(
    `INSERT OR IGNORE INTO module_unlocks (user_id, module_id, diagnostic_id, reason_area, source, ai_message)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, moduleId, diagnosticId || null, area || null, source, aiMessage || null);
}

// Acha, a partir de orderedAreas, a primeira área que ainda tem pelo menos
// 1 módulo principal elegível (produto liberado) e ainda não liberado pra
// essa cliente. Retorna null se não sobrar nenhuma.
function findNextAreaWithModules({ orderedAreas, entitledProductIds, unlockedModuleIds }) {
  for (const area of orderedAreas) {
    const pending = modulesForArea(area, 'principal', entitledProductIds).filter((mod) => !unlockedModuleIds.has(mod.id));
    if (pending.length > 0) return { area, modules: pending };
  }
  return null;
}

// Ética como camada transversal — ver comentário no topo do arquivo.
function hasEthicsAlert(diagnosticId) {
  const diagnostic = db.prepare('SELECT hard_rule_flags FROM diagnostics WHERE id = ?').get(diagnosticId);
  const hardRuleFlags = JSON.parse(diagnostic?.hard_rule_flags || '[]');
  const hasEthicsHardRule = hardRuleFlags.some((f) => f.area === 'ethics' || (f.blocks || []).includes('ethics'));
  if (hasEthicsHardRule) return true;

  const ethicsBlock = db
    .prepare(`SELECT red_flags FROM diagnostic_blocks WHERE diagnostic_id = ? AND block_id = 'ethics'`)
    .get(diagnosticId);
  const ethicsRedFlags = JSON.parse(ethicsBlock?.red_flags || '[]');
  return ethicsRedFlags.some((f) => f.type === 'ALERTA');
}

async function unlockAreaModules({ userId, diagnosticId, area, modules, source, diagnosticContextForMessage }) {
  const unlocked = [];
  for (const mod of modules) {
    let aiMessage = null;
    try {
      aiMessage = await generateUnlockMessage({
        areaLabel: AREA_LABELS.get(area) || area,
        moduleTitle: mod.title,
        primaryBottleneck: diagnosticContextForMessage?.primaryBottleneck,
        businessStageTitle: diagnosticContextForMessage?.businessStageTitle,
      });
    } catch (err) {
      console.error(`Não foi possível gerar a mensagem de liberação pro módulo ${mod.id}:`, err.message);
    }
    unlockModuleRow({ userId, moduleId: mod.id, diagnosticId, area, source, aiMessage });
    unlocked.push({ moduleId: mod.id, moduleTitle: mod.title, area, aiMessage });
  }
  return unlocked;
}

// Libera a área de maior prioridade que a cliente ainda não tem liberada
// (a próxima da ordem calculada), e junto os módulos principais de ética
// se o diagnóstico dela sinalizou alerta de ética. Usado tanto pelo
// gatilho automático (logo que o relatório final fica pronto) quanto pelo
// botão manual do Admin → Clientes — a única diferença entre os dois é o
// "source" gravado, pra manter o histórico de quem liberou o quê.
async function unlockNextArea(userId, diagnosticId, source) {
  const plan = computeUnlockPlan(diagnosticId);
  const entitledProductIds = userEntitledProductIds(userId);
  const unlockedModuleIds = getUnlockedModuleIds(userId);

  const next = findNextAreaWithModules({ orderedAreas: plan.orderedAreas, entitledProductIds, unlockedModuleIds });
  if (!next) return { unlocked: [], area: null };

  const diagnostic = db.prepare('SELECT final_report FROM diagnostics WHERE id = ?').get(diagnosticId);
  const finalReport = diagnostic?.final_report ? JSON.parse(diagnostic.final_report) : null;
  const diagnosticContextForMessage = finalReport
    ? {
        primaryBottleneck: finalReport.primary_bottleneck?.description,
        businessStageTitle: finalReport.business_stage?.title,
      }
    : null;

  const unlocked = await unlockAreaModules({
    userId,
    diagnosticId,
    area: next.area,
    modules: next.modules,
    source,
    diagnosticContextForMessage,
  });

  if (next.area !== 'ethics' && hasEthicsAlert(diagnosticId)) {
    const ethicsModules = modulesForArea('ethics', 'principal', entitledProductIds).filter(
      (mod) => !unlockedModuleIds.has(mod.id)
    );
    if (ethicsModules.length > 0) {
      const ethicsUnlocked = await unlockAreaModules({
        userId,
        diagnosticId,
        area: 'ethics',
        modules: ethicsModules,
        source,
        diagnosticContextForMessage,
      });
      unlocked.push(...ethicsUnlocked);
    }
  }

  return { unlocked, area: next.area };
}

// Chamado automaticamente depois que o relatório final fica pronto — libera
// só a área de maior prioridade (o próximo passo mais urgente). As demais
// áreas ficam disponíveis pra liberação manual (ou, no futuro, outro
// gatilho automático) — não libera tudo de uma vez.
function autoUnlockNextArea(userId, diagnosticId) {
  return unlockNextArea(userId, diagnosticId, 'auto');
}

// Chamado pelo Admin → Clientes quando a Andréa quiser avançar manualmente
// pra próxima área da ordem de prioridade dessa cliente.
function manualUnlockNextArea(userId, diagnosticId) {
  return unlockNextArea(userId, diagnosticId, 'manual');
}

// Status completo pro Admin → Clientes: ordem de áreas, o que já foi
// liberado, e o que está recomendado como apoio (sem liberar sozinho).
function getClientUnlockStatus(userId, diagnosticId) {
  const plan = computeUnlockPlan(diagnosticId);
  const entitledProductIds = userEntitledProductIds(userId);
  const unlockedRows = db
    .prepare('SELECT module_id, reason_area, source, ai_message, unlocked_at FROM module_unlocks WHERE user_id = ?')
    .all(userId);
  const unlockedByModuleId = new Map(unlockedRows.map((r) => [r.module_id, r]));

  const areas = plan.orderedAreas.map((area) => {
    const principal = modulesForArea(area, 'principal', entitledProductIds).map((mod) => ({
      id: mod.id,
      title: mod.title,
      unlocked: unlockedByModuleId.has(mod.id),
      unlockInfo: unlockedByModuleId.get(mod.id) || null,
    }));
    const apoio = modulesForArea(area, 'apoio', entitledProductIds).map((mod) => ({
      id: mod.id,
      title: mod.title,
      unlocked: unlockedByModuleId.has(mod.id),
      unlockInfo: unlockedByModuleId.get(mod.id) || null,
    }));
    return {
      area,
      label: AREA_LABELS.get(area) || area,
      isTopPriority: plan.topPriorityAreas.includes(area),
      principal,
      apoio,
      allPrincipalUnlocked: principal.length > 0 && principal.every((m) => m.unlocked),
      hasPrincipalModules: principal.length > 0,
    };
  });

  return { areas, topPriorityAreas: plan.topPriorityAreas, hasFinalReport: plan.hasFinalReport };
}

module.exports = {
  autoUnlockNextArea,
  manualUnlockNextArea,
  getClientUnlockStatus,
  getUnlockedModuleIds,
};
