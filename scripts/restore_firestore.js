#!/usr/bin/env node
/* Restore a backup made by backup_firestore.js. This OVERWRITES documents with the same path, so it asks for --confirm.
 * Practise first on the local emulator or on a spare Firebase project, never straight on live data.
 *   node scripts/restore_firestore.js backups/2026-10-05T10-00-00 --project my-test-project --confirm
 */
"use strict";
const fs = require("fs"), path = require("path");
let admin; try { admin = require("firebase-admin"); } catch (_) { try { admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin")); } catch (e) { console.error("firebase-admin is not installed. Run: cd functions && npm install"); process.exit(1); } }
const dirArg = process.argv[2], pi = process.argv.indexOf("--project"), project = pi > 0 ? process.argv[pi + 1] : "";
if (!dirArg || !project) { console.error("Usage: node scripts/restore_firestore.js <backup folder> --project <id> --confirm"); process.exit(1); }
if (!process.argv.includes("--confirm")) { console.error("This overwrites documents. Add --confirm to continue."); process.exit(1); }
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) { console.error("Set GOOGLE_APPLICATION_CREDENTIALS (or use the emulator)."); process.exit(1); }
admin.initializeApp({ projectId: project }); const db = admin.firestore(), T = admin.firestore;
function dec(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(dec);
  if (v.__ts) return T.Timestamp.fromDate(new Date(v.__ts));
  if (v.__geo) return new T.GeoPoint(v.__geo[0], v.__geo[1]);
  if (v.__ref) return db.doc(v.__ref);
  if (v.__bytes) return Buffer.from(v.__bytes, "base64");
  const o = {}; for (const [k, x] of Object.entries(v)) o[k] = dec(x); return o;
}
let n = 0;
async function put(colRef, items) {
  for (let i = 0; i < items.length; i += 300) {
    const b = db.batch(), part = items.slice(i, i + 300);
    for (const it of part) if (it.data) { b.set(colRef.doc(it.id), dec(it.data)); n++; }
    await b.commit();
    for (const it of part) if (it.collections) for (const [name, sub] of Object.entries(it.collections)) await put(colRef.doc(it.id).collection(name), sub);
  }
}
(async () => {
  for (const f of fs.readdirSync(dirArg).filter(f => f.endsWith(".json") && f !== "manifest.json")) { await put(db.collection(path.basename(f, ".json")), JSON.parse(fs.readFileSync(path.join(dirArg, f), "utf8"))); console.log("restored " + f); }
  console.log("Done: " + n + " documents written to " + project + ".");
})().catch(e => { console.error("Restore failed:", e.message); process.exit(1); });
