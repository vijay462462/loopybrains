// CampusLoop admin dashboard. Opens only for signed-in users whose auth id has a document in the `admins` collection;
// the Firestore security rules decide what an admin may do, this page only shows the buttons.
const CFG = window.DOUBT_DESK_CONFIG || {};
const FB_VERSION = "10.12.2";
const base = "https://www.gstatic.com/firebasejs/" + FB_VERSION + "/";
const root = document.getElementById("app");

const h = (tag, props, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "value") n.value = v;
    else if (k === "checked") n.checked = !!v;
    else if (k === "disabled") n.disabled = !!v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : String(c));
  return n;
};
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001F\u007F​-‏‪-‮⁠-⁤﻿<>]/g, "").trim().slice(0, n);
const list = (s, n, m) => String(s || "").split(/[\n,]/).map(x => clean(x, n)).filter(Boolean).slice(0, m);
const ago = (t) => { const s = Math.max(0, (Date.now() - t) / 1000); return s < 3600 ? Math.floor(s / 60) + " min ago" : s < 86400 ? Math.floor(s / 3600) + " h ago" : Math.floor(s / 86400) + " d ago"; };
const DIR = Array.isArray(window.COLLEGE_DIRECTORY) ? window.COLLEGE_DIRECTORY : [];

let fs, au, auth, db;
try {
  const [{ initializeApp }, fsm, aum] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-auth.js")]);
  fs = fsm; au = aum;
  const app = initializeApp(CFG.firebase || {});
  db = fs.getFirestore(app);
  auth = (() => { try { return au.initializeAuth(app, { persistence: [au.indexedDBLocalPersistence, au.browserLocalPersistence, au.inMemoryPersistence] }); } catch (_) { return au.getAuth(app); } })();
  if (auth.authStateReady) await auth.authStateReady();
} catch (e) {
  root.replaceChildren(h("div", { class: "card" }, h("h2", {}, "Could not load"), h("p", {}, "Check your internet and reload. (" + ((e && e.message) || "error") + ")")));
  throw e;
}

const S = { tab: "overview", admin: false, room: null, msg: "", staff: [], staffOnly: false };

// ---------- sign in (email link) ----------
async function finishLink() {
  if (!au.isSignInWithEmailLink(auth, location.href)) return "";
  let email = ""; try { email = localStorage.getItem("adm-email") || ""; } catch (_) {}
  if (!email) email = (prompt("Confirm your email address to finish signing in:") || "").trim();
  let out = "";
  if (email) {
    try {
      const cred = au.EmailAuthProvider.credentialWithLink(email, location.href);
      if (auth.currentUser && auth.currentUser.isAnonymous) { try { await au.linkWithCredential(auth.currentUser, cred); } catch (e) { await au.signInWithEmailLink(auth, email, location.href); } }
      else await au.signInWithEmailLink(auth, email, location.href);
      await auth.currentUser.getIdToken(true);
      try { localStorage.removeItem("adm-email"); } catch (_) {}
    } catch (e) { out = "Could not finish signing in (" + (e.code || "error") + "). Ask for a new link."; }
  }
  history.replaceState(null, "", location.pathname);
  return out;
}
function loginView(note) {
  const email = h("input", { type: "email", placeholder: "your email", autocomplete: "email", "aria-label": "Email" }), msg = h("p", { class: "msg" }, note || "");
  return h("div", { class: "card" }, h("h2", {}, "CampusLoop admin"), h("p", { class: "adm-hint" }, "Sign in with your email. We send you a link; open it on this device."), email,
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const v = email.value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { msg.textContent = "Type a valid email."; return; }
      e.currentTarget.disabled = true; msg.textContent = "Sending…";
      try { await au.sendSignInLinkToEmail(auth, v, { url: location.origin + location.pathname, handleCodeInApp: true }); try { localStorage.setItem("adm-email", v); } catch (_) {} msg.className = "msg ok"; msg.textContent = "Link sent to " + v + ". Open it on this device."; }
      catch (err) { msg.className = "msg err"; msg.textContent = "Could not send (" + (err.code || "error") + ")."; }
      e.currentTarget.disabled = false;
    } }, "Send me a sign-in link")), msg);
}
const WHY = { text: "" };
function notAdminView() {
  const u = auth.currentUser, id = u.uid;
  return h("div", { class: "card" }, h("h2", {}, "You are signed in, but not an admin yet"),
    WHY.text ? h("p", { class: "msg err" }, "Reason: " + WHY.text) : null,
    h("p", {}, "Signed in as ", h("b", {}, u.email || "(no email)"), u.emailVerified ? "" : " (email not verified)"),
    h("p", {}, "To make this account an admin: open the Firebase console › Firestore Database › Data › Start collection ", h("b", {}, "admins"), " › Document ID: "),
    h("p", { class: "mono" }, id),
    h("div", { class: "row" }, h("button", { class: "b sm", onclick: (e) => { navigator.clipboard && navigator.clipboard.writeText(id); e.currentTarget.textContent = "Copied"; } }, "Copy id"), h("button", { class: "b sm", onclick: () => location.reload() }, "I added it, check again"), h("button", { class: "b sm", onclick: async () => { await au.signOut(auth); location.reload(); } }, "Sign out")),
    h("p", { class: "adm-hint" }, "The document can have any single field (for example note: owner). Only people you add this way can use the dashboard."));
}

