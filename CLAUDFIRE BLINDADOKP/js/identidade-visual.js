(function () {
  var form = document.getElementById("wizardForm");
  if (!form) return;

  var allFieldsets = Array.prototype.slice.call(form.querySelectorAll(".wizard-fieldset"));
  var wizardProgress = document.getElementById("wizardProgress");
  var wizardStepLabel = document.getElementById("wizardStepLabel");
  var btnVoltar = document.getElementById("btnVoltar");
  var btnAvancar = document.getElementById("btnAvancar");
  var wizardResult = document.getElementById("wizardResult");
  var routePurchase = document.getElementById("routePurchase");
  var btnComprarPro = document.getElementById("btnComprarPro");
  var proPriceLabel = document.getElementById("proPriceLabel");

  // TODO(Andréa): troque pelo link de checkout real assim que criar o produto na Greenn.
  // Passo a passo: Greenn > Produtos > Novo produto > "Rota Blindada PRO" > R$ 97 > produto digital de acesso único.
  // No campo de URL de agradecimento/redirecionamento após a compra, cole:
  // https://www.blindadokp.com.br/identidade-visual.html?comprado=1
  // Depois é só me mandar o link de checkout que aparece lá que eu troco a linha abaixo.
  var GREENN_CHECKOUT_URL_PRO = "https://pay.greenn.com.br/SUBSTITUA-PELO-LINK-DA-GREENN-AQUI";

  var entitlements = [];

  function temAcessoPro() {
    return entitlements.indexOf("rota_blindada_pro") !== -1;
  }

  async function carregarAcesso() {
    entitlements = await BlindadoAuth.getEntitlements();
    if (temAcessoPro() && proPriceLabel) {
      proPriceLabel.textContent = "45–75 minutos · Liberado ✓";
    }
  }

  if (btnComprarPro) btnComprarPro.href = GREENN_CHECKOUT_URL_PRO;

  var comprasRecentesEl = document.getElementById("comprasRecentesAviso");
  if (comprasRecentesEl && new URLSearchParams(window.location.search).get("comprado") === "1") {
    comprasRecentesEl.hidden = false;
  }

  var acessoPronto = carregarAcesso();

  var steps = [allFieldsets[0]]; // só a etapa de escolha de rota, até o usuário decidir
  var current = 0;

  function getSelectedRoute() {
    var checked = form.querySelector('input[name="rota"]:checked');
    return checked ? checked.value : null;
  }

  function rebuildSteps() {
    var rota = getSelectedRoute() || "expressa";
    steps = allFieldsets.filter(function (fs) {
      return fs.dataset.route === "all" || fs.dataset.route === rota;
    });
  }

  function renderDots() {
    wizardProgress.innerHTML = "";
    for (var i = 1; i < steps.length; i++) {
      var dot = document.createElement("div");
      dot.className = "wizard-progress-step";
      if (i === current) dot.classList.add("is-active");
      if (i < current) dot.classList.add("is-done");
      wizardProgress.appendChild(dot);
    }
  }

  function showStep(index) {
    allFieldsets.forEach(function (fs) { fs.classList.remove("is-active"); });
    steps[index].classList.add("is-active");

    var isRouteStep = index === 0 && steps[index].dataset.stepName === "Escolha sua rota";
    wizardProgress.style.display = isRouteStep ? "none" : "flex";
    wizardStepLabel.style.display = isRouteStep ? "none" : "block";
    wizardStepLabel.innerHTML = "Etapa <strong>" + index + " de " + (steps.length - 1) + "</strong> — " + steps[index].dataset.stepName;

    renderDots();
    btnVoltar.style.visibility = index === 0 ? "hidden" : "visible";
    btnAvancar.innerHTML = (!isRouteStep && index === steps.length - 1) ? "GERAR MEU PROMPT" : "PRÓXIMA <span>→</span>";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function currentStepIsValid() {
    var fields = steps[current].querySelectorAll("[required]");
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].checkValidity()) {
        fields[i].reportValidity();
        return false;
      }
    }
    return true;
  }

  // Limita grupos de escolha múltipla (ex.: arquétipos, no máximo 2)
  Array.prototype.slice.call(form.querySelectorAll(".choice-grid[data-max]")).forEach(function (grid) {
    var max = parseInt(grid.dataset.max, 10);
    var boxes = Array.prototype.slice.call(grid.querySelectorAll('input[type="checkbox"]'));
    function sync() {
      var checkedCount = boxes.filter(function (b) { return b.checked; }).length;
      boxes.forEach(function (b) { b.disabled = !b.checked && checkedCount >= max; });
    }
    boxes.forEach(function (b) { b.addEventListener("change", sync); });
  });

  btnVoltar.addEventListener("click", function () {
    if (current === 0) return;
    current -= 1;
    showStep(current);
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (current === 0 && steps[0].dataset.stepName === "Escolha sua rota") {
      if (!currentStepIsValid()) return;

      if (getSelectedRoute() === "completa") {
        btnAvancar.disabled = true;
        await acessoPronto; // garante que já checamos o acesso real antes de decidir
        btnAvancar.disabled = false;

        if (!temAcessoPro()) {
          routePurchase.hidden = false;
          routePurchase.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return;
        }
      }

      routePurchase.hidden = true;
      rebuildSteps();
      current = 1;
      showStep(current);
      return;
    }

    if (!currentStepIsValid()) return;

    if (current < steps.length - 1) {
      current += 1;
      showStep(current);
      return;
    }

    var data = Object.fromEntries(new FormData(form).entries());
    data.rota = getSelectedRoute();
    data.comp_arquetipos = new FormData(form).getAll("comp_arquetipos").join(", ");
    data.app_materiais = new FormData(form).getAll("app_materiais").join(", ");

    var prompt = buildPrompt(data);
    document.getElementById("promptGerado").textContent = prompt;

    var resultNote = document.getElementById("resultNote");
    resultNote.textContent = "O botão de avisar abre seu e-mail com um resumo já preenchido — só falta clicar em enviar."
      + (data.rota === "expressa"
        ? " Quer aprofundar ainda mais depois que a IA responder? Peça na mesma conversa: \"aprofunde com posicionamento de marca, arquétipos e regras de aplicação para todos os canais\"."
        : "");

    var assunto = "Documento Mestre de Identidade Visual (" + (data.rota === "completa" ? "Rota Blindada PRO" : "Rota Blindada") + ") — " + data.contato_nome;
    var corpo = buildResumoEmail(data);

    var btnAvisar = document.getElementById("btnAvisar");
    btnAvisar.href = "mailto:contato@blindadokp.com.br?subject=" + encodeURIComponent(assunto) + "&body=" + encodeURIComponent(corpo);

    form.style.display = "none";
    wizardResult.classList.add("is-active");
    wizardResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("btnCopiar").addEventListener("click", function (event) {
    var texto = document.getElementById("promptGerado").textContent;
    navigator.clipboard.writeText(texto).then(function () {
      var btn = event.currentTarget;
      var original = btn.textContent;
      btn.textContent = "Copiado";
      setTimeout(function () { btn.textContent = original; }, 1600);
    });
  });

  function eixoTexto(valor, esquerda, direita) {
    var v = parseInt(valor, 10);
    if (v <= 30) return "mais para " + esquerda;
    if (v >= 70) return "mais para " + direita;
    return "equilíbrio entre " + esquerda + " e " + direita;
  }

  function buildResumoEmail(data) {
    var linhas = [
      "Rota: " + (data.rota === "completa" ? "Rota Blindada PRO" : "Rota Blindada"),
      "Nome: " + data.contato_nome,
      "E-mail: " + data.contato_email,
      "WhatsApp: " + data.contato_telefone,
      "",
      "Marca: " + data.marca_nome,
      "Profissão: " + data.profissao,
      "Oferta: " + data.oferta,
      "Público: " + data.publico,
      "Transformação: " + data.transformacao,
      "Cinco palavras: " + data.cinco_palavras,
      "Não pode parecer: " + data.nao_parecer,
      "Direção visual: " + data.estilo_visual,
      "Cores desejadas: " + (data.cores_desejadas || "-"),
      "Cores proibidas: " + (data.cores_proibidas || "-"),
      "Logo: " + data.logo,
      "Imagens: " + data.imagens,
      "Aplicações: " + data.aplicacoes,
      "Referências: " + (data.referencias || "-"),
      "Restrições: " + data.restricoes,
      "Liberdade da IA: " + data.liberdade
    ];
    if (data.rota === "completa") {
      linhas = linhas.concat([
        "",
        "--- ROTA COMPLETA ---",
        "Nome completo: " + data.comp_nome_completo,
        "Nome curto: " + (data.comp_nome_curto || "-"),
        "Local/atendimento: " + data.comp_local,
        "História: " + data.comp_historia,
        "Missão: " + data.comp_missao,
        "Diferencial: " + data.comp_diferencial,
        "Portfólio: " + data.comp_portfolio,
        "Faixa de posicionamento: " + data.comp_faixa,
        "Cliente ideal: " + data.comp_cliente_ideal,
        "Dor do público: " + data.comp_dor,
        "Sentimento desejado: " + data.comp_sentimento,
        "Gatilhos de confiança: " + data.comp_gatilhos,
        "Não-público: " + (data.comp_nao_publico || "-"),
        "Valores: " + data.comp_valores,
        "Personalidade: " + data.comp_personalidade,
        "Arquétipos: " + (data.comp_arquetipos || "-"),
        "Palavras proibidas: " + (data.comp_palavras_proibidas || "-"),
        "Slogan: " + (data.comp_slogan || "-"),
        "Prioridade #1: " + data.final_prioridade
      ]);
    }
    return linhas.join("\n");
  }

  function buildPrompt(data) {
    var texto = "ATUE COMO DIRETOR(A) DE MARCA E DESIGNER DE IDENTIDADE VISUAL SÊNIOR.\n\n" +
      "Abaixo estão as respostas de um(a) profissional da saúde para a criação da identidade visual da marca dele(a). Use apenas essas respostas — não peça mais informações antes de entregar o resultado.\n\n" +
      "SÍNTESE INICIAL\n" +
      "NOME QUE DEVE APARECER NA MARCA: " + data.marca_nome + "\n" +
      "PROFISSÃO / ESPECIALIDADE: " + data.profissao + "\n" +
      "O QUE OFERECE OU VENDE: " + data.oferta + "\n" +
      "PÚBLICO PRINCIPAL: " + data.publico + "\n" +
      "TRANSFORMAÇÃO QUE ENTREGA: " + data.transformacao + "\n" +
      "CINCO PALAVRAS QUE A MARCA DEVE TRANSMITIR: " + data.cinco_palavras + "\n" +
      "O QUE A MARCA NÃO PODE PARECER: " + data.nao_parecer + "\n" +
      "DIREÇÃO VISUAL ESCOLHIDA: " + data.estilo_visual + "\n" +
      "CORES DESEJADAS: " + (data.cores_desejadas || "decida por mim") + "\n" +
      "CORES PROIBIDAS: " + (data.cores_proibidas || "nenhuma") + "\n" +
      "PREFERÊNCIA DE LOGO: " + data.logo + "\n" +
      "FOTOS E IMAGENS: " + data.imagens + "\n" +
      "ONDE SERÁ USADA PRIMEIRO: " + data.aplicacoes + "\n" +
      "REFERÊNCIAS VISUAIS: " + (data.referencias || "nenhuma") + "\n" +
      "RESTRIÇÕES PROFISSIONAIS, ÉTICAS OU LEGAIS: " + data.restricoes + "\n" +
      "NÍVEL DE LIBERDADE PARA A IA: " + data.liberdade + "\n";

    if (data.rota === "completa") {
      texto += "\nNEGÓCIO E POSICIONAMENTO\n" +
        "Nome completo: " + data.comp_nome_completo + "\n" +
        "Nome curto/assinatura: " + (data.comp_nome_curto || "não informado") + "\n" +
        "Local e forma de atendimento: " + data.comp_local + "\n" +
        "História resumida: " + data.comp_historia + "\n" +
        "Missão: " + data.comp_missao + "\n" +
        "Diferencial principal: " + data.comp_diferencial + "\n" +
        "Portfólio, em ordem de prioridade: " + data.comp_portfolio + "\n" +
        "Faixa de posicionamento: " + data.comp_faixa + "\n" +
        "\nPÚBLICO E PERCEPÇÃO\n" +
        "Cliente ideal: " + data.comp_cliente_ideal + "\n" +
        "Problema que faz procurar: " + data.comp_dor + "\n" +
        "O que deseja sentir: " + data.comp_sentimento + "\n" +
        "O que gera confiança: " + data.comp_gatilhos + "\n" +
        "Quem não é o público: " + (data.comp_nao_publico || "não informado") + "\n" +
        "\nESSÊNCIA E PERSONALIDADE\n" +
        "Cinco valores inegociáveis: " + data.comp_valores + "\n" +
        "Personalidade em uma frase: " + data.comp_personalidade + "\n" +
        "Eixo formal–próxima: " + eixoTexto(data.eixo_formal_proxima, "formal", "próxima") + "\n" +
        "Eixo clássica–moderna: " + eixoTexto(data.eixo_classica_moderna, "clássica", "moderna") + "\n" +
        "Eixo discreta–expressiva: " + eixoTexto(data.eixo_discreta_expressiva, "discreta", "expressiva") + "\n" +
        "Eixo suave–forte: " + eixoTexto(data.eixo_suave_forte, "suave", "forte") + "\n" +
        "Eixo acessível–exclusiva: " + eixoTexto(data.eixo_acessivel_exclusiva, "acessível", "exclusiva") + "\n" +
        "Eixo técnica–emocional: " + eixoTexto(data.eixo_tecnica_emocional, "técnica", "emocional") + "\n" +
        "Arquétipos (no máximo dois): " + (data.comp_arquetipos || "decida por mim") + "\n" +
        "Palavras proibidas: " + (data.comp_palavras_proibidas || "nenhuma") + "\n" +
        "Slogan ou ideia central: " + (data.comp_slogan || "sugerir opções") + "\n" +
        "\nDIREÇÃO ESTÉTICA E CORES (aprofundado)\n" +
        "Nível de simplicidade (1 muito limpa – 5 rica em detalhes): " + data.vis_simplicidade + "\n" +
        "Sensação da primeira impressão: " + data.vis_primeira_impressao + "\n" +
        "Estilos a evitar: " + (data.vis_evitar_estilos || "nenhum específico") + "\n" +
        "Cor principal e por quê: " + (data.cor_principal || "decida por mim") + "\n" +
        "Cores secundárias: " + (data.cores_secundarias || "decida por mim") + "\n" +
        "Cores de destaque: " + (data.cores_destaque || "decida por mim") + "\n" +
        "Preferência de fundos: " + (data.cores_fundos || "decida por mim") + "\n" +
        "Cor obrigatória: " + (data.cores_obrigatorias || "nenhuma") + "\n" +
        "\nTIPOGRAFIA (aprofundado)\n" +
        "Sensação desejada: " + data.tipo_sensacao + "\n" +
        "Família visual: " + data.tipo_familia + "\n" +
        "Peso e presença: " + (data.tipo_peso || "decida por mim") + "\n" +
        "Fonte atual a manter: " + (data.tipo_atual || "nenhuma") + "\n" +
        "Restrição de licença: " + (data.tipo_gratuita || "prefira fontes gratuitas") + "\n" +
        "\nLOGO E ASSINATURA (aprofundado)\n" +
        "Formato preferido: " + data.logo_formato + "\n" +
        "Nome com maior destaque: " + (data.logo_destaque || "decida por mim") + "\n" +
        "Iniciais para monograma: " + (data.logo_iniciais || "nenhuma definida") + "\n" +
        "Símbolos que fazem sentido: " + (data.logo_simbolos || "decida por mim") + "\n" +
        "Símbolos proibidos: " + (data.logo_proibidos || "nenhum") + "\n" +
        "Uso prioritário do logo: " + (data.logo_uso || "não informado") + "\n" +
        "Logo atual: " + (data.logo_atual || "não existe logo atual") + "\n" +
        "\nFOTOGRAFIA E DIREÇÃO DE ARTE\n" +
        "Quem aparece nas imagens: " + data.img_sujeitos + "\n" +
        "Ambientes e cenários: " + (data.img_ambientes || "decida por mim") + "\n" +
        "Iluminação: " + (data.img_luz || "decida por mim") + "\n" +
        "Enquadramento e composição: " + (data.img_composicao || "decida por mim") + "\n" +
        "Tratamento das fotos: " + (data.img_tratamento || "decida por mim") + "\n" +
        "O que não pode aparecer: " + (data.img_restricoes || "nenhuma restrição adicional") + "\n" +
        "Uso de imagens geradas por IA: " + data.img_ia + "\n" +
        "\nELEMENTOS GRÁFICOS\n" +
        "Formas: " + (data.graf_formas || "decida por mim") + "\n" +
        "Ícones: " + (data.graf_icones || "decida por mim") + "\n" +
        "Texturas e padrões: " + (data.graf_texturas || "nenhuma") + "\n" +
        "Elementos de assinatura visual: " + (data.graf_assinatura || "decida por mim") + "\n" +
        "Cantos e botões: " + (data.graf_ui || "decida por mim") + "\n" +
        "\nCANAIS E MATERIAIS\n" +
        "Três canais mais importantes: " + data.app_canais + "\n" +
        "Materiais que precisam ser criados: " + (data.app_materiais || "nenhum marcado") + "\n" +
        "Formato de conteúdo mais frequente: " + (data.app_conteudo || "não informado") + "\n" +
        "Precisa funcionar em fundo claro e escuro: " + (data.app_fundos || "não informado") + "\n" +
        "Precisa funcionar em tamanho muito pequeno: " + (data.app_pequeno || "não informado") + "\n" +
        "Projeto a criar (site, app, landing page etc.): " + (data.app_lovable || "não informado") + "\n" +
        "\nREFERÊNCIAS E CONCORRÊNCIA\n" +
        "Marcas que admira: " + (data.ref_admira || "nenhuma") + "\n" +
        "Concorrentes (só para diferenciar, nunca copiar): " + (data.ref_concorrentes || "nenhum") + "\n" +
        "O que é genérico no mercado: " + (data.ref_generico || "não informado") + "\n" +
        "Links de referência: " + (data.ref_links || "nenhum") + "\n" +
        "\nÉTICA, ACESSIBILIDADE E DIREITOS\n" +
        "Conselho profissional/regras do setor: " + (data.reg_conselho || "não informado") + "\n" +
        "Promessas ou conteúdos proibidos: " + (data.reg_proibicoes || "nenhum além do padrão ético") + "\n" +
        "Avisos legais/credenciais obrigatórias: " + (data.reg_avisos || "não informado") + "\n" +
        "Necessidades de acessibilidade: " + data.reg_acessibilidade + "\n" +
        "Diversidade e representação: " + (data.reg_diversidade || "decida por mim, com diversidade real") + "\n" +
        "Restrições de direitos autorais: " + (data.reg_direitos || "nenhuma") + "\n" +
        "\nARQUIVOS EXISTENTES\n" +
        "Logos existentes: " + (data.arq_logos || "nenhum") + "\n" +
        "Fotos disponíveis: " + (data.arq_fotos || "nenhuma") + "\n" +
        "Manual/paleta/fontes atuais: " + (data.arq_manual || "nenhum") + "\n" +
        "Materiais de referência: " + (data.arq_materiais || "nenhum") + "\n" +
        "\nDECISÃO FINAL\n" +
        "O que deve permanecer: " + (data.final_manter || "nada obrigatório") + "\n" +
        "O que pode mudar: " + (data.final_mudar || "tudo, exceto o já listado como obrigatório") + "\n" +
        "O que nunca deve ser usado: " + (data.final_nunca || "nada além do já listado") + "\n" +
        "Prioridade número 1: " + data.final_prioridade + "\n" +
        "Observações finais: " + (data.final_observacoes || "nenhuma") + "\n";
    }

    texto += "\nREGRAS DE DECISÃO\n" +
      "1. Não faça perguntas desnecessárias. Se faltar algo, escolha a solução mais coerente e identifique-a como “decisão estratégica assumida”.\n" +
      "2. Resolva contradições priorizando, nesta ordem: restrições legais/éticas; público; posicionamento; diferencial; aplicações prioritárias; preferência estética.\n" +
      "3. Não copie logos, paletas ou composições de concorrentes e referências. Use as referências apenas para compreender preferências.\n" +
      "4. Evite clichês visuais do setor quando houver alternativa mais distintiva.\n" +
      "5. Garanta legibilidade, contraste, acessibilidade e funcionamento em tamanhos pequenos.\n" +
      "6. Prefira fontes gratuitas e licenciáveis para uso comercial.\n" +
      "7. Tome uma decisão principal. Não devolva apenas uma lista de possibilidades.\n\n" +
      "ENTREGUE EXATAMENTE NESTA ORDEM\n" +
      "1. Diagnóstico e síntese estratégica.\n" +
      "2. Conceito visual central escolhido, com nome e justificativa.\n" +
      "3. Paleta completa: nome funcional, HEX, RGB, CMYK aproximado e função de cada cor.\n" +
      "4. Combinações de fundo/texto/botão com indicação de contraste seguro.\n" +
      "5. Tipografia principal e secundária, links ou origem, pesos e hierarquia completa.\n" +
      "6. Sistema de logo: ideia central, construção verbal, versões necessárias, área de proteção, tamanho mínimo e usos proibidos.\n" +
      "7. Três descrições de logo; escolha uma como recomendada e explique por quê.\n" +
      "8. Direção fotográfica e de imagens, incluindo cinco prompts detalhados.\n" +
      "9. Ícones, formas, texturas, padrões, molduras, botões e elementos gráficos.\n" +
      "10. Aplicação nos canais e materiais indicados." +
      (data.rota === "completa" ? "\n11. Guia de posicionamento e personalidade da marca, com arquétipos e eixos aplicados.\n12. Guia “FAÇA / NÃO FAÇA”.\n13. Resumo de uma página do manual da marca.\n14. Bloco técnico em JSON e CSS com tokens de cores, fontes, espaçamento, raios, bordas e sombras.\n15. Checklist de arquivos finais que precisam ser produzidos." : "\n11. Guia “FAÇA / NÃO FAÇA”.\n12. Resumo de uma página do manual da marca.\n13. Bloco técnico em JSON e CSS com tokens de cores, fontes, espaçamento, raios, bordas e sombras.\n14. Checklist de arquivos finais que precisam ser produzidos.") +
      "\n\nAntes de encerrar, faça uma auditoria: confirme que nenhuma escolha viola as restrições profissionais, éticas, de acessibilidade ou de direitos autorais informadas acima.";

    return texto;
  }

  // Esconde o card de compra se a pessoa voltar pra Rota Blindada (grátis) depois de vê-lo.
  Array.prototype.slice.call(form.querySelectorAll('input[name="rota"]')).forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (radio.value === "expressa") routePurchase.hidden = true;
    });
  });

  showStep(0);

  // Acabou de criar a senha (veio de definir-senha.html) e já tem a Rota Blindada PRO:
  // marca a rota PRO e pula direto pra etapa de contato.
  acessoPronto.then(function () {
    if (temAcessoPro() && new URLSearchParams(window.location.search).get("comprado") === "1") {
      var radioPro = form.querySelector('input[name="rota"][value="completa"]');
      if (radioPro) radioPro.checked = true;
      rebuildSteps();
      current = 1;
      showStep(current);
    }
  });
})();
