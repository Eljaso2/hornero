// ===== <hornero-ecosistema> — Qué es Hornero =====
// Chat donde Hornero (el personaje) cuenta qué es el Ecosistema Hornero y la IA Sindical
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroEcosistema extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      theme: String,
      messages: Array,
      _typing: Boolean,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.messages = [];
    this._typing = false;
    this._greetingPushed = false;
    this._eventsBound = false;
    this._progressiveRevealTimer = null;
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
  }

  _getGreetingSections() {
    return [
      { title: '¿Qué es Hornero?', body: 'Soy **Hornero** — el pájaro nacional de Argentina. Construyo mi nido con **mis propios materiales** en **mi propio territorio**. No uso nidos de otros.\n\nEsa es toda la filosofía: la organización no **consume** IA corporativa — **crea** su propia herramienta. Con sus propios datos. En su propia infraestructura. Con sus propias categorías.' },
      { title: '¿Qué es la IA Sindical?', body: 'La **IA Sindical** es inteligencia artificial puesta al servicio del trabajador. No es un chatbot neutral — es una herramienta **posicionada desde la clase trabajadora**.\n\nArgumenta desde la posición del trabajador, no desde la del empresario. Conoce el convenio, la paritaria, la jurisprudencia. Y lo más importante: **los datos se quedan en la organización**.' },
      { title: 'Tesis Xiong / Tricontinental', body: 'La distinción fundadora: **consumir IA corporativa vs. crear IA propia**.\n\nNo es una distinción técnica sino **política y epistemológica** — determina quién controla categorías, datos, lógica y todo el ciclo del sistema.\n\nConsumir IA ajena es dejar que otro defina las categorías con las que pensás tu propia realidad. Crear IA propia es soberanía.' },
      { title: '6 eslabones de la cadena de valor', body: '**1. Datos** — Qué datos entran, quién los produce, cómo se etiquetan\n**2. Arquitectura** — Cómo se organizan, quién diseña el sistema\n**3. Fine-tuning** — Qué corpus, qué dirección, quién decide\n**4. Infraestructura** — Dónde se procesa, quién controla el server\n**5. Interfaz** — Cómo se presenta, qué sesgo tiene, quién lo experimenta\n**6. Gobernanza** — Quién decide qué se publica, qué se protege\n\nCada eslabón es una decisión política. Si no controlás uno, alguien más lo controla por vos.' },
      { title: 'Lo que NO es → Lo que ES', body: '- Chatbot legal genérico → **Herramienta posicionada desde el trabajador**\n- App de un sindicato → **Plataforma que cada sindicato adapta**\n- Scraper de PDFs → **Convenio vivo, interactivo, contextualizado**\n- Startup que extrae datos → **Sistema soberano**\n- Chatbot neutral → **Argumenta desde la posición del trabajador**\n- Producto de Silicon Valley → **Producto del campo trabajador**' },
      { title: 'Soberanía funcional', body: 'Soberanía no depende de rack físico — depende de **quién controla acceso, datos y modelos**.\n\nUn VPS donde se controla todo el stack (OS, DB, modelo, acceso) es funcionalmente soberano. No hace falta un data center propio — hace falta **control**.' },
    ];
  }

  _startProgressiveReveal(fullText, chatEl) {
    this._stopProgressiveReveal();
    this._progressiveRevealFull = fullText;
    this._progressiveRevealIndex = 0;
    const chunkSize = 2;
    const interval = 20;
    this._progressiveRevealTimer = setInterval(() => {
      this._progressiveRevealIndex += chunkSize;
      if (this._progressiveRevealIndex >= this._progressiveRevealFull.length) {
        this._stopProgressiveReveal();
        if (chatEl) chatEl.updateStreamingText(this._progressiveRevealFull);
        return;
      }
      if (chatEl) chatEl.updateStreamingText(this._progressiveRevealFull.substring(0, this._progressiveRevealIndex));
    }, interval);
  }

  _stopProgressiveReveal() {
    if (this._progressiveRevealTimer) {
      clearInterval(this._progressiveRevealTimer);
      this._progressiveRevealTimer = null;
    }
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }
      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
      /* Bigger avatar for Hornero persona */
      .chat-container >>> .msg-avatar-row.persona-hornero .msg-avatar { width: 40px; height: 40px; }
      .chat-container >>> .msg-avatar-row.persona-hornero .msg-avatar img { width: 40px; height: 40px; }
    `;
  }

  _render() {
    return html`
      <div class="chat-container">
        <hornero-chat
          title="Ecosistema Hornero"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          persona="hornero"
          username=""
          grade="${this.grade}"
          theme="${this.theme || ''}"
          hide-persona-bar
          section="ecosistema"
          history-title="Historial"
          no-auto-scroll
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (!chatEl) return;

    // Sync messages to chat element
    if (this.messages && this.messages.length) {
      chatEl.messages = this.messages;
      chatEl.persona = 'hornero';
      chatEl.section = 'ecosistema';
      chatEl.typing = this._typing;
      chatEl.render();
    }

    // Push greeting with progressive reveal
    if (!this._greetingPushed) {
      this._greetingPushed = true;
      this._typing = true;
      this.render();

      // Show typing indicator, then start progressive reveal
      setTimeout(() => {
        const fullText = this._getGreetingSections().map(s =>
          `**${s.title}**\n\n${s.body}`
        ).join('\n\n---\n\n');

        this._startProgressiveReveal(fullText, chatEl);
      }, 1200);
    }

    if (!this._eventsBound) {
      this._eventsBound = true;
      chatEl.addEventListener('chat-back', () => {
        this.emit('screen-change', { screen: 'home' });
      });
    }
  }
}

customElements.define('hornero-ecosistema', HorneroEcosistema);
