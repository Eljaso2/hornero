// Hornero PWA — Service Worker v1
// Cachea todo para funcionamiento offline

var CACHE_NAME = 'hornero-v1';
var ASSETS = [
  './Hornero Integrada — standalone WhatsApp.html',
  './manifest.json',
  './hornero-icon-192.png',
  './hornero-icon-512.png',
  'https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap'
];

// Install: cache all assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
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
        // Cache new requests dynamically (fonts CSS, font files, etc.)
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Fallback: return cached HTML for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./Hornero Integrada — standalone WhatsApp.html');
        }
      });
    })
  );
});
