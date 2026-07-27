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
    };
  }

  constructor() {
    super();
    this.screen = 'home';
    this.updateAvailable = false;

    // Synchronous session restore from localStorage (avoids login flash)
    const stored = localStorage.getItem('hornero-session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        // Migration: FOEIAP → F.T.C.I.O.D y A.R.A.
        if (session && session.agremiacion) {
          const a = session.agremiacion;
          if (a.federacion && a.federacion.includes('FOEIAP')) {
            a.federacion = 'F.T.C.I.O.D y A.R.A. (Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines de la República Argentina)';
          }
          // Migration: Vicentín territory "San Lorenzo" → "Norte de Santa Fe"
          if (a.territorio === 'San Lorenzo' && a.empresa && a.empresa.includes('Vicentín')) {
            a.territorio = 'Norte de Santa Fe';
          }
          // Migration: add rol field based on grade (if missing)
          if (!a.rol) {
            const rolMap = { 'B.d': 'Secretario General de la Federación', 'B.c': 'Secretario General del Sindicato', 'B.b': 'Delegado', 'B.a': 'Trabajador de Base' };
            a.rol = rolMap[session.grade] || 'Trabajador de Base';
          }
          // Migration: test4 should have Dreyfus/Rosario
          if (session.username === 'test4') {
            a.sindicato = 'Sindicato de Obreros de la Industria Aceitera — Rosario';
            a.territorio = 'Rosario';
            a.empresa = 'Dreyfus';
            a.rol = 'Secretario General de la Federación';
          }
          localStorage.setItem('hornero-session', JSON.stringify(session));
        }
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
      { id: 'chat', label: 'Chat', svg: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' },
      { id: 'is', label: 'Reporte', svg: '<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>' },
      { id: 'condicion', label: 'Panorama', svg: '<rect x="3" y="3" rx="2" ry="2" width="18" height="18"/><line x1="3" y1="9" x2="21"/><line x1="9" y1="21" x2="9"/>' },
      { id: 'perfil', label: 'Perfil', svg: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    ];

    // Sections bar — ALL screens (scrollable horizontal tabs below header)
    this.sectionsDef = [
      { id: 'home', label: 'Inicio' },
      { id: 'actualidad', label: 'Actualidad' },
      { id: 'clipping', label: 'Clipping' },
      { id: 'infomate', label: 'InfoMate' },
      { id: 'gremial', label: 'Gremial' },
      { id: 'chat', label: 'Chat' },
      { id: 'contenido', label: 'Contenido' },
      { id: 'is', label: 'Reporte' },
      { id: 'condicion', label: 'Panorama' },
      { id: 'smvm', label: 'SMVM' },
      { id: 'felicidad', label: 'Felicidad' },
      { id: 've', label: 'Comportamiento' },
      { id: 'ecosistema', label: 'Ecosistema' },
      { id: 'formacion', label: 'Formación' },
      { id: 'perfil', label: 'Perfil' },
    ];

    this.titles = {
      home: 'Inicio',
      actualidad: 'Actualidad',
      chat: 'Chat IA Sindical',
      consulta: 'Chateá con la IA Sindical',
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
      contenido: 'Producción de contenido',
      // Actualidad sub-screens
      clipping: 'Clipping de noticias',
      infomate: 'InfoMate',
      gremial: 'Reporte Gremial',
    };

    // Parent screen map — back button navigation
    this._parentScreen = {
      actualidad: 'home',
      chat: 'home',
      consulta: 'chat',
      is: 'home',
      condicion: 'home',
      perfil: 'home',
      // Actualidad sub-screens → back to actualidad
      clipping: 'actualidad',
      infomate: 'actualidad',
      gremial: 'actualidad',
      // Condicion sub-screens → back to condicion
      smvm: 'condicion',
      felicidad: 'condicion',
      ve: 'condicion',
      // Other sub-screens
      ecosistema: 'home',
      contenido: 'home',
      formacion: 'home',
      argumento: 'home',
      comunicador: 'home',
      archivo: 'home',
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._restoreSession();

    // ===== History API: device back button navigates within app =====
    history.replaceState({ screen: 'home' }, '', '');

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.screen) {
        this.set('screen', e.state.screen);
      } else {
        this.set('screen', 'home');
      }
    });

    // Set initial theme color
    this._updateThemeColor();
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
        /* Mobile: top-bar dark background merges with system status bar */
        .top-bar { background: var(--ho-dark, #33312D);
          color: var(--ho-text-off, #F2F1EC); }
        .top-bar-back { background: var(--ho-dark-surface, #45433E);
          border-color: var(--ho-dark-mid, #5A574F); color: var(--ho-text-off, #F2F1EC); }
        .top-bar-back:hover { background: var(--ho-dark-mid, #5A574F);
          border-color: var(--ho-green-light, #94A867); }
        /* Mobile: sections-bar dark to match header */
        .sections-bar { background: var(--ho-dark-surface, #45433E);
          border-bottom-color: rgba(242,241,236,.08); }
        .sections-btn { color: #9C988D; }
        .sections-btn.active { color: var(--ho-green-light, #94A867);
          border-bottom-color: var(--ho-green-light, #94A867); }
        .header-text .app-name { color: var(--ho-green-light, #94A867); }
      }

      /* ===== Animations ===== */
      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }

      /* ===== Top bar — back button + title centered ===== */
      .top-bar { background: var(--ho-bg, #F4F3EE);
        color: var(--ho-text, #2B2A26);
        padding: 0 16px; display: flex; align-items: center;
        justify-content: center; position: relative; flex: none;
        min-height: 56px;
        padding-top: env(safe-area-inset-top, 0px); }
      .top-bar-back { position: absolute; left: 16px;
        top: calc(50% + env(safe-area-inset-top, 0px) / 2);
        transform: translateY(-50%); width: 30px; height: 30px;
        border-radius: 50%; border: 1px solid var(--ho-border, rgba(43,42,38,.15));
        background: var(--ho-card, #FBFAF6); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; flex: none; }
      .top-bar-back:hover { background: var(--ho-green-pale, #E8EDD7);
        border-color: var(--ho-green-light, #94A867); }
      .top-bar-back svg { width: 14px; height: 14px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .top-bar-back:hover svg { stroke: var(--ho-green-dark, #586B33); }

      .header-text { display: flex; align-items: center; }
      .header-text .app-name { font-family: 'Inter', sans-serif; font-weight: 900;
        font-size: 1.1rem; letter-spacing: .12em; text-transform: uppercase;
        color: var(--ho-green, #6E8345); }

      /* ===== Sections bar — horizontal scrollable ===== */
      .sections-bar { background: var(--ho-bg, #F4F3EE);
        flex: none; display: flex; overflow-x: auto;
        padding: 6px 12px 8px; gap: 0;
        scrollbar-width: none; border-bottom: 1px solid var(--ho-border, rgba(43,42,38,.12)); }
      .sections-bar::-webkit-scrollbar { width: 0; }
      .sections-btn { font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        background: none; border: none; cursor: pointer;
        padding: 6px 12px; white-space: nowrap;
        border-bottom: 2px solid transparent;
        transition: color .2s, border-color .2s; }
      .sections-btn.active { color: var(--ho-green, #6E8345);
        border-bottom-color: var(--ho-green, #6E8345); }

      /* ===== Body scroll — white background covers content area ===== */
      .body-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; background: var(--ho-bg, #F4F3EE); }
      .body-scroll::-webkit-scrollbar { width: 0; }

      /* ===== Bottom nav — warm light background, no white ===== */
      .bottom-nav { background: linear-gradient(to bottom, var(--ho-bg, #F4F3EE) 0%, var(--ho-body-bg, #E7E5DF) 100%);
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

      /* ===== Chat landing — choice buttons ===== */
      .chat-landing { padding: 24px 20px; }
      .chat-landing-kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: #2B2A26; margin-bottom: 8px; }
      .chat-landing-title { font-family: 'Archivo', sans-serif; font-size: .92rem;
        font-weight: 700; color: #2B2A26; margin-bottom: 4px; }
      .chat-landing-desc { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: #6E6A60; line-height: 1.5; margin-bottom: 24px; }
      .chat-choice { display: flex; align-items: center; gap: 14px;
        background: var(--ho-card, #FBFAF6); border: 1px solid rgba(43,42,38,.06);
        border-radius: 13px; padding: 16px 14px; cursor: pointer;
        transition: border-color .2s, background .2s; margin-bottom: 12px; }
      .chat-choice:hover { border-color: rgba(43,42,38,.18);
        background: var(--ho-green-pale, #E8EDD7); }
      .chat-choice-icon { width: 46px; height: 46px; flex: none; }
      .chat-choice-icon svg { width: 46px; height: 46px; stroke: #6E8345;
        stroke-width: 1.8; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
      .chat-choice-text { flex: 1; }
      .chat-choice-name { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: #2B2A26; }
      .chat-choice-desc { font-family: 'Public Sans', sans-serif; font-size: .76rem;
        color: #6E6A60; line-height: 1.4; margin-top: 2px; }

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
    // Chat screens: show sections-bar, hide bottom-nav
    const isChatScreen = this.screen === 'consulta' || this.screen === 'contenido';
    const showSectionsBar = true;
    const showBottomNav = !isChatScreen;

    // Build screen content
    let screenContent = '';
    if (this.screen === 'home') {
      screenContent = '<hornero-home grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-home>';
    } else if (this.screen === 'is') {
      screenContent = '<hornero-is grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-is>';
    } else if (this.screen === 'actualidad') {
      screenContent = '<hornero-actualidad grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-actualidad>';
    } else if (this.screen === 'clipping') {
      const edicionAttr = this._clipEdicion ? ' edicion="' + this._clipEdicion + '"' : '';
      const expandAttr = this._clipExpandId ? ' expand-id="' + this._clipExpandId + '"' : '';
      screenContent = '<hornero-clipping grade="' + this.userGrade + '" sector="' + this.userSector + '"' + edicionAttr + expandAttr + '></hornero-clipping>';
    } else if (this.screen === 'infomate') {
      screenContent = '<hornero-infomate grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-infomate>';
    } else if (this.screen === 'gremial') {
      screenContent = '<hornero-gremial grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-gremial>';
    } else if (this.screen === 'ecosistema') {
      screenContent = '<hornero-ecosistema grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-ecosistema>';
    } else if (this.screen === 'chat') {
      const debateSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
      const consultaSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/>';
      const contenidoSvg = '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';
      screenContent = '<div class="chat-landing">' +
        '<div class="chat-landing-kicker">🤖 Chat IA Sindical</div>' +
        '<div class="chat-landing-title">Hornero te escucha</div>' +
        '<div class="chat-landing-desc">Chateá con la inteligencia artificial sindical. Elige cómo quieres conversar:</div>' +
        '<div class="chat-choice" data-screen="consulta">' +
          '<div class="chat-choice-icon"><svg viewBox="0 0 24 24">' + debateSvg + '</svg></div>' +
          '<div class="chat-choice-text">' +
            '<div class="chat-choice-name">Debate</div>' +
            '<div class="chat-choice-desc">Discusión argumentada sobre temas sindicales y laborales</div>' +
          '</div>' +
        '</div>' +
        '<div class="chat-choice" data-screen="consulta">' +
          '<div class="chat-choice-icon"><svg viewBox="0 0 24 24">' + consultaSvg + '</svg></div>' +
          '<div class="chat-choice-text">' +
            '<div class="chat-choice-name">Consulta</div>' +
            '<div class="chat-choice-desc">Preguntá sobre derechos, convenios, legislación laboral</div>' +
          '</div>' +
        '</div>' +
        '<div class="chat-choice" data-screen="contenido">' +
          '<div class="chat-choice-icon"><svg viewBox="0 0 24 24">' + contenidoSvg + '</svg></div>' +
          '<div class="chat-choice-text">' +
            '<div class="chat-choice-name">Contenido</div>' +
            '<div class="chat-choice-desc">Generá podcasts, reels, columnas, entrevistas</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    } else if (this.screen === 'consulta') {
      screenContent = '<hornero-consulta grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-consulta>';
    } else if (this.screen === 'contenido') {
      screenContent = '<hornero-contenido grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-contenido>';
    } else if (this.screen === 'condicion') {
      screenContent = '<hornero-condicion grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-condicion>';
    } else if (this.screen === 'perfil') {
      screenContent = '<hornero-perfil grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-perfil>';
    } else {
      // Placeholder for screens not yet implemented
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

            ${this.updateAvailable ? '<div class="update-banner" id="updateBanner">⟳ Actualización disponible — toca para recargar<button class="update-dismiss" id="updateDismiss">✕</button></div>' : ''}

            <div class="top-bar">
              ${this.screen !== 'home' ?
                '<button class="top-bar-back" id="backBtn"><svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>' : ''}
              <div class="header-text">
                <span class="app-name">HORNERO</span>
              </div>
            </div>

            ${showSectionsBar ? '<div class="sections-bar">' +
              this.sectionsDef.map(s => '<button class="sections-btn' + (s.id === this.screen ? ' active' : '') + '" data-screen="' + s.id + '">' + s.label + '</button>').join('') +
              '</div>' : ''}

            <div class="body-scroll">
              ${screenContent}
            </div>

            ${showBottomNav ? '<div class="bottom-nav">' +
              this.navDef.map(n => '<button class="nav-btn' + (n.id === this.screen ? ' active' : '') + '" data-screen="' + n.id + '">' +
                '<svg viewBox="0 0 24 24">' + n.svg + '</svg>' +
                '<span class="label">' + n.label + '</span>' +
                '</button>').join('') +
              '</div>' : ''}

          </div>
        </div>
      </div>
    `;
  }

  _afterRender() {
    // Bind sections bar button clicks (top navigation)
    this.shadowRoot.querySelectorAll('.sections-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._navigateTo(btn.dataset.screen);
      });
    });
    // Bind bottom nav button clicks
    this.shadowRoot.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._navigateTo(btn.dataset.screen);
      });
    });
    // Bind chat-choice buttons (Chat landing screen)
    this.shadowRoot.querySelectorAll('.chat-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        this._navigateTo(btn.dataset.screen);
      });
    });
    // Bind back button in header — just go back in history, popstate handles screen change
    const backBtn = this.shadowRoot.querySelector('#backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // Navigate to parent screen (defined in _parentScreen map)
        // Don't rely on history.back() which goes to previous history entry, not necessarily the parent
        const parent = this._parentScreen[this.screen] || 'home';
        this._navigateTo(parent);
      });
    }
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
      const detail = e.detail || {};
      this._clipEdicion = detail.clipEdicion || null;
      this._clipExpandId = detail.clipExpandId || null;
      this._navigateTo(detail.screen);
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

    // Listen for profile-updated from <hornero-perfil> (name/email changes)
    this.shadowRoot.addEventListener('profile-updated', (e) => {
      if (e.detail && e.detail.nombre) {
        this.set('userName', e.detail.nombre);
      }
    });

  }

  // ===== Navigation with History API =====
  _navigateTo(screen) {
    // Only push state if screen actually changes (avoid duplicate history entries)
    if (this.screen !== screen) {
      history.pushState({ screen: screen }, '', '#' + screen);
    }
    this.set('screen', screen);
  }

  // ===== Theme color — status bar + bottom bar match app color =====
  _updateThemeColor() {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) return;

    // Login screen (not logged in) → dark color matching login background
    if (!this.loggedIn) {
      metaTheme.setAttribute('content', '#33312D');
      document.documentElement.style.background = '#33312D';
      document.body.style.background = '#33312D';
      return;
    }

    // Main app screens → light color matching app background
    const appBg = '#F4F3EE';  // var(--ho-bg)
    metaTheme.setAttribute('content', appBg);
    document.documentElement.style.background = appBg;
    document.body.style.background = appBg;

    // iOS: update apple status bar style
    const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleMeta) {
      appleMeta.setAttribute('content', 'default'); // white status bar on iOS
    }
  }

  // Override attributeChangedCallback to update theme when screen/login changes
  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback(name, oldVal, newVal);
    if (name === 'screen' || name === 'loggedIn') {
      this._updateThemeColor();
    }
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
}

customElements.define('hornero-app', HorneroApp);
