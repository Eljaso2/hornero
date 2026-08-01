// ===== <hornero-ecosistema> — Qué es Hornero =====
// Chat donde Hornero (el personaje) cuenta qué es el Ecosistema Hornero y la IA Sindical
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroEcosistema extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this._greetingPushed = false;
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
          input-placeholder="Preguntame lo que quieras..."
          persona="hornero"
          username=""
          grade="${this.grade}"
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

    // Push greeting message once
    if (!this._greetingPushed) {
      this._greetingPushed = true;
      const greeting = {
        role: 'hornero',
        sections: [
          { title: '¿Qué es Hornero?', body: 'Soy **Hornero** — el pájaro nacional de Argentina. Construyo mi nido con **mis propios materiales** en **mi propio territorio**. No uso nidos de otros.\n\nEsa es toda la filosofía: la organización no **consume** IA corporativa — **crea** su propia herramienta. Con sus propios datos. En su propia infraestructura. Con sus propias categorías.' },
          { title: '¿Qué es la IA Sindical?', body: 'La **IA Sindical** es inteligencia artificial puesta al servicio del trabajador. No es un chatbot neutral — es una herramienta **posicionada desde la clase trabajadora**.\n\nArgumenta desde la posición del trabajador, no desde la del empresario. Conoce el convenio, la paritaria, la jurisprudencia. Y lo más importante: **los datos se quedan en la organización**.' },
          { title: 'Tesis Xiong / Tricontinental', body: 'La distinción fundadora: **consumir IA corporativa vs. crear IA propia**.\n\nNo es una distinción técnica sino **política y epistemológica** — determina quién controla categorías, datos, lógica y todo el ciclo del sistema.\n\nConsumir IA ajena es dejar que otro defina las categorías con las que pensás tu propia realidad. Crear IA propia es soberanía.' },
          { title: '6 eslabones de la cadena de valor', body: '**1. Datos** — Qué datos entran, quién los produce, cómo se etiquetan\n**2. Arquitectura** — Cómo se organizan, quién diseña el sistema\n**3. Fine-tuning** — Qué corpus, qué dirección, quién decide\n**4. Infraestructura** — Dónde se procesa, quién controla el server\n**5. Interfaz** — Cómo se presenta, qué sesgo tiene, quién lo experimenta\n**6. Gobernanza** — Quién decide qué se publica, qué se protege\n\nCada eslabón es una decisión política. Si no controlás uno, alguien más lo controla por vos.' },
          { title: 'Lo que NO es → Lo que ES', body: '- Chatbot legal genérico → **Herramienta posicionada desde el trabajador**\n- App de un sindicato → **Plataforma que cada sindicato adapta**\n- Scraper de PDFs → **Convenio vivo, interactivo, contextualizado**\n- Startup que extrae datos → **Sistema soberano**\n- Chatbot neutral → **Argumenta desde la posición del trabajador**\n- Producto de Silicon Valley → **Producto del campo trabajador**' },
          { title: 'Soberanía funcional', body: 'Soberanía no depende de rack físico — depende de **quién controla acceso, datos y modelos**.\n\nUn VPS donde se controla todo el stack (OS, DB, modelo, acceso) es funcionalmente soberano. No hace falta un data center propio — hace falta **control**.' },
        ],
        tags: ['ecosistema', 'greeting'],
        persona: 'hornero',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      };
      chatEl.messages = [greeting];
      chatEl.render();
    }

    chatEl.addEventListener('chat-back', () => {
      this.emit('screen-change', { screen: 'home' });
    });
  }
}

customElements.define('hornero-ecosistema', HorneroEcosistema);
