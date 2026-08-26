// ===== <hornero-contenido> — Contenido Sindical =====
// Chat directo — IA inicia diálogo explicando formatos de contenido sindical
// Backend LLM (DashScope/Claude) + fallback offline con KB local
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroContenido extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,  // Initial persona from Mesa de Trabajo landing
      sessionId: String, // Session ID — if set, load existing session instead of greeting
      warmResume: Boolean, // True = warm resume (restore last session), false = cold start (new chat)
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
    this._chatSection = 'contenido';
    this.messages = [];
    this.iaStep = 0;
    this._typing = false; this._greetingRequested = false;
    this._historyLoaded = false;
    this._bannerVisible = true;
    this._exploreOpen = false;
    this._sessionId = ''; // Current session ID — new on each visit
    this._activePersona = 'periodista'; // Default persona for contenido section
    this._username = ''; // login username for per-user data isolation
    this._progressiveRevealTimer = null;
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
    this._savedDrawerState = null; // Drawer state saved before re-render (prevents drawer closing)
    this._audioProcessing = false; // Guard: prevent concurrent audio processing
  }

  connectedCallback() {
    // Read _username BEFORE super.connectedCallback() triggers render → _afterRender → _loadChatHistory
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
      if (this._progressiveRevealTimer) {
        clearInterval(this._progressiveRevealTimer);
        this._progressiveRevealTimer = null;
      }
      // Abort the streaming fetch — triggers catch block which saves partial response
      if (this._streamAbortController) {
        this._streamAbortController.abort();
        this._streamAbortController = null;
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
          tags: ['contenido', 'stream-partial'],
          persona: this._activePersona,
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
      this.emit('session-save', { screen: this._chatSection || 'contenido', sessionId: this._sessionId, persona: this._activePersona || this.persona || '' });
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
        background: var(--ho-bg, #1E2321); }

      /* ===== Hero banner — imagen de fondo opaca ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-bg, #1E2321);
        padding: 14px 16px 10px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 8px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/periodista.jpg') top center/100% auto no-repeat;
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
      <div class="hero-banner${this._bannerVisible ? '' : ' collapsed'}" style="display:none">
        <div class="hero-banner-title">Contenido</div>
        ${this._bannerVisible ? html`
        <div class="hero-bajada">
          Prensa, podcasts, reels, entrevistas, comunicados. Producción de contenido y comunicación sindical.
        </div>
        ` : ''}
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="Podcast">Podcast</button>
          <button class="hero-explore-option" data-explore="Reel IG">Reel IG</button>
          <button class="hero-explore-option" data-explore="Columna">Columna</button>
          <button class="hero-explore-option" data-explore="Entrevista">Entrevista</button>
        </div>
        ` : ''}
      </div>

      <div class="chat-container">
        <hornero-chat
          reduce-top-pad
          title="Producción de contenido"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
          section-info='{"title":"Contenido","bajada":"La Periodista te ayuda a producir comunicación sindical: podcast, reels, columnas, entrevistas y comunicados.","explore":["Podcast","Reel IG","Columna","Entrevista"]}'
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
      // Listen for explore-select from info popup
      chatEl.addEventListener('explore-select', (e) => {
        const topic = e.detail.option;
        const userMsg = { role: 'user', text: 'Contame sobre ' + topic, time: this._timeNow() };
        this.messages = [...this.messages, userMsg];
        this._addWithProgressiveReveal(this._exploreResponse(topic));
        this._saveChatHistory();
        this.render();
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
      // Hide banner when user focuses input
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
    }

    // Show format suggestions after greeting
    if (this.messages.length === 1 && this.messages[0].role === 'hornero' && this.messages[0].tags && this.messages[0].tags.includes('greeting')) {
      if (chatEl) chatEl.setSuggestions(this._formatSuggestions());
    } else if (this.messages.length > 1) {
      if (chatEl) chatEl.clearSuggestions();
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

    // On each visit: start fresh with new sessionId
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }
  }

  async _loadChatHistory() {
    this._historyLoaded = true;
    // If a sessionId was passed (from Mis Conversaciones or active session restore), load that session
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
      } catch(e) { console.warn('Contenido: session restore failed', e); }
    }
    // Generate sessionId for new chat
    if (!this._sessionId) {
      this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
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
          this._bannerVisible = false;
          this.messages = saved;
          this._historyLoaded = true;
          this.render();
        }
      }
    } catch(e) { console.warn('Contenido: session load failed', e); }
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

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await fetch(HorneroContenido.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'contenido',
          grade: this.grade,
          sector: this.sector,
          requested_persona: this._activePersona,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      // Force: contenido screen ALWAYS uses periodista — never swap actors mid-chat
      const msg = {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['contenido', 'greeting'],
        persona: 'periodista',
        redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
        time: data.time || this._timeNow(),
      };
      this._typing = false; this._greetingRequested = false;
      this._addWithProgressiveReveal(msg);
    } catch (e) {
      this._typing = false; this._greetingRequested = false;
      this._addWithProgressiveReveal(this._localGreeting());
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      sections: [
        { title: '', body: '¡Hola! Soy el Periodista — ayudo al gremio y a sus trabajadores con comunicación sindical. ¿Qué formato te interesa o qué tema querés comunicar?' },
      ],
      tags: ['contenido', 'greeting'],
      time: this._timeNow(),
    };
  }

  _formatSuggestions() {
    return [
      '🎙️ Podcast',
      '📱 Reel IG',
      '✍️ Columna',
      '📻 Entrevista',
    ];
  }

  _handleUserMessage(text) {
    this._finalizeCurrentReveal();
    if (this._bannerVisible) {
      this._bannerVisible = false;
    }
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    // Try streaming first, fallback to non-streaming
    this._callBackendStream(text).catch((err) => {
      console.warn('Stream failed, falling back to non-streaming:', err);
      this._callBackend(text).catch(() => {
        this._addWithProgressiveReveal(this._localResponse(text));
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

    const response = await fetch(HorneroContenido.STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'contenido',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
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
                // Force: contenido screen ALWAYS uses periodista — never swap actors mid-chat
                const reportMsg = {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['contenido'],
                  persona: 'periodista',
                  redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
                  time: data.time || this._timeNow(),
                };
                // Always use typewriter reveal — if none running, start one
                this._pendingFinalizeMsg = reportMsg;
                this._streamAbortController = null; // Stream completed normally
                if (!this._progressiveRevealTimer) {
                  const fullText = data.text || streamingText;
                  if (chatEl && fullText) {
                    this._startProgressiveReveal(fullText, chatEl, 'periodista');
                  } else {
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
          tags: ['contenido', 'stream-partial'],
          persona: this._activePersona,
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
    const history = this.messages.slice(-10).map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(HorneroContenido.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'contenido',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    const responseText = data.text || '';

    const reportMsg = {
      role: 'hornero',
      text: responseText,
      sections: data.sections || [],
      tags: data.tags || ['contenido'],
      persona: data.persona || this._activePersona,
      redirect_persona: data.redirect_persona || '',
      image: data.image || '',
      source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    };
    // Force: contenido screen ALWAYS uses periodista
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

    this._callAudioBackend(audioBlob, fileName).catch(() => {
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      this._addWithProgressiveReveal(this._localResponse('audio fallback'));
      this.iaStep++;
      this._typing = false;
      this._audioProcessing = false;
      if (chatEl) chatEl.resetAudioState();
      this.render();
    });
  }

  async _callAudioBackend(audioBlob, fileName) {
    const history = this.messages.slice(-10).map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const formData = new FormData();
    formData.append('audio', audioBlob, fileName || 'recording.webm');
    formData.append('formato', 'contenido');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', this._activePersona);
    formData.append('history', JSON.stringify(history));

    const response = await fetch(HorneroContenido.AUDIO_URL, {
      method: 'POST',
      body: formData, // Browser sets multipart Content-Type automatically
    });

    if (!response.ok) throw new Error('Audio backend error: ' + response.status);

    const data = await response.json();
    const msg = {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['contenido', 'audio'],
      persona: 'periodista',
      time: data.time || this._timeNow(),
    };
    // Force: contenido screen ALWAYS uses periodista
    this.iaStep++;
    this._addWithProgressiveReveal(msg);
    this._audioProcessing = false; // Reset audio guard
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) chatEl.resetAudioState();
  }

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
    const map = {
      'Podcast': { title: 'Podcast', body: 'Te ayudo a planificar y producir un episodio de podcast: tema, guion, estructura, duración. ¿Sobre qué querés hablar?' },
      'Reel IG': { title: 'Reel IG', body: 'Contenido para Instagram Reels: idea, guion visual, texto, duración, hashtags. ¿Qué tema querés cubrir?' },
      'Columna': { title: 'Columna', body: 'Columna de opinión sindical: tema, argumento, estructura, tono. ¿Sobre qué querés escribir?' },
      'Entrevista': { title: 'Entrevista', body: 'Preparación de entrevista: perfil del entrevistado, preguntas clave, formato, duración. ¿A quién querés entrevistar?' },
    };
    const section = map[topic] || { title: topic, body: 'Preguntame lo que quieras sobre ' + topic + '.' };
    return { role: 'hornero', sections: [section], tags: ['contenido', 'explore'], time: this._timeNow() };
  }

  _localResponse(userText) {
    const lower = userText.toLowerCase();
    // Only match pure greetings — NOT "hola, me podes decir..."
    // But skip duplicate greeting if one already exists in this session
    const hasGreeting = this.messages.some(m => m.role === 'hornero' && m.tags &&
      (m.tags.includes('greeting') || m.tags.includes('saludo')));
    if (!hasGreeting && lower.match(/^(hola|buen|hey|qué tal|como|good|hi|saludos)\s*[!.?]*\s*$/)) {
      return { role: 'hornero', sections: [{ title: '', body: '¡Hola! Soy el Periodista — ayudo al gremio y a sus trabajadores con comunicación sindical. ¿Qué formato te interesa o qué tema querés comunicar?' }], tags: ['contenido', 'saludo'], persona: 'periodista', time: this._timeNow() };
    }
    if (lower.match(/podcast/)) {
      return { role: 'hornero', sections: [{ title: 'Podcast sindical', body: 'Audio narrado, 5-15 minutos. Se escucha en el colectivo, en la planta, en la asamblea. Contame tu tema y te propongo estructura, script y fuentes.' }, { title: '', body: '', quote: 'La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Asamblea paritaria aceitera, junio 2026' }], tags: ['podcast', 'contenido'], time: this._timeNow() };
    }
    return { role: 'hornero', sections: [{ title: 'Periodista', body: 'Contame tu tema o formato. Puedo ayudarte con podcast, reel, columna, entrevista — o cualquier consulta sindical.' }], tags: ['contenido'], time: this._timeNow() };
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
      console.warn('Feedback send failed:', e);
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
    } catch(e) { console.warn('Contenido: chat history save failed', e); }
  }

  _handleChatExport(detail) {
    if (!this.messages || this.messages.length === 0) return;
    if (detail && detail.download) {
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: detail.download,
        tags: ['contenido', 'exportado'],
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
      'historiador': { screen: 'formacion' },
      'archivo': { screen: 'archivo' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }

}

customElements.define('hornero-contenido', HorneroContenido);
