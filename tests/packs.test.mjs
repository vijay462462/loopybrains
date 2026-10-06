// Checks every Loopy Knowledge Pack: required fields, unique ids and keys, diagrams that exist, simple-words entries.
// Run: node tests/packs.test.mjs   (also run by scripts/check.sh)
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const root = new URL("../docs/", pathToFileURL(process.cwd() + "/"));
const imp = (f) => import(new URL(f, import.meta.url.startsWith("file:") ? new URL("../docs/", import.meta.url) : root).href);
const [m1, m2, m3] = await Promise.all([imp("brain-packs.js"), imp("brain-packs-ece.js"), imp("brain-simple.js")]);
const all = [...m1.PACKS, ...m2.PACKS_ECE];
const dsrc = readFileSync(new URL("../docs/brain-diagrams.js", import.meta.url), "utf8") + readFileSync(new URL("../docs/brain-diagrams2.js", import.meta.url), "utf8");
const dkeys = new Set([...dsrc.matchAll(/^D\.([A-Za-z0-9_]+) = /gm)].map(x => x[1]));
const errs = [], ids = new Set(), keyOwner = new Map(), used = new Set();
for (const p of all) {
  if (ids.has(p.id)) errs.push("duplicate id " + p.id); ids.add(p.id);
  for (const f of ["title", "subject", "short", "exam"]) if (!p[f] || typeof p[f] !== "string") errs.push(p.id + ": missing " + f);
  for (const f of ["keys", "points", "mistakes", "uses", "related"]) if (!Array.isArray(p[f]) || !p[f].length) errs.push(p.id + ": empty " + f);
  if (!p.example || !p.example.text) errs.push(p.id + ": missing example");
  for (const k of p.keys || []) { const n = k.toLowerCase(); if (keyOwner.has(n) && keyOwner.get(n) !== p.id) errs.push("key '" + k + "' used by " + keyOwner.get(n) + " and " + p.id); keyOwner.set(n, p.id); }
  for (const d of p.diagrams || []) { used.add(d); if (!dkeys.has(d)) errs.push(p.id + ": unknown diagram " + d); }
  if (!m3.SIMPLE[p.id]) errs.push(p.id + ": no 'In simple words' entry");
}
for (const id of Object.keys(m3.SIMPLE)) if (!ids.has(id)) errs.push("SIMPLE has unknown id " + id);
for (const id of m2.CHECKED) if (!ids.has(id)) errs.push("CHECKED has unknown id " + id);
for (const s of new Set(all.map(p => p.subject))) if (!m2.REFS[s]) errs.push("no textbook list for subject " + s);
if (errs.length) { console.error("PACK PROBLEMS:\n- " + errs.join("\n- ")); process.exit(1); }
console.log("packs ok: " + all.length + " packs, " + dkeys.size + " diagrams, " + m2.CHECKED.length + " checked against books");
