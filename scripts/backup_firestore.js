#!/usr/bin/env node
/* Back up every Firestore document (all collections, including sub-collections) to JSON files on your computer.
 *
 * One-time setup (about 5 minutes):
 *   1. Firebase console > Project settings > Service accounts > Generate new private key. Save the file OUTSIDE this
 *      folder (for example in your Documents). NEVER put it in the repository or send it to anyone: it can read and
 *      change all your data. (.gitignore blocks the usual names as a safety net.)
 *   2. cd functions && npm install        (this installs firebase-admin once)
 *
 * Run (Windows PowerShell shown, Mac/Linux use export instead of $env:):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Users\you\Documents\campusloop-key.json"
 *   node scripts/backup_firestore.js --project doubt-desk-e6f39
 *
 * Options:  --out <folder>   where to save (default: backups)
 *           --only a,b       only these top-level collections (default: all)
 *           --dry            count documents, write nothing
 * Output:   backups/<date-time>/<collection>.json and manifest.json (counts and checksums).
 * Dates and other special types are saved with tags so scripts/restore_firestore.js can restore them exactly.
 * Keep backups private: they contain student posts. Store them on an encrypted drive and delete old ones.
 */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
let admin; try { admin = require("firebase-admin"); } catch (_) { try { admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin")); } catch (e) { console.error("firebase-admin is not installed. Run: cd functions && npm install"); process.exit(1); } }
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const project = arg("project", process.env.GCLOUD_PROJECT || ""), outRoot = arg("out", "backups"), only = arg("only", ""), dry = !!arg("dry", false);
if (!project) { console.error("Give the project id: --project doubt-desk-e6f39"); process.exit(1); }
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) { console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service-account key file (see the top of this script)."); process.exit(1); }
admin.initializeApp({ projectId: project });
const db = admin.firestore(), T = admin.firestore;
function enc(v) {
  if (v === null || typeof v !== "object") return v;
  if (v instanceof T.Timestamp) return { __ts: v.toDate().toISOString() };
  if (v instanceof T.GeoPoint) return { __geo: [v.latitude, v.longitude] };
  if (v instanceof T.DocumentReference) return { __ref: v.path };
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return { __bytes: Buffer.from(v).toString("base64") };
  if (Array.isArray(v)) return v.map(enc);
  const o = {}; for (const [k, x] of Object.entries(v)) o[k] = enc(x); return o;
}
let docs = 0;
// listDocuments() also returns "placeholder" documents (for example rooms/<college>), which have no fields of their own but hold sub-collections.
async function dump(colRef) {
  const out = [], refs = await colRef.listDocuments();
  for (let i = 0; i < refs.length; i += 50) {
    const part = refs.slice(i, i + 50), snaps = await db.getAll(...part);
    for (let k = 0; k < part.length; k++) {
      const snap = snaps[k], item = { id: part[k].id, data: snap.exists ? enc(snap.data()) : null }; if (snap.exists) docs++;
      const subs = await part[k].listCollections();
      if (subs.length) { item.collections = {}; for (const s of subs) item.collections[s.id] = await dump(s); }
      out.push(item);
    }
  }
  return out;
}
(async () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19), dir = path.join(outRoot, stamp), manifest = { project, at: new Date().toISOString(), collections: {} };
  const wanted = only ? String(only).split(",").map(s => s.trim()).filter(Boolean) : null;
  const cols = (await db.listCollections()).filter(c => !wanted || wanted.includes(c.id));
  if (!dry) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  for (const c of cols) {
    const before = docs, data = await dump(c), n = docs - before;
    if (!dry) { const body = JSON.stringify(data); fs.writeFileSync(path.join(dir, c.id + ".json"), body, { mode: 0o600 }); manifest.collections[c.id] = { documents: n, sha256: crypto.createHash("sha256").update(body).digest("hex") }; }
    else manifest.collections[c.id] = { documents: n };
    console.log((dry ? "counted " : "saved ") + c.id + ": " + n + " documents");
  }
  if (!dry) fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  console.log((dry ? "Dry run: " : "Done: ") + docs + " documents" + (dry ? "" : " saved in " + dir) + ". Keep this folder private.");
})().catch(e => { console.error("Backup failed:", e.message); process.exit(1); });
