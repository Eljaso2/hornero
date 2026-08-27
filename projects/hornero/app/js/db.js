function obtenerChatSessions(username) {
  // Returns distinct sessions with metadata: sessionId, section, timestamp, preview
  // Sync: return local data FIRST (instant from IDB), PULL remote in background + dispatch refresh event

  function _buildSessions(allMessages) {
    if (!allMessages || allMessages.length === 0) return [];
    // Filter by username — strict: only show messages belonging to this user
    if (username) {
      allMessages = allMessages.filter(function(m) { return m.username === username; });
    }
    // Group by sessionId
    var sessionsMap = {};
    var sessionFirstUser = {};
    allMessages.forEach(function(m) {
      if (!m.sessionId) return;
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
      if (m.persona && m.role !== 'user') {
        sessionsMap[m.sessionId].persona = m.persona;
      }
      sessionsMap[m.sessionId].messageCount++;
      if (m.role === 'user' && !sessionFirstUser[m.sessionId]) {
        sessionFirstUser[m.sessionId] = true;
        var userText = (m.text || '').trim();
        var previewText = m.title || userText.substring(0, 80);
        if (previewText) {
          sessionsMap[m.sessionId].preview = previewText;
          sessionsMap[m.sessionId].timestamp = m.timestamp;
        }
      }
      if (m.timestamp > sessionsMap[m.sessionId].timestamp) {
        sessionsMap[m.sessionId].timestamp = m.timestamp;
      }
    });
    Object.keys(sessionsMap).forEach(function(sid) {
      if (!sessionsMap[sid].preview) {
        sessionsMap[sid].preview = 'Nuevo chat';
      }
    });
    var sessions = Object.values(sessionsMap);
    sessions.sort(function(a, b) { return b.timestamp - a.timestamp; });
    return sessions;
  }

  // 1. Return local data immediately (no network wait)
  var localPromise = dbGetAll('chatHistory').then(_buildSessions);

  // 2. PULL remote in background — dispatch event when done so UI can refresh
  if (username) {
    _fetchAndMergeRemoteSessions(username).then(function() {
      return dbGetAll('chatHistory').then(_buildSessions);
    }).then(function(sessions) {
      if (sessions && sessions.length > 0) {
        document.dispatchEvent(new CustomEvent('hornero-chat-sessions-updated', { detail: { sessions: sessions } }));
      }
    }).catch(function() {});
  }

  return localPromise;
}
