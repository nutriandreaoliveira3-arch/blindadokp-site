(function () {
  var form = document.getElementById("wizardForm");
  if (!form) return;

  var STEP_NAMES = ["Contato", "Sua marca", "Personalidade e visual", "Aplicações e limites", "Última pergunta"];
  var steps = Array.prototype.slice.call(form.querySelectorAll(".wizard-fieldset"));
  var dots = Array.prototype.slice.call(form.querySelectorAll("[data-step-dot]"));
  var stepAtualEl = document.getElementById("stepAtual");
  var stepNomeEl = document.getElementById("stepNome");
  var btnVoltar = document.getElementById("btnVoltar");
  var btnAvancar = document.getElementById("btnAvancar");
  var wizardResult = document.getElementById("wizardResult");
  var current = 0;

  function showStep(index) {
    steps.forEach(function (fs, i) { fs.classList.toggle("is-active", i === index); });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === index);
      dot.classList.toggle("is-done", i < index);
    });
    stepAtualEl.textContent = index + 1;
    stepNomeEl.textContent = STEP_NAMES[index];
    btnVoltar.style.visibility = index === 0 ? "hidden" : "visible";
    btnAvancar.innerHTML = index === steps.length - 1
      ? "GERAR MEU PROMPT"
      : "PRÓXIMA <span>→</span>";
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

  btnVoltar.addEventListener("click", function () {
    if (current === 0) return;
    current -= 1;
    showStep(current);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!currentStepIsValid()) return;

    if (current < steps.length - 1) {
      current += 1;
      showStep(current);
      return;
    }

    var data = Object.fromEntries(new FormData(form).entries());
    var prompt = buildPrompt(data);
    document.getElementById("promptGerado").textContent = prompt;

    var assunto = "Documento Mestre de Identidade Visual preenchido — " + data.contato_nome;
    var corpo = [
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
    ].join("\n");

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

  function buildPrompt(data) {
    return "ATUE COMO DIRETOR(A) DE MARCA E DESIGNER DE IDENTIDADE VISUAL SÊNIOR.\n\n" +
      "Abaixo estão as respostas de um(a) profissional da saúde para a criação da identidade visual da marca dele(a). Use apenas essas respostas — não peça mais informações antes de entregar o resultado.\n\n" +
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
      "NÍVEL DE LIBERDADE PARA A IA: " + data.liberdade + "\n\n" +
      "REGRAS DE DECISÃO\n" +
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
      "10. Aplicação nos canais e materiais indicados.\n" +
      "11. Guia “FAÇA / NÃO FAÇA”.\n" +
      "12. Resumo de uma página do manual da marca.\n" +
      "13. Bloco técnico em JSON e CSS com tokens de cores, fontes, espaçamento, raios, bordas e sombras.\n" +
      "14. Checklist de arquivos finais que precisam ser produzidos.\n\n" +
      "Antes de encerrar, faça uma auditoria: confirme que nenhuma escolha viola as restrições profissionais, éticas, de acessibilidade ou de direitos autorais informadas acima.";
  }

  showStep(0);
})();
