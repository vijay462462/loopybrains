# Doubt Desk website setup

Doubt Desk is a class board where students ask doubts, answer each other and share ideas.
It runs as a normal website, so students open it on any phone without signing up.

- Website files: `docs/` (hosted free by GitHub Pages)
- Shared data: Firebase Firestore (free plan)
- Security rules: `firestore.rules`

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Create a project**, name it `doubt-desk`, and turn Google Analytics off. Click **Create project**.

## 2. Create the database
1. Open **Build > Firestore Database** and click **Create database**.
2. Pick a location near your students (for India, `asia-south1` Mumbai) and start in **production mode**.
3. Open the **Rules** tab, replace everything with the contents of `firestore.rules`, and click **Publish**.

## 3. Connect the website to Firebase
1. Click the gear icon > **Project settings**. Under **Your apps**, click the web icon `</>`.
2. Name the app `doubt-desk` (leave Firebase Hosting unticked) and click **Register app**.
3. Copy the values from the `firebaseConfig` block it shows.
4. On GitHub, open `docs/config.js`, click the pencil icon, and paste each value into the matching line:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
   These values are safe to publish; the security rules protect the data.
5. Click **Commit changes**.

## 4. Publish with GitHub Pages
1. In the repository, open **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Pick the branch that has the `docs/` folder and the folder **/docs**, then click **Save**.
4. After about a minute the site is live at `https://vijay462462.github.io/vijay/`.
   GitHub Pages on a free account needs the repository to be public.

## 5. Share with students
Send the link in your class group. Each student types their name once and can then
post doubts, answer, mark the answer that helped, share ideas, like and reply.

## Changing subjects
Edit the `subjects` list in `docs/config.js` on GitHub and commit. The site updates in about a minute.

## Removing a post
Students can edit and delete their own posts from the same phone they posted on. There is no login, so the site trusts each phone's device id; share the link only with your class. To remove anyone's post, open
**Firestore Database > Data** in the Firebase console, find it and delete it.
