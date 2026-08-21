// ===== <hornero-consulta> — Consulta legal =====
// Chat directo — IA inicia diálogo saludando y explicando qué se puede consultar
// Backend LLM (DashScope/Claude) + fallback offline con KB local
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroConsulta extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,  // Initial persona from Mesa de Trabajo landing
      sessionId: String, // Session ID — if set, load existing session instead of greeting
      messages: Array,
      iaStep: Number,
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

  static get STREAM_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat/stream';
    }
    return 'https://hornero-ia.onrender.com/api/chat/stream';
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this._chatSection = 'consulta'; // Section key for history
    this.messages = [];
    this.iaStep = 0;
    this._bannerVisible = true;
    this._exploreOpen = false;
    this._typing = false; this._greetingRequested = false;
    this._historyLoaded = false;
    this._sessionId = ''; // Current session ID — new on each visit
    this._activePersona = 'abogado'; // Default — overridden by persona attribute from Mesa landing
    this._username = ''; // login username for per-user data isolation
    this._progressiveRevealTimer = null;
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
    this._savedDrawerState = null; // Drawer state saved before re-render (prevents drawer closing)
    this._audioProcessing = false; // Guard: prevent concurrent audio processing
  }

  connectedCallback() {
    // Read _username BEFORE super.connectedCallback() triggers render → _afterRender → _loadChatHistory
    // If read after, _username is '' when _loadChatHistory runs → IndexedDB fallback is skipped → new session
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
    super.connectedCallback();
    // Don't generate sessionId yet — _loadChatHistory will restore or create
  }

  disconnectedCallback() {
    // When the component is removed from DOM (e.g., user navigates to another screen or Perfil),
    // finalize any in-progress AI response and save to history before state is lost
    if (this._progressiveRevealTimer || this._typing || this._pendingFinalizeMsg || this._streamAbortController) {
      // Stop the typewriter timer immediately
      if (this._progressiveRevealTimer) {
        clearInterval(this._progressiveRevealTimer);
        this._progressiveRevealTimer = null;
      }
      // Abort the streaming fetch — triggers catch block which saves partial response
      if (this._streamAbortController) {
        this._streamAbortController.abort();
        this._streamAbortController = null;
      }
      // If API already finished and left a pending finalize msg, add it to messages
      if (this._pendingFinalizeMsg) {
        const msg = this._pendingFinalizeMsg;
        this._pendingFinalizeMsg = null;
        this.iaStep++;
        this._typing = false; this._greetingRequested = false;
        this.messages = [...this.messages, msg];
      } else if (this._progressiveRevealFull) {
        // API still streaming — save whatever text we have so far as partial response
        this.messages = [...this.messages, {
          role: 'hornero',
          text: this._progressiveRevealFull,
          tags: ['consulta', 'stream-partial'],
          persona: 'abogado',
          time: this._timeNow(),
        }];
        this.iaStep++;
        this._typing = false;
      }
      this._progressiveRevealFull = '';
      this._progressiveRevealIndex = 0;
      // Persist to IndexedDB before the component is gone
      this._saveChatHistory();
      // Notify hornero-app of session so it can be restored
      this._emitSessionSave();
    }
  }

  // Emit session-save event so hornero-app can preserve active chat per screen
  _emitSessionSave() {
    if (this._sessionId) {
      this.emit('session-save', { screen: this._chatSection || 'consulta', sessionId: this._sessionId, persona: this._activePersona || this.persona || '' });
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

      /* ===== Hero banner — imagen de fondo opaca ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-bg, #1E2321);
        padding: 14px 16px 10px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 8px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/Aniversario-Noche-de-las-corbatas_IG--1024x1024 copy.png') top center/100% auto no-repeat;
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

      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
      .chat-container > hornero-chat { flex: 1; min-height: 0; }
    `;
  }

  _render() {
    return html`
      <div class="hero-banner${this._bannerVisible ? '' : ' collapsed'}">
        <div class="hero-banner-title">Derecho</div>
        ${this._bannerVisible ? html`
        <div class="hero-bajada">
          Legislación laboral, convenios colectivos. Asesoramiento legal para trabajadores y delegados.
        </div>
        ` : ''}
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="Paritaria">Paritaria</button>
          <button class="hero-explore-option" data-explore="Condiciones laborales">Condiciones laborales</button>
          <button class="hero-explore-option" data-explore="SMVM y distribución">SMVM y distribución</button>
          <button class="hero-explore-option" data-explore="Reforma laboral">Reforma laboral</button>
          <button class="hero-explore-option" data-explore="CCT 420/05">CCT 420/05</button>
          <button class="hero-explore-option" data-explore="Organización sindical">Organización sindical</button>
        </div>
        ` : ''}
      </div>

      <div class="chat-container">
        <hornero-chat
          title="Chateá con tu interlocutor/a"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
          no-auto-scroll="${this._bannerVisible}"
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
      // Listen for session selection from history drawer
      chatEl.addEventListener('chat-session-select', (e) => {
        this._loadSession(e.detail.sessionId);
      });
      // Listen for session deletion from history drawer
      chatEl.addEventListener('chat-session-delete', (e) => {
        if (e.detail.sessionId === this._sessionId) {
          this.messages = [];
          this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now();
          this._emitSessionSave();
          this.render();
        }
      });
      // Delete individual message — remove from local array + IndexedDB
      chatEl.addEventListener('chat-message-delete', (e) => {
        const { msgIndex, msg } = e.detail;
        if (msgIndex >= 0 && msgIndex < this.messages.length) {
          this.messages.splice(msgIndex, 1);
          // Delete from IndexedDB if msg has an id
          if (msg && msg.id && typeof borrarChatMsg === 'function') {
            borrarChatMsg(msg.id);
          }
          this.render();
        }
      });
      // Listen for persona navigate from top-bar icons
      chatEl.addEventListener('persona-navigate', (e) => {
        this._handlePersonaNavigate(e.detail.persona, e.detail.screen);
      });
      // Listen for persona redirect from derivation button
      chatEl.addEventListener('persona-redirect', (e) => {
        this._handlePersonaNavigate(e.detail.persona);
      });
      // Listen for back button → go to chat landing
      chatEl.addEventListener('chat-back', () => {
        this.emit('screen-change', { screen: 'chat' });
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
      // Listen for audio message from mic recording
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

    // Load history from IndexedDB first, then request greeting if empty
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }
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
      } catch(e) { console.warn('Consulta: session restore failed', e); }
    }

    // No previous session found — start fresh
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._emitSessionSave();
    if (this.messages.length === 0 && !this._greetingRequested) {
      this._requestGreeting();
    } else if (this.messages.some(m => m.role === 'hornero' && m.tags && m.tags.includes('greeting'))) {
      // Greeting already exists — never greet twice in the same session
      return;
    }
  }

  // Load an existing session from history
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
    } catch(e) { console.warn('Consulta: session load failed', e); }
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
    this._emitSessionSave();
    this._historyLoaded = true;
    this._greetingRequested = false;
    this._activePersona = this.persona || this._activePersona; // Keep original persona choice, don't reset to abogado
    this._requestGreeting();
  }

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await this._fetchWithTimeout(HorneroConsulta.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'consulta',
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
        tags: data.tags || ['consulta', 'greeting'],
        persona: 'abogado',
        redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
        time: data.time || this._timeNow(),
      };
      this._typing = false; this._greetingRequested = false;
      this._addWithProgressiveReveal(msg);
    } catch (e) {
      // Fallback: local greeting
      this._typing = false; this._greetingRequested = false;
      this._addWithProgressiveReveal(this._localGreeting());
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      sections: [
        { title: '', body: '¡Hola! Soy el Abogado — soy laboralista del gremio aceitero, te ayudo con derechos, convenio, CCT, legislación laboral. ¿Qué consulta tenés?' },
      ],
      tags: ['consulta', 'greeting'],
      persona: 'abogado',
      time: this._timeNow(),
    };
  }

  // ===== Generate a descriptive chat title from the user's first message =====
  _generateTitle(text, section) {
    const t = (text || '').toLowerCase().trim();
    // Keyword → title map (most specific first)
    const keywords = [
      ['paritaria', 'Paritaria aceitera'],
      ['smvm', 'SMVM y salario mínimo'],
      ['salario mínimo', 'SMVM y salario mínimo'],
      ['salario', 'Salario y remuneración'],
      ['convenio', 'Convenio colectivo'],
      ['cct 420', 'Convenio CCT 420'],
      ['cct', 'Convenio colectivo'],
      ['reforma laboral', 'Reforma laboral'],
      ['reforma', 'Reforma laboral'],
      ['despidos', 'Despidos y estabilidad'],
      ['estabilidad', 'Estabilidad laboral'],
      ['jornada', 'Jornada laboral'],
      ['horas extra', 'Horas extras'],
      ['vacaciones', 'Vacaciones y descanso'],
      ['licencia', 'Licencias laborales'],
      ['enfermedad', 'Enfermedad y licencia'],
      ['accidente', 'Accidentes laborales'],
      ['art', 'ART y seguridad'],
      ['seguridad', 'Seguridad laboral'],
      ['sindicato', 'Organización sindical'],
      ['delegado', 'Delegados y representación'],
      ['asamblea', 'Asamblea y participación'],
      ['organización', 'Organización sindical'],
      ['greca', 'GRECA y afiliación'],
      ['afiliación', 'Afiliación sindical'],
      ['yofra', 'Daniel Yofra'],
      ['cremonte', 'Investigador Cremonte'],
      ['reporte', 'Reporte de situación'],
      ['situación', 'Situación laboral'],
      ['condiciones', 'Condiciones laborales'],
      ['trabajo', 'Condiciones laborales'],
      ['derechos', 'Derechos laborales'],
      ['ley', 'Legislación laboral'],
      ['contrato', 'Contrato de trabajo'],
      ['firma', 'Firma y documentación'],
      ['código', 'Código laboral'],
      ['discriminación', 'Discriminación laboral'],
      ['acoso', 'Acoso laboral'],
      ['mujeres', 'Mujeres y trabajo'],
      ['capacitación', 'Capacitación laboral'],
      ['formación', 'Formación sindical'],
    ];
    for (const [kw, title] of keywords) {
      if (t.includes(kw)) return title;
    }
    // Fallback: clean up first 50 chars as title
    const clean = text.trim().replace(/[?!.]+$/, '').substring(0, 50);
    return clean.length > 10 ? clean + '…' : 'Consulta';
  }

  _handleUserMessage(text) {
    // If AI is still typing/revealing, finalize immediately — don't lose the response
    this._finalizeCurrentReveal();
    // Hide banner when user starts chatting
    if (this._bannerVisible) {
      this._bannerVisible = false;
    }
    // Detect export keywords — download current chat as document
    // Only match explicit export requests, not incidental words in normal conversation
    const lower = text.toLowerCase().trim();
    const isExportRequest = lower.match(/^(exportar|descargar|guardar documento|download|export)\b/) ||
      lower.match(/\b(exportar chat|descargar chat|exportar conversación|descargar conversación)\b/);
    if (isExportRequest) {
      this._exportCurrentChat();
      return;
    }

    // Generate title for session from the first user message
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    const title = isFirstUserMsg ? this._generateTitle(text, 'consulta') : undefined;
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    if (title) userMsg.title = title;
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    // Try streaming first, fallback to non-streaming
    this._callBackendStream(text).catch((err) => {
      console.warn('Stream failed, falling back to non-streaming:', err);
      this._callBackend(text).catch((err2) => {
        if (err2.message === 'FETCH_TIMEOUT') {
          this._addWithProgressiveReveal({
            role: 'hornero',
            text: 'El servidor está respondiendo lento. Intentá de nuevo en un momento, o probá tu consulta más tarde.',
            tags: ['consulta', 'timeout'],
            persona: 'abogado',
            time: this._timeNow(),
          });
        } else {
          this._addWithProgressiveReveal(this._localResponse(text));
        }
        this.iaStep++;
        this._typing = false; this._greetingRequested = false;
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

  async _callBackendStream(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    // AbortController to cancel the stream if user navigates away
    this._streamAbortController = new AbortController();

    const response = await fetch(HorneroConsulta.STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'consulta',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
        session_id: this._sessionId,
      }),
      signal: this._streamAbortController.signal,
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
              if (chatEl) {
                // Always use progressive reveal for typewriter effect
                // If reveal is already running, extend the buffer; otherwise start it
                if (this._progressiveRevealTimer) {
                  // Reveal in progress — update the full text buffer
                  this._progressiveRevealFull = streamingText;
                } else {
                  // Start fresh reveal
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
                  tags: data.tags || ['consulta'],
                  persona: 'abogado', // Force: consulta screen ALWAYS uses abogado — never swap actors mid-chat
                  redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
                  time: data.time || this._timeNow(),
                };
                // Always use typewriter reveal — if none running, start one
                this._pendingFinalizeMsg = reportMsg;
                this._streamAbortController = null; // Stream completed normally
                if (!this._progressiveRevealTimer) {
                  // No reveal running — start one for the full response
                  const fullText = data.text || streamingText;
                  if (chatEl && fullText) {
                    this._startProgressiveReveal(fullText, chatEl, this._activePersona);
                  } else {
                    // No text to reveal — finalize immediately
                    this._stopProgressiveReveal();
                    this.iaStep++;
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
          tags: ['consulta', 'stream-partial'],
          persona: 'abogado',
          time: this._timeNow(),
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
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await this._fetchWithTimeout(HorneroConsulta.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'consulta',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    const responseText = data.text || '';

    const reportMsg = {
      role: 'hornero',
      text: responseText,
      sections: data.sections || [],
      tags: data.tags || ['consulta'],
      persona: 'abogado', // Force: consulta screen ALWAYS uses abogado
      redirect_persona: data.redirect_persona || '',
      image: data.image || '',
      source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    };
    this.iaStep++;
    this._addWithProgressiveReveal(reportMsg);
  }

  // ===== Audio message handling =====
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
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    if (isFirstUserMsg) userMsg.title = 'Audio message';
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    this._callAudioBackend(audioBlob, fileName).catch((err) => {
      if (err.message === 'FETCH_TIMEOUT') {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'No puedo procesar el audio ahora — el servidor está lento. Intentá de nuevo.',
          tags: ['consulta', 'audio', 'timeout'],
          persona: 'abogado',
          time: this._timeNow(),
        }];
      } else {
        const chatEl = this.shadowRoot.querySelector('hornero-chat');
        this._addWithProgressiveReveal(this._localResponse('audio fallback'));
      }
      this.iaStep++;
      this._typing = false;
      this._audioProcessing = false;
      if (chatEl) chatEl.resetAudioState();
      this.render();
    });
  }

  async _callAudioBackend(audioBlob, fileName) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const formData = new FormData();
    formData.append('audio', audioBlob, fileName || 'recording.webm');
    formData.append('formato', 'consulta');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', this._activePersona);
    formData.append('session_id', this._sessionId);
    formData.append('history', JSON.stringify(history));

    const response = await this._fetchWithTimeout(HorneroConsulta.AUDIO_URL, {
      method: 'POST',
      body: formData, // Browser sets multipart Content-Type automatically
    }, 45000);

    if (!response.ok) throw new Error('Audio backend error: ' + response.status);

    const data = await response.json();
    const msg = {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['consulta', 'audio'],
      persona: 'abogado', // Force: consulta screen ALWAYS uses abogado
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
  // Add a message with progressive reveal (typing effect)
  _addWithProgressiveReveal(msg) {
    // Always use progressive reveal for typewriter effect
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
      'Paritaria': { title: 'Paritaria', body: 'La negociación colectiva aceitera: propuesta patronal, demanda obrera, cláusulas, topes. Preguntame lo que quieras.' },
      'Condiciones laborales': { title: 'Condiciones laborales', body: 'Jornada, salud, seguridad, ART, acoso, carga. Las condiciones concretas de trabajo. ¿Qué te interesa?' },
      'SMVM y distribución': { title: 'SMVM y distribución', body: 'Salario Mínimo Vital y Móvil vs. valor real, brecha de superexplotación, distribución del ingreso. Preguntame.' },
      'Reforma laboral': { title: 'Reforma laboral', body: 'Cambios en la legislación laboral: DNU, Ley Bases, flexibilización, impacto en convenios. ¿Qué aspecto te interesa?' },
      'CCT 420/05': { title: 'CCT 420/05', body: 'Convenio Colectivo de Trabajo aceitero: escalas, categorías, cláusulas, vigencia. Preguntame lo que quieras.' },
      'Organización sindical': { title: 'Organización sindical', body: 'Estructura, delegados, comisión interna, asamblea, derechos de representación. ¿Sobre qué querés saber?' },
    };
    const section = map[topic] || { title: topic, body: 'Preguntame lo que quieras sobre ' + topic + '.' };
    return { role: 'hornero', sections: [section], tags: ['consulta', 'explore'], persona: p, time: this._timeNow() };
  }

  _localResponse(userText) {
    const lower = userText.toLowerCase();
    const p = this._activePersona;
    if (lower.match(/^(hola|buen|hey|qué tal|como|good|hi|saludos)/)) {
      return { role: 'hornero', sections: [{ title: '', body: '¡Hola! Soy el Abogado — laboralista del gremio aceitero, te ayudo con derechos, convenio, CCT, legislación laboral. ¿Qué consulta tenés?' }], tags: ['consulta', 'saludo'], persona: p, time: this._timeNow() };
    }
    if (lower.includes('yofra')) {
      return { role: 'hornero', sections: [{ title: 'Daniel Yofra', body: 'Secretario General de la F.T.C.I.O.D y A.R.A. (Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines). Líder sindical aceitero, referente en paritaria, organización y resistencia.' }, { title: '', body: '', quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Ciclo "Por las hendijas del Quebracho", enero 2021' }], tags: ['yofra', 'consulta'], persona: p, time: this._timeNow() };
    }
    if (lower.includes('cremonte')) {
      return { role: 'hornero', sections: [{ title: 'Cremonte', body: 'Investigador labour. Analista de distribución del ingreso, salario mínimo y reforma laboral. Autor de "Valor y precio de la fuerza de trabajo" (2023).' }, { title: '', body: '', quote: 'El salario mínimo no es un número abstracto — es el piso de lo que una persona necesita para reproducir su fuerza de trabajo.', quoteAuthor: 'Cremonte', quoteSource: '"Valor y precio de la fuerza de trabajo", 2023' }], tags: ['cremonte', 'consulta'], persona: p, time: this._timeNow() };
    }
    return { role: 'hornero', sections: [{ title: 'Abogado/a', body: 'No tengo datos específicos sobre eso, pero puedo ayudarte con: paritaria aceitera, condiciones laborales, SMVM, reforma laboral, convenio CCT 420/05, organización sindical. ¿Qué te interesa?' }], tags: ['consulta'], persona: p, time: this._timeNow() };
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
    if (!rating) return; // Toggle off — don't send

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
    } catch (e) {
      // Silently fail — feedback is not critical
      console.warn('Feedback send failed:', e);
    }
  }

  async _saveChatHistory() {
    // No persistir hasta que el usuario envíe su primer mensaje
    if (!this.messages.some(m => m.role === 'user')) return;
    try {
      if (typeof guardarChatMsg === 'function') {
        // Save each message with section + sessionId
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
    } catch(e) { console.warn('Consulta: chat history save failed', e); }
  }

  // ===== Export current chat as downloadable TXT document =====
  _exportCurrentChat() {
    if (!this.messages || this.messages.length === 0) return;
    // Use the chat component's export method
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      // Generate title from first user message or fallback
      const firstUserMsg = this.messages.find(m => m.role === 'user');
      const title = firstUserMsg && firstUserMsg.title ? firstUserMsg.title : 'Consulta';
      const filename = title + '.txt';
      // Generate TXT content and trigger download
      chatEl._downloadTxt(this.messages, title, title);
      // Add message with clickable download card
      const txtContent = chatEl._generateTxtContent(this.messages, title);
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: { content: txtContent, filename: filename, label: 'Click para descargar' },
        tags: ['consulta', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  _handleChatExport(detail) {
    if (!this.messages || this.messages.length === 0) return;
    if (detail && detail.download) {
      const title = detail.title || 'Consulta';
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: detail.download,
        tags: ['consulta', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  _handlePersonaNavigate(targetPersona, targetScreen) {
    // All persona icon clicks navigate to that persona's screen
    const screenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'companero': { screen: 'gremial', persona: 'companero' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'historiador': { screen: 'formacion' },
      'archivo': { screen: 'archivo' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }
}

customElements.define('hornero-consulta', HorneroConsulta);
