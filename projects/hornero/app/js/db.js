// ===== Hornero APP — IndexedDB Wrapper =====
// Persistencia local para informes, fuentes primarias, correcciones y cargas
// Principio: fuentes primarias NEVER se modifican, correcciones son ADDITIVE

var HORNERO_DB = {
  name: 'hornero-app',
  version: 8,
  stores: {
    // Cargas: input del trabajador (voz/texto/foto) antes de procesar
    cargas: { keyPath: 'id', indexes: [
      { name: 'fecha', keyPath: 'fecha' },
      { name: 'trabajadorId', keyPath: 'trabajadorId' },
      { name: 'estado', keyPath: 'estado' } // 'borrador','verificado','enviado'
    ]},
    // Fuentes primarias: narrativa original del trabajador — NEVER MODIFIED
    fuentesPrimarias: { keyPath: 'id', indexes: [
      { name: 'fecha', keyPath: 'fecha' },
      { name: 'cargaId', keyPath: 'cargaId' }
    ]},
    // Informes: grado 1-4, con versiones
    informes: { keyPath: 'id', indexes: [
      { name: 'grado', keyPath: 'grado' },
      { name: 'semana', keyPath: 'semana' },
      { name: 'territorio', keyPath: 'territorio' },
      { name: 'estado', keyPath: 'estado' }, // 'pendiente','visto','corregido','enviado','publicado','aprobado-delegado','corregido-delegado'
      { name: 'username', keyPath: 'username' }, // per-user isolation
      { name: 'empresa', keyPath: 'empresa' }, // cross-user visibility: filter by plant
      { name: 'timestamp', keyPath: 'timestamp' } // for sync merge
    ]},
    // Correcciones: cada corrección es un registro ADDITIVE con trazabilidad
    correcciones: { keyPath: 'id', indexes: [
      { name: 'informeId', keyPath: 'informeId' },
      { name: 'correctorGrado', keyPath: 'correctorGrado' },
      { name: 'fecha', keyPath: 'fecha' },
      { name: 'timestamp', keyPath: 'timestamp' } // for sync merge
    ]},
    // Clipping: datos de clipping cacheados
    clipping: { keyPath: 'id', indexes: [
      { name: 'numero', keyPath: 'numero' },
      { name: 'fecha', keyPath: 'fecha' }
    ]},
    // Media: fotos/audio blobs
    media: { keyPath: 'id', indexes: [
      { name: 'cargaId', keyPath: 'cargaId' }
    ]},
    // Sync queue: operaciones pendientes cuando hay conexión
    syncQueue: { keyPath: 'id', indexes: [
      { name: 'tipo', keyPath: 'tipo' },
      { name: 'estado', keyPath: 'estado' } // 'pendiente','sincronizado','error'
    ]},
    // UI state: replaces localStorage persistence
    uiState: { keyPath: 'key' },
    // Sectores: federación, CCT, empresas, territorios
    sectores: { keyPath: 'id', indexes: [
      { name: 'federacion', keyPath: 'federacion' },
      { name: 'cct', keyPath: 'cct' }
    ]},
    // Usuarios: grade, territory, sindicato
    usuarios: { keyPath: 'id', indexes: [
      { name: 'grade', keyPath: 'grade' },
      { name: 'territorio', keyPath: 'territorio' }
    ]},
    // Convenios: CCT data, cláusulas, paritarias
    convenios: { keyPath: 'id', indexes: [
      { name: 'cctNumero', keyPath: 'cctNumero' },
      { name: 'rama', keyPath: 'rama' }
    ]},
    // Chat history: messages per section + sessionId (debate, consulta, contenido)
    chatHistory: { keyPath: 'id', indexes: [
      { name: 'section', keyPath: 'section' },
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'sessionId', keyPath: 'sessionId' },
      { name: 'username', keyPath: 'username' } // per-user isolation
    ]},
    // Biblioteca: KB chunks cached for Archivo UI (offline fallback)
    biblioteca: { keyPath: 'id', indexes: [
      { name: 'category', keyPath: 'category' },
      { name: 'tipo', keyPath: 'tipo' }
    ]}
  }
};

var db = null;

// ===== Init =====
function initDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(HORNERO_DB.name, HORNERO_DB.version);
    request.onupgradeneeded = function(event) {
      var database = event.target.result;
      Object.keys(HORNERO_DB.stores).forEach(function(storeName) {
        var storeDef = HORNERO_DB.stores[storeName];
        if (!database.objectStoreNames.contains(storeName)) {
          var store = database.createObjectStore(storeName, { keyPath: storeDef.keyPath });
          if (storeDef.indexes) {
            storeDef.indexes.forEach(function(idx) {
              store.createIndex(idx.name, idx.keyPath, { unique: false });
            });
          }
        } else {
          // Store exists — add any missing indexes (for version upgrades)
          var store = event.target.transaction.objectStore(storeName);
          if (storeDef.indexes) {
            storeDef.indexes.forEach(function(idx) {
              if (!store.indexNames.contains(idx.name)) {
                store.createIndex(idx.name, idx.keyPath, { unique: false });
              }
            });
          }
        }
      });
    };
    request.onsuccess = function(event) {
      db = event.target.result;
      resolve(db);
    };
    request.onerror = function(event) {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ===== One-time cleanup: clear chatHistory + informes + correcciones (local + backend) =====
// Runs only once (flag in localStorage), then auto-removes itself
// Bumping version triggers re-run for all users on next load
// v18: simplified — PILOT_USERS removed, local-only cleanup (backend endpoints now require auth)
var _cleanupJustRan = false;
function limpiarChatsYReportes() {
  if (localStorage.getItem('hornero-chats-cleared') === 'v18') return Promise.resolve(false);
  console.log('DB: one-time cleanup v18 — clearing local stores only');
  return dbClearStore('chatHistory').then(function() {
    return dbClearStore('informes');
  }).then(function() {
    return dbClearStore('correcciones');
  }).then(function() {
    localStorage.setItem('hornero-chats-cleared', 'v18');
    _cleanupJustRan = true;
    console.log('DB: local cleanup complete');
    return true;
  }).catch(function(e) {
    console.warn('DB: cleanup failed', e);
    return false;
  });
}

function dbClearStore(storeName) {
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(storeName, 'readwrite');
    var store = tx.objectStore(storeName);
    var request = store.clear();
    request.onsuccess = function() { resolve(); };
    request.onerror = function() { reject(request.error); };
  });
}

