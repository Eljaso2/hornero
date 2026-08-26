// ===== <hornero-infomate> — InfoMate (sub-screen) =====
// datosMacro resumen + secciones como feed-cards
// Multi-edición: carga índice → última edición, navegación ←→
// Estructura idéntica a Clipping: flechas SVG, feed-cards, popup, tags
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroInfomate extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      mateMes: String,       // edition mes to load (e.g. "2026-06")
    };
  }

  // ===== Topic → image mapping (1 recurring image per lámina) =====
  static get TOPIC_IMAGES() {
    return {
      inflacion:      'assets/infomate/inflacion.png',
      salarios:       'assets/infomate/salarios.png',
      transferencia:  'assets/infomate/transferencia.png',
      jubilados:      'assets/infomate/jubilados.png',
      actividad:      'assets/infomate/actividad.png',
      empleo:         'assets/infomate/empleo.png',
      recortes:       'assets/infomate/recortes.png',
      exportaciones:  'assets/infomate/exportaciones.jpg',
      'fuga-capitales': 'assets/infomate/fuga-capitales.png',
      consumo:        'assets/infomate/consumo.png',
    };
  }

  // Emoji fallback per topic (when no image available)
  static get TOPIC_EMOJIS() {
    return {
      inflacion:      '📈',
      salarios:       '💰',
      transferencia:  '🔀',
      jubilados:      '👴',
      actividad:      '🏭',
      empleo:         '👷',
      recortes:       '✂️',
      exportaciones:  '🚢',
      'fuga-capitales': '💸',
      consumo:        '🛒',
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.mateMes = null;
    this._mateData = null;
    this._ediciones = [];    // mate-index.ediciones[]
    this._edicionIdx = 0;    // current index in _ediciones (0 = latest)
    this._popupItem = null;
    this._savedScrollTop = null;
    this._visibleCount = 10;
    this._plusMenuOpen = false; // hamburger menu state
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
      const res = await fetch('data/mate-index.json');
      const idx = await res.json();
      this._ediciones = idx.ediciones || [];

      // If mateMes property is set, load that specific edition
      if (this.mateMes) {
        const targetIdx = this._ediciones.findIndex(ed => ed.mes === this.mateMes);
        if (targetIdx >= 0) {
          this._edicionIdx = targetIdx;
          await this._loadEdition(this._ediciones[targetIdx].archivo);
        } else {
          this._edicionIdx = 0;
          await this._loadEdition(this._ediciones[0].archivo);
        }
      } else {
        this._edicionIdx = 0;
        await this._loadEdition(this._ediciones[0].archivo);
      }
    } catch(e) {
      console.warn('InfoMate: index load failed, fallback to hardcoded', e);
      await this._loadEdition('data/mate-2026-06.json');
    }
  }

  async _loadEdition(filePath) {
    try {
      const response = await fetch(filePath);
      this._mateData = await response.json();
      this.render();
    } catch(e) { console.warn('InfoMate: edition load failed', e); }
  }

  _formatMes(mesStr) {
    if (!mesStr) return '';
    const parts = mesStr.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return months[parseInt(parts[1]) - 1] + ' ' + parts[0];
  }

  // ===== Styles — identical to Clipping =====

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
      .cintillo-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .cintillo-spacer { flex: 1; }
      .cintillo-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.06rem; color: var(--ho-green-dark, #3D6B56);
        letter-spacing: .04em; text-align: center; }
      .cintillo-title .hero-bajada-link { margin-left: 6px; font-size: .62rem;
        font-family: 'Archivo', sans-serif; font-weight: 800;
        color: var(--ho-green, #4E9978); text-decoration: none;
        line-height: 1; }
      .hero-bajada-link:hover { color: var(--ho-green-dark, #3D6B56); }
      .cintillo-date { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .08em; margin-top: 2px; }
      .cintillo-nav-btn { background: none; border: none; cursor: pointer;
        color: var(--ho-text-mid, #6E6A60); padding: 6px;
        transition: color .2s, opacity .2s; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0; }
      .cintillo-nav-btn:hover { color: var(--ho-text, #E8E6E0); }
      .cintillo-nav-btn:disabled { opacity: .2; cursor: default; }
      .cintillo-nav-btn svg { width: 20px; height: 20px; }

      /* ===== Hamburger menu (same as chat screens) ===== */
      .chat-plus-wrapper { position: relative; }
      .chat-plus-btn { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s;
        position: relative; z-index: 2; }
      .chat-plus-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); transform: scale(1.08); }
      .chat-plus-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-plus-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .chat-plus-btn.open { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .chat-plus-btn.open svg { stroke: var(--ho-green-dark, #3D6B56); }
      .chat-plus-btn.open svg line:nth-child(2) { display: none; }
      .chat-plus-btn.open svg line:first-child { transform: translateY(6px) rotate(45deg); transform-origin: center; }
      .chat-plus-btn.open svg line:nth-child(3) { transform: translateY(-6px) rotate(-45deg); transform-origin: center; }

      .chat-plus-menu { position: absolute; top: -8px; right: -8px; z-index: 1;
        background: color-mix(in srgb, var(--ho-dark-surface, #2A3230) 92%, transparent);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--ho-border, rgba(255,255,255,.1));
        border-radius: 14px; padding: 8px;
        padding-top: 46px;
        display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,.3);
        animation: menuFadeIn .15s ease; }
      :host(.theme-light) .chat-plus-menu {
        background: color-mix(in srgb, var(--ho-bg, #F8F6F0) 92%, transparent);
        box-shadow: 0 4px 16px rgba(0,0,0,.12); }
      .chat-plus-item { width: 32px; height: 32px; box-sizing: border-box;
        border-radius: 50%; background: transparent;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; position: relative; }
      .chat-plus-item:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); transform: scale(1.08); }
      .chat-plus-item svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-plus-item:hover svg { stroke: var(--ho-green-dark, #3D6B56); }

      /* Info popup (same as chat screens) */
      .info-popup-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 200; background: rgba(0,0,0,.55); display: flex;
        align-items: center; justify-content: center; animation: popfade .2s ease; }
      .info-popup { width: 88%; max-width: 310px; max-height: 80vh; position: relative;
        background: var(--ho-bg, #1E2321); border: 1px solid var(--ho-border, rgba(255,255,255,.1));
        border-radius: 18px; padding: 20px; overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,.4); animation: menuFadeIn .25s ease; }
      .info-popup-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.1rem; color: var(--ho-green, #4E9978); margin-bottom: 8px; }
      .info-popup-bajada { font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5; margin-bottom: 14px; }
      .info-popup-close { position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;
        border-radius: 50%; border: 1px solid var(--ho-border, rgba(255,255,255,.1));
        background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .info-popup-close svg { width: 14px; height: 14px; stroke: var(--ho-text-mid, #6E6A60);
        stroke-width: 2.5; fill: none; stroke-linecap: round; }

      /* Feed card — idéntico a Clipping: full-width, cuadrado */
      .feed-card { border-radius: 0; margin-bottom: 8px; overflow: hidden;
        border: none;
        background: var(--ho-card, #2A3230); cursor: pointer;
        transition: background .2s; }
      .feed-card:hover { background: var(--ho-dark-surface, #3F4E4A); }

      .feed-card-img-wrap { position: relative; width: 100%; height: 140px; overflow: hidden; }
      .feed-card-img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
      .feed-card-img-placeholder { width: 100%; height: 140px; background: var(--ho-dark-surface, #3F4E4A);
        display: flex; align-items: center; justify-content: center; position: relative; }
      .feed-card-img-placeholder span { font-size: 2.4rem; opacity: .5; }
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

      /* ===== Popup overlay (sección) — idéntico a Clipping ===== */
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

      /* Empty state */
      .empty { text-align: center; color: var(--ho-text-light, #9C988D);
        font-family: 'Archivo', sans-serif; padding: 40px 20px; }

      /* Show more */
      .show-more-btn { display: block; width: 100%; padding: 12px;
        background: var(--ho-card, #2A3230); border: none;
        border-top: 1px solid var(--ho-border, rgba(255,255,255,.08));
        color: var(--ho-green, #4E9978);
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .86rem;
        cursor: pointer; text-align: center; margin: 0;
        transition: background .2s; }
      .show-more-btn:hover { background: var(--ho-dark-surface, #3F4E4A); }
    `;
  }

  // ===== Render =====

  _render() {
    if (!this._mateData) return '<div class="empty">Cargando InfoMate...</div>';

    const meta = this._mateData.meta || {};
    const macro = this._mateData.datosMacro || {};
    const secciones = this._mateData.secciones || [];

    // Edition header: ←back | ←prev | INFOMATE mes (center) | →next | ☰ menu
    const hasPrev = this._edicionIdx < this._ediciones.length - 1;
    const hasNext = this._edicionIdx > 0;

    // Cintillo: ←back + ←prev | INFOMATE | →next + ☰ menu
    const chevLeft = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const chevRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    const cintilloHtml = '<div class="act-cintillo">' +
      '<button class="cintillo-back-btn" id="cintilloBack" title="Volver">' +
        '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
      '</button>' +
      '<button class="cintillo-nav-btn" id="edPrev" ' + (hasPrev ? '' : 'disabled') + ' title="Anterior">' + chevLeft + '</button>' +
      '<div class="cintillo-center">' +
        '<div class="cintillo-title">INFOMATE <a class="hero-bajada-link" href="https://mateconomia.com.ar/infomate" target="_blank" rel="noopener">↗</a></div>' +
        '<div class="cintillo-date">' + this._formatMes(meta.mes) + '</div>' +
      '</div>' +
      '<button class="cintillo-nav-btn" id="edNext" ' + (hasNext ? '' : 'disabled') + ' title="Siguiente">' + chevRight + '</button>' +
      
      '<div class="chat-plus-wrapper">' +
        '<button class="chat-plus-btn' + (this._plusMenuOpen ? ' open' : '') + '" id="matePlusBtn" title="' + (this._plusMenuOpen ? 'Cerrar' : 'Más opciones') + '">' +
          '<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
        '</button>' +
        (this._plusMenuOpen ? '<div class="chat-plus-menu" id="matePlusMenu">' +
          '<button class="chat-plus-item" id="mateInfoBtn" title="Información de la sección">' +
            '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
          '</button>' +
          '<button class="chat-plus-item" id="mateChatBtn" title="Consultar a la Abogada">' +
            '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
          '</button>' +
        '</div>' : '') +
      '</div>' +
    '</div>';

    // Section cards — paginate: show _visibleCount, then "mostrar más"
    const visibleSecciones = secciones.slice(0, this._visibleCount);
    const hasMore = secciones.length > this._visibleCount;
    const cardsHtml = visibleSecciones.map((s, idx) => {
      const tagsHtml = (s.datos || []).map(d =>
        '<span class="tag">' + d + '</span>'
      ).join('');
      const sId = s.id || ('sec-' + idx);

      // Resolve image: tema → topic image, else foto, else emoji placeholder
      const topicImg = s.tema ? HorneroInfomate.TOPIC_IMAGES[s.tema] : null;
      const topicEmoji = s.tema ? HorneroInfomate.TOPIC_EMOJIS[s.tema] : (s.emoji || '📊');
      const imgHtml = topicImg
        ? '<div class="feed-card-img-wrap"><img class="feed-card-img" src="' + topicImg + '" alt="" loading="lazy">'
        : '<div class="feed-card-img-wrap"><div class="feed-card-img-placeholder"><span>' + topicEmoji + '</span></div>';

      return '<div class="feed-card" data-id="' + sId + '">' +
        imgHtml +
          '<div class="feed-card-img-overlay">' +
            '<span class="feed-card-fecha">' + this._formatMes(meta.mes) + '</span>' +
            '<span class="source-badge">📊</span>' +
          '</div></div>' +
        '<div class="feed-card-body">' +
          '<div class="feed-card-titulo">' + (s.titulo || '') + '</div>' +
          '<div class="feed-card-bajada">' + (s.bajada || '') + '</div>' +
          '<div class="feed-card-tags">' + tagsHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const popupHtml = this._popupItem ? this._renderPopup(this._popupItem) : '';

    return html`
      ${cintilloHtml}
      <div class="scroll" id="mateScroll">
        ${cardsHtml}
        ${hasMore ? '<button class="show-more-btn" id="showMoreBtn">Mostrar más</button>' : ''}
      </div>
      ${popupHtml}
    `;
  }

  _renderPopup(item) {
    const tagsHtml = (item.datos || []).map(d =>
      '<span class="tag">' + d + '</span>'
    ).join('');

    // Resolve image: tema → topic image, else foto (legacy), else emoji placeholder
    const topicImg = item.tema ? HorneroInfomate.TOPIC_IMAGES[item.tema] : null;
    const topicEmoji = item.tema ? HorneroInfomate.TOPIC_EMOJIS[item.tema] : (item.emoji || '📊');
    const popupImgHtml = topicImg
      ? '<img class="popup-img" src="' + topicImg + '" alt="" loading="lazy">'
      : '<div class="feed-card-img-placeholder" style="height:180px"><span style="font-size:3rem">' + topicEmoji + '</span></div>';

    return '<div class="popup-overlay" id="popupOverlay">' +
      '<div class="popup-content">' +
        '<button class="popup-close" id="popupClose">✕</button>' +
        popupImgHtml +
        '<div class="popup-body">' +
          '<div class="popup-title-line">' +
          '<span class="popup-titulo">' + (item.titulo || '') + '</span></div>' +
          '<div class="popup-desarrollo">' + (item.desarrollo || item.bajada || '') + '</div>' +
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
      return fuenteUrl ? '<a href="' + fuenteUrl + '" target="_blank" rel="noopener">' + fuenteStr + '</a>' : fuenteStr;
    }
    return parts.map(p => {
      return fuenteUrl ? '<a href="' + fuenteUrl + '" target="_blank" rel="noopener">' + p + '</a>' : p;
    }).join(' · ');
  }

  // ===== After-render =====

  _afterRender() {
    // Cintillo — back button
    const cintilloBack = this.shadowRoot.querySelector('#cintilloBack');
    if (cintilloBack) cintilloBack.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('ho-navigate', {
        detail: { screen: 'home' },
        bubbles: true, composed: true
      }));
    });

    // Hamburger menu toggle
    const plusBtn = this.shadowRoot.querySelector('#matePlusBtn');
    if (plusBtn) {
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._plusMenuOpen = !this._plusMenuOpen;
        this.render();
      });
    }

    // Menu: Info button → show info popup
    const infoBtn = this.shadowRoot.querySelector('#mateInfoBtn');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        this._plusMenuOpen = false;
        this._showInfoPopup();
      });
    }

    // Menu: Chat button → navigate to consulta (Abogada)
    const chatBtn = this.shadowRoot.querySelector('#mateChatBtn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        this._plusMenuOpen = false;
        this.dispatchEvent(new CustomEvent('ho-navigate', {
          detail: { screen: 'consulta' },
          bubbles: true, composed: true
        }));
      });
    }

    // Edition navigation buttons
    const prevBtn = this.shadowRoot.querySelector('#edPrev');
    const nextBtn = this.shadowRoot.querySelector('#edNext');
    if (prevBtn) prevBtn.addEventListener('click', () => this._goEdition(1));   // older
    if (nextBtn) nextBtn.addEventListener('click', () => this._goEdition(-1));  // newer

    // Card clicks → open popup (same as Clipping)
    this.shadowRoot.querySelectorAll('.feed-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const secciones = this._mateData.secciones || [];
        const item = secciones.find((s, idx) => (s.id || ('sec-' + idx)) === id);
        if (item) this._openPopup(item);
      });
    });

    // Popup close
    if (this._popupItem) {
      const closeBtn = this.shadowRoot.querySelector('#popupClose');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());
      const overlay = this.shadowRoot.querySelector('#popupOverlay');
      if (overlay) overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this._closePopup();
      });
    }

    // Show more button
    const showMoreBtn = this.shadowRoot.querySelector('#showMoreBtn');
    if (showMoreBtn) showMoreBtn.addEventListener('click', () => {
      this._visibleCount += 10;
      this.render();
    });
  }

  _goEdition(delta) {
    const newIdx = this._edicionIdx + delta;
    if (newIdx < 0 || newIdx >= this._ediciones.length) return;
    this._edicionIdx = newIdx;
    this._popupItem = null;
    this._visibleCount = 10;
    this._loadEdition(this._ediciones[newIdx].archivo);
  }

  _openPopup(item) {
    const scroll = this.shadowRoot.querySelector('#mateScroll');
    if (scroll) this._savedScrollTop = scroll.scrollTop;
    this._popupItem = item;
    this.render();
  }

  _closePopup() {
    this._popupItem = null;
    this.render();
    const scroll = this.shadowRoot.querySelector('#mateScroll');
    if (scroll && this._savedScrollTop) {
      requestAnimationFrame(() => {
        scroll.scrollTop = this._savedScrollTop;
        this._savedScrollTop = null;
      });
    }
  }

  // ===== Section info popup =====
  _showInfoPopup() {
    const existing = this.shadowRoot.querySelector('.info-popup-overlay');
    if (existing) existing.remove();
    const info = {
      title: 'InfoMate',
      bajada: 'InfoMate es un resumen mensual de datos macroeconómicos y tendencias laborales de Argentina: inflación obrera, SMVM, canasta básica, empleo, informalidad y más. Cada sección trae el dato clave con contexto. Producido por Mateconomía en alianza con Hornero.'
    };
    const overlay = document.createElement('div');
    overlay.className = 'info-popup-overlay';
    const popup = document.createElement('div');
    popup.className = 'info-popup';
    popup.style.position = 'relative';
    let html = '';
    if (info.title) html += '<div class="info-popup-title">' + info.title + '</div>';
    if (info.bajada) html += '<div class="info-popup-bajada">' + info.bajada + '</div>';
    html += '<button class="info-popup-close" title="Cerrar"><svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>';
    popup.innerHTML = html;
    overlay.appendChild(popup);
    this.shadowRoot.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    popup.querySelector('.info-popup-close').addEventListener('click', () => overlay.remove());
  }
}

customElements.define('hornero-infomate', HorneroInfomate);
