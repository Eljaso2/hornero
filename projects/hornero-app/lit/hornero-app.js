// ===== <hornero-app> — Shell principal =====
// Navigation, auth, state global
// Cada esfera se renderiza como child component

import { LitElement, html, css } from './lit-bundle.js';

class HorneroApp extends LitElement {
  static properties = {
    screen: { type: String },
    userGrade: { type: String },
    userTerritory: { type: String },
    userSector: { type: String },
    isOnline: { type: Boolean },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--ho-bg, #F4F3EE);
      font-family: 'Public Sans', system-ui, sans-serif;
      color: var(--ho-text, #2B2A26);
      -webkit-font-smoothing: antialiased;
    }
    .top-bar {
      background: var(--ho-dark-surface, #45433E);
      color: var(--ho-text-off, #F2F1EC);
      padding: 9px 16px 13px;
      display: flex;
      align-items: center;
      gap: 11px;
      flex: none;
    }
    .top-bar button {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--ho-dark-mid, #5A574F);
      color: var(--ho-text-off, #F2F1EC);
      border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex: none;
    }
    .top-bar .title {
      font-family: 'Archivo', sans-serif;
      font-weight: 700;
      font-size: 1.02rem;
      flex: 1;
    }
    .top-bar .avatar {
      width: 26px; height: 26px;
      border-radius: 50%;
      background: var(--ho-green-light, #94A867);
      display: flex; align-items: center; justify-content: center;
      flex: none;
    }
    .body-scroll {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 60px;
    }
    .bottom-nav {
      background: var(--ho-dark, #33312D);
      display: flex;
      justify-content: space-around;
      padding: 9px 0 13px;
      flex: none;
    }
    .nav-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 3px 9px;
      font-family: 'Archivo', sans-serif;
    }
    .nav-btn .icon { font-size: 1.15rem; }
    .nav-btn .label { font-size: .62rem; font-weight: 600; }
  `;

  constructor() {
    super();
    this.screen = 'home';
    this.userGrade = 'A';
    this.userTerritory = '';
    this.userSector = 'aceitero';
    this.isOnline = navigator.onLine;

    // Navigation definition
    this.navDef = [
      { id: 'home', icon: '🪶', label: 'Inicio' },
      { id: 'is', icon: '✍️', label: 'Reporte' },
      { id: 'condicion', icon: '📊', label: 'Panorama' },
      { id: 'documentacion', icon: '✊', label: 'Lucha' },
      { id: 'ecosistema', icon: '🌿', label: 'Eco' },
    ];

    // Screen titles
    this.titles = {
      home: 'Inicio',
      is: 'Reporte gremial',
      condicion: 'Condición obrera',
      documentacion: 'Documentación',
      ecosistema: 'Ecosistema Hornero',
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('online', () => { this.isOnline = true; });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  _goScreen(id) {
    this.screen = id;
  }

  _goHome() {
    this.screen = 'home';
  }

  render() {
    const currentTitle = this.titles[this.screen] || 'Hornero';
    const showBack = this.screen !== 'home';

    return html`
      <div class="top-bar">
        <button @click=${this._goHome} title="Inicio">🪶</button>
        ${showBack ? html`<button @click=${() => this._goHome} title="Volver">←</button>` : ''}
        <span class="title">${currentTitle}</span>
        <div class="avatar"><div style="width:11px;height:11px;border-radius:50% 50% 50% 2px;background:#45433E"></div></div>
      </div>

      <div class="body-scroll">
        ${this.screen === 'home' ? html`<hornero-home
          .grade=${this.userGrade}
          .sector=${this.userSector}
          @screen-change=${(e) => this._goScreen(e.detail.screen)}
        ></hornero-home>` : ''}
        ${this.screen === 'is' ? html`<hornero-is-placeholder></hornero-is-placeholder>` : ''}
        ${this.screen !== 'home' && this.screen !== 'is' ? html`<div style="padding:20px;text-align:center;color:#9C988D">Sección ${currentTitle} — pendiente de implementación</div>` : ''}
      </div>

      <div class="bottom-nav">
        ${this.navDef.map(n => html`
          <button class="nav-btn" @click=${() => this._goScreen(n.id)}>
            <span class="icon" style="${n.id === this.screen ? '' : 'opacity:.5'}">${n.icon}</span>
            <span class="label" style="color:${n.id === this.screen ? 'var(--ho-green-light)' : 'var(--ho-text-light)'}">${n.label}</span>
          </button>
        `)}
      </div>
    `;
  }
}

customElements.define('hornero-app', HorneroApp);
