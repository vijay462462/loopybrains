# Student moderators (pilot guide)

A small team of trusted students keeps each college board clean. Moderators can hide or restore posts and block abusive devices **for their own college only**. They cannot touch other colleges, prices, promo codes or sales.

## Set up a moderator (about 2 minutes, done by the owner)
1. The student opens the app, taps **Me**, and copies their user id from the admin page (`/admin.html`, signed in with a verified email).
2. In the admin page open **Staff**, paste the id, pick the college, add a role such as "Student moderator", and save. Under the hood this creates `staff/<room>_<uid>` (the rules in `firestore.rules` allow only that).
3. Ask them to sign in at `/admin.html` with their verified college email. They see only their college's reports.

## Daily routine (10 minutes)
- Open **Reports**. Anything with 3 or more reports is already hidden. Read it and either **keep it hidden** or **restore** it.
- Block a device only after a second serious offence. Every action is written to the admin log and cannot be edited.
- Reply to a reporter only if it is useful. Never share a student's identity.

## What to hide
Abuse, hate, adult content, threats, scams, other people's private details, copyrighted papers and spam. When unsure, hide it and ask the owner.

## Choosing moderators
Pick 3 to 5 per college: one senior, one active helper from the Top Helpers board, and one from a different branch or campus. Check the board weekly. Remove anyone inactive (**Staff, Remove**).
