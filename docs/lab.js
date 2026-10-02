// Spark Study Lab: focus timer with ambient sounds, spaced-repetition flashcards, CGPA and attendance calculators.
// Everything is stored on the device (localStorage). No account, no network.
(function () {
  "use strict";

  const h = (tag, props, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "string") { for (const d of v.split(";")) { const i = d.indexOf(":"); if (i > 0) n.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); } }
      else if (k === "value") n.value = v;
      else if (k === "checked") n.checked = !!v;
      else if (k === "disabled") n.disabled = !!v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : String(c));
    return n;
  };
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem("lab-" + k)); return v == null ? d : v; } catch (_) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("lab-" + k, JSON.stringify(v)); } catch (_) {} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const dayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const clean = (s) => String(s || "").normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​‎‏‪-‮⁠-⁤⁦-⁩﻿]/g, "").trim();
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  // =====================================================================
  //  FOCUS TIMER (keeps running while you browse other screens)
  // =====================================================================
  const F = Object.assign({ focusMin: 25, breakMin: 5, longMin: 15, goal: 120 }, load("focus", {}));
  const FS = { mode: "focus", running: false, endsAt: 0, remaining: F.focusMin * 60, cycle: 0, tick: null, baseTitle: "" };
  let focusUi = null;
  const log = () => load("focus-log", {});
  const addMinutes = (m) => { const l = log(); const k = dayKey(); l[k] = (l[k] || 0) + m; save("focus-log", l); };
  const minutesToday = () => log()[dayKey()] || 0;
  function streak() {
    const l = log(); let n = 0; const d = new Date();
    if (!(l[dayKey(d)] > 0)) d.setDate(d.getDate() - 1);
    while (l[dayKey(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const modeSeconds = () => (FS.mode === "focus" ? F.focusMin : FS.mode === "long" ? F.longMin : F.breakMin) * 60;
  const modeLabel = () => (FS.mode === "focus" ? "🍅 Focus" : FS.mode === "long" ? "🌴 Long break" : "☕ Break");

  let beepCtx = null;
  function beep() {
    try {
      beepCtx = beepCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = beepCtx.currentTime;
      [880, 1175, 1568].forEach((f, i) => {
        const o = beepCtx.createOscillator(), g = beepCtx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.22); g.gain.exponentialRampToValueAtTime(0.3, t + i * 0.22 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.4);
        o.connect(g); g.connect(beepCtx.destination); o.start(t + i * 0.22); o.stop(t + i * 0.22 + 0.45);
      });
    } catch (_) {}
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (_) {}
  }
  function setTitle() {
    if (!FS.baseTitle) FS.baseTitle = document.title;
    document.title = FS.running ? "⏱ " + mmss(FS.remaining) + " · " + modeLabel().replace(/^\S+\s/, "") : FS.baseTitle;
  }
  function fTick() {
    FS.remaining = Math.max(0, Math.round((FS.endsAt - Date.now()) / 1000));
    setTitle(); drawFocus();
    if (FS.remaining <= 0) fDone();
  }
  function fStart() {
    if (FS.running) return;
    if (!FS.baseTitle) FS.baseTitle = document.title;
    try { if (window.Notification && Notification.permission === "default") Notification.requestPermission(); } catch (_) {}
    FS.running = true; FS.endsAt = Date.now() + FS.remaining * 1000;
    clearInterval(FS.tick); FS.tick = setInterval(fTick, 500); drawFocus();
  }
  function fPause() { if (!FS.running) return; clearInterval(FS.tick); FS.running = false; FS.remaining = Math.max(0, Math.round((FS.endsAt - Date.now()) / 1000)); setTitle(); drawFocus(); }
  function fReset() { clearInterval(FS.tick); FS.running = false; FS.remaining = modeSeconds(); setTitle(); drawFocus(); }
  function fDone() {
    clearInterval(FS.tick); FS.running = false;
    const wasFocus = FS.mode === "focus";
    if (wasFocus) { addMinutes(F.focusMin); FS.cycle++; FS.mode = FS.cycle % 4 === 0 ? "long" : "break"; } else FS.mode = "focus";
    FS.remaining = modeSeconds(); beep(); setTitle();
    try { if (window.Notification && Notification.permission === "granted") new Notification(wasFocus ? "Focus session done! Take a break." : "Break over. Time to focus!"); } catch (_) {}
    drawFocus();
  }
  function fSkip() { clearInterval(FS.tick); FS.running = false; FS.mode = FS.mode === "focus" ? (FS.cycle % 4 === 3 ? "long" : "break") : "focus"; FS.remaining = modeSeconds(); setTitle(); drawFocus(); }

  // ---- ambient sounds (generated, so always free to use) ----
  const AMB = { ctx: null, nodes: [], kind: "off", vol: load("amb-vol", 0.4), master: null, drops: null };
  function noiseBuffer(ctx, kind) {
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === "pink") { b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
        else if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else d[i] = w * 0.6;
      }
    }
    return buf;
  }
  function stopAmbient() {
    AMB.nodes.forEach((n) => { try { n.stop && n.stop(); } catch (_) {} try { n.disconnect(); } catch (_) {} });
    AMB.nodes = []; clearInterval(AMB.drops); AMB.drops = null; AMB.kind = "off";
  }
  function startAmbient(kind) {
    stopAmbient(); AMB.kind = kind;
    if (kind === "off") { drawFocus(); return; }
    try {
      AMB.ctx = AMB.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = AMB.ctx; ctx.resume();
      AMB.master = ctx.createGain(); AMB.master.gain.value = AMB.vol; AMB.master.connect(ctx.destination); AMB.nodes.push(AMB.master);
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, kind === "rain" ? "white" : kind === "wind" ? "brown" : kind); src.loop = true;
      let node = src;
      if (kind === "rain") { const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 600; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7500; node.connect(hp); hp.connect(lp); node = lp; AMB.nodes.push(hp, lp);
        AMB.drops = setInterval(() => { try { const t = ctx.currentTime, o = ctx.createBufferSource(); o.buffer = noiseBuffer.cache || (noiseBuffer.cache = noiseBuffer(ctx, "white")); const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2500 + Math.random() * 3500; bp.Q.value = 6; const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); o.connect(bp); bp.connect(g); g.connect(AMB.master); o.start(t, Math.random() * 4, 0.06); } catch (_) {} }, 90); }
      if (kind === "wind") { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.13; lg.gain.value = 300; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); node.connect(lp); node = lp; AMB.nodes.push(lp, lfo, lg); }
      node.connect(AMB.master); src.start(); AMB.nodes.push(src);
    } catch (_) { AMB.kind = "off"; }
    drawFocus();
  }

  function drawFocus() {
    const u = focusUi; if (!u || !u.root.isConnected) return;
    const total = modeSeconds(), pct = Math.max(0, Math.min(100, ((total - FS.remaining) / total) * 100));
    u.time.textContent = mmss(FS.remaining); u.mode.textContent = modeLabel();
    u.bar.style.width = pct + "%"; u.go.textContent = FS.running ? "⏸ Pause" : "▶ Start";
    const today = minutesToday();
    u.stats.textContent = "Today: " + today + " / " + F.goal + " min · 🔥 " + streak() + "-day streak · Session " + (FS.cycle % 4 + (FS.mode === "focus" ? 1 : 0)) + " of 4";
    u.goalBar.style.width = Math.min(100, (today / F.goal) * 100) + "%";
    u.amb.forEach(([k, b]) => b.classList.toggle("on", AMB.kind === k));
  }
  function focusView() {
    const u = { };
    u.mode = h("strong", { class: "lab-mode" }); u.time = h("div", { class: "lab-time", role: "timer" });
    u.bar = h("span", { class: "lab-fill" }); u.goalBar = h("span", { class: "lab-fill goal" }); u.stats = h("p", { class: "lab-hint" });
    u.go = h("button", { type: "button", class: "btn primary", onclick: () => (FS.running ? fPause() : fStart()) }, "▶ Start");
    const num = (label, key, min, max) => h("label", {}, label, h("input", { type: "number", min: String(min), max: String(max), value: String(F[key]), "aria-label": label,
      onchange: (e) => { const v = Math.max(min, Math.min(max, Math.round(+e.target.value || F[key]))); F[key] = v; e.target.value = v; save("focus", F); if (!FS.running) { FS.remaining = modeSeconds(); } drawFocus(); } }));
    u.amb = [["off", "🔇 Off"], ["rain", "🌧️ Rain"], ["brown", "🌊 Brown noise"], ["pink", "🌸 Pink noise"], ["white", "📻 White noise"], ["wind", "🍃 Wind"]]
      .map(([k, label]) => [k, h("button", { type: "button", class: "lab-chip", onclick: () => startAmbient(k) }, label)]);
    u.root = h("div", { class: "lab-card" },
      u.mode, u.time, h("div", { class: "lab-track" }, u.bar),
      h("div", { class: "lab-row" }, u.go, h("button", { type: "button", class: "btn", onclick: fReset }, "↺ Reset"), h("button", { type: "button", class: "btn", onclick: fSkip }, "⏭ Skip")),
      u.stats, h("div", { class: "lab-track small" }, u.goalBar),
      h("div", { class: "lab-row" }, num("Focus min", "focusMin", 1, 120), num("Break min", "breakMin", 1, 60), num("Long break", "longMin", 1, 60), num("Daily goal (min)", "goal", 10, 600)),
      h("strong", {}, "🎧 Ambient sound"),
      h("div", { class: "lab-row" }, u.amb.map(([, b]) => b)),
      h("label", { class: "lab-row" }, "🔈", h("input", { type: "range", min: "0", max: "1", step: "0.02", value: String(AMB.vol), "aria-label": "Ambient volume", oninput: (e) => { AMB.vol = +e.target.value; save("amb-vol", AMB.vol); if (AMB.master) AMB.master.gain.value = AMB.vol; } })),
      h("p", { class: "lab-hint" }, "Tip: 25 minutes of focus, 5 minutes of rest. Put your phone on silent, keep one subject per session. The timer keeps running while you use other parts of Spark."));
    focusUi = u; drawFocus();
    return u.root;
  }

  // =====================================================================
  //  FLASHCARDS (spaced repetition)
  // =====================================================================
  const STARTER = [
    ["De Morgan's law", "NOT(A AND B) = NOT A OR NOT B, and NOT(A OR B) = NOT A AND NOT B"],
    ["Nyquist sampling rate", "fs ≥ 2 · fmax (sample at least twice the highest frequency)"],
    ["Time complexity of binary search", "O(log n), on a sorted array"],
    ["Time complexity of merge sort", "O(n log n) in best, average and worst case"],
    ["Ohm's law", "V = I · R"],
    ["Kirchhoff's current law (KCL)", "The sum of currents entering a node equals the sum leaving it"],
    ["Kirchhoff's voltage law (KVL)", "The sum of voltages around any closed loop is zero"],
    ["Euler's formula", "e^(ix) = cos x + i sin x"],
    ["Stack vs queue", "Stack is LIFO (last in, first out). Queue is FIFO (first in, first out)"],
    ["TCP vs UDP", "TCP: reliable, connection-oriented. UDP: faster, connectionless, no delivery guarantee"],
    ["First normal form (1NF)", "Every column holds atomic values and there are no repeating groups"],
    ["Thevenin's theorem", "Any linear network can be replaced by one voltage source Vth in series with a resistance Rth"],
  ];
  const decks = () => { let d = load("decks", null); if (!d) { d = [{ id: uid(), name: "Engineering basics", cards: STARTER.map(([q, a]) => ({ id: uid(), q, a, reps: 0, ease: 2.5, interval: 0, due: 0 })) }]; save("decks", d); } return d; };
  function rate(card, r) {
    const day = 86400000, now = Date.now();
    if (r === 0) { card.reps = 0; card.interval = 0; card.ease = Math.max(1.3, card.ease - 0.2); card.due = now + 60000; return; }
    if (r === 1) { card.interval = card.reps === 0 ? 1 : Math.max(1, Math.round(card.interval * 1.2)); card.ease = Math.max(1.3, card.ease - 0.15); }
    else if (r === 2) { card.interval = card.reps === 0 ? 1 : card.reps === 1 ? 3 : Math.round(card.interval * card.ease); }
    else { card.interval = card.reps === 0 ? 3 : Math.round(card.interval * card.ease * 1.3); card.ease += 0.15; }
    card.reps++; card.due = now + card.interval * day;
  }
  function flashView() {
    let all = decks(), cur = load("deck-cur", all[0].id);
    if (!all.some((d) => d.id === cur)) cur = all[0].id;
    let queue = [], shown = false, current = null, again = [];
    const wrap = h("div", { class: "lab-card" });
    const persist = () => save("decks", all);
    const deck = () => all.find((d) => d.id === cur);
    const due = () => deck().cards.filter((c) => c.due <= Date.now()).sort((a, b) => a.due - b.due);
    const draw = () => {
      const d = deck(), dueNow = due();
      const sel = h("select", { "aria-label": "Deck", onchange: (e) => { cur = e.target.value; save("deck-cur", cur); queue = []; current = null; shown = false; draw(); } }, all.map((x) => h("option", { value: x.id, selected: x.id === cur }, x.name + " (" + x.cards.length + ")")));
      const study = h("div", { class: "lab-study" });
      if (current) {
        study.append(h("div", { class: "lab-flash" }, h("small", {}, "Question"), h("p", {}, current.q), shown ? h("div", {}, h("small", {}, "Answer"), h("p", { class: "lab-ans" }, current.a)) : null),
          shown ? h("div", { class: "lab-row" }, [["Again", 0], ["Hard", 1], ["Good", 2], ["Easy", 3]].map(([l, r]) => h("button", { type: "button", class: "btn" + (r === 2 ? " primary" : ""), onclick: () => { rate(current, r); persist(); if (r === 0) again.push(current); next(); } }, l + (r === 0 ? " (1 min)" : ""))))
                 : h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn primary", onclick: () => { shown = true; draw(); } }, "Show answer")));
      } else if (queue.length === 0 && again.length) { study.append(h("p", { class: "lab-hint" }, again.length + " card(s) to retry."), h("button", { type: "button", class: "btn primary", onclick: () => { queue = again.splice(0); next(); } }, "Retry them")); }
      else study.append(h("p", { class: "lab-hint" }, dueNow.length ? dueNow.length + " card(s) due now." : "🎉 Nothing due. Come back later or add more cards."),
        dueNow.length ? h("button", { type: "button", class: "btn primary", onclick: () => { queue = due(); again = []; next(); } }, "▶ Study " + dueNow.length + " card" + (dueNow.length > 1 ? "s" : "")) : null);
      const q = h("input", { type: "text", maxlength: "200", placeholder: "Question or term", "aria-label": "Question", autocomplete: "off" });
      const a = h("input", { type: "text", maxlength: "400", placeholder: "Answer", "aria-label": "Answer", autocomplete: "off" });
      const add = () => { const qq = clean(q.value), aa = clean(a.value); if (!qq || !aa) return; d.cards.unshift({ id: uid(), q: qq, a: aa, reps: 0, ease: 2.5, interval: 0, due: 0 }); persist(); q.value = ""; a.value = ""; draw(); };
      const bulk = h("textarea", { rows: "3", maxlength: "6000", placeholder: "Paste many cards, one per line: question | answer", "aria-label": "Import cards" });
      const importBulk = () => { let n = 0; for (const line of bulk.value.split("\n")) { const [qq, ...rest] = line.split(/\s*\|\s*|\t/); const aa = rest.join(" | "); if (clean(qq) && clean(aa)) { d.cards.unshift({ id: uid(), q: clean(qq).slice(0, 200), a: clean(aa).slice(0, 400), reps: 0, ease: 2.5, interval: 0, due: 0 }); n++; } } persist(); bulk.value = ""; draw(); };
      wrap.replaceChildren(
        h("div", { class: "lab-row" }, sel, h("button", { type: "button", class: "btn sm", onclick: () => { const name = clean(prompt("Name of the new deck")); if (name) { const nd = { id: uid(), name: name.slice(0, 40), cards: [] }; all.push(nd); cur = nd.id; save("deck-cur", cur); persist(); draw(); } } }, "＋ New deck"),
          all.length > 1 ? h("button", { type: "button", class: "btn sm", onclick: () => { if (confirm("Delete the deck “" + d.name + "” and all its cards?")) { all = all.filter((x) => x.id !== cur); cur = all[0].id; persist(); draw(); } } }, "🗑 Delete deck") : null),
        study,
        h("details", { class: "lab-det" }, h("summary", {}, "➕ Add cards"), h("div", { class: "lab-row" }, q, a, h("button", { type: "button", class: "btn sm primary", onclick: add }, "Add")), bulk, h("button", { type: "button", class: "btn sm", onclick: importBulk }, "Import lines")),
        h("details", { class: "lab-det" }, h("summary", {}, "📚 All cards (" + d.cards.length + ")"),
          ...d.cards.map((c) => h("div", { class: "lab-cardrow" }, h("span", {}, h("strong", {}, c.q), h("small", {}, c.a)), h("button", { type: "button", class: "lab-x", "aria-label": "Delete card", onclick: () => { d.cards = d.cards.filter((x) => x.id !== c.id); persist(); draw(); } }, "✕")))),
        h("p", { class: "lab-hint" }, "Spaced repetition: cards you know well come back later, cards you miss come back soon. A few minutes a day beats cramming."));
    };
    const next = () => { current = queue.shift() || null; shown = false; draw(); };
    draw();
    return wrap;
  }

  // =====================================================================
  //  CGPA and ATTENDANCE
  // =====================================================================
  function cgpaView() {
    const rows = load("cgpa", [{ c: 4, g: 9 }, { c: 3, g: 8 }, { c: 3, g: 8 }]);
    const prev = load("cgpa-prev", { cgpa: 0, credits: 0, target: 8.5, nextCredits: 24 });
    const wrap = h("div", { class: "lab-card" }), out = h("div", { class: "lab-result" }), plan = h("div", { class: "lab-result" });
    const num = (v) => (isFinite(+v) ? +v : 0);
    const calc = () => {
      const credits = rows.reduce((n, r) => n + num(r.c), 0), pts = rows.reduce((n, r) => n + num(r.c) * Math.min(10, Math.max(0, num(r.g))), 0);
      const sgpa = credits ? pts / credits : 0, pc = num(prev.credits), pg = num(prev.cgpa), tot = pc + credits;
      const cg = tot ? (pc * pg + pts) / tot : 0;
      out.replaceChildren(h("strong", {}, "SGPA: " + sgpa.toFixed(2)), h("span", {}, " · CGPA: " + cg.toFixed(2)), h("small", {}, "≈ " + (cg * 9.5).toFixed(1) + "% (common formula CGPA × 9.5; check your university rule)"));
      const nc = num(prev.nextCredits), target = num(prev.target), after = pc + credits;
      const need = nc > 0 ? ((target * (after + nc)) - (after ? (after * cg) : 0)) / nc : 0;
      plan.replaceChildren(h("strong", {}, "🎯 Target planner"), h("p", {}, nc > 0 ? (need > 10 ? "Reaching " + target + " is not possible next semester with " + nc + " credits. Try a lower target." : need <= 0 ? "You already have enough. Keep it up!" : "To reach a CGPA of " + target + ", you need an SGPA of about " + need.toFixed(2) + " in the next " + nc + " credits.") : "Enter the next semester's credits."));
    };
    const save2 = () => { save("cgpa", rows); save("cgpa-prev", prev); calc(); };
    const draw = () => {
      wrap.replaceChildren(h("strong", {}, "🎓 SGPA and CGPA calculator"), h("p", { class: "lab-hint" }, "Enter the credits and grade point (0 to 10) for each subject of this semester."),
        ...rows.map((r, i) => h("div", { class: "lab-row" }, h("label", {}, "Credits", h("input", { type: "number", min: "0", max: "12", step: "0.5", value: String(r.c), oninput: (e) => { r.c = e.target.value; save2(); } })),
          h("label", {}, "Grade point", h("input", { type: "number", min: "0", max: "10", step: "0.5", value: String(r.g), oninput: (e) => { r.g = e.target.value; save2(); } })),
          h("button", { type: "button", class: "lab-x", "aria-label": "Remove subject", onclick: () => { rows.splice(i, 1); save2(); draw(); } }, "✕"))),
        h("button", { type: "button", class: "btn sm", onclick: () => { rows.push({ c: 3, g: 8 }); save2(); draw(); } }, "＋ Add subject"),
        h("div", { class: "lab-row" }, h("label", {}, "Previous CGPA", h("input", { type: "number", min: "0", max: "10", step: "0.01", value: String(prev.cgpa), oninput: (e) => { prev.cgpa = e.target.value; save2(); } })),
          h("label", {}, "Previous credits", h("input", { type: "number", min: "0", max: "400", value: String(prev.credits), oninput: (e) => { prev.credits = e.target.value; save2(); } }))),
        out,
        h("div", { class: "lab-row" }, h("label", {}, "Target CGPA", h("input", { type: "number", min: "0", max: "10", step: "0.1", value: String(prev.target), oninput: (e) => { prev.target = e.target.value; save2(); } })),
          h("label", {}, "Next semester credits", h("input", { type: "number", min: "0", max: "40", value: String(prev.nextCredits), oninput: (e) => { prev.nextCredits = e.target.value; save2(); } }))),
        plan);
      calc();
    };
    draw();
    return wrap;
  }
  function attendanceView() {
    const st = load("att", { a: 30, t: 40, r: 75 });
    const wrap = h("div", { class: "lab-card" }), out = h("div", { class: "lab-result" });
    const calc = () => {
      const a = Math.max(0, +st.a || 0), t = Math.max(0, +st.t || 0), r = Math.min(99, Math.max(1, +st.r || 75)) / 100;
      if (!t || a > t) { out.replaceChildren(h("p", {}, "Enter attended classes (not more than total classes).")); return; }
      const pct = (a / t) * 100, canMiss = Math.floor(a / r - t), mustAttend = Math.ceil((r * t - a) / (1 - r));
      out.replaceChildren(h("strong", { class: pct >= r * 100 ? "ok" : "bad" }, "Attendance: " + pct.toFixed(1) + "%"),
        h("p", {}, pct >= r * 100 ? "✅ You can miss " + Math.max(0, canMiss) + " more class" + (canMiss === 1 ? "" : "es") + " and still stay at " + (r * 100) + "%." : "⚠️ Attend the next " + mustAttend + " class" + (mustAttend === 1 ? "" : "es") + " in a row to reach " + (r * 100) + "%."));
    };
    const field = (label, key, min, max) => h("label", {}, label, h("input", { type: "number", min: String(min), max: String(max), value: String(st[key]), oninput: (e) => { st[key] = e.target.value; save("att", st); calc(); } }));
    wrap.append(h("strong", {}, "📅 Attendance calculator"), h("div", { class: "lab-row" }, field("Attended", "a", 0, 1000), field("Total classes", "t", 0, 1000), field("Required %", "r", 1, 99)), out,
      h("p", { class: "lab-hint" }, "Many colleges need 75% attendance to write exams. Check your own rule and change the percentage if needed."));
    calc();
    return wrap;
  }

  // =====================================================================
  //  POWER TOOLS launcher (tools are registered by tools-*.js)
  // =====================================================================
  function toolsView() {
    const list = (window.SparkTools || []).filter((t) => t && typeof t.mount === "function");
    let open = load("tool-open", "");
    const wrap = h("div", { class: "lab-body" });
    const draw = () => {
      const t = list.find((x) => x.id === open);
      if (t) {
        save("tool-open", open);
        let node; try { node = t.mount(); } catch (e) { node = h("p", { class: "lab-hint" }, "This tool could not load: " + e.message); }
        wrap.replaceChildren(h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn sm", onclick: () => { open = ""; save("tool-open", ""); draw(); } }, "← All tools"), h("strong", {}, t.icon + " " + t.name)), node);
      } else {
        wrap.replaceChildren(h("p", { class: "lab-hint" }, "Advanced tools for engineering students. They work offline and keep your data only on this phone."),
          h("div", { class: "tl-grid" }, list.map((x) => h("button", { type: "button", class: "tl-tile", onclick: () => { open = x.id; draw(); } }, h("span", { class: "tl-ic" }, x.icon), h("strong", {}, x.name), h("small", {}, x.desc)))));
      }
    };
    draw();
    return wrap;
  }

  // =====================================================================
  //  PANEL
  // =====================================================================
  function mount() {
    const tabs = [["focus", "🍅 Focus"], ["cards", "🃏 Flashcards"], ["tools", "🛠️ Power Tools"], ["cgpa", "🎓 CGPA"], ["att", "📅 Attendance"]];
    let view = load("view", "focus");
    const body = h("div", { class: "lab-body" }), bar = h("div", { class: "lab-row" });
    const draw = () => {
      save("view", view);
      bar.replaceChildren(...tabs.map(([id, label]) => h("button", { type: "button", class: "btn sm" + (view === id ? " primary" : ""), onclick: () => { view = id; draw(); } }, label)));
      body.replaceChildren(view === "focus" ? focusView() : view === "cards" ? flashView() : view === "tools" ? toolsView() : view === "cgpa" ? cgpaView() : attendanceView());
    };
    draw();
    queueMicrotask(drawFocus);
    return h("div", {}, bar, body);
  }
  window.SparkLab = { mount, _fs: FS, _f: F, _done: fDone, _rate: rate, _streak: streak };
})();
