// ===== <hornero-archivo> — Esfera 6: Archivo del sindicato =====
// Biblioteca: documentos, académicos, multimedia
// Browsable + searchable KB chunks from backend
// "Consultar con IA" → navigates to chat
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroArchivo extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      tab: String,        // 'buscar' | 'fuentes' | 'multimedia'
      query: String,      // search query text
      results: Array,     // search results from /api/kb/search
      allChunks: Array,   // all chunks from /api/kb (list view)
      categories: Object, // category metadata from /api/kb
      tipos: Array,       // tipo list from /api/kb
      tipoFilter: String, // selected tipo filter
      categoryFilter: String, // selected category filter
      expandedId: String, // currently expanded chunk id
      loading: Boolean,   // loading state
    };
  }

  // ===== Backend URLs =====
  static get KB_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/kb';
    }
    return 'https://hornero-ia.onrender.com/api/kb';
  }

  static get KB_SEARCH_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/kb/search';
    }
    return 'https://hornero-ia.onrender.com/api/kb/search';
  }

  static get KB_CHUNK_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/kb';
    }
    return 'https://hornero-ia.onrender.com/api/kb';
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.tab = 'buscar';
    this.query = '';
    this.results = [];
    this.allChunks = [];
    this.categories = {};
    this.tipos = [];
    this.tipoFilter = '';
    this.categoryFilter = '';
    this.expandedId = '';
    this.loading = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    // Try to load cached chunks from IndexedDB
    if (typeof dbGet === 'function' && typeof dbGetAll === 'function') {
      try {
        var cached = await dbGetAll('biblioteca');
        if (cached && cached.length > 0) {
          this.allChunks = cached;
        }
      } catch(e) { console.warn('Archivo: IndexedDB read failed', e); }
    }
    // Fetch fresh chunks from backend
    this._fetchChunks();
  }

  async _fetchChunks() {
    this.loading = true;
    var url = HorneroArchivo.KB_URL;
    if (this.categoryFilter) url += '?category=' + this.categoryFilter;
    if (this.tipoFilter) url += (url.includes('?') ? '&' : '?') + 'tipo=' + this.tipoFilter;

    try {
      var resp = await fetch(url);
      if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
      var data = await resp.json();
      this.set('allChunks', data.chunks || []);
      this.set('categories', data.categories || {});
      this.set('tipos', data.tipos || []);
      this.loading = false;
      // Cache chunks in IndexedDB
      this._cacheChunks(data.chunks);
    } catch(e) {
      console.warn('Archivo: backend fetch failed, using cached', e);
      this.loading = false;
    }
  }

  _cacheChunks(chunks) {
    if (typeof dbPut !== 'function') return;
    chunks.forEach(function(c) {
      dbPut('biblioteca', c).catch(function(e) { console.warn('Cache chunk failed', e); });
    });
  }

  async _searchChunks(q) {
    if (!q || q.length < 2) { this.set('results', []); return; }
    this.loading = true;
    try {
      var resp = await fetch(HorneroArchivo.KB_SEARCH_URL + '?q=' + encodeURIComponent(q));
      if (!resp.ok) throw new Error('Search failed: ' + resp.status);
      var data = await resp.json();
      this.set('results', data.results || []);
      this.loading = false;
    } catch(e) {
      // Fallback: local keyword search on cached chunks
      this._localSearch(q);
      this.loading = false;
    }
  }

  _localSearch(q) {
    // Offline fallback: keyword search on cached chunks
    var terms = q.toLowerCase().split();
    var stopWords = ['que', 'el', 'la', 'de', 'en', 'es', 'se', 'no', 'si', 'yo', 'me', 'mi', 'tu', 'te', 'y', 'o', 'a', 'al', 'por', 'para', 'con', 'sin'];
    terms = terms.filter(function(t) { return t.length > 2 && stopWords.indexOf(t) === -1; });
    var scored = [];
    this.allChunks.forEach(function(c) {
      var searchable = (c.title + ' ' + (c.excerpt || c.text || '') + ' ' + (c.tags || []).join(' ')).toLowerCase();
      var score = 0;
      terms.forEach(function(t) { if (searchable.indexOf(t) !== -1) score++; });
      if (score > 0) scored.push(Object.assign({}, c, { relevance_score: score }));
    });
    scored.sort(function(a, b) { return b.relevance_score - a.relevance_score; });
    this.set('results', scored.slice(0, 10));
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }
      .scroll { flex: 1; overflow-y: auto; padding: 20px 16px;
        -webkit-overflow-scrolling: touch; }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 8px; }
      .section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); margin-bottom: 4px; }
      .intro { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-bottom: 16px; }

      /* ===== Tab bar ===== */
      .tab-bar { display: flex; gap: 0; margin-bottom: 16px;
        border-bottom: 1px solid var(--ho-border, rgba(43,42,38,.12)); }
      .tab-btn { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        background: none; border: none; cursor: pointer;
        padding: 8px 14px; border-bottom: 2px solid transparent;
        transition: color .2s, border-color .2s; }
      .tab-btn.active { color: var(--ho-green, #6E8345);
        border-bottom-color: var(--ho-green, #6E8345); }

      /* ===== Search ===== */
      .search-wrap { display: flex; gap: 8px; margin-bottom: 16px; }
      .search-input { flex: 1; font-family: 'Public Sans', sans-serif;
        font-size: .84rem; padding: 10px 12px; border-radius: 10px;
        border: 1px solid var(--ho-border, rgba(43,42,38,.15));
        background: var(--ho-card, #FBFAF6); color: var(--ho-text, #2B2A26);
        outline: none; transition: border-color .2s; }
      .search-input:focus { border-color: var(--ho-green, #6E8345); }
      .search-input::placeholder { color: var(--ho-text-light, #9C988D); }
      .search-btn { background: var(--ho-green, #6E8345); color: #fff;
        border: none; border-radius: 10px; padding: 10px 14px; cursor: pointer;
        font-family: 'Archivo', sans-serif; font-size: .76rem; font-weight: 600;
        transition: background .2s; }
      .search-btn:hover { background: var(--ho-green-dark, #586B33); }

      /* ===== Tipo filter ===== */
      .tipo-bar { display: flex; gap: 8px; margin-bottom: 14px; }
      .tipo-btn { font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        background: var(--ho-card, #FBFAF6); border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 8px; padding: 6px 10px; cursor: pointer;
        transition: background .2s, color .2s, border-color .2s; }
      .tipo-btn.active { background: var(--ho-green, #6E8345); color: #fff;
        border-color: var(--ho-green, #6E8345); }

      /* ===== Category cards ===== */
      .cat-grid { display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 10px; margin-bottom: 16px; }
      .cat-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 12px; cursor: pointer;
        transition: border-color .2s; }
      .cat-card:hover { border-color: var(--ho-green, #6E8345); }
      .cat-icon { font-size: 1rem; margin-bottom: 4px; }
      .cat-label { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; color: var(--ho-text, #2B2A26); }
      .cat-desc { font-size: .72rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.3; margin-top: 2px; }

      /* ===== Chunk cards ===== */
      .chunk-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s, background .2s; }
      .chunk-card:hover { border-color: var(--ho-green, #6E8345);
        background: var(--ho-green-pale, #E8EDD7); }
      .chunk-card.expanded { cursor: default; }

      .chunk-header { display: flex; align-items: center; gap: 10px; }
      .chunk-badge { font-size: .86rem; flex: none; }
      .chunk-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); flex: 1; }
      .chunk-score { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-green-dark, #586B33); flex: none; }

      .chunk-excerpt { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 6px; }
      .chunk-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
      .chunk-tag { font-family: 'JetBrains Mono', monospace; font-size: .60rem;
        font-weight: 600; color: var(--ho-green-dark, #586B33);
        background: var(--ho-green-pale, #E8EDD7); border-radius: 6px;
        padding: 2px 6px; }
      .chunk-source { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 6px; }

      /* ===== Expanded chunk ===== */
      .chunk-full { margin-top: 12px; font-size: .82rem;
        color: var(--ho-text, #2B2A26); line-height: 1.5;
        white-space: pre-wrap; padding: 10px;
        background: rgba(110,131,68,.04); border-radius: 8px; }
      .chunk-full-quote { background: var(--ho-green-pale, #E8EDD7);
        border-radius: 8px; padding: 10px 12px; margin-top: 10px;
        font-size: .82rem; color: var(--ho-green-dark, #586B33);
        line-height: 1.5; font-style: italic; }
      .chunk-full-quote-author { font-size: .72rem; color: var(--ho-text-mid, #6E6A60);
        margin-top: 4px; font-style: normal; font-weight: 600; }

      /* ===== Actions ===== */
      .chunk-actions { display: flex; gap: 8px; margin-top: 12px; }
      .action-btn { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; border-radius: 8px; padding: 8px 14px; cursor: pointer;
        transition: background .2s, color .2s; }
      .action-ia { background: var(--ho-green, #6E8345); color: #fff;
        border: none; }
      .action-ia:hover { background: var(--ho-green-dark, #586B33); }
      .action-collapse { background: none; color: var(--ho-text-mid, #6E6A60);
        border: 1px solid var(--ho-border, rgba(43,42,38,.15)); }
      .action-collapse:hover { border-color: var(--ho-text, #2B2A26);
        color: var(--ho-text, #2B2A26); }

      /* ===== Empty state ===== */
      .empty { text-align: center; padding: 30px 20px; color: var(--ho-text-light, #9C988D);
        font-size: .82rem; }
      .empty-icon { font-size: 2rem; margin-bottom: 8px; }

      /* ===== Loading ===== */
      .loading { text-align: center; padding: 20px; color: var(--ho-text-light, #9C988D);
        font-size: .78rem; }

      /* ===== Tipo colors ===== */
      .tipo-doc { color: #6E8345; }
      .tipo-acad { color: #586B33; }
      .tipo-mult { color: #94A867; }
    `;
  }

  _tipoBadge(tipo) {
    var map = { documento: '📄', academico: '📚', multimedia: '📰' };
    return map[tipo] || '📄';
  }

  _tipoClass(tipo) {
    var map = { documento: 'tipo-doc', academico: 'tipo-acad', multimedia: 'tipo-mult' };
    return map[tipo] || '';
  }

  _render() {
    var tabContent = '';

    if (this.tab === 'buscar') {
      tabContent = this._renderBuscar();
    } else if (this.tab === 'fuentes') {
      tabContent = this._renderFuentes();
    } else if (this.tab === 'multimedia') {
      tabContent = this._renderMultimedia();
    }

    return html`
      <div class="scroll">
        <div class="kicker">📚 ARCHIVO DEL SINDICATO</div>
        <div class="section-title">La memoria del sindicato</div>
        <div class="intro">Convenios, referentes, fuentes sindicales. Explorá, buscá, consultá con la IA.</div>

        <div class="tab-bar">
          <button class="tab-btn${this.tab === 'buscar' ? ' active' : ''}" data-tab="buscar">🔍 Buscar</button>
          <button class="tab-btn${this.tab === 'fuentes' ? ' active' : ''}" data-tab="fuentes">📄 Fuentes</button>
          <button class="tab-btn${this.tab === 'multimedia' ? ' active' : ''}" data-tab="multimedia">📰 Multimedia</button>
        </div>

        ${tabContent}
      </div>
    `;
  }

  _renderBuscar() {
    var resultsHtml = '';
    if (this.loading) {
      resultsHtml = '<div class="loading">Buscando...</div>';
    } else if (this.results.length > 0) {
      resultsHtml = this.results.map(function(r) {
        return this._renderChunkCard(r);
      }).join('');
    } else if (this.query && this.query.length >= 2) {
      resultsHtml = '<div class="empty"><div class="empty-icon">🔍</div>No se encontraron resultados para "' + this.query + '"</div>';
    } else {
      resultsHtml = '<div class="empty"><div class="empty-icon">🔎</div>Escribí al menos 2 letras para buscar</div>';
    }

    return html`
      <div class="search-wrap">
        <input class="search-input" id="searchInput" type="text"
          placeholder="Buscar en el archivo..." value="${this.query}">
        <button class="search-btn" id="searchBtn">Buscar</button>
      </div>
      ${resultsHtml}
    `;
  }

  _renderFuentes() {
    var catKeys = Object.keys(this.categories || {});
    var catCards = catKeys.map(function(k) {
      var meta = this.categories[k];
      return html`<div class="cat-card" data-category="${k}">
        <div class="cat-icon">${meta.icon || '📄'}</div>
        <div class="cat-label">${meta.label || k}</div>
        <div class="cat-desc">${meta.desc || ''}</div>
      </div>`;
    }).join('');

    // Show chunks filtered by tipo/category
    var filteredChunks = this.allChunks;
    if (this.tipoFilter) {
      filteredChunks = filteredChunks.filter(function(c) { return c.tipo === this.tipoFilter; }.bind(this));
    }
    if (this.categoryFilter) {
      filteredChunks = filteredChunks.filter(function(c) { return c.category === this.categoryFilter; }.bind(this));
    }

    var chunksHtml = filteredChunks.map(function(c) {
      return this._renderChunkCard(c);
    }).join('');

    if (filteredChunks.length === 0 && !this.loading) {
      chunksHtml = '<div class="empty"><div class="empty-icon">📂</div>No hay fuentes en esta categoría</div>';
    }

    return html`
      <div class="tipo-bar">
        <button class="tipo-btn${this.tipoFilter === '' ? ' active' : ''}" data-tipo="">Todos</button>
        <button class="tipo-btn${this.tipoFilter === 'documento' ? ' active' : ''}" data-tipo="documento">📄 Documentos</button>
        <button class="tipo-btn${this.tipoFilter === 'academico' ? ' active' : ''}" data-tipo="academico">📚 Académicos</button>
      </div>

      ${this.categoryFilter ? '' : html`<div class="cat-grid">${catCards}</div>`}

      ${this.categoryFilter ? html`<div class="kicker">${(this.categories[this.categoryFilter] || {}).label || this.categoryFilter}</div>` : ''}

      ${this.loading ? '<div class="loading">Cargando fuentes...</div>' : chunksHtml}
    `;
  }

  _renderMultimedia() {
    // Filter multimedia chunks
    var multiChunks = this.allChunks.filter(function(c) { return c.tipo === 'multimedia'; });

    var chunksHtml = multiChunks.map(function(c) {
      return this._renderChunkCard(c);
    }).join('');

    if (multiChunks.length === 0 && !this.loading) {
      chunksHtml = '<div class="empty"><div class="empty-icon">📰</div>No hay contenido multimedia todavía.<br>Se agregarán notas periodísticas, YouTube, Reels IG.</div>';
    }

    return html`
      ${this.loading ? '<div class="loading">Cargando multimedia...</div>' : chunksHtml}
    `;
  }

  _renderChunkCard(chunk) {
    var isExpanded = this.expandedId === chunk.id;
    var badge = this._tipoBadge(chunk.tipo);
    var tipoClass = this._tipoClass(chunk.tipo);
    var excerpt = chunk.excerpt || '';
    var tags = (chunk.tags || []).slice(0, 6);
    var source = (chunk.sources || []).slice(0, 2).join(' · ');
    var scoreHtml = chunk.relevance_score ? html`<span class="chunk-score">+${chunk.relevance_score}</span>` : '';

    var expandedHtml = '';
    if (isExpanded) {
      // Fetch full chunk content
      var fullText = chunk.text || chunk.excerpt || '';
      var quotesHtml = '';
      if (chunk.quotes && chunk.quotes.length > 0) {
        quotesHtml = chunk.quotes.map(function(q) {
          return html`<div class="chunk-full-quote">"${q.text}"<div class="chunk-full-quote-author">— ${q.author}, ${q.source}</div></div>`;
        }).join('');
      }
      expandedHtml = html`
        <div class="chunk-full">${fullText}</div>
        ${quotesHtml}
        <div class="chunk-actions">
          <button class="action-btn action-ia" data-chunk-id="${chunk.id}" data-chunk-title="${chunk.title}">🤖 Consultar con IA</button>
          <button class="action-btn action-collapse" data-collapse>Cerrar</button>
        </div>
      `;
    }

    return html`
      <div class="chunk-card${isExpanded ? ' expanded' : ''}" data-chunk-id="${chunk.id}">
        <div class="chunk-header">
          <span class="chunk-badge ${tipoClass}">${badge}</span>
          <span class="chunk-title">${chunk.title}</span>
          ${scoreHtml}
        </div>
        ${!isExpanded ? html`<div class="chunk-excerpt">${excerpt}</div>` : ''}
        ${!isExpanded ? html`<div class="chunk-tags">${tags.map(function(t) { return html`<span class="chunk-tag">${t}</span>`; }).join('')}</div>` : ''}
        <div class="chunk-source">${source}</div>
        ${expandedHtml}
      </div>
    `;
  }

  async _afterRender() {
    // Tab buttons
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.set('tab', btn.dataset.tab);
        this.set('expandedId', '');
        if (btn.dataset.tab === 'fuentes') this._fetchChunks();
      }.bind(this));
    });

    // Search input + button
    var searchInput = this.shadowRoot.querySelector('#searchInput');
    var searchBtn = this.shadowRoot.querySelector('#searchBtn');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        this.query = searchInput.value;
      }.bind(this));
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') this._searchChunks(searchInput.value);
      }.bind(this));
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        this._searchChunks(searchInput ? searchInput.value : this.query);
      }.bind(this));
    }

    // Tipo filter buttons
    this.shadowRoot.querySelectorAll('.tipo-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.set('tipoFilter', btn.dataset.tipo);
        this._fetchChunks();
      }.bind(this));
    });

    // Category cards
    this.shadowRoot.querySelectorAll('.cat-card').forEach(function(card) {
      card.addEventListener('click', function() {
        this.set('categoryFilter', card.dataset.category);
        this._fetchChunks();
      }.bind(this));
    });

    // Chunk cards — expand/collapse
    this.shadowRoot.querySelectorAll('.chunk-card:not(.expanded)').forEach(function(card) {
      card.addEventListener('click', function() {
        var chunkId = card.dataset.chunkId;
        // Fetch full chunk content then expand
        this._expandChunk(chunkId);
      }.bind(this));
    });

    // Expanded chunk — action buttons
    this.shadowRoot.querySelectorAll('.action-ia').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var title = btn.dataset.chunkTitle || '';
        // Navigate to chat with pre-loaded query
        this.emit('screen-change', { screen: 'consulta', preQuery: 'Quiero saber más sobre: ' + title });
      }.bind(this));
    });

    this.shadowRoot.querySelectorAll('.action-collapse').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.set('expandedId', '');
      }.bind(this));
    });
  }

  async _expandChunk(chunkId) {
    // Try to find chunk in cached data first
    var cached = this.allChunks.find(function(c) { return c.id === chunkId; });
    if (cached && cached.text) {
      this.set('expandedId', chunkId);
      return;
    }

    // Fetch full chunk from backend
    try {
      var resp = await fetch(HorneroArchivo.KB_CHUNK_URL + '/' + chunkId);
      if (resp.ok) {
        var fullChunk = await resp.json();
        // Merge full text into allChunks
        var updated = this.allChunks.map(function(c) {
          if (c.id === chunkId) return Object.assign({}, c, fullChunk);
          return c;
        });
        this.set('allChunks', updated);
        this.set('expandedId', chunkId);
      }
    } catch(e) {
      console.warn('Archivo: fetch chunk failed', e);
      // Still expand with excerpt
      this.set('expandedId', chunkId);
    }
  }
}

customElements.define('hornero-archivo', HorneroArchivo);
