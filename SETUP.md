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

## Blocking a device that breaks the rules

1. Open a bad post in the Firebase console (Firestore Database > Data > rooms > your room > doubts, replies, etc.) and copy its `authorId` field. Anonymous posts also keep `authorId`.
2. In the same room, create a collection called `blocked` (once). Add a document whose **Document ID is that authorId**. The fields can be empty, or put a note such as `reason: "abuse"`.
3. From then on the security rules refuse every new post, reply, story, listing and profile update from that device, and the app tells the student the device is blocked.
4. To unblock, delete that document.

A blocked person can get a new device id by clearing the browser data, so treat this as a deterrent. The app also pauses posting for 24 hours (72 hours from 4 hidden posts) when two or more of a device's posts have been hidden by classmates' reports.

## Adding a college (multi-college setup)

RGUKT is the built-in college. Every other college is one document in Firestore, and gets its own private board.

1. Firebase console > Firestore Database > Data > **Start collection** `colleges` (once).
2. **Document ID** = the college's short link name: lowercase letters, digits and dashes, 2 to 40 characters, e.g. `abc-university`.
3. Add these fields (type in brackets). Only `name` and `room` are required.

| Field | Type | Example / notes |
| --- | --- | --- |
| `name` | string | `ABC University` |
| `room` | string | a private random id, 8 to 40 letters/digits/`-`/`_`, e.g. `k7Qm2xPa9Rtz`. Every post of this college is stored under it, so keep it secret and never reuse it for another college. |
| `title` | string | `ABC Spark` (shown in the header; defaults to name + " Spark") |
| `tagline` | string | `Learn together` |
| `captions` | array of string | rotating lines under the title |
| `campuses` | array of string | `["MAIN", "CITY"]` (leave empty for a single campus) |
| `subjects` | array of string | `["Algebra", "Physics 1"]` |
| `departments` | map | `{ "CSE": ["DSA", "OS"], "MATH": ["Algebra"] }` (optional; shows department tabs) |
| `clubs` | array of string | `["Coding", "Music"]` |
| `ideaCategories` | array of string | `["Project", "Startup"]` |
| `exams` | array of map | `[{ name: "Mid-1", date: "2026-11-20" }]` |
| `accent` | string | brand colour like `#e11d48` |
| `features` | map | booleans: `bot`, `alumni` (both default **off** for other colleges because their text is about RGUKT), `fun`, `jobs`, `market`, `challenges` (default on) |
| `listed` | boolean | `false` hides it from the public college list (students can still use the link) |
| `enabled` | boolean | `false` switches the college off |

4. Share the link `https://<your site>/?c=abc-university`. Students can also pick the college from the **🏫 College** button under the title.
5. Requests from the "My college is not listed" form arrive in the `collegeRequests` collection (readable only in the console).

Known limits of this first version: the Spark Bot, Alumni, About and Career Guide pages still contain RGUKT-specific text (Bot and Alumni are off by default for other colleges); the Daily Quiz is the same for every college; sign-in is still anonymous. Publish the updated `firestore.rules` before using this.

### Colleges that need no database setup

`docs/colleges-ap.js` lists 46 Andhra Pradesh universities and institutes. Each one already works at `?c=<slug>` (for example `?c=andhra-university`) with its own private board under the room `college-<slug>`, plus common subjects and clubs, and shows up in the college picker with search. To add another college, add a line to that file. To give one its own subjects, campuses, colours or features, create a Firestore `colleges/<same slug>` document: its content replaces the defaults, but the room always stays `college-<slug>` so posts never move.

### College email verification (optional, per college)

Students can tap **Profile > Verify your college email**. A sign-in link is emailed to them; opening it on the same phone proves they own that address and shows a ✔ next to their name.

One-time setup in the Firebase console:
1. Authentication > Sign-in method > **Email/Password** > switch on, then also switch on **Email link (passwordless sign-in)** and Save.
2. Authentication > Settings > **Authorized domains** > add your website domain (for example `vijay462462.github.io`, or your own domain later).
3. Publish the updated `firestore.rules`.

Per-college fields in `colleges/<slug>` (all optional):

| Field | Type | Meaning |
| --- | --- | --- |
| `domains` | array of string | allowed email domains, e.g. `["abc.edu.in"]`. Empty means any email address counts as verified. |
| `requireVerified` | boolean | `true` = only verified students (with a matching domain, if listed) can post, reply, add stories or listings. Everyone can still read. |

`requireVerified` is enforced by the security rules for colleges from the directory (rooms named `college-<slug>`); for other colleges it is only checked in the app. The RGUKT board accepts the four RGUKT email domains for the ✔ but does not require verification.

Limits: Firebase limits how many sign-in emails it sends per day on the free plan; the link opens in the phone's browser (not inside the Android app); a student who changes phone must verify again.

