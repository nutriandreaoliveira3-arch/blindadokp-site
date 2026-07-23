(function () {
  // TODO(Andréa): se a Greenn te der um link novo pra esse produto, troque a linha abaixo.
  var GREENN_CHECKOUT_URL_PROMPTS = "https://payfast.greenn.com.br/4dr5pj8";

  var btnCopiarPreview = document.getElementById("btnCopiarPreview");
  if (btnCopiarPreview) {
    btnCopiarPreview.addEventListener("click", function () {
      var texto = document.getElementById("promptIdentidadeVisual").textContent;
      navigator.clipboard.writeText(texto).then(function () {
        var original = btnCopiarPreview.textContent;
        btnCopiarPreview.textContent = "Copiado";
        setTimeout(function () { btnCopiarPreview.textContent = original; }, 1600);
      });
    });
  }

  var btnComprar = document.getElementById("btnComprar");
  if (btnComprar) btnComprar.href = GREENN_CHECKOUT_URL_PROMPTS;

  var comprasRecentesEl = document.getElementById("comprasRecentesAviso");
  if (comprasRecentesEl && new URLSearchParams(window.location.search).get("comprado") === "1") {
    comprasRecentesEl.hidden = false;
  }

  var comprarBloco = document.getElementById("comprarBloco");
  var bibliotecaBloco = document.getElementById("bibliotecaBloco");
  var bibliotecaConteudo = document.getElementById("bibliotecaConteudo");

  function agruparPrompts(prompts) {
    var grupos = {};
    prompts.forEach(function (p) {
      var chave = p.profession;
      if (!grupos[chave]) grupos[chave] = {};
      if (!grupos[chave][p.content_type]) grupos[chave][p.content_type] = [];
      grupos[chave][p.content_type].push(p);
    });
    return grupos;
  }

  function copiarTexto(id, btn) {
    var texto = document.getElementById(id).textContent;
    navigator.clipboard.writeText(texto).then(function () {
      var original = btn.textContent;
      btn.textContent = "Copiado";
      setTimeout(function () { btn.textContent = original; }, 1600);
    });
  }
  window.copiarPromptBiblioteca = copiarTexto;

  function renderBiblioteca(prompts) {
    if (!prompts.length) {
      bibliotecaConteudo.innerHTML =
        '<div class="prompt-empty">Seu acesso está confirmado — a biblioteca está sendo montada e os prompts aparecem aqui assim que forem publicados.</div>';
      return;
    }

    var grupos = agruparPrompts(prompts);
    var html = "";
    var contador = 0;

    Object.keys(grupos).forEach(function (profissao) {
      html += '<div class="prompt-group"><h3 class="prompt-group-title">' + profissao + "</h3>";
      Object.keys(grupos[profissao]).forEach(function (tipo) {
        html += '<p class="prompt-group-subtitle">' + tipo + "</p>";
        grupos[profissao][tipo].forEach(function (p) {
          contador += 1;
          var elId = "promptBiblioteca" + contador;
          html +=
            '<div class="result-prompt"><div class="result-prompt-head"><span>' +
            p.title +
            '</span><button type="button" class="copy-btn" onclick="copiarPromptBiblioteca(\'' +
            elId +
            "', this)\">Copiar</button></div><pre id=\"" +
            elId +
            '">' +
            p.body.replace(/</g, "&lt;") +
            "</pre></div>";
        });
      });
      html += "</div>";
    });

    bibliotecaConteudo.innerHTML = html;
  }

  async function iniciar() {
    var entitlements = await BlindadoAuth.getEntitlements();
    var temAcesso = entitlements.indexOf("maquina_de_prompts") !== -1;

    if (!temAcesso) {
      comprarBloco.hidden = false;
      bibliotecaBloco.hidden = true;
      return;
    }

    comprarBloco.hidden = true;
    bibliotecaBloco.hidden = false;

    try {
      var res = await fetch("/api/prompts", {
        headers: { Authorization: "Bearer " + BlindadoAuth.getToken() },
      });
      var data = await res.json();
      renderBiblioteca(res.ok ? data.prompts || [] : []);
    } catch (err) {
      bibliotecaConteudo.innerHTML =
        '<div class="prompt-empty">Não deu pra carregar sua biblioteca agora. Atualize a página em instantes.</div>';
    }
  }

  iniciar();
})();
