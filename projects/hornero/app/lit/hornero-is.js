// ===== <hornero-is> — Inteligencia Sindical =====
// Roles, steps, observaciones, informes, correcciones
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroIs extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      role: Number,        // 1-4
      step: Number,        // current step in flow
      chatStarted: Boolean,
      chatStep: Number,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.role = 0;  // 0 = not yet set; auto-determined from grade when logged in
    this.step = 0;
    this.chatStarted = false;
    this.chatStep = 0;
    this._informes = [];
    this._fuentes = [];
    this._correcciones = [];
  }

  connectedCallback() {
    super.connectedCallback();
    // Auto-select role based on grade (login provides grade)
    this._autoSelectRole();
  }

  _autoSelectRole() {
    // Grade → role mapping (from login session)
    if (this.grade === 'B.a') this.role = 1;
    else if (this.grade === 'B.b') this.role = 2;
    else if (this.grade === 'B.c') this.role = 3;
    else if (this.grade === 'B.d') this.role = 4;
    else this.role = 0;  // Grade A — no access, shouldn't reach this screen

    // Skip role selection step — go directly to step 1
    if (this.role > 0) this.step = 1;
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback(name, oldVal, newVal);
    // Re-determine role when grade changes (e.g. after login)
    if (name === 'grade' && oldVal !== newVal) {
      this._autoSelectRole();
    }
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }

      .role-select { padding: 16px; }
      .role-btn { display: flex; align-items: center; gap: 10px;
        background: var(--ho-card, #2A3230); border: 1.5px solid;
        border-radius: 12px; padding: 9px 13px; cursor: pointer;
        margin-bottom: 8px; font-family: 'Archivo', sans-serif;
        font-weight: 600; font-size: .88rem; }
      .role-btn:hover { border-color: var(--ho-green, #4E9978); }
      .role-dot { width: 26px; height: 26px; border-radius: 50%;
        font-family: 'JetBrains Mono', monospace; font-size: .72rem;
        display: flex; align-items: center; justify-content: center;
        border: 1.5px solid; }
      .role-1 { border-color: var(--ho-green, #4E9978); color: var(--ho-green-dark, #3D6B56); }
      .role-1 .role-dot { background: var(--ho-green-pale, #E0F0EB); border-color: var(--ho-green, #4E9978); }
      .role-2 { border-color: var(--ho-gold, #B0863F); color: #7A5E2C; }
      .role-2 .role-dot { background: #F0E4CC; border-color: var(--ho-gold, #B0863F); }
      .role-3 { border-color: var(--ho-dark-mid, #536260); color: var(--ho-text, #E8E6E0); }
      .role-3 .role-dot { background: var(--ho-mid-gray, #ECEAE3); border-color: var(--ho-dark-mid, #536260); }
      .role-4 { border-color: var(--ho-dark, #1E2321); color: var(--ho-text, #E8E6E0); }
      .role-4 .role-dot { background: var(--ho-warm-gray, #E6E3DB); border-color: var(--ho-dark, #1E2321); }

      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 8px; padding: 16px 16px 0; }
      .section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); padding: 4px 16px 8px; }

      /* Observation input */
      .obs-input { padding: 16px; }
      .obs-textarea { width: 100%; background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 12px; padding: 12px; font-size: .82rem;
        font-family: 'Public Sans', sans-serif; color: var(--ho-text, #E8E6E0);
        resize: vertical; min-height: 80px; }
      .obs-textarea::placeholder { color: var(--ho-text-light, #9C988D); }
      .obs-submit { background: var(--ho-green, #4E9978); color: var(--ho-text-off, #F2F1EC);
        border: none; border-radius: 12px; padding: 12px 24px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .92rem;
        cursor: pointer; margin-top: 10px; width: 100%; }
      .obs-submit:disabled { opacity: .5; cursor: not-allowed; }
      .obs-disclaimer { background: var(--ho-green-pale, #E0F0EB); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #3D6B56);
        margin-top: 8px; line-height: 1.4; }

      /* Informe cards */
      .informes-scroll { flex: 1; overflow-y: auto; padding: 16px; }
      .info-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 14px; margin-bottom: 10px; }
      .info-card-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #E8E6E0); margin-bottom: 4px; }
      .info-card-body { font-family: 'Public Sans', sans-serif; font-size: .86rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; display: inline-block;
        margin: 1px 0; }
      .tags-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }

      /* Bottom tabs */
      .is-tabs { background: var(--ho-dark-surface, #3F4E4A);
        display: flex; justify-content: space-around; padding: 9px 0 13px; flex: none; }
      .is-tab { display: flex; flex-direction: column; align-items: center;
        gap: 3px; background: none; border: none; cursor: pointer;
        padding: 3px 9px; font-family: 'Archivo', sans-serif; }
      .is-tab .icon { font-size: 1.05rem; }
      .is-tab .label { font-size: .62rem; font-weight: 600; }
    `;
  }

  async connectedCallback() {
    super.connectedCallback();
    // Load existing data from IndexedDB
    try {
      if (typeof dbGetAll === 'function') {
        this._informes = await dbGetAll('informes') || [];
        this._fuentes = await dbGetAll('fuentesPrimarias') || [];
        this._correcciones = await dbGetAll('correcciones') || [];
      }
    } catch(e) {
      console.warn('IS: IndexedDB data not available', e);
    }
  }

  _render() {
    // Step 0: Role selection
    if (this.step === 0) {
      return html`
        <div class="role-select">
          <div class="kicker">✍️ INFORME SINDICAL</div>
          <div style="font-size:.82rem;color:#6E6A60;margin-bottom:12px;padding:0 2px">
            Seleccioná tu rol para entrar al sistema. Cada rol tiene funciones y visibilidad diferentes.
          </div>
          ${this._roleButtons()}
        </div>
        <div class="is-tabs">
          <button class="is-tab" style="opacity:.5"><span class="icon">🪶</span><span class="label">Inicio</span></button>
          <button class="is-tab" style="color:#80CCA0"><span class="icon">✍️</span><span class="label">IS</span></button>
        </div>
      `;
    }

    // Step 1: Main IS screen (load observation + view reports)
    return html`
      <div class="kicker">✍️ IS — GRADE ${this.role}</div>
      <div class="section-title">Reporte gremial</div>

      <div class="obs-input">
        <textarea class="obs-textarea" placeholder="Narrá tu situación — lo que viste, lo que te pasó, lo que observaste. La IA etiqueta y ordena." rows="3"></textarea>
        <div class="obs-disclaimer">⚠️ La IA propone — vos decidís, editás, aprobás</div>
        <button class="obs-submit">Cargar observación</button>
      </div>

      <div class="informes-scroll">
        <div class="kicker" style="padding:0">INFORMES</div>
        ${this._renderInformes()}
      </div>

      <div class="is-tabs">
        <button class="is-tab"><span class="icon">🪶</span><span class="label">Inicio</span></button>
        <button class="is-tab"><span class="icon">✍️</span><span class="label">Cargar</span></button>
        <button class="is-tab"><span class="icon">📋</span><span class="label">Informes</span></button>
      </div>
    `;
  }

  _roleButtons() {
    const roles = [
      { num: 1, label: 'Trabajador', desc: 'Carga observaciones' },
      { num: 2, label: 'Delegado', desc: 'Chequea G1, produce G2' },
      { num: 3, label: 'Secretario', desc: 'Agrega G2, produce G3' },
      { num: 4, label: 'Federación', desc: 'Panorama federal' },
    ];
    return roles.map(r =>
      `<div class="role-btn role-${r.num}" data-role="${r.num}">
        <div class="role-dot">${r.num}</div>
        <div><strong>${r.label}</strong><div style="font-size:.72rem;color:#9C988D">${r.desc}</div></div>
      </div>`
    ).join('');
  }

  _renderInformes() {
    if (!this._informes || this._informes.length === 0) {
      return '<div style="padding:20px;text-align:center;color:#9C988D;font-size:.82rem">No hay informes cargados todavía</div>';
    }

    return this._informes.map(inf => {
      const tagsHtml = inf.etiquetas ?
        Object.entries(inf.etiquetas)
          .filter(([k, v]) => v && v.length > 0)
          .map(([k, v]) => `<span class="tag">${v}</span>`)
          .join('') : '';
      const empresa = inf.empresa || '';
      const territorio = inf.territorio || '';
      const estadoTag = inf.estado === 'pendiente_revision' ?
        '<span class="tag" style="background:#E6E3DB;color:#6E6A60">⏳ pendiente</span>' :
        '<span class="tag">✅ ' + inf.estado + '</span>';

      return `<div class="info-card">
        <div class="info-card-title">G${inf.grado} — ${empresa} (${territorio})</div>
        <div class="info-card-body">${inf.trabajador ? inf.trabajador.nombre + ', ' + inf.trabajador.rol : ''}</div>
        <div class="tags-row">${estadoTag} ${tagsHtml}</div>
      </div>`;
    }).join('');
  }

  _afterRender() {
    // Role selection clicks
    this.shadowRoot.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('role', Number(btn.dataset.role));
        this.set('step', 1);
      });
    });

    // Observation submit
    const submitBtn = this.shadowRoot.querySelector('.obs-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._submitObservation());
    }

    // Home tab
    this.shadowRoot.querySelectorAll('.is-tab').forEach(tab => {
      const label = tab.querySelector('.label');
      if (label && label.textContent === 'Inicio') {
        tab.addEventListener('click', () => this.goScreen('home'));
      }
    });
  }

  async _submitObservation() {
    const textarea = this.shadowRoot.querySelector('.obs-textarea');
    if (!textarea || !textarea.value.trim()) return;

    const contenido = textarea.value.trim();
    const id = typeof generarUUID === 'function' ? generarUUID() : 'h-' + Date.now();

    // Create fuente primaria (immutable)
    const fuente = {
      id: id,
      tipo: 'texto',
      fecha: new Date().toISOString().slice(0, 10),
      trabajador: { nombre: 'Trabajador', rol: 'base' },
      empresa: 'Piloto',
      seccion: '',
      localidad: '',
      contenido: contenido,
      original: true,
    };

    // Save to IndexedDB
    try {
      if (typeof guardarFuentePrimaria === 'function') {
        await guardarFuentePrimaria(fuente);
      }
      if (typeof encolarSync === 'function') {
        await encolarSync({ id: 'sync-' + id, tipo: 'observacion', estado: 'pendiente', data: fuente });
      }
    } catch(e) {
      console.warn('IS: Could not save to IndexedDB', e);
    }

    // Clear textarea
    textarea.value = '';

    // Refresh informes display
    try {
      if (typeof dbGetAll === 'function') {
        this._informes = await dbGetAll('informes') || [];
        this._fuentes = await dbGetAll('fuentesPrimarias') || [];
        this._fuentes.push(fuente);
      }
    } catch(e) {}

    // Show confirmation
    this.set('step', 1); // Trigger re-render
  }
}

customElements.define('hornero-is', HorneroIs);
