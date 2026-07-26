// ===== <hornero-actualidad> — Esfera Actualidad =====
// Portada: ediciones clipping + InfoMate intercalados
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
    this._ediciones = [];    // all clipping editions from index
    this._clippingData = {}; // loaded clipping data per edition (keyed by numero)
    this._mateRaw = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadAllSources();
    this.render();
  }

  // ===== Data loading =====

  async _loadAllSources() {
    // Clipping — load all editions from index
    try {
      const idxRes = await fetch('data/clipping-index.json');
      const idx = await idxRes.json();
      this._ediciones = idx.ediciones || [];

      // Load each edition
      for (const ed of this._ediciones) {
        try {
          const res = await fetch(ed.archivo);
          const data = await res.json();
          this._clippingData[ed.numero] = data;
          // Cache in IndexedDB
          if (typeof guardarClipping === 'function' && data.noticias) {
            for (const item of data.noticias) {
              await guardarClipping(item);
            }
          }
        } catch(e) { console.warn('Actualidad: edition ' + ed.numero + ' load failed', e); }
      }
    } catch(e) { console.warn('Actualidad: clipping index load failed', e); }

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

  _formatFechaShort(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return d.getDate() + ' ' + months[d.getMonth()];
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
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; position: relative;
      }
      .product-card:hover { border-color: var(--ho-green, #6E8345); }

      /* Accent stripe per type */
      .product-card-clipping { border-left: 3px solid var(--ho-green, #6E8345); }
      .product-card-infomate { border-left: 3px solid var(--ho-gold, #B0863F); }

      .product-emoji { font-size: 1.2rem; margin-bottom: 4px; }

      .product-label {
        font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text, #2B2A26); }

      .product-sublabel {
        font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .06em;
        margin-top: 1px; }

      .product-desc {
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        margin-top: 5px; }

      .product-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }
      .data-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: rgba(176,134,63,.35); color: #3D3B35;
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    `;
  }

  // ===== Render =====

  _render() {
    // Build cards: clipping editions + InfoMate intercalated
    // Order: latest clipping → InfoMate → remaining clippings (older)
    let cardsHtml = '';

    // Latest clipping edition (N°4) first
    for (let i = 0; i < this._ediciones.length; i++) {
      const ed = this._ediciones[i];
      const data = this._clippingData[ed.numero];
      const label = 'CLIPPING N°' + ed.numero;
      const sublabel = this._formatFechaShort(ed.fecha) + ' · ' + ed.semana;
      const desc = data && data.noticias
        ? (data.noticias.length + ' noticias laborales con análisis sindical')
        : 'Noticias laborales con análisis sindical';
      const tags = data && data.noticias && data.noticias[0]
        ? (data.noticias[0].tags || []).slice(0, 4).map(t => '<span class="tag">' + t + '</span>').join('')
        : '';

      cardsHtml += '<div class="product-card product-card-clipping" data-screen="clipping" data-edicion="' + ed.numero + '">' +
        '<div class="product-emoji">📰</div>' +
        '<div class="product-label">' + label + '</div>' +
        '<div class="product-sublabel">' + sublabel + '</div>' +
        '<div class="product-desc">' + desc + '</div>' +
        (tags ? '<div class="product-tags">' + tags + '</div>' : '') +
      '</div>';

      // Insert InfoMate after the latest clipping (i=0)
      if (i === 0) {
        const mateLabel = this._mateRaw && this._mateRaw.meta
          ? 'INFOMATE'
          : 'INFOMATE';
        const mateSublabel = this._mateRaw && this._mateRaw.meta
          ? this._formatMes(this._mateRaw.meta.mes)
          : '';
        const mateDesc = this._mateRaw && this._mateRaw.secciones
          ? (this._mateRaw.secciones.length + ' secciones: ' + this._mateRaw.secciones.map(s => s.titulo.toLowerCase()).join(', '))
          : 'Panorama económico-laboral mensual';
        const mateTags = this._mateRaw && this._mateRaw.datosMacro
          ? ['SMVM', 'Inflación', 'Canasta básica', 'Empleo'].map(t => '<span class="data-tag">' + t + '</span>').join('')
          : '';

        cardsHtml += '<div class="product-card product-card-infomate" data-screen="infomate">' +
          '<div class="product-emoji">🧮</div>' +
          '<div class="product-label">' + mateLabel + '</div>' +
          '<div class="product-sublabel">' + mateSublabel + '</div>' +
          '<div class="product-desc">' + mateDesc + '</div>' +
          (mateTags ? '<div class="product-tags">' + mateTags + '</div>' : '') +
        '</div>';
      }
    }

    return html`
      <div class="scroll">
        ${cardsHtml}
      </div>
    `;
  }

  // ===== After-render =====

  _afterRender() {
    // Bind product card clicks → navigate to sub-screen
    this.shadowRoot.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const screen = card.dataset.screen;
        const edicion = card.dataset.edicion;
        // If clipping card, pass edition info so clipping screen can navigate
        if (screen === 'clipping' && edicion) {
          // Navigate to clipping screen — the screen will load the latest by default
          // but user can use calendar/arrows to find the right edition
          this.goScreen('clipping');
        } else {
          this.goScreen(screen);
        }
      });
    });
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
