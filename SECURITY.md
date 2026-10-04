# CampusLoop security review (before launch)

Scope: Firestore rules, the web app, the admin dashboard, the Cloud Functions (payments, AI helper, gifts, referrals, e-mail) and the repository. Method: reading the code, searching for dangerous patterns, and 185 automated rules tests (115 + 53 + 17) (emulator). Not a substitute for an independent penetration test once you take real money.

## Summary
No critical problems were found. Rules deny everything that is not listed, secrets are not in the repository, and the web pages block inline scripts. Four items were fixed in this review; the rest are settings you must switch on in Google/Firebase (they are not in the code).

## What is already good
- **Rules deny by default.** Every collection is listed; anything else is refused. Payments, entitlements, gifts, referrals, rate limits and AI usage can only be written by the server (Admin SDK), never from a phone.
- **Admins and staff** need a verified email and a document in `admins` or `staff`. Staff can only act inside their own college's room. 115 tests prove students cannot hide others' posts, edit text, read applicant lists or change prices.
- **Ownership:** new posts carry `ownerUid`; only the author or an admin can change them.
- **Content-Security-Policy** has no `unsafe-inline` and no `eval`: injected scripts cannot run. Inline user content is added with `textContent`, not `innerHTML`. The Loop Bot escapes text before rendering and only allows http/https links.
- **Links** posted by admins (papers, drives, events, notices) must start with `https://`; the rules and the app both check it. External links open with `noopener`.
- **Payments:** the webhook checks Razorpay's signature, the payment amount (the server writes the expected amount into the payment link) and processes each payment id once. Card details never touch our servers.
- **AI helper:** the key lives in a server secret, only paid students or verified college-bundle students can use it, 40 questions a day.
- **Secrets:** nothing secret is committed. The Firebase `apiKey` in `config.js` is public by design (it identifies the project; the rules protect the data).

## Fixed in this review
1. **Brute-forcing codes.** Promo, gift and invite codes could be guessed by trying many. Each student is now limited (promo 15 an hour, payment links 12 an hour, gifts 10 an hour, invites 10 a day) by a server-side limiter.
2. **Any website could call our functions from a browser.** CORS is now limited to `https://vijay462462.github.io` (and localhost for testing). Change `ALLOWED_ORIGINS` in `functions/index.js` if you move to your own domain.
3. Bot/admin checks re-confirmed: no `innerHTML` with untrusted text anywhere in the app or dashboard.
4. Added this document and a launch checklist.

## Do these before launch (settings, not code)
1. **Restrict the Firebase API key.** Google Cloud console › APIs & Services › Credentials › your browser key › *HTTP referrers*: add `https://vijay462462.github.io/*` (and your own domain later). Limit it to the APIs you use (Identity Toolkit, Firestore, Token Service).
2. **Turn on Firebase App Check** (reCAPTCHA v3/Enterprise) and enforce it for Firestore. This stops bots and scripts that use your key from creating thousands of anonymous accounts and spamming. This is the single most valuable protection left.
3. **Protect admin accounts.** Use a Google/e-mail account with 2-step verification for the admin e-mail; never share the admin sign-in link. Give college staff only the staff role.
4. **Publish `firestore.rules`** from the repo, then run the sign-in and posting checks once. Keep `firestore.rules.open` as an emergency rollback only.
5. **Budget alerts** on the Blaze plan (₹500 and ₹2,000) and an Anthropic spending limit for the AI key.
6. **Rotate any key pasted anywhere** (chat, email, screenshots). Razorpay secrets, SMTP password and the Anthropic key go only into `firebase functions:secrets:set`.
7. **Backups:** schedule a Firestore export (Firebase console › Firestore › Import/Export) weekly.
8. **Turn off the every-visit welcome** (`welcomeEveryVisit: false` in `docs/config.js`) and fill in your real contact details on the About, Terms, Privacy and Refund pages.

## Known limits (accepted for now)
- **Plus locks on the phone are client-side.** A technical user can unlock studio features (mock tests, planner) on their own phone. The valuable, costly things are enforced on the server: AI helper, gifts, promo prices, referrals, payments.
- **Weekly leaderboard scores are reported by each phone** (capped at 3000 a week by the rules). Fine for fun; do not give cash prizes without server checks.
- **Open forms** (college requests, Plus survey) are size-limited but not rate-limited; App Check (item 2) covers them.
- **Anonymous accounts** mean a banned person can come back with a new device id. Blocking is per device; App Check and staff moderation are the answer, not passwords.
- **Student data minimisation:** the placement list holds name, branch, CGPA and an optional phone, visible to the placement cell only. Mention it in the Privacy Policy (done) and delete old drives periodically.

## Re-test after every rules change
`cd tests/rules && ./node_modules/.bin/firebase emulators:exec --only firestore --project demo-test "node admin.test.mjs && node app.test.mjs && node battle.test.mjs"`

## Verified email to post (global switch)
Admin dashboard, Overview, "Student safety". When on (`settings/posting.verifiedPosting = true`), the rules refuse every post, answer, story and profile write unless the user has a verified email, on every board including RGUKT. Reading stays open. The per-college `requireVerified` and `domains` settings still apply on top. Publish the latest `firestore.rules` first, then flip the switch. Turn it off to roll back instantly, no redeploy.
