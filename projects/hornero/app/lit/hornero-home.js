// ===== <hornero-home> — Pantalla inicio =====
// Cards de entry points, grade badge, sector tag
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroHome extends HoComponent {
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
      :host { display: block; padding: 16px; }
      .card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; }
      .card:hover { border-color: var(--ho-green, #6E8345); }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 6px; }
      .card-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); margin-bottom: 4px; }
      .card-desc { font-size: .82rem; color: var(--ho-text-mid, #6E6A60); line-height: 1.4; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 6px; }
      .grade-badge { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; padding: 2px 8px; border-radius: 5px; float: right;
        background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC); }
    `;
  }

  _render() {
    const gradeLabel = this.grade === 'A' ? 'A — libre' :
                       this.grade === 'B.a' ? 'B.a — afiliado' :
                       this.grade === 'B.b' ? 'B.b — delegado' :
                       this.grade === 'B.c' ? 'B.c — secretario' :
                       this.grade === 'B.d' ? 'B.d — federación' : this.grade;

    return html`
      <div class="card" data-screen="is">
        <span class="grade-badge">${gradeLabel}</span>
        <div class="kicker">✍️ Reporte gremial</div>
        <div class="card-title">Inteligencia Sindical</div>
        <div class="card-desc">Carga observaciones, consulta informes, seguimiento territorial</div>
        <span class="tag">${this.sector}</span>
      </div>

      <div class="card" data-screen="novedades">
        <div class="kicker">📰 Coyuntura</div>
        <div class="card-title">Clipping semanal</div>
        <div class="card-desc">Noticias laborales procesadas, clasificadas y contextualizadas</div>
        <span class="tag">semana actual</span>
      </div>

      <div class="card" data-screen="condicion">
        <div class="kicker">📊 Panorama</div>
        <div class="card-title">Condición obrera</div>
        <div class="card-desc">CE · IFT · Cómo Somos · SMVM — diagnóstico de la clase trabajadora</div>
        <span class="tag">índices</span>
      </div>
    `;
  }

  _afterRender() {
    this.shadowRoot.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        this.goScreen(card.dataset.screen);
      });
    });
  }
}

customElements.define('hornero-home', HorneroHome);
