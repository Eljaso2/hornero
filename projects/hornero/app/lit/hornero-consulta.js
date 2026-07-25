// ===== <hornero-consulta> — Consulta IA Sindical =====
// Chat general con formatos: Podcast, Reel IG, Columna opinión, Entrevista radial
// Chat IA con backend LLM (DeepSeek/Claude) + fallback offline con KB local
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroConsulta extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      formato: String,      // podcast|reel|columna|entrevista|consulta
      chatActive: Boolean,
      messages: Array,
      iaStep: Number,
      showBack: Boolean,
    };
  }

  // ===== Backend URL =====
  static get API_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat';
    }
    return 'https://hornero-ia.onrender.com/api/chat';
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.formato = '';
    this.chatActive = false;
    this.messages = [];
    this.iaStep = 0;
    this.showBack = true;
    this._typing = false;
    this._suggestions = [];

    // ===== Knowledge Base (fallback offline) =====
    this._iaKB = {
      convenios: {
        CCT420: {
          tema: 'CCT 420/05 — Aceiteros',
          datos: [
            'CCT 420/05 homologado por Resolución ST 343/2005',
            '4 categorías obreras (A-D: Inicial → Superior) + 4 administrativas (E-H)',
            'Nocturno: +25% sobre básico',
            'Horas extras: +100% (doble)',
            'Antigüedad: 1% por año',
            'Presentismo: premio por asistencia',
            'Dia del Aceitero: 29 de octubre',
            'Enfermería: Art. 42 CCT — obligatoria, la clausura es violación',
            'Contribución solidaria: 1% mensual + 6% semestral extraordinaria',
          ],
          quote: 'El CCT 420/05 es el territorio conquistado. Cada cláusula — nocturno, extras, enfermería, antigüedad — es una lucha que se ganó. La patronal quiere desconocerlo. El sindicato lo defiende.',
          quoteAuthor: 'FOEIAP — Federación de Obreros y Empleados de la Industria Aceitera',
          quoteSource: 'CCT 420/05, Res. ST 343/2005',
        },
        paritaria: {
          tema: 'Paritaria aceitera 2026',
          datos: [
            'SOMU demanda 15% de aumento',
            'Empresas ofrecen 8%',
            'Vicentín argumenta concurso preventivo limita posibilidades',
            'Básico junio 2026: $340.000 — no cubre alquiler Reconquista ($380.000)',
            'Brecha salario-vivienda: básico 12% debajo del alquiler',
            'Paritaria 2025 cerró después de 7 días de huelga nacional — forzó mano de Caputo',
            'FOEIAP resistió: "La propuesta fue cero" (Yofra)',
          ],
          quote: 'La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa para no pagar lo que corresponde. Si la planta funciona al 80%, hay producción, hay plata.',
          quoteAuthor: 'Daniel Yofra',
          quoteSource: 'Asamblea paritaria aceitera, junio 2026',
        },
        condiciones: {
          tema: 'Condiciones laborales aceiteras',
          datos: [
            'Vicentín planta: 80% capacidad — no está parada',
            'Prioridad producción: expeller sobre refinado (menor retención exportación = empresa ahorra impuestos)',
            'EPP insuficientes: guantes se rompen en una semana, botas no aguantan aceite caliente',
            'Enfermería clausurada 3 meses — violación Art. 42 CCT',
            'Accidentes: 3 en una semana (prensa, envasadora, piso con aceite caliente)',
            'Incremento ritmo: +20% volumen por turno — sin aumento de personal',
            'Guaycurú desmotadora: 1 línea de 2, temporales sin cobrar días no trabajados',
            'Polvo algodón: sin máscaras adecuadas, solo barbijos de tela',
          ],
          quote: 'Primero bajan ritmo, después reducen turnos, después suspenden, después despiden. Y nosotros nos tenemos que organizar antes que eso pase, no después.',
          quoteAuthor: 'Daniel Yofra',
          quoteSource: 'Informe gremial FOEIAP, junio 2026',
        },
        smvm: {
          tema: 'SMVM y básico convenio',
          datos: [
            'SMVM julio 2026: $2.344.000',
            'Básico convenio aceitero: $340.000 (junio 2026)',
            'Canasta básica total: $1.800.000',
            'Mediana salario registrado: $900.000',
            'Inflación obrera: 760% anual',
            'El básico del convenio está debajo del SMVM — violación del piso legal',
          ],
          quote: 'El salario mínimo no es un número abstracto — es el piso de lo que una persona necesita para reproducir su fuerza de trabajo. Si el básico del convenio está por debajo del SMVM, no estás cobrando lo mínimo legal, estás cobrando menos que lo mínimo.',
          quoteAuthor: 'Cremonte',
          quoteSource: '"Valor y precio de la fuerza de trabajo", 2023',
        },
      },
      yofra: {
        discursos: [
          { tema: 'organización', quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate. El que no está, no construye.', fuente: 'Daniel Yofra, ciclo "Por las hendijas del Quebracho", enero 2021', medio: 'Ciclo Quebracho' },
          { tema: 'paritaria', quote: 'La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa para no pagar lo que corresponde.', fuente: 'Daniel Yofra, Asamblea paritaria aceitera, junio 2026', medio: 'Asamblea FOEIAP' },
          { tema: 'huelga', quote: 'La propuesta patronal fue cero. Nosotros arrancamos con huelga de 7 días y forzamos la mano del ministro.', fuente: 'Daniel Yofra, Gestión Sindical, diciembre 2025', medio: 'Gestión Sindical' },
          { tema: 'guerra', quote: 'Este gobierno vino a declararnos la guerra. No va a alcanzar con el diálogo. Hay que hacer huelga.', fuente: 'Daniel Yofra, Reelección FOEIAP, marzo 2026', medio: 'Reelección FOEIAP' },
          { tema: 'cretino', quote: 'No esperamos que los legisladores nos defiendan — los cretinos son los que no defienden a los trabajadores.', fuente: 'Daniel Yofra, Perfil/Futurock, enero 2026', medio: 'Perfil/Futurock' },
        ],
      },
      cremonte: {
        discursos: [
          { tema: 'reforma-laboral', quote: 'La reforma laboral es un retorno al siglo XIX. Bargaining por empresa es letal para el modelo sindical — achica la representación al 5% como en Brasil y Colombia.', fuente: 'Cremonte, La Izquierda Diario, noviembre 2025', medio: 'La Izquierda Diario' },
          { tema: 'principio-protector', quote: 'El principio protector de la LCT es compensatorio de la desigualdad real. La reforma lo invierte — ahora el más débil tiene que probar, no el más fuerte.', fuente: 'Cremonte, Tiempo Argentino, noviembre 2025', medio: 'Tiempo Argentino' },
          { tema: 'ultraactividad', quote: 'Ultraactividad es negociar sin red. Si se elimina, cuando un convenio vence, todo vuelve a la ley — y la ley es el piso más bajo. El sindicato pierde lo conquistado.', fuente: 'Cremonte, Tiempo Argentino, noviembre 2025', medio: 'Tiempo Argentino' },
          { tema: 'banco-horas', quote: 'El banco de horas flexibiliza la jornada completamente. El patronal decide cuándo trabajas y cuándo no. Tu soberanía sobre el día de trabajo desaparece.', fuente: 'Cremonte, Degremiales, junio 2026', medio: 'Degremiales/El Espectador' },
          { tema: 'responsabilidad-internacional', quote: 'Argentina va a incurrir en responsabilidad internacional. 160 artículos contravienen la Constitución. Plataformas excluidas de toda tutela. Huelga prácticamente prohibida.', fuente: 'Cremonte, audiencia congressional ALAL, febrero 2026', medio: 'ALAL Laboralistas' },
          { tema: 'oit', quote: 'América Latina experimenta un retroceso peligroso en derechos sociales. Argentina rompe el piso del Convenio OIT N°1 de 1919 — permite jornadas de 12 horas. Criminalización de la protesta.', fuente: 'Cremonte, Conferencia OIT 114, Geneva, junio 2026', medio: 'ALAL/OIT' },
          { tema: 'distribución', quote: 'La distribución del ingreso no es un fenómeno natural — es el resultado de una relación de fuerzas. Cuando la patronal tiene más fuerza, la distribución se inclina. Cuando el movimiento obrero se organiza, se rebalancea.', fuente: 'Cremonte, investigación distribución del ingreso, 2025', medio: 'CIFRA/Investigación' },
          { tema: 'convenio', quote: 'El convenio no es solo un texto legal — es un territorio conquistado. Cada cláusula es una lucha que se ganó, y cada cláusula que no está es una lucha que se perdió. Defender el convenio es defender esa conquista.', fuente: 'Cremonte, clase convenios aceiteros, 2026', medio: 'Formación sindical' },
        ],
      },
    };

    // ===== Format definitions =====
    this._formatos = [
      { id: 'podcast', icon: '🎙️', title: 'Podcast', desc: 'Audio narrado, 5-15 min, ideal para difusión interna y campaña', tags: ['audio', 'narrativa', 'difusión'] },
      { id: 'reel', icon: '📱', title: 'Reel IG', desc: 'Video corto, 30-90 seg, para redes sociales con impacto visual', tags: ['video', 'redes', 'hook'] },
      { id: 'columna', icon: '✍️', title: 'Columna opinión', desc: 'Texto para diario, 800-1200 palabras, argumento sindical documentado', tags: ['texto', 'diario', 'argumento'] },
      { id: 'entrevista', icon: '📻', title: 'Entrevista radial', desc: 'Preparación completa: puntos, argumentos, fuentes, ejercitación', tags: ['radio', 'preparación', 'argumento'] },
    ];
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      /* Format selection screen */
      .format-screen { padding: 16px; }

      .section-title { font-family: 'Public Sans', sans-serif; font-weight: 500;
        font-size: .88rem; line-height: 1.45; color: var(--ho-text, #2B2A26); padding: 4px 0 16px; }

      .format-grid { display: flex; flex-direction: column; gap: 10px; }
      .format-card { background: var(--ho-card, #FBFAF6);
        border: 1.5px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; cursor: pointer;
        display: flex; align-items: center; gap: 12px;
        transition: border-color .2s, transform .15s; }
      .format-card:hover { border-color: var(--ho-green, #6E8345);
        transform: translateY(-1px); }

      .format-icon { width: 42px; height: 42px; border-radius: 50%;
        background: var(--ho-green-pale, #E8EDD7);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.15rem; flex: none; }

      .format-info { flex: 1; }
      .format-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); margin-bottom: 2px; }
      .format-desc { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4; }
      .format-tags { display: flex; gap: 5px; margin-top: 5px; }
      .format-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

      /* Chat container — fills entire screen */
      .chat-container { display: flex; flex-direction: column; height: 100%; }
    `;
  }

  _render() {
    // Step 0: Format selection
    if (!this.chatActive) {
      const cardsHtml = this._formatos.map(f => {
        const tagsHtml = f.tags.map(t => `<span class="format-tag">${t}</span>`).join('');
        return `<div class="format-card" data-formato="${f.id}">
          <div class="format-icon">${f.icon}</div>
          <div class="format-info">
            <div class="format-title">${f.title}</div>
            <div class="format-desc">${f.desc}</div>
            <div class="format-tags">${tagsHtml}</div>
          </div>
        </div>`;
      }).join('');

      return html`
        <div class="format-screen">
          <div class="section-title">Chateá con la IA Sindical. Preguntá sobre paritaria aceitera, reforma laboral, condiciones, SMVM — o elegí un formato para producir contenido sindical con impacto.</div>
          <div class="format-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
    }

    // Step 1: Chat active
    const titleMap = { podcast: 'Podcast', reel: 'Reel IG', columna: 'Columna opinión', entrevista: 'Entrevista radial' };
    const chatTitle = 'Consulta — ' + (titleMap[this.formato] || this.formato);

    return html`
      <div class="chat-container">
        <hornero-chat
          title="${chatTitle}"
          input-placeholder="Escribí tu pregunta, tema, o pedido..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          show-back="${this.showBack}"
          suggestions="${JSON.stringify(this._suggestions)}"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    if (!this.chatActive) {
      this.shadowRoot.querySelectorAll('.format-card').forEach(card => {
        card.addEventListener('click', () => {
          this._startChat(card.dataset.formato);
        });
      });
      return;
    }

    // Chat mode — bind events
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._syncChatMessages(chatEl);
      chatEl.addEventListener('chat-send', (e) => {
        this._handleUserMessage(e.detail.text);
      });
      chatEl.addEventListener('chat-back', () => {
        this._goBackToFormats();
      });
    }
  }

  _startChat(formato) {
    this.formato = formato;
    this.chatActive = true;
    this.messages = [];
    this.iaStep = 0;
    this._typing = false;
    this._suggestions = this._getSuggestionsForGreeting(formato);
    const firstMsg = this._generateGreeting(formato);
    this.messages = [firstMsg];
    this.render();
  }

  _goBackToFormats() {
    this.chatActive = false;
    this.formato = '';
    this.messages = [];
    this.iaStep = 0;
    this._typing = false;
    this._suggestions = [];
    this.render();
  }

  _syncChatMessages(chatEl) {
    if (chatEl && this.messages.length > 0) {
      chatEl.messages = this.messages;
      chatEl.typing = this._typing;
      chatEl.suggestions = this._suggestions;
      chatEl.render();
    }
  }

  _handleUserMessage(text) {
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    this.messages = [...this.messages, userMsg];
    this._typing = true;
    this._suggestions = [];  // Clear suggestions while processing
    this.render();

    // Try backend LLM first, fallback to local KB
    this._callBackend(text).catch(() => {
      const iaMsg = this._generateResponse(text, this.formato, this.iaStep);
      this.messages = [...this.messages, iaMsg];
      this.iaStep++;
      this._typing = false;
      this._suggestions = this._getSuggestionsForResponse(text, this.formato);
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
        formato: this.formato,
        history: history,
        grade: this.grade,
        sector: this.sector,
      }),
    });

    if (!response.ok) throw new Error(`Backend error: ${response.status}`);

    const data = await response.json();
    const iaMsg = {
      role: 'hornero',
      sections: data.sections || [],
      tags: data.tags || [this.formato],
      time: data.time || this._timeNow(),
    };
    this.messages = [...this.messages, iaMsg];
    this.iaStep++;
    this._typing = false;
    this._suggestions = data.suggestions || this._getSuggestionsForResponse(text, this.formato);
    this.render();
  }

  // ===== Greeting (local, no LLM needed) =====
  _generateGreeting(formato) {
    const greetings = {
      podcast: {
        role: 'hornero',
        sections: [
          { title: 'Chateá con la IA Sindical', body: 'Te guío para armar un podcast sindical — audio narrado, 5-15 minutos. Se escucha en el colectivo, en la planta, en la asamblea. Contame tu tema y te propongo estructura, script y fuentes.' },
          { title: '¿De qué querés hablar?', body: 'Paritaria aceitera, condiciones en Vicentín, reforma laboral, SMVM, organización — o cualquier tema que te interese.' },
        ],
        tags: ['podcast', 'audio', 'narrativa'],
        time: this._timeNow(),
      },
      reel: {
        role: 'hornero',
        sections: [
          { title: 'Chateá con la IA Sindical', body: 'Te guío para armar un reel sindical — video corto, 30-90 segundos. Hook visual, mensaje central, call to action. Contame qué querés comunicar y te propongo texto on-screen y estructura.' },
          { title: '¿Qué mensaje querés que impacte?', body: 'Paritaria aceitera, denuncia de condiciones, SMVM vs canasta, organización sindical — o el mensaje que quieras.' },
        ],
        tags: ['reel', 'video', 'redes'],
        time: this._timeNow(),
      },
      columna: {
        role: 'hornero',
        sections: [
          { title: 'Chateá con la IA Sindical', body: 'Te guío para armar una columna de opinión — texto para diario, 800-1200 palabras. Ángulo, datos, quote de referente, cierre. Contame tu tema y te propongo estructura, fuentes y argumentos.' },
          { title: '¿Qué ángulo querés tomar?', body: 'Paritaria aceitera, SMVM y distribución del ingreso, reforma laboral, condiciones de trabajo — o el ángulo que quieras.' },
        ],
        tags: ['columna', 'texto', 'argumento'],
        time: this._timeNow(),
      },
      entrevista: {
        role: 'hornero',
        sections: [
          { title: 'Chateá con la IA Sindical', body: 'Te guío para prepararte para una entrevista — puntos clave, argumentos, quotes para citar, ejercicio de respuestas. Contame de qué va la entrevista y te armo la preparación completa.' },
          { title: '¿De qué va la entrevista?', body: 'Paritaria aceitera, reforma laboral, SMVM, condiciones de trabajo — o el tema que te van a preguntar.' },
        ],
        tags: ['entrevista', 'radio', 'preparación'],
        time: this._timeNow(),
      },
    };
    return greetings[formato] || greetings.podcast;
  }

  // ===== Fallback offline: keyword-matching (same as contenido) =====

  _generateResponse(userText, formato, step) {
    const lower = userText.toLowerCase();
    const keywords = {
      paritaria: ['paritaria', 'paritario', 'negociación', 'aumento', 'salario', 'básico', 'plenario'],
      condiciones: ['condiciones', 'planta', 'epp', 'enfermería', 'accidente', 'fuga', 'prensa', 'turno', 'ritmo'],
      smvm: ['smvm', 'mínimo', 'canasta', 'costo de vida', 'alquiler', 'vivienda', 'distribución', 'ingreso'],
      reforma: ['reforma', 'dnu', 'ley bases', 'bargaining', 'ultraactividad', 'banco de horas', 'flexibilización', 'plataforma'],
      yofra: ['yofra', 'federación', 'frente', 'fresu', 'huelga', 'organización', 'cretino'],
      cremonte: ['cremonte', 'valor', 'fuerza de trabajo', 'principio protector', 'oit', 'internacional', 'convenio'],
      vicentin: ['vicentín', 'vicentin', 'concurso', 'expeller', 'refinado', 'retención'],
      guaycuru: ['guaycurú', 'guaycuru', 'desmotadora', 'algodón', 'temporal'],
    };
    const matchedThemes = [];
    for (const [theme, kws] of Object.entries(keywords)) {
      if (kws.some(kw => lower.includes(kw))) matchedThemes.push(theme);
    }
    if (matchedThemes.length === 0) return this._generateSuggestion(formato, step);

    const sections = [];
    const tags = [];
    for (const theme of matchedThemes) {
      const kbEntry = this._getKnowledgeForTheme(theme);
      if (kbEntry) {
        if (kbEntry.datos && kbEntry.datos.length > 0) {
          sections.push({ title: kbEntry.tema, body: kbEntry.datos.slice(0, 5).map(d => '• ' + d).join('\n') });
          tags.push(theme);
        }
        if (kbEntry.quote) {
          sections.push({ title: '', body: '', quote: kbEntry.quote, quoteAuthor: kbEntry.quoteAuthor, quoteSource: kbEntry.quoteSource });
          tags.push(theme);
        }
      }
    }
    tags.push(formato);
    sections.push({ title: 'Próximo paso', body: '¿Querés profundizar? Podés pedir: más datos, otro quote, cambiar ángulo.' });
    return { role: 'hornero', sections, tags, time: this._timeNow() };
  }

  _generateSuggestion(formato, step) {
    return {
      role: 'hornero',
      sections: [
        { title: 'Chateá con la IA Sindical', body: 'Te propongo temas:\n• Paritaria aceitera 2026 — cómo se negocia con concurso\n• Condiciones en Vicentín: planta al 80%, enfermería clausurada\n• SMVM vs básico del convenio — la brecha que no se ve\n• Reforma laboral: lo que Yofra y Cremonte dicen\n• Organización sindical: "Organizar es construir" (Yofra)' },
        { title: '', body: '', quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Ciclo "Por las hendijas del Quebracho", enero 2021' },
        { title: 'Próximo paso', body: 'Elegí un tema o escribí libremente. La IA te guía.' },
      ],
      tags: [formato, 'sugerencia'],
      time: this._timeNow(),
    };
  }

  _getKnowledgeForTheme(theme) {
    const kbMap = {
      paritaria: this._iaKB.convenios.paritaria,
      condiciones: this._iaKB.convenios.condiciones,
      smvm: this._iaKB.convenios.smvm,
      reforma: this._iaKB.convenios.CCT420,
      vicentin: this._iaKB.convenios.condiciones,
      guaycuru: this._iaKB.convenios.condiciones,
      yofra: this._iaKB.convenios.paritaria,
      cremonte: this._iaKB.convenios.smvm,
    };
    return kbMap[theme] || null;
  }

  _timeNow() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' +
           now.getMinutes().toString().padStart(2, '0');
  }

  // ===== Suggestion generation =====
  _getSuggestionsForGreeting(formato) {
    const suggestions = {
      podcast: ['Paritaria aceitera 2026', 'Condiciones en Vicentín', 'Reforma laboral', 'SMVM y básico', '¿Cómo se estructura un podcast?'],
      reel: ['Denuncia condiciones', 'Paritaria: la patronal propuso CERO', 'SMVM vs canasta', 'Reforma laboral', '¿Qué hook me propones?'],
      columna: ['Paritaria y concurso preventivo', 'SMVM vs básico convenio', 'Reforma laboral: siglo XIX', 'CCT 420 territorio conquistado', '¿Qué ángulo me recomendas?'],
      entrevista: ['Paritaria aceitera', 'SMVM y distribución', 'Condiciones de trabajo', 'Reforma laboral', '¿Qué puntos clave?'],
    };
    return suggestions[formato] || suggestions.podcast;
  }

  _getSuggestionsForResponse(userText, formato) {
    const lower = userText.toLowerCase();
    // Contextual suggestions based on keywords
    if (lower.includes('paritaria') || lower.includes('salario') || lower.includes('básico')) {
      return ['Más datos sobre paritaria', 'Quote de Yofra', '¿Qué hizo Caputo?', 'SMVM vs básico convenio', 'Armar contenido completo'];
    }
    if (lower.includes('condiciones') || lower.includes('planta') || lower.includes('enfermería')) {
      return ['Más datos sobre Vicentín', 'Quote de Yofra sobre condiciones', 'EPP y accidentes', 'Enfermería clausurada', 'Armar denuncia'];
    }
    if (lower.includes('smvm') || lower.includes('mínimo') || lower.includes('canasta')) {
      return ['Datos SMVM 2026', 'Quote de Cremonte', 'Básico vs alquiler', 'Distribución del ingreso', 'Armar contenido'];
    }
    if (lower.includes('reforma') || lower.includes('dnu') || lower.includes('ley bases')) {
      return ['Bargaining por empresa', 'Ultraactividad', 'Banco de horas', 'Quote de Cremonte', 'OIT y responsabilidad'];
    }
    if (lower.includes('yofra')) {
      return ['Discursos de Yofra', 'Organización sindical', 'Huelga general', 'FreSU 50 organizaciones', 'Quote sobre paritaria'];
    }
    if (lower.includes('cremonte')) {
      return ['Valor y fuerza de trabajo', 'Principio protector', 'OIT Conferencia 114', 'Distribución del ingreso', 'Quote sobre convenio'];
    }
    // Generic follow-up suggestions
    const generic = {
      podcast: ['Contame más', 'Quote de Yofra', 'Quote de Cremonte', 'Armar script completo', 'Cambiar tema'],
      reel: ['Contame más', 'Hook alternativo', 'Texto on-screen', 'Call to action', 'Cambiar tema'],
      columna: ['Contame más', 'Datos concretos', 'Quote de referente', 'Armar draft completo', 'Cambiar ángulo'],
      entrevista: ['Contame más', 'Puntos clave', 'Ejercicio de respuestas', 'Quote para citar', 'Preparación completa'],
    };
    return generic[formato] || generic.podcast;
  }
}

customElements.define('hornero-consulta', HorneroConsulta);
