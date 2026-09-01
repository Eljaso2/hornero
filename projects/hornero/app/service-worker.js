// Hornero PWA — Service Worker v9
// DEV MODE: bypass Chrome HTTP cache — force network on every request
// All app code fetches use { cache: 'no-cache' } to ignore Chrome's internal cache
// This means: push changes → open app → see changes immediately, no cache clearing
// Production: revert to stale-while-revalidate and remove { cache: 'no-cache' }

var CACHE_NAME = 'hornero-v746'
var ASSETS = [
  './css/hornero.css',
  './js/hornero-api.js',
  './js/auth-fetch.js',
  './js/db.js',
  './js/data-loader.js',
  './js/navigation.js',
  './js/state.js',
  './js/push-subscription.js',
  './js/clipping-notifier.js',
  './data/is-piloto-aceitero.json',
  './data/mate-index.json',
  './data/mate-2026-07.json',
  './data/mate-2026-06.json',
  './data/mate-2026-05.json',
  './data/clipping-index.json',
  './data/clipping-2026-08-25.json',
  './data/clipping-2026-08-19.json',
  './data/clipping-2026-08-16.json',
  './data/clipping-2026-08-09.json',
  './data/clipping-2026-08-02.json',
  './data/clipping-2026-07-28.json',
  './data/clipping-2026-07-02.json',
  './data/clipping-2026-06-26.json',
  './data/clipping-2026-06-24.json',
  './data/clipping-2026-06-22.json',
  './data/clipping-4.json',
  './data/agenda-2026-07.json',
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
  './lit/hornero-login.js',
  './confirm.html',
  './lit/hornero-contenido.js',
  './lit/hornero-consulta.js',
  './lit/hornero-clipping.js',
  './lit/hornero-infomate.js',
  './lit/hornero-gremial.js',
  './lit/hornero-historiador.js',
  './lit/hornero-perfil.js',
  './manifest.json',
  './assets/hornero-icon-192.png',
  './assets/hornero-icon-512.png',
  './assets/hornero-logo-192.png',
  './assets/hornero-logo-512.png',
  './assets/hornero-login-logo.png',
  './assets/hornero-logo.png',
  './assets/hornero-brand-typo-white.png',
  './assets/hornero-brand-typo-dark.png',
  './assets/dreamina-2026-07-30-5682-Change_the_background_to_solid__pure_whi...-removebg-preview.png',
  './assets/hornero-logo-nobg.png',
  './assets/hornero-brand-creative.png',
  './assets/personajes/a01.png',
  './assets/personajes/a02.png',
  './assets/personajes/a03.png',
  './assets/personajes/a04.png',
  './assets/personajes/a05.png',
  './assets/actualidad-bg.png',
  './assets/infomate-bg.png',
  './assets/infomate/inflacion.jpeg',
  './assets/infomate/salarios.jpeg',
  './assets/infomate/transferencia.jpeg',
  './assets/infomate/jubilaciones.jpeg',
  './assets/infomate/actividad.jpeg',
  './assets/infomate/empleo.jpeg',
  './assets/infomate/recortes.jpeg',
  './assets/infomate/endeudamiento.jpeg',
  './assets/panorama-bg.png'
];

// Install: cache core assets individually (resilient — skip failures)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        ASSETS.map(function(url) {
          return cache.add(new Request(url, { cache: 'no-cache' })).catch(function(err) {
            console.warn('SW: failed to cache', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches + claim clients FIRST + then notify
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
             .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      // Claim clients FIRST — ensure new SW controls page before notifying
      return self.clients.claim();
    }).then(function() {
      // Now notify all clients that update is ready
      return self.clients.matchAll();
    }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'SW_UPDATE_AVAILABLE', version: CACHE_NAME, timestamp: Date.now() });
      });
    })
  );
});

// Fetch strategy:
// - HTML pages: network-first (always get latest)
// - JS/CSS/JSON (app code): stale-while-revalidate (fast from cache, update in background)
// - Fonts/images: cache-first
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // HTML pages: network-first — bypass Chrome HTTP cache (force fresh)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' }).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./app-ho.html');
        });
      })
    );
    return;
  }

  // App code (JS, CSS, JSON): network-first — bypass Chrome HTTP cache (force fresh)
  // Every fetch goes to the server, not to Chrome's internal cache
  var isAppCode = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.json');
  if (isAppCode && url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' }).then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Network failed — serve from cache (offline fallback)
        return caches.match(event.request).then(function(cached) {
          return cached || new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Images (personajes etc): stale-while-revalidate — show cached, update in background
  var isImage = url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/);
  if (isImage && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request, { cache: 'no-cache' }).then(function(response) {
          if (response && response.status === 200) {
            var responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(function() {
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cross-origin requests (e.g. backend API at Render): don't intercept, let browser handle
  if (url.origin !== self.location.origin) {
    return;
  }

  // Everything else (fonts): cache-first
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

// ===== Push notification handler =====
self.addEventListener('push', function(event) {
  var data = {};
  if (event.data) {
    try { data = event.data.json(); } catch(e) {}
  }
  var title = data.title || '📰 Nuevo clipping disponible';
  var body = data.body || 'Edición N°' + (data.numero || '');
  var options = {
    body: body,
    icon: './assets/hornero-logo-192.png',
    badge: './assets/hornero-logo-192.png',
    data: { screen: 'clipping', edicion: data.numero || 0 },
    vibrate: [100, 50, 100],
    tag: 'clipping-new-edition'  // Reemplaza notificaciones previas del mismo tipo
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ===== Notification click handler =====
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var edicion = event.notification.data && event.notification.data.edicion;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Si hay una ventana abierta, enfocarla y navegar a clipping
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].visibilityState === 'visible' || windowClients[i].focused) {
          windowClients[i].postMessage({ type: 'NAVIGATE_CLIPPING', edicion: edicion });
          return windowClients[i].focus();
        }
      }
      // Si no hay ventana abierta, abrir nueva
      return clients.openWindow('./app-ho.html#clipping');
    })
  );
});
