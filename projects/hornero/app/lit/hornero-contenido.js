// ===== <hornero-contenido> — Contenido Sindical =====
// 4 formatos: Podcast, Reel IG, Columna opinión, Entrevista radial
// Chat IA local con knowledge base: convenios aceiteros + Yofra + Cremonte
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroContenido extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      formato: String,      // podcast|reel|columna|entrevista
      chatActive: Boolean,
      messages: Array,
      iaStep: Number,       // IA conversation step within format
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.formato = '';
    this.chatActive = false;
    this.messages = [];
    this.iaStep = 0;

    // ===== Knowledge Base =====
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
          {
            tema: 'organización',
            quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate. El que no está, no construye.',
            fuente: 'Daniel Yofra, ciclo "Por las hendijas del Quebracho", enero 2021',
            medio: 'Perfil/Futurock',
          },
          {
            tema: 'resistencia',
            quote: 'Este gobierno vino a declararnos la guerra en diciembre de 2023. No va a alcanzar con el diálogo ni con una movilización. Hay que hacer huelga.',
            fuente: 'Daniel Yofra, reelección secretario general FOEIAP, marzo 2026',
            medio: 'Página/12',
          },
          {
            tema: 'paritaria',
            quote: 'La propuesta patronal fue cero. Nosotros arrancamos con huelga de 7 días y forzamos la mano del ministro Caputo. Eso es lo que hace la organización cuando se pone firme.',
            fuente: 'Daniel Yofra, Gestión Sindical, diciembre 2025',
            medio: 'Gestión Sindical',
          },
          {
            tema: 'frente',
            quote: 'Construimos un frente de 50 organizaciones. No esperamos que los legisladores nos defiendan — los cretinos son los que no defienden a los trabajadores.',
            fuente: 'Daniel Yofra, Perfil/Futurock, enero 2026',
            medio: 'Perfil/Futurock',
          },
          {
            tema: 'guerra',
            quote: 'El gobierno declaró la guerra al movimiento obrero. FreSU, 100 sindicatos juntos, va a marchar. Huelga general, movilización, resistencia.',
            fuente: 'Daniel Yofra, El Sindicato, junio 2026',
            medio: 'El Sindicato',
          },
        ],
      },
      cremonte: {
        discursos: [
          {
            tema: 'reforma-laboral',
            quote: 'La reforma laboral es un retorno al siglo XIX. Bargaining por empresa es letal para el modelo sindical — achica la representación al 5% como en Brasil y Colombia.',
            fuente: 'Cremonte, La Izquierda Diario, noviembre 2025',
            medio: 'La Izquierda Diario',
          },
          {
            tema: 'principio-protector',
            quote: 'El principio protector de la LCT es compensatorio de la desigualdad real. La reforma lo invierte — ahora el más débil tiene que probar, no el más fuerte.',
            fuente: 'Cremonte, Tiempo Argentino, noviembre 2025',
            medio: 'Tiempo Argentino',
          },
          {
            tema: 'ultraactividad',
            quote: 'Ultraactividad es negociar sin red. Si se elimina, cuando un convenio vence, todo vuelve a la ley — y la ley es el piso más bajo. El sindicato pierde lo conquistado.',
            fuente: 'Cremonte, Tiempo Argentino, noviembre 2025',
            medio: 'Tiempo Argentino',
          },
          {
            tema: 'banco-horas',
            quote: 'El banco de horas flexibiliza la jornada completamente. El patronal decide cuándo trabajas y cuándo no. Tu soberanía sobre el día de trabajo desaparece.',
            fuente: 'Cremonte, Degremiales, junio 2026',
            medio: 'Degremiales/El Espectador',
          },
          {
            tema: 'responsabilidad-internacional',
            quote: 'Argentina va a incurrir en responsabilidad internacional. 160 artículos contravienen la Constitución. Plataformas excluidas de toda tutela. Huelga prácticamente prohibida.',
            fuente: 'Cremonte, audiencia congressional ALAL, febrero 2026',
            medio: 'ALAL Laboralistas',
          },
          {
            tema: 'oit',
            quote: 'América Latina experimenta un retroceso peligroso en derechos sociales. Argentina rompe el piso del Convenio OIT N°1 de 1919 — permite jornadas de 12 horas. Criminalización de la protesta.',
            fuente: 'Cremonte, Conferencia OIT 114, Geneva, junio 2026',
            medio: 'ALAL/OIT',
          },
          {
            tema: 'distribución',
            quote: 'La distribución del ingreso no es un fenómeno natural — es el resultado de una relación de fuerzas. Cuando la patronal tiene más fuerza, la distribución se inclina. Cuando el movimiento obrero se organiza, se rebalancea.',
            fuente: 'Cremonte, investigación distribución del ingreso, 2025',
            medio: 'CIFRA/Investigación',
          },
          {
            tema: 'convenio',
            quote: 'El convenio no es solo un texto legal — es un territorio conquistado. Cada cláusula es una lucha que se ganó, y cada cláusula que no está es una lucha que se perdió. Defender el convenio es defender esa conquista.',
            fuente: 'Cremonte, clase convenios aceiteros, 2026',
            medio: 'Formación sindical',
          },
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

      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 8px; }
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
      .format-card.active { border-color: var(--ho-green, #6E8345);
        background: var(--ho-green-pale, #E8EDD7); }

      .format-icon { width: 42px; height: 42px; border-radius: 50%;
        background: var(--ho-green-pale, #E8EDD7);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.15rem; flex: none; }
      .format-card.active .format-icon { background: var(--ho-green, #6E8345); }

      .format-info { flex: 1; }
      .format-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); margin-bottom: 2px; }
      .format-desc { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4; }
      .format-tags { display: flex; gap: 5px; margin-top: 5px; }
      .format-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

      .format-hint { font-family: 'Public Sans', sans-serif; font-size: .78rem;
        color: var(--ho-text-light, #9C988D); margin-top: 14px;
        line-height: 1.4; padding: 0 2px; }

      /* Disclaimer */
      .disclaimer { background: var(--ho-green-pale, #E8EDD7); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #586B33);
        margin-top: 12px; line-height: 1.4; }

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
          <div class="section-title">¿Te van a hacer una entrevista? ¿Te pidieron escribir una nota para el diario del pueblo? ¿Querés contar lo que pasó en IG o en un podcast? Chateá con la IA Sindical: te puede ayudar con algunos tips para reforzar y comunicar mejor tus ideas.</div>
          <div class="format-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
    }

    // Step 1: Chat active
    const titleMap = { podcast: 'Podcast', reel: 'Reel IG', columna: 'Columna opinión', entrevista: 'Entrevista radial' };
    const chatTitle = 'Contenido — ' + (titleMap[this.formato] || this.formato);

    return html`
      <div class="chat-container">
        <hornero-chat
          title="${chatTitle}"
          disclaimer="⚠️ La IA propone — vos decidís, editás, aprobás. Fuentes: CCT 420/05, Yofra, Cremonte."
          input-placeholder="Escribí tu tema, pregunta, o pedido..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    if (!this.chatActive) {
      // Format selection clicks
      this.shadowRoot.querySelectorAll('.format-card').forEach(card => {
        card.addEventListener('click', () => {
          const fmt = card.dataset.formato;
          this._startChat(fmt);
        });
      });
      return;
    }

    // Chat mode — bind events
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      // Populate messages into chat
      this._syncChatMessages(chatEl);

      // Listen for chat-send events
      chatEl.addEventListener('chat-send', (e) => {
        this._handleUserMessage(e.detail.text);
      });

      // Listen for chat-back events — go back to format selection
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

    // Generate first IA message — greeting + format guidance
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
    this.render();
  }

  _syncChatMessages(chatEl) {
    // Push all messages into the chat component
    if (chatEl && this.messages.length > 0) {
      // Only sync if chat doesn't already have them
      // We rebuild the chat's messages array from our state
      chatEl.messages = this.messages;
      // Also sync typing state
      chatEl.typing = this._typing;
      // Force re-render of chat component
      chatEl.render();
    }
  }

  _generateGreeting(formato) {
    const greetings = {
      podcast: {
        role: 'hornero',
        sections: [
          {
            title: '🎙️ Podcast sindical — vamos a armarlo',
            body: 'Un podcast es audio narrado, 5-15 minutos. Se escucha en el colectivo, en la planta, en la asamblea. Te guío paso a paso: tema, estructura, script, fuentes.',
          },
          {
            title: 'Primero: ¿de qué querés hablar?',
            body: 'Contame el tema o el ángulo. Puede ser paritaria aceitera, condiciones en Vicentín, reforma laboral, SMVM, organización — o cualquier cosa que te interese comunicar.',
          },
        ],
        tags: ['podcast', 'audio', 'narrativa'],
        time: this._timeNow(),
      },
      reel: {
        role: 'hornero',
        sections: [
          {
            title: '📱 Reel sindical — impacto en 30 segundos',
            body: 'Un reel es video corto, 30-90 segundos. Hook visual, mensaje central, call to action. Se comparte en redes y genera alcance rápido.',
          },
          {
            title: '¿Qué mensaje querés que impacte?',
            body: 'Contame el mensaje central. Puede ser: paritaria aceitera, denuncia condiciones, SMVM vs canasta, organización sindical, resistencia patronal.',
          },
        ],
        tags: ['reel', 'video', 'redes'],
        time: this._timeNow(),
      },
      columna: {
        role: 'hornero',
        sections: [
          {
            title: '✍️ Columna de opinión — argumento documentado',
            body: 'Una columna para diario, 800-1200 palabras. Ángulo, datos, quote de referente, cierre. La IA te ayuda con estructura, fuentes y argumentos.',
          },
          {
            title: '¿Qué ángulo querés tomar?',
            body: 'Contame el tema o ángulo. Paritaria aceitera y concurso, reforma laboral, SMVM y distribución del ingreso, condiciones laborales, organización sindical.',
          },
        ],
        tags: ['columna', 'texto', 'argumento'],
        time: this._timeNow(),
      },
      entrevista: {
        role: 'hornero',
        sections: [
          {
            title: '📻 Preparación para entrevista radial',
            body: 'Te preparo completo: puntos clave, argumentos, quotes para citar, ejercicio de respuestas. No te mandamos solo a la radio.',
          },
          {
            title: '¿De qué va la entrevista?',
            body: 'Contame el tema. Paritaria aceitera, reforma laboral, SMVM, condiciones de trabajo, organización sindical — te armo los puntos y las fuentes.',
          },
        ],
        tags: ['entrevista', 'radio', 'preparación'],
        time: this._timeNow(),
      },
    };
    return greetings[formato] || greetings.podcast;
  }

  _handleUserMessage(text) {
    // Add user message
    const userMsg = { role: 'user', text: text, time: this._timeNow() };
    this.messages = [...this.messages, userMsg];

    // Show typing
    this._typing = true;
    this.render();

    // Generate IA response after delay (simulates thinking)
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      const iaMsg = this._generateResponse(text, this.formato, this.iaStep);
      this.messages = [...this.messages, iaMsg];
      this.iaStep++;
      this._typing = false;
      this.render();
    }, delay);
  }

  _generateResponse(userText, formato, step) {
    const lower = userText.toLowerCase();

    // ===== Keyword detection =====
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

    // Find which themes match
    const matchedThemes = [];
    for (const [theme, kws] of Object.entries(keywords)) {
      if (kws.some(kw => lower.includes(kw))) {
        matchedThemes.push(theme);
      }
    }

    // If no keywords match, suggest themes
    if (matchedThemes.length === 0) {
      return this._generateSuggestion(formato, step);
    }

    // ===== Build response from matched themes =====
    const sections = [];
    const tags = [];
    const usedQuotes = [];

    // Format-specific structure
    if (formato === 'podcast') {
      sections.push({
        title: '🎙️ Podcast: estructura del episodio',
        body: this._podcastStructure(matchedThemes, step),
      });
    } else if (formato === 'reel') {
      sections.push({
        title: '📱 Reel: estructura del video',
        body: this._reelStructure(matchedThemes, step),
      });
    } else if (formato === 'columna') {
      sections.push({
        title: '✍️ Columna: estructura del artículo',
        body: this._columnaStructure(matchedThemes, step),
      });
    } else if (formato === 'entrevista') {
      sections.push({
        title: '📻 Entrevista: puntos clave',
        body: this._entrevistaStructure(matchedThemes, step),
      });
    }

    // Add knowledge from matched themes
    for (const theme of matchedThemes) {
      const kbEntry = this._getKnowledgeForTheme(theme);
      if (kbEntry) {
        // Data section
        if (kbEntry.datos && kbEntry.datos.length > 0) {
          sections.push({
            title: kbEntry.tema,
            body: kbEntry.datos.slice(0, 5).map(d => '• ' + d).join('\n'),
          });
          tags.push(theme);
        }
        // Quote section
        if (kbEntry.quote) {
          sections.push({
            title: '',
            body: '',
            quote: kbEntry.quote,
            quoteAuthor: kbEntry.quoteAuthor,
            quoteSource: kbEntry.quoteSource,
          });
          tags.push(kbEntry.quoteAuthor?.includes('Yofra') ? 'yofra' : kbEntry.quoteAuthor?.includes('Cremonte') ? 'cremonte' : theme);
          usedQuotes.push(kbEntry.quote);
        }
      }
    }

    // Add Yofra discursos if relevant
    if (matchedThemes.includes('yofra') || matchedThemes.includes('paritaria') || matchedThemes.includes('organización')) {
      const yofraDisc = this._findRelevantDiscurso(this._iaKB.yofra.discursos, matchedThemes);
      if (yofraDisc && !usedQuotes.includes(yofraDisc.quote)) {
        sections.push({
          quote: yofraDisc.quote,
          quoteAuthor: 'Daniel Yofra — Sec. Gral. Federación Nacional Aceitera',
          quoteSource: yofraDisc.fuente,
        });
        tags.push('yofra');
      }
    }

    // Add Cremonte discursos if relevant
    if (matchedThemes.includes('cremonte') || matchedThemes.includes('reforma') || matchedThemes.includes('smvm')) {
      const cremDisc = this._findRelevantDiscurso(this._iaKB.cremonte.discursos, matchedThemes);
      if (cremDisc && !usedQuotes.includes(cremDisc.quote)) {
        sections.push({
          quote: cremDisc.quote,
          quoteAuthor: 'Cremonte — investigador labour',
          quoteSource: cremDisc.fuente,
        });
        tags.push('cremonte');
      }
    }

    // Add format tag
    tags.push(formato);

    // Closing prompt
    const prompts = {
      podcast: '¿Querés que arme el script completo? O contame más sobre el tema y lo profundizo.',
      reel: '¿Querés que te arme el texto on-screen y el call to action? O ajustamos el hook.',
      columna: '¿Querés que arme el draft completo? O profundizamos algún argumento.',
      entrevista: '¿Querés que arme ejercicio de respuestas a preguntas difíciles? O agregamos más puntos.',
    };
    sections.push({
      title: 'Próximo paso',
      body: prompts[formato] + '\n\nPodés pedir: más datos, otro quote, cambiar ángulo, profundizar, armar draft.',
    });

    return { role: 'hornero', sections, tags, time: this._timeNow() };
  }

  _generateSuggestion(formato, step) {
    const suggestions = {
      podcast: {
        sections: [
          { title: '💡 Ideas para tu podcast', body: 'Te propongo temas con impacto:\n• Paritaria aceitera 2026 — cómo se negocia con concurso\n• Condiciones en Vicentín: planta al 80%, enfermería clausurada\n• SMVM vs básico del convenio — la brecha que no se ve\n• Reforma laboral: lo que Yofra y Cremonte dicen\n• Organización sindical: "Organizar es construir" (Yofra)' },
          { title: '', body: '', quote: 'Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Ciclo "Por las hendijas del Quebracho", enero 2021' },
          { title: 'Próximo paso', body: 'Elegí uno o contame tu propio tema. Podés escribir libremente — la IA te guía.' },
        ],
        tags: ['podcast', 'sugerencia'],
      },
      reel: {
        sections: [
          { title: '💡 Ideas para tu reel', body: 'Te propongo mensajes con impacto:\n• "Paritaria aceitera: la patronal propuso CERO" (Yofra)\n• "Tu básico no cubre el alquiler — $340K vs $380K"\n• "Enfermería clausurada 3 meses — violación Art.42"\n• "Reforma laboral = siglo XIX" (Cremonte)\n• "Organizar es construir" (Yofra)' },
          { title: '', body: '', quote: 'La propuesta patronal fue cero. Nosotros arrancamos con huelga de 7 días y forzamos la mano del ministro.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Gestión Sindical, diciembre 2025' },
          { title: 'Próximo paso', body: 'Elegí un mensaje o proponé el que quieras. La IA te arma el hook y el texto on-screen.' },
        ],
        tags: ['reel', 'sugerencia'],
      },
      columna: {
        sections: [
          { title: '💡 Ideas para tu columna', body: 'Ángulos con argumento:\n• Paritaria aceitera y concurso preventivo — ¿excusa o estrategia?\n• SMVM vs básico convenio — distribución del ingreso\n• Reforma laboral: retorno al siglo XIX (Cremonte)\n• CCT 420/05: territorio conquistado, cláusulas bajo ataque\n• Condiciones aceiteras: planta 80%, enfermería clausurada, EPP insuficientes' },
          { title: '', body: '', quote: 'El convenio no es solo un texto legal — es un territorio conquistado. Cada cláusula es una lucha que se ganó.', quoteAuthor: 'Cremonte', quoteSource: 'Clase convenios aceiteros, 2026' },
          { title: 'Próximo paso', body: 'Elegí un ángulo o proponé el que quieras. La IA te arma estructura, datos, quotes y cierre.' },
        ],
        tags: ['columna', 'sugerencia'],
      },
      entrevista: {
        sections: [
          { title: '💡 Temas para tu entrevista', body: 'Puntos que impactan en radio:\n• Paritaria aceitera: "La propuesta fue cero" (Yofra)\n• SMVM: básico convenio debajo del mínimo legal\n• Condiciones: planta 80%, enfermería clausurada, accidentes\n• Reforma laboral: "Retorno al siglo XIX" (Cremonte)\n• Organización: FreSU 100 sindicatos, huelga general' },
          { title: '', body: '', quote: 'Este gobierno vino a declararnos la guerra. No va a alcanzar con el diálogo. Hay que hacer huelga.', quoteAuthor: 'Daniel Yofra', quoteSource: 'Reelección FOEIAP, marzo 2026' },
          { title: 'Próximo paso', body: 'Elegí un tema o contame qué te van a preguntar. Te armo puntos, argumentos, y ejercicio de respuestas.' },
        ],
        tags: ['entrevista', 'sugerencia'],
      },
    };
    return { role: 'hornero', sections: suggestions[formato].sections, tags: suggestions[formato].tags, time: this._timeNow() };
  }

  // ===== Format-specific structure generators =====

  _podcastStructure(themes, step) {
    const themeLabel = themes.map(t => this._themeLabel(t)).join(' · ');
    if (step === 0) {
      return `Episodio sobre: ${themeLabel}\n\nEstructura propuesta:\n1. Intro (30 seg): hook — "Lo que no te dicen sobre ${themes.includes('paritaria') ? 'la paritaria aceitera' : themes.includes('condiciones') ? 'las condiciones en la planta' : 'el tema que importa'}"\n2. Desarrollo (3-5 min): datos, contexto, lo que pasa\n3. Quote (30 seg): voz de referente (Yofra o Cremonte)\n4. Conclusión (1 min): qué hacer, cómo organizarse`;
    }
    return `Profundizamos ${themeLabel}:\n\n1. Contexto amplio — qué pasó, qué pasa, qué viene\n2. Datos concretos — cifras del convenio, condiciones, SMVM\n3. Argumento — lo que la patronal dice vs lo que realmente es\n4. Quote — referente sindical\n5. Call to action — organizarse, informarse, actuar`;
  }

  _reelStructure(themes, step) {
    const themeLabel = themes.map(t => this._themeLabel(t)).join(' · ');
    if (step === 0) {
      return `Reel sobre: ${themeLabel}\n\nEstructura propuesta:\n• Hook (3 seg): imagen impactante + pregunta o dato shock\n• Mensaje (20-60 seg): texto on-screen + narración\n• Quote (10 seg): frase de Yofra o Cremonte en pantalla\n• CTA (5 seg): "Organizar es construir" + logo`;
    }
    return `Hook alternativo para ${themeLabel}:\n• Dato shock: "Tu básico no cubre el alquiler"\n• Pregunta: "¿Sabés que la patronal propuso CERO?"\n• Denuncia: "Enfermería clausurada 3 meses"\n• Comparación: "SMVM $2.3M vs básico convenio $340K"`;
  }

  _columnaStructure(themes, step) {
    const themeLabel = themes.map(t => this._themeLabel(t)).join(' · ');
    if (step === 0) {
      return `Columna sobre: ${themeLabel}\n\nEstructura (800-1200 palabras):\n1. Apertura: dato o situación que impacta (1-2 párrafos)\n2. Contexto: qué pasó, cómo se llegó acá (3-4 párrafos)\n3. Argumento: lo que la patronal dice vs la realidad (2-3 párrafos)\n4. Quote: referente sindical cita (1 párrafo)\n5. Cierre: qué hacer, organización, perspectiva (1-2 párrafos)`;
    }
    return `Profundizamos argumento para ${themeLabel}:\n\n• La patronal dice: "concurso limita", "no hay plata", "modernización"\n• La realidad: planta al 80%, producción existe, básico debajo del SMVM\n• El convenio: territorio conquistado, cada cláusula es lucha\n• La organización: FreSU, huelga, resistencia`;
  }

  _entrevistaStructure(themes, step) {
    const themeLabel = themes.map(t => this._themeLabel(t)).join(' · ');
    if (step === 0) {
      return `Preparación entrevista sobre: ${themeLabel}\n\nPuntos clave para la radio:\n1. ${themes.includes('paritaria') ? 'Paritaria aceitera: patronal propuso CERO, huelga de 7 días forzó negociación' : 'Tu punto principal'}\n2. ${themes.includes('condiciones') ? 'Condiciones: planta 80%, enfermería clausurada, EPP insuficientes' : 'Segundo punto con datos'}\n3. Quote de referente para citar\n4. Qué hacer: organización, FreSU, huelga general`;
    }
    return `Puntos adicionales para ${themeLabel}:\n\n• SMVM vs básico convenio — la brecha que no se ve\n• Reforma laboral — "retorno al siglo XIX" (Cremonte)\n• Distribución del ingreso — relación de fuerzas\n• Organización — "Organizar es construir" (Yofra)`;
  }

  // ===== Knowledge retrieval helpers =====

  _getKnowledgeForTheme(theme) {
    const kbMap = {
      paritaria: this._iaKB.convenios.paritaria,
      condiciones: this._iaKB.convenios.condiciones,
      smvm: this._iaKB.convenios.smvm,
      reforma: this._iaKB.convenios.CCT420, // Reforma relates to convenio defense
      vicentin: this._iaKB.convenios.condiciones,
      guaycuru: this._iaKB.convenios.condiciones,
      yofra: this._iaKB.convenios.paritaria, // Yofra → paritaria context
      cremonte: this._iaKB.convenios.smvm, // Cremonte → SMVM context
    };
    return kbMap[theme] || null;
  }

  _findRelevantDiscurso(discursos, matchedThemes) {
    // Find a discurso that matches one of the themes
    const themeKeywords = {
      paritaria: ['paritaria', 'huelga', 'propuesta', 'patronal'],
      condiciones: ['organización', 'resistencia', 'guerra'],
      smvm: ['distribución', 'convenio', 'valor'],
      reforma: ['reforma', 'siglo XIX', 'bargaining', 'principio protector', 'ultraactividad'],
      yofra: ['organización', 'resistencia', 'paritaria', 'frente', 'huelga', 'guerra', 'cretino'],
      cremonte: ['reforma-laboral', 'principio-protector', 'ultraactividad', 'banco-horas', 'responsabilidad-internacional', 'oit', 'distribución', 'convenio'],
      vicentin: ['paritaria', 'condiciones'],
      guaycuru: ['condiciones'],
    };

    for (const theme of matchedThemes) {
      const kws = themeKeywords[theme] || [theme];
      const match = discursos.find(d => kws.some(kw => d.tema.includes(kw) || d.quote.toLowerCase().includes(kw)));
      if (match) return match;
    }

    // Fallback: random discurso
    return discursos[Math.floor(Math.random() * discursos.length)];
  }

  _themeLabel(theme) {
    const labels = {
      paritaria: 'paritaria aceitera',
      condiciones: 'condiciones laborales',
      smvm: 'SMVM y distribución',
      reforma: 'reforma laboral',
      yofra: 'discursos de Yofra',
      cremonte: 'discursos de Cremonte',
      vicentin: 'Vicentín SAIC',
      guaycuru: 'Guaycurú desmotadora',
    };
    return labels[theme] || theme;
  }

  _timeNow() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' +
           now.getMinutes().toString().padStart(2, '0');
  }
}

customElements.define('hornero-contenido', HorneroContenido);
