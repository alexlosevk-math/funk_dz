/* ДЗ 1. Функция и график — восемь задач. */
(function () {
  "use strict";
  var h = UI.h, m = UI.m;

  var PAR = function (x) { return (x - 1) * (x - 1) - 3; };

  function render(root) {
    var s1 = UI.section("Часть 1. Функция-машинка", "Подставить, найти x, найти, где машинка ломается.");
    var t1 = h("div", { class: "tasks" });
    t1.appendChild(App.task({
      id: "hw1:t1", level: 1, xp: 10, kind: "number",
      q: "<p>" + m("f(x)=3-x^2") + ". Найди " + m("f(-2)") + ".</p>", answer: -1,
      hints: ["Подставь −2 вместо x. Внимание: (−2)² = 4, а не −4."],
      solution: "f(−2) = 3 − (−2)² = 3 − 4 = −1."
    }));
    t1.appendChild(App.task({
      id: "hw1:t2", level: 1, xp: 10, kind: "number", prefix: "x =",
      q: "<p>" + m("f(x)=4x-3") + ". При каком x выходит " + m("f(x)=9") + "?</p>", answer: 3,
      hints: ["Машинка наоборот: известен выход. Реши уравнение 4x − 3 = 9."],
      solution: "4x − 3 = 9 → 4x = 12 → x = 3. Проверка: 4·3 − 3 = 9 ✓."
    }));
    t1.appendChild(App.task({
      id: "hw1:t3", level: 2, xp: 15, kind: "number", prefix: "x =",
      q: "<p>При каком x функция " + m("f(x)=(x-1)/(2x+6)") + " не определена?</p>", answer: -3,
      hints: ["На ноль делить нельзя. Когда знаменатель 2x + 6 равен нулю?"],
      solution: "2x + 6 = 0 → x = −3. При x = 1 функция определена — она просто равна нулю."
    }));
    t1.appendChild(App.task({
      id: "hw1:t4", level: 2, xp: 15, kind: "choice",
      q: "<p>Функция задана таблицей. Какая формула ей подходит?</p>" +
        '<div class="scroll-x"><table class="vtable" style="margin:8px 0"><tr><th>x</th><td>0</td><td>1</td><td>2</td><td>3</td></tr><tr><th>y</th><td>−1</td><td>1</td><td>3</td><td>5</td></tr></table></div>',
      options: [m("y=x-1"), m("y=x^2-1"), m("y=2x-1"), m("y=2x+1")], answer: 2,
      hints: ["При x = 0 выходит −1. Какие формулы это дают? Проверь их на x = 2."],
      solution: "При x = 0 подходят x − 1, x² − 1 и 2x − 1. При x = 2 нужно 3: x − 1 = 1 ✗, x² − 1 = 3 ✓, 2x − 1 = 3 ✓. При x = 3 нужно 5: x² − 1 = 8 ✗, 2x − 1 = 5 ✓. Ответ y = 2x − 1: y растёт ровно на 2 при каждом шаге x."
    }));
    s1.appendChild(t1);
    root.appendChild(s1);

    var s2 = UI.section("Часть 2. График", "Точка на графике, формула по точке, чтение графика.");
    var t2 = h("div", { class: "tasks" });
    t2.appendChild(App.task({
      id: "hw1:t5", level: 2, xp: 15, kind: "multi",
      q: "<p>Отметь <b>все</b> точки, которые лежат на графике " + m("y=x^2-4") + ".</p>",
      options: ["A(−2; 0)", "B(1; −3)", "C(3; 6)", "D(0; 4)", "E(−3; 5)"], answer: [0, 1, 4],
      hints: ["Подставь x точки в формулу и сравни с её y. У D не перепутай: при x = 0 получится 0² − 4."],
      solution: "A: 4 − 4 = 0 ✓. B: 1 − 4 = −3 ✓. C: 9 − 4 = 5 ≠ 6 ✗. D: 0 − 4 = −4 ≠ 4 ✗. E: 9 − 4 = 5 ✓."
    }));
    t2.appendChild(App.task({
      id: "hw1:t6", level: 2, xp: 15, kind: "number", prefix: "k =",
      q: "<p>График " + m("y=kx+3") + " проходит через точку (2; −1). Найди k.</p>", answer: -2,
      hints: ["Точка лежит на графике — значит, при x = 2 выходит y = −1. Подставь: −1 = k·2 + 3."],
      solution: "−1 = 2k + 3 → 2k = −4 → k = −2."
    }));
    var plot = function (extra) {
      return { x: [-4, 6], y: [-4, 6], unitGrid: true, layers: [{ type: "fn", f: PAR, color: "#d18f00" }].concat(extra || []) };
    };
    t2.appendChild(App.task({
      id: "hw1:t7", level: 1, xp: 10, kind: "number", plot: plot(),
      q: "<p>По графику найди " + m("f(-1)") + ".</p>", answer: 1,
      hints: ["Найди −1 на оси x и поднимись до графика. На какой высоте оказался?"],
      solution: "Над x = −1 график на высоте 1: f(−1) = 1."
    }));
    t2.appendChild(App.task({
      id: "hw1:t8", level: 2, xp: 15, kind: "numbers", plot: plot([{ type: "hline", y: -2, color: "#0a8bd0" }]),
      q: "<p>По тому же графику реши уравнение " + m("f(x)=-2") + ". Найди все корни.</p>", answer: [0, 2],
      hints: ["Голубая прямая — это y = −2. Где она пересекает график? Смотри вниз, на x."],
      solution: "Прямая y = −2 пересекает график при x = 0 и x = 2. Ответ: 0; 2."
    }));
    s2.appendChild(t2);
    root.appendChild(s2);
  }

  App.page({
    id: "hw1", order: 3, title: "ДЗ 1. Функция и график", subtitle: "8 задач по темам 1 и 2: машинка, таблица, точка на графике",
    color: "var(--cyan)", icon: "1", total: 8, render: render
  });
})();
