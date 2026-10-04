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
  var bubble = document.getElementById("splashBubble"), visits = 1;
  try { visits = (JSON.parse(localStorage.getItem("dd-visits") || "{}").n || 0) + 1; } catch (e) {}
  var say = first ? "Hi! I\u2019m Loopy \u{1F916}, your CampusLoop buddy. Ask doubts without fear, learn something new every day, and grow with the whole family!"
    : name ? "Hi " + name + "! Great to see you again \u{1F44B} Day " + visits + " with the family. Shall we ace today\u2019s quiz?" : "Welcome back! I\u2019m Loopy \u{1F916}. Ready to learn something new today?";
  var i = 0, typer = setInterval(function () { if (!bubble) { clearInterval(typer); return; } i += 2; bubble.textContent = say.slice(0, i); if (i >= say.length) clearInterval(typer); }, 28);
  el.setAttribute("data-live", "1");                    // JS is running: switch off the CSS safety timer
  var done = false;
  function close() { if (done) return; done = true; clearInterval(typer); el.classList.add("splash-out"); setTimeout(function () { if (el.parentNode) el.remove(); }, 450); }
  var go = document.getElementById("splashGo"); if (go) go.addEventListener("click", close);
  if (!first) el.addEventListener("click", close);      // returning students: tap anywhere
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === "Escape") close(); });
  if (!first) setTimeout(close, 15000);                 // new students stay until they press Continue
})();
