// ===== <hornero-gremial> — Reporte Gremial =====
// Archivo personal de reportes + formulario por grade
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroGremial extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      role: Number,        // 1-4 derivado de grade
      activeTab: String,   // 'reportes' | 'nuevo'
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.role = 0;
    this.activeTab = 'reportes';
    this._informes = [];
    this._fuentes = [];
    this._correcciones = [];
    this._gremioName = 'F.T.C.I.O.D y A.R.A.';
    this._gremioFull = 'Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines de la República Argentina';
    this._selectedInformeId = null;  // Para grade 2-3: informe seleccionado para corregir
    this._confirmMsg = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this._autoSelectRole();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback(name, oldVal, newVal);
    if (name === 'grade' && oldVal !== newVal) {
      this._autoSelectRole();
      this._loadData();
    }
  }

  async _autoSelectRole() {
    if (this.grade === 'B.a') this.role = 1;
    else if (this.grade === 'B.b') this.role = 2;
    else if (this.grade === 'B.c') this.role = 3;
    else if (this.grade === 'B.d') this.role = 4;
    else this.role = 0;
    this.render();
  }

  async _loadData() {
    if (this.role === 0) return;
    try {
      if (typeof dbGetAll === 'function') {
        this._informes = await dbGetAll('informes') || [];
        this._fuentes = await dbGetAll('fuentesPrimarias') || [];
        this._correcciones = await dbGetAll('correcciones') || [];
      }
    } catch(e) {
      console.warn('Gremial: IndexedDB data not available', e);
    }
    this.render();
  }

  // ===== Filtrar informes según role =====

  _getFilteredInformes() {
    if (!this._informes || this._informes.length === 0) return [];

    if (this.role === 1) {
      // Nivel 1: ve informes G1 (observaciones propias)
      return this._informes.filter(i => i.grado === 1);
    }
    if (this.role === 2) {
      // Nivel 2: ve G1 pendientes de revisión + sus correcciones
      return this._informes.filter(i => i.grado === 1);
    }
    if (this.role === 3) {
      // Nivel 3: ve todos los informes de su territorio (G1 + G2 + G3)
      return this._informes;
    }
    if (this.role === 4) {
      // Nivel 4: panorama — ve todos
      return this._informes;
    }
    return [];
  }

  _getRoleConfig() {
    const configs = {
      1: { title: 'Mi Reporte', desc: 'Tus observaciones y informes de base.', formLabel: 'Narrá tu situación — lo que viste, lo que te pasó, lo que observaste.', formPlaceholder: 'Escribí tu observación aquí...', submitLabel: 'Cargar observación', badge: 'NIVEL 1 — TRABAJADOR', color: 'green' },
      2: { title: 'Reportes a revisar', desc: 'Informes G1 pendientes de tu territorio. Podés corregir datos.', formLabel: 'Corrección del informe seleccionado.', formPlaceholder: 'Qué corregir y por qué...', submitLabel: 'Cargar corrección', badge: 'NIVEL 2 — DELEGADA', color: 'gold' },
      3: { title: 'Reportes consolidados', desc: 'Informes de tu territorio, corregidos y en proceso.', formLabel: 'Informe consolidado — agrega datos de tu territorio.', formPlaceholder: 'Agregá datos consolidados...', submitLabel: 'Cargar informe G3', badge: 'NIVEL 3 — SECRETARÍA', color: 'mid' },
      4: { title: 'Panorama gremial', desc: 'Todos los informes de la federación, por territorio.', formLabel: 'Informe federal — panorama del sector.', formPlaceholder: 'Panorama del sector aceitero...', submitLabel: 'Cargar informe G4', badge: 'NIVEL 4 — FEDERACIÓN', color: 'dark' },
    };
    return configs[this.role] || { title: 'Reporte Gremial', desc: '', formLabel: '', formPlaceholder: '', submitLabel: '', badge: '', color: '' };
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 0 16px 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Grade badge */
      .grade-badge { display: inline-flex; align-items: center; gap: 6px;
        font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        padding: 5px 10px; border-radius: 6px; margin-bottom: 4px; }
      .grade-badge.green { background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33); }
      .grade-badge.gold { background: #F0E4CC; color: #7A5E2C; }
      .grade-badge.mid { background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-dark-mid, #5A574F); }
      .grade-badge.dark { background: var(--ho-warm-gray, #E6E3DB); color: var(--ho-dark, #33312D); border: 1px solid var(--ho-dark, #33312D); }

      /* Gremio header */
      .gremio-header { background: var(--ho-dark, #33312D);
        border-radius: 13px; padding: 14px 16px; margin-bottom: 12px; }
      .gremio-row { display: flex; align-items: center; gap: 10px; }
      .gremio-badge-text { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; color: var(--ho-text-off, #F2F1EC);
        background: var(--ho-dark-surface, #45433E); padding: 4px 8px; border-radius: 5px; }
      .gremio-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text-off, #F2F1EC); }
      .gremio-full { font-family: 'Public Sans', sans-serif; font-size: .72rem;
        color: #9C988D; line-height: 1.3; }

      /* Kicker & title */
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 6px; padding: 16px 16px 0; }
      .section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); padding: 4px 16px 8px; }
      .section-desc { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: var(--ho-text-mid, #6E6A60); padding: 0 16px 8px; line-height: 1.4; }

      /* Informe cards */
      .info-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; }
      .info-card:hover { border-color: var(--ho-green, #6E8345); }
      .info-card.selected { border-color: var(--ho-gold, #B0863F);
        border-width: 2px; background: #FDF9F0; }
      .info-card-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); margin-bottom: 4px; }
      .info-card-body { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; }
      .info-card-meta { font-size: .72rem; color: #9C988D; margin-top: 4px; }

      /* Tags */
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; display: inline-block;
        margin: 1px 0; }
      .tag.estado-pendiente { background: #E6E3DB; color: #6E6A60; }
      .tag.estado-publicado { background: #D7E8D7; color: #3D6B3D; }
      .tag.estado-corregido { background: #F0E4CC; color: #7A5E2C; }
      .tags-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }

      /* Datos duros */
      .datos-row { font-family: 'JetBrains Mono', monospace; font-size: .66rem;
        color: #6E6A60; margin-top: 4px; }
      .datos-item { display: inline-block; margin-right: 8px; }

      /* Corrección mini-card */
      .corr-mini { background: #F0E4CC; border-radius: 8px; padding: 6px 10px;
        margin-top: 6px; }
      .corr-mini-title { font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .72rem; color: #7A5E2C; }
      .corr-mini-body { font-size: .72rem; color: #6E6A60; line-height: 1.3; }

      /* Empty state */
      .empty-state { padding: 24px 16px; text-align: center;
        color: var(--ho-text-light, #9C988D); font-size: .82rem;
        font-family: 'Public Sans', sans-serif; }

      /* Form area */
      .form-area { padding: 16px; }
      .form-label { font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .82rem; color: var(--ho-text, #2B2A26); margin-bottom: 8px; }
      .form-textarea { width: 100%; background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 12px; padding: 12px; font-size: .82rem;
        font-family: 'Public Sans', sans-serif; color: var(--ho-text, #2B2A26);
        resize: vertical; min-height: 80px; }
      .form-textarea::placeholder { color: var(--ho-text-light, #9C988D); }
      .form-textarea:focus { border-color: var(--ho-green, #6E8345); outline: none; }
      .form-submit { background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC);
        border: none; border-radius: 12px; padding: 12px 24px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .92rem;
        cursor: pointer; margin-top: 10px; width: 100%; }
      .form-submit:disabled { opacity: .5; cursor: not-allowed; }
      .form-disclaimer { background: var(--ho-green-pale, #E8EDD7); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #586B33);
        margin-top: 8px; line-height: 1.4; }

      /* Confirm message */
      .confirm-msg { background: #D7E8D7; color: #3D6B3D;
        padding: 10px 14px; border-radius: 8px; font-size: .82rem;
        font-weight: 600; margin-top: 10px; animation: apfade .3s ease; }

      /* Bottom tabs */
      .bottom-tabs { background: var(--ho-dark-surface, #45433E);
        display: flex; justify-content: space-around; padding: 9px 0 13px; flex: none; }
      .bottom-tab { display: flex; flex-direction: column; align-items: center;
        gap: 3px; background: none; border: none; cursor: pointer;
        padding: 3px 9px; font-family: 'Archivo', sans-serif; }
      .bottom-tab .icon { font-size: 1.05rem; }
      .bottom-tab .label { font-size: .62rem; font-weight: 600; }
      .bottom-tab.active .label { color: var(--ho-green-light, #94A867); }
      .bottom-tab .label { color: #9C988D; }
      .bottom-tab.active .icon { opacity: 1; }
      .bottom-tab .icon { opacity: .6; }

      @keyframes apfade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    `;
  }

  // ===== Render =====

  _render() {
    if (this.role === 0) {
      // Not logged in — show locked state
      return html`
        <div class="scroll" style="display:flex;align-items:center;justify-content:center;height:100%">
          <div style="text-align:center;color:#9C988D;font-size:.82rem">
            🔒 Ingresá para ver tu Reporte Gremial
          </div>
        </div>
      `;
    }

    const config = this._getRoleConfig();
    const filtered = this._getFilteredInformes();

    // Tabs view
    const showReportes = this.activeTab === 'reportes';
    const showForm = this.activeTab === 'nuevo';

    return html`
      <!-- Gremio header (compact) -->
      <div class="gremio-header">
        <div class="gremio-row">
          <span class="gremio-badge-text">✊ ${this._gremioName}</span>
          <span class="grade-badge ${config.color}">${config.badge}</span>
        </div>
        <div class="gremio-name">${config.title}</div>
        <div class="gremio-full">${this._gremioFull}</div>
      </div>

      <div class="scroll">
        ${showReportes ? this._renderReportes(filtered) : ''}
        ${showForm ? this._renderForm(config) : ''}
        ${this._confirmMsg ? '<div class="confirm-msg">' + this._confirmMsg + '</div>' : ''}
      </div>

      <div class="bottom-tabs">
        <button class="bottom-tab ${showReportes ? 'active' : ''}" data-tab="reportes">
          <span class="icon">📋</span><span class="label">Mis reportes</span>
        </button>
        <button class="bottom-tab ${showForm ? 'active' : ''}" data-tab="nuevo">
          <span class="icon">✍️</span><span class="label">Nuevo</span>
        </button>
      </div>
    `;
  }

  _renderReportes(filtered) {
    if (!filtered || filtered.length === 0) {
      return html`
        <div class="kicker">📋 ARCHIVO</div>
        <div class="empty-state">
          No hay informes todavía.<br>
          Usá "Nuevo" para cargar tu primer reporte.
        </div>
      `;
    }

    const config = this._getRoleConfig();

    let header = '';
    if (this.role === 1) header = '📋 MIS OBSERVACIONES';
    else if (this.role === 2) header = '📋 G1 — A REVISAR';
    else if (this.role === 3) header = '📋 INFORMES — MI TERRITORIO';
    else if (this.role === 4) header = '📋 PANORAMA FEDERAL';

    return html`
      <div class="kicker">${header}</div>
      ${filtered.map(inf => this._renderInformeCard(inf)).join('')}
    `;
  }

  _renderInformeCard(inf) {
    const tagsHtml = inf.etiquetas ?
      Object.entries(inf.etiquetas)
        .filter(([k, v]) => v && v.length > 0)
        .flatMap(([k, v]) => v.map(t => `<span class="tag">${t}</span>`))
        .join('') : '';

    const estadoClass = inf.estado === 'pendiente_revision' ? 'estado-pendiente' :
                        inf.estado === 'publicado' ? 'estado-publicado' :
                        inf.estado === 'corregido' ? 'estado-corregido' : '';

    const estadoTag = `<span class="tag ${estadoClass}">${inf.estado === 'pendiente_revision' ? '⏳ pendiente' : inf.estado === 'publicado' ? '✅ publicado' : inf.estado === 'corregido' ? '📝 corregido' : '✅ ' + inf.estado}</span>`;

    const empresa = inf.empresa || '';
    const territorio = inf.territorio || inf.localidad || '';
    const trabajador = inf.trabajador ? (inf.trabajador.nombre || '') + (inf.trabajador.funcion ? ', ' + inf.trabajador.funcion : '') : '';

    // Datos duros mini
    let datosHtml = '';
    if (inf.datosDuros && inf.datosDuros.length > 0) {
      datosHtml = '<div class="datos-row">' +
        inf.datosDuros.slice(0, 4).map(d => {
          const valStr = typeof d.valor === 'number' ? d.valor.toLocaleString('es-AR') : d.valor;
          return `<span class="datos-item">${d.campo}: ${valStr}${d.unidad ? ' ' + d.unidad : ''}</span>`;
        }).join('') + '</div>';
    }

    // Correcciones para este informe (grade 2-3-4 las ve)
    let corrHtml = '';
    if (this.role >= 2) {
      const corrForInf = this._correcciones.filter(c => c.informeId === inf.id);
      if (corrForInf.length > 0) {
        corrHtml = corrForInf.map(c => {
          const corrSummary = c.corrections ? c.corrections.map(cr =>
            `${cr.campo}: ${cr.valorOriginal} → ${cr.valorCorregido}`).join('; ') : '';
          return `<div class="corr-mini">
            <div class="corr-mini-title">📝 G${c.correctorGrado} — ${c.correctorNombre}</div>
            <div class="corr-mini-body">${corrSummary}</div>
          </div>`;
        }).join('');
      }
    }

    const selected = this._selectedInformeId === inf.id ? ' selected' : '';

    return `<div class="info-card${selected}" data-informe-id="${inf.id}">
      <div class="info-card-title">G${inf.grado} — ${empresa} (${territorio})</div>
      <div class="info-card-body">${trabajador}</div>
      <div class="info-card-meta">${inf.fecha || ''} · semana ${inf.semana || ''}</div>
      ${datosHtml}
      <div class="tags-row">${estadoTag} ${tagsHtml}</div>
      ${corrHtml}
    </div>`;
  }

  _renderForm(config) {
    // Grade 2: need to select an informe first
    const needSelect = this.role === 2 && !this._selectedInformeId;

    if (needSelect) {
      return html`
        <div class="form-area">
          <div class="form-label">${config.formLabel}</div>
          <div style="font-size:.82rem;color:#B0863F;margin-bottom:12px">
            👆 Primero seleccioná un informe G1 en "Mis reportes" para indicar qué corregir.
          </div>
        </div>
      `;
    }

    let selectedInfo = '';
    if (this._selectedInformeId && this.role === 2) {
      const inf = this._informes.find(i => i.id === this._selectedInformeId);
      if (inf) {
        selectedInfo = `<div style="background:#F0E4CC;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:.78rem;color:#7A5E2C">
          Corrigiendo: G${inf.grado} — ${inf.empresa || ''} (${inf.territorio || inf.localidad || ''})
        </div>`;
      }
    }

    return html`
      <div class="form-area">
        ${selectedInfo}
        <div class="form-label">${config.formLabel}</div>
        <textarea class="form-textarea" placeholder="${config.formPlaceholder}" rows="3"></textarea>
        <div class="form-disclaimer">⚠️ La IA propone — vos decidís, editás, aprobás</div>
        <button class="form-submit">${config.submitLabel}</button>
      </div>
    `;
  }

  _afterRender() {
    // Bottom tab clicks
    this.shadowRoot.querySelectorAll('.bottom-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        if (tabId) {
          this.activeTab = tabId;
          this._confirmMsg = '';
          this.render();
        }
      });
    });

    // Informe card clicks (select for grade 2 correction)
    this.shadowRoot.querySelectorAll('.info-card').forEach(card => {
      card.addEventListener('click', () => {
        const informeId = card.dataset.informeId;
        if (informeId && this.role === 2) {
          this._selectedInformeId = informeId;
          this.activeTab = 'nuevo';
          this._confirmMsg = '';
          this.render();
        }
      });
    });

    // Form submit
    const submitBtn = this.shadowRoot.querySelector('.form-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._submitReport());
    }
  }

  async _submitReport() {
    const textarea = this.shadowRoot.querySelector('.form-textarea');
    if (!textarea || !textarea.value.trim()) return;

    const contenido = textarea.value.trim();
    const id = typeof generarUUID === 'function' ? generarUUID() : 'h-' + Date.now();

    try {
      if (this.role === 1) {
        // Grade 1: guardar fuente primaria + informe G1
        const fuente = {
          id: id,
          tipo: 'texto',
          fecha: new Date().toISOString().slice(0, 10),
          trabajador: this._getCurrentTrabajador(),
          empresa: 'Piloto',
          seccion: '',
          localidad: '',
          contenido: contenido,
          original: true,
        };
        if (typeof guardarFuentePrimaria === 'function') await guardarFuentePrimaria(fuente);
        this._fuentes.push(fuente);

        // Auto-generate informe G1 from the observation
        const informe = {
          id: 'g1-' + id,
          grado: 1,
          fecha: new Date().toISOString().slice(0, 10),
          semana: this._getCurrentWeek(),
          fuentePrimariaId: id,
          trabajador: this._getCurrentTrabajador(),
          empresa: 'Piloto',
          localidad: '',
          territorio: this._getTerritory(),
          etiquetas: {},
          datosDuros: [],
          estado: 'pendiente_revision',
        };
        if (typeof guardarInforme === 'function') await guardarInforme(informe);
        this._informes.push(informe);

      } else if (this.role === 2 && this._selectedInformeId) {
        // Grade 2: guardar corrección
        const correccion = {
          id: 'corr-' + id,
          informeId: this._selectedInformeId,
          correctorGrado: 2,
          correctorId: this._getUsername(),
          correctorNombre: this._getNombre(),
          fecha: new Date().toISOString().slice(0, 10),
          corrections: [{ campo: 'observacion_delegada', valorOriginal: '', valorCorregido: contenido, justificacion: contenido }],
        };
        if (typeof guardarCorreccion === 'function') await guardarCorreccion(correccion);
        this._correcciones.push(correccion);
        this._selectedInformeId = null;

      } else if (this.role === 3) {
        // Grade 3: guardar informe G3
        const informe = {
          id: 'g3-' + id,
          grado: 3,
          fecha: new Date().toISOString().slice(0, 10),
          semana: this._getCurrentWeek(),
          trabajador: this._getCurrentTrabajador(),
          empresa: 'Consolidado',
          localidad: '',
          territorio: this._getTerritory(),
          etiquetas: {},
          datosDuros: [],
          contenido: contenido,
          estado: 'pendiente_revision',
        };
        if (typeof guardarInforme === 'function') await guardarInforme(informe);
        this._informes.push(informe);

      } else if (this.role === 4) {
        // Grade 4: guardar informe G4
        const informe = {
          id: 'g4-' + id,
          grado: 4,
          fecha: new Date().toISOString().slice(0, 10),
          semana: this._getCurrentWeek(),
          trabajador: this._getCurrentTrabajador(),
          empresa: 'Panorama',
          localidad: '',
          territorio: this._getTerritory(),
          etiquetas: {},
          datosDuros: [],
          contenido: contenido,
          estado: 'pendiente_revision',
        };
        if (typeof guardarInforme === 'function') await guardarInforme(informe);
        this._informes.push(informe);
      }
    } catch(e) {
      console.warn('Gremial: Could not save to IndexedDB', e);
    }

    textarea.value = '';
    this._confirmMsg = '✅ Guardado en tu archivo local';
    this.activeTab = 'reportes';
    this.render();
  }

  // ===== Helpers =====

  _getUsername() {
    // Get from session stored in localStorage
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      return session ? session.username : 'piloto';
    } catch(e) { return 'piloto'; }
  }

  _getNombre() {
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      return session ? session.nombre : 'Trabajador';
    } catch(e) { return 'Trabajador'; }
  }

  _getTerritory() {
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      return session ? session.territory : 'san-lorenzo';
    } catch(e) { return 'san-lorenzo'; }
  }

  _getCurrentTrabajador() {
    return { nombre: this._getNombre(), funcion: this.role === 1 ? 'Base' : this.role === 2 ? 'Delegada' : this.role === 3 ? 'Secretaria' : 'Federación', seccion: '' };
  }

  _getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000;
    const weekNum = Math.ceil((diff / oneWeek) + 1);
    return now.getFullYear() + '-W' + (weekNum < 10 ? '0' : '') + weekNum;
  }
}

customElements.define('hornero-gremial', HorneroGremial);
