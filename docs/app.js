// Doubt Desk: class board for doubts and ideas.
// Data lives in Firebase Firestore when config.js has Firebase settings, otherwise in this browser (demo mode).

const CFG = window.DOUBT_DESK_CONFIG || {};
const SUBJECTS = (CFG.subjects && CFG.subjects.length) ? CFG.subjects : ["Maths", "Physics", "Chemistry", "Other"];
const CATS = (CFG.ideaCategories && CFG.ideaCategories.length) ? CFG.ideaCategories : ["Project", "Other"];
const CLUBS = (CFG.clubs && CFG.clubs.length) ? CFG.clubs : ["Coding Club", "Other"];

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
  market: {
    coll: "market", field: "category", groups: ["Books", "Notes", "Electronics", "Hostel", "Clothing", "Other"], groupLabel: "Category", noun: "listing",
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

const state = {
  tab: "doubts", group: "All", query: "", filter: "all",
  doubts: [], ideas: [], clubs: [], gate: [], challenges: [], chalScores: [], market: [], marketReports: [], marketRatings: [], marketInterests: [], replies: [], likes: [], loaded: false,
  selected: null, mode: "intro", // intro | view | ask | edit | name | campus
  afterName: null,
  replyPages: [], replyAnon: false,
  campusFilter: "all", // "all" | campus name
  mktSort: "newest",   // "newest" | "price_asc" | "price_desc" | "popular"
  dept: "All",         // "All" | "ECE" | "CSE" | "Civil" | "Mech" | "EEE"
  yearFilter: "All",   // "All" | "E1" | "E2" | "E3" | "E4"
  gateYearPick: null,  // null | "2024" | "2023" …
  aiPanel: null,       // post id that has AI panel open
};
const ANON = "Anonymous";
let store = null;
const $ = (id) => document.getElementById(id);

// ---------- small helpers ----------
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
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
function getAvatar() { try { return localStorage.getItem("dd-avatar") || AVATARS[0]; } catch (_) { return AVATARS[0]; } }
function setAvatar(v) { try { localStorage.setItem("dd-avatar", v); } catch (_) {} }
// Avatar for any user by name — returns DiceBear URL for a consistent illustrated portrait
function avatarFor(name) {
  if (!name || name === ANON) return "👤";
  return dbUrl(name);
}
const AVATAR_ALLOWED = /^https:\/\/api\.dicebear\.com\//;
// Render a small avatar circle element; accepts emoji string or a safe DiceBear URL (renders <img>)
function avatarEl(icon, cls = "av") {
  if (icon && AVATAR_ALLOWED.test(icon)) {
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
  const code = (e && e.code) || "";
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
  return new Set(hist);
}
async function firebaseStore(conf, prefix = "") {
  const base = "https://www.gstatic.com/firebasejs/" + FB_VERSION + "/";
  const [{ initializeApp }, fs, st] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-storage.js")]);
  const app = initializeApp(conf);
  const db = fs.getFirestore(app);
  const storage = st.getStorage(app);
  return {
    uid: deviceId(), demo: false,
    subscribe: (coll, cb, onErr) => fs.onSnapshot(fs.collection(db, prefix + coll), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr),
    newId: (coll) => fs.doc(fs.collection(db, prefix + coll)).id,
    set: (coll, id, data) => fs.setDoc(fs.doc(db, prefix + coll, id), data),
    update: (coll, id, data) => fs.updateDoc(fs.doc(db, prefix + coll, id), data),
    remove: (coll, id) => fs.deleteDoc(fs.doc(db, prefix + coll, id)),
    get: async (coll, id) => { const snap = await fs.getDoc(fs.doc(db, prefix + coll, id)); return snap.exists() ? snap.data() : null; },
    uploadFile: async (file, onProgress) => {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
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
        if (state.tab === tab) return;
        state.tab = tab; state.group = 'All'; state.filter = 'all'; state.query = '';
        state.selected = null; state.mode = 'intro'; state.gateYearPick = null; $('search').value = '';
        try { history.replaceState(null, '', '#' + tab); } catch (_) {} render();
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
            onclick: () => { state.campusFilter = c; render(); }
          }, c === "all" ? "🌐 All" : c)
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
            onclick: () => { state.yearFilter = y; render(); }
          }, y === "All" ? "All Years" : y)
        )
      );
    }
    // Trending subject
    const tr = trendingSubject();
    const trEl = $("trending");
    if (trEl) { trEl.hidden = !tr; if (tr) trEl.textContent = "📈 Trending now: " + tr; }
  }
  $("quizBtn").classList.toggle("dot", !!(store && state.loaded && QUIZ.length && !myQuizAnswer(dayNum())));
  $("search").placeholder = state.tab === "doubts" ? "Search doubts" : state.tab === "gate" ? "Search GATE discussions" : state.tab === "market" ? "Search listings" : "Search ideas";
  $("rail").setAttribute("aria-label", t.groupLabel);
  const opts = state.tab === "doubts"
    ? [["all","Newest"],["asked","Most asked"],["open","Unanswered"],["mine","My posts"],["mentor","Needs mentor"],["done","Resolved"],["bounty","🎁 Bounty"]]
    : state.tab === "gate"
    ? [["all","Newest"],["mine","My posts"],["pyq","⭐ PYQ Only"],["1m","1️⃣ 1 Mark"],["2m","2️⃣ 2 Marks"],["easy","🟢 Easy"],["medium","🟡 Medium"],["hard","🔴 Hard"]]
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
      onclick: () => { state.group = state.group === s ? "All" : s; render(); },
    }, el("span", {}, s), el("span", { class: "n" }, counts[s] || 0)))
  ) : null;
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
  rows.sort((a, b) => b.createdAt - a.createdAt);
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
        el("div", { class: "hint" }, availCount + " item" + (availCount !== 1 ? "s" : "") + " available"),
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
  if (!rows.length) {
    $("list").replaceChildren(
      mktBanner,
      state.market.length
        ? el("div", { class: "empty" }, el("strong", {}, "Nothing matches"), " Try another category or clear the search.")
        : el("div", { class: "empty" }, el("strong", {}, "No listings yet"), " Be the first to sell something!")
    );
    return;
  }
  $("list").replaceChildren(
    mktBanner,
    el("div", { class: "mkt-grid" },
      ...rows.map(d => {
        const condColor = CONDITION_COLOR[d.condition] || "#6b7280";
        return el("div", { class: "item-wrap" },
          el("button", { type: "button", class: "mkt-card" + (d.sold ? " mkt-sold" : ""), onclick: () => openItem(d.id) },
            el("div", { class: "mkt-card-top" },
              el("span", { class: "tag", ...colorAttrs(d.category) }, d.category),
              d.sold ? el("span", { class: "pill done" }, "✅ Sold") : el("span", { class: "pill open" }, "Available"),
            ),
            el("h3", { class: "mkt-title" }, d.title),
            el("div", { class: "mkt-price-row" },
              d.price ? el("span", { class: "mkt-price" }, "₹" + d.price) : el("span", { class: "mkt-price free" }, "Free / Negotiable"),
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
    d.price ? el("div", { class: "mkt-price-big" }, "₹" + d.price) : el("div", { class: "mkt-price-big free" }, "Free / Negotiable"),
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
    const title = form.elements.title.value.trim();
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
        await store.update("market", existing.id, { title: title.slice(0, 200), body: body.slice(0, 2000), category, price: price ? Number(price) : null, condition, whatsapp: whatsapp.slice(-10) });
        state.mode = "view"; render(); return;
      }
      const id = store.newId("market");
      const doc = { title: title.slice(0, 200), body: body.slice(0, 2000), category, price: price ? Number(price) : null, condition, whatsapp: whatsapp.slice(-10), authorId: store.uid, authorName: getName() || "Student", sold: false, createdAt: Date.now() };
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
      el("label", {}, "Item name *", el("input", { name: "title", maxlength: "200", required: true, placeholder: t.placeholder, value: existing ? existing.title : "" })),
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
    el("label", {}, "Description", el("textarea", { name: "body", maxlength: "2000", placeholder: t.bodyHint, value: existing ? existing.body : "" })),
    el("label", {}, "Your WhatsApp number (optional — buyers will contact you)",
      el("input", { name: "whatsapp", type: "tel", maxlength: "15", placeholder: "e.g. 9876543210 — not shown publicly except to buyers" })
    ),
    el("p", { class: "hint" }, "⚠️ Your WhatsApp number is only shared with students who open this listing."),
    el("p", { class: "hint" }, "🚫 College-issued laptops cannot be sold — RGUKT policy. Books & Notes are visible to all campuses; other items are campus-local."),
    err,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "submit" }, existing ? "Save changes" : "Post listing"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); }}, "Cancel")
    )
  );
  return [form];
}
// ===================== END CAMPUS MARKET =====================

