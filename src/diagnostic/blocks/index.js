// Registro dos blocos do Diagnóstico 360 que já têm especificação técnica
// implementada. Novos blocos entram aqui um de cada vez.
const businessCurrent = require('./business_current');
const targetAudience = require('./target_audience');
const positioning = require('./positioning');
const differentiation = require('./differentiation');
const offer = require('./offer');
const pricingMonetization = require('./pricing_monetization');
const communication = require('./communication');
const marketingAcquisition = require('./marketing_acquisition');
const salesConversion = require('./sales_conversion');

const IMPLEMENTED_BLOCKS = {
  [businessCurrent.id]: businessCurrent,
  [targetAudience.id]: targetAudience,
  [positioning.id]: positioning,
  [differentiation.id]: differentiation,
  [offer.id]: offer,
  [pricingMonetization.id]: pricingMonetization,
  [communication.id]: communication,
  [marketingAcquisition.id]: marketingAcquisition,
  [salesConversion.id]: salesConversion,
};

function getBlockModule(blockId) {
  return IMPLEMENTED_BLOCKS[blockId] || null;
}

module.exports = { getBlockModule };
