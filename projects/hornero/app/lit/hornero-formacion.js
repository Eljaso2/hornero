// ===== <hornero-formacion> — Esfera 3: Historia Obrera · Formación =====
// Banner + bajada + chat con Historiadora que cuenta la efeméride de la semana
// Contenido: Efemérides · Mitín · Colección · Retazos
// Native Web Component — zero dependencies

import { HoComponent, html, css } from './ho-component.js';

class HorneroFormacion extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      persona: String,  // Initial persona from Mesa de Trabajo landing
      sessionId: String, // Session ID — if set, load existing session instead of greeting
      messages: Array,
      _bannerVisible: Boolean,
      _exploreOpen: Boolean,
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

  static get STREAM_URL() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) {
      return 'http://' + h + ':8000/api/chat/stream';
    }
    return 'https://hornero-ia.onrender.com/api/chat/stream';
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
    this._chatSection = 'historia';
    this.messages = [];
    this._typing = false;
    this._greetingShown = false;
    this._greetingRequested = false;
    this._historyLoaded = false;
    this._bannerVisible = true;
    this._exploreOpen = false;
    this._sessionId = '';
    this._activePersona = 'historiador';
    this._username = '';
    this._progressiveRevealTimer = null;
    this._progressiveRevealFull = '';
    this._progressiveRevealIndex = 0;
    this._savedDrawerState = null;
  }

  connectedCallback() {
    super.connectedCallback();
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session'));
      if (session && session.username) this._username = session.username;
    } catch(e) {}
  }

  // Override render() to save chat drawer state before innerHTML destroys it
  render() {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._savedDrawerState = chatEl.getDrawerState();
    }
    super.render();
  }

  // ===== Data: Efemérides =====
  _getEfemerides() {
    return [
      {
        id: 'cordobazo',
        emoji: '🔥',
        fecha: '29/05',
        year: 1969,
        title: 'El Cordobazo',
        bajada: 'Iconic worker-student uprising against the Onganía dictatorship. Repeal of "sábado inglés" sparked the revolt. Worker Máximo Mena killed. 34 dead, 400 wounded, 2000 detained. Initiated cycle of "azos" across Argentina.',
        author: 'Laura Ortiz',
        narrative: 'El 29 de mayo de 1969, Córdoba se convirtió en el epicentro de la resistencia obrera y popular contra la dictadura de Onganía. La revocación del "sábado inglés" — un descanso ganado por los metallúrgicos — y el aumento del costo de vida detonaron la rebelión. Sindicatos como Luz y Fuerza (Agustín Tosco) y SMATA (Elpidio Torres) convocaron a paro y marchas. Cuando el obrero Máximo Mena fue asesinado por la policía, la ciudad se incendió. Barrios populares, estudiantes y trabajadores ocuparon las calles durante más de 20 horas. El balance oficial: 34 muertos, 400 heridos, 2000 detenidos. El Cordobazo inauguró un ciclo de "azos" — Rosariazo, Viborazo, Tucumanazo — que shook la dictadura hasta su caída.',
        recursos: ['Documento: Programa del Cordobazo (CGT Regional Córdoba)', 'Video: testimonios obreros del 29M'],
        bibliografia: ['James, Daniel — Resistencia e integración. El peronismo y la clase trabajadora argentina, 1946-1976', 'Brennan, James — El Cordobazo. Las guerras obreras en Córdoba 1955-1976'],
      },
      {
        id: 'cgta',
        emoji: '✊',
        fecha: '28/03',
        year: 1968,
        title: 'La CGT de los Argentinos',
        bajada: 'Anti-dictatorial, anti-bureaucratic, anti-imperialist CGT split. Ongaro elected secretary general, breaking from vandorismo. Precursor to the Cordobazo.',
        author: 'Pablo Ghigliani',
        narrative: 'El 28 de marzo de 1968, en el congress de la CGT en Buenos Aires, el grafico Raimundo Ongaro fue electo secretario general, fracturando la central sindical. La CGT de los Argentinos — como se denominó — se declaró anti-dictatorial, anti-bureaucrática y anti-imperialista. Su Programa de Luchas sintetizaba las demandas de toda la clase trabajadora. La CGT Azopardo (vandorista/participacionista) quedó como un apéndice del poder. La CGT de los Argentinos fue precursora directa del Cordobazo: sus militantes — Tosco, Ongaro, Torres — protagonizaron las luchas del 69.',
        recursos: ['Documento: Programa de Luchas de la CGT de los Argentinos', 'Audio: APUntes Radiales — La CGTA'],
        bibliografia: ['Ghigliani, Pablo — La CGT de los Argentinos y la resistencia obrera', 'Torres, Elpidio — Sindicalismo de liberación o colaboración'],
      },
      {
        id: 'viborazo',
        emoji: '🐍',
        fecha: '15/03',
        year: 1971,
        title: 'El Viborazo',
        bajada: 'Córdoba uprising provoked by governor Uriburu\'s declaration to "cut the head of the poisonous snake." SITRAC-SITRAM Fiat clasista unions led the fight. 600-block combat zone — four times the Cordobazo.',
        author: 'Rodolfo Laufer',
        narrative: 'El 15 de marzo de 1971, Córdoba volvió a estallar. El nuevo governor militar José Camilo Uriburu declaró que "hay que cortar la cabeza de la víbora venenosa" — refiriéndose al movimiento obrero. SITRAC-SITRAM, los sindicatos clasistas de Fiat, responded con un paro activo y ocupación de la planta. La combat zone se extendió 600 blocks — cuatro veces el Cordobazo. Más de 300 detenidos, un obrero muerto (Pablo Javier Basualdo). Uriburu y el presidente Levingston tuvieron que renunciar. El Viborazo demostró que el Cordobazo no era un evento aislado sino el inicio de un proceso revolucionario.',
        recursos: ['Video: testimonios SITRAC-SITRAM', 'Documento: Declaración de SITRAC'],
        bibliografia: ['Laufer, Rodolfo — El Viborazo. Córdoba 1971', 'Brennan, James — El Cordobazo y el Viborazo'],
      },
      {
        id: 'tampierazo',
        emoji: '🏭',
        fecha: '03/07',
        year: 1973,
        title: 'El Tampierazo',
        bajada: 'Workers at Tamperi factory in San Francisco, Córdoba occupied the plant over unpaid wages. CGT called citywide strike — 430 factories and 2500 businesses shut down. One adolescent killed by Guardia de Infantería.',
        author: 'Laura Ortiz',
        narrative: 'El 3 de julio de 1973, los obreros de la fábrica Tampieri en San Francisco, Córdoba, occupied la planta por salarios impagos. La CGT local declaró un paro general ciudadano: 430 fábricas y 2500 comercios cerraron. La Guardia de Infantería reprimió — un adolescente fue asesinado. Oscar Liwacki, secretario general de la CGT local, fue desaparecido en 1976. El Tampierazo mostró la combatividad de la clase obrera en el interior del país.',
        recursos: ['Documento: comunicado CGT San Francisco', 'Audio: testimonio obrero Tampieri'],
        bibliografia: ['Ortiz, Laura — El Tampierazo. Obreros en lucha, San Francisco 1973'],
      },
      {
        id: 'tosco-rucci',
        emoji: '📺',
        fecha: '13/02',
        year: 1973,
        title: 'El debate Tosco-Rucci',
        bajada: 'Televised debate between Agustín Tosco (independent Marxist, CGT de los Argentinos) and José Ignacio Rucci (peronista orthodox, CGT Azopardo). Two opposing union and political projects.',
        author: 'Rodolfo Laufer',
        narrative: 'El 13 de febrero de 1973, Canal 11 broadcastó "Las dos campanas" — un debate televisado entre Agustín Tosco y José Ignacio Rucci. Tosco representaba el sindicalismo independiente, clasista, anti-bureaucrático; Rucci, el peronismo orthodox, alignado con Perón desde la CGT Azopardo. Dos proyectos sindicales y políticos contrapuestos se enfrentaron en vivo. El debate sintetizó la tensión entre clase y movimiento que defined el peronismo obrero.',
        recursos: ['Video: debate completo Canal 11', 'Documento: positions de Tosco y Rucci'],
        bibliografia: ['Laufer, Rodolfo — El debate Tosco-Rucci. Dos proyectos sindicales', 'James, Daniel — Resistencia e integración'],
      },
      {
        id: 'santiagueñazo',
        emoji: '🔥',
        fecha: '16/12',
        year: 1993,
        title: 'El Santiagueñazo',
        bajada: 'Popular uprising in Santiago del Estero against neoliberal adjustment (Menem/Cavallo). Protesters burned government buildings, judiciary, legislature. First major crack in neoliberal hegemony, preceding Cutral Có 1996 and Argentinazo 2001.',
        author: 'Gonzalo Pérez Álvarez',
        narrative: 'El 16 de diciembre de 1993, Santiago del Estero eruptedó. Ajuste neoliberal, corrupción, despidos — el pueblo se rebeló. Los manifestantes incendiaron la Casa de Gobierno, el Palacio de Justicia, la Legislatura. Al menos cuatro muertos. El Santiagueñazo fue la primera gran fisura en la hegemonía neoliberal, preceding los cortes de ruta de Cutral Có (1996) y el Argentinazo de 2001. Demostró que la clase trabajadora y el pueblo no eran pasivos frente al modelo.',
        recursos: ['Video: imágenes del Santiagueñazo', 'Documento: crónica del uprising'],
        bibliografia: ['Pérez Álvarez, Gonzalo — El Santiagueñazo. Pueblo en armas contra el ajuste'],
      },
      {
        id: 'argentinazo',
        emoji: '✊',
        fecha: '19/12',
        year: 2001,
        title: 'El Argentinazo',
        bajada: 'December 19-20 insurrection that toppled De la Rúa and Cavallo. Piquetero roadblocks and December 13 general strike as precursors. Working-class and popular protagonism, countering "middle-class" narrative.',
        author: 'Gonzalo Pérez Álvarez',
        narrative: 'El 19 y 20 de diciembre de 2001, Argentina eruptedó. El freeze de depósitos ("corralito") de Cavallo detonó la rebelión. Los piqueteros ya cortaban rutas desde 1996; el paro general del 13 de diciembre fue el detonante. El 19, Plaza de Mayo y todo el país se llenó de cacerolazos. De la Rúa fled en helicopter a las 19:56 del 20. La narrativa dominante lo redujo a una rebelión "middle-class" — pero la protagonistía obrera y popular fue central. El Argentinazo was el clímax de diez años de resistencia al modelo neoliberal.',
        recursos: ['Video: cacerolazos y repression 19/20D', 'Documento: crónica del Argentinazo'],
        bibliografia: ['Pérez Álvarez, Gonzalo — El Argentinazo. Clase obrera y pueblo rebelde', 'Seoane, María — El Argentinazo. Crónica de un país colapsado'],
      },
    ];
  }

  // ===== Data: Mitín =====
  _getMitin() {
    return [
      {
        id: 'masculinidades',
        emoji: '👨‍🔧',
        title: '"Con Perón, todos éramos machos"',
        author: 'Florencia Gutiérrez',
        bajada: 'Masculinidades y identidades de clase en los ingenios azucareros de Tucumán.',
        text: 'Florencia Gutiérrez analiza cómo la identidad masculine obrera se constituted en los ingenios tucumanos durante el primer peronismo. "Con Perón, todos éramos machos" — la frase sintetiza una intersection de clase, género y política que defined la cultura obrera del Norte argentino. Los ingenios eran spaces de producción pero también de identity: ser obrero era ser hombre, ser peronista era ser macho. La research揭示了 la complejidad de las identities obreras.',
        link: 'https://historiaobrera.com.ar/mitin/',
      },
      {
        id: 'joven-clase',
        emoji: '📖',
        title: 'A propósito de una obra en construcción',
        author: 'Ludmila Scheinkman',
        bajada: 'Un joven y su encuentro con la clase obrera organizada — narrativa de formación política.',
        text: 'Ludmila Scheinkman cuenta la historia de un joven que descubre la clase obrera organizada como un mundo nuevo. La narrativa explores the journey de formación política: la encounter con el sindicato, la fábrica, la asamblea. "Una obra en construcción" — tanto la personal como la social. El texto refleja la experience de miles de jóvenes que se politicalizaron al contacto con el movimiento obrero.',
        link: 'https://historiaobrera.com.ar/mitin/',
      },
      {
        id: 'trenes',
        emoji: '🚂',
        title: '"Las que bajaron de los trenes"',
        author: 'Mirta Zaida Lobato',
        bajada: 'Women workers who arrived by train — gender, migration and labor in early 20th century Argentina.',
        text: 'Mirta Zaida Lobato reconstruct the history de las obreras que "bajaron de los trenes" — mujeres que migrated from el interior y Europa hacia Buenos Aires para trabajar en fábricas y talleres. El tren fue el vehículo de la migration pero también de la transformation: de rural a urban, de campesina a obrera. Lobato explores las intersections de género, migration y trabajo en la Argentina modern.',
        link: 'https://historiaobrera.com.ar/mitin/',
      },
    ];
  }

  // ===== Data: Colección La Argentina Peronista =====
  _getColeccion() {
    return [
      { num: 1, title: 'El Peronismo Obrero', author: 'Gustavo Nicolás Contreras', tema: 'Workers and Peronism', emoji: '🧑‍🏭' },
      { num: 4, title: 'La Resistencia Peronista', author: 'Julio Cesar Melon Pirro', tema: 'Peronist resistance 1955–1960', emoji: '🔥' },
      { num: 5, title: 'Entre los Cañaverales', author: 'Florencia Gutiérrez et al.', tema: 'Peronist irruption in Tucumán', emoji: '🌾' },
      { num: 6, title: 'Mujeres que Trabajan', author: 'Graciela Queirolo', tema: 'Women\'s labor, state, unions 1910–1960', emoji: '👩‍💼' },
      { num: 7, title: 'Estrategias de la Clase Obrera', author: 'Nicolás Iñigo Carrera', tema: 'Working-class strategies in Peronism origins', emoji: '✊' },
      { num: 17, title: 'Reinas del Trabajo', author: 'Mirta Zaida Lobato', tema: 'Gender, politics, culture in first Peronism', emoji: '👑' },
    ];
  }

  // ===== Data: Retazos =====
  _getRetazos() {
    return [
      { id: 'docuficcion', title: 'Docuficción', desc: 'Narrativa audiovisual que mezcla documento y ficción', emoji: '🎬', link: 'https://historiaobrera.com.ar/retazos-de-historia-obrera/' },
      { id: 'capsula', title: 'Cápsula del tiempo', desc: 'Fragmentos sonoros y visuales de la memoria obrera', emoji: '⏳', link: 'https://historiaobrera.com.ar/retazos-de-historia-obrera/' },
      { id: 'ilustraciones', title: 'Ilustraciones', desc: 'Arte gráfico que interpreta la lucha obrera', emoji: '🎨', link: 'https://historiaobrera.com.ar/retazos-de-historia-obrera/' },
      { id: 'disco', title: 'Disco', desc: 'Música original — Spotify, YouTube, Apple Music', emoji: '🎵', link: 'https://open.spotify.com/artist/244Xz5I4UZbiJ3Sxufpbl9' },
      { id: 'radiales', title: 'APUntes Radiales', desc: 'Podcasts de historia obrera para escuchar', emoji: '🎙️', link: 'https://historiaobrera.com.ar/apuntes-radiales/' },
      { id: 'audiovisual', title: 'Audiovisuales', desc: 'Laboralistas, Memorias Obreras, Lucifuercistas', emoji: '🎥', link: 'https://historiaobrera.com.ar/' },
    ];
  }

  // ===== Find the closest efeméride to the current week =====
  _getEfemerideSemana() {
    const efemerides = this._getEfemerides();
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    // 1. Try to find an efeméride that falls within the current week (Mon-Sun)
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    for (const efe of efemerides) {
      const parts = efe.fecha.split('/');
      const efeDay = parseInt(parts[0]);
      const efeMonth = parseInt(parts[1]);
      // Check if this efeméride falls within the current week
      if (efeMonth >= weekStart.getMonth() + 1 && efeMonth <= weekEnd.getMonth() + 1) {
        const efeDate = new Date(now.getFullYear(), efeMonth - 1, efeDay);
        if (efeDate >= weekStart && efeDate <= weekEnd) {
          return efe;
        }
      }
    }

    // 2. No exact match — find the closest efeméride (circular within the year)
    let closest = null;
    let minDist = Infinity;
    for (const efe of efemerides) {
      const parts = efe.fecha.split('/');
      const efeDay = parseInt(parts[0]);
      const efeMonth = parseInt(parts[1]);
      const efeDate = new Date(now.getFullYear(), efeMonth - 1, efeDay);
      let dist = Math.abs(efeDate - now);
      // Wrap around: if the date is far in the future, consider it from last year
      if (dist > 180 * 86400000) {
        const efeDateNext = new Date(now.getFullYear() + 1, efeMonth - 1, efeDay);
        const distNext = Math.abs(efeDateNext - now);
        const efeDatePrev = new Date(now.getFullYear() - 1, efeMonth - 1, efeDay);
        const distPrev = Math.abs(efeDatePrev - now);
        dist = Math.min(distNext, distPrev);
      }
      if (dist < minDist) {
        minDist = dist;
        closest = efe;
      }
    }
    return closest;
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #1E2321); position: relative; }

      /* ===== Hero banner — imagen de fondo opaca + texto ===== */
      .hero-banner { position: relative; width: 100%;
        background: var(--ho-dark, #1E2321);
        padding: 20px 16px 14px; display: flex; flex-direction: column;
        align-items: flex-start; gap: 10px;
        flex-shrink: 0; box-sizing: border-box; overflow: hidden;
        min-height: 110px; }
      .hero-banner::before { content: ''; position: absolute; inset: 0;
        background: url('assets/ho-banner.png') center/cover no-repeat;
        opacity: .10; pointer-events: none; }
      .hero-banner-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1.4rem; color: var(--ho-text, #E8E6E0);
        letter-spacing: .02em; text-transform: uppercase; position: relative; }
      :host(.theme-light) .hero-banner-title { color: var(--ho-text, #1E2321); }
      :host(.theme-light) .hero-banner { background: var(--ho-mid-gray, #ECEAE3); }
      :host(.theme-light) .hero-bajada { color: var(--ho-text-light, #7A766C); }
      .hero-bajada { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        text-align: left; position: relative; min-height: 5.2em; }
      .hero-banner-title .hero-bajada-link { margin-left: 6px; font-size: .7rem; }
        font-family: 'Archivo', sans-serif; font-size: .76rem; font-weight: 600;
        color: var(--ho-green, #4E9978); }
      .hero-bajada-link:hover { color: var(--ho-green-dark, #3D6B56); }

      /* ===== Explorar dropdown ===== */
      .hero-explore-link { display: inline-flex; align-items: center; gap: 4px;
        font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
        color: var(--ho-green-dark, #3D6B56); background: var(--ho-green-pale, #E0F0EB);
        border: 1px solid var(--ho-green, #4E9978); border-radius: 6px;
        padding: 4px 10px; cursor: pointer; position: relative;
        transition: background .2s, border-color .2s; }
      .hero-explore-link:hover { background: var(--ho-green-light, #D4DCC0);
        border-color: var(--ho-green-dark, #3D6B56); }
      .hero-explore-link::after { content: '▾'; font-size: .58rem; margin-left: 2px; }
      .hero-explore-link.open::after { content: '▴'; }
      .hero-explore-panel { display: flex; flex-wrap: wrap; gap: 6px;
        margin-top: 2px; animation: exploreFade .2s ease;
        position: relative; }
      @keyframes exploreFade { from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: none; } }
      .hero-explore-option { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; color: var(--ho-text, #E8E6E0);
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
        border-radius: 8px; padding: 6px 12px; cursor: pointer;
        transition: background .2s, border-color .2s; }
      .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); color: var(--ho-green-dark, #3D6B56); }
      :host(.theme-light) .hero-explore-option { background: rgba(0,0,0,.04);
        border-color: rgba(0,0,0,.08); }
      :host(.theme-light) .hero-explore-option:hover { background: var(--ho-green-pale, #E0F0EB); }

      /* ===== Chat container ===== */
      .chat-container { flex: 1; display: flex; flex-direction: column;
        min-height: 0; }
    `;
  }

  _render() {
    return html`
      ${this._bannerVisible ? html`
      <div class="hero-banner">
        <div class="hero-banner-title">Historia Obrera <a class="hero-bajada-link" href="https://historiaobrera.com.ar/" target="_blank" rel="noopener">↗</a></div>
        <div class="hero-bajada">
          Efemérides, ensayos, Mitín, colección La Argentina Peronista, retazos de historia, audio, video e ilustración. Desde abajo: la historia la cuentan los que la hicieron.
        </div>
        <button class="hero-explore-link${this._exploreOpen ? ' open' : ''}" id="exploreToggle">Explorar</button>
        ${this._exploreOpen ? html`
        <div class="hero-explore-panel">
          <button class="hero-explore-option" data-explore="Efemérides">Efemérides</button>
          <button class="hero-explore-option" data-explore="Mitín">Mitín</button>
          <button class="hero-explore-option" data-explore="Colección">Colección</button>
          <button class="hero-explore-option" data-explore="Retazos">Retazos</button>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="chat-container">
        <hornero-chat
          title="Historiadora"
          input-placeholder="Qué pensás..."
          messages="${JSON.stringify(this.messages)}"
          typing="${this._typing}"
          section="historia"
          history-title="Historial"
          persona="${this._activePersona}"
          username="${this._username}"
          grade="${this.grade}"
          no-auto-scroll="${this._bannerVisible}"
        ></hornero-chat>
      </div>
    `;
  }

  _afterRender() {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (chatEl) {
      this._syncChatMessages(chatEl);
      // Restore drawer state saved before re-render (prevents drawer closing)
      if (this._savedDrawerState) {
        chatEl.restoreDrawerState(this._savedDrawerState);
        this._savedDrawerState = null;
      }
      chatEl.addEventListener('chat-send', (e) => {
        this._handleUserMessage(e.detail.text);
      });
      chatEl.addEventListener('chat-session-select', (e) => {
        this._loadSession(e.detail.sessionId);
      });
      chatEl.addEventListener('chat-session-delete', (e) => {
        if (e.detail.sessionId === this._sessionId) {
          this.messages = [];
          this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now();
          this.render();
        }
      });
      chatEl.addEventListener('chat-message-delete', (e) => {
        const { msgIndex, msg } = e.detail;
        if (msgIndex >= 0 && msgIndex < this.messages.length) {
          this.messages.splice(msgIndex, 1);
          if (msg && msg.id && typeof borrarChatMsg === 'function') {
            borrarChatMsg(msg.id);
          }
          this.render();
        }
      });
      chatEl.addEventListener('persona-navigate', (e) => {
        this._handlePersonaNavigate(e.detail.persona);
      });
      chatEl.addEventListener('persona-redirect', (e) => {
        this._handlePersonaNavigate(e.detail.persona);
      });
      chatEl.addEventListener('chat-back', () => {
        this.emit('screen-change', { screen: 'home' });
      });
      chatEl.addEventListener('chat-input-focus', () => {
        if (this._bannerVisible) {
          this._exploreOpen = false;
          this._bannerVisible = false;
          this.render();
        }
      });
      chatEl.addEventListener('chat-audio', (e) => {
        this._handleAudioMessage(e.detail.audioBlob, e.detail.duration, e.detail.fileName);
      });
      chatEl.addEventListener('chat-feedback', (e) => {
        this._sendFeedback(e.detail);
      });
      chatEl.addEventListener('chat-export', (e) => {
        this._handleChatExport(e.detail);
      });
      chatEl.addEventListener('chat-new-session', () => {
        this._startNewSession();
      });
    }

    // Bind Explorar toggle + option buttons
    const exploreToggle = this.shadowRoot.querySelector('#exploreToggle');
    if (exploreToggle) {
      exploreToggle.addEventListener('click', () => {
        this._exploreOpen = !this._exploreOpen;
        this.render();
      });
    }
    this.shadowRoot.querySelectorAll('.hero-explore-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const topic = btn.dataset.explore;
        this._exploreOpen = false;
        this._bannerVisible = false;
        this._handleUserMessage('Contame sobre ' + topic);
      });
    });

    // Load chat history or show greeting
    if (!this._historyLoaded) {
      this._loadChatHistory();
    }

    // Apply light mode class to host for banner overlay
    try {
      const theme = localStorage.getItem('hornero-theme') || 'dark';
      if (theme === 'light') {
        this.classList.add('theme-light');
      } else {
        this.classList.remove('theme-light');
      }
    } catch(e) {}
  }

  _syncChatMessages(chatEl) {
    if (chatEl) {
      chatEl.messages = this.messages;
      chatEl.typing = this._typing;
      chatEl.section = this._chatSection;
      chatEl.sessionId = this._sessionId;
      chatEl.username = this._username;
      chatEl.persona = this._activePersona;
      chatEl.grade = this.grade;
      chatEl.hidePersonaBar = false;
      chatEl.centerLogo = '';
      chatEl.noAutoScroll = this._bannerVisible;
      chatEl.topBarAccent = false;
      // Force chat to fill flex container instead of height:100%
      chatEl.style.flex = '1';
      chatEl.style.minHeight = '0';
      chatEl.render();
    }
  }

  // ===== Load chat history from IndexedDB =====
  async _loadChatHistory() {
    if (this._historyLoaded) return;
    this._historyLoaded = true;

    // If a sessionId was passed (from Mis Conversaciones), load that session
    if (this.sessionId && this.sessionId.length > 0) {
      await this._loadSession(this.sessionId);
      this.sessionId = '';
      return;
    }

    // Try to restore the most recent session for this section + username
    if (typeof obtenerChatSessions === 'function' && this._username) {
      try {
        const sessions = await obtenerChatSessions(this._username);
        const mySessions = sessions.filter(s => s.section === this._chatSection);
        if (mySessions.length > 0) {
          const latestSession = mySessions[0];
          await this._loadSession(latestSession.sessionId);
          return;
        }
      } catch(e) { console.warn('Formacion: session restore failed', e); }
    }

    // No previous session found — start fresh with greeting
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._showGreeting();
  }

  async _loadSession(sessionId) {
    try {
      if (typeof obtenerChatSessionMessages === 'function') {
        const saved = await obtenerChatSessionMessages(sessionId);
        if (saved && saved.length > 0) {
          this._sessionId = sessionId;
          this._bannerVisible = false; // Hide banner when restoring session
          this.messages = saved;
          this._historyLoaded = true;
          this.render();
        }
      }
    } catch(e) { console.warn('Formacion: session load failed', e); }
  }

  // ===== Start a new chat session =====
  _startNewSession() {
    this._stopProgressiveReveal();
    this.messages = [];
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    this._historyLoaded = true;
    this._greetingRequested = false;
    this._activePersona = 'historiador';
    this._requestGreeting();
  }

  // ===== Generate greeting with efeméride of the week =====
  _showGreeting() {
    const efe = this._getEfemerideSemana();
    this._sessionId = typeof generarUUID === 'function' ? generarUUID() : 'ses-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    let efeText = '';
    if (efe) {
      efeText = `${efe.emoji} Esta semana se conmemora el [**${efe.title}**](https://historiaobrera.com.ar/) (${efe.fecha}/${efe.year}).\n\n${efe.narrative}\n\nTocá sobre el nombre del evento para leer más en el sitio.\n\n¿Te interesa? Contame y seguimos profundizando.`;
    } else {
      efeText = '¡Hola! Soy la Historiadora. Conozco la historia del movimiento obrero — huelgas, masacres, lockouts, referentes.\n\nEncontrá todo en [**historiaobrera.com.ar**](https://historiaobrera.com.ar/)';
    }

    const menuText = '¿Querés saber más? Estos son los contenidos que podemos explorar:\n\n• 🔥 [**Efemérides**](https://historiaobrera.com.ar/) — Las fechas clave del movimiento obrero argentino\n\n• 📝 [**Mitín**](https://historiaobrera.com.ar/mitin/) — Ensayos y relatos sobre historia obrera\n\n• 📚 [**Colección**](https://historiaobrera.com.ar/coleccion-la-argentina-peronista/) — La Argentina Peronista, 18 volúmenes desde la clase trabajadora\n\n• 🎬 [**Retazos**](https://historiaobrera.com.ar/retazos-de-historia-obrera/) — Docuficción, podcast, ilustraciones, música\n\nPreguntame lo que quieras sobre cualquier tema.';

    // 1. Show typing dots for 1s
    this._typing = true;
    this.render();

    setTimeout(() => {
      // 2. Start progressive reveal of first message
      this._typing = false;
      this._revealMessage(efeText, 'historiador', ['historia', 'greeting', 'efemeride-semana'], () => {
        // 3. After first message finishes, pause, then show typing for second message
        setTimeout(() => {
          this._typing = true;
          this.render();

          setTimeout(() => {
            // 4. Progressive reveal of second message
            this._typing = false;
            this._revealMessage(menuText, 'historiador', ['historia', 'greeting', 'menu'], null);
          }, 800);
        }, 600);
      });
    }, 1000);
  }

  // ===== Progressive reveal: show text char by char via streaming =====
  _revealMessage(fullText, persona, tags, onComplete) {
    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    if (!chatEl) {
      this.messages = [...this.messages, {
        role: 'hornero', text: fullText, tags: tags,
        persona: persona, time: this._timeNow(),
      }];
      this.render();
      if (onComplete) onComplete();
      return;
    }

    // Start streaming
    chatEl.streamingText = '';
    chatEl._streamingPersona = persona;
    chatEl.render();

    let index = 0;
    const chunkSize = 4;
    const interval = 12;

    this._revealTimer = setInterval(() => {
      index += chunkSize;
      if (index >= fullText.length) {
        clearInterval(this._revealTimer);
        this._revealTimer = null;
        this.messages = [...this.messages, {
          role: 'hornero', text: fullText, tags: tags,
          persona: persona, time: this._timeNow(),
        }];
        chatEl.streamingText = '';
        chatEl._streamingPersona = '';
        // No guardar en historial aún — el chat se crea recién cuando el usuario envía su primer mensaje
        this.render();
        if (onComplete) onComplete();
        return;
      }
      chatEl.streamingText = fullText.substring(0, index);
      chatEl._streamingPersona = persona;
      chatEl.updateStreamingText(fullText.substring(0, index));
    }, interval);
  }

  // ===== Handle user message =====
  _handleUserMessage(text) {
    this._stopProgressiveReveal();
    // Hide banner when user starts chatting
    if (this._bannerVisible) {
      this._bannerVisible = false;
    }
    this.messages = [...this.messages, { role: 'user', text, tags: ['historia'], time: this._timeNow() }];
    this._typing = true;
    this._saveChatHistory();
    this.render();

    // Try streaming first, fallback to non-streaming
    this._callBackendStream(text).catch((err) => {
      console.warn('Stream failed, falling back to non-streaming:', err);
      this._callBackend(text).catch((err2) => {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: 'No puedo conectarme ahora. Intentá de nuevo en un momento.',
          tags: ['historia', 'error'],
          persona: 'historiador',
          time: this._timeNow(),
        }];
        this._typing = false;
        this.render();
      });
    });
  }

  // ===== Streaming backend =====
  _startProgressiveReveal(fullText, chatEl, persona) {
    this._stopProgressiveReveal();
    this._progressiveRevealFull = fullText;
    this._progressiveRevealIndex = 0;
    const chunkSize = 1;
    const interval = 25;
    this._progressiveRevealTimer = setInterval(() => {
      this._progressiveRevealIndex += chunkSize;
      if (this._progressiveRevealIndex >= this._progressiveRevealFull.length) {
        this._stopProgressiveReveal();
        if (chatEl) chatEl.updateStreamingText(this._progressiveRevealFull);
        return;
      }
      if (chatEl) {
        chatEl.updateStreamingText(this._progressiveRevealFull.substring(0, this._progressiveRevealIndex));
      }
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

  async _callBackendStream(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await fetch(HorneroFormacion.STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'historia',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'historiador',
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Stream error: ' + response.status);

    const chatEl = this.shadowRoot.querySelector('hornero-chat');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamingText = '';
    let streamingPersona = this._activePersona;

    this._typing = true;
    if (chatEl) {
      chatEl.streamingText = '';
      chatEl._streamingPersona = streamingPersona;
      chatEl.render();
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: token')) continue;
          if (line.startsWith('data: ') && !line.startsWith('data: {')) {
            const content = line.slice(6).replace(/\\n/g, '\n');
            if (content) {
              streamingText += content;
              this._typing = false;
              if (chatEl) {
                if (content.length > 50 && !this._progressiveRevealTimer) {
                  this._startProgressiveReveal(streamingText, chatEl, streamingPersona);
                } else {
                  chatEl.streamingText = streamingText;
                  chatEl._streamingPersona = streamingPersona;
                  chatEl.updateStreamingText(streamingText);
                }
              }
            }
          }
          if (line.startsWith('data: {')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text !== undefined) {
                streamingPersona = data.persona || this._activePersona;
                this.messages = [...this.messages, {
                  role: 'hornero',
                  text: data.text || streamingText,
                  sections: data.sections || [],
                  tags: data.tags || ['historia'],
                  persona: 'historiador',
                  redirect_persona: data.redirect_persona || '',
                  time: data.time || this._timeNow(),
                }];
                this._stopProgressiveReveal();
                if (chatEl) {
                  chatEl.streamingText = '';
                  chatEl._streamingPersona = '';
                }
                this._typing = false;
                this._saveChatHistory();
                this.render();
                return;
              }
              if (data.message) throw new Error(data.message);
            } catch (e) {
              if (e.message !== 'Stream error') throw e;
            }
          }
        }
      }
    } catch (e) {
      this._stopProgressiveReveal();
      if (streamingText) {
        this.messages = [...this.messages, {
          role: 'hornero',
          text: streamingText,
          tags: ['historia', 'stream-partial'],
          persona: 'historiador',
          time: this._timeNow(),
        }];
      }
      if (chatEl) {
        chatEl.streamingText = '';
        chatEl._streamingPersona = '';
      }
      this._typing = false;
      this.render();
      throw e;
    }
  }

  // ===== Non-streaming backend fallback =====
  async _callBackend(text) {
    const history = this.messages.map(m => ({
      role: m.role,
      text: m.text || '',
      sections: m.sections || [],
    }));

    const response = await this._fetchWithTimeout(HorneroFormacion.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        formato: 'historia',
        history: history,
        grade: this.grade,
        sector: this.sector,
        requested_persona: 'historiador',
        session_id: this._sessionId,
      }),
    });

    if (!response.ok) throw new Error('Backend error: ' + response.status);

    const data = await response.json();
    const responseText = data.text || '';

    if (responseText && responseText.length > 50) {
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) {
        this._typing = false;
        this._startProgressiveReveal(responseText, chatEl, 'historiador');
        const revealDone = new Promise((resolve) => {
          const check = setInterval(() => {
            if (!this._progressiveRevealTimer) { clearInterval(check); resolve(); }
          }, 50);
        });
        const timeout = new Promise((resolve) => setTimeout(resolve, 15000));
        await Promise.race([revealDone, timeout]);
        this._stopProgressiveReveal();
        if (chatEl) { chatEl.streamingText = ''; chatEl._streamingPersona = ''; }
      }
    }

    this.messages = [...this.messages, {
      role: 'hornero',
      text: data.text || '',
      sections: data.sections || [],
      tags: data.tags || ['historia'],
      persona: 'historiador',
      redirect_persona: data.redirect_persona || '',
      time: data.time || this._timeNow(),
    }];
    this._typing = false;
    this._saveChatHistory();
    this.render();
  }

  _fetchWithTimeout(url, options, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .then(response => { clearTimeout(timeoutId); return response; })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('FETCH_TIMEOUT');
        throw err;
      });
  }

  // ===== Request greeting from backend (like Historiador) =====
  async _requestGreeting() {
    this._greetingRequested = true;
    this._typing = true;
    this.render();

    try {
      const response = await this._fetchWithTimeout(HorneroFormacion.GREETING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'historia',
          grade: this.grade,
          sector: this.sector,
          requested_persona: 'historiador',
          session_id: this._sessionId,
        }),
      });

      if (!response.ok) throw new Error('Greeting error: ' + response.status);

      const data = await response.json();
      this.messages = [{
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia', 'greeting'],
        persona: 'historiador',
        redirect_persona: data.redirect_persona || '',
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
    return { role: 'hornero', sections: [{ title: '¡Hola! Soy la Historiadora', body: 'Conozco la historia del movimiento obrero — huelgas, masacres, lockouts, referentes. ¿Qué tema histórico querés explorar?' }], tags: ['historia', 'greeting'], persona: 'historiador', time: this._timeNow() };
  }

  // ===== Handle audio message =====
  async _handleAudioMessage(audioBlob, duration, fileName) {
    this.messages = [...this.messages, { role: 'user', text: '🎤 Audio enviado', tags: ['historia', 'audio'], time: this._timeNow() }];
    this._typing = true;
    this.render();

    try {
      const history = this.messages.map(m => ({
        role: m.role,
        text: m.text || '',
        sections: m.sections || [],
      }));

      const formData = new FormData();
      formData.append('audio', audioBlob, fileName);
      formData.append('formato', 'historia');
      formData.append('grade', this.grade);
      formData.append('sector', this.sector);
      formData.append('requested_persona', 'historiador');
      formData.append('session_id', this._sessionId);
      formData.append('history', JSON.stringify(history));

      const response = await this._fetchWithTimeout(HorneroFormacion.AUDIO_URL, {
        method: 'POST',
        body: formData,
      }, 45000);

      if (!response.ok) throw new Error('Audio backend error: ' + response.status);

      const data = await response.json();
      this.messages = [...this.messages, {
        role: 'hornero',
        text: data.text || '',
        sections: data.sections || [],
        tags: data.tags || ['historia', 'audio'],
        persona: 'historiador',
        redirect_persona: data.redirect_persona || '',
        time: data.time || this._timeNow(),
      }];
      this._typing = false;
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this._saveChatHistory();
      this.render();
    } catch (e) {
      this._typing = false;
      const errMsg = e.message === 'FETCH_TIMEOUT'
        ? 'No puedo procesar el audio ahora — el servidor está lento. Intentá de nuevo.'
        : 'No puedo procesar el audio ahora. Intentá de nuevo.';
      const errTags = e.message === 'FETCH_TIMEOUT' ? ['historia', 'audio', 'timeout'] : ['historia', 'audio-error'];
      this.messages = [...this.messages, {
        role: 'hornero',
        text: errMsg,
        tags: errTags,
        persona: 'historiador',
        time: this._timeNow(),
      }];
      const chatEl = this.shadowRoot.querySelector('hornero-chat');
      if (chatEl) chatEl.resetAudioState();
      this.render();
    }
  }

  _handlePersonaNavigate(targetPersona) {
    const screenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'companero': { screen: 'gremial', persona: 'companero' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'historiador': { screen: 'formacion', persona: 'historiador' },
      'sociologo': { screen: 'condicion', persona: 'sociologo' },
    };
    const target = screenMap[targetPersona];
    if (target) {
      this.emit('screen-change', { screen: target.screen, persona: target.persona || targetPersona });
    }
  }

  _handleChatExport(detail) {
    if (!this.messages || this.messages.length === 0) return;
    if (detail && detail.download) {
      this.messages = [...this.messages, {
        role: 'hornero',
        text: 'Documento exportado con éxito. Click en el archivo para descargarlo.',
        download: detail.download,
        tags: ['historia', 'exportado'],
        time: this._timeNow(),
      }];
      this._saveChatHistory();
      this.render();
    }
  }

  async _sendFeedback(detail) {
    if (!detail || !detail.type) return;
    const rating = detail.type === 'like' && detail.liked ? 'like' :
                   detail.type === 'dislike' && detail.disliked ? 'dislike' : '';
    if (!rating) return;
    try {
      const h = window.location.hostname;
      const baseUrl = (h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.'))
        ? 'http://' + h + ':8000' : 'https://hornero-ia.onrender.com';
      await fetch(baseUrl + '/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this._sessionId || '',
          message_index: detail.messageIndex || -1,
          rating: rating,
          persona: detail.persona || this._activePersona,
          message_text: detail.messageText || '',
        }),
      });
    } catch (e) { console.warn('Feedback send failed:', e); }
  }

  async _saveChatHistory() {
    // No persistir hasta que el usuario envíe su primer mensaje
    if (!this.messages.some(m => m.role === 'user')) return;
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
    } catch(e) { console.warn('Formacion: chat history save failed', e); }
  }

  _timeNow() {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, '0');
    const m = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][now.getMonth()];
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    return d + ' ' + m + ' ' + h + ':' + min;
  }
}

customElements.define('hornero-formacion', HorneroFormacion);
