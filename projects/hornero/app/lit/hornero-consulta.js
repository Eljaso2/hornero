// ===== <hornero-consulta> — Consulta legal =====
// Chat directo — IA inicia diálogo saludando y explicando qué se puede consultar
// Backend LLM (DashScope/Claude) + fallback offline con KB local
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroConsulta extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,  // Initial persona from Mesa de Trabajo landing
      messages: Array,
      iaStep: Number,
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
    this._chatSection = 'consulta'; // Section key for history
    this.messages = [];
    this.iaStep = 0;
    this._typing = false; this._greetingRequested = false;
    this._historyLoaded = false;
    this._sessionId = ''; // Current session ID — new on each visit
    this._activePersona = 'abogado'; // Default — overridden by persona attribute from Mesa landing
    this._username = ''; // login username for per-user data isolation
  }

  connectedCallback() {
    super.connectedCallback();
    // Don't generate sessionId yet — _loadChatHistory will restore or create
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }
      .chat-container { display: flex; flex-direction: column; height: 100%; }
    `;
  }

  _render() {
    return html`
      <div class="chat-container">
        <hornero-chat
          title="Chateá con el Abogado/a"
          input-placeholder="Escribí tu consulta, pregunta, o tema..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          persona="${this._activePersona}"
          username="${this._username}"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    // Use persona attribute from Mesa landing if provided
    if (this.persona && this.persona !== this._activePersona) {
      this._activePersona = this.persona;
    }
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._syncChatMessages(chatEl);
      chatEl.addEventListener('chat-send', (e) => {
        this._handleUserMessage(e.detail.text);
      });
      // Listen for session selection from history drawer
      chatEl.addEventListener('chat-session-select', (e) => {
        this._loadSession(e.detail.sessionId);
      });
      // Listen for session deletion from history drawer
      chatEl.addEventListener('chat-session-delete', (e) => {
        if (e.detail.sessionId === this._sessionId) {
          this.messages = [];
          this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now();
          this.render();
        }
      });
      // Delete individual message — remove from local array + IndexedDB
      chatEl.addEventListener('chat-message-delete', (e) => {
        const { msgIndex, msg } = e.detail;
        if (msgIndex >= 0 && msgIndex < this.messages.length) {
          this.messages.splice(msgIndex, 1);
          // Delete from IndexedDB if msg has an id
          if (msg && msg.id && typeof borrarChatMsg === 'function') {
            borrarChatMsg(msg.id);
          }
          this.render();
        }
      });
      // Listen for persona navigate from top-bar icons
      chatEl.addEventListener('persona-navigate', (e) => {
        this._handlePersonaNavigate(e.detail.persona, e.detail.screen);
      });
      // Listen for persona redirect from derivation button
      chatEl.addEventListener('persona-redirect', (e) => {
        this._handlePersonaNavigate(e.detail.persona);
      });
      // Listen for audio message from mic recording
      chatEl.addEventListener('chat-audio', (e) => {
        this._handleAudioMessage(e.detail.audioBlob, e.detail.duration, e.detail.fileName);
      });
      // Listen for export from toolbar button — add download card message
      chatEl.addEventListener('chat-export', (e) => {
        this._handleChatExport(e.detail);
      });
      // Listen for "Nuevo chat" button from history drawer
      chatEl.addEventListener('chat-new-session', () => {
        this._startNewSession();
      });
    }

    // Load history from IndexedDB first, then request greeting if empty
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }
  }

  async _loadChatHistory() {
    if (this._historyLoaded) return;
    this._historyLoaded = true;

    // Try to restore the most recent session for this section + username
    if (typeof obtenerChatSessions === 'function' && this._username) {
      try {
        const sessions = await obtenerChatSessions(this._username);
        const mySessions = sessions.filter(s => s.section === this._chatSection);
        if (mySessions.length > 0) {
          const latestSession = mySessions[0]; // sorted by timestamp desc
          await this._loadSession(latestSession.sessionId);
          return; // Session restored, no greeting needed
        }
      } catch(e) { console.warn('Consulta: session restore failed', e); }
    }

    // No previous session found — start fresh
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
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
    } catch(e) { console.warn('Consulta: session load failed', e); }
  }

  _syncChatMessages(chatEl) {
    if (chatEl) {
      chatEl.messages = this.messages;
      chatEl.typing = this._typing;
      chatEl.section = this._chatSection;
      chatEl.sessionId = this._sessionId;
      chatEl.username = this._username;
      chatEl.persona = this._activePersona;
      chatEl.render();
    }
  }

  // ===== Fetch with timeout — prevents hanging on Render cold start =====
  _fetchWithTimeout(url, options, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .then(response => { clearTimeout(timeoutId); return response; })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('FETCH_TIMEOUT');
        }
        throw err;
      });
  }

  // ===== Start a new chat session =====
  _startNewSession() {
    this.messages = [];
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._historyLoaded = true;
    this._greetingRequested = false;
    this._activePersona = this.persona || this._activePersona; // Keep original persona choice, don't reset to abogado
    this._requestGreeting();
  }

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await this._fetchWithTimeout(HorneroConsulta.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'consulta',
          grade: this.grade,
          sector: this.sector,
          requested_persona: this._activePersona,
          session_id: this._sessionId,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['consulta', 'greeting'],
        persona: this._activePersona, // Force: consulta screen keeps its original persona — never swap actors mid-chat
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      // Don't update _activePersona from backend response — keep the original choice
      this._typing = false; this._greetingRequested = false;
      // Don't save to IndexedDB yet — session only created when user sends a message
      this.render();
    } catch (e) {
      // Fallback: local greeting
      this._typing = false; this._greetingRequested = false;
      this.messages = [this._localGreeting()];
      this.render();
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      sections: [
        { title: '¡Hola!', body: 'Soy el abogado laboralista del gremio aceitero. Estoy para ayudarte con lo que necesites.' },
        { title: '¿Qué puedes consultar?', body: 'Paritaria aceitera, condiciones laborales, SMVM y distribución del ingreso, reforma laboral, convenio CCT 420/05, organización sindical, referentes como Yofra y Cremonte.' },
        { title: '', body: '', quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Ciclo "Por las hendijas del Quebracho", enero 2021' },
      ],
      tags: ['consulta', 'greeting'],
      persona: this._activePersona,
      time: this._timeNow(),
    };
  }

  // ===== Generate a descriptive chat title from the user's first message =====
  _generateTitle(text, section) {
    const t = (text || '').toLowerCase().trim();
    // Keyword → title map (most specific first)
    const keywords = [
      ['paritaria', 'Paritaria aceitera'],
      ['smvm', 'SMVM y salario mínimo'],
      ['salario mínimo', 'SMVM y salario mínimo'],
      ['salario', 'Salario y remuneración'],
      ['convenio', 'Convenio colectivo'],
      ['cct 420', 'Convenio CCT 420'],
      ['cct', 'Convenio colectivo'],
      ['reforma laboral', 'Reforma laboral'],
      ['reforma', 'Reforma laboral'],
      ['despidos', 'Despidos y estabilidad'],
      ['estabilidad', 'Estabilidad laboral'],
      ['jornada', 'Jornada laboral'],
      ['horas extra', 'Horas extras'],
      ['vacaciones', 'Vacaciones y descanso'],
      ['licencia', 'Licencias laborales'],
      ['enfermedad', 'Enfermedad y licencia'],
      ['accidente', 'Accidentes laborales'],
      ['art', 'ART y seguridad'],
      ['seguridad', 'Seguridad laboral'],
      ['sindicato', 'Organización sindical'],
      ['delegado', 'Delegados y representación'],
      ['asamblea', 'Asamblea y participación'],
      ['organización', 'Organización sindical'],
      ['greca', 'GRECA y afiliación'],
      ['afiliación', 'Afiliación sindical'],
      ['yofra', 'Daniel Yofra'],
      ['cremonte', 'Investigador Cremonte'],
      ['reporte', 'Reporte de situación'],
      ['situación', 'Situación laboral'],
      ['condiciones', 'Condiciones laborales'],
      ['trabajo', 'Condiciones laborales'],
      ['derechos', 'Derechos laborales'],
      ['ley', 'Legislación laboral'],
      ['contrato', 'Contrato de trabajo'],
      ['firma', 'Firma y documentación'],
      ['código', 'Código laboral'],
      ['discriminación', 'Discriminación laboral'],
      ['acoso', 'Acoso laboral'],
      ['mujeres', 'Mujeres y trabajo'],
      ['capacitación', 'Capacitación laboral'],
      ['formación', 'Formación sindical'],
    ];
    for (const [kw, title] of keywords) {
      if (t.includes(kw)) return title;
    }
    // Fallback: clean up first 50 chars as title
    const clean = text.trim().replace(/[?!.]+$/, '').substring(0, 50);
    return clean.length > 10 ? clean + '…' : 'Consulta';
  }

  _handleUserMessage(text) {
    // Detect export keywords — download current chat as document
    // Only match explicit export requests, not incidental words in normal conversation
    const lower = text.toLowerCase().trim();
    const isExportRequest = lower.match(/^(exportar|descargar|guardar documento|download|export)\b/) ||
      lower.match(/\b(exportar chat|descargar chat|exportar conversación|descargar conversación)\b/);
    if (isExportRequest) {
      this._exportCurrentChat();
      return;
    }

    // Generate title for session from the first user message
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    const title = isFirstUserMsg ? this._generateTitle(text, 'consulta') : undefined;
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    if (title) userMsg.title = title;
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    this._callBackend(text).catch((err) => {
      if (err.message === 'FETCH_TIMEOUT') {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'El servidor está respondiendo lento. Intentá de nuevo en un momento, o probá tu consulta más tarde.',
          tags: ['consulta', 'timeout'],
          persona: this._activePersona,
          time: this._timeNow(),
        }];
      } else {
        this.messages = [...this.messages, this._localResponse(text)];
      }
      this.iaStep++;
      this._typing = false; this._greetingRequested = false;
      this.render();
    });
  }

  async _callBackend(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await this._fetchWithTimeout(HorneroConsulta.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'consulta',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['consulta'],
      persona: this._activePersona, // Force: consulta screen keeps its original persona — never swap actors mid-chat
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    // Don't update _activePersona from backend response — keep the original choice
    this.iaStep++;
    this._typing = false; this._greetingRequested = false;
    this._saveChatHistory();
    this.render();
  }

  // ===== Audio message handling =====
  _handleAudioMessage(audioBlob, duration, fileName) {
    const durationStr = duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '0:00';
    const userMsg = { role: 'user', text: `🎤 Audio (${durationStr})`, audio: true, duration, time: this._timeNow() };
    const isFirstUserMsg = !this.messages.some(m => m.role === 'user');
    if (isFirstUserMsg) userMsg.title = 'Audio message';
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    this._callAudioBackend(audioBlob, fileName).catch((err) => {
      if (err.message === 'FETCH_TIMEOUT') {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'No puedo procesar el audio ahora — el servidor está lento. Intentá de nuevo.',
          tags: ['consulta', 'audio', 'timeout'],
          persona: this._activePersona,
          time: this._timeNow(),
        }];
      } else {
        this.messages = [...this.messages, this._localResponse('audio fallback')];
      }
      this.iaStep++;
      this._typing = false;
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this.render();
    });
  }

  async _callAudioBackend(audioBlob, fileName) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const formData = new FormData();
    formData.append('audio', audioBlob, fileName || 'recording.webm');
    formData.append('formato', 'consulta');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', this._activePersona);
    formData.append('session_id', this._sessionId);
    formData.append('history', JSON.stringify(history));

    const response = await this._fetchWithTimeout(HorneroConsulta.AUDIO_URL, {
      method: 'POST',
      body: formData, // Browser sets multipart Content-Type automatically
    }, 45000);

    if (!response.ok) throw new Error('Audio backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['consulta', 'audio'],
      persona: this._activePersona, // Force: consulta screen keeps its original persona — never swap actors mid-chat
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    // Don't update _activePersona from backend response — keep the original choice
    this.iaStep++;
    this._typing = false;
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) chatEl.resetAudioState();
    this._saveChatHistory();
    this.render();
  }

  // ===== Fallback offline =====
  _localResponse(userText) {
    const lower = userText.toLowerCase();
    const p = this._activePersona;
    if (lower.match(/^(hola|buen|hey|qué tal|como|good|hi|saludos)/)) {
      return { role: 'hornero', sections: [{ title: '¡Hola!', body: '¿Cómo andás? Contame qué te interesa — paritaria, condiciones, SMVM, reforma, convenio, organización. Te guío.' }], tags: ['consulta', 'saludo'], persona: p, time: this._timeNow() };
    }
    if (lower.includes('yofra')) {
      return { role: 'hornero', sections: [{ title: 'Daniel Yofra', body: 'Secretario General de la F.T.C.I.O.D y A.R.A. (Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines). Líder sindical aceitero, referente en paritaria, organización y resistencia.' }, { title: '', body: '', quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Ciclo "Por las hendijas del Quebracho", enero 2021' }], tags: ['yofra', 'consulta'], persona: p, time: this._timeNow() };
    }
    if (lower.includes('cremonte')) {
      return { role: 'hornero', sections: [{ title: 'Cremonte', body: 'Investigador labour. Analista de distribución del ingreso, salario mínimo y reforma laboral. Autor de "Valor y precio de la fuerza de trabajo" (2023).' }, { title: '', body: '', quote: 'El salario mínimo no es un número abstracto — es el piso de lo que una persona necesita para reproducir su fuerza de trabajo.', quoteAuthor: 'Cremonte', quoteSource: '"Valor y precio de la fuerza de trabajo", 2023' }], tags: ['cremonte', 'consulta'], persona: p, time: this._timeNow() };
    }
    return { role: 'hornero', sections: [{ title: 'Abogado/a', body: 'No tengo datos específicos sobre eso, pero puedo ayudarte con: paritaria aceitera, condiciones laborales, SMVM, reforma laboral, convenio CCT 420/05, organización sindical. ¿Qué te interesa?' }], tags: ['consulta'], persona: p, time: this._timeNow() };
  }

  _timeNow() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' +
           now.getMinutes().toString().padStart(2, '0');
  }

  async _saveChatHistory() {
    try {
      if (typeof guardarChatMsg === 'function') {
        // Save each message with section + sessionId
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
    } catch(e) { console.warn('Consulta: chat history save failed', e); }
  }

  // ===== Export current chat as downloadable TXT document =====
  _exportCurrentChat() {
    if (!this.messages || this.messages.length === 0) return;
    // Use the chat component's export method
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      // Generate title from first user message or fallback
      const firstUserMsg = this.messages.find(m => m.role === 'user');
      const title = firstUserMsg && firstUserMsg.title ? firstUserMsg.title : 'Consulta';
      const filename = title + '.txt';
      // Generate TXT content and trigger download
      chatEl._downloadTxt(this.messages, title, title);
      // Add message with clickable download card
      const txtContent = chatEl._generateTxtContent(this.messages, title);
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: { content: txtContent, filename: filename, label: 'Click para descargar' },
        tags: ['consulta', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  _handleChatExport(detail) {
    if (!this.messages || this.messages.length === 0) return;
    if (detail && detail.download) {
      const title = detail.title || 'Consulta';
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: detail.download,
        tags: ['consulta', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  _handlePersonaNavigate(targetPersona, targetScreen) {
    // All persona icon clicks navigate to that persona's screen
    const screenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'companero': { screen: 'gremial', persona: 'companero' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'historiador': { screen: 'historiador' },
    };
    const target = screenMap[targetPersona] || (targetScreen ? { screen: targetScreen, persona: targetPersona } : null);
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }
}

customElements.define('hornero-consulta', HorneroConsulta);
