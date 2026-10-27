/* Iv — промежутки: разбор ответа ученика, сравнение, красивая запись.
   Промежуток: { a, b, ai, bi } — концы и входят ли они (ai/bi = true для «[» и «]»).
   Iv.parse("[−7; −5) и x > 3") → { list: [...], union: false }
   Понимает: (a; b], (−∞; 3), x < 3, −2 ≤ x < 5, x ≠ 0, «все числа», «нет», ∪ / U / и / или. */
(function () {
  "use strict";
  var INF = Infinity, EPS = 1e-6;

  var EMPTY = /^(нет|нету|∅|пусто|пустое множество|никогда|не существует|таких нет|-|—)$/;
  var ALL = /^(все|все числа|все x|любое|любое число|любые|любые числа|r|ℝ|вся прямая|x\s*-\s*любое)$/;

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[−–—]/g, "-").replace(/ё/g, "е").replace(/х/g, "x")
      .replace(/бесконечность|infinity|inf|∞/g, "∞")
      .replace(/\+\s*∞/g, "∞").replace(/-\s*∞/g, "-∞")
      .replace(/<=|=</g, "≤").replace(/>=|=>/g, "≥").replace(/!=|<>|=\/=/g, "≠")
      .replace(/\s+/g, " ").trim();
  }

  function num(s) {
    s = s.trim();
    if (s === "∞") return INF;
    if (s === "-∞") return -INF;
    return UI.parseNumber(s);
  }

  function eq(a, b) { return a === b || Math.abs(a - b) < EPS; }

  /* Разрезать по «и», «∪», запятым и «;» вне скобок */
  function split(s) {
    var parts = [], depth = 0, cur = "";
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === "(" || c === "[") depth++;
      if (c === ")" || c === "]") depth--;
      // запятая между цифрами — десятичная: x < 0,5
      var decimal = c === "," && /\d/.test(s[i - 1] || "") && /\d/.test(s[i + 1] || "");
      if (depth <= 0 && (c === "&" || c === "∪" || c === ";" || (c === "," && !decimal))) {
        parts.push(cur); cur = ""; depth = 0; continue;
      }
      cur += c;
    }
    parts.push(cur);
    return parts.map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function piece(p) {
    var raw = p;
    p = p.replace(/\s+/g, "");
    if (/^[([]/.test(p) && /[)\]]$/.test(p)) {
      var inner = p.slice(1, -1);
      var bits = inner.indexOf(";") >= 0 ? inner.split(";") : inner.split(",");
      if (bits.length !== 2) return { error: "Внутри скобок нужны два числа через «;», например [−2; 5)" };
      var a = num(bits[0]), b = num(bits[1]);
      if (isNaN(a) || isNaN(b)) return { error: "Не понял числа в «" + raw + "»" };
      var ai = p[0] === "[", bi = p[p.length - 1] === "]";
      if ((a === -INF && ai) || (b === INF && bi)) return { error: "У бесконечности скобка всегда круглая: (−∞ и +∞)" };
      if (a === INF || b === -INF) return { error: "В «" + raw + "» бесконечность не с той стороны: слева −∞, справа +∞" };
      if (a > b || eq(a, b)) return { error: "В «" + raw + "» левый конец должен быть меньше правого" };
      return { list: [{ a: a, b: b, ai: ai, bi: bi }] };
    }
    var m;
    if ((m = p.match(/^(.+?)(<|≤)x(<|≤)(.+)$/))) {
      var lo = num(m[1]), hi = num(m[4]);
      if (isNaN(lo) || isNaN(hi) || lo >= hi) return { error: "Не понял «" + raw + "»" };
      return { list: [{ a: lo, b: hi, ai: m[2] === "≤", bi: m[3] === "≤" }] };
    }
    if ((m = p.match(/^x(<|≤|>|≥|≠)(.+)$/)) || (m = p.match(/^(.+?)(<|≤|>|≥)x$/))) {
      var left = p[0] === "x", op = left ? m[1] : m[2], v = num(left ? m[2] : m[1]);
      if (isNaN(v) || !isFinite(v)) return { error: "Не понял число в «" + raw + "»" };
      if (!left) op = { "<": ">", "≤": "≥", ">": "<", "≥": "≤" }[op];
      if (op === "≠") return { list: [{ a: -INF, b: v, ai: false, bi: false }, { a: v, b: INF, ai: false, bi: false }] };
      if (op === "<" || op === "≤") return { list: [{ a: -INF, b: v, ai: false, bi: op === "≤" }] };
      return { list: [{ a: v, b: INF, ai: op === "≥", bi: false }] };
    }
    if (/^-?[\d.,/]+$/.test(p)) return { error: "Одно число — это точка, а нужен промежуток. Например, [−2; 5)" };
    return { error: "Не понял «" + raw + "». Пиши промежуток: [−2; 5), (−∞; 3) или x < 3" };
  }

  function parse(src) {
    var s = norm(src);
    if (!s) return { error: "Пусто. Если таких x нет — напиши «нет»" };
    if (EMPTY.test(s)) return { list: [], union: false };
    if (ALL.test(s)) return { list: [{ a: -INF, b: INF, ai: false, bi: false }], union: false };
    // для E(f) естественно писать через y: y ≥ −4
    var byY = /(^|[^a-z])y([^a-z]|$)/.test(s);
    if (byY) s = s.replace(/y/g, "x");
    var union = /∪|[)\]]\s*u\s*[([]|\su\s/.test(s);
    s = s.replace(/([)\]])\s*u\s*([([])/g, "$1∪$2").replace(/\su\s/g, " ∪ ")
      .replace(/([)\]\d∞])\s*(и|или)\s*/g, "$1&").replace(/\s(и|или)\s/g, "&");
    var parts = split(s), list = [];
    for (var i = 0; i < parts.length; i++) {
      var r = piece(parts[i]);
      if (r.error) return r;
      list = list.concat(r.list);
    }
    return { list: list, union: union, byY: byY };
  }

  /* Объединить пересекающиеся и стыкующиеся куски (для множеств: D, E, знаки) */
  function merge(list) {
    var L = list.map(function (I) { return { a: I.a, b: I.b, ai: I.ai, bi: I.bi }; })
      .sort(function (x, y) { return x.a - y.a || (y.ai - x.ai); });
    var out = [];
    L.forEach(function (I) {
      var last = out[out.length - 1];
      if (last && (I.a < last.b - EPS || (eq(I.a, last.b) && (last.bi || I.ai)))) {
        if (I.b > last.b + EPS) { last.b = I.b; last.bi = I.bi; }
        else if (eq(I.b, last.b)) last.bi = last.bi || I.bi;
      } else out.push(I);
    });
    return out;
  }

  function sameEnds(x, y, brackets) {
    return eq(x.a, y.a) && eq(x.b, y.b) &&
      (!brackets || ((!isFinite(x.a) || x.ai === y.ai) && (!isFinite(x.b) || x.bi === y.bi)));
  }
  function sameList(u, v, brackets) {
    if (u.length !== v.length) return false;
    for (var i = 0; i < u.length; i++) if (!sameEnds(u[i], v[i], brackets)) return false;
    return true;
  }
  /* Как множества: [1; 2] ∪ [2; 3] = [1; 3] */
  function sameSet(u, v, brackets) { return sameList(merge(u), merge(v), brackets !== false); }
  /* Как список отдельных промежутков (монотонность): скобки на концах не важны */
  function sameParts(u, v) {
    var s = function (L) { return L.slice().sort(function (x, y) { return x.a - y.a; }); };
    return sameList(s(u), s(v), false);
  }
  function contains(list, x) {
    return list.some(function (I) {
      return (x > I.a + EPS && x < I.b - EPS) || (eq(x, I.a) && I.ai) || (eq(x, I.b) && I.bi);
    });
  }

  function fnum(v) { return v === INF ? "+∞" : v === -INF ? "−∞" : UI.fmt(v, 3); }
  function one(I) { return (I.ai ? "[" : "(") + fnum(I.a) + "; " + fnum(I.b) + (I.bi ? "]" : ")"); }
  /* Запись ответа. sep: " ∪ " для множеств, " и " для промежутков монотонности */
  function text(list, sep) {
    if (!list.length) return "нет";
    if (list.length === 1 && list[0].a === -INF && list[0].b === INF) return "(−∞; +∞)";
    return list.map(one).join(sep || " ∪ ");
  }

  /* Список чисел: «−6; −3; 1», «−6 и 1», «нет» */
  function parseNums(src) {
    var s = norm(src);
    if (!s) return { error: "Пусто. Если нулей нет — напиши «нет»" };
    if (EMPTY.test(s)) return { nums: [] };
    if (/[([]/.test(s) && /;/.test(s)) return { error: "Нули — это только x. Без скобок и y: например, −6; 1" };
    if (/x\s*=/.test(s)) s = s.replace(/x\s*=/g, " ");
    var parts = s.split(/;|\sи\s|,\s+|\s+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var nums = parts.map(num);
    if (nums.some(function (v) { return isNaN(v) || !isFinite(v); })) return { error: "Напиши числа через точку с запятой: −6; 1" };
    return { nums: nums.filter(function (v, i) { return nums.findIndex(function (w) { return eq(v, w); }) === i; }).sort(function (a, b) { return a - b; }) };
  }

  /* Одно число или «нет» */
  function parseOne(src) {
    var s = norm(src);
    if (!s) return { error: "Пусто. Если такого значения нет — напиши «нет»" };
    if (EMPTY.test(s)) return { value: null };
    s = s.replace(/^y\s*=\s*/, "");
    if (/[([]/.test(s)) return { error: "Здесь нужно одно число (или «нет»), а не точка и не промежуток" };
    var v = num(s);
    if (isNaN(v) || !isFinite(v)) return { error: "Нужно одно число или «нет»" };
    return { value: v };
  }

  window.Iv = {
    INF: INF, eq: eq, parse: parse, merge: merge, sameSet: sameSet, sameParts: sameParts,
    contains: contains, text: text, one: one, fnum: fnum, parseNums: parseNums, parseOne: parseOne
  };
})();
