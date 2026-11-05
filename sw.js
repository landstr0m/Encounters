// Offline cache. Serves saved files instantly, then refreshes them in the background,
// so a new version you publish shows up the next time you open the app (online once).
var CACHE = 'encounter-tracker-v40';
var FILES = ['./', 'index.html', 'monsters.json', 'reference.json', 'spells-phb.json', 'fonts.css', 'statuses.js', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) c.put(req.url.split('?')[0], res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
