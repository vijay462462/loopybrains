# Switching on push alerts (about 20 minutes, done by the owner)

Alerts tell a student the moment their doubt gets an answer, even when the app is closed. The app code, the sending function (`notifyOnReply` in `functions/index.js`) and the rule for `pushTokens` are already written. Nothing is deployed yet.

1. **Blaze plan.** Firebase console, Upgrade, Blaze (pay as you go). A pilot is normally within the free allowance, but set a budget alert.
2. **Web Push key.** Firebase console, Project settings, Cloud Messaging, Web configuration, Generate key pair. Copy the *public* key.
3. **Paste the key** into `docs/config.js` as `push: { vapidKey: "<the key>" }`. It is a public key and safe to publish.
4. **Publish `firestore.rules`** (it contains the `pushTokens` rule).
5. **Deploy the functions:** `firebase deploy --only functions:notifyOnReply` (add the other functions when you are ready).
6. **Test with one phone:** open the app, ask a doubt, tap *Turn on alerts*, then answer it from another account. You should get "New answer" within seconds.
7. Run `python3 scripts/check_push_setup.py` at any time. It lists what is still missing.

What is sent: a short title only ("New answer", "Someone answered your doubt: <first 60 characters>"). At most 3 alerts per student per hour. Tokens are stored under the student's own id and cannot be read from the app.
