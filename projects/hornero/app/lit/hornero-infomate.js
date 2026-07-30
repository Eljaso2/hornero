// ===== <hornero-infomate> — InfoMate (sub-screen) =====
// datosMacro resumen + secciones como cards
// Multi-edición: carga índice → última edición, navegación ←→
// Estructura unificada con Clipping: flechas SVG, feed-cards, tags verdes
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

  // ===== Styles — unified with Clipping =====

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

      /* Feed cards — same pattern as Clipping */
      .feed-card { border-radius: 13px; margin-bottom: 10px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230);
        transition: border-color .2s; }
      .feed-card:hover { border-color: var(--ho-green, #4E9978); }

      .feed-card-body { padding: 12px 14px; }

      .feed-card-titulo { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #E8E6E0); margin-top: 4px;
        line-height: 1.25; }

      .feed-card-bajada { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        margin-top: 3px; }

      /* Tags — same as Clipping */
      .feed-card-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }

      /* Macro card — uses feed-card pattern */
      .macro-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 10px; padding: 10px 12px; }
      .macro-key { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-green-dark, #3D6B56); font-weight: 600;
        text-transform: uppercase; letter-spacing: .08em; }
      .macro-val { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text, #E8E6E0); font-weight: 700; margin-top: 2px; }

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

    // Section cards — feed-card pattern (same as Clipping)
    const sectionCards = secciones.map(s => {
      const tagsHtml = (s.datos || []).map(d =>
        '<span class="tag">' + d + '</span>'
      ).join('');
      return '<div class="feed-card">' +
        '<div class="feed-card-body">' +
          '<div class="feed-card-titulo">' + (s.titulo || '') + '</div>' +
          '<div class="feed-card-bajada">' + (s.bajada || '') + '</div>' +
          (tagsHtml ? '<div class="feed-card-tags">' + tagsHtml + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    return html`
      <div class="scroll">
        ${edicionHeader}
        <div class="macro-block">
          <div class="macro-grid">${macroCards}</div>
        </div>
        ${sectionCards}
      </div>
    `;
  }

  // ===== After-render =====

  _afterRender() {
    // Edition navigation buttons
    const prevBtn = this.shadowRoot.querySelector('#edPrev');
    const nextBtn = this.shadowRoot.querySelector('#edNext');
    if (prevBtn) prevBtn.addEventListener('click', () => this._goEdition(1));   // older
    if (nextBtn) nextBtn.addEventListener('click', () => this._goEdition(-1));  // newer
  }

  _goEdition(delta) {
    const newIdx = this._edicionIdx + delta;
    if (newIdx < 0 || newIdx >= this._ediciones.length) return;
    this._edicionIdx = newIdx;
    this._loadEdition(this._ediciones[newIdx].archivo);
  }
}

customElements.define('hornero-infomate', HorneroInfomate);
