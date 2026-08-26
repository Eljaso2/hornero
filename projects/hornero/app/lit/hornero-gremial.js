// ===== <hornero-gremial> — Reporte Gremial (Chat IA) =====
// Chat-based report workflow: IA escucha → genera informe → revisión → aprobación → guardado
// Companion skill del Debate — Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroGremial extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,  // Initial persona from Mesa de Trabajo landing
      sessionId: String, // Session ID — if set, load existing session instead of greeting
      viewInforme: String, // Informe ID — if set, open popup viewer on mount
      editInforme: String, // Informe ID — if set, open correction chat on mount
      messages: Array,
      _bannerVisible: Boolean,
      _exploreOpen: Boolean,
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
    this._chatSection = 'reporte';
    this.messages = [];
    this._typing = false;
    this._greetingRequested = false;
    this._historyLoaded = false;
    this._sessionId = '';
    this._informeBadge = false;
    this._activePersona = 'companero'; // Gremial always uses compañero persona
    this._username = ''; // login username for per-user data isolation
    this._viewingInforme = null; // Full-screen informe viewer overlay state
    this._cachedIncomingReports = []; // Cached incoming reports for sending to backend
    this._progressiveRevealTimer = null; // Timer for progressive text reveal
    this._originalSectionsBeforeCorrection = null; // Sections snapshot before superior correction
    this._correctingInformeId = null; // ID of informe being corrected by superior
    this._progressiveRevealFull = ''; // Full text to reveal progressively
    this._progressiveRevealIndex = 0; // Current reveal position
    this._pendingFinalizeMsg = null; // Message waiting for progressive reveal to finish
    this._savedDrawerState = null; // Drawer state saved before re-render (prevents drawer closing)
    this._bannerVisible = true;
    this._exploreOpen = false;
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
          tags: ['reporte', 'stream-partial'],
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
      this.emit('session-save', { screen: this._chatSection || 'reporte', sessionId: this._sessionId, persona: this._activePersona || this.persona || '' });
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
      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
      .chat-container > hornero-chat { flex: 1; min-height: 0; }

      /* ===== Hero banner — imagen de fondo opaca ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-bg, #1E2321);
        padding: 14px 16px 10px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 8px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/IMG-20240506-WA0028.jpg') top center/100% auto no-repeat;
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

      /* === Informe popup modal === */
      .inform-popup-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 100; background: rgba(43,42,38,.55); display: flex;
        align-items: center; justify-content: center;
        animation: fadeIn .25s ease; }
      .inform-popup { background: var(--ho-card, #2A3230); border-radius: 18px;
        width: 92%; max-width: 480px; max-height: 85vh;
        display: flex; flex-direction: column;
        box-shadow: 0 8px 32px rgba(43,42,38,.25);
        animation: popupIn .25s ease; overflow: hidden; }
      @keyframes popupIn { from { opacity: 0; transform: scale(.95) translateY(10px); }
        to { opacity: 1; transform: none; } }
      .inform-popup-header { padding: 16px; display: flex; flex-direction: column; gap: 0;
        flex: none; background: transparent;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .inform-popup-header-row { display: flex; align-items: center; justify-content: space-between; }
      .inform-popup-header-close { background: none; border: none; cursor: pointer;
        font-size: 1.1rem; color: var(--ho-text-light, #9C988D); padding: 2px 6px;
        border-radius: 6px; transition: background .2s; }
      .inform-popup-header-close:hover { background: rgba(255,255,255,.08); }
      .inform-popup-header-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .92rem; color: var(--ho-text-off, #F2F1EC);
        letter-spacing: .04em; text-transform: uppercase; flex: 1; }
      .inform-popup-header-date { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: rgba(255,255,255,.5); margin-top: 6px; }
      .inform-popup-header-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        margin-top: 12px; }
      .inform-popup-header-user { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-off, #F2F1EC); letter-spacing: .06em;
        background: rgba(255,255,255,.15); padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-popup-header-grado { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #D4E4F7; color: #2B5278; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-popup-header-estado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
      .inform-popup-header-estado.estado-pendiente { background: #F0E4CC; color: #856404; }
      .inform-popup-header-estado.estado-aceptado { background: #E0F0EB; color: #3D6B56; }
      .inform-popup-header-estado.estado-aprobado { background: #C5D9A0; color: #3D6B1A; }
      .inform-popup-header-estado.estado-visto { background: #D4E4F7; color: #2B5278; }
      .inform-popup-header-estado.estado-con-cambios { background: #D4E4F7; color: #2B5278; }
      .inform-popup-scroll { flex: 1; overflow-y: auto; padding: 16px; }
      .inform-popup-section { margin-bottom: 16px; }
      .inform-popup-section:last-child { margin-bottom: 0; }
      .inform-popup-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .84rem; color: var(--ho-green-dark, #3D6B56); margin-bottom: 6px;
        text-transform: uppercase; letter-spacing: .06em; }
      .inform-popup-section-title.clasif-title { margin-bottom: 12px; }
      .inform-popup-section-body { font-family: 'Public Sans', sans-serif;
        font-size: .85rem; color: var(--ho-text, #E8E6E0); line-height: 1.6; }
      .inform-popup-section-body strong { color: var(--ho-text, #E8E6E0); font-weight: 600; }
      /* Only transcript body is italic — no internal boxes or underlines */
      .inform-popup-section-body.transcript-body { font-style: italic; }
      .inform-popup-section-body em { font-style: normal; font-weight: 600; color: var(--ho-text, #E8E6E0); }
      .inform-popup-section-body.transcript-body em { font-style: italic; }
      .clasif-tag { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        vertical-align: middle; margin: 0 2px; line-height: 1.4; }
      /* Clasificación tree structure */
      .clasif-tree { margin: 0; padding: 0; }
      .clasif-family { margin-bottom: 8px; border-radius: 8px;
        background: rgba(78,153,120,.06); border: 1px solid rgba(78,153,120,.12); }
      .clasif-family:last-child { margin-bottom: 0; }
      .clasif-family-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; color: var(--ho-green-dark, #3D6B56);
        padding: 8px 10px 4px 10px; display: flex;
        align-items: center; gap: 6px;
        border-left: 3px solid var(--ho-green, #4E9978); border-radius: 8px 8px 0 0; }
      .clasif-family-body { padding: 2px 10px 8px 14px; }
      .clasif-family-just { font-family: 'Public Sans', sans-serif; font-style: italic;
        font-size: .76rem; color: var(--ho-text-mid, #8A8680);
        margin-bottom: 6px; line-height: 1.45;
        border-left: 2px solid rgba(78,153,120,.25); padding-left: 8px; }
      .clasif-entry { display: flex; align-items: baseline; gap: 6px;
        margin-bottom: 4px; padding-left: 4px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text, #E8E6E0); line-height: 1.5; }
      .clasif-entry:last-child { margin-bottom: 0; }
      .clasif-entry .clasif-tag { flex-shrink: 0; }
      .clasif-entry-desc { color: var(--ho-text-mid, #6E6A60); }
      .inform-popup-section-divider { height: 1px; background: rgba(43,42,38,.10);
        margin: 16px 0; }
      .inform-popup-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px;
        padding-top: 12px; border-top: 1px solid var(--ho-green-pale, #E0F0EB); }
      .inform-popup-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      /* Section 5 comentarios entries */
      .inform-popup-comentario-entry { padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,.05); }
      .inform-popup-comentario-entry:last-child { border-bottom: none; }
      .inform-popup-comentario-grado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; font-weight: 700; margin-bottom: 2px; }
      .inform-popup-comentario-grado.grado-2 { color: #4E9978; }
      .inform-popup-comentario-grado.grado-3 { color: #2C5A8A; }
      .inform-popup-comentario-grado.grado-4 { color: #5A3D7A; }
      .inform-popup-comentario-desc { font-family: 'Public Sans', sans-serif;
        font-size: .78rem; color: var(--ho-text-light, #9C988D); line-height: 1.4; }
      /* Footer action buttons — icon-only, no text */
      .inform-popup-footer { padding: 10px 16px; display: flex; gap: 6px;
        justify-content: flex-end; flex: none;
        border-top: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .inform-popup-btn { width: 32px; height: 32px; border-radius: 8px;
        background: none; border: none; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        transition: background .2s; padding: 0; }
      .inform-popup-btn svg { width: 16px; height: 16px; fill: none;
        stroke: var(--ho-text-light, #9C988D); stroke-width: 2;
        stroke-linecap: round; stroke-linejoin: round; }
      .inform-popup-btn:hover { background: var(--ho-green-pale, #E0F0EB); }
      .inform-popup-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .inform-popup-btn:disabled { opacity: .3; pointer-events: none; }

      /* ===== Light theme overrides for Informe popup + Clasificación tree ===== */
      :host(.theme-light) .inform-popup-overlay { background: rgba(0,0,0,.25); }
      :host(.theme-light) .inform-popup { background: var(--ho-card, #FFFFFF); box-shadow: 0 8px 32px rgba(0,0,0,.12); }
      :host(.theme-light) .inform-popup-header { border-bottom-color: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-header-close { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-header-close:hover { background: rgba(0,0,0,.06); }
      :host(.theme-light) .inform-popup-header-title { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-header-date { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .inform-popup-header-user { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .inform-popup-header-grado { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .inform-popup-section-title { color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .inform-popup-section-body { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-section-body strong { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-section-body em { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-section-divider { background: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-tags { border-top-color: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-tag { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .inform-popup-comentario-entry { border-bottom-color: rgba(0,0,0,.06); }
      :host(.theme-light) .inform-popup-comentario-desc { color: var(--ho-text-light, #7A766C); }
      :host(.theme-light) .inform-popup-footer { border-top-color: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-btn svg { stroke: var(--ho-text-light, #7A766C); }
      :host(.theme-light) .inform-popup-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      /* Clasificación tree light */
      :host(.theme-light) .clasif-family { background: rgba(78,153,120,.06); border-color: rgba(78,153,120,.14); }
      :host(.theme-light) .clasif-family-name { color: var(--ho-green-dark, #3D6B56); border-left-color: var(--ho-green, #2E6B4E); }
      :host(.theme-light) .clasif-family-just { color: var(--ho-text-mid, #7A766C); border-left-color: rgba(78,153,120,.2); }
      :host(.theme-light) .clasif-entry { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .clasif-entry-desc { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .clasif-tag { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56); }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
  }

  _render() {
    return html`
      <div class="hero-banner${this._bannerVisible ? '' : ' collapsed'}">
        <div class="hero-banner-title">Reporte Gremial</div>
        ${this._bannerVisible ? html`
        <div class="hero-bajada">
          Elaboración de reportes gremiales, relato de situaciones, clasificación, seguimiento y aprobación.
        </div>
        ` : ''}
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="Relato">Relato</button>
          <button class="hero-explore-option" data-explore="Clasificación">Clasificación</button>
          <button class="hero-explore-option" data-explore="Seguimiento">Seguimiento</button>
          <button class="hero-explore-option" data-explore="Aprobación">Aprobación</button>
        </div>
        ` : ''}
      </div>

      <div class="chat-container">
        <hornero-chat
          title="Reporte Gremial"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="reporte"
          history-title="Mis Conversaciones"
          informes-title="Mis Reportes"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
          no-auto-scroll="${this._bannerVisible}"
        ></hornero-chat>
      </div>

      ${''/* popup rendered via portal to document.body to avoid overflow:hidden clipping */}
    `;
  }

  // === Portal: render popup in document.body to escape overflow:hidden ===
  _openInformePopupPortal() {
    this._closeInformePopupPortal(); // remove any existing
    const container = document.createElement('div');
    container.id = 'hornero-informe-popup-portal';
    // Inject popup styles (they won't apply from Shadow DOM)
    const styleEl = document.createElement('style');
    styleEl.textContent = this._getPopupStyles();
    container.appendChild(styleEl);
    container.innerHTML += this._renderInformePopupHTML();
    document.body.appendChild(container);
    this._bindPopupActions(container);
  }

  _closeInformePopupPortal() {
    const existing = document.getElementById('hornero-informe-popup-portal');
    if (existing) existing.remove();
  }

  _bindPopupActions(container) {
    // Backdrop click
    const overlay = container.querySelector('.inform-popup-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this._closeInformeViewer();
      });
    }
    // Regla 1: scroll tracking — habilitar Aprobar solo si se leyó hasta el final
    const scrollEl = container.querySelector('#informPopupScroll');
    if (scrollEl) {
      this._informeFullyRead = false;
      const checkScrollEnd = () => {
        const atBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 40;
        if (atBottom && !this._informeFullyRead) {
          this._informeFullyRead = true;
          // Habilitar botón Aprobar y ocultar hint
          const aprobarBtn = container.querySelector('[data-popup-action="aprobar"]');
          if (aprobarBtn) { aprobarBtn.disabled = false; aprobarBtn.title = ''; }
          const hint = container.querySelector('.inform-popup-scroll-hint');
          if (hint) hint.style.display = 'none';
        }
      };
      scrollEl.addEventListener('scroll', checkScrollEnd, { passive: true });
      // Check si el contenido cabe sin scroll (informe corto)
      requestAnimationFrame(() => { checkScrollEnd(); });
    }
    // Action buttons
    container.querySelectorAll('[data-popup-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.popupAction;
        const infId = this._viewingInforme ? this._viewingInforme.id : null;
        if (action === 'close') {
          this._closeInformeViewer();
        } else if (action === 'modificar' && infId) {
          this._closeInformeViewer();
          this._handleInformeModify(infId);
        } else if (action === 'aprobar' && infId) {
          this._closeInformeViewer();
          this._handleInformeApprove(infId);
        } else if (action === 'descargar' && this._viewingInforme) {
          this._downloadInformeFromViewer();
        } else if (action === 'compartir' && this._viewingInforme) {
          this._shareInformeFromViewer();
        }
      });
    });
  }

  _getPopupStyles() {
    return `
      .inform-popup-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 100; background: rgba(43,42,38,.55); display: flex;
        align-items: center; justify-content: center;
        animation: hoPopFadeIn .25s ease; }
      .inform-popup { background: var(--ho-card, #2A3230); border-radius: 18px;
        width: 92%; max-width: 480px; max-height: 85vh;
        display: flex; flex-direction: column;
        box-shadow: 0 8px 32px rgba(43,42,38,.25);
        animation: hoPopIn .25s ease; overflow: hidden; }
      @keyframes hoPopIn { from { opacity: 0; transform: scale(.95) translateY(10px); }
        to { opacity: 1; transform: none; } }
      @keyframes hoPopFadeIn { from { opacity: 0; } to { opacity: 1; } }
      .inform-popup-header { padding: 16px; display: flex; flex-direction: column; gap: 0;
        flex: none; background: transparent;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .inform-popup-header-row { display: flex; align-items: center; justify-content: space-between; }
      .inform-popup-header-close { background: none; border: none; cursor: pointer;
        font-size: 1.1rem; color: var(--ho-text-light, #9C988D); padding: 2px 6px;
        border-radius: 6px; transition: background .2s; }
      .inform-popup-header-close:hover { background: rgba(255,255,255,.08); }
      .inform-popup-header-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .92rem; color: var(--ho-text-off, #F2F1EC);
        letter-spacing: .04em; text-transform: uppercase; flex: 1; }
      .inform-popup-header-date { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: rgba(255,255,255,.5); margin-top: 6px; }
      .inform-popup-header-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        margin-top: 12px; }
      .inform-popup-header-user { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-off, #F2F1EC); letter-spacing: .06em;
        background: rgba(255,255,255,.15); padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-popup-header-grado { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #D4E4F7; color: #2B5278; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-popup-header-estado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
      .inform-popup-header-estado.estado-pendiente { background: #F0E4CC; color: #856404; }
      .inform-popup-header-estado.estado-aceptado { background: #E0F0EB; color: #3D6B56; }
      .inform-popup-header-estado.estado-aprobado { background: #C5D9A0; color: #3D6B1A; }
      .inform-popup-header-estado.estado-visto { background: #D4E4F7; color: #2B5278; }
      .inform-popup-header-estado.estado-con-cambios { background: #D4E4F7; color: #2B5278; }
      .inform-popup-scroll { flex: 1; overflow-y: auto; padding: 16px; }
      .inform-popup-section { margin-bottom: 16px; }
      .inform-popup-section:last-child { margin-bottom: 0; }
      .inform-popup-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .84rem; color: var(--ho-green-dark, #3D6B56); margin-bottom: 6px;
        text-transform: uppercase; letter-spacing: .06em; }
      .inform-popup-section-title.clasif-title { margin-bottom: 12px; }
      .inform-popup-section-body { font-family: 'Public Sans', sans-serif;
        font-size: .85rem; color: var(--ho-text, #E8E6E0); line-height: 1.6; }
      .inform-popup-section-body strong { color: var(--ho-text, #E8E6E0); font-weight: 600; }
      /* Only transcript body is italic — no internal boxes or underlines */
      .inform-popup-section-body.transcript-body { font-style: italic; }
      .inform-popup-section-body em { font-style: normal; font-weight: 600; color: var(--ho-text, #E8E6E0); }
      .inform-popup-section-body.transcript-body em { font-style: italic; }
      .clasif-tag { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        vertical-align: middle; margin: 0 2px; line-height: 1.4; }
      /* Clasificación tree structure */
      .clasif-tree { margin: 0; padding: 0; }
      .clasif-family { margin-bottom: 8px; border-radius: 8px;
        background: rgba(78,153,120,.06); border: 1px solid rgba(78,153,120,.12); }
      .clasif-family:last-child { margin-bottom: 0; }
      .clasif-family-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; color: var(--ho-green-dark, #3D6B56);
        padding: 8px 10px 4px 10px; display: flex;
        align-items: center; gap: 6px;
        border-left: 3px solid var(--ho-green, #4E9978); border-radius: 8px 8px 0 0; }
      .clasif-family-body { padding: 2px 10px 8px 14px; }
      .clasif-family-just { font-family: 'Public Sans', sans-serif; font-style: italic;
        font-size: .76rem; color: var(--ho-text-mid, #8A8680);
        margin-bottom: 6px; line-height: 1.45;
        border-left: 2px solid rgba(78,153,120,.25); padding-left: 8px; }
      .clasif-entry { display: flex; align-items: baseline; gap: 6px;
        margin-bottom: 4px; padding-left: 4px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text, #E8E6E0); line-height: 1.5; }
      .clasif-entry:last-child { margin-bottom: 0; }
      .clasif-entry .clasif-tag { flex-shrink: 0; }
      .clasif-entry-desc { color: var(--ho-text-mid, #6E6A60); }
      .inform-popup-section-divider { height: 1px; background: rgba(43,42,38,.10);
        margin: 16px 0; }
      .inform-popup-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px;
        padding-top: 12px; border-top: 1px solid var(--ho-green-pale, #E0F0EB); }
      .inform-popup-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-popup-comentario-entry { padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,.05); }
      .inform-popup-comentario-entry:last-child { border-bottom: none; }
      .inform-popup-comentario-grado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; font-weight: 700; margin-bottom: 2px; }
      .inform-popup-comentario-grado.grado-2 { color: #4E9978; }
      .inform-popup-comentario-grado.grado-3 { color: #2C5A8A; }
      .inform-popup-comentario-grado.grado-4 { color: #5A3D7A; }
      .inform-popup-comentario-desc { font-family: 'Public Sans', sans-serif;
        font-size: .78rem; color: var(--ho-text-light, #9C988D); line-height: 1.4; }
      .inform-popup-footer { padding: 10px 16px; display: flex; gap: 6px;
        justify-content: flex-end; flex: none;
        border-top: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .inform-popup-btn { width: 32px; height: 32px; border-radius: 8px;
        background: none; border: none; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        transition: background .2s; padding: 0; }
      .inform-popup-btn svg { width: 16px; height: 16px; fill: none;
        stroke: var(--ho-text-light, #9C988D); stroke-width: 2;
        stroke-linecap: round; stroke-linejoin: round; }
      .inform-popup-btn:hover { background: var(--ho-green-pale, #E0F0EB); }
      .inform-popup-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .inform-popup-btn:disabled { opacity: .3; pointer-events: none; }

      /* ===== Light theme overrides for Informe popup + Clasificación tree ===== */
      :host(.theme-light) .inform-popup-overlay { background: rgba(0,0,0,.25); }
      :host(.theme-light) .inform-popup { background: var(--ho-card, #FFFFFF); box-shadow: 0 8px 32px rgba(0,0,0,.12); }
      :host(.theme-light) .inform-popup-header { border-bottom-color: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-header-close { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-header-close:hover { background: rgba(0,0,0,.06); }
      :host(.theme-light) .inform-popup-header-title { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-header-date { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .inform-popup-header-user { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .inform-popup-header-grado { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .inform-popup-section-title { color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .inform-popup-section-body { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-section-body strong { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-section-body em { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .inform-popup-section-divider { background: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-tags { border-top-color: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-tag { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .inform-popup-comentario-entry { border-bottom-color: rgba(0,0,0,.06); }
      :host(.theme-light) .inform-popup-comentario-desc { color: var(--ho-text-light, #7A766C); }
      :host(.theme-light) .inform-popup-footer { border-top-color: rgba(0,0,0,.08); }
      :host(.theme-light) .inform-popup-btn svg { stroke: var(--ho-text-light, #7A766C); }
      :host(.theme-light) .inform-popup-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      /* Clasificación tree light */
      :host(.theme-light) .clasif-family { background: rgba(78,153,120,.06); border-color: rgba(78,153,120,.14); }
      :host(.theme-light) .clasif-family-name { color: var(--ho-green-dark, #3D6B56); border-left-color: var(--ho-green, #2E6B4E); }
      :host(.theme-light) .clasif-family-just { color: var(--ho-text-mid, #7A766C); border-left-color: rgba(78,153,120,.2); }
      :host(.theme-light) .clasif-entry { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .clasif-entry-desc { color: var(--ho-text-mid, #5A5650); }
      :host(.theme-light) .clasif-tag { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56); }
      .inform-popup-scroll-hint { padding: 8px 16px; text-align: center;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .74rem;
        color: var(--ho-gold, #B0863F); background: rgba(176,134,63,.08);
        border-top: 1px solid rgba(176,134,63,.15); flex: none; }
    `;
  }

  _renderInformePopupHTML() {
    const inf = this._viewingInforme;
    const numero = inf.numero || '';
    const estado = inf.estado || 'pendiente';
    const estadoLabelMap = {
      'pendiente': '⏳ Pendiente de revisión',
      'aprobado': '✅ Aprobado sin cambios',
      'aprobado-con-cambios': '📝 Aprobado con cambios',
      'aprobado-delegado': '✅ Aprobado sin cambios',
      'corregido-delegado': '📝 Aprobado con cambios',
      'visto': '👁 Visto por superior — no modificable',
      'aceptado': '✅ Aprobado sin cambios',
    };
    const estadoClassMap = {
      'pendiente': 'estado-pendiente',
      'aprobado': 'estado-aprobado',
      'aprobado-con-cambios': 'estado-con-cambios',
      'aprobado-delegado': 'estado-aprobado',
      'corregido-delegado': 'estado-con-cambios',
      'visto': 'estado-visto',
      'aceptado': 'estado-aprobado',
    };
    const estadoLabel = estadoLabelMap[estado] || estado;
    const estadoClass = estadoClassMap[estado] || '';
    const isModificado = estado === 'aprobado-con-cambios' || estado === 'corregido-delegado' || estado === 'corregido';
    const titleText = (numero ? 'Reporte Gremial N°' + numero :
      (inf.sections && inf.sections.length > 0 ?
        (inf.sections[0].title || 'Informe Gremial') : 'Informe Gremial')) + (isModificado ? ' (Modificado)' : '');

    // Date+time formatting
    const dateStr = inf.timestamp ? this._formatInformeTimestamp(inf.timestamp) : (inf.fecha || '');

    // Sections 1-4 — all expanded, section-type-aware styling
    const sectionsHtml = (inf.sections || []).map((s, i) => {
      let content = '';
      const sectionTitle = (s.title || '').toLowerCase();
      const isClasif = sectionTitle.includes('clasificación') || sectionTitle.includes('clasificacion') || sectionTitle.includes('etiqueta');
      const isTranscript = sectionTitle.includes('transcript') || sectionTitle.includes('extracto') || sectionTitle.includes('diálogo') || sectionTitle.includes('dialogo');
      let sectionNum = '';
      if (sectionTitle.includes('relato')) sectionNum = '1';
      else if (isClasif) sectionNum = '2';
      else if (isTranscript) sectionNum = '3';
      else if (sectionTitle.includes('ficha') || sectionTitle.includes('reportante')) sectionNum = '4';
      if (s.title) {
        const numberedTitle = sectionNum ? `${sectionNum}) ${s.title}` : s.title;
        const titleClass = isClasif ? 'inform-popup-section-title clasif-title' : 'inform-popup-section-title';
        content += `<div class="${titleClass}">${numberedTitle}</div>`;
      }
      else if (i > 0) content += `<div class="inform-popup-section-title">Detalle</div>`;
      if (s.body) {
        let cleanBody = s.body
          .replace(/\n*---\s*\n.*$/s, '')
          .replace(/\n*¿Es esto lo que querías.*$/s, '')
          .replace(/\n*respuesta-libre\s*$/s, '')
          .replace(/[\s\n]+$/, '');
        let bodyHtml = '';
        if (isClasif) {
          // Clasificación → tree structure with families and tags
          bodyHtml = this._formatClasifTree(cleanBody);
        } else {
          bodyHtml = this._formatMarkdown(cleanBody);
        }
        // Add subsection numbering (2.a, 2.b, etc.) to bold text at start of lines
        if (sectionNum && !isClasif) {
          bodyHtml = this._addSubsectionNumbers(bodyHtml, sectionNum);
        }
        const bodyClass = isTranscript ? 'inform-popup-section-body transcript-body' : 'inform-popup-section-body';
        content += `<div class="${bodyClass}">${bodyHtml}</div>`;
      }
      const divider = (i < (inf.sections || []).length - 1) ?
        '<div class="inform-popup-section-divider"></div>' : '';
      return `<div class="inform-popup-section">${content}</div>${divider}`;
    }).join('');

    // Section 5: Comentarios y modificaciones (from correcciones)
    const section5Html = this._renderSection5Comentarios(inf._correcciones);

    // Tags
    const tags = inf.etiquetas && inf.etiquetas.temas ? inf.etiquetas.temas : [];
    const tagsHtml = tags.length > 0 ?
      `<div class="inform-popup-tags">${tags.map(t => `<span class="inform-popup-tag">${t}</span>`).join('')}</div>` : '';

    // Context-aware footer buttons
    const isOwnInforme = inf.username === this._username;
    // Regla 2: autor NO puede modificar/eliminar si un superior ya vio el informe
    const superiorVio = ['visto','aprobado','aprobado-con-cambios','aprobado-delegado','corregido-delegado','corregido'].includes(estado);
    const canModify = !isOwnInforme ? true : (isOwnInforme && !superiorVio && (estado === 'pendiente' || estado === 'aceptado'));
    const canApprove = !isOwnInforme;
    // Regla 1: aprobar solo si se leyó hasta el final (scroll tracking)
    const needsScrollRead = canApprove && !this._informeFullyRead;

    // Share icon SVG
    const shareIcon = '<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>';

    return html`
      <div class="inform-popup-overlay">
        <div class="inform-popup">
          <div class="inform-popup-header">
            <div class="inform-popup-header-row">
              <div class="inform-popup-header-title">${titleText}</div>
              <button class="inform-popup-header-close" data-popup-action="close" title="Cerrar">✕</button>
            </div>
            <div class="inform-popup-header-date">${dateStr}</div>
            <div class="inform-popup-header-meta">
              ${inf.username ? '<span class="inform-popup-header-user">@' + inf.username + '</span>' : ''}
              ${inf.grado ? '<span class="inform-popup-header-grado">G' + inf.grado + '</span>' : ''}
              <span class="inform-popup-header-estado ${estadoClass}">${estadoLabel}</span>
            </div>
          </div>
          <div class="inform-popup-scroll" id="informPopupScroll">
            ${sectionsHtml}
            ${section5Html}
            ${tagsHtml}
          </div>
          ${needsScrollRead ? '<div class="inform-popup-scroll-hint">↓ Leé el informe completo para poder aprobar</div>' : ''}
          <div class="inform-popup-footer">
            <button class="inform-popup-btn" data-popup-action="descargar" title="Descargar"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
            <button class="inform-popup-btn" data-popup-action="compartir" title="Compartir"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
            ${canModify ? '<button class="inform-popup-btn" data-popup-action="modificar" title="Modificar"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' : ''}
            ${canApprove ? `<button class="inform-popup-btn inform-popup-btn-aprobar" data-popup-action="aprobar" title="Aprobar" ${needsScrollRead ? 'disabled' : ''}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="16 9 11 14 8 11" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Section 5: Comentarios y modificaciones — always shown, built from correcciones data
  _renderSection5Comentarios(correcciones) {
    if (!correcciones || correcciones.length === 0) {
      return `<div class="inform-popup-section-divider"></div>
        <div class="inform-popup-section" data-section-type="comentarios">
          <div class="inform-popup-section-title">5) Comentarios y modificaciones</div>
          <div class="inform-popup-section-body">
            <div class="inform-popup-comentario-desc">Sin comentarios ni modificaciones aún.</div>
          </div>
        </div>`;
    }
    const sorted = [...correcciones].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const entriesHtml = sorted.map(c => {
      const gradoLabel = 'G' + (c.correctorGrado || '?');
      const username = c.correctorUsername || '';
      const fechaFormatted = c.timestamp ? this._formatInformeTimestamp(c.timestamp) : (c.fecha || '');
      let description = '';
      if (c.tipo === 'aprobacion-sin-cambios') {
        description = 'Aprobado sin cambios';
      } else if (c.tipo === 'modificado' || c.tipo === 'agregado' || c.tipo === 'eliminado') {
        const sectionName = c.seccionTitle || 'Sección ' + ((c.seccionIndex || 0) + 1);
        const action = c.tipo === 'modificado' ? 'Modificó' : c.tipo === 'agregado' ? 'Agregó' : 'Eliminó';
        description = `${action} sección ${sectionName}.`;
        if (c.textoOriginal && c.tipo === 'modificado') {
          const orig = c.textoOriginal.length > 100 ? c.textoOriginal.substring(0, 100) + '...' : c.textoOriginal;
          description += ` Original: "${orig}".`;
        }
        if (c.textoNuevo && (c.tipo === 'modificado' || c.tipo === 'agregado')) {
          const nuevo = c.textoNuevo.length > 100 ? c.textoNuevo.substring(0, 100) + '...' : c.textoNuevo;
          description += ` Nuevo: "${nuevo}".`;
        }
      } else {
        description = c.resumen || 'Cambio registrado';
      }
      const gradoClass = 'grado-' + (c.correctorGrado || 2);
      return `<div class="inform-popup-comentario-entry">
        <div class="inform-popup-comentario-grado ${gradoClass}">${gradoLabel} (${username}) — ${fechaFormatted}</div>
        <div class="inform-popup-comentario-desc">${description}</div>
      </div>`;
    }).join('');
    return `<div class="inform-popup-section-divider"></div>
      <div class="inform-popup-section" data-section-type="comentarios">
        <div class="inform-popup-section-title">5) Comentarios y modificaciones</div>
        <div class="inform-popup-section-body">${entriesHtml}</div>
      </div>`;
  }

  // Timestamp formatting helper
  _formatInformeTimestamp(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }

  // ===== Auto-detect reporte from text content =====
  // When the backend returns a report as plain text (without structured sections),
  // parse the text to extract sections and add the reporte-generado tag.
  // This ensures the reporte card is rendered with the "Aprobar" button.
  _parseReporteFromText(text) {
    if (!text || text.length < 100) return { isReporte: false };

    // Detect report patterns: "Relato" + "Clasificación" (or similar)
    const hasRelato = /\bRelato\b/.test(text);
    const hasClasif = /\bClasificaci[oó]n\b|\bEtiqueta\b/.test(text);
    if (!hasRelato || !hasClasif) return { isReporte: false };

    // Parse sections from text
    // Pattern: **N. Title** or **Title** followed by body text until next section
    const sectionRegex = /\*\*\d+\.\s*(Relato|Clasificaci[oó]n|Etiqueta|Transcript|Extractos?|Di[aá]logo|Ficha|Reportante)\*\*/gi;
    const matches = [];
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
      matches.push({ index: match.index, title: match[1], length: match[0].length });
    }

    if (matches.length < 2) return { isReporte: false };

    // Extract sections
    const sections = [];
    for (let i = 0; i < matches.length; i++) {
      const bodyStart = matches[i].index + matches[i].length;
      const bodyEnd = i < matches.length - 1 ? matches[i + 1].index : text.length;
      let body = text.substring(bodyStart, bodyEnd)
        .replace(/^[\s\n]+/, '')  // trim leading whitespace
        .replace(/[\s\n]+$/, '')  // trim trailing whitespace
        .replace(/^---\s*\n?/, '')  // remove leading ---
        .replace(/\n?---\s*$/, ''); // remove trailing ---
      // Remove trailing confirmation text and tags from AI (not part of the informe)
      body = body.replace(/\n*---\s*\n.*$/s, ''); // remove everything after trailing ---
      body = body.replace(/\n*¿Es esto lo que querías.*$/s, '');
      body = body.replace(/\n*respuesta-libre\s*$/s, '');
      body = body.replace(/[\s\n]+$/, ''); // re-trim trailing whitespace
      sections.push({ title: matches[i].title, body });
    }

    return { sections, isReporte: true };
  }

  // Auto-save reporte as draft (pendiente) when generated — allows user to view in Mis Reportes before approving
  async _autoSaveReporteDraft(reportMsg) {
    try {
      const result = await this._saveInforme(reportMsg);
      if (result && result.id) {
        reportMsg.informe_id = result.id;
        this._informeBadge = true;
        console.log('Gremial: reporte draft auto-saved', result.id);
      }
    } catch(e) {
      console.warn('Gremial: reporte draft auto-save failed', e);
      // Non-critical — the report can still be approved and saved later
    }
  }

  // Add subsection numbering (2.a, 2.b, etc.) to bold text at start of lines
  _addSubsectionNumbers(bodyHtml, sectionNum) {
    if (!sectionNum || !bodyHtml) return bodyHtml;
    let letterIndex = 0;
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    return bodyHtml.replace(/((?:^|<br>))\s*(<strong>)/g, (match, prefix, strong) => {
      const letter = letters[letterIndex++] || '';
      return `${prefix}${sectionNum}.${letter} ${strong}`;
    });
  }

  // Parse Clasificación body into tree structure with families and tag entries
  _formatClasifTree(bodyText) {
    if (!bodyText) return '';
    const families = [];
    const parts = bodyText.split(/\*\*(.+?)\*\*/g);
    let currentFamily = null;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      if (i % 2 === 1) {
        currentFamily = { name: part, justification: '', entries: [] };
        families.push(currentFamily);
      } else if (currentFamily) {
        const lines = part.split(/\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          // Match justification line: → text
          const justMatch = trimmed.match(/^→\s*(.+)/);
          if (justMatch) {
            currentFamily.justification = justMatch[1];
            continue;
          }
          const tagMatch = trimmed.match(/^#([a-záéíóúñ_]+)\s*(?:[—–:-]\s*)?(.*)/);
          if (tagMatch) {
            currentFamily.entries.push({ tag: tagMatch[1], desc: tagMatch[2] || '' });
          } else if (trimmed.startsWith('#')) {
            const tag = trimmed.replace(/^#/, '').split(/[\s—–:]/)[0];
            const desc = trimmed.replace(/^#[a-záéíóúñ_]+\s*(?:[—–:-]\s*)?/, '');
            currentFamily.entries.push({ tag, desc });
          }
        }
      } else {
        const lines = part.split(/\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const tagMatch = trimmed.match(/^#([a-záéíóúñ_]+)\s*(?:[—–:-]\s*)?(.*)/);
          if (tagMatch) {
            if (!currentFamily) {
              currentFamily = { name: '', justification: '', entries: [] };
              families.push(currentFamily);
            }
            currentFamily.entries.push({ tag: tagMatch[1], desc: tagMatch[2] || '' });
          }
        }
      }
    }
    const subLetter = 'abcdefghijklmnopqrstuvwxyz';
    let familyIndex = 0;
    return '<div class="clasif-tree">' + families.map(f => {
      const familyLabel = f.name
        ? `<div class="clasif-family-name">2.${subLetter[familyIndex++] || ''}) ${f.name}</div>`
        : '';
      const justHtml = f.justification
        ? `<div class="clasif-family-just">${f.justification}</div>`
        : '';
      const entriesHtml = f.entries.map(e => {
        const tagBadge = `<span class="clasif-tag">#${e.tag}</span>`;
        const descHtml = e.desc ? `<span class="clasif-entry-desc">— ${e.desc}</span>` : '';
        return `<div class="clasif-entry">${tagBadge}${descHtml}</div>`;
      }).join('');
      return `<div class="clasif-family">${familyLabel}<div class="clasif-family-body">${justHtml}${entriesHtml}</div></div>`;
    }).join('') + '</div>';
  }

  // Simple markdown formatter for informe viewer
  _formatMarkdown(text) {
    if (!text) return '';
    // Bold: **text** → <strong>text</strong>
    let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
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
        // If current session was deleted, start fresh
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
          if (msg && msg.id && typeof borrarChatMsg === 'function') {
            borrarChatMsg(msg.id);
          }
          this.render();
        }
      });
      chatEl.addEventListener('reporte-action', (e) => {
        this._handleReporteAction(e.detail);
      });
      chatEl.addEventListener('informes-open', () => {
        this._informeBadge = false;
        this._syncChatMessages(chatEl);
      });
      chatEl.addEventListener('informes-select', (e) => {
        this._handleInformeView(e.detail.informeId);
      });
      chatEl.addEventListener('informes-edit', (e) => {
        this._handleInformeEdit(e.detail.informeId);
      });
      chatEl.addEventListener('informes-reenviar', (e) => {
        this._handleInformeEdit(e.detail.informeId);
      });
      chatEl.addEventListener('informes-approve', (e) => {
        this._handleInformeApprove(e.detail.informeId);
      });
      // Listen for reporte-view-popup: open popup from inline chat card
      chatEl.addEventListener('reporte-view-popup', (e) => {
        this._handleReporteViewPopup(e.detail.msgIndex);
      });
      // After chat self-renders (drawer close/delete), re-sync messages without chat render
      chatEl.addEventListener('chat-state-changed', () => {
        this._syncChatMessages(chatEl);
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

    if (!this._historyLoaded) {
      this._loadChatHistory();
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

  async _loadChatHistory() {
    this._historyLoaded = true;
    // If a sessionId was passed (from Mis Conversaciones), load that session
    if (this.sessionId && this.sessionId.length > 0) {
      await this._loadSession(this.sessionId);
      // Clear it so next navigation starts fresh
      this.sessionId = '';
      return;
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
    // Handle viewInforme / editInforme attributes (from Recibidos screen navigation)
    if (this.viewInforme) {
      const infId = this.viewInforme;
      this.viewInforme = ''; // Clear so it doesn't re-trigger on re-render
      // Small delay to ensure chat is rendered
      setTimeout(() => this._handleInformeView(infId), 300);
    } else if (this.editInforme) {
      const infId = this.editInforme;
      this.editInforme = ''; // Clear so it doesn't re-trigger on re-render
      setTimeout(() => this._handleInformeEdit(infId), 300);
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
    } catch(e) { console.warn('Gremial: session load failed', e); }
  }

  _syncChatMessages(chatEl) {
    if (chatEl) {
      chatEl.messages = this.messages;
      chatEl.typing = this._typing;
      chatEl.section = this._chatSection;
      chatEl.sessionId = this._sessionId;
      chatEl.username = this._username;
      chatEl.historyTitle = 'Mis Conversaciones';
      chatEl.informesTitle = 'Mis Reportes';
      chatEl.informeBadge = this._informeBadge;
      chatEl.persona = this._activePersona;
      chatEl.grade = this.grade;
      chatEl.noAutoScroll = this._bannerVisible;
      // Do NOT call chatEl.render() here — the chat re-renders itself
      // when its attributes change (from gremial render) or from drawer open/close.
      // Double render was causing the blank screen bug.
    }
  }

  async _loadIncomingReports(forceRefresh = false) {
    // Load incoming reports from lower grades for G2+ users.
    // Caches the reports (with correcciones) so they can be sent with each chat request.
    // Refreshes if cache is older than 60s or forceRefresh is true.
    const now = Date.now();
    const cacheAge = now - (this._incomingReportsCacheTime || 0);
    if (!forceRefresh && this._cachedIncomingReports && cacheAge < 60000) {
      return this._cachedIncomingReports; // Cache is fresh
    }
    const gradeMap = {'A': 'G1', 'B.a': 'G1', 'B.b': 'G2', 'B.c': 'G3', 'B.d': 'G4'};
    const gradeCode = gradeMap[this.grade] || 'G1';
    if (gradeCode === 'G1') {
      this._cachedIncomingReports = [];
      return [];
    }
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session') || '{}');
      const userTerritory = session.territory || '';
      const userEmpresa = (session.agremiacion && session.agremiacion.empresa) || '';
      if (typeof obtenerInformesEntrantes === 'function') {
        this._cachedIncomingReports = await obtenerInformesEntrantes(this.grade, userTerritory, userEmpresa, this._username);
        // Load correcciones for each incoming report
        if (typeof obtenerCorrecciones === 'function' && this._cachedIncomingReports.length > 0) {
          const corrPromises = this._cachedIncomingReports.map(async (inf) => {
            try {
              const corrs = await obtenerCorrecciones(inf.id);
              inf._correcciones = corrs || [];
            } catch(e) {
              inf._correcciones = [];
            }
          });
          await Promise.all(corrPromises);
        }
      } else {
        this._cachedIncomingReports = [];
      }
    } catch(e) {
      console.warn('Gremial: incoming reports load failed', e);
      this._cachedIncomingReports = [];
    }
    this._incomingReportsCacheTime = Date.now();
    return this._cachedIncomingReports;
  }

  _formatIncomingReportsForBackend() {
    // Format cached incoming reports for sending to backend.
    // Sends FULL section content + correcciones so Compañero can synthesize.
    if (!this._cachedIncomingReports || this._cachedIncomingReports.length === 0) return [];
    return this._cachedIncomingReports.map(inf => {
      const formatted = {
        id: inf.id || '',
        numero: inf.numero || '',
        titulo: inf.titulo || '',
        sections: (inf.sections || []).map(s => ({
          title: s.title || '',
          body: s.body || '', // Full body — no truncation
        })),
        estado: inf.estado || 'pendiente',
        grado: inf.grado || '',
        username: inf.username || '',
        fecha: inf.fecha || '',
      };
      // Include correcciones (modifications) for each report
      const corrs = inf._correcciones || [];
      if (corrs.length > 0) {
        formatted.correcciones = corrs.map(c => ({
          correctorGrado: c.correctorGrado || '',
          correctorUsername: c.correctorUsername || '',
          tipo: c.tipo || '',
          seccionTitle: c.seccionTitle || '',
          resumen: c.resumen || '',
          textoNuevo: c.textoNuevo || '',
        }));
      }
      return formatted;
    });
  }

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    // Load incoming reports for G2+ users (before greeting)
    await this._loadIncomingReports();
    const incomingReports = this._formatIncomingReportsForBackend();

    // Calculate days since last chat for greeting context
    let daysSinceLastChat = 999; // Default: long time ago
    try {
      if (typeof obtenerChatSessions === 'function') {
        const sessions = await obtenerChatSessions(this._username);
        if (sessions && sessions.length > 0) {
          const lastTs = sessions[0].timestamp || 0;
          daysSinceLastChat = Math.floor((Date.now() - lastTs) / 86400000);
        }
      }
    } catch(e) { /* ignore — use default */ }

    try {
      if (window.HorneroAPI) await window.HorneroAPI.wakeUpBackend();
      const response = await fetch(this._getGreetingUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'reporte',
          grade: this.grade,
          sector: this.sector,
          requested_persona: 'companero',
          days_since_last_chat: daysSinceLastChat,
          incoming_reports: incomingReports,
          incoming_reports_count: incomingReports.length,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      const msg = {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['reporte', 'greeting'],
        persona: 'companero', // Force: gremial screen ALWAYS uses compañero — never swap actors mid-chat
        redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
        time: data.time || this._timeNow(),
      };
      this._typing = false;
      this._greetingRequested = false;
      // Use progressive reveal for typewriter effect (same as Periodista)
      this._addWithProgressiveReveal(msg);
    } catch (e) {
      this._typing = false;
      this._greetingRequested = false;
      this._addWithProgressiveReveal(this._localGreeting());
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      sections: [
        { title: '', body: '¡Hola! Soy el Compañero — años en planta, pasé por las asambleas, las paritarias, las huelgas. Te ayudo con lo que necesites: reportar una situación, debatir organización, armar un reporte gremial. ¿Cómo anduvo todo?' },
      ],
      tags: ['reporte', 'saludo'],
      persona: this._activePersona,
      time: this._timeNow(),
    };
  }

  // ===== Generate a descriptive chat title from the user's first message =====
  _generateTitle(text, section) {
    const t = (text || '').toLowerCase().trim();
    const keywords = [
      ['paritaria', 'Paritaria aceitera'],
      ['salario mínimo', 'SMVM y salario'],
      ['smvm', 'SMVM y salario'],
      ['condiciones', 'Reporte de condiciones'],
      ['seguridad', 'Reporte de seguridad'],
      ['accidente', 'Accidente laboral'],
      ['art', 'Reporte ART'],
      ['despidos', 'Despidos y estabilidad'],
      ['estabilidad', 'Reporte de estabilidad'],
      ['jornada', 'Jornada laboral'],
      ['horas extra', 'Horas extras'],
      ['contrato', 'Contrato de trabajo'],
      ['sindicato', 'Organización sindical'],
      ['delegado', 'Delegados y representación'],
      ['acoso', 'Acoso laboral'],
      ['discriminación', 'Discriminación laboral'],
      ['reporte', 'Reporte de situación'],
      ['situación', 'Situación laboral'],
      ['trabajo', 'Situación laboral'],
      ['insalubridad', 'Insalubridad'],
      ['rhythm', 'Ritmo de trabajo'],
      ['ritmo', 'Ritmo de trabajo'],
      ['maltrato', 'Maltrato laboral'],
      ['firma', 'Firma y documentación'],
      ['convenio', 'Convenio colectivo'],
      ['organización', 'Organización sindical'],
    ];
    for (const [kw, title] of keywords) {
      if (t.includes(kw)) return title;
    }
    const clean = text.trim().replace(/[?!.]+$/, '').substring(0, 50);
    return clean.length > 10 ? clean + '…' : 'Reporte';
  }

  _handleUserMessage(text) {
    // If AI is still typing/revealing, finalize immediately — don't lose the response
    this._finalizeCurrentReveal();
    // Hide banner when user starts chatting
    if (this._bannerVisible) {
      this._bannerVisible = false;
    }
    // Detect export keywords — download current chat or last reporte as document
    // Only match explicit export requests, not incidental words in normal conversation
    const lower = text.toLowerCase().trim();
    const isExportRequest = lower.match(/^(exportar|descargar|guardar documento|download|export)\b/) ||
      lower.match(/\b(exportar chat|exportar informe|descargar chat|descargar informe|exportar conversación|descargar conversación)\b/);
    if (isExportRequest) {
      this._exportCurrentChat();
      return;
    }

    // Detect approval of a pending reporte — intercept before sending to backend
    const isApproval = lower.match(/^(s[ií]|s[ií] señor|s[ií] señora|dale|aprobado|aprobá|apru[ée]bo|confirmo|est[aá] bien|est[aá] perfecto|es perfecto|es perfecto s[ií]|dalo por aprobado|guardalo|guard[aá])$/);
    if (isApproval) {
      const pendingReporte = [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.tags && m.tags.includes('reporte-generado') && !m.tags.includes('reporte-aprobado')
      );
      // Fallback: also detect reportes without 'reporte-generado' tag (e.g. IA didn't include it)
      const fallbackReporte = !pendingReporte ? [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.sections && m.sections.length >= 2 &&
        m.sections.some(s => (s.title || '').toLowerCase().includes('relato')) &&
        !m.tags?.includes('reporte-aprobado') && !m.tags?.includes('informe-guardado') &&
        !m.tags?.includes('informe-error')
      ) : null;
      // Fallback 2: detect reporte from text content (backend returned plain text without sections)
      const textFallbackReporte = !pendingReporte && !fallbackReporte ? [...this.messages].reverse().find(m => {
        if (m.role !== 'hornero') return false;
        if (m.tags?.includes('reporte-aprobado') || m.tags?.includes('informe-guardado') || m.tags?.includes('informe-error')) return false;
        if (!m.text || m.text.length < 100) return false;
        // Must contain Relato + Clasificación patterns
        return /\bRelato\b/.test(m.text) && /\bClasificaci[oó]n\b|\bEtiqueta\b/.test(m.text);
      }) : null;
      const targetReporte = pendingReporte || fallbackReporte || textFallbackReporte;
      if (targetReporte) {
        // Ensure reporte-generado tag is present (for UI detection + save flow)
        if (!targetReporte.tags?.includes('reporte-generado')) {
          targetReporte.tags = [...(targetReporte.tags || []), 'reporte-generado', 'reporte'];
        }
        // If text-based fallback detected, parse sections from text
        if (targetReporte === textFallbackReporte && (!targetReporte.sections || targetReporte.sections.length === 0)) {
          const parsed = this._parseReporteFromText(targetReporte.text);
          if (parsed.isReporte) {
            targetReporte.sections = parsed.sections;
          }
        }
        // Add user message
        this.messages = [...this.messages, { role: 'user', text: text, time: this._timeNow() }];
        this._saveChatHistory();
        this.render();
        // Auto-approve the reporte — await to catch errors
        this._handleReporteAction({ action: 'aprobar' }).catch(e => {
          console.warn('Gremial: auto-approve failed', e);
        });
        return;
      }
    }

    // Detect correction of a specific incoming report by natural language
    // e.g. "quiero corregir el reporte de @trabajador1", "corregir el reporte número 3"
    const isCorrectIncoming = lower.match(/\b(correg[ií]r|modificar|revisar|cambiar)\b.*\b(reporte|informe)\b/) ||
      lower.match(/\b(reporte|informe)\b.*\b(correg[ií]r|modificar|revisar|cambiar)\b/) ||
      lower.match(/\bquiero corregir\b/) ||
      lower.match(/\bcorreg[ií]r el reporte\b/) ||
      lower.match(/\bcorreg[ií]r el informe\b/) ||
      lower.match(/\bmodificar el reporte\b/) ||
      lower.match(/\bmodificar el informe\b/);
    if (isCorrectIncoming && !pendingReporte) {
      // Try to match an incoming report by username or number
      const incomingReports = this._cachedIncomingReports || [];
      const pendingIncoming = incomingReports.filter(inf =>
        inf.estado === 'pendiente' || inf.estado === 'visto' || inf.estado === 'aceptado'
      );
      if (pendingIncoming.length > 0) {
        let matchedInforme = null;
        // Match by @username
        const usernameMatch = lower.match(/@?(\w+)/);
        if (usernameMatch) {
          const uname = usernameMatch[1].toLowerCase();
          matchedInforme = pendingIncoming.find(inf =>
            (inf.username || '').toLowerCase() === uname
          );
        }
        // Match by number "número 3", "n°3", "num 3"
        if (!matchedInforme) {
          const numMatch = lower.match(/(?:n[uú]mero|n[uú]m|n°)\s*(\d+)/);
          if (numMatch) {
            const num = parseInt(numMatch[1], 10);
            matchedInforme = pendingIncoming.find(inf => inf.numero === num);
          }
        }
        // Fallback: if only one pending, use it
        if (!matchedInforme && pendingIncoming.length === 1) {
          matchedInforme = pendingIncoming[0];
        }
        // If still no match but there are pending, list them
        if (!matchedInforme && pendingIncoming.length > 1) {
          this.messages = [...this.messages, { role: 'user', text: text, time: this._timeNow() }];
          const listText = 'Tenés estos reportes pendientes de revisión:\n' +
            pendingIncoming.map(inf => {
              const num = inf.numero || '?';
              const user = inf.username || 'sin nombre';
              return `- Reporte N°${num} de @${user}`;
            }).join('\n') +
            '\n¿Cuál querés corregir? Decime el número o el usuario.';
          this.messages = [...this.messages, {
            role: 'hornero',
            text: listText,
            tags: ['reporte', 'correccion-seleccion'],
            persona: 'companero',
            time: this._timeNow(),
          }];
          this._saveChatHistory();
          this.render();
          return;
        }
        if (matchedInforme) {
          this.messages = [...this.messages, { role: 'user', text: text, time: this._timeNow() }];
          this._saveChatHistory();
          this.render();
          this._handleInformeEdit(matchedInforme.id);
          return;
        }
      }
    }

    // Detect rejection/correction of a pending reporte
    const isCorrection = lower.match(/^(no|correg[ií]|correg[ií]r|cambiar|modificar|ajustar|editar|algo est[aá] mal|no es as[ií])$/) ||
      lower.match(/\b(no est[aá] bien|no es eso|algo para corregir|quiero cambiar|modificar algo)\b/);
    if (isCorrection) {
      const pendingReporte = [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.tags && m.tags.includes('reporte-generado') && !m.tags.includes('reporte-aprobado')
      );
      if (pendingReporte) {
        // Add user message
        this.messages = [...this.messages, { role: 'user', text: text, time: this._timeNow() }];
        this._saveChatHistory();
        this.render();
        // Auto-trigger correction
        this._handleReporteAction({ action: 'corregir' });
        return;
      }
    }

    // Detect missing reporte — user says it's not in their list after approval
    const isMissingReporte = lower.match(/\b(no est[aá]|no aparece|no lo veo|no lo encuentro|no est[aá] guardado|no se guard[oó]|falta el informe|no figura)\b/);
    if (isMissingReporte) {
      const approvedReporte = [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.tags && m.tags.includes('reporte-aprobado')
      );
      if (approvedReporte) {
        // Check if the informe actually exists in the DB
        this._verifyAndResaveInforme(approvedReporte, text);
        return;
      }
    }

    // Generate title for session from the first user message
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    const title = isFirstUserMsg ? this._generateTitle(text, 'reporte') : undefined;
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
          this.messages = [...this.messages, {
            role: 'hornero',
            text: 'El servidor está respondiendo lento. Intentá de nuevo en un momento, o probá tu consulta más tarde.',
            tags: ['reporte', 'timeout'],
            persona: 'companero',
            time: this._timeNow(),
          }];
        } else {
          this._addWithProgressiveReveal(this._localResponse(text));
        }
        this._typing = false;
        this.render();
      });
    });
  }

  _startProgressiveReveal(fullText, chatEl, persona) {
    // Reveal text progressively — simulates streaming for non-streaming backends
    this._stopProgressiveReveal(); // Clear any existing timer
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
          this._typing = false; this._greetingRequested = false;
          this._saveChatHistory();
          if (chatEl) chatEl.finalizeStreamingMessage(msg);
          else { this.messages = [...this.messages, msg]; this.render(); }
          // Auto-save as draft if this is a reporte-generado
          if (msg.tags && msg.tags.includes('reporte-generado')) {
            this._autoSaveReporteDraft(msg);
          }
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
    // Refresh incoming reports cache (reports may have changed since last message)
    await this._loadIncomingReports();

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
        formato: 'reporte',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'companero',
        session_id: this._sessionId,
        incoming_reports: this._formatIncomingReportsForBackend(),
        recipient_chain: this._getRecipientChain(),
      }),
    });

    if (!response.ok) throw new Error('Stream error: ' + response.status);

    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamingText = '';
    let streamingPersona = 'companero';

    // Start streaming — typing indicator already shown by parent render()
    // Just ensure streaming state is clean
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
                streamingPersona = data.persona || 'companero';
                // Finalize: add the complete message to messages array
                const responseText = data.text || streamingText;
                const responseSections = data.sections || [];
                let responseTags = data.tags || ['reporte'];

                // Auto-detect reporte from text if backend didn't return structured sections
                if (responseSections.length === 0 && responseText) {
                  const parsed = this._parseReporteFromText(responseText);
                  if (parsed.isReporte) {
                    responseTags = [...responseTags, 'reporte-generado'];
                    if (!responseTags.includes('reporte')) responseTags.push('reporte');
                    const reportMsg = {
                      role: 'hornero',
                      text: responseText,
                      sections: parsed.sections,
                      tags: responseTags,
                      persona: 'companero', // Force: gremial screen ALWAYS uses compañero
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
                        this._startProgressiveReveal(fullText, chatEl, 'companero');
                      } else {
                        this._stopProgressiveReveal();
                        this._typing = false;
                        this._saveChatHistory();
                        if (chatEl) chatEl.finalizeStreamingMessage(reportMsg);
                        else { this.messages = [...this.messages, reportMsg]; this.render(); }
                      }
                    }
                    // Auto-save as draft so user can view in Mis Reportes
                    this._autoSaveReporteDraft(reportMsg);
                    return;
                  }
                }

                const reportMsg = {
                  role: 'hornero',
                  text: responseText,
                  sections: responseSections,
                  tags: responseTags,
                  persona: 'companero', // Force: gremial screen ALWAYS uses compañero
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
                    this._startProgressiveReveal(fullText, chatEl, 'companero');
                  } else {
                    this._stopProgressiveReveal();
                    this._typing = false;
                    this._saveChatHistory();
                    if (chatEl) chatEl.finalizeStreamingMessage(reportMsg);
                    else { this.messages = [...this.messages, reportMsg]; this.render(); }
                  }
                }
                // Auto-save as draft if this is a reporte-generado
                if (responseTags.includes('reporte-generado')) {
                  this._autoSaveReporteDraft(reportMsg);
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
        this.messages = [...this.messages, {
          role: 'hornero',
          text: streamingText,
          tags: ['reporte', 'stream-partial'],
          persona: 'companero',
          time: this._timeNow(),
        }];
        this._saveChatHistory(); // Persist partial response to IndexedDB
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

  async _callBackend(text) {
    const history = this.messages.slice(-10).map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(this._getChatUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'reporte',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'companero',
        incoming_reports: this._formatIncomingReportsForBackend(),
        recipient_chain: this._getRecipientChain(),
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    const responseText = data.text || '';
    let responseSections = data.sections || [];
    let responseTags = data.tags || ['reporte'];

    // Auto-detect reporte from text if backend didn't return structured sections
    if (responseSections.length === 0 && responseText) {
      const parsed = this._parseReporteFromText(responseText);
      if (parsed.isReporte) {
        responseSections = parsed.sections;
        responseTags = [...responseTags, 'reporte-generado'];
        if (!responseTags.includes('reporte')) responseTags.push('reporte');
      }
    }

    // Progressive reveal for non-streaming fallback
    if (responseText && responseText.length > 50) {
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) {
        this._typing = false;
        this._startProgressiveReveal(responseText, chatEl, 'companero');
        // Wait for reveal to finish, then add message
        const revealDone = new Promise((resolve) => {
          const check = setInterval(() => {
            if (!this._progressiveRevealTimer) {
              clearInterval(check);
              resolve();
            }
          }, 50);
        });
        // Timeout: if reveal takes too long, force finish
        const timeout = new Promise((resolve) => setTimeout(resolve, 15000));
        await Promise.race([revealDone, timeout]);
        this._stopProgressiveReveal();
        if (chatEl) {
          chatEl.streamingText = '';
          chatEl._streamingPersona = '';
        }
      }
    }

    const reportMsg = {
      role: 'hornero',
      text: responseText,
      sections: responseSections,
      tags: responseTags,
      persona: 'companero', // Force: gremial screen ALWAYS uses compañero — never swap actors mid-chat
      redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    };
    this.messages = [...this.messages, reportMsg];
    this._typing = false;
    this._saveChatHistory();
    this.render();
    // Auto-save as draft if this is a reporte-generado
    if (responseTags.includes('reporte-generado')) {
      this._autoSaveReporteDraft(reportMsg);
    }
  }

  async _handleReporteAction(detail) {
    if (detail.action === 'aprobar') {
      // Find the last reporte-generado message
      let reportMsg = [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.tags && m.tags.includes('reporte-generado') && !m.tags.includes('reporte-aprobado')
      );
      // Fallback: also detect reportes without 'reporte-generado' tag (e.g. IA didn't include it)
      if (!reportMsg) {
        reportMsg = [...this.messages].reverse().find(m =>
          m.role === 'hornero' && m.sections && m.sections.length >= 2 &&
          m.sections.some(s => (s.title || '').toLowerCase().includes('relato')) &&
          !m.tags?.includes('reporte-aprobado') && !m.tags?.includes('informe-guardado') &&
          !m.tags?.includes('informe-error')
        );
      }
      // Fallback 2: detect reporte from text content (plain text without sections)
      if (!reportMsg) {
        reportMsg = [...this.messages].reverse().find(m => {
          if (m.role !== 'hornero') return false;
          if (m.tags?.includes('reporte-aprobado') || m.tags?.includes('informe-guardado') || m.tags?.includes('informe-error')) return false;
          if (!m.text || m.text.length < 100) return false;
          return /\bRelato\b/.test(m.text) && /\bClasificaci[oó]n\b|\bEtiqueta\b/.test(m.text);
        });
      }
      if (reportMsg) {
        // Ensure reporte-generado tag is present (for UI detection + save flow)
        if (!reportMsg.tags?.includes('reporte-generado')) {
          reportMsg.tags = [...(reportMsg.tags || []), 'reporte-generado', 'reporte'];
        }
        // If text-based fallback detected, parse sections from text
        if ((!reportMsg.sections || reportMsg.sections.length === 0) && reportMsg.text) {
          const parsed = this._parseReporteFromText(reportMsg.text);
          if (parsed.isReporte) {
            reportMsg.sections = parsed.sections;
          }
        }
        // Mark the original as approved
        const idx = this.messages.indexOf(reportMsg);
        if (idx >= 0) {
          reportMsg.tags = [...(reportMsg.tags || []), 'reporte-aprobado'];
          // If this was a superior correction, mark as modificado
          if (this._originalSectionsBeforeCorrection !== null || this._correctingInformeId) {
            reportMsg.tags = [...reportMsg.tags, 'correccion-modificado'];
          }
          this.messages[idx] = reportMsg;
        }

        // Check if this is a re-edit of an existing informe or auto-saved draft
        const isReEdit = reportMsg.informe_id && this._originalSectionsBeforeCorrection !== null;
        const isAutoSavedDraft = reportMsg.informe_id && !isReEdit;
        let savedInformeId;
        let numero;

        // Save or update the informe — AWAIT to catch errors
        try {
          if (isReEdit) {
            // Re-edit of existing informe (superior correction)
            const result = await this._updateInforme(reportMsg.informe_id, reportMsg);
            savedInformeId = reportMsg.informe_id;
            numero = result ? result.numero : 1;
            if (result && result._correcciones && result._correcciones.length > 0) {
              reportMsg._correcciones = result._correcciones;
            }
          } else if (isAutoSavedDraft) {
            // Auto-saved draft — just change estado to 'aprobado'
            savedInformeId = reportMsg.informe_id;
            if (typeof actualizarEstadoInforme === 'function') {
              await actualizarEstadoInforme(savedInformeId, 'aprobado');
            }
            if (typeof obtenerInforme === 'function') {
              const inf = await obtenerInforme(savedInformeId);
              numero = inf ? inf.numero : 1;
            } else {
              numero = 1;
            }
          } else {
            // Legacy: no auto-saved draft, save new informe
            const result = await this._saveInforme(reportMsg);
            savedInformeId = result ? result.id : '';
            numero = result ? result.numero : 1;
          }
        } catch(e) {
          console.warn('Gremial: informe save failed', e);
          // Show specific error message for G1 pendientes vs generic DB error
          const errorMsg = e.message && e.message.includes('G1 pendientes')
            ? '⚠️ ' + e.message
            : '⚠️ Error al guardar el informe. Intentá de nuevo más tarde.';
          this.messages = [...this.messages, {
            role: 'hornero',
            text: errorMsg,
            tags: ['reporte', 'informe-error'],
            time: this._timeNow(),
          }];
          this.render();
          return;
        }

        // Activate informe badge (icon turns green-pale)
        this._informeBadge = true;

        // Verify the save actually worked — check if the informe exists in the DB
        let verified = false;
        try {
          if (typeof obtenerInforme === 'function' && savedInformeId) {
            const check = await obtenerInforme(savedInformeId);
            verified = !!check;
            console.log('Gremial: informe verification', savedInformeId, verified ? 'OK' : 'NOT FOUND');
          }
        } catch(e) {
          console.warn('Gremial: informe verification failed', e);
        }

        // Brief confirmation message — just notify, no link/button needed
        const isConCambios = reportMsg.tags?.includes('correccion-modificado');
        const confirmMsg = {
          role: 'hornero',
          text: isConCambios
            ? '✅ Informe aprobado con cambios. Va a aparecer resaltado en el listado de reportes recibidos.'
            : '✅ Informe guardado en tu archivo.',
          tags: ['reporte', 'informe-guardado'],
          time: this._timeNow(),
        };
        this.messages = [...this.messages, confirmMsg];
        this._saveChatHistory();
        this.render();

        // Force-refresh the informes drawer if it's open — ensures new informe appears
        const chatEl = this.shadowRoot.querySelector('hornero-chat');
        if (chatEl) {
          if (chatEl._showInformes) {
            try {
              await chatEl._openInformesDrawer();
            } catch(e) {
              console.warn('Gremial: drawer refresh failed', e);
            }
          }
          // Also refresh the recibidos drawer if it's open — shows updated estado
          if (chatEl._showRecibidos) {
            try {
              await chatEl._openRecibidosDrawer();
            } catch(e) {
              console.warn('Gremial: recibidos drawer refresh failed', e);
            }
          }
        }
        // Refresh cached incoming reports so the backend knows about the updated estado
        this._loadIncomingReports().catch(e => {
          console.warn('Gremial: incoming reports refresh failed', e);
        });
      }
    } else if (detail.action === 'corregir') {
      // Mark current draft as needing correction and prompt worker
      this.messages = [...this.messages, {
        role: 'hornero',
        text: '¿Qué querés corregir del informe? Decime qué cambiar y lo ajusto.',
        tags: ['reporte', 'correccion-pendiente'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  // Verify if an approved informe exists in the DB — if not, re-save it
  async _verifyAndResaveInforme(reportMsg, userText) {
    // Add user message
    this.messages = [...this.messages, { role: 'user', text: userText, time: this._timeNow() }];
    this._saveChatHistory();
    this.render();

    try {
      // Check if any informe exists for this user with recent date
      const session = this._getSession();
      const username = session.username || this._username || '';
      let informes = [];
      if (typeof obtenerInformesTodos === 'function') {
        informes = await obtenerInformesTodos(username);
      }
      // Check if the most recent informe matches the approved reporte
      const reporteContent = (reportMsg.text || '').substring(0, 100);
      const found = informes.some(inf => {
        const infContent = (inf.contenido || '').substring(0, 100);
        return infContent === reporteContent ||
               (inf.sections && inf.sections.length === (reportMsg.sections || []).length &&
                inf.fecha === new Date().toISOString().slice(0, 10));
      });

      if (found) {
        // Informe exists — just tell the user
        this.messages = [...this.messages, {
          role: 'hornero',
          text: `El informe ya está guardado en tu archivo.`,
          tags: ['reporte', 'informe-ya-existe'],
          time: this._timeNow(),
        }];
        this._saveChatHistory();
        this.render();
      } else {
        // Informe not found — re-save it
        try {
          const result = await this._saveInforme(reportMsg);
          this._informeBadge = true;
          const numero = result ? result.numero : '';
          this.messages = [...this.messages, {
            role: 'hornero',
            text: `Ya lo guardé${numero ? ' como Reporte Gremial N°' + numero : ''}.`,
            tags: ['reporte', 'informe-reguardado'],
            time: this._timeNow(),
          }];
        } catch(e) {
          this.messages = [...this.messages, {
            role: 'hornero',
            text: 'No pude guardarlo de nuevo. Probá tocando el botón **Aprobar** que aparece en el informe, o contactá soporte.',
            tags: ['reporte', 'informe-error'],
            time: this._timeNow(),
          }];
        }
        this._saveChatHistory();
        this.render();
      }
    } catch(e) {
      console.warn('Gremial: verify informe failed', e);
      // If DB check fails, try re-saving anyway
      try {
        const result = await this._saveInforme(reportMsg);
        this._informeBadge = true;
        const numero = result ? result.numero : '';
        this.messages = [...this.messages, {
          role: 'hornero',
          text: `Lo re-guardé${numero ? ' como Reporte Gremial N°' + numero : ''}.`,
          tags: ['reporte', 'informe-reguardado'],
          time: this._timeNow(),
        }];
      } catch(e2) {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'No pude guardarlo. Probá tocando el botón **Aprobar** en el informe.',
          tags: ['reporte', 'informe-error'],
          time: this._timeNow(),
        }];
      }
      this._saveChatHistory();
      this.render();
    }
  }

  async _saveInforme(reportMsg) {
    const id = typeof generarUUID === 'function' ? generarUUID() : 'h-' + Date.now();
    const session = this._getSession();
    const userGrade = session.grade || this.grade || 'A';
    // Grade-aware: determine grado and prefix based on user's grade
    const gradoMap = { 'B.a': 1, 'B.b': 2, 'B.c': 3, 'B.d': 4 };
    const prefixMap = { 'B.a': 'g1-', 'B.b': 'g2-', 'B.c': 'g3-', 'B.d': 'g4-' };
    const grado = gradoMap[userGrade] || 1;
    const prefix = prefixMap[userGrade] || 'g1-';
    // For B.b (delegate): validate that all incoming G1s have been reviewed
    if (userGrade === 'B.b' && typeof tieneG1Pendientes === 'function') {
      const hasPending = await tieneG1Pendientes(this._username, session.territorio || '', session.empresa || '');
      if (hasPending) {
        throw new Error('Tenés informes G1 pendientes de revisión. Revisa todos antes de elaborar tu informe G2.');
      }
    }
    // Get next informe number for title
    const numero = typeof obtenerInformeNumero === 'function' ? await obtenerInformeNumero(this._username || session.username) : 1;
    const informe = {
      id: prefix + id,
      grado: grado,
      numero: numero,
      fecha: new Date().toISOString().slice(0, 10),
      semana: this._getCurrentWeek(),
      trabajador: session.trabajador,
      empresa: session.empresa || 'Piloto',
      localidad: '',
      territorio: session.territorio || '',
      contenido: reportMsg.text || '',
      sections: reportMsg.sections || [],
      etiquetas: { temas: (reportMsg.tags || []).filter(t => t !== 'reporte' && t !== 'reporte-generado' && t !== 'reporte-aprobado') },
      datosDuros: [],
      estado: 'pendiente',
      username: session.username || this._username || '',
    };
    // Propagate error so _handleReporteAction can catch and show error message
    if (typeof guardarInforme !== 'function') {
      throw new Error('guardarInforme no disponible — base de datos no inicializada');
    }
    const result = await guardarInforme(informe);
    console.log('Gremial: informe saved', informe.id, 'G' + grado, 'N°' + numero, 'username:', informe.username);
    return result;
  }

  // Update an existing informe (after editing) — keeps same ID, resets estado
  async _updateInforme(informeId, reportMsg) {
    if (typeof obtenerInforme !== 'function') {
      throw new Error('obtenerInforme no disponible — base de datos no inicializada');
    }
    const informe = await obtenerInforme(informeId);
    if (!informe) {
      throw new Error('Informe no encontrado: ' + informeId);
    }
    // Update content — detect if this is a superior correction
    const isSuperiorCorrection = this._originalSectionsBeforeCorrection !== null;
    const newSections = reportMsg.sections || [];

    informe.contenido = reportMsg.text || '';
    informe.sections = newSections;
    informe.etiquetas = { temas: (reportMsg.tags || []).filter(t => t !== 'reporte' && t !== 'reporte-generado' && t !== 'reporte-aprobado') };
    informe.fecha = new Date().toISOString().slice(0, 10);

    if (isSuperiorCorrection) {
      // Superior correction: save correcciones and set estado to 'aprobado-con-cambios'
      const originalSections = this._originalSectionsBeforeCorrection;
      this._originalSectionsBeforeCorrection = null;
      this._correctingInformeId = null;

      let savedCorrecciones = [];
      try {
        const { cambios, correcciones } = await this._saveCorreccionesFromDiff(informeId, originalSections, newSections);
        savedCorrecciones = correcciones;
        if (cambios.length > 0) {
          informe.estado = 'aprobado-con-cambios';
        } else {
          informe.estado = 'aprobado'; // No actual changes detected
        }
      } catch(e) {
        console.warn('Gremial: correccion save failed', e);
        informe.estado = 'aprobado-con-cambios'; // Assume changes were made
      }
      const result = await guardarInforme(informe);
      return { ...result, _correcciones: savedCorrecciones };
    } else {
      // Worker's own correction: keep as pendiente for superior review
      informe.estado = 'pendiente';
    }
    return guardarInforme(informe);
  }

  // Open full-screen viewer overlay for a saved informe
  async _handleInformeView(informeId) {
    try {
      if (typeof obtenerInforme !== 'function') return;
      const informe = await obtenerInforme(informeId);
      if (!informe) return;
      // Load correcciones for this informe
      if (typeof obtenerCorrecciones === 'function') {
        const correcciones = await obtenerCorrecciones(informeId);
        informe._correcciones = correcciones || [];
      }
      this._viewingInforme = informe;
      this._openInformePopupPortal();
    } catch(e) {
      console.warn('Gremial: informe view failed', e);
    }
  }

  _closeInformeViewer() {
    this._viewingInforme = null;
    this._informeFullyRead = false;  // Regla 1: reset scroll state on close
    this._closeInformePopupPortal();
  }

  // Open popup from inline reporte card in chat — build informe from message data
  _handleReporteViewPopup(msgIndex) {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (!chatEl || !chatEl.messages || msgIndex < 0 || msgIndex >= chatEl.messages.length) return;
    const m = chatEl.messages[msgIndex];
    if (!m) return;
    // Build informe object from message data
    const informe = {
      id: m.informeId || ('inline-' + msgIndex),
      sections: m.sections || [],
      etiquetas: m.etiquetas || {},
      estado: (m.tags || []).includes('reporte-aprobado') ? 'aprobado' : 'pendiente',
      username: this._username,
      grado: this.grade,
      timestamp: m.timestamp || Date.now(),
      _correcciones: [],
    };
    // Try to load correcciones from DB if this is a saved informe
    if (m.informeId && typeof obtenerCorrecciones === 'function') {
      obtenerCorrecciones(m.informeId).then(correcciones => {
        informe._correcciones = correcciones || [];
        this._viewingInforme = informe;
        this._openInformePopupPortal();
      }).catch(() => {
        this._viewingInforme = informe;
        this._openInformePopupPortal();
      });
    } else {
      this._viewingInforme = informe;
      this._openInformePopupPortal();
    }
  }

  async _deleteInformeFromViewer(informeId) {
    if (typeof dbDelete !== 'function') return;
    // Regla 2: autor NO puede eliminar si un superior ya vio el informe
    if (typeof obtenerInforme === 'function') {
      const informe = await obtenerInforme(informeId);
      if (informe) {
        const session = this._getSession();
        const isOwnInforme = informe.username === (session.username || this._username);
        const superiorVio = ['visto','aprobado','aprobado-con-cambios','aprobado-delegado','corregido-delegado','corregido'].includes(informe.estado);
        if (isOwnInforme && superiorVio) {
          this.messages = [...this.messages, {
            role: 'hornero',
            text: '🔒 No podés eliminar este informe porque ya fue visto por un superior.',
            tags: ['reporte', 'informe-bloqueado'],
            persona: 'companero',
            time: this._timeNow(),
          }];
          this._saveChatHistory();
          this.render();
          return;
        }
      }
    }
    await dbDelete('informes', informeId);
    this._closeInformeViewer();
  }

  _downloadInformeFromViewer() {
    const inf = this._viewingInforme;
    const txtContent = this._generateInformeTxt(inf);
    const filename = (inf.numero ? 'reporte-gremial-n' + inf.numero : 'reporte-gremial') + '.txt';
    this._downloadTxt(txtContent, filename);
  }

  _downloadTxt(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Re-inject a saved informe into the chat for editing
  async _handleInformeEdit(informeId) {
    try {
      if (typeof obtenerInforme !== 'function') return;
      const informe = await obtenerInforme(informeId);
      if (!informe) return;

      // Regla 2: autor NO puede corregir si un superior ya vio el informe
      const session = this._getSession();
      const isOwnInforme = informe.username === (session.username || this._username);
      const superiorVio = ['visto','aprobado','aprobado-con-cambios','aprobado-delegado','corregido-delegado','corregido'].includes(informe.estado);
      if (isOwnInforme && superiorVio) {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: '🔒 No podés modificar este informe porque ya fue visto por un superior. Si necesitás hacer un cambio, contactá a tu delegada.',
          tags: ['reporte', 'informe-bloqueado'],
          persona: 'companero',
          time: this._timeNow(),
        }];
        this._saveChatHistory();
        this.render();
        return;
      }

      // Save original sections before correction (for diff later)
      this._originalSectionsBeforeCorrection = JSON.parse(JSON.stringify(informe.sections || []));
      this._correctingInformeId = informeId;

      // Detect if this is a superior correcting an incoming report
      const isSuperior = informe.username !== (session.username || this._username);

      // Re-inject the informe content as a new reporte-generado message
      const reportMsg = {
        role: 'hornero',
        text: isSuperior
          ? 'Abrimos el reporte para que lo puedas corregir. Lee el contenido y decime qué querés cambiar. Cuando esté listo, te lo leo y preguntó si lo aprobás.'
          : 'Abrimos tu informe para que lo puedas corregir. Lee el contenido y decime qué querés cambiar.',
        sections: informe.sections || [],
        tags: ['reporte', 'reporte-generado'],
        persona: 'companero',
        time: this._timeNow(),
        informe_id: informeId,  // link back to the saved informe
      };

      this.messages = [...this.messages, reportMsg, {
        role: 'hornero',
        text: isSuperior
          ? '¿Qué querés corregir? Decime qué cambiar y lo ajusto. Después te lo leo para que lo apruebes.'
          : '¿Qué querés corregir? Decime qué cambiar y lo ajusto.',
        tags: ['reporte', 'correccion-pendiente'],
        persona: 'companero',
        time: this._timeNow(),
      }];

      this._saveChatHistory();
      this.render();
    } catch(e) {
      console.warn('Gremial: informe edit load failed', e);
    }
  }

  // Modify from popup: close popup, return to chat, ask if user wants to add or correct
  async _handleInformeModify(informeId) {
    try {
      if (typeof obtenerInforme !== 'function') return;
      const informe = await obtenerInforme(informeId);
      if (!informe) return;

      // Regla 2: autor NO puede modificar si un superior ya vio el informe
      const session = this._getSession();
      const isOwnInforme = informe.username === (session.username || this._username);
      const superiorVio = ['visto','aprobado','aprobado-con-cambios','aprobado-delegado','corregido-delegado','corregido'].includes(informe.estado);
      if (isOwnInforme && superiorVio) {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: '🔒 No podés modificar este informe porque ya fue visto por un superior. Si necesitás hacer un cambio, contactá a tu delegada.',
          tags: ['reporte', 'informe-bloqueado'],
          persona: 'companero',
          time: this._timeNow(),
        }];
        this._saveChatHistory();
        this.render();
        return;
      }

      // Save original sections before modification (for diff later)
      this._originalSectionsBeforeCorrection = JSON.parse(JSON.stringify(informe.sections || []));
      this._correctingInformeId = informeId;

      // Re-inject the informe content as a reporte-generado message
      const reportMsg = {
        role: 'hornero',
        text: 'Abrimos tu Reporte Gremial N°' + (informe.numero || '') + ' para modificar. ¿Querés agregar o corregir algo? Decime qué cambiar y lo ajusto. Cuando esté listo, te lo leo y pregunto si lo aprobás.',
        sections: informe.sections || [],
        tags: ['reporte', 'reporte-generado'],
        persona: 'companero',
        time: this._timeNow(),
        informe_id: informeId,
      };

      this.messages = [...this.messages, reportMsg, {
        role: 'hornero',
        text: '¿Qué querés agregar o corregir? Decime y lo ajusto.',
        tags: ['reporte', 'correccion-pendiente'],
        persona: 'companero',
        time: this._timeNow(),
      }];

      this._saveChatHistory();
      this.render();
    } catch(e) {
      console.warn('Gremial: informe modify failed', e);
    }
  }

  // Share informe from popup — native Web Share API or fallback to clipboard
  _shareInformeFromViewer() {
    const inf = this._viewingInforme;
    if (!inf) return;
    const title = inf.numero ? 'Reporte Gremial N°' + inf.numero : 'Reporte Gremial';
    const sections = (inf.sections || []).map(s => {
      if (s.title) return `**${s.title}**\n${s.body || ''}`;
      return s.body || '';
    }).join('\n\n');
    const text = `${title}\n\n${sections}`;

    if (navigator.share) {
      navigator.share({ title, text }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        // Brief toast
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;background:#3D6B56;color:#fff;padding:12px 24px;border-radius:12px;font-family:Archivo,sans-serif;font-weight:700;font-size:.86rem;opacity:0;transition:opacity .3s;pointer-events:none;';
        toast.textContent = 'Copiado al portapapeles';
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 1500);
      }).catch(() => {});
    }
  }

  // Superior approves a received informe without changes
  async _handleInformeApprove(informeId) {
    try {
      // Regla 1: defender que el informe fue leído completo antes de aprobar
      if (!this._informeFullyRead) {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: '🔒 Tenés que leer el informe completo antes de poder aprobarlo. Abrilo desde el listado y scrolleá hasta el final.',
          tags: ['reporte', 'informe-bloqueado'],
          persona: 'companero',
          time: this._timeNow(),
        }];
        this._saveChatHistory();
        this.render();
        return;
      }
      if (typeof actualizarEstadoInforme !== 'function') return;
      const session = this._getSession();
      const gradoMap = { 'B.a': 1, 'B.b': 2, 'B.c': 3, 'B.d': 4 };
      const correctorGrado = gradoMap[session.grade] || 2;

      // Update estado to 'aprobado'
      await actualizarEstadoInforme(informeId, 'aprobado');

      // Save traceability record (aprobación sin cambios)
      if (typeof guardarCorreccion === 'function') {
        const uuid = typeof generarUUID === 'function' ? generarUUID() : 'c-' + Date.now();
        await guardarCorreccion({
          id: 'corr-' + uuid,
          informeId: informeId,
          correctorGrado: correctorGrado,
          correctorUsername: session.username || this._username || '',
          fecha: new Date().toISOString().slice(0, 10),
          tipo: 'aprobacion-sin-cambios',
          cambios: null,
          resumen: 'Aprobado sin cambios',
        });
      }

      // Notify user
      this.messages = [...this.messages, {
        role: 'hornero',
        text: '✅ Informe aprobado sin cambios.',
        tags: ['reporte', 'informe-aprobado'],
        persona: 'companero',
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    } catch(e) {
      console.warn('Gremial: informe approve failed', e);
    }
  }

  // Compute diff between original and new sections, save correcciones
  async _saveCorreccionesFromDiff(informeId, originalSections, newSections) {
    const session = this._getSession();
    const gradoMap = { 'B.a': 1, 'B.b': 2, 'B.c': 3, 'B.d': 4 };
    const correctorGrado = gradoMap[session.grade] || 2;

    const cambios = [];
    const correcciones = [];
    const maxLen = Math.max(originalSections.length, newSections.length);

    for (let i = 0; i < maxLen; i++) {
      const orig = originalSections[i] || {};
      const nuevo = newSections[i] || {};
      const origBody = orig.body || '';
      const nuevoBody = nuevo.body || '';

      if (origBody !== nuevoBody || (orig.title || '') !== (nuevo.title || '')) {
        const tipo = !origBody && nuevoBody ? 'agregado' :
                     origBody && !nuevoBody ? 'eliminado' : 'modificado';
        cambios.push({
          sectionIndex: i,
          sectionTitle: nuevo.title || orig.title || 'Sección ' + (i + 1),
          tipo: tipo,
          original: origBody.substring(0, 200),
          modificado: nuevoBody.substring(0, 200),
        });

        const uuid = typeof generarUUID === 'function' ? generarUUID() : 'c-' + Date.now() + '-' + i;
        correcciones.push({
          id: 'corr-' + uuid,
          informeId: informeId,
          correctorGrado: correctorGrado,
          correctorUsername: session.username || this._username || '',
          fecha: new Date().toISOString().slice(0, 10),
          seccionIndex: i,
          seccionTitle: nuevo.title || orig.title || 'Sección ' + (i + 1),
          textoOriginal: origBody,
          textoNuevo: nuevoBody,
          tipo: tipo,
          resumen: tipo === 'modificado' ? 'Sección modificada' :
                   tipo === 'agregado' ? 'Sección agregada' : 'Sección eliminada',
        });
      }
    }

    // Save all correcciones
    if (correcciones.length > 0 && typeof guardarCorreccionBatch === 'function') {
      await guardarCorreccionBatch(correcciones);
    } else if (correcciones.length > 0 && typeof guardarCorreccion === 'function') {
      await Promise.all(correcciones.map(c => guardarCorreccion(c)));
    }

    return { cambios, correcciones };
  }

  // Generate TXT content for a single informe (for download card)
  _generateInformeTxt(reportMsg) {
    const lines = [];
    if (reportMsg.sections && reportMsg.sections.length > 0) {
      reportMsg.sections.forEach(s => {
        if (s.title) lines.push(s.title);
        if (s.body) lines.push(s.body);
      });
    }
    // Fallback: use contenido field if sections are empty
    if (lines.length === 0 && reportMsg.contenido) {
      lines.push(reportMsg.contenido);
    }
    // Fallback: use text field
    if (lines.length === 0 && reportMsg.text) {
      lines.push(reportMsg.text);
    }
    return lines.join('\n\n---\n\n');
  }

  // ===== Fallback offline =====
  // ===== Audio message handling =====
  _handleAudioMessage(audioBlob, duration, fileName) {
    const durationStr = duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00';
    const userMsg = { role: 'user', text: `🎤 Audio (${durationStr})`, audio: true, duration, time: this._timeNow() };
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    if (isFirstUserMsg) userMsg.title = 'Audio reporte';
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    this._callAudioBackend(audioBlob, fileName).catch(() => {
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      this._addWithProgressiveReveal(this._localResponse('audio reporte'));
      this._typing = false;
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
    formData.append('formato', 'reporte');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', 'companero');
    formData.append('history', JSON.stringify(history));

    const response = await fetch(this._getAudioUrl(), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Audio backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['reporte', 'audio'],
      persona: 'companero', // Force: gremial screen ALWAYS uses compañero — never swap actors mid-chat
      redirect_persona: data.redirect_persona || '',
        image: data.image || '',
        source_url: data.source_url || '',
      time: data.time || this._timeNow(),
    }];
    this._activePersona = data.persona || 'companero';
    this._typing = false;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) chatEl.resetAudioState();
    this._saveChatHistory();
    this.render();
  }

  // Add a message with progressive reveal (typing effect)
  _addWithProgressiveReveal(msg) {
    if (!msg.text || msg.text.length <= 50) {
      // Short text — add directly
      this.messages = [...this.messages, msg];
      this._typing = false;
      this._saveChatHistory();
      this.render();
      return;
    }
    // Progressive reveal — get fresh chatEl reference
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
      this._saveChatHistory();
    });
  }

  // Brief local response when user clicks an explore button
  _exploreResponse(topic) {
    const p = this._activePersona;
    const map = {
      'Relato': { title: 'Relato', body: 'Contame qué pasó y te ayudo a redactar el relato del hecho. Podés describir la situación, el lugar, los involucrados, las circunstancias.' },
      'Clasificación': { title: 'Clasificación', body: 'A partir del relato, clasificamos el hecho: tipo, gravedad, alcance. Primero necesitamos el relato.' },
      'Seguimiento': { title: 'Seguimiento', body: 'Hacemos seguimiento de los reportes: estado, acciones tomadas, pendientes. ¿Querés ver el estado de un reporte existente?' },
      'Aprobación': { title: 'Aprobación', body: 'Revisión y aprobación de informes gremiales por parte de los referentes. ¿Querés ver los informes pendientes?' },
    };
    const section = map[topic] || { title: topic, body: 'Preguntame lo que quieras sobre ' + topic + '.' };
    return { role: 'hornero', sections: [section], tags: ['reporte', 'explore'], persona: p, time: this._timeNow() };
  }

  _localResponse(userText) {
    // Compañero investigates — asks follow-up questions, does NOT produce informe yet
    return {
      role: 'hornero',
      text: 'Entendido. Quiero entender mejor la situación para poder elaborar un informe completo. ¿Podés contarme más detalles?',
      sections: [
        { title: 'Lo que entendí', body: userText },
        { title: 'Preguntas para profundizar', body: '¿Cuándo ocurrió? ¿Quiénes están involucrados? ¿Hubo testigos? ¿Ya lo reportaste a alguien — delegado, supervisor, ART?' },
      ],
      tags: ['reporte', 'investigacion'],
      persona: this._activePersona,
      time: this._timeNow(),
    };
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
    } catch(e) { console.warn('Gremial: chat history save failed', e); }
  }

  // ===== Export current chat as downloadable TXT document =====
  _exportCurrentChat() {
    if (!this.messages || this.messages.length === 0) return;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      const firstUserMsg = this.messages.find(m => m.role === 'user');
      const title = firstUserMsg && firstUserMsg.title ? firstUserMsg.title : 'Reporte Gremial';
      const dateStamp = new Date().toISOString().slice(0, 10);
      const safeTitle = title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const fname = safeTitle + '_' + dateStamp;
      const filename = fname + '.txt';
      chatEl._downloadTxt(this.messages, title, fname);
      // Add message with clickable download card
      const txtContent = chatEl._generateTxtContent(this.messages, title);
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: { content: txtContent, filename: filename, label: 'Click para descargar' },
        tags: ['reporte', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
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
        tags: ['reporte', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  // ===== Helpers =====
  _getSession() {
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session) {
        const rolMap = { 'B.d': 'Federación', 'B.c': 'Secretaria', 'B.b': 'Delegada', 'B.a': 'Base' };
        this._username = session.username || '';
        return {
          nombre: session.nombre || 'Trabajador',
          funcion: rolMap[session.grade] || 'Base',
          territorio: session.territory || '',
          empresa: session.agremiacion ? session.agremiacion.empresa : 'Piloto',
          puesto: session.agremiacion ? session.agremiacion.puesto : '',
          username: session.username || '',
          grade: session.grade || 'A',
          trabajador: { nombre: session.nombre || 'Trabajador', funcion: rolMap[session.grade] || 'Base', seccion: '' },
        };
      }
    } catch(e) {}
    this._username = '';
    return { nombre: 'Trabajador', funcion: 'Base', territorio: '', empresa: 'Piloto', puesto: '', username: '', grade: 'A', trabajador: { nombre: 'Trabajador', funcion: 'Base', seccion: '' } };
  }

  // Build recipient chain string for the Ficha section
  _getRecipientChain() {
    const session = this._getSession();
    const grade = session.grade || 'A';
    const empresa = session.empresa || 'Piloto';
    const territorio = session.territorio || '';
    // Build chain based on grade: G1→G2→G3→G4
    const chain = [];
    if (grade === 'B.a') {
      chain.push('Delegada responsable del sector');
      chain.push('Secretaria');
      chain.push('Federación');
    } else if (grade === 'B.b') {
      chain.push('Secretaria');
      chain.push('Federación');
    } else if (grade === 'B.c') {
      chain.push('Federación');
    }
    // If no chain (G4 or higher), report goes to archive
    if (chain.length === 0) {
      return 'Archivo central';
    }
    return chain.join(' → ');
  }

  _getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000;
    const weekNum = Math.ceil((diff / oneWeek) + 1);
    return now.getFullYear() + '-W' + (weekNum < 10 ? '0' : '') + weekNum;
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

customElements.define('hornero-gremial', HorneroGremial);
