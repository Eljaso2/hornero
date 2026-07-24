// ===== <hornero-actualidad> — Esfera Actualidad =====
// Stacked carousels: Clipping · InfoMate · Reporte Gremial
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroActualidad extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      clippingIndex: Number,
      mateIndex: Number,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.clippingIndex = 0;
    this.mateIndex = 0;
    this._clipping = [];
    this._clippingMeta = {};
    this._mate = null;
    this._mateMeta = {};
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadData();
  }

  async _loadData() {
    // Load clipping
    try {
      const response = await fetch('data/clipping-2026-07-02.json');
      const data = await response.json();
      if (data.noticias) {
        this._clipping = data.noticias;
        this._clippingMeta = data.meta || {};
        // Cache in IndexedDB
        if (typeof guardarClipping === 'function') {
          for (const item of data.noticias) {
            await guardarClipping(item);
          }
        }
      }
    } catch(e) { console.warn('Actualidad: clipping load failed', e); }

    // Load Mate
    try {
      const response = await fetch('data/mate-2026-05.json');
      const data = await response.json();
      this._mate = data;
      this._mateMeta = data.meta || {};
    } catch(e) { console.warn('Actualidad: mate load failed', e); }

    this.render();
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      /* ===== Scrollable container for stacked carousels ===== */
      .carousels-scroll { flex: 1; overflow-y: auto;
        -webkit-overflow-scrolling: touch; padding: 0 16px 16px; }

      /* ===== Carousel section ===== */
      .carousel-section { margin-bottom: 20px; }

      /* ===== Carousel header — label + número + fecha ===== */
      .carousel-header { display: flex; align-items: center; gap: 8px;
        margin-bottom: 10px; }
      .carousel-label { font-family: 'JetBrains Mono', monospace;
        font-size: .68rem; font-weight: 600; letter-spacing: .14em;
        text-transform: uppercase; color: #2B2A26; }
      .carousel-num { font-family: 'JetBrains Mono', monospace;
        font-size: .68rem; font-weight: 700; color: var(--ho-green, #6E8345); }
      .carousel-date { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; font-weight: 500; color: #6E6A60; }
      .carousel-status { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; font-weight: 500; color: #9C988D; }

      /* ===== Carousel — reuse Home pattern ===== */
      .carousel-wrap { position: relative; margin-bottom: 8px;
        margin-left: -16px; margin-right: -16px; overflow: hidden; }
      .carousel-track { display: flex; overflow-x: auto;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; }
      .carousel-track::-webkit-scrollbar { width: 0; }

      /* ===== News slide — same as Home ===== */
      .news-slide { scroll-snap-align: start; width: 100%; flex-shrink: 0;
        position: relative; min-height: 260px;
        background: var(--ho-dark, #33312D); }
      .news-slide img { width: 100%; height: 260px; object-fit: cover;
        display: block; }
      .news-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.85));
        color: #F2F1EC; }
      .news-title { font-family: 'Archivo Narrow', sans-serif; font-weight: 800;
        font-size: 1.32rem; line-height: 1.18; letter-spacing: .02em;
        text-transform: uppercase; }
      .news-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .news-tag { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        background: rgba(110,131,69,.6); color: #F2F1EC;
        padding: 2px 6px; border-radius: 4px; font-weight: 600; }

      /* ===== Último badge ===== */
      .ultimo-badge { font-family: 'JetBrains Mono', monospace;
        font-size: .56rem; font-weight: 700; letter-spacing: .06em;
        background: var(--ho-green, #6E8345); color: #F2F1EC;
        padding: 2px 7px; border-radius: 4px;
        position: absolute; top: 10px; right: 12px; }

      /* ===== Mate slide (no photo, dark bg) ===== */
      .mate-slide { scroll-snap-align: start; width: 100%; flex-shrink: 0;
        position: relative; min-height: 260px;
        background: var(--ho-dark-surface, #45433E); }
      .mate-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.85));
        color: #F2F1EC; }
      .mate-title { font-family: 'Archivo Narrow', sans-serif; font-weight: 800;
        font-size: 1.1rem; line-height: 1.18; letter-spacing: .02em;
        text-transform: uppercase; }
      .mate-bajada { font-size: .78rem; color: #C8C4BC; line-height: 1.4;
        margin-top: 4px; }
      .mate-data { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .mate-data-tag { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        background: rgba(176,134,63,.6); color: #F2F1EC;
        padding: 2px 6px; border-radius: 4px; font-weight: 600; }

      /* ===== Reporte Gremial gate slide ===== */
      .gremial-slide { scroll-snap-align: start; width: 100%; flex-shrink: 0;
        min-height: 260px; background: var(--ho-dark, #33312D);
        display: flex; align-items: center; justify-content: center;
        position: relative; }
      .gremial-content { text-align: center; padding: 30px 20px;
        color: #F2F1EC; }
      .gremial-icon { font-size: 2.4rem; margin-bottom: 12px; }
      .gremial-title { font-family: 'Archivo Narrow', sans-serif; font-weight: 800;
        font-size: 1rem; text-transform: uppercase; margin-bottom: 8px; }
      .gremial-desc { font-size: .82rem; color: #9C988D; line-height: 1.4; }
      .gremial-note { font-size: .72rem; color: #7A766D; margin-top: 12px; }

      /* ===== Carousel dots ===== */
      .carousel-dots { display: flex; justify-content: center; gap: 5px;
        padding: 8px 0; }
      .dot { width: 6px; height: 6px; border-radius: 50%;
        background: #9C988D; transition: background .2s; cursor: pointer; }
      .dot.active { background: #6E8345; }

      /* ===== Disclaimer ===== */
      .mate-disclaimer { background: var(--ho-green-pale, #E8EDD7); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #586B33);
        margin: 0 16px 16px; line-height: 1.4; }
    `;
  }

  _render() {
    // --- Clipping carousel ---
    const clippingHeader = this._buildClippingHeader();
    const clippingSlides = this._buildClippingSlides();
    const clippingDots = this._clipping.map((_, i) =>
      '<span class="dot' + (i === this.clippingIndex ? ' active' : '') + '" data-index="' + i + '" data-carousel="clipping"></span>'
    ).join('');

    // --- InfoMate carousel ---
    const mateSections = this._mate ? (this._mate.secciones || []) : [];
    const mateHeader = this._buildMateHeader();
    const mateSlides = this._buildMateSlides();
    const mateDots = mateSections.map((_, i) =>
      '<span class="dot' + (i === this.mateIndex ? ' active' : '') + '" data-index="' + i + '" data-carousel="mate"></span>'
    ).join('');

    // --- Reporte Gremial ---
    const gremialSection = this._buildGremialSection();

    return html`
      <div class="carousels-scroll">

        <!-- CLIPPING -->
        <div class="carousel-section">
          ${clippingHeader}
          <div class="carousel-wrap">
            <div class="carousel-track" id="clippingTrack">
              ${clippingSlides}
            </div>
          </div>
          <div class="carousel-dots" id="clippingDots">
            ${clippingDots}
          </div>
        </div>

        <!-- INFOMATE -->
        <div class="carousel-section">
          ${mateHeader}
          ${mateSlides ? '<div class="carousel-wrap"><div class="carousel-track" id="mateTrack">' + mateSlides + '</div></div><div class="carousel-dots" id="mateDots">' + mateDots + '</div>' : ''}
          ${this._mate ? '<div class="mate-disclaimer">⚠️ Datos reorganizados con categorías del campo obrero (Inigo Carrera / PIMSA), no categorías INDEC. La IA propone — vos decidís.</div>' : ''}
        </div>

        <!-- REPORTE GREMIAL -->
        ${gremialSection}

      </div>
    `;
  }

  // ===== Header builders =====

  _buildClippingHeader() {
    const meta = this._clippingMeta;
    const num = meta.numero ? 'N°' + meta.numero : '';
    const fecha = meta.fecha || meta.semana || '';
    return '<div class="carousel-header">' +
      '<span class="carousel-label">📰 Clipping</span>' +
      (num ? '<span class="carousel-num">' + num + '</span>' : '') +
      (fecha ? '<span class="carousel-date">' + fecha + '</span>' : '') +
    '</div>';
  }

  _buildMateHeader() {
    const meta = this._mateMeta;
    const mes = meta.mes || '';
    const mesLabel = mes ? this._formatMes(mes) : '';
    return '<div class="carousel-header">' +
      '<span class="carousel-label">🧮 InfoMate</span>' +
      (mesLabel ? '<span class="carousel-date">' + mesLabel + '</span>' : '') +
    '</div>';
  }

  _formatMes(mesStr) {
    // "2026-05" → "mayo 2026"
    const parts = mesStr.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const m = parseInt(parts[1]) - 1;
    return months[m] + ' ' + parts[0];
  }

  // ===== Slide builders =====

  _buildClippingSlides() {
    return this._clipping.map((n, i) => {
      const isUltimo = i === this._clipping.length - 1;
      const tagsHtml = (n.tags || []).map(t =>
        '<span class="news-tag">' + t + '</span>'
      ).join('');
      return '<div class="news-slide" data-index="' + i + '">' +
        (n.foto ? '<img src="' + n.foto + '" alt="" loading="lazy">' : '') +
        '<div class="news-overlay">' +
          (isUltimo ? '<span class="ultimo-badge">último</span>' : '') +
          '<div class="news-title">' + (n.emoji || '') + ' ' + (n.titulo || '') + '</div>' +
          '<div class="news-tags">' + tagsHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  _buildMateSlides() {
    if (!this._mate) return '';
    const sections = this._mate.secciones || [];
    return sections.map((s, i) => {
      const isUltimo = i === sections.length - 1;
      const dataTagsHtml = (s.datos || []).map(d =>
        '<span class="mate-data-tag">' + d + '</span>'
      ).join('');
      return '<div class="mate-slide" data-index="' + i + '">' +
        '<div class="mate-overlay">' +
          (isUltimo ? '<span class="ultimo-badge">último</span>' : '') +
          '<div class="mate-title">' + s.titulo + '</div>' +
          '<div class="mate-bajada">' + s.bajada + '</div>' +
          '<div class="mate-data">' + dataTagsHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  _buildGremialSection() {
    return '<div class="carousel-section">' +
      '<div class="carousel-header">' +
        '<span class="carousel-label">✊ Reporte Gremial</span>' +
        '<span class="carousel-status">pendiente</span>' +
      '</div>' +
      '<div class="carousel-wrap">' +
        '<div class="carousel-track">' +
          '<div class="gremial-slide">' +
            '<span class="ultimo-badge">último</span>' +
            '<div class="gremial-content">' +
              '<div class="gremial-icon">✊</div>' +
              '<div class="gremial-title">Situación sindical</div>' +
              '<div class="gremial-desc">La federación aún no ha aprobado la publicación de su reporte sindical.</div>' +
              '<div class="gremial-note">Esta sección se activa cuando una federación o unión (grade 4) aprueba publicar su informe gremial. Solo se muestra contenido aprobado — no speculation.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  _afterRender() {
    // Carousel scroll → update dots (same logic as Home)
    this._bindCarousel('clipping');
    this._bindCarousel('mate');
  }

  _bindCarousel(name) {
    const track = this.shadowRoot.querySelector('#' + name + 'Track');
    const dots = this.shadowRoot.querySelector('#' + name + 'Dots');
    if (!track) return;

    // Scroll → update dots
    track.addEventListener('scroll', () => {
      const idx = Math.round(track.scrollLeft / track.offsetWidth);
      const prop = name === 'clipping' ? 'clippingIndex' : 'mateIndex';
      if (idx >= 0 && idx !== this[prop]) {
        this[prop] = idx;
        if (dots) {
          dots.querySelectorAll('.dot').forEach((d, i) => {
            d.classList.toggle('active', i === idx);
          });
        }
      }
    });

    // Dot click → scroll to slide
    if (dots) {
      dots.querySelectorAll('.dot').forEach(d => {
        d.addEventListener('click', () => {
          const idx = parseInt(d.dataset.index);
          track.scrollTo({ left: idx * track.offsetWidth, behavior: 'smooth' });
        });
      });
    }
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
