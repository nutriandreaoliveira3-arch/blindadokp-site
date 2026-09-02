// Textinho curto e personalizado explicando por que um módulo foi liberado
// agora pra uma cliente específica, com base no motivo real (a área do
// diagnóstico que puxou essa liberação). Roda depois que a liberação já
// aconteceu — se falhar, quem chamou (unlockEngine.js) só guarda null e
// segue, nunca bloqueia o acesso da cliente por causa disso.
const { getClient } = require('./client');

const MODEL = 'claude-sonnet-5';

function buildPrompt({ areaLabel, moduleTitle, primaryBottleneck, businessStageTitle }) {
  return `Você está escrevendo uma mensagem curta (2-3 frases, no máximo) que aparece na Área de Membros de uma cliente da Mentoria Blindada Pró, avisando que um novo módulo acabou de ser liberado pra ela.

Contexto:
- Módulo liberado agora: "${moduleTitle}"
- Motivo: o Diagnóstico Blindado 360 dela apontou "${areaLabel}" como uma área prioritária.
${primaryBottleneck ? `- Gargalo principal identificado: ${primaryBottleneck}` : ''}
${businessStageTitle ? `- Estágio atual do negócio dela: ${businessStageTitle}` : ''}

Escreva a mensagem em português do Brasil, direto e acolhedor, na segunda pessoa (falando com ela), explicando por que esse módulo foi liberado agora com base no diagnóstico dela. Não use markdown, não use listas, não invente números ou promessas de resultado. Só o texto da mensagem, sem títulos nem aspas.`;
}

async function generateUnlockMessage({ areaLabel, moduleTitle, primaryBottleneck, businessStageTitle }) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: buildPrompt({ areaLabel, moduleTitle, primaryBottleneck, businessStageTitle }) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar a mensagem de liberação.');
  }
  return textBlock.text.trim();
}

module.exports = { generateUnlockMessage };