// ---------- helpers on data ----------
const roomPath = () => (S.room ? "rooms/" + S.room.room : "");
const logAction = (action, target, note) => fs.addDoc(fs.collection(db, "adminLog"), { by: auth.currentUser.uid, action, target: clean(target, 200), room: clean(S.room ? S.room.slug : "", 60), note: clean(note, 300), at: Date.now() }).catch(() => {});
const stateOfCollegeDocs = { cache: null };
async function loadColleges() {
  if (stateOfCollegeDocs.cache) return stateOfCollegeDocs.cache;
  const m = new Map();
  for (const d of DIR) m.set(d.slug, { slug: d.slug, name: d.name, state: d.state || "Andhra Pradesh", city: d.city, room: "college-" + d.slug, doc: null });
  const snap = await fs.getDocs(fs.query(fs.collection(db, "colleges"), fs.limit(1000)));
  for (const s of snap.docs) { const d = s.data(), old = m.get(s.id); m.set(s.id, { slug: s.id, name: d.name || (old && old.name) || s.id, state: d.state || (old && old.state) || "", city: d.city || (old && old.city) || "", room: old ? old.room : d.room, doc: d }); }
  const rg = (() => { try { return localStorage.getItem("adm-rgukt-room") || ""; } catch (_) { return ""; } })();
  m.set("rgukt", { slug: "rgukt", name: "RGUKT", state: "Andhra Pradesh", city: "", room: rg, doc: null, private: true });
  stateOfCollegeDocs.cache = [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  return stateOfCollegeDocs.cache;
}
const COLLS = [["doubts", "Doubts"], ["ideas", "Ideas"], ["clubs", "Clubs"], ["gate", "GATE"], ["jobs", "Jobs"], ["challenges", "Challenges"], ["market", "Market"], ["replies", "Replies"], ["stories", "Stories"]];
const reasons = (reports) => { const r = { o: 0, a: 0, s: 0, b: 0, p: 0, other: 0 }; for (const x of reports || []) { const t = String(x).split("|")[1]; if (t === "o" || t === "a" || t === "s" || t === "b" || t === "p") r[t]++; else r.other++; } return r; };

// ---------- room picker ----------
function roomPicker(onPick) {
  const input = h("input", { list: "adm-rooms", placeholder: "Type a college name…", "aria-label": "College" }), dl = h("datalist", { id: "adm-rooms" }), msg = h("p", { class: "msg" });
  let all = [];
  (S.staffOnly ? Promise.resolve(S.staff.map(x => ({ slug: x.slug || x.room, name: x.name, room: x.room, state: "", city: "" }))) : loadColleges()).then(rows => { if (S.staffOnly && rows.length && !S.room) { S.room = rows[0]; setTimeout(() => draw(), 0); } all = rows; dl.replaceChildren(...rows.map(r => h("option", { value: r.name + " (" + r.slug + ")" }))); if (S.room) input.value = S.room.name + " (" + S.room.slug + ")"; }).catch(() => { msg.textContent = "Could not load the college list."; });
  input.addEventListener("change", () => {
    const m = /\(([a-z0-9-]+)\)\s*$/.exec(input.value), pick = all.find(r => m && r.slug === m[1]) || all.find(r => r.name.toLowerCase() === input.value.trim().toLowerCase());
    if (!pick) { msg.textContent = "Pick a college from the list."; return; }
    if (!pick.room) {
      const v = prompt("RGUKT's private room id (kept only in this browser):") || "";
      if (!/^[A-Za-z0-9_-]{6,40}$/.test(v.trim())) { msg.textContent = "A room id is needed for this college."; return; }
      try { localStorage.setItem("adm-rgukt-room", v.trim()); } catch (_) {} pick.room = v.trim();
    }
    msg.textContent = ""; S.room = pick; onPick(pick);
  });
  return h("div", { class: "card" }, h("label", {}, "College to look at", input), dl, msg);
}
const needRoom = (body) => S.room ? body() : h("p", { class: "adm-hint" }, "Choose a college above first.");

// ---------- tabs ----------
function safetyCard() {
  const msg = h("p", { class: "msg" }), box = h("input", { type: "checkbox" }), card = h("div", { class: "card" }, h("h3", {}, "Student safety"), h("p", { class: "adm-hint" }, "Require a verified email before anyone can post, answer or react on any board. Reading stays open. Every post is then tied to a real email, so you can remove a bad actor for good."),
    h("label", { class: "row" }, box, "Only verified students can post (all colleges)"), msg);
  fs.getDoc(fs.doc(db, "settings", "posting")).then(s => { box.checked = s.exists() && s.data().verifiedPosting === true; }).catch(() => {});
  box.onchange = async () => { box.disabled = true; try { await fs.setDoc(fs.doc(db, "settings", "posting"), { verifiedPosting: box.checked, updatedAt: Date.now() }); msg.className = "msg ok"; msg.textContent = box.checked ? "On. Students now need a verified email to post." : "Off. Anyone can post again."; } catch (e) { box.checked = !box.checked; msg.className = "msg err"; msg.textContent = "Not saved (" + (e.code || "error") + "). Publish the latest rules first."; } box.disabled = false; };
  return card;
}
function overviewView() {
  const wrap = h("div", {});
  const stats = h("div", { class: "grid" });
  const add = (label, n) => stats.append(h("div", { class: "stat" }, h("b", {}, String(n)), h("span", {}, label)));
  const count = async (path, q) => { try { return (await fs.getCountFromServer(q || fs.collection(db, path))).data().count; } catch (_) { return "?"; } };
  (async () => {
    add("Colleges in database", await count("colleges")); add("College requests", await count("collegeRequests")); add("Plus survey answers", await count("plusInterest"));
    if (S.room) {
      const p = roomPath(); for (const [c, label] of COLLS) add(label, await count(p + "/" + c));
      add("Profiles", await count(p + "/profiles")); add("Blocked devices", await count(p + "/blocked"));
      add("Stories (24h)", await count(p + "/stories", fs.query(fs.collection(db, p + "/stories"), fs.where("createdAt", ">", Date.now() - 864e5))));
    }
  })();
  wrap.append(h("div", { class: "card" }, h("h3", {}, "Overview"), h("p", { class: "adm-hint" }, S.room ? "Counts for " + S.room.name + " (room " + (S.room.private ? "private" : S.room.room) + ")." : "Pick a college to see its counts.")), stats);
  if (!S.staffOnly) wrap.append(safetyCard());
  return wrap;
}

function moderationView() {
  const out = h("div", {}), msg = h("p", { class: "msg" });
  const p = roomPath();
  const card = (coll, label, item) => {
    const d = item.data, r = reasons(d.reports), total = (d.reports || []).length, hidden = !!d.deleted;
    const text = d.title || d.text || d.body || "(no text)", who = (d.authorName || "?") + (d.anonymous ? " (anonymous)" : "");
    const status = h("span", { class: "tag " + (hidden ? "bad" : "warn") }, hidden ? "hidden" : "visible");
    const box = h("div", { class: "card item" + (hidden ? " hidden" : "") });
    const act = async (name, data, note, btn) => {
      btn.disabled = true;
      try { await fs.updateDoc(fs.doc(db, p, coll, item.id), data); Object.assign(d, data); await logAction(name, coll + "/" + item.id, note); redraw(); }
      catch (e) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (e.code || "error") + ")."; btn.disabled = false; }
    };
    const redraw = () => { const n = card(coll, label, item); box.replaceWith(n); };
    box.append(h("div", { class: "row" }, h("span", { class: "tag" }, label), status, h("span", { class: "tag " + (total >= 3 ? "bad" : "warn") }, total + " report" + (total === 1 ? "" : "s")), h("span", { class: "mono" }, ago(d.createdAt || 0))),
      h("p", {}, h("b", {}, String(text).slice(0, 160))), d.body && d.title ? h("p", { class: "adm-hint" }, String(d.body).slice(0, 220)) : null,
      h("p", { class: "mono" }, "by " + who + " · device " + (d.authorId || "?") + (total ? " · off-topic " + r.o + ", abuse " + r.a + ", spam " + r.s + ", unsafe " + r.b + ", personal info " + r.p + (r.other ? ", other " + r.other : "") : "")),
      h("div", { class: "row" },
        hidden ? h("button", { class: "b sm ok", onclick: (e) => act("restore", { deleted: false }, "restored", e.currentTarget) }, "Restore") : h("button", { class: "b sm bad", onclick: (e) => act("hide", { deleted: true }, "hidden", e.currentTarget) }, "Hide"),
        total ? h("button", { class: "b sm", onclick: (e) => act("clear-reports", { reports: [] }, "reports cleared", e.currentTarget) }, "Clear reports") : null,
        d.authorId ? h("button", { class: "b sm", onclick: async (e) => { const b = e.currentTarget; if (!confirm("Block device " + d.authorId + "? It will not be able to post or reply.")) return; b.disabled = true; try { await fs.setDoc(fs.doc(db, p, "blocked", d.authorId), { reason: "moderation", by: auth.currentUser.uid, at: Date.now() }); await logAction("block-device", d.authorId, "from " + coll + "/" + item.id); b.textContent = "Blocked"; } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; b.disabled = false; } } }, "Block device") : null));
    return box;
  };
  let FILTER = "serious";
  const chips = h("div", { class: "row" }, ...[["serious", "Serious first"], ["open", "All still visible"], ["all", "Everything"]].map(([k, l]) => h("button", { class: "b sm", onclick: (e) => { FILTER = k; load(); } }, l)));
  const load = async (btn) => {
    out.replaceChildren(h("p", { class: "adm-hint" }, "Loading…")); if (btn) btn.disabled = true;
    try {
      const rows = [];
      for (const [c, label] of COLLS) {
        const snap = await fs.getDocs(fs.query(fs.collection(db, p, c), fs.orderBy("createdAt", "desc"), fs.limit(300)));
        for (const s of snap.docs) { const d = s.data(); if ((d.reports || []).length || d.deleted) rows.push({ coll: c, label, item: { id: s.id, data: d } }); }
      }
      const sev = (x) => { const q = reasons(x.item.data.reports); return q.b + q.p + q.a; };
      rows.sort((a, b) => (sev(b) - sev(a)) || ((b.item.data.reports || []).length - (a.item.data.reports || []).length) || ((b.item.data.createdAt || 0) - (a.item.data.createdAt || 0)));
      const shown = rows.filter(r => FILTER === "all" || (FILTER === "serious" ? sev(r) > 0 : !r.item.data.deleted)); 
      out.replaceChildren(h("p", { class: "adm-hint" }, rows.filter(r => sev(r) > 0 && !r.item.data.deleted).length + " serious (abuse, unsafe, personal info) still visible · " + rows.filter(r => !r.item.data.deleted).length + " reported and visible · " + rows.filter(r => r.item.data.deleted).length + " hidden"), ...(shown.length ? shown.slice(0, 80).map(r => card(r.coll, r.label, r.item)) : [h("p", { class: "adm-hint" }, "Nothing reported or hidden in the latest posts. 🎉")]));
    } catch (e) { out.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
    if (btn) btn.disabled = false;
  };
  const refresh = h("button", { class: "b sm", onclick: (e) => load(e.currentTarget) }, "↻ Refresh");
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Reported and hidden items"), h("p", { class: "adm-hint" }, "Latest 300 of each kind. Serious reports (abuse, unsafe, personal info) come first. Hide removes it for students; Restore brings it back. Nothing is ever deleted for good."), h("div", { class: "row" }, refresh), chips), msg, out);
}

function profileReportsView() {
  const p = roomPath(), out = h("div", {}), msg = h("p", { class: "msg" });
  const WHY = { a: "abuse", b: "bullying or unsafe", p: "personal info", s: "spam" };
  const hide = async (target, patch, note, btn) => {
    btn.disabled = true;
    try { const cur = await fs.getDoc(fs.doc(db, p, "profileHidden", target)); const base = cur.exists() ? cur.data() : {}; await fs.setDoc(fs.doc(db, p, "profileHidden", target), { dp: base.dp === true, status: base.status === true, ...patch, by: auth.currentUser.uid, at: Date.now() }); await logAction("profile-hide", target, note); msg.className = "msg ok"; msg.textContent = "Done: " + note; }
    catch (e) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (e.code || "error") + "). Publish the latest rules."; }
    btn.disabled = false;
  };
  const load = async () => {
    out.replaceChildren(h("p", { class: "adm-hint" }, "Loading…"));
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, p, "profileReports"), fs.limit(300)));
      const by = new Map();
      for (const s of snap.docs) { const r = s.data(), k = r.target + "|" + r.what; const g = by.get(k) || { target: r.target, what: r.what, name: r.name, text: r.text, rs: [], ids: [] }; g.rs.push(r.reason); g.ids.push(s.id); if (r.text) g.text = r.text; by.get(k) || by.set(k, g); }
      const groups = [...by.values()].sort((a, b) => b.rs.length - a.rs.length);
      const cards = await Promise.all(groups.map(async (g) => {
        let prof = null, hid = null;
        try { const x = await fs.getDoc(fs.doc(db, p, "profiles", g.target)); prof = x.exists() ? x.data() : null; const y = await fs.getDoc(fs.doc(db, p, "profileHidden", g.target)); hid = y.exists() ? y.data() : null; } catch (_) {}
        const isDp = g.what === "dp", hidden = !!(hid && hid[g.what] === true);
        const counts = {}; g.rs.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
        const preview = isDp ? (prof && prof.dp && /^data:image\/jpeg;base64,/.test(prof.dp) ? h("img", { src: prof.dp, alt: "Reported profile photo", style: "width:96px;height:96px;border-radius:14px;object-fit:cover" }) : h("p", { class: "adm-hint" }, "No custom photo now.")) : h("p", {}, h("b", {}, "\u201C" + String((prof && prof.status) || g.text || "(empty)").slice(0, 60) + "\u201D"));
        const box = h("div", { class: "card item" + (hidden ? " hidden" : "") });
        box.append(h("div", { class: "row" }, h("span", { class: "tag" }, isDp ? "Photo" : "Status"), h("span", { class: "tag " + (g.rs.length >= 2 ? "bad" : "warn") }, g.rs.length + " report" + (g.rs.length === 1 ? "" : "s")), h("span", { class: "tag " + (hidden ? "bad" : "ok") }, hidden ? "hidden for everyone" : "visible")),
          h("p", {}, h("b", {}, (prof && prof.name) || g.name || "?")), preview,
          h("p", { class: "mono" }, "device " + g.target + " · " + Object.entries(counts).map(([k, n]) => (WHY[k] || k) + " " + n).join(", ")),
          h("div", { class: "row" },
            hidden ? h("button", { class: "b sm ok", onclick: async (e) => { await hide(g.target, { [g.what]: false }, "unhid " + g.what, e.currentTarget); load(); } }, "Show again") : h("button", { class: "b sm bad", onclick: async (e) => { await hide(g.target, { [g.what]: true }, "hid " + g.what, e.currentTarget); load(); } }, "Hide for everyone"),
            h("button", { class: "b sm", onclick: async (e) => { const b = e.currentTarget; b.disabled = true; try { for (const id of g.ids) await fs.deleteDoc(fs.doc(db, p, "profileReports", id)); await logAction("profile-dismiss", g.target, g.what); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; b.disabled = false; } } }, "Dismiss reports"),
            h("button", { class: "b sm", onclick: async (e) => { const b = e.currentTarget; if (!confirm("Block device " + g.target + "? It will not be able to post or reply.")) return; b.disabled = true; try { await fs.setDoc(fs.doc(db, p, "blocked", g.target), { reason: "profile report", by: auth.currentUser.uid, at: Date.now() }); await logAction("block-device", g.target, "profile report"); b.textContent = "Blocked"; } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; b.disabled = false; } } }, "Block device")));
        return box;
      }));
      out.replaceChildren(...(cards.length ? cards : [h("p", { class: "adm-hint" }, "No profile reports. \u{1F389}")]));
    } catch (e) { out.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Profile photo and status reports"), h("p", { class: "adm-hint" }, "Students report a photo or status line from the story viewer. It is already hidden for the reporter. Hide it for everyone, dismiss the reports, or block the device."), h("div", { class: "row" }, h("button", { class: "b sm", onclick: load }, "\u21bb Refresh"))), msg, out);
}

