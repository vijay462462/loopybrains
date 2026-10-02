// Spark Power Tools: student life tools (study planner with calendar export, tasks and habits, notes, password lab, developer toolbox).
(function () {
  "use strict";
  const { h, load, save, fmt, clean, uid, copy, download } = window.SparkUI;
  const reg = (t) => window.SparkTools.push(t);
  const card = (...kids) => h("div", { class: "lab-card" }, kids);
  const row = (...kids) => h("div", { class: "lab-row" }, kids);
  const DAY = 86400000;
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parseDay = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);
  const niceDate = (d) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  // =====================================================================
  //  1. SMART STUDY PLANNER (exam countdown, daily plan, calendar export)
  // =====================================================================
  // Each day, hours are shared between the subjects whose exams are still ahead.
  // Weight = difficulty x (6 - confidence), boosted as the exam gets closer.
  function buildPlan(exams, hoursPerDay, from) {
    const start = startOfDay(from), list = exams.filter((e) => parseDay(e.date)).map((e) => ({ ...e, d: parseDay(e.date) }));
    if (!list.length) return [];
    const last = list.reduce((m, e) => (e.d > m ? e.d : m), start), plan = [];
    for (let d = start; d < last; d = new Date(d.getTime() + DAY)) {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const active = list.filter((e) => e.d > day);
      if (!active.length) continue;
      const ws = active.map((e) => e.diff * (6 - e.conf) * (1 + 6 / Math.max(1, daysBetween(day, e.d))));
      const sum = ws.reduce((a, b) => a + b, 0);
      let hrs = ws.map((w) => Math.round(((hoursPerDay * w) / sum) * 2) / 2), diff = hoursPerDay - hrs.reduce((a, b) => a + b, 0);
      const top = ws.indexOf(Math.max(...ws)); hrs[top] = Math.max(0, hrs[top] + diff);
      plan.push({ date: day, items: active.map((e, i) => ({ name: e.name, hours: hrs[i], left: daysBetween(day, e.d) })).filter((x) => x.hours > 0).sort((a, b) => b.hours - a.hours) });
    }
    return plan;
  }
  function icsEscape(t) { return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function makeIcs(exams, plan) {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, ""), L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RGUKT Spark//Study Planner//EN", "CALSCALE:GREGORIAN"];
    const dt = (d) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    const ev = (key, d, title, desc) => { const e = new Date(d.getTime() + DAY); L.push("BEGIN:VEVENT", "UID:" + key + "@rgukt-spark", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + dt(d), "DTEND;VALUE=DATE:" + dt(e), "SUMMARY:" + icsEscape(title), desc ? "DESCRIPTION:" + icsEscape(desc) : "", "END:VEVENT"); };
    exams.forEach((e) => { const d = parseDay(e.date); if (d) ev("exam-" + e.id, d, "📝 Exam: " + e.name, "Difficulty " + e.diff + "/5, confidence " + e.conf + "/5"); });
    plan.forEach((p) => ev("study-" + ymd(p.date), p.date, "📚 Study: " + p.items.map((i) => i.name + " " + i.hours + "h").join(", "), "Planned with RGUKT Spark Study Planner"));
    L.push("END:VCALENDAR"); return L.filter(Boolean).join("\r\n");
  }
  function plannerTool() {
    const st = load("planner", { hours: 4, exams: [] });
    const wrap = h("div", { class: "lab-card" });
    const draw = () => {
      save("planner", st);
      const nameIn = h("input", { type: "text", maxlength: "40", placeholder: "Subject, e.g. DSP", "aria-label": "Subject" });
      const dateIn = h("input", { type: "date", "aria-label": "Exam date", value: ymd(new Date(Date.now() + 14 * DAY)) });
      const diffIn = h("select", { "aria-label": "Difficulty" }, [1, 2, 3, 4, 5].map((n) => h("option", { value: n, selected: n === 3 }, "Difficulty " + n)));
      const confIn = h("select", { "aria-label": "Confidence" }, [1, 2, 3, 4, 5].map((n) => h("option", { value: n, selected: n === 3 }, "Confidence " + n)));
      const hoursIn = h("input", { type: "number", min: "1", max: "16", step: "0.5", value: String(st.hours), "aria-label": "Study hours per day", oninput: (e) => { st.hours = Math.min(16, Math.max(1, +e.target.value || 4)); save("planner", st); renderPlan(); } });
      const add = () => { const n = clean(nameIn.value); if (!n || !parseDay(dateIn.value)) return; st.exams.push({ id: uid(), name: n.slice(0, 40), date: dateIn.value, diff: +diffIn.value, conf: +confIn.value }); st.exams.sort((a, b) => (a.date < b.date ? -1 : 1)); draw(); };
      const planBox = h("div", {}), examBox = h("div", {});
      const renderPlan = () => {
        const today = startOfDay(new Date()), plan = buildPlan(st.exams, st.hours, today);
        examBox.replaceChildren(...st.exams.map((e) => { const left = daysBetween(today, parseDay(e.date)); return h("div", { class: "tl-trow" }, h("span", {}, e.name + " · " + e.date), h("strong", {}, left < 0 ? "done" : left === 0 ? "TODAY" : left + (left === 1 ? " day" : " days")), h("button", { type: "button", class: "lab-x", "aria-label": "Remove " + e.name, onclick: () => { st.exams = st.exams.filter((x) => x.id !== e.id); draw(); } }, "✕")); }));
        if (!plan.length) { planBox.replaceChildren(h("p", { class: "lab-hint" }, st.exams.length ? "All exams are in the past. Add upcoming exams." : "Add your exams above to get a daily study plan.")); return; }
        const todayPlan = plan.find((p) => ymd(p.date) === ymd(today));
        planBox.replaceChildren(h("strong", {}, "🎯 Today"), todayPlan ? h("div", { class: "lab-result" }, ...todayPlan.items.map((i) => h("div", { class: "tl-trow" }, h("span", {}, i.name + " (exam in " + i.left + "d)"), h("strong", {}, i.hours + " h")))) : h("p", { class: "lab-hint" }, "Nothing planned for today."),
          h("details", { class: "lab-det" }, h("summary", {}, "📅 Full plan (" + plan.length + " days)"), ...plan.slice(0, 60).map((p) => h("div", { class: "tl-trow" }, h("span", {}, niceDate(p.date)), h("strong", {}, p.items.map((i) => i.name + " " + i.hours + "h").join(" · "))))),
          row(h("button", { type: "button", class: "btn sm primary", onclick: () => download("study-plan.ics", makeIcs(st.exams, plan), "text/calendar") }, "📆 Add to calendar (.ics)"),
            h("button", { type: "button", class: "btn sm", onclick: (e) => copy(plan.map((p) => niceDate(p.date) + ": " + p.items.map((i) => i.name + " " + i.hours + "h").join(", ")).join("\n"), e.currentTarget) }, "Copy plan")));
      };
      wrap.replaceChildren(h("strong", {}, "🗓️ Smart study planner"), h("p", { class: "lab-hint" }, "Add each exam with its date, how hard it is and how confident you feel. The planner shares your daily study hours, giving more time to hard subjects and closer exams."),
        row(nameIn, dateIn), row(diffIn, confIn, h("button", { type: "button", class: "btn sm primary", onclick: add }, "＋ Add exam")), row(h("label", {}, "Study hours per day", hoursIn)), examBox, planBox);
      renderPlan();
    };
    draw();
    return wrap;
  }
  reg({ id: "planner", icon: "🗓️", name: "Study planner", desc: "Exam countdown, daily plan, .ics", mount: plannerTool });

  // =====================================================================
  //  2. TASKS (Kanban) and HABITS
  // =====================================================================
  function tasksTool() {
    const st = load("tasks", { tasks: [], habits: [{ id: "h1", name: "Study 2 hours", days: {} }, { id: "h2", name: "Exercise", days: {} }] });
    const wrap = h("div", { class: "lab-card" }), COLS = ["To do", "Doing", "Done"], PRI = ["🔴 High", "🟡 Medium", "🟢 Low"];
    const draw = () => {
      save("tasks", st);
      const text = h("input", { type: "text", maxlength: "100", placeholder: "New task…", "aria-label": "Task" }), pri = h("select", { "aria-label": "Priority" }, PRI.map((p, i) => h("option", { value: i, selected: i === 1 }, p))), due = h("input", { type: "date", "aria-label": "Due date" });
      const add = () => { const t = clean(text.value); if (!t) return; st.tasks.unshift({ id: uid(), text: t.slice(0, 100), col: 0, pri: +pri.value, due: due.value || "" }); draw(); };
      const today = ymd(new Date());
      const colEl = (ci) => h("div", { class: "tl-col" }, h("strong", {}, COLS[ci] + " (" + st.tasks.filter((t) => t.col === ci).length + ")"),
        ...st.tasks.filter((t) => t.col === ci).sort((a, b) => a.pri - b.pri || (a.due || "9") .localeCompare(b.due || "9")).map((t) => h("div", { class: "tl-task" + (t.due && t.due < today && ci < 2 ? " late" : "") },
          h("span", {}, PRI[t.pri].slice(0, 2) + " " + t.text), t.due ? h("small", {}, (t.due < today && ci < 2 ? "⚠️ overdue " : "📅 ") + t.due) : null,
          h("div", { class: "lab-row" }, ci > 0 ? h("button", { type: "button", class: "lab-chip", "aria-label": "Move left", onclick: () => { t.col--; draw(); } }, "←") : null, ci < 2 ? h("button", { type: "button", class: "lab-chip", "aria-label": "Move right", onclick: () => { t.col++; draw(); } }, "→") : null,
            h("button", { type: "button", class: "lab-x", "aria-label": "Delete task", onclick: () => { st.tasks = st.tasks.filter((x) => x.id !== t.id); draw(); } }, "✕")))));
      // habits: last 14 days
      const days = Array.from({ length: 14 }, (_, i) => ymd(new Date(Date.now() - (13 - i) * DAY)));
      const streak = (hb) => { let n = 0; const d = new Date(); if (!hb.days[ymd(d)]) d.setDate(d.getDate() - 1); while (hb.days[ymd(d)]) { n++; d.setDate(d.getDate() - 1); } return n; };
      const hname = h("input", { type: "text", maxlength: "40", placeholder: "New habit, e.g. Read 20 pages", "aria-label": "Habit" });
      wrap.replaceChildren(h("strong", {}, "✅ Tasks board"), row(text, pri, due, h("button", { type: "button", class: "btn sm primary", onclick: add }, "＋ Add")),
        h("div", { class: "tl-board" }, [0, 1, 2].map(colEl)),
        st.tasks.some((t) => t.col === 2) ? h("button", { type: "button", class: "btn sm", onclick: () => { st.tasks = st.tasks.filter((t) => t.col !== 2); draw(); } }, "Clear done tasks") : null,
        h("strong", {}, "🔥 Habit tracker (last 14 days)"),
        ...st.habits.map((hb) => h("div", { class: "tl-habit" }, h("div", { class: "lab-row" }, h("strong", {}, hb.name), h("small", {}, "🔥 " + streak(hb) + "-day streak · " + Object.keys(hb.days).length + " total"), h("button", { type: "button", class: "lab-x", "aria-label": "Delete habit", onclick: () => { st.habits = st.habits.filter((x) => x.id !== hb.id); draw(); } }, "✕")),
          h("div", { class: "tl-dots" }, days.map((d) => h("button", { type: "button", class: "tl-dot" + (hb.days[d] ? " on" : "") + (d === today ? " today" : ""), "aria-label": hb.name + " " + d, title: d, onclick: () => { if (hb.days[d]) delete hb.days[d]; else hb.days[d] = 1; draw(); } }, d.slice(8)))))),
        row(hname, h("button", { type: "button", class: "btn sm", onclick: () => { const n = clean(hname.value); if (n) { st.habits.push({ id: uid(), name: n.slice(0, 40), days: {} }); draw(); } } }, "＋ Add habit")));
    };
    draw();
    return wrap;
  }
  reg({ id: "tasks", icon: "✅", name: "Tasks and habits", desc: "Kanban board, streak tracker", mount: tasksTool });

  // =====================================================================
  //  3. NOTES
  // =====================================================================
  const CORNELL = "Topic: \nDate: \n\nCUES / QUESTIONS\n- \n\nNOTES\n- \n\nSUMMARY\n";
  function notesTool() {
    const st = load("notes", { notes: [], sel: "" });
    const wrap = h("div", { class: "lab-card" });
    let q = "";
    const draw = () => {
      save("notes", st);
      const cur = st.notes.find((n) => n.id === st.sel);
      const search = h("input", { type: "search", placeholder: "Search notes or #tags…", value: q, "aria-label": "Search notes", oninput: (e) => { q = e.target.value; list.replaceChildren(...rows()); } });
      const rows = () => st.notes.filter((n) => !q || (n.title + " " + n.body).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.at - a.at)
        .map((n) => h("button", { type: "button", class: "campus-link" + (n.id === st.sel ? " sel" : ""), onclick: () => { st.sel = n.id; draw(); } }, h("strong", {}, (n.pin ? "📌 " : "") + (n.title || "Untitled")), h("small", {}, new Date(n.at).toLocaleDateString() + " · " + (n.body.trim().split(/\s+/).filter(Boolean).length) + " words")));
      const list = h("div", { class: "lab-body" }, ...rows());
      let editor = null;
      if (cur) {
        const title = h("input", { type: "text", maxlength: "80", value: cur.title, placeholder: "Title", "aria-label": "Note title", oninput: (e) => { cur.title = clean(e.target.value); cur.at = Date.now(); save("notes", st); } });
        const body = h("textarea", { rows: "10", maxlength: "20000", placeholder: "Write your notes. Use #tags to find them later.", "aria-label": "Note text", oninput: (e) => { cur.body = e.target.value.replace(/\u0000/g, ""); cur.at = Date.now(); save("notes", st); wc.textContent = cur.body.trim().split(/\s+/).filter(Boolean).length + " words · " + cur.body.length + " characters"; } }, cur.body);
        const wc = h("small", { class: "lab-hint" }, cur.body.trim().split(/\s+/).filter(Boolean).length + " words · " + cur.body.length + " characters");
        editor = h("div", {}, title, body, wc, row(h("button", { type: "button", class: "btn sm", onclick: () => { cur.pin = !cur.pin; draw(); } }, cur.pin ? "Unpin" : "📌 Pin"), h("button", { type: "button", class: "btn sm", onclick: () => { cur.body = (cur.body ? cur.body + "\n\n" : "") + CORNELL; draw(); } }, "＋ Cornell template"),
          h("button", { type: "button", class: "btn sm", onclick: (e) => copy(cur.title + "\n\n" + cur.body, e.currentTarget) }, "Copy"), h("button", { type: "button", class: "btn sm", onclick: () => download((cur.title || "note").replace(/[^\w-]+/g, "_") + ".txt", cur.title + "\n\n" + cur.body) }, "⬇ Save .txt"),
          h("button", { type: "button", class: "btn sm", onclick: () => { if (confirm("Delete this note?")) { st.notes = st.notes.filter((n) => n.id !== cur.id); st.sel = ""; draw(); } } }, "🗑 Delete")));
      }
      wrap.replaceChildren(h("strong", {}, "📝 Notes"), row(h("button", { type: "button", class: "btn sm primary", onclick: () => { const n = { id: uid(), title: "", body: "", at: Date.now(), pin: false }; st.notes.unshift(n); st.sel = n.id; draw(); } }, "＋ New note"),
        st.notes.length ? h("button", { type: "button", class: "btn sm", onclick: () => download("my-notes.txt", st.notes.map((n) => "# " + (n.title || "Untitled") + "\n" + n.body).join("\n\n----------\n\n")) }, "⬇ Export all") : null),
        st.notes.length ? search : null, st.notes.length ? list : h("p", { class: "lab-hint" }, "No notes yet. Tap New note. Everything stays on this phone."), editor);
    };
    draw();
    return wrap;
  }
  reg({ id: "notes", icon: "📝", name: "Notes", desc: "Private notes, search, export", mount: notesTool });

  // =====================================================================
  //  4. PASSWORD LAB
  // =====================================================================
  const WORDS = "able acid aged also area army away baby back ball band bank base bath bear beat bell belt bike bird blue boat body bold bone book boot born boss both bowl brave bread brick bridge brown build burn cake calm camp care cart case cash cave chair chart chip city clay clean clear clock cloud coat code coin cold color cook cool copy corn cost craft crew crop crowd cube cup dark data dawn deal deep deer desk dish dive door down draw dream drive drop drum duck dust each earth east easy edge empty even exit face fact fair farm fast fear feel field fire fish flag flat float floor flow fly fold food foot forest fork form fox free fresh frog fruit full fun game gate gift glad glass glow goal gold good grain grass great green grid grow gym hair half hand happy hard hawk heart heat help high hill hold home hope horse hour house idea iron island jade jazz jump keen key kind king kite lake lamp land late leaf learn lemon level light lime line lion list lock long loop lucky lunch magic main maple march mask math meal melon metal mind mint moon moss move music nest net night noble north note ocean olive open orbit paint paper park path peace pearl pen pilot pine plan plant plum point pond power pride prime puzzle quick quiet rabbit rain range rapid river road robot rock roof root rose round royal ruby safe sail salt sand scale sea seed shade shine ship shoe silk silver sing sky slow small smart smile snow solar song sound south space spark spoon spring star steam steel stone storm story sugar summer sun swan sweet swift table tea tiger time toast tool tower trail tree true tulip turn twin unit up valley vast video violet vivid voice wagon walk warm water wave west wheat wheel whale wild wind wing winter wise wolf wood world yard year young zebra zero zone".split(" ");
  const rnd = (n) => { const a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return x % n; };
  function strengthOf(pw) {
    if (!pw) return { score: 0, label: "", bits: 0, tips: [] };
    let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
    let bits = pw.length * Math.log2(Math.max(2, pool)); const tips = [];
    if (/^(.)\1+$/.test(pw) || /(.)\1{2,}/.test(pw)) { bits -= 10; tips.push("Avoid repeated characters."); }
    if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv)/i.test(pw)) { bits -= 14; tips.push("Avoid keyboard or number sequences."); }
    if (/(password|admin|welcome|letmein|iloveyou|qwerty|rgukt|123456|india|cricket)/i.test(pw)) { bits -= 25; tips.push("Common words and names are guessed first."); }
    if (/^\d+$/.test(pw)) { bits -= 6; tips.push("Do not use only digits."); }
    if (pw.length < 12) tips.push("Use at least 12 characters.");
    if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/\d/.test(pw)) tips.push("Mix upper case, lower case and numbers.");
    bits = Math.max(0, Math.round(bits)); const score = bits < 28 ? 1 : bits < 40 ? 2 : bits < 60 ? 3 : bits < 80 ? 4 : 5;
    return { score, label: ["", "Very weak", "Weak", "Fair", "Strong", "Excellent"][score], bits, tips };
  }
  function passwordTool() {
    const st = load("pw", { len: 16, up: true, low: true, num: true, sym: true, noamb: true, words: 4 });
    const out = h("div", { class: "tl-pw" }), meter = h("div", { class: "lab-track" }, h("span", { class: "lab-fill" })), info = h("p", { class: "lab-hint" });
    const gen = () => {
      let set = ""; const U = "ABCDEFGHJKLMNPQRSTUVWXYZ", L = "abcdefghijkmnopqrstuvwxyz", N = "23456789", S = "!@#$%^&*()-_=+[]{};:,.?";
      const amb = (s) => (st.noamb ? s : s + "IOlo01");
      const groups = [st.up && amb(U), st.low && amb(L), st.num && amb(N), st.sym && S].filter(Boolean);
      if (!groups.length) { out.textContent = "Choose at least one type"; return; }
      set = groups.join(""); const chars = groups.map((g) => g[rnd(g.length)]);
      while (chars.length < st.len) chars.push(set[rnd(set.length)]);
      for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
      show(chars.slice(0, st.len).join(""));
    };
    const phrase = () => show(Array.from({ length: st.words }, () => WORDS[rnd(WORDS.length)]).join("-") + "-" + rnd(100));
    const show = (pw) => { out.textContent = pw; const s = strengthOf(pw); meter.firstChild.style.width = s.score * 20 + "%"; meter.firstChild.style.background = ["#999", "#dc2626", "#f97316", "#eab308", "#22c55e", "#16a34a"][s.score]; info.textContent = s.label + " · about " + s.bits + " bits of strength (generated with your device's secure random generator)"; };
    const chk = (k, l) => h("label", { class: "check" }, h("input", { type: "checkbox", checked: st[k], onchange: (e) => { st[k] = e.target.checked; save("pw", st); gen(); } }), l);
    const len = h("input", { type: "range", min: "8", max: "64", value: String(st.len), "aria-label": "Length", oninput: (e) => { st.len = +e.target.value; lv.textContent = st.len; save("pw", st); gen(); } }), lv = h("strong", {}, String(st.len));
    const test = h("input", { type: "text", placeholder: "Type a password to check it", "aria-label": "Password to check", autocomplete: "off", spellcheck: "false" }), res = h("div", { class: "lab-result" });
    test.addEventListener("input", () => { const s = strengthOf(test.value); res.replaceChildren(test.value ? h("strong", {}, s.label + " · ~" + s.bits + " bits") : h("small", {}, "Checked only on this phone. Nothing is sent anywhere."), ...s.tips.map((t) => h("small", {}, "• " + t))); });
    gen();
    return card(h("strong", {}, "🔐 Password lab"), out, meter, info, row(h("button", { type: "button", class: "btn primary", onclick: gen }, "🔄 New password"), h("button", { type: "button", class: "btn", onclick: phrase }, "💬 Passphrase"), h("button", { type: "button", class: "btn", onclick: (e) => copy(out.textContent, e.currentTarget) }, "Copy")),
      row(h("label", {}, "Length ", lv, len)), row(chk("up", "ABC"), chk("low", "abc"), chk("num", "123"), chk("sym", "#$%"), chk("noamb", "No look-alikes (0 O l 1)")),
      h("strong", {}, "🔎 Strength checker"), test, res, h("p", { class: "lab-hint" }, "Use a different strong password for every important account, turn on 2-step verification, and never share an OTP."));
  }
  reg({ id: "pw", icon: "🔐", name: "Password lab", desc: "Secure generator, strength check", mount: passwordTool });

  // =====================================================================
  //  5. DEVELOPER TOOLBOX
  // =====================================================================
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  function devTool() {
    const tabs = [["json", "JSON"], ["b64", "Base64 / URL"], ["hash", "Hash"], ["regex", "Regex"], ["time", "Time / UUID"]];
    let view = load("dev-view", "json"); const body = h("div", {}), bar = h("div", { class: "lab-row" });
    const ta = (ph, rows, val) => h("textarea", { rows: String(rows || 5), placeholder: ph, spellcheck: "false", "aria-label": ph }, val || "");
    function json() {
      const inp = ta("Paste JSON here", 6, load("dev-json", '{"name":"Spark","tags":["a","b"],"n":1}')), out = h("pre", { class: "tl-pre" }), msg = h("p", { class: "lab-hint" });
      const go = (indent) => { save("dev-json", inp.value); try { const o = JSON.parse(inp.value); out.textContent = JSON.stringify(o, null, indent); msg.textContent = "✅ Valid JSON"; } catch (e) { out.textContent = ""; msg.textContent = "❌ " + e.message; } };
      inp.addEventListener("input", () => go(2)); go(2);
      return card(inp, row(h("button", { type: "button", class: "btn sm", onclick: () => go(2) }, "Format"), h("button", { type: "button", class: "btn sm", onclick: () => go(0) }, "Minify"), h("button", { type: "button", class: "btn sm", onclick: (e) => copy(out.textContent, e.currentTarget) }, "Copy")), msg, out);
    }
    function b64() {
      const inp = ta("Text to convert", 4, "Hello Spark ✨"), out = h("pre", { class: "tl-pre" });
      const run = (k) => { try { const v = inp.value; out.textContent = k === "enc" ? btoa(String.fromCharCode(...new TextEncoder().encode(v))) : k === "dec" ? new TextDecoder().decode(Uint8Array.from(atob(v.trim()), (c) => c.charCodeAt(0))) : k === "uenc" ? encodeURIComponent(v) : decodeURIComponent(v); } catch (e) { out.textContent = "Could not convert: " + e.message; } };
      return card(inp, row(h("button", { type: "button", class: "btn sm", onclick: () => run("enc") }, "Base64 encode"), h("button", { type: "button", class: "btn sm", onclick: () => run("dec") }, "Base64 decode"), h("button", { type: "button", class: "btn sm", onclick: () => run("uenc") }, "URL encode"), h("button", { type: "button", class: "btn sm", onclick: () => run("udec") }, "URL decode")), out, h("button", { type: "button", class: "btn sm", onclick: (e) => copy(out.textContent, e.currentTarget) }, "Copy result"));
    }
    function hash() {
      const inp = ta("Text to hash", 3, "hello"), out = h("div", { class: "lab-result" });
      const run = async () => { const data = new TextEncoder().encode(inp.value); const rows = []; for (const a of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]) rows.push(h("div", { class: "tl-trow" }, h("span", {}, a), h("strong", { class: "tl-hash" }, hex(await crypto.subtle.digest(a, data))))); out.replaceChildren(...rows); };
      inp.addEventListener("input", run); run();
      return card(inp, out, h("p", { class: "lab-hint" }, "Computed on your phone with the browser's crypto engine. Hashes cannot be reversed."));
    }
    function regex() {
      const pat = h("input", { type: "text", value: load("dev-re", "(\\w+)@(\\w+)\\.com"), placeholder: "Pattern, e.g. \\d+", "aria-label": "Regex pattern", spellcheck: "false", autocomplete: "off" }), flags = h("input", { type: "text", value: "g", maxlength: "5", style: "width:70px", "aria-label": "Flags" });
      const txt = ta("Test text", 5, "mail ravi@rgukt.com and sita@spark.com now"), out = h("div", { class: "lab-result" });
      const run = () => { save("dev-re", pat.value); try { const re = new RegExp(pat.value, flags.value.replace(/[^gimsuy]/g, "")), ms = []; let m; const g = re.global; while ((m = re.exec(txt.value)) !== null) { ms.push(m); if (!g || m[0] === "") { if (m[0] === "") re.lastIndex++; if (!g) break; } if (ms.length > 200) break; }
        out.replaceChildren(h("strong", {}, ms.length + " match" + (ms.length === 1 ? "" : "es")), ...ms.slice(0, 40).map((x) => h("div", { class: "tl-trow" }, h("strong", {}, JSON.stringify(x[0])), h("span", {}, "at " + x.index + (x.length > 1 ? " · groups: " + x.slice(1).map((v) => JSON.stringify(v)).join(", ") : ""))))); } catch (e) { out.replaceChildren(h("small", {}, "❌ " + e.message)); } };
      [pat, flags, txt].forEach((e) => e.addEventListener("input", run)); run();
      return card(row(pat, flags), txt, out);
    }
    function time() {
      const ts = h("input", { type: "text", value: String(Math.floor(Date.now() / 1000)), "aria-label": "Unix timestamp" }), dt = h("input", { type: "datetime-local", "aria-label": "Date and time" }), out = h("div", { class: "lab-result" }), uuidOut = h("code", { class: "devid" });
      const fromTs = () => { let n = Number(ts.value); if (!Number.isFinite(n)) { out.replaceChildren(h("small", {}, "Enter a number")); return; } if (n < 1e11) n *= 1000; const d = new Date(n); out.replaceChildren(h("div", { class: "tl-trow" }, h("span", {}, "Local"), h("strong", {}, d.toString().slice(0, 33))), h("div", { class: "tl-trow" }, h("span", {}, "UTC"), h("strong", {}, d.toISOString())), h("div", { class: "tl-trow" }, h("span", {}, "Seconds / ms"), h("strong", {}, Math.floor(n / 1000) + " / " + n))); };
      const fromDt = () => { if (dt.value) { ts.value = String(Math.floor(new Date(dt.value).getTime() / 1000)); fromTs(); } };
      ts.addEventListener("input", fromTs); dt.addEventListener("input", fromDt); fromTs(); const newUuid = () => { uuidOut.textContent = crypto.randomUUID ? crypto.randomUUID() : "not supported"; }; newUuid();
      return card(h("label", {}, "Unix timestamp", ts), h("label", {}, "or pick a date", dt), out, h("strong", {}, "UUID v4"), row(uuidOut, h("button", { type: "button", class: "btn sm", onclick: newUuid }, "New"), h("button", { type: "button", class: "btn sm", onclick: (e) => copy(uuidOut.textContent, e.currentTarget) }, "Copy")));
    }
    const draw = () => { save("dev-view", view); bar.replaceChildren(...tabs.map(([id, l]) => h("button", { type: "button", class: "btn sm" + (view === id ? " primary" : ""), onclick: () => { view = id; draw(); } }, l))); body.replaceChildren(view === "json" ? json() : view === "b64" ? b64() : view === "hash" ? hash() : view === "regex" ? regex() : time()); };
    draw();
    return h("div", {}, bar, body);
  }
  reg({ id: "dev", icon: "💻", name: "Dev toolbox", desc: "JSON, hash, regex, Base64", mount: devTool });

  window.SparkTools._life = { buildPlan, makeIcs, strengthOf };
})();
