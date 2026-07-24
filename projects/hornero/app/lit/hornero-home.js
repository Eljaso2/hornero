// ===== <hornero-home> — Pantalla inicio (rediseño v2) =====
// Esfera 1: Actualidad — carrusel noticias + agenda nube
// Esfera 2: Consulta — 3 íconos inline (Debate, Consulta, Contenido)
// Esferas 3-6: nombres simples sin marcos
// Esfera 4 (Comunicación interna): candado si usuario sin acceso

import { HoComponent, html, css } from './ho-component.js';

class HorneroHome extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      carouselIndex: Number,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.carouselIndex = 0;
    this._clipping = [];
    this._agenda = [];

    // Access map: open / grade / auth
    this.accessMap = {
      actualidad: 'open',
      consulta: 'open',
      formacion: 'open',
      is: 'grade',
      condicion: 'open',
      archivo: 'open',
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadData();
  }

  async _loadData() {
    try {
      const clipRes = await fetch('data/clipping-2026-07-02.json');
      const clipData = await clipRes.json();
      this._clipping = clipData.noticias || [];
    } catch(e) { console.warn('Home: clipping load failed', e); }

    try {
      const agendaRes = await fetch('data/agenda-2026-07.json');
      const agendaData = await agendaRes.json();
      this._agenda = agendaData.eventos || [];
    } catch(e) { console.warn('Home: agenda load failed', e); }

    this.render();
  }

  _hasAccess(screenId) {
    const access = this.accessMap[screenId] || 'open';
    if (access === 'open') return true;
    if (access === 'grade') return this.grade !== 'A';
    if (access === 'auth') return false;
    return true;
  }

  _styles() {
    return css`
      :host { display: block; }

      /* ===== Section name (replaces kicker) ===== */
      .esfera-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); margin-bottom: 10px; }

      /* ===== ESFERA 1: Actualidad — bloque grande ===== */
      .esfera-actualidad { margin-bottom: 20px; }

      /* --- News carousel --- */
      .carousel-wrap { position: relative; margin-bottom: 8px; border-radius: 13px;
        overflow: hidden; }
      .carousel-track { display: flex; overflow-x: auto;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; }
      .carousel-track::-webkit-scrollbar { width: 0; }
      .news-slide { scroll-snap-align: start; width: 100%; flex-shrink: 0;
        position: relative; min-height: 220px; background: var(--ho-dark, #33312D); }
      .news-slide img { width: 100%; height: 220px; object-fit: cover;
        display: block; }
      .news-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 40px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.85));
        color: var(--ho-text-off, #F2F1EC); }
      .news-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; line-height: 1.3; }
      .news-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .news-tag { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        background: rgba(110,131,69,.6); color: var(--ho-text-off, #F2F1EC);
        padding: 2px 6px; border-radius: 4px; font-weight: 600; }
      .news-emoji { font-size: 1.2rem; margin-right: 4px; }
      .carousel-dots { display: flex; justify-content: center; gap: 5px;
        padding: 8px 0; }
      .dot { width: 6px; height: 6px; border-radius: 50%;
        background: var(--ho-text-light, #9C988D); transition: background .2s; }
      .dot.active { background: var(--ho-green, #6E8345); }

      /* --- Agenda cloud --- */
      .agenda-wrap { margin-top: 4px; }
      .agenda-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; color: var(--ho-text-mid, #6E6A60); margin-bottom: 8px; }
      .agenda-cloud { display: flex; flex-wrap: wrap; align-items: center;
        gap: 6px 8px; }
      .agenda-bubble { font-family: 'Archivo', sans-serif; font-weight: 600;
        padding: 4px 10px; border-radius: 20px; cursor: pointer;
        transition: transform .2s; white-space: nowrap; }
      .agenda-bubble:hover { transform: scale(1.05); }
      .agenda-urgent { background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC);
        font-size: .82rem; }
      .agenda-soon { background: var(--ho-green-light, #94A867); color: var(--ho-text-off, #F2F1EC);
        font-size: .78rem; }
      .agenda-mid { background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        font-size: .74rem; }
      .agenda-far { background: var(--ho-warm-gray, #E6E3DB); color: var(--ho-text-mid, #6E6A60);
        font-size: .70rem; }

      /* ===== ESFERA 2: Consulta — 3 íconos inline ===== */
      .esfera-consulta { margin-bottom: 20px; }
      .consulta-icons { display: flex; justify-content: space-around; gap: 16px; }
      .icon-btn { display: flex; flex-direction: column; align-items: center;
        gap: 6px; background: none; border: none; cursor: pointer;
        padding: 12px 8px; font-family: 'Archivo', sans-serif;
        transition: opacity .2s; }
      .icon-btn:hover { opacity: .8; }
      .icon-btn svg { width: 32px; height: 32px; stroke: var(--ho-green, #6E8345);
        stroke-width: 2; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
      .icon-btn .icon-label { font-size: .74rem; font-weight: 600;
        color: var(--ho-text-mid, #6E6A60); }

      /* ===== Simple esfera rows (3, 4, 5, 6) ===== */
      .esfera-row { display: flex; align-items: center; justify-content: space-between;
        padding: 14px 0; cursor: pointer; transition: opacity .2s; }
      .esfera-row:hover { opacity: .8; }
      .esfera-row.locked { cursor: default; }
      .esfera-row .row-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); }
      .esfera-row .row-desc { font-size: .78rem; color: var(--ho-text-mid, #6E6A60);
        margin-left: 8px; flex: 1; }
      .esfera-row .row-lock svg { width: 14px; height: 14px; stroke: #9C988D;
        stroke-width: 2; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
      .esfera-row + .esfera-row { border-top: 1px solid var(--ho-border, rgba(43,42,38,.08)); }
    `;
  }

  _render() {
    const lockSvg = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';

    // --- ESFERA 1: Actualidad ---
    const newsSlides = this._clipping.map((n, i) =>
      '<div class="news-slide" data-index="' + i + '">' +
        '<img src="' + (n.foto || '') + '" alt="" loading="lazy">' +
        '<div class="news-overlay">' +
          '<span class="news-emoji">' + (n.emoji || '') + '</span>' +
          '<div class="news-title">' + (n.titulo || '') + '</div>' +
          '<div class="news-tags">' +
            (n.tags || []).map(t => '<span class="news-tag">' + t + '</span>').join('') +
          '</div>' +
        '</div>' +
      '</div>'
    ).join('');

    const dots = this._clipping.map((n, i) =>
      '<span class="dot' + (i === this.carouselIndex ? ' active' : '') + '" data-index="' + i + '"></span>'
    ).join('');

    // Agenda bubbles — urgency determines size and color
    const agendaBubbles = this._agenda.map(ev => {
      const cls = ev.urgencia <= 1 ? 'agenda-urgent' :
                 ev.urgencia <= 2 ? 'agenda-soon' :
                 ev.urgencia <= 4 ? 'agenda-mid' : 'agenda-far';
      return '<span class="agenda-bubble ' + cls + '">' + ev.nombre + '</span>';
    }).join('');

    // --- ESFERA 2: Consulta icons ---
    // SVG paths for each sub-function
    const debateSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
    const consultaSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/>';
    const contenidoSvg = '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';

    // --- Esferas 3, 4, 5, 6 ---
    const esfera4Access = this.accessMap['is'];
    const esfera4Locked = esfera4Access !== 'open' && !this._hasAccess('is');
    const esfera4LockHtml = esfera4Locked ? '<span class="row-lock">' + lockSvg + '</span>' : '';

    return html`
      <!-- ESFERA 1: Actualidad -->
      <div class="esfera-actualidad">
        <div class="esfera-name">Actualidad</div>

        <div class="carousel-wrap">
          <div class="carousel-track" id="carouselTrack">
            ${newsSlides}
          </div>
        </div>
        <div class="carousel-dots" id="carouselDots">
          ${dots}
        </div>

        <div class="agenda-wrap">
          <div class="agenda-name">Agenda</div>
          <div class="agenda-cloud">
            ${agendaBubbles}
          </div>
        </div>
      </div>

      <!-- ESFERA 2: Consulta -->
      <div class="esfera-consulta">
        <div class="esfera-name">Consulta</div>
        <div class="consulta-icons">
          <button class="icon-btn" data-screen="consulta" data-sub="debate">
            <svg viewBox="0 0 24 24">${debateSvg}</svg>
            <span class="icon-label">Debate</span>
          </button>
          <button class="icon-btn" data-screen="consulta" data-sub="consulta-legal">
            <svg viewBox="0 0 24 24">${consultaSvg}</svg>
            <span class="icon-label">Consulta</span>
          </button>
          <button class="icon-btn" data-screen="consulta" data-sub="contenido">
            <svg viewBox="0 0 24 24">${contenidoSvg}</svg>
            <span class="icon-label">Contenido</span>
          </button>
        </div>
      </div>

      <!-- ESFERA 3: Formación -->
      <div class="esfera-row" data-screen="formacion">
        <span class="row-name">Formación</span>
        <span class="row-desc">Educación, cursos, materiales</span>
      </div>

      <!-- ESFERA 4: Comunicación interna -->
      <div class="esfera-row${esfera4Locked ? ' locked' : ''}" data-screen="is" data-access="${esfera4Access}">
        <span class="row-name">Comunicación interna</span>
        <span class="row-desc">Observaciones, informes, coordinación</span>
        ${esfera4LockHtml}
      </div>

      <!-- ESFERA 5: Panorama -->
      <div class="esfera-row" data-screen="condicion">
        <span class="row-name">Panorama</span>
        <span class="row-desc">CE · IFT · SMVM · diagnóstico</span>
      </div>

      <!-- ESFERA 6: Archivo -->
      <div class="esfera-row" data-screen="archivo">
        <span class="row-name">Archivo</span>
        <span class="row-desc">Documentos, historia, memoria</span>
      </div>
    `;
  }

  _afterRender() {
    // Carousel dots — update active dot on scroll
    const track = this.shadowRoot.querySelector('#carouselTrack');
    const dots = this.shadowRoot.querySelector('#carouselDots');

    if (track) {
      track.addEventListener('scroll', () => {
        const scrollLeft = track.scrollLeft;
        const slideWidth = track.offsetWidth;
        const newIndex = Math.round(scrollLeft / slideWidth);
        if (newIndex !== this.carouselIndex && newIndex >= 0) {
          this.carouselIndex = newIndex;
          // Update dots
          if (dots) {
            dots.querySelectorAll('.dot').forEach((d, i) => {
              d.classList.toggle('active', i === newIndex);
            });
          }
        }
      });
    }

    // Click on dot — scroll to that slide
    if (dots) {
      dots.querySelectorAll('.dot').forEach(d => {
        d.addEventListener('click', () => {
          const idx = parseInt(d.dataset.index);
          if (track) track.scrollTo({ left: idx * track.offsetWidth, behavior: 'smooth' });
        });
      });
    }

    // Esfera rows — navigation
    this.shadowRoot.querySelectorAll('.esfera-row').forEach(row => {
      row.addEventListener('click', () => {
        if (row.classList.contains('locked')) return;
        this.goScreen(row.dataset.screen);
      });
    });

    // Consulta icons — navigation
    this.shadowRoot.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.goScreen(btn.dataset.screen);
      });
    });
  }
}

customElements.define('hornero-home', HorneroHome);
