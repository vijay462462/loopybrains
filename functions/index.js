// The Campus Loop Plus: server side of the payments. NOT DEPLOYED and NOT TESTED against real Razorpay yet:
// read PREMIUM.md ("Going live") and test with Razorpay TEST keys before using real money.
//
//  createPaymentLink  - the signed-in, email-verified student asks for a payment link; we create it on Razorpay
//                       with the student's user id in the notes, so we know who paid.
//  razorpayWebhook    - Razorpay calls this when a link is paid; we check the signature and the amount, then switch
//                       on the student's Plus plan by writing entitlements/<uid> (only this server can write it).
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");

admin.initializeApp();
const db = admin.firestore();
const KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");
const ANTHROPIC_KEY = defineSecret("ANTHROPIC_API_KEY");
const SITE_URL = defineString("SITE_URL");            // e.g. https://campusloop.in/  (also used for CORS)

// Prices in paise (1 rupee = 100 paise). Keep in step with `plus` in docs/config.js.
const PLANS = {
  weekly: { amount: 1900, days: 7, label: "The Campus Loop Plus - 1 week (exam pass)" },
  semester: { amount: 14900, days: 130, label: "The Campus Loop Plus - semester (about 4 months)" },
  monthly: { amount: 4900, days: 31, label: "The Campus Loop Plus - 1 month" },
  yearly: { amount: 39900, days: 366, label: "The Campus Loop Plus - 1 year" },
};
const DAY = 86400000;
// ---------- Security helpers ----------
// Only our own site may call these functions from a browser (a token is also required, this is a second wall).
const ALLOWED_ORIGINS = ["https://vijay462462.github.io", "http://localhost:8000", "http://127.0.0.1:8000"];
// Per-student rate limit kept in Firestore (collection `rateLimits`, server-only). Returns false when the student has used up their allowance.
async function allow(uid, key, max, windowMs) {
  const ref = db.collection("rateLimits").doc(uid + "_" + key + "_" + Math.floor(Date.now() / windowMs));
  return db.runTransaction(async (tx) => {
    const s = await tx.get(ref), n = s.exists ? Number(s.data().n) || 0 : 0;
    if (n >= max) return false;
    tx.set(ref, { n: n + 1, uid, key, at: Date.now() });
    return true;
  }).catch(() => true);          // never block a real student if the limiter itself has a hiccup
}

const GIFT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// Launch offer: the yearly plan costs less until this date (India time). Keep in step with `plus.offer` in docs/config.js.
const OFFER = { plan: "yearly", amount: 29900, until: Date.parse("2026-12-31T23:59:59+05:30") };
const amountFor = (key, now) => (OFFER.plan === key && now <= OFFER.until ? OFFER.amount : PLANS[key].amount);
const amountOk = (key, paid) => paid === PLANS[key].amount || (OFFER.plan === key && paid === OFFER.amount);

// Promo codes: documents in `promoCodes/<CODE>` created by an admin in the dashboard (percent off, plan, expiry, max uses).
const promoFor = async (rawCode, planKey) => {
  const code = String(rawCode || "").toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return { error: "That code is not valid." };
  const snap = await db.collection("promoCodes").doc(code).get();
  if (!snap.exists) return { error: "That code was not found." };
  const d = snap.data();
  if (d.active === false || Number(d.until) < Date.now()) return { error: "That code has expired." };
  if ((Number(d.used) || 0) >= (Number(d.maxUses) || 0)) return { error: "That code has been fully used." };
  if (planKey && d.plan !== "any" && d.plan !== planKey) return { error: "That code is for the " + d.plan + " plan." };
  return { code, plan: d.plan, percent: Math.min(90, Math.max(5, Number(d.percent) || 0)) };
};
exports.checkPromo = onRequest({ cors: ALLOWED_ORIGINS, region: "asia-south1", maxInstances: 5 }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
    if (!m) return res.status(401).json({ error: "Please sign in first." });
    const pu = await admin.auth().verifyIdToken(m[1]);
    if (!(await allow(pu.uid, "promo", 15, 3600000))) return res.status(429).json({ error: "Too many tries. Please wait a while and try again." });
    const b = req.body || {}, p = await promoFor(b.code, b.plan);
    return p.error ? res.status(400).json({ error: p.error }) : res.json({ code: p.code, percent: p.percent, plan: p.plan });
  } catch (e) { console.error("checkPromo", e); return res.status(500).json({ error: "Could not check the code." }); }
});

