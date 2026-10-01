// RGUKT Spark service worker — v30
// Cache app shell for instant load; let Firebase data always go to network.
const CACHE = 'spark-v30';
const SHELL = [
  './',
  './style.css?v=30',
  './config.js?v=30',
  './quiz.js?v=30',
  './app.js?v=30',
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
  // Never cache Firebase / Google APIs — they must always go to network.
  if (url.includes('firebase') || url.includes('gstatic.com') || url.includes('googleapis.com') || url.includes('firestore.googleapis.com')) return;
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