function blockedView() {
  const p = roomPath(), out = h("div", { class: "card" }), msg = h("p", { class: "msg" });
  const id = h("input", { placeholder: "Device id (from a post's details)", "aria-label": "Device id" }), why = h("input", { placeholder: "Reason (optional)", "aria-label": "Reason" });
  const load = async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, p, "blocked"), fs.limit(500)));
      out.replaceChildren(h("h3", {}, snap.size + " blocked device" + (snap.size === 1 ? "" : "s")), ...snap.docs.map(s => h("div", { class: "row" }, h("span", { class: "mono" }, s.id), h("span", { class: "tag" }, (s.data().reason || "no reason")), h("span", { class: "mono" }, ago(s.data().at || 0)),
        h("button", { class: "b sm", onclick: async (e) => { e.currentTarget.disabled = true; try { await fs.deleteDoc(fs.doc(db, p, "blocked", s.id)); await logAction("unblock-device", s.id, ""); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, "Unblock"))));
    } catch (e) { out.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Block a device"), id, why, h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
    const v = clean(id.value, 80); if (v.length < 8) { msg.className = "msg err"; msg.textContent = "A device id is at least 8 characters."; return; }
    e.currentTarget.disabled = true;
    try { await fs.setDoc(fs.doc(db, p, "blocked", v), { reason: clean(why.value, 120) || "admin", by: auth.currentUser.uid, at: Date.now() }); await logAction("block-device", v, why.value); msg.className = "msg ok"; msg.textContent = "Blocked."; id.value = ""; why.value = ""; load(); }
    catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; }
    e.currentTarget.disabled = false;
  } }, "Block")), msg), out);
}

const FEATURES = [["bot", "Loop Bot", false], ["alumni", "Alumni", false], ["fun", "Entertainment", true], ["jobs", "Jobs", true], ["market", "Market", true], ["challenges", "Challenges", true]];
function collegesView() {
  const wrap = h("div", {}), form = h("div", {}), listBox = h("div", {});
  const edit = (c) => {
    const d = c.doc || {}, isDir = DIR.some(x => x.slug === c.slug), msg = h("p", { class: "msg" });
    const f = {
      slug: h("input", { value: c.slug || "", disabled: !!c.slug && c.slug !== "(new)" ? true : false, placeholder: "link-name (lowercase, digits, dashes)" }),
      name: h("input", { value: d.name || c.name || "" }), title: h("input", { value: d.title || "", placeholder: "Header title (default: CampusLoop)" }), tagline: h("input", { value: d.tagline || "" }),
      state: h("input", { value: d.state || c.state || "" }), city: h("input", { value: d.city || c.city || "" }),
      campuses: h("textarea", { value: (d.campuses || []).join(", ") }), subjects: h("textarea", { value: (d.subjects || []).join(", ") }), clubs: h("textarea", { value: (d.clubs || []).join(", ") }),
      ideaCategories: h("textarea", { value: (d.ideaCategories || []).join(", ") }), domains: h("input", { value: (d.domains || []).join(", "), placeholder: "college.edu.in" }),
      accent: h("input", { value: d.accent || "", placeholder: "#e11d48" }), room: h("input", { value: isDir ? "college-" + c.slug : (d.room || ""), disabled: isDir }),
      crestFile: h("input", { type: "file", accept: "image/png,image/jpeg,image/webp", "aria-label": "College crest image" }),
      requireVerified: h("input", { type: "checkbox", checked: d.requireVerified === true }), listed: h("input", { type: "checkbox", checked: d.listed !== false }), enabled: h("input", { type: "checkbox", checked: d.enabled !== false }),
    };
    let crestData = typeof d.crest === "string" ? d.crest : "";
    const prev = h("div", { class: "row" }), paintCrest = () => prev.replaceChildren(crestData ? h("img", { class: "st-thumb crest-prev", alt: "Crest preview", src: crestData }) : h("span", { class: "adm-hint" }, "No crest yet: students see a clean monogram of the initials."), crestData ? h("button", { class: "b sm bad", type: "button", onclick: () => { crestData = ""; paintCrest(); } }, "Remove crest") : null);
    paintCrest();
    f.crestFile.addEventListener("change", () => {
      const file = f.crestFile.files && f.crestFile.files[0]; if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 4e6) { msg.className = "msg err"; msg.textContent = "Choose a PNG, JPG or WebP image under 4 MB."; return; }
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url);
        for (const [px, q] of [[192, 0.88], [160, 0.8], [128, 0.7], [96, 0.6]]) { const cv = document.createElement("canvas"); cv.width = px; cv.height = px; const g = cv.getContext("2d"); g.clearRect(0, 0, px, px); const r = Math.min(px / img.width, px / img.height); g.drawImage(img, (px - img.width * r) / 2, (px - img.height * r) / 2, img.width * r, img.height * r);
          let out = cv.toDataURL("image/webp", q); if (!/^data:image\/webp/.test(out)) out = cv.toDataURL("image/png"); if (out.length <= 55000) { crestData = out; msg.className = "msg ok"; msg.textContent = "Crest ready. Press Save college."; paintCrest(); return; } }
        msg.className = "msg err"; msg.textContent = "That image is too detailed. Use a simpler logo."; };
      img.onerror = () => { URL.revokeObjectURL(url); msg.className = "msg err"; msg.textContent = "Could not read that image."; };
      img.src = url; });
    const feat = FEATURES.map(([k, label, def]) => ({ k, label, box: h("input", { type: "checkbox", checked: d.features && typeof d.features[k] === "boolean" ? d.features[k] : def }) }));
    const L = (t, el) => h("label", {}, t, el), C = (t, el) => h("label", { class: "check" }, el, t);
    form.replaceChildren(h("div", { class: "card" }, h("h3", {}, c.slug && c.slug !== "(new)" ? "Edit " + c.name : "New college"),
      isDir ? h("p", { class: "adm-hint" }, "This college is in the built-in directory. Saving customises it; its room stays college-" + c.slug + ".") : null,
      h("div", { class: "cols" }, L("Link name", f.slug), L("Name", f.name), L("Header title", f.title), L("Tagline", f.tagline), L("State", f.state), L("City", f.city)),
      L("College crest (logo, square works best)", f.crestFile), prev,
      L("Room id (private, 6-40 letters, digits, - _)", f.room), isDir ? null : h("div", { class: "row" }, h("button", { class: "b sm", onclick: () => { f.room.value = "k" + Array.from(crypto.getRandomValues(new Uint8Array(11)), x => "abcdefghijkmnpqrstuvwxyz23456789"[x % 32]).join(""); } }, "Generate room id")),
      L("Campuses (comma separated)", f.campuses), L("Subjects", f.subjects), L("Clubs", f.clubs), L("Idea categories", f.ideaCategories),
      h("div", { class: "cols" }, L("Email domains (verification)", f.domains), L("Accent colour", f.accent)),
      h("div", { class: "row" }, ...feat.map(x => C(x.label, x.box))),
      h("div", { class: "row" }, C("Only verified students can post", f.requireVerified), C("Show in the college list", f.listed), C("Enabled", f.enabled)),
      h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
        const slug = clean(f.slug.value, 40).toLowerCase();
        if (!/^[a-z0-9-]{2,40}$/.test(slug) || slug === "rgukt") { msg.className = "msg err"; msg.textContent = "Link name: 2-40 lowercase letters, digits or dashes (not rgukt)."; return; }
        const room = isDir ? "college-" + slug : clean(f.room.value, 40);
        if (!/^[A-Za-z0-9_-]{6,40}$/.test(room)) { msg.className = "msg err"; msg.textContent = "The room id must be 6-40 letters, digits, - or _."; return; }
        if (clean(f.name.value, 60).length < 3) { msg.className = "msg err"; msg.textContent = "Write the college name."; return; }
        const accent = clean(f.accent.value, 7), data = {
          name: clean(f.name.value, 60), room, title: clean(f.title.value, 40), tagline: clean(f.tagline.value, 80), state: clean(f.state.value, 50), city: clean(f.city.value, 40),
          campuses: list(f.campuses.value, 24, 12), subjects: list(f.subjects.value, 30, 80), clubs: list(f.clubs.value, 30, 30), ideaCategories: list(f.ideaCategories.value, 30, 20),
          domains: list(f.domains.value.toLowerCase(), 60, 8), accent: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "", crest: crestData,
          features: Object.fromEntries(feat.map(x => [x.k, x.box.checked])), requireVerified: f.requireVerified.checked, listed: f.listed.checked, enabled: f.enabled.checked, updatedAt: Date.now(),
        };
        e.currentTarget.disabled = true;
        try { await fs.setDoc(fs.doc(db, "colleges", slug), data); await logAction("save-college", "colleges/" + slug, data.name); stateOfCollegeDocs.cache = null; msg.className = "msg ok"; msg.textContent = "Saved. Link: ?c=" + slug; drawList(); }
        catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Check every field."; }
        e.currentTarget.disabled = false;
      } }, "Save college"), h("button", { class: "b", onclick: () => form.replaceChildren() }, "Close")), msg));
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const q = h("input", { type: "search", placeholder: "Search colleges…", "aria-label": "Search" });
  const drawList = async () => {
    const rows = await loadColleges(), needle = q.value.trim().toLowerCase();
    const shown = rows.filter(r => r.slug !== "rgukt" && (!needle || (r.name + " " + r.slug + " " + r.state + " " + r.city).toLowerCase().includes(needle))).slice(0, 60);
    listBox.replaceChildren(h("p", { class: "adm-hint" }, rows.length + " colleges (" + rows.filter(r => r.doc).length + " customised in the database). Showing " + shown.length + "."),
      ...shown.map(r => h("div", { class: "card" }, h("div", { class: "row" }, h("b", {}, r.name), r.doc ? h("span", { class: "tag ok" }, "customised") : h("span", { class: "tag" }, "default"), r.doc && r.doc.requireVerified ? h("span", { class: "tag warn" }, "verified only") : null, r.doc && r.doc.listed === false ? h("span", { class: "tag bad" }, "hidden") : null),
        h("p", { class: "mono" }, r.slug + " · " + [r.city, r.state].filter(Boolean).join(", ")), h("div", { class: "row" }, h("button", { class: "b sm", onclick: () => edit(r) }, r.doc ? "Edit" : "Customise"), h("button", { class: "b sm", onclick: (e) => { navigator.clipboard && navigator.clipboard.writeText(location.origin + location.pathname.replace(/admin\.html$/, "") + "?c=" + r.slug); e.currentTarget.textContent = "Link copied"; } }, "Copy link")))));
  };
  q.addEventListener("input", drawList); drawList();
  window.__editCollege = edit;
  wrap.append(h("div", { class: "card" }, h("div", { class: "row" }, h("button", { class: "b pri", onclick: () => edit({ slug: "", name: "", doc: null }) }, "＋ New college")), q), form, listBox);
  return wrap;
}