// ===== Generic CRUD =====
function dbPut(storeName, data) {
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(storeName, 'readwrite');
    var store = tx.objectStore(storeName);
    var request = store.put(data);
    request.onsuccess = function() { resolve(data); };
    request.onerror = function() { reject(request.error); };
  });
}

function dbGet(storeName, key) {
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(storeName, 'readonly');
    var store = tx.objectStore(storeName);
    var request = store.get(key);
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

function dbGetAll(storeName) {
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(storeName, 'readonly');
    var store = tx.objectStore(storeName);
    var request = store.getAll();
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

function dbGetByIndex(storeName, indexName, value) {
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(storeName, 'readonly');
    var store = tx.objectStore(storeName);
    var index = store.index(indexName);
    var request = index.getAll(value);
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

function dbDelete(storeName, key) {
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(storeName, 'readwrite');
    var store = tx.objectStore(storeName);
    var request = store.delete(key);
    request.onsuccess = function() { resolve(); };
    request.onerror = function() { reject(request.error); };
  });
}

// ===== Specific Functions =====

// Sectores (federación/CCT metadata)
function guardarSector(sector) { return dbPut('sectores', sector); }
function obtenerSector(id) { return dbGet('sectores', id); }
function obtenerSectoresPorFederacion(federacion) { return dbGetByIndex('sectores', 'federacion', federacion); }

// Usuarios (grade system)
function guardarUsuario(usuario) { return dbPut('usuarios', usuario); }
function obtenerUsuario(id) { return dbGet('usuarios', id); }
function obtenerUsuariosPorGrade(grade) { return dbGetByIndex('usuarios', 'grade', grade); }

// Convenios (CCT data)
function guardarConvenio(convenio) { return dbPut('convenios', convenio); }
function obtenerConvenio(id) { return dbGet('convenios', id); }
function obtenerConveniosPorNumero(cctNumero) { return dbGetByIndex('convenios', 'cctNumero', cctNumero); }
function obtenerConveniosPorRama(rama) { return dbGetByIndex('convenios', 'rama', rama); }

// Cargas (worker input)
function guardarCarga(carga) { return dbPut('cargas', carga); }
function obtenerCargas(trabajadorId) {
  if (trabajadorId) return dbGetByIndex('cargas', 'trabajadorId', trabajadorId);
  return dbGetAll('cargas');
}
function actualizarEstadoCarga(id, estado) {
  return dbGet('cargas', id).then(function(carga) {
    if (carga) { carga.estado = estado; return dbPut('cargas', carga); }
    return null;
  });
}

// Fuentes Primarias (worker narratives — NEVER MODIFIED)
function guardarFuentePrimaria(fp) { return dbPut('fuentesPrimarias', fp); }
function obtenerFuentePrimaria(id) { return dbGet('fuentesPrimarias', id); }
function obtenerFuentesPorCarga(cargaId) { return dbGetByIndex('fuentesPrimarias', 'cargaId', cargaId); }

// Informes (grades 1-4)
function guardarInforme(informe) {
  if (!informe.timestamp) informe.timestamp = Date.now();
  return dbPut('informes', informe).then(function(result) {
    _syncInformeToBackend(informe); // Push to backend (fire-and-forget)
    return result;
  });
}
function obtenerInforme(id) { return dbGet('informes', id); }
function obtenerInformesPorGrado(grado) { return dbGetByIndex('informes', 'grado', grado); }
function obtenerInformesPorEstado(estado, username) {
  if (username) {
    return dbGetByIndex('informes', 'username', username).then(function(informes) {
      return (informes || []).filter(function(inf) { return inf.estado === estado; });
    });
  }
  return dbGetByIndex('informes', 'estado', estado);
}
function obtenerInformesPorTerritorio(territorio) { return dbGetByIndex('informes', 'territorio', territorio); }

// Informes: incoming reports for a grade level (cross-user visibility)
// B.a (base): only own informes → returns empty (use obtenerInformesTodos instead)
// B.b (delegado): G1 from workers in same territory + empresa (pendiente + visto, flexible matching)
// B.c (secretario): G2 from delegates in same territory (all empresas, pendiente + visto)
// B.d (federación): G3 from all territories (pendiente + visto)
// Sync: pull remote incoming informes first, then apply local filter
function obtenerInformesEntrantes(userGrade, territorio, empresa, currentUsername) {
  // Pull remote incoming informes from backend first
  var pullPromise = _fetchAndMergeRemoteIncomingInformes(userGrade, territorio, empresa);
  return pullPromise.then(function() {
  return dbGetAll('informes').then(function(all) {
    if (!all || all.length === 0) return [];
    // Exclude current user's own informes (they belong in "Mis Reportes", not "Recibidos")
    if (currentUsername) {
      all = all.filter(function(inf) { return inf.username !== currentUsername; });
    }
    // Helper: normalize territorio for flexible comparison (handle key vs display formats)
    // e.g., 'norte-santa-fe' matches 'Norte de Santa Fe'
    function terrMatch(infTerr, userTerr) {
      if (!infTerr || !userTerr) return true;
      if (infTerr === userTerr) return true;
      var normInf = infTerr.toLowerCase().replace(/[\s\-_]/g, '');
      var normUser = userTerr.toLowerCase().replace(/[\s\-_]/g, '');
      return normInf === normUser;
    }
    // Helper: normalize empresa for flexible comparison
    function empMatch(infEmp, userEmp) {
      if (!userEmp) return true; // Delegate with no empresa → show all from territory
      if (!infEmp) return false;
      return infEmp === userEmp || infEmp.toLowerCase().trim() === userEmp.toLowerCase().trim();
    }
    // Show ALL informes from lower grade — not just unresolved.
    // Approved/revised informes stay in the list with different visual treatment.
    // Sort: pendientes first (by timestamp desc), then revisados (by timestamp desc)
    var lowerGrade;
    if (userGrade === 'B.b') {
      // Delegate sees G1 from their territory + empresa (flexible matching)
      lowerGrade = 1;
      return all.filter(function(inf) {
        return inf.grado === lowerGrade &&
               terrMatch(inf.territorio, territorio) &&
               empMatch(inf.empresa, empresa) &&
               inf.username !== '';
      }).sort(function(a, b) {
        var aPend = (a.estado === 'pendiente' || a.estado === 'visto' || a.estado === 'aceptado') ? 0 : 1;
        var bPend = (b.estado === 'pendiente' || b.estado === 'visto' || b.estado === 'aceptado') ? 0 : 1;
        if (aPend !== bPend) return aPend - bPend;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
    }
    if (userGrade === 'B.c') {
      // Secretary sees G2 from their territory (all empresas, flexible matching)
      lowerGrade = 2;
      return all.filter(function(inf) {
        return inf.grado === lowerGrade &&
               terrMatch(inf.territorio, territorio);
      }).sort(function(a, b) {
        var aPend = (a.estado === 'pendiente' || a.estado === 'visto' || a.estado === 'aceptado') ? 0 : 1;
        var bPend = (b.estado === 'pendiente' || b.estado === 'visto' || b.estado === 'aceptado') ? 0 : 1;
        if (aPend !== bPend) return aPend - bPend;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
    }
    if (userGrade === 'B.d') {
      // Federation sees G3 from all territories
      lowerGrade = 3;
      return all.filter(function(inf) {
        return inf.grado === lowerGrade;
      }).sort(function(a, b) {
        var aPend = (a.estado === 'pendiente' || a.estado === 'visto' || a.estado === 'aceptado') ? 0 : 1;
        var bPend = (b.estado === 'pendiente' || b.estado === 'visto' || b.estado === 'aceptado') ? 0 : 1;
        if (aPend !== bPend) return aPend - bPend;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
    }
    // B.a (base) — no incoming informes
    return [];
  });
  }); // cierra pullPromise.then
}

// Informes: check if delegate has unrevised G1s (for G2 eligibility)
// Only checks pendiente estado (not visto — visto means delegate already started reviewing)
function tieneG1Pendientes(username, territorio, empresa) {
  return dbGetAll('informes').then(function(all) {
    if (!all || all.length === 0) return false;
    // Helper: normalize territorio for flexible comparison
    function terrMatch(infTerr, userTerr) {
      if (!infTerr || !userTerr) return true;
      if (infTerr === userTerr) return true;
      return infTerr.toLowerCase().replace(/[\s\-_]/g, '') === userTerr.toLowerCase().replace(/[\s\-_]/g, '');
    }
    function empMatch(infEmp, userEmp) {
      if (!userEmp) return true;
      if (!infEmp) return false;
      return infEmp === userEmp || infEmp.toLowerCase().trim() === userEmp.toLowerCase().trim();
    }
    var pendientes = all.filter(function(inf) {
      return inf.grado === 1 &&
             inf.estado === 'pendiente' &&
             terrMatch(inf.territorio, territorio) &&
             empMatch(inf.empresa, empresa) &&
             inf.username !== '';
    });
    return pendientes.length > 0;
  });
}

// Informes: load all for a user (all estados), sorted by date desc
// Sync: pull remote informes first, then return local
function obtenerInformesTodos(username) {
  var pullPromise = username ? _fetchAndMergeRemoteInformes(username) : Promise.resolve();
  return pullPromise.then(function() {
    if (username) {
      return dbGetByIndex('informes', 'username', username).then(function(informes) {
        return (informes || []).sort(function(a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
      });
    }
    if (!username) return []; // No username → no informes (never leak all users' data)
  });
}

// Informes: get next number for a user (count existing + 1)
function obtenerInformeNumero(username) {
  if (username) {
    return dbGetByIndex('informes', 'username', username).then(function(informes) {
      return (informes || []).length + 1;
    });
  }
  return dbGetAll('informes').then(function(all) { return (all || []).length + 1; });
}

function actualizarEstadoInforme(id, estado) {
  return dbGet('informes', id).then(function(informe) {
    if (informe) {
      informe.estado = estado;
      informe.timestamp = Date.now(); // Update timestamp for merge
      return dbPut('informes', informe).then(function(result) {
        _syncInformeToBackend(informe); // Push estado change to backend
        return result;
      });
    }
    return null;
  });
}

// Correcciones (additive traceability)
// Sync: push on save, pull on load (same pattern as informes + chat)
function guardarCorreccion(correccion) {
  if (!correccion.timestamp) correccion.timestamp = Date.now();
  return dbPut('correcciones', correccion).then(function(result) {
    _syncCorreccionToBackend(correccion);
    return result;
  });
}
function guardarCorreccionBatch(correcciones) {
  return Promise.all(correcciones.map(function(c) {
    if (!c.timestamp) c.timestamp = Date.now();
    return dbPut('correcciones', c);
  })).then(function(results) {
    _syncCorreccionBatchToBackend(correcciones);
    return results;
  });
}
function obtenerCorrecciones(informeId) {
  return dbGetByIndex('correcciones', 'informeId', informeId).then(function(correcciones) {
    if (!correcciones || correcciones.length === 0) {
      // Fallback: fetch from backend if no local data
      return _fetchAndMergeRemoteCorrecciones(informeId);
    }
    return correcciones;
  });
}
function obtenerCorreccionesPorGrado(grado) { return dbGetByIndex('correcciones', 'correctorGrado', grado); }

// Clipping
function guardarClipping(clipping) { return dbPut('clipping', clipping); }
function obtenerClipping(numero) { return dbGetByIndex('clipping', 'numero', numero); }
function obtenerTodosClipping() { return dbGetAll('clipping'); }

// Media
function guardarMedia(media) { return dbPut('media', media); }
function obtenerMediaPorCarga(cargaId) { return dbGetByIndex('media', 'cargaId', cargaId); }

// Sync Queue
function encolarSync(operacion) { return dbPut('syncQueue', operacion); }
function obtenerSyncPendientes() { return dbGetByIndex('syncQueue', 'estado', 'pendiente'); }
function marcarSyncCompletado(id) {
  return dbGet('syncQueue', id).then(function(op) {
    if (op) { op.estado = 'sincronizado'; return dbPut('syncQueue', op); }
    return null;
  });
}

// ===== UUID Generator =====
function generarUUID() {
  return 'h-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}

// ===== Chat History =====
// Persistir mensajes de chat por sección (debate, consulta, contenido)
// Cada mensaje: { id, section, role, text, sections, tags, time, timestamp }

function guardarChatMsg(msg) {
  // Ensure msg has id and timestamp
  if (!msg.id) msg.id = generarUUID();
  if (!msg.timestamp) msg.timestamp = Date.now();
  return dbPut('chatHistory', msg).then(function(result) {
    _syncMsgToBackend(msg); // Push to backend (fire-and-forget)
    return result;
  });
}

function obtenerChatHistory(section) {
  return dbGetByIndex('chatHistory', 'section', section).then(function(messages) {
    // Sort by timestamp ascending (oldest first)
    return (messages || []).sort(function(a, b) { return a.timestamp - b.timestamp; });
  });
}

function borrarChatHistory(section) {
  return obtenerChatHistory(section).then(function(messages) {
    return Promise.all((messages || []).map(function(m) { return dbDelete('chatHistory', m.id); }));
  });
}

// ===== Chat Session Helpers =====
// Session-based chat: each visit = new sessionId, start fresh
// History shows all past sessions tagged by section

function obtenerChatSessionMessages(sessionId) {
  return dbGetByIndex('chatHistory', 'sessionId', sessionId).then(function(messages) {
    messages = (messages || []).sort(function(a, b) { return a.timestamp - b.timestamp; });
    // If no local messages, try fetching from backend
    if (messages.length === 0) {
      var session = JSON.parse(localStorage.getItem('hornero-session') || '{}');
      var username = session.username || '';
      if (username) {
        return fetchChatSessionMessagesFromBackend(username, sessionId).then(function(remoteMsgs) {
          if (remoteMsgs && remoteMsgs.length > 0) {
            // Merge into local IDB
            return _mergeRemoteMessages(remoteMsgs).then(function() {
              return remoteMsgs.sort(function(a, b) { return a.timestamp - b.timestamp; });
            });
          }
          return messages;
        });
      }
    }
    return messages;
  });
}

function obtenerChatSessions(username) {
  // Returns distinct sessions with metadata: sessionId, section, timestamp, preview
  // Preview = first user question (not IA greeting which is always the same)
  // If username provided, only return sessions belonging to that user
  // Sync: pull remote sessions first, merge into local, then return local
  var pullPromise = username ? _fetchAndMergeRemoteSessions(username) : Promise.resolve();
  return pullPromise.then(function() {
    return dbGetAll('chatHistory');
  }).then(function(allMessages) {
    if (!allMessages || allMessages.length === 0) return [];
    // Filter by username — strict: only show messages belonging to this user
    // No backward-compat leak: messages with empty/undefined username are excluded
    if (username) {
      allMessages = allMessages.filter(function(m) { return m.username === username; });
    }
    // Group by sessionId
    var sessionsMap = {};
    var sessionFirstUser = {}; // track first user message per session
    allMessages.forEach(function(m) {
      if (!m.sessionId) return; // skip legacy messages without sessionId
      if (!sessionsMap[m.sessionId]) {
        sessionsMap[m.sessionId] = {
          sessionId: m.sessionId,
          section: m.section,
          persona: m.persona || '',
          timestamp: m.timestamp,
          preview: '',
          messageCount: 0,
          username: m.username || ''
        };
      }
      // Capture persona from the latest AI message that has it (reflects persona switches mid-conversation)
      if (m.persona && m.role !== 'user') {
        sessionsMap[m.sessionId].persona = m.persona;
      }
      sessionsMap[m.sessionId].messageCount++;
      // Track first user message as preview/title (use m.title if generated)
      if (m.role === 'user' && !sessionFirstUser[m.sessionId]) {
        sessionFirstUser[m.sessionId] = true;
        var userText = (m.text || '').trim();
        // Use generated title if available, otherwise raw text
        var previewText = m.title || userText.substring(0, 80);
        if (previewText) {
          sessionsMap[m.sessionId].preview = previewText;
          sessionsMap[m.sessionId].timestamp = m.timestamp;
        }
      }
      // Update timestamp to most recent message (for sort order)
      if (m.timestamp > sessionsMap[m.sessionId].timestamp) {
        sessionsMap[m.sessionId].timestamp = m.timestamp;
      }
    });
    // For sessions with no user message yet (only greeting), show placeholder
    Object.keys(sessionsMap).forEach(function(sid) {
      if (!sessionsMap[sid].preview) {
        sessionsMap[sid].preview = 'Nuevo chat';
      }
    });
    // Convert to array, sort by timestamp descending (most recent first)
    var sessions = Object.values(sessionsMap);
    sessions.sort(function(a, b) { return b.timestamp - a.timestamp; });
    return sessions;
  });
}

function borrarChatSession(sessionId) {
  return obtenerChatSessionMessages(sessionId).then(function(messages) {
    // Delete from backend first (get username from first message)
    if (messages && messages.length > 0 && messages[0].username) {
      _deleteChatSessionFromBackend(messages[0].username, sessionId);
    }
    return Promise.all((messages || []).map(function(m) { return dbDelete('chatHistory', m.id); }));
  });
}

function borrarChatMsg(msgId) {
  return dbDelete('chatHistory', msgId);
}


// ===== Informes Sync (Backend) =====
// Sincroniza informes entre dispositivos via backend SQLite.
// Estrategia: local-first → push on save, pull on load, merge por id.

// Push: enviar un informe al backend (fire-and-forget)
function _syncInformeToBackend(informe) {
  if (!informe || !informe.id || !informe.username) return;
  var baseUrl = _getChatSyncBaseUrl();
  fetch(baseUrl + '/api/informes/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: informe.username, informes: [informe] })
  }).catch(function(e) {
    console.warn('Informe sync push failed:', e);
  });
}

// Pull: obtener informes del backend y mergear con local
function _fetchAndMergeRemoteInformes(username) {
  if (!username) return Promise.resolve();
  var baseUrl = _getChatSyncBaseUrl();
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 30000);
  return fetch(baseUrl + '/api/informes/all?username=' + encodeURIComponent(username), { signal: controller.signal })
    .then(function(r) { clearTimeout(timeout); return r.ok ? r.json() : []; })
    .then(function(remoteInformes) {
      if (!remoteInformes || !Array.isArray(remoteInformes) || remoteInformes.length === 0) return;
      return _mergeRemoteInformes(remoteInformes);
    })
    .catch(function(e) {
      clearTimeout(timeout);
      console.warn('Informe sync pull failed:', e);
    });
}

// Pull: obtener informes entrantes del backend (cross-user visibility)
function _fetchAndMergeRemoteIncomingInformes(userGrade, territorio, empresa) {
  if (!userGrade || userGrade === 'B.a') return Promise.resolve();
  var baseUrl = _getChatSyncBaseUrl();
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 30000);
  var params = 'grade=' + encodeURIComponent(userGrade) +
               '&territorio=' + encodeURIComponent(territorio || '') +
               '&empresa=' + encodeURIComponent(empresa || '');
  return fetch(baseUrl + '/api/informes/incoming?' + params, { signal: controller.signal })
    .then(function(r) { clearTimeout(timeout); return r.ok ? r.json() : []; })
    .then(function(remoteInformes) {
      if (!remoteInformes || !Array.isArray(remoteInformes) || remoteInformes.length === 0) return;
      return _mergeRemoteInformes(remoteInformes);
    })
    .catch(function(e) {
      clearTimeout(timeout);
      console.warn('Informe incoming sync pull failed:', e);
    });
}

// Merge: upsert informes remotos en IDB local (solo si no existen o son más nuevos)
function _mergeRemoteInformes(remoteInformes) {
  if (!remoteInformes || remoteInformes.length === 0) return Promise.resolve();
  var promises = remoteInformes.map(function(inf) {
    return dbGet('informes', inf.id).then(function(existing) {
      if (!existing) {
        return dbPut('informes', inf);
      } else if ((inf.timestamp || 0) > (existing.timestamp || 0)) {
        return dbPut('informes', inf);
      }
    });
  });
  return Promise.all(promises);
}

// Delete: borrar informe del backend
function _deleteInformeFromBackend(username, informeId) {
  if (!username || !informeId) return;
  var baseUrl = _getChatSyncBaseUrl();
  fetch(baseUrl + '/api/informes/delete?username=' + encodeURIComponent(username) +
        '&id=' + encodeURIComponent(informeId), {
    method: 'DELETE'
  }).catch(function(e) {
    console.warn('Informe sync delete failed:', e);
  });
}


// ===== Correcciones Sync (Backend) =====
// Sincroniza correcciones entre dispositivos via backend SQLite.
// Estrategia: local-first → push on save, pull on load, merge por id.

// Push: enviar una corrección al backend (fire-and-forget)
function _syncCorreccionToBackend(correccion) {
  if (!correccion || !correccion.id) return;
  var baseUrl = _getChatSyncBaseUrl();
  fetch(baseUrl + '/api/correcciones/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: correccion.correctorUsername || '', correcciones: [correccion] })
  }).catch(function(e) {
    console.warn('Correccion sync push failed:', e);
  });
}

// Push batch: enviar varias correcciones al backend en una sola request
function _syncCorreccionBatchToBackend(correcciones) {
  if (!correcciones || correcciones.length === 0) return;
  var baseUrl = _getChatSyncBaseUrl();
  var username = (correcciones[0] && correcciones[0].correctorUsername) || '';
  fetch(baseUrl + '/api/correcciones/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username, correcciones: correcciones })
  }).catch(function(e) {
    console.warn('Correccion batch sync push failed:', e);
  });
}

// Pull: obtener correcciones de un informe desde el backend y mergear
function _fetchAndMergeRemoteCorrecciones(informeId) {
  if (!informeId) return Promise.resolve([]);
  var baseUrl = _getChatSyncBaseUrl();
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 30000);
  return fetch(baseUrl + '/api/correcciones?informeId=' + encodeURIComponent(informeId), { signal: controller.signal })
    .then(function(r) { clearTimeout(timeout); return r.ok ? r.json() : []; })
    .then(function(remoteCorrecciones) {
      if (!remoteCorrecciones || !Array.isArray(remoteCorrecciones) || remoteCorrecciones.length === 0) return [];
      return _mergeRemoteCorrecciones(remoteCorrecciones).then(function() {
        return remoteCorrecciones;
      });
    })
    .catch(function(e) {
      clearTimeout(timeout);
      console.warn('Correccion sync pull failed:', e);
      return [];
    });
}

// Merge: upsert correcciones remotas en IDB local (solo si no existen o son más nuevas)
function _mergeRemoteCorrecciones(remoteCorrecciones) {
  if (!remoteCorrecciones || remoteCorrecciones.length === 0) return Promise.resolve();
  var promises = remoteCorrecciones.map(function(cor) {
    return dbGet('correcciones', cor.id).then(function(existing) {
      if (!existing) {
        return dbPut('correcciones', cor);
      } else if ((cor.timestamp || 0) > (existing.timestamp || 0)) {
        return dbPut('correcciones', cor);
      }
    });
  });
  return Promise.all(promises);
}


// ===== Borrado per-user (chats + informes) =====

function borrarChatsUsuario(username) {
  if (!username) return Promise.resolve(0);
  // 1. Borrar del backend (per-user, no nuclear)
  var baseUrl = _getChatSyncBaseUrl();
  fetch(baseUrl + '/api/chat/clear-user?username=' + encodeURIComponent(username), { method: 'DELETE' })
    .then(function(r) { return r.json(); })
    .then(function(data) { console.log('DB: backend chats cleared for user', username, data); })
    .catch(function(e) { console.warn('DB: backend chat clear failed', e); });
  // 2. Borrar local: obtener todos los mensajes del usuario y eliminar
  return dbGetByIndex('chatHistory', 'username', username).then(function(messages) {
    return Promise.all((messages || []).map(function(m) { return dbDelete('chatHistory', m.id); }));
  });
}

function borrarInformesUsuario(username) {
  if (!username) return Promise.resolve(0);
  // 1. Borrar del backend (per-user)
  var baseUrl = _getChatSyncBaseUrl();
  fetch(baseUrl + '/api/informes/clear-user?username=' + encodeURIComponent(username), { method: 'DELETE' })
    .then(function(r) { return r.json(); })
    .then(function(data) { console.log('DB: backend informes cleared for user', username, data); })
    .catch(function(e) { console.warn('DB: backend informes clear failed', e); });
  // 2. Borrar local: obtener todos los informes del usuario y eliminar
  return dbGetByIndex('informes', 'username', username).then(function(informes) {
    return Promise.all((informes || []).map(function(inf) { return dbDelete('informes', inf.id); }));
  });
}
// Sincroniza historial de chat entre dispositivos via backend SQLite.
// Estrategia: local-first → push on save, pull on load, merge por id.

function _getChatSyncBaseUrl() {
  // Use shared HorneroAPI module if available
  if (window.HorneroAPI && window.HorneroAPI.getBackendUrl) {
    return window.HorneroAPI.getBackendUrl();
  }
  // Fallback for when hornero-api.js is not loaded
  var h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
    return 'http://' + h + ':8000';
  }
  return 'https://hornero-ia.onrender.com';
}

// ===== Chat History Sync (Backend) =====
// Sincroniza historial de chat entre dispositivos via backend SQLite.
// Estrategia: local-first → push on save, pull on load, merge por id.

// Push: enviar un mensaje al backend (fire-and-forget, no bloquea)
function _syncMsgToBackend(msg) {
  if (!msg || !msg.id || !msg.username) return; // sin username, no sync
  var baseUrl = _getChatSyncBaseUrl();
  fetch(baseUrl + '/api/chat/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: msg.username, messages: [msg] })
  }).catch(function(e) {
    console.warn('Chat sync push failed:', e);
  });
}

// Pull: obtener sesiones del backend y mergear con local
function _fetchAndMergeRemoteSessions(username) {
  if (!username) return Promise.resolve();
  var baseUrl = _getChatSyncBaseUrl();
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 30000); // 5s timeout
  return fetch(baseUrl + '/api/chat/sessions?username=' + encodeURIComponent(username), { signal: controller.signal })
    .then(function(r) { clearTimeout(timeout); return r.ok ? r.json() : []; })
    .then(function(remoteSessions) {
      if (!remoteSessions || !Array.isArray(remoteSessions) || remoteSessions.length === 0) return;
      // Para cada sesión remota, fetch mensajes y mergear en IDB
      var promises = remoteSessions.map(function(s) {
        return fetch(baseUrl + '/api/chat/messages?username=' + encodeURIComponent(username) +
                     '&sessionId=' + encodeURIComponent(s.sessionId))
          .then(function(r) { return r.ok ? r.json() : []; })
          .then(function(remoteMsgs) {
            if (!remoteMsgs || !Array.isArray(remoteMsgs) || remoteMsgs.length === 0) return;
            return _mergeRemoteMessages(remoteMsgs);
          });
      });
      return Promise.all(promises);
    })
    .catch(function(e) {
      clearTimeout(timeout);
      console.warn('Chat sync pull failed:', e);
    });
}

// Merge: upsert mensajes remotos en IDB local (solo si no existen o son más nuevos)
function _mergeRemoteMessages(remoteMsgs) {
  if (!remoteMsgs || remoteMsgs.length === 0) return Promise.resolve();
  var promises = remoteMsgs.map(function(msg) {
    // Verificar si ya existe localmente
    return dbGet('chatHistory', msg.id).then(function(existing) {
      if (!existing) {
        // No existe localmente → insertar
        return dbPut('chatHistory', msg);
      } else if (msg.timestamp > existing.timestamp) {
        // Remoto es más nuevo → actualizar
        return dbPut('chatHistory', msg);
      }
      // Local es más nuevo o igual → no hacer nada
    });
  });
  return Promise.all(promises);
}

// Delete: borrar sesión del backend
function _deleteChatSessionFromBackend(username, sessionId) {
  if (!username || !sessionId) return;
  var baseUrl = _getChatSyncBaseUrl();
  fetch(baseUrl + '/api/chat/session?username=' + encodeURIComponent(username) +
        '&sessionId=' + encodeURIComponent(sessionId), {
    method: 'DELETE'
  }).catch(function(e) {
    console.warn('Chat sync delete failed:', e);
  });
}

// Fetch mensajes de una sesión desde el backend (fallback si no hay local)
function fetchChatSessionMessagesFromBackend(username, sessionId) {
  if (!username || !sessionId) return Promise.resolve([]);
  var baseUrl = _getChatSyncBaseUrl();
  return fetch(baseUrl + '/api/chat/messages?username=' + encodeURIComponent(username) +
               '&sessionId=' + encodeURIComponent(sessionId))
    .then(function(r) { return r.ok ? r.json() : []; })
    .catch(function(e) {
      console.warn('Chat sync fetch session failed:', e);
      return [];
    });
}


// ===== SyncQueue: reliable delivery =====
// Reemplaza fire-and-forget con cola persistente en IDB.
// Encola operaciones → drena periódicamente → marca como completadas.
// Si falla: reintenta (hasta 3 veces), luego marca como error.

var _syncQueueTimer = null;
var _syncQueueDraining = false;

// Iniciar drenaje periódico de la cola de sync
function iniciarSyncQueue() {
  if (_syncQueueTimer) return; // ya iniciado
  _syncQueueTimer = setInterval(function() {
    _drenarSyncQueue();
  }, 30000); // cada 30s
  // También drenar cuando la app vuelve a primer plano
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) _drenarSyncQueue();
  });
  // Drenar inmediatamente
  _drenarSyncQueue();
}

