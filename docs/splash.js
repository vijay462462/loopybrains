// Welcome splash: shown once each time the app is opened (not on every page change). Personal, short, and safe if anything fails:
// the CSS also fades it out by itself after a few seconds.
(function () {
  var el = document.getElementById("splash"); if (!el) return;
  var seen = false; try { seen = sessionStorage.getItem("dd-splash") === "1"; sessionStorage.setItem("dd-splash", "1"); } catch (e) {}
  if (seen) { el.remove(); return; }
  var name = "", first = true, college = "";
  try { name = (localStorage.getItem("dd-name") || "").trim().split(/\s+/)[0] || ""; first = !localStorage.getItem("dd-welcome-done") && !name; college = localStorage.getItem("dd-college") || ""; } catch (e) {}
  var h = new Date().getHours(), part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  var title = document.getElementById("splashTitle"), sub = document.getElementById("splashSub");
  if (!first && name) { title.textContent = part + ", " + name + " \u{1F44B}"; sub.textContent = "Welcome back to the CampusLoop family."; }
  else if (!first) { title.textContent = "Welcome back to the CampusLoop family"; }
  try {
    var note = JSON.parse(localStorage.getItem("dd-welcome-note") || "null");
    if (note && note.text) { var p = document.createElement("p"); p.className = "splash-note"; p.textContent = "\u201C" + note.text + "\u201D"; if (note.from) { var s = document.createElement("small"); s.textContent = "\u2014 " + note.from; p.appendChild(s); } sub.parentNode.insertBefore(p, sub.nextSibling); }
  } catch (e) {}
  var done = false;
  function close() { if (done) return; done = true; el.classList.add("splash-out"); setTimeout(function () { if (el.parentNode) el.remove(); }, 450); }
  el.addEventListener("click", close);
  setTimeout(close, first ? 2400 : 1500);
})();
