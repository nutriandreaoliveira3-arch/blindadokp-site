// Registro dos blocos do Diagnóstico 360 que já têm especificação técnica
// implementada. Novos blocos entram aqui um de cada vez.
const businessCurrent = require('./business_current');
const targetAudience = require('./target_audience');
const positioning = require('./positioning');

const IMPLEMENTED_BLOCKS = {
  [businessCurrent.id]: businessCurrent,
  [targetAudience.id]: targetAudience,
  [positioning.id]: positioning,
};

function getBlockModule(blockId) {
  return IMPLEMENTED_BLOCKS[blockId] || null;
}

module.exports = { getBlockModule };
