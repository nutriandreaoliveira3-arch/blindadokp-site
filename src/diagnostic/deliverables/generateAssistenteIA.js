// Entregável Premium — Assistente IA Particular do Cliente. Diferente dos
// outros dois (documento estruturado em JSON), este é um arquivo de skill
// de verdade — a cliente instala no Claude.ai dela, do mesmo jeito que
// instala a Skill Blindada Pro — mas personalizado com o negócio
// específica dela (profissão, público, posicionamento, oferta). Por isso
// o custo de gerar é único (na entrega), e o uso dela depois roda na conta
// de Claude.ai da própria cliente, não na nossa.
//
// A base é o SKILL.md real da Skill Blindada Pro (scripts/skill-content/
// skill-blindada-pro.md) — a IA só adiciona uma seção de contexto do
// negócio específico no topo e ajusta a inicialização; a estrutura de
// comandos e o bloco de conformidade ética (seção 6 do arquivo original)
// têm que continuar exatamente iguais, nunca reescritos.
const fs = require('fs');
const path = require('path');
const { getClient } = require('../ai/client');

const MODEL = 'claude-sonnet-5';
const BASE_SKILL_PATH = path.join(__dirname, '..', '..', '..', 'scripts', 'skill-content', 'skill-blindada-pro.md');

function readBaseSkill() {
  return fs.readFileSync(BASE_SKILL_PATH, 'utf8');
}

function buildPrompt(context, baseSkill) {
  const businessAnswers = context.answers_summary.business || {};
  return `Você vai personalizar um arquivo de skill do Claude.ai pra uma cliente específica, a partir do arquivo-base abaixo.

ARQUIVO-BASE (SKILL BLINDADA PRO — genérico):
"""
${baseSkill}
"""

DADOS DESSA CLIENTE (do Diagnóstico Blindado 360 dela):
${JSON.stringify(
  {
    profissao: businessAnswers.profession,
    twelve_month_goal: context.twelve_month_goal,
    business_stage: context.business_stage,
    audience: context.answers_summary.audience,
    positioning: context.answers_summary.positioning,
    differentiation: context.answers_summary.differentiation,
    offer: context.answers_summary.offer,
    reportHighlights: context.reportHighlights || {},
  },
  null,
  2
)}

TAREFA:
Gere uma versão personalizada do arquivo-base pra essa cliente específica. Regras obrigatórias:
1. Mantenha a ESTRUTURA inteira do arquivo-base (todas as seções numeradas, do jeito que estão) — não remova nem reescreva o conteúdo original, especialmente a seção "6. CONFORMIDADE ÉTICA" e a lista de comandos (seção 17) — copie essas seções EXATAMENTE como estão no arquivo-base, palavra por palavra.
2. Adicione uma NOVA seção logo depois da seção "1. IDENTIDADE", chamada "1.1 CONTEXTO DESSE NEGÓCIO ESPECÍFICO", com: profissão dela, público-alvo, posicionamento atual, diferencial, oferta principal, e o gargalo/objetivo que o diagnóstico identificou — tudo em 1 parágrafo curto por item, só com o que está nos dados acima, nunca inventando número, prêmio ou resultado.
3. No campo "name" do frontmatter YAML, use algo como "skill-blindada-pro-[iniciais ou área da profissão]" (ajuste conforme fizer sentido, mantendo minúsculo e com hífen).
4. Ajuste o bloco "19. INICIALIZAÇÃO" pra já cumprimentar reconhecendo a área dela, mas sem inventar dado que não esteja acima.
5. Não mude nenhuma regra de conformidade ética, nenhum comando, nenhuma regra de qualidade — só adicione o contexto e personalize a saudação.

Retorne SOMENTE o texto completo do novo arquivo .md personalizado — sem comentário antes ou depois, sem explicar o que você fez.`;
}

async function generateAssistenteIA(context) {
  const baseSkill = readBaseSkill();
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildPrompt(context, baseSkill) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar o Assistente IA Particular.');
  }

  const content = textBlock.text.trim();
  if (content.length < 500) {
    throw new Error('Assistente IA Particular gerado ficou pequeno demais — provavelmente incompleto.');
  }
  if (!content.includes('CONFORMIDADE ÉTICA')) {
    throw new Error('Assistente IA Particular gerado não preservou o bloco de conformidade ética — descartado por segurança.');
  }
  return { skill_md: content };
}

module.exports = { generateAssistenteIA };
