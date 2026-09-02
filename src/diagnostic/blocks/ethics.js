// BLOCO 13 — ÉTICA E COMUNICAÇÃO PROFISSIONAL
// Implementado a partir da especificação técnica da Andréa (documento
// "BLINDADOKP_NEGÓCIO_ATUAL", seção "BLOCO 13 — ÉTICA E COMUNICAÇÃO
// PROFISSIONAL"). Objetivo: identificar onde a cliente tem segurança para
// comunicar e onde precisa de critérios, revisão ou validação especializada
// antes de publicar ou escalar.

const RULES_KNOWLEDGE_OPTIONS = [
  { value: 'conheco_bem_atualizo', label: 'Conheço bem e acompanho atualizações' },
  { value: 'conheco_principais', label: 'Conheço as principais regras' },
  { value: 'parcial', label: 'Tenho conhecimento parcial' },
  { value: 'muitas_duvidas', label: 'Tenho muitas dúvidas' },
  { value: 'conheco_pouco', label: 'Conheço muito pouco' },
  { value: 'nunca_estudei', label: 'Nunca estudei especificamente' },
  { value: 'sem_regulamentacao_conhecida', label: 'Minha profissão não possui regulamentação específica que eu conheça' },
];

const UNCERTAINTY_AREAS_OPTIONS = [
  { value: 'falar_resultados', label: 'Falar sobre resultados' },
  { value: 'depoimentos_clientes_pacientes', label: 'Depoimentos de clientes/pacientes' },
  { value: 'antes_depois', label: 'Antes e depois' },
  { value: 'promessas_linguagem_resultado', label: 'Promessas ou linguagem de resultado' },
  { value: 'divulgacao_precos', label: 'Divulgação de preços' },
  { value: 'promocoes_descontos', label: 'Promoções/descontos' },
  { value: 'anuncios_pagos', label: 'Anúncios pagos' },
  { value: 'uso_imagens_clientes_pacientes', label: 'Uso de imagens de clientes/pacientes' },
  { value: 'divulgacao_titulos_especialidades', label: 'Divulgação de títulos ou especialidades' },
  { value: 'parcerias_publicidade_conjunta', label: 'Parcerias e publicidade conjunta' },
  { value: 'comparacao_outros_profissionais', label: 'Comparação com outros profissionais' },
  { value: 'conteudo_educativo', label: 'Conteúdo educativo' },
  { value: 'uso_ia_criar_conteudo', label: 'Uso de IA para criar conteúdo' },
  { value: 'atendimento_automatizado', label: 'Atendimento automatizado' },
  { value: 'sem_duvidas_relevantes', label: 'Não tenho dúvidas relevantes' },
  { value: 'outro', label: 'Outro' },
];

// Situações específicas do código de ética do nutricionista (CFN), levantadas
// por pesquisa (Resolução CFN nº 599/18, atualizada pela Resolução CFN nº
// 856/2026 — art. 57 sobre preço/promoção/sorteio, art. 58 sobre imagem
// corporal/antes-depois mesmo com autorização, e a vedação de 2026 a
// montagens/simulações por IA e gráficos de evolução usados como prova de
// resultado). Sempre recomendar à cliente confirmar a redação vigente no
// site do CFN, já que resoluções de conselho profissional mudam com
// frequência. Inseridas antes de "sem_duvidas_relevantes"/"outro", que ficam
// sempre por último em qualquer lista de opções deste bloco.
const NUTRITION_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'peso_medidas_corporais', label: 'Divulgar peso ou medidas corporais (próprias ou de pacientes)' },
  { value: 'fotos_antes_depois_ou_ia', label: 'Fotos de "antes e depois", inclusive montagens ou imagens geradas por IA' },
  { value: 'graficos_evolucao_peso', label: 'Gráficos ou números de evolução (peso, medidas) como prova de resultado' },
  { value: 'indicacao_marca_produto_suplemento', label: 'Indicação de marca, produto ou suplemento específico' },
];

function insertBeforeCatchAll(baseOptions, extraOptions) {
  const catchAllValues = new Set(['sem_duvidas_relevantes', 'outro']);
  const withoutCatchAll = baseOptions.filter((o) => !catchAllValues.has(o.value));
  const catchAll = baseOptions.filter((o) => catchAllValues.has(o.value));
  return [...withoutCatchAll, ...extraOptions, ...catchAll];
}

