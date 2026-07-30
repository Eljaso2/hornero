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
      messages: Array,
    };
  }

  // ===== Backend URLs =====
  static get API_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat';
    }
    return 'https://hornero-ia.onrender.com/api/chat';
  }

  static get GREETING_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/greeting';
    }
    return 'https://hornero-ia.onrender.com/api/greeting';
  }

  static get AUDIO_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/audio';
    }
    return 'https://hornero-ia.onrender.com/api/audio';
  }

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
  }

  connectedCallback() {
    super.connectedCallback();
    // Don't generate sessionId yet — _loadChatHistory will restore or create
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
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
          input-placeholder="Preguntá sobre huelgas, referentes, masacres, lockouts, historia obrera..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="historia"
          history-title="Historial"
          informes-title="Informes"
          persona="${this._activePersona}"
          username="${this._username}"
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
      chatEl.addEventListener('chat-audio', (e) => {
        this._handleAudioMessage(e.detail.audioBlob, e.detail.duration, e.detail.fileName);
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
      chatEl.render();
    }
  }

  // ===== Fetch with timeout — prevents hanging on Render cold start =====
  _fetchWithTimeout(url, options, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .then(response => { clearTimeout(timeoutId); return response; })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('FETCH_TIMEOUT');
        }
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

    // Try to restore the most recent session for this section + username
    if (typeof obtenerChatSessions === 'function' && this._username) {
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
    this._typing = true;
    this.render();

    try {
      const response = await this._fetchWithTimeout(HorneroHistoriador.GREETING_URL, {
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
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia', 'greeting'],
        persona: 'historiador', // Force: historiador screen ALWAYS uses historiador — never swap actors mid-chat
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      // Don't update _activePersona from backend — keep original
      this._typing = false; this._greetingRequested = false;
      this.render();
    } catch (e) {
      this._typing = false; this._greetingRequested = false;
      this.messages = [this._localGreeting()];
      this.render();
    }
  }

  _localGreeting() {
    return { role: 'hornero', sections: [{ title: '¡Hola! Soy el Historiador/a', body: 'Conozco la historia del movimiento obrero — huelgas, masacres, lockouts, referentes. ¿Qué tema histórico querés explorar?' }], tags: ['historia', 'greeting'], persona: 'historiador', time: this._timeNow() };
  }

  async _handleUserMessage(text) {
    this.messages = [...this.messages, { role: 'user', text, tags: ['historia'], time: this._timeNow() }];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    try {
      const history = this.messages.map(m => ({
        role: m.role,
        text: m.text || '',
        sections: m.sections || [],
      }));

      const response = await this._fetchWithTimeout(HorneroHistoriador.API_URL, {
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
      this.messages = [...this.messages, {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia'],
        persona: 'historiador', // Force: historiador screen ALWAYS uses historiador — never swap actors mid-chat
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      // Don't update _activePersona from backend — keep original
      this._typing = false;
      this._saveChatHistory();
      this.render();
    } catch (e) {
      this._typing = false;
      const errMsg = e.message === 'FETCH_TIMEOUT'
        ? 'El servidor está respondiendo lento. Intentá de nuevo en un momento, o probá tu consulta más tarde.'
        : 'No puedo conectarme ahora. Intentá de nuevo en un momento.';
      const errTags = e.message === 'FETCH_TIMEOUT' ? ['historia', 'timeout'] : ['historia', 'error'];
      this.messages = [...this.messages, {
        role: 'hornero',
        text: errMsg,
        tags: errTags,
        persona: 'historiador',
        time: this._timeNow(),
      }];
      this.render();
    }
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

      const response = await this._fetchWithTimeout(HorneroHistoriador.AUDIO_URL, {
        method: 'POST',
        body: formData,
      }, 45000);

      if (!response.ok) throw new Error('Audio backend error: ' + response.status);

      const data = await response.json();
      this.messages = [...this.messages, {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia', 'audio'],
        persona: 'historiador', // Force: historiador screen ALWAYS uses historiador — never swap actors mid-chat
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      // Don't update _activePersona from backend — keep original
      this._typing = false;
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this._saveChatHistory();
      this.render();
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
      'historiador': { screen: 'historiador', persona: 'historiador' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }

  async _saveChatHistory() {
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
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }
}

customElements.define('hornero-historiador', HorneroHistoriador);
