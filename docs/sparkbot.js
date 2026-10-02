// Spark Bot v2 — Advanced 3D holographic assistant for RGUKT Spark
(function () {
'use strict';

// ─── Knowledge Base ───────────────────────────────────────────────────────────
const KB = [
  { p: /^(hi|hello|hey|hlo|hii|helo|namaste|sup|yo)\b/i,
    r: ["Hey there! 👋 I'm **Spark Bot**, your guide to RGUKT Spark. What can I help you with?",
        "Hello! 😊 I'm **Spark Bot**. Ask me anything — doubts, GATE, quiz, clubs, or anything else!",
        "Hi! 🌟 Welcome to RGUKT Spark. I'm Spark Bot — your AI assistant here. What do you want to know?"] },
  { p: /what (is|are|about|this)|about (this|app|site|rgukt spark|spark)|explain (this|app|site)/i,
    r: ["**RGUKT Spark** is a student community platform built for RGUKT students!\n\n📌 **Doubts** — ask anything, get peer answers\n💡 **Ideas** — share innovations\n🏛 **Clubs** — discover campus clubs\n🎮 **Challenges** — compete with friends\n🛒 **Market** — buy/sell on campus\n🎯 **GATE** — PYQ papers, free resources, daily quiz\n🏆 **Leaderboard** — top helpers\n\nAll free. No login required!"] },
  { p: /doubt|question|ask|post|how to (ask|post|add)/i,
    r: ["To **post a doubt**:\n\n1. Tap **Ask a doubt** button (top right) or the **+ FAB** button\n2. Write your question\n3. Pick subject, year, campus\n4. Hit **Post** ✅\n\nOther students will reply and you can mark the best answer! 💬"] },
  { p: /repl(y|ies)|answer|respond|comment/i,
    r: ["To **reply to a post**:\n\n1. Tap any post card to open it\n2. Scroll to the bottom\n3. Type your reply and tap **Send** 🚀\n\nYou earn points for every helpful reply — climb the leaderboard! 🏆"] },
  { p: /idea(s)?|suggest|suggestion|innovation|improve/i,
    r: ["The **Ideas** tab is where students share creative suggestions!\n\nSwitch to the **Ideas** tab at the top, then tap **Post an idea**. Others can like ❤️ and comment. Best ideas get featured! 🌟"] },
  { p: /club(s)?|society|group|join/i,
    r: ["The **Clubs** tab lists all campus clubs — Technical, Cultural, Sports and more.\n\nTap **🏛 Clubs** in the tab bar to:\n• See active clubs and their posts\n• Post club announcements\n• Discover upcoming events\n\nFilter by your department to see relevant clubs!"] },
  { p: /challeng(e|es)|compet(e|ition)|game|contest/i,
    r: ["**🎮 Challenges** is where academic & fun competitions are posted!\n\nTap **Challenges** tab to see active contests. Post a challenge or participate in ones by others. Winners get featured on the leaderboard! 🥇"] },
  { p: /market|buy|sell|item|product|second.?hand|shop/i,
    r: ["The **🛒 Market** is a campus buy/sell board:\n\n• **Browse** items others are selling\n• **List your item** — tap + button, add photo, price, description\n• Filter by **Newest / Price** using sort button\n• Contact sellers directly via the post\n\nAll transactions between students — Spark is just the board!"] },
  { p: /gate( tab| section| prep)?|previous year|pyq|paper(s)?/i,
    r: ["The **🎯 GATE** tab is packed with free resources:\n\n📂 **PYQ Papers** (2016–2025) per branch\n📊 **Year filter** — tap any year card\n🎥 **Free YouTube lectures** — IIT/NPTEL\n🏛 **IIT & NIT free courses**\n📚 **Practice platforms** — GFG, Testbook\n\nTap a branch button to expand its solved papers!"] },
  { p: /branch|ece|cse|eee|civil|mech(anical)?/i,
    r: ["In GATE tab, scroll to **\"📂 Previous Year Papers by Branch\"** and tap your branch:\n\n📡 **ECE** — Electronics & Communication\n💻 **CSE** — Computer Science\n⚡ **EEE** — Electrical Engineering\n🏗️ **Civil** — Civil Engineering\n⚙️ **Mech** — Mechanical Engineering\n\nEach shows 2016–2025 papers with **✅ Solutions** & **📄 Official** links. All free!"] },
  { p: /quiz|daily quiz|question of the day/i,
    r: ["The **🧠 Daily Quiz** refreshes every day!\n\n• Tap **🧠 Daily Quiz** in the header\n• Read the question carefully\n• Select your answer — one attempt only\n• See correct answer + explanation after\n• **Every student gets a different question** — uniquely assigned by device!\n\nPractice GATE-level questions, GK & current affairs daily! 📅"] },
  { p: /leader(board)?|top helper|rank|points|score/i,
    r: ["The **🏆 Top Helpers** leaderboard shows most helpful students!\n\nHow to rank higher:\n• Post quality answers to doubts\n• Get your replies liked\n• Post ideas that get engagement\n• Participate in challenges\n\nTap **🏆 Top Helpers** in the header to see current rankings. Set your name to appear!"] },
  { p: /name|profile|avatar|set name|my name|username/i,
    r: ["To **set your name & avatar**:\n\n1. Tap **Set your name** in the header\n2. Type your name\n3. Choose a DiceBear avatar style\n4. Tap Save\n\nYour name appears on all posts and replies. Your device identifies you — no login needed! 🔐"] },
  { p: /anonymous|anon|hide name|private post/i,
    r: ["Yes! You can post **anonymously** on RGUKT Spark.\n\nWhen writing a post, toggle the **Anonymous** switch. Your name won't be shown — just \"Anonymous Student\".\n\nYour device still prevents duplicate votes, but identity stays hidden from others. 🤫"] },
  { p: /search|find|look for/i,
    r: ["To **search posts**:\n\n• Tap the **Search bar** at the top of the post list\n• Or press **/** on keyboard to focus instantly\n• Type any keyword — subject, topic, year\n\nResults filter in real-time across all posts! 🔍"] },
  { p: /filter|sort|year filter|e1|e2|e3|e4|subject/i,
    r: ["**Filtering posts:**\n\n• Use the **subject rail** (left) to pick a subject\n• Use the **dropdown** to filter solved/unsolved/recent\n• Tap **year chips** (E1/E2/E3/E4) in the header\n• In GATE tab, tap a **year card** for that year's PYQs\n\nFilters combine — e.g., ECE + E2 + specific subject together!"] },
  { p: /dark( mode)?|light( mode)?|theme|night mode/i,
    r: ["Toggle **dark/light mode** with the **🌙 button** in the top-right header.\n\nThe app remembers your preference. Dark mode is perfect for late-night GATE prep! 🌃"] },
  { p: /offline|no internet|cache|pwa|install|app/i,
    r: ["**RGUKT Spark works offline!** 📵\n\nIt's a **Progressive Web App (PWA)**:\n• Tap **📲 Add to home screen** or the install banner\n• Loads from cache even without internet\n• Orange bar shows when offline\n• Posts sync automatically when connection returns\n\nInstall it for a native app feel — no Play Store needed!"] },
  { p: /campus|nuzvid|ongole|basar|idupulapaya|srikakulam/i,
    r: ["You can filter posts by **campus**!\n\nTap the **campus chips** below the header (Nuzvid, Ongole, Basar, etc.) to see only posts from that campus.\n\nWhen posting, select your campus so the right students see your doubt. 🏫"] },
  { p: /like|upvote|vote|heart/i,
    r: ["To **like a post or reply**:\n\n• Tap the **❤️ heart icon** on any post\n• Each device can like once per post\n• Likes boost rankings and help the author score points\n\nIf someone helped you, like their answer! 💛"] },
  { p: /delet|edit|remov|modif(y|ied)/i,
    r: ["To **delete or edit your post**:\n\n• Open the post\n• Tap the **⋯ menu** (three dots)\n• Choose **Delete** or **Edit**\n\n⚠️ Only you can edit/delete your own posts. Deleted posts are hidden but not erased — admins can restore from Firebase."] },
  { p: /nptel|free course|iit course|lecture|video/i,
    r: ["Free IIT courses are in the **GATE tab**!\n\nScroll to **\"🎥 Free YouTube Lectures\"** and **\"🏛 Top IITs & NITs\"**:\n• NPTEL from IIT Bombay, IIT Madras, IIT Delhi\n• Unacademy GATE channel\n• MIT OpenCourseWare\n• Khan Academy\n\nAll 100% free — no subscription needed!"] },
  { p: /who are you|what are you|spark bot|about you|your name/i,
    r: ["I'm **Spark Bot** 🤖 — the built-in AI assistant for RGUKT Spark!\n\nI know everything about this app:\n• Every feature and how to use it\n• GATE resources and PYQ papers\n• Daily quiz and leaderboard\n• Posting, replying, filtering\n• PWA installation tips\n\nJust ask me anything in plain English! ✨"] },
  { p: /tip(s)?|how to (prepare|study|crack)|gate strategy|study plan/i,
    r: ["**GATE Prep Tips using Spark:**\n\n1. 📅 Do the **Daily Quiz** every day — builds consistency\n2. 📂 Solve **PYQ papers** branch-wise from 2016 onward\n3. 🎥 Watch **free NPTEL/IIT lectures** (GATE tab)\n4. ❓ Post doubts **immediately** — don't let them pile up\n5. 🏆 Answer others' doubts — teaching = learning\n6. 📚 Use **GATE Overflow** for CSE PYQ discussions\n\nConsistency beats intensity. 20 mins daily > 5 hours once a week! 💪"] },
  { p: /thank(s|you)|bye|goodbye|ok thanks|great|awesome|nice|cool/i,
    r: ["You're welcome! 😊 Keep sparking those doubts! 🔥",
        "Anytime! Good luck with your studies! 💪 Come back if you need anything.",
        "Happy to help! 🌟 All the best for GATE prep! 🎯"] },
  { p: /help|what can you do|what do you know|guide/i,
    r: ["Here's what I can help you with:\n\n📌 Posting doubts & ideas\n💬 Replies & likes\n🎯 GATE papers & resources\n🧠 Daily quiz\n🏆 Leaderboard & scoring\n🛒 Market & clubs\n🌙 Theme, search, filters\n📲 Installing the app\n\nJust ask naturally — I'll do my best! 🤖✨"] },
];

const FALLBACK = [
  "Hmm, I'm not sure about that yet. 🤔 Try asking about **GATE papers**, **daily quiz**, **posting doubts**, or **clubs**!",
  "I don't have that answer! 😅 Try: \"How do I post a doubt?\" or \"What is the GATE tab?\"",
  "Tricky one! 🧐 I know about posting, GATE prep, quiz, clubs, leaderboard, and all app features. Ask about those!",
];

const QUICK_DEFAULT = ["What is RGUKT Spark?","How do I post a doubt?","Show GATE papers","Tell me about Daily Quiz"];

// ─── State ────────────────────────────────────────────────────────────────────
let open = false, busy = false;

function respond(text) {
  for (const e of KB) if (e.p.test(text.trim())) {
    const a = e.r; return a[Math.floor(Math.random() * a.length)];
  }
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

function md(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n•/g,'<br><span class="sb-bullet">•</span>')
    .replace(/\n\n/g,'<br><br>')
    .replace(/\n/g,'<br>');
}
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ─── 3D Orb / Particles ───────────────────────────────────────────────────────
function buildOrb(id) {
  return `<div class="sb-orb" id="${id}">
    <div class="sb-orb-ring sb-orb-r1"></div>
    <div class="sb-orb-ring sb-orb-r2"></div>
    <div class="sb-orb-ring sb-orb-r3"></div>
    <div class="sb-orb-core">✦</div>
  </div>`;
}

function buildParticles(n) {
  return Array.from({length:n},(_,i)=>`<span class="sb-pt" style="--i:${i};--dx:${(Math.random()*2-1).toFixed(2)};--dy:${(-(Math.random()*.8+.4)).toFixed(2)};--s:${(Math.random()*.5+.3).toFixed(2)}"></span>`).join('');
}

// ─── Build UI ─────────────────────────────────────────────────────────────────
function build() {
  if (document.getElementById('sb-root')) return;
  const root = document.createElement('div');
  root.id = 'sb-root';
  root.innerHTML = `
    <!-- FAB -->
    <button id="sb-fab" type="button" aria-label="Open Spark Bot">
      ${buildOrb('sb-fab-orb')}
      <span class="sb-fab-ping"></span>
      <span class="sb-fab-label">Spark Bot</span>
    </button>

    <!-- Panel -->
    <div id="sb-panel" role="dialog" aria-modal="true" aria-label="Spark Bot" aria-hidden="true">
      <!-- 3D perspective wrapper -->
      <div class="sb-panel-3d">

        <!-- Header -->
        <div class="sb-hdr">
          <div class="sb-hdr-particles">${buildParticles(18)}</div>
          <div class="sb-hdr-grid"></div>
          <div class="sb-hdr-content">
            ${buildOrb('sb-hdr-orb')}
            <div class="sb-hdr-info">
              <span class="sb-hdr-name">Spark Bot</span>
              <span class="sb-hdr-sub"><span class="sb-online-dot"></span>AI Assistant · Always active</span>
            </div>
          </div>
          <button class="sb-x" id="sb-x" type="button" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="sb-body" id="sb-body"></div>

        <!-- Quick chips -->
        <div class="sb-quick" id="sb-quick"></div>

        <!-- Footer -->
        <div class="sb-foot">
          <div class="sb-input-wrap">
            <input id="sb-inp" type="text" placeholder="Ask me anything…" autocomplete="off" maxlength="200">
            <div class="sb-inp-glow"></div>
          </div>
          <button class="sb-send" id="sb-send" type="button" aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(root);

  document.getElementById('sb-fab').onclick = toggle;
  document.getElementById('sb-x').onclick = toggle;
  document.getElementById('sb-send').onclick = send;
  document.getElementById('sb-inp').addEventListener('keydown', e => { if (e.key==='Enter') send(); });

  setQuick(QUICK_DEFAULT);
  welcome();
}

function toggle() {
  open = !open;
  const panel = document.getElementById('sb-panel');
  const fab   = document.getElementById('sb-fab');
  if (open) {
    panel.classList.add('sb-open');
    panel.setAttribute('aria-hidden','false');
    fab.classList.add('sb-fab-open');
    document.querySelector('.sb-fab-ping')?.remove();
    setTimeout(()=>document.getElementById('sb-inp')?.focus(), 350);
  } else {
    panel.classList.remove('sb-open');
    panel.setAttribute('aria-hidden','true');
    fab.classList.remove('sb-fab-open');
  }
}

function welcome() {
  pushMsg('bot',"👋 Hi! I'm **Spark Bot** — your 3D AI guide to RGUKT Spark.\n\nAsk me about **doubts**, **GATE papers**, **daily quiz**, **clubs**, **market**, or anything about this app! ✨",true);
}

let msgIdx = 0;
function pushMsg(role, text, instant=false) {
  const body = document.getElementById('sb-body');
  if (!body) return;
  const idx = msgIdx++;
  const div = document.createElement('div');
  div.className = 'sb-msg sb-' + role;
  div.style.setProperty('--idx', idx % 10);

  if (role === 'bot') {
    div.innerHTML = `
      <div class="sb-av-sm">${buildOrb('sb-av-'+idx)}</div>
      <div class="sb-bubble sb-bubble-bot">
        <div class="sb-bubble-inner"><div class="sb-bubble-shine"></div><p>${md(text)}</p></div>
      </div>`;
  } else {
    div.innerHTML = `<div class="sb-bubble sb-bubble-usr"><div class="sb-bubble-inner">${esc(text)}</div></div>`;
  }

  body.appendChild(div);
  requestAnimationFrame(() => { requestAnimationFrame(() => div.classList.add('sb-in')); });
  scrollEnd();
}

function showTyping() {
  const body = document.getElementById('sb-body');
  if (!body) return;
  const d = document.createElement('div');
  d.id = 'sb-typing'; d.className = 'sb-msg sb-bot';
  d.innerHTML = `
    <div class="sb-av-sm">${buildOrb('sb-av-typing')}</div>
    <div class="sb-bubble sb-bubble-bot">
      <div class="sb-bubble-inner sb-typing-bubble">
        <div class="sb-bubble-shine"></div>
        <span class="sb-dot-1"></span><span class="sb-dot-2"></span><span class="sb-dot-3"></span>
      </div>
    </div>`;
  body.appendChild(d);
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>d.classList.add('sb-in')); });
  scrollEnd();
}
function hideTyping() { document.getElementById('sb-typing')?.remove(); }

function send() {
  const inp = document.getElementById('sb-inp');
  if (!inp || busy) return;
  const txt = inp.value.trim(); if (!txt) return;
  inp.value = '';
  pushMsg('user', txt);
  setQuick([]);
  // ripple on send button
  document.getElementById('sb-send')?.classList.add('sb-fire');
  setTimeout(()=>document.getElementById('sb-send')?.classList.remove('sb-fire'),400);

  busy = true; showTyping();
  setTimeout(() => {
    hideTyping();
    const r = respond(txt);
    pushMsg('bot', r);
    busy = false;
    setQuick(contextQuick(txt));
  }, 800 + Math.random()*500);
}

function quickSend(t) {
  const inp = document.getElementById('sb-inp');
  if (inp) inp.value = t;
  send();
}

function setQuick(items) {
  const bar = document.getElementById('sb-quick'); if (!bar) return;
  bar.innerHTML = '';
  items.forEach((q,i) => {
    const b = document.createElement('button');
    b.className='sb-chip'; b.type='button'; b.textContent=q;
    b.style.setProperty('--ci',i);
    b.onclick=()=>quickSend(q);
    bar.appendChild(b);
  });
}

function contextQuick(t) {
  t = t.toLowerCase();
  if (/gate|pyq|paper/.test(t)) return ["ECE branch papers","GATE study tips","Free IIT lectures"];
  if (/doubt|ask|post/.test(t)) return ["How to reply?","Anonymous post?","How likes work?"];
  if (/quiz/.test(t)) return ["How does leaderboard work?","GATE tab features","Install the app"];
  if (/club/.test(t)) return ["What is Market tab?","What are Challenges?","How to install app?"];
  return QUICK_DEFAULT.slice(0,3);
}

function scrollEnd() {
  const b = document.getElementById('sb-body');
  if (b) setTimeout(()=>{ b.scrollTop = b.scrollHeight; }, 60);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
function css() {
  if (document.getElementById('sb-style')) return;
  const s = document.createElement('style'); s.id='sb-style';
  s.textContent = `
/* ════════════════════════════════════════════
   SPARK BOT — 3D Holographic UI
════════════════════════════════════════════ */
#sb-root { position:fixed; bottom:88px; left:16px; z-index:10000; }

/* ── 3D ORB ─────────────────────────────── */
.sb-orb {
  position:relative; width:40px; height:40px; flex-shrink:0;
  transform-style:preserve-3d; animation:sb-orb-spin 8s linear infinite;
}
.sb-orb-ring {
  position:absolute; inset:0; border-radius:50%;
  border:1.5px solid transparent; animation:sb-ring-rot 3s linear infinite;
}
.sb-orb-r1 { border-top-color:rgba(167,139,250,.9); border-bottom-color:rgba(167,139,250,.3); animation-duration:2.2s; }
.sb-orb-r2 { border-left-color:rgba(6,182,212,.9); border-right-color:rgba(6,182,212,.3); animation-duration:3.1s; animation-direction:reverse; transform:rotateY(60deg); }
.sb-orb-r3 { border-top-color:rgba(251,146,60,.7); border-bottom-color:rgba(251,146,60,.1); animation-duration:4s; transform:rotateX(60deg); }
.sb-orb-core {
  position:absolute; inset:6px; border-radius:50%;
  background:radial-gradient(circle at 35% 35%, rgba(167,139,250,.95), rgba(6,182,212,.7));
  display:flex; align-items:center; justify-content:center;
  font-size:13px; color:#fff;
  box-shadow:0 0 12px rgba(167,139,250,.6), inset 0 0 8px rgba(255,255,255,.2);
  animation:sb-core-pulse 2.5s ease-in-out infinite;
}
@keyframes sb-orb-spin  { to { transform:rotateY(360deg); } }
@keyframes sb-ring-rot  { to { transform:rotate(360deg); } }
@keyframes sb-core-pulse{ 0%,100%{box-shadow:0 0 12px rgba(167,139,250,.6),inset 0 0 8px rgba(255,255,255,.2)} 50%{box-shadow:0 0 22px rgba(167,139,250,.9),inset 0 0 12px rgba(255,255,255,.35)} }

/* ── FAB ────────────────────────────────── */
#sb-fab {
  width:58px; height:58px; border-radius:50%; border:none; cursor:pointer;
  background:radial-gradient(circle at 40% 35%, #a78bfa 0%, #7c3aed 45%, #0891b2 100%);
  box-shadow:0 0 0 0 rgba(124,58,237,.5), 0 6px 24px rgba(124,58,237,.45);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
  position:relative; overflow:visible;
  animation:sb-fab-aura 3s ease-in-out infinite;
  transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
}
#sb-fab:hover { transform:scale(1.12) translateY(-2px); box-shadow:0 0 0 6px rgba(124,58,237,.15), 0 10px 32px rgba(124,58,237,.5); }
#sb-fab.sb-fab-open { transform:scale(.9) rotateZ(180deg); }
#sb-fab .sb-orb { width:32px; height:32px; }
#sb-fab .sb-orb-core { font-size:11px; }
.sb-fab-ping {
  position:absolute; top:2px; right:2px; width:14px; height:14px;
  border-radius:50%; background:#f59e0b; border:2.5px solid var(--bg,#0f0f1a);
}
.sb-fab-ping::after {
  content:''; position:absolute; inset:-3px; border-radius:50%;
  border:2px solid #f59e0b; animation:sb-ping 1.8s ease-out infinite;
}
@keyframes sb-ping { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
.sb-fab-label {
  font-size:8.5px; font-weight:800; color:rgba(255,255,255,.85); letter-spacing:.5px; line-height:1;
}
@keyframes sb-fab-aura { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.45),0 6px 24px rgba(124,58,237,.4)} 50%{box-shadow:0 0 0 8px rgba(124,58,237,.08),0 8px 28px rgba(124,58,237,.5)} }

/* ── PANEL ──────────────────────────────── */
#sb-panel {
  position:absolute; bottom:70px; left:0;
  width:340px; max-height:540px;
  opacity:0; pointer-events:none;
  transform:perspective(800px) rotateX(6deg) translateY(20px) scale(.96);
  transform-origin:bottom left;
  transition:opacity .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);
}
#sb-panel.sb-open { opacity:1; pointer-events:all; transform:perspective(800px) rotateX(0deg) translateY(0) scale(1); }

