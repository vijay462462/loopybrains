// Doubt Desk: class board for doubts and ideas.
// Data lives in Firebase Firestore when config.js has Firebase settings, otherwise in this browser (demo mode).

const CFG = window.DOUBT_DESK_CONFIG || {};
const SUBJECTS = (CFG.subjects && CFG.subjects.length) ? CFG.subjects : ["Maths", "Physics", "Chemistry", "Other"];
const CATS = (CFG.ideaCategories && CFG.ideaCategories.length) ? CFG.ideaCategories : ["Project", "Other"];
const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#ef4444", "#14b8a6", "#84cc16", "#f97316", "#64748b"];
const FB_VERSION = "10.12.2";

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
};

const state = {
  tab: "doubts", group: "All", query: "", filter: "all",
  doubts: [], ideas: [], replies: [], likes: [], loaded: false,
  selected: null, mode: "intro", // intro | view | ask | edit | name
  afterName: null,
};
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
const mine = (x) => x && store && x.authorId === store.uid;
const who = (x) => mine(x) ? "You" : (x.authorName || "A student");
const repliesFor = (id) => state.replies.filter(r => r.parentId === id).sort((a, b) => a.createdAt - b.createdAt);
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
async function firebaseStore(conf) {
  const base = "https://www.gstatic.com/firebasejs/" + FB_VERSION + "/";
  const [{ initializeApp }, fs, au] = await Promise.all([
    import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-auth.js"),
  ]);
  const app = initializeApp(conf);
  const db = fs.getFirestore(app);
  const auth = au.getAuth(app);
  const cred = await au.signInAnonymously(auth);
  return {
    uid: cred.user.uid, demo: false,
    subscribe: (coll, cb, onErr) => fs.onSnapshot(fs.collection(db, coll), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr),
    newId: (coll) => fs.doc(fs.collection(db, coll)).id,
    set: (coll, id, data) => fs.setDoc(fs.doc(db, coll, id), data),
    update: (coll, id, data) => fs.updateDoc(fs.doc(db, coll, id), data),
    remove: (coll, id) => fs.deleteDoc(fs.doc(db, coll, id)),
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
  };
}

// ---------- rendering ----------
function renderHeader() {
  const t = TABS[state.tab];
  document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));
  $("tagline").textContent = t.tagline;
  $("askBtn").textContent = t.ask;
  $("nameBtn").textContent = getName() ? "You: " + getName() : "Set your name";
  $("search").placeholder = state.tab === "doubts" ? "Search doubts" : "Search ideas";
  $("rail").setAttribute("aria-label", t.groupLabel);
  const opts = state.tab === "doubts"
    ? [["all", "All"], ["open", "Unanswered"], ["done", "Resolved"]]
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
  $("rail").replaceChildren(el("div", { class: "label" }, t.groupLabel),
    ...["All", ...t.groups, ...extra].map(s => el("button", {
      type: "button", ...colorAttrs(s), "aria-pressed": String(state.group === s),
      onclick: () => { state.group = s; render(); },
    }, el("span", {}, s), el("span", { class: "n" }, s === "All" ? rows.length : (counts[s] || 0)))));
}

function visible() {
  const t = TABS[state.tab], q = state.query.trim().toLowerCase();
  let rows = state[t.coll].filter(d =>
    (state.group === "All" || d[t.field] === state.group) &&
    (!q || ((d.title || "") + " " + (d.body || "")).toLowerCase().includes(q)));
  if (state.tab === "doubts" && state.filter !== "all") rows = rows.filter(d => (state.filter === "done") === !!d.resolvedReplyId);
  rows.sort((a, b) => b.createdAt - a.createdAt);
  if (state.tab === "ideas" && state.filter === "top") rows.sort((a, b) => likesFor(b.id).length - likesFor(a.id).length);
  return rows;
}

function openItem(id) {
  state.selected = id; state.mode = "view"; render();
  if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" });
}