exports.createPaymentLink = onRequest({ secrets: [KEY_ID, KEY_SECRET], cors: ALLOWED_ORIGINS, region: "asia-south1" }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
    if (!m) return res.status(401).json({ error: "Please sign in first." });
    const user = await admin.auth().verifyIdToken(m[1]);
    if (!user.email || user.email_verified !== true) return res.status(403).json({ error: "Verify your email first." });
    const plan = PLANS[(req.body || {}).plan];
    if (!plan) return res.status(400).json({ error: "Unknown plan." });
    if (!(await allow(user.uid, "paylink", 12, 3600000))) return res.status(429).json({ error: "Too many payment attempts. Please wait a while." });
    let amount = amountFor(req.body.plan, Date.now()), code = "";
    if (req.body.code) {
      const p = await promoFor(req.body.code, req.body.plan);
      if (p.error) return res.status(400).json({ error: p.error });
      code = p.code; amount = Math.max(100, Math.round(amount * (100 - p.percent) / 100));
    }
    const rz = new Razorpay({ key_id: KEY_ID.value(), key_secret: KEY_SECRET.value() });
    const link = await rz.paymentLink.create({
      amount, currency: "INR", description: (req.body.gift ? "Gift: " : "") + plan.label,
      reference_id: (user.uid.slice(0, 20) + "-" + Date.now()).slice(0, 40),
      customer: { email: user.email }, notify: { email: true, sms: false },
      notes: { uid: user.uid, plan: req.body.plan, amount: String(amount), code, gift: req.body.gift ? "1" : "" },
      callback_url: SITE_URL.value(), callback_method: "get",
    });
    return res.json({ url: link.short_url });
  } catch (e) {
    console.error("createPaymentLink", e);
    return res.status(500).json({ error: "Could not start the payment. Please try again." });
  }
});

exports.razorpayWebhook = onRequest({ secrets: [WEBHOOK_SECRET], region: "asia-south1" }, async (req, res) => {
  try {
    const sig = req.get("x-razorpay-signature") || "";
    if (!Razorpay.validateWebhookSignature(req.rawBody.toString("utf8"), sig, WEBHOOK_SECRET.value())) return res.status(400).send("bad signature");
    const ev = req.body || {};
    if (ev.event !== "payment_link.paid") return res.sendStatus(200);          // ignore other events
    const link = ev.payload && ev.payload.payment_link && ev.payload.payment_link.entity;
    const payment = ev.payload && ev.payload.payment && ev.payload.payment.entity;
    const notes = (link && link.notes) || {};
    const plan = PLANS[notes.plan];
    if (!link || !payment || !notes.uid || !plan || !(notes.amount ? (link.amount_paid === Number(notes.amount) && link.amount_paid >= 100 && link.amount_paid <= plan.amount) : amountOk(notes.plan, link.amount_paid))) { console.warn("webhook: unexpected payload", link && link.id); return res.sendStatus(200); }
    const payRef = db.collection("payments").doc(payment.id), entRef = db.collection("entitlements").doc(notes.uid);
    await db.runTransaction(async (tx) => {
      if ((await tx.get(payRef)).exists) return;                                // Razorpay may send the same event twice
      const cur = await tx.get(entRef), now = Date.now();
      if (notes.gift === "1") {                                                  // a gift: make a redeemable code instead of upgrading the payer
        const giftCode = Array.from(crypto.randomBytes(12), b => GIFT_ALPHABET[b % GIFT_ALPHABET.length]).join("");
        tx.set(db.collection("gifts").doc(giftCode), { from: notes.uid, plan: notes.plan, days: plan.days, redeemedBy: "", createdAt: now });
      } else {
        const from = Math.max(now, cur.exists ? Number(cur.data().until) || 0 : 0);   // renewing early adds time on top
        tx.set(entRef, { plan: "plus", until: from + plan.days * DAY, updatedAt: now });
      }
      tx.set(payRef, { uid: notes.uid, plan: notes.plan, amount: link.amount_paid, linkId: link.id, code: notes.code || "", createdAt: now });
      if (notes.code) tx.set(db.collection("promoCodes").doc(notes.code), { used: admin.firestore.FieldValue.increment(1) }, { merge: true });
    });
    return res.sendStatus(200);
  } catch (e) {
    console.error("razorpayWebhook", e);
    return res.sendStatus(500);                                                   // Razorpay retries on failure
  }
});

