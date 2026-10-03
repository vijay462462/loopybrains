# CampusLoop: premium and payments plan

This is a working plan, not legal or tax advice. Numbers marked (guess) are starting points to test, not facts.

## 1. What stays free, what is paid

**Free forever (do not take away):** the board (doubts, ideas, clubs, GATE, jobs, market), stories, quizzes, study lab, power tools, the college picker, email verification and the ✔.

**CampusLoop Plus (students), suggested price ₹49 a month or ₹399 a year (guess):**
- Built now: cloud backup and restore of flashcards, notes, tasks and planner (works across phones when the student has a verified email), and a ⭐ next to the name.
- Built now: Plus studio with a smart coach (readiness score and best next step), timed mock tests for subjects and placements with a progress chart, mistake notebook, exam planner with spaced revision, and profile themes (all free while `plus.enabled` is false). Build next: AI doubt helper (needs a paid AI backend), previous-year paper vault.
- Rule: never put today's free features behind the paywall. Plus only adds.

**Colleges (B2B), suggested ₹30 to ₹60 per student per year with a minimum (guess):** admin dashboard, announcements, moderation tools, engagement reports, club and event management, verified-student-only boards (`requireVerified`), placement cell tools.

**Recruiters and partners (guess):** paid job posts (₹499 to ₹1,999), sponsored quizzes and challenges, coaching and ed-tech partnerships. In many student apps this pays better than student subscriptions.

## 2. Reality check on the numbers

Example: 10,000 students, 2% pay ₹399 a year = ₹79,800 a year before fees and tax. Student subscriptions alone are small. Plan on B2B and recruiter income, and use Plus to learn what students value. The in-app survey (Profile > CampusLoop Plus > Help us decide) collects exactly this: wanted features and price they would pay. Read the answers in Firebase > Firestore > `plusInterest` before building more.

## 3. What is built

| Piece | Where | State |
| --- | --- | --- |
| Plus screen, benefits, survey | app (`renderPlus`) | working |
| Backup and restore | app + rules `userData` | working for verified-email students; free while `plus.enabled` is false |
| ⭐ badge | profile `plus` flag, rules check the paid plan | works once payments are on |
| Entitlement record | Firestore `entitlements/<uid>`, written only by the server | rules done |
| Payment link + webhook | `functions/index.js` (Razorpay) | written, **not deployed, not tested** |
| Switch | `plus: { enabled: false, ... }` in `docs/config.js` | off |

## 4. Going live (do these in order, with Razorpay TEST keys first)

1. **Business:** register a business (sole proprietor, LLP or company), open a business bank account, and check GST rules for your income level.
2. **Legal pages:** Terms of Use, Privacy Policy, Refund and Cancellation Policy, and a grievance contact. Have a lawyer review them. Razorpay and Google Play both ask for them.
3. **Razorpay:** create an account, complete KYC, create TEST keys. Payment Links must be enabled.
4. **Firebase plan:** switch the project to the Blaze (pay as you go) plan. Functions need it. Set a budget alert.
5. **Deploy the functions:** install the Firebase CLI, run in the repo root: `firebase functions:secrets:set RAZORPAY_KEY_ID`, `... RAZORPAY_KEY_SECRET`, `... RAZORPAY_WEBHOOK_SECRET`, set `SITE_URL` to your site, then `firebase deploy --only functions`. Note the two function URLs.
6. **Webhook:** in Razorpay > Settings > Webhooks add the `razorpayWebhook` URL, tick the `payment_link.paid` event, and use the same secret as step 5.
7. **App settings:** in `docs/config.js` set `plus: { enabled: true, monthly: 49, yearly: 399, functionsUrl: "https://asia-south1-<project>.cloudfunctions.net" }`. In `docs/index.html` add the functions domain to the Content-Security-Policy `connect-src` (for example `https://asia-south1-<project>.cloudfunctions.net`), since the app calls it.
8. **Rules:** publish the current `firestore.rules`. To make backup a paid feature create the Firestore document `config/plus` with the field `required: true`.
9. **Test with TEST keys:** verify an email, pay with Razorpay test card/UPI, check `entitlements/<uid>` appears, the ⭐ shows, backup works, and a second payment adds time. Test a failed payment and a refund.
10. **Switch to LIVE keys** only after all tests pass. Keep the secrets out of the repo.

## 5. Android app and the Play Store

A paid plan sold inside a Play Store app must normally use Google Play Billing (a fee of about 15% to 30%). Selling through the website (as above) avoids that, but Play policies change, so read them before listing the app. Apple has similar rules for iPhone.

## 6. Risks to manage

- Do not promise features that are not built. The Plus screen already says "coming next".
- Refunds and failed payments need a person to answer them: put a support email in the app.
- Keep student data private: the survey email is optional and only for telling students when Plus opens.
- Test the webhook carefully: a bug there can give Plus to the wrong person or not at all. The amount and the plan in the payment are checked, and each payment id is processed once.

## 7. AI study helper (Claude) and paper vault

**Paper vault:** works once the new rules are published. In `/admin.html` pick a college, open the Papers tab, and add papers as https links (upload files to Google Drive with "anyone with the link can view"). Add only papers you may share. Plus students open them from Profile > CampusLoop Plus > Paper vault.

**AI helper:** the app only talks to our own function `askAI` (in `functions/index.js`), which calls the Claude API with a secret key that never reaches the phone. It is **written but NOT deployed and NOT tested**. To switch on:
1. Create an API key at console.anthropic.com and set a monthly spend limit there.
2. `firebase functions:secrets:set ANTHROPIC_API_KEY`, then `firebase deploy --only functions` (Blaze plan needed; set a budget alert).
3. Set `plus.functionsUrl` in `docs/config.js` and add the functions domain to `connect-src` in `docs/index.html`.
4. Paying students (or admins, for testing) get 40 questions a day; change `AI_DAILY_LIMIT` in the function to suit the cost. The default model is claude-haiku-4-5-20251001 (cheapest); change `AI_MODEL` for stronger answers at a higher cost.
5. Test with your admin account first, and check what a day of use costs before opening it to everyone.
