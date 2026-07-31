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
    this._progressiveRevealFull = ''; // Full text to reveal progressively
    this._progressiveRevealIndex = 0; // Current reveal position
  }

  connectedCallback() {
    super.connectedCallback();
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    // Get username from login session for per-user data isolation
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); position: relative; }
      .chat-container { display: flex; flex-direction: column; height: 100%; }

      /* === Full-screen informe viewer overlay === */
      .inform-view-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: var(--ho-bg, #1E2321); z-index: 100; display: flex;
        flex-direction: column; animation: fadeIn .25s ease; }
      .inform-view-header { padding: 14px 16px; display: flex; align-items: center;
        gap: 10px; flex: none; background: var(--ho-green-dark, #3D6B56); }
      .inform-view-header-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .92rem; color: var(--ho-text-off, #F2F1EC); flex: 1;
        letter-spacing: .04em; text-transform: uppercase; }
      .inform-view-header-estado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
      .inform-view-header-estado.estado-pendiente { background: #F0E4CC; color: #856404; }
      .inform-view-header-estado.estado-aceptado { background: #E0F0EB; color: #3D6B56; }
      .inform-view-header-estado.estado-aprobado { background: #C5D9A0; color: #3D6B1A; }
      .inform-view-close { background: rgba(255,255,255,.15); border: none; cursor: pointer;
        border-radius: 8px; padding: 6px 10px; color: var(--ho-text-off, #F2F1EC);
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .78rem;
        display: flex; align-items: center; gap: 4px; }
      .inform-view-close:hover { background: rgba(255,255,255,.25); }
      .inform-view-scroll { flex: 1; overflow-y: auto; padding: 20px 16px; }
      .inform-view-section { margin-bottom: 16px; }
      .inform-view-section:last-child { margin-bottom: 0; }
      .inform-view-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .84rem; color: var(--ho-green-dark, #3D6B56); margin-bottom: 6px;
        text-transform: uppercase; letter-spacing: .06em; }
      .inform-view-section-body { font-family: 'Public Sans', sans-serif;
        font-size: .85rem; color: var(--ho-text, #E8E6E0); line-height: 1.6; }

      /* Section-type-aware styles for the 4 report sections */
      .inform-view-section[data-section-type="relato"] .inform-view-section-body {
        font-size: .88rem; color: var(--ho-text, #E8E6E0); line-height: 1.65; }
      .inform-view-section[data-section-type="clasificacion"] .inform-view-section-body {
        font-size: .84rem; color: var(--ho-text-mid, #6E6A60); line-height: 1.55; }
      .inform-view-section[data-section-type="clasificacion"] .inform-view-section-body strong {
        color: var(--ho-green-dark, #3D6B56); font-weight: 700; }
      .inform-view-section[data-section-type="clasificacion"] .clasif-tag {
        display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #EDEAE3; color: var(--ho-text, #E8E6E0);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        vertical-align: middle; margin: 0 2px; line-height: 1.4; }
      .inform-view-section[data-section-type="extractos"] .inform-view-section-body {
        font-size: .82rem; color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        font-style: italic; border-left: 3px solid var(--ho-green, #4E9978);
        padding-left: 14px; background: rgba(78,153,120,.06);
        border-radius: 0 8px 8px 0; }
      .inform-view-section[data-section-type="ficha"] .inform-view-section-body {
        font-family: 'JetBrains Mono', monospace; font-size: .74rem;
        color: var(--ho-text-light, #9C988D); line-height: 1.7;
        background: var(--ho-bg, #1E2321); border-radius: 8px;
        padding: 10px 14px; }
      .inform-view-section[data-section-type="ficha"] .inform-view-section-body strong {
        color: var(--ho-text-mid, #6E6A60); font-weight: 600; }
      .inform-view-section-divider { height: 1px; background: rgba(43,42,38,.10);
        margin: 16px 0; }
      .inform-view-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px;
        padding-top: 12px; border-top: 1px solid var(--ho-green-pale, #E0F0EB); }
      .inform-view-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #EDEAE3; color: var(--ho-text, #E8E6E0);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-view-actions { padding: 12px 16px; display: flex; gap: 8px;
        justify-content: flex-end; flex: none;
        border-top: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230); }
      .inform-view-btn { border-radius: 10px; padding: 8px 14px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .78rem;
        cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
        transition: background .2s; }
      .inform-view-btn-editar { background: none; border: 1.5px solid #B0863F;
        color: #B0863F; }
      .inform-view-btn-editar:hover { background: #F0E4CC; }
      .inform-view-btn-descargar { background: none; border: 1.5px solid var(--ho-green, #4E9978);
        color: var(--ho-green, #4E9978); }
      .inform-view-btn-descargar:hover { background: var(--ho-green-pale, #E0F0EB); }
      .inform-view-btn-borrar { background: none; border: 1.5px solid transparent;
        color: var(--ho-text-light, #9C988D); }
      .inform-view-btn-borrar:hover { color: #D32F2F; border-color: rgba(211,47,47,.2);
        background: #FDECEA; }
      .inform-view-meta { display: flex; align-items: center; gap: 8px;
        margin-bottom: 16px; font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; color: var(--ho-text-muted, #8A8A74); }
      .inform-view-meta-user { color: var(--ho-text-mid, #6E6A60); }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
  }

  _render() {
    return html`
      <div class="chat-container">
        <hornero-chat
          title="Reporte Gremial"
          input-placeholder="Contá tu situación, lo que viste, lo que te pasó..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="reporte"
          history-title="Mis Conversaciones"
          informes-title="Mis Reportes"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
        ></hornero-chat>
      </div>

      ${this._viewingInforme ? this._renderInformeViewer() : ''}
    `;
  }

  // === Full-screen informe viewer overlay ===
  _renderInformeViewer() {
    const inf = this._viewingInforme;
    const numero = inf.numero || '';
    const estado = inf.estado || 'pendiente';
    const estadoLabelMap = {
      'pendiente': '⏳ Pendiente',
      'visto': '👁 Visto',
      'aceptado': '✅ Aceptado',
      'aprobado': '✅ Aprobado',
      'aprobado-delegado': '✅ Aprobado',
      'corregido-delegado': '📝 Corregido',
    };
    const estadoClassMap = {
      'pendiente': 'estado-pendiente',
      'visto': 'estado-aceptado',
      'aceptado': 'estado-aceptado',
      'aprobado': 'estado-aprobado',
      'aprobado-delegado': 'estado-aprobado',
      'corregido-delegado': 'estado-aceptado',
    };
    const estadoLabel = estadoLabelMap[estado] || estado;
    const estadoClass = estadoClassMap[estado] || '';
    const titleText = numero ? 'Reporte Gremial N°' + numero :
      (inf.sections && inf.sections.length > 0 ?
        (inf.sections[0].title || 'Informe Gremial') : 'Informe Gremial');

    // Sections — all expanded, no collapse; section-type-aware styling
    const sectionsHtml = (inf.sections || []).map((s, i) => {
      let content = '';
      // Detect section type for styling based on title
      const sectionTitle = (s.title || '').toLowerCase();
      let sectionType = 'default';
      if (sectionTitle.includes('relato')) sectionType = 'relato';
      else if (sectionTitle.includes('clasificación') || sectionTitle.includes('clasificacion') || sectionTitle.includes('etiqueta')) sectionType = 'clasificacion';
      else if (sectionTitle.includes('extracto') || sectionTitle.includes('diálogo') || sectionTitle.includes('dialogo') || sectionTitle.includes('transcript')) sectionType = 'extractos';
      else if (sectionTitle.includes('ficha') || sectionTitle.includes('reportante')) sectionType = 'ficha';
      if (s.title) content += `<div class="inform-view-section-title">${s.title}</div>`;
      else if (i > 0) content += `<div class="inform-view-section-title">Detalle</div>`;
      if (s.body) {
        let bodyHtml = this._formatMarkdown(s.body);
        // In Clasificación section: convert #tag patterns into visual tag badges
        if (sectionType === 'clasificacion') {
          bodyHtml = bodyHtml.replace(/#([a-záéíóúñ_]+)/g, '<span class="inform-view-tag clasif-tag">#$1</span>');
        }
        content += `<div class="inform-view-section-body">${bodyHtml}</div>`;
      }
      const divider = (i < (inf.sections || []).length - 1) ?
        '<div class="inform-view-section-divider"></div>' : '';
      return `<div class="inform-view-section" data-section-type="${sectionType}">${content}</div>${divider}`;
    }).join('');

    // Tags
    const tags = inf.etiquetas && inf.etiquetas.temas ? inf.etiquetas.temas : [];
    const tagsHtml = tags.length > 0 ?
      `<div class="inform-view-tags">${tags.map(t => `<span class="inform-view-tag">${t}</span>`).join('')}</div>` : '';

    // Meta (date + user + grade)
    const dateStr = inf.fecha || '';
    const metaHtml = `<div class="inform-view-meta">
      <span>${dateStr}</span>
      ${inf.username ? '<span class="inform-view-meta-user">@' + inf.username + '</span>' : ''}
      ${inf.grado ? '<span>G' + inf.grado + '</span>' : ''}
    </div>`;

    // Action buttons — Editar only for pendiente/aceptado
    const canEdit = estado === 'pendiente' || estado === 'aceptado';
    const editBtn = canEdit ?
      `<button class="inform-view-btn inform-view-btn-editar" data-inform-view-action="editar">✏️ Editar</button>` : '';
    const deleteBtn = `<button class="inform-view-btn inform-view-btn-borrar" data-inform-view-action="borrar">🗑 Borrar</button>`;
    const downloadBtn = `<button class="inform-view-btn inform-view-btn-descargar" data-inform-view-action="descargar">📥 Descargar</button>`;

    return html`
      <div class="inform-view-overlay">
        <div class="inform-view-header">
          <span class="inform-view-header-title">${titleText}</span>
          <span class="inform-view-header-estado ${estadoClass}">${estadoLabel}</span>
          <button class="inform-view-close" data-inform-view-action="close">✕ Cerrar</button>
        </div>
        <div class="inform-view-scroll">
          ${metaHtml}
          ${sectionsHtml}
          ${tagsHtml}
        </div>
        <div class="inform-view-actions">
          ${editBtn}
          ${downloadBtn}
          ${deleteBtn}
        </div>
      </div>
    `;
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
    }

    // === Informe viewer overlay action buttons ===
    this.shadowRoot.querySelectorAll('[data-inform-view-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.informViewAction;
        const infId = this._viewingInforme ? this._viewingInforme.id : null;
        if (action === 'close') {
          this._closeInformeViewer();
        } else if (action === 'editar' && infId) {
          this._closeInformeViewer();
          this._handleInformeEdit(infId);
        } else if (action === 'borrar' && infId) {
          this._deleteInformeFromViewer(infId);
        } else if (action === 'descargar' && this._viewingInforme) {
          this._downloadInformeFromViewer();
        }
      });
    });

    if (!this._historyLoaded) {
      this._loadChatHistory();
    }
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
    if (this.messages.length === 0 && !this._greetingRequested) {
      this._requestGreeting();
    }
  }

  // Load an existing session from history
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
      // Do NOT call chatEl.render() here — the chat re-renders itself
      // when its attributes change (from gremial render) or from drawer open/close.
      // Double render was causing the blank screen bug.
    }
  }

  async _loadIncomingReports() {
    // Load incoming reports from lower grades for G2+ users.
    // Caches the reports so they can be sent with each chat request.
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
        this._cachedIncomingReports = await obtenerInformesEntrantes(this.grade, userTerritory, userEmpresa);
      } else {
        this._cachedIncomingReports = [];
      }
    } catch(e) {
      console.warn('Gremial: incoming reports load failed', e);
      this._cachedIncomingReports = [];
    }
    return this._cachedIncomingReports;
  }

  _formatIncomingReportsForBackend() {
    // Format cached incoming reports for sending to backend.
    // Only sends essential fields to keep payload small.
    if (!this._cachedIncomingReports || this._cachedIncomingReports.length === 0) return [];
    return this._cachedIncomingReports.map(inf => ({
      id: inf.id || '',
      numero: inf.numero || '',
      titulo: inf.titulo || '',
      sections: (inf.sections || []).map(s => ({
        title: s.title || '',
        body: (s.body || '').substring(0, 300), // Truncate for token efficiency
      })),
      estado: inf.estado || 'pendiente',
      grado: inf.grado || '',
      username: inf.username || '',
      fecha: inf.fecha || '',
    }));
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
      const response = await fetch(HorneroGremial.GREETING_URL, {
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
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['reporte', 'greeting'],
        persona: 'companero', // Force: gremial screen ALWAYS uses compañero — never swap actors mid-chat
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      this._typing = false;
      this._greetingRequested = false;
      // Don't save to IndexedDB yet — session only created when user sends a message
      this.render();
    } catch (e) {
      this._typing = false;
      this._greetingRequested = false;
      this.messages = [this._localGreeting()];
      this.render();
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      text: '¿Cómo andaste estos últimos días? ¿Hay alguna situación que quieras reportar — condiciones, seguridad, ritmo, algo que te pasó o que viste?',
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
    // Stop any ongoing progressive reveal
    this._stopProgressiveReveal();
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
    const isApproval = lower.match(/^(s[ií]|s[ií] señor|s[ií] señora|dale|aprobado|aprobá|apru[ée]bo|confirmo|est[aá] bien|est[aá] perfecto|dalo por aprobado|guardalo|guard[aá])$/);
    if (isApproval) {
      const pendingReporte = [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.tags && m.tags.includes('reporte-generado') && !m.tags.includes('reporte-aprobado')
      );
      if (pendingReporte) {
        // Add user message
        this.messages = [...this.messages, { role: 'user', text: text, time: this._timeNow() }];
        this._saveChatHistory();
        this.render();
        // Auto-approve the reporte
        this._handleReporteAction({ action: 'aprobar' });
        return;
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
          this.messages = [...this.messages, this._localResponse(text)];
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
    const chunkSize = 3; // Characters per tick
    const interval = 18; // ms between ticks — ~55 chars/sec
    this._progressiveRevealTimer = setInterval(() => {
      this._progressiveRevealIndex += chunkSize;
      if (this._progressiveRevealIndex >= this._progressiveRevealFull.length) {
        // Done — show full text
        this._stopProgressiveReveal();
        if (chatEl) {
          chatEl.updateStreamingText(this._progressiveRevealFull);
        }
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
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
  }

  async _callBackendStream(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(HorneroGremial.STREAM_URL, {
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
      }),
    });

    if (!response.ok) throw new Error('Stream error: ' + response.status);

    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamingText = '';
    let streamingPersona = 'companero';

    // Start streaming — show typing indicator until first token
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
                // If chunk is large (non-streaming fallback), reveal progressively
                if (content.length > 50 && !this._progressiveRevealTimer) {
                  this._startProgressiveReveal(streamingText, chatEl, streamingPersona);
                } else {
                  // Small chunk (true streaming) — update DOM directly, no full render
                  chatEl.streamingText = streamingText;
                  chatEl._streamingPersona = streamingPersona;
                  chatEl.updateStreamingText(streamingText);
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
                this.messages = [...this.messages, {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['reporte'],
                  persona: 'companero', // Force: gremial screen ALWAYS uses compañero
                  redirect_persona: data.redirect_persona || '',
                  time: data.time || this._timeNow(),
                }];
                // Clear streaming state
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

    const response = await fetch(HorneroGremial.API_URL, {
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
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    const responseText = data.text || '';
    const responseSections = data.sections || [];

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

    this.messages = [...this.messages, {
      role: 'hornero',
      text: responseText,
      sections: responseSections,
      tags: data.tags || ['reporte'],
      persona: 'companero', // Force: gremial screen ALWAYS uses compañero — never swap actors mid-chat
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    this._typing = false;
    this._saveChatHistory();
    this.render();
  }

  async _handleReporteAction(detail) {
    if (detail.action === 'aprobar') {
      // Find the last reporte-generado message
      const reportMsg = [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.tags && m.tags.includes('reporte-generado') && !m.tags.includes('reporte-aprobado')
      );
      if (reportMsg) {
        // Mark the original as approved
        const idx = this.messages.indexOf(reportMsg);
        if (idx >= 0) {
          reportMsg.tags = [...(reportMsg.tags || []), 'reporte-aprobado'];
          this.messages[idx] = reportMsg;
        }

        // Check if this is a re-edit of an existing informe
        const isReEdit = reportMsg.informe_id;
        let savedInformeId;
        let numero;

        // Save or update the informe — AWAIT to catch errors
        try {
          if (isReEdit) {
            const result = await this._updateInforme(reportMsg.informe_id, reportMsg);
            savedInformeId = reportMsg.informe_id;
            numero = result ? result.numero : 1;
          } else {
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

        // Brief confirmation message — NOT the full reporte again
        const confirmMsg = {
          role: 'hornero',
          text: `✅ Informe guardado. Lo tenés en **Mis Reportes**.`,
          tags: ['reporte', 'informe-guardado'],
          open_informes: true, // Renders "Ver mis informes" button
          time: this._timeNow(),
        };
        this.messages = [...this.messages, confirmMsg];
        this._saveChatHistory();
        this.render();
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
          text: `El informe está guardado. Abrí **Mis Reportes** (el ícono de documento arriba a la derecha) y lo vas a ver ahí.`,
          tags: ['reporte', 'informe-ya-existe'],
          open_informes: true,
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
            text: `Tenías razón, el informe no se había guardado. Ya lo guardé${numero ? ' como Reporte Gremial N°' + numero : ''}. Lo tenés en **Mis Reportes**.`,
            tags: ['reporte', 'informe-reguardado'],
            open_informes: true,
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
          text: `Lo re-guardé${numero ? ' como Reporte Gremial N°' + numero : ''}. Lo tenés en **Mis Reportes**.`,
          tags: ['reporte', 'informe-reguardado'],
          open_informes: true,
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
    // Update content, keep estado as 'pendiente' (delegate needs to see the correction)
    informe.contenido = reportMsg.text || '';
    informe.sections = reportMsg.sections || [];
    informe.etiquetas = { temas: (reportMsg.tags || []).filter(t => t !== 'reporte' && t !== 'reporte-generado' && t !== 'reporte-aprobado') };
    informe.estado = 'pendiente';
    informe.fecha = new Date().toISOString().slice(0, 10); // update date to reflect correction
    return guardarInforme(informe);
  }

  // Open full-screen viewer overlay for a saved informe
  async _handleInformeView(informeId) {
    try {
      if (typeof obtenerInforme !== 'function') return;
      const informe = await obtenerInforme(informeId);
      if (!informe) return;
      this._viewingInforme = informe;
      this.render();
    } catch(e) {
      console.warn('Gremial: informe view failed', e);
    }
  }

  _closeInformeViewer() {
    this._viewingInforme = null;
    this.render();
  }

  async _deleteInformeFromViewer(informeId) {
    if (typeof dbDelete !== 'function') return;
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

      // Re-inject the informe content as a new reporte-generado message
      const reportMsg = {
        role: 'hornero',
        text: 'Abrimos tu informe para que lo puedas corregir. Lee el contenido y decime qué querés cambiar.',
        sections: informe.sections || [],
        tags: ['reporte', 'reporte-generado'],
        persona: 'companero',
        time: this._timeNow(),
        informe_id: informeId,  // link back to the saved informe
      };

      this.messages = [...this.messages, reportMsg, {
        role: 'hornero',
        text: '¿Qué querés corregir? Decime qué cambiar y lo ajusto.',
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

  // Generate TXT content for a single informe (for download card)
  _generateInformeTxt(reportMsg) {
    const lines = [];
    if (reportMsg.sections && reportMsg.sections.length > 0) {
      reportMsg.sections.forEach(s => {
        if (s.title) lines.push(s.title);
        if (s.body) lines.push(s.body);
      });
    } else {
      lines.push(reportMsg.text || '');
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
      this.messages = [...this.messages, this._localResponse('audio reporte')];
      this._typing = false;
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
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

    const response = await fetch(HorneroGremial.AUDIO_URL, {
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
      time: data.time || this._timeNow(),
    }];
    this._activePersona = data.persona || 'companero';
    this._typing = false;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) chatEl.resetAudioState();
    this._saveChatHistory();
    this.render();
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
    return now.getHours().toString().padStart(2, '0') + ':' +
           now.getMinutes().toString().padStart(2, '0');
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
      const filename = title + '.txt';
      chatEl._downloadTxt(this.messages, title, title);
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
          trabajador: { nombre: session.nombre || 'Trabajador', funcion: rolMap[session.grade] || 'Base', seccion: '' },
        };
      }
    } catch(e) {}
    this._username = '';
    return { nombre: 'Trabajador', funcion: 'Base', territorio: '', empresa: 'Piloto', puesto: '', username: '', trabajador: { nombre: 'Trabajador', funcion: 'Base', seccion: '' } };
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
      'historiador': { screen: 'historiador' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }
}

customElements.define('hornero-gremial', HorneroGremial);
