// ===== <hornero-ecosistema> — Qué es Hornero =====
// Chat donde Hornero (el personaje) cuenta qué es el Ecosistema Hornero y la IA Sindical
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroEcosistema extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      theme: String,
      messages: Array,
      _typing: Boolean,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.messages = [];
    this._typing = false;
    this._greetingPushed = false;
    this._eventsBound = false;
    this._revealTimer = null;
    this._savedDrawerState = null;
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }
      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
      /* Bigger avatar for Hornero persona */
      .chat-container >>> .msg-avatar-row.persona-hornero .msg-avatar { width: 40px; height: 40px; }
      .chat-container >>> .msg-avatar-row.persona-hornero .msg-avatar img { width: 40px; height: 40px; }
    `;
  }

  _render() {
    return html`
      <div class="chat-container">
        <hornero-chat
          title="Ecosistema Hornero"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          persona="hornero"
          username=""
          grade="${this.grade}"
          theme="${this.theme || ''}"
          hide-persona-bar
          section="ecosistema"
          history-title="Historial"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (!chatEl) return;

    // Sync messages to chat element
    if (this.messages && this.messages.length) {
      chatEl.messages = this.messages;
      chatEl.persona = 'hornero';
      chatEl.section = 'ecosistema';
      chatEl.typing = this._typing;
      chatEl.render();
    }

    // Restore drawer state
    if (this._savedDrawerState) {
      chatEl.restoreDrawerState(this._savedDrawerState);
      this._savedDrawerState = null;
    }

    // Push greeting with progressive reveal
    if (!this._greetingPushed) {
      this._greetingPushed = true;
      this._showGreeting();
    }

    if (!this._eventsBound) {
      this._eventsBound = true;
      chatEl.addEventListener('chat-send', (e) => {
        this._handleUserMessage(e.detail.text);
      });
      chatEl.addEventListener('chat-back', () => {
        this.emit('screen-change', { screen: 'home' });
      });
      chatEl.addEventListener('chat-session-select', (e) => {
        this._loadSession(e.detail.sessionId);
      });
      chatEl.addEventListener('chat-session-delete', (e) => {
        if (e.detail.sessionId === this._sessionId) {
          this.messages = [];
          this._sessionId = this._genId();
          this.render();
        }
      });
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
      chatEl.addEventListener('chat-new-session', () => {
        this._startNewSession();
      });
      chatEl.addEventListener('chat-feedback', (e) => {
        this._sendFeedback(e.detail);
      });
    }
  }

  // ===== Show greeting: Hornero se presenta + cuenta algo =====
  _showGreeting() {
    this._sessionId = this._genId();

    const introText = '¡Hola! Soy Hornero — el pájaro que construye su nido con sus propios materiales, en su propio territorio. No usa nidos de otros.\n\nEsa es toda la filosofía: la organización no consume IA corporativa — crea su propia herramienta. Con sus propios datos. En su propia infraestructura. Con sus propias categorías.\n\nLa IA Sindical es inteligencia artificial puesta al servicio del trabajador. No es un chatbot neutral — es una herramienta posicionada desde la clase trabajadora. Argumenta desde la posición del trabajador, no desde la del empresario. Conoce el convenio, la paritaria, la jurisprudencia. Y lo más importante: los datos se quedan en la organización.\n\nLa distinción fundadora es consumir IA corporativa vs. crear IA propia. No es una distinción técnica sino política y epistemológica — determina quién controla categorías, datos, lógica y todo el ciclo del sistema. Consumir IA ajena es dejar que otro defina las categorías con las que pensás tu propia realidad. Crear IA propia es soberanía.\n\nCada eslabón de la cadena de valor es una decisión política: datos (quién los produce, cómo se etiquetan), arquitectura (quién diseña el sistema), fine-tuning (qué corpus, qué dirección), infraestructura (dónde se procesa, quién controla el server), interfaz (qué sesgo tiene, quién lo experimenta), gobernanza (quién decide qué se publica, qué se protege). Si no controlás uno, alguien más lo controla por vos.\n\nRevisá el botón Explorar 👆 para conocer cada núcleo del ecosistema. O preguntame lo que quieras.';

    // 1. Show typing dots for 1s
    this._typing = true;
    this.render();

    setTimeout(() => {
      // 2. Progressive reveal of greeting
      this._typing = false;
      this._revealMessage(introText, 'hornero', ['ecosistema', 'greeting'], null);
    }, 1000);
  }

  // ===== Progressive reveal: show text char by char via streaming =====
  _revealMessage(fullText, persona, tags, onComplete) {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (!chatEl) {
      this.messages = [...this.messages, {
        role: 'hornero', text: fullText, tags: tags,
        persona: persona, time: this._timeNow(),
      }];
      this.render();
      if (onComplete) onComplete();
      return;
    }

    // Start streaming
    chatEl.streamingText = '';
    chatEl._streamingPersona = persona;
    chatEl.render();

    let index = 0;
    const chunkSize = 4;
    const interval = 12;

    this._revealTimer = setInterval(() => {
      index += chunkSize;
      if (index >= fullText.length) {
        clearInterval(this._revealTimer);
        this._revealTimer = null;
        this.messages = [...this.messages, {
          role: 'hornero', text: fullText, tags: tags,
          persona: persona, time: this._timeNow(),
        }];
        chatEl.streamingText = '';
        chatEl._streamingPersona = '';
        this.render();
        if (onComplete) onComplete();
        return;
      }
      chatEl.streamingText = fullText.substring(0, index);
      chatEl._streamingPersona = persona;
      chatEl.updateStreamingText(fullText.substring(0, index));
    }, interval);
  }

  _stopProgressiveReveal() {
    if (this._revealTimer) {
      clearInterval(this._revealTimer);
      this._revealTimer = null;
    }
  }

  // ===== Handle user message =====
  _handleUserMessage(text) {
    this._stopProgressiveReveal();
    this.messages = [...this.messages, { role: 'user', text, tags: ['ecosistema'], time: this._timeNow() }];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    // Call backend for response
    this._callBackendStream(text).catch((err) => {
      console.warn('Stream failed, falling back to non-streaming:', err);
      this._callBackend(text).catch((err2) => {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'No puedo conectarme ahora. Intentá de nuevo en un momento.',
          tags: ['ecosistema', 'error'], persona: 'hornero',
          time: this._timeNow(),
        }];
        this._typing = false;
        this.render();
      });
    });
  }

  // ===== Backend URLs =====
  static get API_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat';
    }
    return 'https://hornero-ia.onrender.com/api/chat';
  }

  static get STREAM_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat/stream';
    }
    return 'https://hornero-ia.onrender.com/api/chat/stream';
  }

  // ===== Streaming backend call =====
  async _callBackendStream(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(HorneroEcosistema.STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'ecosistema',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'hornero',
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Stream error: ' + response.status);

    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamingText = '';
    let streamingPersona = 'hornero';

    this._typing = true;
    if (chatEl) {
      chatEl.streamingText = '';
      chatEl._streamingPersona = streamingPersona;
      chatEl.render();
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: token')) continue;
          if (line.startsWith('data: ') && !line.startsWith('data: {')) {
            const content = line.slice(6).replace(/\\n/g, '\n');
            if (content) {
              streamingText += content;
              this._typing = false;
              if (chatEl) {
                chatEl.streamingText = streamingText;
                chatEl._streamingPersona = streamingPersona;
                chatEl.updateStreamingText(streamingText);
              }
            }
          }
          if (line.startsWith('data: {')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text !== undefined) {
                streamingPersona = data.persona || 'hornero';
                this.messages = [...this.messages, {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['ecosistema'],
                  persona: 'hornero',
                  redirect_persona: data.redirect_persona || '',
                  time: data.time || this._timeNow(),
                }];
                if (chatEl) {
                  chatEl.streamingText = '';
                  chatEl._streamingPersona = '';
                }
                this._typing = false;
                this._saveChatHistory();
                this.render();
                return;
              }
              if (data.message) throw new Error(data.message);
            } catch (e) {
              if (e.message !== 'Stream error') throw e;
            }
          }
        }
      }
    } catch (e) {
      if (streamingText) {
        this.messages = [...this.messages, {
          role: 'hornero', text: streamingText,
          tags: ['ecosistema', 'stream-partial'],
          persona: 'hornero', time: this._timeNow(),
        }];
      }
      if (chatEl) {
        chatEl.streamingText = '';
        chatEl._streamingPersona = '';
      }
      this._typing = false;
      this.render();
      throw e;
    }
  }

  // ===== Non-streaming backend fallback =====
  async _callBackend(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await this._fetchWithTimeout(HorneroEcosistema.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'ecosistema',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'hornero',
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['ecosistema'],
      persona: 'hornero',
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    this._typing = false;
    this._saveChatHistory();
    this.render();
  }

  _fetchWithTimeout(url, options, timeoutMs = 30000) {
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

  // ===== Session management =====
  _startNewSession() {
    this.messages = [];
    this._sessionId = this._genId();
    this._greetingPushed = false;
    this._showGreeting();
  }

  async _loadSession(sessionId) {
    try {
      if (typeof obtenerChatSessionMessages === 'function') {
        const saved = await obtenerChatSessionMessages(sessionId);
        if (saved && saved.length > 0) {
          this._sessionId = sessionId;
          this.messages = saved;
          this.render();
        }
      }
    } catch(e) { console.warn('Ecosistema: session load failed', e); }
  }

  // ===== Save chat history to IndexedDB =====
  async _saveChatHistory() {
    if (!this.messages.some(m => m.role === 'user')) return;
    try {
      if (typeof guardarChatMsg === 'function') {
        for (const m of this.messages) {
          if (!m.id) {
            m.id = this._genId();
            m.section = 'ecosistema';
            m.sessionId = this._sessionId;
            m.timestamp = Date.now();
            m.username = '';
          }
          await guardarChatMsg(m);
        }
      }
    } catch(e) { console.warn('Ecosistema: chat history save failed', e); }
  }

  // ===== Send feedback to backend =====
  async _sendFeedback(detail) {
    if (!detail || !detail.type) return;
    const rating = detail.type === 'like' && detail.liked ? 'like' :
                   detail.type === 'dislike' && detail.disliked ? 'dislike' : '';
    if (!rating) return;
    try {
      const h = window.location.hostname;
      const baseUrl = (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.'))
        ? 'http://' + h + ':8000' : 'https://hornero-ia.onrender.com';
      await fetch(baseUrl + '/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this._sessionId || '',
          message_index: detail.messageIndex || -1,
          rating: rating,
          persona: detail.persona || 'hornero',
          message_text: detail.messageText || '',
        }),
      });
    } catch (e) { console.warn('Feedback send failed:', e); }
  }

  _genId() {
    return typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }

  _timeNow() {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, '0');
    const m = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][now.getMonth()];
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    return d + ' ' + m + ' ' + h + ':' + min;
  }
}

customElements.define('hornero-ecosistema', HorneroEcosistema);