// ---------- AI study helper (Plus) ----------
// askAI: a paying student (or an admin, for testing) sends the last few chat messages; we add a strict study-only
// instruction, call the Claude API with OUR secret key (the key never reaches the phone), and return the answer.
// Limits: 40 questions per student per day, short messages, short answers. NOT DEPLOYED and NOT TESTED yet.
const AI_MODEL = "claude-haiku-4-5-20251001";
const AI_DAILY_LIMIT = 40;
const AI_SYSTEM = "You are The Campus Loop's study helper for Indian college students. Only help with academics: explaining concepts, solving problems step by step, " +
  "exam and placement preparation, coding doubts, study plans, and interview practice. If asked about anything else, politely say you can only help with studies. " +
  "Be accurate and concise (under 250 words unless a derivation needs more). Show steps for calculations. If you are not sure, say so instead of guessing. " +
  "Never help with cheating on an exam in progress, and never write abusive or adult content. Use plain text, no markdown tables.";
// Search mode: the app sends a topic and gets back a structured study card (summary, key points, search phrases for the best videos, diagrams and PDFs).
const AI_SEARCH_SYSTEM = "You are Loopy AI, the study search engine of The Campus Loop for Indian college students. Given a topic, reply with ONLY a JSON object, no other text, with these keys: " +
  "\"summary\" (plain text, 60 to 110 words, accurate and simple), \"keyPoints\" (3 to 6 short strings), \"example\" (one short worked example or analogy), " +
  "\"videoQueries\" (3 to 5 short YouTube search phrases for the best lectures, prefer NPTEL, IIT, MIT OCW and well known teachers), " +
  "\"diagramQueries\" (2 or 3 short image search phrases), \"pdfQueries\" (2 or 3 short phrases for lecture notes or previous papers), \"related\" (3 to 5 related topic names). " +
  "Only academic topics. If the topic is not academic, return {\"summary\":\"Loopy AI only searches study topics.\",\"keyPoints\":[],\"example\":\"\",\"videoQueries\":[],\"diagramQueries\":[],\"pdfQueries\":[],\"related\":[]}. If unsure, say so in the summary instead of guessing.";
