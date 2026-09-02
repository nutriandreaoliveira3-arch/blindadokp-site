// BLOCO 11 — INTELIGÊNCIA ARTIFICIAL
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 11 — INTELIGÊNCIA ARTIFICIAL").
// Objetivo: entender como o profissional usa IA hoje, seu nível de maturidade,
// onde existe ganho operacional real e onde a IA ainda não deve entrar.

const AI_USAGE_LEVEL_OPTIONS = [
  { value: 'not_using', label: 'Ainda não uso' },
  { value: 'occasional_simple', label: 'Uso ocasionalmente para tarefas simples' },
  { value: 'frequent_some', label: 'Uso com frequência em algumas atividades' },
  { value: 'integrated_several', label: 'A IA já faz parte de vários processos' },
  { value: 'custom_agents', label: 'Tenho processos, agentes ou assistentes personalizados' },
  { value: 'unsure', label: 'Não sei avaliar meu nível' },
];

const AI_USE_CASES_OPTIONS = [
  { value: 'conteudo', label: 'Conteúdo' },
  { value: 'pesquisa', label: 'Pesquisa' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'estrategia', label: 'Estratégia' },
  { value: 'design_imagens', label: 'Design/imagens' },
  { value: 'videos', label: 'Vídeos' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'documentos_materiais', label: 'Documentos/materiais' },
  { value: 'organizacao', label: 'Organização' },
  { value: 'analise_dados', label: 'Análise de dados' },
  { value: 'processos_internos', label: 'Processos internos' },
  { value: 'automacao', label: 'Automação' },
  { value: 'ainda_nao_uso', label: 'Ainda não uso' },
  { value: 'outro', label: 'Outro' },
];

const DESIRED_AI_SUPPORT_OPTIONS = [
  { value: 'estrategia_decisoes', label: 'Estratégia e decisões' },
  { value: 'posicionamento', label: 'Posicionamento' },
  { value: 'oferta_produtos', label: 'Oferta/produtos' },
  { value: 'conteudo', label: 'Conteúdo' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'organizacao_clientes', label: 'Organização de clientes' },
  { value: 'processos_internos', label: 'Processos internos' },
  { value: 'documentos_materiais', label: 'Documentos e materiais' },
  { value: 'analise_metricas', label: 'Análise de métricas' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'pesquisa', label: 'Pesquisa' },
  { value: 'gestao', label: 'Gestão' },
  { value: 'reducao_tarefas_repetitivas', label: 'Redução de tarefas repetitivas' },
  { value: 'outro', label: 'Outro' },
];

const AI_CONTEXT_MATURITY_OPTIONS = [
  { value: 'structured_reusable', label: 'Tenho uma estrutura de contexto organizada e reutilizável' },
  { value: 'some_saved_info', label: 'Tenho algumas informações salvas' },
  { value: 'different_templates', label: 'Uso instruções/modelos diferentes' },
  { value: 'explain_every_time', label: 'Normalmente explico tudo de novo' },
  { value: 'low_context', label: 'Uso IA sem fornecer muito contexto' },
  { value: 'not_using_ai', label: 'Ainda não uso IA' },
];

const AI_INSECURITY_OPTIONS = [
  { value: 'decisoes_estrategicas', label: 'Decisões estratégicas' },
  { value: 'informacoes_profissionais_tecnicas', label: 'Informações profissionais/técnicas' },
  { value: 'atendimento_cliente', label: 'Atendimento ao cliente' },
  { value: 'dados_confidenciais', label: 'Dados confidenciais' },
  { value: 'comunicacao_etica', label: 'Comunicação ética' },
  { value: 'conteudo', label: 'Conteúdo' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'analise_dados', label: 'Análise de dados' },
  { value: 'automacao', label: 'Automação' },
  { value: 'sem_inseguranca_relevante', label: 'Não tenho insegurança relevante' },
  { value: 'nao_conheco_ia_suficiente', label: 'Ainda não conheço IA o suficiente' },
  { value: 'outro', label: 'Outro' },
];

const PRIMARY_AI_OUTCOME_OPTIONS = [
  { value: 'economizar_tempo', label: 'Economizar tempo' },
  { value: 'produzir_consistencia', label: 'Produzir com mais consistência' },
  { value: 'decisoes_clareza', label: 'Tomar decisões com mais clareza' },
  { value: 'organizar_negocio', label: 'Organizar melhor o negócio' },
  { value: 'reduzir_trabalho_repetitivo', label: 'Reduzir trabalho repetitivo' },
  { value: 'aumentar_capacidade_atendimento', label: 'Aumentar capacidade de atendimento/entrega' },
  { value: 'melhorar_vendas', label: 'Melhorar vendas' },
  { value: 'melhorar_analise_dados', label: 'Melhorar análise de dados' },
  { value: 'criar_novos_produtos_processos', label: 'Criar novos produtos/processos' },
  { value: 'trabalhar_menos_ferramentas', label: 'Trabalhar com menos ferramentas' },
  { value: 'outro', label: 'Outro' },
];

// Ranking ordinal só para os níveis com significado de "frequência" claro
// (usado na REGRA 01). "unsure" fica de fora — não permite comparação.
const AI_USAGE_LEVEL_RANK = {
  not_using: 0,
  occasional_simple: 1,
  frequent_some: 2,
  integrated_several: 3,
  custom_agents: 4,
};

// Mapeamento literal do exemplo dado na especificação ("content, images,
// captions") para as opções reais da Pergunta 2 — conteúdo, design/imagens
// e vídeos são as três categorias de produção de conteúdo entre as opções
// disponíveis.
const CONTENT_ONLY_USE_CASES = ['conteudo', 'design_imagens', 'videos'];

const LOW_CONTEXT_LEVELS = ['explain_every_time', 'low_context'];

