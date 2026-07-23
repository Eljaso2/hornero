// ===== <hornero-ecosistema> — Qué es Hornero =====
// Xiong thesis, 6 eslabones cadena de valor IA, soberanía, distinciones
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
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }
      .scroll { flex: 1; overflow-y: auto; padding: 20px 16px;
        -webkit-overflow-scrolling: touch; }
      .block { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 12px; }
      .block-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); margin-bottom: 8px; }
      .block-body { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.5; }
      .block-body p { margin-bottom: 8px; }
      .emphasis { color: var(--ho-green, #6E8345); font-weight: 700; }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 8px; }
      .eslabon { display: flex; align-items: center; gap: 10px;
        padding: 6px 0; }
      .eslabon-num { width: 26px; height: 26px; border-radius: 50%;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        font-family: 'JetBrains Mono', monospace; font-size: .72rem; font-weight: 600;
        display: flex; align-items: center; justify-content: center; }
      .eslabon-text { font-size: .82rem; color: var(--ho-text, #2B2A26); }
      .eslabon-desc { font-size: .72rem; color: var(--ho-text-light, #9C988D); }
      .distinction { display: grid; gap: 4px; font-size: .82rem; }
      .no { color: var(--ho-text-light, #9C988D); font-style: italic; }
      .yes { color: var(--ho-green, #6E8345); font-weight: 600; }
      .arrow { color: var(--ho-text-mid, #6E6A60); font-size: .72rem; }
      .tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600;
        display: inline-block; margin-top: 6px; }
      .bird { font-size: 1.2rem; }
    `;
  }

  _render() {
    return html`
      <div class="scroll">
        <div class="bird" style="text-align:center;margin-bottom:12px">🪶</div>

        <div class="kicker">ECOSISTEMA HORNERO</div>

        <div class="block">
          <div class="block-title">¿Qué es Hornero?</div>
          <div class="block-body">
            <p>El <span class="emphasis">hornero</span> es el pájaro nacional de Argentina. Construye su nido con <span class="emphasis">sus propios materiales</span> en <span class="emphasis">su propio territorio</span> — no usa nidos de otros.</p>
            <p>La metáfora codifica toda la filosofía: la organización no <span class="emphasis">consume</span> IA corporativa — <span class="emphasis">crea</span> su propia herramienta. Con sus propios datos. En su propia infraestructura. Con sus propias categorías.</p>
          </div>
        </div>

        <div class="block">
          <div class="block-title">Tesis Xiong / Tricontinental</div>
          <div class="block-body">
            <p>La distinción fundadora: <span class="emphasis">consumir IA corporativa vs. crear IA propia</span>.</p>
            <p>No es una distinción técnica sino <span class="emphasis">política y epistemológica</span> — determina quién controla categorías, datos, lógica y todo el ciclo del sistema.</p>
          </div>
          <span class="tag">política · epistemológica · soberanía</span>
        </div>

        <div class="block">
          <div class="block-title">6 eslabones de la cadena de valor de IA</div>
          <div class="block-body">
            <div class="eslabon"><div class="eslabon-num">1</div><div><span class="eslabon-text">Datos</span><br><span class="eslabon-desc">Qué datos entran, quién los produce, cómo se etiquetan</span></div></div>
            <div class="eslabon"><div class="eslabon-num">2</div><div><span class="eslabon-text">Arquitectura</span><br><span class="eslabon-desc">Cómo se organizan, quién diseña el sistema</span></div></div>
            <div class="eslabon"><div class="eslabon-num">3</div><div><span class="eslabon-text">Fine-tuning</span><br><span class="eslabon-desc">Qué corpus, qué dirección, quién decide</span></div></div>
            <div class="eslabon"><div class="eslabon-num">4</div><div><span class="eslabon-text">Infraestructura</span><br><span class="eslabon-desc">Dónde se procesa, quién controla el server</span></div></div>
            <div class="eslabon"><div class="eslabon-num">5</div><div><span class="eslabon-text">Interfaz</span><br><span class="eslabon-desc">Cómo se presenta, qué sesgo tiene, quién lo experimenta</span></div></div>
            <div class="eslabon"><div class="eslabon-num">6</div><div><span class="eslabon-text">Gobernanza</span><br><span class="eslabon-desc">Quién decide qué se publica, qué se protege</span></div></div>
          </div>
        </div>

        <div class="block">
          <div class="block-title">Lo que NO es → Lo que ES</div>
          <div class="block-body">
            <div class="distinction">
              <div class="no">Chatbot legal genérico</div><div class="arrow">→</div><div class="yes">Herramienta posicionada desde el trabajador</div>
              <div class="no">App de un sindicato</div><div class="arrow">→</div><div class="yes">Plataforma que cada sindicato adapta</div>
              <div class="no">Scraper de PDFs</div><div class="arrow">→</div><div class="yes">Convenio vivo, interactivo, contextualizado</div>
              <div class="no">Startup que extrae datos</div><div class="arrow">→</div><div class="yes">Sistema soberano</div>
              <div class="no">Chatbot "neutral"</div><div class="arrow">→</div><div class="yes">Argumenta desde la posición del trabajador</div>
              <div class="no">Producto de Silicon Valley</div><div class="arrow">→</div><div class="yes">Producto del campo trabajador</div>
            </div>
          </div>
        </div>

        <div class="block">
          <div class="block-title">Soberanía funcional</div>
          <div class="block-body">
            <p>Soberanía no depende de rack físico — depende de <span class="emphasis">quién controla acceso, datos y modelos</span>.</p>
            <p>Un VPS donde se controla todo el stack (OS, DB, modelo, acceso) es funcionalmente soberano.</p>
          </div>
          <span class="tag">VPS argentino · no AWS · soberanía funcional</span>
        </div>
      </div>
    `;
  }
}

customElements.define('hornero-ecosistema', HorneroEcosistema);
