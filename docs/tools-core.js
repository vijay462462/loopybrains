// Shared helpers and a safe math-expression parser for the Spark Power Tools.
// The parser never uses eval(), so typed formulas cannot run code.
(function () {
  "use strict";

  const h = (tag, props, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "string") { for (const d of v.split(";")) { const i = d.indexOf(":"); if (i > 0) n.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); } }
      else if (k === "value") n.value = v;
      else if (k === "checked") n.checked = !!v;
      else if (k === "disabled") n.disabled = !!v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : String(c));
    return n;
  };
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem("lab-" + k)); return v == null ? d : v; } catch (_) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("lab-" + k, JSON.stringify(v)); } catch (_) {} };
  const clean = (s) => String(s || "").normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​‎‏‪-‮⁠-⁤⁦-⁩﻿]/g, "").trim();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const copy = async (text, btn) => {
    try { await navigator.clipboard.writeText(text); if (btn) { const o = btn.textContent; btn.textContent = "✅ Copied"; setTimeout(() => { btn.textContent = o; }, 1200); } } catch (_) {}
  };
  const download = (name, text, type) => {
    const a = document.createElement("a"), u = URL.createObjectURL(new Blob([text], { type: type || "text/plain" }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
  };

  // ---------- number formatting ----------
  function fmt(n, digits = 10) {
    if (typeof n !== "number" || Number.isNaN(n)) return "undefined";
    if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
    if (n === 0) return "0";
    const a = Math.abs(n);
    if (a >= 1e12 || a < 1e-6) return n.toExponential(Math.max(0, digits - 3)).replace(/\.?0+e/, "e").replace("e+", "e");
    return String(parseFloat(n.toPrecision(digits)));
  }

  // ---------- math helpers ----------
  function gamma(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  const fact = (n) => {
    if (n < 0) return NaN;
    if (Number.isInteger(n)) { if (n > 170) return Infinity; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
    return gamma(n + 1);
  };
  const gcd = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; };
  const nCr = (n, r) => { if (r < 0 || r > n) return 0; r = Math.min(r, n - r); let v = 1; for (let i = 1; i <= r; i++) v = (v * (n - r + i)) / i; return Math.round(v); };
  const nPr = (n, r) => { if (r < 0 || r > n) return 0; let v = 1; for (let i = 0; i < r; i++) v *= n - i; return v; };

  // ---------- safe expression parser ----------
  const CONSTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2 };
  function funcs(deg) {
    const toRad = (x) => (deg ? (x * Math.PI) / 180 : x), toAng = (x) => (deg ? (x * 180) / Math.PI : x);
    return {
      sin: (x) => Math.sin(toRad(x)), cos: (x) => Math.cos(toRad(x)), tan: (x) => Math.tan(toRad(x)),
      asin: (x) => toAng(Math.asin(x)), acos: (x) => toAng(Math.acos(x)), atan: (x) => toAng(Math.atan(x)), atan2: (y, x) => toAng(Math.atan2(y, x)),
      sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
      ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2, floor: Math.floor, ceil: Math.ceil, round: Math.round, trunc: Math.trunc,
      sign: Math.sign, min: Math.min, max: Math.max, pow: Math.pow, mod: (a, b) => ((a % b) + b) % b, hypot: Math.hypot,
      deg: (x) => (x * 180) / Math.PI, rad: (x) => (x * Math.PI) / 180, fact, gamma, gcd, lcm: (a, b) => (a && b ? Math.abs(a * b) / gcd(a, b) : 0), ncr: nCr, npr: nPr,
    };
  }
  function tokenize(src) {
    const s = String(src).replace(/×|·/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, " pi ").replace(/√/g, " sqrt ").replace(/²/g, "^2").replace(/³/g, "^3").replace(/\*\*/g, "^");
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      let m;
      if ((m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i)))) { out.push({ t: "num", v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i)))) { out.push({ t: "id", v: m[0].toLowerCase() }); i += m[0].length; continue; }
      if ("+-*/^%!(),".includes(c)) { out.push({ t: c }); i++; continue; }
      throw new Error("Unexpected “" + c + "”");
    }
    return out;
  }
  // compile("2x+sin(x)", {deg:false}) returns f(env) -> number. env gives variables such as x.
  function compile(src, opts = {}) {
    const F = funcs(!!opts.deg), toks = tokenize(src); let p = 0;
    const peek = () => toks[p], next = () => toks[p++];
    const startsPrimary = (t) => t && (t.t === "num" || t.t === "id" || t.t === "(");
    function expr() { let l = term(); while (peek() && (peek().t === "+" || peek().t === "-")) { const op = next().t, r = term(), a = l; l = op === "+" ? (e) => a(e) + r(e) : (e) => a(e) - r(e); } return l; }
    function term() {
      let l = unary();
      for (;;) {
        const t = peek();
        if (t && (t.t === "*" || t.t === "/" || t.t === "%")) { next(); const r = unary(), a = l; l = t.t === "*" ? (e) => a(e) * r(e) : t.t === "/" ? (e) => a(e) / r(e) : (e) => a(e) % r(e); }
        else if (startsPrimary(t)) { const r = unary(), a = l; l = (e) => a(e) * r(e); }
        else break;
      }
      return l;
    }
    function unary() {
      const t = peek();
      if (t && t.t === "-") { next(); const r = unary(); return (e) => -r(e); }
      if (t && t.t === "+") { next(); return unary(); }
      return power();
    }
    function power() { const b = postfix(); if (peek() && peek().t === "^") { next(); const x = unary(); return (e) => Math.pow(b(e), x(e)); } return b; }
    function postfix() { let v = primary(); while (peek() && peek().t === "!") { next(); const a = v; v = (e) => fact(a(e)); } return v; }
    function primary() {
      const t = next();
      if (!t) throw new Error("Incomplete expression");
      if (t.t === "num") { const v = t.v; return () => v; }
      if (t.t === "(") { const v = expr(); if (!peek() || peek().t !== ")") throw new Error("Missing )"); next(); return v; }
      if (t.t === "id") {
        const name = t.v;
        if (F[name]) {
          let args;
          if (peek() && peek().t === "(") { next(); args = []; if (peek() && peek().t === ")") next(); else { for (;;) { args.push(expr()); if (peek() && peek().t === ",") { next(); continue; } break; } if (!peek() || peek().t !== ")") throw new Error("Missing )"); next(); } }
          else args = [power()];
          const f = F[name];
          return (e) => f(...args.map((a) => a(e)));
        }
        if (name in CONSTS) { const v = CONSTS[name]; return () => v; }
        return (e) => { if (e && name in e) return e[name]; throw new Error("Unknown name “" + name + "”"); };
      }
      throw new Error("Unexpected “" + t.t + "”");
    }
    if (!toks.length) throw new Error("Type a formula");
    const root = expr();
    if (p < toks.length) throw new Error("Unexpected “" + toks[p].t + (toks[p].v !== undefined ? toks[p].v : "") + "”");
    return root;
  }
  const evaluate = (src, env, opts) => compile(src, opts)(env || {});

  (window.SparkTools = window.SparkTools || []);
  window.SparkUI = { h, load, save, clean, uid, copy, download, fmt, compile, evaluate, fact, gcd, nCr, nPr, gamma };
})();