.sb-panel-3d {
  width:100%; height:100%; border-radius:22px; overflow:hidden;
  background:rgba(15,15,30,.88);
  backdrop-filter:blur(28px) saturate(160%);
  -webkit-backdrop-filter:blur(28px) saturate(160%);
  border:1px solid rgba(167,139,250,.25);
  box-shadow:
    0 32px 80px rgba(0,0,0,.6),
    0 0 0 1px rgba(255,255,255,.04),
    inset 0 1px 0 rgba(255,255,255,.08);
  display:flex; flex-direction:column; max-height:540px;
}

/* ── HEADER ─────────────────────────────── */
.sb-hdr {
  position:relative; padding:14px 14px 12px; overflow:hidden; flex-shrink:0;
  background:linear-gradient(135deg,rgba(124,58,237,.8) 0%,rgba(8,145,178,.7) 100%);
  border-bottom:1px solid rgba(167,139,250,.2);
}
.sb-hdr-grid {
  position:absolute; inset:0; opacity:.12;
  background-image:linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px);
  background-size:24px 24px;
  animation:sb-grid-move 8s linear infinite;
}
@keyframes sb-grid-move { to { background-position:24px 24px; } }

.sb-hdr-particles { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
.sb-pt {
  position:absolute; bottom:0; left:calc(var(--i,0) * 5.88%);
  width:3px; height:3px; border-radius:50%;
  background:rgba(255,255,255,.7);
  animation:sb-rise calc(2s + var(--i,0) * .13s) ease-in infinite;
  animation-delay:calc(var(--i,0) * .18s);
}
@keyframes sb-rise {
  0%   { transform:translate(0,0) scale(1); opacity:.8; }
  100% { transform:translate(calc(var(--dx,0) * 40px), calc(var(--dy,-.8) * 80px)) scale(var(--s,.5)); opacity:0; }
}

.sb-hdr-content { position:relative; display:flex; align-items:center; gap:12px; z-index:1; }
.sb-hdr .sb-orb { width:46px; height:46px; }
.sb-hdr .sb-orb-core { font-size:16px; }
.sb-hdr-info { display:flex; flex-direction:column; gap:3px; }
.sb-hdr-name { font-size:16px; font-weight:900; color:#fff; letter-spacing:.3px; text-shadow:0 2px 8px rgba(0,0,0,.3); }
.sb-hdr-sub  { font-size:11px; color:rgba(255,255,255,.78); display:flex; align-items:center; gap:5px; }
.sb-online-dot { width:7px; height:7px; border-radius:50%; background:#4ade80; flex-shrink:0;
  box-shadow:0 0 6px #4ade80; animation:sb-dot-pulse 2s ease-in-out infinite; }
@keyframes sb-dot-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

.sb-x {
  position:absolute; top:10px; right:10px; z-index:2;
  width:28px; height:28px; border-radius:50%; border:none; cursor:pointer;
  background:rgba(255,255,255,.15); color:#fff;
  display:flex; align-items:center; justify-content:center;
  transition:background .15s, transform .15s;
  backdrop-filter:blur(4px);
}
.sb-x:hover { background:rgba(255,255,255,.28); transform:rotate(90deg); }

/* ── BODY ───────────────────────────────── */
.sb-body {
  flex:1; overflow-y:auto; padding:14px 12px 6px;
  display:flex; flex-direction:column; gap:10px;
  scrollbar-width:thin; scrollbar-color:rgba(167,139,250,.25) transparent;
  min-height:0;
}
.sb-body::-webkit-scrollbar { width:3px; }
.sb-body::-webkit-scrollbar-thumb { background:rgba(167,139,250,.3); border-radius:3px; }

/* ── MESSAGES ───────────────────────────── */
.sb-msg {
  display:flex; align-items:flex-end; gap:8px;
  opacity:0; transition:opacity .28s, transform .28s;
}
.sb-bot { transform:perspective(400px) rotateY(-8deg) translateX(-12px); }
.sb-usr { flex-direction:row-reverse; transform:perspective(400px) rotateY(8deg) translateX(12px); }
.sb-msg.sb-in { opacity:1; transform:perspective(400px) rotateY(0) translateX(0) !important; }

.sb-av-sm { width:28px; height:28px; flex-shrink:0; }
.sb-av-sm .sb-orb { width:28px; height:28px; animation-duration:10s; }
.sb-av-sm .sb-orb-core { font-size:9px; inset:4px; }

.sb-bubble { max-width:82%; }
.sb-bubble-inner {
  position:relative; overflow:hidden;
  border-radius:4px 16px 16px 16px; padding:10px 13px;
  background:rgba(30,30,60,.9);
  border:1px solid rgba(167,139,250,.18);
  box-shadow:0 4px 20px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06);
}
.sb-bubble-usr .sb-bubble-inner {
  border-radius:16px 4px 16px 16px;
  background:linear-gradient(135deg,rgba(124,58,237,.85),rgba(8,145,178,.85));
  border-color:rgba(167,139,250,.3);
}
.sb-bubble-shine {
  position:absolute; top:-50%; left:-50%; width:200%; height:200%;
  background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.05) 50%,transparent 65%);
  animation:sb-shine 5s ease-in-out infinite;
}
@keyframes sb-shine { 0%,100%{transform:translateX(-100%) rotate(-5deg)} 60%{transform:translateX(100%) rotate(-5deg)} }
.sb-bubble-inner p {
  font-size:13px; line-height:1.65; color:rgba(226,232,240,.95);
  margin:0; word-break:break-word;
}
.sb-bubble-usr .sb-bubble-inner p { color:#fff; }
.sb-bubble-inner strong { color:#c4b5fd; font-weight:700; }
.sb-bullet { margin-left:4px; }

/* ── TYPING ─────────────────────────────── */
.sb-typing-bubble { display:flex !important; align-items:center; gap:5px; padding:12px 16px !important; min-width:60px; }
.sb-dot-1,.sb-dot-2,.sb-dot-3 {
  width:7px; height:7px; border-radius:50%;
  background:linear-gradient(135deg,#a78bfa,#06b6d4);
  animation:sb-bounce .9s ease-in-out infinite;
  box-shadow:0 0 6px rgba(167,139,250,.5);
}
.sb-dot-2 { animation-delay:.18s; }
.sb-dot-3 { animation-delay:.36s; }
@keyframes sb-bounce { 0%,100%{transform:translateY(0) scale(1)} 45%{transform:translateY(-6px) scale(1.1)} }

/* ── QUICK CHIPS ────────────────────────── */
.sb-quick {
  display:flex; flex-wrap:wrap; gap:5px; padding:6px 12px 4px; flex-shrink:0;
  min-height:0;
}
.sb-chip {
  padding:5px 11px; border-radius:20px; border:1px solid rgba(167,139,250,.3);
  background:rgba(30,20,60,.7); color:rgba(196,181,253,.9);
  font-size:11.5px; cursor:pointer; white-space:nowrap;
  backdrop-filter:blur(6px);
  transform:perspective(200px) translateZ(0) scale(1);
  transition:all .2s cubic-bezier(.34,1.56,.64,1);
  animation:sb-chip-in .3s cubic-bezier(.34,1.56,.64,1) both;
  animation-delay:calc(var(--ci,0) * .06s);
}
@keyframes sb-chip-in { from{opacity:0;transform:perspective(200px) translateZ(-20px) scale(.8)} to{opacity:1;transform:perspective(200px) translateZ(0) scale(1)} }
.sb-chip:hover {
  background:rgba(124,58,237,.4); border-color:rgba(167,139,250,.6);
  color:#e9d5ff; transform:perspective(200px) translateZ(8px) scale(1.05);
  box-shadow:0 4px 16px rgba(124,58,237,.3);
}
.sb-chip:active { transform:perspective(200px) translateZ(2px) scale(.97); }

/* ── FOOTER ─────────────────────────────── */
.sb-foot {
  display:flex; align-items:center; gap:8px; padding:10px 12px;
  border-top:1px solid rgba(167,139,250,.12); flex-shrink:0;
  background:rgba(10,10,25,.5);
}
.sb-input-wrap { flex:1; position:relative; }
#sb-inp {
  width:100%; background:rgba(30,25,60,.8);
  border:1.5px solid rgba(167,139,250,.2);
  border-radius:22px; padding:9px 14px;
  font-size:13px; color:#e2e8f0; outline:none;
  transition:border-color .2s, box-shadow .2s;
  backdrop-filter:blur(8px);
  box-sizing:border-box;
}
#sb-inp:focus { border-color:rgba(167,139,250,.6); box-shadow:0 0 0 3px rgba(124,58,237,.15), 0 0 16px rgba(124,58,237,.1); }
#sb-inp::placeholder { color:rgba(148,163,184,.5); }
.sb-inp-glow {
  position:absolute; inset:-1px; border-radius:23px; pointer-events:none;
  background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(6,182,212,.1));
  opacity:0; transition:opacity .2s;
}
#sb-inp:focus ~ .sb-inp-glow { opacity:1; }

.sb-send {
  width:38px; height:38px; border-radius:50%; border:none; cursor:pointer; flex-shrink:0;
  background:linear-gradient(135deg,#7c3aed 0%,#0891b2 100%);
  color:#fff; display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 14px rgba(124,58,237,.4);
  transform:perspective(100px) translateZ(0);
  transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
  position:relative; overflow:hidden;
}
.sb-send:hover { transform:perspective(100px) translateZ(6px) scale(1.1); box-shadow:0 6px 20px rgba(124,58,237,.55); }
.sb-send.sb-fire::after {
  content:''; position:absolute; inset:0; border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.5) 0%,transparent 70%);
  animation:sb-ripple .4s ease-out;
}
@keyframes sb-ripple { from{transform:scale(0);opacity:1} to{transform:scale(2.5);opacity:0} }

/* ── SCROLLBAR DARK ─────────────────────── */
.sb-body::-webkit-scrollbar-track { background:transparent; }

/* ── MOBILE ─────────────────────────────── */
@media (max-width:420px) {
  #sb-root { bottom:80px; left:10px; }
  #sb-panel { width:calc(100vw - 22px); max-height:480px; }
}
@media (max-width:360px) {
  #sb-panel { width:calc(100vw - 18px); }
}
  `;
  document.head.appendChild(s);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() { css(); build(); }
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
