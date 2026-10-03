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

const S = { tab: "overview", admin: false, room: null, msg: "" };

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
function notAdminView() {
  const u = auth.currentUser, id = u.uid;
  return h("div", { class: "card" }, h("h2", {}, "You are signed in, but not an admin yet"),
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
const reasons = (reports) => { const r = { o: 0, a: 0, s: 0, other: 0 }; for (const x of reports || []) { const t = String(x).split("|")[1]; if (t === "o" || t === "a" || t === "s") r[t]++; else r.other++; } return r; };

// ---------- room picker ----------
function roomPicker(onPick) {
  const input = h("input", { list: "adm-rooms", placeholder: "Type a college name…", "aria-label": "College" }), dl = h("datalist", { id: "adm-rooms" }), msg = h("p", { class: "msg" });
  let all = [];
  loadColleges().then(rows => { all = rows; dl.replaceChildren(...rows.map(r => h("option", { value: r.name + " (" + r.slug + ")" }))); if (S.room) input.value = S.room.name + " (" + S.room.slug + ")"; }).catch(() => { msg.textContent = "Could not load the college list."; });
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
      h("p", { class: "mono" }, "by " + who + " · device " + (d.authorId || "?") + (total ? " · off-topic " + r.o + ", abuse " + r.a + ", spam " + r.s + (r.other ? ", other " + r.other : "") : "")),
      h("div", { class: "row" },
        hidden ? h("button", { class: "b sm ok", onclick: (e) => act("restore", { deleted: false }, "restored", e.currentTarget) }, "Restore") : h("button", { class: "b sm bad", onclick: (e) => act("hide", { deleted: true }, "hidden", e.currentTarget) }, "Hide"),
        total ? h("button", { class: "b sm", onclick: (e) => act("clear-reports", { reports: [] }, "reports cleared", e.currentTarget) }, "Clear reports") : null,
        d.authorId ? h("button", { class: "b sm", onclick: async (e) => { const b = e.currentTarget; if (!confirm("Block device " + d.authorId + "? It will not be able to post or reply.")) return; b.disabled = true; try { await fs.setDoc(fs.doc(db, p, "blocked", d.authorId), { reason: "moderation", by: auth.currentUser.uid, at: Date.now() }); await logAction("block-device", d.authorId, "from " + coll + "/" + item.id); b.textContent = "Blocked"; } catch (er) { msg.className = "msg err"; msg.textContent = "Not allowed (" + (er.code || "error") + ")."; b.disabled = false; } } }, "Block device") : null));
    return box;
  };
  const load = async (btn) => {
    out.replaceChildren(h("p", { class: "adm-hint" }, "Loading…")); if (btn) btn.disabled = true;
    try {
      const rows = [];
      for (const [c, label] of COLLS) {
        const snap = await fs.getDocs(fs.query(fs.collection(db, p, c), fs.orderBy("createdAt", "desc"), fs.limit(300)));
        for (const s of snap.docs) { const d = s.data(); if ((d.reports || []).length || d.deleted) rows.push({ coll: c, label, item: { id: s.id, data: d } }); }
      }
      rows.sort((a, b) => ((b.item.data.reports || []).length - (a.item.data.reports || []).length) || ((b.item.data.createdAt || 0) - (a.item.data.createdAt || 0)));
      out.replaceChildren(...(rows.length ? rows.slice(0, 80).map(r => card(r.coll, r.label, r.item)) : [h("p", { class: "adm-hint" }, "Nothing reported or hidden in the latest posts. 🎉")]));
    } catch (e) { out.replaceChildren(h("p", { class: "msg err" }, "Could not load (" + (e.code || "error") + ").")); }
    if (btn) btn.disabled = false;
  };
  const refresh = h("button", { class: "b sm", onclick: (e) => load(e.currentTarget) }, "↻ Refresh");
  load();
  return h("div", {}, h("div", { class: "card" }, h("h3", {}, "Reported and hidden items"), h("p", { class: "adm-hint" }, "Latest 300 of each kind, most reported first. Hide removes it for students; Restore brings it back. Nothing is ever deleted for good."), h("div", { class: "row" }, refresh)), msg, out);
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
      requireVerified: h("input", { type: "checkbox", checked: d.requireVerified === true }), listed: h("input", { type: "checkbox", checked: d.listed !== false }), enabled: h("input", { type: "checkbox", checked: d.enabled !== false }),
    };
    const feat = FEATURES.map(([k, label, def]) => ({ k, label, box: h("input", { type: "checkbox", checked: d.features && typeof d.features[k] === "boolean" ? d.features[k] : def }) }));
    const L = (t, el) => h("label", {}, t, el), C = (t, el) => h("label", { class: "check" }, el, t);
    form.replaceChildren(h("div", { class: "card" }, h("h3", {}, c.slug && c.slug !== "(new)" ? "Edit " + c.name : "New college"),
      isDir ? h("p", { class: "adm-hint" }, "This college is in the built-in directory. Saving customises it; its room stays college-" + c.slug + ".") : null,
      h("div", { class: "cols" }, L("Link name", f.slug), L("Name", f.name), L("Header title", f.title), L("Tagline", f.tagline), L("State", f.state), L("City", f.city)),
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
          domains: list(f.domains.value.toLowerCase(), 60, 8), accent: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "",
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

// ---------- shell ----------
const TABS = [["overview", "Overview", true], ["moderation", "Moderation", true], ["blocked", "Blocked devices", true], ["colleges", "Colleges", false], ["requests", "Requests and survey", false], ["log", "Log", false]];
const VIEWS = { overview: overviewView, moderation: moderationView, blocked: blockedView, colleges: collegesView, requests: requestsView, log: logView };
function draw() {
  const u = auth.currentUser;
  const tabs = h("div", { class: "adm-tabs" }, ...TABS.map(([k, label]) => h("button", { class: S.tab === k ? "on" : "", onclick: () => { S.tab = k; draw(); } }, label)));
  const needs = TABS.find(t => t[0] === S.tab)[2];
  const pickerBox = needs ? roomPicker(() => draw()) : null;
  const body = h("div", {});
  root.replaceChildren(
    h("div", { class: "adm-head" }, h("h1", {}, "CampusLoop admin"), h("small", {}, u.email || ""), h("button", { class: "b sm", onclick: async () => { await au.signOut(auth); location.reload(); } }, "Sign out")),
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
  } catch (_) { S.admin = false; }
  if (!S.admin) root.replaceChildren(notAdminView());
  else draw();
}
