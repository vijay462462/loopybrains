// RGUKT Spark service worker — v36
// Cache versioned assets only. Never cache index.html so updates deploy instantly.
const CACHE = 'spark-v151';
const SHELL = [
  './style.css?v=151',
  './sparkbot.css?v=151',
  './config.js?v=151',
  './quiz.js?v=151',
  './app.js?v=151',
  './sparkbot.js?v=151',
  './player.js?v=151',
  './player.css?v=151',
  './tools-core.js?v=151',
  './tools-math.js?v=151',
  './tools-eng.js?v=151',
  './lab.js?v=151',
  './lab.css?v=151',
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
