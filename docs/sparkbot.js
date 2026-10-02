// Spark Bot v3 — Cyberpunk Holographic Assistant
(function () {
'use strict';

const KB = [
  { p: /^(hi|hello|hey|hlo|hii|helo|namaste|sup|yo)\b/i,
    r: ["Hey there! 👋 I'm **Spark Bot**, your guide to RGUKT Spark. What can I help you with?",
        "Hello! 😊 I'm **Spark Bot**. Ask me anything — doubts, GATE, quiz, clubs, or anything else!",
        "Hi! 🌟 Welcome to RGUKT Spark! I'm Spark Bot — your AI assistant. What do you want to explore?"] },
  { p: /what (is|are|about|this)|about (this|app|site|rgukt spark|spark)|explain (this|app|site)/i,
    r: ["**RGUKT Spark** is a student community platform for RGUKT students!\n\n📌 **Doubts** — ask anything, get peer answers\n💡 **Ideas** — share innovations\n🏛 **Clubs** — discover campus clubs\n🎮 **Challenges** — compete with friends\n🛒 **Market** — buy/sell on campus\n🎯 **GATE** — PYQ papers, free resources\n🏆 **Leaderboard** — top helpers\n\nAll free. No login required!"] },
  { p: /doubt|question|ask|post|how to (ask|post|add)/i,
    r: ["To **post a doubt**:\n\n1. Tap **Ask a doubt** button (top right) or **+ FAB**\n2. Write your question\n3. Pick subject, year, campus\n4. Hit **Post** ✅\n\nOther students reply and you mark the best answer! 💬"] },
  { p: /repl(y|ies)|answer|respond|comment/i,
    r: ["To **reply to a post**:\n\n1. Tap any post card to open it\n2. Scroll to the bottom\n3. Type your reply and tap **Send** 🚀\n\nYou earn points for every helpful reply — climb the leaderboard! 🏆"] },
  { p: /idea(s)?|suggest|innovation|improve/i,
    r: ["The **Ideas** tab is where students share creative suggestions!\n\nSwitch to **Ideas** tab, then tap **Post an idea**. Others can like ❤️ and comment. Best ideas get featured! 🌟"] },
  { p: /club(s)?|society|group|join/i,
    r: ["The **Clubs** tab lists all campus clubs — Technical, Cultural, Sports.\n\nTap **🏛 Clubs** to:\n• See active clubs and their posts\n• Post club announcements\n• Discover upcoming events\n\nFilter by department to see relevant clubs!"] },
  { p: /challeng(e|es)|compet|game|contest/i,
    r: ["**🎮 Challenges** — academic & fun competitions!\n\nSee active contests in the Challenges tab. Post a challenge or participate in others. Winners get featured on the leaderboard! 🥇"] },
  { p: /market|buy|sell|item|shop/i,
    r: ["The **🛒 Market** is a campus buy/sell board:\n\n• **Browse** items others are selling\n• **List your item** — tap +, add photo, price, description\n• Filter by **Newest / Price**\n• Contact sellers directly\n\nAll transactions between students!"] },
  { p: /gate( tab| section| prep)?|previous year|pyq|paper(s)?/i,
    r: ["The **🎯 GATE** tab — packed with free resources:\n\n📂 **PYQ Papers** (2016–2025) per branch\n📊 **Year filter** — tap any year card\n🎥 **Free YouTube lectures** — IIT/NPTEL\n🏛 **IIT & NIT free courses**\n📚 **Practice** — GFG, Testbook, GATE Overflow\n\nTap a branch to expand its solved papers!"] },
  { p: /branch|ece|cse|eee|civil|mech/i,
    r: ["In GATE tab → **\"📂 Previous Year Papers by Branch\"**:\n\n📡 **ECE** — Electronics & Communication\n💻 **CSE** — Computer Science\n⚡ **EEE** — Electrical Engineering\n🏗️ **Civil** — Civil Engineering\n⚙️ **Mech** — Mechanical Engineering\n\nEach shows 2016–2025 papers with **✅ Solutions** + **📄 Official** links. All free!"] },
  { p: /quiz|daily quiz|question of the day/i,
    r: ["The **🧠 Daily Quiz** refreshes every day!\n\n• Tap **🧠 Daily Quiz** in the header\n• One attempt per day\n• See answer + explanation after\n• **Different students get different questions** — uniquely assigned per device!\n\nPractice GATE-level, GK & current affairs daily! 📅"] },
  { p: /leader(board)?|top helper|rank|points/i,
    r: ["The **🏆 Top Helpers** shows most helpful students!\n\nClimb higher by:\n• Posting quality answers\n• Getting replies liked\n• Posting engaging ideas\n• Participating in challenges\n\nTap **🏆 Top Helpers** to see rankings. Set your name to appear!"] },
  { p: /name|profile|avatar|set name/i,
    r: ["To **set your name & avatar**:\n\n1. Tap **Set your name** in the header\n2. Type your name\n3. Choose a DiceBear avatar\n4. Tap Save\n\nNo login needed — device ID identifies you! 🔐"] },
  { p: /anonymous|anon|hide name/i,
    r: ["Yes! **Anonymous posting** is available.\n\nWhen writing a post, toggle the **Anonymous** switch. Your identity stays hidden from other users. 🤫"] },
  { p: /search|find|look for/i,
    r: ["To **search posts**:\n\n• Use the **Search bar** at the top of the post list\n• Press **/** on keyboard to focus instantly\n• Type any keyword — subject, topic, year\n\nResults filter in real-time! 🔍"] },
  { p: /filter|sort|e1|e2|e3|e4/i,
    r: ["**Filtering posts:**\n\n• **Subject rail** (left) to pick a subject\n• **Dropdown** for solved/unsolved/recent\n• **Year chips** (E1/E2/E3/E4) in header\n• In GATE tab, tap a **year card** for PYQs\n\nFilters combine — ECE + E2 + specific subject!"] },
  { p: /dark|light|theme|night/i,
    r: ["Toggle **dark/light mode** with the **🌙 button** in the header.\n\nThe app remembers your preference. Dark mode is perfect for late-night GATE prep! 🌃"] },
  { p: /offline|install|pwa|app/i,
    r: ["**RGUKT Spark works offline!** 📵\n\nIt's a **PWA**:\n• Tap **📲 Add to home screen** or install banner\n• Loads from cache without internet\n• Orange bar shows when offline\n• Auto-syncs when back online\n\nNo Play Store needed!"] },
  { p: /campus|nuzvid|ongole|basar/i,
    r: ["Filter posts by **campus**!\n\nTap the **campus chips** below the header to see only posts from that campus. When posting, select your campus so the right students see your doubt. 🏫"] },
  { p: /like|vote|heart/i,
    r: ["To **like a post**:\n\n• Tap the **❤️ heart icon** on any post\n• One like per device per post\n• Likes boost rankings and help authors score points\n\nIf someone helped you, like their answer! 💛"] },
  { p: /nptel|free course|iit|lecture/i,
    r: ["Free IIT courses in the **GATE tab**!\n\nScroll to **\"🎥 Free YouTube Lectures\"** and **\"🏛 Top IITs & NITs\"**:\n• NPTEL from IIT Bombay, IIT Madras\n• Unacademy GATE channel\n• MIT OpenCourseWare\n• Khan Academy\n\nAll 100% free — no subscription!"] },
  { p: /who are you|spark bot|about you/i,
    r: ["I'm **Spark Bot** 🤖 — the AI assistant for RGUKT Spark!\n\nI know everything:\n• Every app feature\n• GATE resources & PYQ papers\n• Daily quiz & leaderboard\n• Posting, replying, filtering\n• PWA installation\n\nAsk me anything in plain English! ✨"] },
  { p: /tip|prepare|study|crack|gate strategy/i,
    r: ["**GATE Prep Tips using Spark:**\n\n1. 📅 **Daily Quiz** every day — builds consistency\n2. 📂 **PYQ papers** branch-wise from 2016\n3. 🎥 **Free NPTEL/IIT lectures** (GATE tab)\n4. ❓ **Post doubts immediately** — don't pile up\n5. 🏆 **Answer others** — teaching = learning\n6. 📚 **GATE Overflow** for CSE PYQ\n\nConsistency beats intensity. 20 mins daily > 5 hrs once! 💪"] },
  { p: /thank|bye|goodbye|ok thanks|great|awesome|nice/i,
    r: ["You're welcome! 😊 Keep sparking those doubts! 🔥",
        "Anytime! Good luck with your studies! 💪",
        "Happy to help! 🌟 All the best for GATE! 🎯"] },
  { p: /help|what can you do|guide/i,
    r: ["I can help with:\n\n📌 Posting doubts & ideas\n💬 Replies & likes\n🎯 GATE papers & resources\n🧠 Daily quiz\n🏆 Leaderboard & scoring\n🛒 Market & clubs\n🌙 Theme, search, filters\n📲 Installing the app\n\nJust ask naturally! 🤖✨"] },
];

const FALLBACK = [
  "Hmm, not sure about that yet. 🤔 Try asking about **GATE papers**, **daily quiz**, **posting doubts**, or **clubs**!",
  "I don't have that answer! 😅 Try: \"How do I post a doubt?\" or \"What is the GATE tab?\"",
  "Tricky one! 🧐 I know all app features — try asking about posting, GATE, quiz, clubs, or leaderboard!",
];

const QUICK_DEFAULT = ["What is RGUKT Spark?","How to post a doubt?","GATE PYQ Papers","Daily Quiz info"];

let isOpen = false, busy = false, msgCount = 0;

function respond(text) {
  for (const e of KB) if (e.p.test(text.trim())) {
    const a = e.r; return a[Math.floor(Math.random() * a.length)];
  }
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

function md(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n•\s/g, '<br><span class="sb-li">▸</span> ')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ─── Orb SVG ────────────────────────────────────────────────────────────────
function orb(size=40) {
  const c = size/2, r1=c*.82, r2=c*.62, r3=c*.44;
  return `<svg class="sb-orb" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sbg${size}" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#f0abfc"/>
        <stop offset="45%" stop-color="#a855f7"/>
        <stop offset="100%" stop-color="#0e7490"/>
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

// ─── Particles ───────────────────────────────────────────────────────────────
function particles(n) {
  return Array.from({length:n},(_,i)=>{
    const x=(i/n*90+5).toFixed(1), dur=(2+Math.random()*2).toFixed(1),
          delay=(Math.random()*2).toFixed(2), size=(2+Math.random()*3).toFixed(1);
    return `<div class="sb-pt" style="left:${x}%;animation-duration:${dur}s;animation-delay:-${delay}s;width:${size}px;height:${size}px"></div>`;
  }).join('');
}

// ─── Build ───────────────────────────────────────────────────────────────────
function build() {
  if (document.getElementById('sbw')) return;
  const w = document.createElement('div'); w.id='sbw';
  w.innerHTML = `
    <button id="sb-btn" type="button" aria-label="Open Spark Bot">
      ${orb(38)}
      <span class="sb-btn-ring"></span>
      <span class="sb-btn-badge">✦</span>
    </button>

    <div id="sb-win" role="dialog" aria-label="Spark Bot" aria-hidden="true">
      <div class="sb-frame">

        <div class="sb-top">
          <div class="sb-pts">${particles(20)}</div>
          <div class="sb-scan"></div>
          <div class="sb-top-row">
            <div class="sb-top-av">${orb(44)}</div>
            <div class="sb-top-info">
              <div class="sb-top-name">Spark Bot</div>
              <div class="sb-top-stat"><span class="sb-live-dot"></span>AI Assistant · Online</div>
            </div>
            <button class="sb-cls" id="sb-cls" type="button">
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>

        <div class="sb-msgs" id="sb-msgs"></div>

        <div class="sb-chips" id="sb-chips"></div>

        <div class="sb-bar">
          <input id="sb-in" type="text" placeholder="Ask about RGUKT Spark…" autocomplete="off" maxlength="200">
          <button id="sb-go" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(w);

  document.getElementById('sb-btn').onclick = toggle;
  document.getElementById('sb-cls').onclick = toggle;
  document.getElementById('sb-go').onclick  = send;

  // Force inline styles on input + send so cached CSS can't make them gray
  const inp = document.getElementById('sb-in');
  Object.assign(inp.style, {
    flex:'1', background:'linear-gradient(135deg,rgba(109,40,217,.45),rgba(30,64,175,.4))',
    border:'1.5px solid rgba(167,139,250,.5)', borderRadius:'24px',
    padding:'10px 16px', fontSize:'13px', fontWeight:'500',
    color:'#ede9fe', outline:'none', boxSizing:'border-box',
    boxShadow:'inset 0 1px 0 rgba(167,139,250,.2), 0 2px 10px rgba(109,40,217,.2)',
  });
  inp.addEventListener('focus',()=>{
    inp.style.borderColor='rgba(196,181,253,.8)';
    inp.style.boxShadow='0 0 0 3px rgba(109,40,217,.22), 0 0 24px rgba(167,139,250,.16), inset 0 1px 0 rgba(196,181,253,.25)';
  });
  inp.addEventListener('blur',()=>{
    inp.style.borderColor='rgba(167,139,250,.5)';
    inp.style.boxShadow='inset 0 1px 0 rgba(167,139,250,.2), 0 2px 10px rgba(109,40,217,.2)';
  });

  const go = document.getElementById('sb-go');
  Object.assign(go.style, {
    width:'40px', height:'40px', borderRadius:'50%', border:'none', cursor:'pointer', flexShrink:'0',
    background:'linear-gradient(135deg,#9333ea,#ec4899,#06b6d4)',
    color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 18px rgba(147,51,234,.55), 0 0 14px rgba(236,72,153,.3)',
  });
  go.onmouseenter=()=>{ go.style.transform='scale(1.14) translateY(-2px)'; go.style.filter='brightness(1.15)'; };
  go.onmouseleave=()=>{ go.style.transform=''; go.style.filter=''; };

  // Style the bar itself
  const bar = document.querySelector('.sb-bar');
  if (bar) Object.assign(bar.style,{
    background:'linear-gradient(90deg,rgba(76,29,149,.55),rgba(23,37,84,.6),rgba(4,47,82,.55))',
    borderTop:'1px solid rgba(196,181,253,.18)',
  });

  inp.addEventListener('keydown', e => { if (e.key==='Enter') send(); });
  setChips(QUICK_DEFAULT);
  addMsg('bot', "👋 Hey! I'm **Spark Bot** — your cyberpunk AI guide to RGUKT Spark.\n\nAsk me about **doubts**, **GATE papers**, **daily quiz**, **clubs**, **market**, or any feature! ✨", true);
}

function toggle() {
  isOpen = !isOpen;
  const win = document.getElementById('sb-win');
  const btn = document.getElementById('sb-btn');
  win.classList.toggle('sb-show', isOpen);
  win.setAttribute('aria-hidden', String(!isOpen));
  btn.classList.toggle('sb-open', isOpen);
  if (isOpen) setTimeout(()=>document.getElementById('sb-in')?.focus(), 320);
}

function addMsg(role, text, instant=false) {
  const msgs = document.getElementById('sb-msgs'); if (!msgs) return;
  const d = document.createElement('div');
  d.className = `sb-msg sb-${role}`;
  d.style.setProperty('--n', msgCount++);
  if (role==='bot') {
    d.innerHTML=`<div class="sb-av">${orb(26)}</div><div class="sb-bub sb-bub-bot"><span class="sb-bub-shine"></span><div class="sb-bub-txt">${md(text)}</div></div>`;
  } else {
    d.innerHTML=`<div class="sb-bub sb-bub-usr"><div class="sb-bub-txt">${esc(text)}</div></div>`;
  }
  msgs.appendChild(d);
  requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('sb-vis')));
  scroll();
}

function showDots() {
  const msgs = document.getElementById('sb-msgs'); if (!msgs) return;
  const d = document.createElement('div');
  d.id='sb-dots'; d.className='sb-msg sb-bot';
  d.innerHTML=`<div class="sb-av">${orb(26)}</div><div class="sb-bub sb-bub-bot"><div class="sb-dots"><i></i><i></i><i></i></div></div>`;
  msgs.appendChild(d);
  requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('sb-vis')));
  scroll();
}
function hideDots() { document.getElementById('sb-dots')?.remove(); }

