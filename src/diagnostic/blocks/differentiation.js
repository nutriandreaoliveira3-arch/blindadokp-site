// BLOCO 4 — DIFERENCIAÇÃO
// A especificação técnica detalhada deste bloco (campos, opções de múltipla
// escolha, red flags) não estava no material entregue — só a versão
// resumida (documento "Diagnóstico Blindado 360"), com as 8 perguntas em
// texto corrido. Seguindo a própria instrução da Andréa nesse caso ("não
// inventar novas regras de negócio, usar o que existe como contrato e pedir
// a especificação detalhada"), as 8 perguntas viraram campos de texto livre,
// sem múltipla escolha nem red flags automáticas inventadas. Quando a
// especificação detalhada existir, este bloco pode ser refeito no mesmo
// padrão dos Blocos 1-3.

const QUESTIONS = [
  {
    id: 'q1_importancia',
    title: 'Por que o diferencial importa',
    content: 'Por que seu diferencial é importante para o cliente?',
    fields: [{ id: 'differential_importance_reason', label: 'Resposta', type: 'textarea', required: true }],
  },
  {
    id: 'q2_elogios',
    title: 'O que os clientes percebem',
    content: 'O que seus clientes mais elogiam ou percebem de diferente em você?',
    fields: [{ id: 'client_praised_differences', label: 'Resposta', type: 'textarea', required: true }],
  },
  {
    id: 'q3_metodo',
    title: 'Método próprio',
    content: 'Você possui método, protocolo, processo ou ferramenta própria?',
    fields: [{ id: 'has_own_method', label: 'Resposta', type: 'textarea', required: true }],
  },
  {
    id: 'q4_combinacao',
    title: 'Combinação de experiências',
    content: 'Existe alguma combinação de conhecimentos ou experiências que diferencia sua atuação?',
    fields: [{ id: 'unique_experience_combination', label: 'Resposta', type: 'textarea', required: true }],
  },
  {
    id: 'q5_valor_extra',
    title: 'Valor entregue além do serviço',
    content: 'O que você entrega além do serviço principal que realmente aumenta valor?',
    fields: [{ id: 'extra_value_delivered', label: 'Resposta', type: 'textarea', required: true }],
  },
  {
    id: 'q6_dificil_copiar',
    title: 'O que é difícil de copiar',
    content: 'O que seria mais difícil para um concorrente copiar?',
    fields: [{ id: 'hard_to_copy_aspect', label: 'Resposta', type: 'textarea', required: true }],
  },
  {
    id: 'q7_evidencias',
    title: 'Evidências do diferencial',
    content: 'Que evidências sustentam seus diferenciais?',
    fields: [{ id: 'differential_evidence', label: 'Resposta', type: 'textarea', required: true }],
  },
  {
    id: 'q8_frase',
    title: 'Complete a frase',
    content: 'Complete: "Um cliente deveria me escolher porque…"',
    fields: [{ id: 'client_choice_reason', label: 'Um cliente deveria me escolher porque…', type: 'textarea', required: true }],
  },
];

// Sem regras determinísticas nem red flags inventadas — a especificação
// detalhada deste bloco não foi entregue (ver comentário no topo do
// arquivo). Só armazena as respostas como dados derivados diretos, pra
// ficarem disponíveis quando o Motor de IA cruzar os blocos.
function analyze(answers) {
  const derived = {
    declared_differential_reason: answers.differential_importance_reason || null,
    client_choice_reason: answers.client_choice_reason || null,
  };
  return { derived, redFlags: [] };
}

module.exports = { id: 'differentiation', questions: QUESTIONS, analyze };
