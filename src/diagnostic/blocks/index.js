// Registro dos blocos do Diagnóstico 360 que já têm especificação técnica
// implementada. Novos blocos entram aqui um de cada vez.
const businessCurrent = require('./business_current');

const IMPLEMENTED_BLOCKS = {
  [businessCurrent.id]: businessCurrent,
};

function getBlockModule(blockId) {
  return IMPLEMENTED_BLOCKS[blockId] || null;
}

module.exports = { getBlockModule };
