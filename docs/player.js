// Spark Player: a private music player that runs fully in the browser.
// - Plays the student's own audio files (MP3, FLAC, WAV, AAC/M4A, OGG, OPUS) and free direct links.
// - Files are saved on this device (IndexedDB), so the library works offline and never leaves the phone.
// - Audio is decoded and played without re-encoding; the equalizer works in 32-bit floating point.
(function () {
  "use strict";

  const DB = "spark-music", STORE = "tracks";
  const EXTS = ["mp3", "m4a", "aac", "flac", "wav", "ogg", "oga", "opus", "weba", "webm", "aiff", "aif"];
  const LOSSLESS = new Set(["flac", "wav", "aiff", "aif"]);
  const FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const FLABEL = ["31", "62", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];
  const PRESETS = {
    "Flat": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "Bass boost": [7, 6, 4, 2, 0, 0, 0, 0, 0, 0],
    "Treble boost": [0, 0, 0, 0, 0, 1, 2, 4, 6, 7],
    "Vocal": [-2, -2, -1, 1, 3, 4, 3, 1, 0, -1],
    "Rock": [5, 4, 2, -1, -2, -1, 2, 4, 5, 5],
    "Pop": [-1, 1, 3, 4, 3, 0, -1, -1, 1, 2],
    "Classical": [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
    "Dance": [6, 5, 3, 0, 0, -2, -3, -2, 3, 3],
    "Hip-hop": [5, 5, 3, 3, -1, -1, 1, -1, 2, 3],
    "Electronic": [5, 4, 1, 0, -2, 2, 1, 2, 4, 5],
    "Acoustic": [3, 3, 2, 1, 2, 2, 3, 3, 2, 1],
  };

  // ---------- tiny helpers ----------
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
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem("sp-" + k)); return v == null ? d : v; } catch (_) { return d; } };
  const save = (k, v) => { try { localStorage.setItem("sp-" + k, JSON.stringify(v)); } catch (_) {} };
  const fmtTime = (s) => { if (!isFinite(s) || s < 0) return "0:00"; const m = Math.floor(s / 60), x = Math.floor(s % 60); return m + ":" + String(x).padStart(2, "0"); };
  const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  const extOf = (name) => (String(name || "").split(".").pop() || "").toLowerCase();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 18) : Math.random().toString(36).slice(2) + Date.now().toString(36));
  const shuffleArr = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- IndexedDB ----------
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const dbDo = async (mode, fn) => {
    const db = await openDb();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
      const req = fn(s);
      t.oncomplete = () => { db.close(); res(req ? req.result : undefined); };
      t.onerror = t.onabort = () => { db.close(); rej(t.error || new Error("Storage error")); };
    });
  };
  const dbAll = () => dbDo("readonly", (s) => s.getAll());
  const dbPut = (rec) => dbDo("readwrite", (s) => s.put(rec));
  const dbDel = (id) => dbDo("readwrite", (s) => s.delete(id));

  // ---------- ID3 tags (MP3 title, artist, album, cover) ----------
  const dec = (enc, b) => {
    try {
      if (enc === 0) return new TextDecoder("iso-8859-1").decode(b);
      if (enc === 1) {
        if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(b.subarray(2));
        if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(b.subarray(2));
        return new TextDecoder("utf-16le").decode(b);
      }
      if (enc === 2) return new TextDecoder("utf-16be").decode(b);
      return new TextDecoder("utf-8").decode(b);
    } catch (_) { return ""; }
  };
  const textFrame = (fr) => dec(fr[0], fr.subarray(1)).replace(/\0+/g, " ").trim();
  async function parseId3(file) {
    const out = {};
    try {
      const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
      if (head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return out;
      const ver = head[3];
      const size = ((head[6] & 127) << 21) | ((head[7] & 127) << 14) | ((head[8] & 127) << 7) | (head[9] & 127);
      if (size <= 0 || size > 16 * 1024 * 1024 || (ver !== 3 && ver !== 4)) return out;
      const buf = new Uint8Array(await file.slice(10, 10 + size).arrayBuffer());
      let p = 0;
      if (head[5] & 0x40) {
        p = ver === 4 ? ((buf[0] & 127) << 21) | ((buf[1] & 127) << 14) | ((buf[2] & 127) << 7) | (buf[3] & 127)
                      : (buf[0] * 16777216 + (buf[1] << 16) + (buf[2] << 8) + buf[3]) + 4;
      }
      while (p + 10 <= buf.length) {
        const id = String.fromCharCode(buf[p], buf[p + 1], buf[p + 2], buf[p + 3]);
        if (!/^[A-Z0-9]{4}$/.test(id)) break;
        const fsz = ver === 4 ? ((buf[p + 4] & 127) << 21) | ((buf[p + 5] & 127) << 14) | ((buf[p + 6] & 127) << 7) | (buf[p + 7] & 127)
                              : buf[p + 4] * 16777216 + (buf[p + 5] << 16) + (buf[p + 6] << 8) + buf[p + 7];
        const fr = buf.subarray(p + 10, p + 10 + fsz);
        p += 10 + fsz;
        if (fsz <= 1) continue;
        if (id === "TIT2") out.title = textFrame(fr);
        else if (id === "TPE1") out.artist = textFrame(fr);
        else if (id === "TALB") out.album = textFrame(fr);
        else if (id === "APIC" && !out.cover) {
          const enc = fr[0]; let i = 1, j = 1;
          while (j < fr.length && fr[j] !== 0) j++;
          const mime = new TextDecoder("iso-8859-1").decode(fr.subarray(1, j)).toLowerCase();
          i = j + 2;                                   // skip the null and the picture type byte
          if (enc === 1 || enc === 2) { while (i + 1 < fr.length && !(fr[i] === 0 && fr[i + 1] === 0)) i += 2; i += 2; }
          else { while (i < fr.length && fr[i] !== 0) i++; i += 1; }
          const data = fr.subarray(i);
          if (data.length > 100 && /^image\//.test(mime)) out.cover = new Blob([data], { type: mime === "image/jpg" ? "image/jpeg" : mime });
        }
      }
    } catch (_) {}
    return out;
  }
  const readDuration = (file) => new Promise((res) => {
    const a = new Audio(), u = URL.createObjectURL(file);
    const done = (d) => { URL.revokeObjectURL(u); res(isFinite(d) ? d : 0); };
    a.preload = "metadata"; a.onloadedmetadata = () => done(a.duration); a.onerror = () => done(0); a.src = u;
    setTimeout(() => done(0), 8000);
  });

  // ---------- state ----------
  const audio = new Audio();
  audio.preload = "auto";
  try { audio.preservesPitch = true; } catch (_) {}
  const S = {
    tracks: [], order: [], cur: null, shuffle: load("shuffle", false), repeat: load("repeat", "off"), rate: 1,
    vol: load("vol", 0.9), filter: "", favOnly: false, sleepTimer: null, sleepMin: 0, sleepEnds: 0, msg: "",
    eq: load("eq", { preset: "Flat", gains: PRESETS.Flat.slice(), pre: 0, width: 100, loud: false }), ready: false,
  };
  const coverUrls = new Map();
  let curUrl = "";
  let ctx = null, srcNode = null, pre = null, filters = [], splitter = null, merger = null, gLa = null, gLb = null, gRa = null, gRb = null, comp = null, analyser = null;
  let root = null, mini = null, ui = {};

  const byId = (id) => S.tracks.find((t) => t.id === id);
  const curTrack = () => (S.cur ? byId(S.cur) : null);
  const coverOf = (t) => {
    if (!t || !t.cover) return "";
    if (!coverUrls.has(t.id)) coverUrls.set(t.id, URL.createObjectURL(t.cover));
    return coverUrls.get(t.id);
  };

  // ---------- audio graph (equalizer, surround width, loudness, analyser) ----------
  function ensureGraph() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: "playback" });
    srcNode = ctx.createMediaElementSource(audio);
    pre = ctx.createGain();
    filters = FREQS.map((f, i) => {
      const b = ctx.createBiquadFilter();
      b.type = i === 0 ? "lowshelf" : i === FREQS.length - 1 ? "highshelf" : "peaking";
      b.frequency.value = f; b.Q.value = 1.1; b.gain.value = S.eq.gains[i] || 0;
      return b;
    });
    splitter = ctx.createChannelSplitter(2); merger = ctx.createChannelMerger(2);
    gLa = ctx.createGain(); gLb = ctx.createGain(); gRa = ctx.createGain(); gRb = ctx.createGain();
    comp = ctx.createDynamicsCompressor();
    analyser = ctx.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.82;
    let node = srcNode; node.connect(pre); node = pre;
    for (const f of filters) { node.connect(f); node = f; }
    node.connect(splitter);
    splitter.connect(gLa, 0); splitter.connect(gRb, 0); splitter.connect(gLb, 0); splitter.connect(gRa, 1);
    gLa.connect(merger, 0, 0); gRb.connect(merger, 0, 0);   // L' = a*L + b*R
    gLb.connect(merger, 0, 1); gRa.connect(merger, 0, 1);   // R' = b*L + a*R
    merger.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);
    applyEq();
  }
  function applyEq() {
    if (!ctx) return;
    const t = ctx.currentTime;
    filters.forEach((f, i) => f.gain.setTargetAtTime(S.eq.gains[i] || 0, t, 0.02));
    pre.gain.setTargetAtTime(Math.pow(10, (S.eq.pre || 0) / 20), t, 0.02);
    const w = (S.eq.width || 100) / 100, a = (1 + w) / 2, b = (1 - w) / 2;
    gLa.gain.value = a; gRa.gain.value = a; gLb.gain.value = b; gRb.gain.value = b;
    if (S.eq.loud) { comp.threshold.value = -30; comp.knee.value = 24; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25; }
    else { comp.threshold.value = -2; comp.knee.value = 0; comp.ratio.value = 20; comp.attack.value = 0.003; comp.release.value = 0.1; }   // safety limiter only
    save("eq", S.eq);
  }

  // ---------- library ----------
  async function loadLibrary() {
    try { S.tracks = (await dbAll()).sort((a, b) => a.added - b.added); } catch (_) { S.tracks = []; }
    const saved = load("order", []);
    const ids = new Set(S.tracks.map((t) => t.id));
    S.order = saved.filter((id) => ids.has(id)).concat(S.tracks.map((t) => t.id).filter((id) => !saved.includes(id)));
    S.ready = true;
  }
  const saveOrder = () => save("order", S.order);

  async function addFiles(files) {
    let added = 0, skipped = 0;
    for (const f of files) {
      if (!EXTS.includes(extOf(f.name))) { skipped++; continue; }
      const tags = extOf(f.name) === "mp3" ? await parseId3(f) : {};
      const base = f.name.replace(/\.[^.]+$/, "");
      let title = tags.title || base, artist = tags.artist || "";
      if (!tags.title && base.includes(" - ")) { const [a, ...r] = base.split(" - "); artist = tags.artist || a.trim(); title = r.join(" - ").trim() || base; }
      const rec = { id: uid(), name: f.name, title, artist, album: tags.album || "", ext: extOf(f.name), size: f.size, duration: await readDuration(f), added: Date.now() + added, fav: false, cover: tags.cover || null, blob: f };
      try { await dbPut(rec); S.tracks.push(rec); S.order.push(rec.id); added++; }
      catch (e) { S.msg = "Could not save " + f.name + ". Your device storage may be full."; }
    }
    saveOrder();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) {}
    S.msg = (added ? "Added " + added + " song" + (added > 1 ? "s" : "") + ". " : "") + (skipped ? skipped + " file" + (skipped > 1 ? "s were" : " was") + " skipped (not a supported audio format)." : "");
    renderAll();
  }
  async function addUrl(url) {
    url = String(url || "").trim();
    if (!/^https:\/\/[^\s<>"']+$/i.test(url)) { S.msg = "Paste a direct link that starts with https:// and ends with an audio file, for example .mp3 or .ogg."; renderAll(); return; }
    const name = decodeURIComponent(url.split("?")[0].split("/").pop() || "Online audio");
    const rec = { id: uid(), name, title: name.replace(/\.[^.]+$/, ""), artist: "Online", album: "", ext: extOf(name), size: 0, duration: 0, added: Date.now(), fav: false, cover: null, blob: null, url };
    try { await dbPut(rec); S.tracks.push(rec); S.order.push(rec.id); saveOrder(); S.msg = "Link added. Press play."; }
    catch (_) { S.msg = "Could not save the link."; }
    renderAll();
  }
  async function removeTrack(id) {
    const t = byId(id); if (!t) return;
    if (S.cur === id) { audio.pause(); audio.removeAttribute("src"); S.cur = null; if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = ""; } }
    try { await dbDel(id); } catch (_) {}
    S.tracks = S.tracks.filter((x) => x.id !== id); S.order = S.order.filter((x) => x !== id);
    if (coverUrls.has(id)) { URL.revokeObjectURL(coverUrls.get(id)); coverUrls.delete(id); }
    saveOrder(); renderAll();
  }
  async function toggleFav(id) { const t = byId(id); if (!t) return; t.fav = !t.fav; try { await dbPut(t); } catch (_) {} renderAll(); }
  function move(id, dir) {
    const i = S.order.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= S.order.length) return;
    [S.order[i], S.order[j]] = [S.order[j], S.order[i]]; saveOrder(); renderAll();
  }

  // ---------- playback ----------
  function setSource(t) {
    if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = ""; }
    if (t.url) { audio.crossOrigin = "anonymous"; audio.src = t.url; }
    else { audio.removeAttribute("crossorigin"); curUrl = URL.createObjectURL(t.blob); audio.src = curUrl; }
    audio.playbackRate = S.rate; audio.volume = S.vol;
  }
  async function play(id) {
    const t = byId(id); if (!t) return;
    ensureGraph();
    try { await ctx.resume(); } catch (_) {}
    if (S.cur !== id) { S.cur = id; setSource(t); }
    try { await audio.play(); S.msg = ""; }
    catch (e) { S.msg = t.url ? "This link could not be played. The host may block outside players, so try another link." : "Could not play this file in your browser."; }
    updateSession(); renderAll();
  }
  function togglePlay() {
    if (!S.cur) { const first = S.order.find((id) => byId(id)); if (first) play(first); return; }
    if (audio.paused) { ensureGraph(); (ctx.resume() || Promise.resolve()).then(() => audio.play()).catch(() => {}); } else audio.pause();
  }
  function queueOrder() { return S.shuffle ? shuffleArr(S.order) : S.order; }
  function step(dir, auto) {
    const list = S.order; if (!list.length) return;
    let i = list.indexOf(S.cur);
    if (S.shuffle && dir > 0) { const others = list.filter((x) => x !== S.cur); if (others.length) { play(others[Math.floor(Math.random() * others.length)]); return; } }
    i += dir;
    if (i >= list.length) { if (S.repeat === "all" || !auto) i = 0; else { audio.pause(); audio.currentTime = 0; renderAll(); return; } }
    if (i < 0) i = list.length - 1;
    play(list[i]);
  }
  audio.addEventListener("ended", () => { if (S.repeat === "one") { audio.currentTime = 0; audio.play().catch(() => {}); } else step(1, true); });
  audio.addEventListener("timeupdate", () => { updateTime(); updateMini(); });
  audio.addEventListener("play", () => { renderAll(); startViz(); });
  audio.addEventListener("pause", () => renderAll());
  audio.addEventListener("loadedmetadata", () => { const t = curTrack(); if (t && (!t.duration || t.url) && isFinite(audio.duration)) { t.duration = audio.duration; if (!t.url) dbPut(t).catch(() => {}); } renderAll(); });
  audio.addEventListener("error", () => { const t = curTrack(); S.msg = t && t.url ? "This link could not be played. The host may block outside players." : "This file could not be played."; renderAll(); });

  function setSleep(min) {
    clearTimeout(S.sleepTimer); S.sleepTimer = null; S.sleepMin = min; S.sleepEnds = 0;
    if (min > 0) { S.sleepEnds = Date.now() + min * 60000; S.sleepTimer = setTimeout(() => { fadeOutAndPause(); S.sleepMin = 0; S.sleepEnds = 0; renderAll(); }, min * 60000); }
    renderAll();
  }
  function fadeOutAndPause() {
    const start = audio.volume; let n = 20;
    const t = setInterval(() => { n--; audio.volume = Math.max(0, start * (n / 20)); if (n <= 0) { clearInterval(t); audio.pause(); audio.volume = S.vol; } }, 150);
  }

  function updateSession() {
    if (!("mediaSession" in navigator)) return;
    const t = curTrack(); if (!t) return;
    try {
      const art = coverOf(t);
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist || "Spark Player", album: t.album || "Spark", artwork: art ? [{ src: art, sizes: "512x512", type: (t.cover && t.cover.type) || "image/jpeg" }] : [] });
      const set = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch (_) {} };
      set("play", () => togglePlay()); set("pause", () => audio.pause());
      set("previoustrack", () => step(-1)); set("nexttrack", () => step(1, false));
      set("seekbackward", () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
      set("seekforward", () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
      set("seekto", (d) => { if (d.seekTime != null) audio.currentTime = d.seekTime; });
    } catch (_) {}
  }

  function qualityOf(t) {
    if (!t) return "";
    if (t.url) return "🌐 Online stream";
    if (LOSSLESS.has(t.ext)) return "🟣 Lossless HD";
    if (t.duration > 0 && t.size > 0) {
      const kbps = Math.round((t.size * 8) / t.duration / 1000);
      return (kbps >= 256 ? "🟢 HD " : "🔵 ") + kbps + " kbps";
    }
    return "🔵 " + t.ext.toUpperCase();
  }

  // ---------- visualizer ----------
  let vizOn = false;
  function startViz() {
    if (vizOn) return; vizOn = true;
    const data = new Uint8Array(256);
    const loop = () => {
      if (!root || !root.isConnected || audio.paused || !analyser) { vizOn = false; if (ui.canvas && root && root.isConnected) drawBars(null); return; }
      analyser.getByteFrequencyData(data); drawBars(data); requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function drawBars(data) {
    const c = ui.canvas; if (!c) return;
    const g = c.getContext("2d"), W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    const n = 40, bw = W / n, grad = g.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, "#22d3ee"); grad.addColorStop(0.5, "#a855f7"); grad.addColorStop(1, "#f472b6");
    g.fillStyle = grad;
    for (let i = 0; i < n; i++) {
      const v = data ? data[Math.floor(Math.pow(i / n, 1.6) * 150) + 1] / 255 : 0.03;
      const bh = Math.max(3, v * H);
      g.fillRect(i * bw + 1, H - bh, bw - 2, bh);
    }
  }

  // ---------- UI ----------
  function updateTime() {
    if (!ui.seek) return;
    const d = audio.duration, c = audio.currentTime;
    ui.cur.textContent = fmtTime(c); ui.dur.textContent = fmtTime(d);
    if (!ui.seeking) { ui.seek.max = isFinite(d) && d > 0 ? String(d) : "1"; ui.seek.value = String(c || 0); }
  }
  function updateMini() {
    if (!mini) return;
    const t = curTrack(), show = !!t && !(root && root.isConnected);
    mini.hidden = !show; if (!show) return;
    ui.mTitle.textContent = t.title; ui.mSub.textContent = t.artist || qualityOf(t);
    ui.mPlay.textContent = audio.paused ? "▶" : "⏸";
    const pct = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
    ui.mBar.style.width = pct + "%";
  }

  function renderNow() {
    const t = curTrack();
    ui.title.textContent = t ? t.title : "Nothing playing";
    ui.sub.textContent = t ? [t.artist, t.album].filter(Boolean).join(" · ") || "Spark Player" : "Add songs from your phone to start";
    ui.quality.textContent = t ? qualityOf(t) : "";
    ui.fmt.textContent = t ? (t.ext || "").toUpperCase() + (t.size ? " · " + fmtSize(t.size) : "") + (ctx ? " · " + (ctx.sampleRate / 1000).toFixed(1) + " kHz" : "") : "";
    const art = t ? coverOf(t) : "";
    ui.cover.replaceChildren(art ? h("img", { src: art, alt: "Album art" }) : h("span", {}, "🎵"));
    ui.play.textContent = audio.paused ? "▶" : "⏸";
    ui.shuffle.classList.toggle("on", S.shuffle); ui.repeat.classList.toggle("on", S.repeat !== "off");
    ui.repeat.textContent = S.repeat === "one" ? "🔂" : "🔁";
    updateTime();
  }
  function renderList() {
    const q = S.filter.trim().toLowerCase();
    const rows = S.order.map(byId).filter(Boolean).filter((t) => (!S.favOnly || t.fav) && (!q || (t.title + " " + t.artist + " " + t.album).toLowerCase().includes(q)));
    ui.count.textContent = S.tracks.length + " song" + (S.tracks.length === 1 ? "" : "s") + (S.tracks.length ? " · " + fmtSize(S.tracks.reduce((n, t) => n + (t.size || 0), 0)) : "");
    if (!rows.length) { ui.list.replaceChildren(h("p", { class: "sp-empty" }, S.tracks.length ? "No songs match." : "Your library is empty. Tap “Add songs” and choose music from your phone. They stay on this device and play offline.")); return; }
    ui.list.replaceChildren(...rows.map((t) => {
      const art = coverOf(t), isCur = t.id === S.cur;
      return h("div", { class: "sp-row" + (isCur ? " cur" : "") },
        h("button", { class: "sp-rowmain", type: "button", onclick: () => (isCur ? togglePlay() : play(t.id)) },
          h("span", { class: "sp-thumb" }, art ? h("img", { src: art, alt: "" }) : isCur && !audio.paused ? "🔊" : "🎵"),
          h("span", { class: "sp-rowtxt" }, h("strong", {}, t.title), h("small", {}, [t.artist, fmtTime(t.duration), qualityOf(t)].filter(Boolean).join(" · ")))),
        h("span", { class: "sp-rowbtns" },
          h("button", { type: "button", class: "sp-ic" + (t.fav ? " on" : ""), "aria-label": "Favorite", onclick: () => toggleFav(t.id) }, t.fav ? "♥" : "♡"),
          h("button", { type: "button", class: "sp-ic", "aria-label": "Move up", onclick: () => move(t.id, -1) }, "↑"),
          h("button", { type: "button", class: "sp-ic", "aria-label": "Move down", onclick: () => move(t.id, 1) }, "↓"),
          h("button", { type: "button", class: "sp-ic", "aria-label": "Remove", onclick: () => { if (confirm("Remove “" + t.title + "” from your library?")) removeTrack(t.id); } }, "🗑")));
    }));
  }
  function renderEq() {
    ui.preset.value = S.eq.preset in PRESETS ? S.eq.preset : "Custom";
    ui.bands.forEach((s, i) => { s.value = String(S.eq.gains[i] || 0); ui.bandVal[i].textContent = (S.eq.gains[i] > 0 ? "+" : "") + (S.eq.gains[i] || 0); });
    ui.pre.value = String(S.eq.pre || 0); ui.preVal.textContent = (S.eq.pre > 0 ? "+" : "") + (S.eq.pre || 0) + " dB";
    ui.width.value = String(S.eq.width || 100); ui.widthVal.textContent = (S.eq.width || 100) + "%";
    ui.loud.checked = !!S.eq.loud;
  }
  function renderStatus() {
    ui.msg.textContent = S.msg || "";
    ui.sleepInfo.textContent = S.sleepMin ? "Sleeping in " + Math.max(1, Math.round((S.sleepEnds - Date.now()) / 60000)) + " min" : "";
    ui.sleep.value = String(S.sleepMin || 0);
  }
  function renderAll() { if (!ui.title) return; renderNow(); renderList(); renderStatus(); updateMini(); }

  function build() {
    const fileIn = h("input", { type: "file", multiple: true, accept: "audio/*," + EXTS.map((e) => "." + e).join(","), class: "sp-file", onchange: (e) => { addFiles([...e.target.files]); e.target.value = ""; } });
    ui.cover = h("div", { class: "sp-cover" });
    ui.title = h("strong", { class: "sp-title" }); ui.sub = h("span", { class: "sp-sub" });
    ui.quality = h("span", { class: "sp-badge" }); ui.fmt = h("span", { class: "sp-fmt" });
    ui.canvas = h("canvas", { class: "sp-viz", width: "320", height: "64", "aria-hidden": "true" });
    ui.seek = h("input", { type: "range", class: "sp-seek", min: "0", max: "1", step: "0.1", value: "0", "aria-label": "Seek",
      oninput: () => { ui.seeking = true; ui.cur.textContent = fmtTime(+ui.seek.value); },
      onchange: () => { audio.currentTime = +ui.seek.value; ui.seeking = false; } });
    ui.cur = h("span", {}, "0:00"); ui.dur = h("span", {}, "0:00");
    ui.play = h("button", { type: "button", class: "sp-big", "aria-label": "Play or pause", onclick: togglePlay }, "▶");
    ui.shuffle = h("button", { type: "button", class: "sp-ic", "aria-label": "Shuffle", onclick: () => { S.shuffle = !S.shuffle; save("shuffle", S.shuffle); renderAll(); } }, "🔀");
    ui.repeat = h("button", { type: "button", class: "sp-ic", "aria-label": "Repeat", onclick: () => { S.repeat = S.repeat === "off" ? "all" : S.repeat === "all" ? "one" : "off"; save("repeat", S.repeat); renderAll(); } }, "🔁");
    const speed = h("select", { "aria-label": "Speed", onchange: (e) => { S.rate = +e.target.value; audio.playbackRate = S.rate; } }, [0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => h("option", { value: r, selected: r === 1 }, r + "×")));
    const vol = h("input", { type: "range", class: "sp-vol", min: "0", max: "1", step: "0.01", value: String(S.vol), "aria-label": "Volume", oninput: (e) => { S.vol = +e.target.value; audio.volume = S.vol; save("vol", S.vol); } });
    ui.sleep = h("select", { "aria-label": "Sleep timer", onchange: (e) => setSleep(+e.target.value) }, [[0, "Sleep timer: off"], [15, "15 min"], [30, "30 min"], [60, "1 hour"], [90, "90 min"]].map(([v, l]) => h("option", { value: v }, l)));
    ui.sleepInfo = h("span", { class: "sp-hint" });
    ui.preset = h("select", { "aria-label": "Equalizer preset", onchange: (e) => { const g = PRESETS[e.target.value]; if (g) { S.eq.preset = e.target.value; S.eq.gains = g.slice(); if (e.target.value === "Flat") { S.eq.width = 100; S.eq.pre = 0; } applyEq(); renderEq(); } } },
      [...Object.keys(PRESETS), "Custom"].map((p) => h("option", { value: p }, p)));
    ui.bandVal = []; ui.bands = FREQS.map((f, i) => {
      const val = h("small", {}, "0"); ui.bandVal.push(val);
      const s = h("input", { type: "range", class: "sp-band", min: "-12", max: "12", step: "1", value: "0", "aria-label": FLABEL[i] + " hertz",
        oninput: (e) => { S.eq.gains[i] = +e.target.value; S.eq.preset = "Custom"; applyEq(); renderEq(); } });
      return s;
    });
    ui.pre = h("input", { type: "range", min: "-12", max: "12", step: "1", value: "0", "aria-label": "Preamp", oninput: (e) => { S.eq.pre = +e.target.value; applyEq(); renderEq(); } }); ui.preVal = h("small", {});
    ui.width = h("input", { type: "range", min: "0", max: "200", step: "5", value: "100", "aria-label": "Surround width", oninput: (e) => { S.eq.width = +e.target.value; applyEq(); renderEq(); } }); ui.widthVal = h("small", {});
    ui.loud = h("input", { type: "checkbox", onchange: (e) => { S.eq.loud = e.target.checked; applyEq(); } });
    ui.search = h("input", { type: "search", class: "sp-search", placeholder: "Search your library…", "aria-label": "Search library", autocomplete: "off", oninput: (e) => { S.filter = e.target.value; renderList(); } });
    ui.favBtn = h("button", { type: "button", class: "sp-chip", onclick: (e) => { S.favOnly = !S.favOnly; e.currentTarget.classList.toggle("on", S.favOnly); renderList(); } }, "♥ Favorites");
    ui.count = h("span", { class: "sp-hint" }); ui.list = h("div", { class: "sp-list" }); ui.msg = h("p", { class: "sp-msg", role: "status" });
    const urlIn = h("input", { type: "url", class: "sp-url", placeholder: "Paste a direct https:// audio link (.mp3, .ogg …)", "aria-label": "Audio link", autocomplete: "off" });
    const drop = h("div", { class: "sp-drop" }, "⬇ Drop audio files here, or use Add songs");
    ["dragover", "dragenter"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); if (ev === "drop") addFiles([...e.dataTransfer.files]); }));

    root = h("div", { class: "sp-root", id: "spRoot", tabindex: "0",
      onkeydown: (e) => { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.code === "Space") { e.preventDefault(); togglePlay(); } else if (e.key === "ArrowRight") audio.currentTime += 5; else if (e.key === "ArrowLeft") audio.currentTime -= 5; } },
      h("div", { class: "sp-now" }, ui.cover, h("div", { class: "sp-meta" }, ui.title, ui.sub, h("div", { class: "sp-tags" }, ui.quality, ui.fmt))),
      ui.canvas,
      h("div", { class: "sp-seekrow" }, ui.cur, ui.seek, ui.dur),
      h("div", { class: "sp-ctrl" }, ui.shuffle, h("button", { type: "button", class: "sp-ic", "aria-label": "Previous", onclick: () => step(-1) }, "⏮"),
        h("button", { type: "button", class: "sp-ic", "aria-label": "Back 10 seconds", onclick: () => { audio.currentTime = Math.max(0, audio.currentTime - 10); } }, "⏪"),
        ui.play, h("button", { type: "button", class: "sp-ic", "aria-label": "Forward 10 seconds", onclick: () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); } }, "⏩"),
        h("button", { type: "button", class: "sp-ic", "aria-label": "Next", onclick: () => step(1) }, "⏭"), ui.repeat),
      h("div", { class: "sp-opts" }, h("label", {}, "🔈", vol), h("label", {}, "⚡", speed), ui.sleep, ui.sleepInfo),
      h("details", { class: "sp-eq" }, h("summary", {}, "🎚️ Equalizer and HD sound"),
        h("p", { class: "sp-hint" }, "10-band equalizer in 32-bit floating point, surround width, loudness leveling and a safety limiter. Your files are never re-encoded, so quality stays exactly as recorded. Lossless files (FLAC, WAV) sound best."),
        h("div", { class: "sp-opts" }, ui.preset),
        h("div", { class: "sp-bands" }, ui.bands.map((s, i) => h("div", { class: "sp-bandcol" }, ui.bandVal[i], s, h("small", {}, FLABEL[i])))),
        h("div", { class: "sp-opts" }, h("label", {}, "Preamp ", ui.pre, ui.preVal), h("label", {}, "Surround ", ui.width, ui.widthVal)),
        h("label", { class: "sp-check" }, ui.loud, " Loudness leveling (quiet parts louder, loud parts controlled)")),
      h("div", { class: "sp-lib" }, h("div", { class: "sp-libhead" }, h("strong", {}, "📚 My library"), ui.count),
        h("div", { class: "sp-opts" }, h("label", { class: "sp-addbtn" }, "➕ Add songs", fileIn), ui.favBtn), ui.search, drop,
        h("div", { class: "sp-opts" }, urlIn, h("button", { type: "button", class: "sp-chip", onclick: () => { addUrl(urlIn.value); urlIn.value = ""; } }, "Add link")),
        ui.msg, ui.list,
        h("p", { class: "sp-hint" }, "Spark Player plays your own music and free links. It cannot take audio from YouTube, which is against YouTube's rules. Your songs are stored privately on this device only.")));
    // mini player (stays visible while browsing other screens)
    ui.mTitle = h("strong", {}); ui.mSub = h("small", {}); ui.mBar = h("span", { class: "sp-mbar-fill" });
    ui.mPlay = h("button", { type: "button", class: "sp-mbtn", "aria-label": "Play or pause", onclick: (e) => { e.stopPropagation(); togglePlay(); } }, "▶");
    mini = h("div", { class: "sp-mini", hidden: true, role: "region", "aria-label": "Now playing" },
      h("button", { type: "button", class: "sp-mtext", onclick: () => { if (window.sparkOpenPlayer) window.sparkOpenPlayer(); } }, ui.mTitle, ui.mSub),
      ui.mPlay, h("button", { type: "button", class: "sp-mbtn", "aria-label": "Next", onclick: (e) => { e.stopPropagation(); step(1); } }, "⏭"),
      h("div", { class: "sp-mbar" }, ui.mBar));
    document.body.appendChild(mini);
    renderEq(); renderAll();
  }

  function mount() {
    if (!root) build();
    renderAll(); renderEq();
    setTimeout(() => { updateMini(); if (!audio.paused) startViz(); else drawBars(null); }, 0);
    return root;
  }

  window.SparkPlayer = { mount, _parseId3: parseId3, _state: S, _audio: audio, _addFiles: addFiles, _graph: () => ({ ctx, filters, analyser }) };
  loadLibrary().then(() => { if (!root) build(); renderAll(); });
  setInterval(() => { if (S.sleepMin) renderStatus(); updateMini(); }, 1500);
})();
