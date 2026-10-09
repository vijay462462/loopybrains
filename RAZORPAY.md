# Razorpay: step-by-step (do these in order)

The payment code is already written (`functions/index.js`: `createPaymentLink`, `razorpayWebhook`). It has **never run against real Razorpay**, so follow this test-first path.

## 1. Business and account
1. Decide who receives the money (sole proprietor / LLP / company) and have a business bank account, PAN and (if required) GST.
2. Create an account at razorpay.com, complete **KYC** (Dashboard › Account & Settings). Live payments stay off until KYC is approved; **Test Mode** works immediately.
3. Razorpay asks for your website and three policy pages: use `terms.html`, `privacy.html`, `refund.html` (fill the placeholders first). You also need a contact email and phone on the site.

## 2. Test keys and Payment Links
1. Dashboard › toggle **Test Mode** › Account & Settings › **API Keys** › Generate Test Key. Save the **Key ID** and **Key Secret** (the secret is shown once).
2. Check **Payment Links** is enabled (Dashboard › Payment Links). If you cannot see it, ask Razorpay support to enable it.

## 3. Firebase Blaze plan and deploy
1. Firebase console › Usage and billing › **Blaze**. Add a budget alert of ₹500.
2. On a computer with Node 22: `npm i -g firebase-tools`, `firebase login`, `git clone https://github.com/vijay462462/loopybrains`, `cd loopybrains`, `firebase use doubt-desk-e6f39`.
3. `cd functions && npm install && cd ..`
4. Secrets (paste when asked): `firebase functions:secrets:set RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (make up a long random text), and for the AI helper `ANTHROPIC_API_KEY`, for e-mail `SMTP_USER`, `SMTP_PASS`.
5. `firebase deploy --only functions` (enter `SITE_URL` = `https://thecampusloop.co.in/`). It prints the function URLs; they look like `https://asia-south1-doubt-desk-e6f39.cloudfunctions.net/...`.
6. Publish `firestore.rules` (Firestore › Rules).

## 4. Webhook
Razorpay › Account & Settings › **Webhooks** › Add: URL = the `razorpayWebhook` URL, **Secret** = the same text as `RAZORPAY_WEBHOOK_SECRET`, event **`payment_link.paid`** only.

## 5. Switch the app to test payments
In `docs/config.js` set `plus: { enabled: true, ..., functionsUrl: "https://asia-south1-doubt-desk-e6f39.cloudfunctions.net" }`, commit, wait for the site to update.
**Warning:** `enabled: true` locks Plus features for students who have not paid (except the free trial). Do this only when you are ready to test, and use a test account.

## 6. Test checklist (Test Mode, never use a real card)
- [ ] Sign in with a verified email, open Plus, tap **Upgrade** on Exam week: the Razorpay page opens.
- [ ] Pay with a Razorpay **test card/UPI** (Dashboard › Test Mode shows test card numbers). Return to the app: the ⭐ appears, "Active until" shows (the app refreshes when you come back to the tab).
- [ ] Firestore has `entitlements/<uid>` with a future `until`, and `payments/<paymentId>`.
- [ ] Pay again: the days are **added** to the end date, not reset.
- [ ] Failed payment: nothing changes.
- [ ] Promo code and flash sale: the price on the Razorpay page is lower.
- [ ] Gift: pay for a gift, share the link, redeem with a second account, try twice (second must fail).
- [ ] Webhook retried by Razorpay does not add days twice (the payment id is stored).
- [ ] In Razorpay Test Mode, issue a refund and check your Refund policy steps.

## 7. Go live
Once KYC is approved: Razorpay Live Mode › generate **Live** keys › `firebase functions:secrets:set RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (live values) › re-create the webhook in **Live** mode with the same secret › `firebase deploy --only functions`. Make a real ₹19 payment yourself, then refund it.

## Common problems
- *"Could not start the payment"*: the function URL in `config.js` is wrong, the CSP `connect-src` in `index.html` lacks your functions domain, the email is not verified, or Payment Links is not enabled.
- *Paid but no Plus*: webhook URL/secret mismatch, or the event is not `payment_link.paid`. Look at Razorpay › Webhooks › logs and Firebase › Functions › Logs.
- *`permission-denied`*: publish the latest rules.
- Prices must match in `docs/config.js` and `functions/index.js`.
