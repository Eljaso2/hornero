// ===== <hornero-home> — Pantalla inicio =====
// Cards de entry points a las 6 esferas, grade badge, sector tag
// Native Web Component — zero dependencies

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
      .grade-badge { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; padding: 2px 8px; border-radius: 5px; float: right;
        background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC); }

      .card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; }
      .card:hover { border-color: var(--ho-green, #6E8345); }

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
    const gradeLabel = this.grade === 'A' ? 'A — libre' :
                       this.grade === 'B.a' ? 'B.a — afiliado' :
                       this.grade === 'B.b' ? 'B.b — delegado' :
                       this.grade === 'B.c' ? 'B.c — secretario' :
                       this.grade === 'B.d' ? 'B.d — federación' : this.grade;

    return html`
      <span class="grade-badge">${gradeLabel}</span>

      <div class="card card-actualidad" data-screen="actualidad">
        <div class="kicker">📰 ESFERA 1</div>
        <div class="card-title">Actualidad y agenda</div>
        <div class="card-desc">Clipping diario, Mate mensual, situación sindical — noticias, eventos, convocatorias</div>
        <span class="tag">diario · mensual · grade 4</span>
      </div>

      <div class="card card-consulta" data-screen="consulta">
        <div class="kicker">💬 ESFERA 2</div>
        <div class="card-title">Consulta y asesoramiento</div>
        <div class="card-desc">Chat IA con sesgo sindical propio — convenio vivo, derechos, contexto</div>
        <span class="tag">chat · RAG · sesgo deliberado</span>
      </div>

      <div class="card card-formacion" data-screen="formacion">
        <div class="kicker">📖 ESFERA 3</div>
        <div class="card-title">Formación política y sindical</div>
        <div class="card-desc">Educación, cursos, materiales — formación vivida, no declarada</div>
        <span class="tag">cursos · materiales · codiseño</span>
      </div>

      <div class="card card-reporte" data-screen="is">
        <div class="kicker">✍️ ESFERA 4</div>
        <div class="card-title">Gestión y comunicación interna</div>
        <div class="card-desc">IS — carga observaciones, consulta informes, coordinación, circulares</div>
        <span class="tag">${this.sector} · observaciones · informes</span>
      </div>

      <div class="card card-panorama" data-screen="condicion">
        <div class="kicker">📊 ESFERA 5</div>
        <div class="card-title">Diagnóstico y panorama</div>
        <div class="card-desc">CE · IFT · Cómo Somos · SMVM — análisis de situación, contexto</div>
        <span class="tag">índices · diagnóstico</span>
      </div>

      <div class="card card-archivo" data-screen="archivo">
        <div class="kicker">🗄️ ESFERA 6</div>
        <div class="card-title">Archivo</div>
        <div class="card-desc">Repositorio documental, historia — convenios, estatutos, memoria sindical</div>
        <span class="tag">documentos · historia · memoria</span>
      </div>
    `;
  }

  _afterRender() {
    this.shadowRoot.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        this.goScreen(card.dataset.screen);
      });
    });
  }
}

customElements.define('hornero-home', HorneroHome);
