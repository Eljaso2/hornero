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
      _bannerVisible: Boolean,
      _exploreOpen: Boolean,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.messages = [];
    this._typing = false;
    this._bannerVisible = true;
    this._exploreOpen = false;
    this._greetingPushed = false;
    this._eventsBound = false;
    this._revealTimer = null;
    this._savedDrawerState = null;
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }

      /* ===== Cintillo con flecha atrás ===== */
      .eco-cintillo { display: flex; align-items: center; gap: 8px;
        padding: 6px 12px; border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08));
        flex-shrink: 0; background: var(--ho-bg, #1E2321); }
      .cintillo-back-btn { width: 28px; height: 28px; border-radius: 50%;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: none; cursor: pointer; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0;
        transition: background .2s, border-color .2s; }
      .cintillo-back-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .cintillo-back-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .cintillo-back-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .eco-cintillo { background: var(--ho-bg, #1E2321); }
      :host(.theme-light) .cintillo-back-btn { border-color: rgba(0,0,0,.08); }
      :host(.theme-light) .cintillo-back-btn:hover { background: var(--ho-green-pale, #E0F0EB); }

      /* ===== Hero banner — logo grande de Hornero de fondo ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-bg, #1E2321);
        padding: 14px 16px 10px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 8px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden;
        min-height: 110px; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/horneros ECo.png') center 70%/100% auto no-repeat;
        opacity: .16; pointer-events: none; }
      .hero-banner.collapsed { padding: 10px 16px 8px; min-height: 0;
        gap: 6px; }
      .hero-banner.collapsed::before { opacity: .08; }
      .hero-banner.collapsed .hero-banner-title { font-size: 1.2rem; }
      .hero-banner.collapsed .hero-explore-link { font-size: .64rem; }
      .hero-banner-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.4rem; color: var(--ho-text, #E8E6E0);
        letter-spacing: .02em; text-transform: uppercase; position: relative; }
      :host(.theme-light) .hero-banner-title { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .hero-banner { background: var(--ho-bg, #1E2321); }
      :host(.theme-light) .hero-bajada { color: var(--ho-text-light, #7A766C); }
      .hero-bajada { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        text-align: left; min-height: 3.2em; position: relative; }
      .hero-explore-link { display: inline-flex; align-items: center; gap: 4px;
        font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 700; letter-spacing: .04em;
        color: var(--ho-text, #E8E6E0); background: none;
        border: none; padding: 0; cursor: pointer; position: relative;
        transition: color .2s; }
      :host(.theme-light) .hero-explore-link { color: #000; }
      .hero-explore-link:hover { color: var(--ho-text-mid, #6E6A60); }
      :host(.theme-light) .hero-explore-link:hover { color: #333; }
      .hero-explore-link::after { content: '▾'; font-size: .58rem; margin-left: 2px; }
      .hero-explore-link.open::after { content: '▴'; }
      .hero-explore-panel { display: flex; flex-wrap: wrap; gap: 6px;
        margin-top: 2px; animation: exploreFade .2s ease;
        position: relative; }
      @keyframes exploreFade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      .hero-explore-option { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0);
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
        border-radius: 8px; padding: 6px 12px; cursor: pointer;
        transition: background .2s, border-color .2s; }
      .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .hero-explore-option { background: rgba(0,0,0,.04);
        border-color: rgba(0,0,0,.08); color: var(--ho-text, #1E2321); }
      :host(.theme-light) .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB); }

      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
      /* Bigger avatar for Hornero persona — zoom para recortar borde claro */
      .chat-container >>> .msg-avatar-row.persona-hornero .msg-avatar { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; }
      .chat-container >>> .msg-avatar-row.persona-hornero .msg-avatar img { width: 120px; height: 120px; margin: -32px; object-fit: cover; object-position: center 25%; }
      :host(.theme-light) .chat-container >>> .msg-avatar-row.persona-hornero .msg-avatar img { filter: brightness(0.25); }
    `;
  }

  _render() {
    return html`
      <div class="hero-banner${this._bannerVisible ? '' : ' collapsed'}" style="display:none">
        <div class="hero-banner-title">Ecosistema Hornero</div>
        ${this._bannerVisible ? html`
        <div class="hero-bajada">
          IA Sindical: inteligencia artificial desde la clase trabajadora. Datos propios, categorías propias, infraestructura propia.
        </div>
        ` : ''}
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="Laboratorio">Laboratorio</button>
          <button class="hero-explore-option" data-explore="Coyuntura">Coyuntura</button>
          <button class="hero-explore-option" data-explore="Panorama">Panorama</button>
          <button class="hero-explore-option" data-explore="Historia Obrera">Historia Obrera</button>
          <button class="hero-explore-option" data-explore="Derecho">Derecho</button>
          <button class="hero-explore-option" data-explore="Contenido">Contenido</button>
          <button class="hero-explore-option" data-explore="Reporte Gremial">Reporte Gremial</button>
        </div>
        ` : ''}
      </div>
      <div class="eco-cintillo">
        <button class="cintillo-back-btn" id="cintilloBack" title="Volver">
          <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
      </div>
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
          reduce-top-pad
          section="ecosistema"
          history-title="Historial"
          section-info='{"title":"Ecosistema Hornero","bajada":"IA Sindical: inteligencia artificial desde la clase trabajadora. Datos propios, categorías propias, infraestructura propia.","explore":["Laboratorio","Coyuntura","Panorama","Historia Obrera","Derecho","Contenido","Reporte Gremial"]}'
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
      // Listen for explore-select from info popup
      chatEl.addEventListener('explore-select', (e) => {
        const topic = e.detail.option;
        this._handleUserMessage('Contame sobre el núcleo ' + topic + ' del ecosistema');
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
      chatEl.addEventListener('chat-input-focus', () => {
        if (this._bannerVisible) {
          this._bannerVisible = false;
          // DOM directo — evita flash blanco del innerHTML completo
          const banner = this.shadowRoot.querySelector('.hero-banner');
          if (banner) banner.classList.add('collapsed');
          const bajada = this.shadowRoot.querySelector('.hero-bajada');
          if (bajada) bajada.style.display = 'none';
        }
      });
    }

    // Explore toggle
    const exploreToggle = this.shadowRoot.getElementById('exploreToggle');
    if (exploreToggle && !exploreToggle._bound) {
      exploreToggle._bound = true;
      exploreToggle.addEventListener('click', () => {
        this._exploreOpen = !this._exploreOpen;
        this.render();
      });
    }

    // Cintillo back button
    const cintilloBack = this.shadowRoot.getElementById('cintilloBack');
    if (cintilloBack && !cintilloBack._bound) {
      cintilloBack._bound = true;
      cintilloBack.addEventListener('click', () => {
        this.emit('screen-change', { screen: 'home' });
      });
    }

    // Explore options
    this.shadowRoot.querySelectorAll('.hero-explore-option').forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', () => {
        const topic = btn.getAttribute('data-explore');
        this._bannerVisible = false;
        this._exploreOpen = false;
        this._handleUserMessage('Contame sobre el núcleo ' + topic + ' del ecosistema');
      });
    });
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

    let index = 0;
    const chunkSize = 1;
    const interval = 25;

    this._revealTimer = setInterval(() => {
      index += chunkSize;
      if (index >= fullText.length) {
        clearInterval(this._revealTimer);
        this._revealTimer = null;
        const reportMsg = {
          role: 'hornero', text: fullText, tags: tags,
          persona: persona, time: this._timeNow(),
        };
        chatEl.finalizeStreamingMessage(reportMsg);
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
    if (this._bannerVisible) {
      this._bannerVisible = false;
      this._exploreOpen = false;
    }
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

  // ===== Backend URLs (via shared HorneroAPI) =====
  _getChatUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/chat'; }
  _getStreamUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/chat/stream'; }
  _getFeedbackUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/feedback'; }

  // ===== Streaming backend call =====
  async _callBackendStream(text) {
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
                const reportMsg = {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['ecosistema'],
                  persona: 'hornero',
                  redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
                  time: data.time || this._timeNow(),
                };
                this._typing = false;
                this._saveChatHistory();
                if (chatEl) {
                  chatEl.finalizeStreamingMessage(reportMsg);
                } else {
                  this.messages = [...this.messages, reportMsg];
                  this.render();
                }
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
        const partialMsg = {
          role: 'hornero', text: streamingText,
          tags: ['ecosistema', 'stream-partial'],
          persona: 'hornero', time: this._timeNow(),
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

  // ===== Non-streaming backend fallback =====
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
    const reportMsg = {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['ecosistema'],
      persona: 'hornero',
      redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    };
    this._typing = false;
    this._saveChatHistory();
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      chatEl.finalizeStreamingMessage(reportMsg);
    } else {
      this.messages = [...this.messages, reportMsg];
      this.render();
    }
  }

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

  // ===== Session management =====
  _startNewSession() {
    this.messages = [];
    this._sessionId = this._genId();
    this._greetingPushed = false;
    this._bannerVisible = true;
    this._exploreOpen = false;
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
      const baseUrl = window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com';
      await fetch(this._getFeedbackUrl(), {
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
