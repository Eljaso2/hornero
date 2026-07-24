// ===== <hornero-login> — Login screen =====
// Client-side auth para piloto — sin backend
// Valida contra lista hard-codeada de usuarios piloto
// Guarda sesión en IndexedDB uiState (key 'session')

import { HoComponent, html, css } from './ho-component.js';

// Usuarios piloto — se migran a backend JWT en Phase 1 real
const PILOT_USERS = {
  'piloto':     { password: 'hornero2026',  grade: 'B.d', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Piloto (Eljaso)' },
  'raul':       { password: 'aceitero2026', grade: 'B.a', territory: 'san-lorenzo',    sector: 'aceitero', nombre: 'Raúl' },
  'damian':     { password: 'admin2026',    grade: 'B.a', territory: 'san-lorenzo',    sector: 'aceitero', nombre: 'Damián' },
  'olga':       { password: 'delegada2026', grade: 'B.b', territory: 'san-lorenzo',    sector: 'aceitero', nombre: 'Olga' },
  'secretaria': { password: 'secretaria2026', grade: 'B.c', territory: 'san-lorenzo',  sector: 'aceitero', nombre: 'Secretaria' },
  'federacion': { password: 'federacion2026', grade: 'B.d', territory: 'norte-santa-fe', sector: 'aceitero', nombre: 'Federación' },
};

class HorneroLogin extends HoComponent {
  static get properties() {
    return {
      error: String,
      loading: Boolean,
    };
  }

  constructor() {
    super();
    this.error = '';
    this.loading = false;
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
        margin-bottom: 100px;
        margin-top: 60px;
      }

      .logo-icon {
        width: 64px; height: 64px; border-radius: 16px;
        background: var(--ho-green, #6E8345);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 16px;
      }

      .logo-icon svg { width: 36px; height: 36px; fill: #F2F1EC; }

      .logo-name {
        font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.4rem; letter-spacing: .18em; text-transform: uppercase;
        color: var(--ho-text-off, #F2F1EC);
      }

      .logo-sub {
        font-family: 'Public Sans', sans-serif; font-weight: 500;
        font-size: .82rem; color: var(--ho-green-light, #94A867);
        margin-top: 6px; letter-spacing: .06em;
      }

      .form-area {
        width: 100%; max-width: 320px;
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
      }

      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    `;
  }

  _render() {
    const featherSvg = '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#F2F1EC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10"/><path d="M12 22V2"/><path d="M12 2Q7 6 8 10Q7 14 8 18Q9 20 12 22" fill="#F2F1EC" fill-opacity=".7" stroke="none"/><path d="M12 2Q17 6 16 10Q17 14 16 18Q15 20 12 22" fill="#94A867" fill-opacity=".5" stroke="none"/><line x1="12" y1="6" x2="8" y2="8" stroke="#94A867" stroke-width="1"/><line x1="12" y1="10" x2="8" y2="12" stroke="#94A867" stroke-width="1"/><line x1="12" y1="14" x2="9" y2="16" stroke="#94A867" stroke-width="1"/><line x1="12" y1="6" x2="16" y2="8" stroke="#94A867" stroke-width="1"/><line x1="12" y1="10" x2="16" y2="12" stroke="#94A867" stroke-width="1"/><line x1="12" y1="14" x2="15" y2="16" stroke="#94A867" stroke-width="1"/></svg>';

    return html`
      <div class="login-wrap">
        <div class="logo-area">
          <div class="logo-icon">${featherSvg}</div>
          <div class="logo-name">HORNERO</div>
          <div class="logo-sub">«El futuro, algo por lo que hay que luchar»</div>
        </div>

        <div class="form-area">
          <div class="field">
            <label for="login-user">Usuario</label>
            <input type="text" id="login-user" placeholder="Ingresá tu usuario" autocomplete="username" />
          </div>

          <div class="field">
            <label for="login-pass">Contraseña</label>
            <input type="password" id="login-pass" placeholder="Ingresá tu contraseña" autocomplete="current-password" />
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

    // Login successful — save session
    const session = {
      username: username,
      grade: user.grade,
      territory: user.territory,
      sector: user.sector,
      nombre: user.nombre,
      timestamp: Date.now(),
    };

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
