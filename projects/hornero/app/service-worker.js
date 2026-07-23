// Hornero PWA — Service Worker v5
// Install: cachea assets core (sin Google Fonts — se cachean dinámico)
// Fetch: cache-first, offline-first
// Resilient install: cada asset individual, un fallo no mata todo

var CACHE_NAME = 'hornero-v5';
var ASSETS = [
  './app-ho.html',
  './css/hornero.css',
  './js/db.js',
  './js/data-loader.js',
  './data/is-piloto-aceitero.json',
  './data/mate-2026-05.json',
  './data/clipping-2026-07-02.json',
  './data/clipping-4.json',
  './lit/ho-component.js',
  './lit/hornero-components.js',
  './lit/hornero-app.js',
  './lit/hornero-home.js',
  './lit/hornero-is.js',
  './lit/hornero-actualidad.js',
  './lit/hornero-coyuntura.js',
  './lit/hornero-chat.js',
  './lit/hornero-ecosistema.js',
  './lit/hornero-condicion.js',
  './manifest.json',
  './assets/hornero-icon-192.png',
  './assets/hornero-icon-512.png',
  './assets/hornero-icon.svg'
];

// Install: cache core assets individually (resilient — skip failures)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('SW: failed to cache', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches + take control immediately
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
             .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first strategy (offline-first)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Cache successful responses dynamically (fonts, etc.)
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Fallback for navigation: return cached app shell
        if (event.request.mode === 'navigate') {
          return caches.match('./app-ho.html');
        }
      });
    })
  );
});
