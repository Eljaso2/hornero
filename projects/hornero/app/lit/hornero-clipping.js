// ===== <hornero-clipping> — Clipping de noticias (sub-screen) =====
// Lista de noticias con popup overlay para desarrollo
// Multi-edición: carga índice → última edición, navegación ←→
// Calendario mensual: click en fecha → calendario, días marcados
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroClipping extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      edicion: Number,       // edition number to load
      expandId: String,       // noticia ID to auto-expand on load
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.edicion = null;
    this.expandId = null;
    this._noticias = [];
    this._meta = {};
    this._popupItem = null;
    this._exploreOpen = false;
    this._savedScrollTop = null;
    this._ediciones = [];     // clipping-index.ediciones[]
    this._edicionIdx = 0;     // current index in _ediciones (0 = latest)
    this._calOpen = false;     // calendar popup open
    this._calMonth = null;     // calendar display month (YYYY-MM)
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyThemeClass();
    this._themeHandler = () => { this._applyThemeClass(); this.render(); };
    window.addEventListener('storage', this._themeHandler);
    await this._loadIndex();
  }

  _applyThemeClass() {
    const theme = localStorage.getItem('hornero-theme') || 'dark';
    if (theme === 'light') {
      this.classList.add('theme-light');
    } else {
      this.classList.remove('theme-light');
    }
  }

  // ===== Data loading =====

  async _loadIndex() {
    try {
      const res = await fetch('data/clipping-index.json');
      const idx = await res.json();
      this._ediciones = idx.ediciones || [];

      // If edicion property is set, load that specific edition
      if (this.edicion) {
        const targetIdx = this._ediciones.findIndex(ed => ed.numero === this.edicion);
        if (targetIdx >= 0) {
          this._edicionIdx = targetIdx;
          await this._loadEdition(this._ediciones[targetIdx].archivo);
        } else {
          // Edition not found, fall back to latest
          this._edicionIdx = 0;
          await this._loadEdition(this._ediciones[0].archivo);
        }
      } else {
        this._edicionIdx = 0;
        await this._loadEdition(this._ediciones[0].archivo);
      }
    } catch(e) {
      console.warn('Clipping: index load failed, fallback to hardcoded', e);
      await this._loadEdition('data/clipping-2026-07-02.json');
    }
  }

  async _loadEdition(filePath) {
    try {
      const response = await fetch(filePath);
      const data = await response.json();
      this._meta = data.meta || {};
      this._noticias = data.noticias || [];
      if (typeof guardarClipping === 'function') {
        for (const item of this._noticias) {
          await guardarClipping(item);
        }
      }
      this._calOpen = false;
      this.render();
    } catch(e) { console.warn('Clipping: edition load failed', e); }
  }

  _formatFecha(fecha) {
    if (!fecha) return '';
    const parts = fecha.split('-');
    return parts[2] + '/' + parts[1];
  }

  _formatFechaLong(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return d.getDate() + ' de ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Build a Set of dates that have clipping editions (for calendar marking)
  _clippingDates() {
    const dates = new Set();
    for (const ed of this._ediciones) {
      if (ed.fecha) dates.add(ed.fecha);
    }
    return dates;
  }

  // Find edition index for a given date
  _findEditionIdx(dateStr) {
    for (let i = 0; i < this._ediciones.length; i++) {
      if (this._ediciones[i].fecha === dateStr) return i;
    }
    return -1;
  }

  // ===== Calendar rendering =====

  _renderCalendar() {
    // Determine which month to display
    const currentFecha = this._meta.fecha || '2026-07-02';
    const displayMonth = this._calMonth || currentFecha.substring(0, 7); // YYYY-MM
    const [year, month] = displayMonth.split('-').map(Number);

    const clippingDates = this._clippingDates();
    const monthsShort = ['Jul','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthsFull = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const weekdays = ['L','M','X','J','V','S','D'];

    // First day of month (0=Sun → shift to Mon=0)
    const firstDay = new Date(year, month - 1, 1).getDay();
    const startOffset = (firstDay === 0) ? 6 : firstDay - 1; // Monday start
    const daysInMonth = new Date(year, month, 0).getDate();

    // Previous/next month for navigation
    const prevMonth = month === 1 ? (year - 1) + '-12' : year + '-' + String(month - 1).padStart(2, '0');
    const nextMonth = month === 12 ? (year + 1) + '-01' : year + '-' + String(month + 1).padStart(2, '0');

    // Build day grid
    let dayCells = '';
    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      dayCells += '<div class="cal-day cal-empty"></div>';
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const hasClipping = clippingDates.has(dateStr);
      const isCurrent = dateStr === currentFecha;
      const cls = 'cal-day' + (hasClipping ? ' cal-marked' : '') + (isCurrent ? ' cal-current' : '');
      dayCells += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + '</div>';
    }

    return '<div class="cal-overlay" id="calOverlay">' +
      '<div class="cal-panel">' +
        '<div class="cal-header">' +
          '<button class="cal-nav-btn" id="calPrev" data-month="' + prevMonth + '">←</button>' +
          '<div class="cal-month-label">' + monthsFull[month - 1] + ' ' + year + '</div>' +
          '<button class="cal-nav-btn" id="calNext" data-month="' + nextMonth + '">→</button>' +
        '</div>' +
        '<div class="cal-weekdays">' + weekdays.map(w => '<div class="cal-weekday">' + w + '</div>').join('') + '</div>' +
        '<div class="cal-grid">' + dayCells + '</div>' +
        '<div class="cal-legend">' +
          '<span class="cal-legend-marked">●</span> hay clipping' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 0; scrollbar-width: none; background: #2A3230; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* ===== Cintillo — navegación (mismo patrón que Actualidad) ===== */
      .act-cintillo { display: flex; align-items: center;
        padding: 8px 16px; border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08));
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
      .cintillo-center { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .cintillo-spacer { flex: 1; }
      .cintillo-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.06rem; color: var(--ho-green-dark, #3D6B56);
        letter-spacing: .04em; text-align: center; }
      .cintillo-date { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .08em; margin-top: 2px; }
      .cintillo-nav-btn { background: none; border: none; cursor: pointer;
        color: var(--ho-text-mid, #6E6A60); padding: 6px;
        transition: color .2s, opacity .2s; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0; }
      .cintillo-nav-btn:hover { color: var(--ho-text, #E8E6E0); }
      .cintillo-nav-btn:disabled { opacity: .2; cursor: default; }
      .cintillo-nav-btn svg { width: 20px; height: 20px; }

      /* ===== Collapsed Actualidad banner ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-bg, #1E2321);
        padding: 10px 16px 8px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 6px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden; cursor: pointer; }
      .hero-banner::before { content: ''; position: absolute; top: 0; left: 0;
        width: 100%; height: 100%;
        background: url('assets/actualidad-bg.png') top center/100% auto no-repeat;
        opacity: .12; pointer-events: none; }
      .hero-banner-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.2rem; color: var(--ho-text, #E8E6E0);
        letter-spacing: .02em; text-transform: uppercase; position: relative; }
      .hero-explore-link { display: inline-flex; align-items: center; gap: 4px;
        font-family: 'Archivo', sans-serif; font-size: .64rem;
        font-weight: 700; letter-spacing: .04em;
        color: var(--ho-text, #E8E6E0); background: none;
        border: none; padding: 0; cursor: pointer; position: relative; }
      :host(.theme-light) .hero-explore-link { color: #000; }
      :host(.theme-light) .scroll { background: #D5D0C8; }
      :host(.theme-light) .feed-card { background: #FFFFFF; }
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

      /* ===== Calendar overlay ===== */
      .cal-overlay { position: fixed; inset: 0;
        background: rgba(33,31,29,.55); z-index: 40;
        display: flex; align-items: center; justify-content: center;
        animation: popfade .2s ease; }

      .cal-panel { background: var(--ho-card, #2A3230); border-radius: 13px;
        padding: 16px 14px 12px; width: 320px;
        box-shadow: 0 8px 24px rgba(33,31,29,.2); }

      .cal-header { display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 10px; }
      .cal-nav-btn { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        border: none; border-radius: 4px; width: 28px; height: 28px;
        cursor: pointer; font-size: .9rem; font-weight: 700;
        display: flex; align-items: center; justify-content: center; }
      .cal-nav-btn:hover { background: var(--ho-green, #4E9978); color: #F2F1EC; }
      .cal-month-label { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); }

      .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr);
        gap: 2px; margin-bottom: 4px; }
      .cal-weekday { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        color: var(--ho-text-light, #9C988D); text-align: center;
        font-weight: 600; letter-spacing: .04em; }

      .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
      .cal-day { font-family: 'JetBrains Mono', monospace; font-size: .72rem;
        text-align: center; padding: 6px 0; border-radius: 6px;
        color: var(--ho-text-mid, #6E6A60); font-weight: 500; }
      .cal-empty { color: transparent; }

      .cal-marked { background: var(--ho-green-pale, #E0F0EB);
        color: var(--ho-green-dark, #3D6B56); font-weight: 700;
        cursor: pointer; transition: background .2s; }
      .cal-marked:hover { background: var(--ho-green, #4E9978); color: #F2F1EC; }

      .cal-current { background: var(--ho-green, #4E9978); color: #F2F1EC;
        font-weight: 800; box-shadow: 0 0 0 2px var(--ho-green-dark, #3D6B56); }

      .cal-legend { display: flex; align-items: center; gap: 6px;
        margin-top: 10px; font-family: 'JetBrains Mono', monospace;
        font-size: .58rem; color: var(--ho-text-mid, #6E6A60); }
      .cal-legend-marked { color: var(--ho-green, #4E9978); font-size: .72rem; }

      /* Feed card — noticia */
      .feed-card { border-radius: 0; margin-bottom: 8px; overflow: hidden;
        border: none;
        background: var(--ho-card, #2A3230); cursor: pointer;
        transition: background .2s; }
      .feed-card:hover { background: var(--ho-dark-surface, #3F4E4A); }

      .feed-card-img-wrap { position: relative; width: 100%; height: 140px; overflow: hidden; }
      .feed-card-img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
      .feed-card-img-overlay { position: absolute; bottom: 8px; left: 10px; display: flex; align-items: center; gap: 6px; z-index: 1; }
      .feed-card-body { padding: 12px 14px 6px; }

      .feed-card-fecha { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: rgba(0,0,0,.5); color: #F2F1EC;
        padding: 2px 8px; border-radius: 6px; font-weight: 500; backdrop-filter: blur(4px); }

      .source-badge { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; padding: 2px 8px; border-radius: 6px;
        background: rgba(78,153,120,.7); color: #F2F1EC; backdrop-filter: blur(4px); }

      .feed-card-emoji { font-size: 1rem; }

      .feed-card-titulo { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: 1.32rem; color: var(--ho-text, #E8E6E0); margin-top: 4px;
        line-height: 1.2; }

      .feed-card-bajada { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.35;
        margin-top: 3px; }

      .feed-card-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }

      /* ===== Popup overlay (noticia) ===== */
      .popup-overlay { position: fixed; inset: 0;
        background: rgba(33,31,29,.65); z-index: 50;
        display: flex; align-items: flex-start; justify-content: center;
        padding: 16px 16px 40px; overflow-y: auto; -webkit-overflow-scrolling: touch;
        animation: popfade .25s ease; }

      .popup-content { background: var(--ho-card, #2A3230); border-radius: 0;
        border: 1px solid var(--ho-border, rgba(255,255,255,.12));
        max-width: 100%; width: 380px; position: relative;
        overflow: hidden; margin-bottom: 24px; }

      .popup-close { position: absolute; top: 10px; right: 12px;
        background: var(--ho-dark-surface, #3F4E4A); color: var(--ho-text-off, #F2F1EC);
        width: 28px; height: 28px; border-radius: 50%; border: none;
        cursor: pointer; font-size: .85rem; z-index: 10;
        display: flex; align-items: center; justify-content: center; }

      .popup-img { width: 100%; height: 180px; object-fit: cover; object-position: top center; display: block; }
      .popup-body { padding: 14px 16px 32px; }
      .popup-title-line { display: flex; align-items: baseline; gap: 6px; }
      .popup-emoji { font-size: 1rem; }
      .popup-titulo { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.59rem; color: var(--ho-text, #E8E6E0);
        line-height: 1.15; }
      .popup-desarrollo { font-family: 'Public Sans', sans-serif; font-size: 1.32rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.55; margin-top: 10px; }
      .popup-fuente { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 8px; font-style: italic; }
      .popup-fuente a { color: var(--ho-green, #4E9978); text-decoration: underline;
        transition: color .2s; }
      .popup-fuente a:hover { color: var(--ho-green-light, #80CCA0); }
      .popup-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }

      @keyframes popfade { from { opacity: 0 } to { opacity: 1 } }
    `;
  }

  // ===== Render =====

  _render() {
    const numero = this._meta.numero || '';
    const fecha = this._meta.fecha || '';
    const fechaLong = this._formatFechaLong(fecha);

    const hasPrev = this._edicionIdx < this._ediciones.length - 1;
    const hasNext = this._edicionIdx > 0;

    // Cintillo: ←back | ←prev | CLIPPING N°X | →next  (same pattern as Actualidad)
    const chevLeft = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const chevRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    const cintilloHtml = '<div class="act-cintillo">' +
      '<button class="cintillo-back-btn" id="cintilloBack" title="Volver">' +
        '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
      '</button>' +
      '<div class="cintillo-spacer"></div>' +
      '<button class="cintillo-nav-btn" id="edPrev" ' + (hasPrev ? '' : 'disabled') + ' title="Anterior">' + chevLeft + '</button>' +
      '<div class="cintillo-center">' +
        '<div class="cintillo-title">CLIPPING N°' + numero + '</div>' +
        '<div class="cintillo-date" id="edFecha">' + fechaLong + '</div>' +
      '</div>' +
      '<button class="cintillo-nav-btn" id="edNext" ' + (hasNext ? '' : 'disabled') + ' title="Siguiente">' + chevRight + '</button>' +
      '<div class="cintillo-spacer"></div>' +
    '</div>';

    // Calendar popup (if open)
    const calHtml = this._calOpen ? this._renderCalendar() : '';

    const cardsHtml = this._noticias.map(n => {
      const tagsHtml = (n.tags || []).map(t =>
        '<span class="tag">' + t + '</span>'
      ).join('');
      return '<div class="feed-card" data-id="' + (n.id || '') + '">' +
        (n.foto ? '<div class="feed-card-img-wrap"><img class="feed-card-img" src="' + n.foto + '" alt="" loading="lazy">' +
          '<div class="feed-card-img-overlay">' +
            '<span class="feed-card-fecha">' + this._formatFecha(n.fecha || this._meta.fecha) + '</span>' +
            '<span class="source-badge">📰</span>' +
            (n.emoji ? '<span class="feed-card-emoji">' + n.emoji + '</span>' : '') +
          '</div></div>' : '') +
        '<div class="feed-card-body">' +
          '<div class="feed-card-titulo">' + (n.titulo || '') + '</div>' +
          '<div class="feed-card-bajada">' + (n.bajada || '') + '</div>' +
          '<div class="feed-card-tags">' + tagsHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const popupHtml = this._popupItem ? this._renderPopup(this._popupItem) : '';

    return html`
      <div class="hero-banner" id="actBanner">
        <div class="hero-banner-title">Actualidad</div>
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="actExplore">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="clipping">Clipping</button>
          <button class="hero-explore-option" data-explore="infomate">InfoMate</button>
          <button class="hero-explore-option" data-explore="sindical">Informe Sindical</button>
        </div>
        ` : ''}
      </div>
      ${cintilloHtml}
      <div class="scroll" id="clipScroll">
        ${cardsHtml}
      </div>
      ${calHtml}
      ${popupHtml}
    `;
  }

  _renderPopup(item) {
    const tagsHtml = (item.tags || []).map(t =>
      '<span class="tag">' + t + '</span>'
    ).join('');

    return '<div class="popup-overlay" id="popupOverlay">' +
      '<div class="popup-content">' +
        '<button class="popup-close" id="popupClose">✕</button>' +
        (item.foto ? '<img class="popup-img" src="' + item.foto + '" alt="" loading="lazy">' : '') +
        '<div class="popup-body">' +
          '<div class="popup-title-line">' +
          (item.emoji ? '<span class="popup-emoji">' + item.emoji + '</span>' : '') +
          '<span class="popup-titulo">' + (item.titulo || '') + '</span></div>' +
          '<div class="popup-desarrollo">' + (item.desarrollo || '') + '</div>' +
          (item.fuente ? '<div class="popup-fuente">Fuente: ' + this._renderFuentes(item.fuente, item.fuente_url) + '</div>' : '') +
          (tagsHtml ? '<div class="popup-tags">' + tagsHtml + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // Parse fuentes: "InfoGremiales — 27/07 | Página/12 — 28/07" → separate underlined links
  _renderFuentes(fuenteStr, fuenteUrl) {
    if (!fuenteStr) return '';
    const parts = fuenteStr.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length <= 1) {
      // Single source
      return fuenteUrl ? '<a href="' + fuenteUrl + '" target="_blank" rel="noopener">' + fuenteStr + '</a>' : fuenteStr;
    }
    // Multiple sources — each one underlined, separated by " · "
    return parts.map(p => {
      return fuenteUrl ? '<a href="' + fuenteUrl + '" target="_blank" rel="noopener">' + p + '</a>' : p;
    }).join(' · ');
  }

  // ===== After-render =====

  _afterRender() {
    // Collapsed Actualidad banner
    const actBanner = this.shadowRoot.querySelector('#actBanner');
    if (actBanner) actBanner.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('ho-navigate', {
        detail: { screen: 'actualidad' },
        bubbles: true, composed: true
      }));
    });
    const actExplore = this.shadowRoot.querySelector('#actExplore');
    if (actExplore) actExplore.addEventListener('click', (e) => {
      e.stopPropagation();
      this._exploreOpen = !this._exploreOpen;
      this.render();
    });
    this.shadowRoot.querySelectorAll('.hero-explore-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.dataset.explore;
        this._exploreOpen = false;
        this.dispatchEvent(new CustomEvent('ho-navigate', {
          detail: { screen: target },
          bubbles: true, composed: true
        }));
      });
    });

    // Cintillo back button → navigate to Actualidad
    const cintilloBack = this.shadowRoot.querySelector('#cintilloBack');
    if (cintilloBack) cintilloBack.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('ho-navigate', {
        detail: { screen: 'actualidad' },
        bubbles: true, composed: true
      }));
    });

    // Edition navigation buttons
    const prevBtn = this.shadowRoot.querySelector('#edPrev');
    const nextBtn = this.shadowRoot.querySelector('#edNext');
    if (prevBtn) prevBtn.addEventListener('click', () => this._goEdition(1));   // older
    if (nextBtn) nextBtn.addEventListener('click', () => this._goEdition(-1));  // newer

    // Date line → open calendar
    const fechaEl = this.shadowRoot.querySelector('#edFecha');
    if (fechaEl) fechaEl.addEventListener('click', () => {
      this._calMonth = (this._meta.fecha || '2026-07-02').substring(0, 7);
      this._calOpen = true;
      this.render();
    });

    // Calendar events
    if (this._calOpen) {
      // Click marked day → load that edition
      this.shadowRoot.querySelectorAll('.cal-marked').forEach(cell => {
        cell.addEventListener('click', () => {
          const dateStr = cell.dataset.date;
          const idx = this._findEditionIdx(dateStr);
          if (idx >= 0) {
            this._edicionIdx = idx;
            this._calOpen = false;
            this._popupItem = null;
            this._loadEdition(this._ediciones[idx].archivo);
          }
        });
      });

      // Calendar month navigation ← →
      const calPrev = this.shadowRoot.querySelector('#calPrev');
      const calNext = this.shadowRoot.querySelector('#calNext');
      if (calPrev) calPrev.addEventListener('click', () => {
        this._calMonth = calPrev.dataset.month;
        this.render();
      });
      if (calNext) calNext.addEventListener('click', () => {
        this._calMonth = calNext.dataset.month;
        this.render();
      });

      // Click overlay background → close calendar
      const calOverlay = this.shadowRoot.querySelector('#calOverlay');
      if (calOverlay) calOverlay.addEventListener('click', (e) => {
        if (e.target === calOverlay) {
          this._calOpen = false;
          this.render();
        }
      });
    }

    // Card clicks → open popup
    this.shadowRoot.querySelectorAll('.feed-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const item = this._noticias.find(n => n.id === id);
        if (item) this._openPopup(item);
      });
    });

    // Auto-expand specific noticia if expandId is set (from Home carousel click)
    if (this.expandId) {
      const targetItem = this._noticias.find(n => n.id === this.expandId);
      if (targetItem) {
        // Scroll to the card first, then open popup after a brief delay
        const targetCard = this.shadowRoot.querySelector('.feed-card[data-id="' + this.expandId + '"]');
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => this._openPopup(targetItem), 300);
      }
      // Clear expandId so it doesn't re-expand on subsequent renders
      this.expandId = null;
    }

    // Popup close
    if (this._popupItem) {
      const closeBtn = this.shadowRoot.querySelector('#popupClose');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());
      const overlay = this.shadowRoot.querySelector('#popupOverlay');
      if (overlay) overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this._closePopup();
      });
    }
  }

  _goEdition(delta) {
    const newIdx = this._edicionIdx + delta;
    if (newIdx < 0 || newIdx >= this._ediciones.length) return;
    this._edicionIdx = newIdx;
    this._popupItem = null;
    this._loadEdition(this._ediciones[newIdx].archivo);
  }

  _openPopup(item) {
    const scroll = this.shadowRoot.querySelector('#clipScroll');
    if (scroll) this._savedScrollTop = scroll.scrollTop;
    this._popupItem = item;
    this.render();
  }

  _closePopup() {
    this._popupItem = null;
    this.render();
    const scroll = this.shadowRoot.querySelector('#clipScroll');
    if (scroll && this._savedScrollTop) {
      requestAnimationFrame(() => {
        scroll.scrollTop = this._savedScrollTop;
        this._savedScrollTop = null;
      });
    }
  }
}

customElements.define('hornero-clipping', HorneroClipping);