// Drenar la cola: enviar todos los items pendientes al backend
function _drenarSyncQueue() {
  if (_syncQueueDraining) return; // evitar reentrancia
  _syncQueueDraining = true;
  obtenerSyncPendientes().then(function(pendientes) {
    if (!pendientes || pendientes.length === 0) {
      _syncQueueDraining = false;
      return;
    }
    var baseUrl = _getChatSyncBaseUrl();
    // Agrupar por tipo para batch requests
    var informes = pendientes.filter(function(p) { return p.tipo === 'informe'; });
    var correcciones = pendientes.filter(function(p) { return p.tipo === 'correccion'; });
    var chats = pendientes.filter(function(p) { return p.tipo === 'chat'; });
    var others = pendientes.filter(function(p) {
      return p.tipo !== 'informe' && p.tipo !== 'correccion' && p.tipo !== 'chat';
    });

    var promises = [];

    // Batch informes
    if (informes.length > 0) {
      var infUsername = informes[0].username || '';
      promises.push(
        fetch(baseUrl + '/api/informes/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: infUsername, informes: informes.map(function(p) { return p.data; }) })
        }).then(function(r) { return r.ok; })
        .then(function(ok) {
          if (ok) {
            return Promise.all(informes.map(function(p) { return marcarSyncCompletado(p.id); }));
          }
          return Promise.all(informes.map(function(p) { return _incrementarSyncRetry(p); }));
        })
        .catch(function() {
          return Promise.all(informes.map(function(p) { return _incrementarSyncRetry(p); }));
        })
      );
    }

    // Batch correcciones
    if (correcciones.length > 0) {
      var corUsername = correcciones[0].username || '';
      promises.push(
        fetch(baseUrl + '/api/correcciones/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: corUsername, correcciones: correcciones.map(function(p) { return p.data; }) })
        }).then(function(r) { return r.ok; })
        .then(function(ok) {
          if (ok) {
            return Promise.all(correcciones.map(function(p) { return marcarSyncCompletado(p.id); }));
          }
          return Promise.all(correcciones.map(function(p) { return _incrementarSyncRetry(p); }));
        })
        .catch(function() {
          return Promise.all(correcciones.map(function(p) { return _incrementarSyncRetry(p); }));
        })
      );
    }

    // Batch chats
    if (chats.length > 0) {
      var chatUsername = chats[0].username || '';
      promises.push(
        fetch(baseUrl + '/api/chat/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: chatUsername, messages: chats.map(function(p) { return p.data; }) })
        }).then(function(r) { return r.ok; })
        .then(function(ok) {
          if (ok) {
            return Promise.all(chats.map(function(p) { return marcarSyncCompletado(p.id); }));
          }
          return Promise.all(chats.map(function(p) { return _incrementarSyncRetry(p); }));
        })
        .catch(function() {
          return Promise.all(chats.map(function(p) { return _incrementarSyncRetry(p); }));
        })
      );
    }

    // Others: mark as completed (no backend endpoint yet)
    if (others.length > 0) {
      promises.push(Promise.all(others.map(function(p) { return marcarSyncCompletado(p.id); })));
    }

    return Promise.all(promises).then(function() {
      _syncQueueDraining = false;
    });
  }).catch(function(e) {
    console.warn('SyncQueue drain error:', e);
    _syncQueueDraining = false;
  });
}

