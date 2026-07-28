// ===== <hornero-infomate> — InfoMate (sub-screen) =====
// datosMacro resumen + secciones como cards
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroInfomate extends HoComponent {
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
    this._mateData = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadMate();
  }

  async _loadMate() {
    try {
      const response = await fetch('data/mate-2026-06.json');
      this._mateData = await response.json();
      this.render();
    } catch(e) { console.warn('InfoMate: load failed', e); }
  }

  _formatMes(mesStr) {
    if (!mesStr) return '';
    const parts = mesStr.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return months[parseInt(parts[1]) - 1] + ' ' + parts[0];
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 12px 16px 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Kicker */
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        color: #E8E6E0; background: rgba(176,134,63,.35);
        border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; }

      /* datosMacro grid — resumen arriba */
      .macro-block { margin-bottom: 14px; }
      .macro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .macro-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 10px; padding: 10px 12px; }
      .macro-key { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-gold, #B0863F); font-weight: 600;
        text-transform: uppercase; letter-spacing: .08em; }
      .macro-val { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text, #E8E6E0); font-weight: 700; margin-top: 2px; }

      /* Section cards */
      .section-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-left: 3px solid var(--ho-gold, #B0863F);
        border-radius: 13px; padding: 14px; margin-bottom: 10px; }

      .section-titulo { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); }

      .section-bajada { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4; margin-top: 4px; }

      .section-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .data-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: rgba(176,134,63,.35); color: #E8E6E0;
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

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

    const kickerLabel = 'INFOMATE · ' + this._formatMes(meta.mes);

    // datosMacro grid — pick key indicators
    const macroKeys = ['inflacionOficial', 'smvm', 'canastaBasicaTotal', 'empleoTotal',
                       'inflacionObrera', 'salarioMedioRegistrado'];
    const macroCards = macroKeys.map(key => {
      const val = macro[key] || '';
      // Friendly key labels
      const labels = {
        inflacionOficial: 'Inflación oficial',
        inflacionObrera: 'Inflación obrera',
        smvm: 'SMVM',
        canastaBasicaTotal: 'Canasta básica',
        empleoTotal: 'Empleo total',
        salarioMedioRegistrado: 'Salario medio',
      };
      const label = labels[key] || key;
      return '<div class="macro-card">' +
        '<div class="macro-key">' + label + '</div>' +
        '<div class="macro-val">' + val + '</div>' +
      '</div>';
    }).join('');

    // Section cards
    const sectionCards = secciones.map(s => {
      const tagsHtml = (s.datos || []).map(d =>
        '<span class="data-tag">' + d + '</span>'
      ).join('');
      return '<div class="section-card">' +
        '<div class="section-titulo">' + (s.titulo || '') + '</div>' +
        '<div class="section-bajada">' + (s.bajada || '') + '</div>' +
        (tagsHtml ? '<div class="section-tags">' + tagsHtml + '</div>' : '') +
      '</div>';
    }).join('');

    return html`
      <div class="scroll">
        <div class="kicker">${kickerLabel}</div>
        <div class="macro-block">
          <div class="macro-grid">${macroCards}</div>
        </div>
        ${sectionCards}
      </div>
    `;
  }
}

customElements.define('hornero-infomate', HorneroInfomate);
