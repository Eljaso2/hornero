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
    this._chatSection = 'reporte';
    this.messages = [];
    this._typing = false;
    this._greetingRequested = false;
    this._historyLoaded = false;
    this._sessionId = '';
    this._informeBadge = false;
    this._activePersona = 'relator'; // Gremial always uses relator persona
    this._username = ''; // login username for per-user data isolation
    this._viewingInforme = null; // Full-screen informe viewer overlay state
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
        background: var(--ho-bg, #F4F3EE); position: relative; }
      .chat-container { display: flex; flex-direction: column; height: 100%; }

      /* === Full-screen informe viewer overlay === */
      .inform-view-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: var(--ho-bg, #F4F3EE); z-index: 100; display: flex;
        flex-direction: column; animation: fadeIn .25s ease; }
      .inform-view-header { padding: 14px 16px; display: flex; align-items: center;
        gap: 10px; flex: none; background: var(--ho-green-dark, #3D6B56); }
      .inform-view-header-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .92rem; color: var(--ho-text-off, #F2F1EC); flex: 1;
        letter-spacing: .04em; text-transform: uppercase; }
      .inform-view-header-estado { font-family: 'JetBrains Mono', monospace;
        font-size: .68rem; padding: 3px 10px; border-radius: 8px; font-weight: 700; }
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
        font-size: .85rem; color: var(--ho-text, #2B2A26); line-height: 1.6; }
      .inform-view-section-divider { height: 1px; background: rgba(43,42,38,.10);
        margin: 16px 0; }
      .inform-view-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px;
        padding-top: 12px; border-top: 1px solid var(--ho-green-pale, #E0F0EB); }
      .inform-view-tag { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        background: #EDEAE3; color: var(--ho-text, #2B2A26);
        padding: 4px 10px; border-radius: 8px; font-weight: 600; }
      .inform-view-actions { padding: 12px 16px; display: flex; gap: 8px;
        justify-content: flex-end; flex: none;
        border-top: 1px solid var(--ho-border, rgba(43,42,38,.12));
        background: var(--ho-card, #FBFAF6); }
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

    // Sections — all expanded, no collapse
    const sectionsHtml = (inf.sections || []).map((s, i) => {
      let content = '';
      if (s.title) content += `<div class="inform-view-section-title">${s.title}</div>`;
      else if (i > 0) content += `<div class="inform-view-section-title">Detalle</div>`;
      if (s.body) content += `<div class="inform-view-section-body">${this._formatMarkdown(s.body)}</div>`;
      const divider = (i < (inf.sections || []).length - 1) ?
        '<div class="inform-view-section-divider"></div>' : '';
      return `<div class="inform-view-section">${content}</div>${divider}`;
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
      // Do NOT call chatEl.render() here — the chat re-renders itself
      // when its attributes change (from gremial render) or from drawer open/close.
      // Double render was causing the blank screen bug.
    }
  }

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

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
          requested_persona: 'relator',
          days_since_last_chat: daysSinceLastChat,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['reporte', 'greeting'],
        persona: 'relator', // Force: gremial screen ALWAYS uses relator — never swap actors mid-chat
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
    // Detect export keywords — download current chat or last reporte as document
    // Only match explicit export requests, not incidental words in normal conversation
    const lower = text.toLowerCase().trim();
    const isExportRequest = lower.match(/^(exportar|descargar|guardar documento|download|export)\b/) ||
      lower.match(/\b(exportar chat|exportar informe|descargar chat|descargar informe|exportar conversación|descargar conversación)\b/);
    if (isExportRequest) {
      this._exportCurrentChat();
      return;
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

    this._callBackend(text).catch(() => {
      this.messages = [...this.messages, this._localResponse(text)];
      this._typing = false;
      this.render();
    });
  }

  async _callBackend(text) {
    const history = this.messages.slice(-7, -1).map(m => ({
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
        requested_persona: 'relator',
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['reporte'],
      persona: 'relator', // Force: gremial screen ALWAYS uses relator — never swap actors mid-chat
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

        // No extra confirmation messages — the card itself changes visual state
        // The reporte card gets estado-aceptado class which hides approve/correct buttons
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
        persona: 'relator',
        time: this._timeNow(),
        informe_id: informeId,  // link back to the saved informe
      };

      this.messages = [...this.messages, reportMsg, {
        role: 'hornero',
        text: '¿Qué querés corregir? Decime qué cambiar y lo ajusto.',
        tags: ['reporte', 'correccion-pendiente'],
        persona: 'relator',
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
    const history = this.messages.slice(-7, -1).map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const formData = new FormData();
    formData.append('audio', audioBlob, fileName || 'recording.webm');
    formData.append('formato', 'reporte');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', 'relator');
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
      persona: 'relator', // Force: gremial screen ALWAYS uses relator — never swap actors mid-chat
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    this._activePersona = data.persona || 'relator';
    this._typing = false;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) chatEl.resetAudioState();
    this._saveChatHistory();
    this.render();
  }

  _localResponse(userText) {
    // Relator investigates — asks follow-up questions, does NOT produce informe yet
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
      'companero': { screen: 'consulta', persona: 'companero' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'relator': { screen: 'gremial' },
      'historiador': { screen: 'historiador' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }
}

customElements.define('hornero-gremial', HorneroGremial);
