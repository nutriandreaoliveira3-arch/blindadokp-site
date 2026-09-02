// IDs oficiais de área usados no Contrato JSON Final (Etapa 20, seção 15) e
// no Prompt Mestre (Etapa 19, seção "FONTE DOS DADOS"). A especificação usa
// "business", mas o nosso Bloco 1 é identificado internamente como
// "business_current" (ver blockList.js) — esse é o único id que diverge
// entre os dois lados; os outros 14 já batem. BLOCK_ID_TO_AREA_ID existe só
// pra fazer essa tradução ao montar o contexto pra IA e ao validar a saída
// dela, sem renomear nada no resto do código já implementado.
const VALID_AREA_IDS = [
  'business',
  'audience',
  'positioning',
  'differentiation',
  'offer',
  'pricing',
  'communication',
  'acquisition',
  'sales',
  'operations',
  'ai',
  'automation',
  'ethics',
  'retention',
  'metrics',
];

const BLOCK_ID_TO_AREA_ID = {
  business_current: 'business',
};

function toAreaId(blockId) {
  return BLOCK_ID_TO_AREA_ID[blockId] || blockId;
}

module.exports = { VALID_AREA_IDS, BLOCK_ID_TO_AREA_ID, toAreaId };
