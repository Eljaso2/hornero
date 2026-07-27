// ===== <hornero-condicion> — Condición obrera =====
// Wrapper: CE · IFT · Cómo Somos · SMVM
// Entry cards al cluster de diagnóstico de la clase trabajadora
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroCondicion extends HoComponent {
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
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }
      .scroll { flex: 1; overflow-y: auto; padding: 20px 16px;
        -webkit-overflow-scrolling: touch; }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 8px; }
      .section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); margin-bottom: 8px; }
      .intro { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-bottom: 12px; }

      .card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; }
      .card:hover { border-color: var(--ho-green, #6E8345); }
      .card-title-line { display: flex; align-items: baseline; gap: 6px; }
      .card-icon { font-size: 1rem; }
      .card-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); }
      .card-desc { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 4px; }
      .card-conn { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-green-dark, #586B33); margin-top: 6px; }

      .ce .card { border-left: 3px solid #6E8345; }
      .ift .card { border-left: 3px solid #94A867; }
      .comos .card { border-left: 3px solid #586B33; }
      .smvm .card { border-left: 3px solid #B0863F; }

      .disclaimer { background: var(--ho-green-pale, #E8EDD7); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #586B33);
        margin-top: 12px; line-height: 1.4; }
    `;
  }

  _render() {
    return html`
      <div class="scroll">
        <div class="kicker">📊 CONDICIÓN OBRERA</div>
        <div class="section-title">Diagnóstico de la clase trabajadora</div>
        <div class="intro">La misma data, cuatro lecturas: lo que te daña (CE), lo que te importa (IFT), cómo estamos (Cómo Somos), lo que te sostiene (SMVM).</div>

        <div class="ce">
          <div class="card" data-subscreen="ve">
            <div class="card-title-line"><span class="card-icon">🏭</span>
            <span class="card-title">Comportamiento Empresarial</span></div>
            <div class="card-desc">Identificar cómo piensa y actúa el empresario. Índice ICE: 4 dimensiones con violencia y buenas prácticas.</div>
            <div class="card-conn">ICE × SMVM → lo que daña × lo que sostiene</div>
          </div>
        </div>

        <div class="ift">
          <div class="card" data-subscreen="felicidad">
            <div class="card-title-line"><span class="card-icon">🌿</span>
            <span class="card-title">Felicidad del Trabajador</span></div>
            <div class="card-desc">Índice IFT — 6 dimensiones de bienestar laboral con categorías del campo: condiciones materiales, tiempo propio, salud, capacidad organizativa, pertenencia, futuro.</div>
            <div class="card-conn">IFT × CE × SMVM → lo que importa × lo que daña × lo que sostiene</div>
          </div>
        </div>

        <div class="comos">
          <div class="card" data-subscreen="como-somos">
            <div class="card-title-line"><span class="card-icon">👥</span>
            <span class="card-title">Cómo Somos</span></div>
            <div class="card-desc">Foto presente y película dinámica de la clase trabajadora — cuántos somos, cómo estamos, con categorías del campo obrero.</div>
            <div class="card-conn">Cómo Somos × CE → qué fracciones sufren qué dimensión</div>
          </div>
        </div>

        <div class="smvm">
          <div class="card" data-subscreen="smvm">
            <div class="card-title-line"><span class="card-icon">💰</span>
            <span class="card-title">Salario Mínimo Vital y Móvil</span></div>
            <div class="card-desc">El SMVM en contexto — el piso legal vs. el piso de vida. Canasta básica, inflación obrera, distribución del ingreso.</div>
            <div class="card-conn">SMVM × CE × IFT → lo que sostiene × lo que daña × lo que importa</div>
          </div>
        </div>

        <div class="disclaimer">⚠️ La IA propone — vos decidís, editás, aprobás</div>
      </div>
    `;
  }

  _afterRender() {
    this.shadowRoot.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const subscreen = card.dataset.subscreen;
        this.goScreen(subscreen);
      });
    });
  }
}

customElements.define('hornero-condicion', HorneroCondicion);
