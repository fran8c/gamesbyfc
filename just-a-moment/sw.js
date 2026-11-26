// Just a Moment! offline cache. The game page is fetched fresh when online (so updates arrive);
// pictures come from the cache. Bump GAME_VER in core.js for each release.
const CACHE = 'just-a-moment-v9-single';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const page = req.mode === 'navigate' || req.url.endsWith('.html') || req.url.endsWith('/');
  if (page) e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  else e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
