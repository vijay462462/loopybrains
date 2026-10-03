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
const SITE_URL = defineString("SITE_URL");            // e.g. https://campusloop.in/  (also used for CORS)

// Prices in paise (1 rupee = 100 paise). Keep in step with `plus` in docs/config.js.
const PLANS = {
  monthly: { amount: 4900, days: 31, label: "CampusLoop Plus - 1 month" },
  yearly: { amount: 39900, days: 366, label: "CampusLoop Plus - 1 year" },
};
const DAY = 86400000;

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
      amount: plan.amount, currency: "INR", description: plan.label,
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
    if (!link || !payment || !notes.uid || !plan || link.amount_paid !== plan.amount) { console.warn("webhook: unexpected payload", link && link.id); return res.sendStatus(200); }
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