const NUTRITION_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, NUTRITION_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de médico(a) — Resolução CFM nº 2.336/2023 (em vigor
// desde 11/03/2024), que modernizou a publicidade médica: diferente da
// nutrição, aqui "antes e depois" É permitido, mas só dentro de critérios
// (texto educativo, indicações terapêuticas, fatores que podem influenciar
// negativamente o resultado, imagem sem edição/melhoria, relacionada à
// especialidade registrada). Também veda sensacionalismo, atribuir
// capacidade privilegiada a aparelhagem, e divulgar atuação fora da
// especialidade registrada no CFM.
const MEDICO_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'fotos_antes_depois_criterios_educativos', label: 'Fotos de "antes e depois" dentro dos critérios exigidos (texto educativo, indicações, sem edição de imagem)' },
  { value: 'capacidade_privilegiada_equipamento', label: 'Atribuir capacidade privilegiada a um aparelho ou equipamento específico' },
  { value: 'divulgacao_fora_especialidade_registrada', label: 'Divulgar atuação em área ou especialidade não registrada no CFM' },
  { value: 'participacao_publicidade_produto_medicamento', label: 'Participar de publicidade de medicamento, insumo ou produto induzindo garantia de resultado' },
];
const MEDICO_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, MEDICO_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de dentista — Código de Ética Odontológica (Resolução
// CFO nº 196/2019) e a atualização de concorrência (Resolução CFO nº
// 271/2025, por decisão do CADE): preço, antes-depois, superlativos,
// garantia de resultado, depoimentos e influenciadores não-dentistas
// continuam proibidos na divulgação pública; sorteio/vale-presente/cartão de
// desconto passaram a ser permitidos como prática interna, mas sem anunciar
// o percentual/condição publicamente. "Antes e depois" só pode ser
// publicado pelo próprio dentista que atendeu, nunca pela clínica/pessoa
// jurídica.
const DENTISTA_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'superlativos_linguagem_comparativa', label: 'Uso de superlativos ("o melhor", "mais avançado") na divulgação' },
  { value: 'antes_depois_quem_pode_publicar', label: 'Fotos de "antes e depois" — quem pode publicar (só o dentista que atendeu, nunca a clínica) e com quais critérios' },
  { value: 'participacao_sorteios_vale_presente_cartao_desconto', label: 'Participar de sorteio, vale-presente ou cartão de desconto sem anunciar o percentual' },
  { value: 'divulgacao_por_influenciadores_nao_dentistas', label: 'Divulgação feita por terceiros/influenciadores que não são dentistas' },
];
const DENTISTA_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, DENTISTA_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de fisioterapeuta — Código de Ética (Resolução
// COFFITO nº 424/2013), art. 15, V: veda fotografia "antes e depois" ou
// qualquer referência que permita identificar o paciente em anúncio ou
// divulgação profissional; veda divulgar honorários fora do local de
// atendimento; atestados/laudos/cartas de agradecimento de pacientes não
// podem ser usados pra autopromoção.
const FISIOTERAPEUTA_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'atestados_cartas_agradecimento_pacientes', label: 'Uso de atestados, laudos ou cartas de agradecimento de pacientes pra autopromoção' },
  { value: 'identificacao_indireta_paciente', label: 'Referência que permita identificar o paciente, mesmo sem mostrar o rosto' },
  { value: 'honorarios_fora_local_atendimento', label: 'Divulgar valor de honorários fora do local de atendimento' },
];
const FISIOTERAPEUTA_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, FISIOTERAPEUTA_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de psicólogo(a) — Código de Ética Profissional do
// Psicólogo (art. 20, veda usar o preço do serviço como forma de
// propaganda) e a Nota Técnica CFP nº 1/2022 sobre uso profissional das
// redes sociais (cuidado com a fronteira entre perfil pessoal e
// profissional, e com sigilo mesmo ao compartilhar casos sem nome).
const PSICOLOGO_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'preco_como_forma_propaganda', label: 'Usar o preço do serviço como forma de propaganda' },
  { value: 'confusao_perfil_pessoal_profissional', label: 'Confusão entre perfil pessoal e perfil profissional nas redes sociais' },
  { value: 'sigilo_indireto_casos_atendidos', label: 'Compartilhar situações/casos atendidos (mesmo sem nome) de um jeito que possa identificar a pessoa' },
];
const PSICOLOGO_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, PSICOLOGO_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de fonoaudiólogo(a) — Código de Ética do CFFa: exige
// consentimento por escrito antes de usar dado, imagem ou áudio que
// identifique o paciente; veda anunciar preço/desconto/sorteio (exceto
// cursos e palestras); veda diagnosticar ou prescrever tratamento à
// distância por qualquer meio de comunicação de massa; veda dar a entender
// que só aquele profissional/método resolve determinado caso.
const FONOAUDIOLOGO_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'consentimento_por_escrito_imagem_audio', label: 'Consentimento por escrito antes de usar imagem, áudio ou dado que identifique o paciente' },
  { value: 'diagnostico_prescricao_por_midia', label: 'Fazer diagnóstico ou prescrever tratamento à distância por rede social/mídia' },
  { value: 'reserva_clinica_procedimento', label: 'Dar a entender que só você (ou seu método) resolve determinado caso' },
];
const FONOAUDIOLOGO_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, FONOAUDIOLOGO_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de enfermeiro(a) — Resolução COFEN nº 554/2017:
// veda expor imagem de pacientes em redes sociais/WhatsApp, imagens
// sensacionalistas, "antes e depois" comparativo de procedimentos, e
// oferecer orientação clínica por mídia social substituindo o atendimento
// presencial. Anúncio deve conter nome completo, categoria e número de
// inscrição no COREN.
const ENFERMEIRO_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'identificacao_registro_coren_anuncio', label: 'Anúncio sem nome completo, categoria e número de inscrição no COREN' },
  { value: 'consultoria_substituindo_consulta_presencial', label: 'Orientação clínica pelo WhatsApp/rede social substituindo o atendimento presencial' },
];
const ENFERMEIRO_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, ENFERMEIRO_EXTRA_UNCERTAINTY_OPTIONS);

