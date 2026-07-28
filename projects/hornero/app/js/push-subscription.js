// ===== Hornero APP — Push Subscription =====
// Gestiona suscripción Web Push: permisos, VAPID, registro en backend
// Depende de: service-worker.js registrado, db.js

// VAPID public key — se obtiene del backend en init
var _vapidPublicKey = '';
var _pushBackendUrl = '';
var _isSubscribed = false;

// ===== Init =====
function initPushSubscription() {
  // Solo si el browser soporta push
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push: browser no soporta Web Push');
    return;
  }

  // Detectar backend URL desde la config
  _detectBackendUrl();

  // Obtener VAPID key del backend
  _fetchVapidKey();

  // Verificar estado actual de suscripción
  navigator.serviceWorker.ready.then(function(reg) {
    reg.pushManager.getSubscription().then(function(sub) {
      _isSubscribed = !!(sub && sub.endpoint);
      console.log('Push: suscripción actual =', _isSubscribed);
      // Actualizar UI
      _updatePushUI();
    });
  });
}

function _detectBackendUrl() {
  // Intentar obtener de la config del backend
  _pushBackendUrl = window._hoBackendUrl || '';
  // Fallback: deducir desde el host
  if (!_pushBackendUrl) {
    if (window.location.hostname === 'eljaso2.github.io' || window.location.hostname.includes('github.io')) {
      _pushBackendUrl = 'https://hornero-ia.onrender.com';
    } else {
      _pushBackendUrl = 'http://localhost:8000';
    }
  }
}

function _fetchVapidKey() {
  if (!_pushBackendUrl) return;
  fetch(_pushBackendUrl + '/api/push/vapid-key')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.publicKey) {
        _vapidPublicKey = data.publicKey;
        console.log('Push: VAPID key recibida');
      }
    })
    .catch(function(e) {
      console.warn('Push: no se pudo obtener VAPID key del backend', e);
    });
}

// ===== Request permission =====
function requestNotificationPermission() {
  return new Promise(function(resolve) {
    if (!('Notification' in window)) {
      resolve('unsupported');
      return;
    }
    Notification.requestPermission(function(result) {
      console.log('Push: permiso =', result);
      resolve(result);
    });
  });
}

// ===== Subscribe =====
function subscribeUser() {
  if (!_vapidPublicKey) {
    console.warn('Push: no hay VAPID key — no se puede suscribir');
    return Promise.reject('No VAPID key');
  }

  return navigator.serviceWorker.ready.then(function(reg) {
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: _urlBase64ToUint8Array(_vapidPublicKey)
    });
  }).then(function(subscription) {
    console.log('Push: suscripción creada');
    _isSubscribed = true;
    // Enviar al backend
    return _sendSubscriptionToServer(subscription);
  }).then(function() {
    _updatePushUI();
    return true;
  }).catch(function(e) {
    console.warn('Push: suscripción falló', e);
    _isSubscribed = false;
    _updatePushUI();
    throw e;
  });
}

// ===== Unsubscribe =====
function unsubscribeUser() {
  return navigator.serviceWorker.ready.then(function(reg) {
    return reg.pushManager.getSubscription();
  }).then(function(subscription) {
    if (subscription) {
      // Eliminar del backend primero
      return _removeSubscriptionFromServer(subscription).then(function() {
        return subscription.unsubscribe();
      });
    }
  }).then(function() {
    _isSubscribed = false;
    _updatePushUI();
    console.log('Push: desuscripción exitosa');
  }).catch(function(e) {
    console.warn('Push: desuscripción falló', e);
  });
}

// ===== Send to server =====
function _sendSubscriptionToServer(subscription) {
  if (!_pushBackendUrl) return Promise.reject('No backend URL');
  var subJson = subscription.toJSON();
  return fetch(_pushBackendUrl + '/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys
    })
  }).then(function(r) {
    if (!r.ok) throw new Error('Subscribe endpoint failed: ' + r.status);
    return r.json();
  });
}

function _removeSubscriptionFromServer(subscription) {
  if (!_pushBackendUrl) return Promise.resolve();
  return fetch(_pushBackendUrl + '/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  }).catch(function(e) {
    console.warn('Push: no se pudo eliminar del servidor', e);
  });
}

// ===== UI update =====
function _updatePushUI() {
  // Dispatch event for components to react
  document.dispatchEvent(new CustomEvent('push-subscription-change', {
    detail: {
      subscribed: _isSubscribed,
      permission: ('Notification' in window) ? Notification.permission : 'unsupported'
    }
  }));
}

// ===== Getters =====
function getPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function isPushSubscribed() {
  return _isSubscribed;
}

// ===== Helper: VAPID key conversion =====
function _urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
