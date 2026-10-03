// Doubt Desk: class board for doubts and ideas.
// Data lives in Firebase Firestore when config.js has Firebase settings, otherwise in this browser (demo mode).

const CFG = window.DOUBT_DESK_CONFIG || {};
const SUBJECTS = (CFG.subjects && CFG.subjects.length) ? CFG.subjects : ["Maths", "Physics", "Chemistry", "Other"];
const CATS = (CFG.ideaCategories && CFG.ideaCategories.length) ? CFG.ideaCategories : ["Project", "Other"];
const CLUBS = [...((CFG.clubs && CFG.clubs.length) ? CFG.clubs : ["Coding Club", "Other"])];
if (!CLUBS.includes("Alumni")) CLUBS.push("Alumni");

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#ef4444", "#14b8a6", "#84cc16", "#f97316", "#64748b"];
const FB_VERSION = "10.12.2";
const MOTTO = CFG.tagline || "Ask boldly. Answer together. Innovate endlessly.";
// Captions that rotate under the title. Edit them in config.js under `captions`.
const CAPTIONS = (CFG.captions && CFG.captions.length) ? CFG.captions : [
  MOTTO,
  "Every doubt you ask today is a concept you own tomorrow.",
  "One doubt. Many minds. Zero fear.",
  "From K-maps to microwaves, G Block solves it together.",
  "Your question might be the one the whole class is stuck on.",
  "Teach one, learn twice. Answer a doubt today.",
  "Great engineers ask the questions others skip.",
  "Signals, circuits, systems — decode them together.",
  "Small doubts, big breakthroughs.",
  "Share an idea today. Build it with your class tomorrow.",
];
const MAX_PAGES = 3;

const TABS = {
  doubts: {
    coll: "doubts", field: "subject", groups: SUBJECTS, groupLabel: "Subjects", noun: "doubt",
    ask: "Ask a doubt", tagline: "Stuck on a problem? Post your doubt, and classmates can answer it.",
    replyNoun: "answer", replyLabel: "Your answer", replyBtn: "Post answer",
    placeholder: "e.g. How do I find the Z-transform of a delayed signal?",
    bodyHint: "Chapter, the full problem, and what you tried so far.",
  },
  ideas: {
    coll: "ideas", field: "category", groups: CATS, groupLabel: "Categories", noun: "idea",
    ask: "Share an idea", tagline: "Got an idea or a thought? Share it, and classmates can like it and build on it.",
    replyNoun: "thought", replyLabel: "Your thoughts", replyBtn: "Post reply",
    placeholder: "e.g. A shared notes bank for every DSP chapter",
    bodyHint: "What is the idea, who it helps, and how we could start.",
  },
  clubs: {
    coll: "clubs", field: "club", groups: CLUBS, groupLabel: "Clubs", noun: "post",
    ask: "Post to a club", tagline: "Connect with RGUKT students. Share projects, find team members, plan events.",
    replyNoun: "reply", replyLabel: "Your reply", replyBtn: "Post reply",
    placeholder: "e.g. Looking for teammates for a robotics project",
    bodyHint: "Details, what help you need, who can join.",
  },
  gate: {
    coll: "gate", field: "subject", groups: SUBJECTS, groupLabel: "Subjects", noun: "discussion",
    ask: "Post GATE discussion", tagline: "GATE PYQs, shortcuts, concepts and exam alerts — shared across all RGUKT campuses.",
    replyNoun: "reply", replyLabel: "Your reply", replyBtn: "Post reply",
    placeholder: "e.g. GATE EC 2023 — Z-transform question (Session 1, Q14)",
    bodyHint: "Full question, approach, shortcut trick, or exam alert.",
  },
  challenges: {
    coll: "challenges", field: "type", groups: ["Quiz", "Puzzle", "Innovation", "Event"], groupLabel: "Type", noun: "challenge",
    ask: "Post a challenge", tagline: "Post a quiz, puzzle or innovation challenge. Classmates solve it, discuss it and share ideas.",
    replyNoun: "attempt", replyLabel: "Your answer or idea", replyBtn: "Submit",
    placeholder: "e.g. What is the output of this C program? / Arrange 8 queens on a chessboard",
    bodyHint: "Full question or challenge description. For quizzes, reveal the answer in your first reply.",
  },
  jobs: {
    coll: "jobs", field: "type", groups: ["Internship", "Full-time", "On-campus drive", "Off-campus drive", "Hackathon", "Referral", "Interview experience", "Prep resource"], groupLabel: "Type", noun: "opportunity",
    ask: "Post an opportunity", tagline: "Placements, internships and hackathons shared by RGUKT students. Post openings, interview experiences and prep tips.",
    replyNoun: "reply", replyLabel: "Your reply", replyBtn: "Post reply",
    placeholder: "e.g. TCS NQT registration open for 2026 batch",
    bodyHint: "Role, eligibility, selection process, how to apply, and any tips.",
  },
  market: {
    coll: "market", field: "category", groups: ["Books", "Notes", "Electronics", "Hostel", "Clothing", "Cycles & Bikes", "Sports", "Lab & Stationery", "Furniture", "Services", "Lost & Found", "Other"], groupLabel: "Category", noun: "listing",
    ask: "Sell an item", tagline: "Buy and sell textbooks, electronics, hostel items and more — with fellow RGUKT students.",
    replyNoun: "inquiry", replyLabel: "Your message", replyBtn: "Send",
    placeholder: "e.g. Data Structures book by Cormen — 2nd year, good condition",
    bodyHint: "Describe the item, its condition, why you're selling, and any extra details.",
    market: true,
  },
};

// ---------- campus ----------
const CAMPUSES = (CFG.campuses && CFG.campuses.length) ? CFG.campuses : [];
const CAMPUS_COLORS = { NUZVID: "#7c3aed", ONGOLE: "#0d9488", RKVALLEY: "#2563eb", SRIKAKULAM: "#0891b2", BASAR: "#d97706", IDUPULAPAYA: "#dc2626" };
const CAMPUS_ICON = { NUZVID: "🟣", ONGOLE: "🟢", RKVALLEY: "🔵", SRIKAKULAM: "🩵" };
const CAMPUS_FULL = { NUZVID: "RGUKT Nuzvid", ONGOLE: "RGUKT Ongole", RKVALLEY: "RGUKT RK Valley", SRIKAKULAM: "RGUKT Srikakulam" };
const campusColor = (c) => CAMPUS_COLORS[c] || "#6366f1";
const getCampus = () => { try { return localStorage.getItem("dd-campus") || null; } catch(_){return null;} };
const setCampus = (c) => { try { localStorage.setItem("dd-campus", c); } catch(_){} };

// ---------- placement and internship board ----------
const safeHttp = (u) => /^https?:\/\/[^\s<>"']{3,280}$/i.test(String(u || "")) ? String(u) : "";
function jobDaysLeft(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.deadline || ""); if (!m) return null;
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - today) / 86400000);
}
const jobDeadlineText = (n) => n == null ? "" : n < 0 ? "Closed" : n === 0 ? "Closes today" : n === 1 ? "1 day left" : n + " days left";
function jobFields(form, create) {
  const f = form.elements; if (!f.company) return {};
  const o = { company: f.company.value.trim().slice(0, 60), deadline: /^\d{4}-\d{2}-\d{2}$/.test(f.deadline.value) ? f.deadline.value : "", applyUrl: safeHttp(f.applyUrl.value.trim()), pay: f.pay.value.trim().slice(0, 40) };
  if (create) for (const k of Object.keys(o)) if (!o[k]) delete o[k];
  return o;
}
const JOB_SITES = [["Internshala", "https://internshala.com"], ["Unstop", "https://unstop.com"], ["AICTE Internships", "https://internship.aicte-india.org/"], ["National Career Service", "https://www.ncs.gov.in"], ["Apprenticeship India", "https://www.apprenticeshipindia.gov.in"], ["Google Summer of Code", "https://summerofcode.withgoogle.com"], ["MLH hackathons", "https://mlh.io"], ["roadmap.sh", "https://roadmap.sh"], ["freeCodeCamp", "https://www.freecodecamp.org"]];
function jobsHub() {
  if (state.tab !== "jobs" || state.query.trim()) return null;
  const soon = state.jobs.filter(d => !d.deleted && !isHidden(d)).map(d => ({ d, n: jobDaysLeft(d) })).filter(x => x.n != null && x.n >= 0 && x.n <= 14).sort((a, b) => a.n - b.n).slice(0, 4);
  const latest = state.jobs.filter(d => !d.deleted && !isHidden(d) && !(jobDaysLeft(d) < 0)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  return el("div", { class: "learn-card year-hub" },
    el("strong", {}, "💼 Placement and internship board"),
    soon.length ? el("small", { class: "hint" }, "⏰ Closing soon") : el("small", { class: "hint" }, "No deadlines in the next 2 weeks. Post an opening to help your batch."),
    ...soon.map(x => el("button", { type: "button", class: "campus-link", onclick: () => openItem(x.d.id) }, el("strong", {}, x.d.title), el("small", {}, (x.d.company ? x.d.company + " · " : "") + jobDeadlineText(x.n)))),
    ...(latest.length ? [el("small", { class: "hint" }, "🆕 Latest openings"), ...latest.map(d => el("button", { type: "button", class: "campus-link", onclick: () => openItem(d.id) }, el("strong", {}, d.title), el("small", {}, [d.type, d.company, jobDeadlineText(jobDaysLeft(d))].filter(Boolean).join(" · "))))] : []),
    el("small", { class: "hint" }, "🔎 Where to find openings (free)"),
    el("div", { class: "rowbtns" }, JOB_SITES.map(([l, u]) => el("a", { class: "btn sm", href: u, target: "_blank", rel: "noopener noreferrer" }, l + " ↗"))),
    el("p", { class: "hint" }, "🛡️ Real companies never ask for money. Never pay for a job, internship, test or certificate, and never share OTPs or bank details."));
}

// ---------- department filter ----------
const DEPT_MAP = {
  ECE:   ["DLD","CS","DSP","PRV","AEC","CN","CO & D","CS-2","RFME"],
  CSE:   ["DS & A","OS","DBMS","OOP","TOC","CD","SE","Python","Maths"],
  Civil: ["SOM","FM","Struct","Geo","Trans","Env","Survey"],
  Mech:  ["Thermo","FM-M","MD","MOM","Mfg","HT","IC Eng"],
  EEE:   ["Circuits","EM","PS","PE","Control","EMS","PQ"],
};
const DEPT_VISUAL = {
  ECE:   { bg: "linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)", art: "📡⚡🔌🎛️📻", label: "Electronics & Communication", sub: "Signals · Circuits · Systems · Communication" },
  CSE:   { bg: "linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%)", art: "💻🖥️🧠⌨️🔧", label: "Computer Science & Engineering", sub: "Algorithms · OS · DBMS · Networks · AI" },
  Civil: { bg: "linear-gradient(135deg,#f59e0b 0%,#10b981 100%)", art: "🏗️🏛️📐🔩🌉", label: "Civil Engineering", sub: "Structures · Fluid · Geo · Transport · Env" },
  Mech:  { bg: "linear-gradient(135deg,#ef4444 0%,#f97316 100%)", art: "⚙️🔩🔧🛠️💨", label: "Mechanical Engineering", sub: "Thermo · Fluid · Design · Manufacturing · HT" },
  EEE:   { bg: "linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)", art: "⚡💡🔋🔌🌡️", label: "Electrical & Electronics", sub: "Machines · Power Systems · Control · Electronics" },
};

// ---------- security helpers ----------
// Anti-clickjacking: hide the app if another site loads it inside a frame.
if (window.top !== window.self) { document.documentElement.style.display = "none"; try { window.top.location = window.self.location.href; } catch (_) {} }
// Removes control, zero-width and bidi-override characters used for spoofing and invisible spam.
const BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
const cleanText = (s) => String(s).normalize("NFC").replace(BAD_CHARS, "").replace(/\n{4,}/g, "\n\n\n");
function cleanDoc(v, key) {
  if (typeof v === "string") return (key === "data" || key === "url") ? v : cleanText(v);
  if (Array.isArray(v)) return v.map(x => cleanDoc(x, key));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanDoc(x, k)]));
  return v;
}
// Only these file types may be uploaded (no scripts, web pages, SVG, archives or programs).
const UPLOAD_EXT = new Set(["pdf", "png", "jpg", "jpeg", "gif", "webp", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"]);
const fileExt = (name) => (String(name || "").split(".").pop() || "").toLowerCase();

const state = {
  tab: "doubts", group: "All", query: "", filter: "all",
  doubts: [], ideas: [], clubs: [], gate: [], jobs: [], challenges: [], chalScores: [], market: [], marketReports: [], marketRatings: [], marketInterests: [], replies: [], likes: [], profiles: [], stories: [], storyViews: [], loaded: false,
  selected: null, mode: "intro", // intro | view | ask | edit | name | campus
  afterName: null,
  replyPages: [], replyAnon: false,
  campusFilter: "all", // "all" | campus name
  mktChip: "all",     // quick filter chip in the market
  mktSort: "newest",   // "newest" | "price_asc" | "price_desc" | "popular"
  dept: "All",         // "All" | "ECE" | "CSE" | "Civil" | "Mech" | "EEE"
  yearFilter: "All",   // "All" | "E1" | "E2" | "E3" | "E4"
  gateYearPick: null,  // null | "2024" | "2023" …
  gateResView: null,   // null | resource obj — content browser
  gatePYQBranch: null, // null | "ECE" | "CSE" | "Civil" | "Mech" | "EEE" — PYQ paper panel
  aiPanel: null,       // post id that has AI panel open
};
const ANON = "Anonymous";
let store = null;
const $ = (id) => document.getElementById(id);

// ---------- small helpers ----------
// The page CSP blocks style attributes, so styles are applied through the CSSOM.
function applyStyle(n, str) {
  for (const d of String(str || "").split(";")) { const i = d.indexOf(":"); if (i > 0) n.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); }
}
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "string") applyStyle(n, v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  if ((tag === "input" && !["checkbox", "radio", "file", "submit", "button"].includes(attrs.type)) || tag === "textarea") if (!n.hasAttribute("autocomplete")) n.setAttribute("autocomplete", "off");
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k instanceof Node ? k : String(k));
  return n;
}
function ago(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  if (s < 86400 * 7) return Math.floor(s / 86400) + " d ago";
  return new Date(ts).toLocaleDateString();
}
function colorAttrs(name, tab = state.tab) {
  if (name === "All") return { "data-s": "all", "data-all": true };
  const groups = TABS[tab].groups;
  let i = groups.indexOf(name);
  if (i < 0) { i = 0; for (const ch of String(name)) i = (i * 31 + ch.codePointAt(0)) % 997; }
  return { "data-s": "x", style: "--c: " + PALETTE[i % PALETTE.length] };
}
function getName() { try { return localStorage.getItem("dd-name") || ""; } catch (_) { return ""; } }
function setName(v) { try { localStorage.setItem("dd-name", v); } catch (_) {} }
// Avatar icons for profile display
const AVATARS = [
  // Characters & students
  "🧑‍💻","👨‍🎓","👩‍🎓","🧑‍🔬","👩‍🔬","🧑‍🚀","🦸","🧙","🥷","🧑‍🎨",
  // Animals
  "🦊","🐯","🦁","🐼","🦅","🐬","🦋","🐺","🦉","🐉",
  // Icons
  "⚡","🎯","🔥","🌙","🚀","💫","💎","🏆","🌊","❄️"
];
// DiceBear 3D portrait seeds shown in the avatar picker
const DB_SEEDS = ["apex","cipher","echo","flash","ghost","hawk","jade","luna","nova","orbit","pixel","vega","storm","blaze","frost","zion"];
const dbUrl = (seed) => "https://api.dicebear.com/9.x/notionists/svg?seed=" + encodeURIComponent(seed) + "&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear";
function getAvatar() { try { return getDp() || localStorage.getItem("dd-avatar") || AVATARS[0]; } catch (_) { return AVATARS[0]; } }
function setAvatar(v) { try { localStorage.setItem("dd-avatar", v); localStorage.removeItem("dd-dp"); } catch (_) {} if (store) syncProfile().catch(() => {}); }
// Avatar for any user by name — returns DiceBear URL for a consistent illustrated portrait
function avatarFor(name) {
  if (!name || name === ANON) return "👤";
  return dpByName(name) || dbUrl(name);
}
const AVATAR_ALLOWED = /^https:\/\/api\.dicebear\.com\//;
// Render a small avatar circle element; accepts emoji string or a safe DiceBear URL (renders <img>)
function avatarEl(icon, cls = "av") {
  if (icon && (AVATAR_ALLOWED.test(icon) || DP_OK.test(icon))) {
    const img = document.createElement("img");
    img.className = cls + " av-img";
    img.src = icon; img.alt = "avatar"; img.loading = "lazy";
    return img;
  }
  return el("span", { class: cls, "aria-hidden": "true" }, icon && icon.startsWith("http") ? "👤" : (icon || "👤"));
}

const mine = (x) => {
  if (!x || !store) return false;
  if (allMyIds().has(x.authorId)) return true;
  // Fallback: name match for posts made before a device-ID reset (non-anonymous only)
  const n = getName();
  return !x.anonymous && !!n && x.authorName === n;
};
const who = (x) => mine(x) ? "You" : (x.authorName || "A student");
const repliesFor = (id) => state.replies.filter(r => r.parentId === id).sort((a, b) => (isMentor(b) - isMentor(a)) || (a.createdAt - b.createdAt));
// Verified mentors are listed by device ID in config.js; their answers get a badge and go first.
const MENTORS = new Map((CFG.mentors || []).filter(m => m && m.id).map(m => [m.id, m.name || "Mentor"]));
const isMentor = (x) => (x && !x.anonymous && MENTORS.has(x.authorId)) ? 1 : 0;
const likesFor = (id) => state.likes.filter(l => l.ideaId === id);
const liked = (id) => store && state.likes.some(l => l.ideaId === id && l.uid === store.uid);
function showNotice(text, cls) { const n = $("notice"); n.textContent = text; n.hidden = !text; n.className = "notice" + (cls ? " " + cls : ""); }
function errText(e) {
  const code = String((e && e.code) || "");
  const msg = String((e && e.message) || "");
  if (/Slow down|Too many posts|Not allowed|You can only write|cannot be changed/i.test(msg)) return msg;
  if (code === "42501" || /row-level security/i.test(msg)) return "The board refused this post. Check that the title is at least 3 characters and try again.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "No internet connection. Check it and try again.";
  if (code.includes("permission-denied")) return "The board refused this post. Check that the title is at least 3 characters and try again.";
  if (code.includes("unavailable") || code.includes("network")) return "No internet connection. Check it and try again.";
  return "Could not save" + (code ? " (" + code + ")" : "") + ". Try again.";
}

// ---------- stores ----------
// Each phone or browser gets a random device id kept in localStorage, sessionStorage, and a cookie
// so clearing just one storage doesn't orphan old posts.
function deviceId() {
  const KEY = "dd-device-id", HIST = "dd-old-ids";
  const readCookie = () => { try { const m = document.cookie.match(/(?:^|; )dd-did=([^;]+)/); return m ? m[1] : null; } catch (_) { return null; } };
  const writeCookie = (id) => { try { document.cookie = "dd-did=" + id + "; max-age=31536000; SameSite=Strict"; } catch (_) {} };
  let id = null;
  try { id = localStorage.getItem(KEY); } catch (_) {}
  if (!id) { try { id = sessionStorage.getItem(KEY); } catch (_) {} }
  if (!id) { id = readCookie(); }
  if (!id) {
    id = "d-" + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
  }
  try { localStorage.setItem(KEY, id); } catch (_) {}
  try { sessionStorage.setItem(KEY, id); } catch (_) {}
  writeCookie(id);
  return id;
}
// All device IDs this browser has ever used — lets mine() recognise old posts after a localStorage reset.
function allMyIds() {
  const KEY = "dd-device-id", HIST = "dd-old-ids";
  const cur = deviceId();
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem(HIST) || "[]"); } catch (_) {}
  if (!hist.includes(cur)) { hist.unshift(cur); hist = hist.slice(0, 8); try { localStorage.setItem(HIST, JSON.stringify(hist)); } catch (_) {} }
  const ids = new Set(hist);
  if (typeof store !== "undefined" && store && store.uid) ids.add(store.uid);
  return ids;
}
async function firebaseStore(conf, prefix = "") {
  const base = "https://www.gstatic.com/firebasejs/" + FB_VERSION + "/";
  const [{ initializeApp }, fs, st, au] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-storage.js"), import(base + "firebase-auth.js")]);
  const app = initializeApp(conf);
  const db = fs.getFirestore(app);
  const storage = st.getStorage(app);
  // Anonymous sign-in: no account, no password. It gives every browser a verified session so the
  // security rules can refuse requests that do not come from this app. If it fails (for example
  // the provider is not enabled yet) the app keeps working while the rules still allow it.
  let signedIn = false;
  try {
    const auth = au.getAuth(app);
    if (!auth.currentUser) await Promise.race([au.signInAnonymously(auth), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000))]);
    signedIn = !!auth.currentUser;
  } catch (e) { console.warn("Anonymous sign-in unavailable:", e && e.code || e && e.message); }
  return {
    uid: deviceId(), demo: false, authed: signedIn,
    subscribe: (coll, cb, onErr, since) => fs.onSnapshot(since ? fs.query(fs.collection(db, prefix + coll), fs.where("createdAt", ">", since)) : fs.collection(db, prefix + coll), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr),
    newId: (coll) => fs.doc(fs.collection(db, prefix + coll)).id,
    set: (coll, id, data) => fs.setDoc(fs.doc(db, prefix + coll, id), cleanDoc(data)),
    update: (coll, id, data) => fs.updateDoc(fs.doc(db, prefix + coll, id), cleanDoc(data)),
    remove: (coll, id) => fs.deleteDoc(fs.doc(db, prefix + coll, id)),
    get: async (coll, id) => { const snap = await fs.getDoc(fs.doc(db, prefix + coll, id)); return snap.exists() ? snap.data() : null; },
    uploadFile: async (file, onProgress) => {
      const ext = fileExt(file.name).replace(/[^a-z0-9]/g, "");
      if (!UPLOAD_EXT.has(ext)) throw new Error("This file type is not allowed. Use PDF, image, Office document or text files.");
      const path = "uploads/" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;
      const fileRef = st.ref(storage, path);
      const task = st.uploadBytesResumable(fileRef, file);
      await new Promise((res, rej) => {
        task.on("state_changed", snap => onProgress && onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)), rej, res);
      });
      return await st.getDownloadURL(fileRef);
    },
  };
}
// Supabase backend. Same interface as firebaseStore. Used when supabase.url and supabase.anonKey are set in config.js.
// Each visitor signs in anonymously; Row Level Security (supabase/schema.sql) does the access control.
async function supabaseStore(conf) {
  await new Promise((res, rej) => {
    if (window.supabase && window.supabase.createClient) return res();
    const sc = document.createElement("script");
    sc.src = new URL("vendor/supabase.js", import.meta.url).href;
    sc.onload = res; sc.onerror = () => rej(new Error("Could not load the Supabase library"));
    document.head.appendChild(sc);
  });
  const sb = window.supabase.createClient(conf.url, conf.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  let { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const r = await sb.auth.signInAnonymously();
    if (r.error) throw r.error;
    session = r.data.session;
  }
  const rowToDoc = (r) => ({ id: r.id, ...r.data });
  const handlers = {};
  sb.channel("spark-docs").on("postgres_changes", { event: "*", schema: "public", table: "spark_docs" }, (p) => {
    const row = p.eventType === "DELETE" ? p.old : p.new;
    const h = row && handlers[row.coll];
    if (h) h(p.eventType, row);
  }).subscribe();
  const check = (r) => { if (r && r.error) throw r.error; return r; };
  return {
    uid: session.user.id, demo: false,
    subscribe: (coll, cb, onErr) => {
      const cache = new Map(); let ready = false;
      const emit = () => { if (ready) cb([...cache.values()]); };
      handlers[coll] = (type, row) => { if (type === "DELETE") cache.delete(row.id); else cache.set(row.id, rowToDoc(row)); emit(); };
      (async () => {
        try {
          for (let from = 0; from < 20000; from += 1000) {
            const { data, error } = await sb.from("spark_docs").select("id,data").eq("coll", coll).order("created_at", { ascending: false }).range(from, from + 999);
            if (error) throw error;
            for (const r of data) if (!cache.has(r.id)) cache.set(r.id, rowToDoc(r));
            if (data.length < 1000) break;
          }
          ready = true; emit();
        } catch (e) { if (onErr) onErr(e); }
      })();
      return () => { delete handlers[coll]; };
    },
    newId: () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").slice(0, 20) : Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12)),
    set: async (coll, id, data) => { check(await sb.from("spark_docs").upsert({ coll, id, data: cleanDoc(data) }, { onConflict: "coll,id" })); },
    update: async (coll, id, patch) => {
      patch = cleanDoc(patch);
      const keys = Object.keys(patch);
      if (keys.length === 1 && keys[0] === "reports") check(await sb.rpc("spark_report", { p_coll: coll, p_id: id }));
      else check(await sb.rpc("spark_patch", { p_coll: coll, p_id: id, p_patch: patch }));
    },
    remove: async (coll, id) => { check(await sb.from("spark_docs").delete().eq("coll", coll).eq("id", id)); },
    get: async (coll, id) => { const r = check(await sb.from("spark_docs").select("data").eq("coll", coll).eq("id", id).maybeSingle()); return r.data ? r.data.data : null; },
    uploadFile: async (file, onProgress) => {
      const ext = fileExt(file.name).replace(/[^a-z0-9]/g, "");
      if (!UPLOAD_EXT.has(ext)) throw new Error("This file type is not allowed. Use PDF, image, Office document or text files.");
      const path = session.user.id + "/" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;
      if (onProgress) onProgress(30);
      check(await sb.storage.from("uploads").upload(path, file, { contentType: file.type || undefined, upsert: false }));
      if (onProgress) onProgress(100);
      return sb.storage.from("uploads").getPublicUrl(path).data.publicUrl;
    },
  };
}
function localStore() {
  const KEY = "dd-demo-data";
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) {}
  let uid = "";
  try { uid = localStorage.getItem("dd-demo-uid") || ""; if (!uid) { uid = "demo-" + Math.random().toString(36).slice(2); localStorage.setItem("dd-demo-uid", uid); } } catch (_) { uid = "demo-user"; }
  const subs = {};
  const emit = (coll) => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
    const rows = Object.entries(data[coll] || {}).map(([id, v]) => ({ id, ...v }));
    (subs[coll] || []).forEach(cb => cb(rows));
  };
  return {
    uid, demo: true,
    subscribe: (coll, cb) => { (subs[coll] ||= []).push(cb); setTimeout(() => emit(coll), 0); return () => {}; },
    newId: () => Math.random().toString(36).slice(2, 12),
    set: async (coll, id, v) => { (data[coll] ||= {})[id] = v; emit(coll); },
    update: async (coll, id, v) => { (data[coll] ||= {})[id] = { ...(data[coll][id] || {}), ...v }; emit(coll); },
    remove: async (coll, id) => { if (data[coll]) delete data[coll][id]; emit(coll); },
    get: async (coll, id) => (data[coll] || {})[id] || null,
  };
}

// ---------- safety: class code, language filter, spam limit, reports ----------
const PRIVATE = !!CFG.privateClass;
function getCode() { try { return localStorage.getItem("dd-class-code") || ""; } catch (_) { return ""; } }
function setCode(v) { try { v ? localStorage.setItem("dd-class-code", v) : localStorage.removeItem("dd-class-code"); } catch (_) {} }
const cleanCode = (v) => String(v || "").trim().toUpperCase().replace(/\s+/g, "");

// Words that block a post. Matching ignores case and common symbol swaps (@ for a, 0 for o, and so on).
const BLOCKED = ["fuck", "fucker", "fucking", "motherfucker", "shit", "bitch", "bastard", "asshole", "dick", "pussy", "slut", "whore", "cunt", "nigga", "nigger",
  "madarchod", "behenchod", "bhenchod", "bhosdike", "bhosdi", "chutiya", "chutiye", "gandu", "lund", "randi", "harami", "kamina", "kutta",
  "lanja", "lanjakodaka", "dengu", "dengey", "puku", "modda", "pooku", "naayala", "nayala", "sulli", "otha", "punda", "thevidiya"];
function hasBadWords(text) {
  const t = " " + String(text || "").toLowerCase().replace(/[@4]/g, "a").replace(/[0]/g, "o").replace(/[1!|]/g, "i").replace(/[3]/g, "e").replace(/[$5]/g, "s").replace(/[^a-z\u0900-\u0d7f]+/g, " ") + " ";
  const joined = t.replace(/ /g, "");
  return BLOCKED.some(w => t.includes(" " + w + " ") || t.includes(" " + w + "s ") || (w.length >= 8 && joined.includes(w)));
}
const LANGUAGE_MSG = "Please keep it respectful. Remove abusive words and try again.";

// At most one post every 15 seconds and 15 posts an hour from one phone or computer.
function spamCheck() {
  let times = [];
  try { times = JSON.parse(localStorage.getItem("dd-post-times") || "[]"); } catch (_) {}
  const now = Date.now(), recent = times.filter(t => now - t < 3600000);
  if (recent.length && now - recent[recent.length - 1] < 15000) return "Slow down a little, wait " + Math.ceil((15000 - (now - recent[recent.length - 1])) / 1000) + " more seconds before posting again.";
  if (recent.length >= 15) return "You have posted 15 times in the last hour. Take a short break and try again later.";
  return "";
}
function notePosted() {
  let times = [];
  try { times = JSON.parse(localStorage.getItem("dd-post-times") || "[]"); } catch (_) {}
  times = [...times.filter(t => Date.now() - t < 3600000), Date.now()];
  try { localStorage.setItem("dd-post-times", JSON.stringify(times)); } catch (_) {}
}

// Posts reported by this many classmates are hidden until the teacher checks them in Firebase.
const REPORT_LIMIT = 3;
const isHidden = (x) => (x.reports || []).length >= REPORT_LIMIT && !mine(x);
const reportedByMe = (x) => store && (x.reports || []).includes(store.uid);
async function reportPost(coll, x) {
  if (!store || reportedByMe(x)) return;
  const reports = [...new Set([...(x.reports || []), store.uid])].slice(0, 100);
  try { await store.update(coll, x.id, { reports }); showNotice("Thanks. The post was reported. Posts with " + REPORT_LIMIT + " reports are hidden for everyone."); }
  catch (e) { showNotice(errText(e)); }
}
function reportButton(coll, x) {
  if (mine(x)) return null;
  if (reportedByMe(x)) return el("span", { class: "hint" }, "🚩 Reported");
  return el("button", { class: "linkbtn danger", type: "button", title: "Report abuse or spam", onclick: (e) => {
    const b = e.currentTarget;
    if (b.dataset.armed) { b.disabled = true; reportPost(coll, x); return; }
    b.dataset.armed = "1"; b.textContent = "Tap again to report";
    setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "🚩 Report"; } }, 3000);
  } }, "🚩 Report");
}
// Delete only hides a post (deleted: true); nothing is erased, so the teacher can restore it in Firebase.
const softDelete = (coll, id) => store.update(coll, id, { deleted: true });

// GATE PYQ papers data — official GATE archive + GeeksForGeeks solutions (all free, no login)
const GATE_PYQ = {
  ECE: [
    { year: "2025", pdf: "https://gate2025.iitr.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2025-ec-question-paper/", label: "EC 2025" },
    { year: "2024", pdf: "https://gate2024.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2024-ec-question-paper/", label: "EC 2024" },
    { year: "2023", pdf: "https://gate.iitk.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2023-ec-question-paper/", label: "EC 2023" },
    { year: "2022", pdf: "https://gate.iitkgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2022-ec-question-paper/", label: "EC 2022" },
    { year: "2021", pdf: "https://gate.iitb.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2021-ec-question-paper/", label: "EC 2021" },
    { year: "2020", pdf: "https://gate.iitd.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2020-ec-question-paper/", label: "EC 2020" },
    { year: "2019", pdf: "https://www.gate.iitm.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2019-ec-question-paper/", label: "EC 2019" },
    { year: "2018", pdf: "https://www.goaps.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2018-ec-question-paper/", label: "EC 2018" },
    { year: "2017", pdf: "https://www.iitroorkee.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2017-ec-question-paper/", label: "EC 2017" },
    { year: "2016", pdf: "https://www.iisckgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2016-ec-question-paper/", label: "EC 2016" },
  ],
  CSE: [
    { year: "2025", pdf: "https://gate2025.iitr.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2025-cs-question-paper/", label: "CS 2025" },
    { year: "2024", pdf: "https://gate2024.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2024-cs-question-paper/", label: "CS 2024" },
    { year: "2023", pdf: "https://gate.iitk.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2023-cs-question-paper/", label: "CS 2023" },
    { year: "2022", pdf: "https://gate.iitkgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2022-cs-question-paper/", label: "CS 2022" },
    { year: "2021", pdf: "https://gate.iitb.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2021-cs-question-paper/", label: "CS 2021" },
    { year: "2020", pdf: "https://gate.iitd.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2020-cs-question-paper/", label: "CS 2020" },
    { year: "2019", pdf: "https://www.gate.iitm.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2019-cs-question-paper/", label: "CS 2019" },
    { year: "2018", pdf: "https://www.goaps.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2018-cs-question-paper/", label: "CS 2018" },
    { year: "2017", pdf: "https://www.iitroorkee.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2017-cs-question-paper/", label: "CS 2017" },
    { year: "2016", pdf: "https://www.iisckgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2016-cs-question-paper/", label: "CS 2016" },
  ],
  EEE: [
    { year: "2025", pdf: "https://gate2025.iitr.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2025-ee-question-paper/", label: "EE 2025" },
    { year: "2024", pdf: "https://gate2024.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2024-ee-question-paper/", label: "EE 2024" },
    { year: "2023", pdf: "https://gate.iitk.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2023-ee-question-paper/", label: "EE 2023" },
    { year: "2022", pdf: "https://gate.iitkgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2022-ee-question-paper/", label: "EE 2022" },
    { year: "2021", pdf: "https://gate.iitb.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2021-ee-question-paper/", label: "EE 2021" },
    { year: "2020", pdf: "https://gate.iitd.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2020-ee-question-paper/", label: "EE 2020" },
    { year: "2019", pdf: "https://www.gate.iitm.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2019-ee-question-paper/", label: "EE 2019" },
    { year: "2018", pdf: "https://www.goaps.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2018-ee-question-paper/", label: "EE 2018" },
    { year: "2017", pdf: "https://www.iitroorkee.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2017-ee-question-paper/", label: "EE 2017" },
    { year: "2016", pdf: "https://www.iisckgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2016-ee-question-paper/", label: "EE 2016" },
  ],
  Civil: [
    { year: "2025", pdf: "https://gate2025.iitr.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2025-ce-question-paper/", label: "CE 2025" },
    { year: "2024", pdf: "https://gate2024.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2024-ce-question-paper/", label: "CE 2024" },
    { year: "2023", pdf: "https://gate.iitk.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2023-ce-question-paper/", label: "CE 2023" },
    { year: "2022", pdf: "https://gate.iitkgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2022-ce-question-paper/", label: "CE 2022" },
    { year: "2021", pdf: "https://gate.iitb.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2021-ce-question-paper/", label: "CE 2021" },
    { year: "2020", pdf: "https://gate.iitd.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2020-ce-question-paper/", label: "CE 2020" },
    { year: "2019", pdf: "https://www.gate.iitm.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2019-ce-question-paper/", label: "CE 2019" },
    { year: "2018", pdf: "https://www.goaps.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2018-ce-question-paper/", label: "CE 2018" },
    { year: "2017", pdf: "https://www.iitroorkee.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2017-ce-question-paper/", label: "CE 2017" },
    { year: "2016", pdf: "https://www.iisckgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2016-ce-question-paper/", label: "CE 2016" },
  ],
  Mech: [
    { year: "2025", pdf: "https://gate2025.iitr.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2025-me-question-paper/", label: "ME 2025" },
    { year: "2024", pdf: "https://gate2024.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2024-me-question-paper/", label: "ME 2024" },
    { year: "2023", pdf: "https://gate.iitk.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2023-me-question-paper/", label: "ME 2023" },
    { year: "2022", pdf: "https://gate.iitkgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2022-me-question-paper/", label: "ME 2022" },
    { year: "2021", pdf: "https://gate.iitb.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2021-me-question-paper/", label: "ME 2021" },
    { year: "2020", pdf: "https://gate.iitd.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2020-me-question-paper/", label: "ME 2020" },
    { year: "2019", pdf: "https://www.gate.iitm.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2019-me-question-paper/", label: "ME 2019" },
    { year: "2018", pdf: "https://www.goaps.iisc.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2018-me-question-paper/", label: "ME 2018" },
    { year: "2017", pdf: "https://www.iitroorkee.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2017-me-question-paper/", label: "ME 2017" },
    { year: "2016", pdf: "https://www.iisckgp.ac.in/", sol: "https://www.geeksforgeeks.org/gate-2016-me-question-paper/", label: "ME 2016" },
  ],
};

function renderGatePYQPanel(branch) {
  const papers = GATE_PYQ[branch] || [];
  const icons = { ECE: "📡", CSE: "💻", EEE: "⚡", Civil: "🏗️", Mech: "⚙️" };
  return el("div", { class: "pyq-panel" },
    el("div", { class: "pyq-panel-hdr" },
      el("span", { class: "pyq-panel-title" }, icons[branch] || "📄", " ", branch, " — Previous Year Papers"),
      el("span", { class: "pyq-panel-sub" }, "2016–2025 · Free PDFs & solved solutions"),
    ),
    el("div", { class: "pyq-paper-grid" },
      ...papers.map(p =>
        el("div", { class: "pyq-paper-row" },
          el("span", { class: "pyq-paper-year" }, p.year),
          el("a", { class: "btn sm pyq-btn", href: p.sol, target: "_blank", rel: "noopener noreferrer" },
            "✅ Solutions"
          ),
          el("a", { class: "btn sm pyq-btn-2", href: "https://gate.iitd.ac.in/GATE2024/downloads.php", target: "_blank", rel: "noopener noreferrer" },
            "📄 Official"
          ),
        )
      )
    ),
    el("div", { class: "pyq-panel-note" },
      "Solutions by GeeksforGeeks · Official archive at gate.iitd.ac.in · All free, no login"
    ),
  );
}

function renderGate(err) {
  const form = el("form", { class: "form", onsubmit: (e) => {
    e.preventDefault();
    const v = cleanCode(form.elements.code.value);
    if (!/^[A-Z0-9-]{4,40}$/.test(v)) { msg.textContent = "Enter the class code exactly as your teacher shared it."; msg.hidden = false; return; }
    setCode(v); location.reload();
  } });
  const msg = el("p", { class: "err", hidden: !err }, err || "");
  form.append(
    el("label", {}, "Class code", el("input", { id: "f-code", name: "code", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", placeholder: "e.g. GB-XXXXXX", maxlength: "40" })),
    msg,
    el("p", { class: "hint" }, "Ask your class representative or teacher for the code. It is saved on this phone, so you only enter it once."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "submit" }, "Join class")));
  // Show gate in the centre list column so it is visible on all screen sizes
  $("list").replaceChildren(el("div", { class: "gate-card" },
    el("h2", {}, "🔐 Enter your class code"), form));
  $("sheet").replaceChildren();
  $("rail").replaceChildren();
  ["askBtn", "quizBtn", "leadersBtn", "nameBtn"].forEach(id => { const el = $(id); if (el) el.hidden = true; });
  setTimeout(() => form.elements.code.focus(), 0);
}

// ---------- notebook pages: photos, uploaded images and handwriting ----------
const PAGE_ONLY = "(see attached notebook page)";
const pageCache = new Map(); // page id -> data URL, or a promise of one while loading

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable image")); };
    img.src = url;
  });
}
// Shrinks a photo or drawing to a JPEG small enough for one database document (about 500 KB).
function toJpeg(src, w, h, limit = 700000) {
  let scale = Math.min(1, 1400 / Math.max(w, h)), q = 0.78;
  for (let i = 0; i < 8; i++) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
    const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(src, 0, 0, c.width, c.height);
    const url = c.toDataURL("image/jpeg", q);
    if (url.length <= limit) return url;
    if (q > 0.5) q -= 0.1; else scale *= 0.8;
  }
  throw new Error("image too large");
}
async function savePages(urls, parentId, ids) {
  const out = [];
  for (let i = 0; i < urls.length; i++) {
    const id = (ids && ids[i]) || store.newId("pages");
    pageCache.set(id, urls[i]);
    await store.set("pages", id, { data: urls[i], parentId, createdAt: Date.now() });
    out.push(id);
  }
  return out;
}
// Saves pages and returns what the post should store in `pages`: page ids, or, when the
// database refuses the pages collection (older rules), the photos themselves made small
// enough to fit inside the post. Returns [] if nothing could be kept.
async function trySavePages(urls, parentId, ids) {
  if (!urls.length) return [];
  try { return await savePages(urls, parentId, ids); }
  catch (e) {
    console.error(e);
    try { return await Promise.all(urls.map(u => shrinkDataUrl(u, Math.floor(700000 / urls.length)))); }
    catch (_) {
      showNotice("Your text was posted, but the photo or notebook page could not be saved. Check your internet and add it again with Edit.");
      return [];
    }
  }
}
function shrinkDataUrl(u, limit) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { try { resolve(toJpeg(img, img.naturalWidth, img.naturalHeight, limit)); } catch (e) { reject(e); } };
    img.onerror = reject;
    img.src = u;
  });
}
// Pages are kept when a post is deleted, so a deleted post can still be restored with its pages.
async function removePages() {}
const SAFE_IMAGE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
async function loadPage(id) {
  if (String(id).startsWith("data:")) return SAFE_IMAGE.test(id) ? id : null;
  if (!pageCache.has(id)) pageCache.set(id, store.get("pages", id).then(d => (d && d.data) || null).catch(() => null));
  let url = await pageCache.get(id);
  if (url && !SAFE_IMAGE.test(url)) url = null;
  pageCache.set(id, url);
  return url;
}

function pagesView(ids) {
  return el("div", { class: "thumbs" }, ids.map((id, i) => {
    const img = el("img", { alt: "Notebook page " + (i + 1) });
    loadPage(id).then(u => { if (u) img.src = u; else img.alt = "Page not available"; });
    return el("button", { type: "button", class: "thumb", "aria-label": "Open page " + (i + 1), onclick: () => openViewer(ids, i) }, img);
  }));
}

// Buttons to add pages to a post or reply. `list` collects data URLs and is kept by the caller.
function attachPicker(list, max) {
  const thumbs = el("div", { class: "thumbs" });
  const msg = el("p", { class: "hint", hidden: true });
  const say = (t) => { msg.textContent = t; msg.hidden = !t; };
  const draw = () => {
    thumbs.replaceChildren(...list.map((u, i) => el("div", { class: "thumb" },
      el("img", { src: u, alt: "Page " + (i + 1) }),
      el("button", { type: "button", class: "x", "aria-label": "Remove page " + (i + 1), onclick: () => { list.splice(i, 1); say(""); draw(); } }, "×"))));
  };
  const add = async (files) => {
    say("");
    for (const f of files) {
      if (list.length >= max) { say("You can attach up to " + max + " pages."); break; }
      try { const img = await loadImage(f); list.push(toJpeg(img, img.naturalWidth, img.naturalHeight)); }
      catch (_) { say("Could not read that file. Use a JPG or PNG photo."); }
    }
    // The answer box may have been redrawn by a live update while the file picker was open.
    if (thumbs.isConnected) draw(); else render();
  };
  const pick = (capture) => {
    if (list.length >= max) { say("You can attach up to " + max + " pages."); return; }
    const inp = el("input", { type: "file", accept: "image/*", multiple: !capture, capture: capture ? "environment" : null, hidden: true });
    inp.addEventListener("change", () => { add([...inp.files]); inp.remove(); });
    document.body.append(inp); inp.click();
  };
  draw();
  if (max <= 0) return null;
  return el("div", { class: "attach" },
    el("div", { class: "rowbtns" },
      el("button", { type: "button", class: "btn sm", onclick: () => pick(true) }, "📷 Take photo"),
      el("button", { type: "button", class: "btn sm", onclick: () => pick(false) }, "🖼 Upload image"),
      el("button", { type: "button", class: "btn sm", onclick: () => {
        if (list.length >= max) { say("You can attach up to " + max + " pages."); return; }
        openNotebook((u) => { list.push(u); draw(); });
      } }, "✍ Write on notebook")),
    thumbs, msg);
}

const FILE_ICONS = { pdf: "📄", doc: "📝", docx: "📝", ppt: "📊", pptx: "📊", xls: "📈", xlsx: "📈", zip: "🗜", rar: "🗜", mp4: "🎬", mp3: "🎵", txt: "📃", csv: "📋" };
const fileIcon = (name) => { const ext = (name || "").split(".").pop().toLowerCase(); return FILE_ICONS[ext] || "📁"; };
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function filePicker(list) {
  const rows = el("div", { class: "file-list" });
  const msg = el("p", { class: "hint", hidden: true });
  const say = (t) => { msg.textContent = t; msg.hidden = !t; };
  const draw = () => {
    rows.replaceChildren(...list.map((f, i) => el("div", { class: "file-item" },
      el("span", { class: "file-ico" }, fileIcon(f.name)),
      el("span", { class: "file-name" }, f.name),
      f.pct !== undefined ? el("span", { class: "file-pct" }, f.pct + "%") : el("span", { class: "file-size" }, (f.size / 1024 < 1000 ? (f.size / 1024).toFixed(0) + " KB" : (f.size / 1024 / 1024).toFixed(1) + " MB")),
      el("button", { type: "button", class: "x", disabled: f.pct !== undefined, "aria-label": "Remove",
        onclick: () => { list.splice(i, 1); say(""); draw(); }
      }, "×"))));
  };
  const add = async (files) => {
    say("");
    for (const f of files) {
      if (list.length >= 5) { say("You can attach up to 5 files."); break; }
      if (f.size > MAX_FILE_SIZE) { say(f.name + " is too large (max 20 MB)."); continue; }
      if (!UPLOAD_EXT.has(fileExt(f.name))) { say(f.name + " is not allowed. Use PDF, image, Office document or text files."); continue; }
      const entry = { name: f.name, size: f.size, url: null, pct: 0 };
      list.push(entry);
      if (rows.isConnected) draw();
      try {
        entry.url = await store.uploadFile(f, pct => { entry.pct = pct; if (rows.isConnected) draw(); });
        delete entry.pct;
      } catch (err) {
        list.splice(list.indexOf(entry), 1);
        const isRules = String(err).includes("unauthorized") || String(err).includes("permission") || String(err).includes("storage/unauthorized");
        say(isRules ? "Storage not enabled yet. In Firebase Console → Storage → Rules, allow writes for the uploads/ path." : "Upload failed: " + (err.message || err));
      }
      if (rows.isConnected) draw();
    }
  };
  draw();
  return el("div", { class: "file-attach" },
    el("button", { type: "button", class: "btn sm", onclick: () => {
      const inp = el("input", { type: "file", accept: "*/*", multiple: true, hidden: true });
      inp.addEventListener("change", () => { add([...inp.files]); inp.remove(); });
      document.body.append(inp); inp.click();
    }}, "📎 Attach file (PDF, Word, any format)"),
    rows, msg);
}

function renderFileAttachments(files) {
  if (!files || !files.length) return null;
  return el("div", { class: "file-attachments" },
    ...files.map(f => el("a", { class: "file-dl", href: /^https?:\/\//i.test(f.url || "") ? f.url : "#", target: "_blank", rel: "noopener noreferrer" },
      el("span", { class: "file-ico" }, fileIcon(f.name)),
      el("div", { class: "file-meta" },
        el("span", { class: "file-dl-name" }, f.name),
        el("span", { class: "file-dl-size" }, f.size < 1024 * 1024 ? (f.size / 1024).toFixed(0) + " KB" : (f.size / 1024 / 1024).toFixed(1) + " MB")),
      el("span", { class: "file-dl-btn" }, "⬇ Download")
    ))
  );
}

// YouTube auto-card: detect YouTube links in post/reply body and render thumbnail cards
function extractYtIds(text) {
  if (!text) return [];
  const re = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^&\s]*&)*v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/g;
  const ids = []; let m;
  while ((m = re.exec(text)) !== null) ids.push(m[1]);
  return [...new Set(ids)];
}
function renderYtCards(text) {
  const ids = extractYtIds(text);
  if (!ids.length) return null;
  return el("div", { class: "yt-cards" },
    ...ids.map(id => el("a", {
      href: "https://www.youtube.com/watch?v=" + id,
      target: "_blank", rel: "noopener noreferrer", class: "yt-card"
    },
      el("div", { class: "yt-thumb-wrap" },
        el("img", { src: "https://img.youtube.com/vi/" + id + "/mqdefault.jpg", alt: "YouTube video", class: "yt-thumb", loading: "lazy" }),
        el("div", { class: "yt-play-btn" }, "▶")
      ),
      el("span", { class: "yt-label" }, "▶ Watch on YouTube")
    ))
  );
}

function openViewer(ids, start) {
  let i = start;
  const img = el("img", { alt: "" });
  const cap = el("span", { class: "ovcap" });
  const body = el("div", { class: "ovbody" }, img);
  img.addEventListener("click", () => img.classList.toggle("zoom"));
  const show = async () => {
    cap.textContent = "Page " + (i + 1) + " of " + ids.length + " · tap the page to zoom";
    img.classList.remove("zoom"); img.src = (await loadPage(ids[i])) || ""; img.alt = "Notebook page " + (i + 1);
  };
  const step = (d) => { i = (i + d + ids.length) % ids.length; show(); };
  const close = () => { ov.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); };
  const ov = el("div", { class: "overlay", role: "dialog", "aria-modal": "true", "aria-label": "Notebook page" },
    el("div", { class: "ovbar" }, cap,
      ids.length > 1 && el("button", { type: "button", class: "btn sm", onclick: () => step(-1) }, "‹ Prev"),
      ids.length > 1 && el("button", { type: "button", class: "btn sm", onclick: () => step(1) }, "Next ›"),
      el("button", { type: "button", class: "btn sm primary", onclick: close }, "Close")),
    body);
  document.addEventListener("keydown", onKey);
  document.body.append(ov);
  show();
}

// A notebook page students write on with a finger, stylus or mouse.
function drawPaper(x, W, H, kind) {
  x.fillStyle = "#fffef7"; x.fillRect(0, 0, W, H);
  if (kind === "ruled") {
    x.strokeStyle = "#b9cdf0"; x.lineWidth = 2;
    for (let y = 140; y < H; y += 50) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    x.strokeStyle = "#f2a3a3"; x.beginPath(); x.moveTo(110, 0); x.lineTo(110, H); x.stroke();
  } else if (kind === "grid") {
    x.strokeStyle = "#dbe4f3"; x.lineWidth = 1.5;
    for (let v = 40; v < W; v += 40) { x.beginPath(); x.moveTo(v, 0); x.lineTo(v, H); x.stroke(); }
    for (let v = 40; v < H; v += 40) { x.beginPath(); x.moveTo(0, v); x.lineTo(W, v); x.stroke(); }
  }
}
function openNotebook(onDone) {
  const W = 1000, H = 1400;
  let paper = "ruled", color = "#1d3fbf", size = 4, erasing = false, strokes = [], cur = null;
  const bg = el("canvas", { width: W, height: H, class: "nb-bg" });
  const ink = el("canvas", { width: W, height: H, class: "nb-ink", "aria-label": "Notebook page, draw here" });
  const bx = bg.getContext("2d"), ctx = ink.getContext("2d");
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  drawPaper(bx, W, H, paper);
  const style = (s) => { ctx.globalCompositeOperation = s.erase ? "destination-out" : "source-over"; ctx.strokeStyle = s.color; ctx.lineWidth = s.size; };
  const drawStroke = (s) => {
    style(s); ctx.beginPath();
    s.pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]);
    ctx.stroke();
  };
  const redraw = () => { ctx.clearRect(0, 0, W, H); strokes.forEach(drawStroke); };
  const pos = (e) => { const r = ink.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  ink.addEventListener("pointerdown", (e) => {
    e.preventDefault(); ink.setPointerCapture(e.pointerId);
    cur = { color, size: erasing ? size * 6 : size, erase: erasing, pts: [pos(e)] };
    strokes.push(cur); drawStroke(cur);
  });
  ink.addEventListener("pointermove", (e) => {
    if (!cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    let last = cur.pts[cur.pts.length - 1];
    style(cur); ctx.beginPath(); ctx.moveTo(last[0], last[1]);
    for (const ev of (evs.length ? evs : [e])) { last = pos(ev); cur.pts.push(last); ctx.lineTo(last[0], last[1]); }
    ctx.stroke();
  });
  const end = () => { cur = null; };
  ink.addEventListener("pointerup", end); ink.addEventListener("pointercancel", end);

  const group = (label, items) => el("div", { class: "nbgroup", role: "group", "aria-label": label }, items);
  const pressed = (btns, active) => btns.forEach(b => b.setAttribute("aria-pressed", String(b === active)));
  const colors = [["Blue", "#1d3fbf"], ["Black", "#1b1b1f"], ["Red", "#c62828"], ["Green", "#1b7a3d"]].map(([n, c]) =>
    el("button", { type: "button", class: "swatch", style: "--sw:" + c, "aria-label": n + " pen", "aria-pressed": String(c === color), onclick: (e) => { color = c; erasing = false; pressed(colors, e.currentTarget); pressed([eraser], null); } }));
  const sizes = [["Fine", 2.5], ["Medium", 4], ["Bold", 8]].map(([n, v]) =>
    el("button", { type: "button", class: "btn sm", "aria-pressed": String(v === size), onclick: (e) => { size = v; pressed(sizes, e.currentTarget); } }, n));
  const eraser = el("button", { type: "button", class: "btn sm", "aria-pressed": "false", onclick: () => { erasing = !erasing; eraser.setAttribute("aria-pressed", String(erasing)); } }, "Eraser");
  const papers = [["Ruled", "ruled"], ["Grid", "grid"], ["Plain", "plain"]].map(([n, k]) =>
    el("button", { type: "button", class: "btn sm", "aria-pressed": String(k === paper), onclick: (e) => { paper = k; drawPaper(bx, W, H, paper); pressed(papers, e.currentTarget); } }, n));
  const msg = el("span", { class: "hint" });
  const close = () => { ov.remove(); document.documentElement.classList.remove("nb-open"); };
  const ov = el("div", { class: "overlay nb", role: "dialog", "aria-modal": "true", "aria-label": "Write on notebook" },
    el("div", { class: "ovbar nbbar" },
      group("Pen colour", colors), group("Pen size", sizes),
      group("Tools", [eraser,
        el("button", { type: "button", class: "btn sm", onclick: () => { strokes.pop(); redraw(); } }, "Undo"),
        el("button", { type: "button", class: "btn sm", onclick: () => { strokes = []; redraw(); } }, "Clear")]),
      group("Paper", papers)),
    el("div", { class: "nbpage" }, el("div", { class: "nbsheet" }, bg, ink)),
    el("div", { class: "ovbar" }, msg,
      el("button", { type: "button", class: "btn sm", onclick: close }, "Cancel"),
      el("button", { type: "button", class: "btn sm primary", onclick: () => {
        if (!strokes.length) { msg.textContent = "Write something on the page first."; return; }
        const out = el("canvas", { width: W, height: H });
        const ox = out.getContext("2d"); ox.drawImage(bg, 0, 0); ox.drawImage(ink, 0, 0);
        onDone(toJpeg(out, W, H)); close();
      } }, "Add this page")));
  document.documentElement.classList.add("nb-open");
  document.body.append(ov);
}

async function copyLink(btn, link) {
  const orig = btn.dataset.label || (btn.dataset.label = btn.textContent);
  try { await navigator.clipboard.writeText(link); btn.textContent = "Copied"; }
  catch (_) { btn.textContent = link; }
  setTimeout(() => { if (btn.isConnected) btn.textContent = orig; }, 2500);
}

// ---------- PWA install prompt ----------
let _pwaPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); _pwaPrompt = e;
  const banner = $('installBanner'); if (banner) banner.hidden = false;
});
window.addEventListener('appinstalled', () => {
  _pwaPrompt = null;
  const banner = $('installBanner'); if (banner) banner.hidden = true;
});

// ---------- online / offline ----------
function updateNetStatus() {
  const bar = $('offlineBar'); if (!bar) return;
  bar.hidden = navigator.onLine;
}
window.addEventListener('online', () => { updateNetStatus(); showNotice("You're back online.", ""); });
window.addEventListener('offline', updateNetStatus);

// ---------- new-posts toast ----------
let _newCount = 0, _seenSizes = {};
function trackNew(coll, rows) {
  const prev = _seenSizes[coll]; _seenSizes[coll] = rows.length;
  if (prev == null) return;
  const added = rows.length - prev;
  if (added > 0) {
    _newCount += added;
    const t = $('newToast');
    if (t) { const s = t.querySelector('span'); if (s) s.textContent = _newCount + ' new post' + (_newCount > 1 ? 's' : '') + ' arrived — tap to see ↑'; t.hidden = false; }
  }
}

// ---------- bottom navigation ----------
function renderBottomNav() {
  const nav = $('bottomNav'); if (!nav) return;
  const icons = { doubts: '❓', ideas: '💡', clubs: '🏛', gate: '🎯', challenges: '🎮', market: '🛒' };
  const labels = { doubts: 'Doubts', ideas: 'Ideas', clubs: 'Clubs', gate: 'GATE', challenges: 'Challenges', market: 'Market' };
  nav.replaceChildren(
    ...['doubts', 'ideas', 'clubs', 'market', 'gate'].map(tab => {
      const cnt = state[TABS[tab].coll].length;
      return el('button', { type: 'button', class: 'bnav-btn' + (state.tab === tab ? ' active' : ''), onclick: () => {
        if (state.tab === tab) { openAsk(); return; }
        state.tab = tab; state.group = 'All'; state.filter = 'all'; state.query = '';
        state.selected = null; state.mode = 'intro'; state.gateYearPick = null; state.gateResView = null; $('search').value = '';
        try { history.replaceState(null, '', '#' + tab); } catch (_) {} render(); openAsk();
      } },
        el('span', { class: 'bnav-icon' }, icons[tab]),
        el('span', { class: 'bnav-label' }, labels[tab]),
        cnt > 0 && el('span', { class: 'bnav-count' }, cnt > 99 ? '99+' : String(cnt))
      );
    }),
    el('button', { type: 'button', class: 'bnav-btn', onclick: () => showPanel('leaders') },
      el('span', { class: 'bnav-icon' }, '🏆'), el('span', { class: 'bnav-label' }, 'Board')),
    el('button', { type: 'button', class: 'bnav-btn' + (!getName() ? ' bnav-pulse' : ''), onclick: () => { state.afterName = null; showPanel(getName() ? 'me' : 'name'); } },
      avatarEl(getName() ? getAvatar() : '👤', 'av bnav-av'), el('span', { class: 'bnav-label' }, getName() ? 'Me' : 'Profile'))
  );
}

// ---------- rendering ----------
function renderTrendBar() {
  const bar = document.getElementById("trendBar");
  if (!bar) return;
  const cutoff = Date.now() - 6 * 3600 * 1000; // last 6 hours
  const counts = {};
  for (const d of state.doubts) if ((d.createdAt || 0) > cutoff) counts[d.subject] = (counts[d.subject] || 0) + 2;
  for (const r of state.replies) if ((r.createdAt || 0) > cutoff) {
    const parent = state.doubts.find(d => d.id === r.parentId);
    if (parent) counts[parent.subject] = (counts[parent.subject] || 0) + 1;
  }
  const hot = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!hot.length) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.replaceChildren(
    el("span", { class: "trend-label" }, "🔥 Trending now"),
    ...hot.map(([s, n]) => el("button", { class: "trend-chip", type: "button",
      onclick: () => { state.tab = "doubts"; state.group = s; state.selected = null; state.mode = "intro"; state.filter = "all"; state.query = ""; render(); }
    }, el("span", { ...colorAttrs(s, "doubts") }, s), el("span", { class: "trend-n" }, "+" + n)))
  );
}


function trendingSubject() {
  const now = Date.now(), hour = 3600000;
  const recent = state.doubts.filter(d => now - d.createdAt < hour * 6);
  if (recent.length < 2) return null;
  const counts = {};
  for (const d of recent) counts[d.subject] = (counts[d.subject] || 0) + 1;
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return top && top[1] >= 2 ? top[0] : null;
}

function renderHeader() {
  const t = TABS[state.tab];
  document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));

  $("askBtn").textContent = t.ask;
  const me = store && state.loaded ? allStats().get(store.uid) : null;
  const myC = getCampus();
  const nb = $("nameBtn");
  if (getName()) {
    nb.replaceChildren(avatarEl(getAvatar(), "av av-nb"), document.createTextNode(" " + getName() + (me ? " · Lv " + me.level.n + (me.streak ? " · 🔥" + me.streak : "") : "")));
  } else { nb.textContent = "Set your name"; }

  // Campus filter chips
  const campusBar = $("campusBar");
  if (campusBar && CAMPUSES.length > 0) {
    campusBar.hidden = false;
    campusBar.replaceChildren(
      ...[
        el("span", { class: "campus-label" }, "Campus"),
        ...["all", ...CAMPUSES].map(c =>
          el("button", { type: "button",
            class: "campus-chip" + (state.campusFilter === c ? " active" : ""),
            style: c !== "all" ? "--cc:" + campusColor(c) : "",
            onclick: () => { state.campusFilter = c; render(); if (c !== "all" && innerWidth <= 1000) setTimeout(() => { const l = $("list"); if (l) l.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80); }
          }, c === "all" ? "🌐 All" : c + " · " + campusPostCount(c))
        ),
        myC ? el("button", { type: "button", class: "campus-chip my",
          onclick: () => { state.mode = "campus"; render(); }
        }, "⚙ " + myC) : null,
      ].filter(Boolean)
    );
    // Year filter chips (only in doubts/gate)
    const yearBar = $("yearBar");
    if (yearBar) {
      const showYear = state.tab === "doubts" || state.tab === "gate";
      yearBar.hidden = !showYear;
      if (showYear) yearBar.replaceChildren(
        el("span", { class: "campus-label" }, "Batch"),
        ...["All", "E1", "E2", "E3", "E4"].map(y =>
          el("button", { type: "button", class: "campus-chip" + (state.yearFilter === y ? " active" : ""),
            onclick: () => { state.yearFilter = y; render(); if (y !== "All" && innerWidth <= 1000) setTimeout(() => { const l = $("list"); if (l) l.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80); }
          }, y === "All" ? "All Years" : y + " · " + yearPostCount(y))
        )
      );
    }
    // Trending subject
    const tr = trendingSubject();
    const trEl = $("trending");
    if (trEl) { trEl.hidden = !tr; if (tr) trEl.textContent = "📈 Trending now: " + tr; }
  }
  const ft = $("filterToggle");
  if (ft) {
    const open = document.querySelector("header.top").classList.contains("filters-open");
    const yr = (state.tab === "doubts" || state.tab === "gate") ? (state.yearFilter === "All" ? "All years" : state.yearFilter) : null;
    const camp = state.campusFilter === "all" ? "All campuses" : state.campusFilter;
    ft.replaceChildren(el("span", {}, "🎚️ Filters · " + camp + (yr ? " · " + yr : "")), el("span", {}, open ? "▲" : "▼"));
    ft.classList.toggle("on", state.campusFilter !== "all" || (yr && state.yearFilter !== "All"));
    ft.setAttribute("aria-expanded", String(open));
  }
  $("quizBtn").classList.toggle("dot", !!(store && state.loaded && QUIZ.length && !myQuizAnswer(dayNum())));
  $("search").placeholder = state.tab === "doubts" ? "Search doubts" : state.tab === "gate" ? "Search GATE discussions" : state.tab === "market" ? "Search listings" : state.tab === "clubs" ? "Search club posts" : state.tab === "challenges" ? "Search challenges" : state.tab === "jobs" ? "Search openings" : "Search ideas";
  $("rail").setAttribute("aria-label", t.groupLabel);
  const opts = state.tab === "doubts"
    ? [["all","Newest"],["asked","Most asked"],["open","Unanswered"],["mine","My posts"],["mentor","Needs mentor"],["done","Resolved"],["bounty","🎁 Bounty"]]
    : state.tab === "gate"
    ? [["all","Newest"],["mine","My posts"],["pyq","⭐ PYQ Only"],["1m","1️⃣ 1 Mark"],["2m","2️⃣ 2 Marks"],["easy","🟢 Easy"],["medium","🟡 Medium"],["hard","🔴 Hard"]]
    : state.tab === "jobs"
    ? [["all","Newest"],["open","Open now"],["soon","Closing soon"],["mine","My posts"]]
    : state.tab === "market"
    ? [["all","All listings"],["available","Available"],["sold","Sold"],["mine","My listings"]]
    : [["all", "Newest"], ["top", "Most liked"]];
  const f = $("filter");
  if (f.dataset.tab !== state.tab) {
    f.replaceChildren(...opts.map(([v, l]) => el("option", { value: v }, l)));
    f.dataset.tab = state.tab; f.value = state.filter;
  }
}

function renderRail() {
  const t = TABS[state.tab], rows = state[t.coll];
  const counts = {};
  for (const d of rows) counts[d[t.field]] = (counts[d[t.field]] || 0) + 1;
  const extra = Object.keys(counts).filter(s => !t.groups.includes(s));

  const deptTabs = (state.tab === "doubts" || state.tab === "gate") ? el("div", { class: "dept-tabs" },
    ...Object.keys(DEPT_MAP).map(d => el("button", {
      type: "button", class: "dept-tab" + (state.dept === d ? " active" : ""),
      onclick: () => { state.dept = state.dept === d ? "All" : d; state.group = "All"; render(); },
    }, d))
  ) : null;

  const showSubjects = !(state.tab === "doubts" || state.tab === "gate") || state.dept !== "All";
  const visibleSubjects = showSubjects
    ? ((state.tab === "doubts" || state.tab === "gate") && state.dept !== "All"
        ? [...DEPT_MAP[state.dept].filter(s => t.groups.includes(s)), ...extra]
        : [...t.groups, ...extra])
    : [];

  const subjGrid = visibleSubjects.length > 0 ? el("div", { class: "subj-grid" },
    ...visibleSubjects.map(s => el("button", {
      type: "button", class: "subj-chip" + (state.group === s ? " active" : ""), ...colorAttrs(s),
      onclick: () => { state.group = state.group === s ? "All" : s; render(); if (innerWidth <= 1000 && state.group !== "All") setTimeout(() => { const l = $("list"); if (l) l.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); },
    }, el("span", {}, s), el("span", { class: "n" }, counts[s] || 0)))
  ) : null;
  if (state.tab === "jobs") {
    const chips = el("div", { class: "dept-tabs" }, ...["All", ...t.groups].map(g => el("button", { type: "button", class: "dept-tab" + ((state.group === g || (g === "All" && state.group === "All")) ? " active" : ""), onclick: () => { state.group = g; render(); } }, g === "All" ? "All" : g + (counts[g] ? " (" + counts[g] + ")" : ""))));
    $("rail").replaceChildren(...[jobsHub(), chips].filter(Boolean)); return;
  }
  $("rail").replaceChildren(...[deptTabs, subjGrid].filter(Boolean));
}

function visible() {
  const t = TABS[state.tab], q = state.query.trim().toLowerCase();
  let rows = state[t.coll].filter(d => !isHidden(d) &&
    (state.group === "All" || d[t.field] === state.group) &&
    (!q || ((d.title || "") + " " + (d.body || "")).toLowerCase().includes(q)));
  if (state.campusFilter !== "all") rows = rows.filter(d => d.campus === state.campusFilter);
  if (state.yearFilter !== "All" && (state.tab === "doubts" || state.tab === "gate")) rows = rows.filter(d => d.year === state.yearFilter);
  if (state.tab === "doubts" && (state.filter === "open" || state.filter === "done")) rows = rows.filter(d => (state.filter === "done") === !!d.resolvedReplyId);
  if (state.tab === "doubts" && state.filter === "mentor") rows = rows.filter(needsMentor);
  if (state.tab === "doubts" && state.filter === "bounty") rows = rows.filter(d => d.bounty && !d.resolvedReplyId);
  if ((state.tab === "doubts" || state.tab === "gate") && state.filter === "mine") rows = rows.filter(d => store && d.authorId === store.uid);
  if (state.tab === "gate" && state.filter === "pyq") rows = rows.filter(d => !!d.pyqYear);
  if (state.tab === "gate" && state.gateYearPick) rows = rows.filter(d => d.pyqYear === state.gateYearPick);
  if (state.tab === "gate" && state.filter === "1m") rows = rows.filter(d => d.marks === "1M");
  if (state.tab === "gate" && state.filter === "2m") rows = rows.filter(d => d.marks === "2M");
  if (state.tab === "gate" && state.filter === "easy") rows = rows.filter(d => d.difficulty === "Easy");
  if (state.tab === "gate" && state.filter === "medium") rows = rows.filter(d => d.difficulty === "Medium");
  if (state.tab === "gate" && state.filter === "hard") rows = rows.filter(d => d.difficulty === "Hard");
  if (state.tab === "jobs") {
    if (state.filter === "open") rows = rows.filter(d => { const n = jobDaysLeft(d); return n == null || n >= 0; });
    if (state.filter === "soon") rows = rows.filter(d => { const n = jobDaysLeft(d); return n != null && n >= 0 && n <= 14; });
    if (state.filter === "mine") rows = rows.filter(d => store && d.authorId === store.uid);
  }
  rows.sort((a, b) => b.createdAt - a.createdAt);
  if (state.tab === "jobs" && state.filter === "soon") rows.sort((a, b) => jobDaysLeft(a) - jobDaysLeft(b));
  if (state.filter === "top" || state.filter === "asked") rows.sort((a, b) => likesFor(b.id).length - likesFor(a.id).length);
  else if (state.tab === "doubts") rows.sort((a, b) => (isUrgent(b) - isUrgent(a)) || (b.bounty ? 1 : 0) - (a.bounty ? 1 : 0) || (b.createdAt - a.createdAt));
  return rows;
}

function itemLink(id) { return location.origin + location.pathname + "#" + state.tab + "/" + id; }
const isUrgent = (d) => (d.urgent && !d.resolvedReplyId) ? 1 : 0;
function openItem(id) {
  if (state.selected !== id) state.replyPages = [];
  state.selected = id; state.mode = "view";
  try { history.replaceState(null, "", "#" + state.tab + "/" + id); } catch (_) {}
  render();
  if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" });
}

function deptBanner() {
  if ((state.tab !== "doubts" && state.tab !== "gate") || state.dept === "All") return null;
  const v = DEPT_VISUAL[state.dept]; if (!v) return null;
  return el("div", { class: "dept-banner", style: "background:" + v.bg },
    el("div", { class: "dept-banner-art" }, v.art),
    el("div", { class: "dept-banner-info" },
      el("strong", { class: "dept-banner-name" }, v.label),
      el("span", { class: "dept-banner-sub" }, v.sub)
    )
  );
}

// ===================== CAMPUS MARKET =====================
const MARKET_CONDITIONS = ["New", "Good", "Fair", "Worn"];
const CONDITION_COLOR = { New: "#10b981", Good: "#3b82f6", Fair: "#f59e0b", Worn: "#6b7280" };
// Books & Notes travel across campuses; everything else is campus-local
const CROSS_CAMPUS_CATEGORIES = new Set(["Books", "Notes"]);

function reportCount(listingId) { return state.marketReports.filter(r => r.listingId === listingId).length; }
function sellerFlagged(authorId) { return state.marketReports.filter(r => r.sellerId === authorId).length >= 5; }
function myRating(listingId) { return state.marketRatings.find(r => r.listingId === listingId && r.raterId === (store && store.uid)); }
function avgRating(listingId) {
  const rs = state.marketRatings.filter(r => r.listingId === listingId);
  return rs.length ? (rs.reduce((s, r) => s + r.score, 0) / rs.length) : null;
}
function alreadyReported(listingId) { return state.marketReports.some(r => r.listingId === listingId && r.reporterId === (store && store.uid)); }
function interestCount(listingId) { return state.marketInterests.filter(r => r.listingId === listingId).length; }
function myInterest(listingId) { return state.marketInterests.find(r => r.listingId === listingId && r.buyerId === (store && store.uid)); }
function interestsFor(listingId) { return state.marketInterests.filter(r => r.listingId === listingId); }

// ---------- market upgrades: quick filters, saved items, badges, wanted ads ----------
const MKT_DAY = 86400000;
const MKT_CHIPS = [["all", "All"], ["new", "🆕 New today"], ["free", "🆓 Free"], ["u500", "Under ₹500"], ["m2000", "₹500 to 2000"], ["o2000", "Above ₹2000"], ["wanted", "🔎 Wanted"], ["saved", "❤️ Saved"]];
const savedMkt = () => { try { return new Set(JSON.parse(localStorage.getItem("dd-mkt-saved") || "[]")); } catch (_) { return new Set(); } };
function toggleSavedMkt(id) { const set = savedMkt(); if (set.has(id)) set.delete(id); else set.add(id); try { localStorage.setItem("dd-mkt-saved", JSON.stringify([...set].slice(-300))); } catch (_) {} }
const isWantedAd = (d) => /^🔎\s*WANTED/i.test(d.title || "");
const isFreeItem = (d) => d.price === 0;
const isNewItem = (d) => !d.sold && Date.now() - d.createdAt < MKT_DAY;
const isHotItem = (d) => !d.sold && interestCount(d.id) >= 3;
const isStaleItem = (d) => !d.sold && Date.now() - d.createdAt > 30 * MKT_DAY;
function mktPrice(d) {
  if (isWantedAd(d)) return d.price ? "Budget ₹" + d.price : "Budget open";
  if (d.price === 0) return "🆓 FREE";
  return d.price ? "₹" + d.price : "Negotiable";
}
function mktSafetyTips() {
  return el("details", { class: "mkt-safe" }, el("summary", {}, "🛡️ Safe buying and selling tips"),
    el("ul", {},
      el("li", {}, "Meet in a public place on campus (library, canteen, main gate) in daylight, with a friend."),
      el("li", {}, "Check the item properly before you pay. Pay only after you are happy."),
      el("li", {}, "Never pay in advance, share an OTP, or accept a UPI “collect request” to receive money."),
      el("li", {}, "Be careful with prices that look too good to be true. Report suspicious listings."),
      el("li", {}, "College-issued laptops cannot be sold (RGUKT policy).")));
}
// Rough resale estimate: condition factor, then about 2% less for every month of use.
function priceHelper(getForm) {
  const out = el("p", { class: "hint" }), useBtn = el("button", { type: "button", class: "btn sm", hidden: true });
  const orig = el("input", { type: "number", min: "1", max: "999999", placeholder: "Original price ₹", "aria-label": "Original price" });
  const age = el("input", { type: "number", min: "0", max: "120", placeholder: "Months used", "aria-label": "Months used" });
  const calc = () => {
    const o = +orig.value, m = +age.value || 0; if (!(o > 0)) { out.textContent = "Enter what you paid when it was new."; useBtn.hidden = true; return; }
    const form = getForm(), cond = form.elements.condition ? form.elements.condition.value : "Good";
    const f = { New: 0.85, Good: 0.65, Fair: 0.45, Worn: 0.25 }[cond] || 0.5;
    const est = Math.max(10, Math.round((o * f * Math.pow(0.98, m)) / 10) * 10);
    out.textContent = "Fair price: about ₹" + Math.round(est * 0.9 / 10) * 10 + " to ₹" + Math.round(est * 1.1 / 10) * 10 + " (estimate). Suggested: ₹" + est + ".";
    useBtn.hidden = false; useBtn.textContent = "Use ₹" + est; useBtn.onclick = () => { const fm = getForm(); if (fm.elements.price) fm.elements.price.value = est; };
  };
  return el("details", { class: "mkt-safe" }, el("summary", {}, "💡 Fair price helper"), el("div", { class: "rowbtns" }, orig, age, el("button", { type: "button", class: "btn sm primary", onclick: calc }, "Suggest")), out, useBtn);
}

function visibleMarket() {
  const myCampus = getCampus();
  let rows = state.market.filter(r => !r.deleted);
  const q = state.query.trim().toLowerCase();
  if (q) rows = rows.filter(r => (r.title + " " + r.body + " " + r.category).toLowerCase().includes(q));
  if (state.group !== "All") rows = rows.filter(r => r.category === state.group);
  if (state.campusFilter && state.campusFilter !== "all") rows = rows.filter(r => r.campus === state.campusFilter);
  // Campus restriction: non-cross-campus items only visible within same campus
  if (myCampus) rows = rows.filter(r => CROSS_CAMPUS_CATEGORIES.has(r.category) || !r.campus || r.campus === myCampus);
  if (state.filter === "available") rows = rows.filter(r => !r.sold);
  if (state.filter === "sold") rows = rows.filter(r => r.sold);
  if (state.filter === "mine") rows = rows.filter(r => store && r.authorId === store.uid);
  const chip = state.mktChip || "all";
  if (chip === "new") rows = rows.filter(isNewItem);
  else if (chip === "free") rows = rows.filter(r => isFreeItem(r) && !isWantedAd(r));
  else if (chip === "u500") rows = rows.filter(r => r.price > 0 && r.price < 500 && !isWantedAd(r));
  else if (chip === "m2000") rows = rows.filter(r => r.price >= 500 && r.price <= 2000 && !isWantedAd(r));
  else if (chip === "o2000") rows = rows.filter(r => r.price > 2000 && !isWantedAd(r));
  else if (chip === "wanted") rows = rows.filter(isWantedAd);
  else if (chip === "saved") { const sv = savedMkt(); rows = rows.filter(r => sv.has(r.id)); }
  // sort
  if (state.mktSort === "price_asc") rows.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (state.mktSort === "price_desc") rows.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (state.mktSort === "popular") rows.sort((a, b) => interestCount(b.id) - interestCount(a.id));
  else rows.sort((a, b) => b.createdAt - a.createdAt);
  return rows;
}

function renderMarketList() {
  const rows = visibleMarket();
  const availCount = state.market.filter(r => !r.deleted && !r.sold).length;
  const sortSel = el("select", { class: "mkt-sort-sel", "aria-label": "Sort listings", onchange: (e) => { state.mktSort = e.target.value; render(); } },
    el("option", { value: "newest", selected: state.mktSort === "newest" }, "🕐 Newest"),
    el("option", { value: "price_asc", selected: state.mktSort === "price_asc" }, "💰 Price: Low→High"),
    el("option", { value: "price_desc", selected: state.mktSort === "price_desc" }, "💎 Price: High→Low"),
    el("option", { value: "popular", selected: state.mktSort === "popular" }, "🔥 Most Wanted"),
  );
  const mktBanner = el("div", { class: "mkt-banner" },
    el("div", { class: "mkt-banner-side" },
      el("div", { class: "mkt-banner-icon" }, "🛒"),
      el("div", {},
        el("strong", {}, "Campus Market"),
        el("div", { class: "hint" }, availCount + " available · " + state.market.filter(r => !r.deleted && isWantedAd(r)).length + " wanted · " + state.market.filter(r => !r.deleted && r.sold).length + " sold"),
      )
    ),
    el("div", { class: "mkt-banner-btns" },
      el("button", { class: "btn primary sm", type: "button", onclick: () => {
        state.filter = "available"; $("filter").value = "available"; render();
      }}, "🛍 Buy"),
      el("button", { class: "btn sell sm", type: "button", onclick: openAsk }, "📦 Sell"),
      sortSel,
    )
  );
  const mktChips = el("div", { class: "mkt-chips" }, MKT_CHIPS.map(([id, label]) => el("button", { type: "button", class: "mkt-chip" + ((state.mktChip || "all") === id ? " on" : ""), onclick: () => { state.mktChip = id; render(); } }, label)));
  const savedSet = savedMkt();
  if (!rows.length) {
    $("list").replaceChildren(
      mktBanner, campusHub(), mktChips, mktSafetyTips(),
      state.market.length
        ? el("div", { class: "empty" }, el("strong", {}, "Nothing matches"), " Try another category or clear the search.")
        : el("div", { class: "empty" }, el("strong", {}, "No listings yet"), " Be the first to sell something!")
    );
    return;
  }
  $("list").replaceChildren(
    mktBanner, campusHub(), mktChips, mktSafetyTips(),
    el("div", { class: "mkt-grid" },
      ...rows.map(d => {
        const condColor = CONDITION_COLOR[d.condition] || "#6b7280";
        return el("div", { class: "item-wrap" },
          el("button", { type: "button", class: "mkt-card" + (d.sold ? " mkt-sold" : ""), onclick: () => openItem(d.id) },
            el("div", { class: "mkt-card-top" },
              el("span", { class: "tag", ...colorAttrs(d.category) }, d.category),
              d.sold ? el("span", { class: "pill done" }, "✅ Sold") : el("span", { class: "pill open" }, isWantedAd(d) ? "🔎 Wanted" : "Available"),
              isNewItem(d) && el("span", { class: "pill bounty" }, "🆕 New"),
              isHotItem(d) && el("span", { class: "pill urgent" }, "🔥 Hot"),
              mine(d) && isStaleItem(d) && el("span", { class: "pill open" }, "⏳ Still available?"),
            ),
            el("h3", { class: "mkt-title" }, d.title),
            el("div", { class: "mkt-price-row" },
              el("span", { class: "mkt-price" + (d.price ? "" : " free") }, mktPrice(d)),
              d.condition && el("span", { class: "mkt-condition", style: "--cc:" + condColor }, d.condition),
              reportCount(d.id) >= 3 && el("span", { class: "mkt-flag", title: reportCount(d.id) + " students reported" }, "⚠️"),
            ),
            (() => { const avg = avgRating(d.id); return avg ? el("div", { class: "mkt-stars-row" }, starsDisplay(avg), el("span", { class: "hint" }, avg.toFixed(1))) : null; })(),
            el("div", { class: "mkt-card-footer" },
              el("div", { class: "mkt-card-author" },
                avatarEl(avatarFor(d.authorName || ""), "av-nb"),
                el("span", { class: "mkt-author-name" }, d.authorName || "Student"),
              ),
              el("div", { class: "mkt-card-meta" },
                interestCount(d.id) > 0 && el("span", { class: "mkt-interest-badge" }, "👥 " + interestCount(d.id)),
                d.campus && el("span", { class: "campus-badge sm", style: "--cc:" + campusColor(d.campus) }, d.campus),
                el("span", { class: "hint" }, ago(d.createdAt)),
              )
            )
          ),
          el("button", { type: "button", class: "mkt-save" + (savedSet.has(d.id) ? " on" : ""), "aria-label": savedSet.has(d.id) ? "Remove from saved" : "Save listing", onclick: (e) => { e.stopPropagation(); toggleSavedMkt(d.id); render(); } }, savedSet.has(d.id) ? "❤️" : "🤍"),
          mine(d) ? el("button", {
            type: "button", class: "item-del", title: "Delete", "aria-label": "Delete",
            onclick: (e) => { e.stopPropagation(); confirmDelete(e.currentTarget, async () => { await softDelete("market", d.id); if (state.selected === d.id) { state.selected = null; state.mode = "intro"; } render(); }); }
          }, "🗑") : null
        );
      })
    )
  );
}

function starsDisplay(avg) {
  const full = Math.round(avg);
  return el("span", { class: "mkt-stars", "aria-label": avg.toFixed(1) + " stars" },
    ...([1,2,3,4,5].map(i => el("span", { class: i <= full ? "star on" : "star" }, "★")))
  );
}

function renderReportPanel(d) {
  if (alreadyReported(d.id)) return el("p", { class: "hint mkt-reported" }, "✅ You've already reported this listing.");
  const REASONS = ["Wrong description", "Item already sold", "Fake / misleading price", "Spam or irrelevant"];
  let open = false;
  const panel = el("div", { class: "mkt-report-wrap" });
  const btn = el("button", { type: "button", class: "btn sm", onclick: () => {
    open = !open;
    panel.replaceChildren(btn, open ? form : null);
  }}, "🚩 Report listing");
  const sel = el("select", { name: "reason" }, REASONS.map(r => el("option", {}, r)));
  const form = el("div", { class: "mkt-report-form" },
    el("p", { class: "hint" }, "Help us keep the market trustworthy. This report is anonymous."),
    sel,
    el("div", { class: "rowbtns" },
      el("button", { type: "button", class: "btn danger sm", onclick: async () => {
        const reason = sel.value;
        const id = store.newId("marketReports");
        const doc = { listingId: d.id, sellerId: d.authorId, reporterId: store.uid, reason, createdAt: Date.now() };
        state.marketReports = [...state.marketReports, { id, ...doc }];
        await store.set("marketReports", id, doc);
        render();
      }}, "Submit report"),
      el("button", { type: "button", class: "btn sm", onclick: () => { open = false; panel.replaceChildren(btn); }}, "Cancel")
    )
  );
  panel.replaceChildren(btn);
  return panel;
}

function renderRatingPanel(d) {
  const existing = myRating(d.id);
  const avg = avgRating(d.id);
  const ratingCount = state.marketRatings.filter(r => r.listingId === d.id).length;
  const wrap = el("div", { class: "mkt-rating-wrap" });

  const header = el("div", { class: "mkt-rating-header" },
    el("strong", {}, "Rate this seller"),
    avg ? el("span", {}, " · ", starsDisplay(avg), " ", avg.toFixed(1), " (", String(ratingCount), " rating", ratingCount !== 1 ? "s" : "", ")") : el("span", { class: "hint" }, " · No ratings yet")
  );

  const stars = [1,2,3,4,5].map(i => {
    const s = el("button", { type: "button", class: "star-btn" + (existing && i <= existing.score ? " on" : ""), "aria-label": i + " star" + (i > 1 ? "s" : "") }, "★");
    s.addEventListener("mouseover", () => stars.forEach((b, j) => b.classList.toggle("on", j < i)));
    s.addEventListener("mouseout", () => stars.forEach((b, j) => b.classList.toggle("on", !!(existing && j < existing.score))));
    s.addEventListener("click", async () => {
      const id = existing ? existing.id : store.newId("marketRatings");
      const doc = { listingId: d.id, sellerId: d.authorId, raterId: store.uid, score: i, createdAt: Date.now() };
      if (existing) {
        state.marketRatings = state.marketRatings.map(r => r.id === id ? { ...r, score: i } : r);
        await store.update("marketRatings", id, { score: i });
      } else {
        state.marketRatings = [...state.marketRatings, { id, ...doc }];
        await store.set("marketRatings", id, doc);
      }
      render();
    });
    return s;
  });
  wrap.replaceChildren(header, el("div", { class: "mkt-star-picker" }, ...stars));
  return wrap;
}

function renderBuyPanel(d) {
  const already = myInterest(d.id);
  const count = interestCount(d.id);
  const waNum = (d.whatsapp || "").replace(/\D/g, "");
  const waLink = waNum.length >= 10 ? "https://wa.me/91" + waNum.slice(-10) + "?text=" + encodeURIComponent("Hi! I'm interested in your listing on RGUKT Spark: " + d.title + " (₹" + (d.price || "Negotiable") + ")") : null;

  if (already) {
    return el("div", { class: "mkt-buy-panel expressed" },
      el("div", { class: "mkt-buy-top" },
        el("span", { class: "mkt-buy-check" }, "✅"),
        el("div", {},
          el("strong", {}, "You've expressed interest"),
          el("div", { class: "hint" }, count + " student" + (count !== 1 ? "s" : "") + " interested · " + ago(already.createdAt)),
        )
      ),
      waLink && el("a", { class: "btn primary", href: waLink, target: "_blank", rel: "noopener noreferrer" }, "💬 Contact seller on WhatsApp"),
      !waLink && el("p", { class: "hint" }, "Seller hasn't shared a WhatsApp number. They can see you're interested."),
      el("button", { type: "button", class: "btn sm", onclick: async () => {
        state.marketInterests = state.marketInterests.filter(r => r.id !== already.id);
        await store.update("marketInterests", already.id, { deleted: true });
        render();
      }}, "↩ Remove interest")
    );
  }

  return el("div", { class: "mkt-buy-panel" },
    el("div", { class: "mkt-buy-top" },
      el("span", { class: "mkt-buy-icon" }, "🛒"),
      el("div", {},
        el("strong", {}, "Want to buy this?"),
        el("div", { class: "hint" }, count > 0 ? count + " student" + (count !== 1 ? "s" : "") + " already interested" : "Be the first to show interest"),
      )
    ),
    el("button", { type: "button", class: "btn primary", onclick: async () => {
      const id = store.newId("marketInterests");
      const myC = getCampus();
      const doc = { listingId: d.id, sellerId: d.authorId, buyerId: store.uid, buyerName: getName() || "Student", buyerCampus: myC || "", createdAt: Date.now() };
      state.marketInterests = [...state.marketInterests, { id, ...doc }];
      await store.set("marketInterests", id, doc);
      render();
    }}, "🛒 I want this item"),
    el("p", { class: "hint" }, "Clicking this notifies the seller and reveals their WhatsApp contact.")
  );
}

function renderInterestedBuyers(d) {
  const buyers = interestsFor(d.id).filter(r => !r.deleted);
  if (!buyers.length) return el("div", { class: "mkt-buyers-empty" }, el("span", {}, "No buyers yet. Share your listing to get offers!"));
  return el("div", { class: "mkt-buyers-panel" },
    el("h4", {}, "👥 " + buyers.length + " interested buyer" + (buyers.length !== 1 ? "s" : "")),
    el("div", { class: "mkt-buyers-list" },
      ...buyers.map(b => {
        const waNum = (b.buyerWhatsapp || "").replace(/\D/g, "");
        return el("div", { class: "mkt-buyer-row" },
          avatarEl(avatarFor(b.buyerName || ""), "av-nb"),
          el("div", { class: "mkt-buyer-info" },
            el("strong", {}, b.buyerName || "Student"),
            b.buyerCampus && el("span", { class: "campus-badge sm", style: "--cc:" + campusColor(b.buyerCampus) }, b.buyerCampus),
          ),
          el("span", { class: "hint" }, ago(b.createdAt))
        );
      })
    )
  );
}

function renderMarketView() {
  const d = state.market.find(x => x.id === state.selected);
  if (!d) return [el("p", { class: "hint" }, "This listing was deleted or is still loading.")];
  const own = mine(d);
  const condColor = CONDITION_COLOR[d.condition] || "#6b7280";
  const waNum = (d.whatsapp || "").replace(/\D/g, "");
  const waLink = waNum.length >= 10 ? "https://wa.me/91" + waNum.slice(-10) + "?text=" + encodeURIComponent("Hi! I saw your listing on RGUKT Spark: " + d.title) : null;

  const actions = [
    own && !d.sold && el("button", { class: "btn primary", type: "button", onclick: async () => {
      await store.update("market", d.id, { sold: true });
      const idx = state.market.findIndex(x => x.id === d.id);
      if (idx >= 0) state.market[idx] = { ...state.market[idx], sold: true };
      render();
    }}, "✅ Mark as Sold"),
    own && d.sold && el("button", { class: "btn", type: "button", onclick: async () => {
      await store.update("market", d.id, { sold: false });
      const idx = state.market.findIndex(x => x.id === d.id);
      if (idx >= 0) state.market[idx] = { ...state.market[idx], sold: false };
      render();
    }}, "↩ Mark as Available"),
    own && el("button", { class: "btn", type: "button", onclick: () => { state.mode = "edit"; render(); }}, "✏️ Edit"),
    own && el("button", { class: "btn danger", type: "button", onclick: (e) => confirmDelete(e.currentTarget, async () => { await softDelete("market", d.id); state.selected = null; state.mode = "intro"; render(); })}, "🗑 Delete"),
    el("button", { class: "btn", type: "button", onclick: () => {
      const url = location.origin + location.pathname + "#market/" + d.id;
      if (navigator.share) navigator.share({ title: d.title, text: "Check this listing on RGUKT Spark: " + d.title + (d.price ? " — ₹" + d.price : ""), url });
      else { navigator.clipboard && navigator.clipboard.writeText(url); showNotice("Link copied!", "ok"); }
    }}, "🔗 Share"),
    el("button", { class: "btn", type: "button", onclick: () => { state.selected = null; state.mode = "intro"; render(); }}, "← Back")
  ].filter(Boolean);

  const rc = reportCount(d.id);
  const isCrossCampus = CROSS_CAMPUS_CATEGORIES.has(d.category);

  return [
    d.sold && el("div", { class: "mkt-sold-banner" }, "✅ This item has been sold"),
    rc >= 3 && el("div", { class: "mkt-flag-banner" }, "⚠️ " + rc + " students have reported this listing. Proceed with caution."),
    el("div", { class: "meta" },
      el("span", { class: "tag", ...colorAttrs(d.category) }, d.category),
      d.condition && el("span", { class: "mkt-condition", style: "--cc:" + condColor }, d.condition),
      d.campus && el("span", { class: "campus-badge", style: "--cc:" + campusColor(d.campus) }, d.campus),
      isCrossCampus ? el("span", { class: "pill open", title: "Books & Notes are visible to all campuses" }, "🌐 All campuses")
                    : d.campus && el("span", { class: "pill", title: "This item is available within " + d.campus + " only" }, "🏫 Campus only"),
    ),
    el("h2", {}, d.title),
    el("div", { class: "mkt-price-big" + (d.price ? "" : " free") }, mktPrice(d)),
    d.body && el("p", { class: "body-text" }, d.body),
    el("div", { class: "mkt-seller" },
      avatarEl(avatarFor(d.authorName || ""), "av"),
      el("div", {},
        el("strong", {}, d.authorName || "Student"),
        el("div", { class: "hint" }, "Listed " + ago(d.createdAt)),
      )
    ),
    !own && !d.sold && renderBuyPanel(d),
    own && renderInterestedBuyers(d),
    !own && !d.sold && renderRatingPanel(d),
    el("div", { class: "rowbtns" }, ...actions),
    !own && renderReportPanel(d),
  ].filter(Boolean);
}

function renderMarketAsk(existing) {
  const t = TABS.market;
  const err = el("p", { class: "err", hidden: true });
  const current = existing ? existing.category : (state.group !== "All" ? state.group : t.groups[0]);
  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const wantedAd = form.elements.wanted.checked, giveaway = form.elements.giveaway.checked && !wantedAd;
    const rawTitle = form.elements.title.value.trim().replace(/^🔎\s*WANTED:?\s*/i, "");
    const title = wantedAd ? "🔎 WANTED: " + rawTitle : rawTitle;
    const body = form.elements.body.value.trim();
    const category = form.elements.category.value;
    const price = form.elements.price.value.trim().replace(/[^0-9]/g, "");
    const condition = form.elements.condition.value;
    const whatsapp = form.elements.whatsapp.value.trim().replace(/[^0-9]/g, "");
    if (title.length < 3) { err.textContent = "Write a title of at least 3 characters."; err.hidden = false; return; }
    if (hasBadWords(title + " " + body)) { err.textContent = LANGUAGE_MSG; err.hidden = false; return; }
    if (whatsapp && whatsapp.length < 10) { err.textContent = "Enter a valid 10-digit WhatsApp number."; err.hidden = false; return; }
    if (!existing && store && sellerFlagged(store.uid)) { err.textContent = "Your account has been restricted from posting due to multiple reports. Contact an admin to appeal."; err.hidden = false; return; }
    // College-issued laptops cannot be sold — RGUKT policy
    if (category === "Electronics" && /\blaptop\b|\bhp\s*laptop\b|\bdell\s*laptop\b|\brgukt\s*laptop\b|\bcollege\s*laptop\b/i.test(title + " " + body)) { err.textContent = "College-issued laptops cannot be sold on this platform (RGUKT policy). Remove this item."; err.hidden = false; return; }
    const wait = existing ? "" : spamCheck();
    if (wait) { err.textContent = wait; err.hidden = false; return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      const myC = getCampus();
      if (existing) {
        await store.update("market", existing.id, { title: title.slice(0, 200), body: body.slice(0, 2000), category, price: giveaway ? 0 : (price ? Number(price) : null), condition, whatsapp: whatsapp.slice(-10) });
        state.mode = "view"; render(); return;
      }
      const id = store.newId("market");
      const doc = { title: title.slice(0, 200), body: body.slice(0, 2000), category, price: giveaway ? 0 : (price ? Number(price) : null), condition, whatsapp: whatsapp.slice(-10), authorId: store.uid, authorName: getName() || "Student", sold: false, createdAt: Date.now() };
      if (myC) doc.campus = myC;
      state.market = [{ id, ...doc }, ...state.market];
      state.group = "All"; state.query = ""; $("search").value = "";
      openItem(id);
      notePosted();
      await store.set("market", id, doc);
    } catch (e2) { state.mode = "ask"; render(); showNotice(errText(e2)); }
  }},
    el("h2", {}, existing ? "Edit listing" : "📦 List an item for sale"),
    el("div", { class: "two" },
      el("label", {}, "Item name *", el("input", { name: "title", maxlength: "200", required: true, placeholder: t.placeholder, value: existing ? existing.title.replace(/^🔎\s*WANTED:?\s*/i, "") : "" })),
      el("label", {}, "Category", el("select", { name: "category" }, t.groups.map(g => el("option", { selected: g === current }, g))))
    ),
    el("div", { class: "two" },
      el("label", {}, "Price (₹)",
        el("input", { name: "price", type: "number", min: "0", max: "99999", placeholder: "Leave blank = Free / Negotiable", value: existing && existing.price ? existing.price : "" })
      ),
      el("label", {}, "Condition",
        el("select", { name: "condition" }, MARKET_CONDITIONS.map(c => el("option", { selected: existing && existing.condition === c }, c)))
      )
    ),
    priceHelper(() => form),
    el("div", { class: "checks" },
      el("label", { class: "check" }, el("input", { type: "checkbox", name: "giveaway", checked: !!(existing && existing.price === 0) }), "🆓 I'm giving this away for free"),
      el("label", { class: "check" }, el("input", { type: "checkbox", name: "wanted", checked: !!(existing && isWantedAd(existing)) }), "🔎 I want to BUY this (wanted ad). The price above is my budget")),
    el("label", {}, "Description", el("textarea", { name: "body", maxlength: "2000", placeholder: t.bodyHint, value: existing ? existing.body : "" })),
    el("label", {}, "Your WhatsApp number (optional — buyers will contact you)",
      el("input", { name: "whatsapp", type: "tel", maxlength: "15", placeholder: "e.g. 9876543210 — not shown publicly except to buyers" })
    ),
    el("p", { class: "hint" }, "⚠️ Your WhatsApp number is only shared with students who open this listing."),
    el("p", { class: "hint" }, "🚫 College-issued laptops cannot be sold — RGUKT policy. Books & Notes are visible to all campuses; other items are campus-local."),
    mktSafetyTips(),
    err,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "submit" }, existing ? "Save changes" : "Post listing"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); }}, "Cancel")
    )
  );
  return [form];
}
// ===================== END CAMPUS MARKET =====================

const HUB_RES = {
  "Mini Project": [["GitHub Trending", "https://github.com/trending"], ["Project-based learning ideas", "https://github.com/practical-tutorials/project-based-learning"], ["DevPost projects", "https://devpost.com/software"]],
  "Major Project": [["Smart India Hackathon", "https://www.sih.gov.in"], ["Kaggle", "https://www.kaggle.com/competitions"], ["IEEE Xplore", "https://ieeexplore.ieee.org"], ["GitHub Trending", "https://github.com/trending"]],
  "Startup": [["Startup India", "https://www.startupindia.gov.in"], ["Atal Innovation Mission", "https://aim.gov.in"], ["Startup School (free)", "https://www.startupschool.org"]],
  "Research": [["arXiv", "https://arxiv.org"], ["Google Scholar", "https://scholar.google.com"], ["IEEE Xplore", "https://ieeexplore.ieee.org"], ["Summer research fellowships", "https://www.ias.ac.in"]],
  "Social impact": [["Smart India Hackathon", "https://www.sih.gov.in"], ["Startup India", "https://www.startupindia.gov.in"], ["IndiaAI", "https://indiaai.gov.in"]],
  "Coding Club": [["CSES Problem Set", "https://cses.fi/problemset/"], ["Codeforces", "https://codeforces.com"], ["freeCodeCamp", "https://www.freecodecamp.org"]],
  "Computer Science": [["roadmap.sh", "https://roadmap.sh"], ["CS50", "https://cs50.harvard.edu/x/"], ["GeeksforGeeks", "https://www.geeksforgeeks.org"]],
  "AI/ML": [["Kaggle Learn", "https://www.kaggle.com/learn"], ["Hugging Face", "https://huggingface.co/learn"], ["fast.ai", "https://www.fast.ai"]],
  "Robotics": [["Instructables Robots", "https://www.instructables.com/robots/"], ["ROS docs", "https://docs.ros.org"], ["Smart India Hackathon", "https://www.sih.gov.in"]],
  "Electronics": [["Falstad Circuit Simulator", "https://www.falstad.com/circuit/"], ["All About Circuits", "https://www.allaboutcircuits.com"], ["Instructables Circuits", "https://www.instructables.com/circuits/"]],
  "Civil Designers": [["NPTEL Civil", "https://nptel.ac.in"], ["QGIS (free GIS)", "https://qgis.org"], ["Engineering Toolbox", "https://www.engineeringtoolbox.com"]],
  "Mech Makers": [["FreeCAD", "https://www.freecad.org"], ["Instructables", "https://www.instructables.com"], ["SAE India", "https://www.saeindia.org"]],
  "Startup Cell": [["Startup India", "https://www.startupindia.gov.in"], ["Atal Innovation Mission", "https://aim.gov.in"]],
  "Research Society": [["arXiv", "https://arxiv.org"], ["Google Scholar", "https://scholar.google.com"], ["IEEE Xplore", "https://ieeexplore.ieee.org"]],
  "Innovation": [["Smart India Hackathon", "https://www.sih.gov.in"], ["DevPost", "https://devpost.com"]],
  "Quiz": [["Kaggle Learn", "https://www.kaggle.com/learn"], ["GeeksforGeeks quizzes", "https://www.geeksforgeeks.org/quizzes/"]],
  "Puzzle": [["CSES Problem Set", "https://cses.fi/problemset/"], ["Codeforces", "https://codeforces.com"]],
};
function otherHub(count) {
  const t = TABS[state.tab], g = state.group;
  const askLabel = ({ ideas: "💡 Share a " + g + " idea", clubs: "📝 Post in " + g, challenges: "🎮 Post a " + g + " challenge" })[state.tab] || "➕ " + t.ask;
  const res = HUB_RES[g] || [["Smart India Hackathon", "https://www.sih.gov.in"], ["Startup India", "https://www.startupindia.gov.in"]];
  const acts = [
    el("button", { class: "btn primary sm", type: "button", onclick: openAsk }, askLabel),
    ...res.map(([label, url]) => outLink(url, label, "linkbtn")),
    state.tab === "clubs" && g === "Alumni" && el("button", { class: "btn sm", type: "button", onclick: () => { alumniView = "dir"; showPanel("alumni"); } }, "🎓 Open Alumni Connect"),
  ].filter(Boolean);
  const noun = state.tab === "ideas" ? "ideas" : state.tab === "clubs" ? "posts" : "challenges";
  return el("div", { class: "learn-card", ...colorAttrs(g) },
    el("strong", {}, "📌 " + g),
    el("p", { class: "hint" }, count
      ? count + " " + (count === 1 ? noun.replace(/s$/, "") : noun) + " here. Tap one to read it and reply, or add your own."
      : "No " + noun + " in " + g + " yet. Be the first! Tap the button below to post, or get inspired with the free links."),
    el("div", { class: "rowbtns" }, acts),
    el("p", { class: "hint" }, "What next? ① Share yours  ② Like and reply to others  ③ Team up and build it together 🚀"));
}
function subjectHub(count) {
  if (["ideas", "clubs", "challenges"].includes(state.tab) && state.group !== "All") return otherHub(count);
  if (!(state.tab === "doubts" || state.tab === "gate") || state.group === "All") return null;
  const g = state.group;
  const toSheet = () => { render(); if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" }); };
  const study = (tab, set) => () => { state.mode = "resources"; resourceTab = tab; formulaOpen = null; syllabusSubj = null; syllabusUnit = null; mcqSubj = null; set(); toSheet(); };
  const acts = [
    el("button", { class: "btn primary sm", type: "button", onclick: openAsk }, "❓ Ask in " + g),
    typeof SYLLABUS !== "undefined" && SYLLABUS[g] && el("button", { class: "btn sm", type: "button", onclick: study("syllabus", () => { syllabusSubj = g; }) }, "📖 Syllabus"),
    typeof FORMULAS !== "undefined" && FORMULAS[g] && el("button", { class: "btn sm", type: "button", onclick: study("formulas", () => { formulaOpen = g; }) }, "⚡ Formulas"),
    outLink(nptelUrl(g), "🎓 IIT course", "linkbtn"),
    outLink(lectureUrl(g), "▶ Free lectures", "linkbtn"),
    state.tab === "doubts" && TABS.gate.groups.includes(g) && el("button", { class: "btn sm", type: "button", onclick: () => { state.tab = "gate"; state.mode = "intro"; state.selected = null; render(); } }, "🎯 GATE PYQs"),
  ].filter(Boolean);
  return el("div", { class: "learn-card", ...colorAttrs(g) },
    el("strong", {}, "📘 " + g),
    el("p", { class: "hint" }, count
      ? count + (count === 1 ? " post" : " posts") + " here. Tap one to read or answer it, or use the buttons below."
      : "No " + g + " posts yet. Be the first! Ask your question, or study the topic using the buttons below."),
    el("div", { class: "rowbtns" }, acts),
    el("p", { class: "hint" }, "What next? ① Ask your doubt  ② Study the topic  ③ Come back and help others — answering earns you points 🏆"));
}

// ---------- campus hub: info, live activity, ranking and actions for the selected campus ----------
const CAMPUS_INFO = {
  NUZVID: { place: "Nuzvid, Eluru district, Andhra Pradesh", site: "https://www.rguktn.ac.in", q: "RGUKT Nuzvid" },
  ONGOLE: { place: "Ongole, Prakasam district, Andhra Pradesh", site: "https://www.rguktong.ac.in", q: "RGUKT Ongole" },
  RKVALLEY: { place: "Idupulapaya, YSR Kadapa district, Andhra Pradesh", site: "https://www.rguktrkv.ac.in", q: "RGUKT RK Valley Idupulapaya" },
  SRIKAKULAM: { place: "Etcherla, Srikakulam district, Andhra Pradesh", site: "https://www.rguktsklm.ac.in", q: "RGUKT Srikakulam Etcherla" },
};
function goTab(tab, group) { state.tab = tab; state.group = group || "All"; state.filter = "all"; state.query = ""; state.selected = null; state.mode = "intro"; if ($("search")) $("search").value = ""; render(); }
function openPost(tab, id) { state.tab = tab; state.group = "All"; state.filter = "all"; state.query = ""; openItem(id); }
const postLikes = (d) => likesFor(d.id).length + repliesFor(d.id).length;
function campusClubsBlock(c) {
  const clubs = state.clubs.filter(x => x.campus === c && !x.deleted);
  const counts = new Map(); for (const x of clubs) counts.set(x.club, (counts.get(x.club) || 0) + 1);
  const recent = clubs.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  return el("div", { class: "campus-sec" },
    el("small", { class: "hint" }, "🏛 Clubs at " + c + " (" + clubs.length + " post" + (clubs.length === 1 ? "" : "s") + ")"),
    counts.size
      ? el("div", { class: "rowbtns" }, [...counts].sort((a, b) => b[1] - a[1]).map(([name, n]) => el("button", { class: "btn sm", type: "button", onclick: () => goTab("clubs", name) }, name + " · " + n)))
      : el("p", { class: "hint" }, "No club activity yet. Start a club post for " + c + "!"),
    ...recent.map(x => el("button", { type: "button", class: "campus-link", onclick: () => openPost("clubs", x.id) }, el("strong", {}, x.title), el("small", {}, x.club + " · " + ago(x.createdAt)))),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => goTab("clubs") }, "Open all clubs ▶")));
}
function campusInnovationBlock(c) {
  const ideas = state.ideas.filter(x => x.campus === c && !x.deleted).sort((a, b) => postLikes(b) - postLikes(a) || b.createdAt - a.createdAt).slice(0, 3);
  const chals = state.challenges.filter(x => x.campus === c && !x.deleted).sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
  return el("div", { class: "campus-sec" },
    el("small", { class: "hint" }, "💡 Innovations and ideas from " + c),
    ideas.length ? ideas.map(x => el("button", { type: "button", class: "campus-link", onclick: () => openPost("ideas", x.id) }, el("strong", {}, x.title), el("small", {}, x.category + " · ♥ " + likesFor(x.id).length + " · " + repliesFor(x.id).length + " thoughts"))) : el("p", { class: "hint" }, "No ideas yet. Share the first innovation from " + c + "."),
    chals.length ? el("small", { class: "hint" }, "🎮 Innovation challenges") : null,
    ...chals.map(x => el("button", { type: "button", class: "campus-link", onclick: () => openPost("challenges", x.id) }, el("strong", {}, x.title), el("small", {}, (x.type || "Challenge") + " · " + (x.status === "closed" ? "closed" : "open") + " · " + ago(x.createdAt)))),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => goTab("ideas") }, "All ideas ▶"), el("button", { class: "btn sm", type: "button", onclick: () => goTab("challenges") }, "All challenges ▶"),
      el("button", { class: "btn sm primary", type: "button", onclick: () => { state.tab = "ideas"; state.group = "All"; openAsk(); } }, "💡 Share an idea")));
}

// ---------- year hub: goals, key dates, batch activity and shortcuts for E1 to E4 ----------
const YEAR_GUIDE = {
  E1: { name: "Foundation year", tag: "Build strong basics and good habits.",
    goals: ["Revise Maths, Physics and basic programming every week", "Aim for a CGPA of 8 or above from the first semester", "Learn Git and solve 2 easy coding problems a week", "Join one club and attend its first meetup", "Track attendance and keep it above 75%", "Take the Daily Quiz at least 3 times a week"],
    dates: ["Plan mid-semester exams 2 weeks ahead", "Choose a club in your first month"],
    actions: [["📖 Study Tools", () => showPanel("resources")], ["📚 Learn from IIT", () => showPanel("learn")], ["🧠 Daily Quiz", () => showPanel("quiz")], ["📅 Attendance tool", () => showPanel("lab")]] },
  E2: { name: "Core subjects", tag: "Go deep into your branch and start building.",
    goals: ["Master the core subjects of your branch, one unit at a time", "Start one small project and put it on GitHub", "Practise competitive programming or circuit design weekly", "Attend a hackathon or workshop this year", "Clear any backlog early and keep your CGPA steady", "Make flashcards for every unit"],
    dates: ["Look for summer learning programs in the middle of the year", "Enter at least one challenge or hackathon"],
    actions: [["📖 Study Tools", () => showPanel("resources")], ["🃏 Flashcards", () => showPanel("lab")], ["🎮 Challenges", () => goTab("challenges")], ["🏛 Clubs", () => goTab("clubs")]] },
  E3: { name: "Skills and internships", tag: "Turn knowledge into skills, projects and experience.",
    goals: ["Apply for a summer internship (NCS and AICTE portals are free)", "Build a mini project and write a strong one-page resume", "Start GATE basics and solve previous-year papers", "Earn one NPTEL, Kaggle or Google certificate", "Find a mentor among seniors and alumni", "Practise aptitude and communication for placements"],
    dates: ["Internship applications: begin early in the year", "GATE preparation: aim to start by the second semester"],
    actions: [["🚀 Career Guide", () => { careerBranch = null; showPanel("career"); }], ["🎯 GATE tab", () => goTab("gate")], ["🎓 Alumni", () => { alumniView = "dir"; showPanel("alumni"); }], ["🧪 Study Lab", () => showPanel("lab")]] },
  E4: { name: "Launch year", tag: "Finish strong and choose your next step.",
    goals: ["Finish your major project and write a clear report", "Placement prep: DSA, aptitude and mock interviews", "GATE: revise and take full mock tests (exam is usually in February)", "Study abroad: shortlist universities and apply (usually October to January)", "Update your resume, LinkedIn and GitHub", "Plan your next step with the Career Guide"],
    dates: ["Campus placements: usually in the final year", "GATE exam: usually in February", "Abroad applications: usually October to January"],
    actions: [["🚀 Career Guide", () => { careerBranch = null; showPanel("career"); }], ["🌍 Abroad Explorer", () => { careerBranch = "ABROAD"; showPanel("career"); }], ["🎯 GATE tab", () => goTab("gate")], ["🎓 Alumni", () => { alumniView = "dir"; showPanel("alumni"); }]] },
};
const yearPosts = (y) => [...state.doubts, ...state.gate].filter(x => x.year === y && !x.deleted);
const yearPostCount = (y) => yearPosts(y).length;
function yearHub() {
  const y = state.yearFilter;
  if (!(state.tab === "doubts" || state.tab === "gate") || !YEAR_GUIDE[y]) return null;
  const g = YEAR_GUIDE[y], now = Date.now();
  const posts = yearPosts(y), doubts = state.doubts.filter(x => x.year === y && !x.deleted), solved = doubts.filter(d => d.resolvedReplyId).length;
  const fresh = posts.filter(x => now - x.createdAt < 86400000).length;
  const students = new Set(posts.filter(x => !x.anonymous && x.authorId).map(x => x.authorId)).size;
  // seniors who help: people from a higher year who replied to this batch's doubts
  const yearOf = new Map(); for (const x of [...state.doubts, ...state.gate]) if (x.year && x.authorId) yearOf.set(x.authorId, x.year);
  const idsOfYear = new Set(posts.map(x => x.id)), tally = new Map();
  for (const r of state.replies) {
    if (r.deleted || r.anonymous || !idsOfYear.has(r.parentId)) continue;
    const ry = yearOf.get(r.authorId); if (!ry || ry <= y) continue;
    const t = tally.get(r.authorId) || { name: r.authorName || "A senior", year: ry, n: 0 }; t.n++; tally.set(r.authorId, t);
  }
  const seniors = [...tally.values()].sort((a, b) => b.n - a.n).slice(0, 3);
  let done; try { done = JSON.parse(localStorage.getItem("dd-yr-" + y) || "[]"); } catch (_) { done = []; }
  const pct = Math.round((done.length / g.goals.length) * 100);
  const saveDone = () => { try { localStorage.setItem("dd-yr-" + y, JSON.stringify(done)); } catch (_) {} };
  const maxN = Math.max(...["E1", "E2", "E3", "E4"].map(yearPostCount), 1);
  const tile = (n, label) => el("div", { class: "intro-stat" }, el("span", { class: "intro-stat-n" }, n), el("span", { class: "intro-stat-l" }, label));
  const pillEl = el("span", { class: "pill open" }, pct + "% of goals done"), fillEl = el("span", { class: "lab-fill goal", style: "width:" + pct + "%" });
  return el("div", { class: "learn-card year-hub" },
    el("div", { class: "campus-hub-head" }, el("strong", {}, "🎓 " + y + " · " + g.name), pillEl),
    el("p", { class: "hint" }, g.tag),
    el("p", { class: fresh ? "campus-live" : "hint" }, fresh ? "🟢 " + fresh + " new " + y + " post" + (fresh > 1 ? "s" : "") + " in the last 24 hours" : "⚪ No new " + y + " posts today. Ask one!"),
    el("div", { class: "intro-stats" }, tile(posts.length, "posts"), tile(students, "students"), tile(solved + "/" + doubts.length, "doubts solved")),
    el("div", { class: "lab-track small" }, fillEl),
    el("small", { class: "hint" }, "✅ Your " + y + " goals (tap to tick)"),
    ...g.goals.map((t, i) => el("label", { class: "check yr-goal" }, el("input", { type: "checkbox", checked: done.includes(i), onchange: (e) => { done = e.target.checked ? [...new Set([...done, i])] : done.filter(x => x !== i); saveDone(); const p = Math.round((done.length / g.goals.length) * 100); pillEl.textContent = p + "% of goals done"; fillEl.style.setProperty("width", p + "%"); } }), t)),
    el("small", { class: "hint" }, "📅 Key dates"),
    el("ul", { class: "yr-dates" }, ...g.dates.map(d => el("li", {}, d))),
    seniors.length ? el("div", {}, el("small", { class: "hint" }, "🧑‍🏫 Seniors helping " + y), ...seniors.map(t => el("div", { class: "tl-trow" }, el("span", {}, t.name + " (" + t.year + ")"), el("strong", {}, t.n + (t.n === 1 ? " reply" : " replies"))))) : null,
    el("small", { class: "hint" }, "Batch activity"),
    ...["E1", "E2", "E3", "E4"].map(b => el("div", { class: "rival-row" }, el("span", { class: "rival-rank" }, b), el("div", { class: "rival-bar-wrap" }, el("div", { class: "rival-bar", style: "width:" + Math.round(yearPostCount(b) * 100 / maxN) + "%;background:" + (b === y ? "var(--ta)" : "var(--line)") })), el("span", { class: "rival-score" }, yearPostCount(b) + " posts"))),
    el("div", { class: "rowbtns" }, g.actions.map(([label, fn]) => el("button", { class: "btn sm", type: "button", onclick: fn }, label)),
      el("button", { class: "btn sm primary", type: "button", onclick: openAsk }, "➕ Ask as " + y),
      el("button", { class: "btn sm", type: "button", onclick: () => { state.yearFilter = "All"; render(); } }, "✕ All years")));
}

const CAMPUS_COLLS = ["doubts", "ideas", "clubs", "gate", "challenges", "jobs", "market"];
const campusPostCount = (c) => CAMPUS_COLLS.reduce((n, k) => n + state[k].filter(x => x.campus === c && !x.deleted).length, 0);
function campusHub() {
  const c = state.campusFilter;
  if (!c || c === "all") return null;
  const info = CAMPUS_INFO[c] || {}, now = Date.now(), color = campusColor(c);
  const own = (x) => x.campus === c && !x.deleted;
  const posts = CAMPUS_COLLS.flatMap(k => state[k].filter(own));
  const fresh = posts.filter(x => now - x.createdAt < 86400000).length;
  const week = posts.filter(x => now - x.createdAt < 7 * 86400000).length;
  const doubts = state.doubts.filter(own), solved = doubts.filter(d => d.resolvedReplyId).length;
  const students = new Set(posts.filter(x => !x.anonymous && x.authorId).map(x => x.authorId)).size;
  const campusOf = new Map();
  for (const k of CAMPUS_COLLS) for (const x of state[k]) if (x.campus && x.authorId) campusOf.set(x.authorId, x.campus);
  const tally = new Map();
  for (const r of state.replies) {
    if (r.deleted || r.anonymous || campusOf.get(r.authorId) !== c) continue;
    const t = tally.get(r.authorId) || { name: r.authorName || "A student", n: 0 }; t.n++; tally.set(r.authorId, t);
  }
  const top = [...tally.values()].sort((a, b) => b.n - a.n).slice(0, 3);
  const ranks = campusStats(), maxPts = Math.max(...ranks.map(x => x.points), 1), rank = ranks.findIndex(x => x.campus === c) + 1;
  const isMine = getCampus() === c;
  const tile = (n, label) => el("div", { class: "intro-stat" }, el("span", { class: "intro-stat-n" }, n), el("span", { class: "intro-stat-l" }, label));
  const q = encodeURIComponent(info.q || ("RGUKT " + c));
  const card = el("div", { class: "learn-card campus-hub" },
    el("div", { class: "campus-hub-head" },
      el("strong", {}, (CAMPUS_ICON[c] || "🏫") + " RGUKT " + c),
      isMine && el("span", { class: "pill done" }, "⭐ My campus"),
      rank > 0 && el("span", { class: "pill open" }, "#" + rank + " campus rank")),
    info.place && el("p", { class: "hint" }, "📍 " + info.place),
    el("p", { class: fresh ? "campus-live" : "hint" }, fresh ? "🟢 " + fresh + " new post" + (fresh > 1 ? "s" : "") + " in the last 24 hours" : "⚪ Quiet today. Be the first to post!"),
    el("div", { class: "intro-stats" }, tile(posts.length, "posts"), tile(week, "this week"), tile(students, "students"), tile(solved + "/" + doubts.length, "doubts solved")),
    top.length ? el("div", {}, el("small", { class: "hint" }, "Top responders from " + c), ...top.map((t, i) => el("div", { class: "tl-trow" }, el("span", {}, ["🥇", "🥈", "🥉"][i] + " " + t.name), el("strong", {}, t.n + (t.n === 1 ? " reply" : " replies"))))) : null,
    campusClubsBlock(c),
    campusInnovationBlock(c),
    el("small", { class: "hint" }, "Campus ranking"),
    ...ranks.map(r => el("div", { class: "rival-row" },
      el("span", { class: "rival-rank" }, CAMPUS_ICON[r.campus] || "🏫"),
      el("span", { class: "rival-name", style: "color:" + campusColor(r.campus) + (r.campus === c ? ";font-weight:900" : "") }, r.campus),
      el("div", { class: "rival-bar-wrap" }, el("div", { class: "rival-bar", style: "width:" + Math.round(r.points * 100 / maxPts) + "%;background:" + campusColor(r.campus) })),
      el("span", { class: "rival-score" }, r.points + " pts"))),
    el("div", { class: "rowbtns" },
      isMine ? null : el("button", { class: "btn sm primary", type: "button", onclick: () => { setCampus(c); showNotice("Done. " + c + " is now your campus.", "ok"); render(); } }, "⭐ Set as my campus"),
      el("button", { class: "btn sm", type: "button", onclick: openAsk }, "➕ Post"),
      info.site ? outLink(info.site, "🌐 Website", "linkbtn") : null,
      outLink("https://www.google.com/maps/search/?api=1&query=" + q, "🗺️ Map", "linkbtn"),
      outLink("https://www.google.com/maps/dir/?api=1&destination=" + q, "🧭 Directions", "linkbtn"),
      outLink("https://www.google.com/search?q=" + encodeURIComponent("weather " + (info.place || c).split(",")[0]), "🌦️ Weather", "linkbtn"),
      el("button", { class: "btn sm", type: "button", onclick: () => { state.campusFilter = "all"; render(); } }, "✕ Show all campuses")));
  card.style.setProperty("--cc", color);
  return card;
}

function renderList() {
  if (state.tab === "market") { renderMarketList(); return; }
  const t = TABS[state.tab], rows = visible(), all = state[t.coll];
  if (!rows.length) {
    const noun = state.tab === "doubts" || state.tab === "gate" ? "subject" : state.tab === "clubs" ? "club" : state.tab === "challenges" ? "type" : "category";
    const emptyMsg = state.tab === "doubts" ? "No doubts yet" : state.tab === "clubs" ? "No club posts yet" : state.tab === "gate" ? "No GATE discussions yet" : state.tab === "challenges" ? "No challenges yet" : state.tab === "jobs" ? "No openings yet" : "No ideas yet";
    const hubEl = state.query.trim() ? null : subjectHub(0);
    $("list").replaceChildren(...[deptBanner(), campusHub(), yearHub(), hubEl].filter(Boolean), ...(hubEl ? [] : [all.length
      ? el("div", { class: "empty" }, el("strong", {}, "Nothing matches"), "Try another " + noun + " or clear the search.")
      : el("div", { class: "empty" }, el("strong", {}, emptyMsg), "Press \u201c" + t.ask + "\u201d to post the first one.")]));
    return;
  }
  const spot = spotlight();
  const spotCard = spot && el("button", { type: "button", class: "spot", onclick: () => openItem(spot.d.id) },
    el("span", { class: "spot-k" }, "⭐ Doubt of the Day"),
    el("strong", {}, spot.d.title),
    el("span", { class: "spot-why" }, spot.why + " Can you solve it?"));
  $("list").replaceChildren(...[deptBanner(), campusHub(), yearHub(), subjectHub(rows.length), spotCard].filter(Boolean), ...rows.map(d => {
    const n = repliesFor(d.id).length, g = d[t.field];
    const meta = [el("span", { class: "tag", ...colorAttrs(g) }, g)];
    const votes = likesFor(d.id).length;
    if (state.tab === "doubts") {
      meta.push(el("span", { class: "pill " + (d.resolvedReplyId ? "done" : "open") }, d.resolvedReplyId ? "Resolved" : (n ? "Open" : "Unanswered")));
      if (d.urgent && !d.resolvedReplyId) meta.unshift(el("span", { class: "pill urgent" }, "🔥 Urgent"));
      if (d.bounty && !d.resolvedReplyId) meta.push(el("span", { class: "pill bounty" }, "🎁 Bounty"));
      if (votes) meta.push(el("span", { class: "likes" }, "🙋 " + votes));
    } else if (state.tab === "gate") {
      if (d.pyqYear) meta.push(el("span", { class: "gate-badge pyq" }, "⭐ " + d.pyqYear));
      if (d.marks) meta.push(el("span", { class: "gate-badge marks" }, d.marks));
      if (d.difficulty) meta.push(el("span", { class: "gate-badge diff-" + d.difficulty.toLowerCase() }, d.difficulty));
      if (votes) meta.push(el("span", { class: "likes" }, "♥ " + votes));
    } else if (state.tab === "jobs") {
      if (d.company) meta.push(el("span", { class: "pill" }, "🏢 " + d.company));
      const dl = jobDaysLeft(d); if (dl != null) meta.push(el("span", { class: "pill " + (dl < 0 ? "done" : dl <= 3 ? "urgent" : "open") }, "⏰ " + jobDeadlineText(dl)));
      if (d.pay) meta.push(el("span", { class: "pill" }, "💰 " + d.pay));
      if (votes) meta.push(el("span", { class: "likes" }, "♥ " + votes));
    } else meta.push(el("span", { class: "likes" }, "♥ " + votes));
    if (d.year) meta.push(el("span", { class: "pill year-pill" }, d.year));
    if (d.campus && CAMPUSES.length > 0) meta.push(el("span", { class: "campus-badge", style: "--cc:" + campusColor(d.campus) }, d.campus));
    if (d.pages && d.pages.length) meta.push(el("span", {}, "📎 " + d.pages.length + (d.pages.length === 1 ? " page" : " pages")));
    if (d.fileAttachments && d.fileAttachments.length) meta.push(el("span", {}, "📁 " + d.fileAttachments.length + (d.fileAttachments.length === 1 ? " file" : " files")));
    const av = d.anonymous ? avatarEl("👤") : avatarEl(mine(d) ? getAvatar() : avatarFor(d.authorName || ""));

    meta.push(el("span", {}, n + " " + t.replyNoun + (n === 1 ? "" : "s")), el("span", { class: "author-row" }, av, who(d) + " · " + ago(d.createdAt)));
    const delBtn = mine(d) ? el("button", {
      type: "button", class: "item-del", title: "Delete", "aria-label": "Delete post",
      onclick: (e) => { e.stopPropagation(); confirmDelete(e.currentTarget, async () => { await softDelete(t.coll, d.id); if (state.selected === d.id) { state.selected = null; state.mode = "intro"; } render(); }); }
    }, "🗑") : null;
    return el("div", { class: "item-wrap" },
      el("button", {
        type: "button", class: "item", ...colorAttrs(g),
        "aria-current": String(state.selected === d.id && state.mode === "view"), onclick: () => openItem(d.id),
      }, el("h3", {}, d.title), el("div", { class: "meta" }, meta)),
      delBtn);
  }));
}

// The open doubt most classmates share; otherwise the oldest unanswered one from the last week.
function spotlight() {
  if (state.tab !== "doubts" || state.group !== "All" || state.query || state.filter !== "all") return null;
  const open = state.doubts.filter(d => !d.resolvedReplyId);
  if (!open.length) return null;
  const voted = open.map(d => ({ d, v: likesFor(d.id).length })).filter(x => x.v > 0).sort((a, b) => b.v - a.v)[0];
  if (voted) return { d: voted.d, why: voted.v + (voted.v === 1 ? " classmate shares" : " classmates share") + " this doubt." };
  const weekAgo = Date.now() - 7 * 86400000;
  const unanswered = open.filter(d => d.createdAt > weekAgo && !repliesFor(d.id).length).sort((a, b) => a.createdAt - b.createdAt)[0];
  return unanswered ? { d: unanswered, why: "Still waiting for its first answer." } : null;
}

// ---------- leaderboard ----------
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

// ---------- daily quiz ----------
const QUIZ = window.DOUBT_DESK_QUIZ || [];
const dayNum = (t = Date.now()) => { const d = new Date(t); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
// Each student sees a different question each day based on their device ID.
function deviceSeed() {
  const id = localStorage.getItem('dd-device-id') || '';
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
const quizIdxFor = (day) => QUIZ.length ? ((day + deviceSeed()) % QUIZ.length + QUIZ.length) % QUIZ.length : -1;
const quizFor = (day) => { const i = quizIdxFor(day); return i >= 0 ? QUIZ[i] : null; };
// Quiz answers stored as "quiz~<day>~<qidx>~<opt>"; a student's first answer counts.
function quizAnswers(day) {
  const qidx = quizIdxFor(day);
  const first = new Map();
  for (const l of state.likes) {
    // support old format quiz~day~opt and new format quiz~day~qidx~opt
    const mNew = /^quiz~(\d+)~(\d+)~(\d)$/.exec(l.ideaId || "");
    const mOld = /^quiz~(\d+)~(\d)$/.exec(l.ideaId || "");
    let lDay, lQidx, lOpt;
    if (mNew) { lDay = +mNew[1]; lQidx = +mNew[2]; lOpt = +mNew[3]; }
    else if (mOld) { lDay = +mOld[1]; lQidx = -1; lOpt = +mOld[2]; }
    else continue;
    if (lDay !== day) continue;
    if (lQidx >= 0 && lQidx !== qidx) continue; // different question, skip
    const prev = first.get(l.uid);
    if (!prev || (l.createdAt || 0) < (prev.createdAt || 0)) first.set(l.uid, { ...l, opt: lOpt });
  }
  return first;
}
const myQuizAnswer = (day) => store ? quizAnswers(day).get(store.uid) : null;
async function answerQuiz(day, opt) {
  if (!store || myQuizAnswer(day)) return;
  const qidx = quizIdxFor(day);
  const id = "quiz~" + day + "~" + qidx + "~" + opt + "_" + store.uid;
  const doc = { ideaId: "quiz~" + day + "~" + qidx + "~" + opt, uid: store.uid, name: getName() || "A student", createdAt: Date.now() };
  state.likes = [...state.likes, { id, ...doc }];
  render();
  if (q && q.a === opt) celebrate();
  try { await store.set("likes", id, doc); }
  catch (e) { state.likes = state.likes.filter(l => l.id !== id); render(); showNotice(errText(e)); }
}
function renderQuiz() {
  const day = dayNum(), q = quizFor(day);
  if (!q) return [el("h2", {}, "🧠 Daily Quiz"), el("p", { class: "hint" }, "No quiz questions yet.")];
  const answers = quizAnswers(day), mine = myQuizAnswer(day), total = answers.size;
  const counts = q.o.map((_, i) => [...answers.values()].filter(a => a.opt === i).length);
  const correctCount = counts[q.a];
  const opts = el("div", { class: "quiz-opts" }, q.o.map((text, i) => {
    if (!mine) return el("button", { type: "button", class: "quiz-opt", onclick: () => answerQuiz(day, i) }, el("b", {}, "ABCD"[i]), text);
    const pct = total ? Math.round(counts[i] * 100 / total) : 0;
    const cls = "quiz-opt done" + (i === q.a ? " right" : "") + (i === mine.opt && i !== q.a ? " wrong" : "");
    return el("div", { class: cls, style: "--pct:" + pct + "%" }, el("b", {}, "ABCD"[i]), el("span", {}, text), el("span", { class: "pct" }, pct + "%"));
  }));
  const out = [
    el("div", { class: "meta" }, el("span", { class: "tag", ...colorAttrs(q.s, "doubts") }, q.s), el("span", {}, "Question " + ((day % QUIZ.length) + 1) + " of " + QUIZ.length + " · new question every day")),
    el("h2", {}, "🧠 " + q.q),
    opts,
  ];
  if (mine) {
    out.push(el("p", { class: "quiz-result " + (mine.opt === q.a ? "right" : "wrong") }, mine.opt === q.a ? "✅ Correct! +3 points." : "❌ Not quite. The answer is " + "ABCD"[q.a] + "."));
    out.push(el("p", { class: "body" }, "💡 " + q.e));
    out.push(el("p", { class: "hint" }, total + (total === 1 ? " classmate has" : " classmates have") + " answered today. " + (total ? Math.round(correctCount * 100 / total) + "% got it right." : "")));
  } else out.push(el("p", { class: "hint" }, "Pick one answer — one try only. Each student gets a different question today. Correct answer earns +3 points."));
  const y = quizFor(day - 1), ya = myQuizAnswer(day - 1);
  if (y) out.push(el("details", { class: "quiz-y" }, el("summary", {}, "Yesterday's question"),
    el("p", { class: "body" }, y.q + "\nAnswer: " + "ABCD"[y.a] + ". " + y.o[y.a] + (ya ? (ya.opt === y.a ? "  ✅ you got it" : "  ❌ you picked " + "ABCD"[ya.opt]) : "") + "\n💡 " + y.e)));
  out.push(el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")));
  return out;
}

// ---------- reactions on answers ----------
const REACTIONS = [["up", "👍", "Helpful"], ["idea", "💡", "Clever"], ["fire", "🔥", "Excellent"]];
const reactKey = (replyId, k) => "r~" + replyId + "~" + k;
async function toggleReaction(r, k) {
  if (!store) return;
  const key = reactKey(r.id, k), id = key + "_" + store.uid;
  const on = state.likes.some(l => l.id === id);
  const before = state.likes;
  state.likes = on ? state.likes.filter(l => l.id !== id) : [...state.likes, { id, ideaId: key, uid: store.uid, createdAt: Date.now() }];
  render();
  try { on ? await store.remove("likes", id) : await store.set("likes", id, { ideaId: key, uid: store.uid, createdAt: Date.now() }); }
  catch (e) { state.likes = before; render(); showNotice(errText(e)); }
}
function reactionBar(r) {
  return el("div", { class: "reacts" }, REACTIONS.map(([k, icon, label]) => {
    const list = likesFor(reactKey(r.id, k));
    const on = store && list.some(l => l.uid === store.uid);
    return el("button", { type: "button", class: "react", "aria-pressed": String(!!on), title: label, "aria-label": label + " (" + list.length + ")", onclick: () => toggleReaction(r, k) }, icon + (list.length ? " " + list.length : ""));
  }));
}

// ---------- points, streaks, badges ----------
// Everything is worked out from the shared posts, so it is the same for every student.
function allStats() {
  const people = new Map();
  const get = (id, name, t) => {
    if (!id) return null;
    const p = people.get(id) || { id, name: "", nameAt: -1, points: 0, answers: 0, helpful: 0, ideas: 0, asked: 0, likes: 0, reacts: 0, quizRight: 0, quizDone: 0, days: new Set() };
    if (name && name !== ANON && (t || 0) >= p.nameAt) { p.name = name; p.nameAt = t || 0; }
    people.set(id, p);
    return p;
  };
  const active = (id, t) => { const p = get(id); if (p && t) p.days.add(dayNum(t)); };
  const helpfulIds = new Set(state.doubts.map(d => d.resolvedReplyId).filter(Boolean));
  const replyAuthor = new Map(state.replies.map(r => [r.id, r]));
  for (const d of state.doubts) { active(d.authorId, d.createdAt); if (d.anonymous) continue; const p = get(d.authorId, d.authorName, d.createdAt); p.asked++; p.points += 1; }
  for (const i of state.ideas) {
    active(i.authorId, i.createdAt); if (i.anonymous) continue;
    const p = get(i.authorId, i.authorName, i.createdAt); p.ideas++; p.points += 2;
    for (const l of likesFor(i.id)) if (l.uid !== i.authorId) { p.likes++; p.points += 1; }
  }
  for (const r of state.replies) {
    active(r.authorId, r.createdAt); if (r.anonymous) continue;
    const p = get(r.authorId, r.authorName, r.createdAt);
    if (r.parentColl !== "doubts") { p.points += 1; continue; }
    const parent = state.doubts.find(d => d.id === r.parentId);
    if (parent && parent.authorId === r.authorId) continue; // replying to your own doubt earns nothing
    p.answers++; p.points += 2;
    if (helpfulIds.has(r.id)) { p.helpful++; p.points += 5; }
  }
  for (const l of state.likes) {
    active(l.uid, l.createdAt);
    const m = /^r~(.+)~\w+$/.exec(l.ideaId || "");
    if (m) { const r = replyAuthor.get(m[1]); if (r && !r.anonymous && r.authorId !== l.uid) { const p = get(r.authorId, r.authorName, r.createdAt); p.reacts++; p.points += 1; } }
  }
  const days = new Set(state.likes.map(l => /^quiz~(\d+)~/.exec(l.ideaId || "")).filter(Boolean).map(m => +m[1]));
  for (const day of days) {
    for (const a of quizAnswers(day).values()) {
      const p = get(a.uid, a.name, a.createdAt); p.quizDone++;
      // Each student's correct answer is stored against their own question index
      const mNew = /^quiz~\d+~(\d+)~(\d)$/.exec(a.ideaId || "");
      const mOld = /^quiz~\d+~(\d)$/.exec(a.ideaId || "");
      let qidx = mNew ? +mNew[1] : -1, opt = mNew ? +mNew[2] : (mOld ? +mOld[1] : -1);
      const q = qidx >= 0 ? QUIZ[qidx] : quizFor(day);
      if (q && opt >= 0 && opt === q.a) { p.quizRight++; p.points += 3; }
    }
  }
    // Night Owl: any post created between midnight and 5am
  const allUserPosts = [...state.doubts, ...state.ideas, ...state.clubs, ...state.gate, ...state.challenges, ...state.replies];
  for (const x of allUserPosts) {
    if (!x.authorId || x.anonymous) continue;
    const h = new Date(x.createdAt || 0).getHours();
    if (h >= 0 && h < 5) { const p = people.get(x.authorId); if (p) p.nightPost = (p.nightPost || 0) + 1; }
  }
  // Club posts in distinct clubs
  const clubsBy = new Map();
  for (const c of state.clubs) {
    if (!c.authorId || c.anonymous) continue;
    if (!clubsBy.has(c.authorId)) clubsBy.set(c.authorId, new Set());
    clubsBy.get(c.authorId).add(c.club);
  }
  for (const [id, clubs] of clubsBy) { const p = people.get(id); if (p) p.clubsPosted = clubs.size; }
  // Spark Starter: first post ever on the board (oldest authorId)
  const allSorted = [...allUserPosts].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (allSorted[0] && allSorted[0].authorId) { const p = people.get(allSorted[0].authorId); if (p) p.firstPost = 1; }

  for (const p of people.values()) { p.streak = streakOf(p.days); p.level = levelOf(p.points); if (!p.name) p.name = "A student"; }
  return people;
}
function streakOf(days) {
  let d = dayNum();
  if (!days.has(d)) d -= 1; // the streak is still alive until today ends
  let n = 0;
  while (days.has(d)) { n++; d--; }
  return n;
}
// Level n needs 5·n·(n−1)/2 points: 0, 5, 15, 30, 50, 75 …
function levelOf(points) { let n = 1; while (points >= 5 * n * (n + 1) / 2) n++; return { n, from: 5 * n * (n - 1) / 2, to: 5 * n * (n + 1) / 2 }; }
const BADGES = [
  ["🌱", "First Step",      "Post anything",                   p => p.asked + p.answers + p.ideas + p.quizDone > 0],
  ["🤝", "First Answer",    "Answer a classmate's doubt",      p => p.answers >= 1],
  ["🧩", "Problem Solver",  "3 answers marked helpful",        p => p.helpful >= 3],
  ["💡", "Idea Machine",    "Share 3 ideas",                   p => p.ideas >= 3],
  ["🧠", "Quiz Whiz",       "5 quiz answers right",            p => p.quizRight >= 5],
  ["❤️", "Crowd Favourite", "10 reactions or likes received",  p => p.reacts + p.likes >= 10],
  ["🔥", "On Fire",         "3-day streak",                    p => p.streak >= 3],
  ["🏆", "Legend",          "Reach 50 points",                 p => p.points >= 50],
  ["🌙", "Night Owl",       "Post after midnight",             p => p.nightPost > 0],
  ["🏛",  "Club Founder",   "Post in 3 different clubs",       p => p.clubsPosted >= 3],
  ["⚡", "Spark Starter",   "First to post in any subject",    p => p.firstPost > 0],
  ["🎖",  "Veteran",        "Active for 7+ days total",        p => p.days && p.days.size >= 7],
];
const TITLES = [[50, "Legend"], [25, "Mentor"], [10, "Helper"], [0, "Rising star"]];
const titleOf = (pts) => TITLES.find(([min]) => pts >= min)[1];

function renderNetwork() {
  const allPosts = [...state.doubts, ...state.ideas, ...state.clubs, ...state.gate, ...state.challenges];
  const totalPosts = allPosts.length;
  const totalMembers = new Set(allPosts.filter(p => !p.anonymous).map(p => p.authorId)).size;
  return [
    el("h2", {}, "🌐 RGUKT Spark Network"),
    el("p", { class: "hint" }, totalMembers + " students · " + totalPosts + " posts"),
    el("div", { class: "label" }, "What you can do"),
    el("ul", { class: "network-features" },
      el("li", {}, "📚 Ask doubts that any RGUKT student can answer"),
      el("li", {}, "💡 Share ideas for projects and research"),
      el("li", {}, "🏛 Join clubs and find teammates"),
      el("li", {}, "🏆 Compete on the all-RGUKT leaderboard"),
      el("li", {}, "🎓 Learn from IIT mentors")),
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "button", onclick: () => { state.tab = "clubs"; state.group = "All"; state.mode = "intro"; render(); } }, "🏛 Browse Clubs"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}

function campusStats() {
  const map = {};
  for (const c of CAMPUSES) map[c] = { campus: c, posts: 0, resolved: 0, answers: 0, points: 0 };
  for (const d of state.doubts) {
    if (!d.campus || !map[d.campus]) continue;
    map[d.campus].posts++; map[d.campus].points += 1;
    if (d.resolvedReplyId) { map[d.campus].resolved++; }
  }
  for (const i of state.ideas) if (i.campus && map[i.campus]) { map[i.campus].posts++; map[i.campus].points += 2; }
  for (const c of state.clubs) if (c.campus && map[c.campus]) { map[c.campus].posts++; map[c.campus].points += 1; }
  for (const r of state.replies) {
    if (r.anonymous) continue;
    const parent = state.doubts.find(d => d.id === r.parentId);
    if (!parent || !parent.campus || !map[parent.campus]) continue;
    map[parent.campus].answers++; map[parent.campus].points += 2;
    if (parent.resolvedReplyId === r.id) map[parent.campus].points += 5;
  }
  return Object.values(map).sort((a, b) => b.points - a.points);
}

function renderLeaders() {
  const rows = [...allStats().values()].filter(p => p.points > 0).sort((a, b) => b.points - a.points).slice(0, 15);
  const medal = ["🥇", "🥈", "🥉"];
  const meId = store && store.uid;
  const list = rows.length
    ? el("ol", { class: "board" }, rows.map((p, i) => el("li", { class: p.id === meId ? "me" : null },
        el("span", { class: "rank" }, medal[i] || String(i + 1)),
        avatarEl(p.id === meId ? getAvatar() : avatarFor(p.name || ""), "av av-lg"),
        el("span", { class: "who" },
          el("span", { class: "board-name-row" },
            el("strong", {}, (p.id === meId ? p.name + " (you)" : p.name) + " " + BADGES.filter(b => b[3](p)).map(b => b[0]).join(""))),
          el("small", {}, "Lv " + p.level.n + " " + titleOf(p.points) + " · " + plural(p.answers, "answer") + " · " + p.helpful + " helpful · " + p.quizRight + " quiz" + (p.streak > 1 ? " · 🔥" + p.streak + "-day streak" : ""))),
        el("span", { class: "pts" }, p.points + " pts"))))
    : el("p", { class: "hint" }, "No points yet. Answer a doubt or today's quiz to get on the board.");

  // Campus rivalry board
  const campuses = campusStats();
  const maxPts = Math.max(...campuses.map(c => c.points), 1);
  const rivalMedal = ["🥇","🥈","🥉","4️⃣"];
  const rivalBoard = CAMPUSES.length > 0
    ? el("div", { class: "rival-board" }, ...campuses.map((c, i) =>
        el("div", { class: "rival-row" },
          el("span", { class: "rival-rank" }, CAMPUS_ICON[c.campus] || rivalMedal[i] || String(i + 1)),
          el("span", { class: "rival-name", style: "color:" + campusColor(c.campus) }, c.campus),
          el("div", { class: "rival-bar-wrap" },
            el("div", { class: "rival-bar", style: "width:" + Math.round(c.points * 100 / maxPts) + "%;background:" + campusColor(c.campus) })),
          el("span", { class: "rival-score" }, c.points + " pts"),
          el("span", { class: "rival-sub" }, c.posts + " posts · " + c.resolved + " solved")
        )
      ))
    : null;

  return [
    el("h2", {}, "🏆 Top Helpers"),
    list,
    el("p", { class: "hint" }, "Answer a classmate's doubt +2 · answer marked helpful +5 more · each 👍💡🔥 on your answer +1 · daily quiz right +3 · share an idea +2 · each like on your idea +1 · ask a doubt +1. Anonymous posts don't count."),
    rivalBoard && el("div", { class: "label" }, "🏫 Campus Rivalry — all 4 RGUKT campuses"),
    rivalBoard,
    rivalBoard && el("p", { class: "hint" }, "Campus points — ask a doubt +1 · share an idea +2 · helpful answer +5 · post in clubs +1. Compete with other campuses."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ].filter(Boolean);
}

function renderHeatmap(p) {
  const today = dayNum();
  const cells = Array.from({ length: 30 }, (_, i) => {
    const d = today - 29 + i;
    const active = p.days && p.days.has(d);
    return el("span", { class: "heat-cell" + (active ? " hot" : ""), title: active ? "Active" : "Inactive" });
  });
  return el("div", { class: "heatmap" }, ...cells);
}

function renderMe() {
  const p = (store && allStats().get(store.uid)) || { name: getName(), points: 0, answers: 0, helpful: 0, ideas: 0, quizRight: 0, streak: 0, reacts: 0, likes: 0, asked: 0, quizDone: 0, level: levelOf(0) };
  const lv = p.level, pct = Math.round((p.points - lv.from) * 100 / (lv.to - lv.from));
  // Avatar picker — 3D portraits + emoji
  const cur = getAvatar();
  const dbPicker = el("div", { class: "avatar-picker" },
    DB_SEEDS.map(seed => {
      const url = dbUrl(seed);
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "av-opt av-opt-img" + (cur === url ? " selected" : "");
      btn.title = seed;
      const img = document.createElement("img");
      img.src = url; img.alt = seed; img.loading = "lazy"; img.width = 32; img.height = 32;
      btn.appendChild(img);
      btn.addEventListener("click", () => { setAvatar(url); render(); });
      return btn;
    })
  );
  const emojiPicker = el("div", { class: "avatar-picker" },
    AVATARS.map(icon => {
      const btn = el("button", { type: "button", class: "av-opt" + (cur === icon ? " selected" : ""), title: icon }, icon);
      btn.addEventListener("click", () => { setAvatar(icon); render(); });
      return btn;
    }));
  return [
    el("div", { class: "profile-hero" },
      avatarEl(cur, "av av-hero"),
      el("div", {},
        el("h2", {}, (getName() || "You") + " · Level " + lv.n),
        el("p", { class: "hint" }, titleOf(p.points) + " · " + plural(p.points, "point")))),
    el("p", { class: "hint" }, "📷 Your profile photo (everyone can see it next to your posts)"),
    el("div", { class: "rowbtns" }, el("button", { type: "button", class: "btn sm primary", onclick: pickDp }, getDp() ? "Change photo" : "Upload photo"), getDp() && el("button", { type: "button", class: "btn sm", onclick: removeDp }, "Remove photo")),
    el("p", { class: "hint" }, "💬 Your status (shown on your stories)"),
    (() => { const inp = el("input", { type: "text", maxlength: "60", placeholder: "e.g. Busy with exams 📚", "aria-label": "Your status", value: getStatus() }); const save = async () => { try { localStorage.setItem("dd-status", inp.value.trim().slice(0, 60)); await syncProfile(); showNotice("Status saved ✅"); setTimeout(() => showNotice(""), 2000); } catch (e) { showNotice(errText(e)); } };
      return el("div", { class: "rowbtns" }, inp, el("button", { type: "button", class: "btn sm primary", onclick: save }, "Save"), ...["📚 Studying", "😴 Sleeping", "🎯 Placement prep", "🎮 Free"].map(t => el("button", { type: "button", class: "btn sm", onclick: () => { inp.value = t; } }, t))); })(),
    el("p", { class: "hint" }, "🎨 3D Portraits"),
    dbPicker,
    el("p", { class: "hint" }, "Emoji icons"),
    emojiPicker,
    el("div", { class: "xp", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct), "aria-label": "Progress to next level" }, el("span", { style: "width:" + pct + "%" })),
    el("p", { class: "hint" }, (lv.to - p.points) + (lv.to - p.points === 1 ? " more point" : " more points") + " to reach level " + (lv.n + 1) + "."),
    el("div", { class: "stats" },
      [["🔥", p.streak + "-day", "streak"], ["🤝", p.answers, "answers"], ["✅", p.helpful, "helpful"], ["🧠", p.quizRight, "quiz right"], ["💡", p.ideas, "ideas"], ["❤️", p.reacts + p.likes, "reactions"]]
        .map(([i, v, l]) => el("div", { class: "stat" }, el("b", {}, i + " " + v), el("small", {}, l)))),
    store && el("details", { class: "quiz-y" }, el("summary", {}, MENTORS.has(store.uid) ? "🎓 You are a verified mentor" : "🎓 Are you an IIT mentor?"),
      el("p", { class: "hint" }, "Mentors — send this ID to the board's teacher so your answers show the mentor badge. It identifies this phone or computer."),
      el("div", { class: "rowbtns" }, el("code", { class: "devid" }, store.uid), el("button", { class: "btn sm", type: "button", onclick: (e) => copyLink(e.currentTarget, store.uid) }, "Copy ID"))),
    el("div", { class: "label" }, "📅 Activity — last 30 days"),
    renderHeatmap(p),
    el("div", { class: "label" }, "Badges"),
    el("div", { class: "badges" }, BADGES.map(([icon, name, how, test]) => el("div", { class: "badge" + (test(p) ? " got" : "") }, el("span", { class: "bicon" }, icon), el("b", {}, name), el("small", {}, how)))),
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "button", onclick: () => { state.mode = "quiz"; render(); } }, "🧠 Today's quiz"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = "learn"; render(); } }, "📚 Learn from IIT"),
      el("button", { class: "btn", type: "button", onclick: () => { state.afterName = "me"; state.mode = "name"; render(); } }, "Change name"),
      PRIVATE && el("button", { class: "btn", type: "button", onclick: () => { setCode(""); location.reload(); } }, "Change class code"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}

// ---------- confetti ----------
function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = el("canvas", { class: "confetti" }); document.body.append(c);
  const W = c.width = innerWidth, H = c.height = innerHeight, x = c.getContext("2d");
  const parts = Array.from({ length: 140 }, () => ({ x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4, s: 5 + Math.random() * 6, r: Math.random() * 6, c: PALETTE[Math.floor(Math.random() * PALETTE.length)] }));
  const t0 = performance.now();
  const tick = (t) => {
    x.clearRect(0, 0, W, H);
    for (const p of parts) { p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.r += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }
    if (t - t0 < 1800) requestAnimationFrame(tick); else c.remove();
  };
  requestAnimationFrame(tick);
}

// ---------- learn from IIT: NPTEL, IIT lectures, Virtual Labs, mentors ----------
// Search terms for each subject's IIT NPTEL course. Edit them in config.js under `learn`.
const LEARN = Object.assign({
  "DLD": "Digital Circuits", "DSP": "Digital Signal Processing", "CN": "Computer Networks",
  "AEC": "Analog Electronic Circuits", "CS": "Control Systems", "CS-2": "Communication Systems",
  "PRV": "Probability and Random Processes", "RFME": "Microwave Engineering", "CO & D": "Computer Organization and Architecture",
}, CFG.learn || {});
const learnTerm = (subject) => LEARN[subject] || subject;
const nptelUrl = (subject) => "https://www.google.com/search?q=" + encodeURIComponent("site:onlinecourses.nptel.ac.in OR site:nptel.ac.in " + learnTerm(subject));
const lectureUrl = (subject, topic) => "https://www.youtube.com/results?search_query=" + encodeURIComponent("NPTEL " + learnTerm(subject) + (topic ? " " + topic : ""));
const VLAB_URL = "https://www.vlab.co.in/broad-area-electronics-and-communications";
const outLink = (href, text, cls = "btn sm") => el("a", { class: cls, href, target: "_blank", rel: "noopener noreferrer" }, text);

const MENTOR_AFTER = 2 * 86400000;
const needsMentor = (d) => !d.resolvedReplyId && Date.now() - (d.createdAt || 0) > MENTOR_AFTER && !repliesFor(d.id).some(isMentor);

function expertHelp(d) {
  const g = d.subject;
  const text = d.title + (d.body ? "\n\n" + d.body : "");
  return el("div", { class: "expert" },
    el("div", { class: "label" }, needsMentor(d) ? "⏳ Waiting 2+ days — get expert help" : "Get help from IIT experts"),
    el("div", { class: "rowbtns" },
      el("a", { class: "btn sm", href: nptelUrl(g), target: "_blank", rel: "noopener noreferrer", onclick: () => { try { navigator.clipboard.writeText(text); } catch (_) {} } }, "🎓 Ask on IIT NPTEL forum"),
      outLink(lectureUrl(g, d.title), "▶ Watch IIT lecture")),
    el("p", { class: "hint" }, "\u201cAsk on IIT NPTEL forum\u201d copies this doubt and opens the IIT course for " + g + ". Enrol free, open the course forum, and paste it there."));
}

function renderLearn() {
  const pending = state.doubts.filter(needsMentor).sort((a, b) => a.createdAt - b.createdAt);
  const msg = "Hi! Students of G Block Mind Hub need help with these doubts:\n" + pending.slice(0, 10).map((d, i) => (i + 1) + ". [" + d.subject + "] " + d.title + " " + location.origin + location.pathname + "#doubts/" + d.id).join("\n") + "\nThe class code is needed to open them. Thank you!";
  return [
    el("h2", {}, "📚 Learn from IIT"),
    el("p", { class: "hint" }, "Free courses and lectures by IIT professors. NPTEL course forums are answered by IIT teaching assistants."),
    el("div", { class: "rowbtns" },
      outLink("https://onlinecourses.nptel.ac.in", "NPTEL courses"),
      outLink(VLAB_URL, "🧪 IIT Virtual Labs (ECE)"),
      outLink("https://swayam.gov.in", "SWAYAM")),
    el("div", { class: "learn" }, SUBJECTS.map(s => el("div", { class: "learn-card", ...colorAttrs(s, "doubts") },
      el("span", { class: "tag", ...colorAttrs(s, "doubts") }, s),
      el("strong", {}, learnTerm(s)),
      el("div", { class: "rowbtns" }, outLink(nptelUrl(s), "🎓 IIT course", "linkbtn"), outLink(lectureUrl(s), "▶ Lectures", "linkbtn"))))),
    el("div", { class: "label" }, "🎓 Mentors"),
    el("p", { class: "hint" }, MENTORS.size
      ? "Verified mentors: " + [...MENTORS.values()].join(", ") + ". Their answers show a 🎓 badge and appear first."
      : "No mentors added yet. Invite IIT students or alumni; each one opens this board, taps their name, and sends you the mentor ID shown there."),
    pending.length
      ? el("div", { class: "rowbtns" },
          el("a", { class: "btn sm wa", href: "https://wa.me/?text=" + encodeURIComponent(msg), target: "_blank", rel: "noopener noreferrer" }, "Send " + plural(pending.length, "pending doubt") + " to mentors on WhatsApp"),
          el("button", { class: "btn sm", type: "button", onclick: () => { state.filter = "mentor"; $("filter").value = "mentor"; state.mode = "intro"; render(); } }, "Show them"))
      : el("p", { class: "hint" }, "No doubts are waiting for a mentor. Doubts unsolved for 2 days appear here."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}


// ---------- alumni connect ----------
let alumniView = "dir", alumniBranch = "All", alumniQuery = "";
const ALUMNI_GROUP = "Alumni";
const ALUMNI_HELP = ["Career guidance", "Referrals", "Resume review", "Mock interviews", "GATE / M.Tech", "Study abroad", "Startups"];
const LINKEDIN_RE = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/[A-Za-z0-9_\-\/%.?=&]+$/i;
const SAFE_URL_RE = /^https:\/\/[A-Za-z0-9.\-]+\.[A-Za-z]{2,}(\/[^\s<>"]*)?$/;
function alumniKV(body) {
  const m = {};
  for (const line of String(body || "").split("\n")) { const i = line.indexOf(":"); if (i > 0) m[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim(); }
  return m;
}
const ADMINS = new Set((CFG.admins || []).filter(a => a && a.id).map(a => a.id));
const isAdmin = () => !!(store && ADMINS.has(store.uid));
const ALUMNI_APPROVAL = ADMINS.size > 0;
const approvalKey = (id) => "alumni~ok~" + id;
const approvals = (id) => state.likes.filter(l => l.ideaId === approvalKey(id) && ADMINS.has(l.uid));
function alumniPosts() { return state.clubs.filter(d => d.club === ALUMNI_GROUP && !d.deleted && !isHidden(d)); }
// A profile is approved when an admin approved it. A job is approved when an admin approved it
// or its author already has an approved profile.
function alumniApproved(d) {
  if (!ALUMNI_APPROVAL || ADMINS.has(d.authorId) || approvals(d.id).length) return true;
  if (isAlumniJob(d)) return alumniPosts().some(x => isAlumniProfile(x) && x.authorId === d.authorId && approvals(x.id).length);
  return false;
}
const alumniVisible = (d) => alumniApproved(d) || mine(d) || isAdmin();
async function alumniApprove(d) {
  if (!isAdmin()) return;
  const key = approvalKey(d.id), id = key + "_" + store.uid, before = state.likes;
  state.likes = [...state.likes, { id, ideaId: key, uid: store.uid, createdAt: Date.now() }]; render();
  try { await store.set("likes", id, { ideaId: key, uid: store.uid, createdAt: Date.now() }); }
  catch (e) { state.likes = before; render(); showNotice(errText(e)); }
}
async function alumniRevoke(d) {
  if (!isAdmin()) return;
  const key = approvalKey(d.id), before = state.likes;
  const mineAndOthers = approvals(d.id);
  state.likes = state.likes.filter(l => l.ideaId !== key); render();
  try { await Promise.all(mineAndOthers.map(l => store.remove("likes", l.id || (key + "_" + l.uid)))); }
  catch (e) { state.likes = before; render(); showNotice(errText(e)); }
}
function alumniStatus(d) {
  if (!ALUMNI_APPROVAL) return null;
  return alumniApproved(d)
    ? el("span", { class: "pill done" }, "✅ Verified")
    : el("span", { class: "pill open" }, mine(d) ? "⏳ Waiting for admin approval (only you see this)" : "⏳ Pending approval");
}
function alumniAdminRow(d) {
  if (!isAdmin()) return null;
  return el("div", { class: "rowbtns" },
    alumniApproved(d) && approvals(d.id).length
      ? el("button", { class: "btn sm", type: "button", onclick: () => alumniRevoke(d) }, "↩️ Revoke approval")
      : !alumniApproved(d) ? el("button", { class: "btn sm primary", type: "button", onclick: () => alumniApprove(d) }, "✅ Approve") : null,
    el("button", { class: "btn sm", type: "button", onclick: (e) => confirmDelete(e.currentTarget, async () => { await softDelete("clubs", d.id); render(); }) }, "🗑️ Remove"));
}
const isAlumniProfile = (d) => (d.title || "").startsWith("🎓 ");
const isAlumniJob = (d) => (d.title || "").startsWith("💼 ");
function openAlumniPost(id) { state.tab = "clubs"; state.group = "All"; openItem(id); }
function alumniGo(mode) { state.mode = mode; render(); if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" }); }

function alumniProfileCard(d) {
  const kv = alumniKV(d.body);
  const name = d.title.replace(/^🎓\s*/, "").split(" — ")[0];
  const pills = [kv.branch, kv.batch && "Batch " + kv.batch].filter(Boolean);
  return el("div", { class: "learn-card" },
    el("strong", {}, "🎓 " + name),
    el("div", { class: "meta" }, ...pills.map(x => el("span", { class: "pill year-pill" }, x)), alumniStatus(d)),
    kv.working && el("p", {}, "🏢 " + kv.working),
    kv.location && el("p", { class: "hint" }, "📍 " + kv.location),
    kv.help && el("p", { class: "hint" }, "🤝 Can help with: " + kv.help),
    kv.about && el("p", { class: "hint" }, kv.about),
    el("div", { class: "rowbtns" },
      kv.linkedin && LINKEDIN_RE.test(kv.linkedin) && outLink(kv.linkedin, "🔗 LinkedIn", "linkbtn"),
      el("button", { class: "btn sm primary", type: "button", onclick: () => openAlumniPost(d.id) }, mine(d) ? "Manage my profile" : "💬 View & message")),
    alumniAdminRow(d));
}
function alumniJobCard(d) {
  const kv = alumniKV(d.body);
  return el("div", { class: "learn-card" },
    el("strong", {}, d.title),
    el("div", { class: "meta" }, alumniStatus(d), kv.company && el("span", { class: "pill year-pill" }, kv.company), kv.location && el("span", { class: "pill year-pill" }, "📍 " + kv.location), kv.experience && el("span", { class: "pill year-pill" }, kv.experience)),
    kv.details && el("p", { class: "hint" }, kv.details),
    el("p", { class: "hint" }, "Posted by " + who(d) + " · " + ago(d.createdAt)),
    el("div", { class: "rowbtns" },
      kv.apply && SAFE_URL_RE.test(kv.apply) && outLink(kv.apply, "🔗 Apply / details", "linkbtn"),
      el("button", { class: "btn sm", type: "button", onclick: () => openAlumniPost(d.id) }, mine(d) ? "Manage" : "💬 Ask about this")),
    alumniAdminRow(d));
}
function renderAlumni() {
  const leave = () => { state.mode = state.selected ? "view" : "intro"; render(); };
  const everything = alumniPosts();
  const all = everything.filter(d => !(isAlumniProfile(d) || isAlumniJob(d)) || alumniVisible(d));
  const pending = isAdmin() ? everything.filter(d => (isAlumniProfile(d) || isAlumniJob(d)) && !alumniApproved(d)) : [];
  const q = alumniQuery.trim().toLowerCase();
  const profiles = all.filter(isAlumniProfile).filter(d => {
    const kv = alumniKV(d.body);
    return (alumniBranch === "All" || kv.branch === alumniBranch) && (!q || (d.title + " " + d.body).toLowerCase().includes(q));
  });
  const jobs = all.filter(isAlumniJob).filter(d => !q || (d.title + " " + d.body).toLowerCase().includes(q));
  const questions = all.filter(d => !isAlumniProfile(d) && !isAlumniJob(d));
  const tabBtn = (id, label) => el("button", { class: "btn sm" + (alumniView === id ? " primary" : ""), type: "button", onclick: () => { alumniView = id; render(); } }, label);
  const out = [
    el("h2", {}, "🎓 Alumni Connect"),
    el("p", { class: "hint" }, "Meet RGUKT seniors who graduated and are now working, studying or building startups. Ask for guidance, referrals and advice. Profiles are shared by the alumni themselves, so check their LinkedIn before trusting any offer, and never pay anyone for a job."),
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "button", onclick: () => alumniGo(getName() ? "alumniJoin" : "name") }, "🎓 I'm an alumnus: join"),
      el("button", { class: "btn", type: "button", onclick: () => alumniGo(getName() ? "alumniJob" : "name") }, "💼 Post a job / referral"),
      el("button", { class: "btn", type: "button", onclick: () => { state.tab = "clubs"; state.group = ALUMNI_GROUP; openAsk(); } }, "❓ Ask alumni")),
    el("div", { class: "rowbtns" }, tabBtn("dir", "👥 Directory (" + all.filter(isAlumniProfile).length + ")"), tabBtn("jobs", "💼 Jobs (" + all.filter(isAlumniJob).length + ")"), tabBtn("qa", "❓ Questions (" + questions.length + ")"), isAdmin() && tabBtn("admin", "🛡️ Pending (" + pending.length + ")")),
  ];
  if (alumniView !== "qa" && alumniView !== "admin") {
    out.push(el("input", { type: "search", class: "alumni-search", placeholder: alumniView === "dir" ? "Search name, company, city…" : "Search jobs…", value: alumniQuery, "aria-label": "Search alumni",
      oninput: (e) => { alumniQuery = e.target.value; const pos = e.target.selectionStart; render(); const n = document.querySelector(".alumni-search"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } }));
  }
  if (alumniView === "dir") {
    out.push(el("div", { class: "rowbtns" }, ["All", ...Object.keys(CAREER)].map(b => el("button", { class: "btn sm" + (alumniBranch === b ? " primary" : ""), type: "button", onclick: () => { alumniBranch = b; render(); } }, b))));
    out.push(...(profiles.length ? profiles.map(alumniProfileCard) : [el("div", { class: "empty" }, el("strong", {}, "No alumni profiles here yet"), "Are you an RGUKT alumnus? Tap “I'm an alumnus: join” and help your juniors.")]));
  } else if (alumniView === "jobs") {
    out.push(...(jobs.length ? jobs.map(alumniJobCard) : [el("div", { class: "empty" }, el("strong", {}, "No jobs or referrals yet"), "Alumni can post openings and referrals here for RGUKT students.")]));
  } else if (alumniView === "admin" && isAdmin()) {
    out.push(el("p", { class: "hint" }, "Review each profile or job before approving. Check the LinkedIn link and make sure the person is really an RGUKT alumnus. Approved profiles are shown to all students."));
    out.push(...(pending.length ? pending.map(d => isAlumniProfile(d) ? alumniProfileCard(d) : alumniJobCard(d)) : [el("div", { class: "empty" }, el("strong", {}, "Nothing waiting"), "All alumni profiles and jobs are reviewed.")]));
  } else {
    out.push(...(questions.length ? questions.map(d => el("div", { class: "learn-card" }, el("strong", {}, d.title), el("p", { class: "hint" }, "By " + who(d) + " · " + ago(d.createdAt) + " · " + repliesFor(d.id).length + " replies"), el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => openAlumniPost(d.id) }, "Open")))) : [el("div", { class: "empty" }, el("strong", {}, "No questions yet"), "Tap “Ask alumni” to ask the first one.")]));
  }
  out.push(
    el("div", { class: "label" }, "💬 How to message an alumnus"),
    el("p", { class: "hint" }, "“Hello sir/madam, I'm [name], E[year] [branch] at RGUKT [campus]. I'm interested in [role/field] and saw you work at [company]. Could you spare 10 minutes to guide me on [specific question]? Thank you!” Keep it short, specific and polite."),
    el("div", { class: "label" }, "🔎 Find more RGUKT alumni (free)"),
    el("div", { class: "rowbtns" },
      outLink("https://www.linkedin.com/search/results/people/?keywords=RGUKT", "LinkedIn: search RGUKT", "linkbtn"),
      outLink("https://www.linkedin.com/search/results/groups/?keywords=RGUKT", "LinkedIn groups", "linkbtn"),
      outLink("https://adplist.org", "ADPList free mentors", "linkbtn"),
      outLink("https://www.rguktn.ac.in", "RGUKT Nuzvid", "linkbtn"),
      outLink("https://www.rguktong.ac.in", "Ongole", "linkbtn"),
      outLink("https://www.rguktrkv.ac.in", "RK Valley", "linkbtn"),
      outLink("https://www.rguktsklm.ac.in", "Srikakulam", "linkbtn")),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: leave }, "Back")));
  return out;
}
function alumniForm(kind) {
  const isJob = kind === "job";
  const err = el("p", { class: "err", hidden: true });
  const cancel = () => { state.mode = "alumni"; render(); };
  const branches = Object.keys(CAREER), thisYear = new Date().getFullYear();
  const years = []; for (let y = thisYear + 1; y >= 2012; y--) years.push(String(y));
  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const f = form.elements, val = (n) => (f[n] ? f[n].value.trim() : "");
    const bad = (m) => { err.textContent = m; err.hidden = false; };
    if (!store) return bad("Not connected yet. Check your internet and try again.");
    let title, lines;
    if (isJob) {
      const role = val("role"), company = val("company"), apply = val("apply");
      if (role.length < 3 || company.length < 2) return bad("Add the role and company name.");
      if (apply && !SAFE_URL_RE.test(apply)) return bad("The apply link must start with https://");
      title = ("💼 " + role + " — " + company).slice(0, 200);
      lines = ["Company: " + company, val("location") && "Location: " + val("location"), val("experience") && "Experience: " + val("experience"), apply && "Apply: " + apply, val("details") && "Details: " + val("details").replace(/\n+/g, " ")].filter(Boolean);
    } else {
      const name = val("name"), working = val("working"), linkedin = val("linkedin");
      if (name.length < 2) return bad("Enter your name.");
      if (working.length < 2) return bad("Tell us where you work or study.");
      if (linkedin && !LINKEDIN_RE.test(linkedin)) return bad("LinkedIn link must look like https://www.linkedin.com/in/your-name");
      if (!f.consent.checked) return bad("Please tick the box to confirm you agree to show these details.");
      const help = ALUMNI_HELP.filter((h, i) => f["help" + i] && f["help" + i].checked).join(", ");
      title = ("🎓 " + name + " — " + val("branch") + " · Batch " + val("batch")).slice(0, 200);
      lines = ["Branch: " + val("branch"), "Batch: " + val("batch"), "Working: " + working, val("location") && "Location: " + val("location"), linkedin && "LinkedIn: " + linkedin, help && "Help: " + help, val("about") && "About: " + val("about").replace(/\n+/g, " ")].filter(Boolean);
    }
    const body = lines.join("\n").slice(0, 4800);
    if (hasBadWords(title + " " + body)) return bad(LANGUAGE_MSG);
    const wait = spamCheck(); if (wait) return bad(wait);
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      const id = store.newId("clubs");
      const doc = { title, body, club: ALUMNI_GROUP, authorId: store.uid, authorName: isJob ? (getName() || "Alumnus") : val("name").slice(0, 40), anonymous: false, urgent: false, createdAt: Date.now(), pages: [], fileAttachments: [] };
      const myC = getCampus(); if (myC) doc.campus = myC;
      state.clubs = [{ id, ...doc }, ...state.clubs.filter(x => x.id !== id)];
      notePosted();
      await store.set("clubs", id, doc);
      alumniView = isJob ? "jobs" : "dir"; state.mode = "alumni"; render();
      showNotice(ALUMNI_APPROVAL && !isAdmin() ? "Submitted! It will appear for everyone after an admin approves it. You can already see it." : (isJob ? "Job posted. Thank you for helping your juniors!" : "Welcome to Alumni Connect! Your profile is live."), "ok");
    } catch (e2) { btn.disabled = false; btn.textContent = isJob ? "Post job" : "Join Alumni Connect"; bad(errText(e2)); }
  } },
    ...(isJob ? [
      el("div", { class: "two" },
        el("label", {}, "Role", el("input", { name: "role", maxlength: "80", required: true, placeholder: "e.g. Software Engineer (Fresher)" })),
        el("label", {}, "Company", el("input", { name: "company", maxlength: "60", required: true, placeholder: "e.g. Infosys" }))),
      el("div", { class: "two" },
        el("label", {}, "Location", el("input", { name: "location", maxlength: "60", placeholder: "e.g. Hyderabad / Remote" })),
        el("label", {}, "Experience", el("input", { name: "experience", maxlength: "40", placeholder: "e.g. Freshers / 0-2 years" }))),
      el("label", {}, "Apply link (optional, https://)", el("input", { name: "apply", maxlength: "300", placeholder: "https://careers.example.com/job/123" })),
      el("label", {}, "Details", el("textarea", { name: "details", maxlength: "1000", placeholder: "Skills needed, how to get a referral, deadline…" })),
    ] : [
      el("label", {}, "Your name", el("input", { name: "name", maxlength: "40", required: true, value: getName() || "", placeholder: "Full name" })),
      el("div", { class: "two" },
        el("label", {}, "Branch", el("select", { name: "branch" }, branches.map(b => el("option", {}, b)))),
        el("label", {}, "Passing-out batch", el("select", { name: "batch" }, years.map(y => el("option", { selected: y === String(thisYear - 1) }, y))))),
      el("label", {}, "Where do you work or study?", el("input", { name: "working", maxlength: "100", required: true, placeholder: "e.g. Software Engineer at TCS / MS at TU Munich" })),
      el("label", {}, "City and country", el("input", { name: "location", maxlength: "60", placeholder: "e.g. Bengaluru, India" })),
      el("label", {}, "LinkedIn (optional)", el("input", { name: "linkedin", maxlength: "200", placeholder: "https://www.linkedin.com/in/your-name" })),
      el("div", { class: "label" }, "I can help with"),
      el("div", { class: "checks" }, ALUMNI_HELP.map((h, i) => el("label", { class: "check" }, el("input", { type: "checkbox", name: "help" + i }), h))),
      el("label", {}, "About you (optional)", el("textarea", { name: "about", maxlength: "400", placeholder: "A line or two for juniors: your journey, advice, how to reach you." })),
      el("div", { class: "checks" }, el("label", { class: "check" }, el("input", { type: "checkbox", name: "consent" }), "I agree to show my name, work details and LinkedIn to RGUKT Spark students. I will not share my phone number publicly.")),
    ]),
    err,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "submit" }, isJob ? "Post job" : "Join Alumni Connect"),
      el("button", { class: "btn", type: "button", onclick: cancel }, "Cancel")));
  return [el("h2", {}, isJob ? "💼 Post a job or referral" : "🎓 Join Alumni Connect"),
    el("p", { class: "hint" }, isJob ? "Share an opening or offer a referral for juniors. Only post real opportunities, and never ask students for money." : "Your profile helps juniors find guidance." + (ALUMNI_APPROVAL ? " An admin reviews each profile before it is shown to students." : "") + " You can delete it any time by opening it and tapping Delete."),
    form];
}

// ---------- entertainment: small games, riddles, fun facts and free links ----------
const FUN_RIDDLES = [
  ["I have keys but open no locks, and space but no room. What am I?", "A keyboard."],
  ["What has a head and a tail but no body?", "A coin."],
  ["What gets wetter the more it dries?", "A towel."],
  ["I speak without a mouth and hear without ears. What am I?", "An echo."],
  ["What has hands but cannot clap?", "A clock."],
  ["What comes once in a minute, twice in a moment, but never in a thousand years?", "The letter M."],
  ["What is full of holes but still holds water?", "A sponge."],
  ["What has a bug but is not an insect?", "A computer program."],
  ["In binary, what is 1 + 1?", "10."],
  ["How many bits are in a byte?", "Eight."],
  ["Which loop never ends and can freeze your program?", "An infinite loop."],
  ["What can you catch but never throw?", "A cold."],
  ["Which month has 28 days?", "All of them."],
  ["How many times can you subtract 5 from 25?", "Once. After that, it is 20."],
  ["A father has 4 daughters and each daughter has one brother. How many children does he have?", "Five."],
  ["What is always coming but never arrives?", "Tomorrow."],
  ["What 5-letter word becomes shorter when you add two letters to it?", "Short."],
  ["What has to be broken before you can use it?", "An egg."],
  ["What travels around the world but stays in one corner?", "A stamp."],
  ["What word is spelled wrong in every dictionary?", "“Wrong.”"],
];
const FUN_FACTS = [
  "The first computer “bug” was a real moth found stuck in a Harvard Mark II relay in 1947.",
  "India's Chandrayaan-3 landed near the Moon's south pole in August 2023.",
  "The number zero as we use it today was developed in ancient India.",
  "ISRO's Mars Orbiter Mission reached Mars orbit on its very first attempt in 2014.",
  "The first email was sent in 1971 by Ray Tomlinson.",
  "The word “robot” comes from the Czech word “robota”, meaning forced labour.",
  "Python is named after the comedy group Monty Python, not the snake.",
  "Honey almost never spoils. Edible honey has been found in ancient Egyptian tombs.",
  "Octopuses have three hearts.",
  "The QWERTY keyboard layout was designed to reduce typewriter jams.",
  "A single bolt of lightning can be several times hotter than the surface of the Sun.",
  "The first 1 GB hard drive, made in 1980, weighed about 250 kg.",
];
const FUN_SENTENCES = [
  "Practice makes a programmer perfect.",
  "Every great engineer started as a curious student.",
  "Debugging is like being a detective in a crime you committed.",
  "Small steps every day build big results.",
  "Ask boldly, answer together, innovate endlessly.",
];
const FUN_LINKS = [
  ["♟️ Chess (free)", "https://lichess.org"],
  ["🧮 Project Euler puzzles", "https://projecteuler.net"],
  ["🎄 Advent of Code", "https://adventofcode.com"],
  ["📖 Free books: Project Gutenberg", "https://www.gutenberg.org"],
  ["📚 Standard Ebooks", "https://standardebooks.org"],
  ["🌌 NASA picture of the day", "https://apod.nasa.gov/apod/astropix.html"],
  ["🎬 Internet Archive (films, music, books)", "https://archive.org"],
  ["🎵 Free Music Archive", "https://freemusicarchive.org"],
  ["▶ Veritasium", "https://www.youtube.com/@veritasium"],
  ["▶ 3Blue1Brown", "https://www.youtube.com/@3blue1brown"],
  ["▶ Kurzgesagt", "https://www.youtube.com/@kurzgesagt"],
  ["▶ TED-Ed", "https://www.youtube.com/@TEDEd"],
  ["▶ Numberphile", "https://www.youtube.com/@numberphile"],
];
const funShuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const funBest = (k, v) => { try { const o = JSON.parse(localStorage.getItem("dd-fun-best") || "{}"); if (v === undefined) return o[k]; o[k] = v; localStorage.setItem("dd-fun-best", JSON.stringify(o)); } catch (_) {} return undefined; };

const yt = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
// Official YouTube jukeboxes. These are copyrighted songs streamed by the rights holders on YouTube; Spark only links out.
const FUN_JUKE = [
  ["🎤 Telugu directors",[["M. M. Keeravani","M M Keeravani hits jukebox"], ["Devi Sri Prasad","Devi Sri Prasad hits jukebox"], ["S. Thaman","S Thaman hits jukebox"], ["Mani Sharma","Mani Sharma hits jukebox"], ["Ilaiyaraaja (Telugu)","Ilaiyaraaja (Telugu) hits jukebox"], ["A. R. Rahman (Telugu)","A R Rahman (Telugu) hits jukebox"], ["Koti","Koti hits jukebox"], ["Raj-Koti","Raj Koti hits jukebox"], ["Chakri","Chakri hits jukebox"], ["Anup Rubens","Anup Rubens hits jukebox"], ["Mickey J Meyer","Mickey J Meyer hits jukebox"], ["Kalyani Malik","Kalyani Malik hits jukebox"], ["R. P. Patnaik","R P Patnaik hits jukebox"], ["Gopi Sundar","Gopi Sundar hits jukebox"], ["Ghibran","Ghibran hits jukebox"], ["Bheems Ceciroleo","Bheems Ceciroleo hits jukebox"], ["Radhan","Radhan hits jukebox"], ["Vishal Chandrashekhar","Vishal Chandrashekhar hits jukebox"], ["Sai Kartheek","Sai Kartheek hits jukebox"], ["Harris Jayaraj (Telugu)","Harris Jayaraj (Telugu) hits jukebox"], ["Vidyasagar (Telugu)","Vidyasagar (Telugu) hits jukebox"], ["Ramesh Naidu","Ramesh Naidu hits jukebox"], ["K. Chakravarthy","K Chakravarthy hits jukebox"], ["Satyam","Satyam hits jukebox"], ["K. V. Mahadevan","K V Mahadevan hits jukebox"], ["Ghantasala","Ghantasala hits jukebox"], ["Ramana Gogula","Ramana Gogula hits jukebox"], ["M. M. Srilekha","M M Srilekha hits jukebox"], ["Vandemataram Srinivas","Vandemataram Srinivas hits jukebox"], ["Sri Kommineni","Sri Kommineni hits jukebox"], ["S. V. Krishna Reddy","S V Krishna Reddy hits jukebox"], ["Joshua Sridhar","Joshua Sridhar hits jukebox"], ["Shravan Bharadwaj","Shravan Bharadwaj hits jukebox"], ["Prashanth R Vihari","Prashanth R Vihari hits jukebox"], ["Sekhar Chandra","Sekhar Chandra hits jukebox"], ["Leon James (Telugu)","Leon James (Telugu) hits jukebox"], ["Sunil Kashyap","Sunil Kashyap hits jukebox"], ["Phani Kalyan","Phani Kalyan hits jukebox"], ["Mahati Swara Sagar","Mahati Swara Sagar hits jukebox"], ["Praveen Lakkaraju","Praveen Lakkaraju hits jukebox"], ["Gowra Hari","Gowra Hari hits jukebox"], ["Sricharan Pakala","Sricharan Pakala hits jukebox"], ["Achu Rajamani","Achu Rajamani hits jukebox"], ["Jakes Bejoy (Telugu)","Jakes Bejoy (Telugu) hits jukebox"], ["Hesham Abdul Wahab","Hesham Abdul Wahab hits jukebox"], ["Justin Prabhakaran (Telugu)","Justin Prabhakaran (Telugu) hits jukebox"], ["Anirudh (Telugu)","Anirudh (Telugu) hits jukebox"], ["Vijaya Bhaskar","Vijaya Bhaskar hits jukebox"], ["Pendyala Nageswara Rao","Pendyala Nageswara Rao hits jukebox"], ["Saluri Rajeswara Rao","Saluri Rajeswara Rao hits jukebox"], ["T. V. Raju","T V Raju hits jukebox"], ["Adi Narayana Rao","Adi Narayana Rao hits jukebox"], ["J. V. Raghavulu","J V Raghavulu hits jukebox"], ["S. Rajeswara Rao","S Rajeswara Rao hits jukebox"], ["Harshavardhan Rameshwar","Harshavardhan Rameshwar hits jukebox"], ["Ajay Arasada","Ajay Arasada hits jukebox"], ["Vijay Bulganin","Vijay Bulganin hits jukebox"], ["Chaitan Bharadwaj","Chaitan Bharadwaj hits jukebox"], ["Sagar Mahati","Sagar Mahati hits jukebox"], ["Shakthikanth Karthick","Shakthikanth Karthick hits jukebox"], ["Karthik Rodriguez","Karthik Rodriguez hits jukebox"], ["Raghu Kunche","Raghu Kunche hits jukebox"], ["Madhavapeddi Suresh","Madhavapeddi Suresh hits jukebox"], ["Chellapilla Satyam","Chellapilla Satyam hits jukebox"], ["Ram Miriyala","Ram Miriyala hits jukebox"], ["Kaala Bhairava","Kaala Bhairava hits jukebox"], ["S. A. Rajkumar (Telugu)","S A Rajkumar (Telugu) hits jukebox"], ["Deva (Telugu)","Deva (Telugu) hits jukebox"], ["Rajan-Nagendra (Telugu)","Rajan Nagendra (Telugu) hits jukebox"], ["Vijay Antony (Telugu)","Vijay Antony (Telugu) hits jukebox"], ["Santhosh Narayanan (Telugu)","Santhosh Narayanan (Telugu) hits jukebox"], ["Yuvan Shankar Raja (Telugu)","Yuvan Shankar Raja (Telugu) hits jukebox"], ["Rajesh Murugesan (Telugu)","Rajesh Murugesan (Telugu) hits jukebox"], ["Gopi Sundar (Telugu)","Gopi Sundar (Telugu) hits jukebox"]]],
  ["🎙️ Telugu playlists",[["Telugu melodies","Telugu melody songs video jukebox"], ["Telugu love songs","Telugu love songs jukebox"], ["Telugu mass beats","Telugu mass songs jukebox"], ["Telugu 90s hits","90s Telugu hit songs jukebox"], ["Telugu 2000s hits","2000s Telugu hit songs jukebox"], ["Telugu folk (Janapada)","Telugu folk songs jukebox"], ["Telugu devotional","Telugu devotional songs jukebox"], ["Telugu friendship songs","Telugu friendship songs jukebox"], ["Telugu old golden hits","Telugu old golden hits jukebox"], ["Telugu duets","Telugu duet songs jukebox"], ["Telugu sad songs","Telugu emotional sad songs jukebox"], ["Telugu college songs","Telugu college life songs jukebox"]]],
  ["🎻 Tamil directors",[["Ilaiyaraaja","Ilaiyaraaja hits jukebox"], ["A. R. Rahman","A R Rahman hits jukebox"], ["Anirudh Ravichander","Anirudh Ravichander hits jukebox"], ["Yuvan Shankar Raja","Yuvan Shankar Raja hits jukebox"], ["Harris Jayaraj","Harris Jayaraj hits jukebox"], ["Vidyasagar","Vidyasagar hits jukebox"], ["G. V. Prakash Kumar","G V Prakash Kumar hits jukebox"], ["Santhosh Narayanan","Santhosh Narayanan hits jukebox"], ["Deva","Deva hits jukebox"], ["D. Imman","D Imman hits jukebox"], ["Sam C. S.","Sam C S hits jukebox"], ["Hiphop Tamizha","Hiphop Tamizha hits jukebox"], ["M. S. Viswanathan","M S Viswanathan hits jukebox"], ["Gangai Amaran","Gangai Amaran hits jukebox"], ["Dhina","Dhina hits jukebox"], ["S. A. Rajkumar","S A Rajkumar hits jukebox"], ["Bharadwaj","Bharadwaj hits jukebox"], ["Sean Roldan","Sean Roldan hits jukebox"], ["Vijay Antony","Vijay Antony hits jukebox"], ["Karthik Raja","Karthik Raja hits jukebox"], ["Srikanth Deva","Srikanth Deva hits jukebox"], ["Sirpy","Sirpy hits jukebox"], ["Shankar-Ganesh","Shankar Ganesh hits jukebox"], ["T. Rajendar","T Rajendar hits jukebox"], ["Darbuka Siva","Darbuka Siva hits jukebox"], ["Dhibu Ninan Thomas","Dhibu Ninan Thomas hits jukebox"], ["Nivas K Prasanna","Nivas K Prasanna hits jukebox"], ["Ghibran (Tamil)","Ghibran (Tamil) hits jukebox"], ["Justin Prabhakaran","Justin Prabhakaran hits jukebox"], ["S. Thaman (Tamil)","S Thaman (Tamil) hits jukebox"], ["Leon James","Leon James hits jukebox"], ["G. Ramanathan","G Ramanathan hits jukebox"], ["K. V. Mahadevan (Tamil)","K V Mahadevan (Tamil) hits jukebox"], ["C. Sathya","C Sathya hits jukebox"], ["Siddharth Vipin","Siddharth Vipin hits jukebox"], ["Ron Ethan Yohann","Ron Ethan Yohann hits jukebox"], ["Taj Noor","Taj Noor hits jukebox"], ["Jassie Gift","Jassie Gift hits jukebox"], ["Sundar C Babu","Sundar C Babu hits jukebox"], ["Sabesh-Murali","Sabesh Murali hits jukebox"], ["Bharani","Bharani hits jukebox"], ["Maragathamani","Maragathamani hits jukebox"], ["Bombay Jayashri","Bombay Jayashri hits jukebox"], ["Sivamani","Sivamani hits jukebox"], ["Rajhesh Vaidhya","Rajhesh Vaidhya hits jukebox"], ["Aravind-Shankar","Aravind Shankar hits jukebox"], ["Rajesh Murugesan","Rajesh Murugesan hits jukebox"], ["Joshua Sridhar (Tamil)","Joshua Sridhar (Tamil) hits jukebox"]]],
  ["🎹 Hindi directors",[["A. R. Rahman (Hindi)","A R Rahman (Hindi) hits jukebox"], ["Pritam","Pritam hits jukebox"], ["Shankar-Ehsaan-Loy","Shankar Ehsaan Loy hits jukebox"], ["Vishal-Shekhar","Vishal Shekhar hits jukebox"], ["Amit Trivedi","Amit Trivedi hits jukebox"], ["Tanishk Bagchi","Tanishk Bagchi hits jukebox"], ["Mithoon","Mithoon hits jukebox"], ["Sachin-Jigar","Sachin Jigar hits jukebox"], ["Salim-Sulaiman","Salim Sulaiman hits jukebox"], ["Himesh Reshammiya","Himesh Reshammiya hits jukebox"], ["Jatin-Lalit","Jatin Lalit hits jukebox"], ["Anand-Milind","Anand Milind hits jukebox"], ["Nadeem-Shravan","Nadeem Shravan hits jukebox"], ["Anu Malik","Anu Malik hits jukebox"], ["Rajesh Roshan","Rajesh Roshan hits jukebox"], ["Bappi Lahiri","Bappi Lahiri hits jukebox"], ["Sajid-Wajid","Sajid Wajid hits jukebox"], ["R. D. Burman","R D Burman hits jukebox"], ["S. D. Burman","S D Burman hits jukebox"], ["Laxmikant-Pyarelal","Laxmikant Pyarelal hits jukebox"], ["Kalyanji-Anandji","Kalyanji Anandji hits jukebox"], ["Naushad","Naushad hits jukebox"], ["Madan Mohan","Madan Mohan hits jukebox"], ["Khayyam","Khayyam hits jukebox"], ["O. P. Nayyar","O P Nayyar hits jukebox"], ["Roshan","Roshan hits jukebox"], ["Shankar-Jaikishan","Shankar Jaikishan hits jukebox"], ["Hemant Kumar","Hemant Kumar hits jukebox"], ["C. Ramchandra","C Ramchandra hits jukebox"], ["Usha Khanna","Usha Khanna hits jukebox"], ["Sanjeev-Darshan","Sanjeev Darshan hits jukebox"], ["Anand Raj Anand","Anand Raj Anand hits jukebox"], ["Aadesh Shrivastava","Aadesh Shrivastava hits jukebox"], ["Uttam Singh","Uttam Singh hits jukebox"], ["Ismail Darbar","Ismail Darbar hits jukebox"], ["Ravindra Jain","Ravindra Jain hits jukebox"], ["Vishal Bhardwaj","Vishal Bhardwaj hits jukebox"], ["Amaal Mallik","Amaal Mallik hits jukebox"], ["Meet Bros","Meet Bros hits jukebox"], ["Sandesh Shandilya","Sandesh Shandilya hits jukebox"], ["Rochak Kohli","Rochak Kohli hits jukebox"], ["Ankit Tiwari","Ankit Tiwari hits jukebox"], ["Jeet Gannguli","Jeet Gannguli hits jukebox"], ["Ram Sampath","Ram Sampath hits jukebox"], ["Clinton Cerejo","Clinton Cerejo hits jukebox"], ["Sachet-Parampara","Sachet Parampara hits jukebox"], ["Sneha Khanwalkar","Sneha Khanwalkar hits jukebox"], ["Ravi (composer)","Ravi (composer) hits jukebox"], ["Shiv-Hari","Shiv Hari hits jukebox"], ["Vishal Dadlani","Vishal Dadlani hits jukebox"], ["Sandeep Chowta","Sandeep Chowta hits jukebox"], ["Ranjit Barot","Ranjit Barot hits jukebox"], ["Lesle Lewis","Lesle Lewis hits jukebox"], ["Shamir Tandon","Shamir Tandon hits jukebox"], ["Sharib-Toshi","Sharib Toshi hits jukebox"], ["Tony Kakkar","Tony Kakkar hits jukebox"], ["Yo Yo Honey Singh","Yo Yo Honey Singh hits jukebox"], ["Badshah","Badshah hits jukebox"], ["B Praak","B Praak hits jukebox"], ["Jaani","Jaani hits jukebox"], ["Arko","Arko hits jukebox"], ["Prem-Hardeep","Prem Hardeep hits jukebox"], ["Sapan-Jagmohan","Sapan Jagmohan hits jukebox"], ["Vanraj Bhatia","Vanraj Bhatia hits jukebox"], ["Rajat Dholakia","Rajat Dholakia hits jukebox"], ["Sanjay Leela Bhansali","Sanjay Leela Bhansali hits jukebox"], ["Ilaiyaraaja (Hindi)","Ilaiyaraaja (Hindi) hits jukebox"], ["Raamlaxman","Raamlaxman hits jukebox"], ["Chitragupt","Chitragupt hits jukebox"], ["Jaidev","Jaidev hits jukebox"], ["Anil Biswas","Anil Biswas hits jukebox"], ["S. N. Tripathi","S N Tripathi hits jukebox"], ["Daboo Malik","Daboo Malik hits jukebox"]]],
  ["🌴 Malayalam",[["M. Jayachandran","M Jayachandran hits jukebox"], ["Shaan Rahman","Shaan Rahman hits jukebox"], ["Ouseppachan","Ouseppachan hits jukebox"], ["Bijibal","Bijibal hits jukebox"], ["Sushin Shyam","Sushin Shyam hits jukebox"], ["Raveendran","Raveendran hits jukebox"], ["Johnson","Johnson hits jukebox"], ["Rex Vijayan","Rex Vijayan hits jukebox"], ["Gopi Sundar (Malayalam)","Gopi Sundar (Malayalam) hits jukebox"], ["Vidyasagar (Malayalam)","Vidyasagar (Malayalam) hits jukebox"], ["G. Devarajan","G Devarajan hits jukebox"], ["V. Dakshinamoorthy","V Dakshinamoorthy hits jukebox"], ["K. Raghavan","K Raghavan hits jukebox"], ["Shyam","Shyam hits jukebox"], ["Mohan Sithara","Mohan Sithara hits jukebox"], ["Berny-Ignatius","Berny Ignatius hits jukebox"], ["Alphons Joseph","Alphons Joseph hits jukebox"], ["Deepak Dev","Deepak Dev hits jukebox"], ["Prashant Pillai","Prashant Pillai hits jukebox"], ["Rahul Raj","Rahul Raj hits jukebox"], ["Vishnu Vijay","Vishnu Vijay hits jukebox"], ["Justin Varghese","Justin Varghese hits jukebox"], ["Jakes Bejoy","Jakes Bejoy hits jukebox"], ["Salil Chowdhury (Malayalam)","Salil Chowdhury (Malayalam) hits jukebox"], ["Sreevalsan J Menon","Sreevalsan J Menon hits jukebox"], ["Ranjin Raj","Ranjin Raj hits jukebox"], ["Sooraj S Kurup","Sooraj S Kurup hits jukebox"], ["Kailas Menon","Kailas Menon hits jukebox"], ["Jecin George","Jecin George hits jukebox"], ["Ratheesh Vegha","Ratheesh Vegha hits jukebox"], ["Sharreth","Sharreth hits jukebox"], ["M. B. Sreenivasan","M B Sreenivasan hits jukebox"], ["K. J. Joy","K J Joy hits jukebox"], ["Kannur Rajan","Kannur Rajan hits jukebox"], ["S. P. Venkatesh","S P Venkatesh hits jukebox"], ["M. G. Radhakrishnan","M G Radhakrishnan hits jukebox"], ["Sharath","Sharath hits jukebox"], ["Perumbavoor G. Raveendranath","Perumbavoor G Raveendranath hits jukebox"], ["Ilaiyaraaja (Malayalam)","Ilaiyaraaja (Malayalam) hits jukebox"]]],
  ["🏔️ Kannada",[["Hamsalekha","Hamsalekha hits jukebox"], ["V. Harikrishna","V Harikrishna hits jukebox"], ["Arjun Janya","Arjun Janya hits jukebox"], ["Anup Bhandari","Anup Bhandari hits jukebox"], ["Ravi Basrur","Ravi Basrur hits jukebox"], ["B. Ajaneesh Loknath","B Ajaneesh Loknath hits jukebox"], ["Gurukiran","Gurukiran hits jukebox"], ["Mano Murthy","Mano Murthy hits jukebox"], ["Sadhu Kokila","Sadhu Kokila hits jukebox"], ["Rajan-Nagendra","Rajan Nagendra hits jukebox"], ["G. K. Venkatesh","G K Venkatesh hits jukebox"], ["Upendra Kumar","Upendra Kumar hits jukebox"], ["Vijaya Bhaskar (Kannada)","Vijaya Bhaskar (Kannada) hits jukebox"], ["Rajesh Ramnath","Rajesh Ramnath hits jukebox"], ["Charan Raj","Charan Raj hits jukebox"], ["Judah Sandhy","Judah Sandhy hits jukebox"], ["Manikanth Kadri","Manikanth Kadri hits jukebox"], ["S. A. Rajkumar (Kannada)","S A Rajkumar (Kannada) hits jukebox"], ["V. Manohar","V Manohar hits jukebox"], ["Shankar-Ganesh (Kannada)","Shankar Ganesh (Kannada) hits jukebox"], ["Veer Samarth","Veer Samarth hits jukebox"], ["Anoop Seelin","Anoop Seelin hits jukebox"], ["Sridhar V Sambhram","Sridhar V Sambhram hits jukebox"], ["Dharma Vish","Dharma Vish hits jukebox"], ["Vasu Dixit","Vasu Dixit hits jukebox"], ["Poornachandra Tejaswi","Poornachandra Tejaswi hits jukebox"], ["L. Vaidyanathan","L Vaidyanathan hits jukebox"], ["T. G. Lingappa","T G Lingappa hits jukebox"], ["Ilaiyaraaja (Kannada)","Ilaiyaraaja (Kannada) hits jukebox"], ["Joshua Sridhar (Kannada)","Joshua Sridhar (Kannada) hits jukebox"], ["Sandeep Chowta (Kannada)","Sandeep Chowta (Kannada) hits jukebox"]]],
  ["🌸 Marathi, Bengali, Punjabi and more",[["Ajay-Atul","Ajay Atul hits jukebox"], ["Sudhir Phadke","Sudhir Phadke hits jukebox"], ["Hridaynath Mangeshkar","Hridaynath Mangeshkar hits jukebox"], ["Anand Modak","Anand Modak hits jukebox"], ["Avadhoot Gupte","Avadhoot Gupte hits jukebox"], ["Amit Raj","Amit Raj hits jukebox"], ["Anupam Roy","Anupam Roy hits jukebox"], ["Salil Chowdhury","Salil Chowdhury hits jukebox"], ["Hemanta Mukherjee","Hemanta Mukherjee hits jukebox"], ["Debojyoti Mishra","Debojyoti Mishra hits jukebox"], ["Shantanu Moitra","Shantanu Moitra hits jukebox"], ["Bickram Ghosh","Bickram Ghosh hits jukebox"], ["Indraadip Dasgupta","Indraadip Dasgupta hits jukebox"], ["Jatinder Shah","Jatinder Shah hits jukebox"], ["Gurmeet Singh","Gurmeet Singh hits jukebox"], ["Desi Routz","Desi Routz hits jukebox"], ["Sachin Pilgaonkar","Sachin Pilgaonkar hits jukebox"], ["Bhupen Hazarika","Bhupen Hazarika hits jukebox"], ["Ashok Patki","Ashok Patki hits jukebox"], ["Ram Kadam","Ram Kadam hits jukebox"], ["Datta Davjekar","Datta Davjekar hits jukebox"], ["Kaushal Inamdar","Kaushal Inamdar hits jukebox"], ["Nilesh Moharir","Nilesh Moharir hits jukebox"], ["Rohan-Rohan","Rohan Rohan hits jukebox"], ["Pankaj Padghan","Pankaj Padghan hits jukebox"], ["Kazi Nazrul Islam (Nazrul Geeti)","Kazi Nazrul Islam (Nazrul Geeti) hits jukebox"], ["Rabindranath Tagore (Rabindra Sangeet)","Rabindranath Tagore (Rabindra Sangeet) hits jukebox"], ["Jaidev Kumar","Jaidev Kumar hits jukebox"], ["Kedar-Bhargav (Gujarati)","Kedar Bhargav (Gujarati) hits jukebox"], ["Parthiv Gohil (Gujarati)","Parthiv Gohil (Gujarati) hits jukebox"], ["Zubeen Garg (Assamese)","Zubeen Garg (Assamese) hits jukebox"], ["Papon (Assamese)","Papon (Assamese) hits jukebox"], ["Akshaya Mohanty (Odia)","Akshaya Mohanty (Odia) hits jukebox"]]],
  ["🪕 Classical and instrumental masters",[["Ravi Shankar","Ravi Shankar best jukebox"], ["Zakir Hussain","Zakir Hussain best jukebox"], ["Hariprasad Chaurasia","Hariprasad Chaurasia best jukebox"], ["Shiv Kumar Sharma","Shiv Kumar Sharma best jukebox"], ["L. Subramaniam","L Subramaniam best jukebox"], ["Ustad Bismillah Khan","Ustad Bismillah Khan best jukebox"], ["Ustad Amjad Ali Khan","Ustad Amjad Ali Khan best jukebox"], ["Kadri Gopalnath","Kadri Gopalnath best jukebox"], ["Balamuralikrishna","Balamuralikrishna best jukebox"], ["M. S. Subbulakshmi","M S Subbulakshmi best jukebox"], ["Bhimsen Joshi","Bhimsen Joshi best jukebox"], ["Lalgudi Jayaraman","Lalgudi Jayaraman best jukebox"], ["Ilaiyaraaja symphony","Ilaiyaraaja symphony best jukebox"], ["A. R. Rahman unplugged","A R Rahman unplugged best jukebox"], ["Pandit Jasraj","Pandit Jasraj best jukebox"], ["Kishori Amonkar","Kishori Amonkar best jukebox"], ["Ali Akbar Khan","Ali Akbar Khan best jukebox"], ["Vilayat Khan","Vilayat Khan best jukebox"], ["Nikhil Banerjee","Nikhil Banerjee best jukebox"], ["U. Srinivas (mandolin)","U Srinivas (mandolin) best jukebox"], ["T. N. Krishnan (violin)","T N Krishnan (violin) best jukebox"], ["Nedunuri Krishnamurthy","Nedunuri Krishnamurthy best jukebox"], ["Sudha Ragunathan","Sudha Ragunathan best jukebox"], ["Sanjay Subrahmanyan","Sanjay Subrahmanyan best jukebox"], ["T. M. Krishna","T M Krishna best jukebox"], ["Ranjani-Gayatri","Ranjani Gayatri best jukebox"], ["Anoushka Shankar","Anoushka Shankar best jukebox"], ["Vishwa Mohan Bhatt","Vishwa Mohan Bhatt best jukebox"], ["Rakesh Chaurasia","Rakesh Chaurasia best jukebox"], ["Niladri Kumar","Niladri Kumar best jukebox"], ["Bhajan Sopori (santoor)","Bhajan Sopori (santoor) best jukebox"]]],
  ["🎼 Singers",[["S. P. Balasubrahmanyam","S P Balasubrahmanyam hits jukebox"], ["S. Janaki","S Janaki hits jukebox"], ["P. Susheela","P Susheela hits jukebox"], ["K. S. Chithra","K S Chithra hits jukebox"], ["Sid Sriram","Sid Sriram hits jukebox"], ["Karthik","Karthik hits jukebox"], ["Haricharan","Haricharan hits jukebox"], ["Hariharan","Hariharan hits jukebox"], ["Mano","Mano hits jukebox"], ["Chinmayi","Chinmayi hits jukebox"], ["Shreya Ghoshal","Shreya Ghoshal hits jukebox"], ["Arijit Singh","Arijit Singh hits jukebox"], ["Sonu Nigam","Sonu Nigam hits jukebox"], ["Udit Narayan","Udit Narayan hits jukebox"], ["Alka Yagnik","Alka Yagnik hits jukebox"], ["Kumar Sanu","Kumar Sanu hits jukebox"], ["Asha Bhosle","Asha Bhosle hits jukebox"], ["Lata Mangeshkar","Lata Mangeshkar hits jukebox"], ["Kishore Kumar","Kishore Kumar hits jukebox"], ["Mohammed Rafi","Mohammed Rafi hits jukebox"], ["K. J. Yesudas","K J Yesudas hits jukebox"], ["Rahul Sipligunj","Rahul Sipligunj hits jukebox"], ["Anurag Kulkarni","Anurag Kulkarni hits jukebox"], ["Kaala Bhairava","Kaala Bhairava hits jukebox"], ["Ram Miriyala","Ram Miriyala hits jukebox"], ["Mangli","Mangli hits jukebox"], ["Geetha Madhuri","Geetha Madhuri hits jukebox"], ["Sunitha","Sunitha hits jukebox"], ["Usha","Usha hits jukebox"], ["L. R. Eswari","L R Eswari hits jukebox"], ["Vani Jairam","Vani Jairam hits jukebox"], ["P. B. Srinivas","P B Srinivas hits jukebox"], ["Jikki","Jikki hits jukebox"], ["Madhavapeddi Satyam","Madhavapeddi Satyam hits jukebox"], ["Ramya Behara","Ramya Behara hits jukebox"], ["Mukesh","Mukesh hits jukebox"], ["Talat Mahmood","Talat Mahmood hits jukebox"], ["Manna Dey","Manna Dey hits jukebox"], ["Geeta Dutt","Geeta Dutt hits jukebox"], ["Suman Kalyanpur","Suman Kalyanpur hits jukebox"], ["Jagjit Singh","Jagjit Singh hits jukebox"], ["Pankaj Udhas","Pankaj Udhas hits jukebox"], ["Mohit Chauhan","Mohit Chauhan hits jukebox"], ["KK","KK hits jukebox"], ["Shaan","Shaan hits jukebox"], ["Kunal Ganjawala","Kunal Ganjawala hits jukebox"], ["Neha Kakkar","Neha Kakkar hits jukebox"], ["Jubin Nautiyal","Jubin Nautiyal hits jukebox"], ["Atif Aslam","Atif Aslam hits jukebox"], ["Rahat Fateh Ali Khan","Rahat Fateh Ali Khan hits jukebox"], ["Nusrat Fateh Ali Khan","Nusrat Fateh Ali Khan hits jukebox"], ["T. M. Soundararajan","T M Soundararajan hits jukebox"], ["Unnikrishnan","Unnikrishnan hits jukebox"], ["Swarnalatha","Swarnalatha hits jukebox"], ["Shankar Mahadevan","Shankar Mahadevan hits jukebox"], ["Vijay Yesudas","Vijay Yesudas hits jukebox"], ["Benny Dayal","Benny Dayal hits jukebox"], ["Dhee","Dhee hits jukebox"], ["Andrea Jeremiah","Andrea Jeremiah hits jukebox"], ["Hemachandra","Hemachandra hits jukebox"], ["Sri Krishna","Sri Krishna hits jukebox"], ["Revanth","Revanth hits jukebox"], ["Deepu","Deepu hits jukebox"], ["Gopika Poornima","Gopika Poornima hits jukebox"], ["Malavika","Malavika hits jukebox"], ["Smitha","Smitha hits jukebox"], ["Kousalya","Kousalya hits jukebox"], ["Ranina Reddy","Ranina Reddy hits jukebox"], ["M. M. Manasi","M M Manasi hits jukebox"], ["Sahithi Chaganti","Sahithi Chaganti hits jukebox"], ["Simha","Simha hits jukebox"], ["Armaan Malik","Armaan Malik hits jukebox"], ["Vijay Prakash","Vijay Prakash hits jukebox"], ["P. Leela","P Leela hits jukebox"], ["A. M. Rajah","A M Rajah hits jukebox"], ["S. Varalakshmi","S Varalakshmi hits jukebox"], ["Raghu Dixit","Raghu Dixit hits jukebox"], ["Jonita Gandhi","Jonita Gandhi hits jukebox"], ["Dhvani Bhanushali","Dhvani Bhanushali hits jukebox"], ["Tulsi Kumar","Tulsi Kumar hits jukebox"], ["Palak Muchhal","Palak Muchhal hits jukebox"], ["Monali Thakur","Monali Thakur hits jukebox"], ["Sunidhi Chauhan","Sunidhi Chauhan hits jukebox"], ["Mika Singh","Mika Singh hits jukebox"], ["Sukhwinder Singh","Sukhwinder Singh hits jukebox"], ["Diljit Dosanjh","Diljit Dosanjh hits jukebox"], ["Guru Randhawa","Guru Randhawa hits jukebox"], ["Darshan Raval","Darshan Raval hits jukebox"], ["Stebin Ben","Stebin Ben hits jukebox"], ["Kailash Kher","Kailash Kher hits jukebox"], ["Javed Ali","Javed Ali hits jukebox"], ["Roop Kumar Rathod","Roop Kumar Rathod hits jukebox"], ["Abhijeet","Abhijeet hits jukebox"], ["Kavita Krishnamurthy","Kavita Krishnamurthy hits jukebox"], ["Sadhana Sargam","Sadhana Sargam hits jukebox"], ["Anuradha Paudwal","Anuradha Paudwal hits jukebox"], ["Hemlata","Hemlata hits jukebox"], ["Mahendra Kapoor","Mahendra Kapoor hits jukebox"], ["Chitra Singh","Chitra Singh hits jukebox"], ["Ghulam Ali","Ghulam Ali hits jukebox"], ["Mehdi Hassan","Mehdi Hassan hits jukebox"], ["Noor Jehan","Noor Jehan hits jukebox"], ["Sathyaprakash","Sathyaprakash hits jukebox"], ["Ranjith","Ranjith hits jukebox"], ["Dhanush","Dhanush hits jukebox"], ["Silambarasan","Silambarasan hits jukebox"], ["T. L. Maharajan","T L Maharajan hits jukebox"], ["Sirkazhi Govindarajan","Sirkazhi Govindarajan hits jukebox"], ["P. Jayachandran","P Jayachandran hits jukebox"], ["Malaysia Vasudevan","Malaysia Vasudevan hits jukebox"], ["Uma Ramanan","Uma Ramanan hits jukebox"], ["S. N. Surendar","S N Surendar hits jukebox"], ["M. G. Sreekumar","M G Sreekumar hits jukebox"], ["Sujatha Mohan","Sujatha Mohan hits jukebox"], ["Vineeth Sreenivasan","Vineeth Sreenivasan hits jukebox"], ["Najim Arshad","Najim Arshad hits jukebox"], ["Dr. Rajkumar","Dr Rajkumar hits jukebox"], ["Puneeth Rajkumar","Puneeth Rajkumar hits jukebox"]]],
  ["🌍 World film music",[["Hans Zimmer","Hans Zimmer best of jukebox"], ["John Williams","John Williams best of jukebox"], ["Joe Hisaishi","Joe Hisaishi best of jukebox"], ["Ennio Morricone","Ennio Morricone best of jukebox"], ["Ludwig Goransson","Ludwig Goransson best of jukebox"], ["Ludovico Einaudi","Ludovico Einaudi best of jukebox"], ["Yiruma","Yiruma best of jukebox"], ["Danny Elfman","Danny Elfman best of jukebox"], ["James Horner","James Horner best of jukebox"], ["Howard Shore","Howard Shore best of jukebox"], ["Alan Silvestri","Alan Silvestri best of jukebox"], ["Max Richter","Max Richter best of jukebox"], ["Yann Tiersen","Yann Tiersen best of jukebox"], ["Ramin Djawadi","Ramin Djawadi best of jukebox"], ["Alexandre Desplat","Alexandre Desplat best of jukebox"], ["Michael Giacchino","Michael Giacchino best of jukebox"], ["Thomas Newman","Thomas Newman best of jukebox"], ["Vangelis","Vangelis best of jukebox"], ["Lorne Balfe","Lorne Balfe best of jukebox"], ["Harry Gregson-Williams","Harry Gregson Williams best of jukebox"], ["Jerry Goldsmith","Jerry Goldsmith best of jukebox"], ["Bear McCreary","Bear McCreary best of jukebox"], ["Nobuo Uematsu","Nobuo Uematsu best of jukebox"], ["Koji Kondo","Koji Kondo best of jukebox"], ["Yoko Kanno","Yoko Kanno best of jukebox"], ["Ryuichi Sakamoto","Ryuichi Sakamoto best of jukebox"], ["Maurice Jarre","Maurice Jarre best of jukebox"], ["Nino Rota","Nino Rota best of jukebox"], ["Bernard Herrmann","Bernard Herrmann best of jukebox"], ["Gustavo Santaolalla","Gustavo Santaolalla best of jukebox"], ["Tan Dun","Tan Dun best of jukebox"], ["Rachel Portman","Rachel Portman best of jukebox"], ["Dario Marianelli","Dario Marianelli best of jukebox"], ["Abel Korzeniowski","Abel Korzeniowski best of jukebox"], ["Johann Johannsson","Johann Johannsson best of jukebox"], ["Hildur Gudnadottir","Hildur Gudnadottir best of jukebox"], ["Trent Reznor and Atticus Ross","Trent Reznor and Atticus Ross best of jukebox"]]],
];
// Newest-first YouTube searches (sorted by upload date, limited to this week or this month).
const ytNew = (q, span) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q) + "&sp=" + (span === "week" ? "CAISBAgDEAE%3D" : "CAISBAgEEAE%3D");
const FUN_NEW = [
  ["Telugu", "new telugu songs"], ["Telugu movie lyrical videos", "telugu movie lyrical video song"], ["Tamil", "new tamil songs"], ["Hindi", "new hindi songs"],
  ["Malayalam", "new malayalam songs"], ["Kannada", "new kannada songs"], ["Punjabi", "new punjabi songs"], ["Bengali", "new bengali songs"],
  ["Marathi", "new marathi songs"], ["Bhojpuri", "new bhojpuri songs"], ["English hits", "new english songs"], ["K-pop", "new k-pop songs"],
  ["Telugu trailers and teasers", "telugu movie trailer"], ["Telugu independent songs", "telugu independent song"],
];
// Only searches filtered to Creative Commons / public-domain music. Always check the license shown on the track.
const FUN_LANGS = ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu",
  "Sanskrit", "English", "Spanish", "French", "German", "Japanese", "Korean", "Arabic", "Chinese", "Russian"];
const ytCC = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q) + "&sp=EgIwAQ%3D%3D";
const jamendo = (q) => "https://www.jamendo.com/search?q=" + encodeURIComponent(q);
const commonsAudio = (q) => "https://commons.wikimedia.org/w/index.php?search=" + encodeURIComponent(q + " filetype:audio") + "&ns6=1";
const archiveAudio = (q) => "https://archive.org/search?query=" + encodeURIComponent(q) + "&and%5B%5D=mediatype%3A%22audio%22";
const FUN_LIBS = [
  ["🎵 Jamendo (free CC music)", "https://www.jamendo.com"],
  ["🎶 Free Music Archive", "https://freemusicarchive.org"],
  ["🎼 Musopen (public-domain classical)", "https://musopen.org"],
  ["🎛️ ccMixter (CC remixes)", "https://dig.ccmixter.org"],
  ["🎹 Incompetech (CC music)", "https://incompetech.com/music/royalty-free/"],
  ["🔊 Pixabay Music (royalty-free)", "https://pixabay.com/music/"],
  ["📼 Internet Archive audio", "https://archive.org/details/audio"],
  ["🌍 Wikimedia Commons audio", "https://commons.wikimedia.org/wiki/Category:Audio_files"],
  ["📻 Radio Garden (live radio)", "https://radio.garden"],
];

function miniPiano() {
  const NOTES = [["C", 261.63], ["D", 293.66], ["E", 329.63], ["F", 349.23], ["G", 392.0], ["A", 440.0], ["B", 493.88], ["C", 523.25]];
  let ctx = null;
  const play = (f) => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.65);
    } catch (_) {}
  };
  return el("div", { class: "learn-card" },
    el("strong", {}, "🎹 Mini piano"),
    el("p", { class: "hint" }, "Tap the keys to play. Try Ode to Joy: E E F G, G F E D, C C D E, E D D."),
    el("div", { class: "fun-keys" }, NOTES.map(([n, f], i) => el("button", { type: "button", class: "fun-key", "aria-label": "Note " + n, onclick: () => play(f) }, n + (i === 7 ? "²" : "")))));
}


// Original music generated in the browser with Web Audio. Nothing is copied from any song, so it is copyright-free.
function chillPlayer() {
  const MODES = {
    lofi:  { name: "🌙 Lofi chill",   bpm: 74, chords: [[220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 349.23], [164.81, 207.65, 246.94, 311.13]], drums: true },
    calm:  { name: "🌿 Calm ambient", bpm: 54, chords: [[196.0, 293.66, 392.0], [174.61, 261.63, 349.23], [220.0, 329.63, 440.0], [196.0, 246.94, 392.0]], drums: false },
    focus: { name: "🎯 Focus pulse",  bpm: 96, chords: [[261.63, 329.63, 392.0], [293.66, 349.23, 440.0], [246.94, 311.13, 392.0], [261.63, 329.63, 392.0]], drums: true },
  };
  let ctx = null, master = null, timer = null, step = 0, mode = "lofi", vol = 0.5, playing = false;
  const status = el("p", { class: "hint" }, "Press play. Music is created live in your phone, so it is always free to use.");
  const tone = (f, t, dur, type, gain, lp) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = lp;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  };
  const kick = (t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.22); };
  const hat = (t) => { const len = ctx.sampleRate * 0.05, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = buf; hp.type = "highpass"; hp.frequency.value = 7000; g.gain.value = 0.12;
    src.connect(hp); hp.connect(g); g.connect(master); src.start(t); };
  const tick = () => {
    if (state.mode !== "fun" || !document.getElementById("funMusicRoot")) { stop(); return; }
    const m = MODES[mode], beat = 60 / m.bpm / 2, t = ctx.currentTime + 0.05, bar = Math.floor(step / 8) % m.chords.length, chord = m.chords[bar], pos = step % 8;
    if (pos === 0) chord.forEach((f, i) => tone(f / 2, t, beat * 8, "triangle", 0.10, 900 + i * 150));
    if (pos % 2 === 0) tone(chord[(pos / 2) % chord.length] * 2, t, beat * 1.6, "sine", 0.10, 3000);
    if (m.drums) { if (pos === 0 || pos === 4) kick(t); if (pos % 2 === 1) hat(t); }
    step++;
  };
  function stop() { if (timer) { clearInterval(timer); timer = null; } playing = false; if (ctx && ctx.state === "running") ctx.suspend().catch(() => {}); btn.textContent = "▶ Play"; }
  const start = () => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (!master) { master = ctx.createGain(); master.connect(ctx.destination); }
      master.gain.value = vol; ctx.resume();
      step = 0; playing = true; btn.textContent = "⏸ Pause";
      clearInterval(timer); timer = setInterval(tick, (60 / MODES[mode].bpm / 2) * 1000);
      tick();
    } catch (_) { status.textContent = "Your browser could not start audio."; }
  };
  const btn = el("button", { class: "btn primary", type: "button", onclick: () => (playing ? stop() : start()) }, "▶ Play");
  const modes = el("div", { class: "rowbtns" });
  const drawModes = () => modes.replaceChildren(...Object.entries(MODES).map(([k, m]) => el("button", { class: "btn sm" + (mode === k ? " primary" : ""), type: "button", onclick: () => { mode = k; drawModes(); if (playing) start(); } }, m.name)));
  drawModes();
  const slider = el("input", { type: "range", min: "0", max: "100", value: "50", "aria-label": "Volume", oninput: (e) => { vol = e.target.value / 100; if (master) master.gain.value = vol; } });
  return el("div", { class: "learn-card", id: "funMusicRoot" }, el("strong", {}, "🎧 Original chill music (copyright-free)"), modes, el("div", { class: "rowbtns" }, btn, el("label", { class: "fun-vol" }, "🔈", slider)), status);
}

function jukeFinder() {
  const filter = el("input", { type: "search", class: "juke-filter", placeholder: "Filter the list: type a name…", "aria-label": "Filter music directors and singers",
    oninput: (e) => {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll("#funMusicBody .fun-det").forEach(d => {
        let hits = 0;
        d.querySelectorAll("a").forEach(a => { const show = !q || a.textContent.toLowerCase().includes(q); a.hidden = !show; if (show) hits++; });
        d.hidden = !!q && hits === 0; if (q && hits) d.open = true;
      });
    } });
  const any = el("input", { type: "text", class: "juke-any", maxlength: "60", placeholder: "Any music director or singer…", "aria-label": "Search any music director or singer",
    onkeydown: (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } } });
  const go = () => { const q = any.value.trim(); if (q.length < 2) return; window.open(yt(q + " jukebox"), "_blank", "noopener,noreferrer"); };
  const goNew = () => { const q = any.value.trim(); if (q.length < 2) return; window.open(ytNew(q + " new songs " + new Date().getFullYear(), "month"), "_blank", "noopener,noreferrer"); };
  return el("div", { class: "learn-card" },
    el("strong", {}, "🔎 Find a jukebox"),
    filter,
    el("div", { class: "rowbtns" }, any, el("button", { class: "btn sm primary", type: "button", onclick: go }, "Jukebox ▶"), el("button", { class: "btn sm", type: "button", onclick: goNew }, "🆕 Latest songs ▶")));
}

// Movie information. Nothing here is stored copy: every link opens a page that is updated by its owner,
// so the lists always show the current year's releases.
const FUN_MOVIE_LANGS = [
  ["Telugu", "Telugu"], ["Tamil", "Tamil"], ["Hindi", "Hindi"], ["Malayalam", "Malayalam"], ["Kannada", "Kannada"],
  ["Bengali", "Bengali"], ["Marathi", "Marathi"], ["Punjabi", "Punjabi"], ["Gujarati", "Gujarati"], ["Bhojpuri", "Bhojpuri"], ["Odia", "Odia"],
  ["English (Hollywood)", "American"], ["British", "British"], ["Korean", "South Korean"], ["Japanese", "Japanese"], ["Chinese", "Chinese"],
  ["French", "French"], ["Spanish", "Spanish"], ["German", "German"], ["Indonesian", "Indonesian"],
];
const wikiGo = (title) => "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(title) + "&go=Go";
const FUN_MOVIE_HUBS = [
  ["📅 IMDb release calendar (India)", "https://www.imdb.com/calendar/?region=IN&type=MOVIE"],
  ["🔥 IMDb most popular movies", "https://www.imdb.com/chart/moviemeter/"],
  ["📺 New on OTT in India (JustWatch)", "https://www.justwatch.com/in/new"],
  ["🎟️ Now playing and upcoming (TMDB)", "https://www.themoviedb.org/movie/now-playing"],
  ["🗓️ Upcoming movies (TMDB)", "https://www.themoviedb.org/movie/upcoming"],
  ["⭐ Popular this week (Letterboxd)", "https://letterboxd.com/films/popular/this/week/"],
  ["🍅 In theatres (Rotten Tomatoes)", "https://www.rottentomatoes.com/browse/movies_in_theaters/"],
  ["💰 Box office (Sacnilk)", "https://www.sacnilk.com"],
  ["📈 Box Office India", "https://www.boxofficeindia.com"],
  ["🏆 Highest-grossing Indian films", "https://en.wikipedia.org/wiki/List_of_highest-grossing_Indian_films"],
  ["🏆 Highest-grossing Telugu films", "https://en.wikipedia.org/wiki/List_of_highest-grossing_Telugu_films"],
  ["🎖️ National Film Awards", "https://en.wikipedia.org/wiki/National_Film_Awards"],
  ["🎞️ Free public-domain films (Internet Archive)", "https://archive.org/details/movies"],
];
const watchLoad = () => { try { return JSON.parse(localStorage.getItem("dd-watchlist") || "[]"); } catch (_) { return []; } };
const watchSave = (a) => { try { localStorage.setItem("dd-watchlist", JSON.stringify(a.slice(0, 200))); } catch (_) {} };
function moviesView() {
  const yr = new Date().getFullYear();
  const watch = el("div", { class: "learn-card" });
  const pick = el("p", { class: "fun-ans" });
  const inp = el("input", { type: "text", maxlength: "80", placeholder: "Add a movie or series to watch…", "aria-label": "Movie name", autocomplete: "off" });
  const drawWatch = () => {
    const list = watchLoad();
    watch.replaceChildren(el("strong", {}, "📝 My watchlist (" + list.filter(x => !x.done).length + " to watch)"),
      el("div", { class: "rowbtns" }, inp, el("button", { class: "btn sm primary", type: "button", onclick: () => { const v = cleanText(inp.value).trim(); if (v.length < 2) return; const a = watchLoad(); a.unshift({ id: Date.now() + "", name: v.slice(0, 80), done: false }); watchSave(a); inp.value = ""; drawWatch(); } }, "Add")),
      ...list.map(m => el("div", { class: "fun-lang" },
        el("button", { type: "button", class: "btn sm" + (m.done ? "" : " primary"), onclick: () => { const a = watchLoad(); const x = a.find(y => y.id === m.id); if (x) x.done = !x.done; watchSave(a); drawWatch(); } }, m.done ? "✅ Watched" : "▶ To watch"),
        el("span", { style: m.done ? "text-decoration:line-through;opacity:.6" : "" }, m.name),
        el("button", { type: "button", class: "linkbtn danger", "aria-label": "Remove", onclick: () => { watchSave(watchLoad().filter(y => y.id !== m.id)); drawWatch(); } }, "✕"))),
      el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => { const a = watchLoad().filter(x => !x.done); pick.textContent = a.length ? "🎲 Tonight: " + a[Math.floor(Math.random() * a.length)].name : "Add something to your watchlist first."; } }, "🎲 Pick one for me")), pick);
  };
  drawWatch();
  return el("div", {},
    el("p", { class: "hint" }, "Latest release information for every language. These links open live pages that their owners update, so they always show the current year (" + yr + ") and this week's releases."),
    el("div", { class: "label" }, "🌟 Live movie hubs"),
    el("div", { class: "rowbtns" }, FUN_MOVIE_HUBS.map(([label, url]) => outLink(url, label, "linkbtn"))),
    el("div", { class: "label" }, "🎬 Latest releases by language"),
    el("div", { class: "fun-langs" }, FUN_MOVIE_LANGS.map(([label, adj]) => el("div", { class: "fun-lang" }, el("strong", {}, label),
      outLink(wikiGo("List of " + adj + " films of " + yr), "📋 " + yr + " list", "linkbtn"),
      outLink(ytNew(label + " movie official trailer " + yr, "month"), "🎞️ Trailers", "linkbtn"),
      outLink("https://www.google.com/search?q=" + encodeURIComponent("new " + label + " movies releasing this week OTT and theatres"), "🗓️ This week", "linkbtn"),
      outLink("https://www.google.com/search?q=" + encodeURIComponent(label + " movie reviews and ratings " + yr), "⭐ Reviews", "linkbtn")))),
    watch,
    el("p", { class: "hint" }, "Watch movies only in theatres or on official OTT apps. Piracy sites are illegal and often carry viruses and scams. Spark does not host any movie."));
}

function memoryGame() {
  const EMOJI = ["🚀", "🧠", "💡", "🎯", "📚", "⚡", "🔬", "🎓"];
  let cards = [], open = [], matched = 0, moves = 0, lock = false;
  const grid = el("div", { class: "fun-mem" });
  const info = el("p", { class: "hint" });
  const draw = () => {
    grid.replaceChildren(...cards.map(c => el("button", { type: "button", class: "fun-card" + (c.up || c.done ? " up" : "") + (c.done ? " done" : ""),
      "aria-label": c.up || c.done ? c.e : "Hidden card", onclick: () => flip(c) }, c.up || c.done ? c.e : "❔")));
    const best = funBest("memory");
    info.textContent = matched === 8 ? "🎉 You won in " + moves + " moves!" + (best ? " Best: " + best : "") : "Moves: " + moves + (best ? " · Best: " + best : "");
  };
  const flip = (c) => {
    if (lock || c.up || c.done) return;
    c.up = true; open.push(c);
    if (open.length === 2) {
      moves++;
      if (open[0].e === open[1].e) { open.forEach(x => { x.done = true; x.up = false; }); matched++; open = []; if (matched === 8) { const b = funBest("memory"); if (!b || moves < b) funBest("memory", moves); } }
      else { lock = true; setTimeout(() => { open.forEach(x => { x.up = false; }); open = []; lock = false; draw(); }, 700); }
    }
    draw();
  };
  const start = () => { cards = funShuffle([...EMOJI, ...EMOJI]).map(e => ({ e, up: false, done: false })); open = []; matched = 0; moves = 0; lock = false; draw(); };
  start();
  return el("div", {}, el("p", { class: "hint" }, "Find all 8 matching pairs in as few moves as you can."), grid, info,
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: start }, "🔄 New game")));
}

function typingTest() {
  let target = "", started = 0, finished = false;
  const text = el("p", { class: "fun-type-text", "aria-live": "off" });
  const result = el("p", { class: "hint" });
  const input = el("input", { type: "text", class: "fun-type-input", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Start typing here…", "aria-label": "Type the sentence" });
  const paint = (typed) => {
    text.replaceChildren(...[...target].map((ch, i) => el("span", { class: i < typed.length ? (typed[i] === ch ? "ok" : "bad") : "" }, ch)));
  };
  const next = () => {
    target = FUN_SENTENCES[Math.floor(Math.random() * FUN_SENTENCES.length)];
    started = 0; finished = false; input.value = ""; input.disabled = false; paint("");
    const b = funBest("wpm"); result.textContent = b ? "Best speed: " + b + " WPM" : "Type the sentence exactly. The clock starts when you press the first key.";
  };
  input.addEventListener("paste", (e) => e.preventDefault());
  input.addEventListener("input", () => {
    if (finished) return;
    if (!started) started = Date.now();
    paint(input.value);
    if (input.value === target) {
      finished = true; input.disabled = true;
      const mins = (Date.now() - started) / 60000, wpm = Math.min(250, Math.round((target.length / 5) / Math.max(mins, 1 / 600)));
      const b = funBest("wpm"); if (!b || wpm > b) funBest("wpm", wpm);
      result.textContent = "🎉 " + wpm + " WPM" + (!b || wpm > b ? " (new best!)" : " (best " + b + ")");
    }
  });
  next();
  return el("div", {}, text, input, result, el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => { next(); input.focus(); } }, "🔄 New sentence")));
}

function renderFun() {
  const tabs = [["player", "🎧 Player"], ["music", "🎵 Songs"], ["movies", "🎬 Movies"], ["mem", "🎮 Memory"], ["type", "⌨️ Typing"], ["riddle", "🧩 Riddles"], ["fact", "💡 Fun facts"], ["free", "🌐 Free fun"]];
  let view = window.__funStart || "player", riddles = funShuffle(FUN_RIDDLES), ri = 0, showAns = false, fi = Math.floor(Math.random() * FUN_FACTS.length);
  const body = el("div", { class: "fun-body", id: "funMusicBody" });
  const bar = el("div", { class: "rowbtns" });
  const draw = () => {
    bar.replaceChildren(...tabs.map(([id, label]) => el("button", { class: "btn sm" + (view === id ? " primary" : ""), type: "button", onclick: () => { view = id; draw(); } }, label)));
    window.__funStart = null;
    if (view === "player") body.replaceChildren(window.SparkPlayer ? window.SparkPlayer.mount() : el("p", { class: "hint" }, "The music player could not load. Reload the page and try again."));
    else if (view === "movies") body.replaceChildren(moviesView());
    else if (view === "music") {
      body.replaceChildren(
        chillPlayer(),
        el("div", { class: "label" }, "🎬 Music director and singer jukeboxes"),
        el("p", { class: "hint" }, "Tap a name to open official jukeboxes on YouTube. These are copyrighted songs streamed by the rights holders, so Spark only links to them. Listen on YouTube with low volume and earphones."),
        el("details", { class: "fun-det", open: true },
          el("summary", {}, "🆕 Latest released songs (" + FUN_NEW.length + ")"),
          el("p", { class: "hint" }, "Newest uploads first, from official channels. Pick this week or this month."),
          ...FUN_NEW.map(([label, q]) => el("div", { class: "fun-lang" }, el("strong", {}, label),
            outLink(ytNew(q + " " + new Date().getFullYear(), "week"), "🔥 This week", "linkbtn"),
            outLink(ytNew(q + " " + new Date().getFullYear(), "month"), "📅 This month", "linkbtn")))),
        jukeFinder(),
        ...FUN_JUKE.map(([title, items], gi) => el("details", { class: "fun-det", open: gi === 0 },
          el("summary", {}, title + " (" + items.length + ")"),
          el("div", { class: "rowbtns" }, items.map(([label, q]) => outLink(yt(q), label, "linkbtn"))))),
        el("div", { class: "label" }, "🌐 Free songs by language"),
        el("p", { class: "hint" }, "Each language opens only Creative Commons or public-domain music. Check the license shown on every track, and credit the artist when the license asks for it."),
        el("div", { class: "fun-langs" }, FUN_LANGS.map(l => el("div", { class: "fun-lang" },
          el("strong", {}, l),
          outLink(ytCC(l + " song"), "YouTube CC", "linkbtn"), outLink(jamendo(l), "Jamendo", "linkbtn"),
          outLink(commonsAudio(l + " song"), "Wikimedia", "linkbtn"), outLink(archiveAudio(l + " songs"), "Archive", "linkbtn")))),
        el("div", { class: "label" }, "📚 Free music libraries"),
        el("div", { class: "rowbtns" }, FUN_LIBS.map(([label, url]) => outLink(url, label, "linkbtn"))),
        miniPiano(),
        el("p", { class: "hint" }, "Tip: keep the volume low, use earphones in the hostel, and respect quiet hours."));
    } else if (view === "mem") body.replaceChildren(memoryGame());
    else if (view === "type") body.replaceChildren(typingTest());
    else if (view === "riddle") {
      const [q, a] = riddles[ri % riddles.length];
      body.replaceChildren(el("div", { class: "learn-card" }, el("strong", {}, "🧩 Riddle " + ((ri % riddles.length) + 1) + " of " + riddles.length),
        el("p", {}, q), showAns ? el("p", { class: "fun-ans" }, "✅ " + a) : null,
        el("div", { class: "rowbtns" },
          el("button", { class: "btn sm", type: "button", onclick: () => { showAns = !showAns; draw(); } }, showAns ? "Hide answer" : "Show answer"),
          el("button", { class: "btn sm primary", type: "button", onclick: () => { ri++; showAns = false; draw(); } }, "Next riddle ▶"))));
    } else if (view === "fact") {
      body.replaceChildren(el("div", { class: "learn-card" }, el("strong", {}, "💡 Did you know?"), el("p", {}, FUN_FACTS[fi % FUN_FACTS.length]),
        el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { fi = (fi + 1) % FUN_FACTS.length; draw(); } }, "Another fact ▶"))));
    } else {
      body.replaceChildren(
        el("p", { class: "hint" }, "Free and legal ways to relax, learn something fun and recharge. Nothing here costs money."),
        el("div", { class: "rowbtns" }, FUN_LINKS.map(([label, url]) => outLink(url, label, "linkbtn"))),
        el("div", { class: "learn-card" }, el("strong", {}, "👀 Quick break tip"), el("p", { class: "hint" }, "Every 20 minutes of screen time, look at something 20 feet away for 20 seconds. Drink water, stretch your neck and shoulders, and sleep 7 to 8 hours before exams.")));
    }
  };
  draw();
  return [
    el("h2", {}, "🎉 Entertainment"),
    el("p", { class: "hint" }, "Take a smart break. Play a quick game, solve a riddle or learn a fun fact, then get back to studying refreshed."),
    bar, body,
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}

// ---------- study lab (focus timer, flashcards, CGPA and attendance) ----------
function renderLab() {
  return [
    el("h2", {}, "🧪 Study Lab"),
    el("p", { class: "hint" }, "Power tools for students. Everything is saved only on this phone, and the focus timer keeps running while you use other parts of Spark."),
    window.SparkLab ? window.SparkLab.mount() : el("p", { class: "hint" }, "The Study Lab could not load. Reload the page and try again."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}

// ---------- about us ----------
function renderAbout() {
  const feature = (icon, title, text) => el("div", { class: "learn-card" }, el("strong", {}, icon + " " + title), el("p", { class: "hint" }, text));
  return [
    el("h2", {}, "ℹ️ About RGUKT Spark"),
    el("p", { class: "hint" }, "Designed for RGUKTians. One free place to ask doubts, share ideas, prepare for GATE, plan your career and help your juniors."),
    el("div", { class: "learn-card" },
      el("strong", {}, "🔥 Built by RGUKTians"),
      el("p", {}, "Spark is built by RGUKTians, for RGUKTians."),
      el("p", {}, "💙 Dedicated to our students: advanced, disciplined and obedient learners who work hard, respect their teachers and lift each other up. You are the reason Spark exists.")),
    el("div", { class: "label" }, "🎯 Our mission"),
    el("p", {}, "Every RGUKT student should have a senior to ask, a clear path after graduation, and quality study material, without paying for any of it. Spark brings these together so no doubt stays unanswered and no student feels lost after E4."),
    el("div", { class: "label" }, "✨ What you get"),
    feature("❓", "Doubts", "Ask by subject, year (E1-E4) and campus. Peers answer, you mark the best answer, and helpers earn points."),
    feature("💡", "Ideas, Clubs and Challenges", "Share project ideas, join clubs and take part in challenges and hackathons."),
    feature("🎯", "GATE", "Previous-year papers with solutions, MCQs, formulas and a year-wise preparation plan."),
    feature("🧠", "Daily Quiz and Top Helpers", "A new question every day, a leaderboard and recognition for the students who help most."),
    feature("📖", "Study Tools and Learn from IIT", "Unit-wise syllabus, formula cards, study plans and free IIT course links."),
    feature("🚀", "Career Guide", "Branch-wise options after graduation: jobs, M.Tech, PSU, study abroad and premium paths, all with free links."),
    feature("🤖", "Spark Bot", "Ask anything about academics, GATE, placements, campus life or the app and get instant answers with clickable resources."),
    feature("🛒", "Market", "Buy and sell textbooks, notes and equipment inside the RGUKT community."),
    el("div", { class: "label" }, "🔒 Privacy and safety"),
    el("p", {}, "No login and no password. Your device gets a random ID so your posts stay yours. You can post anonymously, report anything inappropriate and edit your own posts. We do not sell or share your data."),
    el("div", { class: "label" }, "💚 100% free"),
    el("p", {}, "No ads, no subscriptions. Every resource we link to is free to use."),
    el("div", { class: "label" }, "⚠️ Please note"),
    el("p", { class: "hint" }, "Spark is a student community platform. Always confirm official dates, fees, results and rules on the RGUKT websites before acting on them. Career and scholarship details can change, so check the official links."),
    el("div", { class: "label" }, "🔗 Official RGUKT campuses"),
    el("div", { class: "rowbtns" },
      outLink("https://www.rguktn.ac.in", "Nuzvid", "linkbtn"),
      outLink("https://www.rguktong.ac.in", "Ongole", "linkbtn"),
      outLink("https://www.rguktrkv.ac.in", "RK Valley", "linkbtn"),
      outLink("https://www.rguktsklm.ac.in", "Srikakulam", "linkbtn")),
    el("div", { class: "label" }, "🤝 Get involved"),
    el("p", { class: "hint" }, "Found a bug or have an idea? Post it in the Ideas tab or ask Spark Bot. You can also see the code and report issues on GitHub."),
    el("div", { class: "rowbtns" },
      outLink("https://github.com/vijay462462/rgukt-spark", "GitHub", "linkbtn"),
      outLink("https://github.com/vijay462462/rgukt-spark/issues", "Report an issue", "linkbtn")),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}

// ---------- career guide: what to do after graduation, by branch ----------
let careerBranch = null;
const GATE_URL = "https://gate2025.iisc.ac.in/";
const CAREER_COMMON = {
  higher: (gatePaper, extra = []) => ({ icon: "🎓", title: "Higher studies in India",
    note: "M.Tech / MS by research via GATE (" + gatePaper + "). IITs, NITs, IIITs and IISc admit through GATE scores. A GATE scholarship pays a monthly stipend.",
    links: [["GATE official", GATE_URL], ["COAP (IIT M.Tech)", "https://coap.iitb.ac.in"], ["CCMT (NIT/IIIT M.Tech)", "https://ccmt.admissions.nic.in"], ["GATE Overflow", "https://gateoverflow.in/"], ...extra] }),
  abroad: () => ({ icon: "🌍", title: "Study abroad (MS / PhD)",
    note: "Start in E3. Needs a strong CGPA, 2-3 projects or a research paper, recommendation letters and GRE/IELTS where required. Germany has no tuition at public universities.",
    links: [["EducationUSA (free advising)", "https://www.educationusa.in"], ["DAAD Germany", "https://www.daad.in"], ["Chevening UK scholarship", "https://www.chevening.org"], ["Study in Australia", "https://www.studyaustralia.gov.au"]] }),
  mba: () => ({ icon: "📈", title: "MBA / Management",
    note: "Good after 1-2 years of work experience. Entrance exams: CAT (IIMs), XAT, GMAT.",
    links: [["CAT official", "https://iimcat.ac.in"], ["IIM Bangalore", "https://www.iimb.ac.in"]] }),
  startup: () => ({ icon: "💡", title: "Startup, freelancing and entrepreneurship",
    note: "Build a product or offer freelance services while still in college. Government support and free mentoring is available.",
    links: [["Startup India", "https://www.startupindia.gov.in"], ["Skill India Digital", "https://www.skillindiadigital.gov.in"], ["Apprenticeship India", "https://apprenticeshipindia.gov.in"]] }),
};
const CAREER = {
  CSE: { tag: "Computer Science & Engineering", sections: [
    { icon: "💻", title: "Private sector jobs", note: "Software Developer, Full-stack / Backend / Frontend, Data Analyst, Data Scientist, ML Engineer, DevOps / Cloud Engineer, QA / Test Engineer, Cybersecurity Analyst, Product Manager.",
      links: [["TCS NextStep", "https://nextstep.tcs.com"], ["Infosys", "https://www.infosys.com/careers/"], ["Wipro", "https://careers.wipro.com"], ["Amazon", "https://www.amazon.jobs"], ["Zoho", "https://www.zoho.com/careers/"], ["National Career Service", "https://www.ncs.gov.in"]] },
    CAREER_COMMON.higher("CS paper", [["IIIT Hyderabad", "https://www.iiit.ac.in"]]),
    { icon: "🏛️", title: "Government and PSU", note: "PSUs hiring through GATE CS (ISRO, DRDO, BARC, NIC, BEL, ECIL), plus SSC, banking IT officer and state PSC technical posts.",
      links: [["ISRO", "https://www.isro.gov.in/Careers.html"], ["DRDO RAC", "https://rac.gov.in"], ["NIC", "https://www.nic.in"], ["BEL", "https://bel-india.in"], ["SSC", "https://ssc.gov.in"]] },
    CAREER_COMMON.abroad(), CAREER_COMMON.mba(), CAREER_COMMON.startup(),
    { icon: "🛠️", title: "Skills to build now (all free)", note: "DSA, one backend or web stack, SQL, Git, cloud basics, one ML or security specialisation, and 3+ real projects on GitHub.",
      links: [["roadmap.sh", "https://roadmap.sh"], ["CSES Problem Set", "https://cses.fi/problemset/"], ["freeCodeCamp", "https://www.freecodecamp.org"], ["CS50", "https://cs50.harvard.edu/x/"], ["Kaggle Learn", "https://www.kaggle.com/learn"], ["AWS Skill Builder", "https://skillbuilder.aws"]] },
  ]},
  "AI & ML": { tag: "Artificial Intelligence & Machine Learning", sections: [
    { icon: "🤖", title: "Private sector jobs", note: "Machine Learning Engineer, Data Scientist, Data Analyst, Generative AI / LLM Engineer, MLOps Engineer, Computer Vision Engineer, NLP Engineer, Data Engineer, AI Product Manager and AI consultant. Startups and global companies hire for these roles in every sector.",
      links: [["Google Careers", "https://www.google.com/about/careers/applications/"], ["Microsoft", "https://careers.microsoft.com"], ["Amazon", "https://www.amazon.jobs"], ["TCS NextStep", "https://nextstep.tcs.com"], ["Infosys", "https://www.infosys.com/careers/"], ["Zoho", "https://www.zoho.com/careers/"], ["National Career Service", "https://www.ncs.gov.in"]] },
    CAREER_COMMON.higher("DA paper (Data Science & AI) or CS paper", [["IISc Bangalore", "https://iisc.ac.in"], ["IIIT Hyderabad", "https://www.iiit.ac.in"]]),
    { icon: "🔬", title: "AI research and national AI missions", note: "Research roles in India's AI ecosystem: research assistant, PhD, or scientist positions. A strong GitHub, a paper or a thesis project helps a lot.",
      links: [["IndiaAI", "https://indiaai.gov.in"], ["AI4Bharat (IIT Madras)", "https://ai4bharat.iitm.ac.in"], ["Microsoft Research India", "https://www.microsoft.com/en-us/research/lab/microsoft-research-india/"], ["C-DAC", "https://www.cdac.in"], ["DRDO RAC", "https://rac.gov.in"], ["ISRO", "https://www.isro.gov.in/Careers.html"]] },
    { icon: "🏆", title: "Competitions and open source", note: "Kaggle medals, Hugging Face contributions and Google Summer of Code give visible proof of skill and often lead directly to interviews.",
      links: [["Kaggle Competitions", "https://www.kaggle.com/competitions"], ["Hugging Face", "https://huggingface.co"], ["Google Summer of Code", "https://summerofcode.withgoogle.com"], ["Smart India Hackathon", "https://www.sih.gov.in"], ["Codeforces", "https://codeforces.com"]] },
    CAREER_COMMON.abroad(), CAREER_COMMON.mba(), CAREER_COMMON.startup(),
    { icon: "🛠️", title: "Skills to build now (all free)", note: "Python, statistics and linear algebra, scikit-learn, deep learning with PyTorch, one specialisation (vision, NLP or LLMs), SQL, Git, deploying a model (API plus cloud), and 3+ end-to-end projects with a clear write-up.",
      links: [["Google ML Crash Course", "https://developers.google.com/machine-learning/crash-course"], ["Kaggle Learn", "https://www.kaggle.com/learn"], ["fast.ai", "https://www.fast.ai"], ["Hugging Face Learn", "https://huggingface.co/learn"], ["Stanford CS231n", "https://cs231n.stanford.edu"], ["Google Colab (free GPU)", "https://colab.research.google.com"], ["roadmap.sh AI", "https://roadmap.sh/ai-data-scientist"]] },
  ]},
  ECE: { tag: "Electronics & Communication Engineering", sections: [
    { icon: "📡", title: "Private sector jobs", note: "VLSI / Semiconductor design and verification, Embedded and IoT engineer, Telecom / 5G network engineer, Signal processing, Hardware / PCB design, plus software roles (ECE students are eligible for IT hiring too).",
      links: [["Jio", "https://careers.jio.com"], ["Airtel", "https://www.airtel.in/careers"], ["Siemens", "https://jobs.siemens.com"], ["Qualcomm", "https://www.qualcomm.com/company/careers"], ["Texas Instruments", "https://careers.ti.com"], ["National Career Service", "https://www.ncs.gov.in"]] },
    CAREER_COMMON.higher("EC paper", [["India Semiconductor Mission", "https://www.ism.gov.in"]]),
    { icon: "🏛️", title: "Government and PSU", note: "ISRO scientist/engineer, DRDO, BEL, BSNL, ECIL, HAL, Indian Navy / Air Force technical entries, Railways (RRB JE/ALP signalling), SSC JE, and ESE (UPSC Engineering Services).",
      links: [["ISRO", "https://www.isro.gov.in/Careers.html"], ["DRDO RAC", "https://rac.gov.in"], ["BEL", "https://bel-india.in"], ["UPSC ESE", "https://upsc.gov.in"], ["RRB", "https://indianrailways.gov.in"], ["SSC", "https://ssc.gov.in"]] },
    CAREER_COMMON.abroad(), CAREER_COMMON.mba(), CAREER_COMMON.startup(),
    { icon: "🛠️", title: "Skills to build now (all free)", note: "Digital design + Verilog, embedded C, microcontrollers (Arduino / STM32), MATLAB or Python for signals, PCB basics and a few hardware projects.",
      links: [["EDA Playground (Verilog)", "https://www.edaplayground.com"], ["NPTEL ECE", "https://nptel.ac.in"], ["Falstad Circuit Simulator", "https://www.falstad.com/circuit/"], ["All About Circuits", "https://www.allaboutcircuits.com"], ["IIT Virtual Labs", "https://www.vlab.co.in"]] },
  ]},
  EEE: { tag: "Electrical & Electronics Engineering", sections: [
    { icon: "⚡", title: "Private sector jobs", note: "Power systems engineer, Substation and transmission design, Renewable energy (solar / wind), EV and battery systems, Automation / PLC / SCADA, Electrical design consultant, plus software roles.",
      links: [["L&T", "https://www.larsentoubro.com/corporate/careers/"], ["Siemens", "https://jobs.siemens.com"], ["ABB", "https://careers.abb"], ["Tata Power", "https://www.tatapower.com/careers"], ["National Career Service", "https://www.ncs.gov.in"]] },
    CAREER_COMMON.higher("EE paper"),
    { icon: "🏛️", title: "Government and PSU", note: "NTPC, Power Grid, BHEL, NHPC, SJVN, state transcos and discoms, Railways (RRB JE electrical), SSC JE, and ESE (UPSC Engineering Services). Most PSUs recruit through GATE EE.",
      links: [["NTPC", "https://www.ntpc.co.in/careers"], ["Power Grid", "https://www.powergrid.in/en/careers"], ["BHEL", "https://www.bhel.com/careers"], ["NHPC", "https://www.nhpcindia.com"], ["UPSC ESE", "https://upsc.gov.in"], ["RRB", "https://indianrailways.gov.in"]] },
    { icon: "🔋", title: "Renewable energy and EV", note: "India is expanding solar, wind and EV manufacturing fast. Look at central agencies and national missions for jobs and training.",
      links: [["MNRE", "https://mnre.gov.in"], ["SECI", "https://www.seci.co.in"], ["Bureau of Energy Efficiency", "https://beeindia.gov.in"]] },
    CAREER_COMMON.abroad(), CAREER_COMMON.mba(), CAREER_COMMON.startup(),
    { icon: "🛠️", title: "Skills to build now (all free)", note: "MATLAB / Simulink, power system analysis software, PLC basics, AutoCAD Electrical, electrical codes and safety standards.",
      links: [["NPTEL Electrical", "https://nptel.ac.in"], ["Electrical4U", "https://www.electrical4u.com"], ["MIT OCW", "https://ocw.mit.edu"]] },
  ]},
  Civil: { tag: "Civil Engineering", sections: [
    { icon: "🏗️", title: "Private sector jobs", note: "Site / Project engineer, Structural design engineer, Quantity surveyor and estimator, Highway and transportation planner, Water and environmental engineer, Real estate and infrastructure companies.",
      links: [["L&T Construction", "https://www.larsentoubro.com/corporate/careers/"], ["Tata Projects", "https://www.tataprojects.com/careers"], ["National Career Service", "https://www.ncs.gov.in"]] },
    CAREER_COMMON.higher("CE paper"),
    { icon: "🏛️", title: "Government jobs (largest opportunity for Civil)", note: "State PWD, Irrigation, R&B and Panchayat Raj engineering posts, SSC JE, Railways RRB JE, NHAI, CPWD, MES, PSUs through GATE CE, and ESE (UPSC Engineering Services).",
      links: [["APPSC", "https://psc.ap.gov.in"], ["TSPSC", "https://www.tspsc.gov.in"], ["SSC JE", "https://ssc.gov.in"], ["RRB", "https://indianrailways.gov.in"], ["NHAI", "https://nhai.gov.in"], ["CPWD", "https://cpwd.gov.in"], ["UPSC ESE", "https://upsc.gov.in"]] },
    { icon: "🌆", title: "Urban planning, GIS and environment", note: "Specialise through M.Tech or M.Plan. GIS and remote sensing skills are in demand in smart-city, water and disaster-management projects.",
      links: [["QGIS (free GIS)", "https://qgis.org"], ["ISRO Bhuvan", "https://bhuvan.nrsc.gov.in"], ["Smart Cities Mission", "https://smartcities.gov.in"]] },
    CAREER_COMMON.abroad(), CAREER_COMMON.mba(), CAREER_COMMON.startup(),
    { icon: "🛠️", title: "Skills to build now (all free)", note: "AutoCAD, STAAD / ETABS basics, Revit / BIM, estimation and costing, IS codes, site practice during internships.",
      links: [["NPTEL Civil", "https://nptel.ac.in"], ["BIS (IS codes)", "https://www.bis.gov.in"], ["Engineering Toolbox", "https://www.engineeringtoolbox.com"]] },
  ]},
  Mech: { tag: "Mechanical Engineering", sections: [
    { icon: "⚙️", title: "Private sector jobs", note: "Design engineer (CAD/CAE), Manufacturing and production engineer, Automotive / EV engineer, HVAC and thermal engineer, Quality and maintenance engineer, Robotics and automation.",
      links: [["Tata Motors", "https://www.tatamotors.com/careers/"], ["Mahindra", "https://www.mahindra.com/careers"], ["L&T", "https://www.larsentoubro.com/corporate/careers/"], ["Siemens", "https://jobs.siemens.com"], ["National Career Service", "https://www.ncs.gov.in"]] },
    CAREER_COMMON.higher("ME paper"),
    { icon: "🏛️", title: "Government and PSU", note: "BHEL, NTPC, HAL, ONGC, IOCL, HPCL, BPCL, GAIL, SAIL, ISRO, DRDO, Railways (RRB JE, workshops), SSC JE, and ESE (UPSC Engineering Services). Most PSUs recruit through GATE ME.",
      links: [["BHEL", "https://www.bhel.com/careers"], ["HAL", "https://hal-india.co.in"], ["IOCL", "https://iocl.com/people-career"], ["ONGC", "https://ongcindia.com/web/eng/careers"], ["ISRO", "https://www.isro.gov.in/Careers.html"], ["UPSC ESE", "https://upsc.gov.in"]] },
    { icon: "🤖", title: "Robotics, EV and advanced manufacturing", note: "Mechatronics, 3D printing, drones and EV design are growing quickly. Build projects and enter student design competitions.",
      links: [["FreeCAD (free CAD)", "https://www.freecad.org"], ["NPTEL Mechanical", "https://nptel.ac.in"], ["SAE India", "https://www.saeindia.org"]] },
    CAREER_COMMON.abroad(), CAREER_COMMON.mba(), CAREER_COMMON.startup(),
    { icon: "🛠️", title: "Skills to build now (all free)", note: "SolidWorks / CATIA / FreeCAD, ANSYS basics, manufacturing processes, thermodynamics for GATE, Python for automation, one end-to-end project.",
      links: [["Engineering Toolbox", "https://www.engineeringtoolbox.com"], ["MIT OCW", "https://ocw.mit.edu"], ["NPTEL", "https://nptel.ac.in"]] },
  ]},
};
const CAREER_EXTRA = {
  CSE: [
    { icon: "🏆", title: "Open source and global competitions", note: "Earn stipends, international visibility and strong resume lines while still a student. Google Summer of Code pays stipends to students who contribute to open-source projects.",
      links: [["Google Summer of Code", "https://summerofcode.withgoogle.com"], ["Outreachy", "https://www.outreachy.org"], ["MLH Fellowship", "https://fellowship.mlh.io"], ["Codeforces", "https://codeforces.com"], ["CodeChef", "https://www.codechef.com"], ["Kaggle Competitions", "https://www.kaggle.com/competitions"]] },
    { icon: "🧠", title: "AI / research labs", note: "Research assistant roles and fellowships at top labs. A strong GitHub, a paper or a thesis project helps a lot.",
      links: [["IISc Bangalore", "https://iisc.ac.in"], ["IIIT Hyderabad Research", "https://www.iiit.ac.in/research/"], ["Microsoft Research India", "https://www.microsoft.com/en-us/research/lab/microsoft-research-india/"], ["arXiv", "https://arxiv.org"]] },
  ],
  "AI & ML": [
    { icon: "✨", title: "Generative AI and LLM careers", note: "Prompt engineering, fine-tuning, retrieval-augmented generation (RAG) and AI agents are among the fastest-growing skills. Build and publish a small LLM app to stand out.",
      links: [["Hugging Face Learn", "https://huggingface.co/learn"], ["Google AI for Developers", "https://ai.google.dev"], ["Anthropic Docs", "https://docs.anthropic.com"], ["LangChain Docs", "https://python.langchain.com"]] },
    { icon: "🏥", title: "AI for good: health, agriculture and governance", note: "India needs AI in healthcare, farming, education and public services. Join national hackathons and AI4Bharat-style open projects for impact and visibility.",
      links: [["IndiaAI", "https://indiaai.gov.in"], ["AI4Bharat", "https://ai4bharat.iitm.ac.in"], ["Smart India Hackathon", "https://www.sih.gov.in"], ["Startup India", "https://www.startupindia.gov.in"]] },
  ],
  ECE: [
    { icon: "🛰️", title: "Space, defence and semiconductor careers", note: "India is investing heavily in chip design, fabrication and space. These are high-value, long-term careers for ECE students.",
      links: [["ISRO", "https://www.isro.gov.in/Careers.html"], ["DRDO RAC", "https://rac.gov.in"], ["India Semiconductor Mission", "https://www.ism.gov.in"], ["SCL Mohali", "https://www.scl.gov.in"], ["HAL", "https://hal-india.co.in"]] },
    { icon: "📚", title: "IEEE and research exposure", note: "Join IEEE as a student member, attend conferences and publish a short paper. This opens doors to MS and PhD abroad.",
      links: [["IEEE", "https://www.ieee.org"], ["IEEE Xplore", "https://ieeexplore.ieee.org"], ["TIFR", "https://www.tifr.res.in"]] },
  ],
  EEE: [
    { icon: "🌱", title: "Energy transition and smart grid research", note: "Smart grids, battery storage, power electronics and hydrogen are the future of the sector. Good for M.Tech and PhD.",
      links: [["IEEE Power & Energy Society", "https://www.ieee-pes.org"], ["IEA (free reports)", "https://www.iea.org"], ["MNRE", "https://mnre.gov.in"]] },
    { icon: "🏭", title: "Gulf and global energy projects", note: "Power, oil and gas and infrastructure projects in the Gulf and Europe hire electrical engineers with experience. Build skills first, then apply to global employers.",
      links: [["EURES (EU jobs portal)", "https://eures.europa.eu"], ["National Career Service", "https://www.ncs.gov.in"]] },
  ],
  Civil: [
    { icon: "🌊", title: "Disaster management and sustainability", note: "Climate resilience, disaster management and green buildings are growing fields with national and UN-level opportunities.",
      links: [["NDMA", "https://ndma.gov.in"], ["UN Careers", "https://careers.un.org"], ["UN-Habitat", "https://unhabitat.org"], ["IGBC (green buildings)", "https://igbc.in"]] },
    { icon: "🚆", title: "Metro, rail and mega-infrastructure", note: "Metro rail corporations, DFCCIL, NHAI and port authorities hire civil engineers, often through GATE or direct recruitment.",
      links: [["DMRC", "https://www.delhimetrorail.com"], ["Indian Railways", "https://indianrailways.gov.in"], ["NHAI", "https://nhai.gov.in"]] },
  ],
  Mech: [
    { icon: "✈️", title: "Aerospace, marine and automotive", note: "Aircraft design and maintenance, ship engineering and EV or automotive R&D are premium career tracks for Mechanical students.",
      links: [["HAL", "https://hal-india.co.in"], ["DRDO RAC", "https://rac.gov.in"], ["DG Shipping (Marine)", "https://www.dgshipping.gov.in"], ["SAE India", "https://www.saeindia.org"]] },
    { icon: "🖨️", title: "Robotics, drones and additive manufacturing", note: "Build a drone, a robot or a 3D-printed product and enter national competitions. Great portfolio pieces for jobs and MS applications.",
      links: [["Smart India Hackathon", "https://www.sih.gov.in"], ["Atal Innovation Mission", "https://aim.gov.in"], ["FreeCAD", "https://www.freecad.org"]] },
  ],
};
const ABROAD = {
  tag: "Study and work abroad",
  intro: "A step-by-step view of MS, PhD and work options abroad. Fees, exams and rules change every year, so always confirm on the official websites linked below.",
  sections: [
    { icon: "🗓️", title: "Timeline (start in E2, apply in E4)", note: "E2: keep CGPA high, learn one skill deeply. E3 sem 1: pick 2-3 countries, prepare GRE / IELTS / TOEFL where needed, do 2-3 projects. E3 summer: research internship (Mitacs, DAAD WISE, IAS). E4 sem 1: SOP, 3 recommendation letters, apply (many deadlines fall between October and January). E4 sem 2: offers, scholarship, visa, education loan.",
      links: [["Vidya Lakshmi (govt education loan portal)", "https://www.vidyalakshmi.co.in"], ["EducationUSA", "https://www.educationusa.in"]] },
    { icon: "🇺🇸", title: "USA", note: "Largest choice of MS and PhD programmes. PhD and many research-based MS offers come with funding (RA / TA). Typical needs: strong CGPA, projects or research, SOP, recommendation letters, TOEFL / IELTS, and GRE for some universities.",
      links: [["EducationUSA", "https://www.educationusa.in"], ["Fulbright-Nehru (USIEF)", "https://www.usief.org.in"], ["MIT OpenCourseWare", "https://ocw.mit.edu"]] },
    { icon: "🇩🇪", title: "Germany", note: "Most public universities charge no tuition (only a small semester fee), and the technical universities are world class in engineering. Check language requirements per programme. A job-seeker visa and the Opportunity Card help after graduation.",
      links: [["DAAD India", "https://www.daad.in"], ["Study in Germany", "https://www.study-in-germany.de"], ["uni-assist", "https://www.uni-assist.de"], ["TU9 universities", "https://www.tu9.de"], ["Make it in Germany", "https://www.make-it-in-germany.com"]] },
    { icon: "🇨🇦", title: "Canada", note: "Strong in AI, software and engineering with post-study work options. Mitacs Globalink offers funded research internships for undergraduates.",
      links: [["EduCanada", "https://www.educanada.ca"], ["Mitacs Globalink", "https://www.mitacs.ca/en/programs/globalink"], ["Immigration Canada", "https://www.canada.ca/en/immigration-refugees-citizenship.html"]] },
    { icon: "🇬🇧", title: "United Kingdom", note: "One-year master's degrees and a graduate work route after study. Chevening and Commonwealth scholarships are fully funded for eligible candidates.",
      links: [["Study UK (British Council)", "https://study-uk.britishcouncil.org"], ["Chevening", "https://www.chevening.org"], ["Commonwealth Scholarships", "https://cscuk.fcdo.gov.uk"]] },
    { icon: "🇦🇺", title: "Australia", note: "Good for engineering, civil and mining-related fields, with skilled-migration pathways. Australia Awards offers scholarships for eligible applicants.",
      links: [["Study Australia", "https://www.studyaustralia.gov.au"], ["Australia Awards", "https://www.dfat.gov.au/people-to-people/australia-awards"], ["Skilled Migration", "https://immi.homeaffairs.gov.au"]] },
    { icon: "🇪🇺", title: "Europe (Netherlands, Ireland, Sweden, Switzerland and more)", note: "Erasmus Mundus joint master's degrees can be fully funded. ETH Zurich, TU Delft and Nordic universities are strong in engineering.",
      links: [["Erasmus+", "https://erasmus-plus.ec.europa.eu"], ["Study in the Netherlands", "https://www.studyinnl.org"], ["Study in Ireland", "https://www.studyinireland.ie"], ["Swedish Institute Scholarships", "https://si.se/en/apply/scholarships/"], ["ETH Zurich Scholarships", "https://ethz.ch/students/en/studies/financial/scholarships.html"]] },
    { icon: "🇸🇬", title: "Singapore", note: "NUS and NTU are top engineering universities with strong industry links and research scholarships.",
      links: [["NUS", "https://www.nus.edu.sg"], ["NTU", "https://www.ntu.edu.sg"]] },
    { icon: "🇯🇵", title: "Japan and 🇰🇷 South Korea", note: "Government scholarships (MEXT in Japan, GKS in Korea) cover tuition and a monthly allowance for eligible students. Excellent for robotics, electronics and manufacturing.",
      links: [["Study in Japan", "https://www.studyinjapan.go.jp/en/"], ["Study in Korea (GKS)", "https://www.studyinkorea.go.kr"]] },
    { icon: "💼", title: "Work abroad directly (without MS)", note: "Skilled-worker routes, global company transfers and remote work are possible after building 2+ years of strong experience and a good portfolio.",
      links: [["Make it in Germany", "https://www.make-it-in-germany.com"], ["EURES (EU jobs)", "https://eures.europa.eu"], ["Canada Immigration", "https://www.canada.ca/en/immigration-refugees-citizenship.html"], ["Australia Skilled Migration", "https://immi.homeaffairs.gov.au"]] },
    { icon: "🎁", title: "Scholarships and funding", note: "Apply early; many close 8-12 months before the course starts. Research assistantships and PhD stipends are the most common full funding for engineering students.",
      links: [["Fulbright-Nehru", "https://www.usief.org.in"], ["Chevening", "https://www.chevening.org"], ["Erasmus+", "https://erasmus-plus.ec.europa.eu"], ["DAAD", "https://www.daad.in"], ["Social Justice Dept (overseas scholarship)", "https://socialjustice.gov.in"]] },
    { icon: "📝", title: "Exams you may need (official sites)", note: "These tests are paid, so check whether your target university really requires them. Many universities no longer ask for GRE.",
      links: [["GRE", "https://www.ets.org/gre"], ["IELTS", "https://ielts.org"], ["TOEFL", "https://www.ets.org/toefl"]] },
  ],
};
const PREMIUM = {
  tag: "Extraordinary paths most students never hear about",
  intro: "High-impact options that stand out. Most of these are free to apply to, and several pay you a stipend or fund your research.",
  sections: [
    { icon: "🥇", title: "Prime Minister's Research Fellowship (PMRF)", note: "Direct PhD admission at IITs, IISc and IISERs with one of the highest research fellowships in India. For top students with strong CGPA or GATE scores.",
      links: [["PMRF official", "https://www.pmrf.in"], ["INSPIRE Fellowship", "https://online-inspire.gov.in"]] },
    { icon: "🔬", title: "Summer research fellowships", note: "Work with leading scientists for 2 months in E2 or E3. The best way to get strong recommendation letters for MS and PhD.",
      links: [["Indian Academies Summer Research Fellowship", "https://www.ias.ac.in"], ["DAAD WISE (Germany)", "https://www.daad.in"], ["Mitacs Globalink (Canada)", "https://www.mitacs.ca/en/programs/globalink"], ["CERN Summer Student Programme", "https://home.cern/summer-student-programme"]] },
    { icon: "🛰️", title: "ISRO, DRDO and national labs", note: "Scientist and engineer roles with ISRO, DRDO, BARC and CSIR labs. Recruitment is through GATE or the labs' own exams. Think long term.",
      links: [["ISRO Careers", "https://www.isro.gov.in/Careers.html"], ["DRDO RAC", "https://rac.gov.in"], ["BARC", "https://barc.gov.in"], ["CSIR", "https://www.csir.res.in"]] },
    { icon: "🎖️", title: "Join the armed forces as an officer", note: "Engineers can join the Army, Navy and Air Force as technical officers (AFCAT Technical, SSC Tech, University Entry Scheme). Excellent pay, status and training.",
      links: [["Join Indian Army", "https://joinindianarmy.nic.in"], ["Join Indian Navy", "https://www.joinindiannavy.gov.in"], ["AFCAT (Air Force)", "https://afcat.cdac.in"]] },
    { icon: "🏛️", title: "UPSC Civil Services and Engineering Services", note: "IAS / IPS / IFS through the Civil Services Exam, or ESE for core engineering posts in railways, CPWD, telecom and defence. The syllabus is free on the UPSC site.",
      links: [["UPSC", "https://upsc.gov.in"], ["UPSC ESE", "https://upsc.gov.in"], ["IBPS (bank SO / IT officer)", "https://www.ibps.in"]] },
    { icon: "🏫", title: "Become a professor or researcher", note: "UGC-NET and CSIR-NET qualify you for lectureship and JRF. Combine with M.Tech and PhD to teach at universities and run your own lab.",
      links: [["UGC NET", "https://ugcnet.nta.ac.in"], ["CSIR NET", "https://csirnet.nta.ac.in"], ["NPTEL (teach and learn)", "https://nptel.ac.in"]] },
    { icon: "🚀", title: "Build a startup with government backing", note: "Startup India registration, Atal Innovation Mission and incubators at IITs help with funding, mentors and legal support. Patents protect your idea.",
      links: [["Startup India", "https://www.startupindia.gov.in"], ["Atal Innovation Mission", "https://aim.gov.in"], ["Indian Patent Office", "https://ipindia.gov.in"], ["Smart India Hackathon", "https://www.sih.gov.in"]] },
    { icon: "🧑‍🏭", title: "Free graduate apprenticeship with stipend", note: "NATS gives fresh graduate engineers paid on-the-job training in real companies, which is a strong stepping stone to a permanent job.",
      links: [["NATS Portal", "https://nats.education.gov.in"], ["Apprenticeship India", "https://apprenticeshipindia.gov.in"]] },
    { icon: "🏅", title: "Compete globally and build a name", note: "Contest ratings, open-source contributions and hackathon wins are visible proof of skill and can lead directly to job offers.",
      links: [["Codeforces", "https://codeforces.com"], ["Kaggle", "https://www.kaggle.com"], ["Google Summer of Code", "https://summerofcode.withgoogle.com"], ["Smart India Hackathon", "https://www.sih.gov.in"]] },
  ],
};
function careerCards(sections) {
  return sections.map(sec => el("div", { class: "learn-card" },
    el("strong", {}, sec.icon + " " + sec.title),
    el("p", { class: "hint" }, sec.note),
    el("div", { class: "rowbtns" }, sec.links.map(([label, url]) => outLink(url, label, "linkbtn")))));
}
function renderCareer() {
  const leave = () => { state.mode = state.selected ? "view" : "intro"; render(); };
  const go = (v) => () => { careerBranch = v; render(); };
  const back = el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: leave }, "Back"));
  if (!careerBranch) {
    return [
      el("h2", {}, "🚀 Career Guide"),
      el("p", { class: "hint" }, "Finished (or about to finish) your degree and unsure what next? Pick your branch to see every career path with free links."),
      el("div", { class: "label" }, "Select your branch"),
      el("div", { class: "rowbtns" }, Object.keys(CAREER).map(b => el("button", { class: "btn primary", type: "button", onclick: go(b) }, b))),
      el("div", { class: "label" }, "For every branch"),
      el("div", { class: "rowbtns" },
        el("button", { class: "btn", type: "button", onclick: go("ABROAD") }, "🌍 Abroad Explorer"),
        el("button", { class: "btn", type: "button", onclick: go("PREMIUM") }, "💎 Premium Paths")),
      el("p", { class: "hint" }, "Tip: ECE, EEE, Civil and Mech students can also apply to software roles. Core and PSU jobs mostly need a good GATE score."),
      back,
    ];
  }
  const nav = el("div", { class: "rowbtns" },
    el("button", { class: "btn", type: "button", onclick: () => { careerBranch = null; render(); } }, "Change branch"),
    el("button", { class: "btn", type: "button", onclick: leave }, "Back"));
  const extras = el("div", { class: "rowbtns" },
    careerBranch !== "ABROAD" && el("button", { class: "btn sm", type: "button", onclick: go("ABROAD") }, "🌍 Abroad Explorer"),
    careerBranch !== "PREMIUM" && el("button", { class: "btn sm", type: "button", onclick: go("PREMIUM") }, "💎 Premium Paths"));
  if (careerBranch === "ABROAD" || careerBranch === "PREMIUM") {
    const d = careerBranch === "ABROAD" ? ABROAD : PREMIUM;
    return [
      el("h2", {}, careerBranch === "ABROAD" ? "🌍 Abroad Explorer" : "💎 Premium Paths"),
      el("p", { class: "hint" }, d.tag + ". " + d.intro),
      ...careerCards(d.sections), extras, nav,
    ];
  }
  const c = CAREER[careerBranch];
  return [
    el("h2", {}, "🚀 " + careerBranch + " — after graduation"),
    el("p", { class: "hint" }, c.tag + ". Options you can choose after B.Tech. Tap any link; all are free to use."),
    el("div", { class: "rowbtns" }, Object.keys(CAREER).map(b =>
      el("button", { class: "btn sm" + (b === careerBranch ? " primary" : ""), type: "button", onclick: go(b) }, b))),
    ...careerCards([...c.sections, ...(CAREER_EXTRA[careerBranch] || [])]),
    el("div", { class: "label" }, "Explore more"), extras, nav,
  ];
}

// ---------- study tools: formula cards, PYQ, placement, study plan ----------
const FORMULAS = {
  "DLD": [
    ["De Morgan's Laws", "NOT(A AND B) = NOT A OR NOT B\nNOT(A OR B)  = NOT A AND NOT B"],
    ["Full Adder", "Sum  = A XOR B XOR Cin\nCout = AB + BCin + ACin"],
    ["D Flip-Flop", "Q(n+1) = D\n(data stored on rising clock edge)"],
    ["JK Flip-Flop", "Q(n+1) = J.Q' + K'.Q\nJ=K=1 --> toggle"],
    ["K-map Groups", "Group sizes: 1, 2, 4, 8 (always power of 2)\nWrap-around corners are valid groups"],
    ["Absorption", "A.(A+B) = A\nA + A.B  = A"],
  ],
  "DSP": [
    ["Z-transform", "X(z) = sum x[n].z^(-n)\n(sum from n=-inf to +inf)"],
    ["DFT", "X[k] = sum x[n].e^(-j2pi.nk/N)\nfor k = 0, 1, ..., N-1"],
    ["Nyquist Theorem", "fs >= 2.fmax\n(sample at least twice the highest freq)"],
    ["Convolution", "y[n] = x[n] * h[n]\n     = sum x[k].h[n-k]"],
    ["BIBO Stable", "sum |h[n]| < infinity\n(finite sum of impulse response)"],
    ["FFT vs DFT", "DFT: O(N^2)\nFFT: O(N.log N)  --> much faster!"],
  ],
  "AEC": [
    ["CE Voltage Gain", "Av = -gm.RC\n(negative sign = signal inversion)"],
    ["Transconductance", "gm = IC / VT\nVT = 26 mV at room temperature"],
    ["Op-Amp Inverting", "Vo = -(Rf / Rin).Vi"],
    ["Op-Amp Non-Inv", "Vo = (1 + Rf/Rin).Vi"],
    ["BJT DC Bias", "IC = beta.IB\nIE = IC + IB\nVBE approx 0.7 V"],
    ["MOSFET (Sat.)", "Id = (k/2).(VGS - Vth)^2\nwhen VDS >= VGS - Vth"],
  ],
  "CS": [
    ["Closed-loop TF", "T(s) = G(s) / (1 + G(s).H(s))"],
    ["Steady-state (step)", "ess = 1 / (1 + Kp)   [Type 0 system]"],
    ["Steady-state (ramp)", "ess = 1 / Kv         [Type 1 system]"],
    ["Bode Gain Margin", "GM = -20.log|G(jw)| at phase = -180 deg\n(+ve GM = stable)"],
    ["Routh Criterion", "All elements in first column > 0\n--> system is stable"],
    ["PID Controller", "u(t) = Kp.e + Ki.Integral(e) + Kd.de/dt"],
  ],
  "CN": [
    ["Shannon Capacity", "C = B.log2(1 + SNR)\n(max error-free data rate)"],
    ["Go-Back-N Window", "Window size <= 2^(n-1)\n(n = sequence number bits)"],
    ["Selective Repeat", "Window size <= 2^(n-1) / 2"],
    ["Usable Hosts", "Hosts = 2^n - 2\n(n = host bits in subnet)"],
    ["CSMA/CD Efficiency", "efficiency = 1 / (1 + 2a)\na = propagation delay / transmission time"],
  ],
  "CO & D": [
    ["CPI", "CPI = sum(CPI_i . IC_i) / Total instructions"],
    ["MIPS", "MIPS = Clock freq / (CPI . 10^6)"],
    ["Cache Hit Time", "T_avg = h.Tc + (1-h).Tm\nh=hit rate, Tc=cache time, Tm=mem time"],
    ["Pipeline Speedup", "Speedup = n.k / (k + n - 1)\nn=instructions, k=stages"],
    ["Addressing Modes", "Immediate, Direct, Indirect,\nRegister, Register-Indirect, Displacement"],
  ],
  "DS & A": [
    ["Sorting Complexity", "Merge / Heap: O(n log n)\nQuick sort avg: O(n log n), worst O(n^2)\nBubble / Insert: O(n^2)"],
    ["Binary Search", "O(log n)  -- array must be sorted"],
    ["BFS / DFT", "Time: O(V + E)\nSpace: O(V)"],
    ["DP Rule", "Overlapping subproblems\n+ Optimal substructure\n--> use memoization or tabulation"],
    ["Hash Table", "Average O(1) insert / lookup\nO(n) worst case (all collisions)"],
    ["BST Height", "Balanced: O(log n)\nSkewed: O(n)"],
  ],
  "OS": [
    ["Deadlock (4 conditions)", "1. Mutual exclusion\n2. Hold and Wait\n3. No preemption\n4. Circular wait\n(all 4 must hold simultaneously)"],
    ["CPU Utilisation", "1 - p^n\n(n processes, p = I/O wait fraction)"],
    ["Page Fault EAT", "EAT = (1-p).Tmem + p.Tpage_fault"],
    ["Banker's Algorithm", "Safe state means safe sequence exists\n(check before granting resources)"],
    ["Semaphore", "wait(S): S--; if S<0 block\nsignal(S): S++; if S<=0 wake one"],
  ],
  "DBMS": [
    ["1NF --> 2NF", "Remove partial dependencies\n(every non-key attr fully depends on PK)"],
    ["2NF --> 3NF", "Remove transitive dependencies\n(non-key attrs depend ONLY on PK)"],
    ["3NF --> BCNF", "Every determinant must be a candidate key"],
    ["Relational Algebra", "sigma = select rows (WHERE)\npi = project columns (SELECT)\nbig-join = join tables\nunion, intersect, minus = set ops"],
    ["ACID", "Atomicity: all or nothing\nConsistency: valid state always\nIsolation: transactions independent\nDurability: committed data persists"],
  ],
  "Circuits": [
    ["KVL / KCL", "KVL: Sum of voltages in any loop = 0\nKCL: Sum of currents at any node = 0"],
    ["Thevenin Theorem", "Vth = open-circuit voltage\nRth = Voc / Isc  (deactivate sources)"],
    ["Impedance", "ZL = jwL\nZC = 1/(jwC)\nZR = R"],
    ["AC Power", "P = VI.cos(phi)   [Watts, real]\nQ = VI.sin(phi)   [VAR, reactive]\nS = VI*           [VA, complex]"],
    ["Series Resonance", "f0 = 1 / (2.pi.sqrt(LC))\nQ  = w0.L / R\nBW = R / L"],
  ],
  "Control": [
    ["Closed-loop TF", "T(s) = G(s) / (1 + G(s).H(s))"],
    ["Steady-state (Type 0)", "ess = 1 / (1 + Kp)  for step input"],
    ["Gain Margin", "GM (dB) = -20.log|G(jw)| at phase -180 deg"],
    ["Phase Margin", "PM = 180 deg + angle G(jwgc)\n(wgc = gain crossover frequency)"],
    ["PID", "u(t) = Kp.e + Ki.integral(e) + Kd.de/dt"],
  ],
  "Maths": [
    ["Euler's Formula", "e^(j.theta) = cos(theta) + j.sin(theta)"],
    ["Bayes' Theorem", "P(A|B) = P(B|A).P(A) / P(B)"],
    ["Pigeonhole", "n+1 objects in n boxes\n--> at least 1 box has 2 or more"],
    ["Euler Circuit", "All vertices have even degree\n--> Eulerian circuit exists"],
    ["Combinations", "C(n,r) = n! / (r! . (n-r)!)\nP(n,r) = n! / (n-r)!"],
  ],
  "Thermo": [
    ["1st Law of Thermo", "dU = delta.Q - delta.W\n(energy is conserved)"],
    ["Carnot Efficiency", "eta = 1 - TL / TH\n(max possible efficiency between TL and TH)"],
    ["Ideal Gas Law", "PV = nRT\nPV^gamma = constant  [adiabatic]"],
    ["COP (Refrigerator)", "COP = QL / W = QL / (QH - QL)"],
  ],
  "SOM": [
    ["Normal Stress", "sigma = F / A"],
    ["Bending Stress", "sigma = M.y / I\n(M=moment, y=dist from neutral axis)"],
    ["Shear Stress", "tau = VQ / (I.b)\n(V=shear force, Q=first moment of area)"],
    ["Euler Buckling", "Pcr = pi^2 . E . I / Le^2"],
  ],
  "EM": [
    ["Synchronous Speed", "Ns = 120.f / P\n(P=poles, f=supply frequency Hz)"],
    ["Slip", "s = (Ns - N) / Ns"],
    ["Transformer EMF", "E = 4.44 . f . N . Phi_m"],
    ["Transformer Efficiency", "eta = Pout / (Pout + Pcu + Pi)\n(Pcu=copper loss, Pi=iron loss)"],
  ],
};

const PYQ_SEARCH = (s) => "https://www.google.com/search?q=" + encodeURIComponent("GATE " + learnTerm(s) + " previous year questions site:gateoverflow.in OR site:geeksforgeeks.org");
const UNIV_SEARCH = (s) => "https://www.google.com/search?q=" + encodeURIComponent("JNTUK " + s + " previous year question papers PDF");
const GFG_SEARCH  = (s) => "https://www.geeksforgeeks.org/search/?q=" + encodeURIComponent(learnTerm(s));

const PLACEMENT_RES = [
  { icon: "💻", name: "LeetCode Top 150", hint: "Coding interview patterns", url: "https://leetcode.com/studyplan/top-interview-150/" },
  { icon: "🌐", name: "GFG DSA Sheet", hint: "450 must-do problems", url: "https://www.geeksforgeeks.org/dsa-sheet-by-love-babbar/" },
  { icon: "⚡", name: "HackerRank", hint: "Skills & certifications", url: "https://www.hackerrank.com/dashboard" },
  { icon: "📘", name: "GFG Core CS", hint: "OS, DBMS, CN, OOP notes", url: "https://www.geeksforgeeks.org/last-minute-notes-for-gate/" },
  { icon: "🎯", name: "GATE Overflow", hint: "GATE-level discussions", url: "https://gateoverflow.in" },
  { icon: "🔌", name: "ECE Interview Qs", hint: "Circuits, Signals, Analog", url: "https://www.electronicshub.org/interview-questions/" },
  { icon: "📊", name: "IndiaBIX", hint: "Aptitude & reasoning", url: "https://www.indiabix.com" },
  { icon: "🏅", name: "InterviewBit", hint: "Roadmap & mock tests", url: "https://www.interviewbit.com/courses/programming/" },
  { icon: "📑", name: "PrepInsta", hint: "Company-specific papers", url: "https://prepinsta.com/placement-papers/" },
  { icon: "🎓", name: "Swayam MOOCs", hint: "Free credit-eligible courses", url: "https://swayam.gov.in/explorer" },
];

let resourceTab = "formulas";
// ---------- challenge quiz in-progress state ----------
let chalQuiz = null; // {challengeId, startTime, answers:[], timer:null}

let formulaOpen = null;
let mcqSubj = null;
let mcqRevealed = {};
let syllabusSubj = null;
let syllabusUnit = null; // "subject-unitIdx"

// RGUKT AP syllabus — unit-wise topics for every subject
const SYLLABUS = {
  // ——— ECE ———
  "DLD": {
    branch: "ECE",
    code: "23EC2102", credits: "4 Credits  |  3L: 1T: 0P  |  PCC",
    units: [
      { title: "Unit I — Number Systems & Boolean Algebra", hours: "6 hrs", topics: [
        "Number systems: Representations and Conversions (Binary, Octal, Decimal, Hexadecimal)",
        "Boolean constants and variables",
        "Basic gates: operation and truth tables",
        "Describing logic gates algebraically; evaluating logic circuit outputs",
        "Implementing circuits from Boolean expressions; universality of gates",
        "Boolean theorems, De Morgan's theorems",
        "Alternate logic gate representations; IEEE/ANSI standard logic symbols",
      ], res: {
        chapters: [
          { book: "Tocci et al.", ref: "Ch. 1 (Introductory Concepts) + Ch. 2 (Number Systems and Codes)" },
          { book: "Wakerly", ref: "Ch. 1 (Introduction to Digital Design)" },
        ],
        videos: [
          { label: "▶ Neso Academy – Number Systems & Boolean Algebra (DLD Playlist)", url: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm" },
          { label: "▶ NPTEL – Digital Circuits (IIT Madras) Week 1", url: "https://nptel.ac.in/courses/117106114/" },
          { label: "▶ YouTube Search: DLD Number Systems Boolean Algebra", url: "https://www.youtube.com/results?search_query=DLD+Number+Systems+Boolean+Algebra+lecture" },
        ],
        pdfs: [
          { label: "📄 GFG – Number System in Digital Electronics", url: "https://www.geeksforgeeks.org/number-system-in-digital-electronics/" },
          { label: "📄 GFG – Boolean Algebra & Logic Gates", url: "https://www.geeksforgeeks.org/digital-electronics-boolean-algebra/" },
          { label: "📄 NPTEL Lecture Notes – Digital Circuits & Systems", url: "https://nptel.ac.in/courses/117106114/" },
        ],
      }},
      { title: "Unit II — Combinational Circuit Design", hours: "12 hrs", topics: [
        "Combinational circuit minimization using Boolean laws and Karnaugh maps",
        "Multi-level synthesis, timing hazards, logic levels and noise margins; Fan-out, Fan-in",
        "Single-bit adders and subtractors; multi-bit adders; BCD adder",
        "Multi-bit subtraction using adders; signed and unsigned multipliers",
        "Code converters; parity bit generators/checkers; magnitude comparator",
        "Delay, Area and Power analysis in combinational circuit designs",
        "Conversion of real-time statements into Boolean expressions; gate-level logic circuit design",
      ], res: {
        chapters: [
          { book: "Tocci et al.", ref: "Ch. 3 (Logic Gates) + Ch. 4 (Boolean Algebra & Simplification) + Ch. 5 (Combinational Logic) + Ch. 6 (Functions of Combinational Logic)" },
          { book: "Wakerly", ref: "Ch. 2 (Combinational Logic Design Principles) + Ch. 3 (Combinational Logic Design Practices)" },
        ],
        videos: [
          { label: "▶ Neso Academy – K-Map Simplification & Adders", url: "https://www.youtube.com/results?search_query=Neso+Academy+K+map+karnaugh+map+simplification" },
          { label: "▶ NPTEL – Digital Circuits Weeks 2–4 (Combinational)", url: "https://nptel.ac.in/courses/117106114/" },
          { label: "▶ YouTube Search: Combinational Circuit Design K-map adder", url: "https://www.youtube.com/results?search_query=Combinational+circuit+design+kmap+adder+subtractor+DLD" },
        ],
        pdfs: [
          { label: "📄 GFG – Karnaugh Map (K-Map)", url: "https://www.geeksforgeeks.org/k-map-karnaugh-map/" },
          { label: "📄 GFG – Half Adder and Full Adder", url: "https://www.geeksforgeeks.org/half-adder-and-full-adder-circuit/" },
          { label: "📄 GFG – Magnitude Comparator", url: "https://www.geeksforgeeks.org/magnitude-comparator-in-digital-logic/" },
        ],
      }},
      { title: "Unit III — Latches & Flip-Flops", hours: "10 hrs", topics: [
        "Bistable elements; S-R latch, S'-R' latch, S̄ latch with enable, D latch",
        "Race-around condition and elimination methods",
        "Edge-triggered D flip-flop; edge-triggered D flip-flop with asynchronous inputs",
        "Master-slave flip-flop; edge-triggered J-K flip-flop with asynchronous inputs; T flip-flop",
        "Excitation tables and characteristic equations",
        "Flip-flop timing: set-up time, hold-time (positive edge-triggered D flip-flop)",
      ], res: {
        chapters: [
          { book: "Tocci et al.", ref: "Ch. 7 (Latches and Flip-Flops)" },
          { book: "Wakerly", ref: "Ch. 5 (Sequential Logic Design Practices – Latches & FFs)" },
        ],
        videos: [
          { label: "▶ Neso Academy – SR, D, JK, T Flip-Flops", url: "https://www.youtube.com/results?search_query=Neso+Academy+flip+flops+SR+JK+D+T+master+slave" },
          { label: "▶ NPTEL – Digital Circuits Week 5 (Sequential Intro)", url: "https://nptel.ac.in/courses/117106114/" },
          { label: "▶ YouTube Search: Latches Flip Flops DLD explained", url: "https://www.youtube.com/results?search_query=latches+flip+flops+SR+JK+D+T+race+around+condition+DLD" },
        ],
        pdfs: [
          { label: "📄 GFG – Types of Flip-Flops and Conversions", url: "https://www.geeksforgeeks.org/flip-flop-types-their-conversion-and-applications/" },
          { label: "📄 GFG – SR Flip-Flop", url: "https://www.geeksforgeeks.org/sr-flip-flop/" },
          { label: "📄 GFG – Master-Slave JK Flip-Flop", url: "https://www.geeksforgeeks.org/master-slave-jk-flip-flop/" },
        ],
      }},
      { title: "Unit IV — Counters & Registers", hours: "14 hrs", topics: [
        "Frequency division and counting",
        "Design and analysis of asynchronous counters; delay and maximum clock frequency",
        "Design and analysis of synchronous counters",
        "BCD counter, Ring counter, Johnson counter",
        "State diagram overview (Present States, Next States, Present Outputs, Present Inputs)",
        "Serial/Parallel data transfer registers: PIPO, SISO, PISO, SIPO",
      ], res: {
        chapters: [
          { book: "Tocci et al.", ref: "Ch. 8 (Counters and Registers)" },
          { book: "Wakerly", ref: "Ch. 6 (Sequential Logic Design Practices – Counters & Registers)" },
        ],
        videos: [
          { label: "▶ Neso Academy – Counters (Async & Sync) and Registers", url: "https://www.youtube.com/results?search_query=Neso+Academy+asynchronous+synchronous+counters+registers" },
          { label: "▶ NPTEL – Digital Circuits Weeks 6–7 (Counters)", url: "https://nptel.ac.in/courses/117106114/" },
          { label: "▶ YouTube Search: BCD Ring Johnson Counter PIPO SISO", url: "https://www.youtube.com/results?search_query=BCD+Ring+Johnson+counter+PIPO+SISO+PISO+SIPO+register+DLD" },
        ],
        pdfs: [
          { label: "📄 GFG – Counters in Digital Logic", url: "https://www.geeksforgeeks.org/counters-in-digital-logic/" },
          { label: "📄 GFG – Shift Registers", url: "https://www.geeksforgeeks.org/shift-registers-in-digital-logic/" },
          { label: "📄 GFG – Ring Counter and Johnson Counter", url: "https://www.geeksforgeeks.org/ring-counter-in-digital-logic/" },
        ],
      }},
      { title: "Unit V — Decoders, Multiplexers & PLDs", hours: "10 hrs", topics: [
        "Decoders: Binary decoder; synthesis of logic functions using decoders; cascading binary decoders; seven-segment decoders and applications",
        "Multiplexers: synthesis of logic functions using multiplexers",
        "Demultiplexers: Realization; 1-4 and 1-8 line demultiplexers; demultiplexer tree",
        "Encoders: Priority encoders",
        "Implementation of functions using PLDs: PAL, PLA, PROM",
      ], res: {
        chapters: [
          { book: "Tocci et al.", ref: "Ch. 9 (MSI Logic Circuits – Decoders, MUX, Encoders)" },
          { book: "Wakerly", ref: "Ch. 4 (Combinational Logic Design Practices – MSI Parts)" },
        ],
        videos: [
          { label: "▶ Neso Academy – Encoders, Decoders, MUX, DEMUX", url: "https://www.youtube.com/results?search_query=Neso+Academy+encoder+decoder+multiplexer+demultiplexer" },
          { label: "▶ NPTEL – Digital Circuits Week 8 (MUX & PLDs)", url: "https://nptel.ac.in/courses/117106114/" },
          { label: "▶ YouTube Search: PAL PLA PROM Programmable Logic Devices", url: "https://www.youtube.com/results?search_query=PAL+PLA+PROM+programmable+logic+devices+DLD" },
        ],
        pdfs: [
          { label: "📄 GFG – Multiplexers in Digital Circuits", url: "https://www.geeksforgeeks.org/multiplexers-in-digital-logic/" },
          { label: "📄 GFG – Decoder in Digital Electronics", url: "https://www.geeksforgeeks.org/binary-decoder-digital-electronics/" },
          { label: "📄 GFG – Programmable Logic Devices (PAL, PLA)", url: "https://www.geeksforgeeks.org/programmable-logic-devices/" },
        ],
      }},
      { title: "Unit VI — Memory & Digital System Design", hours: "8 hrs", topics: [
        "Memory Structure and Timing: Static RAM (SRAM), Dynamic RAM (DRAM)",
        "Architecture: CPLD, FPGA",
        "Design and analysis of Digital circuits: Digital Clock",
        "Digital Calendar; Traffic Light Controller",
        "Mobile number sequence generators and other relevant topics",
      ], res: {
        chapters: [
          { book: "Tocci et al.", ref: "Ch. 10 (Memory and Storage) + Ch. 11 (Integrated Circuit Technologies)" },
          { book: "Wakerly", ref: "Ch. 7 (Sequential Logic Design Techniques – State Machines & Applications)" },
        ],
        videos: [
          { label: "▶ NPTEL – Digital Circuits Weeks 9+ (Memory & System Design)", url: "https://nptel.ac.in/courses/117106114/" },
          { label: "▶ YouTube Search: SRAM DRAM CPLD FPGA Digital Systems", url: "https://www.youtube.com/results?search_query=SRAM+DRAM+CPLD+FPGA+digital+system+design+DLD" },
          { label: "▶ YouTube Search: Digital Clock Traffic Light Controller FSM", url: "https://www.youtube.com/results?search_query=digital+clock+traffic+light+controller+FSM+VHDL+Verilog" },
        ],
        pdfs: [
          { label: "📄 GFG – Static RAM vs Dynamic RAM", url: "https://www.geeksforgeeks.org/difference-between-sram-and-dram/" },
          { label: "📄 GFG – Introduction to FPGA", url: "https://www.geeksforgeeks.org/introduction-of-fpga-field-programmable-gate-array/" },
          { label: "📄 GFG – CPLD vs FPGA", url: "https://www.geeksforgeeks.org/difference-between-cpld-and-fpga/" },
        ],
      }},
    ],
    textbooks: [
      "Ronald J. Tocci, Neal S. Widmer, Gregory L. Moss — 'Digital Systems', Pearson, 10th edition",
      "John F. Wakerly — 'Digital Design', Pearson, 4th edition",
    ],
    refbooks: [
      "Stephen Brown, Zvonko Vranesic — 'Fundamentals of Digital Logic with Verilog Design', TMH, 2nd edition",
    ],
    webres: [
      { label: "NPTEL – Digital Circuits & Systems (Prof. Shankar Balachandran, IIT Madras)", url: "https://nptel.ac.in/courses/117106114/" },
      { label: "NPTEL – Digital Circuits and Systems (Prof. S Srinivasan, IIT Madras)", url: "https://nptel.ac.in/courses/117106086/" },
    ],
  },
  "DSP": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — Discrete-Time Signals & Z-transform", topics: ["Classification of DT signals and systems", "LTI systems: convolution, properties", "Z-transform definition, properties, ROC", "Inverse Z-transform (partial fractions, power series)", "System function H(z), stability using poles"] },
      { title: "Unit 2 — Frequency Analysis & DFT", topics: ["DTFT and its properties", "DFT: definition and properties", "Circular convolution", "Overlap-add and overlap-save methods", "Relationship between DTFT, DFT, and Z-transform"] },
      { title: "Unit 3 — Fast Fourier Transform (FFT)", topics: ["Divide-and-conquer approach", "DIT-FFT algorithm (Cooley-Tukey)", "DIF-FFT algorithm", "Computational complexity: O(N log N)", "IFFT computation"] },
      { title: "Unit 4 — IIR Filter Design", topics: ["Analog filter prototypes: Butterworth, Chebyshev", "Bilinear transformation", "Impulse invariant method", "Digital IIR filter design procedure", "Frequency transformations"] },
      { title: "Unit 5 — FIR Filter Design", topics: ["Linear phase FIR filters", "Window functions: Rectangular, Hamming, Hanning, Kaiser", "Frequency sampling method", "FIR vs IIR comparison", "Introduction to multirate signal processing"] },
    ],
  },
  "AEC": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — BJT Biasing & Small-Signal Amplifiers", topics: ["BJT operating regions", "DC bias circuits (fixed, self-bias, voltage divider)", "h-parameter model", "CE, CB, CC amplifier analysis", "Gain, input/output impedance"] },
      { title: "Unit 2 — Multi-Stage & Feedback Amplifiers", topics: ["RC-coupled, transformer-coupled, direct-coupled amplifiers", "Cascade amplifier analysis", "Feedback types (voltage/current series/shunt)", "Effect of feedback on gain, bandwidth, distortion", "Barkhausen criterion for oscillation"] },
      { title: "Unit 3 — Oscillators", topics: ["RC phase shift oscillator", "Wien bridge oscillator", "Hartley and Colpitts oscillators", "Crystal oscillators", "Frequency stability"] },
      { title: "Unit 4 — Power Amplifiers", topics: ["Class A, B, AB, C amplifiers", "Push-pull amplifier", "Efficiency and power dissipation", "Thermal runaway", "Distortion in power amplifiers"] },
      { title: "Unit 5 — Op-Amp Applications", topics: ["Ideal op-amp characteristics", "Inverting and non-inverting amplifiers", "Summing, Difference, Integrator, Differentiator", "Comparators and Schmitt trigger", "Active filters (LPF, HPF, BPF)", "Precision rectifiers"] },
    ],
  },
  "CS": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — Introduction & Modeling", topics: ["Open-loop vs closed-loop systems", "Transfer function, Block diagram algebra", "Signal flow graphs, Mason's gain formula", "Modeling of electrical, mechanical systems"] },
      { title: "Unit 2 — Time Domain Analysis", topics: ["Test signals: step, ramp, impulse", "Transient response of 1st and 2nd order systems", "Rise time, peak time, settling time, overshoot", "Steady-state error and error constants (Kp, Kv, Ka)", "System type and error"] },
      { title: "Unit 3 — Stability Analysis", topics: ["Routh-Hurwitz stability criterion", "Root locus construction rules", "Effect of poles and zeros on root locus", "Gain and phase margin from root locus"] },
      { title: "Unit 4 — Frequency Domain Analysis", topics: ["Frequency response, polar plots", "Bode magnitude and phase plots", "Gain margin and phase margin", "Nyquist stability criterion", "Closed-loop frequency response"] },
      { title: "Unit 5 — Compensators & State Space", topics: ["Lead, lag, lead-lag compensators", "PID controller design", "State space representation", "State transition matrix", "Controllability and observability"] },
    ],
  },
  "CN": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — Introduction & Physical Layer", topics: ["Network types: LAN, WAN, MAN", "OSI model (7 layers) and TCP/IP model", "Data transmission: bandwidth, throughput, latency", "Transmission media (guided and unguided)", "Encoding and modulation techniques"] },
      { title: "Unit 2 — Data Link Layer", topics: ["Framing, error detection (CRC, checksum)", "Error correction (Hamming code)", "Flow control: stop-and-wait, sliding window", "MAC protocols: ALOHA, CSMA/CD, CSMA/CA", "IEEE 802.3 Ethernet, IEEE 802.11 Wi-Fi"] },
      { title: "Unit 3 — Network Layer", topics: ["IPv4 addressing, subnetting, CIDR", "IPv6 overview", "Routing algorithms: Dijkstra (OSPF), Bellman-Ford (RIP)", "IP fragmentation, ICMP", "ARP, DHCP"] },
      { title: "Unit 4 — Transport Layer", topics: ["Services: connection-oriented vs connectionless", "UDP: features and applications", "TCP: segments, three-way handshake", "TCP congestion control (slow start, AIMD)", "TCP flow control (sliding window)"] },
      { title: "Unit 5 — Application Layer", topics: ["DNS: domain name resolution", "HTTP/HTTPS: request-response", "FTP, SMTP, POP3, IMAP", "Socket programming basics", "Introduction to network security (SSL/TLS)"] },
    ],
  },
  "CO & D": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — Basic Computer Organization", topics: ["Register transfer language (RTL)", "Buses and memory transfers", "Arithmetic logic unit (ALU) design", "Instruction cycle: fetch-decode-execute", "Addressing modes"] },
      { title: "Unit 2 — Instruction Set Architecture", topics: ["Instruction formats and types", "RISC vs CISC", "Assembly language overview", "Stacks, subroutine calls", "Interrupt handling"] },
      { title: "Unit 3 — CPU Design & Control Unit", topics: ["Hardwired control", "Microprogrammed control", "Micro-operations", "Pipeline hazards: structural, data, control", "Hazard mitigation techniques"] },
      { title: "Unit 4 — Memory Organization", topics: ["Cache memory: mapping (direct, associative, set-associative)", "Cache replacement policies (LRU, FIFO)", "Virtual memory, paging, TLB", "Memory hierarchy and performance", "DRAM, SRAM comparison"] },
      { title: "Unit 5 — I/O & Advanced Topics", topics: ["I/O interfaces: programmed, interrupt-driven, DMA", "I/O buses (PCI, USB)", "Multiprocessors introduction", "Shared memory and message passing", "GPU architecture overview"] },
    ],
  },
  "PRV": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — Probability Fundamentals", topics: ["Sample space, events", "Axioms of probability", "Conditional probability, Bayes' theorem", "Independence of events", "Combinatorial problems"] },
      { title: "Unit 2 — Random Variables", topics: ["Discrete RV: PMF, CDF", "Continuous RV: PDF, CDF", "Common distributions: Bernoulli, Binomial, Poisson, Uniform, Gaussian, Exponential", "Functions of a random variable"] },
      { title: "Unit 3 — Statistical Averages", topics: ["Mean, variance, standard deviation", "Moments and moment generating function", "Chebyshev's inequality", "Characteristic function", "Central limit theorem"] },
      { title: "Unit 4 — Multiple Random Variables", topics: ["Joint PDF/PMF", "Marginal and conditional distributions", "Correlation and covariance", "Linear transformation of RVs", "Jointly Gaussian RVs"] },
      { title: "Unit 5 — Random Processes", topics: ["Classification of random processes", "Stationary processes (SSS and WSS)", "Autocorrelation and power spectral density", "Wiener-Khinchin theorem", "Response of LTI systems to random inputs"] },
    ],
  },
  "CS-2": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — Amplitude Modulation", topics: ["AM: generation, spectrum, power", "DSB-SC, SSB-SC, VSB", "AM demodulation (envelope detector)", "Superheterodyne receiver", "Figure of merit for AM"] },
      { title: "Unit 2 — Angle Modulation", topics: ["FM and PM: instantaneous frequency", "WBFM and NBFM", "FM spectrum (Bessel functions)", "FM demodulation (limiter-discriminator, PLL)", "Comparison of AM vs FM"] },
      { title: "Unit 3 — Pulse Modulation", topics: ["Sampling theorem", "PAM: natural and flat-top", "PWM and PPM", "PCM: quantization, encoding, companding (μ-law, A-law)", "Delta modulation and ADM"] },
      { title: "Unit 4 — Digital Modulation", topics: ["ASK, FSK, PSK, BPSK, QPSK", "Differential PSK (DPSK)", "QAM", "Coherent vs non-coherent detection", "BER comparison of digital schemes"] },
      { title: "Unit 5 — Information Theory & Noise", topics: ["Entropy, mutual information", "Channel capacity (Shannon)", "Source coding (Huffman, LZW)", "Noise in AM and FM receivers", "Threshold effect in FM"] },
    ],
  },
  "RFME": {
    branch: "ECE",
    units: [
      { title: "Unit 1 — Transmission Line Theory", topics: ["Distributed parameters: L, C, R, G", "Characteristic impedance Z₀", "Reflection coefficient, VSWR", "Smith chart applications", "Quarter-wave and half-wave transformers"] },
      { title: "Unit 2 — Microwave Components", topics: ["Rectangular and circular waveguides", "TE and TM modes, cutoff frequency", "Microwave resonators", "Directional couplers, circulators, isolators", "Microwave filters"] },
      { title: "Unit 3 — Microwave Tubes", topics: ["Limitations of conventional tubes at microwave frequencies", "Klystron (two-cavity, reflex)", "Magnetron", "Travelling wave tube (TWT)", "Backward wave oscillator (BWO)"] },
      { title: "Unit 4 — Microwave Semiconductor Devices", topics: ["Gunn diode and transferred electron devices", "IMPATT and TRAPATT diodes", "PIN diodes and Schottky diodes", "MESFETs, HEMTs", "Microwave integrated circuits (MICs)"] },
      { title: "Unit 5 — Antennas & Measurements", topics: ["Antenna parameters: gain, directivity, efficiency", "Dipole, monopole, loop antennas", "Antenna arrays and beam steering", "Microwave power, frequency, and VSWR measurement", "Noise figure measurement"] },
    ],
  },
  // ——— CSE ———
  "DS & A": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Linear Data Structures", topics: ["Arrays: operations, 2D arrays", "Linked lists: singly, doubly, circular", "Stacks: operations, applications (expression evaluation, parenthesis matching)", "Queues: simple, circular, priority, deque"] },
      { title: "Unit 2 — Trees", topics: ["Binary trees: traversals (inorder, preorder, postorder)", "Binary search trees: search, insert, delete", "AVL trees: rotations (LL, RR, LR, RL)", "Heaps (min-heap, max-heap), heapify", "B-trees overview"] },
      { title: "Unit 3 — Graphs", topics: ["Representation: adjacency matrix, list", "BFS and DFS traversals", "Shortest paths: Dijkstra, Bellman-Ford", "Minimum spanning tree: Prim, Kruskal", "Topological sort"] },
      { title: "Unit 4 — Sorting & Searching", topics: ["Bubble, Selection, Insertion sort: O(n²)", "Merge sort and Quick sort: O(n log n)", "Heap sort", "Binary search: O(log n)", "Hashing: hash functions, collision (chaining, open addressing)"] },
      { title: "Unit 5 — Algorithm Design Techniques", topics: ["Greedy: activity selection, Huffman coding, fractional knapsack", "Dynamic programming: 0/1 knapsack, LCS, matrix chain", "Backtracking: N-queens, graph coloring", "Branch and bound", "Complexity: P, NP, NP-complete"] },
    ],
  },
  "OS": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Process Management", topics: ["Process states and PCB", "Process creation/termination (fork, exec)", "Threads: user-level vs kernel-level", "CPU scheduling: FCFS, SJF, Priority, Round Robin", "Multi-level queue scheduling"] },
      { title: "Unit 2 — Process Synchronization", topics: ["Race condition, critical section problem", "Peterson's solution", "Semaphores (binary, counting)", "Monitors", "Classic problems: Producer-Consumer, Readers-Writers, Dining Philosophers"] },
      { title: "Unit 3 — Deadlock", topics: ["Deadlock conditions (Coffman's 4 conditions)", "Resource allocation graph", "Deadlock prevention and avoidance (Banker's algorithm)", "Deadlock detection and recovery"] },
      { title: "Unit 4 — Memory Management", topics: ["Contiguous allocation (fixed, variable partitions)", "Fragmentation, compaction", "Paging: page table, TLB", "Segmentation", "Virtual memory: demand paging, page fault handling"] },
      { title: "Unit 5 — File Systems & I/O", topics: ["File attributes, operations, types", "Directory structure", "File allocation: contiguous, linked, indexed (inode)", "Disk scheduling: FCFS, SSTF, SCAN, C-SCAN", "I/O hardware and software layers"] },
    ],
  },
  "DBMS": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Database Concepts & ER Model", topics: ["Database vs file system", "Database architecture (3-tier)", "ER model: entities, attributes, relationships", "Weak entities and participation constraints", "ER-to-relational mapping"] },
      { title: "Unit 2 — Relational Model & SQL", topics: ["Relational algebra: σ, π, ⋈, ∪, −", "Relational calculus", "SQL: DDL (CREATE, ALTER, DROP)", "SQL: DML (INSERT, UPDATE, DELETE, SELECT)", "Joins, subqueries, aggregate functions, GROUP BY, HAVING"] },
      { title: "Unit 3 — Normalization", topics: ["Functional dependencies", "1NF, 2NF, 3NF, BCNF", "Multi-valued dependencies and 4NF", "Lossless decomposition and dependency preservation", "Denormalization"] },
      { title: "Unit 4 — Transaction Management", topics: ["ACID properties", "Transaction states and schedules", "Serializability (conflict, view)", "Concurrency control: locking (2PL), timestamps", "Deadlock detection in databases"] },
      { title: "Unit 5 — Storage & Query Optimization", topics: ["Storage hierarchy, buffer management", "File organization: heap, sorted, hashed", "Indexing: primary, secondary, B+ tree index", "Query processing steps", "Query optimization: cost estimation, join ordering"] },
    ],
  },
  "OOP": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — OOP Fundamentals & Java Basics", topics: ["OOP concepts: encapsulation, abstraction, inheritance, polymorphism", "Java program structure, JVM, JDK", "Data types, operators, control statements", "Arrays, strings, StringBuffer", "Methods, constructors, 'this' keyword"] },
      { title: "Unit 2 — Inheritance & Polymorphism", topics: ["Single, multilevel, hierarchical inheritance", "Method overriding and dynamic dispatch", "Abstract classes and methods", "Interfaces and multiple inheritance", "final keyword"] },
      { title: "Unit 3 — Packages & Exception Handling", topics: ["Creating and using packages", "Access modifiers: public, private, protected", "try-catch-finally blocks", "Checked and unchecked exceptions", "User-defined exceptions, throw and throws"] },
      { title: "Unit 4 — Multithreading & Generics", topics: ["Thread creation: Thread class and Runnable", "Thread lifecycle and scheduling", "Synchronization: synchronized methods and blocks", "Inter-thread communication (wait, notify)", "Generics: generic classes and methods, bounded types"] },
      { title: "Unit 5 — Collections & I/O", topics: ["Collection framework: List, Set, Map, Queue", "ArrayList, LinkedList, HashSet, TreeSet, HashMap", "Iterators and for-each loop", "File I/O: FileInputStream, FileOutputStream, BufferedReader", "Serialization and deserialization"] },
    ],
  },
  "TOC": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Regular Languages & FA", topics: ["Alphabet, strings, languages", "Deterministic finite automaton (DFA)", "NFA and NFA-to-DFA conversion (subset construction)", "Regular expressions", "Regular expression to NFA (Thompson's construction)"] },
      { title: "Unit 2 — Regular Language Properties", topics: ["Closure properties of regular languages", "Pumping lemma for regular languages", "Myhill-Nerode theorem", "Minimization of DFA", "Decision problems for regular languages"] },
      { title: "Unit 3 — Context-Free Languages", topics: ["Context-free grammar (CFG)", "Derivations, parse trees, ambiguity", "Chomsky Normal Form (CNF) and Greibach Normal Form", "Pushdown automata (PDA)", "Pumping lemma for CFLs"] },
      { title: "Unit 4 — Turing Machines", topics: ["Turing machine model and transitions", "Variants: multi-tape TM, non-deterministic TM", "Church-Turing thesis", "Recursive and recursively enumerable languages", "Universal Turing machine"] },
      { title: "Unit 5 — Decidability & Complexity", topics: ["Decidable and undecidable problems", "Halting problem (undecidable, proof by diagonalization)", "Rice's theorem", "Complexity classes: P, NP", "NP-completeness: SAT, 3-SAT, Clique, Vertex Cover"] },
    ],
  },
  "CD": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Lexical Analysis", topics: ["Phases of compiler", "Role of lexical analyzer", "Tokens, patterns, lexemes", "Regular expressions for tokens", "LEX/FLEX tool overview"] },
      { title: "Unit 2 — Syntax Analysis (Parsing)", topics: ["Context-free grammars for programming languages", "Top-down parsing: recursive descent, predictive LL(1)", "First and Follow sets, parsing table", "Bottom-up parsing: LR(0), SLR(1), LALR(1)", "YACC/Bison tool overview"] },
      { title: "Unit 3 — Semantic Analysis", topics: ["Syntax-directed definitions (SDD)", "Synthesized and inherited attributes", "L-attributed and S-attributed grammars", "Type checking and type systems", "Symbol table structure and operations"] },
      { title: "Unit 4 — Intermediate Code Generation", topics: ["Three-address code", "Quadruples, triples, indirect triples", "Syntax-directed translation for expressions", "Control flow statements (if, while)", "Backpatching"] },
      { title: "Unit 5 — Code Optimization & Generation", topics: ["Basic blocks and flow graphs", "Local optimizations: constant folding, dead code elimination", "Global optimizations: loop invariant code motion, induction variable elimination", "Register allocation and assignment", "Code generation algorithms"] },
    ],
  },
  "SE": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Software Process Models", topics: ["Software development life cycle (SDLC)", "Waterfall model", "Prototyping, Spiral model", "Agile: Scrum, XP", "DevOps overview"] },
      { title: "Unit 2 — Requirements Engineering", topics: ["Functional and non-functional requirements", "Requirements elicitation techniques", "Use case diagrams (UML)", "Software Requirements Specification (SRS)", "Requirements validation and traceability"] },
      { title: "Unit 3 — Software Design", topics: ["Architectural design patterns (MVC, layered, microservices)", "UML diagrams: class, sequence, state, activity", "Design principles: SOLID", "Object-oriented design", "Modular design metrics: cohesion, coupling"] },
      { title: "Unit 4 — Software Testing", topics: ["Testing levels: unit, integration, system, acceptance", "Black-box testing: equivalence partitioning, boundary value analysis", "White-box testing: statement, branch, path coverage", "Test-driven development (TDD)", "Regression testing, performance testing"] },
      { title: "Unit 5 — Project Management & Quality", topics: ["Project planning: WBS, Gantt charts, PERT/CPM", "Effort estimation: COCOMO model, function points", "Risk management", "Software quality: ISO 9001, CMMI", "Configuration management and version control (Git)"] },
    ],
  },
  "Python": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Python Basics", topics: ["Variables, data types, operators", "Control flow: if/elif/else, for, while", "Functions: def, arguments, return, lambda", "Strings and string methods", "Lists, tuples, sets, dictionaries"] },
      { title: "Unit 2 — OOP in Python", topics: ["Classes and objects", "Constructors (__init__), self", "Inheritance and method overriding", "Dunder methods (__str__, __len__, __add__)", "Decorators and properties"] },
      { title: "Unit 3 — File Handling & Exceptions", topics: ["File open, read, write, close", "with statement and context managers", "try-except-finally, raise", "Custom exceptions", "JSON and CSV file handling"] },
      { title: "Unit 4 — NumPy & Pandas", topics: ["NumPy arrays: creation, indexing, slicing", "Array operations and broadcasting", "Pandas Series and DataFrame", "Data loading (CSV, Excel)", "Data cleaning, filtering, groupby, merge"] },
      { title: "Unit 5 — Data Visualization & Introduction to ML", topics: ["Matplotlib: line, bar, scatter, histogram plots", "Seaborn for statistical plots", "Scikit-learn: train-test split", "Linear regression, logistic regression", "Evaluation metrics: accuracy, confusion matrix"] },
    ],
  },
  "Maths": {
    branch: "CSE",
    units: [
      { title: "Unit 1 — Logic & Sets", topics: ["Propositional logic, truth tables", "Predicate logic, quantifiers", "Set theory: operations, power set, Cartesian product", "Functions: injective, surjective, bijective", "Relations: equivalence, partial order, Hasse diagram"] },
      { title: "Unit 2 — Graph Theory", topics: ["Graph types: simple, directed, weighted", "Euler and Hamiltonian paths/circuits", "Trees and spanning trees", "Planar graphs, graph coloring", "Chromatic number"] },
      { title: "Unit 3 — Combinatorics", topics: ["Counting: permutations, combinations", "Pigeonhole principle", "Inclusion-exclusion principle", "Recurrence relations", "Generating functions"] },
      { title: "Unit 4 — Linear Algebra", topics: ["Matrices: operations, rank, determinant", "Systems of linear equations (Gaussian elimination)", "Eigenvalues and eigenvectors", "Cayley-Hamilton theorem", "Linear transformations"] },
      { title: "Unit 5 — Probability & Statistics", topics: ["Probability: axioms, conditional, Bayes", "Discrete distributions: Binomial, Poisson", "Continuous distributions: Normal, Exponential", "Mean, variance, standard deviation", "Hypothesis testing overview"] },
    ],
  },
  // ——— Civil ———
  "SOM": {
    branch: "Civil",
    units: [
      { title: "Unit 1 — Stress & Strain", topics: ["Normal and shear stress", "Hooke's law, elastic constants (E, G, ν, K)", "Relationship between elastic constants", "Thermal stresses", "Composite bars and tapering bars"] },
      { title: "Unit 2 — Shear Force & Bending Moment", topics: ["Types of beams and loads", "SFD and BMD for cantilever, simply supported, overhanging beams", "Relation between load, SF, and BM", "Point of contraflexure"] },
      { title: "Unit 3 — Bending & Shear Stresses", topics: ["Theory of simple bending", "Bending stress: σ = My/I", "Section modulus, moment of inertia of standard sections", "Shear stress distribution in beams", "Composite beams (flitched beams)"] },
      { title: "Unit 4 — Deflection of Beams & Columns", topics: ["Differential equation of elastic curve", "Macaulay's method", "Moment-area method", "Columns: short vs long", "Euler's buckling load, effective length, slenderness ratio"] },
      { title: "Unit 5 — Torsion & Pressure Vessels", topics: ["Torsion of circular shafts: τ = Tr/J", "Power transmitted by shaft", "Thin cylinders: hoop and longitudinal stress", "Thick cylinders (Lamé's equations)", "Principal stresses and Mohr's circle"] },
    ],
  },
  "FM": {
    branch: "Civil",
    units: [
      { title: "Unit 1 — Fluid Properties & Statics", topics: ["Density, viscosity, surface tension, capillarity", "Hydrostatic law", "Pressure measurement: manometers, gauges", "Force on submerged plane surfaces", "Buoyancy and metacentric height"] },
      { title: "Unit 2 — Fluid Kinematics", topics: ["Types of flow: steady/unsteady, laminar/turbulent", "Streamlines, pathlines, streaklines", "Continuity equation (1D, 3D)", "Velocity potential and stream function", "Rotational vs irrotational flow"] },
      { title: "Unit 3 — Fluid Dynamics", topics: ["Bernoulli's equation and applications", "Venturimeter, orifice, pitot tube", "Momentum equation", "Flow through pipes: Darcy-Weisbach equation", "Losses: major (friction) and minor (bends, valves)"] },
      { title: "Unit 4 — Boundary Layer & Turbulence", topics: ["Boundary layer concept, displacement thickness", "Laminar and turbulent boundary layers", "Drag and lift on bodies", "Reynolds number, turbulence", "Flow separation"] },
      { title: "Unit 5 — Open Channel & Hydraulic Machines", topics: ["Open channel flow: Manning's equation", "Specific energy, critical flow, Froude number", "Hydraulic jump", "Centrifugal pumps: characteristics, cavitation", "Francis and Kaplan turbines"] },
    ],
  },
  "Struct": {
    branch: "Civil",
    units: [
      { title: "Unit 1 — Statically Determinate Structures", topics: ["Beams: SFD, BMD", "Plane trusses: method of joints, sections", "Influence lines for beams", "Arches: three-hinged arch", "Cable structures"] },
      { title: "Unit 2 — Energy Methods", topics: ["Castigliano's theorems", "Unit load method (virtual work)", "Deflection of trusses and beams", "Maxwell-Betti reciprocal theorem"] },
      { title: "Unit 3 — Force and Displacement Methods", topics: ["Degree of indeterminacy", "Compatibility method (three-moment equation)", "Slope deflection method", "Moment distribution method (Hardy Cross)"] },
      { title: "Unit 4 — Stiffness Matrix Method", topics: ["Stiffness matrix formulation", "Global vs local coordinates", "Member stiffness matrix", "Assembly and solution for beams and frames", "Introduction to finite element method"] },
      { title: "Unit 5 — Dynamic Analysis & Plastic Analysis", topics: ["Free vibration of structures", "Natural frequency, mode shapes", "Plastic hinges, plastic moment", "Collapse mechanisms for beams and frames", "Load factor and shape factor"] },
    ],
  },
  // ——— Mech ———
  "Thermo": {
    branch: "Mech",
    units: [
      { title: "Unit 1 — Basic Concepts", topics: ["Thermodynamic system, boundary, surroundings", "Properties: intensive vs extensive", "State, process, cycle", "Zeroth law and temperature", "Pure substance and phase diagrams (P-v-T surface)"] },
      { title: "Unit 2 — First Law of Thermodynamics", topics: ["Heat and work (sign conventions)", "First law for closed and open systems", "Enthalpy, specific heats Cp and Cv", "Steady-flow energy equation (SFEE)", "Throttling and nozzle flow"] },
      { title: "Unit 3 — Second Law & Entropy", topics: ["Kelvin-Planck and Clausius statements", "Carnot cycle and efficiency", "Clausius inequality", "Entropy: definition, T-s diagram", "Entropy generation and irreversibility"] },
      { title: "Unit 4 — Gas Power Cycles", topics: ["Air standard analysis", "Otto cycle (petrol engine)", "Diesel cycle", "Brayton cycle (gas turbine)", "Comparison of cycles, compressor work"] },
      { title: "Unit 5 — Vapour Cycles & Refrigeration", topics: ["Rankine cycle (steam power plant)", "Reheat and regenerative Rankine cycle", "Vapour compression refrigeration", "COP, refrigerants", "Psychrometrics: DBT, WBT, humidity, AHU"] },
    ],
  },
  "FM-M": {
    branch: "Mech",
    units: [
      { title: "Unit 1 — Fluid Properties & Statics", topics: ["Viscosity, surface tension, capillarity", "Hydrostatic forces on surfaces", "Buoyancy, metacentric height", "Pressure measurement"] },
      { title: "Unit 2 — Fluid Kinematics & Dynamics", topics: ["Continuity equation", "Bernoulli's equation", "Flow measurement: venturimeter, orifice", "Momentum equation applications"] },
      { title: "Unit 3 — Viscous Flow & Boundary Layer", topics: ["Laminar flow in pipes (Hagen-Poiseuille)", "Turbulent flow, friction factor (Moody chart)", "Boundary layer development", "Drag and lift"] },
      { title: "Unit 4 — Turbomachinery — Pumps", topics: ["Centrifugal pump: components, velocity triangles", "Head, efficiency, power", "Cavitation and NPSH", "Pump characteristics and selection", "Reciprocating pumps"] },
      { title: "Unit 5 — Turbomachinery — Turbines", topics: ["Impulse vs reaction turbines", "Pelton wheel", "Francis turbine", "Kaplan turbine", "Performance characteristics and specific speed"] },
    ],
  },
  "MD": {
    branch: "Mech",
    units: [
      { title: "Unit 1 — Design Philosophy & Stresses", topics: ["Factor of safety, design for static loads", "Principal stresses, Mohr's circle", "Theories of failure (Von Mises, Tresca, Rankine)", "Stress concentration factors"] },
      { title: "Unit 2 — Fatigue & Impact", topics: ["S-N curve, endurance limit (Goodman, Soderberg)", "Stress concentration under fatigue", "Impact loading, Charpy and Izod tests", "Cumulative fatigue damage"] },
      { title: "Unit 3 — Shafts, Keys & Couplings", topics: ["Shaft design for torsion and bending", "ASME code for shafts", "Keys: parallel, Woodruff", "Couplings: rigid, flexible, universal joints"] },
      { title: "Unit 4 — Bearings & Lubrication", topics: ["Sliding contact (journal) bearings", "Hydrodynamic lubrication theory", "Rolling contact bearings: designation, load capacity, life (L10)", "Bearing selection from catalogue"] },
      { title: "Unit 5 — Gears & Springs", topics: ["Spur gear design: Lewis equation, surface fatigue", "Helical, bevel, worm gear overview", "Spring types: helical, leaf, torsion", "Close-coiled helical spring design", "Spring combinations: series and parallel"] },
    ],
  },
  // ——— EEE ———
  "Circuits": {
    branch: "EEE",
    units: [
      { title: "Unit 1 — Circuit Analysis Techniques", topics: ["KVL, KCL for DC circuits", "Nodal analysis (Node voltage method)", "Mesh analysis (Loop current method)", "Source transformation", "Star-Delta (Y-Δ) transformation"] },
      { title: "Unit 2 — Network Theorems", topics: ["Superposition theorem", "Thevenin's theorem", "Norton's theorem", "Maximum power transfer theorem", "Millman's theorem, Reciprocity theorem"] },
      { title: "Unit 3 — AC Analysis & Phasors", topics: ["Sinusoidal steady state", "Phasors and impedance (R, L, C)", "Series and parallel AC circuits", "Power: real (W), reactive (VAR), apparent (VA)", "Power factor and correction"] },
      { title: "Unit 4 — Resonance & Coupled Circuits", topics: ["Series RLC resonance: f₀, Q, bandwidth", "Parallel resonance", "Magnetically coupled circuits, mutual inductance", "Dot convention", "Ideal transformer equivalent circuit"] },
      { title: "Unit 5 — Laplace & Network Functions", topics: ["Laplace transform for circuit analysis", "Initial and final value theorems", "Network functions: driving-point, transfer", "Poles, zeros, frequency response from network function", "Two-port network parameters (Z, Y, ABCD, h)"] },
    ],
  },
  "EM": {
    branch: "EEE",
    units: [
      { title: "Unit 1 — DC Generators", topics: ["Construction: armature, field, commutator, brushes", "EMF equation", "Types of DC generators (series, shunt, compound)", "Characteristics: OCC, external, internal", "Voltage build-up and critical resistance"] },
      { title: "Unit 2 — DC Motors", topics: ["Back EMF, torque equation", "Types: series, shunt, compound motors", "Speed-torque characteristics", "Speed control methods: armature, field control", "Starting: 3-point and 4-point starters, losses, efficiency"] },
      { title: "Unit 3 — Transformers", topics: ["Construction and working principle", "EMF equation: E = 4.44fNΦm", "Equivalent circuit, phasor diagram", "OC and SC tests, efficiency, voltage regulation", "Auto-transformer, 3-phase transformer connections"] },
      { title: "Unit 4 — Induction Motors", topics: ["Construction: squirrel cage vs slip ring", "Rotating magnetic field, synchronous speed", "Slip, equivalent circuit", "Torque-slip characteristics", "Starting methods (DOL, star-delta, auto-transformer), speed control"] },
      { title: "Unit 5 — Synchronous Machines", topics: ["Construction and working of alternator", "EMF equation, winding factors", "Armature reaction, voltage regulation (EMF, MMF, ZPF methods)", "Synchronous motor: V-curves, hunting", "Parallel operation of alternators"] },
    ],
  },
  "PS": {
    branch: "EEE",
    units: [
      { title: "Unit 1 — Power System Structure", topics: ["Generation: thermal, hydro, nuclear, renewable", "Transmission system: EHV lines", "Distribution system", "Per-unit system", "Power system components modelling"] },
      { title: "Unit 2 — Transmission Line Parameters", topics: ["Resistance, inductance (GMD, GMR)", "Capacitance of lines", "Short, medium, long line models", "ABCD parameters", "Ferranti effect"] },
      { title: "Unit 3 — Load Flow Analysis", topics: ["Bus classification (slack, PV, PQ)", "Gauss-Seidel load flow", "Newton-Raphson load flow", "Fast decoupled load flow", "Power flow equations"] },
      { title: "Unit 4 — Fault Analysis", topics: ["Symmetrical (3-phase) fault analysis", "Symmetrical components (positive, negative, zero sequence)", "Unsymmetrical faults: SLG, LL, DLG", "Sequence networks", "Fault current calculations"] },
      { title: "Unit 5 — Power System Stability", topics: ["Steady-state and transient stability", "Swing equation", "Equal area criterion", "Methods to improve stability", "Power system protection: relays, circuit breakers, fuses"] },
    ],
  },
  "PE": {
    branch: "EEE",
    units: [
      { title: "Unit 1 — Power Semiconductor Devices", topics: ["Diode, SCR (thyristor) characteristics", "MOSFET and IGBT as switches", "Triggering and commutation of SCR", "Protection: snubber circuits, heat sinks"] },
      { title: "Unit 2 — Rectifiers", topics: ["Half-wave and full-wave rectifiers", "Single-phase and 3-phase controlled rectifiers (R, RL, RLE loads)", "Dual converters", "Power factor and THD", "Freewheeling diode"] },
      { title: "Unit 3 — DC-DC Converters (Choppers)", topics: ["Step-down (Buck) converter", "Step-up (Boost) converter", "Buck-Boost converter", "CCM and DCM operation", "Duty cycle control"] },
      { title: "Unit 4 — Inverters", topics: ["Single-phase half-bridge and full-bridge inverters", "3-phase inverters (180° and 120° conduction)", "PWM techniques: sinusoidal PWM, SPWM", "Harmonic reduction", "Voltage source vs current source inverters"] },
      { title: "Unit 5 — AC Voltage Controllers & Applications", topics: ["Single-phase and 3-phase AC controllers", "Cycloconverters", "Variable speed drives (VSD)", "UPS systems", "FACTS devices overview (SVC, STATCOM)"] },
    ],
  },
  "Control": {
    branch: "EEE",
    units: [
      { title: "Unit 1 — Mathematical Modelling", topics: ["Transfer function of electrical and mechanical systems", "Block diagram reduction", "Signal flow graphs, Mason's gain formula", "Analogies between electrical and mechanical systems"] },
      { title: "Unit 2 — Time Response Analysis", topics: ["Standard test inputs", "First and second order system responses", "Time domain specifications: tr, tp, Mp, ts", "Steady-state error and error constants", "Effect of adding poles and zeros"] },
      { title: "Unit 3 — Stability Analysis", topics: ["Characteristic equation, roots", "Routh-Hurwitz criterion and special cases", "Root locus: construction rules", "Root locus for gain and phase variations"] },
      { title: "Unit 4 — Frequency Response", topics: ["Bode plots: magnitude and phase", "Gain margin, phase margin", "Polar plots, Nyquist criterion", "Closed-loop frequency response", "M and N circles, Nichols chart"] },
      { title: "Unit 5 — Control System Design", topics: ["Lead, lag, lead-lag compensator design", "PID controller: tuning (Ziegler-Nichols)", "State variable analysis", "Controllability and observability (Kalman's tests)", "State feedback and pole placement"] },
    ],
  },
};

// Generate auto resources for units without hardcoded res data
function genUnitRes(subj, unit) {
  const topicHint = unit.title.replace(/^Unit [IVX\d]+ — /, "");
  const q = encodeURIComponent(subj + " " + topicHint);
  const nptelTerm = encodeURIComponent((window.DOUBT_DESK_CONFIG?.learn?.[subj] || subj) + " lecture");
  return {
    videos: [
      { label: "▶ YouTube: " + topicHint, url: "https://www.youtube.com/results?search_query=" + q + "+lecture" },
      { label: "▶ Neso Academy – " + subj + " Lectures", url: "https://www.youtube.com/results?search_query=Neso+Academy+" + encodeURIComponent(subj) },
      { label: "▶ NPTEL – " + subj + " Course", url: "https://nptel.ac.in/courses/search?q=" + nptelTerm },
    ],
    pdfs: [
      { label: "📄 GeeksforGeeks – " + topicHint, url: "https://www.geeksforgeeks.org/search/?q=" + encodeURIComponent(topicHint) },
      { label: "📄 Google: " + topicHint + " notes PDF", url: "https://www.google.com/search?q=" + encodeURIComponent(topicHint + " " + subj + " notes PDF") },
    ],
  };
}

const GATE_MCQ = {
  "DLD": [
    { q: "Minimum number of flip-flops needed for a MOD-10 counter?",
      opts: ["3","4","5","10"], ans: 1,
      trick: "Shortcut: n flip-flops give 2ⁿ states. Need 2ⁿ ≥ 10 → n=4 (2⁴=16). Always use ceil(log₂ M) for MOD-M." },
    { q: "Gray code of decimal 6 (binary 0110) is?",
      opts: ["0101","0110","0100","0111"], ans: 0,
      trick: "Shortcut: MSB stays same. Each Gray bit = XOR of that binary bit and the one to its left. 0,0⊕1=1,1⊕1=0,1⊕0=1 → 0101." },
    { q: "A NAND gate is called a universal gate because?",
      opts: ["It is fastest","It can implement AND/OR/NOT alone","It has 2 inputs","It uses least power"], ans: 1,
      trick: "NOT A = A NAND A. AND = NOT(A NAND B). OR = (NOT A) NAND (NOT B). So NAND alone → any Boolean function." },
    { q: "For a full adder, how many minterms does the carry-out have?",
      opts: ["2","3","4","8"], ans: 2,
      trick: "Cout=1 when ≥2 inputs are 1: (0,1,1),(1,0,1),(1,1,0),(1,1,1) → minterms 3,5,6,7 → 4 minterms." },
    { q: "XOR of 1101 and 1010 equals?",
      opts: ["0111","1111","0101","1001"], ans: 0,
      trick: "XOR column by column: 1⊕1=0, 1⊕0=1, 0⊕1=1, 1⊕0=1 → 0111. Shortcut: XOR flips bits wherever second operand has 1." },
  ],
  "DSP": [
    { q: "Nyquist sampling rate for a signal with maximum frequency 4 kHz?",
      opts: ["4 kHz","8 kHz","2 kHz","16 kHz"], ans: 1,
      trick: "fs ≥ 2·fmax. Always double the highest frequency. Below this rate → aliasing (frequencies overlap and distort)." },
    { q: "Z-transform of the unit impulse δ[n] is?",
      opts: ["z","1/z","1","z⁻¹"], ans: 2,
      trick: "X(z)=Σx[n]z⁻ⁿ. δ[n]=1 only at n=0 → X(z)=1·z⁰=1. Memorise: Z{δ[n]}=1, Z{u[n]}=z/(z−1)." },
    { q: "DFT complexity is O(N²). FFT reduces this to?",
      opts: ["O(N)","O(N log N)","O(log N)","O(N²/2)"], ans: 1,
      trick: "FFT uses divide-and-conquer: splits N-point DFT into two N/2 DFTs repeatedly → O(N log₂N). N=1024: DFT=1M ops, FFT=10K ops." },
    { q: "A discrete-time system with impulse response h[n] is BIBO stable if?",
      opts: ["h[n] is bounded","Σ|h[n]| < ∞","h[n]=0 for n<0","h[n] is periodic"], ans: 1,
      trick: "Absolute summability test. Memorise: BIBO → Bounded Input, Bounded Output. Pole inside unit circle in Z-domain ↔ stable." },
  ],
  "AEC": [
    { q: "Voltage gain of a Common-Emitter amplifier (with RC as collector resistance)?",
      opts: ["gm·RC","−gm·RC","RC/gm","−RC/gm"], ans: 1,
      trick: "Negative sign = 180° phase inversion (CE inverts signal). Magnitude = gm·RC. Larger RC or larger IC → higher gain." },
    { q: "Transconductance gm of a BJT biased at IC = 2.6 mA (VT = 26 mV)?",
      opts: ["0.1 mA/V","10 mA/V","100 mA/V","1 mA/V"], ans: 1,
      trick: "gm = IC/VT = 2.6 mA / 26 mV = 100 mA/V = 0.1 A/V. Shortcut: gm(mA/V) = IC(mA)/26." },
    { q: "In an ideal op-amp inverting amplifier, the voltage at the inverting input (V⁻) is?",
      opts: ["Vin","Vout","0 V (virtual ground)","Vcc/2"], ans: 2,
      trick: "Virtual ground: V⁻ = V⁺ = 0 V (non-inverting input grounded). 'Virtual' because no physical connection to ground — just forced by negative feedback." },
    { q: "MOSFET enters saturation region when?",
      opts: ["VGS > Vth only","VDS ≥ VGS − Vth","VDS < VGS − Vth","VGS = 0"], ans: 1,
      trick: "Three regions: Cut-off (VGS<Vth), Triode (VDS < VGS−Vth), Saturation (VDS ≥ VGS−Vth). Saturation → ID = (k/2)(VGS−Vth)² independent of VDS." },
  ],
  "CS": [
    { q: "Closed-loop transfer function with forward gain G(s) and feedback H(s) is?",
      opts: ["G·H","G/(1+G·H)","G·H/(1+G)","1/(1+G·H)"], ans: 1,
      trick: "Golden formula: T = G/(1+GH). Unity feedback → H=1 → T = G/(1+G). Denominator 1+GH = characteristic equation." },
    { q: "Root locus starts (K=0) at open-loop __ and ends (K=∞) at open-loop __?",
      opts: ["zeros, poles","poles, zeros","poles, poles","zeros, zeros"], ans: 1,
      trick: "Rule 1: Starts at OL poles, ends at OL zeros (or infinity if #poles > #zeros). The number of branches = number of open-loop poles." },
    { q: "For a Type-1 system with unit ramp input, steady-state error depends on?",
      opts: ["Position constant Kp","Velocity constant Kv","Acceleration constant Ka","Zero"], ans: 1,
      trick: "System type = number of open-loop integrators. Type 0→step error=1/(1+Kp), Type 1→ramp error=1/Kv, Type 2→parabola error=1/Ka." },
    { q: "Gain Margin (GM) > 0 dB and Phase Margin (PM) > 0° means the system is?",
      opts: ["Unstable","Marginally stable","Stable","Critically damped"], ans: 2,
      trick: "Both margins positive → stable. GM=0dB or PM=0° → marginally stable. Negative → unstable. Larger margins = more robust." },
  ],
  "CN": [
    { q: "Shannon's channel capacity theorem: C = ?",
      opts: ["B·log₂(SNR)","B·log₂(1+SNR)","B·SNR","log₂(1+SNR)"], ans: 1,
      trick: "1+SNR not SNR alone — the '+1' accounts for the noise power itself. Units: C in bps, B in Hz. Double SNR → add B·1 bps (diminishing returns)." },
    { q: "To detect AND correct 1-bit error, minimum Hamming distance required is?",
      opts: ["1","2","3","4"], ans: 2,
      trick: "To detect d errors: dmin ≥ d+1. To correct d errors: dmin ≥ 2d+1. For 1-bit correction: dmin ≥ 3." },
    { q: "A /28 subnet mask gives how many usable host addresses?",
      opts: ["28","16","14","30"], ans: 2,
      trick: "Host bits = 32−28 = 4. Total addresses = 2⁴ = 16. Usable = 16−2 = 14 (subtract network and broadcast). /29→6, /28→14, /27→30." },
    { q: "In Go-Back-N protocol with 3-bit sequence numbers, maximum window size is?",
      opts: ["8","7","4","6"], ans: 1,
      trick: "GBN window = 2ⁿ−1 (reserve 1 slot). Selective Repeat window = 2ⁿ/2 = 2ⁿ⁻¹. 3-bit GBN: 2³−1 = 7." },
  ],
  "CO & D": [
    { q: "A 5-stage pipeline processing 100 instructions. Speedup compared to non-pipelined?",
      opts: ["~5×","~20×","~100×","~500×"], ans: 0,
      trick: "Speedup = n·k / (k+n−1). n=100, k=5 → 500/104 ≈ 4.8 ≈ 5. For n>>k, speedup → k (number of stages). More stages = better for large programs." },
    { q: "Average memory access time with cache hit rate h=0.9, Tc=10ns, Tm=100ns?",
      opts: ["19ns","90ns","100ns","55ns"], ans: 0,
      trick: "T_avg = h·Tc + (1−h)·Tm = 0.9×10 + 0.1×100 = 9+10 = 19 ns. Always fast with good hit rate!" },
    { q: "Which hazard arises when instruction 2 reads a register written by instruction 1?",
      opts: ["Structural","Control (branch)","WAR","RAW (data hazard)"], ans: 3,
      trick: "RAW = Read After Write = true data dependency. WAR = Write After Read (anti-dependency). WAW = Write After Write (output). RAW is most common." },
    { q: "Direct-mapped cache with 16 blocks. Block number 35 maps to cache line?",
      opts: ["35","3","5","7"], ans: 1,
      trick: "Cache line = block# mod cache_size = 35 mod 16 = 3. Direct-mapped: each main memory block has exactly one possible cache location." },
  ],
  "DS & A": [
    { q: "Worst-case time complexity of QuickSort is O(?) and occurs when?",
      opts: ["O(n log n), random input","O(n²), already sorted input","O(n), pivot is median","O(log n), balanced partition"], ans: 1,
      trick: "Already sorted (or reverse-sorted) → pivot always picks min/max → partition into 0 and n−1 → n recursions of size n → O(n²). Use randomised pivot to avoid." },
    { q: "Height of a complete binary tree with n nodes is?",
      opts: ["n","n/2","⌊log₂ n⌋","⌈log₂ n⌉"], ans: 2,
      trick: "Complete binary tree: nodes fill level by level. At height h, nodes range from 2ʰ to 2ʰ⁺¹−1. So h = ⌊log₂ n⌋. Height 0 = root only (1 node)." },
    { q: "In an AVL tree, after insertion the tree is rebalanced if balance factor |BF| is?",
      opts: ["> 0","> 1","= 1","= 0"], ans: 1,
      trick: "BF = height(left) − height(right). Allowed: −1, 0, +1. If |BF| > 1 → rotate. 4 cases: LL→right rot, RR→left rot, LR→left-right rot, RL→right-left rot." },
    { q: "Dijkstra's shortest path algorithm does NOT work correctly when?",
      opts: ["Graph is directed","Graph has cycles","Graph has negative weight edges","Graph is disconnected"], ans: 2,
      trick: "Dijkstra assumes once a node is finalised, its distance can't improve. Negative edges can violate this. Use Bellman-Ford for negative weights (detects negative cycles too)." },
  ],
  "OS": [
    { q: "Which of the following is NOT one of the 4 necessary conditions for deadlock?",
      opts: ["Mutual exclusion","Hold and wait","Preemption allowed","Circular wait"], ans: 2,
      trick: "4 conditions: (1) Mutual exclusion (2) Hold & Wait (3) No preemption (4) Circular wait. 'Preemption allowed' actually PREVENTS deadlock — it's the opposite!" },
    { q: "CPU utilisation formula for n identical processes each spending fraction p in I/O?",
      opts: ["1−p","1−pⁿ","n(1−p)","1−n·p"], ans: 1,
      trick: "All n processes block simultaneously with probability pⁿ. So CPU utilisation = 1−pⁿ. More processes or less I/O wait → CPU stays busier." },
    { q: "Which page replacement algorithm has the lowest page fault rate but is unimplementable?",
      opts: ["FIFO","LRU","Optimal (OPT)","Clock"], ans: 2,
      trick: "OPT replaces the page not used for the longest time in future — requires future knowledge. Used only as a benchmark. LRU ≈ OPT in practice." },
    { q: "In semaphore operations wait(S) and signal(S), what does wait(S) do?",
      opts: ["S++","S−−; block if S<0","S=0","Check if S>0 only"], ans: 1,
      trick: "wait(S): S−−; if S<0 → block. signal(S): S++; if S≤0 → wake one blocked process. Binary semaphore (0/1) = mutex lock." },
  ],
  "DBMS": [
    { q: "A relation is in BCNF if for every non-trivial FD X→Y, X is a?",
      opts: ["Primary key","Foreign key","Candidate key","Super key"], ans: 3,
      trick: "BCNF: every determinant must be a super key (includes candidate key). BCNF is stronger than 3NF. If BCNF is lossless, prefer it; else use 3NF (preserves all FDs)." },
    { q: "3NF removes which type of dependency that 2NF does NOT address?",
      opts: ["Partial dependency","Multi-valued dependency","Transitive dependency","Join dependency"], ans: 2,
      trick: "2NF: removes partial FDs (non-key attr depends on part of composite PK). 3NF: removes transitive FDs (non-key → non-key → PK). BCNF: removes all non-super-key determinants." },
    { q: "Which SQL join returns ALL rows from both tables, with NULLs where no match?",
      opts: ["INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL OUTER JOIN"], ans: 3,
      trick: "INNER = only matching rows. LEFT = all left + matching right. RIGHT = all right + matching left. FULL OUTER = all rows from both, NULLs for missing matches." },
    { q: "In E-R model, a 'weak entity' is one that?",
      opts: ["Has no attributes","Cannot exist without a related strong entity","Has only one attribute","Is not connected to any other entity"], ans: 1,
      trick: "Weak entity has no key of its own — identified by partial key + owner entity. Example: 'Order-item' depends on 'Order'. Shown with double rectangle in ER diagram." },
  ],
  "Circuits": [
    { q: "Maximum power transfer to load RL occurs when RL equals?",
      opts: ["0","∞","Thevenin resistance RTh","2·RTh"], ans: 2,
      trick: "RL = RTh → Pmax = Vth²/(4·RTh). Efficiency = 50% at max power transfer. In communication circuits efficiency is sacrificed for maximum signal power." },
    { q: "In series RLC at resonance frequency f₀, what is the impedance?",
      opts: ["Zero","Minimum = R","Maximum = R","Infinite"], ans: 1,
      trick: "At resonance: XL = XC, they cancel. Z = R (minimum, purely resistive). f₀ = 1/(2π√LC). Q = ω₀L/R = bandwidth indicator." },
    { q: "RMS value of v(t) = Vm·sin(ωt) is?",
      opts: ["Vm","Vm/2","Vm/√2","Vm·√2"], ans: 2,
      trick: "RMS = peak/√2 ≈ 0.707·Vm for pure sinusoid. Vrms = 230 V mains → Vpeak = 230√2 ≈ 325 V. Average of sin²(ωt) over full cycle = 1/2." },
    { q: "Two 6Ω resistors in parallel give equivalent resistance of?",
      opts: ["12Ω","6Ω","3Ω","1Ω"], ans: 2,
      trick: "Parallel: 1/R = 1/R1 + 1/R2 = 1/6+1/6 = 2/6 → R=3Ω. Shortcut for equal resistors: R_eq = R/n (n resistors in parallel). Different: R1·R2/(R1+R2)." },
  ],
  "Maths": [
    { q: "Eigenvalues of matrix [[3,1],[1,3]] are?",
      opts: ["2, 4","3, 3","1, 5","0, 6"], ans: 0,
      trick: "Shortcut: λ = (trace ± √(trace²−4·det)) / 2. Trace=6, det=9−1=8. λ=(6±√(36−32))/2=(6±2)/2 → 4 and 2." },
    { q: "For mutually exclusive events A,B with P(A)=0.3, P(B)=0.4, P(A∪B)=?",
      opts: ["0.12","0.58","0.7","0.5"], ans: 2,
      trick: "Mutually exclusive → P(A∩B)=0. P(A∪B)=P(A)+P(B)−P(A∩B)=0.3+0.4−0=0.7. Independent ≠ mutually exclusive! Independent: P(A∩B)=P(A)·P(B)." },
    { q: "Rank of matrix [[1,2,3],[2,4,6],[3,6,9]] is?",
      opts: ["3","2","1","0"], ans: 2,
      trick: "Row 2 = 2×Row 1, Row 3 = 3×Row 1 → all rows are linearly dependent → only 1 independent row → Rank = 1. Rank = number of non-zero rows after row reduction." },
    { q: "Laplace transform of e^(at)·u(t) is?",
      opts: ["1/(s+a)","1/(s−a)","a/(s²+a²)","s/(s²+a²)"], ans: 1,
      trick: "L{e^(at)} = 1/(s−a), valid for s>a. Memorise: L{e^(−at)} = 1/(s+a). Frequency shifting: multiply by e^(at) in time → shift s by a in Laplace." },
  ],
  "Thermo": [
    { q: "Carnot efficiency of an engine operating between 600K (hot) and 300K (cold)?",
      opts: ["25%","33%","50%","75%"], ans: 2,
      trick: "η = 1 − TL/TH = 1 − 300/600 = 0.5 = 50%. Always use absolute Kelvin! η represents the theoretical maximum — no real engine can exceed this." },
    { q: "Which process occurs at constant temperature?",
      opts: ["Adiabatic","Isobaric","Isochoric","Isothermal"], ans: 3,
      trick: "Iso = same/constant. Thermal = temperature → Isothermal (T constant). Isobaric = pressure constant. Isochoric = volume constant. Adiabatic = no heat transfer (Q=0)." },
    { q: "Second law of thermodynamics: entropy of an isolated system?",
      opts: ["Always decreases","Remains constant","Always increases or stays same","Can be negative"], ans: 2,
      trick: "ΔS ≥ 0 for isolated system. Reversible process → ΔS=0. Irreversible → ΔS>0. Entropy = measure of disorder. Heat flows hot→cold (not reverse) because it increases entropy." },
  ],
  "SOM": [
    { q: "A steel rod (A = 100 mm², E = 200 GPa) carries axial load 50 kN. Stress = ?",
      opts: ["500 MPa","0.5 MPa","5 MPa","50 MPa"], ans: 0,
      trick: "σ = F/A = 50,000 N / 100 mm² = 500 N/mm² = 500 MPa. Keep units consistent: N and mm² gives MPa (=N/mm²) directly." },
    { q: "A beam bends under load. Bending stress is maximum at?",
      opts: ["Neutral axis","Centre of cross-section","Extreme fibre (top/bottom)","Mid-span"], ans: 2,
      trick: "σ = My/I. Stress proportional to y (distance from neutral axis). Max y = extreme fibre → max stress. At neutral axis y=0 → zero bending stress." },
    { q: "Euler's critical buckling load for a column with both ends pinned?",
      opts: ["π²EI/L²","4π²EI/L²","π²EI/4L²","EI/L²"], ans: 0,
      trick: "Both ends pinned → effective length Le = L → Pcr = π²EI/L². Both fixed → Le=L/2 → Pcr=4π²EI/L² (4× stronger!). One fixed one free → Le=2L (weakest)." },
  ],
  "EM": [
    { q: "Synchronous speed of a 4-pole induction motor on 50 Hz supply?",
      opts: ["750 rpm","1000 rpm","1500 rpm","3000 rpm"], ans: 2,
      trick: "Ns = 120f/P = 120×50/4 = 1500 rpm. Memorise: 2-pole=3000, 4-pole=1500, 6-pole=1000, 8-pole=750 rpm for 50 Hz." },
    { q: "A 3-phase induction motor runs at 1440 rpm with synchronous speed 1500 rpm. Slip = ?",
      opts: ["0.04 (4%)","0.06 (6%)","0.96 (96%)","0.1 (10%)"], ans: 0,
      trick: "s = (Ns−N)/Ns = (1500−1440)/1500 = 60/1500 = 0.04 = 4%. Full load slip is typically 3–8%. At synchronous speed s=0 (ideal, never reached)." },
    { q: "Transformer EMF equation: E = 4.44·f·N·Φm. What does Φm represent?",
      opts: ["Average flux","Peak (maximum) flux","RMS flux","Flux density"], ans: 1,
      trick: "Φm = peak flux in Webers. The 4.44 = π/√2 ≈ 4.44 (form factor × π for sinusoidal flux). Larger core area or flux → higher EMF for same turns and frequency." },
  ],
};


function renderResources() {
  const tabs = [["syllabus","📖 Syllabus"],["formulas","⚡ Formulas"],["mcq","🎯 GATE MCQs"],["pyq","📋 PYQ"],["placement","💼 Placement"],["plan","🗓 Study Plan"]];
  const tabBar = el("div", { class: "resource-tabs" },
    ...tabs.map(([id, label]) => el("button", {
      type: "button", class: "resource-tab" + (resourceTab === id ? " active" : ""),
      onclick: () => { resourceTab = id; formulaOpen = null; syllabusSubj = null; syllabusUnit = null; mcqSubj = null; render(); },
    }, label))
  );
  let content = [];

  if (resourceTab === "syllabus") {
    const branches = ["ECE","CSE","Civil","Mech","EEE"];
    const byBranch = {};
    for (const [subj, data] of Object.entries(SYLLABUS)) {
      (byBranch[data.branch] ||= []).push(subj);
    }
    content = [
      el("p", { class: "hint" }, "RGUKT AP unit-wise syllabus. Tap a subject, then tap any unit to see topics and auto-linked textbook chapters, videos, and notes."),
      ...branches.map(branch => {
        const subjects = byBranch[branch] || [];
        if (!subjects.length) return null;
        return el("div", { class: "syl-branch" },
          el("div", { class: "label" }, branch + " Branch"),
          el("div", { class: "formula-subj-list" },
            ...subjects.map(s => {
              const data = SYLLABUS[s];
              const isOpen = syllabusSubj === s;
              return el("div", {},
                el("button", { type: "button", class: "formula-subj-btn", ...colorAttrs(s, "doubts"),
                  onclick: () => { syllabusSubj = isOpen ? null : s; syllabusUnit = null; render(); },
                }, el("span", {}, s), el("span", { class: "formula-count" }, data.units.length + " units"), el("span", { class: "formula-arrow" }, isOpen ? "▲" : "▼")),
                isOpen && el("div", { class: "syl-units" },
                  data.code && el("div", { class: "syl-meta" },
                    el("span", { class: "syl-code" }, data.code),
                    el("span", { class: "syl-credits" }, data.credits)),
                  ...data.units.map((u, ui) => {
                    const ukey = s + "-" + ui;
                    const uOpen = syllabusUnit === ukey;
                    const res = u.res || genUnitRes(s, u);
                    return el("div", { class: "syl-unit" },
                      el("button", { type: "button", class: "syl-unit-btn" + (uOpen ? " open" : ""),
                        onclick: () => { syllabusUnit = uOpen ? null : ukey; render(); }
                      },
                        el("span", { class: "syl-unit-num" }, "U" + (ui + 1)),
                        el("span", { class: "syl-unit-name" }, u.title.replace(/^Unit [IVX\d]+ — /, "")),
                        u.hours && el("span", { class: "syl-hours" }, u.hours),
                        el("span", { class: "syl-unit-arr" }, uOpen ? "▲" : "▼")
                      ),
                      uOpen && el("div", { class: "syl-unit-body" },
                        el("ul", { class: "syl-topics" }, ...u.topics.map(t => el("li", {}, t))),
                        el("div", { class: "unit-res" },
                          res.chapters && res.chapters.length && el("div", { class: "unit-res-section" },
                            el("div", { class: "unit-res-label" }, "📚 Textbook Chapters"),
                            el("div", { class: "unit-res-items" }, ...res.chapters.map(c =>
                              el("div", { class: "unit-res-item" },
                                el("strong", { class: "unit-res-book" }, c.book),
                                el("span", {}, " — " + c.ref)
                              )
                            ))
                          ),
                          el("div", { class: "unit-res-section" },
                            el("div", { class: "unit-res-label" }, "🎬 Video Resources"),
                            el("div", { class: "unit-res-btns" }, ...res.videos.map(v =>
                              el("a", { href: v.url, target: "_blank", rel: "noopener noreferrer", class: "unit-res-btn yt" }, v.label)
                            ))
                          ),
                          el("div", { class: "unit-res-section" },
                            el("div", { class: "unit-res-label" }, "📄 Notes & PDFs"),
                            el("div", { class: "unit-res-btns" }, ...res.pdfs.map(p =>
                              el("a", { href: p.url, target: "_blank", rel: "noopener noreferrer", class: "unit-res-btn pdf" }, p.label)
                            ))
                          )
                        )
                      )
                    );
                  }),
                  data.textbooks && el("div", { class: "syl-resources" },
                    el("div", { class: "syl-res-label" }, "📚 Text Books"),
                    el("ol", { class: "syl-topics" }, ...data.textbooks.map(b => el("li", {}, b)))),
                  data.refbooks && el("div", { class: "syl-resources" },
                    el("div", { class: "syl-res-label" }, "📖 Reference Books"),
                    el("ol", { class: "syl-topics" }, ...data.refbooks.map(b => el("li", {}, b)))),
                  data.webres && el("div", { class: "syl-resources" },
                    el("div", { class: "syl-res-label" }, "🌐 NPTEL / Web Resources"),
                    el("ul", { class: "syl-topics" }, ...data.webres.map(w => el("li", {},
                      el("a", { href: w.url, target: "_blank", rel: "noopener noreferrer", class: "syl-link" }, w.label)
                    ))))
                )
              );
            })
          )
        );
      }).filter(Boolean),
    ];
  } else if (resourceTab === "formulas") {
    const subjects = Object.keys(FORMULAS);
    content = [
      el("p", { class: "hint" }, "Tap any subject to see key formulas. Great for quick revision before exams."),
      el("div", { class: "formula-subj-list" },
        ...subjects.map(s => {
          const fmls = FORMULAS[s];
          const isOpen = formulaOpen === s;
          return el("div", {},
            el("button", { type: "button", class: "formula-subj-btn", ...colorAttrs(s, "doubts"),
              onclick: () => { formulaOpen = isOpen ? null : s; render(); },
            }, el("span", {}, s), el("span", { class: "formula-count" }, fmls.length + " formulas"), el("span", { class: "formula-arrow" }, isOpen ? "▲" : "▼")),
            isOpen && el("div", { class: "formula-cards" },
              ...fmls.map(([name, formula]) => el("div", { class: "formula-card" },
                el("strong", { class: "formula-name" }, name),
                el("pre", { class: "formula-body" }, formula)
              ))
            )
          );
        })
      ),
    ];
  } else if (resourceTab === "mcq") {
    const mcqSubjects = Object.keys(GATE_MCQ);
    const activeS = mcqSubj && GATE_MCQ[mcqSubj] ? mcqSubj : null;
    content = [
      el("p", { class: "hint" }, "Classic GATE-style objective questions with shortcut tricks. Tap a subject, choose your answer, then reveal the trick."),
      el("div", { class: "formula-subj-list" },
        ...mcqSubjects.map(s => {
          const qs = GATE_MCQ[s];
          const isOpen = activeS === s;
          return el("div", {},
            el("button", { type: "button", class: "formula-subj-btn", ...colorAttrs(s, "doubts"),
              onclick: () => { mcqSubj = isOpen ? null : s; render(); },
            }, el("span", {}, s), el("span", { class: "formula-count" }, qs.length + " questions"), el("span", { class: "formula-arrow" }, isOpen ? "▲" : "▼")),
            isOpen && el("div", { class: "mcq-list" },
              ...qs.map((item, idx) => {
                const key = s + "-" + idx;
                const chosen = mcqRevealed[key];
                return el("div", { class: "mcq-card" + (chosen !== undefined ? " mcq-answered" : "") },
                  el("p", { class: "mcq-q" }, "Q" + (idx+1) + ". " + item.q),
                  el("div", { class: "mcq-opts" },
                    ...item.opts.map((opt, oi) => {
                      let cls = "mcq-opt";
                      if (chosen !== undefined) {
                        if (oi === item.ans) cls += " mcq-correct";
                        else if (oi === chosen) cls += " mcq-wrong";
                      }
                      return el("button", { type: "button", class: cls,
                        onclick: () => { mcqRevealed = { ...mcqRevealed, [key]: oi }; render(); },
                        disabled: chosen !== undefined,
                      }, String.fromCharCode(65+oi) + ") " + opt);
                    })
                  ),
                  chosen !== undefined && el("div", { class: "mcq-trick" },
                    el("span", { class: "mcq-trick-label" }, chosen === item.ans ? "✅ Correct! " : "❌ Wrong. "),
                    el("pre", { class: "formula-body" }, item.trick)
                  )
                );
              })
            )
          );
        })
      ),
    ];
  } else if (resourceTab === "pyq") {
    content = [
      el("p", { class: "hint" }, "Find previous year questions for GATE and university exams — subject by subject."),
      el("div", { class: "learn" }, ...SUBJECTS.map(s => el("div", { class: "learn-card", ...colorAttrs(s, "doubts") },
        el("span", { class: "tag", ...colorAttrs(s, "doubts") }, s),
        el("strong", {}, learnTerm(s)),
        el("div", { class: "rowbtns" },
          outLink(PYQ_SEARCH(s), "GATE PYQ", "linkbtn"),
          outLink(UNIV_SEARCH(s), "JNTUK", "linkbtn"),
          outLink(GFG_SEARCH(s), "GFG", "linkbtn"))))),
    ];
  } else if (resourceTab === "placement") {
    content = [
      el("p", { class: "hint" }, "Curated resources for campus placements — coding practice, core subjects and aptitude."),
      el("div", { class: "placement-grid" },
        ...PLACEMENT_RES.map(p => el("a", { class: "placement-card", href: p.url, target: "_blank", rel: "noopener noreferrer" },
          el("span", { class: "placement-icon" }, p.icon),
          el("strong", {}, p.name),
          el("small", {}, p.hint)
        ))
      ),
    ];
  } else if (resourceTab === "plan") {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exams = (CFG.exams || []).map(x => {
      const days = Math.round((new Date(x.date + "T00:00:00") - today) / 86400000);
      return { ...x, days };
    }).filter(x => x.days >= 0).sort((a, b) => a.days - b.days);
    const subjCount = SUBJECTS.length;
    const examItems = exams.length ? exams.map(exam => {
      const perDay = exam.days > 0 ? Math.ceil(subjCount / exam.days) : subjCount;
      const cls = "plan-item " + (exam.days <= 3 ? "plan-urgent" : exam.days <= 7 ? "plan-warn" : "plan-ok");
      return el("div", { class: cls },
        el("div", { class: "plan-name" }, "⏳ " + exam.name),
        el("div", { class: "plan-days" }, exam.days === 0 ? "Today" : exam.days + " days"),
        el("div", { class: "plan-tip" }, exam.days > 0
          ? "Cover ~" + perDay + " subject" + (perDay > 1 ? "s" : "") + " per day to finish in time"
          : "Focus on revision + solve PYQs today")
      );
    }) : [el("p", { class: "hint" }, "No exam dates configured yet. Ask your teacher to add them in config.js — your personalised countdown and daily plan will appear here.")];

    const tips = [
      ["🍅","Pomodoro","25 min study + 5 min break. After 4 rounds take 20 min. Keeps focus sharp."],
      ["📖","Active Recall","Close the book and write what you remember. Far better than re-reading."],
      ["🔁","Spaced Repetition","Review: Day 1 → Day 3 → Day 7 → Day 14 for long-term memory."],
      ["✍️","Solve PYQs","Past questions repeat in GATE and university exams. Start with 5-year papers."],
      ["🤝","Teach Others","Post a doubt or answer one here. Teaching a concept locks in understanding."],
      ["🎯","High-weightage First","In GATE: Engineering Maths, Networks, OS, DBMS carry the most marks."],
    ];
    content = [
      el("div", { class: "label" }, "📅 Exam Countdown"),
      ...examItems,
      el("div", { class: "label" }, "💡 Study Tips"),
      el("div", { class: "study-tips" }, ...tips.map(([icon, name, text]) =>
        el("div", { class: "study-tip" }, el("span", { class: "tip-icon" }, icon),
          el("div", {}, el("strong", {}, name), el("p", { class: "hint" }, text)))
      )),
    ];
  }

  return [
    el("h2", {}, "📖 Study Tools"),
    tabBar,
    ...content,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}

// ---------- rotating captions ----------
function startCaptions() {
  const box = $("tagline");
  let i = 0;
  box.textContent = CAPTIONS[0];
  if (CAPTIONS.length < 2) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % CAPTIONS.length;
    if (still) { box.textContent = CAPTIONS[i]; return; }
    box.classList.add("swap");
    setTimeout(() => { box.textContent = CAPTIONS[i]; box.classList.remove("swap"); }, 350);
  }, 5000);
}

// ---------- exam countdown ----------
function renderExams() {
  const box = $("exams");
  if (!box) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const items = (CFG.exams || []).map(x => ({ name: x.name, days: Math.round((new Date(x.date + "T00:00:00") - today) / 86400000) }))
    .filter(x => x.name && x.days >= 0).sort((a, b) => a.days - b.days).slice(0, 4);
  box.hidden = !items.length;
  box.replaceChildren(...items.map(x => el("span", { class: "exam" + (x.days <= 3 ? " soon" : "") }, "⏳ " + x.name + " " + (x.days === 0 ? "today" : x.days === 1 ? "tomorrow" : "in " + x.days + " days"))));
}

function renderGateResourceDetail(res) {
  // 100% FREE course catalog — no subscription, no payment
  const C = {
    "IIT Bombay": [
      { name:"Engineering Mathematics",   branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Engineering+Mathematics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
      { name:"Data Structures & Algorithms", branch:"CSE",   icon:"🌳", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Data+Structures+Algorithms+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=data+structures+algorithms" },
      { name:"Operating Systems",         branch:"CSE",       icon:"💻", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Operating+Systems+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"Computer Networks",         branch:"CSE",       icon:"🌐", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Computer+Networks+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Digital Circuits",          branch:"ECE",       icon:"⚡", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Digital+Circuits+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=digital+circuits" },
      { name:"Signals & Systems",         branch:"ECE",       icon:"📡", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Signals+Systems+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=signals+systems" },
      { name:"Control Systems",           branch:"ECE/EEE",   icon:"🔄", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Control+Systems+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=control+systems" },
      { name:"Fluid Mechanics",           branch:"Civil/Mech",icon:"💧", yt:"https://www.youtube.com/results?search_query=IIT+Bombay+Fluid+Mechanics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=fluid+mechanics" },
    ],
    "IIT Delhi": [
      { name:"Engineering Mathematics",   branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=IIT+Delhi+Engineering+Mathematics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
      { name:"Algorithms",                branch:"CSE",       icon:"🧮", yt:"https://www.youtube.com/results?search_query=IIT+Delhi+Algorithms+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=algorithms" },
      { name:"Theory of Computation",     branch:"CSE",       icon:"🤖", yt:"https://www.youtube.com/results?search_query=IIT+Delhi+Theory+Computation+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
      { name:"Digital Electronics",       branch:"ECE",       icon:"⚡", yt:"https://www.youtube.com/results?search_query=IIT+Delhi+Digital+Electronics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=digital+electronics" },
      { name:"Power Systems",             branch:"EEE",       icon:"🔌", yt:"https://www.youtube.com/results?search_query=IIT+Delhi+Power+Systems+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=power+systems" },
      { name:"Structural Analysis",       branch:"Civil",     icon:"🏗️", yt:"https://www.youtube.com/results?search_query=IIT+Delhi+Structural+Analysis+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=structural+analysis" },
    ],
    "IIT Madras": [
      { name:"Engineering Mathematics",   branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=IIT+Madras+Engineering+Mathematics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
      { name:"Operating Systems",         branch:"CSE",       icon:"💻", yt:"https://www.youtube.com/results?search_query=IIT+Madras+Operating+Systems+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"Computer Architecture",     branch:"CSE",       icon:"🏛", yt:"https://www.youtube.com/results?search_query=IIT+Madras+Computer+Architecture+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=computer+architecture" },
      { name:"Signals & Systems",         branch:"ECE",       icon:"📡", yt:"https://www.youtube.com/results?search_query=IIT+Madras+Signals+Systems+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=signals+systems" },
      { name:"VLSI Design",               branch:"ECE",       icon:"🔬", yt:"https://www.youtube.com/results?search_query=IIT+Madras+VLSI+Design+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=VLSI+design" },
      { name:"Thermodynamics",            branch:"Mech",      icon:"🌡️", yt:"https://www.youtube.com/results?search_query=IIT+Madras+Thermodynamics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=thermodynamics" },
      { name:"Soil Mechanics",            branch:"Civil",     icon:"🪨", yt:"https://www.youtube.com/results?search_query=IIT+Madras+Soil+Mechanics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=soil+mechanics" },
    ],
    "IIT Kanpur": [
      { name:"Engineering Mathematics",   branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=IIT+Kanpur+Engineering+Mathematics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
      { name:"Algorithms",                branch:"CSE",       icon:"🧮", yt:"https://www.youtube.com/results?search_query=IIT+Kanpur+Algorithms+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=algorithms" },
      { name:"Compilers",                 branch:"CSE",       icon:"⚙️", yt:"https://www.youtube.com/results?search_query=IIT+Kanpur+Compiler+Design+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=compiler+design" },
      { name:"Electromagnetics",          branch:"ECE",       icon:"🧲", yt:"https://www.youtube.com/results?search_query=IIT+Kanpur+Electromagnetics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=electromagnetic+theory" },
      { name:"Heat Transfer",             branch:"Mech",      icon:"🔥", yt:"https://www.youtube.com/results?search_query=IIT+Kanpur+Heat+Transfer+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=heat+transfer" },
      { name:"RCC Structures",            branch:"Civil",     icon:"🏗️", yt:"https://www.youtube.com/results?search_query=IIT+Kanpur+RCC+Structures+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=RCC+design" },
    ],
    "IIT Kharagpur": [
      { name:"Engineering Mathematics",   branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=IIT+Kharagpur+Engineering+Mathematics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
      { name:"Database Management",       branch:"CSE",       icon:"🗄️", yt:"https://www.youtube.com/results?search_query=IIT+Kharagpur+Database+Management+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Computer Networks",         branch:"CSE",       icon:"🌐", yt:"https://www.youtube.com/results?search_query=IIT+Kharagpur+Computer+Networks+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Network Theory",            branch:"EEE/ECE",   icon:"🔌", yt:"https://www.youtube.com/results?search_query=IIT+Kharagpur+Network+Theory+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=network+theory" },
      { name:"Power Electronics",         branch:"EEE",       icon:"⚡", yt:"https://www.youtube.com/results?search_query=IIT+Kharagpur+Power+Electronics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=power+electronics" },
      { name:"Strength of Materials",     branch:"Civil/Mech",icon:"🔩", yt:"https://www.youtube.com/results?search_query=IIT+Kharagpur+Strength+Materials+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=strength+of+materials" },
    ],
    "IIT Roorkee": [
      { name:"Discrete Mathematics",      branch:"CSE",       icon:"🔢", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Discrete+Mathematics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=discrete+mathematics" },
      { name:"Computer Networks",         branch:"CSE",       icon:"🌐", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Computer+Networks+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Digital Signal Processing", branch:"ECE",       icon:"📊", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Digital+Signal+Processing+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=digital+signal+processing" },
      { name:"Electrical Machines",       branch:"EEE",       icon:"⚙️", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Electrical+Machines+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=electrical+machines" },
      { name:"Water Resources",           branch:"Civil",     icon:"💧", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Water+Resources+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=water+resources+engineering" },
      { name:"Fluid Mechanics",           branch:"Civil/Mech",icon:"🌊", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Fluid+Mechanics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=fluid+mechanics" },
    ],
    "IIT Hyderabad": [
      { name:"Machine Learning",          branch:"CSE",       icon:"🤖", yt:"https://www.youtube.com/results?search_query=IIT+Hyderabad+Machine+Learning+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=machine+learning" },
      { name:"Operating Systems",         branch:"CSE",       icon:"💻", yt:"https://www.youtube.com/results?search_query=IIT+Hyderabad+Operating+Systems+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"Digital Communications",    branch:"ECE",       icon:"📡", yt:"https://www.youtube.com/results?search_query=IIT+Hyderabad+Digital+Communications+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=digital+communications" },
      { name:"VLSI Design",               branch:"ECE",       icon:"🔬", yt:"https://www.youtube.com/results?search_query=IIT+Hyderabad+VLSI+NPTEL", pdf:"https://nptel.ac.in/courses?search=VLSI+design" },
      { name:"Microprocessors",           branch:"ECE/EEE",   icon:"🖥️", yt:"https://www.youtube.com/results?search_query=IIT+Hyderabad+Microprocessors+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=microprocessors" },
    ],
    "NIT Warangal": [
      { name:"Database Management",       branch:"CSE",       icon:"🗄️", yt:"https://www.youtube.com/results?search_query=NIT+Warangal+Database+Management+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Engineering Mathematics",   branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=NIT+Warangal+Engineering+Mathematics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
      { name:"Electrical Machines",       branch:"EEE",       icon:"⚙️", yt:"https://www.youtube.com/results?search_query=NIT+Warangal+Electrical+Machines+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=electrical+machines" },
      { name:"Fluid Mechanics",           branch:"Civil/Mech",icon:"💧", yt:"https://www.youtube.com/results?search_query=NIT+Warangal+Fluid+Mechanics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=fluid+mechanics" },
      { name:"Structural Analysis",       branch:"Civil",     icon:"🏗️", yt:"https://www.youtube.com/results?search_query=NIT+Warangal+Structural+Analysis+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=structural+analysis" },
    ],
    "NIT Trichy": [
      { name:"Analog Circuits",           branch:"ECE",       icon:"🔌", yt:"https://www.youtube.com/results?search_query=NIT+Trichy+Analog+Circuits+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=analog+circuits" },
      { name:"Heat & Mass Transfer",      branch:"Mech",      icon:"🌡️", yt:"https://www.youtube.com/results?search_query=NIT+Trichy+Heat+Mass+Transfer+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=heat+mass+transfer" },
      { name:"Engineering Mechanics",     branch:"Civil/Mech",icon:"🔩", yt:"https://www.youtube.com/results?search_query=NIT+Trichy+Engineering+Mechanics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mechanics" },
      { name:"Digital Electronics",       branch:"ECE",       icon:"⚡", yt:"https://www.youtube.com/results?search_query=NIT+Trichy+Digital+Electronics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=digital+electronics" },
      { name:"Fluid Mechanics",           branch:"Civil",     icon:"💧", yt:"https://www.youtube.com/results?search_query=NIT+Trichy+Fluid+Mechanics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=fluid+mechanics" },
    ],
    "IISc Bangalore": [
      { name:"Advanced Algorithms",       branch:"CSE",       icon:"🧮", yt:"https://www.youtube.com/results?search_query=IISc+Bangalore+Algorithms+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=advanced+algorithms" },
      { name:"RF & Microwave Engineering",branch:"ECE",       icon:"📻", yt:"https://www.youtube.com/results?search_query=IISc+RF+Microwave+Engineering+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=RF+microwave" },
      { name:"Advanced Structural Analysis",branch:"Civil",   icon:"🏗️", yt:"https://www.youtube.com/results?search_query=IISc+Structural+Analysis+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=structural+analysis" },
      { name:"Power Electronics",         branch:"EEE",       icon:"⚡", yt:"https://www.youtube.com/results?search_query=IISc+Power+Electronics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=power+electronics" },
      { name:"Probability & Statistics",  branch:"All",       icon:"📊", yt:"https://www.youtube.com/results?search_query=IISc+Probability+Statistics+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=probability+statistics" },
    ],
    "MIT OpenCourseWare": [
      { name:"6.006 — Algorithms",        branch:"CSE",       icon:"🧮", yt:"https://www.youtube.com/results?search_query=MIT+6.006+Introduction+to+Algorithms", pdf:"https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/" },
      { name:"6.002 — Circuits",          branch:"ECE/EEE",   icon:"🔌", yt:"https://www.youtube.com/results?search_query=MIT+6.002+Circuits+Electronics", pdf:"https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/" },
      { name:"6.003 — Signals & Systems", branch:"ECE",       icon:"📡", yt:"https://www.youtube.com/results?search_query=MIT+6.003+Signals+Systems", pdf:"https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/" },
      { name:"18.06 — Linear Algebra",    branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=MIT+18.06+Linear+Algebra+Gilbert+Strang", pdf:"https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/" },
      { name:"1.050 — Solid Mechanics",   branch:"Civil/Mech",icon:"🔩", yt:"https://www.youtube.com/results?search_query=MIT+Solid+Mechanics+1.050", pdf:"https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/" },
      { name:"2.005 — Thermodynamics",    branch:"Mech",      icon:"🌡️", yt:"https://www.youtube.com/results?search_query=MIT+Thermodynamics+2.005", pdf:"https://ocw.mit.edu/courses/2-005-thermal-fluids-engineering-i-fall-2003/" },
    ],
    "MIT YouTube": [
      { name:"Linear Algebra (Gilbert Strang)",branch:"All",  icon:"📐", yt:"https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8", pdf:"https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/" },
      { name:"Algorithms (Erik Demaine)",  branch:"CSE",      icon:"🧮", yt:"https://www.youtube.com/results?search_query=MIT+6.006+algorithms+lectures+2011", pdf:"https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/" },
      { name:"Circuits & Electronics",     branch:"ECE",      icon:"🔌", yt:"https://www.youtube.com/results?search_query=MIT+6.002+circuits+electronics+lectures", pdf:"https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/" },
      { name:"Probability (John Tsitsiklis)",branch:"All",    icon:"📊", yt:"https://www.youtube.com/results?search_query=MIT+6.041+probability+Tsitsiklis", pdf:"https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-fall-2010/" },
      { name:"Fluid Dynamics",             branch:"Civil/Mech",icon:"💧", yt:"https://www.youtube.com/results?search_query=MIT+fluid+dynamics+lecture", pdf:"https://ocw.mit.edu/courses/2-20-marine-hydrodynamics-13-021-spring-2005/" },
    ],
    "Stanford Online": [
      { name:"Algorithms (Roughgarden)",   branch:"CSE",      icon:"🧮", yt:"https://www.youtube.com/results?search_query=Stanford+Tim+Roughgarden+Algorithms", pdf:"https://online.stanford.edu/courses/soe-ycsalgorithms1-algorithms-design-and-analysis-part-1" },
      { name:"Machine Learning (Ng)",      branch:"CSE",      icon:"🤖", yt:"https://www.youtube.com/results?search_query=Andrew+Ng+Machine+Learning+Stanford+CS229", pdf:"https://cs229.stanford.edu/materials.html" },
      { name:"CS101 — Intro to CS",        branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/results?search_query=Stanford+CS101+Introduction+Computer+Science", pdf:"https://online.stanford.edu/free-courses" },
      { name:"Compilers (Aiken)",          branch:"CSE",      icon:"⚙️", yt:"https://www.youtube.com/results?search_query=Stanford+CS143+Compilers+Alex+Aiken", pdf:"https://web.stanford.edu/class/cs143/" },
    ],
    "Coursera (Audit)": [
      { name:"Algorithms (Stanford) — FREE",branch:"CSE",     icon:"🧮", yt:"https://www.youtube.com/results?search_query=Stanford+Algorithms+Specialization+Tim+Roughgarden", pdf:"https://www.coursera.org/specializations/algorithms" },
      { name:"Data Structures (UCSD) — FREE",branch:"CSE",    icon:"🌳", yt:"https://www.youtube.com/results?search_query=UCSD+Data+Structures+Coursera", pdf:"https://www.coursera.org/specializations/data-structures-algorithms" },
      { name:"Digital Systems (UCSD) — FREE",branch:"ECE",    icon:"⚡", yt:"https://www.youtube.com/results?search_query=UCSD+digital+systems+Coursera", pdf:"https://www.coursera.org/learn/digital-systems" },
      { name:"Linear Algebra (Imperial) — FREE",branch:"All", icon:"📐", yt:"https://www.youtube.com/results?search_query=Imperial+College+Linear+Algebra+Coursera", pdf:"https://www.coursera.org/specializations/mathematics-machine-learning" },
    ],
    "edX Free Courses": [
      { name:"CS50 — Harvard Intro CS (FREE)",branch:"CSE",   icon:"💻", yt:"https://www.youtube.com/results?search_query=CS50+Harvard+Introduction+Computer+Science+2023", pdf:"https://cs50.harvard.edu/x/" },
      { name:"Circuits & Electronics (MIT) — FREE",branch:"ECE",icon:"🔌",yt:"https://www.youtube.com/results?search_query=MIT+6.002+circuits+electronics+edX", pdf:"https://www.edx.org/course/circuits-and-electronics-1-basic-circuit-analysis" },
      { name:"Engineering Maths (IITR) — FREE",branch:"All", icon:"📐", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Engineering+Mathematics+SWAYAM", pdf:"https://www.edx.org/search?q=engineering+mathematics" },
      { name:"Thermodynamics (UT Austin) — FREE",branch:"Mech",icon:"🌡️",yt:"https://www.youtube.com/results?search_query=UT+Austin+Thermodynamics+edX", pdf:"https://www.edx.org/search?q=thermodynamics" },
    ],
    "Khan Academy": [
      { name:"Linear Algebra",             branch:"All",      icon:"📐", yt:"https://www.youtube.com/@khanacademy/search?query=linear+algebra", pdf:"https://www.khanacademy.org/math/linear-algebra" },
      { name:"Calculus 1, 2 & 3",          branch:"All",      icon:"∫",  yt:"https://www.youtube.com/@khanacademy/search?query=calculus", pdf:"https://www.khanacademy.org/math/calculus-1" },
      { name:"Differential Equations",     branch:"All",      icon:"📊", yt:"https://www.youtube.com/@khanacademy/search?query=differential+equations", pdf:"https://www.khanacademy.org/math/differential-equations" },
      { name:"Electric Circuits",          branch:"ECE/EEE",  icon:"🔌", yt:"https://www.youtube.com/@khanacademy/search?query=electrical+engineering+circuits", pdf:"https://www.khanacademy.org/science/electrical-engineering" },
      { name:"Physics — Mechanics",        branch:"All",      icon:"⚙️", yt:"https://www.youtube.com/@khanacademy/search?query=mechanics+physics", pdf:"https://www.khanacademy.org/science/physics" },
      { name:"Statistics & Probability",   branch:"All",      icon:"📊", yt:"https://www.youtube.com/@khanacademy/search?query=probability+statistics", pdf:"https://www.khanacademy.org/math/statistics-probability" },
    ],
    "Gate Smashers": [
      { name:"Operating Systems (Full)",   branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@GateSmashersFull/search?query=operating+systems", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"DBMS (Full)",                branch:"CSE",      icon:"🗄️", yt:"https://www.youtube.com/@GateSmashersFull/search?query=DBMS", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Computer Networks (Full)",   branch:"CSE",      icon:"🌐", yt:"https://www.youtube.com/@GateSmashersFull/search?query=computer+networks", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Theory of Computation",      branch:"CSE",      icon:"🤖", yt:"https://www.youtube.com/@GateSmashersFull/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
      { name:"Algorithms & Data Structures",branch:"CSE",     icon:"🌳", yt:"https://www.youtube.com/@GateSmashersFull/search?query=data+structures+algorithms", pdf:"https://nptel.ac.in/courses?searchQuery=data+structures+algorithms" },
      { name:"Computer Organisation (CO)", branch:"CSE",      icon:"🏛", yt:"https://www.youtube.com/@GateSmashersFull/search?query=computer+organisation", pdf:"https://nptel.ac.in/courses?searchQuery=computer+organisation" },
      { name:"Discrete Mathematics",       branch:"CSE",      icon:"🔢", yt:"https://www.youtube.com/@GateSmashersFull/search?query=discrete+mathematics", pdf:"https://nptel.ac.in/courses?searchQuery=discrete+mathematics" },
      { name:"Digital Electronics",        branch:"ECE/CSE",  icon:"⚡", yt:"https://www.youtube.com/@GateSmashersFull/search?query=digital+electronics", pdf:"https://nptel.ac.in/courses?searchQuery=digital+electronics" },
    ],
    "Neso Academy": [
      { name:"Digital Electronics",        branch:"ECE/CSE",  icon:"⚡", yt:"https://www.youtube.com/@NesoAcademy/search?query=digital+electronics", pdf:"https://nptel.ac.in/courses?searchQuery=digital+electronics" },
      { name:"Signals & Systems",          branch:"ECE",      icon:"📡", yt:"https://www.youtube.com/@NesoAcademy/search?query=signals+and+systems", pdf:"https://nptel.ac.in/courses?searchQuery=signals+systems" },
      { name:"Computer Networks",          branch:"CSE",      icon:"🌐", yt:"https://www.youtube.com/@NesoAcademy/search?query=computer+networks", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Analog Circuits",            branch:"ECE",      icon:"🔌", yt:"https://www.youtube.com/@NesoAcademy/search?query=analog+circuits", pdf:"https://nptel.ac.in/courses?searchQuery=analog+circuits" },
      { name:"C Programming",              branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@NesoAcademy/search?query=C+programming", pdf:"https://nptel.ac.in/courses?searchQuery=programming+in+C" },
      { name:"Communication Systems",      branch:"ECE",      icon:"📻", yt:"https://www.youtube.com/@NesoAcademy/search?query=communication+systems", pdf:"https://nptel.ac.in/courses?searchQuery=communication+systems" },
    ],
    "NPTEL Official": [
      { name:"All CSE Courses",            branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@nptel/search?query=computer+science", pdf:"https://nptel.ac.in/courses?disciplineId=106" },
      { name:"All ECE Courses",            branch:"ECE",      icon:"📡", yt:"https://www.youtube.com/@nptel/search?query=electronics+communication", pdf:"https://nptel.ac.in/courses?disciplineId=117" },
      { name:"All EEE Courses",            branch:"EEE",      icon:"⚡", yt:"https://www.youtube.com/@nptel/search?query=electrical+engineering", pdf:"https://nptel.ac.in/courses?disciplineId=108" },
      { name:"All Civil Courses",          branch:"Civil",    icon:"🏗️", yt:"https://www.youtube.com/@nptel/search?query=civil+engineering", pdf:"https://nptel.ac.in/courses?disciplineId=105" },
      { name:"All Mech Courses",           branch:"Mech",     icon:"⚙️", yt:"https://www.youtube.com/@nptel/search?query=mechanical+engineering", pdf:"https://nptel.ac.in/courses?disciplineId=112" },
      { name:"Engineering Mathematics",    branch:"All",      icon:"📐", yt:"https://www.youtube.com/@nptel/search?query=engineering+mathematics", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
    ],
    "Knowledge Gate": [
      { name:"DBMS — Full Course",          branch:"CSE",     icon:"🗄️", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=DBMS", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Operating Systems — Full",    branch:"CSE",     icon:"💻", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=operating+systems", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"Computer Networks — Full",    branch:"CSE",     icon:"🌐", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=computer+networks", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Theory of Computation",       branch:"CSE",     icon:"🤖", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
      { name:"Algorithms",                  branch:"CSE",     icon:"🧮", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=algorithms", pdf:"https://nptel.ac.in/courses?searchQuery=algorithms" },
      { name:"Digital Electronics",         branch:"ECE/CSE", icon:"⚡", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=digital+electronics", pdf:"https://nptel.ac.in/courses?searchQuery=digital+electronics" },
    ],
    "EE Academy": [
      { name:"Circuit Theory",             branch:"EEE/ECE",  icon:"🔌", yt:"https://www.youtube.com/@EEAcademy1/search?query=circuit+theory", pdf:"https://nptel.ac.in/courses?searchQuery=circuit+theory" },
      { name:"Network Analysis",           branch:"EEE/ECE",  icon:"🌐", yt:"https://www.youtube.com/@EEAcademy1/search?query=network+analysis", pdf:"https://nptel.ac.in/courses?searchQuery=network+analysis" },
      { name:"EM Field Theory",            branch:"ECE",      icon:"🧲", yt:"https://www.youtube.com/@EEAcademy1/search?query=electromagnetic+field+theory", pdf:"https://nptel.ac.in/courses?searchQuery=electromagnetic+theory" },
      { name:"Power Systems",              branch:"EEE",      icon:"💡", yt:"https://www.youtube.com/@EEAcademy1/search?query=power+systems", pdf:"https://nptel.ac.in/courses?searchQuery=power+systems" },
      { name:"Control Systems",            branch:"EEE/ECE",  icon:"🔄", yt:"https://www.youtube.com/@EEAcademy1/search?query=control+systems", pdf:"https://nptel.ac.in/courses?searchQuery=control+systems" },
      { name:"Electrical Machines",        branch:"EEE",      icon:"⚙️", yt:"https://www.youtube.com/@EEAcademy1/search?query=electrical+machines", pdf:"https://nptel.ac.in/courses?searchQuery=electrical+machines" },
    ],
    "Civil Guruji": [
      { name:"Structural Analysis",        branch:"Civil",    icon:"🏗️", yt:"https://www.youtube.com/@CivilGuruji/search?query=structural+analysis", pdf:"https://nptel.ac.in/courses?searchQuery=structural+analysis" },
      { name:"Fluid Mechanics",            branch:"Civil",    icon:"💧", yt:"https://www.youtube.com/@CivilGuruji/search?query=fluid+mechanics", pdf:"https://nptel.ac.in/courses?searchQuery=fluid+mechanics" },
      { name:"Geotechnical Engineering",   branch:"Civil",    icon:"🪨", yt:"https://www.youtube.com/@CivilGuruji/search?query=geotechnical+engineering", pdf:"https://nptel.ac.in/courses?searchQuery=geotechnical+engineering" },
      { name:"Transportation Engineering", branch:"Civil",    icon:"🛣️", yt:"https://www.youtube.com/@CivilGuruji/search?query=transportation+engineering", pdf:"https://nptel.ac.in/courses?searchQuery=transportation+engineering" },
      { name:"Environmental Engineering",  branch:"Civil",    icon:"🌿", yt:"https://www.youtube.com/@CivilGuruji/search?query=environmental+engineering", pdf:"https://nptel.ac.in/courses?searchQuery=environmental+engineering" },
      { name:"Surveying",                  branch:"Civil",    icon:"📏", yt:"https://www.youtube.com/@CivilGuruji/search?query=surveying", pdf:"https://nptel.ac.in/courses?searchQuery=surveying" },
    ],
    "IIT Madras Online": [
      { name:"Operating Systems",          branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@iitmadrasonline/search?query=operating+systems", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"Computer Architecture",      branch:"CSE",      icon:"🏛", yt:"https://www.youtube.com/@iitmadrasonline/search?query=computer+architecture", pdf:"https://nptel.ac.in/courses?searchQuery=computer+architecture" },
      { name:"Signals & Systems",          branch:"ECE",      icon:"📡", yt:"https://www.youtube.com/@iitmadrasonline/search?query=signals+systems", pdf:"https://nptel.ac.in/courses?searchQuery=signals+systems" },
      { name:"Thermodynamics",             branch:"Mech",     icon:"🌡️", yt:"https://www.youtube.com/@iitmadrasonline/search?query=thermodynamics", pdf:"https://nptel.ac.in/courses?searchQuery=thermodynamics" },
    ],
    "IIT Delhi Official": [
      { name:"Algorithms",                 branch:"CSE",      icon:"🧮", yt:"https://www.youtube.com/@IITDelhiOfficial/search?query=algorithms", pdf:"https://nptel.ac.in/courses?searchQuery=algorithms" },
      { name:"Theory of Computation",      branch:"CSE",      icon:"🤖", yt:"https://www.youtube.com/@IITDelhiOfficial/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
      { name:"Digital Systems",            branch:"ECE",      icon:"⚡", yt:"https://www.youtube.com/@IITDelhiOfficial/search?query=digital+systems", pdf:"https://nptel.ac.in/courses?searchQuery=digital+systems" },
      { name:"Mathematics",                branch:"All",      icon:"📐", yt:"https://www.youtube.com/@IITDelhiOfficial/search?query=mathematics", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
    ],
    "Unacademy GATE": [
      { name:"GATE CSE — Free Lectures",   branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@UnacademyGATE/search?query=CSE", pdf:"https://nptel.ac.in/courses?disciplineId=106" },
      { name:"GATE ECE — Free Lectures",   branch:"ECE",      icon:"📡", yt:"https://www.youtube.com/@UnacademyGATE/search?query=ECE", pdf:"https://nptel.ac.in/courses?disciplineId=117" },
      { name:"GATE EEE — Free Lectures",   branch:"EEE",      icon:"⚡", yt:"https://www.youtube.com/@UnacademyGATE/search?query=EE", pdf:"https://nptel.ac.in/courses?disciplineId=108" },
      { name:"GATE Civil — Free Lectures", branch:"Civil",    icon:"🏗️", yt:"https://www.youtube.com/@UnacademyGATE/search?query=civil", pdf:"https://nptel.ac.in/courses?disciplineId=105" },
      { name:"GATE Mech — Free Lectures",  branch:"Mech",     icon:"⚙️", yt:"https://www.youtube.com/@UnacademyGATE/search?query=mechanical", pdf:"https://nptel.ac.in/courses?disciplineId=112" },
    ],
    "MADE Easy": [
      { name:"GATE Topper Discussions",    branch:"All",      icon:"🏆", yt:"https://www.youtube.com/@madeeasygroupofficial/search?query=GATE+topper", pdf:"https://madeeasypublications.org" },
      { name:"Shortcuts & Tricks",         branch:"All",      icon:"💡", yt:"https://www.youtube.com/@madeeasygroupofficial/search?query=shortcuts+tricks", pdf:"https://madeeasypublications.org" },
      { name:"Previous Year Solutions",    branch:"All",      icon:"📄", yt:"https://www.youtube.com/@madeeasygroupofficial/search?query=previous+year+questions", pdf:"https://madeeasypublications.org/gate-books.php" },
    ],
    "Ravindrababu Ravula": [
      { name:"Theory of Computation",      branch:"CSE",      icon:"🤖", yt:"https://www.youtube.com/@ravindrababuravula/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
      { name:"Operating Systems",          branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@ravindrababuravula/search?query=operating+systems", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"DBMS",                       branch:"CSE",      icon:"🗄️", yt:"https://www.youtube.com/@ravindrababuravula/search?query=DBMS", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Computer Networks",          branch:"CSE",      icon:"🌐", yt:"https://www.youtube.com/@ravindrababuravula/search?query=computer+networks", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Algorithms",                 branch:"CSE",      icon:"🧮", yt:"https://www.youtube.com/@ravindrababuravula/search?query=algorithms", pdf:"https://nptel.ac.in/courses?searchQuery=algorithms" },
    ],
    "5 Minutes Engineering": [
      { name:"Quick Concepts — CSE",       branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=computer+science", pdf:"https://nptel.ac.in/courses?disciplineId=106" },
      { name:"Quick Concepts — ECE",       branch:"ECE",      icon:"📡", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=electronics", pdf:"https://nptel.ac.in/courses?disciplineId=117" },
      { name:"Quick Concepts — Mech",      branch:"Mech",     icon:"⚙️", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=mechanical", pdf:"https://nptel.ac.in/courses?disciplineId=112" },
      { name:"Quick Concepts — Civil",     branch:"Civil",    icon:"🏗️", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=civil", pdf:"https://nptel.ac.in/courses?disciplineId=105" },
    ],
  };

  const courses = C[res.name] || [];
  const isYT = res.url && res.url.includes("youtube.com");
  const btnLabel = isYT ? "▶ Open Channel" : "🌐 Open Site";

  return [
    el("div", { class: "gate-res-detail" },
      el("div", { class: "gate-res-detail-hdr" },
        el("button", { type: "button", class: "gate-back-btn",
          onclick: () => { state.gateResView = null; render(); }
        }, "← Back to Resources"),
        el("div", { class: "gate-res-det-title" },
          el("span", { class: "gate-res-det-emoji" }, res.emoji),
          el("div", {},
            el("div", { class: "gate-res-det-name" }, res.name),
            el("div", { class: "gate-res-det-sub" }, res.sub || "Free content — no payment needed"),
          ),
        ),
        el("a", { class: "btn sm", href: res.url, target: "_blank", rel: "noopener noreferrer" }, btnLabel),
      ),
      el("div", { class: "gate-free-badge" }, "✅ 100% FREE — No subscription, no payment, no login required"),
      courses.length > 0
        ? el("div", { class: "gate-course-list" },
            el("div", { class: "gate-course-hint" },
              "Tap ",
              el("span", { class: "gate-course-hint-yt" }, "▶ Watch"),
              " to play video in YouTube (HD) · Tap ",
              el("span", { class: "gate-course-hint-pdf" }, "📄 PDF"),
              " for free lecture notes"
            ),
            ...courses.map(c =>
              el("div", { class: "gate-course-card" },
                el("div", { class: "gate-course-left" },
                  el("span", { class: "gate-course-icon" }, c.icon),
                  el("div", {},
                    el("div", { class: "gate-course-name" }, c.name),
                    el("span", { class: "gate-course-branch" }, c.branch),
                  ),
                ),
                el("div", { class: "gate-course-btns" },
                  el("a", { class: "btn primary sm", href: c.yt, target: "_blank", rel: "noopener noreferrer" }, "▶ Watch"),
                  el("a", { class: "btn sm", href: c.pdf, target: "_blank", rel: "noopener noreferrer" }, "📄 PDF"),
                ),
              )
            ),
          )
        : el("div", { class: "gate-course-empty" },
            el("div", {}, 'Tap "' + btnLabel + '" above to browse all available courses and content.'),
          ),
    ),
  ];
}

function renderGateIntro() {
  const PYQ_YEARS = ["2025","2024","2023","2022","2021","2020","2019","2018","2017","2016"];
  const GATE_IITS = [
    { name: "IIT Bombay", sub: "NPTEL courses — ECE, CS, Civil, Mech", emoji: "🏛", url: "https://nptel.ac.in/institutes/106101010" },
    { name: "IIT Delhi", sub: "NPTEL courses — All engineering", emoji: "🏛", url: "https://nptel.ac.in/institutes/110101002" },
    { name: "IIT Madras", sub: "NPTEL courses — ECE, CS, Mech", emoji: "🏛", url: "https://nptel.ac.in/institutes/106106047" },
    { name: "IIT Kanpur", sub: "NPTEL + GATE papers archive", emoji: "🏛", url: "https://nptel.ac.in/institutes/101104025" },
    { name: "IIT Kharagpur", sub: "NPTEL courses — Civil, EEE, ECE", emoji: "🏛", url: "https://nptel.ac.in/institutes/105105127" },
    { name: "IIT Roorkee", sub: "NPTEL courses — Civil, ECE, CS", emoji: "🏛", url: "https://nptel.ac.in/institutes/107107145" },
    { name: "IIT Hyderabad", sub: "NPTEL courses — CS, ECE, EEE", emoji: "🏛", url: "https://nptel.ac.in/institutes/102107086" },
    { name: "NIT Warangal", sub: "NPTEL courses — All branches", emoji: "🏫", url: "https://nptel.ac.in/institutes/105109055" },
    { name: "NIT Trichy", sub: "NPTEL courses — Civil, Mech, ECE", emoji: "🏫", url: "https://nptel.ac.in/institutes/106106085" },
    { name: "IISc Bangalore", sub: "NPTEL — Advanced research courses", emoji: "🔬", url: "https://nptel.ac.in/institutes/106101003" },
  ];
  const GATE_WORLD = [
    { name: "MIT OpenCourseWare", sub: "Free MIT courses — CS, EEE, Civil", emoji: "🇺🇸", url: "https://ocw.mit.edu" },
    { name: "MIT YouTube", sub: "Full lecture videos — HD", emoji: "▶️", url: "https://www.youtube.com/@mitocw" },
    { name: "Stanford Online", sub: "Free courses — CS, AI, Mech", emoji: "🏫", url: "https://online.stanford.edu/free-courses" },
    { name: "Coursera (Audit)", sub: "Top university courses — free audit", emoji: "🌐", url: "https://www.coursera.org" },
    { name: "edX Free Courses", sub: "MIT, Harvard, IIT — free audit", emoji: "📖", url: "https://www.edx.org/search?q=engineering" },
    { name: "Khan Academy", sub: "Maths, Physics — concept building", emoji: "🧮", url: "https://www.khanacademy.org" },
  ];
  const GATE_VIDEOS = [
    { name: "Gate Smashers", sub: "CSE — Full GATE playlist HD", emoji: "💻", url: "https://www.youtube.com/@GateSmashersFull" },
    { name: "Neso Academy", sub: "ECE & CSE — HD lectures", emoji: "📡", url: "https://www.youtube.com/@NesoAcademy" },
    { name: "NPTEL Official", sub: "All branches — IIT faculty HD", emoji: "🎓", url: "https://www.youtube.com/@nptel" },
    { name: "Knowledge Gate", sub: "CSE — Concepts + PYQs", emoji: "🧠", url: "https://www.youtube.com/@KnowledgeGate9" },
    { name: "EE Academy", sub: "EEE / ECE — Circuit theory", emoji: "⚡", url: "https://www.youtube.com/@EEAcademy1" },
    { name: "Civil Guruji", sub: "Civil — Full GATE HD", emoji: "🏗️", url: "https://www.youtube.com/@CivilGuruji" },
    { name: "IIT Madras Online", sub: "IIT Madras official lectures", emoji: "🏛", url: "https://www.youtube.com/@iitmadrasonline" },
    { name: "IIT Delhi Official", sub: "IIT Delhi lecture series", emoji: "🏛", url: "https://www.youtube.com/@IITDelhiOfficial" },
    { name: "Unacademy GATE", sub: "Live + recorded free content", emoji: "🎯", url: "https://www.youtube.com/@UnacademyGATE" },
    { name: "MADE Easy", sub: "Toppers & expert discussions", emoji: "📘", url: "https://www.youtube.com/@madeeasygroupofficial" },
    { name: "Ravindrababu Ravula", sub: "CSE — Theory of Computation, OS", emoji: "💡", url: "https://www.youtube.com/@ravindrababuravula" },
    { name: "5 Minutes Engineering", sub: "Quick concept videos all branches", emoji: "⏱", url: "https://www.youtube.com/@5MinutesEngineering" },
  ];
  const GATE_PAPERS = [
    { name: "Official GATE Papers", sub: "All years — IIT Kanpur archive", emoji: "📄", url: "https://gate.iitk.ac.in/GATE_past_papers.html" },
    { name: "NPTEL Notes (PDF)", sub: "Subject-wise free lecture notes", emoji: "📚", url: "https://nptel.ac.in/courses" },
    { name: "SWAYAM Free Courses", sub: "Govt platform — IIT/NIT faculty", emoji: "🇮🇳", url: "https://swayam.gov.in" },
    { name: "MADE Easy Books", sub: "Handbooks & workbooks", emoji: "📘", url: "https://madeeasypublications.org" },
    { name: "ACE Academy", sub: "Study material & test series", emoji: "📗", url: "https://aceenggacademy.com" },
    { name: "GATE Academy", sub: "Notes, books & video classes", emoji: "📙", url: "https://thegateacademy.com" },
  ];
  const GATE_PRACTICE = [
    { name: "PW GATE App", sub: "Mock tests & video lectures", emoji: "🔥", url: "https://pw.live" },
    { name: "Testbook GATE", sub: "Full mock test series", emoji: "📝", url: "https://testbook.com/gate" },
    { name: "Unacademy GATE", sub: "Live tests + quizzes", emoji: "🎯", url: "https://unacademy.com/goal/gate" },
    { name: "GATE Overflow", sub: "CSE PYQ solutions community", emoji: "💬", url: "https://gateoverflow.in" },
  ];
  if (state.gateResView) return renderGateResourceDetail(state.gateResView);

  const pyqPosts = state.gate.filter(d => !d.deleted && d.pyqYear);
  const yearCounts = {};
  for (const d of pyqPosts) yearCounts[d.pyqYear] = (yearCounts[d.pyqYear] || 0) + 1;

  const openRes = (r) => { state.gateResView = r; render(); };

  const setYearFilter = (y) => {
    state.filter = "pyq"; $("filter").value = "pyq";
    state.group = "All";
    // also set dept-based subject filter if branch known
    if (y) {
      // pre-filter by pyqYear via query trick — store in state
      state.gateYearPick = y;
    } else {
      state.gateYearPick = null;
    }
    render();
  };

  return [
    el("div", { class: "gate-hub" },
      el("div", { class: "gate-hub-header" },
        el("div", { class: "gate-hub-title" }, "🎯 GATE 2027 Prep Hub"),
        el("div", { class: "gate-hub-sub" }, "PYQs · Solutions · Shortcuts · Community Discussions"),
      ),

      // PYQ Year section
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "📄 Previous Year Papers"),
        el("div", { class: "gate-section-sub" }, "Tap a year to see community discussions & solutions"),
        el("div", { class: "gate-year-grid" },
          ...PYQ_YEARS.map(y => {
            const cnt = yearCounts[y] || 0;
            return el("button", { type: "button", class: "gate-year-btn" + (state.gateYearPick === y ? " active" : ""),
              onclick: () => setYearFilter(y)
            },
              el("span", { class: "gate-year-label" }, "GATE"),
              el("span", { class: "gate-year-num" }, y),
              cnt > 0 && el("span", { class: "gate-year-cnt" }, cnt + " posts"),
            );
          })
        ),
        el("button", { type: "button", class: "btn primary sm gate-add-pyq", onclick: () => { openAsk(); } },
          "➕ Add PYQ with Solution"),
      ),

      // Branch PYQ papers
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "📂 Previous Year Papers by Branch"),
        el("div", { class: "gate-section-sub" }, "Tap a branch to see year-wise GATE solved papers (free PDFs)"),
        el("div", { class: "gate-branch-row" },
          ...Object.keys(DEPT_MAP).map(d =>
            el("button", { type: "button", class: "gate-branch-btn" + (state.gatePYQBranch === d ? " active" : ""),
              onclick: () => { state.gatePYQBranch = state.gatePYQBranch === d ? null : d; render(); }
            }, d)
          )
        ),
        state.gatePYQBranch && renderGatePYQPanel(state.gatePYQBranch),
      ),

      // Quick stats
      pyqPosts.length > 0 && el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "📊 PYQ Stats"),
        el("div", { class: "gate-stats-row" },
          el("div", { class: "gate-stat" }, el("span", { class: "gate-stat-n" }, pyqPosts.length), el("span", { class: "gate-stat-l" }, "PYQs posted")),
          el("div", { class: "gate-stat" }, el("span", { class: "gate-stat-n" }, pyqPosts.filter(d => d.difficulty === "Hard").length), el("span", { class: "gate-stat-l" }, "Hard")),
          el("div", { class: "gate-stat" }, el("span", { class: "gate-stat-n" }, pyqPosts.filter(d => d.marks === "2M").length), el("span", { class: "gate-stat-l" }, "2 Marks")),
        ),
      ),

      // Top IITs & NITs
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "🏛 Top IITs & NITs — Free Courses"),
        el("div", { class: "gate-section-sub" }, "Tap any institute → see subjects → ▶ watch video in HD · 📄 download PDF — all 100% free"),
        el("div", { class: "gate-res-grid gate-res-grid-2" },
          ...GATE_IITS.map(r =>
            el("button", { type: "button", class: "gate-res-chip", onclick: () => openRes(r) },
              el("span", { class: "gate-res-emoji" }, r.emoji),
              el("div", {},
                el("div", { class: "gate-res-name" }, r.name),
                el("div", { class: "gate-res-tag" }, r.sub),
              ),
              el("span", { class: "gate-res-arrow" }, "›"),
            )
          )
        ),
      ),

      // World class universities
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "🌍 World Class Universities"),
        el("div", { class: "gate-section-sub" }, "MIT, Stanford, Khan Academy — tap to see free courses"),
        el("div", { class: "gate-res-grid gate-res-grid-2" },
          ...GATE_WORLD.map(r =>
            el("button", { type: "button", class: "gate-res-chip", onclick: () => openRes(r) },
              el("span", { class: "gate-res-emoji" }, r.emoji),
              el("div", {},
                el("div", { class: "gate-res-name" }, r.name),
                el("div", { class: "gate-res-tag" }, r.sub),
              ),
              el("span", { class: "gate-res-arrow" }, "›"),
            )
          )
        ),
      ),

      // Free video lectures
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "🎥 Free YouTube Lectures (HD)"),
        el("div", { class: "gate-section-sub" }, "Tap a channel → see subjects → ▶ opens YouTube — plays in HD immediately"),
        el("div", { class: "gate-res-grid" },
          ...GATE_VIDEOS.map(r =>
            el("button", { type: "button", class: "gate-res-chip", onclick: () => openRes(r) },
              el("span", { class: "gate-res-emoji" }, r.emoji),
              el("div", {},
                el("div", { class: "gate-res-name" }, r.name),
                el("div", { class: "gate-res-tag" }, r.sub),
              ),
              el("span", { class: "gate-res-arrow" }, "›"),
            )
          )
        ),
      ),

      // Official papers + PDFs
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "📄 Papers & Study Material"),
        el("div", { class: "gate-section-sub" }, "Download official PYQ papers and notes for free"),
        el("div", { class: "gate-res-grid gate-res-grid-2" },
          ...GATE_PAPERS.map(r =>
            el("a", { class: "gate-res-chip", href: r.url, target: "_blank", rel: "noopener noreferrer" },
              el("span", { class: "gate-res-emoji" }, r.emoji),
              el("div", {},
                el("div", { class: "gate-res-name" }, r.name),
                el("div", { class: "gate-res-tag" }, r.sub),
              )
            )
          )
        ),
      ),

      // Practice & mock tests
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "📝 Practice & Mock Tests"),
        el("div", { class: "gate-section-sub" }, "Full mock tests and online practice"),
        el("div", { class: "gate-res-grid gate-res-grid-2" },
          ...GATE_PRACTICE.map(r =>
            el("a", { class: "gate-res-chip", href: r.url, target: "_blank", rel: "noopener noreferrer" },
              el("span", { class: "gate-res-emoji" }, r.emoji),
              el("div", {},
                el("div", { class: "gate-res-name" }, r.name),
                el("div", { class: "gate-res-tag" }, r.sub),
              )
            )
          )
        ),
      ),

      el("div", { class: "rowbtns" },
        el("button", { class: "btn primary", type: "button", onclick: openAsk }, "Post GATE Discussion"),
        el("button", { class: "btn", type: "button", onclick: () => { state.filter = "all"; $("filter").value = "all"; state.gateYearPick = null; render(); } }, "📋 All Discussions"),
      ),
    )
  ];
}

function renderIntro() {
  if (state.tab === "gate") return renderGateIntro();
  const t = TABS[state.tab];
  // Live stats
  const totalPosts = state.doubts.length + state.ideas.length + state.clubs.length + state.gate.length + state.challenges.length;
  const students = new Set([...state.doubts, ...state.ideas, ...state.clubs, ...state.gate, ...state.challenges].filter(p => !p.anonymous).map(p => p.authorId)).size;
  const resolved = state.doubts.filter(d => d.resolvedReplyId).length;
  const open = state.doubts.length - resolved;
  const statsRow = totalPosts > 0 ? el("div", { class: "intro-stats" },
    el("div", { class: "intro-stat" }, el("span", { class: "intro-stat-n" }, totalPosts), el("span", { class: "intro-stat-l" }, "posts")),
    el("div", { class: "intro-stat" }, el("span", { class: "intro-stat-n" }, students), el("span", { class: "intro-stat-l" }, "students")),
    state.tab === "doubts" && el("div", { class: "intro-stat ok" }, el("span", { class: "intro-stat-n" }, resolved), el("span", { class: "intro-stat-l" }, "resolved")),
    state.tab === "doubts" && open > 0 && el("div", { class: "intro-stat warn" }, el("span", { class: "intro-stat-n" }, open), el("span", { class: "intro-stat-l" }, "need help"))
  ) : null;

  const steps = state.tab === "doubts"
    ? "1. Ask — pick the subject and write the question. Add a photo of your notebook or write it on the notebook page.\n2. Answer — open any doubt and explain the steps. You can attach your handwritten working too.\n3. Resolve — the student who asked marks the answer that helped. Tap \u201cI have this doubt too\u201d on doubts you share."
    : state.tab === "market"
    ? "1. List — post an item with price, condition and WhatsApp number.\n2. Browse — search by category or filter available items.\n3. Contact — buyer taps WhatsApp button to reach seller directly.\n4. Sold — mark your listing as Sold once done."
    : "1. Share — post an idea for a project, startup or research. Sketch it on the notebook page if that helps.\n2. Like — tap ♥ on ideas you want to see happen.\n3. Build — reply with thoughts, improvements or an offer to join.";

  // Keyboard shortcut hint (desktop)
  const kbHint = window.matchMedia("(pointer: fine)").matches
    ? el("p", { class: "hint kb-hint" }, "⌨️ Press / to search · N to ask · Esc to go back")
    : null;

  return [
    el("h2", {}, "How it works"),
    statsRow,
    el("p", { class: "body" }, steps),
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "button", onclick: openAsk }, t.ask),
      el("button", { class: "btn", type: "button", onclick: () => showPanel("network") }, "🌐 RGUKT Network")),
    kbHint,
  ].filter(Boolean);
}

function renderName() {
  const err = el("p", { class: "err", hidden: true });
  const form = el("form", { class: "form", onsubmit: (e) => {
    e.preventDefault();
    const v = form.elements.name.value.trim().slice(0, 40);
    if (v.length < 2) { err.textContent = "Enter at least 2 characters."; err.hidden = false; return; }
    if (hasBadWords(v) || v.toLowerCase() === ANON.toLowerCase()) { err.textContent = "Please use your real name or nickname."; err.hidden = false; return; }
    setName(v); state.mode = state.afterName || (state.selected ? "view" : "intro"); state.afterName = null; render();
  } },
    el("label", {}, "Your name", el("input", { id: "f-name", name: "name", maxlength: "40", autocomplete: "name", placeholder: "e.g. Ravi K (CSE-B)", value: getName() })),
    el("p", { class: "hint" }, "Classmates see this name on your doubts, ideas and replies. It is saved on this phone or computer."),
    err,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "submit" }, "Save name"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; state.afterName = null; render(); } }, "Cancel")));
  setTimeout(() => form.elements.name.focus(), 0);
  return [el("h2", {}, "What should classmates call you?"), form];
}

// ---------- challenge helpers ----------
const CHAL_TYPES = ["Quiz","Puzzle Hunt","Riddle","Code Challenge","Event"];
const CHAL_ICONS = { "Quiz":"🎯","Puzzle Hunt":"🧩","Riddle":"🤔","Code Challenge":"💻","Event":"🏆" };
const CHAL_LIMITS = [0,5,10,20,30,60]; // 0 = no limit

// Simple answer obfuscation: XOR answer index with a hash of challenge ID + question index
// This prevents casual DevTools inspection of correct answers before the quiz is submitted
function chalHash(challengeId, qi) {
  let h = 0;
  const s = (challengeId || "") + qi;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return ((h >>> 0) % 4); // 0..3, same range as ans
}
function encodeAns(ans, challengeId, qi) { return ans ^ chalHash(challengeId, qi); }
function decodeAns(encoded, challengeId, qi) { return encoded ^ chalHash(challengeId, qi); }

function chalScoresFor(challengeId) {
  return state.chalScores.filter(s => s.challengeId === challengeId);
}
function myChalScore(challengeId) {
  return store ? chalScoresFor(challengeId).find(s => s.userId === store.uid) : null;
}

function renderChalQuiz(d) {
  const questions = d.questions || [];
  if (!questions.length) return null;
  const timeLimit = d.timeLimit || 0;
  const myScore = myChalScore(d.id);
  const isClosed = d.status === "closed";

  // Already submitted
  if (myScore) {
    const max = questions.length * 10;
    return el("div", { class: "chal-quiz-done" },
      el("div", { class: "chal-result-banner" },
        el("span", { class: "chal-result-score" }, myScore.score + "/" + max),
        el("span", { class: "chal-result-sub" }, "Your score · " + Math.round(myScore.timeTaken) + "s taken")
      ),
      el("div", { class: "chal-answers-review" },
        ...questions.map((q, qi) => {
          const chosen = myScore.answers ? myScore.answers[qi] : undefined;
          const correctAns = decodeAns(q.ans, d.id, qi);
          return el("div", { class: "chal-q" },
            el("p", { class: "chal-q-text" }, (qi+1) + ". " + q.q),
            el("div", { class: "chal-opts" }, q.opts.map((opt, oi) => {
              let cls = "chal-opt reviewed";
              if (oi === correctAns) cls += " correct";
              else if (oi === chosen) cls += " wrong";
              return el("div", { class: cls }, el("b", {}, "ABCD"[oi]), opt);
            }))
          );
        })
      )
    );
  }

  if (isClosed) return el("p", { class: "hint" }, "This challenge is closed. No more submissions.");

  // Quiz in progress for THIS challenge
  if (chalQuiz && chalQuiz.challengeId === d.id) {
    const elapsed = Math.floor((Date.now() - chalQuiz.startTime) / 1000);
    const limitSecs = timeLimit * 60;
    const remaining = timeLimit > 0 ? Math.max(0, limitSecs - elapsed) : null;
    const mins = remaining !== null ? Math.floor(remaining / 60) : null;
    const secs = remaining !== null ? remaining % 60 : null;
    const timedOut = remaining !== null && remaining <= 0;

    const submitQuiz = async () => {
      const answers = chalQuiz.answers.slice();
      const timeTaken = Math.floor((Date.now() - chalQuiz.startTime) / 1000);
      let score = 0;
      questions.forEach((q, qi) => { if (answers[qi] === decodeAns(q.ans, d.id, qi)) score += 10; });
      if (chalQuiz.timer) clearInterval(chalQuiz.timer);
      chalQuiz = null;
      if (!store) return;
      const docId = d.id + "_" + store.uid;
      const doc = { challengeId: d.id, userId: store.uid, userName: getName() || "A student", score, timeTaken, answers, submittedAt: Date.now() };
      state.chalScores = [...state.chalScores.filter(s => s.challengeId + "_" + s.userId !== docId), { id: docId, ...doc }];
      render();
      await store.set("chal_scores", docId, doc).catch(e => showNotice(errText(e)));
    };

    if (timedOut) { submitQuiz(); return null; }

    return el("div", { class: "chal-quiz-active" },
      remaining !== null && el("div", { class: "chal-timer" + (remaining < 30 ? " chal-timer-red" : "") },
        "⏱ " + String(mins).padStart(2,"0") + ":" + String(secs).padStart(2,"0")
      ),
      ...questions.map((q, qi) => {
        const chosen = chalQuiz.answers[qi];
        return el("div", { class: "chal-q" },
          el("p", { class: "chal-q-text" }, (qi+1) + ". " + q.q),
          el("div", { class: "chal-opts" }, q.opts.map((opt, oi) =>
            el("button", { type: "button", class: "chal-opt" + (chosen === oi ? " selected" : ""),
              onclick: () => { chalQuiz.answers[qi] = oi; render(); }
            }, el("b", {}, "ABCD"[oi]), opt)
          ))
        );
      }),
      el("div", { class: "rowbtns" },
        el("button", { type: "button", class: "btn primary", onclick: submitQuiz }, "Submit Quiz"),
        el("button", { type: "button", class: "btn", onclick: () => { if (chalQuiz && chalQuiz.timer) clearInterval(chalQuiz.timer); chalQuiz = null; render(); } }, "Abandon")
      )
    );
  }

  // Start button
  if (!getName()) return el("p", { class: "hint" }, "Set your name first to take this quiz.");
  return el("div", { class: "chal-start-wrap" },
    el("div", { class: "chal-start-info" },
      el("span", { class: "pill" }, questions.length + " questions"),
      timeLimit > 0 && el("span", { class: "pill" }, "⏱ " + timeLimit + " min limit")
    ),
    el("button", { type: "button", class: "btn primary chal-start-btn",
      onclick: () => {
        chalQuiz = { challengeId: d.id, startTime: Date.now(), answers: new Array(questions.length).fill(undefined), timer: null };
        if (timeLimit > 0) {
          chalQuiz.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - chalQuiz.startTime) / 1000);
            if (elapsed >= timeLimit * 60) { clearInterval(chalQuiz.timer); }
            render();
          }, 1000);
        }
        render();
      }
    }, "🚀 Start Quiz")
  );
}

function renderChalLeaderboard(d) {
  const scores = chalScoresFor(d.id).sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);
  const own = mine(d);
  if (!scores.length) return el("p", { class: "hint" }, "No one has submitted yet. Be the first.");
  return el("div", { class: "chal-board" },
    el("div", { class: "chal-board-hdr" }, "🏆 Leaderboard"),
    ...scores.map((s, i) => {
      const isWinner = d.winner === s.userId;
      const isRunner = d.runnerUp === s.userId;
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i+1) + ".";
      return el("div", { class: "chal-board-row" + (isWinner ? " chal-winner" : isRunner ? " chal-runner" : "") },
        el("span", { class: "chal-rank" }, medal),
        el("span", { class: "chal-board-name" }, s.userName + (isWinner ? " 🏆 Winner" : isRunner ? " 🥈 Runner-up" : "")),
        el("span", { class: "chal-board-score" }, s.score + " pts · " + s.timeTaken + "s"),
        own && !d.winner && el("button", { type: "button", class: "linkbtn", onclick: () => store.update("challenges", d.id, { winner: s.userId, winnerName: s.userName }).catch(e => showNotice(errText(e))) }, "Award 🏆"),
        own && d.winner && !d.runnerUp && s.userId !== d.winner && el("button", { type: "button", class: "linkbtn", onclick: () => store.update("challenges", d.id, { runnerUp: s.userId, runnerUpName: s.userName }).catch(e => showNotice(errText(e))) }, "Award 🥈")
      );
    })
  );
}

function renderChalQuizBuilder(onUpdate) {
  let questions = [];
  const wrap = el("div", { class: "chal-builder" });
  const draw = () => {
    wrap.replaceChildren(
      el("div", { class: "chal-q-list" }, ...questions.map((q, qi) =>
        el("div", { class: "chal-qb-item" },
          el("div", { class: "chal-qb-hdr" },
            el("strong", {}, "Q" + (qi+1)),
            el("button", { type: "button", class: "linkbtn danger", onclick: () => { questions.splice(qi,1); draw(); onUpdate(questions); } }, "Remove")
          ),
          el("input", { type: "text", class: "chal-qb-q", placeholder: "Question text", maxlength: "300", value: q.q,
            oninput: (e) => { q.q = e.target.value; onUpdate(questions); }
          }),
          el("div", { class: "chal-qb-opts" },
            ...q.opts.map((opt, oi) =>
              el("label", { class: "chal-qb-opt" + (q.ans === oi ? " chal-qb-correct" : "") },
                el("input", { type: "radio", name: "ans-" + qi, checked: q.ans === oi,
                  onchange: () => { q.ans = oi; draw(); onUpdate(questions); }
                }),
                el("input", { type: "text", placeholder: "ABCD"[oi] + " option", maxlength: "150", value: opt,
                  oninput: (e) => { q.opts[oi] = e.target.value; onUpdate(questions); }
                }),
                q.ans === oi && el("span", { class: "chal-correct-tag" }, "✔ Correct")
              )
            )
          )
        )
      )),
      questions.length < 10 && el("button", { type: "button", class: "btn sm", onclick: () => {
        questions.push({ q: "", opts: ["","","",""], ans: 0 });
        draw(); onUpdate(questions);
      } }, "+ Add Question")
    );
  };
  draw();
  return wrap;
}

function renderAsk(existing) {
  if (state.tab === "market") return renderMarketAsk(existing);
  const t = TABS[state.tab];
  const err = el("p", { class: "err", hidden: true });
  const label = existing ? "Save changes" : (state.tab === "doubts" ? "Post doubt" : state.tab === "challenges" ? "Post challenge" : "Post idea");
  const current = existing ? existing[t.field] : (state.group !== "All" ? state.group : t.groups[0]);
  const groups = t.groups.includes(current) ? t.groups : [...t.groups, current];
  const newPages = []; // data URLs added in this form
  const newFileLinks = []; // {name, url, size} uploaded via Firebase Storage
  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const title = form.elements.title.value.trim(), body = form.elements.body.value.trim(), group = form.elements.group.value;
    const anonymous = form.elements.anon.checked, urgent = !!(form.elements.urgent && form.elements.urgent.checked), bounty = !!(form.elements.bounty && form.elements.bounty.checked);
    if (title.length < 3) { err.textContent = "Write a title of at least 3 characters."; err.hidden = false; return; }
    if (hasBadWords(title + " " + body)) { err.textContent = LANGUAGE_MSG; err.hidden = false; return; }
    const wait = existing ? "" : spamCheck();
    if (wait) { err.textContent = wait; err.hidden = false; return; }
    if (newFileLinks.some(f => f.pct !== undefined)) { err.textContent = "Please wait for uploads to finish."; err.hidden = false; return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Saving…";
    const readyFiles = newFileLinks.filter(f => f.url);
    try {
      if (existing) {
        const kept = existing.pages || [];
        const added = newPages.slice(0, Math.max(0, MAX_PAGES - kept.length));
        const addedIds = await trySavePages(added, existing.id);
        const keptFiles = existing.fileAttachments || [];
        await store.update(t.coll, existing.id, { title: title.slice(0, 200), body: body.slice(0, 5000), [t.field]: group, authorName: anonymous ? ANON : (getName() || existing.authorName), anonymous, urgent, pages: [...kept, ...addedIds], fileAttachments: [...keptFiles, ...readyFiles], ...jobFields(form, false) });
        state.mode = "view"; render(); return;
      }
      const id = store.newId(t.coll);
      const pageIds = newPages.map(u => { const pid = store.newId("pages"); pageCache.set(pid, u); return pid; });
      const yearVal = form.elements.year ? form.elements.year.value : "";
      const tagsVal = form.elements.tags ? form.elements.tags.value.trim().slice(0, 100) : "";
      const pyqYear = form.elements.pyqYear ? form.elements.pyqYear.value : "";
      const marks = form.elements.marks ? form.elements.marks.value : "";
      const difficulty = form.elements.difficulty ? form.elements.difficulty.value : "";
      const doc = { title: title.slice(0, 200), body: body.slice(0, 5000), [t.field]: group, authorId: store.uid, authorName: anonymous ? ANON : getName(), anonymous, urgent, createdAt: Date.now(), pages: pageIds, fileAttachments: readyFiles };
      if (yearVal) doc.year = yearVal;
      if (tagsVal) doc.tags = tagsVal;
      if (pyqYear) doc.pyqYear = pyqYear;
      if (marks) doc.marks = marks;
      if (difficulty) doc.difficulty = difficulty;
      Object.assign(doc, jobFields(form, true));
      if (state.tab === "doubts") { doc.resolvedReplyId = null; doc.bounty = bounty; }
      if (state.tab === "challenges") {
        doc.chalType = form.elements.chalType ? form.elements.chalType.value : "Quiz";
        doc.timeLimit = Number(form.elements.chalTimeLimit ? form.elements.chalTimeLimit.value : 0);
        const chalSec = form.querySelector(".chal-ask-section");
        doc.questions = (chalSec && chalSec._getQuestions ? chalSec._getQuestions() : [])
          .filter(q => q.q.trim())
          .slice(0, 10)
          .map((q, qi) => ({ q: q.q.slice(0, 300), opts: (q.opts || []).map(o => String(o).slice(0, 150)), ans: encodeAns(Number(q.ans) || 0, id, qi) }));
        doc.status = "open";
      }
      const myC = getCampus(); if (myC) doc.campus = myC;
      // Show the new post straight away; the live update replaces it with the saved copy.
      state[t.coll] = [{ id, ...doc }, ...state[t.coll].filter(x => x.id !== id)];
      state.group = "All"; state.query = ""; $("search").value = "";
      openItem(id);
      notePosted();
      // Pages are saved first so classmates never see a post with missing pages.
      doc.pages = await trySavePages(newPages, id, pageIds);
      state[t.coll] = state[t.coll].map(x => x.id === id ? { ...x, pages: doc.pages } : x);
      await store.set(t.coll, id, doc);
    } catch (e2) {
      state.mode = "ask"; render();
      showNotice(errText(e2));
    }
  } },
    el("div", { class: "two" },
      el("label", {}, ({ doubts: "Your question", ideas: "Your idea", clubs: "Post title", gate: "Discussion title", challenges: "Challenge title", market: "Item title", jobs: "Opening or experience" })[state.tab] || "Title", el("input", { id: "f-title", name: "title", maxlength: "200", required: true, placeholder: t.placeholder })),
      el("label", {}, state.tab === "doubts" ? "Subject" : "Category", el("select", { id: "f-group", name: "group" }, groups.map(s => el("option", { selected: s === current }, s))))),
    state.tab === "jobs" && el("div", { class: "two" },
      el("label", {}, "Company / organisation", el("input", { name: "company", maxlength: "60", placeholder: "e.g. TCS", value: existing && existing.company || "" })),
      el("label", {}, "Pay / stipend (optional)", el("input", { name: "pay", maxlength: "40", placeholder: "e.g. ₹15,000 per month", value: existing && existing.pay || "" }))),
    state.tab === "jobs" && el("div", { class: "two" },
      el("label", {}, "Last date to apply", el("input", { name: "deadline", type: "date", value: existing && existing.deadline || "" })),
      el("label", {}, "Apply link (https)", el("input", { name: "applyUrl", type: "url", maxlength: "300", placeholder: "https://…", value: existing && existing.applyUrl || "" }))),
    (state.tab === "doubts" || state.tab === "gate") && el("div", { class: "two" },
      el("label", {}, "Your Batch Year",
        el("select", { id: "f-year", name: "year" },
          ["(Select year)", "E1", "E2", "E3", "E4"].map(y => el("option", { value: y === "(Select year)" ? "" : y, selected: existing ? existing.year === y : (state.yearFilter !== "All" && state.yearFilter === y) }, y))
        )
      ),
      el("label", {}, "Tags (optional)", el("input", { id: "f-tags", name: "tags", maxlength: "100", placeholder: "e.g. mid-1, unit-2, tricky" }))),
    state.tab === "gate" && el("div", { class: "gate-fields" },
      el("label", {}, "PYQ Year",
        el("select", { name: "pyqYear" },
          ["Not PYQ", "GATE 2025", "GATE 2024", "GATE 2023", "GATE 2022", "GATE 2021", "GATE 2020", "GATE 2019", "GATE 2018", "GATE 2017"].map(y =>
            el("option", { value: y === "Not PYQ" ? "" : y, selected: !!(existing && existing.pyqYear === y) }, y))
        )
      ),
      el("label", {}, "Marks",
        el("select", { name: "marks" },
          [["", "Not specified"], ["1M", "1 Mark"], ["2M", "2 Marks"]].map(([v, l]) =>
            el("option", { value: v, selected: !!(existing && existing.marks === v) }, l))
        )
      ),
      el("label", {}, "Difficulty",
        el("select", { name: "difficulty" },
          [["", "Not specified"], ["Easy", "🟢 Easy"], ["Medium", "🟡 Medium"], ["Hard", "🔴 Hard"]].map(([v, l]) =>
            el("option", { value: v, selected: !!(existing && existing.difficulty === v) }, l))
        )
      ),
    ),
    el("label", {}, "Details", el("textarea", { id: "f-body", name: "body", maxlength: "5000", placeholder: t.bodyHint })),
    existing && existing.pages && existing.pages.length ? el("p", { class: "hint" }, "This post already has " + existing.pages.length + " page(s). You can add up to " + Math.max(0, MAX_PAGES - existing.pages.length) + " more.") : null,
    attachPicker(newPages, existing ? MAX_PAGES - ((existing.pages || []).length) : MAX_PAGES),
    store.uploadFile ? filePicker(newFileLinks) : null,
    el("div", { class: "checks" },
      el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-anon", name: "anon", checked: !!(existing && existing.anonymous) }), "🙈 Post anonymously (classmates won't see your name)"),
      state.tab === "doubts" && el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-urgent", name: "urgent", checked: !!(existing && existing.urgent) }), "🔥 Urgent: exam or deadline soon"),
      state.tab === "doubts" && el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-bounty", name: "bounty", checked: !!(existing && existing.bounty) }), "🎁 Bounty: whoever solves this gets +5 bonus points")),
    state.tab === "challenges" && (() => {
      const chalSection = el("div", { class: "chal-ask-section" });
      const timeSel = el("select", { id: "f-chal-time", name: "chalTimeLimit", class: "chal-time-sel" },
        ...CHAL_LIMITS.map(v => el("option", { value: String(v), selected: !!(existing && existing.timeLimit === v) }, v === 0 ? "No time limit" : v + " minutes"))
      );
      const builderWrap = el("div", { id: "chal-builder-wrap" });
      let _questions = (existing && existing.questions) ? JSON.parse(JSON.stringify(existing.questions)) : [];
      const builder = renderChalQuizBuilder(q => { _questions = q; });
      builderWrap.append(builder);
      const typeSection = el("div", { class: "chal-type-row" },
        el("label", {}, "Challenge Type",
          el("div", { class: "chal-type-btns" },
            ...CHAL_TYPES.map(ct => {
              const cur2 = existing ? existing.chalType : CHAL_TYPES[0];
              return el("button", { type: "button", class: "chal-type-btn" + (ct === cur2 ? " selected" : ""),
                onclick: (e) => {
                  chalSection.querySelectorAll(".chal-type-btn").forEach(b => b.classList.remove("selected"));
                  e.currentTarget.classList.add("selected");
                  const hidden = chalSection.querySelector("[name=chalType]");
                  if (hidden) hidden.value = ct;
                  builderWrap.hidden = (ct !== "Quiz" && ct !== "Code Challenge");
                }
              }, CHAL_ICONS[ct] || "🎯", " ", ct);
            })
          ),
          el("input", { type: "hidden", name: "chalType", value: existing ? (existing.chalType || CHAL_TYPES[0]) : CHAL_TYPES[0] })
        )
      );
      builderWrap.hidden = !(!existing || existing.chalType === "Quiz" || existing.chalType === "Code Challenge");
      chalSection.append(
        typeSection,
        el("label", { class: "chal-time-label" }, "Time limit for participants",
          timeSel
        ),
        el("label", { class: "chal-builder-label" }, "MCQ Questions (optional for quiz/code challenges)",
          el("p", { class: "hint" }, "Add questions with 4 options each. Mark the correct answer. Participants get scored automatically.")
        ),
        builderWrap
      );
      // Store questions on submit via data attribute
      chalSection._getQuestions = () => _questions;
      return chalSection;
    })(),
    err,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "submit" }, label),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Cancel")));
  if (existing) { form.elements.title.value = existing.title || ""; form.elements.body.value = existing.body || ""; }
  // Smart subject detect: suggest subject based on keywords in title
  if (state.tab === "doubts" && !existing) {
    setTimeout(() => {
      const titleInp = form.elements.title, grpSel = form.elements.group;
      if (!titleInp || !grpSel) return;
      titleInp.addEventListener("input", () => {
        const s = detectSubject(titleInp.value);
        if (s) { grpSel.value = s; }
      });
    }, 0);
  }
  setTimeout(() => form.elements.title.focus(), 0);
  return [el("h2", {}, existing ? "Edit " + t.noun : t.ask), form];
}

function renderView() {
  if (state.tab === "market") return renderMarketView();
  const t = TABS[state.tab];
  const d = state[t.coll].find(x => x.id === state.selected);
  if (!d) return [el("p", { class: "hint" }, "This post was deleted or is still loading.")];
  if (isHidden(d)) return [el("p", { class: "hint" }, "🚩 This post was hidden after reports from classmates.")];
  const own = mine(d), reps = repliesFor(d.id), g = d[t.field];
  const out = [
    el("div", { class: "meta" },
      el("span", { class: "tag", ...colorAttrs(g) }, g),
      d.year && el("span", { class: "pill year-pill" }, d.year),
      state.tab === "doubts" && isUrgent(d) && el("span", { class: "pill urgent" }, "🔥 Urgent"),
      state.tab === "doubts" && el("span", { class: "pill " + (d.resolvedReplyId ? "done" : "open") }, d.resolvedReplyId ? "Resolved" : "Open"),
      state.tab === "doubts" && d.bounty && !d.resolvedReplyId && el("span", { class: "pill bounty" }, "🎁 Bounty"),
      d.campus && CAMPUSES.length > 0 && el("span", { class: "campus-badge", style: "--cc:" + campusColor(d.campus) }, d.campus),
      el("span", { class: "author-row" }, d.anonymous ? avatarEl("👤") : avatarEl(mine(d) ? getAvatar() : avatarFor(d.authorName || "")), "By " + who(d) + " · " + ago(d.createdAt))),
    el("h2", {}, d.title),
    d.tags && el("div", { class: "post-tags" }, ...d.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => el("span", { class: "post-tag" }, "#" + tag))),
  ];
  if (state.tab === "jobs") {
    const dl = jobDaysLeft(d), link = safeHttp(d.applyUrl);
    out.push(el("div", { class: "learn-card" },
      d.company && el("div", { class: "tl-trow" }, el("span", {}, "Company"), el("strong", {}, d.company)),
      d.pay && el("div", { class: "tl-trow" }, el("span", {}, "Pay / stipend"), el("strong", {}, d.pay)),
      d.deadline && el("div", { class: "tl-trow" }, el("span", {}, "Last date"), el("strong", {}, d.deadline + (dl != null ? " · " + jobDeadlineText(dl) : ""))),
      link && el("div", { class: "rowbtns" }, el("a", { class: "btn sm primary", href: link, target: "_blank", rel: "noopener noreferrer nofollow" }, "Apply / details ↗")),
      el("p", { class: "hint" }, "🛡️ Check the company's official website before applying. Never pay money for a job or internship.")));
  }
  if (d.body) { out.push(el("p", { class: "body" }, d.body)); const yc = renderYtCards(d.body); if (yc) out.push(yc); }
  // AI Help panel
  if (state.tab === "doubts" || state.tab === "gate") {
    const aiOpen = state.aiPanel === d.id;
    const q = encodeURIComponent((d.title || "") + (d.body ? "\n" + d.body : ""));
    const subj = encodeURIComponent(learnTerm(d.subject || d[t.field] || ""));
    const aiTools = [
      { name: "Gemini AI", icon: "✦", desc: "Google AI — best for students", color: "#1a73e8",
        url: "https://gemini.google.com/app?q=" + q },
      { name: "ChatGPT", icon: "🤖", desc: "Step-by-step answers", color: "#10a37f",
        url: "https://chat.openai.com/?q=" + q },
      { name: "Perplexity AI", icon: "🔍", desc: "Cited explanations", color: "#20b2aa",
        url: "https://www.perplexity.ai/search?q=" + q },
      { name: "Wolfram Alpha", icon: "∑", desc: "Math & engineering", color: "#e07b39",
        url: "https://www.wolframalpha.com/input?i=" + q },
      { name: "YouTube", icon: "▶", desc: "Video explanations", color: "#cc0000",
        url: "https://www.youtube.com/results?search_query=" + encodeURIComponent((d.subject || "") + " " + (d.title || "")) },
      { name: "NPTEL", icon: "🎓", desc: "IIT lecture notes", color: "#7c3aed",
        url: "https://nptel.ac.in/courses/search?q=" + subj },
      { name: "GeeksforGeeks", icon: "📄", desc: "Notes & code", color: "#2f8d46",
        url: "https://www.geeksforgeeks.org/search/?q=" + encodeURIComponent(d.title || "") },
      { name: "Google", icon: "G", desc: "Web search", color: "#4285f4",
        url: "https://www.google.com/search?q=" + q },
    ];
    out.push(
      el("div", { class: "ai-bar" },
        el("button", { type: "button", class: "ai-toggle" + (aiOpen ? " open" : ""),
          onclick: () => { state.aiPanel = aiOpen ? null : d.id; render(); }
        }, "🤖 Ask AI", el("span", { class: "ai-arr" }, aiOpen ? "▲" : "▼")),
        aiOpen && el("div", { class: "ai-panel" },
          el("p", { class: "ai-hint" }, "Your question is pre-loaded. Tap any tool to get an instant explanation."),
          el("div", { class: "ai-tools" },
            ...aiTools.map(tool => el("a", {
              href: tool.url, target: "_blank", rel: "noopener noreferrer",
              class: "ai-tool", style: "--tc:" + tool.color
            },
              el("span", { class: "ai-tool-icon" }, tool.icon),
              el("span", { class: "ai-tool-name" }, tool.name),
              el("span", { class: "ai-tool-desc" }, tool.desc)
            ))
          )
        )
      )
    );
  }
  if (d.pages && d.pages.length) out.push(pagesView(d.pages));
  if (d.fileAttachments && d.fileAttachments.length) out.push(renderFileAttachments(d.fileAttachments));

  // Challenge-specific UI
  if (state.tab === "challenges") {
    const chalType = d.chalType || "Quiz";
    const timeLimit = d.timeLimit || 0;
    const isClosed = d.status === "closed";
    const own = mine(d);
    out.push(
      el("div", { class: "chal-meta-row" },
        el("span", { class: "chal-type-badge" }, (CHAL_ICONS[chalType] || "🎯") + " " + chalType),
        timeLimit > 0 && el("span", { class: "pill" }, "⏱ " + timeLimit + " min"),
        isClosed && el("span", { class: "pill chal-closed" }, "🔒 Closed"),
        d.winner && el("span", { class: "pill chal-winner-pill" }, "🏆 " + (d.winnerName || "Winner chosen")),
        d.runnerUp && el("span", { class: "pill chal-runner-pill" }, "🥈 " + (d.runnerUpName || "Runner-up chosen"))
      )
    );
    if (d.questions && d.questions.length) {
      const quizEl = renderChalQuiz(d);
      if (quizEl) out.push(quizEl);
    } else {
      out.push(el("p", { class: "hint" }, "No MCQ questions — reply with your answer or idea below."));
    }
    out.push(renderChalLeaderboard(d));
    if (own) {
      out.push(
        el("div", { class: "rowbtns chal-host-btns" },
          !isClosed && el("button", { type: "button", class: "btn sm danger",
            onclick: (e) => {
              const b = e.currentTarget;
              if (b.dataset.armed) {
                store.update("challenges", d.id, { status: "closed" }).catch(ev => showNotice(errText(ev)));
                return;
              }
              b.dataset.armed = "1"; b.textContent = "Tap again to close";
              setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "🔒 Close challenge"; } }, 3000);
            }
          }, "🔒 Close challenge"),
          isClosed && el("button", { type: "button", class: "btn sm",
            onclick: () => store.update("challenges", d.id, { status: "open" }).catch(ev => showNotice(errText(ev)))
          }, "🔓 Re-open challenge")
        )
      );
    }
  }

  const actions = [];
  const on = liked(d.id), votes = likesFor(d.id).length;
  if (state.tab === "ideas") actions.push(el("button", { class: "like", type: "button", "aria-pressed": String(on), onclick: () => toggleLike(d) }, "♥ " + (on ? "Liked" : "Like") + " · " + votes));
  else if (!own) actions.push(el("button", { class: "like", type: "button", "aria-pressed": String(on), onclick: () => toggleLike(d) }, "🙋 " + (on ? "You have this doubt too" : "I have this doubt too") + " · " + votes));
  else if (votes) actions.push(el("span", { class: "likes" }, "🙋 " + votes + (votes === 1 ? " classmate has" : " classmates have") + " this doubt too"));
  const shareText = (state.tab === "doubts" ? "Can you help with this doubt? " : "Check out this idea: ") + d.title + " " + itemLink(d.id);
  if (navigator.share) {
    actions.push(el("button", { class: "btn sm", type: "button", onclick: async () => {
      try { await navigator.share({ title: d.title, text: shareText, url: itemLink(d.id) }); } catch (_) {}
    } }, "📤 Share"));
  } else {
    actions.push(el("a", { class: "btn sm wa", href: "https://wa.me/?text=" + encodeURIComponent(shareText), target: "_blank", rel: "noopener" }, "Share on WhatsApp"));
  }
  actions.push(el("button", { class: "btn sm", type: "button", onclick: (e) => copyLink(e.currentTarget, itemLink(d.id)) }, "Copy link"));
  if (own) {
    actions.push(el("button", { class: "linkbtn", type: "button", onclick: () => { state.mode = "edit"; render(); } }, "Edit"));
    actions.push(el("button", { class: "linkbtn danger", type: "button", onclick: (e) => confirmDelete(e.currentTarget, async () => {
      await softDelete(t.coll, d.id);
      state.selected = null; state.mode = "intro"; render();
    }) }, "Delete"));
  }
  const rep = reportButton(t.coll, d);
  if (rep) actions.push(rep);
  if (actions.length) out.push(el("div", { class: "rowbtns" }, actions));

  if (state.tab === "doubts") out.push(expertHelp(d));
  const list = el("div", { class: "answers" }, el("div", { class: "label" }, reps.length ? reps.length + " " + t.replyNoun + (reps.length === 1 ? "" : "s") : "No " + t.replyNoun + "s yet"));
  for (const r of reps) {
    if (isHidden(r)) { list.append(el("div", { class: "ans" }, el("p", { class: "hint" }, "🚩 This answer was hidden after reports from classmates."))); continue; }
    const best = state.tab === "doubts" && d.resolvedReplyId === r.id;
    const tools = [];
    if (own && state.tab === "doubts") tools.push(el("button", { class: "linkbtn", type: "button", onclick: () => { if (!best) celebrate(); store.update("doubts", d.id, { resolvedReplyId: best ? null : r.id }).catch(e => showNotice(errText(e))); } }, best ? "Unmark" : "Mark as helpful"));
    if (mine(r) || own) tools.push(el("button", { class: "linkbtn danger", type: "button", onclick: (e) => confirmDelete(e.currentTarget, async () => {
      if (best) await store.update("doubts", d.id, { resolvedReplyId: null });
      await softDelete("replies", r.id);
    }) }, "Delete"));
    list.append(el("div", { class: "ans" + (best ? " best" : "") + (isMentor(r) ? " mentor" : "") },
      el("div", { class: "who" }, r.anonymous ? avatarEl("👤") : avatarEl(mine(r) ? getAvatar() : avatarFor(r.authorName || "")), el("strong", {}, who(r)), isMentor(r) && el("span", { class: "pill mentor" }, "🎓 " + MENTORS.get(r.authorId)), el("span", {}, ago(r.createdAt)), best && el("span", { class: "pill done" }, "Helped"), ...tools, reportButton("replies", r)),
      r.body && r.body !== PAGE_ONLY && el("p", { class: "body" }, r.body),
      r.body && r.body !== PAGE_ONLY && renderYtCards(r.body),
      r.pages && r.pages.length ? pagesView(r.pages) : null,
      r.fileAttachments && r.fileAttachments.length ? renderFileAttachments(r.fileAttachments) : null,
      reactionBar(r)));
  }
  out.push(list);

  const replyFiles = [];
  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const body = form.elements.reply.value.trim();
    const pages = state.replyPages.slice();
    if (!body && !pages.length && !replyFiles.filter(f => f.url).length) return;
    if (!getName()) { state.afterName = "view"; state.mode = "name"; render(); return; }
    if (hasBadWords(body)) { showNotice(LANGUAGE_MSG); return; }
    if (replyFiles.some(f => f.pct !== undefined)) { showNotice("Please wait for uploads to finish."); return; }
    const wait = spamCheck();
    if (wait) { showNotice(wait); return; }
    notePosted();
    const id = store.newId("replies");
    const pageIds = pages.map(u => { const pid = store.newId("pages"); pageCache.set(pid, u); return pid; });
    const anonymous = state.replyAnon;
    const doc = { parentId: d.id, parentColl: t.coll, body: (body || PAGE_ONLY).slice(0, 5000), authorId: store.uid, authorName: anonymous ? ANON : getName(), anonymous, createdAt: Date.now(), pages: pageIds, fileAttachments: replyFiles.filter(f => f.url) };
    state.replies = [...state.replies, { id, ...doc }];
    state.replyPages = [];
    form.reset(); render();
    try {
      doc.pages = await trySavePages(pages, id, pageIds);
      await store.set("replies", id, doc);
    }
    catch (e2) { state.replies = state.replies.filter(x => x.id !== id); render(); showNotice(errText(e2)); }
  } },
    el("label", { for: "f-reply", class: "label" }, t.replyLabel),
    el("textarea", { id: "f-reply", name: "reply", maxlength: "5000", placeholder: state.tab === "doubts" ? "Explain step by step. Show the working, not only the result." : "Add a thought, an improvement, or offer to help build it." }),
    attachPicker(state.replyPages, MAX_PAGES),
    store.uploadFile ? filePicker(replyFiles) : null,
    el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-reply-anon", checked: state.replyAnon, onchange: (e) => { state.replyAnon = e.target.checked; } }), "🙈 Answer anonymously"),
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "submit" }, t.replyBtn)));
  out.push(form);
  return out;
}

async function toggleLike(d) {
  if (!store) return;
  const id = d.id + "_" + store.uid;
  const on = liked(d.id);
  const before = state.likes;
  state.likes = on ? state.likes.filter(l => l.id !== id) : [...state.likes, { id, ideaId: d.id, uid: store.uid }];
  render();
  try { on ? await store.remove("likes", id) : await store.set("likes", id, { ideaId: d.id, uid: store.uid, createdAt: Date.now() }); }
  catch (e) { state.likes = before; render(); showNotice(errText(e)); }
}

function confirmDelete(btn, action) {
  if (btn.dataset.armed) { btn.disabled = true; action().catch(e => showNotice(errText(e))); return; }
  const orig = btn.textContent;
  btn.dataset.armed = "1"; btn.textContent = "Tap again to delete";
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = orig; } }, 3000);
}

function openAsk() {
  state.mode = getName() ? "ask" : "name";
  if (!getName()) state.afterName = "ask";
  render();
  if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" });
}

let sheetKey = "";
function renderCampusPicker() {
  return [
    el("h2", {}, "🏫 Welcome to RGUKT Spark"),
    el("p", { class: "body" }, "Connect with students from all RGUKT campuses. Pick your campus to tag your posts — you'll still see doubts, ideas and clubs from everyone."),
    el("div", { class: "campus-picker-grid" },
      ...CAMPUSES.map(c => el("button", {
        type: "button", class: "campus-pick-btn",
        style: "--cc:" + campusColor(c),
        onclick: () => { setCampus(c); state.mode = "intro"; render(); },
      }, el("span", { class: "campus-pick-icon" }, CAMPUS_ICON[c] || "🏫"), el("span", { class: "campus-pick-name" }, c), el("span", { class: "campus-pick-sub" }, CAMPUS_FULL[c] || "RGUKT " + c)))
    ),
    el("p", { class: "hint" }, "You can change campus later from your name button."),
    el("button", { class: "btn", type: "button", onclick: () => { state.mode = "intro"; render(); } }, "Skip for now"),
  ];
}

// ---------- profile photo (DP) and 24-hour stories ----------
const STORY_MS = 86400000, STORY_SHOW = 5500, STORY_DAILY_MAX = 10;
const STORY_BG = [["#7c3aed", "#2563eb"], ["#db2777", "#f97316"], ["#059669", "#0ea5e9"], ["#f59e0b", "#ef4444"], ["#1e293b", "#6366f1"], ["#0d9488", "#84cc16"], ["#9333ea", "#ec4899"], ["#0f172a", "#334155"]];
const DP_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{20,40000}$/;
const IMG_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{20,700000}$/;
const getDp = () => { try { const v = localStorage.getItem("dd-dp"); return DP_OK.test(v || "") ? v : ""; } catch (_) { return ""; } };
let _dpSrc = null, _dpMap = new Map();
function dpByName(name) {
  if (_dpSrc !== state.profiles) { _dpSrc = state.profiles; _dpMap = new Map(); for (const p of [...state.profiles].sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0))) if (p.name && p.dp) _dpMap.set(p.name, p.dp); }
  return _dpMap.get(name) || "";
}
const getStatus = () => { try { return (localStorage.getItem("dd-status") || "").slice(0, 60); } catch (_) { return ""; } };
const statusOfId = (id) => { if (allMyIds().has(id)) return getStatus(); const p = state.profiles.find(x => x.id === id); return (p && p.status) || ""; };
const dpOfId = (id, name) => { const p = state.profiles.find(x => x.id === id); return (p && p.dp) || (allMyIds().has(id) && getDp()) || dbUrl(name || id); };
// Photo -> small JPEG data URL (square crop for DP). Nothing is uploaded until the student posts it.
async function imgToJpeg(file, max, q, square) {
  if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Choose a JPG, PNG or WebP photo.");
  if (file.size > 20 * 1024 * 1024) throw new Error("That photo is too large (max 20 MB).");
  const bmp = await createImageBitmap(file);
  let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
  if (square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
  const k = Math.min(1, max / Math.max(sw, sh)), cw = Math.max(1, Math.round(sw * k)), ch = Math.max(1, Math.round(sh * k));
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, cw, ch); g.drawImage(bmp, sx, sy, sw, sh, 0, 0, cw, ch);
  if (bmp.close) bmp.close();
  return c.toDataURL("image/jpeg", q);
}
async function syncProfile() {
  if (!store) return;
  const dp = getDp();
  const status = getStatus();
  if (!dp && !status && !state.profiles.some(p => p.id === store.uid)) return;
  await store.set("profiles", store.uid, { name: (getName() || "Student").slice(0, 40), dp, status, updatedAt: Date.now() });
}
function pickDp() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
  inp.addEventListener("change", async () => {
    try {
      const url = await imgToJpeg(inp.files[0], 96, 0.8, true);
      if (!DP_OK.test(url)) throw new Error("Could not use that photo. Try another one.");
      try { localStorage.setItem("dd-dp", url); } catch (_) {}
      await syncProfile(); showNotice("Profile photo updated ✅"); setTimeout(() => showNotice(""), 2500); render();
    } catch (e) { showNotice((e && e.message) || "Could not update the photo."); }
  });
  inp.click();
}
async function removeDp() { try { localStorage.removeItem("dd-dp"); await syncProfile(); } catch (_) {} render(); }

const seenSet = () => { try { return new Set(JSON.parse(localStorage.getItem("dd-seen") || "[]")); } catch (_) { return new Set(); } };
const markSeen = (id) => { const s = seenSet(); s.add(id); try { localStorage.setItem("dd-seen", JSON.stringify([...s].slice(-300))); } catch (_) {} };
const activeStories = () => { const cut = Date.now() - STORY_MS; return state.stories.filter(s => !s.deleted && s.createdAt > cut && !isHidden(s) && (s.kind === "text" ? !!s.text : !!s.pageId)).sort((a, b) => a.createdAt - b.createdAt); };
function storyGroups() {
  const m = new Map();
  for (const s of activeStories()) { if (!m.has(s.authorId)) m.set(s.authorId, { authorId: s.authorId, name: s.authorName || "Student", items: [] }); const g = m.get(s.authorId); g.items.push(s); g.name = s.authorName || g.name; }
  const seen = seenSet(), arr = [...m.values()], mineIds = allMyIds();
  for (const g of arr) { g.latest = g.items[g.items.length - 1].createdAt; g.unseen = g.items.some(s => !seen.has(s.id)); g.own = mineIds.has(g.authorId); }
  return arr.sort((a, b) => (b.own - a.own) || (b.unseen - a.unseen) || (b.latest - a.latest));
}
function renderStoryBar() {
  const bar = $("storyBar"); if (!bar) return;
  if (!store) { bar.hidden = true; return; }
  const groups = storyGroups(), own = groups.find(g => g.own);
  const bub = (g) => el("button", { type: "button", class: "st-bub", "aria-label": g.own ? "Your story" : g.name + "'s story", onclick: () => openStories(g.authorId) },
    el("span", { class: "st-ring" + (g.unseen ? " new" : " seen") }, avatarEl(dpOfId(g.authorId, g.name), "av st-av")),
    el("span", { class: "st-name" }, g.own ? "Your story" : g.name));
  const me = own ? bub(own) : el("button", { type: "button", class: "st-bub", "aria-label": "Add to your story", onclick: openStoryAdd },
    el("span", { class: "st-ring add" }, avatarEl(getAvatar(), "av st-av")), el("span", { class: "st-name" }, "Your story"));
  if (own) me.append(el("span", { class: "st-plus", role: "button", "aria-label": "Add another story", onclick: (e) => { e.stopPropagation(); openStoryAdd(); } }, "+"));
  else me.append(el("span", { class: "st-plus" }, "+"));
  bar.replaceChildren(me, ...groups.filter(g => !g.own).map(bub));
  bar.hidden = false;
}
function openStoryAdd() {
  if (!store) return;
  if (!getName()) { showPanel("name"); showNotice("Set your name first, then add your story."); return; }
  if (state.stories.filter(s => allMyIds().has(s.authorId) && Date.now() - s.createdAt < STORY_MS).length >= STORY_DAILY_MAX) { showNotice("You can add up to " + STORY_DAILY_MAX + " stories a day."); return; }
  let kind = "photo", img = "", bg = 0;
  const ov = el("div", { class: "st-view st-add", role: "dialog", "aria-modal": "true", "aria-label": "Add to your story" });
  const close = () => { ov.remove(); document.body.classList.remove("st-open"); };
  const err = el("p", { class: "hint st-err" }), prev = el("div", { class: "st-prev" });
  const cap = el("input", { type: "text", maxlength: "140", placeholder: "Add a caption (optional)", "aria-label": "Caption" });
  const txt = el("textarea", { maxlength: "200", rows: "4", placeholder: "Type your status…", "aria-label": "Story text" });
  const file = el("input", { type: "file", accept: "image/*", "aria-label": "Choose a photo" });
  file.addEventListener("change", async () => {
    err.textContent = ""; img = "";
    try {
      let u = await imgToJpeg(file.files[0], 720, 0.65, false); if (u.length > 280000) u = await imgToJpeg(file.files[0], 600, 0.5, false);
      if (!IMG_OK.test(u) || u.length > 280000) throw new Error("That photo is too big. Try a smaller one.");
      img = u; draw();
    } catch (e) { err.textContent = (e && e.message) || "Could not read that photo."; }
  });
  const post = el("button", { type: "button", class: "btn primary", onclick: async () => {
    err.textContent = "";
    if (kind === "photo" && !img) { err.textContent = "Choose a photo first."; return; }
    const t = txt.value.trim(); if (kind === "text" && !t) { err.textContent = "Type something first."; return; }
    post.disabled = true; post.textContent = "Posting…";
    try {
      const id = store.newId("stories"), now = Date.now(), doc = { authorId: store.uid, authorName: getName().slice(0, 40), kind, createdAt: now };
      if (kind === "photo") { const pid = store.newId("pages"); await store.set("pages", pid, { data: img, parentId: id, createdAt: now }); doc.pageId = pid; storyImgCache.set(pid, img); const c = cap.value.trim(); if (c) doc.caption = c.slice(0, 140); }
      else { doc.text = t.slice(0, 200); doc.bg = String(bg); }
      state.stories = [...state.stories, { id, ...doc }];
      await store.set("stories", id, doc);
      close(); renderStoryBar(); showNotice("Story posted for 24 hours ✅"); setTimeout(() => showNotice(""), 2500);
    } catch (e) { post.disabled = false; post.textContent = "Post story"; err.textContent = errText(e); }
  } }, "Post story");
  const draw = () => {
    prev.replaceChildren(kind === "photo"
      ? (img ? el("img", { class: "st-previmg", src: img, alt: "Preview" }) : el("div", { class: "st-ph" }, "📷 Tap below to choose a photo"))
      : el("div", { class: "st-textcard st-small" }, txt));
    if (kind === "text") { const g = STORY_BG[bg]; prev.firstChild.style.setProperty("background", "linear-gradient(135deg," + g[0] + "," + g[1] + ")"); }
    tabs.replaceChildren(...[["photo", "📷 Photo"], ["text", "✍️ Text"]].map(([k, l]) => el("button", { type: "button", class: "btn sm" + (kind === k ? " primary" : ""), onclick: () => { kind = k; draw(); } }, l)));
    sw.hidden = kind !== "text"; file.hidden = kind !== "photo"; cap.hidden = kind !== "photo";
  };
  const tabs = el("div", { class: "rowbtns" });
  const sw = el("div", { class: "st-sw" }, STORY_BG.map((g, i) => { const b = el("button", { type: "button", class: "st-swb", "aria-label": "Colour " + (i + 1), onclick: () => { bg = i; draw(); } }); b.style.setProperty("background", "linear-gradient(135deg," + g[0] + "," + g[1] + ")"); return b; }));
  ov.append(el("div", { class: "st-card" }, el("div", { class: "st-head" }, el("strong", {}, "Add to your story"), el("button", { type: "button", class: "st-x", "aria-label": "Close", onclick: close }, "✕")),
    el("p", { class: "hint" }, "Everyone on RGUKT Spark can see it for 24 hours. Keep it friendly. Reported stories are hidden."),
    tabs, prev, sw, file, cap, err, post));
  document.body.append(ov); document.body.classList.add("st-open"); draw();
}
const storyImgCache = new Map();
async function storyImage(pid) {
  if (storyImgCache.has(pid)) return storyImgCache.get(pid);
  const d = await store.get("pages", pid); const u = d && d.data;
  if (!IMG_OK.test(u || "")) throw new Error("Photo unavailable");
  storyImgCache.set(pid, u); return u;
}
function openStories(authorId) {
  const gs = storyGroups(); let gi = gs.findIndex(g => g.authorId === authorId); if (gi < 0 || !store) return;
  const seen = seenSet(); let ii = Math.max(0, gs[gi].items.findIndex(s => !seen.has(s.id)));
  const ov = el("div", { class: "st-view", role: "dialog", "aria-modal": "true", "aria-label": "Story" });
  document.body.append(ov); document.body.classList.add("st-open");
  let timer = null, gen = 0;
  const close = () => { clearTimeout(timer); gen++; ov.remove(); document.body.classList.remove("st-open"); document.removeEventListener("keydown", key); renderStoryBar(); };
  const next = () => { const g = gs[gi]; if (ii < g.items.length - 1) ii++; else if (gi < gs.length - 1) { gi++; ii = 0; } else { close(); return; } show(); };
  const prev = () => { if (ii > 0) ii--; else if (gi > 0) { gi--; ii = 0; } show(); };
  const key = (e) => { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") next(); else if (e.key === "ArrowLeft") prev(); };
  document.addEventListener("keydown", key);
  async function show() {
    clearTimeout(timer); const my = ++gen, g = gs[gi], s = g.items[ii], ownS = g.own;
    markSeen(s.id);
    if (!ownS && !state.storyViews.some(v => v.id === s.id + "_" + store.uid)) { const v = { storyId: s.id, uid: store.uid, name: (getName() || "Student").slice(0, 40), createdAt: Date.now() }; state.storyViews = [...state.storyViews, { id: s.id + "_" + store.uid, ...v }]; store.set("storyViews", s.id + "_" + store.uid, v).catch(() => {}); }
    const fill = el("span", { class: "st-fill" });
    const segs = g.items.map((_, k) => el("span", { class: "st-seg" + (k < ii ? " done" : "") }, k === ii ? fill : null));
    const body = el("div", { class: "st-body" });
    const viewers = ownS ? [...new Map(state.storyViews.filter(v => v.storyId === s.id).map(v => [v.uid, v.name])).values()] : [];
    const vlist = el("div", { class: "st-viewers", hidden: true }, el("strong", {}, "👁 Seen by " + viewers.length), ...viewers.map(n => el("div", {}, n)), !viewers.length && el("small", {}, "No views yet"));
    const actions = ownS
      ? [el("button", { type: "button", class: "st-x", "aria-label": "Who saw this", onclick: () => { vlist.hidden = !vlist.hidden; } }, "👁 " + viewers.length),
         el("button", { type: "button", class: "st-x", "aria-label": "Delete story", onclick: async () => { if (!confirm("Delete this story?")) return; try { await softDelete("stories", s.id); state.stories = state.stories.filter(x => x.id !== s.id); close(); } catch (e) { showNotice(errText(e)); } } }, "🗑")]
      : [el("button", { type: "button", class: "st-x", "aria-label": "Report story", onclick: async () => { if (!confirm("Report this story as inappropriate?")) return; try { const reports = [...new Set([...(s.reports || []), store.uid])].slice(0, 100); s.reports = reports; await store.update("stories", s.id, { reports }); showNotice("Reported. Thank you."); setTimeout(() => showNotice(""), 2500); } catch (e) { showNotice(errText(e)); } next(); } }, "🚩")];
    ov.replaceChildren(
      el("div", { class: "st-bars" }, segs),
      el("div", { class: "st-top" }, avatarEl(dpOfId(g.authorId, g.name), "av st-av sm"), el("div", { class: "st-who" }, el("strong", {}, ownS ? "Your story" : g.name), el("small", {}, ago(s.createdAt) + (statusOfId(g.authorId) ? " · " + statusOfId(g.authorId) : ""))), ...actions, el("button", { type: "button", class: "st-x", "aria-label": "Close", onclick: close }, "✕")),
      body, vlist,
      el("button", { type: "button", class: "st-tap l", "aria-label": "Previous", onclick: prev }), el("button", { type: "button", class: "st-tap r", "aria-label": "Next", onclick: next }));
    const run = (ms) => { if (my !== gen) return; fill.style.setProperty("animation-duration", ms + "ms"); fill.classList.add("run"); timer = setTimeout(next, ms); };
    if (s.kind === "text") {
      const c = STORY_BG[Number(s.bg)] || STORY_BG[0], card = el("div", { class: "st-textcard" }, s.text); card.style.setProperty("background", "linear-gradient(135deg," + c[0] + "," + c[1] + ")"); body.append(card); run(STORY_SHOW + 1500);
    } else {
      body.append(el("p", { class: "st-load" }, "Loading…"));
      storyImage(s.pageId).then(u => { if (my !== gen) return; body.replaceChildren(el("img", { class: "st-img", src: u, alt: "Story photo" }), s.caption ? el("p", { class: "st-cap" }, s.caption) : null); run(STORY_SHOW); })
        .catch(() => { if (my !== gen) return; body.replaceChildren(el("p", { class: "st-load" }, "Could not load this photo.")); run(2500); });
    }
  }
  show();
}

function render() {
  try {
    document.body.dataset.tab = state.tab;
    renderHeader(); renderTrendBar(); renderStoryBar(); renderRail(); renderList(); renderBottomNav();
    // Forms keep what the student is typing while live updates arrive.
    const key = ["ask", "edit", "name", "alumniJoin", "alumniJob", "fun", "lab"].includes(state.mode) ? state.mode + state.tab : "";
    if (key && key === sheetKey) return;
    sheetKey = key;
    const draft = $("f-reply") ? $("f-reply").value : "";
    const t = TABS[state.tab];
    const cur = ["view", "edit"].includes(state.mode) && state[t.coll].find(x => x.id === state.selected);
    const ca = colorAttrs(cur ? cur[t.field] : "All");
    const sheet = $("sheet");
    sheet.setAttribute("data-s", ca["data-s"]);
    sheet.style.cssText = ""; if (ca.style) applyStyle(sheet, ca.style);
    sheet.replaceChildren(...(
      state.mode === "leaders" ? renderLeaders() :
      state.mode === "quiz" ? renderQuiz() :
      state.mode === "me" ? renderMe() :
      state.mode === "learn" ? renderLearn() :
      state.mode === "resources" ? renderResources() :
      state.mode === "career" ? renderCareer() :
      state.mode === "about" ? renderAbout() :
      state.mode === "lab" ? renderLab() :
      state.mode === "fun" ? renderFun() :
      state.mode === "alumni" ? renderAlumni() :
      state.mode === "alumniJoin" ? alumniForm("profile") :
      state.mode === "alumniJob" ? alumniForm("job") :
      state.mode === "network" ? renderNetwork() :
      state.mode === "name" ? renderName() :
      state.mode === "campus" ? renderCampusPicker() :
      state.mode === "ask" ? renderAsk() :
      state.mode === "edit" && cur ? renderAsk(cur) :
      state.mode === "view" || state.mode === "edit" ? renderView() : renderIntro()));
    if (draft && $("f-reply")) $("f-reply").value = draft;
  } catch(err) {
    console.error("render error:", err);
    const sheet = $("sheet");
    if (sheet) sheet.replaceChildren(
      el("div", { class: "render-err" },
        el("div", { class: "render-err-icon" }, "⚠️"),
        el("div", { class: "render-err-msg" }, "Something went wrong loading the page."),
        el("button", { type: "button", class: "btn primary", onclick: () => {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
              Promise.all(regs.map(r => r.unregister())).then(() => location.reload(true));
            }).catch(() => location.reload(true));
          } else { location.reload(true); }
        }}, "🔄 Tap here to reload the app"),
        el("div", { class: "render-err-hint" }, "This clears old cache and loads the latest version."),
      )
    );
  }
}

// ---------- events ----------
document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
  const toJobs = b.dataset.tab === "jobs";   // the Jobs tab opens the board itself, not the post form
  if (state.tab === b.dataset.tab) { if (toJobs) { $("rail").scrollIntoView({ behavior: "smooth", block: "start" }); return; } openAsk(); return; }
  state.tab = b.dataset.tab; state.group = "All"; state.filter = "all"; state.query = "";
  state.selected = null; state.mode = "intro"; $("search").value = "";
  try { history.replaceState(null, "", "#" + state.tab); } catch (_) {}
  render(); if (toJobs) { $("rail").scrollIntoView({ block: "start" }); return; } openAsk();
}));
$("askBtn").addEventListener("click", openAsk);
const showPanel = (mode) => { state.mode = mode; render(); if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" }); };
$("leadersBtn").addEventListener("click", () => showPanel("leaders"));
$("networkBtn") && $("networkBtn").addEventListener("click", () => showPanel("network"));
$("quizBtn").addEventListener("click", () => showPanel("quiz"));
$("learnBtn").addEventListener("click", () => showPanel("learn"));
$("studyBtn").addEventListener("click", () => showPanel("resources"));
$("filterToggle").addEventListener("click", () => { document.querySelector("header.top").classList.toggle("filters-open"); renderHeader(); });
$("botBtn").addEventListener("click", () => { if (window.sparkBotToggle) window.sparkBotToggle(); });
$("alumniBtn").addEventListener("click", () => { alumniView = "dir"; showPanel("alumni"); });
$("funBtn").addEventListener("click", () => showPanel("fun"));
$("labBtn").addEventListener("click", () => showPanel("lab"));
window.sparkOpenPlayer = () => { window.__funStart = "player"; sheetKey = ""; showPanel("fun"); };
$("aboutBtn").addEventListener("click", () => showPanel("about"));
$("careerBtn").addEventListener("click", () => { careerBranch = null; showPanel("career"); });
$("nameBtn").addEventListener("click", () => { state.afterName = null; showPanel(getName() ? "me" : "name"); });
$("search").addEventListener("input", (e) => { state.query = e.target.value; renderList(); });
$("filter").addEventListener("change", (e) => { state.filter = e.target.value; renderList(); });

// Theme toggle
(function initTheme() {
  try {
    const saved = localStorage.getItem("dd-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch (_) {}
})();
const themeBtn = document.getElementById("themeBtn");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark"
      || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    themeBtn.textContent = next === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem("dd-theme", next); } catch (_) {}
  });
  // Set icon to match current theme
  const isDark = document.documentElement.getAttribute("data-theme") === "dark"
    || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  themeBtn.textContent = isDark ? "☀️" : "🌙";
}


// Update page title from config
if (CFG.title) { document.title = CFG.title; }

// ---------- start ----------
renderExams();
startCaptions();
const deep = /^#(doubts|ideas|clubs|gate|challenges|jobs|market)(?:\/([\w-]+))?$/.exec(location.hash);
if (deep) state.tab = deep[1];
// Show board immediately — Firebase will fill it in once connected
state.loaded = true;
// First-time campus pick
if (CAMPUSES.length > 0 && !getCampus() && !deep) state.mode = "campus";
render();
(async () => {
  const conf = CFG.firebase || {};
  const configured = conf.apiKey && !String(conf.apiKey).startsWith("PASTE") && conf.projectId;
  try {
    const sbConf = CFG.supabase || {};
    const useSupabase = sbConf.url && sbConf.anonKey && !String(sbConf.url).startsWith("PASTE");
    store = useSupabase ? await supabaseStore(sbConf) : configured ? await firebaseStore(conf, "rooms/GB-9FE9YR/") : localStore();
  } catch (e) {
    console.error(e);
    showNotice("Could not connect to the class board. Check your internet and reload. (" + ((e && e.code) || "error") + ")");
    return;
  }
  if (store.demo) showNotice("Demo mode: posts are saved only in this browser. Add your Firebase settings to config.js so the whole class shares one board.", "demo");
  const live = (rows) => rows.filter(x => !x.deleted);
  let opened = false;
  const onErr = (e) => {
    showNotice("Database error: " + ((e && e.code) || (e && e.message) || "unknown") + " — reload or check internet.");
  };
  const update = () => {
    if (!opened && deep && deep[2] && state[TABS[state.tab].coll].some(x => x.id === deep[2])) { opened = true; openItem(deep[2]); return; }
    render();
  };
  store.subscribe("doubts", rows => { const live_ = live(rows); trackNew("doubts", live_); state.doubts = live_; update(); }, onErr);
  store.subscribe("ideas", rows => { const live_ = live(rows); trackNew("ideas", live_); state.ideas = live_; update(); }, onErr);
  store.subscribe("replies", rows => { state.replies = live(rows); update(); }, onErr);
  store.subscribe("likes", rows => { state.likes = rows; update(); }, onErr);
  store.subscribe("clubs", rows => { const live_ = live(rows); trackNew("clubs", live_); state.clubs = live_; update(); }, e => {});
  store.subscribe("gate", rows => { const live_ = live(rows); trackNew("gate", live_); state.gate = live_; update(); }, e => {});
  let dpChecked = false;
  store.subscribe("profiles", rows => {
    state.profiles = rows.filter(p => typeof p.name === "string" && (!p.dp || DP_OK.test(p.dp))).map(p => ({ ...p, status: String(p.status || "").slice(0, 60) })); update();
    if (!dpChecked && (getDp() || getStatus())) { dpChecked = true; const me = rows.find(p => p.id === store.uid); if (!me || (me.dp || "") !== getDp() || me.name !== getName() || (me.status || "") !== getStatus()) syncProfile().catch(() => {}); }
  }, e => {});
  const since = Date.now() - STORY_MS;
  store.subscribe("stories", rows => { state.stories = rows.filter(x => !x.deleted); renderStoryBar(); }, e => {}, since);
  store.subscribe("storyViews", rows => { state.storyViews = rows; }, e => {}, since);
  store.subscribe("jobs", rows => { const live_ = live(rows); trackNew("jobs", live_); state.jobs = live_; update(); }, e => {});
  store.subscribe("challenges", rows => { const live_ = live(rows); trackNew("challenges", live_); state.challenges = live_; update(); }, e => {});
  store.subscribe("chal_scores", rows => { state.chalScores = rows.filter(r => !r.deleted); update(); }, e => {});
  store.subscribe("market", rows => { state.market = live(rows); update(); }, e => {});
  store.subscribe("marketReports", rows => { state.marketReports = rows; update(); }, e => {});
  store.subscribe("marketRatings", rows => { state.marketRatings = rows; update(); }, e => {});
  store.subscribe("marketInterests", rows => { state.marketInterests = rows.filter(r => !r.deleted); update(); }, e => {});
})();

// ---------- PWA, keyboard shortcuts, offline, FAB ----------

// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js?v=38').catch(() => {});
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  if (e.key === '/' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); $('search').focus(); $('search').select(); }
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openAsk(); }
  if (e.key === 'Escape') { if (state.mode !== 'intro') { state.mode = 'intro'; state.selected = null; render(); } }
});

// Offline status
updateNetStatus();

// FAB
const fabAsk = $('fabAsk');
if (fabAsk) fabAsk.addEventListener('click', openAsk);

// New-posts toast: dismiss on tap
const newToast = $('newToast');
if (newToast) {
  newToast.addEventListener('click', () => {
    _newCount = 0; newToast.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// PWA install banner
const installBtn = $('installBtn');
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!_pwaPrompt) return;
    _pwaPrompt.prompt();
    const { outcome } = await _pwaPrompt.userChoice;
    _pwaPrompt = null;
    const banner = $('installBanner'); if (banner) banner.hidden = true;
    if (outcome === 'accepted') showNotice('App installed! Open it from your home screen.', '');
  });
}
const installDismiss = $('installDismiss');
if (installDismiss) {
  installDismiss.addEventListener('click', () => {
    const banner = $('installBanner'); if (banner) banner.hidden = true;
    try { localStorage.setItem('dd-install-dismissed', '1'); } catch (_) {}
  });
}
// Don't show install banner again if dismissed
try { if (localStorage.getItem('dd-install-dismissed')) { const b = $('installBanner'); if (b) b.hidden = true; } } catch (_) {}

// ---------- smart subject detection ----------
const SUBJECT_KEYWORDS = {
  "DLD":     ["flip flop","nand","nor","xor","gates","karnaugh","kmap","mux","decoder","encoder","counter","boolean","logic","sequential","combinational","register"],
  "DSP":     ["z-transform","ztransform","fft","dft","filter","signal","sampling","nyquist","convolution","dtft","bibo","iir","fir","pole","zero","frequency response"],
  "CN":      ["tcp","ip","udp","network","osi","router","switch","http","dns","socket","subnet","mac","ethernet","bandwidth","latency","protocol","packet"],
  "AEC":     ["op-amp","opamp","bjt","mosfet","transistor","amplifier","feedback","diode","rectifier","biasing","gain","voltage","current","differential"],
  "CS":      ["modulation","demodulation","am","fm","ssb","dsb","bandwidth","carrier","noise","snr","channel","radar","antenna"],
  "PRV":     ["probability","random","gaussian","normal","poisson","bayes","variance","mean","pdf","cdf","expected value","markov","stochastic"],
  "RFME":    ["microwave","waveguide","vswr","transmission line","antenna","klystron","gunn","s-parameter","smith chart","rf"],
  "CO & D":  ["pipeline","instruction","cache","memory","cpu","alu","register","assembly","risc","cisc","addressing","bus","interrupt"],
  "DS & A":  ["array","linked list","stack","queue","tree","graph","sort","search","recursion","dynamic programming","bfs","dfs","heap","hash","complexity"],
  "OS":      ["process","thread","deadlock","semaphore","mutex","scheduling","page","memory","file system","ipc","fork","kernel","virtual memory"],
  "DBMS":    ["sql","database","table","query","join","normalization","index","transaction","acid","schema","relational","nosql","er diagram","trigger"],
  "OOP":     ["class","object","inheritance","polymorphism","encapsulation","abstraction","java","python","constructor","interface","override","overload"],
  "TOC":     ["automata","dfa","nfa","regular","grammar","pushdown","turing","halting","context free","language","regex","chomsky"],
  "CD":      ["compiler","lexical","parser","syntax","semantic","token","grammar","llr","slr","lalr","code generation","optimization"],
  "SE":      ["agile","scrum","waterfall","sdlc","requirement","testing","uml","sprint","use case","project","design pattern"],
  "Python":  ["python","list","dictionary","tuple","function","class","loop","numpy","pandas","matplotlib","lambda","import"],
  "Maths":   ["graph theory","set","logic","proof","combinatorics","permutation","combination","discrete","number theory","matrix","eigen"],
  "SOM":     ["stress","strain","beam","bending","shear","deflection","column","truss","elastic","modulus","moment of inertia"],
  "FM":      ["fluid","flow","pressure","bernoulli","viscosity","pipe","turbulent","laminar","reynolds","pump","continuity"],
  "Struct":  ["structure","frame","load","analysis","stiffness","displacement","reaction","force","method of joints"],
  "Geo":     ["soil","clay","sand","consolidation","permeability","bearing capacity","foundation","compaction","shear strength"],
  "Trans":   ["highway","traffic","pavement","gradient","curve","road","alignment","bitumen","vehicle","sight distance"],
  "Env":     ["water treatment","sewage","pollution","bod","cod","sedimentation","chlorination","filtration","effluent"],
  "Survey":  ["levelling","theodolite","traverse","chain","bearing","contour","tacheometry","total station","gps","gis"],
  "Thermo":  ["thermodynamics","entropy","enthalpy","carnot","rankine","brayton","heat","work","temperature","ideal gas","specific heat"],
  "FM-M":    ["pump","turbine","hydraulic","manometer","orifice","weir","pelton","francis","kaplan","cavitation"],
  "MD":      ["gear","shaft","key","bearing","spring","design","fatigue","stress concentration","factor of safety","coupling"],
  "MOM":     ["mechanics","torsion","deflection","strain energy","columns","buckling","euler","cantilever","simply supported"],
  "Mfg":     ["casting","welding","machining","lathe","milling","forging","forming","tolerance","tool life","cutting"],
  "HT":      ["conduction","convection","radiation","heat transfer","fourier","biot","nusselt","prandtl","stefan","fin"],
  "IC Eng":  ["diesel","petrol","compression ratio","efficiency","valve","piston","carburetor","injection","engine","combustion"],
  "Circuits":["kirchhoff","mesh","nodal","thevenin","norton","superposition","impedance","ac","dc","resistor","capacitor","inductor","phasor"],
  "EM":      ["transformer","motor","generator","induction","synchronous","flux","torque","speed","rotor","stator","slip"],
  "PS":      ["power system","transmission","distribution","bus","load flow","fault","protection","relay","stability","per unit"],
  "PE":      ["inverter","rectifier","converter","chopper","pwm","thyristor","scr","mosfet","power electronics","drive"],
  "Control": ["control system","transfer function","laplace","bode","root locus","nyquist","pid","stability","gain margin","phase"],
  "EMS":     ["measurement","instrument","sensor","error","bridge","voltmeter","ammeter","wattmeter","calibration"],
  "PQ":      ["power quality","harmonic","distortion","flicker","sag","swell","transient","thd","reactive power","compensation"],
};
function detectSubject(text) {
  const t = text.toLowerCase();
  let best = null, bestCount = 0;
  for (const [subj, words] of Object.entries(SUBJECT_KEYWORDS)) {
    const count = words.filter(w => t.includes(w)).length;
    if (count > bestCount) { bestCount = count; best = subj; }
  }
  return bestCount > 0 ? best : null;
}

// ---------- floating particles ----------
(function startParticles() {
  const c = document.getElementById("particles");
  if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = c.getContext("2d");
  const icons = ["💡","🔬","⚡","📐","🧮","🔭","💻","🛠","📡","🎓","🧠","🔋"];
  let W, H, pts = [];
  function resize() {
    W = c.width = innerWidth; H = c.height = Math.min(200, innerHeight * 0.25);
  }
  resize();
  addEventListener("resize", resize);
  for (let i = 0; i < 18; i++) pts.push({
    x: Math.random() * 1000, y: Math.random() * 200,
    vx: (Math.random() - 0.5) * 0.4, vy: -0.2 - Math.random() * 0.3,
    icon: icons[i % icons.length], size: 13 + Math.random() * 10,
    alpha: 0.12 + Math.random() * 0.18,
  });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x = (p.x + p.vx + W) % W;
      p.y = p.y + p.vy;
      if (p.y < -30) { p.y = H + 10; p.x = Math.random() * W; }
      ctx.globalAlpha = p.alpha;
      ctx.font = p.size + "px serif";
      ctx.fillText(p.icon, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

// ---------- 3D card tilt ----------
document.addEventListener("mousemove", (e) => {
  const card = e.target.closest(".item, .spot, .learn-card, .badge.got");
  if (!card) return;
  const r = card.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
  card.style.transform = `perspective(600px) rotateY(${dx * 6}deg) rotateX(${-dy * 4}deg) scale(1.02)`;
});
document.addEventListener("mouseleave", (e) => {
  const card = e.target.closest(".item, .spot, .learn-card, .badge.got");
  if (card) card.style.transform = "";
}, true);

// ---------- button ripple ----------
document.addEventListener("pointerdown", (e) => {
  const btn = e.target.closest("button.btn, button.chip");
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  const rip = document.createElement("span");
  rip.className = "ripple";
  rip.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
  btn.appendChild(rip);
  setTimeout(() => rip.remove(), 600);
});
