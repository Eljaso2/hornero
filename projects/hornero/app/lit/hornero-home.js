// ===== <hornero-home> — Pantalla inicio (v2 fix) =====
// Esfera 1: Actualidad — carrusel noticias + agenda nube
// Esfera 2: Consulta — 3 íconos inline
// Esferas 3-6: cards con marco invisible (padding + same bg)

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
    // Clipping — load latest edition from index
    try {
      const idxRes = await fetch('data/clipping-index.json');
      const idx = await idxRes.json();
      const latest = (idx.ediciones && idx.ediciones[0])
        ? idx.ediciones[0].archivo
        : 'data/clipping-2026-07-02.json';
      this._clipNumero = (idx.ediciones && idx.ediciones[0])
        ? idx.ediciones[0].numero : 4;
      const clipRes = await fetch(latest);
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
      /* ===== Home container — no top padding → photo fuses with header ===== */
      :host { display: block; padding: 0 16px 16px; background: #F4F3EE; }

      /* ===== Section name — kicker style, dark on light bg ===== */
      .esfera-name { font-family: 'Archivo', sans-serif; font-size: .92rem;
        font-weight: 700; color: #2B2A26; margin-bottom: 10px; }

      /* ===== Section badge — overlay on carousel photo, right corner ===== */
      .section-badge { position: absolute; top: 10px; right: 12px; z-index: 3;
        font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: rgba(242,241,236,.85); background: rgba(33,31,29,.35);
        padding: 3px 7px 2px; border-radius: 5px; }

      /* ===== Invisible card — same bg as page, padding, no visible border ===== */
      .ghost-card { background: var(--ho-card, #FBFAF6);
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        border: 1px solid rgba(43,42,38,.06); }

      /* ===== ESFERA 1: Actualidad ===== */
      .esfera-actualidad { margin-bottom: 20px; }

      /* --- News carousel --- */
      .carousel-wrap { position: relative; margin-bottom: 16px;
        margin-left: -16px; margin-right: -16px; overflow: hidden; }
      /* Whisper of dark — almost imperceptible fusion with header closure */
      .carousel-wrap::before { content: ''; position: absolute;
        top: 0; left: 0; right: 0; height: 8px;
        background: linear-gradient(to bottom, rgba(51,49,45,.06), transparent);
        z-index: 2; }
      .carousel-track { display: flex; overflow-x: auto;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; }
      .carousel-track::-webkit-scrollbar { width: 0; }
      .news-slide { scroll-snap-align: start; width: 100%; flex-shrink: 0;
        position: relative; min-height: 260px;
        background: var(--ho-dark, #33312D); }
      .news-slide img { width: 100%; height: 260px; object-fit: cover;
        display: block; }
      .news-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.85));
        color: #F2F1EC; }
      .news-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.32rem; line-height: 1.18; letter-spacing: .02em; text-transform: uppercase; }
      .news-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .news-tag { font-family: 'JetBrains Mono', monospace; font-size: .56rem;
        background: rgba(110,131,69,.6); color: #F2F1EC;
        padding: 2px 6px; border-radius: 4px; font-weight: 600; }
      .carousel-dots { display: flex; justify-content: center; gap: 5px;
        padding: 8px 0; }
      .dot { width: 6px; height: 6px; border-radius: 50%;
        background: #9C988D; transition: background .2s; }
      .dot.active { background: #6E8345; }

      /* --- Agenda cloud --- */
      .agenda-wrap { margin-top: 4px; }
      .agenda-cloud { display: flex; flex-wrap: wrap; justify-content: center;
        align-items: center; gap: 3px 4px; }
      .agenda-bubble { font-family: 'Archivo', sans-serif; font-weight: 600;
        padding: 5px 12px; border-radius: 20px; cursor: pointer;
        transition: transform .2s; white-space: nowrap; }
      .agenda-bubble:hover { transform: scale(1.05); }
      .agenda-label { font-family: 'JetBrains Mono', monospace;
        font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
        margin-right: 2px; }
      .agenda-hoy { background: #C0392B; color: #FFF; font-size: .92rem;
        padding: 7px 14px; }
      .agenda-hoy .agenda-label { font-size: .58rem; color: #FFD5D5; }
      .agenda-manana { background: #6E8345; color: #F2F1EC; font-size: .86rem;
        padding: 6px 13px; }
      .agenda-manana .agenda-label { font-size: .54rem; color: #C8D9A4; }
      .agenda-prox { background: #7FB5D5; color: #FFF; font-size: .70rem;
        padding: 3px 8px; border-radius: 16px; line-height: 1.2; }
      .agenda-prox .agenda-label { font-size: .48rem; color: #D4E8F2; }
      .agenda-date { font-family: 'JetBrains Mono', monospace;
        opacity: .7; margin-left: 2px; }
      .agenda-hoy .agenda-date, .agenda-manana .agenda-date { font-size: .54rem; }
      .agenda-prox .agenda-date { font-size: .46rem; }

      /* ===== ESFERA 2: Consulta — 3 íconos ===== */
      .esfera-consulta { margin-bottom: 20px;
        background: var(--ho-card, #FBFAF6);
        border-radius: 13px; padding: 16px 14px 18px;
        border: 1px solid rgba(43,42,38,.06); }
      .consulta-icons { display: flex; justify-content: space-around; gap: 4px; }
      .icon-btn { display: flex; flex-direction: column; align-items: center;
        gap: 7px; background: none; border: none; cursor: pointer;
        padding: 14px 6px; font-family: 'Archivo', sans-serif;
        transition: opacity .2s; }
      .icon-btn:hover { opacity: .8; }
      .icon-btn svg { width: 46px; height: 46px; stroke: #6E8345;
        stroke-width: 1.8; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
      .icon-btn .icon-label { font-size: .76rem; font-weight: 600;
        color: #2B2A26; }

      /* ===== Esferas 3-6: ghost cards ===== */
      .esfera-card { background: var(--ho-card, #FBFAF6);
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        border: 1px solid rgba(43,42,38,.06); cursor: pointer;
        transition: border-color .2s; position: relative; }
      .esfera-card:hover { border-color: rgba(43,42,38,.18); }
      .esfera-card.locked { cursor: default; }
      .esfera-card .card-name { font-family: 'Archivo', sans-serif;
        font-weight: 700; font-size: .92rem; color: #2B2A26; }
      .esfera-card .card-desc { font-size: .82rem; color: #6E6A60;
        line-height: 1.4; margin-top: 4px; }
      .esfera-card .card-tag { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; background: #E8EDD7; color: #586B33;
        padding: 3px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 6px; }
      .esfera-card .lock-icon { position: absolute; top: 10px; right: 12px;
        width: 16px; height: 16px; }
      .esfera-card .lock-icon svg { width: 14px; height: 14px; stroke: #9C988D;
        stroke-width: 2; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
    `;
  }

  _render() {
    const lockSvg = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';

    // --- Carousel slides (clickable → Actualidad clipping) ---
    const newsSlides = this._clipping.map((n, i) =>
      '<div class="news-slide" data-index="' + i + '" data-clip-id="' + (n.id || '') + '">' +
        (n.foto ? '<img src="' + n.foto + '" alt="" loading="lazy">' : '') +
        '<div class="news-overlay">' +
          '<div class="news-title">' + (n.emoji || '') + ' ' + (n.titulo || '') + '</div>' +
          '<div class="news-tags">' +
            (n.tags || []).map(t => '<span class="news-tag">' + t + '</span>').join('') +
          '</div>' +
        '</div>' +
      '</div>'
    ).join('');

    const dots = this._clipping.map((_, i) =>
      '<span class="dot' + (i === this.carouselIndex ? ' active' : '') + '" data-index="' + i + '"></span>'
    ).join('');

    // --- Agenda cloud: HOY center, MAÑANA around, PRÓX edges ---
    const today = new Date(); today.setHours(0,0,0,0);
    const sorted = this._agenda.map(ev => {
      const evDate = new Date(ev.fecha + 'T00:00:00');
      const diffDays = Math.round((evDate - today) / 86400000);
      let cls, label;
      if (diffDays <= 0) { cls = 'agenda-hoy'; label = 'HOY'; }
      else if (diffDays === 1) { cls = 'agenda-manana'; label = 'MAÑANA'; }
      else { cls = 'agenda-prox'; label = 'PRÓX'; }
      const dayNum = evDate.getDate();
      const monthNum = evDate.getMonth() + 1;
      const dateStr = dayNum + '/' + monthNum;
      return { ...ev, cls, label, dateStr, diffDays };
    }).sort((a, b) => a.diffDays - b.diffDays); // most urgent first

    // Cloud layout: urgent center → edges less urgent
    // Split: hoy[], manana[], prox[] → arrange: proxEdges, manana, hoyCenter, manana, proxEdges
    const hoy = sorted.filter(e => e.cls === 'agenda-hoy');
    const manana = sorted.filter(e => e.cls === 'agenda-manana');
    const prox = sorted.filter(e => e.cls === 'agenda-prox');

    // Split prox into two halves for left/right edges
    const proxLeft = prox.slice(0, Math.ceil(prox.length / 2));
    const proxRight = prox.slice(Math.ceil(prox.length / 2));

    const cloudOrder = [...proxLeft, ...manana, ...hoy, ...manana.length ? [] : [], ...proxRight];

    const agendaBubbles = cloudOrder.map(ev =>
      '<span class="agenda-bubble ' + ev.cls + '">' +
        '<span class="agenda-label">' + ev.label + '</span> ' +
        ev.nombre + '<span class="agenda-date">' + ev.dateStr + '</span></span>'
    ).join('');

    // --- Consulta icons ---
    const debateSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
    const consultaSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/>';
    const contenidoSvg = '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';

    // --- Esfera 4 access ---
    const isLocked = this.accessMap['is'] !== 'open' && !this._hasAccess('is');

    return html`
      <!-- ESFERA 1: Actualidad -->
      <div class="esfera-actualidad">
        <div class="carousel-wrap">
          <div class="section-badge">Actualidad</div>
          <div class="carousel-track" id="carouselTrack">
            ${newsSlides}
          </div>
        </div>
        <div class="carousel-dots" id="carouselDots">
          ${dots}
        </div>

        <div class="agenda-wrap">
          <div class="agenda-cloud">
            ${agendaBubbles}
          </div>
        </div>
      </div>

      <!-- ESFERA 2: Chat IA -->
      <div class="esfera-consulta">
        <div class="esfera-name">Chat IA Sindical</div>
        <div class="consulta-icons">
          <button class="icon-btn" data-screen="consulta">
            <svg viewBox="0 0 24 24">${debateSvg}</svg>
            <span class="icon-label">Debate</span>
          </button>
          <button class="icon-btn" data-screen="consulta">
            <svg viewBox="0 0 24 24">${consultaSvg}</svg>
            <span class="icon-label">Consulta</span>
          </button>
          <button class="icon-btn" data-screen="contenido">
            <svg viewBox="0 0 24 24">${contenidoSvg}</svg>
            <span class="icon-label">Contenido</span>
          </button>
        </div>
      </div>

      <!-- ESFERA 3: Formación -->
      <div class="esfera-card" data-screen="formacion">
        <div class="card-name">Formación</div>
        <div class="card-desc">Educación, cursos, materiales — formación vivida, no declarada</div>
        <span class="card-tag">cursos · materiales · codiseño</span>
      </div>

      <!-- ESFERA 4: Reporte gremial -->
      <div class="esfera-card${isLocked ? ' locked' : ''}" data-screen="is">
        ${isLocked ? '<span class="lock-icon">' + lockSvg + '</span>' : ''}
        <div class="card-name">Reporte gremial</div>
        <div class="card-desc">Observaciones, informes, coordinación, circulares</div>
        <span class="card-tag">${this.sector} · observaciones · informes</span>
      </div>

      <!-- ESFERA 5: Panorama -->
      <div class="esfera-card" data-screen="condicion">
        <div class="card-name">Panorama</div>
        <div class="card-desc">CE · IFT · Cómo Somos · SMVM — diagnóstico de la clase trabajadora</div>
        <span class="card-tag">índices · diagnóstico</span>
      </div>

      <!-- ESFERA 6: Archivo -->
      <div class="esfera-card" data-screen="archivo">
        <div class="card-name">Archivo</div>
        <div class="card-desc">Convenios, referentes, fuentes sindicales — la memoria del sindicato</div>
        <span class="card-tag">documentos · académicos · multimedia</span>
      </div>
    `;
  }

  _afterRender() {
    // Carousel slides — click → go directly to clipping sub-screen
    this.shadowRoot.querySelectorAll('.news-slide').forEach(slide => {
      slide.addEventListener('click', () => {
        const clipId = slide.dataset.clipId;
        // Navigate directly to clipping (not actualidad hub)
        if (typeof state !== 'undefined') {
          state.screen = 'clipping';
          state.clipExpandId = clipId;
        }
        this.emit('screen-change', { screen: 'clipping', clipEdicion: this._clipNumero, clipExpandId: clipId });
      });
    });

    // Carousel scroll → update dots
    const track = this.shadowRoot.querySelector('#carouselTrack');
    const dots = this.shadowRoot.querySelector('#carouselDots');

    if (track) {
      track.addEventListener('scroll', () => {
        const idx = Math.round(track.scrollLeft / track.offsetWidth);
        if (idx !== this.carouselIndex && idx >= 0) {
          this.carouselIndex = idx;
          if (dots) {
            dots.querySelectorAll('.dot').forEach((d, i) => {
              d.classList.toggle('active', i === idx);
            });
          }
        }
      });
    }

    // Click on dot → scroll to slide
    if (dots) {
      dots.querySelectorAll('.dot').forEach(d => {
        d.addEventListener('click', () => {
          const idx = parseInt(d.dataset.index);
          if (track) track.scrollTo({ left: idx * track.offsetWidth, behavior: 'smooth' });
        });
      });
    }

    // Esfera cards — navigation
    this.shadowRoot.querySelectorAll('.esfera-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('locked')) return;
        this.goScreen(card.dataset.screen);
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
