// Loopy Brain solver: answers numeric and formula questions with steps. No outside service, no eval().
const fmt = (n) => { if (!isFinite(n)) return String(n); const r = Math.round(n * 1e10) / 1e10; return Math.abs(r) >= 1e15 || (Math.abs(r) < 1e-6 && r !== 0) ? r.toExponential(6) : String(r); };
const FN = { sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, ln: Math.log, log: Math.log10, log2: Math.log2, exp: Math.exp, sin: (x) => Math.sin(x * Math.PI / 180), cos: (x) => Math.cos(x * Math.PI / 180), tan: (x) => Math.tan(x * Math.PI / 180), asin: (x) => Math.asin(x) * 180 / Math.PI, acos: (x) => Math.acos(x) * 180 / Math.PI, atan: (x) => Math.atan(x) * 180 / Math.PI, floor: Math.floor, ceil: Math.ceil, round: Math.round };
const fact = (n) => { if (!Number.isInteger(n) || n < 0 || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
// Recursive descent parser. Variables: x (when vars given), pi, e.
export function evaluate(src, vars) {
  const s = String(src).toLowerCase().replace(/\s+/g, "").replace(/×|⋅/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/√/g, "sqrt").replace(/(\d)(?=[a-z(])(?!e[+-]?\d)/g, "$1*").replace(/\)(?=[\d(a-z])/g, ")*").replace(/\b(pi|e|x)(?=[\d(])/g, "$1*").replace(/(\d)%/g, "($1/100)");
  let i = 0;
  const peek = () => s[i];
  const num = () => { const m = /^\d*\.?\d+(?:e[+-]?\d+)?/.exec(s.slice(i)); if (!m) throw new Error("number expected"); i += m[0].length; return parseFloat(m[0]); };
  const prim = () => {
    let v;
    if (peek() === "(") { i++; v = add(); if (peek() !== ")") throw new Error("missing )"); i++; }
    else if (/[a-z]/.test(peek() || "")) {
      const m = /^[a-z][a-z0-9]*/.exec(s.slice(i)); let name = m[0];
      if (FN[name] && s[i + name.length] === "(") { i += name.length + 1; const a = add(); if (peek() !== ")") throw new Error("missing )"); i++; v = FN[name](a); }
      else { const nm = /^(pi|e|x)/.exec(name); if (!nm) throw new Error("unknown " + name); name = nm[1]; i += name.length; if (name === "pi") v = Math.PI; else if (name === "e") v = Math.E; else { if (!vars || !("x" in vars)) throw new Error("x unknown"); v = vars.x; } }
    } else v = num();
    while (peek() === "!") { i++; v = fact(v); }
    return v;
  };
  const un = () => { if (peek() === "-") { i++; return -un(); } if (peek() === "+") { i++; return un(); } return pow(); };
  const pow = () => { const b = prim(); if (peek() === "^" || (peek() === "*" && s[i + 1] === "*")) { i += peek() === "^" ? 1 : 2; return Math.pow(b, un()); } return b; };
  const mul = () => { let v = un(); for (;;) { const c = peek(); if (c === "*" && s[i + 1] !== "*") { i++; v *= un(); } else if (c === "/") { i++; v /= un(); } else return v; } };
  const add = () => { let v = mul(); for (;;) { const c = peek(); if (c === "+") { i++; v += mul(); } else if (c === "-") { i++; v -= mul(); } else return v; } };
  const out = add(); if (i < s.length) throw new Error("unexpected " + s[i]); return out;
}
const LEN = { mm: .001, cm: .01, m: 1, km: 1000, inch: .0254, in: .0254, ft: .3048, foot: .3048, feet: .3048, yard: .9144, yd: .9144, mile: 1609.344, miles: 1609.344, mi: 1609.344 };
const MASS = { mg: 1e-6, g: .001, kg: 1, quintal: 100, tonne: 1000, ton: 1000, lb: .45359237, pound: .45359237, pounds: .45359237, oz: .0283495 };
const TIME = { ms: .001, s: 1, sec: 1, second: 1, seconds: 1, min: 60, minute: 60, minutes: 60, hr: 3600, hour: 3600, hours: 3600, day: 86400, days: 86400, week: 604800, weeks: 604800 };
const DATA = { bit: 1, byte: 8, bytes: 8, kb: 8192, mb: 8388608, gb: 8589934592, tb: 8796093022208 };
const VOL = { ml: .001, l: 1, litre: 1, liter: 1, litres: 1, liters: 1, gallon: 3.78541 };
const SPEED = { "m/s": 1, "km/h": 1 / 3.6, kmph: 1 / 3.6, kmh: 1 / 3.6, mph: .44704 };
const GROUPS = [["length", LEN], ["mass", MASS], ["time", TIME], ["data", DATA], ["volume", VOL], ["speed", SPEED]];
function convert(t) {
  const m = /(-?\d+(?:\.\d+)?)\s*(?:degrees?\s*)?([a-z/°]+)\s*(?:to|in|into|=|->)\s*([a-z/°]+)/.exec(t.replace(/°/g, ""));
  if (!m) return null; const v = parseFloat(m[1]); let a = m[2].replace(/^degrees?/, ""), b = m[3];
  const T = { c: "c", celsius: "c", f: "f", fahrenheit: "f", k: "k", kelvin: "k" };
  if (T[a] && T[b]) { const c = T[a] === "c" ? v : T[a] === "f" ? (v - 32) * 5 / 9 : v - 273.15, r = T[b] === "c" ? c : T[b] === "f" ? c * 9 / 5 + 32 : c + 273.15; return "## Temperature conversion\n" + v + " °" + T[a].toUpperCase() + " = **" + fmt(r) + " °" + T[b].toUpperCase() + "**\n\n- Celsius to Fahrenheit: F = C × 9/5 + 32\n- Celsius to Kelvin: K = C + 273.15"; }
  for (const [name, tab] of GROUPS) if (tab[a] && tab[b]) { const r = v * tab[a] / tab[b]; return "## " + name[0].toUpperCase() + name.slice(1) + " conversion\n" + v + " " + a + " = **" + fmt(r) + " " + b + "**\n\n- Step 1: convert to the base unit: " + v + " × " + fmt(tab[a]) + " = " + fmt(v * tab[a]) + "\n- Step 2: divide by the target unit size: ÷ " + fmt(tab[b]); }
  return null;
}
function bases(t) {
  let m = /(?:convert\s+)?(\d+)\s*(?:in|to)\s*(binary|hex|hexadecimal|octal)/.exec(t) || /(binary|hex|hexadecimal|octal)\s*(?:of|for)\s*(\d+)/.exec(t);
  if (m) { const isNum = /^\d+$/.test(m[1]), n = parseInt(isNum ? m[1] : m[2], 10), b = isNum ? m[2] : m[1], r = { binary: 2, hex: 16, hexadecimal: 16, octal: 8 }[b]; return "## " + n + " in " + b + "\n**" + n.toString(r).toUpperCase() + "**\n\n- Divide by " + r + " repeatedly and read the remainders from bottom to top.\n- Check: " + n.toString(r).toUpperCase() + " (base " + r + ") = " + n + " (base 10)"; }
  m = /([01]+|[0-9a-f]+)\s*(?:from\s+)?(binary|hex|hexadecimal|octal)\s*(?:to\s*decimal)?/.exec(t) || /(?:binary|hex|octal)\s+([0-9a-f]+)\s+to\s+decimal/.exec(t);
  if (m && /decimal|to dec/.test(t)) { const b = /binary/.test(t) ? 2 : /octal/.test(t) ? 8 : 16, d = parseInt(m[1], b); if (!isNaN(d)) return "## " + m[1].toUpperCase() + " (base " + b + ") in decimal\n**" + d + "**\n\n- Multiply each digit by the power of " + b + " for its place and add them."; }
  return null;
}
const nums = (t) => (t.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
function numberTheory(t) {
  let m;
  if ((m = /\b(gcd|hcf)\b/.exec(t)) || /\blcm\b/.test(t)) { const n = nums(t); if (n.length >= 2) { const g = n.reduce(gcd), l = n.reduce((a, b) => Math.abs(a * b) / gcd(a, b)); return /lcm/.test(t) ? "## LCM of " + n.join(", ") + "\n**" + l + "**\n\n- LCM(a, b) = a × b / GCD(a, b), and GCD = " + g : "## GCD (HCF) of " + n.join(", ") + "\n**" + g + "**\n\n- Euclid: repeat (a, b) → (b, a mod b) until b = 0."; } }
  if ((m = /factorial of (\d+)|(\d+)\s*!/.exec(t))) { const n = parseInt(m[1] || m[2], 10); return "## " + n + "!\n**" + fmt(fact(n)) + "**\n\n- " + n + "! = " + (n > 1 && n < 12 ? Array.from({ length: n }, (_, i) => n - i).join(" × ") : "the product of all whole numbers from 1 to " + n); }
  if ((m = /is (\d+) (?:a )?prime/.exec(t))) { const n = parseInt(m[1], 10); let d = 0; for (let i = 2; i * i <= n; i++) if (n % i === 0) { d = i; break; } return "## Is " + n + " prime?\n**" + (n > 1 && !d ? "Yes" : "No") + "**" + (d ? "\n\n- " + n + " = " + d + " × " + n / d : n > 1 ? "\n\n- No whole number from 2 to √" + n + " divides it." : ""); }
  if ((m = /prime factors? of (\d+)/.exec(t))) { let n = parseInt(m[1], 10); const f = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } if (n > 1) f.push(n); return "## Prime factors of " + m[1] + "\n**" + f.join(" × ") + "**"; }
  return null;
}
function stats(t) {
  const m = /\b(mean|average|median|mode|standard deviation|variance|range)\b/.exec(t); if (!m) return null; const n = nums(t.replace(/^.*?\bof\b/, "")); if (n.length < 2) return null;
  const sum = n.reduce((a, b) => a + b, 0), mean = sum / n.length, sorted = [...n].sort((a, b) => a - b), mid = Math.floor(n.length / 2), med = n.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2, varr = n.reduce((a, b) => a + (b - mean) ** 2, 0) / n.length;
  const cnt = {}; n.forEach(v => cnt[v] = (cnt[v] || 0) + 1); const top = Math.max(...Object.values(cnt)), modes = Object.keys(cnt).filter(k => cnt[k] === top);
  const L = ["## Statistics of " + n.join(", "), "- **Mean:** " + n.join(" + ") + " = " + fmt(sum) + ", divided by " + n.length + " = **" + fmt(mean) + "**", "- **Median:** " + fmt(med), "- **Mode:** " + (top > 1 ? modes.join(", ") : "no repeated value"), "- **Range:** " + fmt(sorted[sorted.length - 1] - sorted[0]), "- **Variance (population):** " + fmt(varr), "- **Standard deviation:** " + fmt(Math.sqrt(varr))];
  return L.join("\n");
}
function interest(t) {
  if (!/interest/.test(t)) return null; const get = (k) => { const m = new RegExp("\\b" + k + "\\s*=?\\s*(\\d+(?:\\.\\d+)?)").exec(t); return m ? parseFloat(m[1]) : null; };
  let P = get("p") ?? get("principal"), R = get("r") ?? get("rate"), T = get("t") ?? get("time"); if (P == null || R == null || T == null) { const n = nums(t); if (n.length >= 3) [P, R, T] = n; else return null; }
  const si = P * R * T / 100, ci = P * Math.pow(1 + R / 100, T) - P;
  return "## Interest on ₹" + P + " at " + R + "% for " + T + " years\n- **Simple interest** = P×R×T/100 = " + P + "×" + R + "×" + T + "/100 = **" + fmt(si) + "** (amount " + fmt(P + si) + ")\n- **Compound interest** (yearly) = P(1 + R/100)^T − P = **" + fmt(ci) + "** (amount " + fmt(P + ci) + ")";
}
function equation(t) {
  const m = /^(?:solve|find x|find the roots? of|roots? of)?\s*:?\s*([^=]+)=([^=]+)$/.exec(t); if (!m || !/x/.test(m[0])) return null;
  const f = (x) => evaluate(m[1], { x }) - evaluate(m[2], { x });
  let c, b, a; try { c = f(0); const p = f(1), q = f(-1); a = (p + q - 2 * c) / 2; b = (p - q) / 2; if (Math.abs(f(2) - (4 * a + 2 * b + c)) > 1e-6 || Math.abs(f(3) - (9 * a + 3 * b + c)) > 1e-6) return null; } catch (_) { return null; }
  const A = fmt(a), B = fmt(b), C = fmt(c), L = ["## Solve: " + m[1].trim() + " = " + m[2].trim()];
  if (Math.abs(a) < 1e-9) { if (Math.abs(b) < 1e-9) return L.concat([Math.abs(c) < 1e-9 ? "True for every x." : "No solution."]).join("\n"); L.push("Bring everything to one side: " + B + "x + (" + C + ") = 0", "Then x = −(" + C + ") / " + B, "**x = " + fmt(-c / b) + "**"); return L.join("\n"); }
  const D = b * b - 4 * a * c; L.push("Standard form: " + A + "x² + (" + B + ")x + (" + C + ") = 0", "Discriminant D = b² − 4ac = " + fmt(D));
  if (D > 0) L.push("D > 0, so two real roots: x = (−b ± √D) / 2a", "**x = " + fmt((-b + Math.sqrt(D)) / (2 * a)) + "  or  x = " + fmt((-b - Math.sqrt(D)) / (2 * a)) + "**"); else if (D === 0) L.push("D = 0, so one repeated root", "**x = " + fmt(-b / (2 * a)) + "**"); else L.push("D < 0, so no real roots. The complex roots are", "**x = " + fmt(-b / (2 * a)) + " ± " + fmt(Math.sqrt(-D) / (2 * a)) + "i**");
  return L.join("\n");
}
export const FORMULAS = [
  ["ohm", "Ohm's law", "V = I × R (voltage = current × resistance)"], ["power", "Electrical power", "P = V × I = I²R = V²/R"], ["newton", "Newton's second law", "F = m × a"], ["kinetic", "Kinetic energy", "KE = ½ m v²"], ["potential", "Potential energy", "PE = m g h"], ["velocity", "Speed", "speed = distance / time"], ["work", "Work", "W = F × d × cosθ"], ["pressure", "Pressure", "P = F / A"], ["density", "Density", "ρ = mass / volume"], ["momentum", "Momentum", "p = m × v"],
  ["equations of motion", "Equations of motion", "v = u + at;  s = ut + ½at²;  v² = u² + 2as"], ["area of circle", "Area of a circle", "A = πr²"], ["circumference", "Circumference", "C = 2πr"], ["pythagoras", "Pythagoras theorem", "a² + b² = c²"], ["quadratic", "Quadratic formula", "x = (−b ± √(b² − 4ac)) / 2a"], ["volume of sphere", "Volume of a sphere", "V = (4/3)πr³"], ["slope", "Slope of a line", "m = (y₂ − y₁) / (x₂ − x₁)"], ["distance", "Distance formula", "d = √((x₂−x₁)² + (y₂−y₁)²)"],
  ["time complexity", "Big-O quick guide", "O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)"], ["binary search", "Binary search", "Time O(log n). The array must be sorted. Compare the middle, then discard half."], ["bubble sort", "Bubble sort", "Time O(n²) worst case, O(n) best case, space O(1)."], ["demorgan", "De Morgan's laws", "(A·B)' = A' + B'   and   (A+B)' = A'·B'"], ["nyquist", "Nyquist sampling", "fs ≥ 2 × fmax"], ["gain", "Decibel gain", "dB = 20 log10(Vout/Vin) = 10 log10(Pout/Pin)"], ["capacitor", "Capacitor energy", "E = ½ C V²,  Q = C V"], ["inductor", "Inductor", "V = L di/dt,  E = ½ L I²"], ["rc time constant", "RC time constant", "τ = R × C"], ["sin", "Trig identities", "sin²θ + cos²θ = 1;  sin(A+B) = sinA cosB + cosA sinB"], ["derivative", "Derivative rules", "d/dx(xⁿ) = n xⁿ⁻¹;  product: (uv)' = u'v + uv';  chain: f(g(x))' = f'(g)·g'"], ["integral", "Integral rules", "∫xⁿ dx = xⁿ⁺¹/(n+1) + C;  ∫eˣ dx = eˣ + C;  ∫1/x dx = ln|x| + C"],
];
function formula(t) {
  if (!/formula|equation|law|theorem|rule|identity|complexity|derivative|integral/.test(t)) return null;
  const has = (w) => new RegExp("(^|[^a-z])" + String(w).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z])").test(t);
  const hits = FORMULAS.filter(([k, n]) => has(k) || has(n)); if (!hits.length) return null;
  return "## " + (hits.length > 1 ? "Formulas" : hits[0][1]) + "\n" + hits.slice(0, 4).map(([, n, f]) => "- **" + n + ":** " + f).join("\n");
}
export function solve(text) {
  const raw = String(text || "").trim(), t = raw.toLowerCase().replace(/[?]+$/, "").trim();
  if (!t) return null;
  const r = interest(t) || stats(t) || numberTheory(t) || bases(t) || convert(t) || equation(t.replace(/^(solve|find|calculate)\s+/, "")) || formula(t);
  if (r) return r;
  const expr = t.replace(/^(what is|what's|calculate|compute|evaluate|find|simplify|value of)\s+/, "").replace(/\s*=\s*\??$/, "").trim();
  if (/^[0-9a-z\s+\-*/^().,%!×÷π√]+$/.test(expr) && /\d/.test(expr) && /[+\-*/^!%(]|sqrt|sin|cos|tan|log|ln|exp|abs/.test(expr) && !/[a-df-wyz]{4,}/.test(expr.replace(/sqrt|sin|cos|tan|log|ln|exp|abs|asin|acos|atan|cbrt|floor|ceil|round/g, ""))) {
    try { const v = evaluate(expr); if (typeof v === "number" && !isNaN(v)) return "## " + raw.replace(/\?$/, "") + "\n**" + fmt(v) + "**" + (/sin|cos|tan/.test(expr) ? "\n\nAngles are in degrees." : "") + "\n\n- Order of work: brackets, powers, then × ÷, then + −."; } catch (_) {}
  }
  return null;
}
