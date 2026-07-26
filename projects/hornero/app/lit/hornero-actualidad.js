// ===== <hornero-actualidad> — Esfera Actualidad =====
// Portada: 3 productos (Clipping, InfoMate, Reporte Gremial)
// Cada card navega a sub-screen con contenido completo
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
    this._clippingRaw = null;
    this._mateRaw = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadAllSources();
    this.render();
  }

  // ===== Data loading =====

  async _loadAllSources() {
    // Clipping — load latest edition from index
    try {
      const idxRes = await fetch('data/clipping-index.json');
      const idx = await idxRes.json();
      const latest = (idx.ediciones && idx.ediciones[0])
        ? idx.ediciones[0].archivo
        : 'data/clipping-2026-07-02.json';
      const response = await fetch(latest);
      this._clippingRaw = await response.json();
      if (typeof guardarClipping === 'function' && this._clippingRaw.noticias) {
        for (const item of this._clippingRaw.noticias) {
          await guardarClipping(item);
        }
      }
    } catch(e) { console.warn('Actualidad: clipping load failed', e); }

    // InfoMate
    try {
      const response = await fetch('data/mate-2026-05.json');
      this._mateRaw = await response.json();
    } catch(e) { console.warn('Actualidad: mate load failed', e); }
  }

  _formatMes(mesStr) {
    if (!mesStr) return '';
    const parts = mesStr.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return months[parseInt(parts[1]) - 1] + ' ' + parts[0];
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

      /* Product card base */
      .product-card {
        background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 16px 14px; margin-bottom: 12px;
        cursor: pointer; transition: border-color .2s; position: relative;
      }
      .product-card:hover { border-color: var(--ho-green, #6E8345); }

      /* Accent stripe per type */
      .product-card-clipping { border-left: 3px solid var(--ho-green, #6E8345); }
      .product-card-infomate { border-left: 3px solid var(--ho-gold, #B0863F); }
      .product-card-gremial { border-left: 3px solid var(--ho-dark, #33312D); }

      .product-emoji { font-size: 1.4rem; margin-bottom: 6px; }

      .product-label {
        font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text, #2B2A26); }

      .product-desc {
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        margin-top: 6px; }

      .product-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }
      .data-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: rgba(176,134,63,.35); color: #3D3B35;
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

      .product-note {
        font-family: 'Archivo', sans-serif; font-size: .72rem;
        color: var(--ho-gold, #B0863F); font-weight: 600;
        margin-top: 8px; }
    `;
  }

  // ===== Render =====

  _render() {
    // Clipping label
    const clippingLabel = this._clippingRaw && this._clippingRaw.meta
      ? 'CLIPPING N°' + (this._clippingRaw.meta.numero || '') + ' · ' + this._formatFecha(this._clippingRaw.meta.fecha)
      : 'CLIPPING';
    const clippingDesc = this._clippingRaw && this._clippingRaw.noticias
      ? (this._clippingRaw.noticias.length + ' noticias laborales con análisis sindical')
      : 'Noticias laborales con análisis sindical';
    const clippingTags = this._clippingRaw && this._clippingRaw.noticias && this._clippingRaw.noticias[0]
      ? (this._clippingRaw.noticias[0].tags || []).slice(0, 4).map(t => '<span class="tag">' + t + '</span>').join('')
      : '';

    // InfoMate label
    const mateLabel = this._mateRaw && this._mateRaw.meta
      ? 'INFOMATE · ' + this._formatMes(this._mateRaw.meta.mes)
      : 'INFOMATE';
    const mateDesc = this._mateRaw && this._mateRaw.secciones
      ? (this._mateRaw.secciones.length + ' secciones: ' + this._mateRaw.secciones.map(s => s.titulo.toLowerCase()).join(', '))
      : 'Panorama económico-laboral mensual';
    const mateTags = this._mateRaw && this._mateRaw.datosMacro
      ? ['SMVM', 'Inflación', 'Canasta básica', 'Empleo'].map(t => '<span class="data-tag">' + t + '</span>').join('')
      : '';

    // Gremial label (placeholder, will become dynamic)
    const gremioName = 'FOEIAP';
    const gremialLabel = 'REPORTE GREMIAL · ' + gremioName;

    return html`
      <div class="scroll">
        <!-- Clipping -->
        <div class="product-card product-card-clipping" data-screen="clipping">
          <div class="product-emoji">📰</div>
          <div class="product-label">${clippingLabel}</div>
          <div class="product-desc">${clippingDesc}</div>
          ${clippingTags ? '<div class="product-tags">' + clippingTags + '</div>' : ''}
        </div>

        <!-- InfoMate -->
        <div class="product-card product-card-infomate" data-screen="infomate">
          <div class="product-emoji">🧮</div>
          <div class="product-label">${mateLabel}</div>
          <div class="product-desc">${mateDesc}</div>
          ${mateTags ? '<div class="product-tags">' + mateTags + '</div>' : ''}
        </div>

        <!-- Reporte Gremial -->
        <div class="product-card product-card-gremial" data-screen="gremial">
          <div class="product-emoji">✊</div>
          <div class="product-label">${gremialLabel}</div>
          <div class="product-desc">Informe sindical de la federación</div>
          <div class="product-note">Pendiente aprobación</div>
        </div>
      </div>
    `;
  }

  // ===== After-render =====

  _afterRender() {
    // Bind product card clicks → navigate to sub-screen
    this.shadowRoot.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        this.goScreen(card.dataset.screen);
      });
    });
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
