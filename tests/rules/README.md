# Security rules tests

These tests run `firestore.rules` against the local Firestore emulator (needs Java 11+ and Node 18+).
They check that students can do what the app needs (post, reply, add stories, answer quizzes, back up, battle scores)
and that cheats are refused (writing someone else's data, giving yourself Plus, inflating a college score, posting while blocked).

```
cd tests/rules
npm install
echo '{ "firestore": { "rules": "../../firestore.rules" }, "emulators": { "firestore": { "port": 8081 }, "ui": { "enabled": false } } }' > firebase.json
npm test
```

Run it after every change to `firestore.rules`, before you publish the rules in the Firebase console.
