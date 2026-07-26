// ===== <hornero-login> — Login screen =====
// Client-side auth para piloto — sin backend
// Valida contra lista hard-codeada de usuarios piloto
// Guarda sesión en IndexedDB uiState (key 'session')

import { HoComponent, html, css } from './ho-component.js';

// Usuarios piloto — se migran a backend JWT en Phase 1 real
// 4 niveles de acceso para testing: B.d (4), B.c (3), B.b (2), B.a (1)
// Agremiación: federación, sindicato, convenio, territorio (display), empresa — por usuario
const PILOT_USERS = {
  'eljaso':   { password: 'hornero2026', grade: 'B.d', territory: 'norte-santa-fe', sector: 'hornero', nombre: 'Eljaso',
    agremiacion: { federacion: 'Hornero', sindicato: 'Hornero', convenio: '', sectorName: '', territorio: 'Norte de Santa Fe', empresa: '' } },
  'test4':    { password: 'fed2026',     grade: 'B.d', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Tester N4 — Federación',
    agremiacion: { federacion: 'F.T.C.I.O.D y A.R.A. (Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines de la República Argentina)', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'Norte de Santa Fe', empresa: 'Vicentín SAIC, Guaycurú' } },
  'test3':    { password: 'sec2026',     grade: 'B.c', territory: 'san-lorenzo',    sector: 'aceitero', nombre: 'Tester N3 — Secretaría',
    agremiacion: { federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'San Lorenzo', empresa: 'Vicentín SAIC' } },
  'test2':    { password: 'del2026',     grade: 'B.b', territory: 'san-lorenzo',    sector: 'aceitero', nombre: 'Tester N2 — Delegada',
    agremiacion: { federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'San Lorenzo', empresa: 'Vicentín SAIC' } },
  'test1a':   { password: 'base2026',    grade: 'B.a', territory: 'san-lorenzo',    sector: 'aceitero', nombre: 'Tester N1 — Raúl (base)',
    agremiacion: { federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'San Lorenzo', empresa: 'Vicentín SAIC' } },
  'test1b':   { password: 'adm2026',     grade: 'B.a', territory: 'san-lorenzo',    sector: 'aceitero', nombre: 'Tester N1 — Damián (admin)',
    agremiacion: { federacion: 'F.T.C.I.O.D y A.R.A.', sindicato: 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', convenio: 'CCT 420/05', sectorName: 'Industria aceitera', territorio: 'San Lorenzo', empresa: 'Vicentín SAIC — Administración' } },
};

class HorneroLogin extends HoComponent {
  static get properties() {
    return {
      error: String,
      loading: Boolean,
      showPassword: Boolean,
    };
  }

  constructor() {
    super();
    this.error = '';
    this.loading = false;
    this.showPassword = false;
  }

  _styles() {
    return css`
      :host { display: block; }

      .login-wrap {
        height: 100%; width: 100%;
        background: var(--ho-dark, #33312D);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: 40px 24px;
        box-sizing: border-box;
      }

      .logo-area {
        display: flex; flex-direction: column; align-items: center;
        margin-bottom: 80px;
        margin-top: 40px;
      }

      .logo-icon {
        width: 64px; height: 64px; border-radius: 16px;
        background: var(--ho-green, #6E8345);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 16px;
      }

      .logo-icon svg { width: 36px; height: 36px; fill: #F2F1EC; }

      .logo-name {
        font-family: 'Inter', sans-serif; font-weight: 900;
        font-size: 1.8rem; letter-spacing: .12em; text-transform: uppercase;
        color: var(--ho-text-off, #F2F1EC);
      }

      .logo-sub {
        font-family: 'Public Sans', sans-serif; font-weight: 500;
        font-size: .88rem; color: var(--ho-green-light, #94A867);
        margin-top: 8px; letter-spacing: .04em;
        white-space: nowrap; }

      .form-area {
        width: 100%; max-width: 320px;
        animation: apfade .4s ease;
      }

      .field {
        margin-bottom: 16px;
      }

      .field label {
        font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        color: #9C988D; margin-bottom: 6px; display: block;
      }

      .field input {
        width: 100%; box-sizing: border-box;
        background: var(--ho-dark-mid, #5A574F);
        border: 1.5px solid var(--ho-dark-mid, #5A574F);
        border-radius: 10px; padding: 12px 14px;
        font-family: 'Public Sans', sans-serif; font-size: .92rem;
        font-weight: 500; color: var(--ho-text-off, #F2F1EC);
        outline: none; transition: border-color .2s;
      }

      .field input:focus {
        border-color: var(--ho-green, #6E8345);
      }

      .field input::placeholder {
        color: #7A7568;
      }

      .field-password .input-wrap {
        position: relative;
      }

      .field-password .input-wrap input {
        padding-right: 42px;
      }

      .toggle-password {
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer;
        color: #9C988D; padding: 4px; display: flex;
        align-items: center; justify-content: center;
        transition: color .2s;
      }

      .toggle-password:hover { color: var(--ho-green, #6E8345); }

      .toggle-password svg { width: 20px; height: 20px; }

      .remember-row {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 24px;
      }

      .remember-row input[type="checkbox"] {
        accent-color: var(--ho-green, #6E8345);
        width: 18px; height: 18px; cursor: pointer;
      }

      .remember-row label {
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        font-weight: 500; color: #9C988D; cursor: pointer;
      }

      .login-btn {
        width: 100%; background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC); border: none;
        border-radius: 10px; padding: 14px;
        font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; letter-spacing: .08em; cursor: pointer;
        transition: background .2s;
      }

      .login-btn:hover { background: var(--ho-green-dark, #586B33); }
      .login-btn:disabled { opacity: .5; cursor: not-allowed; }

      .error-msg {
        background: #A6553E; color: #F2F1EC;
        padding: 10px 14px; border-radius: 8px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        font-weight: 500; margin-top: 16px;
        animation: apfade .3s ease;
      }

      .version-tag {
        font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: #7A7568; margin-top: 32px; text-align: center;
        animation: apfade .4s ease; }

      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    `;
  }

  _render() {
    return html`
      <div class="login-wrap">
        <div class="logo-area">
          <img src="assets/hornero-login-logo.png?v=18" alt="Hornero" style="width:120px;height:auto;margin-bottom:14px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.3))" />
          <div class="logo-name">HORNERO</div>
          <div class="logo-sub">«El futuro, algo por lo que hay que luchar»</div>
        </div>

        <div class="form-area">
          <div class="field">
            <label for="login-user">Usuario</label>
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
        </div>

        <div class="version-tag">Piloto aceitero · v2026-07</div>
      </div>
    `;
  }

  _afterRender() {
    const btn = this.shadowRoot.querySelector('#login-btn');
    if (btn) btn.addEventListener('click', () => this._handleLogin());

    const toggleBtn = this.shadowRoot.querySelector('#toggle-pass');
    if (toggleBtn) toggleBtn.addEventListener('click', () => {
      const passInput = this.shadowRoot.querySelector('#login-pass');
      if (!passInput) return;
      const showing = passInput.type === 'text';
      passInput.type = showing ? 'password' : 'text';
      this.showPassword = !showing;
      // Update icon without full re-render
      toggleBtn.innerHTML = this.showPassword
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.36 3.84"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      toggleBtn.setAttribute('aria-label', this.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
      // Keep cursor in password field after toggle
      passInput.focus();
    });

    const passInput = this.shadowRoot.querySelector('#login-pass');
    if (passInput) passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleLogin();
    });

    const userInput = this.shadowRoot.querySelector('#login-user');
    if (userInput) userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.shadowRoot.querySelector('#login-pass').focus();
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

    // Validate against pilot users
    const user = PILOT_USERS[username];
    if (!user || user.password !== password) {
      this.set('loading', false);
      this.set('error', 'Usuario o contraseña incorrectos');
      return;
    }

    // Login successful — preserve previously saved profile data (nombre, email)
    const session = {
      username: username,
      grade: user.grade,
      territory: user.territory,
      sector: user.sector,
      nombre: user.nombre,
      agremiacion: user.agremiacion || {},
      timestamp: Date.now(),
    };

    // Merge saved profile data (edited nombre, email) from existing session
    try {
      // Try IndexedDB first
      if (typeof dbGet === 'function') {
        const savedSession = await dbGet('uiState', 'session');
        if (savedSession && savedSession.username === username) {
          if (savedSession.nombre && savedSession.nombre !== user.nombre) session.nombre = savedSession.nombre;
          if (savedSession.email) session.email = savedSession.email;
        }
      }
      // Also check localStorage (may have more recent data)
      const stored = localStorage.getItem('hornero-session');
      if (stored) {
        const savedLocal = JSON.parse(stored);
        if (savedLocal && savedLocal.username === username) {
          if (savedLocal.nombre && savedLocal.nombre !== user.nombre) session.nombre = savedLocal.nombre;
          if (savedLocal.email) session.email = savedLocal.email;
        }
      }
    } catch(e) { console.warn('Login: profile merge failed', e); }

    // Save to IndexedDB (persistent)
    if (typeof dbPut === 'function') {
      try {
        await dbPut('uiState', { key: 'session', ...session });
      } catch(e) { console.warn('Login: IndexedDB save failed', e); }
    }

    // Also save to localStorage as fallback
    if (remember) {
      localStorage.setItem('hornero-session', JSON.stringify(session));
    }

    // Emit login-success event — hornero-app will handle the rest
    this.emit('login-success', session);
  }
}

customElements.define('hornero-login', HorneroLogin);
