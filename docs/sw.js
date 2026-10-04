// RGUKT Spark service worker — v36
// Cache versioned assets only. Never cache index.html so updates deploy instantly.
const CACHE = 'spark-v286';
const SHELL = [
  './style.css?v=286',
  './sparkbot.css?v=286',
  './config.js?v=286',
  './quiz.js?v=286',
  './splash.js?v=286',
  './plus-data.js?v=286',
  './colleges-ap.js?v=286',
  './colleges-ap2.js?v=286',
  './colleges-ap3.js?v=286',
  './college-data.js?v=286',
  './rgukt-curriculum.js?v=286',
  './colleges-india.js?v=286',
  './app.js?v=286',
  './sparkbot.js?v=286',
  './player.js?v=286',
  './player.css?v=286',
  './tools-core.js?v=286',
  './tools-math.js?v=286',
  './tools-eng.js?v=286',
  './tools-life.js?v=286',
  './lab.js?v=286',
  './lab.css?v=286',
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
