/* App для сайта с домашкой: страницы, прогресс (localStorage), отчёт для учителя.
   Совместим с UI.task из основного сайта: isDone(id), solve(id, xp), flag(k, v). */
(function () {
  "use strict";
  var KEY = "funkcii9-dz";
  var state = load();

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.done) return s; } catch (e) { /* приватный режим */ }
    return { xp: 0, done: {}, flags: {} };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ничего */ } }

  var pages = [];
  var App = {
    pages: pages,
    page: function (p) { pages.push(p); pages.sort(function (a, b) { return a.order - b.order; }); },
    isDone: function (id) { return !!state.done[id]; },
    flag: function (k, v) { if (v === undefined) return state.flags[k]; state.flags[k] = v; save(); },
    count: function (k, d) { state.flags[k] = (state.flags[k] || 0) + (d === undefined ? 1 : d); save(); return state.flags[k]; },
    xp: function () { return state.xp; },
    addXp: function (n) { state.xp += n; save(); renderHud(); },
    /* Задача из основного UI.task: запоминаем, если ученик открыл «Решение» до ответа */
    task: function (o) {
      var el = UI.task(o);
      el.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest(".task__tools .btn") && /Решение/.test(e.target.textContent) && !state.done[o.id]) state.flags["peek:" + o.id] = 1;
      });
      return el;
    },
    solve: function (id, xp, peeked) {
      if (state.done[id]) return;
      state.done[id] = { t: Date.now(), peek: !!peeked || !!state.flags["peek:" + id] };
      this.addXp(xp);
      var pg = pages.filter(function (p) { return p.total && id.indexOf(p.id + ":") === 0; })[0];
      if (pg) {
        var st = this.stats(pg);
        if (st.done === st.total) UI.toast("⭐ «" + pg.title + "» — всё решено!", "rank");
      }
    },
    stats: function (pg) {
      var ids = Object.keys(state.done).filter(function (k) { return k.indexOf(pg.id + ":") === 0; });
      return { done: Math.min(ids.length, pg.total), total: pg.total, ids: ids };
    },
    peeked: function (id) { return state.done[id] && state.done[id].peek; },
    reset: function () { state = { xp: 0, done: {}, flags: {} }; save(); renderHud(); route(); }
  };
  window.App = App;

  function renderHud() {
    var hud = document.getElementById("hud");
    if (!hud) return;
    hud.innerHTML = "";
    hud.appendChild(UI.h("div", { class: "hud__xp", html: "<b>" + state.xp + "</b> XP" }));
  }

  /* Отчёт: что решено, где подсмотрено решение, сколько ящиков и графиков */
  function report() {
    var lines = ["Домашка «Функции, 9 класс» — " + new Date().toLocaleDateString("ru-RU"), ""];
    pages.forEach(function (p) {
      if (p.total) {
        var st = App.stats(p);
        var peek = st.ids.filter(function (id) { return App.peeked(id); }).length;
        lines.push(p.title + ": " + st.done + " из " + st.total + (peek ? " (в " + peek + " подсмотрено решение)" : ""));
      }
    });
    lines.push("Чёрные ящики: взломано " + (state.flags.boxes || 0) + ", рекорд серии " + (state.flags.boxBest || 0) + ", сдался " + (state.flags.boxGiveUp || 0));
    lines.push("Тренажёр «Опиши график»: описано " + (state.flags.trainDone || 0) + " графиков, из них с первой попытки " + (state.flags.trainClean || 0));
    lines.push("Всего опыта: " + state.xp + " XP");
    return lines.join("\n");
  }

  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    var root = document.getElementById("app");
    root.innerHTML = "";
    window.scrollTo(0, 0);
    if (App._cleanup) { App._cleanup(); App._cleanup = null; }
    var pg = pages.filter(function (p) { return p.id === hash; })[0];
    if (pg) renderPage(root, pg); else renderHome(root);
  }

  function renderHome(root) {
    var h = UI.h;
    document.title = "Домашка · Функции · 9 класс";
    root.appendChild(h("div", { class: "hero hero--dz" },
      h("div", { class: "hero__text" },
        h("h1", { html: "Домашка<br>по функциям" }),
        h("p", { html: "Темы, которые мы прошли: функция-машинка, график и свойства функции. Начни со шпаргалки, потом — домашка. Чёрные ящики и тренажёр бесконечные: в них можно возвращаться сколько угодно." }))));

    var grid = h("div", { class: "map" });
    pages.forEach(function (p) {
      var st = p.total ? App.stats(p) : null, pct = st ? st.done / st.total : 0;
      var ring = st ? h("div", { class: "map__ring", style: "--p:" + pct, title: st.done + " из " + st.total },
        h("span", { text: pct === 1 ? "★" : st.done + "/" + st.total }))
        : h("div", { class: "map__ring map__ring--inf", title: p.counter ? p.counter() : "" }, h("span", { text: p.ring || "∞" }));
      grid.appendChild(h("a", { class: "map__card", href: "#/" + p.id, style: "--c:" + p.color },
        h("div", { class: "map__num", text: p.icon }),
        h("div", { class: "map__body" },
          h("div", { class: "map__title", text: p.title }),
          h("div", { class: "map__sub", text: p.subtitle })),
        ring));
    });
    root.appendChild(grid);

    var out = h("pre", { class: "report", style: "display:none" });
    root.appendChild(h("div", { class: "home__foot" },
      h("button", { class: "btn btn--ghost btn--sm", text: "📋 Отчёт для учителя", onclick: function () {
        var txt = report();
        out.textContent = txt; out.style.display = "";
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { UI.toast("Отчёт скопирован — отправь его учителю"); }, function () {});
      } }),
      " ",
      h("button", { class: "linkbtn", text: "Сбросить прогресс", onclick: function () {
        if (confirm("Точно стереть весь прогресс домашки?")) App.reset();
      } }),
      out));
    root.appendChild(h("p", { class: "home__foot", text: "Прогресс хранится в этом браузере." }));
  }

  function renderPage(root, pg) {
    var h = UI.h;
    document.title = pg.title + " · Домашка";
    root.appendChild(h("div", { class: "page-head", style: "--c:" + pg.color },
      h("a", { class: "back", href: "#/", text: "← Все задания" }),
      h("div", { class: "page-head__row" },
        h("div", { class: "page-head__num", text: pg.icon }),
        h("div", null, h("h1", { text: pg.title }), h("p", { text: pg.subtitle })))));
    var body = h("div", { class: "page" });
    root.appendChild(body);
    var cleanup = pg.render(body);
    UI.mountAll(body);
    if (typeof cleanup === "function") App._cleanup = cleanup;
    var i = pages.indexOf(pg), next = pages[i + 1], prev = pages[i - 1];
    root.appendChild(h("nav", { class: "pager" },
      prev ? h("a", { class: "btn btn--ghost", href: "#/" + prev.id, text: "← " + prev.title }) : h("a", { class: "btn btn--ghost", href: "#/", text: "← Все задания" }),
      next ? h("a", { class: "btn btn--primary", href: "#/" + next.id, text: next.title + " →" }) : h("span")));
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", function () { renderHud(); route(); });
})();