// Terapeuta ocupacional é regulado pelo mesmo conselho e pelo mesmo código de
// ética que fisioterapeuta (COFFITO — Resolução nº 424/2013 se aplica às
// duas profissões), então reaproveita a mesma lista.
const TERAPEUTA_OCUPACIONAL_UNCERTAINTY_AREAS_OPTIONS = FISIOTERAPEUTA_UNCERTAINTY_AREAS_OPTIONS;

// Situações específicas de farmacêutico(a) — Código de Ética Farmacêutica
// (Resolução CFF nº 596/2014) e Resolução CFF nº 658/2018 sobre propaganda
// de serviços farmacêuticos: conteúdo divulgado precisa ter evidência
// científica e foco em esclarecimento (não em venda); veda autopromoção e
// prática enganosa/abusiva; veda oferecer desconto, sorteio ou vantagem
// financeira em troca da obtenção de um serviço farmacêutico. Propaganda de
// medicamento segue regra à parte (RDC nº 96/2008 da Anvisa), que veda
// induzir uso indiscriminado.
const FARMACEUTICO_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'conteudo_sem_evidencia_cientifica', label: 'Conteúdo sobre medicamentos/produtos sem evidência científica, com foco maior em venda do que em esclarecimento' },
  { value: 'vantagem_financeira_troca_servico', label: 'Oferecer desconto, sorteio ou vantagem financeira em troca da obtenção de um serviço farmacêutico' },
  { value: 'propaganda_medicamento_uso_indiscriminado', label: 'Propaganda de medicamento que possa induzir ao uso indiscriminado' },
];
const FARMACEUTICO_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, FARMACEUTICO_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de biomédico(a) — Código de Ética (Resolução CFBM nº
// 330/2020): "antes e depois" é permitido, mas exige TCLE (termo de
// consentimento) assinado e enviado ao conselho, legenda informando que a
// divulgação foi autorizada pelo usuário, e um aviso obrigatório de que a
// imagem não garante resultado (cada pessoa tem características únicas).
const BIOMEDICO_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'fotos_antes_depois_tcle_disclaimer', label: 'Fotos de "antes e depois" — TCLE assinado, legenda de autorização e aviso obrigatório de que a imagem não garante resultado' },
  { value: 'tcle_enviado_ao_conselho', label: 'Enviar o TCLE ao conselho quando a imagem é divulgada' },
];
const BIOMEDICO_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, BIOMEDICO_EXTRA_UNCERTAINTY_OPTIONS);

