// ===== <hornero-login> — Login + Signup screen =====
// Auth via backend JWT (/api/auth/login, /api/auth/register)
// Guarda sesión en IndexedDB uiState (key 'session')

import { HoComponent, html, css } from './ho-component.js';

class HorneroLogin extends HoComponent {
  static get properties() {
    return {
      error: String,
      loading: Boolean,
      showPassword: Boolean,
      mode: String,   // 'popup' = compact | default = full screen
      view: String,   // 'login' | 'signup' | 'confirm-pending'
      // Signup: sindicato selection (local list + optional backend fetch)
      sindicatoQuery: String,
      sindicatoList: Array,         // full list loaded once
      selectedSindicato: Object,   // { id, nombre, sector_key, federacion, convenio }
      sindicatoDropdownOpen: Boolean,
      // Signup: cargo selection
      cargo: String,               // 'trabajador' | 'delegado' | 'comision_directiva' | 'comision_federacion'
      // Signup: verification feedback
      verificationWarning: String,
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
    this.sindicatoQuery = '';
    this.sindicatoList = [];
    this.selectedSindicato = null;
    this.sindicatoDropdownOpen = false;
    this.cargo = 'trabajador';
    this.verificationWarning = '';
    this._searchDebounce = null;
    this._savedFormValues = null;  // preserve form across re-renders
    this._sindClickOutside = null;
    // Static fallback sindicatos (used when backend is unreachable)
    this._fallbackSindicatos = [
      { id: 'ftciod-ara', nombre: 'F.T.C.I.O.D y A.R.A.', nombre_full: 'Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines de la República Argentina', sector_key: 'aceitero', sigla: 'F.T.C.I.O.D', federacion: 'F.T.C.I.O.D y A.R.A.', convenio: 'CCT 420/05', tipo: 'federacion' },
      { id: 'sipreba', nombre: 'SIPREBA', nombre_full: 'SIPREBA — Sindicato de Prensa de Buenos Aires', sector_key: 'prensa', sigla: 'SIPREBA', federacion: 'SIPREBA', convenio: 'CCT 301/75', tipo: 'sindicato' },
      { id: 'hornero-admin', nombre: 'Hornero (Admin/Tester)', nombre_full: 'Hornero — Acceso administrativo y de testing', sector_key: 'hornero', sigla: 'Hornero', federacion: '', convenio: '', tipo: 'admin' },
    ];
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

      /* Sindicato selection */
      .sind-search-wrap { position: relative; }
      .sind-list {
        display: flex; flex-direction: column; gap: 0;
        max-height: 200px; overflow-y: auto;
        border: 1px solid var(--ho-dark-mid, #536260);
        border-radius: 10px; margin-top: 6px;
        background: #2A3230;
      }
      .sind-item {
        padding: 10px 14px; cursor: pointer;
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: #E8E6E0; transition: background .15s;
        border-bottom: 1px solid #3A4A46;
      }
      .sind-item:last-child { border-bottom: none; }
      .sind-item:hover { background: var(--ho-dark-mid, #536260); }
      .sind-item.selected { background: #2D4A3D; }
      .sind-item .sind-sigla {
        font-weight: 700; color: var(--ho-green, #4E9978);
      }
      .sind-item .sind-detail {
        font-size: .72rem; color: #9C988D; margin-top: 2px;
      }
      .sind-chip {
        display: inline-flex; align-items: center; gap: 6px;
        background: #2D4A3D; border: 1px solid var(--ho-green, #4E9978);
        border-radius: 8px; padding: 6px 12px; margin-top: 6px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: #80CCA0; font-weight: 500;
      }
      .sind-chip-remove {
        background: none; border: none; color: #80CCA0; cursor: pointer;
        font-size: 1rem; line-height: 1; padding: 0 2px;
      }
      .sind-chip-remove:hover { color: #F2F1EC; }
      .sind-clear-btn {
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: #9C988D; cursor: pointer;
        font-size: 1.1rem; line-height: 1; padding: 4px;
        transition: color .2s;
      }
      .sind-clear-btn:hover { color: #F2F1EC; }
      .sind-no-results {
        padding: 10px 14px; font-size: .82rem; color: #9C988D;
        font-family: 'Public Sans', sans-serif;
      }
      .sind-no-results a { color: var(--ho-green, #4E9978); cursor: pointer; text-decoration: underline; }

      /* Cargo selection pills */
      .cargo-options {
        display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;
      }
      .cargo-btn {
        flex: 1 1 45%; min-width: 0;
        background: var(--ho-dark-mid, #536260);
        border: 1.5px solid var(--ho-dark-mid, #536260);
        border-radius: 8px; padding: 10px 8px;
        font-family: 'Public Sans', sans-serif; font-size: .74rem;
        font-weight: 600; color: #C8C4BC; cursor: pointer;
        text-align: center; transition: all .2s;
      }
      .cargo-btn:hover { border-color: var(--ho-green, #4E9978); color: #E8E6E0; }
      .cargo-btn.selected {
        background: #2D4A3D; border-color: var(--ho-green, #4E9978);
        color: #80CCA0;
      }

      /* Verification warning */
      .warning-msg {
        background: #5A4A2D; color: #E8D48B;
        padding: 10px 14px; border-radius: 8px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        font-weight: 500; margin-top: 16px;
        animation: apfade .3s ease;
      }

      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    `;
  }

  // Save form input values + focused element before re-render (innerHTML replacement)
  _saveFormValues() {
    if (this.view !== 'signup') return;
    const ids = ['signup-email', 'signup-nombre', 'signup-pass', 'signup-pass2', 'signup-sindicato'];
    const saved = {};
    for (const id of ids) {
      const el = this.shadowRoot.querySelector('#' + id);
      if (el) saved[id] = el.value;
    }
    // Save which input was focused (and cursor position)
    const active = this.shadowRoot.activeElement;
    if (active && active.id && ids.includes(active.id)) {
      this._focusedField = active.id;
      this._focusedCursor = active.selectionStart;
    } else {
      this._focusedField = null;
    }
    if (Object.keys(saved).length > 0) this._savedFormValues = saved;
  }

  // Restore form input values + focus after re-render
  _restoreFormValues() {
    if (!this._savedFormValues || this.view !== 'signup') return;
    const saved = this._savedFormValues;
    this._savedFormValues = null;
    for (const [id, value] of Object.entries(saved)) {
      const el = this.shadowRoot.querySelector('#' + id);
      if (el && value !== undefined && value !== '') {
        el.value = value;
      }
    }
    // Restore focus and cursor position
    if (this._focusedField) {
      const el = this.shadowRoot.querySelector('#' + this._focusedField);
      if (el) {
        el.focus();
        if (this._focusedCursor != null && el.setSelectionRange) {
          try { el.setSelectionRange(this._focusedCursor, this._focusedCursor); } catch(e) {}
        }
      }
      this._focusedField = null;
      this._focusedCursor = null;
    }
  }

  _render() {
    // Save form values before DOM is replaced
    this._saveFormValues();
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
      // Filter sindicato list by query (local, no API call)
      const allSindicatos = this.sindicatoList.length > 0 ? this.sindicatoList : this._fallbackSindicatos;
      const q = (this.sindicatoQuery || '').toLowerCase().trim();
      const filteredSindicatos = q
        ? allSindicatos.filter(s => {
            const haystack = (s.nombre + ' ' + (s.nombre_full || '') + ' ' + (s.sigla || '') + ' ' + (s.keywords || '')).toLowerCase();
            return haystack.includes(q);
          })
        : allSindicatos;

      const sindList = (!this.selectedSindicato && this.sindicatoDropdownOpen && filteredSindicatos.length > 0)
        ? html`<div class="sind-list" id="sind-list">
            ${filteredSindicatos.map(s => html`
              <div class="sind-item" data-sind-id="${s.id}" data-sind-nombre="${s.nombre}" data-sind-sector="${s.sector_key}" data-sind-federacion="${s.federacion || ''}" data-sind-convenio="${s.convenio || ''}" data-sind-tipo="${s.tipo || 'sindicato'}">
                <div class="sind-sigla">${s.sigla || s.nombre} ${s.tipo === 'federacion' ? '(Federación)' : ''}</div>
                <div class="sind-detail">${s.federacion || s.nombre_full || ''}</div>
              </div>
            `).join('')}
          </div>`
        : (!this.selectedSindicato && this.sindicatoDropdownOpen && q && filteredSindicatos.length === 0)
        ? html`<div class="sind-list"><div class="sind-no-results">No encontramos tu sindicato. <a id="fallback-sector">Registrate sin sindicato</a></div></div>`
        : '';

      // Grado options depend on sindicato type:
      // Federación → Grado 4 automático (no elegir)
      // Sindicato → Grado 1, 2 o 3
      const sindTipo = this.selectedSindicato ? (this.selectedSindicato.tipo || 'sindicato') : 'sindicato';
      const isFederacion = sindTipo === 'federacion';
      const cargoLabels = {
        trabajador: 'G1 · Trabajador/a',
        delegado: 'G2 · Delegado/a',
        comision_directiva: 'G3 · Comisión Directiva',
      };

      return html`
        <div class="login-wrap">
          <div class="logo-area">
            <img src="assets/hornero-logo-nobg.png?v=22" alt="Hornero" />
          </div>

          <div class="form-area">
            <div class="field">
              <label for="signup-email">Email</label>
              <input type="email" id="signup-email" placeholder="tu@email.com" autocomplete="email" list="draft-emails" />
              <datalist id="draft-emails"></datalist>
            </div>

            <div class="field">
              <label for="signup-nombre">Nombre completo o Usuario</label>
              <input type="text" id="signup-nombre" placeholder="Tu nombre o usuario" autocomplete="name" list="draft-nombres" />
              <datalist id="draft-nombres"></datalist>
            </div>

            <div class="field">
              <label for="signup-sindicato">Sindicato / Gremio</label>
              <div class="sind-search-wrap">
                <input type="text" id="signup-sindicato" placeholder="Escribí para filtrar o tocá para ver todos..." autocomplete="off" ${this.selectedSindicato ? 'value="' + this.selectedSindicato.nombre + '" readonly' : ''} />
                ${this.selectedSindicato ? html`<button class="sind-clear-btn" id="clear-sindicato" type="button">✕</button>` : ''}
                ${sindList}
              </div>
            </div>

            <div class="field">
              <label>Grado</label>
              ${isFederacion
                ? html`<div style="background:#2D4A3D;border:1px solid var(--ho-green,#4E9978);border-radius:8px;padding:10px 14px;font-family:'Public Sans',sans-serif;font-size:.82rem;color:#80CCA0;font-weight:500;">Federación → Grado 4 (automático)</div>`
                : html`<div class="cargo-options" id="cargo-options">
                    ${Object.entries(cargoLabels).map(([key, label]) => html`
                      <button class="cargo-btn${this.cargo === key ? ' selected' : ''}" data-cargo="${key}">${label}</button>
                    `).join('')}
                  </div>`
              }
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
            ${this.verificationWarning ? '<div class="warning-msg">' + this.verificationWarning + '</div>' : ''}

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

    // Persist email/nombre on blur (so draft is saved as user fills form)
    ['signup-email', 'signup-nombre'].forEach(id => {
      const el = this.shadowRoot.querySelector('#' + id);
      if (el) el.addEventListener('blur', () => this._persistSignupForm());
    });

    // Show saved draft as placeholder on focus (not auto-fill)
    this._offerDraftOnFocus();

    // Sindicato input: local filter (no API calls, no re-render on typing)
    const sindInput = this.shadowRoot.querySelector('#signup-sindicato');
    if (sindInput) {
      sindInput.addEventListener('input', (e) => {
        if (this.selectedSindicato) return;
        this.sindicatoQuery = e.target.value.trim();
        // Re-render only the list (dropdown), not the input
        this.set('sindicatoDropdownOpen', true);
      });
      // On focus, show the full list
      sindInput.addEventListener('focus', () => {
        if (this.selectedSindicato) return;
        this.set('sindicatoDropdownOpen', true);
      });
    }

    // Close sindicato dropdown on click outside
    if (!this._sindClickOutside) {
      this._sindClickOutside = (e) => {
        if (!this.sindicatoDropdownOpen) return;
        const wrap = this.shadowRoot.querySelector('.sind-search-wrap');
        if (wrap && !wrap.contains(e.composedPath()[0])) {
          this.set('sindicatoDropdownOpen', false);
        }
      };
      document.addEventListener('click', this._sindClickOutside);
    }

    // Sindicato list click handlers
    const sindList = this.shadowRoot.querySelector('#sind-list');
    if (sindList) {
      sindList.querySelectorAll('.sind-item').forEach(item => {
        item.addEventListener('click', () => {
          const sind = {
            id: item.dataset.sindId,
            nombre: item.dataset.sindNombre,
            sector_key: item.dataset.sindSector,
            federacion: item.dataset.sindFederacion,
            convenio: item.dataset.sindConvenio,
            tipo: item.dataset.sindTipo || 'sindicato',
          };
          this.sindicatoQuery = sind.nombre;
          this.set('selectedSindicato', sind);
          this.set('sindicatoDropdownOpen', false);
          // Federación → Grado 4 automático; Sindicato → reset cargo a trabajador
          if (sind.tipo === 'federacion') {
            this.set('cargo', 'comision_federacion');
          } else {
            this.set('cargo', 'trabajador');
          }
          this.set('error', '');
        });
      });
    }

    // Clear sindicato selection (✕ button) → reopen list
    const clearSind = this.shadowRoot.querySelector('#clear-sindicato');
    if (clearSind) clearSind.addEventListener('click', () => {
      this.set('selectedSindicato', null);
      this.sindicatoQuery = '';
      this.set('cargo', 'trabajador');
      this.set('sindicatoDropdownOpen', true);
      // Focus the input so user can type or see the list
      setTimeout(() => {
        const inp = this.shadowRoot.querySelector('#signup-sindicato');
        if (inp) { inp.value = ''; inp.focus(); }
      }, 50);
    });

    // Cargo selection
    const cargoOptions = this.shadowRoot.querySelector('#cargo-options');
    if (cargoOptions) {
      cargoOptions.querySelectorAll('.cargo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.set('cargo', btn.dataset.cargo);
          this.set('error', '');
          this.set('verificationWarning', '');
        });
      });
    }

    // Fallback: register without sindicato
    const fallbackLink = this.shadowRoot.querySelector('#fallback-sector');
    if (fallbackLink) fallbackLink.addEventListener('click', () => {
      this.set('selectedSindicato', null);
      this.sindicatoQuery = '';
      this.set('sindicatoDropdownOpen', false);
      this.set('error', '');
    });

    const gotoSignup = this.shadowRoot.querySelector('#goto-signup');
    if (gotoSignup) gotoSignup.addEventListener('click', () => {
      this.set('view', 'signup');
      this.set('error', '');
      this._loadSindicatos(); // load list from backend (async, fallback to static)
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

    // Restore saved form values after DOM replacement
    this._restoreFormValues();
    // Persist form to localStorage (debounced)
    this._persistSignupForm();
  }

  // Save signup form values to localStorage history (for datalist autocomplete)
  _persistSignupForm() {
    if (this.view !== 'signup') return;
    try {
      const ids = { 'signup-email': 'hornero-draft-emails', 'signup-nombre': 'hornero-draft-nombres' };
      for (const [id, storageKey] of Object.entries(ids)) {
        const el = this.shadowRoot.querySelector('#' + id);
        if (!el || !el.value.trim()) continue;
        let history = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const val = el.value.trim();
        history = history.filter(v => v !== val); // remove dup
        history.unshift(val); // add to front
        history = history.slice(0, 5); // keep max 5
        localStorage.setItem(storageKey, JSON.stringify(history));
      }
      if (this.selectedSindicato) {
        localStorage.setItem('hornero-draft-sindicato', this.selectedSindicato.id);
      }
      if (this.cargo && this.cargo !== 'trabajador') {
        localStorage.setItem('hornero-draft-cargo', this.cargo);
      }
    } catch(e) {}
  }

  // Populate datalists from localStorage history + restore sindicato/cargo
  _offerDraftOnFocus() {
    try {
      // Populate datalists with saved values
      const datalistMap = { 'signup-email': 'draft-emails', 'signup-nombre': 'draft-nombres' };
      for (const [inputId, datalistId] of Object.entries(datalistMap)) {
        const storageKey = 'hornero-draft-' + inputId.replace('signup-', '') + 's';
        const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const dl = this.shadowRoot.querySelector('#' + datalistId);
        if (dl && history.length > 0) {
          dl.innerHTML = history.map(v => `<option value="${v}">`).join('');
        }
      }
      // Restore sindicato + cargo (these are selections, not typed text)
      const savedSind = localStorage.getItem('hornero-draft-sindicato');
      if (savedSind) {
        const all = this.sindicatoList.length > 0 ? this.sindicatoList : this._fallbackSindicatos;
        const sind = all.find(s => s.id === savedSind);
        if (sind) {
          this.selectedSindicato = sind;
          this.sindicatoQuery = sind.nombre;
          if (sind.tipo === 'federacion') this.cargo = 'comision_federacion';
        }
      }
      const savedCargo = localStorage.getItem('hornero-draft-cargo');
      if (savedCargo) this.cargo = savedCargo;
    } catch(e) {}
  }

  // Clear draft after successful registration
  _clearSignupDraft() {
    try {
      localStorage.removeItem('hornero-draft-sindicato');
      localStorage.removeItem('hornero-draft-cargo');
      // Keep email/nombre history — useful if they register again later
    } catch(e) {}
  }

  // Load sindicatos from backend once (fallback to hardcoded list if unreachable)
  async _loadSindicatos() {
    if (this.sindicatoList.length > 0) return; // already loaded
    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() :
                       (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : '');
      if (!baseUrl) return;
      if (window.HorneroAPI) {
        try { await window.HorneroAPI.wakeUpBackend(); } catch(e) {}
      }
      const res = await fetch(baseUrl + '/api/auth/sindicatos?q=', { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        if (data.sindicatos && data.sindicatos.length > 0) {
          // Add Hornero (tester) if not already in the list
          const hasHornero = data.sindicatos.some(s => s.sector_key === 'hornero');
          const list = hasHornero ? data.sindicatos : [
            ...data.sindicatos,
            { id: 'hornero-admin', nombre: 'Hornero (Admin/Tester)', nombre_full: 'Hornero — Acceso administrativo y de testing', sector_key: 'hornero', sigla: 'Hornero', federacion: '', convenio: '', tipo: 'admin' }
          ];
          // Ensure tipo field exists on all items
          list.forEach(s => { if (!s.tipo) s.tipo = s.sigla === 'F.T.C.I.O.D' ? 'federacion' : 'sindicato'; });
          this.set('sindicatoList', list);
        }
      }
    } catch(e) {
      console.warn('Sindicatos load failed, using fallback list:', e);
    }
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
            is_tester: user.is_tester || false,
            sindicato_id: user.sindicato_id || '',
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

        // Backend returned error — check specific cases
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.detail && errData.detail.includes('no confirmado')) {
          this.set('loading', false);
          this.set('error', 'Email no confirmado. Revisá tu casilla de email. Si no te registraste, creá tu cuenta primero.');
          return;
        }
        if (res.status === 403 && errData.detail && errData.detail.includes('desactivada')) {
          this.set('loading', false);
          this.set('error', 'Cuenta desactivada. Contactá al administrador.');
          return;
        }
        // If backend is available but credentials wrong
        if (res.status === 401) {
          this.set('loading', false);
          this.set('error', 'Usuario o contraseña incorrectos. Si no tenés cuenta, registrate primero.');
          return;
        }
        // Rate limited
        if (res.status === 429) {
          this.set('loading', false);
          this.set('error', errData.detail || 'Demasiados intentos. Esperá unos minutos.');
          return;
        }
        // Other backend error
        this.set('loading', false);
        this.set('error', 'Error del servidor (' + res.status + '). Intentá de nuevo.');
        return;
      }
    } catch(e) {
      // Network error — backend unavailable
      console.warn('Login: backend unavailable', e);
      this.set('loading', false);
      this.set('error', 'No se pudo conectar al servidor. Verificá tu conexión e intentá de nuevo. Si no tenés cuenta, registrate primero.');
      return;
    }

    // Should not reach here — no baseUrl available
    this.set('loading', false);
    this.set('error', 'Servidor no disponible. Recargá la página e intentá de nuevo.');
  }

  async _handleSignup() {
    const emailInput = this.shadowRoot.querySelector('#signup-email');
    const nombreInput = this.shadowRoot.querySelector('#signup-nombre');
    const passInput = this.shadowRoot.querySelector('#signup-pass');
    const pass2Input = this.shadowRoot.querySelector('#signup-pass2');

    const email = (emailInput.value || '').trim();
    const nombre = (nombreInput.value || '').trim();
    const password = (passInput.value || '').trim();
    const password2 = (pass2Input.value || '').trim();
    const sindicatoId = this.selectedSindicato ? this.selectedSindicato.id : '';
    const sector = this.selectedSindicato ? this.selectedSindicato.sector_key : 'otro';
    const cargo = this.cargo || 'trabajador';

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
    this.set('error', '');
    this.set('verificationWarning', '');

    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() :
                       (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : '');
      if (!baseUrl) {
        this.set('loading', false);
        this.set('error', 'Error de conexión con el servidor');
        return;
      }

      // Wake up Render if hibernating
      if (window.HorneroAPI) {
        this.set('error', 'Despertando el servidor...');
        try {
          const awake = await window.HorneroAPI.wakeUpBackend();
          if (!awake) {
            this.set('error', 'No se pudo conectar al servidor. Intentá de nuevo en unos segundos.');
            this.set('loading', false);
            return;
          }
        } catch(e) {
          // Wake-up failed — try the register fetch anyway (might work if partially awake)
        }
        this.set('error', '');
      }

      const res = await fetch(baseUrl + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre, sector, sindicato_id: sindicatoId, cargo })
      });

      const data = await res.json();

      if (res.ok || res.status === 201) {
        // Check if verification failed
        if (data.verification_failed) {
          const cargoLabels = { delegado: 'Delegado/a', comision_directiva: 'Comisión Directiva', comision_federacion: 'Comisión Federación' };
          const claimedLabel = cargoLabels[data.claimed_cargo] || data.claimed_cargo;
          this.set('verificationWarning',
            `No pudimos verificar tu cargo de ${claimedLabel}. Te registramos como Trabajador/a. Si esto es un error, contactá a tu sindicato.`
          );
        }
        this._signupEmail = email;
        this.set('view', 'confirm-pending');
        this.set('error', '');
        this._clearSignupDraft(); // form persisted data no longer needed
      } else {
        this.set('error', data.detail || 'Error al crear la cuenta');
      }
    } catch(e) {
      this.set('error', 'No se pudo conectar al servidor. Verificá tu conexión e intentá de nuevo.');
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
