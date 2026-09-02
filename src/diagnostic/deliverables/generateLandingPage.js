// Entregável Premium — Landing Page Premium. Página pronta (HTML + CSS
// inline, arquivo único), personalizada com o negócio da cliente, gerada
// a partir do Diagnóstico 360 — ela responde as perguntas uma vez, a
// página sai pronta do outro lado (foi o pedido explícito da Andréa, sem
// processo de vários dias). Sem foto real da cliente (não temos isso no
// diagnóstico) e sem preço inventado — os dois ficam marcados como espaço
// reservado, pra ela preencher.
const { getClient } = require('../ai/client');

const MODEL = 'claude-sonnet-5';

// Mesmos 6 temas de cor já usados na Skill TopClaudia (skil-topclaudia-
// generic.md) — reaproveita pra manter consistência visual entre os
// entregáveis, em vez de a IA inventar uma paleta nova a cada geração.
const COLOR_THEMES = `
1 — Dourado Premium: fundo #1C1C1C, texto #FFFFFF, destaque #C9A227
2 — Rosé Elegante: fundo #221A1C, texto #FDF6F5, destaque #D9A5A0
3 — Verde Bem-Estar: fundo #142019, texto #F3FBF6, destaque #7FB77E
4 — Azul Clínico: fundo #101B24, texto #F2F8FC, destaque #4FA3D1
5 — Terracota Aconchegante: fundo #221510, texto #FBF3EC, destaque #C97B4A
6 — Branco Editorial (fundo claro): fundo #FFFFFF, texto #1C1C1C, destaque #B8862F
`.trim();

const OUTPUT_SCHEMA_DESCRIPTION = `Responda com um único objeto JSON, sem markdown fora do campo "html", sem comentários, com exatamente estes campos:
{
  "headline": "string (a headline principal da página)",
  "theme_used": "string (nome do tema de cor escolhido, ex: 'Dourado Premium')",
  "html": "string — o HTML completo da página (<!DOCTYPE html> até </html>), com todo o CSS dentro de uma tag <style> no <head>. Sem dependências externas (sem link pra CDN, sem imagem externa)."
}`;

