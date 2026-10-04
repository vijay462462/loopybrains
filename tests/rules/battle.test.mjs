import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { doc, setDoc, getDoc, writeBatch, increment, collection, getDocs, query, where } from "firebase/firestore";
const env = await initializeTestEnvironment({ projectId: "demo-test", firestore: { rules: readFileSync("../../firestore.rules", "utf8"), host: "127.0.0.1", port: 8081 } });
await env.clearFirestore();
let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log("  ok  ", name); } catch (e) { fail++; console.log("  FAIL", name, "-", String(e.message).slice(0, 140)); } };
const hit = async (db, week, slug, uid, ok, tweak = {}) => {
  const now = Date.now(), c = ok ? 1 : 0, b = writeBatch(db);
  b.set(doc(db, "battlePlayers", week + "_" + uid), { week, uid, slug, correct: increment(c), total: increment(1), updatedAt: now }, { merge: true });
  b.set(doc(db, "battleColleges", week + "_" + slug), { week, slug, correct: increment(tweak.college ?? c), total: increment(1), players: increment(tweak.players ?? 0), updatedAt: now }, { merge: true });
  return b.commit();
};
// first answer by a new player needs players +1
const alice = env.authenticatedContext("alice").firestore(), bob = env.authenticatedContext("bob").firestore(), anon = env.unauthenticatedContext().firestore();
await t("new player, correct answer creates both docs", () => assertSucceeds(hit(alice, "w1", "anu", "alice", true, { players: 1 })));
await t("same player, second answer (wrong) moves only totals", () => assertSucceeds(hit(alice, "w1", "anu", "alice", false, { players: 0, college: 0 })));
await t("second player at same college", () => assertSucceeds(hit(bob, "w1", "anu", "bob", true, { players: 1 })));
await t("counts are as expected", async () => { const s = await assertSucceeds(getDoc(doc(anon, "battleColleges", "w1_anu"))); const d = s.data(); if (!(d.correct === 2 && d.total === 3 && d.players === 2)) throw new Error("bad counts " + JSON.stringify(d)); });
await t("cheat: college +5 for one answer is refused", () => assertFails(hit(alice, "w1", "anu", "alice", true, { college: 5 })));
await t("cheat: players +1 on repeat answer is refused", () => assertFails(hit(alice, "w1", "anu", "alice", true, { players: 1 })));
await t("cheat: write college counter alone is refused", () => assertFails(setDoc(doc(alice, "battleColleges", "w1_anu"), { week: "w1", slug: "anu", correct: increment(1), total: increment(1), players: increment(0), updatedAt: Date.now() }, { merge: true })));
await t("cheat: write another user's player doc is refused", () => assertFails(setDoc(doc(alice, "battlePlayers", "w1_bob"), { week: "w1", uid: "bob", slug: "anu", correct: 70, total: 70, updatedAt: Date.now() })));
await t("cheat: jump player to 70 correct is refused", () => assertFails(setDoc(doc(alice, "battlePlayers", "w1_alice"), { week: "w1", uid: "alice", slug: "anu", correct: 60, total: 61, updatedAt: Date.now() }, { merge: true })));
await t("anonymous (signed out) cannot write", () => assertFails(hit(anon, "w1", "anu", "ghost", true, { players: 1 })));
await t("leaderboard is public to read (list by week)", () => assertSucceeds(getDocs(query(collection(anon, "battleColleges"), where("week", "==", "w1")))));
await t("player docs cannot be listed", () => assertFails(getDocs(collection(alice, "battlePlayers"))));
await t("player can get own doc (even if missing)", () => assertSucceeds(getDoc(doc(alice, "battlePlayers", "w9_alice"))));
await t("player cannot get someone else's doc", () => assertFails(getDoc(doc(alice, "battlePlayers", "w1_bob"))));
// profile streak
const prof = (db, uid, extra) => setDoc(doc(db, "rooms/r00m-Abc123xy/profiles", uid + "12345678"), { name: "A", dp: "", updatedAt: Date.now(), ownerUid: uid, ...extra });
await t("profile with streak 5 is accepted", () => assertSucceeds(prof(alice, "alice", { streak: 5 })));
await t("profile with streak 99999 is refused", () => assertFails(prof(alice, "alice", { streak: 99999 })));
await t("profile with a non-number streak is refused", () => assertFails(prof(alice, "alice", { streak: "x" })));
console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup(); process.exit(fail ? 1 : 0);
