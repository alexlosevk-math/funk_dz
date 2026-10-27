/* Чёрные ящики без конца: правило генерируется, ученик задаёт вопросы и угадывает формулу. */
(function () {
  "use strict";
  var h = UI.h, m = UI.m;

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function nz(a, b) { var v; do { v = ri(a, b); } while (v === 0); return v; }
  function plus(v) { return v === 0 ? "" : v > 0 ? "+" + v : String(v); }
  function lin(k, b) { return (k === 1 ? "x" : k === -1 ? "-x" : k + "x") + plus(b); }

  var LEVELS = [
    { name: "Разминка", sub: "x + b, kx", make: function () {
      return UI.pick([
        function () { return "x+" + ri(1, 12); },
        function () { return "x-" + ri(1, 12); },
        function () { return ri(2, 6) + "x"; },
        function () { return ri(3, 15) + "-x"; },
        function () { return "-" + ri(2, 4) + "x"; }
      ])();
    }, hint: "Закинь 0 и 1. Из нуля выходит то, что прибавляют. А на сколько вырос ответ при шаге от 0 к 1 — на столько умножают x." },
    { name: "Прямые", sub: "kx + b", make: function () { return lin(nz(-5, 5) || 2, nz(-9, 9)); },
      hint: "Это прямая y = kx + b. b — то, что выходит из нуля. k — на сколько меняется y, когда x вырастает на 1. Хватит двух вопросов!" },
    { name: "Квадраты", sub: "x², (x + a)², ax² + c", make: function () {
      return UI.pick([
        function () { return "x^2" + plus(nz(-6, 6)); },
        function () { return "-x^2" + plus(nz(-3, 9)); },
        function () { return UI.pick([2, 3, -2]) + "x^2"; },
        function () { return "(x" + plus(nz(-4, 4)) + ")^2"; },
        function () { return "x^2" + plus(nz(-4, 4)) + "x"; },
        function () { return "2x^2" + plus(nz(-5, 5)); }
      ])();
    }, hint: "Сравни x = 2 и x = −2. Одинаковые ответы — внутри x² без сдвига. Если y растёт неравномерно (шаги 1, 3, 5…) — точно есть квадрат." },
    { name: "Хитрые", sub: "|x|, k/x, x/2, x³", make: function () {
      return UI.pick([
        function () { return "|x|" + plus(nz(-5, 5)); },
        function () { return "|x" + plus(nz(-4, 4)) + "|"; },
        function () { return UI.pick([6, 12, 24, -12]) + "/x"; },
        function () { return "x/2" + plus(nz(-6, 6)); },
        function () { return "x^3"; },
        function () { return nz(5, 12) + "-x^2"; },
        function () { return "2|x|" + plus(nz(-4, 4)); }
      ])();
    }, hint: "Проверь 0, отрицательные и чётные числа. Если на 0 ящик ломается — внутри деление на x. Если у 3 и −3 одинаковые ответы, но шаг ровный — это модуль |x|." },
    { name: "Микс", sub: "что угодно", make: function () { return LEVELS[ri(1, 3)].make(); }, hint: null }
  ];
  LEVELS[4].hint = "Сначала узнай, что за зверь: закинь 0, 1, 2 и −2. Ровный шаг — прямая. Одинаковые ответы у 2 и −2 — квадрат или модуль.";

  var LIMIT = 5;

  function render(root) {
    var level = App.flag("boxLevel") || 0;
    var sec = UI.section("Взломай чёрный ящик", "Внутри спрятано правило. Скармливай ящику числа — у тебя 5 вопросов. Потом запиши правило формулой. Ящики бесконечные: каждый раз новое правило.");
    var chips = h("div", { class: "btns" });
    LEVELS.forEach(function (L, i) {
      var c = h("button", { class: "chip" + (i === level ? " is-on" : ""), html: "<b>" + (i + 1) + ".</b> " + L.name + ' <span class="muted">' + L.sub + "</span>", onclick: function () {
        level = i; App.flag("boxLevel", i);
        Array.prototype.forEach.call(chips.children, function (x) { x.classList.remove("is-on"); });
        c.classList.add("is-on"); newBox();
      } });
      chips.appendChild(c);
    });
    var stats = h("div", { class: "stats" });
    function updStats() {
      stats.innerHTML = "";
      [["Взломано", App.flag("boxes") || 0], ["Серия", App.flag("boxStreak") || 0], ["Рекорд серии", App.flag("boxBest") || 0]]
        .forEach(function (s) { stats.appendChild(h("div", { class: "stat", html: s[0] + ": <b>" + s[1] + "</b>" })); });
    }
    updStats();
    sec.appendChild(chips);
    sec.appendChild(stats);
    var holder = h("div");
    sec.appendChild(holder);
    sec.appendChild(UI.callout("tip", "<p><b>Как вводить формулу.</b> Степень — через ^: <span class=\"kbd\">x^2</span>. Модуль — палочками: <span class=\"kbd\">|x-3|</span>. Деление — <span class=\"kbd\">12/x</span>. Умножение можно не писать: <span class=\"kbd\">3x-1</span>. Формулу можно записать как угодно, лишь бы она совпадала с правилом: " + m("(x+1)^2") + " и " + m("x^2+2x+1") + " — одно и то же.</p>"));
    root.appendChild(sec);

    var num = 0;
    function newBox() {
      num++;
      holder.innerHTML = "";
      var box = makeBox(LEVELS[level], level, num, function (ok) {
        if (ok) {
          App.count("boxes");
          var s = App.count("boxStreak");
          if (s > (App.flag("boxBest") || 0)) App.flag("boxBest", s);
        } else { App.flag("boxStreak", 0); App.count("boxGiveUp"); }
        updStats();
      }, newBox);
      holder.appendChild(box);
      box.mount();
    }
    UI.later(newBox);
  }

  function makeBox(L, level, num, done, next) {
    var rule = L.make(), f = Formula.compile(rule), asked = [], finished = false, wrongs = 0;
    var rows = h("div", { class: "box__rows" });
    var left = h("span", { class: "muted" });
    var q = h("input", { class: "task__input box__ask", type: "text", placeholder: "число x", inputmode: "decimal",
      onkeydown: function (e) { if (e.key === "Enter") ask(); } });
    var askBtn = h("button", { class: "btn btn--ghost", text: "Спросить ящик", onclick: ask });
    var gear = h("div", { class: "box__big", html: "<span>⬛</span><b>ящик №" + num + "</b><small>" + L.name + "</small>" });
    var pb = UI.plotBox({ x: [-8, 8], y: [-8, 8], unitGrid: true, zoom: true, pan: true });
    var answer = h("input", { class: "task__input", type: "text", autocomplete: "off", spellcheck: "false", placeholder: "например, 2x+3",
      onkeydown: function (e) { if (e.key === "Enter") guess(); },
      oninput: function () {
        var r = answer.value.trim() ? Formula.tryCompile(answer.value) : null;
        preview.innerHTML = !r ? "" : r.error ? '<span class="bad">' + r.error + "</span>" : "y = " + m(answer.value.replace(/^\s*y\s*=/i, ""));
      } });
    var preview = h("div", { class: "task__preview" });
    var fb = h("div", { class: "task__fb" });
    var hintBox = h("div", { class: "task__hints" });
    var guessBtn = h("button", { class: "btn btn--primary", text: "Проверить", onclick: guess });
    var tools = h("div", { class: "task__tools" },
      h("button", { class: "btn btn--ghost btn--sm", text: "💡 Подсказка", onclick: function (e) {
        hintBox.appendChild(h("div", { class: "hint", html: L.hint })); e.target.remove();
      } }),
      h("button", { class: "btn btn--ghost btn--sm", text: "🏳 Сдаюсь", onclick: giveUp }));
    var nextBtn = h("button", { class: "btn btn--primary", text: "Следующий ящик →", style: "display:none", onclick: next });

    function used() { return asked.filter(function (a) { return !a.free; }).length; }
    function upd() {
      left.innerHTML = "Вопросов осталось: <b>" + (LIMIT - used()) + "</b>";
      if (used() >= LIMIT) { q.disabled = true; askBtn.disabled = true; }
    }
    function draw() {
      var P = pb.plot; if (!P) return;
      // плоскость растягивается, чтобы все ответы ящика были видны
      var xr = [-8, 8], yr = [-8, 8];
      asked.forEach(function (a) {
        if (isNaN(a.y)) return;
        xr = [Math.min(xr[0], a.x - 2), Math.max(xr[1], a.x + 2)];
        yr = [Math.min(yr[0], a.y - 2), Math.max(yr[1], a.y + 2)];
      });
      if (xr[0] !== P.home.x[0] || xr[1] !== P.home.x[1] || yr[0] !== P.home.y[0] || yr[1] !== P.home.y[1]) P.setView(xr, yr);
      var L2 = [];
      if (finished) L2.push({ type: "fn", f: f, color: "#0a8bd0", width: 3, alpha: 0.75 });
      asked.forEach(function (a) {
        if (!isNaN(a.y)) L2.push({ type: "point", x: a.x, y: a.y, color: a.free ? "#7a55f0" : "#d18f00", r: 6, label: "(" + UI.fmt(a.x, 2) + "; " + UI.fmt(a.y, 2) + ")", size: 12 });
      });
      P.layers = L2; P.draw();
    }
    function addRow(x, free) {
      var y = f(x);
      asked.push({ x: x, y: y, free: free });
      rows.appendChild(h("div", { class: "box__row" + (free ? " box__row--free" : "") },
        h("span", { text: "f(" + UI.fmt(x, 3) + ") =" }),
        h("b", { text: isNaN(y) ? "💥 не определено" : UI.fmt(y, 3) }),
        free ? h("small", { text: "подсказка ящика" }) : null));
      draw();
    }
    function ask() {
      if (finished || used() >= LIMIT) return;
      var x = UI.parseNumber(q.value);
      if (isNaN(x)) { q.classList.add("shake"); setTimeout(function () { q.classList.remove("shake"); }, 400); return; }
      if (asked.some(function (a) { return Iv.eq(a.x, x); })) { fb.innerHTML = '<span class="muted">Это число уже спрашивали — ответ есть в списке. Вопрос не потрачен.</span>'; return; }
      fb.innerHTML = "";
      gear.classList.remove("is-working"); void gear.offsetWidth; gear.classList.add("is-working");
      addRow(x, false);
      q.value = ""; q.focus();
      upd();
    }
    function finish(ok) {
      finished = true;
      q.disabled = true; askBtn.disabled = true; guessBtn.disabled = true; answer.disabled = true;
      tools.style.display = "none";
      nextBtn.style.display = "";
      el.classList.add(ok ? "is-solved" : "is-given");
      draw();
      done(ok);
      nextBtn.focus();
    }
    function guess() {
      if (finished) return;
      var r = Formula.tryCompile(answer.value);
      if (!answer.value.trim()) { fb.innerHTML = '<span class="bad">Напиши формулу</span>'; return; }
      if (r.error) { fb.innerHTML = '<span class="bad">' + r.error + "</span>"; return; }
      if (Formula.same(r.f, f)) {
        var n = used();
        var xp = (level + 1) * 8 + (LIMIT - n) * 3 - wrongs * 3;
        xp = Math.max(5, xp);
        App.addXp(xp);
        fb.innerHTML = '<span class="ok">' + UI.pick(["Взломан! 🔓", "Ящик раскрыт 🎯", "Есть! Правило твоё 🔥", "Хакер уровня 9 класса 😎"]) + " +" + xp + " XP</span>" +
          '<div class="task__after">Правило: ' + m("y=" + rule) + (n === 0 ? ". Без единого вопроса — ты телепат?" : n <= 2 ? ". Всего за " + n + " " + (n === 1 ? "вопрос" : "вопроса") + " — мощно!" : "") + " На плоскости появился график — все твои точки на нём.</div>";
        UI.confetti(guessBtn);
        finish(true);
        return;
      }
      wrongs++;
      // контрпример: где формула ученика и ящик расходятся
      var bad = null;
      asked.forEach(function (a) { if (bad === null && !isNaN(a.y) && !Iv.eq(r.f(a.x), a.y)) bad = a; });
      el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
      if (bad) {
        fb.innerHTML = '<span class="bad">Не совпадает с тем, что ты уже узнал: ящик на ' + UI.fmt(bad.x) + " выдал " + UI.fmt(bad.y) + ", а твоя формула даёт " + UI.fmt(r.f(bad.x), 3) + ".</span>";
        return;
      }
      var xs = [0, 1, -1, 2, -2, 3, -3, 4, 5, -5, 10].filter(function (x) { return !asked.some(function (a) { return Iv.eq(a.x, x); }); });
      var cx = xs.filter(function (x) { var a = r.f(x), b = f(x); return isNaN(a) !== isNaN(b) || (!isNaN(a) && !Iv.eq(a, b)); })[0];
      if (cx === undefined) cx = 7;
      addRow(cx, true);
      var their = r.f(cx);
      fb.innerHTML = '<span class="bad">Твоя формула подходит ко всем вопросам, но правило другое. Ящик подкинул подсказку: f(' + UI.fmt(cx) + ") = " + (isNaN(f(cx)) ? "не определено" : UI.fmt(f(cx), 3)) + ", а у тебя выходит " + (isNaN(their) ? "«не определено»" : UI.fmt(their, 3)) + ".</span>";
    }
    function giveUp() {
      if (finished) return;
      fb.innerHTML = '<span class="muted">Правило было: ' + m("y=" + rule) + ". Подставь свои числа и проверь. Серия сброшена — следующий ящик точно твой.</span>";
      finish(false);
    }

    upd();
    var el = h("div", { class: "task box-card" },
      h("div", { class: "task__head" },
        h("span", { class: "task__badge", text: "Чёрный ящик · уровень " + (level + 1) }),
        h("span", { class: "task__lvl", text: "★★★★★".slice(0, Math.min(level + 1, 4)) })),
      h("div", { class: "split" },
        h("div", { class: "sliders" },
          gear,
          h("div", { class: "task__row" }, q, askBtn),
          left,
          rows),
        h("div", { class: "sliders" }, pb.el, h("span", { class: "muted", style: "font-size:14px", text: "Каждый ответ ящика — точка (x; y). Колёсиком можно отдалить." }))),
      h("div", { class: "task__q", html: "<p><b>Твоя догадка:</b> какое правило внутри?</p>" }),
      h("div", { class: "task__row" }, h("span", { class: "task__prefix", text: "y =" }), answer, guessBtn),
      preview, fb, hintBox, tools, nextBtn);
    el.mount = function () { pb.mount(); draw(); q.focus({ preventScroll: true }); };
    return el;
  }

  App.page({
    id: "box", order: 2, title: "Чёрные ящики", subtitle: "Бесконечные: каждый раз новое правило. 5 уровней сложности",
    color: "var(--purple)", icon: "⬛", ring: "∞", render: render
  });
})();
