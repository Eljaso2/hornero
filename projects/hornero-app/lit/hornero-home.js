// ===== <hornero-home> — Pantalla inicio =====
// Cards de entry points, novedades, status

import { LitElement, html, css } from './lit-bundle.js';

class HorneroHome extends LitElement {
  static properties = {
    grade: { type: String },
    sector: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }
    .card {
      background: var(--ho-card, #FBFAF6);
      border: 1px solid var(--ho-border, rgba(43,42,38,.12));
      border-radius: 13px;
      padding: 14px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: border-color .2s;
    }
    .card:hover {
      border-color: var(--ho-green, #6E8345);
    }
    .kicker {
      font-family: 'JetBrains Mono', monospace;
      font-size: .68rem;
      font-weight: 600;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--ho-text-light, #9C988D);
      margin-bottom: 6px;
    }
    .card-title {
      font-family: 'Archivo', sans-serif;
      font-weight: 700;
      font-size: .92rem;
      color: var(--ho-text, #2B2A26);
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: .82rem;
      color: var(--ho-text-mid, #6E6A60);
      line-height: 1.4;
    }
    .tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: .62rem;
      background: var(--ho-green-pale, #E8EDD7);
      color: var(--ho-green-dark, #586B33);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      display: inline-block;
      margin-top: 6px;
    }
    .grade-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: .68rem;
      font-weight: 600;
      background: var(--ho-green, #6E8345);
      color: var(--ho-text-off, #F2F1EC);
      padding: 2px 8px;
      border-radius: 5px;
      float: right;
    }
  `;

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
  }

  _goScreen(screen) {
    this.dispatchEvent(new CustomEvent('screen-change', {
      detail: { screen },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="card" @click=${() => this._goScreen('is')}>
        <span class="grade-badge">${this.grade}</span>
        <div class="kicker">✍️ Reporte gremial</div>
        <div class="card-title">Inteligencia Sindical</div>
        <div class="card-desc">Carga observaciones, consulta informes, seguimiento territorial</div>
        <div class="tag">${this.sector}</div>
      </div>

      <div class="card" @click=${() => this._goScreen('novedades')}>
        <div class="kicker">📰 Coyuntura</div>
        <div class="card-title">Clipping semanal</div>
        <div class="card-desc">Noticias laborales procesadas, clasificadas y contextualizadas</div>
        <div class="tag">semana actual</div>
      </div>

      <div class="card" @click=${() => this._goScreen('condicion')}>
        <div class="kicker">📊 Panorama</div>
        <div class="card-title">Condición obrera</div>
        <div class="card-desc">CE · IFT · Cómo Somos · SMVM — diagnóstico de la clase trabajadora</div>
        <div class="tag">índices</div>
      </div>
    `;
  }
}

customElements.define('hornero-home', HorneroHome);
