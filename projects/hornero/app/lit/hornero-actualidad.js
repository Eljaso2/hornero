// ===== <hornero-actualidad> — Esfera Actualidad =====
// 3 sub-funciones: Clipping (diario) | Mate (mensual) | Situación sindical (grade 4 gate)
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroActualidad extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      tab: String,       // 'clipping' | 'mate' | 'sindical'
      filter: String,    // 'todos' | 'VD' | 'VC' | 'VS'
      clipExpandId: String, // ID of clipping to auto-expand (from Home navigation)
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.tab = 'clipping';
    this.filter = 'todos';
    this.clipExpandId = '';
    this._clipping = [];
    this._mate = null;
    this._expandedCards = {}; // track which cards are expanded
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadData();
  }

  async _loadData() {
    // Load clipping
    try {
      const response = await fetch('data/clipping-2026-07-02.json');
      const data = await response.json();
      if (data.noticias) {
        this._clipping = data.noticias;
        // Cache in IndexedDB
        if (typeof guardarClipping === 'function') {
          for (const item of data.noticias) {
            await guardarClipping(item);
          }
        }
      }
    } catch(e) { console.warn('Actualidad: clipping load failed', e); }

    // Load Mate
    try {
      const response = await fetch('data/mate-2026-05.json');
      this._mate = await response.json();
    } catch(e) { console.warn('Actualidad: mate load failed', e); }

    this.render();
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      /* Tab bar */
      .tab-bar { display: flex; background: var(--ho-dark-surface, #45433E);
        flex: none; }
      .tab-btn { font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .82rem; padding: 11px 16px; border: none; cursor: pointer;
        flex: 1; text-align: center; transition: background .2s, color .2s; }
      .tab-btn.active { background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC); }
      .tab-btn.inactive { background: var(--ho-dark-surface, #45433E);
        color: var(--ho-text-light, #9C988D); }
      .tab-btn.inactive:hover { color: var(--ho-text-off, #F2F1EC); }

      /* Content scroll */
      .content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }

      /* ===== CLIPPING ===== */
      .clip-filter { display: flex; gap: 6px; padding: 12px 16px; flex: none; }
      .filter-btn { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; padding: 6px 12px; border-radius: 8px; border: none;
        cursor: pointer; transition: background .2s; }
      .filter-todos { background: var(--ho-dark-surface, #45433E); color: var(--ho-text-off, #F2F1EC); }
      .filter-VD { background: #C0392B; color: #FFF; }
      .filter-VC { background: #5A574F; color: #F2F1EC; }
      .filter-VS { background: #B0863F; color: #FFF; }
      .filter-inactive { background: var(--ho-warm-gray, #E6E3DB); color: var(--ho-text-mid, #6E6A60); }

      .clip-date { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        background: var(--ho-mid-gray, #ECEAE3); color: var(--ho-text-mid, #6E6A60);
        padding: 4px 10px; border-radius: 8px; margin: 12px 16px 8px; display: inline-block; }

      .clip-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin: 0 16px 10px;
        cursor: pointer; transition: border-color .2s; }
      .clip-card:hover { border-color: rgba(43,42,38,.25); }
      .clip-emoji { font-size: 1.1rem; }
      .clip-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: 1rem; color: var(--ho-text, #2B2A26); margin-bottom: 4px; }
      .clip-bajada { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; }
      .clip-desarrollo { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.5; margin-top: 6px;
        max-height: 0; overflow: hidden; transition: max-height .4s ease; }
      .clip-desarrollo.expanded { max-height: 600px; }
      .clip-toggle { font-family: 'Archivo', sans-serif; font-size: .74rem;
        color: var(--ho-green); font-weight: 600; cursor: pointer;
        background: none; border: none; padding: 4px 0; margin-top: 4px; }
      .clip-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .clip-tag-VD { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #E8D5D5; color: #C0392B; padding: 3px 8px;
        border-radius: 6px; font-weight: 600; }
      .clip-tag-VC { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #E6E3DB; color: #5A574F; padding: 3px 8px;
        border-radius: 6px; font-weight: 600; }
      .clip-tag-VS { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #F0E4CC; color: #7A5E2C; padding: 3px 8px;
        border-radius: 6px; font-weight: 600; }
      .clip-tag-topic { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }
      .clip-fuente { font-size: .68rem; color: var(--ho-text-light, #9C988D);
        margin-top: 6px; font-style: italic; }

      /* ===== MATE ===== */
      .mate-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border); border-radius: 13px;
        padding: 14px; margin: 16px; }
      .mate-mes { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); }
      .mate-fuente { font-size: .72rem; color: var(--ho-text-light, #9C988D);
        margin-bottom: 12px; }
      .mate-dato-row { display: flex; justify-content: space-between;
        padding: 6px 0; font-size: .82rem;
        border-bottom: 1px solid rgba(43,42,38,.06); }
      .mate-dato-label { color: var(--ho-text-mid, #6E6A60); }
      .mate-dato-value { color: var(--ho-text, #2B2A26); font-weight: 600;
        font-family: 'JetBrains Mono', monospace; font-size: .78rem; }
      .mate-section { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border); border-radius: 13px;
        padding: 14px; margin: 0 16px 10px; }
      .mate-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); }
      .mate-section-bajada { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 4px; }
      .mate-routing { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; margin-top: 8px; }
      .mate-disclaimer { background: var(--ho-green-pale, #E8EDD7); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #586B33);
        margin: 0 16px 16px; line-height: 1.4; }

      /* ===== SINDICAL ===== */
      .sindical-empty { padding: 40px 20px; text-align: center; }
      .sindical-icon { font-size: 2rem; margin-bottom: 12px; }
      .sindical-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); margin-bottom: 8px; }
      .sindical-desc { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; }
      .sindical-note { font-size: .72rem; color: var(--ho-text-light, #9C988D);
        margin-top: 12px; }
    `;
  }

  _render() {
    return html`
      <div class="tab-bar">
        <button class="tab-btn ${this.tab === 'clipping' ? 'active' : 'inactive'}" data-tab="clipping">📰 Clipping</button>
        <button class="tab-btn ${this.tab === 'mate' ? 'active' : 'inactive'}" data-tab="mate">🧮 Mate</button>
        <button class="tab-btn ${this.tab === 'sindical' ? 'active' : 'inactive'}" data-tab="sindical">✊ Sit. sindical</button>
      </div>

      <div class="content">
        ${this.tab === 'clipping' ? this._renderClipping() : ''}
        ${this.tab === 'mate' ? this._renderMate() : ''}
        ${this.tab === 'sindical' ? this._renderSindical() : ''}
      </div>
    `;
  }

  // ===== CLIPPING =====
  _renderClipping() {
    const filtered = this.filter === 'todos' ? this._clipping :
      this._clipping.filter(n => {
        if (this.filter === 'VD') return n.violencia && n.violencia.includes('VD');
        if (this.filter === 'VC') return n.violencia && n.violencia.includes('VC');
        if (this.filter === 'VS') return n.violencia && n.violencia.includes('VS');
        return true;
      });

    return html`
      <div class="clip-filter">
        <button class="filter-btn ${this.filter === 'todos' ? 'filter-todos' : 'filter-inactive'}" data-filter="todos">Todos</button>
        <button class="filter-btn ${this.filter === 'VD' ? 'filter-VD' : 'filter-inactive'}" data-filter="VD">VD</button>
        <button class="filter-btn ${this.filter === 'VC' ? 'filter-VC' : 'filter-inactive'}" data-filter="VC">VC</button>
        <button class="filter-btn ${this.filter === 'VS' ? 'filter-VS' : 'filter-inactive'}" data-filter="VS">VS</button>
      </div>

      <span class="clip-date">📅 2 julio 2026</span>

      ${filtered.length === 0 ? '<div style="padding:20px;text-align:center;color:#9C988D">No hay noticias para este filtro</div>' : ''}
      ${filtered.map(n => this._renderClipCard(n)).join('')}
    `;
  }

  _renderClipCard(n) {
    // Build violence tags
    let vTagsHtml = '';
    if (n.violencia) {
      const vTags = n.violencia.split('+');
      vTagsHtml = vTags.map(v => {
        const cls = v === 'VD' ? 'clip-tag-VD' : v === 'VC' ? 'clip-tag-VC' : 'clip-tag-VS';
        return `<span class="${cls}">${v}</span>`;
      }).join('');
    }
    // Build topic tags
    const topicTagsHtml = (n.tags || []).map(t =>
      `<span class="clip-tag-topic">${t}</span>`
    ).join('');

    const isExpanded = this._expandedCards[n.id] || this.clipExpandId === n.id;
    const toggleLabel = isExpanded ? '✕ Cerrar' : '▸ Leer más';

    return `<div class="clip-card" data-clip-id="${n.id}">
      ${n.foto ? '<img src="' + n.foto + '" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:10px" loading="lazy">' : ''}
      <span class="clip-emoji">${n.emoji || '📰'}</span>
      <div class="clip-title">${n.titulo}</div>
      <div class="clip-bajada">${n.bajada}</div>
      <div class="clip-desarrollo${isExpanded ? ' expanded' : ''}">${n.desarrollo || n.bajada}</div>
      <button class="clip-toggle" data-clip-id="${n.id}">${toggleLabel}</button>
      <div class="clip-tags">${vTagsHtml} ${topicTagsHtml}</div>
      <div class="clip-fuente">${n.fuente}</div>
    </div>`;
  }

  // ===== MATE =====
  _renderMate() {
    if (!this._mate) {
      return '<div style="padding:40px;text-align:center;color:#9C988D">No hay informe Mate disponible</div>';
    }

    const m = this._mate;
    const datosHtml = m.datosMacro ? Object.entries(m.datosMacro).map(([key, val]) =>
      `<div class="mate-dato-row"><span class="mate-dato-label">${this._mateLabel(key)}</span><span class="mate-dato-value">${val}</span></div>`
    ).join('') : '';

    const seccionesHtml = (m.secciones || []).map(s =>
      `<div class="mate-section">
        <div class="mate-section-title">${s.titulo}</div>
        <div class="mate-section-bajada">${s.bajada}</div>
        ${s.datos ? '<div style="margin-top:6px;font-size:.78rem;color:#4A4842">' + s.datos.join(' · ') + '</div>' : ''}
      </div>`
    ).join('');

    const routingHtml = m.routing ?
      `<div style="display:flex;gap:5px;margin-top:4px">
        ${m.routing.n9 ? '<span class="mate-routing">→ Cómo Somos</span>' : ''}
        ${m.routing.n6 ? '<span class="mate-routing">→ IS</span>' : ''}
        ${m.routing.n11 ? '<span class="mate-routing">→ CE</span>' : ''}
      </div>` : '';

    return html`
      <div class="mate-card">
        <div class="mate-mes">🧮 Informe Mate — Mayo 2026</div>
        <div class="mate-fuente">${m.meta.fuente}</div>
        ${datosHtml}
        ${routingHtml}
      </div>

      ${seccionesHtml}

      <div class="mate-disclaimer">⚠️ Datos reorganizados con categorías del campo obrero (Inigo Carrera / PIMSA), no categorías INDEC. La IA propone — vos decidís.</div>
    `;
  }

  _mateLabel(key) {
    const labels = {
      inflacionOficial: 'Inflación oficial',
      inflacionObrera: 'Inflación obrera',
      smvm: 'SMVM',
      salarioMedioRegistrado: 'Salario medio reg.',
      canastaBasicaTotal: 'Canasta básica',
      empleoTotal: 'Empleo total',
      ejercitoActivo: 'Ejército activo',
      reservaFlotante: 'Reserva flotante',
      reservaLatente: 'Reserva latente',
      pauperizacion: 'Pauperización',
    };
    return labels[key] || key;
  }

  // ===== SINDICAL =====
  _renderSindical() {
    // Grade 4 gate — in Phase 1 (no backend), always show the empty state
    // In Phase 2, this checks if grade 4 has approved publication
    return html`
      <div class="sindical-empty">
        <div class="sindical-icon">✊</div>
        <div class="sindical-title">Situación sindical</div>
        <div class="sindical-desc">La federación aún no ha aprobado la publicación de su reporte sindical.</div>
        <div class="sindical-note">Esta sección se activa cuando una federación o unión (grade 4) aprueba publicar su informe gremial. Solo se muestra contenido aprobado — no speculation.</div>
      </div>
    `;
  }

  _afterRender() {
    // If clipExpandId was passed, auto-switch to clipping tab
    if (this.clipExpandId && this.tab !== 'clipping') {
      this.tab = 'clipping';
      // Don't re-render here, it's already in the right state from connectedCallback
    }

    // Tab switching
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('tab', btn.dataset.tab);
        if (btn.dataset.tab === 'clipping') this.set('filter', 'todos');
      });
    });

    // Clipping filter
    this.shadowRoot.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('filter', btn.dataset.filter);
      });
    });

    // Clip card expand/collapse
    this.shadowRoot.querySelectorAll('.clip-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.clipId;
        this._expandedCards[id] = !this._expandedCards[id];
        this.render();
      });
    });

    // Also expand on card click (not on toggle button)
    this.shadowRoot.querySelectorAll('.clip-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.clipId;
        this._expandedCards[id] = !this._expandedCards[id];
        this.render();
      });
    });

    // Scroll to expanded card if clipExpandId was passed
    if (this.clipExpandId) {
      const target = this.shadowRoot.querySelector(`[data-clip-id="${this.clipExpandId}"]`);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    }
  }
}

customElements.define('hornero-actualidad', HorneroActualidad);
