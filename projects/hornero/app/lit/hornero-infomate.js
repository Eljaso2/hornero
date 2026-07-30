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
    this._savedScrollTop = null;
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
        padding: 12px 16px 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Edition header — same pattern as Clipping */
      .edicion-header { margin-bottom: 12px; }
      .edicion-row { display: flex; align-items: center; gap: 8px; }
      .edicion-btn { background: none; border: none; cursor: pointer;
        color: var(--ho-text-mid, #6E6A60); padding: 6px;
        transition: color .2s, opacity .2s; display: flex;
        align-items: center; justify-content: center; }
      .edicion-btn:hover { color: var(--ho-text, #E8E6E0); }
      .edicion-btn:disabled { opacity: .2; cursor: default; }
      .edicion-btn svg { width: 20px; height: 20px; }
      .edicion-center { flex: 1; text-align: center; }
      .edicion-numero { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.06rem; color: var(--ho-green-dark, #3D6B56);
        letter-spacing: .04em; }
      .edicion-fecha { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .08em;
        margin-top: 2px; }

      /* datosMacro grid — resumen arriba */
      .macro-block { margin-bottom: 14px; }
      .macro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .macro-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 10px; padding: 10px 12px; }
      .macro-key { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-green-dark, #3D6B56); font-weight: 600;
        text-transform: uppercase; letter-spacing: .08em; }
      .macro-val { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text, #E8E6E0); font-weight: 700; margin-top: 2px; }

      /* Feed card — idéntico a Clipping */
      .feed-card { border-radius: 13px; margin-bottom: 10px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230); cursor: pointer;
        transition: border-color .2s; }
      .feed-card:hover { border-color: var(--ho-green, #4E9978); }

      .feed-card-img { width: 100%; height: 140px; object-fit: cover; display: block; }
      .feed-card-body { padding: 12px 14px; }

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

      .feed-card-bajada { font-family: 'Public Sans', sans-serif; font-size: 1.29rem;
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
        padding: 16px; overflow-y: auto; -webkit-overflow-scrolling: touch;
        animation: popfade .25s ease; }

      .popup-content { background: var(--ho-card, #2A3230); border-radius: 16px;
        border: 1px solid var(--ho-border, rgba(255,255,255,.12));
        max-width: 100%; width: 380px; position: relative;
        overflow: hidden; }

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

    const chevLeft = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const chevRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

    const edicionHeader = '<div class="edicion-header">' +
      '<div class="edicion-row">' +
        '<button class="edicion-btn" id="edPrev" ' + (hasPrev ? '' : 'disabled') + '>' + chevLeft + '</button>' +
        '<div class="edicion-center">' +
          '<div class="edicion-numero">INFOMATE</div>' +
          '<div class="edicion-fecha">' + this._formatMes(meta.mes) + '</div>' +
        '</div>' +
        '<button class="edicion-btn" id="edNext" ' + (hasNext ? '' : 'disabled') + '>' + chevRight + '</button>' +
      '</div>' +
    '</div>';

    // datosMacro grid — pick key indicators from whatever is available
    const macroKeys = Object.keys(macro);
    const macroCards = macroKeys.map(key => {
      const val = macro[key] || '';
      // Friendly key labels
      const labels = {
        inflacionOficial: 'Inflación oficial',
        inflacionAcumulada: 'Inflación acumulada',
        inflacionObrera: 'Inflación obrera',
        smvm: 'SMVM',
        canastaBasicaTotal: 'Canasta básica',
        empleoTotal: 'Empleo total',
        salarioMedioRegistrado: 'Salario medio',
        salarioEstatal: 'Salario estatal',
        salarioPrivado: 'Salario privado',
        transferenciaIngresos: 'Transferencia',
        empleosFormalesPerdidos: 'Empleos perdidos',
        desocupadosUrbanos: 'Desocupados',
        informalidad: 'Informalidad',
        recortesAcumulados: 'Recortes',
        ejercitoActivo: 'Ejército activo',
        reservaFlotante: 'Reserva flotante',
        reservaLatente: 'Reserva latente',
        pauperizacion: 'Pauperización',
      };
      const label = labels[key] || key;
      return '<div class="macro-card">' +
        '<div class="macro-key">' + label + '</div>' +
        '<div class="macro-val">' + val + '</div>' +
      '</div>';
    }).join('');

    // Section cards — idéntico a Clipping (fecha, source-badge, emoji, título, bajada, tags)
    const cardsHtml = secciones.map((s, idx) => {
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
      <div class="scroll" id="mateScroll">
        ${edicionHeader}
        <div class="macro-block">
          <div class="macro-grid">${macroCards}</div>
        </div>
        ${cardsHtml}
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
  }

  _goEdition(delta) {
    const newIdx = this._edicionIdx + delta;
    if (newIdx < 0 || newIdx >= this._ediciones.length) return;
    this._edicionIdx = newIdx;
    this._popupItem = null;
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
