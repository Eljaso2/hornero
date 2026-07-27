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

  static get AUDIO_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/audio';
    }
    return 'https://hornero-ia.onrender.com/api/audio';
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
    this._username = ''; // login username for per-user data isolation
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
          username="${this._username}"
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
      // Listen for audio message from mic recording
      chatEl.addEventListener('chat-audio', (e) => {
        this._handleAudioMessage(e.detail.audioBlob, e.detail.duration, e.detail.fileName);
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
      chatEl.username = this._username;
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
    // Only match explicit export requests, not incidental words in normal conversation
    const lower = text.toLowerCase().trim();
    const isExportRequest = lower.match(/^(exportar|descargar|guardar documento|download|export)\b/) ||
      lower.match(/\b(exportar chat|exportar informe|descargar chat|descargar informe|exportar conversación|descargar conversación)\b/);
    if (isExportRequest) {
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
  async _handleReporteAction(detail) {
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

        // Save to IndexedDB as informe — AWAIT to catch errors
        try {
          await this._saveInforme(reportMsg);
        } catch(e) {
          console.warn('Gremial: informe save failed', e);
          this.messages = [...this.messages, {
            role: 'hornero',
            text: '⚠️ Error al guardar el informe. Intentá de nuevo más tarde.',
            tags: ['reporte', 'informe-error'],
            time: this._timeNow(),
          }];
          this.render();
          return;
        }

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
      username: session.username || this._username || '',
    };
    try {
      if (typeof guardarInforme === 'function') await guardarInforme(informe);
    } catch(e) { console.warn('Gremial: informe save failed', e); }
  }

  // ===== Fallback offline =====
  // ===== Audio message handling =====
  _handleAudioMessage(audioBlob, duration, fileName) {
    const durationStr = duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00';
    const userMsg = { role: 'user', text: `🎤 Audio (${durationStr})`, audio: true, duration, time: this._timeNow() };
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    if (isFirstUserMsg) userMsg.title = 'Audio reporte';
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    this._callAudioBackend(audioBlob, fileName).catch(() => {
      this.messages = [...this.messages, this._localResponse('audio reporte')];
      this._typing = false;
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this.render();
    });
  }

  async _callAudioBackend(audioBlob, fileName) {
    const history = this.messages.slice(-7, -1).map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const formData = new FormData();
    formData.append('audio', audioBlob, fileName || 'recording.webm');
    formData.append('formato', 'reporte');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', 'relator');
    formData.append('history', JSON.stringify(history));

    const response = await fetch(HorneroGremial.AUDIO_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Audio backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['reporte', 'audio'],
      persona: data.persona || 'relator',
      time: data.time || this._timeNow(),
    }];
    this._activePersona = data.persona || 'relator';
    this._typing = false;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) chatEl.resetAudioState();
    this._saveChatHistory();
    this.render();
  }

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
            m.username = this._username;
          }
          await guardarChatMsg(m);
        }
      }
    } catch(e) { console.warn('Gremial: chat history save failed', e); }
  }

  // ===== Export current chat as downloadable TXT document =====
  _exportCurrentChat() {
    if (!this.messages || this.messages.length === 0) return;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      const firstUserMsg = this.messages.find(m => m.role === 'user');
      const title = firstUserMsg && firstUserMsg.title ? firstUserMsg.title : 'Reporte Gremial';
      chatEl._downloadTxt(this.messages, title, title);
      // Add confirmation message
      this.messages = [...this.messages, {
        role: 'hornero',
        text: '📥 Documento exportado. Lo descargaste como archivo TXT — lo puedes abrir en cualquier editor de texto, imprimir, o compartir.',
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
        this._username = session.username || '';
        return {
          nombre: session.nombre || 'Trabajador',
          funcion: rolMap[session.grade] || 'Base',
          territorio: session.territory || '',
          empresa: session.agremiacion ? session.agremiacion.empresa : 'Piloto',
          puesto: session.agremiacion ? session.agremiacion.puesto : '',
          username: session.username || '',
          trabajador: { nombre: session.nombre || 'Trabajador', funcion: rolMap[session.grade] || 'Base', seccion: '' },
        };
      }
    } catch(e) {}
    this._username = '';
    return { nombre: 'Trabajador', funcion: 'Base', territorio: '', empresa: 'Piloto', puesto: '', username: '', trabajador: { nombre: 'Trabajador', funcion: 'Base', seccion: '' } };
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
