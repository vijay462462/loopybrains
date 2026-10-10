// Loopy search ranking: finds the right knowledge pack even when the question is worded differently,
// has spelling mistakes, short forms (ff, mux, fsm) or joined/split words (flipflop, flip flop).
// Used after the exact key-phrase match, and on its own when that match is weak or wrong.
const STOP = new Set("a an the of in on for with and or to from by is are was be what whats which who how why when where define definition explain explanation tell me about notes note give write short long answer answers important point points exam exams question questions example examples with diagram diagrams easy simple words word meaning use uses used using study learn topic topics please pls vs versus between difference differences compare types type steps step working work does do can".split(" "));
const SYN = { ff: "flip flop", ffs: "flip flop", dff: "d flip flop", jkff: "jk flip flop", tff: "t flip flop", mux: "multiplexer", muxes: "multiplexer", demux: "demultiplexer", fsm: "finite state machine", cla: "carry lookahead", lut: "lookup table", luts: "lookup table", kmap: "karnaugh map", sop: "sum of products", pos: "product of sums", bcd: "binary coded decimal", alu: "arithmetic logic unit", sram: "static ram", dram: "dynamic ram", cpld: "complex programmable logic device", pld: "programmable logic device", hdl: "hardware description language", ckt: "circuit", ckts: "circuit", ic: "integrated circuit", rom: "read only memory", ram: "random access memory", ex: "example", adc: "analog to digital converter", dac: "digital to analog converter", opamp: "operational amplifier", cmos: "cmos", ttl: "ttl", cs: "chip select" };
const lev = (a, b) => { if (a === b) return 0; const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; };
const nrm = (t) => String(t || "").toLowerCase().replace(/[’']s\b/g, "s").replace(/[-_/]/g, " ").replace(/[^a-z0-9\s+]/g, " ").replace(/\s+/g, " ").trim();
const stem = (w) => w.length > 3 && /ies$/.test(w) ? w.slice(0, -3) + "y" : w.length > 4 && /(sses|xes|ches|shes)$/.test(w) ? w.slice(0, -2) : w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w) ? w.slice(0, -1) : w;
const words = (t) => nrm(t).split(" ").filter(Boolean);
// Words of a text, with joined neighbours added (flip + flop -> flipflop) so both spellings find each other.
function toks(text, joined) { const w = words(text).map(stem), out = new Set(w); if (joined) for (let i = 0; i + 1 < w.length; i++) if (w[i].length + w[i + 1].length <= 14) out.add(w[i] + w[i + 1]); return out; }
export function makeSearch(packs) {
  const df = new Map(), docs = packs.map(p => {
    const title = String(p.title || "").replace(/\s*\(.*?\)\s*/g, " "), T = toks(title, true), K = new Set(), B = new Set();
    for (const k of p.keys || []) toks(k, true).forEach(x => K.add(x));
    toks([p.short || "", ...(p.points || []).slice(0, 3)].join(" "), false).forEach(x => B.add(x));
    const all = new Set([...T, ...K, ...B]); all.forEach(x => df.set(x, (df.get(x) || 0) + 1));
    return { p, T, K, B, tw: words(title).map(stem), kp: (p.keys || []).map(k => " " + words(k).map(stem).join(" ") + " "), tp: " " + words(title).map(stem).join(" ") + " " };
  }), N = packs.length, idf = (x) => Math.log(1 + N / (df.get(x) || 0.5)), vocab = [...df.keys()].filter(x => x.length >= 4);
  function queryTokens(q) {
    let w = words(q); const ex = []; w.forEach(x => { if (SYN[x] && !df.has(stem(x))) ex.push(...words(SYN[x])); }); w = [...w, ...ex].map(stem).filter(x => !STOP.has(x));
    const out = new Set();
    for (const x of w) {
      if (df.has(x)) { out.add(x); continue; }
      let done = false;
      for (let i = 2; i < x.length - 1 && !done; i++) { const a = x.slice(0, i), b = x.slice(i); if (a.length > 1 && b.length > 1 && df.has(a) && df.has(b)) { out.add(a); out.add(b); done = true; } }   // flipflop -> flip + flop
      if (done) continue;
      if (x.length >= 4) { const lim = x.length <= 6 ? 1 : 2; let best = null, bd = 9; for (const v of vocab) { if (v[0] !== x[0]) continue; const d = lev(x, v); if (d < bd && d <= lim) { bd = d; best = v; } } if (best) { out.add(best); continue; } }
      out.add(x);
    }
    for (let i = 0; i + 1 < w.length; i++) { const j = w[i] + w[i + 1]; if (df.has(j)) out.add(j); }   // flip flop -> flipflop
    return out;
  }
  function rank(q, n) {
    const qt = queryTokens(q); if (!qt.size) return [];
    const qs = " " + words(q).map(stem).join(" ") + " ", res = [];
    for (const d of docs) {
      let s = 0, hit = 0, tk = 0;
      for (const x of qt) { const w = idf(x); if (d.T.has(x)) { s += 3 * w; hit++; tk++; } else if (d.K.has(x)) { s += 2.4 * w; hit++; tk++; } else if (d.B.has(x)) s += 0.5 * w; }
      if (!hit) continue;
      const tm = d.tw.filter(x => qt.has(x) || [...d.T].some(y => qt.has(y) && y.includes(x) && y !== x)).length; s += 6 * (tm / Math.max(1, d.tw.length));   // how much of the title the question covers
      if (d.tw.length > 1 && qs.includes(d.tp)) s += 8;   // the whole title is in the question
      let kb = 0; for (const k of d.kp) if (k.length > 3 && qs.includes(k)) kb = Math.max(kb, 3 + k.trim().split(" ").length * 2); s += kb;   // an exact key phrase
      res.push({ p: d.p, score: s, tk: tk / qt.size });
    }
    return res.sort((a, b) => b.score - a.score).slice(0, n || 5);
  }
  // How much of the question is made of words we really know (no spelling repair): stops "how to cook rice" from matching a pack.
  const cover = (q) => { const w = words(q).map(stem).filter(x => !STOP.has(x)), ex = w.filter(x => df.has(x) || SYN[x]); return w.length ? ex.length / w.length : 0; };
  return { rank, cover, best: (q) => { const r = rank(q, 2); return r.length ? { p: r[0].p, score: r[0].score, tk: r[0].tk, margin: r[0].score - (r[1] ? r[1].score : 0), sure: r[0].score >= 16 || (r[0].score >= 8 && r[0].tk > 0.5) } : null; } };
}
