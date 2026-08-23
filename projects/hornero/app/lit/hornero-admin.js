// ===== <hornero-admin> — Panel de administración =====
// Gestión de verificación gremial (CRUD) + toggle tester
// Solo visible para is_tester o grade B.d

import { HoComponent, html, css } from './ho-component.js';

class HorneroAdmin extends HoComponent {
  static get properties() {
    return {
      tab: String,          // 'verificacion' | 'usuarios'
      records: Array,
      users: Array,
      sindicatos: Array,
      loading: Boolean,
      error: String,
      msg: String,
      // Add form
      addNombre: String,
      addCargo: String,
      addSindicatoId: String,
      addEmpresa: String,
      addTerritorio: String,
    };
  }

  constructor() {
    super();
    this.tab = 'verificacion';
    this.records = [];
    this.users = [];
    this.sindicatos = [];
    this.loading = false;
    this.error = '';
    this.msg = '';
    this.addNombre = '';
    this.addCargo = 'delegado';
    this.addSindicatoId = '';
    this.addEmpresa = '';
    this.addTerritorio = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadSindicatos();
    this._loadData();
  }

  _styles() {
    return css`
      :host {
        display: block; height: 100%; flex: 1;
        --ho-bg: #1E2321;
        --ho-text-off: #F2F1EC;
        --ho-dark: #1E2321;
        --ho-dark-surface: #3F4E4A;
        --ho-dark-mid: #536260;
        --ho-green: #4E9978;
        --ho-green-light: #80CCA0;
        --ho-red: #A6553E;
      }
      .admin-wrap {
        height: 100%; background: var(--ho-bg);
        display: flex; flex-direction: column;
        padding: 16px; box-sizing: border-box;
        max-width: 480px; margin: 0 auto;
      }
      .admin-header {
        display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
      }
      .admin-header h2 {
        font-family: 'Archivo', sans-serif; font-size: 1rem;
        font-weight: 700; color: var(--ho-text-off); flex: 1;
      }
      .close-btn {
        background: none; border: 1px solid var(--ho-dark-mid);
        border-radius: 8px; color: #9C988D; cursor: pointer;
        padding: 6px 10px; font-size: .82rem;
      }
      .close-btn:hover { border-color: var(--ho-green); color: var(--ho-text-off); }

      .tab-bar {
        display: flex; gap: 4px; margin-bottom: 16px;
        background: var(--ho-dark-surface); border-radius: 10px; padding: 4px;
      }
      .tab-btn {
        flex: 1; background: none; border: none; border-radius: 8px;
        padding: 8px 12px; font-family: 'Public Sans', sans-serif;
        font-size: .78rem; font-weight: 600; color: #9C988D;
        cursor: pointer; transition: all .2s;
      }
      .tab-btn.active {
        background: var(--ho-green); color: var(--ho-text-off);
      }

      .add-form {
        background: var(--ho-dark-surface); border-radius: 10px;
        padding: 12px; margin-bottom: 12px;
      }
      .add-form h3 {
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        font-weight: 700; color: var(--ho-green-light); margin: 0 0 8px 0;
      }
      .form-row {
        display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;
      }
      .form-row input, .form-row select {
        flex: 1; min-width: 100px; box-sizing: border-box;
        background: var(--ho-dark-mid); border: 1px solid var(--ho-dark-mid);
        border-radius: 8px; padding: 8px 10px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-off); outline: none;
      }
      .form-row input:focus, .form-row select:focus { border-color: var(--ho-green); }
      .form-row input::placeholder { color: #7A7568; }
      .form-row select option { background: #2A3230; }
      .add-btn {
        background: var(--ho-green); color: var(--ho-text-off); border: none;
        border-radius: 8px; padding: 8px 16px;
        font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; cursor: pointer;
      }
      .add-btn:hover { background: #3D6B56; }
      .add-btn:disabled { opacity: .5; cursor: not-allowed; }

      .record-list { flex: 1; overflow-y: auto; }
      .record-item {
        background: var(--ho-dark-surface); border-radius: 8px;
        padding: 10px 12px; margin-bottom: 8px;
        display: flex; align-items: center; gap: 10px;
      }
      .record-item .rec-name {
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        font-weight: 600; color: var(--ho-text-off); flex: 1;
      }
      .record-item .rec-cargo {
        font-family: 'JetBrains Mono', monospace; font-size: .7rem;
        font-weight: 600; color: var(--ho-green-light);
        background: #2D4A3D; border-radius: 6px; padding: 3px 8px;
      }
      .record-item .rec-sind {
        font-size: .72rem; color: #9C988D;
      }
      .record-item .rec-delete {
        background: none; border: 1px solid var(--ho-red); color: var(--ho-red);
        border-radius: 6px; padding: 4px 8px; font-size: .7rem;
        cursor: pointer; font-weight: 600;
      }
      .record-item .rec-delete:hover { background: var(--ho-red); color: var(--ho-text-off); }

      .user-item {
        background: var(--ho-dark-surface); border-radius: 8px;
        padding: 10px 12px; margin-bottom: 8px;
      }
      .user-item .user-name {
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        font-weight: 600; color: var(--ho-text-off);
      }
      .user-item .user-detail {
        font-size: .72rem; color: #9C988D; margin-top: 2px;
      }
      .user-item .user-actions {
        display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; align-items: center;
      }
      .user-item .tester-badge {
        font-size: .68rem; font-weight: 700;
        padding: 2px 8px; border-radius: 6px;
      }
      .tester-badge.yes { background: #2D4A3D; color: #80CCA0; }
      .tester-badge.no { background: var(--ho-dark-mid); color: #9C988D; }
      .user-item .verif-badge {
        font-size: .68rem; font-weight: 700;
        padding: 2px 8px; border-radius: 6px;
      }
      .verif-badge.pending { background: #5A4A2D; color: #E8D48B; }
      .verif-badge.ok { background: #2D4A3D; color: #80CCA0; }
      .toggle-tester-btn {
        background: none; border: 1px solid var(--ho-green);
        color: var(--ho-green); border-radius: 6px;
        padding: 4px 10px; font-size: .7rem; font-weight: 600; cursor: pointer;
      }
      .toggle-tester-btn:hover { background: var(--ho-green); color: var(--ho-text-off); }

      .msg-bar {
        font-family: 'Public Sans', sans-serif; font-size: .78rem;
        padding: 8px 12px; border-radius: 8px; margin-bottom: 8px;
        animation: apfade .3s ease;
      }
      .msg-bar.success { background: #2D4A3D; color: #80CCA0; }
      .msg-bar.error { background: var(--ho-red); color: var(--ho-text-off); }

      .empty-state {
        text-align: center; color: #9C988D; font-size: .82rem;
        padding: 24px;
      }

      @keyframes apfade { from { opacity: 0 } to { opacity: 1 } }
    `;
  }

