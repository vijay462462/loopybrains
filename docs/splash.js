// Welcome splash: shown once each time the app is opened (not on every page change). Personal, short, and safe if anything fails:
// the CSS also fades it out by itself after a few seconds.
(function () {
  var el = document.getElementById("splash"); if (!el) return;
  var ver = ""; try { var vm = ((document.currentScript && document.currentScript.src) || "").match(/[?&]v=(\d+)/); ver = vm ? vm[1] : ""; } catch (e) {}
  var seen = false; try { seen = sessionStorage.getItem("dd-splash") === "1"; sessionStorage.setItem("dd-splash", "1"); } catch (e) {}
  if (seen) { el.remove(); return; }
  var name = "", first = true, college = "";
  try { name = (localStorage.getItem("dd-name") || "").trim().split(/\s+/)[0] || ""; first = !localStorage.getItem("dd-welcome-done") && !name; college = localStorage.getItem("dd-college") || ""; } catch (e) {}
  var h = new Date().getHours(), part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  var title = document.getElementById("splashTitle"), sub = document.getElementById("splashSub");
  if (!first && name) { title.textContent = part + ", " + name + " \u{1F44B}"; sub.textContent = "Welcome back to Loopy Brains family."; }
  else if (!first) { title.textContent = "Welcome back to Loopy Brains family"; }
  try {
    var note = JSON.parse(localStorage.getItem("dd-welcome-note") || "null");
    if (note && note.text) { var p = document.createElement("p"); p.className = "splash-note"; p.textContent = "\u201C" + note.text + "\u201D"; if (note.from) { var s = document.createElement("small"); s.textContent = ",  " + note.from; p.appendChild(s); } sub.parentNode.insertBefore(p, sub.nextSibling); }
  } catch (e) {}
  var bubble = document.getElementById("splashBubble"), visits = 1;
  try { visits = (JSON.parse(localStorage.getItem("dd-visits") || "{}").n || 0) + 1; } catch (e) {}
  var say = first ? "Hello, I\u2019m Loopy, your guide on Loopy Brains. Ask your doubts without hesitation, learn something new every day, and grow together with your campus."
    : name ? "Welcome back, " + name + ". This is day " + visits + " with Loopy Brains. Today\u2019s quiz is ready when you are." : "Welcome back. I\u2019m Loopy. Today\u2019s quiz and your campus feed are ready.";
  var i = 0, typer = setInterval(function () { if (!bubble) { clearInterval(typer); return; } i += 2; bubble.textContent = say.slice(0, i); if (i >= say.length) clearInterval(typer); }, 28);
  try {
    var crest = localStorage.getItem("dd-crest") || "", cname = localStorage.getItem("dd-college-name") || "";
    if (cname && cname.toLowerCase() !== "your college") { var box = document.createElement("div"); box.className = "splash-crest"; if (/^data:image\/(png|jpeg|webp);base64,/.test(crest)) { var im = document.createElement("img"); im.src = crest; im.alt = ""; box.appendChild(im); } var nm = document.createElement("span"); nm.textContent = cname; box.appendChild(nm); var slot = document.getElementById("splashCrestSlot"); if (slot) slot.appendChild(box); else title.parentNode.insertBefore(box, title.nextSibling); }
  } catch (e) {}
  try { var tr = el.querySelector(".sp2-trust"); if (tr && ver) tr.textContent = tr.textContent + "  \u00B7  v" + ver; } catch (e) {}
  try {
    var bm = el.querySelector(".sp2-bmark");
    if (bm) {
      bm.innerHTML = '<svg viewBox="0 0 1024 1024" class="bsc-brand sp2-bspin" role="img" aria-label="Loopy Brains">' +
        '<defs>' +
          '<linearGradient id="spBg1" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#22c55e"/><stop offset=".55" stop-color="#166534"/><stop offset="1" stop-color="#0f3d22"/>' +
          '</linearGradient>' +
          '<linearGradient id="spRing1" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#f97316"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<rect width="1024" height="1024" rx="230" fill="url(#spBg1)"/>' +
        '<g transform="translate(206 70) scale(1.2)">' +
          '<g class="bs-spinc">' +
            '<circle cx="256" cy="256" r="196" fill="none" stroke="url(#spRing1)" stroke-width="30" stroke-linecap="round" stroke-dasharray="960 272" transform="rotate(-75 256 256)"/>' +
            '<circle cx="404" cy="132" r="17" fill="#fff4ec"/>' +
          '</g>' +
          '<g fill="none" stroke="#fff4ec" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" transform="translate(-41 0)">' +
            '<path d="M194 168V340H234"/>' +
            '<path d="M302 168V340"/>' +
            '<path d="M302 168H336C366 168 380 188 380 210C380 234 364 252 330 252H302"/>' +
            '<path d="M302 252H338C378 252 394 274 394 298C394 322 376 340 338 340H302"/>' +
          '</g>' +
        '</g>' +
      '</svg>';
    }
  } catch (e) {}
  el.setAttribute("data-live", "1");                    // JS is running: switch off the CSS safety timer
  var done = false;
  function close() { if (done) return; done = true; clearInterval(typer); try { document.dispatchEvent(new Event("splash-closed")); } catch (e) {} el.classList.add("splash-out"); setTimeout(function () { if (el.parentNode) el.remove(); }, 200); }
  var go = document.getElementById("splashGo"); if (go) { if (!first) go.textContent = "Continue \u2192"; go.addEventListener("click", close); }
  // The line under the headline never changes. A tapped feature is explained in its own hint line, which goes back to the overview after a few seconds.
  var hint = document.getElementById("splashHint"), hintBase = hint ? hint.textContent : "", hintTimer = 0;
  function showHint(t) { if (!hint) return; hint.textContent = t || hintBase; clearTimeout(hintTimer); hintTimer = setTimeout(function () { hint.textContent = hintBase; }, 5000); }
  // Tap a feature chip to see what it is for.
  var chips = document.getElementById("splashChips"), subEl = document.getElementById("splashSub");
  if (chips) chips.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest(".sp2-chip"); if (!b) return; ev.stopPropagation(); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); showHint(b.getAttribute("data-t")); try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} });
  var move = function (x, y) { el.style.setProperty("--px", x.toFixed(3)); el.style.setProperty("--py", y.toFixed(3)); };
  el.addEventListener("pointermove", function (ev) { move((ev.clientX / innerWidth - 0.5) * 2, (ev.clientY / innerHeight - 0.5) * 2); }, { passive: true });
  try { window.addEventListener("deviceorientation", function (ev) { if (ev.gamma == null) return; move(Math.max(-1, Math.min(1, ev.gamma / 30)), Math.max(-1, Math.min(1, ((ev.beta || 45) - 45) / 30))); }, { passive: true }); } catch (e) {}
  if (!first) el.addEventListener("click", close);      // returning students: tap anywhere
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === "Escape") close(); });
  if (!first) setTimeout(close, 15000);                 // new students stay until they press Continue
})();
