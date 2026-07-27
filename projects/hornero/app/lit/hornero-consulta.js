// ===== <hornero-consulta> — Consulta IA Sindical =====
// Chat directo — IA inicia diálogo saludando y explicando qué se puede consultar
// Backend LLM (DashScope/Claude) + fallback offline con KB local
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroConsulta extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
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
    this._activePersona = 'ia-sindical'; // Current persona at mesa de trabajo
    this._username = ''; // login username for per-user data isolation
  }

  connectedCallback() {
    super.connectedCallback();
    // Generate new sessionId on each visit — start fresh
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    // Get username from login session for per-user data isolation
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
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
          title="Chateá con el Relator"
          input-placeholder="Escribí tu consulta, pregunta, o tema..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          persona="${this._activePersona}"
          persona-pills="${true}"
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
      // Listen for persona switch from mesa de trabajo icons
      chatEl.addEventListener('persona-switch', (e) => {
        this._activePersona = e.detail.persona;
        this.render();
      });
      // Listen for persona redirect from derivation button
      chatEl.addEventListener('persona-redirect', (e) => {
        this._handlePersonaRedirect(e.detail.persona);
      });
      // Listen for audio message from mic recording
      chatEl.addEventListener('chat-audio', (e) => {
        this._handleAudioMessage(e.detail.audioBlob, e.detail.duration, e.detail.fileName);
      });
    }

    // Load history from IndexedDB first, then request greeting if empty
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }
  }

  async _loadChatHistory() {
    this._historyLoaded = true;
    // On each visit: start fresh with new sessionId
    // No need to load previous session — the user can access via history drawer
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
      chatEl.personaPills = true;
      chatEl.render();
    }
  }

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await fetch(HorneroConsulta.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'consulta',
          grade: this.grade,
          sector: this.sector,
          requested_persona: this._activePersona,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['consulta', 'greeting'],
        persona: data.persona || this._activePersona,
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      this._activePersona = data.persona || this._activePersona;
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
        { title: '¡Hola, compañero!', body: 'Soy la IA Sindical de Hornero, tu asistente para trabajadores aceiteros. Estoy para ayudarte con lo que necesites.' },
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

    this._callBackend(text).catch(() => {
      this.messages = [...this.messages, this._localResponse(text)];
      this.iaStep++;
      this._typing = false; this._greetingRequested = false;
      this.render();
    });
  }

  async _callBackend(text) {
    const history = this.messages.slice(-7, -1).map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(HorneroConsulta.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'consulta',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: this._activePersona,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['consulta'],
      persona: data.persona || this._activePersona,
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    this._activePersona = data.persona || this._activePersona;
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

    this._callAudioBackend(audioBlob, fileName).catch(() => {
      this.messages = [...this.messages, this._localResponse('audio fallback')];
      this.iaStep++;
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
    formData.append('formato', 'consulta');
    formData.append('grade', this.grade);
    formData.append('sector', this.sector);
    formData.append('requested_persona', this._activePersona);
    formData.append('history', JSON.stringify(history));

    const response = await fetch(HorneroConsulta.AUDIO_URL, {
      method: 'POST',
      body: formData, // Browser sets multipart Content-Type automatically
    });

    if (!response.ok) throw new Error('Audio backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['consulta', 'audio'],
      persona: data.persona || this._activePersona,
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    this._activePersona = data.persona || this._activePersona;
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
    return { role: 'hornero', sections: [{ title: 'IA Sindical', body: 'No tengo datos específicos sobre eso, pero puedo ayudarte con: paritaria aceitera, condiciones laborales, SMVM, reforma laboral, convenio CCT 420/05, organización sindical. ¿Qué te interesa?' }], tags: ['consulta'], persona: p, time: this._timeNow() };
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
      const title = firstUserMsg && firstUserMsg.title ? firstUserMsg.title : 'Consulta IA Sindical';
      chatEl._downloadTxt(this.messages, title, title);
      // Add confirmation message
      this.messages = [...this.messages, {
        role: 'hornero',
        text: '📥 Documento exportado. Lo descargaste como archivo TXT — lo puedes abrir en cualquier editor de texto, imprimir, o compartir.',
        tags: ['consulta', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  _handlePersonaRedirect(targetPersona) {
    // If redirecting to relator — navigate to gremial screen
    if (targetPersona === 'relator') {
      this.emit('screen-change', { screen: 'gremial' });
      return;
    }
    // Otherwise, switch persona within current chat
    this._activePersona = targetPersona;
    this.messages = [];
    this._greetingRequested = false;
    this.render();
  }
}

customElements.define('hornero-consulta', HorneroConsulta);
