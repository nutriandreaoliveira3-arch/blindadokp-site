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

  loadOverview();
})();
