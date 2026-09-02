(function () {
  "use strict";

  if (!BlindadoAuth.getToken()) {
    window.location.href = "login.html?proximo=diagnostico.html";
    return;
  }

  var overviewEl = document.getElementById("diagOverview");
  var loadingEl = document.getElementById("diagLoading");
  var blockListEl = document.getElementById("diagBlockList");
  var blockScreenEl = document.getElementById("diagBlock");
  var doneScreenEl = document.getElementById("diagDone");
  var formEl = document.getElementById("diagForm");
  var formErrorEl = document.getElementById("diagFormError");
  var eyebrowEl = document.getElementById("diagBlockEyebrow");
  var titleEl = document.getElementById("diagBlockTitle");

  var reportScreenEl = document.getElementById("diagReport");
  var reportBodyEl = document.getElementById("diagReportBody");
  var reportBannerEl = document.getElementById("diagReportBanner");
  var reportBannerTitleEl = document.getElementById("diagReportBannerTitle");
  var reportBannerTextEl = document.getElementById("diagReportBannerText");
  var reportBannerBtnEl = document.getElementById("diagReportBannerBtn");

  var currentAnswers = {};
  var currentQuestions = [];
  var currentBlockId = null;
  var currentBlockOrder = null;
  var totalBlocks = 15;

  function authHeaders() {
    return { Authorization: "Bearer " + BlindadoAuth.getToken() };
  }

  async function api(path, options) {
    var res = await fetch(path, Object.assign({}, options, {
      headers: Object.assign({ "Content-Type": "application/json" }, authHeaders(), (options && options.headers) || {}),
    }));
    if (res.status === 401) {
      BlindadoAuth.logout();
      window.location.href = "login.html?proximo=diagnostico.html";
      throw new Error("Sessão expirada.");
    }
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw Object.assign(new Error(data.error || "Erro."), { data: data, status: res.status });
    return data;
  }

  function showScreen(name) {
    overviewEl.hidden = name !== "overview";
    blockScreenEl.hidden = name !== "block";
    doneScreenEl.hidden = name !== "done";
    reportScreenEl.hidden = name !== "report";
  }

  async function loadOverview() {
    showScreen("overview");
    loadingEl.hidden = false;
    blockListEl.hidden = true;
    var data;
    try {
      data = await api("/api/diagnostic");
    } catch (err) {
      if (err.status === 403) {
        loadingEl.textContent = "O Diagnóstico Blindado 360 é exclusivo de quem tem a Mentoria Blindada Pró. Fale com a Andréa pra saber mais.";
        return;
      }
      throw err;
    }
    totalBlocks = data.blocks.length;
    blockListEl.innerHTML = "";
    data.blocks.forEach(function (block) {
      var li = document.createElement("li");
      li.className = "diag-block-item";
      var state = block.completed ? "completed" : block.available ? "available" : "locked";
      li.dataset.state = state;
      li.dataset.completed = String(!!block.completed);

      var num = document.createElement("span");
      num.className = "diag-block-num";
      num.textContent = String(block.order);

      var name = document.createElement("span");
      name.className = "diag-block-name";
      name.textContent = block.name;

      var status = document.createElement("span");
      status.className = "diag-block-status";
      status.textContent = block.completed ? "Concluído" : block.available ? "Responder" : "Em breve";

      li.appendChild(num);
      li.appendChild(name);
      li.appendChild(status);

      if (block.available) {
        li.addEventListener("click", function () { openBlock(block); });
      }

      blockListEl.appendChild(li);
    });
    loadingEl.hidden = true;
    blockListEl.hidden = false;

    if (data.diagnostic.allBlocksCompleted) {
      var reportStatus = null;
      try {
        reportStatus = await api("/api/diagnostic/report");
      } catch (err) {
        reportStatus = null;
      }
      reportBannerEl.hidden = false;
      if (reportStatus && reportStatus.status === "COMPLETED" && reportStatus.report) {
        reportBannerTitleEl.textContent = "Seu Diagnóstico Blindado 360 está pronto.";
        reportBannerTextEl.textContent = "Veja o gargalo principal, as prioridades e o plano dos próximos 90 dias.";
        reportBannerBtnEl.textContent = "Ver meu diagnóstico";
      } else {
        reportBannerTitleEl.textContent = "Todas as 15 áreas foram respondidas.";
        reportBannerTextEl.textContent = "Já temos o que precisamos pra gerar seu Diagnóstico Blindado 360 completo.";
        reportBannerBtnEl.textContent = "Gerar meu diagnóstico";
      }
    } else {
      reportBannerEl.hidden = true;
    }
  }

  async function openBlock(blockMeta) {
    var data = await api("/api/diagnostic/blocks/" + blockMeta.id);
    currentBlockId = blockMeta.id;
    currentBlockOrder = blockMeta.order;
    currentQuestions = data.block.questions;
    currentAnswers = data.answers || {};

    eyebrowEl.textContent = "BLOCO " + blockMeta.order + " DE " + totalBlocks;
    titleEl.textContent = blockMeta.name;
    formErrorEl.hidden = true;
    renderForm();
    showScreen("block");
  }

  function fieldValue(fieldId) {
    return currentAnswers[fieldId];
  }

  function setFieldValue(fieldId, value) {
    currentAnswers[fieldId] = value;
  }

  function isConditionMet(field) {
    if (!field.conditional) return true;
    var target = fieldValue(field.conditional.field);
    if (field.conditional.includes !== undefined) {
      return Array.isArray(target) && target.indexOf(field.conditional.includes) !== -1;
    }
    if (field.conditional.oneOf !== undefined) {
      return field.conditional.oneOf.indexOf(target) !== -1;
    }
    return target === field.conditional.equals;
  }

  function renderForm() {
    formEl.innerHTML = "";
    currentQuestions.forEach(function (question) {
      var wrap = document.createElement("div");
      wrap.className = "diag-question";

      var content = document.createElement("span");
      content.className = "diag-question-content";
      content.textContent = question.content;
      wrap.appendChild(content);

      question.fields.forEach(function (field) {
        var fieldEl = renderField(field);
        if (field.conditional) fieldEl.hidden = !isConditionMet(field);
        wrap.appendChild(fieldEl);
      });

      formEl.appendChild(wrap);
    });

    renderCapacityWarning();
  }

  function renderCapacityWarning() {
    var existing = formEl.querySelector(".diag-warning");
    if (existing) existing.remove();
    var current = Number(fieldValue("current_clients_month"));
    var max = Number(fieldValue("max_clients_capacity"));
    if (Number.isFinite(current) && Number.isFinite(max) && max > 0 && max < current) {
      var warn = document.createElement("p");
      warn.className = "diag-warning";
      warn.textContent = "Você informou uma capacidade menor que o número atual de clientes. Vale revisar esses números.";
      formEl.appendChild(warn);
    }
  }

  function refreshConditionals() {
    currentQuestions.forEach(function (question) {
      question.fields.forEach(function (field) {
        if (!field.conditional) return;
        var el = formEl.querySelector('[data-field-wrap="' + field.id + '"]');
        if (el) el.hidden = !isConditionMet(field);
      });
    });
    renderCapacityWarning();
  }

  function renderField(field) {
    var wrap = document.createElement("div");
    wrap.className = "diag-field";
    wrap.dataset.fieldWrap = field.id;

    var label = document.createElement("label");
    label.textContent = field.label + (field.required ? " *" : "");
    label.setAttribute("for", "f_" + field.id);
    wrap.appendChild(label);

    if (field.type === "text" || field.type === "number") {
      var input = document.createElement("input");
      input.type = field.type;
      input.id = "f_" + field.id;
      input.value = fieldValue(field.id) != null ? fieldValue(field.id) : "";
      input.addEventListener("input", function () {
        setFieldValue(field.id, field.type === "number" ? (input.value === "" ? null : Number(input.value)) : input.value);
        if (field.id === "current_clients_month" || field.id === "max_clients_capacity") renderCapacityWarning();
      });
      wrap.appendChild(input);
    } else if (field.type === "textarea") {
      var textarea = document.createElement("textarea");
      textarea.id = "f_" + field.id;
      textarea.value = fieldValue(field.id) || "";
      textarea.addEventListener("input", function () { setFieldValue(field.id, textarea.value); });
      wrap.appendChild(textarea);
    } else if (field.type === "select") {
      var select = document.createElement("select");
      select.id = "f_" + field.id;
      var blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "Selecione...";
      select.appendChild(blank);
      field.options.forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        if (String(fieldValue(field.id)) === opt.value) o.selected = true;
        select.appendChild(o);
      });
      select.addEventListener("change", function () {
        setFieldValue(field.id, select.value);
        refreshConditionals();
      });
      wrap.appendChild(select);
    } else if (field.type === "multiselect") {
      var list = document.createElement("div");
      list.className = "diag-choice-list";
      var selected = Array.isArray(fieldValue(field.id)) ? fieldValue(field.id) : [];
      field.options.forEach(function (opt) {
        var itemLabel = document.createElement("label");
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = opt.value;
        checkbox.checked = selected.indexOf(opt.value) !== -1;
        checkbox.addEventListener("change", function () {
          var current = Array.isArray(fieldValue(field.id)) ? fieldValue(field.id).slice() : [];
          if (checkbox.checked) {
            if (field.maxSelect && current.length >= field.maxSelect) {
              checkbox.checked = false;
              return;
            }
            current.push(opt.value);
          } else {
            current = current.filter(function (v) { return v !== opt.value; });
          }
          setFieldValue(field.id, current);
          refreshConditionals();
        });
        itemLabel.appendChild(checkbox);
        itemLabel.appendChild(document.createTextNode(opt.label));
        list.appendChild(itemLabel);
      });
      wrap.appendChild(list);
      if (field.maxSelect) {
        var hint = document.createElement("p");
        hint.className = "diag-hint";
        hint.textContent = "Selecione até " + field.maxSelect + ".";
        wrap.appendChild(hint);
      }
    } else if (field.type === "repeatable") {
      var rowsContainer = document.createElement("div");
      var rows = Array.isArray(fieldValue(field.id)) ? fieldValue(field.id).slice() : [];

      function renderRows() {
        rowsContainer.innerHTML = "";
        rows.forEach(function (row, index) {
          var rowEl = document.createElement("div");
          rowEl.className = "diag-repeatable-row";
          field.itemFields.forEach(function (itemField) {
            var itemInput;
            if (itemField.type === "select") {
              itemInput = document.createElement("select");
              var blankOpt = document.createElement("option");
              blankOpt.value = "";
              blankOpt.textContent = itemField.label;
              itemInput.appendChild(blankOpt);
              itemField.options.forEach(function (opt) {
                var o = document.createElement("option");
                o.value = opt.value;
                o.textContent = opt.label;
                if (String(row[itemField.id]) === opt.value) o.selected = true;
                itemInput.appendChild(o);
              });
              itemInput.addEventListener("change", function () {
                rows[index][itemField.id] = itemInput.value;
                setFieldValue(field.id, rows);
              });
            } else {
              itemInput = document.createElement("input");
              itemInput.type = itemField.type;
              itemInput.placeholder = itemField.label;
              itemInput.value = row[itemField.id] != null ? row[itemField.id] : "";
              itemInput.addEventListener("input", function () {
                rows[index][itemField.id] = itemField.type === "number" ? (itemInput.value === "" ? null : Number(itemInput.value)) : itemInput.value;
                setFieldValue(field.id, rows);
              });
            }
            rowEl.appendChild(itemInput);
          });
          var removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "diag-repeatable-remove";
          removeBtn.textContent = "Remover";
          removeBtn.addEventListener("click", function () {
            rows.splice(index, 1);
            setFieldValue(field.id, rows);
            renderRows();
          });
          rowEl.appendChild(removeBtn);
          rowsContainer.appendChild(rowEl);
        });
      }

      renderRows();
      wrap.appendChild(rowsContainer);

      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "diag-repeatable-add";
      addBtn.textContent = field.addLabel || "+ Adicionar";
      addBtn.addEventListener("click", function () {
        rows.push({});
        setFieldValue(field.id, rows);
        renderRows();
      });
      wrap.appendChild(addBtn);
    }

    return wrap;
  }

  async function save(completed) {
    formErrorEl.hidden = true;
    try {
      var data = await api("/api/diagnostic/blocks/" + currentBlockId, {
        method: "PUT",
        body: JSON.stringify({ answers: currentAnswers, completed: completed }),
      });
      if (completed && data.completed) {
        showScreen("done");
      } else if (!completed) {
        showScreen("overview");
        await loadOverview();
      }
    } catch (err) {
      formErrorEl.textContent = err.data && err.data.missing
        ? "Faltam alguns campos obrigatórios: " + err.data.missing.join(", ")
        : err.message;
      formErrorEl.hidden = false;
    }
  }

  document.getElementById("diagSaveBtn").addEventListener("click", function () { save(false); });
  document.getElementById("diagCompleteBtn").addEventListener("click", function () { save(true); });
  document.getElementById("diagBackBtn").addEventListener("click", function () { showScreen("overview"); loadOverview(); });
  document.getElementById("diagBackFromDoneBtn").addEventListener("click", function () { showScreen("overview"); loadOverview(); });

  // ---------------------------------------------------------------------
  // Relatório final (Diagnóstico 360 — Fases 13-17): calcula scores +
  // prioridades (determinístico, barato) e depois gera o relatório com IA
  // (POST /api/diagnostic/report), renderizando o resultado.
  // ---------------------------------------------------------------------

  var AREA_LABELS = {
    general: "Geral",
    business: "Negócio Atual",
    audience: "Público e Cliente Ideal",
    positioning: "Posicionamento",
    differentiation: "Diferenciação",
    offer: "Oferta",
    pricing: "Precificação e Monetização",
    communication: "Comunicação e Conteúdo",
    acquisition: "Marketing e Aquisição",
    sales: "Vendas e Conversão",
    operations: "Operação e Entrega",
    ai: "Inteligência Artificial",
    automation: "Automação",
    ethics: "Ética e Comunicação Profissional",
    retention: "Experiência, Retenção e Renovação",
    metrics: "Gestão, Métricas e Tomada de Decisão",
  };
  var SCORE_AREA_ORDER = [
    "general", "business", "audience", "positioning", "differentiation", "offer", "pricing",
    "communication", "acquisition", "sales", "operations", "ai", "automation", "ethics",
    "retention", "metrics",
  ];
  var LEVEL_LABELS = { HIGH: "Alta", MEDIUM: "Média", LOW: "Baixa" };
  var INSIGHT_TYPE_LABELS = {
    CONFIRMADO: "Confirmado", HIPOTESE: "Hipótese", ALERTA: "Alerta",
    OPORTUNIDADE: "Oportunidade", PRIORIDADE: "Prioridade",
  };
  var RECOMMENDED_MODE_LABELS = {
    HUMAN_ONLY: "Só humano", AI_SUPPORT: "IA como apoio", AI_WITH_HUMAN_APPROVAL: "IA com aprovação humana",
    PARTIAL_AUTOMATION: "Automação parcial", FULL_AUTOMATION: "Automação total",
    SPECIALIZED_SKILL_OR_AGENT: "Skill/agente especializado",
  };
  var CLASSIFICATION_LABELS = {
    MANTER_HUMANO: "Manter humano", ORGANIZAR_PRIMEIRO: "Organizar primeiro",
    AUTOMATIZAR_COM_APROVACAO: "Automatizar com aprovação", AUTOMATIZAR_PARCIALMENTE: "Automatizar parcialmente",
    AUTOMATIZAR: "Automatizar", NAO_PRIORITARIO: "Não prioritário",
  };
  var CADENCE_LABELS = {
    WEEKLY: "Semanal", BIWEEKLY: "Quinzenal", MONTHLY: "Mensal", QUARTERLY: "Trimestral",
    WHEN_APPLICABLE: "Quando aplicável",
  };
  var TIME_HORIZON_LABELS = { TODAY: "Hoje", NEXT_7_DAYS: "Próximos 7 dias", NEXT_30_DAYS: "Próximos 30 dias" };

  function areaLabel(area) { return AREA_LABELS[area] || area; }
  function levelLabel(v) { return LEVEL_LABELS[v] || v; }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function buildLabeledLine(label, text) {
    var p = el("p", "diag-report-card-line");
    p.appendChild(el("strong", null, label + ": "));
    p.appendChild(document.createTextNode(text));
    return p;
  }

  function buildSection(title) {
    var section = el("div", "diag-report-section");
    section.appendChild(el("h3", "diag-report-section-title", title));
    return section;
  }

  function buildStageHeader(report) {
    var wrap = el("div", "diag-report-header");
    wrap.appendChild(el("p", "eyebrow", "DIAGNÓSTICO BLINDADO 360"));
    var stage = report.business_stage || {};
    wrap.appendChild(el("h2", "diag-report-stage-title", stage.title || ""));
    if (stage.description) wrap.appendChild(el("p", "diag-report-stage-desc", stage.description));
    if (report.executive_summary) wrap.appendChild(el("p", "diag-report-summary", report.executive_summary));
    return wrap;
  }

  function buildScoresSection(scores) {
    var section = buildSection("Score 360");
    var grid = el("div", "diag-score-grid");
    SCORE_AREA_ORDER.forEach(function (area) {
      var value = scores ? scores[area] : null;
      var row = el("div", "diag-score-row");
      row.appendChild(el("span", "diag-score-label", areaLabel(area)));
      var barWrap = el("div", "diag-score-bar");
      var fill = el("div", "diag-score-bar-fill");
      var pct = value != null ? Math.max(0, Math.min(100, (Number(value) / 5) * 100)) : 0;
      fill.style.width = pct + "%";
      barWrap.appendChild(fill);
      row.appendChild(barWrap);
      row.appendChild(el("span", "diag-score-value", value != null ? Number(value).toFixed(1) : "—"));
      grid.appendChild(row);
    });
    section.appendChild(grid);
    return section;
  }

  function buildBottleneckCard(b, primary) {
    var card = el("div", "diag-report-card" + (primary ? " diag-report-card-primary" : ""));
    var head = el("div", "diag-report-card-head");
    head.appendChild(el("span", "diag-badge", primary ? "Gargalo principal" : "Gargalo"));
    head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(b.area)));
    if (b.confidence) head.appendChild(el("span", "diag-badge diag-badge-confidence", "Confiança: " + levelLabel(b.confidence)));
    card.appendChild(head);
    card.appendChild(el("h4", "diag-report-card-title", b.title));
    card.appendChild(el("p", "diag-report-card-desc", b.description));
    return card;
  }

  function buildBottlenecksSection(report) {
    var section = buildSection("Gargalos");
    if (report.primary_bottleneck) section.appendChild(buildBottleneckCard(report.primary_bottleneck, true));
    (report.secondary_bottlenecks || []).forEach(function (b) { section.appendChild(buildBottleneckCard(b, false)); });
    return section;
  }

  function buildOpportunitySection(opp) {
    var section = buildSection("Maior oportunidade");
    if (!opp) return section;
    var card = el("div", "diag-report-card diag-report-card-primary");
    var head = el("div", "diag-report-card-head");
    head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(opp.area)));
    if (opp.confidence) head.appendChild(el("span", "diag-badge diag-badge-confidence", "Confiança: " + levelLabel(opp.confidence)));
    card.appendChild(head);
    card.appendChild(el("h4", "diag-report-card-title", opp.title));
    card.appendChild(el("p", "diag-report-card-desc", opp.description));
    if (opp.expected_gain) card.appendChild(buildLabeledLine("Ganho esperado", opp.expected_gain));
    section.appendChild(card);
    return section;
  }

  function buildInsightsSection(insights) {
    var section = buildSection("Principais insights");
    (insights || []).forEach(function (insight) {
      var card = el("div", "diag-report-card");
      var head = el("div", "diag-report-card-head");
      head.appendChild(el("span", "diag-badge diag-badge-type", INSIGHT_TYPE_LABELS[insight.type] || insight.type));
      head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(insight.area)));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", insight.title));
      card.appendChild(el("p", "diag-report-card-desc", insight.message));
      section.appendChild(card);
    });
    return section;
  }

  function buildPrioritiesSection(priorities) {
    var section = buildSection("Top 3 prioridades");
    (priorities || []).slice().sort(function (a, b) { return a.rank - b.rank; }).forEach(function (p) {
      var card = el("div", "diag-report-card diag-report-card-priority");
      var head = el("div", "diag-report-card-head");
      head.appendChild(el("span", "diag-priority-rank", "#" + p.rank));
      head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(p.area)));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", p.title));
      if (p.problem) card.appendChild(buildLabeledLine("Problema", p.problem));
      if (p.reason) card.appendChild(buildLabeledLine("Por quê", p.reason));
      if (p.action) card.appendChild(buildLabeledLine("Ação", p.action));
      if (p.expected_operational_result) card.appendChild(buildLabeledLine("Resultado esperado", p.expected_operational_result));
      if (p.success_metric) card.appendChild(buildLabeledLine("Métrica de sucesso", p.success_metric));
      section.appendChild(card);
    });
    return section;
  }

  function buildNotNowSection(items) {
    var section = buildSection("O que não fazer agora");
    if (!items || !items.length) {
      section.appendChild(el("p", "diag-report-empty", "Nenhum item registrado."));
      return section;
    }
    items.forEach(function (item) {
      var card = el("div", "diag-report-card");
      var head = el("div", "diag-report-card-head");
      head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(item.area)));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", item.action));
      if (item.reason) card.appendChild(buildLabeledLine("Motivo", item.reason));
      if (item.review_when) card.appendChild(buildLabeledLine("Revisar quando", item.review_when));
      section.appendChild(card);
    });
    return section;
  }

  function buildAiSection(items) {
    var section = buildSection("Oportunidades de IA");
    if (!items || !items.length) {
      section.appendChild(el("p", "diag-report-empty", "Nenhuma oportunidade registrada."));
      return section;
    }
    items.forEach(function (item) {
      var card = el("div", "diag-report-card");
      var head = el("div", "diag-report-card-head");
      head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(item.area)));
      if (item.priority) head.appendChild(el("span", "diag-badge", "Prioridade: " + levelLabel(item.priority)));
      if (item.risk) head.appendChild(el("span", "diag-badge", "Risco: " + levelLabel(item.risk)));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", item.job_to_be_done));
      if (item.ai_role) card.appendChild(buildLabeledLine("Papel da IA", item.ai_role));
      if (item.human_role) card.appendChild(buildLabeledLine("Papel humano", item.human_role));
      if (item.expected_gain) card.appendChild(buildLabeledLine("Ganho esperado", item.expected_gain));
      if (item.recommended_mode) card.appendChild(buildLabeledLine("Modo recomendado", RECOMMENDED_MODE_LABELS[item.recommended_mode] || item.recommended_mode));
      section.appendChild(card);
    });
    return section;
  }

  function buildAutomationSection(items) {
    var section = buildSection("Oportunidades de automação");
    if (!items || !items.length) {
      section.appendChild(el("p", "diag-report-empty", "Nenhuma oportunidade registrada."));
      return section;
    }
    items.forEach(function (item) {
      var card = el("div", "diag-report-card");
      var head = el("div", "diag-report-card-head");
      head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(item.area)));
      if (item.classification) head.appendChild(el("span", "diag-badge", CLASSIFICATION_LABELS[item.classification] || item.classification));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", item.task));
      if (item.reason) card.appendChild(buildLabeledLine("Motivo", item.reason));
      if (item.expected_gain) card.appendChild(buildLabeledLine("Ganho esperado", item.expected_gain));
      if (item.human_approval_required !== undefined) card.appendChild(buildLabeledLine("Aprovação humana", item.human_approval_required ? "Necessária" : "Não necessária"));
      if (item.risk) card.appendChild(buildLabeledLine("Risco", levelLabel(item.risk)));
      section.appendChild(card);
    });
    return section;
  }

  function buildMetricsSection(items) {
    var section = buildSection("Métricas prioritárias");
    if (!items || !items.length) {
      section.appendChild(el("p", "diag-report-empty", "Nenhuma métrica registrada."));
      return section;
    }
    items.forEach(function (item) {
      var card = el("div", "diag-report-card");
      var head = el("div", "diag-report-card-head");
      head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(item.area)));
      if (item.cadence) head.appendChild(el("span", "diag-badge", CADENCE_LABELS[item.cadence] || item.cadence));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", item.label));
      if (item.reason) card.appendChild(buildLabeledLine("Por quê", item.reason));
      if (item.decision_use) card.appendChild(buildLabeledLine("Uso na decisão", item.decision_use));
      section.appendChild(card);
    });
    return section;
  }

  function buildEthicsSection(items) {
    var section = buildSection("Alertas éticos");
    items.forEach(function (item) {
      var card = el("div", "diag-report-card diag-report-card-alert");
      var head = el("div", "diag-report-card-head");
      head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(item.area)));
      if (item.confidence) head.appendChild(el("span", "diag-badge diag-badge-confidence", "Confiança: " + levelLabel(item.confidence)));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", item.title));
      card.appendChild(el("p", "diag-report-card-desc", item.message));
      if (item.action) card.appendChild(buildLabeledLine("Ação recomendada", item.action));
      if (item.requires_external_validation) card.appendChild(el("p", "diag-report-card-warning", "Requer validação externa (jurídica/conselho) antes de agir."));
      section.appendChild(card);
    });
    return section;
  }

  function buildPlanCard(plan, title) {
    var card = el("div", "diag-plan-card");
    card.appendChild(el("h4", "diag-plan-card-title", title));
    if (!plan) return card;
    if (plan.objective) card.appendChild(el("p", "diag-plan-card-objective", plan.objective));
    if (plan.actions && plan.actions.length) {
      card.appendChild(el("p", "diag-plan-sublabel", "Ações"));
      var actionsList = el("ul", "diag-plan-list");
      plan.actions.forEach(function (a) {
        actionsList.appendChild(el("li", null, a.title + (a.description ? " — " + a.description : "")));
      });
      card.appendChild(actionsList);
    }
    if (plan.deliverables && plan.deliverables.length) {
      card.appendChild(el("p", "diag-plan-sublabel", "Entregáveis"));
      var delivList = el("ul", "diag-plan-list");
      plan.deliverables.forEach(function (d) { delivList.appendChild(el("li", null, d)); });
      card.appendChild(delivList);
    }
    return card;
  }

  function buildPlanSection(report) {
    var section = buildSection("Plano 30 / 60 / 90 dias");
    var grid = el("div", "diag-plan-grid");
    grid.appendChild(buildPlanCard(report.plan_30_days, "30 dias — Corrigir"));
    grid.appendChild(buildPlanCard(report.plan_60_days, "60 dias — Implementar"));
    grid.appendChild(buildPlanCard(report.plan_90_days, "90 dias — Testar e ajustar"));
    section.appendChild(grid);
    return section;
  }

  function buildNextStepSection(nextStep, confidence) {
    var section = buildSection("Próximo passo");
    if (nextStep) {
      var card = el("div", "diag-report-card diag-report-card-primary");
      var head = el("div", "diag-report-card-head");
      if (nextStep.area) head.appendChild(el("span", "diag-badge diag-badge-area", areaLabel(nextStep.area)));
      if (nextStep.time_horizon) head.appendChild(el("span", "diag-badge", TIME_HORIZON_LABELS[nextStep.time_horizon] || nextStep.time_horizon));
      card.appendChild(head);
      card.appendChild(el("h4", "diag-report-card-title", nextStep.title));
      card.appendChild(el("p", "diag-report-card-desc", nextStep.description));
      section.appendChild(card);
    }
    if (confidence) section.appendChild(el("p", "diag-report-confidence", "Confiança geral do diagnóstico: " + levelLabel(confidence)));
    return section;
  }

  function renderReportLoading(msg) {
    reportBodyEl.innerHTML = "";
    reportBodyEl.appendChild(el("p", "diag-report-loading", msg));
  }

  function renderReportError(msg) {
    reportBodyEl.innerHTML = "";
    reportBodyEl.appendChild(el("p", "diag-error", msg || "Não conseguimos gerar seu diagnóstico agora. Tente novamente."));
    var retryBtn = el("button", "button button-gold", "Tentar novamente");
    retryBtn.type = "button";
    retryBtn.addEventListener("click", function () { runReportGeneration(); });
    reportBodyEl.appendChild(retryBtn);
  }

  // ---------------------------------------------------------------------
  // Entregáveis Premium (Dossiê de Posicionamento, Manual de Comunicação
  // Ética, Assistente IA Particular) — gerados em segundo plano junto com
  // o relatório final (podem não estar prontos ainda quando a tela abre),
  // por isso faz um polling leve até todos saírem de PROCESSING.
  // ---------------------------------------------------------------------

  function buildDeliverableCard(title) {
    var card = el("div", "diag-report-card diag-deliverable-card");
    card.appendChild(el("h4", "diag-report-card-title", title));
    return card;
  }

  function renderDossieContent(container, content) {
    container.appendChild(buildLabeledLine("Nicho", content.nicho));
    container.appendChild(buildLabeledLine("Especialidade", content.especialidade));
    container.appendChild(buildLabeledLine("Posicionamento", content.posicionamento));
    container.appendChild(buildLabeledLine("Público", content.publico));
    container.appendChild(buildLabeledLine("Problema principal", content.problema_principal));
    container.appendChild(buildLabeledLine("Diferenciação", content.diferenciacao));
    container.appendChild(buildLabeledLine("Proposta de valor", content.proposta_valor));
    container.appendChild(buildLabeledLine("Mensagem central", content.mensagem_central));
    if (content.pilares_autoridade && content.pilares_autoridade.length) {
      container.appendChild(buildLabeledLine("Pilares de autoridade", content.pilares_autoridade.join(" · ")));
    }
    container.appendChild(buildLabeledLine("Linguagem", content.linguagem));
    container.appendChild(buildLabeledLine("Bio pronta", content.bio));
    container.appendChild(buildLabeledLine("Pitch", content.pitch));
    container.appendChild(buildLabeledLine("Direcionamento de marca", content.direcionamento_marca));
  }

  function renderManualEticaContent(container, content) {
    container.appendChild(buildLabeledLine("O que pode comunicar", content.o_que_pode_comunicar));
    if (content.pontos_atencao && content.pontos_atencao.length) container.appendChild(buildLabeledLine("Pontos de atenção", content.pontos_atencao.join(" · ")));
    if (content.linguagem_risco && content.linguagem_risco.length) container.appendChild(buildLabeledLine("Linguagem de risco", content.linguagem_risco.join(" · ")));
    container.appendChild(buildLabeledLine("Divulgação de resultados", content.divulgacao_resultados));
    container.appendChild(buildLabeledLine("Depoimentos", content.depoimentos));
    container.appendChild(buildLabeledLine("Antes e depois", content.antes_depois));
    container.appendChild(buildLabeledLine("Anúncios", content.anuncios));
    container.appendChild(buildLabeledLine("Promoções", content.promocoes));
    container.appendChild(buildLabeledLine("Bio", content.bio));
    container.appendChild(buildLabeledLine("Publicidade", content.publicidade));
    container.appendChild(buildLabeledLine("Títulos e especialidades", content.titulos_especialidades));
    container.appendChild(buildLabeledLine("Identificação profissional", content.identificacao_profissional));
    if (content.disclaimers && content.disclaimers.length) container.appendChild(buildLabeledLine("Disclaimers", content.disclaimers.join(" · ")));
    if (content.regras_redes_sociais && content.regras_redes_sociais.length) container.appendChild(buildLabeledLine("Regras pra redes sociais", content.regras_redes_sociais.join(" · ")));
    if (content.nota_atualizacao) container.appendChild(el("p", "diag-report-card-warning", content.nota_atualizacao));
  }

  function renderAssistenteIaContent(container, content) {
    var textarea = el("textarea", null);
    textarea.readOnly = true;
    textarea.style.cssText = "width:100%;min-height:200px;background:#0c0b0a;border:1px solid rgba(255,255,255,.16);color:var(--cream);padding:10px;font-family:monospace;font-size:12px;";
    textarea.value = content.skill_md;
    container.appendChild(textarea);
    var copyBtn = el("button", "button button-outline", "Copiar");
    copyBtn.type = "button";
    copyBtn.style.marginTop = "8px";
    copyBtn.addEventListener("click", function () {
      var resetLabel = function () { setTimeout(function () { copyBtn.textContent = "Copiar"; }, 2000); };
      navigator.clipboard.writeText(content.skill_md).then(function () {
        copyBtn.textContent = "Copiado!";
        resetLabel();
      }).catch(function () {
        textarea.removeAttribute("readonly");
        textarea.select();
        document.execCommand("copy");
        textarea.setAttribute("readonly", "readonly");
        copyBtn.textContent = "Copiado!";
        resetLabel();
      });
    });
    container.appendChild(copyBtn);
  }

  var DELIVERABLE_META = {
    dossie_posicionamento: { title: "Dossiê de Posicionamento Blindado", render: renderDossieContent },
    manual_etica: { title: "Manual de Comunicação Ética da Marca", render: renderManualEticaContent },
    assistente_ia: { title: "Assistente IA Particular — skill personalizada pra você", render: renderAssistenteIaContent },
  };

  function renderDeliverablesSection(deliverables) {
    var section = buildSection("Seus Entregáveis Premium");
    Object.keys(DELIVERABLE_META).forEach(function (type) {
      var meta = DELIVERABLE_META[type];
      var entry = deliverables[type];
      var card = buildDeliverableCard(meta.title);
      if (!entry || entry.status === "PROCESSING") {
        card.appendChild(el("p", "diag-report-loading", "Gerando esse entregável pra você — pode levar alguns minutos. Atualize a página daqui a pouco."));
      } else if (entry.status === "PROCESSING_ERROR") {
        card.appendChild(el("p", "diag-error", "Não conseguimos gerar esse entregável dessa vez. Já avisamos a equipe."));
      } else if (entry.status === "COMPLETED" && entry.content) {
        meta.render(card, entry.content);
      }
      section.appendChild(card);
    });
    return section;
  }

  var deliverablesPollAttempts = 0;
  async function loadDeliverables() {
    var existing = document.getElementById("diagDeliverablesSection");
    if (existing) existing.remove();

    var data;
    try {
      data = await api("/api/diagnostic/deliverables");
    } catch (err) {
      return; // entregáveis são um extra — nunca travam a tela do relatório principal
    }

    var section = renderDeliverablesSection(data.deliverables || {});
    section.id = "diagDeliverablesSection";
    var regenWrap = reportBodyEl.querySelector(".diag-report-regenerate-wrap");
    if (regenWrap) reportBodyEl.insertBefore(section, regenWrap);
    else reportBodyEl.appendChild(section);

    var stillProcessing = Object.keys(DELIVERABLE_META).some(function (type) {
      var entry = (data.deliverables || {})[type];
      return !entry || entry.status === "PROCESSING";
    });
    deliverablesPollAttempts += 1;
    if (stillProcessing && deliverablesPollAttempts < 8) {
      setTimeout(loadDeliverables, 8000);
    }
  }

  function renderReport(report) {
    reportBodyEl.innerHTML = "";
    reportBodyEl.appendChild(buildStageHeader(report));
    reportBodyEl.appendChild(buildScoresSection(report.scores));
    reportBodyEl.appendChild(buildBottlenecksSection(report));
    reportBodyEl.appendChild(buildOpportunitySection(report.main_opportunity));
    reportBodyEl.appendChild(buildInsightsSection(report.key_insights));
    reportBodyEl.appendChild(buildPrioritiesSection(report.top_priorities));
    reportBodyEl.appendChild(buildNotNowSection(report.not_now));
    reportBodyEl.appendChild(buildAiSection(report.ai_opportunities));
    reportBodyEl.appendChild(buildAutomationSection(report.automation_opportunities));
    reportBodyEl.appendChild(buildMetricsSection(report.top_metrics));
    if (report.ethical_alerts && report.ethical_alerts.length) reportBodyEl.appendChild(buildEthicsSection(report.ethical_alerts));
    reportBodyEl.appendChild(buildPlanSection(report));
    reportBodyEl.appendChild(buildNextStepSection(report.next_step, report.diagnostic_confidence));

    var regenWrap = el("div", "diag-report-regenerate-wrap");
    var regenBtn = el("button", "button button-outline", "Gerar diagnóstico novamente");
    regenBtn.type = "button";
    regenBtn.addEventListener("click", function () { runReportGeneration(); });
    regenWrap.appendChild(regenBtn);
    reportBodyEl.appendChild(regenWrap);

    deliverablesPollAttempts = 0;
    loadDeliverables();
  }

  async function runReportGeneration() {
    try {
      renderReportLoading("Calculando as notas das 15 áreas...");
      await api("/api/diagnostic/scores", { method: "POST" });
      renderReportLoading("Definindo suas prioridades estratégicas...");
      await api("/api/diagnostic/priorities", { method: "POST" });
      renderReportLoading("Gerando seu Diagnóstico Blindado 360 com IA — isso pode levar até 1 minuto...");
      var data = await api("/api/diagnostic/report", { method: "POST" });
      renderReport(data.report);
    } catch (err) {
      renderReportError(err.message);
    }
  }

  async function openReportScreen() {
    showScreen("report");
    renderReportLoading("Carregando seu diagnóstico...");
    var data;
    try {
      data = await api("/api/diagnostic/report");
    } catch (err) {
      renderReportError(err.message);
      return;
    }
    if (data.status === "COMPLETED" && data.report) {
      renderReport(data.report);
    } else {
      await runReportGeneration();
    }
  }

  reportBannerBtnEl.addEventListener("click", function () { openReportScreen(); });
  document.getElementById("diagReportBackBtn").addEventListener("click", function () { showScreen("overview"); loadOverview(); });

  loadOverview();
})();
