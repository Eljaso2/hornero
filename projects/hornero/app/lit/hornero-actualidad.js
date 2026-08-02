// ===== <hornero-actualidad> — Esfera Actualidad =====
// Banner + Explorar + Cintillo + sub-vistas (Clipping, InfoMate, Informe Sindical)
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroActualidad extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      activeSubView: String,   // '' | 'clipping' | 'infomate' | 'sindical'
      clipEdicion: Number,     // clipping edition number
      mateMes: String,         // infomate edition mes
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.activeSubView = '';
    this.clipEdicion = null;
    this.mateMes = null;

    // Internal state
    this._bannerVisible = true;
    this._exploreOpen = false;
    this._ediciones = [];      // all clipping editions from index
    this._clippingData = {};   // loaded clipping data per edition (keyed by numero)
    this._mateEdiciones = [];  // all mate editions from index
    this._mateData = {};       // loaded mate data per edition (keyed by mes)
    this._allItems = [];       // merged + sorted by date: [{type, fecha, ...}]

    // Sub-view state
    this._clipIdx = 0;         // current clipping edition index
    this._mateIdx = 0;         // current mate edition index
    this._sindicalInformes = []; // published informes for Informe Sindical
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadAllSources();

    // If an initial sub-view was set, activate it
    if (this.activeSubView) {
      this._activateSubView(this.activeSubView);
    }

    this.render();
  }

  // ===== Data loading =====

  async _loadAllSources() {
    // Clipping — load all editions from index
    try {
      const idxRes = await fetch('data/clipping-index.json');
      const idx = await idxRes.json();
      this._ediciones = idx.ediciones || [];

      for (const ed of this._ediciones) {
        try {
          const res = await fetch(ed.archivo);
          const data = await res.json();
          this._clippingData[ed.numero] = data;
          if (typeof guardarClipping === 'function' && data.noticias) {
            for (const item of data.noticias) {
              await guardarClipping(item);
            }
          }
        } catch(e) { console.warn('Actualidad: edition ' + ed.numero + ' load failed', e); }
      }
    } catch(e) { console.warn('Actualidad: clipping index load failed', e); }

    // InfoMate — load all editions from index
    try {
      const mateIdxRes = await fetch('data/mate-index.json');
      const mateIdx = await mateIdxRes.json();
      this._mateEdiciones = mateIdx.ediciones || [];

      for (const ed of this._mateEdiciones) {
        try {
          const res = await fetch(ed.archivo);
          const data = await res.json();
          this._mateData[ed.mes] = data;
        } catch(e) { console.warn('Actualidad: mate edition ' + ed.mes + ' load failed', e); }
      }
    } catch(e) { console.warn('Actualidad: mate index load failed', e); }

    // Load published informes for Informe Sindical
    await this._loadSindicalInformes();

    // Build merged timeline sorted by date (newest first)
    this._buildTimeline();
  }

  async _loadSindicalInformes() {
    // Load informes from IndexedDB (grade 3/4 approved reports)
    try {
      if (typeof obtenerInformesAprobados === 'function') {
        this._sindicalInformes = await obtenerInformesAprobados();
      } else if (typeof obtenerChatSessions === 'function') {
        // Fallback: get all gremial sessions and filter for informes
        const sessions = await obtenerChatSessions();
        const gremialSessions = sessions.filter(s => s.section === 'reporte');
        this._sindicalInformes = gremialSessions.map(s => ({
          id: s.sessionId,
          title: s.title || 'Informe gremial',
          fecha: s.fecha || s.lastMessage || '',
          grade: s.grade || '',
        }));
      }
    } catch(e) { console.warn('Actualidad: sindical informes load failed', e); }
  }

  _buildTimeline() {
    const items = [];

    // Clipping items
    for (const ed of this._ediciones) {
      items.push({ type: 'clipping', fecha: ed.fecha, ed: ed });
    }

    // InfoMate items
    for (const ed of this._mateEdiciones) {
      items.push({ type: 'infomate', fecha: ed.fecha, ed: ed });
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    this._allItems = items;
  }

  _formatMes(mesStr) {
    if (!mesStr) return '';
    const parts = mesStr.split('-');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return months[parseInt(parts[1]) - 1] + ' ' + parts[0];
  }

  _formatFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Normalize tag: lowercase unless it's a known acronym or proper noun
  _normalizeTag(tag) {
    const acronyms = ['CGT','CTA','OIT','CONICET','INTI','INTA','INDEC','SMVM','CLATE','CAREM','UEJN','IPYPP',
      'UTEP','FAdeA','GNL','RIGI','ILVA','Sitrarepa','CABA','CLATE','IA'];
    const properNouns = ['Córdoba','Neuquén','Patagonia','Cutral-Co','Chapadmalal','Embalse','Daer','Vidal','Fate','YPF'];
    if (acronyms.includes(tag)) return tag;
    if (properNouns.includes(tag)) return tag;
    return tag.toLowerCase();
  }

  // ===== Sub-view management =====

  _activateSubView(subView) {
    this._bannerVisible = false;
    this._exploreOpen = false;

    if (subView === 'clipping') {
      // Set clipping index to the requested edition or latest
      if (this.clipEdicion) {
        this._clipIdx = this._ediciones.findIndex(ed => ed.numero === this.clipEdicion);
        if (this._clipIdx < 0) this._clipIdx = 0;
      } else {
        this._clipIdx = 0;
      }
      this.activeSubView = 'clipping';
    } else if (subView === 'infomate') {
      if (this.mateMes) {
        this._mateIdx = this._mateEdiciones.findIndex(ed => ed.mes === this.mateMes);
        if (this._mateIdx < 0) this._mateIdx = 0;
      } else {
        this._mateIdx = 0;
      }
      this.activeSubView = 'infomate';
    } else if (subView === 'sindical') {
      this.activeSubView = 'sindical';
    }
  }

  _deactivateSubView() {
    this.activeSubView = '';
    this._bannerVisible = true;
    this._exploreOpen = false;
    this.clipEdicion = null;
    this.mateMes = null;
  }

  // ===== Cintillo data =====

  _getCintilloTitle() {
    if (this.activeSubView === 'clipping') {
      const ed = this._ediciones[this._clipIdx];
      return ed ? 'CLIPPING N°' + ed.numero : 'CLIPPING';
    } else if (this.activeSubView === 'infomate') {
      return 'INFOMATE';
    } else if (this.activeSubView === 'sindical') {
      return 'INFORME SINDICAL';
    }
    return '';
  }

  _getCintilloDate() {
    if (this.activeSubView === 'clipping') {
      const ed = this._ediciones[this._clipIdx];
      return ed ? this._formatFecha(ed.fecha) : '';
    } else if (this.activeSubView === 'infomate') {
      const ed = this._mateEdiciones[this._mateIdx];
      return ed ? this._formatMes(ed.mes) : '';
    } else if (this.activeSubView === 'sindical') {
      return '';
    }
    return '';
  }

  _hasPrevEdition() {
    if (this.activeSubView === 'clipping') return this._clipIdx < this._ediciones.length - 1;
    if (this.activeSubView === 'infomate') return this._mateIdx < this._mateEdiciones.length - 1;
    return false;
  }

  _hasNextEdition() {
    if (this.activeSubView === 'clipping') return this._clipIdx > 0;
    if (this.activeSubView === 'infomate') return this._mateIdx > 0;
    return false;
  }

  _goPrevEdition() {
    if (this.activeSubView === 'clipping' && this._hasPrevEdition()) {
      this._clipIdx++;
      this.render();
    } else if (this.activeSubView === 'infomate' && this._hasPrevEdition()) {
      this._mateIdx++;
      this.render();
    }
  }

  _goNextEdition() {
    if (this.activeSubView === 'clipping' && this._hasNextEdition()) {
      this._clipIdx--;
      this.render();
    } else if (this.activeSubView === 'infomate' && this._hasNextEdition()) {
      this._mateIdx--;
      this.render();
    }
  }

  // ===== Styles =====

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }

      /* ===== Hero banner — copiado de hornero-condicion.js ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-dark, #1E2321);
        padding: 14px 16px 10px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 8px;
        flex-shrink: 0; box-sizing: border-box; }
      .hero-banner::before { content: ''; position: absolute; top: 0; left: 0;
        width: 100%; height: 100%;
        background: url('assets/actualidad-bg.png') top center/cover no-repeat;
        opacity: .12; pointer-events: none; }
      .hero-banner.collapsed { padding: 10px 16px 8px; min-height: 0; gap: 6px; }
      .hero-banner.collapsed .hero-banner-title { font-size: 1.2rem; }
      .hero-banner.collapsed .hero-explore-link { font-size: .64rem; }
      .hero-banner-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.4rem; color: var(--ho-text, #E8E6E0);
        letter-spacing: .02em; text-transform: uppercase; position: relative; }
      :host(.theme-light) .hero-banner-title { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .hero-banner { background: var(--ho-mid-gray, #ECEAE3); }
      :host(.theme-light) .hero-bajada { color: var(--ho-text-light, #7A766C); }
      .hero-bajada { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        text-align: left; min-height: 3.2em; }

      /* ===== Explorar dropdown ===== */
      .hero-explore-link { display: inline-flex; align-items: center; gap: 4px;
        font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 700; letter-spacing: .04em;
        color: #000; background: none;
        border: none; padding: 0; cursor: pointer; position: relative;
        transition: color .2s; }
      .hero-explore-link:hover { color: #333; }
      .hero-explore-link::after { content: '▾'; font-size: .58rem; margin-left: 2px; }
      .hero-explore-link.open::after { content: '▴'; }
      .hero-explore-panel { display: flex; flex-wrap: wrap; gap: 6px;
        margin-top: 2px; animation: exploreFade .2s ease;
        position: relative; }
      @keyframes exploreFade { from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: none; } }
      .hero-explore-option { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0);
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
        border-radius: 8px; padding: 6px 12px; cursor: pointer;
        transition: background .2s, border-color .2s; }
      .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .hero-explore-option { background: rgba(0,0,0,.04);
        border-color: rgba(0,0,0,.08); }
      :host(.theme-light) .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB); }

      /* ===== Cintillo — navegación de sub-vista ===== */
      .act-cintillo { display: flex; align-items: center; gap: 8px;
        padding: 8px 12px; border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08));
        flex-shrink: 0; background: var(--ho-bg, #1E2321); }
      .cintillo-back-btn { width: 28px; height: 28px; border-radius: 50%;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: none; cursor: pointer; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0;
        transition: background .2s, border-color .2s; }
      .cintillo-back-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .cintillo-back-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .cintillo-back-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .cintillo-center { flex: 1; text-align: center; }
      .cintillo-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.06rem; color: var(--ho-green-dark, #3D6B56);
        letter-spacing: .04em; }
      .cintillo-date { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .08em; margin-top: 2px; }
      .cintillo-nav-btn { background: none; border: none; cursor: pointer;
        color: var(--ho-text-mid, #6E6A60); padding: 6px;
        transition: color .2s, opacity .2s; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0; }
      .cintillo-nav-btn:hover { color: var(--ho-text, #E8E6E0); }
      .cintillo-nav-btn:disabled { opacity: .2; cursor: default; }
      .cintillo-nav-btn svg { width: 20px; height: 20px; }

      /* ===== Content area ===== */
      .content-area { flex: 1; display: flex; flex-direction: column; min-height: 0;
        overflow: hidden; }

      /* ===== Feed (sin sub-vista) ===== */
      .scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 12px 16px 16px; scrollbar-width: none; }
      .scroll::-webkit-scrollbar { width: 0; }

      /* Feed card — foto de fondo con overlay semi-opaco */
      .feed-card { border-radius: 13px; margin-bottom: 10px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230); cursor: pointer;
        transition: border-color .2s; position: relative; }
      .feed-card:hover { border-color: var(--ho-green, #4E9978); }
      .feed-card-img { position: absolute; inset: 0;
        width: 100%; height: 100%; object-fit: cover; display: block; z-index: 0; }
      .feed-card-dim { position: absolute; inset: 0; z-index: 1;
        background: rgba(30,35,33,.6); }
      .feed-card-overlay { position: relative; z-index: 2;
        padding: 14px; color: #F2F1EC; }
      .feed-card-label { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.06rem; letter-spacing: .02em; text-transform: uppercase; }
      .feed-card-sublabel { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: rgba(242,241,236,.7); letter-spacing: .06em; margin-top: 2px; }
      .feed-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
      .photo-tag { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        background: rgba(78,153,120,.7); color: #F2F1EC;
        padding: 2px 6px; border-radius: 4px; font-weight: 600;
        white-space: nowrap; backdrop-filter: blur(4px); }
      .feed-card-no-photo .feed-card-dim { display: none; }
      .feed-card-no-photo .feed-card-overlay { color: var(--ho-text, #E8E6E0); }
      .feed-card-no-photo .feed-card-sublabel { color: var(--ho-text-mid, #6E6A60); }
      .feed-card-no-photo .photo-tag {
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        backdrop-filter: none; }
      .noticia-list { margin-top: 8px; padding: 0 14px 10px; }
      .noticia-line { display: flex; align-items: baseline; gap: 4px; padding: 3px 0; }
      .noticia-emoji { font-size: .78rem; }
      .noticia-title { font-family: 'Public Sans', sans-serif; font-size: .84rem;
        color: var(--ho-text, #E8E6E0); line-height: 1.3; font-weight: 500; flex: 1; }
      .noticia-toggle { font-family: 'JetBrains Mono', monospace; font-size: .64rem;
        color: var(--ho-green, #4E9978); cursor: pointer;
        padding: 4px 14px 10px; letter-spacing: .06em;
        font-weight: 600; user-select: none; transition: color .2s; }
      .noticia-toggle:hover { color: var(--ho-green-dark, #3D6B56); }

      /* ===== Sub-view: Clipping noticia cards ===== */
      .sub-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        padding: 0 16px 16px; scrollbar-width: none; }
      .sub-scroll::-webkit-scrollbar { width: 0; }
      .clip-card { border-radius: 12px; margin-bottom: 8px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230); cursor: pointer;
        transition: border-color .2s; }
      .clip-card:hover { border-color: var(--ho-green, #4E9978); }
      .clip-card-img { width: 100%; height: 140px; object-fit: cover; display: block; }
      .clip-card-body { padding: 10px 12px; }
      .clip-card-fecha { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .06em; }
      .clip-card-source { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        color: var(--ho-green, #4E9978); margin-left: 8px; }
      .clip-card-titulo { font-family: 'Public Sans', sans-serif; font-size: .9rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0); line-height: 1.3;
        margin-top: 4px; }
      .clip-card-bajada { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4; margin-top: 4px; }
      .clip-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }

      /* ===== Sub-view: InfoMate ===== */
      .macro-block { margin-bottom: 12px; }
      .macro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .macro-card { background: var(--ho-card, #2A3230); border-radius: 8px;
        padding: 8px 10px; border: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .macro-key { font-family: 'JetBrains Mono', monospace; font-size: .52rem;
        color: var(--ho-text-mid, #6E6A60); letter-spacing: .06em;
        text-transform: uppercase; }
      .macro-val { font-family: 'Archivo', sans-serif; font-size: .82rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); margin-top: 2px; }

      /* ===== Sub-view: Informe Sindical ===== */
      .sindical-card { border-radius: 12px; margin-bottom: 8px; overflow: hidden;
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        background: var(--ho-card, #2A3230); cursor: pointer;
        padding: 12px 14px; transition: border-color .2s; }
      .sindical-card:hover { border-color: var(--ho-green, #4E9978); }
      .sindical-card-title { font-family: 'Public Sans', sans-serif; font-size: .9rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0); line-height: 1.3; }
      .sindical-card-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-mid, #6E6A60); margin-top: 4px; }
      .sindical-empty { padding: 40px 16px; text-align: center;
        font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); }
    `;
  }

  // ===== Render =====

  _render() {
    return html`
      <div class="hero-banner${this._bannerVisible ? '' : ' collapsed'}">
        <div class="hero-banner-title">Actualidad</div>
        ${this._bannerVisible ? html`
        <div class="hero-bajada" style="position:relative">
          Noticias, datos e informes sindicales para la organización y la lucha.
        </div>
        ` : ''}
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="clipping">Clipping</button>
          <button class="hero-explore-option" data-explore="infomate">InfoMate</button>
          <button class="hero-explore-option" data-explore="sindical">Informe Sindical</button>
        </div>
        ` : ''}
      </div>

      ${this.activeSubView ? html`
      <div class="act-cintillo">
        <button class="cintillo-back-btn" id="cintilloBack" title="Volver">
          <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <button class="cintillo-nav-btn" id="cintilloPrev" ${!this._hasPrevEdition() ? 'disabled' : ''} title="Anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="cintillo-center">
          <div class="cintillo-title">${this._getCintilloTitle()}</div>
          ${this._getCintilloDate() ? html`<div class="cintillo-date">${this._getCintilloDate()}</div>` : ''}
        </div>
        <button class="cintillo-nav-btn" id="cintilloNext" ${!this._hasNextEdition() ? 'disabled' : ''} title="Siguiente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      ` : ''}

      <div class="content-area">
        ${this.activeSubView ? this._renderSubViewContent() : this._renderFeed()}
      </div>
    `;
  }

  _renderFeed() {
    let cardsHtml = '';
    for (const item of this._allItems) {
      if (item.type === 'clipping') {
        cardsHtml += this._renderClippingCard(item.ed);
      } else if (item.type === 'infomate') {
        cardsHtml += this._renderInfomateCard(item.ed);
      }
    }
    return html`<div class="scroll">${cardsHtml}</div>`;
  }

  _renderSubViewContent() {
    if (this.activeSubView === 'clipping') {
      return this._renderClippingSubView();
    } else if (this.activeSubView === 'infomate') {
      return this._renderInfoMateSubView();
    } else if (this.activeSubView === 'sindical') {
      return this._renderSindicalSubView();
    }
    return html`<div class="scroll"></div>`;
  }

  // ===== Sub-view: Clipping =====

  _renderClippingSubView() {
    const ed = this._ediciones[this._clipIdx];
    if (!ed) return html`<div class="scroll"><div class="sindical-empty">No hay ediciones de Clipping.</div></div>`;

    const data = this._clippingData[ed.numero];
    if (!data || !data.noticias) return html`<div class="scroll"><div class="sindical-empty">Cargando...</div></div>`;

    let cardsHtml = '';
    for (const n of data.noticias) {
      const tagsHtml = (n.tags || []).slice(0, 6).map(t =>
        '<span class="photo-tag">' + this._normalizeTag(t) + '</span>'
      ).join('');

      cardsHtml += '<div class="clip-card">' +
        (n.foto ? '<img class="clip-card-img" src="' + n.foto + '" alt="" loading="lazy">' : '') +
        '<div class="clip-card-body">' +
          '<span class="clip-card-fecha">' + this._formatFecha(n.fecha || ed.fecha) + '</span>' +
          (n.fuente ? '<span class="clip-card-source">📰 ' + n.fuente + '</span>' : '') +
          (n.emoji ? ' <span>' + n.emoji + '</span>' : '') +
          '<div class="clip-card-titulo">' + (n.titulo || '') + '</div>' +
          (n.bajada ? '<div class="clip-card-bajada">' + n.bajada + '</div>' : '') +
          (tagsHtml ? '<div class="clip-card-tags">' + tagsHtml + '</div>' : '') +
        '</div>' +
      '</div>';
    }

    return html`<div class="sub-scroll">${cardsHtml}</div>`;
  }

  // ===== Sub-view: InfoMate =====

  _renderInfoMateSubView() {
    const ed = this._mateEdiciones[this._mateIdx];
    if (!ed) return html`<div class="scroll"><div class="sindical-empty">No hay ediciones de InfoMate.</div></div>`;

    const data = this._mateData[ed.mes];
    if (!data) return html`<div class="scroll"><div class="sindical-empty">Cargando...</div></div>`;

    // Macro grid
    let macroHtml = '';
    if (data.datosMacro) {
      const macroLabels = {
        inflacionOficial: 'Inflación oficial',
        inflacionAcumulada: 'Inflación acumulada',
        inflacionObrera: 'Inflación obrera',
        smvm: 'SMVM',
        salarioMedioRegistrado: 'Salario medio',
        canastaBasicaTotal: 'Canasta básica',
        empleoTotal: 'Empleo',
        salarioEstatal: 'Salario estatal',
        salarioPrivado: 'Salario privado',
        transferenciaIngresos: 'Transferencia',
        empleosFormalesPerdidos: 'Empleos perdidos',
        desocupadosUrbanos: 'Desocupados',
        informalidad: 'Informalidad',
        recortesAcumulados: 'Recortes',
        ejercitoActivo: 'Ejército activo',
        reservaFlotante: 'Reserva flotante',
        reservaLatente: 'Reserva latente',
        pauperizacion: 'Pauperización',
      };
      let macroCards = '';
      for (const [key, val] of Object.entries(data.datosMacro)) {
        const label = macroLabels[key] || key;
        macroCards += '<div class="macro-card">' +
          '<div class="macro-key">' + label + '</div>' +
          '<div class="macro-val">' + val + '</div>' +
        '</div>';
      }
      macroHtml = '<div class="macro-block"><div class="macro-grid">' + macroCards + '</div></div>';
    }

    // Section cards
    let cardsHtml = '';
    if (data.secciones) {
      for (const s of data.secciones) {
        const tagsHtml = (s.tags || []).slice(0, 6).map(t =>
          '<span class="photo-tag">' + this._normalizeTag(t) + '</span>'
        ).join('');

        cardsHtml += '<div class="clip-card">' +
          (s.foto ? '<img class="clip-card-img" src="' + s.foto + '" alt="" loading="lazy">' : '') +
          '<div class="clip-card-body">' +
            '<div class="clip-card-titulo">' + (s.titulo || '') + '</div>' +
            (s.bajada ? '<div class="clip-card-bajada">' + s.bajada + '</div>' : '') +
            (tagsHtml ? '<div class="clip-card-tags">' + tagsHtml + '</div>' : '') +
          '</div>' +
        '</div>';
      }
    }

    return html`<div class="sub-scroll">${macroHtml}${cardsHtml}</div>`;
  }

  // ===== Sub-view: Informe Sindical =====

  _renderSindicalSubView() {
    if (!this._sindicalInformes || this._sindicalInformes.length === 0) {
      return html`<div class="scroll"><div class="sindical-empty">No hay informes sindicales publicados todavía. Los informes de grado 3 y 4 aparecerán aquí cuando el sindicato los apruebe.</div></div>`;
    }

    let cardsHtml = '';
    for (const inf of this._sindicalInformes) {
      cardsHtml += '<div class="sindical-card" data-informe-id="' + (inf.id || '') + '">' +
        '<div class="sindical-card-title">' + (inf.title || 'Informe gremial') + '</div>' +
        '<div class="sindical-card-meta">' +
          (inf.fecha ? this._formatFecha(inf.fecha) : '') +
          (inf.grade ? ' · Grado ' + inf.grade : '') +
        '</div>' +
      '</div>';
    }

    return html`<div class="sub-scroll">${cardsHtml}</div>`;
  }

  // ===== Feed card rendering (same as before) =====

  _renderClippingCard(ed) {
    const data = this._clippingData[ed.numero];
    const label = 'CLIPPING N°' + ed.numero;
    const sublabel = this._formatFecha(ed.fecha);

    const firstNoticia = data && data.noticias && data.noticias.length > 0 ? data.noticias[0] : null;
    const foto = firstNoticia ? firstNoticia.foto : null;
    const hasFoto = !!foto;

    let tagsHtml = '';
    if (data && data.noticias && data.noticias.length > 0) {
      const allTags = [];
      for (const n of data.noticias) {
        if (n.tags) {
          for (const t of n.tags) {
            if (!allTags.includes(t)) allTags.push(this._normalizeTag(t));
          }
        }
      }
      const shownTags = allTags.slice(0, 12);
      tagsHtml = shownTags.map(t => '<span class="photo-tag">' + t + '</span>').join('');
    }

    let noticiaList = '';
    const totalNoticias = (data && data.noticias) ? data.noticias.length : 0;
    if (totalNoticias > 0) {
      noticiaList = '<div class="noticia-list" style="display:none">';
      for (const n of data.noticias) {
        noticiaList += '<div class="noticia-line">' +
          (n.emoji ? '<span class="noticia-emoji">' + n.emoji + '</span>' : '') +
          '<span class="noticia-title">' + (n.titulo || '') + '</span>' +
        '</div>';
      }
      noticiaList += '</div>';
    }

    const toggleText = totalNoticias > 0 ? '▾ Ver ' + totalNoticias + ' títulos' : '';
    const noPhotoClass = hasFoto ? '' : ' feed-card-no-photo';

    return '<div class="feed-card' + noPhotoClass + '" data-screen="clipping" data-clip-edicion="' + ed.numero + '">' +
      (hasFoto ? '<img class="feed-card-img" src="' + foto + '" alt="" loading="lazy"><div class="feed-card-dim"></div>' : '') +
      '<div class="feed-card-overlay">' +
        '<div class="feed-card-label">' + label + '</div>' +
        '<div class="feed-card-sublabel">' + sublabel + '</div>' +
        (tagsHtml ? '<div class="feed-card-tags">' + tagsHtml + '</div>' : '') +
      '</div>' +
      noticiaList +
      (toggleText ? '<div class="noticia-toggle" data-expanded="false" data-card-type="clipping" data-clip-edicion="' + ed.numero + '">' + toggleText + '</div>' : '') +
    '</div>';
  }

  _renderInfomateCard(ed) {
    const mateRaw = this._mateData[ed.mes];
    const mateLabel = 'INFOMATE';
    const mateSublabel = this._formatMes(ed.mes);

    const firstSection = mateRaw && mateRaw.secciones && mateRaw.secciones.length > 0 ? mateRaw.secciones[0] : null;
    const foto = firstSection ? firstSection.foto : null;
    const hasFoto = !!foto;

    let tagsHtml = '';
    if (mateRaw) {
      const mateTags = [];
      if (mateRaw.secciones) {
        for (const s of mateRaw.secciones) {
          mateTags.push(s.titulo.toLowerCase());
        }
      }
      const macroLabels = {
        inflacionOficial: 'inflación oficial', inflacionAcumulada: 'inflación acumulada',
        inflacionObrera: 'inflación obrera', smvm: 'SMVM',
        salarioMedioRegistrado: 'salario medio', canastaBasicaTotal: 'canasta básica',
        empleoTotal: 'empleo', salarioEstatal: 'salario estatal',
        salarioPrivado: 'salario privado', transferenciaIngresos: 'transferencia',
        empleosFormalesPerdidos: 'empleos perdidos', desocupadosUrbanos: 'desocupados',
        informalidad: 'informalidad', recortesAcumulados: 'recortes',
        ejercitoActivo: 'ejército activo', reservaFlotante: 'reserva flotante',
        reservaLatente: 'reserva latente', pauperizacion: 'pauperización',
      };
      if (mateRaw.datosMacro) {
        for (const k of Object.keys(mateRaw.datosMacro)) {
          mateTags.push(macroLabels[k] || this._normalizeTag(k));
        }
      }
      const shownTags = mateTags.slice(0, 12);
      tagsHtml = shownTags.map(t => '<span class="photo-tag">' + t + '</span>').join('');
    }

    let mateSectionsHtml = '';
    const totalSections = mateRaw && mateRaw.secciones ? mateRaw.secciones.length : 0;
    if (totalSections > 0) {
      mateSectionsHtml = '<div class="mate-sections noticia-list" style="display:none">';
      for (const s of mateRaw.secciones) {
        mateSectionsHtml += '<div class="noticia-line"><span class="noticia-title">' + s.titulo + '</span></div>';
      }
      mateSectionsHtml += '</div>';
    }

    const mateToggleText = totalSections > 0 ? '▾ Ver ' + totalSections + ' secciones' : '';
    const noPhotoClass = hasFoto ? '' : ' feed-card-no-photo';

    return '<div class="feed-card' + noPhotoClass + '" data-screen="infomate" data-mate-mes="' + ed.mes + '">' +
      (hasFoto ? '<img class="feed-card-img" src="' + foto + '" alt="" loading="lazy"><div class="feed-card-dim"></div>' : '') +
      '<div class="feed-card-overlay">' +
        '<div class="feed-card-label">' + mateLabel + '</div>' +
        '<div class="feed-card-sublabel">' + mateSublabel + '</div>' +
        (tagsHtml ? '<div class="feed-card-tags">' + tagsHtml + '</div>' : '') +
      '</div>' +
      mateSectionsHtml +
      (mateToggleText ? '<div class="noticia-toggle" data-expanded="false" data-card-type="infomate" data-mate-mes="' + ed.mes + '">' + mateToggleText + '</div>' : '') +
    '</div>';
  }

  // ===== After-render =====

  _afterRender() {
    // Explore toggle
    const exploreToggle = this.shadowRoot.querySelector('#exploreToggle');
    if (exploreToggle) {
      exploreToggle.addEventListener('click', () => {
        this._exploreOpen = !this._exploreOpen;
        this.render();
      });
    }

    // Explore options
    this.shadowRoot.querySelectorAll('.hero-explore-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const explore = btn.dataset.explore;
        this._exploreOpen = false;
        this._activateSubView(explore);
        this.render();
      });
    });

    // Cintillo back button
    const cintilloBack = this.shadowRoot.querySelector('#cintilloBack');
    if (cintilloBack) {
      cintilloBack.addEventListener('click', () => {
        this._deactivateSubView();
        this.render();
      });
    }

    // Cintillo prev/next
    const cintilloPrev = this.shadowRoot.querySelector('#cintilloPrev');
    if (cintilloPrev) {
      cintilloPrev.addEventListener('click', () => this._goPrevEdition());
    }
    const cintilloNext = this.shadowRoot.querySelector('#cintilloNext');
    if (cintilloNext) {
      cintilloNext.addEventListener('click', () => this._goNextEdition());
    }

    // Feed card clicks
    this.shadowRoot.querySelectorAll('.feed-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.noticia-toggle')) return;
        const screen = card.dataset.screen;
        const clipEdicion = card.dataset.clipEdicion;
        const mateMes = card.dataset.mateMes;
        if (screen === 'clipping' && clipEdicion) {
          this.clipEdicion = parseInt(clipEdicion);
          this._activateSubView('clipping');
          this.render();
        } else if (screen === 'infomate' && mateMes) {
          this.mateMes = mateMes;
          this._activateSubView('infomate');
          this.render();
        }
      });
    });

    // Toggle expand/collapse for noticia lists and mate sections
    this.shadowRoot.querySelectorAll('.noticia-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = toggle.dataset.expanded === 'true';
        const card = toggle.closest('.feed-card');
        const tagLines = card.querySelector('.feed-card-tags');
        const expandList = card.querySelector('.noticia-list, .mate-sections');
        const totalItems = expandList ? expandList.children.length : 0;
        const isMate = toggle.dataset.cardType === 'infomate';
        const itemLabel = isMate ? ' secciones' : ' títulos';

        if (expanded) {
          if (expandList) expandList.style.display = 'none';
          if (tagLines) tagLines.style.display = '';
          toggle.dataset.expanded = 'false';
          toggle.textContent = '▾ Ver ' + totalItems + itemLabel;
        } else {
          if (tagLines) tagLines.style.display = 'none';
          if (expandList) expandList.style.display = '';
          toggle.dataset.expanded = 'true';
          toggle.textContent = '▴ Ver menos';
        }
      });
    });
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
