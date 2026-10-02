// Spark Bot — Advanced AI-style assistant for RGUKT Spark
// All responses are local (no external API needed)

(function() {
'use strict';

// ─── Knowledge Base ───────────────────────────────────────────────────────────
const KB = [
  // Greetings
  { p: /^(hi|hello|hey|hlo|hii|helo|namaste|sup|yo)\b/i,
    r: ["Hey there! 👋 I'm **Spark Bot**, your guide to RGUKT Spark. What can I help you with?",
        "Hello! 😊 I'm **Spark Bot**. Ask me anything about this app — doubts, GATE, quiz, clubs, or anything else!",
        "Hi! 🌟 Welcome to RGUKT Spark. I'm Spark Bot — your personal assistant here. What do you want to know?"] },

  // What is this app / about
  { p: /what (is|are|about|this)|about (this|app|site|rgukt spark|spark)|explain (this|app|site)/i,
    r: ["**RGUKT Spark** is a student community platform built for RGUKT students. Here's what you can do:\n\n📌 **Post Doubts** — ask anything, get answers from peers\n💡 **Share Ideas** — propose improvements, innovations\n🏛 **Clubs** — discover & join campus clubs\n🎮 **Challenges** — compete with friends\n🛒 **Market** — buy/sell items on campus\n🎯 **GATE** — PYQ papers, resources, daily quiz\n🏆 **Leaderboard** — top helpers on campus\n\nAll free. No login required!"] },

  // Doubts tab
  { p: /doubt|question|ask|post|how to (ask|post|add)/i,
    r: ["To **post a doubt**:\n\n1. Tap **Ask a doubt** button (top right) or the **+ FAB** button\n2. Write your question\n3. Pick subject, year, campus\n4. Hit **Post** ✅\n\nOther students will reply and you can mark the best answer! 💬"] },

  // Reply / answer
  { p: /repl(y|ies)|answer|respond|comment/i,
    r: ["To **reply to a post**:\n\n1. Tap any post card to open it\n2. Scroll to the bottom\n3. Type your reply and tap **Send** 🚀\n\nYou earn points for every helpful reply — climb the leaderboard! 🏆"] },

  // Ideas tab
  { p: /idea(s)?|suggest|suggestion|innovation|improve/i,
    r: ["The **Ideas** tab is where students share creative suggestions — new features, improvements, projects.\n\nSwitch to the **Ideas** tab at the top, then tap **Post an idea**. Others can like ❤️ and comment on your idea!"] },

  // Clubs
  { p: /club(s)?|society|group|join/i,
    r: ["The **Clubs** tab lists all campus clubs — Technical, Cultural, Sports and more.\n\nTap **🏛 Clubs** in the tab bar. You can:\n• See active clubs and their posts\n• Post club announcements\n• Discover upcoming events\n\nFilter by your department to see relevant clubs!"] },

  // Challenges
  { p: /challeng(e|es)|compet(e|ition)|game|contest/i,
    r: ["**🎮 Challenges** is where academic & fun competitions are posted.\n\nTap **Challenges** tab to see active contests. Post a challenge to the community or participate in ones posted by others. Winners get featured on the leaderboard!"] },

  // Market
  { p: /market|buy|sell|item|product|second.?hand|shop/i,
    r: ["The **🛒 Market** tab is a campus buy/sell board:\n\n• **Browse** items others are selling\n• **List your item** — tap the + button, add photo, price, description\n• Filter by **Newest / Price** using the sort button\n• Contact the seller directly via the post\n\nAll transactions are between students — Spark is just the board!"] },

  // GATE tab
  { p: /gate( tab| section| prep)?|previous year|pyq|paper(s)?/i,
    r: ["The **🎯 GATE** tab is packed with free resources:\n\n📂 **Previous Year Papers** (2016–2025) per branch — ECE, CSE, EEE, Civil, Mech\n📊 **Year filter** — tap any year card to filter PYQ posts\n🎥 **Free YouTube lectures** — IIT/NPTEL channels\n🏛 **IIT & NIT courses** — 100% free\n📚 **Practice platforms** — GFG, Testbook, GATE Overflow\n\nTap a branch button to expand its solved papers!"] },

  // PYQ papers per branch
  { p: /branch|ece|cse|eee|civil|mech(anical)?/i,
    r: ["In the GATE tab, scroll to **\"📂 Previous Year Papers by Branch\"** and tap your branch:\n\n📡 **ECE** — Electronics & Communication\n💻 **CSE** — Computer Science\n⚡ **EEE** — Electrical Engineering\n🏗️ **Civil** — Civil Engineering\n⚙️ **Mech** — Mechanical Engineering\n\nEach branch shows 2016–2025 papers with **✅ Solutions** (GeeksforGeeks) and **📄 Official** links. All free!"] },

  // Daily Quiz
  { p: /quiz|daily quiz|question of the day|quiz answer/i,
    r: ["The **🧠 Daily Quiz** refreshes every day with a new question!\n\n• Tap **🧠 Daily Quiz** in the header\n• Read the question carefully\n• Select your answer — you get one attempt\n• See the correct answer + explanation after\n• **Different students get different questions** — your question is uniquely assigned by your device\n\nPractice GATE-level questions, GK, and current affairs daily! 📅"] },

  // Leaderboard / top helpers
  { p: /leader(board)?|top helper|rank|points|score|best student/i,
    r: ["The **🏆 Top Helpers** leaderboard shows students who have helped the most!\n\nHow to rank higher:\n• Post quality answers to doubts\n• Get your replies liked by others\n• Post ideas that get engagement\n• Participate in challenges\n\nTap **🏆 Top Helpers** in the header to see the current rankings. Your name appears when you set it (tap **Set your name** button)!"] },

  // Name / profile
  { p: /name|profile|avatar|set name|my name|username/i,
    r: ["To **set your name & avatar**:\n\n1. Tap **Set your name** in the header\n2. Type your name\n3. Choose a DiceBear avatar style (or use emoji)\n4. Tap Save\n\nYour name appears on all your posts and replies. Your device keeps you identified without any login! 🔐"] },

  // Anonymous posting
  { p: /anonymous|anon|hide name|private post/i,
    r: ["Yes! You can post **anonymously** on RGUKT Spark.\n\nWhen writing a post, toggle the **Anonymous** switch. Your name won't be shown — just \"Anonymous Student\".\n\nYour device ID still prevents duplicate votes/answers, but your identity stays hidden from other users. 🤫"] },

  // Search
  { p: /search|find|look for/i,
    r: ["To **search posts**:\n\n• Tap the **Search bar** (top of the post list)\n• Or press **/** on keyboard to focus it instantly\n• Type any keyword — subject, topic, year\n\nResults filter in real-time across all posts in the current tab!"] },

  // Filter / sort
  { p: /filter|sort|year filter|e1|e2|e3|e4|subject/i,
    r: ["**Filtering posts:**\n\n• Use the **subject rail** (left sidebar) to pick a subject\n• Use the **dropdown** (top of list) to filter by solved/unsolved/recent\n• Tap **year chips** (E1/E2/E3/E4) in the header to filter by year\n• In GATE tab, tap a **year card** to see only that year's PYQs\n\nFilters combine — e.g., pick ECE + E2 + specific subject together!"] },

  // Dark mode / theme
  { p: /dark( mode)?|light( mode)?|theme|night mode/i,
    r: ["Toggle **dark/light mode** with the **🌙 moon button** in the top-right header.\n\nThe app remembers your preference. Dark mode is easier on eyes at night — especially for late-night GATE prep! 🌃"] },

  // Notifications / offline
  { p: /offline|no internet|cache|pwa|install|app/i,
    r: ["**RGUKT Spark works offline!** 📵\n\nIt's a **Progressive Web App (PWA)**:\n• Install it from browser: tap **📲 Add to home screen** or the install banner\n• It loads from cache even without internet\n• The orange bar at top shows when you're offline\n• New posts sync automatically when connection returns\n\nInstall it to get a native app feel — no Play Store needed!"] },

  // Campus filter
  { p: /campus|nuzvid|ongole|basar|idupulapaya|srikakulam/i,
    r: ["You can filter posts by **campus**!\n\nTap the **campus chips** below the header (Nuzvid, Ongole, Basar, etc.) to see only posts from that campus.\n\nWhen posting, select your campus so the right students see your doubt. 🏫"] },

  // Like / vote
  { p: /like|upvote|vote|heart/i,
    r: ["To **like a post or reply**:\n\n• Tap the **❤️ heart icon** on any post or reply\n• Each device can like once per post\n• Likes boost the post in rankings and help the author score points\n\nSpread the love — if someone helped you, like their answer! 💛"] },

  // Delete / edit
  { p: /delet|edit|remov|modif(y|ied)/i,
    r: ["To **delete or edit your post**:\n\n• Open the post you want to remove\n• Tap the **⋯ menu** (three dots) on your own post\n• Choose **Delete** or **Edit**\n\n⚠️ Only you can edit/delete your own posts. Deleted posts are hidden — not permanently erased, so a teacher/admin can restore if needed."] },

  // NPTEL / free courses
  { p: /nptel|free course|iit course|lecture|video/i,
    r: ["Free IIT courses are in the **GATE tab**!\n\nScroll to **\"🎥 Free YouTube Lectures (HD)\"** and **\"🏛 Top IITs & NITs\"**:\n• NPTEL courses from IIT Bombay, IIT Madras, IIT Delhi\n• Unacademy GATE channel\n• MIT OpenCourseWare\n• Khan Academy\n\nAll 100% free — tap any card, then tap ▶ or 📄 to open. No subscription needed!"] },

  // How many posts / stats
  { p: /how many|stat(s|istics)?|count|total/i,
    r: ["You can see **live stats** in the GATE tab (📊 PYQ Stats section) and on the intro screen.\n\nThe intro shows:\n• Total posts across all tabs\n• Active students (unique contributors)\n• Your campus community size\n\nGrowing every day as more RGUKT students join! 📈"] },

  // Spark Bot about itself
  { p: /who are you|what are you|spark bot|about you|your name/i,
    r: ["I'm **Spark Bot** 🤖 — the built-in assistant for RGUKT Spark!\n\nI know everything about this app:\n• How to use every feature\n• GATE resources and PYQ papers\n• Daily quiz and leaderboard\n• Posting, replying, filtering\n• PWA installation tips\n\nJust ask me anything — in plain English! ✨"] },

  // GATE tips
  { p: /tip(s)?|how to (prepare|study|crack)|gate strategy|study plan/i,
    r: ["**GATE Prep Tips using Spark:**\n\n1. 📅 Do the **Daily Quiz** every day — builds consistency\n2. 📂 Solve **PYQ papers** branch-wise from 2016 onward\n3. 🎥 Watch **free NPTEL/IIT lectures** (GATE tab)\n4. ❓ Post doubts **immediately** — don't let them pile up\n5. 🏆 Answer others' doubts — teaching = learning\n6. 📚 Use **GATE Overflow** for CSE PYQ discussions\n\nConsistency > Intensity. 20 mins daily beats 5 hours once a week! 💪"] },

  // Thanks / bye
  { p: /thank(s|you)|bye|goodbye|ok thanks|great|awesome|nice|cool/i,
    r: ["You're welcome! 😊 Keep sparking those doubts! 🔥",
        "Anytime! Good luck with your studies! 💪 Come back if you need anything.",
        "Happy to help! 🌟 All the best for GATE prep! 🎯"] },

  // Help
  { p: /help|what can you do|what do you know|guide|how does/i,
    r: ["Here's what I can help you with:\n\n📌 Posting doubts & ideas\n💬 How replies & likes work\n🎯 GATE tab features & PYQ papers\n🧠 Daily quiz info\n🏆 Leaderboard & scoring\n🛒 Market & clubs\n🌙 Theme, search, filters\n📲 Installing the app (PWA)\n\nJust type your question naturally — I'll do my best! 🤖✨"] },
];

// Fallback responses
const FALLBACK = [
  "Hmm, I'm not sure about that specific thing yet. 🤔 Try asking about **GATE papers**, **daily quiz**, **posting doubts**, or **clubs**!",
  "I don't have that answer yet! 😅 Try: \"How do I post a doubt?\" or \"What is the GATE tab?\"",
  "That's a tricky one! 🧐 I know about posting, GATE prep, quiz, clubs, leaderboard, and all app features. Try asking about those!",
];

const QUICK = [
  "What is RGUKT Spark?",
  "How do I post a doubt?",
  "Show me GATE papers",
  "Tell me about Daily Quiz",
  "How does leaderboard work?",
  "How to install the app?",
];

// ─── Bot Logic ────────────────────────────────────────────────────────────────
let chatOpen = false;
let msgs = [];
let typing = false;

function getResponse(text) {
  const t = text.trim();
  for (const entry of KB) {
    if (entry.p.test(t)) {
      const arr = entry.r;
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderMd(text) {
  // bold, bullet lists, line breaks
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n•/g, '<br>•')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// ─── UI ───────────────────────────────────────────────────────────────────────
function buildUI() {
  if (document.getElementById('sbot-wrap')) return;

  const wrap = document.createElement('div');
  wrap.id = 'sbot-wrap';
  wrap.innerHTML = `
    <button id="sbot-fab" type="button" aria-label="Open Spark Bot" title="Chat with Spark Bot">
      <span class="sbot-fab-icon">✦</span>
      <span class="sbot-fab-ping"></span>
    </button>

    <div id="sbot-panel" role="dialog" aria-label="Spark Bot chat" aria-hidden="true">
      <div class="sbot-hdr">
        <div class="sbot-hdr-left">
          <div class="sbot-avatar">✦</div>
          <div class="sbot-hdr-info">
            <span class="sbot-name">Spark Bot</span>
            <span class="sbot-status"><span class="sbot-dot"></span> Always online</span>
          </div>
        </div>
        <button class="sbot-close" id="sbot-close" type="button" aria-label="Close">✕</button>
      </div>

      <div class="sbot-body" id="sbot-body"></div>

      <div class="sbot-quick" id="sbot-quick"></div>

      <div class="sbot-foot">
        <input class="sbot-input" id="sbot-input" type="text" placeholder="Ask anything about Spark…" autocomplete="off" maxlength="200">
        <button class="sbot-send" id="sbot-send" type="button" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById('sbot-fab').onclick = toggleBot;
  document.getElementById('sbot-close').onclick = toggleBot;
  document.getElementById('sbot-send').onclick = sendMsg;
  const inp = document.getElementById('sbot-input');
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

  renderQuick(QUICK.slice(0, 4));
  showWelcome();
}

function toggleBot() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('sbot-panel');
  const fab = document.getElementById('sbot-fab');
  if (chatOpen) {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    fab.classList.add('active');
    // remove ping after first open
    const ping = fab.querySelector('.sbot-fab-ping');
    if (ping) ping.style.display = 'none';
    setTimeout(() => document.getElementById('sbot-input')?.focus(), 300);
    scrollBottom();
  } else {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    fab.classList.remove('active');
  }
}

function showWelcome() {
  addMsg('bot', "👋 Hi! I'm **Spark Bot** — your guide to everything on RGUKT Spark.\n\nAsk me about **doubts**, **GATE papers**, **daily quiz**, **clubs**, **market**, or anything else. I'm here to help! 🌟");
}

function addMsg(role, text, fast = false) {
  msgs.push({ role, text });
  const body = document.getElementById('sbot-body');
  if (!body) return;

  const div = document.createElement('div');
  div.className = 'sbot-msg sbot-msg-' + role;

  if (role === 'bot') {
    div.innerHTML = `
      <div class="sbot-bubble-bot">
        <div class="sbot-msg-text">${renderMd(text)}</div>
      </div>`;
  } else {
    div.innerHTML = `<div class="sbot-bubble-user">${escHtml(text)}</div>`;
  }

  body.appendChild(div);
  // animate in
  requestAnimationFrame(() => div.classList.add('visible'));
  scrollBottom();
}

function showTyping() {
  const body = document.getElementById('sbot-body');
  if (!body) return;
  const d = document.createElement('div');
  d.className = 'sbot-msg sbot-msg-bot sbot-typing-row';
  d.id = 'sbot-typing';
  d.innerHTML = `<div class="sbot-bubble-bot sbot-typing"><span></span><span></span><span></span></div>`;
  body.appendChild(d);
  requestAnimationFrame(() => d.classList.add('visible'));
  scrollBottom();
}

function hideTyping() {
  document.getElementById('sbot-typing')?.remove();
}

function sendMsg() {
  const inp = document.getElementById('sbot-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text || typing) return;
  inp.value = '';

  addMsg('user', text);
  clearQuick();

  typing = true;
  showTyping();

  const delay = 700 + Math.random() * 600;
  setTimeout(() => {
    hideTyping();
    const resp = getResponse(text);
    addMsg('bot', resp);
    typing = false;
    renderQuick(suggestQuick(text));
  }, delay);
}

function sendQuick(text) {
  const inp = document.getElementById('sbot-input');
  if (inp) inp.value = text;
  sendMsg();
}

function renderQuick(items) {
  const qbar = document.getElementById('sbot-quick');
  if (!qbar) return;
  qbar.innerHTML = '';
  items.forEach(q => {
    const b = document.createElement('button');
    b.className = 'sbot-qchip';
    b.type = 'button';
    b.textContent = q;
    b.onclick = () => sendQuick(q);
    qbar.appendChild(b);
  });
}

function clearQuick() {
  const qbar = document.getElementById('sbot-quick');
  if (qbar) qbar.innerHTML = '';
}

function suggestQuick(text) {
  const t = text.toLowerCase();
  if (/gate|pyq|paper/.test(t)) return ["Show me ECE papers", "How to filter by year?", "Free GATE lectures"];
  if (/doubt|ask|post/.test(t)) return ["How to reply?", "What is anonymous post?", "How likes work?"];
  if (/quiz/.test(t)) return ["How does leaderboard work?", "Daily quiz tips", "What is GATE tab?"];
  if (/club/.test(t)) return ["What is Market tab?", "What are Challenges?", "How to install app?"];
  return QUICK.slice(0, 3);
}

function scrollBottom() {
  const body = document.getElementById('sbot-body');
  if (body) setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('sbot-css')) return;
  const s = document.createElement('style');
  s.id = 'sbot-css';
  s.textContent = `
/* ── Spark Bot ───────────────────────────────── */
#sbot-wrap { position: fixed; bottom: 90px; left: 18px; z-index: 9999; }

/* FAB */
#sbot-fab {
  width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  box-shadow: 0 4px 20px rgba(124,58,237,.45);
  display: flex; align-items: center; justify-content: center;
  transition: transform .2s, box-shadow .2s; position: relative;
}
#sbot-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(124,58,237,.55); }
#sbot-fab.active { transform: scale(.92); }
.sbot-fab-icon { font-size: 22px; color: #fff; line-height: 1; }
.sbot-fab-ping {
  position: absolute; top: 2px; right: 2px; width: 13px; height: 13px;
  background: #f59e0b; border-radius: 50%; border: 2px solid #fff;
  animation: sbot-ping 1.6s ease-in-out infinite;
}
@keyframes sbot-ping {
  0%,100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: .7; }
}

/* Panel */
#sbot-panel {
  position: absolute; bottom: 64px; left: 0;
  width: 330px; max-height: 520px;
  background: var(--sheet, #1e1e2e); border-radius: 20px;
  border: 1.5px solid var(--line, rgba(255,255,255,.1));
  box-shadow: 0 16px 48px rgba(0,0,0,.4);
  display: flex; flex-direction: column; overflow: hidden;
  opacity: 0; transform: translateY(12px) scale(.96); pointer-events: none;
  transition: opacity .25s, transform .25s;
}
#sbot-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

/* Header */
.sbot-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; gap: 10px;
  background: linear-gradient(135deg, #7c3aed 0%, #0891b2 100%);
  flex-shrink: 0;
}
.sbot-hdr-left { display: flex; align-items: center; gap: 10px; }
.sbot-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: rgba(255,255,255,.2); border: 2px solid rgba(255,255,255,.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #fff;
}
.sbot-hdr-info { display: flex; flex-direction: column; }
.sbot-name { font-size: 14px; font-weight: 800; color: #fff; line-height: 1.2; }
.sbot-status { font-size: 11px; color: rgba(255,255,255,.8); display: flex; align-items: center; gap: 4px; }
.sbot-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block;
  animation: sbot-pulse 2s ease-in-out infinite; }
@keyframes sbot-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.sbot-close {
  width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
  background: rgba(255,255,255,.2); color: #fff; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s; flex-shrink: 0;
}
.sbot-close:hover { background: rgba(255,255,255,.35); }

/* Body */
.sbot-body {
  flex: 1; overflow-y: auto; padding: 12px 12px 4px;
  display: flex; flex-direction: column; gap: 8px;
  scrollbar-width: thin; scrollbar-color: rgba(124,58,237,.3) transparent;
}
.sbot-body::-webkit-scrollbar { width: 4px; }
.sbot-body::-webkit-scrollbar-thumb { background: rgba(124,58,237,.3); border-radius: 4px; }

/* Messages */
.sbot-msg { display: flex; opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s; }
.sbot-msg.visible { opacity: 1; transform: translateY(0); }
.sbot-msg-bot { justify-content: flex-start; }
.sbot-msg-user { justify-content: flex-end; }
.sbot-bubble-bot {
  max-width: 88%; background: var(--bg, #13131f);
  border: 1px solid var(--line, rgba(255,255,255,.1));
  border-radius: 4px 16px 16px 16px; padding: 9px 12px;
}
.sbot-bubble-user {
  max-width: 80%; background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: #fff; border-radius: 16px 4px 16px 16px; padding: 9px 12px;
  font-size: 13px; line-height: 1.5; word-break: break-word;
}
.sbot-msg-text {
  font-size: 13px; line-height: 1.6; color: var(--text, #e2e8f0); word-break: break-word;
}
.sbot-msg-text strong { color: var(--accent, #a78bfa); font-weight: 700; }

/* Typing indicator */
.sbot-typing { display: flex; align-items: center; gap: 4px; padding: 10px 14px !important; }
.sbot-typing span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--muted, #64748b); display: inline-block;
  animation: sbot-bounce .9s ease-in-out infinite;
}
.sbot-typing span:nth-child(2) { animation-delay: .18s; }
.sbot-typing span:nth-child(3) { animation-delay: .36s; }
@keyframes sbot-bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }

/* Quick chips */
.sbot-quick {
  display: flex; flex-wrap: wrap; gap: 5px;
  padding: 6px 12px 2px; min-height: 0; flex-shrink: 0;
}
.sbot-qchip {
  padding: 4px 10px; border-radius: 20px; border: 1.5px solid var(--line, rgba(255,255,255,.15));
  background: var(--bg, #13131f); color: var(--text, #e2e8f0);
  font-size: 11px; cursor: pointer; white-space: nowrap;
  transition: background .15s, border-color .15s;
}
.sbot-qchip:hover { background: rgba(124,58,237,.2); border-color: #7c3aed; color: #a78bfa; }

/* Footer */
.sbot-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-top: 1px solid var(--line, rgba(255,255,255,.1));
  flex-shrink: 0;
}
.sbot-input {
  flex: 1; background: var(--bg, #13131f); border: 1.5px solid var(--line, rgba(255,255,255,.12));
  border-radius: 22px; padding: 8px 14px; font-size: 13px; color: var(--text, #e2e8f0);
  outline: none; transition: border-color .15s;
}
.sbot-input:focus { border-color: #7c3aed; }
.sbot-input::placeholder { color: var(--muted, #64748b); }
.sbot-send {
  width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: #fff; display: flex; align-items: center; justify-content: center;
  transition: transform .15s, opacity .15s;
}
.sbot-send:hover { transform: scale(1.1); }
.sbot-send:active { transform: scale(.92); }

/* Mobile */
@media (max-width: 420px) {
  #sbot-wrap { bottom: 80px; left: 12px; }
  #sbot-panel { width: calc(100vw - 28px); max-height: 460px; }
}
  `;
  document.head.appendChild(s);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  injectCSS();
  buildUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
