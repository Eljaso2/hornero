// ===== <hornero-gremial> — Reporte Gremial (sub-screen) =====
// Placeholder con etiqueta de gremio dinámica
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroGremial extends HoComponent {
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
    // Placeholder: gremio name será dinámico cuando haya datos reales
    this._gremioName = 'FOEIAP';
    this._gremioFull = 'Federación de Obreros y Empleados de la Industria Aceitera';
  }

  connectedCallback() {
    super.connectedCallback();
    // Future: load from IndexedDB informes store where estado='publicado'
    this.render();
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 20px 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      .placeholder-block {
        background: var(--ho-dark, #33312D);
        border-radius: 13px; padding: 24px 16px;
        text-align: center; margin-bottom: 12px; }

      .gremio-badge { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        background: var(--ho-dark-surface, #45433E); color: var(--ho-text-off, #F2F1EC);
        padding: 6px 12px; border-radius: 6px; display: inline-block;
        margin-bottom: 12px; }

      .gremio-icon { font-size: 2.4rem; margin-bottom: 8px; }

      .gremio-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text-off, #F2F1EC); }

      .gremio-full { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: #9C988D; margin-top: 4px; line-height: 1.4; }

      .pending-label { font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .82rem; color: var(--ho-gold, #B0863F);
        margin-top: 16px; }

      .pending-desc { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: #7A766D; line-height: 1.5; margin-top: 6px; }

      /* Future section placeholders */
      .future-section { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px; }

      .future-section-title { font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .82rem; color: var(--ho-text-light, #9C988D);
        letter-spacing: .06em; }

      .future-section-desc { font-family: 'Public Sans', sans-serif; font-size: .72rem;
        color: var(--ho-text-light, #9C988D); margin-top: 4px; line-height: 1.4; }
    `;
  }

  // ===== Render =====

  _render() {
    return html`
      <div class="scroll">
        <div class="placeholder-block">
          <div class="gremio-badge">✊ ${this._gremioName}</div>
          <div class="gremio-icon">✊</div>
          <div class="gremio-name">Reporte Gremial</div>
          <div class="gremio-full">${this._gremioFull}</div>
          <div class="pending-label">Pendiente aprobación</div>
          <div class="pending-desc">Esta sección se activa cuando la federación aprueba publicar su informe gremial. Solo se muestra contenido aprobado por la organización.</div>
        </div>

        <!-- Future section placeholders -->
        <div class="future-section">
          <div class="future-section-title">Organizaciones</div>
          <div class="future-section-desc">Comisiones internas, delegados y estructuras sindical por empresa.</div>
        </div>
        <div class="future-section">
          <div class="future-section-title">Conflictos</div>
          <div class="future-section-desc">Paritarias, medidas de fuerza, denuncias y conflictos activos.</div>
        </div>
        <div class="future-section">
          <div class="future-section-title">Acciones</div>
          <div class="future-section-desc">Asambleas, marchas, planes de lucha y movilizaciones.</div>
        </div>
      </div>
    `;
  }
}

customElements.define('hornero-gremial', HorneroGremial);
