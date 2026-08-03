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
      theme: String,
      newClippingAvailable: Boolean,
      recibidosList: Array,
      misConversacionesList: Array,
      misReportesList: Array,
    };
  }

  constructor() {
    super();
    this.screen = 'home';
    this.theme = localStorage.getItem('hornero-theme') || 'dark';
    this.updateAvailable = false;
    this.newClippingAvailable = false;
    this._clipBannerVisible = false;
    this._newClipNumero = 0;
    this._newClipFecha = '';
    this._newClipVersion = '';
    this.recibidosList = [];
    this.misConversacionesList = [];
    this.misReportesList = [];
    this._initialPersona = 'abogado'; // Persona selected from landing page
    this._initialSessionId = ''; // Session ID from Mis Conversaciones — load existing chat
    this._initialSection = ''; // Initial section/topic for condicion (e.g. 'comportamiento')
    this._actualidadSubView = ''; // Sub-view for actualidad: 'clipping' | 'infomate' | 'sindical'
    this._clipEdicion = null;
    this._clipExpandId = null;
    this._mateMes = null;
    this._profileOpen = false;
    this._pushEnabled = (typeof isPushSubscribed === 'function') ? isPushSubscribed() : false;

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
          // Migration: split empresa/puesto if empresa has " — " separator (old format)
          if (a.empresa && a.empresa.includes(' — ') && !a.puesto) {
            const parts = a.empresa.split(' — ');
            a.empresa = parts[0].trim();
            a.puesto = parts[1].trim();
          }
          // Migration: add puesto field based on username if missing
          if (!a.puesto) {
            const puestoMap = { 'test1b': 'Administración' };
            if (puestoMap[session.username]) a.puesto = puestoMap[session.username];
            else if (session.sector === 'aceitero' && session.grade === 'B.a') a.puesto = 'Operario de planta';
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
    this.navDefBase = [
      { id: 'home', label: 'Inicio', img: 'assets/hornero-logo-nobg.png', svg: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-6a1 1 0 011-1h2a1 1 0 011 1v6"/>' },
      { id: 'actualidad', label: 'Actualidad', svg: '<path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002 2h-4"/><path d="M11 7h2m-2 4h2m-2 4h4m-6 0h2"/><circle cx="8" cy="7" r="1.5"/>' },
      { id: 'chat', label: 'Chat', svg: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' },
      { id: 'misReportes', label: 'Reporte', svg: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
      { id: 'condicion', label: 'Panorama', svg: '<rect x="3" y="3" rx="2" ry="2" width="18" height="18"/><line x1="3" y1="9" x2="21"/><line x1="9" y1="21" x2="9"/>' },
      { id: 'perfil', label: 'Perfil', svg: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    ];
    this.navDefRecibidos = { id: 'recibidos', label: 'Recibidos', svg: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0018.56 4H5.44a2 2 0 00-1.99 1.11z"/>' };
    // Recibidos only in chat top-right, NOT in nav bottom
    this._recibidosLoaded = false;
    this._recibidosList = [];
    this._misConvLoaded = false;
    this._misRepLoaded = false;

    // Sections bar — ALL screens (scrollable horizontal tabs below header)
    this.sectionsDef = [
      { id: 'home', label: 'Inicio' },
      { id: 'actualidad', label: 'Actualidad' },
      { id: 'clipping', label: 'Clipping' },
      { id: 'infomate', label: 'InfoMate' },
      { id: 'misReportes', label: 'Reporte' },
      { id: 'chat', label: 'Chat' },
      { id: 'derecho', label: 'Derecho' },
      { id: 'contenido', label: 'Contenido' },
      { id: 'condicion', label: 'Panorama' },
      { id: 'smvm', label: 'SMVM' },
      { id: 'felicidad', label: 'Felicidad' },
      { id: 've', label: 'Comp. Empre.' },
      { id: 'formacion', label: 'H. Obrera' },
      { id: 'archivo', label: 'Archivo' },
      { id: 'ecosistema', label: 'ECO' },
    ];

    this.titles = {
      home: 'Inicio',
      actualidad: 'Actualidad',
      chat: 'Chat',
      derecho: 'Derecho',
      consulta: 'Chateá con tu interlocutor/a',
      formacion: 'Historia Obrera',
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
      contenido: 'Producción de contenido',
      // Actualidad sub-screens
      clipping: 'Clipping de noticias',
      infomate: 'InfoMate',
      gremial: 'Reporte Gremial',
      historiador: 'Historiador/a',
      misConversaciones: 'Mis Conversaciones',
      misReportes: 'Mis Reportes',
    };

    // Parent screen map — back button navigation
    this._parentScreen = {
      actualidad: 'home',
      chat: 'home',
      gremial: 'chat',
      consulta: 'chat',
      contenido: 'chat',
      historiador: 'chat',
      is: 'home',
      condicion: 'home',
      perfil: 'home',
      // Actualidad sub-screens → back to actualidad
      clipping: 'actualidad',
      infomate: 'actualidad',
      // Condicion sub-screens → back to condicion
      smvm: 'condicion',
      felicidad: 'condicion',
      ve: 'condicion',
      // Other sub-screens
      ecosistema: 'home',
      formacion: 'home',
      argumento: 'home',
      comunicador: 'home',
      archivo: 'archivo',
      misConversaciones: 'chat',
      misReportes: 'chat',
    };

    this.titles.recibidos = 'Reportes Recibidos';
    this._parentScreen.recibidos = 'chat';
    // Map sub-screens to their parent bottom-nav button
    this._navParentMap = {
      actualidad: 'actualidad',
      clipping: 'clipping',
      infomate: 'infomate',
      chat: 'chat',
      consulta: 'chat',
      contenido: 'chat',
      historiador: 'chat',
      misConversaciones: 'chat',
      misReportes: 'misReportes',
      recibidos: 'chat',
      gremial: 'chat',
      condicion: 'condicion',
      smvm: 'condicion',
      felicidad: 'condicion',
      ve: 'condicion',
      ecosistema: 'home',
      formacion: 'home',
      is: 'misReportes',
      archivo: 'archivo',
      argumento: 'home',
      comunicador: 'home',
    };
    // Map sub-screens to their parent section in the sections bar
    this._sectionParentMap = {
      actualidad: 'actualidad',
      clipping: 'clipping',
      infomate: 'infomate',
      chat: 'chat',
      consulta: 'derecho',
      contenido: 'contenido',
      historiador: 'formacion',
      misConversaciones: 'chat',
      misReportes: 'misReportes',
      recibidos: 'chat',
      gremial: 'misReportes',
      is: 'misReportes',
      condicion: 'condicion',
      smvm: 'smvm',
      felicidad: 'felicidad',
      ve: 've',
      ecosistema: 'ecosistema',
      formacion: 'formacion',
      archivo: 'archivo',
      argumento: 'home',
      comunicador: 'home',
    };
  }

  // Recibidos NOT in nav bottom — only in chat top-right for grades B.b/B.c/B.d
  _getNavDef() {
    return this.navDefBase;
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
      // One-time cleanup: borrar chats + informes + correcciones (ALL users)
      // Must run BEFORE full sync so pull doesn't re-fetch old data
      if (typeof limpiarChatsYReportes === 'function') {
        await limpiarChatsYReportes();
      }
      // Iniciar full sync: pull datos remotos + push datos locales + syncQueue
      if (typeof iniciarFullSync === 'function') {
        iniciarFullSync(session.username);
      }
    }
  }

  _styles() {
    return css`
      /* ===== Phone mockup frame (desktop only) ===== */
      .app-wrap { background: var(--ho-body-bg, #141816); }
      @media(min-width:500px){
        .app-wrap { min-height: 100vh; display: flex; justify-content: center;
          align-items: flex-start; padding: 40px 20px; }
        .phone { width: 412px; background: var(--ho-dark, #1E2321);
          border-radius: 46px; padding: 12px;
          box-shadow: 0 40px 80px -30px rgba(43,42,38,.6);
          position: sticky; top: 40px; }
        .screen { background: var(--ho-bg, #1E2321); border-radius: 35px;
          overflow: hidden; height: 824px; display: flex;
          flex-direction: column; position: relative; }
        /* Desktop: show simulated status bar */
        .status-bar { background: var(--ho-dark, #1E2321); color: var(--ho-text-off, #F2F1EC);
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 22px 5px; font-size: .74rem; flex: none;
          font-family: 'JetBrains Mono', monospace; }
      }
      @media(max-width:499px){
        .app-wrap { position: fixed; inset: 0; overflow: hidden; }
        .phone { width: 100%; height: 100%; overflow: hidden; }
        .screen { background: var(--ho-dark, #1E2321); display: flex;
          flex-direction: column; position: relative;
          height: 100%; overflow: hidden; }
        /* Mobile/PWA: hide simulated status bar */
        .status-bar { display: none; }
        /* Mobile: top-bar dark background merges with system status bar */
        .top-bar { background: var(--ho-header-bg, var(--ho-dark, #1E2321));
          color: var(--ho-header-text, var(--ho-text-off, #F2F1EC)); }
        .top-bar-back { background: var(--ho-dark-surface, #3F4E4A);
          border-color: var(--ho-dark-mid, #536260); color: var(--ho-text-off, #F2F1EC); }
        .top-bar-back:hover { background: var(--ho-dark-mid, #536260);
          border-color: var(--ho-green-light, #80CCA0); }
        /* Mobile: sections-bar light in day mode, dark in night mode */
        .sections-bar { background: var(--ho-bg, var(--ho-dark-surface, #3F4E4A));
          border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
        .sections-btn { color: var(--ho-text-mid, var(--ho-text-light, #7A766C)); }
        .sections-btn.active { color: var(--ho-green, var(--ho-green-light, #80CCA0));
          border-bottom-color: var(--ho-green, var(--ho-green-light, #80CCA0)); }
        .header-text .app-brand-img { height: 44px; }
        .floating-back-btn { background: var(--ho-dark-surface, #3F4E4A);
          border-color: var(--ho-dark-mid, #536260); color: var(--ho-text-off, #F2F1EC); }
        .floating-back-btn:hover { background: var(--ho-dark-mid, #536260);
          border-color: var(--ho-green-light, #80CCA0); }
      }

      /* ===== Animations ===== */
      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }

      /* ===== Top bar — back button + title centered ===== */
      .top-bar { background: var(--ho-header-bg, var(--ho-bg, #1E2321));
        color: var(--ho-header-text, var(--ho-text, #E8E6E0));
        padding: 0 16px; display: flex; align-items: flex-end;
        justify-content: center; position: relative; flex: none;
        min-height: 0;
        padding-top: calc(26px + env(safe-area-inset-top, 0px));
        padding-bottom: 0; }
      .top-bar-back { position: absolute; left: 16px;
        top: calc(50% + env(safe-area-inset-top, 0px) / 2);
        transform: translateY(-50%); width: 30px; height: 30px;
        border-radius: 50%; border: 1px solid var(--ho-border, rgba(255,255,255,.1));
        background: var(--ho-card, #2A3230); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; flex: none; }
      .top-bar-back:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .top-bar-back svg { width: 14px; height: 14px;
        stroke: var(--ho-text-mid, #7A766C); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .top-bar-back:hover svg { stroke: var(--ho-green-dark, #3D6B56); }

      .header-text { display: flex; align-items: center; justify-content: center; gap: 8px; }
      .header-text .header-bird { height: 32px; width: auto; object-fit: contain; display: block; }
      .header-text .app-brand-img { height: 44px; width: auto; object-fit: contain;
        display: block; }
      .header-text .app-brand-img-light { filter: brightness(0) saturate(0); }

      /* ===== Floating back button — chat screens (no header, no bottom nav) ===== */
      .floating-back-btn { position: absolute; top: 8px; left: 12px;
        width: 30px; height: 30px; border-radius: 50%;
        border: 1px solid var(--ho-border, rgba(255,255,255,.1));
        background: var(--ho-card, #2A3230); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; z-index: 50; }
      .floating-back-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .floating-back-btn svg { width: 14px; height: 14px;
        stroke: var(--ho-text-mid, #7A766C); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .floating-back-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }

      /* ===== Sections bar — horizontal scrollable ===== */
      .sections-bar { background: var(--ho-bg, #1E2321);
        flex: none; display: flex; align-items: flex-end; overflow-x: auto;
        padding: 9px 8px 6px; gap: 0;
        scrollbar-width: none; border-bottom: 1px solid var(--ho-text-mid, #7A766C); }
      .sections-bar::-webkit-scrollbar { width: 0; }
      .sections-btn { font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 600; color: var(--ho-text-mid, #7A766C);
        background: none; border: none; cursor: pointer;
        padding: 4px 8px 4px; white-space: nowrap; position: relative;
        border-bottom: 2px solid transparent;
        transition: color .2s, border-color .2s; }
      .sections-btn + .sections-btn { margin-left: 8px; }
      .sections-btn + .sections-btn::before { content: ''; position: absolute; left: -5px; top: 50%; transform: translateY(-50%); border-left: 1px solid var(--ho-text-mid, #7A766C); height: 14px; }
      .sections-btn.active { color: var(--ho-green, #4E9978);
        border-bottom-color: var(--ho-green, #4E9978); }
      .sections-logo { width: 18px; height: 18px; object-fit: contain; vertical-align: middle; margin-left: -1px; }
      .sections-logo-light { filter: brightness(0.35); }

      /* ===== Body scroll — white background covers content area ===== */
      .body-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; background: var(--ho-bg, #1E2321); position: relative; }
      .body-scroll::-webkit-scrollbar { width: 0; }

      /* ===== Bottom nav — warm light background, no white ===== */
      .bottom-nav { background: var(--ho-bg, #1E2321);
        display: flex; justify-content: space-around;
        padding: 6px 0 calc(12px + env(safe-area-inset-bottom, 0px)); flex: none;
        width: 100%; z-index: 100; position: relative;
        border-top: 1px solid var(--ho-text-mid, #7A766C); }
      .nav-btn { display: flex; flex-direction: column; align-items: center;
        gap: 3px; background: none; border: none; cursor: pointer;
        padding: 4px 0; font-family: 'Archivo', sans-serif;
        transition: opacity .2s; flex: 1; min-width: 0; }
      .nav-btn svg { width: 24px; height: 24px; stroke: var(--ho-text-mid, #9C988D);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .nav-btn.active svg { stroke: var(--ho-green, #4E9978); stroke-width: 2.6; }
      .nav-btn img { width: 24px; height: 24px; object-fit: contain; opacity: .55; transition: opacity .2s; transform: scale(1.8); }
      .nav-btn.active img { opacity: 1; }
      .nav-bird-icon { filter: brightness(0.35); transform: scale(2.3); }
      .nav-btn .label { font-size: .60rem; font-weight: 600; color: var(--ho-text-mid, #9C988D);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .nav-btn.active .label { color: var(--ho-green, #4E9978); }

      /* ===== Chat landing — choice buttons ===== */
      .chat-landing { padding: 24px 20px; }
      .chat-landing-kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text, #E8E6E0); margin-bottom: 8px; }
      .chat-landing-title { font-family: 'Archivo', sans-serif; font-size: .92rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); margin-bottom: 4px; }
      .chat-landing-desc { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-light, #7A766C); line-height: 1.4; margin-bottom: 12px; }

      /* ===== Persona carousel — one at a time, 3x bigger ===== */
      .chat-persona-carousel { position: relative; margin: 0 -20px 16px; overflow: hidden; }
      .chat-persona-carousel-track { display: flex; overflow-x: auto;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; }
      .chat-persona-carousel-track::-webkit-scrollbar { width: 0; }
      .chat-persona-slide { scroll-snap-align: center; width: 100%; flex-shrink: 0;
        display: flex; flex-direction: row; align-items: center; gap: 16px;
        padding: 16px 20px; cursor: pointer; transition: transform .15s;
        background: none; border: none; font-family: 'Archivo', sans-serif; }
      .chat-persona-slide:hover { transform: scale(1.02); }
      .chat-persona-slide:active { transform: scale(.97); }
      .chat-persona-img { width: 168px; height: 168px; object-fit: contain;
        object-position: center; filter: var(--ho-persona-filter, none);
        flex: none; }
      .chat-persona-img.periodista-full { object-fit: contain; }
      .chat-persona-text { flex: 1; min-width: 0; }
      .chat-persona-name { font-family: 'Archivo', sans-serif; font-size: 1rem;
        font-weight: 800; color: var(--ho-text, #E8E6E0);
        letter-spacing: .02em; text-transform: uppercase; }
      .chat-persona-desc { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        margin-top: 4px; }
      .chat-persona-dots { display: flex; justify-content: center; gap: 6px;
        padding: 4px 0 0; }
      .chat-persona-dot { width: 8px; height: 8px; border-radius: 50%;
        background: var(--ho-border, rgba(255,255,255,.15));
        border: none; cursor: pointer; transition: background .2s, transform .2s;
        padding: 0; }
      .chat-persona-dot.active { background: var(--ho-green, #4E9978);
        transform: scale(1.3); }
      .chat-persona-dot:hover { background: var(--ho-green-light, #80CCA0); }

      /* Extra choices (Mis Conversaciones, Mis Reportes, Recibidos) — keep as cards */
      .chat-choice { display: flex; align-items: center; gap: 10px;
        background: var(--ho-card, #2A3230); border: 1px solid rgba(43,42,38,.06);
        border-radius: 10px; padding: 10px 14px; cursor: pointer;
        transition: border-color .2s, background .2s; margin-bottom: 6px;
        min-height: 52px; }
      .chat-choice:hover { border-color: rgba(43,42,38,.18);
        background: var(--ho-green-pale, #E0F0EB); }
      .chat-choice-icon { width: 32px; height: 32px; flex: none;
        display: flex; align-items: center; justify-content: center; }
      .chat-choice-icon img { width: 32px; height: 32px; object-fit: cover; object-position: center 25%;
        filter: var(--ho-persona-filter, none); }
      .chat-choice-icon img.periodista-full { object-fit: contain; object-position: center; }
      .chat-choice-icon svg { width: 20px; height: 20px; stroke: var(--ho-green, #4E9978);
        stroke-width: 1.8; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
      .chat-choice-extra .chat-choice-icon { width: 32px; height: 32px; }
      .chat-choice-extra .chat-choice-icon img { width: 32px; height: 32px; }
      .chat-choice-extra .chat-choice-icon svg { width: 20px; height: 20px; }
      .chat-choice-extra .chat-choice-name { font-size: .92rem; }
      .chat-choice-extra .chat-choice-desc { font-size: .82rem; }
      .chat-choice-extra { gap: 10px; padding: 10px 14px; border-radius: 10px; margin-bottom: 6px; }
      .persona-choice-emoji { font-size: 1.1rem; line-height: 1; }
      .persona-icon-companero { background: none; }
      .persona-icon-abogado { background: none; }
      .persona-icon-periodista { background: none; }
      .persona-icon-historiador { background: none; }
      .chat-choice-text { flex: 1; }
      .chat-choice-name { font-family: 'Archivo', sans-serif; font-size: .88rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); }
      .chat-choice-desc { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #7A766C); line-height: 1.3; margin-top: 1px; }

      /* ===== List screens (Mis Conversaciones, Mis Reportes, Recibidos) =====
         Same styles as chat drawer items for visual consistency */
      .list-screen { padding: 0; }
      .list-screen-header { padding: 16px; border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08));
        display: flex; align-items: center; gap: 10px; flex: none; position: relative; }
      .list-screen-back { width: 32px; height: 32px; border-radius: 50%;
        background: var(--ho-dark-mid, #3A4340); border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: var(--ho-text-off, #F2F1EC); flex: none; }
      .list-screen-back svg { width: 18px; height: 18px; }
      .list-screen-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); flex: 1; }
      .list-screen-plus { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; flex: none; }
      .list-screen-plus:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); transform: scale(1.08); }
      .list-screen-plus svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .list-screen-plus:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .list-screen-plus.open { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .list-screen-plus.open svg { stroke: var(--ho-green-dark, #3D6B56); }
      .list-screen-plus.open svg line:last-child { display: none; }
      .list-screen-menu { position: absolute; top: 100%; right: 16px;
        background: color-mix(in srgb, var(--ho-dark-surface, #2A2F2D) 92%, transparent);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--ho-border, rgba(255,255,255,.1));
        border-radius: 12px; padding: 6px; z-index: 30;
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        box-shadow: 0 4px 16px rgba(0,0,0,.3);
        animation: listMenuSlideDown .15s ease; }
      .theme-light .list-screen-menu {
        background: color-mix(in srgb, var(--ho-bg, #F8F6F0) 92%, transparent);
        box-shadow: 0 4px 16px rgba(0,0,0,.12); }
      @keyframes listMenuSlideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      .list-screen-menu-item { display: flex; flex-direction: column; align-items: center;
        gap: 2px; padding: 4px 0; background: none; border: none; cursor: pointer;
        text-align: center; font-family: 'Archivo', sans-serif;
        font-size: .52rem; font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        transition: opacity .2s; position: relative; }
      .list-screen-menu-item:hover { opacity: .8; }
      .list-screen-menu-item .item-icon { width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .list-screen-menu-item .item-icon svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .list-screen-menu-item:hover .item-icon { border-color: var(--ho-green-light, #80CCA0); }
      .list-screen-menu-item:hover .item-icon svg { stroke: var(--ho-green-dark, #3D6B56); }
      .list-screen-menu-item:hover { color: var(--ho-green, #4E9978); }
      .list-screen-menu-item .item-label { white-space: nowrap; }
      .list-screen-desc { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #7A766C); padding: 12px 16px 0; line-height: 1.4; }
      .list-scroll { overflow-y: auto; padding: 8px 0; }

      /* History items (Mis Conversaciones) — same as chat drawer */
      .history-item { padding: 12px 16px; cursor: pointer;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.06));
        display: flex; flex-direction: column; gap: 5px;
        transition: background .2s; }
      .history-item:hover { background: var(--ho-green-pale, #E0F0EB); }
      .history-item-section { display: flex; align-items: center; gap: 5px; }
      .history-item-section-icon { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
      .history-item-persona-img { width: 100%; height: 100%; object-fit: cover; }
      .history-item-persona-img.periodista-full { object-fit: contain; }
      .history-item-section-emoji { font-size: .82rem; line-height: 1; }
      .history-item-section-label { font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .section-consulta .history-item-section-label { color: var(--ho-green, #4E9978); }
      .section-contenido .history-item-section-label { color: #B0863F; }
      .section-debate .history-item-section-label { color: #5A7EA8; }
      .section-reporte .history-item-section-label { color: #3D6B56; }
      .section-default .history-item-section-label { color: var(--ho-green-dark, #3D6B56); }
      .history-item-preview { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); line-height: 1.3;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .history-item-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #7A766C); display: flex; gap: 8px; align-items: center; }
      .history-item-count { background: var(--ho-green-pale, #E0F0EB);
        padding: 2px 8px; border-radius: 8px; font-weight: 600;
        color: var(--ho-green-dark, #3D6B56); }
      .history-item-footer { display: flex; align-items: center;
        justify-content: space-between; margin-top: 2px; }
      .history-item-user { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #7A766C); letter-spacing: .06em;
        background: var(--ho-mid-gray, #ECEAE3); padding: 2px 8px; border-radius: 6px; font-weight: 600; }

      /* Informes items (Mis Reportes, Recibidos) — same as chat drawer */
      .informes-item { padding: 12px 16px; cursor: pointer;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.06));
        display: flex; flex-direction: column; gap: 4px;
        transition: background .2s; }
      .informes-item:hover { background: var(--ho-green-pale, #E0F0EB); }
      .informes-item-title { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); line-height: 1.3;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .informes-item-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #7A766C); display: flex; gap: 8px; align-items: center; }
      .informes-item-user { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); letter-spacing: .06em;
        background: var(--ho-mid-gray, #ECEAE3); padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .informes-item-grado { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #D4E4F7; color: #2B5278; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .informes-item-estado { background: var(--ho-green-pale, #E0F0EB);
        padding: 2px 8px; border-radius: 8px; font-weight: 600;
        color: var(--ho-green-dark, #3D6B56); }
      .informes-item-estado.estado-pendiente { background: #F0E4CC; color: #856404; }
      .informes-item-estado.estado-aceptado { background: #E0F0EB; color: #3D6B56; }
      .informes-item-estado.estado-visto { background: #D7E8F3; color: #2C5A8A; }
      .informes-item-estado.estado-aprobado { background: #C5D9A0; color: #3D6B1A; }
      .informes-item-estado.estado-corregido { background: #D7E8F3; color: #2C5A8A; }
      .informes-item-estado.estado-con-cambios { background: #D4E4F7; color: #2B5278; }
      .informes-item-pending { border-left: 3px solid var(--ho-gold, #B0863F);
        background: rgba(240,228,204,.08); }
      .informes-item-pending .informes-item-title { font-weight: 800; }
      .informes-item-reviewed .informes-item-title { font-weight: 400; }
      :host(.theme-light) .informes-item-pending { background: rgba(240,228,204,.18); }
      .informes-item-footer { display: flex; align-items: center;
        gap: 8px; margin-top: 4px; }
      .informes-item-date { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); }
      .informes-item-actions { display: flex; gap: 4px; }
      .informes-action-btn { width: 28px; height: 28px; border-radius: 8px;
        background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; }
      .informes-action-btn svg { width: 14px; height: 14px;
        stroke: var(--ho-text-light, #9C988D); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .informes-action-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .informes-action-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .informes-action-btn:disabled { opacity: .3; pointer-events: none; }
      .informes-item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .informes-item-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .informes-item-visto-label { font-family: 'Archivo', sans-serif;
        font-size: .72rem; font-weight: 700; color: var(--ho-green-dark, #3D6B56);
        background: var(--ho-green-pale, #E0F0EB); border-radius: 8px;
        padding: 3px 10px; margin-top: 4px; display: inline-block; }

      /* Expandable content inside informe items */
      .informes-expand-content { margin-top: 10px; padding-top: 10px;
        border-top: 1px solid var(--ho-border, rgba(255,255,255,.06)); }
      .informes-expand-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .84rem; color: var(--ho-green-dark, #3D6B56); margin-bottom: 4px;
        text-transform: uppercase; letter-spacing: .06em; }
      .informes-expand-section-body { font-family: 'Public Sans', sans-serif;
        font-size: .82rem; color: var(--ho-text-mid, #7A766C); line-height: 1.5;
        margin-bottom: 8px; }
      .informes-expand-divider { height: 1px; background: rgba(255,255,255,.06); margin: 8px 0; }

      .list-empty { padding: 40px 20px; text-align: center;
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #7A766C); }

      /* Recibidos review buttons — subtle icon-only */
      .recibidos-review-btn { background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        color: var(--ho-text-light, #7A766C); border-radius: 8px; padding: 6px 8px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .72rem;
        cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
        transition: background .2s, border-color .2s; }
      .recibidos-review-btn:hover { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-text-mid, #7A766C); }
      .recibidos-review-btn svg { width: 14px; height: 14px; stroke: currentColor;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }

      /* ===== Update banner ===== */
      .update-banner { background: var(--ho-green, #4E9978); color: var(--ho-text-off, #F2F1EC);
        padding: 10px 16px; display: flex; align-items: center; justify-content: space-between;
        font-family: 'Archivo', sans-serif; font-size: .82rem; font-weight: 600;
        flex: none; cursor: pointer; }
      .update-banner:hover { background: var(--ho-green-dark, #3D6B56); }
      .update-banner .update-dismiss { background: none; border: none;
        color: var(--ho-text-off, #F2F1EC); cursor: pointer; font-size: 1rem;
        padding: 4px 8px; }

      /* ===== Clipping notification banner ===== */
      .clipping-banner { background: var(--ho-green, #4E9978); color: var(--ho-text-off, #F2F1EC);
        padding: 10px 16px; display: flex; align-items: center; justify-content: space-between;
        font-family: 'Archivo', sans-serif; font-size: .82rem; font-weight: 600;
        flex: none; cursor: pointer; }
      .clipping-banner:hover { background: #3D6B56; }
      .clipping-banner .clip-banner-text { flex: 1; display: flex; align-items: center; gap: 8px; }
      .clipping-banner .clip-dismiss { background: none; border: none;
        color: var(--ho-text-off, #F2F1EC); cursor: pointer; font-size: 1rem;
        padding: 4px 8px; }

      /* ===== Profile popup ===== */
      .profile-overlay { position: fixed; inset: 0;
        background: rgba(33,31,29,.65); z-index: 200;
        display: flex; align-items: flex-start; justify-content: center;
        padding: 16px 16px 40px; overflow-y: auto; -webkit-overflow-scrolling: touch;
        animation: popfade .25s ease; }
      .profile-popup { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.12));
        border-radius: 16px; max-width: 100%; width: 380px;
        position: relative; overflow: hidden; margin-bottom: 24px; }
      .profile-close { position: absolute; top: 10px; right: 12px;
        background: var(--ho-dark-surface, #3F4E4A); color: var(--ho-text-off, #F2F1EC);
        width: 28px; height: 28px; border-radius: 50%; border: none;
        cursor: pointer; font-size: .85rem; z-index: 10;
        display: flex; align-items: center; justify-content: center; }
      .profile-popup-body { padding: 20px 16px 16px; }

      /* Toggle switch (profile popup) */
      .toggle-switch { position: relative; width: 44px; height: 24px;
        background: var(--ho-warm-gray, #3A4340); border-radius: 12px;
        cursor: pointer; transition: background .2s; flex: none; }
      .toggle-switch.active { background: var(--ho-green, #4E9978); }
      .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px;
        width: 20px; height: 20px; border-radius: 50%; background: #F2F1EC;
        transition: transform .2s; }
      .toggle-switch.active::after { transform: translateX(20px); }

      /* Theme toggle (profile popup) */
      .theme-toggle { width: 48px; height: 26px; border-radius: 13px;
        background: var(--ho-dark-mid, #3A4340); border: none; cursor: pointer;
        position: relative; transition: background .3s; flex: none; }
      .theme-toggle.active { background: var(--ho-green, #4E9978); }
      .theme-toggle-knob { position: absolute; top: 3px; left: 3px;
        width: 20px; height: 20px; border-radius: 50%;
        background: var(--ho-text-off, #F2F1EC); transition: transform .3s; }
      .theme-toggle.active .theme-toggle-knob { transform: translateX(22px); }

      /* ===== Nav badge (new clipping indicator) ===== */
      .nav-btn { position: relative; }
      .nav-badge { position: absolute; top: 2px; right: calc(50% - 18px);
        width: 8px; height: 8px; border-radius: 50%;
        background: var(--ho-green-light, #80CCA0);
        border: 1.5px solid var(--ho-bg, #1E2321); }
      .sections-btn { position: relative; }
      .sections-badge { position: absolute; top: 4px; right: 4px;
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--ho-green-light, #80CCA0); }
    `;
  }

  _render() {
    // Login gate — show login screen if not logged in (full screen, no shell chrome)
    if (!this.loggedIn) {
      return html`
        <div class="app-wrap">
          <div class="phone" style="background:#1E2321">
            <div class="screen" style="background:#1E2321;display:flex;flex-direction:column;overflow:hidden">
              <hornero-login></hornero-login>
            </div>
          </div>
        </div>
      `;
    }

    const currentTitle = this.titles[this.screen] || 'Hornero';
    // Header only visible on Home screen
    const showHeader = this.screen === 'home';
    // Bottom nav always visible — active section highlighted
    const showBottomNav = true;
    // Sections bar visible on all screens
    const showSectionsBar = true;

    // Build screen content
    let screenContent = '';
    if (this.screen === 'home') {
      screenContent = '<hornero-home grade="' + this.userGrade + '" sector="' + this.userSector + '" theme="' + this.theme + '"></hornero-home>';
    } else if (this.screen === 'is') {
      screenContent = '<hornero-is grade="' + this.userGrade + '" sector="' + this.userSector + '"></hornero-is>';
    } else if (this.screen === 'actualidad') {
      const subViewAttr = this._actualidadSubView ? ' active-sub-view="' + this._actualidadSubView + '"' : '';
      const clipEdAttr = this._clipEdicion ? ' clip-edicion="' + this._clipEdicion + '"' : '';
      const mateMesAttr = this._mateMes ? ' mate-mes="' + this._mateMes + '"' : '';
      screenContent = '<hornero-actualidad grade="' + this.userGrade + '" sector="' + this.userSector + '"' + subViewAttr + clipEdAttr + mateMesAttr + '></hornero-actualidad>';
      this._actualidadSubView = '';
    } else if (this.screen === 'clipping') {
      const edicionAttr = this._clipEdicion ? ' edicion="' + this._clipEdicion + '"' : '';
      const expandAttr = this._clipExpandId ? ' expand-id="' + this._clipExpandId + '"' : '';
      screenContent = '<hornero-clipping grade="' + this.userGrade + '" sector="' + this.userSector + '"' + edicionAttr + expandAttr + '></hornero-clipping>';
    } else if (this.screen === 'infomate') {
      const mateMesAttr = this._mateMes ? ' mate-mes="' + this._mateMes + '"' : '';
      screenContent = '<hornero-infomate grade="' + this.userGrade + '" sector="' + this.userSector + '"' + mateMesAttr + '></hornero-infomate>';
    } else if (this.screen === 'gremial') {
      screenContent = '<hornero-gremial grade="' + this.userGrade + '" sector="' + this.userSector + '" persona="' + (this._initialPersona || 'companero') + '" session-id="' + (this._initialSessionId || '') + '"></hornero-gremial>';
    } else if (this.screen === 'historiador') {
      screenContent = '<hornero-historiador grade="' + this.userGrade + '" sector="' + this.userSector + '" persona="' + (this._initialPersona || 'historiador') + '" session-id="' + (this._initialSessionId || '') + '"></hornero-historiador>';
    } else if (this.screen === 'ecosistema') {
      screenContent = '<hornero-ecosistema grade="' + this.userGrade + '" sector="' + this.userSector + '" theme="' + this.theme + '"></hornero-ecosistema>';
    } else if (this.screen === 'formacion') {
      screenContent = '<hornero-formacion grade="' + this.userGrade + '" sector="' + this.userSector + '" persona="' + (this._initialPersona || 'historiador') + '" session-id="' + (this._initialSessionId || '') + '"></hornero-formacion>';
    } else if (this.screen === 'archivo') {
      screenContent = '<hornero-archivo grade="' + this.userGrade + '" sector="' + this.userSector + '" persona="' + (this._initialPersona || 'historiador') + '" session-id="' + (this._initialSessionId || '') + '"></hornero-archivo>';
    } else if (this.screen === 'chat') {
      // Chat landing — personas + grade-based extras (Mis Chats / Mis Reportes / Recibidos)
      const grade = this.userGrade;
      const isHigherGrade = grade === 'B.b' || grade === 'B.c' || grade === 'B.d';
      const isBaseGrade = grade === 'B.a';

      // Persona data for carousel
      const personas = [
        { screen: 'gremial', persona: 'companero', img: 'assets/personajes/a02.png', alt: 'Compañero/a', emoji: '✊', name: 'Compañero/a', desc: 'Te ayudo a elaborar un reporte gremial', periodistaFull: false },
        { screen: 'consulta', persona: 'abogado', img: 'assets/personajes/a03.png', alt: 'Abogado/a', emoji: '📖', name: 'Abogado/a', desc: 'Derechos, convenios, legislación laboral', periodistaFull: false },
        { screen: 'contenido', persona: 'periodista', img: 'assets/personajes/a04.png', alt: 'Periodista', emoji: '🎙️', name: 'Periodista', desc: 'Prensa, podcasts, reels, entrevistas', periodistaFull: true },
        { screen: 'formacion', persona: 'historiador', img: 'assets/personajes/a01.png', alt: 'Historiador/a', emoji: '📜', name: 'Historiador/a', desc: 'Historia obrera, formación, archivos', periodistaFull: false },
        { screen: 'condicion', persona: 'sociologo', img: 'assets/personajes/a05.png', alt: 'Investigador/a', emoji: '🔬', name: 'Investigador/a', desc: 'Condición obrera, índices, clase trabajadora', periodistaFull: false },
      ];

      const personaSlides = personas.map(p =>
        `<button class="chat-persona-slide" data-screen="${p.screen}" data-persona="${p.persona}">` +
        `<img src="${p.img}" alt="${p.alt}" class="chat-persona-img${p.periodistaFull ? ' periodista-full' : ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="persona-choice-emoji" style="display:none;font-size:4rem">${p.emoji}</span>` +
        `<div class="chat-persona-text">` +
          `<div class="chat-persona-name">${p.name}</div>` +
          `<div class="chat-persona-desc">${p.desc}</div>` +
        `</div>` +
        `</button>`
      ).join('');

      const personaDots = personas.map((_, i) =>
        `<button class="chat-persona-dot${i === 0 ? ' active' : ''}" data-index="${i}"></button>`
      ).join('');

      const chatSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
      const reportSvg = '<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>';
      const inboxSvg = '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0018.56 4H5.44a2 2 0 00-1.99 1.11z"/>';

      // Helper for extra choice with SVG icon (Mis Chats, Mis Reportes, Recibidos)
      const svgChoiceHtml = (screen, svg, name, desc, extraClass = 'chat-choice-extra') =>
        `<div class="chat-choice ${extraClass}" data-screen="${screen}">` +
        `<div class="chat-choice-icon"><svg viewBox="0 0 24 24">${svg}</svg></div>` +
        `<div class="chat-choice-text"><div class="chat-choice-name">${name}</div><div class="chat-choice-desc">${desc}</div></div></div>`;

      // Grade-based extras — navigate to full list screens
      let extraChoices = '';
      if (isBaseGrade || isHigherGrade) {
        extraChoices += svgChoiceHtml('misConversaciones', chatSvg, 'Mis Conversaciones', 'Historial de chats de toda la página');
        extraChoices += svgChoiceHtml('misReportes', reportSvg, 'Mis Reportes', 'Informes gremiales que armaste');
      }
      if (isHigherGrade) {
        extraChoices += svgChoiceHtml('recibidos', inboxSvg, 'Reportes Recibidos', 'Informes de trabajadores bajo tu responsabilidad');
      }

      screenContent = '<div class="chat-landing">' +
        '<div class="chat-landing-kicker">Mesa de trabajo</div>' +
        '<div class="chat-landing-desc">Deslizá para elegir con quién chatear:</div>' +
        '<div class="chat-persona-carousel">' +
          '<div class="chat-persona-carousel-track" id="chatPersonaCarousel">' + personaSlides + '</div>' +
        '</div>' +
        '<div class="chat-persona-dots" id="chatPersonaDots">' + personaDots + '</div>' +
        (extraChoices ? '<div class="chat-landing-kicker" style="margin-top:16px;margin-bottom:8px">Tu actividad</div>' +
          '<div class="chat-landing-desc" style="margin-bottom:12px">Historial de tus charlas con los compañeros y de los reportes que elaboraste y recibiste.</div>' + extraChoices : '') +
      '</div>';
    } else if (this.screen === 'misConversaciones') {
      screenContent = this._renderMisConversaciones();
    } else if (this.screen === 'misReportes') {
      screenContent = this._renderMisReportes();
    } else if (this.screen === 'consulta') {
      screenContent = '<hornero-consulta grade="' + this.userGrade + '" sector="' + this.userSector + '" persona="' + (this._initialPersona || 'abogado') + '" session-id="' + (this._initialSessionId || '') + '"></hornero-consulta>';
    } else if (this.screen === 'contenido') {
      screenContent = '<hornero-contenido grade="' + this.userGrade + '" sector="' + this.userSector + '" persona="' + (this._initialPersona || 'periodista') + '" session-id="' + (this._initialSessionId || '') + '"></hornero-contenido>';
    } else if (this.screen === 'condicion') {
      screenContent = '<hornero-condicion grade="' + this.userGrade + '" sector="' + this.userSector + '" persona="' + (this._initialPersona || 'sociologo') + '" session-id="' + (this._initialSessionId || '') + '" initial-section="' + (this._initialSection || '') + '"></hornero-condicion>';
    } else if (this.screen === 'perfil') {
      screenContent = '<hornero-perfil grade="' + this.userGrade + '" sector="' + this.userSector + '" theme="' + this.theme + '"></hornero-perfil>';
    } else if (this.screen === 'recibidos') {
      screenContent = this._renderRecibidos();
    } else {
      // Placeholder for screens not yet implemented
      screenContent = '<div style="padding:40px 20px;text-align:center;color:#7A766C;font-family:Archivo,sans-serif">' +
        '<div style="font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">🏗️ EN CONSTRUCCIÓN</div>' +
        '<div style="font-size:.92rem;font-weight:700;color:#E8E6E0;margin-bottom:4px">' + currentTitle + '</div>' +
        '<div style="font-size:.82rem;color:#7A766C;line-height:1.4">Esta esfera se está desarrollando. Próximamente estará disponible.</div>' +
        '</div>';
    }

    return html`
      <div class="app-wrap">
        <div class="phone">
          <div class="screen" style="background:var(--ho-bg,#1E2321)">

            <div class="status-bar">
              <span>9:41</span>
              <span>● ● ● 📶 🔋</span>
            </div>

            ${this.updateAvailable ? '<div class="update-banner" id="updateBanner">⟳ Actualización disponible — toca para recargar<button class="update-dismiss" id="updateDismiss">✕</button></div>' : ''}

            ${this._clipBannerVisible && this.newClippingAvailable ? '<div class="clipping-banner" id="clippingBanner"><span class="clip-banner-text">📰 Nuevo clipping — Edición N°' + this._newClipNumero + '</span><button class="clip-dismiss" id="clipDismiss">✕</button></div>' : ''}
            ${showHeader ? '<div class="top-bar">' +
              '<div class="header-text">' +
                (this.theme === 'light'
                  ? '<img class="app-brand-img app-brand-img-light" src="assets/hornero-brand-typo-transparent.png" alt="HORNERO" />'
                  : '<img class="app-brand-img" src="assets/hornero-brand-typo-transparent.png" alt="HORNERO" />') +
              '</div>' +
            '</div>' : ''}

            ${showSectionsBar ? '<div class="sections-bar">' +
              this.sectionsDef.map(s => {
                const badgeHtml = (this.newClippingAvailable && s.id === 'clipping') ? '<span class="sections-badge"></span>' : '';
                const activeSection = this._sectionParentMap[this.screen] || this.screen;
                const labelHtml = s.label;
                return '<button class="sections-btn' + (s.id === activeSection ? ' active' : '') + '" data-screen="' + s.id + '">' + labelHtml + badgeHtml + '</button>';
              }).join('') +
              '</div>' : ''}

            <div class="body-scroll">
              ${(!showHeader && !showBottomNav) ? '<button class="floating-back-btn" id="floatingBackBtn"><svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>' : ''}
              ${screenContent}
            </div>

            ${showBottomNav ? '<div class="bottom-nav">' +
              this._getNavDef().map(n => {
                // Day mode: use bird line art for Inicio button
                const imgSrc = (n.id === 'home' && this.theme === 'light')
                  ? 'assets/dreamina-2026-07-30-7667-Extract only the line art of the bird an....png'
                  : n.img;
                const iconHtml = imgSrc
                  ? '<img class="' + (n.id === 'home' && this.theme === 'light' ? 'nav-bird-icon' : '') + '" src="' + imgSrc + '" alt="' + n.label + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><svg viewBox="0 0 24 24" style="display:none">' + n.svg + '</svg>'
                  : '<svg viewBox="0 0 24 24">' + n.svg + '</svg>';
                const badgeHtml = (this.newClippingAvailable && n.id === 'actualidad') ? '<span class="nav-badge"></span>' : '';
                // Resolve active nav: sub-screens map to parent nav button
                const activeNav = this._navParentMap[this.screen] || this.screen;
                return '<button class="nav-btn' + (n.id === activeNav ? ' active' : '') + '" data-screen="' + n.id + '">' +
                  iconHtml + badgeHtml +
                  '<span class="label">' + n.label + '</span>' +
                  '</button>';
              }).join('') +
              '</div>' : ''}

          </div>
        </div>
      </div>

      ${this._profileOpen ? this._renderProfilePopup() : ''}
    `;
  }

  // ===== Profile popup =====
  _renderProfilePopup() {
    const grade = this.userGrade;
    const sector = this.userSector;
    const theme = this.theme;

    // Build profile content inline (same data as hornero-perfil)
    let session = {};
    try {
      const stored = localStorage.getItem('hornero-session');
      if (stored) session = JSON.parse(stored);
    } catch(e) {}

    const gradeLabels = {
      'B.a': { num: 1, role: 'Trabajador base', color: 'green' },
      'B.b': { num: 2, role: 'Delegada', color: 'gold' },
      'B.c': { num: 3, role: 'Secretaría', color: 'mid' },
      'B.d': { num: 4, role: 'Federación', color: 'dark' },
    };
    const gradeInfo = gradeLabels[grade] || { num: 0, role: 'Sin acceso', color: '' };

    const agrem = session.agremiacion || {};
    const agremFields = [];
    if (agrem.federacion) agremFields.push({ label: 'Federación', value: agrem.federacion });
    if (agrem.sindicato) agremFields.push({ label: 'Sindicato', value: agrem.sindicato });
    const convenioLine = agrem.convenio ? (agrem.sectorName ? agrem.convenio + ' · ' + agrem.sectorName : agrem.convenio) : '';
    agremFields.push({ label: 'Convenio', value: convenioLine });
    if (agrem.territorio) agremFields.push({ label: 'Territorio', value: agrem.territorio });
    agremFields.push({ label: 'Empresa', value: agrem.empresa || '' });
    agremFields.push({ label: 'Puesto', value: agrem.puesto || '' });

    const email = session.email || '';
    const userName = this.userName || 'Usuario';

    const agremFieldsHtml = agremFields.map(f =>
      '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">' +
      '<span style="font-family:Public Sans,sans-serif;font-size:.78rem;color:var(--ho-text-mid,#9C988D);min-width:80px">' + f.label + '</span>' +
      '<span style="font-family:Public Sans,sans-serif;font-size:.82rem;color:var(--ho-text-off,#F2F1EC);font-weight:600' + (f.value ? '' : ';color:var(--ho-text-light,#7A766D)') + '">' + (f.value || '—') + '</span>' +
      '</div>'
    ).join('');

    const nivelBadgeStyle = {
      green: 'background:var(--ho-green-pale,#E0F0EB);color:var(--ho-green-dark,#3D6B56)',
      gold: 'background:#F0E4CC;color:#7A5E2C',
      mid: 'background:var(--ho-mid-gray,#ECEAE3);color:var(--ho-dark-mid,#536260)',
      dark: 'background:var(--ho-warm-gray,#E6E3DB);color:var(--ho-text,#1E2321);border:1px solid var(--ho-text,#1E2321)',
    };

    return html`
      <div class="profile-overlay" id="profileOverlay">
        <div class="profile-popup">
          <button class="profile-close" id="profileClose">✕</button>
          <div class="profile-popup-body">
            <!-- Datos Personales -->
            <div style="font-family:JetBrains Mono,monospace;font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ho-text-light,#9C988D);margin-bottom:12px">👤 DATOS PERSONALES</div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
              <span style="font-family:Public Sans,sans-serif;font-size:.78rem;color:var(--ho-text-mid,#9C988D);min-width:60px">Usuario</span>
              <span style="font-family:Public Sans,sans-serif;font-size:.86rem;color:var(--ho-text,#E8E6E0);font-weight:600">${userName}</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
              <span style="font-family:Public Sans,sans-serif;font-size:.78rem;color:var(--ho-text-mid,#9C988D);min-width:60px">Email</span>
              <span style="font-family:Public Sans,sans-serif;font-size:.86rem;font-weight:600;color:${email ? 'var(--ho-text,#E8E6E0)' : 'var(--ho-text-light,#6E6A60)'}">${email || 'No configurado'}</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
              <span style="font-family:Public Sans,sans-serif;font-size:.78rem;color:var(--ho-text-mid,#9C988D);min-width:60px">Nivel</span>
              <span style="font-family:JetBrains Mono,monospace;font-size:.62rem;font-weight:600;letter-spacing:.10em;text-transform:uppercase;padding:2px 8px;border-radius:6px;${nivelBadgeStyle[gradeInfo.color] || ''}">N${gradeInfo.num} · ${gradeInfo.role}</span>
            </div>

            <!-- Agremiación -->
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--ho-border,rgba(255,255,255,.08))">
              <div style="font-family:JetBrains Mono,monospace;font-size:.62rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;background:var(--ho-dark-surface,#3F4E4A);color:var(--ho-text-off,#F2F1EC);padding:2px 8px;border-radius:6px;display:inline-block;margin-bottom:10px">AGREMIACIÓN</div>
              ${agremFieldsHtml}
            </div>

            <!-- Notificaciones + Theme -->
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--ho-border,rgba(255,255,255,.08))">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <span style="font-family:Archivo,sans-serif;font-weight:600;font-size:.82rem;color:var(--ho-text,#E8E6E0)">🔔 Notificaciones</span>
                <div class="toggle-switch${this._pushEnabled ? ' active' : ''}" id="profile-push-toggle"></div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-family:Archivo,sans-serif;font-weight:600;font-size:.82rem;color:var(--ho-text,#E8E6E0)">☀️ Claro / Oscuro</span>
                <button class="theme-toggle${theme === 'dark' ? ' active' : ''}" id="profileThemeToggle">
                  <span class="theme-toggle-knob"></span>
                </button>
              </div>
            </div>

            <!-- Logout -->
            <button style="background:#A6553E;color:var(--ho-text-off,#F2F1EC);border:none;border-radius:10px;padding:12px 24px;font-family:Archivo,sans-serif;font-weight:700;font-size:.82rem;cursor:pointer;width:100%;margin-top:16px" id="profileLogoutBtn">Cerrar sesión</button>
          </div>
        </div>
      </div>
    `;
  }

  _closeProfilePopup() {
    this._profileOpen = false;
    // Just hide the overlay DOM — no full re-render to preserve screen state below
    const overlay = this.shadowRoot.querySelector('#profileOverlay');
    if (overlay) {
      overlay.style.transition = 'opacity .15s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 150);
    }
  }

  _afterRender() {
    // Auto-scroll sections bar to show active section
    const activeSectionBtn = this.shadowRoot.querySelector('.sections-btn.active');
    if (activeSectionBtn) {
      activeSectionBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    // Bind sections bar button clicks (top navigation)
    this.shadowRoot.querySelectorAll('.sections-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Perfil section → open profile popup instead of navigating
        if (btn.dataset.screen === 'perfil') {
          this._profileOpen = true;
          this.render();
          return;
        }
        // Derecho section → navigate to consulta with abogado persona
        if (btn.dataset.screen === 'derecho') {
          this._initialPersona = 'abogado';
          this._navigateTo('consulta');
          return;
        }
        // Reporte section → navigate to gremial with companero persona
        if (btn.dataset.screen === 'misReportes') {
          this._initialPersona = 'companero';
          this._navigateTo('gremial');
          return;
        }
        // Comp. Empre. section → navigate to condicion with initialSection=comportamiento
        if (btn.dataset.screen === 've') {
          this._initialPersona = 'sociologo';
          this._initialSection = 'comportamiento';
          this._navigateTo('condicion');
          return;
        }
        // SMVM section → navigate to condicion with initialSection=smvm
        if (btn.dataset.screen === 'smvm') {
          this._initialPersona = 'sociologo';
          this._initialSection = 'smvm';
          this._navigateTo('condicion');
          return;
        }
        // Felicidad section → navigate to condicion with initialSection=felicidad
        if (btn.dataset.screen === 'felicidad') {
          this._initialPersona = 'sociologo';
          this._initialSection = 'felicidad';
          this._navigateTo('condicion');
          return;
        }
        // Clipping section → navigate to standalone clipping screen
        if (btn.dataset.screen === 'clipping') {
          this._navigateTo('clipping');
          return;
        }
        // InfoMate section → navigate to standalone infomate screen
        if (btn.dataset.screen === 'infomate') {
          this._navigateTo('infomate');
          return;
        }
        // Contenido section → navigate to contenido with periodista persona
        if (btn.dataset.screen === 'contenido') {
          this._initialPersona = 'periodista';
          this._initialSessionId = '';
          this._navigateTo('contenido');
          return;
        }
        // Condicion section → navigate to condicion with sociologo persona
        if (btn.dataset.screen === 'condicion') {
          this._initialPersona = 'sociologo';
          this._initialSection = '';
          this._initialSessionId = '';
          this._navigateTo('condicion');
          return;
        }
        // Formacion section → navigate to formacion with historiador persona
        if (btn.dataset.screen === 'formacion') {
          this._initialPersona = 'historiador';
          this._initialSessionId = '';
          this._navigateTo('formacion');
          return;
        }
        // Archivo section → navigate to archivo with historiador persona
        if (btn.dataset.screen === 'archivo') {
          this._initialPersona = 'historiador';
          this._initialSessionId = '';
          this._navigateTo('archivo');
          return;
        }
        // Reset initial section for other navigations
        this._initialSection = '';
        this._navigateTo(btn.dataset.screen);
      });
    });
    // Bind bottom nav button clicks
    this.shadowRoot.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        // Perfil button → open profile popup instead of navigating
        if (screen === 'perfil') {
          this._profileOpen = true;
          this.render();
          return;
        }
        // Reporte button → always open as Compañero chat
        if (screen === 'gremial') {
          this._initialPersona = 'companero';
        }
        // Reporte button → navigate to Compañero chat (same as sections bar)
        if (screen === 'misReportes') {
          this._initialPersona = 'companero';
          this._navigateTo('gremial');
          return;
        }
        // Panorama button → navigate to condicion with sociologo persona
        if (screen === 'condicion') {
          this._initialPersona = 'sociologo';
          this._initialSection = '';
          this._initialSessionId = '';
          this._navigateTo('condicion');
          return;
        }
        this._navigateTo(screen);
      });
    });
    // Load recibidos data when screen is active
    if (this.screen === 'recibidos' && !this._recibidosLoaded) {
      this._loadRecibidos().then(() => { this._recibidosLoaded = true; this.render(); });
    }
    // Load misConversaciones data when screen is active
    if (this.screen === 'misConversaciones' && !this._misConvLoaded) {
      this._loadMisConversaciones().then(() => { this._misConvLoaded = true; this.render(); });
    }
    // Load misReportes data when screen is active
    if (this.screen === 'misReportes' && !this._misRepLoaded) {
      this._loadMisReportes().then(() => { this._misRepLoaded = true; this.render(); });
    }
    // Bind recibidos review buttons (aprobar/corregir) — subtle icon-only
    this.shadowRoot.querySelectorAll('.recibidos-review-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger parent list-item click
        const infId = btn.dataset.reviewInforme;
        const action = btn.dataset.reviewAction;
        if (!infId || !action) return;
        if (typeof actualizarEstadoInforme !== 'function') return;
        const newState = action === 'aprobar' ? 'aprobado-delegado' : 'corregido-delegado';
        actualizarEstadoInforme(infId, newState).then(() => {
          this._recibidosLoaded = false;
          this._loadRecibidos().then(() => { this.render(); });
        });
      });
    });
    // Bind expandable informe items (click to show/hide content)
    this.shadowRoot.querySelectorAll('[data-expand-informe]').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't expand if action button was clicked
        if (e.target.closest('.informes-action-btn')) return;
        const contentEl = item.querySelector('.informes-expand-content');
        if (contentEl) {
          contentEl.style.display = contentEl.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
    // Bind action buttons in Mis Reportes items (download, reenviar, corregir)
    this.shadowRoot.querySelectorAll('.informes-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const infId = btn.dataset.informeId;
        if (!action || !infId) return;
        if (action === 'download') {
          if (typeof obtenerInforme === 'function') {
            obtenerInforme(infId).then(inf => {
              if (inf) {
                const msgs = [{
                  role: 'hornero', text: inf.contenido || '',
                  sections: inf.sections || [],
                  tags: (inf.etiquetas && inf.etiquetas.temas) ? inf.etiquetas.temas : [],
                  time: '',
                }];
                const title = inf.sections && inf.sections.length > 0
                  ? inf.sections[0].title || 'Informe Gremial' : 'Informe Gremial';
                // Use _downloadTxt from hornero-chat if available
                const chatEl = this.shadowRoot.querySelector('hornero-gremial');
                if (chatEl && chatEl.shadowRoot) {
                  const chat = chatEl.shadowRoot.querySelector('hornero-chat');
                  if (chat && typeof chat._downloadTxt === 'function') {
                    chat._downloadTxt(msgs, title, 'informe-' + (inf.fecha || 'gremial'));
                  }
                }
              }
            }).catch(err => console.warn('App: download informe failed', err));
          }
        } else if (action === 'reenviar' || action === 'corregir') {
          if (btn.disabled) return;
          // Navigate to gremial screen and open the informe for editing
          this._initialPersona = 'companero';
          this._navigateTo('gremial');
          // After navigation, trigger edit
          setTimeout(() => {
            const comp = this.shadowRoot.querySelector('hornero-gremial');
            if (comp && typeof comp._handleInformeEdit === 'function') {
              comp._handleInformeEdit(infId);
            }
          }, 500);
        }
      });
    });
    // Bind misConversaciones session items (click to navigate to that chat)
    this.shadowRoot.querySelectorAll('[data-navigate-screen]').forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.dataset.navigateScreen;
        const persona = item.dataset.navigatePersona;
        const sessionId = item.dataset.navigateSession;
        if (screen) {
          this._initialPersona = persona || 'abogado';
          this._initialSessionId = sessionId || ''; // Pass session to load
          // If already on the same screen, load the session directly without re-navigating
          if (this.screen === screen && sessionId) {
            const screenMap = { gremial: 'hornero-gremial', historiador: 'hornero-historiador', formacion: 'hornero-formacion', consulta: 'hornero-consulta', contenido: 'hornero-contenido' };
            const comp = this.shadowRoot.querySelector(screenMap[screen]);
            if (comp && typeof comp._loadSession === 'function') {
              comp._loadSession(sessionId);
            }
            return;
          }
          this._navigateTo(screen);
        }
      });
    });
    // Bind chat-landing-icon buttons (icon row at top of Chat landing)
    this.shadowRoot.querySelectorAll('.chat-landing-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        this._navigateTo(btn.dataset.screen);
      });
    });
    // Bind chat-persona-slide buttons (carousel on Chat landing)
    this.shadowRoot.querySelectorAll('.chat-persona-slide').forEach(btn => {
      btn.addEventListener('click', () => {
        this._initialPersona = btn.dataset.persona || 'abogado';
        this._initialSessionId = '';
        this._navigateTo(btn.dataset.screen);
      });
    });
    // Persona carousel — scroll tracking + dots
    const chatCarousel = this.shadowRoot.querySelector('#chatPersonaCarousel');
    const chatDots = this.shadowRoot.querySelector('#chatPersonaDots');
    if (chatCarousel && chatDots) {
      chatCarousel.addEventListener('scroll', () => {
        const idx = Math.round(chatCarousel.scrollLeft / chatCarousel.offsetWidth);
        chatDots.querySelectorAll('.chat-persona-dot').forEach((d, i) => {
          d.classList.toggle('active', i === idx);
        });
      });
      chatDots.querySelectorAll('.chat-persona-dot').forEach(d => {
        d.addEventListener('click', () => {
          const idx = parseInt(d.dataset.index);
          chatCarousel.scrollTo({ left: idx * chatCarousel.offsetWidth, behavior: 'smooth' });
        });
      });
    }
    // Bind chat-choice buttons (Chat landing screen — extra choices)
    this.shadowRoot.querySelectorAll('.chat-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        this._initialPersona = btn.dataset.persona || 'abogado';
        this._initialSessionId = ''; // New chat — no session to load
        this._navigateTo(btn.dataset.screen);
      });
    });
    // Bind floating back button on chat screens (no header, no bottom nav)
    const floatingBackBtn = this.shadowRoot.querySelector('#floatingBackBtn');
    if (floatingBackBtn) {
      floatingBackBtn.addEventListener('click', () => {
        const parent = this._parentScreen[this.screen] || 'home';
        this._navigateTo(parent);
      });
    }
    // Bind list screen back button (Mis Conversaciones, Mis Reportes, Recibidos)
    const listBackBtn = this.shadowRoot.querySelector('#listBackBtn');
    if (listBackBtn) {
      listBackBtn.addEventListener('click', () => {
        const parent = this._parentScreen[this.screen] || 'home';
        this._navigateTo(parent);
      });
    }
    // Bind list screen + button (Mis Conversaciones, Mis Reportes, Recibidos)
    const listPlusBtn = this.shadowRoot.querySelector('#listPlusBtn');
    const listPlusMenu = this.shadowRoot.querySelector('#listPlusMenu');
    if (listPlusBtn && listPlusMenu) {
      listPlusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = listPlusMenu.style.display !== 'none';
        if (isVisible) {
          listPlusMenu.style.display = 'none';
          listPlusBtn.classList.remove('open');
        } else {
          listPlusMenu.style.display = 'flex';
          listPlusBtn.classList.add('open');
        }
      });
      listPlusMenu.querySelectorAll('.list-screen-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const target = item.dataset.screen;
          listPlusMenu.style.display = 'none';
          listPlusBtn.classList.remove('open');
          if (target) this._navigateTo(target);
        });
      });
      // Close menu on outside click
      const closeMenu = (e) => {
        if (!listPlusMenu.contains(e.target) && e.target !== listPlusBtn) {
          listPlusMenu.style.display = 'none';
          listPlusBtn.classList.remove('open');
        }
      };
      this.shadowRoot.removeEventListener('click', this._listPlusMenuClose);
      this._listPlusMenuClose = closeMenu;
      this.shadowRoot.addEventListener('click', closeMenu);
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
    // Bind clipping notification banner
    const clippingBanner = this.shadowRoot.querySelector('#clippingBanner');
    if (clippingBanner) clippingBanner.addEventListener('click', () => {
      if (typeof acknowledgeClipping === 'function') {
        acknowledgeClipping(this._newClipVersion);
      }
      this._clipEdicion = this._newClipNumero || null;
      this._navigateTo('clipping');
    });
    const clipDismiss = this.shadowRoot.querySelector('#clipDismiss');
    if (clipDismiss) clipDismiss.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof dismissClippingNotification === 'function') {
        dismissClippingNotification(this._newClipVersion);
      }
      this._clipBannerVisible = false;
      this.render();
    });
    // Bind profile popup close
    const profileClose = this.shadowRoot.querySelector('#profileClose');
    if (profileClose) profileClose.addEventListener('click', () => this._closeProfilePopup());
    const profileOverlay = this.shadowRoot.querySelector('#profileOverlay');
    if (profileOverlay) profileOverlay.addEventListener('click', (e) => {
      if (e.target === profileOverlay) this._closeProfilePopup();
    });
    // Bind profile popup: theme toggle
    const profileThemeToggle = this.shadowRoot.querySelector('#profileThemeToggle');
    if (profileThemeToggle) profileThemeToggle.addEventListener('click', () => {
      const newTheme = this.theme === 'light' ? 'dark' : 'light';
      this.set('theme', newTheme);
      localStorage.setItem('hornero-theme', newTheme);
      this._updateThemeColor();
      this.render(); // re-render popup with new theme
    });
    // Bind profile popup: push toggle
    const profilePushToggle = this.shadowRoot.querySelector('#profile-push-toggle');
    if (profilePushToggle) profilePushToggle.addEventListener('click', async () => {
      if (this._pushEnabled) {
        if (typeof unsubscribeUser === 'function') await unsubscribeUser();
        this._pushEnabled = false;
      } else {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'denied') return;
        if (typeof requestNotificationPermission === 'function') {
          const permission = await requestNotificationPermission();
          if (permission === 'granted' && typeof subscribeUser === 'function') {
            try { await subscribeUser(); this._pushEnabled = true; } catch(e) { this._pushEnabled = false; }
          }
        }
      }
      this.render();
    });
    // Bind profile popup: logout
    const profileLogoutBtn = this.shadowRoot.querySelector('#profileLogoutBtn');
    if (profileLogoutBtn) profileLogoutBtn.addEventListener('click', () => {
      this._closeProfilePopup();
      this._handleLogout();
    });

    // Acknowledge clipping when navigating to clipping screen
    if (this.screen === 'clipping' && this.newClippingAvailable && typeof acknowledgeClipping === 'function') {
      acknowledgeClipping(this._newClipVersion);
    }
    // Listen for screen-change from child components (crosses Shadow DOM)
    this.shadowRoot.addEventListener('screen-change', (e) => {
      const detail = e.detail || {};
      this._clipEdicion = detail.clipEdicion || null;
      this._clipExpandId = detail.clipExpandId || null;
      this._mateMes = detail.mateMes || null;
      if (detail.persona) {
        this._initialPersona = detail.persona;
      }
      // Intra-screen persona switch: just update persona, don't destroy component
      if (detail.screen === this.screen && detail.persona) {
        const screenSelectors = {
          'consulta': 'hornero-consulta',
          'contenido': 'hornero-contenido',
          'gremial': 'hornero-gremial',
          'historiador': 'hornero-historiador',
        };
        const selector = screenSelectors[detail.screen];
        const el = selector ? this.shadowRoot.querySelector(selector) : null;
        if (el) {
          el._activePersona = detail.persona;
          el.render();
          e.stopImmediatePropagation(); // Don't navigate — just re-render with new persona
          return;
        }
      }
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
      // One-time cleanup then full sync
      if (typeof limpiarChatsYReportes === 'function') {
        limpiarChatsYReportes().then(function() {
          if (typeof iniciarFullSync === 'function') {
            iniciarFullSync(session.username);
          }
        });
      } else if (typeof iniciarFullSync === 'function') {
        iniciarFullSync(session.username);
      }
    });

    // Listen for logout from any child component (Perfil screen)
    this.shadowRoot.addEventListener('logout-request', () => {
      this._handleLogout();
    });

    // Listen for theme-change from <hornero-perfil> (dark/light toggle)
    this.shadowRoot.addEventListener('theme-change', (e) => {
      const newTheme = e.detail.theme;
      if (newTheme === 'dark' || newTheme === 'light') {
        localStorage.setItem('hornero-theme', newTheme);
        this.set('theme', newTheme);
        this._updateThemeColor();
      }
    });

    // Listen for profile-updated from <hornero-perfil> (name/email changes)
    this.shadowRoot.addEventListener('profile-updated', (e) => {
      if (e.detail && e.detail.nombre) {
        this.set('userName', e.detail.nombre);
      }
    });

    // Listen for ho-navigate from child components (e.g., Explorar in Actualidad)
    this.shadowRoot.addEventListener('ho-navigate', (e) => {
      if (e.detail && e.detail.screen) {
        if (e.detail.mateMes) this._mateMes = e.detail.mateMes;
        if (e.detail.clipEdicion) this._clipEdicion = e.detail.clipEdicion;
        this._navigateTo(e.detail.screen);
      }
    });

    // Listen for push notification click messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this._swMessageHandler);
      this._swMessageHandler = (e) => {
        if (e.data && e.data.type === 'NAVIGATE_CLIPPING') {
          this._clipEdicion = e.data.edicion || null;
          this._navigateTo('clipping');
        }
      };
      navigator.serviceWorker.addEventListener('message', this._swMessageHandler);
    }

    // Persona now flows via HTML attributes — no need for direct-property-set hack

  }

  // ===== Navigation with History API =====
  _navigateTo(screen) {
    // Reset caches when navigating away from data screens
    if (this.screen === 'recibidos' && screen !== 'recibidos') this._recibidosLoaded = false;
    if (this.screen === 'misConversaciones' && screen !== 'misConversaciones') this._misConvLoaded = false;
    if (this.screen === 'misReportes' && screen !== 'misReportes') this._misRepLoaded = false;
    // If navigating to same screen, force re-render to reset component state (e.g., expanded banner)
    if (this.screen === screen) {
      this.set('screen', ''); // Clear first to force change
      this.set('screen', screen); // Re-render with fresh state
      this._initialSection = '';
      this._actualidadSubView = '';
      return;
    }
    // Only push state if screen actually changes (avoid duplicate history entries)
    if (this.screen !== screen) {
      history.pushState({ screen: screen }, '', '#' + screen);
    }
    this.set('screen', screen);
  }

  // ===== Theme switching — CSS variables cascade through Shadow DOM =====
  _applyTheme() {
    const lightVars = {
      '--ho-bg': '#F8F6F0',
      '--ho-card': '#FFFFFF',
      '--ho-dark': '#F0EDE5',
      '--ho-dark-surface': '#E8E4DB',
      '--ho-dark-mid': '#D5D0C8',
      '--ho-text': '#1E2321',
      '--ho-text-mid': '#5A5650',
      '--ho-text-light': '#7A766C',
      '--ho-text-off': '#1E2321',
      '--ho-green': '#2E6B4E',
      '--ho-green-light': '#4E9978',
      '--ho-green-pale': '#E0F0EB',
      '--ho-green-dark': '#3D6B56',
      '--ho-body-bg': '#E8E4DB',
      '--ho-border': 'rgba(0,0,0,.08)',
      '--ho-input-border': 'rgba(0,0,0,.1)',
      '--ho-shadow': 'rgba(0,0,0,.15)',
      '--ho-warm-gray': '#D5D0C8',
      '--ho-mid-gray': '#E8E4DB',
      '--ho-header-bg': '#F8F6F0',
      '--ho-header-text': '#1E2321',
      '--ho-header-surface': '#F0EDE5',
      '--ho-persona-filter': 'saturate(1.3) brightness(1.1)',
    };
    if (this.theme === 'light') {
      Object.entries(lightVars).forEach(([k, v]) => this.style.setProperty(k, v));
    } else {
      // Reset to dark defaults — remove overrides so :root values take effect
      Object.keys(lightVars).forEach(k => this.style.removeProperty(k));
    }
  }

  // ===== Theme color — status bar + bottom bar match app color =====
  _updateThemeColor() {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) return;

    const isLight = this.theme === 'light';
    const appBg = isLight ? '#F8F6F0' : '#1E2321';
    const loginBg = isLight ? '#F8F6F0' : '#1E2321';

    // Login screen or main app → same bg
    const bg = this.loggedIn ? appBg : loginBg;
    metaTheme.setAttribute('content', bg);
    document.documentElement.style.setProperty('background', bg, 'important');
    document.body.style.setProperty('background', bg, 'important');

    // iOS: update apple status bar style
    const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleMeta) {
      appleMeta.setAttribute('content', isLight ? 'default' : 'black-translucent');
    }

    // Apply CSS variable overrides on host element (cascades into Shadow DOM)
    this._applyTheme();
  }

  // Override attributeChangedCallback to update theme when screen/login changes
  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback(name, oldVal, newVal);
    if (name === 'screen' || name === 'loggedIn') {
      this._updateThemeColor();
    }
  }

  // ===== Recibidos screen: incoming reports from lower grades =====
  _renderRecibidos() {
    const list = this.recibidosList || [];
    const backSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const backBtn = '<button class="list-screen-back" id="listBackBtn">' + backSvg + '</button>';
    const plusSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    const plusBtn = '<button class="list-screen-plus" id="listPlusBtn">' + plusSvg + '</button>';
    const chatSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
    const reportSvg = '<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>';
    const menuHtml = '<div class="list-screen-menu" id="listPlusMenu" style="display:none">' +
      '<button class="list-screen-menu-item" data-screen="misConversaciones"><span class="item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + chatSvg + '</svg></span><span class="item-label">Historial</span></button>' +
      '<button class="list-screen-menu-item" data-screen="misReportes"><span class="item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + reportSvg + '</svg></span><span class="item-label">Reportes</span></button>' +
    '</div>';
    const headerRight = plusBtn + menuHtml;
    const estadoLabelMap = {
      'pendiente': 'Pendiente',
      'visto': 'Visto',
      'aceptado': 'Aprobado por trabajador',
      'aprobado': 'Aprobado sin cambios',
      'aprobado-con-cambios': 'Aprobado con cambios',
      'aprobado-delegado': 'Aprobado sin cambios',
      'corregido-delegado': 'Aprobado con cambios',
    };
    const approveSvg = '<polyline points="20 6 9 17 4 12"/>';
    const editSvg = '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';
    if (list.length === 0) {
      return '<div class="list-screen">' +
        '<div class="list-screen-header">' + backBtn + '<div class="list-screen-title">Reportes Recibidos</div>' + headerRight + '</div>' +
        '<div class="list-empty">No hay reportes pendientes de revision</div>' +
      '</div>';
    }
    const items = list.map(inf => {
      const title = inf.numero ? 'Reporte Gremial N°' + inf.numero :
        (inf.sections && inf.sections[0] ? (inf.sections[0].title || '').substring(0, 60) : (inf.contenido || '').substring(0, 60));
      const dateStr = inf.fecha || '';
      const estado = inf.estado || 'pendiente';
      const estadoLabel = estadoLabelMap[estado] || estado;
      const estadoClassMap = {
        'pendiente': 'estado-pendiente',
        'visto': 'estado-visto',
        'aceptado': 'estado-aceptado',
        'aprobado': 'estado-aprobado',
        'aprobado-con-cambios': 'estado-con-cambios',
        'aprobado-delegado': 'estado-aprobado',
        'corregido-delegado': 'estado-con-cambios',
      };
      const estadoClass = estadoClassMap[estado] || '';
      const isPending = estado === 'pendiente' || estado === 'visto' || estado === 'aceptado';
      const statusClass = isPending ? ' informes-item-pending' : ' informes-item-reviewed';
      const titleStyle = isPending ? 'font-weight:800' : 'font-weight:400';
      const usernameTag = inf.username ? '@' + inf.username : '';
      const empresaTag = inf.empresa || '';
      const gradoTag = inf.grado ? 'G' + inf.grado : '';
      let contentHtml = '';
      if (inf.sections && inf.sections.length > 0) {
        contentHtml = inf.sections.map((s, i) => {
          let sec = '';
          if (s.title) sec += '<div class="informes-expand-section-title">' + s.title + '</div>';
          if (s.body) sec += '<div class="informes-expand-section-body">' + s.body.substring(0, 300) + (s.body.length > 300 ? '...' : '') + '</div>';
          const divider = (i < inf.sections.length - 1) ? '<div class="informes-expand-divider"></div>' : '';
          return sec + divider;
        }).join('');
      } else if (inf.contenido) {
        contentHtml = '<div class="informes-expand-section-body">' + inf.contenido.substring(0, 300) + (inf.contenido.length > 300 ? '...' : '') + '</div>';
      }
      return '<div class="informes-item' + statusClass + '" data-expand-informe="' + inf.id + '">' +
        '<div class="informes-item-title" style="' + titleStyle + '">' + (title || 'Informe gremial') + '</div>' +
        '<div class="informes-item-meta">' +
          '<span>' + dateStr + '</span>' +
          '<span class="history-item-user">' + usernameTag + '</span>' +
          (gradoTag ? '<span class="informes-item-tag" style="background:#D4E4F7;color:#2B5278">' + gradoTag + '</span>' : '') +
          (empresaTag ? '<span class="informes-item-tag">' + empresaTag + '</span>' : '') +
          '<span class="informes-item-estado ' + estadoClass + '">' + estadoLabel + '</span>' +
        '</div>' +
        '<div class="informes-expand-content" style="display:none">' + contentHtml + '</div>' +
        (isPending ? '<div style="display:flex;gap:6px;margin-top:6px">' +
          '<button class="recibidos-review-btn" data-review-informe="' + inf.id + '" data-review-action="aprobar" title="Aprobar"><svg viewBox="0 0 24 24">' + approveSvg + '</svg></button>' +
          '<button class="recibidos-review-btn" data-review-informe="' + inf.id + '" data-review-action="corregir" title="Corregir"><svg viewBox="0 0 24 24">' + editSvg + '</svg></button>' +
        '</div>' : '') +
      '</div>';
    }).join('');
    return '<div class="list-screen">' +
      '<div class="list-screen-header">' + backBtn + '<div class="list-screen-title">Reportes Recibidos</div>' + headerRight + '</div>' +
      '<div class="list-screen-desc">Informes de trabajadores bajo tu responsabilidad. Los pendientes figuran en negrita.</div>' +
      '<div class="list-scroll">' + items + '</div>' +
    '</div>';
  }

    async _loadRecibidos() {
    if (typeof obtenerInformesEntrantes !== 'function') {
      this.recibidosList = [];
      return;
    }
    const session = JSON.parse(localStorage.getItem('hornero-session') || '{}');
    const userGrade = session.grade || 'A';
    const userEmpresa = (session.agremiacion && session.agremiacion.empresa) || '';
    const userTerritory = session.territory || '';
    try {
      this.recibidosList = await obtenerInformesEntrantes(userGrade, userTerritory, userEmpresa);
    } catch(e) {
      console.warn('App: recibidos load failed', e);
      this.recibidosList = [];
    }
  }

  // ===== Mis Conversaciones screen: full list of all chat sessions =====
  _renderMisConversaciones() {
    const list = this.misConversacionesList || [];
    const backSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const backBtn = '<button class="list-screen-back" id="listBackBtn">' + backSvg + '</button>';
    const plusSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    const plusBtn = '<button class="list-screen-plus" id="listPlusBtn">' + plusSvg + '</button>';
    const reportSvg = '<path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>';
    const inboxSvg = '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0018.56 4H5.44a2 2 0 00-1.99 1.11z"/>';
    const menuHtml = '<div class="list-screen-menu" id="listPlusMenu" style="display:none">' +
      '<button class="list-screen-menu-item" data-screen="misReportes"><span class="item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + reportSvg + '</svg></span><span class="item-label">Reportes</span></button>' +
      '<button class="list-screen-menu-item" data-screen="recibidos"><span class="item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inboxSvg + '</svg></span><span class="item-label">Recibidos</span></button>' +
    '</div>';
    const headerRight = plusBtn + menuHtml;
    const sectionConfig = {
      consulta:  { emoji: '♣', label: 'Consulta',  color: '#2B5278', persona: 'abogado', img: 'assets/personajes/a03.png' },
      contenido: { emoji: '♪', label: 'Contenido', color: '#5A4A3A', persona: 'periodista', img: 'assets/personajes/a04.png' },
      debate:    { emoji: '♠', label: 'Compañero/a', color: '#7A3B1E', persona: 'companero', img: 'assets/personajes/a02.png' },
      reporte:   { emoji: '♠', label: 'Compañero/a', color: '#7A3B1E', persona: 'companero', img: 'assets/personajes/a02.png' },
      historia:  { emoji: '♤', label: 'Historia',   color: '#4A3A5A', persona: 'historiador', img: 'assets/personajes/a01.png' },
    };
    const defaultSection = { emoji: '♠', label: 'Hornero', color: '#7A3B1E', persona: 'abogado', img: 'assets/personajes/a03.png' };
    if (list.length === 0) {
      return '<div class="list-screen">' +
        '<div class="list-screen-header">' + backBtn + '<div class="list-screen-title">Mis Conversaciones</div>' + headerRight + '</div>' +
        '<div class="list-empty">No hay chats guardados</div>' +
      '</div>';
    }
    const items = list.map(s => {
      const sec = sectionConfig[s.section] || defaultSection;
      const sectionClass = s.section ? 'section-' + s.section : 'section-default';
      const dateStr = s.timestamp ? new Date(s.timestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '';
      const timeStr = s.timestamp ? new Date(s.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      const navScreen = s.section === 'reporte' ? 'gremial' : s.section === 'contenido' ? 'contenido' : s.section === 'historia' ? 'formacion' : 'consulta';
      const personaKey = s.persona || sec.persona;
      const navPersona = personaKey === 'companero' ? 'companero' : personaKey === 'historiador' ? 'historiador' : personaKey === 'periodista' ? 'periodista' : 'abogado';
      const imgSrc = sec.img;
      const iconInner = imgSrc
        ? '<img src="' + imgSrc + '" alt="' + sec.label + '" class="history-item-persona-img' + (personaKey === 'periodista' ? ' periodista-full' : '') + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline\'"><span class="history-item-section-emoji" style="display:none">' + sec.emoji + '</span>'
        : '<span class="history-item-section-emoji">' + sec.emoji + '</span>';
      return '<div class="history-item" data-navigate-screen="' + navScreen + '" data-navigate-persona="' + navPersona + '" data-navigate-session="' + s.sessionId + '">' +
        '<div class="history-item-section ' + sectionClass + '">' +
          '<span class="history-item-section-icon">' + iconInner + '</span>' +
          '<span class="history-item-section-label">' + sec.label + '</span>' +
        '</div>' +
        '<div class="history-item-preview">' + (s.preview || 'Nuevo chat') + '</div>' +
        '<div class="history-item-meta">' +
          '<span>' + dateStr + ' · ' + timeStr + '</span>' +
          '<span class="history-item-count">' + s.messageCount + ' msgs</span>' +
        '</div>' +
        '<div class="history-item-footer">' +
          (s.username ? '<span class="history-item-user">@' + s.username + '</span>' : '<span></span>') +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="list-screen">' +
      '<div class="list-screen-header">' + backBtn + '<div class="list-screen-title">Mis Conversaciones</div>' + headerRight + '</div>' +
      '<div class="list-screen-desc">Historial de chats de toda la pagina. Toca una conversacion para continuar.</div>' +
      '<div class="list-scroll">' + items + '</div>' +
    '</div>';
  }

    async _loadMisConversaciones() {
    const session = JSON.parse(localStorage.getItem('hornero-session') || '{}');
    const username = session.username || '';
    try {
      if (typeof obtenerChatSessions === 'function') {
        this.misConversacionesList = await obtenerChatSessions(username);
      } else {
        this.misConversacionesList = [];
      }
    } catch(e) {
      console.warn('App: misConversaciones load failed', e);
      this.misConversacionesList = [];
    }
  }

  // ===== Mis Reportes screen =====
  _renderMisReportes() {
    const list = this.misReportesList || [];
    const backSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const backBtn = '<button class="list-screen-back" id="listBackBtn">' + backSvg + '</button>';
    const plusSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    const plusBtn = '<button class="list-screen-plus" id="listPlusBtn">' + plusSvg + '</button>';
    const chatSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
    const inboxSvg = '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0018.56 4H5.44a2 2 0 00-1.99 1.11z"/>';
    const menuHtml = '<div class="list-screen-menu" id="listPlusMenu" style="display:none">' +
      '<button class="list-screen-menu-item" data-screen="misConversaciones"><span class="item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + chatSvg + '</svg></span><span class="item-label">Historial</span></button>' +
      '<button class="list-screen-menu-item" data-screen="recibidos"><span class="item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inboxSvg + '</svg></span><span class="item-label">Recibidos</span></button>' +
    '</div>';
    const headerRight = plusBtn + menuHtml;
    const estadoLabelMap = {
      'pendiente': 'Pendiente de revision',
      'aceptado': 'Aprobado por trabajador',
      'visto': 'Visto por delegado',
      'aprobado': 'Aprobado sin cambios',
      'aprobado-con-cambios': 'Aprobado con cambios',
      'aprobado-delegado': 'Aprobado sin cambios',
      'corregido': 'Modificado',
      'corregido-delegado': 'Aprobado con cambios',
    };
    const estadoClassMap = {
      'pendiente': 'estado-pendiente',
      'aceptado': 'estado-aceptado',
      'visto': 'estado-visto',
      'aprobado': 'estado-aprobado',
      'aprobado-con-cambios': 'estado-con-cambios',
      'aprobado-delegado': 'estado-aprobado',
      'corregido': 'estado-corregido',
      'corregido-delegado': 'estado-con-cambios',
    };
    if (list.length === 0) {
      return '<div class="list-screen">' +
        '<div class="list-screen-header">' + backBtn + '<div class="list-screen-title">Mis Reportes</div>' + headerRight + '</div>' +
        '<div class="list-empty">No hay informes guardados</div>' +
      '</div>';
    }
    const items = list.map(inf => {
      const numero = inf.numero || '';
      const titleText = numero ? 'Reporte Gremial N°' + numero :
        (inf.sections && inf.sections.length > 0 ?
          (inf.sections[0].title || inf.sections[0].body || '').substring(0, 80) :
          (inf.contenido || '').substring(0, 80));
      const dateStr = inf.fecha || '';
      const displayEstado = inf.estado || 'pendiente';
      const estadoClass = estadoClassMap[displayEstado] || '';
      const estadoLabel = estadoLabelMap[displayEstado] || displayEstado;
      const gradoBadge = inf.grado ? '<span class="informes-item-grado">G' + inf.grado + '</span>' : '';
      const canEdit = displayEstado === 'pendiente' || displayEstado === 'aceptado';
      const isPending = displayEstado === 'pendiente' || displayEstado === 'visto' || displayEstado === 'aceptado';
      const statusClass = isPending ? ' informes-item-pending' : ' informes-item-reviewed';
      const titleStyle = isPending ? 'font-weight:800' : 'font-weight:400';
      const corregirDisabled = canEdit ? '' : ' disabled';
      let contentHtml = '';
      if (inf.sections && inf.sections.length > 0) {
        contentHtml = inf.sections.map((s, i) => {
          let sec = '';
          if (s.title) sec += '<div class="informes-expand-section-title">' + s.title + '</div>';
          if (s.body) sec += '<div class="informes-expand-section-body">' + s.body.substring(0, 300) + (s.body.length > 300 ? '...' : '') + '</div>';
          const divider = (i < inf.sections.length - 1) ? '<div class="informes-expand-divider"></div>' : '';
          return sec + divider;
        }).join('');
      } else if (inf.contenido) {
        contentHtml = '<div class="informes-expand-section-body">' + inf.contenido.substring(0, 300) + (inf.contenido.length > 300 ? '...' : '') + '</div>';
      }
      return '<div class="informes-item' + statusClass + '" data-expand-informe="' + inf.id + '">' +
        '<div class="informes-item-title" style="' + titleStyle + '">' + (titleText || 'Informe gremial') + '</div>' +
        '<div class="informes-item-meta">' +
          (inf.username ? '<span class="informes-item-user">@' + inf.username + '</span>' : '') +
          gradoBadge +
          '<span class="informes-item-estado ' + estadoClass + '">' + estadoLabel + '</span>' +
        '</div>' +
        '<div class="informes-item-footer">' +
          '<span class="informes-item-date">' + dateStr + '</span>' +
          '<div class="informes-item-actions">' +
            '<button class="informes-action-btn" data-action="download" data-informe-id="' + inf.id + '" title="Descargar">' +
              '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            '</button>' +
            '<button class="informes-action-btn" data-action="reenviar" data-informe-id="' + inf.id + '" title="Reenviar">' +
              '<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
            '</button>' +
            '<button class="informes-action-btn" data-action="corregir" data-informe-id="' + inf.id + '" title="Corregir"' + corregirDisabled + '>' +
              '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="informes-expand-content" style="display:none">' + contentHtml + '</div>' +
      '</div>';
    }).join('');
    return '<div class="list-screen">' +
      '<div class="list-screen-header">' + backBtn + '<div class="list-screen-title">Mis Reportes</div>' + headerRight + '</div>' +
      '<div class="list-screen-desc">Informes gremiales que armaste. Toca un informe para leerlo.</div>' +
      '<div class="list-scroll">' + items + '</div>' +
    '</div>';
  }

    async _loadMisReportes() {
    const session = JSON.parse(localStorage.getItem('hornero-session') || '{}');
    const username = session.username || '';
    try {
      if (typeof obtenerInformesTodos === 'function') {
        this.misReportesList = await obtenerInformesTodos(username);
      } else {
        this.misReportesList = [];
      }
    } catch(e) {
      console.warn('App: misReportes load failed', e);
      this.misReportesList = [];
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
