// Hornero PWA — Service Worker v6
// Install: cachea assets core (sin Google Fonts — se cachean dinámico)
// Fetch: cache-first, pero HTML siempre del network (para updates en tiempo real)
// Resilient install: cada asset individual, un fallo no mata todo
// Auto-update: notifica a la app cuando hay una nueva versión disponible

var CACHE_NAME = 'hornero-v6';
var ASSETS = [
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

// Activate: clean old caches + take control + notify clients
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
             .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.matchAll();
    }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
      });
    })
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML pages: network-first (always get latest for real-time updates)
// - Static assets (JS, CSS, JSON): cache-first (fast, offline)
// - Fonts/images: cache-first
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // HTML pages: network-first for real-time updates
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        // Cache the latest HTML
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback: return cached HTML
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./app-ho.html');
        });
      })
    );
    return;
  }

  // Everything else: cache-first (fast + offline)
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
