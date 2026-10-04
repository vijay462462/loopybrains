// RGUKT Spark service worker — v36
// Cache versioned assets only. Never cache index.html so updates deploy instantly.
const CACHE = 'spark-v269';
const SHELL = [
  './style.css?v=269',
  './sparkbot.css?v=269',
  './config.js?v=269',
  './quiz.js?v=269',
  './splash.js?v=269',
  './plus-data.js?v=269',
  './colleges-ap.js?v=269',
  './colleges-ap2.js?v=269',
  './colleges-ap3.js?v=269',
  './college-data.js?v=269',
  './colleges-india.js?v=269',
  './app.js?v=269',
  './sparkbot.js?v=269',
  './player.js?v=269',
  './player.css?v=269',
  './tools-core.js?v=269',
  './tools-math.js?v=269',
  './tools-eng.js?v=269',
  './tools-life.js?v=269',
  './lab.js?v=269',
  './lab.css?v=269',
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
