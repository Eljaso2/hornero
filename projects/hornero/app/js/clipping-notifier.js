// ===== Hornero APP — Clipping Notifier =====
// Detecta nuevas ediciones de clipping comparando version
// contra lastSeenClippingVersion en IndexedDB
// Actualiza propiedad newClippingAvailable en <hornero-app>
// Depende de: db.js

var _clipPollInterval = null;
var _lastSeenVersion = null;
var _lastSeenNumero = 0;
var _currentServerVersion = null;
var _currentServerNumero = 0;

// ===== Init =====
function initClippingNotifier() {
  // Leer lastSeenVersion de IndexedDB
  if (typeof dbGet === 'function') {
    dbGet('uiState', 'lastSeenClippingVersion').then(function(record) {
      _lastSeenVersion = record ? record.value : null;
      // También leer numero como fallback
      return dbGet('uiState', 'lastSeenClippingNumero');
    }).then(function(record) {
      _lastSeenNumero = record ? record.value : 0;
      startClippingPolling();
    }).catch(function(e) {
      console.warn('Clipping notifier: IndexedDB read failed', e);
      startClippingPolling();
    });
  } else {
    startClippingPolling();
  }
}

function startClippingPolling() {
  // Check inmediato al inicio
  checkForNewClipping();

  // Polling cada 5 minutos, solo cuando tab visible
  _clipPollInterval = setInterval(function() {
    if (document.visibilityState === 'visible') {
      checkForNewClipping();
    }
  }, 300000); // 5 minutos

  // Check inmediato cuando tab vuelve a ser visible
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      checkForNewClipping();
    }
  });
}

// ===== Check =====
function checkForNewClipping() {
  fetch('data/clipping-index.json', { cache: 'no-cache' })
    .then(function(r) { return r.json(); })
    .then(function(idx) {
      var serverVersion = idx.version || '';
      var ediciones = idx.ediciones || [];
      var latestNumero = ediciones.length > 0 ? ediciones[0].numero : 0;
      var latestFecha = ediciones.length > 0 ? ediciones[0].fecha : '';

      _currentServerVersion = serverVersion;
      _currentServerNumero = latestNumero;

      // Detectar nuevo clipping:
      // - Si _lastSeenVersion es null (primera vez): NO notificar, solo registrar
      // - Si version cambió desde lastSeen: notificar
      // - Fallback: si numero cambió desde lastSeenNumero
      var isNew = false;
      if (_lastSeenVersion !== null) {
        isNew = (serverVersion !== _lastSeenVersion) || (latestNumero > _lastSeenNumero);
      }

      if (isNew) {
        // Chequear si fue dismissado para esta version
        if (typeof dbGet === 'function') {
          dbGet('uiState', 'notificationDismissed').then(function(dismissed) {
            if (dismissed) {
              try {
                var dismissedData = JSON.parse(dismissed.value);
                if (dismissedData.version === serverVersion) {
                  // Ya fue dismissado — solo mostrar badge, no banner
                  _setNewClippingState(true, false, latestNumero, latestFecha, serverVersion);
                  return;
                }
              } catch(e) {}
            }
            // No dismissado — mostrar banner + badge
            _setNewClippingState(true, true, latestNumero, latestFecha, serverVersion);
          });
        } else {
          _setNewClippingState(true, true, latestNumero, latestFecha, serverVersion);
        }

        // Dispatch DOM event
        document.dispatchEvent(new CustomEvent('clipping-new-edition', {
          detail: { numero: latestNumero, fecha: latestFecha, version: serverVersion }
        }));
      } else if (_lastSeenVersion === null) {
        // Primera visita: registrar version actual como lastSeen
        acknowledgeClipping(serverVersion);
      }
    })
    .catch(function(e) {
      // Offline o error — silencioso, no notificar
      console.warn('Clipping notifier: poll failed', e);
    });
}

// ===== State update =====
function _setNewClippingState(available, showBanner, numero, fecha, version) {
  var app = document.querySelector('hornero-app');
  if (app) {
    app.newClippingAvailable = available;
    app._clipBannerVisible = showBanner;
    app._newClipNumero = numero;
    app._newClipFecha = fecha;
    app._newClipVersion = version;
    app.render();
  }
}

// ===== Acknowledge =====
function acknowledgeClipping(version) {
  _lastSeenVersion = version;
  // También registrar numero
  if (_currentServerNumero) {
    _lastSeenNumero = _currentServerNumero;
  }

  if (typeof dbPut === 'function') {
    dbPut('uiState', { key: 'lastSeenClippingVersion', value: version });
    dbPut('uiState', { key: 'lastSeenClippingNumero', value: _lastSeenNumero });
  }

  // Clear notification state
  var app = document.querySelector('hornero-app');
  if (app) {
    app.newClippingAvailable = false;
    app._clipBannerVisible = false;
    app.render();
  }
}

// ===== Dismiss =====
function dismissClippingNotification(version) {
  if (typeof dbPut === 'function') {
    dbPut('uiState', { key: 'notificationDismissed', value: JSON.stringify({
      version: version, timestamp: Date.now()
    })});
  }

  var app = document.querySelector('hornero-app');
  if (app) {
    app._clipBannerVisible = false;
    // Keep badge visible (newClippingAvailable stays true until user visits clipping)
    app.render();
  }
}
