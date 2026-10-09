# Loopy Brains (loopybrains.com)

Static PWA for RGUKT AP students (other colleges can be added), built by a non-technical student founder (Vijay). **Keep explanations in plain, step-by-step language and say which website or console each step happens in.** The user can only be guided through consoles by screenshot and cannot paste secrets here. Never ask for or print secret keys.

**Brand:** renamed from "The Campus Loop" to **Loopy Brains** (user-facing text only). Logo: a gold neural infinity loop (four nodes) with a spark, on midnight indigo; sources in `docs/brand/loopy-brains-*.svg`, exported to `docs/icon*.png`, `favicon-32.png`, `apple-touch-icon.png`, the share banner and `android-app/assets/`. **"Loopy Brain" (singular) is the in-app knowledge-pack search feature**; the brand is "Loopy Brains" (plural, matches the domain). Wordmark is LOOPY over BRAINS.

Features: class board (doubts, ideas, clubs, challenges, jobs, market, GATE), Loopy Brain (knowledge-pack search and answer engine, works without sign-in), Loop Bot, daily quiz and streaks, Study Lab and tools, college data, Plus (paid) plan, push alerts.

## Architecture
- **Frontend**: plain JS/CSS/HTML in `docs/` (no build step, no framework), served by GitHub Pages at loopybrains.com (`docs/CNAME`). Entry `docs/index.html`, logic `docs/app.js` (~1 MB, one big file), styles `docs/style.css` (~350 KB, **many stacked override layers; the last rule wins**), config `docs/config.js`. Loopy Brain lives in `docs/brain-*.js`; first-run splash in `docs/splash.js`.
- **Service worker** `docs/sw.js`: cache name `spark-vNNN`. Every module import in `docs/index.html`, `docs/sw.js`, `docs/admin.html` and `docs/colleges.html` carries `?v=NNN`. **Bump all of them together (currently 473) whenever a cached file changes**; `scripts/check.sh` fails if they disagree. Also bump the number in this file.
- **Backend**: Firebase project `doubt-desk-e6f39` (Firestore, Auth anonymous sign-in, Storage). Rules in `firestore.rules` (deny by default, every collection listed; `firestore.rules.open` is an emergency rollback only). Cloud Functions in `functions/index.js` (Razorpay payments and webhook, Anthropic key for AI answers, push, SMTP email; CORS allow-list `ALLOWED_ORIGINS`). Functions run on **Node 22** (`firebase-admin` 14 modular imports, `firebase-functions` 7, `nodemailer` 10, lockfile committed).
- **App Check**: web uses **reCAPTCHA Enterprise / "Fraud Defense"** (`docs/config.js` `appCheck: { siteKey, provider: "enterprise" }`; all three Firebase apps show "Fraud Defense", so `"v3"` gives a 400). Native Android uses Play Integrity via `@capacitor-firebase/app-check`. `docs/app.js` (~line 569): native + plugin present → plugin; browser → reCAPTCHA; native without plugin → skip App Check entirely. **Never fall back to reCAPTCHA when native.** Everything is in *monitoring* mode, not enforced.
- **Android app** `android-app/`: Capacitor 6 WebView wrapper that loads `https://loopybrains.com/` (`capacitor.config.json`, `allowNavigation` for loopybrains.com and www). Package `com.thecampusloop.app` (cannot change after install). Built by `.github/workflows/build-android.yml` (debug APK, artifact `Loopy-Brains-apk`, runs on manual dispatch and on pushes to `main` touching `android-app/**`). `patch_android.py` adds FLAG_SECURE; the workflow writes `google-services.json` from the `GOOGLE_SERVICES_JSON` secret. Launcher icons come from `android-app/assets/` (`@capacitor/assets`).
- **Other**: `supabase/schema.sql` + `tools/export-firestore-to-sql.mjs` (migration prep), `tests/` (packs test, rules tests, e2e, tools test), `scripts/check.sh` (syntax of all scripts, versions agree, data audit, packs check), `scripts/*icons*` (icon builders), root docs `SETUP.md`, `SECURITY.md`, `APPCHECK.md`, `RAZORPAY.md`, `OWNER_CHECKLIST.md`, `BRAND.md`, etc.

### UI system (what to know before touching CSS or layout)
- **Palettes**: `:root[data-palette="…"]` variable sets (Midnight is the default, then Royal, Emerald, Burgundy, Obsidian, and others), each with light, dark and black versions; chosen with the header colour button (`PALETTES` in `docs/app.js`, saved as `dd-palette`). **Midnight** = deep indigo, champagne gold (`--gold`, `--gold-2`), warm ivory. Use the variables (`--paper`, `--sheet`, `--ink`, `--muted`, `--line`, `--accent`, `--accent-soft`, `--btn`, `--shadow`) instead of hard-coded colours. Palette selectors beat plain `:root` rules, so add new colours inside the palette block.
- **Layouts** (all CSS, same DOM): phones ≤700px = compact header card, segmented tabs, floating bottom nav; 701 to 1199px = grid header (brand left, chips right, tabs, controls row, 4-column tool tiles); **≥1200px = fixed left sidebar** (`header.top` becomes a grid with `.brand` and `.hdr-actions` set to `display: contents` and items placed by `order`; named grid areas from the 901px block are reset with `!important`).
- **Icons**: thin line SVGs, not emoji, in the header. `icon(name, size)` helper and `ICONS` map near `el()` in `docs/app.js` (static trusted markup parsed with `DOMParser`); older `svgIcon()`/`ICON_PATHS` serve the bottom nav.
- **Home block** (`renderHome()` in `docs/app.js`, `#homeBento` in `index.html`): greeting, gold "Ask a doubt" button and four tiles on top of the Doubts feed.
- **First run**: welcome splash (`#splash.sp2`, rows from `index.html`) then `showWelcome()` steps (about, college, name, interests, ready). About unlocks when scrolled to the end and the age/terms box is ticked (pre-ticked if `dd-terms` exists). `go()` ignores taps within 0.9 s of a step appearing.
- **CSP** (meta tag in each page): no inline scripts and **no inline `style=` attributes** in markup; set styles via classes or `applyStyle`. Allowed hosts are listed in `index.html`.

