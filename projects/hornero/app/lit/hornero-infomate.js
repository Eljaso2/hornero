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
      .cintillo-center { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; }
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

      /* ===== Persona top bar (same pattern as chat screens) ===== */
      .chat-top-bar { position: relative; width: 100%;
        display: flex; align-items: center; height: 56px;
        padding: 0; background: var(--ho-bg, #1E2321);
        flex-shrink: 0; box-sizing: border-box; border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .chat-top-bar-left { display: flex; align-items: center; padding-left: 8px; flex-shrink: 0; }
      .chat-top-bar-center { flex: 1; overflow-x: auto; display: flex; align-items: center;
        -webkit-overflow-scrolling: touch; scrollbar-width: none; gap: 10px; padding: 0 12px;
        justify-content: flex-start; scroll-behavior: smooth; }
      .chat-top-bar-center::-webkit-scrollbar { width: 0; }
      .chat-persona-icon { display: flex; flex-direction: column; align-items: center;
        gap: 3px; background: none; border: none; cursor: pointer;
        padding: 4px 2px; transition: opacity .2s; position: relative;
        flex-shrink: 0; }
      .chat-persona-icon:hover { opacity: .85; }
      .persona-icon-inner { width: 34px; height: 34px; box-sizing: border-box;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 2px solid var(--ho-border, rgba(255,255,255,.08));
        overflow: hidden; background: transparent;
        transition: background .25s, border-color .25s, filter .3s; }
      .chat-persona-icon:hover .persona-icon-inner { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .chat-persona-icon:not(.active) .persona-icon-inner img,
      .chat-persona-icon:not(.active) .persona-icon-inner .msg-avatar-emoji { filter: grayscale(1); transition: filter .3s; }
      .persona-icon-inner img { width: 100%; height: 100%; object-fit: cover; }
      .persona-icon-inner img.periodista-full { object-fit: contain; }
      .persona-icon-inner img.abogado-crop { object-position: center 25%; }
      .persona-icon-inner img.investigador-crop { object-position: center 30%; }
      .persona-icon-inner .msg-avatar-emoji { font-size: .62rem; line-height: 1; }
      .chat-persona-icon.active .persona-icon-inner { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .chat-persona-icon .persona-cintillo-label { font-family: 'Archivo', sans-serif;
        font-size: .52rem; font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        white-space: nowrap; transition: color .2s, filter .3s; }
      .chat-persona-icon:not(.active) .persona-cintillo-label { filter: grayscale(1); opacity: .6; }
      .chat-persona-icon:hover .persona-cintillo-label { color: var(--ho-green, #4E9978); filter: none; opacity: 1; }
      .chat-persona-icon.active .persona-cintillo-label { color: var(--ho-green, #4E9978); font-weight: 700; filter: none; opacity: 1; }

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

    // Edition header: ← | INFOMATE mes (center) | → (same pattern as Clipping)
    const hasPrev = this._edicionIdx < this._ediciones.length - 1;
    const hasNext = this._edicionIdx > 0;

    // Persona bar (same pattern as chat screens)
    const allPersonas = ['companero', 'abogado', 'periodista', 'historiador', 'sociologo'];
    const personaScreenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'companero': { screen: 'gremial', persona: 'companero' },
      'historiador': { screen: 'formacion', persona: 'historiador' },
      'sociologo': { screen: 'condicion', persona: 'sociologo' },
    };
    const personaConfigMap = {
      'abogado':      { emoji: '📖', name: 'Abogado/a', icon: 'assets/personajes/iconos/a03.png' },
      'companero':    { emoji: '✊', name: 'Compañero/a', icon: 'assets/personajes/iconos/a02.png' },
      'periodista':   { emoji: '🎙️', name: 'Periodista', icon: 'assets/personajes/iconos/a04.png' },
      'historiador':  { emoji: '📜', name: 'Historiador/a', icon: 'assets/personajes/iconos/a01.png' },
      'sociologo':    { emoji: '🔬', name: 'Investigador/a', icon: 'assets/personajes/iconos/a05.png' },
    };
    const shortLabels = { 'companero': 'Compañero/a', 'abogado': 'Abogado/a', 'periodista': 'Periodista', 'historiador': 'Historiador/a', 'sociologo': 'Investigador/a' };

    const personaIconsHtml = allPersonas.map(p => {
      const cfg = personaConfigMap[p];
      const innerClass = `${p === 'periodista' ? 'periodista-full' : ''}${p === 'abogado' ? ' abogado-crop' : ''}${p === 'sociologo' ? ' investigador-crop' : ''}`;
      const inner = cfg.icon
        ? `<img src="${cfg.icon}" alt="${cfg.name}" class="${innerClass}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="msg-avatar-emoji" style="display:none">${cfg.emoji}</span>`
        : `<span class="msg-avatar-emoji">${cfg.emoji}</span>`;
      const navData = personaScreenMap[p] || { screen: 'consulta', persona: p };
      const label = shortLabels[p] || cfg.name;
      return `<button class="chat-persona-icon" data-persona="${p}" data-nav-screen="${navData.screen}" data-nav-persona="${navData.persona || p}">
        <span class="persona-icon-inner">${inner}</span>
        <span class="persona-cintillo-label">${label}</span>
      </button>`;
    }).join('');

    const personaBarHtml = '<div class="chat-top-bar">' +
      '<div class="chat-top-bar-left">' +
        '<button class="cintillo-back-btn" id="cintilloBack" title="Volver">' +
          '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="chat-top-bar-center">' + personaIconsHtml + '</div>' +
    '</div>';

    // Cintillo: ←prev | INFOMATE | →next
    const chevLeft = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const chevRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    const cintilloHtml = '<div class="act-cintillo">' +
      '<button class="cintillo-nav-btn" id="edPrev" ' + (hasPrev ? '' : 'disabled') + ' title="Anterior">' + chevLeft + '</button>' +
      '<div class="cintillo-center">' +
        '<div class="cintillo-title">INFOMATE <a class="hero-bajada-link" href="https://mateconomia.com.ar/infomate" target="_blank" rel="noopener">↗</a></div>' +
        '<div class="cintillo-date">' + this._formatMes(meta.mes) + '</div>' +
      '</div>' +
      '<button class="cintillo-nav-btn" id="edNext" ' + (hasNext ? '' : 'disabled') + ' title="Siguiente">' + chevRight + '</button>' +
    '</div>';

    // Section cards — paginate: show _visibleCount, then "mostrar más"
    const visibleSecciones = secciones.slice(0, this._visibleCount);
    const hasMore = secciones.length > this._visibleCount;
    const cardsHtml = visibleSecciones.map((s, idx) => {
      const tagsHtml = (s.datos || []).map(d =>
        '<span class="tag">' + d + '</span>'
      ).join('');
      const sId = s.id || ('sec-' + idx);
      const imgHtml = s.foto
        ? '<div class="feed-card-img-wrap"><img class="feed-card-img" src="' + s.foto + '" alt="" loading="lazy">'
        : '<div class="feed-card-img-wrap"><div class="feed-card-img-placeholder"><span>' + (s.emoji || '📊') + '</span></div>';
      return '<div class="feed-card" data-id="' + sId + '">' +
        imgHtml +
          '<div class="feed-card-img-overlay">' +
            '<span class="feed-card-fecha">' + this._formatMes(meta.mes) + '</span>' +
            '<span class="source-badge">📊</span>' +
            (s.emoji ? '<span class="feed-card-emoji">' + s.emoji + '</span>' : '') +
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
      ${personaBarHtml}
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

    const popupImgHtml = item.foto
      ? '<img class="popup-img" src="' + item.foto + '" alt="" loading="lazy">'
      : '<div class="feed-card-img-placeholder" style="height:180px"><span style="font-size:3rem">' + (item.emoji || '📊') + '</span></div>';

    return '<div class="popup-overlay" id="popupOverlay">' +
      '<div class="popup-content">' +
        '<button class="popup-close" id="popupClose">✕</button>' +
        popupImgHtml +
        '<div class="popup-body">' +
          '<div class="popup-title-line">' +
          (item.emoji ? '<span class="popup-emoji">' + item.emoji + '</span>' : '') +
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
    // Persona bar — back button
    const cintilloBack = this.shadowRoot.querySelector('#cintilloBack');
    if (cintilloBack) cintilloBack.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('ho-navigate', {
        detail: { screen: 'home' },
        bubbles: true, composed: true
      }));
    });

    // Persona bar — persona icon clicks
    this.shadowRoot.querySelectorAll('.chat-persona-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.navScreen;
        if (screen) {
          this.dispatchEvent(new CustomEvent('ho-navigate', {
            detail: { screen: screen },
            bubbles: true, composed: true
          }));
        }
      });
    });

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
}

customElements.define('hornero-infomate', HorneroInfomate);
