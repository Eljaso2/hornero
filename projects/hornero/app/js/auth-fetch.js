// ===== Hornero — Auth Fetch Wrapper =====
// Intercepts all /api/* fetch calls:
// - Attaches Authorization: Bearer <token> when available
// - On 401: tries refresh token, retries once
// - On 403 (email not confirmed): triggers re-auth
// - If refresh fails: triggers re-auth (login popup)

(function() {
  'use strict';

  // ===== Token storage =====
  var _accessToken = null;

  function getAccessToken() {
    if (_accessToken) return _accessToken;
    // Restore from sessionStorage (survives page refresh within tab)
    try {
      _accessToken = sessionStorage.getItem('hornero-access-token');
    } catch(e) {}
    return _accessToken;
  }

  function setAccessToken(token) {
    _accessToken = token;
    try {
      if (token) sessionStorage.setItem('hornero-access-token', token);
      else sessionStorage.removeItem('hornero-access-token');
    } catch(e) {}
  }

  function getRefreshToken() {
    // Read from IndexedDB (async) — callers must handle promise
    if (typeof dbGet === 'function') {
      return dbGet('uiState', 'auth_tokens').then(function(data) {
        return data ? data.refresh_token : null;
      }).catch(function() { return null; });
    }
    return Promise.resolve(null);
  }

  function setRefreshToken(token) {
    if (typeof dbPut === 'function') {
      return dbPut('uiState', { key: 'auth_tokens', refresh_token: token }).catch(function(e) {
        console.warn('auth-fetch: failed to store refresh token', e);
      });
    }
    return Promise.resolve();
  }

  function clearTokens() {
    setAccessToken(null);
    _accessToken = null;
    try { sessionStorage.removeItem('hornero-access-token'); } catch(e) {}
    if (typeof dbPut === 'function') {
      dbPut('uiState', { key: 'auth_tokens', refresh_token: null }).catch(function() {});
    }
  }

  // ===== Refresh logic =====
  var _refreshing = null;  // singleton promise

  function tryRefreshToken() {
    if (_refreshing) return _refreshing;
    _refreshing = getRefreshToken().then(function(refreshToken) {
      if (!refreshToken) return false;
      var baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() : '';
      return fetch(baseUrl + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      }).then(function(res) {
        if (!res.ok) return false;
        return res.json();
      }).then(function(data) {
        if (data && data.access_token) {
          setAccessToken(data.access_token);
          return true;
        }
        return false;
      }).catch(function() {
        return false;
      }).finally(function() {
        _refreshing = null;
      });
    });
    return _refreshing;
  }

  // ===== Re-auth trigger =====
  function triggerReauth(reason) {
    clearTokens();
    // Dispatch event so hornero-app shows login popup
    document.dispatchEvent(new CustomEvent('hornero-reauth-required', {
      bubbles: true,
      detail: { reason: reason || 'session_expired' }
    }));
  }

  // ===== Fetch interceptor =====
  var originalFetch = window.fetch;
  var _isRefreshing = false;
  var _refreshPromise = null;  // Shared refresh promise for concurrent requests

  window.fetch = function(url, options) {
    options = options || {};

    // Only intercept /api/* calls to the Hornero backend
    var isHorneroApi = typeof url === 'string' && url.indexOf('/api/') !== -1;

    if (isHorneroApi && getAccessToken()) {
      options.headers = options.headers || {};
      if (typeof options.headers === 'object' && !Array.isArray(options.headers)) {
        options.headers['Authorization'] = 'Bearer ' + getAccessToken();
      }
    }

    return originalFetch.call(this, url, options).then(function(response) {
      // On 403 (email not confirmed), force re-auth
      if (response.status === 403 && isHorneroApi) {
        triggerReauth('email_not_confirmed');
        return response;
      }
      // On 401, try refresh once (coalesced for concurrent requests)
      if (response.status === 401 && isHorneroApi) {
        // Coalesce: if a refresh is already in progress, wait for it
        if (!_refreshPromise) {
          _refreshPromise = tryRefreshToken().then(function(refreshed) {
            _refreshPromise = null;  // Clear after completion
            return refreshed;
          });
        }
        return _refreshPromise.then(function(refreshed) {
          if (refreshed) {
            // Retry with new token
            options.headers = options.headers || {};
            options.headers['Authorization'] = 'Bearer ' + getAccessToken();
            return originalFetch.call(this, url, options);
          }
          // Refresh failed — trigger re-auth
          triggerReauth('session_expired');
          return response;  // Return original 401 response
        }.bind(this));
      }
      return response;
    });
  };

  // ===== Public API =====
  window.horneroAuth = {
    getAccessToken: getAccessToken,
    setAccessToken: setAccessToken,
    getRefreshToken: getRefreshToken,
    setRefreshToken: setRefreshToken,
    clearTokens: clearTokens,
    tryRefreshToken: tryRefreshToken,
    triggerReauth: triggerReauth
  };

})();
