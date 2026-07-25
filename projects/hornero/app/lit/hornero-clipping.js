// ===== <hornero-clipping> — Clipping de noticias (sub-screen) =====
// Lista de noticias con popup overlay para desarrollo
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
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadClipping();
  }

  async _loadClipping() {
    try {
      const response = await fetch('data/clipping-2026-07-02.json');
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
    } catch(e) { console.warn('Clipping: load failed', e); }
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

      /* Kicker line — clipping edition */
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        color: var(--ho-green-dark, #586B33); padding: 4px 0 12px;
        background: var(--ho-green-pale, #E8EDD7); border-radius: 6px;
        padding: 6px 10px; margin-bottom: 12px; }

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

  _render() {
    const metaLabel = this._meta.numero
      ? 'CLIPPING N°' + this._meta.numero + ' · ' + this._formatFecha(this._meta.fecha)
      : 'CLIPPING';

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
        <div class="kicker">${metaLabel}</div>
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
