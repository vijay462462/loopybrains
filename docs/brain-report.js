// Loopy Brain report engine: turns an article into a coloured, ordered study report. Pure functions, no network, no DOM.
export const SIZES = [
  { id: "brief", name: "Brief", hint: "A few lines", need: 1, sections: 0, sents: 3, facts: 0 },
  { id: "standard", name: "Standard", hint: "About one page", need: 2, sections: 4, sents: 3, facts: 3 },
  { id: "detailed", name: "Detailed", hint: "Several pages", need: 3, sections: 10, sents: 8, facts: 6 },
  { id: "full", name: "Full report", hint: "Research level", need: 4, sections: 16, sents: 14, facts: 8 },
];
const ABBR = /\b(?:[A-Z]|Dr|Mr|Mrs|Ms|Prof|St|Jr|Sr|vs|etc|Fig|No|Inc|Ltd|approx|Eq|Vol|Ch|al)\.\s/g;
export const splitSentences = (t) => String(t || "").replace(/\s+/g, " ").replace(ABBR, (m) => m.slice(0, -1) + "\u0002").replace(/([.!?])\s+(?=[A-Z0-9"(])/g, "$1\u0001").split("\u0001").map(x => x.replace(/\u0002/g, " ").trim()).filter(x => x.length > 20 && x.length < 420);
const TYPES = [
  ["formula", /[=≈×÷∑∫√≤≥]|\b[A-Za-z]\s*=\s*[A-Za-z0-9]/],
  ["example", /\b(for example|for instance|such as|e\.g\.|including|examples? (?:of|include))\b/i],
  ["caution", /\b(however|limitation|disadvantage|drawback|criticis\w*|risk|problem|challenge|cannot|although|despite|controvers\w*)\b/i],
  ["cause", /\b(because|therefore|as a result|leads? to|causes?|due to|results? in|consequently)\b/i],
  ["fact", /\b\d[\d,.]*\s?(%|percent|km|kg|m|cm|mm|million|billion|trillion|years?|tonnes?|degrees?|°C|hz|mhz|ghz|kw|mw|volts?|watts?)\b/i],
];
export function classify(sentence, isFirstOfIntro) {
  if (isFirstOfIntro) return "definition";
  for (const [t, re] of TYPES) if (re.test(sentence)) return t;
  return "plain";
}
const HL = /(\b\d(?:[\d,.]*\d)?(?:\s(?:%|percent|km|kg|cm|mm|million|billion|trillion|years?|tonnes?|hz|volts?|watts?)\b)?|\b[A-Z][a-z]+(?:\s(?:of|the|de|von|van))?(?:\s[A-Z][a-z]+)+\b)/g;
export function highlight(sentence) {
  const out = []; let last = 0, m; HL.lastIndex = 0;
  while ((m = HL.exec(sentence))) { if (m.index > last) out.push({ t: sentence.slice(last, m.index) }); out.push({ t: m[0], hl: /\d/.test(m[0]) ? "num" : "name" }); last = m.index + m[0].length; }
  if (last < sentence.length) out.push({ t: sentence.slice(last) });
  return out.length ? out : [{ t: sentence }];
}
export function timeline(text, max) {
  const out = [], seen = new Set();
  for (const s of splitSentences(text)) { const m = /\b(1[5-9]\d\d|20[0-2]\d)\b/.exec(s); if (m && !seen.has(m[1])) { seen.add(m[1]); out.push({ year: Number(m[1]), text: s.length > 150 ? s.slice(0, 147).replace(/\s\S*$/, "") + "…" : s }); } }
  return out.sort((a, b) => a.year - b.year).slice(0, max || 6);
}
export function numbers(text, max) {
  const out = []; const re = /(\d[\d,.]*)\s?(%|percent|km|kg|million|billion|trillion|tonnes?|metres|meters|degrees|volts|watts|hz|years)\b/gi; let m;
  const sents = splitSentences(text);
  for (const s of sents) { re.lastIndex = 0; while ((m = re.exec(s))) { const v = m[1].replace(/[.,]$/, ""); if (/^(1[5-9]\d\d|20[0-2]\d)$/.test(v) && /years?/i.test(m[2])) continue; out.push({ value: v + (m[2] === "percent" ? "%" : " " + m[2]), label: s.replace(/\s*\([^)]*\)/g, "").slice(0, 110).replace(/\s\S*$/, "") + "…" }); break; } if (out.length >= (max || 4)) break; }
  return out;
}
export function terms(text, title, max) {
  const cnt = new Map(), re = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b/g; let m;
  for (const s of splitSentences(text)) { re.lastIndex = 0; while ((m = re.exec(s))) { const t = m[1]; if (t.toLowerCase() === String(title).toLowerCase() || /^(The|In|It|This|These|However)\s/.test(t)) continue; cnt.set(t, (cnt.get(t) || 0) + 1); } }
  return [...cnt.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).slice(0, max || 8).map(x => x[0]);
}
export function buildReport(wiki, sizeId) {
  const size = SIZES.find(s => s.id === sizeId) || SIZES[1], intro = splitSentences(wiki.intro), all = (wiki.intro + " " + wiki.sections.map(s => s.t).join(" "));
  const R = { size: size.id, title: wiki.title, tldr: intro[0] || "", intro: intro.slice(0, size.id === "brief" ? 3 : 3).map((t, i) => ({ t, type: i === 0 ? "definition" : classify(t) })), sections: [], timeline: [], numbers: [], terms: [], revision: [] };
  if (size.sections) for (const sec of wiki.sections.slice(0, size.sections)) { const sents = splitSentences(sec.t).slice(0, size.sents).map(t => ({ t, type: classify(t) })); if (sents.length) R.sections.push({ h: sec.h, sents }); }
  if (size.id === "detailed" || size.id === "full") { R.timeline = timeline(all, size.id === "full" ? 8 : 6); R.numbers = numbers(all, size.facts); }
  else if (size.id === "standard") R.numbers = numbers(all, 3);
  if (size.id !== "brief") R.terms = terms(all, wiki.title, 8);
  if (size.id === "full") R.revision = R.sections.map(s => ({ h: s.h, t: s.sents[0].t }));
  return R;
}
