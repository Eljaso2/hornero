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

  _formatFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','dicembre'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Normalize tag: lowercase unless it's a known acronym or proper noun
  _normalizeTag(tag) {
    // Known acronyms (all uppercase)
    const acronyms = ['CGT','CTA','OIT','CONICET','INTI','INTA','INDEC','SMVM','CLATE','CAREM','UEJN','IPYPP',
      'UTEP','FAdeA','GNL','RIGI','ILVA','Sitrarepa','CABA','CLATE','IA'];
    // Known proper nouns (keep original capitalization)
    const properNouns = ['Córdoba','Neuquén','Patagonia','Cutral-Co','Chapadmalal','Embalse','Daer','Vidal','Fate','YPF'];
    if (acronyms.includes(tag)) return tag;
    if (properNouns.includes(tag)) return tag;
    // Everything else: lowercase
    return tag.toLowerCase();
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
        border-radius: 0; padding: 14px; margin-bottom: 10px;
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
        font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .04em;
        margin-top: 2px; }

      /* Tag lines — 3 rows of keyword tags visible before expand */
      .tag-lines { margin-top: 8px; }
      .tag-line { display: flex; flex-wrap: wrap; gap: 4px; padding: 1px 0; }

      /* Noticia titles list — shown after expand */
      .noticia-list { margin-top: 8px; }
      .noticia-line { display: flex; align-items: baseline; gap: 4px;
        padding: 3px 0; }
      .noticia-line.hidden { display: none; }
      .noticia-emoji { font-size: .78rem; }
      .noticia-title { font-family: 'Public Sans', sans-serif; font-size: .84rem;
        color: var(--ho-text, #2B2A26); line-height: 1.3;
        font-weight: 500; flex: 1; }
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
      .mate-tags { margin-top: 8px; }
      .mate-sections { margin-top: 8px; }
      .mate-section-line { font-family: 'Public Sans', sans-serif; font-size: .84rem;
        color: var(--ho-text, #2B2A26); line-height: 1.3;
        font-weight: 500; padding: 3px 0; }
    `;
  }

  // ===== Render =====

  _render() {
    let cardsHtml = '';

    for (let i = 0; i < this._ediciones.length; i++) {
      const ed = this._ediciones[i];
      const data = this._clippingData[ed.numero];
      const label = 'CLIPPING N°' + ed.numero;
      const sublabel = this._formatFecha(ed.fecha);

      // Build up to 6 lines of keyword tags (collapsed view) — fixed height for all cards
      let tagLinesHtml = '';
      if (data && data.noticias && data.noticias.length > 0) {
        // Collect all unique tags from noticias
        const allTags = [];
        for (const n of data.noticias) {
          if (n.tags) {
            for (const t of n.tags) {
              if (!allTags.includes(t)) allTags.push(this._normalizeTag(t));
            }
          }
        }
        // Show up to 6 lines, ~3 tags per line = max 18 tags shown
        const maxLines = 6;
        const perLine = Math.ceil(Math.min(allTags.length, maxLines * 3) / maxLines);
        const shownTags = allTags.slice(0, maxLines * 3);
        tagLinesHtml = '<div class="tag-lines">';
        for (let li = 0; li < maxLines && li * perLine < shownTags.length; li++) {
          const lineTags = shownTags.slice(li * perLine, (li + 1) * perLine);
          tagLinesHtml += '<div class="tag-line">' +
            lineTags.map(t => '<span class="noticia-tag">' + t + '</span>').join('') +
          '</div>';
        }
        // Pad empty lines so all cards have same height
        const filledLines = Math.ceil(shownTags.length / perLine);
        for (let li = filledLines; li < maxLines; li++) {
          tagLinesHtml += '<div class="tag-line"></div>';
        }
        tagLinesHtml += '</div>';
      }

      // Build noticia titles list (expanded view)
      let noticiaList = '';
      const totalNoticias = (data && data.noticias) ? data.noticias.length : 0;
      if (totalNoticias > 0) {
        noticiaList = '<div class="noticia-list" style="display:none">';
        for (let ni = 0; ni < data.noticias.length; ni++) {
          const n = data.noticias[ni];
          noticiaList += '<div class="noticia-line">' +
            (n.emoji ? '<span class="noticia-emoji">' + n.emoji + '</span>' : '') +
            '<span class="noticia-title">' + (n.titulo || '') + '</span>' +
          '</div>';
        }
        noticiaList += '</div>';
      }

      const toggleText = totalNoticias > 0 ? '▾ Ver ' + totalNoticias + ' títulos' : '';
      cardsHtml += '<div class="product-card product-card-clipping" data-screen="clipping" data-clip-edicion="' + ed.numero + '">' +
        '<div class="product-title-line"><span class="product-emoji">📰</span>' +
        '<span class="product-label">' + label + '</span></div>' +
        '<div class="product-sublabel">' + sublabel + '</div>' +
        tagLinesHtml +
        noticiaList +
        (toggleText ? '<div class="noticia-toggle" data-expanded="false" data-clip-edicion="' + ed.numero + '">' + toggleText + '</div>' : '') +
      '</div>';

      // Insert InfoMate after the latest clipping (i=0)
      if (i === 0) {
        const mateLabel = 'INFOMATE';
        const mateSublabel = this._mateRaw && this._mateRaw.meta
          ? this._formatMes(this._mateRaw.meta.mes)
          : '';

        // Build mate tags from secciones + datosMacro keys
        let mateTagLinesHtml = '';
        if (this._mateRaw) {
          const mateTags = [];
          // Tags from section titles
          if (this._mateRaw.secciones) {
            for (const s of this._mateRaw.secciones) {
              mateTags.push(s.titulo.toLowerCase());
            }
          }
          // Tags from macro data keys (readable labels)
          const macroLabels = {
            inflacionOficial: 'inflación oficial',
            inflacionObrera: 'inflación obrera',
            smvm: 'SMVM',
            salarioMedioRegistrado: 'salario medio',
            canastaBasicaTotal: 'canasta básica',
            empleoTotal: 'empleo',
            ejercitoActivo: 'ejército activo',
            reservaFlotante: 'reserva flotante',
            reservaLatente: 'reserva latente',
            pauperizacion: 'pauperización'
          };
          if (this._mateRaw.datosMacro) {
            for (const k of Object.keys(this._mateRaw.datosMacro)) {
              mateTags.push(macroLabels[k] || this._normalizeTag(k));
            }
          }
          // Extra context tags
          mateTags.push('paritaria', 'despidos', 'ajuste', 'canasta básica', 'salario', 'poder de compra');

          // Build 6 tag lines same as clipping
          const maxLines = 6;
          const perLine = Math.ceil(Math.min(mateTags.length, maxLines * 3) / maxLines);
          const shownTags = mateTags.slice(0, maxLines * 3);
          mateTagLinesHtml = '<div class="mate-tags tag-lines">';
          for (let li = 0; li < maxLines && li * perLine < shownTags.length; li++) {
            const lineTags = shownTags.slice(li * perLine, (li + 1) * perLine);
            mateTagLinesHtml += '<div class="tag-line">' +
              lineTags.map(t => '<span class="noticia-tag">' + t + '</span>').join('') +
            '</div>';
          }
          const filledLines = Math.ceil(shownTags.length / perLine);
          for (let li = filledLines; li < maxLines; li++) {
            mateTagLinesHtml += '<div class="tag-line"></div>';
          }
          mateTagLinesHtml += '</div>';
        }

        // Build secciones list (expanded view)
        let mateSectionsHtml = '';
        const totalSections = this._mateRaw && this._mateRaw.secciones ? this._mateRaw.secciones.length : 0;
        if (totalSections > 0) {
          mateSectionsHtml = '<div class="mate-sections" style="display:none">';
          for (const s of this._mateRaw.secciones) {
            mateSectionsHtml += '<div class="mate-section-line">' + s.titulo + '</div>';
          }
          mateSectionsHtml += '</div>';
        }

        const mateToggleText = totalSections > 0 ? '▾ Ver ' + totalSections + ' secciones' : '';
        cardsHtml += '<div class="product-card product-card-infomate" data-screen="infomate">' +
          '<div class="product-title-line"><span class="product-emoji">🧮</span>' +
          '<span class="product-label">' + mateLabel + '</span></div>' +
          '<div class="product-sublabel">' + mateSublabel + '</div>' +
          mateTagLinesHtml +
          mateSectionsHtml +
          (mateToggleText ? '<div class="noticia-toggle" data-expanded="false" data-clip-edicion="mate">' + mateToggleText + '</div>' : '') +
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

    // Toggle expand/collapse for noticia lists and mate sections
    this.shadowRoot.querySelectorAll('.noticia-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = toggle.dataset.expanded === 'true';
        const card = toggle.closest('.product-card');
        const tagLines = card.querySelector('.tag-lines, .mate-tags');
        const expandList = card.querySelector('.noticia-list, .mate-sections');
        const totalItems = expandList ? expandList.children.length : 0;
        const isMate = toggle.dataset.clipEdicion === 'mate';
        const itemLabel = isMate ? ' secciones' : ' títulos';

        if (expanded) {
          // Collapse: hide expand list, show tag lines
          if (expandList) expandList.style.display = 'none';
          if (tagLines) tagLines.style.display = '';
          toggle.dataset.expanded = 'false';
          toggle.textContent = '▾ Ver ' + totalItems + itemLabel;
        } else {
          // Expand: hide tag lines, show expand list
          if (tagLines) tagLines.style.display = 'none';
          if (expandList) expandList.style.display = '';
          toggle.dataset.expanded = 'true';
          toggle.textContent = '▴ Ver menos';
        }
      });
    });
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