const strList = (a, n, len) => (Array.isArray(a) ? a : []).filter(x => typeof x === "string" && x.trim()).slice(0, n).map(x => x.replace(/[\u0000-\u001F<>]/g, " ").trim().slice(0, len));
exports.askAI = onRequest({ secrets: [ANTHROPIC_KEY], cors: ALLOWED_ORIGINS, region: "asia-south1", timeoutSeconds: 60, memory: "256MiB", maxInstances: 5 }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
    if (!m) return res.status(401).json({ error: "Please sign in first." });
    const user = await admin.auth().verifyIdToken(m[1]);
    const [ent, adm] = await Promise.all([db.collection("entitlements").doc(user.uid).get(), db.collection("admins").doc(user.uid).get()]);
    let paid = ent.exists && Number(ent.data().until) > Date.now();
    if (!paid) {                                                                  // college bundle: the college's Plus is on AND the e-mail belongs to that college
      const slug = String((req.body || {}).college || "");
      if (/^[a-z0-9-]{2,40}$/.test(slug)) {
        const [cp, col] = await Promise.all([db.collection("collegePlus").doc(slug).get(), db.collection("colleges").doc(slug).get()]);
        const domains = (col.exists && Array.isArray(col.data().domains)) ? col.data().domains : [], host = String(user.email || "").toLowerCase().split("@")[1] || "";
        paid = user.email_verified === true && cp.exists && Number(cp.data().until) > Date.now() && domains.length > 0 && domains.some(d => host === d || host.endsWith("." + d));
      }
    }
    if (!paid && !(adm.exists && user.email_verified === true)) return res.status(403).json({ error: "The AI helper is part of The Campus Loop Plus." });
    const searchMode = (req.body || {}).mode === "search";
    const topic = searchMode ? String((req.body || {}).query || "").replace(/[\u0000-\u001F<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) : "";
    if (searchMode && topic.length < 2) return res.status(400).json({ error: "Type a topic first." });
    const level = ["quick", "deep", "exam"].includes((req.body || {}).level) ? req.body.level : "quick";
    const raw = searchMode ? [{ role: "user", content: "Topic: " + topic + "\nLevel: " + level }] : (Array.isArray((req.body || {}).messages) ? req.body.messages.slice(-8) : []);
    const messages = raw.filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string" && x.content.trim())
      .map(x => ({ role: x.role, content: x.content.trim().slice(0, 1500) }));
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== "user") return res.status(400).json({ error: "Ask a question first." });
    const day = new Date().toISOString().slice(0, 10), useRef = db.collection("aiUsage").doc(user.uid + "_" + day);
    const used = await db.runTransaction(async (tx) => {
      const cur = await tx.get(useRef), n = cur.exists ? Number(cur.data().n) || 0 : 0;
      if (n >= AI_DAILY_LIMIT) return -1;
      tx.set(useRef, { n: n + 1, uid: user.uid, day });
      return n + 1;
    });
    if (used < 0) return res.status(429).json({ error: "You have used today's " + AI_DAILY_LIMIT + " questions. Come back tomorrow." });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY.value(), "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: AI_MODEL, max_tokens: searchMode ? 1000 : 700, system: searchMode ? AI_SEARCH_SYSTEM : AI_SYSTEM, messages }),
    });
    if (!r.ok) { console.error("askAI upstream", r.status, (await r.text()).slice(0, 300)); return res.status(502).json({ error: "The AI helper is busy. Please try again in a minute." }); }
    const data = await r.json();
    const reply = ((data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || "").trim().slice(0, 4000);
    if (searchMode) {
      let o = {}; try { const j = reply.slice(reply.indexOf("{"), reply.lastIndexOf("}") + 1); o = JSON.parse(j); } catch (_) {}
      const card = { summary: String(o.summary || "").replace(/[\u0000-\u001F<>]/g, " ").trim().slice(0, 900), keyPoints: strList(o.keyPoints, 6, 160), example: String(o.example || "").replace(/[\u0000-\u001F<>]/g, " ").trim().slice(0, 400),
        videoQueries: strList(o.videoQueries, 5, 80), diagramQueries: strList(o.diagramQueries, 3, 80), pdfQueries: strList(o.pdfQueries, 3, 80), related: strList(o.related, 5, 60) };
      if (!card.summary) return res.status(502).json({ error: "Loopy AI could not answer that. Try rephrasing." });
      return res.json({ search: card, left: AI_DAILY_LIMIT - used });
    }
    return res.json({ reply: reply || "Sorry, I could not answer that. Try rephrasing.", left: AI_DAILY_LIMIT - used });
  } catch (e) {
    console.error("askAI", e);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ---------- Referral rewards ----------
// A student shares ?ref=<first 10 characters of their sign-in id>. When the friend has a VERIFIED email and calls claimReferral
// once, the referrer gets +7 days of Plus (up to 8 friends = 56 days) and the friend gets +3 days. Everything is checked here.
const REF_REFERRER_DAYS = 7, REF_FRIEND_DAYS = 3, REF_MAX = 8;
exports.claimReferral = onRequest({ cors: ALLOWED_ORIGINS, region: "asia-south1", maxInstances: 5 }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
    if (!m) return res.status(401).json({ error: "Please sign in first." });
    const user = await admin.auth().verifyIdToken(m[1]);
    if (!user.email || user.email_verified !== true) return res.status(403).json({ error: "Verify your email first." });
    const code = String((req.body || {}).code || "");
    if (!/^[A-Za-z0-9_-]{10}$/.test(code)) return res.status(400).json({ error: "That invite code is not valid." });
    if (!(await allow(user.uid, "referral", 10, 86400000))) return res.status(429).json({ error: "Too many tries today." });
    const codeSnap = await db.collection("refCodes").doc(code).get();
    if (!codeSnap.exists) return res.status(404).json({ error: "That invite code was not found." });
    const referrer = codeSnap.data().uid;
    if (referrer === user.uid) return res.status(400).json({ error: "You cannot use your own invite." });
    const result = await db.runTransaction(async (tx) => {
      const claimRef = db.collection("referrals").doc(user.uid), statRef = db.collection("refStats").doc(referrer);
      const [claim, stat, entF, entR] = await Promise.all([tx.get(claimRef), tx.get(statRef), tx.get(db.collection("entitlements").doc(user.uid)), tx.get(db.collection("entitlements").doc(referrer))]);
      if (claim.exists) return "already";
      const n = stat.exists ? Number(stat.data().n) || 0 : 0, now = Date.now();
      const grant = (snap, days) => { const from = Math.max(now, snap.exists ? Number(snap.data().until) || 0 : 0); return { plan: "plus", until: from + days * DAY, updatedAt: now }; };
      tx.set(claimRef, { referrer, code, createdAt: now });
      tx.set(db.collection("entitlements").doc(user.uid), grant(entF, REF_FRIEND_DAYS));
      if (n < REF_MAX) { tx.set(db.collection("entitlements").doc(referrer), grant(entR, REF_REFERRER_DAYS)); tx.set(statRef, { n: n + 1, updatedAt: now }); }
      return "ok";
    });
    if (result === "already") return res.status(409).json({ error: "You have already used an invite." });
    return res.json({ ok: true, days: REF_FRIEND_DAYS });
  } catch (e) {
    console.error("claimReferral", e);
    return res.status(500).json({ error: "Could not apply the invite. Please try again." });
  }
});

