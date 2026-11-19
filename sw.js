/* Games by FC — offline support.
   Pages: try the network first so updates show up straight away,
   fall back to the saved copy when offline.
   Everything else (icons, fonts): use the saved copy, refresh in the background.
   When you add a game, add its folder to PAGES and bump VERSION. */

var VERSION = 'gbfc-v3';
var PAGES = [
  './',
  './velocity/',
  './pappies-monopoly/',
  './shaman/',
  './neon-3026/',
  './time-hole/',
  './harvest-tide/'
];
var ASSETS = [
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(PAGES.concat(ASSETS)); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isFont(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin && !isFont(url)) return;

  // Pages: network first
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || caches.match('./');
        });
      })
    );
    return;
  }

  // Game code (scripts, styles, data) on this site: also network first,
  // so a game made of many files (like Harvest Tide) never mixes old and new parts.
  if (url.origin === self.location.origin && /\.(m?js|css|json|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // Everything else (images, fonts): cached copy, refreshed in the background
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