`docs/colleges-ap2.js` adds 60 (and `docs/colleges-ap3.js` another 75) engineering, medical and degree colleges of Andhra Pradesh to the picker. They were listed from public knowledge: please check the names and add the ones that are missing.

### Colleges across India

`docs/colleges-india.js` lists about 750 institutions in the 35 other states and union territories (central, state and national institutes, private universities, and well-known engineering, medical and degree colleges). The college picker has a **Your state** drop-down (it remembers the last state) and an **All India** search. Every entry already works at `?c=<slug>` with its own board. The list was compiled from public knowledge: please check names, fix mistakes and add missing colleges, one line each (`{ slug, name, city, state, kind }`).

## CampusLoop Plus and payments

See `PREMIUM.md` for the plan, the pricing ideas and the step-by-step go-live list. In the app, **Profile > CampusLoop Plus** shows what exists today and collects "which features would you pay for" answers (Firestore `plusInterest`). Payments are off (`plus.enabled: false` in `docs/config.js`) until the Razorpay functions in `functions/` are deployed and tested.

## Streaks, share cards and the College vs College battle

- **Streak:** a day counts when the student does something (quiz, quiz story, answer, post, story). The header shows 🔥 N, Profile shows the last 7 days and the next reward. Milestones at 3, 7, 14, 30, 60 and 100 days unlock avatar frames (bronze, silver, gold, diamond, rainbow, legend). The streak is stored on the profile only for the frame; it is cosmetic.
- **Share cards:** "📸 Share my result" (Daily Quiz) and "📸 Share my streak" / "Share our rank" draw a picture on the phone and open the share sheet (or save the picture).
- **College vs College:** every right answer to the daily quiz or a quiz story adds to the college's weekly score (Firestore `battleColleges` and `battlePlayers`, week id like `w2961`, restarting each Monday). Score = right answers per player; a college needs 3 players to be ranked. The security rules make both counters move together, and cap a student at 70 right answers a week, but one person with many anonymous sessions could still inflate a college: for stricter fairness count only verified-email students.
- The rules are tested with the Firestore emulator: see `tests/rules/README.md`.

## Admin dashboard (moderation, colleges, requests)

1. Publish the new `firestore.rules` (adds admin + ownership rules).
2. Open `https://<your-site>/admin.html` and sign in with your email (a link is sent; open it on the same device).
3. The page shows "not an admin yet" and your user id. In Firebase console › Firestore › Data, create collection `admins` with a document whose ID is that user id (any one field, e.g. `note: owner`). Reload.
4. Tabs: Overview, Moderation (hide/restore, clear reports, block device), Blocked devices, Colleges (create/edit), Requests and survey, Log. Every action is written to `adminLog`.

New posts now store `ownerUid`, so only their author (or an admin) can edit them. Older posts without it stay editable by anyone until replaced.

## College staff accounts

A college's own staff (exam cell, placement cell, principal's office) can run their college's board without being platform admins.
1. The staff member opens `/admin.html` and signs in with their email link. The page shows "not an admin yet" and their user id; they send you that id.
2. In `/admin.html` open **College staff**, paste the id, pick their college, add a role label, and tap **Add staff**.
3. They reload `/admin.html`. They now see only **Notices, Moderation, Blocked devices and Papers**, and only for their own college. They cannot touch other colleges, colleges' settings, promo codes, sales or the staff list. Remove them from the same tab any time.
Staff need a verified email (the email link does that). Their actions are not written to the audit log yet.

## Placement cell (campus drives)

Platform admins and college staff (see "College staff accounts") open `/admin.html` › **Placement drives**: company, role, package, eligible branches, minimum CGPA, last date, optional link and details. Students see **🏢 Campus Drives** (under More tools, and a chip on the Today card) and tap **I am interested**; they enter name, branch, CGPA and an optional phone, with a note that only the placement cell sees it. The cell opens **Interested students** on a drive and can download a CSV. Students can withdraw any time. Publish the latest `firestore.rules` first. Add a line about this to your Privacy Policy before using it with real students.

## Club and campus events

Admins and staff (a club coordinator can be added as a staff member with their club as the role label) open `/admin.html` › **Events**: title, club, venue, start/end time, optional capacity and link. Students see **🎉 Events** (and a Today-card chip for events within 7 days), tap **I am going**, and can **Add to calendar** (.ics file). The organiser sees the names of those going. A full event shows "Full". Publish the latest `firestore.rules` first.

## College crest (logo)

In `/admin.html` › **Colleges** › Edit › **College crest**: choose the college's logo (PNG, JPG or WebP; square works best). The dashboard shrinks it to a small image and saves it with the college. Students then see it in the college button, on the home hero and on the opening screen. Without an upload, students see a clean monogram of the college's initials in its own colours. Publish the latest `firestore.rules` first.
