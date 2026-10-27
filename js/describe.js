/* Describe — «Опиши функцию по графику».
   Describe.analyze(spec) — ответы по свойствам: D, E, нули, знаки, монотонность, max/min.
   Describe.card(spec, opts) — карточка с полями, проверкой и «рентгеном».
   Describe.gen(kind) — случайный график: hills | parabola | line | angle | sqrt | hyper. */
(function () {
  "use strict";
  var h = UI.h, m = UI.m, INF = Infinity, eq = Iv.eq;

  var FIELDS = {
    D: { label: "D(f)", name: "область определения", type: "set",
      tip: "По каким x существует график. Смотри по горизонтали: от самой левой точки графика до самой правой. Есть выколотая точка или разрыв — этот x не входит." },
    E: { label: "E(f)", name: "область значений", type: "set",
      tip: "На каких высотах бывает график. Смотри по вертикали: от самой низкой точки до самой высокой. Уходит вверх бесконечно — пиши +∞." },
    zeros: { label: "f(x) = 0", name: "нули функции", type: "nums",
      tip: "x тех точек, где график пересекает ось x или касается её. Пиши только x, через «;». Нет таких — «нет»." },
    pos: { label: "f(x) > 0", name: "где функция положительна", type: "set",
      tip: "Где график <b>выше</b> оси x. Нули не входят: там f(x) = 0. Несколько кусков соединяй знаком ∪ (или буквой U)." },
    neg: { label: "f(x) < 0", name: "где функция отрицательна", type: "set",
      tip: "Где график <b>ниже</b> оси x. Нули не входят. Несколько кусков соединяй знаком ∪." },
    inc: { label: "↗", name: "возрастает на промежутках", type: "mono",
      tip: "Едем слева направо: где в горку. Пиши промежутками x — от низа подъёма до вершины, скобки у вершин квадратные. Несколько промежутков — через «и», не через ∪." },
    dec: { label: "↘", name: "убывает на промежутках", type: "mono",
      tip: "Едем слева направо: где с горки. Промежутками x, несколько — через «и»." },
    max: { label: "max", name: "наибольшее значение", type: "one",
      tip: "Высота (y) самой высокой точки — не её x! Если график уходит вверх бесконечно, наибольшего значения нет: пиши «нет»." },
    min: { label: "min", name: "наименьшее значение", type: "one",
      tip: "Высота (y) самой низкой точки. Уходит вниз бесконечно — «нет»." }
  };
  var ALL = ["D", "E", "zeros", "pos", "neg", "inc", "dec", "max", "min"];

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function uniq(arr) {
    return arr.slice().sort(function (a, b) { return a - b; })
      .filter(function (v, i, s) { return i === 0 || !eq(v, s[i - 1]); });
  }

  /* ---------- ответы по свойствам ----------
     spec: { f, a, b (по умолчанию ±∞), holes: [x, …] — выколотые точки, crit: [x вершин], zeros: [x],
             over: { E: [...] } — подменить ответ, если общий расчёт не годится (гипербола) } */
  function analyze(spec) {
    var f = spec.f, a = spec.a === undefined ? -INF : spec.a, b = spec.b === undefined ? INF : spec.b;
    var holes = uniq(spec.holes || []);
    var inD = function (x) { return x >= a - 1e-9 && x <= b + 1e-9 && !holes.some(function (p) { return eq(p, x); }); };
    var A = {};

    var cuts = [a].concat(holes, [b]);
    A.D = [];
    for (var i = 0; i < cuts.length - 1; i++) A.D.push({ a: cuts[i], b: cuts[i + 1], ai: i === 0 && isFinite(a), bi: i === cuts.length - 2 && isFinite(b) });

    A.zeros = uniq((spec.zeros || []).filter(inD));
    var isZero = function (x) { return A.zeros.some(function (z) { return eq(z, x); }); };
    function mid(l, r) { return l === -INF ? (r === INF ? 0 : r - 1) : r === INF ? l + 1 : (l + r) / 2; }

    A.pos = []; A.neg = [];
    var bp = uniq([a].concat(A.zeros, holes, [b]));
    for (i = 0; i < bp.length - 1; i++) {
      var l = bp[i], r = bp[i + 1], y = f(mid(l, r));
      var I = { a: l, b: r, ai: eq(l, a) && isFinite(a) && !isZero(l), bi: eq(r, b) && isFinite(b) && !isZero(r) };
      (y > 0 ? A.pos : A.neg).push(I);
    }
    A.pos = Iv.merge(A.pos); A.neg = Iv.merge(A.neg);

    A.inc = []; A.dec = [];
    var crit = (spec.crit || []).filter(function (x) { return x > a && x < b; });
    var isHole = function (x) { return holes.some(function (p) { return eq(p, x); }); };
    bp = uniq([a].concat(crit, holes, [b]));
    for (i = 0; i < bp.length - 1; i++) {
      l = bp[i]; r = bp[i + 1];
      var x1, x2;
      if (l === -INF && r === INF) { x1 = -1; x2 = 1; }
      else if (l === -INF) { x1 = r - 2; x2 = r - 1; }
      else if (r === INF) { x1 = l + 1; x2 = l + 2; }
      else { x1 = l + (r - l) / 3; x2 = l + 2 * (r - l) / 3; }
      I = { a: l, b: r, ai: isFinite(l) && !isHole(l), bi: isFinite(r) && !isHole(r) };
      (f(x2) > f(x1) ? A.inc : A.dec).push(I);
    }

    // E, max, min — по вершинам и закрашенным концам; бесконечные ветви смотрим далеко
    var cands = crit.slice();
    if (isFinite(a)) cands.push(a);
    if (isFinite(b)) cands.push(b);
    var vals = cands.map(f), hi = Math.max.apply(null, vals), lo = Math.min.apply(null, vals);
    if (!vals.length) { hi = -INF; lo = INF; }
    [a === -INF ? -1e4 : null, b === INF ? 1e4 : null].forEach(function (x) {
      if (x === null) return;
      var v = f(x);
      if (v > hi && (v > 50 || !vals.length)) hi = INF;
      if (v < lo && (v < -50 || !vals.length)) lo = -INF;
    });
    A.E = [{ a: lo, b: hi, ai: isFinite(lo), bi: isFinite(hi) }];
    A.max = isFinite(hi) ? hi : null;
    A.min = isFinite(lo) ? lo : null;
    A.argmax = cands.filter(function (x) { return A.max !== null && eq(f(x), A.max); });
    A.argmin = cands.filter(function (x) { return A.min !== null && eq(f(x), A.min); });
    if (spec.over) Object.keys(spec.over).forEach(function (k) { A[k] = spec.over[k]; });
    return A;
  }

  /* ---------- проверка одного поля: true или объяснение ---------- */
  function verdict(k, v, A) {
    var F = FIELDS[k], r;
    if (F.type === "set") {
      r = Iv.parse(v);
      if (r.error) return r.error;
      if (r.byY && k !== "E") return "Здесь ответ — про x, а не про y. Пиши промежуток: [−2; 5) или x < 3";
      var u = r.list;
      if (Iv.sameSet(u, A[k])) return true;
      if (Iv.sameSet(u, A[k], false)) {
        if ((k === "pos" || k === "neg") && A.zeros.some(function (z) { return Iv.contains(u, z); }))
          return "Нули не входят: в них f(x) = 0, а не " + (k === "pos" ? "больше" : "меньше") + " нуля. У нулей скобки круглые";
        return "Почти! Проверь скобки: входят ли концы? Закрашенная точка — [ ], выколотая или бесконечность — ( )";
      }
      if (k === "E" && Iv.sameSet(u, A.D, false)) return "Это D(f) — промежуток по x. А E(f) читают по оси y: от самой низкой высоты до самой высокой";
      if (k === "D" && Iv.sameSet(u, A.E, false)) return "Это высоты, то есть E(f). А D(f) читают по оси x: от самой левой точки до самой правой";
      if (k === "pos" && Iv.sameSet(u, A.neg, false)) return "Перепутал знаки: f(x) > 0 — там, где график выше оси x";
      if (k === "neg" && Iv.sameSet(u, A.pos, false)) return "Перепутал знаки: f(x) < 0 — там, где график ниже оси x";
      if ((k === "pos" || k === "neg") && (Iv.sameSet(u, A.inc, false) || Iv.sameSet(u, A.dec, false)))
        return "Это про горку: где растёт или убывает. А знак — выше или ниже оси x график";
      if (k === "D" && A.D.length > 1 && u.length === 1) return "Посмотри внимательно: есть x, при котором графика нет";
      if (k === "E" && A.E.length === 1 && isFinite(A.E[0].a) && isFinite(A.E[0].b) && u.length === 1 && !isFinite(u[0].b))
        return "График ограничен сверху: выше самой высокой точки он не поднимается. +∞ тут лишняя";
      return "Не то. Нажми «?» — там подсказка, как это искать";
    }
    if (F.type === "mono") {
      r = Iv.parse(v);
      if (r.error) return r.error;
      if (r.byY) return "Промежутки монотонности записывают через x, а не y";
      var other = k === "inc" ? "dec" : "inc";
      if (Iv.sameParts(r.list, A[k])) {
        if (r.list.length > 1 && r.union) return "Промежутки верные, но их не объединяют знаком ∪ — функция " + (k === "inc" ? "растёт" : "убывает") + " на каждом отдельно. Пиши через «и»: " + Iv.text(A[k], " и ");
        return true;
      }
      if (Iv.sameParts(r.list, A[other]) && A[other].length) return "Наоборот: это где функция " + (k === "inc" ? "убывает" : "возрастает") + ". Едем слева направо!";
      if (Iv.sameSet(r.list, A.E, false)) return "Это высоты (y). А промежутки " + (k === "inc" ? "возрастания" : "убывания") + " записывают через x";
      if (Iv.sameSet(r.list, A[k], false) && A[k].length > 1)
        return "Ты склеил промежутки в один. Между ними функция ведёт себя иначе — запиши каждый отдельно через «и»";
      var swapped = r.list.length === A[k].length && r.list.every(function (I) {
        return A[k].some(function (J) { return eq(I.a, J.a) || eq(I.b, J.b); });
      });
      if (swapped) return "Часть концов верная. Проверь каждый промежуток: от низа подъёма до вершины (или наоборот)";
      return "Не то. Едем по графику слева направо и отмечаем, где " + (k === "inc" ? "в горку" : "с горки");
    }
    if (F.type === "nums") {
      r = Iv.parseNums(v);
      if (r.error) return r.error;
      var need = A.zeros;
      if (r.nums.length === need.length && r.nums.every(function (x, i) { return eq(x, need[i]); })) return true;
      if (!need.length) return "График не пересекает и не касается оси x — нулей нет. Так и пиши: «нет»";
      if (r.nums.length < need.length && r.nums.every(function (x) { return need.some(function (z) { return eq(x, z); }); }))
        return "Верно, но не все. Пройди по оси x целиком — может, график ещё где-то её касается";
      if (r.nums.some(function (x) { return !need.some(function (z) { return eq(x, z); }); }) && r.nums.length === need.length)
        return "Не все числа верные. Нули — x точек на оси x (там y = 0)";
      return r.nums.length > need.length ? "Здесь есть лишнее" : "Не то. Нули — x точек, где график на оси x";
    }
    if (F.type === "one") {
      r = Iv.parseOne(v);
      if (r.error) return r.error;
      var ans = A[k], up = k === "max";
      if (ans === null && r.value === null) return true;
      if (ans !== null && r.value !== null && eq(ans, r.value)) return true;
      if (ans === null) return "А есть ли самая " + (up ? "высокая" : "низкая") + " точка? График уходит " + (up ? "вверх" : "вниз") + " бесконечно — " + (up ? "наибольшего" : "наименьшего") + " значения нет. Пиши «нет»";
      if (r.value === null) return "Самая " + (up ? "высокая" : "низкая") + " точка есть. Какая у неё высота y?";
      var args = A[up ? "argmax" : "argmin"];
      if (args.some(function (x) { return eq(x, r.value); }) && !eq(r.value, ans)) return "Это x самой " + (up ? "высокой" : "низкой") + " точки. А значение функции — это её высота y. Главная ловушка!";
      if (A[up ? "min" : "max"] !== null && eq(A[up ? "min" : "max"], r.value)) return "Перепутал: это " + (up ? "наименьшее" : "наибольшее") + " значение";
      return "Не то. Найди самую " + (up ? "высокую" : "низкую") + " точку графика и посмотри на её y";
    }
    return false;
  }

  function answerText(k, A) {
    var F = FIELDS[k];
    if (F.type === "set") return Iv.text(A[k], " ∪ ");
    if (F.type === "mono") return Iv.text(A[k], " и ");
    if (F.type === "nums") return A.zeros.length ? A.zeros.map(function (z) { return UI.fmt(z, 3); }).join("; ") : "нет";
    return A[k] === null ? "нет" : UI.fmt(A[k], 3);
  }

  /* ---------- слои графика ---------- */
  var COL = "#d18f00";
  function baseLayers(spec) {
    var L = [{ type: "fn", f: spec.f, color: COL, width: 3.5, domain: isFinite(spec.a) || isFinite(spec.b) ? [isFinite(spec.a) ? spec.a : -1e3, isFinite(spec.b) ? spec.b : 1e3] : undefined }];
    if (isFinite(spec.a)) L.push({ type: "point", x: spec.a, y: spec.f(spec.a), color: COL, r: 5.5 });
    if (isFinite(spec.b)) L.push({ type: "point", x: spec.b, y: spec.f(spec.b), color: COL, r: 5.5 });
    (spec.dots || []).forEach(function (d) { L.push({ type: "point", x: d[0], y: d[1], color: COL, r: 5.5, open: d[2] }); });
    return L;
  }
  function xrayLayers(spec, A) {
    var f = spec.f, L = [];
    var a = isFinite(spec.a) ? spec.a : -60, b = isFinite(spec.b) ? spec.b : 60;
    L.push({ type: "region", f: f, from: a, to: b, where: function (x, y) { return y > 0; }, color: "rgba(23, 163, 74, 0.25)" });
    L.push({ type: "region", f: f, from: a, to: b, where: function (x, y) { return y < 0; }, color: "rgba(226, 52, 104, 0.22)" });
    L.push({ type: "custom", draw: function (c, P) {
      var x0 = Math.max(a, P.xmin()), x1 = Math.min(b, P.xmax()), n = 700, prev = null;
      c.lineWidth = 9; c.lineCap = "round"; c.globalAlpha = 0.4;
      for (var i = 0; i <= n; i++) {
        var x = x0 + (x1 - x0) * i / n, y = f(x);
        if (isNaN(y) || Math.abs(y) > 40) { prev = null; continue; }
        if (prev) {
          c.strokeStyle = y > prev[1] ? "#17a34a" : "#e23468";
          c.beginPath(); c.moveTo(P.X(prev[0]), P.Y(prev[1])); c.lineTo(P.X(x), P.Y(y)); c.stroke();
        }
        prev = [x, y];
      }
    } });
    return L;
  }
  function xrayPoints(A) {
    var L = [];
    A.zeros.forEach(function (z) { L.push({ type: "point", x: z, y: 0, color: "#0a8bd0", r: 6, label: UI.fmt(z), labelColor: "#0a8bd0", labelDy: 20 }); });
    A.argmax.forEach(function (x) { L.push({ type: "point", x: x, y: A.max, color: "#17a34a", r: 7, label: "max = " + UI.fmt(A.max), labelColor: "#17a34a" }); });
    A.argmin.forEach(function (x) { L.push({ type: "point", x: x, y: A.min, color: "#e23468", r: 7, label: "min = " + UI.fmt(A.min), labelColor: "#e23468", labelDy: 22 }); });
    return L;
  }

  /* Видимая область: x от −8 до 8, по y — сколько нужно, но не больше ±7 */
  function viewOf(spec) {
    if (spec.view) return spec.view;
    var lo = 0, hi = 0;
    for (var x = -8; x <= 8; x += 0.05) {
      if (spec.a !== undefined && x < spec.a) continue;
      if (spec.b !== undefined && x > spec.b) continue;
      var y = spec.f(x);
      if (isNaN(y) || Math.abs(y) > 7) continue;
      lo = Math.min(lo, y); hi = Math.max(hi, y);
    }
    lo = Math.max(-7, Math.floor(lo) - 1.5); hi = Math.min(7, Math.ceil(hi) + 1.5);
    if (hi - lo < 9) { var add = (9 - (hi - lo)) / 2; lo -= add; hi += add; }
    return [[-8.5, 8.5], [lo, hi]];
  }

  /* ---------- карточка ---------- */
  var SYMBOLS = ["[", "]", "(", ")", ";", "−∞", "+∞", "∪", " и ", "нет"];

  function card(spec, o) {
    o = o || {};
    var A = spec.answers || analyze(spec);
    var keys = o.fields || ALL;
    var solved = o.id ? App.isDone(o.id) : false, wrong = 0, peeked = false, xrayOn = false, lastInput = null;
    var el = h("div", { class: "task desc" + (solved ? " is-solved" : "") });
    el.appendChild(h("div", { class: "task__head" },
      h("span", { class: "task__badge", text: o.badge || "Опиши функцию" }),
      o.level ? h("span", { class: "task__lvl", text: "★★★".slice(0, o.level) + "☆☆☆".slice(o.level) }) : null,
      o.xp ? h("span", { class: "task__xp", text: "+" + o.xp + " XP" }) : null));
    el.appendChild(h("div", { class: "task__q", html: o.q || ("<p>" + (spec.formula ? "Функция " + m("y=" + spec.formula) + ". " : "Функция задана графиком. ") + "Опиши её свойства.</p>") }));

    var view = viewOf(spec);
    var pb = UI.plotBox({ x: view[0], y: view[1], unitGrid: true });
    var base = baseLayers(spec);
    function draw() {
      if (!pb.plot) return;
      pb.plot.layers = xrayOn ? xrayLayers(spec, A).concat(base, xrayPoints(A)) : base;
      pb.plot.draw();
    }

    var saved = o.id ? App.flag("ans:" + o.id) : null;
    var rows = {}, form = h("div", { class: "desc__rows" });
    keys.forEach(function (k) {
      var F = FIELDS[k];
      var inp = h("input", { class: "task__input desc__input", type: "text", autocomplete: "off", spellcheck: "false",
        placeholder: F.type === "set" ? "например, [−2; 5) ∪ (6; +∞)" : F.type === "mono" ? "например, [−7; −5] и [−1; 3]" : F.type === "nums" ? "например, −3; 1 или «нет»" : "число или «нет»",
        onfocus: function () { lastInput = inp; },
        onkeydown: function (e) { if (e.key === "Enter") check(); },
        oninput: function () { row.classList.remove("is-ok", "is-bad"); msg.innerHTML = ""; } });
      if (saved && saved[k] !== undefined) inp.value = saved[k];
      var msg = h("div", { class: "desc__msg" });
      var tip = h("div", { class: "desc__tip", html: F.tip, style: "display:none" });
      var row = h("div", { class: "desc__row" },
        h("div", { class: "desc__label" }, h("span", { class: "m", text: F.label }), h("small", { text: F.name })),
        h("div", { class: "desc__field" }, inp,
          h("button", { class: "desc__q", type: "button", title: "Как это искать", text: "?", onclick: function () {
            tip.style.display = tip.style.display ? "" : "none";
          } })),
        h("div", { class: "desc__status" }), tip, msg);
      rows[k] = { row: row, inp: inp, msg: msg };
      form.appendChild(row);
    });

    var symbols = h("div", { class: "desc__symbols" }, h("span", { class: "muted", text: "Вставить:" }),
      SYMBOLS.map(function (s) {
        return h("button", { class: "chip chip--sym", type: "button", text: s.trim(), onmousedown: function (e) { e.preventDefault(); }, onclick: function () {
          var t = lastInput || rows[keys[0]].inp;
          var st = t.selectionStart === null ? t.value.length : t.selectionStart, en = t.selectionEnd === null ? st : t.selectionEnd;
          t.value = t.value.slice(0, st) + s + t.value.slice(en);
          t.focus(); t.selectionStart = t.selectionEnd = st + s.length;
          t.dispatchEvent(new Event("input"));
        } });
      }));

    var fb = h("div", { class: "task__fb" });
    var xrayBtn = h("button", { class: "btn btn--ghost", text: "🩻 Рентген графика", style: solved ? "" : "display:none", onclick: function () {
      xrayOn = !xrayOn; xrayBtn.classList.toggle("is-on", xrayOn); draw();
    } });
    var showBtn = h("button", { class: "btn btn--ghost", text: "👀 Показать ответы", style: "display:none", onclick: reveal });
    var btns = h("div", { class: "task__row" }, h("button", { class: "btn btn--primary", text: "Проверить", onclick: check }), showBtn, xrayBtn, o.extraBtn || null);

    el.appendChild(h("div", { class: "desc__grid" }, pb.el, h("div", { class: "desc__side" }, form, symbols)));
    el.appendChild(btns);
    el.appendChild(fb);
    if (solved) fb.innerHTML = '<span class="ok">✓ Уже решено. Можно пройти ещё раз для тренировки</span>';

    function check() {
      var bad = 0, empty = 0, values = {};
      keys.forEach(function (k) {
        var R = rows[k], v = R.inp.value;
        values[k] = v;
        R.row.classList.remove("is-ok", "is-bad");
        if (!v.trim()) { empty++; R.msg.innerHTML = ""; return; }
        var res = verdict(k, v, A);
        if (res === true) { R.row.classList.add("is-ok"); R.msg.innerHTML = ""; }
        else { bad++; R.row.classList.add("is-bad"); R.msg.innerHTML = res || "Не то"; }
      });
      el.classList.remove("shake");
      if (!bad && !empty) {
        fb.innerHTML = '<span class="ok">' + UI.pick(["Функция описана полностью! 🔥", "Идеальное описание 🎯", "Всё верно — красота!", "Чётко, как в учебнике!"]) + "</span>" +
          '<div class="task__after">Включи «Рентген», чтобы увидеть все свойства на графике.</div>';
        el.classList.add("is-solved");
        xrayBtn.style.display = "";
        if (o.id) {
          App.flag("ans:" + o.id, values);
          if (!solved) { App.solve(o.id, peeked ? Math.ceil(o.xp / 2) : o.xp, peeked); UI.confetti(btns); }
        } else if (o.xp && !solved) { App.addXp(peeked ? Math.ceil(o.xp / 2) : o.xp); UI.confetti(btns); }
        if (!solved && o.onSolve) o.onSolve(!wrong && !peeked);
        solved = true;
        return;
      }
      if (bad) wrong++;
      void el.offsetWidth; if (bad) el.classList.add("shake");
      fb.innerHTML = '<span class="bad">' + (bad ? "Ошибок: " + bad + (empty ? ", пустых полей: " + empty : "") + ". Красные поля — посмотри пояснение под ними" : "Заполни все поля: пустых — " + empty) + "</span>";
      if (wrong >= 2 && !peeked) showBtn.style.display = "";
    }

    function reveal() {
      peeked = true;
      showBtn.remove();
      keys.forEach(function (k) {
        var R = rows[k];
        R.row.appendChild(h("div", { class: "desc__ans", html: "Ответ: <b>" + answerText(k, A) + "</b>" }));
      });
      xrayBtn.style.display = "";
      fb.innerHTML = '<span class="muted">Сверь свои ответы, исправь и нажми «Проверить» — опыта будет вдвое меньше, но засчитается.</span>';
    }

    el.mount = el._mount = function () { pb.mount(); draw(); };
    el.answers = A;
    return el;
  }

  /* ---------- генераторы случайных графиков ---------- */

  /* Монотонный кубический сплайн (Фриче — Карлсон): вершины ровно в узлах, между узлами без лишних горбов */
  function spline(xs, ys) {
    var n = xs.length, d = [], s = [], k;
    for (k = 0; k < n - 1; k++) d[k] = (ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]);
    s[0] = d[0]; s[n - 1] = d[n - 2];
    for (k = 1; k < n - 1; k++) s[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
    for (k = 0; k < n - 1; k++) {
      if (d[k] === 0) { s[k] = s[k + 1] = 0; continue; }
      var al = s[k] / d[k], be = s[k + 1] / d[k], q = al * al + be * be;
      if (q > 9) { var t = 3 / Math.sqrt(q); s[k] = t * al * d[k]; s[k + 1] = t * be * d[k]; }
    }
    return function (x) {
      if (x < xs[0] - 1e-9 || x > xs[n - 1] + 1e-9) return NaN;
      for (var i = 0; i < n - 1; i++) {
        if (x <= xs[i + 1] + 1e-9) {
          var hh = xs[i + 1] - xs[i], u = (x - xs[i]) / hh, u2 = u * u, u3 = u2 * u;
          return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * hh * s[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * hh * s[i + 1];
        }
      }
      return NaN;
    };
  }

  /* «Горки» на отрезке: вершины и нули в целых точках */
  function genHills() {
    for (var tries = 0; tries < 500; tries++) {
      var xs = [ri(-7, -5)];
      for (;;) { var nx = xs[xs.length - 1] + ri(2, 4); if (nx > 7) break; xs.push(nx); }
      if (xs.length < 4 || xs.length > 6) continue;
      var ys = [ri(-4, 4)], up = Math.random() < 0.5, ok = true, i;
      for (i = 1; i < xs.length; i++) {
        var p = ys[i - 1];
        if (up) { if (p + 2 > 4) { ok = false; break; } ys.push(ri(p + 2, 4)); }
        else { if (p - 2 < -4) { ok = false; break; } ys.push(ri(-4, p - 2)); }
        up = !up;
      }
      if (!ok || Math.max.apply(null, ys) <= 0 || Math.min.apply(null, ys) >= 0) continue;
      var NX = [], NY = [], crit = [];
      for (i = 0; i < xs.length; i++) {
        NX.push(xs[i]); NY.push(ys[i]);
        if (i > 0 && i < xs.length - 1) crit.push(xs[i]);
        if (i < xs.length - 1 && ys[i] * ys[i + 1] < 0) {
          var gap = xs[i + 1] - xs[i];
          var z = Math.round(xs[i] + gap * Math.abs(ys[i]) / (Math.abs(ys[i]) + Math.abs(ys[i + 1])));
          NX.push(Math.max(xs[i] + 1, Math.min(xs[i + 1] - 1, z))); NY.push(0);
        }
      }
      return {
        kind: "hills", f: spline(NX, NY), a: xs[0], b: xs[xs.length - 1], crit: crit,
        zeros: NX.filter(function (x, j) { return NY[j] === 0; }),
        view: [[-8.5, 8.5], [-5.5, 5.5]]
      };
    }
    return null;
  }

  function sgn() { return Math.random() < 0.5 ? -1 : 1; }
  function num(v) { return UI.fmt(v, 3).replace("−", "-").replace(",", "."); }
  /* k·(что-то): 1 → "", −1 → "-", 0.5 → "0.5" */
  function coef(k) { return k === 1 ? "" : k === -1 ? "-" : num(k); }
  function plus(v) { return v === 0 ? "" : v > 0 ? "+" + num(v) : num(v); }
  function shift(p) { return p === 0 ? "x" : "(x" + plus(-p) + ")"; }
  /* Отрезок вокруг точки p, чтобы на концах |f| ≤ 6 */
  function segment(f, p, maxOff) {
    for (var t = 0; t < 30; t++) {
      var l = p - ri(1, maxOff), r = p + ri(1, maxOff);
      if (l < -7 || r > 7) continue;
      if (Math.abs(f(l)) <= 6 && Math.abs(f(r)) <= 6 && !eq(f(l), f(r))) return [l, r];
    }
    return null;
  }

  function genParabola() {
    var c = UI.pick([[1, 1], [1, 2], [2, 1], [0.5, 2], [0.5, 3]]), a = c[0] * sgn(), d = c[1];
    var mode = Math.random(), p = ri(-3, 3), q, zeros;
    if (mode < 0.65) { q = -a * d * d; zeros = [p - d, p + d]; }
    else if (mode < 0.85) { q = Math.sign(a) * ri(1, 3); zeros = []; }
    else { q = 0; zeros = [p]; }
    var f = function (x) { return a * (x - p) * (x - p) + q; };
    var spec = { kind: "parabola", f: f, crit: [p], zeros: zeros, formula: coef(a) + (p === 0 ? "x^2" : shift(p) + "^2") + plus(q) };
    if (Math.random() < 0.4) { var s = segment(f, p, 4); if (s) { spec.a = s[0]; spec.b = s[1]; } }
    return spec;
  }

  function genLine() {
    var k = UI.pick([1, -1, 2, -2, 0.5, -0.5, 3, -3]), z = ri(-4, 4), b = -k * z;
    var f = function (x) { return k * x + b; };
    var spec = { kind: "line", f: f, crit: [], zeros: [z], formula: (k === 1 ? "x" : k === -1 ? "-x" : num(k) + "x") + plus(b) };
    if (Math.random() < 0.45) { var s = segment(f, z + sgn(), 5); if (s) { spec.a = s[0]; spec.b = s[1]; } }
    return spec;
  }

  function genAngle() {
    var s = sgn(), p = ri(-3, 3), q = ri(-3, 3), zeros;
    if (q === 0) zeros = [p];
    else if (Math.sign(q) === -s) zeros = [p - Math.abs(q), p + Math.abs(q)];
    else zeros = [];
    var f = function (x) { return s * Math.abs(x - p) + q; };
    var spec = { kind: "angle", f: f, crit: [p], zeros: zeros, formula: (s < 0 ? "-" : "") + "|x" + plus(-p) + "|" + plus(q) };
    if (Math.random() < 0.4) { var seg = segment(f, p, 5); if (seg) { spec.a = seg[0]; spec.b = seg[1]; } }
    return spec;
  }

  function genSqrt() {
    var s = sgn(), dir = sgn(), p = ri(-4, 3), q = UI.pick([-2, -1, 0, 1, 2]), zeros;
    if (q === 0) zeros = [p];
    else if (q * s < 0) zeros = [p + dir * q * q];
    else zeros = [];
    var f = function (x) { var u = dir * (x - p); return u < 0 ? NaN : s * Math.sqrt(u) + q; };
    var inner = dir > 0 ? (p === 0 ? "x" : "x" + plus(-p)) : (p === 0 ? "-x" : num(p) + "-x");
    var spec = { kind: "sqrt", f: f, crit: [], zeros: zeros, formula: (s < 0 ? "-" : "") + "sqrt(" + inner + ")" + plus(q) };
    if (dir > 0) spec.a = p; else spec.b = p;
    return spec;
  }

  function genHyper() {
    for (var t = 0; t < 50; t++) {
      var k = UI.pick([2, 3, 4, 6]) * sgn(), p = ri(-3, 3), q = UI.pick([0, 0, 1, -1, 2, -2]);
      if (q && k % q) continue;
      var z = q ? p - k / q : null;
      if (z !== null && Math.abs(z) > 7) continue;
      var f = function (x) { return eq(x, p) ? NaN : k / (x - p) + q; };
      return {
        kind: "hyper", f: f, holes: [p], crit: [], zeros: z === null ? [] : [z],
        formula: num(k) + "/" + (p === 0 ? "x" : shift(p)) + plus(q),
        over: { E: [{ a: -INF, b: q, ai: false, bi: false }, { a: q, b: INF, ai: false, bi: false }], max: null, min: null, argmax: [], argmin: [] },
        view: [[-8.5, 8.5], [q - 6, q + 6]]
      };
    }
    return genParabola();
  }

  var GENS = { hills: genHills, parabola: genParabola, line: genLine, angle: genAngle, sqrt: genSqrt, hyper: genHyper };
  var MIX = ["hills", "hills", "hills", "parabola", "parabola", "line", "angle", "angle", "sqrt", "hyper"];
  function gen(kind) { return GENS[kind === "mix" || !GENS[kind] ? UI.pick(MIX) : kind](); }

  window.Describe = { FIELDS: FIELDS, ALL: ALL, analyze: analyze, verdict: verdict, answerText: answerText, card: card, gen: gen, spline: spline };
})();
