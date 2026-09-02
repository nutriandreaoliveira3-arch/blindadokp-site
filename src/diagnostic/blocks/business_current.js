// BLOCO 1 — NEGÓCIO ATUAL
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 01 — NEGÓCIO ATUAL").
// Objetivo: entender como o negócio funciona hoje, de onde vem a receita,
// capacidade, dependência do profissional e principal gargalo percebido.

// Usado pra rotear o conteúdo do Bloco 13 (Ética) pro código de ética da
// profissão certa (ver PROFESSION_ETHICS_CONTENT em blocks/ethics.js).
// 'outro' cai no conteúdo genérico até termos o código de ética levantado
// pra essa profissão especificamente.
const PROFESSION_CATEGORY_OPTIONS = [
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'medico', label: 'Médico(a)' },
  { value: 'dentista', label: 'Dentista' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'psicologo', label: 'Psicólogo(a)' },
  { value: 'fonoaudiologo', label: 'Fonoaudiólogo(a)' },
  { value: 'enfermeiro', label: 'Enfermeiro(a)' },
  { value: 'terapeuta_ocupacional', label: 'Terapeuta Ocupacional' },
  { value: 'farmaceutico', label: 'Farmacêutico(a)' },
  { value: 'biomedico', label: 'Biomédico(a)' },
  { value: 'educador_fisico', label: 'Profissional de Educação Física' },
  { value: 'outro', label: 'Outra profissão' },
];

const REVENUE_IMPORTANCE_OPTIONS = [
  { value: '1', label: 'Muito baixa' },
  { value: '2', label: 'Baixa' },
  { value: '3', label: 'Média' },
  { value: '4', label: 'Alta' },
  { value: '5', label: 'Principal fonte de receita' },
];

const MONTHLY_REVENUE_OPTIONS = [
  { value: 'ate_5k', label: 'Até R$5 mil' },
  { value: '5k_10k', label: 'R$5 mil–10 mil' },
  { value: '10k_20k', label: 'R$10 mil–20 mil' },
  { value: '20k_50k', label: 'R$20 mil–50 mil' },
  { value: '50k_100k', label: 'R$50 mil–100 mil' },
  { value: 'acima_100k', label: 'Acima de R$100 mil' },
  { value: 'nao_informar', label: 'Prefiro não informar' },
];

const PERCEIVED_PROBLEM_OPTIONS = [
  { value: 'atrair_clientes', label: 'Preciso atrair mais clientes' },
  { value: 'poucas_vendas', label: 'Tenho interesse, mas poucas vendas' },
  { value: 'oferta_confusa', label: 'Minha oferta não está clara' },
  { value: 'nao_sei_posicionar', label: 'Não sei como me posicionar' },
  { value: 'dificuldade_conteudo', label: 'Tenho dificuldade com conteúdo' },
  { value: 'preco_baixo', label: 'Meu preço parece baixo' },
  { value: 'sobrecarga', label: 'Estou sobrecarregado(a)' },
  { value: 'dependencia', label: 'Meu negócio depende demais de mim' },
  { value: 'processos_manuais', label: 'Tenho muitos processos manuais' },
  { value: 'nao_sei_ia', label: 'Não sei como usar IA no negócio' },
  { value: 'operacao_desorganizada', label: 'Minha operação está desorganizada' },
  { value: 'outro', label: 'Outro' },
];

const TIME_TASKS_OPTIONS = [
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'conteudo', label: 'Conteúdo' },
  { value: 'redes_sociais', label: 'Redes sociais' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'administracao', label: 'Administração' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'materiais', label: 'Criação de materiais' },
  { value: 'trafego', label: 'Tráfego' },
  { value: 'equipe', label: 'Gestão de equipe' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'outro', label: 'Outro' },
];

const OWNER_DEPENDENCY_OPTIONS = [
  { value: '1', label: 'Praticamente nada' },
  { value: '2', label: 'Apenas algumas atividades' },
  { value: '3', label: 'Aproximadamente metade' },
  { value: '4', label: 'A maior parte' },
  { value: '5', label: 'O negócio funcionaria quase normalmente' },
];