function requestsView() {
  const wrap = h("div", {}), reqBox = h("div", {}), sumBox = h("div", { class: "card" }, h("p", { class: "adm-hint" }, "Loading…"));
  (async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, "collegeRequests"), fs.orderBy("createdAt", "desc"), fs.limit(200)));
      reqBox.replaceChildren(h("h3", {}, snap.size + " college request" + (snap.size === 1 ? "" : "s")), ...snap.docs.map(s => { const d = s.data(); return h("div", { class: "card" }, h("p", {}, h("b", {}, d.name), " · ", d.city || ""), h("p", { class: "mono" }, (d.role || "") + (d.contact ? " · contact: " + d.contact : "") + " · " + ago(d.createdAt || 0)),
        h("div", { class: "row" }, h("button", { class: "b sm pri", onclick: () => { S.tab = "colleges"; draw(); window.__editCollege({ slug: "", name: d.name, city: d.city, doc: null }); } }, "Create this college"),
          h("button", { class: "b sm", onclick: async (e) => { if (!confirm("Delete this request?")) return; e.currentTarget.disabled = true; try { await fs.deleteDoc(fs.doc(db, "collegeRequests", s.id)); await logAction("delete-request", "collegeRequests/" + s.id, d.name); e.currentTarget.closest(".card").remove(); } catch (er) { e.currentTarget.disabled = false; } } }, "Done / delete"))); }));
    } catch (e) { reqBox.replaceChildren(h("p", { class: "msg err" }, "Could not load requests (" + (e.code || "error") + ").")); }
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, "plusInterest"), fs.orderBy("createdAt", "desc"), fs.limit(1000)));
      const feats = {}, prices = {}, emails = [];
      for (const s of snap.docs) { const d = s.data(); for (const f of d.features || []) feats[f] = (feats[f] || 0) + 1; prices[d.price] = (prices[d.price] || 0) + 1; if (d.email) emails.push(d.email); }
      const bar = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => h("div", {}, h("div", { class: "row" }, h("span", {}, k), h("b", {}, String(v))), h("div", { class: "bar" }, h("span", { style: "" }))));
      const mk = (obj) => { const max = Math.max(1, ...Object.values(obj)); return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => { const sp = h("span", {}); sp.style.setProperty("width", Math.round(v * 100 / max) + "%"); return h("div", {}, h("div", { class: "row" }, h("span", {}, k), h("b", {}, String(v))), h("div", { class: "bar" }, sp)); }); };
      sumBox.replaceChildren(h("h3", {}, "Plus survey: " + snap.size + " answers"), h("div", { class: "cols" }, h("div", {}, h("b", {}, "Features wanted"), ...mk(feats)), h("div", {}, h("b", {}, "Price they would pay"), ...mk(prices))), emails.length ? h("p", { class: "mono" }, emails.length + " emails: " + emails.slice(0, 30).join(", ")) : null);
    } catch (e) { sumBox.replaceChildren(h("p", { class: "msg err" }, "Could not load the survey (" + (e.code || "error") + ").")); }
  })();
  wrap.append(sumBox, reqBox); return wrap;
}