  _render() {
    return html`
      <div class="admin-wrap">
        <div class="admin-header">
          <h2>⚙️ Admin</h2>
          <button class="close-btn" id="close-admin">✕ Cerrar</button>
        </div>

        <div class="tab-bar">
          <button class="tab-btn${this.tab === 'verificacion' ? ' active' : ''}" id="tab-verif">Verificación gremial</button>
          <button class="tab-btn${this.tab === 'usuarios' ? ' active' : ''}" id="tab-users">Usuarios</button>
        </div>

        ${this.msg ? html`<div class="msg-bar success">${this.msg}</div>` : ''}
        ${this.error ? html`<div class="msg-bar error">${this.error}</div>` : ''}

        ${this.tab === 'verificacion' ? this._renderVerificacion() : this._renderUsuarios()}
      </div>
    `;
  }

  _renderVerificacion() {
    return html`
      <div class="add-form">
        <h3>Agregar miembro verificado</h3>
        <div class="form-row">
          <input type="text" id="add-nombre" placeholder="Nombre completo" value="${this.addNombre}" />
          <select id="add-cargo">
            <option value="delegado"${this.addCargo === 'delegado' ? ' selected' : ''}>Delegado/a</option>
            <option value="comision_directiva"${this.addCargo === 'comision_directiva' ? ' selected' : ''}>Comisión Directiva</option>
            <option value="comision_federacion"${this.addCargo === 'comision_federacion' ? ' selected' : ''}>Comisión Federación</option>
          </select>
        </div>
        <div class="form-row">
          <select id="add-sindicato">
            <option value="">— Sindicato —</option>
            ${this.sindicatos.map(s => html`<option value="${s.id}"${this.addSindicatoId === s.id ? ' selected' : ''}>${s.nombre}</option>`).join('')}
          </select>
          <input type="text" id="add-empresa" placeholder="Empresa (opcional)" value="${this.addEmpresa}" />
          <input type="text" id="add-territorio" placeholder="Territorio (opcional)" value="${this.addTerritorio}" />
        </div>
        <button class="add-btn" id="add-btn" ${this.loading ? 'disabled' : ''}>Agregar</button>
      </div>

      <div class="record-list">
        ${this.records.length === 0
          ? html`<div class="empty-state">No hay miembros verificados. Agregá delegados y miembros de comisiones directivas.</div>`
          : this.records.map(r => html`
            <div class="record-item">
              <div style="flex:1">
                <div class="rec-name">${r.nombre}</div>
                <div class="rec-sind">${r.sindicato_id} · ${r.empresa || '—'} · ${r.territorio || '—'}</div>
              </div>
              <span class="rec-cargo">${r.cargo.replace('_', ' ')}</span>
              <button class="rec-delete" data-id="${r.id}">✕</button>
            </div>
          `).join('')
        }
      </div>
    `;
  }

