// ===== <hornero-gremial> — Reporte Gremial (Chat IA) =====
// Chat-based report workflow: IA escucha → genera informe → revisión → aprobación → guardado
// Companion skill del Debate — Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroGremial extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      messages: Array,
    };
  }

  // ===== Backend URLs =====
  static get API_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat';
    }
    return 'https://hornero-ia.onrender.com/api/chat';
  }

  static get GREETING_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/greeting';
    }
    return 'https://hornero-ia.onrender.com/api/greeting';
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this._chatSection = 'reporte';
    this.messages = [];
    this._typing = false;
    this._greetingRequested = false;
    this._historyLoaded = false;
    this._sessionId = '';
    this._informeBadge = false;
    this._activePersona = 'relator'; // Gremial always uses relator persona
  }

  connectedCallback() {
    super.connectedCallback();
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }
      .chat-container { display: flex; flex-direction: column; height: 100%; }
    `;
  }

  _render() {
    return html`
      <div class="chat-container">
        <hornero-chat
          title="Reporte Gremial"
          input-placeholder="Contá tu situación, lo que viste, lo que te pasó..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="reporte"
          history-title="Mis Informes"
          informes-title="Informes"
          persona="${this._activePersona}"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._syncChatMessages(chatEl);
      chatEl.addEventListener('chat-send', (e) => {
        this._handleUserMessage(e.detail.text);
      });
      chatEl.addEventListener('chat-session-select', (e) => {
        this._loadSession(e.detail.sessionId);
      });
      chatEl.addEventListener('chat-session-delete', (e) => {
        // If current session was deleted, start fresh
        if (e.detail.sessionId === this._sessionId) {
          this.messages = [];
          this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now();
          this.render();
        }
      });
      chatEl.addEventListener('reporte-action', (e) => {
        this._handleReporteAction(e.detail);
      });
      chatEl.addEventListener('informes-open', () => {
        this._informeBadge = false;
        this._syncChatMessages(chatEl);
      });
      chatEl.addEventListener('informes-select', (e) => {
        // Could load informe or open session — for now just log
        console.log('Gremial: informe selected', e.detail.informeId);
      });
      // After chat self-renders (drawer close/delete), re-sync messages without chat render
      chatEl.addEventListener('chat-state-changed', () => {
        this._syncChatMessages(chatEl);
      });
    }
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }
  }

  async _loadChatHistory() {
    this._historyLoaded = true;
    if (this.messages.length === 0 && !this._greetingRequested) {
      this._requestGreeting();
    }
  }

  // Load an existing session from history
  async _loadSession(sessionId) {
    try {
      if (typeof obtenerChatSessionMessages === 'function') {
        const saved = await obtenerChatSessionMessages(sessionId);
        if (saved && saved.length > 0) {
          this._sessionId = sessionId;
          this.messages = saved;
          this._historyLoaded = true;
          this.render();
        }
      }
    } catch(e) { console.warn('Gremial: session load failed', e); }
  }

  _syncChatMessages(chatEl) {
    if (chatEl) {
      chatEl.messages = this.messages;
      chatEl.typing = this._typing;
      chatEl.section = this._chatSection;
      chatEl.sessionId = this._sessionId;
      chatEl.historyTitle = 'Mis Informes';
      chatEl.informesTitle = 'Informes';
      chatEl.informeBadge = this._informeBadge;
      chatEl.persona = this._activePersona;
      // Do NOT call chatEl.render() here — the chat re-renders itself
      // when its attributes change (from gremial render) or from drawer open/close.
      // Double render was causing the blank screen bug.
    }
  }

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await fetch(HorneroGremial.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'reporte',
          grade: this.grade,
          sector: this.sector,
          requested_persona: 'relator',
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['reporte', 'greeting'],
        persona: data.persona || 'relator',
        time: data.time || this._timeNow(),
      }];
      this._typing = false;
      this._greetingRequested = false;
      this._saveChatHistory();
      this.render();
    } catch (e) {
      this._typing = false;
      this._greetingRequested = false;
      this.messages = [this._localGreeting()];
      this.render();
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      text: '¿Cómo andaste estos últimos días? ¿Hay alguna situación que quieras reportar — condiciones, seguridad, ritmo, algo que te pasó o que viste?',
      tags: ['reporte', 'saludo'],
      time: this._timeNow(),
    };
  }

  // ===== Generate a descriptive chat title from the user's first message =====
  _generateTitle(text, section) {
    const t = (text || '').toLowerCase().trim();
    const keywords = [
      ['paritaria', 'Paritaria aceitera'],
      ['salario mínimo', 'SMVM y salario'],
      ['smvm', 'SMVM y salario'],
      ['condiciones', 'Reporte de condiciones'],
      ['seguridad', 'Reporte de seguridad'],
      ['accidente', 'Accidente laboral'],
      ['art', 'Reporte ART'],
      ['despidos', 'Despidos y estabilidad'],
      ['estabilidad', 'Reporte de estabilidad'],
      ['jornada', 'Jornada laboral'],
      ['horas extra', 'Horas extras'],
      ['contrato', 'Contrato de trabajo'],
      ['sindicato', 'Organización sindical'],
      ['delegado', 'Delegados y representación'],
      ['acoso', 'Acoso laboral'],
      ['discriminación', 'Discriminación laboral'],
      ['reporte', 'Reporte de situación'],
      ['situación', 'Situación laboral'],
      ['trabajo', 'Situación laboral'],
      ['insalubridad', 'Insalubridad'],
      ['rhythm', 'Ritmo de trabajo'],
      ['ritmo', 'Ritmo de trabajo'],
      ['maltrato', 'Maltrato laboral'],
      ['firma', 'Firma y documentación'],
      ['convenio', 'Convenio colectivo'],
      ['organización', 'Organización sindical'],
    ];
    for (const [kw, title] of keywords) {
      if (t.includes(kw)) return title;
    }
    const clean = text.trim().replace(/[?!.]+$/, '').substring(0, 50);
    return clean.length > 10 ? clean + '…' : 'Reporte';
  }

  _handleUserMessage(text) {
    // Detect export keywords — download current chat or last reporte as document
    const lower = text.toLowerCase().trim();
    const exportKeywords = ['exportar', 'descargar', 'documento', 'guardar documento', 'bajar', 'download', 'export'];
    if (exportKeywords.some(kw => lower.includes(kw))) {
      this._exportCurrentChat();
      return;
    }

    // Generate title for session from the first user message
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    const title = isFirstUserMsg ? this._generateTitle(text, 'reporte') : undefined;
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    if (title) userMsg.title = title;
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    this._callBackend(text).catch(() => {
      this.messages = [...this.messages, this._localResponse(text)];
      this._typing = false;
      this.render();
    });
  }

  async _callBackend(text) {
    const history = this.messages.slice(-7, -1).map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(HorneroGremial.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'reporte',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'relator',
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['reporte'],
      persona: data.persona || 'relator',
      time: data.time || this._timeNow(),
    }];
    this._typing = false;
    this._saveChatHistory();
    this.render();
  }

  // ===== Reporte action handler =====
  _handleReporteAction(detail) {
    if (detail.action === 'aprobar') {
      // Find the last reporte-generado message
      const reportMsg = [...this.messages].reverse().find(m =>
        m.role === 'hornero' && m.tags && m.tags.includes('reporte-generado') && !m.tags.includes('reporte-aprobado')
      );
      if (reportMsg) {
        // Mark the original as approved
        const idx = this.messages.indexOf(reportMsg);
        if (idx >= 0) {
          reportMsg.tags = [...(reportMsg.tags || []), 'reporte-aprobado'];
          this.messages[idx] = reportMsg;
        }

        // Save to IndexedDB as informe
        this._saveInforme(reportMsg);

        // Activate informe badge (icon turns green-pale)
        this._informeBadge = true;

        // Add confirmation message
        this.messages = [...this.messages, {
          role: 'hornero',
          text: '✅ Informe aprobado y guardado en tu archivo. ¿Querés reportar otra situación?',
          tags: ['reporte', 'informe-guardado'],
          time: this._timeNow(),
        }];
        this._saveChatHistory();
        this.render();
      }
    } else if (detail.action === 'corregir') {
      // Mark current draft as needing correction and prompt worker
      this.messages = [...this.messages, {
        role: 'hornero',
        text: '¿Qué querés corregir del informe? Decime qué cambiar y lo ajusto.',
        tags: ['reporte', 'correccion-pendiente'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  async _saveInforme(reportMsg) {
    const id = typeof generarUUID === 'function' ? generarUUID() : 'h-' + Date.now();
    const session = this._getSession();
    const informe = {
      id: 'g1-' + id,
      grado: 1,
      fecha: new Date().toISOString().slice(0, 10),
      semana: this._getCurrentWeek(),
      trabajador: session.trabajador,
      empresa: session.empresa || 'Piloto',
      localidad: '',
      territorio: session.territorio || '',
      contenido: reportMsg.text || '',
      sections: reportMsg.sections || [],
      etiquetas: { temas: (reportMsg.tags || []).filter(t => t !== 'reporte' && t !== 'reporte-generado' && t !== 'reporte-aprobado') },
      datosDuros: [],
      estado: 'aceptado',
    };
    try {
      if (typeof guardarInforme === 'function') await guardarInforme(informe);
    } catch(e) { console.warn('Gremial: informe save failed', e); }
  }

  // ===== Fallback offline =====
  _localResponse(userText) {
    // Generate a simple report card from the user text
    return {
      role: 'hornero',
      text: 'Leelo con cuidado. ¿Es esto lo que querías decir o hay algo para modificar?',
      sections: [
        { title: 'Observación G1', body: userText },
        { title: 'Situación reportada', body: 'El trabajador reporta: ' + userText.substring(0, 200) },
      ],
      tags: ['reporte-generado', 'observacion', 'reporte'],
      time: this._timeNow(),
    };
  }

  _timeNow() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' +
           now.getMinutes().toString().padStart(2, '0');
  }

  async _saveChatHistory() {
    try {
      if (typeof guardarChatMsg === 'function') {
        for (const m of this.messages) {
          if (!m.id) {
            m.id = typeof generarUUID === 'function' ? generarUUID() : 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            m.section = this._chatSection;
            m.sessionId = this._sessionId;
            m.timestamp = Date.now();
          }
          await guardarChatMsg(m);
        }
      }
    } catch(e) { console.warn('Gremial: chat history save failed', e); }
  }

  // ===== Export current chat as downloadable HTML document =====
  _exportCurrentChat() {
    if (!this.messages || this.messages.length === 0) return;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      const firstUserMsg = this.messages.find(m => m.role === 'user');
      const title = firstUserMsg && firstUserMsg.title ? firstUserMsg.title : 'Reporte Gremial';
      chatEl._downloadHtml(this.messages, title, title);
      // Add confirmation message
      this.messages = [...this.messages, {
        role: 'hornero',
        text: '📥 Documento exportado. Lo descargaste como archivo HTML — lo puedes abrir en cualquier navegador, imprimir, o compartir.',
        tags: ['reporte', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  // ===== Helpers =====
  _getSession() {
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session) {
        const rolMap = { 'B.d': 'Federación', 'B.c': 'Secretaria', 'B.b': 'Delegada', 'B.a': 'Base' };
        return {
          nombre: session.nombre || 'Trabajador',
          funcion: rolMap[session.grade] || 'Base',
          territorio: session.territory || '',
          empresa: session.agremiacion ? session.agremiacion.empresa : 'Piloto',
          puesto: session.agremiacion ? session.agremiacion.puesto : '',
          trabajador: { nombre: session.nombre || 'Trabajador', funcion: rolMap[session.grade] || 'Base', seccion: '' },
        };
      }
    } catch(e) {}
    return { nombre: 'Trabajador', funcion: 'Base', territorio: '', empresa: 'Piloto', puesto: '', trabajador: { nombre: 'Trabajador', funcion: 'Base', seccion: '' } };
  }

  _getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000;
    const weekNum = Math.ceil((diff / oneWeek) + 1);
    return now.getFullYear() + '-W' + (weekNum < 10 ? '0' : '') + weekNum;
  }
}

customElements.define('hornero-gremial', HorneroGremial);