// ---------- Plus gifts ----------
// A student pays for a gift (createPaymentLink with gift:true); the webhook then creates gifts/<CODE>. The gift link is
// ?gift=<CODE>. A friend with a verified email redeems it once with redeemGift and gets the plan days.
const bearerUser = async (req, res) => {
  const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
  if (!m) { res.status(401).json({ error: "Please sign in first." }); return null; }
  const user = await admin.auth().verifyIdToken(m[1]);
  if (!user.email || user.email_verified !== true) { res.status(403).json({ error: "Verify your email first." }); return null; }
  return user;
};
exports.listGifts = onRequest({ cors: ALLOWED_ORIGINS, region: "asia-south1", maxInstances: 5 }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const user = await bearerUser(req, res); if (!user) return;
    const snap = await db.collection("gifts").where("from", "==", user.uid).limit(30).get();
    const gifts = snap.docs.map(d => ({ code: d.id, plan: d.data().plan, days: d.data().days, redeemed: !!d.data().redeemedBy, createdAt: d.data().createdAt })).sort((a, b) => b.createdAt - a.createdAt);
    return res.json({ gifts });
  } catch (e) { console.error("listGifts", e); return res.status(500).json({ error: "Could not load your gifts." }); }
});
exports.redeemGift = onRequest({ cors: ALLOWED_ORIGINS, region: "asia-south1", maxInstances: 5 }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const user = await bearerUser(req, res); if (!user) return;
    const code = String((req.body || {}).code || "").toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{12}$/.test(code)) return res.status(400).json({ error: "That gift code is not valid." });
    if (!(await allow(user.uid, "gift", 10, 3600000))) return res.status(429).json({ error: "Too many tries. Please wait a while." });
    const out = await db.runTransaction(async (tx) => {
      const gRef = db.collection("gifts").doc(code), eRef = db.collection("entitlements").doc(user.uid);
      const [g, e] = await Promise.all([tx.get(gRef), tx.get(eRef)]);
      if (!g.exists) return { status: 404, error: "That gift was not found." };
      const d = g.data();
      if (d.redeemedBy) return { status: 409, error: "This gift has already been used." };
      if (d.from === user.uid) return { status: 400, error: "You cannot redeem your own gift. Send the link to a friend." };
      const now = Date.now(), from = Math.max(now, e.exists ? Number(e.data().until) || 0 : 0);
      tx.set(eRef, { plan: "plus", until: from + d.days * DAY, updatedAt: now });
      tx.update(gRef, { redeemedBy: user.uid, redeemedAt: now });
      return { days: d.days };
    });
    return out.error ? res.status(out.status).json({ error: out.error }) : res.json({ ok: true, days: out.days });
  } catch (e) { console.error("redeemGift", e); return res.status(500).json({ error: "Could not redeem the gift. Please try again." }); }
});