  _renderUsuarios() {
    return html`
      <div class="record-list">
        ${this.users.length === 0
          ? html`<div class="empty-state">No hay usuarios registrados.</div>`
          : this.users.map(u => html`
            <div class="user-item">
              <div class="user-name">${u.nombre || u.username}</div>
              <div class="user-detail">${u.email} · ${u.grade} · ${u.sector}</div>
              <div class="user-actions">
                <span class="tester-badge ${u.is_tester ? 'yes' : 'no'}">${u.is_tester ? 'TESTER' : 'usuario'}</span>
                ${u.verificacion_pendiente ? html`<span class="verif-badge pending">verif. pendiente</span>` : ''}
                <button class="toggle-tester-btn" data-username="${u.username}" data-tester="${u.is_tester}">
                  ${u.is_tester ? 'Quitar tester' : 'Marcar tester'}
                </button>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;
  }

  _afterRender() {
    const closeBtn = this.shadowRoot.querySelector('#close-admin');
    if (closeBtn) closeBtn.addEventListener('click', () => this.emit('close-admin'));

    const tabVerif = this.shadowRoot.querySelector('#tab-verif');
    if (tabVerif) tabVerif.addEventListener('click', () => { this.set('tab', 'verificacion'); this._loadData(); });

    const tabUsers = this.shadowRoot.querySelector('#tab-users');
    if (tabUsers) tabUsers.addEventListener('click', () => { this.set('tab', 'usuarios'); this._loadData(); });

    // Add verificacion
    const addBtn = this.shadowRoot.querySelector('#add-btn');
    if (addBtn) addBtn.addEventListener('click', () => this._addVerificacion());

    // Delete verificacion
    this.shadowRoot.querySelectorAll('.rec-delete').forEach(btn => {
      btn.addEventListener('click', () => this._deleteVerificacion(btn.dataset.id));
    });

    // Toggle tester
    this.shadowRoot.querySelectorAll('.toggle-tester-btn').forEach(btn => {
      btn.addEventListener('click', () => this._toggleTester(btn.dataset.username, btn.dataset.tester === 'true'));
    });

    // Sync add form inputs
    const addNombre = this.shadowRoot.querySelector('#add-nombre');
    if (addNombre) addNombre.addEventListener('input', (e) => { this.addNombre = e.target.value; });
    const addCargo = this.shadowRoot.querySelector('#add-cargo');
    if (addCargo) addCargo.addEventListener('change', (e) => { this.addCargo = e.target.value; });
    const addSindicato = this.shadowRoot.querySelector('#add-sindicato');
    if (addSindicato) addSindicato.addEventListener('change', (e) => { this.addSindicatoId = e.target.value; });
    const addEmpresa = this.shadowRoot.querySelector('#add-empresa');
    if (addEmpresa) addEmpresa.addEventListener('input', (e) => { this.addEmpresa = e.target.value; });
    const addTerritorio = this.shadowRoot.querySelector('#add-territorio');
    if (addTerritorio) addTerritorio.addEventListener('input', (e) => { this.addTerritorio = e.target.value; });
  }

