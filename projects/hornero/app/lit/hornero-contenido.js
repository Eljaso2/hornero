// ===== <hornero-contenido> — Contenido Sindical =====
// Chat directo — IA inicia diálogo explicando formatos de contenido sindical
// Backend LLM (DashScope/Claude) + fallback offline con KB local
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroContenido extends HoComponent {
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

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.messages = [];
    this.iaStep = 0;
    this._typing = false; this._greetingRequested = false;
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
          title="Producción de contenido"
          input-placeholder="Escribí tu tema, formato, o pedido..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
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
    }

    if (this.messages.length === 0 && !this._greetingRequested) {
      this._requestGreeting();
    }
  }

  _syncChatMessages(chatEl) {
    if (chatEl && this.messages.length > 0) {
      chatEl.messages = this.messages;
      chatEl.typing = this._typing;
      chatEl.render();
    }
  }

  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await fetch(HorneroContenido.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'contenido',
          grade: this.grade,
          sector: this.sector,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      this.messages = [{
        role: 'hornero',
        sections: data.sections || [],
        tags: data.tags || ['contenido', 'greeting'],
        time: data.time || this._timeNow(),
      }];
      this._typing = false; this._greetingRequested = false;
      this.render();
    } catch (e) {
      this._typing = false; this._greetingRequested = false;
      this.messages = [this._localGreeting()];
      this.render();
    }
  }

  _localGreeting() {
    return {
      role: 'hornero',
      sections: [
        { title: '¡Hola! Soy la IA Sindical', body: 'Te guío para producir contenido sindical con impacto. Podés elegir formato o pedir ayuda general sobre cualquier tema sindical.' },
        { title: 'Formatos disponibles', body: '• 🎙️ Podcast — audio narrado, 5-15 min, ideal para difusión interna\n• 📱 Reel IG — video corto, 30-90 seg, para redes con impacto visual\n• ✍️ Columna opinión — texto para diario, 800-1200 palabras\n• 📻 Entrevista radial — preparación completa: puntos, argumentos, fuentes' },
        { title: '', body: '', quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Ciclo "Por las hendijas del Quebracho", enero 2021' },
      ],
      tags: ['contenido', 'greeting'],
      time: this._timeNow(),
    };
  }

  _handleUserMessage(text) {
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    this.messages = [...this.messages, userMsg];
    this._typing = true;
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

    const response = await fetch(HorneroContenido.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'contenido',
        history: history,
        grade: this.grade,
        sector: this.sector,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    this.messages = [...this.messages, {
      role: 'hornero',
      sections: data.sections || [],
      tags: data.tags || ['contenido'],
      time: data.time || this._timeNow(),
    }];
    this.iaStep++;
    this._typing = false; this._greetingRequested = false;
    this.render();
  }

  _localResponse(userText) {
    const lower = userText.toLowerCase();
    if (lower.match(/^(hola|buen|hey|qué tal|como|good|hi|saludos)/)) {
      return { role: 'hornero', sections: [{ title: '¡Hola!', body: '¿Cómo andás? ¿Qué formato te interesa — podcast, reel, columna, entrevista? O contame tu tema y te guío.' }], tags: ['contenido', 'saludo'], time: this._timeNow() };
    }
    if (lower.match(/podcast/)) {
      return { role: 'hornero', sections: [{ title: 'Podcast sindical', body: 'Audio narrado, 5-15 minutos. Se escucha en el colectivo, en la planta, en la asamblea. Contame tu tema y te propongo estructura, script y fuentes.' }, { title: '', body: '', quote: 'La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Asamblea paritaria aceitera, junio 2026' }], tags: ['podcast', 'contenido'], time: this._timeNow() };
    }
    return { role: 'hornero', sections: [{ title: 'IA Sindical', body: 'Contame tu tema o formato. Puedo ayudarte con podcast, reel, columna, entrevista — o cualquier consulta sindical.' }], tags: ['contenido'], time: this._timeNow() };
  }

  _timeNow() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' +
           now.getMinutes().toString().padStart(2, '0');
  }
}

customElements.define('hornero-contenido', HorneroContenido);
