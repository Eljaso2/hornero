// ===== <hornero-formacion> — Esfera 3: Historia Obrera · Formación =====
// Contenido de https://historiaobrera.com.ar/
// Tabs: Efemérides · Mitín · Colección · Retazos
// "Consultar con Historiador/a" → navigates to historiador screen

import { HoComponent, html, css } from './ho-component.js';

class HorneroFormacion extends HoComponent {
  static get properties() {
    return {
      grade: String,
      sector: String,
      tab: String,        // 'efemerides' | 'mitin' | 'coleccion' | 'retazos'
      expandedId: String,  // expanded efemeride/mitin id
    };
  }

  constructor() {
    super();
    this.grade = 'A';
    this.sector = 'aceitero';
    this.tab = 'efemerides';
    this.expandedId = '';
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

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }
      .scroll { flex: 1; overflow-y: auto; padding: 16px 16px;
        -webkit-overflow-scrolling: touch; }

      /* ===== Header with logo ===== */
      .form-header { display: flex; align-items: center; gap: 12px;
        margin-bottom: 12px; }
      .form-logo { width: 56px; height: 56px; border-radius: 10px;
        overflow: hidden; flex: none; border: 1px solid rgba(43,42,38,.08); }
      .form-logo img { width: 100%; height: 100%; object-fit: cover; }
      .form-header-text { flex: 1; }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); }
      .section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); }
      .intro { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-bottom: 16px; }

      /* ===== Tab bar ===== */
      .tab-bar { display: flex; gap: 0; margin-bottom: 16px;
        border-bottom: 1px solid var(--ho-border, rgba(43,42,38,.12)); }
      .tab-btn { font-family: 'Archivo', sans-serif; font-size: .76rem;
        font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        background: none; border: none; cursor: pointer;
        padding: 8px 10px; border-bottom: 2px solid transparent;
        transition: color .2s, border-color .2s; }
      .tab-btn.active { color: var(--ho-green, #6E8345);
        border-bottom-color: var(--ho-green, #6E8345); }

      /* ===== Efemérides cards ===== */
      .efe-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; }
      .efe-card:hover { border-color: var(--ho-green, #6E8345); }
      .efe-card.expanded { cursor: default; }
      .efe-header { display: flex; align-items: center; gap: 10px; }
      .efe-emoji { font-size: 1.1rem; flex: none; }
      .efe-date { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        font-weight: 700; color: var(--ho-green-dark, #586B33);
        background: var(--ho-green-pale, #E8EDD7); border-radius: 5px;
        padding: 2px 6px; flex: none; }
      .efe-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); flex: 1; }
      .efe-author { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 4px; }
      .efe-bajada { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 6px; }

      /* ===== Expanded efeméride ===== */
      .efe-narrative { font-size: .84rem; color: var(--ho-text, #2B2A26);
        line-height: 1.55; margin-top: 12px; white-space: pre-wrap; }
      .efe-resources { margin-top: 10px; }
      .efe-resource { font-family: 'Archivo', sans-serif; font-size: .78rem;
        color: var(--ho-green-dark, #586B33); padding: 4px 0; }
      .efe-bib { margin-top: 10px; }
      .efe-bib-title { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
        color: var(--ho-text-light, #9C988D); margin-bottom: 4px; }
      .efe-bib-item { font-size: .78rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; }
      .efe-actions { display: flex; gap: 8px; margin-top: 14px; }
      .action-ia { background: var(--ho-green, #6E8345); color: #fff;
        border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer;
        font-family: 'Archivo', sans-serif; font-size: .76rem; font-weight: 600; }
      .action-ia:hover { background: var(--ho-green-dark, #586B33); }
      .action-collapse { background: none; color: var(--ho-text-mid, #6E6A60);
        border: 1px solid var(--ho-border, rgba(43,42,38,.15));
        border-radius: 8px; padding: 8px 14px; cursor: pointer;
        font-family: 'Archivo', sans-serif; font-size: .76rem; font-weight: 600; }

      /* ===== Mitín cards ===== */
      .mitin-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 14px; margin-bottom: 10px;
        cursor: pointer; transition: border-color .2s; }
      .mitin-card:hover { border-color: var(--ho-green, #6E8345); }
      .mitin-card.expanded { cursor: default; }
      .mitin-emoji { font-size: 1.1rem; flex: none; }
      .mitin-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); }
      .mitin-author { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 3px; }
      .mitin-bajada { font-size: .82rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.4; margin-top: 6px; }
      .mitin-text { font-size: .84rem; color: var(--ho-text, #2B2A26);
        line-height: 1.55; margin-top: 12px; }
      .mitin-link { display: inline-block; margin-top: 10px;
        font-family: 'Archivo', sans-serif; font-size: .76rem; font-weight: 600;
        color: var(--ho-green, #6E8345); }

      /* ===== Colección grid ===== */
      .col-grid { display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 10px; }
      .col-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 12px; }
      .col-num { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        font-weight: 700; color: var(--ho-green-dark, #586B33);
        background: var(--ho-green-pale, #E8EDD7); border-radius: 5px;
        padding: 2px 6px; display: inline-block; margin-bottom: 4px; }
      .col-emoji { font-size: .92rem; }
      .col-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; color: var(--ho-text, #2B2A26); }
      .col-author { font-size: .72rem; color: var(--ho-text-mid, #6E6A60);
        margin-top: 2px; }
      .col-tema { font-family: 'JetBrains Mono', monospace; font-size: .60rem;
        color: var(--ho-green-dark, #586B33); background: var(--ho-green-pale, #E8EDD7);
        padding: 2px 6px; border-radius: 5px; display: inline-block;
        margin-top: 5px; }

      /* ===== Retazos cards ===== */
      .retazo-grid { display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 10px; }
      .retazo-card { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 13px; padding: 12px; cursor: pointer;
        transition: border-color .2s; }
      .retazo-card:hover { border-color: var(--ho-green, #6E8345); }
      .retazo-emoji { font-size: 1.4rem; }
      .retazo-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .82rem; color: var(--ho-text, #2B2A26); }
      .retazo-desc { font-size: .72rem; color: var(--ho-text-mid, #6E6A60);
        line-height: 1.3; margin-top: 3px; }

      /* ===== Uniones badge ===== */
      .union-badge { margin-top: 16px; text-align: center; }
      .union-text { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; color: var(--ho-text-light, #9C988D);
        letter-spacing: .08em; text-transform: uppercase; }
      .union-link { font-family: 'Archivo', sans-serif; font-size: .76rem;
        color: var(--ho-green, #6E8345); font-weight: 600; }

      /* ===== External link ===== */
      .ext-link { margin-top: 16px; text-align: center;
        font-family: 'Archivo', sans-serif; font-size: .78rem;
        color: var(--ho-green, #6E8345); font-weight: 600; }
    `;
  }

  _render() {
    var tabContent = '';
    if (this.tab === 'efemerides') tabContent = this._renderEfemerides();
    else if (this.tab === 'mitin') tabContent = this._renderMitin();
    else if (this.tab === 'coleccion') tabContent = this._renderColeccion();
    else if (this.tab === 'retazos') tabContent = this._renderRetazos();

    return html`
      <div class="scroll">
        <div class="form-header">
          <div class="form-logo"><img src="assets/personajes/ho.jpg" alt="HO"></div>
          <div class="form-header-text">
            <div class="kicker">📜 HISTORIA OBRERA</div>
            <div class="section-title">Formación sindical y obrera</div>
          </div>
        </div>
        <div class="intro">Efemérides, libros, mitín, retazos — la historia de la clase trabajadora argentina, desde abajo. Proyecto de Gustavo Nicolás Contreras.</div>

        <div class="tab-bar">
          <button class="tab-btn${this.tab === 'efemerides' ? ' active' : ''}" data-tab="efemerides">🔥 Efemérides</button>
          <button class="tab-btn${this.tab === 'mitin' ? ' active' : ''}" data-tab="mitin">📝 Mitín</button>
          <button class="tab-btn${this.tab === 'coleccion' ? ' active' : ''}" data-tab="coleccion">📚 Colección</button>
          <button class="tab-btn${this.tab === 'retazos' ? ' active' : ''}" data-tab="retazos">🎬 Retazos</button>
        </div>

        ${tabContent}

        <div class="union-badge">
          <div class="union-text">Nos acompañan</div>
          <div style="margin-top:4px;display:flex;justify-content:center;gap:6px;flex-wrap:wrap">
            <span class="union-link">APU</span>
            <span style="color:#9C988D">·</span>
            <span class="union-link">La Bancaria</span>
            <span style="color:#9C988D">·</span>
            <span class="union-link">Sipreba</span>
            <span style="color:#9C988D">·</span>
            <span class="union-link">Luz y Fuerza</span>
          </div>
        </div>

        <div class="ext-link">
          <a href="https://historiaobrera.com.ar/" target="_blank" rel="noopener">↗ historiaobrera.com.ar — ver sitio completo</a>
        </div>
      </div>
    `;
  }

  // ===== Tab: Efemérides =====
  _renderEfemerides() {
    var items = this._getEfemerides();
    return items.map(efe => {
      var isExpanded = this.expandedId === efe.id;
      var expandedHtml = '';
      if (isExpanded) {
        var recursosHtml = (efe.recursos || []).map(r =>
          '<div class="efe-resource">📎 ' + r + '</div>'
        ).join('');
        var bibHtml = (efe.bibliografia || []).map(b =>
          '<div class="efe-bib-item">• ' + b + '</div>'
        ).join('');
        expandedHtml = html`
          <div class="efe-narrative">${efe.narrative}</div>
          ${recursosHtml ? '<div class="efe-resources">' + recursosHtml + '</div>' : ''}
          ${bibHtml ? '<div class="efe-bib"><div class="efe-bib-title">Bibliografía</div>' + bibHtml + '</div>' : ''}
          <div class="efe-actions">
            <button class="action-ia" data-action="ia" data-efe-id="${efe.id}" data-efe-title="${efe.title}">🤖 Consultar con Historiador/a</button>
            <button class="action-collapse" data-action="collapse">Cerrar</button>
          </div>
        `;
      }
      return html`
        <div class="efe-card${isExpanded ? ' expanded' : ''}" data-efe-id="${efe.id}">
          <div class="efe-header">
            <span class="efe-emoji">${efe.emoji}</span>
            <span class="efe-date">${efe.year}</span>
            <span class="efe-title">${efe.title}</span>
          </div>
          <div class="efe-author">${efe.author}</div>
          ${!isExpanded ? html`<div class="efe-bajada">${efe.bajada}</div>` : ''}
          ${expandedHtml}
        </div>
      `;
    }).join('');
  }

  // ===== Tab: Mitín =====
  _renderMitin() {
    var items = this._getMitin();
    return items.map(m => {
      var isExpanded = this.expandedId === m.id;
      var expandedHtml = '';
      if (isExpanded) {
        expandedHtml = html`
          <div class="mitin-text">${m.text}</div>
          <a class="mitin-link" href="${m.link}" target="_blank" rel="noopener">↗ Leer y escuchar en historiaobrera.com.ar</a>
          <div class="efe-actions" style="margin-top:14px">
            <button class="action-ia" data-action="ia" data-efe-id="${m.id}" data-efe-title="${m.title}">🤖 Consultar con Historiador/a</button>
            <button class="action-collapse" data-action="collapse">Cerrar</button>
          </div>
        `;
      }
      return html`
        <div class="mitin-card${isExpanded ? ' expanded' : ''}" data-efe-id="${m.id}">
          <span class="mitin-emoji">${m.emoji}</span>
          <div class="mitin-title">${m.title}</div>
          <div class="mitin-author">${m.author}</div>
          ${!isExpanded ? html`<div class="mitin-bajada">${m.bajada}</div>` : ''}
          ${expandedHtml}
        </div>
      `;
    }).join('');
  }

  // ===== Tab: Colección =====
  _renderColeccion() {
    var items = this._getColeccion();
    return html`
      <div class="intro" style="margin-bottom:12px">Colección <strong>La Argentina Peronista</strong> — serie de libros que recorre el peronismo desde la clase trabajadora.</div>
      <div class="col-grid">
        ${items.map(b => html`
          <div class="col-card">
            <span class="col-num">N°${b.num}</span>
            <span class="col-emoji">${b.emoji}</span>
            <div class="col-title">${b.title}</div>
            <div class="col-author">${b.author}</div>
            <span class="col-tema">${b.tema}</span>
          </div>
        `).join('')}
      </div>
      <div class="ext-link" style="margin-top:12px">
        <a href="https://historiaobrera.com.ar/coleccion-la-argentina-peronista/" target="_blank" rel="noopener">↗ Ver colección completa (18 volúmenes)</a>
      </div>
    `;
  }

  // ===== Tab: Retazos =====
  _renderRetazos() {
    var items = this._getRetazos();
    return html`
      <div class="intro" style="margin-bottom:12px">Arte, música, podcast, audiovisual — historia obrera en múltiples formatos.</div>
      <div class="retazo-grid">
        ${items.map(r => html`
          <a class="retazo-card" href="${r.link}" target="_blank" rel="noopener">
            <span class="retazo-emoji">${r.emoji}</span>
            <div class="retazo-title">${r.title}</div>
            <div class="retazo-desc">${r.desc}</div>
          </a>
        `).join('')}
      </div>
    `;
  }

  _afterRender() {
    // Tab buttons
    this.shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.set('tab', btn.dataset.tab);
        this.set('expandedId', '');
      });
    });

    // Efe/mitin cards — expand on click
    this.shadowRoot.querySelectorAll('.efe-card:not(.expanded), .mitin-card:not(.expanded)').forEach(card => {
      card.addEventListener('click', () => {
        this.set('expandedId', card.dataset.efeId);
      });
    });

    // IA action → navigate to historiador
    this.shadowRoot.querySelectorAll('.action-ia').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        var title = btn.dataset.efeTitle || '';
        this.emit('screen-change', { screen: 'historiador', persona: 'historiador', preQuery: 'Quiero saber más sobre: ' + title });
      });
    });

    // Collapse action
    this.shadowRoot.querySelectorAll('.action-collapse').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.set('expandedId', '');
      });
    });
  }
}

customElements.define('hornero-formacion', HorneroFormacion);
