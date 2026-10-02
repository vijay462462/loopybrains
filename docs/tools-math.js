// Spark Power Tools: math tools (calculator, grapher, units, number systems, statistics, matrix).
(function () {
  "use strict";
  const { h, load, save, fmt, compile, copy, clean } = window.SparkUI;
  const reg = (t) => window.SparkTools.push(t);
  const nums = (txt) => String(txt || "").split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean).map(Number).filter((x) => Number.isFinite(x));
  const card = (...kids) => h("div", { class: "lab-card" }, kids);
  const row = (...kids) => h("div", { class: "lab-row" }, kids);

  // =====================================================================
  //  1. SCIENTIFIC CALCULATOR
  // =====================================================================
  function calcTool() {
    let deg = load("calc-deg", true), ans = 0, hist = load("calc-hist", []);
    const input = h("input", { type: "text", class: "tl-expr", placeholder: "Type a formula, e.g. 2x+sin(30)", "aria-label": "Formula", autocomplete: "off", autocapitalize: "off", spellcheck: "false", inputmode: "text" });
    const preview = h("div", { class: "tl-preview" }), histBox = h("div", { class: "tl-hist" });
    const run = (commit) => {
      const src = input.value.trim();
      if (!src) { preview.textContent = ""; return; }
      try {
        const v = compile(src, { deg })({ ans, x: 0 }); preview.className = "tl-preview"; preview.textContent = "= " + fmt(v);
        if (commit && Number.isFinite(v)) { ans = v; hist.unshift({ e: src, r: fmt(v) }); hist = hist.slice(0, 20); save("calc-hist", hist); drawHist(); }
      } catch (e) { preview.className = "tl-preview err"; preview.textContent = commit ? e.message : ""; }
    };
    const insert = (txt) => { const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s; input.value = input.value.slice(0, s) + txt + input.value.slice(e); const c = s + txt.length; input.focus(); input.setSelectionRange(c, c); run(false); };
    const drawHist = () => histBox.replaceChildren(...hist.slice(0, 6).map((x) => h("button", { type: "button", class: "tl-h", onclick: () => { input.value = x.e; run(false); } }, x.e + " = " + x.r)));
    input.addEventListener("input", () => run(false));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); run(true); } });
    const key = (label, txt, cls) => h("button", { type: "button", class: "tl-key " + (cls || ""), onclick: () => insert(txt === undefined ? label : txt) }, label);
    const keys = [
      ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["ln", "ln("], ["log", "log("], ["√", "sqrt("],
      ["7"], ["8"], ["9"], ["÷", "/", "op"], ["(", "("], [")", ")"],
      ["4"], ["5"], ["6"], ["×", "*", "op"], ["x²", "^2"], ["xʸ", "^"],
      ["1"], ["2"], ["3"], ["−", "-", "op"], ["π", "pi"], ["e", "e"],
      ["0"], ["."], ["!", "!"], ["+", "+", "op"], ["Ans", "ans"], ["%", "%"],
    ];
    const degBtn = h("button", { type: "button", class: "lab-chip", onclick: () => { deg = !deg; save("calc-deg", deg); degBtn.textContent = deg ? "Degrees" : "Radians"; run(false); } }, deg ? "Degrees" : "Radians");
    const root = card(h("strong", {}, "🧮 Scientific calculator"), input, preview,
      h("div", { class: "tl-keys" }, keys.map(([l, t, c]) => key(l, t, c))),
      row(degBtn, h("button", { type: "button", class: "btn", onclick: () => run(true) }, "= Calculate"), h("button", { type: "button", class: "btn", onclick: () => { input.value = ""; run(false); input.focus(); } }, "Clear"),
        h("button", { type: "button", class: "btn", onclick: (e) => copy(preview.textContent.replace(/^= /, ""), e.currentTarget) }, "Copy")),
      histBox, h("p", { class: "lab-hint" }, "Understands implicit multiplication (2x, 3(4+1)), nCr(n,r), gamma, hypot, max/min, mod, and constants pi, e, tau, phi. “Ans” is your last result."));
    drawHist();
    return root;
  }
  reg({ id: "calc", icon: "🧮", name: "Calculator", desc: "Scientific, safe formula parser", mount: calcTool });

  // =====================================================================
  //  2. FUNCTION GRAPHER
  // =====================================================================
  const GCOLORS = ["#6366f1", "#ef4444", "#16a34a", "#f59e0b"];
  function graphTool() {
    const saved = load("graph", ["sin(x)", "x^2/4", "", ""]);
    const V = { cx: 0, cy: 0, s: 40 };
    const W = 340, H = 300;
    const canvas = h("canvas", { class: "tl-canvas", width: String(W), height: String(H), "aria-label": "Function graph" });
    const readout = h("p", { class: "lab-hint" }, "Drag to move, use +/− to zoom, tap to read values.");
    const ins = saved.map((v, i) => h("input", { type: "text", value: v, placeholder: "f" + (i + 1) + "(x) = …", "aria-label": "Function " + (i + 1), class: "tl-fn", autocomplete: "off", spellcheck: "false", oninput: () => { save("graph", ins.map((x) => x.value)); draw(); } }));
    const fns = () => ins.map((inp) => { const t = inp.value.trim(); if (!t) return null; try { return compile(t, { deg: false }); } catch (_) { return null; } });
    const sx = (x) => W / 2 + (x - V.cx) * V.s, sy = (y) => H / 2 - (y - V.cy) * V.s;
    const wx = (px) => (px - W / 2) / V.s + V.cx, wy = (py) => V.cy - (py - H / 2) / V.s;
    function draw() {
      const g = canvas.getContext("2d"); g.clearRect(0, 0, W, H);
      const cs = getComputedStyle(document.body);
      g.fillStyle = "rgba(255,255,255,.0)"; g.fillRect(0, 0, W, H);
      let step = Math.pow(10, Math.floor(Math.log10(48 / V.s))); for (const m of [1, 2, 5, 10]) { if (step * m * V.s >= 40) { step *= m; break; } }
      g.lineWidth = 1; g.font = "10px monospace"; g.fillStyle = "#888";
      for (let x = Math.ceil(wx(0) / step) * step; x <= wx(W); x += step) { const px = sx(x); g.strokeStyle = Math.abs(x) < step / 2 ? "#888" : "rgba(128,128,128,.25)"; g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke(); if (Math.abs(x) > step / 2) g.fillText(fmt(+x.toFixed(10), 4), px + 2, Math.min(H - 3, Math.max(10, sy(0) + 11))); }
      for (let y = Math.ceil(wy(H) / step) * step; y <= wy(0); y += step) { const py = sy(y); g.strokeStyle = Math.abs(y) < step / 2 ? "#888" : "rgba(128,128,128,.25)"; g.beginPath(); g.moveTo(0, py); g.lineTo(W, py); g.stroke(); if (Math.abs(y) > step / 2) g.fillText(fmt(+y.toFixed(10), 4), Math.min(W - 28, Math.max(2, sx(0) + 3)), py - 2); }
      fns().forEach((f, i) => {
        if (!f) return; g.strokeStyle = GCOLORS[i]; g.lineWidth = 2; g.beginPath(); let prev = null;
        for (let px = 0; px <= W; px++) {
          let y; try { y = f({ x: wx(px) }); } catch (_) { y = NaN; }
          if (!Number.isFinite(y)) { prev = null; continue; }
          const py = sy(y);
          if (prev !== null && Math.abs(py - prev) < H * 1.5) g.lineTo(px, py); else g.moveTo(px, py);
          prev = py;
        }
        g.stroke();
      });
    }
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, cx: V.cx, cy: V.cy, moved: false }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => { if (!drag) return; const k = W / canvas.getBoundingClientRect().width, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; V.cx = drag.cx - dx / V.s; V.cy = drag.cy + dy / V.s; draw(); });
    canvas.addEventListener("pointerup", (e) => {
      if (drag && !drag.moved) { const r = canvas.getBoundingClientRect(), x = wx(((e.clientX - r.left) / r.width) * W);
        const vals = fns().map((f, i) => { if (!f) return null; try { return "f" + (i + 1) + "(" + fmt(x, 5) + ") = " + fmt(f({ x }), 6); } catch (_) { return null; } }).filter(Boolean);
        readout.textContent = vals.join("   ") || "Type a function above."; }
      drag = null;
    });
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); V.s *= e.deltaY < 0 ? 1.15 : 1 / 1.15; draw(); }, { passive: false });
    const zoom = (k) => { V.s = Math.max(0.5, Math.min(100000, V.s * k)); draw(); };
    const result = h("div", { class: "lab-result" }, h("small", {}, "Roots, derivative and area appear here."));
    const f1 = () => { const f = fns()[0]; if (!f) throw new Error("Type f1(x) first"); return (x) => f({ x }); };
    const roots = () => {
      try { const f = f1(), a = wx(0), b = wx(W), n = 800, found = []; let px = a, py = f(a);
        for (let i = 1; i <= n; i++) { const x = a + ((b - a) * i) / n, y = f(x);
          if (Number.isFinite(py) && Number.isFinite(y) && py * y <= 0 && py !== y) { let lo = px, hi = x, flo = py; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2, fm = f(mid); if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; } } const r = (lo + hi) / 2; if (Math.abs(f(r)) < 1e-4 && !found.some((q) => Math.abs(q - r) < 1e-6)) found.push(r); }
          px = x; py = y; }
        result.replaceChildren(h("strong", {}, "Roots of f1 in view"), h("p", {}, found.length ? found.slice(0, 10).map((r) => "x ≈ " + fmt(r, 8)).join("  ·  ") : "No roots found in this view. Zoom out or move the graph."));
      } catch (e) { result.replaceChildren(h("p", {}, e.message)); }
    };
    const xIn = h("input", { type: "text", placeholder: "x", value: "1", "aria-label": "x value" }), aIn = h("input", { type: "text", placeholder: "a", value: "0", "aria-label": "Lower limit" }), bIn = h("input", { type: "text", placeholder: "b", value: "3", "aria-label": "Upper limit" });
    const num = (v) => { const r = compile(v.value || "0")({}); if (!Number.isFinite(r)) throw new Error("Invalid number"); return r; };
    const deriv = () => { try { const f = f1(), x = num(xIn), hh = 1e-5 * (1 + Math.abs(x)); result.replaceChildren(h("strong", {}, "Derivative"), h("p", {}, "f1(" + fmt(x, 6) + ") = " + fmt(f(x), 8) + "   f1′(" + fmt(x, 6) + ") ≈ " + fmt((f(x + hh) - f(x - hh)) / (2 * hh), 8))); } catch (e) { result.replaceChildren(h("p", {}, e.message)); } };
    const integ = () => { try { const f = f1(), a = num(aIn), b = num(bIn), n = 2000, hh = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * hh) * (i % 2 ? 4 : 2); result.replaceChildren(h("strong", {}, "Area (definite integral)"), h("p", {}, "∫ f1(x) dx from " + fmt(a, 6) + " to " + fmt(b, 6) + " ≈ " + fmt((s * hh) / 3, 8))); } catch (e) { result.replaceChildren(h("p", {}, e.message)); } };
    const root = card(h("strong", {}, "📈 Function grapher"), ...ins.map((inp, i) => h("div", { class: "tl-fnrow" }, h("span", { class: "tl-dot", "data-i": String(i) }, "●"), inp)),
      canvas, readout,
      row(h("button", { type: "button", class: "btn sm", onclick: () => zoom(1.4) }, "＋ Zoom in"), h("button", { type: "button", class: "btn sm", onclick: () => zoom(1 / 1.4) }, "－ Zoom out"), h("button", { type: "button", class: "btn sm", onclick: () => { V.cx = 0; V.cy = 0; V.s = 40; draw(); } }, "↺ Reset")),
      row(h("button", { type: "button", class: "btn sm primary", onclick: roots }, "Find roots of f1")),
      row(xIn, h("button", { type: "button", class: "btn sm", onclick: deriv }, "f1′(x)")), row(aIn, bIn, h("button", { type: "button", class: "btn sm", onclick: integ }, "∫ f1 from a to b")),
      result, h("p", { class: "lab-hint" }, "Supports sin, cos, tan, ln, log, exp, sqrt, abs, floor, ^, constants pi and e. Graph uses radians."));
    root.querySelectorAll(".tl-dot").forEach((d) => { d.style.color = GCOLORS[+d.dataset.i]; });
    setTimeout(draw, 0);
    return root;
  }
  reg({ id: "graph", icon: "📈", name: "Grapher", desc: "Plot functions, roots, area", mount: graphTool });

  // =====================================================================
  //  3. UNIT CONVERTER
  // =====================================================================
  const UNITS = {
    "Length": { m: 1, km: 1000, cm: 0.01, mm: 0.001, "µm": 1e-6, nm: 1e-9, inch: 0.0254, ft: 0.3048, yard: 0.9144, mile: 1609.344, "nautical mile": 1852 },
    "Mass": { kg: 1, g: 0.001, mg: 1e-6, tonne: 1000, quintal: 100, lb: 0.45359237, oz: 0.028349523125 },
    "Time": { s: 1, ms: 0.001, "µs": 1e-6, min: 60, hour: 3600, day: 86400, week: 604800, year: 31557600 },
    "Area": { "m²": 1, "km²": 1e6, "cm²": 1e-4, hectare: 1e4, acre: 4046.8564224, "ft²": 0.09290304, "in²": 0.00064516, cent: 40.468564224 },
    "Volume": { litre: 1, mL: 0.001, "m³": 1000, "gallon (US)": 3.785411784, "quart (US)": 0.946352946, "cup (US)": 0.2365882365, "fl oz (US)": 0.0295735295625 },
    "Speed": { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, knot: 0.514444444, "ft/s": 0.3048, Mach: 340.29 },
    "Pressure": { Pa: 1, kPa: 1000, bar: 1e5, atm: 101325, psi: 6894.757293168, mmHg: 133.322387415, torr: 133.322368421 },
    "Energy": { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, eV: 1.602176634e-19, BTU: 1055.05585262 },
    "Power": { W: 1, kW: 1000, MW: 1e6, hp: 745.69987158, "BTU/h": 0.29307107 },
    "Force": { N: 1, kN: 1000, kgf: 9.80665, lbf: 4.4482216153 },
    "Frequency": { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, rpm: 1 / 60 },
    "Data": { bit: 1, byte: 8, KB: 8e3, MB: 8e6, GB: 8e9, TB: 8e12, KiB: 8192, MiB: 8388608, GiB: 8589934592 },
    "Angle": { degree: 1, radian: 180 / Math.PI, gradian: 0.9, turn: 360, arcminute: 1 / 60, arcsecond: 1 / 3600 },
  };
  const TEMPS = ["°C", "°F", "K"];
  const toC = (v, u) => (u === "°C" ? v : u === "°F" ? ((v - 32) * 5) / 9 : v - 273.15), fromC = (c, u) => (u === "°C" ? c : u === "°F" ? (c * 9) / 5 + 32 : c + 273.15);
  function unitTool() {
    const st = load("unit", { cat: "Length", from: "m", to: "ft", v: "1" });
    const cats = [...Object.keys(UNITS), "Temperature"];
    const catSel = h("select", { "aria-label": "Category" }, cats.map((c) => h("option", { value: c, selected: c === st.cat }, c)));
    const fromSel = h("select", { "aria-label": "From unit" }), toSel = h("select", { "aria-label": "To unit" });
    const val = h("input", { type: "number", step: "any", value: st.v, "aria-label": "Value" }), out = h("div", { class: "lab-result" }), table = h("div", { class: "tl-table" });
    const list = () => (st.cat === "Temperature" ? TEMPS : Object.keys(UNITS[st.cat]));
    const conv = (v, f, t) => (st.cat === "Temperature" ? fromC(toC(v, f), t) : (v * UNITS[st.cat][f]) / UNITS[st.cat][t]);
    const fill = () => { const l = list(); if (!l.includes(st.from)) st.from = l[0]; if (!l.includes(st.to)) st.to = l[1] || l[0]; fromSel.replaceChildren(...l.map((u) => h("option", { value: u, selected: u === st.from }, u))); toSel.replaceChildren(...l.map((u) => h("option", { value: u, selected: u === st.to }, u))); };
    const calc = () => {
      save("unit", st); const v = parseFloat(val.value);
      if (!Number.isFinite(v)) { out.replaceChildren(h("small", {}, "Enter a number")); table.replaceChildren(); return; }
      out.replaceChildren(h("strong", {}, fmt(v, 10) + " " + st.from + " = " + fmt(conv(v, st.from, st.to), 10) + " " + st.to));
      table.replaceChildren(...list().filter((u) => u !== st.from).map((u) => h("div", { class: "tl-trow" }, h("span", {}, u), h("strong", {}, fmt(conv(v, st.from, u), 8)))));
    };
    catSel.onchange = () => { st.cat = catSel.value; st.from = ""; st.to = ""; fill(); calc(); };
    fromSel.onchange = () => { st.from = fromSel.value; calc(); }; toSel.onchange = () => { st.to = toSel.value; calc(); }; val.oninput = () => { st.v = val.value; calc(); };
    fill(); calc();
    return card(h("strong", {}, "🔁 Unit converter"), row(catSel), row(val, fromSel, h("button", { type: "button", class: "btn sm", onclick: () => { [st.from, st.to] = [st.to, st.from]; fill(); calc(); } }, "⇄"), toSel), out,
      h("details", { class: "lab-det" }, h("summary", {}, "See all units"), table));
  }
  reg({ id: "unit", icon: "🔁", name: "Units", desc: "13 categories incl. temperature", mount: unitTool });

  // =====================================================================
  //  4. NUMBER SYSTEMS, BITWISE and IEEE-754
  // =====================================================================
  const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
  function parseBase(s, b) {
    s = s.trim().toLowerCase().replace(/[_\s]/g, ""); let neg = false;
    if (s.startsWith("-")) { neg = true; s = s.slice(1); }
    if (!s) throw new Error("Type a number");
    let v = 0n; const B = BigInt(b);
    for (const ch of s) { const d = DIGITS.indexOf(ch); if (d < 0 || d >= b) throw new Error("“" + ch + "” is not a base-" + b + " digit"); v = v * B + BigInt(d); }
    return neg ? -v : v;
  }
  const toBase = (v, b) => (v < 0n ? "-" : "") + (v < 0n ? -v : v).toString(b).toUpperCase();
  const group4 = (s) => s.replace(/\B(?=(.{4})+$)/g, " ");
  const twos = (v, bits) => { const m = 1n << BigInt(bits); return (((v % m) + m) % m).toString(2).padStart(bits, "0"); };
  function floatBits(x, dbl) {
    const buf = new ArrayBuffer(8), dv = new DataView(buf);
    if (dbl) dv.setFloat64(0, x); else dv.setFloat32(0, x);
    const bits = Array.from({ length: dbl ? 8 : 4 }, (_, i) => dv.getUint8(i).toString(2).padStart(8, "0")).join("");
    const e = dbl ? 11 : 8; return { s: bits.slice(0, 1), e: bits.slice(1, 1 + e), m: bits.slice(1 + e), bias: dbl ? 1023 : 127 };
  }
  function numberTool() {
    const val = h("input", { type: "text", value: "255", "aria-label": "Number", autocomplete: "off", spellcheck: "false" });
    const base = h("select", { "aria-label": "Base of input" }, [[10, "Decimal (10)"], [2, "Binary (2)"], [8, "Octal (8)"], [16, "Hex (16)"], [32, "Base 32"], [36, "Base 36"]].map(([v, l]) => h("option", { value: v }, l)));
    const width = h("select", { "aria-label": "Bit width" }, [8, 16, 32, 64].map((w) => h("option", { value: w, selected: w === 8 }, w + "-bit")));
    const out = h("div", { class: "lab-result" });
    const a = h("input", { type: "text", value: "12", "aria-label": "A" }), b2 = h("input", { type: "text", value: "10", "aria-label": "B" }), op = h("select", { "aria-label": "Operation" }, ["AND", "OR", "XOR", "NAND", "NOR", "XNOR", "A << B", "A >> B", "NOT A"].map((o) => h("option", {}, o)));
    const bit = h("div", { class: "lab-result" }), fl = h("div", { class: "lab-result" }), fin = h("input", { type: "text", value: "-6.25", "aria-label": "Decimal number", autocomplete: "off" });
    const conv = () => {
      try {
        const v = parseBase(val.value, +base.value), w = +width.value;
        out.replaceChildren(
          ...[["Decimal", v.toString()], ["Binary", group4(toBase(v, 2))], ["Octal", toBase(v, 8)], ["Hexadecimal", toBase(v, 16)], ["Base 32", toBase(v, 32)], ["Base 36", toBase(v, 36)]].map(([k, x]) => h("div", { class: "tl-trow" }, h("span", {}, k), h("strong", {}, x))),
          h("div", { class: "tl-trow" }, h("span", {}, "Two's complement (" + w + "-bit)"), h("strong", {}, group4(twos(v, w)))),
          h("div", { class: "tl-trow" }, h("span", {}, "Gray code"), h("strong", {}, group4(toBase(v >= 0n ? v ^ (v >> 1n) : 0n, 2)))),
          ...(v >= 32n && v < 127n ? [h("div", { class: "tl-trow" }, h("span", {}, "ASCII character"), h("strong", {}, String.fromCharCode(Number(v))))] : []));
      } catch (e) { out.replaceChildren(h("small", {}, e.message)); }
    };
    const bitop = () => {
      try {
        const x = parseBase(a.value, 10), y = parseBase(b2.value, 10), w = BigInt(+width.value), mask = (1n << w) - 1n, o = op.value; let r;
        if (o === "AND") r = x & y; else if (o === "OR") r = x | y; else if (o === "XOR") r = x ^ y; else if (o === "NAND") r = ~(x & y) & mask; else if (o === "NOR") r = ~(x | y) & mask; else if (o === "XNOR") r = ~(x ^ y) & mask;
        else if (o === "A << B") r = (x << y) & mask; else if (o === "A >> B") r = x >> y; else r = ~x & mask;
        bit.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "A"), h("strong", {}, group4(twos(x, +width.value)))), o === "NOT A" ? null : h("div", { class: "tl-trow" }, h("span", {}, "B"), h("strong", {}, group4(twos(y, +width.value)))),
          h("div", { class: "tl-trow" }, h("span", {}, "Result"), h("strong", {}, group4(twos(r, +width.value)) + "  =  " + r.toString())));
      } catch (e) { bit.replaceChildren(h("small", {}, e.message)); }
    };
    const flt = () => {
      const x = parseFloat(fin.value); if (!Number.isFinite(x) && !/inf|nan/i.test(fin.value)) { fl.replaceChildren(h("small", {}, "Enter a decimal number")); return; }
      const part = (f, label) => h("div", { class: "tl-float" }, h("small", {}, label), h("div", { class: "tl-bits" }, h("span", { class: "s" }, f.s), h("span", { class: "e" }, f.e), h("span", { class: "m" }, f.m)),
        h("small", {}, "sign " + f.s + " · exponent " + parseInt(f.e, 2) + " (bias " + f.bias + ", real " + (parseInt(f.e, 2) - f.bias) + ") · mantissa " + f.m.slice(0, 12) + (f.m.length > 12 ? "…" : "")));
      fl.replaceChildren(part(floatBits(x, false), "Float32 (single)"), part(floatBits(x, true), "Float64 (double)"), h("small", {}, "Float32 stores " + fmt(Math.fround(x), 12)));
    };
    [val, base, width].forEach((e) => e.addEventListener("input", () => { conv(); bitop(); })); [a, b2, op].forEach((e) => e.addEventListener("input", bitop)); fin.addEventListener("input", flt);
    conv(); bitop(); flt();
    return card(h("strong", {}, "🔢 Number systems"), row(val, base, width), out,
      h("strong", {}, "⚙️ Bitwise operations"), row(a, op, b2), bit,
      h("strong", {}, "🧬 IEEE-754 floating point"), row(fin), fl,
      h("p", { class: "lab-hint" }, "In bitwise operations, A and B are decimal numbers. Colours: sign, exponent, mantissa."));
  }
  reg({ id: "num", icon: "🔢", name: "Number systems", desc: "Binary, hex, bitwise, IEEE-754", mount: numberTool });

  // =====================================================================
  //  5. STATISTICS and REGRESSION
  // =====================================================================
  const erf = (x) => { const t = 1 / (1 + 0.5 * Math.abs(x)), y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? y : -y; };
  const ncdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  const quant = (s, p) => { const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
  function statsOf(a) {
    const n = a.length, sum = a.reduce((x, y) => x + y, 0), mean = sum / n, s = a.slice().sort((x, y) => x - y);
    const ss = a.reduce((x, y) => x + (y - mean) ** 2, 0), cnt = new Map(); a.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
    const top = Math.max(...cnt.values()), modes = top > 1 ? [...cnt].filter(([, c]) => c === top).map(([v]) => v) : [];
    const sd = Math.sqrt(ss / n), skew = sd ? a.reduce((x, y) => x + ((y - mean) / sd) ** 3, 0) / n : 0;
    return { n, sum, mean, median: quant(s, 0.5), modes, min: s[0], max: s[n - 1], range: s[n - 1] - s[0], q1: quant(s, 0.25), q3: quant(s, 0.75), varP: ss / n, sdP: sd, varS: n > 1 ? ss / (n - 1) : NaN, sdS: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN, skew };
  }
  function statsTool() {
    const xs = h("textarea", { rows: "3", placeholder: "Numbers separated by space, comma or new line, e.g. 12 15 9 22 18", "aria-label": "Data" }, load("stat-x", "12 15 9 22 18 15 30 21"));
    const ys = h("textarea", { rows: "2", placeholder: "Optional second list (Y) for regression, same length", "aria-label": "Y data" }, load("stat-y", ""));
    const out = h("div", { class: "lab-result" }), hist = h("canvas", { class: "tl-canvas", width: "340", height: "140", "aria-label": "Histogram" }), reg2 = h("div", { class: "lab-result" }), sc = h("canvas", { class: "tl-canvas", width: "340", height: "220", "aria-label": "Scatter plot" });
    const mu = h("input", { type: "number", value: "50", step: "any", "aria-label": "Mean" }), sg = h("input", { type: "number", value: "10", step: "any", "aria-label": "Standard deviation" }), xv = h("input", { type: "number", value: "60", step: "any", "aria-label": "x" }), xv2 = h("input", { type: "number", value: "40", step: "any", "aria-label": "From" }), nd = h("div", { class: "lab-result" });
    const normal = () => { const m = +mu.value, s = +sg.value; if (!(s > 0)) { nd.replaceChildren(h("small", {}, "Standard deviation must be positive")); return; } const z = (+xv.value - m) / s, z2 = (+xv2.value - m) / s;
      nd.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "z-score of x"), h("strong", {}, fmt(z, 6))), h("div", { class: "tl-trow" }, h("span", {}, "P(X ≤ x)"), h("strong", {}, (ncdf(z) * 100).toFixed(3) + " %")), h("div", { class: "tl-trow" }, h("span", {}, "P(X ≥ x)"), h("strong", {}, ((1 - ncdf(z)) * 100).toFixed(3) + " %")), h("div", { class: "tl-trow" }, h("span", {}, "P(from ≤ X ≤ x)"), h("strong", {}, (Math.abs(ncdf(z) - ncdf(z2)) * 100).toFixed(3) + " %"))); };
    const calc = () => {
      save("stat-x", xs.value); save("stat-y", ys.value);
      const a = nums(xs.value);
      if (a.length < 1) { out.replaceChildren(h("small", {}, "Enter some numbers")); hist.getContext("2d").clearRect(0, 0, 340, 140); }
      else {
        const s = statsOf(a), rows = [["Count", s.n], ["Sum", fmt(s.sum)], ["Mean", fmt(s.mean)], ["Median", fmt(s.median)], ["Mode", s.modes.length ? s.modes.join(", ") : "none"], ["Min / Max", fmt(s.min) + " / " + fmt(s.max)], ["Range", fmt(s.range)], ["Q1 / Q3", fmt(s.q1) + " / " + fmt(s.q3)], ["IQR", fmt(s.q3 - s.q1)], ["Std dev (population)", fmt(s.sdP)], ["Std dev (sample)", fmt(s.sdS)], ["Variance (pop / sample)", fmt(s.varP) + " / " + fmt(s.varS)], ["Skewness", fmt(s.skew, 5)]];
        out.replaceChildren(...rows.map(([k, v]) => h("div", { class: "tl-trow" }, h("span", {}, k), h("strong", {}, String(v)))));
        const g = hist.getContext("2d"); g.clearRect(0, 0, 340, 140); const bins = Math.max(4, Math.min(12, Math.round(Math.sqrt(a.length)) + 2)), w = (s.max - s.min) / bins || 1, c = Array(bins).fill(0);
        a.forEach((v) => { c[Math.min(bins - 1, Math.floor((v - s.min) / w))]++; }); const mx = Math.max(...c);
        c.forEach((n, i) => { g.fillStyle = "#6366f1"; const bh = (n / mx) * 110; g.fillRect(8 + i * (324 / bins), 120 - bh, 324 / bins - 3, bh); g.fillStyle = "#888"; g.font = "9px monospace"; g.fillText(String(n), 10 + i * (324 / bins), 116 - bh); g.fillText(fmt(s.min + i * w, 3), 8 + i * (324 / bins), 134); });
      }
      const y = nums(ys.value), x = a;
      if (y.length && y.length === x.length && x.length > 1) {
        const n = x.length, mx = x.reduce((p, q) => p + q, 0) / n, my = y.reduce((p, q) => p + q, 0) / n; let sxy = 0, sxx = 0, syy = 0; x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sxx += (v - mx) ** 2; syy += (y[i] - my) ** 2; });
        const m = sxx ? sxy / sxx : NaN, b = my - m * mx, r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
        reg2.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "Line of best fit"), h("strong", {}, "y = " + fmt(m, 6) + "x " + (b < 0 ? "− " : "+ ") + fmt(Math.abs(b), 6))), h("div", { class: "tl-trow" }, h("span", {}, "Correlation r / r²"), h("strong", {}, fmt(r, 5) + " / " + fmt(r * r, 5))),
          h("div", { class: "tl-trow" }, h("span", {}, "Predict y at x ="), h("input", { type: "number", step: "any", value: "0", "aria-label": "Predict at x", oninput: (e) => { pr.textContent = fmt(m * +e.target.value + b, 8); } }), (window.__pr = h("strong", {}, fmt(b, 8)))));
        const pr = reg2.querySelector("strong:last-child"), g = sc.getContext("2d"); g.clearRect(0, 0, 340, 220);
        const x0 = Math.min(...x), x1 = Math.max(...x), y0 = Math.min(...y), y1 = Math.max(...y), px = (v) => 20 + ((v - x0) / (x1 - x0 || 1)) * 300, py = (v) => 200 - ((v - y0) / (y1 - y0 || 1)) * 180;
        g.strokeStyle = "#ef4444"; g.lineWidth = 2; g.beginPath(); g.moveTo(px(x0), py(m * x0 + b)); g.lineTo(px(x1), py(m * x1 + b)); g.stroke(); g.fillStyle = "#6366f1"; x.forEach((v, i) => { g.beginPath(); g.arc(px(v), py(y[i]), 4, 0, 6.3); g.fill(); });
        g.fillStyle = "#888"; g.font = "9px monospace"; g.fillText(fmt(x0, 3), 14, 214); g.fillText(fmt(x1, 3), 300, 214); g.fillText(fmt(y1, 3), 2, 18);
      } else { reg2.replaceChildren(h("small", {}, y.length ? "X and Y need the same number of values (" + x.length + " vs " + y.length + ")." : "Add a Y list to see regression and a scatter plot.")); sc.getContext("2d").clearRect(0, 0, 340, 220); }
    };
    xs.addEventListener("input", calc); ys.addEventListener("input", calc); [mu, sg, xv, xv2].forEach((e) => e.addEventListener("input", normal));
    calc(); normal();
    return card(h("strong", {}, "📊 Statistics and regression"), xs, out, hist, h("strong", {}, "📈 Regression (X from the first list)"), ys, reg2, sc,
      h("strong", {}, "🔔 Normal distribution"), row(h("label", {}, "Mean", mu), h("label", {}, "Std dev", sg), h("label", {}, "x", xv), h("label", {}, "From", xv2)), nd);
  }
  reg({ id: "stats", icon: "📊", name: "Statistics", desc: "Mean, SD, regression, normal", mount: statsTool });

  // =====================================================================
  //  6. MATRIX CALCULATOR
  // =====================================================================
  const mk = (r, c, f) => Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => f(i, j)));
  const mmul = (A, B) => mk(A.length, B[0].length, (i, j) => A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0));
  const tr = (A) => mk(A[0].length, A.length, (i, j) => A[j][i]);
  function gauss(M) {
    const A = M.map((r) => r.slice()), n = A.length, m = A[0].length; let rank = 0, det = 1;
    for (let c = 0, r = 0; c < m && r < n; c++) {
      let p = r; for (let i = r + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
      if (Math.abs(A[p][c]) < 1e-12) { det = 0; continue; }
      if (p !== r) { [A[p], A[r]] = [A[r], A[p]]; det = -det; }
      det *= A[r][c];
      for (let i = r + 1; i < n; i++) { const f = A[i][c] / A[r][c]; for (let j = c; j < m; j++) A[i][j] -= f * A[r][j]; }
      r++; rank++;
    }
    return { rank, det: n === m && rank === n ? det : 0 };
  }
  function inverse(M) {
    const n = M.length, A = M.map((r, i) => r.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
    for (let c = 0; c < n; c++) {
      let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
      if (Math.abs(A[p][c]) < 1e-12) throw new Error("Matrix is singular (no inverse)");
      [A[p], A[c]] = [A[c], A[p]]; const d = A[c][c]; A[c] = A[c].map((v) => v / d);
      for (let i = 0; i < n; i++) if (i !== c) { const f = A[i][c]; if (f) A[i] = A[i].map((v, j) => v - f * A[c][j]); }
    }
    return A.map((r) => r.slice(n));
  }
  function matrixTool() {
    const st = load("mat", { n: 3, A: mk(3, 3, (i, j) => (i === j ? 2 : (i + j) % 2)), B: mk(3, 3, (i, j) => (i === j ? 1 : 0)), b: [1, 2, 3], k: 2 });
    const wrap = h("div", { class: "lab-card" }), out = h("div", { class: "lab-result" });
    const grid = (M, name) => h("div", { class: "tl-mat", style: "grid-template-columns:repeat(" + st.n + ",1fr)" }, M.flatMap((r, i) => r.map((v, j) => h("input", { type: "number", step: "any", value: String(v), "aria-label": name + " " + (i + 1) + "," + (j + 1), oninput: (e) => { M[i][j] = parseFloat(e.target.value) || 0; save("mat", st); } }))));
    const show = (title, M) => out.replaceChildren(h("strong", {}, title), h("div", { class: "tl-mat out", style: "grid-template-columns:repeat(" + M[0].length + ",1fr)" }, M.flatMap((r) => r.map((v) => h("span", {}, fmt(v, 6))))),
      h("button", { type: "button", class: "btn sm", onclick: (e) => copy(M.map((r) => r.map((v) => fmt(v, 8)).join("\t")).join("\n"), e.currentTarget) }, "Copy"));
    const msg = (t) => out.replaceChildren(h("strong", {}, t));
    const op = (fn) => () => { try { fn(); } catch (e) { msg(e.message); } };
    const draw = () => {
      const size = h("select", { "aria-label": "Matrix size", onchange: (e) => { const n = +e.target.value; st.n = n; st.A = mk(n, n, (i, j) => st.A[i]?.[j] ?? 0); st.B = mk(n, n, (i, j) => st.B[i]?.[j] ?? 0); st.b = Array.from({ length: n }, (_, i) => st.b[i] ?? 0); save("mat", st); draw(); } }, [2, 3, 4, 5].map((n) => h("option", { value: n, selected: n === st.n }, n + " × " + n)));
      const bvec = h("div", { class: "tl-mat", style: "grid-template-columns:repeat(" + st.n + ",1fr)" }, st.b.map((v, i) => h("input", { type: "number", step: "any", value: String(v), "aria-label": "b " + (i + 1), oninput: (e) => { st.b[i] = parseFloat(e.target.value) || 0; save("mat", st); } })));
      const k = h("input", { type: "number", step: "any", value: String(st.k), "aria-label": "Scalar k", oninput: (e) => { st.k = parseFloat(e.target.value) || 0; save("mat", st); } });
      wrap.replaceChildren(h("strong", {}, "🧮 Matrix calculator"), row(size), h("small", {}, "Matrix A"), grid(st.A, "A"), h("small", {}, "Matrix B"), grid(st.B, "B"), h("small", {}, "Vector b (for A·x = b) and scalar k"), bvec, row(k),
        row(h("button", { type: "button", class: "btn sm", onclick: op(() => show("A + B", mk(st.n, st.n, (i, j) => st.A[i][j] + st.B[i][j]))) }, "A + B"), h("button", { type: "button", class: "btn sm", onclick: op(() => show("A − B", mk(st.n, st.n, (i, j) => st.A[i][j] - st.B[i][j]))) }, "A − B"),
          h("button", { type: "button", class: "btn sm", onclick: op(() => show("A × B", mmul(st.A, st.B))) }, "A × B"), h("button", { type: "button", class: "btn sm", onclick: op(() => show("k · A", st.A.map((r) => r.map((v) => v * st.k)))) }, "k · A"),
          h("button", { type: "button", class: "btn sm", onclick: op(() => show("Aᵀ (transpose)", tr(st.A))) }, "Aᵀ"), h("button", { type: "button", class: "btn sm", onclick: op(() => show("A⁻¹ (inverse)", inverse(st.A))) }, "A⁻¹"),
          h("button", { type: "button", class: "btn sm", onclick: op(() => msg("det(A) = " + fmt(gauss(st.A).det, 10))) }, "det A"), h("button", { type: "button", class: "btn sm", onclick: op(() => msg("rank(A) = " + gauss(st.A).rank + "   trace(A) = " + fmt(st.A.reduce((s, r, i) => s + r[i], 0)))) }, "rank, trace"),
          h("button", { type: "button", class: "btn sm primary", onclick: op(() => { const inv = inverse(st.A); show("Solution x of A·x = b", inv.map((r) => [r.reduce((s, v, j) => s + v * st.b[j], 0)])); }) }, "Solve A·x = b")), out);
    };
    draw();
    return wrap;
  }
  reg({ id: "matrix", icon: "🧮", name: "Matrix", desc: "Det, inverse, solve, up to 5×5", mount: matrixTool });

  window.SparkTools._math = { compile, statsOf, parseBase, toBase, gauss, inverse, mmul, ncdf, erf };
})();
