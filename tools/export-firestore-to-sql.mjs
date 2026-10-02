// One-time export: copies every document from Firestore into a SQL file for Supabase.
//
//   ROOM=<your class code> node tools/export-firestore-to-sql.mjs > firestore-export.sql
//
// Then open Supabase > SQL Editor, paste firestore-export.sql (or run it in parts) and Run.
// Needs Node 18+. It reads through the same public Firestore API the website uses, so your
// current rules must still allow reads. Keep the class code private: pass it as an environment
// variable, never save it in a file in this repository.
//
// Old posts keep their original author ids. They stay visible, but only admins can edit them,
// because the new owner column is empty for imported rows.
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

export const COLLECTIONS = ["doubts", "ideas", "clubs", "gate", "challenges", "replies", "likes", "pages",
  "market", "marketReports", "marketRatings", "marketInterests", "chal_scores"];

export function decodeValue(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return Date.parse(v.timestampValue);
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  return null;
}
export function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}
const quote = (s) => "'" + String(s).replace(/'/g, "''") + "'";

export function rowSql(coll, id, data) {
  const created = typeof data.createdAt === "number" ? data.createdAt : (typeof data.submittedAt === "number" ? data.submittedAt : null);
  const when = created ? `to_timestamp(${created} / 1000.0)` : "now()";
  const json = JSON.stringify(data).replace(/\$j\$/g, "$ j$");
  return `(${quote(coll)}, ${quote(id)}, $j$${json}$j$::jsonb, null, ${when})`;
}

async function main() {
  const room = process.env.ROOM;
  if (!room) { console.error("Set ROOM to your class code, e.g. ROOM=ABC-123 node tools/export-firestore-to-sql.mjs"); process.exit(1); }
  const cfg = readFileSync(fileURLToPath(new URL("../docs/config.js", import.meta.url)), "utf8");
  const projectId = process.env.FIREBASE_PROJECT_ID || (cfg.match(/projectId:\s*"([^"]+)"/) || [])[1];
  const apiKey = process.env.FIREBASE_API_KEY || (cfg.match(/apiKey:\s*"([^"]+)"/) || [])[1];
  if (!projectId || !apiKey) { console.error("Could not read the Firebase projectId and apiKey from docs/config.js"); process.exit(1); }
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rooms/${encodeURIComponent(room)}`;
  console.log("-- RGUKT Spark: data copied from Firestore. Run in the Supabase SQL Editor.");
  let total = 0;
  for (const coll of COLLECTIONS) {
    let token = "", rows = [];
    do {
      const res = await fetch(`${base}/${coll}?pageSize=300&key=${apiKey}` + (token ? `&pageToken=${encodeURIComponent(token)}` : ""));
      if (!res.ok) { console.error(`-- ${coll}: HTTP ${res.status} (skipped)`); break; }
      const body = await res.json();
      for (const d of body.documents || []) rows.push(rowSql(coll, d.name.split("/").pop(), decodeFields(d.fields || {})));
      token = body.nextPageToken || "";
    } while (token);
    for (let i = 0; i < rows.length; i += 50) {
      console.log(`insert into public.spark_docs (coll, id, data, owner, created_at) values\n${rows.slice(i, i + 50).join(",\n")}\non conflict (coll, id) do nothing;`);
    }
    total += rows.length;
    console.error(`${coll}: ${rows.length} documents`);
  }
  console.error(`Done. ${total} documents exported.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
