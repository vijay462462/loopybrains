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
// ---- Weekly Showdown (ideas and answers) ----
const va = env.authenticatedContext("vera", { email_verified: true, email: "v@x.edu" }).firestore(), vb = env.authenticatedContext("vik", { email_verified: true, email: "k@x.edu" }).firestore(), un = env.authenticatedContext("unv", { email_verified: false }).firestore();
const sd = (db, week, slug, uid, kind, tweak = {}) => {
  const now = Date.now(), b = writeBatch(db);
  b.set(doc(db, "showdownPlayers", week + "_" + uid + "_" + kind), { week, uid, slug, kind, n: increment(1), updatedAt: now }, { merge: true });
  b.set(doc(db, "showdownColleges", week + "_" + slug + "_" + kind), { week, slug, kind, n: increment(tweak.college ?? 1), players: increment(tweak.players ?? 0), updatedAt: now }, { merge: true });
  return b.commit();
};
await t("showdown: verified student scores an idea", () => assertSucceeds(sd(va, "s1", "anu", "vera", "idea", { players: 1 })));
await t("showdown: second idea by same student", () => assertSucceeds(sd(va, "s1", "anu", "vera", "idea")));
await t("showdown: second student joins", () => assertSucceeds(sd(vb, "s1", "anu", "vik", "idea", { players: 1 })));
await t("showdown: counts are right", async () => { const s = await assertSucceeds(getDoc(doc(anon, "showdownColleges", "s1_anu_idea"))); const d = s.data(); if (!(d.n === 3 && d.players === 2)) throw new Error("bad " + JSON.stringify(d)); });
await t("showdown cheat: unverified e-mail cannot score", () => assertFails(sd(un, "s1", "anu", "unv", "idea", { players: 1 })));
await t("showdown cheat: signed out cannot score", () => assertFails(sd(anon, "s1", "anu", "ghost", "idea", { players: 1 })));
await t("showdown cheat: college +5 is refused", () => assertFails(sd(va, "s1", "anu", "vera", "idea", { college: 5 })));
await t("showdown cheat: players +1 on repeat is refused", () => assertFails(sd(va, "s1", "anu", "vera", "idea", { players: 1 })));
await t("showdown cheat: college counter alone is refused", () => assertFails(setDoc(doc(va, "showdownColleges", "s1_anu_idea"), { week: "s1", slug: "anu", kind: "idea", n: increment(1), players: increment(0), updatedAt: Date.now() }, { merge: true })));
await t("showdown cheat: other student's player doc is refused", () => assertFails(setDoc(doc(va, "showdownPlayers", "s1_vik_idea"), { week: "s1", uid: "vik", slug: "anu", kind: "idea", n: 1, updatedAt: Date.now() })));
await t("showdown cheat: jump a player to n=5 is refused", () => assertFails(setDoc(doc(va, "showdownPlayers", "s1_vera_idea"), { week: "s1", uid: "vera", slug: "anu", kind: "idea", n: 5, updatedAt: Date.now() })));
await t("showdown cap: idea 6 in a week is refused", async () => { for (let i = 0; i < 3; i++) await sd(va, "s1", "anu", "vera", "idea"); await assertFails(sd(va, "s1", "anu", "vera", "idea")); });
await t("showdown: unknown kind is refused", () => assertFails(sd(va, "s1", "anu", "vera", "hack", { players: 1 })));
await t("showdown: board is public, player docs are not listable", async () => { await assertSucceeds(getDocs(query(collection(anon, "showdownColleges"), where("week", "==", "s1")))); await assertFails(getDocs(collection(va, "showdownPlayers"))); });
// ---- push tokens ----
const tok = "x".repeat(40);
await t("push: a user stores their own token", () => assertSucceeds(setDoc(doc(alice, "pushTokens", "alice"), { tokens: [tok], updatedAt: Date.now() })));
await t("push: cannot store a token under another user's id", () => assertFails(setDoc(doc(alice, "pushTokens", "bob"), { tokens: [tok], updatedAt: Date.now() })));
await t("push: tokens cannot be read back from the app", () => assertFails(getDoc(doc(alice, "pushTokens", "alice"))));
await t("push: too many or oversized tokens refused", async () => { await assertFails(setDoc(doc(alice, "pushTokens", "alice"), { tokens: [tok, tok, tok, tok, tok, tok], updatedAt: Date.now() })); await assertFails(setDoc(doc(alice, "pushTokens", "alice"), { tokens: ["y".repeat(500)], updatedAt: Date.now() })); });
await t("push: extra fields refused, signed out refused", async () => { await assertFails(setDoc(doc(alice, "pushTokens", "alice"), { tokens: [tok], updatedAt: Date.now(), admin: true })); await assertFails(setDoc(doc(anon, "pushTokens", "alice"), { tokens: [tok], updatedAt: Date.now() })); });
// ---- pilot feedback ----
const fb = (db, uid, extra = {}, id) => setDoc(doc(db, "pilotFeedback", id || uid + "_w5"), { week: "w5", uid, slug: "rgukt", rating: 4, pay: "49", liked: "Quick answers", improve: "More subjects", createdAt: Date.now(), ...extra });
await t("feedback: own weekly form accepted", () => assertSucceeds(fb(alice, "alice")));
await t("feedback: a second form the same week is refused (create only)", () => assertFails(fb(alice, "alice", { rating: 1 })));
await t("feedback: cannot write for another user", () => assertFails(fb(alice, "bob", {}, "bob_w5")));
await t("feedback: bad rating / bad price / long text refused", async () => { await assertFails(fb(alice, "alice", { rating: 9 }, "alice_w6")); await assertFails(fb(alice, "alice", { pay: "5" }, "alice_w6")); await assertFails(fb(alice, "alice", { liked: "x".repeat(400) }, "alice_w6")); });
await t("feedback: students cannot read feedback", () => assertFails(getDoc(doc(alice, "pilotFeedback", "alice_w5"))));
await t("feedback: signed out refused", () => assertFails(fb(anon, "ghost")));
// profile streak
const prof = (db, uid, extra) => setDoc(doc(db, "rooms/r00m-Abc123xy/profiles", uid + "12345678"), { name: "A", dp: "", updatedAt: Date.now(), ownerUid: uid, ...extra });
await t("profile with streak 5 is accepted", () => assertSucceeds(prof(alice, "alice", { streak: 5 })));
await t("profile with streak 99999 is refused", () => assertFails(prof(alice, "alice", { streak: 99999 })));
await t("profile with a non-number streak is refused", () => assertFails(prof(alice, "alice", { streak: "x" })));
await t("profile with curiosity points is accepted", () => assertSucceeds(prof(alice, "alice", { curio: 40 })));
await t("profile with negative or oversized curiosity is refused", async () => { await assertFails(prof(alice, "alice", { curio: -1 })); await assertFails(prof(alice, "alice", { curio: 999999 })); await assertFails(prof(alice, "alice", { curio: "x" })); });
// ---- student IDs ----
await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), "studentIds", "alice"), { id: "AP-RGU-0001", slug: "rgukt", n: 1, createdAt: Date.now() }); });
await t("studentIds: a student reads only their own", async () => { await assertSucceeds(getDoc(doc(alice, "studentIds", "alice"))); await assertFails(getDoc(doc(alice, "studentIds", "bob"))); });
await t("studentIds: students cannot write or list", async () => { await assertFails(setDoc(doc(alice, "studentIds", "alice"), { id: "AP-RGU-0002" })); await assertFails(setDoc(doc(bob, "studentIds", "bob"), { id: "AP-RGU-0003" })); await assertFails(getDocs(collection(alice, "studentIds"))); });
await t("studentIds: counters are closed", () => assertFails(getDoc(doc(alice, "idCounters", "AP-RGU"))));
await t("profile: own issued cid is accepted", () => assertSucceeds(prof(alice, "alice", { cid: "AP-RGU-0001" })));
await t("profile: someone else's or made-up cid is refused", async () => { await assertFails(prof(alice, "alice", { cid: "AP-RGU-0002" })); await assertFails(prof(bob, "bob", { cid: "AP-RGU-0001" })); });
// ---- custom Loop IDs ----
const claim = (db, uid, name, at = Date.now()) => { const b = writeBatch(db); b.set(doc(db, "handleLog", uid), { at }); b.set(doc(db, "handles", name), { uid, createdAt: at }); return b.commit(); };
await t("handle: a student claims a free name", () => assertSucceeds(claim(alice, "alice", "vijay_rgu")));
await t("handle: a taken name is refused", () => assertFails(claim(bob, "bob", "vijay_rgu")));
await t("handle: anyone signed in can check a name, nobody can list", async () => { await assertSucceeds(getDoc(doc(bob, "handles", "vijay_rgu"))); await assertFails(getDocs(collection(bob, "handles"))); await assertFails(getDoc(doc(anon, "handles", "vijay_rgu"))); });
await t("handle: reserved and look-alike staff names are refused", async () => { for (const n of ["admin", "official_help", "support1", "campusloop", "rgukt_ap"]) await assertFails(claim(bob, "bob", n)); });
await t("handle: bad characters or length are refused", async () => { for (const n of ["ab", "Has Space", "UPPER", "this_name_is_way_too_long", "a-b-c"]) await assertFails(claim(bob, "bob", n)); });
await t("handle: cannot claim for another user's id", () => assertFails((async () => { const b = writeBatch(bob); b.set(doc(bob, "handleLog", "bob"), { at: Date.now() }); b.set(doc(bob, "handles", "sneaky_one"), { uid: "alice", createdAt: Date.now() }); await b.commit(); })()));
await t("handle: a second name within 30 days is refused", () => assertFails(claim(alice, "alice", "another_name")));
await t("handle: the owner can release, others cannot", async () => { await assertFails((async () => { const { deleteDoc } = await import("firebase/firestore"); await deleteDoc(doc(bob, "handles", "vijay_rgu")); })()); const { deleteDoc } = await import("firebase/firestore"); await assertSucceeds(deleteDoc(doc(alice, "handles", "vijay_rgu"))); });
await t("handle: profile can publish only a name the user owns", async () => { await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), "handles", "bob_name"), { uid: "bob", createdAt: Date.now() }); }); await assertSucceeds(prof(bob, "bob", { handle: "bob_name" })); await assertFails(prof(alice, "alice", { handle: "bob_name" })); await assertFails(prof(alice, "alice", { handle: "nobody_owns" })); });
console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup(); process.exit(fail ? 1 : 0);
