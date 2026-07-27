// ===== <hornero-historiador> — Historiador (Chat IA) =====
// Historia laboral latinoamericana — chat con el Historiador persona
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroHistoriador extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
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
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }
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

  async _loadChatHistory() {
    this._historyLoaded = true;
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
      const response = await fetch(HorneroHistoriador.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'historia',
          grade: this.grade,
          sector: this.sector,
          requested_persona: 'historiador',
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia', 'greeting'],
        persona: data.persona || 'historiador',
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      this._activePersona = data.persona || 'historiador';
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
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.text || (m.sections ? m.sections.map(s => s.title + ': ' + s.body).join('\n') : ''),
      }));

      const response = await fetch(HorneroHistoriador.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          formato: 'historia',
          history: history.slice(-10),
          grade: this.grade,
          sector: this.sector,
          requested_persona: 'historiador',
        }),
      });

      if (!response.ok) throw new Error('Backend error: ' + response.status);

      const data = await response.json();
      this.messages = [...this.messages, {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia'],
        persona: data.persona || 'historiador',
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      this._activePersona = data.persona || 'historiador';
      this._typing = false;
      this._saveChatHistory();
      this.render();
    } catch (e) {
      this._typing = false;
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'No puedo conectarme ahora. Intentá de nuevo en un momento.',
        tags: ['historia', 'error'],
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
        role: m.role === 'user' ? 'user' : 'assistant',
        text: m.text || '',
      }));

      const formData = new FormData();
      formData.append('audio', audioBlob, fileName);
      formData.append('formato', 'historia');
      formData.append('grade', this.grade);
      formData.append('sector', this.sector);
      formData.append('requested_persona', 'historiador');
      formData.append('history', JSON.stringify(history.slice(-10)));

      const response = await fetch(HorneroHistoriador.AUDIO_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Audio backend error: ' + response.status);

      const data = await response.json();
      this.messages = [...this.messages, {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia', 'audio'],
        persona: data.persona || 'historiador',
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      this._activePersona = data.persona || 'historiador';
      this._typing = false;
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this._saveChatHistory();
      this.render();
    } catch (e) {
      this._typing = false;
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'No puedo procesar el audio ahora. Intentá de nuevo.',
        tags: ['historia', 'audio-error'],
        persona: 'historiador',
        time: this._timeNow(),
      }];
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this.render();
    }
  }

  _handlePersonaNavigate(targetPersona) {
    const screenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'companero': { screen: 'consulta', persona: 'companero' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'relator': { screen: 'gremial' },
      'ia-sindical': { screen: 'consulta', persona: 'ia-sindical' },
    };
    const target = screenMap[targetPersona];
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }

  async _saveChatHistory() {
    try {
      if (typeof guardarChatSessionMessages === 'function' && this._sessionId) {
        await guardarChatSessionMessages(this._sessionId, this.messages, {
          section: this._chatSection,
          grade: this.grade,
          sector: this.sector,
          username: this._username,
        });
      }
    } catch(e) { console.warn('Historiador: chat history save failed', e); }
  }

  _timeNow() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }
}

customElements.define('hornero-historiador', HorneroHistoriador);