function logView() {
  const box = h("div", { class: "card" }, h("p", { class: "adm-hint" }, "Loading…"));
  fs.getDocs(fs.query(fs.collection(db, "adminLog"), fs.orderBy("at", "desc"), fs.limit(60))).then(snap => {
    box.replaceChildren(h("h3", {}, "Last " + snap.size + " admin actions"), ...snap.docs.map(s => { const d = s.data(); return h("p", { class: "mono" }, new Date(d.at).toLocaleString() + " · " + d.action + " · " + (d.target || "") + (d.room ? " · " + d.room : "") + (d.note ? " · " + d.note : "") + " · by " + String(d.by).slice(0, 8)); }));
  }).catch(e => box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")));
  return box;
}


function noticesView() {
  const p = roomPath(), msg = h("p", { class: "msg" }), box = h("div", {});
  const f = { title: h("input", { placeholder: "Title, e.g. Mid-sem timetable released", maxlength: "100" }), body: h("textarea", { placeholder: "Details (optional)", maxlength: "600" }), from: h("input", { placeholder: "Posted by, e.g. Exam cell, Principal's office, Placement cell", maxlength: "40" }), link: h("input", { placeholder: "https:// link (optional)", maxlength: "290" }),
    days: h("input", { type: "number", min: "0", max: "365", value: "7", "aria-label": "Show for how many days (0 = until removed)" }), pinned: h("input", { type: "checkbox", checked: true }) };
  const load = async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, p, "notices"), fs.limit(100)));
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      box.replaceChildren(h("h3", {}, rows.length + " notice" + (rows.length === 1 ? "" : "s")), ...rows.map(r => h("div", { class: "card item" + (r.deleted ? " hidden" : "") }, h("div", { class: "row" }, h("b", {}, r.title), r.pinned ? h("span", { class: "tag warn" }, "pinned") : null, r.deleted ? h("span", { class: "tag bad" }, "archived") : null),
        h("p", { class: "mono" }, ago(r.createdAt || 0) + (r.expiresAt ? " · until " + new Date(r.expiresAt).toLocaleDateString() : "")),
        h("div", { class: "row" }, h("button", { class: "b sm", onclick: async (e) => { e.currentTarget.disabled = true; try { const { id, ...data } = r; await fs.setDoc(fs.doc(db, p, "notices", id), { ...data, deleted: !r.deleted }); await logAction(r.deleted ? "restore-notice" : "archive-notice", "notices/" + id, r.title); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, r.deleted ? "Restore" : "Archive")))));
    } catch (e) { box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Post an official notice"), h("p", { class: "adm-hint" }, "Students see it as a gold banner at the top of the board until they dismiss it or it expires."),
    f.title, f.body, f.from, f.link, h("label", {}, "Show for days (0 = until archived)", f.days), h("label", { class: "check" }, f.pinned, "Pin to the top"),
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const link = f.link.value.trim(), days = Math.max(0, Math.min(365, parseInt(f.days.value, 10) || 0));
      if (clean(f.title.value, 100).length < 3) { msg.className = "msg err"; msg.textContent = "Write a title."; return; }
      if (link && !/^https:\/\/[^\s]{4,290}$/.test(link)) { msg.className = "msg err"; msg.textContent = "The link must start with https://"; return; }
      e.currentTarget.disabled = true;
      try { const ref = fs.doc(fs.collection(db, p, "notices")), data = { title: clean(f.title.value, 100), body: clean(f.body.value, 600), from: clean(f.from.value, 40), link, pinned: f.pinned.checked, createdAt: Date.now() }; if (days) data.expiresAt = Date.now() + days * 864e5; await fs.setDoc(ref, data); await logAction("post-notice", "notices/" + ref.id, data.title); msg.className = "msg ok"; msg.textContent = "Posted."; f.title.value = ""; f.body.value = ""; f.from.value = ""; f.link.value = ""; load(); }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Post notice")), msg), box);
}

function promosView() {
  const msg = h("p", { class: "msg" }), box = h("div", {});
  const f = { code: h("input", { placeholder: "CODE, e.g. EXAM30 (3-20 capitals/digits)", maxlength: "20" }), percent: h("input", { type: "number", min: "5", max: "90", value: "30", "aria-label": "Percent off" }),
    plan: h("select", {}, ...["any", "weekly", "monthly", "semester", "yearly"].map(x => h("option", { value: x }, x === "any" ? "Any plan" : x))), days: h("input", { type: "number", min: "1", max: "365", value: "30", "aria-label": "Valid for days" }), uses: h("input", { type: "number", min: "1", max: "100000", value: "100", "aria-label": "Maximum uses" }), note: h("input", { placeholder: "Note (optional), e.g. Instagram campaign", maxlength: "100" }) };
  const load = async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, "promoCodes"), fs.limit(200)));
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      box.replaceChildren(h("h3", {}, rows.length + " code" + (rows.length === 1 ? "" : "s")), ...rows.map(r => { const dead = r.active === false || r.until < Date.now() || (r.used || 0) >= r.maxUses;
        return h("div", { class: "card item" + (dead ? " hidden" : "") }, h("div", { class: "row" }, h("b", { class: "mono" }, r.id), h("span", { class: "tag ok" }, r.percent + "% off"), h("span", { class: "tag" }, r.plan), dead ? h("span", { class: "tag bad" }, "off") : null),
          h("p", { class: "mono" }, "used " + (r.used || 0) + "/" + r.maxUses + " · until " + new Date(r.until).toLocaleDateString() + (r.note ? " · " + r.note : "")),
          h("div", { class: "row" }, h("button", { class: "b sm", onclick: async (e) => { e.currentTarget.disabled = true; try { await fs.updateDoc(fs.doc(db, "promoCodes", r.id), { active: r.active === false }); await logAction(r.active === false ? "promo-on" : "promo-off", "promoCodes/" + r.id, ""); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, r.active === false ? "Switch on" : "Switch off"))); }));
    } catch (e) { box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Create a promo code"), h("p", { class: "adm-hint" }, "Give a code to a college, a club or an influencer. Students type it on the Plus screen and the payment page shows the lower price."),
    f.code, h("div", { class: "cols" }, h("label", {}, "Percent off (5-90)", f.percent), h("label", { }, "Plan", f.plan), h("label", {}, "Valid for days", f.days), h("label", {}, "Maximum uses", f.uses)), f.note,
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const code = f.code.value.trim().toUpperCase(), percent = parseInt(f.percent.value, 10), days = parseInt(f.days.value, 10), uses = parseInt(f.uses.value, 10);
      if (!/^[A-Z0-9]{3,20}$/.test(code)) { msg.className = "msg err"; msg.textContent = "Code: 3-20 capital letters or digits."; return; }
      if (!(percent >= 5 && percent <= 90) || !(days >= 1) || !(uses >= 1)) { msg.className = "msg err"; msg.textContent = "Check the percent (5-90), days and uses."; return; }
      e.currentTarget.disabled = true;
      try { await fs.setDoc(fs.doc(db, "promoCodes", code), { percent, plan: f.plan.value, until: Date.now() + days * 864e5, maxUses: uses, used: 0, active: true, note: clean(f.note.value, 100), createdAt: Date.now() }); await logAction("create-promo", "promoCodes/" + code, percent + "% " + f.plan.value); msg.className = "msg ok"; msg.textContent = "Created " + code + "."; f.code.value = ""; load(); }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). That code may already exist, or publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Create code")), msg), box);
}

function saleView() {
  const msg = h("p", { class: "msg" }), cur = h("div", { class: "card" }, h("p", { class: "adm-hint" }, "Loading…"));
  const f = { title: h("input", { placeholder: "Title, e.g. Flash sale: 30% off Plus", maxlength: "60" }), text: h("input", { placeholder: "Short text (optional), e.g. Today only for exam week", maxlength: "160" }), code: h("input", { placeholder: "Promo code to show (optional, must exist)", maxlength: "20" }), hours: h("input", { type: "number", min: "1", max: "720", value: "48", "aria-label": "Hours the sale runs" }) };
  const load = async () => {
    try { const d = await fs.getDoc(fs.doc(db, "sales", "current")); const s = d.exists() ? d.data() : null;
      cur.replaceChildren(h("h3", {}, "Current sale"), s ? h("div", {}, h("p", {}, h("b", {}, s.title), " ", s.active && s.until > Date.now() ? h("span", { class: "tag ok" }, "live") : h("span", { class: "tag bad" }, "off")), h("p", { class: "mono" }, (s.code ? "code " + s.code + " · " : "") + "ends " + new Date(s.until).toLocaleString()),
        s.active ? h("div", { class: "row" }, h("button", { class: "b sm bad", onclick: async (e) => { e.currentTarget.disabled = true; try { await fs.setDoc(fs.doc(db, "sales", "current"), { ...s, active: false, updatedAt: Date.now() }); await logAction("sale-off", "sales/current", s.title); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, "Switch off now")) : null) : h("p", { class: "adm-hint" }, "No sale yet."));
    } catch (e) { cur.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, cur, h("div", { class: "card" }, h("h3", {}, "Start a flash sale"), h("p", { class: "adm-hint" }, "Students see a red banner with a live countdown at the top of the app. Create the promo code first (Promo codes tab), then type it here so students can apply it with one tap."),
    f.title, f.text, f.code, h("label", {}, "Runs for (hours)", f.hours),
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const code = f.code.value.trim().toUpperCase(), hours = parseInt(f.hours.value, 10);
      if (clean(f.title.value, 60).length < 3) { msg.className = "msg err"; msg.textContent = "Write a title."; return; }
      if (code && !/^[A-Z0-9]{3,20}$/.test(code)) { msg.className = "msg err"; msg.textContent = "Code: 3-20 capital letters or digits."; return; }
      if (!(hours >= 1 && hours <= 720)) { msg.className = "msg err"; msg.textContent = "Hours: 1 to 720."; return; }
      e.currentTarget.disabled = true;
      try { const data = { title: clean(f.title.value, 60), text: clean(f.text.value, 160), code, until: Date.now() + hours * 36e5, active: true, updatedAt: Date.now() }; await fs.setDoc(fs.doc(db, "sales", "current"), data); await logAction("sale-on", "sales/current", data.title); msg.className = "msg ok"; msg.textContent = "Live now."; load(); }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Start sale")), msg));
}

function staffView() {
  const msg = h("p", { class: "msg" }), box = h("div", {});
  const uid = h("input", { placeholder: "Staff member's user id (they copy it from the admin page)", maxlength: "128" }), label = h("input", { placeholder: "Role, e.g. Exam cell (optional)", maxlength: "40" }), pick = h("input", { list: "adm-staff-colleges", placeholder: "Type the college name…", "aria-label": "College" }), dl = h("datalist", { id: "adm-staff-colleges" });
  let all = [];
  loadColleges().then(rows => { all = rows.filter(r => r.slug !== "rgukt" || r.room); dl.replaceChildren(...all.map(r => h("option", { value: r.name + " (" + r.slug + ")" }))); }).catch(() => {});
  const load = async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, "staff"), fs.limit(300)));
      box.replaceChildren(h("h3", {}, snap.size + " staff member" + (snap.size === 1 ? "" : "s")), ...snap.docs.map(d => { const r = d.data(); return h("div", { class: "card" }, h("div", { class: "row" }, h("b", {}, r.name), r.label ? h("span", { class: "tag" }, r.label) : null), h("p", { class: "mono" }, r.uid + " · added " + ago(r.createdAt || 0)),
        h("div", { class: "row" }, h("button", { class: "b sm bad", onclick: async (e) => { if (!confirm("Remove this staff member?")) return; e.currentTarget.disabled = true; try { await fs.deleteDoc(fs.doc(db, "staff", d.id)); await logAction("remove-staff", "staff/" + d.id, r.name); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, "Remove"))); }));
    } catch (e) { box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Add a college staff member"), h("p", { class: "adm-hint" }, "1) The staff member opens /admin.html and signs in with their email. 2) They copy the user id the page shows and send it to you. 3) You add them here. They can then post notices and papers, hide reported posts and block devices for THEIR college only."),
    uid, pick, dl, label,
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const m = /\(([a-z0-9-]+)\)\s*$/.exec(pick.value), c = all.find(r => m && r.slug === m[1]), id = uid.value.trim();
      if (!c || !c.room) { msg.className = "msg err"; msg.textContent = "Pick a college from the list (for RGUKT, open it once in another tab so its room id is saved)."; return; }
      if (id.length < 10 || /[\/\s]/.test(id)) { msg.className = "msg err"; msg.textContent = "Paste the staff member's user id."; return; }
      e.currentTarget.disabled = true;
      try { await fs.setDoc(fs.doc(db, "staff", c.room + "_" + id), { uid: id, room: c.room, slug: c.slug, name: c.name.slice(0, 60), label: clean(label.value, 40), by: auth.currentUser.uid, createdAt: Date.now() }); await logAction("add-staff", "staff/" + c.slug + "_" + id.slice(0, 6), c.name); msg.className = "msg ok"; msg.textContent = "Added."; uid.value = ""; label.value = ""; load(); }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Add staff")), msg), box);
}

// Weekly engagement report: counts for the last 7 days against the 7 days before, computed from the board itself.
function reportView() {
  const p = roomPath(), out = h("div", {}), W = 7 * 864e5, now = Date.now();
  const POSTS = [["doubts", "Doubts"], ["ideas", "Ideas"], ["clubs", "Club posts"], ["gate", "GATE"], ["jobs", "Jobs"], ["challenges", "Challenges"], ["market", "Market"]];
  const count = async (coll, from, to) => { try { return (await fs.getCountFromServer(fs.query(fs.collection(db, p, coll), fs.where("createdAt", ">=", from), fs.where("createdAt", "<", to)))).data().count; } catch (_) { return 0; } };
  const docs = async (coll, from) => { try { return (await fs.getDocs(fs.query(fs.collection(db, p, coll), fs.where("createdAt", ">=", from), fs.limit(1000)))).docs.map(d => ({ id: d.id, ...d.data() })); } catch (_) { return []; } };
  const delta = (cur, prev) => prev ? Math.round((cur - prev) * 100 / prev) : (cur ? 100 : 0);
  const arrow = (d) => d > 0 ? "▲ " + d + "%" : d < 0 ? "▼ " + Math.abs(d) + "%" : "–";
  const run = async (btn) => {
    if (btn) btn.disabled = true; out.replaceChildren(h("p", { class: "adm-hint" }, "Building the report…"));
    const t0 = now - W, t1 = now - 2 * W;
    const rows = {};
    await Promise.all([...POSTS.map(([c]) => c), "replies", "stories"].map(async c => { rows[c] = [await count(c, t0, now + 1), await count(c, t1, t0)]; }));
    const [recent, replies, profiles] = await Promise.all([Promise.all(POSTS.map(([c]) => docs(c, t0))), docs("replies", t0), fs.getCountFromServer(fs.collection(db, p, "profiles")).then(s => s.data().count).catch(() => 0)]);
    const all = recent.flat(), active = new Set([...all, ...replies].map(x => x.authorId).filter(Boolean)), doubts = recent[0] || [];
    const answered = new Set(replies.filter(r => r.parentColl === "doubts").map(r => r.parentId)), doubtsAnswered = doubts.filter(d => answered.has(d.id)).length;
    const subjects = {}; for (const d of doubts) subjects[d.subject || "Other"] = (subjects[d.subject || "Other"] || 0) + 1;
    const top = Object.entries(subjects).sort((a, b) => b[1] - a[1]).slice(0, 5), flagged = all.filter(x => x.deleted || (x.reports || []).length >= 2).length;
    const totalPosts = POSTS.reduce((n, [c]) => n + rows[c][0], 0), prevPosts = POSTS.reduce((n, [c]) => n + rows[c][1], 0);
    const tile = (label, v, d) => h("div", { class: "stat" }, h("b", {}, String(v)), h("span", {}, label + (d == null ? "" : " · " + arrow(d))));
    const name = S.room ? S.room.name : "College", from = new Date(t0).toLocaleDateString(), to = new Date(now).toLocaleDateString();
    const summary = name + " on CampusLoop, " + from + " to " + to + ":\n- " + active.size + " active students (of " + profiles + " with a profile)\n- " + totalPosts + " new posts (" + arrow(delta(totalPosts, prevPosts)) + " vs last week) and " + rows.replies[0] + " replies\n- " + doubts.length + " doubts asked, " + doubtsAnswered + " answered" + (doubts.length ? " (" + Math.round(doubtsAnswered * 100 / doubts.length) + "%)" : "") + "\n- " + rows.stories[0] + " stories shared\n- Top subjects: " + (top.map(t => t[0] + " (" + t[1] + ")").join(", ") || "none yet") + "\n- " + flagged + " items reported or hidden by moderators" + (all.length >= 1000 ? "\n(Large board: counts of students are from the latest 1000 posts per section.)" : "");
    const max = Math.max(1, ...top.map(t => t[1]));
    out.replaceChildren(
      h("div", { class: "card report" }, h("h3", {}, name + " · weekly report"), h("p", { class: "adm-hint" }, from + " to " + to + ", compared with the 7 days before."),
        h("div", { class: "grid" }, tile("Active students", active.size), tile("Profiles in total", profiles), tile("New posts", totalPosts, delta(totalPosts, prevPosts)), tile("Replies", rows.replies[0], delta(rows.replies[0], rows.replies[1])), tile("Doubts asked", doubts.length, delta(rows.doubts[0], rows.doubts[1])), tile("Doubts answered", doubtsAnswered), tile("Stories", rows.stories[0], delta(rows.stories[0], rows.stories[1])), tile("Reported or hidden", flagged))),
      h("div", { class: "card report" }, h("h3", {}, "Posts by section"), ...POSTS.map(([c, label]) => h("div", { class: "row" }, h("span", {}, label), h("b", {}, String(rows[c][0])), h("span", { class: "tag" }, arrow(delta(rows[c][0], rows[c][1])))))),
      h("div", { class: "card report" }, h("h3", {}, "Most asked subjects"), ...(top.length ? top.map(([s, n]) => { const sp = h("span", {}); sp.style.setProperty("width", Math.round(n * 100 / max) + "%"); return h("div", {}, h("div", { class: "row" }, h("span", {}, s), h("b", {}, String(n))), h("div", { class: "bar" }, sp)); }) : [h("p", { class: "adm-hint" }, "No doubts this week.")])),
      h("div", { class: "card no-print" }, h("div", { class: "row" }, h("button", { class: "b pri", onclick: (e) => { navigator.clipboard && navigator.clipboard.writeText(summary); e.currentTarget.textContent = "Copied"; } }, "Copy summary for WhatsApp/email"), h("button", { class: "b", onclick: () => window.print() }, "Print / Save as PDF"), h("button", { class: "b", onclick: (e) => run(e.currentTarget) }, "↻ Refresh")), h("pre", { class: "mono rep-sum" }, summary)));
    if (btn) btn.disabled = false;
  };
  run();
  return h("div", {}, h("div", { class: "card no-print" }, h("h3", {}, "Weekly engagement report"), h("p", { class: "adm-hint" }, "Share this with the principal or head of department every Monday. It uses only counts and subjects, never names or posts.")), out);
}

// Who gets the Monday e-mail for the selected college (admins only; needs the e-mail function deployed).
function mailView() {
  const msg = h("p", { class: "msg" }), slug = S.room.slug, ref = fs.doc(db, "reportEmails", slug);
  const box = h("div", { class: "card" }, h("p", { class: "adm-hint" }, "Loading…"));
  const emails = h("textarea", { placeholder: "One e-mail per line (up to 5), e.g. principal@college.edu.in", maxlength: "600" }), on = h("input", { type: "checkbox", checked: true });
  fs.getDoc(ref).then(d => { if (d.exists()) { emails.value = (d.data().emails || []).join("\n"); on.checked = d.data().active !== false; box.replaceChildren(h("p", { class: "adm-hint" }, d.data().lastSent ? "Last sent " + new Date(d.data().lastSent).toLocaleString() : "Not sent yet.")); } else box.replaceChildren(h("p", { class: "adm-hint" }, "Not set up yet.")); }).catch(() => box.replaceChildren(h("p", { class: "msg err" }, "Could not load.")));
  const parse = () => emails.value.split(/[\n,;]/).map(x => x.trim().toLowerCase()).filter(Boolean);
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Monday report e-mail for " + S.room.name), h("p", { class: "adm-hint" }, "Every Monday at 8:00 (India time) these people get last week's engagement numbers. Counts and subjects only, no names or posts."),
    emails, h("label", { class: "check" }, on, "Send every Monday"),
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const list = parse(); if (!list.length || list.length > 5 || list.some(x => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) { msg.className = "msg err"; msg.textContent = "Add 1 to 5 valid e-mail addresses."; return; }
      e.currentTarget.disabled = true;
      try { await fs.setDoc(ref, { room: S.room.room, name: S.room.name.slice(0, 60), emails: list, active: on.checked, updatedAt: Date.now() }, { merge: true }); await logAction("report-emails", "reportEmails/" + slug, list.length + " recipients"); msg.className = "msg ok"; msg.textContent = "Saved."; }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Only platform admins can do this; publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Save"), h("button", { class: "b", onclick: async (e) => {
      const url = (window.DOUBT_DESK_CONFIG.plus || {}).functionsUrl; if (!url) { msg.className = "msg err"; msg.textContent = "Deploy the functions first and set functionsUrl in config.js."; return; }
      e.currentTarget.disabled = true; msg.className = "msg"; msg.textContent = "Sending…";
      try { const tok = await auth.currentUser.getIdToken(), r = await fetch(url.replace(/\/$/, "") + "/sendReportNow", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok }, body: JSON.stringify({ slug }) }), d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Could not send."); msg.className = "msg ok"; msg.textContent = "Test e-mail sent. Check the inbox (and spam)."; }
      catch (er) { msg.className = "msg err"; msg.textContent = er.message || "Could not send."; }
      e.currentTarget.disabled = false;
    } }, "Send a test now")), msg), box);
}