function renderList() {
  if (!state.loaded) return;
  const t = TABS[state.tab], rows = visible(), all = state[t.coll];
  if (!rows.length) {
    $("list").replaceChildren(all.length
      ? el("div", { class: "empty" }, el("strong", {}, "Nothing matches"), "Try another " + (state.tab === "doubts" ? "subject" : "category") + " or clear the search.")
      : el("div", { class: "empty" }, el("strong", {}, state.tab === "doubts" ? "No doubts yet" : "No ideas yet"), "Press “" + t.ask + "” to post the first one."));
    return;
  }
  $("list").replaceChildren(...rows.map(d => {
    const n = repliesFor(d.id).length, g = d[t.field];
    const meta = [el("span", { class: "tag", ...colorAttrs(g) }, g)];
    if (state.tab === "doubts") meta.push(el("span", { class: "pill " + (d.resolvedReplyId ? "done" : "open") }, d.resolvedReplyId ? "Resolved" : (n ? "Open" : "Unanswered")));
    else meta.push(el("span", { class: "likes" }, "♥ " + likesFor(d.id).length));
    meta.push(el("span", {}, n + " " + t.replyNoun + (n === 1 ? "" : "s")), el("span", {}, who(d) + " · " + ago(d.createdAt)));
    return el("button", {
      type: "button", class: "item", ...colorAttrs(g),
      "aria-current": String(state.selected === d.id && state.mode === "view"), onclick: () => openItem(d.id),
    }, el("h3", {}, d.title), el("div", { class: "meta" }, meta));
  }));
}

function renderIntro() {
  const t = TABS[state.tab];
  const steps = state.tab === "doubts"
    ? "1. Ask: pick the subject and write the full question with what you tried.\n2. Answer: open any doubt and explain how to solve it.\n3. Resolve: the student who asked marks the answer that helped."
    : "1. Share: post an idea for a project, startup, research or campus.\n2. Like: tap ♥ on ideas you want to see happen.\n3. Build: reply with thoughts, improvements or an offer to join.";
  return [
    el("h2", {}, "How it works"),
    el("p", { class: "body" }, steps),
    el("div", { class: "rowbtns" }, el("button", { class: "btn primary", type: "button", onclick: openAsk }, t.ask)),
  ];
}

