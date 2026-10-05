import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { doc, setDoc, getDoc, updateDoc, writeBatch, increment, collection, getDocs, query, where } from "firebase/firestore";
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
// ---- private answers ----
const R = "rooms/r00m-Abc123xy";
await env.withSecurityRulesDisabled(async (ctx) => { const adb = ctx.firestore(); await setDoc(doc(adb, R + "/doubts", "dq1"), { title: "q", ownerUid: "alice", authorId: "alice-device-1" }); await setDoc(doc(adb, R + "/doubts", "dq2"), { title: "old", authorId: "old-device-1" }); });
const pa = (db, uid, to, extra = {}, id = null) => setDoc(doc(db, R + "/privateAnswers", id || ((extra.doubtId || "dq1") + "_" + uid)), { doubtId: "dq1", toUid: to, ownerUid: uid, authorId: uid + "-device-1", authorName: "Helper", body: "Use Bayes theorem.", createdAt: Date.now(), ...extra });
await t("private: a helper sends a private answer to the asker", () => assertSucceeds(pa(bob, "bob", "alice", {}, "dq1_bob")));
await t("private: asker and answerer can read it", async () => { await assertSucceeds(getDoc(doc(alice, R + "/privateAnswers", "dq1_bob"))); await assertSucceeds(getDoc(doc(bob, R + "/privateAnswers", "dq1_bob"))); });
await t("private: another student cannot read it", async () => { const carl = env.authenticatedContext("carl").firestore(); await assertFails(getDoc(doc(carl, R + "/privateAnswers", "dq1_bob"))); });
await t("private: lists must be limited to your own (asker query ok, open list refused)", async () => { await assertSucceeds(getDocs(query(collection(alice, R + "/privateAnswers"), where("toUid", "==", "alice")))); await assertFails(getDocs(collection(alice, R + "/privateAnswers"))); });
await t("private: cannot send to someone who does not own the doubt", () => assertFails(pa(bob, "bob", "carl")));
await t("private: cannot send to yourself or for an old doubt without an owner", async () => { await assertFails(pa(alice, "alice", "alice")); await assertFails(pa(bob, "bob", "alice", { doubtId: "dq2" })); });
await t("private: cannot pretend to be another user (ownerUid must be you)", () => assertFails(pa(bob, "alice", "alice")));
await t("private: oversized or non-jpeg images and extra fields are refused", async () => { await assertFails(pa(bob, "bob", "alice", { imgs: ["data:image/jpeg;base64," + "A".repeat(360000)] })); await assertFails(pa(bob, "bob", "alice", { imgs: ["data:text/html;base64,AAAA"] })); await assertFails(pa(bob, "bob", "alice", { admin: true })); });
await t("private: a small jpeg photo and no text is accepted; empty answer refused", async () => { const dan = env.authenticatedContext("dan").firestore(); await assertSucceeds(pa(dan, "dan", "alice", { body: "", imgs: ["data:image/jpeg;base64,/9j/4AAQ"] })); const eve = env.authenticatedContext("eve").firestore(); await assertFails(pa(eve, "eve", "alice", { body: "" })); });
await t("private: cannot be edited or deleted", async () => { await assertFails(setDoc(doc(bob, R + "/privateAnswers", "dq1_bob"), { doubtId: "dq1", toUid: "alice", ownerUid: "bob", authorId: "bob-device-1", authorName: "H", body: "changed", createdAt: Date.now() })); });
// ---- private-answer mode, one answer per helper, ratings and thanks ----
await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), R + "/doubts", "dq3"), { title: "private q", ownerUid: "alice", authorId: "alice-device-1", ansPrivate: true }); });
const reply = (db, uid, parent) => setDoc(doc(db, R + "/replies", "rp_" + uid + parent), { parentId: parent, parentColl: "doubts", body: "answer", authorId: uid + "-device-1", authorName: "H", createdAt: Date.now(), ownerUid: uid });
await t("ai label: a reply or private answer may carry ai true; a non-boolean is refused", async () => {
  const eve = env.authenticatedContext("eve").firestore(), rp = (extra, id) => setDoc(doc(eve, R + "/replies", id), { parentId: "dqx", parentColl: "doubts", body: "answer", authorId: "eve-device-1", authorName: "E", createdAt: Date.now(), ...extra });
  await assertSucceeds(rp({ ai: true }, "rp_ai1")); await assertFails(rp({ ai: "yes" }, "rp_ai2")); await assertFails(rp({ aiFlag: true }, "rp_ai3"));
  await assertSucceeds(pa(eve, "eve", "alice", { ai: true })); await assertFails(pa(env.authenticatedContext("fay").firestore(), "fay", "alice", { ai: "yes" }));
});
await t("private mode: others cannot answer publicly", () => assertFails(reply(bob, "bob", "dq3")));
await t("private mode: the asker can still reply publicly, and normal doubts stay open", async () => { await assertSucceeds(reply(alice, "alice", "dq3")); await assertSucceeds(reply(bob, "bob", "dq1")); });
await t("private answers: a second answer id for the same helper is refused (id must be doubt_uid)", () => assertFails(pa(bob, "bob", "alice", {}, "dq1_other")));
await t("private answers: the asker rates, nobody else can", async () => { await assertSucceeds(updateDoc(doc(alice, R + "/privateAnswers", "dq1_bob"), { rating: "helpful" })); await assertFails(updateDoc(doc(bob, R + "/privateAnswers", "dq1_bob"), { rating: "best" })); await assertFails(updateDoc(doc(alice, R + "/privateAnswers", "dq1_bob"), { rating: "amazing" })); await assertFails(updateDoc(doc(alice, R + "/privateAnswers", "dq1_bob"), { body: "edited" })); });
const thx = (db, by, toUid, level = "helpful", doubt = "dq1") => setDoc(doc(db, R + "/thanks", doubt + "_" + toUid), { doubtId: doubt, toUid, toAuthorId: toUid + "-device-1", toName: "Bob", level, byUid: by, createdAt: Date.now() });
await t("thanks: the asker credits a real private answer", () => assertSucceeds(thx(alice, "alice", "bob")));
await t("thanks: others cannot credit, and made-up answers cannot be credited", async () => { await assertFails(thx(bob, "bob", "bob")); await assertFails(thx(alice, "alice", "carl")); });
await t("thanks: helpful can be upgraded to best, not downgraded", async () => { await assertSucceeds(thx(alice, "alice", "bob", "best")); await assertFails(thx(alice, "alice", "bob", "helpful")); });
// ---- duplicate links and teacher verification ----
await env.withSecurityRulesDisabled(async (ctx) => { const adb = ctx.firestore(); await setDoc(doc(adb, "staff", "r00m-Abc123xy_tess"), { uid: "tess", name: "Tess" }); await setDoc(doc(adb, R + "/replies", "rv1"), { parentId: "dq1", parentColl: "doubts", body: "good answer", authorId: "bob-device-1", authorName: "Bob", createdAt: Date.now() }); });
const tess = env.authenticatedContext("tess", { email_verified: true, email: "t@x.edu" }).firestore();
const ver = (db, uid, rid = "rv1") => setDoc(doc(db, R + "/verified", rid), { replyId: rid, doubtId: "dq1", by: uid, byName: "Tess", at: Date.now() });
await t("verified: staff can verify a real public answer", () => assertSucceeds(ver(tess, "tess")));
await t("verified: students cannot verify, nor verify a missing answer", async () => { await assertFails(ver(alice, "alice")); await assertFails(ver(tess, "tess", "nope")); });
await t("verified: everyone signed in can read it", () => assertSucceeds(getDoc(doc(bob, R + "/verified", "rv1"))));
await t("verified: cannot be edited, staff can withdraw", async () => { await assertFails(setDoc(doc(tess, R + "/verified", "rv1"), { replyId: "rv1", doubtId: "dq9", by: "tess", byName: "T", at: Date.now() })); const { deleteDoc } = await import("firebase/firestore"); await assertFails(deleteDoc(doc(alice, R + "/verified", "rv1"))); await assertSucceeds(deleteDoc(doc(tess, R + "/verified", "rv1"))); });
await t("dupOf: a doubt can carry a duplicate link (owner edit)", async () => { await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), R + "/doubts", "dq9"), { title: "same thing again", subject: "Maths", ownerUid: "alice", authorId: "alice-device-1", authorName: "A", createdAt: Date.now(), body: "" }); }); await assertSucceeds(updateDoc(doc(alice, R + "/doubts", "dq9"), { dupOf: "dq1" })); await assertFails(updateDoc(doc(bob, R + "/doubts", "dq9"), { dupOf: "dq2" })); });
await t("search safety: a student can add strikes but never lower them or lift a block", async () => {
  const gus = env.authenticatedContext("gus").firestore(), ref = doc(gus, "searchSafety", "gus");
  await assertSucceeds(setDoc(ref, { warns: 1, blocked: false, at: Date.now() }));
  await assertSucceeds(setDoc(ref, { warns: 2, blocked: false, at: Date.now() }));
  await assertFails(setDoc(ref, { warns: 1, blocked: false, at: Date.now() }));
  await assertSucceeds(setDoc(ref, { warns: 3, blocked: true, at: Date.now() }));
  await assertFails(setDoc(ref, { warns: 3, blocked: false, at: Date.now() }));
  await assertFails(setDoc(ref, { warns: 3, blocked: true, at: Date.now(), extra: 1 }));
  await assertFails(setDoc(doc(env.authenticatedContext("hal").firestore(), "searchSafety", "gus"), { warns: 3, blocked: true, at: Date.now() }));
  await assertFails(getDoc(doc(env.authenticatedContext("hal").firestore(), "searchSafety", "gus")));
  await assertSucceeds(getDoc(ref));
});
await t("search credits: only today, only +1 to +3 per search, ceiling 300, own document only", async () => {
  const ivy = env.authenticatedContext("ivy").firestore(), day = Math.floor((Date.now() + 19800000) / 86400000), id = "ivy_" + day, ref = doc(ivy, "searchUsage", id);
  await assertSucceeds(setDoc(ref, { n: 2, d: day, at: Date.now() }));
  await assertSucceeds(setDoc(ref, { n: 5, d: day, at: Date.now() }));
  await assertFails(setDoc(ref, { n: 2, d: day, at: Date.now() }));
  await assertFails(setDoc(ref, { n: 20, d: day, at: Date.now() }));
  await assertFails(setDoc(doc(ivy, "searchUsage", "ivy_" + (day - 1)), { n: 1, d: day - 1, at: Date.now() }));
  await assertFails(setDoc(doc(ivy, "searchUsage", "joe_" + day), { n: 1, d: day, at: Date.now() }));
  await assertFails(setDoc(doc(ivy, "searchUsage", id + "x"), { n: 1, d: day, at: Date.now() }));
  await assertSucceeds(getDoc(ref));
  await assertFails(getDoc(doc(env.authenticatedContext("joe").firestore(), "searchUsage", id)));
});
await t("search credits: weekly counter follows the same rules", async () => {
  const kim = env.authenticatedContext("kim").firestore(), week = Math.floor((Math.floor((Date.now() + 19800000) / 86400000) + 3) / 7), ref = doc(kim, "searchWeek", "kim_w" + week);
  await assertSucceeds(setDoc(ref, { n: 1, w: week, at: Date.now() }));
  await assertSucceeds(setDoc(ref, { n: 4, w: week, at: Date.now() }));
  await assertFails(setDoc(ref, { n: 3, w: week, at: Date.now() }));
  await assertFails(setDoc(ref, { n: 40, w: week, at: Date.now() }));
  await assertFails(setDoc(doc(kim, "searchWeek", "kim_w" + (week - 1)), { n: 1, w: week - 1, at: Date.now() }));
  await assertFails(setDoc(doc(kim, "searchWeek", "lee_w" + week), { n: 1, w: week, at: Date.now() }));
  await assertSucceeds(getDoc(ref));
  await assertFails(getDoc(doc(env.authenticatedContext("lee").firestore(), "searchWeek", "kim_w" + week)));
});
console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup(); process.exit(fail ? 1 : 0);
