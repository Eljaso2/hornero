// ===== <hornero-home> — Pantalla inicio =====
// Cards de entry points a las 6 esferas
// Esferas abiertas: sin candado · Esferas cerradas: candado en corner
// Acceso cerrado = por nivel (grade) o autorización explícita

import { HoComponent, html, css } from './ho-component.js';

class HorneroHome extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';

    // Definición de acceso por esfera
    // 'open' = consulta libre (sin candado)
    // 'grade' = acceso por nivel (candado — requiere grade B.a+)
    // 'auth' = acceso por autorización explícita (candado — requiere habilitación sindical)
    this.accessMap = {
      actualidad: 'open',     // Esfera 1
      consulta: 'open',       // Esfera 2
      formacion: 'open',      // Esfera 3
      is: 'grade',            // Esfera 4 — requiere grade B.a+
      condicion: 'open',      // Esfera 5
      archivo: 'open',        // Esfera 6
    };
  }

  // ¿El usuario tiene acceso a esta esfera?
  _hasAccess(screenId) {
    const access = this.accessMap[screenId] || 'open';
    if (access === 'open') return true;
    if (access === 'grade') return this.grade !== 'A';
    if (access === 'auth') return false; // placeholder — requiere habilitación explícita
    return true;
  }

  _styles() {
    return css`
      :host { display: block; padding: 16px; }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 6px; }
      .card-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); margin-bottom: 4px; }
      .card-desc { font-size: .82rem; color: var(--ho-text-mid, #6E6A60); line-height: 1.4; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 6px; }

      .card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s;
        position: relative; }
      .card:hover { border-color: var(--ho-green, #6E8345); }

      /* Lock icon in top-right corner */
      .lock-icon { position: absolute; top: 10px; right: 12px;
        width: 16px; height: 16px; display: flex; align-items: center;
        justify-content: center; }
      .lock-icon svg { width: 14px; height: 14px; stroke: #9C988D;
        stroke-width: 2; fill: none; stroke-linecap: round;
        stroke-linejoin: round; }

      /* Color accents per esfera */
      .card-actualidad { border-left: 3px solid #6E8345; }
      .card-consulta { border-left: 3px solid #94A867; }
      .card-formacion { border-left: 3px solid #586B33; }
      .card-reporte { border-left: 3px solid #B0863F; }
      .card-panorama { border-left: 3px solid #45433E; }
      .card-archivo { border-left: 3px solid #9C988D; }
    `;
  }

  _render() {
    // Esferas data: id, screen, kicker emoji, title, desc, tags, css class
    const esferas = [
      { num: 1, id: 'actualidad', screen: 'actualidad', emoji: '📰', title: 'Actualidad y agenda', desc: 'Clipping diario, Mate mensual, situación sindical — noticias, eventos, convocatorias', tags: 'diario · mensual · grade 4', css: 'card-actualidad' },
      { num: 2, id: 'consulta', screen: 'consulta', emoji: '💬', title: 'Consulta y asesoramiento', desc: 'Chat IA con sesgo sindical propio — convenio vivo, derechos, contexto', tags: 'chat · RAG · sesgo deliberado', css: 'card-consulta' },
      { num: 3, id: 'formacion', screen: 'formacion', emoji: '📖', title: 'Formación política y sindical', desc: 'Educación, cursos, materiales — formación vivida, no declarada', tags: 'cursos · materiales · codiseño', css: 'card-formacion' },
      { num: 4, id: 'is', screen: 'is', emoji: '✍️', title: 'Gestión y comunicación interna', desc: 'IS — carga observaciones, consulta informes, coordinación, circulares', tags: this.sector + ' · observaciones · informes', css: 'card-reporte' },
      { num: 5, id: 'condicion', screen: 'condicion', emoji: '📊', title: 'Diagnóstico y panorama', desc: 'CE · IFT · Cómo Somos · SMVM — análisis de situación, contexto', tags: 'índices · diagnóstico', css: 'card-panorama' },
      { num: 6, id: 'archivo', screen: 'archivo', emoji: '🗄️', title: 'Archivo', desc: 'Repositorio documental, historia — convenios, estatutos, memoria sindical', tags: 'documentos · historia · memoria', css: 'card-archivo' },
    ];

    // Lock SVG path (outlined padlock)
    const lockSvg = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';

    return html`
      ${esferas.map(e => {
        const access = this.accessMap[e.id] || 'open';
        const hasAccess = this._hasAccess(e.id);
        const lockedClass = access !== 'open' && !hasAccess ? ' locked' : '';
        const lockHtml = access !== 'open' && !hasAccess ? '<span class="lock-icon">' + lockSvg + '</span>' : '';

        return '<div class="card ' + e.css + lockedClass + '" data-screen="' + e.screen + '" data-access="' + access + '">' +
          lockHtml +
          '<div class="kicker">' + e.emoji + ' ESFERA ' + e.num + '</div>' +
          '<div class="card-title">' + e.title + '</div>' +
          '<div class="card-desc">' + e.desc + '</div>' +
          '<span class="tag">' + e.tags + '</span>' +
          '</div>';
      }).join('')}
    `;
  }

  _afterRender() {
    this.shadowRoot.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        // Locked cards: no navigation (future: show access dialog)
        if (card.classList.contains('locked')) return;
        this.goScreen(card.dataset.screen);
      });
    });
  }
}

customElements.define('hornero-home', HorneroHome);
