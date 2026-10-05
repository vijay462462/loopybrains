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

// ---------- Easy language helpers ----------
const EASY = [["utilize", "use"], ["utilizes", "uses"], ["utilised", "used"], ["approximately", "about"], ["numerous", "many"], ["commence", "start"], ["demonstrate", "show"], ["demonstrates", "shows"], ["subsequently", "later"], ["consequently", "so"], ["therefore", "so"], ["additionally", "also"], ["regarding", "about"], ["obtain", "get"], ["require", "need"], ["requires", "needs"], ["sufficient", "enough"], ["assist", "help"], ["attempt", "try"], ["terminate", "end"], ["initial", "first"], ["modify", "change"], ["primarily", "mainly"], ["typically", "usually"], ["enables", "lets"], ["fundamental", "basic"], ["comprises", "is made of"], ["facilitate", "help"], ["constitutes", "makes up"], ["prior to", "before"], ["in order to", "to"], ["a number of", "some"], ["due to the fact that", "because"], ["in addition", "also"], ["however", "but"], ["whereas", "while"], ["thus", "so"], ["hence", "so"], ["commonly", "often"], ["considerable", "large"], ["significant", "important"], ["significantly", "a lot"], ["implement", "build"], ["implemented", "built"], ["acquire", "get"], ["observe", "see"], ["indicate", "show"], ["indicates", "shows"], ["employ", "use"], ["employs", "uses"], ["conceived", "thought up"], ["decomposes", "breaks down"]];
const EASY_RE = EASY.map(([a, b]) => [new RegExp("\\b" + a + "\\b", "gi"), b]);
export function easy(text) {
  let s = String(text || "");
  for (const [re, b] of EASY_RE) s = s.replace(re, (m) => m[0] === m[0].toUpperCase() ? b[0].toUpperCase() + b.slice(1) : b);
  return s;
}
const syl = (w) => { w = w.toLowerCase().replace(/[^a-z]/g, ""); if (w.length <= 3) return 1; w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, ""); const m = w.match(/[aeiouy]{1,2}/g); return m ? m.length : 1; };
export function readingLevel(text) {
  const sents = splitSentences(text), words = String(text || "").match(/[A-Za-z']+/g) || [];
  if (!sents.length || words.length < 12) return { score: 60, label: "Easy" };
  const sy = words.reduce((a, w) => a + syl(w), 0), score = 206.835 - 1.015 * (words.length / sents.length) - 84.6 * (sy / words.length);
  return { score: Math.round(score), label: score >= 60 ? "Easy" : score >= 40 ? "Medium" : "Hard" };
}
const COMMON = new Set("information university government development different important structure including american according following important national international following something everything throughout application applications environment introduced published available particular necessary education professional production relationship community management activities traditional experience technology".split(" "));
export function hardWords(text, max) {
  const cnt = new Map(); for (const w of String(text || "").match(/\b[a-z]{10,}\b/g) || []) if (!COMMON.has(w)) cnt.set(w, (cnt.get(w) || 0) + 1);
  return [...cnt.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, max || 4).map(x => x[0]);
}
