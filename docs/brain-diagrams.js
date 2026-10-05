// Loopy's own logic and circuit diagrams: coloured gate symbols, wires and boxes drawn as SVG. No internet needed.
const NS = "http://www.w3.org/2000/svg";
const mk = (tag, a, ...k) => { const n = document.createElementNS(NS, tag); for (const x in a || {}) n.setAttribute(x, a[x]); k.forEach(c => n.append(typeof c === "string" ? document.createTextNode(c) : c)); return n; };
class Cv {
  constructor(w, h, title) { this.root = mk("svg", { viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": title, class: "dg-svg" }); this.g = mk("g"); this.root.append(this.g); }
  add(n) { this.g.append(n); return n; }
  wire(pts, cls, arrow) { this.add(mk("polyline", { points: pts.map(p => p.join(",")).join(" "), class: "dg-w " + (cls || "in") })); if (arrow) { const [x, y] = pts[pts.length - 1], [px, py] = pts[pts.length - 2], dx = Math.sign(x - px), dy = Math.sign(y - py), bx = x - 8 * dx, by = y - 8 * dy; this.add(mk("path", { d: "M" + x + " " + y + "L" + (bx - 4 * dy) + " " + (by + 4 * dx) + "L" + (bx + 4 * dy) + " " + (by - 4 * dx) + "Z", class: "dg-ar " + (cls || "in") })); } }
  dot(x, y, cls) { this.add(mk("circle", { cx: x, cy: y, r: 3.2, class: "dg-dot " + (cls || "in") })); }
  txt(x, y, t, o) { o = o || {}; const n = this.add(mk("text", { x, y, "text-anchor": o.a || "start", class: "dg-t " + (o.c || "") }, t)); return n; }
  box(x, y, w, h, label, cls, o) { this.add(mk("rect", { x, y, width: w, height: h, rx: 8, class: "dg-box " + (cls || "ff") })); String(label).split("|").forEach((l, i, a) => this.add(mk("text", { x: x + w / 2, y: y + h / 2 + 4 + (i - (a.length - 1) / 2) * 14, "text-anchor": "middle", class: "dg-bt" }, l))); if (o && o.clk) this.add(mk("path", { d: "M" + x + " " + (y + h - 20) + "l10 6l-10 6", class: "dg-clk" })); }
  // gate symbols: returns pin positions {a, b, o}
  gate(type, x, y, cap) {
    const P = { and: "M0 0H22A20 20 0 0 1 22 40H0Z", nand: "M0 0H22A20 20 0 0 1 22 40H0Z", or: "M0 0C16 0 34 6 46 20C34 34 16 40 0 40C9 28 9 12 0 0Z", nor: "M0 0C16 0 34 6 46 20C34 34 16 40 0 40C9 28 9 12 0 0Z", xor: "M0 0C16 0 34 6 46 20C34 34 16 40 0 40C9 28 9 12 0 0Z", xnor: "M0 0C16 0 34 6 46 20C34 34 16 40 0 40C9 28 9 12 0 0Z", not: "M0 0L34 20L0 40Z" }[type];
    const g = this.add(mk("g", { transform: "translate(" + x + " " + y + ")" })); g.append(mk("path", { d: P, class: "dg-gate g-" + type }));
    const bubble = /^(nand|nor|xnor|not)$/.test(type), w = { and: 42, nand: 42, or: 46, nor: 46, xor: 46, xnor: 46, not: 34 }[type];
    if (/^x/.test(type)) g.append(mk("path", { d: "M-7 0C2 12 2 28 -7 40", class: "dg-xo g-" + type }));
    if (bubble) g.append(mk("circle", { cx: w + 4, cy: 20, r: 4, class: "dg-bub g-" + type }));
    if (cap) { const t = mk("text", { x: w / 2 + (/^x/.test(type) ? 0 : 0), y: 54, "text-anchor": "middle", class: "dg-cap" }, cap); g.append(t); }
    const xin = type === "and" || type === "nand" || type === "not" ? 0 : /^x/.test(type) ? -2 : 4, out = w + (bubble ? 8 : 0);
    return type === "not" ? { a: [x, y + 20], o: [x + out, y + 20] } : { a: [x + xin, y + 10], b: [x + xin, y + 30], o: [x + out, y + 20] };
  }
}
const done = (c) => c.root;
const stub = (c, p, label, side) => { /* short labelled input stub */ };
function circuitHeader() { }
const D = {};
D.gates = { title: "The 7 logic gates", cap: "Each gate has its own symbol and rule. A small circle on the output means NOT.", draw() {
  const c = new Cv(360, 250, "Logic gate symbols"), items = [["and", "AND", "Y = A·B"], ["or", "OR", "Y = A+B"], ["not", "NOT", "Y = A’"], ["nand", "NAND", "Y = (A·B)’"], ["nor", "NOR", "Y = (A+B)’"], ["xor", "XOR", "Y = A⊕B"], ["xnor", "XNOR", "Y = (A⊕B)’"]];
  items.forEach(([t, n, f], i) => { const col = i % 4, row = Math.floor(i / 4), x = 22 + col * 86, y = 12 + row * 112, p = c.gate(t, x + 4, y + 8); if (t === "not") c.wire([[x - 8, p.a[1]], [p.a[0], p.a[1]]], "in"); else { c.wire([[x - 8, p.a[1]], p.a], "in"); c.wire([[x - 8, p.b[1]], p.b], "in"); } c.wire([p.o, [p.o[0] + 12, p.o[1]]], "out"); c.txt(x + 26, y + 70, n, { a: "middle", c: "b" }); c.txt(x + 26, y + 85, f, { a: "middle", c: "s" }); });
  return done(c); } };
D.halfadder = { title: "Half adder circuit", cap: "XOR gives the Sum, AND gives the Carry.", draw() {
  const c = new Cv(370, 170, "Half adder circuit"); c.txt(6, 44, "A", { c: "b" }); c.txt(6, 124, "B", { c: "b" });
  const x = c.gate("xor", 150, 20), n = c.gate("and", 150, 100); c.wire([[24, 40], [100, 40], [100, 30], x.a], "in"); c.wire([[100, 40], [100, 110], n.a], "in"); c.wire([[24, 120], [70, 120], [70, 50], x.b], "in"); c.wire([[70, 120], [70, 130], n.b], "in"); c.dot(100, 40); c.dot(70, 120);
  c.wire([x.o, [300, x.o[1]]], "out", true); c.txt(306, x.o[1] + 4, "Sum", { c: "g" }); c.wire([n.o, [300, n.o[1]]], "out", true); c.txt(306, n.o[1] + 4, "Carry", { c: "g" }); c.txt(185, 162, "Sum = A\u2295B     Carry = A\u00B7B", { a: "middle", c: "s" }); return done(c); } };
D.fulladder = { title: "Full adder circuit", cap: "Two half adders and an OR gate. Cin is the carry coming in from the previous stage.", draw() {
  const c = new Cv(410, 215, "Full adder circuit"); c.txt(4, 34, "A", { c: "b" }); c.txt(4, 54, "B", { c: "b" }); c.txt(0, 164, "Cin", { c: "m" });
  const x1 = c.gate("xor", 80, 20), a1 = c.gate("and", 80, 90), x2 = c.gate("xor", 200, 40), a2 = c.gate("and", 200, 110), o = c.gate("or", 275, 100);
  c.wire([[24, 30], x1.a], "in"); c.wire([[50, 30], [50, 100], a1.a], "in"); c.dot(50, 30); c.wire([[24, 50], x1.b], "in"); c.wire([[38, 50], [38, 120], a1.b], "in"); c.dot(38, 50);
  c.wire([x1.o, [160, x1.o[1]], [160, 50], x2.a], "mid"); c.wire([[160, 50], [160, 120], a2.a], "mid"); c.dot(160, 50, "mid");
  c.wire([[24, 160], [182, 160], [182, 70], x2.b], "clk"); c.wire([[182, 140], a2.b], "clk"); c.dot(182, 140, "clk");
  c.wire([a1.o, [140, a1.o[1]], [140, 192], [262, 192], [262, o.a[1]], o.a], "mid"); c.wire([a2.o, [262, a2.o[1]], [262, o.b[1]], o.b], "mid");
  c.wire([x2.o, [350, x2.o[1]]], "out", true); c.txt(352, x2.o[1] + 4, "Sum", { c: "g" }); c.wire([o.o, [350, o.o[1]]], "out", true); c.txt(352, o.o[1] + 4, "Cout", { c: "g" });
  c.txt(190, 208, "Sum = A⊕B⊕Cin     Cout = AB + Cin(A⊕B)", { a: "middle", c: "s" }); return done(c); } };
D.nand_univ = { title: "NAND is a universal gate", cap: "NOT, AND and OR can all be built from NAND gates only.", draw() {
  const c = new Cv(380, 290, "NAND universal gate"); const lab = (y, t) => c.txt(4, y, t, { c: "b" });
  lab(18, "NOT from NAND: tie the inputs together"); let p = c.gate("nand", 120, 28); c.txt(10, 62, "A", { c: "b" }); c.wire([[26, 58], [70, 58]], "in"); c.wire([[70, 58], [70, p.a[1]], p.a], "in"); c.wire([[70, 58], [70, p.b[1]], p.b], "in"); c.dot(70, 58); c.wire([p.o, [260, p.o[1]]], "out", true); c.txt(266, p.o[1] + 4, "A’", { c: "g" });
  lab(108, "AND from NAND: NAND then NAND-as-NOT"); p = c.gate("nand", 70, 118); const q = c.gate("nand", 170, 118); c.txt(10, 132, "A", { c: "b" }); c.wire([[24, 128], p.a], "in"); c.txt(10, 152, "B", { c: "b" }); c.wire([[24, 148], p.b], "in"); c.wire([p.o, [150, p.o[1]], [150, q.a[1]], q.a], "mid"); c.wire([[150, p.o[1]], [150, q.b[1]], q.b], "mid"); c.dot(150, p.o[1], "mid"); c.wire([q.o, [300, q.o[1]]], "out", true); c.txt(306, q.o[1] + 4, "A·B", { c: "g" });
  lab(200, "OR from NAND: NOT each input, then NAND"); const n1 = c.gate("nand", 70, 208), n2 = c.gate("nand", 70, 256), n3 = c.gate("nand", 190, 232);
  return done(c); } };
D.srlatch = { title: "SR latch from NOR gates", cap: "Two cross-coupled NOR gates remember one bit. S = 1 sets Q, R = 1 resets Q.", draw() {
  const c = new Cv(340, 170, "SR latch"); const n1 = c.gate("nor", 110, 20), n2 = c.gate("nor", 110, 100); c.txt(6, 34, "R", { c: "b" }); c.txt(6, 134, "S", { c: "b" });
  c.wire([[24, 30], n1.a], "in"); c.wire([[24, 130], n2.b], "in"); c.wire([n1.o, [185, 40], [185, 75], [90, 75], [90, 110], n2.a], "fb"); c.wire([n2.o, [205, 120], [205, 90], [80, 90], [80, 50], n1.b], "fb");
  c.wire([[185, 40], [300, 40]], "out", true); c.txt(304, 44, "Q", { c: "g" }); c.wire([[205, 120], [300, 120]], "out", true); c.txt(304, 124, "Q̅", { c: "g" }); c.dot(185, 40, "fb"); c.dot(205, 120, "fb"); c.txt(170, 162, "S=1,R=0 → Q=1    S=0,R=1 → Q=0    S=R=0 → holds", { a: "middle", c: "s" }); return done(c); } };
D.ffsym = { title: "Flip-flop symbols", cap: "SR, D, JK and T flip-flops. The small triangle marks the clock input (edge triggered).", draw() {
  const c = new Cv(392, 170, "Flip-flop symbols"); [["SR", "S", "R"], ["D", "D", ""], ["JK", "J", "K"], ["T", "T", ""]].forEach(([n, a, b], i) => { const x = 8 + i * 96; c.box(x + 22, 26, 50, 80, n, "ff", { clk: true }); c.txt(x, 50, a, { c: "b" }); c.wire([[x + 10, 46], [x + 22, 46]], "in"); if (b) { c.txt(x, 84, b, { c: "b" }); c.wire([[x + 10, 80], [x + 22, 80]], "in"); } c.wire([[x + 72, 46], [x + 86, 46]], "out"); c.txt(x + 76, 40, "Q", { c: "g" }); c.wire([[x + 72, 90], [x + 86, 90]], "out"); c.txt(x + 76, 84, "Q\u0305", { c: "g" }); c.txt(x + 28, 126, "CLK", { c: "m" }); c.txt(x + 47, 150, n === "SR" ? "S=R=1 not allowed" : n === "JK" ? "J=K=1 toggles" : n === "D" ? "Q = D" : "T=1 toggles", { a: "middle", c: "s" }); }); return done(c); } };
D.timing = { title: "D flip-flop timing diagram", cap: "Q copies D at every rising clock edge and holds it until the next edge.", draw() {
  const P = 44, x0 = 56, n = 6, c = new Cv(x0 + n * P + 10, 190, "Timing diagram"), D2 = [1, 1, 0, 0, 1, 0]; c.txt(4, 40, "CLK", { c: "m" }); c.txt(4, 100, "D", { c: "b" }); c.txt(4, 160, "Q", { c: "g" });
  let pts = []; for (let i = 0; i < n; i++) { pts.push([x0 + i * P, 56], [x0 + i * P, 24], [x0 + i * P + P / 2, 24], [x0 + i * P + P / 2, 56]); } pts.push([x0 + n * P, 56]); c.wire(pts, "clk");
  const lvl = (b, y1, y0) => b ? y1 : y0; pts = []; for (let i = 0; i < n; i++) { const xs = x0 + i * P - P / 4 + (i ? 0 : P / 4), xe = x0 + (i + 1) * P - P / 4, y = lvl(D2[i], 84, 116); pts.push([xs, y], [Math.min(xe, x0 + n * P), y]); if (i < n - 1) pts.push([Math.min(xe, x0 + n * P), lvl(D2[i + 1], 84, 116)]); } c.wire(pts, "in");
  pts = []; for (let i = 0; i < n; i++) { const xs = x0 + i * P, xe = x0 + (i + 1) * P, y = lvl(D2[i], 144, 176); pts.push([xs, y], [xe, y]); if (i < n - 1) pts.push([xe, lvl(D2[i + 1], 144, 176)]); } c.wire(pts, "out");
  for (let i = 0; i < n; i++) c.add(mk("line", { x1: x0 + i * P, y1: 20, x2: x0 + i * P, y2: 182, class: "dg-grid" })); return done(c); } };
D.ripple = { title: "3-bit ripple (asynchronous) counter", cap: "Each flip-flop clocks the next one. Q0 toggles fastest, Q2 slowest, so the count goes 000, 001, 010 \u2026 111.", draw() {
  const c = new Cv(380, 150, "Ripple counter"); c.txt(2, 86, "CLK", { c: "m" }); c.wire([[34, 82], [76, 82]], "clk");
  [0, 1, 2].forEach(i => { const x = 76 + i * 104; c.box(x, 26, 56, 70, "T FF", "ff", { clk: true }); c.wire([[x - 12, 44], [x, 44]], "in"); c.txt(x - 14, 40, "1", { a: "end", c: "b" }); c.wire([[x + 56, 44], [x + 76, 44]], "out"); c.dot(x + 66, 44, "out"); c.txt(x + 60, 62, "Q" + i, { c: "g" });
    if (i < 2) c.wire([[x + 66, 44], [x + 66, 118], [x + 90, 118], [x + 90, 82], [x + 104, 82]], "clk"); else c.wire([[x + 56, 44], [x + 76, 44]], "out", true); });
  c.txt(190, 142, "T = 1 on every flip-flop. Q2 Q1 Q0 count up: 000 \u2192 001 \u2192 010 \u2192 011 \u2192 \u2026", { a: "middle", c: "s" }); return done(c); } };
D.sipo = { title: "4-bit shift register (serial in, parallel out)", cap: "A new bit enters at D on each clock edge. The bits move one flip-flop to the right.", draw() {
  const c = new Cv(380, 160, "Shift register"); c.txt(2, 54, "Din", { c: "b" }); [0, 1, 2, 3].forEach(i => { const x = 40 + i * 82; c.box(x, 28, 50, 56, "D FF", "ff", { clk: true }); c.wire([[i ? x - 32 : 28, 44], [x, 44]], "in"); c.wire([[x + 50, 44], [x + 82 - 32, 44]], i < 3 ? "mid" : "out"); c.dot(x + 62, 44, "mid"); c.wire([[x + 62, 44], [x + 62, 104]], "out", true); c.txt(x + 62, 120, "Q" + i, { a: "middle", c: "g" }); c.wire([[x + 8, 84], [x + 8, 140]], "clk"); c.dot(x + 8, 140, "clk"); });
  c.wire([[48, 140], [330, 140]], "clk"); c.txt(336, 144, "CLK", { c: "m" }); return done(c); } };
D.kmap4 = { title: "4-variable Karnaugh map", cap: "F(A,B,C,D) = Σm(0,1,4,5,10,11,14,15). The blue group gives A’C’, the green group gives AC, so F = A’C’ + AC.", draw() {
  const c = new Cv(330, 230, "Karnaugh map"), x0 = 76, y0 = 52, cw = 52, ch = 38, g = [0, 1, 3, 2], ones = new Set([0, 1, 4, 5, 10, 11, 14, 15]);
  c.txt(x0 + 2 * cw, 18, "CD", { a: "middle", c: "b" }); c.txt(16, y0 + 2 * ch + 4, "AB", { c: "b" });
  c.add(mk("rect", { x: x0 + 2, y: y0 + 2, width: 2 * cw - 4, height: 2 * ch - 4, rx: 10, class: "dg-grp g1" })); c.add(mk("rect", { x: x0 + 2 * cw + 2, y: y0 + 2 * ch + 2, width: 2 * cw - 4, height: 2 * ch - 4, rx: 10, class: "dg-grp g2" }));
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const m = (g[r] << 2) | g[k], x = x0 + k * cw, y = y0 + r * ch; c.add(mk("rect", { x, y, width: cw, height: ch, class: "dg-cell" })); c.txt(x + cw / 2, y + ch / 2 + 6, ones.has(m) ? "1" : "0", { a: "middle", c: ones.has(m) ? "one" : "zero" }); c.txt(x + cw - 4, y + 11, String(m), { a: "end", c: "mn" }); }
  ["00", "01", "11", "10"].forEach((l, i) => { c.txt(x0 + i * cw + cw / 2, y0 - 6, l, { a: "middle", c: "m" }); c.txt(x0 - 8, y0 + i * ch + ch / 2 + 4, l, { a: "end", c: "m" }); }); return done(c); } };
D.place = { title: "Binary place values", cap: "Add the place values where the bit is 1: 8 + 2 + 1 = 11. So 1011₂ = 11₁₀.", draw() {
  const c = new Cv(360, 130, "Binary place values"), w = [128, 64, 32, 16, 8, 4, 2, 1], bits = [0, 0, 0, 0, 1, 0, 1, 1]; w.forEach((v, i) => { const x = 14 + i * 42; c.box(x, 16, 38, 34, String(v), bits[i] ? "ff" : "off"); c.box(x, 56, 38, 34, String(bits[i]), bits[i] ? "on" : "off"); });
  c.txt(180, 116, "1011 → 8 + 2 + 1 = 11", { a: "middle", c: "b" }); return done(c); } };
D.mux2 = { title: "2-to-1 multiplexer with gates", cap: "Y = S’·I0 + S·I1. A NOT gate, two AND gates and an OR gate.", draw() {
  const c = new Cv(360, 190, "Multiplexer circuit"); c.txt(2, 34, "I0", { c: "b" }); c.txt(2, 104, "I1", { c: "b" }); c.txt(2, 164, "S", { c: "m" });
  const inv = c.gate("not", 60, 144), a1 = c.gate("and", 150, 20), a2 = c.gate("and", 150, 90), o = c.gate("or", 240, 60);
  c.wire([[24, 30], a1.a], "in"); c.wire([[24, 100], a2.a], "in"); c.wire([[24, 164], inv.a], "clk"); c.wire([[40, 164], [40, 120], a2.b], "clk"); c.dot(40, 164, "clk"); c.wire([inv.o, [125, 164], [125, 50], a1.b], "mid");
  c.wire([a1.o, [220, a1.o[1]], [220, o.a[1]], o.a], "mid"); c.wire([a2.o, [220, a2.o[1]], [220, o.b[1]], o.b], "mid"); c.wire([o.o, [330, o.o[1]]], "out", true); c.txt(334, o.o[1] + 4, "Y", { c: "g" }); return done(c); } };
D.dec24 = { title: "2-to-4 decoder with gates", cap: "Each AND gate recognises one input combination, so exactly one output is 1.", draw() {
  const c = new Cv(360, 250, "Decoder circuit"), rails = [["A’", 80], ["A", 110], ["B’", 140], ["B", 170]]; rails.forEach(([t, x]) => { c.txt(x, 22, t, { a: "middle", c: "b" }); c.wire([[x, 30], [x, 232]], "in"); });
  [[0, 80, 140], [1, 80, 170], [2, 110, 140], [3, 110, 170]].forEach(([k, xa, xb]) => { const y = 36 + k * 52, p = c.gate("and", 220, y); c.wire([[xa, p.a[1]], p.a], "mid"); c.wire([[xb, p.b[1]], p.b], "mid"); c.dot(xa, p.a[1], "mid"); c.dot(xb, p.b[1], "mid"); c.wire([p.o, [320, p.o[1]]], "out", true); c.txt(324, p.o[1] + 4, "Y" + k, { c: "g" }); }); return done(c); } };
D.halfsub = { title: "Half subtractor circuit", cap: "Difference = A\u2295B. Borrow = A\u2019\u00B7B (borrow when B is bigger than A).", draw() {
  const c = new Cv(400, 170, "Half subtractor"); c.txt(6, 44, "A", { c: "b" }); c.txt(6, 124, "B", { c: "b" }); const x = c.gate("xor", 190, 20), inv = c.gate("not", 90, 90), n = c.gate("and", 190, 100);
  c.wire([[24, 40], [60, 40], [60, 30], x.a], "in"); c.wire([[60, 40], [60, 110], inv.a], "in"); c.dot(60, 40); c.wire([[24, 120], [76, 120], [76, 50], x.b], "in"); c.wire([[76, 120], [76, 152], [170, 152], [170, 130], n.b], "in"); c.dot(76, 120);
  c.wire([inv.o, n.a], "mid"); c.wire([x.o, [330, x.o[1]]], "out", true); c.txt(336, x.o[1] + 4, "Diff", { c: "g" }); c.wire([n.o, [330, n.o[1]]], "out", true); c.txt(336, n.o[1] + 4, "Borrow", { c: "g" }); return done(c); } };
D.comp1 = { title: "1-bit magnitude comparator", cap: "A>B = A\u00B7B\u2019,  A=B = (A\u2295B)\u2019,  A<B = A\u2019\u00B7B.", draw() {
  const c = new Cv(390, 230, "Comparator"), lab = (y, a, b) => { c.txt(2, y + 20, a, { c: "b" }); c.txt(2, y + 40, b, { c: "b" }); };
  let y = 6; lab(y, "A", "B"); const n1 = c.gate("not", 80, y + 16), g1 = c.gate("and", 170, y + 6); c.wire([[20, y + 16], g1.a], "in"); c.wire([[20, y + 36], n1.a], "in"); c.wire([n1.o, g1.b], "mid"); c.wire([g1.o, [330, g1.o[1]]], "out", true); c.txt(336, g1.o[1] + 4, "A>B", { c: "g" });
  y = 80; lab(y, "A", "B"); const g2 = c.gate("xnor", 170, y + 6); c.wire([[20, y + 16], g2.a], "in"); c.wire([[20, y + 36], g2.b], "in"); c.wire([g2.o, [330, g2.o[1]]], "out", true); c.txt(336, g2.o[1] + 4, "A=B", { c: "g" });
  y = 154; lab(y, "A", "B"); const n3 = c.gate("not", 80, y - 4), g3 = c.gate("and", 170, y + 6); c.wire([[20, y + 16], n3.a], "in"); c.wire([n3.o, g3.a], "mid"); c.wire([[20, y + 36], g3.b], "in"); c.wire([g3.o, [330, g3.o[1]]], "out", true); c.txt(336, g3.o[1] + 4, "A<B", { c: "g" }); return done(c); } };
D.parity = { title: "Even parity generator (3 data bits)", cap: "P = A\u2295B\u2295C makes the total number of 1s even. A receiver checks it to detect a single-bit error.", draw() {
  const c = new Cv(360, 150, "Parity generator"); c.txt(4, 38, "A", { c: "b" }); c.txt(4, 58, "B", { c: "b" }); c.txt(4, 98, "C", { c: "b" }); const x1 = c.gate("xor", 80, 24), x2 = c.gate("xor", 190, 64);
  c.wire([[22, 34], x1.a], "in"); c.wire([[22, 54], x1.b], "in"); c.wire([x1.o, [150, x1.o[1]], [150, x2.a[1]], x2.a], "mid"); c.wire([[22, 94], x2.b], "in"); c.wire([x2.o, [320, x2.o[1]]], "out", true); c.txt(326, x2.o[1] + 4, "P", { c: "g" }); return done(c); } };
// 3 NAND gates for the OR example are added after the canvas is built
const _or = D.nand_univ.draw; D.nand_univ.draw = function () { const r = _or(); const c = { g: r.firstChild, add(n) { this.g.append(n); return n; } }; const cv = Object.create(Cv.prototype); cv.root = r; cv.g = r.firstChild; const n1 = cv.gate("nand", 70, 208), n2 = cv.gate("nand", 70, 256), n3 = cv.gate("nand", 190, 232);
  cv.txt(10, 238, "A", { c: "b" }); cv.wire([[26, 234], [40, 234], [40, n1.a[1]], n1.a], "in"); cv.wire([[40, 234], [40, n1.b[1]], n1.b], "in"); cv.dot(40, 234); cv.txt(10, 286, "B", { c: "b" }); cv.wire([[26, 282], [40, 282], [40, n2.a[1]], n2.a], "in"); cv.wire([[40, 282], [40, n2.b[1]], n2.b], "in"); cv.dot(40, 282);
  cv.wire([n1.o, [150, n1.o[1]], [150, n3.a[1]], n3.a], "mid"); cv.wire([n2.o, [150, n2.o[1]], [150, n3.b[1]], n3.b], "mid"); cv.wire([n3.o, [300, n3.o[1]]], "out", true); cv.txt(306, n3.o[1] + 4, "A+B", { c: "g" }); r.setAttribute("viewBox", "0 0 380 310"); return r; };
export const DIAGRAM_KEYS = Object.keys(D);
export function drawDiagram(key) { const d = D[key]; if (!d) return null; try { return { title: d.title, cap: d.cap, svg: d.draw() }; } catch (_) { return null; } }