function renderName() {
  const err = el("p", { class: "err", hidden: true });
  const form = el("form", { class: "form", onsubmit: (e) => {
    e.preventDefault();
    const v = form.elements.name.value.trim().slice(0, 40);
    if (v.length < 2) { err.textContent = "Enter at least 2 characters."; err.hidden = false; return; }
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
  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const title = form.elements.title.value.trim(), body = form.elements.body.value.trim(), group = form.elements.group.value;
    if (title.length < 3) { err.textContent = "Write a title of at least 3 characters."; err.hidden = false; return; }
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Saving…";
    try {
      if (existing) {
        await store.update(t.coll, existing.id, { title: title.slice(0, 200), body: body.slice(0, 5000), [t.field]: group, authorName: getName() || existing.authorName });
        state.mode = "view"; render(); return;
      }
      const id = store.newId(t.coll);
      const doc = { title: title.slice(0, 200), body: body.slice(0, 5000), [t.field]: group, authorId: store.uid, authorName: getName(), createdAt: Date.now() };
      if (state.tab === "doubts") doc.resolvedReplyId = null;
      // Show the new post straight away; the live update replaces it with the saved copy.
      state[t.coll] = [{ id, ...doc }, ...state[t.coll].filter(x => x.id !== id)];
      state.group = "All"; state.query = ""; $("search").value = "";
      openItem(id);
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
    err,
    el("div", { class: "rowbtns" },
      el("button", { class: "btn primary", type: "submit" }, label),
      el("button", { class: "btn", type: "button", onclick: () => { state.mode = state.selected ? "view" : "intro"; render(); } }, "Cancel")));
  if (existing) { form.elements.title.value = existing.title || ""; form.elements.body.value = existing.body || ""; }
  setTimeout(() => form.elements.title.focus(), 0);
  return [el("h2", {}, existing ? "Edit " + t.noun : t.ask), form];
}

function renderView() {
  const t = TABS[state.tab];
  const d = state[t.coll].find(x => x.id === state.selected);
  if (!d) return [el("p", { class: "hint" }, "This post was deleted or is still loading.")];
  const own = mine(d), reps = repliesFor(d.id), g = d[t.field];
  const out = [
    el("div", { class: "meta" },
      el("span", { class: "tag", ...colorAttrs(g) }, g),
      state.tab === "doubts" && el("span", { class: "pill " + (d.resolvedReplyId ? "done" : "open") }, d.resolvedReplyId ? "Resolved" : "Open"),
      el("span", {}, "By " + who(d) + " · " + ago(d.createdAt))),
    el("h2", {}, d.title),
  ];
  if (d.body) out.push(el("p", { class: "body" }, d.body));
  const actions = [];
  if (state.tab === "ideas") {
    const on = liked(d.id), n = likesFor(d.id).length;
    actions.push(el("button", { class: "like", type: "button", "aria-pressed": String(on), onclick: () => toggleLike(d) }, "♥ " + (on ? "Liked" : "Like") + " · " + n));
  }
  if (own) {
    actions.push(el("button", { class: "linkbtn", type: "button", onclick: () => { state.mode = "edit"; render(); } }, "Edit"));
    actions.push(el("button", { class: "linkbtn danger", type: "button", onclick: (e) => confirmDelete(e.currentTarget, async () => {
      for (const r of reps) { try { await store.remove("replies", r.id); } catch (_) {} }
      await store.remove(t.coll, d.id);
      state.selected = null; state.mode = "intro"; render();
    }) }, "Delete"));
  }
  if (actions.length) out.push(el("div", { class: "rowbtns" }, actions));

  const list = el("div", { class: "answers" }, el("div", { class: "label" }, reps.length ? reps.length + " " + t.replyNoun + (reps.length === 1 ? "" : "s") : "No " + t.replyNoun + "s yet"));
  for (const r of reps) {
    const best = state.tab === "doubts" && d.resolvedReplyId === r.id;
    const tools = [];
    if (own && state.tab === "doubts") tools.push(el("button", { class: "linkbtn", type: "button", onclick: () => store.update("doubts", d.id, { resolvedReplyId: best ? null : r.id }).catch(e => showNotice(errText(e))) }, best ? "Unmark" : "Mark as helpful"));
    if (mine(r) || own) tools.push(el("button", { class: "linkbtn danger", type: "button", onclick: (e) => confirmDelete(e.currentTarget, async () => {
      if (best) await store.update("doubts", d.id, { resolvedReplyId: null });
      await store.remove("replies", r.id);
    }) }, "Delete"));
    list.append(el("div", { class: "ans" + (best ? " best" : "") },
      el("div", { class: "who" }, el("strong", {}, who(r)), el("span", {}, ago(r.createdAt)), best && el("span", { class: "pill done" }, "Helped"), ...tools),
      el("p", { class: "body" }, r.body)));
  }
  out.push(list);

  const form = el("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    const body = form.elements.reply.value.trim();
    if (!body) return;
    if (!getName()) { state.afterName = "view"; state.mode = "name"; render(); return; }
    const id = store.newId("replies");
    const doc = { parentId: d.id, parentColl: t.coll, body: body.slice(0, 5000), authorId: store.uid, authorName: getName(), createdAt: Date.now() };
    state.replies = [...state.replies, { id, ...doc }];
    form.reset(); render();
    try { await store.set("replies", id, doc); }
    catch (e2) { state.replies = state.replies.filter(x => x.id !== id); render(); showNotice(errText(e2)); }
  } },
    el("label", { for: "f-reply", class: "label" }, t.replyLabel),
    el("textarea", { id: "f-reply", name: "reply", maxlength: "5000", placeholder: state.tab === "doubts" ? "Explain step by step. Show the working, not only the result." : "Add a thought, an improvement, or offer to help build it." }),
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
function render() {
  renderHeader(); renderRail(); renderList();
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
    state.mode === "name" ? renderName() :
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
$("nameBtn").addEventListener("click", () => { state.afterName = null; state.mode = "name"; render(); if (innerWidth <= 1000) $("sheet").scrollIntoView({ behavior: "smooth" }); });
$("search").addEventListener("input", (e) => { state.query = e.target.value; renderList(); });
$("filter").addEventListener("change", (e) => { state.filter = e.target.value; renderList(); });

// ---------- start ----------
if (location.hash === "#ideas") state.tab = "ideas";
render();
(async () => {
  const conf = CFG.firebase || {};
  const configured = conf.apiKey && !String(conf.apiKey).startsWith("PASTE") && conf.projectId;
  try {
    store = configured ? await firebaseStore(conf) : localStore();
  } catch (e) {
    console.error(e);
    showNotice("Could not connect to the class board. Check your internet and reload. (" + ((e && e.code) || "error") + ")");
    state.loaded = true; render(); return;
  }
  if (store.demo) showNotice("Demo mode: posts are saved only in this browser. Add your Firebase settings to config.js so the whole class shares one board.", "demo");
  const onErr = (e) => { state.loaded = true; render(); showNotice("Lost connection to the board. Reload the page. (" + ((e && e.code) || "error") + ")"); };
  let pending = 4;
  const ready = () => { if (--pending <= 0 || state.loaded) { state.loaded = true; render(); } };
  store.subscribe("doubts", rows => { state.doubts = rows; ready(); }, onErr);
  store.subscribe("ideas", rows => { state.ideas = rows; ready(); }, onErr);
  store.subscribe("replies", rows => { state.replies = rows; ready(); }, onErr);
  store.subscribe("likes", rows => { state.likes = rows; ready(); }, onErr);
})();
