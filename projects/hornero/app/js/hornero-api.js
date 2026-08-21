/**
 * hornero-api.js — Shared API utilities for Hornero app
 *
 * Handles Render free tier cold starts: wakeup ping + retry + timeout.
 * Replaces duplicated _fetchWithTimeout() and URL detection across components.
 *
 * Exports:
 *   getBackendUrl()  — detect backend URL (localhost vs production)
 *   wakeUpBackend()  — ping /api/health to wake hibernating Render (cached 5min)
 *   apiFetch(url, options, retries) — fetch with auto-wakeup, timeout, retry
 */

// ===== Backend URL detection =====

var _cachedBackendUrl = null;

function getBackendUrl() {
  if (_cachedBackendUrl) return _cachedBackendUrl;

  // Allow localStorage override (for development)
  try {
    var stored = localStorage.getItem('hornero-backend-url');
    if (stored) { _cachedBackendUrl = stored; return stored; }
  } catch(e) {}

  var h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
    _cachedBackendUrl = 'http://' + h + ':8000';
  } else {
    _cachedBackendUrl = 'https://hornero-ia.onrender.com';
  }
  return _cachedBackendUrl;
}


// ===== Wakeup (cold start) =====

var _wakeUpPromise = null;
var _lastWakeUpTime = 0;
var WAKE_UP_CACHE_MS = 5 * 60 * 1000;  // 5 minutes

/**
 * Ping /api/health to wake up a hibernating Render instance.
 * Cached: if backend was confirmed awake in the last 5min, returns immediately.
 * Returns: true if backend is awake, false if unreachable.
 */
async function wakeUpBackend() {
  // Return cached result if recently confirmed awake
  var now = Date.now();
  if (now - _lastWakeUpTime < WAKE_UP_CACHE_MS) {
    return true;
  }

  // Deduplicate concurrent calls
  if (_wakeUpPromise) return _wakeUpPromise;

  _wakeUpPromise = _doWakeUp();
  try {
    return await _wakeUpPromise;
  } finally {
    _wakeUpPromise = null;
  }
}

async function _doWakeUp() {
  var baseUrl = getBackendUrl();
  var healthUrl = baseUrl + '/api/health';

  try {
    var res = await fetch(healthUrl, { signal: AbortSignal.timeout(60000) });
    if (res.ok) {
      _lastWakeUpTime = Date.now();
      return true;
    }
    // Non-OK response still means server is awake
    _lastWakeUpTime = Date.now();
    return true;
  } catch(e) {
    // Server unreachable (hibernating or network error)
    return false;
  }
}


// ===== apiFetch: fetch with wakeup + timeout + retry =====

/**
 * Drop-in replacement for fetch() with:
 *   - Auto-wakeup: pings /api/health if backend might be hibernating
 *   - Configurable timeout (default 30s)
 *   - Retry with exponential backoff (5s, 10s, 20s)
 *   - Only retries on network errors (not on 4xx/5xx responses)
 *
 * @param {string} url - Full URL to fetch
 * @param {object} options - fetch options (method, headers, body, etc.)
 * @param {number} retries - Max retries on network error (default 3)
 * @param {number} timeoutMs - Per-attempt timeout in ms (default 30000)
 * @returns {Promise<Response>}
 */
async function apiFetch(url, options, retries, timeoutMs) {
  if (retries === undefined) retries = 3;
  if (timeoutMs === undefined) timeoutMs = 30000;

  // Wake up backend before first attempt
  await wakeUpBackend();

  for (var attempt = 1; attempt <= retries; attempt++) {
    try {
      var res = await fetch(url, {
        ...options,
        signal: options?.signal || AbortSignal.timeout(timeoutMs),
      });
      // Got a response (even 4xx/5xx) — no retry, return it
      return res;
    } catch(e) {
      // Only retry on network errors, not on AbortSignal from caller
      if (e.name === 'AbortError' && options?.signal?.aborted) {
        throw e;  // Caller aborted, don't retry
      }
      if (attempt < retries) {
        var delay = 5000 * Math.pow(2, attempt - 1);  // 5s, 10s, 20s
        await new Promise(function(r) { setTimeout(r, delay); });
      } else {
        throw e;  // All retries exhausted
      }
    }
  }
}

// ===== Export as global (no module bundler) =====

window.HorneroAPI = {
  getBackendUrl: getBackendUrl,
  wakeUpBackend: wakeUpBackend,
  apiFetch: apiFetch,
};
