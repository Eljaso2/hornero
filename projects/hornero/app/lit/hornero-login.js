// ===== <hornero-login> — Login + Signup screen =====
// Auth via backend JWT (/api/auth/login, /api/auth/register)
// Fallback to PILOT_USERS if backend not available (transition period)
// Guarda sesión en IndexedDB uiState (key 'session')

import { HoComponent, html, css } from './ho-component.js';

// Usuarios piloto — FALLBACK cuando backend no disponible
// Se eliminarán en Fase 0.c cuando auth sea obligatorio
const PILOT_USERS = {
  'eljaso':   { password: 'hornero2026', grade: 'B.d', territory: 'norte-santa-fe', sector: 'hornero', nombre: 'Eljaso',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Administrador', federacion: 'Hornero', sindicato: 'Hornero', convenio: '', sectorName: '', territorio: 'Norte de Santa Fe', empresa: '', puesto: '' } },
  'test4':    { password: 'fed2026',     grade: 'B.d', territory: 'rosario', sector: 'aceitero', nombre: 'Tester N4 — Federación',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Secretario General de la Federación', federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Rosario', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Rosario', empresa: 'Dreyfus', puesto: 'Operario de planta' } },
  'test3':    { password: 'sec2026',     grade: 'B.c', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Tester N3 — Secretario General Sindicato Reconquista',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Secretario General del Sindicato', federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Norte de Santa Fe', empresa: '', puesto: '' } },
  'test_guaycuru': { password: 'delguay2026', grade: 'B.b', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Delegado Desmotadora Guaycurú',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Delegado', federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Norte de Santa Fe', empresa: 'Desmotadora Guaycurú', puesto: 'Operario de desmotadora' } },
  'test2':    { password: 'del2026',     grade: 'B.b', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Tester N2 — Delegada',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Delegado', federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Norte de Santa Fe', empresa: 'Vicentín SAIC', puesto: 'Operario de planta' } },
  'test1a':   { password: 'base2026',    grade: 'B.a', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Tester N1 (base)',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Trabajador de Base', federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Norte de Santa Fe', empresa: 'Vicentín SAIC', puesto: 'Operario de planta' } },
  'test1b':   { password: 'adm2026',     grade: 'B.a', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Tester N1 (administración)',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Trabajador de Base', federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Norte de Santa Fe', empresa: 'Vicentín SAIC', puesto: 'Administración' } },
  'test1c':   { password: 'obrero2026',    grade: 'B.a', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Tester N1C — Obrero Guaycurú',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Trabajador de Base', federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Norte de Santa Fe', empresa: 'Desmotadora Guaycurú', puesto: 'Operario de desmotadora' } },
  'test_prensa4':  { password: 'prensa2026',  grade: 'B.d', territory: 'caba', sector: 'prensa', nombre: 'Tester P4 — SIPREBA',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Secretario General de SIPREBA', federacion: 'SIPREBA', sindicato: 'SIPREBA (Sindicato de Prensa de Buenos Aires)', convenio: 'CCT 301/75', sectorName: 'Prensa y periodismo', territorio: 'CABA', empresa: '', puesto: '' } },
  'test_prensa3':  { password: 'secprensa2026', grade: 'B.c', territory: 'caba', sector: 'prensa', nombre: 'Tester P3 — Secretario Seccional',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Secretario Seccional', federacion: 'SIPREBA', sindicato: 'SIPREBA', convenio: 'CCT 301/75', sectorName: 'Prensa y periodismo', territorio: 'CABA', empresa: '', puesto: '' } },
  'test_prensa2':  { password: 'delprensa2026', grade: 'B.b', territory: 'caba', sector: 'prensa', nombre: 'Tester P2 — Delegado Prensa',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Delegado', federacion: 'SIPREBA', sindicato: 'SIPREBA', convenio: 'CCT 301/75', sectorName: 'Prensa y periodismo', territorio: 'CABA', empresa: 'Cronista', puesto: 'Cronista' } },
  'test_prensa1':  { password: 'baseprensa2026', grade: 'B.a', territory: 'caba', sector: 'prensa', nombre: 'Tester P1 — Periodista Base',
    category: 'tester', email: 'alejandro.jasinski@gmail.com',
    agremiacion: { rol: 'Trabajador de Base', federacion: 'SIPREBA', sindicato: 'SIPREBA', convenio: 'CCT 301/75', sectorName: 'Prensa y periodismo', territorio: 'CABA', empresa: '', puesto: 'Cronista' } },
  'emiliano': { password: 'emiliano2026', grade: 'B.d', territory: '', sector: 'hornero', nombre: 'Emiliano López',
    category: 'tester', email: 'emiliano@thetricontinental.org',
    agremiacion: { rol: 'Tester', federacion: '', sindicato: '', convenio: '', sectorName: '', territorio: '', empresa: '', puesto: '' } },
  'federico': { password: 'federico2026', grade: 'B.d', territory: '', sector: 'hornero', nombre: 'Federico Ávalos',
    category: 'tester', email: 'PENDIENTE',
    agremiacion: { rol: 'Tester', federacion: '', sindicato: '', convenio: '', sectorName: '', territorio: '', empresa: '', puesto: '' } },
};

class HorneroLogin extends HoComponent {
  static get properties() {
    return {
      error: String,
      loading: Boolean,
      showPassword: Boolean,
      mode: String,   // 'popup' = compact | default = full screen
      view: String,   // 'login' | 'signup' | 'confirm-pending'
    };
  }

  constructor() {
    super();
    this.error = '';
    this.loading = false;
    this.showPassword = false;
    this.mode = '';
    this.view = 'login';
    this._signupEmail = '';
  }

  _styles() {
    return css`
      :host {
        display: block;
        height: 100%;
        flex: 1;
        --ho-bg: #1E2321;
        --ho-body-bg: #1E2321;
        --ho-text-off: #F2F1EC;
        --ho-dark: #1E2321;
        --ho-dark-surface: #3F4E4A;
        --ho-dark-mid: #536260;
        --ho-green: #4E9978;
        --ho-green-light: #80CCA0;
        --ho-green-dark: #3D6B56;
        --ho-green-pale: #E0F0EB;
      }

      .login-wrap {
        height: 100%; width: 100%;
        background: var(--ho-bg, #1E2321);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: 28px 24px;
        padding-top: calc(28px + env(safe-area-inset-top, 0px));
        padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px));
        box-sizing: border-box;
      }

      :host([mode="popup"]) .login-wrap {
        height: auto; padding: 16px; justify-content: flex-start;
      }
      :host([mode="popup"]) .logo-area,
      :host([mode="popup"]) .version-tag { display: none; }

      .logo-area {
        display: flex; flex-direction: column; align-items: center;
        margin-bottom: 28px;
      }
      .logo-area img { width: 140px; height: auto;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,.4)); }

      .form-area {
        width: 100%; max-width: 320px;
      }

      .field { margin-bottom: 16px; }
      .field label {
        font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        color: #9C988D; margin-bottom: 6px; display: block;
      }
      .field input, .field select {
        width: 100%; box-sizing: border-box;
        background: var(--ho-dark-mid, #536260);
        border: 1.5px solid var(--ho-dark-mid, #536260);
        border-radius: 10px; padding: 12px 14px;
        font-family: 'Public Sans', sans-serif; font-size: .92rem;
        font-weight: 500; color: var(--ho-text-off, #F2F1EC);
        outline: none; transition: border-color .2s;
      }
      .field input:focus, .field select:focus {
        border-color: var(--ho-green, #4E9978);
      }
      .field input::placeholder { color: #7A7568; }
      .field select { -webkit-appearance: none; appearance: none; cursor: pointer; }
      .field select option { background: #2A3230; color: #E8E6E0; }

      .field-password .input-wrap { position: relative; }
      .field-password .input-wrap input { padding-right: 42px; }

      .toggle-password {
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer;
        color: #9C988D; padding: 4px; display: flex;
        align-items: center; justify-content: center;
        transition: color .2s;
      }
      .toggle-password:hover { color: var(--ho-green, #4E9978); }
      .toggle-password svg { width: 20px; height: 20px; }

      .remember-row {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 24px;
      }
      .remember-row input[type="checkbox"] {
        accent-color: var(--ho-green, #4E9978);
        width: 18px; height: 18px; cursor: pointer;
      }
      .remember-row label {
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        font-weight: 500; color: #9C988D; cursor: pointer;
      }

      .login-btn {
        width: 100%; background: var(--ho-green, #4E9978);
        color: var(--ho-text-off, #F2F1EC); border: none;
        border-radius: 10px; padding: 14px;
        font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; letter-spacing: .08em; cursor: pointer;
        transition: background .2s;
      }
      .login-btn:hover { background: var(--ho-green-dark, #3D6B56); }
      .login-btn:disabled { opacity: .5; cursor: not-allowed; }

      .toggle-view {
        text-align: center; margin-top: 16px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: #9C988D;
      }
      .toggle-view a {
        color: var(--ho-green, #4E9978); cursor: pointer;
        text-decoration: none; font-weight: 600;
      }
      .toggle-view a:hover { text-decoration: underline; }

      .error-msg {
        background: #A6553E; color: #F2F1EC;
        padding: 10px 14px; border-radius: 8px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        font-weight: 500; margin-top: 16px;
        animation: apfade .3s ease;
      }

      .success-msg {
        background: #2D4A3D; color: #80CCA0;
        padding: 10px 14px; border-radius: 8px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        font-weight: 500; margin-top: 16px;
        animation: apfade .3s ease;
      }

      .confirm-pending {
        text-align: center;
      }
      .confirm-pending p {
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        line-height: 1.5; color: #E8E6E0; margin-bottom: 20px;
      }
      .confirm-pending .email-highlight {
        color: var(--ho-green, #4E9978); font-weight: 600;
      }
      .resend-btn {
        background: none; border: 1.5px solid var(--ho-green, #4E9978);
        color: var(--ho-green, #4E9978); border-radius: 10px;
        padding: 10px 20px; font-family: 'Archivo', sans-serif;
        font-weight: 700; font-size: .82rem; cursor: pointer;
        transition: background .2s, color .2s;
      }
      .resend-btn:hover {
        background: var(--ho-green, #4E9978); color: #F2F1EC;
      }

      .version-tag {
        font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: #7A7568; margin-top: 32px; text-align: center; }

      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    `;
  }

  _render() {
    // Confirm-pending view
    if (this.view === 'confirm-pending') {
      return html`
        <div class="login-wrap">
          <div class="logo-area">
            <img src="assets/hornero-logo-nobg.png?v=22" alt="Hornero" />
          </div>
          <div class="form-area confirm-pending">
            <p>Te enviamos un email a <span class="email-highlight">${this._signupEmail}</span>.<br/>
            Hacé clic en el enlace para confirmar tu cuenta.</p>
            <button class="resend-btn" id="resend-btn">Reenviar email</button>
            <div class="toggle-view" style="margin-top:20px">
              <a id="back-to-login">Ya confirmé — Ingresar</a>
            </div>
            ${this.error ? '<div class="error-msg">' + this.error + '</div>' : ''}
          </div>
          <div class="version-tag">Piloto aceitero · v2026-07</div>
        </div>
      `;
    }

    // Signup view
    if (this.view === 'signup') {
      return html`
        <div class="login-wrap">
          <div class="logo-area">
            <img src="assets/hornero-logo-nobg.png?v=22" alt="Hornero" />
          </div>

          <div class="form-area">
            <div class="field">
              <label for="signup-email">Email</label>
              <input type="email" id="signup-email" placeholder="tu@email.com" autocomplete="email" />
            </div>

            <div class="field">
              <label for="signup-nombre">Nombre completo</label>
              <input type="text" id="signup-nombre" placeholder="Tu nombre" autocomplete="name" />
            </div>

            <div class="field">
              <label for="signup-sector">Sector / Gremio</label>
              <select id="signup-sector">
                <option value="hornero">Hornero (admin/tester)</option>
                <option value="aceitero">Aceitero (F.T.C.I.O.D y A.R.A.)</option>
                <option value="prensa">Prensa (SIPREBA)</option>
                <option value="comercio">Comercio</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div class="field field-password">
              <label for="signup-pass">Contraseña</label>
              <div class="input-wrap">
                <input type="password" id="signup-pass" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
              </div>
            </div>

            <div class="field field-password">
              <label for="signup-pass2">Confirmar contraseña</label>
              <div class="input-wrap">
                <input type="password" id="signup-pass2" placeholder="Repetí tu contraseña" autocomplete="new-password" />
              </div>
            </div>

            <button class="login-btn" id="signup-btn" ${this.loading ? 'disabled' : ''}>
              ${this.loading ? 'Registrando...' : 'Crear cuenta'}
            </button>

            ${this.error ? '<div class="error-msg">' + this.error + '</div>' : ''}

            <div class="toggle-view">
              Ya tenés cuenta? <a id="goto-login">Ingresar</a>
            </div>
          </div>

          <div class="version-tag">Piloto aceitero · v2026-07</div>
        </div>
      `;
    }

    // Login view (default)
    return html`
      <div class="login-wrap">
        <div class="logo-area">
          <img src="assets/hornero-logo-nobg.png?v=22" alt="Hornero" />
        </div>

        <div class="form-area">
          <div class="field">
            <label for="login-user">Usuario o email</label>
            <input type="text" id="login-user" placeholder="Ingresá tu usuario" autocomplete="username" />
          </div>

          <div class="field field-password">
            <label for="login-pass">Contraseña</label>
            <div class="input-wrap">
              <input type="${this.showPassword ? 'text' : 'password'}" id="login-pass" placeholder="Ingresá tu contraseña" autocomplete="current-password" />
              <button class="toggle-password" id="toggle-pass" type="button" aria-label="Mostrar contraseña">
                ${this.showPassword
                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.36 3.84"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                }
              </button>
            </div>
          </div>

          <div class="remember-row">
            <input type="checkbox" id="login-remember" checked />
            <label for="login-remember">Recordarme</label>
          </div>

          <button class="login-btn" id="login-btn" ${this.loading ? 'disabled' : ''}>
            ${this.loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          ${this.error ? '<div class="error-msg">' + this.error + '</div>' : ''}

          <div class="toggle-view">
            No tenés cuenta? <a id="goto-signup">Registrarse</a>
          </div>
        </div>

        <div class="version-tag">Piloto aceitero · v2026-07</div>
      </div>
    `;
  }

  _afterRender() {
    // Login form handlers
    const btn = this.shadowRoot.querySelector('#login-btn');
    if (btn) btn.addEventListener('click', () => this._handleLogin());

    const toggleBtn = this.shadowRoot.querySelector('#toggle-pass');
    if (toggleBtn) toggleBtn.addEventListener('click', () => {
      const passInput = this.shadowRoot.querySelector('#login-pass');
      if (!passInput) return;
      const showing = passInput.type === 'text';
      passInput.type = showing ? 'password' : 'text';
      this.showPassword = !showing;
      toggleBtn.innerHTML = this.showPassword
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.36 3.84"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      toggleBtn.setAttribute('aria-label', this.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
      passInput.focus();
    });

    const passInput = this.shadowRoot.querySelector('#login-pass');
    if (passInput) passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleLogin();
    });

    const userInput = this.shadowRoot.querySelector('#login-user');
    if (userInput) userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const p = this.shadowRoot.querySelector('#login-pass');
        if (p) p.focus();
      }
    });

    // Signup form handlers
    const signupBtn = this.shadowRoot.querySelector('#signup-btn');
    if (signupBtn) signupBtn.addEventListener('click', () => this._handleSignup());

    const gotoSignup = this.shadowRoot.querySelector('#goto-signup');
    if (gotoSignup) gotoSignup.addEventListener('click', () => {
      this.set('view', 'signup');
      this.set('error', '');
    });

    const gotoLogin = this.shadowRoot.querySelector('#goto-login');
    if (gotoLogin) gotoLogin.addEventListener('click', () => {
      this.set('view', 'login');
      this.set('error', '');
    });

    // Confirm-pending handlers
    const resendBtn = this.shadowRoot.querySelector('#resend-btn');
    if (resendBtn) resendBtn.addEventListener('click', () => this._handleResend());

    const backToLogin = this.shadowRoot.querySelector('#back-to-login');
    if (backToLogin) backToLogin.addEventListener('click', () => {
      this.set('view', 'login');
      this.set('error', '');
    });

    // Signup enter key handling
    const signupPass2 = this.shadowRoot.querySelector('#signup-pass2');
    if (signupPass2) signupPass2.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSignup();
    });
  }

  async _handleLogin() {
    const userInput = this.shadowRoot.querySelector('#login-user');
    const passInput = this.shadowRoot.querySelector('#login-pass');
    const rememberInput = this.shadowRoot.querySelector('#login-remember');

    const username = (userInput.value || '').trim().toLowerCase();
    const password = (passInput.value || '').trim();
    const remember = rememberInput.checked;

    if (!username || !password) {
      this.set('error', 'Ingresá usuario y contraseña');
      return;
    }

    this.set('loading', true);

    // Try backend auth first
    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() :
                       (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : '');
      if (baseUrl) {
        // Wake up Render if hibernating (shows "Despertando..." message)
        if (window.HorneroAPI) {
          this.set('error', 'Despertando el servidor...');
          await window.HorneroAPI.wakeUpBackend();
          this.set('error', '');
        }

        const res = await fetch(baseUrl + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (res.ok) {
          const data = await res.json();
          // Store tokens
          if (typeof horneroAuth !== 'undefined') {
            horneroAuth.setAccessToken(data.access_token);
            await horneroAuth.setRefreshToken(data.refresh_token);
          }

          // Build session (same shape as before for backward compat)
          const user = data.user;
          const session = {
            username: user.username,
            grade: user.grade,
            territory: user.territory,
            sector: user.sector,
            nombre: user.nombre,
            category: user.category || '',
            email: user.email || '',
            agremiacion: user.agremiacion || {},
            timestamp: Date.now(),
          };

          // Merge saved profile data
          try {
            if (typeof dbGet === 'function') {
              const savedSession = await dbGet('uiState', 'session');
              if (savedSession && savedSession.username === user.username) {
                if (savedSession.nombre && savedSession.nombre !== user.nombre) session.nombre = savedSession.nombre;
                if (savedSession.email) session.email = savedSession.email;
              }
            }
          } catch(e) {}

          // Save to IndexedDB + localStorage
          if (typeof dbPut === 'function') {
            try { await dbPut('uiState', { key: 'session', ...session }); } catch(e) {}
          }
          if (remember) {
            localStorage.setItem('hornero-session', JSON.stringify(session));
          }

          this.emit('login-success', session);
          return;
        }

        // Backend returned error — check if email not confirmed
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.detail && errData.detail.includes('no confirmado')) {
          this.set('loading', false);
          this.set('error', 'Email no confirmado. Revisá tu casilla de email.');
          return;
        }
        // If backend is available but credentials wrong, show error (don't fallback)
        if (res.status === 401) {
          this.set('loading', false);
          this.set('error', 'Usuario o contraseña incorrectos');
          return;
        }
        // Other backend error — fallback to PILOT_USERS
      }
    } catch(e) {
      // Network error — fallback to PILOT_USERS
      console.warn('Login: backend unavailable, trying PILOT_USERS fallback');
    }

    // Fallback: PILOT_USERS (transition period)
    const pilotUser = PILOT_USERS[username];
    if (!pilotUser || pilotUser.password !== password) {
      this.set('loading', false);
      this.set('error', 'Usuario o contraseña incorrectos');
      return;
    }

    // PILOT_USERS login successful
    const session = {
      username: username,
      grade: pilotUser.grade,
      territory: pilotUser.territory,
      sector: pilotUser.sector,
      nombre: pilotUser.nombre,
      category: pilotUser.category || '',
      email: pilotUser.email || '',
      agremiacion: pilotUser.agremiacion || {},
      timestamp: Date.now(),
    };

    // Merge saved profile data
    try {
      if (typeof dbGet === 'function') {
        const savedSession = await dbGet('uiState', 'session');
        if (savedSession && savedSession.username === username) {
          if (savedSession.nombre && savedSession.nombre !== pilotUser.nombre) session.nombre = savedSession.nombre;
          if (savedSession.email) session.email = savedSession.email;
        }
      }
      const stored = localStorage.getItem('hornero-session');
      if (stored) {
        const savedLocal = JSON.parse(stored);
        if (savedLocal && savedLocal.username === username) {
          if (savedLocal.nombre && savedLocal.nombre !== pilotUser.nombre) session.nombre = savedLocal.nombre;
          if (savedLocal.email) session.email = savedLocal.email;
        }
      }
    } catch(e) {}

    if (typeof dbPut === 'function') {
      try { await dbPut('uiState', { key: 'session', ...session }); } catch(e) {}
    }
    if (remember) {
      localStorage.setItem('hornero-session', JSON.stringify(session));
    }

    this.emit('login-success', session);
  }

  async _handleSignup() {
    const emailInput = this.shadowRoot.querySelector('#signup-email');
    const nombreInput = this.shadowRoot.querySelector('#signup-nombre');
    const sectorInput = this.shadowRoot.querySelector('#signup-sector');
    const passInput = this.shadowRoot.querySelector('#signup-pass');
    const pass2Input = this.shadowRoot.querySelector('#signup-pass2');

    const email = (emailInput.value || '').trim();
    const nombre = (nombreInput.value || '').trim();
    const sector = sectorInput.value;
    const password = (passInput.value || '').trim();
    const password2 = (pass2Input.value || '').trim();

    if (!email || !nombre || !password) {
      this.set('error', 'Completá todos los campos');
      return;
    }

    if (password.length < 8) {
      this.set('error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== password2) {
      this.set('error', 'Las contraseñas no coinciden');
      return;
    }

    this.set('loading', true);

    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() : '';
      if (!baseUrl) {
        this.set('loading', false);
        this.set('error', 'Error de conexión con el servidor');
        return;
      }

      const res = await fetch(baseUrl + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre, sector })
      });

      const data = await res.json();

      if (res.ok || res.status === 201) {
        this._signupEmail = email;
        this.set('view', 'confirm-pending');
        this.set('error', '');
      } else {
        this.set('error', data.detail || 'Error al crear la cuenta');
      }
    } catch(e) {
      this.set('error', 'Error de conexión. Intentá de nuevo.');
    } finally {
      this.set('loading', false);
    }
  }

  async _handleResend() {
    if (!this._signupEmail) return;
    this.set('loading', true);
    this.set('error', '');

    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() : '';
      const res = await fetch(baseUrl + '/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this._signupEmail })
      });

      if (res.ok) {
        this.set('error', '');
        // Could show a success message
      } else {
        const data = await res.json().catch(() => ({}));
        this.set('error', data.detail || 'Error al reenviar email');
      }
    } catch(e) {
      this.set('error', 'Error de conexión');
    } finally {
      this.set('loading', false);
    }
  }
}

customElements.define('hornero-login', HorneroLogin);