function send() {
  const inp = document.getElementById('sb-in');
  if (!inp||busy) return;
  const t = inp.value.trim(); if (!t) return;
  inp.value='';
  addMsg('user', t);
  setChips([]);
  const btn = document.getElementById('sb-go');
  btn?.classList.add('sb-pop'); setTimeout(()=>btn?.classList.remove('sb-pop'),350);
  busy=true; showDots();
  setTimeout(()=>{
    hideDots();
    addMsg('bot', respond(t));
    busy=false;
    setChips(ctxChips(t));
  }, 750+Math.random()*500);
}

// Chip color themes — vivid, never gray
const CHIP_THEMES = [
  { bg:'linear-gradient(135deg,#6d28d9,#a21caf)', border:'#e879f9', color:'#fdf4ff', glow:'rgba(162,28,175,.55)' },
  { bg:'linear-gradient(135deg,#0369a1,#0e7490)', border:'#22d3ee', color:'#ecfeff', glow:'rgba(14,116,144,.55)' },
  { bg:'linear-gradient(135deg,#b45309,#d97706)', border:'#fbbf24', color:'#fffbeb', glow:'rgba(217,119,6,.5)'  },
  { bg:'linear-gradient(135deg,#be123c,#e11d48)', border:'#fb7185', color:'#fff1f2', glow:'rgba(225,29,72,.5)'  },
];
function setChips(list) {
  const bar=document.getElementById('sb-chips'); if (!bar) return;
  bar.innerHTML='';
  list.forEach((q,i)=>{
    const th = CHIP_THEMES[i % CHIP_THEMES.length];
    const b=document.createElement('button');
    b.type='button'; b.textContent=q;
    Object.assign(b.style,{
      padding:'6px 14px', borderRadius:'22px', cursor:'pointer', whiteSpace:'nowrap',
      fontSize:'12px', fontWeight:'700', letterSpacing:'.2px',
      background: th.bg,
      border: '1.5px solid ' + th.border,
      color: th.color,
      boxShadow: '0 3px 14px ' + th.glow + ', inset 0 1px 0 rgba(255,255,255,.15)',
      backdropFilter: 'blur(8px)',
      transition: 'transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s',
      opacity:'0', transform:'translateY(8px) scale(.88)',
    });
    b.onmouseenter=()=>{ b.style.transform='translateY(-3px) scale(1.07)'; b.style.filter='brightness(1.2)'; };
    b.onmouseleave=()=>{ b.style.transform='translateY(0) scale(1)'; b.style.filter=''; };
    b.onclick=()=>{ document.getElementById('sb-in').value=q; send(); };
    bar.appendChild(b);
    // animate in
    const delay = i * 70;
    setTimeout(()=>{ b.style.opacity='1'; b.style.transform='translateY(0) scale(1)'; }, delay + 20);
  });
}