const TWELVE_MONTH_GOAL_OPTIONS = [
  { value: 'faturamento', label: 'Aumentar faturamento' },
  { value: 'mais_clientes', label: 'Atrair mais clientes' },
  { value: 'ticket', label: 'Aumentar ticket' },
  { value: 'trabalhar_menos', label: 'Trabalhar menos' },
  { value: 'novo_produto', label: 'Criar novo produto/serviço' },
  { value: 'equipe', label: 'Estruturar equipe' },
  { value: 'processos', label: 'Organizar processos' },
  { value: 'implementar_ia', label: 'Implementar IA' },
  { value: 'automatizar', label: 'Automatizar tarefas' },
  { value: 'posicionamento', label: 'Melhorar posicionamento' },
  { value: 'previsibilidade', label: 'Criar previsibilidade de vendas' },
  { value: 'outro', label: 'Outro' },
];

// Mapa direto (1→0, 2→1, 3→3, 4→4, 5→5) definido na especificação do bloco.
const OWNER_INDEPENDENCE_SCORE_MAP = { 1: 0, 2: 1, 3: 3, 4: 4, 5: 5 };

const QUESTIONS = [
  {
    id: 'q1_profissao',
    title: 'Profissão e negócio',
    content: 'Qual é sua profissão, especialidade e principal produto ou serviço atualmente?',
    fields: [
      {
        id: 'profession_category',
        label: 'Categoria profissional',
        type: 'select',
        options: PROFESSION_CATEGORY_OPTIONS,
        required: true,
      },
      { id: 'profession', label: 'Profissão', type: 'text', required: true },
      { id: 'specialty', label: 'Especialidade', type: 'text', required: false },
      { id: 'main_offer', label: 'Principal produto/serviço', type: 'text', required: true },
    ],
  },
  {
    id: 'q2_ofertas',
    title: 'Fontes de receita',
    content: 'Quais produtos ou serviços você oferece atualmente e qual deles mais contribui para sua receita?',
    fields: [
      {
        id: 'offers',
        label: 'Produtos/serviços',
        type: 'repeatable',
        required: false,
        addLabel: '+ Adicionar produto ou serviço',
        itemFields: [
          { id: 'offer_name', label: 'Nome', type: 'text' },
          { id: 'offer_price', label: 'Preço aproximado (R$)', type: 'number' },
          { id: 'revenue_importance', label: 'Participação na receita', type: 'select', options: REVENUE_IMPORTANCE_OPTIONS },
        ],
      },
    ],
  },
  {
    id: 'q3_ticket',
    title: 'Ticket e faturamento',
    content: 'Qual é aproximadamente seu ticket médio e em qual faixa está seu faturamento mensal atual?',
    fields: [
      { id: 'average_ticket', label: 'Ticket médio (R$)', type: 'number', required: false },
      { id: 'monthly_revenue_range', label: 'Faturamento mensal', type: 'select', options: MONTHLY_REVENUE_OPTIONS, required: false },
    ],
  },
  {
    id: 'q4_capacidade',
    title: 'Capacidade',
    content: 'Quantos clientes você atende atualmente por mês e quantos conseguiria atender mantendo a qualidade?',
    fields: [
      { id: 'current_clients_month', label: 'Clientes atuais/mês', type: 'number', required: true },
      { id: 'max_clients_capacity', label: 'Capacidade máxima estimada/mês', type: 'number', required: true },
    ],
  },
  {
    id: 'q5_gargalo',
    title: 'Gargalo percebido',
    content: 'Qual dessas situações melhor representa seu maior desafio hoje?',
    fields: [
      { id: 'perceived_main_problem', label: 'Maior desafio', type: 'select', options: PERCEIVED_PROBLEM_OPTIONS, required: true },
      { id: 'problem_description', label: 'Conte brevemente o que está acontecendo', type: 'textarea', required: false },
      {
        id: 'hardest_to_delegate_activity',
        label: 'Qual dessas atividades seria mais difícil deixar de executar pessoalmente?',
        type: 'text',
        required: false,
        conditional: { field: 'perceived_main_problem', equals: 'sobrecarga' },
      },
    ],
  },
  {
    id: 'q6_tempo',
    title: 'Uso do tempo',
    content: 'Quais atividades mais consomem seu tempo atualmente?',
    fields: [
      { id: 'time_consuming_tasks', label: 'Atividades', type: 'multiselect', options: TIME_TASKS_OPTIONS, required: true },
    ],
  },
  {
    id: 'q7_dependencia',
    title: 'Dependência do profissional',
    content: 'Se você se afastasse do negócio por 30 dias, quanto continuaria funcionando sem sua participação direta?',
    fields: [
      { id: 'owner_dependency_level', label: 'Continuaria funcionando', type: 'select', options: OWNER_DEPENDENCY_OPTIONS, required: true },
      { id: 'owner_critical_activity', label: 'Qual atividade mais depende exclusivamente de você?', type: 'text', required: false },
    ],
  },
  {
    id: 'q8_destino',
    title: 'Destino de 12 meses',
    content: 'Qual é o principal resultado que você deseja alcançar nos próximos 12 meses?',
    fields: [
      { id: 'twelve_month_goal', label: 'Principal resultado desejado', type: 'select', options: TWELVE_MONTH_GOAL_OPTIONS, required: true },
      { id: 'twelve_month_success_measure', label: 'Como você saberá que conseguiu?', type: 'text', required: false },
    ],
  },
];