// ---------- Weekly engagement report e-mail ----------
// Every Monday 08:00 (India time) each college listed in reportEmails/<slug> (set up by an admin in the dashboard) gets an e-mail
// with the last 7 days against the 7 days before. Only counts and subjects, never names or post text. NOT DEPLOYED and NOT TESTED yet.
// Mail goes out through any SMTP account (for example a Gmail address with an App Password): set secrets SMTP_USER and SMTP_PASS.
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const POST_COLLS = [["doubts", "Doubts"], ["ideas", "Ideas"], ["clubs", "Club posts"], ["gate", "GATE"], ["jobs", "Jobs"], ["challenges", "Challenges"], ["market", "Market"]];
const countRange = async (col, from, to) => { try { return (await col.where("createdAt", ">=", from).where("createdAt", "<", to).count().get()).data().count; } catch (e) { return 0; } };
const recentDocs = async (col, from) => { try { return (await col.where("createdAt", ">=", from).limit(1000).get()).docs.map(d => ({ id: d.id, ...d.data() })); } catch (e) { return []; } };
const pct = (cur, prev) => { const d = prev ? Math.round((cur - prev) * 100 / prev) : (cur ? 100 : 0); return d > 0 ? "up " + d + "%" : d < 0 ? "down " + Math.abs(d) + "%" : "no change"; };
async function buildReport(room, name) {
  const now = Date.now(), W = 7 * DAY, t0 = now - W, t1 = now - 2 * W, base = db.collection("rooms").doc(room);
  const counts = {};
  await Promise.all([...POST_COLLS.map(x => x[0]), "replies", "stories"].map(async c => { counts[c] = [await countRange(base.collection(c), t0, now + 1), await countRange(base.collection(c), t1, t0)]; }));
  const [recent, replies, profiles] = await Promise.all([Promise.all(POST_COLLS.map(x => recentDocs(base.collection(x[0]), t0))), recentDocs(base.collection("replies"), t0), base.collection("profiles").count().get().then(s => s.data().count).catch(() => 0)]);
  const all = recent.flat(), active = new Set([...all, ...replies].map(x => x.authorId).filter(Boolean)), doubts = recent[0] || [];
  const answered = new Set(replies.filter(r => r.parentColl === "doubts").map(r => r.parentId)), nAnswered = doubts.filter(d => answered.has(d.id)).length;
  const subj = {}; for (const d of doubts) subj[d.subject || "Other"] = (subj[d.subject || "Other"] || 0) + 1;
  const top = Object.entries(subj).sort((a, b) => b[1] - a[1]).slice(0, 5), flagged = all.filter(x => x.deleted || (x.reports || []).length >= 2).length;
  const total = POST_COLLS.reduce((n, x) => n + counts[x[0]][0], 0), prev = POST_COLLS.reduce((n, x) => n + counts[x[0]][1], 0);
  const range = new Date(t0).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) + " to " + new Date(now).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const lines = [
    name + " on The Campus Loop: weekly engagement report (" + range + ")", "",
    "Active students this week: " + active.size + " (of " + profiles + " with a profile)",
    "New posts: " + total + " (" + pct(total, prev) + " vs last week)", "Replies: " + counts.replies[0] + " (" + pct(counts.replies[0], counts.replies[1]) + ")",
    "Doubts asked: " + doubts.length + ", answered: " + nAnswered + (doubts.length ? " (" + Math.round(nAnswered * 100 / doubts.length) + "%)" : ""),
    "Stories shared: " + counts.stories[0], "Most asked subjects: " + (top.map(t => t[0] + " (" + t[1] + ")").join(", ") || "none this week"),
    "Items reported or hidden by moderators: " + flagged, "",
    "This report contains only counts and subjects, never student names or post text.", "Thank you for supporting your students. - The Campus Loop",
  ];
  return { subject: "The Campus Loop weekly report: " + name, text: lines.join("\n"), html: "<div style=\"font-family:Arial,sans-serif;line-height:1.5\"><h2>" + name.replace(/[<>&]/g, "") + " - weekly report</h2><p>" + range + "</p><ul>" + lines.slice(2, 9).map(l => "<li>" + l.replace(/[<>&]/g, "") + "</li>").join("") + "</ul><p style=\"color:#666\">" + lines.slice(10).join("<br>") + "</p></div>" };
}
const mailer = () => nodemailer.createTransport({ service: "gmail", auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() } });
async function sendReportFor(slug, d, tx) {
  const rep = await buildReport(d.room, d.name || slug);
  await tx.sendMail({ from: '"The Campus Loop" <' + SMTP_USER.value() + ">", to: (d.emails || []).join(","), subject: rep.subject, text: rep.text, html: rep.html });
  await db.collection("reportEmails").doc(slug).set({ lastSent: Date.now() }, { merge: true });
}
exports.weeklyReport = onSchedule({ schedule: "every monday 08:00", timeZone: "Asia/Kolkata", region: "asia-south1", secrets: [SMTP_USER, SMTP_PASS], timeoutSeconds: 540, memory: "512MiB" }, async () => {
  const snap = await db.collection("reportEmails").where("active", "==", true).limit(200).get(), tx = mailer();
  for (const doc of snap.docs) { try { const d = doc.data(); if ((d.emails || []).length) await sendReportFor(doc.id, d, tx); } catch (e) { console.error("weeklyReport", doc.id, e); } }
});
// Admin button "Send test email now" in the dashboard.
exports.sendReportNow = onRequest({ secrets: [SMTP_USER, SMTP_PASS], cors: ALLOWED_ORIGINS, region: "asia-south1", timeoutSeconds: 120, maxInstances: 2 }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
    if (!m) return res.status(401).json({ error: "Please sign in first." });
    const user = await admin.auth().verifyIdToken(m[1]);
    const adm = await db.collection("admins").doc(user.uid).get();
    if (!adm.exists || user.email_verified !== true) return res.status(403).json({ error: "Admins only." });
    const slug = String((req.body || {}).slug || "");
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) return res.status(400).json({ error: "Bad college." });
    const snap = await db.collection("reportEmails").doc(slug).get();
    if (!snap.exists || !(snap.data().emails || []).length) return res.status(404).json({ error: "Add at least one email first." });
    await sendReportFor(slug, snap.data(), mailer());
    return res.json({ ok: true });
  } catch (e) { console.error("sendReportNow", e); return res.status(500).json({ error: "Could not send. Check the e-mail settings." }); }
});