const QUESTIONS = [
  {
    id: 'q1_nivel_uso',
    title: 'Nível atual de uso',
    content: 'Como você descreveria seu uso atual de Inteligência Artificial no trabalho?',
    fields: [
      { id: 'ai_usage_level', label: 'Nível de uso', type: 'select', options: AI_USAGE_LEVEL_OPTIONS, required: true },
    ],
  },
  {
    id: 'q2_onde_usa',
    title: 'Onde já utiliza IA',
    content: 'Em quais atividades você já utiliza Inteligência Artificial?',
    fields: [
      { id: 'current_ai_use_cases', label: 'Atividades', type: 'multiselect', options: AI_USE_CASES_OPTIONS, required: true },
      {
        id: 'current_ai_use_cases_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'current_ai_use_cases', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q3_onde_precisa',
    title: 'Onde mais precisa de ajuda',
    content: 'Em quais áreas você mais gostaria de ter ajuda inteligente no negócio?',
    fields: [
      { id: 'desired_ai_support_areas', label: 'Áreas', type: 'multiselect', options: DESIRED_AI_SUPPORT_OPTIONS, required: true },
      {
        id: 'desired_ai_support_areas_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'desired_ai_support_areas', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q4_contexto',
    title: 'Contexto do negócio',
    content: 'Quando você usa IA, ela já conhece informações importantes sobre seu negócio ou você precisa explicar tudo novamente a cada conversa?',
    fields: [
      { id: 'ai_business_context_maturity', label: 'Contexto usado', type: 'select', options: AI_CONTEXT_MATURITY_OPTIONS, required: true },
    ],
  },
  {
    id: 'q5_inseguranca',
    title: 'Onde existe insegurança',
    content: 'Em quais situações você evita ou limita o uso de IA porque não confia totalmente no resultado?',
    fields: [
      { id: 'ai_insecurity_areas', label: 'Áreas de insegurança', type: 'multiselect', options: AI_INSECURITY_OPTIONS, required: true },
      {
        id: 'ai_insecurity_areas_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'ai_insecurity_areas', includes: 'outro' },
      },
    ],
  },
  {
    id: 'q6_resultado',
    title: 'Resultado desejado com IA',
    content: 'Qual seria o principal ganho que faria a Inteligência Artificial valer a pena para você?',
    fields: [
      { id: 'primary_ai_outcome', label: 'Principal ganho', type: 'select', options: PRIMARY_AI_OUTCOME_OPTIONS, required: true },
      {
        id: 'primary_ai_outcome_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'primary_ai_outcome', equals: 'outro' },
      },
    ],
  },
];

// Dados derivados e red flags determinísticas do Bloco 11 (seções 6, 9 e 13).
// As 6 dimensões de score (seção 12) dependem de julgamento qualitativo da
// Blindada Pro sobre maturidade, personalização, integração etc. — ficam
// para o Motor de IA. A REGRA 02 (muitas ferramentas sem integração) e a
// REGRA 06 (trabalho demais com prompts) pedem leitura livre da situação da
// cliente, sem critério objetivo dado. A REGRA 04 (bloquear automação de
// julgamento profissional) e a REGRA 07 (IA sem revisão) descrevem
// comportamento do próprio Motor de IA ao gerar recomendações — não são
// dados coletados neste bloco. A REGRA 05 depende do process_standardization
// score do Bloco 10, que também é qualitativo e não foi calculado lá. Nada
// disso é inventado aqui.
function analyze(answers) {
  const derived = {
    ai_usage_level: answers.ai_usage_level || null,
    ai_business_context_maturity: answers.ai_business_context_maturity || null,
    primary_ai_outcome: answers.primary_ai_outcome || null,
    ai_priority_areas: Array.isArray(answers.desired_ai_support_areas) ? answers.desired_ai_support_areas : [],
  };

  const redFlags = [];

  const lowContext = LOW_CONTEXT_LEVELS.includes(answers.ai_business_context_maturity);
  derived.digital_brain_need = lowContext;

  // Seção 6, Pergunta 4 — regra dada literalmente na especificação.
  if (lowContext) {
    redFlags.push({
      rule: 'contexto_ia_insuficiente',
      type: 'OPORTUNIDADE',
      message:
        'A IA ainda trabalha com pouco contexto permanente sobre seu negócio, o que tende a gerar respostas mais genéricas e aumentar retrabalho.',
    });
  }

  // Seção 13, REGRA 01 — mesma condição de contexto, qualificada pela
  // frequência de uso (ai_usage_level >= frequent_some).
  const usageRank = AI_USAGE_LEVEL_RANK[answers.ai_usage_level];
  if (lowContext && usageRank !== undefined && usageRank >= AI_USAGE_LEVEL_RANK.frequent_some) {
    redFlags.push({
      rule: 'ia_frequente_sem_contexto',
      type: 'OPORTUNIDADE',
      message:
        'Você utiliza IA com frequência, mas ainda precisa reconstruir contexto constantemente. Existe oportunidade de estruturar uma base permanente do negócio.',
    });
  }

  // Seção 4, "REGRA IMPORTANTE" da Pergunta 2 — uso concentrado só em
  // produção de conteúdo.
  const useCases = Array.isArray(answers.current_ai_use_cases) ? answers.current_ai_use_cases : [];
  const isContentOnly = useCases.length > 0 && useCases.every((v) => CONTENT_ONLY_USE_CASES.includes(v));
  if (isContentOnly) {
    redFlags.push({
      rule: 'ia_concentrada_em_conteudo',
      type: 'OPORTUNIDADE',
      message:
        'Seu uso atual está concentrado na produção. Existem outras áreas do negócio em que a IA pode assumir funções de análise, organização ou execução.',
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'ai', questions: QUESTIONS, analyze };