function occupancyBand(rate) {
  if (rate >= 95) return 'critica';
  if (rate >= 85) return 'proxima_do_limite';
  if (rate >= 70) return 'atencao';
  if (rate >= 50) return 'moderada';
  return 'alta';
}

// Calcula os dados derivados e as red flags determinísticas do Bloco 1,
// exatamente conforme a especificação (seções 12, 13 direto e 14). As outras
// 4 dimensões do score do bloco (modelo de negócio, operação, capacidade e
// tecnologia) dependem de julgamento qualitativo da Blindada Pro (IA) e
// ainda não têm fórmula determinística definida — ficam para a fase de
// Motor de IA, não são inventadas aqui.
function analyze(answers) {
  const derived = {};
  const redFlags = [];

  const current = Number(answers.current_clients_month);
  const max = Number(answers.max_clients_capacity);
  if (Number.isFinite(current) && Number.isFinite(max) && max > 0) {
    const occupancyRate = Math.round((current / max) * 100 * 10) / 10;
    derived.occupancy_rate = occupancyRate;
    derived.occupancy_band = occupancyBand(occupancyRate);

    if (occupancyRate >= 85) {
      redFlags.push({
        rule: 'capacidade_proxima_do_limite',
        type: 'ALERTA',
        message:
          'Sua operação está próxima da capacidade atual. Aumentar aquisição sem revisar capacidade pode ampliar sobrecarga.',
      });
    }
  }

  if (Number.isFinite(current) && Number.isFinite(max) && max < current) {
    derived.capacity_inconsistency = true;
  }

  const offers = Array.isArray(answers.offers) ? answers.offers : [];
  const offersCount = offers.filter((o) => o && o.offer_name).length;
  derived.offers_count = offersCount;
  const noOfferIsDominant = !offers.some((o) => o && Number(o.revenue_importance) === 5);
  if (offersCount >= 5 && noOfferIsDominant) {
    redFlags.push({
      rule: 'muitos_produtos_pouca_direcao',
      type: 'HIPOTESE',
      message:
        'Existe possível dispersão de portfólio. Precisamos verificar se a quantidade de ofertas está diluindo foco comercial.',
    });
  }

  const dependencyLevel = Number(answers.owner_dependency_level);
  if (dependencyLevel in OWNER_INDEPENDENCE_SCORE_MAP) {
    derived.owner_independence_score = OWNER_INDEPENDENCE_SCORE_MAP[dependencyLevel];
    if (dependencyLevel <= 2) {
      redFlags.push({
        rule: 'alta_dependencia',
        type: 'ALERTA',
        message: 'Grande parte da operação depende diretamente de você.',
      });
    }
  }

  if (answers.perceived_main_problem === 'atrair_clientes') {
    redFlags.push({
      rule: 'trafego_como_solucao_percebida',
      type: 'HIPOTESE',
      message:
        'O cliente percebe falta de aquisição como principal gargalo, mas ainda não existem dados suficientes para confirmar — precisa cruzar com oferta, marketing, vendas e capacidade.',
      cross_with: ['offer', 'acquisition', 'sales', 'business_current'],
    });
  }

  derived.perceived_bottleneck = answers.perceived_main_problem || null;

  return { derived, redFlags };
}

module.exports = { id: 'business_current', questions: QUESTIONS, analyze };