// Placement cell: post campus drives, see who is interested, download the list as CSV.
function drivesView() {
  const p = roomPath(), msg = h("p", { class: "msg" }), box = h("div", {});
  const f = { company: h("input", { placeholder: "Company, e.g. Infosys", maxlength: "60" }), role: h("input", { placeholder: "Role, e.g. Systems Engineer", maxlength: "80" }), pkg: h("input", { placeholder: "Package, e.g. 3.6 LPA", maxlength: "40" }),
    branches: h("input", { placeholder: "Eligible branches, comma separated (empty = all)", maxlength: "200" }), cgpa: h("input", { type: "number", step: "0.1", min: "0", max: "10", placeholder: "Minimum CGPA (optional)" }),
    last: h("input", { type: "date", "aria-label": "Last date to register" }), when: h("input", { type: "date", "aria-label": "Drive date (optional)" }), link: h("input", { placeholder: "https:// company or apply link (optional)", maxlength: "290" }), details: h("textarea", { placeholder: "Details: rounds, documents to carry, venue…", maxlength: "800" }) };
  const csv = (rows) => rows.map(r => r.map(x => '"' + String(x == null ? "" : x).replace(/"/g, '""').replace(/^([=+@-])/, "'$1") + '"').join(",")).join("\n");
  const load = async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, p, "drives"), fs.limit(200)));
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.lastDate || 0) - (a.lastDate || 0));
      box.replaceChildren(h("h3", {}, rows.length + " drive" + (rows.length === 1 ? "" : "s")), ...rows.map(r => {
        const open = r.lastDate > Date.now() && !r.deleted, app = h("div", {});
        return h("div", { class: "card item" + (open ? "" : " hidden") }, h("div", { class: "row" }, h("b", {}, r.company + " · " + r.role), open ? h("span", { class: "tag ok" }, "open") : h("span", { class: "tag bad" }, r.deleted ? "removed" : "closed")),
          h("p", { class: "mono" }, [r.package, (r.branches || []).join("/"), r.minCgpa ? "CGPA ≥ " + r.minCgpa : "", "closes " + new Date(r.lastDate).toLocaleDateString()].filter(Boolean).join(" · ")),
          h("div", { class: "row" }, h("button", { class: "b sm", onclick: async (e) => {
            e.currentTarget.disabled = true;
            try { const s2 = await fs.getDocs(fs.query(fs.collection(db, p, "driveInterest"), fs.where("driveId", "==", r.id), fs.limit(1000))), list = s2.docs.map(d => d.data()).sort((x, y) => x.createdAt - y.createdAt);
              app.replaceChildren(h("p", { class: "adm-hint" }, list.length + " interested"), ...list.slice(0, 50).map(x => h("p", { class: "mono" }, x.name + " · " + (x.branch || "-") + " · CGPA " + (x.cgpa == null ? "-" : x.cgpa) + (x.phone ? " · " + x.phone : ""))),
                list.length ? h("button", { class: "b sm pri", onclick: () => { const blob = new Blob([csv([["Name", "Branch", "CGPA", "Phone", "Registered"], ...list.map(x => [x.name, x.branch, x.cgpa, x.phone, new Date(x.createdAt).toLocaleString()])])], { type: "text/csv" }), u = URL.createObjectURL(blob), el2 = document.createElement("a"); el2.href = u; el2.download = (r.company + "-applicants").replace(/[^A-Za-z0-9-]+/g, "_") + ".csv"; el2.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); } }, "Download CSV") : null); }
            catch (er) { msg.className = "msg err"; msg.textContent = "Could not load (" + (er.code || "error") + ")."; }
            e.currentTarget.disabled = false; } }, "Interested students"),
            h("button", { class: "b sm bad", onclick: async (e) => { if (!confirm("Remove this drive for students?")) return; e.currentTarget.disabled = true; try { const { id, ...data } = r; await fs.setDoc(fs.doc(db, p, "drives", id), { ...data, deleted: true }); await logAction("remove-drive", "drives/" + id, r.company); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, "Remove")), app); }));
    } catch (e) { box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Post a campus drive"), h("p", { class: "adm-hint" }, "Students see it under Campus Drives, check their eligibility and tap I am interested. You see their name, branch, CGPA and optional phone, and can download the list."),
    f.company, f.role, f.pkg, f.branches, f.cgpa, h("label", {}, "Last date to register", f.last), h("label", {}, "Drive date (optional)", f.when), f.link, f.details,
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const link = f.link.value.trim(), cg = parseFloat(f.cgpa.value), last = f.last.value ? new Date(f.last.value + "T23:59:59").getTime() : 0;
      if (clean(f.company.value, 60).length < 2 || clean(f.role.value, 80).length < 2) { msg.className = "msg err"; msg.textContent = "Write the company and the role."; return; }
      if (!last || last < Date.now()) { msg.className = "msg err"; msg.textContent = "Pick a last date in the future."; return; }
      if (link && !/^https:\/\/[^\s]{4,290}$/.test(link)) { msg.className = "msg err"; msg.textContent = "The link must start with https://"; return; }
      e.currentTarget.disabled = true;
      try { const data = { company: clean(f.company.value, 60), role: clean(f.role.value, 80), package: clean(f.pkg.value, 40), branches: list(f.branches.value, 20, 12), lastDate: last, link, details: clean(f.details.value, 800), createdAt: Date.now() }; if (cg >= 0 && cg <= 10) data.minCgpa = cg; if (f.when.value) data.driveDate = new Date(f.when.value + "T09:00:00").getTime();
        const ref = fs.doc(fs.collection(db, p, "drives")); await fs.setDoc(ref, data); await logAction("post-drive", "drives/" + ref.id, data.company); msg.className = "msg ok"; msg.textContent = "Posted."; for (const k of ["company", "role", "pkg", "branches", "cgpa", "link", "details"]) f[k].value = ""; load(); }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Post drive")), msg), box);
}

// Events: club coordinators (staff) and admins post events; students RSVP in the app.
function eventsView() {
  const p = roomPath(), msg = h("p", { class: "msg" }), box = h("div", {});
  const f = { title: h("input", { placeholder: "Event title, e.g. Hackathon kickoff", maxlength: "100" }), club: h("input", { placeholder: "Club (optional)", maxlength: "40" }), venue: h("input", { placeholder: "Venue", maxlength: "80" }), start: h("input", { type: "datetime-local", "aria-label": "Starts" }), end: h("input", { type: "datetime-local", "aria-label": "Ends (optional)" }),
    cap: h("input", { type: "number", min: "0", max: "5000", placeholder: "Capacity (optional)" }), link: h("input", { placeholder: "https:// more info link (optional)", maxlength: "290" }), details: h("textarea", { placeholder: "What to expect, what to bring…", maxlength: "600" }) };
  const load = async () => {
    try {
      const [es, rs] = await Promise.all([fs.getDocs(fs.query(fs.collection(db, p, "events"), fs.limit(200))), fs.getDocs(fs.query(fs.collection(db, p, "eventRsvp"), fs.limit(2000)))]);
      const rsvps = rs.docs.map(d => d.data()), rows = es.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.startAt - a.startAt);
      box.replaceChildren(h("h3", {}, rows.length + " event" + (rows.length === 1 ? "" : "s")), ...rows.map(r => { const n = rsvps.filter(x => x.eventId === r.id);
        return h("div", { class: "card item" + (r.deleted ? " hidden" : "") }, h("div", { class: "row" }, h("b", {}, r.title), r.deleted ? h("span", { class: "tag bad" }, "removed") : null, h("span", { class: "tag ok" }, n.length + " going")), h("p", { class: "mono" }, new Date(r.startAt).toLocaleString() + (r.venue ? " · " + r.venue : "") + (r.club ? " · " + r.club : "")),
          h("p", { class: "adm-hint" }, n.slice(0, 30).map(x => x.name).join(", ")),
          h("div", { class: "row" }, h("button", { class: "b sm bad", onclick: async (e) => { if (!confirm("Remove this event for students?")) return; e.currentTarget.disabled = true; try { const { id, ...data } = r; await fs.setDoc(fs.doc(db, p, "events", id), { ...data, deleted: !r.deleted }); await logAction(r.deleted ? "restore-event" : "remove-event", "events/" + id, r.title); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, r.deleted ? "Restore" : "Remove"))); }));
    } catch (e) { box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Post an event"), h("p", { class: "adm-hint" }, "Students see it under Events and on the Today card, tap I am going, and can add it to their phone calendar."),
    f.title, f.club, f.venue, h("label", {}, "Starts", f.start), h("label", {}, "Ends (optional)", f.end), f.cap, f.link, f.details,
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const link = f.link.value.trim(), start = f.start.value ? new Date(f.start.value).getTime() : 0, end = f.end.value ? new Date(f.end.value).getTime() : 0, cap = parseInt(f.cap.value, 10);
      if (clean(f.title.value, 100).length < 3) { msg.className = "msg err"; msg.textContent = "Write a title."; return; }
      if (!start || start < Date.now() - 36e5) { msg.className = "msg err"; msg.textContent = "Pick a start time in the future."; return; }
      if (end && end <= start) { msg.className = "msg err"; msg.textContent = "The end must be after the start."; return; }
      if (link && !/^https:\/\/[^\s]{4,290}$/.test(link)) { msg.className = "msg err"; msg.textContent = "The link must start with https://"; return; }
      e.currentTarget.disabled = true;
      try { const data = { title: clean(f.title.value, 100), club: clean(f.club.value, 40), venue: clean(f.venue.value, 80), details: clean(f.details.value, 600), startAt: start, link, createdAt: Date.now() }; if (end) data.endAt = end; if (cap >= 0 && cap <= 5000) data.capacity = cap;
        const ref = fs.doc(fs.collection(db, p, "events")); await fs.setDoc(ref, data); await logAction("post-event", "events/" + ref.id, data.title); msg.className = "msg ok"; msg.textContent = "Posted."; for (const k of ["title", "club", "venue", "start", "end", "cap", "link", "details"]) f[k].value = ""; load(); }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Post event")), msg), box);
}

// College licences: record what a college paid, switch Plus on for all its students until the end date, and see renewals coming up.
function licencesView() {
  const msg = h("p", { class: "msg" }), box = h("div", {}), pick = h("input", { list: "adm-lic-colleges", placeholder: "Type the college name…", "aria-label": "College" }), dl = h("datalist", { id: "adm-lic-colleges" });
  const f = { seats: h("input", { type: "number", min: "1", placeholder: "Number of students (seats)" }), price: h("input", { type: "number", min: "0", placeholder: "Price per student per year (₹)" }), months: h("input", { type: "number", min: "1", max: "60", value: "12", "aria-label": "Months" }),
    contact: h("input", { placeholder: "Contact person and phone/email", maxlength: "120" }), notes: h("input", { placeholder: "Notes (invoice no., pilot, discount…)", maxlength: "300" }) };
  let all = [];
  loadColleges().then(rows => { all = rows; dl.replaceChildren(...rows.map(r => h("option", { value: r.name + " (" + r.slug + ")" }))); }).catch(() => {});
  const load = async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, "licenses"), fs.limit(300)));
      const rows = snap.docs.map(d => ({ slug: d.id, ...d.data() })).sort((a, b) => a.until - b.until), active = rows.filter(r => r.until > Date.now()), total = active.reduce((n, r) => n + (r.amount || 0), 0);
      box.replaceChildren(h("h3", {}, active.length + " active licence" + (active.length === 1 ? "" : "s") + " · ₹" + total.toLocaleString("en-IN") + " per year"), ...rows.map(r => { const days = Math.ceil((r.until - Date.now()) / 864e5), live = days > 0;
        return h("div", { class: "card item" + (live ? "" : " hidden") }, h("div", { class: "row" }, h("b", {}, r.name), live ? h("span", { class: "tag " + (days <= 30 ? "warn" : "ok") }, days <= 30 ? "renew in " + days + " d" : "active") : h("span", { class: "tag bad" }, "expired")),
          h("p", { class: "mono" }, (r.seats || 0) + " seats · ₹" + (r.pricePerStudent || 0) + "/student · ₹" + (r.amount || 0).toLocaleString("en-IN") + " · until " + new Date(r.until).toLocaleDateString()), r.contact ? h("p", { class: "adm-hint" }, r.contact) : null,
          h("div", { class: "row" }, h("button", { class: "b sm bad", onclick: async (e) => { if (!confirm("End Plus for all students of " + r.name + " now?")) return; e.currentTarget.disabled = true; try { await fs.deleteDoc(fs.doc(db, "collegePlus", r.slug)); await fs.setDoc(fs.doc(db, "licenses", r.slug), { ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== "slug")), until: Date.now(), updatedAt: Date.now() }); await logAction("end-licence", "licenses/" + r.slug, r.name); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, "End now")));
      }));
    } catch (e) { box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  const quote = () => { const n = parseInt(f.seats.value, 10) || 0, rate = n >= 3000 ? 30 : n >= 1000 ? 45 : 60, amt = Math.max(25000, n * rate); f.price.value = String(n ? Math.round(amt / n) : rate); return amt; };
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Record a college licence"), h("p", { class: "adm-hint" }, "When a college pays (by invoice, bank transfer or UPI), record it here. All its students then get Plus until the end date. The AI helper works only for students whose verified college email matches the college's domains (set in the Colleges tab)."),
    pick, dl, f.seats, f.price, h("label", {}, "Months", f.months), f.contact, f.notes,
    h("div", { class: "row" }, h("button", { class: "b sm", onclick: () => { const amt = quote(); msg.className = "msg"; msg.textContent = "Suggested: ₹" + amt.toLocaleString("en-IN") + " per year (₹60 up to 999 students, ₹45 up to 2999, ₹30 above, minimum ₹25,000)."; } }, "Suggest a price"),
      h("button", { class: "b pri", onclick: async (e) => {
        const m = /\(([a-z0-9-]+)\)\s*$/.exec(pick.value), c = all.find(r => m && r.slug === m[1]), seats = parseInt(f.seats.value, 10), price = parseFloat(f.price.value), months = parseInt(f.months.value, 10);
        if (!c || c.slug === "rgukt") { msg.className = "msg err"; msg.textContent = "Pick a college from the list (not the private RGUKT board)."; return; }
        if (!(seats >= 1) || !(price >= 0) || !(months >= 1)) { msg.className = "msg err"; msg.textContent = "Fill seats, price and months."; return; }
        e.currentTarget.disabled = true; const now = Date.now(), until = now + months * 30.5 * 864e5;
        try { const b = fs.writeBatch(db); b.set(fs.doc(db, "licenses", c.slug), { name: c.name.slice(0, 60), seats, pricePerStudent: price, amount: Math.round(seats * price), startAt: now, until: Math.round(until), contact: clean(f.contact.value, 120), notes: clean(f.notes.value, 300), updatedAt: now }); b.set(fs.doc(db, "collegePlus", c.slug), { name: c.name.slice(0, 60), until: Math.round(until), updatedAt: now }); await b.commit(); await logAction("licence", "licenses/" + c.slug, seats + " seats, " + months + " months"); msg.className = "msg ok"; msg.textContent = "Plus is now on for " + c.name + " until " + new Date(until).toLocaleDateString() + "."; load(); }
        catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
        e.currentTarget.disabled = false;
      } }, "Save and switch Plus on")), msg), box);
}

// Welcome note: one short message every student sees under the greeting (and on the opening screen from their next visit).
function welcomeView() {
  const p = roomPath(), ref = fs.doc(db, p, "welcomeMsg", "current"), msg = h("p", { class: "msg" });
  const text = h("textarea", { placeholder: "e.g. Welcome to our campus family. Study hard, be kind, and make us proud. All the best for the exams!", maxlength: "240" }), from = h("input", { placeholder: "From, e.g. Principal, Exam cell, Placement cell", maxlength: "40" }), on = h("input", { type: "checkbox", checked: true });
  fs.getDoc(ref).then(d => { if (d.exists()) { text.value = d.data().text || ""; from.value = d.data().from || ""; on.checked = d.data().active !== false; } }).catch(() => {});
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Welcome note for " + S.room.name), h("p", { class: "adm-hint" }, "A short, warm message (up to 240 characters). Students see it on the Today card and on the opening screen. Speak with respect and care; it carries your college's name."),
    text, from, h("label", { class: "check" }, on, "Show it to students"),
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const t = clean(text.value, 240); if (t.length < 3) { msg.className = "msg err"; msg.textContent = "Write the message."; return; }
      e.currentTarget.disabled = true;
      try { await fs.setDoc(ref, { text: t, from: clean(from.value, 40), active: on.checked, updatedAt: Date.now() }); await logAction("welcome-note", "welcomeMsg/current", t.slice(0, 60)); msg.className = "msg ok"; msg.textContent = "Saved. Students see it within a few minutes."; }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Save")), msg));
}

// Recent stories: everything posted in the last 48 hours, newest first, with Hide / Restore / Block device. Stories vanish for students after 24 hours anyway.
function storiesView() {
  const p = roomPath(), out = h("div", {}), msg = h("p", { class: "msg" });
  const card = (s) => {
    const left = Math.max(0, Math.round((s.createdAt + 864e5 - Date.now()) / 36e5)), box = h("div", { class: "card item" + (s.deleted ? " hidden" : "") });
    const photo = h("div", {});
    const act = async (name, data, btn) => { btn.disabled = true; try { await fs.updateDoc(fs.doc(db, p, "stories", s.id), data); Object.assign(s, data); await logAction(name, "stories/" + s.id, s.authorName || ""); box.replaceWith(card(s)); } catch (e) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (e.code || "error") + ")."; btn.disabled = false; } };
    box.append(h("div", { class: "row" }, h("span", { class: "tag" }, s.kind), h("b", {}, s.authorName || "Student"), s.deleted ? h("span", { class: "tag bad" }, "hidden") : h("span", { class: "tag ok" }, left ? left + " h left" : "expired"), (s.reports || []).length ? h("span", { class: "tag warn" }, (s.reports || []).length + " reports") : null, h("span", { class: "mono" }, ago(s.createdAt))),
      s.kind === "photo" ? h("div", { class: "row" }, h("button", { class: "b sm", onclick: async (e) => { e.currentTarget.disabled = true; try { const d = await fs.getDoc(fs.doc(db, p, "pages", s.pageId)); const src = d.exists() ? d.data().data : ""; if (/^data:image\/jpeg;base64,/.test(src)) { const im = h("img", { class: "st-thumb", alt: "Story photo", src }); photo.replaceChildren(im); } else photo.replaceChildren(h("p", { class: "adm-hint" }, "Photo not available.")); } catch (er) { photo.replaceChildren(h("p", { class: "msg err" }, "Could not load the photo.")); } } }, "Show photo")) : h("p", {}, h("b", {}, String(s.text || "").slice(0, 200))),
      photo, s.caption ? h("p", { class: "adm-hint" }, String(s.caption).slice(0, 200)) : null,
      h("div", { class: "row" }, s.deleted ? h("button", { class: "b sm ok", onclick: (e) => act("restore-story", { deleted: false }, e.currentTarget) }, "Restore") : h("button", { class: "b sm bad", onclick: (e) => act("hide-story", { deleted: true }, e.currentTarget) }, "Hide"),
        s.authorId ? h("button", { class: "b sm", onclick: async (e) => { const b = e.currentTarget; if (!confirm("Block device " + s.authorId + "?")) return; b.disabled = true; try { await fs.setDoc(fs.doc(db, p, "blocked", s.authorId), { reason: "story", by: auth.currentUser.uid, at: Date.now() }); await logAction("block-device", s.authorId, "from story " + s.id); b.textContent = "Blocked"; } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; b.disabled = false; } } }, "Block device") : null));
    return box;
  };
  const load = async (btn) => {
    if (btn) btn.disabled = true; out.replaceChildren(h("p", { class: "adm-hint" }, "Loading…"));
    try { const snap = await fs.getDocs(fs.query(fs.collection(db, p, "stories"), fs.where("createdAt", ">", Date.now() - 2 * 864e5), fs.orderBy("createdAt", "desc"), fs.limit(100)));
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      out.replaceChildren(h("p", { class: "adm-hint" }, rows.length + " stor" + (rows.length === 1 ? "y" : "ies") + " in the last 48 hours."), ...(rows.length ? rows.map(card) : [h("p", { class: "adm-hint" }, "No recent stories.")])); }
    catch (e) { out.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
    if (btn) btn.disabled = false;
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Recent stories"), h("p", { class: "adm-hint" }, "Hide a story that should not be shown (test posts, off-topic or abusive). Students stop seeing it at once. Photos load only when you tap Show photo."), h("div", { class: "row" }, h("button", { class: "b sm", onclick: (e) => load(e.currentTarget) }, "↻ Refresh"))), msg, out);
}

const EXAMS = ["Mid", "End", "Supplementary", "Model", "Other"];
function papersView() {
  const p = roomPath(), msg = h("p", { class: "msg" }), box = h("div", {});
  const f = { title: h("input", { placeholder: "Title, e.g. Data Structures End Sem 2023", maxlength: "120" }), subject: h("input", { placeholder: "Subject", maxlength: "40" }), year: h("input", { type: "number", placeholder: "Year", value: String(new Date().getFullYear()) }),
    exam: h("select", {}, ...EXAMS.map(x => h("option", { value: x }, x))), link: h("input", { placeholder: "https:// link to the paper (Google Drive, PDF...)", maxlength: "290" }), solution: h("input", { placeholder: "https:// link to the solution (optional)", maxlength: "290" }), note: h("input", { placeholder: "Note (optional)", maxlength: "200" }) };
  const load = async () => {
    try {
      const snap = await fs.getDocs(fs.query(fs.collection(db, p, "papers"), fs.limit(500)));
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.year || 0) - (a.year || 0));
      box.replaceChildren(h("h3", {}, rows.length + " paper" + (rows.length === 1 ? "" : "s")), ...rows.map(r => h("div", { class: "card" }, h("b", {}, r.title), h("p", { class: "mono" }, r.subject + " · " + r.year + " · " + r.exam),
        h("div", { class: "row" }, h("button", { class: "b sm bad", onclick: async (e) => { if (!confirm("Remove this paper?")) return; e.currentTarget.disabled = true; try { await fs.deleteDoc(fs.doc(db, p, "papers", r.id)); await logAction("delete-paper", "papers/" + r.id, r.title); load(); } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; } } }, "Remove")))));
    } catch (e) { box.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
  };
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Add a previous-year paper"), h("p", { class: "adm-hint" }, "Add only papers you may share (your college's own, or with permission). Upload the file to Google Drive (anyone with the link can view) and paste the link."),
    f.title, f.subject, h("div", { class: "cols" }, f.year, f.exam), f.link, f.solution, f.note,
    h("div", { class: "row" }, h("button", { class: "b pri", onclick: async (e) => {
      const year = parseInt(f.year.value, 10), link = f.link.value.trim(), sol = f.solution.value.trim(), ok = (u) => /^https:\/\/[^\s]{4,290}$/.test(u);
      if (clean(f.title.value, 120).length < 3 || clean(f.subject.value, 40).length < 2) { msg.className = "msg err"; msg.textContent = "Write a title and a subject."; return; }
      if (!(year >= 1990 && year <= 2100)) { msg.className = "msg err"; msg.textContent = "Enter a valid year."; return; }
      if (!ok(link) || (sol && !ok(sol))) { msg.className = "msg err"; msg.textContent = "Links must start with https://"; return; }
      e.currentTarget.disabled = true;
      try { const ref = fs.doc(fs.collection(db, p, "papers")); await fs.setDoc(ref, { title: clean(f.title.value, 120), subject: clean(f.subject.value, 40), year, exam: f.exam.value, link, solution: sol, note: clean(f.note.value, 200), createdAt: Date.now() }); await logAction("add-paper", "papers/" + ref.id, f.title.value); msg.className = "msg ok"; msg.textContent = "Added."; for (const k of ["title", "link", "solution", "note"]) f[k].value = ""; load(); }
      catch (er) { msg.className = "msg err"; msg.textContent = "Not saved (" + (er.code || "error") + "). Publish the latest rules."; }
      e.currentTarget.disabled = false;
    } }, "Add paper")), msg), box);
}

