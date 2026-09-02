// Entregável Premium — Business Book Blindado. Diferente dos outros 4
// entregáveis (que geram e liberam sozinhos assim que o relatório final
// fica pronto), esse é gerado só quando a Andréa pedir, e só fica visível
// pra cliente quando ela liberar separadamente ("eu entrego quando achar
// necessário") — pensado pra ser um marco (ex.: depois de uma evolução real
// no Índice Histórico), não mais um item de dia 1.
//
// É uma síntese: puxa o Dossiê de Posicionamento já gerado, o Roadmap
// Blindado, o Índice Histórico (se já tiver 2+ rodadas) e o relatório
// final — e a IA escreve o texto de conexão entre tudo isso (abertura,
// transições, encerramento). Nunca reinventa dado que já existe em outro
// lugar, e nunca inventa o que falta (ex.: sem 2ª rodada ainda, a seção de
// evolução vira "ponto de partida", não uma comparação forçada).
const { getClient } = require('../ai/client');
const { COLOR_THEMES } = require('./generateLandingPage');

const MODEL = 'claude-sonnet-5';

const OUTPUT_SCHEMA_DESCRIPTION = `Responda com um único objeto JSON, sem markdown fora do campo "html", sem comentários, com exatamente estes campos:
{
  "title": "string (título do livro, ex: 'Business Book Blindado — [Nome/Nicho da cliente]')",
  "theme_used": "string (nome do tema de cor escolhido, ex: 'Dourado Premium')",
  "html": "string — o HTML completo do livro (<!DOCTYPE html> até </html>), com todo o CSS dentro de uma tag <style> no <head>. Sem dependências externas (sem link pra CDN, sem imagem externa)."
}`;

function buildPrompt(context) {
  const businessAnswers = context.answers_summary.business || {};
  const hasEvolution = Array.isArray(context.history) && context.history.length >= 2;

  return `Você é redator(a) sênior, especializado em compilar o material estratégico de uma cliente num "livro do negócio" premium, coeso e bem escrito — pra profissionais da saúde regulados por conselho de classe.

Monte o Business Book Blindado dessa cliente específica, em HTML + CSS inline (arquivo único, sem dependência externa). Você recebe abaixo o material que JÁ existe pra ela (Dossiê de Posicionamento, Roadmap, Índice Histórico, relatório final) — sua função é ESCREVER O TEXTO DE CONEXÃO entre essas peças (abertura, transições, encerramento) e organizar tudo num documento único e bonito. NUNCA invente dado, número, resultado ou fala que não esteja nos dados abaixo.

DADOS DESSA CLIENTE:
${JSON.stringify(
  {
    profissao: businessAnswers.profession,
    twelve_month_goal: context.twelve_month_goal,
    business_stage: context.business_stage,
    reportHighlights: context.reportHighlights || {},
  },
  null,
  2
)}

DOSSIÊ DE POSICIONAMENTO (já gerado — reaproveite, não reescreva do zero):
${JSON.stringify(context.dossie || {}, null, 2)}

ROADMAP BLINDADO (ordem de prioridade, o que já foi liberado):
${JSON.stringify(context.roadmap || [], null, 2)}

ÍNDICE HISTÓRICO (rodadas do Diagnóstico 360 já liberadas, em ordem cronológica):
${JSON.stringify(context.history || [], null, 2)}
${hasEvolution ? '' : '\n(Só existe 1 rodada liberada até agora — não faça nenhuma comparação de "antes/depois", trate essa seção como o PONTO DE PARTIDA da cliente, não uma evolução.)'}

OUTROS ATIVOS BLINDADOS QUE ELA JÁ TEM (só cite que existem, não reproduza o conteúdo completo deles):
${JSON.stringify(context.otherAssets || {}, null, 2)}

ESTRUTURA OBRIGATÓRIA DO LIVRO (nessa ordem, cada uma como uma seção/capítulo visualmente distinto, tipo capa de livro):
1. Capa — nome/profissão da cliente, um título de efeito, data. Espaço de foto (ver regra abaixo).
2. Quem você é — posicionamento, diferencial, proposta de valor, mensagem central (do Dossiê).
3. Sua Jornada — ${hasEvolution ? 'comparação de evolução (score geral e áreas), antes/depois, com as datas reais do Índice Histórico' : 'ponto de partida (primeira rodada do Diagnóstico 360), sem comparação — deixe claro que a evolução vai aparecer aqui numa próxima atualização do livro'}.
4. Seu Roadmap — a trilha por prioridade, o que já foi liberado, o que vem a seguir.
5. Seus Ativos Blindados — menção rápida aos outros entregáveis que ela já tem (Landing Page Premium, Assistente IA Particular, Manual de Comunicação Ética), o que cada um faz por ela.
6. Encerramento — fechamento motivacional + nota de comunicação ética (sem prometer resultado clínico/financeiro específico, nem garantia).

REGRAS OBRIGATÓRIAS:
- Espaço de foto na capa: NUNCA use uma URL de imagem real. Use uma div com gradiente de fundo e o texto "SUA FOTO AQUI" centralizado, com um comentário HTML <!-- Troque por uma foto real --> logo acima.
- Nunca prometa resultado clínico, financeiro ou de saúde específico, nem escreva como garantia.
- Escolha 1 dos 6 temas de cor abaixo e aplique de forma consistente, com uma identidade visual de "livro" (capítulos numerados, tipografia editorial):
${COLOR_THEMES}
- HTML responsivo, tipografia legível, cada capítulo com respiro visual (não amontoar tudo).
- Português do Brasil, tom mais elevado/editorial que os outros entregáveis (é pra parecer um livro, não uma página de vendas).

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
  if (!output.title) errors.push('campo obrigatório ausente: title');
  if (!output.theme_used) errors.push('campo obrigatório ausente: theme_used');
  if (!output.html || typeof output.html !== 'string') {
    errors.push('campo obrigatório ausente: html');
  } else {
    if (!/<!DOCTYPE html>/i.test(output.html)) errors.push('html não parece um documento completo (sem <!DOCTYPE html>)');
    if (!/<style/i.test(output.html)) errors.push('html não tem <style> — CSS precisa estar inline');
    if (output.html.length < 1500) errors.push('html gerado ficou pequeno demais — provavelmente incompleto');
    if (/\bsrc\s*=\s*["']https?:\/\//i.test(output.html)) errors.push('html referencia imagem externa — não é permitido (sem foto real da cliente)');
  }
  return { valid: errors.length === 0, errors };
}

async function generateBusinessBook(context) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildPrompt(context) }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('Resposta da IA não trouxe conteúdo de texto ao gerar o Business Book Blindado.');
  }

  const parsed = extractJson(textBlock.text);
  const { valid, errors } = validate(parsed);
  if (!valid) {
    throw new Error('Business Book Blindado gerado com problemas: ' + errors.join('; '));
  }
  return parsed;
}

module.exports = { generateBusinessBook };
