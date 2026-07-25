// ===== <hornero-actualidad> — Esfera Actualidad =====
// Timeline mezclado: Noticias + InfoMate + Reporte Gremial
// Infinite scroll: 10 items → scroll → 10 más → ...
// Noticias: card con foto/título/bajada/tags → tap → popup overlay con desarrollo
// InfoMate: card con data tags, no popup
// Reporte Gremial: gate card, pendiente aprobación
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroActualidad extends HoComponent {
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
    this._allItems = [];
    this._visibleCount = 10;
    this._popupItem = null;
    this._observer = null;
    this._clippingRaw = null;
    this._mateRaw = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadAllSources();
    this._mergeTimeline();
    this.render();
  }

  // ===== Data loading =====

  async _loadAllSources() {
    // Clipping (noticias)
    try {
      const response = await fetch('data/clipping-2026-07-02.json');
      const data = await response.json();
      this._clippingRaw = data;
      // Cache in IndexedDB
      if (typeof guardarClipping === 'function' && data.noticias) {
        for (const item of data.noticias) {
          await guardarClipping(item);
        }
      }
    } catch(e) { console.warn('Actualidad: clipping load failed', e); }

    // InfoMate
    try {
      const response = await fetch('data/mate-2026-05.json');
      const data = await response.json();
      this._mateRaw = data;
    } catch(e) { console.warn('Actualidad: mate load failed', e); }
  }

  // ===== Merge 3 sources → unified timeline =====

  _mergeTimeline() {
    const items = [];

    // Noticias from clipping
    if (this._clippingRaw && this._clippingRaw.noticias) {
      for (const n of this._clippingRaw.noticias) {
        items.push({
          id: n.id || 'n-' + Math.random().toString(36).slice(2),
          tipo: 'noticia',
          fecha: n.fecha || this._clippingRaw.meta.fecha || '2026-07-01',
          titulo: n.titulo || '',
          bajada: n.bajada || '',
          desarrollo: n.desarrollo || '',
          foto: n.foto || '',
          tags: n.tags || [],
          fuente: n.fuente || '',
          emoji: n.emoji || '',
        });
      }
    }

    // InfoMate sections
    if (this._mateRaw && this._mateRaw.secciones) {
      const mateFecha = this._mateRaw.meta.mes || '2026-05';
      const mateMesLabel = this._formatMes(mateFecha);
      for (const s of this._mateRaw.secciones) {
        items.push({
          id: 'mate-' + s.titulo.toLowerCase().replace(/\s+/g, '-'),
          tipo: 'mate',
          fecha: mateFecha,
          fechaLabel: mateMesLabel,
          titulo: s.titulo || '',
          bajada: s.bajada || '',
          datos: s.datos || [],
        });
      }
    }

    // Reporte Gremial placeholder
    items.push({
      id: 'gremial-placeholder',
      tipo: 'gremial',
      fecha: '2026-07-01',
      titulo: 'Reporte Gremial',
    });

    // Sort: most recent first
    items.sort((a, b) => b.fecha.localeCompare(a.fecha));

    this._allItems = items;
  }

  _formatMes(mesStr) {
    // "2026-05" → "mayo 2026"
    const parts = mesStr.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const m = parseInt(parts[1]) - 1;
    return months[m] + ' ' + parts[0];
  }

  _formatFecha(fecha) {
    // "2026-07-02" → "02/07"
    if (!fecha) return '';
    const parts = fecha.split('-');
    if (parts.length === 2) return this._formatMes(fecha); // "2026-05" → "mayo 2026"
    return parts[2] + '/' + parts[1];
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      /* Feed scroll container */
      .feed-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 12px 16px 16px; scrollbar-width: none; }
      .feed-scroll::-webkit-scrollbar { width: 0; }

      /* Feed card — base */
      .feed-card { border-radius: 13px; margin-bottom: 10px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        transition: border-color .2s; }

      /* Noticia card — white bg, clickable */
      .feed-card-noticia { background: var(--ho-card, #FBFAF6); cursor: pointer; }
      .feed-card-noticia:hover { border-color: var(--ho-green, #6E8345); }

      /* Mate card — pale green bg, not clickable */
      .feed-card-mate { background: var(--ho-green-pale, #E8EDD7); cursor: default; }

      /* Gremial card — dark bg, not clickable */
      .feed-card-gremial { background: var(--ho-dark, #33312D); cursor: default; }

      /* Card image */
      .feed-card-img { width: 100%; height: 140px; object-fit: cover; display: block; }

      /* Card body */
      .feed-card-body { padding: 12px 14px; }

      /* Card fecha badge */
      .feed-card-fecha { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-text-mid, #6E6A60);
        padding: 2px 6px; border-radius: 5px; font-weight: 500; }

      /* Card emoji inline */
      .feed-card-emoji { font-size: 1rem; margin-left: 4px; }

      /* Card titulo */
      .feed-card-titulo { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); margin-top: 4px;
        line-height: 1.25; }

      /* Card bajada — clipped to ~2 lines */
      .feed-card-bajada { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        max-height: 2.8em; overflow: hidden; margin-top: 3px; }

      /* Tags row */
      .feed-card-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

      /* Mate data tags — gold tinted */
      .feed-card-data-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .data-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: rgba(176,134,63,.35); color: #3D3B35;
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

      /* Gremial card inner */
      .feed-card-icon { font-size: 2rem; margin-bottom: 8px; }
      .feed-card-desc { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: #9C988D; line-height: 1.4; }
      .feed-card-note { font-family: 'Public Sans', sans-serif; font-size: .72rem;
        color: #7A766D; margin-top: 10px; line-height: 1.4; }

      /* Sentinel — infinite scroll trigger */
      .feed-sentinel { height: 40px; display: flex; justify-content: center;
        align-items: center; color: var(--ho-text-light, #9C988D);
        font-family: 'JetBrains Mono', monospace; font-size: .68rem; }
      .feed-sentinel.hidden { display: none; }

      /* Source label badge — colored per source */
      .source-badge { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        font-weight: 600; padding: 2px 7px; border-radius: 4px; margin-left: 4px; }
      .source-badge.noticia { background: var(--ho-green, #6E8345); color: #F2F1EC; }
      .source-badge.mate { background: var(--ho-gold, #B0863F); color: #F2F1EC; }
      .source-badge.gremial { background: var(--ho-dark-surface, #45433E); color: #F2F1EC; }

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
    const visible = this._allItems.slice(0, this._visibleCount);
    const hasMore = this._visibleCount < this._allItems.length;

    const cardsHtml = visible.map(item => this._renderCard(item)).join('');
    const sentinelHtml = hasMore
      ? '<div class="feed-sentinel" id="feedSentinel">↓ más contenido</div>'
      : '<div class="feed-sentinel hidden" id="feedSentinel"></div>';

    const popupHtml = this._popupItem ? this._renderPopup(this._popupItem) : '';

    return html`
      <div class="feed-scroll" id="feedScroll">
        ${cardsHtml}
        ${sentinelHtml}
      </div>
      ${popupHtml}
    `;
  }

  // ===== Card renderers =====

  _renderCard(item) {
    if (item.tipo === 'noticia') return this._renderNoticiaCard(item);
    if (item.tipo === 'mate') return this._renderMateCard(item);
    if (item.tipo === 'gremial') return this._renderGremialCard(item);
    return '';
  }

  _renderNoticiaCard(item) {
    const tagsHtml = (item.tags || []).map(t =>
      '<span class="tag">' + t + '</span>'
    ).join('');

    return '<div class="feed-card feed-card-noticia" data-id="' + item.id + '">' +
      (item.foto ? '<img class="feed-card-img" src="' + item.foto + '" alt="" loading="lazy">' : '') +
      '<div class="feed-card-body">' +
        '<span class="feed-card-fecha">' + this._formatFecha(item.fecha) + '</span>' +
        '<span class="source-badge noticia">📰</span>' +
        (item.emoji ? '<span class="feed-card-emoji">' + item.emoji + '</span>' : '') +
        '<div class="feed-card-titulo">' + item.titulo + '</div>' +
        '<div class="feed-card-bajada">' + item.bajada + '</div>' +
        '<div class="feed-card-tags">' + tagsHtml + '</div>' +
      '</div>' +
    '</div>';
  }

  _renderMateCard(item) {
    const dataTagsHtml = (item.datos || []).map(d =>
      '<span class="data-tag">' + d + '</span>'
    ).join('');

    return '<div class="feed-card feed-card-mate" data-id="' + item.id + '">' +
      '<div class="feed-card-body">' +
        '<span class="feed-card-fecha">' + (item.fechaLabel || this._formatFecha(item.fecha)) + '</span>' +
        '<span class="source-badge mate">🧮</span>' +
        '<div class="feed-card-titulo">' + item.titulo + '</div>' +
        '<div class="feed-card-bajada">' + item.bajada + '</div>' +
        '<div class="feed-card-data-tags">' + dataTagsHtml + '</div>' +
      '</div>' +
    '</div>';
  }

  _renderGremialCard(item) {
    return '<div class="feed-card feed-card-gremial" data-id="' + item.id + '">' +
      '<div class="feed-card-body" style="text-align:center;padding:20px 14px">' +
        '<span class="source-badge gremial">✊</span>' +
        '<div class="feed-card-icon">✊</div>' +
        '<div class="feed-card-titulo" style="color:#F2F1EC">' + item.titulo + '</div>' +
        '<div class="feed-card-desc">La federación aún no ha aprobado la publicación de su reporte sindical.</div>' +
        '<div class="feed-card-note">Esta sección se activa cuando una federación o unión (grade 4) aprueba publicar su informe gremial. Solo se muestra contenido aprobado.</div>' +
      '</div>' +
    '</div>';
  }

  // ===== Popup renderer =====

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
          '<div class="popup-titulo">' + item.titulo + '</div>' +
          '<div class="popup-desarrollo">' + item.desarrollo + '</div>' +
          (item.fuente ? '<div class="popup-fuente">Fuente: ' + item.fuente + '</div>' : '') +
          (tagsHtml ? '<div class="popup-tags">' + tagsHtml + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ===== After-render bindings =====

  _afterRender() {
    // Infinite scroll: IntersectionObserver on sentinel
    this._setupInfiniteScroll();

    // Noticia card clicks → open popup
    this.shadowRoot.querySelectorAll('.feed-card-noticia').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const item = this._allItems.find(i => i.id === id);
        if (item) this._openPopup(item);
      });
    });

    // Popup close buttons
    if (this._popupItem) {
      const closeBtn = this.shadowRoot.querySelector('#popupClose');
      if (closeBtn) closeBtn.addEventListener('click', () => this._closePopup());

      const overlay = this.shadowRoot.querySelector('#popupOverlay');
      if (overlay) overlay.addEventListener('click', (e) => {
        // Close only if clicked on overlay bg (not popup-content)
        if (e.target === overlay) this._closePopup();
      });
    }
  }

  // ===== Infinite scroll =====

  _setupInfiniteScroll() {
    // Disconnect previous observer
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    const sentinel = this.shadowRoot.querySelector('#feedSentinel');
    const feedScroll = this.shadowRoot.querySelector('#feedScroll');
    if (!sentinel || this._visibleCount >= this._allItems.length) return;

    // Use feed-scroll as root — IntersectionObserver works inside Shadow DOM
    this._observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this._visibleCount += 10;
          this.render();
        }
      }
    }, { root: feedScroll || null, rootMargin: '200px' });

    this._observer.observe(sentinel);
  }

  // ===== Popup =====

  _openPopup(item) {
    // Save scroll position before popup overlays the feed
    const scroll = this.shadowRoot.querySelector('#feedScroll');
    if (scroll) this._savedScrollTop = scroll.scrollTop;
    this._popupItem = item;
    this.render();
  }

  _closePopup() {
    this._popupItem = null;
    this.render();
    // Restore scroll position after closing popup
    const scroll = this.shadowRoot.querySelector('#feedScroll');
    if (scroll && this._savedScrollTop) {
      requestAnimationFrame(() => {
        scroll.scrollTop = this._savedScrollTop;
        this._savedScrollTop = null;
      });
    }
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
