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
  "Signals, circuits, systems: decode them together.",
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

const state = {
  tab: "doubts", group: "All", query: "", filter: "all",
  doubts: [], ideas: [], clubs: [], replies: [], likes: [], loaded: false,
  selected: null, mode: "intro", // intro | view | ask | edit | name | campus
  afterName: null,
  replyPages: [], replyAnon: false,
  campusFilter: "all", // "all" | campus name
  dept: "All",         // "All" | "ECE" | "CSE" | "Civil" | "Mech" | "EEE"
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
  "🧑‍💻","👨‍🎓","👩‍🎓","🧑‍🏫","👨‍🔬","👩‍🔬","🧑‍🚀","👨‍💼","👩‍💼","🧑‍🎨",
  "🦊","🐯","🦁","🐼","🐸","🦋","🦅","🐬","🦊","🌟",
  "⚡","🎯","🔥","🌙","🎮","🎵","📐","🏆","💡","🚀"
];
function getAvatar() { try { return localStorage.getItem("dd-avatar") || AVATARS[0]; } catch (_) { return AVATARS[0]; } }
function setAvatar(v) { try { localStorage.setItem("dd-avatar", v); } catch (_) {} }
// Avatar for any user by their initials-based index (consistent per name)
function avatarFor(name) {
  if (!name || name === ANON) return "👤";
  let h = 0; for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % AVATARS.length;
  return AVATARS[h];
}
// Render a small avatar circle element
function avatarEl(icon, cls = "av") { return el("span", { class: cls, "aria-hidden": "true" }, icon); }

