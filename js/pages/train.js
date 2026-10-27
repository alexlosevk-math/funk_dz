/* Тренажёр «Опиши график»: бесконечные случайные функции. */
(function () {
  "use strict";
  var h = UI.h;

  var KINDS = [["mix", "Микс"], ["hills", "Горки"], ["parabola", "Парабола"], ["line", "Прямая"], ["angle", "Уголок |x|"], ["sqrt", "Корень"], ["hyper", "Гипербола"]];
  var SETS = [
    ["all", "Все свойства", Describe.ALL],
    ["de", "D и E", ["D", "E"]],
    ["sign", "Нули и знаки", ["zeros", "pos", "neg"]],
    ["mono", "Рост, спад, max и min", ["inc", "dec", "max", "min"]]
  ];

  function chips(list, cur, onPick) {
    var box = h("div", { class: "btns" });
    list.forEach(function (it) {
      var c = h("button", { class: "chip" + (it[0] === cur ? " is-on" : ""), text: it[1], onclick: function () {
        Array.prototype.forEach.call(box.children, function (x) { x.classList.remove("is-on"); });
        c.classList.add("is-on"); onPick(it[0]);
      } });
      box.appendChild(c);
    });
    return box;
  }

  function render(root) {
    var kind = App.flag("trainKind") || "mix", set = App.flag("trainSet") || "all";
    var sec = UI.section("Опиши график", "Каждый раз новая функция. Выбери, какие графики попадаются и какие свойства описывать.");
    sec.appendChild(h("div", { class: "train__opts" },
      h("div", null, h("div", { class: "train__lbl", text: "Графики" }), chips(KINDS, kind, function (k) { kind = k; App.flag("trainKind", k); next(); })),
      h("div", null, h("div", { class: "train__lbl", text: "Свойства" }), chips(SETS, set, function (k) { set = k; App.flag("trainSet", k); next(); }))));
    var stats = h("div", { class: "stats" });
    function upd() {
      stats.innerHTML = "";
      [["Описано графиков", App.flag("trainDone") || 0], ["С первой попытки", App.flag("trainClean") || 0]]
        .forEach(function (s) { stats.appendChild(h("div", { class: "stat", html: s[0] + ": <b>" + s[1] + "</b>" })); });
    }
    upd();
    sec.appendChild(stats);
    var holder = h("div");
    sec.appendChild(holder);
    root.appendChild(sec);

    function next() {
      var spec = Describe.gen(kind), fields = SETS.filter(function (s) { return s[0] === set; })[0][2];
      var nb = h("button", { class: "btn btn--ghost", text: "🎲 Другой график", onclick: next });
      var card = Describe.card(spec, {
        fields: fields, xp: fields.length > 4 ? 15 : 8, badge: "Случайный график",
        extraBtn: nb,
        onSolve: function (clean) {
          App.count("trainDone"); if (clean) App.count("trainClean"); upd();
          nb.textContent = "Следующий график →"; nb.className = "btn btn--primary";
        }
      });
      holder.innerHTML = "";
      holder.appendChild(card);
      card.mount();
    }
    UI.later(next);
  }

  App.page({
    id: "train", order: 5, title: "Тренажёр «Опиши график»", subtitle: "Бесконечные случайные графики: горки, параболы, уголки, корни, гиперболы",
    color: "var(--pink)", icon: "🎲", ring: "∞", render: render
  });
})();