function buildPrompt(context) {
  const businessAnswers = context.answers_summary.business || {};
  return `Você é redator(a) e designer de landing page sênior, especializado em páginas de vendas pra profissionais da saúde regulados por conselho de classe.

Monte uma Landing Page Premium completa e pronta pra usar, em HTML + CSS inline (um arquivo único, sem dependência externa), pra essa cliente específica — usando SÓ o que está nos dados abaixo. Nunca invente número, resultado, depoimento, prêmio ou dado que não esteja aqui.

DADOS DESSA CLIENTE (Diagnóstico Blindado 360):
${JSON.stringify(
  {
    profissao: businessAnswers.profession,
    twelve_month_goal: context.twelve_month_goal,
    business_stage: context.business_stage,
    audience: context.answers_summary.audience,
    positioning: context.answers_summary.positioning,
    differentiation: context.answers_summary.differentiation,
    offer: context.answers_summary.offer,
    pricing: context.answers_summary.pricing,
    reportHighlights: context.reportHighlights || {},
  },
  null,
  2
)}

ESTRUTURA OBRIGATÓRIA DA PÁGINA (nessa ordem):
1. Headline — a promessa central, direto do posicionamento dela. A promessa já precisa deixar entrever o diferencial dela — não pode ser uma promessa genérica que serviria pra qualquer profissional da mesma área.
2. Problema — o problema que o público dela reconhece.
3. Oferta/Proposta com diferencial em destaque — a solução/método dela, com o DIFERENCIAL (o que torna a oferta dela diferente de qualquer outro profissional) tratado como o centro dessa seção, não como um adendo. Dê destaque visual real a essa parte (bloco com fundo/borda na cor de destaque do tema, texto maior ou selo/badge), do jeito que normalmente se destaca a proposta única de venda numa página premium. Puxe o diferencial diretamente do posicionamento/diferenciação da cliente nos dados abaixo — nunca genérico.
4. Metodologia — como funciona, em etapas.
5. Frase-manifesto — uma citação curta (1 frase, no máximo 2), de efeito, escrita na primeira pessoa como se fosse a cliente falando, resumindo a filosofia/jeito dela de trabalhar (puxada do posicionamento e diferenciação dela, nunca genérica e nunca inventando fala/depoimento que ela não deu). Trate como uma seção de pausa visual só pra essa frase — tipografia grande estilo citação editorial, seguida de uma pequena "assinatura" abaixo (nome da cliente + profissão, no mesmo estilo discreto de selo/carimbo dourado). Essa seção existe pra ficar memorável e ser a frase que a pessoa lembra depois de sair da página.
6. Apresentação profissional — um espaço com foto (ver regra abaixo) + bio curta.
7. Investimento — um espaço reservado pro preço (ver regra abaixo).
8. CTA — chamada pra ação clara.
9. Qualificação — 2-3 perguntas curtas pra quem tem interesse se identificar.
10. Perguntas frequentes — 3 a 5 perguntas reais sobre o método/processo (nunca sobre resultado garantido).
11. Contato — rodapé com espaço reservado pra e-mail, WhatsApp, redes sociais e endereço (ver regra abaixo).
12. Nota de comunicação ética — rodapé pequeno, sem alarde, deixando claro que resultados variam e não há garantia.

REGRAS OBRIGATÓRIAS:
- Espaço de foto: NUNCA use uma URL de imagem real (não temos foto da cliente). Use uma div com um gradiente de fundo e o texto "SUA FOTO AQUI" centralizado, com um comentário HTML <!-- Troque por uma foto real --> logo acima.
- Espaço de preço: NUNCA invente um valor. Escreva literalmente "[SEU VALOR AQUI]" no lugar do preço, com um comentário HTML <!-- Preencha com seu valor real --> logo acima.
- Espaço de contato: NUNCA invente e-mail, telefone/WhatsApp, endereço ou @ de rede social (não temos esses dados no diagnóstico). Escreva literalmente os placeholders "[SEU E-MAIL AQUI]", "[SEU WHATSAPP AQUI]", "[SEU @ AQUI]" e "[SEU ENDEREÇO AQUI]" (inclua só o endereço se fizer sentido pra um atendimento presencial/híbrido; se for 100% online, pode omitir o endereço), cada um com um ícone simples (texto/emoji, sem imagem externa) do lado, num rodapé de contato organizado e discreto — nunca um número, e-mail ou usuário inventado.
- Nunca prometa resultado clínico, financeiro ou de saúde específico, nem escreva como garantia — isso é regra ética, não estilística, igual em toda a Skill Blindada Pro.
- Escolha 1 dos 6 temas de cor abaixo (o que combinar melhor com a profissão/tom dela) e aplique de forma consistente em toda a página:
${COLOR_THEMES}
- HTML responsivo (funciona em celular), tipografia legível, botão de CTA com bom contraste.
- Português do Brasil, direto, sem jargão de marketing vazio.

${OUTPUT_SCHEMA_DESCRIPTION}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(candidate);
}

function validate(output) {
  const errors = [];
  if (!output || typeof output !== 'object') return { valid: false, errors: ['resposta não é um objeto'] };
  if (!output.headline) errors.push('campo obrigatório ausente: headline');
  if (!output.theme_used) errors.push('campo obrigatório ausente: theme_used');
  if (!output.html || typeof output.html !== 'string') {
    errors.push('campo obrigatório ausente: html');
  } else {
    if (!/<!DOCTYPE html>/i.test(output.html)) errors.push('html não parece um documento completo (sem <!DOCTYPE html>)');
    if (!/<style/i.test(output.html)) errors.push('html não tem <style> — CSS precisa estar inline');
    if (output.html.length < 1000) errors.push('html gerado ficou pequeno demais — provavelmente incompleto');
    if (/\bsrc\s*=\s*["']https?:\/\//i.test(output.html)) errors.push('html referencia imagem externa — não é permitido (sem foto real da cliente)');
    const emailMatches = output.html.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    if (emailMatches.some((match) => !/aqui/i.test(match))) errors.push('html tem um e-mail com aparência real — não é permitido inventar contato, só o placeholder "[SEU E-MAIL AQUI]"');
    if (/\(\d{2}\)\s?\d{4,5}-?\d{4}|\+55\s?\d{2}/i.test(output.html)) errors.push('html tem um telefone/WhatsApp com aparência real — não é permitido inventar contato, só o placeholder "[SEU WHATSAPP AQUI]"');
  }
  return { valid: errors.length === 0, errors };
}

async function generateLandingPage(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildPrompt(context) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar a Landing Page Premium.');
  }

  const parsed = extractJson(textBlock.text);
  const { valid, errors } = validate(parsed);
  if (!valid) {
    throw new Error('Landing Page Premium gerada com problemas: ' + errors.join('; '));
  }
  return parsed;
}

module.exports = { generateLandingPage };