// ---------- shell ----------
const TABS = [["overview", "Overview", true], ["report", "Weekly report", true], ["mail", "Report emails", true], ["moderation", "Moderation", true], ["profreports", "Profile reports", true], ["stories", "Recent stories", true], ["blocked", "Blocked devices", true], ["licences", "College licences", false], ["staff", "College staff", false], ["sale", "Flash sale", false], ["promos", "Promo codes", false], ["events", "Events", true], ["drives", "Placement drives", true], ["welcome", "Welcome note", true], ["notices", "Notices", true], ["papers", "Papers", true], ["colleges", "Colleges", false], ["requests", "Requests and survey", false], ["log", "Log", false]];
const VIEWS = { stories: storiesView, welcome: welcomeView, events: eventsView, drives: drivesView, mail: mailView, report: reportView, staff: staffView, sale: saleView, promos: promosView, notices: noticesView, papers: papersView, overview: overviewView, moderation: moderationView, profreports: profileReportsView, blocked: blockedView, colleges: collegesView, requests: requestsView, log: logView };
function draw() {
  const u = auth.currentUser;
  const STAFF_TABS = ["stories", "welcome", "events", "drives", "report", "notices", "moderation", "profreports", "blocked", "papers"], shownTabs = S.staffOnly ? TABS.filter(t => STAFF_TABS.includes(t[0])) : TABS;
  if (S.staffOnly && !STAFF_TABS.includes(S.tab)) S.tab = "notices";
  const tabs = h("div", { class: "adm-tabs" }, ...shownTabs.map(([k, label]) => h("button", { class: S.tab === k ? "on" : "", onclick: () => { S.tab = k; draw(); } }, label)));
  const needs = TABS.find(t => t[0] === S.tab)[2];
  const pickerBox = needs ? roomPicker(() => draw()) : null;
  const body = h("div", {});
  root.replaceChildren(
    h("div", { class: "adm-head" }, h("h1", {}, S.staffOnly ? "Welcome, respected staff" : "CampusLoop admin"), h("small", {}, (S.staffOnly ? "Thank you for serving your college. " : "") + (u.email || "")), h("button", { class: "b sm", onclick: async () => { await au.signOut(auth); location.reload(); } }, "Sign out")),
    tabs, pickerBox, body);
  if (needs) { if (S.room) body.append(VIEWS[S.tab]()); else body.append(h("p", { class: "adm-hint" }, "Choose a college above first.")); }
  else body.append(VIEWS[S.tab]());
}

