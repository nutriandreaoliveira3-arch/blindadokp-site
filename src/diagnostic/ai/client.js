// Wrapper fino em cima do SDK da Anthropic. Centralizado aqui pra nunca
// rodar no frontend (SERVER_SIDE_ONLY, conforme a especificação) e pra dar
// um erro claro quando a chave ainda não foi configurada no Railway.
const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY não configurada. Configure a variável de ambiente no Railway (Variables) antes de gerar o relatório final do Diagnóstico 360.'
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

module.exports = { getClient };
