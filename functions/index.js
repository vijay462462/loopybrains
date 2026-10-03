// CampusLoop Plus: server side of the payments. NOT DEPLOYED and NOT TESTED against real Razorpay yet:
// read PREMIUM.md ("Going live") and test with Razorpay TEST keys before using real money.
//
//  createPaymentLink  - the signed-in, email-verified student asks for a payment link; we create it on Razorpay
//                       with the student's user id in the notes, so we know who paid.
//  razorpayWebhook    - Razorpay calls this when a link is paid; we check the signature and the amount, then switch
//                       on the student's Plus plan by writing entitlements/<uid> (only this server can write it).
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
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
  monthly: { amount: 4900, days: 31, label: "CampusLoop Plus - 1 month" },
  yearly: { amount: 39900, days: 366, label: "CampusLoop Plus - 1 year" },
};
const DAY = 86400000;
// Launch offer: the yearly plan costs less until this date (India time). Keep in step with `plus.offer` in docs/config.js.
const OFFER = { plan: "yearly", amount: 29900, until: Date.parse("2026-12-31T23:59:59+05:30") };
const amountFor = (key, now) => (OFFER.plan === key && now <= OFFER.until ? OFFER.amount : PLANS[key].amount);
const amountOk = (key, paid) => paid === PLANS[key].amount || (OFFER.plan === key && paid === OFFER.amount);

exports.createPaymentLink = onRequest({ secrets: [KEY_ID, KEY_SECRET], cors: true, region: "asia-south1" }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
    if (!m) return res.status(401).json({ error: "Please sign in first." });
    const user = await admin.auth().verifyIdToken(m[1]);
    if (!user.email || user.email_verified !== true) return res.status(403).json({ error: "Verify your email first." });
    const plan = PLANS[(req.body || {}).plan];
    if (!plan) return res.status(400).json({ error: "Unknown plan." });
    const rz = new Razorpay({ key_id: KEY_ID.value(), key_secret: KEY_SECRET.value() });
    const link = await rz.paymentLink.create({
      amount: amountFor(req.body.plan, Date.now()), currency: "INR", description: plan.label,
      reference_id: (user.uid.slice(0, 20) + "-" + Date.now()).slice(0, 40),
      customer: { email: user.email }, notify: { email: true, sms: false },
      notes: { uid: user.uid, plan: req.body.plan },
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
    if (!link || !payment || !notes.uid || !plan || !amountOk(notes.plan, link.amount_paid)) { console.warn("webhook: unexpected payload", link && link.id); return res.sendStatus(200); }
    const payRef = db.collection("payments").doc(payment.id), entRef = db.collection("entitlements").doc(notes.uid);
    await db.runTransaction(async (tx) => {
      if ((await tx.get(payRef)).exists) return;                                // Razorpay may send the same event twice
      const cur = await tx.get(entRef), now = Date.now();
      const from = Math.max(now, cur.exists ? Number(cur.data().until) || 0 : 0);   // renewing early adds time on top
      tx.set(entRef, { plan: "plus", until: from + plan.days * DAY, updatedAt: now });
      tx.set(payRef, { uid: notes.uid, plan: notes.plan, amount: link.amount_paid, linkId: link.id, createdAt: now });
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
const AI_SYSTEM = "You are CampusLoop's study helper for Indian college students. Only help with academics: explaining concepts, solving problems step by step, " +
  "exam and placement preparation, coding doubts, study plans, and interview practice. If asked about anything else, politely say you can only help with studies. " +
  "Be accurate and concise (under 250 words unless a derivation needs more). Show steps for calculations. If you are not sure, say so instead of guessing. " +
  "Never help with cheating on an exam in progress, and never write abusive or adult content. Use plain text, no markdown tables.";
exports.askAI = onRequest({ secrets: [ANTHROPIC_KEY], cors: true, region: "asia-south1", timeoutSeconds: 60, memory: "256MiB", maxInstances: 5 }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const m = /^Bearer (.+)$/.exec(req.get("Authorization") || "");
    if (!m) return res.status(401).json({ error: "Please sign in first." });
    const user = await admin.auth().verifyIdToken(m[1]);
    const [ent, adm] = await Promise.all([db.collection("entitlements").doc(user.uid).get(), db.collection("admins").doc(user.uid).get()]);
    const paid = ent.exists && Number(ent.data().until) > Date.now();
    if (!paid && !(adm.exists && user.email_verified === true)) return res.status(403).json({ error: "The AI helper is part of CampusLoop Plus." });
    const raw = Array.isArray((req.body || {}).messages) ? req.body.messages.slice(-8) : [];
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
      body: JSON.stringify({ model: AI_MODEL, max_tokens: 700, system: AI_SYSTEM, messages }),
    });
    if (!r.ok) { console.error("askAI upstream", r.status, (await r.text()).slice(0, 300)); return res.status(502).json({ error: "The AI helper is busy. Please try again in a minute." }); }
    const data = await r.json();
    const reply = ((data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || "").trim().slice(0, 4000);
    return res.json({ reply: reply || "Sorry, I could not answer that. Try rephrasing.", left: AI_DAILY_LIMIT - used });
  } catch (e) {
    console.error("askAI", e);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});
