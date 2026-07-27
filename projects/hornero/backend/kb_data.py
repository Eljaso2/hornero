"""Knowledge Base sindical — datos estructurados para RAG.

Chunked del string KNOWLEDGE_BASE original, con metadata:
- tipo: documento | academico | multimedia
- category: tema principal
- tags: etiquetas para búsqueda keyword
- sources: fuentes citables
- quotes: citas con autor y fuente
- grade_access: nivel mínimo de acceso
- vigencia: vigente | derogado | historico

La biblioteca del sindicato: documentos, académicos, multimedia.
"""

# ===== Taxonomía =====

KB_TIPOS = ["documento", "academico", "multimedia"]
KB_CATEGORIES = [
    "organizacion", "convenio", "paritaria", "smvm",
    "reforma", "condiciones", "referentes", "violencia-empresarial",
]

# ===== Chunks estructurados =====

KB_CHUNKS = [
    # --- ORGANIZACIÓN ---
    {
        "id": "kb-org-federacion",
        "tipo": "documento",
        "category": "organizacion",
        "tags": ["federacion", "aceitera", "FOEIAP", "F.T.C.I.O.D", "paritaria", "huelga", "democracia sindical", "formacion", "salud laboral", "tercerizacion", "precarizacion", "neoliberalismo", "UOM", "ATE", "URGARA"],
        "title": "Federación Aceitera — F.T.C.I.O.D y A.R.A.",
        "text": """FEDERACIÓN ACEITERA — F.T.C.I.O.D y A.R.A. (Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines de la República Argentina). Es la federación sindical que representa a los trabajadores aceiteros, desmotadores de algodón y afines de todo el país. Negocia paritarias salariales con las cámaras patronales (CIARA, CIAVEC, CARBIO). Organiza huelgas nacionales cuando las patronales no ofrecen aumentos dignos — en 2026 llamó a Huelga Nacional Aceitera tras recibir oferta de 0%. Defiende la democracia sindical — commemora la movilización del 17 de julio 2013 donde más de 500 trabajadores marcharon para defender la gestión democrática. Promueve formación sindical, salud laboral (Comités Mixtos en Salud y Seguridad Laboral), y acción social. Solidaria con otros sindicatos (UOM, ATE, URGARA, Dragado y Balizamiento). Combate la tercerización, la precarización laboral, y las políticas neoliberales. Tiene periódico propio: "El Trabajador Aceitero y Desmotador". Sede: México 1527/31, CABA. Tel: (011) 4382-7513. Web: federacionaceitera.com.ar. Twitter: @FTCIODyARA. Instagram: @aceiterosdesmotadores.
Nota: FOEIAP es una denominación anterior/histórica. La sigla oficial actual es F.T.C.I.O.D y A.R.A.""",
        "sources": ["federacionaceitera.com.ar", "Periódico El Trabajador Aceitero y Desmotador"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    {
        "id": "kb-org-yofra",
        "tipo": "documento",
        "category": "referentes",
        "tags": ["yofra", "Daniel Yofra", "secretario general", "paritaria", "huelga", "FreSU", "organizacion", "convenio", "referente sindical"],
        "title": "Daniel Yofra — Secretario General F.T.C.I.O.D y A.R.A.",
        "text": """DANIEL YOFRA — Secretario General de la F.T.C.I.O.D y A.R.A. (Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines). Líder sindical aceitero argentino. Referente en paritaria aceitera 2025-2026, organización sindical, resistencia a la reforma laboral. Construyó FreSU (Frente Sindical Unitario) con 100 organizaciones. Condujo huelga de 7 días que forzó negociación paritaria 2025. Sus posiciones: defensa del convenio, organización como construcción, huelga como herramienta, "la propuesta patronal fue cero".""",
        "sources": ["Asamblea paritaria aceitera, junio 2026", "Gestión Sindical, diciembre 2025"],
        "quotes": [
            {"text": "La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa para no pagar lo que corresponde.", "author": "Daniel Yofra", "source": "Asamblea paritaria aceitera, junio 2026"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    {
        "id": "kb-org-cremonte",
        "tipo": "academico",
        "category": "referentes",
        "tags": ["Cremonte", "investigador", "labour", "derecho laboral", "distribucion del ingreso", "salario minimo", "reforma laboral", "SMVM", "ALAL", "OIT", "LCT", "principio protector", "ultraactividad"],
        "title": "Cremonte — Investigador labour / ALAL / CIFRA",
        "text": """CREMONTE — Investigador labour (derecho laboral). Analista de distribución del ingreso, salario mínimo, reforma laboral. Autor de "Valor y precio de la fuerza de trabajo" (2023). Participa en ALAL (Asociación Americana de Juristas Laboralistas), audiencias congressional, conferencia OIT Geneva 2026. Sus posiciones: reforma laboral como retorno al siglo XIX, principio protector de la LCT, ultraactividad como red de negociación, básico del convenio debajo del SMVM como violación del piso legal, distribución del ingreso como relación de fuerzas.""",
        "sources": ["Valor y precio de la fuerza de trabajo, Cremonte 2023", "CIFRA 2025"],
        "quotes": [
            {"text": "El salario mínimo no es un número abstracto — es el piso de lo que una persona necesita para reproducir su fuerza de trabajo. Si el básico del convenio está por debajo del SMVM, no estás cobrando lo mínimo legal, estás cobrando menos que lo mínimo.", "author": "Cremonte", "source": "Valor y precio de la fuerza de trabajo, 2023"},
            {"text": "La distribución del ingreso no es un fenómeno natural — es el resultado de una relación de fuerzas. Cuando la patronal tiene más fuerza, la distribución se inclina. Cuando el movimiento obrero se organiza, se rebalancea.", "author": "Cremonte", "source": "Investigación distribución del ingreso, 2025"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    {
        "id": "kb-org-vicentin",
        "tipo": "documento",
        "category": "condiciones",
        "tags": ["Vicentín", "SAIC", "empresa aceitera", "concurso preventivo", "paritaria", "Reconquista", "Santa Fe", "expeller", "refinado", "retencion exportacion"],
        "title": "Vicentín SAIC — Empresa aceitera",
        "text": """VICENTÍN SAIC — Empresa aceitera argentina. En concurso preventivo. Planta funcionando al 80% de capacidad. Argumenta que concurso limita posibilidades en paritaria. Prioriza expeller sobre refinado (menor retención exportación = empresa ahorra impuestos).""",
        "sources": ["Informe gremial FOEIAP, junio 2026"],
        "quotes": [],
        "grade_access": "B.a",
        "vigencia": "vigente",
    },

    {
        "id": "kb-org-guaycuru",
        "tipo": "documento",
        "category": "condiciones",
        "tags": ["Guaycurú", "desmotadora", "algodon", "planta auxiliar", "trabajadores temporales", "polvo algodon", "EPP", "Chaco"],
        "title": "Guaycurú — Desmotadora de algodón",
        "text": """GUAYCURÚ — Desmotadora de algodón (planta aceitera auxiliar). 1 línea de 2 operativa. Trabajadores temporales sin cobrar días no trabajados. Polvo de algodón sin máscaras adecuadas.""",
        "sources": ["Informe gremial FOEIAP, junio 2026"],
        "quotes": [],
        "grade_access": "B.a",
        "vigencia": "vigente",
    },

    # --- CONVENIO ---
    {
        "id": "kb-cct-420",
        "tipo": "documento",
        "category": "convenio",
        "tags": ["CCT 420/05", "aceitero", "convenio", "Resolucion ST 343/2005", "categorias obreras", "nocturno", "extras", "antiguedad", "presentismo", "Dia del Aceitero", "enfermeria", "Art. 42", "contribucion solidaria", "basico"],
        "title": "CCT 420/05 — Aceiteros, Resolución ST 343/2005",
        "text": """CCT 420/05 homologado por Resolución ST 343/2005
- 4 categorías obreras (A-D: Inicial → Superior) + 4 administrativas (E-H)
- Nocturno: +25% sobre básico
- Horas extras: +100% (doble)
- Antigüedad: 1% por año
- Presentismo: premio por asistencia
- Día del Aceitero: 29 de octubre
- Enfermería: Art. 42 CCT — obligatoria, la clausura es violación
- Contribución solidaria: 1% mensual + 6% semestral extraordinaria""",
        "sources": ["CCT 420/05, Resolución ST 343/2005"],
        "quotes": [
            {"text": "El CCT 420/05 es el territorio conquistado. Cada cláusula — nocturno, extras, enfermería, antigüedad — es una lucha que se ganó. La patronal quiere desconocerlo. El sindicato lo defiende.", "author": "F.T.C.I.O.D y A.R.A.", "source": "CCT 420/05, Res. ST 343/2005"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- PARITARIA ---
    {
        "id": "kb-paritaria-2026",
        "tipo": "documento",
        "category": "paritaria",
        "tags": ["paritaria", "aceitera", "2026", "SOMU", "15%", "8%", "Caputo", "huelga", "basico", "SMVM", "convenio", "Yofra", "Vicentin", "concurso preventivo"],
        "title": "Paritaria aceitera 2026 — F.T.C.I.O.D y A.R.A./SOMU",
        "text": """Paritaria aceitera 2026:
- SOMU demanda 15% de aumento
- Empresas ofrecen 8%
- Vicentín argumenta concurso preventivo limita posibilidades
- Básico junio 2026: $340.000 — no cubre alquiler Reconquista ($380.000)
- Brecha salario-vivienda: básico 12% debajo del alquiler
- Paritaria 2025 cerró después de 7 días de huelga nacional — forzó mano de Caputo""",
        "sources": ["Asamblea paritaria aceitera, junio 2026", "Gestión Sindical, diciembre 2025"],
        "quotes": [
            {"text": "La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa para no pagar lo que corresponde. Si la planta funciona al 80%, hay producción, hay plata.", "author": "Daniel Yofra", "source": "Asamblea paritaria aceitera, junio 2026"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SMVM ---
    {
        "id": "kb-smvm-basico",
        "tipo": "academico",
        "category": "smvm",
        "tags": ["SMVM", "salario minimo", "basico convenio", "$2.344.000", "$340.000", "canasta basica", "inflacion obrera", "distribucion del ingreso", "Cremonte", "CIFRA", "piso legal", "violacion"],
        "title": "SMVM y básico convenio — Cremonte 2023 / CIFRA 2025",
        "text": """SMVM y básico convenio:
- SMVM julio 2026: $2.344.000
- Básico convenio aceitero: $340.000 (junio 2026)
- Canasta básica total: $1.800.000
- Mediana salario registrado: $900.000
- Inflación obrera: 760% anual
- El básico del convenio está debajo del SMVM — violación del piso legal""",
        "sources": ["Valor y precio de la fuerza de trabajo, Cremonte 2023", "CIFRA 2025"],
        "quotes": [
            {"text": "El salario mínimo no es un número abstracto — es el piso de lo que una persona necesita para reproducir su fuerza de trabajo. Si el básico del convenio está por debajo del SMVM, no estás cobrando lo mínimo legal, estás cobrando menos que lo mínimo.", "author": "Cremonte", "source": "Valor y precio de la fuerza de trabajo, 2023"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- CONDICIONES ---
    {
        "id": "kb-condiciones-2026",
        "tipo": "documento",
        "category": "condiciones",
        "tags": ["condiciones laborales", "Vicentin", "80%", "EPP", "guantes", "botas", "enfermeria clausurada", "Art. 42", "accidentes", "prensa", "envasadora", "ritmo", "Guaycuru", "temporales", "polvo algodon", "barbijos", "informe gremial"],
        "title": "Condiciones laborales aceiteras — Informe gremial junio 2026",
        "text": """Condiciones laborales aceiteras, junio 2026:
- Vicentín planta: 80% capacidad — no está parada
- Prioridad producción: expeller sobre refinado (menor retención exportación = empresa ahorra impuestos)
- EPP insuficientes: guantes se rompen en una semana, botas no aguantan aceite caliente
- Enfermería clausurada 3 meses — violación Art. 42 CCT
- Accidentes: 3 en una semana (prensa, envasadora, piso con aceite caliente)
- Incremento ritmo: +20% volumen por turno — sin aumento de personal
- Guaycurú desmotadora: 1 línea de 2, temporales sin cobrar días no trabajados
- Polvo algodón: sin máscaras adecuadas, solo barbijos de tela""",
        "sources": ["Informe gremial FOEIAP, junio 2026"],
        "quotes": [
            {"text": "Primero bajan ritmo, después reducen turnos, después suspenden, después despiden. Y nosotros nos tenemos que organizar antes que eso pase, no después.", "author": "Daniel Yofra", "source": "Informe gremial FOEIAP, junio 2026"},
        ],
        "grade_access": "B.a",
        "vigencia": "vigente",
    },

    # --- DISCURSOS YOFRA ---
    {
        "id": "kb-discursos-yofra",
        "tipo": "multimedia",
        "category": "referentes",
        "tags": ["yofra", "discursos", "organizacion", "paritaria", "huelga", "guerra", "cretino", "Quebracho", "FreSU", "asamblea"],
        "title": "Discursos de Daniel Yofra — Sec. Gral. F.T.C.I.O.D y A.R.A.",
        "text": """Discursos de Daniel Yofra, Sec. Gral. F.T.C.I.O.D y A.R.A.:

1. Organización: "Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate. El que no está, no construye."
   Fuente: Ciclo "Por las hendijas del Quebracho", enero 2021

2. Paritaria: "La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa para no pagar lo que corresponde."
   Fuente: Asamblea paritaria aceitera, junio 2026

3. Huelga: "La propuesta patronal fue cero. Nosotros arrancamos con huelga de 7 días y forzamos la mano del ministro."
   Fuente: Gestión Sindical, diciembre 2025

4. Guerra: "Este gobierno vino a declararnos la guerra. No va a alcanzar con el diálogo. Hay que hacer huelga."
   Fuente: Reelección FOEIAP, marzo 2026

5. Cretino: "No esperamos que los legisladores nos defiendan — los cretinos son los que no defienden a los trabajadores."
   Fuente: Perfil/Futurock, enero 2026""",
        "sources": [
            "Ciclo Por las hendijas del Quebracho, enero 2021",
            "Asamblea paritaria aceitera, junio 2026",
            "Gestión Sindical, diciembre 2025",
            "Reelección FOEIAP, marzo 2026",
            "Perfil/Futurock, enero 2026",
        ],
        "quotes": [
            {"text": "Organizar es construir. No hay milagro sindical — hay trabajo, hay reunión, hay asamblea, hay debate. El que no está, no construye.", "author": "Daniel Yofra", "source": "Ciclo Por las hendijas del Quebracho, enero 2021"},
            {"text": "Este gobierno vino a declararnos la guerra. No va a alcanzar con el diálogo. Hay que hacer huelga.", "author": "Daniel Yofra", "source": "Reelección FOEIAP, marzo 2026"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- DISCURSOS CREMONTE ---
    {
        "id": "kb-discursos-cremonte",
        "tipo": "academico",
        "category": "reforma",
        "tags": ["Cremonte", "discursos", "reforma laboral", "principio protector", "LCT", "ultraactividad", "banco de horas", "responsabilidad internacional", "OIT", "distribucion del ingreso", "convenio", "ALAL", "bargaining"],
        "title": "Discursos de Cremonte — Investigador labour / ALAL / CIFRA",
        "text": """Discursos de Cremonte, investigador labour / ALAL / CIFRA:

1. Reforma laboral: "La reforma laboral es un retorno al siglo XIX. Bargaining por empresa es letal para el modelo sindical — achica la representación al 5% como en Brasil y Colombia."
   Fuente: La Izquierda Diario, noviembre 2025

2. Principio protector: "El principio protector de la LCT es compensatorio de la desigualdad real. La reforma lo invierte — ahora el más débil tiene que probar, no el más fuerte."
   Fuente: Tiempo Argentino, noviembre 2025

3. Ultraactividad: "Ultraactividad es negociar sin red. Si se elimina, cuando un convenio vence, todo vuelve a la ley — y la ley es el piso más bajo. El sindicato pierde lo conquistado."
   Fuente: Tiempo Argentino, noviembre 2025

4. Banco de horas: "El banco de horas flexibiliza la jornada completamente. El patronal decide cuándo trabajas y cuándo no. Tu soberanía sobre el día de trabajo desaparece."
   Fuente: Degremiales/El Espectador, junio 2026

5. Responsabilidad internacional: "Argentina va a incurrir en responsabilidad internacional. 160 artículos contravienen la Constitución. Plataformas excluidas de toda tutela. Huelga prácticamente prohibida."
   Fuente: Audiencia congressional ALAL, febrero 2026

6. OIT: "América Latina experimenta un retroceso peligroso en derechos sociales. Argentina rompe el piso del Convenio OIT N°1 de 1919 — permite jornadas de 12 horas. Criminalización de la protesta."
   Fuente: Conferencia OIT 114, Geneva, junio 2026

7. Distribución: "La distribución del ingreso no es un fenómeno natural — es el resultado de una relación de fuerzas. Cuando la patronal tiene más fuerza, la distribución se inclina. Cuando el movimiento obrero se organiza, se rebalancea."
   Fuente: Investigación distribución del ingreso, 2025

8. Convenio: "El convenio no es solo un texto legal — es un territorio conquistado. Cada cláusula es una lucha que se ganó, y cada cláusula que no está es una lucha que se perdió. Defender el convenio es defender esa conquista."
   Fuente: Clase convenios aceiteros, 2026""",
        "sources": [
            "La Izquierda Diario, noviembre 2025",
            "Tiempo Argentino, noviembre 2025",
            "Degremiales/El Espectador, junio 2026",
            "Audiencia congressional ALAL, febrero 2026",
            "Conferencia OIT 114, Geneva, junio 2026",
            "Investigación distribución del ingreso, 2025",
            "Clase convenios aceiteros, 2026",
        ],
        "quotes": [
            {"text": "La reforma laboral es un retorno al siglo XIX. Bargaining por empresa es letal para el modelo sindical — achica la representación al 5% como en Brasil y Colombia.", "author": "Cremonte", "source": "La Izquierda Diario, noviembre 2025"},
            {"text": "Ultraactividad es negociar sin red. Si se elimina, cuando un convenio vence, todo vuelve a la ley — y la ley es el piso más bajo. El sindicato pierde lo conquistado.", "author": "Cremonte", "source": "Tiempo Argentino, noviembre 2025"},
            {"text": "El convenio no es solo un texto legal — es un territorio conquistado. Cada cláusula es una lucha que se ganó, y cada cláusula que no está es una lucha que se perdió. Defender el convenio es defender esa conquista.", "author": "Cremonte", "source": "Clase convenios aceiteros, 2026"},
            {"text": "América Latina experimenta un retroceso peligroso en derechos sociales. Argentina rompe el piso del Convenio OIT N°1 de 1919 — permite jornadas de 12 horas. Criminalización de la protesta.", "author": "Cremonte", "source": "Conferencia OIT 114, Geneva, junio 2026"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- JASINSKI: El encanto del tanino (La Forestal) ---
    {
        "id": "kb-jasinski-forestal-fenomeno",
        "tipo": "academico",
        "category": "violencia-empresarial",
        "tags": ["La Forestal", "tanino", "quebracho", "empresa", "monopolio", "enclave", "Chaco santafesino", "Villa Ana", "Villa Guillermina", "Violencia empresarial", "lockout", "historia obrera", "masacre 1921", "Jasinski", "benefactora", "autoritarismo"],
        "title": "La Forestal: el fenómeno — Jasinski, El encanto del tanino (2023)",
        "text": """LA FORESTAL: EL FENÓMENO

La Forestal Argentina Ltda. fue una empresa taninera que operó en el Chaco santafesino y formoseño entre 1906 y 1960s, dedicada a la explotación del quebracho para producir tanino (extracto curtiente). Constituyó un monopolio regional — "economía de enclave" — que controlaba la producción, el empleo, la tierra, los pueblos, y las relaciones sociales en una vasta región del norte argentino.

La historiografía tradicional retrató a La Forestal como "obra de civilización y cultura" — la versión de la compañía. Se reconoció la masacre de 1921 como punto de inflexión, pero se obvió la violencia empresarial estructural que operó antes y después. Gastón Gori ya había señalado el lockout como "presión despótica", pero los estudios posteriores lo olvidaron.

Jasinski reinterpretó el fenómeno: las luchas sociales (huelgas, rebeliones, sindicalización) fueron activadores de decisiones empresariales — no solo las variables del mercado global. La rebelión de 1918-1921 provocó que La Forestal iniciara inversiones en África. Las luchas de la década de 1930 — ignoradas por todos los estudios previos — fueron activadores del plan de retirada. La emergencia del peronismo no constituye el "inicio del fin" — acelera una estrategia preconcebida. En 1949, La Forestal anunció el cierre definitivo de su fábrica más importante, Villa Guillermina. Desde entonces, cerró sus fábricas escalonadamente.""",
        "sources": ["Jasinski, El encanto del tanino, Prometeo Libros 2023, ISBN 978-987-816-561-5, pp. 22-29"],
        "quotes": [
            {"text": "Las luchas sociales fueron activadores de decisiones empresariales — no solo las variables del mercado global.", "author": "Alejandro Jasinski", "source": "El encanto del tanino, Prometeo 2023, Introducción"},
            {"text": "La violencia empresarial que no fue explícita o directa fue obviada, olvidándose las sugerencias de Gori, quien proponía estudiar el lockout como 'presión despótica' para aplacar las protestas.", "author": "Alejandro Jasinski", "source": "El encanto del tanino, Prometeo 2023, p. 25"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    {
        "id": "kb-jasinski-lockout",
        "tipo": "academico",
        "category": "violencia-empresarial",
        "tags": ["La Forestal", "lockout", "cierre fábricas", "paralización", "Tartagal", "Villa Ana", "Villa Guillermina", "La Gallareta", "migración obrera", "violencia empresarial", "presión despótica", "Jasinski", "Chaco santafesino", "tanino", "1920s"],
        "title": "La mordaza del lockout — Jasinski, El encanto del tanino, Cap. 6 (2023)",
        "text": """LA MORDAZA DEL LOCKOUT (La Forestal, 1920s-1930s)

Entre comienzos de 1921 y comienzos de 1931, durante diez años, las fábricas de La Forestal funcionaron aproximadamente durante la mitad del tiempo. El lockout — la paralización deliberada de la producción — fue la herramienta central de la violencia empresarial.

La Forestal usaba el lockout como "presión despótica" para aplacar protestas, negociar condiciones, y controlar la región. Cuando se negociaba la renovación del pool comercial o se discutía proyectos de derechos a exportaciones de tanino, la empresa anunciaba suspensiones — aun cuando el año cerraba con exportaciones que duplicaban las de 1921. La paralización se trasladaba de fábrica en fábrica: cerraban Tartagal, reabrían La Gallareta, cerraban Villa Ana y Villa Guillermina. Inmediatamente se detectaban migraciones de obreros hacia el norte.

El Departamento Provincial del Trabajo solicitaba informes sobre la posibilidad de colocar "mano de obra sobrante" en el Chaco. La empresa aseguraba que la paralización duraría poco y que se ocuparía a "gran parte del personal" en otras tareas — pero los obreros no tenían otros medios de vida que los proporcionados por La Forestal. La dependencia total del enclave convertía el lockout en una herramienta de sometimiento: no era solo cierre de fábrica — era cierre del pueblo.""",
        "sources": ["Jasinski, El encanto del tanino, Prometeo Libros 2023, Cap. 6 'La violencia empresarial', pp. 157-165"],
        "quotes": [
            {"text": "No existen otros medios de vida que los proporcionados por La Forestal.", "author": "Informe contemporáneo citado por Jasinski", "source": "El encanto del tanino, Prometeo 2023, p. 159"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    {
        "id": "kb-jasinski-destruir-someter",
        "tipo": "academico",
        "category": "violencia-empresarial",
        "tags": ["La Forestal", "violencia empresarial", "Destruir someter depurar", "masacre", "1921", "represión", "Villa Ana", "Villa Guillermina", "pueblos forestales", "Jasinski", "expulsión", "depuración", "listas negras"],
        "title": "Destruir, someter, depurar — Jasinski, El encanto del tanino, Cap. 6 (2023)",
        "text": """DESTRUIR, SOMETER, DEPURAR (La Forestal, post-masacre 1921)

Después de la masacre de obreros en territorios de La Forestal (1918-1921), la empresa implementó una estrategia triple: destruir las organizaciones, someter a los trabajadores, y depurar a los disidentes.

La depuración implicaba listas negras, expulsión de pueblos, y prohibición de reingreso. Trabajadores que habían participado en las huelgas fueron echados y impedidos de volver. Se reemplazó personal con obreros sin experiencia sindical — "manos limpias" sin antecedentes de organización.

El sometimiento operaba через el control total del espacio: los pueblos eran propiedad de la empresa, las casas eran de la empresa, la tienda era de la empresa, el médico era de la empresa. La dependencia material era total — y se reforzaba con la expulsión de quienes cuestionaban. "Al fin nuestros hijos comen" — la sumisión se presentaba como gratitud, pero era supervivencia en un enclave sin alternativas.

La "Forestal Benefactora" — la versión hegemónica — se construyó sobre esta depuración. Se obvió que el consentimiento activo de los trabajadores fue obtenido después de expulsar, encarcelar, y matar a quienes se organizaron.""",
        "sources": ["Jasinski, El encanto del tanino, Prometeo Libros 2023, Cap. 6 'La violencia empresarial', pp. 165-171"],
        "quotes": [
            {"text": "Al fin nuestros hijos comen — la sumisión se presentaba como gratitud, pero era supervivencia en un enclave sin alternativas.", "author": "Alejandro Jasinski", "source": "El encanto del tanino, Prometeo 2023, Cap. 6, p. 171"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    {
        "id": "kb-jasinski-sindicalismo",
        "tipo": "academico",
        "category": "organizacion",
        "tags": ["La Forestal", "sindicalismo", "anarquismo", "comunismo", "huelga", "1918", "1921", "Teófilo Lafuente", "Villa Ana", "Villa Guillermina", "La Gallareta", "organización obrera", "Jasinski", "centro social", "masacre", "rebelión"],
        "title": "El sindicalismo metió la cola — Jasinski, El encanto del tanino, Cap. 7 (2023)",
        "text": """EL SINDICALISMO METIÓ LA COLA (La Forestal, 1918-1921)

La sindicalización en los pueblos de La Forestal fue un proceso combativo y heterogéneo. No fue un sindicalismo corporativo — fue una rebelión que combinó anarquismo, sindicalismo revolucionario, y comunismo criollo.

En 1920, no menos de quinientos trabajadores de Villa Ana se dieron cita en su Centro Social y Recreativo para inaugurar un local donado por la gerencia. Escucharon el discurso del gerente René Lawson, saludado con "estruendosa explosión de aplausos". Pero debajo de la deferencia obligada operaba el descontento: el "mascullar de la indignación" — bronca expresada en privado, en los obrajes, en las conversaciones entre trabajadores.

Teófilo Lafuente fue el primer secretario general del tanino. Desde Villa Guillermina y Villa Ana, la organización obrera creció enfrentando el régimen de la empresa: derecho al trabajo, crisis de legitimidad, y pelea ciudadana por el control comunal. La rebelión de 1918-1921 combinó huelgas, ocupaciones, y enfrentamientos con la guardia blanca (policía privada de la empresa). La masacre de enero 1921 terminó con decenas de obreros muertos en los obrajes de La Gallareta y Villa Guillermina.""",
        "sources": ["Jasinski, El encanto del tanino, Prometeo Libros 2023, Cap. 7 'Resistencia y rebelión', pp. 197-204"],
        "quotes": [
            {"text": "El mascullar de la indignación — bronca expresada en privado, en los obrajes, en las conversaciones entre trabajadores.", "author": "Alejandro Jasinski", "source": "El encanto del tanino, Prometeo 2023, Cap. 7, p. 191"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },
]


# ===== Helper: rebuild KNOWLEDGE_BASE string from chunks (backwards compat) =====

def rebuild_knowledge_base_string() -> str:
    """Rebuild the original KNOWLEDGE_BASE string format from structured chunks.

    Used as fallback during transition if RAG retrieval is not available.
    """
    lines = ["=== ORGANIZACIÓN SINDICAL ===", ""]

    # Organization chunks
    org_chunks = [c for c in KB_CHUNKS if c["category"] == "organizacion" or (c["category"] == "referentes" and c["tipo"] == "documento")]
    for chunk in org_chunks:
        lines.append(chunk["text"].strip())
        lines.append("")

    # Conditions chunks (empresa-level)
    cond_chunks = [c for c in KB_CHUNKS if c["category"] == "condiciones" and c["tipo"] == "documento"]
    for chunk in cond_chunks:
        lines.append(chunk["text"].strip())
        lines.append("")

    lines.append("=== FUENTES DISPONIBLES ===")
    lines.append("")

    # Source chunks
    source_chunks = [c for c in KB_CHUNKS if c["category"] not in ("organizacion",) and c["id"] not in ("kb-org-yofra", "kb-org-cremonte")]
    for chunk in source_chunks:
        lines.append(f"[FUENTE: {chunk['title']}]")
        lines.append(chunk["text"].strip())
        for q in chunk.get("quotes", []):
            lines.append(f"Quote: \"{q['text']}\"")
            lines.append(f"— {q['author']}")
            lines.append(f"Fuente: {q['source']}")
        lines.append(f"Fuente: {', '.join(chunk['sources'])}")
        lines.append("")

    return "\n".join(lines)


# ===== Helper: get chunks for prompt injection =====

def get_chunks_text(chunk_ids: list) -> str:
    """Format selected chunks as text for system prompt injection.

    Only includes chunks whose IDs are in chunk_ids list.
    Returns formatted text similar to the original KNOWLEDGE_BASE format.
    """
    if not chunk_ids:
        return ""

    chunks = [c for c in KB_CHUNKS if c["id"] in chunk_ids]
    if not chunks:
        return ""

    lines = ["=== FUENTES RELEVANTES ===", ""]

    for chunk in chunks:
        lines.append(f"[FUENTE: {chunk['title']}]")
        lines.append(chunk["text"].strip())
        for q in chunk.get("quotes", []):
            lines.append(f"Quote: \"{q['text']}\"")
            lines.append(f"— {q['author']}")
            lines.append(f"Fuente: {q['source']}")
        lines.append(f"Fuente: {', '.join(chunk['sources'])}")
        lines.append("")

    return "\n".join(lines)


# ===== Categories metadata for UI =====

KB_CATEGORY_META = {
    "organizacion": {"label": "Organización", "icon": "📄", "desc": "Federación, sindicato, referentes"},
    "convenio": {"label": "Convenio", "icon": "📄", "desc": "CCT, cláusulas, resoluciones"},
    "paritaria": {"label": "Paritaria", "icon": "📄", "desc": "Negociación salarial, huelga"},
    "smvm": {"label": "SMVM", "icon": "📚", "desc": "Salario mínimo, básico, canasta básica"},
    "reforma": {"label": "Reforma laboral", "icon": "📚", "desc": "LCT, ultraactividad, banco de horas"},
    "condiciones": {"label": "Condiciones", "icon": "📄", "desc": "EPP, accidentes, enfermería, ritmo"},
    "referentes": {"label": "Referentes", "icon": "📰", "desc": "Discursos, posiciones, quotes"},
    "violencia-empresarial": {"label": "Violencia empresarial", "icon": "📚", "desc": "Lockout, represión, masacre, enclave"},
}
