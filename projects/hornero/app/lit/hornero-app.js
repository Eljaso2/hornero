// ===== <hornero-app> — Shell principal =====
// Navigation, auth, state global
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroApp extends HoComponent {
  static get properties() {
    return {
      screen: String,
      userGrade: String,
      userTerritory: String,
      userSector: String,
    };
  }

  constructor() {
    super();
    this.screen = 'home';
    this.userGrade = 'A';
    this.userTerritory = '';
    this.userSector = 'aceitero';

    this.navDef = [
      { id: 'home', icon: '🪶', label: 'Inicio' },
      { id: 'is', icon: '✍️', label: 'Reporte' },
      { id: 'condicion', icon: '📊', label: 'Panorama' },
      { id: 'documentacion', icon: '✊', label: 'Lucha' },
      { id: 'ecosistema', icon: '🌿', label: 'Eco' },
    ];

    this.titles = {
      home: 'Inicio',
      is: 'Reporte gremial',
      condicion: 'Condición obrera',
      documentacion: 'Documentación',
      ecosistema: 'Ecosistema Hornero',
      novedades: 'Coyuntura',
      smvm: 'SMVM',
      felicidad: 'Felicidad Laboral',
      ve: 'Comportamiento Empresarial',
      argumento: 'Argumento',
      comunicador: 'Comunicador',
    };
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100vh;
        background: var(--ho-bg, #F4F3EE);
        font-family: 'Public Sans', system-ui, sans-serif;
        color: var(--ho-text, #2B2A26); -webkit-font-smoothing: antialiased; }
      .top-bar { background: var(--ho-dark-surface, #45433E); color: var(--ho-text-off, #F2F1EC);
        padding: 9px 16px 13px; display: flex; align-items: center; gap: 11px; flex: none; }
      .top-bar button { width: 32px; height: 32px; border-radius: 50%;
        background: var(--ho-dark-mid, #5A574F); color: var(--ho-text-off, #F2F1EC);
        border: none; display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex: none; }
      .top-bar .title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: 1.02rem; flex: 1; }
      .top-bar .avatar { width: 26px; height: 26px; border-radius: 50%;
        background: var(--ho-green-light, #94A867);
        display: flex; align-items: center; justify-content: center; flex: none; }
      .body-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding-bottom: 60px; }
      .bottom-nav { background: var(--ho-dark, #33312D);
        display: flex; justify-content: space-around;
        padding: 9px 0 13px; flex: none; }
      .nav-btn { display: flex; flex-direction: column; align-items: center;
        gap: 3px; background: none; border: none; cursor: pointer;
        padding: 3px 9px; font-family: 'Archivo', sans-serif; }
      .nav-btn .icon { font-size: 1.15rem; }
      .nav-btn .label { font-size: .62rem; font-weight: 600; }
    `;
  }

  _render() {
    const currentTitle = this.titles[this.screen] || 'Hornero';
    const showBack = this.screen !== 'home';

    return html`
      <div class="top-bar">
        <button title="Inicio">🪶</button>
        ${showBack ? '<button title="Volver">←</button>' : ''}
        <span class="title">${currentTitle}</span>
        <div class="avatar"><div style="width:11px;height:11px;border-radius:50% 50% 50% 2px;background:#45433E"></div></div>
      </div>

      <div class="body-scroll">
        ${this.screen === 'home' ? '<hornero-home grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-home>' : ''}
        ${this.screen === 'is' ? '<hornero-is grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-is>' : ''}
        ${this.screen === 'novedades' ? '<hornero-coyuntura grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-coyuntura>' : ''}
        ${this.screen !== 'home' && this.screen !== 'is' ? '<div style="padding:20px;text-align:center;color:#9C988D">Sección ' + currentTitle + ' — pendiente</div>' : ''}
      </div>

      <div class="bottom-nav">
        ${this.navDef.map(n => '<button class="nav-btn" data-screen="' + n.id + '">' +
          '<span class="icon" style="' + (n.id === this.screen ? '' : 'opacity:.5') + '">' + n.icon + '</span>' +
          '<span class="label" style="color:' + (n.id === this.screen ? '#94A867' : '#9C988D') + ';' +
          'font-weight:' + (n.id === this.screen ? '700' : '600') + '">' + n.label + '</span>' +
          '</button>').join('')}
      </div>
    `;
  }

  _afterRender() {
    // Bind navigation button clicks
    this.shadowRoot.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('screen', btn.dataset.screen);
      });
    });
    // Bind top bar buttons
    const topBtns = this.shadowRoot.querySelectorAll('.top-bar button');
    if (topBtns[0]) topBtns[0].addEventListener('click', () => this.set('screen', 'home'));
    if (topBtns[1]) topBtns[1].addEventListener('click', () => this.set('screen', 'home'));
    // Listen for screen-change from child components (crosses Shadow DOM)
    this.shadowRoot.addEventListener('screen-change', (e) => {
      this.set('screen', e.detail.screen);
    });
  }
}

customElements.define('hornero-app', HorneroApp);
