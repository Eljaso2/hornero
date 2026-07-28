// ===== <hornero-coyuntura> — Clipping semanal =====
// Cards con noticias laborales, tags, fuente, expand/collapse
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroCoyuntura extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      filter: String,  // 'todos', 'clipping', 'reporte', 'mate'
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.filter = 'todos';
    this._clipping = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadClipping();
  }

  async _loadClipping() {
    // Try IndexedDB first (offline), then fetch
    try {
      if (typeof dbGetAll === 'function') {
        this._clipping = await dbGetAll('clipping') || [];
        if (this._clipping.length > 0) {
          this.render();
          return;
        }
      }
    } catch(e) {}

    // Fetch from JSON file
    try {
      const response = await fetch('data/clipping-4.json');
      const data = await response.json();
      if (data.clipping) {
        this._clipping = data.clipping;
        // Cache in IndexedDB
        if (typeof guardarClipping === 'function') {
          for (const item of data.clipping) {
            await guardarClipping(item);
          }
        }
        this.render();
      }
    } catch(e) {
      console.warn('Coyuntura: Could not load clipping data', e);
    }
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      .filter-bar { display: flex; gap: 6px; padding: 12px 16px; flex: none; }
      .filter-btn { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; padding: 6px 12px; border-radius: 8px; border: none;
        cursor: pointer; transition: background .2s; }
      .filter-btn.todos { background: var(--ho-dark-surface, #3F4E4A); color: var(--ho-text-off, #F2F1EC); }
      .filter-btn.clipping { background: var(--ho-green, #4E9978); color: var(--ho-text-off, #F2F1EC); }
      .filter-btn.reporte { background: var(--ho-dark-surface, #3F4E4A); color: var(--ho-text-off, #F2F1EC); }
      .filter-btn.mate { background: var(--ho-gold, #B0863F); color: var(--ho-text-off, #F2F1EC); }
      .filter-btn.inactive { background: var(--ho-warm-gray, #E6E3DB); color: var(--ho-text-mid, #6E6A60); }

      .scroll { flex: 1; overflow-y: auto; padding: 0 16px 16px; }
      .card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px; }
      .card-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); margin-bottom: 4px;
        cursor: pointer; }
      .card-title:hover { color: var(--ho-green, #4E9978); }
      .bajada { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; max-height: 66px; overflow: hidden;
        position: relative; transition: max-height .35s; }
      .bajada.expanded { max-height: none; }
      .bajada-fade { position: absolute; bottom: 0; left: 0; right: 0;
        height: 30px; background: linear-gradient(transparent, var(--ho-card, #FBFAF6)); }
      .bajada.expanded .bajada-fade { display: none; }
      .expand-btn { font-family: 'Archivo', sans-serif; font-size: .74rem;
        color: var(--ho-green, #4E9978); font-weight: 600; cursor: pointer;
        background: none; border: none; padding: 2px 0; }
      .tags-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }
      .kw-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-warm-gray, #E6E3DB); color: var(--ho-text-mid, #6E6A60);
        padding: 2px 6px; border-radius: 5px; font-weight: 600; }
      .fuente { font-size: .68rem; color: var(--ho-text-light, #9C988D);
        margin-top: 6px; font-style: italic; }
      .fecha-tag { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-text-mid, #6E6A60);
        padding: 2px 6px; border-radius: 5px; font-weight: 500; }

      .empty { padding: 40px 20px; text-align: center;
        color: var(--ho-text-light, #9C988D); font-size: .82rem; }
    `;
  }

  _render() {
    const filtered = this.filter === 'todos' ? this._clipping :
      this._clipping.filter(c => c.tipo === this.filter);

    return html`
      <div class="filter-bar">
        <button class="filter-btn ${this.filter === 'todos' ? 'todos' : 'inactive'}" data-filter="todos">Todos</button>
        <button class="filter-btn ${this.filter === 'clipping' ? 'clipping' : 'inactive'}" data-filter="clipping">📰 Clipping</button>
        <button class="filter-btn ${this.filter === 'reporte' ? 'reporte' : 'inactive'}" data-filter="reporte">📋 Reporte</button>
        <button class="filter-btn ${this.filter === 'mate' ? 'mate' : 'inactive'}" data-filter="mate">🧮 Mate</button>
      </div>

      <div class="scroll">
        ${filtered.length === 0 ? '<div class="empty">No hay datos para este filtro</div>' : ''}
        ${filtered.map(c => this._renderCard(c)).join('')}
      </div>
    `;
  }

  _renderCard(c) {
    const tagsHtml = (c.tags || []).map(t =>
      `<span class="tag">${t}</span>`
    ).join('');
    const kwHtml = (c.keywords || []).map(k =>
      `<span class="kw-tag">${k}</span>`
    ).join(' ');

    return `<div class="card" data-type="${c.tipo || 'clipping'}">
      <span class="fecha-tag">${c.fecha || ''}</span>
      <div class="card-title">${c.titulo || ''}</div>
      <div class="bajada">${c.bajada || ''}<div class="bajada-fade"></div></div>
      <button class="expand-btn">▶ Leer más</button>
      <div class="tags-row">${tagsHtml} ${kwHtml}</div>
      <div class="fuente">${c.fuente || ''}</div>
    </div>`;
  }

  _afterRender() {
    // Filter buttons
    this.shadowRoot.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('filter', btn.dataset.filter);
      });
    });

    // Expand/collapse bajada
    this.shadowRoot.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bajada = btn.previousElementSibling;
        if (bajada) {
          bajada.classList.toggle('expanded');
          btn.textContent = bajada.classList.contains('expanded') ? '▽ Cerrar' : '▶ Leer más';
        }
      });
    });
  }
}

customElements.define('hornero-coyuntura', HorneroCoyuntura);
