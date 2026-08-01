// ===== <hornero-ecosistema> — Qué es Hornero =====
// Chat donde Hornero cuenta qué es, con el logo como ícono
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroEcosistema extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      messages: Array,
      _greetingShown: Boolean,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.messages = [];
    this._greetingShown = false;
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); }
      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
    `;
  }

  _render() {
    return html`
      <div class="chat-container">
        <hornero-chat
          title="Ecosistema Hornero"
          input-placeholder="Escribí algo..."
          messages="${JSON.stringify(this.messages)}"
          persona="hornero"
          username=""
          grade="${this.grade}"
          hide-persona-bar
          center-logo="assets/hornero-logo-nobg.png"
          section="ecosistema"
          history-title="Historial"
          no-auto-scroll
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    if (!this._greetingShown) {
      this._greetingShown = true;
      this.messages = [{
        role: 'hornero',
        sections: [
          { title: '¿Qué es Hornero?', body: 'El **hornero** es el pájaro nacional de Argentina. Construye su nido con **sus propios materiales** en **su propio territorio** — no usa nidos de otros.\n\nLa metáfora codifica toda la filosofía: la organización no **consume** IA corporativa — **crea** su propia herramienta. Con sus propios datos. En su propia infraestructura. Con sus propias categorías.' },
          { title: 'Tesis Xiong / Tricontinental', body: 'La distinción fundadora: **consumir IA corporativa vs. crear IA propia**.\n\nNo es una distinción técnica sino **política y epistemológica** — determina quién controla categorías, datos, lógica y todo el ciclo del sistema.' },
          { title: '6 eslabones de la cadena de valor de IA', body: '**1. Datos** — Qué datos entran, quién los produce, cómo se etiquetan\n**2. Arquitectura** — Cómo se organizan, quién diseña el sistema\n**3. Fine-tuning** — Qué corpus, qué dirección, quién decide\n**4. Infraestructura** — Dónde se procesa, quién controla el server\n**5. Interfaz** — Cómo se presenta, qué sesgo tiene, quién lo experimenta\n**6. Gobernanza** — Quién decide qué se publica, qué se protege' },
          { title: 'Lo que NO es → Lo que ES', body: '- Chatbot legal genérico → **Herramienta posicionada desde el trabajador**\n- App de un sindicato → **Plataforma que cada sindicato adapta**\n- Scraper de PDFs → **Convenio vivo, interactivo, contextualizado**\n- Startup que extrae datos → **Sistema soberano**\n- Chatbot "neutral" → **Argumenta desde la posición del trabajador**\n- Producto de Silicon Valley → **Producto del campo trabajador**' },
          { title: 'Soberanía funcional', body: 'Soberanía no depende de rack físico — depende de **quién controla acceso, datos y modelos**.\n\nUn VPS donde se controla todo el stack (OS, DB, modelo, acceso) es funcionalmente soberano.' },
        ],
        tags: ['ecosistema', 'greeting'],
        persona: 'hornero',
        time: this._timeNow(),
      }];
      this.render();
    }

    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      chatEl.addEventListener('chat-back', () => {
        this.emit('screen-change', { screen: 'home' });
      });
    }
  }

  _timeNow() {
    return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
}

customElements.define('hornero-ecosistema', HorneroEcosistema);
