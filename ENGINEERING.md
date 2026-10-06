# Engineering plan (staged, nothing is rewritten at once)

Rule: every stage must leave the app working and all checks green before the next one starts.

| # | Stage | Status |
|---|-------|--------|
| 1 | Module split of `docs/app.js` (about 10,800 lines) | Planned. Loopy Brain data is already in modules (`brain-*.js`). Next slices: Loopy Search screen, doubts board, admin helpers. Each slice moves code into its own file and imports a small shared core (`el`, `state`, storage). Done one slice per release. |
| 2 | Types and a build tool | Type check added as an optional script (`scripts/typecheck.sh`, no build step). Vite is only worth adding once the split is done, because GitHub Pages serves `docs/` directly. |
| 3 | Automated tests | Done: `tests/packs.test.mjs` (every pack, diagram and key), `tests/e2e/smoke.mjs` (real browser, main search paths), Firestore rules tests. Run by `scripts/check.sh` (packs) and by hand (smoke). |
| 4 | Monitoring | The app keeps its last errors on the phone and "Report a problem" mails them. Real monitoring (Sentry or Firebase Crashlytics) needs your account and a Content-Security-Policy change; do it after the pilot starts. |
| 5 | Payments and push on Cloud Functions | Code exists in `functions/`. Not deployed. Needs the Blaze plan, a budget alert, Razorpay TEST keys and a test run (see RAZORPAY.md). |
| 6 | Framework (React or SvelteKit) and a full backend | Only if many colleges join and several developers work together. Not needed for the pilot. |