  async _loadSindicatos() {
    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() :
                       (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : '');
      if (!baseUrl) return;
      const res = await fetch(baseUrl + '/api/auth/sindicatos?q=');
      if (res.ok) {
        const data = await res.json();
        this.set('sindicatos', data.sindicatos || []);
        if (this.sindicatos.length > 0) this.addSindicatoId = this.sindicatos[0].id;
      }
    } catch(e) {
      console.warn('Failed to load sindicatos:', e);
    }
  }

  async _loadData() {
    this.set('loading', true);
    this.set('error', '');
    this.set('msg', '');
    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() :
                       (window.HorneroAPI ? window.HorneroAPI.getBackendUrl() : '');
      if (!baseUrl) { this.set('error', 'Servidor no disponible'); return; }

      if (this.tab === 'verificacion') {
        const res = await fetch(baseUrl + '/api/auth/admin/gremio-verificacion', { headers: horneroAuth ? { 'Authorization': 'Bearer ' + horneroAuth.getAccessToken() } : {} });
        if (res.ok) {
          const data = await res.json();
          this.set('records', data.records || []);
        } else {
          this.set('error', 'Error al cargar verificaciones');
        }
      } else {
        const res = await fetch(baseUrl + '/api/auth/admin/users', { headers: horneroAuth ? { 'Authorization': 'Bearer ' + horneroAuth.getAccessToken() } : {} });
        if (res.ok) {
          const data = await res.json();
          this.set('users', data.users || []);
        } else {
          this.set('error', 'Error al cargar usuarios');
        }
      }
    } catch(e) {
      this.set('error', 'Error de conexión');
    } finally {
      this.set('loading', false);
    }
  }

  async _addVerificacion() {
    const nombre = (this.addNombre || '').trim();
    const cargo = this.addCargo;
    const sindicatoId = this.addSindicatoId;
    const empresa = (this.addEmpresa || '').trim();
    const territorio = (this.addTerritorio || '').trim();

    if (!nombre || !sindicatoId) {
      this.set('error', 'Nombre y sindicato son obligatorios');
      return;
    }

    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() : '';
      const res = await fetch(baseUrl + '/api/auth/admin/gremio-verificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(horneroAuth ? { 'Authorization': 'Bearer ' + horneroAuth.getAccessToken() } : {}) },
        body: JSON.stringify({ sindicato_id: sindicatoId, nombre, cargo, empresa, territorio })
      });
      if (res.ok) {
        this.addNombre = '';
        this.addEmpresa = '';
        this.addTerritorio = '';
        this.set('msg', `✅ ${nombre} agregado como ${cargo.replace('_', ' ')}`);
        this.set('error', '');
        this._loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        this.set('error', data.detail || 'Error al agregar');
        this.set('msg', '');
      }
    } catch(e) {
      this.set('error', 'Error de conexión');
    }
  }

  async _deleteVerificacion(id) {
    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() : '';
      const res = await fetch(baseUrl + '/api/auth/admin/gremio-verificacion/' + id, {
        method: 'DELETE',
        headers: horneroAuth ? { 'Authorization': 'Bearer ' + horneroAuth.getAccessToken() } : {}
      });
      if (res.ok) {
        this.set('msg', '✅ Registro eliminado');
        this._loadData();
      }
    } catch(e) {
      this.set('error', 'Error al eliminar');
    }
  }

  async _toggleTester(username, currentState) {
    try {
      const baseUrl = (typeof _getChatSyncBaseUrl === 'function') ? _getChatSyncBaseUrl() : '';
      const res = await fetch(baseUrl + '/api/auth/admin/set-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(horneroAuth ? { 'Authorization': 'Bearer ' + horneroAuth.getAccessToken() } : {}) },
        body: JSON.stringify({ username, is_tester: !currentState })
      });
      if (res.ok) {
        this.set('msg', `✅ ${username}: tester = ${!currentState}`);
        this._loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        this.set('error', data.detail || 'Error al actualizar tester');
      }
    } catch(e) {
      this.set('error', 'Error de conexión');
    }
  }
}

customElements.define('hornero-admin', HorneroAdmin);
