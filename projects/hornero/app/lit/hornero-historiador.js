// ===== <hornero-historiador> — Historiador (Chat IA) =====
// Historia laboral latinoamericana — chat con el Historiador persona
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroHistoriador extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,  // Initial persona from Mesa de Trabajo landing
      sessionId: String, // Session ID — if set, load existing session instead of greeting
      warmResume: Boolean, // True = warm resume (restore last session), false = cold start (new chat)
      messages: Array,
    };
  }

  // ===== Backend URLs (via shared HorneroAPI) =====
  _getChatUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/chat'; }
  _getGreetingUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/greeting'; }
  _getAudioUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/audio'; }
  _getStreamUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/chat/stream'; }
  _getFeedbackUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/feedback'; }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this._chatSection = 'historia';
    this.messages = [];
    this._typing = false;
    this._greetingRequested = false;
    this._historyLoaded = false;
    this._sessionId = '';
    this._activePersona = 'historiador';
    this._username = '';
    this._progressiveRevealTimer = null;
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
    this._savedDrawerState = null; // Drawer state saved before re-render (prevents drawer closing)
  }

  connectedCallback() {
    super.connectedCallback();
    // Don't generate sessionId yet — _loadChatHistory will restore or create
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
  }

  // Override render() to save chat drawer state before innerHTML destroys it
  render() {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._savedDrawerState = chatEl.getDrawerState();
    }
    super.render();
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }
      .chat-container { display: flex; flex-direction: column; height: 100%; }
    `;
  }

  _render() {
    return html`
      <div class="chat-container">
        <hornero-chat
          title="Historiador/a"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="historia"
          history-title="Historial"
          informes-title="Informes"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    // Use persona attribute from Mesa landing if provided
    if (this.persona && this.persona !== this._activePersona) {
      this._activePersona = this.persona;
    }
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._syncChatMessages(chatEl);
      // Restore drawer state saved before re-render (prevents drawer closing)
      if (this._savedDrawerState) {
        chatEl.restoreDrawerState(this._savedDrawerState);
        this._savedDrawerState = null;
      }
      chatEl.addEventListener('chat-send', (e) => {
        this._handleUserMessage(e.detail.text);
      });
      chatEl.addEventListener('chat-session-select', (e) => {
        this._loadSession(e.detail.sessionId);
      });
      chatEl.addEventListener('chat-session-delete', (e) => {
        if (e.detail.sessionId === this._sessionId) {
          this.messages = [];
          this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now();
          this.render();
        }
      });
      // Delete individual message — remove from local array + IndexedDB
      chatEl.addEventListener('chat-message-delete', (e) => {
        const { msgIndex, msg } = e.detail;
        if (msgIndex >= 0 && msgIndex < this.messages.length) {
          this.messages.splice(msgIndex, 1);
          if (msg && msg.id && typeof borrarChatMsg === 'function') {
            borrarChatMsg(msg.id);
          }
          this.render();
        }
      });
      chatEl.addEventListener('persona-navigate', (e) => {
        this._handlePersonaNavigate(e.detail.persona);
      });
      chatEl.addEventListener('persona-redirect', (e) => {
        this._handlePersonaNavigate(e.detail.persona);
      });
      // Listen for back button → go to chat landing
      chatEl.addEventListener('chat-back', () => {
        this.emit('screen-change', { screen: 'chat' });
      });
      chatEl.addEventListener('chat-audio', (e) => {
        this._handleAudioMessage(e.detail.audioBlob, e.detail.duration, e.detail.fileName);
      });
      // Listen for feedback (like/dislike) and send to backend
      chatEl.addEventListener('chat-feedback', (e) => {
        this._sendFeedback(e.detail);
      });
      // Listen for export from toolbar button — add download card message
      chatEl.addEventListener('chat-export', (e) => {
        this._handleChatExport(e.detail);
      });
      // Listen for "Nuevo chat" button from history drawer
      chatEl.addEventListener('chat-new-session', () => {
        this._startNewSession();
      });
    }
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }
  }

  _syncChatMessages(chatEl) {
    if (chatEl) {
      chatEl.messages = this.messages;
      chatEl.typing = this._typing;
      chatEl.section = this._chatSection;
      chatEl.sessionId = this._sessionId;
      chatEl.username = this._username;
      chatEl.persona = this._activePersona;
      chatEl.grade = this.grade;
      chatEl.render();
    }
  }

  // ===== Fetch with timeout — uses shared HorneroAPI if available =====
  _fetchWithTimeout(url, options, timeoutMs = 30000) {
    if (window.HorneroAPI && window.HorneroAPI.apiFetch) {
      return window.HorneroAPI.apiFetch(url, options, 2, timeoutMs);
    }
    // Fallback for when HorneroAPI is not loaded
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .then(response => { clearTimeout(timeoutId); return response; })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('FETCH_TIMEOUT');
        throw err;
      });
  }

  // ===== Start a new chat session =====
  _startNewSession() {
    this.messages = [];
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._historyLoaded = true;
    this._greetingRequested = false;
    this._activePersona = 'historiador';
    this._requestGreeting();
  }

  async _loadChatHistory() {
    if (this._historyLoaded) return;
    this._historyLoaded = true;

    // If a sessionId was passed (from Mis Conversaciones), load that session
    if (this.sessionId && this.sessionId.length > 0) {
      await this._loadSession(this.sessionId);
      this.sessionId = '';
      return;
    }

    // Try to restore the most recent session for this section + username (warm resume only)
    if (this.warmResume && typeof obtenerChatSessions === 'function' && this._username) {
      try {
        const sessions = await obtenerChatSessions(this._username);
        const mySessions = sessions.filter(s => s.section === this._chatSection);
        if (mySessions.length > 0) {
          const latestSession = mySessions[0]; // sorted by timestamp desc
          await this._loadSession(latestSession.sessionId);
          return; // Session restored, no greeting needed
        }
      } catch(e) { console.warn('Historiador: session restore failed', e); }
    }

    // No previous session found — start fresh
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    if (this.messages.length === 0 && !this._greetingRequested) {
      this._requestGreeting();
    } else if (this.messages.some(m => m.role === 'hornero' && m.tags && m.tags.includes('greeting'))) {
      // Greeting already exists — never greet twice in the same session
      return;
    }
  }

  async _loadSession(sessionId) {
    try {
      if (typeof obtenerChatSessionMessages === 'function') {
        const saved = await obtenerChatSessionMessages(sessionId);
        if (saved && saved.length > 0) {
          this._sessionId = sessionId;
          this.messages = saved;
          this._historyLoaded = true;
          this.render();
        }
      }
    } catch(e) { console.warn('Historiador: session load failed', e); }
  }

  async _requestGreeting() {
    this._greetingRequested = true;

    // Show local greeting immediately (instant, no backend wait)
    const local = this._localGreeting();
    this._typing = false;
    this._addWithProgressiveReveal(local);

    // Then try backend greeting in background (may enhance or redirect)
    try {
      if (window.HorneroAPI) await window.HorneroAPI.wakeUpBackend();
      const response = await this._fetchWithTimeout(this._getGreetingUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'historia',
          grade: this.grade,
          sector: this.sector,
          requested_persona: 'historiador',
          session_id: this._sessionId,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      // Only replace if backend returned something different from local greeting
      const backendText = data.text || (data.sections && data.sections.map(s => (s.title ? s.title + ': ' : '') + s.body).join('\n')) || '';
      if (backendText && backendText !== local.sections[0].body) {
        const msg = {
          role: 'hornero',
          text: data.text || '',
          sections: data.sections || [],
          tags: data.tags || ['historia', 'greeting'],
          persona: 'historiador',
          redirect_persona: data.redirect_persona || '',
          image: data.image || '',
          source_url: data.source_url || '',
          time: data.time || this._timeNow(),
        };
        // Replace the first message with the backend version
        if (this.messages.length > 0 && this.messages[0].tags && this.messages[0].tags.includes('greeting')) {
          this.messages[0] = msg;
          // Only re-render if backend greeting has interactive elements (redirect, open_informes)
          // Otherwise silent data update — next natural render will pick it up
          if (msg.redirect_persona || msg.open_informes) {
            const chatEl = this.shadowRoot.querySelector('hornero-chat');
            if (chatEl && chatEl.refreshMessages) chatEl.refreshMessages(this.messages);
            else this.render();
          }
        }
      }
      this._greetingRequested = false;
    } catch (e) {
      this._greetingRequested = false;
      // Local greeting already shown — no need for fallback
    }
  }

  // Add a message with progressive reveal (typing effect)
  _addWithProgressiveReveal(msg) {
    if (!msg.text || msg.text.length <= 50) {
      // Short text or sections-only (e.g. local greeting) — add directly, no typewriter
      this.messages = [...this.messages, msg];
      this._typing = false;
      this.iaStep++;
      this._greetingRequested = false;
      this._saveChatHistory();
      this.render();
      return;
    }
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    this._typing = false;
    this._startProgressiveReveal(msg.text, chatEl, msg.persona || this.persona);
    const revealDone = new Promise((resolve) => {
      const check = setInterval(() => {
        if (!this._progressiveRevealTimer) { clearInterval(check); resolve(); }
      }, 50);
    });
    const timeout = new Promise((resolve) => setTimeout(resolve, 15000));
    Promise.race([revealDone, timeout]).then(() => {
      this._stopProgressiveReveal();
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) {
        chatEl.finalizeStreamingMessage(msg);
      } else {
        this.messages = [...this.messages, msg];
        this.render();
      }
      this.iaStep++;
      this._typing = false; this._greetingRequested = false;
      this._saveChatHistory();
    });
  }

  _localGreeting() {
    return { role: 'hornero', sections: [{ title: '', body: '¡Hola! Soy la Historiadora — conozco la historia del movimiento obrero: huelgas, masacres, lockouts, referentes que nadie recuerda. ¿Qué tema histórico te interesa?' }], tags: ['historia', 'greeting'], persona: 'historiador', time: this._timeNow() };
  }

  _handleUserMessage(text) {
    this._stopProgressiveReveal();
    this.messages = [...this.messages, { role: 'user', text, tags: ['historia'], time: this._timeNow() }];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    // Race: backend stream vs timeout → fallback to non-streaming if too slow
    const STREAM_TIMEOUT = 45000; // 45s max wait for first token (Render cold start can take 30-60s)
    let streamStarted = false;

    const streamPromise = this._callBackendStream(text, () => { streamStarted = true; }).then(() => {
      // Stream completed successfully
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        if (!streamStarted) reject(new Error('STREAM_TIMEOUT'));
      }, STREAM_TIMEOUT);
    });

    Promise.race([streamPromise, timeoutPromise]).catch((err) => {
      if (err.message === 'STREAM_TIMEOUT') {
        console.warn('Stream timed out after', STREAM_TIMEOUT, 'ms — falling back');
      } else {
        console.warn('Stream failed, falling back:', err);
      }
      this._callBackend(text).catch((err2) => {
        if (err2.message === 'FETCH_TIMEOUT') {
          this._addWithProgressiveReveal({
            role: 'hornero',
            text: 'El servidor está respondiendo lento. Intentá de nuevo en un momento, o probá tu consulta más tarde.',
            tags: ['historia', 'timeout'],
            persona: 'historiador',
            time: this._timeNow(),
          });
        } else {
          this._addWithProgressiveReveal({
            role: 'hornero',
            text: 'No puedo conectarme ahora. Intentá de nuevo en un momento.',
            tags: ['historia', 'error'],
            persona: 'historiador',
            time: this._timeNow(),
          });
        }
        this._typing = false;
        this.render();
      });
    });
  }

  _startProgressiveReveal(fullText, chatEl, persona) {
    this._stopProgressiveReveal();
    this._progressiveRevealFull = fullText;
    this._progressiveRevealIndex = 0;
    const chunkSize = 1;
    const interval = 25;
    this._progressiveRevealTimer = setInterval(() => {
      this._progressiveRevealIndex += chunkSize;
      if (this._progressiveRevealIndex >= this._progressiveRevealFull.length) {
        this._stopProgressiveReveal();
        if (chatEl) {
          chatEl.updateStreamingText(this._progressiveRevealFull, true);
        }
        // If API already finished, finalize the message now
        if (this._pendingFinalizeMsg) {
          const msg = this._pendingFinalizeMsg;
          this._pendingFinalizeMsg = null;
          this.iaStep++;
          this._typing = false; this._greetingRequested = false;
          this._saveChatHistory();
          if (chatEl) chatEl.finalizeStreamingMessage(msg);
        }
        return;
      }
      if (chatEl) {
        chatEl.updateStreamingText(this._progressiveRevealFull.substring(0, this._progressiveRevealIndex), true);
      }
    }, interval);
  }

  _stopProgressiveReveal() {
    if (this._progressiveRevealTimer) {
      clearInterval(this._progressiveRevealTimer);
      this._progressiveRevealTimer = null;
    }
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
  }

  async _callBackendStream(text, onFirstToken) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(this._getStreamUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'historia',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Stream error: ' + response.status);

    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamingText = '';
    let streamingPersona = this._activePersona;

    // Start streaming — show typing indicator until first token
    this._typing = true;
    if (chatEl) {
      chatEl.streamingText = '';
      chatEl._streamingPersona = streamingPersona;
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event: token')) {
            // Next line should be data
            continue;
          }
          if (line.startsWith('data: ') && !line.startsWith('data: {')) {
            // Token data — plain text content
            const content = line.slice(6).replace(/\\n/g, '\n');
            if (content) {
              streamingText += content;
              this._typing = false; // Hide typing dots once we have text
              // Notify that stream has started (prevents premature timeout)
              if (onFirstToken) { onFirstToken(); onFirstToken = null; }
              if (chatEl) {
                // Always use progressive reveal for typewriter effect
                if (this._progressiveRevealTimer) {
                  this._progressiveRevealFull = streamingText;
                } else {
                  this._startProgressiveReveal(streamingText, chatEl, streamingPersona);
                }
              }
            }
          }
          if (line.startsWith('data: {')) {
            // JSON data — could be done event or error
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text !== undefined) {
                // This is the "done" event with full metadata
                streamingPersona = data.persona || this._activePersona;
                // Build the complete message
                const reportMsg = {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['historia'],
                  persona: 'historiador', // Force: historiador screen ALWAYS uses historiador — never swap actors mid-chat
                  redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
                  time: data.time || this._timeNow(),
                };
                // Always use typewriter reveal — if none running, start one
                this._pendingFinalizeMsg = reportMsg;
                if (!this._progressiveRevealTimer) {
                  const fullText = data.text || streamingText;
                  if (chatEl && fullText) {
                    this._startProgressiveReveal(fullText, chatEl, 'historiador');
                  } else {
                    this._stopProgressiveReveal();
                    this._typing = false; this._greetingRequested = false;
                    this._saveChatHistory();
                    if (chatEl) chatEl.finalizeStreamingMessage(reportMsg);
                  }
                }
                return;
              }
              if (data.message) {
                // Error event
                throw new Error(data.message);
              }
            } catch (e) {
              if (e.message !== 'Stream error') throw e;
            }
          }
        }
      }
    } catch (e) {
      // Stream interrupted — if we have partial text, save it as a message
      this._stopProgressiveReveal();
      if (streamingText) {
        const partialMsg = {
          role: 'hornero',
          text: streamingText,
          tags: ['historia', 'stream-partial'],
          persona: 'historiador',
          time: this._timeNow(),
        };
        if (chatEl) {
          chatEl.finalizeStreamingMessage(partialMsg);
        } else {
          this.messages = [...this.messages, partialMsg];
        }
      } else {
        if (chatEl) chatEl.hideTyping();
      }
      this._typing = false;
      if (!chatEl) this.render();
      throw e;
    }
  }

  async _callBackend(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await this._fetchWithTimeout(this._getChatUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'historia',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'historiador',
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();

    const reportMsg = {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['historia'],
      persona: 'historiador', // Force: historiador screen ALWAYS uses historiador — never swap actors mid-chat
      redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    };
    // Don't update _activePersona from backend — keep original
    this.iaStep++;
    this._addWithProgressiveReveal(reportMsg);
  }

  async _handleAudioMessage(audioBlob, duration, fileName) {
    this.messages = [...this.messages, { role: 'user', text: '🎤 Audio enviado', tags: ['historia', 'audio'], time: this._timeNow() }];
    this._typing = true;
    this.render();

    try {
      const history = this.messages.map(m => ({
        role: m.role,
        text: m.text || '',
        sections: m.sections || [],
      }));

      const formData = new FormData();
      formData.append('audio', audioBlob, fileName);
      formData.append('formato', 'historia');
      formData.append('grade', this.grade);
      formData.append('sector', this.sector);
      formData.append('requested_persona', 'historiador');
      formData.append('session_id', this._sessionId);
      formData.append('history', JSON.stringify(history));

      const response = await this._fetchWithTimeout(this._getAudioUrl(), {
        method: 'POST',
        body: formData,
      }, 45000);

      if (!response.ok) throw new Error('Audio backend error: ' + response.status);

      const data = await response.json();
      const msg = {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia', 'audio'],
        persona: 'historiador', // Force: historiador screen ALWAYS uses historiador — never swap actors mid-chat
        redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
        time: data.time || this._timeNow(),
      };
      // Don't update _activePersona from backend — keep original
      this.iaStep++;
      this._addWithProgressiveReveal(msg);
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
    } catch (e) {
      this._typing = false;
      const errMsg = e.message === 'FETCH_TIMEOUT'
        ? 'No puedo procesar el audio ahora — el servidor está lento. Intentá de nuevo.'
        : 'No puedo procesar el audio ahora. Intentá de nuevo.';
      const errTags = e.message === 'FETCH_TIMEOUT' ? ['historia', 'audio', 'timeout'] : ['historia', 'audio-error'];
      this.messages = [...this.messages, {
        role: 'hornero',
        text: errMsg,
        tags: errTags,
        persona: 'historiador',
        time: this._timeNow(),
      }];
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this.render();
    }
  }

  _handleChatExport(detail) {
    if (!this.messages || this.messages.length === 0) return;
    if (detail && detail.download) {
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: detail.download,
        tags: ['historia', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  _handlePersonaNavigate(targetPersona, targetScreen) {
    const screenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'companero': { screen: 'gremial', persona: 'companero' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'historiador': { screen: 'formacion', persona: 'historiador' },
      'sociologo': { screen: 'condicion', persona: 'sociologo' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }

  async _saveChatHistory() {
    // No persistir hasta que el usuario envíe su primer mensaje
    if (!this.messages.some(m => m.role === 'user')) return;
    try {
      if (typeof guardarChatMsg === 'function') {
        for (const m of this.messages) {
          if (!m.id) {
            m.id = typeof generarUUID === 'function' ? generarUUID() : 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            m.section = this._chatSection;
            m.sessionId = this._sessionId;
            m.timestamp = Date.now();
            m.username = this._username;
          }
          await guardarChatMsg(m);
        }
      }
    } catch(e) { console.warn('Historiador: chat history save failed', e); }
  }

  _timeNow() {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, '0');
    const m = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][now.getMonth()];
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    return d + ' ' + m + ' ' + h + ':' + min;
  }

  // ===== Send feedback to backend (like/dislike) =====
  async _sendFeedback(detail) {
    if (!detail || !detail.type) return;
    const rating = detail.type === 'like' && detail.liked ? 'like' :
                   detail.type === 'dislike' && detail.disliked ? 'dislike' : '';
    if (!rating) return;

    try {
      const baseUrl = window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com';

      await fetch(this._getFeedbackUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this._sessionId || '',
          message_index: detail.messageIndex || -1,
          rating: rating,
          persona: detail.persona || this._activePersona,
          message_text: detail.messageText || '',
        }),
      });
    } catch (e) {
      console.warn('Feedback send failed:', e);
    }
  }
}

customElements.define('hornero-historiador', HorneroHistoriador);
