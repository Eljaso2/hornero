// ===== <hornero-archivo> — Esfera 6: Archivo del sindicato =====
// Chat con Historiadora que explica y ofrece el sistema de búsqueda
// Patrón idéntico a Historia Obrera (hornero-formacion)
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroArchivo extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,     // Initial persona from navigation
      sessionId: String,   // Session ID — if set, load existing session
      messages: Array,
      _bannerVisible: Boolean,
      _exploreOpen: Boolean,
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

  static get STREAM_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat/stream';
    }
    return 'https://hornero-ia.onrender.com/api/chat/stream';
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
    this._chatSection = 'archivo';
    this.messages = [];
    this._typing = false;
    this._greetingShown = false;
    this._greetingRequested = false;
    this._historyLoaded = false;
    this._bannerVisible = true;
    this._exploreOpen = false;
    this._sessionId = '';
    this._activePersona = 'archivo';
    this._username = '';
    this._progressiveRevealTimer = null;
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
    this._savedDrawerState = null;
  }

  connectedCallback() {
    super.connectedCallback();
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
        background: var(--ho-bg, #1E2321); overflow-x: hidden; position: relative; }

      /* ===== Hero banner — imagen de fondo opaca ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-dark, #1E2321);
        padding: 14px 16px 10px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 8px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden;
        min-height: 110px; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/archivo-bg.jpg') top center/100% auto no-repeat;
        opacity: .12; pointer-events: none; }
      .hero-banner.collapsed { padding: 10px 16px 8px; min-height: 0;
        gap: 6px; }
      .hero-banner.collapsed::before { opacity: .12; }
      .hero-banner.collapsed .hero-banner-title { font-size: 1.2rem; }
      .hero-banner.collapsed .hero-explore-link { font-size: .64rem; }
      .hero-banner-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.4rem; color: var(--ho-text, #E8E6E0);
        letter-spacing: .02em; text-transform: uppercase; position: relative; }
      :host(.theme-light) .hero-banner-title { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .hero-banner { background: var(--ho-mid-gray, #ECEAE3); }
      :host(.theme-light) .hero-bajada { color: var(--ho-text-light, #7A766C); }
      .hero-bajada { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        text-align: left; position: relative; min-height: 3.2em; }

      /* ===== Explorar dropdown ===== */
      .hero-explore-link { display: inline-flex; align-items: center; gap: 4px;
        font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
        color: var(--ho-green, #4E9978); background: none;
        border: none; padding: 0; cursor: pointer; position: relative;
        transition: color .2s; }
      .hero-explore-link:hover { color: var(--ho-green-dark, #3D6B56); }
      .hero-explore-link::after { content: '▾'; font-size: .58rem; margin-left: 2px; }
      .hero-explore-link.open::after { content: '▴'; }
      .hero-explore-panel { display: flex; flex-wrap: wrap; gap: 6px;
        margin-top: 2px; animation: exploreFade .2s ease;
        position: relative; }
      @keyframes exploreFade { from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: none; } }
      .hero-explore-option { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0);
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
        border-radius: 8px; padding: 6px 12px; cursor: pointer;
        transition: background .2s, border-color .2s; }
      .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .hero-explore-option { background: rgba(0,0,0,.04);
        border-color: rgba(0,0,0,.08); }
      :host(.theme-light) .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB); }

      /* ===== Chat container ===== */
      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
    `;
  }

  _render() {
    return html`
      <div class="hero-banner${this._bannerVisible ? '' : ' collapsed'}">
        <div class="hero-banner-title">Archivo</div>
        ${this._bannerVisible ? html`
        <div class="hero-bajada">
          Convenios, referentes, fuentes sindicales, documentos académicos. La memoria del sindicato.
        </div>
        ` : ''}
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="Convenios">Convenios</button>
          <button class="hero-explore-option" data-explore="Referentes">Referentes</button>
          <button class="hero-explore-option" data-explore="Académicos">Académicos</button>
          <button class="hero-explore-option" data-explore="Legislación">Legislación</button>
          <button class="hero-explore-option" data-explore="Multimedia">Multimedia</button>
        </div>
        ` : ''}
      </div>

      <div class="chat-container">
        <hornero-chat
          title="Archivo"
          input-placeholder="Buscar en el archivo..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="archivo"
          history-title="Historial"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
          no-auto-scroll="${this._bannerVisible}"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._syncChatMessages(chatEl);
      // Restore drawer state saved before re-render
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
      chatEl.addEventListener('chat-back', () => {
        this.emit('screen-change', { screen: 'home' });
      });
      chatEl.addEventListener('chat-input-focus', () => {
        if (this._bannerVisible) {
          this._bannerVisible = false;
          this._exploreOpen = false;
          this.render();
        }
      });
      chatEl.addEventListener('chat-audio', (e) => {
        this._handleAudioMessage(e.detail.audioBlob, e.detail.duration, e.detail.fileName);
      });
      chatEl.addEventListener('chat-feedback', (e) => {
        this._sendFeedback(e.detail);
      });
      chatEl.addEventListener('chat-export', (e) => {
        this._handleChatExport(e.detail);
      });
      chatEl.addEventListener('chat-new-session', () => {
        this._startNewSession();
      });
    }

    // Load chat history or show greeting
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }

    // Bind Explorar toggle + option buttons
    const exploreToggle = this.shadowRoot.querySelector('#exploreToggle');
    if (exploreToggle && !exploreToggle._bound) {
      exploreToggle._bound = true;
      exploreToggle.addEventListener('click', () => {
        this._exploreOpen = !this._exploreOpen;
        this.render();
      });
    }
    this.shadowRoot.querySelectorAll('.hero-explore-option').forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', () => {
        const topic = btn.dataset.explore;
        this._exploreOpen = false;
        this._bannerVisible = false;
        // Add user message + brief local IA response
        const userMsg = { role: 'user', text: 'Contame sobre ' + topic, time: this._timeNow() };
        this.messages = [...this.messages, userMsg];
        this._addWithProgressiveReveal(this._exploreResponse(topic));
        this._saveChatHistory();
        this.render();
      });
    });

    // Apply light mode class to host for banner overlay
    try {
      const theme = localStorage.getItem('hornero-theme') || 'dark';
      if (theme === 'light') {
        this.classList.add('theme-light');
      } else {
        this.classList.remove('theme-light');
      }
    } catch(e) {}
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
      chatEl.noAutoScroll = this._bannerVisible;
      chatEl.render();
    }
  }

  // ===== Load chat history from IndexedDB =====
  async _loadChatHistory() {
    if (this._historyLoaded) return;
    this._historyLoaded = true;

    // If a sessionId was passed (from Mis Conversaciones), load that session
    if (this.sessionId && this.sessionId.length > 0) {
      await this._loadSession(this.sessionId);
      this.sessionId = '';
      return;
    }

    // Try to restore the most recent session for this section + username
    if (typeof obtenerChatSessions === 'function' && this._username) {
      try {
        const sessions = await obtenerChatSessions(this._username);
        const mySessions = sessions.filter(s => s.section === this._chatSection);
        if (mySessions.length > 0) {
          const latestSession = mySessions[0];
          await this._loadSession(latestSession.sessionId);
          return;
        }
      } catch(e) { console.warn('Archivo: session restore failed', e); }
    }

    // No previous session found — start fresh with greeting
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._showGreeting();
  }

  async _loadSession(sessionId) {
    try {
      if (typeof obtenerChatSessionMessages === 'function') {
        const saved = await obtenerChatSessionMessages(sessionId);
        if (saved && saved.length > 0) {
          this._sessionId = sessionId;
          this._bannerVisible = false;
          this.messages = saved;
          this._historyLoaded = true;
          this.render();
        }
      }
    } catch(e) { console.warn('Archivo: session load failed', e); }
  }

  // ===== Start a new chat session =====
  _startNewSession() {
    this._stopProgressiveReveal();
    this.messages = [];
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._historyLoaded = true;
    this._greetingRequested = false;
    this._exploreOpen = false;
    this._activePersona = 'archivo';
    this._requestGreeting();
  }

  // ===== Greeting: explain the search system =====
  _showGreeting() {
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    const greetingText = '¡Hola! Soy la Historiadora. En el archivo del sindicato encontrás convenios, referentes, fuentes sindicales, documentos académicos y más.\n\nAcá podemos buscar:\n\n• 🔍 Por palabra clave — Decime qué tema te interesa y busco en todo el archivo\n• 📄 Fuentes por categoría — Explorá los documentos organizados por tema: convenios, historia sindical, legislación laboral, etc.\n• 📚 Académicos — Artículos y papers de investigación sobre el mundo del trabajo\n• 📰 Multimedia — Notas periodísticas, audio, video (se irá sumando contenido)\n\nPreguntame lo que quieras o decime un tema y te busco las fuentes.';

    // 1. Show typing dots for 1s
    this._typing = true;
    this.render();

    setTimeout(() => {
      // 2. Progressive reveal of greeting
      this._typing = false;
      this._revealMessage(greetingText, 'historiador', ['archivo', 'greeting', 'busqueda'], null);
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

  // ===== Handle user message =====
  _handleUserMessage(text) {
    this._stopProgressiveReveal();
    // Hide banner when user starts chatting
    if (this._bannerVisible) {
      this._bannerVisible = false;
      this._exploreOpen = false;
    }
    this.messages = [...this.messages, { role: 'user', text, tags: ['archivo'], time: this._timeNow() }];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    // Try streaming first, fallback to non-streaming
    this._callBackendStream(text).catch((err) => {
      console.warn('Stream failed, falling back to non-streaming:', err);
      this._callBackend(text).catch((err2) => {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'No puedo conectarme ahora. Intentá de nuevo en un momento.',
          tags: ['archivo', 'error'],
          persona: 'historiador',
          time: this._timeNow(),
        }];
        this._typing = false;
        this.render();
      });
    });
  }

  // ===== Progressive reveal for backend stream =====
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
        if (chatEl) chatEl.updateStreamingText(this._progressiveRevealFull);
        return;
      }
      if (chatEl) {
        chatEl.updateStreamingText(this._progressiveRevealFull.substring(0, this._progressiveRevealIndex));
      }
    }, interval);
  }

  _stopProgressiveReveal() {
    if (this._progressiveRevealTimer) {
      clearInterval(this._progressiveRevealTimer);
      this._progressiveRevealTimer = null;
    }
    if (this._revealTimer) {
      clearInterval(this._revealTimer);
      this._revealTimer = null;
    }
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
  }

  async _callBackendStream(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(HorneroArchivo.STREAM_URL, {
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

    if (!response.ok) throw new Error('Stream error: ' + response.status);

    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamingText = '';
    let streamingPersona = this._activePersona;

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
                if (content.length > 50 && !this._progressiveRevealTimer) {
                  this._startProgressiveReveal(streamingText, chatEl, streamingPersona);
                } else {
                  chatEl.streamingText = streamingText;
                  chatEl._streamingPersona = streamingPersona;
                  chatEl.updateStreamingText(streamingText);
                }
              }
            }
          }
          if (line.startsWith('data: {')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text !== undefined) {
                streamingPersona = data.persona || this._activePersona;
                this.messages = [...this.messages, {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['archivo'],
                  persona: 'historiador',
                  redirect_persona: data.redirect_persona || '',
                  time: data.time || this._timeNow(),
                }];
                this._stopProgressiveReveal();
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
      this._stopProgressiveReveal();
      if (streamingText) {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: streamingText,
          tags: ['archivo', 'stream-partial'],
          persona: 'historiador',
          time: this._timeNow(),
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

    const response = await this._fetchWithTimeout(HorneroArchivo.API_URL, {
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
    const responseText = data.text || '';

    if (responseText && responseText.length > 50) {
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) {
        this._typing = false;
        this._startProgressiveReveal(responseText, chatEl, 'historiador');
        const revealDone = new Promise((resolve) => {
          const check = setInterval(() => {
            if (!this._progressiveRevealTimer) { clearInterval(check); resolve(); }
          }, 50);
        });
        const timeout = new Promise((resolve) => setTimeout(resolve, 15000));
        await Promise.race([revealDone, timeout]);
        this._stopProgressiveReveal();
        if (chatEl) { chatEl.streamingText = ''; chatEl._streamingPersona = ''; }
      }
    }

    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['archivo'],
      persona: 'historiador',
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

  // ===== Request greeting from backend =====
  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await this._fetchWithTimeout(HorneroArchivo.GREETING_URL, {
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
        tags: data.tags || ['archivo', 'greeting'],
        persona: 'historiador',
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      this._typing = false; this._greetingRequested = false;
      this.render();
    } catch (e) {
      this._typing = false; this._greetingRequested = false;
      this.messages = [this._localGreeting()];
      this.render();
    }
  }

  _localGreeting() {
    return { role: 'hornero', sections: [{ title: '', body: '¡Hola! Soy la Historiadora — en el archivo del sindicato encontrás convenios, referentes, fuentes y documentos. Preguntame lo que buscás y te guío.' }], tags: ['archivo', 'greeting'], persona: 'historiador', time: this._timeNow() };
  }

  // ===== Handle audio message =====
  async _handleAudioMessage(audioBlob, duration, fileName) {
    this.messages = [...this.messages, { role: 'user', text: '🎤 Audio enviado', tags: ['archivo', 'audio'], time: this._timeNow() }];
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

      const response = await this._fetchWithTimeout(HorneroArchivo.AUDIO_URL, {
        method: 'POST',
        body: formData,
      }, 45000);

      if (!response.ok) throw new Error('Audio backend error: ' + response.status);

      const data = await response.json();
      this.messages = [...this.messages, {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['archivo', 'audio'],
        persona: 'historiador',
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
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
      const errTags = e.message === 'FETCH_TIMEOUT' ? ['archivo', 'audio', 'timeout'] : ['archivo', 'audio-error'];
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

  _handlePersonaNavigate(targetPersona) {
    const screenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'companero': { screen: 'gremial', persona: 'companero' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'historiador': { screen: 'formacion', persona: 'historiador' },
      'archivo': { screen: 'archivo', persona: 'archivo' },
      'sociologo': { screen: 'condicion', persona: 'sociologo' },
    };
    const target = screenMap[targetPersona];
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }

  _handleChatExport(detail) {
    if (!this.messages || this.messages.length === 0) return;
    if (detail && detail.download) {
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: detail.download,
        tags: ['archivo', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

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
          persona: detail.persona || this._activePersona,
          message_text: detail.messageText || '',
        }),
      });
    } catch (e) { console.warn('Feedback send failed:', e); }
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
    } catch(e) { console.warn('Archivo: chat history save failed', e); }
  }

  // Brief local response when user clicks an explore button
  _exploreResponse(topic) {
    const map = {
      'Convenios': { title: 'Convenios', body: 'Convenios colectivos de trabajo, CCT aceitero, escalas salariales, cláusulas. ¿Qué aspecto del convenio te interesa?' },
      'Referentes': { title: 'Referentes', body: 'Dirigentes sindicales, delegados, luchadores históricos del movimiento obrero aceitero. ¿Sobre quién querés saber?' },
      'Académicos': { title: 'Académicos', body: 'Artículos, papers y documentos de investigación sobre el mundo del trabajo. ¿Qué tema académico te interesa?' },
      'Legislación': { title: 'Legislación', body: 'Leyes laborales, reformas, jurisprudencia, normativa sindical. ¿Qué aspecto legal buscás?' },
      'Multimedia': { title: 'Multimedia', body: 'Notas periodísticas, audio, video, documentos visuales del archivo sindical. ¿Qué formato preferís?' },
    };
    const section = map[topic] || { title: topic, body: 'Preguntame lo que quieras sobre ' + topic + '.' };
    return { role: 'hornero', sections: [section], tags: ['archivo', 'explore'], persona: 'historiador', time: this._timeNow() };
  }

  // Add a message with progressive reveal (typing effect)
  _addWithProgressiveReveal(msg) {
    if (!msg.text || msg.text.length <= 50) {
      this.messages = [...this.messages, msg];
      this._typing = false;
      this._saveChatHistory();
      this.render();
      return;
    }
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    this._typing = false;
    this._startProgressiveReveal(msg.text, chatEl, msg.persona || 'historiador');
    const revealDone = new Promise((resolve) => {
      const check = setInterval(() => {
        if (!this._progressiveRevealTimer) { clearInterval(check); resolve(); }
      }, 50);
    });
    const timeout = new Promise((resolve) => setTimeout(resolve, 15000));
    Promise.race([revealDone, timeout]).then(() => {
      this._stopProgressiveReveal();
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) { chatEl.streamingText = ''; chatEl._streamingPersona = ''; }
      this.messages = [...this.messages, msg];
      this._saveChatHistory();
      this.render();
    });
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

customElements.define('hornero-archivo', HorneroArchivo);
