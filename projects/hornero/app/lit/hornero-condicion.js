// ===== <hornero-condicion> — Panorama: Condición obrera =====
// Banner + chat con Investigador/a (sociólogo)
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroCondicion extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,    // 'sociologo' — active persona for this screen
      sessionId: String,   // Session ID — if set, load existing session
      initialSection: String, // Initial section/topic (e.g. 'comportamiento')
      warmResume: Boolean, // True = warm resume (restore last session), false = cold start (new chat)
      messages: Array,
      _bannerVisible: Boolean,
      _exploreOpen: Boolean,
    };
  }

  // ===== Backend URLs (via shared HorneroAPI) =====
  _getChatUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/chat'; }
  _getGreetingUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/greeting'; }
  _getStreamUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/chat/stream'; }
  _getAudioUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/audio'; }
  _getFeedbackUrl() { return (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : 'https://hornero-ia.onrender.com') + '/api/feedback'; }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this._chatSection = 'panorama';
    this.messages = [];
    this._typing = false;
    this._greetingShown = false;
    this._greetingRequested = false;
    this._historyLoaded = false;
    this._bannerVisible = false;
    this._exploreOpen = false;
    this._sessionId = '';
    this._activePersona = 'sociologo';
    this._username = '';
    this._revealTimer = null;
    this._progressiveRevealTimer = null;
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
    this._pendingFinalizeMsg = null;
    this._savedDrawerState = null;
    this._audioProcessing = false; // Guard: prevent concurrent audio processing
  }

  connectedCallback() {
    // Read _username BEFORE super.connectedCallback() triggers render → _afterRender → _loadChatHistory
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
    super.connectedCallback();
  }

  disconnectedCallback() {
    // When the component is removed from DOM (e.g., user navigates to another screen or Perfil),
    // finalize any in-progress AI response and save to history before state is lost
    if (this._progressiveRevealTimer || this._typing || this._pendingFinalizeMsg) {
      if (this._progressiveRevealTimer) {
        clearInterval(this._progressiveRevealTimer);
        this._progressiveRevealTimer = null;
      }
      if (this._pendingFinalizeMsg) {
        const msg = this._pendingFinalizeMsg;
        this._pendingFinalizeMsg = null;
        this.iaStep++;
        this._typing = false; this._greetingRequested = false;
        this.messages = [...this.messages, msg];
      } else if (this._progressiveRevealFull) {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: this._progressiveRevealFull,
          tags: ['panorama', 'stream-partial'],
          persona: 'sociologo',
          time: this._timeNow(),
        }];
        this.iaStep++;
        this._typing = false;
      }
      this._progressiveRevealFull = '';
      this._progressiveRevealIndex = 0;
      this._saveChatHistory();
      this._emitSessionSave();
    }
  }

  // Emit session-save event so hornero-app can preserve active chat per screen
  _emitSessionSave() {
    if (this._sessionId) {
      this.emit('session-save', { screen: this._chatSection || 'condicion', sessionId: this._sessionId, persona: this._activePersona || this.persona || '' });
    }
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
        background: var(--ho-bg, #1E2321); position: relative; }

      /* ===== Hero banner — imagen de fondo opaca + texto ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-bg, #1E2321);
        padding: 14px 16px 10px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 8px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/panorama-bg.png') top center/100% auto no-repeat;
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
      :host(.theme-light) .hero-banner { background: var(--ho-bg, #1E2321); }
      :host(.theme-light) .hero-bajada { color: var(--ho-text-light, #7A766C); }
      .hero-bajada { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        text-align: left; position: relative; }
      .hero-bajada-link { display: inline-block; margin-top: 4px;
        font-family: 'Archivo', sans-serif; font-size: .76rem; font-weight: 600;
        color: var(--ho-green, #4E9978); }
      .hero-bajada-link:hover { color: var(--ho-green-dark, #3D6B56); }

      /* ===== Explorar dropdown ===== */
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
      .chat-container > hornero-chat { flex: 1; min-height: 0; }
    `;
  }

  _render() {
    return html`
      <div class="hero-banner${this._bannerVisible ? '' : ' collapsed'}" style="display:none">
        <div class="hero-banner-title">Panorama</div>
        ${this._bannerVisible ? html`
        <div class="hero-bajada" style="position:relative">
          Condición obrera, comportamiento empresarial, Salario Mínimo, Vital y Móvil real, felicidad laboral.
        </div>
        ` : ''}
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="Cómo Somos">Cómo Somos</button>
          <button class="hero-explore-option" data-explore="Comportamiento Empresarial">Comportamiento Empresarial</button>
          <button class="hero-explore-option" data-explore="SMVM">SMVM</button>
          <button class="hero-explore-option" data-explore="Índice de Felicidad">Índice de Felicidad</button>
        </div>
        ` : ''}
      </div>

      <div class="chat-container">
        <hornero-chat
          reduce-top-pad
          title="Investigador/a"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="panorama"
          history-title="Historial"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
          section-info='{"title":"Panorama","bajada":"El Sociólogo investiga la clase obrera: Cómo Somos, Comportamiento Empresarial, SMVM e Índice de Felicidad.","explore":["Cómo Somos","Comportamiento Empresarial","SMVM","Índice de Felicidad"]}'
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
          this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
          this._emitSessionSave();
          this.render();
        }
      });
      // Listen for explore-select from info popup
      chatEl.addEventListener('explore-select', (e) => {
        const topic = e.detail.option;
        const userMsg = { role: 'user', text: 'Contame sobre ' + topic, time: this._timeNow() };
        this.messages = [...this.messages, userMsg];
        this._addWithProgressiveReveal(this._exploreResponse(topic));
        this._saveChatHistory();
        this.render();
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
          // DOM directo — evita flash blanco del innerHTML completo
          const banner = this.shadowRoot.querySelector('.hero-banner');
          if (banner) banner.classList.add('collapsed');
          const bajada = this.shadowRoot.querySelector('.hero-bajada');
          if (bajada) bajada.style.display = 'none';
          const panel = this.shadowRoot.querySelector('.hero-explore-panel');
          if (panel) panel.style.display = 'none';
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

    // Bind Explorar toggle + option buttons
    const exploreToggle = this.shadowRoot.querySelector('#exploreToggle');
    if (exploreToggle) {
      exploreToggle.addEventListener('click', () => {
        this._exploreOpen = !this._exploreOpen;
        this.render();
      });
    }
    this.shadowRoot.querySelectorAll('.hero-explore-option').forEach(btn => {
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

    // Load chat history on first render
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }

    // Apply theme class
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
      chatEl.hidePersonaBar = false;
      chatEl.centerLogo = '';
      chatEl.noAutoScroll = this._bannerVisible;
      chatEl.topBarAccent = false;
      // Do NOT call chatEl.render() here — the chat re-renders itself
      // when its attributes change (from condicion render) or from drawer open/close.
      // Double render was causing the layout shift on banner.
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

    // If entering via section bar with a specific sub-section (SMVM, Felicidad, Comportamiento),
    // always start fresh with contextual greeting — don't restore old session
    if (this.initialSection && this.initialSection.length > 0) {
      this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      this._emitSessionSave();
      this._showGreeting();
      return;
    }

    // Try to restore the most recent session for this section + username (warm resume only)
    if (this.warmResume && typeof obtenerChatSessions === 'function' && this._username) {
      try {
        const sessions = await obtenerChatSessions(this._username);
        const mySessions = sessions.filter(s => s.section === this._chatSection);
        if (mySessions.length > 0) {
          const latestSession = mySessions[0];
          await this._loadSession(latestSession.sessionId);
          return;
        }
      } catch(e) { console.warn('Condicion: session restore failed', e); }
    }

    // No previous session found — start fresh with greeting
    this._requestGreeting();
  }

  async _loadSession(sessionId) {
    try {
      if (typeof obtenerChatSessionMessages === 'function') {
        const saved = await obtenerChatSessionMessages(sessionId);
        if (saved && saved.length > 0) {
          this._sessionId = sessionId;
          this._emitSessionSave();
          this._bannerVisible = false; // Hide banner when restoring session
          this.messages = saved;
          this._historyLoaded = true;
          this.render();
        }
      }
    } catch(e) { console.warn('Condicion: session load failed', e); }
  }

  // ===== Start a new chat session =====
  _startNewSession() {
    this._stopProgressiveReveal();
    this.messages = [];
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._emitSessionSave();
    this._historyLoaded = true;
    this._greetingRequested = false;
    this._activePersona = 'sociologo';
    // Never greet twice in the same session
    if (!this.messages.some(m => m.role === 'hornero' && m.tags && m.tags.includes('greeting'))) {
      this._requestGreeting();
    }
  }

  // ===== Generate greeting =====
  _showGreeting() {
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._emitSessionSave();

    // If coming from section bar (SMVM, Felicidad, Comp. Empre.), treat as a question
    const topicMap = {
      'comportamiento': 'Comportamiento Empresarial',
      'smvm': 'SMVM',
      'felicidad': 'Índice de Felicidad',
    };
    const topic = topicMap[this.initialSection];

    if (topic) {
      // Brief greeting + auto user question + Investigador response
      const greetingText = '¡Hola! Estamos en Panorama, la sección donde estudiamos la condición obrera desde distintos ángulos.';

      // Show greeting immediately (instant, no delay)
      this._revealMessage(greetingText, 'sociologo', ['panorama', 'greeting'], () => {
          // After greeting completes, auto-add user question + response
          this._bannerVisible = false;
          const userMsg = { role: 'user', text: 'Contame sobre ' + topic, time: this._timeNow() };
          this.messages = [...this.messages, userMsg];
          this._addWithProgressiveReveal(this._exploreResponse(topic));
          this._saveChatHistory();
          this.render();
        });
      return;
    }

    // Default greeting (no specific topic)
    const introText = '¡Hola! Investigo la clase obrera: cómo se forma, qué la compone, qué la daña y qué la sostiene.\n\n¿Querés saber de qué se trata esta sección? Revisá el botón **ℹ️** 👆';

    // Show greeting immediately (instant, no delay)
    this._revealMessage(introText, 'sociologo', ['panorama', 'greeting'], null);
  }

  // ===== Progressive reveal =====
  _revealMessage(fullText, persona, tags, onComplete) {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (!chatEl) {
      this.messages = [...this.messages, {
        role: 'hornero', text: fullText, tags: tags || ['panorama', 'greeting'],
        persona: persona || this._activePersona, time: this._timeNow(),
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
          role: 'hornero', text: fullText, tags: tags || ['panorama', 'greeting'],
          persona: persona || this._activePersona, time: this._timeNow(),
        };
        chatEl.finalizeStreamingMessage(reportMsg);
        if (onComplete) onComplete();
        return;
      }
      // Use duringReveal=true for lightweight rendering (plain text, no markdown)
      chatEl.updateStreamingText(fullText.substring(0, index), true);
    }, interval);
  }

  _stopProgressiveReveal() {
    // Clear greeting reveal timer
    if (this._revealTimer) {
      clearInterval(this._revealTimer);
      this._revealTimer = null;
    }
    // Clear streaming reveal timer
    if (this._progressiveRevealTimer) {
      clearInterval(this._progressiveRevealTimer);
      this._progressiveRevealTimer = null;
    }
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) { chatEl.streamingText = ''; chatEl._streamingPersona = ''; }
  }

  // Finalize the ongoing reveal immediately — show full text + save to messages
  // Used when user sends a new message while AI is still typing
  _finalizeCurrentReveal() {
    if (!this._progressiveRevealTimer) return; // No reveal running
    const fullText = this._progressiveRevealFull;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    // Show the complete text immediately
    if (chatEl && fullText) {
      chatEl.updateStreamingText(fullText, true);
    }
    // If API already finished and left a pending finalize msg, apply it
    if (this._pendingFinalizeMsg) {
      const msg = this._pendingFinalizeMsg;
      this._pendingFinalizeMsg = null;
      this.iaStep++;
      this._typing = false; this._greetingRequested = false;
      if (chatEl) {
        chatEl.finalizeStreamingMessage(msg);
      } else {
        this.messages = [...this.messages, msg];
      }
      this._saveChatHistory();
    }
    // Stop the timer
    this._stopProgressiveReveal();
  }

  // ===== Handle user message =====
  _handleUserMessage(text) {
    this._finalizeCurrentReveal();
    // Hide banner when user starts chatting
    if (this._bannerVisible) {
      this._bannerVisible = false;
    }
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    if (isFirstUserMsg) {
      const title = this._generateTitle(text);
      if (title) userMsg.title = title;
    }
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    // Race: backend stream vs timeout → fallback to local if too slow
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
      // Stream failed or timed out — try non-streaming, then local
      if (err.message === 'STREAM_TIMEOUT') {
        console.warn('Stream timed out after', STREAM_TIMEOUT, 'ms — falling back');
      } else {
        console.warn('Stream failed:', err);
      }
      this._callBackend(text).catch((err2) => {
        if (err2.message === 'FETCH_TIMEOUT') {
          this._addWithProgressiveReveal({
            role: 'hornero',
            text: 'El servidor está respondiendo lento. Intentá de nuevo en un momento.',
            tags: ['panorama', 'timeout'],
            persona: 'sociologo',
            time: this._timeNow(),
          });
        } else {
          this._addWithProgressiveReveal(this._localResponse(text));
        }
        this._typing = false; this._greetingRequested = false;
        this.render();
      });
    });
  }

  _generateTitle(text) {
    const t = (text || '').toLowerCase().trim();
    const keywords = [
      ['clase obrera', 'Clase obrera'], ['ice', 'Índice ICE'], ['smvm', 'SMVM'],
      ['salario mínimo', 'SMVM'], ['felicidad', 'Felicidad laboral'], ['ift', 'IFT'],
      ['comportamiento', 'Comportamiento empresarial'],
      ['canasta', 'Canasta básica'], ['distribución', 'Distribución del ingreso'],
      ['condición', 'Condición obrera'], ['panorama', 'Panorama'],
    ];
    for (const [kw, title] of keywords) {
      if (t.includes(kw)) return title;
    }
    const clean = text.trim().replace(/[?!.]+$/, '').substring(0, 50);
    return clean.length > 10 ? clean + '…' : 'Panorama';
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

  // ===== Greeting (backend) =====
  async _requestGreeting() {
    this._greetingRequested = true;
    // Generate session ID if not already set
    if (!this._sessionId) this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._emitSessionSave();

    // Show local greeting immediately (instant, no backend wait)
    const local = this._localGreeting();
    this._typing = false;
    this._addWithProgressiveReveal(local);

    try {
      if (window.HorneroAPI) window.HorneroAPI.wakeUpBackend();
      const response = await this._fetchWithTimeout(this._getGreetingUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'panorama',
          grade: this.grade,
          sector: this.sector,
          requested_persona: this._activePersona,
          session_id: this._sessionId,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      const msg = {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['panorama', 'greeting'],
        persona: 'sociologo',
        redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
        time: data.time || this._timeNow(),
      };
      // Only replace if backend returned something different from local greeting
      const backendText = data.text || (data.sections && data.sections.map(s => (s.title ? s.title + ': ' : '') + s.body).join('\n')) || '';
      if (backendText && backendText !== local.sections[0].body) {
        // Replace the first message with the backend version
        if (this.messages.length > 0 && this.messages[0].tags && this.messages[0].tags.includes('greeting')) {
          this.messages[0] = msg;
          const chatEl = this.shadowRoot.querySelector('hornero-chat');
          if (chatEl && chatEl.refreshMessages) chatEl.refreshMessages(this.messages);
          else this.render();
        }
      }
      this._greetingRequested = false;
    } catch (e) {
      this._typing = false; this._greetingRequested = false;
      // Local greeting already shown above — no fallback needed
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      sections: [
        { title: '', body: '¡Hola! Investigo la clase obrera: cómo se forma, qué la compone, qué la daña y qué la sostiene. ¿Sobre qué querés consultar?' },
      ],
      tags: ['panorama', 'greeting'],
      persona: 'sociologo',
      time: this._timeNow(),
    };
  }

  // ===== Streaming =====
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
        if (chatEl) chatEl.updateStreamingText(this._progressiveRevealFull, true);
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
      if (chatEl) chatEl.updateStreamingText(this._progressiveRevealFull.substring(0, this._progressiveRevealIndex), true);
    }, interval);
  }

  async _callBackendStream(text, onFirstToken) {
    const history = this.messages.map(m => ({
      role: m.role, text: m.text || '', sections: m.sections || [],
    }));

    const response = await fetch(this._getStreamUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'panorama',
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
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text !== undefined) {
                streamingPersona = data.persona || this._activePersona;
                const reportMsg = {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['panorama'],
                  persona: 'sociologo', // Force: condicion screen ALWAYS uses sociologo — never swap actors mid-chat
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
                    this._startProgressiveReveal(fullText, chatEl, this._activePersona);
                  } else {
                    this._stopProgressiveReveal();
                    this._typing = false; this._greetingRequested = false;
                    this._saveChatHistory();
                    if (chatEl) chatEl.finalizeStreamingMessage(reportMsg);
                  }
                }
                return;
              }
              if (data.message) throw new Error(data.message);
            } catch (e) { if (e.message !== 'Stream error') throw e; }
          }
        }
      }
    } catch (e) {
      this._stopProgressiveReveal();
      if (streamingText) {
        const partialMsg = {
          role: 'hornero', text: streamingText,
          tags: ['panorama', 'stream-partial'],
          persona: 'sociologo', time: this._timeNow(),
        };
        if (chatEl) {
          chatEl.finalizeStreamingMessage(partialMsg);
        } else {
          this.messages = [...this.messages, partialMsg];
        }
        this._saveChatHistory(); // Persist partial response to IndexedDB
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
      role: m.role, text: m.text || '', sections: m.sections || [],
    }));

    const response = await this._fetchWithTimeout(this._getChatUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'panorama',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();

    const reportMsg = {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['panorama'],
      persona: 'sociologo', // Force: condicion screen ALWAYS uses sociologo
      redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    };
    this.iaStep++;
    this._addWithProgressiveReveal(reportMsg);
  }

  // ===== Audio =====
  _handleAudioMessage(audioBlob, duration, fileName) {
    // Guard: prevent double audio processing (race condition when two audios sent quickly)
    if (this._audioProcessing) {
      console.warn('Audio already being processed — ignoring duplicate');
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      return;
    }
    this._audioProcessing = true;
    const durationStr = duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00';
    const userMsg = { role: 'user', text: `🎤 Audio (${durationStr})`, audio: true, duration, time: this._timeNow() };
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    this._callAudioBackend(audioBlob, fileName).catch((err) => {
      if (err.message === 'FETCH_TIMEOUT') {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'No puedo procesar el audio ahora — el servidor está lento. Intentá de nuevo.',
          tags: ['panorama', 'audio', 'timeout'],
          persona: 'sociologo', time: this._timeNow(),
        }];
      } else {
        this._addWithProgressiveReveal(this._localResponse('audio fallback'));
      }
      this._typing = false;
      this._audioProcessing = false;
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this.render();
    });
  }

  async _callAudioBackend(audioBlob, fileName) {
    const history = this.messages.map(m => ({
      role: m.role, text: m.text || '', sections: m.sections || [],
    }));
    const formData = new FormData();
    formData.append('audio', audioBlob, fileName || 'recording.webm');
    formData.append('formato', 'panorama');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', this._activePersona);
    formData.append('session_id', this._sessionId);
    formData.append('history', JSON.stringify(history));

    const response = await this._fetchWithTimeout(this._getAudioUrl(), {
      method: 'POST', body: formData,
    }, 45000);

    if (!response.ok) throw new Error('Audio backend error: ' + response.status);

    const data = await response.json();
    const msg = {
      role: 'hornero', text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['panorama', 'audio'],
      persona: 'sociologo', // Force: condicion screen ALWAYS uses sociologo
      redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    };
    this.iaStep++;
    this._addWithProgressiveReveal(msg);
    this._audioProcessing = false; // Reset audio guard
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) chatEl.resetAudioState();
  }

  // ===== Fallback offline =====
  _addWithProgressiveReveal(msg) {
    if (!msg.text || msg.text.length <= 50) {
      // Short text or sections-only (e.g. local greeting) — add directly, no typewriter
      this.messages = [...this.messages, msg];
      this._typing = false;
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
      // Save after AI response is added to messages
      this._saveChatHistory();
    });
  }

  // Brief local response when user clicks an explore button
  _exploreResponse(topic) {
    const p = this._activePersona;
    const map = {
      'Cómo Somos': { title: 'Cómo Somos', body: 'Datos duros de la clase trabajadora argentina: composición, empleo, informalidad, desigualdad. Preguntame lo que quieras.' },
      'Comportamiento Empresarial': { title: 'Comportamiento Empresarial', body: 'El Índice ICE mide 4 dimensiones del comportamiento empresarial: salarial (¿paga lo justo?), contractual (¿estabiliza el empleo?), ambiental (¿cuida el territorio?), sindical (¿respeta la organización?). ¿Qué dimensión te interesa?' },
      'SMVM': { title: 'SMVM', body: 'Salario Mínimo Vital y Móvil vs. valor real, brecha de superexplotación, canasta básica. Preguntame.' },
      'Índice de Felicidad': { title: 'Índice de Felicidad', body: 'IFT = SMVM × ICE. Un índice que cruza salario mínimo con comportamiento empresarial para medir la felicidad laboral. ¿Querés profundizar?' },
    };
    const section = map[topic] || { title: topic, body: 'Preguntame lo que quieras sobre ' + topic + '.' };
    return { role: 'hornero', sections: [section], tags: ['panorama', 'explore'], persona: p, time: this._timeNow() };
  }

  _localResponse(userText) {
    const lower = userText.toLowerCase();
    const p = this._activePersona;
    // Only match pure greetings — "hola" alone or "hola" + punctuation/whitespace, NOT "hola, me podes decir..."
    // But skip duplicate greeting if one already exists in this session
    const hasGreeting = this.messages.some(m => m.role === 'hornero' && m.tags &&
      (m.tags.includes('greeting') || m.tags.includes('saludo')));
    if (!hasGreeting && lower.match(/^(hola|buen|hey|qué tal|como|good|hi|saludos)\s*[!.?]*\s*$/)) {
      return { role: 'hornero', sections: [{ title: '', body: '¡Hola! Investigo la clase obrera: cómo se forma, qué la compone, qué la daña y qué la sostiene. Preguntame sobre el ICE, el SMVM, la felicidad laboral o lo que te interese.' }], tags: ['panorama', 'saludo'], persona: 'sociologo', time: this._timeNow() };
    }
    if (lower.match(/smvm|salario mínimo|salario minimo|canasta|brecha|superexplotación|superexplotacion/)) {
      return { role: 'hornero', sections: [{ title: 'SMVM', body: 'El Salario Mínimo Vital y Móvil es la frontera entre lo que la ley reconoce y lo que el trabajador necesita. La brecha entre el SMVM y la canasta básica revela la superexplotación: el trabajador no gana lo que necesita para vivir. ¿Querés que profundice en la canasta básica, la brecha salarial o el valor de la fuerza de trabajo?' }], tags: ['panorama', 'smvm'], persona: p, time: this._timeNow() };
    }
    if (lower.match(/ice|comportamiento empresarial|dimensión/)) {
      return { role: 'hornero', sections: [{ title: 'Comportamiento Empresarial', body: 'El Índice de Comportamiento Empresarial (ICE) mide 4 dimensiones: salarial (¿paga lo justo?), contractual (¿estabiliza el empleo?), ambiental (¿cuida el territorio?), sindical (¿respeta la organización?). ¿Qué dimensión te interesa?' }], tags: ['panorama', 'ice'], persona: p, time: this._timeNow() };
    }
    if (lower.match(/felicidad|ift|felicidad laboral|índice de felicidad/)) {
      return { role: 'hornero', sections: [{ title: 'Índice de Felicidad Laboral', body: 'El IFT = SMVM × ICE. Cruza lo que ganás con el comportamiento empresarial que sufrís. No es bienestar subjetivo — es un indicador material. Cuando el salario no alcanza y el comportamiento empresarial empeora, el IFT baja. ¿Querés profundizar?' }], tags: ['panorama', 'felicidad'], persona: p, time: this._timeNow() };
    }
    if (lower.match(/cómo somos|como somos|clase trabajadora|datos|composición/)) {
      return { role: 'hornero', sections: [{ title: 'Cómo Somos', body: 'Datos duros de la clase trabajadora argentina: composición sectorial, empleo, informalidad, desigualdad. ¿Qué aspecto te interesa?' }], tags: ['panorama', 'como-somos'], persona: p, time: this._timeNow() };
    }
    return { role: 'hornero', sections: [{ title: 'Investigador/a', body: 'No tengo datos específicos sobre eso, pero puedo ayudarte con: condición obrera, índice ICE, comportamiento empresarial, SMVM, felicidad laboral, datos de la clase trabajadora. ¿Qué te interesa?' }], tags: ['panorama'], persona: p, time: this._timeNow() };
  }

  _timeNow() {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, '0');
    const m = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][now.getMonth()];
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    return d + ' ' + m + ' ' + h + ':' + min;
  }

  // ===== Feedback =====
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
    } catch (e) { console.warn('Feedback send failed:', e); }
  }

  // ===== Save chat history =====
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
    } catch(e) { console.warn('Condicion: chat history save failed', e); }
  }

  // ===== Export =====
  _handleChatExport(detail) {
    if (!this.messages || this.messages.length === 0) return;
    if (detail && detail.download) {
      const title = detail.title || 'Panorama';
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: detail.download,
        tags: ['panorama', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  // ===== Persona navigate =====
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
}

customElements.define('hornero-condicion', HorneroCondicion);
