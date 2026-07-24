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
      :host { display: block; padding: 16px; }

      /* ===== Section name — visible, dark text ===== */
      .esfera-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: #2B2A26; margin-bottom: 10px; }

      /* ===== Invisible card — same bg as page, padding, no visible border ===== */
      .ghost-card { background: var(--ho-card, #FBFAF6);
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        border: 1px solid rgba(43,42,38,.06); }

      /* ===== ESFERA 1: Actualidad ===== */
      .esfera-actualidad { margin-bottom: 20px; }

      /* --- News carousel --- */
      .carousel-wrap { position: relative; margin-bottom: 8px;
        border-radius: 13px; overflow: hidden; }
      .carousel-track { display: flex; overflow-x: auto;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; }
      .carousel-track::-webkit-scrollbar { width: 0; }
      .news-slide { scroll-snap-align: start; width: 100%; flex-shrink: 0;
        position: relative; min-height: 200px;
        background: var(--ho-dark, #33312D); }
      .news-slide img { width: 100%; height: 200px; object-fit: cover;
        display: block; }
      .news-overlay { position: absolute; bottom: 0; left: 0; right: 0;
        padding: 36px 14px 12px;
        background: linear-gradient(transparent, rgba(33,31,29,.85));
        color: #F2F1EC; }
      .news-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .86rem; line-height: 1.3; }
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
      .agenda-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; color: #6E6A60; margin-bottom: 8px; }
      .agenda-cloud { display: flex; flex-wrap: wrap; align-items: center;
        gap: 6px 8px; }
      .agenda-bubble { font-family: 'Archivo', sans-serif; font-weight: 600;
        padding: 4px 10px; border-radius: 20px; cursor: pointer;
        transition: transform .2s; white-space: nowrap; }
      .agenda-bubble:hover { transform: scale(1.05); }
      .agenda-urgent { background: #6E8345; color: #F2F1EC; font-size: .82rem; }
      .agenda-soon { background: #94A867; color: #F2F1EC; font-size: .78rem; }
      .agenda-mid { background: #E8EDD7; color: #586B33; font-size: .74rem; }
      .agenda-far { background: #E6E3DB; color: #6E6A60; font-size: .70rem; }

      /* ===== ESFERA 2: Consulta — 3 íconos ===== */
      .esfera-consulta { margin-bottom: 20px; }
      .consulta-icons { display: flex; justify-content: space-around; }
      .icon-btn { display: flex; flex-direction: column; align-items: center;
        gap: 6px; background: none; border: none; cursor: pointer;
        padding: 12px 8px; font-family: 'Archivo', sans-serif;
        transition: opacity .2s; }
      .icon-btn:hover { opacity: .8; }
      .icon-btn svg { width: 32px; height: 32px; stroke: #6E8345;
        stroke-width: 2; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }
      .icon-btn .icon-label { font-size: .74rem; font-weight: 600;
        color: #2B2A26; }

      /* ===== Esferas 3-6: ghost cards ===== */
      .esfera-card { background: var(--ho-card, #FBFAF6);
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        border: 1px solid rgba(43,42,38,.06); cursor: pointer;
        transition: border-color .2s; position: relative; }
      .esfera-card:hover { border-color: rgba(43,42,38,.18); }
      .esfera-card.locked { cursor: default; }
      .esfera-card .card-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: #2B2A26; }
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

    // --- Carousel slides ---
    const newsSlides = this._clipping.map((n, i) =>
      '<div class="news-slide" data-index="' + i + '">' +
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

    // --- Agenda ---
    const agendaBubbles = this._agenda.map(ev => {
      const cls = ev.urgencia <= 1 ? 'agenda-urgent' :
                 ev.urgencia <= 2 ? 'agenda-soon' :
                 ev.urgencia <= 4 ? 'agenda-mid' : 'agenda-far';
      return '<span class="agenda-bubble ' + cls + '">' + ev.nombre + '</span>';
    }).join('');

    // --- Consulta icons ---
    const debateSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>';
    const consultaSvg = '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/>';
    const contenidoSvg = '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';

    // --- Esfera 4 access ---
    const isLocked = this.accessMap['is'] !== 'open' && !this._hasAccess('is');

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
          <button class="icon-btn" data-screen="consulta">
            <svg viewBox="0 0 24 24">${debateSvg}</svg>
            <span class="icon-label">Debate</span>
          </button>
          <button class="icon-btn" data-screen="consulta">
            <svg viewBox="0 0 24 24">${consultaSvg}</svg>
            <span class="icon-label">Consulta</span>
          </button>
          <button class="icon-btn" data-screen="consulta">
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

      <!-- ESFERA 4: Comunicación interna -->
      <div class="esfera-card${isLocked ? ' locked' : ''}" data-screen="is">
        ${isLocked ? '<span class="lock-icon">' + lockSvg + '</span>' : ''}
        <div class="card-name">Comunicación interna</div>
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
        <div class="card-desc">Repositorio documental, historia — convenios, estatutos, memoria sindical</div>
        <span class="card-tag">documentos · historia · memoria</span>
      </div>
    `;
  }

  _afterRender() {
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
