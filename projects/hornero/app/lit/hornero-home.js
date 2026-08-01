// ===== <hornero-home> — Pantalla inicio (v3 dynamic) =====
// Esfera 1: Actualidad — latest content (clipping carousel OR infomate summary)
// Esfera 2: Consulta — 3 íconos inline
// Esferas 3-6: cards con marco invisible (padding + same bg)

import { HoComponent, html, css } from './ho-component.js';

class HorneroHome extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      carouselIndex: Number,
      theme: String,
    };
  }

  // Static cache — survives component destroy/recreate cycles
  static _cache = {
    clipping: [],
    clipNumero: 0,
    clipFecha: null,
    mateData: null,
    mateMes: '',
    mateFecha: null,
    latestType: 'clipping',
    agenda: [],
    loaded: false,
  };

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.carouselIndex = 0;
    this.theme = localStorage.getItem('hornero-theme') || 'dark';
    this._clipping = [];
    this._agenda = [];
    this._latestType = 'clipping';  // 'clipping' or 'infomate'
    this._clipNumero = 0;
    this._mateData = null;
    this._mateMes = '';

    this.accessMap = {
      actualidad: 'open',
      consulta: 'open',
      formacion: 'open',
      is: 'grade',
      condicion: 'open',
      archivo: 'open',
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    // Apply theme class
    if (this.theme === 'light') {
      this.classList.add('theme-light');
    } else {
      this.classList.remove('theme-light');
    }
    // If we have cached data, render immediately for instant display
    const c = HorneroHome._cache;
    if (c.loaded) {
      this._clipping = c.clipping;
      this._clipNumero = c.clipNumero;
      this._mateData = c.mateData;
      this._mateMes = c.mateMes;
      this._latestType = c.latestType;
      this._agenda = c.agenda;
      this.render();
    }
    // Always fetch fresh data in background
    await this._loadData();
  }

  async _loadData() {
    // Determine which content type is newest
    let clipFecha = null;
    let mateFecha = null;

    // Clipping — load latest edition from index
    try {
      const idxRes = await fetch('data/clipping-index.json');
      const idx = await idxRes.json();
      const latest = (idx.ediciones && idx.ediciones[0])
        ? idx.ediciones[0].archivo
        : 'data/clipping-2026-07-02.json';
      this._clipNumero = (idx.ediciones && idx.ediciones[0])
        ? idx.ediciones[0].numero : 4;
      clipFecha = (idx.ediciones && idx.ediciones[0])
        ? idx.ediciones[0].fecha : '2026-07-02';
      const clipRes = await fetch(latest);
      const clipData = await clipRes.json();
      this._clipping = clipData.noticias || [];
    } catch(e) { console.warn('Home: clipping load failed', e); }

    // InfoMate — load latest edition from index
    try {
      const mateIdxRes = await fetch('data/mate-index.json');
      const mateIdx = await mateIdxRes.json();
      const latestMate = (mateIdx.ediciones && mateIdx.ediciones[0]);
      if (latestMate) {
        mateFecha = latestMate.fecha;
        this._mateMes = latestMate.mes;
        const mateRes = await fetch(latestMate.archivo);
        this._mateData = await mateRes.json();
      }
    } catch(e) { console.warn('Home: mate load failed', e); }

    // Compare dates: whichever is newest gets shown in Esfera 1
    if (mateFecha && (!clipFecha || mateFecha > clipFecha)) {
      this._latestType = 'infomate';
    } else {
      this._latestType = 'clipping';
    }

    // Agenda
    try {
      const agendaRes = await fetch('data/agenda-2026-07.json');
      const agendaData = await agendaRes.json();
      this._agenda = agendaData.eventos || [];
    } catch(e) { console.warn('Home: agenda load failed', e); }

    // Update static cache so next navigation renders instantly
    const c = HorneroHome._cache;
    c.clipping = this._clipping;
    c.clipNumero = this._clipNumero;
    c.clipFecha = clipFecha;
    c.mateData = this._mateData;
    c.mateMes = this._mateMes;
    c.mateFecha = mateFecha;
    c.latestType = this._latestType;
    c.agenda = this._agenda;
    c.loaded = true;

    this.render();
  }

  _hasAccess(screenId) {
    const access = this.accessMap[screenId] || 'open';
    if (access === 'open') return true;
    if (access === 'grade') return this.grade !== 'A';
    if (access === 'auth') return false;
    return true;
  }

  _formatMes(mesStr) {
    if (!mesStr) return '';
    const parts = mesStr.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return months[parseInt(parts[1]) - 1] + ' ' + parts[0];
  }

  _styles() {
    return css`
      /* ===== Home container — no top padding → photo fuses with header ===== */
      :host { display: block; padding: 0 16px 16px; background: var(--ho-bg, #1E2321); }

      /* ===== Section name — kicker style, dark on light bg ===== */
      .esfera-name { font-family: 'Archivo', sans-serif; font-size: .92rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); margin-bottom: 10px; }

      /* ===== Section badge — overlay on carousel photo, right corner ===== */
      .section-badge { position: absolute; top: 10px; right: 12px; z-index: 3;
        font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: rgba(242,241,236,.85); background: rgba(33,31,29,.35);
        padding: 2px 8px; border-radius: 6px; }

      /* ===== Invisible card — same bg as page, padding, no visible border ===== */
      .ghost-card { background: var(--ho-card, #2A3230);
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        border: 1px solid rgba(43,42,38,.06); }

      /* ===== ESFERA 1: Actualidad ===== */
      .esfera-actualidad { margin-bottom: 20px; }

      /* --- News carousel --- */
      .carousel-wrap { position: relative; margin-bottom: 16px;
        margin-left: -16px; margin-right: -16px; overflow: hidden;
        min-height: 260px; }
      /* Whisper of dark — almost imperceptible fusion with header closure */
      .carousel-wrap::before { content: ''; position: absolute;
        top: 0; left: 0; right: 0; height: 8px;
        background: linear-gradient(to bottom, rgba(51,49,45,.06), transparent);
        z-index: 2; }
      .carousel-track { display: flex; overflow-x: auto;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; }
      .carousel-track::-webkit-scrollbar { width: 0; }
      .news-slide { scroll-snap-align: start; width: 100%; flex-shrink: 0;
        position: relative; min-height: 260px;
        background: var(--ho-dark, #1E2321); }
      .news-slide img { width: 100%; height: 260px; object-fit: cover;
        display: block; }
      .news-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.85));
        color: #F2F1EC; }
      .news-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.06rem; line-height: 1.2; letter-spacing: .02em; text-transform: uppercase; }
      .news-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .news-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: rgba(78,153,120,.6); color: var(--ho-text-off, #F2F1EC);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .carousel-dots { display: flex; justify-content: center; gap: 5px;
        padding: 8px 0; }
      .dot { width: 6px; height: 6px; border-radius: 50%;
        background: #9C988D; transition: background .2s; }
      .dot.active { background: var(--ho-green, #4E9978); }

      /* --- Loading skeleton for carousel --- */
      .carousel-skeleton { position: relative; min-height: 260px;
        background: var(--ho-dark, #1E2321); margin-left: -16px; margin-right: -16px;
        margin-bottom: 16px; overflow: hidden; }
      .carousel-skeleton-inner { position: absolute; inset: 0;
        display: flex; flex-direction: column; justify-content: flex-end;
        padding: 14px; }
      .skeleton-line { height: 14px; border-radius: 4px;
        background: rgba(255,255,255,.06); margin-bottom: 8px; }
      .skeleton-line.w60 { width: 60%; }
      .skeleton-line.w40 { width: 40%; }
      .skeleton-line.w80 { width: 80%; }
      .skeleton-badge { position: absolute; top: 10px; right: 12px;
        font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: rgba(242,241,236,.85); background: rgba(33,31,29,.35);
        padding: 2px 8px; border-radius: 6px; }
      .skeleton-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
      @keyframes skeleton-pulse { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }

      /* --- InfoMate home card --- */
      .infomate-home { position: relative; margin-bottom: 16px;
        margin-left: -16px; margin-right: -16px; min-height: 260px;
        background: var(--ho-dark, #1E2321); cursor: pointer; overflow: hidden; }
      .infomate-home-bg { position: absolute; inset: 0;
        background: linear-gradient(135deg, #1E2321 0%, #2A3230 40%, #1E2321 100%); }
      .infomate-home-content { position: relative; z-index: 2;
        padding: 28px 16px 16px; }
      .infomate-kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        color: var(--ho-green-dark, #3D6B56); background: var(--ho-green-pale, #E0F0EB);
        border-radius: 6px; padding: 6px 10px; display: inline-block;
        margin-bottom: 14px; }
      .infomate-macro-row { display: flex; flex-wrap: wrap; gap: 6px;
        margin-bottom: 12px; }
      .infomate-macro-chip { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .infomate-sections { display: flex; flex-direction: column; gap: 6px; }
      .infomate-section-line { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4; }
      .infomate-section-line strong { color: var(--ho-text, #E8E6E0); font-weight: 600; }

      /* --- Agenda cloud --- */
      .agenda-wrap { margin-top: 4px; }
      .agenda-cloud { display: flex; flex-wrap: wrap; justify-content: center;
        align-items: center; gap: 3px 4px; }
      .agenda-bubble { font-family: 'Archivo', sans-serif; font-weight: 600;
        padding: 5px 12px; border-radius: 20px; cursor: pointer;
        transition: transform .2s; white-space: nowrap; }
      .agenda-bubble:hover { transform: scale(1.05); }
      .agenda-label { font-family: 'JetBrains Mono', monospace;
        font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
        margin-right: 2px; }
      .agenda-hoy { background: #C0392B; color: #FFF; font-size: .92rem;
        padding: 7px 14px; }
      .agenda-hoy .agenda-label { font-size: .58rem; color: #FFD5D5; }
      .agenda-manana { background: #4E9978; color: #F2F1EC; font-size: .86rem;
        padding: 6px 13px; }
      .agenda-manana .agenda-label { font-size: .54rem; color: #C8D9A4; }
      .agenda-prox { background: #7FB5D5; color: #FFF; font-size: .70rem;
        padding: 3px 8px; border-radius: 16px; line-height: 1.2; }
      .agenda-prox .agenda-label { font-size: .48rem; color: #D4E8F2; }
      .agenda-date { font-family: 'JetBrains Mono', monospace;
        opacity: .7; margin-left: 2px; }
      .agenda-hoy .agenda-date, .agenda-manana .agenda-date { font-size: .54rem; }
      .agenda-prox .agenda-date { font-size: .46rem; }

      /* ===== ESFERA 2: Chat — 5 personajes, tira scrolleable ===== */
      .esfera-consulta { margin-bottom: 20px; }
      .consulta-scroll-wrap { position: relative; margin: 0 -16px; }
      .consulta-scroll-wrap::before,
      .consulta-scroll-wrap::after { content: ''; position: absolute;
        top: 0; bottom: 0; width: 24px; z-index: 2; pointer-events: none; }
      .consulta-scroll-wrap::before { left: 0;
        background: linear-gradient(to right, var(--ho-bg, #1E2321), transparent); }
      .consulta-scroll-wrap::after { right: 0;
        background: linear-gradient(to left, var(--ho-bg, #1E2321), transparent); }
      .consulta-icons { display: flex; overflow-x: auto;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; gap: 0; padding: 4px 20px; }
      .consulta-icons::-webkit-scrollbar { width: 0; }
      .icon-btn { display: flex; flex-direction: column; align-items: center;
        gap: 8px; background: none; border: none; cursor: pointer;
        padding: 10px 14px; font-family: 'Archivo', sans-serif;
        transition: opacity .2s; position: relative;
        flex-shrink: 0; scroll-snap-align: center; min-width: 80px; }
      .icon-btn:hover { opacity: .8; }
      .persona-home-img { width: 64px; height: 64px; border-radius: 0;
        object-fit: contain; object-position: center;
        filter: var(--ho-persona-filter, none); }
      .persona-home-img.periodista-full { object-fit: contain; }
      .icon-btn .icon-label { font-size: .72rem; font-weight: 600;
        color: var(--ho-text, #E8E6E0); white-space: nowrap; }

      /* ===== ESFERA 3: Panorama — hero card ===== */
      .panorama-card { position: relative; border-radius: 13px; margin-bottom: 10px;
        overflow: hidden; cursor: pointer; min-height: 140px; }
      .panorama-card img.hero { width: 100%; height: 180px; object-fit: cover;
        display: block; opacity: .55; }
      .panorama-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.92));
        color: #F2F1EC; }
      .panorama-overlay .card-name { font-family: 'Archivo', sans-serif;
        font-weight: 800; font-size: 1.12rem; letter-spacing: .02em;
        text-transform: uppercase; color: #D8D6D0; }
      .panorama-overlay .card-desc { font-size: .78rem; color: rgba(242,241,236,.85);
        line-height: 1.4; margin-top: 3px; }
      .panorama-overlay .card-tag { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; background: rgba(78,153,120,.6); color: var(--ho-text-off, #F2F1EC);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 5px; }

      /* ===== ESFERA 4: Formación — hero card ===== */
      .formacion-card { position: relative; border-radius: 13px; margin-bottom: 10px;
        overflow: hidden; cursor: pointer; min-height: 140px; }
      .formacion-card img.hero { width: 100%; height: 180px; object-fit: cover;
        display: block; opacity: .55; }
      .formacion-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.92));
        color: #F2F1EC; }
      .formacion-overlay .card-name { font-family: 'Archivo', sans-serif;
        font-weight: 800; font-size: 1.12rem; letter-spacing: .02em;
        text-transform: uppercase; color: #D8D6D0; }
      .formacion-overlay .card-desc { font-size: .78rem; color: rgba(242,241,236,.85);
        line-height: 1.4; margin-top: 3px; }
      .formacion-overlay .card-tag { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; background: rgba(78,153,120,.6); color: var(--ho-text-off, #F2F1EC);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 5px; }
      .formacion-badge { display: none; }

      .card-historiador-badge { display: none; }

      /* ===== ESFERA 5: Archivo — hero card ===== */
      .archivo-card { position: relative; border-radius: 13px; margin-bottom: 10px;
        overflow: hidden; cursor: pointer; min-height: 140px; }
      .archivo-card img.hero { width: 100%; height: 180px; object-fit: cover;
        display: block; opacity: .55; }
      .archivo-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.92));
        color: #F2F1EC; }
      .archivo-overlay .card-name { font-family: 'Archivo', sans-serif;
        font-weight: 800; font-size: 1.12rem; letter-spacing: .02em;
        text-transform: uppercase; color: #D8D6D0; }
      .archivo-overlay .card-desc { font-size: .78rem; color: rgba(242,241,236,.85);
        line-height: 1.4; margin-top: 3px; }
      .archivo-overlay .card-tag { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; background: rgba(78,153,120,.6); color: var(--ho-text-off, #F2F1EC);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 5px; }

      /* ===== Light mode: hero card titles = verde casi negro ===== */
      :host(.theme-light) .panorama-overlay .card-name { color: #2D4F3F; }
      :host(.theme-light) .formacion-overlay .card-name { color: #2D4F3F; }
      :host(.theme-light) .archivo-overlay .card-name { color: #2D4F3F; }

      .esfera-card { background: var(--ho-card, #2A3230);
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        border: 1px solid rgba(43,42,38,.06); cursor: pointer;
        transition: border-color .2s; position: relative; }
      .esfera-card:hover { border-color: rgba(43,42,38,.18); }
      .esfera-card.locked { cursor: default; }
      .esfera-card .card-name { font-family: 'Archivo', sans-serif;
        font-weight: 700; font-size: .92rem; color: var(--ho-text, #E8E6E0); }
      .esfera-card .card-desc { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 4px; }
      .esfera-card .card-tag { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 6px; }
      .esfera-card .lock-icon { position: absolute; top: 10px; right: 12px;
        width: 16px; height: 16px; }
      .esfera-card .lock-icon svg { width: 14px; height: 14px; stroke: #9C988D;
        stroke-width: 2; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
    `;
  }

  _render() {
    const lockSvg = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 0 0110 0v4"/></svg>';

    // --- Esfera 1: Actualidad — dynamic content ---
    let esfera1Content = '';

    // Show skeleton placeholder while data loads (no clipping data yet)
    const dataLoaded = this._clipping.length > 0 || (this._latestType === 'infomate' && this._mateData);

    if (!dataLoaded) {
      esfera1Content = '<div class="carousel-skeleton">' +
          '<span class="skeleton-badge">Actualidad</span>' +
          '<div class="carousel-skeleton-inner skeleton-pulse">' +
            '<div class="skeleton-line w60"></div>' +
            '<div class="skeleton-line w40"></div>' +
          '</div>' +
        '</div>';
    } else if (this._latestType === 'infomate' && this._mateData) {
      // InfoMate is newest → show InfoMate summary card
      const meta = this._mateData.meta || {};
      const macro = this._mateData.datosMacro || {};
      const secciones = this._mateData.secciones || [];

      // Macro chips: show first 4 key indicators
      const macroKeys = Object.keys(macro).slice(0, 4);
      const macroChips = macroKeys.map(k => {
        const labels = {
          inflacionOficial: 'Inflación', inflacionAcumulada: 'Acumulado', inflacionObrera: 'Inflación obrera',
          smvm: 'SMVM', canastaBasicaTotal: 'Canasta', empleoTotal: 'Empleo',
          salarioMedioRegistrado: 'Salario', salarioEstatal: 'Estatal', salarioPrivado: 'Privado',
          transferenciaIngresos: 'Transferencia', empleosFormalesPerdidos: 'Despidos',
          desocupadosUrbanos: 'Desocupación', informalidad: 'Informalidad', recortesAcumulados: 'Recortes',
        };
        return '<span class="infomate-macro-chip">' + (labels[k] || k) + ': ' + macro[k] + '</span>';
      }).join('');

      // Section titles (first 3)
      const sectionLines = secciones.slice(0, 3).map(s =>
        '<div class="infomate-section-line"><strong>' + s.titulo + '</strong> — ' + (s.bajada || '').substring(0, 60) + '…</div>'
      ).join('');

      esfera1Content = '<div class="infomate-home" id="infomateHome">' +
        '<div class="infomate-home-bg"></div>' +
        '<div class="section-badge">Actualidad</div>' +
        '<div class="infomate-home-content">' +
          '<div class="infomate-kicker">🧮 INFOMATE · ' + this._formatMes(meta.mes) + '</div>' +
          '<div class="infomate-macro-row">' + macroChips + '</div>' +
          '<div class="infomate-sections">' + sectionLines + '</div>' +
        '</div>' +
      '</div>';
    } else {
      // Clipping is newest → show carousel as before
      const newsSlides = this._clipping.map((n, i) =>
        '<div class="news-slide" data-index="' + i + '" data-clip-id="' + (n.id || '') + '">' +
          (n.foto ? '<img src="' + n.foto + '" alt="" loading="' + (i === 0 ? 'eager' : 'lazy') + '">' : '') +
          '<div class="news-overlay">' +
            '<div class="news-title">' + (n.emoji || '') + ' ' + (n.titulo || '') + '</div>' +
            '<div class="news-tags">' +
              (n.tags || []).map(t => '<span class="news-tag">' + t + '</span>').join('') +
            '</div>' +
          '</div>' +
        '</div>'
      ).join('');

      const dots = this._clipping.map((_, i) =>
        '<span class="dot' + (i === this.carouselIndex ? ' active' : '') + '" data-index="' + i + '"></span>'
      ).join('');

      esfera1Content = '<div class="carousel-wrap">' +
          '<div class="section-badge">Actualidad</div>' +
          '<div class="carousel-track" id="carouselTrack">' + newsSlides + '</div>' +
        '</div>' +
        '<div class="carousel-dots" id="carouselDots">' + dots + '</div>';
    }

    // --- Agenda cloud ---
    const today = new Date(); today.setHours(0,0,0,0);
    const sorted = this._agenda.map(ev => {
      const evDate = new Date(ev.fecha + 'T00:00:00');
      const diffDays = Math.round((evDate - today) / 86400000);
      let cls, label;
      if (diffDays <= 0) { cls = 'agenda-hoy'; label = 'HOY'; }
      else if (diffDays === 1) { cls = 'agenda-manana'; label = 'MAÑANA'; }
      else { cls = 'agenda-prox'; label = 'PRÓX'; }
      const dayNum = evDate.getDate();
      const monthNum = evDate.getMonth() + 1;
      const dateStr = dayNum + '/' + monthNum;
      return { ...ev, cls, label, dateStr, diffDays };
    }).sort((a, b) => a.diffDays - b.diffDays);

    const hoy = sorted.filter(e => e.cls === 'agenda-hoy');
    const manana = sorted.filter(e => e.cls === 'agenda-manana');
    const prox = sorted.filter(e => e.cls === 'agenda-prox');
    const proxLeft = prox.slice(0, Math.ceil(prox.length / 2));
    const proxRight = prox.slice(Math.ceil(prox.length / 2));
    const cloudOrder = [...proxLeft, ...manana, ...hoy, ...manana.length ? [] : [], ...proxRight];

    const agendaBubbles = cloudOrder.map(ev =>
      '<span class="agenda-bubble ' + ev.cls + '">' +
        '<span class="agenda-label">' + ev.label + '</span> ' +
        ev.nombre + '<span class="agenda-date">' + ev.dateStr + '</span></span>'
    ).join('');

    // --- Esfera 4 access ---
    const isLocked = this.accessMap['is'] !== 'open' && !this._hasAccess('is');

    return html`
      <!-- ESFERA 1: Actualidad — dynamic: latest clipping or infomate -->
      <div class="esfera-actualidad">
        ${esfera1Content}
        <div class="agenda-wrap">
          <div class="agenda-cloud">
            ${agendaBubbles}
          </div>
        </div>
      </div>

      <!-- ESFERA 2: Chat IA — 5 personajes, tira scrolleable -->
      <div class="esfera-consulta">
        <div class="esfera-name">Chat</div>
        <div class="consulta-scroll-wrap">
          <div class="consulta-icons">
            <button class="icon-btn" data-screen="gremial" data-persona="companero">
              <img src="assets/personajes/a02.png" alt="Compañero/a" class="persona-home-img">
              <span class="icon-label">Compañero/a</span>
            </button>
            <button class="icon-btn" data-screen="consulta" data-persona="abogado">
              <img src="assets/personajes/a03.png" alt="Abogado/a" class="persona-home-img">
              <span class="icon-label">Abogado/a</span>
            </button>
            <button class="icon-btn" data-screen="contenido" data-persona="periodista">
              <img src="assets/personajes/a04.png" alt="Periodista" class="persona-home-img periodista-full">
              <span class="icon-label">Periodista</span>
            </button>
            <button class="icon-btn" data-screen="historiador" data-persona="historiador">
              <img src="assets/personajes/a01.png" alt="Historiadora" class="persona-home-img">
              <span class="icon-label">Historiadora</span>
            </button>
            <button class="icon-btn" data-screen="condicion" data-persona="sociologo">
              <img src="assets/personajes/a05.png" alt="Investigador/a" class="persona-home-img">
              <span class="icon-label">Investigador/a</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ESFERA 3: Panorama — hero card -->
      <div class="panorama-card" data-screen="condicion" data-persona="sociologo">
        <img src="assets/panorama-bg.png" alt="Panorama" class="hero">
        <div class="panorama-overlay">
          <div class="card-name">Panorama</div>
          <div class="card-desc">CE · IFT · Cómo Somos · SMVM</div>
          <span class="card-tag">índices · diagnóstico · clase trabajadora</span>
        </div>
      </div>

      <!-- ESFERA 4: Historia Obrera — hero card -->
      <div class="formacion-card" data-screen="formacion">
        <img src="assets/personajes/ho.jpg" alt="Historia Obrera" class="hero">
        <div class="formacion-overlay">
          <div class="card-name">Historia Obrera</div>
          <div class="card-desc">Formación, cursos, efemérides, libros, mitín</div>
          <span class="card-tag">historia obrera · formación · archivos</span>
        </div>
      </div>

      <!-- ESFERA 5: Archivo — hero card -->
      <div class="archivo-card" data-screen="archivo">
        <img src="assets/archivo-bg.jpg" alt="Archivo" class="hero">
        <div class="archivo-overlay">
          <div class="card-name">Archivo</div>
          <div class="card-desc">Convenios, referentes, fuentes sindicales — la memoria del sindicato</div>
          <span class="card-tag">documentos · académicos · multimedia</span>
        </div>
      </div>
    `;
  }

  _afterRender() {
    // InfoMate home card → navigate to infomate sub-screen
    const infomateHome = this.shadowRoot.querySelector('#infomateHome');
    if (infomateHome) {
      infomateHome.addEventListener('click', () => {
        this.emit('screen-change', { screen: 'infomate', mateMes: this._mateMes });
      });
    }

    // Carousel slides — click → go directly to clipping sub-screen
    this.shadowRoot.querySelectorAll('.news-slide').forEach(slide => {
      slide.addEventListener('click', () => {
        const clipId = slide.dataset.clipId;
        if (typeof state !== 'undefined') {
          state.screen = 'clipping';
          state.clipExpandId = clipId;
        }
        this.emit('screen-change', { screen: 'clipping', clipEdicion: this._clipNumero, clipExpandId: clipId });
      });
    });

    // Carousel scroll → update dots
    const track = this.shadowRoot.querySelector('#carouselTrack');
    const dots = this.shadowRoot.querySelector('#carouselDots');

    if (track) {
      track.addEventListener('scroll', () => {
        const idx = Math.round(track.scrollLeft / track.offsetWidth);
        if (idx !== this.carouselIndex && idx >= 0) {
          this.carouselIndex = idx;
          if (dots) {
            dots.querySelectorAll('.dot').forEach((d, i) => {
              d.classList.toggle('active', i === idx);
            });
          }
        }
      });
    }

    // Click on dot → scroll to slide
    if (dots) {
      dots.querySelectorAll('.dot').forEach(d => {
        d.addEventListener('click', () => {
          const idx = parseInt(d.dataset.index);
          if (track) track.scrollTo({ left: idx * track.offsetWidth, behavior: 'smooth' });
        });
      });
    }

    // Esfera cards + hero cards — navigation
    this.shadowRoot.querySelectorAll('.esfera-card, .formacion-card, .panorama-card, .archivo-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('locked')) return;
        this.goScreen(card.dataset.screen);
      });
    });

    // Consulta icons — navigation
    this.shadowRoot.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const detail = { screen: btn.dataset.screen };
        if (btn.dataset.persona) detail.persona = btn.dataset.persona;
        this.emit('screen-change', detail);
      });
    });
  }
}

customElements.define('hornero-home', HorneroHome);
