// Spark Power Tools: engineering tools (logic lab, electronics, sorting visualizer).
(function () {
  "use strict";
  const { h, load, save, fmt, copy } = window.SparkUI;
  const reg = (t) => window.SparkTools.push(t);
  const card = (...kids) => h("div", { class: "lab-card" }, kids);
  const row = (...kids) => h("div", { class: "lab-row" }, kids);

  // =====================================================================
  //  1. LOGIC LAB: truth table, Karnaugh map, Quine-McCluskey minimizer
  // =====================================================================
  function tokenizeBool(src) {
    const s = String(src).replace(/\bNAND\b/gi, " @ ").replace(/\bNOR\b/gi, " # ").replace(/\bXNOR\b/gi, " $ ").replace(/\bXOR\b/gi, " ^ ").replace(/\bAND\b/gi, " & ").replace(/\bOR\b/gi, " | ").replace(/\bNOT\b/gi, " ~ ")
      .replace(/⊕/g, "^").replace(/·|\*|\./g, "&").replace(/\+/g, "|").replace(/!/g, "~").replace(/¬/g, "~").replace(/∧/g, "&").replace(/∨/g, "|");
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[A-Za-z]/.test(c)) { out.push({ t: "var", v: c.toUpperCase() }); i++; continue; }
      if (c === "0" || c === "1") { out.push({ t: "const", v: +c }); i++; continue; }
      if ("&|^~'()@#$".includes(c)) { out.push({ t: c }); i++; continue; }
      throw new Error("Unexpected “" + c + "”");
    }
    return out;
  }
  // grammar: or := xor ('|' xor)* ; xor := and ('^' and)* ; and := not (('&'|implicit|'@'|'#'|'$') not)* ; not := '~' not | atom ("'")*
  function parseBool(src) {
    const toks = tokenizeBool(src); let p = 0; const vars = new Set();
    const peek = () => toks[p], next = () => toks[p++];
    const starts = (t) => t && (t.t === "var" || t.t === "const" || t.t === "(" || t.t === "~");
    function or() { let l = xor(); while (peek() && peek().t === "|") { next(); const r = xor(), a = l; l = (e) => a(e) | r(e); } return l; }
    function xor() { let l = and(); while (peek() && peek().t === "^") { next(); const r = and(), a = l; l = (e) => a(e) ^ r(e); } return l; }
    function and() {
      let l = not();
      for (;;) {
        const t = peek();
        if (t && t.t === "&") { next(); const r = not(), a = l; l = (e) => a(e) & r(e); }
        else if (t && t.t === "@") { next(); const r = not(), a = l; l = (e) => 1 - (a(e) & r(e)); }
        else if (t && t.t === "#") { next(); const r = not(), a = l; l = (e) => 1 - (a(e) | r(e)); }
        else if (t && t.t === "$") { next(); const r = not(), a = l; l = (e) => 1 - (a(e) ^ r(e)); }
        else if (starts(t)) { const r = not(), a = l; l = (e) => a(e) & r(e); }
        else break;
      }
      return l;
    }
    function not() { if (peek() && peek().t === "~") { next(); const r = not(); return (e) => 1 - r(e); } return atom(); }
    function atom() {
      const t = next(); if (!t) throw new Error("Incomplete expression");
      let v;
      if (t.t === "var") { vars.add(t.v); const n = t.v; v = (e) => e[n]; }
      else if (t.t === "const") { const k = t.v; v = () => k; }
      else if (t.t === "(") { v = or(); if (!peek() || peek().t !== ")") throw new Error("Missing )"); next(); }
      else throw new Error("Unexpected “" + t.t + "”");
      while (peek() && peek().t === "'") { next(); const a = v; v = (e) => 1 - a(e); }
      return v;
    }
    if (!toks.length) throw new Error("Type a Boolean expression");
    const f = or(); if (p < toks.length) throw new Error("Unexpected “" + toks[p].t + "”");
    return { f, vars: [...vars].sort() };
  }

  // ---- Quine-McCluskey ----
  const ones = (s) => [...s].filter((c) => c === "1").length;
  function qm(n, minterms, dontcares) {
    const bin = (m) => m.toString(2).padStart(n, "0");
    let terms = [...new Set([...minterms, ...dontcares])].map(bin), primes = [];
    while (terms.length) {
      const used = new Set(), next = new Set();
      for (let i = 0; i < terms.length; i++) for (let j = i + 1; j < terms.length; j++) {
        let diff = -1, ok = true;
        for (let k = 0; k < n; k++) if (terms[i][k] !== terms[j][k]) { if (terms[i][k] === "-" || terms[j][k] === "-" || diff >= 0) { ok = false; break; } diff = k; }
        if (ok && diff >= 0) { next.add(terms[i].slice(0, diff) + "-" + terms[i].slice(diff + 1)); used.add(terms[i]); used.add(terms[j]); }
      }
      terms.forEach((t) => { if (!used.has(t)) primes.push(t); });
      terms = [...next];
    }
    primes = [...new Set(primes)];
    const covers = (imp, m) => [...imp].every((c, k) => c === "-" || c === bin(m)[k]);
    const need = minterms.slice();
    if (!need.length) return [];
    const table = primes.map((p) => need.filter((m) => covers(p, m)));
    const chosen = new Set(); let left = new Set(need);
    need.forEach((m) => { const cand = primes.map((p, i) => (table[i].includes(m) ? i : -1)).filter((i) => i >= 0); if (cand.length === 1) chosen.add(cand[0]); });
    chosen.forEach((i) => table[i].forEach((m) => left.delete(m)));
    if (left.size) {
      // Petrick's method (small) with a greedy fallback
      let prod = [new Set()]; const lits = (i) => [...primes[i]].filter((c) => c !== "-").length;
      let ok = primes.length <= 24;
      if (ok) {
        for (const m of left) {
          const cand = primes.map((p, i) => (table[i].includes(m) ? i : -1)).filter((i) => i >= 0), nextProd = [];
          for (const a of prod) for (const c of cand) { const s = new Set(a); s.add(c); nextProd.push(s); }
          nextProd.sort((x, y) => x.size - y.size); prod = nextProd.filter((s, i) => !nextProd.slice(0, i).some((q) => [...q].every((v) => s.has(v)))).slice(0, 400);
        }
        let best = null, bc = Infinity; for (const s of prod) { const c = s.size * 100 + [...s].reduce((t, i) => t + lits(i), 0); if (c < bc) { bc = c; best = s; } }
        if (best) best.forEach((i) => chosen.add(i));
      } else {
        while (left.size) { let bi = -1, bn = 0; primes.forEach((p, i) => { const k = table[i].filter((m) => left.has(m)).length; if (k > bn) { bn = k; bi = i; } }); if (bi < 0) break; chosen.add(bi); table[bi].forEach((m) => left.delete(m)); }
      }
    }
    const key = (t) => [...t].map((c) => (c === "1" ? 0 : c === "0" ? 1 : 2)).join("");
    return [...chosen].map((i) => primes[i]).sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  }
  const sopTerm = (imp, names) => { const t = [...imp].map((c, k) => (c === "1" ? names[k] : c === "0" ? names[k] + "'" : "")).join(""); return t || "1"; };
  const posTerm = (imp, names) => { const t = [...imp].map((c, k) => (c === "0" ? names[k] : c === "1" ? names[k] + "'" : null)).filter(Boolean); return t.length ? "(" + t.join(" + ") + ")" : "0"; };
  const GRAY2 = ["0", "1"], GRAY4 = ["00", "01", "11", "10"];
  function kmap(n, vals) {
    const rowsL = n === 2 ? GRAY2 : n === 3 ? GRAY2 : GRAY4, colsL = n === 2 ? GRAY2 : GRAY4;
    const get = (r, c) => parseInt(rowsL[r] + colsL[c], 2);
    return { rowsL, colsL, grid: rowsL.map((_, r) => colsL.map((_, c) => { const m = get(r, c); return { m, v: vals[m] }; })) };
  }
  function analyze(f, vars, dcSet) {
    const n = vars.length, total = 1 << n, vals = [], rows = [];
    for (let m = 0; m < total; m++) { const env = {}; vars.forEach((v, i) => { env[v] = (m >> (n - 1 - i)) & 1; }); const v = dcSet && dcSet.has(m) ? "X" : f(env); vals.push(v); rows.push({ m, bits: vars.map((_, i) => (m >> (n - 1 - i)) & 1), v }); }
    const mins = rows.filter((r) => r.v === 1).map((r) => r.m), dcs = rows.filter((r) => r.v === "X").map((r) => r.m), maxs = rows.filter((r) => r.v === 0).map((r) => r.m);
    let sop, pos;
    if (!mins.length) { sop = "0"; pos = "0"; } else if (!maxs.length && !dcs.length) { sop = "1"; pos = "1"; }
    else { sop = qm(n, mins, dcs).map((i) => sopTerm(i, vars)).join(" + ") || "0"; pos = maxs.length ? qm(n, maxs, dcs).map((i) => posTerm(i, vars)).join("") || "1" : "1"; if (!mins.length) pos = "0"; }
    return { n, rows, mins, maxs, dcs, sop, pos, vals };
  }
  function logicTool() {
    const st = load("logic", { mode: "expr", expr: "A'B + AB' + AB", n: 3, mins: "1,3,5,7", dc: "" });
    const out = h("div", {}), exprIn = h("input", { type: "text", class: "tl-expr", value: st.expr, "aria-label": "Boolean expression", autocomplete: "off", spellcheck: "false", placeholder: "e.g. A'B + C(A ^ B)" });
    const nSel = h("select", { "aria-label": "Variables" }, [2, 3, 4, 5].map((n) => h("option", { value: n, selected: n === st.n }, n + " variables")));
    const minIn = h("input", { type: "text", value: st.mins, placeholder: "Minterms: 1,3,5,7", "aria-label": "Minterms" }), dcIn = h("input", { type: "text", value: st.dc, placeholder: "Don't cares: 0,2", "aria-label": "Don't cares" });
    const modeBtn = (m, label) => h("button", { type: "button", class: "btn sm" + (st.mode === m ? " primary" : ""), onclick: () => { st.mode = m; save("logic", st); draw(); } }, label);
    const list = (s) => String(s).split(/[\s,]+/).filter(Boolean).map(Number).filter((x) => Number.isInteger(x) && x >= 0);
    const render = () => {
      save("logic", st);
      try {
        let a, vars, dcSet = null;
        if (st.mode === "expr") { const r = parseBool(st.expr); vars = r.vars; if (vars.length > 5) throw new Error("Use at most 5 variables"); if (!vars.length) throw new Error("Use variables like A, B, C"); a = analyze(r.f, vars); }
        else {
          vars = "ABCDE".slice(0, st.n).split(""); const total = 1 << st.n, mins = new Set(list(st.mins)), dcs = new Set(list(st.dc));
          [...mins, ...dcs].forEach((m) => { if (m >= total) throw new Error("Minterm " + m + " is too large for " + st.n + " variables (max " + (total - 1) + ")"); }); dcSet = dcs;
          a = analyze((env) => { const m = vars.reduce((s, v) => (s << 1) | env[v], 0); return mins.has(m) ? 1 : 0; }, vars, dcSet);
        }
        const n = vars.length, w = (m) => m.toString(2).padStart(n, "0");
        const table = h("table", { class: "tl-tt" }, h("tr", {}, ...vars.map((v) => h("th", {}, v)), h("th", { class: "out" }, "F")),
          ...a.rows.map((r) => h("tr", { class: r.v === 1 ? "one" : "" }, ...r.bits.map((b) => h("td", {}, String(b))), h("td", { class: "out" }, String(r.v)))));
        let km = null;
        if (n >= 2 && n <= 4) {
          const k = kmap(n, a.vals), rl = n === 2 ? vars[0] : n === 3 ? vars[0] : vars[0] + vars[1], cl = n === 2 ? vars[1] : n === 3 ? vars[1] + vars[2] : vars[2] + vars[3];
          km = h("div", {}, h("small", { class: "lab-hint" }, "Karnaugh map (rows " + rl + ", columns " + cl + ")"),
            h("table", { class: "tl-km" }, h("tr", {}, h("th", {}, rl + "\\" + cl), ...k.colsL.map((c) => h("th", {}, c))),
              ...k.grid.map((r, i) => h("tr", {}, h("th", {}, k.rowsL[i]), ...r.map((c) => h("td", { class: c.v === 1 ? "one" : c.v === "X" ? "dc" : "" }, h("b", {}, String(c.v)), h("small", {}, String(c.m))))))));
        }
        out.replaceChildren(
          h("div", { class: "lab-result" }, h("div", { class: "tl-trow" }, h("span", {}, "Minimal SOP (sum of products)"), h("strong", {}, a.sop)), h("div", { class: "tl-trow" }, h("span", {}, "Minimal POS (product of sums)"), h("strong", {}, a.pos)),
            h("div", { class: "tl-trow" }, h("span", {}, "Σ m (minterms)"), h("strong", {}, a.mins.join(", ") || "none")), h("div", { class: "tl-trow" }, h("span", {}, "Π M (maxterms)"), h("strong", {}, a.maxs.join(", ") || "none")),
            a.dcs.length ? h("div", { class: "tl-trow" }, h("span", {}, "Don't cares"), h("strong", {}, a.dcs.join(", "))) : null,
            h("button", { type: "button", class: "btn sm", onclick: (e) => copy("F = " + a.sop, e.currentTarget) }, "Copy SOP")),
          km, h("details", { class: "lab-det" }, h("summary", {}, "Truth table (" + a.rows.length + " rows)"), table));
      } catch (e) { out.replaceChildren(h("div", { class: "lab-result" }, h("small", {}, e.message))); }
    };
    const draw = () => {
      wrap.replaceChildren(h("strong", {}, "⚙️ Logic lab"), row(modeBtn("expr", "Expression"), modeBtn("min", "From minterms")),
        st.mode === "expr" ? h("div", {}, exprIn, h("p", { class: "lab-hint" }, "Use A–E, ' or ~ for NOT, + or | for OR, · or & or letters side by side for AND, ^ for XOR, plus NAND, NOR, XNOR.")) : h("div", {}, row(nSel), row(minIn, dcIn)), out);
      render();
    };
    exprIn.addEventListener("input", () => { st.expr = exprIn.value; render(); }); nSel.addEventListener("change", () => { st.n = +nSel.value; render(); });
    minIn.addEventListener("input", () => { st.mins = minIn.value; render(); }); dcIn.addEventListener("input", () => { st.dc = dcIn.value; render(); });
    const wrap = h("div", { class: "lab-card" }); draw();
    return wrap;
  }
  reg({ id: "logic", icon: "⚙️", name: "Logic lab", desc: "Truth table, K-map, minimizer", mount: logicTool });

  // =====================================================================
  //  2. ELECTRONICS BENCH
  // =====================================================================
  const SI = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
  const si = (v, unit) => { if (!Number.isFinite(v) || v === 0) return "0 " + unit; const a = Math.abs(v); for (const [k, p] of SI) if (a >= k) return fmt(v / k, 4) + " " + p + unit; return fmt(v, 4) + " " + unit; };
  const COLORS = [["Black", 0, "#000"], ["Brown", 1, "#7b3f00"], ["Red", 2, "#e11d48"], ["Orange", 3, "#f97316"], ["Yellow", 4, "#eab308"], ["Green", 5, "#16a34a"], ["Blue", 6, "#2563eb"], ["Violet", 7, "#7c3aed"], ["Grey", 8, "#6b7280"], ["White", 9, "#e5e7eb"]];
  const MULT = [["Black", 1], ["Brown", 10], ["Red", 100], ["Orange", 1e3], ["Yellow", 1e4], ["Green", 1e5], ["Blue", 1e6], ["Violet", 1e7], ["Gold", 0.1], ["Silver", 0.01]];
  const TOL = [["Brown", "±1%"], ["Red", "±2%"], ["Green", "±0.5%"], ["Blue", "±0.25%"], ["Violet", "±0.1%"], ["Gold", "±5%"], ["Silver", "±10%"]];
  const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];
  const nearestE24 = (r) => { const d = Math.floor(Math.log10(r)), base = r / Math.pow(10, d - 1); let best = E24[0], bd = Infinity; for (const e of [...E24, 100]) { const q = Math.abs(Math.log(e / base)); if (q < bd) { bd = q; best = e; } } return best * Math.pow(10, d - 1); };
  function electronicsTool() {
    const tabs = [["ohm", "Ohm and power"], ["color", "Resistor code"], ["sp", "Series / parallel"], ["div", "Divider and LED"], ["rc", "RC, LC, 555"]];
    let view = load("elec-view", "ohm");
    const body = h("div", {}), bar = h("div", { class: "lab-row" });
    const field = (label, init, unit) => { const i = h("input", { type: "number", step: "any", value: init === undefined ? "" : String(init), "aria-label": label, placeholder: unit }); return [h("label", {}, label + (unit ? " (" + unit + ")" : ""), i), i]; };
    const result = () => h("div", { class: "lab-result" });
    const num = (i) => (i.value === "" ? NaN : +i.value);
    function ohm() {
      const [lv, v] = field("Voltage", "", "V"), [li, i] = field("Current", "", "A"), [lr, r] = field("Resistance", "", "Ω"), [lp, p] = field("Power", "", "W"), out = result();
      const calc = () => {
        const V = num(v), I = num(i), R = num(r), P = num(p), known = [V, I, R, P].filter(Number.isFinite).length; let rV = V, rI = I, rR = R, rP = P;
        if (known < 2) { out.replaceChildren(h("small", {}, "Fill any two values to find the other two.")); return; }
        if (Number.isFinite(V) && Number.isFinite(I)) { rR = V / I; rP = V * I; } else if (Number.isFinite(V) && Number.isFinite(R)) { rI = V / R; rP = (V * V) / R; } else if (Number.isFinite(I) && Number.isFinite(R)) { rV = I * R; rP = I * I * R; }
        else if (Number.isFinite(P) && Number.isFinite(V)) { rI = P / V; rR = (V * V) / P; } else if (Number.isFinite(P) && Number.isFinite(I)) { rV = P / I; rR = P / (I * I); } else if (Number.isFinite(P) && Number.isFinite(R)) { rV = Math.sqrt(P * R); rI = Math.sqrt(P / R); }
        out.replaceChildren(...[["Voltage", si(rV, "V")], ["Current", si(rI, "A")], ["Resistance", si(rR, "Ω")], ["Power", si(rP, "W")]].map(([k, x]) => h("div", { class: "tl-trow" }, h("span", {}, k), h("strong", {}, x))));
      };
      [v, i, r, p].forEach((e) => e.addEventListener("input", calc)); calc();
      return card(row(lv, li, lr, lp), out, h("p", { class: "lab-hint" }, "V = I·R and P = V·I. Enter any two."));
    }
    function color() {
      const st = load("rband", { bands: 4, c: [1, 0, 2, 5] }); const out = result(), vis = h("div", { class: "tl-resistor" }), sel = [];
      const val = h("input", { type: "text", placeholder: "Value, e.g. 4.7k or 220", "aria-label": "Resistor value" }), rev = h("div", { class: "lab-result" });
      const bandsSel = h("select", { "aria-label": "Band count", onchange: (e) => { st.bands = +e.target.value; st.c = st.bands === 4 ? [1, 0, 2, 5] : [1, 0, 0, 2, 1]; draw(); } }, [4, 5].map((b) => h("option", { value: b, selected: b === st.bands }, b + "-band")));
      const names = () => (st.bands === 4 ? ["Digit 1", "Digit 2", "Multiplier", "Tolerance"] : ["Digit 1", "Digit 2", "Digit 3", "Multiplier", "Tolerance"]);
      const opts = (k) => { const last = k === st.bands - 1, mult = k === st.bands - 2; return mult ? MULT.map(([n], i) => ({ n, i })) : last ? TOL.map(([n], i) => ({ n, i })) : COLORS.map(([n, d], i) => ({ n, i })); };
      const colorHex = (name) => ({ Gold: "#ca8a04", Silver: "#9ca3af" }[name] || (COLORS.find((c) => c[0] === name) || [0, 0, "#888"])[2]);
      const calc = () => {
        const dig = st.bands === 4 ? 2 : 3, d = st.c.slice(0, dig).map((i) => COLORS[i][1]).join(""), mult = MULT[st.c[dig]][1], tol = TOL[st.c[dig + 1]];
        const value = parseInt(d, 10) * mult; out.replaceChildren(h("strong", {}, si(value, "Ω") + "  " + tol[1]), h("small", {}, "Range: " + si(value * (1 - parseFloat(tol[1].replace(/[±%]/g, "")) / 100), "Ω") + " to " + si(value * (1 + parseFloat(tol[1].replace(/[±%]/g, "")) / 100), "Ω")));
        vis.replaceChildren(...st.c.map((ci, k) => { const name = opts(k)[ci] ? opts(k)[ci].n : "Black"; return h("span", { class: "tl-band" }, ""); }));
        [...vis.children].forEach((b, k) => { const name = opts(k)[st.c[k]].n; b.style.background = colorHex(name); });
      };
      const draw = () => { sel.length = 0; const wrap = h("div", { class: "lab-row" }, st.c.map((ci, k) => h("label", {}, names()[k], h("select", { "aria-label": names()[k], onchange: (e) => { st.c[k] = +e.target.value; save("rband", st); calc(); } }, opts(k).map((o) => h("option", { value: o.i, selected: o.i === ci }, o.n))))));
        holder.replaceChildren(row(bandsSel), vis, wrap, out); calc(); save("rband", st); };
      const holder = h("div", {});
      const reverse = () => {
        const m = /^([\d.]+)\s*([kKmMgG]?)/.exec(val.value.trim()); if (!m) { rev.replaceChildren(h("small", {}, "Type a value like 470, 4.7k or 1M")); return; }
        const r = parseFloat(m[1]) * ({ k: 1e3, m: 1e6, g: 1e9 }[m[2].toLowerCase()] || 1), e = nearestE24(r), dgt = Math.floor(Math.log10(e)), two = Math.round(e / Math.pow(10, dgt - 1)), mult = Math.pow(10, dgt - 1);
        const d1 = Math.floor(two / 10), d2 = two % 10, mi = MULT.findIndex((x) => Math.abs(x[1] - mult) < 1e-9);
        rev.replaceChildren(h("strong", {}, "4-band: " + COLORS[d1][0] + ", " + COLORS[d2][0] + ", " + (mi >= 0 ? MULT[mi][0] : "?") + ", Gold (±5%)"), h("small", {}, "Nearest standard (E24) value: " + si(e, "Ω")));
      };
      val.addEventListener("input", reverse); reverse(); draw();
      return card(h("strong", {}, "Colour bands to value"), holder, h("strong", {}, "Value to colour bands"), val, rev);
    }
    function sp() {
      const kind = h("select", { "aria-label": "Component" }, [["R", "Resistors (Ω)"], ["C", "Capacitors (µF)"], ["L", "Inductors (mH)"]].map(([v, l]) => h("option", { value: v }, l)));
      const list = h("textarea", { rows: "2", placeholder: "Values separated by spaces, e.g. 100 220 470", "aria-label": "Values" }, load("sp-list", "100 220 470")), out = result();
      const calc = () => { save("sp-list", list.value); const a = list.value.split(/[\s,]+/).map(Number).filter((x) => x > 0), unit = kind.value === "R" ? "Ω" : kind.value === "C" ? "µF" : "mH";
        if (!a.length) { out.replaceChildren(h("small", {}, "Enter some values")); return; }
        const sum = a.reduce((s, x) => s + x, 0), inv = 1 / a.reduce((s, x) => s + 1 / x, 0), ser = kind.value === "C" ? inv : sum, par = kind.value === "C" ? sum : inv;
        out.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "Series"), h("strong", {}, fmt(ser, 6) + " " + unit)), h("div", { class: "tl-trow" }, h("span", {}, "Parallel"), h("strong", {}, fmt(par, 6) + " " + unit))); };
      kind.addEventListener("change", calc); list.addEventListener("input", calc); calc();
      return card(row(kind), list, out, h("p", { class: "lab-hint" }, "For capacitors, series and parallel are swapped compared to resistors and inductors."));
    }
    function divider() {
      const [la, vin] = field("Vin", 12, "V"), [lb, r1] = field("R1", 10000, "Ω"), [lc, r2] = field("R2", 4700, "Ω"), out = result(), [ld, vs] = field("Supply", 5, "V"), [le, vf] = field("LED Vf", 2, "V"), [lf, ifw] = field("LED current", 10, "mA"), led = result();
      const calc = () => { const V = num(vin), A = num(r1), B = num(r2); if ([V, A, B].every(Number.isFinite) && A + B > 0) out.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "Vout"), h("strong", {}, si((V * B) / (A + B), "V"))), h("div", { class: "tl-trow" }, h("span", {}, "Current"), h("strong", {}, si(V / (A + B), "A")))); else out.replaceChildren(h("small", {}, "Enter Vin, R1 and R2"));
        const S = num(vs), F = num(vf), I = num(ifw) / 1000; if ([S, F, I].every(Number.isFinite) && S > F && I > 0) { const R = (S - F) / I; led.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "Series resistor"), h("strong", {}, si(R, "Ω"))), h("div", { class: "tl-trow" }, h("span", {}, "Nearest standard (E24)"), h("strong", {}, si(nearestE24(R), "Ω"))), h("div", { class: "tl-trow" }, h("span", {}, "Resistor power"), h("strong", {}, si((S - F) * I, "W")))); } else led.replaceChildren(h("small", {}, "Supply must be greater than the LED voltage")); };
      [vin, r1, r2, vs, vf, ifw].forEach((e) => e.addEventListener("input", calc)); calc();
      return card(h("strong", {}, "Voltage divider"), row(la, lb, lc), out, h("strong", {}, "LED series resistor"), row(ld, le, lf), led);
    }
    function rc() {
      const [la, rr] = field("R", 10000, "Ω"), [lb, cc] = field("C", 100, "nF"), [lc, ll] = field("L", 10, "mH"), [ld, c2] = field("C (for LC)", 100, "nF"), [le, r1] = field("R1", 1000, "Ω"), [lf, r2] = field("R2", 10000, "Ω"), [lg, c3] = field("C (555)", 10, "µF"), o1 = result(), o2 = result(), o3 = result();
      const calc = () => { const R = num(rr), C = num(cc) * 1e-9; if (R > 0 && C > 0) o1.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "Time constant τ = RC"), h("strong", {}, si(R * C, "s"))), h("div", { class: "tl-trow" }, h("span", {}, "Cut-off frequency 1/(2πRC)"), h("strong", {}, si(1 / (2 * Math.PI * R * C), "Hz"))), h("div", { class: "tl-trow" }, h("span", {}, "Charge to 63% / 99%"), h("strong", {}, si(R * C, "s") + " / " + si(5 * R * C, "s")))); else o1.replaceChildren(h("small", {}, "Enter R and C"));
        const L = num(ll) * 1e-3, C2 = num(c2) * 1e-9; if (L > 0 && C2 > 0) o2.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "Resonant frequency 1/(2π√LC)"), h("strong", {}, si(1 / (2 * Math.PI * Math.sqrt(L * C2)), "Hz")))); else o2.replaceChildren(h("small", {}, "Enter L and C"));
        const A = num(r1), B = num(r2), C3 = num(c3) * 1e-6; if (A > 0 && B > 0 && C3 > 0) { const f = 1.44 / ((A + 2 * B) * C3); o3.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "555 astable frequency"), h("strong", {}, si(f, "Hz"))), h("div", { class: "tl-trow" }, h("span", {}, "Duty cycle"), h("strong", {}, fmt(((A + B) / (A + 2 * B)) * 100, 4) + " %")), h("div", { class: "tl-trow" }, h("span", {}, "High / Low time"), h("strong", {}, si(0.693 * (A + B) * C3, "s") + " / " + si(0.693 * B * C3, "s")))); } else o3.replaceChildren(h("small", {}, "Enter R1, R2 and C"));
      };
      [rr, cc, ll, c2, r1, r2, c3].forEach((e) => e.addEventListener("input", calc)); calc();
      return card(h("strong", {}, "RC circuit"), row(la, lb), o1, h("strong", {}, "LC resonance"), row(lc, ld), o2, h("strong", {}, "555 timer (astable)"), row(le, lf, lg), o3);
    }
    const draw = () => { save("elec-view", view); bar.replaceChildren(...tabs.map(([id, l]) => h("button", { type: "button", class: "btn sm" + (view === id ? " primary" : ""), onclick: () => { view = id; draw(); } }, l))); body.replaceChildren(view === "ohm" ? ohm() : view === "color" ? color() : view === "sp" ? sp() : view === "div" ? divider() : rc()); };
    draw();
    return h("div", {}, bar, body);
  }
  reg({ id: "elec", icon: "🔌", name: "Electronics", desc: "Ohm, colour code, 555, RC", mount: electronicsTool });

  // =====================================================================
  //  3. SORTING VISUALIZER
  // =====================================================================
  function* bubble(a) { for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length - i - 1; j++) { yield { cmp: [j, j + 1] }; if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; yield { swap: [j, j + 1] }; } } }
  function* insertion(a) { for (let i = 1; i < a.length; i++) { let j = i; while (j > 0) { yield { cmp: [j - 1, j] }; if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; yield { swap: [j - 1, j] }; j--; } else break; } } }
  function* selection(a) { for (let i = 0; i < a.length - 1; i++) { let m = i; for (let j = i + 1; j < a.length; j++) { yield { cmp: [m, j] }; if (a[j] < a[m]) m = j; } if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; yield { swap: [i, m] }; } } }
  function* merge(a, lo = 0, hi = a.length - 1) { if (lo >= hi) return; const mid = (lo + hi) >> 1; yield* merge(a, lo, mid); yield* merge(a, mid + 1, hi); const l = a.slice(lo, mid + 1), r = a.slice(mid + 1, hi + 1); let i = 0, j = 0, k = lo; while (i < l.length && j < r.length) { yield { cmp: [lo + i, mid + 1 + j] }; if (l[i] <= r[j]) a[k] = l[i++]; else a[k] = r[j++]; yield { set: [k, a[k]] }; k++; } while (i < l.length) { a[k] = l[i++]; yield { set: [k, a[k]] }; k++; } while (j < r.length) { a[k] = r[j++]; yield { set: [k, a[k]] }; k++; } }
  function* quick(a, lo = 0, hi = a.length - 1) { if (lo >= hi) return; const p = a[hi]; let i = lo; for (let j = lo; j < hi; j++) { yield { cmp: [j, hi] }; if (a[j] < p) { if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; yield { swap: [i, j] }; } i++; } } if (i !== hi) { [a[i], a[hi]] = [a[hi], a[i]]; yield { swap: [i, hi] }; } yield* quick(a, lo, i - 1); yield* quick(a, i + 1, hi); }
  function* heap(a) { const n = a.length; function* sift(i, size) { for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < size) { yield { cmp: [l, m] }; if (a[l] > a[m]) m = l; } if (r < size) { yield { cmp: [r, m] }; if (a[r] > a[m]) m = r; } if (m === i) return; [a[i], a[m]] = [a[m], a[i]]; yield { swap: [i, m] }; i = m; } } for (let i = (n >> 1) - 1; i >= 0; i--) yield* sift(i, n); for (let e = n - 1; e > 0; e--) { [a[0], a[e]] = [a[e], a[0]]; yield { swap: [0, e] }; yield* sift(0, e); } }
  const ALGOS = { "Bubble sort": [bubble, "O(n²)", "O(1)"], "Insertion sort": [insertion, "O(n²)", "O(1)"], "Selection sort": [selection, "O(n²)", "O(1)"], "Merge sort": [merge, "O(n log n)", "O(n)"], "Quick sort": [quick, "O(n log n) avg, O(n²) worst", "O(log n)"], "Heap sort": [heap, "O(n log n)", "O(1)"] };
  function sortTool() {
    const W = 340, H = 180; const canvas = h("canvas", { class: "tl-canvas", width: String(W), height: String(H), "aria-label": "Sorting animation" });
    const st = { arr: [], gen: null, timer: null, cmp: 0, swp: 0, hi: [], done: false, name: load("sort-algo", "Bubble sort"), n: load("sort-n", 24), speed: load("sort-speed", 60) };
    const info = h("p", { class: "lab-hint" }), stats = h("p", { class: "lab-hint" });
    const shuffleArr = () => { const a = Array.from({ length: st.n }, (_, i) => i + 1); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function draw() { const g = canvas.getContext("2d"); g.clearRect(0, 0, W, H); const bw = W / st.arr.length; st.arr.forEach((v, i) => { g.fillStyle = st.done ? "#16a34a" : st.hi.includes(i) ? "#ef4444" : "#6366f1"; const bh = (v / st.n) * (H - 6); g.fillRect(i * bw + 1, H - bh, Math.max(1, bw - 2), bh); }); stats.textContent = "Comparisons: " + st.cmp + " · Writes/swaps: " + st.swp + (st.done ? " · ✅ Sorted" : ""); }
    function reset() { clearInterval(st.timer); st.timer = null; st.arr = shuffleArr(); st.gen = null; st.cmp = 0; st.swp = 0; st.hi = []; st.done = false; const [, tc, sc] = ALGOS[st.name]; info.textContent = st.name + ": time " + tc + ", extra space " + sc + "."; playBtn.textContent = "▶ Play"; draw(); }
    function step() { if (!st.gen) st.gen = ALGOS[st.name][0](st.arr); const r = st.gen.next(); if (r.done) { st.done = true; st.hi = []; clearInterval(st.timer); st.timer = null; playBtn.textContent = "▶ Play"; } else { const v = r.value; if (v.cmp) { st.cmp++; st.hi = v.cmp; } else if (v.swap) { st.swp++; st.hi = v.swap; } else if (v.set) { st.swp++; st.hi = [v.set[0]]; } } draw(); }
    const play = () => { if (st.timer) { clearInterval(st.timer); st.timer = null; playBtn.textContent = "▶ Play"; return; } if (st.done) reset(); playBtn.textContent = "⏸ Pause"; st.timer = setInterval(() => { if (!canvas.isConnected) { clearInterval(st.timer); st.timer = null; return; } step(); }, st.speed); };
    const playBtn = h("button", { type: "button", class: "btn primary", onclick: play }, "▶ Play");
    const algo = h("select", { "aria-label": "Algorithm", onchange: (e) => { st.name = e.target.value; save("sort-algo", st.name); reset(); } }, Object.keys(ALGOS).map((n) => h("option", { value: n, selected: n === st.name }, n)));
    const size = h("input", { type: "range", min: "8", max: "80", value: String(st.n), "aria-label": "Array size", oninput: (e) => { st.n = +e.target.value; save("sort-n", st.n); reset(); } });
    const speed = h("input", { type: "range", min: "5", max: "300", value: String(st.speed), "aria-label": "Delay (lower is faster)", oninput: (e) => { st.speed = +e.target.value; save("sort-speed", st.speed); if (st.timer) { clearInterval(st.timer); st.timer = null; play(); } } });
    reset();
    return card(h("strong", {}, "🌀 Sorting visualizer"), row(algo), canvas, row(playBtn, h("button", { type: "button", class: "btn", onclick: () => { if (!st.timer) step(); } }, "⏭ Step"), h("button", { type: "button", class: "btn", onclick: reset }, "🔀 Shuffle")), row(h("label", {}, "Size", size), h("label", {}, "Slow ⟷ Fast", h("input", { type: "range", min: "5", max: "300", value: String(305 - st.speed), "aria-label": "Speed", oninput: (e) => { st.speed = 305 - +e.target.value; save("sort-speed", st.speed); if (st.timer) { clearInterval(st.timer); st.timer = null; play(); } } }))), stats, info,
      h("p", { class: "lab-hint" }, "Red bars are being compared or moved, green means sorted. Try the same array with different algorithms and compare the counts."));
  }
  reg({ id: "sort", icon: "🌀", name: "Sorting", desc: "Visualize 6 algorithms", mount: sortTool });

  window.SparkTools._eng = { parseBool, qm, analyze, kmap, nearestE24 };
})();
