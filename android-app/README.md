# Loopy Brains Android app

A thin Android wrapper (Capacitor) around the website. It loads
https://loopybrains.com/ so website updates reach the app immediately,
and it turns on Android's `FLAG_SECURE`, so **screenshots, screen recording and the
recent-apps preview are blocked inside the app**.

Firebase App Check is wired to **Play Integrity** so only genuine, unmodified Android
devices can access Firestore, Storage and Auth.

---

## Get the APK
1. GitHub > Actions > **Build Android app** > Run workflow (it also runs when this folder changes).
2. When it is green, open the run and download the **Loopy-Brains-apk** artifact (a zip containing `Loopy-Brains.apk`).
3. Send `Loopy-Brains.apk` to students. They must allow "Install unknown apps" for the app they open it from.

The APK is signed with Android's debug key, which is fine for sharing inside the class.
Publishing on the Play Store needs your own release key and a developer account.

Android only. The website itself (in Chrome) can still be screenshotted; only this app blocks it.

---

## One-time Firebase setup (do this once to enable Play Integrity App Check)

### Step 1 — Register the Android app in Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com) → **Project settings** (gear icon) → **Your apps**.
2. Click **Add app** → choose **Android**.
3. Enter package name: `com.thecampusloop.app`
4. Click **Register app**, then **Download google-services.json**.
5. Click through the remaining screens (no code changes needed — the project already handles everything).

### Step 2 — Enable Play Integrity in App Check
1. Firebase Console → **App Check** → **Apps** tab.
2. Find the Android app (`com.thecampusloop.app`) → click **Configure**.
3. Choose **Play Integrity** → click **Save**.
4. You do **not** need to enforce yet — leave it in monitoring mode until you see clean traffic.

### Step 3 — Add google-services.json as a GitHub secret
1. Open the downloaded `google-services.json` in a text editor. Copy the entire contents.
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Name: `GOOGLE_SERVICES_JSON` | Value: paste the file contents.
4. Save.

The next GitHub Actions build will automatically use the real `google-services.json` and
the APK will include Play Integrity App Check. The template file in the repo
(`android-app/google-services.json`) keeps the build compiling even without the secret.

---

## How App Check works in this app

| Context | Provider used |
|---------|---------------|
| Browser (website) | reCAPTCHA v3 (set in `docs/config.js`) |
| Android app (this APK) | Play Integrity via `@capacitor-firebase/app-check` native plugin |

The web app detects `window.Capacitor.isNativePlatform()` and, when true, delegates App
Check token requests to the native Play Integrity plugin instead of reCAPTCHA. This stops
the `auth/firebase-app-check-token-is-invalid` error that occurs when a WebView tries to
use a web reCAPTCHA token for an Android app registration.
