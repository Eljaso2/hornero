// ===== <hornero-clipping> — Clipping de noticias (sub-screen) =====
// Lista de noticias con popup overlay para desarrollo
// Multi-edición: carga índice → última edición, navegación ←→
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroClipping extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this._noticias = [];
    this._meta = {};
    this._popupItem = null;
    this._savedScrollTop = null;
    this._ediciones = [];     // clipping-index.ediciones[]
    this._edicionIdx = 0;     // current index in _ediciones (0 = latest)
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadIndex();
  }

  // ===== Data loading =====

  async _loadIndex() {
    try {
      const res = await fetch('data/clipping-index.json');
      const idx = await res.json();
      this._ediciones = idx.ediciones || [];
      // Default to latest edition (index 0)
      this._edicionIdx = 0;
      await this._loadEdition(this._ediciones[0].archivo);
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
      // Cache in IndexedDB
      if (typeof guardarClipping === 'function') {
        for (const item of this._noticias) {
          await guardarClipping(item);
        }
      }
      this.render();
    } catch(e) { console.warn('Clipping: edition load failed', e); }
  }

  _formatFecha(fecha) {
    if (!fecha) return '';
    const parts = fecha.split('-');
    return parts[2] + '/' + parts[1];
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 12px 16px 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Edition header — centrality: label in center, arrows on sides */
      .edicion-header { margin-bottom: 12px; }
      .edicion-row { display: flex; align-items: center; gap: 8px; }
      .edicion-btn { background: var(--ho-green, #6E8345); color: #F2F1EC;
        border: none; border-radius: 4px; cursor: pointer;
        font-family: 'JetBrains Mono', monospace; font-size: .72rem;
        padding: 5px 10px; font-weight: 600; letter-spacing: .06em;
        transition: opacity .2s; }
      .edicion-btn:hover { opacity: .8; }
      .edicion-btn:disabled { opacity: .3; cursor: default; }
      .edicion-center { flex: 1; text-align: center; }
      .edicion-numero { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.08rem; color: var(--ho-green-dark, #586B33);
        letter-spacing: .04em; }
      .edicion-fecha { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .08em;
        margin-top: 1px; }

      /* Edition date selector — dropdown of available editions */
      .edicion-selector { display: flex; justify-content: center; margin-top: 6px; }
      .edicion-select { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        border: 1px solid var(--ho-green, #6E8345); border-radius: 6px;
        padding: 4px 10px; font-weight: 600; cursor: pointer;
        appearance: none; -webkit-appearance: none;
        text-align: center; text-align-last: center; }

      /* Feed card — noticia */
      .feed-card { border-radius: 13px; margin-bottom: 10px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        background: var(--ho-card, #FBFAF6); cursor: pointer;
        transition: border-color .2s; }
      .feed-card:hover { border-color: var(--ho-green, #6E8345); }

      .feed-card-img { width: 100%; height: 140px; object-fit: cover; display: block; }
      .feed-card-body { padding: 12px 14px; }

      .feed-card-fecha { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-text-mid, #6E6A60);
        padding: 2px 6px; border-radius: 5px; font-weight: 500; }

      .source-badge { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        font-weight: 600; padding: 2px 7px; border-radius: 4px; margin-left: 4px;
        background: var(--ho-green, #6E8345); color: #F2F1EC; }

      .feed-card-emoji { font-size: 1rem; margin-left: 4px; }

      .feed-card-titulo { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); margin-top: 4px;
        line-height: 1.25; }

      .feed-card-bajada { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        max-height: 2.8em; overflow: hidden; margin-top: 3px; }

      .feed-card-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

      /* ===== Popup overlay ===== */
      .popup-overlay { position: fixed; inset: 0;
        background: rgba(33,31,29,.65); z-index: 50;
        display: flex; align-items: flex-start; justify-content: center;
        padding: 16px; overflow-y: auto; -webkit-overflow-scrolling: touch;
        animation: popfade .25s ease; }

      .popup-content { background: var(--ho-card, #FBFAF6); border-radius: 13px;
        max-width: 100%; width: 380px; position: relative;
        overflow: hidden; }

      .popup-close { position: absolute; top: 10px; right: 12px;
        background: var(--ho-dark-surface, #45433E); color: var(--ho-text-off, #F2F1EC);
        width: 28px; height: 28px; border-radius: 50%; border: none;
        cursor: pointer; font-size: .85rem; z-index: 10;
        display: flex; align-items: center; justify-content: center; }

      .popup-img { width: 100%; height: 180px; object-fit: cover; display: block; }
      .popup-body { padding: 14px 16px 20px; }
      .popup-emoji { font-size: 1.2rem; }
      .popup-titulo { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.02rem; color: var(--ho-text, #2B2A26);
        margin-top: 4px; line-height: 1.2; }
      .popup-desarrollo { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.6; margin-top: 10px; }
      .popup-fuente { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 8px; font-style: italic; }
      .popup-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }

      @keyframes popfade { from { opacity: 0 } to { opacity: 1 } }
    `;
  }

  // ===== Render =====

  _formatFechaLong(fecha) {
    if (!fecha) return '';
    const parts = fecha.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return parseInt(parts[2]) + ' de ' + months[parseInt(parts[1]) - 1] + ' 2026';
  }

  _render() {
    const numero = this._meta.numero || '';
    const fecha = this._meta.fecha || '';
    const fechaShort = this._formatFecha(fecha);
    const fechaLong = this._formatFechaLong(fecha);

    // Edition navigation: ← anterior | CLIPPING N°X · fecha | próximo →
    const hasPrev = this._edicionIdx < this._ediciones.length - 1;
    const hasNext = this._edicionIdx > 0;

    // Edition selector dropdown
    const options = this._ediciones.map((ed, i) =>
      '<option value="' + i + '"' + (i === this._edicionIdx ? ' selected' : '') + '>' +
        'N°' + ed.numero + ' · ' + this._formatFecha(ed.fecha) + ' · ' + ed.semana +
      '</option>'
    ).join('');

    const edicionHeader = '<div class="edicion-header">' +
      '<div class="edicion-row">' +
        '<button class="edicion-btn" id="edPrev" ' + (hasPrev ? '' : 'disabled') + '>← anterior</button>' +
        '<div class="edicion-center">' +
          '<div class="edicion-numero">CLIPPING N°' + numero + '</div>' +
          '<div class="edicion-fecha">' + fechaLong + '</div>' +
        '</div>' +
        '<button class="edicion-btn" id="edNext" ' + (hasNext ? '' : 'disabled') + '>próximo →</button>' +
      '</div>' +
      (this._ediciones.length > 1
        ? '<div class="edicion-selector"><select class="edicion-select" id="edSelect">' + options + '</select></div>'
        : '') +
    '</div>';

    const cardsHtml = this._noticias.map(n => {
      const tagsHtml = (n.tags || []).map(t =>
        '<span class="tag">' + t + '</span>'
      ).join('');
      return '<div class="feed-card" data-id="' + (n.id || '') + '">' +
        (n.foto ? '<img class="feed-card-img" src="' + n.foto + '" alt="" loading="lazy">' : '') +
        '<div class="feed-card-body">' +
          '<span class="feed-card-fecha">' + this._formatFecha(n.fecha || this._meta.fecha) + '</span>' +
          '<span class="source-badge">📰</span>' +
          (n.emoji ? '<span class="feed-card-emoji">' + n.emoji + '</span>' : '') +
          '<div class="feed-card-titulo">' + (n.titulo || '') + '</div>' +
          '<div class="feed-card-bajada">' + (n.bajada || '') + '</div>' +
          '<div class="feed-card-tags">' + tagsHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const popupHtml = this._popupItem ? this._renderPopup(this._popupItem) : '';

    return html`
      <div class="scroll" id="clipScroll">
        ${edicionHeader}
        ${cardsHtml}
      </div>
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
          (item.emoji ? '<div class="popup-emoji">' + item.emoji + '</div>' : '') +
          '<div class="popup-titulo">' + (item.titulo || '') + '</div>' +
          '<div class="popup-desarrollo">' + (item.desarrollo || '') + '</div>' +
          (item.fuente ? '<div class="popup-fuente">Fuente: ' + item.fuente + '</div>' : '') +
          (tagsHtml ? '<div class="popup-tags">' + tagsHtml + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ===== After-render =====

  _afterRender() {
    // Edition navigation buttons
    const prevBtn = this.shadowRoot.querySelector('#edPrev');
    const nextBtn = this.shadowRoot.querySelector('#edNext');
    if (prevBtn) prevBtn.addEventListener('click', () => this._goEdition(1));   // older
    if (nextBtn) nextBtn.addEventListener('click', () => this._goEdition(-1));  // newer

    // Edition selector dropdown
    const select = this.shadowRoot.querySelector('#edSelect');
    if (select) select.addEventListener('change', () => {
      const idx = parseInt(select.value);
      if (idx >= 0 && idx < this._ediciones.length) {
        this._edicionIdx = idx;
        this._popupItem = null;
        this._loadEdition(this._ediciones[idx].archivo);
      }
    });

    // Card clicks → open popup
    this.shadowRoot.querySelectorAll('.feed-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const item = this._noticias.find(n => n.id === id);
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
