// ===== <hornero-actualidad> — Esfera Actualidad =====
// Portada: ediciones clipping (títulos + tags) + InfoMate intercalados
// Cada card navega a sub-screen con edición específica
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

      for (const ed of this._ediciones) {
        try {
          const res = await fetch(ed.archivo);
          const data = await res.json();
          this._clippingData[ed.numero] = data;
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

      .product-title-line { display: flex; align-items: baseline; gap: 6px; }
      .product-emoji { font-size: 1rem; }
      .product-label {
        font-family: 'Archivo', sans-serif; font-size: .92rem;
        font-weight: 700; color: var(--ho-text, #2B2A26); }

      .product-sublabel {
        font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .06em;
        margin-top: 1px; }

      /* Noticia mini-list inside clipping card */
      .noticia-list { margin-top: 8px; }
      .noticia-line { display: flex; align-items: baseline; gap: 4px;
        padding: 2px 0; }
      .noticia-line.hidden { display: none; }
      .noticia-emoji { font-size: .78rem; }
      .noticia-title { font-family: 'Archivo', sans-serif; font-size: .88rem;
        color: var(--ho-text, #2B2A26); line-height: 1.25;
        font-weight: 700; flex: 1; }
      .noticia-tag { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 2px 6px; border-radius: 4px; font-weight: 600;
        white-space: nowrap; }

      /* Expand/collapse toggle */
      .noticia-toggle {
        font-family: 'JetBrains Mono', monospace; font-size: .64rem;
        color: var(--ho-green, #6E8345); cursor: pointer;
        padding: 4px 0 2px; letter-spacing: .06em;
        font-weight: 600; user-select: none;
        transition: color .2s; }
      .noticia-toggle:hover { color: var(--ho-green-dark, #586B33); }

      /* InfoMate section */
      .mate-desc {
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        margin-top: 5px; }

      .data-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
      .data-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: rgba(176,134,63,.35); color: #3D3B35;
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }
    `;
  }

  // ===== Render =====

  _render() {
    let cardsHtml = '';

    for (let i = 0; i < this._ediciones.length; i++) {
      const ed = this._ediciones[i];
      const data = this._clippingData[ed.numero];
      const label = 'CLIPPING N°' + ed.numero;
      const sublabel = this._formatFechaShort(ed.fecha) + ' · ' + ed.semana;

      // Build noticia mini-list: first one visible, rest collapsible
      let noticiaList = '';
      if (data && data.noticias && data.noticias.length > 0) {
        noticiaList = '<div class="noticia-list">';
        for (let ni = 0; ni < data.noticias.length; ni++) {
          const n = data.noticias[ni];
          const firstTag = (n.tags && n.tags[0]) ? '<span class="noticia-tag">' + n.tags[0] + '</span>' : '';
          const hiddenClass = (ni > 0) ? ' hidden' : '';
          noticiaList += '<div class="noticia-line' + hiddenClass + '" data-noticia-idx="' + ni + '">' +
            (n.emoji ? '<span class="noticia-emoji">' + n.emoji + '</span>' : '') +
            '<span class="noticia-title">' + (n.titulo || '') + '</span>' +
            firstTag +
          '</div>';
        }
        // Add toggle if more than 1 noticia
        if (data.noticias.length > 1) {
          const restCount = data.noticias.length - 1;
          noticiaList += '<div class="noticia-toggle" data-expanded="false" data-clip-edicion="' + ed.numero + '">'
            + '▾ Ver ' + restCount + ' más</div>';
        }
        noticiaList += '</div>';
      }

      cardsHtml += '<div class="product-card product-card-clipping" data-screen="clipping" data-clip-edicion="' + ed.numero + '">' +
        '<div class="product-title-line"><span class="product-emoji">📰</span>' +
        '<span class="product-label">' + label + '</span></div>' +
        '<div class="product-sublabel">' + sublabel + '</div>' +
        noticiaList +
      '</div>';

      // Insert InfoMate after the latest clipping (i=0)
      if (i === 0) {
        const mateLabel = 'INFOMATE';
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
          '<div class="product-title-line"><span class="product-emoji">🧮</span>' +
          '<span class="product-label">' + mateLabel + '</span></div>' +
          '<div class="product-sublabel">' + mateSublabel + '</div>' +
          '<div class="mate-desc">' + mateDesc + '</div>' +
          (mateTags ? '<div class="data-tags">' + mateTags + '</div>' : '') +
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
    this.shadowRoot.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking the toggle
        if (e.target.closest('.noticia-toggle')) return;
        const screen = card.dataset.screen;
        const clipEdicion = card.dataset.clipEdicion;
        if (screen === 'clipping' && clipEdicion) {
          this.emit('screen-change', { screen: 'clipping', clipEdicion: parseInt(clipEdicion) });
        } else {
          this.goScreen(screen);
        }
      });
    });

    // Toggle expand/collapse for noticia lists
    this.shadowRoot.querySelectorAll('.noticia-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = toggle.dataset.expanded === 'true';
        const clipNum = toggle.dataset.clipEdicion;
        const list = toggle.closest('.noticia-list');
        const totalNoticias = list.querySelectorAll('.noticia-line');
        const restCount = totalNoticias.length - 1;

        if (expanded) {
          // Collapse: hide all except first
          totalNoticias.forEach((line, idx) => {
            if (idx > 0) line.classList.add('hidden');
          });
          toggle.dataset.expanded = 'false';
          toggle.textContent = '▾ Ver ' + restCount + ' más';
        } else {
          // Expand: show all
          totalNoticias.forEach(line => line.classList.remove('hidden'));
          toggle.dataset.expanded = 'true';
          toggle.textContent = '▴ Ver menos';
        }
      });
    });
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
