// RGUKT Spark service worker — v32
// Cache versioned assets only. Never cache index.html so updates deploy instantly.
const CACHE = 'spark-v32';
const SHELL = [
  // Note: './' (index.html) is intentionally NOT cached — always serve fresh so
  // new versions reach users without needing a manual cache clear.
  './style.css?v=32',
  './config.js?v=32',
  './quiz.js?v=32',
  './app.js?v=32',
  './manifest.json',
  './icon.svg',
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
  // Never intercept Firebase / Google APIs — must always go to network.
  if (url.includes('firebase') || url.includes('gstatic.com') || url.includes('googleapis.com')) return;
  // Never cache HTML documents — always fetch fresh so SW updates deploy instantly.
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
