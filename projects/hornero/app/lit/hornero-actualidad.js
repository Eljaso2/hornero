// ===== <hornero-actualidad> — Esfera Actualidad =====
// Portada: ediciones clipping + InfoMate intercalados por fecha
// Cada card tiene foto de fondo con etiquetas superpuestas
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
    this._ediciones = [];      // all clipping editions from index
    this._clippingData = {};   // loaded clipping data per edition (keyed by numero)
    this._mateEdiciones = [];  // all mate editions from index
    this._mateData = {};       // loaded mate data per edition (keyed by mes)
    this._allItems = [];       // merged + sorted by date: [{type, fecha, ...}]
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

    // InfoMate — load all editions from index
    try {
      const mateIdxRes = await fetch('data/mate-index.json');
      const mateIdx = await mateIdxRes.json();
      this._mateEdiciones = mateIdx.ediciones || [];

      for (const ed of this._mateEdiciones) {
        try {
          const res = await fetch(ed.archivo);
          const data = await res.json();
          this._mateData[ed.mes] = data;
        } catch(e) { console.warn('Actualidad: mate edition ' + ed.mes + ' load failed', e); }
      }
    } catch(e) { console.warn('Actualidad: mate index load failed', e); }

    // Build merged timeline sorted by date (newest first)
    this._buildTimeline();
  }

  _buildTimeline() {
    const items = [];

    // Clipping items
    for (const ed of this._ediciones) {
      items.push({ type: 'clipping', fecha: ed.fecha, ed: ed });
    }

    // InfoMate items
    for (const ed of this._mateEdiciones) {
      items.push({ type: 'infomate', fecha: ed.fecha, ed: ed });
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    this._allItems = items;
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
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Normalize tag: lowercase unless it's a known acronym or proper noun
  _normalizeTag(tag) {
    const acronyms = ['CGT','CTA','OIT','CONICET','INTI','INTA','INDEC','SMVM','CLATE','CAREM','UEJN','IPYPP',
      'UTEP','FAdeA','GNL','RIGI','ILVA','Sitrarepa','CABA','CLATE','IA'];
    const properNouns = ['Córdoba','Neuquén','Patagonia','Cutral-Co','Chapadmalal','Embalse','Daer','Vidal','Fate','YPF'];
    if (acronyms.includes(tag)) return tag;
    if (properNouns.includes(tag)) return tag;
    return tag.toLowerCase();
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 12px 16px 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Feed card — foto de fondo con overlay */
      .feed-card { border-radius: 13px; margin-bottom: 10px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230); cursor: pointer;
        transition: border-color .2s; position: relative; min-height: 200px; }
      .feed-card:hover { border-color: var(--ho-green, #4E9978); }

      .feed-card-img { width: 100%; height: 200px; object-fit: cover; display: block; }

      /* Overlay sobre la foto — gradiente oscuro abajo */
      .feed-card-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 28px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.85));
        color: #F2F1EC; }

      .feed-card-label { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.06rem; letter-spacing: .02em; text-transform: uppercase; }

      .feed-card-sublabel { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: rgba(242,241,236,.7); letter-spacing: .06em;
        margin-top: 2px; }

      /* Tags dentro de la foto */
      .feed-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
      .photo-tag { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        background: rgba(78,153,120,.7); color: #F2F1EC;
        padding: 2px 6px; border-radius: 4px; font-weight: 600;
        white-space: nowrap; backdrop-filter: blur(4px); }

      /* Tags sin foto — cuando no hay imagen */
      .feed-card-no-photo .feed-card-overlay {
        position: relative; background: none; color: var(--ho-text, #E8E6E0);
        padding: 14px; }
      .feed-card-no-photo .feed-card-sublabel { color: var(--ho-text-mid, #6E6A60); }
      .feed-card-no-photo .photo-tag {
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        backdrop-filter: none; }

      /* Noticia titles list — shown after expand */
      .noticia-list { margin-top: 8px; padding: 0 14px 10px; }
      .noticia-line { display: flex; align-items: baseline; gap: 4px;
        padding: 3px 0; }
      .noticia-emoji { font-size: .78rem; }
      .noticia-title { font-family: 'Public Sans', sans-serif; font-size: .84rem;
        color: var(--ho-text, #E8E6E0); line-height: 1.3;
        font-weight: 500; flex: 1; }

      /* Expand/collapse toggle */
      .noticia-toggle {
        font-family: 'JetBrains Mono', monospace; font-size: .64rem;
        color: var(--ho-green, #4E9978); cursor: pointer;
        padding: 4px 14px 10px; letter-spacing: .06em;
        font-weight: 600; user-select: none;
        transition: color .2s; }
      .noticia-toggle:hover { color: var(--ho-green-dark, #3D6B56); }
    `;
  }

  // ===== Render =====

  _renderClippingCard(ed) {
    const data = this._clippingData[ed.numero];
    const label = 'CLIPPING N°' + ed.numero;
    const sublabel = this._formatFecha(ed.fecha);

    // Use first noticia photo as card image
    const firstNoticia = data && data.noticias && data.noticias.length > 0 ? data.noticias[0] : null;
    const foto = firstNoticia ? firstNoticia.foto : null;
    const hasFoto = !!foto;

    // Build tags from all noticias
    let tagsHtml = '';
    if (data && data.noticias && data.noticias.length > 0) {
      const allTags = [];
      for (const n of data.noticias) {
        if (n.tags) {
          for (const t of n.tags) {
            if (!allTags.includes(t)) allTags.push(this._normalizeTag(t));
          }
        }
      }
      const shownTags = allTags.slice(0, 12);
      tagsHtml = shownTags.map(t => '<span class="photo-tag">' + t + '</span>').join('');
    }

    // Build noticia titles list (expanded view)
    let noticiaList = '';
    const totalNoticias = (data && data.noticias) ? data.noticias.length : 0;
    if (totalNoticias > 0) {
      noticiaList = '<div class="noticia-list" style="display:none">';
      for (const n of data.noticias) {
        noticiaList += '<div class="noticia-line">' +
          (n.emoji ? '<span class="noticia-emoji">' + n.emoji + '</span>' : '') +
          '<span class="noticia-title">' + (n.titulo || '') + '</span>' +
        '</div>';
      }
      noticiaList += '</div>';
    }

    const toggleText = totalNoticias > 0 ? '▾ Ver ' + totalNoticias + ' títulos' : '';
    const noPhotoClass = hasFoto ? '' : ' feed-card-no-photo';

    return '<div class="feed-card' + noPhotoClass + '" data-screen="clipping" data-clip-edicion="' + ed.numero + '">' +
      (hasFoto ? '<img class="feed-card-img" src="' + foto + '" alt="" loading="lazy">' : '') +
      '<div class="feed-card-overlay">' +
        '<div class="feed-card-label">' + label + '</div>' +
        '<div class="feed-card-sublabel">' + sublabel + '</div>' +
        (tagsHtml ? '<div class="feed-card-tags">' + tagsHtml + '</div>' : '') +
      '</div>' +
      noticiaList +
      (toggleText ? '<div class="noticia-toggle" data-expanded="false" data-card-type="clipping" data-clip-edicion="' + ed.numero + '">' + toggleText + '</div>' : '') +
    '</div>';
  }

  _renderInfomateCard(ed) {
    const mateRaw = this._mateData[ed.mes];
    const mateLabel = 'INFOMATE';
    const mateSublabel = this._formatMes(ed.mes);

    // Use first seccion foto as card image
    const firstSection = mateRaw && mateRaw.secciones && mateRaw.secciones.length > 0 ? mateRaw.secciones[0] : null;
    const foto = firstSection ? firstSection.foto : null;
    const hasFoto = !!foto;

    // Build tags from secciones + datosMacro
    let tagsHtml = '';
    if (mateRaw) {
      const mateTags = [];
      if (mateRaw.secciones) {
        for (const s of mateRaw.secciones) {
          mateTags.push(s.titulo.toLowerCase());
        }
      }
      const macroLabels = {
        inflacionOficial: 'inflación oficial',
        inflacionAcumulada: 'inflación acumulada',
        inflacionObrera: 'inflación obrera',
        smvm: 'SMVM',
        salarioMedioRegistrado: 'salario medio',
        canastaBasicaTotal: 'canasta básica',
        empleoTotal: 'empleo',
        salarioEstatal: 'salario estatal',
        salarioPrivado: 'salario privado',
        transferenciaIngresos: 'transferencia',
        empleosFormalesPerdidos: 'empleos perdidos',
        desocupadosUrbanos: 'desocupados',
        informalidad: 'informalidad',
        recortesAcumulados: 'recortes',
        ejercitoActivo: 'ejército activo',
        reservaFlotante: 'reserva flotante',
        reservaLatente: 'reserva latente',
        pauperizacion: 'pauperización',
      };
      if (mateRaw.datosMacro) {
        for (const k of Object.keys(mateRaw.datosMacro)) {
          mateTags.push(macroLabels[k] || this._normalizeTag(k));
        }
      }

      const shownTags = mateTags.slice(0, 12);
      tagsHtml = shownTags.map(t => '<span class="photo-tag">' + t + '</span>').join('');
    }

    // Build secciones list (expanded view)
    let mateSectionsHtml = '';
    const totalSections = mateRaw && mateRaw.secciones ? mateRaw.secciones.length : 0;
    if (totalSections > 0) {
      mateSectionsHtml = '<div class="mate-sections noticia-list" style="display:none">';
      for (const s of mateRaw.secciones) {
        mateSectionsHtml += '<div class="noticia-line"><span class="noticia-title">' + s.titulo + '</span></div>';
      }
      mateSectionsHtml += '</div>';
    }

    const mateToggleText = totalSections > 0 ? '▾ Ver ' + totalSections + ' secciones' : '';
    const noPhotoClass = hasFoto ? '' : ' feed-card-no-photo';

    return '<div class="feed-card' + noPhotoClass + '" data-screen="infomate" data-mate-mes="' + ed.mes + '">' +
      (hasFoto ? '<img class="feed-card-img" src="' + foto + '" alt="" loading="lazy">' : '') +
      '<div class="feed-card-overlay">' +
        '<div class="feed-card-label">' + mateLabel + '</div>' +
        '<div class="feed-card-sublabel">' + mateSublabel + '</div>' +
        (tagsHtml ? '<div class="feed-card-tags">' + tagsHtml + '</div>' : '') +
      '</div>' +
      mateSectionsHtml +
      (mateToggleText ? '<div class="noticia-toggle" data-expanded="false" data-card-type="infomate" data-mate-mes="' + ed.mes + '">' + mateToggleText + '</div>' : '') +
    '</div>';
  }

  _render() {
    // Render all items (clipping + infomate) interleaved by date
    let cardsHtml = '';
    for (const item of this._allItems) {
      if (item.type === 'clipping') {
        cardsHtml += this._renderClippingCard(item.ed);
      } else if (item.type === 'infomate') {
        cardsHtml += this._renderInfomateCard(item.ed);
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
    this.shadowRoot.querySelectorAll('.feed-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't navigate if clicking the toggle
        if (e.target.closest('.noticia-toggle')) return;
        const screen = card.dataset.screen;
        const clipEdicion = card.dataset.clipEdicion;
        const mateMes = card.dataset.mateMes;
        if (screen === 'clipping' && clipEdicion) {
          this.emit('screen-change', { screen: 'clipping', clipEdicion: parseInt(clipEdicion) });
        } else if (screen === 'infomate' && mateMes) {
          this.emit('screen-change', { screen: 'infomate', mateMes: mateMes });
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
        const card = toggle.closest('.feed-card');
        const tagLines = card.querySelector('.feed-card-tags');
        const expandList = card.querySelector('.noticia-list, .mate-sections');
        const totalItems = expandList ? expandList.children.length : 0;
        const isMate = toggle.dataset.cardType === 'infomate';
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