// Situações específicas de profissional de Educação Física — Código de
// Ética dos Profissionais de Educação Física (CONFEF) e a Lei nº
// 9.696/1998: fotos/vídeos de alunos só com autorização expressa
// (preferencialmente escrita ou digital); veda expor aluno sem autorização
// ou criar expectativa enganosa sobre resultado potencial de treino.
const EDUCADOR_FISICO_EXTRA_UNCERTAINTY_OPTIONS = [
  { value: 'fotos_alunos_autorizacao_expressa', label: 'Fotos ou vídeos de alunos sem autorização expressa (escrita ou digital)' },
  { value: 'expectativa_enganosa_resultado_potencial', label: 'Criar expectativa enganosa sobre o resultado potencial de um treino ou programa' },
];
const EDUCADOR_FISICO_UNCERTAINTY_AREAS_OPTIONS = insertBeforeCatchAll(UNCERTAINTY_AREAS_OPTIONS, EDUCADOR_FISICO_EXTRA_UNCERTAINTY_OPTIONS);

// Registro por profissão (ver profession_category no Bloco 1 —
// business_current.js). Pra adicionar outra profissão no futuro: pesquisar
// o código de ética do conselho dela, montar as opções extras específicas
// com insertBeforeCatchAll (como acima) e adicionar uma entrada aqui com a
// mesma chave usada em PROFESSION_CATEGORY_OPTIONS. Profissão sem entrada
// aqui (ou 'outro') usa o UNCERTAINTY_AREAS_OPTIONS genérico, sem perda de
// funcionalidade.
const PROFESSION_ETHICS_CONTENT = {
  nutricionista: {
    uncertaintyAreasOptions: NUTRITION_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra nutricionistas, considerando o Código de Ética do CFN (Resolução nº 599/18, atualizada pela Resolução nº 856/2026) — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  medico: {
    uncertaintyAreasOptions: MEDICO_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra médicos(as), considerando a Resolução CFM nº 2.336/2023 (Manual da Publicidade Médica) — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  dentista: {
    uncertaintyAreasOptions: DENTISTA_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra dentistas, considerando o Código de Ética Odontológica (Resolução CFO nº 196/2019, com ajustes da Resolução CFO nº 271/2025) — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  fisioterapeuta: {
    uncertaintyAreasOptions: FISIOTERAPEUTA_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra fisioterapeutas, considerando o Código de Ética (Resolução COFFITO nº 424/2013) — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  psicologo: {
    uncertaintyAreasOptions: PSICOLOGO_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra psicólogos(as), considerando o Código de Ética Profissional do Psicólogo e a Nota Técnica CFP nº 1/2022 sobre redes sociais — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  fonoaudiologo: {
    uncertaintyAreasOptions: FONOAUDIOLOGO_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra fonoaudiólogos(as), considerando o Código de Ética do CFFa — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  enfermeiro: {
    uncertaintyAreasOptions: ENFERMEIRO_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra enfermeiros(as), considerando a Resolução COFEN nº 554/2017 — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  terapeuta_ocupacional: {
    uncertaintyAreasOptions: TERAPEUTA_OCUPACIONAL_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra terapeutas ocupacionais, considerando o Código de Ética (Resolução COFFITO nº 424/2013) — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  farmaceutico: {
    uncertaintyAreasOptions: FARMACEUTICO_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra farmacêuticos(as), considerando o Código de Ética Farmacêutica (Resolução CFF nº 596/2014) e a Resolução CFF nº 658/2018 sobre propaganda de serviços — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  biomedico: {
    uncertaintyAreasOptions: BIOMEDICO_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra biomédicos(as), considerando o Código de Ética (Resolução CFBM nº 330/2020) — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
  educador_fisico: {
    uncertaintyAreasOptions: EDUCADOR_FISICO_UNCERTAINTY_AREAS_OPTIONS,
    referenceHint:
      ' Algumas situações comuns pra profissionais de Educação Física, considerando o Código de Ética dos Profissionais de Educação Física (CONFEF) — sempre confirme a redação vigente no site do seu conselho, pois essas regras mudam com frequência.',
  },
};

const REVIEW_METHODS_OPTIONS = [
  { value: 'sigo_checklist_proprio', label: 'Sigo checklist ou protocolo próprio' },
  { value: 'consulto_normas_oficiais', label: 'Consulto normas/orientações oficiais' },
  { value: 'peco_revisao_outro_profissional', label: 'Peço revisão de outro profissional' },
  { value: 'consulto_assessoria_juridica', label: 'Consulto assessoria jurídica/regulatória quando necessário' },
  { value: 'pesquiso_internet', label: 'Pesquiso na internet' },
  { value: 'pergunto_para_ia', label: 'Pergunto para IA' },
  { value: 'reviso_apenas_conhecimento', label: 'Reviso apenas pelo meu conhecimento' },
  { value: 'nao_faco_revisao_especifica', label: 'Normalmente não faço uma revisão específica' },
  { value: 'evito_publicar_com_duvida', label: 'Evito publicar quando tenho dúvida' },
];

const PREVIOUS_INCIDENTS_OPTIONS = [
  { value: 'sim_mais_de_uma_vez', label: 'Sim, mais de uma vez' },
  { value: 'sim_uma_vez_poucas_vezes', label: 'Sim, uma vez ou poucas vezes' },
  { value: 'deixei_de_publicar_por_inseguranca', label: 'Já deixei de publicar por insegurança' },
  { value: 'nao_me_lembro', label: 'Não me lembro de ter acontecido' },
  { value: 'nunca_aconteceu', label: 'Nunca aconteceu' },
  { value: 'nao_sei_avaliar', label: 'Não sei avaliar' },
];

const FEAR_MARKETING_IMPACT_OPTIONS = [
  { value: 'nao_limita', label: 'Não limita' },
  { value: 'limita_muito_pouco', label: 'Limita muito pouco' },
  { value: 'as_vezes_deixo_de_comunicar', label: 'Às vezes deixo de comunicar algo' },
  { value: 'limita_bastante', label: 'Limita bastante' },
  { value: 'evito_varias_acoes_por_medo', label: 'Evito várias ações de marketing por medo' },
  { value: 'quase_nao_divulgo', label: 'Tenho tanta dúvida que quase não divulgo meu trabalho' },
];

const DESIRED_SUPPORT_OPTIONS = [
  { value: 'checklist_antes_publicar', label: 'Checklist antes de publicar' },
  { value: 'alertas_automaticos_situacoes_sensiveis', label: 'Alertas automáticos em situações sensíveis' },
  { value: 'revisao_textos_anuncios', label: 'Revisão de textos e anúncios' },
  { value: 'base_organizada_regras_profissao', label: 'Base organizada com regras da profissão' },
  { value: 'exemplos_o_que_merece_atencao', label: 'Exemplos do que merece atenção' },
  { value: 'orientacao_quando_buscar_validacao', label: 'Orientação sobre quando buscar validação especializada' },
  { value: 'nao_preciso_suporte', label: 'Não preciso de suporte específico' },
  { value: 'todos_anteriores', label: 'Todos os anteriores' },
  { value: 'outro', label: 'Outro' },
];

const SHOW_INCIDENT_DESCRIPTION = ['sim_mais_de_uma_vez', 'sim_uma_vez_poucas_vezes', 'deixei_de_publicar_por_inseguranca'];

// Métodos que representam validação oficial/qualificada, usados nas
// REGRAS da Pergunta 3 e da REGRA 05 (seção 5 e seção 17).
const OFFICIAL_VALIDATION_METHODS = ['consulto_normas_oficiais', 'peco_revisao_outro_profissional', 'consulto_assessoria_juridica'];

// Seção 7 — "ethical_fear_marketing_impact >= high" da REGRA 06.
const HIGH_FEAR_LEVELS = ['limita_bastante', 'evito_varias_acoes_por_medo', 'quase_nao_divulgo'];

// Monta a lista de perguntas do bloco. professionKey vem de
// context.business_current.profession_category (ver Bloco 1). Só a
// Pergunta 2 muda de conteúdo por enquanto — é onde entram as situações
// específicas do código de ética da profissão (ver PROFESSION_ETHICS_CONTENT
// acima).
function buildQuestionsList(professionKey) {
  const professionContent = PROFESSION_ETHICS_CONTENT[professionKey];
  const uncertaintyOptions = professionContent ? professionContent.uncertaintyAreasOptions : UNCERTAINTY_AREAS_OPTIONS;
  const referenceHint = professionContent ? professionContent.referenceHint : '';

  return [
    {
      id: 'q1_conhecimento',
      title: 'Conhecimento das regras',
      content: 'Como você avalia seu conhecimento sobre as regras e orientações de publicidade e comunicação da sua profissão?',
      fields: [
        { id: 'professional_rules_knowledge_level', label: 'Conhecimento das regras', type: 'select', options: RULES_KNOWLEDGE_OPTIONS, required: true },
      ],
    },
    {
      id: 'q2_inseguranca',
      title: 'Situações de insegurança',
      content: 'Em quais situações de divulgação profissional você sente mais dúvida ou insegurança?' + referenceHint,
      fields: [
        { id: 'ethical_uncertainty_areas', label: 'Situações', type: 'multiselect', options: uncertaintyOptions, required: true },
        {
          id: 'ethical_uncertainty_areas_other',
          label: 'Qual?',
          type: 'text',
          required: false,
          conditional: { field: 'ethical_uncertainty_areas', includes: 'outro' },
        },
      ],
    },
    {
    id: 'q3_revisao',
    title: 'Processo de revisão atual',
    content: 'Antes de publicar conteúdos, anúncios ou materiais profissionais mais sensíveis, como você verifica se a comunicação está adequada?',
    fields: [
      { id: 'current_ethics_review_methods', label: 'Como você revisa', type: 'multiselect', options: REVIEW_METHODS_OPTIONS, required: true },
    ],
  },
  {
    id: 'q4_historico',
    title: 'Histórico de correções ou evitação',
    content: 'Você já precisou apagar, corrigir ou deixar de publicar algo por dúvida relacionada às regras da sua profissão?',
    fields: [
      { id: 'ethics_previous_incidents', label: 'Já aconteceu?', type: 'select', options: PREVIOUS_INCIDENTS_OPTIONS, required: true },
      {
        id: 'ethics_incident_description',
        label: 'Que tipo de situação era?',
        type: 'text',
        required: false,
        conditional: { field: 'ethics_previous_incidents', oneOf: SHOW_INCIDENT_DESCRIPTION },
      },
    ],
  },
  {
    id: 'q5_impacto_marketing',
    title: 'Impacto da insegurança no marketing',
    content: 'Quanto a preocupação com regras profissionais limita sua comunicação ou seu marketing hoje?',
    fields: [
      { id: 'ethical_fear_marketing_impact', label: 'Nível de impacto', type: 'select', options: FEAR_MARKETING_IMPACT_OPTIONS, required: true },
    ],
  },
  {
    id: 'q6_suporte',
    title: 'Tipo de suporte desejado',
    content: 'Que tipo de apoio ajudaria você a comunicar com mais segurança e clareza?',
    fields: [
      { id: 'desired_ethics_support', label: 'Tipo de apoio', type: 'multiselect', options: DESIRED_SUPPORT_OPTIONS, required: true },
      {
        id: 'desired_ethics_support_other',
        label: 'Qual?',
        type: 'text',
        required: false,
        conditional: { field: 'desired_ethics_support', includes: 'outro' },
      },
    ],
  },
  ];
}

// Lista genérica (sem profissão), usada como valor padrão de exportação e
// por qualquer chamador que ainda espere um array estático em vez de
// chamar buildQuestions(context).
const QUESTIONS = buildQuestionsList(null);

// context vem de getDiagnosticContext (routes/diagnostic.js): respostas
// brutas dos blocos já respondidos. Lê a profissão do Bloco 1.
function buildQuestions(context) {
  const professionKey = context && context.business_current && context.business_current.profession_category;
  return buildQuestionsList(professionKey);
}

// Dados derivados e red flags determinísticas do Bloco 13 (seções 5, 9, 17 e
// 18). As 6 dimensões de score (seção 12), a REGRA 01 (linguagem absoluta de
// resultado), a REGRA 02 (depoimentos), a REGRA 03 (antes e depois) e a
// REGRA 04 (títulos/especialidades) exigem analisar o conteúdo real
// publicado pela cliente (textos, anúncios, materiais) — isso não é
// coletado neste bloco, que só pergunta sobre percepção/insegurança, não
// sobre o que de fato foi publicado. A REGRA 07 (cruzamento com scores
// qualitativos de comunicação/aquisição), a REGRA 08 (cruzamento com
// tráfego pago) e a REGRA 09 (cruzamento com automação de comunicação)
// dependem de dados que os Blocos 7, 8 e 12 não calculam/coletam
// (professional_rules_knowledge_score é deste próprio bloco e também
// qualitativo; automated_external_communication não existe no Bloco 12).
// Nada disso é inventado — fica para o Motor de IA.
function analyze(answers, context) {
  const uncertaintyAreas = Array.isArray(answers.ethical_uncertainty_areas) ? answers.ethical_uncertainty_areas : [];
  const reviewMethods = Array.isArray(answers.current_ethics_review_methods) ? answers.current_ethics_review_methods : [];
  const desiredSupport = Array.isArray(answers.desired_ethics_support) ? answers.desired_ethics_support : [];
  const professionCategory = (context && context.business_current && context.business_current.profession_category) || null;

  const derived = {
    profession_category: professionCategory,
    professional_rules_knowledge_level: answers.professional_rules_knowledge_level || null,
    ethical_uncertainty_areas: uncertaintyAreas,
    ethical_uncertainty_areas_count: uncertaintyAreas.length,
    current_ethics_review_methods: reviewMethods,
    ethics_previous_incidents: answers.ethics_previous_incidents || null,
    ethical_fear_marketing_impact: answers.ethical_fear_marketing_impact || null,
    desired_ethics_support: desiredSupport,
    ethics_layer_need: desiredSupport.length > 0 && !(desiredSupport.length === 1 && desiredSupport[0] === 'nao_preciso_suporte'),
  };

  const redFlags = [];

  const usesAi = reviewMethods.includes('pergunto_para_ia');
  const hasOfficialValidation = reviewMethods.some((m) => OFFICIAL_VALIDATION_METHODS.includes(m));

  // Seção 5, Pergunta 3 — regra dada literalmente na especificação.
  if (usesAi && !hasOfficialValidation) {
    redFlags.push({
      rule: 'ia_sem_validacao_oficial',
      type: 'ALERTA',
      message: 'A IA pode apoiar a revisão inicial, mas não deve ser tratada como fonte definitiva de interpretação regulatória.',
    });
  }

  // Seção 17, REGRA 05 — IA como ÚNICO método de revisão utilizado.
  if (reviewMethods.length === 1 && reviewMethods[0] === 'pergunto_para_ia') {
    redFlags.push({
      rule: 'ia_como_unica_revisora',
      type: 'ALERTA',
      message:
        'IA pode funcionar como camada inicial de análise, mas temas regulatórios sensíveis precisam de fontes oficiais e, quando necessário, validação profissional especializada.',
    });
  }

  // Seção 18, REGRA 06 — medo excessivo bloqueando marketing. Este bloco não
  // coleta nenhum sinal de violação confirmada (known_violation_signal),
  // então essa parte da condição é sempre false, e a regra se reduz ao
  // nível de medo relatado.
  if (HIGH_FEAR_LEVELS.includes(answers.ethical_fear_marketing_impact)) {
    redFlags.push({
      rule: 'medo_excessivo_bloqueando_marketing',
      type: 'OPORTUNIDADE',
      message:
        'Parte da limitação da comunicação pode estar relacionada à falta de clareza sobre o que merece atenção e o que pode ser comunicado normalmente. Uma estrutura de critérios pode reduzir esse bloqueio.',
    });
  }

  return { derived, redFlags };
}

module.exports = { id: 'ethics', questions: QUESTIONS, buildQuestions, analyze, PROFESSION_ETHICS_CONTENT };
