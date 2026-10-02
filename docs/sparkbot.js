// Spark Bot v5 — Premium AI Interactive Assistant
(function () {
'use strict';

// ════════════════════════════════════════════════════════════
//  KNOWLEDGE BASE  — 80+ intents, rich markdown, all topics
// ════════════════════════════════════════════════════════════
const KB = [

  // ── Greetings ────────────────────────────────────────────
  { p: /^(hi|hello|hey|hlo|hii|helo|namaste|sup|yo|howdy|hola|vanakkam|bonjour)\b/i,
    r: [
      "🌟 **Heyyy!** Welcome to **Spark Bot** — your premium AI guide!\nI can answer *anything* about RGUKT Spark, academics, GATE, career, and campus life. 🚀",
      "👋 **Hey there, Sparkie!**\nAsk me about doubts, GATE papers, hostel life, coding tips, career guidance — I know it all! ✨🔥",
      "🎉 **Namaste!** I'm **Spark Bot v5** — smarter, faster, and more powerful than ever!\nWhat topic shall we explore today? 🧠💡",
    ]},


  // ── After graduation ─────────────────────────────────────
  { p: /after (b\.?tech|graduation|engineering|degree|college)|what next|further (step|stud)|career (option|path|guide)|next step|future plan|higher stud|after (e4|4th year|final year)/i,
    r: [
      "🚀 **After B.Tech — What Next?**\n\nTap the **🚀 Career Guide** button at the top of the app, pick your branch (CSE · ECE · EEE · Civil · Mech) and see every path with free links.\n\n**Main paths for every branch:**\n① 💼 **Private jobs** — apply on company pages → [National Career Service](https://www.ncs.gov.in)\n② 🎓 **M.Tech via GATE** → [GATE official](https://gate2025.iisc.ac.in/) · [COAP](https://coap.iitb.ac.in) · [CCMT](https://ccmt.admissions.nic.in)\n③ 🏛️ **Govt / PSU jobs** → [UPSC ESE](https://upsc.gov.in) · [SSC](https://ssc.gov.in) · PSUs via GATE\n④ 🌍 **MS / PhD abroad** → [EducationUSA](https://www.educationusa.in) · [DAAD Germany](https://www.daad.in)\n⑤ 📈 **MBA** → [CAT](https://iimcat.ac.in)\n⑥ 💡 **Startup** → [Startup India](https://www.startupindia.gov.in)\n\n*Tell me your branch and I'll suggest the best path!* 🎯",
    ]},

  // ── Company links ────────────────────────────────────────
  { p: /\b(tcs|infosys|wipro|hcl|capgemini|cognizant|tech ?mahindra|accenture|amazon|flipkart|google|microsoft|zoho|deloitte|ibm|oracle|bhel|isro|ntpc|l ?& ?t|siemens|abb|jio|airtel|companies|company links?|company career|top companies|which companies)\b/i,
    r: [
      "🏢 **Company Career Pages — Apply Direct (Free)!**\n\n**IT & Software:**\n• [TCS NextStep](https://nextstep.tcs.com) · [Infosys](https://www.infosys.com/careers/) · [Wipro](https://careers.wipro.com) · [HCLTech](https://www.hcltech.com/careers)\n• [Capgemini](https://www.capgemini.com/careers/) · [Cognizant](https://careers.cognizant.com) · [Tech Mahindra](https://careers.techmahindra.com)\n• [Accenture](https://www.accenture.com/in-en/careers) · [IBM](https://www.ibm.com/careers) · [Oracle](https://careers.oracle.com) · [Deloitte](https://www2.deloitte.com/in/en/careers.html)\n• [Zoho](https://www.zoho.com/careers/) · [Microsoft](https://careers.microsoft.com) · [Google](https://www.google.com/about/careers/applications/) · [Amazon](https://www.amazon.jobs) · [Flipkart](https://www.flipkartcareers.com)\n\n**Core / PSU (ECE · EEE · Mech · Civil):**\n• [BHEL](https://www.bhel.com/careers) · [ISRO](https://www.isro.gov.in/Careers.html) · [NTPC](https://www.ntpc.co.in/careers)\n• [L&T](https://www.larsentoubro.com/corporate/careers/) · [Siemens](https://jobs.siemens.com) · [ABB](https://careers.abb)\n• [Jio](https://careers.jio.com) · [Airtel](https://www.airtel.in/careers)\n\n🆓 **Free job portals:** [National Career Service](https://www.ncs.gov.in) · [AICTE Internship Portal](https://internship.aicte-india.org/)\n\n💡 *Always apply on the official career page — never pay anyone for a job!* 🛡️",
    ]},

  // ── Course links ─────────────────────────────────────────
  { p: /\bcourses?\b|certificat(e|ion)|where (can|to|do) (i )?learn|learn (python|java|c\b|c\+\+|dsa|web|ml|ai|sql|git)|online learning|tutorial/i,
    r: [
      "🎓 **Free Courses — 100% Free, No Subscription!**\n\n**Core CS:**\n• [CS50 (Harvard)](https://cs50.harvard.edu/x/) — best intro to CS\n• [CSES Problem Set](https://cses.fi/problemset/) · [GeeksforGeeks](https://www.geeksforgeeks.org) — DSA practice\n• [freeCodeCamp](https://www.freecodecamp.org) — web dev, Python, data, certificates\n• [The Odin Project](https://www.theodinproject.com) — full-stack web\n\n**AI / ML:**\n• [Andrew Ng ML (YouTube)](https://www.youtube.com/@Deeplearningai) · [Kaggle Learn](https://www.kaggle.com/learn) — free micro-courses + certificates\n• [fast.ai](https://www.fast.ai) — practical deep learning\n\n**Engineering (all branches):**\n• [NPTEL](https://nptel.ac.in) — IIT courses + exam certificates\n• [SWAYAM](https://swayam.gov.in) — UGC-credited Indian courses\n• [MIT OpenCourseWare](https://ocw.mit.edu) · [Khan Academy](https://www.khanacademy.org)\n\n**GATE:**\n• [GATE Wallah (YouTube)](https://www.youtube.com/@GATEWallah) · [GATE Overflow](https://gateoverflow.in/)\n\n🏅 *Finish a course + build a project = resume gold!* 🚀",
    ]},

  // ── What is the app ──────────────────────────────────────
  { p: /what (is|are|about|this)|about (this|app|site|rgukt spark|spark)|explain (this|app|site|platform)/i,
    r: [
      "🔥 **RGUKT Spark** — the ultimate student community PWA!\n\n📌 **Doubts** → Ask anything, get peer answers\n💡 **Ideas** → Share innovations & suggestions\n🏛️ **Clubs** → Discover all campus clubs\n🎮 **Challenges** → Academic & fun competitions\n🛒 **Market** → Buy/sell textbooks & gadgets\n🎯 **GATE** → PYQ papers 2016–2025, free courses\n🏆 **Leaderboard** → Top helpers of the week\n🧠 **Daily Quiz** → Unique per device, every day\n\n✅ **100% free. Zero login. Works offline. PWA!**",
    ]},

  // ── How to post ──────────────────────────────────────────
  { p: /how (do|to|can) (i |you )?(post|ask|add|create|write) (a |an )?(doubt|question|query)/i,
    r: [
      "📝 **Posting a Doubt — Step by Step:**\n\n① Tap **\"Ask a doubt\"** button *(top-right header)*\n   ↳ or tap the **＋ FAB** button *(bottom-right)*\n② ✍️ Write your question clearly\n③ 🏷️ Pick: **Subject · Year (E1–E4) · Campus**\n④ 👤 Toggle **Anonymous** if you prefer privacy\n⑤ ✅ Hit **Post** — done!\n\n💬 Peers reply → you **mark the best answer** → earn points! 🏆",
    ]},

  // ── Reply to posts ───────────────────────────────────────
  { p: /repl(y|ies)|answer|respond|comment|help someone/i,
    r: [
      "💬 **How to Reply to a Doubt:**\n\n① Tap any **post card** to open the full thread\n② Scroll to the **reply box** at the bottom\n③ 📝 Type your answer\n④ 🚀 Tap **Send** → your reply is live!\n\n🏆 *Every helpful reply earns you points on the leaderboard!*\n💡 *Teaching others = the best way to master concepts!*",
    ]},

  // ── Ideas tab ────────────────────────────────────────────
  { p: /idea(s)?|suggest(ion)?|innovation|improve|feedback/i,
    r: [
      "💡 **The Ideas Tab — Where Innovations Live!**\n\n🌟 Share any campus improvement idea\n❤️ Others can **like** your idea\n💬 Start discussions in comments\n⭐ Best ideas get **featured** on the home screen\n🐛 Also perfect for **Bug Reports** — just tag it!\n\n→ Tap **Ideas** tab → **Post an idea** → ignite change! 🔥",
    ]},

  // ── Clubs ────────────────────────────────────────────────
  { p: /club(s)?|society|group|join club|extracurricular/i,
    r: [
      "🏛️ **RGUKT Campus Clubs — All in One Place!**\n\n🔬 **Technical** → Coding, Robotics, IEEE\n🎭 **Cultural** → Drama, Music, Dance, Lit\n⚽ **Sports** → Cricket, Football, Chess, Athletics\n\n📌 Tap **🏛 Clubs** tab to:\n• Discover active clubs & their posts\n• Post club announcements & events\n• Find members & join discussions\n\n🎯 Filter by department to see the most relevant clubs!",
    ]},

  // ── Challenges ───────────────────────────────────────────
  { p: /challeng(e|es)|compet(e|ition)|game|contest|hackathon/i,
    r: [
      "🎮 **Challenges — Compete. Win. Grow!**\n\n🥇 Academic challenges (MCQs, problems, speed rounds)\n🎯 Fun challenges (GK, coding puzzles, riddles)\n🏆 Winners get **featured on the leaderboard!**\n\n→ Tap **🎮 Challenges** tab\n→ Browse active contests\n→ Or post your own challenge!\n\n💡 *Even participating earns you community XP!* ⚡",
    ]},

  // ── Market ───────────────────────────────────────────────
  { p: /market|buy|sell|item|shop|second.?hand|textbook|notes for sale/i,
    r: [
      "🛒 **Campus Market — Buy & Sell Anything!**\n\n📚 Textbooks & notes\n💻 Gadgets & accessories\n👕 Anything campus-related\n\n**How to sell:**\n① Tap **🛒 Market** tab\n② Hit **+ List Item**\n③ Add photo 📸, price 💰, description 📝\n④ Publish → interested students contact you!\n\n**How to buy:**\n• Browse → filter by **Newest / Price**\n• Tap an item → contact the seller directly\n\n✅ *All peer-to-peer. No fees. No middlemen!*",
    ]},

  // ── GATE general ─────────────────────────────────────────
  { p: /gate( tab| section| prep| exam)?|previous year|pyq|paper(s)?|gate 202/i,
    r: [
      "🎯 **GATE Tab — Your Competitive Exam HQ!**\n\n📂 **PYQ Papers** 2016–2025 (all 5 branches)\n✅ [GeeksforGeeks GATE Solutions](https://www.geeksforgeeks.org/gate-previous-years-questions/) per paper\n📄 [Official GATE Archive (IITD)](https://gate.iitd.ac.in/GATE2024/downloads.php) — free PDFs\n🎥 **Free YouTube Lectures** — [NPTEL Official](https://www.youtube.com/@nptel), IIT channels\n🏛️ **Top IIT & NIT** free courses on [nptel.ac.in](https://nptel.ac.in/)\n📚 Practice: [GATE Overflow](https://gateoverflow.in/) · [GFG GATE](https://www.geeksforgeeks.org/gate-cs-notes-gq/) · [GATE 2025 Official](https://gate2025.iisc.ac.in/)\n\n→ Tap **🎯 GATE** tab → pick your branch → expand papers! 🔥\n\n*💡 Pro tip: Solve 3 PYQs daily = massive score boost!*",
    ]},

  // ── Branch PYQ ───────────────────────────────────────────
  { p: /branch|ece|cse|eee|civil|mech/i,
    r: [
      "📂 **PYQ Papers by Branch (2016–2025):**\n\n📡 **ECE** → Electronics & Communication\n💻 **CSE** → Computer Science\n⚡ **EEE** → Electrical Engineering\n🏗️ **Civil** → Civil Engineering\n⚙️ **Mech** → Mechanical Engineering\n\n🔽 Tap any branch chip in the GATE tab to expand its year-wise papers with:\n✅ **GeeksforGeeks Solutions** (free, explained)\n📄 **Official PDFs** from gate.iitd.ac.in\n\n*All 100% free — no subscriptions, no login!* 🎉",
    ]},

  // ── Daily Quiz ───────────────────────────────────────────
  { p: /quiz|daily quiz|question of the day|practice question/i,
    r: [
      "🧠 **Daily Quiz — Sharpen Your Mind Every Day!**\n\n📅 Refreshes at midnight\n🎲 **Unique per device** — no two students get the same set!\n⏱️ One attempt per day\n✅ See answer + detailed explanation after\n\n**Topics covered:**\n• GATE-level Engineering MCQs\n• General Knowledge\n• Current Affairs\n• Logical Reasoning\n\n→ Tap **🧠 Daily Quiz** in the header!\n\n🔥 *Daily streak = leaderboard domination!* 🏆",
    ]},

  // ── Leaderboard ──────────────────────────────────────────
  { p: /leader(board)?|top helper|rank|points|score|xp/i,
    r: [
      "🏆 **Leaderboard — Rise to the Top!**\n\n**How to earn points:**\n✅ Post a quality doubt → **+5 pts**\n💬 Someone replies to your post → **+3 pts**\n❤️ Your reply gets liked → **+10 pts**\n🎯 Win a challenge → **+25 pts**\n📊 Daily quiz answered → **+5 pts**\n\n**Ranks unlocked:**\n🥉 Apprentice → 🥈 Solver → 🥇 Mentor → 🌟 Legend\n\n→ Tap **🏆 Top Helpers** to see the rankings!\n\n💡 *Set your name first so you appear on the board!*",
    ]},

  // ── Profile ──────────────────────────────────────────────
  { p: /name|profile|avatar|set name|display name|username/i,
    r: [
      "👤 **Setting Your Name & Avatar:**\n\n① Tap **\"Set your name\"** in the header\n② 📝 Type your display name\n③ 🎨 Choose a DiceBear avatar style:\n   → Avataaars · Bottts · Pixel Art · Identicon\n④ 💾 Tap **Save**\n\n🔐 *No email. No password. No account needed!*\n↳ A unique **device ID** identifies you automatically.\n\n✨ *Your avatar and name appear on all your posts and leaderboard!*",
    ]},

  // ── Anonymous ────────────────────────────────────────────
  { p: /anonymous|anon|hide name|private post|incognito/i,
    r: [
      "🤫 **Anonymous Posting — Stay Private!**\n\nWhen writing a post, toggle the **Anonymous 🔘** switch.\n\n✅ Your name & avatar are hidden from other users\n✅ Your post still goes live in the community\n✅ You can still receive replies\n✅ Only you (your device) knows it was yours\n\n💡 *Great for sensitive doubts, mental health questions, or anything you're shy about. No judgment here!* 💙",
    ]},

  // ── Search ───────────────────────────────────────────────
  { p: /search|find post|look for|how to search|keyword/i,
    r: [
      "🔍 **Search — Find Anything Instantly!**\n\n• Click the **Search bar** at top of post list\n• Press **/** on keyboard → auto-focuses!\n• Type any keyword: subject, topic, year\n• Results filter **in real-time** ⚡\n\n**Pro search tips:**\n→ `\"limits integration\"` → finds calculus doubts\n→ `\"E3 CSE operating system\"` → targeted results\n→ `\"solved\"` → filter for answered questions\n\n*No need to scroll — just search smarter!* 🎯",
    ]},

  // ── Filter ───────────────────────────────────────────────
  { p: /filter|sort|e1|e2|e3|e4|year filter|semester/i,
    r: [
      "🎛️ **Advanced Filtering — Find Exactly What You Need!**\n\n**Available filters:**\n📚 **Subject rail** (left sidebar) → pick any subject\n🗓️ **Year chips** (E1/E2/E3/E4) in header → your batch\n🔽 **Dropdown** → Newest / Oldest / Solved / Unsolved\n🏫 **Campus chips** → Nuzvid / Ongole / Basar\n\n**Combine multiple filters!**\n→ ECE + E2 + Signals = super targeted results 🎯\n\n*Filters remember your selection during the session!*",
    ]},

  // ── Theme ────────────────────────────────────────────────
  { p: /dark|light|theme|night mode|color mode/i,
    r: [
      "🌙 **Dark / Light Mode Toggle!**\n\n→ Tap **🌙 button** in the top-right header\n→ It switches instantly — no reload!\n→ Your preference is **saved** and remembered\n\n**Why dark mode rocks for RGUKT students:**\n• 👁️ Easy on eyes during late-night GATE prep\n• 🔋 Saves battery on AMOLED screens\n• 💜 Looks absolutely premium!\n\n*Tip: Dark mode + study playlist = peak flow state* 🎧✨",
    ]},

  // ── PWA/Offline ──────────────────────────────────────────
  { p: /offline|install|pwa|home screen|app install|add to home/i,
    r: [
      "📲 **RGUKT Spark PWA — Install & Use Offline!**\n\n**Android:**\n① Open Spark in Chrome\n② Tap ⋮ menu → **\"Add to Home Screen\"**\n③ Confirm → Done! 🎉\n\n**iOS (Safari):**\n① Open in Safari\n② Tap Share → **\"Add to Home Screen\"**\n\n**Offline features:**\n🔌 Loads from cache without internet\n📵 Orange bar shows offline status\n🔄 Auto-syncs when reconnected\n⚡ No Play Store. No App Store. Just works!\n\n*Native app experience, zero storage! 🚀*",
    ]},

  // ── Campus filter ────────────────────────────────────────
  { p: /campus|nuzvid|ongole|basar|rgukt campus|which campus/i,
    r: [
      "🏫 **Campus Filtering — See Your Campus Only!**\n\n**RGUKT Campuses on Spark:**\n🌴 **Nuzvid** (RK Valley)\n🌊 **Ongole** (AP)\n🏔️ **Basar** (Telangana)\n\n→ Tap the **campus chips** below the header\n→ Instantly shows only that campus's posts\n→ When posting, **always select your campus**\n   ↳ Right students see your doubt automatically!\n\n*Campus-wise filtering = faster answers from local seniors!* 🎯\n\n🔗 **Free links:** [RGUKT Nuzvid](https://www.rguktn.ac.in) · [Ongole](https://www.rguktong.ac.in) · [RK Valley](https://www.rguktrkv.ac.in) · [Srikakulam](https://www.rguktsklm.ac.in)",
    ]},

  // ── Likes ────────────────────────────────────────────────
  { p: /like|vote|heart|react|upvote/i,
    r: [
      "❤️ **Liking Posts & Replies — Spread the Love!**\n\n① Find a helpful post or reply\n② Tap the **❤️ heart icon**\n③ That's it — you just helped someone rank higher!\n\n**Rules:**\n• One like per device per post\n• Likes boost the author's **leaderboard score**\n• Your own likes stay private\n\n💡 *If someone's reply solved your doubt — like it! It motivates people to help more.* 🌟\n\n*Liked posts = community gold standard! 🥇*",
    ]},

  // ── NPTEL/IIT ────────────────────────────────────────────
  { p: /nptel|free course|iit|lecture|youtube course|mooc/i,
    r: [
      "🎥 **Free IIT & World-Class Lectures!**\n\n📡 [NPTEL YouTube Channel](https://www.youtube.com/@nptel) — IIT Bombay, Madras, Kharagpur\n🌐 [NPTEL Website](https://nptel.ac.in/) — 1000+ free courses + certificates\n🌍 [MIT OpenCourseWare](https://ocw.mit.edu/) — free, world-class\n📚 [Khan Academy](https://www.khanacademy.org/) — basics of any subject\n🎯 [SWAYAM Portal](https://swayam.gov.in/) — Indian free courses, UGC-credited\n📺 [GATE Wallah YouTube](https://www.youtube.com/@GATEWallah) — GATE free lectures\n\n**Also in GATE tab** → 🏛️ Top IITs & NITs section with direct links!\n\n*All 100% free. No subscription. Bookmark them!* 🔖",
    ]},

  // ── Who is Spark Bot ─────────────────────────────────────
  { p: /who are you|spark bot|about you|what can you do|your features/i,
    r: [
      "🤖 **I'm Spark Bot v5 — Your Premium AI Guide!**\n\n**I answer questions about:**\n📱 Every feature of RGUKT Spark\n🎯 GATE prep — papers, strategy, PSUs\n🏫 Campus life — hostel, mess, fees, exams\n📐 Academics — Maths, Physics, ECE, CSE, EEE, Civil, Mech\n💼 Career — placements, internships, resume, interviews\n🧠 Study strategies & schedules\n💻 Programming — C, Python, Java, DSA, Web\n🔬 Core engineering concepts\n\n**Special features:**\n✦ Contextual follow-up chip suggestions\n✦ Copy any answer with one click ⎘\n✦ Clear chat anytime 🗑️\n✦ Smart topic routing\n\n*Just ask naturally — I understand Indian English too!* 🇮🇳😄",
    ]},

  // ── GATE strategy ────────────────────────────────────────
  { p: /tip|prepare|study|crack gate|gate strategy|how to prepare|gate score improvement/i,
    r: [
      "🎯 **Crack GATE — Ultimate Strategy!**\n\n**Phase 1 — Foundation (E1–E2):**\n📚 Focus on college subjects deeply\n🔢 Maths: Calculus, Linear Algebra, Probability → [NPTEL Maths](https://nptel.ac.in/course.html)\n\n**Phase 2 — GATE-mode (E3):**\n📂 Start PYQ papers (Spark GATE tab) → [GATE Overflow](https://gateoverflow.in/)\n🎥 [NPTEL](https://nptel.ac.in) lectures for weak subjects\n🧠 Spark Daily Quiz — build the habit\n\n**Phase 3 — Full prep (E4):**\n⏰ 10 previous papers per subject → [Official GATE site](https://gate2025.iisc.ac.in/)\n📖 Notes: [GFG GATE CS Notes](https://www.geeksforgeeks.org/gate-cs-notes-gq/)\n🔁 Revision cycles every 2 weeks\n💬 Post doubts on Spark — explain answers to others\n\n**Daily routine:**\n• Morning 1hr: PYQ practice\n• Evening 1hr: Concept revision\n• Night 30min: Daily Quiz + Spark discussion\n\n🔥 *Score 600+ = PSU eligibility. Score 750+ = IIT M.Tech!*",
    ]},

  // ── Hostel life ──────────────────────────────────────────
  { p: /hostel|dorm|room|mess|canteen|food|stay|campus life/i,
    r: [
      "🏠 **RGUKT Hostel Life — The Full Picture!**\n\n🛏️ **Accommodation:**\n• Separate hostels for boys & girls\n• 4–6 students per room (usually)\n• Basic furniture, fans/AC varies\n\n🍽️ **Mess:**\n• 4 meals/day — Breakfast, Lunch, Snacks, Dinner\n• Mostly vegetarian\n• Mess committee handles complaints\n\n📚 **Study:**\n• Night study halls available\n• Library open till late in exam season\n\n💡 **Pro tips from seniors:**\n→ Bring your own extension cord & desk lamp\n→ Form study groups in hostel — helps in exams\n→ Post hostel tips on Spark — help your juniors! 💙\n\n*Questions? Post in Doubts → filter your campus!*\n\n🔗 **Free links:** [RGUKT Nuzvid](https://www.rguktn.ac.in) · [RK Valley](https://www.rguktrkv.ac.in) · [Ongole](https://www.rguktong.ac.in) · [Srikakulam](https://www.rguktsklm.ac.in)",
    ]},

  // ── Fees ─────────────────────────────────────────────────
  { p: /fee(s)?|scholarship|stipend|financial|tuition|fee structure/i,
    r: [
      "💰 **RGUKT Fees & Scholarships:**\n\n**Fee structure** (general):\n• Heavily subsidized for BC/SC/ST/EWS students\n• General category — nominal compared to private colleges\n• Hostel + Mess included in fees\n\n**Scholarships available:**\n🎓 Post-Matric BC Scholarship\n🎓 SC/ST Central Govt Scholarship\n🎓 Jagananna Vidya Deevena\n🎓 RGUKT merit-based incentives\n\n**Process:**\n① Scholarship forms → filled every semester\n② Aadhaar + bank account + income certificate needed\n③ Contact campus accounts section for disbursement\n\n📌 *Post fee-related queries in Doubts — seniors know the exact process for your campus!* 🏫\n\n🔗 **Free links:** [National Scholarship Portal](https://scholarships.gov.in) · [AICTE Scholarships](https://www.aicte-india.gov.in/schemes/students-development-schemes) · [Buddy4Study](https://www.buddy4study.com)",
    ]},

  // ── Exams & marks ────────────────────────────────────────
  { p: /exam|marks|grade|gpa|cgpa|internal|external|mid(s)?|supply|attendance/i,
    r: [
      "📊 **RGUKT Academic System:**\n\n**Exam structure:**\n📝 **Internals** → 2 mid exams per semester (30 marks each)\n📋 **Externals** → End-sem exam (70 marks)\n🔁 **Supply exams** → For failed subjects\n\n**Grading:**\n• Marks → converted to Letter Grades (O/A+/A/B+/B/C/F)\n• CGPA calculated at end of each semester\n• Minimum CGPA ~6.0 needed for good placements\n\n**Attendance:**\n⚠️ 75% attendance compulsory to sit in exams!\n→ Less than 75% → detention from external exam\n\n💡 *Post exam doubts on Spark → seniors who scored high will help!* 🎯\n\n🔗 **Free links:** [NPTEL](https://nptel.ac.in) · [Khan Academy](https://www.khanacademy.org) · [MIT OpenCourseWare](https://ocw.mit.edu)",
    ]},

  // ── Backlogs ─────────────────────────────────────────────
  { p: /backlog|arrear|fail|re.?exam|supply exam|how to clear supply/i,
    r: [
      "💪 **Clearing Backlogs — Don't Panic!**\n\n**What happens:**\n• Failed a subject → appears in Supply Exam\n• Supply scheduled after main exams\n• Apply through campus exam section\n• Fee for each supply subject\n\n**How to clear it:**\n① 📂 Get **previous question papers** for that subject\n   ↳ Search in Spark Doubts by subject name\n② 💬 Post your doubts on Spark — seniors who cleared the same subject will guide you\n③ 👥 Form a study group → shared notes help\n④ 🎥 Watch NPTEL for concept clarity\n\n**Mindset:**\n*Backlogs are speed bumps, not dead ends. 60% of RGUKT students clear supplies — you're not alone! ✊*\n\n🏆 *Many PSU toppers had backlogs in early years!*\n\n🔗 **Free links:** [NPTEL](https://nptel.ac.in) · [GeeksforGeeks](https://www.geeksforgeeks.org) · [MIT OpenCourseWare](https://ocw.mit.edu)",
    ]},

  // ── Placement / career ───────────────────────────────────
  { p: /placement|job|career|company|recruit|campus drive|ctc/i,
    r: [
      "💼 **Placements at RGUKT — Full Guide!**\n\n**Top recruiters (CSE):**\n• [TCS](https://nextstep.tcs.com), [Infosys](https://www.infosys.com/careers/), [Wipro](https://careers.wipro.com), [HCL](https://www.hcltech.com/careers) — Mass hiring\n• [Capgemini](https://www.capgemini.com/careers/), [Cognizant](https://careers.cognizant.com), [Tech Mahindra](https://careers.techmahindra.com)\n• [Amazon](https://www.amazon.jobs), [Flipkart](https://www.flipkartcareers.com) — for top rankers\n\n**Top recruiters (ECE/EEE):**\n• [BHEL](https://www.bhel.com/careers), [ISRO](https://www.isro.gov.in/Careers.html), [NTPC](https://www.ntpc.co.in/careers) — via GATE\n• [L&T](https://www.larsentoubro.com/corporate/careers/), [Siemens](https://jobs.siemens.com), [ABB](https://careers.abb)\n• [Jio](https://careers.jio.com), [Airtel](https://www.airtel.in/careers) — Telecom\n\n**Timeline:**\n📅 Internship drives — E3 (3rd year)\n📅 Campus placements — E4 (final year)\n\n**What companies want:**\n🔑 DSA + Problem solving (CS/ECE) → [CSES Problem Set](https://cses.fi/problemset/), [GeeksforGeeks](https://www.geeksforgeeks.org)\n🔑 Core subject knowledge → [NPTEL](https://nptel.ac.in)\n🔑 Communication & teamwork\n🔑 CGPA ≥ 6.5 (some companies)\n\n🆓 **Free job portal:** [National Career Service](https://www.ncs.gov.in)\n\n💡 *Post placement tips on Spark — help your juniors too!* 🤝",
    ]},

  // ── Internship / project ─────────────────────────────────
  { p: /project|mini project|final year project|internship|research paper|ieee paper/i,
    r: [
      "🔬 **Projects & Internships — Start Early, Win Big!**\n\n**Find project ideas:**\n💡 Ideas tab on Spark · [GitHub Trending](https://github.com/trending) · [DevPost](https://devpost.com/)\n\n**Internship platforms (free to apply):**\n💼 [LinkedIn Jobs](https://www.linkedin.com/jobs/) — network + apply free\n🏛️ [National Career Service](https://www.ncs.gov.in/) — govt portal, free\n🎓 [AICTE Internship Portal](https://internship.aicte-india.org/) — free for students\n🔬 [IIT Research Internships](https://www.iitism.ac.in/index.php/Research/summer_internship) — apply directly to IITs\n\n**Research papers:**\n📄 [IEEE Xplore](https://ieeexplore.ieee.org/) — free via NPTEL account\n📚 [ResearchGate](https://www.researchgate.net/) — free papers\n🔬 [arXiv](https://arxiv.org/) — preprints, all free\n\n🏆 *[GitHub](https://github.com/) profile with 3+ projects = interview superpower!*",
    ]},

  // ── Resume / Interview ───────────────────────────────────
  { p: /resume|cv|interview|hr round|technical round|how to write resume/i,
    r: [
      "📄 **Resume & Interview Mastery!**\n\n**Resume essentials:**\n✅ Keep it **1 page**\n✅ Use **action verbs**: Built, Implemented, Optimized\n✅ Quantify achievements: \"Solved 200+ LeetCode problems\"\n✅ Mention: Projects, Skills, Achievements, CGPA (if ≥7)\n✅ Free tools: **Overleaf** (LaTeX), **Canva**, **Zety**\n\n**Technical interview prep:**\n💻 CSE → DSA (arrays, trees, graphs, DP)\n📡 ECE → Networks, Signals, VLSI basics\n⚡ EEE → Machines, Power electronics\n\n**HR interview tips:**\n🗣️ Know your project inside-out\n💪 \"Tell me about yourself\" — practice 2-min version\n🙋 Be honest about backlogs — frame them positively\n\n💡 *Mock interviews on Spark Challenges → practice with peers!*\n\n🔗 **Free links:** [Overleaf Resume Templates](https://www.overleaf.com/latex/templates/tagged/cv) · [GFG Interview Prep](https://www.geeksforgeeks.org/interview-preparation/) · [CSES Problem Set](https://cses.fi/problemset/)",
    ]},

  // ── GATE score / PSU ─────────────────────────────────────
  { p: /gate score|psu|bhel|isro|ntpc|barc|drdo|gate rank|cutoff|m.?tech/i,
    r: [
      "🏛️ **GATE Score — PSU Jobs & M.Tech!**\n\n**PSU recruitment via GATE:**\n🔵 [BHEL](https://www.bhel.com/careers) → All branches (score 600+)\n🔴 [ISRO](https://www.isro.gov.in/Careers.html) → ECE, CSE, Mech (score 750+)\n🟡 [NTPC](https://www.ntpc.co.in/careers) → EEE, Mech (score 600+)\n🟠 [BARC](https://barc.gov.in) → All (score 700+)\n🟢 [DRDO](https://www.drdo.gov.in) → All branches (score 650+)\n🔵 [ONGC](https://ongcindia.com/web/eng/careers), [GAIL](https://gailonline.com) → Civil, Mech, EEE\n\n**M.Tech admission:**\n• IITs → top 1000–2000 rank\n• NITs → top 5000–10000 rank\n• GATE scholarship → ₹12,400/month stipend!\n\n**Timeline:** GATE exam → February each year\n📣 Register & notifications: [Official GATE site](https://gate2025.iisc.ac.in/)\n🎓 M.Tech counselling: [COAP](https://coap.iitb.ac.in) · [CCMT](https://ccmt.admissions.nic.in)\n\n💡 *Use Spark's GATE tab PYQs daily for 3 months = massive rank improvement!* 📈",
    ]},

  // ── Study schedule ───────────────────────────────────────
  { p: /study schedule|timetable|how many hours|study plan|time management|routine/i,
    r: [
      "⏰ **Optimal Study Schedule for RGUKT Students:**\n\n**Daily routine (exam mode):**\n```\n6:00 AM  → Morning revision (1 hr)\n8:00 AM  → Classes (attend actively!)\n1:00 PM  → Lunch + short nap (30 min)\n2:00 PM  → Self-study / NPTEL (2 hrs)\n4:00 PM  → Solve PYQs (1 hr)\n6:00 PM  → Daily Quiz on Spark ⚡\n7:00 PM  → Post/answer doubts on Spark (30 min)\n10:00 PM → Revision + next-day prep\n```\n\n**GATE prep mode (E4):**\n• 6 hrs/day minimum\n• Rotate 3 subjects daily\n• 1 full GATE paper every Sunday\n\n🔥 *Consistency > intensity. 4 focused hours > 10 distracted ones!*\n\n🔗 **Free links:** [Khan Academy](https://www.khanacademy.org) · [NPTEL](https://nptel.ac.in) · [MIT OpenCourseWare](https://ocw.mit.edu)",
    ]},

  // ── Delete/edit post ─────────────────────────────────────
  { p: /delete|edit|remove post|update post|modify|change my post/i,
    r: [
      "✏️ **Editing & Managing Your Posts:**\n\n**On your own posts:**\n• Open the post → tap ⋮ options menu\n• Options: **Mark as Solved ✅** · **Edit (if allowed)** · **Report**\n\n**Marking solved:**\n→ When your doubt is answered, mark the best reply as **\"Best Answer\"** ✔️\n→ This closes the doubt and rewards the replier!\n\n**Deleting:**\n→ For deletion requests, flag the post and mention in **Ideas** tab\n\n💡 *Solved posts help future students too — don't delete, mark solved instead!* 🙏",
    ]},

  // ── Notifications ────────────────────────────────────────
  { p: /notification|update|alert|when does it update|new post|refresh/i,
    r: [
      "🔔 **Notifications & Updates — Real-time!**\n\n**How Spark stays fresh:**\n• 🟢 Posts refresh automatically\n• 📲 **\"New posts arrived ↑\"** toast appears when new content loads\n• ⬆️ Tap it to jump to the latest posts\n• 🔄 PWA updates silently in background\n\n**No push notifications (yet)** — but the live toast makes sure you never miss new content!\n\n💡 *Pro tip: Pin Spark to your home screen for fastest access!* 📌",
    ]},

  // ── Privacy / security ───────────────────────────────────
  { p: /privacy|safe|secure|data|track|login|password|account|my data/i,
    r: [
      "🔐 **Privacy & Security — You're Safe Here!**\n\n✅ **Zero login** — no email, phone, or password\n✅ **No personal data** collected or stored\n✅ **Random device ID** — lives in your browser localStorage\n✅ **Anonymous mode** — extra privacy on posts\n✅ **No tracking** — no ads, no analytics on your identity\n\n**Your identity:**\n→ Represented by a device UUID (like `dd-3f8a2c...`)\n→ Reset anytime by clearing site data\n→ Different devices = different identities\n\n🌟 *Built with privacy-first principles. Spark respects you!* 💙",
    ]},

  // ── Bug report ───────────────────────────────────────────
  { p: /bug|issue|problem|broken|error|crash|not working|report a bug/i,
    r: [
      "🐛 **Found a Bug? Report It!**\n\n**How to report:**\n① Go to **Ideas** tab\n② Tap **Post an idea**\n③ Write: `[Bug] Short description`\n④ Include:\n   📸 Screenshot (if possible)\n   📋 Steps to reproduce\n   📱 Device + browser\n⑤ Post → dev team monitors this daily!\n\n**Common fixes you can try:**\n• 🔄 Hard refresh: Ctrl+Shift+R (PC) / long-tap refresh (mobile)\n• 🗑️ Clear site cache → Settings → Site Data → Clear\n• 📲 Reinstall if PWA\n\n*Thanks for making Spark better for everyone! 🙏*",
    ]},

  // ── Motivation ───────────────────────────────────────────
  { p: /motivat|inspire|demotivat|give up|tired|stress|struggle|feeling down|burnout/i,
    r: [
      "💫 **Hey, you're doing better than you think.**\n\nEvery doubt you post = courage to learn.\nEvery answer you give = someone's breakthrough.\nEvery day you show up = compounding growth.\n\n🌱 *You don't have to be perfect. You just have to be consistent.*\n\n**Right now:**\n☕ Take a 15-min break — walk, breathe, hydrate\n📱 Open Spark Daily Quiz — just 1 question\n💬 Answer someone's doubt — it resets your perspective\n\n🔥 *The leaderboard doesn't show how many times you struggled — only that you came back!*\n\nYou've got this. The entire Spark community is with you. 💙✨\n\n🔗 **Free links:** [Tele-MANAS (free helpline 14416)](https://telemanas.mohfw.gov.in) · [CS50 Free Course](https://cs50.harvard.edu) · [NPTEL](https://nptel.ac.in)",
      "🚀 **Every GATE topper had days of doubt. Every IITian questioned themselves.**\n\nWhat separated them: they showed up the next day.\n\n**Your Spark toolkit for hard days:**\n🧠 Daily Quiz → 5 min, one win\n💬 Post a doubt → release it\n❤️ Answer someone → remind yourself what you know\n🏆 Check leaderboard → see how far you've come\n\n*Progress > perfection. Always.* 💪🌟\n\n🔗 **Free links:** [Tele-MANAS (free helpline 14416)](https://telemanas.mohfw.gov.in) · [CS50 Free Course](https://cs50.harvard.edu) · [NPTEL](https://nptel.ac.in)",
    ]},

  // ── Programming ──────────────────────────────────────────
  { p: /program(ming)?|code|coding|c\+\+|python|java\b|dsa|data structure|algorithm|leetcode/i,
    r: [
      "💻 **Programming & DSA Help on Spark!**\n\n**Post coding doubts:**\n→ Doubts tab → Subject: **C Programming / DSA / Java**\n\n**Essential roadmap (CS/ECE):**\n```\nC Basics → OOP (Java/C++) → DSA\n→ Trees → Graphs → DP → System Design\n```\n\n**Free resources:**\n🌿 [GeeksforGeeks](https://www.geeksforgeeks.org/) — best for DSA + GATE\n🟧 [LeetCode](https://leetcode.com/) — interview prep (free problems available)\n📺 [CS50 Harvard](https://cs50.harvard.edu/x/) — 100% free (no edX account needed)\n🎓 [NPTEL Programming](https://nptel.ac.in/courses/106/105/106105151/) — free\n🐍 [Python.org Tutorials](https://docs.python.org/3/tutorial/) — official\n🏆 [CSES Problem Set](https://cses.fi/problemset/) — best free DSA practice\n\n**GATE CSE topics:** Algorithms · DS · TOC · Compiler · OS · DBMS · CN\n\n🔥 *Solve 1 problem daily = interview-ready in 6 months!*",
    ]},

  // ── Maths ────────────────────────────────────────────────
  { p: /math(s|ematics)?|calculus|linear algebra|transform|fourier|laplace|differential|integral|matrix/i,
    r: [
      "📐 **Engineering Mathematics — Master It!**\n\n**GATE Maths topics (all branches):**\n📈 **Calculus** · 🔢 **Linear Algebra** · 📊 **Probability & Stats**\n🌊 **Transforms** (Fourier, Laplace, Z) · 🧮 **Numerical Methods** · 🔄 **DEs**\n\n**Best free resources:**\n📺 [NPTEL Engineering Maths](https://www.youtube.com/watch?v=jbIQW0gkgxo&list=PLbMVogVj5nJQCcboeQfPVBHEUm6oPXJYd) — IIT Bombay\n🌐 [Khan Academy Maths](https://www.khanacademy.org/math) — any concept from basics\n📚 [3Blue1Brown](https://www.youtube.com/@3blue1brown) — visual intuition (YouTube)\n🧮 [Wolfram Alpha](https://www.wolframalpha.com/) — solve any equation instantly\n\n💡 *Post your Maths doubts on Spark → it's the most answered subject!* 🧠",
    ]},

  // ── Physics ──────────────────────────────────────────────
  { p: /physics|mechanics|optics|quantum|electro(magnetics?|statics?)|thermodynamics for physics/i,
    r: [
      "⚛️ **Engineering Physics — Key Concepts!**\n\n**E1 syllabus (all RGUKT branches):**\n🔊 Waves & Oscillations\n💡 Optics (interference, diffraction)\n⚡ Electrostatics & Magnetism\n🔬 Quantum Mechanics basics\n🌡️ Thermodynamics\n💻 Semiconductor physics\n\n**GATE-relevant (branch-specific):**\n• ECE → Semiconductor devices, EM waves\n• EEE → Magnetic circuits, Electrical machines physics\n• Mech → Thermodynamics, Fluid mechanics\n\n**Resources:**\n📺 NPTEL Engineering Physics\n📚 H.K. Dass / B.K. Pandey (standard textbooks)\n🌐 HyperPhysics website (free, visual)\n\n*Post doubts on Spark → the Physics community here is super active!* ⚡\n\n🔗 **Free links:** [HyperPhysics](http://hyperphysics.phy-astr.gsu.edu/hbase/hframe.html) · [NPTEL Physics](https://nptel.ac.in) · [MIT OCW Physics](https://ocw.mit.edu)",
    ]},

  // ── Chemistry ────────────────────────────────────────────
  { p: /chem(istry)?|organic|inorganic|reaction|atom|molecule|bond|polymer|corrosion/i,
    r: [
      "🧪 **Engineering Chemistry — E1 Essential!**\n\n**RGUKT Engineering Chemistry topics:**\n⚡ Electrochemistry → Nernst equation, cells, batteries\n🔴 Corrosion → Types, prevention methods\n💧 Water chemistry → hardness, treatment, boiler scale\n🧴 Polymers → addition, condensation, plastics, rubbers\n⛽ Fuels → calorific value, coal, petroleum analysis\n🔬 Spectroscopy → UV-Vis, IR basics\n\n**For numericals:**\n→ Post the specific problem in Doubts → seniors will solve step-by-step!\n\n**Resources:**\n📺 NPTEL Engineering Chemistry\n📚 Jain & Jain / O.G. Palanna textbooks\n🌐 LibreTexts Chemistry (free, detailed)\n\n*Chemistry = E1 only for most branches — nail it early!* 🎯\n\n🔗 **Free links:** [LibreTexts Chemistry](https://chem.libretexts.org) · [NPTEL Chemistry](https://nptel.ac.in) · [Khan Academy](https://www.khanacademy.org/science/chemistry)",
    ]},

  // ── Electronics ──────────────────────────────────────────
  { p: /circuit|electronics|resistor|capacitor|diode|transistor|op.?amp|signal|vlsi|analog/i,
    r: [
      "📡 **Electronics & Circuits — Deep Dive!**\n\n**ECE Core subjects at RGUKT:**\n\n⚡ **Circuit Analysis:** KVL, KCL, Thevenin, Norton, Superposition\n🔌 **Electronic Devices:** Diode, BJT, MOSFET characteristics\n🔁 **Analog Circuits:** Amplifiers, OP-AMP applications, oscillators\n💻 **Digital Circuits:** Boolean algebra, K-map, combinational/sequential\n📻 **Signals & Systems:** Fourier, Laplace, Z-transforms, convolution\n🧠 **Control Systems:** Transfer function, Bode plot, Root locus\n📡 **EMT:** Maxwell's equations, wave propagation, antenna\n\n**GATE ECE PYQs** → Spark GATE tab → ECE branch!\n\n**Resources:**\n📺 NPTEL ECE courses (IIT Kharagpur, Madras)\n📚 Sedra & Smith — Microelectronics\n🌐 All About Circuits (allaboutcircuits.com) — free!\n\n*Post circuit problems on Spark with diagram descriptions → ECE seniors are very active!* 🔥\n\n🔗 **Free links:** [All About Circuits](https://www.allaboutcircuits.com) · [Falstad Circuit Simulator](https://www.falstad.com/circuit/) · [NPTEL Electronics](https://nptel.ac.in)",
    ]},

  // ── Communications ───────────────────────────────────────
  { p: /communication|modulation|am|fm|channel|signal processing|mimo|antenna|wireless/i,
    r: [
      "📡 **Communications Engineering — ECE Core!**\n\n**GATE ECE: Communications syllabus:**\n📻 Analog modulation: AM, FM, PM — theory + numericals\n💾 Digital modulation: ASK, FSK, PSK, QAM\n📊 Information theory: Shannon's theorem, entropy, channel capacity\n🌊 Noise analysis: SNR, BER, thermal noise\n📡 Antennas: Radiation pattern, gain, directivity\n🔬 Sampling theorem, Nyquist rate, quantization\n\n**Must-know formulas:**\n→ Shannon capacity: `C = B × log₂(1 + S/N)`\n→ Nyquist rate: `fₛ ≥ 2B`\n\n**Resources:**\n📺 NPTEL Communications (IIT Kharagpur)\n📚 Haykin's Communication Systems\n📂 ECE PYQs in Spark GATE tab (2016–2025)!\n\n*Post communication doubts on Spark — it's a GATE hot topic!* 🎯\n\n🔗 **Free links:** [GaussianWaves](https://www.gaussianwaves.com) · [NPTEL Communications](https://nptel.ac.in) · [MIT OCW Signals](https://ocw.mit.edu)",
    ]},

  // ── Power systems ────────────────────────────────────────
  { p: /power system|transformer|motor|generator|induction|voltage|current|load flow|eee|electrical/i,
    r: [
      "⚡ **Electrical Engineering — Power & Systems!**\n\n**GATE EEE core topics:**\n🔌 **Networks:** Mesh/Nodal analysis, Network theorems\n🔄 **Machines:** DC motors/generators, Induction motor, Synchronous machine\n⚡ **Power Electronics:** Rectifiers, Inverters, SMPS, Converters\n🔋 **Power Systems:** Load flow, Fault analysis, Protection\n🎛️ **Control Systems:** Poles/Zeros, Stability, PID controller\n📊 **Signals:** Laplace, Transfer function\n\n**EEE PYQs** → Spark GATE tab → EEE branch (2016–2025)!\n\n**Key resources:**\n📺 NPTEL EEE (IIT Madras, Roorkee)\n📚 Nagrath & Kothari — Power Systems\n📚 Chapman — Electric Machinery\n\n*EEE has the best PSU recruitment via GATE — NTPC, BHEL, PGCIL!* 🏛️\n\n🔗 **Free links:** [Electrical4U](https://www.electrical4u.com) · [NPTEL Electrical](https://nptel.ac.in) · [MIT OCW](https://ocw.mit.edu)",
    ]},

  // ── Civil ────────────────────────────────────────────────
  { p: /structure|concrete|steel|rcc|beam|column|soil|foundation|highway|fluid mechanics|civil/i,
    r: [
      "🏗️ **Civil Engineering — Build the Future!**\n\n**GATE Civil core topics:**\n🏛️ **Structural Analysis:** Trusses, beams, indeterminate structures\n🪨 **RCC Design:** Beams, columns, slabs — IS 456\n🌊 **Fluid Mechanics:** Bernoulli, flow measurement, pipe flow\n🪱 **Soil Mechanics:** Shear strength, consolidation, bearing capacity\n🚗 **Transportation:** Highway design, traffic engineering\n🌧️ **Hydrology:** Run-off, hydrograph, groundwater\n🔬 **Engineering Mechanics:** Statics, dynamics\n\n**Civil PYQs** → Spark GATE tab → Civil branch (2016–2025)!\n\n**Resources:**\n📺 NPTEL Civil (IIT Bombay, Madras)\n📚 IS codes (free on BIS portal)\n\n*PSU options: CPWD, NHAI, PWD, RITES, NHPC via GATE!* 🏆\n\n🔗 **Free links:** [NPTEL Civil Engineering](https://nptel.ac.in) · [MIT OCW Civil](https://ocw.mit.edu) · [Engineering Toolbox](https://www.engineeringtoolbox.com)",
    ]},

  // ── Mechanical ───────────────────────────────────────────
  { p: /thermo(dynamics)?|heat transfer|turbine|compressor|manufacturing|cad|stress|strain|mechanical|mech/i,
    r: [
      "⚙️ **Mechanical Engineering — The Backbone of Industry!**\n\n**GATE Mech core topics:**\n🌡️ **Thermodynamics:** Laws, cycles (Carnot, Rankine, Otto, Diesel)\n🌊 **Fluid Mechanics:** Viscosity, Bernoulli, turbomachinery\n🔥 **Heat Transfer:** Conduction, Convection, Radiation\n🔩 **Theory of Machines:** Mechanisms, vibrations, governors\n🏭 **Manufacturing:** Casting, welding, forming, machining\n🔬 **Strength of Materials:** Stress-strain, bending, torsion\n\n**Mech PYQs** → Spark GATE tab → Mech branch (2016–2025)!\n\n**Resources:**\n📺 NPTEL Mechanical (IIT Bombay, Roorkee, Madras)\n📚 R.K. Rajput — Thermodynamics\n📚 Rattan & Sharma — Theory of Machines\n\n*PSU options: BHEL, ISRO, DRDO, L&T, Tata Motors via GATE!* 🚀\n\n🔗 **Free links:** [NPTEL Mechanical](https://nptel.ac.in) · [Engineering Toolbox](https://www.engineeringtoolbox.com) · [MIT OCW Mech](https://ocw.mit.edu)",
    ]},

  // ── CS subjects ──────────────────────────────────────────
  { p: /operating system|os\b|process|thread|semaphore|deadlock/i,
    r: [
      "💻 **Operating Systems — CSE GATE Essential!**\n\n**GATE CSE OS syllabus:**\n🔄 Processes & Threads — creation, scheduling (FCFS, SJF, Round Robin)\n🔒 Synchronization — Semaphores, Mutex, Monitors, Deadlock\n💾 Memory Management — Paging, Segmentation, Virtual Memory, Page replacement\n💿 File Systems — FAT, Inode, Directory structure\n⌨️ I/O Systems & Disk Scheduling\n\n**High-weightage GATE topics:**\n→ Banker's Algorithm (deadlock avoidance)\n→ Page replacement (LRU, FIFO, Optimal)\n→ Process scheduling numericals\n\n**Resources:**\n📚 Galvin — Operating System Concepts\n📺 NPTEL OS (IIT Bombay)\n🌐 GFG OS articles + practice questions\n📂 CSE PYQs in Spark GATE tab → OS questions!\n\n*Post OS doubts on Spark — very high reply rate!* 🎯\n\n🔗 **Free links:** [OSTEP (free book)](https://pages.cs.wisc.edu/~remzi/OSTEP/) · [GFG Operating Systems](https://www.geeksforgeeks.org/operating-systems/) · [NPTEL OS](https://nptel.ac.in)",
    ]},

  // ── DBMS ─────────────────────────────────────────────────
  { p: /database|dbms|sql|query|normalization|er diagram|relation/i,
    r: [
      "🗄️ **DBMS — Data is the New Oil!**\n\n**GATE CSE DBMS syllabus:**\n📊 ER Model — Entities, Relationships, Attributes\n📋 Relational Algebra — Select, Project, Join, Set operations\n🔤 SQL — DDL, DML, Aggregate functions, Joins, Subqueries\n🔄 Normalization — 1NF, 2NF, 3NF, BCNF — find anomalies\n🔍 Transactions — ACID properties, Concurrency control\n🌳 Indexing — B+ tree, Hashing\n\n**Golden GATE formula:**\n→ `SELECT * FROM Questions WHERE marks > 5 AND year >= 2020;`\n\n**Resources:**\n📚 Ramakrishnan & Gehrke — DB Management Systems\n🌐 SQL practice: SQLZoo (free), LeetCode SQL\n📺 NPTEL DBMS lectures\n📂 CSE PYQs → Spark GATE tab!\n\n*DBMS numericals = easiest marks in GATE CSE!* 💯\n\n🔗 **Free links:** [SQLZoo](https://sqlzoo.net) · [W3Schools SQL](https://www.w3schools.com/sql/) · [GFG DBMS](https://www.geeksforgeeks.org/dbms/)",
    ]},

  // ── Networks ─────────────────────────────────────────────
  { p: /network(ing)?|tcp|ip|osi|layer|protocol|routing|subnet|http/i,
    r: [
      "🌐 **Computer Networks — Connect Everything!**\n\n**GATE CSE CN syllabus:**\n🔗 **OSI / TCP-IP layers** — functions, protocols per layer\n📡 **Data Link Layer** — framing, error control, CSMA/CD, CSMA/CA\n🌍 **Network Layer** — IP addressing, subnetting, routing (OSPF, RIP, BGP)\n🚀 **Transport Layer** — TCP (connection, flow control, congestion), UDP\n🌐 **Application Layer** — HTTP, DNS, SMTP, FTP, DHCP\n\n**Subnetting trick:**\n→ CIDR /24 = 256 hosts, /25 = 128, /26 = 64...\n→ Practice subnetting = guaranteed marks!\n\n**Resources:**\n📚 Forouzan — Data Communications\n🌐 Cisco NetAcad (free intro courses)\n📺 NPTEL Computer Networks\n📂 CSE PYQs → Spark GATE tab!\n\n*CN + OS + DBMS = 30% of GATE CSE marks!* 📈\n\n🔗 **Free links:** [Kurose & Ross Resources](https://gaia.cs.umass.edu/kurose_ross/) · [GFG Computer Networks](https://www.geeksforgeeks.org/computer-network-tutorials/) · [NPTEL Networks](https://nptel.ac.in)",
    ]},

  // ── TOC / Compilers ──────────────────────────────────────
  { p: /toc|theory of computation|automata|grammar|turing|compiler|lex|yacc|parsing/i,
    r: [
      "🤖 **Theory of Computation + Compilers — CSE GATE!**\n\n**TOC syllabus:**\n🔁 **Regular languages** — DFA, NFA, Regular expressions, Pumping lemma\n📜 **CFG** — Context Free Grammars, PDAs, Ambiguity\n⛔ **Decidability** — Recursive, RE, non-RE languages\n🤖 **Turing Machines** — Halting problem, reductions\n\n**Compilers syllabus:**\n📝 Phases: Lexical → Syntax → Semantic → Code Gen\n📊 Parsing: LL(1), LR(0), SLR, LALR, CLR\n🔄 SDT, Syntax-directed definitions\n\n**High-GATE-weightage topics:**\n→ Closure properties of regular languages\n→ CFL vs Regular vs recursive enumerable\n\n**Resources:**\n📚 Ullman — Intro to Automata Theory\n📚 Aho (Dragon Book) — Compilers\n🌐 GFG TOC articles\n\n*TOC = most theory; memorize closure properties!* 🧠\n\n🔗 **Free links:** [JFLAP (free tool)](https://www.jflap.org) · [GFG Theory of Computation](https://www.geeksforgeeks.org/theory-of-computation-automata-tutorials/) · [NPTEL TOC](https://nptel.ac.in)",
    ]},

  // ── Python ───────────────────────────────────────────────
  { p: /python|numpy|pandas|matplotlib|machine learning|ml|ai|deep learning|tensorflow/i,
    r: [
      "🐍 **Python & Machine Learning — The Future is Here!**\n\n**ML roadmap:**\n① Python basics → NumPy → Pandas → Matplotlib\n② Scikit-learn → Regression/Classification\n③ Neural Networks → TensorFlow / PyTorch\n④ Build projects → GitHub → get hired!\n\n**Free resources:**\n🐍 [Python Tutorials](https://docs.python.org/3/tutorial/) — official docs\n📺 [Andrew Ng ML — YouTube](https://www.youtube.com/playlist?list=PLkDaE6sCZn6FNC6YRfRQc_FbeQrF8BwGI) — 100% free\n📺 [NPTEL AI/ML](https://www.youtube.com/watch?v=7O72EMbSoHs&list=PLyqSpQzTE6M_G5CJRpP0f7r5-kH9xb0VE) — free lectures\n🤗 [Hugging Face](https://huggingface.co/learn) — NLP + transformers, free\n🌐 [Kaggle](https://www.kaggle.com/) — free datasets, notebooks, competitions\n\n💡 *1 [Kaggle](https://www.kaggle.com/) competition project on resume = interview magnet!* 🚀",
    ]},

  // ── Web dev ──────────────────────────────────────────────
  { p: /web|html|css|javascript|react|nodejs|frontend|backend|fullstack|api/i,
    r: [
      "🌐 **Web Development — Build Real Things!**\n\n**Frontend roadmap:**\n```\nHTML5 → CSS3 → JavaScript → React.js\n```\n\n**Free resources:**\n🌐 [MDN Web Docs](https://developer.mozilla.org/) — best reference, free\n📺 [The Odin Project](https://www.theodinproject.com/) — full curriculum, free\n🎓 [freeCodeCamp](https://www.freecodecamp.org/) — free certification\n📺 [CS50 Web (Harvard)](https://cs50.harvard.edu/web/) — 100% free\n🎨 [Frontend Mentor](https://www.frontendmentor.io/) — real project challenges\n\n**Tools:**\n🔵 [VS Code](https://code.visualstudio.com/) · 🐙 [GitHub](https://github.com/) · 🚀 [Vercel](https://vercel.com/) (free deploy)\n\n*Post web dev doubts on Spark → very fast replies!* ⚡",
    ]},

  // ── Git / GitHub ─────────────────────────────────────────
  { p: /git|github|version control|commit|branch|pull request|open source/i,
    r: [
      "🐙 **Git & GitHub — Developer Superpower!**\n\n**Essential Git commands:**\n```bash\ngit init · git add . · git commit -m \"\"\ngit push origin main · git pull\ngit branch feat · git merge feat\n```\n\n**Free resources:**\n🎮 [Learn Git Branching](https://learngitbranching.js.org/) — interactive, visual\n📺 [Git Crash Course](https://www.youtube.com/watch?v=RGOj5yH7evk) — freeCodeCamp YouTube\n📚 [Pro Git Book](https://git-scm.com/book/en/v2) — free at git-scm.com\n🐙 [GitHub Skills](https://skills.github.com/) — official free courses\n\n💡 *Create your profile → [github.com](https://github.com/) — companies check this!*\n\n*Post Git doubts on Spark!* 🔥",
    ]},

  // ── Thanks/bye ───────────────────────────────────────────
  { p: /thank|bye|goodbye|ok thanks|great|awesome|nice|cool|helpful|perfect|amazing/i,
    r: [
      "😊 **You're so welcome!** Keep that spark alive! 🔥✨",
      "🌟 **Anytime, always!** RGUKT Spark is here 24/7 for you! 💙",
      "🎉 **Happy to help!** All the best for GATE & beyond! 🏆🚀",
      "💪 **Go conquer it!** The community is always behind you! 🌟",
    ]},

  // ── Help / guide ─────────────────────────────────────────
  { p: /help|guide|what can you do|features|menu|topics/i,
    r: [
      "🤖 **Spark Bot v5 — Everything I Can Help With:**\n\n**📱 App Features:**\nPosting doubts · Ideas · Clubs · Market · Challenges\nLeaderboard · Daily Quiz · Search & Filter · PWA Install\n\n**🎯 GATE & Exam Prep:**\nPYQ papers (all branches) · Study strategy · PSU guidance\nM.Tech admission · Daily Quiz tips\n\n**🏫 Campus Life:**\nHostel · Mess · Fees · Scholarships · Attendance rules\nExams & CGPA · Backlogs · Campus filter\n\n**📐 Academics:**\nMaths · Physics · Chemistry · Programming & DSA\nECE/EEE/Civil/Mech/CSE core subjects\nOS · DBMS · CN · TOC · Compilers\n\n**💼 Career:**\nPlacements · Internships · Projects · Resume\nInterview prep · GitHub · Web Dev · Python/ML\n\n**💡 Life:**\nMotivation · Study schedules · Time management\n\n*Just ask naturally — no commands needed! I understand you.* 🌟",
    ]},
];

// ════════════════════════════════════════════════════════════
//  SMART FALLBACK — topic-aware, never generic
// ════════════════════════════════════════════════════════════
const FALLBACK_SMART = [
  (t) => `🤔 Interesting question about **"${t.slice(0,40)}"**!\n\nI might not have that exact answer yet, but:\n\n📌 **Post it as a Doubt on Spark** — your seniors & peers definitely know!\n🔍 **Search** existing posts — someone may have asked before\n💡 **Rephrase** your question — I might know it differently\n\nTry asking about: GATE prep, academics, hostel life, career, or any app feature! ✨`,
  (t) => `🧐 Great question! Let me think... **"${t.slice(0,35)}"** is a bit outside my current knowledge.\n\n**But here's what I'd suggest:**\n→ 🔍 Search in Spark Doubts for this topic\n→ 💬 Post the question — community responds fast!\n→ 🎥 Check NPTEL/YouTube for technical concepts\n\nI'm always learning new topics! Ask me anything else! 🚀`,
];

// ════════════════════════════════════════════════════════════
//  RESPOND ENGINE — smart matching
// ════════════════════════════════════════════════════════════
function respond(text) {
  const t = text.trim();
  // Primary KB match
  for (const e of KB) {
    if (e.p.test(t)) {
      const a = e.r; return a[Math.floor(Math.random() * a.length)];
    }
  }
  // Smart fallback
  const fn = FALLBACK_SMART[Math.floor(Math.random() * FALLBACK_SMART.length)];
  return fn(t);
}

// ════════════════════════════════════════════════════════════
//  CONTEXT CHIPS
// ════════════════════════════════════════════════════════════
const QUICK_DEFAULT = ["What is RGUKT Spark? ✨","GATE PYQ Papers 📂","Career & Placements 💼","Daily Quiz 🧠"];

function ctxChips(t) {
  t = t.toLowerCase();
  if (/gate|pyq|paper/.test(t))         return ["ECE branch papers 📡","GATE strategy 🎯","PSU recruitment 🏛️"];
  if (/doubt|ask|post/.test(t))         return ["How to reply? 💬","Anonymous posting 🤫","Earn leaderboard points 🏆"];
  if (/quiz/.test(t))                   return ["Study schedule ⏰","GATE prep tips 📚","Leaderboard tips 🏆"];
  if (/hostel|mess|food/.test(t))       return ["Fees & scholarships 💰","Campus filter 🏫","Post tips for juniors 🙌"];
  if (/place|job|career/.test(t))       return ["Internship guide 💼","Resume tips 📄","GATE for PSUs 🏛️"];
  if (/exam|marks|cgpa|backlog/.test(t))return ["Study schedule ⏰","Post a doubt 📝","Backlogs guide 💪"];
  if (/code|program|dsa|python/.test(t))return ["Web dev guide 🌐","Git & GitHub 🐙","ML roadmap 🤖"];
  if (/math|physics|chem/.test(t))      return ["Free NPTEL courses 🎥","Post a doubt 📝","GATE Maths topics 📐"];
  if (/motivat|stress|tired/.test(t))   return ["Study strategy 📚","Daily quiz streak 🔥","Help others — earn points 🤝"];
  if (/python|ml|ai/.test(t))           return ["Web dev guide 🌐","Git & GitHub 🐙","Kaggle projects 🏅"];
  if (/web|html|react/.test(t))         return ["Python & ML 🐍","Git & GitHub 🐙","Build projects 🚀"];
  return QUICK_DEFAULT.slice(0, 3);
}

// ════════════════════════════════════════════════════════════
//  MARKDOWN
// ════════════════════════════════════════════════════════════
function md(s) {
  return s
    .replace(/```([\s\S]*?)```/g, '<pre class="sb-code">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="sb-inline">$1</code>')
    // Markdown links [text](url) → clickable anchor
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="sb-link">$1 ↗</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n•\s/g, '<br><span class="sb-li">▸</span> ')
    .replace(/\n→\s/g, '<br><span class="sb-arrow">→</span> ')
    .replace(/\n①/g, '<br>① ').replace(/\n②/g, '<br>② ').replace(/\n③/g, '<br>③ ')
    .replace(/\n④/g, '<br>④ ').replace(/\n⑤/g, '<br>⑤ ')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ════════════════════════════════════════════════════════════
//  ORB SVG
// ════════════════════════════════════════════════════════════
function orb(size=40) {
  const c = size/2, r1=c*.82, r2=c*.62, r3=c*.44;
  return `<svg class="sb-orb" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sbg${size}" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#f0abfc"/><stop offset="45%" stop-color="#a855f7"/><stop offset="100%" stop-color="#0e7490"/>
      </radialGradient>
      <filter id="sbglow${size}"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="${c}" cy="${c}" r="${r1}" fill="url(#sbg${size})" filter="url(#sbglow${size})" class="sb-orb-core"/>
    <circle cx="${c}" cy="${c}" r="${r1}" fill="none" stroke="rgba(240,171,252,.6)" stroke-width="1" class="sb-orb-r1"/>
    <ellipse cx="${c}" cy="${c}" rx="${r2}" ry="${r2*.32}" fill="none" stroke="rgba(34,211,238,.7)" stroke-width="1.2" class="sb-orb-r2"/>
    <ellipse cx="${c}" cy="${c}" rx="${r2*.32}" ry="${r2}" fill="none" stroke="rgba(251,191,36,.5)" stroke-width="1" class="sb-orb-r3"/>
    <circle cx="${c*.72}" cy="${c*.68}" r="${r3*.22}" fill="rgba(255,255,255,.8)" class="sb-orb-glint"/>
    <text x="${c}" y="${c}" text-anchor="middle" dominant-baseline="central" font-size="${size*.28}" fill="white" class="sb-orb-sym">✦</text>
  </svg>`;
}

function particles(n) {
  return Array.from({length:n},(_,i)=>{
    const x=(i/n*90+5).toFixed(1),dur=(2+Math.random()*2).toFixed(1),
          delay=(Math.random()*2).toFixed(2),size=(2+Math.random()*3).toFixed(1);
    return `<div class="sb-pt" style="left:${x}%;animation-duration:${dur}s;animation-delay:-${delay}s;width:${size}px;height:${size}px"></div>`;
  }).join('');
}

let isOpen=false, busy=false, msgCount=0;
const REACTIONS = ['👍','❤️','🔥','🎯','💡'];

// ════════════════════════════════════════════════════════════
//  BUILD
// ════════════════════════════════════════════════════════════
function build() {
  if (document.getElementById('sbw')) return;
  const w = document.createElement('div'); w.id='sbw';
  w.innerHTML = `
    <button id="sb-btn" type="button" aria-label="Open Spark Bot">
      ${orb(38)}<span class="sb-btn-ring"></span><span class="sb-btn-badge">✦</span>
    </button>
    <div id="sb-win" role="dialog" aria-label="Spark Bot" aria-hidden="true">
      <div class="sb-frame">
        <div class="sb-top">
          <div class="sb-pts">${particles(22)}</div>
          <div class="sb-scan"></div>
          <div class="sb-top-row">
            <div class="sb-top-av">${orb(44)}</div>
            <div class="sb-top-info">
              <div class="sb-top-name">Spark Bot</div>
              <div class="sb-top-stat"><span class="sb-live-dot"></span>Premium AI · Online · v5</div>
            </div>
            <button class="sb-act" id="sb-clr" type="button" title="Clear chat">🗑️</button>
            <button class="sb-cls" id="sb-cls" type="button" aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="sb-msgs" id="sb-msgs"></div>
        <div class="sb-chips" id="sb-chips"></div>
        <div class="sb-bar">
          <input id="sb-in" type="text" placeholder="Ask me anything about RGUKT Spark… 🌟" autocomplete="off" maxlength="400">
          <button id="sb-go" type="button" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(w);

  document.getElementById('sb-btn').onclick = toggle;
  document.getElementById('sb-cls').onclick = toggle;
  document.getElementById('sb-go').onclick   = send;
  document.getElementById('sb-clr').onclick  = clearChat;

  // ── Inline styles ─────────────────────────────────────
  const inp = document.getElementById('sb-in');
  Object.assign(inp.style,{
    flex:'1',background:'rgba(10,8,30,.72)',
    border:'1.5px solid rgba(139,92,246,.4)',borderRadius:'28px',
    padding:'11px 20px',fontSize:'14px',fontWeight:'600',
    fontFamily:"'Bricolage Grotesque','Atkinson Hyperlegible',system-ui,sans-serif",
    letterSpacing:'.01em',
    color:'#f0ebff',outline:'none',boxSizing:'border-box',
    boxShadow:'inset 0 1px 0 rgba(196,181,253,.08),0 2px 16px rgba(109,40,217,.18)',
    backdropFilter:'blur(12px)',
    transition:'border-color .2s,box-shadow .25s,background .2s',
  });
  inp.addEventListener('focus',()=>{
    inp.style.background='rgba(20,12,48,.82)';
    inp.style.borderColor='rgba(167,139,250,.85)';
    inp.style.boxShadow='0 0 0 3px rgba(109,40,217,.2),0 0 28px rgba(139,92,246,.18),inset 0 1px 0 rgba(196,181,253,.15)';
  });
  inp.addEventListener('blur',()=>{
    inp.style.background='rgba(10,8,30,.72)';
    inp.style.borderColor='rgba(139,92,246,.4)';
    inp.style.boxShadow='inset 0 1px 0 rgba(196,181,253,.08),0 2px 16px rgba(109,40,217,.18)';
  });
  inp.addEventListener('keydown', e => { if (e.key==='Enter') send(); });

  const go = document.getElementById('sb-go');
  Object.assign(go.style,{
    width:'42px',height:'42px',minWidth:'42px',borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:'0',
    background:'linear-gradient(135deg,#9333ea,#ec4899,#06b6d4)',
    color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
    boxShadow:'0 4px 18px rgba(147,51,234,.55),0 0 14px rgba(236,72,153,.3)',
    transition:'transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s',
  });
  go.onmouseenter=()=>{ go.style.transform='scale(1.14) translateY(-2px)';go.style.filter='brightness(1.18)'; };
  go.onmouseleave=()=>{ go.style.transform='';go.style.filter=''; };

  const bar = document.querySelector('.sb-bar');
  if (bar) Object.assign(bar.style,{
    background:'linear-gradient(180deg,rgba(15,10,40,.85) 0%,rgba(8,6,28,.92) 100%)',
    borderTop:'1px solid rgba(139,92,246,.2)',
    display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',flexShrink:'0',
    backdropFilter:'blur(16px)',
  });

  setChips(QUICK_DEFAULT);
  addMsg('bot',"🌟 **Hey! I'm Spark Bot v5** — your premium AI companion for RGUKT Spark!\n\nI can answer questions about:\n📚 Academics · 🎯 GATE prep · 🏫 Campus life · 💼 Career\n💻 Programming · 🧠 Engineering subjects · ✨ App features\n\n*Ask me anything in your own words!* 🚀", true);
}

function toggle() {
  isOpen=!isOpen;
  const win=document.getElementById('sb-win'), btn=document.getElementById('sb-btn');
  win.classList.toggle('sb-show',isOpen);
  win.setAttribute('aria-hidden',String(!isOpen));
  btn.classList.toggle('sb-open',isOpen);
  if (isOpen) setTimeout(()=>document.getElementById('sb-in')?.focus(),320);
}

function clearChat() {
  const msgs=document.getElementById('sb-msgs'); if (!msgs) return;
  msgs.innerHTML=''; msgCount=0; setChips(QUICK_DEFAULT);
  addMsg('bot',"🗑️ Chat cleared! I'm fresh and ready. What's on your mind? ✨");
}

function addMsg(role, text, instant=false) {
  const msgs=document.getElementById('sb-msgs'); if (!msgs) return;
  const d=document.createElement('div');
  d.className=`sb-msg sb-${role}`; d.style.setProperty('--n',msgCount++);
  if (role==='bot') {
    const cid=`sbc-${Date.now()}-${msgCount}`;
    d.innerHTML=`<div class="sb-av">${orb(26)}</div>
      <div class="sb-bub sb-bub-bot">
        <span class="sb-bub-shine"></span>
        <div class="sb-bub-txt" id="${cid}">${md(text)}</div>
      </div>`;
  } else {
    d.innerHTML=`<div class="sb-bub sb-bub-usr"><div class="sb-bub-txt">${esc(text)}</div></div>`;
  }
  msgs.appendChild(d);
  requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('sb-vis')));
  scroll();
}

// Thinking phrases for dots header
const THINKING = ['Thinking… 🤔','Searching… 🔍','Computing… ⚡','Fetching… 📡','Analyzing… 🧠'];
function showDots() {
  const msgs=document.getElementById('sb-msgs'); if (!msgs) return;
  const phrase=THINKING[Math.floor(Math.random()*THINKING.length)];
  const d=document.createElement('div'); d.id='sb-dots'; d.className='sb-msg sb-bot';
  d.innerHTML=`<div class="sb-av">${orb(26)}</div><div class="sb-bub sb-bub-bot"><div class="sb-think-row"><div class="sb-dots"><i></i><i></i><i></i></div><span class="sb-think-txt">${phrase}</span></div></div>`;
  msgs.appendChild(d);
  requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('sb-vis')));
  scroll();
}
function hideDots() { document.getElementById('sb-dots')?.remove(); }

function send() {
  const inp=document.getElementById('sb-in'); if (!inp||busy) return;
  const t=inp.value.trim(); if (!t) return;
  inp.value=''; addMsg('user',t); setChips([]);
  const btn=document.getElementById('sb-go');
  btn?.classList.add('sb-pop'); setTimeout(()=>btn?.classList.remove('sb-pop'),350);
  busy=true; showDots();
  const delay=650+Math.min(t.length*7,800)+Math.random()*300;
  setTimeout(()=>{ hideDots(); addMsg('bot',respond(t)); busy=false; setChips(ctxChips(t)); },delay);
}

// ════════════════════════════════════════════════════════════
//  CHIP THEMES
// ════════════════════════════════════════════════════════════
const CHIP_THEMES=[
  {bg:'linear-gradient(135deg,#6d28d9,#a21caf)',border:'#e879f9',color:'#fdf4ff',glow:'rgba(162,28,175,.55)'},
  {bg:'linear-gradient(135deg,#0369a1,#0e7490)',border:'#22d3ee',color:'#ecfeff',glow:'rgba(14,116,144,.55)'},
  {bg:'linear-gradient(135deg,#b45309,#d97706)',border:'#fbbf24',color:'#fffbeb',glow:'rgba(217,119,6,.5)'},
  {bg:'linear-gradient(135deg,#be123c,#e11d48)',border:'#fb7185',color:'#fff1f2',glow:'rgba(225,29,72,.5)'},
  {bg:'linear-gradient(135deg,#065f46,#0891b2)',border:'#34d399',color:'#ecfdf5',glow:'rgba(16,185,129,.45)'},
];
function setChips(list) {
  const bar=document.getElementById('sb-chips'); if (!bar) return;
  bar.innerHTML='';
  list.forEach((q,i)=>{
    const th=CHIP_THEMES[i%CHIP_THEMES.length];
    const b=document.createElement('button'); b.type='button'; b.textContent=q;
    Object.assign(b.style,{
      padding:'6px 14px',borderRadius:'22px',cursor:'pointer',whiteSpace:'nowrap',
      fontSize:'12px',fontWeight:'700',letterSpacing:'.2px',
      background:th.bg,border:'1.5px solid '+th.border,color:th.color,
      boxShadow:'0 3px 14px '+th.glow+',inset 0 1px 0 rgba(255,255,255,.15)',
      backdropFilter:'blur(8px)',
      transition:'transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s',
      opacity:'0',transform:'translateY(8px) scale(.88)',
    });
    b.onmouseenter=()=>{ b.style.transform='translateY(-3px) scale(1.07)';b.style.filter='brightness(1.2)'; };
    b.onmouseleave=()=>{ b.style.transform='translateY(0) scale(1)';b.style.filter=''; };
    b.onclick=()=>{ document.getElementById('sb-in').value=q.replace(/\s[^\s]+$/,'');send(); };
    bar.appendChild(b);
    setTimeout(()=>{ b.style.opacity='1';b.style.transform='translateY(0) scale(1)'; },i*70+20);
  });
}

function scroll() { const m=document.getElementById('sb-msgs'); if(m) setTimeout(()=>{m.scrollTop=m.scrollHeight;},55); }

// ════════════════════════════════════════════════════════════
//  CSS
// ════════════════════════════════════════════════════════════
function injectCSS() {
  ['sb-css93','sb-css94','sb-css95','sb-css98','sb-css99','sb-css100'].forEach(id=>document.getElementById(id)?.remove());
  if (document.getElementById('sb-css101')) return;
  const s=document.createElement('style'); s.id='sb-css101';
  s.textContent=`
/* ══════════════════════════════════════
   SPARK BOT v5 — Premium Interactive
══════════════════════════════════════ */
#sbw{position:fixed;bottom:86px;left:14px;z-index:10000;font-family:inherit;}

.sb-orb{display:block;overflow:visible;}
.sb-orb-core{animation:sb-core 3s ease-in-out infinite;}
.sb-orb-r1{transform-origin:50% 50%;animation:sb-r1 2.8s linear infinite;}
.sb-orb-r2{transform-origin:50% 50%;animation:sb-r2 2s linear infinite;}
.sb-orb-r3{transform-origin:50% 50%;animation:sb-r3 3.5s linear infinite reverse;}
.sb-orb-glint{animation:sb-glint 3s ease-in-out infinite;}
.sb-orb-sym{animation:sb-sym 4s ease-in-out infinite;}
@keyframes sb-core{0%,100%{opacity:.85}50%{opacity:1;filter:brightness(1.15)}}
@keyframes sb-r1{to{transform:rotate(360deg)}}
@keyframes sb-r2{to{transform:rotateY(360deg)}}
@keyframes sb-r3{to{transform:rotateX(360deg)}}
@keyframes sb-glint{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
@keyframes sb-sym{0%,100%{opacity:.9;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}

#sb-btn{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(145deg,#4c1d95 0%,#6d28d9 40%,#0369a1 100%);position:relative;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(196,181,253,.4),0 0 22px rgba(109,40,217,.5),0 8px 30px rgba(109,40,217,.35);transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s;}
#sb-btn:hover{transform:translateY(-3px) scale(1.1);box-shadow:0 0 0 3px rgba(196,181,253,.55),0 0 36px rgba(109,40,217,.6),0 12px 36px rgba(109,40,217,.4);}
#sb-btn.sb-open{transform:rotate(135deg) scale(.9);}
.sb-btn-ring{position:absolute;inset:-7px;border-radius:50%;border:2px solid transparent;background:linear-gradient(#fff0,#fff0) padding-box,conic-gradient(#a855f7,#22d3ee,#f472b6,#fbbf24,#a855f7) border-box;animation:sb-ring-spin 3s linear infinite;pointer-events:none;}
@keyframes sb-ring-spin{to{transform:rotate(360deg);}}
.sb-btn-badge{position:absolute;top:1px;right:1px;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#f43f5e);border:2px solid #4c1d95;font-size:7px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;animation:sb-badge 2s ease-in-out infinite;}
@keyframes sb-badge{0%,100%{transform:scale(1)}50%{transform:scale(1.3);box-shadow:0 0 10px rgba(244,63,94,.8)}}

#sb-win{position:absolute;bottom:68px;left:0;width:355px;opacity:0;pointer-events:none;transform:perspective(700px) rotateX(8deg) translateY(18px) scale(.94);transform-origin:bottom left;transition:opacity .3s cubic-bezier(.22,1,.36,1),transform .3s cubic-bezier(.22,1,.36,1);}
#sb-win.sb-show{opacity:1;pointer-events:all;transform:perspective(700px) rotateX(0) translateY(0) scale(1);}

.sb-frame{border-radius:20px;overflow:hidden;background:linear-gradient(160deg,rgba(45,12,102,.92) 0%,rgba(15,23,64,.9) 45%,rgba(4,30,60,.92) 100%);backdrop-filter:blur(36px) saturate(200%) brightness(1.15);-webkit-backdrop-filter:blur(36px) saturate(200%) brightness(1.15);border:1px solid rgba(196,181,253,.22);box-shadow:0 0 0 1px rgba(255,255,255,.06),0 2px 0 rgba(196,181,253,.12) inset,0 32px 90px rgba(45,12,102,.55),0 0 80px rgba(109,40,217,.12),inset 0 0 40px rgba(109,40,217,.06);display:flex;flex-direction:column;max-height:560px;}

.sb-top{position:relative;padding:14px 14px 12px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,rgba(109,40,217,.85) 0%,rgba(49,46,129,.75) 35%,rgba(3,105,161,.75) 100%);border-bottom:1px solid rgba(196,181,253,.18);}
.sb-scan{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(168,85,247,.8),rgba(34,211,238,.8),transparent);animation:sb-scan 3s ease-in-out infinite;}
@keyframes sb-scan{0%{top:0;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:100%;opacity:0}}
.sb-pts{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.sb-pt{position:absolute;bottom:-6px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,.9),rgba(34,211,238,.6));animation:sb-pt-rise linear infinite;}
@keyframes sb-pt-rise{0%{bottom:-6px;opacity:.8;transform:scale(1)}100%{bottom:110%;opacity:0;transform:scale(.2) translateX(20px)}}
.sb-top-row{position:relative;display:flex;align-items:center;gap:8px;z-index:1;}
.sb-top-av{width:44px;height:44px;flex-shrink:0;}
.sb-top-info{flex:1;min-width:0;}
.sb-top-name{font-size:15px;font-weight:900;background:linear-gradient(90deg,#e879f9,#67e8f9,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sb-name-shift 5s linear infinite;background-size:300% 100%;}
@keyframes sb-name-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.sb-top-stat{font-size:10.5px;color:rgba(167,139,250,.8);display:flex;align-items:center;gap:5px;margin-top:2px;}
.sb-live-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;box-shadow:0 0 6px #4ade80;animation:sb-live 2s ease-in-out infinite;}
@keyframes sb-live{0%,100%{opacity:1;box-shadow:0 0 6px #4ade80}50%{opacity:.4;box-shadow:0 0 2px #4ade80}}

.sb-act,.sb-cls{width:26px;height:26px;border-radius:50%;border:1px solid rgba(168,85,247,.3);cursor:pointer;background:rgba(168,85,247,.1);color:rgba(167,139,250,.9);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;transition:background .15s,transform .2s;}
.sb-act:hover{background:rgba(168,85,247,.28);transform:scale(1.15);}
.sb-cls:hover{background:rgba(168,85,247,.25);transform:rotate(90deg);}

.sb-msgs{flex:1;overflow-y:auto;padding:12px 11px 4px;display:flex;flex-direction:column;gap:9px;min-height:0;scrollbar-width:thin;scrollbar-color:rgba(196,181,253,.25) transparent;background:linear-gradient(180deg,rgba(30,10,70,.12) 0%,rgba(3,30,60,.08) 100%);}
.sb-msgs::-webkit-scrollbar{width:3px;}
.sb-msgs::-webkit-scrollbar-thumb{background:linear-gradient(#a855f7,#22d3ee);border-radius:3px;}

.sb-msg{display:flex;align-items:flex-end;gap:7px;opacity:0;transform:translateY(10px) scale(.97);transition:opacity .25s,transform .25s;}
.sb-msg.sb-vis{opacity:1;transform:translateY(0) scale(1);}
.sb-usr{flex-direction:row-reverse;}
.sb-av{width:26px;height:26px;flex-shrink:0;}

.sb-bub{max-width:88%;position:relative;}
.sb-bub-bot .sb-bub-txt,.sb-bub-usr .sb-bub-txt{font-size:13px;line-height:1.65;word-break:break-word;padding:9px 12px 22px;border-radius:4px 15px 15px 15px;}
.sb-bub-bot .sb-bub-txt{background:linear-gradient(135deg,rgba(67,20,130,.65) 0%,rgba(23,37,84,.75) 55%,rgba(7,55,99,.65) 100%);border:1px solid rgba(196,181,253,.22);color:rgba(226,232,240,.95);box-shadow:0 4px 20px rgba(45,12,102,.4),inset 0 1px 0 rgba(196,181,253,.1);}
.sb-bub-usr .sb-bub-txt{border-radius:15px 4px 15px 15px;background:linear-gradient(135deg,#7c3aed 0%,#a21caf 50%,#0369a1 100%);border:1px solid rgba(244,114,182,.35);color:#fff;box-shadow:0 4px 22px rgba(124,58,237,.4),0 0 12px rgba(162,28,175,.2);padding-bottom:9px;}
.sb-bub-bot .sb-bub-txt strong{color:#c4b5fd;font-weight:700;}
.sb-bub-bot .sb-bub-txt em{color:#67e8f9;font-style:normal;}
.sb-li{color:#22d3ee;margin-right:3px;font-weight:700;}
.sb-arrow{color:#f0abfc;margin-right:3px;font-weight:700;}
.sb-bub-shine{position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(196,181,253,.6),rgba(34,211,238,.5),rgba(244,114,182,.4),transparent);border-radius:4px 15px 0 0;}

/* Clickable links */
.sb-link{color:#67e8f9;text-decoration:none;border-bottom:1px solid rgba(103,232,249,.4);font-weight:600;transition:color .15s,border-color .15s;}
.sb-link:hover{color:#a5f3fc;border-color:rgba(165,243,252,.7);}


/* Code blocks */
.sb-code{background:rgba(15,10,40,.7);border:1px solid rgba(196,181,253,.2);border-radius:8px;padding:8px 10px;font-size:11.5px;font-family:'JetBrains Mono',monospace;color:#c4b5fd;overflow-x:auto;margin:4px 0;white-space:pre;}
.sb-inline{background:rgba(109,40,217,.3);border:1px solid rgba(167,139,250,.35);border-radius:4px;padding:1px 5px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#c4b5fd;}


/* Typing dots */
.sb-think-row{display:flex;align-items:center;gap:8px;padding:6px 4px;}
.sb-think-txt{font-size:11.5px;color:rgba(167,139,250,.7);font-style:italic;}
.sb-dots{display:flex;align-items:center;gap:5px;}
.sb-dots i{width:7px;height:7px;border-radius:50%;display:block;animation:sb-bounce .85s ease-in-out infinite;}
.sb-dots i:nth-child(1){background:linear-gradient(135deg,#f0abfc,#a855f7);box-shadow:0 0 8px rgba(168,85,247,.7);}
.sb-dots i:nth-child(2){background:linear-gradient(135deg,#67e8f9,#0891b2);box-shadow:0 0 8px rgba(34,211,238,.7);animation-delay:.17s;}
.sb-dots i:nth-child(3){background:linear-gradient(135deg,#fde68a,#f59e0b);box-shadow:0 0 8px rgba(251,191,36,.7);animation-delay:.34s;}
@keyframes sb-bounce{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-7px) scale(1.2)}}

/* Chips */
.sb-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 11px 4px;flex-shrink:0;}

/* Input bar */
.sb-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;flex-shrink:0;}
#sb-in{flex:1;border-radius:28px;padding:11px 20px;font-size:14px;font-weight:600;font-family:'Bricolage Grotesque','Atkinson Hyperlegible',system-ui,sans-serif;letter-spacing:.01em;outline:none;box-sizing:border-box;}
#sb-in::placeholder{color:rgba(167,139,250,.5);font-weight:400;font-style:italic;letter-spacing:.02em;}
#sb-go{width:42px;height:42px;min-width:42px;border-radius:50%;border:none;cursor:pointer;flex-shrink:0;background:linear-gradient(135deg,#9333ea 0%,#ec4899 50%,#06b6d4 100%);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(147,51,234,.5),0 0 12px rgba(236,72,153,.25);transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;position:relative;overflow:hidden;}
#sb-go:hover{transform:scale(1.15) translateY(-2px);box-shadow:0 6px 24px rgba(147,51,234,.65),0 0 20px rgba(236,72,153,.4);}
#sb-go.sb-pop::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.65) 0%,transparent 70%);animation:sb-pop .35s ease-out;pointer-events:none;}
@keyframes sb-pop{from{transform:scale(0);opacity:1}to{transform:scale(2.5);opacity:0}}

@media(max-width:420px){
  #sbw{bottom:78px;left:10px;}
  #sb-win{width:calc(100vw - 22px);max-height:500px;}
  .sb-frame{max-height:500px;}
}
`;
  document.head.appendChild(s);
}

function init() { injectCSS(); build(); }
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