## Key decisions
- Static site, no framework or bundler, to keep it free and easy to host.
- Domain moved from `thecampusloop.co.in` to **loopybrains.com**. Old domain and `vijay462462.github.io` stay in CORS and API-key allow-lists. Repo was renamed `rgukt-spark` → **`loopybrains`** (old Pages URL may not work).
- App Check provider is `enterprise` because the Firebase apps are registered with Fraud Defense. Enforce only after 3 to 5 days of clean traffic (see next steps).
- Firebase Android JSON must use `android_client_info` (not `android_info`) or Gradle fails with "No matching client found".
- Loopy Search desktop fix: IntersectionObserver uses the viewport (not the scroll container) plus a rAF fallback; flex-column layout only applies via `:has(.bsc-hero)`.
- **Never delete Google Cloud API keys; edit their website restrictions instead** (must include loopybrains.com, www, and the old domains).
- Rename scope: user-facing text only. Left unchanged on purpose: Android package id, Firebase project id, old-domain allow-lists, calendar PRODID/UIDs, and old concept files in `docs/brand/`.
- Security posture is documented in `SECURITY.md` (rules deny by default, payments verified server-side, rate limits, CORS limited, no secrets in the repo, `npm audit` clean). Secrets live only in `firebase functions:secrets:set` and the GitHub secret `GOOGLE_SERVICES_JSON`.

## Working method (how work has been done here)
- Develop on a branch named like `claude/<name>` from the latest `origin/main`; open a PR; the owner says "merge #N" and the PR is **squash-merged**. Branches whose PR was merged are reset to `origin/main` and force-pushed with `--force-with-lease`. Do not open PRs or merge unless asked.
- Before committing run `bash scripts/check.sh` and, for `docs/app.js`, `node --input-type=module --check < docs/app.js`; for functions `node --check functions/index.js`.
- Visual checks: serve `docs/` with `python3 -m http.server 8765` and drive headless Chromium (`/opt/pw-browsers/chromium`, Playwright from `/opt/node22/lib/node_modules/playwright`), blocking non-localhost requests. Pre-set `localStorage`: `dd-college=rgukt`, `dd-welcome-done=1`, `dd-name`, `dd-simple=false`, `dd-tools-open=1`; pick the year in the `#rgElig` dialog. **Firebase is blocked offline, so posts, counts and sign-in cannot be tested this way.**
- Do not run `pkill -f <name>` with a pattern that appears in your own command line (it kills the shell).

## Current status (2026-10-10)
- **Done**: web sign-in fixed and confirmed working by the owner; site live with HTTPS; all three Firebase apps registered in App Check (monitoring); Android app points at loopybrains.com; functions packages upgraded and audited (0 vulnerabilities); brand renamed to Loopy Brains with new logo, icons and share banner; Midnight palette default; laptop sidebar layout; Home tiles; premium cards, segmented tabs and floating bottom nav on phones; welcome splash and About step redesigned for phones (PR #11); Android launcher icon and APK name updated (PR #12).
- **In progress / unverified**: two Android builds (runs #11 from the branch and #12 on `main`) were still running when this was written; check GitHub > Actions > Build Android app and download artifact `Loopy-Brains-apk`. Android sign-in (Play Integrity) has not been tested yet.
- **Waiting on the owner**: deploy the functions (`firebase deploy --only functions` on a computer with Node 22 and `SITE_URL=https://loopybrains.com/`) and test one payment link and one AI answer; confirm `loopybrains.com` and `www.loopybrains.com` are in Firebase Authentication > Settings > Authorized domains; send a phone screenshot of the Home screen and post list with real data.
- **Reported, not reproduced**: the owner said tapping the first splash button jumped past the About page. Added the 0.9 s tap guard (PR #11); needs a real-phone retest.
- **Not checked with real data**: Home tile numbers and the new post-card styling.
- **Not done on purpose**: chat-style screen and campus rank card from the owner's mockups; the animated mark inside Loopy Brain search results (`bsRing` in `docs/app.js`) still shows the old C-and-cap mark; old concept files in `docs/brand/` show the old name.

## Next steps
1. Android: confirm the build is green, uninstall the old app, install `Loopy-Brains.apk`, test sign-in and that the new icon and name show. If the build fails, check the `GOOGLE_SERVICES_JSON` secret (must use `android_client_info`).
2. Deploy functions and test payments and the AI answer; this also publishes the Loopy Brains wording in emails and payment text.
3. After 3 to 5 days, if Firebase > App Check > APIs shows Verified near 100% for Firestore and Authentication, switch them from Monitoring to Enforced.
4. Review the phone Home screen, post cards and first-run pages with real data and polish; then consider the rank card and chat-style screen from the mockups.
5. Update the Loopy Brain search animation mark and the old brand concept files to the new logo.
6. Later: Firebase security hardening, add Mano Chapter 4 (Combinational Logic) to the knowledge packs.
