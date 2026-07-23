// ===== <hornero-app> — Shell principal =====
// Navigation, auth, state global
// Native Web Component — zero dependencies
// Phone mockup frame en desktop, full screen en mobile

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

    // 6 nav buttons: Inicio + 4 esferas implementadas + Perfil
    // (Formación y Archivo accesibles desde Home cards, no en bottom nav)
    this.navDef = [
      { id: 'home', label: 'Inicio', svg: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-6a1 1 0 011-1h2a1 1 0 011 1v6"/>' },
      { id: 'actualidad', label: 'Actualidad', svg: '<path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002 2h-4"/><path d="M11 7h2m-2 4h2m-2 4h4m-6 0h2"/><circle cx="8" cy="7" r="1.5"/>' },
      { id: 'consulta', label: 'Consulta', svg: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' },
      { id: 'is', label: 'Reporte', svg: '<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>' },
      { id: 'condicion', label: 'Panorama', svg: '<rect x="3" y="3" rx="2" ry="2" width="18" height="18"/><line x1="3" y1="9" x2="21"/><line x1="9" y1="21" x2="9"/>' },
      { id: 'perfil', label: 'Perfil', svg: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    ];

    this.titles = {
      home: 'Inicio',
      actualidad: 'Actualidad',
      consulta: 'Consulta y asesoramiento',
      formacion: 'Formación',
      is: 'Reporte gremial',
      condicion: 'Panorama',
      archivo: 'Archivo',
      perfil: 'Perfil',
      // Subscreens
      smvm: 'SMVM',
      felicidad: 'Felicidad Laboral',
      ve: 'Comportamiento Empresarial',
      ecosistema: 'Ecosistema Hornero',
      argumento: 'Argumento',
      comunicador: 'Comunicador',
    };

    // Screens with implemented components
    this.implementedScreens = ['home', 'is', 'actualidad', 'ecosistema', 'condicion'];
  }

  _styles() {
    return css`
      /* ===== Phone mockup frame (desktop) ===== */
      .app-wrap { background: var(--ho-body-bg, #E7E5DF); }
      @media(min-width:500px){
        .app-wrap { min-height: 100vh; display: flex; justify-content: center;
          align-items: flex-start; padding: 40px 20px; }
        .phone { width: 412px; background: var(--ho-dark, #33312D);
          border-radius: 46px; padding: 12px;
          box-shadow: 0 40px 80px -30px rgba(43,42,38,.6);
          position: sticky; top: 40px; }
        .screen { background: var(--ho-bg, #F4F3EE); border-radius: 35px;
          overflow: hidden; height: 824px; display: flex;
          flex-direction: column; position: relative; }
      }
      @media(max-width:499px){
        .app-wrap { min-height: 100vh; }
        .phone { width: 100%; min-height: 100vh; }
        .screen { background: var(--ho-bg, #F4F3EE); display: flex;
          flex-direction: column; position: relative; height: 100vh; overflow: hidden; }
      }

      /* ===== Animations ===== */
      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }

      /* ===== Top bar ===== */
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

      /* ===== Body scroll ===== */
      .body-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; padding-bottom: 50px; }
      .body-scroll::-webkit-scrollbar { width: 0; }

      /* ===== Bottom nav — 8 buttons, tighter spacing, thicker strokes ===== */
      .bottom-nav { background: var(--ho-dark, #33312D);
        display: flex; justify-content: space-between;
        padding: 6px 4px 12px; flex: none;
        position: absolute; bottom: 0; left: 0; width: 100%; z-index: 100; }
      .nav-btn { display: flex; flex-direction: column; align-items: center;
        gap: 3px; background: none; border: none; cursor: pointer;
        padding: 4px 6px; font-family: 'Archivo', sans-serif;
        transition: opacity .2s; flex: 1; min-width: 0; }
      .nav-btn svg { width: 22px; height: 22px; stroke: #9C988D;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .nav-btn.active svg { stroke: #FBFAF6; stroke-width: 2.6; }
      .nav-btn .label { font-size: .58rem; font-weight: 600; color: #9C988D;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .nav-btn.active .label { color: #FBFAF6; }

      /* ===== Status bar (phone mockup) ===== */
      .status-bar { background: var(--ho-dark-surface, #45433E); color: var(--ho-text-off, #F2F1EC);
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 22px 5px; font-size: .74rem; flex: none;
        font-family: 'JetBrains Mono', monospace; }
    `;
  }

  _render() {
    const currentTitle = this.titles[this.screen] || 'Hornero';
    const showBack = this.screen !== 'home';

    // Build screen content
    let screenContent = '';
    if (this.screen === 'home') {
      screenContent = '<hornero-home grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-home>';
    } else if (this.screen === 'is') {
      screenContent = '<hornero-is grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-is>';
    } else if (this.screen === 'actualidad') {
      screenContent = '<hornero-actualidad grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-actualidad>';
    } else if (this.screen === 'ecosistema') {
      screenContent = '<hornero-ecosistema grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-ecosistema>';
    } else if (this.screen === 'condicion') {
      screenContent = '<hornero-condicion grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-condicion>';
    } else {
      // Placeholder for screens not yet implemented (consulta, formacion, archivo, perfil)
      screenContent = '<div style="padding:40px 20px;text-align:center;color:#9C988D;font-family:Archivo,sans-serif">' +
        '<div style="font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">🏗️ EN CONSTRUCCIÓN</div>' +
        '<div style="font-size:.92rem;font-weight:700;color:#2B2A26;margin-bottom:4px">' + currentTitle + '</div>' +
        '<div style="font-size:.82rem;color:#6E6A60;line-height:1.4">Esta esfera se está desarrollando. Próximamente estará disponible.</div>' +
        '</div>';
    }

    return html`
      <div class="app-wrap">
        <div class="phone">
          <div class="screen">

            <div class="status-bar">
              <span>9:41</span>
              <span>● ● ● 📶 🔋</span>
            </div>

            <div class="top-bar">
              <button title="Inicio">🪶</button>
              ${showBack ? '<button title="Volver">←</button>' : ''}
              <span class="title">${currentTitle}</span>
              <div class="avatar"><div style="width:11px;height:11px;border-radius:50% 50% 50% 2px;background:#45433E"></div></div>
            </div>

            <div class="body-scroll">
              ${screenContent}
            </div>

            <div class="bottom-nav">
              ${this.navDef.map(n => '<button class="nav-btn' + (n.id === this.screen ? ' active' : '') + '" data-screen="' + n.id + '">' +
                '<svg viewBox="0 0 24 24">' + n.svg + '</svg>' +
                '<span class="label">' + n.label + '</span>' +
                '</button>').join('')}
            </div>

          </div>
        </div>
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