const mine = (x) => x && store && x.authorId === store.uid;
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
// Each phone or browser gets a random device id, kept in localStorage, so students can edit and delete their own posts.
function deviceId() {
  try {
    let id = localStorage.getItem("dd-device-id");
    if (!id) { id = "d-" + crypto.randomUUID(); localStorage.setItem("dd-device-id", id); }
    return id;
  } catch (_) { return "d-" + Math.random().toString(36).slice(2); }
}
async function firebaseStore(conf, prefix = "") {
  const base = "https://www.gstatic.com/firebasejs/" + FB_VERSION + "/";
  const [{ initializeApp }, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js")]);
  const app = initializeApp(conf);
  const db = fs.getFirestore(app);
  return {
    uid: deviceId(), demo: false,
    subscribe: (coll, cb, onErr) => fs.onSnapshot(fs.collection(db, prefix + coll), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr),
    newId: (coll) => fs.doc(fs.collection(db, prefix + coll)).id,
    set: (coll, id, data) => fs.setDoc(fs.doc(db, prefix + coll, id), data),
    update: (coll, id, data) => fs.updateDoc(fs.doc(db, prefix + coll, id), data),
    remove: (coll, id) => fs.deleteDoc(fs.doc(db, prefix + coll, id)),
    get: async (coll, id) => { const snap = await fs.getDoc(fs.doc(db, prefix + coll, id)); return snap.exists() ? snap.data() : null; },
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
  if (recent.length && now - recent[recent.length - 1] < 15000) return "Slow down a little: wait " + Math.ceil((15000 - (now - recent[recent.length - 1])) / 1000) + " seconds before posting again.";
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
  const icons = { doubts: '❓', ideas: '💡', clubs: '🏛' };
  const labels = { doubts: 'Doubts', ideas: 'Ideas', clubs: 'Clubs' };
  nav.replaceChildren(
    ...['doubts', 'ideas', 'clubs'].map(tab => {
      const cnt = state[TABS[tab].coll].length;
      return el('button', { type: 'button', class: 'bnav-btn' + (state.tab === tab ? ' active' : ''), onclick: () => {
        if (state.tab === tab) return;
        state.tab = tab; state.group = 'All'; state.filter = 'all'; state.query = '';
        state.selected = null; state.mode = 'intro'; $('search').value = '';
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
      el('span', { class: 'bnav-icon' }, getName() ? getAvatar() : '👤'), el('span', { class: 'bnav-label' }, getName() ? 'Me' : 'Profile'))
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
    el("span", { class: "trend-label" }, "🔥 Trending now:"),
    ...hot.map(([s, n]) => el("button", { class: "trend-chip", type: "button",
      onclick: () => { state.tab = "doubts"; state.group = s; render(); }
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
  $("nameBtn").textContent = getName() ? getAvatar() + " " + getName() + (me ? " · Lv " + me.level.n + (me.streak ? " · 🔥" + me.streak : "") : "") : "Set your name";

  // Campus filter chips
  const campusBar = $("campusBar");
  if (campusBar && CAMPUSES.length > 0) {
    campusBar.hidden = false;
    campusBar.replaceChildren(
      ...[
        el("span", { class: "campus-label" }, "Campus:"),
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
    // Trending subject
    const tr = trendingSubject();
    const trEl = $("trending");
    if (trEl) { trEl.hidden = !tr; if (tr) trEl.textContent = "📈 Trending now: " + tr; }
  }
  $("quizBtn").classList.toggle("dot", !!(store && state.loaded && QUIZ.length && !myQuizAnswer(dayNum())));
  $("search").placeholder = state.tab === "doubts" ? "Search doubts" : "Search ideas";
  $("rail").setAttribute("aria-label", t.groupLabel);
  const opts = state.tab === "doubts"
    ? [["all","Newest"],["asked","Most asked"],["open","Unanswered"],["mine","My posts"],["mentor","Needs mentor"],["done","Resolved"],["bounty","🎁 Bounty"]]
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

  const deptTabs = state.tab === "doubts" ? el("div", { class: "dept-tabs" },
    ...["All", ...Object.keys(DEPT_MAP)].map(d => el("button", {
      type: "button", class: "dept-tab" + (state.dept === d ? " active" : ""),
      onclick: () => { state.dept = d; state.group = "All"; render(); },
    }, d))
  ) : null;

  const visibleSubjects = state.tab === "doubts" && state.dept !== "All"
    ? ["All", ...DEPT_MAP[state.dept].filter(s => t.groups.includes(s)), ...extra]
    : ["All", ...t.groups, ...extra];

  $("rail").replaceChildren(
    ...(deptTabs ? [deptTabs] : []),
    el("div", { class: "subj-grid" },
      ...visibleSubjects.map(s => el("button", {
        type: "button", class: "subj-chip" + (state.group === s ? " active" : ""), ...colorAttrs(s),
        onclick: () => { state.group = s; render(); },
      }, el("span", {}, s), el("span", { class: "n" }, s === "All" ? rows.length : (counts[s] || 0))))
    )
  );
}

function visible() {
  const t = TABS[state.tab], q = state.query.trim().toLowerCase();
  let rows = state[t.coll].filter(d => !isHidden(d) &&
    (state.group === "All" || d[t.field] === state.group) &&
    (!q || ((d.title || "") + " " + (d.body || "")).toLowerCase().includes(q)));
  if (state.campusFilter !== "all") rows = rows.filter(d => d.campus === state.campusFilter);
  if (state.tab === "doubts" && (state.filter === "open" || state.filter === "done")) rows = rows.filter(d => (state.filter === "done") === !!d.resolvedReplyId);
  if (state.tab === "doubts" && state.filter === "mentor") rows = rows.filter(needsMentor);
  if (state.tab === "doubts" && state.filter === "bounty") rows = rows.filter(d => d.bounty && !d.resolvedReplyId);
  if (state.tab === "doubts" && state.filter === "mine") rows = rows.filter(d => store && d.authorId === store.uid);
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

function renderList() {
  const t = TABS[state.tab], rows = visible(), all = state[t.coll];
  if (!rows.length) {
    const noun = state.tab === "doubts" ? "subject" : state.tab === "clubs" ? "club" : "category";
    $("list").replaceChildren(all.length
      ? el("div", { class: "empty" }, el("strong", {}, "Nothing matches"), "Try another " + noun + " or clear the search.")
      : el("div", { class: "empty" }, el("strong", {}, state.tab === "doubts" ? "No doubts yet" : state.tab === "clubs" ? "No club posts yet" : "No ideas yet"), "Press \u201c" + t.ask + "\u201d to post the first one."));
    return;
  }
  const spot = spotlight();
  const spotCard = spot && el("button", { type: "button", class: "spot", onclick: () => openItem(spot.d.id) },
    el("span", { class: "spot-k" }, "⭐ Doubt of the Day"),
    el("strong", {}, spot.d.title),
    el("span", { class: "spot-why" }, spot.why + " Can you solve it?"));
  $("list").replaceChildren(...(spotCard ? [spotCard] : []), ...rows.map(d => {
    const n = repliesFor(d.id).length, g = d[t.field];
    const meta = [el("span", { class: "tag", ...colorAttrs(g) }, g)];
    const votes = likesFor(d.id).length;
    if (state.tab === "doubts") {
      meta.push(el("span", { class: "pill " + (d.resolvedReplyId ? "done" : "open") }, d.resolvedReplyId ? "Resolved" : (n ? "Open" : "Unanswered")));
      if (d.urgent && !d.resolvedReplyId) meta.unshift(el("span", { class: "pill urgent" }, "🔥 Urgent"));
      if (d.bounty && !d.resolvedReplyId) meta.push(el("span", { class: "pill bounty" }, "🎁 Bounty"));
      if (votes) meta.push(el("span", { class: "likes" }, "🙋 " + votes));
    } else meta.push(el("span", { class: "likes" }, "♥ " + votes));
    if (d.campus && CAMPUSES.length > 0) meta.push(el("span", { class: "campus-badge", style: "--cc:" + campusColor(d.campus) }, d.campus));
    if (d.pages && d.pages.length) meta.push(el("span", {}, "📎 " + d.pages.length + (d.pages.length === 1 ? " page" : " pages")));
    const av = d.anonymous ? avatarEl("👤") : avatarEl(mine(d) ? getAvatar() : avatarFor(d.authorName || ""));

    meta.push(el("span", {}, n + " " + t.replyNoun + (n === 1 ? "" : "s")), el("span", { class: "author-row" }, av, who(d) + " · " + ago(d.createdAt)));
    return el("button", {
      type: "button", class: "item", ...colorAttrs(g),
      "aria-current": String(state.selected === d.id && state.mode === "view"), onclick: () => openItem(d.id),
    }, el("h3", {}, d.title), el("div", { class: "meta" }, meta));
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
  } else out.push(el("p", { class: "hint" }, "Pick one answer. You get one try; a correct answer earns +3 points and keeps your streak going."));
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
  const allUserPosts = [...state.doubts, ...state.ideas, ...state.clubs, ...state.replies];
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
  const allPosts = [...state.doubts, ...state.ideas, ...state.clubs];
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
    el("p", { class: "hint" }, "Points: answer a classmate's doubt +2 · answer marked helpful +5 more · each 👍💡🔥 on your answer +1 · daily quiz right +3 · share an idea +2 · each like on your idea +1 · ask a doubt +1. Anonymous posts don't count."),
    rivalBoard && el("div", { class: "label" }, "🏫 Campus Rivalry — all 4 RGUKT campuses"),
    rivalBoard,
    rivalBoard && el("p", { class: "hint" }, "Campus score: ask a doubt +1 · share an idea +2 · helpful answer +5 · post in clubs +1. Compete with other campuses!"),
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
  // Avatar picker row
  const avatarPicker = el("div", { class: "avatar-picker" },
    AVATARS.map(icon => {
      const btn = el("button", { type: "button", class: "av-opt" + (getAvatar() === icon ? " selected" : ""), title: icon }, icon);
      btn.addEventListener("click", () => { setAvatar(icon); render(); });
      return btn;
    }));
  return [
    el("div", { class: "profile-hero" },
      avatarEl(getAvatar(), "av av-hero"),
      el("div", {},
        el("h2", {}, (getName() || "You") + " · Level " + lv.n),
        el("p", { class: "hint" }, titleOf(p.points) + " · " + plural(p.points, "point")))),
    el("p", { class: "hint" }, "Your icon:"),
    avatarPicker,
    el("div", { class: "xp", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct), "aria-label": "Progress to next level" }, el("span", { style: "width:" + pct + "%" })),
    el("p", { class: "hint" }, (lv.to - p.points) + (lv.to - p.points === 1 ? " more point" : " more points") + " to reach level " + (lv.n + 1) + "."),
    el("div", { class: "stats" },
      [["🔥", p.streak + "-day", "streak"], ["🤝", p.answers, "answers"], ["✅", p.helpful, "helpful"], ["🧠", p.quizRight, "quiz right"], ["💡", p.ideas, "ideas"], ["❤️", p.reacts + p.likes, "reactions"]]
        .map(([i, v, l]) => el("div", { class: "stat" }, el("b", {}, i + " " + v), el("small", {}, l)))),
    store && el("details", { class: "quiz-y" }, el("summary", {}, MENTORS.has(store.uid) ? "🎓 You are a verified mentor" : "🎓 Are you an IIT mentor?"),
      el("p", { class: "hint" }, "Mentors: send this ID to the board's teacher so your answers show the mentor badge. It identifies this phone or computer."),
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
let formulaOpen = null;

function renderResources() {
  const tabs = [["formulas","⚡ Formulas"],["pyq","📋 PYQ"],["placement","💼 Placement"],["plan","🗓 Study Plan"]];
  const tabBar = el("div", { class: "resource-tabs" },
    ...tabs.map(([id, label]) => el("button", {
      type: "button", class: "resource-tab" + (resourceTab === id ? " active" : ""),
      onclick: () => { resourceTab = id; formulaOpen = null; render(); },
    }, label))
  );
  let content = [];

  if (resourceTab === "formulas") {
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
        el("div", { class: "plan-days" }, exam.days === 0 ? "Today!" : exam.days + " days"),
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

function renderIntro() {
  const t = TABS[state.tab];
  // Live stats
  const totalPosts = state.doubts.length + state.ideas.length + state.clubs.length;
  const students = new Set([...state.doubts, ...state.ideas, ...state.clubs].filter(p => !p.anonymous).map(p => p.authorId)).size;
  const resolved = state.doubts.filter(d => d.resolvedReplyId).length;
  const open = state.doubts.length - resolved;
  const statsRow = totalPosts > 0 ? el("div", { class: "intro-stats" },
    el("div", { class: "intro-stat" }, el("span", { class: "intro-stat-n" }, totalPosts), el("span", { class: "intro-stat-l" }, "posts")),
    el("div", { class: "intro-stat" }, el("span", { class: "intro-stat-n" }, students), el("span", { class: "intro-stat-l" }, "students")),
    state.tab === "doubts" && el("div", { class: "intro-stat ok" }, el("span", { class: "intro-stat-n" }, resolved), el("span", { class: "intro-stat-l" }, "resolved")),
    state.tab === "doubts" && open > 0 && el("div", { class: "intro-stat warn" }, el("span", { class: "intro-stat-n" }, open), el("span", { class: "intro-stat-l" }, "need help"))
  ) : null;

  const steps = state.tab === "doubts"
    ? "1. Ask: pick the subject and write the question. Add a photo of your notebook or write it on the notebook page.\n2. Answer: open any doubt and explain the steps. You can attach your handwritten working too.\n3. Resolve: the student who asked marks the answer that helped. Tap \u201cI have this doubt too\u201d on doubts you share."
    : "1. Share: post an idea for a project, startup or research. Sketch it on the notebook page if that helps.\n2. Like: tap ♥ on ideas you want to see happen.\n3. Build: reply with thoughts, improvements or an offer to join.";

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

function renderAsk(existing) {
  const t = TABS[state.tab];
  const err = el("p", { class: "err", hidden: true });
  const label = existing ? "Save changes" : (state.tab === "doubts" ? "Post doubt" : "Post idea");
  const current = existing ? existing[t.field] : (state.group !== "All" ? state.group : t.groups[0]);
  const groups = t.groups.includes(current) ? t.groups : [...t.groups, current];
  const newPages = []; // data URLs added in this form
  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const title = form.elements.title.value.trim(), body = form.elements.body.value.trim(), group = form.elements.group.value;
    const anonymous = form.elements.anon.checked, urgent = !!(form.elements.urgent && form.elements.urgent.checked), bounty = !!(form.elements.bounty && form.elements.bounty.checked);
    if (title.length < 3) { err.textContent = "Write a title of at least 3 characters."; err.hidden = false; return; }
    if (hasBadWords(title + " " + body)) { err.textContent = LANGUAGE_MSG; err.hidden = false; return; }
    const wait = existing ? "" : spamCheck();
    if (wait) { err.textContent = wait; err.hidden = false; return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      if (existing) {
        const kept = existing.pages || [];
        const added = newPages.slice(0, Math.max(0, MAX_PAGES - kept.length));
        const addedIds = await trySavePages(added, existing.id);
        await store.update(t.coll, existing.id, { title: title.slice(0, 200), body: body.slice(0, 5000), [t.field]: group, authorName: anonymous ? ANON : (getName() || existing.authorName), anonymous, urgent, pages: [...kept, ...addedIds] });
        state.mode = "view"; render(); return;
      }
      const id = store.newId(t.coll);
      const pageIds = newPages.map(u => { const pid = store.newId("pages"); pageCache.set(pid, u); return pid; });
      const doc = { title: title.slice(0, 200), body: body.slice(0, 5000), [t.field]: group, authorId: store.uid, authorName: anonymous ? ANON : getName(), anonymous, urgent, createdAt: Date.now(), pages: pageIds };
      if (state.tab === "doubts") { doc.resolvedReplyId = null; doc.bounty = bounty; }
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
    el("label", {}, "Details", el("textarea", { id: "f-body", name: "body", maxlength: "5000", placeholder: t.bodyHint })),
    existing && existing.pages && existing.pages.length ? el("p", { class: "hint" }, "This post already has " + existing.pages.length + " page(s). You can add up to " + Math.max(0, MAX_PAGES - existing.pages.length) + " more.") : null,
    attachPicker(newPages, existing ? MAX_PAGES - ((existing.pages || []).length) : MAX_PAGES),
    el("div", { class: "checks" },
      el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-anon", name: "anon", checked: !!(existing && existing.anonymous) }), "🙈 Post anonymously (classmates won't see your name)"),
      state.tab === "doubts" && el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-urgent", name: "urgent", checked: !!(existing && existing.urgent) }), "🔥 Urgent: exam or deadline soon"),
      state.tab === "doubts" && el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-bounty", name: "bounty", checked: !!(existing && existing.bounty) }), "🎁 Bounty: whoever solves this gets +5 bonus points")),
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
  const t = TABS[state.tab];
  const d = state[t.coll].find(x => x.id === state.selected);
  if (!d) return [el("p", { class: "hint" }, "This post was deleted or is still loading.")];
  if (isHidden(d)) return [el("p", { class: "hint" }, "🚩 This post was hidden after reports from classmates.")];
  const own = mine(d), reps = repliesFor(d.id), g = d[t.field];
  const out = [
    el("div", { class: "meta" },
      el("span", { class: "tag", ...colorAttrs(g) }, g),
      state.tab === "doubts" && isUrgent(d) && el("span", { class: "pill urgent" }, "🔥 Urgent"),
      state.tab === "doubts" && el("span", { class: "pill " + (d.resolvedReplyId ? "done" : "open") }, d.resolvedReplyId ? "Resolved" : "Open"),
      state.tab === "doubts" && d.bounty && !d.resolvedReplyId && el("span", { class: "pill bounty" }, "🎁 Bounty"),
      d.campus && CAMPUSES.length > 0 && el("span", { class: "campus-badge", style: "--cc:" + campusColor(d.campus) }, d.campus),
      el("span", { class: "author-row" }, d.anonymous ? avatarEl("👤") : avatarEl(mine(d) ? getAvatar() : avatarFor(d.authorName || "")), "By " + who(d) + " · " + ago(d.createdAt))),
    el("h2", {}, d.title),
  ];
  if (d.body) out.push(el("p", { class: "body" }, d.body));
  if (d.pages && d.pages.length) out.push(pagesView(d.pages));
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
      r.pages && r.pages.length ? pagesView(r.pages) : null,
      reactionBar(r)));
  }
  out.push(list);

  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const body = form.elements.reply.value.trim();
    const pages = state.replyPages.slice();
    if (!body && !pages.length) return;
    if (!getName()) { state.afterName = "view"; state.mode = "name"; render(); return; }
    if (hasBadWords(body)) { showNotice(LANGUAGE_MSG); return; }
    const wait = spamCheck();
    if (wait) { showNotice(wait); return; }
    notePosted();
    const id = store.newId("replies");
    const pageIds = pages.map(u => { const pid = store.newId("pages"); pageCache.set(pid, u); return pid; });
    const anonymous = state.replyAnon;
    const doc = { parentId: d.id, parentColl: t.coll, body: (body || PAGE_ONLY).slice(0, 5000), authorId: store.uid, authorName: anonymous ? ANON : getName(), anonymous, createdAt: Date.now(), pages: pageIds };
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
    el("h2", {}, "🏫 Welcome to RGUKT Spark!"),
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
const deep = /^#(doubts|ideas|clubs)(?:\/([\w-]+))?$/.exec(location.hash);
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
