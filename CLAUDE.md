# Loopy Brains (loopybrains.com)

> Brand renamed from "The Campus Loop" to **Loopy Brains** (user-facing text only). New logo: a gold neural infinity loop with a spark, on midnight indigo; sources in `docs/brand/loopy-brains-*.svg`, exported to `docs/icon*.png`, `favicon-32.png`, `apple-touch-icon.png` and the share banner. Unchanged on purpose: Android package `com.thecampusloop.app`, Firebase project id, old domain allow-lists, and older concept files in `docs/brand/`. "Loopy Brain" (singular) is the name of the in-app knowledge-pack search feature; the brand is "Loopy Brains".

Static PWA for RGUKT AP students, built by a non-technical student founder (Vijay). Keep explanations in plain, step-by-step language and say which website or console each step happens in.

Features: class board (doubts, ideas, challenges), Loopy Brain (in-app knowledge-pack search and answer engine, works without sign-in), quizzes, tools, college data, Plus (paid) plan.

## Architecture
- **Frontend**: plain JS/CSS/HTML in `docs/` (no build step), served by GitHub Pages. Entry `docs/index.html`, logic `docs/app.js`, config `docs/config.js`. Loopy Brain lives in `docs/brain-*.js`.
- **Service worker** `docs/sw.js`: cache name `spark-vNNN`. Every module import in `docs/index.html` and `docs/sw.js` carries `?v=NNN`. **Bump all of them together (currently 468) whenever a cached file changes.**
- **Backend**: Firebase project `doubt-desk-e6f39` (Firestore, Auth anonymous sign-in, Storage). Rules in `firestore.rules`. Cloud Functions in `functions/index.js` (Razorpay, push, Anthropic key; CORS allow-list `ALLOWED_ORIGINS`).
- **App Check**: web uses reCAPTCHA Enterprise / Fraud Defense (`docs/config.js` `appCheck.siteKey`, `provider: "enterprise"`); native Android uses Play Integrity via `@capacitor-firebase/app-check`. `docs/app.js` (~line 569): native + plugin present → plugin; browser → reCAPTCHA; native without plugin → skip App Check entirely. Never fall back to reCAPTCHA when native.
- **Android app** `android-app/`: Capacitor 6 WebView wrapper loading the website URL in `capacitor.config.json`. Package `com.thecampusloop.app`. Built by `.github/workflows/build-android.yml` (debug APK). `patch_android.py` adds FLAG_SECURE and copies `google-services.json`; the workflow overwrites it from the `GOOGLE_SERVICES_JSON` secret.
- Other: `supabase/schema.sql` + `tools/export-firestore-to-sql.mjs` (migration prep), `tests/`, `scripts/check.sh`, docs `*.md` at root (SETUP, SECURITY, APPCHECK, RAZORPAY, OWNER_CHECKLIST).

## Key decisions
- Static site, no framework or bundler, to keep it free and easy to host.
- Domain moved from `thecampusloop.co.in` to **loopybrains.com** (`docs/CNAME`). Old domain and `vijay462462.github.io` stay in CORS and key allow-lists.
- GitHub repo was renamed `rgukt-spark` → **`loopybrains`**. The old Pages URL `vijay462462.github.io/rgukt-spark/` may no longer work.
- Firebase Android JSON must use `android_client_info` (not `android_info`) or Gradle fails with "No matching client found".
- Loopy Search desktop fix: IntersectionObserver uses the viewport (not the scroll container) plus a rAF fallback; flex-column layout only applies via `:has(.bsc-hero)`.
- Never delete Google Cloud API keys; edit their website restrictions instead.

## Git workflow
- Cloud sessions use `origin` = `vijay462462/loopybrains` and a branch like `claude/<name>`; always branch from the latest `main`. (On the owner's laptop an older setup used remote `rgukt` and branch `fix-loopy-laptop`; check `git remote -v` first, the remote named `origin` may be wrong there.)
- PRs #1 and #4 to #9 are merged into `main` (domain move, App Check fix, Android URL, package upgrades, premium look, app shell, Loopy Brains rename and logo, Home screen). New work needs a new PR.
- The user can only be guided through consoles by screenshot; they cannot paste secrets here. Never ask for or print secret keys.

## Current status (2026-10-10)
- Done: web sign-in fixed (App Check provider set to `enterprise` in `docs/config.js` because all three Firebase apps use "Fraud Defense"); site live on loopybrains.com with HTTPS; all three apps registered in Firebase App Check (monitoring mode); Android app code points at `https://loopybrains.com/`; functions packages upgraded (`firebase-admin` 14, `firebase-functions` 7, `nodemailer` 10, Node 22) with a lockfile; `npm audit` clean; SECURITY.md updated; brand renamed to **Loopy Brains** with a new logo and icons; Midnight palette (indigo, champagne gold, ivory) is the default; laptop layout is a left sidebar (1200px+), phones keep the compact bar and bottom nav; Home tiles block on the Doubts feed.
- Waiting on the owner: rebuild the Android app (GitHub Actions) and test sign-in on a phone; deploy the functions (`firebase deploy --only functions`, Node 22, `SITE_URL=https://loopybrains.com/`) and test one payment link and one AI question.
- Not yet checked with real data: Home tile numbers and the new post-card styling (testing so far was offline).
- Not done on purpose: chat-style screen and campus rank card from the mockups; the animated mark inside Loopy Brain search results still shows the old C-and-cap mark; older concept files in `docs/brand/` still show the old name.

## Next steps
1. Android: confirm the `GOOGLE_SERVICES_JSON` secret has `android_client_info` JSON, re-run **Build Android app**, uninstall the old app, install the new APK, test sign-in (uses Play Integrity).
2. Firebase console: confirm `loopybrains.com` and `www.loopybrains.com` are in Authentication > Settings > Authorized domains.
3. Deploy functions (see above) and test payments and the AI answer.
4. After 3 to 5 days, if Firebase > App Check > APIs shows Verified near 100% for Firestore and Authentication, switch them from Monitoring to Enforced.
5. Look at the phone Home screen and post cards with real data and polish them; then consider the rank card and chat-style screen.
6. Later: Firebase security hardening, add Mano Chapter 4 (Combinational Logic) to knowledge packs.
