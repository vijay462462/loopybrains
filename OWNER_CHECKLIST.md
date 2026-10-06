# Owner checklist: security steps (do these in your own accounts)

Tick each box. None of these needs code. Total time about 1 hour.

## 1. App Check (stops bots)
1. https://www.google.com/recaptcha/admin/create, sign in with the Firebase owner Google account.
2. Label `Campus Loop`, type **Score based (v3)**, domains: `thecampusloop.co.in`, `doubt-desk-e6f39.web.app`, `vijay462462.github.io`.
3. Copy the **Site key** (public) and **Secret key** (private).
4. Firebase console > App Check > Apps > your web app > reCAPTCHA v3 > paste the **Secret key** > Save. Do not enforce yet.
5. Send the **Site key** to the developer: it goes in `docs/config.js` under `appCheck.siteKey`.
6. After 3 to 5 days of mostly "verified" traffic in App Check metrics, press **Enforce** for Firestore.

## 2. Restrict the Firebase API key
1. Google Cloud console > APIs & Services > Credentials > the Browser key.
2. Application restrictions: **Websites (HTTP referrers)**. Add `https://thecampusloop.co.in/*`, `https://www.thecampusloop.co.in/*`, `https://doubt-desk-e6f39.web.app/*`, `https://vijay462462.github.io/*`.
3. Save. Open the app and sign in once to check it still works.

## 3. Protect the admin account
1. myaccount.google.com > Security > turn on **2-Step Verification** (use an authenticator app or phone prompt).
2. Never share the admin sign-in link. Give college staff the **staff** role only.

## 4. Publish the security rules and keep a backup
1. Firebase console > Firestore > Rules > paste the whole of `firestore.rules` from this repo > Publish.
2. Sign in, post a doubt and answer one to test.
3. Weekly: run the backup in SECURITY.md (service-account key stays outside this folder).

## 5. Budget alert
1. Google Cloud console > Billing > Budgets & alerts > Create budget.
2. Amounts: Rs 500 and Rs 2,000 per month, alerts at 50%, 90%, 100%.
3. Needed before turning on the Blaze plan (Cloud Functions, payments, push).

## 6. Legal check before charging
1. Fill your real contact details on the About, Terms, Privacy and Refund pages.
2. Ask a lawyer (a student-data and consumer-law check) to read them. Do this before the first rupee is collected.
3. Get the RGUKT "no objection" email on record for the pilot.
