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
      federacion: agrem.federacion || '',
      sindicato: agrem.sindicato || '',
      convenio: agrem.convenio || '',
      sectorName: agrem.sectorName || '',
      territorio: agrem.territorio || '',
      empresa: agrem.empresa || '',
    };
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Info cards */
      .info-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 16px; margin-bottom: 12px; }
      .info-card-title { font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 12px; }
      .info-field { display: flex; align-items: baseline; gap: 8px;
        margin-bottom: 10px; }
      .info-field-label { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: #9C988D; min-width: 60px; }
      .info-field-value { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text, #2B2A26); font-weight: 600; }
      .info-field-value.muted { font-weight: 400; color: #6E6A60; }

      /* Nivel badge */
      .nivel-badge { display: inline-flex; align-items: center; gap: 5px;
        font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        font-weight: 600; letter-spacing: .10em; text-transform: uppercase;
        padding: 4px 9px; border-radius: 6px; }
      .nivel-badge.green { background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33); }
      .nivel-badge.gold { background: #F0E4CC; color: #7A5E2C; }
      .nivel-badge.mid { background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-dark-mid, #5A574F); }
      .nivel-badge.dark { background: var(--ho-warm-gray, #E6E3DB); color: var(--ho-dark, #33312D); border: 1px solid var(--ho-dark, #33312D); }

      /* Edit mode */
      .edit-input { width: 100%; background: var(--ho-card, #FBFAF6);
        border: 1.5px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 10px; padding: 10px 12px; font-size: .86rem;
        font-family: 'Public Sans', sans-serif; color: var(--ho-text, #2B2A26);
        outline: none; transition: border-color .2s; }
      .edit-input:focus { border-color: var(--ho-green, #6E8345); }
      .edit-input::placeholder { color: var(--ho-text-light, #9C988D); }

      .edit-btn { background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC);
        border: none; border-radius: 10px; padding: 10px 20px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .82rem;
        cursor: pointer; margin-top: 4px; }
      .edit-btn.secondary { background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-text, #2B2A26); }

      /* Agremiación card (dark) */
      .agremiacion-card { background: var(--ho-dark, #33312D);
        border-radius: 13px; padding: 16px; margin-bottom: 12px; }
      .agremiacion-badge { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        background: var(--ho-dark-surface, #45433E); color: var(--ho-text-off, #F2F1EC);
        padding: 5px 10px; border-radius: 6px; display: inline-block;
        margin-bottom: 10px; }
      .agremiacion-field { display: flex; align-items: baseline; gap: 8px;
        margin-bottom: 8px; }
      .agremiacion-label { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: #9C988D; min-width: 80px; }
      .agremiacion-value { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-off, #F2F1EC); font-weight: 600; line-height: 1.3; }
      .agremiacion-value.muted { color: #7A766D; font-weight: 400; }

      /* Saved message */
      .saved-msg { background: #D7E8D7; color: #3D6B3D;
        padding: 8px 14px; border-radius: 8px; font-size: .82rem;
        font-weight: 600; margin-bottom: 12px; animation: apfade .3s ease; }

      /* Logout */
      .logout-btn { background: #A6553E; color: #F2F1EC; border: none;
        border-radius: 10px; padding: 12px 24px;
        font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; cursor: pointer; width: 100%;
        margin-top: 16px; }

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

    // Agremiación badge: use sindicato name short or federacion or sector
    const badgeText = agrem.sindicato || agrem.federacion || this.sector.toUpperCase();

    // Build agremiación fields — only show fields that have data
    const agremFields = [];
    if (agrem.federacion) agremFields.push({ label: 'Federación', value: agrem.federacion });
    if (agrem.sindicato) agremFields.push({ label: 'Sindicato', value: agrem.sindicato });
    // Convenio y Empresa siempre se muestran (vacíos si no hay dato)
    const convenioLine = agrem.convenio ? (agrem.sectorName ? agrem.convenio + ' · ' + agrem.sectorName : agrem.convenio) : '';
    agremFields.push({ label: 'Convenio', value: convenioLine });
    if (agrem.territorio) agremFields.push({ label: 'Territorio', value: agrem.territorio });
    agremFields.push({ label: 'Empresa', value: agrem.empresa || '' });

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
          <span class="agremiacion-badge">${badgeText}</span>
          ${hasAgremiacion ? agremFields.map(f =>
            '<div class="agremiacion-field">' +
            '<span class="agremiacion-label">' + f.label + '</span>' +
            '<span class="agremiacion-value' + (f.value ? '' : ' muted') + '">' + (f.value || '—') + '</span>' +
            '</div>'
          ).join('') : ''}
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
}

customElements.define('hornero-perfil', HorneroPerfil);
