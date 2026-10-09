# The Campus Loop (loopybrains.com)

Static PWA for RGUKT AP students, built by a non-technical student founder (Vijay). Keep explanations in plain, step-by-step language and say which website or console each step happens in.

Features: class board (doubts, ideas, challenges), Loopy Brain (in-app knowledge-pack search and answer engine, works without sign-in), quizzes, tools, college data, Plus (paid) plan.

## Architecture
- **Frontend**: plain JS/CSS/HTML in `docs/` (no build step), served by GitHub Pages. Entry `docs/index.html`, logic `docs/app.js`, config `docs/config.js`. Loopy Brain lives in `docs/brain-*.js`.
- **Service worker** `docs/sw.js`: cache name `spark-vNNN`. Every module import in `docs/index.html` and `docs/sw.js` carries `?v=NNN`. **Bump all of them together (currently 460) whenever a cached file changes.**
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
- Develop on branch `claude/kind-curie-dzx5ih`; local branch is `fix-loopy-laptop`. Local remote `origin` is wrong (`vijay462462/vijay`); the correct remote is **`rgukt`** (push with `git push -u rgukt fix-loopy-laptop:claude/kind-curie-dzx5ih`).
- PR #1 (domain move, App Check, Android package) is merged into `main`. New work needs a new PR.
- The user can only be guided through consoles by screenshot; they cannot paste secrets here. Never ask for or print secret keys.

## Current status (2026-10-09)
- Done: reCAPTCHA site key set, Loopy Search desktop fix, Android App Check code, package rename, `GOOGLE_SERVICES_JSON` secret added, DNS + GitHub Pages custom domain + HTTPS working, site loads on loopybrains.com, API key referrers and reCAPTCHA domains include loopybrains.com.
- **Blocking bug**: on loopybrains.com sign-in fails with `auth/firebase-app-check-token-is-invalid`. DevTools shows `exchangeRecaptchaV3Token` returning **400**. Firebase App Check → Apps has: "The Campus Loop" web app (registered, provider shown as "Fraud Defense"), "loopybrains" web app (not registered), "loopybrains" Android app (not registered).
- Last Android build failed (wrong JSON key name). Fixed in repo, but the `GOOGLE_SERVICES_JSON` secret must contain the corrected JSON and the workflow must be re-run.

## Next steps
1. Fix the web 400: confirm which web app ID `docs/config.js` uses (`...:web:02a51823f13de09ebdc0ac`); register that app with reCAPTCHA v3 and the secret key, or, if "Fraud Defense" means Enterprise, set `appCheck.provider: "enterprise"` in `docs/config.js` (and bump cache version). Read the Network → Response body of the 400 for the exact reason.
2. Register the Android app in App Check with Play Integrity (SHA-256 optional for now). Keep everything in monitoring mode.
3. Update the `GOOGLE_SERVICES_JSON` secret with `android_client_info` JSON, re-run **Build Android app**, install the APK.
4. Add `loopybrains.com` / `www.loopybrains.com` to Firebase Auth authorized domains if missing.
5. Point `android-app/capacitor.config.json` (`server.url`, `allowNavigation`) at `https://loopybrains.com/`.
6. Run `firebase deploy --only functions` with `SITE_URL=https://loopybrains.com/`.
7. After 3–5 days of clean App Check traffic, enforce App Check.
8. Later: Firebase security hardening, add Mano Chapter 4 (Combinational Logic) to knowledge packs.
