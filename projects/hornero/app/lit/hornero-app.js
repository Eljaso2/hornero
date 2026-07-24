// ===== <hornero-app> — Shell principal =====
// Navigation, auth, state global
// Native Web Component — zero dependencies
// Desktop: phone mockup frame · Mobile/PWA: full screen native

import { HoComponent, html, css } from './ho-component.js';

class HorneroApp extends HoComponent {
  static get properties() {
    return {
      screen: String,
      userGrade: String,
      userTerritory: String,
      userSector: String,
      userName: String,
      loggedIn: Boolean,
      updateAvailable: Boolean,
      clipExpandId: String,
    };
  }

  constructor() {
    super();
    this.screen = 'home';
    this.updateAvailable = false;
    this.clipExpandId = '';

    // Synchronous session restore from localStorage (avoids login flash)
    const stored = localStorage.getItem('hornero-session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session && session.grade) {
          this.loggedIn = true;
          this.userGrade = session.grade;
          this.userTerritory = session.territory;
          this.userSector = session.sector || 'aceitero';
          this.userName = session.nombre || session.username;
        } else {
          this.loggedIn = false;
          this.userGrade = 'A';
          this.userTerritory = '';
          this.userSector = 'aceitero';
          this.userName = '';
        }
      } catch(e) {
        this.loggedIn = false;
        this.userGrade = 'A';
        this.userTerritory = '';
        this.userSector = 'aceitero';
        this.userName = '';
      }
    } else {
      this.loggedIn = false;
      this.userGrade = 'A';
      this.userTerritory = '';
      this.userSector = 'aceitero';
      this.userName = '';
    }

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
      is: 'Comunicación interna',
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
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._restoreSession();
  }

  async _restoreSession() {
    // Try IndexedDB first, then localStorage
    let session = null;
    if (typeof dbGet === 'function') {
      try {
        session = await dbGet('uiState', 'session');
      } catch(e) { console.warn('App: IndexedDB session read failed', e); }
    }
    if (!session) {
      const stored = localStorage.getItem('hornero-session');
      if (stored) {
        try { session = JSON.parse(stored); } catch(e) { session = null; }
      }
    }
    if (session && session.grade) {
      this.set('loggedIn', true);
      this.set('userGrade', session.grade);
      this.set('userTerritory', session.territory);
      this.set('userSector', session.sector || 'aceitero');
      this.set('userName', session.nombre || session.username);
    }
  }

  _styles() {
    return css`
      /* ===== Phone mockup frame (desktop only) ===== */
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
        /* Desktop: show simulated status bar */
        .status-bar { background: var(--ho-dark, #33312D); color: var(--ho-text-off, #F2F1EC);
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 22px 5px; font-size: .74rem; flex: none;
          font-family: 'JetBrains Mono', monospace; }
      }
      @media(max-width:499px){
        .app-wrap { min-height: 100vh; }
        .phone { width: 100%; min-height: 100vh; }
        .screen { background: var(--ho-dark, #33312D); display: flex;
          flex-direction: column; position: relative;
          height: 100dvh; overflow: hidden; }
        /* Mobile/PWA: hide simulated status bar */
        .status-bar { display: none; }
      }

      /* ===== Animations ===== */
      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }

      /* ===== Top bar — solid dark where name sits, gradient starts below ===== */
      .top-bar { background: linear-gradient(to bottom, #33312D 0%, #33312D 40%, #5A574F 55%, #6E6A60 70%, #8A8580 85%, var(--ho-bg, #F4F3EE) 100%);
        color: var(--ho-text-off, #F2F1EC);
        padding: 0 16px; display: flex; align-items: center;
        justify-content: flex-start; position: relative; flex: none;
        min-height: 90px;
        padding-top: env(safe-area-inset-top, 0px); }
      .top-bar .back-btn { width: 32px; height: 32px; border-radius: 50%;
        background: rgba(255,255,255,.15); color: var(--ho-text-off, #F2F1EC);
        border: none; display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex: none; position: absolute; left: 16px; top: 50%; transform: translateY(-50%); }
      .top-bar .corner-logo { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); }
      .top-bar .corner-logo img { width: 32px; height: auto; opacity: .85; }
      .header-text { display: flex; flex-direction: column;
        align-items: flex-start; gap: 2px; }
      .header-text .app-name { font-family: 'Inter', sans-serif; font-weight: 900;
        font-size: 1.3rem; letter-spacing: .12em; text-transform: uppercase;
        color: var(--ho-green-light, #94A867); }
      .header-text .app-motto { font-family: 'Public Sans', sans-serif; font-weight: 500;
        font-size: .64rem; color: #9C988D; letter-spacing: .04em;
        text-align: left; white-space: nowrap; }

      /* ===== Section label — below gradient header, instant appear ===== */
      .section-label { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: #2B2A26; padding: 8px 16px 6px; background: var(--ho-bg, #F4F3EE);
        flex: none; }

      /* ===== Body scroll — white background covers content area ===== */
      .body-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; background: var(--ho-bg, #F4F3EE); }
      .body-scroll::-webkit-scrollbar { width: 0; }

      /* ===== Bottom nav — gradient hacia blanco, se funde con home bar ===== */
      .bottom-nav { background: linear-gradient(to bottom, #F4F3EE 0%, #FFFFFF 100%);
        display: flex; justify-content: space-around;
        padding: 6px 0 calc(12px + env(safe-area-inset-bottom, 0px)); flex: none;
        width: 100%; z-index: 100; position: relative;
        border-top: 1px solid rgba(43,42,38,.08); }
      .nav-btn { display: flex; flex-direction: column; align-items: center;
        gap: 3px; background: none; border: none; cursor: pointer;
        padding: 4px 0; font-family: 'Archivo', sans-serif;
        transition: opacity .2s; flex: 1; min-width: 0; }
      .nav-btn svg { width: 24px; height: 24px; stroke: #33312D;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .nav-btn.active svg { stroke: #6E8345; stroke-width: 2.6; }
      .nav-btn .label { font-size: .60rem; font-weight: 600; color: #33312D;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .nav-btn.active .label { color: #6E8345; }

      /* ===== Update banner ===== */
      .update-banner { background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC);
        padding: 10px 16px; display: flex; align-items: center; justify-content: space-between;
        font-family: 'Archivo', sans-serif; font-size: .82rem; font-weight: 600;
        flex: none; cursor: pointer; }
      .update-banner:hover { background: var(--ho-green-dark, #586B33); }
      .update-banner .update-dismiss { background: none; border: none;
        color: var(--ho-text-off, #F2F1EC); cursor: pointer; font-size: 1rem;
        padding: 4px 8px; }
    `;
  }

  _render() {
    // Login gate — show login screen if not logged in (full screen, no shell chrome)
    if (!this.loggedIn) {
      return html`
        <div class="app-wrap">
          <div class="phone">
            <div class="screen" style="background:var(--ho-dark,#33312D);display:flex;flex-direction:column;overflow:hidden">
              <hornero-login></hornero-login>
            </div>
          </div>
        </div>
      `;
    }

    const currentTitle = this.titles[this.screen] || 'Hornero';
    const showBack = this.screen !== 'home';

    // Build screen content
    let screenContent = '';
    if (this.screen === 'home') {
      screenContent = '<hornero-home grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-home>';
    } else if (this.screen === 'is') {
      screenContent = '<hornero-is grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-is>';
    } else if (this.screen === 'actualidad') {
      screenContent = '<hornero-actualidad grade="' + this.userGrade + '" sector="' + this.userSector + '" clip-expand-id="' + this.clipExpandId + '"></hornero-actualidad>';
    } else if (this.screen === 'ecosistema') {
      screenContent = '<hornero-ecosistema grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-ecosistema>';
    } else if (this.screen === 'condicion') {
      screenContent = '<hornero-condicion grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-condicion>';
    } else {
      // Placeholder for screens not yet implemented
      let extra = '';
      if (this.screen === 'perfil') {
        extra = '<div style="margin-top:24px;text-align:center">' +
          '<div style="font-family:JetBrains Mono,monospace;font-size:.66rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#9C988D;margin-bottom:4px">SESIÓN</div>' +
          '<div style="font-family:Public Sans,sans-serif;font-size:.92rem;color:#F2F1EC;margin-bottom:4px">' + (this.userName || 'Usuario') + '</div>' +
          '<div style="font-family:JetBrains Mono,monospace;font-size:.62rem;color:#94A867;margin-bottom:16px">Grade ' + this.userGrade + ' · ' + this.userTerritory + ' · ' + this.userSector + '</div>' +
          '<button id="logout-btn" style="background:#A6553E;color:#F2F1EC;border:none;border-radius:10px;padding:12px 24px;font-family:Archivo,sans-serif;font-weight:700;font-size:.82rem;cursor:pointer">Cerrar sesión</button>' +
          '</div>';
      }
      screenContent = '<div style="padding:40px 20px;text-align:center;color:#9C988D;font-family:Archivo,sans-serif">' +
        '<div style="font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">🏗️ EN CONSTRUCCIÓN</div>' +
        '<div style="font-size:.92rem;font-weight:700;color:#2B2A26;margin-bottom:4px">' + currentTitle + '</div>' +
        '<div style="font-size:.82rem;color:#6E6A60;line-height:1.4">Esta esfera se está desarrollando. Próximamente estará disponible.</div>' +
        extra +
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

            ${this.updateAvailable ? '<div class="update-banner" id="updateBanner">⟳ Actualización disponible — toca para recargar<button class="update-dismiss" id="updateDismiss">✕</button></div>' : ''}

            <div class="top-bar">
              ${showBack ? '<button class="back-btn" title="Volver">←</button>' : ''}
              <div class="corner-logo"><img src="assets/hornero-logo.png" alt="Hornero" /></div>
              <div class="header-text">
                <span class="app-name">HORNERO</span>
                <span class="app-motto">«El futuro, algo por lo que hay que luchar»</span>
              </div>
            </div>

            ${showBack ? '<div class="section-label">' + currentTitle + '</div>' : ''}

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
    // Bind back button
    const backBtn = this.shadowRoot.querySelector('.back-btn');
    if (backBtn) backBtn.addEventListener('click', () => this.set('screen', 'home'));
    // Bind update banner
    const updateBanner = this.shadowRoot.querySelector('#updateBanner');
    if (updateBanner) updateBanner.addEventListener('click', () => {
      this.updateAvailable = false;
      window.location.reload();
    });
    const updateDismiss = this.shadowRoot.querySelector('#updateDismiss');
    if (updateDismiss) updateDismiss.addEventListener('click', (e) => {
      e.stopPropagation();
      this.set('updateAvailable', false);
    });
    // Listen for screen-change from child components (crosses Shadow DOM)
    this.shadowRoot.addEventListener('screen-change', (e) => {
      this.set('screen', e.detail.screen);
      if (e.detail.clipExpandId) {
        this.set('clipExpandId', e.detail.clipExpandId);
      } else {
        this.set('clipExpandId', '');
      }
    });

    // Bind logout button (Perfil screen)
    const logoutBtn = this.shadowRoot.querySelector('#logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      this._handleLogout();
    });

    // Listen for login-success from <hornero-login>
    this.shadowRoot.addEventListener('login-success', (e) => {
      const session = e.detail;
      this.set('loggedIn', true);
      this.set('userGrade', session.grade);
      this.set('userTerritory', session.territory);
      this.set('userSector', session.sector || 'aceitero');
      this.set('userName', session.nombre || session.username);
    });

    // Listen for logout from any child component (Perfil screen)
    this.shadowRoot.addEventListener('logout-request', () => {
      this._handleLogout();
    });

    // Check for SW updates on each render
    this._checkForUpdates();
  }

  async _handleLogout() {
    // Clear session from IndexedDB
    if (typeof dbDelete === 'function') {
      try { await dbDelete('uiState', 'session'); } catch(e) { console.warn('Logout: IndexedDB delete failed', e); }
    }
    // Clear session from localStorage
    localStorage.removeItem('hornero-session');
    // Reset state
    this.set('loggedIn', false);
    this.set('userGrade', 'A');
    this.set('userTerritory', '');
    this.set('userSector', 'aceitero');
    this.set('userName', '');
    this.set('screen', 'home');
  }

  _checkForUpdates() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'SW_UPDATE_AVAILABLE') {
          this.set('updateAvailable', true);
        }
      });
    }
  }
}

customElements.define('hornero-app', HorneroApp);
