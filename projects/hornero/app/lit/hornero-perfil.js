// ===== <hornero-perfil> — Perfil del usuario =====
// Dos tarjetas: Datos Personales (usuario, email, nivel) + Agremiación
// Agremiación viene del session (login), solo muestra campos con datos
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroPerfil extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      userName: String,
      userTerritory: String,
      editing: Boolean,
      savedMsg: String,
      theme: String,
      pushEnabled: Boolean,
      pushPermission: String,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.userName = '';
    this.userTerritory = '';
    this.editing = false;
    this.savedMsg = '';
    this.theme = 'dark';
    this.pushEnabled = false;
    this.pushPermission = 'default';
    this._editName = '';
    this._editEmail = '';
    this._sessionData = {};
  }

  async connectedCallback() {
    super.connectedCallback();
    // Load session data — try localStorage first, then IndexedDB
    let session = null;
    try {
      const stored = localStorage.getItem('hornero-session');
      if (stored) session = JSON.parse(stored);
    } catch(e) {}
    // If no session or missing email, try IndexedDB
    if (!session || (!session.email && typeof dbGet === 'function')) {
      try {
        const dbSession = await dbGet('uiState', 'session');
        if (dbSession) {
          // Merge: prefer localStorage for most fields, but IndexedDB for email
          if (!session) session = dbSession;
          else if (dbSession.email && !session.email) session.email = dbSession.email;
          else if (dbSession.nombre && dbSession.nombre !== session.nombre) session.nombre = dbSession.nombre;
        }
      } catch(e) {}
    }
    if (session) {
      this._sessionData = session;
      this.userName = session.nombre || session.username || '';
      this.userTerritory = session.territory || '';
      this.sector = session.sector || 'aceitero';
    }
    // Check push state
    this.pushPermission = ('Notification' in window) ? Notification.permission : 'unsupported';
    this.pushEnabled = (typeof isPushSubscribed === 'function') ? isPushSubscribed() : false;
    // Listen for push subscription changes
    this._pushChangeHandler = (e) => {
      this.pushPermission = e.detail.permission || 'default';
      this.pushEnabled = e.detail.subscribed || false;
      this.render();
    };
    document.addEventListener('push-subscription-change', this._pushChangeHandler);
    this.render();
  }

  // ===== Grade label =====

  _getGradeLabel() {
    const labels = {
      'B.a': { num: 1, role: 'Trabajador base', color: 'green' },
      'B.b': { num: 2, role: 'Delegada', color: 'gold' },
      'B.c': { num: 3, role: 'Secretaría', color: 'mid' },
      'B.d': { num: 4, role: 'Federación', color: 'dark' },
    };
    return labels[this.grade] || { num: 0, role: 'Sin acceso', color: '' };
  }

  // ===== Agremiación info from session =====

  _getAgremiacionInfo() {
    const agrem = this._sessionData.agremiacion || {};
    return {
      rol: agrem.rol || '',
      federacion: agrem.federacion || '',
      sindicato: agrem.sindicato || '',
      convenio: agrem.convenio || '',
      sectorName: agrem.sectorName || '',
      territorio: agrem.territorio || '',
      empresa: agrem.empresa || '',
      puesto: agrem.puesto || '',
    };
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Info cards */
      .info-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 16px; margin-bottom: 12px; }
      .info-card-title { font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 12px; }
      .info-field { display: flex; align-items: baseline; gap: 8px;
        margin-bottom: 10px; }
      .info-field-label { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: var(--ho-text-mid, #9C988D); min-width: 60px; }
      .info-field-value { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text, #E8E6E0); font-weight: 600; }
      .info-field-value.muted { font-weight: 400; color: var(--ho-text-light, #6E6A60); }

      /* Nivel badge */
      .nivel-badge { display: inline-flex; align-items: center; gap: 5px;
        font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
        padding: 4px 9px; border-radius: 6px; }
      .nivel-badge.green { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56); }
      .nivel-badge.gold { background: #F0E4CC; color: #7A5E2C; }
      .nivel-badge.mid { background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-dark-mid, #536260); }
      .nivel-badge.dark { background: var(--ho-warm-gray, #E6E3DB); color: var(--ho-dark, #1E2321); border: 1px solid var(--ho-dark, #1E2321); }

      /* Edit mode */
      .edit-input { width: 100%; background: var(--ho-card, #2A3230);
        border: 1.5px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 10px; padding: 10px 12px; font-size: .86rem;
        font-family: 'Public Sans', sans-serif; color: var(--ho-text, #E8E6E0);
        outline: none; transition: border-color .2s; }
      .edit-input:focus { border-color: var(--ho-green, #4E9978); }
      .edit-input::placeholder { color: var(--ho-text-light, #9C988D); }

      .edit-btn { background: var(--ho-green, #4E9978); color: var(--ho-text-off, #F2F1EC);
        border: none; border-radius: 10px; padding: 10px 20px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .82rem;
        cursor: pointer; margin-top: 4px; }
      .edit-btn.secondary { background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-text, #E8E6E0); }

      /* Agremiación card (dark) */
      .agremiacion-card { background: var(--ho-dark, #1E2321);
        border-radius: 13px; padding: 16px; margin-bottom: 12px; }
      .agremiacion-badge { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        background: var(--ho-dark-surface, #3F4E4A); color: var(--ho-text-off, #F2F1EC);
        padding: 5px 10px; border-radius: 6px; display: inline-block;
        margin-bottom: 10px; }
      .agremiacion-field { display: flex; align-items: baseline; gap: 8px;
        margin-bottom: 8px; }
      .agremiacion-label { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: var(--ho-text-mid, #9C988D); min-width: 80px; }
      .agremiacion-value { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-off, #F2F1EC); font-weight: 600; line-height: 1.3; }
      .agremiacion-value.muted { color: var(--ho-text-light, #7A766D); font-weight: 400; }

      /* Saved message */
      .saved-msg { background: #D7E8D7; color: #3D6B3D;
        padding: 8px 14px; border-radius: 8px; font-size: .82rem;
        font-weight: 600; margin-bottom: 12px; animation: apfade .3s ease; }

      /* Theme toggle */
      .theme-row { display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px; margin-top: 16px; background: var(--ho-card, #2A3230);
        border-radius: 12px; border: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .theme-label { font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .82rem; color: var(--ho-text, #E8E6E0); }
      .theme-toggle { width: 48px; height: 26px; border-radius: 13px;
        background: var(--ho-dark-mid, #3A4340); border: none; cursor: pointer;
        position: relative; transition: background .3s; flex: none; }
      .theme-toggle.active { background: var(--ho-green, #4E9978); }
      .theme-toggle-knob { position: absolute; top: 3px; left: 3px;
        width: 20px; height: 20px; border-radius: 50%;
        background: var(--ho-text-off, #F2F1EC); transition: transform .3s; }
      .theme-toggle.active .theme-toggle-knob { transform: translateX(22px); }

      /* Logout */
      .logout-btn { background: #A6553E; color: #F2F1EC; border: none;
        border-radius: 10px; padding: 12px 24px;
        font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; cursor: pointer; width: 100%;
        margin-top: 16px; }

      /* Notification toggle */
      .notif-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 16px; margin-bottom: 12px; }
      .notif-row { display: flex; align-items: center; justify-content: space-between;
        gap: 12px; }
      .notif-info { flex: 1; }
      .notif-title { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); }
      .notif-desc { font-family: 'Public Sans', sans-serif; font-size:.72rem;
        color: #7A766C; line-height: 1.4; margin-top: 3px; }
      .notif-privacy { font-family: 'Public Sans', sans-serif; font-size:.66rem;
        color: #6E6A60; line-height: 1.4; margin-top: 6px;
        padding-top: 6px; border-top: 1px solid var(--ho-border, rgba(255,255,255,.06)); }
      .notif-status { font-family: 'JetBrains Mono', monospace; font-size:.62rem;
        font-weight: 600; letter-spacing:.06em; text-transform: uppercase;
        padding: 3px 8px; border-radius: 6px; }
      .notif-status.granted { background: #1E3A2E; color: #80CCA0; }
      .notif-status.denied { background: #3A1E1E; color: #CC8080; }
      .notif-status.default { background: #3A341E; color: #CCA880; }
      .notif-status.unsupported { background: var(--ho-warm-gray, #3A4340); color: #7A766C; }

      /* Toggle switch */
      .toggle-switch { position: relative; width: 44px; height: 24px;
        background: var(--ho-warm-gray, #3A4340); border-radius: 12px;
        cursor: pointer; transition: background .2s; flex: none; }
      .toggle-switch.active { background: var(--ho-green, #4E9978); }
      .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px;
        width: 20px; height: 20px; border-radius: 50%; background: #F2F1EC;
        transition: transform .2s; }
      .toggle-switch.active::after { transform: translateX(20px); }

      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    `;
  }

  // ===== Render =====

  _render() {
    if (this.grade === 'A') {
      return html`
        <div class="scroll" style="display:flex;align-items:center;justify-content:center;height:100%">
          <div style="text-align:center;color:#9C988D;font-size:.82rem">
            🔒 Ingresá para ver tu perfil
          </div>
        </div>
      `;
    }

    const gradeInfo = this._getGradeLabel();
    const agrem = this._getAgremiacionInfo();

    // Build agremiación fields — Rol first, then Federación, Sindicato, etc
    const agremFields = [];
    if (agrem.rol) agremFields.push({ label: 'Rol', value: agrem.rol });
    if (agrem.federacion) agremFields.push({ label: 'Federación', value: agrem.federacion });
    if (agrem.sindicato) agremFields.push({ label: 'Sindicato', value: agrem.sindicato });
    // Convenio y Empresa siempre se muestran (vacíos si no hay dato)
    const convenioLine = agrem.convenio ? (agrem.sectorName ? agrem.convenio + ' · ' + agrem.sectorName : agrem.convenio) : '';
    agremFields.push({ label: 'Convenio', value: convenioLine });
    if (agrem.territorio) agremFields.push({ label: 'Territorio', value: agrem.territorio });
    agremFields.push({ label: 'Empresa', value: agrem.empresa || '' });
    agremFields.push({ label: 'Puesto', value: agrem.puesto || '' });

    // If no agremiación data at all, show a minimal card
    const hasAgremiacion = agremFields.length > 0;

    return html`
      <div class="scroll">
        ${this.savedMsg ? '<div class="saved-msg">' + this.savedMsg + '</div>' : ''}

        <!-- Datos Personales -->
        <div class="info-card">
          <div class="info-card-title">👤 DATOS PERSONALES</div>
          ${this.editing ? this._renderEditFields() : this._renderInfoFields(gradeInfo)}
        </div>

        <!-- Agremiación -->
        <div class="agremiacion-card">
          <div class="info-card-title" style="color:#9C988D">✊ AGREMIACIÓN</div>
          ${hasAgremiacion ? agremFields.map(f =>
            '<div class="agremiacion-field">' +
            '<span class="agremiacion-label">' + f.label + '</span>' +
            '<span class="agremiacion-value' + (f.value ? '' : ' muted') + '">' + (f.value || '—') + '</span>' +
            '</div>'
          ).join('') : ''}
        </div>

        <!-- Notificaciones push -->
        <div class="notif-card">
          <div class="info-card-title">🔔 NOTIFICACIONES</div>
          <div class="notif-row">
            <div class="notif-info">
              <div class="notif-title">Notificaciones de clipping</div>
              <div class="notif-desc">Recibí una alerta cuando hay un nuevo clipping disponible</div>
            </div>
            <div class="toggle-switch${this.pushEnabled ? ' active' : ''}" id="push-toggle"></div>
          </div>
          <div class="notif-privacy">⚠️ Al activar notificaciones, tu dispositivo se registra en nuestro servidor. No almacenamos datos personales, solo un identificador técnico necesario para enviar la notificación.</div>
          ${this.pushPermission !== 'unsupported' ? '<div style="margin-top:8px"><span class="notif-status ' + this.pushPermission + '">' + this.pushPermission + '</span></div>' : ''}
        </div>

        <!-- Theme toggle -->
        <div class="theme-row">
          <span class="theme-label">☀️ Modo de día</span>
          <button class="theme-toggle${this.theme === 'light' ? ' active' : ''}" id="themeToggle">
            <span class="theme-toggle-knob"></span>
          </button>
        </div>

        <!-- Logout -->
        <button class="logout-btn" id="logout-btn">Cerrar sesión</button>
      </div>
    `;
  }

  _renderInfoFields(gradeInfo) {
    const email = this._sessionData.email || '';
    return html`
      <div class="info-field">
        <span class="info-field-label">Usuario</span>
        <span class="info-field-value">${this.userName || 'Usuario'}</span>
      </div>
      <div class="info-field">
        <span class="info-field-label">Email</span>
        <span class="info-field-value ${email ? '' : 'muted'}">${email || 'No configurado'}</span>
      </div>
      <div class="info-field">
        <span class="info-field-label">Nivel</span>
        <span class="nivel-badge ${gradeInfo.color}">N${gradeInfo.num} · ${gradeInfo.role}</span>
      </div>
      <button class="edit-btn" id="edit-btn">✏️ Editar</button>
    `;
  }

  _renderEditFields() {
    const currentEmail = this._sessionData.email || '';
    return html`
      <div style="margin-bottom:10px">
        <span class="info-field-label">Usuario</span>
        <input class="edit-input" id="edit-name" type="text" value="${this._editName || this.userName}" placeholder="Tu nombre visible" />
      </div>
      <div style="margin-bottom:10px">
        <span class="info-field-label">Email</span>
        <input class="edit-input" id="edit-email" type="email" value="${this._editEmail || currentEmail}" placeholder="Tu email (opcional)" />
      </div>
      <div style="display:flex;gap:8px">
        <button class="edit-btn" id="save-btn">💾 Guardar</button>
        <button class="edit-btn secondary" id="cancel-btn">Cancelar</button>
      </div>
    `;
  }

  _afterRender() {
    // Edit button
    const editBtn = this.shadowRoot.querySelector('#edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.editing = true;
        this._editName = this.userName;
        this._editEmail = this._sessionData.email || '';
        this.render();
      });
    }

    // Save button
    const saveBtn = this.shadowRoot.querySelector('#save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this._saveProfile());
    }

    // Cancel button
    const cancelBtn = this.shadowRoot.querySelector('#cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.editing = false;
        this.render();
      });
    }

    // Logout button
    const logoutBtn = this.shadowRoot.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.emit('logout-request');
      });
    }

    // Theme toggle
    const themeToggle = this.shadowRoot.querySelector('#themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.set('theme', newTheme);
        this.emit('theme-change', { theme: newTheme });
      });
    }

    // Push notification toggle
    const pushToggle = this.shadowRoot.querySelector('#push-toggle');
    if (pushToggle) {
      pushToggle.addEventListener('click', () => this._togglePush());
    }
  }

  async _saveProfile() {
    const nameInput = this.shadowRoot.querySelector('#edit-name');
    const emailInput = this.shadowRoot.querySelector('#edit-email');

    const newName = nameInput ? nameInput.value.trim() : this.userName;
    const newEmail = emailInput ? emailInput.value.trim() : '';

    if (!newName) {
      this.savedMsg = '⚠️ El nombre no puede estar vacío';
      this.render();
      return;
    }

    // Update session data
    this._sessionData.nombre = newName;
    this._sessionData.email = newEmail;
    this.userName = newName;
    this.editing = false;

    // Save updated session to IndexedDB + localStorage
    try {
      if (typeof dbPut === 'function') {
        await dbPut('uiState', { key: 'session', ...this._sessionData, nombre: newName, email: newEmail });
      }
      localStorage.setItem('hornero-session', JSON.stringify({ ...this._sessionData, nombre: newName, email: newEmail }));
    } catch(e) {
      console.warn('Perfil: save failed', e);
    }

    // Update the usuarios store in IndexedDB too
    try {
      if (typeof guardarUsuario === 'function') {
        await guardarUsuario({
          id: this._sessionData.username,
          nombre: newName,
          email: newEmail,
          grade: this.grade,
          territorio: this.userTerritory,
          sector: this.sector,
        });
      }
    } catch(e) {}

    this.savedMsg = '✅ Guardado';
    this.render();

    // Emit event so hornero-app updates its userName display
    this.emit('profile-updated', { nombre: newName, email: newEmail });
  }

  async _togglePush() {
    if (this.pushEnabled) {
      // Desactivar
      if (typeof unsubscribeUser === 'function') {
        await unsubscribeUser();
      }
      this.pushEnabled = false;
      this.pushPermission = ('Notification' in window) ? Notification.permission : 'unsupported';
      this.render();
    } else {
      // Activar: primero pedir permiso, luego suscribir
      if (typeof requestNotificationPermission === 'function') {
        const permission = await requestNotificationPermission();
        this.pushPermission = permission;
        if (permission === 'granted') {
          if (typeof subscribeUser === 'function') {
            try {
              await subscribeUser();
              this.pushEnabled = true;
              this.savedMsg = '🔔 Notificaciones activadas';
            } catch(e) {
              this.savedMsg = '⚠️ No se pudo activar notificaciones';
              this.pushEnabled = false;
            }
          }
        } else {
          this.savedMsg = '⚠️ Permiso de notificaciones denegado';
          this.pushEnabled = false;
        }
        this.render();
      }
    }
  }
}

customElements.define('hornero-perfil', HorneroPerfil);
