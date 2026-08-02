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
    this._exploreOpen = false;
    this._savedScrollTop = null;
    this._visibleCount = 10;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadIndex();
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
        padding: 0; scrollbar-width: none; }
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

      /* ===== Collapsed Actualidad banner ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-dark, #1E2321);
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

      /* Feed card — idéntico a Clipping: full-width, cuadrado */
      .feed-card { border-radius: 0; margin-bottom: 0; overflow: hidden;
        border: none; border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230); cursor: pointer;
        transition: background .2s; }
      .feed-card:hover { background: var(--ho-dark-surface, #3F4E4A); }

      .feed-card-img { width: 100%; height: 140px; object-fit: cover; object-position: top center; display: block; }
      .feed-card-body { padding: 12px 14px 6px; }

      .feed-card-fecha { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-text-mid, #6E6A60);
        padding: 2px 8px; border-radius: 6px; font-weight: 500; }

      .source-badge { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; padding: 2px 8px; border-radius: 6px; margin-left: 4px;
        background: var(--ho-green, #4E9978); color: #F2F1EC; }

      .feed-card-emoji { font-size: 1rem; margin-left: 4px; }

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

      .popup-img { width: 100%; height: 180px; object-fit: cover; display: block; }
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

    // Cintillo: ←back | ←prev | INFOMATE | →next  (same pattern as Actualidad)
    const chevLeft = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const chevRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    const cintilloHtml = '<div class="act-cintillo">' +
      '<button class="cintillo-back-btn" id="cintilloBack" title="Volver">' +
        '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
      '</button>' +
      '<div class="cintillo-spacer"></div>' +
      '<button class="cintillo-nav-btn" id="edPrev" ' + (hasPrev ? '' : 'disabled') + ' title="Anterior">' + chevLeft + '</button>' +
      '<div class="cintillo-center">' +
        '<div class="cintillo-title">INFOMATE <a class="hero-bajada-link" href="https://mateconomia.com.ar/infomate" target="_blank" rel="noopener">↗</a></div>' +
        '<div class="cintillo-date">' + this._formatMes(meta.mes) + '</div>' +
      '</div>' +
      '<button class="cintillo-nav-btn" id="edNext" ' + (hasNext ? '' : 'disabled') + ' title="Siguiente">' + chevRight + '</button>' +
      '<div class="cintillo-spacer"></div>' +
    '</div>';

    // Section cards — paginate: show _visibleCount, then "mostrar más"
    const visibleSecciones = secciones.slice(0, this._visibleCount);
    const hasMore = secciones.length > this._visibleCount;
    const cardsHtml = visibleSecciones.map((s, idx) => {
      const tagsHtml = (s.datos || []).map(d =>
        '<span class="tag">' + d + '</span>'
      ).join('');
      const sId = s.id || ('sec-' + idx);
      return '<div class="feed-card" data-id="' + sId + '">' +
        (s.foto ? '<img class="feed-card-img" src="' + s.foto + '" alt="" loading="lazy">' : '') +
        '<div class="feed-card-body">' +
          '<span class="feed-card-fecha">' + this._formatMes(meta.mes) + '</span>' +
          '<span class="source-badge">📊</span>' +
          (s.emoji ? '<span class="feed-card-emoji">' + s.emoji + '</span>' : '') +
          '<div class="feed-card-titulo">' + (s.titulo || '') + '</div>' +
          '<div class="feed-card-bajada">' + (s.bajada || '') + '</div>' +
          (tagsHtml ? '<div class="feed-card-tags">' + tagsHtml + '</div>' : '') +
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

    return '<div class="popup-overlay" id="popupOverlay">' +
      '<div class="popup-content">' +
        '<button class="popup-close" id="popupClose">✕</button>' +
        (item.foto ? '<img class="popup-img" src="' + item.foto + '" alt="" loading="lazy">' : '') +
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
