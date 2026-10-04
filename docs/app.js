// Doubt Desk: class board for doubts and ideas.
// DOM safety: replaceChildren/append/prepend turn null, undefined and false into the text "null". Skip them instead.
for (const m of ["replaceChildren", "append", "prepend"]) {
  const orig = Element.prototype[m];
  Element.prototype[m] = function (...nodes) { return orig.apply(this, nodes.filter(n => n != null && n !== false)); };
}
// Data lives in Firebase Firestore when config.js has Firebase settings, otherwise in this browser (demo mode).

// ---------- college (tenant) setup ----------
// The original board (RGUKT) keeps working as one college. Any other college opens as ?c=<slug>: its name, colours, campuses, subjects and
// clubs come from the public `colleges/<slug>` document, and its posts live in its own private room (`room` field).
const BASE_CFG = window.DOUBT_DESK_CONFIG || {};
const DEFAULT_ROOM_PATH = "rooms/GB-9FE9YR/";
const t1 = (v, n) => typeof v === "string" ? v.replace(/[\u0000-\u001F\u007F​-‏‪-‮⁠-⁤﻿<>]/g, "").trim().slice(0, n) : "";
const tList = (v, n, m) => (Array.isArray(v) ? v : []).map(x => t1(x, n)).filter(Boolean).slice(0, m);
function fsVal(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue; if ("integerValue" in v) return Number(v.integerValue); if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue; if ("arrayValue" in v) return (v.arrayValue.values || []).map(fsVal);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fsVal(x)]));
  return null;
}
const fsDoc = (d) => Object.fromEntries(Object.entries((d && d.fields) || {}).map(([k, x]) => [k, fsVal(x)]));
// Update checker: when a newer version of the site has been published, show a "Refresh" bar so students are never stuck on an old copy.
(function () {
  const cur = ((document.querySelector('script[src*="app.js"]') || {}).src || "").match(/[?&]v=(\d+)/);
  if (!cur) return; const mine = Number(cur[1]); let shown = false;
  const check = async () => {
    if (shown || !navigator.onLine) return;
    try {
      const r = await fetch(location.pathname.replace(/[^/]*$/, "") + "index.html?cb=" + Date.now(), { cache: "no-store" }); if (!r.ok) return;
      const m = (await r.text()).match(/app\.js\?v=(\d+)/); if (!m || Number(m[1]) <= mine) return;
      shown = true;
      const bar = document.createElement("div"); bar.className = "update-bar"; bar.setAttribute("role", "status");
      const t = document.createElement("span"); t.textContent = "A new version is ready.";
      const b = document.createElement("button"); b.type = "button"; b.textContent = "Refresh now";
      b.onclick = async () => { try { if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(x => x.update().catch(() => {}))); } if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } } catch (_) {} location.replace(location.pathname + location.search.replace(/[?&]r=\d+/, "") + (location.search ? "&" : "?") + "r=" + m[1]); };
      const x = document.createElement("button"); x.type = "button"; x.className = "x"; x.setAttribute("aria-label", "Later"); x.textContent = "\u2715"; x.onclick = () => bar.remove();
      bar.append(t, b, x); document.body.append(bar);
    } catch (_) {}
  };
  setTimeout(check, 4000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); }); setInterval(check, 10 * 60 * 1000);
})();
// Remembers the last few errors on this phone so a student can send them with "Report a problem". Nothing is sent automatically.
(function () {
  const keep = (msg) => { try { const l = JSON.parse(localStorage.getItem("dd-errlog") || "[]"); l.push({ t: new Date().toISOString().slice(0, 19), m: String(msg).slice(0, 200), v: document.querySelector("link[rel=manifest]")?.href.match(/v=(\d+)/)?.[1] || "" }); localStorage.setItem("dd-errlog", JSON.stringify(l.slice(-15))); } catch (_) {} };
  addEventListener("error", (e) => keep((e.message || "error") + " @" + String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0)));
  addEventListener("unhandledrejection", (e) => keep("promise: " + ((e.reason && (e.reason.message || e.reason.code)) || e.reason || "rejected")));
})();
function reportProblem() {
  let log = []; try { log = JSON.parse(localStorage.getItem("dd-errlog") || "[]"); } catch (_) {}
  const info = ["App: " + BRAND, "College: " + COLLEGE, "Screen: " + innerWidth + "x" + innerHeight, "Browser: " + navigator.userAgent.slice(0, 120), "Recent errors:", ...(log.length ? log.map(x => "- " + x.t + " v" + x.v + " " + x.m) : ["- none"])].join("\n");
  const to = (window.DOUBT_DESK_CONFIG && window.DOUBT_DESK_CONFIG.about && window.DOUBT_DESK_CONFIG.about.email) || "";
  const url = "mailto:" + encodeURIComponent(to) + "?subject=" + encodeURIComponent(BRAND + " problem report") + "&body=" + encodeURIComponent("Please describe what went wrong:\n\n\n---\n" + info);
  window.location.href = url;
}
// Which college is this visitor on? "" = not chosen yet, "rgukt" = the original built-in board, anything else = a tenant.
function pickCollege() {
  const valid = (v) => /^[a-z0-9-]{2,40}$/.test(v);
  let p = null; try { p = new URLSearchParams(location.search).get("c"); } catch (_) {}
  if (p !== null) {
    p = p.toLowerCase();
    try { if (valid(p)) localStorage.setItem("dd-college", p); else localStorage.removeItem("dd-college"); } catch (_) {}
    return valid(p) ? p : "";
  }
  let s = ""; try { s = localStorage.getItem("dd-college") || ""; } catch (_) {}
  if (valid(s)) return s;
  // People who already used the original board before colleges existed keep their board.
  try { if (["dd-name", "dd-avatar", "dd-campus", "dd-post-times", "dd-seen"].some(k => localStorage.getItem(k) !== null)) { localStorage.setItem("dd-college", "rgukt"); return "rgukt"; } } catch (_) {}
  return "";
}
try { const r = new URLSearchParams(location.search).get("ref"); if (r && /^[A-Za-z0-9_-]{10}$/.test(r) && !localStorage.getItem("dd-ref")) localStorage.setItem("dd-ref", r); } catch (_) {}
try { const g = new URLSearchParams(location.search).get("gift"); if (g && /^[A-HJ-NP-Z2-9]{12}$/i.test(g)) localStorage.setItem("dd-gift", g.toUpperCase()); } catch (_) {}
const SEL = pickCollege(), NO_COLLEGE = SEL === "", IS_RGUKT = SEL === "rgukt";
const BRAND = BASE_CFG.brand || "The Campus Loop";
// The Campus Loop Plus (optional paid plan). enabled:false = free early access and a waitlist; see PREMIUM.md to go live.
const PUSH = { vapidKey: "", ...(BASE_CFG.push || {}) };
const PLUS = { enabled: false, monthly: 49, yearly: 399, functionsUrl: "", ...(BASE_CFG.plus || {}) };
function cleanTenant(raw, slug) {
  if (!raw || typeof raw !== "object" || raw.enabled === false) return null;
  const room = t1(raw.room, 40); if (!/^[A-Za-z0-9_-]{6,40}$/.test(room)) return null;
  const name = t1(raw.name, 60); if (!name) return null;
  const f = raw.features && typeof raw.features === "object" ? raw.features : {};
  const dep = {}; if (raw.departments && typeof raw.departments === "object") for (const [k, v] of Object.entries(raw.departments).slice(0, 12)) { const kk = t1(k, 20); if (kk) dep[kk] = tList(v, 30, 40); }
  return {
    slug, room, name, examLabel: t1(raw.examLabel, 24), crest: (typeof raw.crest === "string" && raw.crest.length <= 60000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(raw.crest)) ? raw.crest : "", title: t1(raw.title, 40) || BRAND, tagline: t1(raw.tagline, 80), captions: tList(raw.captions, 90, 10),
    campuses: tList(raw.campuses, 24, 12), clubs: tList(raw.clubs, 30, 30), subjects: tList(raw.subjects, 30, 80), ideaCategories: tList(raw.ideaCategories, 30, 20),
    exams: (Array.isArray(raw.exams) ? raw.exams : []).map(e => ({ name: t1(e && e.name, 40), date: t1(e && e.date, 10) })).filter(e => e.name && /^\d{4}-\d{2}-\d{2}$/.test(e.date)).slice(0, 12),
    domains: tList(raw.domains, 60, 8).map(d => d.toLowerCase().replace(/^@/, '')).filter(d => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)), requireVerified: raw.requireVerified === true, departments: dep, accent: /^#[0-9a-fA-F]{6}$/.test(raw.accent || "") ? raw.accent : "",
    features: { bot: f.bot === true, alumni: f.alumni === true, fun: f.fun !== false, jobs: f.jobs !== false, market: f.market !== false, challenges: f.challenges !== false },
  };
}
// Colleges from colleges-ap.js work without any database setup: same room naming for everyone ("college-<slug>"),
// common subjects and clubs. A Firestore `colleges/<slug>` document, when present, customises the content.
// ---------- colours: one family per state, one shade per college ----------
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, sat = 0;
  if (mx !== mn) { const d = mx - mn; sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, sat * 100, l * 100];
}
function hslToHex(h, sat, l) {
  h = ((h % 360) + 360) % 360; sat = Math.max(0, Math.min(100, sat)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const k = (n) => (n + h / 30) % 12, a = sat * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}
const shiftColor = (hex, dh, dl) => { const [h, sat, l] = hexToHsl(hex); return hslToHex(h + dh, sat, l + dl); };
// [main colour, partner colour] for each state, picked from its flag, landscape or culture.
const STATE_COLORS = {
  "Andhra Pradesh": ["#e11d48", "#f59e0b"], "Telangana": ["#7c3aed", "#ec4899"], "Tamil Nadu": ["#b91c1c", "#f59e0b"], "Karnataka": ["#dc2626", "#eab308"],
  "Kerala": ["#15803d", "#facc15"], "Maharashtra": ["#ea580c", "#1d4ed8"], "Gujarat": ["#f97316", "#0d9488"], "Rajasthan": ["#db2777", "#f59e0b"],
  "Punjab": ["#2563eb", "#f97316"], "Haryana": ["#16a34a", "#ca8a04"], "Delhi": ["#4338ca", "#f43f5e"], "Uttar Pradesh": ["#d97706", "#9333ea"],
  "Bihar": ["#ca8a04", "#16a34a"], "West Bengal": ["#e11d48", "#2563eb"], "Odisha": ["#0891b2", "#f59e0b"], "Assam": ["#16a34a", "#dc2626"],
  "Madhya Pradesh": ["#0d9488", "#a16207"], "Chhattisgarh": ["#15803d", "#9a3412"], "Jharkhand": ["#047857", "#f59e0b"], "Uttarakhand": ["#1d4ed8", "#16a34a"],
  "Himachal Pradesh": ["#0284c7", "#16a34a"], "Jammu and Kashmir": ["#0891b2", "#e11d48"], "Ladakh": ["#1d4ed8", "#f97316"], "Goa": ["#0ea5e9", "#f59e0b"],
  "Manipur": ["#7c3aed", "#16a34a"], "Meghalaya": ["#059669", "#0ea5e9"], "Mizoram": ["#be123c", "#0d9488"], "Nagaland": ["#b91c1c", "#15803d"],
  "Arunachal Pradesh": ["#059669", "#f97316"], "Sikkim": ["#0891b2", "#a855f7"], "Tripura": ["#ea580c", "#2563eb"], "Puducherry": ["#2563eb", "#f43f5e"],
  "Chandigarh": ["#0f766e", "#f59e0b"], "Andaman and Nicobar Islands": ["#0284c7", "#14b8a6"], "Lakshadweep": ["#06b6d4", "#8b5cf6"],
  "Dadra and Nagar Haveli and Daman and Diu": ["#0891b2", "#f97316"],
};
// Every college gets its own shade inside its state's family (a small, repeatable hue and lightness shift from its link name).
function collegeColors(slug, state) {
  const [a, b] = STATE_COLORS[state] || ["#6366f1", "#ec4899"];
  let h = 0; for (const ch of String(slug)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const dh = ((h % 9) - 4) * 6, dl = (((h >>> 4) % 5) - 2) * 2;
  return [shiftColor(a, dh, dl), shiftColor(b, dh, -dl)];
}
const GENERIC_SUBJECTS = ["Maths", "Physics", "Chemistry", "English", "Programming", "Data Structures", "DBMS", "Operating Systems", "Networks", "Electronics", "Circuits", "Mechanics", "Thermodynamics", "Biology", "Economics", "Management", "Law", "Other"];
const GENERIC_CLUBS = ["Coding Club", "AI/ML", "Robotics", "Electronics", "Startup Cell", "Research Society", "Cultural", "Sports", "NSS / NCC", "Other"];
const GENERIC_IDEAS = ["Project", "Startup", "Research", "Campus life", "Social impact", "Other"];
const DIRECTORY = Array.isArray(window.COLLEGE_DIRECTORY) ? window.COLLEGE_DIRECTORY : [];
const INDIA_STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
// Subjects, clubs, idea categories and the exam tab are tuned to the TYPE of college, so a medical college, a law university and an engineering college each feel like their own.
const KIND_PRESETS = {
  engineering: { exam: "GATE", bot: true,
    subjects: ["Maths", "Physics", "Chemistry", "English", "Programming", "Data Structures", "DBMS", "Operating Systems", "Networks", "Electronics", "Circuits", "Signals", "Mechanics", "Thermodynamics", "Machines", "Structures", "Other"],
    clubs: ["Coding Club", "AI/ML", "Robotics", "Electronics", "Startup Cell", "Research Society", "Cultural", "Sports", "NSS / NCC", "Other"], ideas: ["Project", "Startup", "Research", "Campus life", "Social impact", "Other"] },
  medical: { exam: "NEET PG", bot: false,
    subjects: ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Forensic Medicine", "Community Medicine", "Medicine", "Surgery", "OBG", "Pediatrics", "Other"],
    clubs: ["Medical Quiz", "Research Society", "Blood Donation", "Health Awareness", "Cultural", "Sports", "NSS / NCC", "Other"], ideas: ["Case discussion", "Research", "Health awareness", "Campus life", "Social impact", "Other"] },
  agri: { exam: "ICAR / JRF", bot: false,
    subjects: ["Agronomy", "Soil Science", "Horticulture", "Plant Pathology", "Entomology", "Genetics and Breeding", "Agri Economics", "Agri Engineering", "Animal Husbandry", "Extension", "Other"],
    clubs: ["Farm Club", "Research Society", "Entrepreneurship", "Cultural", "Sports", "NSS / NCC", "Other"], ideas: ["Farm innovation", "Research", "Startup", "Campus life", "Social impact", "Other"] },
  law: { exam: "CLAT / Judiciary", bot: false,
    subjects: ["Constitutional Law", "Contract Law", "Criminal Law", "Torts", "Jurisprudence", "Property Law", "Family Law", "Company Law", "Legal English", "IPR", "Other"],
    clubs: ["Moot Court", "Debate", "Legal Aid Cell", "Cultural", "Sports", "NSS / NCC", "Other"], ideas: ["Moot ideas", "Policy", "Research", "Campus life", "Social impact", "Other"] },
  degree: { exam: "Competitive exams", bot: false,
    subjects: ["Maths", "Physics", "Chemistry", "Botany", "Zoology", "Computer Science", "Commerce", "Accounting", "Economics", "English", "Telugu / Hindi", "History", "Political Science", "Other"],
    clubs: ["Computer Club", "Commerce Club", "Science Club", "Literary", "Cultural", "Sports", "NSS / NCC", "Other"], ideas: ["Project", "Startup", "Research", "Campus life", "Social impact", "Other"] },
  design: { exam: "Design entrance", bot: false,
    subjects: ["Design", "Architecture", "Drawing", "Art History", "Materials", "Urban Planning", "Other"],
    clubs: ["Design Club", "Photography", "Cultural", "Sports", "NSS / NCC", "Other"], ideas: ["Design project", "Startup", "Research", "Campus life", "Social impact", "Other"] },
  general: { exam: "Competitive exams", bot: false, subjects: GENERIC_SUBJECTS, clubs: GENERIC_CLUBS, ideas: GENERIC_IDEAS },
};
function kindGroup(kind) {
  const k = String(kind || "").toLowerCase();
  if (/engineering|technical|technolog|national institute/.test(k)) return "engineering";
  if (/medical|health sciences/.test(k)) return "medical";
  if (/agricultur|horticultur|veterinar/.test(k)) return "agri";
  if (/law/.test(k)) return "law";
  if (/degree/.test(k)) return "degree";
  if (/architecture|arts/.test(k)) return "design";
  return "general";
}
async function loadTenant() {
  const slug = SEL; if (!slug || slug === "rgukt") return null;
  const dir = DIRECTORY.find(c => c.slug === slug);
  const withDir = (t) => dir ? { ...t, room: "college-" + slug, examLabel: t.examLabel || ((window.COLLEGE_DATA || {})[slug] || {}).exam || KIND_PRESETS[kindGroup(dir.kind)].exam } : t;   // directory colleges always share one room
  const fromDir = () => { const pr = KIND_PRESETS[kindGroup(dir.kind)], cd = (window.COLLEGE_DATA || {})[slug] || {}; return cleanTenant({ name: dir.name, room: "college-" + slug, clubs: cd.clubs || pr.clubs, subjects: cd.subjects || pr.subjects, ideaCategories: cd.ideas || pr.ideas, examLabel: cd.exam || pr.exam, features: { bot: cd.bot != null ? cd.bot === true : pr.bot } }, slug); };
  const key = "dd-tenant-" + slug; let cached = null;
  try { cached = JSON.parse(localStorage.getItem(key) || "null"); } catch (_) {}
  const fb = BASE_CFG.firebase || {};
  const url = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(fb.projectId || "") + "/databases/(default)/documents/colleges/" + encodeURIComponent(slug) + "?key=" + encodeURIComponent(fb.apiKey || "");
  const fetchFresh = async () => {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 7000);
    try {
      const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("status " + r.status);
      const t = cleanTenant(fsDoc(await r.json()), slug); if (!t) throw new Error("invalid college");
      try { localStorage.setItem(key, JSON.stringify({ t, at: Date.now() })); } catch (_) {}
      return t;
    } finally { clearTimeout(to); }
  };
  if (cached && cached.t && cleanTenant({ ...cached.t, enabled: true }, slug)) {
    if (Date.now() - (cached.at || 0) > 6 * 3600 * 1000) fetchFresh().catch(() => {});   // refresh for next visit
    return withDir(cached.t);
  }
  try { return withDir(await fetchFresh()); }
  catch (_) {
    if (dir) return fromDir();
    document.body.replaceChildren();
    const box = document.createElement("div"); box.style.cssText = "max-width:420px;margin:15vh auto;padding:24px;font-family:system-ui,sans-serif;text-align:center";
    const h = document.createElement("h2"); h.textContent = "We could not open this college";
    const pp = document.createElement("p"); pp.textContent = "Check the link, or your internet connection, and try again.";
    const a = document.createElement("a"); a.href = location.pathname + "?c=rgukt"; a.textContent = "Open the default board"; a.style.cssText = "display:inline-block;padding:10px 18px;border-radius:999px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700";
    box.append(h, pp, a); document.body.append(box);
    await new Promise(() => {});   // stop here: never fall back to another college's board
  }
}
const TENANT = await loadTenant();
const EXAM_LABEL = (TENANT && TENANT.examLabel) || "GATE";   // the exam tab: GATE for engineering, NEET PG for medical, CLAT for law, and so on
const ROOM_PATH = TENANT ? "rooms/" + TENANT.room + "/" : IS_RGUKT ? DEFAULT_ROOM_PATH : "lobby/";
const COLLEGE = TENANT ? TENANT.name : IS_RGUKT ? "RGUKT AP" : "your college";
// Email domains a student of this college signs up with. Used to check the verified email; empty = any email is accepted.
const COLLEGE_DOMAINS = TENANT ? TENANT.domains : IS_RGUKT ? ["rguktn.ac.in", "rguktong.ac.in", "rguktrkv.ac.in", "rguktsklm.ac.in"] : [];
const featureOn = (k) => !TENANT || TENANT.features[k] !== false;
const CFG = NO_COLLEGE ? {
  ...BASE_CFG, title: BRAND, tagline: "", captions: ["Ask boldly. Answer together.", "Doubt today. Discover tomorrow.", "Every doubt you ask is a concept you own tomorrow."],
  campuses: [], clubs: [], subjects: [], ideaCategories: [], exams: [], mentors: [], admins: [], privateClass: false,
} : TENANT ? {
  ...BASE_CFG, title: TENANT.title, tagline: TENANT.tagline || "", captions: TENANT.captions, campuses: TENANT.campuses,
  clubs: TENANT.clubs, subjects: TENANT.subjects, ideaCategories: TENANT.ideaCategories, exams: TENANT.exams,
  mentors: [], admins: [], privateClass: false,
} : BASE_CFG;
if (NO_COLLEGE) document.body.classList.add("nocollege");
if (TENANT) {
  document.body.classList.add("tenant");
  for (const k of ["bot", "alumni", "fun", "jobs", "market", "challenges"]) if (!featureOn(k)) document.body.classList.add("no-" + k);
}
// Brand colours of the college that is open (its own accent colour when it has one, otherwise its state family shade).
const BRAND_COLORS = TENANT ? (TENANT.accent ? [TENANT.accent, shiftColor(TENANT.accent, 28, 0)] : collegeColors(SEL, (DIRECTORY.find(c => c.slug === SEL) || {}).state || "Andhra Pradesh")) : null;
if (BRAND_COLORS) {
  const root = document.documentElement.style; root.setProperty("--accent", BRAND_COLORS[0]); root.setProperty("--brand-a", BRAND_COLORS[0]); root.setProperty("--brand-b", BRAND_COLORS[1]);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", BRAND_COLORS[0]);
}
// Plus profile themes: a personal accent colour kept on this phone.
const THEMES = [["Default", ""], ["Ocean", "#0ea5e9"], ["Forest", "#16a34a"], ["Sunset", "#f97316"], ["Rose", "#e11d48"], ["Violet", "#7c3aed"], ["Gold", "#ca8a04"]];
const applyTheme = () => { try { const c = localStorage.getItem("dd-theme") || ""; if (/^#[0-9a-f]{6}$/i.test(c)) { document.documentElement.style.setProperty("--accent", c); document.documentElement.style.setProperty("--brand-a", c); document.documentElement.style.setProperty("--brand-b", shiftColor(c, 28, 0)); } } catch (_) {} };
applyTheme();
// RGUKT: doubt subjects are the real subject names from the RGUKT timetable, grouped by branch (see rgukt-curriculum.js).
const RGUKT_DEPTS = (() => {
  const C = window.RGUKT_CURRICULUM; if (!C || SEL !== "rgukt") return null;
  const short = (n) => n.replace(/ and /g, " & ").replace(/Engineering/g, "Eng.").replace(/Introduction to/g, "Intro to").replace(/Multivariable/g, "Multivar.").replace(/Organizational Behavior/g, "Org. Behavior").replace(/Intellectual Property Rights/g, "IPR").replace(/Differential Equations & Multivar\. Calculus/, "Diff. Equations & Multivar. Calculus").replace(/ \/ .*$/, "");
  const names = { "AI&ML": "AI & ML", CSE: "CSE", ECE: "ECE", EEE: "EEE", ME: "Mech", CE: "Civil", CHE: "Chemical", MME: "MME" };
  const order = ["ECE", "CSE", "CE", "ME", "EEE", "AI&ML", "CHE", "MME"], out = {};
  for (const b of order) { const seen = new Set(); for (const y of Object.keys(C.data)) for (const r of (C.data[y][b] || [])) { if (r[2] === 0 && /Constitution|Aptitude|Environmental Science|Universal Human|Indian Knowledge/.test(r[0])) continue; seen.add(short(r[0])); } out[names[b]] = [...seen]; }
  return out;
})();
const SUBJECTS = RGUKT_DEPTS ? [...new Set([...Object.values(RGUKT_DEPTS).flat(), "Other"])] : (CFG.subjects && CFG.subjects.length) ? CFG.subjects : ["Maths", "Physics", "Chemistry", "Other"];
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
  "Signals, circuits, systems, decode them together.",
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
    ask: "Post to a club", tagline: "Connect with " + COLLEGE + " students. Share projects, find team members, plan events.",
    replyNoun: "reply", replyLabel: "Your reply", replyBtn: "Post reply",
    placeholder: "e.g. Looking for teammates for a robotics project",
    bodyHint: "Details, what help you need, who can join.",
  },
  gate: {
    coll: "gate", field: "subject", groups: SUBJECTS, groupLabel: "Subjects", noun: "discussion",
    ask: "Post GATE discussion", tagline: "GATE PYQs, shortcuts, concepts and exam alerts, shared across all campuses.",
    replyNoun: "reply", replyLabel: "Your reply", replyBtn: "Post reply",
    placeholder: "e.g. GATE EC 2023, Z-transform question (Session 1, Q14)",
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
    ask: "Post an opportunity", tagline: "Placements, internships and hackathons shared by " + COLLEGE + " students. Post openings, interview experiences and prep tips.",
    replyNoun: "reply", replyLabel: "Your reply", replyBtn: "Post reply",
    placeholder: "e.g. TCS NQT registration open for 2026 batch",
    bodyHint: "Role, eligibility, selection process, how to apply, and any tips.",
  },
  market: {
    coll: "market", field: "category", groups: ["Books", "Notes", "Electronics", "Hostel", "Clothing", "Cycles & Bikes", "Sports", "Lab & Stationery", "Furniture", "Services", "Lost & Found", "Other"], groupLabel: "Category", noun: "listing",
    ask: "Sell an item", tagline: "Buy and sell textbooks, electronics, hostel items and more, with fellow " + COLLEGE + " students.",
    replyNoun: "inquiry", replyLabel: "Your message", replyBtn: "Send",
    placeholder: "e.g. Data Structures book by Cormen, 2nd year, good condition",
    bodyHint: "Describe the item, its condition, why you're selling, and any extra details.",
    market: true,
  },
};
if (EXAM_LABEL !== "GATE") { TABS.gate.ask = "Post " + EXAM_LABEL + " discussion"; TABS.gate.tagline = EXAM_LABEL + " previous papers, tips, concepts and exam alerts, shared across all campuses."; TABS.gate.placeholder = "e.g. a " + EXAM_LABEL + " question you want help with"; TABS.gate.bodyHint = "Full question, your approach, a tip, or an exam alert."; }

// ---------- campus ----------
const CAMPUSES = (CFG.campuses && CFG.campuses.length) ? CFG.campuses : [];
const CAMPUS_COLORS = { NUZVID: "#7c3aed", ONGOLE: "#0d9488", RKVALLEY: "#2563eb", SRIKAKULAM: "#0891b2", BASAR: "#d97706", IDUPULAPAYA: "#dc2626" };
const CAMPUS_ICON = { NUZVID: "🟣", ONGOLE: "🟢", RKVALLEY: "🔵", SRIKAKULAM: "🩵" };
const CAMPUS_FULL = !IS_RGUKT ? {} : { NUZVID: "RGUKT Nuzvid", ONGOLE: "RGUKT Ongole", RKVALLEY: "RGUKT RK Valley", SRIKAKULAM: "RGUKT Srikakulam" };
const campusColor = (c) => CAMPUS_COLORS[c] || PALETTE[Math.max(0, CAMPUSES.indexOf(c)) % PALETTE.length];
const CAMPUS_KEY = TENANT ? "dd-campus-" + TENANT.slug : "dd-campus";
const getCampus = () => { try { const c = localStorage.getItem(CAMPUS_KEY); return c && (!TENANT || CAMPUSES.includes(c)) ? c : null; } catch(_){return null;} };
const setCampus = (c) => { try { localStorage.setItem(CAMPUS_KEY, c); } catch(_){} };

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
const DEPT_MAP = TENANT ? (TENANT.departments || {}) : RGUKT_DEPTS ? RGUKT_DEPTS : {
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
  "AI & ML": { bg: "linear-gradient(135deg,#6366f1 0%,#ec4899 100%)", art: "🧠📊🔮💡", label: "Artificial Intelligence & Machine Learning", sub: "Algorithms · Statistics · Databases · Compilers" },
  Chemical:  { bg: "linear-gradient(135deg,#10b981 0%,#0ea5e9 100%)", art: "🧪⚗️🏭🔥💧", label: "Chemical Engineering", sub: "Process · Heat & Mass Transfer · Reactions" },
  MME:       { bg: "linear-gradient(135deg,#64748b 0%,#f59e0b 100%)", art: "🔩🧲🔬⛏️🪙", label: "Metallurgical & Materials", sub: "Extraction · Materials · Testing · Casting" },
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

const yl = (k) => ({ E1: "B.Tech 1st year", E2: "B.Tech 2nd year", E3: "B.Tech 3rd year", E4: "B.Tech 4th year" })[k] || String(k || "");
const state = {
  tab: "doubts", group: "All", query: "", filter: "all",
  doubts: [], ideas: [], clubs: [], gate: [], jobs: [], challenges: [], chalScores: [], market: [], marketReports: [], marketRatings: [], marketInterests: [], replies: [], likes: [], plan: { plus: false, until: 0 }, papers: [], notices: [], drives: [], weekly: [], events: [], rsvps: [], blocked: [], profiles: [], stories: [], storyViews: [], storyAnswers: [], loaded: false,
  selected: null, mode: "intro", // intro | view | ask | edit | name | campus
  afterName: null,
  replyPages: [], replyAnon: false, replyPriv: false, privAns: [],
  campusFilter: "all", // "all" | campus name
  mktChip: "all",     // quick filter chip in the market
  mktSort: "newest",   // "newest" | "price_asc" | "price_desc" | "popular"
  dept: "All",         // "All" | "ECE" | "CSE" | "Civil" | "Mech" | "EEE"
  yearFilter: "All",   // "All" | "E1" | "E2" | "E3" | "E4"
  gateYearPick: null,  // null | "2024" | "2023" …
  gateResView: null,   // null | resource obj, content browser
  gatePYQBranch: null, // null | "ECE" | "CSE" | "Civil" | "Mech" | "EEE", PYQ paper panel
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
  "🧑‍💻","👨‍🎓","👩‍🎓","🧑‍🔬","👩‍🔬","🧑‍","🦸","🧙","🥷","🧑‍🎨",
  // Animals
  "🦊","🐯","🦁","🐼","🦅","🐬","🦋","🐺","🦉","🐉",
  // Icons
  "⚡","🎯","🔥","🌙","","💫","💎","🏆","🌊","❄️"
];
// DiceBear 3D portrait seeds shown in the avatar picker
const DB_SEEDS = ["apex","cipher","echo","flash","ghost","hawk","jade","luna","nova","orbit","pixel","vega","storm","blaze","frost","zion"];
const dbUrl = (seed) => "https://api.dicebear.com/9.x/notionists/svg?seed=" + encodeURIComponent(seed) + "&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear";
function getAvatar() { try { return getDp() || localStorage.getItem("dd-avatar") || AVATARS[0]; } catch (_) { return AVATARS[0]; } }
function setAvatar(v) { try { localStorage.setItem("dd-avatar", v); localStorage.removeItem("dd-dp"); } catch (_) {} if (store) syncProfile().catch(() => {}); }
// Avatar for any user by name, returns DiceBear URL for a consistent illustrated portrait
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
// Replies and likes are indexed once per update (not searched for every card), so long feeds stay fast.
const EMPTY_LIST = Object.freeze([]);
let _repSrc = null, _repLen = -1, _repMap = new Map(), _likeSrc = null, _likeLen = -1, _likeMap = new Map();
const repliesFor = (id) => {
  if (_repSrc !== state.replies || _repLen !== state.replies.length) {
    _repSrc = state.replies; _repLen = state.replies.length; _repMap = new Map();
    for (const r of state.replies) { let b = _repMap.get(r.parentId); if (!b) _repMap.set(r.parentId, b = []); b.push(r); }
    for (const b of _repMap.values()) b.sort((x, y) => (isMentor(y) - isMentor(x)) || (x.createdAt - y.createdAt));
  }
  return _repMap.get(id) || EMPTY_LIST;
};
// Verified mentors are listed by device ID in config.js; their answers get a badge and go first.
const MENTORS = new Map((CFG.mentors || []).filter(m => m && m.id).map(m => [m.id, m.name || "Mentor"]));
const isMentor = (x) => (x && !x.anonymous && MENTORS.has(x.authorId)) ? 1 : 0;
const likesFor = (id) => {
  if (_likeSrc !== state.likes || _likeLen !== state.likes.length) {
    _likeSrc = state.likes; _likeLen = state.likes.length; _likeMap = new Map();
    for (const l of state.likes) { let b = _likeMap.get(l.ideaId); if (!b) _likeMap.set(l.ideaId, b = []); b.push(l); }
  }
  return _likeMap.get(id) || EMPTY_LIST;
};
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
// All device IDs this browser has ever used, lets mine() recognise old posts after a localStorage reset.
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
const OWNED_COLLS = new Set(["doubts", "ideas", "clubs", "gate", "jobs", "challenges", "market", "replies", "stories", "profiles"]);
async function firebaseStore(conf, prefix = "") {
  const base = "https://www.gstatic.com/firebasejs/" + FB_VERSION + "/";
  const [{ initializeApp }, fs, st, au] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-storage.js"), import(base + "firebase-auth.js")]);
  const app = initializeApp(conf);
  const db = fs.getFirestore(app);
  const storage = st.getStorage(app);
  // Anonymous sign-in: no account, no password. It gives every browser a verified session so the
  // security rules can refuse requests that do not come from this app. If it fails (for example
  // the provider is not enabled yet) the app keeps working while the rules still allow it.
  let signedIn = false, authP = null, authError = "", auth = null;
  try {
    // initializeAuth with an in-memory fallback also works in private/incognito tabs.
    auth = (() => { try { return au.initializeAuth(app, { persistence: [au.indexedDBLocalPersistence, au.browserLocalPersistence, au.inMemoryPersistence] }); } catch (_) { return au.getAuth(app); } })();
    if (auth.authStateReady) await auth.authStateReady();   // reuse the saved anonymous user instead of creating a new one
    if (!auth.currentUser) { authP = au.signInAnonymously(auth); await Promise.race([authP, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000))]); }
    signedIn = !!auth.currentUser;
  } catch (e) { authError = (e && (e.code || e.message)) || "unknown"; console.warn("Anonymous sign-in unavailable:", authError); }
  // On a very slow connection sign-in can finish late. Reload once so the board loads with it.
  if (!signedIn && authP) authP.then(() => { try { if (!sessionStorage.getItem("dd-auth-reload")) { sessionStorage.setItem("dd-auth-reload", "1"); location.reload(); } } catch (_) {} }).catch(() => {});
  // A student tapped the sign-in link from their email: attach the verified email to this same session (keeps the same user).
  let linkResult = "";
  try {
    if (auth && au.isSignInWithEmailLink(auth, location.href)) {
      let email = ""; try { email = localStorage.getItem("dd-email-pending") || ""; } catch (_) {}
      if (!email) email = (prompt("Confirm your email address to finish verifying:") || "").trim();
      if (email) {
        try {
          const cred = au.EmailAuthProvider.credentialWithLink(email, location.href);
          if (auth.currentUser && auth.currentUser.isAnonymous) await au.linkWithCredential(auth.currentUser, cred);
          else await au.signInWithEmailLink(auth, email, location.href);
        } catch (e) {
          if (e && (e.code === "auth/credential-already-in-use" || e.code === "auth/email-already-in-use")) await au.signInWithEmailLink(auth, email, location.href);
          else throw e;
        }
        await auth.currentUser.getIdToken(true);   // refresh so the rules see the verified email
        linkResult = "ok"; try { localStorage.removeItem("dd-email-pending"); } catch (_) {}
      }
      try { const u = new URL(location.href); for (const k of ["apiKey", "oobCode", "mode", "lang", "continueUrl"]) u.searchParams.delete(k); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (_) {}
    }
  } catch (e) { linkResult = "error:" + ((e && e.code) || "unknown"); }
  return {
    uid: deviceId(), demo: false, authed: signedIn, authError, linkResult,
    sendEmailLink: async (email) => {
      await au.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname + (SEL ? "?c=" + encodeURIComponent(SEL) : ""), handleCodeInApp: true });
      try { localStorage.setItem("dd-email-pending", email); } catch (_) {}
    },
    signOutAll: async () => { try { if (auth) await au.signOut(auth); } catch (_) {} },
    account: () => { const u = auth && auth.currentUser; return { email: (u && u.email) || "", verified: !!(u && u.email && u.emailVerified) }; },
    subscribe: (coll, cb, onErr, since) => fs.onSnapshot(since ? fs.query(fs.collection(db, prefix + coll), fs.where("createdAt", ">", since)) : fs.collection(db, prefix + coll), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr),
    newId: (coll) => fs.doc(fs.collection(db, prefix + coll)).id,
    // Ask other colleges: write a copy of a doubt into another college's room, and read the answers given there.
    setIn: (room, coll, id, data) => fs.setDoc(fs.doc(db, "rooms/" + room + "/" + coll, id), cleanDoc(auth && auth.currentUser ? { ...data, ownerUid: auth.currentUser.uid } : data)),
    repliesIn: async (room, parentId) => (await fs.getDocs(fs.query(fs.collection(db, "rooms/" + room + "/replies"), fs.where("parentId", "==", parentId), fs.limit(30)))).docs.map(d => ({ id: d.id, ...d.data() })),
    getRoomDoc: async (coll, id) => { const d = await fs.getDoc(fs.doc(db, prefix + coll, id)); return d.exists() ? d.data() : null; },
    delRoomDoc: (coll, id) => fs.deleteDoc(fs.doc(db, prefix + coll, id)),
    // New posts, replies, stories and listings are stamped with the author's sign-in id so only they can change them.
    set: (coll, id, data) => fs.setDoc(fs.doc(db, prefix + coll, id), cleanDoc(OWNED_COLLS.has(coll) && auth && auth.currentUser ? { ...data, ownerUid: auth.currentUser.uid } : data)),
    setTop: (coll, id, data) => fs.setDoc(fs.doc(db, coll, id), cleanDoc(data)),
    battleHit: async (week, slug, ok) => {
      if (!auth || !auth.currentUser) return false;
      const uid = auth.currentUser.uid, now = Date.now(), c = ok ? 1 : 0, pref = fs.doc(db, "battlePlayers", week + "_" + uid);
      let exists = false;
      try { const ps = await fs.getDoc(pref); exists = ps.exists(); if (exists) { const d = ps.data(); if (d.correct + c > 70 || d.total + 1 > 140) return false; } } catch (_) {}
      const b = fs.writeBatch(db);   // both counters move together; the security rules check that they do
      b.set(pref, { week, uid, slug, correct: fs.increment(c), total: fs.increment(1), updatedAt: now }, { merge: true });
      b.set(fs.doc(db, "battleColleges", week + "_" + slug), { week, slug, correct: fs.increment(c), total: fs.increment(1), players: fs.increment(exists ? 0 : 1), updatedAt: now }, { merge: true });
      await b.commit(); return true;
    },
    battleBoard: async (week) => (await fs.getDocs(fs.query(fs.collection(db, "battleColleges"), fs.where("week", "==", week), fs.limit(400)))).docs.map(d => d.data()),
    // Private answers: each student subscribes only to the documents addressed to or written by them (the rules require this).
    subscribeWhere: (coll, field, value, cb, onErr) => fs.onSnapshot(fs.query(fs.collection(db, prefix + coll), fs.where(field, "==", value)), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr),
    // Custom Loop IDs (@name): the name is the document id, so it is unique. A claim also writes the 30-day log in the same batch (the rules check both).
    handleCheck: async (name) => { const d = await fs.getDoc(fs.doc(db, "handles", name)); return d.exists() ? d.data().uid : null; },
    handleClaim: async (name, oldName) => {
      if (!auth || !auth.currentUser) throw new Error("Connect to the internet and try again.");
      const uid = auth.currentUser.uid, at = Date.now(), b = fs.writeBatch(db);
      if (oldName) b.delete(fs.doc(db, "handles", oldName));
      b.set(fs.doc(db, "handleLog", uid), { at }); b.set(fs.doc(db, "handles", name), { uid, createdAt: at }); await b.commit(); return at;
    },
    handleRelease: async (name) => { await fs.deleteDoc(fs.doc(db, "handles", name)); },
    // Weekly Showdown: one student action moves the student's counter and the college counter together (the rules check it).
    showdownHit: async (week, slug, kind) => {
      if (!auth || !auth.currentUser || !["idea", "answer"].includes(kind)) return false;
      const uid = auth.currentUser.uid, now = Date.now(), pref = fs.doc(db, "showdownPlayers", week + "_" + uid + "_" + kind);
      let exists = false;
      try { const ps = await fs.getDoc(pref); exists = ps.exists(); if (exists && ps.data().n >= (kind === "idea" ? 5 : 20)) return false; } catch (_) {}
      const b = fs.writeBatch(db);
      b.set(pref, { week, uid, slug, kind, n: fs.increment(1), updatedAt: now }, { merge: true });
      b.set(fs.doc(db, "showdownColleges", week + "_" + slug + "_" + kind), { week, slug, kind, n: fs.increment(1), players: fs.increment(exists ? 0 : 1), updatedAt: now }, { merge: true });
      await b.commit(); return true;
    },
    showdownBoard: async (week, kind) => (await fs.getDocs(fs.query(fs.collection(db, "showdownColleges"), fs.where("week", "==", week), fs.where("kind", "==", kind), fs.limit(400)))).docs.map(d => d.data()),
    // Background push alerts: get this browser's token (needs the project's web-push key) and store it under the student's own id.
    enablePush: async (vapidKey) => {
      if (!auth || !auth.currentUser || !/^[A-Za-z0-9_-]{60,200}$/.test(vapidKey || "")) throw new Error("Push is not set up yet.");
      if (!("serviceWorker" in navigator) || !("Notification" in window)) throw new Error("This browser does not support push alerts.");
      if ((await Notification.requestPermission()) !== "granted") throw new Error("Alerts were not allowed.");
      const msg = await import(base + "firebase-messaging.js"), reg = await navigator.serviceWorker.ready;
      const token = await msg.getToken(msg.getMessaging(app), { vapidKey, serviceWorkerRegistration: reg });
      if (!token) throw new Error("Could not get an alert token.");
      await fs.setDoc(fs.doc(db, "pushTokens", auth.currentUser.uid), { tokens: [token], updatedAt: Date.now() });
      return true;
    },
    getTop: async (coll, id) => { const snap = await fs.getDoc(fs.doc(db, coll, id)); return snap.exists() ? snap.data() : null; },
    authUid: () => (auth && auth.currentUser ? auth.currentUser.uid : ""),
    idToken: async () => (auth && auth.currentUser ? auth.currentUser.getIdToken() : ""),
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
  "lanja", "lanjakodaka", "lanjakoduku", "dengu", "dengey", "puku", "modda", "pooku", "erripuku", "erripooku", "naayala", "nayala", "sulli", "otha", "punda", "thevidiya",
  "bsdk", "chod", "chodu", "gaand", "gand", "bhadwa", "bhadwe", "madharchod", "mkc", "fck", "fuk", "fuker", "dickhead", "wanker", "bloody fool"];
const BLOCKED_SQUASH = BLOCKED.map(w => w.replace(/(.)\1+/g, "$1"));
function hasBadWords(text) {
  const t = " " + String(text || "").toLowerCase().replace(/[@4]/g, "a").replace(/[0]/g, "o").replace(/[1!|]/g, "i").replace(/[3]/g, "e").replace(/[$5]/g, "s").replace(/[^a-z\u0900-\u0d7f]+/g, " ") + " ";
  const joined = t.replace(/ /g, "");
  const hit = (txt, list) => list.some(w => txt.includes(" " + w + " ") || txt.includes(" " + w + "s ") || (w.length >= 8 && txt.replace(/ /g, "").includes(w)));
  // second pass squeezes stretched letters ("fuuuck" -> "fuck") and stray separators ("f u c k")
  const squash = t.replace(/(.)\1+/g, "$1");
  const spaced = " " + t.replace(/\b([a-z]) (?=[a-z]\b)/g, "$1").replace(/\s+/g, " ") + " ";
  return hit(t, BLOCKED) || hit(squash, BLOCKED_SQUASH) || hit(spaced, BLOCKED);
}
const LANGUAGE_MSG = "Please keep it respectful. Remove abusive words and try again.";

// At most one post every 15 seconds and 15 posts an hour from one phone or computer.
// Device block (set by an admin in the console) and automatic pause after repeated reports.
const isBlockedDevice = () => { const ids = allMyIds(); return state.blocked.some(id => ids.has(id)); };
function myHiddenCount() {
  const ids = allMyIds(); let n = 0;
  for (const k of [...CAMPUS_COLLS, "replies"]) for (const x of state[k] || []) {
    if (!ids.has(x.authorId) || x.deleted) continue;
    const r = x.reports || []; if (r.length >= REPORT_LIMIT || r.filter(v => String(v).endsWith("|o")).length >= 2 || r.filter(v => /\|[bp]$/.test(String(v))).length >= 2) n++;
  }
  return n;
}
function postingBlocked() {
  if (state.verifiedPosting && !myAccount().verified) return "\u{1F512} Posting needs a verified email, to keep students safe. Open Profile and tap \u201CVerify your email\u201D. Reading is always open.";
  if (TENANT && TENANT.requireVerified && !myVerified()) return "🔒 This college board needs a verified college email to post. Open Profile and tap “Verify your email” and use your college email.";
  if (isBlockedDevice()) return "🚫 This device has been blocked from posting for breaking the class rules. Contact the admin to appeal.";
  let st = {}; try { st = JSON.parse(localStorage.getItem("dd-restrict") || "{}"); } catch (_) {}
  const n = myHiddenCount();
  if (n >= 2 && n > (st.n || 0)) { st = { n, until: Date.now() + (n >= 4 ? 72 : 24) * 3600000 }; try { localStorage.setItem("dd-restrict", JSON.stringify(st)); } catch (_) {} }
  if (st.until && Date.now() < st.until) return "⏳ Several of your posts were hidden after reports from classmates, so posting is paused for about " + Math.ceil((st.until - Date.now()) / 3600000) + " more hour(s). Please keep posts academic and respectful.";
  return "";
}
function spamCheck() {
  const blockedMsg = postingBlocked(); if (blockedMsg) return blockedMsg;
  let times = [];
  try { times = JSON.parse(localStorage.getItem("dd-post-times") || "[]"); } catch (_) {}
  const now = Date.now(), recent = times.filter(t => now - t < 3600000);
  if (recent.length && now - recent[recent.length - 1] < 15000) return "Slow down a little, wait " + Math.ceil((15000 - (now - recent[recent.length - 1])) / 1000) + " more seconds before posting again.";
  if (recent.length >= 15) return "You have posted 15 times in the last hour. Take a short break and try again later.";
  return "";
}
// At most 30 new doubts per student per day (counted on this device, resets at midnight).
const DOUBT_DAILY_MAX = 30;
const doubtsToday = () => { const st = readJSON("dd-doubt-day", {}); return st.day === dayStr() ? (st.n || 0) : 0; };
const noteDoubt = () => writeJSON("dd-doubt-day", { day: dayStr(), n: doubtsToday() + 1 });
function notePosted() {
  let times = [];
  try { times = JSON.parse(localStorage.getItem("dd-post-times") || "[]"); } catch (_) {}
  times = [...times.filter(t => Date.now() - t < 3600000), Date.now()];
  try { localStorage.setItem("dd-post-times", JSON.stringify(times)); } catch (_) {}
}

// Posts reported by this many classmates are hidden until the teacher checks them in Firebase.
const REPORT_LIMIT = 3;
// A report is the reporter's id, optionally with a reason: "<id>|o" off-topic, "|a" abuse, "|s" spam.
// "|b" bullying or unsafe, "|p" personal info: two of these hide a post at once. Two off-topic reports (or three of any kind) hide a post for everyone.
const isHidden = (x) => { const r = x.reports || []; return (r.length >= REPORT_LIMIT || r.filter(v => String(v).endsWith("|o")).length >= 2 || r.filter(v => /\|[bp]$/.test(String(v))).length >= 2 || reportedByMe(x)) && !mine(x); };
const reportedByMe = (x) => store && (x.reports || []).some(v => String(v).split("|")[0] === store.uid);
// Academic tabs only: blocks greetings and one-word chatter, and asks for a real question or answer.
const CHATTER = /^(hi+|hello+|hey+|hii+|hlo|ok+|okay|k|hmm+|lol|haha+|bro|anyone|any ?one( there)?|yes|no|yo|sup|wassup|good (morning|night|evening|afternoon)|gm|gn|how are you|test|testing|\.+|\?+)[\s!.?,]*$/i;
const isAcademicTab = (tab) => tab === "doubts" || tab === "gate";
function academicProblem(kind, text, hasAttachment) {
  const t = String(text || "").trim();
  if (CHATTER.test(t)) return "This space is for academic questions and answers. Please write a real " + kind + ", or use Ideas or Clubs for casual chat.";
  if (kind === "answer" && t.length < 10 && !hasAttachment) return "Please write a helpful answer of at least 10 characters, or attach a page or file.";
  return "";
}
async function reportPost(coll, x, reason) {
  if (!store || reportedByMe(x)) return;
  const reports = [...(x.reports || []), store.uid + (reason ? "|" + reason : "")].slice(-100);
  try { await store.update(coll, x.id, { reports }); showNotice("Thanks. The post was reported. Posts with " + REPORT_LIMIT + " reports are hidden for everyone."); }
  catch (e) { showNotice(errText(e)); }
}
function reportButton(coll, x) {
  if (mine(x)) return null;
  if (reportedByMe(x)) return el("span", { class: "hint" }, "🚩 Reported");
  const wrap = el("span", { class: "report-wrap" });
  const reset = () => wrap.replaceChildren(el("button", { class: "linkbtn danger", type: "button", title: "Report a post", onclick: choose }, "🚩 Report"));
  const choose = () => {
    wrap.replaceChildren(el("small", { class: "hint" }, "Why? "), ...[["o", "Off-topic"], ["a", "Abuse"], ["s", "Spam"], ["b", "Bullying or unsafe"], ["p", "Personal info"]].map(([code, label]) => el("button", { class: "linkbtn danger", type: "button", onclick: (e) => { e.currentTarget.disabled = true; reportPost(coll, x, code); wrap.replaceChildren(el("span", { class: "hint" }, "🚩 Reported")); } }, label)));
    setTimeout(() => { if (wrap.isConnected && wrap.querySelector("button:not([disabled])")) reset(); }, 6000);
  };
  reset();
  return wrap;
}
// Delete only hides a post (deleted: true); nothing is erased, so the teacher can restore it in Firebase.
const softDelete = (coll, id) => store.update(coll, id, { deleted: true });

// GATE PYQ papers data, official GATE archive + GeeksForGeeks solutions (all free, no login)
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
      el("span", { class: "pyq-panel-title" }, icons[branch] || "📄", " ", branch, ", Previous Year Papers"),
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
      try { const img = await loadImage(f); const why = await imageProblem(img); if (why) { say(why); continue; } list.push(toJpeg(img, img.naturalWidth, img.naturalHeight)); }
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
  // Not on the first days: new students should see the welcome and home screen first, not an install pop-up.
  let days = 0; try { days = (JSON.parse(localStorage.getItem('dd-visits') || '{}').n) || 0; } catch (_) {}
  const banner = $('installBanner'); if (banner) banner.hidden = !(days >= 4);
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
    if (t) { const s = t.querySelector('span'); if (s) s.textContent = _newCount + ' new post' + (_newCount > 1 ? 's' : '') + '. Tap to view'; t.hidden = false; }
  }
}

// ---------- bottom navigation ----------
function renderBottomNav() {
  const nav = $('bottomNav'); if (!nav) return;
  const icons = { doubts: '❓', ideas: '💡', clubs: '🏛', gate: '🎯', challenges: '🎮', market: '🛒' };
  const labels = { doubts: 'Doubts', ideas: 'Ideas', clubs: 'Clubs', gate: EXAM_LABEL.length > 8 ? EXAM_LABEL.split(/[ /]/)[0] : EXAM_LABEL, challenges: 'Challenges', market: 'Market' };
  nav.replaceChildren(
    ...['doubts', 'ideas', 'clubs', 'market', 'gate'].filter(tab => (!isSimple() || tab === 'doubts' || tab === 'ideas' || state.tab === tab) && (!focusOn() || isAcademicTab(tab)) && featureOn(tab === 'market' ? 'market' : 'doubts')).map(tab => {
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
    isSimple() ? el('button', { type: 'button', class: 'bnav-btn', onclick: () => setSimple(false) }, el('span', { class: 'bnav-icon' }, '⋯'), el('span', { class: 'bnav-label' }, 'More')) : null,
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

// A styled state picker (the phone's own select list cannot be coloured): a button that opens a searchable bottom sheet.
function stateSheet(getCur, setCur, getCount) {
  const label = () => { const c = getCur(); return c === "All India" ? "\u{1F1EE}\u{1F1F3} All India (search by name)" : "\u{1F4CD} " + c; };
  const btn = el("button", { type: "button", class: "state-btn", "aria-haspopup": "dialog", "aria-label": "State" }, el("span", {}, label()), el("i", { "aria-hidden": "true" }, "\u25BE"));
  btn.sync = () => { btn.firstChild.textContent = label(); };
  btn.onclick = () => {
    const close = () => { sheet.remove(); document.removeEventListener("keydown", esc); }, esc = (e) => { if (e.key === "Escape") close(); };
    const list = el("div", { class: "ss-list", role: "listbox", "aria-label": "States" });
    const draw = (needle) => {
      const n = (needle || "").trim().toLowerCase(), cur = getCur();
      const opts = ["All India", ...INDIA_STATES].filter(s => !n || s.toLowerCase().includes(n));
      list.replaceChildren(...(opts.length ? opts.map(s => el("button", { type: "button", role: "option", "aria-selected": String(s === cur), class: "ss-opt" + (s === cur ? " on" : ""), onclick: () => { setCur(s); btn.sync(); close(); } },
        el("span", {}, s === "All India" ? "\u{1F1EE}\u{1F1F3} All India" : s), getCount && s !== "All India" ? el("small", {}, String(getCount(s))) : null, el("i", { "aria-hidden": "true" }, s === cur ? "\u2713" : ""))) : [el("p", { class: "hint" }, "No state found.")]));
    };
    const q = el("input", { type: "search", placeholder: "Search states\u2026", "aria-label": "Search states", autocomplete: "off" }); q.addEventListener("input", () => draw(q.value));
    const sheet = el("div", { class: "ss-back", onclick: (e) => { if (e.target === sheet) close(); } }, el("div", { class: "ss-card", role: "dialog", "aria-modal": "true", "aria-label": "Choose your state" },
      el("div", { class: "ss-grab" }), el("h3", {}, "Choose your state"), q, list, el("button", { type: "button", class: "btn ss-close", onclick: close }, "Close")));
    document.body.append(sheet); document.addEventListener("keydown", esc); draw(""); setTimeout(() => { const s = list.querySelector(".on"); if (s) s.scrollIntoView({ block: "center" }); }, 30);
  };
  return btn;
}
// First-visit welcome: three short cards (safe, rewarding, smart). Shown once, only to brand-new visitors who already picked a college.
const WELCOME = [
  ["🛡️", "Ask without fear", "Sign in is anonymous, you choose your name, and admins and students moderate every post. Bad posts are hidden fast and abusive devices are blocked."],
  ["🏆", "Answer together, earn rewards", "Help a classmate to earn points, build a daily streak, win badges and show up on the Top Helpers board. Stories and quizzes keep it fun."],
  ["🙏", "Respect for everyone", "We honour our students, teachers and staff. Speak kindly, help your juniors, thank those who help you, and treat every person here the way you want your own family to be treated. Together we grow."],
  ["", "Study smarter", "Daily quiz, Study Lab, flashcards, CGPA tools, jobs and papers, all in one place. Everything on the board is free. Plus adds extras like mock tests and an AI helper."],
];
function showWelcome(force, startId) {
  if (document.getElementById("welcome")) return;
  const STEPS = ["about", "college", "name", "interests", "ready"], curSlug = TENANT ? TENANT.slug : IS_RGUKT ? "rgukt" : "";
  const INTERESTS = [["❓", "Clear my doubts", "doubts"], ["📝", "Prepare for exams", "exams"], ["💼", "Placements and jobs", "placements"], ["🎉", "Clubs and friends", "friends"], ["🔎", "Just exploring", "explore"]];
  const picked = new Set(readJSON("dd-interests", []));
  let step = Math.max(0, STEPS.indexOf(startId || "about")), nameVal = (getName() || "").trim(), pickSlug = curSlug, pickName = curSlug ? COLLEGE : "", cq = "", ctype = "all", cst = (() => { try { return localStorage.getItem("dd-state") || ""; } catch (_) { return ""; } })() || (curSlug && curSlug !== "rgukt" ? ((DIRECTORY.find(c => c.slug === curSlug) || {}).state || "") : "") || "Andhra Pradesh";
  const TOTAL = STEPS.length, box = el("div", { id: "welcome", class: "welcome", role: "dialog", "aria-modal": "true", "aria-label": "Welcome to " + BRAND });
  const finish = () => { try { localStorage.setItem("dd-welcome-done", "1"); if (!localStorage.getItem("dd-launch-gone")) { localStorage.setItem("dd-launch", "1"); } } catch (_) {} if (STEPS[step] === "ready") setTimeout(() => confetti(130), 250); document.removeEventListener("keydown", onKey); box.remove(); todayKey = ""; try { renderHeader(); } catch (_) {} };
  const onKey = (e) => { if (e.key === "Escape") finish(); };
  const saveStep = () => { if (STEPS[step] === "college" && pickSlug && pickSlug !== curSlug) { try { sessionStorage.setItem("dd-ob-resume", "name"); localStorage.setItem("dd-state", cst); } catch (_) {} document.removeEventListener("keydown", onKey); switchCollege(pickSlug); return; } if (STEPS[step] === "name") { const v = nameVal.trim().slice(0, 30); if (v) setName(v); } if (STEPS[step] === "interests") writeJSON("dd-interests", [...picked]); };
  const go = (d) => { if (d > 0 && STEPS[step] === "college" && !pickSlug) { const c = box.querySelector(".ob-chosen"); if (c) { c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake"); } return; } saveStep(); step = Math.max(0, Math.min(TOTAL - 1, step + d)); paint(); };
  const start = (fn) => () => { saveStep(); finish(); setTimeout(fn, 120); };
  function paint() {
    const last = step === TOTAL - 1, who = nameVal.trim() ? nameVal.trim().split(/\s+/)[0] : "";
    const bar = el("div", { class: "ob-bar", "aria-hidden": "true" }, ...Array.from({ length: TOTAL }, (_, k) => el("span", { class: k <= step ? "on" : "" })));
    let body;
    const sid = STEPS[step];
    if (sid === "about") {
      const ab = (window.DOUBT_DESK_CONFIG && window.DOUBT_DESK_CONFIG.about) || {}, line = (icon, t, d) => el("div", { class: "ab-pillar" }, el("span", { "aria-hidden": "true" }, icon), el("div", {}, el("b", {}, t), el("small", {}, d)));
      body = [el("div", { class: "ob-loopy ob-brand" }, brandMark(84)), el("h2", {}, "About " + BRAND), el("p", { class: "ob-say" }, "We are a team of students and teachers who wanted one safe, friendly place for every campus to ask, answer and grow together. " + BRAND + " is built by students, for students, and we promise to earn your trust every day."),
        el("div", { class: "ab-list" }, line("🛡️", "Safe and moderated", "Anonymous sign-in, reported posts hidden fast, abusive devices blocked."), line("🔒", "Private by design", "No ads. We never sell your data. Only your chosen name is shown."), line("🙏", "Respect for everyone", "Students, teachers and staff are honoured here."), line("🆓", "Free to learn", "The board, quizzes and Study Lab are free forever. Plus is optional.")),
        el("p", { class: "ab-meta" }, [ab.founder ? "Founded by " + ab.founder : "", ab.college ? ab.college : "", "Made with ❤️ in India"].filter(Boolean).join(" · ")),
        el("p", { class: "ab-meta" }, ab.email ? el("a", { href: "mailto:" + ab.email }, "Write to us: " + ab.email) : null, ab.email ? " · " : "", el("a", { href: "about.html", target: "_blank", rel: "noopener" }, "Our full story"), " · ", el("a", { href: "privacy.html", target: "_blank", rel: "noopener" }, "Privacy"), " · ", el("a", { href: "terms.html", target: "_blank", rel: "noopener" }, "Terms")),
        el("div", { class: "ab-terms" }, el("b", {}, "Terms in short"), el("ul", {}, el("li", {}, "Be kind. No abuse, cheating, fake posts or spam."), el("li", {}, "Never share anyone's private details, passwords or OTPs."), el("li", {}, "Posts that break the rules are hidden and devices can be blocked."), el("li", {}, BRAND + " is a student community app. It is not run by, or affiliated with, any college.")),
          el("label", { class: "ab-agree" }, el("input", { type: "checkbox", id: "ob-terms", checked: readJSON("dd-terms", null) ? "" : null }), el("span", {}, "I am at least 18 years old (at RGUKT: B.Tech 2nd year or above). I have read and agree to the ", el("a", { href: "terms.html", target: "_blank", rel: "noopener" }, "Terms of Use"), " and the ", el("a", { href: "privacy.html", target: "_blank", rel: "noopener" }, "Privacy Policy"), ".")))];
    } else if (sid === "college") {
      const badge = (slug, name, st) => { const [ca, cb] = slug === "rgukt" ? STATE_COLORS["Andhra Pradesh"] : collegeColors(slug, st || ""); const ini = name.replace(/\(.*?\)/g, "").split(/[\s-]+/).filter(w => /^[A-Za-z]/.test(w) && !/^(of|and|the|for|in)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "C"; const b = el("span", { class: "col-badge", "aria-hidden": "true" }, ini); b.style.setProperty("background", "linear-gradient(135deg," + ca + "," + cb + ")"); return b; };
      const GRP = { all: "All", engineering: "Engineering", medical: "Medical", agri: "Agriculture", law: "Law", degree: "Degree", design: "Design", general: "Other" };
      const all = [{ slug: "rgukt", name: "RGUKT AP", state: "Andhra Pradesh", sub: "Rajiv Gandhi University of Knowledge Technologies, Andhra Pradesh", grp: "engineering" }, ...DIRECTORY.filter(d => d.slug !== "rgukt").map(d => ({ slug: d.slug, name: d.name, state: d.state || "Andhra Pradesh", sub: [d.city, d.kind].filter(Boolean).join(" \u00B7 "), grp: kindGroup(d.kind) }))];
      const hl = (text, needle) => { if (!needle) return text; const k = text.toLowerCase().indexOf(needle); return k < 0 ? text : [text.slice(0, k), el("mark", {}, text.slice(k, k + needle.length)), text.slice(k + needle.length)]; };
      const peek = (c) => collegeFacts(c.slug, c.grp).chips;
      const list = el("div", { class: "ob-colist", role: "listbox", "aria-label": "Colleges" }), chosen = el("p", { class: "ob-chosen", role: "status" }, ""), count = el("p", { class: "ob-count", "aria-live": "polite" }, ""), types = el("div", { class: "ob-types", role: "tablist", "aria-label": "College type" });
      const letters = el("div", { class: "ob-letters", role: "group", "aria-label": "Jump to a letter" }); let cl = "";
      const stSel = stateSheet(() => cst, (v) => { cst = v; cl = ""; browsing = true; fill(); });
      list.addEventListener("touchstart", () => { try { if (document.activeElement === q) q.blur(); } catch (_) {} }, { passive: true });
      let browsing = !pickSlug;   // false once a college is chosen: the list folds away and a preview card shows instead
      const pickBox = el("div", { class: "ob-pick", "aria-live": "polite" });
      const drawPick = () => {
        const c = pickSlug ? (all.find(x => x.slug === pickSlug) || { slug: pickSlug, name: pickName, state: "", sub: "", grp: "general" }) : null, show = !!c && !browsing;
        pickBox.hidden = !show; [stSel, q, types, letters, count, list].forEach(n => { if (n) n.hidden = show; }); chosen.hidden = show || !pickSlug;
        if (!show) return;
        const [c1, c2] = c.slug === "rgukt" ? STATE_COLORS["Andhra Pradesh"] : collegeColors(c.slug, c.state || "");
        pickBox.style.setProperty("--c1", c1); pickBox.style.setProperty("--c2", c2);
        pickBox.replaceChildren(el("div", { class: "pk-top" }, badge(c.slug, c.name, c.state), el("div", { class: "pk-name" }, el("small", {}, "Your college"), el("strong", {}, c.name), c.sub ? el("span", {}, c.sub) : null)),
          el("div", { class: "pk-chips" }, ...peek(c).map(t => el("i", {}, t))),
          (() => { const f = collegeFacts(c.slug, c.grp); return el("p", { class: "pk-src" + (f.verified ? " ok" : "") }, el("b", {}, f.verified ? "Verified source" : "Standard setup"), " " + f.note); })(),
          el("p", { class: "pk-line" }, "Your own private board for " + c.name + ", with its own subjects and clubs."),
          el("button", { type: "button", class: "pk-change", onclick: () => { browsing = true; fill(); try { q.focus(); } catch (_) {} } }, "\u21BA Change college"));
      };
      const mark = () => { chosen.textContent = pickSlug ? "\u2705 " + pickName : ""; chosen.hidden = !pickSlug; };
      const pick = (c) => {
        pickSlug = c.slug; pickName = c.name; browsing = false;
        try { q.blur(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); if (navigator.vibrate) navigator.vibrate(12); } catch (_) {}
        mark(); fill(); const nb = box.querySelector(".rowbtns .btn.primary"); if (nb) nb.textContent = pickSlug !== curSlug ? "Continue with " + (pickName.length > 16 ? pickName.slice(0, 15) + "\u2026" : pickName) : "Continue";
        setTimeout(() => { const on = list.querySelector(".ob-col.on"); if (on) on.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 40);
      };
      const drawTypes = (pool) => {
        const present = ["all", ...Object.keys(GRP).filter(k => k !== "all" && pool.some(c => c.grp === k))];
        types.replaceChildren(...present.map(k => el("button", { type: "button", role: "tab", "aria-selected": String(ctype === k), class: "ob-type" + (ctype === k ? " on" : ""), onclick: () => { ctype = k; fill(); } }, GRP[k] + (k === "all" ? "" : " \u00B7 " + pool.filter(c => c.grp === k).length))));
      };
      const fill = () => {
        drawPick(); if (pickSlug && !browsing) return;
        const needle = cq.trim().toLowerCase(), inState = all.filter(c => (cst === "All India" || c.state === cst) && (!needle || (c.name + " " + c.sub).toLowerCase().includes(needle)));
        if (cst === "All India" && !needle) { types.replaceChildren(); count.textContent = ""; list.replaceChildren(el("p", { class: "hint" }, "Type your college or city to search all of India, or pick a state above.")); return; }
        if (ctype !== "all" && !inState.some(c => c.grp === ctype)) ctype = "all";
        drawTypes(inState);
        const pool = inState.filter(c => ctype === "all" || c.grp === ctype), initial = (c) => (c.name.replace(/^the\s+/i, "")[0] || "").toUpperCase();
        const have = new Set(pool.map(initial)); if (cl && !have.has(cl)) cl = "";
        letters.replaceChildren(...[...have].sort().map(L => el("button", { type: "button", class: "ob-let" + (cl === L ? " on" : ""), "aria-pressed": String(cl === L), onclick: () => { cl = cl === L ? "" : L; try { if (navigator.vibrate) navigator.vibrate(6); } catch (_) {} fill(); } }, L)));
        letters.hidden = have.size < 4;
        { const on = letters.querySelector(".ob-let.on"); if (on) letters.scrollLeft = Math.max(0, on.offsetLeft - letters.clientWidth / 2 + on.offsetWidth / 2); }
        const rows = cl ? pool.filter(c => initial(c) === cl) : pool;
        count.textContent = rows.length + " college" + (rows.length === 1 ? "" : "s") + (cst === "All India" ? "" : " in " + cst);
        list.replaceChildren(...(rows.length ? rows.slice(0, 60).map(c => { const on = pickSlug === c.slug;
          return el("button", { class: "ob-col" + (on ? " on" : ""), type: "button", role: "option", "aria-selected": String(on), onclick: () => pick(c),
            onkeydown: (ev) => { const b = ev.currentTarget; if (ev.key === "ArrowDown" && b.nextElementSibling) { ev.preventDefault(); b.nextElementSibling.focus(); } else if (ev.key === "ArrowUp") { ev.preventDefault(); (b.previousElementSibling || q).focus(); } } },
            badge(c.slug, c.name, c.state), el("span", { class: "col-text" }, el("strong", {}, ...[].concat(hl(c.name, needle))), c.sub ? el("small", {}, ...[].concat(hl(c.sub, needle))) : null)); }) : [el("p", { class: "hint" }, "No match. Try another spelling, or pick All India and search by name.")]));
      };
      const q = el("input", { type: "search", enterkeyhint: "done", placeholder: "Search your college or city\u2026", "aria-label": "Search colleges", autocomplete: "off", value: cq });
      q.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); const first = list.querySelector(".ob-col"); if (first && cq.trim()) { first.click(); } else q.blur(); } else if (ev.key === "ArrowDown") { ev.preventDefault(); const f = list.querySelector(".ob-col"); if (f) f.focus(); } });
      q.addEventListener("input", () => { cq = q.value; cl = ""; browsing = true; fill(); });
      let last = ""; try { last = localStorage.getItem("dd-college-name") || ""; } catch (_) {}
      const lastSlug = curSlug, lastBtn = last && lastSlug && !pickSlug ? el("button", { type: "button", class: "ob-last", onclick: () => { const c = all.find(x => x.slug === lastSlug); if (c) { cst = c.state || cst; pick(c); } } }, "\u21A9 Continue with " + last) : null;
      body = [el("h2", {}, "Choose your college \u{1F3EB}"), el("p", { class: "ob-say" }, "Each college has its own private board, subjects and clubs. Pick yours and I will set everything up."), lastBtn, pickBox, stSel, q, types, letters, count, list, chosen];
      mark(); fill();
    } else if (sid === "name") {
      const inp = el("input", { type: "text", maxlength: "30", placeholder: "Your first name", "aria-label": "Your name", autocomplete: "given-name", value: nameVal });
      inp.addEventListener("input", () => { nameVal = inp.value; });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(1); });
      body = [el("div", { class: "ob-loopy" }, loopyMini()), el("h2", {}, "Welcome to " + BRAND + " family"),
        el("div", { class: "ob-heart", "aria-label": "A message for you" },
          el("p", { class: "hl lead" }, "Behind every question is a student brave enough to ask."),
          el("p", { class: "hl" }, "Maybe you are far from home. Maybe exam week feels heavy. Maybe it seems everyone else already knows the answer."),
          el("p", { class: "hl" }, "They don\u2019t. We didn\u2019t either."),
          el("p", { class: "hl" }, "Here no question is small and nobody studies alone. Seniors who once sat where you sit are ready to help, and one day you will help someone too."),
          el("p", { class: "hl sign" }, "We are glad you are here. The Campus Loop team")),
        el("p", { class: "ob-say" }, "So, what should I call you?"), inp];
    } else if (sid === "interests") {
      body = [el("div", { class: "ob-loopy" }, loopyMini()), el("h2", {}, (who ? "Nice to meet you, " + who : "Nice to meet you") + "! \u{1F44B}"), el("p", { class: "ob-say" }, "What brings you here? Pick any. I will tailor your home screen."),
        el("div", { class: "ob-chips" }, ...INTERESTS.map(([ic, t, k]) => el("button", { class: "ob-chip" + (picked.has(k) ? " on" : ""), "data-k": k, type: "button", "aria-pressed": String(picked.has(k)), onclick: (e) => { if (picked.has(k)) picked.delete(k); else picked.add(k); e.currentTarget.classList.toggle("on", picked.has(k)); e.currentTarget.setAttribute("aria-pressed", String(picked.has(k))); } }, ic + " " + t)))];
    } else {
      const wantsJobs = picked.has("placements"), starters = [["\u2753 Ask my first doubt", () => { const b = $("askBtn"); if (b) b.click(); }, true], ["\u{1F9E0} Try today\u2019s quiz", () => showPanel("quiz"), false], [wantsJobs ? "\u{1F4C4} Build my resume" : "\u{1F9F0} Explore everything", () => showPanel(wantsJobs ? "resume" : "explore"), false]];
      body = [el("div", { class: "ob-loopy" }, loopyMini()), el("h2", {}, "You\u2019re all set" + (who ? ", " + who : "") + "! \u{1F389}"), el("p", { class: "ob-say" }, "Welcome to the family. Finish your first 3 steps on the home screen to unlock a free gift. \u{1F381}"),
        el("div", { class: "ob-start" }, ...starters.map(([t, fn, pri]) => el("button", { class: "btn" + (pri ? " primary" : ""), type: "button", onclick: start(fn) }, t)))];
    }
    box.replaceChildren(el("div", { class: "welcome-card ob-card" }, el("button", { class: "welcome-skip", type: "button", onclick: finish }, "Skip"), bar, el("div", { class: "ob-step ob-s-" + sid }, ...body),
      el("div", { class: "rowbtns" }, step > 0 ? el("button", { class: "btn", type: "button", onclick: () => go(-1) }, "Back") : null, last ? el("button", { class: "btn", type: "button", onclick: finish }, "Close") : el("button", { class: "btn primary", type: "button", onclick: () => go(1) }, sid === "about" ? "Continue" : sid === "college" ? (pickSlug && pickSlug !== curSlug ? "Continue with " + (pickName.length > 16 ? pickName.slice(0, 15) + "\u2026" : pickName) : "Continue") : "Next"))));
    const f = box.querySelector("input") || box.querySelector(".btn.primary"); if (f && sid !== "about") f.focus();
    // The About step: Continue switches on once the whole text has been scrolled through AND the terms box is ticked.
    if (sid === "about") {
      const stepEl = box.querySelector(".ob-step"), nextBtn = box.querySelector(".ob-card > .rowbtns .btn.primary"), skipBtn = box.querySelector(".welcome-skip"), agree = box.querySelector("#ob-terms");
      if (stepEl && nextBtn && agree) {
        const hint = el("p", { class: "ob-scrollhint", role: "status" }, "");
        const atEnd = () => stepEl.scrollTop + stepEl.clientHeight >= stepEl.scrollHeight - 12;
        const update = () => {
          const end = atEnd(), ok = end && agree.checked;
          nextBtn.disabled = !ok; nextBtn.classList.toggle("locked", !ok); if (ok) nextBtn.removeAttribute("aria-disabled"); else nextBtn.setAttribute("aria-disabled", "true");
          if (skipBtn) skipBtn.hidden = !agree.checked;
          hint.textContent = !end ? "\u2193 Scroll to read everything" : !agree.checked ? "Tick the box to agree to the terms" : "";
          if (!hint.textContent) hint.remove(); else if (!hint.isConnected) stepEl.parentNode.insertBefore(hint, stepEl.nextSibling);
          if (end) stepEl.style.maskImage = stepEl.style.webkitMaskImage = "none";
        };
        agree.addEventListener("change", () => { if (agree.checked) writeJSON("dd-terms", { v: 1, at: Date.now() }); else { try { localStorage.removeItem("dd-terms"); } catch (_) {} } try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {} update(); });
        stepEl.addEventListener("scroll", update, { passive: true });
        requestAnimationFrame(() => { update(); setTimeout(update, 600); });
      }
    }
  }
  // Keyboard-aware: when the on-screen keyboard opens, fit the card into the space that is really visible and tuck away the long text.
  const vv = window.visualViewport, fit = () => {
    if (!box.isConnected) { if (vv) { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); } return; }
    // Fit the card to what is really visible (browser bars and keyboard excluded). The dark overlay still covers the whole screen.
    const vh = vv ? vv.height : innerHeight, top = vv ? Math.max(0, vv.offsetTop) : 0, bottom = vv ? Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) : 0, kb = bottom > 120;
    box.style.setProperty("--vvh", Math.round(vh) + "px"); box.style.setProperty("--vvt", Math.round(top) + "px"); box.style.setProperty("--vvb", bottom + "px"); box.style.setProperty("--kbh", (kb ? bottom : 0) + "px"); box.classList.toggle("kb", kb);
    if (kb) { const act = document.activeElement; if (act && act.scrollIntoView && box.contains(act)) setTimeout(() => act.scrollIntoView({ block: "nearest" }), 60); }
  };
  if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
  document.addEventListener("keydown", onKey); paint(); document.body.append(box); fit();
}
// What we can honestly say about a college. Numbers are shown only when they come from a checked source; everything else says "standard setup".
const GRP_NAME = { engineering: "engineering", medical: "medical", agri: "agriculture", law: "law", degree: "degree", design: "design", general: "general" };
function collegeFacts(slug, grp) {
  if (slug === "rgukt") {
    const C = window.RGUKT_CURRICULUM, chips = [];
    if (C && C.branches) chips.push(Object.keys(C.branches).length + " branches");
    if (CAMPUSES.length) chips.push(CAMPUSES.length + " campuses");
    return { chips, note: "Branches and subject codes come from the RGUKT timetable.", verified: true };
  }
  const cd = (window.COLLEGE_DATA || {})[slug];
  if (cd && cd.source) { let host = ""; try { host = new URL(cd.source).hostname.replace(/^www\./, ""); } catch (_) {} return { chips: ["Subjects from the official website"], note: "Subject names are taken from " + (host || "the official website") + ".", verified: true }; }
  return { chips: ["Standard subject list for " + (GRP_NAME[grp] || "general") + " colleges"], note: "Not yet checked against the college\u2019s own website. Staff can customise it.", verified: false };
}
// The "welcome to your college" reveal: a premium brand card shown once after a college is chosen or changed.
function showCollegeReveal() {
  if (NO_COLLEGE || !SEL) return;
  let seen = ""; try { seen = localStorage.getItem("dd-revealed") || ""; } catch (_) {}
  if (seen === SEL) return;
  const dir = DIRECTORY.find(c => c.slug === SEL) || {};
  const st = IS_RGUKT ? "Andhra Pradesh" : (dir.state || (TENANT && TENANT.state) || "");
  const [c1, c2] = IS_RGUKT ? STATE_COLORS["Andhra Pradesh"] : collegeColors(SEL, st);
  const full = IS_RGUKT ? "Rajiv Gandhi University of Knowledge Technologies, Andhra Pradesh" : SEL === "rgukt-basara" ? "Rajiv Gandhi University of Knowledge Technologies, Basara, Telangana" : (TENANT && TENANT.name) || dir.name || COLLEGE;
  const place = IS_RGUKT ? "Nuzvid \u00B7 RK Valley \u00B7 Ongole \u00B7 Srikakulam" : [dir.city, dir.kind, st].filter(Boolean).join(" \u00B7 ");
  const NS = "http://www.w3.org/2000/svg", mk = (t, at) => { const n = document.createElementNS(NS, t); for (const k in at) n.setAttribute(k, at[k]); return n; };
  const sky = mk("svg", { viewBox: "0 0 400 120", class: "cr-sky", "aria-hidden": "true", preserveAspectRatio: "xMidYMax slice" });
  sky.append(mk("path", { d: "M0 120 L0 92 Q60 70 120 88 T240 84 T400 80 L400 120Z", fill: "rgb(0 0 0 / .22)" }),
    mk("path", { d: "M150 120 V74 H160 V60 L200 38 L240 60 V74 H250 V120 Z", fill: "rgb(255 255 255 / .16)" }), mk("rect", { x: 188, y: 70, width: 24, height: 50, rx: 12, fill: "rgb(0 0 0 / .25)" }),
    mk("path", { d: "M200 38 V22", stroke: "rgb(255 255 255 / .5)", "stroke-width": 2 }), mk("path", { d: "M200 22 l16 5 -16 5z", fill: "#fde68a" }),
    mk("rect", { x: 96, y: 86, width: 48, height: 34, fill: "rgb(255 255 255 / .1)" }), mk("rect", { x: 256, y: 82, width: 52, height: 38, fill: "rgb(255 255 255 / .1)" }),
    mk("circle", { cx: 70, cy: 100, r: 14, fill: "rgb(255 255 255 / .09)" }), mk("circle", { cx: 336, cy: 98, r: 16, fill: "rgb(255 255 255 / .09)" }));
  const close = () => { try { localStorage.setItem("dd-revealed", SEL); } catch (_) {} ov.classList.add("out"); setTimeout(() => ov.remove(), 260); try { confetti(); } catch (_) {} };
  const ov = el("div", { class: "cr", role: "dialog", "aria-modal": "true", "aria-label": "Welcome to " + COLLEGE },
    el("div", { class: "cr-card" },
      el("div", { class: "cr-art" }, el("i", { class: "cr-orb a" }), el("i", { class: "cr-orb b" }), el("i", { class: "cr-orb c" }), sky,
        el("div", { class: "cr-ring" }, el("div", { class: "cr-crest" }, (TENANT && TENANT.crest) ? crestEl(92) : /^[A-Z0-9]{2,6}( [A-Z0-9]{2,6})?$/.test(String(COLLEGE).trim()) ? el("span", { class: "cr-mono cr-acr" }, ...String(COLLEGE).trim().split(" ").map((w, i) => el("b", { class: i ? "sub" : "" }, w))) : el("span", { class: "cr-mono" }, (() => { const w = String(COLLEGE).replace(/\(.*?\)/g, " ").split(/[^A-Za-z0-9]+/).filter(x => x && !/^(of|and|the|for|in)$/i.test(x)); return (w.length === 1 ? w[0].slice(0, 5) : w.slice(0, 3).map(x => x[0]).join("")).toUpperCase(); })()))), el("span", { class: "cr-chip" }, "Welcome to")),
      el("div", { class: "cr-body" },
        el("h2", {}, COLLEGE), el("p", { class: "cr-full" }, full), place ? el("p", { class: "cr-place" }, "\u{1F4CD} " + place) : null,
        ...(() => { const f = collegeFacts(SEL, kindGroup(dir.kind || (IS_RGUKT ? "Engineering university" : ""))); return [el("div", { class: "cr-stats" }, ...f.chips.map(t => el("span", {}, t)), el("span", {}, "Private board for your college")), el("p", { class: "cr-src" + (f.verified ? " ok" : "") }, el("b", {}, f.verified ? "Verified source: " : "Standard setup: "), f.note)]; })(),
        el("p", { class: "cr-disc" }, "Independent student community. Not run or endorsed by the college."),
        el("button", { class: "btn primary cr-go", type: "button", onclick: close }, "Enter " + (COLLEGE.length > 22 ? "my college" : COLLEGE) + " \u2192"))));
  ov.style.setProperty("--c1", c1); ov.style.setProperty("--c2", c2);
  const open = () => document.body.append(ov);
  if (document.getElementById("splash")) document.addEventListener("splash-closed", () => setTimeout(open, 200), { once: true }); else open();
}
function maybeWelcome() {
  let resume = ""; try { resume = sessionStorage.getItem("dd-ob-resume") || ""; sessionStorage.removeItem("dd-ob-resume"); } catch (_) {}
  const open = (start) => { const go = () => setTimeout(() => showWelcome(false, start), 250); if (document.getElementById("splash")) document.addEventListener("splash-closed", go, { once: true }); else go(); };
  if (resume) { try { sessionStorage.setItem("dd-ob-shown", "1"); } catch (_) {} open(resume); return; }   // just picked a college: continue with the name step
  if (NO_COLLEGE) { try { sessionStorage.setItem("dd-ob-shown", "1"); } catch (_) {} open(); return; }      // brand-new visitors choose their college first
  // welcomeEveryVisit (config.js): show the welcome steps after the opening screen on every visit (handy for testing). Set it to false before launch.
  const every = !!(window.DOUBT_DESK_CONFIG && window.DOUBT_DESK_CONFIG.welcomeEveryVisit);
  if (every) {
    try { if (sessionStorage.getItem("dd-ob-shown")) return; sessionStorage.setItem("dd-ob-shown", "1"); } catch (_) {}
    open(); return;
  }
  try {
    if (localStorage.getItem("dd-welcome-done")) return;
    if (["dd-name", "dd-avatar", "dd-post-times", "dd-seen"].some(k => localStorage.getItem(k) !== null)) { localStorage.setItem("dd-welcome-done", "1"); return; }
  } catch (_) { return; }
  open();
}
// Doubts nobody has answered yet (not mine, last 14 days): the Today card nudges helpers to answer them, which keeps the board alive.
const unansweredDoubts = () => { const mine = store ? allMyIds() : new Set(), since = Date.now() - 14 * 864e5; return state.doubts.filter(d => !d.deleted && !isHidden(d) && (d.createdAt || 0) > since && !mine.has(d.authorId) && !d.resolvedReplyId && !repliesFor(d.id).length); };
function showUnanswered() {
  state.mode = state.selected ? "view" : "intro"; state.filter = "open"; state.tab = "doubts";
  const t = document.querySelector('[data-tab="doubts"]'); if (t) t.click(); state.filter = "open"; const f = $("filter"); if (f) f.value = "open"; render();
  try { $("list").scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
}
// Welcome note from the college: one short message under the greeting on the Today card, also cached for the splash screen.
async function loadWelcomeNote() {
  try {
    const d = store && store.getRoomDoc ? await store.getRoomDoc("welcomeMsg", "current") : null;
    state.welcomeNote = d && d.active && typeof d.text === "string" ? d : null;
    writeJSON("dd-welcome-note", state.welcomeNote ? { text: String(d.text).slice(0, 240), from: String(d.from || "").slice(0, 40), t: d.updatedAt } : null);
    if (typeof renderToday === "function") { todayKey = ""; renderToday(); }
  } catch (_) {}
}
// "Today" card under the header: a personal greeting with the things that bring students back (streak, daily quiz, exam countdown).
let todayKey = "";
// Small Loopy face for the Today card (same robot as the welcome screen).
// Loopy's costumes: unlocked by your best streak. Drawn on top of the robot face (same 60x60 picture).
const COSTUMES = [
  ["none", "Classic Loopy", 0, "The original, always cool."],
  ["cap", "Scholar cap", 3, "Reach a 3-day streak"],
  ["phones", "Focus headphones", 7, "Reach a 7-day streak"],
  ["shades", "Cool shades", 14, "Reach a 14-day streak"],
  ["mask", "Hero mask", 30, "Reach a 30-day streak"],
  ["crown", "Golden crown", 60, "Reach a 60-day streak"],
  ["legend", "Legend halo", 100, "Reach a 100-day streak"],
  ["goggles", "Lab goggles", 20, "Earn 20 curiosity points", "curio"],
  ["explorer", "Explorer monocle", 60, "Earn 60 curiosity points", "curio"],
  ["helper", "Helper star", 5, "Give 5 answers to classmates", "help"],
];
const myAnswers = () => { try { const me = store && state.loaded ? allStats().get(store.uid) : null; return me ? me.answers : 0; } catch (_) { return 0; } };
const costumeOk = (c) => c[4] === "curio" ? curioPoints() >= c[2] : c[4] === "help" ? myAnswers() >= c[2] : bestStreakEver() >= c[2];
const costumeWhy = (c) => c[4] === "curio" ? "Your curiosity points unlocked a new look." : c[4] === "help" ? "Your answers to classmates earned a new look." : "Your " + c[2] + "-day streak earned a new look.";
function bestStreakEver() {
  const v = Math.max(state.myBest || 0, state.myStreak || 0, Number(readJSON("dd-best", 0)) || 0);
  if (v > (Number(readJSON("dd-best", 0)) || 0)) writeJSON("dd-best", v);
  return v;
}
const costumeUnlocked = (id) => { const c = COSTUMES.find(x => x[0] === id); return !!c && costumeOk(c); };
const equippedCostume = () => { const id = readJSON("dd-costume", "none"); return costumeUnlocked(id) ? id : "none"; };
// Loopy comes alive: eyes follow your finger, a night mood, and a tap that opens the Loop Bot with a smart question.
function loopyPrompt() {
  const h = new Date().getHours(), plan = readJSON("dd-exam-plan", null), left = plan && plan.date ? Math.ceil((new Date(plan.date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
  const pool = h >= 22 || h < 5 ? [["Too late to study? Ask me for a 10 minute revision plan", "Make me a 10 minute revision plan"]]
    : [["Stuck on a topic? I can explain it simply", "Explain a tough topic to me simply"],
       ["Want a quick quiz on your subject?", "Quiz me with 3 questions"],
       ["Ask me for a study plan for this week", "Make me a study plan for this week"],
       ["Need career or placement help? Ask me", "Guide me on career and placements"]];
  if (left != null && left >= 0 && left <= 30) pool.unshift([left + " days to your exam. Want a plan?", "I have " + left + " days left for my exam. Make me a plan"]);
  const pick = pool[dayNum() % pool.length]; return { label: pick[0], q: pick[1] };
}
function loopyTap(e) {
  const b = e && e.currentTarget, svg = b && b.querySelector ? b.querySelector(".loopy-mini") : null;
  if (svg) { svg.classList.remove("lp-hop"); void svg.getBoundingClientRect(); svg.classList.add("lp-hop"); }
  try { confetti && confetti(); } catch (_) {}
  const q = loopyPrompt().q; if (window.sparkBotAsk) window.sparkBotAsk(q); else if (window.__lazy) { window.__lazy.now(); document.addEventListener("lazy-ready", () => { if (window.sparkBotAsk) window.sparkBotAsk(q); }, { once: true }); }
}
document.addEventListener("pointermove", (e) => {
  document.querySelectorAll(".hero-loopy .loopy-mini").forEach((s) => {
    const r = s.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
    s.style.setProperty("--ex", (dx / d * 1.6).toFixed(2) + "px"); s.style.setProperty("--ey", (dy / d * 1.2).toFixed(2) + "px");
  });
}, { passive: true });
// The Campus Loop brand mark: a C-shaped loop wearing a graduation cap (trusted static markup, parsed as SVG).
let _bmN = 0;
function brandMark(size = 64) {
  const doc = new DOMParser().parseFromString("<svg class=\"bmark\" viewBox=\"220 120 584 580\" width=\""+size+"\" height=\""+size+"\" role=\"img\" aria-label=\"The Campus Loop\"><defs><linearGradient id=\"bmRing"+(++_bmN)+"\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#22d3ee\"/><stop offset=\".35\" stop-color=\"#6366f1\"/><stop offset=\".7\" stop-color=\"#d946ef\"/><stop offset=\"1\" stop-color=\"#fb923c\"/></linearGradient><linearGradient id=\"bmGold"+(++_bmN)+"\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fde68a\"/><stop offset=\".5\" stop-color=\"#f59e0b\"/><stop offset=\"1\" stop-color=\"#fcd34d\"/></linearGradient></defs><circle cx=\"512\" cy=\"410\" r=\"238\" fill=\"none\" stroke=\"url(#bmRing"+(++_bmN)+")\" stroke-width=\"72\" stroke-linecap=\"round\" stroke-dasharray=\"1100 396\" transform=\"rotate(45 512 410)\"/><path d=\"M330 400 L512 322 L694 400 L512 478 Z\" fill=\"#ffffff\"/><path d=\"M404 448 v70 q108 58 216 0 v-70\" fill=\"none\" stroke=\"#e0e7ff\" stroke-width=\"22\" stroke-linejoin=\"round\"/><path d=\"M694 400 v96\" stroke=\"url(#bmGold"+(++_bmN)+")\" stroke-width=\"10\" stroke-linecap=\"round\"/><circle cx=\"694\" cy=\"508\" r=\"17\" fill=\"url(#bmGold"+(++_bmN)+")\"/></svg>", "image/svg+xml");
  const n = document.importNode(doc.documentElement, true); n.setAttribute("aria-hidden", "true"); n.removeAttribute("role"); n.removeAttribute("aria-label"); return n;
}
function loopyMini(costume) {
  const NS = "http://www.w3.org/2000/svg", mk = (t, at) => { const n = document.createElementNS(NS, t); for (const k in at) n.setAttribute(k, at[k]); return n; };
  const id = costume || equippedCostume();
  const svg = mk("svg", { viewBox: "0 0 60 60", width: "46", height: "46", class: "loopy-mini" + ((new Date().getHours() >= 23 || new Date().getHours() < 5) ? " lp-sleepy" : ""), "aria-hidden": "true" });
  const defs = mk("defs", {}), g1 = mk("linearGradient", { id: "lpmPh", x1: 0, y1: 0, x2: 1, y2: 1 }), g2 = mk("linearGradient", { id: "lpmCape", x1: 0, y1: 0, x2: 1, y2: 1 });
  [["0", "#f9a8d4"], ["0.5", "#ec4899"], ["1", "#a855f7"]].forEach(([o, c]) => g1.append(mk("stop", { offset: o, "stop-color": c }))); [["0", "#ec4899"], ["1", "#7e22ce"]].forEach(([o, c]) => g2.append(mk("stop", { offset: o, "stop-color": c }))); defs.append(g1, g2);
  svg.append(defs, mk("path", { d: "M15 44 L3 59 L57 59 L45 44 Z", fill: "url(#lpmCape)" }));
  svg.append(mk("line", { x1: 30, y1: 6, x2: 30, y2: 12, stroke: "#c4b5fd", "stroke-width": 3, "stroke-linecap": "round" }), mk("circle", { cx: 30, cy: 5, r: 3.5, fill: "#fde047" }),
    mk("rect", { x: 8, y: 12, width: 44, height: 38, rx: 15, fill: "#fff", stroke: "#a78bfa", "stroke-width": 2.5 }), mk("rect", { x: 13, y: 18, width: 34, height: 25, rx: 11, fill: "#1e1757" }),
    mk("ellipse", { cx: 23, cy: 28, rx: 3.4, ry: 4.6, fill: "#67e8f9", class: "lp-eyes" }), mk("ellipse", { cx: 37, cy: 28, rx: 3.4, ry: 4.6, fill: "#67e8f9", class: "lp-eyes" }), mk("path", { d: "M25 36q5 4.5 10 0", fill: "none", stroke: "#fde68a", "stroke-width": 2.4, "stroke-linecap": "round" }));
  svg.append(mk("path", { d: "M10 30 Q8 9 30 9 Q52 9 50 30", fill: "none", stroke: "url(#lpmPh)", "stroke-width": 3, "stroke-linecap": "round" }), mk("rect", { x: 3.5, y: 25, width: 7, height: 15, rx: 3.5, fill: "url(#lpmPh)" }), mk("rect", { x: 49.5, y: 25, width: 7, height: 15, rx: 3.5, fill: "url(#lpmPh)" }));
  if (id === "none") svg.append(mk("path", { d: "M6 15 L30 3 L54 15 L30 22 Z", fill: "#4c1d95", stroke: "#f9a8d4", "stroke-width": 1.2 }), mk("rect", { x: 19, y: 15.5, width: 22, height: 5, rx: 2.5, fill: "#6d28d9" }), mk("path", { d: "M54 15 L54 29", stroke: "#f9a8d4", "stroke-width": 1.5, "stroke-linecap": "round" }), mk("circle", { cx: 54, cy: 31, r: 2.2, fill: "#f9a8d4" }));
  if (id === "cap") svg.append(mk("path", { d: "M11 13 L30 3 L49 13 L30 21 Z", fill: "#1e1757", stroke: "#fde047", "stroke-width": 1 }), mk("rect", { x: 22, y: 14, width: 16, height: 5, rx: 2, fill: "#312e81" }), mk("path", { d: "M49 13 L49 22", stroke: "#fde047", "stroke-width": 1.6, "stroke-linecap": "round" }), mk("circle", { cx: 49, cy: 23, r: 2, fill: "#fde047" }));
  if (id === "phones") svg.append(mk("path", { d: "M9 32 A21 21 0 0 1 51 32", fill: "none", stroke: "#f472b6", "stroke-width": 3.6, "stroke-linecap": "round" }), mk("rect", { x: 3, y: 27, width: 8, height: 14, rx: 4, fill: "#f472b6" }), mk("rect", { x: 49, y: 27, width: 8, height: 14, rx: 4, fill: "#f472b6" }));
  if (id === "shades") svg.append(mk("rect", { x: 14, y: 22.5, width: 14, height: 10, rx: 4.5, fill: "#0b0b1c" }), mk("rect", { x: 32, y: 22.5, width: 14, height: 10, rx: 4.5, fill: "#0b0b1c" }), mk("path", { d: "M28 26 h4", stroke: "#0b0b1c", "stroke-width": 2 }), mk("path", { d: "M16.5 25 l5 0", stroke: "#fff", "stroke-width": 1.2, opacity: ".6", "stroke-linecap": "round" }));
  if (id === "mask") svg.append(mk("path", { d: "M10 24 h40 v9 q-20 6 -40 0 z", fill: "#ef4444" }), mk("ellipse", { cx: 23, cy: 28.5, rx: 4.6, ry: 4.4, fill: "#fff" }), mk("ellipse", { cx: 37, cy: 28.5, rx: 4.6, ry: 4.4, fill: "#fff" }), mk("ellipse", { cx: 23, cy: 28.5, rx: 2.6, ry: 3.4, fill: "#67e8f9", class: "lp-eyes" }), mk("ellipse", { cx: 37, cy: 28.5, rx: 2.6, ry: 3.4, fill: "#67e8f9", class: "lp-eyes" }));
  if (id === "crown") svg.append(mk("path", { d: "M14 14 L17 3 L24 9 L30 1.5 L36 9 L43 3 L46 14 Z", fill: "#fbbf24", stroke: "#b45309", "stroke-width": 1 }), mk("circle", { cx: 17, cy: 3.5, r: 1.8, fill: "#f43f5e" }), mk("circle", { cx: 30, cy: 2, r: 1.8, fill: "#38bdf8" }), mk("circle", { cx: 43, cy: 3.5, r: 1.8, fill: "#f43f5e" }));
  if (id === "legend") svg.append(mk("ellipse", { cx: 30, cy: 4, rx: 15, ry: 3.6, fill: "none", stroke: "#fde047", "stroke-width": 2.4 }), mk("path", { d: "M5 20 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.8 -3.2 1.8 .6 -3.6 -2.6 -2.5 3.6 -.5z", fill: "#fde047", transform: "scale(.7) translate(-2 4)" }), mk("path", { d: "M48 30 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.8 -3.2 1.8 .6 -3.6 -2.6 -2.5 3.6 -.5z", fill: "#fde047", transform: "scale(.7) translate(20 14)" }));
  if (id === "goggles") svg.append(mk("path", { d: "M8 28 h6 M46 28 h6", stroke: "#22d3ee", "stroke-width": 3, "stroke-linecap": "round" }), mk("circle", { cx: 23, cy: 28, r: 7.6, fill: "rgba(103,232,249,.25)", stroke: "#22d3ee", "stroke-width": 2.6 }), mk("circle", { cx: 37, cy: 28, r: 7.6, fill: "rgba(103,232,249,.25)", stroke: "#22d3ee", "stroke-width": 2.6 }), mk("path", { d: "M30.6 28 h-1.2", stroke: "#22d3ee", "stroke-width": 2.6 }));
  if (id === "explorer") svg.append(mk("circle", { cx: 37, cy: 28, r: 8.2, fill: "rgba(251,191,36,.14)", stroke: "#f59e0b", "stroke-width": 2.4 }), mk("path", { d: "M43 34 L51 47", stroke: "#f59e0b", "stroke-width": 2.6, "stroke-linecap": "round" }), mk("path", { d: "M33 24 q3 -3 7 -1", fill: "none", stroke: "#fff", "stroke-width": 1.4, "stroke-linecap": "round", opacity: ".8" }));
  if (id === "helper") svg.append(mk("path", { d: "M30 46 l2.5 5 5.5 .8 -4 3.9 .9 5.5 -4.9 -2.6 -4.9 2.6 .9 -5.5 -4 -3.9 5.5 -.8z", fill: "#fbbf24", stroke: "#b45309", "stroke-width": 0.9, "stroke-linejoin": "round" }));
  return svg;
}
// Wardrobe screen and unlock celebration.
function renderWardrobe() {
  const best = bestStreakEver(), eq = equippedCostume(), back = el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back");
  return [el("h2", {}, "👗 Loopy\u2019s wardrobe"), el("p", { class: "hint" }, "Your best streak is " + best + " day" + (best === 1 ? "" : "s") + ", you have " + curioPoints() + " curiosity points and " + myAnswers() + " answers. Streaks, curiosity and helping others unlock new costumes for Loopy."),
    el("div", { class: "plus-tiles" }, ...COSTUMES.map((cc) => { const [id, name, need, how] = cc, ok = costumeOk(cc), on = eq === id;
      const tile = el("button", { class: "plus-tile costume" + (on ? " on" : "") + (ok ? "" : " locked"), type: "button", "aria-label": name + (ok ? (on ? ", worn" : ", unlocked") : ", locked: " + how), onclick: () => { if (!ok) return; writeJSON("dd-costume", id); todayKey = ""; try { renderHeader(); } catch (_) {} render(); } },
        el("span", { class: "cos-prev" }, loopyMini(id)), el("strong", {}, name), el("small", {}, ok ? (on ? "✔ Wearing" : "Tap to wear") : "🔒 " + how));
      const sv = tile.querySelector("svg"); if (sv) { sv.setAttribute("width", "64"); sv.setAttribute("height", "64"); } return tile; })),
    el("div", { class: "rowbtns" }, back)];
}
let costumeChecked = false;
function checkNewCostume() {
  if (costumeChecked || !state.dataReady) return; costumeChecked = true;
  const best = bestStreakEver(), seen = readJSON("dd-costumes-seen", ["none"]), fresh = COSTUMES.filter(c => costumeOk(c) && !seen.includes(c[0]));
  if (!fresh.length) return; writeJSON("dd-costumes-seen", [...seen, ...fresh.map(c => c[0])]);
  const c = fresh[fresh.length - 1]; writeJSON("dd-costume", c[0]);
  const box = el("div", { id: "costumeModal", class: "welcome", role: "dialog", "aria-modal": "true" }, el("div", { class: "welcome-card" }, el("div", { class: "ob-loopy" }, (() => { const s = loopyMini(c[0]); s.setAttribute("width", "110"); s.setAttribute("height", "110"); return s; })()),
    el("h2", {}, "Loopy unlocked the " + c[1] + "! 🎉"), el("p", {}, costumeWhy(c) + " Loopy is wearing it now."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: () => { box.remove(); todayKey = ""; try { renderHeader(); } catch (_) {} } }, "Love it!"), el("button", { class: "btn", type: "button", onclick: () => { box.remove(); showPanel("wardrobe"); } }, "👗 Wardrobe"))));
  setTimeout(() => { if (!document.getElementById("welcome") && !document.getElementById("milestone")) { document.body.append(box); confetti(110); } }, 1500);
}
// Loopy's daily tip: one helpful, personal suggestion a day (chosen from your streak, quiz, exam date, mistakes, weak topic, rank or the board), else a study tip.
const STUDY_TIPS = [
  "Try the 25-5 rule: 25 minutes of focus, then a 5-minute break. Your brain keeps more that way.",
  "After reading a topic, close the book and explain it in your own words. That is the fastest way to learn.",
  "Sleep is part of studying. 7 hours tonight will help you more than 1 extra hour of reading.",
  "Start with the hardest subject while your mind is fresh, and keep the easy one for later.",
  "Write your doubts down as soon as they come. Asking a clear question already solves half of it.",
  "Revise a topic after 1 day, 3 days and 7 days. That spacing makes it stay.",
  "Explaining a concept to a junior is the best revision. Try answering one doubt today.",
  "Put your phone in another room for one study round. You will finish faster.",
  "Solve one previous-year question before you read the notes. It shows you what really matters.",
  "Drink water and stretch for a minute between rounds. A fresh body helps a fresh mind.",
  "Be kind in your replies. A good answer given with respect makes a junior's whole day.",
  "Small and daily beats big and rare. Ten minutes every day beats three hours once a week.",
];
function loopyTip() {
  const today = dayStr(), stored = readJSON("dd-tip", null);
  const streak = state.myStreak || 0, doneToday = state.myDays && state.myDays.has(dayNum()), quizDone = QUIZ.length ? !!myQuizAnswer(dayNum()) : true;
  const plan = readJSON("dd-exam-plan", null), left = plan && plan.date ? Math.ceil((new Date(plan.date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
  const mist = mistakeList().length, un = unansweredDoubts().length, uid = store && store.authUid ? store.authUid() : "";
  const rows = state.weekly.slice().sort((x, y) => y.points - x.points), me = rows.findIndex(r => r.uid === uid);
  const topics = {}; for (const r of mockHistory().slice(-5)) for (const [k, v] of Object.entries(r.bySub || {})) { const t = topics[k] || (topics[k] = { r: 0, n: 0 }); t.r += v.r; t.n += v.n; }
  const weak = Object.entries(topics).filter(([, v]) => v.n >= 3 && v.r / v.n < 0.7).sort((x, y) => x[1].r / x[1].n - y[1].r / y[1].n)[0];
  const C = [
    ["streak", streak >= 2 && !doneToday, () => ({ text: "Your " + streak + "-day streak is at risk today! Answer one doubt or take the daily quiz to keep it alive. 🔥", cta: ["Daily quiz", () => showPanel("quiz")] })],
    ["exam", left != null && left >= 0 && left <= 10, () => ({ text: (left === 0 ? "Your exam is today. Breathe, you have prepared. All the best! 🙏" : "Your exam is in " + left + " day" + (left === 1 ? "" : "s") + ". Open your plan and do today's revision.") + "", cta: ["My plan", () => showPanel("planner")] })],
    ["quiz", !quizDone && QUIZ.length > 0, () => ({ text: "Today's quiz is waiting. One question, one minute, and it counts for your college in the weekly battle. 🧠", cta: ["Take it", () => showPanel("quiz")] })],
    ["mistakes", mist >= 3, () => ({ text: "You have " + mist + " saved mistakes. Clear 3 of them today and they will never trouble you again. 📓", cta: ["Practise", () => { state.mist = null; showPanel("mistakes"); }] })],
    ["weak", !!weak, () => ({ text: weak[0] + " is your weakest topic (" + Math.round(weak[1].r * 100 / weak[1].n) + "%). A short mock test will lift it. 🎯", cta: ["Mock test", () => { state.mock = null; showPanel("mock"); }] })],
    ["rank", me > 0 && rows[me - 1].points - rows[me].points < 40, () => ({ text: "You are #" + (me + 1) + " on the weekly board, only " + (rows[me - 1].points - rows[me].points + 1) + " points behind " + rows[me - 1].name + ". One focus round could pass them! 🏅", cta: ["Focus timer", () => { state.ft = null; showPanel("focusplus"); }] })],
    ["place", readJSON("dd-interests", []).includes("placements") && !readJSON("dd-resume", null), () => ({ text: "Placement season is a marathon. Build your one-page resume today, it takes about 10 minutes. \u{1F4C4}", cta: ["Resume builder", () => showPanel("resume")] })],
    ["help", un > 0, () => ({ text: un + " classmate" + (un === 1 ? "" : "s") + " asked a doubt nobody has answered yet. Your answer could be the one they remember. 🙋", cta: ["Help now", showUnanswered] })],
  ];
  let pick = stored && stored.day === today ? C.find(c => c[0] === stored.id) : null;
  if (!pick || !pick[1]) pick = C.find(c => c[1]) || null;
  if (pick) { if (state.dataReady && (!stored || stored.day !== today || stored.id !== pick[0])) writeJSON("dd-tip", { day: today, id: pick[0], gone: stored && stored.day === today ? stored.gone : false }); return { ...pick[2](), id: pick[0] }; }
  const i = dayNum() % STUDY_TIPS.length; if (state.dataReady && (!stored || stored.day !== today || stored.id !== "study")) writeJSON("dd-tip", { day: today, id: "study", gone: stored && stored.day === today ? stored.gone : false });
  return { id: "study", text: STUDY_TIPS[i], cta: null };
}
// Curiosity hooks on the Today card: a first-steps quest for new students, today's quiz question as a teaser, and the latest helpful reply.
function questSteps() {
  const mine = store ? allMyIds() : new Set(), name = !!(getName() || "").trim();
  const posted = state.doubts.some(d => mine.has(d.authorId)) || state.replies.some(r => mine.has(r.authorId)) || readJSON("dd-quest-post", false);
  const quiz = (QUIZ.length ? !!myQuizAnswer(dayNum()) : true) || readJSON("dd-quest-quiz", false);
  if (posted) writeJSON("dd-quest-post", true); if (quiz) writeJSON("dd-quest-quiz", true);
  return [["✏️", "Set your name", name, () => { const b = $("nameBtn"); if (b) b.click(); }], ["💬", "Ask or answer one doubt", posted, () => { const b = $("askBtn"); if (b) b.click(); }], ["🧠", "Take today's quiz", quiz, () => showPanel("quiz")]];
}
function questCard() {
  if (readJSON("dd-quest-done", false) || (readJSON("dd-visits", { n: 1 }).n || 1) > 21) return null;
  const steps = questSteps(), n = steps.filter(s => s[2]).length;
  if (n === 3) { if (state.dataReady) { writeJSON("dd-quest-done", true); const until = Math.max(Number(readJSON("dd-bonus-until", 0)) || 0, Date.now()) + 864e5; writeJSON("dd-bonus-until", until); }
    if (!readJSON("dd-quest-cele", false)) { writeJSON("dd-quest-cele", true); setTimeout(() => confetti(140), 200); }
    return el("div", { class: "wow", role: "status" }, el("span", { class: "wow-conf", "aria-hidden": "true" }, "🎉 🎊"), el("strong", {}, "Wow, you finished your first steps!"), el("span", {}, "Welcome to the family. 🎁 1 free day of Plus studio is yours.")); }
  return el("div", { class: "quest" }, el("div", { class: "quest-head" }, el("strong", {}, "Your first 3 steps"), el("small", {}, n + "/3")),
    el("div", { class: "mock-bar" }, (() => { const s = el("span", {}); s.style.setProperty("width", Math.round(n * 100 / 3) + "%"); return s; })()),
    ...steps.map(([ic, t, ok, fn]) => el("button", { class: "quest-step" + (ok ? " done" : ""), type: "button", disabled: ok ? "" : null, onclick: fn }, el("span", {}, ok ? "✔" : ic), el("b", {}, t), ok ? null : el("i", {}, "Start →"))),
    el("small", { class: "hint" }, "Finish all three for a free day of Plus studio. 🎁"));
}
function quizTeaser() {
  if (!QUIZ.length || myQuizAnswer(dayNum())) return null;
  const q = quizFor(dayNum()); if (!q) return null;
  return el("button", { class: "teaser", type: "button", onclick: () => showPanel("quiz") }, el("small", {}, "🧠 Today's question · " + (q.s || "Quiz")), el("b", {}, q.q.length > 110 ? q.q.slice(0, 107) + "…" : q.q), el("span", {}, "Can you answer it? Tap to try →"));
}
function latestHelp() {
  const r = state.replies.filter(x => !x.deleted && x.authorName && (x.createdAt || 0) > Date.now() - 864e5 && x.parentColl === "doubts").sort((x, y) => y.createdAt - x.createdAt)[0]; if (!r) return null;
  const d = state.doubts.find(x => x.id === r.parentId); if (!d) return null;
  return el("button", { class: "ticker", type: "button", onclick: () => openPost("doubts", d.id) }, el("span", { class: "ticker-dot", "aria-hidden": "true" }), el("span", {}, el("b", {}, String(r.authorName).slice(0, 24)), " just answered a doubt" + (d.subject ? " in " + d.subject : "") + " · " + noticeAgo(r.createdAt)));
}
// Confetti burst for happy moments (finished quest, milestone, great score, rare reward). Pure canvas, removes itself.
function confetti(n) {
  try {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = document.createElement("canvas"); cv.className = "confetti"; cv.width = innerWidth; cv.height = innerHeight; document.body.append(cv);
    const g = cv.getContext("2d"), cols = ["#8b7cff", "#d946ef", "#f97316", "#fde047", "#22c55e", "#38bdf8"], N = n || 90, ps = Array.from({ length: N }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 13 - 4, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    (function tick(t) {
      const k = t - t0; g.clearRect(0, 0, cv.width, cv.height);
      for (const p of ps) { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.max(0, 1 - k / 2200); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6); g.restore(); }
      if (k < 2200) requestAnimationFrame(tick); else cv.remove();
    })(t0);
  } catch (_) {}
}
// Mystery daily box: open it once a day for a fun fact, a collectible Loopy sticker, or (rarely) a bonus day of Plus studio.
const STICKERS = [["", "Rocket Loopy"], ["📚", "Bookworm Loopy"], ["🧠", "Genius Loopy"], ["🎧", "Focus Loopy"], ["🏆", "Champion Loopy"], ["🌟", "Star Loopy"], ["☕", "Chai Loopy"], ["🎓", "Graduate Loopy"], ["👑", "Golden Loopy"]];
const BOX_FACTS = [
  "The first computer bug was a real moth found stuck in a computer in 1947.", "Honey never spoils. Jars found in old Egyptian tombs were still good to eat.", "Your brain uses about 20% of your body's energy, though it is only 2% of your weight.",
  "Binary has only 0 and 1, yet every video, song and photo on your phone is made from it.", "Zero was invented in India. Aryabhata and Brahmagupta helped the world use it.", "A day on Venus is longer than a year on Venus.",
  "Writing by hand helps you remember more than typing. Try it for your key formulas.", "The Python language is named after the comedy group Monty Python, not the snake.", "Octopuses have three hearts and blue blood.",
  "The 'Wi-Fi' name does not stand for anything. It was chosen because it sounded catchy.", "Light from the Sun takes about 8 minutes to reach Earth.", "Short breaks help you learn: after 25 minutes of focus, your brain needs a reset.",
  "Sleeping after studying helps your brain lock in what you learned.", "The first website ever made is still online, from 1991.", "India's Chandrayaan-3 landed near the Moon's south pole in 2023, a first for any country.",
  "A 'byte' is 8 bits, and one letter like A takes exactly one byte.", "Bananas are slightly radioactive because of potassium, but completely safe.", "Teaching someone else a topic is the best way to learn it yourself.",
  "The word 'robot' comes from a Czech word meaning 'forced labour', first used in a 1920 play.", "Lightning is about five times hotter than the surface of the Sun.",
];
const boxToday = () => { const b = readJSON("dd-box", null); return b && b.day === dayStr() ? b : null; };
function openBox() {
  if (boxToday()) return boxToday();
  const owned = readJSON("dd-stickers", []), roll = Math.random(); let r;
  const missing = STICKERS.map((s, i) => i).filter(i => !owned.includes(i) && i !== 8);
  if (roll < 0.02 && !owned.includes(8)) r = { kind: "sticker", id: 8 };
  else if (roll < 0.10) { const until = Math.max(Number(readJSON("dd-bonus-until", 0)) || 0, Date.now()) + 864e5; writeJSON("dd-bonus-until", until); r = { kind: "bonus" }; }
  else if (roll < 0.45 && missing.length) r = { kind: "sticker", id: missing[Math.floor(Math.random() * missing.length)] };
  else r = { kind: "fact", id: Math.floor(Math.random() * BOX_FACTS.length) };
  if (r.kind === "sticker" && !owned.includes(r.id)) writeJSON("dd-stickers", [...owned, r.id]);
  const rec = { day: dayStr(), ...r }; writeJSON("dd-box", rec); return rec;
}
function showBox() {
  if (document.getElementById("boxModal")) return;
  const fresh = !boxToday(), rec = openBox(), box = el("div", { id: "boxModal", class: "welcome", role: "dialog", "aria-modal": "true", "aria-label": "Mystery box" });
  const close = () => { box.remove(); todayKey = ""; renderToday(); };
  const body = rec.kind === "sticker" ? [el("div", { class: "welcome-icon", "aria-hidden": "true" }, STICKERS[rec.id][0]), el("h2", {}, "New sticker: " + STICKERS[rec.id][1] + "!"), el("p", {}, rec.id === 8 ? "A rare golden sticker! Very few students find this one." : "You now have " + readJSON("dd-stickers", []).length + " of " + STICKERS.length + " stickers. Come back tomorrow for more.")]
    : rec.kind === "bonus" ? [el("div", { class: "welcome-icon", "aria-hidden": "true" }, "🎁"), el("h2", {}, "Lucky day! A bonus gift"), el("p", {}, "You won 1 free day of Plus studio. Use the mock tests, planner and more today.")]
    : [el("div", { class: "welcome-icon", "aria-hidden": "true" }, "💡"), el("h2", {}, "Did you know?"), el("p", {}, BOX_FACTS[rec.id])];
  box.append(el("div", { class: "welcome-card" }, ...body, el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: close }, fresh ? "Wow, nice!" : "Close"), el("button", { class: "btn", type: "button", onclick: () => { close(); showPanel("stickers"); } }, "🎴 Sticker book"))));
  document.body.append(box); if (rec.kind !== "fact" && fresh) confetti(rec.id === 8 ? 160 : 90);
}
function renderStickers() {
  const owned = readJSON("dd-stickers", []), back = el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back");
  return [el("h2", {}, "🎴 Loopy sticker book"), el("p", { class: "hint" }, owned.length + " of " + STICKERS.length + " collected. Open the mystery box on the home screen once a day to find more."),
    el("div", { class: "plus-tiles" }, ...STICKERS.map(([ic, name], i) => el("div", { class: "plus-tile badge" + (owned.includes(i) ? " on" : ""), "aria-label": name + (owned.includes(i) ? " collected" : " not found yet") }, el("span", { class: "pt-i", "aria-hidden": "true" }, owned.includes(i) ? ic : "❔"), el("strong", {}, owned.includes(i) ? name : "???")))),
    owned.length === STICKERS.length ? el("div", { class: "wow", role: "status" }, el("strong", {}, "Wow, the full collection! 🏆")) : null, el("div", { class: "rowbtns" }, back)];
}
function boxButton() {
  const done = boxToday();
  return el("button", { class: "boxbtn" + (done ? "" : " fresh"), type: "button", onclick: showBox }, el("span", { class: "boxbtn-ico", "aria-hidden": "true" }, done ? "📭" : "🎁"), el("span", {}, el("b", {}, done ? "Today's box opened" : "Mystery box"), el("small", {}, done ? "Come back tomorrow · tap to see it again" : "Tap to open today's surprise")));
}
// Launch banner: a premium welcome-aboard banner on top of the home screen right after the welcome steps, until the first 3 steps are done or it is closed.
function launchBanner(name) {
  if (!readJSON("dd-launch", false) || readJSON("dd-launch-gone", false)) return null;
  const steps = questSteps(), n = steps.filter(s => s[2]).length;
  if (n === 3) return null;
  const who = (name || "").trim();
  return el("div", { class: "launch" }, el("div", { class: "launch-in" },
    el("div", { class: "launch-loopy" }, loopyMini()),
    el("div", { class: "launch-text" }, el("small", {}, "NEW MEMBER · " + COLLEGE), el("strong", {}, "Welcome aboard" + (who ? ", " + who : "") + "! 🎉"), el("span", {}, "You are now part of the " + BRAND + " family. Finish your first 3 steps and unlock a free gift 🎁")),
    el("div", { class: "launch-go" }, el("b", {}, n + "/3"), el("button", { class: "launch-btn", type: "button", onclick: () => { const q = document.querySelector(".quest"); if (q) q.scrollIntoView({ behavior: "smooth", block: "center" }); } }, "Start →")),
    el("button", { class: "launch-x", type: "button", "aria-label": "Close banner", onclick: () => { writeJSON("dd-launch-gone", true); todayKey = ""; renderToday(); } }, "✕")));
}
function renderToday() {
  try { checkNewCostume(); } catch (_) {}
  const bar = $("todayBar"); if (!bar) return;
  if (NO_COLLEGE || !store) { bar.hidden = true; return; }
  const hr = new Date().getHours(), hello = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening", name = (getName() || "").trim().split(/\s+/)[0] || "",
    streak = state.myStreak || 0, quizDone = QUIZ.length ? !!myQuizAnswer(dayNum()) : true, plan = readJSON("dd-exam-plan", null),
    left = plan && plan.date ? Math.ceil((new Date(plan.date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
  const note = state.welcomeNote && readJSON("dd-note-gone", 0) !== state.welcomeNote.updatedAt ? state.welcomeNote : null;
  const key = [hello, name, streak, quizDone, left, equippedCostume(), storyGroups().length, readJSON("dd-launch", false) ? 1 : 0, readJSON("dd-launch-gone", false) ? 1 : 0, state.dataReady ? 1 : 0, boxToday() ? 1 : 0, questSteps().filter(s => s[2]).length, state.replies.length, state.doubts.length, readJSON("dd-tip", {}).gone ? 1 : 0, mistakeList().length, state.weekly.length, dayNum(), (typeof weekPoints === "function" ? weekPoints() : 0), note ? note.updatedAt : 0, openDrives().length, upcomingEvents().length, unansweredDoubts().length, readJSON("dd-today-closed", "") === dayStr() ? 1 : 0, (doubtOfDay() || {}).id || "", fbDone() ? 1 : 0, curioPoints(), (helperOfWeek() || {}).id || ""].join("|"); if (key === todayKey && !bar.hidden) return; todayKey = key;
  if (readJSON("dd-today-closed", "") === dayStr()) { bar.hidden = false; bar.replaceChildren(el("button", { class: "today-reopen", type: "button", onclick: () => { writeJSON("dd-today-closed", ""); todayKey = ""; renderToday(); } }, "Show today\u2019s card")); return; }
  const chip = (txt, cls, fn) => el("button", { class: "today-chip " + (cls || ""), type: "button", onclick: fn }, txt);
  const WORDS = ["Welcome to " + BRAND + " family", "Respect your teachers, help your juniors. 🙏", "Every question is welcome here.", "Kind words build a strong campus. 🌱", "Thank you for being part of our family.", "Learn together, grow together.", "Our teachers and staff work hard for you. Say thank you today. 🙏"];
  const newbie = !readJSON("dd-quest-done", false) && (readJSON("dd-visits", { n: 1 }).n || 1) <= 21 && questSteps().filter(s => s[2]).length < 3;
  const stat = (num, label, cls, fn) => el("button", { class: "today-stat " + (cls || ""), type: "button", onclick: fn }, el("b", {}, String(num)), el("span", {}, label));
  const pts = typeof weekPoints === "function" ? weekPoints() : 0;
  const lb = launchBanner(name);
  bar.replaceChildren(lb, lb ? null : el("div", { class: "today-hero" }, el("button", { class: "today-close", type: "button", "aria-label": "Close this card", title: "Close for today", onclick: () => { writeJSON("dd-today-closed", dayStr()); todayKey = ""; renderToday(); } }, "\u2715"), NO_COLLEGE ? null : el("div", { class: "hero-crest" }, crestEl(54)), el("button", { class: "hero-loopy", type: "button", "aria-label": "Chat with Loopy", onclick: loopyTap }, loopyMini()),
    el("div", { class: "hero-text" }, el("small", { class: "hero-kicker" }, " " + COLLEGE), el("strong", { class: "today-hello" }, hello + (name ? ", " + name : "") + " 👋"), el("small", { class: "today-words" }, WORDS[dayNum() % WORDS.length])),
    el("button", { class: "hero-say", type: "button", onclick: loopyTap }, el("span", { class: "hero-say-dot" }), el("span", {}, loopyPrompt().label), el("b", {}, "Ask Loopy \u203A")),
    el("button", { class: "hero-ask", type: "button", onclick: () => { const b = $("askBtn"); if (b) b.click(); } }, "❓ Ask a doubt")),
    (() => { if (newbie) return null; const t = loopyTip(), st = readJSON("dd-tip", {}); if (st.gone && st.day === dayStr()) return null;
      return el("div", { class: "today-tip" }, el("small", {}, "💡 Loopy\u2019s tip for today"), el("p", {}, t.text), el("div", { class: "rowbtns" }, t.cta ? el("button", { class: "btn sm primary", type: "button", onclick: t.cta[1] }, t.cta[0]) : null, el("button", { class: "btn sm", type: "button", onclick: () => { writeJSON("dd-tip", { ...readJSON("dd-tip", {}), day: dayStr(), gone: true }); todayKey = ""; renderToday(); } }, "Got it"))); })(),
    note ? el("div", { class: "today-note" }, el("strong", {}, "💬 " + (note.from ? "A note from " + note.from : "A note from your college")), el("p", {}, note.text), el("button", { class: "of-x", type: "button", "aria-label": "Dismiss note", onclick: () => { writeJSON("dd-note-gone", note.updatedAt); todayKey = ""; renderToday(); } }, "✕")) : null, null, 
    questCard(), boxButton(), quizTeaser(), dodCard(), helperCard(), latestHelp(),
    newbie ? null : el("div", { class: "today-stats" },
      stat(streak, streak === 1 ? "day streak 🔥" : "day streak 🔥", streak && !(state.myDays && state.myDays.has(dayNum())) ? "warn" : "", () => showPanel("me")),
      stat(pts, "points this week ⚡", "", () => showPanel("wboard")),
      QUIZ.length ? stat(quizDone ? "✓" : "Go", quizDone ? "quiz done 🧠" : "today's quiz 🧠", quizDone ? "" : "pulse", () => showPanel("quiz")) : null),
    el("div", { class: "today-chips" },
      IS_RGUKT ? chip("\u{1F4D8} Semester subjects", "", () => { state.mode = "curriculum"; render(); try { $("sheet").scrollIntoView({ behavior: "smooth" }); } catch (_) {} }) : null,
      left != null && left >= 0 && left <= 120 ? chip("⏳ " + (left === 0 ? "Exam today" : left + " days to exam"), left <= 7 ? "warn" : "", () => showPanel("planner")) : null,
      upcomingEvents().filter(e => e.startAt < Date.now() + 7 * 864e5).length ? chip("🎉 " + upcomingEvents().filter(e => e.startAt < Date.now() + 7 * 864e5).length + " event" + (upcomingEvents().filter(e => e.startAt < Date.now() + 7 * 864e5).length === 1 ? "" : "s") + " this week", "", () => showPanel("events")) : null,
      unansweredDoubts().length ? chip("🙋 " + unansweredDoubts().length + " doubt" + (unansweredDoubts().length === 1 ? "" : "s") + " need an answer", "pulse", showUnanswered) : null,
      openDrives().length ? chip("🏢 " + openDrives().length + " campus drive" + (openDrives().length === 1 ? "" : "s"), "", () => showPanel("drives")) : null,
      storyGroups().length < STORY_ROW_MIN ? chip("📸 Add a story", "", () => openStoryAdd()) : null,
      chip("\u{1F50E} Curiosity" + (curioStreak() ? " \u{1F525}" + curioStreak() : ""), Object.keys(curioStore().why).includes(String(dayNum())) ? "" : "pulse", () => showPanel("curious")),
      (readJSON("dd-visits", { n: 1 }).n || 1) >= 3 && !fbDone() ? chip("\u{1F4AC} Give feedback", "", () => showPanel("feedback")) : null,
      left == null && (readJSON("dd-visits", { n: 1 }).n || 1) >= 2 ? chip("\u23F3 Set your exam date", "", () => showPanel("planner")) : null,
      chip("🧰 Explore", "", () => showPanel("explore")))); 
  bar.hidden = false;
}
// Placement drives: posted by the placement cell (admin or staff). Students check eligibility and register interest; the cell sees the list.
const openDrives = () => state.drives.filter(d => d.lastDate > Date.now()).sort((a, b) => a.lastDate - b.lastDate);
const drivesMine = {};
function renderDrives() {
  const back = el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back"), list = openDrives(), uid = store && store.authUid ? store.authUid() : "";
  const note = el("p", { class: "hint", role: "status" }, "");
  const days = (t) => { const d = Math.ceil((t - Date.now()) / 864e5); return d <= 0 ? "closes today" : d + " day" + (d === 1 ? "" : "s") + " left"; };
  const card = (d) => {
    const mine = drivesMine[d.id]; if (mine === undefined && uid && store.getRoomDoc) { drivesMine[d.id] = null; store.getRoomDoc("driveInterest", d.id + "_" + uid).then(x => { drivesMine[d.id] = x || false; if (state.mode === "drives") render(); }).catch(() => { drivesMine[d.id] = false; }); }
    const body = el("div", { class: "learn-card plus-list" }, el("strong", {}, "🏢 " + d.company + " · " + d.role), el("p", { class: "hint" }, [d.package ? "💰 " + d.package : "", d.branches && d.branches.length ? "🎓 " + d.branches.join(", ") : "All branches", d.minCgpa ? "📊 Min CGPA " + d.minCgpa : "", "⏳ " + days(d.lastDate)].filter(Boolean).join(" · ")),
      d.driveDate ? el("p", { class: "hint" }, "📅 Drive on " + new Date(d.driveDate).toLocaleDateString()) : null, d.details ? el("p", {}, d.details) : null);
    const actions = el("div", { class: "rowbtns" });
    if (/^https:\/\//.test(d.link || "")) actions.append(el("button", { class: "btn sm", type: "button", onclick: () => { try { window.open(d.link, "_blank", "noopener"); } catch (_) {} } }, "Company link"));
    if (mine) actions.append(el("span", { class: "hint" }, "✔ You are registered"), el("button", { class: "btn sm", type: "button", onclick: async () => { try { await store.delRoomDoc("driveInterest", d.id + "_" + uid); drivesMine[d.id] = false; render(); } catch (_) { note.textContent = "Could not withdraw. Try again."; } } }, "Withdraw"));
    else actions.append(el("button", { class: "btn sm primary", type: "button", onclick: () => { state.driveForm = d.id; render(); } }, "I am interested"));
    body.append(actions);
    if (state.driveForm === d.id && !mine) {
      const name = el("input", { maxlength: "50", value: getName(), placeholder: "Your name", "aria-label": "Your name" }), branch = el("input", { maxlength: "24", placeholder: "Branch, e.g. CSE", "aria-label": "Branch" }), cgpa = el("input", { type: "number", step: "0.01", min: "0", max: "10", placeholder: "CGPA", "aria-label": "CGPA" }), phone = el("input", { type: "tel", maxlength: "15", placeholder: "Phone (optional)", "aria-label": "Phone" });
      body.append(el("div", { class: "form" }, name, el("div", { class: "two" }, branch, cgpa), phone, el("p", { class: "hint" }, "🔒 These details are shared only with the placement cell of " + COLLEGE + ". You can withdraw any time."),
        el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: async (e) => {
          const g = parseFloat(cgpa.value); if (!name.value.trim()) { note.textContent = "Write your name."; return; }
          if (d.minCgpa && !(g >= d.minCgpa)) { note.textContent = "This drive needs a CGPA of at least " + d.minCgpa + "."; return; }
          if (d.branches && d.branches.length && branch.value.trim() && !d.branches.some(b => b.toLowerCase() === branch.value.trim().toLowerCase())) { note.textContent = "This drive is for " + d.branches.join(", ") + "."; return; }
          e.currentTarget.disabled = true;
          try { const rec = { driveId: d.id, uid, name: name.value.trim().slice(0, 50), createdAt: Date.now() }; if (branch.value.trim()) rec.branch = branch.value.trim().slice(0, 24); if (g >= 0 && g <= 10) rec.cgpa = g; if (phone.value.trim()) rec.phone = phone.value.trim().slice(0, 15); await store.set("driveInterest", d.id + "_" + uid, rec); drivesMine[d.id] = rec; state.driveForm = null; render(); }
          catch (err) { note.textContent = "Could not save. Check your internet and try again."; e.currentTarget.disabled = false; }
        } }, "Register"), el("button", { class: "btn sm", type: "button", onclick: () => { state.driveForm = null; render(); } }, "Cancel"))));
    }
    return body;
  };
  return [el("h2", {}, "🏢 Campus drives"), el("p", { class: "hint" }, "Posted by the placement cell of " + COLLEGE + ". Check the eligibility, then tap I am interested."),
    ...(list.length ? list.map(card) : [el("p", { class: "hint" }, "No open drives right now. The placement cell posts new ones here. Keep your resume ready!")]), note,
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => showPanel("resume") }, "📄 Build my resume"), back)];
}
// Club and campus events: posted by admins/staff (a club coordinator can be a staff member). Students RSVP and can add the event to their calendar.
const upcomingEvents = () => state.events.filter(e => (e.endAt || e.startAt + 3 * 36e5) > Date.now()).sort((a, b) => a.startAt - b.startAt);
function icsFor(e) {
  const f = (t) => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""), esc = (x) => String(x || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CampusLoop//EN", "BEGIN:VEVENT", "UID:" + e.id + "@campusloop", "DTSTAMP:" + f(Date.now()), "DTSTART:" + f(e.startAt), "DTEND:" + f(e.endAt || e.startAt + 2 * 36e5), "SUMMARY:" + esc(e.title), "LOCATION:" + esc(e.venue), "DESCRIPTION:" + esc((e.club ? e.club + ". " : "") + (e.details || "")), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
function renderEvents() {
  const back = el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back"), uid = store && store.authUid ? store.authUid() : "", note = el("p", { class: "hint", role: "status" }, "");
  const going = (e) => state.rsvps.filter(r => r.eventId === e.id), card = (e) => {
    const list = going(e), mine = list.some(r => r.uid === uid), full = e.capacity && list.length >= e.capacity && !mine;
    const when = new Date(e.startAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    return el("div", { class: "learn-card plus-list" }, el("strong", {}, "🎉 " + e.title), el("p", { class: "hint" }, ["📅 " + when, e.venue ? "📍 " + e.venue : "", e.club ? "🏛️ " + e.club : ""].filter(Boolean).join(" · ")), e.details ? el("p", {}, e.details) : null,
      el("p", { class: "hint" }, "👥 " + list.length + " going" + (e.capacity ? " of " + e.capacity : "") + (list.length ? ": " + list.slice(0, 4).map(r => r.name).join(", ") + (list.length > 4 ? " and " + (list.length - 4) + " more" : "") : "")),
      el("div", { class: "rowbtns" },
        mine ? el("button", { class: "btn sm", type: "button", onclick: async () => { try { await store.delRoomDoc("eventRsvp", e.id + "_" + uid); state.rsvps = state.rsvps.filter(r => !(r.eventId === e.id && r.uid === uid)); render(); } catch (_) { note.textContent = "Could not cancel. Try again."; } } }, "✔ Going · cancel")
          : el("button", { class: "btn sm primary", type: "button", disabled: full ? "" : null, onclick: async () => { if (!uid) { note.textContent = "Connect to the internet to RSVP."; return; } try { const rec = { eventId: e.id, uid, name: (getName() || "Student").slice(0, 50), createdAt: Date.now() }; await store.set("eventRsvp", e.id + "_" + uid, rec); state.rsvps = [...state.rsvps.filter(r => !(r.eventId === e.id && r.uid === uid)), rec]; render(); } catch (_) { note.textContent = "Could not RSVP. Try again."; } } }, full ? "Full" : "I am going"),
        el("button", { class: "btn sm", type: "button", onclick: () => { const u = URL.createObjectURL(new Blob([icsFor(e)], { type: "text/calendar" })), a = document.createElement("a"); a.href = u; a.download = "event.ics"; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); } }, "📆 Add to calendar"),
        /^https:\/\//.test(e.link || "") ? el("button", { class: "btn sm", type: "button", onclick: () => { try { window.open(e.link, "_blank", "noopener"); } catch (_) {} } }, "More info") : null));
  };
  const list = upcomingEvents();
  return [el("h2", {}, "🎉 Events"), el("p", { class: "hint" }, "Club and campus events for " + COLLEGE + ". Tap I am going so the organisers can plan."),
    ...(list.length ? list.map(card) : [el("p", { class: "hint" }, "No upcoming events yet. Club coordinators and the college admin post them here.")]), note, el("div", { class: "rowbtns" }, back)];
}
// Explore: every tool in one tidy screen, so the home screen can stay simple.
const EXPLORE = [
  ["Study", [["quizBtn", "🧠", "Daily Quiz"], ["labBtn", "🧪", "Study Lab"], ["studyBtn", "📖", "Study Tools"], ["learnBtn", "📚", "Learn from IIT"], ["focusBtn", "🎯", "Focus mode"]]],
  ["Campus", [["__story", "📸", "Add a story"], ["eventsBtn", "🎉", "Events"], ["drivesBtn", "🏢", "Campus Drives"], ["leadersBtn", "🏆", "Top Helpers"], ["alumniBtn", "🎓", "Alumni", "alumni"]]],
  ["Career", [["careerBtn", "", "Career Guide"], ["__resume", "📄", "Resume builder"]]],
  ["More", [["__stickers", "🎴", "Sticker book"], ["__wardrobe", "👗", "Loopy\u2019s wardrobe"], ["__install", "📲", "Install app"], ["__plus", "⭐", "The Campus Loop Plus"], ["botBtn", "", "Loop Bot", "bot"], ["funBtn", "🎉", "Entertainment", "fun"], ["aboutBtn", "ℹ️", "About Us"]]],
];
function renderExplore() {
  const back = el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back");
  const go = (id) => { if (id === "__plus") { showPanel("plus"); return; } if (id === "__resume") { showPanel("resume"); return; } if (id === "__story") { openStoryAdd(); return; } if (id === "__stickers") { showPanel("stickers"); return; } if (id === "__wardrobe") { showPanel("wardrobe"); return; } if (id === "__install") { const ib = $("installBtn"); if (_pwaPrompt && ib) ib.click(); else showNotice("To install: open your browser menu and tap Add to Home screen.", ""); return; } const b = $(id); if (b) b.click(); };
  return [el("h2", {}, "🧰 Explore"), el("p", { class: "hint" }, "Everything in " + BRAND + ", in one place."),
    ...EXPLORE.flatMap(([title, items]) => [el("div", { class: "label" }, title), el("div", { class: "plus-tiles" }, ...items.filter(it => !it[3] || !document.body.classList.contains("no-" + it[3])).map(([id, icon, label]) => el("button", { class: "plus-tile", type: "button", onclick: () => go(id) }, el("span", { class: "pt-i", "aria-hidden": "true" }, icon), el("strong", {}, label))))]),
    el("div", { class: "rowbtns" }, back)];
}
// Milestone welcome: counts the different days a student opened the app and celebrates 3, 7, 14, 30, 60 and 100 days with the family.
const MILESTONES = [
  [3, "🌱", "Your first three days", "You are already part of the family. Small steps every day grow into big results.", 0],
  [7, "🔥", "A full week together", "Seven days of showing up. Thank you for helping build a kind, curious campus.", 1],
  [14, "⭐", "Two weeks strong", "You are becoming a pillar of this family. Keep asking, keep answering.", 0],
  [30, "🏆", "One month with the family", "Thirty days of learning together. Your juniors are lucky to have you here.", 3],
  [60, "💎", "Sixty days of dedication", "Respect. Consistency like yours lifts everyone around you.", 0],
  [100, "👑", "100 days: a true family member", "A hundred days. You are the heart of this campus. Thank you from all of us. 🙏", 7],
];
function recordVisit() {
  const v = readJSON("dd-visits", { n: 0, last: "" }), today = dayStr();
  if (v.last !== today) { v.n = (v.n || 0) + 1; v.last = today; writeJSON("dd-visits", v); }
  return v.n || 1;
}
function showMilestone(n, tries) {
  if (document.getElementById("milestone")) return;
  if ((document.getElementById("welcome") || document.getElementById("splash")) && (tries || 0) < 12) { setTimeout(() => showMilestone(n, (tries || 0) + 1), 1000); return; }
  const m = MILESTONES.find(x => x[0] === n); if (!m) return;
  const [, icon, title, text, bonus] = m;
  const box = el("div", { id: "milestone", class: "welcome", role: "dialog", "aria-modal": "true", "aria-label": "Milestone" });
  const close = () => { box.remove(); };
  if (bonus) { const until = Math.max(Number(readJSON("dd-bonus-until", 0)) || 0, Date.now()) + bonus * 864e5; writeJSON("dd-bonus-until", until); }
  writeJSON("dd-milestones", [...(readJSON("dd-milestones", [])), n]);
  box.append(el("div", { class: "welcome-card" },
    el("div", { class: "welcome-icon", "aria-hidden": "true" }, icon), el("h2", {}, "Day " + n + " with " + BRAND + " family 🎉"), el("h3", {}, title), el("p", {}, text),
    bonus ? el("p", { class: "plan-deal" }, "🎁 Our gift: " + bonus + " free day" + (bonus === 1 ? "" : "s") + " of Plus studio") : null,
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: close }, "Thank you!"),
      el("button", { class: "btn", type: "button", onclick: () => { shareResult({ kicker: "Member of " + BRAND + " family", emoji: icon, big: "Day " + n, line: title }); } }, "📤 Share"))));
  document.body.append(box); confetti(120);
}
function maybeMilestone() {
  const n = recordVisit(), done = readJSON("dd-milestones", []);
  if (MILESTONES.some(m => m[0] === n) && !done.includes(n) && !NO_COLLEGE) setTimeout(() => showMilestone(n, 0), 1800);
}
// College crest: the college's own logo when the admin uploaded one, otherwise a clean monogram badge in the college colours.
function collegeInitials() {
  const words = String(COLLEGE || BRAND).replace(/\(.*?\)/g, " ").split(/[^A-Za-z0-9]+/).filter(w => w && !/^(of|and|the|for|in|college|university|institute)$/i.test(w));
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join("").toUpperCase();
}
function crestEl(size) {
  const px = (size || 28) + "px";
  if (TENANT && TENANT.crest) { const im = el("img", { class: "crest crest-img", src: TENANT.crest, alt: COLLEGE + " crest", width: String(size || 28), height: String(size || 28) }); return im; }
  const w = el("span", { class: "crest crest-mono", role: "img", "aria-label": COLLEGE + " crest" }, collegeInitials());
  w.style.setProperty("width", px); w.style.setProperty("height", px); w.style.setProperty("font-size", Math.max(9, Math.round((size || 28) * (collegeInitials().length > 4 ? 0.27 : collegeInitials().length > 3 ? 0.3 : collegeInitials().length > 2 ? 0.34 : 0.4))) + "px");
  return w;
}
// Trust strip under the tagline: honest promises plus real numbers from this college (shown only once they are big enough to mean something).
let trustKey = "";
function renderTrust() {
  const bar = $("trustBar"); if (!bar) return;
  const students = state.profiles.length, posts = ["doubts", "ideas", "clubs", "gate", "jobs", "challenges"].reduce((n, k) => n + (state[k] || []).length, 0);
  const key = students + "/" + posts + "/" + NO_COLLEGE; if (key === trustKey) return; trustKey = key;
  const chips = [["🔒", "Anonymous sign-in"], ["🛡️", "Moderated"], ["🚫", "No ads"], ["✔", "Verified students"]];
  if (!NO_COLLEGE && students >= 10) chips.unshift(["👥", students + " students"]);
  if (!NO_COLLEGE && posts >= 25) chips.splice(1, 0, ["💬", posts + " posts"]);
  bar.replaceChildren(...chips.map(([i, t]) => el("span", { class: "trust-chip" }, i + " " + t)), el("a", { class: "trust-link", href: "privacy.html", target: "_blank", rel: "noopener" }, "Privacy"));
}
function renderHeader() {
  renderTrust(); renderToday();
  const t = TABS[state.tab];
  document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));

  $("askBtn").textContent = t.ask;
  const me = store && state.loaded ? allStats().get(store.uid) : null;
  streakTick(me);
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
          }, c === "all" ? "🌐 All" : c + " · " + campusSeenCount(c))
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
          }, y === "All" ? "All Years" : yl(y) + " · " + yearPostCount(y))
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
  $("search").placeholder = state.tab === "doubts" ? "Search doubts" : state.tab === "gate" ? "Search " + EXAM_LABEL + " discussions" : state.tab === "market" ? "Search listings" : state.tab === "clubs" ? "Search club posts" : state.tab === "challenges" ? "Search challenges" : state.tab === "jobs" ? "Search openings" : "Search ideas";
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

// Every tab says what it is for, how to use it in three steps, and the next step to take. Students can close it; a small link brings it back.
const TAB_GUIDE = {
  doubts: { icon: "\u2753", purpose: "Stuck on a problem? Ask it here and classmates and seniors will answer.", steps: ["Pick your branch and subject on the left (or leave it on All).", "Tap Ask a doubt, write your question and add a photo if it helps.", "Open your doubt later to read answers. Thank the helpful ones with a reaction."], safe: "Do not post phone numbers, passwords or photos of other people.", next: () => { const mine = store ? allMyIds() : new Set(); const asked = state.doubts.some(d => mine.has(d.authorId)); return asked ? ["\u{1F64B} Answer a classmate\u2019s doubt", () => showUnanswered()] : ["\u2753 Ask your first doubt", () => openAsk()]; } },
  ideas: { safe: "Share the idea, not private data or secrets you must protect.", icon: "\u{1F4A1}", purpose: "Share project, startup and campus ideas. Find people to build them with.", steps: ["Choose a category, such as Project or Startup.", "Tap Share an idea and say what you want to build and who you need.", "Read the comments, then team up with the people who reply."], next: () => ["\u{1F4A1} Share an idea", () => openAsk()] },
  clubs: { safe: "Meet club members on campus and in groups you can verify.", icon: "\u{1F3DB}", purpose: "Find your club, see what it is doing and post updates for its members.", steps: ["Pick a club on the left.", "Read its latest posts and events.", "Post a meeting, a result or a call for new members."], next: () => ["\u{1F4E3} Post in a club", () => openAsk()] },
  challenges: { safe: "Points come only from playing. Nobody can sell or give you points.", icon: "\u{1F3AE}", purpose: "Quizzes, puzzles and contests. Win points for yourself and your college.", steps: ["Take the daily quiz. It takes one minute.", "Try a puzzle or an innovation challenge.", "Check the Board to see how your college is doing this week."], next: () => ["\u{1F9E0} Take today\u2019s quiz", () => showPanel("quiz")] },
  jobs: { safe: "A real job or internship never asks you to pay. Report it if it does.", icon: "\u{1F4BC}", purpose: "Internships, jobs, off-campus drives and interview experiences in one place.", steps: ["Pick a type, such as Internship or Interview experience.", "Open a post for the details and the official link.", "Never pay for a job. Report anything that asks for money."], next: () => ["\u{1F3E2} See campus drives", () => showPanel("drives")] },
  market: { safe: "Meet in a public place on campus. Do not pay in advance.", icon: "\u{1F6D2}", purpose: "Buy and sell books, notes, electronics and hostel items with your college mates.", steps: ["Pick a category, or search for what you need.", "Message the seller and meet in a public place on campus.", "Selling? Tap Post an item with a clear photo and price."], next: () => ["\u{1F3F7}\uFE0F Sell something", () => openAsk()] },
  gate: { safe: "Use papers from official or trusted sources.", icon: "\u{1F3AF}", purpose: "Exam preparation: previous papers, tips and discussions for your exam.", steps: ["Pick your branch and subject.", "Open the previous papers and try them with a timer.", "Stuck on a question? Post it in the discussion."], next: () => ["\u{1F4DD} Open previous papers", () => { const b = document.querySelector(".pyq-panel, .subj-chip"); if (b) b.scrollIntoView({ behavior: "smooth" }); }] },
};
function renderGuide() {
  const box = $("guideBar"); if (!box) return;
  const g = TAB_GUIDE[state.tab]; if (!g || NO_COLLEGE || state.query.trim()) { box.hidden = true; return; }
  const key = "dd-guide-" + state.tab, closed = readJSON(key, false);
  box.hidden = false;
  if (closed) { box.className = "guide-card mini"; box.replaceChildren(el("button", { class: "guide-reopen", type: "button", onclick: () => { writeJSON(key, false); renderGuide(); } }, "\u2139\uFE0F How this works")); return; }
  box.className = "guide-card";
  const nx = g.next();
  box.replaceChildren(
    el("button", { class: "guide-x", type: "button", "aria-label": "Close this guide", onclick: () => { writeJSON(key, true); renderGuide(); } }, "\u2715"),
    el("div", { class: "guide-head" }, el("span", { class: "guide-ic", "aria-hidden": "true" }, g.icon), el("div", {}, el("small", {}, "WHAT THIS IS FOR"), el("strong", {}, g.purpose))),
    el("ol", { class: "guide-steps" }, ...g.steps.map(s => el("li", {}, s))),
    g.safe ? el("p", { class: "guide-safe" }, el("b", {}, "Stay safe: "), g.safe) : null,
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: nx[1] }, nx[0]), el("button", { class: "btn sm", type: "button", onclick: () => showHowTo() }, "\u{1F4D6} Full guide")));
}
// The full guide: the path from joining to getting the most out of the app, with ticks for the steps you have already done.
function showHowTo() {
  const mine = store ? allMyIds() : new Set(), name = !!(getName() || "").trim();
  const asked = state.doubts.some(d => mine.has(d.authorId)), answered = state.replies.some(r => mine.has(r.authorId)), quiz = (QUIZ.length ? !!myQuizAnswer(dayNum()) : true) || readJSON("dd-quest-quiz", false), campusPicked = CAMPUSES.length ? !!getCampus() : true;
  const close = () => ov.remove();
  const row = (done, icon, title, text, label, fn) => el("li", { class: done ? "done" : "" }, el("span", { class: "hw-tick", "aria-hidden": "true" }, done ? "\u2713" : icon), el("div", {}, el("strong", {}, title), el("small", {}, text), done || !fn ? null : el("button", { class: "btn sm primary", type: "button", onclick: () => { close(); fn(); } }, label)));
  const steps = [
    row(name, "1", "Tell us your name", "A first name is enough. It is shown with your posts.", "Set my name", () => { state.afterName = null; showPanel("name"); }),
    CAMPUSES.length ? row(campusPicked, "2", "Pick your campus", "So classmates on your campus can find you.", "Choose campus", () => { state.mode = "campus"; render(); }) : null,
    row(asked, "3", "Ask your first doubt", "Open Doubts, tap Ask a doubt and write your question.", "Ask a doubt", () => openAsk()),
    row(answered, "4", "Answer someone", "Helping others earns points and builds your streak.", "See open doubts", () => showUnanswered()),
    row(quiz, "5", "Take today\u2019s quiz", "One question a day. It counts for your college.", "Take the quiz", () => showPanel("quiz")),
    row(false, "6", "Come back tomorrow", "Visit every day to grow your streak and unlock Loopy\u2019s costumes.", "", null),
  ].filter(Boolean);
  const ov = el("div", { class: "welcome", role: "dialog", "aria-modal": "true", "aria-label": "How to use " + BRAND }, el("div", { class: "welcome-card hw" },
    el("h2", {}, "\u{1F4D6} How to use " + BRAND), el("p", { class: "ob-say" }, "Follow these steps. Tick marks show what you have already done."), el("ol", { class: "hw-list" }, ...steps),
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: close }, "Got it"))));
  document.body.append(ov);
}
// ---------- Curiosity corner: fact of the day, Why guess, mystery topic, best question, weekly tip ----------
let _curioLoading = false;
function loadCurio() {
  if (window.CURIO || _curioLoading) return; _curioLoading = true;
  const sc = document.createElement("script"); sc.src = "curiosity.js?v=" + ((document.querySelector('script[src^="app.js"]') || {}).src || "").split("v=")[1];
  sc.onload = () => { if (state.mode === "curious") render(); }; sc.onerror = () => { window.CURIO = { facts: [], whys: [], mysteries: [], tips: [] }; }; document.head.append(sc);
}
const curioStore = () => { const o = readJSON("dd-curio", {}); return { fact: o.fact || {}, why: o.why || {}, myst: o.myst || {}, puz: o.puz || {} }; };
const curioSave = (o) => { writeJSON("dd-curio", o); try { clearTimeout(curioSave._t); curioSave._t = setTimeout(() => { try { syncProfile().catch(() => {}); } catch (_) {} }, 2000); } catch (_) {} };
const curioPoints = (o = curioStore()) => Object.keys(o.fact).length + 2 * Object.keys(o.why).length + 3 * Object.keys(o.myst).length + Object.values(o.puz).reduce((a, p) => a + (p && p.ok ? Math.max(1, Math.min(4, Number(p.pts) || 1)) : 0), 0);
function curioStreak(o = curioStore()) {
  const days = new Set([...Object.keys(o.fact), ...Object.keys(o.why), ...Object.keys(o.myst), ...Object.keys(o.puz).filter(k => o.puz[k] && o.puz[k].ok)].map(Number)); let d = dayNum(), n = 0;
  if (!days.has(d)) d -= 1; while (days.has(d)) { n++; d--; } return n;
}
const BRANCH_TAGS = { CSE: ["cs", "math"], "AI&ML": ["cs", "math"], ECE: ["ece", "physics"], EEE: ["ece", "physics"], ME: ["mech", "physics"], CE: ["civil"], CHE: ["chem"], MME: ["chem", "mech"] };
// Content is shown for the student's year and branch: year-specific items most days, general ones in between.
const curioProf = () => { const o = readJSON("dd-curio-prof", {}) || {}; return { year: [1, 2, 3, 4].includes(o.year) ? o.year : null, branch: typeof o.branch === "string" && BRANCH_TAGS[o.branch] ? o.branch : "" }; };
function curioNorm(C) {
  if (C._n) return C; C._n = true;
  C.mysteries = C.mysteries.map(m => m.n ? { y: m.y, t: m.t, title: m.n, h: m.h, x: m.x } : { y: m.y, title: m.t, h: m.h, x: m.x });
  C.tips = C.tips.map(t => typeof t === "string" ? { q: t } : t);
  return C;
}
function curioPick(list, salt = 0) {
  if (!list.length) return null;
  const prof = curioProf(), tags = BRANCH_TAGS[prof.branch] || null;
  const ok = list.filter(x => (!x.y || !prof.year || x.y.includes(prof.year)) && (!tags || !x.t || x.t === "general" || tags.includes(x.t)));
  const pool = ok.length ? ok : list, spec = prof.year ? pool.filter(x => x.y) : [], gen = pool.filter(x => !x.y);
  const use = spec.length && (gen.length === 0 || (dayNum() + salt) % 3 !== 0) ? spec : (gen.length ? gen : pool);
  return use[(dayNum() + salt) % use.length];
}
function bestQuestion() {
  const week = Date.now() - 7 * 86400000, mine = store ? allMyIds() : new Set();
  return state.doubts.filter(d => !d.deleted && !d.anonymous && (d.createdAt || 0) > week).map(d => ({ d, v: likesFor(d.id).filter(l => l.uid !== d.authorId).length })).filter(x => x.v >= 1).sort((a, b) => b.v - a.v || b.d.createdAt - a.d.createdAt)[0] || null;
}
// Extra curiosity sections: puzzle with a hint ladder, topic map, idea spark, question buddy, explore links, shareable card.
const normAns = (v) => String(v || "").toLowerCase().replace(/[\s,]/g, "").slice(0, 40);
function curioPuzzle(C, o, redo, today) {
  const pz = C.puzzles && C.puzzles.length ? C.puzzles[dayNum() % C.puzzles.length] : null; if (!pz) return null;
  const rec = o.puz[today] || { hints: 0, ok: false }, say = el("p", { class: "hint", role: "status" }, "");
  const input = el("input", { type: "text", inputmode: "text", maxlength: "30", autocomplete: "off", placeholder: "Your answer", "aria-label": "Your answer", disabled: rec.ok ? "" : null });
  const save = (r) => { const s = curioStore(); s.puz[today] = r; curioSave(s); redo(); };
  const check = () => { if (rec.ok) return; const v = normAns(input.value); if (!v) { say.textContent = "Type your answer first."; return; } if (pz.a.map(normAns).includes(v)) { save({ hints: rec.hints, ok: true, pts: 4 - rec.hints }); try { if (navigator.vibrate) navigator.vibrate([12, 40, 12]); } catch (_) {} } else { say.textContent = "Not yet. Think again, or reveal a hint."; try { if (navigator.vibrate) navigator.vibrate(30); } catch (_) {} } };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); check(); } });
  return el("div", { class: "learn-card curio-card" }, el("small", { class: "tag" }, "\u{1F9E9} PUZZLE OF THE DAY"), el("strong", {}, pz.q),
    ...pz.h.slice(0, rec.hints).map((t, i) => el("p", { class: "curio-hint" }, el("b", {}, "Hint " + (i + 1) + ": "), t)),
    rec.ok ? el("p", {}, el("b", {}, "✅ Solved (+" + Math.max(1, 4 - rec.hints) + " points). "), pz.x) : el("div", { class: "ls-bar" }, input, el("button", { class: "btn primary", type: "button", onclick: check }, "Check")),
    rec.ok ? null : el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", disabled: rec.hints >= pz.h.length ? "" : null, onclick: () => save({ hints: Math.min(pz.h.length, rec.hints + 1), ok: false }) }, rec.hints >= pz.h.length ? "No more hints" : "\u{1F4A1} Show hint " + (rec.hints + 1)), el("small", { class: "hint" }, "Fewer hints, more points (up to 4).")), say);
}
function curioMap(C) {
  const pr = curioProf(), list = (C.maps || []).filter(m => !pr.year || !m.y || m.y.includes(pr.year)), m = list.length ? list[Math.floor(dayNum() / 1) % list.length] : null; if (!m) return null;
  const NS = "http://www.w3.org/2000/svg", W = 320, H = 260, cx = W / 2, cy = H / 2, R = 96, col = { subject: "#7c3aed", job: "#f97316", use: "#16a34a" };
  const mk = (t, a, kids) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); (kids || []).forEach(c => n.append(c)); return n; };
  const svg = mk("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Map of " + m.c + " and what it connects to", class: "curio-svg" });
  m.l.forEach(([label, kind], i) => {
    const ang = (i / m.l.length) * Math.PI * 2 - Math.PI / 2, x = cx + R * 1.18 * Math.cos(ang), y = cy + R * 0.92 * Math.sin(ang), c = col[kind] || "#7c3aed";
    svg.append(mk("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: c, "stroke-width": "2", opacity: ".5" }));
    const g = mk("g", { tabindex: "0", role: "button", "aria-label": "Search " + label, class: "curio-node" }), w = Math.max(70, label.length * 6.4 + 16);
    g.append(mk("rect", { x: x - w / 2, y: y - 13, width: w, height: 26, rx: 13, fill: c }), (() => { const t = mk("text", { x, y: y + 4.5, "text-anchor": "middle", fill: "#fff", "font-size": "11", "font-weight": "700" }); t.textContent = label; return t; })());
    const go = () => openLoopySearch(label, "curious"); g.addEventListener("click", go); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    svg.append(g);
  });
  svg.append(mk("circle", { cx, cy, r: 38, fill: "#1e1b4b" }), (() => { const t = mk("text", { x: cx, y: cy + 4, "text-anchor": "middle", fill: "#fff", "font-size": "11", "font-weight": "800" }); t.textContent = m.c.length > 15 ? m.c.slice(0, 14) + "…" : m.c; return t; })());
  return el("div", { class: "learn-card curio-card" }, el("small", { class: "tag" }, "\u{1F5FA}️ TOPIC MAP"), el("strong", {}, m.c + " connects to"), svg, el("small", { class: "hint" }, "Purple: subjects · Orange: careers · Green: real uses. Tap any bubble to search it."));
}
function curioBuddy(redo) {
  if (!store) return null;
  const mine = allMyIds(), bud = readJSON("dd-curio-buddy", null), stats = allStats();
  const daysOf = (ids) => new Set(state.doubts.filter(d => !d.deleted && !d.anonymous && ids.has(d.authorId) && d.createdAt).map(d => dayNum(d.createdAt)));
  const box = el("div", { class: "learn-card curio-card" }, el("small", { class: "tag" }, "\u{1F91D} QUESTION BUDDY"));
  if (bud && bud.id) {
    const a = daysOf(mine), b = daysOf(new Set([bud.id])), t = dayNum(); let d = a.has(t) && b.has(t) ? t : t - 1, n = 0; while (a.has(d) && b.has(d)) { n++; d--; }
    box.append(el("strong", {}, "You and " + String(bud.name || "your buddy").slice(0, 30)), el("p", {}, el("b", {}, n + "-day streak"), " of both asking a question"), el("small", { class: "hint" }, (a.has(t) ? "You asked today. " : "You have not asked today. ") + (b.has(t) ? "Your buddy asked today." : "Your buddy has not asked today.")),
      el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => openAsk() }, "❓ Ask today’s question"), el("button", { class: "btn sm", type: "button", onclick: () => { try { localStorage.removeItem("dd-curio-buddy"); } catch (_) {} redo(); } }, "Change buddy")));
    return box;
  }
  const input = el("input", { type: "search", maxlength: "30", placeholder: "Search a classmate by nickname", "aria-label": "Search a buddy", autocomplete: "off" }), res = el("div", { class: "ls-people" });
  const draw = () => { const nd = input.value.trim().toLowerCase(); const rows = nd.length < 2 ? [] : [...stats.values()].filter(p => p.name && p.id !== (store && store.uid) && p.name.toLowerCase().includes(nd)).slice(0, 5); res.replaceChildren(...rows.map(p => el("button", { class: "btn sm", type: "button", onclick: () => { writeJSON("dd-curio-buddy", { id: p.id, name: p.name.slice(0, 40) }); redo(); } }, "\u{1F91D} " + p.name))); };
  input.addEventListener("input", draw);
  box.append(el("strong", {}, "Ask one question a day with a friend"), el("p", { class: "hint" }, "Pick a classmate. Your streak grows each day that both of you ask a question on the board. It uses only public, non-anonymous questions."), input, res);
  return box;
}
function curioShare() {
  const o = curioStore(), names = Object.keys(o.myst).length, p = (store && allStats().get(store.uid)) || { asked: 0, likes: 0 };
  return el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => shareResult({ kicker: "MY CURIOSITY", emoji: "\u{1F50E}", big: String(curioPoints(o)), line: "curiosity points · " + curioStreak(o) + "-day streak · " + names + " mystery topics · " + (p.asked || 0) + " questions asked" }) }, "\u{1F4E4} Share my curiosity card"));
}
function renderCurious() {
  loadCurio();
  const C0 = window.CURIO, C = C0 ? curioNorm(C0) : null, back = el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back");
  if (!C) return [el("h2", {}, "\u{1F50E} Curiosity corner"), el("p", { class: "hint", role: "status" }, "Loading…"), el("div", { class: "rowbtns" }, back)];
  const o = curioStore(), today = String(dayNum()), streak = curioStreak(o), pts = curioPoints(o), week = Math.floor((dayNum() + 3) / 7);
  const fact = curioPick(C.facts, 0), why = curioPick(C.whys, 1), myst = curioPick(C.mysteries, 2), tipObj = (() => { const pr = curioProf(), pool = C.tips.filter(t => !t.y || !pr.year || t.y.includes(pr.year)), sp = pool.filter(t => t.y); const use = pr.year && sp.length && week % 2 === 0 ? sp : (pool.length ? pool : C.tips); return use.length ? use[week % use.length] : null; })(), tip = tipObj ? tipObj.q : "";
  const redo = () => { state.mode = "curious"; render(); };
  const sec = (icon, kicker, ...kids) => el("div", { class: "learn-card curio-card" }, el("small", { class: "tag" }, icon + " " + kicker), ...kids);
  // Why of the day: guess first, then the answer
  const chosen = why ? o.why[today] : undefined;
  const whyCard = why ? sec("❓", "WHY? GUESS FIRST", el("strong", {}, why.q),
    el("div", { class: "curio-opts", role: "group", "aria-label": "Your guess" }, ...why.o.map((t, i) => el("button", { type: "button", class: "btn" + (chosen === i ? " primary" : "") + (chosen != null && i === why.a ? " right" : ""), disabled: chosen != null ? "" : null, onclick: () => { const s = curioStore(); if (s.why[today] != null) return; s.why[today] = i; curioSave(s); try { if (navigator.vibrate) navigator.vibrate(i === why.a ? [12, 40, 12] : 12); } catch (_) {} redo(); } }, t))),
    chosen != null ? el("p", {}, el("b", {}, chosen === why.a ? "✅ Right! " : "Good try. "), why.x) : el("p", { class: "hint" }, "Pick one before you read the answer. Guessing makes you remember it (+2 points).")) : null;
  // Mystery topic: locked until tapped
  const open = !!o.myst[today];
  const mystCard = myst ? sec("\u{1F512}", "MYSTERY TOPIC", open ? el("strong", {}, myst.title) : el("strong", {}, "A topic you may not have seen yet"), el("p", { class: open ? "" : "hint" }, open ? myst.x : myst.h),
    open ? el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => openLoopySearch(myst.title, "curious") }, "\u{1F50E} Search more on " + myst.title)) : el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { const s = curioStore(); s.myst[today] = 1; curioSave(s); try { if (navigator.vibrate) navigator.vibrate(20); } catch (_) {} redo(); } }, "\u{1F513} Unlock it (+3 points)"))) : null;
  // Fact of the day
  const learned = !!o.fact[today];
  const factCard = fact ? sec("\u{1F4A1}", "DID YOU KNOW?", el("p", { class: "curio-fact" }, fact.q),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm" + (learned ? "" : " primary"), type: "button", disabled: learned ? "" : null, onclick: () => { const s = curioStore(); s.fact[today] = 1; curioSave(s); redo(); } }, learned ? "✓ Learned (+1)" : "\u{1F44D} I learned this (+1)"), el("button", { class: "btn sm", type: "button", onclick: () => openLoopySearch(fact.ask, "curious") }, "\u{1F50E} Ask more"))) : null;
  // Best question of the week
  const bq = bestQuestion();
  const bqCard = sec("\u{1F31F}", "BEST QUESTION THIS WEEK", bq ? el("strong", {}, String(bq.d.title || "").slice(0, 120)) : el("strong", {}, "No winner yet"), bq ? el("small", { class: "hint" }, bq.d.subject + " · " + bq.v + " vote" + (bq.v === 1 ? "" : "s") + " · asked by " + (bq.d.authorName || "a classmate")) : el("p", { class: "hint" }, "Ask a good question and ask classmates to vote for it."),
    el("p", { class: "hint" }, "Every vote on your question earns you 1 point (up to 10 a question). Vote for the questions that made you think."), bq ? el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => { state.tab = "doubts"; openItem(bq.d.id); } }, "Open the question")) : el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => openAsk() }, "❓ Ask a question")));
  const tipCard = tip ? sec("\u{1F9ED}", "TIP OF THE WEEK", el("p", {}, tip), el("small", { class: "hint" }, "Written by the " + BRAND + " team. Seniors: share your own tip as an idea."), el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => { state.tab = "ideas"; openAsk(); } }, "\u{1F4A1} Share my tip"))) : null;
  const prof = curioProf(), setProf = (k, v) => { const o2 = readJSON("dd-curio-prof", {}) || {}; o2[k] = v; writeJSON("dd-curio-prof", o2); redo(); };
  const BR = [["CSE", "CSE"], ["AI&ML", "AI&ML"], ["ECE", "ECE"], ["EEE", "EEE"], ["ME", "Mech"], ["CE", "Civil"], ["CHE", "Chem"], ["MME", "Metal"]];
  const picker = el("div", { class: "curio-pick" }, el("small", { class: "hint" }, prof.year ? "Showing content for Year " + prof.year + (prof.branch ? " " + prof.branch : "") : "Choose your year and branch for content made for you"),
    el("div", { class: "rowbtns", role: "group", "aria-label": "Your year" }, ...[1, 2, 3, 4].filter(y => !IS_RGUKT || y >= 2).map(y => el("button", { class: "btn sm" + (prof.year === y ? " primary" : ""), type: "button", "aria-pressed": String(prof.year === y), onclick: () => setProf("year", y) }, "Year " + y))),
    el("div", { class: "rowbtns", role: "group", "aria-label": "Your branch" }, ...BR.map(([k, t]) => el("button", { class: "btn sm" + (prof.branch === k ? " primary" : ""), type: "button", "aria-pressed": String(prof.branch === k), onclick: () => setProf("branch", prof.branch === k ? "" : k) }, t))));
  return [
    el("h2", {}, "\u{1F50E} Curiosity corner"), picker,
    el("div", { class: "curio-stats" }, el("div", {}, el("b", {}, String(streak)), el("span", {}, "day curiosity streak \u{1F525}")), el("div", {}, el("b", {}, String(pts)), el("span", {}, "curiosity points"))),
    factCard, whyCard, mystCard, curioPuzzle(C, o, redo, today), curioMap(C),
    sec("\u{1F4A5}", "IDEA SPARK THIS WEEK", el("strong", {}, (C.sparks && C.sparks.length ? C.sparks[week % C.sparks.length] : "What if...?")), el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { state.tab = "ideas"; openAsk(); } }, "\u{1F4A1} Share my idea"))),
    bqCard, curioBuddy(redo),
    (() => { const n = C.now && C.now.length ? C.now[week % C.now.length] : null; return n ? sec("\u{1F30D}", "EXPLORE THIS WEEK", el("strong", {}, n[0]), el("p", { class: "hint" }, n[2]), el("div", { class: "rowbtns" }, outLink(n[1], "Open the official site", "btn sm"))) : null; })(),
    tipCard, curioShare(),
    el("div", { class: "rowbtns" }, back),
  ].filter(Boolean);
}
// RGUKT is open from B.Tech 2nd year (E2) onwards (the six-year integrated course starts with P1, P2 and E1). This is a self-declaration shown once on RGUKT.
const RG_YEARS = [["P1", "Pre-University 1", false], ["P2", "Pre-University 2", false], ["E1", "B.Tech 1st year", false], ["E2", "B.Tech 2nd year", true], ["E3", "B.Tech 3rd year", true], ["E4", "B.Tech 4th year", true]];
function showEligibility() {
  if (document.getElementById("rgElig")) return;
  const msg = el("p", { class: "ob-say", role: "status" }, "");
  const ov = el("div", { class: "welcome", id: "rgElig", role: "dialog", "aria-modal": "true", "aria-label": "Which year are you in?" });
  const choose = (k, ok) => {
    if (!ok) { msg.textContent = "Thank you. " + BRAND + " is open to RGUKT B.Tech 2nd year students and above for now, because of the age policy. Please come back when you reach B.Tech 2nd year. Meanwhile you can read the About page."; return; }
    writeJSON("dd-rgukt-year", { year: k, at: Date.now() });
    try { curState.year = k; const o = readJSON("dd-curio-prof", {}) || {}; o.year = Number(k[1]) || o.year; writeJSON("dd-curio-prof", o); } catch (_) {}
    ov.remove(); render();
  };
  ov.append(el("div", { class: "welcome-card ob-card" }, el("div", { class: "ob-loopy ob-brand" }, brandMark(72)), el("h2", {}, "Which year are you in?"),
    el("p", { class: "ob-say" }, "RGUKT is a six-year integrated course. " + BRAND + " is for B.Tech 2nd year students and above."),
    el("div", { class: "rg-opts", role: "group", "aria-label": "Your year" }, ...RG_YEARS.map(([k, t, ok]) => el("button", { class: "rg-opt" + (ok ? " ok" : ""), type: "button", onclick: () => choose(k, ok) }, el("span", { class: "rg-name" }, t), el("small", {}, ok ? "Open \u2713" : "Not yet")))), msg,
    el("p", { class: "hint" }, "This is your own declaration. Please answer honestly. Details are in the ", el("a", { href: "terms.html", target: "_blank", rel: "noopener" }, "Terms"), ".")));
  document.body.append(ov);
}
// ---------- Short Campus Loop ID: STATE-COLLEGE-4 digits, for example AP-RGU-4821 ----------
// Made from the sign-in id with a fixed mix, so it is the same on every visit and needs no server. It is for sharing and support, never for signing in.
const STATE_CODES = { "Andhra Pradesh": "AP", "Telangana": "TS", "Tamil Nadu": "TN", "Karnataka": "KA", "Kerala": "KL", "Maharashtra": "MH", "Delhi": "DL", "Uttar Pradesh": "UP", "West Bengal": "WB", "Gujarat": "GJ", "Rajasthan": "RJ", "Madhya Pradesh": "MP", "Punjab": "PB", "Odisha": "OD", "Bihar": "BR", "Assam": "AS", "Haryana": "HR", "Jammu and Kashmir": "JK", "Uttarakhand": "UK", "Jharkhand": "JH", "Chhattisgarh": "CG", "Himachal Pradesh": "HP", "Puducherry": "PY", "Goa": "GA", "Meghalaya": "ML", "Manipur": "MN", "Chandigarh": "CH", "Tripura": "TR", "Nagaland": "NL", "Arunachal Pradesh": "AR", "Mizoram": "MZ", "Sikkim": "SK", "Ladakh": "LA", "Andaman and Nicobar Islands": "AN", "Lakshadweep": "LD", "Dadra and Nagar Haveli and Daman and Diu": "DD" };
function clCodes() {
  const slug = NO_COLLEGE ? "" : (TENANT ? TENANT.slug : "rgukt"), d = DIRECTORY.find(x => x.slug === slug), st = IS_RGUKT ? "Andhra Pradesh" : (d && d.state) || (TENANT && TENANT.state) || "";
  const parts = slug.split("-").filter(w => w && !/^(of|and|the|for|in)$/.test(w)), col = (parts.length > 1 ? parts.map(w => w[0]).join("") : slug).replace(/[^a-z0-9]/g, "").toUpperCase().slice(0, 3) || "CL";
  return [STATE_CODES[st] || "IN", col];
}
function clHash(str) {   // cyrb53, a small fast 53-bit mixing function
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const CLID_OK = /^[A-Z]{2}-[A-Z0-9]{1,4}-\d{4,6}$/;
// A number issued by the server is final. Until it arrives (or if the push/functions server is off) a temporary number made from the sign-in id is shown to the student only.
function tempCampusId(uid) { return clCodes().join("-") + "-" + String(clHash("campusloop|" + uid) % 10000).padStart(4, "0"); }
function campusId(uid) {
  if (!uid) return "";
  if (store && uid === store.uid) { const c = readJSON("dd-clid", ""); return typeof c === "string" && CLID_OK.test(c) ? c : tempCampusId(uid); }
  const p = state.profiles.find(x => x.id === uid); return p && typeof p.cid === "string" && CLID_OK.test(p.cid) ? p.cid : "";
}
let _claimingId = false;
async function claimStudentIdOnce() {
  if (_claimingId || !store || !store.idToken || !PLUS.functionsUrl || NO_COLLEGE || !state.loaded) return;
  const have = readJSON("dd-clid", ""); if (typeof have === "string" && CLID_OK.test(have)) return;
  _claimingId = true;
  try {
    const tok = await store.idToken(); if (!tok) return;
    const [st] = clCodes(), slug = TENANT ? TENANT.slug : "rgukt";
    const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/claimStudentId", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ slug, st }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && typeof d.id === "string" && CLID_OK.test(d.id)) { writeJSON("dd-clid", d.id); syncProfile().catch(() => {}); if (state.mode === "me") render(); }
  } catch (_) {} finally { _claimingId = false; }
}
function idCard() {
  const uid = store && store.uid; if (!uid) return null; const id = campusId(uid), final = id === readJSON("dd-clid", ""), say = el("small", { class: "hint", role: "status" }, "");
  return el("div", { class: "learn-card id-card" }, el("small", { class: "tag" }, "\u{1F194} YOUR CAMPUS LOOP ID"), el("strong", { class: "id-code" }, id),
    el("small", { class: "hint" }, final ? "Your own number, never reused. Share it with friends or quote it when you write to support. It is not a password." : "Temporary number. Your final number is issued when the server is connected. It is not a password."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(id); say.textContent = "Copied."; } catch (_) { say.textContent = id; } } }, "\u{1F4CB} Copy")), say);
}
// ---------- Custom Loop ID (@name): easy to pick, easy to find again ----------
const HANDLE_OK = /^[a-z0-9_]{3,15}$/, HANDLE_RESERVED = /^(admin|official|support|staff|moderator|campusloop|loop|rgukt|help|team|mod)/;
const handleOf = (id) => { if (store && id === store.uid) return myHandle(); const p = state.profiles.find(x => x.id === id); return p && p.handle ? p.handle : ""; };
function myHandle() { const p = store && state.profiles.find(x => x.id === store.uid), l = readJSON("dd-handle", null); const h = (p && p.handle) || (l && l.name) || ""; return HANDLE_OK.test(h) ? h : ""; }
const handleDaysLeft = () => { const l = readJSON("dd-handle", null); return l && l.at ? Math.max(0, Math.ceil((l.at + 30 * 86400000 - Date.now()) / 86400000)) : 0; };
function handleSuggestions() {
  const base = (getName() || "student").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "student", [, col] = clCodes(), yr = String(new Date().getFullYear()).slice(2), r = () => Math.floor(Math.random() * 90 + 10);
  return [...new Set([base + "_" + col.toLowerCase(), base + yr, base + "_" + r(), base + r() + "x", "the_" + base].map(x => x.slice(0, 15)).filter(x => HANDLE_OK.test(x) && !HANDLE_RESERVED.test(x)))].slice(0, 4);
}
function handleCard() {
  if (!store || !store.handleClaim) return null;
  const cur = myHandle(), say = el("p", { class: "hint", role: "status" }, ""), left = handleDaysLeft();
  const input = el("input", { type: "text", maxlength: "15", placeholder: "choose a name, e.g. vijay_rgu", "aria-label": "Choose your Loop ID name", autocomplete: "off", autocapitalize: "none", spellcheck: "false" }), claim = el("button", { class: "btn sm primary", type: "button", disabled: "" }, "Claim it");
  let status = "", timer = 0, tries = 0;
  const check = () => {
    const v = input.value.trim().toLowerCase().replace(/^@/, ""); input.value = v; claim.disabled = true; status = "";
    if (!v) { say.textContent = ""; return; }
    if (!HANDLE_OK.test(v)) { say.textContent = "Use 3 to 15 letters, numbers or underscore."; return; }
    if (HANDLE_RESERVED.test(v)) { say.textContent = "That name is reserved. Try another."; return; }
    say.textContent = "Checking…"; const mine = ++tries;
    store.handleCheck(v).then(u => { if (mine !== tries) return; if (u && u === store.uid) { say.textContent = "✅ This is already your name."; } else if (u) { say.textContent = "❌ Taken. Try one of the ideas below."; } else { say.textContent = "✅ @" + v + " is free."; claim.disabled = left > 0 && !!cur; status = "free"; claim.disabled = !(status === "free") || (left > 0 && !!cur); } }).catch(() => { if (mine === tries) say.textContent = "Could not check. Connect to the internet and try again."; });
  };
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(check, 350); });
  claim.onclick = async () => {
    const v = input.value.trim().toLowerCase(); claim.disabled = true; say.textContent = "Saving…";
    try { const at = await store.handleClaim(v, cur || ""); writeJSON("dd-handle", { name: v, at }); syncProfile().catch(() => {}); say.textContent = "✅ Done. Your Loop ID is @" + v + "."; state.profiles = state.profiles.map(x => store && x.id === store.uid ? { ...x, handle: v } : x); setTimeout(() => render(), 600); }
    catch (e) { say.textContent = (e && e.code === "permission-denied") ? "That name is taken, reserved, or you changed it in the last 30 days." : ((e && e.message) || "Could not save. Try again."); claim.disabled = false; }
  };
  const chips = el("div", { class: "rowbtns", role: "group", "aria-label": "Name ideas" }, ...handleSuggestions().map(n => el("button", { class: "btn sm", type: "button", onclick: () => { input.value = n; check(); } }, "@" + n)));
  return el("div", { class: "learn-card id-card" }, el("small", { class: "tag" }, "\u{1F3F7}️ YOUR LOOP ID NAME"),
    cur ? el("strong", { class: "id-code" }, "@" + cur) : el("strong", {}, "Pick a short name friends can remember"),
    cur ? el("small", { class: "hint" }, left > 0 ? "You can change it in " + left + " day" + (left === 1 ? "" : "s") + "." : "You can change it now.") : el("small", { class: "hint" }, "Optional. 3 to 15 letters, numbers or underscore. First come, first served."),
    cur && left > 0 ? null : el("div", { class: "ls-bar" }, input, claim), cur && left > 0 ? null : chips, say,
    el("div", { class: "rowbtns" }, el("button", { class: "linkbtn", type: "button", onclick: () => showPanel("forgotid") }, "Forgot my Loop ID?"), cur ? el("button", { class: "linkbtn", type: "button", onclick: async (e) => { if (!confirm("Release @" + cur + "? Anyone can take it, and you cannot pick a new name for 30 days.")) return; try { await store.handleRelease(cur); try { localStorage.removeItem("dd-handle"); } catch (_) {} const rec = state.profiles.find(x => x.id === store.uid); if (rec) delete rec.handle; render(); } catch (_) { say.textContent = "Could not release it."; } } }, "Release my name") : null));
}
function renderForgotId() {
  const found = el("div", { class: "ls-people", "aria-live": "polite" }), q = el("input", { type: "search", maxlength: "30", placeholder: "Type your nickname", "aria-label": "Your nickname", autocomplete: "off" });
  const draw = () => { const nd = q.value.trim().toLowerCase(); const rows = nd.length < 2 ? [] : state.profiles.filter(p => p.name && p.name.toLowerCase().includes(nd)).slice(0, 6); found.replaceChildren(...(nd.length < 2 ? [] : rows.length ? rows.map(p => el("div", { class: "learn-card ls-person" }, el("div", { class: "ls-who" }, el("strong", {}, p.name), el("small", { class: "hint id-mini" }, [p.handle ? "@" + p.handle : "", campusId(p.id)].filter(Boolean).join("  ·  ") || "No Loop ID yet")))) : [el("p", { class: "hint" }, "No one with that nickname. Check the spelling.")])); };
  q.addEventListener("input", draw);
  return [el("h2", {}, "\u{1F511} Forgot my Loop ID"), el("p", { class: "hint" }, "Your Loop ID belongs to your account, so it comes back with your account. Pick the case that fits you."),
    el("div", { class: "learn-card" }, el("strong", {}, "1. I am on my own phone"), el("p", { class: "hint" }, "Open Me. Your number ID and @name are shown there."), el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => showPanel("me") }, "Open Me"))),
    el("div", { class: "learn-card" }, el("strong", {}, "2. I only remember my nickname"), el("p", { class: "hint" }, "Search it here. Public Loop IDs of classmates are shown the same way."), q, found),
    el("div", { class: "learn-card" }, el("strong", {}, "3. New phone or cleared data"), el("p", { class: "hint" }, "Sign in with the email you verified. Your account, points and Loop ID come back. Without a verified email, a cleared browser cannot be recovered, so verify your email now."), el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => showPanel("me") }, "Verify my email"))),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => showPanel("me") }, "Back"))];
}
// ---------- Private answers and the AI answer check ----------
// Shrinks a photo so it fits inside a private answer (under about 340,000 characters).
function shrinkJpeg(url) {
  return new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      let w = Math.min(1000, img.naturalWidth), q = 0.62;
      for (let i = 0; i < 6; i++) {
        const c = document.createElement("canvas"), r = w / img.naturalWidth; c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        const out = c.toDataURL("image/jpeg", q); if (out.length <= 340000) return res(out); w = Math.round(w * 0.8); q = Math.max(0.4, q - 0.06);
      }
      rej(new Error("That photo is too big. Try a smaller one."));
    }; img.onerror = () => rej(new Error("Could not read the photo.")); img.src = url;
  });
}
const AI_VERDICT = { correct: ["✅", "Looks correct", "ok"], partly: ["\u{1F7E1}", "Partly correct", "mid"], wrong: ["❌", "Has a mistake", "bad"], unclear: ["❔", "Cannot tell", "mid"] };
const aiChecks = new Map();   // answer id -> result, kept only while the page is open
async function aiCheckAnswer(question, answer, img) {
  if (!PLUS.functionsUrl || !store || !store.idToken) throw new Error("The AI check is not switched on yet.");
  const tok = await store.idToken(); if (!tok) throw new Error("Connect to the internet and try again.");
  const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/askAI", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ mode: "check", question: String(question || "").slice(0, 1500), answer: String(answer || "").slice(0, 3000), img: img || "" }) });
  const d = await r.json().catch(() => ({})); if (!r.ok || !d.check) throw new Error(d.error || "The AI check is busy. Try again.");
  return { ...d.check, left: typeof d.left === "number" ? d.left : null };
}
// A button plus the result card. `get` returns { answer, img } when pressed.
function aiCheckBox(key, question, get) {
  const box = el("div", { class: "ai-check" });
  const draw = () => {
    const c = aiChecks.get(key);
    if (!c) { if (!PLUS.functionsUrl) { box.replaceChildren(); return; } box.replaceChildren(el("button", { class: "btn sm", type: "button", onclick: async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = "Checking…"; try { const { answer, img } = await get(); aiChecks.set(key, await aiCheckAnswer(question, answer, img)); } catch (er) { aiChecks.set(key, { error: (er && er.message) || "Could not check." }); } draw(); } }, "\u{1F916} Check with AI")); return; }
    if (c.error) { box.replaceChildren(el("p", { class: "hint", role: "status" }, c.error), el("button", { class: "linkbtn", type: "button", onclick: () => { aiChecks.delete(key); draw(); } }, "Try again")); return; }
    const [ic, label, cls] = AI_VERDICT[c.verdict] || AI_VERDICT.unclear;
    box.replaceChildren(el("div", { class: "ai-verdict " + cls }, el("strong", {}, ic + " AI second opinion: " + label), el("p", {}, c.summary),
      c.issues && c.issues.length ? el("ul", {}, ...c.issues.map(x => el("li", {}, x))) : null, c.corrected ? el("p", { class: "hint" }, el("b", {}, "Suggested correct answer: "), c.corrected) : null,
      el("small", { class: "hint" }, "AI can be wrong. Check with your book or teacher." + (c.left != null ? " " + c.left + " AI questions left today." : ""))));
  };
  draw(); return box;
}
// What the asker sees: private answers for this doubt, with a way to share one with everyone.
function privateAnswersFor(d) {
  const rows = state.privAns.filter(x => x.doubtId === d.id && x.toUid === (store && store.uid)).sort((a, b) => a.createdAt - b.createdAt);
  if (!rows.length) return null;
  return el("div", { class: "answers priv-box" }, el("div", { class: "label" }, "\u{1F512} Private answers (only you can see these)"),
    ...rows.map(r => el("div", { class: "ans priv" }, el("div", { class: "who" }, avatarEl(avatarFor(r.authorName || "")), el("strong", {}, r.anonymous ? "A classmate" : r.authorName), el("small", { class: "hint" }, ago(r.createdAt))),
      r.body ? el("p", { class: "body" }, r.body) : null, ...(Array.isArray(r.imgs) ? r.imgs.filter(u => typeof u === "string" && u.startsWith("data:image/jpeg;base64,")).map((u, i) => el("img", { class: "priv-img", src: u, alt: "Photo " + (i + 1) + " from the answer", loading: "lazy" })) : []),
      aiCheckBox("p" + r.id, d.title + (d.body ? ". " + d.body : ""), async () => ({ answer: r.body || "", img: Array.isArray(r.imgs) && r.imgs[0] && r.imgs[0].length <= 340000 ? r.imgs[0] : "" })),
      el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: async (e) => {
        if (!confirm("Share this answer with everyone on the board? Your classmates will see it with " + (r.anonymous ? "no name" : r.authorName) + ".")) return;
        e.currentTarget.disabled = true;
        try {
          const id = store.newId("replies"), pages = (Array.isArray(r.imgs) ? r.imgs : []).slice(0, 2), pageIds = pages.map(u => { const pid = store.newId("pages"); pageCache.set(pid, u); return pid; });
          const doc = { parentId: d.id, parentColl: "doubts", body: ("Answer from " + (r.anonymous ? "a classmate" : r.authorName) + ": " + (r.body || "(see the photo)")).slice(0, 5000), authorId: store.uid, authorName: getName(), anonymous: false, createdAt: Date.now(), pages: pageIds, fileAttachments: [] };
          doc.pages = await trySavePages(pages, id, pageIds); await store.set("replies", id, doc); showNotice("Shared with everyone.");
        } catch (er) { showNotice(errText(er)); }
      } }, "\u{1F4E2} Share with everyone")))));
}
// ---------- Helper of the week and push opt-in ----------
function helperOfWeek() {
  if (!store || !state.loaded) return null;
  const since = Date.now() - 7 * 86400000, byId = new Map(state.doubts.map(d => [d.id, d])), helpful = new Set(state.doubts.map(d => d.resolvedReplyId).filter(Boolean)), tally = new Map();
  for (const r of state.replies) {
    if (r.parentColl !== "doubts" || r.anonymous || r.deleted || !r.authorId || (r.createdAt || 0) < since) continue;
    const d = byId.get(r.parentId); if (!d || d.authorId === r.authorId) continue;
    const t = tally.get(r.authorId) || { id: r.authorId, name: "", n: 0, h: 0 }; t.n++; if (helpful.has(r.id)) t.h++; if (r.authorName && r.authorName !== ANON) t.name = r.authorName; tally.set(r.authorId, t);
  }
  const top = [...tally.values()].filter(t => t.name).sort((a, b) => (b.n + 3 * b.h) - (a.n + 3 * a.h) || a.id.localeCompare(b.id))[0];
  return top && top.n >= 2 ? top : null;
}
function helperCard() {
  const h = helperOfWeek(); if (!h) return null; const me = store && allMyIds().has(h.id);
  return el("div", { class: "learn-card hotw-card" }, el("small", { class: "tag" }, "\u{1F3C5} HELPER OF THE WEEK"), el("strong", {}, h.name + (me ? " (you)" : "") + markOf(h.id)),
    el("small", { class: "hint" }, plural(h.n, "answer") + " this week" + (h.h ? " · " + h.h + " marked helpful" : "")),
    el("p", { class: "hint" }, me ? "Thank you for helping your classmates. This is the best way to earn the Helper star for Loopy." : "Say thanks with a reaction on their answers. Answer a doubt to be next week's helper."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => showUnanswered() }, "\u{1F64B} Answer a doubt")));
}
// After someone asks a doubt, offer an alert for when it is answered.
function pushAskCard(d) {
  if (!store || !allMyIds().has(d.authorId) || repliesFor(d.id).length || readJSON("dd-push-asked", false) || !("Notification" in window) || Notification.permission === "denied" || readJSON("dd-push-on", false)) return null;
  const say = el("small", { class: "hint", role: "status" }, "");
  return el("div", { class: "learn-card push-ask" }, el("strong", {}, "\u{1F514} Get an alert when someone answers"), el("p", { class: "hint" }, PUSH.vapidKey ? "You will get a short alert even when the app is closed. It shows only a short title." : "You will get an alert while the app is open in the background."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: async (e) => { e.currentTarget.disabled = true; writeJSON("dd-push-asked", true); try { if (PUSH.vapidKey && store.enablePush) { await store.enablePush(PUSH.vapidKey); writeJSON("dd-push-on", true); } else { await Notification.requestPermission(); } say.textContent = "Done. We will let you know."; } catch (er) { say.textContent = (er && er.message) || "Could not turn on alerts."; } } }, "Turn on alerts"),
      el("button", { class: "btn sm", type: "button", onclick: (e) => { writeJSON("dd-push-asked", true); e.currentTarget.closest(".push-ask").remove(); } }, "Not now")), say);
}
// ---------- Pilot feedback, doubt of the day ----------
const FB_PAY = [["no", "No"], ["29", "₹29"], ["49", "₹49"], ["99", "₹99"], ["later", "Ask me later"]];
const fbDone = () => readJSON("dd-fb-" + weekKey(), false);
function renderFeedback() {
  const f = { rating: 0, pay: "later" }, say = el("p", { class: "hint", role: "status" }, "");
  const liked = el("textarea", { maxlength: "300", rows: "2", placeholder: "What do you like?", "aria-label": "What do you like" }), improve = el("textarea", { maxlength: "300", rows: "3", placeholder: "What should we fix or add?", "aria-label": "What should we improve" });
  const stars = el("div", { class: "rowbtns", role: "radiogroup", "aria-label": "Rating" }), pays = el("div", { class: "rowbtns", role: "radiogroup", "aria-label": "Would you pay" });
  const draw = () => {
    stars.replaceChildren(...[1, 2, 3, 4, 5].map(n => el("button", { class: "btn" + (f.rating === n ? " primary" : ""), type: "button", role: "radio", "aria-checked": String(f.rating === n), "aria-label": n + " out of 5", onclick: () => { f.rating = n; draw(); } }, n <= f.rating ? "★ " + n : "☆ " + n)));
    pays.replaceChildren(...FB_PAY.map(([v, t]) => el("button", { class: "btn sm" + (f.pay === v ? " primary" : ""), type: "button", role: "radio", "aria-checked": String(f.pay === v), onclick: () => { f.pay = v; draw(); } }, t)));
  };
  draw();
  if (fbDone()) return [el("h2", {}, "\u{1F4AC} Thank you!"), el("p", { class: "hint" }, "We have your feedback for this week. You can send another one next week."), el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back"))];
  return [
    el("h2", {}, "\u{1F4AC} Help us improve"),
    el("p", { class: "hint" }, "This takes 30 seconds. Your answers are private, are not shown with your name, and are read only by the team."),
    el("div", { class: "label" }, "How useful is " + BRAND + " for you?"), stars,
    el("div", { class: "label" }, "Would you pay each month for extra features?"), pays,
    el("div", { class: "label" }, "What do you like?"), liked,
    el("div", { class: "label" }, "What should we improve?"), improve,
    el("p", { class: "guide-safe" }, el("b", {}, "Stay safe: "), "Do not write phone numbers, passwords or other people's names here."),
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "button", onclick: async (e) => {
        if (!f.rating) { say.textContent = "Please pick a rating from 1 to 5."; return; }
        if (!store || !store.setTop || !store.authUid()) { say.textContent = "Connect to the internet and try again."; return; }
        e.currentTarget.disabled = true;
        try { await store.setTop("pilotFeedback", store.authUid() + "_" + weekKey(), { week: weekKey(), uid: store.authUid(), slug: battleSlug(), rating: f.rating, pay: f.pay, liked: liked.value.trim().slice(0, 300), improve: improve.value.trim().slice(0, 300), createdAt: Date.now() }); writeJSON("dd-fb-" + weekKey(), true); render(); }
        catch (_) { say.textContent = "Could not send. Check your connection and try again."; e.currentTarget.disabled = false; }
      } }, "Send feedback"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")), say,
  ];
}
// One unanswered doubt is featured each day. The pick is the same for everyone on a college board, so classmates gather on it.
function doubtOfDay() {
  if (!store) return null;
  const mine = allMyIds(), cutoff = Date.now() - 4 * 86400000;
  const pool = state.doubts.filter(d => !d.deleted && !mine.has(d.authorId) && (d.createdAt || 0) > cutoff && !d.resolvedReplyId && repliesFor(d.id).length === 0).sort((a, b) => (a.createdAt - b.createdAt) || (a.id < b.id ? -1 : 1));
  return pool.length ? pool[dayNum() % pool.length] : null;
}
function dodCard() {
  const d = doubtOfDay(); if (!d) return null;
  return el("div", { class: "learn-card dod-card" }, el("small", { class: "tag" }, "\u{1F31F} DOUBT OF THE DAY"), el("strong", {}, String(d.title || "").slice(0, 110)), el("small", { class: "hint" }, d.subject + " · waiting " + ago(d.createdAt) + ". Be the first to answer."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { state.tab = "doubts"; openItem(d.id); } }, "\u{1F64B} Answer it")));
}
// ---------- Notification centre, doubts waiting for you, reminders and Simple view ----------
const isSimple = () => readJSON("dd-simple", true) !== false;
const setSimple = (on) => { writeJSON("dd-simple", !!on); document.body.classList.toggle("simple", !!on); render(); };
// Doubts nobody has answered yet, in subjects this student has answered before (the quickest way to get a first answer).
function waitingDoubts() {
  if (!store) return [];
  const mine = allMyIds(), byId = new Map(state.doubts.map(d => [d.id, d])), subj = new Set();
  for (const r of state.replies) if (r.parentColl === "doubts" && mine.has(r.authorId)) { const d = byId.get(r.parentId); if (d && d.subject) subj.add(d.subject); }
  if (!subj.size) return [];
  const cutoff = Date.now() - 3 * 86400000;
  return state.doubts.filter(d => !d.deleted && !mine.has(d.authorId) && subj.has(d.subject) && (d.createdAt || 0) > cutoff && !d.resolvedReplyId && repliesFor(d.id).length === 0).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
}
function notifItems() {
  const items = []; if (!store || !state.loaded) return items;
  const mine = allMyIds(), seen = Number(readJSON("dd-notif-seen", 0)) || 0, week = Date.now() - 7 * 86400000;
  const myD = new Map(state.doubts.filter(d => mine.has(d.authorId) && !d.deleted).map(d => [d.id, d]));
  for (const r of state.replies) {
    const d = myD.get(r.parentId); if (!d || r.parentColl !== "doubts" || mine.has(r.authorId) || (r.createdAt || 0) < week) continue;
    items.push({ id: "a" + r.id, at: r.createdAt || 0, icon: "\u{1F4AC}", text: (r.anonymous ? "Someone" : r.authorName || "A classmate") + " answered your doubt: " + String(d.title || "").slice(0, 70), go: () => { state.tab = "doubts"; openItem(d.id); }, fresh: (r.createdAt || 0) > seen });
  }
  for (const d of waitingDoubts()) items.push({ id: "w" + d.id, at: d.createdAt || 0, icon: "\u{1F64B}", text: "Waiting for a first answer in " + d.subject + ": " + String(d.title || "").slice(0, 60), go: () => { state.tab = "doubts"; openItem(d.id); }, fresh: true, todo: true });
  const me = allStats().get(store.uid);
  if (me && me.streak > 0 && me.days && !me.days.has(dayNum()) && new Date().getHours() >= 17) items.push({ id: "streak" + dayNum(), at: Date.now(), icon: "\u{1F525}", text: "Your " + me.streak + "-day streak ends tonight. Answer one doubt or take the quiz to keep it.", go: () => showUnanswered(), fresh: true, todo: true });
  if (QUIZ.length && !myQuizAnswer(dayNum())) items.push({ id: "quiz" + dayNum(), at: Date.now() - 1, icon: "\u{1F9E0}", text: "Today's quiz is waiting. It takes one minute.", go: () => showPanel("quiz"), fresh: true, todo: true });
  { const hw = helperOfWeek(); if (hw && mine.has(hw.id)) items.push({ id: "hotw" + weekKey(), at: Date.now() - 4, icon: "\u{1F3C5}", text: "You are Helper of the week with " + plural(hw.n, "answer") + ". Thank you!", go: () => showPanel("wardrobe"), fresh: !readJSON("dd-hotw-" + weekKey(), false) }); }
  if (!curioStore().why[String(dayNum())]) items.push({ id: "cur" + dayNum(), at: Date.now() - 3, icon: "\u{1F50E}", text: "Today\u2019s Why question is waiting. Guess first, then see the answer.", go: () => showPanel("curious"), fresh: true, todo: true });
  if ((readJSON("dd-visits", { n: 1 }).n || 1) >= 3 && !fbDone()) items.push({ id: "fb" + weekKey(), at: Date.now() - 2, icon: "\u{1F4AC}", text: "Tell us how to improve " + BRAND + ". It takes 30 seconds.", go: () => showPanel("feedback"), fresh: true, todo: true });
  return items.sort((a, b) => b.at - a.at).slice(0, 25);
}
function renderBell() {
  let b = $("notifBtn");
  if (!b) { const host = $("themeBtn"); if (!host || !host.parentNode) return; b = el("button", { class: "chip", id: "notifBtn", type: "button", "aria-label": "Notifications", title: "Notifications", onclick: () => showPanel("notifs") }); host.parentNode.insertBefore(b, host); }
  const n = notifItems().filter(i => i.fresh).length;
  b.replaceChildren(el("span", { "aria-hidden": "true" }, "\u{1F514}"), n ? el("i", { class: "bell-n" }, n > 9 ? "9+" : String(n)) : null);
  b.setAttribute("aria-label", n ? n + " new notifications" : "Notifications");
}
// While the app is open in the background, new answers can also appear as a phone notification (only after the student allows it).
const notified = new Set(); let notifPrimed = false;
function notifPing() {
  if (!store || !state.loaded) return;
  const items = notifItems().filter(i => i.id[0] === "a" && i.fresh);
  if (!notifPrimed) { items.forEach(i => notified.add(i.id)); notifPrimed = true; return; }
  for (const i of items) {
    if (notified.has(i.id)) continue; notified.add(i.id);
    try { if (document.hidden && "Notification" in window && Notification.permission === "granted") navigator.serviceWorker.getRegistration().then(reg => reg && reg.showNotification(BRAND, { body: i.text.slice(0, 120), icon: "icon-192.png", tag: i.id })); } catch (_) {}
  }
}
function renderNotifs() {
  const items = notifItems(), perm = "Notification" in window ? Notification.permission : "unsupported", say = el("p", { class: "hint", role: "status" }, "");
  return [
    el("h2", {}, "\u{1F514} Notifications"),
    el("p", { class: "hint" }, "Answers to your doubts, doubts waiting for you, and reminders to keep your streak."),
    items.length ? el("div", { class: "learn" }, ...items.map(i => el("button", { class: "learn-card notif-row" + (i.fresh ? " fresh" : ""), type: "button", onclick: () => { writeJSON("dd-notif-seen", Date.now()); i.go(); } }, el("span", { class: "notif-ic", "aria-hidden": "true" }, i.icon), el("span", {}, i.text, el("small", { class: "hint" }, i.todo ? "To do" : ago(i.at)))))) : el("p", { class: "hint" }, "You are all caught up. Ask a doubt or answer one to see updates here."),
    el("div", { class: "rowbtns" },
      items.length ? el("button", { class: "btn sm", type: "button", onclick: () => { writeJSON("dd-notif-seen", Date.now()); render(); } }, "Mark all as read") : null,
      PUSH.vapidKey && store && store.enablePush && perm !== "denied" ? el("button", { class: "btn sm primary", type: "button", onclick: async (e) => { e.currentTarget.disabled = true; try { await store.enablePush(PUSH.vapidKey); writeJSON("dd-push-on", true); say.textContent = "Push alerts are on, even when the app is closed."; } catch (er) { say.textContent = (er && er.message) || "Could not turn on alerts."; } } }, readJSON("dd-push-on", false) ? "\u{1F514} Push alerts on" : "\u{1F514} Turn on push alerts") : null,
      !PUSH.vapidKey && perm === "default" ? el("button", { class: "btn sm primary", type: "button", onclick: async () => { try { const r = await Notification.requestPermission(); say.textContent = r === "granted" ? "Phone alerts are on while the app is open in the background." : "Alerts stay off. You can change this in your browser settings."; } catch (_) { say.textContent = "Your browser does not support alerts."; } } }, "\u{1F4F2} Turn on phone alerts") : null),
    perm === "denied" ? el("p", { class: "hint" }, "Alerts are blocked in your browser settings.") : null, say,
    el("p", { class: "hint" }, PUSH.vapidKey ? "Push alerts reach you even when the app is closed. They show only a short title." : "Phone alerts only work while the app is open in the background. Alerts when the app is fully closed need the push server to be switched on."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}
// Every screen opened from a tab or a button explains itself: what it is for, how to use it, how to stay safe and the next step. It can be closed (and brought back) without redrawing, so a half-written form is never lost.
const SAFE_COMMON = "Never share your password, OTP or bank details with anyone here. Staff will never ask for them.";
const MODE_GUIDE = {
  me: { icon: "\u{1F464}", purpose: "Your own page: points, streak, badges and the things you have posted.", steps: ["Check your streak and points at the top.", "Open your posts to edit or delete them.", "Collect badges by helping others."], safe: "Only your nickname and college are shown to others. Your email stays private.", next: ["❓ Ask a doubt", "ask"] },
  quiz: { icon: "\u{1F9E0}", purpose: "One question a day on your subjects and on current affairs.", steps: ["Read the question and tap an answer.", "See the right answer and the reason.", "Come back tomorrow to keep your streak."], safe: "Answers are checked on the server side of the app logic, so there is no way to buy or share points.", next: ["\u{1F3C6} See the board", "leaders"] },
  leaders: { icon: "\u{1F3C6}", purpose: "The college board: who helped the most this week.", steps: ["Switch between this week and all time.", "Tap a name to see what they helped with.", "Answer doubts to climb the board."], safe: "Only nicknames appear on the board.", next: ["\u{1F64B} Answer a doubt", "intro"] },
  curriculum: { icon: "\u{1F4D8}", purpose: "The subjects of your year and branch, as published by your college.", steps: ["Pick your year and branch.", "Tap a subject to see its code and credits.", "Use the subject to filter doubts."], safe: "Subject lists are for reference. Your college’s notice board is the final word.", next: ["❓ Ask about a subject", "ask"] },
  learn: { icon: "\u{1F4DA}", purpose: "Study material grouped by subject.", steps: ["Choose your subject.", "Open a topic and read it.", "Save what you need and test yourself in the quiz."], safe: "Open links only from the official sources shown inside the app.", next: ["\u{1F9E0} Take the quiz", "quiz"] },
  resources: { icon: "\u{1F5C2}", purpose: "Notes, previous papers and useful links collected for your branch.", steps: ["Pick your branch.", "Open a resource.", "Report a wrong or broken link with the Report button."], safe: "Do not download files from unknown links. Report them instead.", next: ["\u{1F4DD} Previous papers", "papers"] },
  career: { icon: "\u{1F9ED}", purpose: "Plan your career: skills, roadmaps and what to learn next.", steps: ["Choose a goal.", "Follow the roadmap one step a day.", "Tick off each step to see your progress."], safe: "Never pay anyone to promise a job.", next: ["\u{1F4C4} Build my resume", "resume"] },
  battle: { icon: "\u2694\uFE0F", purpose: "Weekly contests: your college against other colleges in quizzes, ideas and answers.", steps: ["Pick Quiz, Ideas or Answers at the top.", "Do the activity: take the daily quiz, share an idea or answer a doubt.", "Watch your college climb the board. It restarts every Monday."], safe: "Only students with a verified email can score, and each student has a weekly cap, so nobody can cheat the board.", next: ["\u{1F3C6} See the board", "leaders"] },
  plus: { icon: "✨", purpose: "Extra tools: mock tests, planner, goals and more.", steps: ["Pick a tool.", "Use it for a few minutes.", "Come back for a daily habit."], safe: SAFE_COMMON, next: ["\u{1F4DD} Try a mock test", "mock"] },
  mock: { icon: "⏱️", purpose: "A timed practice test to find your weak spots.", steps: ["Choose a subject and length.", "Answer within the timer.", "Review the mistakes afterward."], safe: "Practice results stay on your device and your account only.", next: ["\u{1F4C9} Review my mistakes", "mistakes"] },
  mistakes: { icon: "\u{1F4C9}", purpose: "Questions you got wrong, so you can fix them.", steps: ["Open a mistake.", "Read the correct answer and reason.", "Practise it again until it is right."], safe: SAFE_COMMON, next: ["\u{1F4DD} Another mock test", "mock"] },
  planner: { icon: "\u{1F5D3}", purpose: "A simple study plan for the week.", steps: ["Add a task and a time.", "Tick it off when done.", "Check the week at a glance."], safe: "Your plan is private to you.", next: ["\u{1F3AF} Set a goal", "goals"] },
  goals: { icon: "\u{1F3AF}", purpose: "Set a small goal and track it daily.", steps: ["Write one clear goal.", "Check it off each day.", "Celebrate your streak."], safe: "Your goals are private to you.", next: ["\u{1F5D3} Plan the week", "planner"] },
  papers: { icon: "\u{1F4DD}", purpose: "Previous year question papers to practise with.", steps: ["Pick a subject and year.", "Try the paper with a timer.", "Post a doubt on any question you cannot solve."], safe: "Use papers from official or trusted sources only.", next: ["❓ Ask about a question", "ask"] },
  notices: { icon: "\u{1F4E2}", purpose: "Official notices for your college in one place.", steps: ["Read the newest first.", "Open a notice for details.", "Report anything that looks fake."], safe: "Always confirm important notices on the official college website.", next: ["\u{1F4C5} See events", "events"] },
  explore: { icon: "\u{1F9ED}", purpose: "Discover what is happening across the app.", steps: ["Browse the cards.", "Open one that interests you.", "Come back for new things daily."], safe: SAFE_COMMON, next: ["❓ Ask a doubt", "ask"] },
  drives: { icon: "\u{1F3E2}", purpose: "Campus drives and company visits with dates and links.", steps: ["Check the date and eligibility.", "Open the official link to register.", "Prepare using the resume tool."], safe: "A real drive never asks you to pay. Report any post that does.", next: ["\u{1F4C4} Build my resume", "resume"] },
  events: { icon: "\u{1F4C5}", purpose: "Events, fests and workshops on your campus.", steps: ["Pick an event.", "Check the date and place.", "Invite a friend."], safe: "Meet in public places on campus.", next: ["\u{1F4E2} Notices", "notices"] },
  forgotid: { icon: "\u{1F511}", purpose: "Find your Loop ID again, or get it back on a new phone.", steps: ["Look on the Me page if you are on your own phone.", "Search your nickname if you only remember that.", "Verify your email so a new phone can bring your account back."], safe: "Your Loop ID is not a password. Nobody can sign in with it.", next: null },
  curious: { icon: "\u{1F50E}", purpose: "A few minutes of wonder every day: a fact, a Why guess, a mystery topic and the best question of the week.", steps: ["Read the fact and tap I learned this.", "Guess the Why before you see the answer.", "Unlock the mystery topic and search more on anything that excites you."], safe: SAFE_COMMON, next: ["\u2753 Ask a question", "ask"] },
  feedback: { icon: "\u{1F4AC}", purpose: "Tell the team what works and what to fix. It shapes the next version.", steps: ["Give a rating from 1 to 5.", "Say whether you would pay and how much.", "Write one thing you like and one thing to improve."], safe: "Do not write phone numbers or passwords. Feedback is private and not shown with your name.", next: null },
  notifs: { icon: "\u{1F514}", purpose: "Everything that needs you: answers to your doubts, doubts waiting for a first answer, and streak reminders.", steps: ["Tap a line to open it.", "Answer a waiting doubt to be the first helper.", "Turn on phone alerts if you want a ping while the app is in the background."], safe: "Alerts show only the title of a post. Nothing private is sent anywhere.", next: ["\u{1F64B} See open doubts", "intro"] },
  loopysearch: { icon: "\u{1F50E}", purpose: "Search any topic and see it: a quick answer, a picture, then videos, diagrams and PDFs.", steps: ["Type a topic or a unit name.", "Pick Quick idea, Deep lecture or Exam prep.", "Open a video, diagram or PDF, or ask Loopy to explain."], safe: "Results open other websites. Download only from trusted sites.", next: ["\u2753 Ask classmates", "ask"] },
  ai: { icon: "\u{1F916}", purpose: "Ask Loopy for study help.", steps: ["Type a clear question.", "Read the answer.", "Check important facts in your textbook."], safe: "Loopy can make mistakes. Do not type personal details into it.", next: ["❓ Ask classmates", "ask"] },
  resume: { icon: "\u{1F4C4}", purpose: "Build a one-page resume from what you have done.", steps: ["Fill in your details.", "Review the preview.", "Save or print it."], safe: "Your resume stays on your device. Share it only with companies you have verified.", next: ["\u{1F3E2} See drives", "drives"] },
  wboard: { icon: "\u{1F4CA}", purpose: "This week’s progress for you and your college.", steps: ["See your points.", "Compare with last week.", "Pick one thing to improve."], safe: "Only nicknames are shown.", next: ["\u{1F3AF} Set a goal", "goals"] },
  focusplus: { icon: "\u{1F9D8}", purpose: "A focus timer for study sessions.", steps: ["Set the minutes.", "Start and stay off your phone.", "Take a short break when it ends."], safe: SAFE_COMMON, next: ["\u{1F5D3} Plan the week", "planner"] },
  stickers: { icon: "\u{1F3F7}", purpose: "Stickers you can use in posts and replies.", steps: ["Open a pack.", "Tap a sticker to use it.", "Earn more by keeping your streak."], safe: SAFE_COMMON, next: ["\u{1F457} Dress Loopy", "wardrobe"] },
  wardrobe: { icon: "\u{1F457}", purpose: "Dress Loopy with what you have unlocked.", steps: ["Pick a costume.", "See it on Loopy.", "Unlock more with your daily streak."], safe: SAFE_COMMON, next: ["\u{1F3F7} Stickers", "stickers"] },
  fun: { icon: "\u{1F389}", purpose: "A break between studies: light games and trivia.", steps: ["Pick a game.", "Play for a few minutes.", "Return to study."], safe: SAFE_COMMON, next: ["\u{1F9E0} Daily quiz", "quiz"] },
  lab: { icon: "\u{1F9EA}", purpose: "Experiments and calculators for your subjects.", steps: ["Pick an experiment.", "Change the numbers.", "See what changes."], safe: SAFE_COMMON, next: ["❓ Ask a doubt", "ask"] },
  college: { icon: "\u{1F3EB}", purpose: "Facts about your college and who it is for.", steps: ["Read the verified facts.", "Check the source link.", "Report anything that is wrong."], safe: "This app is not affiliated with any college. Facts come from public websites.", next: ["\u{1F4E2} Notices", "notices"] },
  alumni: { icon: "\u{1F393}", purpose: "Seniors and alumni who can guide you.", steps: ["Browse profiles.", "Read how they can help.", "Ask politely and do not share private details."], safe: "Meet people in public places. Report anyone who asks for money.", next: ["\u{1F9ED} Career help", "career"] },
  network: { icon: "\u{1F310}", purpose: "See which campuses and colleges you can reach.", steps: ["Pick a campus or college.", "Send a doubt there.", "Read the answers when they arrive."], safe: "You can send to at most 3 colleges and 5 posts a day. This protects everyone from spam.", next: ["❓ Ask a doubt", "ask"] },
  name: { icon: "✏️", purpose: "Choose the name shown with your posts.", steps: ["Type a nickname.", "Avoid your phone number or address.", "Save."], safe: "Use a nickname. Real names are not required.", next: null },
  campus: { icon: "\u{1F4CD}", purpose: "Choose your campus so classmates find you.", steps: ["Pick your campus.", "Browse its posts.", "Send a post to other campuses too."], safe: "You can change it later.", next: null },
  ask: { icon: "✍️", purpose: "Write your post. Pick who should see it before you send.", steps: ["Choose a subject.", "Write clearly and add a photo if it helps.", "Choose who can see it, then post."], safe: "Do not post phone numbers, addresses, passwords or photos of other people.", next: null },
  view: { icon: "\u{1F4AC}", purpose: "Read the post and its answers.", steps: ["Read the question.", "Add an answer or a reaction.", "Report anything unsafe with the Report button."], safe: "Be kind. Reported posts are reviewed by the admin.", next: null },
};
function modeGuide(mode) {
  const g = MODE_GUIDE[mode]; if (!g) return null;
  const key = "dd-mg-" + mode, box = el("section", { class: "guide-card mode-guide", "aria-label": "How this works" });
  const draw = () => {
    const closed = readJSON(key, false);
    box.classList.toggle("mini", closed);
    if (closed) { box.replaceChildren(el("button", { class: "guide-reopen", type: "button", onclick: () => { writeJSON(key, false); draw(); } }, "ℹ️ How this works")); return; }
    const nx = g.next;
    box.replaceChildren(
      el("button", { class: "guide-x", type: "button", "aria-label": "Close this guide", onclick: () => { writeJSON(key, true); draw(); } }, "✕"),
      el("div", { class: "guide-head" }, el("span", { class: "guide-ic", "aria-hidden": "true" }, g.icon), el("div", {}, el("small", {}, "WHAT THIS IS FOR"), el("strong", {}, g.purpose))),
      el("ol", { class: "guide-steps" }, ...g.steps.map(t => el("li", {}, t))),
      g.safe ? el("p", { class: "guide-safe" }, el("b", {}, "Stay safe: "), g.safe) : null,
      nx ? el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { if (nx[1] === "ask") openAsk(); else if (nx[1] === "intro") showUnanswered(); else if (MODE_GUIDE[nx[1]] || ["intro"].includes(nx[1])) { state.mock = null; state.mist = null; showPanel(nx[1]); } } }, nx[0])) : null);
  };
  draw(); return box;
}
// Tapping a subject: the chip lights up at once, then only the feed is redrawn (not the whole screen).
let _pickTimer = 0;
function pickSubject(s, btn) {
  const t = TABS[state.tab];
  if (typeof s !== "string" || s.length > 60 || (!t.groups.includes(s) && !state[t.coll].some(d => d[t.field] === s))) return;   // only subjects that really exist
  const next = state.group === s ? "All" : s;
  state.group = next;
  try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {}
  document.querySelectorAll("#rail .subj-chip").forEach(c => c.classList.toggle("active", next !== "All" && c === btn));
  const list = $("list"); if (list) list.classList.add("filtering");
  cancelAnimationFrame(_pickTimer);
  _pickTimer = requestAnimationFrame(() => {
    _pickTimer = requestAnimationFrame(() => {
      try { renderList(); renderGuide(); renderHeader(); } catch (_) { render(); }
      if (list) list.classList.remove("filtering");
      if (innerWidth <= 1000 && next !== "All" && list) list.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
function renderRail() {
  const t = TABS[state.tab], rows = state[t.coll];
  const counts = {};
  for (const d of rows) counts[d[t.field]] = (counts[d[t.field]] || 0) + 1;
  const extra = Object.keys(counts).filter(s => !t.groups.includes(s));

  const deptTabs = (state.tab === "doubts" || state.tab === "gate") && Object.keys(DEPT_MAP).length ? el("div", { class: "dept-tabs" },
    ...Object.keys(DEPT_MAP).map(d => el("button", {
      type: "button", class: "dept-tab" + (state.dept === d ? " active" : ""),
      onclick: () => { state.dept = state.dept === d ? "All" : d; state.group = "All"; render(); },
    }, d))
  ) : null;

  const showSubjects = Object.keys(DEPT_MAP).length === 0 || !(state.tab === "doubts" || state.tab === "gate") || state.dept !== "All";
  const visibleSubjects = showSubjects
    ? ((state.tab === "doubts" || state.tab === "gate") && state.dept !== "All"
        ? [...DEPT_MAP[state.dept].filter(s => t.groups.includes(s)), ...extra]
        : [...t.groups, ...extra])
    : [];

  const subjGrid = visibleSubjects.length > 0 ? el("div", { class: "subj-grid" },
    ...visibleSubjects.map(s => el("button", {
      type: "button", class: "subj-chip" + (state.group === s ? " active" : ""), ...colorAttrs(s),
      onclick: (e) => pickSubject(s, e.currentTarget),
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
  if (state.campusFilter !== "all") rows = rows.filter(d => addressedTo(d, state.campusFilter));
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
      el("li", {}, "College-issued laptops cannot be sold (college policy).")));
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
  const waLink = waNum.length >= 10 ? "https://wa.me/91" + waNum.slice(-10) + "?text=" + encodeURIComponent("Hi! I'm interested in your listing on " + BRAND + ": " + d.title + " (₹" + (d.price || "Negotiable") + ")") : null;

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
  const waLink = waNum.length >= 10 ? "https://wa.me/91" + waNum.slice(-10) + "?text=" + encodeURIComponent("Hi! I saw your listing on " + BRAND + ": " + d.title) : null;

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
      if (navigator.share) navigator.share({ title: d.title, text: "Check this listing on " + BRAND + ": " + d.title + (d.price ? ", ₹" + d.price : ""), url });
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
    // College-issued laptops cannot be sold, college policy
    if (category === "Electronics" && /\blaptop\b|\bhp\s*laptop\b|\bdell\s*laptop\b|\bcollege\s*laptop\b/i.test(title + " " + body)) { err.textContent = "College-issued laptops cannot be sold on this platform (RGUKT policy). Remove this item."; err.hidden = false; return; }
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
    el("label", {}, "Your WhatsApp number (optional, buyers will contact you)",
      el("input", { name: "whatsapp", type: "tel", maxlength: "15", placeholder: "e.g. 9876543210, not shown publicly except to buyers" })
    ),
    el("p", { class: "hint" }, "⚠️ Your WhatsApp number is only shared with students who open this listing."),
    el("p", { class: "hint" }, "🚫 College-issued laptops cannot be sold, college policy. Books & Notes are visible to all campuses; other items are campus-local."),
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
    el("p", { class: "hint" }, "What next? ① Share yours  ② Like and reply to others  ③ Team up and build it together"));
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
    el("p", { class: "hint" }, "What next? ① Ask your doubt  ② Study the topic  ③ Come back and help others, answering earns you points 🏆"));
}

// ---------- campus hub: info, live activity, ranking and actions for the selected campus ----------
const CAMPUS_INFO = !IS_RGUKT ? {} : {
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
    actions: [["Career Guide", () => { careerBranch = null; showPanel("career"); }], ["🎯 GATE tab", () => goTab("gate")], ["🎓 Alumni", () => { alumniView = "dir"; showPanel("alumni"); }], ["🧪 Study Lab", () => showPanel("lab")]] },
  E4: { name: "Launch year", tag: "Finish strong and choose your next step.",
    goals: ["Finish your major project and write a clear report", "Placement prep: DSA, aptitude and mock interviews", "GATE: revise and take full mock tests (exam is usually in February)", "Study abroad: shortlist universities and apply (usually October to January)", "Update your resume, LinkedIn and GitHub", "Plan your next step with the Career Guide"],
    dates: ["Campus placements: usually in the final year", "GATE exam: usually in February", "Abroad applications: usually October to January"],
    actions: [["Career Guide", () => { careerBranch = null; showPanel("career"); }], ["🌍 Abroad Explorer", () => { careerBranch = "ABROAD"; showPanel("career"); }], ["🎯 GATE tab", () => goTab("gate")], ["🎓 Alumni", () => { alumniView = "dir"; showPanel("alumni"); }]] },
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
    el("div", { class: "campus-hub-head" }, el("strong", {}, "🎓 " + yl(y) + " · " + g.name), pillEl),
    el("p", { class: "hint" }, g.tag),
    el("p", { class: fresh ? "campus-live" : "hint" }, fresh ? "🟢 " + fresh + " new " + yl(y) + " post" + (fresh > 1 ? "s" : "") + " in the last 24 hours" : "⚪ No new " + yl(y) + " posts today. Ask one!"),
    el("div", { class: "intro-stats" }, tile(posts.length, "posts"), tile(students, "students"), tile(solved + "/" + doubts.length, "doubts solved")),
    el("div", { class: "lab-track small" }, fillEl),
    el("small", { class: "hint" }, "✅ Your " + yl(y) + " goals (tap to tick)"),
    ...g.goals.map((t, i) => el("label", { class: "check yr-goal" }, el("input", { type: "checkbox", checked: done.includes(i), onchange: (e) => { done = e.target.checked ? [...new Set([...done, i])] : done.filter(x => x !== i); saveDone(); const p = Math.round((done.length / g.goals.length) * 100); pillEl.textContent = p + "% of goals done"; fillEl.style.setProperty("width", p + "%"); } }), t)),
    el("small", { class: "hint" }, "📅 Key dates"),
    el("ul", { class: "yr-dates" }, ...g.dates.map(d => el("li", {}, d))),
    seniors.length ? el("div", {}, el("small", { class: "hint" }, "🧑‍🏫 Seniors helping " + yl(y)), ...seniors.map(t => el("div", { class: "tl-trow" }, el("span", {}, t.name + " (" + yl(t.year) + ")"), el("strong", {}, t.n + (t.n === 1 ? " reply" : " replies"))))) : null,
    el("small", { class: "hint" }, "Batch activity"),
    ...["E1", "E2", "E3", "E4"].map(b => el("div", { class: "rival-row" }, el("span", { class: "rival-rank" }, yl(b).replace("B.Tech ", "")), el("div", { class: "rival-bar-wrap" }, el("div", { class: "rival-bar", style: "width:" + Math.round(yearPostCount(b) * 100 / maxN) + "%;background:" + (b === y ? "var(--ta)" : "var(--line)") })), el("span", { class: "rival-score" }, yearPostCount(b) + " posts"))),
    el("div", { class: "rowbtns" }, g.actions.map(([label, fn]) => el("button", { class: "btn sm", type: "button", onclick: fn }, label)),
      el("button", { class: "btn sm primary", type: "button", onclick: openAsk }, "➕ Ask as " + yl(y)),
      el("button", { class: "btn sm", type: "button", onclick: () => { state.yearFilter = "All"; render(); } }, "✕ All years")));
}

const CAMPUS_COLLS = ["doubts", "ideas", "clubs", "gate", "challenges", "jobs", "market"];
// A post is shown under a campus filter when it is from that campus, sent to all campuses, or sent to that campus.
const addressedTo = (d, c) => d.campus === c || d.aud === "all" || (Array.isArray(d.to) && d.to.includes(c));
const campusSeenCount = (c) => CAMPUS_COLLS.reduce((n, k) => n + state[k].filter(x => !x.deleted && addressedTo(x, c)).length, 0);
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
  const q = encodeURIComponent(info.q || (COLLEGE + " " + c));
  const card = el("div", { class: "learn-card campus-hub" },
    el("div", { class: "campus-hub-head" },
      el("strong", {}, (CAMPUS_ICON[c] || "🏫") + " " + COLLEGE + " " + c),
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

const LIST_PAGE = 24; let _listLimit = LIST_PAGE, _listKey = "";
function renderList() {
  if (state.tab === "market") { renderMarketList(); return; }
  const t = TABS[state.tab], rows = visible(), all = state[t.coll];
  if (!rows.length && store && !state.dataReady && !state.loadTimeout) {
    $("list").replaceChildren(...Array.from({ length: 4 }, () => el("div", { class: "item sk-card", "aria-hidden": "true" }, el("div", { class: "skeleton sk-line sk-w40" }), el("div", { class: "skeleton sk-line sk-w90" }), el("div", { class: "skeleton sk-line sk-w70" }))));
    $("list").setAttribute("aria-busy", "true"); return;
  }
  $("list").removeAttribute("aria-busy");
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
  // Show the first cards at once and load the rest as the student scrolls: opening a busy subject feels instant.
  const lk = [state.tab, state.group, state.campusFilter, state.yearFilter, state.filter, state.query, state.gateYearPick].join("|");
  if (lk !== _listKey) { _listKey = lk; _listLimit = LIST_PAGE; }
  const shown = rows.slice(0, _listLimit);
  $("list").replaceChildren(...[deptBanner(), campusHub(), yearHub(), subjectHub(rows.length), spotCard].filter(Boolean), ...shown.map(d => {
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
    if (d.year) meta.push(el("span", { class: "pill year-pill" }, yl(d.year)));
    if (d.campus && CAMPUSES.length > 0) meta.push(el("span", { class: "campus-badge", style: "--cc:" + campusColor(d.campus) }, d.campus));
    if (d.via) meta.push(el("span", { class: "pill via-pill", title: "Asked by a student of " + d.via }, "\u{1F30D} From " + d.via));
    else if (d.aud === "all" && CAMPUSES.length > 0) meta.push(el("span", { class: "pill open", title: "Visible to every campus" }, "\u{1F310} All campuses"));
    else if (d.aud === "pick" && Array.isArray(d.to) && d.to.length) meta.push(el("span", { class: "pill via-pill", title: "Sent to " + d.to.join(", ") }, "\u{1F3AF} To " + d.to.map(campusLabel).join(", ")));
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
  if (rows.length > _listLimit) {
    const left = rows.length - _listLimit, more = el("button", { type: "button", class: "more-btn" }, "Show " + Math.min(LIST_PAGE, left) + " more (" + left + " left)");
    const load = () => { const y = window.scrollY; _listLimit += LIST_PAGE; renderList(); window.scrollTo(0, y); };
    more.onclick = load; $("list").append(more);
    if ("IntersectionObserver" in window) { const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: "700px" }); io.observe(more); }
  }
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
  const q = quizFor(day);
  if (q) battleRecord(q.a === opt);
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
    out.push(el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => shareResult({ kicker: "DAILY QUIZ", emoji: mine.opt === q.a ? "✅" : "💪", big: mine.opt === q.a ? "Got it right!" : "Learning every day", line: q.s + " · " + (state.myStreak || 0) + "-day streak 🔥 Can you beat me?" }) }, "📸 Share my result")));
    out.push(el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: async (e) => {
      const b = e.currentTarget; b.disabled = true;
      const ok = await shareToStory({ kind: "quiz", text: String(q.q).slice(0, 200), opts: q.o.map(o => String(o).slice(0, 60)), ans: q.a, expl: String(q.e || "").slice(0, 200) || undefined });
      b.disabled = false; b.textContent = ok ? "✅ Shared to your story" : "📣 Share this quiz to my story";
    } }, "📣 Share this quiz to my story")));
    out.push(el("p", { class: "hint" }, total + (total === 1 ? " classmate has" : " classmates have") + " answered today. " + (total ? Math.round(correctCount * 100 / total) + "% got it right." : "")));
  } else out.push(el("p", { class: "hint" }, "Pick one answer, one try only. Each student gets a different question today. Correct answer earns +3 points."));
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
  for (const d of state.doubts) { active(d.authorId, d.createdAt); if (d.anonymous) continue; const p = get(d.authorId, d.authorName, d.createdAt); p.asked++; p.points += 1; let vv = 0; for (const l of likesFor(d.id)) if (l.uid !== d.authorId && vv < 10) { vv++; p.likes++; p.points += 1; } }
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
  // Loop Starter: first post ever on the board (oldest authorId)
  const allSorted = [...allUserPosts].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (allSorted[0] && allSorted[0].authorId) { const p = people.get(allSorted[0].authorId); if (p) p.firstPost = 1; }

  for (const a of state.storyAnswers) active(a.uid, a.createdAt);
  for (const st of state.stories) active(st.authorId, st.createdAt);
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
  ["⚡", "Loop Starter",   "First to post in any subject",    p => p.firstPost > 0],
  ["🎖",  "Veteran",        "Active for 7+ days total",        p => p.days && p.days.size >= 7],
];
const TITLES = [[50, "Legend"], [25, "Mentor"], [10, "Helper"], [0, "Rising star"]];
const titleOf = (pts) => TITLES.find(([min]) => pts >= min)[1];

function renderNetwork() {
  const allPosts = [...state.doubts, ...state.ideas, ...state.clubs, ...state.gate, ...state.challenges];
  const totalPosts = allPosts.length;
  const totalMembers = new Set(allPosts.filter(p => !p.anonymous).map(p => p.authorId)).size;
  return [
    el("h2", {}, "🌐 " + BRAND + " Network"),
    el("p", { class: "hint" }, totalMembers + " students · " + totalPosts + " posts"),
    el("div", { class: "label" }, "What you can do"),
    el("ul", { class: "network-features" },
      el("li", {}, "📚 Ask doubts that any " + COLLEGE + " student can answer"),
      el("li", {}, "💡 Share ideas for projects and research"),
      el("li", {}, "🏛 Join clubs and find teammates"),
      el("li", {}, "🏆 Compete on the college leaderboard"),
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

// Quiz stories feed a weekly board (answers are kept for 7 days, so these do not change permanent levels).
function weeklyQuiz() {
  const cut = Date.now() - 7 * 86400000, perDay = new Map(), who = new Map(), camp = new Map();
  for (const a of state.storyAnswers) {
    if (!a.uid || a.uid === a.to || a.createdAt < cut) continue;
    let counted = false;
    if (a.ok) { const k = a.uid + "~" + dayNum(a.createdAt), n = perDay.get(k) || 0; if (n < 10) { perDay.set(k, n + 1); counted = true; } }
    const w = who.get(a.uid) || { uid: a.uid, name: a.name || "Student", correct: 0, total: 0 }; w.total++; if (counted) w.correct++; who.set(a.uid, w);
    if (a.campus) { const c = camp.get(a.campus) || { campus: a.campus, players: new Set(), correct: 0, total: 0 }; c.players.add(a.uid); c.total++; if (counted) c.correct++; camp.set(a.campus, c); }
  }
  return { stars: [...who.values()].filter(w => w.correct > 0).sort((a, b) => b.correct - a.correct).slice(0, 5), campuses: [...camp.values()].map(c => ({ ...c, players: c.players.size, avg: c.correct / c.players.size })).sort((a, b) => b.avg - a.avg) };
}
function weeklyQuizBlock() {
  const w = weeklyQuiz(), meId = store && store.uid, maxAvg = Math.max(...w.campuses.map(c => c.avg), 1);
  return [
    el("div", { class: "label" }, "🧠 Quiz stars this week"),
    w.stars.length ? el("ol", { class: "board" }, w.stars.map((p, i) => el("li", { class: p.uid === meId ? "me" : null }, el("span", { class: "rank" }, ["🥇", "🥈", "🥉"][i] || String(i + 1)), el("span", { class: "who" }, el("strong", {}, p.name + (p.uid === meId ? " (you)" : "")), el("small", {}, p.correct + " correct of " + p.total + " answered")), el("span", { class: "pts" }, p.correct)))) : el("p", { class: "hint" }, "Answer quiz stories to become a quiz star. Each correct answer counts (up to 10 a day)."),
    el("div", { class: "label" }, "⚔️ Campus quiz battle (this week)"),
    w.campuses.length ? el("div", { class: "rival-board" }, ...w.campuses.map(c => el("div", { class: "rival-row" },
      el("span", { class: "rival-rank" }, CAMPUS_ICON[c.campus] || "🏫"), el("span", { class: "rival-name", style: "color:" + campusColor(c.campus) }, c.campus),
      el("div", { class: "rival-bar-wrap" }, el("div", { class: "rival-bar", style: "width:" + Math.round(c.avg * 100 / maxAvg) + "%;background:" + campusColor(c.campus) })),
      el("span", { class: "rival-score" }, c.avg.toFixed(1)), el("span", { class: "rival-sub" }, c.correct + " correct · " + c.players + (c.players === 1 ? " player" : " players"))))) : el("p", { class: "hint" }, "No campus has answered yet. Pick your campus in Filters, then answer a quiz story."),
    el("p", { class: "hint" }, "Score = correct answers per player, so small campuses compete fairly."),
  ];
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
            el("strong", {}, (p.id === meId ? p.name + " (you)" : p.name) + markOf(p.id) + " " + BADGES.filter(b => b[3](p)).map(b => b[0]).join(""))),
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
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => showPanel("battle") }, "⚔️ College vs College scoreboard")),
    rivalBoard && el("div", { class: "label" }, "🏫 Campus Rivalry, all " + CAMPUSES.length + " campuses"),
    rivalBoard,
    ...weeklyQuizBlock(),
    rivalBoard && el("p", { class: "hint" }, "Campus points, ask a doubt +1 · share an idea +2 · helpful answer +5 · post in clubs +1. Compete with other campuses."),
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

// ---------- streaks, share cards and the college battle ----------
const STREAK_TIERS = [[3, "Spark", "🥉", "the bronze frame"], [7, "Week Warrior", "🥈", "the silver frame"], [14, "Fortnight Fighter", "🥇", "the gold frame"], [30, "Monthly Master", "💎", "the diamond frame"], [60, "Unstoppable", "🌈", "the rainbow frame"], [100, "Century Club", "👑", "the legend frame"]];
const frameTier = (n) => STREAK_TIERS.filter(t => n >= t[0]).length;
function bestStreak(days) {
  let best = 0, run = 0, prev = null;
  for (const d of [...days].sort((a, b) => a - b)) { run = prev !== null && d === prev + 1 ? run + 1 : 1; prev = d; if (run > best) best = run; }
  return best;
}
const frameOf = (id) => { const n = store && allMyIds().has(id) ? (state.myStreak || 0) : ((state.profiles.find(x => x.id === id) || {}).streak || 0); const t = frameTier(n); return t ? " fr-t" + t : ""; };
function streakTick(me) {
  const n = me ? me.streak : 0, chip = $("streakChip");
  state.myStreak = n; state.myBest = me ? bestStreak(me.days) : 0; state.myDays = me ? me.days : new Set();
  if (chip) {
    chip.hidden = !n; chip.textContent = "🔥 " + n;
    chip.classList.toggle("risk", n >= 1 && !state.myDays.has(dayNum()));
    chip.title = chip.classList.contains("risk") ? "Do a quiz or answer a doubt today to keep your streak" : n + "-day streak";
  }
  let last = 0; try { last = Number(localStorage.getItem("dd-streak-ms") || 0); } catch (_) {}
  const reached = STREAK_TIERS.filter(t => n >= t[0]).pop();
  if (reached && reached[0] > last) {
    try { localStorage.setItem("dd-streak-ms", String(reached[0])); } catch (_) {}
    showNotice("🔥 " + reached[0] + "-day streak! You unlocked " + reached[3] + " (" + reached[1] + "). Open Profile to share it."); setTimeout(() => showNotice(""), 9000);
  } else if (n < last) { try { localStorage.setItem("dd-streak-ms", String((STREAK_TIERS.filter(t => n >= t[0]).pop() || [0])[0])); } catch (_) {} }
  try { const key = n + "|" + dayNum(); if (store && n && localStorage.getItem("dd-streak-sync") !== key) { localStorage.setItem("dd-streak-sync", key); syncProfile().catch(() => {}); } } catch (_) {}
}
function streakCard() {
  const n = state.myStreak || 0, days = state.myDays || new Set(), today = dayNum(), next = STREAK_TIERS.find(t => t[0] > n), tier = STREAK_TIERS.filter(t => n >= t[0]).pop();
  const dots = Array.from({ length: 7 }, (_, i) => { const d = today - 6 + i; return el("span", { class: "sk-dot" + (days.has(d) ? " on" : "") + (d === today ? " today" : ""), title: i === 6 ? "Today" : "" }, days.has(d) ? "🔥" : ""); });
  const prev = tier ? tier[0] : 0, pct = next ? Math.round((n - prev) * 100 / (next[0] - prev)) : 100;
  const bar = el("div", { class: "lab-track" }, el("span", { class: "lab-fill" })); bar.firstChild.style.setProperty("width", pct + "%");
  return el("div", { class: "learn-card" }, el("strong", {}, "🔥 " + n + "-day streak" + (state.myBest > n ? " · best " + state.myBest : "")),
    el("div", { class: "sk-dots" }, dots),
    n >= 1 && !days.has(today) ? el("p", { class: "hint" }, "Your streak is at risk. Take today's quiz, answer a doubt or post to keep it alive.") : el("p", { class: "hint" }, n ? "Great! Come back tomorrow to keep it going." : "Take today's quiz or answer a doubt to start a streak."),
    next ? el("div", {}, bar, el("small", { class: "hint" }, (next[0] - n) + " more day" + (next[0] - n === 1 ? "" : "s") + " to unlock " + next[3] + " (" + next[1] + ")")) : el("small", { class: "hint" }, "You unlocked every frame. Legend!"),
    el("div", { class: "rowbtns" },
      !days.has(today) ? el("button", { class: "btn sm primary", type: "button", onclick: () => showPanel("quiz") }, "🧠 Today's quiz") : null,
      n >= 1 ? el("button", { class: "btn sm", type: "button", onclick: () => shareResult({ kicker: "MY STREAK", emoji: "🔥", big: n + (n === 1 ? " day" : " days"), line: tier ? tier[2] + " " + tier[1] + " · " + (state.myBest || n) + " best" : "Learning every day" }) }, "📸 Share my streak") : null));
}
// A picture card to post on WhatsApp or Instagram stories. Drawn on a canvas, nothing is uploaded.
function wrapLines(g, text, maxW) {
  const out = []; let line = "";
  for (const w of String(text).split(/\s+/)) { const t = line ? line + " " + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out.slice(0, 3);
}
async function shareResult({ kicker, emoji, big, line }) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  const [a, b] = BRAND_COLORS || (IS_RGUKT ? STATE_COLORS["Andhra Pradesh"] : ["#6d28d9", "#db2777"]);
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, a); bg.addColorStop(0.55, "#6d28d9"); bg.addColorStop(1, b); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(W - 60, 180, 320, 0, 7); g.fill(); g.beginPath(); g.arc(120, H - 120, 380, 0, 7); g.fill();
  g.strokeStyle = "#fff"; g.lineWidth = 26; g.lineCap = "round"; g.beginPath(); g.arc(150, 150, 58, 0.75, 5.53); g.stroke();   // the C of the logo
  g.fillStyle = "#fde047"; g.beginPath(); g.moveTo(228, 120); g.lineTo(238, 146); g.lineTo(264, 150); g.lineTo(238, 156); g.lineTo(228, 182); g.lineTo(218, 156); g.lineTo(192, 150); g.lineTo(218, 146); g.closePath(); g.fill();
  g.fillStyle = "#fff"; g.textAlign = "left"; g.font = "800 58px system-ui, sans-serif"; g.fillText(BRAND, 300, 168);
  g.textAlign = "center"; g.font = "700 46px system-ui, sans-serif"; g.fillStyle = "rgba(255,255,255,.85)"; g.fillText(kicker, W / 2, 440);
  g.font = "190px system-ui, 'Apple Color Emoji', 'Noto Color Emoji', sans-serif"; g.fillStyle = "#fff"; g.fillText(emoji, W / 2, 680);
  let size = 190; g.font = "900 " + size + "px system-ui, sans-serif"; while (g.measureText(big).width > 900 && size > 70) { size -= 10; g.font = "900 " + size + "px system-ui, sans-serif"; }
  g.fillText(big, W / 2, 900);
  g.font = "600 54px system-ui, sans-serif"; g.fillStyle = "rgba(255,255,255,.92)"; wrapLines(g, line, 900).forEach((t, i) => g.fillText(t, W / 2, 1000 + i * 68));
  g.font = "800 52px system-ui, sans-serif"; g.fillStyle = "#fff"; g.fillText(COLLEGE, W / 2, 1230);
  g.font = "500 38px system-ui, sans-serif"; g.fillStyle = "rgba(255,255,255,.85)"; g.fillText("Join me: " + location.host + location.pathname.replace(/index\.html$/, "").replace(/\/$/, ""), W / 2, 1290);
  const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.92)), file = new File([blob], "campusloop.jpg", { type: "image/jpeg" });
  const text = kicker.toLowerCase() + ": " + big + ". Join " + COLLEGE + " on " + BRAND + " " + (NO_COLLEGE ? location.origin + location.pathname : inviteLink());
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  const u = URL.createObjectURL(blob), aEl = document.createElement("a"); aEl.href = u; aEl.download = "campusloop.jpg"; document.body.append(aEl); aEl.click(); aEl.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000);
  showNotice("Picture saved. Post it in your story or class group."); setTimeout(() => showNotice(""), 4000);
}
// College vs College: each right answer to the daily quiz or a quiz story scores for your college.
const weekKey = () => "w" + Math.floor((dayNum() + 3) / 7);
const battleSlug = () => NO_COLLEGE ? "" : (TENANT ? TENANT.slug : "rgukt");
async function battleRecord(ok) {
  const slug = battleSlug(); if (!slug || !store || !store.battleHit) return;
  let rec = { d: 0, n: 0 }; try { rec = JSON.parse(localStorage.getItem("dd-battle-day") || "{}"); } catch (_) {}
  if (rec.d !== dayNum()) rec = { d: dayNum(), n: 0 };
  if (ok && rec.n >= 10) ok = false;          // at most 10 scoring answers a day for one student
  try { if (await store.battleHit(weekKey(), slug, !!ok) && ok) { rec.n++; localStorage.setItem("dd-battle-day", JSON.stringify(rec)); } } catch (_) {}
}
function collegeInfo(slug) {
  if (slug === "rgukt") return { name: "RGUKT AP", state: "Andhra Pradesh" };
  const d = DIRECTORY.find(c => c.slug === slug); if (d) return { name: d.name, state: d.state || "Andhra Pradesh" };
  return { name: slug.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase()), state: "" };
}
function battleCard() {
  if (NO_COLLEGE) return null;
  return el("div", { class: "learn-card" }, el("strong", {}, "⚔️ College vs College"),
    el("p", { class: "hint" }, "Every right quiz answer scores for " + COLLEGE + ". See how your college ranks against others this week."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => showPanel("battle") }, "Open the scoreboard")));
}
// Weekly Showdown: ideas and answers per college. Only students with a verified e-mail can score, and the rules cap one student per week.
const SD_KINDS = { quiz: ["\u{1F9E0}", "Quiz"], idea: ["\u{1F4A1}", "Ideas"], answer: ["\u{1F64B}", "Answers"] };
const SD_PROMPTS = ["Explain a hard concept from your subject with a real-life example.", "Share a low-cost project idea that solves a problem on your campus.", "Suggest a way to use AI to help students study better.", "Design a tool that helps first-year students settle in.", "Share a sustainability idea for your college.", "Turn something you learned this semester into a mini project idea."];
function showdownScore(kind) {
  try {
    const slug = battleSlug(); if (!slug || !store || !store.showdownHit || !myVerified()) return;
    const key = "dd-sd-" + weekKey() + kind, n = readJSON(key, 0), cap = kind === "idea" ? 5 : 20; if (n >= cap) return;
    store.showdownHit(weekKey(), slug, kind).then(ok => { if (ok) writeJSON(key, n + 1); }).catch(() => {});
  } catch (_) {}
}
function renderShowdown(kind) {
  const mine = battleSlug(), daysLeft = 7 - ((dayNum() + 3) % 7), [icon, label] = SD_KINDS[kind];
  const list = el("div", { class: "college-list" }, el("p", { class: "hint" }, "Loading the scoreboard…"));
  const verified = myVerified(), prompt = SD_PROMPTS[Math.floor((dayNum() + 3) / 7) % SD_PROMPTS.length];
  const load = () => {
    list.replaceChildren(el("p", { class: "hint" }, "Loading the scoreboard…"));
    (store && store.showdownBoard ? store.showdownBoard(weekKey(), kind) : Promise.reject(new Error("offline"))).then(rows => {
      const data = rows.filter(r => Number.isInteger(r.n) && Number.isInteger(r.players) && r.players > 0).map(r => ({ ...r, ...collegeInfo(r.slug), avg: r.n / r.players }));
      const ranked = data.filter(r => r.players >= 3).sort((a, b) => b.avg - a.avg || b.n - a.n), warm = data.filter(r => r.players < 3).sort((a, b) => b.n - a.n);
      const row = (r, i, isRank) => el("div", { class: "campus-link col-row" + (r.slug === mine ? " sel" : "") }, el("span", { class: "col-badge", "aria-hidden": "true" }, isRank ? (["\u{1F947}", "\u{1F948}", "\u{1F949}"][i] || String(i + 1)) : "·"), el("span", { class: "col-text" }, el("strong", {}, r.name || r.slug), el("small", {}, r.n + " " + label.toLowerCase() + " · " + plural(r.players, "student") + " · " + r.avg.toFixed(1) + " each")));
      list.replaceChildren(...(data.length ? [...ranked.slice(0, 20).map((r, i) => row(r, i, true)), ...(warm.length ? [el("small", { class: "hint" }, "Warming up (fewer than 3 students)")] : []), ...warm.slice(0, 10).map((r, i) => row(r, i, false))] : [el("p", { class: "hint" }, "No " + label.toLowerCase() + " on the board yet. Be the first for " + COLLEGE + ".")]));
    }).catch(() => list.replaceChildren(el("p", { class: "hint" }, "Could not load the scoreboard. Check your connection and try again.")));
  };
  load();
  return [
    el("h3", {}, icon + " " + label + " showdown"),
    el("p", { class: "hint" }, "This week: " + daysLeft + (daysLeft === 1 ? " day" : " days") + " left. " + (kind === "idea" ? "Each idea you share scores 1 for your college (up to 5 a week per student)." : "Each answer you give to a classmate's doubt scores 1 for your college (up to 20 a week per student).") + " Score = per student, so small colleges compete fairly. A college needs 3 students to be ranked."),
    kind === "idea" ? el("div", { class: "learn-card" }, el("small", { class: "tag" }, "THIS WEEK'S INNOVATION PROMPT"), el("strong", {}, prompt), el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { state.tab = "ideas"; state.mode = "ask"; render(); } }, "\u{1F4A1} Share my idea"))) : el("div", { class: "learn-card" }, el("small", { class: "tag" }, "HOW TO SCORE"), el("strong", {}, "Answer a classmate's doubt"), el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => showUnanswered() }, "\u{1F64B} See open doubts"))),
    verified ? null : el("p", { class: "guide-safe" }, el("b", {}, "Verify your email to score: "), "Only students with a verified email can add points. This stops fake accounts from cheating. Open Profile to verify."),
    list, el("button", { class: "btn sm", type: "button", onclick: load }, "↻ Refresh"),
  ];
}
function renderBattle() {
  const mine = battleSlug(), daysLeft = 7 - ((dayNum() + 3) % 7);
  const list = el("div", { class: "college-list" }, el("p", { class: "hint" }, "Loading the scoreboard…")), top = el("div", {});
  const draw = (rows) => {
    const data = rows.map(r => ({ ...r, ...collegeInfo(r.slug), avg: r.players ? r.correct / r.players : 0 }));
    const ranked = data.filter(r => r.players >= 3).sort((a, b) => b.avg - a.avg || b.correct - a.correct), warm = data.filter(r => r.players < 3).sort((a, b) => b.correct - a.correct);
    const rank = ranked.findIndex(r => r.slug === mine) + 1, me = data.find(r => r.slug === mine);
    top.replaceChildren(el("div", { class: "learn-card" },
      rank ? el("div", {}, el("strong", {}, "🏅 " + COLLEGE + " is #" + rank + " of " + ranked.length + " this week"), el("p", { class: "hint" }, me.avg.toFixed(1) + " right answers per player · " + me.correct + " right · " + me.players + " players"))
        : me ? el("div", {}, el("strong", {}, COLLEGE + " needs 3 players to be ranked"), el("p", { class: "hint" }, me.players + " so far. Invite classmates!"))
        : el("div", {}, el("strong", {}, "No answers from " + COLLEGE + " yet"), el("p", { class: "hint" }, "Answer today's quiz to put your college on the board.")),
      el("div", { class: "rowbtns" }, rank ? el("button", { class: "btn sm primary", type: "button", onclick: () => shareResult({ kicker: "COLLEGE BATTLE · THIS WEEK", emoji: "⚔️", big: "#" + rank, line: COLLEGE + " · " + me.avg.toFixed(1) + " per player. Help us climb!" }) }, "📸 Share our rank") : null,
        el("button", { class: "btn sm", type: "button", onclick: async () => { collegeRows = null; battleRows = null; renderBattleInto(); } }, "↻ Refresh"))));
    const row = (r, i, isRank) => {
      const [ca, cb] = collegeColors(r.slug, r.state); const badge = el("span", { class: "col-badge", "aria-hidden": "true" }, isRank ? String(i + 1) : "·"); badge.style.setProperty("background", "linear-gradient(135deg," + ca + "," + cb + ")");
      const b = el("div", { class: "campus-link col-row" + (r.slug === mine ? " sel" : "") }, badge, el("span", { class: "col-text" }, el("strong", {}, (["🥇", "🥈", "🥉"][i] && isRank ? ["🥇", "🥈", "🥉"][i] + " " : "") + r.name + (r.slug === mine ? " (you)" : "")), el("small", {}, (isRank ? r.avg.toFixed(1) + " per player · " : "") + r.correct + " right · " + r.players + (r.players === 1 ? " player" : " players") + (r.state ? " · " + r.state : ""))));
      b.style.setProperty("--row", ca); return b;
    };
    list.replaceChildren(...(data.length ? [...ranked.slice(0, 20).map((r, i) => row(r, i, true)), ...(warm.length ? [el("small", { class: "hint" }, "Warming up (fewer than 3 players)")] : []), ...warm.slice(0, 10).map((r, i) => row(r, i, false))] : [el("p", { class: "hint" }, "No scores yet this week. Be the first: answer today's quiz!")]));
  };
  const renderBattleInto = () => { list.replaceChildren(el("p", { class: "hint" }, "Loading the scoreboard…")); loadBattle().then(draw).catch(() => list.replaceChildren(el("p", { class: "hint" }, "Could not load the scoreboard. Check your internet and try again."))); };
  renderBattleInto();
  const bs = state.bsTab || "quiz";
  const bseg = el("div", { class: "ls-seg bs-seg", role: "tablist", style: "grid-template-columns:repeat(3,1fr)" }, ...Object.entries(SD_KINDS).map(([k, [ic, lb]]) => el("button", { type: "button", role: "tab", "aria-selected": String(bs === k), class: bs === k ? "on" : "", onclick: () => { state.bsTab = k; render(); } }, ic + " " + lb)));
  if (bs !== "quiz") return [el("h2", {}, "\u2694\uFE0F College vs College"), bseg, ...renderShowdown(bs), el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back"))];
  return [
    el("h2", {}, "⚔️ College vs College"), bseg,
    el("p", { class: "hint" }, "This week: " + daysLeft + (daysLeft === 1 ? " day" : " days") + " left. Every right answer to the daily quiz or a quiz story scores for your college (up to 10 a day per student)."),
    top, list,
    el("p", { class: "hint" }, "Score = right answers per player, so small colleges compete fairly. A college needs 3 players to be ranked. The board restarts every Monday."),
    inviteCard(),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ].filter(Boolean);
}
let battleRows = null;
async function loadBattle() {
  if (battleRows) return battleRows;
  if (!store || !store.battleBoard) throw new Error("offline");
  battleRows = await store.battleBoard(weekKey()); setTimeout(() => { battleRows = null; }, 60000); return battleRows;
}
// ---------- invite classmates ----------
function inviteLink() { return location.origin + location.pathname + "?c=" + encodeURIComponent(TENANT ? TENANT.slug : IS_RGUKT ? "rgukt" : ""); }
function inviteCard() {
  if (NO_COLLEGE) return null;
  const note = el("small", { class: "hint", role: "status" });
  return el("div", { class: "learn-card" }, el("strong", {}, "📣 Invite your classmates"),
    el("p", { class: "hint" }, "More students from " + COLLEGE + " means more answers, a livelier board and a stronger place on the quiz battle."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: async (e) => {
      const url = inviteLink(), text = "Join " + COLLEGE + " on " + BRAND + ": ask doubts, take quizzes and share ideas with your classmates.";
      try { if (navigator.share) { await navigator.share({ title: BRAND, text, url }); return; } } catch (err) { if (err && err.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(text + " " + url); note.textContent = "Link copied. Paste it in your class group."; } catch (_) { note.textContent = url; }
    } }, "Share invite link")), note);
}
// ---------- The Campus Loop Plus ----------
function plusCard() {
  return el("div", { class: "learn-card" }, el("strong", {}, "⭐ The Campus Loop Plus" + (state.plan.plus ? " (active)" : "")),
    el("p", { class: "hint" }, PLUS.enabled ? "Cloud backup of your study tools, a ⭐ badge and more." : "Early access is free while we build it. Tell us what you would like."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { loadPlan().then(() => { if (state.mode === "plus") render(); }); showPanel("plus"); } }, "See Plus")));
}
const LAB_KEY = /^lab-[\w-]{1,60}$/;
function collectBackup() {
  const items = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (LAB_KEY.test(k)) items[k] = localStorage.getItem(k); } } catch (_) {}
  return JSON.stringify({ v: 1, items });
}
async function startCheckout(planKey, gift) {
  if (!PLUS.functionsUrl) throw new Error("Payments are not switched on yet.");
  const tok = store.idToken ? await store.idToken() : "";
  const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/createPaymentLink", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ plan: planKey, code: state.promo && (state.promo.plan === "any" || state.promo.plan === planKey) ? state.promo.code : "", gift: !!gift }) });
  const j = await r.json().catch(() => ({}));
  const url = safeHttp(j.url || "");
  if (!r.ok || !url || !/^https:\/\/(rzp\.io|razorpay\.com|[a-z0-9-]+\.razorpay\.com)\//.test(url)) throw new Error(j.error || "Could not start the payment.");
  window.open(url, "_blank", "noopener");
}
const PLUS_FEATURES = ["Plus gift link for a friend", "Group study rooms with a shared timer", "Scan handwritten notes into flashcards", "Live doubt sessions with seniors", "Placement preparation kit", "Offline downloads of papers", "Weekly leaderboard for Plus members", "More resume templates", "No ads, ever"];
const PLUS_TILES = [
  ["\u{1F50E}", "Loopy AI Search", "Search any topic for a quick answer, pictures, videos and PDFs.", "loopysearch"],
  ["", "AI study helper", "Ask doubts and get step-by-step answers from Claude. 40 a day.", "ai"],
  ["📝", "Mock tests", "Timed subject and placement tests with a topic-wise report.", "mock"],
  ["📓", "Mistake notebook", "Questions you missed come back until you get them right.", "mistakes"],
  ["🗓️", "Exam planner", "A daily plan with spaced revision before your exam.", "planner"],
  ["📚", "Paper vault", "Previous-year papers and solutions, by subject and year.", "papers"],
  ["☁️", "Cloud backup", "Keep flashcards, notes and tasks safe across phones.", ""],
  ["🎨", "Themes", "Your own colour for the whole app.", ""],
  ["🏅", "Weekly leaderboard", "Compete with Plus members of your college every week.", "wboard"],
  ["📄", "Resume builder", "A one-page ATS-friendly resume you can print as a PDF.", "resume"],
  ["⏱️", "Focus timer", "Pomodoro rounds with a 7-day study chart.", "focusplus"],
  ["🎯", "Goals and badges", "Weekly targets and badges to keep you going.", "goals"],
  ["⭐", "Plus star", "A star next to your name on every post.", ""],
];
const PLUS_COMPARE = [["", "Free", "Plus"], ["Board, stories, quizzes, Study Lab", "✔", "✔"], ["Daily streaks and battles", "✔", "✔"], ["AI study helper", "–", "✔"], ["Mock tests and progress chart", "–", "✔"], ["Mistake notebook and exam planner", "–", "✔"], ["Paper vault", "–", "✔"], ["Weekly goals, badges, focus timer", "–", "✔"], ["Resume builder, weekly leaderboard", "–", "✔"], ["Cloud backup, themes, ⭐", "–", "✔"]];
function renderPlus() {
  const acct = myAccount(), verified = acct.verified, has = state.plan.plus;
  const canBackup = !!store && !!store.getTop && verified && (!PLUS.enabled || has);
  const msg = el("p", { class: "hint", role: "status" }, state.plusMsg || "");
  const say = (t) => { state.plusMsg = t; msg.textContent = t; };
  const backup = el("button", { class: "btn sm primary", type: "button", disabled: !canBackup, onclick: async () => {
    try {
      const json = collectBackup(); if (json.length > 900000) { say("Your data is too big to back up (over 900 KB). Delete old notes or decks and try again."); return; }
      say("Backing up…"); await store.setTop("userData", store.authUid(), { json, updatedAt: Date.now() }); say("✅ Backed up " + Object.keys(JSON.parse(json).items).length + " items at " + new Date().toLocaleTimeString() + ".");
    } catch (e) { say("Could not back up: " + (e && e.code === "permission-denied" ? "this needs a verified email" + (PLUS.enabled ? " and an active Plus plan." : ".") : "check your internet and try again.")); }
  } }, "☁️ Back up now");
  const restore = el("button", { class: "btn sm", type: "button", disabled: !canBackup, onclick: async () => {
    try {
      const d = await store.getTop("userData", store.authUid());
      if (!d || !d.json) { say("No backup found for this account yet."); return; }
      const data = JSON.parse(d.json), keys = Object.keys((data && data.items) || {}).filter(k => LAB_KEY.test(k) && typeof data.items[k] === "string");
      if (!keys.length) { say("The backup is empty."); return; }
      if (!confirm("Replace the study tools data on this phone with your backup from " + new Date(d.updatedAt || 0).toLocaleString() + "?")) return;
      for (const k of keys) localStorage.setItem(k, data.items[k]);
      say("✅ Restored " + keys.length + " items. Reopen Study Lab to see them.");
    } catch (e) { say("Could not restore: check your internet and try again."); }
  } }, "⬇️ Restore");
  const buy = (key, label) => el("button", { class: "btn primary", type: "button", onclick: async (e) => { e.currentTarget.disabled = true; try { await startCheckout(key); say("The payment page opened in a new tab. Come back here after you pay."); } catch (err) { say(err.message || "Could not start the payment."); } e.currentTarget.disabled = false; } }, label);
  // interest survey (works today, no payment needed)
  const email = el("input", { type: "email", maxlength: "100", placeholder: "Email (optional, only to tell you when Plus opens)", "aria-label": "Email", autocomplete: "email" });
  const picks = PLUS_FEATURES.map(f => ({ f, box: el("input", { type: "checkbox" }) }));
  const price = el("select", { "aria-label": "What would you pay per month?" }, ["₹29 a month", "₹49 a month", "₹99 a month", "₹149 or more"].map(o => el("option", {}, o)));
  const survey = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    try { if (Date.now() - Number(localStorage.getItem("dd-plus-interest") || 0) < 86400000) { say("Thank you! You already answered today."); return; } } catch (_) {}
    if (!store || !store.setTop) { say("Needs the live board. Connect to the internet and try again."); return; }
    try {
      const em = email.value.trim(); if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say("Type a valid email or leave it empty."); return; }
      await store.setTop("plusInterest", store.newId("plusInterest"), { email: em.slice(0, 100), college: COLLEGE.slice(0, 60), features: picks.filter(x => x.box.checked).map(x => x.f), price: price.value, createdAt: Date.now() });
      try { localStorage.setItem("dd-plus-interest", String(Date.now())); } catch (_) {}
      say("✅ Thank you! Your answer helps us decide what to build first.");
    } catch (err) { say("We could not save your answer right now. Please try again later."); }
  } },
    el("p", { class: "hint" }, "Which of these would you want? Tick any."),
    ...picks.map(x => el("label", { class: "check" }, x.box, x.f)),
    price, email, el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "submit" }, "Send my answer")));
  const wemail = el("input", { type: "email", maxlength: "100", placeholder: "Email (optional) to hear when payments open", "aria-label": "Email", autocomplete: "email" });
  const wait = async (key) => {
    try { if (Date.now() - Number(localStorage.getItem("dd-plus-wait") || 0) < 86400000) { say("Thank you! You are already on the list."); return; } } catch (_) {}
    if (!store || !store.setTop) { say("Needs the live board. Connect to the internet and try again."); return; }
    const em = wemail.value.trim(); if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say("Type a valid email or leave it empty."); return; }
    try { await store.setTop("plusInterest", store.newId("plusInterest"), { email: em.slice(0, 100), college: COLLEGE.slice(0, 60), features: [], price: "Waitlist " + key, createdAt: Date.now() }); try { localStorage.setItem("dd-plus-wait", String(Date.now())); } catch (_) {} say("✅ You are on the list. Early access stays free until payments open."); }
    catch (_) { say("We could not save that right now. Please try again later."); }
  };
  const plansBlock = () => {
    const offer = offerOn(), perMonth = (price, days) => Math.round(price / (days / 30.5)), yearlyNow = offer ? offer.yearly : PLUS.yearly, card = (key, name, price, per, note, badge, shown, was) => el("div", { class: "plan-card" + (badge ? " best" : "") },
      badge ? el("span", { class: "plan-badge" }, badge) : null, el("strong", {}, name),
      el("div", { class: "plan-price" }, shown ? [el("s", { class: "plan-was" }, "₹" + (was || price)), " ₹" + shown] : "₹" + price, el("small", {}, " " + per)),
      key === "yearly" && offer ? el("p", { class: "plan-deal" }, "Ends in " + offer.days + " day" + (offer.days === 1 ? "" : "s") + ". Lock this price for your first year.") : null, el("p", { class: "hint" }, note),
      has ? (PLUS.enabled ? buy(key, "Renew") : el("span", { class: "hint" }, "Active ✔")) : PLUS.enabled ? buy(key, "Upgrade") : el("button", { class: "btn" + (badge ? " primary" : ""), type: "button", onclick: () => wait(key) }, "Notify me"));
    const pr = state.promo, cut = (key, cur) => (pr && pr.percent && (pr.plan === "any" || pr.plan === key)) ? Math.max(1, Math.round(cur * (100 - pr.percent) / 100)) : 0;
    const cards = [["weekly", "Exam week", PLUS.weekly || 19, "/ 7 days", "Cram before an exam. Cheapest way to try Plus.", "", 0], ["monthly", "Monthly", PLUS.monthly, "/ month", "One payment. No auto-renewal.", "", 0],
      ["semester", "Semester", PLUS.semester || 149, "/ 4 months", "About ₹" + perMonth(PLUS.semester || 149, 130) + " a month. Covers a whole semester.", "Popular", 0],
      ["yearly", "Yearly", PLUS.yearly, "/ year", "About ₹" + perMonth(yearlyNow, 366) + " a month. Save " + Math.max(0, Math.round(100 - yearlyNow * 100 / (PLUS.monthly * 12))) + "% vs monthly.", offer ? offer.label : "Best value", offer ? offer.yearly : 0]]
      .map(([k, n, p, per, note, badge, shown]) => { const c = cut(k, shown || p); return card(k, n, p, per, note, badge, c || shown, c ? shown || p : 0); });
    const code = el("input", { maxlength: "20", placeholder: "Have a promo code?", "aria-label": "Promo code", autocomplete: "off", value: pr ? pr.code : (() => { try { return localStorage.getItem("dd-sale-code") || ""; } catch (_) { return ""; } })() }), codeMsg = el("p", { class: "hint", role: "status" }, pr ? "✅ " + pr.code + ": " + pr.percent + "% off " + (pr.plan === "any" ? "any plan" : "the " + pr.plan + " plan") + "." : "");
    const apply = async (e) => {
      const v = code.value.trim().toUpperCase(); if (!v) { state.promo = null; render(); return; }
      if (!/^[A-Z0-9]{3,20}$/.test(v)) { codeMsg.textContent = "Codes have 3-20 letters or digits."; return; }
      if (!PLUS.functionsUrl) { codeMsg.textContent = "Codes work once payments open."; return; }
      e.currentTarget.disabled = true; codeMsg.textContent = "Checking…";
      try {
        const tok = store && store.idToken ? await store.idToken() : ""; if (!tok) throw new Error("Connect to the internet and sign in first.");
        const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/checkPromo", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ code: v }) }), d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "That code did not work.");
        const found = { code: d.code, percent: d.percent, plan: d.plan };
        state.promo = found; render();
      } catch (err) { codeMsg.textContent = err.message || "That code did not work."; e.currentTarget.disabled = false; }
    };
    return el("div", {}, el("div", { class: "label" }, has ? "Your plan" : "Plans"),
      el("div", { class: "plan-grid" }, ...cards),
      (PLUS.enabled && !has) ? el("div", { class: "promo-row" }, code, el("button", { class: "btn sm", type: "button", onclick: apply }, "Apply")) : null, (PLUS.enabled && !has) ? codeMsg : null,
      (PLUS.enabled && !has && PLUS.trialDays) ? (trialLeft() ? el("p", { class: "plan-deal" }, "🎁 Free trial active: " + trialLeft() + " day" + (trialLeft() === 1 ? "" : "s") + " left (AI helper needs a paid plan).") : (readJSON("dd-trial-start", 0) ? null : el("button", { class: "btn", type: "button", onclick: () => { writeJSON("dd-trial-start", Date.now()); render(); } }, "🎁 Start " + PLUS.trialDays + "-day free trial"))) : null,
      PLUS.enabled ? el("p", { class: "hint" }, "Pay safely by UPI, card or net banking (Razorpay). Your plan switches on within a minute of paying." + (verified ? "" : " Verify your email first (Profile › Verify your email) so we can attach the plan to you.")) : el("div", {}, el("p", { class: "hint" }, "Payments open soon. Everything below is free while we build Plus. Tap Notify me and we will tell you the day it opens" + (offerOn() ? ", and you get the " + offerOn().label.toLowerCase() + " price of ₹" + offerOn().yearly + " for the first year." : ".")), wemail));
  };
  return [
    el("h2", {}, "⭐ The Campus Loop Plus" + (has ? " (active)" : "")),
    has ? el("div", { class: "plus-hero" }, "Welcome, Plus member. Your studio is ready.") : null,
    el("p", { class: "hint" }, has && state.plan.college ? "🎓 " + COLLEGE + " provides Plus for every student until " + new Date(state.plan.until).toLocaleDateString() + ". Enjoy, and thank your college!" : has ? "Thank you for supporting CampusLoop. Your plan is active until " + new Date(state.plan.until).toLocaleDateString() + "." : PLUS.enabled ? "Extras for students who want more. Everything free today stays free." : "Early access: everything below that already works is free while we build Plus. Everything free today stays free."),
    (!plusLocked() ? coachCard() : null),
    plansBlock(),
    msg,
    (!plusLocked() ? dailyCard() : null),
    state.giftMsg ? el("div", { class: "wow", role: "status" }, el("strong", {}, state.giftMsg)) : null,
    giftCard(),
    refInviteCard(),
    el("div", { class: "label" }, "What you get"),
    el("div", { class: "plus-tiles" }, ...PLUS_TILES.map(([icon, title, text, mode]) => el("button", { class: "plus-tile", type: "button", onclick: () => { if (mode) { state.mock = null; state.mist = null; showPanel(mode); } } }, el("span", { class: "pt-i", "aria-hidden": "true" }, icon), el("strong", {}, title), el("span", {}, text)))),
    el("div", { class: "label" }, "Free vs Plus"),
    el("div", { class: "plus-cmp", role: "table" }, ...PLUS_COMPARE.map(([f, free, plus], i) => el("div", { class: "pc-row" + (i === 0 ? " head" : ""), role: "row" }, el("span", { role: "cell" }, f), el("span", { role: "cell" }, free), el("span", { role: "cell" }, plus)))),
    el("div", { class: "label" }, "Plus studio"),
    (PLUS.enabled && !has) ? el("p", { class: "hint" }, "The studio is part of the paid plan.") : null,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "button", onclick: () => showPanel("ai") }, "AI helper"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mock = null; showPanel("mock"); } }, "📝 Mock tests"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mist = null; showPanel("mistakes"); } }, "📓 Mistakes (" + mistakeList().length + ")"),
      el("button", { class: "btn", type: "button", onclick: () => showPanel("planner") }, "🗓️ Exam planner"),
      el("button", { class: "btn", type: "button", onclick: () => showPanel("papers") }, "📚 Paper vault (" + state.papers.length + ")"),
      el("button", { class: "btn", type: "button", onclick: () => showPanel("goals") }, "🎯 Goals and badges"),
      el("button", { class: "btn", type: "button", onclick: () => { state.ft = null; showPanel("focusplus"); } }, "⏱️ Focus timer"),
      el("button", { class: "btn", type: "button", onclick: () => showPanel("resume") }, "📄 Resume builder"),
      el("button", { class: "btn", type: "button", onclick: () => showPanel("wboard") }, "🏅 Weekly leaderboard")),
    el("div", { class: "label" }, "🎨 Theme"),
    (PLUS.enabled && !has) ? el("p", { class: "hint" }, "Themes are part of the paid plan.") : el("div", { class: "rowbtns" }, ...THEMES.map(([n, c]) => el("button", { class: "btn sm", type: "button", onclick: () => { try { if (c) localStorage.setItem("dd-theme", c); else localStorage.removeItem("dd-theme"); } catch (_) {} if (!c) { const b = BRAND_COLORS || ["#4f46e5", "#7c3aed"]; document.documentElement.style.setProperty("--accent", b[0]); document.documentElement.style.setProperty("--brand-a", b[0]); document.documentElement.style.setProperty("--brand-b", b[1]); } else applyTheme(); } }, n))),
    el("div", { class: "label" }, "☁️ Backup"),
    !verified ? el("p", { class: "hint" }, "Backup needs a verified email so you can sign in on a new phone. Open Profile and tap “Verify your email”.") : (PLUS.enabled && !has ? el("p", { class: "hint" }, "Backup is part of the paid plan.") : null),
    el("div", { class: "rowbtns" }, backup, restore),
    el("div", { class: "label" }, "🗳️ Help us decide"),
    survey,
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ].filter(Boolean);
}
// The Campus Loop Plus studio: timed mock tests (subjects or placement), progress chart, mistake notebook and exam planner. Data stays on this phone.
const MOCK_N = 15, MOCK_SECS = 20 * 60;
const trialLeft = () => { const t = Number(readJSON("dd-trial-start", 0)) || 0, d = Number(PLUS.trialDays) || 0; return t && d ? Math.max(0, Math.ceil((t + d * 864e5 - Date.now()) / 864e5)) : 0; };
const bonusLeft = () => Math.max(0, Math.ceil(((Number(readJSON("dd-bonus-until", 0)) || 0) - Date.now()) / 864e5));
const plusLocked = () => PLUS.enabled && !state.plan.plus && trialLeft() === 0 && bonusLeft() === 0;
const offerOn = () => { const o = PLUS.offer; if (!o || !o.yearly || !o.until) return null; const end = new Date(o.until + "T23:59:59+05:30").getTime(); return end > Date.now() ? { label: o.label || "Offer", yearly: o.yearly, days: Math.ceil((end - Date.now()) / 864e5) } : null; };
// Weekly goals and lifetime badges, kept on this phone.
const goalStats = () => { const g = readJSON("dd-goals", {}); return g.week === weekKey() ? g : { week: weekKey(), tests: 0, cleared: 0, papers: 0 }; };
const lifeStats = () => ({ tests: 0, cleared: 0, papers: 0, best: 0, ...readJSON("dd-life", {}) });
const dailyStats = () => { const d = readJSON("dd-daily", {}); return d.day === dayStr() ? d : { day: dayStr(), tests: 0, cleared: 0, mins: 0 }; };
const weekStartMs = () => (parseInt(weekKey().slice(1), 10) * 7 - 3) * 864e5;
const weekPoints = () => { const g = goalStats(); return Math.min(3000, Math.floor((g.mins || 0) / 5) + (g.tests || 0) * 20 + (g.cleared || 0) * 2 + (g.papers || 0) * 10); };
let weeklyTimer = 0;
function syncWeekly() {
  clearTimeout(weeklyTimer);
  weeklyTimer = setTimeout(async () => {
    try {
      if (!store || !store.set || !store.authUid || NO_COLLEGE || plusLocked()) return;
      const g = goalStats(), pts = weekPoints(), uid = store.authUid(); if (!uid || !pts) return;
      await store.set("weekly", weekKey() + "_" + uid, { week: weekKey(), uid, name: (getName() || "Student").slice(0, 30), points: pts, mins: Math.min(3000, g.mins || 0), tests: Math.min(60, g.tests || 0), createdAt: weekStartMs(), updatedAt: Date.now() });
    } catch (_) {}
  }, 2500);
}
function bump(key, n, score) { try { const dd = dailyStats(); dd[key] = (dd[key] || 0) + n; writeJSON("dd-daily", dd); } catch (_) {} const g = goalStats(); g[key] = (g[key] || 0) + n; writeJSON("dd-goals", g); const l = lifeStats(); l[key] = (l[key] || 0) + n; if (score && score > l.best) l.best = score; writeJSON("dd-life", l); }

const readJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (_) { return d; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
const BANKS = { college: { label: "Subject mock test", icon: "📝", get: () => QUIZ }, place: { label: "Placement practice", icon: "💼", get: () => window.CL_PLACEMENT || [] } };
const mockHistory = () => { const a = readJSON("dd-mock-hist", []); return Array.isArray(a) ? a.slice(-30) : []; };
const mistakeList = () => { const a = readJSON("dd-mistakes", []); return Array.isArray(a) ? a.filter(x => x && typeof x.q === "string" && Array.isArray(x.o) && x.o.length === 4) : []; };
function addMistakes(qs) { const cur = mistakeList(), have = new Set(cur.map(x => x.q)); for (const q of qs) if (!have.has(q.q)) cur.push({ s: q.s, q: q.q, o: q.o, a: q.a, e: q.e || "" }); writeJSON("dd-mistakes", cur.slice(-100)); }
function mockStart(bank) {
  const all = BANKS[bank].get(), idx = all.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const qs = idx.slice(0, Math.min(MOCK_N, all.length)).map(i => all[i]);
  state.mock = { bank, qs, ans: qs.map(() => -1), i: 0, end: Date.now() + MOCK_SECS * 1000, done: false };
  render();
}
function mockFinish() {
  const m = state.mock; if (!m || m.done) return; m.done = true; clearInterval(m.tick);
  const bySub = {}; let right = 0; const wrong = [];
  m.qs.forEach((q, k) => { const b = bySub[q.s] || (bySub[q.s] = { r: 0, n: 0 }); b.n++; if (m.ans[k] === q.a) { b.r++; right++; } else wrong.push(q); });
  m.result = { right, n: m.qs.length, bySub, at: Date.now(), wrong };
  writeJSON("dd-mock-hist", [...mockHistory(), { at: m.result.at, b: m.bank, right, n: m.qs.length, bySub }]);
  addMistakes(wrong); bump("tests", 1, Math.round(right * 100 / m.qs.length));
  render();
}
// A small line chart of recent scores, drawn as SVG (no libraries).
function trendChart(rows) {
  if (rows.length < 2) return el("p", { class: "hint" }, "Take two tests to see your progress chart.");
  const NS = "http://www.w3.org/2000/svg", W = 300, H = 110, pad = 14, pts = rows.map((r, i) => [pad + i * (W - 2 * pad) / (rows.length - 1), H - pad - (r.right / r.n) * (H - 2 * pad)]);
  const mk = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
  const svg = mk("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Your last " + rows.length + " test scores", class: "mock-chart" });
  svg.append(mk("line", { x1: pad, y1: H - pad, x2: W - pad, y2: H - pad, class: "mc-axis" }), mk("polyline", { points: pts.map(p => p.join(",")).join(" "), class: "mc-line", fill: "none" }));
  pts.forEach((p, i) => { svg.append(mk("circle", { cx: p[0], cy: p[1], r: 3.5, class: "mc-dot" })); });
  const last = rows[rows.length - 1], avg = Math.round(rows.reduce((s, r) => s + r.right / r.n, 0) * 100 / rows.length);
  return el("div", {}, svg, el("p", { class: "hint" }, "Last " + rows.length + " tests: average " + avg + "%, latest " + Math.round(last.right * 100 / last.n) + "%."));
}
function scoreBars(bySub) {
  return Object.entries(bySub).sort((a, b) => (a[1].r / a[1].n) - (b[1].r / b[1].n)).map(([sb, v]) => { const p = Math.round(v.r * 100 / v.n), bar = el("div", { class: "mock-bar" }, el("span", {})); bar.firstChild.style.setProperty("width", p + "%"); return el("div", {}, el("div", { class: "rowbtns" }, el("span", {}, sb), el("b", {}, v.r + "/" + v.n)), bar); });
}
function renderMock() {
  const m = state.mock, back = el("button", { class: "btn", type: "button", onclick: () => { if (state.mock) clearInterval(state.mock.tick); state.mock = null; showPanel("plus"); } }, "Back");
  if (plusLocked()) return [el("h2", {}, "📝 Mock tests"), el("p", { class: "hint" }, "Mock tests are part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  if (!m) {
    const hist = mockHistory();
    return [el("h2", {}, "📝 Mock tests"), el("p", { class: "hint" }, MOCK_N + " questions, " + (MOCK_SECS / 60) + " minutes, then a subject-wise report. Questions you miss go to your Mistake notebook."),
      el("div", { class: "rowbtns" }, ...Object.entries(BANKS).filter(([, b]) => b.get().length).map(([k, b]) => el("button", { class: "btn primary", type: "button", onclick: () => mockStart(k) }, b.icon + " " + b.label))),
      el("div", { class: "learn-card plus-list" }, el("strong", {}, "Your progress"), trendChart(hist.slice(-10))),
      hist.length ? el("div", { class: "learn-card plus-list" }, el("strong", {}, "Recent tests"), ...hist.slice(-5).reverse().map(x => el("p", { class: "hint" }, new Date(x.at).toLocaleDateString() + " · " + (x.b === "place" ? "Placement" : "Subjects") + ": " + x.right + "/" + x.n + " (" + Math.round(x.right * 100 / x.n) + "%)"))) : null,
      el("div", { class: "rowbtns" }, back)].filter(Boolean);
  }
  if (m.result) {
    const r = m.result, pct = Math.round(r.right * 100 / r.n), same = mockHistory().filter(x => x.b === m.bank), prev = same.length > 1 ? same[same.length - 2] : null, pp = prev ? Math.round(prev.right * 100 / prev.n) : null;
    const weak = Object.entries(r.bySub).sort((a, b) => (a[1].r / a[1].n) - (b[1].r / b[1].n))[0];
    if (pct >= 80 && !m.cele) { m.cele = true; setTimeout(() => confetti(110), 150); }
    return [pct >= 70 ? el("div", { class: "wow", role: "status" }, el("span", { class: "wow-conf", "aria-hidden": "true" }, "🎉 🎊 ⭐ 🎉"), el("strong", {}, pct >= 90 ? "Wow, outstanding!" : pct >= 80 ? "Wow, amazing!" : "Great job!"), el("span", {}, r.right + " out of " + r.n + " correct")) : null,
      el("h2", {}, "📝 Result: " + r.right + " / " + r.n + " (" + pct + "%)"),
      prev ? el("p", { class: "hint" }, "Last time: " + pp + "%. " + (pct > pp ? "Better! 📈" : pct === pp ? "Same." : "Keep practising.")) : null,
      el("div", { class: "learn-card plus-list" }, el("strong", {}, "By topic (weakest first)"), ...scoreBars(r.bySub)),
      weak && weak[1].r < weak[1].n ? el("p", { class: "hint" }, "Focus next on " + weak[0] + ".") : el("p", { class: "hint" }, "Great, no weak topic this time."),
      el("div", { class: "learn-card plus-list" }, el("strong", {}, "Review your mistakes (" + r.wrong.length + ")"), ...r.wrong.map(q => el("p", { class: "hint" }, "• " + q.q + " → " + q.o[q.a] + (q.e ? ". " + q.e : "")))),
      el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: () => mockStart(m.bank) }, "Try another"), r.wrong.length ? el("button", { class: "btn", type: "button", onclick: () => { state.mock = null; state.mist = null; showPanel("mistakes"); } }, "📓 Practise mistakes") : null, back)].filter(Boolean);
  }
  const q = m.qs[m.i], left = Math.max(0, Math.ceil((m.end - Date.now()) / 1000)), fmt = (l) => Math.floor(l / 60) + ":" + String(l % 60).padStart(2, "0");
  if (left === 0) setTimeout(mockFinish, 0);
  if (!m.tick) m.tick = setInterval(() => { if (state.mode !== "mock" || state.mock !== m || m.done) { clearInterval(m.tick); return; } const l = Math.max(0, Math.ceil((m.end - Date.now()) / 1000)), t = document.querySelector("[role=timer]"); if (t) t.textContent = fmt(l); if (l === 0) mockFinish(); }, 1000);
  return [el("div", { class: "rowbtns" }, el("b", {}, "Question " + (m.i + 1) + " / " + m.qs.length), el("span", { class: "hint", role: "timer" }, fmt(left))),
    el("p", {}, q.q),
    ...q.o.map((o, k) => el("button", { class: "btn" + (m.ans[m.i] === k ? " primary" : ""), type: "button", onclick: () => { m.ans[m.i] = k; render(); } }, o)),
    el("div", { class: "rowbtns" }, m.i > 0 ? el("button", { class: "btn sm", type: "button", onclick: () => { m.i--; render(); } }, "← Previous") : null,
      m.i < m.qs.length - 1 ? el("button", { class: "btn sm", type: "button", onclick: () => { m.i++; render(); } }, "Next →") : el("button", { class: "btn sm primary", type: "button", onclick: () => { const un = m.ans.filter(a => a < 0).length; if (!un || confirm(un + " unanswered. Finish now?")) mockFinish(); } }, "Finish"))].filter(Boolean);
}
// Smart coach: reads your tests, mistakes and exam date, then tells you the single best thing to do next.
function coachCard() {
  const hist = mockHistory(), rec = hist.slice(-5), mist = mistakeList().length, plan = readJSON("dd-exam-plan", null);
  const avg = rec.length ? rec.reduce((a, r) => a + r.right / r.n, 0) * 100 / rec.length : null;
  const ready = avg == null ? null : Math.round(avg * 0.7 + Math.max(0, 100 - mist * 5) * 0.3);
  const topics = {}; for (const r of rec) for (const [k, v] of Object.entries(r.bySub || {})) { const t = topics[k] || (topics[k] = { r: 0, n: 0 }); t.r += v.r; t.n += v.n; }
  const weak = Object.entries(topics).filter(([, v]) => v.n >= 3).sort((a, b) => (a[1].r / a[1].n) - (b[1].r / b[1].n))[0];
  const daysLeft = plan && plan.date ? Math.ceil((new Date(plan.date + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5) : null;
  const lastAt = hist.length ? hist[hist.length - 1].at : 0, idleDays = lastAt ? Math.floor((Date.now() - lastAt) / 864e5) : 99;
  const tips = [];
  if (daysLeft != null && daysLeft >= 0 && daysLeft <= 7) tips.push(["⏳ " + (plan.name || "Your exam") + " is " + (daysLeft === 0 ? "today" : "in " + daysLeft + " day" + (daysLeft === 1 ? "" : "s")) + ". Open your plan.", "planner"]);
  if (mist > 0) tips.push(["📓 Clear " + Math.min(mist, 5) + " of your " + mist + " saved mistakes (3 minutes).", "mistakes"]);
  if (weak && weak[1].r / weak[1].n < 0.7) tips.push(["🎯 " + weak[0] + " is your weakest topic (" + Math.round(weak[1].r * 100 / weak[1].n) + "%). Take a mock test to improve it.", "mock"]);
  if (idleDays >= 2) tips.push([hist.length ? "📝 It has been " + idleDays + " days since your last test. A quick one keeps the streak." : "📝 Take your first mock test to start your progress chart.", "mock"]);
  if (!tips.length) tips.push(["💼 You are on track. Try a placement practice round.", "mock"]);
  const C = 2 * Math.PI * 34, NS = "http://www.w3.org/2000/svg", mk = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
  const ring = mk("svg", { viewBox: "0 0 80 80", class: "coach-ring", role: "img", "aria-label": ready == null ? "No readiness score yet" : "Readiness " + ready + " percent" });
  ring.append(mk("circle", { cx: 40, cy: 40, r: 34, class: "cr-bg", fill: "none" }), mk("circle", { cx: 40, cy: 40, r: 34, class: "cr-fg", fill: "none", "stroke-dasharray": (ready == null ? 0 : C * ready / 100) + " " + C, transform: "rotate(-90 40 40)" }));
  const t = mk("text", { x: 40, y: 46, "text-anchor": "middle", class: "cr-num" }); t.textContent = ready == null ? "–" : ready + "%"; ring.append(t);
  const level = Math.min(5, Math.floor(hist.length / 3) + 1), names = ["Rookie", "Learner", "Achiever", "Scholar", "Topper"];
  return el("div", { class: "coach" },
    el("div", { class: "coach-top" }, ring, el("div", {}, el("strong", {}, "Your readiness"), el("p", { class: "coach-sub" }, ready == null ? "Take a mock test to see it." : ready >= 80 ? "Wow, amazing! You are exam ready." : ready >= 60 ? "Good progress. Keep going." : "Let's build it up together."), el("span", { class: "coach-level" }, "Level " + level + " · " + names[level - 1]))),
    el("div", { class: "coach-next" }, el("strong", {}, "Best next step"), ...tips.slice(0, 3).map(([text, mode], i) => el("button", { class: "coach-tip" + (i === 0 ? " first" : ""), type: "button", onclick: () => { state.mock = null; state.mist = null; showPanel(mode); } }, text))));
}
// Previous-year paper vault (Plus): papers are added by the admin as links; students filter, open and tick off what they have practised.
function renderPapers() {
  const back = el("button", { class: "btn", type: "button", onclick: () => showPanel("plus") }, "Back");
  if (plusLocked()) return [el("h2", {}, "📚 Paper vault"), el("p", { class: "hint" }, "The previous-year paper vault is part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  const all = state.papers.slice().sort((a, b) => (b.year - a.year) || String(a.subject).localeCompare(b.subject)), done = new Set(readJSON("dd-papers-done", []));
  if (!all.length) return [el("h2", {}, "📚 Paper vault"), el("p", { class: "hint" }, "No papers have been added for " + COLLEGE + " yet. Your admin adds them from the admin dashboard."), el("div", { class: "rowbtns" }, back)];
  const f = state.paperFilter || (state.paperFilter = { subject: "", year: "", q: "" });
  const subjects = [...new Set(all.map(p => p.subject))].sort(), years = [...new Set(all.map(p => p.year))].sort((a, b) => b - a);
  const rows = all.filter(p => (!f.subject || p.subject === f.subject) && (!f.year || String(p.year) === f.year) && (!f.q || (p.title + " " + p.subject).toLowerCase().includes(f.q.toLowerCase())));
  const sel = (label, key, opts) => el("select", { "aria-label": label, onchange: (e) => { f[key] = e.target.value; render(); } }, el("option", { value: "" }, label), ...opts.map(o => el("option", { value: String(o), selected: f[key] === String(o) ? "" : null }, String(o))));
  const search = el("input", { type: "search", maxlength: "40", placeholder: "Search papers", "aria-label": "Search papers", value: f.q, oninput: (e) => { f.q = e.target.value; clearTimeout(f.t); f.t = setTimeout(render, 250); } });
  const open = (u) => { try { window.open(u, "_blank", "noopener"); } catch (_) {} };
  const pct = Math.round(all.filter(p => done.has(p.id)).length * 100 / all.length);
  return [el("h2", {}, "📚 Paper vault (" + all.length + ")"), el("p", { class: "hint" }, "Practised " + all.filter(p => done.has(p.id)).length + " of " + all.length + " (" + pct + "%). Tip: attempt a paper under exam time, then check the solution."),
    search, el("div", { class: "rowbtns" }, sel("All subjects", "subject", subjects), sel("All years", "year", years)),
    ...(rows.length ? rows.map(p => el("div", { class: "learn-card plus-list" }, el("strong", {}, p.title), el("p", { class: "hint" }, p.subject + " · " + p.year + " · " + p.exam + (p.note ? " · " + p.note : "")),
      el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => open(p.link) }, "📄 Open paper"),
        /^https:\/\//.test(p.solution || "") ? el("button", { class: "btn sm", type: "button", onclick: () => open(p.solution) }, "✅ Solution") : null,
        el("button", { class: "btn sm", type: "button", onclick: () => { if (done.has(p.id)) done.delete(p.id); else { done.add(p.id); bump("papers", 1); } writeJSON("dd-papers-done", [...done].slice(-500)); render(); } }, done.has(p.id) ? "✔ Practised" : "Mark practised")))) : [el("p", { class: "hint" }, "No papers match.")]),
    el("div", { class: "rowbtns" }, back)].filter(Boolean);
}
// AI study helper (Plus): chat with Claude through our own server function; the secret key never reaches the phone.
// Loopy AI Search: type any topic and get a quick answer with a picture (from Wikipedia, read-only), then the best places to watch, read and practise it. Free, needs no sign-in, and only reads public pages.
const LS_LEVELS = { quick: ["⚡ Quick idea", "explained simply"], deep: ["\u{1F52C} Deep lecture", "full lecture"], exam: ["\u{1F3AF} Exam prep", "important questions previous year"] };
const LS_CHANNELS = [["NPTEL", "NPTEL (IITs)"], ["MIT OpenCourseWare", "MIT OpenCourseWare"], ["Khan Academy", "Khan Academy"], ["Neso Academy", "Neso Academy"], ["Gate Smashers", "Gate Smashers"], ["3Blue1Brown", "3Blue1Brown (visual maths)"]];
const lsClean = (q) => String(q || "").replace(/[\u0000-\u001F\u007F<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
const lsFetch = async (url) => {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(url, { signal: ctl.signal, referrerPolicy: "no-referrer", credentials: "omit" }); if (!r.ok) throw new Error("bad"); return await r.json(); } finally { clearTimeout(t); }
};
async function lsRun(q) {
  const ls = state.ls; ls.q = q; ls.err = ""; ls.res = null; ls.ai = null; ls.aiNote = ""; ls.busy = true; render();
  const aiOn = !!PLUS.functionsUrl && !!store && !!store.idToken && !plusLocked();
  const aiTask = aiOn ? (async () => {
    try {
      const tok = await store.idToken(); if (!tok) throw new Error("Sign in to use Loopy AI answers.");
      const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/askAI", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ mode: "search", query: q, level: ls.level }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.search) throw new Error(d.error || "Loopy AI is busy. Try again.");
      ls.ai = d.search; ls.aiLeft = typeof d.left === "number" ? d.left : null;
    } catch (e) { ls.aiNote = (e && e.message) || "Loopy AI could not answer."; }
  })() : Promise.resolve();
  try {
    const found = await lsFetch("https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=" + encodeURIComponent(q));
    const hit = found && found.query && found.query.search && found.query.search[0];
    if (hit && typeof hit.title === "string") {
      const sm = await lsFetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(hit.title.replace(/ /g, "_")));
      const img = sm.thumbnail && typeof sm.thumbnail.source === "string" && sm.thumbnail.source.startsWith("https://upload.wikimedia.org/") ? sm.thumbnail.source : "";
      const page = sm.content_urls && sm.content_urls.desktop && String(sm.content_urls.desktop.page || "").startsWith("https://en.wikipedia.org/") ? sm.content_urls.desktop.page : "";
      ls.res = { title: String(sm.title || hit.title).slice(0, 120), text: String(sm.extract || "").slice(0, 900), img, page };
    } else ls.res = { title: q, text: "", img: "", page: "" };
  } catch (_) { ls.res = { title: q, text: "", img: "", page: "" }; ls.err = "The quick answer could not load. The links below still work."; }
  await aiTask;
  ls.busy = false; render();
  try { bump("search", 1); } catch (_) {}
}
function openLoopySearch(q, back) {
  state.ls = Object.assign(state.ls || { level: "quick", mode: "topic", q: "", res: null, busy: false, err: "" }, { q: lsClean(q), back: back || "plus" });
  showPanel("loopysearch"); if (state.ls.q) lsRun(state.ls.q);
}
// Student search inside Loopy AI Search. Only public nicknames that already appear on the board are searchable. Anonymous posts and e-mail addresses are never included.
const lsPerson = (p, extra) => el("div", { class: "learn-card ls-person" },
  avatarEl(avatarFor(p.name || ""), "av av-lg"),
  el("div", { class: "ls-who" }, el("strong", {}, p.name + markOf(p.id)), (campusId(p.id) || handleOf(p.id)) ? el("small", { class: "hint id-mini" }, [handleOf(p.id) ? "@" + handleOf(p.id) : "", campusId(p.id)].filter(Boolean).join("  \u00B7  ")) : null, el("small", { class: "hint" }, "Lv " + p.level.n + " " + titleOf(p.points) + " · " + plural(p.answers, "answer") + " · " + p.helpful + " helpful" + (p.streak > 1 ? " · \u{1F525}" + p.streak + "-day streak" : "")), (statusOfId(p.id) || "") ? el("small", {}, statusOfId(p.id)) : null, extra || null),
  el("span", { class: "pts" }, p.points + " pts"));
function lsStudents(box, q, sort) {
  const needle = lsClean(q).toLowerCase(), meId = store && store.uid;
  let rows = [...allStats().values()].filter(p => p.name && p.id !== meId);
  if (needle) rows = rows.filter(p => p.name.toLowerCase().includes(needle) || campusId(p.id).toLowerCase().includes(needle) || handleOf(p.id).includes(needle.replace(/^@/, "")));
  const by = { points: (a, b) => b.points - a.points, answers: (a, b) => b.answers - a.answers || b.helpful - a.helpful, streak: (a, b) => (b.streak || 0) - (a.streak || 0) || b.points - a.points }[sort] || ((a, b) => b.points - a.points);
  rows = rows.sort(by);
  box.replaceChildren(...(rows.length ? [el("p", { class: "hint", role: "status" }, rows.length + " student" + (rows.length === 1 ? "" : "s") + (rows.length > 20 ? " · showing the top 20" : "")), ...rows.slice(0, 20).map(p => lsPerson(p))] : [el("p", { class: "hint", role: "status" }, needle ? "No student with “" + needle + "” yet. Check the spelling or ask them to join." : "No students on the board yet. Answer a doubt to be the first.")]));
}
// Classmates who already answered doubts about this topic.
function helpersFor(q) {
  const words = lsClean(q).toLowerCase().split(" ").filter(w => w.length > 2); if (!words.length) return [];
  const dmap = new Map(state.doubts.map(d => [d.id, d])), stats = allStats(), count = new Map();
  for (const r of state.replies) {
    if (r.parentColl !== "doubts" || r.anonymous || !r.authorId) continue;
    const d = dmap.get(r.parentId); if (!d || d.authorId === r.authorId) continue;
    const hay = ((d.subject || "") + " " + (d.title || "")).toLowerCase();
    if (words.some(w => hay.includes(w))) count.set(r.authorId, (count.get(r.authorId) || 0) + 1);
  }
  return [...count].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => ({ p: stats.get(id), n })).filter(x => x.p && x.p.name && !(store && allMyIds().has(x.p.id)));
}
function lsAiCard(ls) {
  const a = ls.ai, yt = (t) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(t), gg = (t, img) => "https://www.google.com/search?" + (img ? "tbm=isch&" : "") + "q=" + encodeURIComponent(t);
  return el("div", { class: "learn-card ls-card ls-ai" },
    el("small", { class: "tag" }, "\u2728 Loopy AI"),
    el("p", {}, a.summary),
    a.keyPoints.length ? el("ul", { class: "ls-points" }, ...a.keyPoints.map(k => el("li", {}, k))) : null,
    a.example ? el("p", { class: "hint" }, el("b", {}, "Example: "), a.example) : null,
    a.videoQueries.length ? el("div", { class: "rowbtns" }, ...a.videoQueries.map(t => outLink(yt(t), "\u25B6 " + t, "btn sm"))) : null,
    a.diagramQueries.length || a.pdfQueries.length ? el("div", { class: "rowbtns" }, ...a.diagramQueries.map(t => outLink(gg(t, true), "\u{1F5BC} " + t, "btn sm")), ...a.pdfQueries.map(t => outLink(gg(t + " filetype:pdf"), "\u{1F4C4} " + t, "btn sm"))) : null,
    a.followUp ? el("div", { class: "curio-ask" }, el("small", { class: "tag" }, "\u{1F914} LOOPY ASKS YOU"), el("p", {}, a.followUp), el("button", { class: "btn sm primary", type: "button", onclick: () => { state.ai = state.ai || { msgs: [], busy: false, note: "" }; state.ai.prefill = "You asked me: " + a.followUp + "\nMy answer is: "; showPanel("ai"); } }, "\u270D\uFE0F Answer and get feedback")) : null,
    a.related.length ? el("div", { class: "rowbtns" }, el("small", { class: "hint" }, "Related:"), ...a.related.map(t => el("button", { class: "linkbtn", type: "button", onclick: () => lsRun(lsClean(t)) }, t))) : null,
    el("p", { class: "hint" }, "AI answers can contain mistakes. Check important facts with your book or teacher." + (ls.aiLeft != null ? " " + ls.aiLeft + " AI questions left today." : "")));
}
function renderLoopySearch() {
  const ls = state.ls || (state.ls = { level: "quick", mode: "topic", q: "", res: null, busy: false, err: "" });
  const input = el("input", { type: "search", maxlength: "80", placeholder: "Try: Bayes theorem, Dijkstra, transformer", "aria-label": "Topic to search", autocomplete: "off", value: ls.q });
  const go = () => { const q = lsClean(input.value); if (q.length < 2) { input.focus(); return; } lsRun(q); };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
  const q = ls.q, suffix = LS_LEVELS[ls.level][1];
  const seg = el("div", { class: "ls-seg", role: "tablist" }, ...[["topic", "\u{1F4DA} Topics"], ["students", "\u{1F465} Students"]].map(([k, t]) => el("button", { type: "button", role: "tab", "aria-selected": String(ls.mode === k), class: ls.mode === k ? "on" : "", onclick: () => { ls.mode = k; render(); } }, t)));
  if (ls.mode === "students") {
    const box = el("div", { class: "ls-people", "aria-live": "polite" }), sq = el("input", { type: "search", maxlength: "40", placeholder: "Search by nickname or ID", "aria-label": "Search students by nickname or ID", autocomplete: "off", value: ls.sq || "" });
    const sortKey = ls.sort || "points", draw = () => lsStudents(box, sq.value, ls.sort || "points");
    sq.addEventListener("input", () => { ls.sq = sq.value.slice(0, 40); draw(); }); draw();
    return [el("h2", {}, "\u{1F50E} Loopy AI Search"), seg,
      el("p", { class: "hint" }, "Find classmates and top helpers by nickname. Only public nicknames from the board are searched. Anonymous posts are never included."),
      el("div", { class: "ls-bar" }, sq),
      el("div", { class: "rowbtns", role: "group", "aria-label": "Sort" }, ...[["points", "\u{1F3C6} Top points"], ["answers", "\u{1F4A1} Most answers"], ["streak", "\u{1F525} Streaks"]].map(([k, t]) => el("button", { class: "btn sm" + (sortKey === k ? " primary" : ""), type: "button", "aria-pressed": String(sortKey === k), onclick: () => { ls.sort = k; render(); } }, t))),
      box, el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => showPanel(ls.back || "plus") }, "Back"))];
  }
  const yt = (extra) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q + " " + extra);
  const gg = (extra, img) => "https://www.google.com/search?" + (img ? "tbm=isch&" : "") + "q=" + encodeURIComponent(q + " " + extra);
  const r = ls.res;
  return [
    el("h2", {}, "\u{1F50E} Loopy AI Search"), seg,
    el("p", { class: "hint" }, "Type a topic. Loopy finds a quick answer with a picture, then the best videos, diagrams and PDFs for it."),
    el("div", { class: "ls-bar" }, input, el("button", { class: "btn primary", type: "button", disabled: ls.busy ? "" : null, onclick: go }, ls.busy ? "Searching…" : "Search")),
    el("div", { class: "rowbtns", role: "group", "aria-label": "How deep" }, ...Object.entries(LS_LEVELS).map(([k, v]) => el("button", { class: "btn sm" + (ls.level === k ? " primary" : ""), type: "button", "aria-pressed": String(ls.level === k), onclick: () => { ls.level = k; render(); } }, v[0]))),
    !q ? el("p", { class: "hint" }, "Tip: search a unit topic from your syllabus, for example Moment generating function.") : null,
    q && ls.ai ? lsAiCard(ls) : null,
    q && !ls.ai && PLUS.functionsUrl ? el("p", { class: "hint", role: "status" }, ls.aiNote || "Loopy AI answers appear here for Plus members.") : null,
    q && !PLUS.functionsUrl ? el("p", { class: "hint" }, "Loopy AI answers switch on soon. The quick answer and links below work now.") : null,
    q && r ? el("div", { class: "learn-card ls-card" },
      r.img ? el("img", { class: "ls-img", src: r.img, alt: r.title, loading: "lazy", referrerpolicy: "no-referrer" }) : null,
      el("strong", {}, r.title),
      r.text ? el("p", {}, r.text) : el("p", { class: "hint" }, "No short summary found. Use the lanes below."),
      r.page ? outLink(r.page, "\u{1F4D6} Read more on Wikipedia", "linkbtn") : null,
      ls.err ? el("p", { class: "hint", role: "status" }, ls.err) : null,
      el("p", { class: "hint" }, "Summary text is from Wikipedia and can be incomplete. Check important facts in your textbook.")) : null,
    q ? el("div", { class: "label" }, "▶ Watch") : null,
    q ? el("div", { class: "rowbtns" }, ...LS_CHANNELS.map(([c, t]) => outLink(yt(c + " " + suffix), t, "btn sm"))) : null,
    q ? el("div", { class: "label" }, "\u{1F5BC} See it") : null,
    q ? el("div", { class: "rowbtns" }, outLink(gg("diagram explained", true), "Diagrams", "btn sm"), outLink("https://commons.wikimedia.org/w/index.php?search=" + encodeURIComponent(q) + "&ns6=1", "Free images (Wikimedia)", "btn sm"), outLink(yt("animation visualization"), "Animations", "btn sm")) : null,
    q ? el("div", { class: "label" }, "\u{1F4C4} Read and practise") : null,
    q ? el("div", { class: "rowbtns" }, outLink(gg("filetype:pdf lecture notes site:nptel.ac.in OR site:ocw.mit.edu OR site:ac.in"), "Official notes PDF", "btn sm"), outLink(gg("filetype:pdf previous year questions"), "Question papers", "btn sm"), outLink("https://www.geeksforgeeks.org/search/?q=" + encodeURIComponent(q), "GeeksforGeeks", "btn sm")) : null,
    q && helpersFor(q).length ? el("div", { class: "label" }, "\u{1F465} Classmates who solved this") : null,
    ...(q ? helpersFor(q).map(({ p, n }) => lsPerson(p, el("small", {}, "Answered " + plural(n, "doubt") + " on this topic"))) : []),
    q ? el("div", { class: "label" }, "\u{1F4AC} Ask for help") : null,
    q ? el("div", { class: "rowbtns" },
      PLUS.functionsUrl ? el("button", { class: "btn sm primary", type: "button", onclick: () => { state.ai = state.ai || { msgs: [], busy: false, note: "" }; state.ai.prefill = "Explain " + q + " for a B.Tech student, with a simple example."; showPanel("ai"); } }, "✨ Explain with Loopy AI") : null,
      el("button", { class: "btn sm", type: "button", onclick: () => { state.tab = "doubts"; state.group = "All"; state.filter = "all"; state.query = q; state.selected = null; state.mode = "intro"; render(); } }, "\u{1F50E} Doubts on this"),
      el("button", { class: "btn sm", type: "button", onclick: () => { state.mode = "ask"; render(); } }, "❓ Ask classmates")) : null,
    q ? el("p", { class: "guide-safe" }, el("b", {}, "Stay safe: "), "Video and PDF buttons open other websites in a new tab. Download only from sites you trust and never enter your password or OTP there.") : null,
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => showPanel(state.ls && state.ls.back || "plus") }, "Back")),
  ];
}
function renderAI() {
  const back = el("button", { class: "btn", type: "button", onclick: () => showPanel("plus") }, "Back");
  if (plusLocked()) return [el("h2", {}, "AI study helper"), el("p", { class: "hint" }, "The AI study helper is part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  if (!PLUS.functionsUrl) return [el("h2", {}, "AI study helper"), el("p", { class: "hint" }, "The AI helper is being set up and will switch on soon."), el("div", { class: "rowbtns" }, back)];
  const chat = state.ai || (state.ai = { msgs: [], busy: false, note: "" });
  const box = el("textarea", { maxlength: "1000", rows: "3", placeholder: "Ask a study doubt, e.g. Explain Dijkstra with an example", "aria-label": "Your question" });
  if (chat.prefill) { box.value = String(chat.prefill).slice(0, 1000); chat.prefill = ""; }
  const send = async () => {
    const text = box.value.trim(); if (!text || chat.busy) return;
    chat.msgs.push({ role: "user", content: text }); chat.busy = true; chat.note = ""; render();
    try {
      const tok = store && store.idToken ? await store.idToken() : ""; if (!tok) throw new Error("Please connect to the internet and sign in first.");
      const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/askAI", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ messages: chat.msgs.slice(-8), college: SEL }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "The AI helper is busy. Try again.");
      chat.msgs.push({ role: "assistant", content: String(d.reply || "") }); chat.note = typeof d.left === "number" ? d.left + " questions left today." : "";
    } catch (e) { chat.msgs.pop(); chat.note = (e && e.message) || "Could not reach the AI helper."; box.value = text; }
    chat.busy = false; render();
  };
  return [el("h2", {}, "AI study helper"), el("p", { class: "hint" }, "Ask academic doubts only. Answers can contain mistakes, so check important facts with your book or teacher."),
    ...chat.msgs.map(m => el("div", { class: "ai-msg " + (m.role === "user" ? "me" : "bot") }, m.content)),
    chat.busy ? el("p", { class: "hint", role: "status" }, "Thinking…") : null,
    box, chat.note ? el("p", { class: "hint", role: "status" }, chat.note) : null,
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", disabled: chat.busy ? "" : null, onclick: send }, "Ask"), chat.msgs.length ? el("button", { class: "btn sm", type: "button", onclick: () => { state.ai = null; render(); } }, "New chat") : null, back)].filter(Boolean);
}
// Invite friends: share your link; when a friend verifies their email you get +7 days of Plus and they get +3 (rewards are given by the server).
function myRefCode() { const uid = store && store.authUid ? store.authUid() : ""; return uid && uid.length >= 10 ? uid.slice(0, 10) : ""; }
function refLink() { const c = myRefCode(); return c ? location.origin + location.pathname + "?c=" + encodeURIComponent(SEL) + "&ref=" + c : ""; }
async function registerRefCode() {
  const c = myRefCode(); if (!c || !store || !store.setTop || readJSON("dd-ref-reg", "") === c) return;
  try { await store.setTop("refCodes", c, { uid: store.authUid(), createdAt: Date.now() }); writeJSON("dd-ref-reg", c); } catch (_) {}
}
async function claimRef() {
  const code = (() => { try { return localStorage.getItem("dd-ref") || ""; } catch (_) { return ""; } })();
  if (!code || !PLUS.functionsUrl || !store || !store.idToken || !myVerified() || readJSON("dd-ref-done", false)) return;
  try {
    const tok = await store.idToken(); if (!tok) return;
    const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/claimReferral", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ code }) });
    if (r.ok || r.status === 409 || r.status === 400 || r.status === 404) { writeJSON("dd-ref-done", true); if (r.ok) { await loadPlan(); render(); } }
  } catch (_) {}
}
function refInviteCard() {
  registerRefCode();
  const link = refLink(), say = el("p", { class: "hint", role: "status" }, "");
  if (!link) return el("div", { class: "learn-card plus-list" }, el("strong", {}, "🎁 Invite friends, earn free Plus"), el("p", { class: "hint" }, "Connect to the internet to get your invite link."));
  return el("div", { class: "learn-card plus-list" }, el("strong", {}, "🎁 Invite friends, earn free Plus"),
    el("p", { class: "hint" }, "When a friend joins with your link and verifies their email, you get 7 free days of Plus (up to 8 friends) and they get 3 days."),
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: async () => {
      const text = "Join me on " + BRAND + ", the free study community for our college: " + link;
      try { if (navigator.share) { await navigator.share({ title: BRAND, text, url: link }); return; } } catch (_) { return; }
      try { await navigator.clipboard.writeText(text); say.textContent = "✅ Link copied. Paste it in WhatsApp."; } catch (_) { say.textContent = link; }
    } }, "📤 Share my invite"), el("button", { class: "btn sm", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(link); say.textContent = "✅ Link copied."; } catch (_) { say.textContent = link; } } }, "Copy link")), say);
}
// Focus timer (Plus): 25-minute focus sessions with 5-minute breaks; completed minutes are logged per day and count toward weekly goals.
const FOCUS_MIN = 25, BREAK_MIN = 5, dayStr = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const studyLog = () => { const o = readJSON("dd-study", {}); return o && typeof o === "object" ? o : {}; };
function ftFinish() {
  const f = state.ft; if (!f || f.done) return; f.done = true; clearInterval(f.tick);
  if (f.kind === "focus") { const log = studyLog(), k = dayStr(); log[k] = (log[k] || 0) + FOCUS_MIN; const keep = Object.keys(log).sort().slice(-60); writeJSON("dd-study", Object.fromEntries(keep.map(x => [x, log[x]]))); bump("mins", FOCUS_MIN); }
  try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (_) {}
  const msg = f.kind === "focus" ? "🎉 Great focus! " + FOCUS_MIN + " minutes logged. Take a " + BREAK_MIN + "-minute break." : "Break over. Ready for another round?";
  state.ft = { msg, idle: true }; render();
}
function renderFocusPlus() {
  const back = el("button", { class: "btn", type: "button", onclick: () => { if (state.ft && state.ft.tick) clearInterval(state.ft.tick); state.ft = null; showPanel("plus"); } }, "Back");
  if (plusLocked()) return [el("h2", {}, "⏱️ Focus timer"), el("p", { class: "hint" }, "The focus timer is part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  const f = state.ft || (state.ft = { idle: true, msg: "" }), log = studyLog(), days = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return [d.toLocaleDateString(undefined, { weekday: "short" }), log[dayStr(d)] || 0]; });
  const max = Math.max(60, ...days.map(x => x[1])), total = days.reduce((a, x) => a + x[1], 0), mm = (ms) => Math.floor(ms / 6e4) + ":" + String(Math.floor(ms % 6e4 / 1e3)).padStart(2, "0");
  const start = (kind) => { const mins = kind === "focus" ? FOCUS_MIN : BREAK_MIN; const n = { kind, end: Date.now() + mins * 6e4, done: false }; n.tick = setInterval(() => { const l = n.end - Date.now(); if (state.mode !== "focusplus" || state.ft !== n) { clearInterval(n.tick); return; } if (l <= 0) { ftFinish(); return; } const t = document.querySelector("[data-ft]"); if (t) t.textContent = mm(l); }, 1000); state.ft = n; render(); };
  const chart = el("div", { class: "ft-chart", role: "img", "aria-label": "Minutes studied in the last 7 days: " + days.map(x => x[0] + " " + x[1]).join(", ") }, ...days.map(([n, v]) => { const bar = el("span", { class: "ft-bar" }); bar.style.setProperty("height", Math.max(4, Math.round(v * 100 / max)) + "%"); return el("div", { class: "ft-col" }, el("small", {}, v ? String(v) : ""), el("div", { class: "ft-track" }, bar), el("small", {}, n)); }));
  return [el("h2", {}, "⏱️ Focus timer"),
    f.idle ? el("div", { class: "learn-card plus-list" }, el("strong", {}, "Study in short, focused rounds"), el("p", { class: "hint" }, f.msg || FOCUS_MIN + " minutes of focus, then a " + BREAK_MIN + "-minute break. Keep this screen open while the timer runs."),
      el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: () => start("focus") }, "▶ Start " + FOCUS_MIN + "-min focus"), el("button", { class: "btn", type: "button", onclick: () => start("break") }, "☕ " + BREAK_MIN + "-min break")))
      : el("div", { class: "learn-card plus-list ft-run" }, el("strong", {}, f.kind === "focus" ? "🎯 Focus" : "☕ Break"), el("div", { class: "ft-time", "data-ft": "", role: "timer" }, mm(Math.max(0, f.end - Date.now()))), el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => { clearInterval(f.tick); state.ft = { idle: true, msg: "Stopped. Unfinished focus rounds are not logged." }; render(); } }, "Stop"))),
    el("div", { class: "learn-card plus-list" }, el("strong", {}, "Last 7 days: " + total + " minutes"), chart),
    el("div", { class: "learn-card plus-list" }, el("strong", {}, "Study calendar (last 5 weeks)"), (() => { const cells = Array.from({ length: 35 }, (_, i) => { const d = new Date(Date.now() - (34 - i) * 864e5), v = log[dayStr(d)] || 0; return el("span", { class: "hm hm" + (v >= 100 ? 3 : v >= 50 ? 2 : v > 0 ? 1 : 0), title: d.toLocaleDateString() + ": " + v + " min" }); }); return el("div", { class: "heat", role: "img", "aria-label": "Study calendar for the last 5 weeks" }, ...cells); })()),
    el("div", { class: "rowbtns" }, back)];
}
// "Daily 3": three small tasks that tick themselves off as you study.
function dailyCard() {
  const d = dailyStats(), items = [["⏱️", "One focus round", (d.mins || 0) >= 25], ["📓", "Clear 3 mistakes", (d.cleared || 0) >= 3], ["📝", "Take a mock test", (d.tests || 0) >= 1]], n = items.filter(x => x[2]).length;
  return el("div", { class: "learn-card plus-list" }, el("strong", {}, "✅ Daily 3 · " + n + "/3" + (n === 3 ? " · Wow, amazing day! 🎉" : "")),
    ...items.map(([ic, t, ok]) => el("p", { class: ok ? "daily-done" : "" }, (ok ? "✔ " : "○ ") + ic + " " + t)));
}
// Plus gifts: pay for a gift, get a link, send it to a friend. The friend redeems it once (verified email).
const giftsState = { list: null, loading: false };
async function loadGifts() {
  if (giftsState.loading || !PLUS.functionsUrl || !store || !store.idToken) return;
  giftsState.loading = true;
  try { const tok = await store.idToken(); if (tok) { const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/listGifts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: "{}" }); if (r.ok) { giftsState.list = (await r.json()).gifts || []; if (state.mode === "plus") render(); } } } catch (_) {}
  giftsState.loading = false;
}
async function redeemPendingGift() {
  const code = (() => { try { return localStorage.getItem("dd-gift") || ""; } catch (_) { return ""; } })();
  if (!code || !PLUS.functionsUrl || !store || !store.idToken || !myVerified()) return;
  try {
    const tok = await store.idToken(); if (!tok) return;
    const r = await fetch(PLUS.functionsUrl.replace(/\/$/, "") + "/redeemGift", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ code }) }), d = await r.json().catch(() => ({}));
    try { localStorage.removeItem("dd-gift"); } catch (_) {}
    state.giftMsg = r.ok ? "🎁 A friend gifted you " + d.days + " days of Plus. Enjoy!" : (d.error || "That gift could not be used.");
    await loadPlan(); showPanel("plus");
  } catch (_) {}
}
function giftCard() {
  const has = state.plan.plus, say = el("p", { class: "hint", role: "status" }, "");
  const link = (c) => location.origin + location.pathname + "?c=" + encodeURIComponent(SEL) + "&gift=" + c;
  const share = async (c) => { const text = "I gifted you The Campus Loop Plus! Open this link to claim it: " + link(c); try { if (navigator.share) { await navigator.share({ title: BRAND, text, url: link(c) }); return; } } catch (_) { return; } try { await navigator.clipboard.writeText(text); say.textContent = "✅ Gift link copied. Paste it in WhatsApp."; } catch (_) { say.textContent = link(c); } };
  if (!PLUS.enabled) return el("div", { class: "learn-card plus-list" }, el("strong", {}, "🎁 Gift Plus to a friend"), el("p", { class: "hint" }, "Gifts open when payments open. You will pay once, get a link, and your friend gets the days."));
  if (giftsState.list === null) loadGifts();
  const buyGift = (key, label) => el("button", { class: "btn sm", type: "button", onclick: async (e) => { e.currentTarget.disabled = true; try { await startCheckout(key, true); say.textContent = "The payment page opened. After you pay, come back here (tap Refresh) to get the gift link."; } catch (err) { say.textContent = err.message || "Could not start the payment."; } e.currentTarget.disabled = false; } }, label);
  return el("div", { class: "learn-card plus-list" }, el("strong", {}, "🎁 Gift Plus to a friend"),
    el("p", { class: "hint" }, "Pay once and send a link. Your friend gets the days after verifying their email. You can gift a week, a month or a semester."),
    el("div", { class: "rowbtns" }, buyGift("weekly", "Gift 1 week · ₹" + (PLUS.weekly || 19)), buyGift("monthly", "Gift 1 month · ₹" + PLUS.monthly), buyGift("semester", "Gift a semester · ₹" + (PLUS.semester || 149))),
    ...((giftsState.list || []).map(g => el("div", { class: "rowbtns" }, el("span", { class: "hint" }, "🎁 " + g.days + " days · " + (g.redeemed ? "claimed ✔" : "not claimed yet")), g.redeemed ? null : el("button", { class: "btn sm primary", type: "button", onclick: () => share(g.code) }, "Share link")))),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => { giftsState.list = null; giftsState.loading = false; loadGifts(); } }, "↻ Refresh my gifts")), say);
}
// Resume builder (Plus): fill a short form, see an ATS-friendly resume, print or save it as a PDF. Stays on this phone.
const RESUME_EMPTY = { name: "", title: "", email: "", phone: "", city: "", link: "", summary: "", edu: [{ a: "", b: "", c: "" }, { a: "", b: "", c: "" }], skills: "", projects: [{ a: "", b: "" }, { a: "", b: "" }], exp: [{ a: "", b: "" }], ach: "", tpl: "classic" };
const resumeData = () => { const d = readJSON("dd-resume", null); return d && typeof d === "object" ? { ...RESUME_EMPTY, ...d } : JSON.parse(JSON.stringify(RESUME_EMPTY)); };
function resumeDoc(d) {
  const sec = (title, ...kids) => { const k = kids.flat().filter(Boolean); return k.length ? el("section", { class: "rs-sec" }, el("h4", {}, title), ...k) : null; };
  const list = (t) => String(t || "").split(/[\n,;]/).map(x => x.trim()).filter(Boolean);
  const contact = [d.email, d.phone, d.city, /^https:\/\//.test(d.link || "") ? d.link : ""].filter(Boolean).join("  |  ");
  return el("article", { class: "resume tpl-" + (d.tpl === "modern" ? "modern" : "classic") },
    el("header", {}, el("h3", {}, d.name || "Your Name"), d.title ? el("p", { class: "rs-title" }, d.title) : null, contact ? el("p", { class: "rs-contact" }, contact) : null),
    sec("Summary", d.summary ? el("p", {}, d.summary) : null),
    sec("Education", d.edu.filter(e => e.a || e.b).map(e => el("p", {}, el("b", {}, e.a || ""), e.b ? ", " + e.b : "", e.c ? " (" + e.c + ")" : ""))),
    sec("Skills", list(d.skills).length ? el("p", {}, list(d.skills).join(" · ")) : null),
    sec("Projects", d.projects.filter(p => p.a || p.b).map(p => el("p", {}, el("b", {}, p.a || ""), p.b ? ": " + p.b : ""))),
    sec("Experience and internships", d.exp.filter(p => p.a || p.b).map(p => el("p", {}, el("b", {}, p.a || ""), p.b ? ": " + p.b : ""))),
    sec("Achievements", list(d.ach).length ? el("ul", {}, ...list(d.ach).map(x => el("li", {}, x))) : null));
}
function renderResume() {
  const back = el("button", { class: "btn", type: "button", onclick: () => showPanel("plus") }, "Back");
  if (plusLocked()) return [el("h2", {}, "📄 Resume builder"), el("p", { class: "hint" }, "The resume builder is part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  const d = resumeData(), prev = el("div", { class: "resume-wrap" }), save = () => { writeJSON("dd-resume", d); prev.replaceChildren(resumeDoc(d)); };
  const inp = (label, get, set, max, ph, area) => { const f = el(area ? "textarea" : "input", { maxlength: String(max), placeholder: ph || label, "aria-label": label }); f.value = get(); f.addEventListener("input", () => { set(f.value.slice(0, max)); save(); }); return f; };
  const row = (...kids) => el("div", { class: "two" }, ...kids);
  const form = el("div", { class: "form" },
    row(inp("Full name", () => d.name, v => d.name = v, 50), inp("Target role", () => d.title, v => d.title = v, 60, "Target role, e.g. Software Engineer Intern")),
    row(inp("Email", () => d.email, v => d.email = v, 80), inp("Phone", () => d.phone, v => d.phone = v, 20)),
    row(inp("City", () => d.city, v => d.city = v, 40), inp("Link (https://...)", () => d.link, v => d.link = v, 120, "LinkedIn or GitHub link (https://...)")),
    inp("Summary", () => d.summary, v => d.summary = v, 300, "Two lines about you", true),
    el("div", { class: "label" }, "Education"), ...d.edu.map((e, i) => row(inp("Degree " + (i + 1), () => e.a, v => e.a = v, 60, "Degree, e.g. B.Tech CSE"), inp("College " + (i + 1), () => e.b, v => e.b = v, 70, "College, year, CGPA"))),
    inp("Skills", () => d.skills, v => d.skills = v, 300, "Skills separated by commas", true),
    el("div", { class: "label" }, "Projects"), ...d.projects.map((p, i) => row(inp("Project " + (i + 1), () => p.a, v => p.a = v, 50, "Project name"), inp("What it does " + (i + 1), () => p.b, v => p.b = v, 160, "What you built and the result"))),
    el("div", { class: "label" }, "Experience and internships"), ...d.exp.map((p, i) => row(inp("Role " + (i + 1), () => p.a, v => p.a = v, 60, "Role, organisation"), inp("Details " + (i + 1), () => p.b, v => p.b = v, 160, "What you did"))),
    inp("Achievements", () => d.ach, v => d.ach = v, 300, "Achievements separated by commas", true));
  const tplBtn = (t, label) => el("button", { class: "btn sm" + (d.tpl === t ? " primary" : ""), type: "button", onclick: () => { d.tpl = t; save(); render(); } }, label);
  save();
  return [el("h2", {}, "📄 Resume builder"), el("p", { class: "hint" }, "One clean page that recruiters and applicant tracking systems can read. Saved only on this phone."),
    el("div", { class: "rowbtns" }, tplBtn("classic", "Classic"), tplBtn("modern", "Modern")), form, el("div", { class: "label" }, "Preview"), prev,
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: () => {
      const old = document.getElementById("resumePrint"); if (old) old.remove();
      const box = el("div", { id: "resumePrint" }, resumeDoc(d)); document.body.append(box); document.body.classList.add("printing-resume");
      const done = () => { document.body.classList.remove("printing-resume"); box.remove(); window.removeEventListener("afterprint", done); };
      window.addEventListener("afterprint", done); setTimeout(() => window.print(), 50);
    } }, "🖨️ Print / Save as PDF"), el("button", { class: "btn sm", type: "button", onclick: () => { if (confirm("Clear your resume?")) { localStorage.removeItem("dd-resume"); render(); } } }, "Clear"), back),
    el("p", { class: "hint" }, "Tip: keep it to one page, use numbers (for example 'cut load time by 30%'), and name the technologies you used.")];
}
// Weekly Plus leaderboard: points from focus minutes, mock tests, mistakes cleared and papers practised. Resets every Monday.
function renderWeeklyBoard() {
  const back = el("button", { class: "btn", type: "button", onclick: () => showPanel("plus") }, "Back");
  if (plusLocked()) return [el("h2", {}, "🏅 Weekly leaderboard"), el("p", { class: "hint" }, "The weekly leaderboard is for The Campus Loop Plus members."), el("div", { class: "rowbtns" }, back)];
  syncWeekly();
  const uid = store && store.authUid ? store.authUid() : "", rows = state.weekly.slice().sort((a, b) => b.points - a.points || a.updatedAt - b.updatedAt), mine = rows.findIndex(r => r.uid === uid), medal = ["🥇", "🥈", "🥉"];
  const left = (() => { const ms = weekStartMs() + 7 * 864e5 - Date.now(), d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5); return d + "d " + h + "h"; })();
  const next = mine > 0 ? rows[mine - 1].points - rows[mine].points + 1 : 0;
  return [el("h2", {}, "🏅 Weekly leaderboard"), el("p", { class: "hint" }, "Plus members of " + COLLEGE + ". Resets in " + left + "."),
    el("div", { class: "learn-card plus-list" }, el("strong", {}, mine >= 0 ? "You are #" + (mine + 1) + " with " + rows[mine].points + " points" : "You have " + weekPoints() + " points this week"),
      mine > 0 ? el("p", { class: "hint" }, next + " more point" + (next === 1 ? "" : "s") + " to pass " + rows[mine - 1].name + ".") : mine === 0 ? el("p", { class: "hint" }, "You lead the board. Wow, amazing! 🎉") : el("p", { class: "hint" }, "Do a focus round, mock test or paper to join the board.")),
    ...(rows.length ? rows.slice(0, 20).map((r, i) => el("div", { class: "lb-row" + (r.uid === uid ? " me" : "") }, el("span", { class: "lb-rank" }, medal[i] || String(i + 1)), el("span", { class: "lb-name" }, r.name + (r.uid === uid ? " (you)" : "")), el("b", {}, String(r.points)))) : [el("p", { class: "hint" }, "No scores yet this week. Be the first!")]),
    el("div", { class: "learn-card plus-list" }, el("strong", {}, "How points work"), el("p", { class: "hint" }, "⏱️ 5 minutes of focus = 1 point · 📝 a mock test = 20 · 📚 a paper practised = 10 · 📓 a mistake cleared = 2. Scores are reported by each phone, so play fair. 🙏")),
    el("div", { class: "rowbtns" }, back)];
}
const GOAL_DEFS = [["tests", "📝 Take 3 mock tests", 3], ["cleared", "📓 Clear 10 mistakes", 10], ["papers", "📚 Practise 2 papers", 2], ["mins", "⏱️ Focus for 120 minutes", 120]];
const PLUS_BADGES = [["🥉", "First mock", l => l.tests >= 1], ["🥈", "5 mocks done", l => l.tests >= 5], ["🏆", "Ace: 90%+ in a test", l => l.best >= 90], ["🧹", "Mistake slayer (20)", l => l.cleared >= 20], ["📚", "Paper warrior (10)", l => l.papers >= 10], ["🗓️", "Planner set", () => !!readJSON("dd-exam-plan", null)], ["⏱️", "Focused: 10 hours", l => (l.mins || 0) >= 600], ["🌳", "Family: 7 days", () => (readJSON("dd-visits", { n: 0 }).n || 0) >= 7], ["🏆", "Family: 30 days", () => (readJSON("dd-visits", { n: 0 }).n || 0) >= 30]];
function renderGoals() {
  const back = el("button", { class: "btn", type: "button", onclick: () => showPanel("plus") }, "Back");
  if (plusLocked()) return [el("h2", {}, "🎯 Goals and badges"), el("p", { class: "hint" }, "Goals and badges are part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  const g = goalStats(), l = lifeStats(), allDone = GOAL_DEFS.every(([k, , n]) => (g[k] || 0) >= n), got = PLUS_BADGES.filter(b => b[2](l)).length;
  return [el("h2", {}, "🎯 Goals and badges"), allDone ? el("div", { class: "wow", role: "status" }, el("span", { class: "wow-conf", "aria-hidden": "true" }, "🎉 🎊"), el("strong", {}, "Wow, all weekly goals done!")) : el("p", { class: "hint" }, "Weekly goals reset every Monday."),
    el("div", { class: "learn-card plus-list" }, el("strong", {}, "This week"), ...GOAL_DEFS.map(([k, label, n]) => { const v = Math.min(n, g[k] || 0), bar = el("div", { class: "mock-bar" }, el("span", {})); bar.firstChild.style.setProperty("width", Math.round(v * 100 / n) + "%"); return el("div", {}, el("div", { class: "rowbtns" }, el("span", {}, label), el("b", {}, v + "/" + n)), bar); })),
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: () => shareResult({ kicker: "My week on " + BRAND, emoji: "🔥", big: weekPoints() + " points", line: (g.mins || 0) + " focus minutes · " + (g.tests || 0) + " tests · " + (g.cleared || 0) + " mistakes fixed" }) }, "📤 Share my week")),
    el("div", { class: "label" }, "Badges (" + got + "/" + PLUS_BADGES.length + ")"),
    el("div", { class: "plus-tiles" }, ...PLUS_BADGES.map(([ic, name, ok]) => el("div", { class: "plus-tile badge" + (ok(l) ? " on" : ""), "aria-label": name + (ok(l) ? " unlocked" : " locked") }, el("span", { class: "pt-i", "aria-hidden": "true" }, ok(l) ? ic : "🔒"), el("strong", {}, name)))),
    el("div", { class: "rowbtns" }, back)];
}
// Mistake notebook: questions you missed come back until you answer them right.
function renderMistakes() {
  const back = el("button", { class: "btn", type: "button", onclick: () => { state.mist = null; showPanel("plus"); } }, "Back"), list = mistakeList();
  if (plusLocked()) return [el("h2", {}, "📓 Mistake notebook"), el("p", { class: "hint" }, "The mistake notebook is part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  if (!list.length) return [el("h2", {}, "📓 Mistake notebook"), el("p", { class: "hint" }, "Nothing here yet. Questions you get wrong in a mock test are saved here so you can practise them again."), el("div", { class: "rowbtns" }, back)];
  const st = state.mist || (state.mist = { i: Math.floor(Math.random() * list.length), pick: -1 });
  const q = list[st.i % list.length], answered = st.pick >= 0;
  const next = () => { st.i = Math.floor(Math.random() * Math.max(1, mistakeList().length)); st.pick = -1; render(); };
  return [el("h2", {}, "📓 Mistake notebook (" + list.length + ")"), el("p", { class: "hint" }, q.s + ". Answer right to remove it from the notebook."), el("p", {}, q.q),
    ...q.o.map((o, k) => el("button", { class: "btn" + (answered && k === q.a ? " primary" : ""), type: "button", disabled: answered ? "" : null, onclick: () => {
      st.pick = k; if (k === q.a) { writeJSON("dd-mistakes", mistakeList().filter(x => x.q !== q.q)); bump("cleared", 1); } render(); } }, (answered && k === st.pick && k !== q.a ? "✖ " : answered && k === q.a ? "✔ " : "") + o)),
    answered ? el("p", { class: "hint" }, (st.pick === q.a ? "Correct! Removed from your notebook. " : "Not quite. ") + (q.e || "")) : null,
    el("div", { class: "rowbtns" }, answered ? el("button", { class: "btn primary", type: "button", onclick: next }, "Next") : null, el("button", { class: "btn sm", type: "button", onclick: () => { if (confirm("Clear the whole notebook?")) { writeJSON("dd-mistakes", []); state.mist = null; render(); } } }, "Clear all"), back)].filter(Boolean);
}
// Exam planner: turns an exam date and subject list into a day-by-day plan with spaced revision (1, 3 and 7 days later).
function buildPlan(subjects, examDate) {
  const days = Math.min(30, Math.max(0, Math.ceil((examDate - new Date().setHours(0, 0, 0, 0)) / 864e5))), out = [], studied = [];
  for (let d = 0; d < days; d++) {
    const left = days - d, items = [];
    if (left <= 2) items.push(left === 1 ? "🧪 Light revision + sleep early" : "📝 Full mock test + fix mistakes");
    else {
      const s = subjects[d % subjects.length]; items.push("📖 Study: " + s); studied[d] = s;
      for (const gap of [1, 3, 7]) if (studied[d - gap] && d - gap >= 0) items.push("🔁 Revise: " + studied[d - gap]);
    }
    out.push({ date: new Date(new Date().setHours(0, 0, 0, 0) + d * 864e5), items });
  }
  return out;
}
function renderPlanner() {
  const back = el("button", { class: "btn", type: "button", onclick: () => showPanel("plus") }, "Back");
  if (plusLocked()) return [el("h2", {}, "🗓️ Exam planner"), el("p", { class: "hint" }, "The exam planner is part of The Campus Loop Plus."), el("div", { class: "rowbtns" }, back)];
  const saved = readJSON("dd-exam-plan", null) || {}, name = el("input", { maxlength: "40", placeholder: "Exam name, e.g. Semester 3", value: saved.name || "", "aria-label": "Exam name" }),
    date = el("input", { type: "date", value: saved.date || "", "aria-label": "Exam date" }), subs = el("textarea", { maxlength: "300", placeholder: "Subjects, separated by commas", "aria-label": "Subjects" }, saved.subjects || ""),
    msg = el("p", { class: "hint", role: "status" }, "");
  const out = el("div", {});
  const draw = () => {
    const p = readJSON("dd-exam-plan", null); if (!p || !p.date) { out.replaceChildren(); return; }
    const subjects = String(p.subjects || "").split(",").map(x => x.trim().slice(0, 30)).filter(Boolean).slice(0, 12), t = new Date(p.date + "T00:00:00").getTime(), left = Math.ceil((t - new Date().setHours(0, 0, 0, 0)) / 864e5);
    if (!subjects.length) { out.replaceChildren(el("p", { class: "hint" }, "Add at least one subject.")); return; }
    if (left < 0) { out.replaceChildren(el("p", { class: "hint" }, "That date has passed. Pick the next exam date.")); return; }
    const plan = buildPlan(subjects, t);
    out.replaceChildren(el("div", { class: "learn-card plus-list" }, el("strong", {}, "⏳ " + (p.name || "Your exam") + ": " + (left === 0 ? "today" : left + " day" + (left === 1 ? "" : "s") + " to go")),
      ...plan.map((d, i) => el("p", { class: i === 0 ? "plan-today" : "hint" }, (i === 0 ? "Today · " : d.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) + " · ") + d.items.join("  ·  "))),
      left > 30 ? el("p", { class: "hint" }, "Showing the next 30 days.") : null));
  };
  draw();
  return [el("h2", {}, "🗓️ Exam planner"), el("p", { class: "hint" }, "Enter your exam date and subjects. You get a daily plan with revision after 1, 3 and 7 days, and a mock test two days before."),
    name, date, subs,
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: () => {
      if (!date.value) { msg.textContent = "Pick the exam date."; return; } if (!subs.value.trim()) { msg.textContent = "Write your subjects."; return; }
      writeJSON("dd-exam-plan", { name: name.value.trim().slice(0, 40), date: date.value, subjects: subs.value.trim().slice(0, 300) }); msg.textContent = "✅ Plan saved on this phone."; draw();
    } }, "Make my plan"), back), msg, out].filter(Boolean);
}
// "Verify your email" (any email works, such as Gmail or a college address): a sign-in link is sent to the email; tapping it proves the student owns that address.
function verifyBlock() {
  const acct = myAccount(), ok = myVerified(), doms = COLLEGE_DOMAINS;
  if (ok) return el("div", { class: "learn-card" }, el("strong", {}, "✅ Verified student"), el("p", { class: "hint" }, acct.email.replace(/^(.).*(@.*)$/, "$1•••$2") + " · other students see a ✔ next to your name."));
  const email = el("input", { type: "email", name: "vemail", maxlength: "100", placeholder: (TENANT && TENANT.requireVerified && doms.length) ? "you@" + doms[0] : "your email, for example you@gmail.com", "aria-label": "Your email", autocomplete: "email" });
  const msg = el("p", { class: "hint", role: "status" }, state.mailMsg || (acct.verified && !ok ? "This board needs an email from " + COLLEGE + ". Use your college email." : ""));
  const send = el("button", { type: "button", class: "btn sm primary", onclick: async () => {
    const e = email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { msg.textContent = "Type a valid email address."; return; }
    if (!emailDomainOk(e)) { msg.textContent = "This board needs your " + COLLEGE + " email (ending " + doms.map(d => "@" + d).join(", ") + ")."; return; }
    if (!store || !store.sendEmailLink) { msg.textContent = "Email verification needs the live board. Connect to the internet and try again."; return; }
    send.disabled = true; msg.textContent = "Sending…";
    try { await store.sendEmailLink(e); state.mailMsg = "📧 Link sent to " + e + ". Open it on this phone to finish. Check spam too."; msg.textContent = state.mailMsg; }
    catch (err) { msg.textContent = err && err.code === "auth/operation-not-allowed" ? "Email sign-in is not switched on yet for this app. Please tell the admin." : err && err.code === "auth/unauthorized-continue-uri" ? "This website address is not allowed for email links yet. Please tell the admin." : "Could not send the email. Check your internet and try again."; }
    send.disabled = false;
  } }, "Send verification link");
  return el("div", { class: "learn-card" }, el("strong", {}, "✔ Verify your email"),
    el("p", { class: "hint" }, "Optional. Any email works: Gmail, Yahoo, a college address or another one. Verified students get a ✔, can use cloud backup and can post on boards that need it." + ((TENANT && TENANT.requireVerified && doms.length) ? " This board needs an email ending " + doms.map(d => "@" + d).join(" or ") + "." : "")),
    email, el("div", { class: "rowbtns" }, send), msg);
}
function renderMe() {
  const p = (store && allStats().get(store.uid)) || { name: getName(), points: 0, answers: 0, helpful: 0, ideas: 0, quizRight: 0, streak: 0, reacts: 0, likes: 0, asked: 0, quizDone: 0, level: levelOf(0) };
  const lv = p.level, pct = Math.round((p.points - lv.from) * 100 / (lv.to - lv.from));
  // Avatar picker, 3D portraits + emoji
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
      avatarEl(cur, "av av-hero" + (store ? frameOf(store.uid) : "")),
      el("div", {},
        el("h2", {}, (getName() || "You") + " · Level " + lv.n),
        el("p", { class: "hint" }, titleOf(p.points) + " · " + plural(p.points, "point")))),
    el("p", { class: "hint" }, "📷 Your profile photo (everyone can see it next to your posts)"),
    el("div", { class: "rowbtns" }, el("button", { type: "button", class: "btn sm primary", onclick: pickDp }, getDp() ? "Change photo" : "Upload photo"), getDp() && el("button", { type: "button", class: "btn sm", onclick: removeDp }, "Remove photo")),
    state.dpMsg && el("p", { class: "hint", role: "status" }, state.dpMsg),
    streakCard(),
    battleCard(),
    inviteCard(),
    plusCard(),
    verifyBlock(),
    el("p", { class: "hint" }, "💬 Your status (shown on your stories)"),
    (() => { const inp = el("input", { type: "text", maxlength: "60", placeholder: "e.g. Busy with exams 📚", "aria-label": "Your status", value: getStatus() }); const save = async () => { try { localStorage.setItem("dd-status", inp.value.trim().slice(0, 60)); } catch (_) {} state.dpMsg = "✅ Status saved on this phone."; render(); try { await syncProfile(); state.dpMsg = "✅ Status saved and shared."; } catch (e) { state.dpMsg = "📱 Status saved on this phone, but sharing failed: " + errText(e); } render(); };
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
      el("p", { class: "hint" }, "Mentors, send this ID to the board's teacher so your answers show the mentor badge. It identifies this phone or computer."),
      el("div", { class: "rowbtns" }, el("code", { class: "devid" }, store.uid), el("button", { class: "btn sm", type: "button", onclick: (e) => copyLink(e.currentTarget, store.uid) }, "Copy ID"))),
    el("div", { class: "label" }, "📅 Activity, last 30 days"),
    renderHeatmap(p),
    el("div", { class: "label" }, "Badges"),
    el("div", { class: "badges" }, BADGES.map(([icon, name, how, test]) => el("div", { class: "badge" + (test(p) ? " got" : "") }, el("span", { class: "bicon" }, icon), el("b", {}, name), el("small", {}, how)))),
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "button", onclick: () => { state.mode = "quiz"; render(); } }, "🧠 Today's quiz"),
      el("button", { class: "btn", type: "button", onclick: () => showHowTo() }, "\u{1F4D6} How to use the app"),
      el("button", { class: "btn", type: "button", onclick: reportProblem }, "\u{1F41E} Report a problem"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = "learn"; render(); } }, "📚 Learn from IIT"),
      el("button", { class: "btn", type: "button", onclick: () => { state.afterName = "me"; state.mode = "name"; render(); } }, "Change name"),
      PRIVATE && el("button", { class: "btn", type: "button", onclick: () => { setCode(""); location.reload(); } }, "Change class code"),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
    idCard(), handleCard(),
    logoutBlock(),
  ];
}
// Log out: signs out of the email account (if any) and clears this device, so the next person starts fresh.
function logoutBlock() {
  const acc = store && store.account ? store.account() : { email: "", verified: false };
  const msg = el("p", { class: "hint", role: "status" });
  const go = async () => {
    try { if (store && store.signOutAll) await store.signOutAll(); } catch (_) {}
    try { Object.keys(localStorage).filter(k => k.startsWith("dd-") || k === "spark-theme").forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); } catch (_) {}
    try { if (window.indexedDB && indexedDB.databases) (await indexedDB.databases()).forEach(d => d.name && /firebase/i.test(d.name) && indexedDB.deleteDatabase(d.name)); } catch (_) {}
    location.replace(location.origin + location.pathname);
  };
  const ask = () => {
    const close = () => ov.remove(), text = acc.verified ? "You will be signed out of " + acc.email + " and this device will be cleared. Sign in again with the same email to get your points back." : "This clears your name, college and progress from this device. Without a verified email your points cannot be restored.";
    const ov = el("div", { class: "welcome", role: "dialog", "aria-modal": "true", "aria-label": "Log out" }, el("div", { class: "welcome-card" },
      el("div", { class: "welcome-icon", "aria-hidden": "true" }, "\u{1F6AA}"), el("h2", {}, "Log out?"), el("p", { class: "ob-say" }, text),
      el("div", { class: "rowbtns" }, el("button", { class: "btn danger", type: "button", onclick: go }, "Yes, log out"), el("button", { class: "btn primary", type: "button", onclick: close }, "Stay signed in"))));
    document.body.append(ov);
  };
  return el("div", { class: "logout-block" }, el("div", { class: "acct-head" }, el("span", { class: "acct-ic", "aria-hidden": "true" }, "\u{1F464}"), el("div", {}, el("strong", { class: "acct-title" }, "Account"), el("small", { class: "acct-sub" }, acc.verified ? "Signed in as " + acc.email + " \u2714 verified" : "This device only. Verify your email to keep your points safe."))),
    el("button", { class: "btn logout-btn", type: "button", onclick: ask }, "\u{1F6AA} Log out"), msg);
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
    el("div", { class: "label" }, needsMentor(d) ? "⏳ Waiting 2+ days, get expert help" : "Get help from IIT experts"),
    el("div", { class: "rowbtns" },
      el("a", { class: "btn sm", href: nptelUrl(g), target: "_blank", rel: "noopener noreferrer", onclick: () => { try { navigator.clipboard.writeText(text); } catch (_) {} } }, "🎓 Ask on IIT NPTEL forum"),
      outLink(lectureUrl(g, d.title), "▶ Watch IIT lecture")),
    el("p", { class: "hint" }, "\u201cAsk on IIT NPTEL forum\u201d copies this doubt and opens the IIT course for " + g + ". Enrol free, open the course forum, and paste it there."));
}

// RGUKT subjects by year, branch and campus (from the RGUKT draft timetable: subject names and codes only, no exam dates).
const curState = { year: "E1", branch: "", campus: "ALL", open: null };
// Official RGUKT syllabus documents (links found on the RGUKT websites). Branches with no published file point to the campus curriculum pages.
const RGUKT_SYLLABUS = {
  CSE: ["https://rguktsklm.ac.in/inti_main/uploads/media/bos/BoS%20CSE.pdf", "Computer Science syllabus (2023-24, RGUKT-AP)"],
  ECE: ["https://rguktsklm.ac.in/inti_main/uploads/media/bos/ECE%20BoS.pdf", "Electronics and Communication syllabus (RGUKT-AP)"],
  CE: ["https://rguktsklm.ac.in/inti_main/uploads/media/bos/Civil%20BoS.pdf", "Civil Engineering syllabus (2023-24, RGUKT-AP)"],
  ME: ["https://www.rgukt.in/pdfdoc/BOS-2%20minutes/Mechanical/Curriculam-Final-AY%202023-24.pdf", "Mechanical syllabus (AY 2023-24, RGUKT-AP)"],
};
const RGUKT_SYLLABUS_PAGES = [["https://rguktsklm.ac.in/academics/cirriculums", "Srikakulam: all curriculums"], ["https://www.rguktrkv.ac.in/Academics.php?view=Curriculum", "RK Valley: curriculum"], ["https://rguktn.ac.in/academics/programmes/", "Nuzvid: programmes"]];
const unitKey = (code) => "dd-units-" + String(code).replace(/[^A-Za-z0-9]/g, "").slice(0, 24);
// One subject: its official syllabus, then six units (two per mid exam) with a tick list and study links for each unit.
let _unitsLoading = false;
function loadUnits() {
  if (window.RGUKT_UNITS || _unitsLoading) return; _unitsLoading = true;
  const sc = document.createElement("script"); sc.src = "rgukt-units.js?v=" + ((document.querySelector('script[src^="app.js"]') || {}).src || "").split("v=")[1];
  sc.onload = () => { if (state.mode === "curriculum") render(); }; sc.onerror = () => { window.RGUKT_UNITS = {}; }; document.head.append(sc);
}
function renderSubject(C, r) {
  loadUnits();
  const [name, code, credits, cat] = r, key = unitKey(code), U = window.RGUKT_UNITS || {}, found = code.split("/").map(x => x.trim().toUpperCase()).map(c => U[c]).find(Boolean), unitInfo = (n) => found && Array.isArray(found.n) ? found.n.find(u => u && u.u === n) : null, done = readJSON(key, []).filter(n => Number.isInteger(n) && n >= 1 && n <= 6);
  const pdf = RGUKT_SYLLABUS[curState.branch];
  const unitUrl = (n, kind) => kind === "v" ? lectureUrl(name, "unit " + n) : "https://www.google.com/search?q=" + encodeURIComponent(name + " unit " + n + " notes filetype:pdf");
  const toggle = (n) => { const cur = new Set(readJSON(key, [])); cur.has(n) ? cur.delete(n) : cur.add(n); writeJSON(key, [...cur]); render(); };
  const mids = [["Mid 1", [1, 2]], ["Mid 2", [3, 4]], ["Mid 3", [5, 6]]];
  return [
    el("h2", {}, "\u{1F4D8} " + name),
    el("p", { class: "hint" }, code + " · " + credits + " credit" + (credits === 1 ? "" : "s") + " · " + yl(curState.year) + " · " + (C.branches[curState.branch] || curState.branch)),
    el("div", { class: "guide-card" },
      el("div", { class: "guide-head" }, el("span", { class: "guide-ic", "aria-hidden": "true" }, "\u{1F4C4}"), el("div", {}, el("small", {}, "OFFICIAL SYLLABUS"), el("strong", {}, "Unit-wise topics are in the RGUKT document"))),
      el("p", { class: "hint" }, found ? "Unit topics below come from the official RGUKT syllabus. The PDF has the full detail. Look for " : "Open the syllabus PDF from the RGUKT website and look for " + code.split(" / ")[0] + ". It lists the topics of every unit."),
      el("div", { class: "rowbtns" }, pdf ? outLink(pdf[0], "\u{1F4C4} " + pdf[1], "btn sm primary") : null, ...(pdf ? [] : RGUKT_SYLLABUS_PAGES.map(([u, t]) => outLink(u, "\u{1F517} " + t, "btn sm primary")))),
      pdf ? null : el("p", { class: "hint" }, "The syllabus file for this branch is not published as one PDF. Use these official curriculum pages."),
      el("p", { class: "guide-safe" }, el("b", {}, "Stay safe: "), "Download syllabus files only from the official RGUKT links above. Links open in a new tab.")),
    (() => { const lc = name.toLowerCase(), hit = (window.CURIO && window.CURIO.uses || []).find(u => lc.includes(u[0])); if (!window.CURIO) loadCurio(); return hit ? el("div", { class: "learn-card curio-card" }, el("small", { class: "tag" }, "\u{1F30D} WHERE IS THIS USED?"), el("p", {}, hit[1])) : null; })(),
    el("div", { class: "label" }, "Your unit tracker (" + done.length + " of 6 done)"),
    el("div", { class: "pq-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "6", "aria-valuenow": String(done.length) }, el("i", { style: "width:" + Math.round(done.length / 6 * 100) + "%" })),
    ...mids.map(([label, units]) => el("div", { class: "learn" }, el("small", { class: "hint" }, label + " covers units " + units.join(" and ")), ...units.map(n => el("div", { class: "learn-card" },
      unitInfo(n) ? el("p", { class: "unit-topics" }, el("b", {}, "Unit " + n + (unitInfo(n).t ? ": " + String(unitInfo(n).t) : "")), el("span", {}, String(unitInfo(n).x || ""))) : null,
      el("div", { class: "rowbtns" }, el("button", { class: "btn sm" + (done.includes(n) ? " primary" : ""), type: "button", "aria-pressed": String(done.includes(n)), onclick: () => toggle(n) }, (done.includes(n) ? "✓ " : "") + "Unit " + n), outLink(unitUrl(n, "v"), "▶ Videos", "linkbtn"), outLink(unitUrl(n, "p"), "\u{1F4C4} Notes PDF", "linkbtn")))))),
    el("div", { class: "rowbtns" },
      el("button", { class: "btn sm primary", type: "button", onclick: () => { openLoopySearch(name, "curriculum"); } }, "\u{1F50E} Loopy AI Search"),
      outLink(nptelUrl(name), "\u{1F393} Full IIT course", "btn sm"),
      el("button", { class: "btn sm", type: "button", onclick: () => { state.tab = "doubts"; state.group = "All"; state.filter = "all"; state.query = name; state.selected = null; state.mode = "intro"; render(); } }, "\u{1F50E} Doubts on this"),
      el("button", { class: "btn", type: "button", onclick: () => { curState.open = null; render(); } }, "Back to subjects")),
    el("p", { class: "hint" }, "Video and notes buttons open a search for this subject and unit. Pick sources from IITs, NPTEL, university sites and well known teachers. Your ticks are saved on this device only."),
  ];
}
function renderCurriculum() {
  const C = window.RGUKT_CURRICULUM;
  if (!C) return [el("h2", {}, "RGUKT subjects"), el("p", { class: "hint" }, "Not available right now."), el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")];
  const yrs = Object.keys(C.years), brs = Object.keys(C.data[curState.year] || {});
  if (!brs.includes(curState.branch)) curState.branch = brs[0] || "";
  const rows = ((C.data[curState.year] || {})[curState.branch] || []).filter(r => curState.campus === "ALL" || r[4] === "ALL" || String(r[4]).split(",").includes(curState.campus));
  const chip = (label, on, fn) => el("button", { type: "button", class: "btn sm" + (on ? " primary" : ""), onclick: fn }, label);
  const camps = Object.entries(C.campuses);
  if (curState.open != null && rows[curState.open]) return renderSubject(C, rows[curState.open]);
  const catName = { BSC: "Basic Science", ESC: "Engineering Science", PCC: "Core", PEC: "Professional Elective", OEC: "Open Elective", MC: "Mandatory", HSC: "Humanities", HSMC: "Humanities" };
  return [
    el("h2", {}, "\u{1F4D8} RGUKT subjects"),
    el("p", { class: "hint" }, "Subjects and subject codes by year, branch and campus, taken from the RGUKT timetable. Use it as a reference. Check the official RGUKT notices for the final list."),
    el("div", { class: "label" }, "Year"),
    el("div", { class: "rowbtns" }, ...yrs.map(y => chip(yl(y) + " \u00B7 " + C.years[y], curState.year === y, () => { curState.year = y; curState.open = null; render(); }))),
    el("div", { class: "label" }, "Branch"),
    el("div", { class: "rowbtns" }, ...brs.map(b => chip(b, curState.branch === b, () => { curState.branch = b; curState.open = null; render(); }))),
    curState.year === "E3" || curState.year === "E4" ? el("div", { class: "label" }, "Campus") : null,
    curState.year === "E3" || curState.year === "E4" ? el("div", { class: "rowbtns" }, chip("All", curState.campus === "ALL", () => { curState.campus = "ALL"; curState.open = null; render(); }), ...camps.map(([k, v]) => chip(v, curState.campus === k, () => { curState.campus = k; curState.open = null; render(); }))) : el("p", { class: "hint" }, "Years B.Tech 1st and 2nd year are the same on every campus."),
    el("p", { class: "hint" }, rows.length + " subject" + (rows.length === 1 ? "" : "s") + " \u00B7 " + (C.branches[curState.branch] || curState.branch) + " \u00B7 " + yl(curState.year)),
    el("div", { class: "learn" }, rows.length ? rows.map((r, ri) => el("div", { class: "learn-card" },
      el("span", { class: "tag" }, r[1]),
      el("strong", {}, r[0]),
      el("small", { class: "hint" }, [r[2] + " credit" + (r[2] === 1 ? "" : "s"), catName[r[3]] || r[3], r[4] === "ALL" ? "All campuses" : String(r[4]).split(",").map(c => C.campuses[c] || c).join(", ")].join(" \u00B7 ")),
      el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { curState.open = ri; render(); const sh = $("sheet"); if (sh) sh.scrollIntoView({ block: "start" }); } }, "\u{1F4D6} Syllabus and units"), el("button", { class: "linkbtn", type: "button", onclick: () => { state.tab = "doubts"; state.group = "All"; state.filter = "all"; state.query = r[0]; state.selected = null; state.mode = "intro"; render(); } }, "\u{1F50E} Doubts on this"), outLink(lectureUrl(r[0]), "\u25B6 Lectures", "linkbtn"), outLink(nptelUrl(r[0]), "\u{1F393} IIT course", "linkbtn")))) : [el("p", { class: "hint" }, "No subjects listed here for this campus.")]),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}
function renderLearn() {
  const pending = state.doubts.filter(needsMentor).sort((a, b) => a.createdAt - b.createdAt);
  const msg = "Hi! Students of G Block Mind Hub need help with these doubts:\n" + pending.slice(0, 10).map((d, i) => (i + 1) + ". [" + d.subject + "] " + d.title + " " + location.origin + location.pathname + "#doubts/" + d.id).join("\n") + "\nThe class code is needed to open them. Thank you!";
  return [
    IS_RGUKT ? el("button", { class: "btn primary", type: "button", onclick: () => { state.mode = "curriculum"; render(); } }, "\u{1F4D8} RGUKT subjects by year, branch and campus") : null,
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
  const name = d.title.replace(/^🎓\s*/, "").split(", ")[0];
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
    el("p", { class: "hint" }, "Meet seniors from " + COLLEGE + " who graduated and are now working, studying or building startups. Ask for guidance, referrals and advice. Profiles are shared by the alumni themselves, so check their LinkedIn before trusting any offer, and never pay anyone for a job."),
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
    out.push(...(profiles.length ? profiles.map(alumniProfileCard) : [el("div", { class: "empty" }, el("strong", {}, "No alumni profiles here yet"), "Are you an alumnus of " + COLLEGE + "? Tap “I'm an alumnus: join” and help your juniors.")]));
  } else if (alumniView === "jobs") {
    out.push(...(jobs.length ? jobs.map(alumniJobCard) : [el("div", { class: "empty" }, el("strong", {}, "No jobs or referrals yet"), "Alumni can post openings and referrals here for " + COLLEGE + " students.")]));
  } else if (alumniView === "admin" && isAdmin()) {
    out.push(el("p", { class: "hint" }, "Review each profile or job before approving. Check the LinkedIn link and make sure the person is really an alumnus of " + COLLEGE + ". Approved profiles are shown to all students."));
    out.push(...(pending.length ? pending.map(d => isAlumniProfile(d) ? alumniProfileCard(d) : alumniJobCard(d)) : [el("div", { class: "empty" }, el("strong", {}, "Nothing waiting"), "All alumni profiles and jobs are reviewed.")]));
  } else {
    out.push(...(questions.length ? questions.map(d => el("div", { class: "learn-card" }, el("strong", {}, d.title), el("p", { class: "hint" }, "By " + who(d) + " · " + ago(d.createdAt) + " · " + repliesFor(d.id).length + " replies"), el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => openAlumniPost(d.id) }, "Open")))) : [el("div", { class: "empty" }, el("strong", {}, "No questions yet"), "Tap “Ask alumni” to ask the first one.")]));
  }
  out.push(
    el("div", { class: "label" }, "💬 How to message an alumnus"),
    el("p", { class: "hint" }, "“Hello sir/madam, I'm [name], E[year] [branch] at [college]. I'm interested in [role/field] and saw you work at [company]. Could you spare 10 minutes to guide me on [specific question]? Thank you!” Keep it short, specific and polite."),
    el("div", { class: "label" }, "🔎 Find more " + COLLEGE + " alumni (free)"),
    el("div", { class: "rowbtns" },
      outLink("https://www.linkedin.com/search/results/people/?keywords=" + encodeURIComponent(COLLEGE), "LinkedIn: search " + COLLEGE, "linkbtn"),
      outLink("https://www.linkedin.com/search/results/groups/?keywords=" + encodeURIComponent(COLLEGE), "LinkedIn groups", "linkbtn"),
      outLink("https://adplist.org", "ADPList free mentors", "linkbtn"),
      IS_RGUKT && outLink("https://www.rguktn.ac.in", "RGUKT Nuzvid", "linkbtn"),
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
      title = ("💼 " + role + ", " + company).slice(0, 200);
      lines = ["Company: " + company, val("location") && "Location: " + val("location"), val("experience") && "Experience: " + val("experience"), apply && "Apply: " + apply, val("details") && "Details: " + val("details").replace(/\n+/g, " ")].filter(Boolean);
    } else {
      const name = val("name"), working = val("working"), linkedin = val("linkedin");
      if (name.length < 2) return bad("Enter your name.");
      if (working.length < 2) return bad("Tell us where you work or study.");
      if (linkedin && !LINKEDIN_RE.test(linkedin)) return bad("LinkedIn link must look like https://www.linkedin.com/in/your-name");
      if (!f.consent.checked) return bad("Please tick the box to confirm you agree to show these details.");
      const help = ALUMNI_HELP.filter((h, i) => f["help" + i] && f["help" + i].checked).join(", ");
      title = ("🎓 " + name + ", " + val("branch") + " · Batch " + val("batch")).slice(0, 200);
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
      el("div", { class: "checks" }, el("label", { class: "check" }, el("input", { type: "checkbox", name: "consent" }), "I agree to show my name, work details and LinkedIn to " + COLLEGE + " students. I will not share my phone number publicly.")),
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
// Official YouTube jukeboxes. These are copyrighted songs streamed by the rights holders on YouTube; The Campus Loop only links out.
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
    el("p", { class: "hint" }, "Watch movies only in theatres or on official OTT apps. Piracy sites are illegal and often carry viruses and scams. The Campus Loop does not host any movie."));
}

function memoryGame() {
  const EMOJI = ["", "🧠", "💡", "🎯", "📚", "⚡", "🔬", "🎓"];
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
    if (view === "player") body.replaceChildren(window.SparkPlayer ? window.SparkPlayer.mount() : (needLazy(), el("p", { class: "hint" }, "Loading the music player\u2026")));
    else if (view === "movies") body.replaceChildren(moviesView());
    else if (view === "music") {
      body.replaceChildren(
        chillPlayer(),
        el("div", { class: "label" }, "🎬 Music director and singer jukeboxes"),
        el("p", { class: "hint" }, "Tap a name to open official jukeboxes on YouTube. These are copyrighted songs streamed by the rights holders, so The Campus Loop only links to them. Listen on YouTube with low volume and earphones."),
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
    el("p", { class: "hint" }, "Power tools for students. Everything is saved only on this phone, and the focus timer keeps running while you use other parts of CampusLoop."),
    window.SparkLab ? window.SparkLab.mount() : (needLazy(), el("p", { class: "hint" }, "Loading the Study Lab\u2026")),
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}

// ---------- about us ----------
// ---------- college switcher and "add my college" requests ----------
let collegeRows = null;
async function fetchColleges() {
  if (collegeRows) return collegeRows;
  const fb = BASE_CFG.firebase || {};
  const r = await fetch("https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(fb.projectId || "") + "/databases/(default)/documents/colleges?pageSize=100&key=" + encodeURIComponent(fb.apiKey || ""));
  if (!r.ok) throw new Error("status " + r.status);
  const j = await r.json();
  collegeRows = (j.documents || []).map(d => ({ slug: String(d.name || "").split("/").pop(), ...fsDoc(d) }))
    .filter(c => /^[a-z0-9-]{2,40}$/.test(c.slug) && c.enabled !== false && c.listed !== false && typeof c.name === "string")
    .map(c => ({ slug: c.slug, name: t1(c.name, 60), city: t1(c.city, 40), state: t1(c.state, 50) })).sort((a, b) => a.name.localeCompare(b.name));
  return collegeRows;
}
function switchCollege(slug) { location.href = location.pathname + "?c=" + encodeURIComponent(slug); }
function renderCollege() {
  const cur = TENANT ? TENANT.slug : IS_RGUKT ? "rgukt" : "", list = el("div", { class: "college-list" }, el("p", { class: "hint" }, "Loading colleges…"));
  const btn = (slug, name, sub, st) => {
    const [ca, cb] = slug === "rgukt" ? STATE_COLORS["Andhra Pradesh"] : collegeColors(slug, st || "");
    const ini = name.replace(/\(.*?\)/g, "").split(/[\s-]+/).filter(w => /^[A-Za-z]/.test(w) && !/^(of|and|the|for|in)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "C";
    const badge = el("span", { class: "col-badge", "aria-hidden": "true" }, ini); badge.style.setProperty("background", "linear-gradient(135deg," + ca + "," + cb + ")");
    const b = el("button", { type: "button", class: "campus-link col-row" + (slug === cur ? " sel" : ""), onclick: () => { if (slug !== cur) switchCollege(slug); else { state.mode = "intro"; render(); } } },
      badge, el("span", { class: "col-text" }, el("strong", {}, (slug === cur ? "✅ " : "") + name), sub ? el("small", {}, sub) : null));
    b.style.setProperty("--row", ca); return b;
  };
  let online = [], q = "", stateSel = "Andhra Pradesh";
  try { stateSel = localStorage.getItem("dd-state") || stateSel; } catch (_) {}
  const entries = () => {
    const m = new Map();
    for (const d of DIRECTORY) m.set(d.slug, { slug: d.slug, name: d.name, state: d.state || "Andhra Pradesh", sub: [d.city, d.kind].filter(Boolean).join(" · ") });
    for (const c of online) m.set(c.slug, { slug: c.slug, name: c.name, state: c.state || (m.get(c.slug) || {}).state || "", sub: c.city || (m.get(c.slug) || {}).sub || "" });
    m.delete("rgukt");
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  };
  const rgukt = { slug: "rgukt", name: "RGUKT AP", state: "Andhra Pradesh", sub: "Rajiv Gandhi University of Knowledge Technologies, Andhra Pradesh" };
  const stCounts = () => { const c = {}; for (const x of [rgukt, ...entries()]) c[x.state] = (c[x.state] || 0) + 1; return c; };
  const stateSelect = stateSheet(() => stateSel, (v) => { stateSel = v; try { localStorage.setItem("dd-state", stateSel); } catch (_) {} fill(); }, (s) => stCounts()[s] || 0);
  const drawStates = () => { stateSelect.sync(); };
  const fill = () => {
    drawStates();
    const needle = q.trim().toLowerCase(), all = [rgukt, ...entries()];
    if (stateSel === "All India" && !needle) { list.replaceChildren(el("p", { class: "hint" }, "Type a college name or city above to search all of India, or pick a state.")); return; }
    const rows = all.filter(c => (stateSel === "All India" || c.state === stateSel) && (!needle || (c.name + " " + c.sub + " " + c.slug).toLowerCase().includes(needle)));
    list.replaceChildren(...(rows.length ? rows.map(c => btn(c.slug, c.name, stateSel === "All India" && c.state ? c.state + " · " + c.sub : c.sub, c.state)) : [el("p", { class: "hint" }, "No college found here. Try another state, or use the form below to ask for your college.")]));
  };
  const search = el("input", { type: "search", placeholder: "Search your college or city…", "aria-label": "Search colleges", oninput: (e) => { q = e.target.value; fill(); } });
  fill();
  fetchColleges().then(rows => { online = rows; fill(); }).catch(() => {});
  const name = el("input", { name: "cname", maxlength: "80", placeholder: "College or university name", required: true, "aria-label": "College name" });
  const city = el("input", { name: "ccity", maxlength: "60", placeholder: "City and state", "aria-label": "City" });
  const role = el("select", { name: "crole", "aria-label": "Your role" }, ["Student", "Teacher or staff", "Club or student body", "Other"].map(r => el("option", {}, r)));
  const contact = el("input", { name: "ccontact", maxlength: "100", placeholder: "Email or phone (optional)", "aria-label": "Contact" });
  const consent = el("input", { type: "checkbox", name: "cconsent" }), msg = el("p", { class: "hint", role: "status" });
  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault(); msg.textContent = "";
    const n = name.value.trim(); if (n.length < 3) { msg.textContent = "Write the college name."; return; }
    if (!consent.checked) { msg.textContent = "Please tick the box so we may contact you."; return; }
    if (hasBadWords(n + " " + city.value)) { msg.textContent = LANGUAGE_MSG; return; }
    try { if (Date.now() - Number(localStorage.getItem("dd-college-req") || 0) < 86400000) { msg.textContent = "You already sent a request today. Thank you!"; return; } } catch (_) {}
    if (!store || !store.setTop) { msg.textContent = "Requests need the live board. Connect to the internet and try again."; return; }
    try {
      const id = store.newId("collegeRequests");
      await store.setTop("collegeRequests", id, { name: n.slice(0, 80), city: city.value.trim().slice(0, 60), role: role.value, contact: contact.value.trim().slice(0, 100), consent: true, createdAt: Date.now() });
      try { localStorage.setItem("dd-college-req", String(Date.now())); } catch (_) {}
      msg.textContent = "✅ Thank you! We will contact you when " + n.slice(0, 60) + " is ready."; form.reset();
    } catch (err) { msg.textContent = err && err.code === "permission-denied" ? "We could not save your request right now because the board is still being updated. Please try again in a little while." : "We could not send your request. Check your internet and try again."; }
  } }, name, city, role, contact, el("label", { class: "check" }, consent, "I agree that " + BRAND + " may contact me about this request."), el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "submit" }, "Send request")), msg);
  return [
    el("h2", {}, "🏫 Your college"),
    el("p", { class: "hint" }, "Each college has its own private board, subjects and clubs. Pick yours."),
    el("label", { class: "label" }, "Your state"),
    stateSelect,
    search,
    list,
    el("div", { class: "label" }, "My college is not listed"),
    el("p", { class: "hint" }, "Tell us about your college and we will set up a board for it."),
    form,
    el("div", { class: "rowbtns" }, el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back")),
  ];
}
function renderAbout() {
  const feature = (icon, title, text) => el("div", { class: "learn-card" }, el("strong", {}, icon + " " + title), el("p", { class: "hint" }, text));
  return [
    el("h2", {}, "ℹ️ About " + BRAND),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { try { window.open("about.html", "_blank", "noopener"); } catch (_) {} } }, "📄 Read our full story")),
    el("div", { class: "rowbtns" }, el("button", { class: "btn sm", type: "button", onclick: () => showWelcome(true) }, "👋 Show the welcome tour")),
    el("p", { class: "hint" }, el("a", { href: "terms.html", target: "_blank", rel: "noopener" }, "Terms"), " · ", el("a", { href: "privacy.html", target: "_blank", rel: "noopener" }, "Privacy"), " · ", el("a", { href: "refund.html", target: "_blank", rel: "noopener" }, "Refunds")),
    el("p", { class: "hint" }, "One free place to ask doubts, share ideas, prepare for GATE, plan your career and help your juniors."),
    el("div", { class: "learn-card" },
      el("strong", {}, "🔥 Built by students"),
      el("p", {}, "Built by students, for students."),
      el("p", {}, "Dedicated to our students: advanced, disciplined and obedient learners who work hard, respect their teachers and lift each other up. You are the reason Spark exists.")),
    el("div", { class: "label" }, "🎯 Our mission"),
    el("p", {}, "Every student should have a senior to ask, a clear path after graduation, and quality study material, without paying for any of it. The Campus Loop brings these together so no doubt stays unanswered and no student feels lost after B.Tech 4th year."),
    el("div", { class: "label" }, "What you get"),
    feature("❓", "Doubts", "Ask by subject, year (B.Tech 1st to 4th year) and campus. Peers answer, you mark the best answer, and helpers earn points."),
    feature("💡", "Ideas, Clubs and Challenges", "Share project ideas, join clubs and take part in challenges and hackathons."),
    feature("🎯", "GATE", "Previous-year papers with solutions, MCQs, formulas and a year-wise preparation plan."),
    feature("🧠", "Daily Quiz and Top Helpers", "A new question every day, a leaderboard and recognition for the students who help most."),
    feature("📖", "Study Tools and Learn from IIT", "Unit-wise syllabus, formula cards, study plans and free IIT course links."),
    feature("", "Career Guide", "Branch-wise options after graduation: jobs, M.Tech, PSU, study abroad and premium paths, all with free links."),
    feature("", "Loop Bot", "Ask anything about academics, GATE, placements, campus life or the app and get instant answers with clickable resources."),
    feature("🛒", "Market", "Buy and sell textbooks, notes and equipment inside the " + COLLEGE + " community."),
    el("div", { class: "label" }, "🔒 Privacy and safety"),
    el("p", {}, "No login and no password. Your device gets a random ID so your posts stay yours. You can post anonymously, report anything inappropriate and edit your own posts. We do not sell or share your data."),
    el("div", { class: "label" }, "💚 Free to use"),
    el("p", {}, "The board, quizzes, study tools and every resource we link to are free, with no ads. An optional paid plan, The Campus Loop Plus, is being prepared for extras. Nothing that is free today will be taken away."),
    el("div", { class: "label" }, "⚠️ Please note"),
    el("p", { class: "hint" }, "The Campus Loop is a student community platform. Always confirm official dates, fees, results and rules on your college's official websites before acting on them. Career and scholarship details can change, so check the official links."),
    IS_RGUKT && el("div", { class: "label" }, "🔗 Official RGUKT campuses"),
    IS_RGUKT && el("div", { class: "rowbtns" },
      outLink("https://www.rguktn.ac.in", "Nuzvid", "linkbtn"),
      outLink("https://www.rguktong.ac.in", "Ongole", "linkbtn"),
      outLink("https://www.rguktrkv.ac.in", "RK Valley", "linkbtn"),
      outLink("https://www.rguktsklm.ac.in", "Srikakulam", "linkbtn")),
    el("div", { class: "label" }, "🤝 Get involved"),
    el("p", { class: "hint" }, "Found a bug or have an idea? Post it in the Ideas tab or ask Loop Bot. You can also see the code and report issues on GitHub."),
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
    note: "Start in B.Tech 3rd year. Needs a strong CGPA, 2-3 projects or a research paper, recommendation letters and GRE/IELTS where required. Germany has no tuition at public universities.",
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
    { icon: "", title: "Private sector jobs", note: "Machine Learning Engineer, Data Scientist, Data Analyst, Generative AI / LLM Engineer, MLOps Engineer, Computer Vision Engineer, NLP Engineer, Data Engineer, AI Product Manager and AI consultant. Startups and global companies hire for these roles in every sector.",
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
    { icon: "", title: "Robotics, EV and advanced manufacturing", note: "Mechatronics, 3D printing, drones and EV design are growing quickly. Build projects and enter student design competitions.",
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
    { icon: "", title: "Generative AI and LLM careers", note: "Prompt engineering, fine-tuning, retrieval-augmented generation (RAG) and AI agents are among the fastest-growing skills. Build and publish a small LLM app to stand out.",
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
    { icon: "🗓️", title: "Timeline (start in B.Tech 2nd year, apply in B.Tech 4th year)", note: "B.Tech 2nd year: keep CGPA high, learn one skill deeply. B.Tech 3rd year sem 1: pick 2-3 countries, prepare GRE / IELTS / TOEFL where needed, do 2-3 projects. B.Tech 3rd year summer: research internship (Mitacs, DAAD WISE, IAS). B.Tech 4th year sem 1: SOP, 3 recommendation letters, apply (many deadlines fall between October and January). B.Tech 4th year sem 2: offers, scholarship, visa, education loan.",
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
    { icon: "🔬", title: "Summer research fellowships", note: "Work with leading scientists for 2 months in B.Tech 2nd or 3rd year. The best way to get strong recommendation letters for MS and PhD.",
      links: [["Indian Academies Summer Research Fellowship", "https://www.ias.ac.in"], ["DAAD WISE (Germany)", "https://www.daad.in"], ["Mitacs Globalink (Canada)", "https://www.mitacs.ca/en/programs/globalink"], ["CERN Summer Student Programme", "https://home.cern/summer-student-programme"]] },
    { icon: "🛰️", title: "ISRO, DRDO and national labs", note: "Scientist and engineer roles with ISRO, DRDO, BARC and CSIR labs. Recruitment is through GATE or the labs' own exams. Think long term.",
      links: [["ISRO Careers", "https://www.isro.gov.in/Careers.html"], ["DRDO RAC", "https://rac.gov.in"], ["BARC", "https://barc.gov.in"], ["CSIR", "https://www.csir.res.in"]] },
    { icon: "🎖️", title: "Join the armed forces as an officer", note: "Engineers can join the Army, Navy and Air Force as technical officers (AFCAT Technical, SSC Tech, University Entry Scheme). Excellent pay, status and training.",
      links: [["Join Indian Army", "https://joinindianarmy.nic.in"], ["Join Indian Navy", "https://www.joinindiannavy.gov.in"], ["AFCAT (Air Force)", "https://afcat.cdac.in"]] },
    { icon: "🏛️", title: "UPSC Civil Services and Engineering Services", note: "IAS / IPS / IFS through the Civil Services Exam, or ESE for core engineering posts in railways, CPWD, telecom and defence. The syllabus is free on the UPSC site.",
      links: [["UPSC", "https://upsc.gov.in"], ["UPSC ESE", "https://upsc.gov.in"], ["IBPS (bank SO / IT officer)", "https://www.ibps.in"]] },
    { icon: "🏫", title: "Become a professor or researcher", note: "UGC-NET and CSIR-NET qualify you for lectureship and JRF. Combine with M.Tech and PhD to teach at universities and run your own lab.",
      links: [["UGC NET", "https://ugcnet.nta.ac.in"], ["CSIR NET", "https://csirnet.nta.ac.in"], ["NPTEL (teach and learn)", "https://nptel.ac.in"]] },
    { icon: "", title: "Build a startup with government backing", note: "Startup India registration, Atal Innovation Mission and incubators at IITs help with funding, mentors and legal support. Patents protect your idea.",
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
      el("h2", {}, "Career Guide"),
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
    el("h2", {}, " " + careerBranch + ", after graduation"),
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

// RGUKT AP syllabus, unit-wise topics for every subject
const SYLLABUS = {
  // ---- ECE ----
  "DLD": {
    branch: "ECE",
    code: "23EC2102", credits: "4 Credits  |  3L: 1T: 0P  |  PCC",
    units: [
      { title: "Unit I, Number Systems & Boolean Algebra", hours: "6 hrs", topics: [
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
      { title: "Unit II, Combinational Circuit Design", hours: "12 hrs", topics: [
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
      { title: "Unit III, Latches & Flip-Flops", hours: "10 hrs", topics: [
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
      { title: "Unit IV, Counters & Registers", hours: "14 hrs", topics: [
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
      { title: "Unit V, Decoders, Multiplexers & PLDs", hours: "10 hrs", topics: [
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
      { title: "Unit VI, Memory & Digital System Design", hours: "8 hrs", topics: [
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
      "Ronald J. Tocci, Neal S. Widmer, Gregory L. Moss, 'Digital Systems', Pearson, 10th edition",
      "John F. Wakerly, 'Digital Design', Pearson, 4th edition",
    ],
    refbooks: [
      "Stephen Brown, Zvonko Vranesic, 'Fundamentals of Digital Logic with Verilog Design', TMH, 2nd edition",
    ],
    webres: [
      { label: "NPTEL – Digital Circuits & Systems (Prof. Shankar Balachandran, IIT Madras)", url: "https://nptel.ac.in/courses/117106114/" },
      { label: "NPTEL – Digital Circuits and Systems (Prof. S Srinivasan, IIT Madras)", url: "https://nptel.ac.in/courses/117106086/" },
    ],
  },
  "DSP": {
    branch: "ECE",
    units: [
      { title: "Unit 1, Discrete-Time Signals & Z-transform", topics: ["Classification of DT signals and systems", "LTI systems: convolution, properties", "Z-transform definition, properties, ROC", "Inverse Z-transform (partial fractions, power series)", "System function H(z), stability using poles"] },
      { title: "Unit 2, Frequency Analysis & DFT", topics: ["DTFT and its properties", "DFT: definition and properties", "Circular convolution", "Overlap-add and overlap-save methods", "Relationship between DTFT, DFT, and Z-transform"] },
      { title: "Unit 3, Fast Fourier Transform (FFT)", topics: ["Divide-and-conquer approach", "DIT-FFT algorithm (Cooley-Tukey)", "DIF-FFT algorithm", "Computational complexity: O(N log N)", "IFFT computation"] },
      { title: "Unit 4, IIR Filter Design", topics: ["Analog filter prototypes: Butterworth, Chebyshev", "Bilinear transformation", "Impulse invariant method", "Digital IIR filter design procedure", "Frequency transformations"] },
      { title: "Unit 5, FIR Filter Design", topics: ["Linear phase FIR filters", "Window functions: Rectangular, Hamming, Hanning, Kaiser", "Frequency sampling method", "FIR vs IIR comparison", "Introduction to multirate signal processing"] },
    ],
  },
  "AEC": {
    branch: "ECE",
    units: [
      { title: "Unit 1, BJT Biasing & Small-Signal Amplifiers", topics: ["BJT operating regions", "DC bias circuits (fixed, self-bias, voltage divider)", "h-parameter model", "CE, CB, CC amplifier analysis", "Gain, input/output impedance"] },
      { title: "Unit 2, Multi-Stage & Feedback Amplifiers", topics: ["RC-coupled, transformer-coupled, direct-coupled amplifiers", "Cascade amplifier analysis", "Feedback types (voltage/current series/shunt)", "Effect of feedback on gain, bandwidth, distortion", "Barkhausen criterion for oscillation"] },
      { title: "Unit 3, Oscillators", topics: ["RC phase shift oscillator", "Wien bridge oscillator", "Hartley and Colpitts oscillators", "Crystal oscillators", "Frequency stability"] },
      { title: "Unit 4, Power Amplifiers", topics: ["Class A, B, AB, C amplifiers", "Push-pull amplifier", "Efficiency and power dissipation", "Thermal runaway", "Distortion in power amplifiers"] },
      { title: "Unit 5, Op-Amp Applications", topics: ["Ideal op-amp characteristics", "Inverting and non-inverting amplifiers", "Summing, Difference, Integrator, Differentiator", "Comparators and Schmitt trigger", "Active filters (LPF, HPF, BPF)", "Precision rectifiers"] },
    ],
  },
  "CS": {
    branch: "ECE",
    units: [
      { title: "Unit 1, Introduction & Modeling", topics: ["Open-loop vs closed-loop systems", "Transfer function, Block diagram algebra", "Signal flow graphs, Mason's gain formula", "Modeling of electrical, mechanical systems"] },
      { title: "Unit 2, Time Domain Analysis", topics: ["Test signals: step, ramp, impulse", "Transient response of 1st and 2nd order systems", "Rise time, peak time, settling time, overshoot", "Steady-state error and error constants (Kp, Kv, Ka)", "System type and error"] },
      { title: "Unit 3, Stability Analysis", topics: ["Routh-Hurwitz stability criterion", "Root locus construction rules", "Effect of poles and zeros on root locus", "Gain and phase margin from root locus"] },
      { title: "Unit 4, Frequency Domain Analysis", topics: ["Frequency response, polar plots", "Bode magnitude and phase plots", "Gain margin and phase margin", "Nyquist stability criterion", "Closed-loop frequency response"] },
      { title: "Unit 5, Compensators & State Space", topics: ["Lead, lag, lead-lag compensators", "PID controller design", "State space representation", "State transition matrix", "Controllability and observability"] },
    ],
  },
  "CN": {
    branch: "ECE",
    units: [
      { title: "Unit 1, Introduction & Physical Layer", topics: ["Network types: LAN, WAN, MAN", "OSI model (7 layers) and TCP/IP model", "Data transmission: bandwidth, throughput, latency", "Transmission media (guided and unguided)", "Encoding and modulation techniques"] },
      { title: "Unit 2, Data Link Layer", topics: ["Framing, error detection (CRC, checksum)", "Error correction (Hamming code)", "Flow control: stop-and-wait, sliding window", "MAC protocols: ALOHA, CSMA/CD, CSMA/CA", "IEEE 802.3 Ethernet, IEEE 802.11 Wi-Fi"] },
      { title: "Unit 3, Network Layer", topics: ["IPv4 addressing, subnetting, CIDR", "IPv6 overview", "Routing algorithms: Dijkstra (OSPF), Bellman-Ford (RIP)", "IP fragmentation, ICMP", "ARP, DHCP"] },
      { title: "Unit 4, Transport Layer", topics: ["Services: connection-oriented vs connectionless", "UDP: features and applications", "TCP: segments, three-way handshake", "TCP congestion control (slow start, AIMD)", "TCP flow control (sliding window)"] },
      { title: "Unit 5, Application Layer", topics: ["DNS: domain name resolution", "HTTP/HTTPS: request-response", "FTP, SMTP, POP3, IMAP", "Socket programming basics", "Introduction to network security (SSL/TLS)"] },
    ],
  },
  "CO & D": {
    branch: "ECE",
    units: [
      { title: "Unit 1, Basic Computer Organization", topics: ["Register transfer language (RTL)", "Buses and memory transfers", "Arithmetic logic unit (ALU) design", "Instruction cycle: fetch-decode-execute", "Addressing modes"] },
      { title: "Unit 2, Instruction Set Architecture", topics: ["Instruction formats and types", "RISC vs CISC", "Assembly language overview", "Stacks, subroutine calls", "Interrupt handling"] },
      { title: "Unit 3, CPU Design & Control Unit", topics: ["Hardwired control", "Microprogrammed control", "Micro-operations", "Pipeline hazards: structural, data, control", "Hazard mitigation techniques"] },
      { title: "Unit 4, Memory Organization", topics: ["Cache memory: mapping (direct, associative, set-associative)", "Cache replacement policies (LRU, FIFO)", "Virtual memory, paging, TLB", "Memory hierarchy and performance", "DRAM, SRAM comparison"] },
      { title: "Unit 5, I/O & Advanced Topics", topics: ["I/O interfaces: programmed, interrupt-driven, DMA", "I/O buses (PCI, USB)", "Multiprocessors introduction", "Shared memory and message passing", "GPU architecture overview"] },
    ],
  },
  "PRV": {
    branch: "ECE",
    units: [
      { title: "Unit 1, Probability Fundamentals", topics: ["Sample space, events", "Axioms of probability", "Conditional probability, Bayes' theorem", "Independence of events", "Combinatorial problems"] },
      { title: "Unit 2, Random Variables", topics: ["Discrete RV: PMF, CDF", "Continuous RV: PDF, CDF", "Common distributions: Bernoulli, Binomial, Poisson, Uniform, Gaussian, Exponential", "Functions of a random variable"] },
      { title: "Unit 3, Statistical Averages", topics: ["Mean, variance, standard deviation", "Moments and moment generating function", "Chebyshev's inequality", "Characteristic function", "Central limit theorem"] },
      { title: "Unit 4, Multiple Random Variables", topics: ["Joint PDF/PMF", "Marginal and conditional distributions", "Correlation and covariance", "Linear transformation of RVs", "Jointly Gaussian RVs"] },
      { title: "Unit 5, Random Processes", topics: ["Classification of random processes", "Stationary processes (SSS and WSS)", "Autocorrelation and power spectral density", "Wiener-Khinchin theorem", "Response of LTI systems to random inputs"] },
    ],
  },
  "CS-2": {
    branch: "ECE",
    units: [
      { title: "Unit 1, Amplitude Modulation", topics: ["AM: generation, spectrum, power", "DSB-SC, SSB-SC, VSB", "AM demodulation (envelope detector)", "Superheterodyne receiver", "Figure of merit for AM"] },
      { title: "Unit 2, Angle Modulation", topics: ["FM and PM: instantaneous frequency", "WBFM and NBFM", "FM spectrum (Bessel functions)", "FM demodulation (limiter-discriminator, PLL)", "Comparison of AM vs FM"] },
      { title: "Unit 3, Pulse Modulation", topics: ["Sampling theorem", "PAM: natural and flat-top", "PWM and PPM", "PCM: quantization, encoding, companding (μ-law, A-law)", "Delta modulation and ADM"] },
      { title: "Unit 4, Digital Modulation", topics: ["ASK, FSK, PSK, BPSK, QPSK", "Differential PSK (DPSK)", "QAM", "Coherent vs non-coherent detection", "BER comparison of digital schemes"] },
      { title: "Unit 5, Information Theory & Noise", topics: ["Entropy, mutual information", "Channel capacity (Shannon)", "Source coding (Huffman, LZW)", "Noise in AM and FM receivers", "Threshold effect in FM"] },
    ],
  },
  "RFME": {
    branch: "ECE",
    units: [
      { title: "Unit 1, Transmission Line Theory", topics: ["Distributed parameters: L, C, R, G", "Characteristic impedance Z₀", "Reflection coefficient, VSWR", "Smith chart applications", "Quarter-wave and half-wave transformers"] },
      { title: "Unit 2, Microwave Components", topics: ["Rectangular and circular waveguides", "TE and TM modes, cutoff frequency", "Microwave resonators", "Directional couplers, circulators, isolators", "Microwave filters"] },
      { title: "Unit 3, Microwave Tubes", topics: ["Limitations of conventional tubes at microwave frequencies", "Klystron (two-cavity, reflex)", "Magnetron", "Travelling wave tube (TWT)", "Backward wave oscillator (BWO)"] },
      { title: "Unit 4, Microwave Semiconductor Devices", topics: ["Gunn diode and transferred electron devices", "IMPATT and TRAPATT diodes", "PIN diodes and Schottky diodes", "MESFETs, HEMTs", "Microwave integrated circuits (MICs)"] },
      { title: "Unit 5, Antennas & Measurements", topics: ["Antenna parameters: gain, directivity, efficiency", "Dipole, monopole, loop antennas", "Antenna arrays and beam steering", "Microwave power, frequency, and VSWR measurement", "Noise figure measurement"] },
    ],
  },
  // ---- CSE ----
  "DS & A": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Linear Data Structures", topics: ["Arrays: operations, 2D arrays", "Linked lists: singly, doubly, circular", "Stacks: operations, applications (expression evaluation, parenthesis matching)", "Queues: simple, circular, priority, deque"] },
      { title: "Unit 2, Trees", topics: ["Binary trees: traversals (inorder, preorder, postorder)", "Binary search trees: search, insert, delete", "AVL trees: rotations (LL, RR, LR, RL)", "Heaps (min-heap, max-heap), heapify", "B-trees overview"] },
      { title: "Unit 3, Graphs", topics: ["Representation: adjacency matrix, list", "BFS and DFS traversals", "Shortest paths: Dijkstra, Bellman-Ford", "Minimum spanning tree: Prim, Kruskal", "Topological sort"] },
      { title: "Unit 4, Sorting & Searching", topics: ["Bubble, Selection, Insertion sort: O(n²)", "Merge sort and Quick sort: O(n log n)", "Heap sort", "Binary search: O(log n)", "Hashing: hash functions, collision (chaining, open addressing)"] },
      { title: "Unit 5, Algorithm Design Techniques", topics: ["Greedy: activity selection, Huffman coding, fractional knapsack", "Dynamic programming: 0/1 knapsack, LCS, matrix chain", "Backtracking: N-queens, graph coloring", "Branch and bound", "Complexity: P, NP, NP-complete"] },
    ],
  },
  "OS": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Process Management", topics: ["Process states and PCB", "Process creation/termination (fork, exec)", "Threads: user-level vs kernel-level", "CPU scheduling: FCFS, SJF, Priority, Round Robin", "Multi-level queue scheduling"] },
      { title: "Unit 2, Process Synchronization", topics: ["Race condition, critical section problem", "Peterson's solution", "Semaphores (binary, counting)", "Monitors", "Classic problems: Producer-Consumer, Readers-Writers, Dining Philosophers"] },
      { title: "Unit 3, Deadlock", topics: ["Deadlock conditions (Coffman's 4 conditions)", "Resource allocation graph", "Deadlock prevention and avoidance (Banker's algorithm)", "Deadlock detection and recovery"] },
      { title: "Unit 4, Memory Management", topics: ["Contiguous allocation (fixed, variable partitions)", "Fragmentation, compaction", "Paging: page table, TLB", "Segmentation", "Virtual memory: demand paging, page fault handling"] },
      { title: "Unit 5, File Systems & I/O", topics: ["File attributes, operations, types", "Directory structure", "File allocation: contiguous, linked, indexed (inode)", "Disk scheduling: FCFS, SSTF, SCAN, C-SCAN", "I/O hardware and software layers"] },
    ],
  },
  "DBMS": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Database Concepts & ER Model", topics: ["Database vs file system", "Database architecture (3-tier)", "ER model: entities, attributes, relationships", "Weak entities and participation constraints", "ER-to-relational mapping"] },
      { title: "Unit 2, Relational Model & SQL", topics: ["Relational algebra: σ, π, ⋈, ∪, −", "Relational calculus", "SQL: DDL (CREATE, ALTER, DROP)", "SQL: DML (INSERT, UPDATE, DELETE, SELECT)", "Joins, subqueries, aggregate functions, GROUP BY, HAVING"] },
      { title: "Unit 3, Normalization", topics: ["Functional dependencies", "1NF, 2NF, 3NF, BCNF", "Multi-valued dependencies and 4NF", "Lossless decomposition and dependency preservation", "Denormalization"] },
      { title: "Unit 4, Transaction Management", topics: ["ACID properties", "Transaction states and schedules", "Serializability (conflict, view)", "Concurrency control: locking (2PL), timestamps", "Deadlock detection in databases"] },
      { title: "Unit 5, Storage & Query Optimization", topics: ["Storage hierarchy, buffer management", "File organization: heap, sorted, hashed", "Indexing: primary, secondary, B+ tree index", "Query processing steps", "Query optimization: cost estimation, join ordering"] },
    ],
  },
  "OOP": {
    branch: "CSE",
    units: [
      { title: "Unit 1, OOP Fundamentals & Java Basics", topics: ["OOP concepts: encapsulation, abstraction, inheritance, polymorphism", "Java program structure, JVM, JDK", "Data types, operators, control statements", "Arrays, strings, StringBuffer", "Methods, constructors, 'this' keyword"] },
      { title: "Unit 2, Inheritance & Polymorphism", topics: ["Single, multilevel, hierarchical inheritance", "Method overriding and dynamic dispatch", "Abstract classes and methods", "Interfaces and multiple inheritance", "final keyword"] },
      { title: "Unit 3, Packages & Exception Handling", topics: ["Creating and using packages", "Access modifiers: public, private, protected", "try-catch-finally blocks", "Checked and unchecked exceptions", "User-defined exceptions, throw and throws"] },
      { title: "Unit 4, Multithreading & Generics", topics: ["Thread creation: Thread class and Runnable", "Thread lifecycle and scheduling", "Synchronization: synchronized methods and blocks", "Inter-thread communication (wait, notify)", "Generics: generic classes and methods, bounded types"] },
      { title: "Unit 5, Collections & I/O", topics: ["Collection framework: List, Set, Map, Queue", "ArrayList, LinkedList, HashSet, TreeSet, HashMap", "Iterators and for-each loop", "File I/O: FileInputStream, FileOutputStream, BufferedReader", "Serialization and deserialization"] },
    ],
  },
  "TOC": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Regular Languages & FA", topics: ["Alphabet, strings, languages", "Deterministic finite automaton (DFA)", "NFA and NFA-to-DFA conversion (subset construction)", "Regular expressions", "Regular expression to NFA (Thompson's construction)"] },
      { title: "Unit 2, Regular Language Properties", topics: ["Closure properties of regular languages", "Pumping lemma for regular languages", "Myhill-Nerode theorem", "Minimization of DFA", "Decision problems for regular languages"] },
      { title: "Unit 3, Context-Free Languages", topics: ["Context-free grammar (CFG)", "Derivations, parse trees, ambiguity", "Chomsky Normal Form (CNF) and Greibach Normal Form", "Pushdown automata (PDA)", "Pumping lemma for CFLs"] },
      { title: "Unit 4, Turing Machines", topics: ["Turing machine model and transitions", "Variants: multi-tape TM, non-deterministic TM", "Church-Turing thesis", "Recursive and recursively enumerable languages", "Universal Turing machine"] },
      { title: "Unit 5, Decidability & Complexity", topics: ["Decidable and undecidable problems", "Halting problem (undecidable, proof by diagonalization)", "Rice's theorem", "Complexity classes: P, NP", "NP-completeness: SAT, 3-SAT, Clique, Vertex Cover"] },
    ],
  },
  "CD": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Lexical Analysis", topics: ["Phases of compiler", "Role of lexical analyzer", "Tokens, patterns, lexemes", "Regular expressions for tokens", "LEX/FLEX tool overview"] },
      { title: "Unit 2, Syntax Analysis (Parsing)", topics: ["Context-free grammars for programming languages", "Top-down parsing: recursive descent, predictive LL(1)", "First and Follow sets, parsing table", "Bottom-up parsing: LR(0), SLR(1), LALR(1)", "YACC/Bison tool overview"] },
      { title: "Unit 3, Semantic Analysis", topics: ["Syntax-directed definitions (SDD)", "Synthesized and inherited attributes", "L-attributed and S-attributed grammars", "Type checking and type systems", "Symbol table structure and operations"] },
      { title: "Unit 4, Intermediate Code Generation", topics: ["Three-address code", "Quadruples, triples, indirect triples", "Syntax-directed translation for expressions", "Control flow statements (if, while)", "Backpatching"] },
      { title: "Unit 5, Code Optimization & Generation", topics: ["Basic blocks and flow graphs", "Local optimizations: constant folding, dead code elimination", "Global optimizations: loop invariant code motion, induction variable elimination", "Register allocation and assignment", "Code generation algorithms"] },
    ],
  },
  "SE": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Software Process Models", topics: ["Software development life cycle (SDLC)", "Waterfall model", "Prototyping, Spiral model", "Agile: Scrum, XP", "DevOps overview"] },
      { title: "Unit 2, Requirements Engineering", topics: ["Functional and non-functional requirements", "Requirements elicitation techniques", "Use case diagrams (UML)", "Software Requirements Specification (SRS)", "Requirements validation and traceability"] },
      { title: "Unit 3, Software Design", topics: ["Architectural design patterns (MVC, layered, microservices)", "UML diagrams: class, sequence, state, activity", "Design principles: SOLID", "Object-oriented design", "Modular design metrics: cohesion, coupling"] },
      { title: "Unit 4, Software Testing", topics: ["Testing levels: unit, integration, system, acceptance", "Black-box testing: equivalence partitioning, boundary value analysis", "White-box testing: statement, branch, path coverage", "Test-driven development (TDD)", "Regression testing, performance testing"] },
      { title: "Unit 5, Project Management & Quality", topics: ["Project planning: WBS, Gantt charts, PERT/CPM", "Effort estimation: COCOMO model, function points", "Risk management", "Software quality: ISO 9001, CMMI", "Configuration management and version control (Git)"] },
    ],
  },
  "Python": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Python Basics", topics: ["Variables, data types, operators", "Control flow: if/elif/else, for, while", "Functions: def, arguments, return, lambda", "Strings and string methods", "Lists, tuples, sets, dictionaries"] },
      { title: "Unit 2, OOP in Python", topics: ["Classes and objects", "Constructors (__init__), self", "Inheritance and method overriding", "Dunder methods (__str__, __len__, __add__)", "Decorators and properties"] },
      { title: "Unit 3, File Handling & Exceptions", topics: ["File open, read, write, close", "with statement and context managers", "try-except-finally, raise", "Custom exceptions", "JSON and CSV file handling"] },
      { title: "Unit 4, NumPy & Pandas", topics: ["NumPy arrays: creation, indexing, slicing", "Array operations and broadcasting", "Pandas Series and DataFrame", "Data loading (CSV, Excel)", "Data cleaning, filtering, groupby, merge"] },
      { title: "Unit 5, Data Visualization & Introduction to ML", topics: ["Matplotlib: line, bar, scatter, histogram plots", "Seaborn for statistical plots", "Scikit-learn: train-test split", "Linear regression, logistic regression", "Evaluation metrics: accuracy, confusion matrix"] },
    ],
  },
  "Maths": {
    branch: "CSE",
    units: [
      { title: "Unit 1, Logic & Sets", topics: ["Propositional logic, truth tables", "Predicate logic, quantifiers", "Set theory: operations, power set, Cartesian product", "Functions: injective, surjective, bijective", "Relations: equivalence, partial order, Hasse diagram"] },
      { title: "Unit 2, Graph Theory", topics: ["Graph types: simple, directed, weighted", "Euler and Hamiltonian paths/circuits", "Trees and spanning trees", "Planar graphs, graph coloring", "Chromatic number"] },
      { title: "Unit 3, Combinatorics", topics: ["Counting: permutations, combinations", "Pigeonhole principle", "Inclusion-exclusion principle", "Recurrence relations", "Generating functions"] },
      { title: "Unit 4, Linear Algebra", topics: ["Matrices: operations, rank, determinant", "Systems of linear equations (Gaussian elimination)", "Eigenvalues and eigenvectors", "Cayley-Hamilton theorem", "Linear transformations"] },
      { title: "Unit 5, Probability & Statistics", topics: ["Probability: axioms, conditional, Bayes", "Discrete distributions: Binomial, Poisson", "Continuous distributions: Normal, Exponential", "Mean, variance, standard deviation", "Hypothesis testing overview"] },
    ],
  },
  // ---- Civil ----
  "SOM": {
    branch: "Civil",
    units: [
      { title: "Unit 1, Stress & Strain", topics: ["Normal and shear stress", "Hooke's law, elastic constants (E, G, ν, K)", "Relationship between elastic constants", "Thermal stresses", "Composite bars and tapering bars"] },
      { title: "Unit 2, Shear Force & Bending Moment", topics: ["Types of beams and loads", "SFD and BMD for cantilever, simply supported, overhanging beams", "Relation between load, SF, and BM", "Point of contraflexure"] },
      { title: "Unit 3, Bending & Shear Stresses", topics: ["Theory of simple bending", "Bending stress: σ = My/I", "Section modulus, moment of inertia of standard sections", "Shear stress distribution in beams", "Composite beams (flitched beams)"] },
      { title: "Unit 4, Deflection of Beams & Columns", topics: ["Differential equation of elastic curve", "Macaulay's method", "Moment-area method", "Columns: short vs long", "Euler's buckling load, effective length, slenderness ratio"] },
      { title: "Unit 5, Torsion & Pressure Vessels", topics: ["Torsion of circular shafts: τ = Tr/J", "Power transmitted by shaft", "Thin cylinders: hoop and longitudinal stress", "Thick cylinders (Lamé's equations)", "Principal stresses and Mohr's circle"] },
    ],
  },
  "FM": {
    branch: "Civil",
    units: [
      { title: "Unit 1, Fluid Properties & Statics", topics: ["Density, viscosity, surface tension, capillarity", "Hydrostatic law", "Pressure measurement: manometers, gauges", "Force on submerged plane surfaces", "Buoyancy and metacentric height"] },
      { title: "Unit 2, Fluid Kinematics", topics: ["Types of flow: steady/unsteady, laminar/turbulent", "Streamlines, pathlines, streaklines", "Continuity equation (1D, 3D)", "Velocity potential and stream function", "Rotational vs irrotational flow"] },
      { title: "Unit 3, Fluid Dynamics", topics: ["Bernoulli's equation and applications", "Venturimeter, orifice, pitot tube", "Momentum equation", "Flow through pipes: Darcy-Weisbach equation", "Losses: major (friction) and minor (bends, valves)"] },
      { title: "Unit 4, Boundary Layer & Turbulence", topics: ["Boundary layer concept, displacement thickness", "Laminar and turbulent boundary layers", "Drag and lift on bodies", "Reynolds number, turbulence", "Flow separation"] },
      { title: "Unit 5, Open Channel & Hydraulic Machines", topics: ["Open channel flow: Manning's equation", "Specific energy, critical flow, Froude number", "Hydraulic jump", "Centrifugal pumps: characteristics, cavitation", "Francis and Kaplan turbines"] },
    ],
  },
  "Struct": {
    branch: "Civil",
    units: [
      { title: "Unit 1, Statically Determinate Structures", topics: ["Beams: SFD, BMD", "Plane trusses: method of joints, sections", "Influence lines for beams", "Arches: three-hinged arch", "Cable structures"] },
      { title: "Unit 2, Energy Methods", topics: ["Castigliano's theorems", "Unit load method (virtual work)", "Deflection of trusses and beams", "Maxwell-Betti reciprocal theorem"] },
      { title: "Unit 3, Force and Displacement Methods", topics: ["Degree of indeterminacy", "Compatibility method (three-moment equation)", "Slope deflection method", "Moment distribution method (Hardy Cross)"] },
      { title: "Unit 4, Stiffness Matrix Method", topics: ["Stiffness matrix formulation", "Global vs local coordinates", "Member stiffness matrix", "Assembly and solution for beams and frames", "Introduction to finite element method"] },
      { title: "Unit 5, Dynamic Analysis & Plastic Analysis", topics: ["Free vibration of structures", "Natural frequency, mode shapes", "Plastic hinges, plastic moment", "Collapse mechanisms for beams and frames", "Load factor and shape factor"] },
    ],
  },
  // ---- Mech ----
  "Thermo": {
    branch: "Mech",
    units: [
      { title: "Unit 1, Basic Concepts", topics: ["Thermodynamic system, boundary, surroundings", "Properties: intensive vs extensive", "State, process, cycle", "Zeroth law and temperature", "Pure substance and phase diagrams (P-v-T surface)"] },
      { title: "Unit 2, First Law of Thermodynamics", topics: ["Heat and work (sign conventions)", "First law for closed and open systems", "Enthalpy, specific heats Cp and Cv", "Steady-flow energy equation (SFEE)", "Throttling and nozzle flow"] },
      { title: "Unit 3, Second Law & Entropy", topics: ["Kelvin-Planck and Clausius statements", "Carnot cycle and efficiency", "Clausius inequality", "Entropy: definition, T-s diagram", "Entropy generation and irreversibility"] },
      { title: "Unit 4, Gas Power Cycles", topics: ["Air standard analysis", "Otto cycle (petrol engine)", "Diesel cycle", "Brayton cycle (gas turbine)", "Comparison of cycles, compressor work"] },
      { title: "Unit 5, Vapour Cycles & Refrigeration", topics: ["Rankine cycle (steam power plant)", "Reheat and regenerative Rankine cycle", "Vapour compression refrigeration", "COP, refrigerants", "Psychrometrics: DBT, WBT, humidity, AHU"] },
    ],
  },
  "FM-M": {
    branch: "Mech",
    units: [
      { title: "Unit 1, Fluid Properties & Statics", topics: ["Viscosity, surface tension, capillarity", "Hydrostatic forces on surfaces", "Buoyancy, metacentric height", "Pressure measurement"] },
      { title: "Unit 2, Fluid Kinematics & Dynamics", topics: ["Continuity equation", "Bernoulli's equation", "Flow measurement: venturimeter, orifice", "Momentum equation applications"] },
      { title: "Unit 3, Viscous Flow & Boundary Layer", topics: ["Laminar flow in pipes (Hagen-Poiseuille)", "Turbulent flow, friction factor (Moody chart)", "Boundary layer development", "Drag and lift"] },
      { title: "Unit 4, Turbomachinery, Pumps", topics: ["Centrifugal pump: components, velocity triangles", "Head, efficiency, power", "Cavitation and NPSH", "Pump characteristics and selection", "Reciprocating pumps"] },
      { title: "Unit 5, Turbomachinery, Turbines", topics: ["Impulse vs reaction turbines", "Pelton wheel", "Francis turbine", "Kaplan turbine", "Performance characteristics and specific speed"] },
    ],
  },
  "MD": {
    branch: "Mech",
    units: [
      { title: "Unit 1, Design Philosophy & Stresses", topics: ["Factor of safety, design for static loads", "Principal stresses, Mohr's circle", "Theories of failure (Von Mises, Tresca, Rankine)", "Stress concentration factors"] },
      { title: "Unit 2, Fatigue & Impact", topics: ["S-N curve, endurance limit (Goodman, Soderberg)", "Stress concentration under fatigue", "Impact loading, Charpy and Izod tests", "Cumulative fatigue damage"] },
      { title: "Unit 3, Shafts, Keys & Couplings", topics: ["Shaft design for torsion and bending", "ASME code for shafts", "Keys: parallel, Woodruff", "Couplings: rigid, flexible, universal joints"] },
      { title: "Unit 4, Bearings & Lubrication", topics: ["Sliding contact (journal) bearings", "Hydrodynamic lubrication theory", "Rolling contact bearings: designation, load capacity, life (L10)", "Bearing selection from catalogue"] },
      { title: "Unit 5, Gears & Springs", topics: ["Spur gear design: Lewis equation, surface fatigue", "Helical, bevel, worm gear overview", "Spring types: helical, leaf, torsion", "Close-coiled helical spring design", "Spring combinations: series and parallel"] },
    ],
  },
  // ---- EEE ----
  "Circuits": {
    branch: "EEE",
    units: [
      { title: "Unit 1, Circuit Analysis Techniques", topics: ["KVL, KCL for DC circuits", "Nodal analysis (Node voltage method)", "Mesh analysis (Loop current method)", "Source transformation", "Star-Delta (Y-Δ) transformation"] },
      { title: "Unit 2, Network Theorems", topics: ["Superposition theorem", "Thevenin's theorem", "Norton's theorem", "Maximum power transfer theorem", "Millman's theorem, Reciprocity theorem"] },
      { title: "Unit 3, AC Analysis & Phasors", topics: ["Sinusoidal steady state", "Phasors and impedance (R, L, C)", "Series and parallel AC circuits", "Power: real (W), reactive (VAR), apparent (VA)", "Power factor and correction"] },
      { title: "Unit 4, Resonance & Coupled Circuits", topics: ["Series RLC resonance: f₀, Q, bandwidth", "Parallel resonance", "Magnetically coupled circuits, mutual inductance", "Dot convention", "Ideal transformer equivalent circuit"] },
      { title: "Unit 5, Laplace & Network Functions", topics: ["Laplace transform for circuit analysis", "Initial and final value theorems", "Network functions: driving-point, transfer", "Poles, zeros, frequency response from network function", "Two-port network parameters (Z, Y, ABCD, h)"] },
    ],
  },
  "EM": {
    branch: "EEE",
    units: [
      { title: "Unit 1, DC Generators", topics: ["Construction: armature, field, commutator, brushes", "EMF equation", "Types of DC generators (series, shunt, compound)", "Characteristics: OCC, external, internal", "Voltage build-up and critical resistance"] },
      { title: "Unit 2, DC Motors", topics: ["Back EMF, torque equation", "Types: series, shunt, compound motors", "Speed-torque characteristics", "Speed control methods: armature, field control", "Starting: 3-point and 4-point starters, losses, efficiency"] },
      { title: "Unit 3, Transformers", topics: ["Construction and working principle", "EMF equation: E = 4.44fNΦm", "Equivalent circuit, phasor diagram", "OC and SC tests, efficiency, voltage regulation", "Auto-transformer, 3-phase transformer connections"] },
      { title: "Unit 4, Induction Motors", topics: ["Construction: squirrel cage vs slip ring", "Rotating magnetic field, synchronous speed", "Slip, equivalent circuit", "Torque-slip characteristics", "Starting methods (DOL, star-delta, auto-transformer), speed control"] },
      { title: "Unit 5, Synchronous Machines", topics: ["Construction and working of alternator", "EMF equation, winding factors", "Armature reaction, voltage regulation (EMF, MMF, ZPF methods)", "Synchronous motor: V-curves, hunting", "Parallel operation of alternators"] },
    ],
  },
  "PS": {
    branch: "EEE",
    units: [
      { title: "Unit 1, Power System Structure", topics: ["Generation: thermal, hydro, nuclear, renewable", "Transmission system: EHV lines", "Distribution system", "Per-unit system", "Power system components modelling"] },
      { title: "Unit 2, Transmission Line Parameters", topics: ["Resistance, inductance (GMD, GMR)", "Capacitance of lines", "Short, medium, long line models", "ABCD parameters", "Ferranti effect"] },
      { title: "Unit 3, Load Flow Analysis", topics: ["Bus classification (slack, PV, PQ)", "Gauss-Seidel load flow", "Newton-Raphson load flow", "Fast decoupled load flow", "Power flow equations"] },
      { title: "Unit 4, Fault Analysis", topics: ["Symmetrical (3-phase) fault analysis", "Symmetrical components (positive, negative, zero sequence)", "Unsymmetrical faults: SLG, LL, DLG", "Sequence networks", "Fault current calculations"] },
      { title: "Unit 5, Power System Stability", topics: ["Steady-state and transient stability", "Swing equation", "Equal area criterion", "Methods to improve stability", "Power system protection: relays, circuit breakers, fuses"] },
    ],
  },
  "PE": {
    branch: "EEE",
    units: [
      { title: "Unit 1, Power Semiconductor Devices", topics: ["Diode, SCR (thyristor) characteristics", "MOSFET and IGBT as switches", "Triggering and commutation of SCR", "Protection: snubber circuits, heat sinks"] },
      { title: "Unit 2, Rectifiers", topics: ["Half-wave and full-wave rectifiers", "Single-phase and 3-phase controlled rectifiers (R, RL, RLE loads)", "Dual converters", "Power factor and THD", "Freewheeling diode"] },
      { title: "Unit 3, DC-DC Converters (Choppers)", topics: ["Step-down (Buck) converter", "Step-up (Boost) converter", "Buck-Boost converter", "CCM and DCM operation", "Duty cycle control"] },
      { title: "Unit 4, Inverters", topics: ["Single-phase half-bridge and full-bridge inverters", "3-phase inverters (180° and 120° conduction)", "PWM techniques: sinusoidal PWM, SPWM", "Harmonic reduction", "Voltage source vs current source inverters"] },
      { title: "Unit 5, AC Voltage Controllers & Applications", topics: ["Single-phase and 3-phase AC controllers", "Cycloconverters", "Variable speed drives (VSD)", "UPS systems", "FACTS devices overview (SVC, STATCOM)"] },
    ],
  },
  "Control": {
    branch: "EEE",
    units: [
      { title: "Unit 1, Mathematical Modelling", topics: ["Transfer function of electrical and mechanical systems", "Block diagram reduction", "Signal flow graphs, Mason's gain formula", "Analogies between electrical and mechanical systems"] },
      { title: "Unit 2, Time Response Analysis", topics: ["Standard test inputs", "First and second order system responses", "Time domain specifications: tr, tp, Mp, ts", "Steady-state error and error constants", "Effect of adding poles and zeros"] },
      { title: "Unit 3, Stability Analysis", topics: ["Characteristic equation, roots", "Routh-Hurwitz criterion and special cases", "Root locus: construction rules", "Root locus for gain and phase variations"] },
      { title: "Unit 4, Frequency Response", topics: ["Bode plots: magnitude and phase", "Gain margin, phase margin", "Polar plots, Nyquist criterion", "Closed-loop frequency response", "M and N circles, Nichols chart"] },
      { title: "Unit 5, Control System Design", topics: ["Lead, lag, lead-lag compensator design", "PID controller: tuning (Ziegler-Nichols)", "State variable analysis", "Controllability and observability (Kalman's tests)", "State feedback and pole placement"] },
    ],
  },
};

// Generate auto resources for units without hardcoded res data
function genUnitRes(subj, unit) {
  const topicHint = unit.title.replace(/^Unit [IVX\d]+, /, "");
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
      trick: "Virtual ground: V⁻ = V⁺ = 0 V (non-inverting input grounded). 'Virtual' because no physical connection to ground, just forced by negative feedback." },
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
      trick: "1+SNR not SNR alone, the '+1' accounts for the noise power itself. Units: C in bps, B in Hz. Double SNR → add B·1 bps (diminishing returns)." },
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
      trick: "4 conditions: (1) Mutual exclusion (2) Hold & Wait (3) No preemption (4) Circular wait. 'Preemption allowed' actually PREVENTS deadlock, it's the opposite!" },
    { q: "CPU utilisation formula for n identical processes each spending fraction p in I/O?",
      opts: ["1−p","1−pⁿ","n(1−p)","1−n·p"], ans: 1,
      trick: "All n processes block simultaneously with probability pⁿ. So CPU utilisation = 1−pⁿ. More processes or less I/O wait → CPU stays busier." },
    { q: "Which page replacement algorithm has the lowest page fault rate but is unimplementable?",
      opts: ["FIFO","LRU","Optimal (OPT)","Clock"], ans: 2,
      trick: "OPT replaces the page not used for the longest time in future, requires future knowledge. Used only as a benchmark. LRU ≈ OPT in practice." },
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
      trick: "Weak entity has no key of its own, identified by partial key + owner entity. Example: 'Order-item' depends on 'Order'. Shown with double rectangle in ER diagram." },
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
      trick: "η = 1 − TL/TH = 1 − 300/600 = 0.5 = 50%. Always use absolute Kelvin! η represents the theoretical maximum, no real engine can exceed this." },
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
      el("p", { class: "hint" }, "Unit-wise syllabus. Tap a subject, then tap any unit to see topics and auto-linked textbook chapters, videos, and notes."),
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
                        el("span", { class: "syl-unit-name" }, u.title.replace(/^Unit [IVX\d]+, /, "")),
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
                                el("span", {}, ", " + c.ref)
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
      el("p", { class: "hint" }, "Find previous year questions for GATE and university exams, subject by subject."),
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
      el("p", { class: "hint" }, "Curated resources for campus placements, coding practice, core subjects and aptitude."),
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
    }) : [el("p", { class: "hint" }, "No exam dates configured yet. Ask your teacher to add them in config.js, your personalised countdown and daily plan will appear here.")];

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
  // 100% FREE course catalog, no subscription, no payment
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
      { name:"Theory of Computation",     branch:"CSE",       icon:"", yt:"https://www.youtube.com/results?search_query=IIT+Delhi+Theory+Computation+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
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
      { name:"Machine Learning",          branch:"CSE",       icon:"", yt:"https://www.youtube.com/results?search_query=IIT+Hyderabad+Machine+Learning+NPTEL", pdf:"https://nptel.ac.in/courses?searchQuery=machine+learning" },
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
      { name:"6.006, Algorithms",        branch:"CSE",       icon:"🧮", yt:"https://www.youtube.com/results?search_query=MIT+6.006+Introduction+to+Algorithms", pdf:"https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/" },
      { name:"6.002, Circuits",          branch:"ECE/EEE",   icon:"🔌", yt:"https://www.youtube.com/results?search_query=MIT+6.002+Circuits+Electronics", pdf:"https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/" },
      { name:"6.003, Signals & Systems", branch:"ECE",       icon:"📡", yt:"https://www.youtube.com/results?search_query=MIT+6.003+Signals+Systems", pdf:"https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/" },
      { name:"18.06, Linear Algebra",    branch:"All",       icon:"📐", yt:"https://www.youtube.com/results?search_query=MIT+18.06+Linear+Algebra+Gilbert+Strang", pdf:"https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/" },
      { name:"1.050, Solid Mechanics",   branch:"Civil/Mech",icon:"🔩", yt:"https://www.youtube.com/results?search_query=MIT+Solid+Mechanics+1.050", pdf:"https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/" },
      { name:"2.005, Thermodynamics",    branch:"Mech",      icon:"🌡️", yt:"https://www.youtube.com/results?search_query=MIT+Thermodynamics+2.005", pdf:"https://ocw.mit.edu/courses/2-005-thermal-fluids-engineering-i-fall-2003/" },
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
      { name:"Machine Learning (Ng)",      branch:"CSE",      icon:"", yt:"https://www.youtube.com/results?search_query=Andrew+Ng+Machine+Learning+Stanford+CS229", pdf:"https://cs229.stanford.edu/materials.html" },
      { name:"CS101, Intro to CS",        branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/results?search_query=Stanford+CS101+Introduction+Computer+Science", pdf:"https://online.stanford.edu/free-courses" },
      { name:"Compilers (Aiken)",          branch:"CSE",      icon:"⚙️", yt:"https://www.youtube.com/results?search_query=Stanford+CS143+Compilers+Alex+Aiken", pdf:"https://web.stanford.edu/class/cs143/" },
    ],
    "Coursera (Audit)": [
      { name:"Algorithms (Stanford), FREE",branch:"CSE",     icon:"🧮", yt:"https://www.youtube.com/results?search_query=Stanford+Algorithms+Specialization+Tim+Roughgarden", pdf:"https://www.coursera.org/specializations/algorithms" },
      { name:"Data Structures (UCSD), FREE",branch:"CSE",    icon:"🌳", yt:"https://www.youtube.com/results?search_query=UCSD+Data+Structures+Coursera", pdf:"https://www.coursera.org/specializations/data-structures-algorithms" },
      { name:"Digital Systems (UCSD), FREE",branch:"ECE",    icon:"⚡", yt:"https://www.youtube.com/results?search_query=UCSD+digital+systems+Coursera", pdf:"https://www.coursera.org/learn/digital-systems" },
      { name:"Linear Algebra (Imperial), FREE",branch:"All", icon:"📐", yt:"https://www.youtube.com/results?search_query=Imperial+College+Linear+Algebra+Coursera", pdf:"https://www.coursera.org/specializations/mathematics-machine-learning" },
    ],
    "edX Free Courses": [
      { name:"CS50, Harvard Intro CS (FREE)",branch:"CSE",   icon:"💻", yt:"https://www.youtube.com/results?search_query=CS50+Harvard+Introduction+Computer+Science+2023", pdf:"https://cs50.harvard.edu/x/" },
      { name:"Circuits & Electronics (MIT), FREE",branch:"ECE",icon:"🔌",yt:"https://www.youtube.com/results?search_query=MIT+6.002+circuits+electronics+edX", pdf:"https://www.edx.org/course/circuits-and-electronics-1-basic-circuit-analysis" },
      { name:"Engineering Maths (IITR), FREE",branch:"All", icon:"📐", yt:"https://www.youtube.com/results?search_query=IIT+Roorkee+Engineering+Mathematics+SWAYAM", pdf:"https://www.edx.org/search?q=engineering+mathematics" },
      { name:"Thermodynamics (UT Austin), FREE",branch:"Mech",icon:"🌡️",yt:"https://www.youtube.com/results?search_query=UT+Austin+Thermodynamics+edX", pdf:"https://www.edx.org/search?q=thermodynamics" },
    ],
    "Khan Academy": [
      { name:"Linear Algebra",             branch:"All",      icon:"📐", yt:"https://www.youtube.com/@khanacademy/search?query=linear+algebra", pdf:"https://www.khanacademy.org/math/linear-algebra" },
      { name:"Calculus 1, 2 & 3",          branch:"All",      icon:"∫",  yt:"https://www.youtube.com/@khanacademy/search?query=calculus", pdf:"https://www.khanacademy.org/math/calculus-1" },
      { name:"Differential Equations",     branch:"All",      icon:"📊", yt:"https://www.youtube.com/@khanacademy/search?query=differential+equations", pdf:"https://www.khanacademy.org/math/differential-equations" },
      { name:"Electric Circuits",          branch:"ECE/EEE",  icon:"🔌", yt:"https://www.youtube.com/@khanacademy/search?query=electrical+engineering+circuits", pdf:"https://www.khanacademy.org/science/electrical-engineering" },
      { name:"Physics, Mechanics",        branch:"All",      icon:"⚙️", yt:"https://www.youtube.com/@khanacademy/search?query=mechanics+physics", pdf:"https://www.khanacademy.org/science/physics" },
      { name:"Statistics & Probability",   branch:"All",      icon:"📊", yt:"https://www.youtube.com/@khanacademy/search?query=probability+statistics", pdf:"https://www.khanacademy.org/math/statistics-probability" },
    ],
    "Gate Smashers": [
      { name:"Operating Systems (Full)",   branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@GateSmashersFull/search?query=operating+systems", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"DBMS (Full)",                branch:"CSE",      icon:"🗄️", yt:"https://www.youtube.com/@GateSmashersFull/search?query=DBMS", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Computer Networks (Full)",   branch:"CSE",      icon:"🌐", yt:"https://www.youtube.com/@GateSmashersFull/search?query=computer+networks", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Theory of Computation",      branch:"CSE",      icon:"", yt:"https://www.youtube.com/@GateSmashersFull/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
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
      { name:"DBMS, Full Course",          branch:"CSE",     icon:"🗄️", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=DBMS", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Operating Systems, Full",    branch:"CSE",     icon:"💻", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=operating+systems", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"Computer Networks, Full",    branch:"CSE",     icon:"🌐", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=computer+networks", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Theory of Computation",       branch:"CSE",     icon:"", yt:"https://www.youtube.com/@KnowledgeGate9/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
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
      { name:"Theory of Computation",      branch:"CSE",      icon:"", yt:"https://www.youtube.com/@IITDelhiOfficial/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
      { name:"Digital Systems",            branch:"ECE",      icon:"⚡", yt:"https://www.youtube.com/@IITDelhiOfficial/search?query=digital+systems", pdf:"https://nptel.ac.in/courses?searchQuery=digital+systems" },
      { name:"Mathematics",                branch:"All",      icon:"📐", yt:"https://www.youtube.com/@IITDelhiOfficial/search?query=mathematics", pdf:"https://nptel.ac.in/courses?searchQuery=engineering+mathematics" },
    ],
    "Unacademy GATE": [
      { name:"GATE CSE, Free Lectures",   branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@UnacademyGATE/search?query=CSE", pdf:"https://nptel.ac.in/courses?disciplineId=106" },
      { name:"GATE ECE, Free Lectures",   branch:"ECE",      icon:"📡", yt:"https://www.youtube.com/@UnacademyGATE/search?query=ECE", pdf:"https://nptel.ac.in/courses?disciplineId=117" },
      { name:"GATE EEE, Free Lectures",   branch:"EEE",      icon:"⚡", yt:"https://www.youtube.com/@UnacademyGATE/search?query=EE", pdf:"https://nptel.ac.in/courses?disciplineId=108" },
      { name:"GATE Civil, Free Lectures", branch:"Civil",    icon:"🏗️", yt:"https://www.youtube.com/@UnacademyGATE/search?query=civil", pdf:"https://nptel.ac.in/courses?disciplineId=105" },
      { name:"GATE Mech, Free Lectures",  branch:"Mech",     icon:"⚙️", yt:"https://www.youtube.com/@UnacademyGATE/search?query=mechanical", pdf:"https://nptel.ac.in/courses?disciplineId=112" },
    ],
    "MADE Easy": [
      { name:"GATE Topper Discussions",    branch:"All",      icon:"🏆", yt:"https://www.youtube.com/@madeeasygroupofficial/search?query=GATE+topper", pdf:"https://madeeasypublications.org" },
      { name:"Shortcuts & Tricks",         branch:"All",      icon:"💡", yt:"https://www.youtube.com/@madeeasygroupofficial/search?query=shortcuts+tricks", pdf:"https://madeeasypublications.org" },
      { name:"Previous Year Solutions",    branch:"All",      icon:"📄", yt:"https://www.youtube.com/@madeeasygroupofficial/search?query=previous+year+questions", pdf:"https://madeeasypublications.org/gate-books.php" },
    ],
    "Ravindrababu Ravula": [
      { name:"Theory of Computation",      branch:"CSE",      icon:"", yt:"https://www.youtube.com/@ravindrababuravula/search?query=theory+of+computation", pdf:"https://nptel.ac.in/courses?searchQuery=theory+of+computation" },
      { name:"Operating Systems",          branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@ravindrababuravula/search?query=operating+systems", pdf:"https://nptel.ac.in/courses?searchQuery=operating+systems" },
      { name:"DBMS",                       branch:"CSE",      icon:"🗄️", yt:"https://www.youtube.com/@ravindrababuravula/search?query=DBMS", pdf:"https://nptel.ac.in/courses?searchQuery=database+management" },
      { name:"Computer Networks",          branch:"CSE",      icon:"🌐", yt:"https://www.youtube.com/@ravindrababuravula/search?query=computer+networks", pdf:"https://nptel.ac.in/courses?searchQuery=computer+networks" },
      { name:"Algorithms",                 branch:"CSE",      icon:"🧮", yt:"https://www.youtube.com/@ravindrababuravula/search?query=algorithms", pdf:"https://nptel.ac.in/courses?searchQuery=algorithms" },
    ],
    "5 Minutes Engineering": [
      { name:"Quick Concepts, CSE",       branch:"CSE",      icon:"💻", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=computer+science", pdf:"https://nptel.ac.in/courses?disciplineId=106" },
      { name:"Quick Concepts, ECE",       branch:"ECE",      icon:"📡", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=electronics", pdf:"https://nptel.ac.in/courses?disciplineId=117" },
      { name:"Quick Concepts, Mech",      branch:"Mech",     icon:"⚙️", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=mechanical", pdf:"https://nptel.ac.in/courses?disciplineId=112" },
      { name:"Quick Concepts, Civil",     branch:"Civil",    icon:"🏗️", yt:"https://www.youtube.com/@5MinutesEngineering/search?query=civil", pdf:"https://nptel.ac.in/courses?disciplineId=105" },
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
            el("div", { class: "gate-res-det-sub" }, res.sub || "Free content, no payment needed"),
          ),
        ),
        el("a", { class: "btn sm", href: res.url, target: "_blank", rel: "noopener noreferrer" }, btnLabel),
      ),
      el("div", { class: "gate-free-badge" }, "✅ 100% FREE, No subscription, no payment, no login required"),
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
    { name: "IIT Bombay", sub: "NPTEL courses, ECE, CS, Civil, Mech", emoji: "🏛", url: "https://nptel.ac.in/institutes/106101010" },
    { name: "IIT Delhi", sub: "NPTEL courses, All engineering", emoji: "🏛", url: "https://nptel.ac.in/institutes/110101002" },
    { name: "IIT Madras", sub: "NPTEL courses, ECE, CS, Mech", emoji: "🏛", url: "https://nptel.ac.in/institutes/106106047" },
    { name: "IIT Kanpur", sub: "NPTEL + GATE papers archive", emoji: "🏛", url: "https://nptel.ac.in/institutes/101104025" },
    { name: "IIT Kharagpur", sub: "NPTEL courses, Civil, EEE, ECE", emoji: "🏛", url: "https://nptel.ac.in/institutes/105105127" },
    { name: "IIT Roorkee", sub: "NPTEL courses, Civil, ECE, CS", emoji: "🏛", url: "https://nptel.ac.in/institutes/107107145" },
    { name: "IIT Hyderabad", sub: "NPTEL courses, CS, ECE, EEE", emoji: "🏛", url: "https://nptel.ac.in/institutes/102107086" },
    { name: "NIT Warangal", sub: "NPTEL courses, All branches", emoji: "🏫", url: "https://nptel.ac.in/institutes/105109055" },
    { name: "NIT Trichy", sub: "NPTEL courses, Civil, Mech, ECE", emoji: "🏫", url: "https://nptel.ac.in/institutes/106106085" },
    { name: "IISc Bangalore", sub: "NPTEL, Advanced research courses", emoji: "🔬", url: "https://nptel.ac.in/institutes/106101003" },
  ];
  const GATE_WORLD = [
    { name: "MIT OpenCourseWare", sub: "Free MIT courses, CS, EEE, Civil", emoji: "🇺🇸", url: "https://ocw.mit.edu" },
    { name: "MIT YouTube", sub: "Full lecture videos, HD", emoji: "▶️", url: "https://www.youtube.com/@mitocw" },
    { name: "Stanford Online", sub: "Free courses, CS, AI, Mech", emoji: "🏫", url: "https://online.stanford.edu/free-courses" },
    { name: "Coursera (Audit)", sub: "Top university courses, free audit", emoji: "🌐", url: "https://www.coursera.org" },
    { name: "edX Free Courses", sub: "MIT, Harvard, IIT, free audit", emoji: "📖", url: "https://www.edx.org/search?q=engineering" },
    { name: "Khan Academy", sub: "Maths, Physics, concept building", emoji: "🧮", url: "https://www.khanacademy.org" },
  ];
  const GATE_VIDEOS = [
    { name: "Gate Smashers", sub: "CSE, Full GATE playlist HD", emoji: "💻", url: "https://www.youtube.com/@GateSmashersFull" },
    { name: "Neso Academy", sub: "ECE & CSE, HD lectures", emoji: "📡", url: "https://www.youtube.com/@NesoAcademy" },
    { name: "NPTEL Official", sub: "All branches, IIT faculty HD", emoji: "🎓", url: "https://www.youtube.com/@nptel" },
    { name: "Knowledge Gate", sub: "CSE, Concepts + PYQs", emoji: "🧠", url: "https://www.youtube.com/@KnowledgeGate9" },
    { name: "EE Academy", sub: "EEE / ECE, Circuit theory", emoji: "⚡", url: "https://www.youtube.com/@EEAcademy1" },
    { name: "Civil Guruji", sub: "Civil, Full GATE HD", emoji: "🏗️", url: "https://www.youtube.com/@CivilGuruji" },
    { name: "IIT Madras Online", sub: "IIT Madras official lectures", emoji: "🏛", url: "https://www.youtube.com/@iitmadrasonline" },
    { name: "IIT Delhi Official", sub: "IIT Delhi lecture series", emoji: "🏛", url: "https://www.youtube.com/@IITDelhiOfficial" },
    { name: "Unacademy GATE", sub: "Live + recorded free content", emoji: "🎯", url: "https://www.youtube.com/@UnacademyGATE" },
    { name: "MADE Easy", sub: "Toppers & expert discussions", emoji: "📘", url: "https://www.youtube.com/@madeeasygroupofficial" },
    { name: "Ravindrababu Ravula", sub: "CSE, Theory of Computation, OS", emoji: "💡", url: "https://www.youtube.com/@ravindrababuravula" },
    { name: "5 Minutes Engineering", sub: "Quick concept videos all branches", emoji: "⏱", url: "https://www.youtube.com/@5MinutesEngineering" },
  ];
  const GATE_PAPERS = [
    { name: "Official GATE Papers", sub: "All years, IIT Kanpur archive", emoji: "📄", url: "https://gate.iitk.ac.in/GATE_past_papers.html" },
    { name: "NPTEL Notes (PDF)", sub: "Subject-wise free lecture notes", emoji: "📚", url: "https://nptel.ac.in/courses" },
    { name: "SWAYAM Free Courses", sub: "Govt platform, IIT/NIT faculty", emoji: "🇮🇳", url: "https://swayam.gov.in" },
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
      // pre-filter by pyqYear via query trick, store in state
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
        el("div", { class: "gate-section-title" }, "🏛 Top IITs & NITs, Free Courses"),
        el("div", { class: "gate-section-sub" }, "Tap any institute → see subjects → ▶ watch video in HD · 📄 download PDF, all 100% free"),
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
        el("div", { class: "gate-section-sub" }, "MIT, Stanford, Khan Academy, tap to see free courses"),
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
        el("div", { class: "gate-section-sub" }, "Tap a channel → see subjects → ▶ opens YouTube, plays in HD immediately"),
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
    ? "1. Ask, pick the subject and write the question. Add a photo of your notebook or write it on the notebook page.\n2. Answer, open any doubt and explain the steps. You can attach your handwritten working too.\n3. Resolve, the student who asked marks the answer that helped. Tap \u201cI have this doubt too\u201d on doubts you share."
    : state.tab === "market"
    ? "1. List, post an item with price, condition and WhatsApp number.\n2. Browse, search by category or filter available items.\n3. Contact, buyer taps WhatsApp button to reach seller directly.\n4. Sold, mark your listing as Sold once done."
    : "1. Share, post an idea for a project, startup or research. Sketch it on the notebook page if that helps.\n2. Like, tap ♥ on ideas you want to see happen.\n3. Build, reply with thoughts, improvements or an offer to join.";

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
      el("button", { class: "btn", type: "button", onclick: () => showPanel("network") }, "🌐 College network")),
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
    }, "Start Quiz")
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

// ---- Who should see a doubt: all campuses of the college, or my campus first, and optionally other colleges ----
let askNet = [];   // colleges chosen for "also ask other colleges" in the open form
const NET_MAX = 3, NET_DAILY = 5;
const netToday = () => { const st = readJSON("dd-net-day", {}); return st.day === dayStr() ? (st.n || 0) : 0; };
const roomOfCollege = async (slug) => {
  if (slug === "rgukt") return DEFAULT_ROOM_PATH.replace(/^rooms\//, "").replace(/\/$/, "");
  try { const d = store.getTop ? await store.getTop("colleges", slug) : null; if (d && typeof d.room === "string" && /^[A-Za-z0-9_-]{3,60}$/.test(d.room)) return d.room; } catch (_) {}
  return "college-" + slug;
};
const campusLabel = (c) => ({ RKVALLEY: "RK Valley" })[c] || String(c).charAt(0) + String(c).slice(1).toLowerCase();
const AUD_TABS = ["doubts", "ideas", "clubs", "gate", "jobs"];
let askTo = [];   // campuses chosen with "Choose campuses"
function audienceBlock(withNet) {
  const myC = getCampus(), hasCampuses = CAMPUSES.length > 0, canNet = !!(store && store.setIn && withNet);
  if (!hasCampuses && !canNet) return null;   // a one-campus college has nothing to choose here
  const box = el("div", { class: "aud-box" }), summary = el("p", { class: "aud-sum", role: "status" });
  const picker = el("div", { class: "aud-camps", hidden: "" });
  const mode = () => { const r = box.querySelector("input[name=aud]:checked"); return r ? r.value : "all"; };
  const sum = () => {
    const m = mode();
    summary.textContent = m === "all" ? "\u{1F4E2} Visible to all " + CAMPUSES.length + " campuses of " + COLLEGE + "." : m === "my" ? "\u{1F3EB} " + (myC ? myC + " students see it first" : "Pick your campus first to use this") + ". Everyone can still find it." : askTo.length ? "\u{1F3AF} Sent to " + askTo.map(campusLabel).join(", ") + ". Everyone can still find it." : "\u{1F3AF} Tap the campuses you want to reach.";
    picker.hidden = m !== "pick";
  };
  const seg = (value, icon, title, on) => el("label", { class: "aud-seg" }, el("input", { type: "radio", name: "aud", value, checked: on ? "" : null, onchange: sum }), el("span", {}, el("b", {}, icon), el("i", {}, title)));
  CAMPUSES.forEach(c => picker.append(el("button", { type: "button", class: "aud-camp" + (askTo.includes(c) ? " on" : ""), style: "--cc:" + campusColor(c), "aria-pressed": String(askTo.includes(c)), onclick: (e) => { askTo = askTo.includes(c) ? askTo.filter(x => x !== c) : [...askTo, c]; e.currentTarget.classList.toggle("on", askTo.includes(c)); e.currentTarget.setAttribute("aria-pressed", String(askTo.includes(c))); try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {} sum(); } }, el("span", { class: "ac-ic" }, CAMPUS_ICON[c] || "\u{1F3EB}"), el("span", { class: "ac-nm" }, campusLabel(c)), el("span", { class: "ac-ck", "aria-hidden": "true" }, "\u2713"))));
  const chips = el("div", { class: "aud-chips" }), results = el("div", { class: "aud-results" }), note = el("p", { class: "hint" });
  const drawChips = () => { chips.replaceChildren(...askNet.map(c => el("span", { class: "aud-chip" }, c.name, el("button", { type: "button", "aria-label": "Remove " + c.name, onclick: () => { askNet = askNet.filter(x => x.slug !== c.slug); drawChips(); drawResults(); } }, "\u2715")))); note.textContent = askNet.length ? "Your doubt will also be sent to " + askNet.length + " college" + (askNet.length === 1 ? "" : "s") + ". Answers come back to you here." : ""; };
  const all = [...(SEL !== "rgukt" ? [{ slug: "rgukt", name: "RGUKT AP", state: "Andhra Pradesh" }] : []), ...DIRECTORY.filter(c => c.slug !== SEL && c.slug !== "rgukt").map(c => ({ slug: c.slug, name: c.name, state: c.state || "" }))];
  const q = el("input", { type: "search", placeholder: "Search a college to ask\u2026", "aria-label": "Search colleges to ask", autocomplete: "off" });
  const drawResults = () => {
    const n = q.value.trim().toLowerCase();
    if (!n) { results.replaceChildren(); return; }
    const rows = all.filter(c => !askNet.some(x => x.slug === c.slug) && (c.name + " " + c.state).toLowerCase().includes(n)).slice(0, 6);
    results.replaceChildren(...(rows.length ? rows.map(c => el("button", { type: "button", class: "aud-res", onclick: () => { if (askNet.length >= NET_MAX) { note.textContent = "You can pick up to " + NET_MAX + " colleges."; return; } askNet.push(c); q.value = ""; drawChips(); drawResults(); } }, el("b", {}, c.name), el("small", {}, c.state))) : [el("p", { class: "hint" }, "No college found.")]));
  };
  q.addEventListener("input", drawResults);
  box.append(el("div", { class: "label" }, "Send your post to"),
    hasCampuses ? el("div", { class: "aud-segs", role: "radiogroup" }, seg("all", "\u{1F310}", "All campuses", true), seg("my", "\u{1F3EB}", "My campus", false), seg("pick", "\u{1F3AF}", "Choose", false)) : null,
    hasCampuses ? picker : null, hasCampuses ? summary : null,
    canNet ? el("details", { class: "aud-net" }, el("summary", {}, "\u{1F30D} Also ask students of other colleges (optional)"),
      el("p", { class: "hint" }, "Pick up to " + NET_MAX + " colleges. Their students will see your doubt with your first name and your college name. Do not share private details."),
      q, results, chips, note) : null);
  drawChips(); sum();
  return box;
}

function renderAsk(existing) {
  if (!existing) { askNet = []; askTo = []; } askTo = [];
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
    if (isAcademicTab(state.tab)) {
      const hasAtt = newPages.length > 0 || newFileLinks.some(f => f.url) || !!(existing && ((existing.pages || []).length || (existing.fileAttachments || []).length));
      const prob = academicProblem("question", title + " " + body, true) || (title.length < 8 ? "Make the title a clear question (at least 8 characters)." : "") || (body.length < 20 && !hasAtt ? "Add details (at least 20 characters): the chapter, the full problem and what you tried. Or attach a photo or file." : "");
      if (prob) { err.textContent = prob; err.hidden = false; return; }
    }
    const wait = existing ? "" : (state.tab === "doubts" && doubtsToday() >= DOUBT_DAILY_MAX ? "You have asked " + DOUBT_DAILY_MAX + " doubts today, which is the daily limit. Please come back tomorrow, and meanwhile try answering a classmate\u2019s doubt." : spamCheck());
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
      let netTargets = [];
      if (AUD_TABS.includes(state.tab) && CAMPUSES.length) {
        const audEl = form.querySelector("input[name=aud]:checked"), av = audEl ? audEl.value : "all";
        if (av === "pick") {
          if (!askTo.length) { err.textContent = "Tap at least one campus to send your post to, or choose All campuses."; err.hidden = false; btn.disabled = false; btn.textContent = label; return; }
          doc.aud = "pick"; doc.to = askTo.slice(0, 4);
        } else doc.aud = av === "my" && myC ? "my" : "all";
      }
      if (state.tab === "doubts") {
        if (askNet.length && store.setIn) {
          if (netToday() >= NET_DAILY) { err.textContent = "You can ask other colleges " + NET_DAILY + " times a day. Remove the other colleges, or try again tomorrow."; err.hidden = false; btn.disabled = false; btn.textContent = label; return; }
          for (const c of askNet.slice(0, NET_MAX)) { try { netTargets.push({ slug: c.slug, name: c.name, room: await roomOfCollege(c.slug), id: store.newId("doubts") }); } catch (_) {} }
          if (netTargets.length) doc.sentTo = netTargets.map(x => ({ slug: x.slug, name: x.name, room: x.room, id: x.id }));
        }
      }
      // Show the new post straight away; the live update replaces it with the saved copy.
      state[t.coll] = [{ id, ...doc }, ...state[t.coll].filter(x => x.id !== id)];
      state.group = "All"; state.query = ""; $("search").value = "";
      openItem(id);
      notePosted(); if (state.tab === "doubts") noteDoubt();
      // Pages are saved first so classmates never see a post with missing pages.
      doc.pages = await trySavePages(newPages, id, pageIds);
      state[t.coll] = state[t.coll].map(x => x.id === id ? { ...x, pages: doc.pages } : x);
      await store.set(t.coll, id, doc);
      if (state.tab === "ideas") showdownScore("idea");
      if (netTargets.length) {
        const copy = { title: doc.title, body: doc.body + (pageIds.length || readyFiles.length ? "\n\n(This doubt has a photo or file on the " + COLLEGE + " board.)" : ""), [t.field]: group, authorId: store.uid, authorName: doc.authorName, anonymous, urgent, createdAt: Date.now(), via: COLLEGE.slice(0, 80), viaSlug: SEL, viaOf: id, resolvedReplyId: null };
        if (doc.year) copy.year = doc.year; if (doc.tags) copy.tags = doc.tags;
        const bad = [];
        for (const tg of netTargets) { try { await store.setIn(tg.room, "doubts", tg.id, { ...copy, createdAt: Date.now() }); } catch (_) { bad.push(tg.name); } }
        writeJSON("dd-net-day", { day: dayStr(), n: netToday() + 1 });
        showNotice(bad.length ? "Sent to " + (netTargets.length - bad.length) + " other college(s). Could not send to " + bad.join(", ") + " (it may need a verified college email)." : "\u{1F30D} Also sent to " + netTargets.map(x => x.name).join(", ") + ". Answers will appear on your doubt.");
      }
    } catch (e2) {
      state.mode = "ask"; render();
      showNotice(errText(e2));
    }
  } },
    el("div", { class: "two" },
      el("label", {}, ({ doubts: "Your question", ideas: "Your idea", clubs: "Post title", gate: "Discussion title", challenges: "Challenge title", market: "Item title", jobs: "Opening or experience" })[state.tab] || "Title", el("input", { id: "f-title", name: "title", maxlength: "200", required: true, placeholder: t.placeholder })),
      el("label", {}, state.tab === "doubts" ? "Subject" : "Category", el("select", { id: "f-group", name: "group" }, ...(RGUKT_DEPTS && (state.tab === "doubts" || state.tab === "gate") ? (() => { const seen = new Set(); const og = Object.entries(RGUKT_DEPTS).map(([d, list]) => el("optgroup", { label: d }, ...list.filter(s => !seen.has(s) && seen.add(s)).map(s => el("option", { selected: s === current }, s)))); const rest = groups.filter(s => !seen.has(s)); return [...og, ...(rest.length ? [el("optgroup", { label: "Other" }, ...rest.map(s => el("option", { selected: s === current }, s)))] : [])]; })() : groups.map(s => el("option", { selected: s === current }, s)))))),
    state.tab === "jobs" && el("div", { class: "two" },
      el("label", {}, "Company / organisation", el("input", { name: "company", maxlength: "60", placeholder: "e.g. TCS", value: existing && existing.company || "" })),
      el("label", {}, "Pay / stipend (optional)", el("input", { name: "pay", maxlength: "40", placeholder: "e.g. ₹15,000 per month", value: existing && existing.pay || "" }))),
    state.tab === "jobs" && el("div", { class: "two" },
      el("label", {}, "Last date to apply", el("input", { name: "deadline", type: "date", value: existing && existing.deadline || "" })),
      el("label", {}, "Apply link (https)", el("input", { name: "applyUrl", type: "url", maxlength: "300", placeholder: "https://…", value: existing && existing.applyUrl || "" }))),
    (state.tab === "doubts" || state.tab === "gate") && el("div", { class: "two" },
      el("label", {}, "Your Batch Year",
        el("select", { id: "f-year", name: "year" },
          ["(Select year)", "E1", "E2", "E3", "E4"].map(y => el("option", { value: y === "(Select year)" ? "" : y, label: y === "(Select year)" ? "(Select year)" : yl(y), selected: existing ? existing.year === y : (state.yearFilter !== "All" && state.yearFilter === y) }, y))
        )
      ),
      el("label", {}, "Tags (optional)", el("input", { id: "f-tags", name: "tags", maxlength: "100", placeholder: "e.g. mid-1, unit-2, tricky" }))),
    AUD_TABS.includes(state.tab) && !existing && audienceBlock(state.tab === "doubts"),
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
    el("label", {}, "Details", el("textarea", { id: "f-body", name: "body", rows: "6", maxlength: "5000", placeholder: t.bodyHint })),
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

// Answers given to a doubt in the other colleges it was sent to. Loaded on demand and shown read-only with the college name.
const xAns = {};
function otherCollegeAnswers(d) {
  const box = el("div", { class: "x-ans" }), sent = d.sentTo.filter(x => x && x.room && x.id);
  const draw = () => {
    const st = xAns[d.id] || { rows: null };
    box.replaceChildren(el("div", { class: "label" }, "\u{1F30D} Also asked in " + sent.map(x => x.name).join(", ")),
      st.rows == null ? el("p", { class: "hint" }, st.err ? "Could not load answers from other colleges." : "Loading answers from other colleges\u2026")
      : st.rows.length ? el("div", { class: "answers" }, ...st.rows.filter(r => !r.deleted).map(r => el("div", { class: "ans x" }, el("p", { class: "ans-body" }, r.body || ""), el("small", { class: "hint" }, "\u{1F30D} " + r.college + " \u00B7 " + (r.anonymous ? "Anonymous" : r.authorName || "Student") + " \u00B7 " + ago(r.createdAt)))))
      : el("p", { class: "hint" }, "No answers from other colleges yet. They usually appear within a few hours."),
      el("button", { class: "linkbtn", type: "button", onclick: () => { delete xAns[d.id]; load(true); } }, "\u21BB Refresh"));
  };
  const load = async (force) => {
    const st = xAns[d.id];
    if (st && st.rows && !force && Date.now() - st.at < 60000) { draw(); return; }
    xAns[d.id] = { rows: null, at: Date.now() }; draw();
    try {
      const lists = await Promise.all(sent.map(async x => (await store.repliesIn(x.room, x.id)).map(r => ({ ...r, college: x.name }))));
      xAns[d.id] = { rows: lists.flat().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)), at: Date.now() }; draw();
    } catch (_) { xAns[d.id] = { rows: null, err: true, at: Date.now() }; draw(); }
  };
  draw(); if (store && store.repliesIn) load(false);
  return box;
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
      d.year && el("span", { class: "pill year-pill" }, yl(d.year)),
      state.tab === "doubts" && isUrgent(d) && el("span", { class: "pill urgent" }, "🔥 Urgent"),
      state.tab === "doubts" && el("span", { class: "pill " + (d.resolvedReplyId ? "done" : "open") }, d.resolvedReplyId ? "Resolved" : "Open"),
      state.tab === "doubts" && d.bounty && !d.resolvedReplyId && el("span", { class: "pill bounty" }, "🎁 Bounty"),
      d.campus && CAMPUSES.length > 0 && el("span", { class: "campus-badge", style: "--cc:" + campusColor(d.campus) }, d.campus),
      d.via && el("span", { class: "pill via-pill" }, "\u{1F30D} From " + d.via),
      el("span", { class: "author-row" }, d.anonymous ? avatarEl("👤") : avatarEl(mine(d) ? getAvatar() : avatarFor(d.authorName || "")), "By " + who(d) + " · " + ago(d.createdAt))),
    el("h2", {}, d.title),
    d.tags && el("div", { class: "post-tags" }, ...d.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => el("span", { class: "post-tag" }, "#" + tag))),
  ];
  if (own && AUD_TABS.includes(state.tab)) {
    const aud = d.aud === "pick" && Array.isArray(d.to) && d.to.length ? "Sent to " + d.to.map(campusLabel).join(", ") + " students. Everyone in " + COLLEGE + " can still find it."
      : d.aud === "my" && d.campus ? "Shown first to " + campusLabel(d.campus) + " students. Everyone in " + COLLEGE + " can still find it."
      : CAMPUSES.length ? "Visible to all campuses of " + COLLEGE + "." : "Visible to students of " + COLLEGE + ".";
    out.push(el("p", { class: "aud-line" }, el("b", {}, "Who can see this: "), aud + (Array.isArray(d.sentTo) && d.sentTo.length ? " Also sent to " + d.sentTo.map(x => x.name).join(", ") + "." : "") + " Students of other colleges cannot see it unless you chose to send it to them."));
  }
  if (state.tab === "doubts") { try { const pk = pushAskCard(d); if (pk) out.push(pk); } catch (_) {} }
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
      { name: "Gemini AI", icon: "✦", desc: "Google AI, best for students", color: "#1a73e8",
        url: "https://gemini.google.com/app?q=" + q },
      { name: "ChatGPT", icon: "", desc: "Step-by-step answers", color: "#10a37f",
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
        }, "Ask AI", el("span", { class: "ai-arr" }, aiOpen ? "▲" : "▼")),
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
      out.push(el("p", { class: "hint" }, "No MCQ questions, reply with your answer or idea below."));
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
  if (!d.anonymous && !isHidden(d) && ["doubts", "ideas", "clubs", "gate", "challenges", "jobs"].includes(t.coll)) {
    actions.push(el("button", { class: "btn sm", type: "button", onclick: async (e) => {
      const b = e.currentTarget; b.disabled = true;
      const ok = await shareToStory({ kind: "share", text: String(d.title || "").slice(0, 200), caption: String(d.body || "").slice(0, 300) || undefined, ref: t.coll + "/" + d.id });
      b.disabled = false; b.textContent = ok ? "✅ Shared to your story" : "📖 Share to my story";
    } }, "📖 Share to my story"));
  }
  const rep = reportButton(t.coll, d);
  if (rep) actions.push(rep);
  if (actions.length) out.push(el("div", { class: "rowbtns" }, actions));

  if (state.tab === "doubts" && d.via) out.push(el("div", { class: "via-banner" }, "\u{1F30D} A student of " + d.via + " asked this. Your answer goes back to them. Be kind and clear."));
  if (state.tab === "doubts" && Array.isArray(d.sentTo) && d.sentTo.length && own) { out.push(otherCollegeAnswers(d)); }
  if (state.tab === "doubts") out.push(expertHelp(d));
  if (state.tab === "doubts" && own) { const pv = privateAnswersFor(d); if (pv) out.push(pv); }
  if (state.tab === "doubts" && !own && state.privAns.some(x => x.doubtId === d.id && x.ownerUid === (store && store.uid))) out.push(el("p", { class: "hint" }, "\u{1F512} You sent a private answer to the asker."));
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
      own && state.tab === "doubts" && !mine(r) && r.body && r.body !== PAGE_ONLY ? aiCheckBox("r" + r.id, d.title + (d.body ? ". " + d.body : ""), async () => ({ answer: r.body, img: "" })) : null,
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
    if (isAcademicTab(state.tab)) { const prob = academicProblem("answer", body, pages.length > 0 || replyFiles.some(f => f.url)); if (prob) { const m = $("f-reply-msg"); if (m) { m.textContent = prob; m.hidden = false; } else showNotice(prob); return; } }
    if (replyFiles.some(f => f.pct !== undefined)) { showNotice("Please wait for uploads to finish."); return; }
    const wait = postingBlocked();   // answers have no daily or hourly limit; only blocked or paused students are stopped
    if (wait) { showNotice(wait); return; }
    if (state.replyPriv && state.tab === "doubts" && d.ownerUid && !own) {
      try {
        const imgs = []; for (const u of pages.slice(0, 2)) imgs.push(await shrinkJpeg(u));
        const pid = store.newId("privateAnswers");
        await store.set("privateAnswers", pid, { doubtId: d.id, toUid: d.ownerUid, ownerUid: store.uid, authorId: store.uid, authorName: state.replyAnon ? ANON : getName(), anonymous: state.replyAnon, body: body.slice(0, 5000), ...(imgs.length ? { imgs } : {}), createdAt: Date.now() });
        state.replyPages = []; state.replyPriv = false; form.reset(); showNotice("Sent privately. Only the asker can see it."); render();
      } catch (er) { showNotice(errText(er)); }
      return;
    }
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
      if (t.coll === "doubts" && d.authorId !== store.uid) showdownScore("answer");
    }
    catch (e2) { state.replies = state.replies.filter(x => x.id !== id); render(); showNotice(errText(e2)); }
  } },
    el("label", { for: "f-reply", class: "label" }, t.replyLabel),
    el("textarea", { id: "f-reply", name: "reply", maxlength: "5000", placeholder: state.tab === "doubts" ? "Explain step by step. Show the working, not only the result." : "Add a thought, an improvement, or offer to help build it." }),
    el("p", { class: "hint st-err", id: "f-reply-msg", role: "alert", hidden: true }),
    attachPicker(state.replyPages, MAX_PAGES),
    store.uploadFile ? filePicker(replyFiles) : null,
    state.tab === "doubts" && d.ownerUid && !own ? el("label", { class: "check" }, el("input", { type: "checkbox", id: "f-reply-priv", checked: state.replyPriv, onchange: (e) => { state.replyPriv = e.target.checked; } }), "\u{1F512} Send as a private answer (only the asker sees it)") : null,
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

// The optional tools load in the background (lazy.js). If a panel needs one before it has arrived, start loading and redraw when it is ready.
function needLazy() { try { if (window.__lazy && !window.__lazy.isDone()) { window.__lazy.now(); document.addEventListener("lazy-ready", () => { try { render(); } catch (_) {} }, { once: true }); } } catch (_) {} }
function openAsk() {
  state.mode = getName() ? "ask" : "name";
  if (!getName()) state.afterName = "ask";
  render();
  if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" });
}

let sheetKey = "";
// Which branches run on which RGUKT AP campus, worked out from the E3 and E4 rows of the RGUKT timetable (see rgukt-curriculum.js).
const CAMPUS_CODE = { NUZVID: "NUZ", ONGOLE: "ONG", RKVALLEY: "RKV", SRIKAKULAM: "SKLM" };
const CAMPUS_DISTRICT = { NUZVID: "Eluru district", ONGOLE: "Prakasam district", RKVALLEY: "YSR district", SRIKAKULAM: "Srikakulam district" };
function branchesOnCampus(campus) {
  const C = window.RGUKT_CURRICULUM, code = CAMPUS_CODE[campus]; if (!C || !code) return [];
  const out = [];
  for (const b of Object.keys(C.branches)) {
    let anyAll = false, listed = false;
    for (const y of ["E3", "E4"]) for (const r of ((C.data[y] || {})[b] || [])) { if (r[4] === "ALL") anyAll = true; else if (String(r[4]).split(",").includes(code)) listed = true; }
    if (anyAll || listed) out.push(b);
  }
  return out;
}
function renderCampusPicker() {
  const rich = IS_RGUKT && !!window.RGUKT_CURRICULUM;
  return [
    el("h2", {}, "\u{1F3EB} Pick your campus"),
    el("p", { class: "body" }, IS_RGUKT ? COLLEGE + " runs on four campuses: Nuzvid, Ongole, RK Valley and Srikakulam. Pick yours so your posts are tagged with it and your campus mates can find you. You still see doubts, ideas and clubs from everyone." : "Connect with students from all " + COLLEGE + " campuses. Pick your campus to tag your posts. You'll still see doubts, ideas and clubs from everyone."),
    el("div", { class: "campus-picker-grid" },
      ...CAMPUSES.map(c => {
        const brs = rich ? branchesOnCampus(c) : [], n = campusPostCount(c), full = CAMPUS_FULL[c] || COLLEGE;
        return el("button", { type: "button", class: "campus-pick-btn" + (rich ? " rich" : ""), style: "--cc:" + campusColor(c), onclick: () => { setCampus(c); state.mode = "intro"; render(); try { confetti(); } catch (_) {} } },
          el("span", { class: "campus-pick-icon" }, CAMPUS_ICON[c] || "\u{1F3EB}"), el("span", { class: "campus-pick-name" }, c), el("span", { class: "campus-pick-sub" }, full),
          rich ? el("span", { class: "cp-meta" }, "\u{1F4CD} " + (CAMPUS_DISTRICT[c] || "")) : null,
          rich && brs.length ? el("span", { class: "cp-brs" }, ...brs.map(b => el("i", {}, b))) : null,
          rich ? el("span", { class: "cp-live" }, n ? "\u{1F525} " + n + " post" + (n === 1 ? "" : "s") + " from this campus" : "Be the first to post here") : null,
          rich ? el("span", { class: "cp-go" }, "Choose " + (({ RKVALLEY: "RK Valley" })[c] || c.charAt(0) + c.slice(1).toLowerCase()) + " \u2192") : null);
      })
    ),
    rich ? el("p", { class: "hint" }, "Branches are taken from the RGUKT timetable. Chemical and Metallurgical run only at Nuzvid and RK Valley.") : null,
    el("p", { class: "hint" }, "You can change your campus anytime from the Campus bar above the feed."),
    el("button", { class: "btn", type: "button", onclick: () => { state.mode = "intro"; render(); } }, "Skip for now"),
  ];
}

// ---------- profile photo (DP) and 24-hour stories ----------
const STORY_ROW_MIN = 3, STORY_MS = 86400000, STORY_SHOW = 5500, STORY_DAILY_MAX = 10;
const STORY_BG = [["#7c3aed", "#2563eb"], ["#db2777", "#f97316"], ["#059669", "#0ea5e9"], ["#f59e0b", "#ef4444"], ["#1e293b", "#6366f1"], ["#0d9488", "#84cc16"], ["#9333ea", "#ec4899"], ["#0f172a", "#334155"]];
const DP_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{20,40000}$/;
const IMG_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{20,700000}$/;
const getDp = () => { try { const v = localStorage.getItem("dd-dp"); return DP_OK.test(v || "") ? v : ""; } catch (_) { return ""; } };
// Report a person's profile photo or status line. Sends a private report to the admin queue and hides that item for you at once.
function openProfileReport(id, name) {
  if (!store || !id || allMyIds().has(id)) return;
  const text = statusOfId(id), close = () => box.remove(), say = el("p", { class: "hint", role: "status" });
  let what = profHidden(id, "dp") && text ? "status" : "dp", reason = "";
  const pick = (opts, cur, set) => el("div", { class: "rowbtns" }, ...opts.map(([k, l]) => { const b = el("button", { type: "button", class: "btn sm" + (cur() === k ? " primary" : ""), onclick: () => { set(k); b.parentNode.querySelectorAll("button").forEach(x => x.classList.remove("primary")); b.classList.add("primary"); } }, l); return b; }));
  const send = async (e) => {
    if (!reason) { say.textContent = "Pick a reason first."; return; }
    e.currentTarget.disabled = true;
    try {
      const rec = { target: id, what, reason, reporter: store.authUid ? store.authUid() : store.uid, name: String(name || "").slice(0, 40), createdAt: Date.now() };
      if (what === "status" && text) rec.text = text.slice(0, 60);
      await store.set("profileReports", rec.reporter + "_" + id + "_" + what, rec);
      const done = readJSON("dd-prof-rep", []); done.push(id + "|" + what); writeJSON("dd-prof-rep", done.slice(-200));
      state.profiles = state.profiles.slice(); _dpSrc = null; try { render(); renderStoryBar(); } catch (_) {}
      say.textContent = "Thank you. We hid it for you and sent it to the admin to review."; setTimeout(close, 1800);
    } catch (er) { say.textContent = er && er.code === "permission-denied" ? "You can report once per item." : "Could not send. Check your internet and try again."; e.currentTarget.disabled = false; }
  };
  const box = el("div", { class: "welcome", role: "dialog", "aria-modal": "true" }, el("div", { class: "welcome-card" },
    el("h2", {}, "Report " + (name || "this person")), el("p", { class: "hint" }, "What is the problem?"),
    pick([["dp", "Profile photo"], ["status", "Status line"]], () => what, (k) => { what = k; }),
    el("p", { class: "hint" }, "Why?"),
    pick([["a", "Abuse"], ["b", "Bullying or unsafe"], ["p", "Personal info"], ["s", "Spam"]], () => reason, (k) => { reason = k; }),
    say, el("div", { class: "rowbtns" }, el("button", { type: "button", class: "btn primary", onclick: send }, "Send report"), el("button", { type: "button", class: "btn", onclick: close }, "Cancel"))));
  document.body.append(box);
}
let _dpSrc = null, _dpMap = new Map();
function dpByName(name) {
  if (_dpSrc !== state.profiles) { _dpSrc = state.profiles; _dpMap = new Map(); for (const p of [...state.profiles].sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0))) if (p.name && p.dp && !profHidden(p.id, "dp")) _dpMap.set(p.name, p.dp); }
  return _dpMap.get(name) || "";
}
const getStatus = () => { try { return (localStorage.getItem("dd-status") || "").slice(0, 60); } catch (_) { return ""; } };
const profHidden = (id, what) => { const h = (state.profileHidden || []).find(x => x.id === id); return !!(h && h[what] === true) || (readJSON("dd-prof-rep", []).includes(id + "|" + what)); };
const statusOfId = (id) => { if (allMyIds().has(id)) return getStatus(); if (profHidden(id, "status")) return ""; const p = state.profiles.find(x => x.id === id); return (p && p.status) || ""; };
const dpOfId = (id, name) => { const p = state.profiles.find(x => x.id === id); return (p && p.dp && !profHidden(id, "dp") && p.dp) || (allMyIds().has(id) && getDp()) || dbUrl(name || id); };
// Academic-only images. Approximate, on-device check: personal photos (selfies, portraits) have a large share of
// skin-coloured pixels and little paper/board background, while notes, diagrams and screenshots do not. The browser's
// face detector is used too when the phone has one. Reports are the safety net for anything that slips through.
async function imageProblem(src) {
  const w0 = src.naturalWidth || src.width, h0 = src.naturalHeight || src.height;
  if (!w0 || !h0) return "";
  const N = 96, c = document.createElement("canvas"); c.width = N; c.height = N;
  const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(src, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N).data; let skin = 0, paper = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], gg = d[i + 1], b = d[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
    if (sat < 0.18) paper++;
    if (r > 95 && gg > 40 && b > 20 && mx - mn > 15 && Math.abs(r - gg) > 15 && r > gg && r > b && sat > 0.2 && sat < 0.7) skin++;
  }
  const sk = skin / (N * N), pa = paper / (N * N);
  let face = false;
  if ("FaceDetector" in window) { try { const f = await new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 }).detect(src); face = f.some(x => x.boundingBox.width * x.boundingBox.height > 0.02 * w0 * h0); } catch (_) {} }
  if (face || sk > 0.18 || (sk > 0.1 && pa < 0.6)) return "📵 This looks like a personal photo. Only academic images are allowed here: notes, textbook pages, diagrams, questions and quiz screenshots.";
  return "";
}
// Photo -> small JPEG data URL (square crop for DP). Nothing is uploaded until the student posts it.
// createImageBitmap fails on some phone photos; fall back to a plain <img> element.
async function decodeImage(file) {
  try { return await createImageBitmap(file); } catch (_) {}
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url;
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("That photo could not be opened. Try another photo, or take a screenshot of it and use that.")); });
    return img;
  } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
}
async function imgToJpeg(file, max, q, square) {
  if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Choose a JPG, PNG or WebP photo.");
  if (file.size > 20 * 1024 * 1024) throw new Error("That photo is too large (max 20 MB).");
  const bmp = await decodeImage(file);
  let sx = 0, sy = 0, sw = bmp.width || bmp.naturalWidth, sh = bmp.height || bmp.naturalHeight;
  if (square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
  const k = Math.min(1, max / Math.max(sw, sh)), cw = Math.max(1, Math.round(sw * k)), ch = Math.max(1, Math.round(sh * k));
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, cw, ch); g.drawImage(bmp, sx, sy, sw, sh, 0, 0, cw, ch);
  if (bmp.close) bmp.close();
  return c.toDataURL("image/jpeg", q);
}
const emailDomainOk = (e) => !(TENANT && TENANT.requireVerified) || !COLLEGE_DOMAINS.length || COLLEGE_DOMAINS.includes(String(e || "").split("@")[1] ? String(e).split("@")[1].toLowerCase() : "");
const myAccount = () => (store && store.account ? store.account() : { email: "", verified: false });
const myVerified = () => { const a = myAccount(); return a.verified && emailDomainOk(a.email); };
async function loadPlan() {
  try {
    const uid = store && store.authUid ? store.authUid() : "";
    const d = uid && store.getTop ? await store.getTop("entitlements", uid) : null;
    const until = d && Number(d.until) || 0;
    state.plan = { plus: until > Date.now(), until };
    // College bundle: if the college has paid for everyone, its students get Plus too (no star: the star is for personal plans).
    if (!state.plan.plus && !NO_COLLEGE && store && store.getTop) {
      const c = await store.getTop("collegePlus", SEL).catch(() => null), cu = c && Number(c.until) || 0;
      if (cu > Date.now()) state.plan = { plus: true, until: cu, college: true };
    }
  } catch (_) { state.plan = { plus: false, until: 0 }; }
}
const isPlusId = (id) => { if (store && allMyIds().has(id)) return !!state.plan.plus; const p = state.profiles.find(x => x.id === id); return !!(p && p.plus); };
const curioBadge = (id) => { const p = state.profiles.find(x => x.id === id), n = store && allMyIds().has(id) ? curioPoints() : (p && p.curio) || 0; return n >= 100 ? " \u{1F52D}" : n >= 20 ? " \u{1F50E}" : ""; };
const markOf = (id) => (isVerifiedId(id) ? " ✔" : "") + (isPlusId(id) ? " ⭐" : "") + curioBadge(id);
const isVerifiedId = (id) => { if (store && allMyIds().has(id)) return myVerified(); const p = state.profiles.find(x => x.id === id); return !!(p && p.verified); };
async function syncProfile() {
  if (!store) return;
  const dp = getDp();
  const status = getStatus();
  const verified = myVerified(), plus = !!state.plan.plus && !state.plan.college;
  const cp = Math.min(100000, curioPoints());
  if (!dp && !status && !verified && !plus && !cp && !state.profiles.some(p => p.id === store.uid)) return;
  const rec = { name: (getName() || "Student").slice(0, 40), dp, status, verified, plus, streak: Math.min(3650, state.myStreak || 0), updatedAt: Date.now() };
  if (cp > 0) rec.curio = cp;
  { const c = readJSON("dd-clid", ""); if (typeof c === "string" && CLID_OK.test(c)) rec.cid = c; const hh = readJSON("dd-handle", null); if (hh && HANDLE_OK.test(hh.name || "")) rec.handle = hh.name; }
  await store.set("profiles", store.uid, rec);
}
function pickDp() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
  inp.addEventListener("change", async () => {
    if (!inp.files || !inp.files[0]) return;
    try {
      const url = await imgToJpeg(inp.files[0], 96, 0.8, true);
      if (!DP_OK.test(url)) throw new Error("Could not use that photo. Try another one.");
      try { localStorage.setItem("dd-dp", url); } catch (_) { throw new Error("This browser would not save the photo. Turn off private mode and try again."); }
    } catch (e) { state.dpMsg = "⚠️ " + ((e && e.message) || "Could not read that photo. Try a JPG or PNG."); render(); return; }
    state.dpMsg = "✅ Photo saved on this phone. Sharing with classmates…"; render();
    try { await syncProfile(); state.dpMsg = "✅ Profile photo updated. Classmates can see it."; }
    catch (e) { state.dpMsg = "📱 Photo saved on this phone, but sharing failed: " + errText(e) + " (the board's security rules may need updating)."; }
    render();
  });
  inp.click();
}
async function removeDp() { try { localStorage.removeItem("dd-dp"); } catch (_) {} state.dpMsg = ""; render(); try { await syncProfile(); } catch (_) {} }

const seenSet = () => { try { return new Set(JSON.parse(localStorage.getItem("dd-seen") || "[]")); } catch (_) { return new Set(); } };
const markSeen = (id) => { const s = seenSet(); s.add(id); try { localStorage.setItem("dd-seen", JSON.stringify([...s].slice(-300))); } catch (_) {} };
const activeStories = () => { const cut = Date.now() - STORY_MS; return state.stories.filter(s => !s.deleted && s.createdAt > cut && !isHidden(s) && (s.kind === "photo" ? !!s.pageId : !!s.text && (s.kind !== "quiz" || (Array.isArray(s.opts) && s.opts.length >= 2)))).sort((a, b) => a.createdAt - b.createdAt); };
function storyGroups() {
  const m = new Map();
  for (const s of activeStories()) { if (!m.has(s.authorId)) m.set(s.authorId, { authorId: s.authorId, name: s.authorName || "Student", items: [] }); const g = m.get(s.authorId); g.items.push(s); g.name = s.authorName || g.name; }
  const seen = seenSet(), arr = [...m.values()], mineIds = allMyIds();
  for (const g of arr) { g.latest = g.items[g.items.length - 1].createdAt; g.unseen = g.items.some(s => !seen.has(s.id)); g.own = mineIds.has(g.authorId); }
  return arr.sort((a, b) => (b.own - a.own) || (b.unseen - a.unseen) || (b.latest - a.latest));
}
// Flash sale banner: one admin-controlled document (sales/current) shown above the board with a live countdown.
let SALE = null, saleTimer = 0;
function renderSale() {
  const bar = $("saleBar"); if (!bar) return;
  clearInterval(saleTimer);
  const s = SALE, gone = readJSON("dd-sale-gone", "");
  if (!s || !s.active || s.until <= Date.now() || gone === String(s.updatedAt)) { bar.hidden = true; bar.replaceChildren(); return; }
  const left = el("strong", { class: "sale-left" }, ""), tick = () => { const ms = s.until - Date.now(); if (ms <= 0) { clearInterval(saleTimer); renderSale(); return; } const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), sec = Math.floor(ms % 6e4 / 1e3); left.textContent = (d ? d + "d " : "") + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0"); };
  tick(); saleTimer = setInterval(tick, 1000);
  bar.replaceChildren(el("span", { class: "sale-tag" }, "🔥 SALE"), el("div", { class: "sale-body" }, el("strong", {}, s.title), s.text ? el("span", {}, " " + s.text) : null, s.code ? el("span", { class: "sale-code" }, " Code " + s.code) : null, el("span", { class: "sale-time" }, " Ends in ", left)),
    el("button", { class: "btn sm", type: "button", onclick: () => { if (s.code) { try { localStorage.setItem("dd-sale-code", s.code); } catch (_) {} } loadPlan().then(() => { if (state.mode === "plus") render(); }); showPanel("plus"); } }, "See Plus"),
    el("button", { class: "of-x", type: "button", "aria-label": "Dismiss sale", onclick: () => { writeJSON("dd-sale-gone", String(s.updatedAt)); renderSale(); } }, "✕"));
  bar.hidden = false;
}
async function loadSale() { try { const d = store && store.getTop ? await store.getTop("sales", "current") : null; SALE = d && typeof d.title === "string" ? d : null; } catch (_) { SALE = null; } renderSale(); }
// Official notices from the college admin: shown as a pinned banner above the board until dismissed or expired.
function noticeAgo(t) { const m = Math.max(0, Math.round((Date.now() - (t || 0)) / 6e4)); return m < 60 ? Math.max(1, m) + " min ago" : m < 1440 ? Math.floor(m / 60) + " h ago" : Math.floor(m / 1440) + " d ago"; }
function liveNotices() {
  const gone = new Set(readJSON("dd-notice-gone", [])), now = Date.now();
  return state.notices.filter(n => !gone.has(n.id) && (!n.expiresAt || n.expiresAt > now)).sort((a, b) => (b.pinned === true) - (a.pinned === true) || (b.createdAt || 0) - (a.createdAt || 0));
}
function renderOfficial() {
  const bar = $("officialBar"); if (!bar) return;
  const live = liveNotices();
  if (!live.length) { bar.hidden = true; bar.replaceChildren(); return; }
  const n = live[0], by = (n.from || "").trim();
  bar.replaceChildren(el("span", { class: "of-tag" }, "✔ Official"),
    el("button", { class: "of-body of-open", type: "button", "aria-label": "Open official notices", onclick: () => showPanel("notices") }, el("strong", {}, (n.pinned ? "📌 " : "") + n.title), el("small", {}, (by ? by + " · " : "") + noticeAgo(n.createdAt))),
    live.length > 1 ? el("span", { class: "of-more" }, "+" + (live.length - 1)) : null,
    el("button", { class: "of-x", type: "button", "aria-label": "Dismiss notice", onclick: () => { writeJSON("dd-notice-gone", [...(readJSON("dd-notice-gone", [])), n.id].slice(-100)); renderOfficial(); } }, "✕"));
  bar.hidden = false;
}
// Full list of official notices (opened by tapping the banner).
function renderNotices() {
  const all = state.notices.filter(n => !n.expiresAt || n.expiresAt > Date.now()).sort((a, b) => (b.pinned === true) - (a.pinned === true) || (b.createdAt || 0) - (a.createdAt || 0));
  const back = el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Back");
  return [el("h2", {}, "✔ Official notices"), el("p", { class: "hint" }, "Posted by the college admin for " + COLLEGE + ". Only admins can post here."),
    ...(all.length ? all.map(n => el("div", { class: "learn-card plus-list notice-card" }, el("strong", {}, (n.pinned ? "📌 " : "") + n.title), el("p", { class: "hint" }, ((n.from || "").trim() ? "✔ " + n.from.trim() + " · " : "✔ College admin · ") + noticeAgo(n.createdAt)), n.body ? el("p", {}, n.body) : null,
      /^https:\/\//.test(n.link || "") ? el("div", { class: "rowbtns" }, el("button", { class: "btn sm primary", type: "button", onclick: () => { try { window.open(n.link, "_blank", "noopener"); } catch (_) {} } }, "Open link")) : null)) : [el("p", { class: "hint" }, "No notices right now.")]),
    el("div", { class: "rowbtns" }, back)];
}
function renderStoryBar() {
  const bar = $("storyBar"); if (!bar) return;
  if (!store) { bar.hidden = true; return; }
  const groups = storyGroups(), own = groups.find(g => g.own);
  // The row is shown only when at least 3 different students have an active story, so it never looks empty or like a test. Everyone can still add a story from the Today card and Explore.
  if (groups.length < STORY_ROW_MIN) { bar.hidden = true; bar.replaceChildren(); todayKey = ""; try { renderToday(); } catch (_) {} return; }
  const bub = (g) => el("button", { type: "button", class: "st-bub", "aria-label": g.own ? "Your story" : g.name + "'s story", onclick: () => openStories(g.authorId) },
    el("span", { class: "st-ring" + (g.unseen ? " new" : " seen") }, avatarEl(dpOfId(g.authorId, g.name), "av st-av" + frameOf(g.authorId))),
    el("span", { class: "st-name" }, g.own ? "Your story" : g.name));
  const me = own ? bub(own) : el("button", { type: "button", class: "st-bub", "aria-label": "Add to your story", onclick: openStoryAdd },
    el("span", { class: "st-ring add" }, avatarEl(getAvatar(), "av st-av")), el("span", { class: "st-name" }, "Your story"));
  if (own) me.append(el("span", { class: "st-plus", role: "button", "aria-label": "Add another story", onclick: (e) => { e.stopPropagation(); openStoryAdd(); } }, "+"));
  else me.append(el("span", { class: "st-plus" }, "+"));
  bar.replaceChildren(me, ...groups.filter(g => !g.own).map(bub));
  bar.hidden = false;
}
const STORY_CARDS = new Set(["idea", "innovation", "share"]);
const STORY_TAG = { idea: "💡 BEST IDEA", innovation: "INNOVATION" };
const REF_TAG = { doubts: "❓ DOUBT", ideas: "💡 IDEA", clubs: "🏛 CLUB", gate: "🎯 GATE", challenges: "🎮 CHALLENGE", jobs: "💼 OPENING" };
// One-tap sharing of a post or today's quiz to your own story (study content only, same checks as the add screen).
async function shareToStory(fields) {
  if (!store) return false;
  const pb = postingBlocked(); if (pb) { alert(pb); return false; }
  if (!getName()) { showPanel("name"); showNotice("Set your name first, then share to your story."); return false; }
  if (state.stories.filter(x => allMyIds().has(x.authorId) && Date.now() - x.createdAt < STORY_MS).length >= STORY_DAILY_MAX) { alert("You can add up to " + STORY_DAILY_MAX + " stories a day."); return false; }
  if (hasBadWords([fields.text, fields.caption || "", fields.expl || "", ...(fields.opts || [])].join(" "))) { alert(LANGUAGE_MSG); return false; }
  const id = store.newId("stories"), doc = { authorId: store.uid, authorName: getName().slice(0, 40), bg: "4", ...fields, createdAt: Date.now() };
  for (const k of Object.keys(doc)) if (doc[k] === undefined) delete doc[k];
  state.stories = [...state.stories, { id, ...doc }];
  try { await store.set("stories", id, doc); } catch (e) { state.stories = state.stories.filter(x => x.id !== id); alert(errText(e)); return false; }
  renderStoryBar(); return true;
}
function openStoryAdd() {
  if (!store) return;
  { const pb = postingBlocked(); if (pb) { alert(pb); return; } }
  if (!getName()) { showPanel("name"); showNotice("Set your name first, then add your story."); return; }
  if (state.stories.filter(s => allMyIds().has(s.authorId) && Date.now() - s.createdAt < STORY_MS).length >= STORY_DAILY_MAX) { showNotice("You can add up to " + STORY_DAILY_MAX + " stories a day."); return; }
  let kind = "text", img = "", bg = 0;
  const ov = el("div", { class: "st-view st-add", role: "dialog", "aria-modal": "true", "aria-label": "Add to your story" });
  const close = () => { ov.remove(); document.body.classList.remove("st-open"); };
  const err = el("p", { class: "hint st-err" }), prev = el("div", { class: "st-prev" });
  const cap = el("input", { type: "text", maxlength: "140", placeholder: "Add a caption (optional)", "aria-label": "Caption" });
  const txt = el("textarea", { maxlength: "200", rows: "4", placeholder: "Type a study tip, a formula or a quiz question…", "aria-label": "Story text" });
  const qopts = [0, 1, 2, 3].map(i => el("input", { type: "text", maxlength: "60", placeholder: "Option " + "ABCD"[i] + (i < 2 ? "" : " (optional)"), "aria-label": "Option " + "ABCD"[i] }));
  const qans = el("select", { "aria-label": "Correct option" }, "ABCD".split("").map((l, i) => el("option", { value: String(i) }, "Correct answer: " + l)));
  const det = el("textarea", { maxlength: "300", rows: "3", "aria-label": "Details" });
  const qexpl = el("input", { type: "text", maxlength: "200", placeholder: "Why is it correct? (optional, shown after answering)", "aria-label": "Explanation" });
  const quizBox = el("div", { class: "st-quiz-form" }, ...qopts.map((inp, i) => el("label", { class: "st-optrow o" + i }, el("b", {}, "ABCD"[i]), inp)), el("label", { class: "st-ansrow" }, el("span", {}, "✅"), qans), qexpl);
  const file = el("input", { type: "file", accept: "image/*", "aria-label": "Choose a photo" });
  file.addEventListener("change", async () => {
    err.textContent = ""; img = "";
    try {
      if (!file.files[0]) return;
      { const bmp = await decodeImage(file.files[0]); const why = await imageProblem(bmp); if (bmp.close) bmp.close(); if (why) throw new Error(why); }
      let u = await imgToJpeg(file.files[0], 720, 0.65, false); if (u.length > 280000) u = await imgToJpeg(file.files[0], 600, 0.5, false);
      if (!IMG_OK.test(u) || u.length > 280000) throw new Error("That photo is too big. Try a smaller one.");
      img = u; draw();
    } catch (e) { err.textContent = (e && e.message) || "Could not read that photo."; }
  });
  const post = el("button", { type: "button", class: "btn primary", onclick: async () => {
    err.textContent = "";
    if (kind === "photo" && !img) { err.textContent = "Choose a photo first."; return; }
    const t = txt.value.trim(); if ((kind === "idea" || kind === "innovation") && !t) { err.textContent = "Write your " + (kind === "idea" ? "idea" : "innovation") + " in one line first."; return; }
    if ((kind === "text" || kind === "quiz") && !t) { err.textContent = kind === "quiz" ? "Type your quiz question first." : "Type something first."; return; }
    let qo = [], qa = 0;
    if (kind === "quiz") {
      const filled = qopts.map((o, i) => ({ v: o.value.trim().slice(0, 60), i })).filter(x => x.v);
      if (filled.length < 2) { err.textContent = "Add at least two answer options."; return; }
      const pos = filled.findIndex(x => x.i === Number(qans.value));
      if (pos < 0) { err.textContent = "The correct answer must be one of the options you filled in."; return; }
      qo = filled.map(x => x.v); qa = pos;
    }
    if (hasBadWords([t, cap.value, det.value, qexpl.value, ...qo].join(" "))) { err.textContent = LANGUAGE_MSG; return; }
    post.disabled = true; post.textContent = "Posting…";
    try {
      const id = store.newId("stories"), now = Date.now(), doc = { authorId: store.uid, authorName: getName().slice(0, 40), kind, createdAt: now };
      if (kind === "photo") { const pid = store.newId("pages"); await store.set("pages", pid, { data: img, parentId: id, createdAt: now }); doc.pageId = pid; storyImgCache.set(pid, img); const c = cap.value.trim(); if (c) doc.caption = c.slice(0, 140); }
      else { doc.text = t.slice(0, 200); doc.bg = String(bg); if (kind === "idea" || kind === "innovation") { const dt = det.value.trim(); if (dt) doc.caption = dt.slice(0, 300); }
        if (kind === "quiz") { doc.opts = qo; doc.ans = qa; const ex = qexpl.value.trim(); if (ex) doc.expl = ex.slice(0, 200); } }
      state.stories = [...state.stories, { id, ...doc }];
      await store.set("stories", id, doc);
      close(); renderStoryBar(); showNotice("Story posted for 24 hours ✅"); setTimeout(() => showNotice(""), 2500);
    } catch (e) { post.disabled = false; post.textContent = "Post story"; err.textContent = errText(e); }
  } }, "Post story");
  const draw = () => {
    prev.replaceChildren(kind === "photo"
      ? (img ? el("img", { class: "st-previmg", src: img, alt: "Preview" }) : el("div", { class: "st-ph" }, "📄 Choose a photo of your notes, a diagram or a question. Personal photos are not allowed."))
      : el("div", { class: "st-textcard st-small" }, txt));
    txt.placeholder = ({ quiz: "Type your quiz question…", idea: "Your best idea in one line…", innovation: "Name your innovation or project…" })[kind] || "Type a study tip, a formula or a quick note…";
    det.placeholder = kind === "idea" ? "Why is it good? Who does it help? (optional)" : "What problem does it solve? How does it work? (optional)";
    if (kind !== "photo") { const g = STORY_BG[bg]; prev.firstChild.style.setProperty("background", "linear-gradient(135deg," + g[0] + "," + g[1] + ")"); }
    tabs.replaceChildren(...[["text", "✍️ Tip / note"], ["quiz", "🧠 Quiz"], ["idea", "💡 Best idea"], ["innovation", "Innovation"], ["photo", "📄 Notes photo"]].map(([k, l]) => el("button", { type: "button", class: "btn sm" + (kind === k ? " primary" : ""), onclick: () => { kind = k; draw(); } }, l)));
    sw.hidden = kind === "photo"; file.hidden = kind !== "photo"; cap.hidden = kind !== "photo"; quizBox.hidden = kind !== "quiz"; det.hidden = !(kind === "idea" || kind === "innovation");
  };
  const tabs = el("div", { class: "rowbtns" });
  const sw = el("div", { class: "st-sw" }, STORY_BG.map((g, i) => { const b = el("button", { type: "button", class: "st-swb", "aria-label": "Colour " + (i + 1), onclick: () => { bg = i; draw(); } }); b.style.setProperty("background", "linear-gradient(135deg," + g[0] + "," + g[1] + ")"); return b; }));
  ov.append(el("div", { class: "st-card" }, el("div", { class: "st-head" }, el("strong", {}, "Add to your story"), el("button", { type: "button", class: "st-x", "aria-label": "Close", onclick: close }, "✕")),
    el("p", { class: "hint" }, "Stories are for study content only: tips, quizzes, best ideas, innovations, and photos of notes, diagrams or questions. Personal photos are not allowed. Everyone on " + BRAND + " can see it for 24 hours. Reported stories are hidden. Viewers see their own name faintly over your story, so screenshots can be traced."),
    tabs, prev, quizBox, det, sw, file, cap, err, post));
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
      : [el("button", { type: "button", class: "st-x", "aria-label": "Report story", onclick: async () => { if (!confirm("Report this story as inappropriate?")) return; try { const reports = [...new Set([...(s.reports || []), store.uid])].slice(0, 100); s.reports = reports; await store.update("stories", s.id, { reports }); showNotice("Reported. Thank you."); setTimeout(() => showNotice(""), 2500); } catch (e) { showNotice(errText(e)); } next(); } }, "🚩"), el("button", { type: "button", class: "st-x", "aria-label": "Report this person\u2019s photo or status", title: "Report photo or status", onclick: () => openProfileReport(g.authorId, g.name) }, "\u{1F464}")];
    // Deterrent only (a website cannot block screenshots): the viewer's own name is tiled faintly over others' stories.
    const wmName = (getName() || BRAND).slice(0, 20);
    const wm = ownS ? null : el("div", { class: "st-wm", "aria-hidden": "true" }, Array.from({ length: 24 }, () => el("span", {}, wmName)));
    ov.oncontextmenu = (ev) => { ev.preventDefault(); };
    ov.replaceChildren(
      el("div", { class: "st-bars" }, segs),
      el("div", { class: "st-top" }, avatarEl(dpOfId(g.authorId, g.name), "av st-av sm" + frameOf(g.authorId)), el("div", { class: "st-who" }, el("strong", {}, (ownS ? "Your story" : g.name) + markOf(g.authorId)), el("small", {}, ago(s.createdAt) + (statusOfId(g.authorId) ? " · " + statusOfId(g.authorId) : ""))), ...actions, el("button", { type: "button", class: "st-x", "aria-label": "Close", onclick: close }, "✕")),
      body, wm, ownS ? null : el("p", { class: "st-note" }, "📸 Screenshots can be traced to your name. Please don't share others' stories."), vlist,
      el("button", { type: "button", class: "st-tap l", "aria-label": "Previous", onclick: prev }), el("button", { type: "button", class: "st-tap r", "aria-label": "Next", onclick: next }));
    const run = (ms) => { if (my !== gen) return; fill.style.setProperty("animation-duration", ms + "ms"); fill.classList.add("run"); timer = setTimeout(next, ms); };
    if (s.kind === "quiz") {
      const c = STORY_BG[Number(s.bg)] || STORY_BG[4], card = el("div", { class: "st-textcard st-quizcard" });
      card.style.setProperty("background", "linear-gradient(135deg," + c[0] + "," + c[1] + ")");
      const opts = (s.opts || []).slice(0, 4), meKey = s.id + "_" + store.uid;
      const earlier = ownS ? null : state.storyAnswers.find(a => a.id === meKey);
      let answered = false;
      const note = el("p", { class: "st-qnote" }), extra = el("div", { class: "st-extra" });
      const btns = opts.map((o, i) => el("button", { type: "button", class: "st-opt o" + i, onclick: () => answer(i) }, el("span", { class: "st-chip" }, "ABCD"[i]), el("span", { class: "st-otext" }, o)));
      const reveal = (pick) => {
        const rows = state.storyAnswers.filter(a => a.storyId === s.id && a.uid !== s.authorId), total = rows.length, right = rows.filter(a => a.ok).length;
        btns.forEach((b, k) => {
          b.disabled = true; if (k === s.ans) b.classList.add("good"); else if (k === pick) b.classList.add("bad");
          if (ownS) b.append(el("span", { class: "st-count" }, rows.filter(a => a.pick === k).length));
        });
        const bits = [];
        if (s.expl) bits.push(el("p", { class: "st-expl" }, "💡 " + s.expl));
        if (total) bits.push(el("p", { class: "st-qnote" }, "📊 " + Math.round(right * 100 / total) + "% of " + total + (total === 1 ? " student" : " students") + " got this right"));
        else if (ownS) bits.push(el("p", { class: "st-qnote" }, "No answers yet. Viewers can tap an option; you will see the counts here."));
        if (!ownS) bits.push(el("button", { type: "button", class: "st-opt st-save", onclick: (e) => {
          const added = window.SparkLab && window.SparkLab.addCard ? window.SparkLab.addCard("From quiz stories", s.text + "\n" + opts.map((o, k) => "ABCD"[k] + ". " + o).join("\n"), "Answer: " + "ABCD"[s.ans] + ". " + opts[s.ans] + (s.expl ? "\n" + s.expl : "")) : null;
          e.currentTarget.disabled = true; e.currentTarget.textContent = added === false ? "📇 Already in your flashcards" : "📇 Saved! Find it in Study Lab › Flashcards";
        } }, "📇 Save to my flashcards"));
        extra.replaceChildren(...bits);
      };
      const answer = (i) => {
        if (ownS || answered) return; answered = true;
        const ok = i === s.ans, doc = { storyId: s.id, uid: store.uid, name: (getName() || "Student").slice(0, 40), to: s.authorId, campus: (getCampus() || "").slice(0, 30), pick: i, ok, createdAt: Date.now() };
        state.storyAnswers = [...state.storyAnswers, { id: meKey, ...doc }];
        store.set("storyAnswers", meKey, doc).catch(() => {});
        battleRecord(ok);
        note.textContent = ok ? "✅ Correct! Counts toward this week's quiz stars." : "❌ Not quite. The right answer is highlighted.";
        reveal(i); clearTimeout(timer); fill.classList.remove("run"); void fill.offsetWidth; run(14000);
      };
      card.append(el("p", { class: "st-q" }, s.text), ...btns, note, extra, el("button", { type: "button", class: "st-opt st-skip", onclick: next }, "Next ➜"));
      body.append(card);
      if (ownS) { note.textContent = "Your quiz. Viewers can answer it."; reveal(-1); run(20000); }
      else if (earlier) { answered = true; note.textContent = earlier.ok ? "✅ You answered this correctly." : "❌ You answered this already."; reveal(earlier.pick); run(8000); }
      else { note.textContent = "Tap your answer"; run(30000); }
    } else if (STORY_CARDS.has(s.kind)) {
      const c = STORY_BG[Number(s.bg)] || STORY_BG[4], card = el("div", { class: "st-textcard st-sharecard" });
      card.style.setProperty("background", "linear-gradient(135deg," + c[0] + "," + c[1] + ")");
      const ref = String(s.ref || "").split("/"), refColl = ref[0], refId = ref[1];
      const tag = s.kind === "share" ? (REF_TAG[refColl] || "📖 SHARED POST") : STORY_TAG[s.kind];
      const target = s.kind === "share" && REF_TAG[refColl] && (state[refColl] || []).find(x => x.id === refId && !x.deleted && !isHidden(x));
      card.append(el("span", { class: "st-tagbadge" }, tag), el("p", { class: "st-q" }, s.text), s.caption ? el("p", { class: "st-detail" }, s.caption) : null,
        target ? el("button", { type: "button", class: "st-opt st-open", onclick: () => { close(); openPost(refColl, refId); } }, "Open the full post ↗") : null);
      body.append(card); run(10000);
    } else if (s.kind === "text") {
      const c = STORY_BG[Number(s.bg)] || STORY_BG[0], card = el("div", { class: "st-textcard" }, s.text); card.style.setProperty("background", "linear-gradient(135deg," + c[0] + "," + c[1] + ")"); body.append(card); run(STORY_SHOW + 1500);
    } else {
      body.append(el("p", { class: "st-load" }, "Loading…"));
      storyImage(s.pageId).then(u => { if (my !== gen) return; body.replaceChildren(el("img", { class: "st-img", src: u, alt: "Story photo", draggable: "false" }), s.caption ? el("p", { class: "st-cap" }, s.caption) : null); run(STORY_SHOW); })
        .catch(() => { if (my !== gen) return; body.replaceChildren(el("p", { class: "st-load" }, "Could not load this photo.")); run(2500); });
    }
  }
  show();
}

// Privacy: blur the app while it is in the background so the recent-apps preview does not show posts or stories.
document.addEventListener("visibilitychange", () => { document.body.classList.toggle("priv-blur", document.visibilityState === "hidden"); });
window.addEventListener("pagehide", () => { document.body.classList.add("priv-blur"); });
window.addEventListener("pageshow", () => { if (document.visibilityState === "visible") document.body.classList.remove("priv-blur"); });
// Focus mode: hides everything that is not academic (Ideas, Clubs, Challenges, Market, Jobs, stories, Entertainment).
const focusOn = () => { try { return localStorage.getItem("dd-focus") === "1"; } catch (_) { return false; } };
function applyFocus() {
  const on = focusOn(); document.body.classList.toggle("focus", on);
  const b = $("focusBtn"); if (b) { b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); b.querySelector(".cl").textContent = on ? "Focus mode is ON · tap to turn off" : "Focus mode · academics only"; }
}
function toggleFocus() {
  try { localStorage.setItem("dd-focus", focusOn() ? "0" : "1"); } catch (_) {}
  applyFocus();
  if (focusOn() && !isAcademicTab(state.tab)) { goTab("doubts"); try { history.replaceState(null, "", "#doubts"); } catch (_) {} return; }
  render();
}
function render() {
  try {
    document.body.dataset.tab = state.tab; applyFocus();
    renderHeader(); renderTrendBar(); renderStoryBar(); renderRail(); try { renderGuide(); } catch (_) {} renderList(); renderBottomNav(); try { if (IS_RGUKT && !readJSON("dd-rgukt-year", null) && !document.querySelector(".welcome")) showEligibility(); } catch (_) {} try { document.body.classList.toggle("simple", isSimple()); renderBell(); notifPing(); claimStudentIdOnce(); } catch (_) {}
    // Forms keep what the student is typing while live updates arrive.
    const key = ["ask", "edit", "name", "alumniJoin", "alumniJob", "fun", "lab", "college", "plus"].includes(state.mode) ? state.mode + state.tab : "";
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
      state.mode === "curriculum" ? renderCurriculum() :
      state.mode === "learn" ? renderLearn() :
      state.mode === "resources" ? renderResources() :
      state.mode === "career" ? renderCareer() :
      state.mode === "battle" ? renderBattle() :
      state.mode === "plus" ? renderPlus() :
      state.mode === "mock" ? renderMock() :
      state.mode === "mistakes" ? renderMistakes() :
      state.mode === "planner" ? renderPlanner() :
      state.mode === "papers" ? renderPapers() :
      state.mode === "notices" ? renderNotices() :
      state.mode === "explore" ? renderExplore() :
      state.mode === "stickers" ? renderStickers() :
      state.mode === "wardrobe" ? renderWardrobe() :
      state.mode === "drives" ? renderDrives() :
      state.mode === "events" ? renderEvents() :
      state.mode === "forgotid" ? renderForgotId() :
      state.mode === "curious" ? renderCurious() :
      state.mode === "feedback" ? renderFeedback() :
      state.mode === "notifs" ? renderNotifs() :
      state.mode === "loopysearch" ? renderLoopySearch() :
      state.mode === "ai" ? renderAI() :
      state.mode === "goals" ? renderGoals() :
      state.mode === "wboard" ? renderWeeklyBoard() :
      state.mode === "resume" ? renderResume() :
      state.mode === "focusplus" ? renderFocusPlus() :
      state.mode === "college" ? renderCollege() :
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
    try { const gd = modeGuide(state.mode === "edit" ? "ask" : state.mode); if (gd) sheet.prepend(gd); } catch (_) {}
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
const showPanel = (mode) => { state.mode = mode; render(); { const sh = $("sheet"); if (sh) { sh.classList.remove("enter"); void sh.offsetWidth; sh.classList.add("enter"); } } if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" }); };
$("leadersBtn").addEventListener("click", () => showPanel("leaders"));
$("networkBtn") && $("networkBtn").addEventListener("click", () => showPanel("network"));
$("quizBtn").addEventListener("click", () => showPanel("quiz"));
$("learnBtn").addEventListener("click", () => showPanel("learn"));
$("studyBtn").addEventListener("click", () => showPanel("resources"));
$("focusBtn") && $("focusBtn").addEventListener("click", toggleFocus);
// Phones: the tool tiles fold away behind one button so the board is visible right away.
(() => {
  const acts = document.querySelector(".hdr-actions"); if (!acts) return;
  let open = false; try { open = localStorage.getItem("dd-tools-open") === "1"; } catch (_) {}
  const b = el("button", { type: "button", class: "chip tools-toggle", "aria-expanded": String(open) }, "");
  const paint = () => { acts.classList.toggle("tools-closed", !open); b.setAttribute("aria-expanded", String(open)); b.textContent = open ? "🧰 Fewer tools ▴" : "🧰 More tools ▾"; };
  b.addEventListener("click", () => { open = !open; try { localStorage.setItem("dd-tools-open", open ? "1" : "0"); } catch (_) {} paint(); });
  acts.prepend(b); paint();
})();
// A tiny tap vibration on buttons gives the app a native feel (phones that support it).
document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest(".btn, .tabs button, .bnav-btn, .today-chip, .plus-tile"); if (b) { try { navigator.vibrate && navigator.vibrate(6); } catch (_) {} } }, { passive: true });
// Pull to refresh: drag down from the top of the page. Refreshes plan, sale, notes and checks for a new app version.
(() => {
  setTimeout(() => { state.loadTimeout = true; try { render(); } catch (_) {} }, 7000);
  const ind = el("div", { class: "ptr", "aria-hidden": "true", hidden: true }, el("span", { class: "ptr-ico" }, "↓"), el("span", { class: "ptr-txt" }, "Pull to refresh"));
  document.body.append(ind);
  let y0 = 0, dy = 0, on = false, busy = false;
  const show = (txt, ico, pull) => { ind.hidden = false; ind.querySelector(".ptr-txt").textContent = txt; ind.querySelector(".ptr-ico").textContent = ico; ind.style.setProperty("--pull", Math.min(pull, 90) + "px"); };
  const hide = () => { ind.hidden = true; ind.style.setProperty("--pull", "0px"); };
  async function refresh() {
    if (busy) return; busy = true; show(navigator.onLine === false ? "You are offline" : "Refreshing…", navigator.onLine === false ? "📵" : "⟳", 56); ind.classList.add("spin");
    try {
      if (navigator.onLine !== false) {
        const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null; if (reg) { try { await reg.update(); } catch (_) {} }
        await Promise.all([loadPlan().catch(() => {}), loadSale(), loadWelcomeNote()]);
        todayKey = ""; renderHeader(); render();
      }
    } catch (_) {}
    ind.classList.remove("spin"); show(navigator.onLine === false ? "You are offline" : "Up to date ✓", navigator.onLine === false ? "📵" : "✓", 56); setTimeout(() => { hide(); busy = false; }, 900);
  }
  addEventListener("touchstart", (e) => { if (busy || window.scrollY > 0 || e.touches.length !== 1 || document.querySelector(".welcome, .splash, dialog[open]")) { on = false; return; } y0 = e.touches[0].clientY; dy = 0; on = true; ind.dataset.x = String(e.touches[0].clientX); }, { passive: true });
  addEventListener("touchmove", (e) => { if (!on) return; dy = e.touches[0].clientY - y0; const dx = Math.abs(e.touches[0].clientX - Number(ind.dataset.x || 0)); if (dy < 8 || dx > dy) { if (dy < 0) on = false; return; } show(dy > 70 ? "Release to refresh" : "Pull to refresh", dy > 70 ? "↑" : "↓", dy * 0.6); }, { passive: true });
  addEventListener("touchend", () => { if (!on) return; on = false; if (dy > 70) refresh(); else hide(); }, { passive: true });
})();
try { const gt = document.querySelector('.tabs [data-tab="gate"]'); if (gt) gt.textContent = "🎯 " + EXAM_LABEL; } catch (_) {}
maybeWelcome();
try { showCollegeReveal(); } catch (_) {}
maybeMilestone();
$("filterToggle").addEventListener("click", () => { document.querySelector("header.top").classList.toggle("filters-open"); renderHeader(); });
$("botBtn").addEventListener("click", () => { if (window.sparkBotToggle) window.sparkBotToggle(); else if (window.__lazy) { window.__lazy.now(); document.addEventListener("lazy-ready", () => { if (window.sparkBotToggle) window.sparkBotToggle(); }, { once: true }); } });
$("drivesBtn").addEventListener("click", () => showPanel("drives"));
$("eventsBtn").addEventListener("click", () => showPanel("events"));
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
{
  const h1 = $("siteTitle");
  if (h1) { const m = /^(.*?[a-z])([A-Z][a-z]*)$/.exec(CFG.title.trim()); const w = CFG.title.trim().split(/\s+/); if (w.length > 1) { const last = w.pop(); h1.replaceChildren(w.join(" ") + " ", el("span", {}, last)); } else if (m) h1.replaceChildren(m[1], el("span", {}, m[2])); else h1.textContent = CFG.title; }
  const sc = $("streakChip"); if (sc) sc.addEventListener("click", () => showPanel("me"));
  const cb = $("collegeBtn"); if (cb) { cb.replaceChildren(...(TENANT && TENANT.crest ? [crestEl(22), " "] : ["🏫 "]), (TENANT ? TENANT.name : IS_RGUKT ? "RGUKT AP" : "Choose your college") + " ▾");
  try { if (TENANT && TENANT.crest) localStorage.setItem("dd-crest", TENANT.crest); else localStorage.removeItem("dd-crest"); localStorage.setItem("dd-college-name", COLLEGE || ""); } catch (_) {} cb.addEventListener("click", () => showPanel("college")); }
}

// ---------- start ----------
renderExams();
startCaptions();
const deep = /^#(doubts|ideas|clubs|gate|challenges|jobs|market)(?:\/([\w-]+))?$/.exec(location.hash);
if (deep) state.tab = deep[1];
// Show board immediately, Firebase will fill it in once connected
state.loaded = true;
if (NO_COLLEGE) state.mode = "college";
// First-time campus pick
if (CAMPUSES.length > 0 && !getCampus() && !deep) state.mode = "campus";
render();
(async () => {
  const conf = CFG.firebase || {};
  const configured = conf.apiKey && !String(conf.apiKey).startsWith("PASTE") && conf.projectId;
  try {
    const sbConf = CFG.supabase || {};
    const useSupabase = sbConf.url && sbConf.anonKey && !String(sbConf.url).startsWith("PASTE");
    store = useSupabase ? await supabaseStore(sbConf) : configured ? await firebaseStore(conf, ROOM_PATH) : localStore();
  } catch (e) {
    console.error(e);
    showNotice("Could not connect to the class board. Check your internet and reload. (" + ((e && e.code) || "error") + ")");
    return;
  }
  if (NO_COLLEGE) { render(); return; }   // nothing to load until a college is chosen
  loadPlan().then(() => { render(); claimRef(); redeemPendingGift(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && PLUS.enabled) loadPlan().then(() => { if (state.mode === "plus") render(); }); });
  (async () => { try { const d = store.getTop ? await store.getTop("settings", "posting") : null; state.verifiedPosting = !!(d && d.verifiedPosting === true); } catch (_) {} })();
  loadSale(); setInterval(loadSale, 600000); loadWelcomeNote(); setInterval(loadWelcomeNote, 900000);
  if (store.linkResult === "ok") { showNotice(myVerified() ? "✅ Email verified. Welcome, verified student!" : "Email confirmed, but it is not a " + COLLEGE + " address, so you are not marked as verified."); setTimeout(() => showNotice(""), 6000); }
  else if (store.linkResult && store.linkResult.startsWith("error:")) showNotice("Could not finish email verification (" + store.linkResult.slice(6) + "). Open the link on the same phone you asked from, or ask for a new one.");
  if (store.demo) showNotice("Demo mode: posts are saved only in this browser. Add your Firebase settings to config.js so the whole class shares one board.", "demo");
  const live = (rows) => rows.filter(x => !x.deleted);
  let opened = false;
  const onErr = (e) => {
    const code = (e && e.code) || (e && e.message) || "unknown";
    const ae = (store && store.authError) || "";
    showNotice(code === "permission-denied" && store && store.authed === false
      ? (/configuration-not-found|operation-not-allowed|admin-restricted/.test(ae)
        ? "The class board's sign-in service is not switched on yet. Admin: open Firebase › Authentication, press Get started, and enable the Anonymous sign-in method (" + ae + "). Students: please try again later."
        : "Could not sign in to the class board (slow internet or a blocked browser setting). Check your connection and reload. If it keeps happening, tell the admin this code: " + (ae || "no-reply") + ".")
      : "Database error: " + code + ", reload or check internet.");
  };
  const update = () => {
    if (!opened && deep && deep[2] && state[TABS[state.tab].coll].some(x => x.id === deep[2])) { opened = true; openItem(deep[2]); return; }
    render();
  };
  store.subscribe("doubts", rows => { state.dataReady = true; const live_ = live(rows); trackNew("doubts", live_); state.doubts = live_; update(); }, onErr);
  store.subscribe("ideas", rows => { state.dataReady = true; const live_ = live(rows); trackNew("ideas", live_); state.ideas = live_; update(); }, onErr);
  store.subscribe("replies", rows => { state.replies = live(rows); update(); }, onErr);
  store.subscribe("likes", rows => { state.likes = rows; update(); }, onErr);
  store.subscribe("clubs", rows => { const live_ = live(rows); trackNew("clubs", live_); state.clubs = live_; update(); }, e => {});
  store.subscribe("gate", rows => { const live_ = live(rows); trackNew("gate", live_); state.gate = live_; update(); }, e => {});
  store.subscribe("blocked", rows => { state.blocked = rows.map(r => r.id); }, e => {});
  if (store.subscribeWhere && store.uid) { const keep = { to: [], from: [] }, merge = () => { state.privAns = [...keep.to, ...keep.from.filter(x => !keep.to.some(y => y.id === x.id))]; try { render(); } catch (_) {} }; store.subscribeWhere("privateAnswers", "toUid", store.uid, rows => { keep.to = rows; merge(); }, () => {}); store.subscribeWhere("privateAnswers", "ownerUid", store.uid, rows => { keep.from = rows; merge(); }, () => {}); }
  let dpChecked = false;
  store.subscribe("profiles", rows => {
    state.profiles = rows.filter(p => typeof p.name === "string" && (!p.dp || DP_OK.test(p.dp))).map(p => ({ ...p, status: String(p.status || "").slice(0, 60), verified: p.verified === true, plus: p.plus === true, curio: Number.isInteger(p.curio) && p.curio > 0 ? Math.min(p.curio, 100000) : 0, cid: typeof p.cid === "string" && CLID_OK.test(p.cid) ? p.cid : "", handle: typeof p.handle === "string" && /^[a-z0-9_]{3,15}$/.test(p.handle) ? p.handle : "", streak: Number.isInteger(p.streak) && p.streak > 0 ? p.streak : 0 })); update();
    if (!dpChecked && (getDp() || getStatus() || myVerified() || state.plan.plus)) { dpChecked = true; const me = rows.find(p => p.id === store.uid); if (!me || (me.dp || "") !== getDp() || me.name !== getName() || (me.status || "") !== getStatus() || (me.verified === true) !== myVerified() || (me.plus === true) !== !!state.plan.plus) syncProfile().catch(() => {}); }
  }, e => {});
  const since = Date.now() - STORY_MS;
  store.subscribe("stories", rows => { state.stories = rows.filter(x => !x.deleted); renderStoryBar(); }, e => {}, since);
  store.subscribe("storyViews", rows => { state.storyViews = rows; }, e => {}, since);
  store.subscribe("profileHidden", rows => { state.profileHidden = rows; _dpSrc = null; try { render(); renderStoryBar(); } catch (_) {} }, e => {});
  store.subscribe("storyAnswers", rows => { state.storyAnswers = rows; update(); }, e => {}, Date.now() - 7 * 86400000);
  store.subscribe("drives", rows => { state.drives = rows.filter(d => !d.deleted && typeof d.company === "string"); renderHeader(); if (state.mode === "drives") render(); }, e => {});
  store.subscribe("weekly", rows => { state.weekly = rows.filter(r => r.week === weekKey() && typeof r.points === "number"); if (state.mode === "wboard") render(); }, e => {}, weekStartMs() - 1);
  store.subscribe("events", rows => { state.events = rows.filter(e => !e.deleted && typeof e.title === "string"); renderHeader(); if (state.mode === "events") render(); }, e => {});
  store.subscribe("eventRsvp", rows => { state.rsvps = rows; if (state.mode === "events") render(); }, e => {}, Date.now() - 90 * 864e5);
  store.subscribe("notices", rows => { state.notices = rows.filter(n => !n.deleted && typeof n.title === "string"); renderOfficial(); }, e => {});
  store.subscribe("papers", rows => { state.papers = rows.filter(p => !p.deleted && typeof p.title === "string" && /^https:\/\//.test(p.link || "")); if (state.mode === "papers") render(); }, e => {});
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
