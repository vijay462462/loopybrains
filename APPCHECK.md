# API key restriction and App Check (about 20 minutes, done by the owner)

## 1. Restrict the Firebase API key (do this first)
The key in `docs/config.js` is public by design, but without limits anyone can use it from their own site.
1. Open https://console.cloud.google.com/apis/credentials and pick the project `doubt-desk-e6f39`.
2. Open the key named **Browser key** (or the one that matches `apiKey` in `docs/config.js`).
3. **Application restrictions**: choose **Websites** and add `https://vijay462462.github.io/*`. Add your own domain later if you get one.
4. **API restrictions**: choose **Restrict key** and tick only: Identity Toolkit API, Token Service API, Cloud Firestore API, Firebase Installations API, Firebase App Check API, Cloud Storage for Firebase API (and Firebase Cloud Messaging API if you use push).
5. Save. Wait 5 minutes, then open the app and check that sign-in and posting still work. If something fails, add the API named in the browser console error.

## 2. Turn on App Check
1. Open https://www.google.com/recaptcha/admin and create a **reCAPTCHA v3** site: label "Campus Loop", domains `vijay462462.github.io`. Copy the **site key** (public) and the **secret key** (keep private).
2. Firebase console, **App Check**, your web app, **Register**, choose reCAPTCHA v3, paste the **secret key**.
3. Paste the **site key** in `docs/config.js`: `appCheck: { siteKey: "<site key>" }`. Publish the site.
4. Use the app for a day. In **App Check, APIs**, look at Firestore: when most requests show as verified, press **Enforce** for Cloud Firestore and Authentication (enforce functions only if you deploy them).
5. If students report errors after enforcing, press **Unenforce**, fix, and try again.

The reCAPTCHA domain list must include `vijay462462.github.io`. App Check does not replace the Firestore rules. It adds a second lock.
