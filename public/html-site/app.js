(function () {
  "use strict";

  /* ---------- Сховище (localStorage) ----------
     custom    — завдання, додані користувачем
     overrides — змінені вбудовані завдання (за id)
     deleted   — id прихованих вбудованих завдань */
  var KEY = "tasks-site-v1";
  var BUILTIN = window.BUILTIN_TASKS || [];

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object") {
        return { custom: s.custom || [], overrides: s.overrides || {}, deleted: s.deleted || [] };
      }
    } catch (e) {}
    return { custom: [], overrides: {}, deleted: [] };
  }
  var state = loadState();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      alert("Не вистачає місця в пам'яті браузера. Спробуйте менше/менші фото.");
      return false;
    }
  }

  function allTasks() {
    var out = [];
    BUILTIN.forEach(function (t) {
      if (state.deleted.indexOf(t.id) !== -1) return;
      out.push(state.overrides[t.id] || t);
    });
    return out.concat(state.custom);
  }
  function getTask(id) {
    return allTasks().filter(function (t) { return t.id === id; })[0];
  }
  function isBuiltin(id) {
    return BUILTIN.some(function (t) { return t.id === id; });
  }

  /* ---------- Допоміжне ---------- */
  var app = document.getElementById("app");

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function cmp(a, b) {
    return a.localeCompare(b, "uk", { numeric: true });
  }
  function hasAnswer(t) {
    return !!(t.answer || t.solution || t.answerImage);
  }
  function uid() {
    return "c-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function compress(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 1200;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = function () { reject(new Error("img")); };
      img.src = url;
    });
  }

  /* ---------- Сторінка: список ---------- */
  var filter = { q: "", subject: "" };

  function renderList() {
    var tasks = allTasks();
    var subjects = [];
    tasks.forEach(function (t) { if (subjects.indexOf(t.subject) === -1) subjects.push(t.subject); });
    subjects.sort(function (a, b) { return cmp(a, b); });
    if (filter.subject && subjects.indexOf(filter.subject) === -1) filter.subject = "";

    var html = '<div class="stack">';
    html += '<form class="search" id="searchForm">' +
      '<input class="input" id="q" placeholder="Пошук за номером або текстом…" value="' + esc(filter.q) + '" />' +
      '<button class="btn search-btn">🔍</button></form>';

    if (subjects.length > 1) {
      html += '<div class="chips"><a class="chip' + (!filter.subject ? " active" : "") + '" data-subject="">Усі</a>';
      subjects.forEach(function (s) {
        html += '<a class="chip' + (filter.subject === s ? " active" : "") + '" data-subject="' + esc(s) + '">' + esc(s) + "</a>";
      });
      html += "</div>";
    }

    var needle = filter.q.trim().toLowerCase();
    var list = tasks.filter(function (t) {
      if (filter.subject && t.subject !== filter.subject) return false;
      if (!needle) return true;
      return (t.number + " " + t.title + " " + t.body).toLowerCase().indexOf(needle) !== -1;
    }).sort(function (a, b) {
      return cmp(a.subject, b.subject) || cmp(a.number, b.number);
    });

    if (!list.length) {
      html += '<div class="card empty"><b>' + (tasks.length ? "Нічого не знайдено" : "Завдань ще немає") + "</b>";
      if (!tasks.length) html += '<p>Додайте перше завдання з відповіддю.</p><a class="btn" href="#/add">+ Додати завдання</a>';
      html += "</div>";
    } else {
      html += '<ul class="list">';
      list.forEach(function (t) {
        var title = t.title || (t.body || "").slice(0, 60) || "Завдання зі скріном";
        html += '<li><a class="card item" href="#/task/' + encodeURIComponent(t.id) + '">' +
          '<span class="num">' + esc(t.number) + "</span>" +
          '<span class="item-main"><span class="muted" style="display:block">' + esc(t.subject) + "</span>" +
          '<span class="item-title" style="display:block">' + esc(title) + "</span>" +
          '<span class="badges">' + (t.image ? '<span class="muted">🖼 фото</span>' : "") +
          '<span class="' + (hasAnswer(t) ? "ok" : "warn") + '">' + (hasAnswer(t) ? "✓ є відповідь" : "без відповіді") + "</span></span>" +
          "</span></a></li>";
      });
      html += "</ul>";
    }

    html += '<div class="tools"><button id="exportBtn">⬇ Зберегти копію</button>' +
      '<button id="importBtn">⬆ Відновити з копії</button>' +
      '<input type="file" id="importFile" accept="application/json" class="hidden" /></div>';
    html += "</div>";
    app.innerHTML = html;

    document.getElementById("searchForm").addEventListener("submit", function (e) {
      e.preventDefault();
      filter.q = document.getElementById("q").value;
      renderList();
    });
    Array.prototype.forEach.call(app.querySelectorAll(".chip"), function (el) {
      el.addEventListener("click", function () {
        filter.q = document.getElementById("q").value;
        filter.subject = el.getAttribute("data-subject");
        renderList();
      });
    });
    document.getElementById("exportBtn").addEventListener("click", exportData);
    var file = document.getElementById("importFile");
    document.getElementById("importBtn").addEventListener("click", function () { file.click(); });
    file.addEventListener("change", importData);
  }

  function exportData() {
    var blob = new Blob([JSON.stringify(state)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "zadachi-kopiya.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function importData(e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = JSON.parse(r.result);
        if (!s || typeof s !== "object") throw 0;
        state = { custom: s.custom || [], overrides: s.overrides || {}, deleted: s.deleted || [] };
        if (save()) { alert("Відновлено!"); renderList(); }
      } catch (err) {
        alert("Файл не схожий на копію сайту");
      }
    };
    r.readAsText(f);
  }

  /* ---------- Сторінка: завдання ---------- */
  function renderTask(id) {
    var t = getTask(id);
    if (!t) return renderNotFound();

    var html = '<div class="stack"><div><a class="back" href="#/">← Усі завдання</a></div>';
    html += '<article class="card stack-sm"><div class="muted">' + esc(t.subject) + "</div>" +
      "<h1>Завдання №" + esc(t.number) + (t.title ? " — " + esc(t.title) : "") + "</h1>";
    if (t.body) html += '<p class="body-text">' + esc(t.body) + "</p>";
    if (t.image) html += '<img class="pic" alt="Завдання" src="' + t.image + '" />';
    html += "</article>";

    if (hasAnswer(t)) {
      html += '<div><button class="btn green" id="toggle">Показати відповідь</button>' +
        '<div class="answer-box hidden" id="answer">';
      if (t.answer) html += '<div><p class="label">Відповідь</p><p class="answer-main">' + esc(t.answer) + "</p></div>";
      if (t.solution) html += '<div><p class="label">Розв’язання</p><p class="answer-sol">' + esc(t.solution) + "</p></div>";
      if (t.answerImage) html += '<img class="pic" alt="Розв’язання" src="' + t.answerImage + '" />';
      html += "</div></div>";
    } else {
      html += '<p class="no-answer">Відповідь ще не додано</p>';
    }

    html += '<div class="row" style="padding-top:8px"><a class="btn light" href="#/edit/' + encodeURIComponent(t.id) + '">Редагувати</a>' +
      '<button class="btn danger" id="del">Видалити</button></div></div>';
    app.innerHTML = html;

    var toggle = document.getElementById("toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var box = document.getElementById("answer");
        var hidden = box.classList.toggle("hidden");
        toggle.textContent = hidden ? "Показати відповідь" : "Сховати відповідь";
      });
    }
    document.getElementById("del").addEventListener("click", function () {
      if (!confirm("Видалити це завдання?")) return;
      if (isBuiltin(t.id)) {
        if (state.deleted.indexOf(t.id) === -1) state.deleted.push(t.id);
        delete state.overrides[t.id];
      } else {
        state.custom = state.custom.filter(function (x) { return x.id !== t.id; });
      }
      save();
      location.hash = "#/";
    });
  }

  function renderNotFound() {
    app.innerHTML = '<div class="card empty"><b>Завдання не знайдено</b><a class="btn" href="#/">До списку</a></div>';
  }

  /* ---------- Сторінка: форма ---------- */
  function renderForm(id) {
    var editing = id ? getTask(id) : null;
    if (id && !editing) return renderNotFound();
    var t = editing || { subject: "", number: "", title: "", body: "", image: null, answer: "", solution: "", answerImage: null };
    var images = { image: t.image, answerImage: t.answerImage };

    var subjects = [];
    allTasks().forEach(function (x) { if (subjects.indexOf(x.subject) === -1) subjects.push(x.subject); });

    function picker(name, label) {
      return '<div><span class="field"><span>' + label + "</span></span>" +
        '<img class="preview hidden" id="prev-' + name + '" alt="" />' +
        '<div class="upload-row"><label class="upload" id="lab-' + name + '"><span id="txt-' + name + '">📷 Додати скрін / фото</span>' +
        '<input type="file" accept="image/*" id="file-' + name + '" /></label>' +
        '<button type="button" class="btn danger hidden" id="rm-' + name + '">Прибрати</button></div></div>';
    }

    var html = '<div class="stack"><div><a class="back" href="#/' + (editing ? "task/" + encodeURIComponent(id) : "") + '">← Назад</a></div>' +
      "<h1>" + (editing ? "Редагування завдання" : "Нове завдання") + "</h1>" +
      '<form class="stack" id="form" autocomplete="off">' +
      '<div class="grid3"><label class="field"><span>№ завдання *</span><input class="input" id="f-number" placeholder="12" required value="' + esc(t.number) + '" /></label>' +
      '<label class="field"><span>Предмет / розділ</span><input class="input" id="f-subject" list="subjects" placeholder="Математика" value="' + esc(t.subject) + '" />' +
      '<datalist id="subjects">' + subjects.map(function (s) { return '<option value="' + esc(s) + '">'; }).join("") + "</datalist></label></div>" +
      '<label class="field"><span>Назва (необов’язково)</span><input class="input" id="f-title" value="' + esc(t.title) + '" /></label>' +
      '<label class="field"><span>Умова (текст)</span><textarea class="textarea" id="f-body" rows="5">' + esc(t.body) + "</textarea></label>" +
      picker("image", "Умова (скрін)") +
      "<hr />" +
      '<label class="field"><span>Відповідь</span><input class="input" id="f-answer" value="' + esc(t.answer) + '" /></label>' +
      '<label class="field"><span>Розв’язання (необов’язково)</span><textarea class="textarea" id="f-solution" rows="5">' + esc(t.solution) + "</textarea></label>" +
      picker("answerImage", "Розв’язання / відповідь (скрін)") +
      '<div class="error hidden" id="err"></div>' +
      '<button class="btn" id="saveBtn">' + (editing ? "Зберегти зміни" : "Додати завдання") + "</button>" +
      "</form></div>";
    app.innerHTML = html;

    function refresh(name) {
      var prev = document.getElementById("prev-" + name);
      var rm = document.getElementById("rm-" + name);
      var txt = document.getElementById("txt-" + name);
      if (images[name]) {
        prev.src = images[name];
        prev.classList.remove("hidden");
        rm.classList.remove("hidden");
        txt.textContent = "Замінити фото";
      } else {
        prev.classList.add("hidden");
        rm.classList.add("hidden");
        txt.textContent = "📷 Додати скрін / фото";
      }
    }
    ["image", "answerImage"].forEach(function (name) {
      refresh(name);
      document.getElementById("file-" + name).addEventListener("change", function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var txt = document.getElementById("txt-" + name);
        txt.textContent = "Обробка…";
        compress(f).then(function (data) {
          images[name] = data;
          refresh(name);
        }).catch(function () {
          alert("Не вдалося обробити фото");
          refresh(name);
        });
        e.target.value = "";
      });
      document.getElementById("rm-" + name).addEventListener("click", function () {
        images[name] = null;
        refresh(name);
      });
    });

    document.getElementById("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (k) { return document.getElementById("f-" + k).value.trim(); };
      var err = document.getElementById("err");
      var task = {
        id: editing ? editing.id : uid(),
        subject: v("subject") || "Загальне",
        number: v("number"),
        title: v("title"),
        body: v("body"),
        image: images.image,
        answer: v("answer"),
        solution: v("solution"),
        answerImage: images.answerImage
      };
      if (!task.number || (!task.body && !task.image)) {
        err.textContent = "Вкажіть номер та умову (текст або фото)";
        err.classList.remove("hidden");
        return;
      }
      var backup = JSON.stringify(state);
      if (editing && isBuiltin(task.id)) {
        state.overrides[task.id] = task;
      } else if (editing) {
        state.custom = state.custom.map(function (x) { return x.id === task.id ? task : x; });
      } else {
        state.custom.push(task);
      }
      if (!save()) {
        state = JSON.parse(backup);
        return;
      }
      location.hash = "#/task/" + encodeURIComponent(task.id);
    });
  }

  /* ---------- Маршрутизація ---------- */
  function route() {
    var h = location.hash.replace(/^#/, "") || "/";
    var m;
    window.scrollTo(0, 0);
    if (h === "/" ) return renderList();
    if (h === "/add") return renderForm(null);
    if ((m = h.match(/^\/task\/(.+)$/))) return renderTask(decodeURIComponent(m[1]));
    if ((m = h.match(/^\/edit\/(.+)$/))) return renderForm(decodeURIComponent(m[1]));
    renderNotFound();
  }
  window.addEventListener("hashchange", route);
  route();
})();