// Incrementar retry counter; si supera 3, marcar como error
function _incrementarSyncRetry(item) {
  return dbGet('syncQueue', item.id).then(function(op) {
    if (!op) return;
    op.retries = (op.retries || 0) + 1;
    if (op.retries >= 3) {
      op.estado = 'error';
      console.warn('SyncQueue: item', item.id, 'failed after 3 retries');
    }
    return dbPut('syncQueue', op);
  });
}


// ===== Full Sync Push =====
// Push todos los datos locales del usuario al backend.
// Se ejecuta al cargar la app para garantizar que el backend tenga datos completos
// (importante porque Render tiene SQLite efímero que se pierde en cada deploy).

function _pushAllLocalData(username) {
  if (!username) return Promise.resolve();
  var baseUrl = _getChatSyncBaseUrl();
  return Promise.all([
    dbGetByIndex('informes', 'username', username),
    dbGetByIndex('chatHistory', 'username', username)
  ]).then(function(results) {
    var informes = results[0] || [];
    var messages = results[1] || [];
    // Push informes
    if (informes.length > 0) {
      fetch(baseUrl + '/api/informes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, informes: informes })
      }).catch(function(e) { console.warn('Full sync push informes failed:', e); });
    }
    // Push chat messages (existing endpoint)
    if (messages.length > 0) {
      fetch(baseUrl + '/api/chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, messages: messages })
      }).catch(function(e) { console.warn('Full sync push chat failed:', e); });
    }
    // Push correcciones (batch all)
    return dbGetAll('correcciones').then(function(allCorrecciones) {
      var correcciones = (allCorrecciones || []).filter(function(c) {
        return c.correctorUsername === username || c.informeId; // push all correcciones linked to user's informes
      });
      if (correcciones.length > 0) {
        fetch(baseUrl + '/api/correcciones/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, correcciones: correcciones })
        }).catch(function(e) { console.warn('Full sync push correcciones failed:', e); });
      }
    });
  });
}

// Init: pull + push al cargar la app
// Si el cleanup acaba de correr, NO hacer push (para no re-subir datos viejos que otro dispositivo puede tener)
function iniciarFullSync(username) {
  if (!username) return;
  // 1. Pull remote data first (merge into local IDB)
  _fetchAndMergeRemoteInformes(username).then(function() {
    // 2. Push all local data to backend (solo si NO acaba de correr cleanup)
    if (!_cleanupJustRan) {
      _pushAllLocalData(username);
    } else {
      console.log('DB: skipping full push after cleanup — data was just cleared');
    }
  });
  // 3. Start syncQueue for reliable delivery
  iniciarSyncQueue();
}
