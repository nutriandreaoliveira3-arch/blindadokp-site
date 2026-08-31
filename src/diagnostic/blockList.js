// Os 15 blocos oficiais do Diagnóstico Blindado 360 (ver docs enviados pela
// Andréa: "Diagnóstico Blindado 360" e "BLINDADOKP_NEGÓCIO_ATUAL"). Por
// enquanto só o Bloco 1 tem especificação técnica implementada — os demais
// entram nas próximas fases, um de cada vez, seguindo a mesma estrutura.
const BLOCK_LIST = [
  { id: 'business_current', order: 1, name: 'Negócio Atual' },
  { id: 'audience', order: 2, name: 'Público e Cliente Ideal' },
  { id: 'positioning', order: 3, name: 'Posicionamento' },
  { id: 'differentiation', order: 4, name: 'Diferenciação' },
  { id: 'offer', order: 5, name: 'Oferta' },
  { id: 'pricing', order: 6, name: 'Precificação e Monetização' },
  { id: 'communication', order: 7, name: 'Comunicação e Conteúdo' },
  { id: 'acquisition', order: 8, name: 'Marketing e Aquisição' },
  { id: 'sales', order: 9, name: 'Vendas e Conversão' },
  { id: 'operations', order: 10, name: 'Operação e Entrega' },
  { id: 'ai', order: 11, name: 'Inteligência Artificial' },
  { id: 'automation', order: 12, name: 'Automação' },
  { id: 'ethics', order: 13, name: 'Ética e Comunicação Profissional' },
  { id: 'retention', order: 14, name: 'Experiência, Retenção e Renovação' },
  { id: 'metrics', order: 15, name: 'Gestão, Métricas e Tomada de Decisão' },
];

module.exports = { BLOCK_LIST };
