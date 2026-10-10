// RGUKT Spark service worker, v36
// Cache versioned assets only. Never cache index.html so updates deploy instantly.
const CACHE = 'spark-v506';
const SHELL = [
  './style.css?v=506',
  './brain-solver.js?v=506',
  './brain-report.js?v=506',
  './brain-safety.js?v=506',
  './brain-modes.js?v=506',
  './brain-packs.js?v=506',
  './brain-diagrams.js?v=506',
  './brain-diagrams2.js?v=506',
  './brain-packs-ece.js?v=506',
  './brain-simple.js?v=506',
  './brain-search.js?v=506',
  './pptx-lite.js?v=506',
  './dld-questions.js?v=506',
  './sparkbot.css?v=506',
  './config.js?v=506',
  './quiz.js?v=506',
  './splash.js?v=506',
  './plus-data.js?v=506',
  './colleges-ap.js?v=506',
  './colleges-ap2.js?v=506',
  './colleges-ap3.js?v=506',
  './college-data.js?v=506',
  './rgukt-curriculum.js?v=506',
  './curiosity.js?v=506',
  './rgukt-units.js?v=506',
  './lazy.js?v=506',
  './colleges-india.js?v=506',
  './app.js?v=506',
  './sparkbot.js?v=506',
  './player.js?v=506',
  './player.css?v=506',
  './tools-core.js?v=506',
  './tools-math.js?v=506',
  './tools-eng.js?v=506',
  './tools-life.js?v=506',
  './lab.js?v=506',
  './lab.css?v=506',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './brand/loopy-brains-promo-480.png',
  './brand/loopy-brains-wordmark-480.png',
  './brand/loopy-brains-wordmark-56h.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (new URL(url).origin !== self.location.origin) return;
  if (url.includes('firebase') || url.includes('gstatic.com') || url.includes('googleapis.com')) return;
  if (e.request.destination === 'document' || e.request.mode === 'navigate') return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});

// Web push (needs the push server to be switched on). Data-only messages: we build the notification here so nothing private is shown on a locked screen.
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) {}
  const data = d.data || d, title = String(data.title || 'Loopy Brains').slice(0, 60), body = String(data.body || 'You have a new update.').slice(0, 120);
  e.waitUntil(self.registration.showNotification(title, { body, icon: './icon-192.png', badge: './favicon-32.png', tag: String(data.tag || 'campusloop').slice(0, 60), data: { url: './' + (/^#[a-z]{3,12}(\/[A-Za-z0-9_-]{1,60})?$/.test(String(data.hash || '')) ? data.hash : '') } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { for (const c of list) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.navigate && c.navigate(url); return c.focus(); } } return self.clients.openWindow(url); }));
});