function renderList() {
  if (state.tab === "market") { renderMarketList(); return; }
  const t = TABS[state.tab], rows = visible(), all = state[t.coll];
  if (!rows.length) {
    const noun = state.tab === "doubts" || state.tab === "gate" ? "subject" : state.tab === "clubs" ? "club" : state.tab === "challenges" ? "type" : "category";
    const emptyMsg = state.tab === "doubts" ? "No doubts yet" : state.tab === "clubs" ? "No club posts yet" : state.tab === "gate" ? "No GATE discussions yet" : state.tab === "challenges" ? "No challenges yet" : "No ideas yet";
    $("list").replaceChildren(...[deptBanner()].filter(Boolean), all.length
      ? el("div", { class: "empty" }, el("strong", {}, "Nothing matches"), "Try another " + noun + " or clear the search.")
      : el("div", { class: "empty" }, el("strong", {}, emptyMsg), "Press \u201c" + t.ask + "\u201d to post the first one."));
    return;
  }
  const spot = spotlight();
  const spotCard = spot && el("button", { type: "button", class: "spot", onclick: () => openItem(spot.d.id) },
    el("span", { class: "spot-k" }, "⭐ Doubt of the Day"),
    el("strong", {}, spot.d.title),
    el("span", { class: "spot-why" }, spot.why + " Can you solve it?"));
  $("list").replaceChildren(...[deptBanner(), spotCard].filter(Boolean), ...rows.map(d => {
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
const quizFor = (day) => QUIZ.length ? QUIZ[((day % QUIZ.length) + QUIZ.length) % QUIZ.length] : null;
// Quiz answers are stored as likes with ideaId "quiz~<day>~<option>"; a student's first answer counts.
function quizAnswers(day) {
  const first = new Map();
  for (const l of state.likes) {
    const m = /^quiz~(\d+)~(\d)$/.exec(l.ideaId || "");
    if (!m || +m[1] !== day) continue;
    const prev = first.get(l.uid);
    if (!prev || (l.createdAt || 0) < (prev.createdAt || 0)) first.set(l.uid, { ...l, opt: +m[2] });
  }
  return first;
}
const myQuizAnswer = (day) => store ? quizAnswers(day).get(store.uid) : null;
async function answerQuiz(day, opt) {
  if (!store || myQuizAnswer(day)) return;
  const q = quizFor(day);
  const id = "quiz~" + day + "~" + opt + "_" + store.uid;
  const doc = { ideaId: "quiz~" + day + "~" + opt, uid: store.uid, name: getName() || "A student", createdAt: Date.now() };
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
  } else out.push(el("p", { class: "hint" }, "Pick one answer. You get one try. A correct answer earns +3 points and keeps your streak going."));
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
    const q = quizFor(day);
    for (const a of quizAnswers(day).values()) {
      const p = get(a.uid, a.name, a.createdAt); p.quizDone++;
      if (q && a.opt === q.a) { p.quizRight++; p.points += 3; }
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
  const pyqPosts = state.gate.filter(d => !d.deleted && d.pyqYear);
  const yearCounts = {};
  for (const d of pyqPosts) yearCounts[d.pyqYear] = (yearCounts[d.pyqYear] || 0) + 1;

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

      // Branch quick-filter
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "🔬 Browse by Branch"),
        el("div", { class: "gate-branch-row" },
          ...Object.keys(DEPT_MAP).map(d =>
            el("button", { type: "button", class: "gate-branch-btn" + (state.dept === d ? " active" : ""),
              onclick: () => { state.dept = state.dept === d ? "All" : d; state.group = "All"; render(); }
            }, d)
          )
        ),
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
        el("div", { class: "gate-section-sub" }, "NPTEL courses by IIT/NIT professors — free, no login needed"),
        el("div", { class: "gate-res-grid gate-res-grid-2" },
          ...GATE_IITS.map(r =>
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

      // World class universities
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "🌍 World Class Universities"),
        el("div", { class: "gate-section-sub" }, "MIT, Stanford — free audit courses for deep understanding"),
        el("div", { class: "gate-res-grid gate-res-grid-2" },
          ...GATE_WORLD.map(r =>
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

      // Free video lectures
      el("div", { class: "gate-section" },
        el("div", { class: "gate-section-title" }, "🎥 Free YouTube Lectures (HD)"),
        el("div", { class: "gate-section-sub" }, "Best GATE YouTube channels — all branches, HD quality"),
        el("div", { class: "gate-res-grid" },
          ...GATE_VIDEOS.map(r =>
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
        await store.update(t.coll, existing.id, { title: title.slice(0, 200), body: body.slice(0, 5000), [t.field]: group, authorName: anonymous ? ANON : (getName() || existing.authorName), anonymous, urgent, pages: [...kept, ...addedIds], fileAttachments: [...keptFiles, ...readyFiles] });
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
      el("label", {}, state.tab === "doubts" ? "Your question" : "Your idea", el("input", { id: "f-title", name: "title", maxlength: "200", required: true, placeholder: t.placeholder })),
      el("label", {}, state.tab === "doubts" ? "Subject" : "Category", el("select", { id: "f-group", name: "group" }, groups.map(s => el("option", { selected: s === current }, s))))),
    (state.tab === "doubts" || state.tab === "gate") && el("div", { class: "two" },
      el("label", {}, "Your Batch Year",
        el("select", { id: "f-year", name: "year" },
          ["(Select year)", "E1", "E2", "E3", "E4"].map(y => el("option", { value: y === "(Select year)" ? "" : y, selected: !!(existing && existing.year === y) }, y))
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

function render() {
  renderHeader(); renderTrendBar(); renderRail(); renderList(); renderBottomNav();
  const fab = $('fabAsk'); if (fab) fab.textContent = state.tab === "market" ? "📦" : "+";
  // Forms keep what the student is typing while live updates arrive.
  const key = ["ask", "edit", "name"].includes(state.mode) ? state.mode + state.tab : "";
  if (key && key === sheetKey) return;
  sheetKey = key;
  const draft = $("f-reply") ? $("f-reply").value : "";
  const t = TABS[state.tab];
  const cur = ["view", "edit"].includes(state.mode) && state[t.coll].find(x => x.id === state.selected);
  const ca = colorAttrs(cur ? cur[t.field] : "All");
  const sheet = $("sheet");
  sheet.setAttribute("data-s", ca["data-s"]);
  if (ca.style) sheet.setAttribute("style", ca.style); else sheet.removeAttribute("style");
  sheet.replaceChildren(...(
    state.mode === "leaders" ? renderLeaders() :
    state.mode === "quiz" ? renderQuiz() :
    state.mode === "me" ? renderMe() :
    state.mode === "learn" ? renderLearn() :
    state.mode === "resources" ? renderResources() :
    state.mode === "network" ? renderNetwork() :
    state.mode === "name" ? renderName() :
    state.mode === "campus" ? renderCampusPicker() :
    state.mode === "ask" ? renderAsk() :
    state.mode === "edit" && cur ? renderAsk(cur) :
    state.mode === "view" || state.mode === "edit" ? renderView() : renderIntro()));
  if (draft && $("f-reply")) $("f-reply").value = draft;
}

// ---------- events ----------
document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
  if (state.tab === b.dataset.tab) return;
  state.tab = b.dataset.tab; state.group = "All"; state.filter = "all"; state.query = "";
  state.selected = null; state.mode = "intro"; $("search").value = "";
  try { history.replaceState(null, "", "#" + state.tab); } catch (_) {}
  render();
}));
$("askBtn").addEventListener("click", openAsk);
const showPanel = (mode) => { state.mode = mode; render(); if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" }); };
$("leadersBtn").addEventListener("click", () => showPanel("leaders"));
$("networkBtn") && $("networkBtn").addEventListener("click", () => showPanel("network"));
$("quizBtn").addEventListener("click", () => showPanel("quiz"));
$("learnBtn").addEventListener("click", () => showPanel("learn"));
$("studyBtn").addEventListener("click", () => showPanel("resources"));
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
const deep = /^#(doubts|ideas|clubs|gate|challenges|market)(?:\/([\w-]+))?$/.exec(location.hash);
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
    store = configured ? await firebaseStore(conf, "rooms/GB-9FE9YR/") : localStore();
  } catch (e) {
    console.error(e);
    showNotice("Could not connect to the class board. Check your internet and reload. (" + ((e && e.code) || "error") + ")");
    return;
  }
  if (store.demo) showNotice("Demo mode: posts are saved only in this browser. Add your Firebase settings to config.js so the whole class shares one board.", "demo");
  const live = (rows) => rows.filter(x => !x.deleted);
  let opened = false;
  const onErr = (e) => {
    showNotice("Firebase error: " + ((e && e.code) || (e && e.message) || "unknown") + " — reload or check internet.");
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