// ---------- start ----------
const linkNote = await finishLink();
const user = auth.currentUser;
if (!user || user.isAnonymous || !user.email) { root.replaceChildren(loginView(linkNote)); }
else {
  try {
    const adm = await fs.getDoc(fs.doc(db, "admins", user.uid));
    S.admin = adm.exists() && user.emailVerified;
    if (!adm.exists()) WHY.text = "no document admins/" + user.uid + " was found. Check the collection name is exactly admins and the document id matches the id below.";
    else if (!user.emailVerified) WHY.text = "the document exists but this email is not verified. Sign out and sign in again with the email link.";
  } catch (e) { S.admin = false; WHY.text = (e && e.code === "permission-denied") ? "Firebase blocked the read (permission-denied). The new rules are not published yet: Firestore › Rules › paste firestore.rules › Publish." : "could not check (" + ((e && e.code) || "error") + ")."; }
  if (!S.admin) {
    try { const sn = await fs.getDocs(fs.query(fs.collection(db, "staff"), fs.where("uid", "==", user.uid))); S.staff = sn.docs.map(d => d.data()); } catch (_) { S.staff = []; }
    if (S.staff.length && user.emailVerified) { S.staffOnly = true; S.tab = "notices"; draw(); } else root.replaceChildren(notAdminView());
  } else draw();
}
