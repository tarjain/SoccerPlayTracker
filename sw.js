// Caches the app shell so it opens with no internet at the field.
// Bump VERSION whenever index.html changes so iPads pick up the new copy.
const VERSION = 'sideline-subs-v2';
const FILES = ['./', './index.html', './manifest.json', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    // Google Fonts: use the network when there is one, fall back to the cached copy.
    e.respondWith(caches.open(VERSION).then(c =>
      fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; })
        .catch(() => c.match(e.request))));
    return;
  }
  // App files: network first so updates arrive, cache when offline.
  e.respondWith(fetch(e.request)
    .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