function ctxChips(t) {
  t=t.toLowerCase();
  if (/gate|pyq|paper/.test(t)) return ["ECE branch papers","GATE study tips","Free IIT lectures"];
  if (/doubt|ask|post/.test(t)) return ["How to reply?","Anonymous posting?","How likes work?"];
  if (/quiz/.test(t)) return ["Leaderboard tips","GATE tab features","Install the app"];
  return QUICK_DEFAULT.slice(0,3);
}

function scroll() {
  const m=document.getElementById('sb-msgs');
  if (m) setTimeout(()=>{m.scrollTop=m.scrollHeight;},55);
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
function injectCSS() {
  document.getElementById('sb-css92')?.remove();
  if (document.getElementById('sb-css94')) return;
  const s=document.createElement('style'); s.id='sb-css94';
  s.textContent=`
/* ══════════════════════════════════════
   SPARK BOT v3 — Cyberpunk Glass
══════════════════════════════════════ */
#sbw{position:fixed;bottom:86px;left:14px;z-index:10000;font-family:inherit;}

/* ── ORB SVG ────────────────────────── */
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

/* ── FAB BUTTON ─────────────────────── */
#sb-btn{
  width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;
  background:linear-gradient(145deg,#4c1d95 0%,#6d28d9 40%,#0369a1 100%);
  position:relative;display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 0 2px rgba(196,181,253,.4),0 0 22px rgba(109,40,217,.5),0 8px 30px rgba(109,40,217,.35);
  transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s;
}
#sb-btn:hover{transform:translateY(-3px) scale(1.1);box-shadow:0 0 0 3px rgba(196,181,253,.55),0 0 36px rgba(109,40,217,.6),0 12px 36px rgba(109,40,217,.4);}
#sb-btn.sb-open{transform:rotate(135deg) scale(.9);}
.sb-btn-ring{
  position:absolute;inset:-7px;border-radius:50%;
  border:2px solid transparent;
  background:linear-gradient(#fff0,#fff0) padding-box,
             conic-gradient(#a855f7,#22d3ee,#f472b6,#fbbf24,#a855f7) border-box;
  animation:sb-ring-spin 3s linear infinite;pointer-events:none;
}
@keyframes sb-ring-spin{to{transform:rotate(360deg);}}
.sb-btn-badge{
  position:absolute;top:1px;right:1px;
  width:16px;height:16px;border-radius:50%;
  background:linear-gradient(135deg,#f59e0b,#f43f5e);
  border:2px solid #4c1d95;
  font-size:7px;color:#fff;
  display:flex;align-items:center;justify-content:center;font-weight:900;
  animation:sb-badge 2s ease-in-out infinite;
}
@keyframes sb-badge{0%,100%{transform:scale(1)}50%{transform:scale(1.3);box-shadow:0 0 10px rgba(244,63,94,.8)}}

/* ── PANEL ──────────────────────────── */
#sb-win{
  position:absolute;bottom:68px;left:0;width:335px;
  opacity:0;pointer-events:none;
  transform:perspective(700px) rotateX(8deg) translateY(18px) scale(.94);
  transform-origin:bottom left;
  transition:opacity .3s cubic-bezier(.22,1,.36,1),transform .3s cubic-bezier(.22,1,.36,1);
}
#sb-win.sb-show{opacity:1;pointer-events:all;transform:perspective(700px) rotateX(0) translateY(0) scale(1);}

.sb-frame{
  border-radius:20px;overflow:hidden;
  background:linear-gradient(160deg,rgba(45,12,102,.92) 0%,rgba(15,23,64,.9) 45%,rgba(4,30,60,.92) 100%);
  backdrop-filter:blur(36px) saturate(200%) brightness(1.15);
  -webkit-backdrop-filter:blur(36px) saturate(200%) brightness(1.15);
  border:1px solid rgba(196,181,253,.22);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.06),
    0 2px 0 rgba(196,181,253,.12) inset,
    0 32px 90px rgba(45,12,102,.55),
    0 0 80px rgba(109,40,217,.12),
    inset 0 0 40px rgba(109,40,217,.06);
  display:flex;flex-direction:column;max-height:530px;
}

/* ── HEADER ─────────────────────────── */
.sb-top{
  position:relative;padding:14px 14px 12px;overflow:hidden;flex-shrink:0;
  background:linear-gradient(135deg,
    rgba(109,40,217,.85) 0%,
    rgba(49,46,129,.75) 35%,
    rgba(3,105,161,.75) 100%);
  border-bottom:1px solid rgba(196,181,253,.18);
}
.sb-scan{
  position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(168,85,247,.8),rgba(34,211,238,.8),transparent);
  animation:sb-scan 3s ease-in-out infinite;
}
@keyframes sb-scan{0%{top:0;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:100%;opacity:0}}

.sb-pts{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.sb-pt{
  position:absolute;bottom:-6px;border-radius:50%;
  background:radial-gradient(circle,rgba(168,85,247,.9),rgba(34,211,238,.6));
  animation:sb-pt-rise linear infinite;
}
@keyframes sb-pt-rise{0%{bottom:-6px;opacity:.8;transform:scale(1)}100%{bottom:110%;opacity:0;transform:scale(.2) translateX(20px)}}

.sb-top-row{position:relative;display:flex;align-items:center;gap:10px;z-index:1;}
.sb-top-av{width:44px;height:44px;flex-shrink:0;}
.sb-top-info{flex:1;min-width:0;}
.sb-top-name{
  font-size:15px;font-weight:900;color:#fff;letter-spacing:.5px;
  background:linear-gradient(90deg,#e879f9,#67e8f9,#fbbf24);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  text-shadow:none;
  animation:sb-name-shift 5s linear infinite;
  background-size:300% 100%;
}
@keyframes sb-name-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.sb-top-stat{font-size:10.5px;color:rgba(167,139,250,.8);display:flex;align-items:center;gap:5px;margin-top:2px;}
.sb-live-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;
  box-shadow:0 0 6px #4ade80;animation:sb-live 2s ease-in-out infinite;}
@keyframes sb-live{0%,100%{opacity:1;box-shadow:0 0 6px #4ade80}50%{opacity:.4;box-shadow:0 0 2px #4ade80}}

.sb-cls{
  width:26px;height:26px;border-radius:50%;border:1px solid rgba(168,85,247,.3);
  cursor:pointer;background:rgba(168,85,247,.1);color:rgba(167,139,250,.9);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:background .15s,transform .2s,border-color .15s;backdrop-filter:blur(4px);
}
.sb-cls:hover{background:rgba(168,85,247,.25);border-color:rgba(168,85,247,.6);transform:rotate(90deg);}

/* ── MESSAGES ───────────────────────── */
.sb-msgs{
  flex:1;overflow-y:auto;padding:12px 11px 4px;
  display:flex;flex-direction:column;gap:9px;min-height:0;
  scrollbar-width:thin;scrollbar-color:rgba(196,181,253,.25) transparent;
  background:linear-gradient(180deg,rgba(30,10,70,.12) 0%,rgba(3,30,60,.08) 100%);
}
.sb-msgs::-webkit-scrollbar{width:3px;}
.sb-msgs::-webkit-scrollbar-thumb{background:linear-gradient(#a855f7,#22d3ee);border-radius:3px;}

.sb-msg{
  display:flex;align-items:flex-end;gap:7px;
  opacity:0;transform:translateY(10px) scale(.97);
  transition:opacity .25s,transform .25s;
}
.sb-msg.sb-vis{opacity:1;transform:translateY(0) scale(1);}
.sb-usr{flex-direction:row-reverse;}

.sb-av{width:26px;height:26px;flex-shrink:0;}

.sb-bub{max-width:84%;position:relative;}
.sb-bub-bot .sb-bub-txt,.sb-bub-usr .sb-bub-txt{
  font-size:13px;line-height:1.65;word-break:break-word;
  padding:9px 12px;border-radius:4px 15px 15px 15px;
}
.sb-bub-bot .sb-bub-txt{
  background:linear-gradient(135deg,rgba(67,20,130,.65) 0%,rgba(23,37,84,.75) 55%,rgba(7,55,99,.65) 100%);
  border:1px solid rgba(196,181,253,.22);
  color:rgba(226,232,240,.95);
  box-shadow:0 4px 20px rgba(45,12,102,.4),inset 0 1px 0 rgba(196,181,253,.1);
}
.sb-bub-usr .sb-bub-txt{
  border-radius:15px 4px 15px 15px;
  background:linear-gradient(135deg,#7c3aed 0%,#a21caf 50%,#0369a1 100%);
  border:1px solid rgba(244,114,182,.35);
  color:#fff;
  box-shadow:0 4px 22px rgba(124,58,237,.4),0 0 12px rgba(162,28,175,.2);
}
.sb-bub-bot .sb-bub-txt strong{color:#c4b5fd;font-weight:700;}
.sb-li{color:#22d3ee;margin-right:3px;font-weight:700;}

.sb-bub-shine{
  position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(196,181,253,.6),rgba(34,211,238,.5),rgba(244,114,182,.4),transparent);
  border-radius:4px 15px 0 0;
}

/* ── TYPING DOTS ────────────────────── */
.sb-dots{display:flex;align-items:center;gap:6px;padding:5px 2px;}
.sb-dots i{
  width:8px;height:8px;border-radius:50%;display:block;
  animation:sb-bounce .85s ease-in-out infinite;
}
.sb-dots i:nth-child(1){background:linear-gradient(135deg,#f0abfc,#a855f7);box-shadow:0 0 8px rgba(168,85,247,.7);}
.sb-dots i:nth-child(2){background:linear-gradient(135deg,#67e8f9,#0891b2);box-shadow:0 0 8px rgba(34,211,238,.7);animation-delay:.17s;}
.sb-dots i:nth-child(3){background:linear-gradient(135deg,#fde68a,#f59e0b);box-shadow:0 0 8px rgba(251,191,36,.7);animation-delay:.34s;}
@keyframes sb-bounce{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-7px) scale(1.2)}}

/* ── CHIPS ──────────────────────────── */
.sb-chips{
  display:flex;flex-wrap:wrap;gap:6px;padding:8px 11px 4px;flex-shrink:0;min-height:0;
}
.sb-chip{
  padding:6px 13px;border-radius:22px;cursor:pointer;white-space:nowrap;
  font-size:12px;font-weight:700;letter-spacing:.2px;
  position:relative;overflow:hidden;
  backdrop-filter:blur(12px);
  transition:all .22s cubic-bezier(.34,1.56,.64,1);
  animation:sb-chip-in .32s cubic-bezier(.34,1.56,.64,1) both;
  animation-delay:calc(var(--ci,0)*.08s);
}
/* Each chip gets a vivid color based on its index */
.sb-chip:nth-child(1){background:linear-gradient(135deg,rgba(126,34,206,.75),rgba(192,38,211,.55));border:1.5px solid rgba(240,171,252,.5);color:#f0abfc;box-shadow:0 2px 12px rgba(192,38,211,.3),inset 0 1px 0 rgba(255,255,255,.1);}
.sb-chip:nth-child(2){background:linear-gradient(135deg,rgba(3,105,161,.75),rgba(6,182,212,.45));border:1.5px solid rgba(103,232,249,.45);color:#67e8f9;box-shadow:0 2px 12px rgba(6,182,212,.3),inset 0 1px 0 rgba(255,255,255,.1);}
.sb-chip:nth-child(3){background:linear-gradient(135deg,rgba(180,83,9,.7),rgba(217,119,6,.5));border:1.5px solid rgba(252,211,77,.45);color:#fde68a;box-shadow:0 2px 12px rgba(217,119,6,.3),inset 0 1px 0 rgba(255,255,255,.1);}
.sb-chip:nth-child(4){background:linear-gradient(135deg,rgba(190,18,60,.7),rgba(244,63,94,.45));border:1.5px solid rgba(253,164,175,.45);color:#fecdd3;box-shadow:0 2px 12px rgba(244,63,94,.3),inset 0 1px 0 rgba(255,255,255,.1);}
/* Shimmer sweep on each chip */
.sb-chip::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:skewX(-15deg);transition:left .4s ease;}
.sb-chip:hover::before{left:150%;}
.sb-chip:hover{transform:translateY(-3px) scale(1.07);filter:brightness(1.15);}
.sb-chip:active{transform:scale(.95);}
@keyframes sb-chip-in{from{opacity:0;transform:translateY(10px) scale(.8)}to{opacity:1;transform:translateY(0) scale(1)}}

/* ── INPUT BAR ──────────────────────── */
.sb-bar{
  display:flex;align-items:center;gap:8px;padding:10px 11px;flex-shrink:0;
  border-top:1px solid rgba(196,181,253,.15);
  background:linear-gradient(90deg,rgba(76,29,149,.5) 0%,rgba(23,37,84,.55) 50%,rgba(4,47,82,.5) 100%);
  backdrop-filter:blur(8px);
}
#sb-in{
  flex:1;
  background:linear-gradient(135deg,rgba(88,28,135,.4) 0%,rgba(30,58,138,.4) 100%);
  border:1.5px solid rgba(167,139,250,.35);
  border-radius:24px;padding:10px 16px;
  font-size:13px;font-weight:500;color:#ede9fe;outline:none;
  transition:border-color .2s,box-shadow .2s,background .2s;
  backdrop-filter:blur(10px);box-sizing:border-box;
  box-shadow:inset 0 1px 0 rgba(167,139,250,.15),0 2px 8px rgba(88,28,135,.2);
}
#sb-in:focus{
  border-color:rgba(196,181,253,.7);
  background:linear-gradient(135deg,rgba(109,40,217,.35) 0%,rgba(30,64,175,.35) 100%);
  box-shadow:0 0 0 3px rgba(109,40,217,.18),0 0 22px rgba(167,139,250,.14),inset 0 1px 0 rgba(196,181,253,.2);
}
#sb-in::placeholder{color:rgba(167,139,250,.45);font-weight:400;}
#sb-go{
  width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;flex-shrink:0;
  background:linear-gradient(135deg,#9333ea 0%,#ec4899 50%,#06b6d4 100%);
  color:#fff;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(147,51,234,.5),0 0 12px rgba(236,72,153,.25);
  transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;
  position:relative;overflow:hidden;
}
#sb-go:hover{transform:scale(1.15) translateY(-2px);box-shadow:0 6px 24px rgba(147,51,234,.65),0 0 20px rgba(236,72,153,.4);}
#sb-go.sb-pop::after{
  content:'';position:absolute;inset:0;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.65) 0%,transparent 70%);
  animation:sb-pop .35s ease-out;pointer-events:none;
}
@keyframes sb-pop{from{transform:scale(0);opacity:1}to{transform:scale(2.5);opacity:0}}

/* ── MOBILE ─────────────────────────── */
@media(max-width:420px){
  #sbw{bottom:78px;left:10px;}
  #sb-win{width:calc(100vw - 22px);max-height:480px;}
}
`;
  document.head.appendChild(s);
}

function init() { injectCSS(); build(); }
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
