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
      _bannerVisible: Boolean,
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
    this._originalSectionsBeforeCorrection = null; // Sections snapshot before superior correction
    this._correctingInformeId = null; // ID of informe being corrected by superior
    this._progressiveRevealFull = ''; // Full text to reveal progressively
    this._progressiveRevealIndex = 0; // Current reveal position
    this._savedDrawerState = null; // Drawer state saved before re-render (prevents drawer closing)
    this._bannerVisible = true;
  }

  connectedCallback() {
    super.connectedCallback();
    // Don't generate sessionId yet — _loadChatHistory will restore or create
    // Get username from login session for per-user data isolation
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
        background: var(--ho-bg, #1E2321); position: relative; }
      .chat-container { display: flex; flex-direction: column; height: 100%; }

      /* ===== Hero banner — imagen de fondo opaca ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-dark, #1E2321);
        padding: 20px 16px 14px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 10px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden;
        min-height: 110px; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/IMG-20240506-WA0028.jpg') center/cover no-repeat;
        opacity: .25; pointer-events: none; }
      .hero-banner-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.4rem; color: var(--ho-text, #E8E6E0);
        letter-spacing: .02em; text-transform: uppercase; position: relative; }
      :host(.theme-light) .hero-banner-title { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .hero-banner { background: var(--ho-mid-gray, #ECEAE3); }
      :host(.theme-light) .hero-bajada { color: var(--ho-text-light, #7A766C); }
      .hero-bajada { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        text-align: left; position: relative; min-height: 5.2em; }

      /* === Full-screen informe viewer overlay === */
      .inform-view-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: var(--ho-bg, #1E2321); z-index: 100; display: flex;
        flex-direction: column; animation: fadeIn .25s ease; }
      .inform-view-header { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px;
        flex: none; background: transparent; }
      .inform-view-header-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .92rem; color: var(--ho-text-off, #F2F1EC);
        letter-spacing: .04em; text-transform: uppercase; }
      .inform-view-header-meta { display: flex; align-items: center; gap: 8px; }
      .inform-view-header-user { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-off, #F2F1EC); letter-spacing: .06em;
        background: rgba(255,255,255,.15); padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-view-header-grado { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #D4E4F7; color: #2B5278; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .inform-view-header-estado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
      .inform-view-header-estado.estado-pendiente { background: #F0E4CC; color: #856404; }
      .inform-view-header-estado.estado-aceptado { background: #E0F0EB; color: #3D6B56; }
      .inform-view-header-estado.estado-aprobado { background: #C5D9A0; color: #3D6B1A; }
      .inform-view-header-estado.estado-con-cambios { background: #D4E4F7; color: #2B5278; }
      /* Historial de cambios in viewer */
      .inform-view-historial { margin-top: 16px; padding: 12px;
        background: rgba(255,255,255,.03); border-radius: 8px;
        border-top: 2px dashed rgba(255,255,255,.1); }
      .inform-view-historial-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; color: var(--ho-text-mid, #6E6A60); margin-bottom: 8px; }
      .inform-view-historial-entry { padding: 6px 0;
        border-bottom: 1px solid rgba(255,255,255,.05); }
      .inform-view-historial-entry:last-child { border-bottom: none; }
      .inform-view-historial-grado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; font-weight: 700; margin-bottom: 2px; }
      .inform-view-historial-grado.grado-2 { color: #4E9978; }
      .inform-view-historial-grado.grado-3 { color: #2C5A8A; }
      .inform-view-historial-grado.grado-4 { color: #5A3D7A; }
      .inform-view-historial-resumen { font-family: 'Public Sans', sans-serif;
        font-size: .78rem; color: var(--ho-text-light, #9C988D); line-height: 1.4; }
      .inform-view-historial-secciones { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .inform-view-historial-seccion { font-family: 'JetBrains Mono', monospace;
        font-size: .56rem; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
      .inform-view-historial-seccion.grado-2 { background: #E0F0EB; color: #3D6B56; }
      .inform-view-historial-seccion.grado-3 { background: #D7E8F3; color: #2C5A8A; }
      .inform-view-historial-seccion.grado-4 { background: #E8DCF0; color: #5A3D7A; }
      .inform-view-header-footer { display: flex; align-items: center;
        justify-content: space-between; }
      .inform-view-header-date { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: rgba(255,255,255,.6); }
      .inform-view-header-actions { display: flex; gap: 4px; }
      .inform-view-header-btn { width: 28px; height: 28px; border-radius: 8px;
        background: none; border: 1px solid rgba(255,255,255,.15);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; }
      .inform-view-header-btn svg { width: 14px; height: 14px;
        stroke: rgba(255,255,255,.7); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .inform-view-header-btn:hover { background: rgba(255,255,255,.15);
        border-color: rgba(255,255,255,.3); }
      .inform-view-header-btn:hover svg { stroke: #fff; }
      .inform-view-header-btn:disabled { opacity: .3; pointer-events: none; }
      .inform-view-header-btn[data-inform-view-action="borrar"]:hover { background: #FDECEA;
        border-color: #D32F2F; }
      .inform-view-header-btn[data-inform-view-action="borrar"]:hover svg { stroke: #D32F2F; }
      .inform-view-close-btn { width: auto; padding: 0 6px; font-size: .82rem;
        color: rgba(255,255,255,.7); border: none; background: rgba(255,255,255,.1);
        border-radius: 6px; }
      .inform-view-close-btn:hover { background: rgba(255,255,255,.2); color: #fff; }
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
      .inform-view-section[data-section-type="transcript"] .inform-view-section-body {
        font-size: .84rem; color: var(--ho-text, #E8E6E0); line-height: 1.6;
        border-left: 3px solid var(--ho-green, #4E9978);
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

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
  }

  _render() {
    return html`
      ${this._bannerVisible ? html`
      <div class="hero-banner">
        <div class="hero-banner-title">Reporte Gremial</div>
        <div class="hero-bajada">
          Elaboración de reportes gremiales, relato de situaciones, clasificación, seguimiento y aprobación.
        </div>
      </div>
      ` : ''}

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

      ${this._viewingInforme ? this._renderInformeViewer() : ''}
    `;
  }

  // === Full-screen informe viewer overlay ===
  _renderInformeViewer() {
    const inf = this._viewingInforme;
    const numero = inf.numero || '';
    const estado = inf.estado || 'pendiente';
    const estadoLabelMap = {
      'pendiente': '⏳ Pendiente de revisión',
      'aprobado': '✅ Aprobado sin cambios',
      'aprobado-con-cambios': '📝 Aprobado con cambios',
      'aprobado-delegado': '✅ Aprobado sin cambios',
      'corregido-delegado': '📝 Aprobado con cambios',
      'visto': '⏳ Pendiente de revisión',
      'aceptado': '✅ Aprobado sin cambios',
    };
    const estadoClassMap = {
      'pendiente': 'estado-pendiente',
      'aprobado': 'estado-aprobado',
      'aprobado-con-cambios': 'estado-con-cambios',
      'aprobado-delegado': 'estado-aprobado',
      'corregido-delegado': 'estado-con-cambios',
      'visto': 'estado-pendiente',
      'aceptado': 'estado-aprobado',
    };
    const estadoLabel = estadoLabelMap[estado] || estado;
    const estadoClass = estadoClassMap[estado] || '';
    const isModificado = estado === 'aprobado-con-cambios' || estado === 'corregido-delegado' || estado === 'corregido';
    const titleText = (numero ? 'Reporte Gremial N°' + numero :
      (inf.sections && inf.sections.length > 0 ?
        (inf.sections[0].title || 'Informe Gremial') : 'Informe Gremial')) + (isModificado ? ' (Modificado)' : '');

    // Sections — all expanded, no collapse; section-type-aware styling
    const sectionsHtml = (inf.sections || []).map((s, i) => {
      let content = '';
      // Detect section type for styling based on title
      const sectionTitle = (s.title || '').toLowerCase();
      let sectionType = 'default';
      if (sectionTitle.includes('relato')) sectionType = 'relato';
      else if (sectionTitle.includes('clasificación') || sectionTitle.includes('clasificacion') || sectionTitle.includes('etiqueta')) sectionType = 'clasificacion';
      else if (sectionTitle.includes('transcript')) sectionType = 'transcript';
      else if (sectionTitle.includes('extracto') || sectionTitle.includes('diálogo') || sectionTitle.includes('dialogo')) sectionType = 'extractos';
      else if (sectionTitle.includes('ficha') || sectionTitle.includes('reportante')) sectionType = 'ficha';
      if (s.title) content += `<div class="inform-view-section-title">${s.title}</div>`;
      else if (i > 0) content += `<div class="inform-view-section-title">Detalle</div>`;
      if (s.body) {
        // Clean AI confirmation text from section body (not part of the informe)
        let cleanBody = s.body
          .replace(/\n*---\s*\n.*$/s, '')
          .replace(/\n*¿Es esto lo que querías.*$/s, '')
          .replace(/\n*respuesta-libre\s*$/s, '')
          .replace(/[\s\n]+$/, '');
        let bodyHtml = this._formatMarkdown(cleanBody);
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

    // Action buttons — corregir/reenviar disabled for visto+
    const canEdit = estado === 'pendiente' || estado === 'aceptado';

    return html`
      <div class="inform-view-overlay">
        <div class="inform-view-header">
          <div class="inform-view-header-title">${titleText}</div>
          <div class="inform-view-header-meta">
            ${inf.username ? '<span class="inform-view-header-user">@' + inf.username + '</span>' : ''}
            ${inf.grado ? '<span class="inform-view-header-grado">G' + inf.grado + '</span>' : ''}
            <span class="inform-view-header-estado ${estadoClass}">${estadoLabel}</span>
          </div>
          <div class="inform-view-header-footer">
            <span class="inform-view-header-date">${dateStr}</span>
            <div class="inform-view-header-actions">
              <button class="inform-view-header-btn" data-inform-view-action="descargar" title="Descargar">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              <button class="inform-view-header-btn" data-inform-view-action="reenviar" title="Reenviar"${canEdit ? '' : ' disabled'}>
                <svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
              <button class="inform-view-header-btn" data-inform-view-action="editar" title="Corregir"${canEdit ? '' : ' disabled'}>
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="inform-view-header-btn" data-inform-view-action="borrar" title="Borrar">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
              <button class="inform-view-header-btn inform-view-close-btn" data-inform-view-action="close" title="Cerrar">✕</button>
            </div>
          </div>
        </div>
        <div class="inform-view-scroll">
          ${sectionsHtml}
          ${tagsHtml}
          ${this._renderViewerHistorial(inf._correcciones)}
        </div>
      </div>
    `;
  }

  // Render historial de cambios in viewer overlay
  _renderViewerHistorial(correcciones) {
    if (!correcciones || correcciones.length === 0) return '';
    // Group by grado
    const byGrado = {};
    correcciones.forEach(c => {
      const g = c.correctorGrado || 2;
      if (!byGrado[g]) byGrado[g] = [];
      byGrado[g].push(c);
    });
    const entries = Object.entries(byGrado).sort((a, b) => a[0] - b[0]);
    const entriesHtml = entries.map(([grado, corrs]) => {
      const gradoLabel = 'G' + grado;
      const gradoClass = 'grado-' + grado;
      const secciones = corrs.map(c => `<span class="inform-view-historial-seccion ${gradoClass}">${c.seccionTitle || c.resumen || 'Cambio'}</span>`).join('');
      const resumen = corrs.length === 1 ? corrs[0].resumen : corrs.length + ' cambios realizados';
      return `<div class="inform-view-historial-entry">
        <div class="inform-view-historial-grado ${gradoClass}">${gradoLabel} — ${corrs[0].correctorUsername || ''} — ${corrs[0].fecha || ''}</div>
        <div class="inform-view-historial-resumen">${resumen}</div>
        <div class="inform-view-historial-secciones">${secciones}</div>
      </div>`;
    }).join('');
    return `<div class="inform-view-historial">
      <div class="inform-view-historial-title">📝 Historial de cambios</div>
      ${entriesHtml}
    </div>`;
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
          this.render();
        }
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
        } else if (action === 'reenviar' && infId) {
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
    // Generate sessionId for new chat
    if (!this._sessionId) {
      this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
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
    const chunkSize = 1; // Characters per tick
    const interval = 25; // ms between ticks
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
                const responseText = data.text || streamingText;
                const responseSections = data.sections || [];
                let responseTags = data.tags || ['reporte'];

                // Auto-detect reporte from text if backend didn't return structured sections
                if (responseSections.length === 0 && responseText) {
                  const parsed = this._parseReporteFromText(responseText);
                  if (parsed.isReporte) {
                    responseTags = [...responseTags, 'reporte-generado'];
                    if (!responseTags.includes('reporte')) responseTags.push('reporte');
                    this.messages = [...this.messages, {
                      role: 'hornero',
                      text: responseText,
                      sections: parsed.sections,
                      tags: responseTags,
                      persona: 'companero', // Force: gremial screen ALWAYS uses compañero
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
                }

                this.messages = [...this.messages, {
                  role: 'hornero',
                  text: responseText,
                  sections: responseSections,
                  tags: responseTags,
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

    this.messages = [...this.messages, {
      role: 'hornero',
      text: responseText,
      sections: responseSections,
      tags: responseTags,
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
          // If this was a superior correction, mark as modificado
          if (this._originalSectionsBeforeCorrection !== null || this._correctingInformeId) {
            reportMsg.tags = [...reportMsg.tags, 'correccion-modificado'];
          }
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
            // If this was a superior correction, attach correcciones to the message
            if (result && result._correcciones && result._correcciones.length > 0) {
              reportMsg._correcciones = result._correcciones;
            }
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
        const confirmMsg = {
          role: 'hornero',
          text: '✅ Informe guardado en tu archivo.',
          tags: ['reporte', 'informe-guardado'],
          time: this._timeNow(),
        };
        this.messages = [...this.messages, confirmMsg];
        this._saveChatHistory();
        this.render();

        // Force-refresh the informes drawer if it's open — ensures new informe appears
        const chatEl = this.shadowRoot.querySelector('hornero-chat');
        if (chatEl && chatEl._showInformes) {
          try {
            await chatEl._openInformesDrawer();
          } catch(e) {
            console.warn('Gremial: drawer refresh failed', e);
          }
        }
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

      // Save original sections before correction (for diff later)
      this._originalSectionsBeforeCorrection = JSON.parse(JSON.stringify(informe.sections || []));
      this._correctingInformeId = informeId;

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

  // Superior approves a received informe without changes
  async _handleInformeApprove(informeId) {
    try {
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
      if (chatEl) { chatEl.streamingText = ''; chatEl._streamingPersona = ''; }
      this.messages = [...this.messages, msg];
      this._saveChatHistory();
      this.render();
    });
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
      'historiador': { screen: 'formacion' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }
}

customElements.define('hornero-gremial', HorneroGremial);
