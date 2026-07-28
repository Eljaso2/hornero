// ===== <hornero-condicion> — Panorama: Condición obrera =====
// 4 índices: CE · IFT · Cómo Somos · SMVM
// Sub-pantallas internas con datos del monolito
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroCondicion extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      tab: String,        // 'panorama' | 'como-somos' | 've' | 'smvm' | 'ift'
      subTab: String,     // sub-nav dentro de como-somos: 'foto' | 'pelicula'
      expandedId: String,  // expanded item id
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.tab = 'panorama';
    this.subTab = 'foto';
    this.expandedId = '';
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }
      .scroll { flex: 1; overflow-y: auto; padding: 20px 16px;
        -webkit-overflow-scrolling: touch; }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 8px; }
      .section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); margin-bottom: 4px; }
      .intro { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-bottom: 12px; }

      /* ===== Tab bar ===== */
      .tab-bar { display: flex; gap: 0; margin-bottom: 16px;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08));
        overflow-x: auto; scrollbar-width: none; }
      .tab-bar::-webkit-scrollbar { width: 0; }
      .tab-btn { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        background: none; border: none; cursor: pointer;
        padding: 8px 10px; border-bottom: 2px solid transparent;
        transition: color .2s, border-color .2s; white-space: nowrap; }
      .tab-btn.active { color: var(--ho-green, #4E9978);
        border-bottom-color: var(--ho-green, #4E9978); }

      /* ===== Formula banner ===== */
      .formula { background: var(--ho-green-pale, #E0F0EB); border-radius: 10px;
        padding: 10px 14px; margin-bottom: 16px; text-align: center; }
      .formula-text { font-family: 'JetBrains Mono', monospace; font-size: .78rem;
        font-weight: 700; color: var(--ho-green-dark, #3D6B56);
        letter-spacing: .04em; }

      /* ===== 2x2 grid ===== */
      .grid-2x2 { display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 10px; margin-bottom: 16px; }
      .grid-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 14px; cursor: pointer;
        transition: border-color .2s; }
      .grid-card:hover { border-color: var(--ho-green, #4E9978); }
      .grid-card .gc-emoji { font-size: 1.4rem; }
      .grid-card .gc-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #E8E6E0); margin-top: 4px; }
      .grid-card .gc-sub { font-size: .74rem; color: var(--ho-text-mid, #6E6A60);
        margin-top: 2px; line-height: 1.3; }

      /* ===== Accent stripe cards ===== */
      .stripe-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; }
      .stripe-card:hover { border-color: var(--ho-green, #4E9978); }
      .stripe-card.expanded { cursor: default; }
      .stripe-card.ce { border-left: 3px solid #4E9978; }
      .stripe-card.ift { border-left: 3px solid #80CCA0; }
      .stripe-card.comos { border-left: 3px solid #3D6B56; }
      .stripe-card.smvm { border-left: 3px solid #B0863F; }
      .stripe-card .sc-emoji { font-size: 1rem; }
      .stripe-card .sc-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #E8E6E0); }
      .stripe-card .sc-desc { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 4px; }
      .stripe-card .sc-conn { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-green-dark, #3D6B56); margin-top: 6px; }

      /* ===== Data cards ===== */
      .data-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 14px; margin-bottom: 10px; }
      .data-label { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); }
      .data-value { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.6rem; color: var(--ho-text, #E8E6E0); }
      .data-sub { font-size: .78rem; color: var(--ho-text-mid, #6E6A60);
        margin-top: 2px; }
      .data-row { display: flex; gap: 10px; margin-bottom: 10px; }
      .data-row .data-card { flex: 1; margin-bottom: 0; }

      /* ===== Stacked bar ===== */
      .stacked-bar { height: 28px; border-radius: 8px; overflow: hidden;
        display: flex; margin-bottom: 6px; }
      .stacked-bar .seg { display: flex; align-items: center; justify-content: center;
        font-family: 'JetBrains Mono', monospace; font-size: .62rem; font-weight: 700;
        color: #fff; }
      .stacked-bar .seg-activo { background: #4E9978; }
      .stacked-bar .seg-reserva { background: #C0392B; }
      .bar-legend { display: flex; gap: 12px; margin-bottom: 12px; }
      .bar-legend-item { display: flex; align-items: center; gap: 4px;
        font-size: .72rem; color: var(--ho-text-mid, #6E6A60); }
      .bar-legend-dot { width: 8px; height: 8px; border-radius: 50%; }

      /* ===== Breakdown list ===== */
      .breakdown { margin-top: 10px; }
      .breakdown-item { display: flex; align-items: baseline; gap: 8px;
        padding: 6px 0; border-bottom: 1px solid rgba(43,42,38,.06); }
      .breakdown-item:last-child { border-bottom: none; }
      .bd-label { font-family: 'Archivo', sans-serif; font-size: .82rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0); flex: 1; }
      .bd-value { font-family: 'JetBrains Mono', monospace; font-size: .82rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); }
      .bd-desc { font-size: .72rem; color: var(--ho-text-mid, #6E6A60); }

      /* ===== ICE dimension grid ===== */
      .ice-grid { display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 10px; margin-bottom: 12px; }
      .ice-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 12px; cursor: pointer;
        transition: border-color .2s; }
      .ice-card:hover { border-color: var(--ho-green, #4E9978); }
      .ice-card .ice-emoji { font-size: 1.2rem; }
      .ice-card .ice-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; color: var(--ho-text, #E8E6E0); margin-top: 3px; }
      .ice-card .ice-tag { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        font-weight: 600; color: var(--ho-green-dark, #3D6B56);
        background: var(--ho-green-pale, #E0F0EB); border-radius: 5px;
        padding: 2px 6px; display: inline-block; margin-top: 3px; }
      .ice-card .ice-desc { font-size: .72rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.3; margin-top: 3px; }

      /* ===== Ranking ===== */
      .ranking-item { display: flex; align-items: center; gap: 10px;
        padding: 8px 0; border-bottom: 1px solid rgba(43,42,38,.06); }
      .ranking-item:last-child { border-bottom: none; }
      .rank-name { font-family: 'Archivo', sans-serif; font-size: .82rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0); flex: 1; }
      .rank-score { font-family: 'JetBrains Mono', monospace; font-size: .82rem;
        font-weight: 700; }
      .rank-bar { width: 60px; height: 8px; border-radius: 4px; background: #E0F0EB;
        overflow: hidden; }
      .rank-bar-fill { height: 100%; border-radius: 4px; }

      /* ===== SMVM levels ===== */
      .level-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 14px; margin-bottom: 10px; }
      .level-card .level-label { font-family: 'Archivo', sans-serif; font-size: .82rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); }
      .level-card .level-amount { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.3rem; color: var(--ho-text, #E8E6E0); margin-top: 2px; }
      .level-card .level-desc { font-size: .78rem; color: var(--ho-text-mid, #6E6A60);
        margin-top: 2px; }
      .level-card .level-pct { font-family: 'JetBrains Mono', monospace; font-size: .72rem;
        font-weight: 700; margin-top: 4px; }
      .level-card .pct-red { color: #C0392B; }
      .level-card .pct-gold { color: #B0863F; }
      .level-card .pct-green { color: #4E9978; }

      /* ===== Needs grid ===== */
      .needs-grid { display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 8px; margin-bottom: 12px; }
      .need-item { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 10px; padding: 10px 8px; text-align: center; }
      .need-item .need-emoji { font-size: 1.1rem; }
      .need-item .need-name { font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0); margin-top: 3px; }

      /* ===== Sector list ===== */
      .sector-item { display: flex; align-items: center; gap: 10px;
        padding: 8px 0; border-bottom: 1px solid rgba(43,42,38,.06); }
      .sector-item:last-child { border-bottom: none; }
      .sector-name { font-family: 'Archivo', sans-serif; font-size: .82rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0); flex: 1; }
      .sector-amount { font-family: 'JetBrains Mono', monospace; font-size: .78rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); }
      .sector-pct { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; }

      /* ===== Connection cards ===== */
      .conn-card { background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 13px; padding: 14px; margin-bottom: 10px; }
      .conn-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #E8E6E0); }
      .conn-desc { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 4px; }

      /* ===== Disclaimer ===== */
      .disclaimer { background: var(--ho-green-pale, #E0F0EB); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #3D6B56);
        margin-top: 12px; line-height: 1.4; }

      /* ===== Chat prompt bar ===== */
      .chat-bar { display: flex; align-items: center; gap: 8px;
        margin-top: 14px; padding: 10px 12px;
        background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 10px; cursor: pointer; transition: border-color .2s; }
      .chat-bar:hover { border-color: var(--ho-green, #4E9978); }
      .chat-bar-icon { font-size: 1.1rem; }
      .chat-bar-text { flex: 1; font-family: 'Archivo', sans-serif; font-size: .82rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0); }
      .chat-bar-arrow { font-size: .82rem; color: var(--ho-green, #4E9978); }
    `;
  }

  _render() {
    var tabContent = '';
    if (this.tab === 'panorama') tabContent = this._renderPanorama();
    else if (this.tab === 'como-somos') tabContent = this._renderComoSomos();
    else if (this.tab === 've') tabContent = this._renderVE();
    else if (this.tab === 'smvm') tabContent = this._renderSMVM();
    else if (this.tab === 'ift') tabContent = this._renderIFT();

    return html`
      <div class="scroll">
        <div class="kicker">📊 PANORAMA</div>
        <div class="section-title">Condición obrera</div>
        <div class="intro">Cómo actúa el empresario × lo que te importa × cómo se forma la clase × lo que te sostiene. La misma data, cuatro lecturas.</div>

        <div class="formula">
          <div class="formula-text">ICE × SMVM × IFT × CÓMO SOMOS</div>
        </div>

        <div class="tab-bar">
          <button class="tab-btn${this.tab === 'panorama' ? ' active' : ''}" data-tab="panorama">📊 Panorama</button>
          <button class="tab-btn${this.tab === 'como-somos' ? ' active' : ''}" data-tab="como-somos">👥 Cómo Somos</button>
          <button class="tab-btn${this.tab === 've' ? ' active' : ''}" data-tab="ve">🏭 CE</button>
          <button class="tab-btn${this.tab === 'smvm' ? ' active' : ''}" data-tab="smvm">💰 SMVM</button>
          <button class="tab-btn${this.tab === 'ift' ? ' active' : ''}" data-tab="ift">🌿 IFT</button>
        </div>

        ${tabContent}

        <div class="disclaimer">⚠️ La IA propone — vos decidís, editás, aprobás</div>
      </div>
    `;
  }

  // ===== TAB: Panorama (overview) =====
  _renderPanorama() {
    return html`
      <div class="grid-2x2">
        <div class="grid-card" data-tab="como-somos">
          <div class="gc-emoji">📊</div>
          <div class="gc-title">Cómo Somos</div>
          <div class="gc-sub">Datos duros de la clase, foto y película</div>
        </div>
        <div class="grid-card" data-tab="ve">
          <div class="gc-emoji">🏭</div>
          <div class="gc-title">Comportamiento Empresarial</div>
          <div class="gc-sub">Índice ICE, 4 dimensiones, VE × SMVM</div>
        </div>
        <div class="grid-card" data-tab="smvm">
          <div class="gc-emoji">💰</div>
          <div class="gc-title">SMVM</div>
          <div class="gc-sub">Ingresos, salarios, redistribución</div>
        </div>
        <div class="grid-card" data-tab="ift">
          <div class="gc-emoji">🌿</div>
          <div class="gc-title">Felicidad Laboral</div>
          <div class="gc-sub">IFT = SMVM × ICE</div>
        </div>
      </div>

      <div class="kicker" style="margin-top:4px">CONEXIONES</div>
      <div class="stripe-card ce">
        <div class="sc-title">ICE × IFT</div>
        <div class="sc-desc">Qué dimensiones de CE afectan qué dimensiones de felicidad. El comportamiento que te daña impacta lo que te importa.</div>
      </div>
      <div class="stripe-card smvm">
        <div class="sc-title">SMVM × IFT</div>
        <div class="sc-desc">IFT = SMVM × ICE. Cómo el salario mínimo se relaciona con la felicidad — complementa ICE × SMVM.</div>
      </div>
      <div class="stripe-card ce">
        <div class="sc-title">SMVM × ICE → VE Estructural</div>
        <div class="sc-desc">La brecha SMVM vs. facturación es la dimensión Estructural del ICE. Sin SMVM, no se puede medir VE Estructural.</div>
      </div>
      <div class="stripe-card comos">
        <div class="sc-title">Cómo Somos × CE</div>
        <div class="sc-desc">Qué fracciones de clase sufren qué dimensión de CE. La forma de la clase contextualiza el comportamiento empresarial.</div>
      </div>
    `;
  }

  // ===== TAB: Cómo Somos =====
  _renderComoSomos() {
    return html`
      <div class="section-title" style="margin-bottom:4px">Cómo Somos</div>
      <div class="intro">Datos duros de la clase trabajadora argentina. Foto presente — cuántos somos, cómo estamos — y película dinámica — hacia dónde vamos.</div>
      <div class="intro" style="font-size:.72rem;color:var(--ho-text-light,#9C988D)">Categorías de Iñigo Carrera: ejército activo, reserva (flotante, latente, estancada), pauperización. Fuentes: INDEC, Min. Trabajo, UCA, MATE Economía, CTAA, PIMSA, Luis Campos.</div>

      <!-- Foto presente -->
      <div class="kicker" style="margin-top:12px">FOTO PRESENTE</div>
      <div class="data-card">
        <div class="data-label">Población total</div>
        <div class="data-value">46,0 M</div>
        <div class="data-sub">Censo 2022, INDEC</div>
      </div>

      <div class="data-card">
        <div class="data-label">Clase obrera</div>
        <div class="data-value">18,5 M</div>
        <div class="stacked-bar" style="margin-top:8px">
          <div class="seg seg-activo" style="width:71.4%">71,4%</div>
          <div class="seg seg-reserva" style="width:28.6%">28,6%</div>
        </div>
        <div class="bar-legend">
          <div class="bar-legend-item"><span class="bar-legend-dot" style="background:#4E9978"></span>Activo 13,2M</div>
          <div class="bar-legend-item"><span class="bar-legend-dot" style="background:#C0392B"></span>Reserva 5,3M</div>
        </div>
        <div class="breakdown">
          <div class="breakdown-item">
            <span class="bd-label">Ejército activo</span>
            <span class="bd-value">13,2 M</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">Ejército de reserva</span>
            <span class="bd-value">5,3 M</span>
          </div>
        </div>
      </div>

      <div class="data-card">
        <div class="data-label">Ejército de reserva — desglose</div>
        <div class="breakdown">
          <div class="breakdown-item">
            <span class="bd-label">Flotante</span>
            <span class="bd-value">2,4 M</span>
            <span class="bd-desc">Desocupados que rotan por ciclo</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">Latente</span>
            <span class="bd-value">1,5 M</span>
            <span class="bd-desc">Aún no incorporados al trabajo asalariado</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">Estancada</span>
            <span class="bd-value">1,4 M</span>
            <span class="bd-desc">Irregular, precario, baja calificación</span>
          </div>
        </div>
        <div class="intro" style="font-size:.72rem;margin-top:4px;margin-bottom:0">Pauperización: trabajadores que ya no venden su fuerza de trabajo — por debajo del ejército de reserva.</div>
      </div>

      <div class="data-row">
        <div class="data-card">
          <div class="data-label">Jubilados</div>
          <div class="data-value" style="font-size:1.2rem">7,8 M</div>
          <div class="data-sub">Pasivos previsionales, fuera del ejército</div>
        </div>
      </div>

      <!-- Película -->
      <div class="kicker" style="margin-top:12px">PELÍCULA — SEMANA 26 JUNIO 2026</div>
      <div class="data-row">
        <div class="data-card">
          <div class="data-label">Despidos</div>
          <div class="data-value" style="font-size:1.2rem;color:#C0392B">1.240</div>
          <div class="data-sub">+12% vs. semana anterior</div>
        </div>
        <div class="data-card">
          <div class="data-label">Nuevo empleo</div>
          <div class="data-value" style="font-size:1.2rem;color:#4E9978">380</div>
          <div class="data-sub">-8% vs. semana anterior</div>
        </div>
      </div>

      <div class="data-card">
        <div class="data-label">Tendencia sectorial</div>
        <div class="breakdown">
          <div class="breakdown-item">
            <span class="bd-label">🏭 Industria</span>
            <span class="bd-value" style="color:#C0392B">pierde ↓</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🛎️ Servicios</span>
            <span class="bd-value" style="color:#4E9978">crece ↑</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🏗️ Construcción</span>
            <span class="bd-value" style="color:#4E9978">crece ↑</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🏛️ Estado</span>
            <span class="bd-value" style="color:#B0863F">achica ↓</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🌾 Agro</span>
            <span class="bd-value" style="color:#80CCA0">estabiliza →</span>
          </div>
        </div>
      </div>

      <div class="chat-bar" data-action="chat-como-somos">
        <span class="chat-bar-icon">💬</span>
        <span class="chat-bar-text">Preguntá sobre la clase trabajadora</span>
        <span class="chat-bar-arrow">→</span>
      </div>
    `;
  }

  // ===== TAB: Comportamiento Empresarial =====
  _renderVE() {
    return html`
      <div class="section-title" style="margin-bottom:4px">Comportamiento Empresarial</div>
      <div class="intro">El CE es cómo actúa el empresario: lo que hace, lo que omite, lo que dice. Si eso daña al trabajador, lo registramos como Violencia Empresarial (VE).</div>

      <div class="kicker">ÍNDICE ICE — 4 DIMENSIONES</div>
      <div class="ice-grid">
        <div class="ice-card" data-expand="ve-directa">
          <div class="ice-emoji">⚡</div>
          <div class="ice-title">Directa</div>
          <span class="ice-tag">CE · VE Directa</span>
          <div class="ice-desc">Amenazas, lockout, espionaje, represión</div>
        </div>
        <div class="ice-card" data-expand="ve-ct">
          <div class="ice-emoji">🛡️</div>
          <div class="ice-title">Condiciones de Trabajo</div>
          <span class="ice-tag">CE · VE CT</span>
          <div class="ice-desc">Accidentes, EPP, enfermería, ritmo</div>
        </div>
        <div class="ice-card" data-expand="ve-estructural">
          <div class="ice-emoji">💰</div>
          <div class="ice-title">Estructural</div>
          <span class="ice-tag">CE · VE Estructural</span>
          <div class="ice-desc">Salario vs. balances, tercerización</div>
        </div>
        <div class="ice-card" data-expand="ve-simbolica">
          <div class="ice-emoji">🤫</div>
          <div class="ice-title">Simbólica</div>
          <span class="ice-tag">CE · VE Simbólica</span>
          <div class="ice-desc">Discurso anti-obrero, racismo</div>
        </div>
      </div>

      <div class="data-card">
        <div class="data-label">Comportamiento detectado</div>
        <div class="breakdown">
          <div class="breakdown-item">
            <span class="bd-label" style="color:#4E9978">✅ Buenas Prácticas</span>
            <span class="bd-desc">Comportamiento correcto que compensa VE</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label" style="color:#C0392B">🚫 Falsas Buenas Prácticas</span>
            <span class="bd-desc">RSE como fachada que oculta VE</span>
          </div>
        </div>
      </div>

      <div class="kicker" style="margin-top:12px">ICE POR EMPRESA — SECTOR ACEITERO</div>
      <div class="data-card">
        <div class="ranking-item">
          <span class="rank-name">Dow Argentina</span>
          <span class="rank-score" style="color:#C0392B">7.8</span>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:78%;background:#C0392B"></div></div>
        </div>
        <div class="ranking-item">
          <span class="rank-name">Vicentín</span>
          <span class="rank-score" style="color:#C0392B">7.2</span>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:72%;background:#C0392B"></div></div>
        </div>
        <div class="ranking-item">
          <span class="rank-name">Renova</span>
          <span class="rank-score" style="color:#B0863F">6.5</span>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:65%;background:#B0863F"></div></div>
        </div>
        <div class="ranking-item">
          <span class="rank-name">Bunge</span>
          <span class="rank-score" style="color:#B0863F">5.5</span>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:55%;background:#B0863F"></div></div>
        </div>
        <div class="ranking-item">
          <span class="rank-name">Cargill</span>
          <span class="rank-score" style="color:#4E9978">4.2</span>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:42%;background:#4E9978"></div></div>
        </div>
      </div>

      <div class="disclaimer">ICE: 0 = sin violencia detectada, 10 = violencia extrema. Fuente: Reportes Gremiales, Clipping, Balances, Discursos.</div>

      <div class="chat-bar" data-action="chat-ve">
        <span class="chat-bar-icon">💬</span>
        <span class="chat-bar-text">¿Qué comportamiento observaste?</span>
        <span class="chat-bar-arrow">→</span>
      </div>
    `;
  }

  // ===== TAB: SMVM =====
  _renderSMVM() {
    return html`
      <div class="section-title" style="margin-bottom:4px">Salario Mínimo Vital y Móvil</div>
      <div class="intro">Dos conceptos se llaman "salario mínimo" pero no son lo mismo. La brecha entre ambos es super-explotación.</div>

      <div class="intro" style="font-size:.72rem;color:var(--ho-text-light,#9C988D)">Valor vs. Precio. LCT Art. 116 = 9 necesidades. El Estado fija un precio (negociado políticamente), no un valor. Precio < Valor = super-explotación.</div>

      <div class="kicker">LAS 9 NECESIDADES — LCT ART. 116</div>
      <div class="needs-grid">
        <div class="need-item"><div class="need-emoji">🏠</div><div class="need-name">Vivienda digna</div></div>
        <div class="need-item"><div class="need-emoji">🍽️</div><div class="need-name">Alimentación</div></div>
        <div class="need-item"><div class="need-emoji">🏥</div><div class="need-name">Asistencia sanitaria</div></div>
        <div class="need-item"><div class="need-emoji">📚</div><div class="need-name">Educación</div></div>
        <div class="need-item"><div class="need-emoji">👔</div><div class="need-name">Vestuario</div></div>
        <div class="need-item"><div class="need-emoji">🚌</div><div class="need-name">Transporte</div></div>
        <div class="need-item"><div class="need-emoji">🎭</div><div class="need-name">Esparcimiento</div></div>
        <div class="need-item"><div class="need-emoji">🏖️</div><div class="need-name">Vacaciones</div></div>
        <div class="need-item"><div class="need-emoji">🛡️</div><div class="need-name">Previsión</div></div>
      </div>

      <div class="kicker">PRECIO VS. VALOR — JUNIO 2026</div>
      <div class="level-card">
        <div class="level-label">SMVM legal · precio</div>
        <div class="level-amount">$340.000</div>
        <div class="level-desc">Lo que fija el Estado</div>
        <div class="level-pct pct-red">12% del valor real</div>
      </div>
      <div class="level-card">
        <div class="level-label">Canasta Básica Total · INDEC</div>
        <div class="level-amount">$800.000+</div>
        <div class="level-desc">Lo que INDEC dice que necesitás para no ser pobre</div>
        <div class="level-pct pct-gold">42% de la línea de pobreza</div>
      </div>
      <div class="level-card">
        <div class="level-label">SMVM según Aceiteros · valor</div>
        <div class="level-amount">~$2,8 M</div>
        <div class="level-desc">Lo que la Constitución/LCT manda (9 necesidades)</div>
        <div class="level-pct pct-green">100% del valor constitucional</div>
      </div>

      <div class="disclaimer">SMVM legal cubre solo 12% del valor real — y 42% de la línea de pobreza.</div>

      <div class="kicker" style="margin-top:12px">INGRESO MÍNIMO DE PARITARIA — POR SECTOR</div>
      <div class="data-card">
        <div class="breakdown">
          <div class="breakdown-item">
            <span class="bd-label">⛽ Petrolera CCT 1/75</span>
            <span class="bd-value">$520K</span>
            <span class="sector-pct" style="color:#4E9978">19%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🫘 Aceitera CCT 420/05</span>
            <span class="bd-value">$490K</span>
            <span class="sector-pct" style="color:#4E9978">18%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🏦 Bancaria CCT 18/75</span>
            <span class="bd-value">$450K</span>
            <span class="sector-pct" style="color:#4E9978">16%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🚛 Camioneros</span>
            <span class="bd-value">$420K</span>
            <span class="sector-pct" style="color:#80CCA0">15%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🔧 Metalúrgica</span>
            <span class="bd-value">$380K</span>
            <span class="sector-pct" style="color:#B0863F">14%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🏗️ Construcción</span>
            <span class="bd-value">$370K</span>
            <span class="sector-pct" style="color:#B0863F">13%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🏛️ Estatal</span>
            <span class="bd-value">$340K</span>
            <span class="sector-pct" style="color:#B0863F">12%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🛒 Comercio</span>
            <span class="bd-value">$310K</span>
            <span class="sector-pct" style="color:#C0392B">11%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🧵 Textil CCT 63/75</span>
            <span class="bd-value">$220K</span>
            <span class="sector-pct" style="color:#C0392B">8%</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">📱 Uberizado/plataforma</span>
            <span class="bd-value" style="color:#C0392B">~$180K</span>
            <span class="sector-pct" style="color:#C0392B">6%</span>
          </div>
        </div>
        <div class="intro" style="font-size:.68rem;margin-top:4px;margin-bottom:0">Líneas de referencia: SMVM constitucional ~$2,8M (100%) · CBT $800K+ (29%) · SMVM legal $340K (12%)</div>
      </div>

      <div class="chat-bar" data-action="chat-smvm">
        <span class="chat-bar-icon">💬</span>
        <span class="chat-bar-text">Preguntá sobre el SMVM</span>
        <span class="chat-bar-arrow">→</span>
      </div>
    `;
  }

  // ===== TAB: IFT =====
  _renderIFT() {
    return html`
      <div class="section-title" style="margin-bottom:4px">Índice de Felicidad Laboral</div>
      <div class="intro">IFT = SMVM × ICE. La felicidad laboral se construye cruzando el salario mínimo con el comportamiento empresarial. Si el salario no cubre la canasta y la empresa te violenta — la felicidad es negativa.</div>

      <div class="formula">
        <div class="formula-text">IFT = SMVM × ICE</div>
      </div>

      <div class="stripe-card smvm">
        <div class="sc-title">SMVM × ICE → IFT</div>
        <div class="sc-desc">Si tu salario no cubre la canasta, no hay felicidad laboral — sin importar lo que haga la empresa. El salario es piso, el comportamiento empresarial es techo.</div>
        <div class="sc-conn">IFT = lo que sostiene × lo que daña</div>
      </div>

      <div class="stripe-card comos">
        <div class="sc-title">SMVM × Cómo Somos</div>
        <div class="sc-desc">¿Quién cobra debajo del mínimo? Tercerizados, uberizados, estatales congelados — la brecha no es igual para todos.</div>
        <div class="sc-conn">IFT × clase = quién sufre más</div>
      </div>

      <div class="kicker" style="margin-top:12px">6 DIMENSIONES DEL IFT</div>
      <div class="data-card">
        <div class="breakdown">
          <div class="breakdown-item">
            <span class="bd-label">🏭 Condiciones materiales</span>
            <span class="bd-desc">Salario, estabilidad, equipamiento</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">⏰ Tiempo propio</span>
            <span class="bd-desc">Jornada, descanso, vacaciones</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">❤️ Salud</span>
            <span class="bd-desc">Ambiente, riesgo, salud mental</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">✊ Capacidad organizativa</span>
            <span class="bd-desc">Sindicato, asamblea, derechos</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🤝 Pertenencia</span>
            <span class="bd-desc">Reconocimiento, identidad, comunidad</span>
          </div>
          <div class="breakdown-item">
            <span class="bd-label">🌅 Futuro</span>
            <span class="bd-desc">Capacitación, carrera, perspectiva</span>
          </div>
        </div>
      </div>

      <div class="chat-bar" data-action="chat-ift">
        <span class="chat-bar-icon">💬</span>
        <span class="chat-bar-text">Preguntá sobre la felicidad laboral</span>
        <span class="chat-bar-arrow">→</span>
      </div>
    `;
  }

  _afterRender() {
    // Tab buttons
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('tab', btn.dataset.tab);
        this.set('expandedId', '');
      });
    });

    // Grid cards in panorama tab — navigate to sub-tab
    this.shadowRoot.querySelectorAll('.grid-card').forEach(card => {
      card.addEventListener('click', () => {
        this.set('tab', card.dataset.tab);
      });
    });

    // ICE dimension cards — expand
    this.shadowRoot.querySelectorAll('.ice-card').forEach(card => {
      card.addEventListener('click', () => {
        var id = card.dataset.expand;
        this.set('expandedId', this.expandedId === id ? '' : id);
      });
    });

    // Chat bars — navigate to chat with pre-query
    this.shadowRoot.querySelectorAll('.chat-bar').forEach(bar => {
      bar.addEventListener('click', () => {
        var action = bar.dataset.action;
        var queries = {
          'chat-como-somos': 'Quiero explorar los datos de la clase trabajadora argentina',
          'chat-ve': 'Quiero analizar el comportamiento empresarial que observé',
          'chat-smvm': 'Quiero entender la brecha entre el SMVM legal y el valor real',
          'chat-ift': 'Quiero analizar la felicidad laboral en mi sector',
        };
        this.emit('screen-change', { screen: 'consulta', persona: 'abogado', preQuery: queries[action] || '' });
      });
    });
  }
}

customElements.define('hornero-condicion', HorneroCondicion);
