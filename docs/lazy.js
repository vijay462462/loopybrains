// Loads the big optional tools (Loopy chat, Study Lab, music player, power tools) after the app is on screen, so the first screen appears faster.
// They start loading when the phone is idle, on the first touch or scroll, or when a panel asks for them (window.__lazy.now()).
(function () {
  "use strict";
  var me = document.currentScript, v = ((me && me.src.match(/[?&]v=(\d+)/)) || [])[1] || "", started = false, done = false;
  function add(name, cb) {
    var s = document.createElement("script"); s.src = name + (v ? "?v=" + v : "");
    s.onload = s.onerror = function () { if (cb) cb(); }; document.body.appendChild(s);
  }
  function load() {
    if (started) return; started = true;
    var left = 0, fin = function () { if (--left <= 0 && !done) { done = true; document.dispatchEvent(new Event("lazy-ready")); } };
    var more = ["tools-math.js", "tools-eng.js", "tools-life.js", "lab.js", "player.js", "sparkbot.js"];
    left = more.length + 1;
    add("tools-core.js", function () { fin(); more.slice(0, 3).forEach(function (n) { add(n, fin); }); });
    more.slice(3).forEach(function (n) { add(n, fin); });
    left += 0;
  }
  window.__lazy = { now: load, isDone: function () { return done; } };
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (ev) { addEventListener(ev, load, { once: true, passive: true }); });
  if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 2500 }); else setTimeout(load, 1500);
})();
