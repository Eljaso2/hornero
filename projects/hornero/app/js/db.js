// ===== Hornero APP — IndexedDB Wrapper =====
// Persistencia local para informes, fuentes primarias, correcciones y cargas
// Principio: fuentes primarias NEVER se modifican, correcciones son ADDITIVE

var HORNERO_DB = {
  name: 'hornero-app',
  version: 5,
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
      { name: 'estado', keyPath: 'estado' } // 'pendiente','visto','corregido','enviado','publicado'
    ]},
    // Correcciones: cada corrección es un registro ADDITIVE con trazabilidad
    correcciones: { keyPath: 'id', indexes: [
      { name: 'informeId', keyPath: 'informeId' },
      { name: 'correctorGrado', keyPath: 'correctorGrado' },
      { name: 'fecha', keyPath: 'fecha' }
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
      { name: 'sessionId', keyPath: 'sessionId' }
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
function guardarInforme(informe) { return dbPut('informes', informe); }
function obtenerInforme(id) { return dbGet('informes', id); }
function obtenerInformesPorGrado(grado) { return dbGetByIndex('informes', 'grado', grado); }
function obtenerInformesPorEstado(estado) { return dbGetByIndex('informes', 'estado', estado); }
function obtenerInformesPorTerritorio(territorio) { return dbGetByIndex('informes', 'territorio', territorio); }
function actualizarEstadoInforme(id, estado) {
  return dbGet('informes', id).then(function(informe) {
    if (informe) { informe.estado = estado; return dbPut('informes', informe); }
    return null;
  });
}

// Correcciones (additive traceability)
function guardarCorreccion(correccion) { return dbPut('correcciones', correccion); }
function obtenerCorrecciones(informeId) { return dbGetByIndex('correcciones', 'informeId', informeId); }
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
  return dbPut('chatHistory', msg);
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
    return (messages || []).sort(function(a, b) { return a.timestamp - b.timestamp; });
  });
}

function obtenerChatSessions() {
  // Returns distinct sessions with metadata: sessionId, section, timestamp, preview
  // Preview = first user question (not IA greeting which is always the same)
  return dbGetAll('chatHistory').then(function(allMessages) {
    if (!allMessages || allMessages.length === 0) return [];
    // Group by sessionId
    var sessionsMap = {};
    var sessionFirstUser = {}; // track first user message per session
    allMessages.forEach(function(m) {
      if (!m.sessionId) return; // skip legacy messages without sessionId
      if (!sessionsMap[m.sessionId]) {
        sessionsMap[m.sessionId] = {
          sessionId: m.sessionId,
          section: m.section,
          timestamp: m.timestamp,
          preview: '',
          messageCount: 0
        };
      }
      sessionsMap[m.sessionId].messageCount++;
      // Track first user message as preview/title
      if (m.role === 'user' && !sessionFirstUser[m.sessionId]) {
        sessionFirstUser[m.sessionId] = true;
        // Extract text — user messages have m.text
        var userText = (m.text || '').trim();
        if (userText) {
          sessionsMap[m.sessionId].preview = userText.substring(0, 80);
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
    return Promise.all((messages || []).map(function(m) { return dbDelete('chatHistory', m.id); }));
  });
}
