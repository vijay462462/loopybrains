// RGUKT Spark service worker, v36
// Cache versioned assets only. Never cache index.html so updates deploy instantly.
const CACHE = 'spark-v488';
const SHELL = [
  './style.css?v=488',
  './brain-solver.js?v=488',
  './brain-report.js?v=488',
  './brain-safety.js?v=488',
  './brain-modes.js?v=488',
  './brain-packs.js?v=488',
  './brain-diagrams.js?v=488',
  './brain-diagrams2.js?v=488',
  './brain-packs-ece.js?v=488',
  './brain-simple.js?v=488',
  './sparkbot.css?v=488',
  './config.js?v=488',
  './quiz.js?v=488',
  './splash.js?v=488',
  './plus-data.js?v=488',
  './colleges-ap.js?v=488',
  './colleges-ap2.js?v=488',
  './colleges-ap3.js?v=488',
  './college-data.js?v=488',
  './rgukt-curriculum.js?v=488',
  './curiosity.js?v=488',
  './rgukt-units.js?v=488',
  './lazy.js?v=488',
  './colleges-india.js?v=488',
  './app.js?v=488',
  './sparkbot.js?v=488',
  './player.js?v=488',
  './player.css?v=488',
  './tools-core.js?v=488',
  './tools-math.js?v=488',
  './tools-eng.js?v=488',
  './tools-life.js?v=488',
  './lab.js?v=488',
  './lab.css?v=488',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
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
