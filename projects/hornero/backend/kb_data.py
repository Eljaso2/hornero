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

Chunks come from two sources:
1. KB_CHUNKS: manually curated chunks (from original KNOWLEDGE_BASE + Jasinski referentes)
2. kb_chunks.json: auto-extracted chunks from full PDFs (loaded on startup)
Both are merged into ALL_CHUNKS for RAG retrieval.
"""

import json
import os

# ===== Taxonomía =====

KB_TIPOS = ["academico", "prensa", "noticias", "documentos", "audiovisual"]
KB_CATEGORIES = [
    "academico", "prensa", "noticias", "documentos", "audiovisual",
]

# ===== Chunks estructurados =====

KB_CHUNKS = [
    # --- ORGANIZACIÓN (ACEITEROS) ---
    {
        "id": "kb-org-federacion",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "aceiteros",
        "tags": ["federacion", "aceitera", "FOEIAP", "F.T.C.I.O.D", "paritaria", "huelga", "democracia sindical", "formacion", "salud laboral", "tercerizacion", "precarizacion", "neoliberalismo", "UOM", "ATE", "URGARA", "organizacion"],
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
        "category": "academico",
        "tenant": "aceiteros",
        "tags": ["yofra", "Daniel Yofra", "secretario general", "paritaria", "huelga", "FreSU", "organizacion", "convenio", "referente sindical", "referentes"],
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
        "category": "academico",
        "tenant": "shared",
        "tags": ["Cremonte", "investigador", "labour", "derecho laboral", "distribucion del ingreso", "salario minimo", "reforma laboral", "SMVM", "ALAL", "OIT", "LCT", "principio protector", "ultraactividad", "referentes"],
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
        "category": "documentos",
        "tenant": "aceiteros",
        "tags": ["Vicentín", "SAIC", "empresa aceitera", "concurso preventivo", "paritaria", "Reconquista", "Santa Fe", "expeller", "refinado", "retencion exportacion", "condiciones"],
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
        "category": "documentos",
        "tenant": "aceiteros",
        "tags": ["Guaycurú", "desmotadora", "algodon", "planta auxiliar", "trabajadores temporales", "polvo algodon", "EPP", "Chaco", "condiciones"],
        "title": "Guaycurú — Desmotadora de algodón",
        "text": """GUAYCURÚ — Desmotadora de algodón (planta aceitera auxiliar). 1 línea de 2 operativa. Trabajadores temporales sin cobrar días no trabajados. Polvo de algodón sin máscaras adecuadas.""",
        "sources": ["Informe gremial FOEIAP, junio 2026"],
        "quotes": [],
        "grade_access": "B.a",
        "vigencia": "vigente",
    },

    # --- CONVENIO (ACEITEROS) ---
    {
        "id": "kb-cct-420",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "aceiteros",
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

    # --- PARITARIA (ACEITEROS) ---
    {
        "id": "kb-paritaria-2026",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "aceiteros",
        "tags": ["paritaria", "aceitera", "2026", "SOMU", "15%", "8%", "Caputo", "huelga", "basico", "SMVM", "convenio", "Yofra", "Vicentin", "concurso preventivo"],
        "title": "Paritaria aceitera 2026 — F.T.C.I.O.D y A.R.A./SOMU",
        "text": """Paritaria aceitera 2026 — ACTUAL:
- SOMU demanda 15% de aumento
- Empresas ofrecen 8%
- Vicentín argumenta concurso preventivo limita posibilidades
- Básico junio 2026: $340.000 — no cubre alquiler Reconquista ($380.000)
- Brecha salario-vivienda: básico 12% debajo del alquiler
- Paritaria 2026 cerró en julio 2026 con básico $2.719.040 (desde septiembre 2026)

NOTA — Paritaria ANTERIOR (2025):
- Paritaria 2025 cerró después de 7 días de huelga nacional — forzó mano de Caputo""",
        "sources": ["Asamblea paritaria aceitera, junio 2026", "Gestión Sindical, diciembre 2025"],
        "quotes": [
            {"text": "La propuesta patronal fue cero. Empezaron desde cero. Nosotros no vamos a aceptar que el concurso sea excusa para no pagar lo que corresponde. Si la planta funciona al 80%, hay producción, hay plata.", "author": "Daniel Yofra", "source": "Asamblea paritaria aceitera, junio 2026"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SMVM (SHARED) ---
    {
        "id": "kb-smvm-basico",
        "tipo": "academico",
        "category": "documentos",
        "tenant": "shared",
        "tags": ["SMVM", "salario minimo", "basico convenio", "$2.344.000", "$340.000", "canasta basica", "inflacion obrera", "distribucion del ingreso", "Cremonte", "CIFRA", "piso legal", "violacion", "smvm"],
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

    # --- CONDICIONES (ACEITEROS) ---
    {
        "id": "kb-condiciones-2026",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "aceiteros",
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

    # --- DISCURSOS YOFRA (ACEITEROS) ---
    {
        "id": "kb-discursos-yofra",
        "tipo": "multimedia",
        "category": "academico",
        "tenant": "aceiteros",
        "tags": ["yofra", "discursos", "organizacion", "paritaria", "huelga", "guerra", "cretino", "Quebracho", "FreSU", "asamblea", "referentes"],
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

    # --- DISCURSOS CREMONTE (SHARED) ---
    {
        "id": "kb-discursos-cremonte",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["Cremonte", "discursos", "reforma laboral", "principio protector", "LCT", "ultraactividad", "banco de horas", "responsabilidad internacional", "OIT", "distribucion del ingreso", "convenio", "ALAL", "bargaining", "reforma-laboral"],
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

    # --- JASINSKI: La Forestal (SHARED) ---
    {
        "id": "kb-jasinski-forestal-fenomeno",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["La Forestal", "tanino", "quebracho", "empresa", "monopolio", "enclave", "Chaco santafesino", "Villa Ana", "Villa Guillermina", "Violencia empresarial", "lockout", "historia obrera", "masacre 1921", "Jasinski", "benefactora", "autoritarismo", "violencia-empresarial"],
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
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg/800px-La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/La_Forestal_Argentina",
    },

    {
        "id": "kb-jasinski-lockout",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["La Forestal", "lockout", "cierre fábricas", "paralización", "Tartagal", "Villa Ana", "Villa Guillermina", "La Gallareta", "migración obrera", "violencia empresarial", "presión despótica", "Jasinski", "Chaco santafesino", "tanino", "1920s", "violencia-empresarial"],
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
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg/800px-La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/La_Forestal_Argentina",
    },

    {
        "id": "kb-jasinski-destruir-someter",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["La Forestal", "violencia empresarial", "Destruir someter depurar", "masacre", "1921", "represión", "Villa Ana", "Villa Guillermina", "pueblos forestales", "Jasinski", "expulsión", "depuración", "listas negras", "violencia-empresarial"],
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
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg/800px-La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/La_Forestal_Argentina",
    },

    {
        "id": "kb-jasinski-prologo-inigo-carrera",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["La Forestal", "Jasinski", "Iñigo Carrera", "coacción", "coacción extraeconómica", "coacción económica", "violencia empresarial", "proletarización", "valor fuerza de trabajo", "lockout", "prólogo", "El encanto del tanino", "violencia-empresarial"],
        "title": "Prólogo de Iñigo Carrera — Jasinski, El encanto del tanino (2023)",
        "text": """PRÓLOGO DE IÑIGO CARRERA — Jasinski, El encanto del tanino (2023)

El prólogo de El encanto del tanino fue escrito por Nicolás Iñigo Carrera, investigador del CICCUS y autor de "La violencia como potencia económica" (2010). Iñigo Carrera establece la distinción fundamental entre dos modalidades de la violencia empresarial:

1. Coacción extraeconómica: la violencia física y represiva, aplicada directamente por la empresa o mediante el aparato estatal. Es el instrumento para instaurar las condiciones del sistema productivo — la que crea las condiciones de existencia del régimen de producción.

2. Coacción económica: la que opera cuando la clase obrera no tiene propiedad de los medios de producción y se ve forzada a vender su fuerza de trabajo por un salario. Esta modalidad predomina cuando ya se formó la clase obrera. Es la que perpetúa el régimen.

Dice Iñigo Carrera: "La coacción extraeconómica crea las condiciones y la coacción económica las perpetúa cuando ya se ha formado una clase obrera que a fuerza de tradición, educación, costumbre se somete al régimen de producción capitalista como si fuese una ley natural" (Iñigo Carrera, Prólogo a El encanto del tanino, p. 18).

Agrega: el lockout patronal asienta su eficacia en la coacción económica — como cuando un obrero, al terminar el lockout, valoraba que "al fin" sus hijos tenían para comer. La sumisión se presentaba como gratitud, pero era supervivencia en un enclave sin alternativas.

Jasinski retoma esta distinción a lo largo del libro para analizar las formas concretas que tomó la violencia empresarial de La Forestal: lockout (Cap. 6, pp. 157-165), destrucción de organizaciones, sometimiento y depuración de disidentes (Cap. 6, pp. 165-171). No existe una lista de "5 categorías" en el texto — la clasificación de Iñigo Carrera distingue dos grandes modalidades (extraeconómica y económica), y Jasinski las analiza en sus formas históricas concretas.""",
        "sources": ["Iñigo Carrera, Nicolás — Prólogo a Jasinski, El encanto del tanino, Prometeo Libros 2023, pp. 15-22", "Jasinski, El encanto del tanino, Prometeo Libros 2023, Cap. 6 'La violencia empresarial', pp. 157-171"],
        "quotes": [
            {"text": "La coacción extraeconómica crea las condiciones y la coacción económica las perpetúa cuando ya se ha formado una clase obrera que a fuerza de tradición, educación, costumbre se somete al régimen de producción capitalista como si fuese una ley natural.", "author": "Nicolás Iñigo Carrera", "source": "Prólogo a El encanto del tanino, Prometeo 2023, p. 18"},
            {"text": "Al fin nuestros hijos comen — la sumisión se presentaba como gratitud, pero era supervivencia en un enclave sin alternativas.", "author": "Alejandro Jasinski", "source": "El encanto del tanino, Prometeo 2023, Cap. 6, p. 171"},
        ],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    {
        "id": "kb-jasinski-sindicalismo",
        "tipo": "academico",
        "category": "documentos",
        "tenant": "shared",
        "tags": ["La Forestal", "sindicalismo", "anarquismo", "comunismo", "huelga", "1918", "1921", "Teófilo Lafuente", "Villa Ana", "Villa Guillermina", "La Gallareta", "organización obrera", "Jasinski", "centro social", "masacre", "rebelión", "organizacion"],
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

    {
        "id": "kb-jasinski-referentes-forestal",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["La Forestal", "Teófilo Lafuente", "José Bernabé Vargas", "Rogelio Lamazón", "secretario general", "sindicalismo", "tanino", "Villa Guillermina", "Villa Ana", "comunismo", "anarquismo", "Jasinski", "1918", "1921", "1930s", "obrero comunista", "huelga", "referentes"],
        "title": "Referentes obreros de La Forestal — Jasinski, El encanto del tanino (2023)",
        "text": """REFERENTES OBREROS DE LA FORESTAL

Teófilo Lafuente — Primer secretario general del sindicato del tanino. Protagonista de las luchas de 1918-1921 en Villa Guillermina. En 2020-2021, se erigió un monumento a Lafuente en Villa Guillermina, con presencia de sus nietos y nietas. Se anunció la creación de un parque de la memoria y la identidad.

José Bernabé Vargas — Obrero comunista y actor de las huelgas y refundación sindical de la década de 1930 en Villa Guillermina. Familia de cultura guaraní, llegada a Villa Guillermina desde Bella Vista, Corrientes. Jasinski lo visitó en su casa de Rosario y accedió a su archivo personal: memorias escritas en la década de 1970, fotos, cartas y volantes. Su hija conservaba actas de la organización sindical. Vargas fue secretario general de la experiencia de reorganización sindical de Villa Guillermina.

Rogelio Lamazón — Dirigente yrigoyenista. La Forestal le inculpaba tener parte en la campaña de organización obrera. Participó en negociaciones con la empresa: junto a Vargas y Romero, asistió con una carpeta con petición de mejoras (jornal mínimo, aumentos progresivos, mejoras para obrajeros). Lamazón fue asesinado — su muerte es tratada en el Cap. 9 del libro.""",
        "sources": ["Jasinski, El encanto del tanino, Prometeo Libros 2023, pp. 22, 27-28, 197-204, 216-220, 251-258"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg/800px-La_Forestal_Argentina._F%C3%A1brica_de_tanino._Villa_Guillermina.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/La_Forestal_Argentina",
    },

    # ===== SIPREBA — SINDICATO DE PRENSA DE BUENOS AIRES =====
    # ⚠️ Chunks escritos desde conocimiento — verificar con textos oficiales cuando InfoLEG vuelva

    # --- SIPREBA: ORGANIZACIÓN ---
    {
        "id": "kb-sipreba-org",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["SIPREBA", "Sindicato de Prensa", "UPC", "Unión de Prensa de Buenos Aires", "FEP", "Federación de Periodistas", "prensa", "periodista", "paritaria", "organización", "ADEPA", "IANA", "Agustín Lecchi", "secretario general", "derecho a la información"],
        "title": "SIPREBA — Sindicato de Prensa de Buenos Aires",
        "text": """SIPREBA — SINDICATO DE PRENSA DE BUENOS AIRES

SIPREBA es el sindicato que representa a los trabajadores de prensa de la Ciudad de Buenos Aires y su área metropolitana. Agrupa a periodistas, cronistas, correctores, editores, fotógrafos, diagramadores, y demás profesionales de la información que trabajan en medios gráficos, agencias de noticias, radio, televisión y medios digitales.

Organización:
- Secretario General: Agustín Lecchi
- Federación: FATPREN (Federación Argentina de Trabajadores de Prensa) — fatpren.org.ar
- Convenios colectivos: CCT 301/75 (Prensa Escrita y Oral) y CCT 124/75 (Prensa Televisada)
- Cámaras patronales: ADEPA (prensa escrita), IANA (agencias)
- Sede: Solís 1158, 4to piso, CABA
- Email: contacto@sipreba.org
- Web: sipreba.org
- YouTube: SiPreBATV — https://www.youtube.com/c/SiPreBATV
- Proyecto Memoria: memoria.sipreba.org

Secretarías:
- Acción Social
- Mujeres y Géneros
- Derechos Humanos
- Cultura y Juventud
- Asuntos Profesionales

SIPREBA defiende el derecho a la información, la libertad de prensa entendida como derecho de los trabajadores y del pueblo, y las condiciones laborales del periodismo profesional. Denuncia el vaciamiento de medios (ej: planta de impresión de Clarín, 2026), los despidos masivos, y la precarización del trabajo periodístico. Promueve la democracia sindical y la participación de los trabajadores de prensa en las decisiones del gremio.

Caja de Herramientas: serie de 7 videos sobre derechos laborales (Trabajo, Organización sindical, Salario, Licencias, Estatuto del Periodista, Convenios, Trabajo en plataformas) — disponibles en SiPreBATV.

⚠️ Verificar datos con fuentes oficiales de SIPREBA.""",
        "sources": ["sipreba.org", "CCT 301/75", "CCT 124/75", "FATPREN"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: CCT 301/75 ---
    {
        "id": "kb-sipreba-cct-301",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["CCT 301/75", "prensa escrita y oral", "convenio colectivo", "jornada 6 horas", "36 horas semanales", "categorías periodista", "cronista", "corrector", "diagramador", "editor", "fotógrafo", "salario profesional", "estabilidad", "licencias", "horas extra", "nocturno", "ADEPA"],
        "title": "CCT 301/75 — Prensa Escrita y Oral",
        "text": """CCT 301/75 — CONVENIO COLECTIVO DE TRABAJO DE PRENSSA ESCRITA Y ORAL

El CCT 301/75 es el convenio colectivo que rige las condiciones laborales de los trabajadores de prensa escrita y oral (diarios, revistas, agencias noticiosas, radio). Homologado en 1975, ha sido actualizado por múltiples resoluciones salariales.

Principales disposiciones:
- JORNADA: 6 horas diarias / 36 horas semanales para tareas de redacción. 7 horas / 42 horas para tareas administrativas y de taller.
- CATEGORÍAS PROFESIONALES: Cronista (general, especial, jefe de sección), Corrector (de estilo, de pruebas), Editor, Diagramador/tipógrafo, Fotógrafo (reportero gráfico), Dibujante, Redactor, Secretario de redacción, Jefe de redacción, Director.
- SALARIO PROFESIONAL: Escalafón por categoría con adicionales por antigüedad, título, y función.
- HORAS EXTRA: Se pagan con recargo (50% o 100% según horario y día).
- ESTABILIDAD: El periodista profesional goza de estabilidad en el empleo tras el período de prueba. Despido sin causa genera indemnización agravada.
- LICENCIAS: Anual reglamentaria (mínimo 15 días hábiles), por enfermedad (conservando puesto y salario), por maternidad, y por estudio (para cursar carreras afines).
- SEPTIMO DÍA: Descanso semanal obligatorio.

Cámara patronal: ADEPA (Asociación de Entidades Periodísticas Argentinas).

⚠️ Texto reconstruido desde conocimiento — verificar con texto oficial del CCT cuando InfoLEG vuelva.""",
        "sources": ["CCT 301/75 — Prensa Escrita y Oral", "InfoLEG (URL por verificar)"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: CCT 124/75 ---
    {
        "id": "kb-sipreba-cct-124",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["CCT 124/75", "prensa televisada", "convenio colectivo", "televisión", "noticiero", "cámaras", "cronista TV", "productor", "editor TV", "movilero", "categorías TV", "horarios", "turnos"],
        "title": "CCT 124/75 — Prensa Televisada",
        "text": """CCT 124/75 — CONVENIO COLECTIVO DE TRABAJO DE PRENSSA TELEVISADA

El CCT 124/75 rige las condiciones laborales de los trabajadores de prensa en televisión (noticieros, programas periodísticos, informativos cable). Con 72 artículos, es el marco normativo específico para el periodismo audiovisual.

Principales disposiciones:
- ÁMBITO: Canales de TV abierta, cable, y productoras de información televisiva de la Ciudad de Buenos Aires y alrededores.
- CATEGORÍAS: Cronista, Movilero, Productor periodístico, Editor de noticiero, Jefe de información, Corresponsal, Camarógrafo-periodista, Asistente de producción.
- JORNADA: Similar al CCT 301/75 con ajustes para turnos televisivos. Regímenes de guardia y disponibilidad.
- HORARIOS: Turnos rotativos con adicionales por trabajo nocturno y fines de semana.
- SALARIO: Escalafón por categoría + adicionales por función, antigüedad, y peligrosidad.
- ESTABILIDAD: Protección contra despido arbitrario con indemnización agravada.
- LICENCIAS: Anual, enfermedad, maternidad, estudio.

El CCT 124/75 ha sido complementado por múltiples actas paritarias y resoluciones salariales que actualizan los valores del escalafón.

⚠️ Texto reconstruido desde conocimiento — verificar con texto oficial del CCT cuando InfoLEG vuelva.""",
        "sources": ["CCT 124/75 — Prensa Televisada", "InfoLEG (URL por verificar)"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: LEY 12.908 ---
    {
        "id": "kb-sipreba-estatuto",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["Ley 12.908", "estatuto del periodista", "periodista profesional", "derechos del periodista", "jornada 6 horas", "salario mínimo profesional", "estabilidad", "libertad de prensa", "derecho a la información", "registro profesional", "colegiatura"],
        "title": "Ley 12.908 — Estatuto del Periodista Profesional",
        "text": """LEY 12.908 — ESTATUTO DEL PERIODISTA PROFESIONAL (1946)

La Ley 12.908 es el Estatuto del Periodista Profesional, sancionada en 1946 durante el primer gobierno peronista. Establece el marco legal específico para el ejercicio del periodismo profesional en Argentina. Es una ley de protección especial — reconoce la particularidad del trabajo periodístico y lo protege con derechos superiores a los del trabajador común.

Disposiciones clave:
- DEFINICIÓN: Es periodista profesional quien practica el periodismo como ocupación habitual y vive de ello (art. 2).
- JORNADA: 6 horas diarias / 36 horas semanales para tareas de redacción. Excepciones reglamentadas.
- SALARIO MÍNIMO PROFESIONAL: Fija un piso salarial diferenciado por categoría, por encima del salario mínimo general.
- ESTABILIDAD: El periodista profesional tiene estabilidad en el empleo. Despido sin causa genera indemnización especial (doble de la LCT). El empleador debe reincorporar o indemnizar.
- LICENCIAS: Vacaciones de 20 días corridos, licencia por enfermedad con goce de sueldo, licencia por maternidad, y licencia por estudio.
- LIBERTAD DE CONCIENCIA: El periodista no puede ser obligado a escribir contra sus convicciones (art. 12). La cláusula de conciencia protege la independencia profesional.
- REGISTRO: Los periodistas profesionales deben inscribirse en el registro correspondiente.
- SEPTIMO DÍA: Descanso obligatorio.

El Estatuto fue pionero en América Latina y sigue vigente como marco protector del periodismo. Fue reglamentado por el Decreto 410/97. La Ley 24.521 y otras modificaciones posteriores actualizaron algunos artículos sin alterar el núcleo protector.

⚠️ Texto reconstruido desde conocimiento — verificar con texto oficial cuando InfoLEG vuelva.""",
        "sources": ["Ley 12.908 — Estatuto del Periodista Profesional", "Decreto reglamentario 410/97"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: CATEGORÍAS PROFESIONALES ---
    {
        "id": "kb-sipreba-categorias",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["categorías", "escalafón", "cronista", "corrector", "editor", "fotógrafo", "diagramador", "redactor", "reportero gráfico", "jefe de redacción", "secretario de redacción", "director", "prensa escrita", "prensa televisada"],
        "title": "Categorías profesionales del periodismo — CCT 301/75 y 124/75",
        "text": """CATEGORÍAS PROFESIONALES DEL PERIODISMO

CCT 301/75 — Prensa Escrita y Oral:
- DIRECTOR: Dirección general del medio, responsabilidad editorial.
- JEFE DE REDACCIÓN: Coordina la redacción, asigna coberturas, supervisa contenido.
- SECRETARIO DE REDACCIÓN: Asistente del jefe, coordina secciones.
- EDITOR: Responsable de una sección o suplemento.
- CRONISTA ESPECIAL: Periodista con especialización en un área (política, economía, internacionales, deportes, etc.).
- CRONISTA GENERAL: Cobertura de noticias generales, reporteo en territorio.
- REDACTOR: Elabora notas y artículos a partir de información propia o de agencias.
- CORRECTOR DE ESTILO: Revisa estilo, gramática, y coherencia del texto.
- CORRECTOR DE PRUEBAS: Revisa galeradas y pruebas de imprenta.
- DIAGRAMADOR / TIPIÓGRAFO: Armado visual de páginas y secciones.
- FOTÓGRAFO / REPORTERO GRÁFICO: Cobertura fotográfica de noticias.
- DIBUJANTE: Ilustraciones, infografías, caricaturas.

CCT 124/75 — Prensa Televisada:
- JEFE DE INFORMACIÓN: Dirección del área informativa.
- EDITOR DE NOTICIERO: Selección y jerarquización de noticias.
- PRODUCTOR PERIODÍSTICO: Producción de notas, coordinación de coberturas.
- CRONISTA: Reporteo y presentación en cámara.
- MOVILERO: Cobertura en terreno con equipo móvil.
- CAMARÓGRAFO-PERIODISTA: Registro audiovisual con criterio periodístico.
- CORRESPONSAL: Representante del medio en otra ciudad o país.
- ASISTENTE DE PRODUCCIÓN: Apoyo logístico y de coordinación.

⚠️ Verificar con textos oficiales de los CCT.""",
        "sources": ["CCT 301/75", "CCT 124/75"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: JORNADA ---
    {
        "id": "kb-sipreba-jornada",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["jornada", "6 horas", "36 horas", "horas extra", "trabajo nocturno", "descanso", "séptimo día", "guardia", "disponibilidad", "turnos", "estatuto del periodista"],
        "title": "Jornada del periodista — 6 horas / 36 horas semanales",
        "text": """JORNADA DEL PERIODISTA PROFESIONAL

La jornada del periodista es una conquista histórica diferenciada: 6 horas diarias / 36 horas semanales para tareas de redacción, establecida por la Ley 12.908 (Estatuto del Periodista) y ratificada por los CCTs 301/75 y 124/75.

Marco legal:
- Ley 12.908, art. 6: jornada máxima de 6 horas para redacción.
- CCT 301/75: 6hs/36hs para redacción, 7hs/42hs para administración y taller.
- CCT 124/75: adaptación para turnos televisivos con regímenes de guardia.

HORAS EXTRA: Se pagan con recargo (50% o 100% según franja horaria y día). El empleador no puede obligar al periodista a trabajar más de la jornada sin compensación adicional.

TRABAJO NOCTURNO: Recargo especial por tareas realizadas entre las 21:00 y las 6:00.

SÉPTIMO DÍA: Descanso semanal obligatorio. Si el periodista trabaja en su día de descanso, cobra doble.

GUARDIAS Y DISPONIBILIDAD: En televisión y radio, existen regímenes de guardia pasiva (disponibilidad) y guardia activa. La guardia pasiva se compensa con un adicional; la guardia activa se computa como tiempo trabajado.

⚠️ Verificar con textos oficiales de los CCT y la Ley 12.908.""",
        "sources": ["Ley 12.908", "CCT 301/75", "CCT 124/75"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: ESTABILIDAD ---
    {
        "id": "kb-sipreba-estabilidad",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["estabilidad", "despido", "indemnización agravada", "período de prueba", "preaviso", "cláusula de conciencia", "libertad de prensa", "Ley 12.908", "CCT 301/75", "periodista profesional"],
        "title": "Estabilidad del periodista profesional — Indemnización agravada",
        "text": """ESTABILIDAD DEL PERIODISTA PROFESIONAL

El periodista profesional goza de estabilidad especial, superior a la del trabajador común. Esta protección está establecida en la Ley 12.908 y los CCTs 301/75 y 124/75.

Indemnización agravada: El despido sin causa de un periodista profesional genera una indemnización mayor que la del régimen general de la LCT. La doctrina y la jurisprudencia han establecido que la indemnización es doble respecto de la LCT (art. 245 LCT × 2). Esto reconoce la particular vulnerabilidad del periodista frente a presiones del empleador.

Cláusula de conciencia (art. 12 Ley 12.908): El periodista no puede ser obligado a escribir contra sus convicciones. Si el medio cambia su línea editorial de manera sustancial, el periodista puede rescindir el contrato con derecho a indemnización por despido — como si lo hubiera despedido el empleador.

Preaviso: El empleador debe dar preaviso de 30 días (o pagar indemnización sustitutiva) como en la LCT, pero con la indemnización agravada adicional.

Período de prueba: Durante el período de prueba, la protección es menor — pero el Estatuto establece que el empleador no puede usar el período de prueba para eludir la estabilidad.

⚠️ Verificar con textos oficiales de la Ley 12.908 y jurisprudencia.""",
        "sources": ["Ley 12.908, art. 12 y ss.", "CCT 301/75", "Jurisprudencia sobre indemnización agravada del periodista"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: LICENCIAS ---
    {
        "id": "kb-sipreba-licencias",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["licencias", "vacaciones", "enfermedad", "maternidad", "licencia por estudio", "20 días", "descanso", "CCT 301/75", "Ley 12.908"],
        "title": "Licencias del periodista — Vacaciones, enfermedad, maternidad, estudio",
        "text": """LICENCIAS DEL PERIODISTA PROFESIONAL

Las licencias del periodista están reguladas por la Ley 12.908, los CCTs 301/75 y 124/75, y la LCT como marco supletorio.

VACACIONES: 20 días corridos como mínimo (Ley 12.908). Se incrementan por antigüedad: 20 días (menos de 5 años), 25 días (5-10 años), 30 días (10-20 años), 35 días (más de 20 años). El periodista puede elegir la fecha de vacaciones dentro de la temporada alta (octubre-abril), salvo razones de servicio.

ENFERMEDAD: El periodista tiene derecho a licencia por enfermedad con goce de sueldo, conservando el puesto. El plazo depende de la antigüedad: 3 meses (menos de 5 años), 6 meses (5-10 años), y más para mayor antigüedad. El empleador puede exigir certificado médico.

MATERNIDAD: Licencia por maternidad de 90 días (ley 20.744 + convenciones). La trabajadora periodista tiene los mismos derechos que la LCT: estabilidad durante el embarazo y lactancia, prohibición de despido.

ESTUDIO: Los CCTs prevén licencias por estudio para periodistas que cursen carreras afines al periodismo. El otorgamiento depende de las necesidades del medio y la regularidad del estudiante.

⚠️ Verificar con textos oficiales de los CCT y la Ley 12.908.""",
        "sources": ["Ley 12.908", "CCT 301/75", "CCT 124/75", "LCT 20.744"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: CÁMARA PATRONAL ---
    {
        "id": "kb-sipreba-camara",
        "tipo": "documento",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["ADEPA", "IANA", "cámara patronal", "prensa escrita", "agencias de noticias", "paritaria", "empleadores", "medios", "diarios", "revistas"],
        "title": "Cámaras patronales de la prensa — ADEPA e IANA",
        "text": """CÁMARAS PATRONALES DE LA PRENSA

ADEPA — Asociación de Entidades Periodísticas Argentinas:
- Representa a los empleadores de prensa escrita (diarios, revistas, periódicos).
- Negocia las paritarias del CCT 301/75 con los sindicatos de prensa (SIPREBA, UPC, FEP).
- Agrupa a los principales medios gráficos del país.
- Su posición en las paritarias suele ser restrictiva: argumenta crisis del sector papel, caída de publicidad, y migración a medios digitales para limitar aumentos.

IANA — Interamérica Asociaciones de Noticias de Argentina:
- Representa a las agencias de noticias.
- Interviene en la negociación paritaria del sector de agencias.

La relación entre los sindicatos de prensa y las cámaras patronales es particularmente tensa en el contexto actual: despidos masivos en medios tradicionales (Clarín, La Nación, Infobae), cierre de redacciones, y tercerización del trabajo periodístico son denunciados por SIPREBA como estrategias de precarización.

⚠️ Verificar datos con fuentes oficiales.""",
        "sources": ["ADEPA", "SIPREBA comunicados"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # --- SIPREBA: CAJA DE HERRAMIENTAS ---
    {
        "id": "kb-sipreba-caja-herramientas",
        "tipo": "multimedia",
        "category": "documentos",
        "tenant": "prensa",
        "tags": ["caja de herramientas", "derechos laborales", "videos", "capacitación", "YouTube", "SiPreBATV", "herramientas legales", "formación", "trabajo", "organización", "salario", "licencias", "estatuto", "convenio", "plataformas"],
        "title": "Caja de Herramientas del SIPREBA — Videos sobre tus derechos",
        "text": """CAJA DE HERRAMIENTAS DEL SIPREBA — PARA CONOCER TUS DERECHOS

SIPREBA ofrece una serie de videos explicativos para que los trabajadores de prensa conozcan sus derechos laborales. Son 7 capítulos disponibles en el canal de YouTube SiPreBATV:

1. TRABAJO — Derechos fundamentales del trabajador de prensa.
2. ORGANIZACIÓN SINDICAL — Cómo funciona el sindicato, por qué afiliarse, Comisión Interna.
3. SALARIO — Componentes del salario profesional, básico, adicionales, paritaria.
4. LICENCIAS — Vacaciones, licencias por enfermedad, maternidad, estudio, y especiales del periodista.
5. ESTATUTO DEL PERIODISTA — Ley 12.908: qué protege, qué derechos específicos otorga.
6. CONVENIOS COLECTIVOS — CCT 301/75 y CCT 124/75: qué dicen y cómo se aplican.
7. TRABAJO EN PLATAFORMAS — Derechos del periodista que trabaja para medios digitales y plataformas.

Canal de YouTube: https://www.youtube.com/c/SiPreBATV
Página: https://www.sipreba.org/sindicato/caja-de-herramientas-del-sipreba-para-conocer-tus-derechos/

Estos videos son una herramienta de formación gremial. Cuando un afiliado pregunta por sus derechos o necesita entender un tema legal, la Caja de Herramientas es el primer recurso recomendado.""",
        "sources": ["SIPREBA — Caja de Herramientas", "https://www.sipreba.org/sindicato/caja-de-herramientas-del-sipreba-para-conocer-tus-derechos/"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
    },

    # ===== EFEMÉRIDES DE HISTORIA OBRERA =====

    {
        "id": "kb-efem-1-mayo",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["1° de Mayo", "Día Internacional de los Trabajadores", "Chicago", "ocho horas", "mártires de Chicago", "1886", "1889", "Segunda Internacional", "huelga", "anarquismo", "socialismo", "efemeride"],
        "title": "Efeméride: 1° de Mayo — Día Internacional de los Trabajadores",
        "text": """1° DE MAYO — DÍA INTERNACIONAL DE LOS TRABAJADORES

El 1° de mayo conmemora a los mártires de Chicago (1886), cuando los trabajadores que protestaban por la jornada de ocho horas — "ocho horas de trabajo, ocho horas de descanso y ocho horas de ocio" — fueron brutalmente reprimidos y varios dirigentes fueron ahorcados. La Segunda Internacional, en su Congreso de París de 1889, declaró el 1° de mayo como Día Internacional de los Trabajadores. Los anarquistas adhirieron a la resolución.

Los trabajadores en Argentina se sumaron a la protesta global a partir del 1° de mayo de 1890. Las conmemoraciones originales estaban enraizadas en conceptos de clase de emancipación y revolución, inspirados en la Comuna de París de 1871. El objetivo era terminar con el capitalismo y su Estado, apuntando a una sociedad sin clases — "socialismo, comunismo o comunismo anárquico." Con el tiempo, los significados y contenidos de la conmemoración se fueron transformando, con nuevas significaciones que convivieron con las originales.

Autor: Gustavo N. Contreras. Fuente: Historia Obrera — Efemérides.""",
        "sources": ["historiaobrera.com.ar/efemerides", "Contreras, Gustavo N. — Historia Obrera, Efemérides"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Manifestacio_barcelona_primer_de_maig_alternatiu_2009.JPG",
        "imageSource": "https://es.wikipedia.org/wiki/D%C3%ADa_Internacional_de_los_Trabajadores",
    },

    {
        "id": "kb-efem-cgta",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["CGT de los Argentinos", "Ongaro", "1968", "vandorismo", "anti-dictatorial", "anti-burocrática", "anti-imperialista", "Programa de Luchas", "Tosco", "Cordobazo", "efemeride"],
        "title": "Efeméride: La CGT de los Argentinos — 28 de marzo de 1968",
        "text": """LA CGT DE LOS ARGENTINOS — 28 DE MARZO DE 1968

El 28 de marzo de 1968, en el Congreso Normalizador de la CGT en Buenos Aires, el gráfico Raimundo Ongaro fue electo secretario general, fracturando la central sindical. Con 293 delegados sobre 457 habilitados, la CGT de los Argentinos se declaró anti-dictatorial, anti-burocrática y anti-imperialista. Su lema: "Más vale honra sin sindicatos que sindicatos sin honra." Su Programa de Luchas sintetizaba las demandas de toda la clase trabajadora. La CGT Azopardo (vandorista/participacionista) quedó como un apéndice del poder.

La CGT de los Argentinos fue precursora directa del Cordobazo: sus militantes — Tosco, Ongaro, Torres — protagonizaron las luchas del 69. Alentó la rebelión antiburocrática, antidictatorial y antiimperialista. Contribuyó al Cordobazo un año después.

Autor: Pablo Ghigliani. Fuente: Historia Obrera — Efemérides. Recursos: afiche de Ricardo Carpani, documental sobre Carpani.""",
        "sources": ["historiaobrera.com.ar/efemerides", "Ghigliani, Pablo — La CGT de los Argentinos y la resistencia obrera", "Soneira, Ignacio (2017)"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo_cgtra.png",
        "imageSource": "https://es.wikipedia.org/wiki/CGT_de_los_Argentinos",
    },

    {
        "id": "kb-efem-cordobazo",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["Cordobazo", "1969", "Onganía", "Tosco", "Torres", "Máximo Mena", "azos", "Córdoba", "huelga", "dictadura", "sábado inglés", "Luz y Fuerza", "SMATA", "efemeride"],
        "title": "Efeméride: El Cordobazo — 29 de mayo de 1969",
        "text": """EL CORDOBAZO — 29 DE MAYO DE 1969

El 29 de mayo de 1969, Córdoba se convirtió en el epicentro de la resistencia obrera y popular contra la dictadura de Onganía. La revocación del "sábado inglés" — un descanso ganado por los metalúrgicos — y el aumento del costo de vida detonaron la rebelión. Sindicatos como Luz y Fuerza (Agustín Tosco) y SMATA (Elpidio Torres) convocaron a paro y marchas. Las dos CGT regionales coordinaron la revuelta.

Cuando el obrero Máximo Mena fue asesinado por la policía, la ciudad se incendió. Barrios populares, estudiantes y trabajadores ocuparon las calles durante más de 20 horas. El balance oficial: 34 muertos, 400 heridos, 2000 detenidos. El Cordobazo inauguró un ciclo de "azos" — Rosariazo, Viborazo, Tucumanazo — que sacudió la dictadura hasta su caída.

Autor: Laura Ortiz. Fuente: Historia Obrera — Efemérides. Bibliografía: Brennan y Gordillo (1994), Ortiz (2019).""",
        "sources": ["historiaobrera.com.ar/efemerides", "Brennan, James — El Cordobazo. Las guerras obreras en Córdoba 1955-1976", "Ortiz, Laura — El Cordobazo"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cordobazo3.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/Cordobazo",
    },

    {
        "id": "kb-efem-viborazo",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["Viborazo", "1971", "Córdoba", "Uriburu", "Levingston", "SITRAC-SITRAM", "Fiat", "clasista", "Atilio López", "Tosco", "azos", "efemeride"],
        "title": "Efeméride: El Viborazo — 15 de marzo de 1971",
        "text": """EL VIBORAZO — 15 DE MARZO DE 1971

El 15 de marzo de 1971, Córdoba volvió a estallar. El nuevo gobernador militar José Camilo Uriburu declaró que "hay que cortar la cabeza de la víbora venenosa" — refiriéndose al movimiento obrero. SITRAC-SITRAM, los sindicatos clasistas de Fiat, respondieron con un paro activo y ocupación de la planta. Más de un centenar de fábricas fueron ocupadas pacíficamente el 12 de marzo. La zona de combate se extendió por 600 manzanas — cuatro veces el Cordobazo.

Más de 300 detenidos; dos obreros muertos (Adolfo Cepeda y Pablo Javier Basualdo). Uriburu y el presidente de facto Levingston tuvieron que renunciar. Participaron SITRAC-SITRAM, el peronismo combativo de Atilio López y el sindicalismo de liberación de Tosco. El Viborazo demostró que el Cordobazo no era un evento aislado sino el inicio de un proceso revolucionario.

Autor: Rodolfo Laufer. Fuente: Historia Obrera — Efemérides. Bibliografía: Balvé, Murmis, Marín et al. (1973).""",
        "sources": ["historiaobrera.com.ar/efemerides", "Laufer, Rodolfo — El Viborazo. Córdoba 1971", "Brennan, James — El Cordobazo y el Viborazo"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/b/bb/Viborazo._C%C3%B3rdoba%2C_15-3-1971.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/Viborazo",
    },

    {
        "id": "kb-efem-tampierazo",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["Tampierazo", "1973", "San Francisco", "Córdoba", "Tampieri", "Liwacki", "CGT", "ocupación", "fábrica", "Cordobacito", "Sanfranciscazo", "efemeride"],
        "title": "Efeméride: El Tampierazo — 3 de julio de 1973",
        "text": """EL TAMPIERAZO — 3 DE JULIO DE 1973

El 3 de julio de 1973, los obreros de la fábrica Tampieri en San Francisco, Córdoba, ocuparon la planta por salarios impagos. La CGT local declaró un paro general ciudadano: 430 fábricas y 2500 comercios cerraron. La Guardia de Infantería reprimió — un adolescente fue asesinado. También llamado "Cordobacito" o "Sanfranciscazo."

Oscar Liwacki, secretario general de la CGT local, fue secuestrado y desaparecido el 12 de mayo de 1976; el diario "La Voz de San Justo" había pedido al gobierno militar que "limpiara la ciudad de subversivos." El Tampierazo mostró la combatividad de la clase obrera en el interior del país.

Autor: Laura Ortiz. Fuente: Historia Obrera — Efemérides. Bibliografía: Gómez (2006), Tampieri (2000).""",
        "sources": ["historiaobrera.com.ar/efemerides", "Ortiz, Laura — El Tampierazo. Obreros en lucha, San Francisco 1973", "Gómez (2006)"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "",
        "imageSource": "https://historiaobrera.com.ar/efemerides/",
    },

    {
        "id": "kb-efem-tosco-rucci",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["Tosco", "Rucci", "debate", "1973", "Canal 11", "Las dos campanas", "CGT de los Argentinos", "CGT Azopardo", "sindicalismo de liberación", "peronismo ortodoxo", "verticalismo", "efemeride"],
        "title": "Efeméride: El debate Tosco-Rucci — 13 de febrero de 1973",
        "text": """EL DEBATE TOSCO-RUCCI — 13 DE FEBRERO DE 1973

El 13 de febrero de 1973, Canal 11 emitió "Las dos campanas" — un debate televisado entre Agustín Tosco y José Ignacio Rucci. Tosco representaba el sindicalismo independiente, clasista, anti-burocrático; Rucci, el peronismo ortodoxo, alineado con Perón desde la CGT Azopardo. Dos proyectos sindicales y políticos contrapuestos se enfrentaron en vivo.

Rucci representaba el peronismo ortodoxo y el verticalismo sindical; Tosco defendía la democracia de base y un "sindicalismo de liberación" con perspectiva socialista y antiimperialista. El debate expuso "dos proyectos contrapuestos respecto de la organización y el rol de los sindicatos." El debate sintetizó la tensión entre clase y movimiento que definió el peronismo obrero.

Autor: Rodolfo Laufer. Fuente: Historia Obrera — Efemérides. Bibliografía: Iñigo Carrera, Grau y Martí (2006).""",
        "sources": ["historiaobrera.com.ar/efemerides", "Laufer, Rodolfo — El debate Tosco-Rucci. Dos proyectos sindicales", "James, Daniel — Resistencia e integración"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/0/0d/ATosco.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/Agust%C3%ADn_Tosco",
    },

    {
        "id": "kb-efem-santiagueñazo",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["Santiagueñazo", "1993", "Santiago del Estero", "Menem", "Cavallo", "neoliberalismo", "ajuste", "Casa de Gobierno", "estallido social", "Cutral Có", "efemeride"],
        "title": "Efeméride: El Santiagueñazo — 16 de diciembre de 1993",
        "text": """EL SANTIAGUEÑAZO — 16 DE DICIEMBRE DE 1993

El 16 de diciembre de 1993, Santiago del Estero estalló. Ajuste neoliberal, corrupción, despidos — el pueblo se rebeló. Los manifestantes incendiaron la Casa de Gobierno, el Palacio de Justicia, la Legislatura y el Archivo Provincial. Al menos cuatro muertos y centenares de heridos. El gobierno nacional retrocedió en el ajuste.

El Santiagueñazo fue la primera gran fisura en la hegemonía neoliberal, precediendo los cortes de ruta de Cutral Có (1996) y el Argentinazo de 2001. Demostró que la clase trabajadora y el pueblo no eran pasivos frente al modelo. Se lo califica como un "estallido social contra el ajuste" que marcó el inicio de la resistencia al neoliberalismo.

Autor: Gonzalo Pérez Álvarez. Fuente: Historia Obrera — Efemérides. Bibliografía: Cotarelo (1999), Dargoltz/Gerez/Cao (2006), Auyero (2002).""",
        "sources": ["historiaobrera.com.ar/efemerides", "Pérez Álvarez, Gonzalo — El Santiagueñazo. Pueblo en armas contra el ajuste", "Cotarelo (1999)"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Santiague%C3%B1azo.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/Santiague%C3%B1azo",
    },

    {
        "id": "kb-efem-argentinazo",
        "tipo": "academico",
        "category": "academico",
        "tenant": "shared",
        "tags": ["Argentinazo", "2001", "De la Rúa", "Cavallo", "corralito", "cacerolazo", "19 y 20", "piqueteros", "neoliberalismo", "que se vayan todos", "efemeride"],
        "title": "Efeméride: El Argentinazo — 19 de diciembre de 2001",
        "text": """EL ARGENTINAZO — 19 Y 20 DE DICIEMBRE DE 2001

El 19 y 20 de diciembre de 2001, Argentina estalló. El freeze de depósitos ("corralito") de Cavallo detonó la rebelión. Los piqueteros ya cortaban rutas desde 1996; el paro general del 13 de diciembre fue el detonante. El 19, Plaza de Mayo y todo el país se llenó de cacerolazos. De la Rúa huyó en helicóptero a las 19:56 del 20. La consigna: "que se vayan todos."

La narrativa dominante lo redujo a una rebelión "middle-class" — pero la protagonistía obrera y popular fue central. El Argentinazo fue el clímax de diez años de resistencia al modelo neoliberal. Los piqueteros y la huelga general del 13 de diciembre fueron los precursores. La clase trabajadora y el pueblo fueron protagonistas centrales.

Autor: Gonzalo Pérez Álvarez. Fuente: Historia Obrera — Efemérides. Bibliografía: Iñigo Carrera y Cotarelo (2003), Bonnet (2002).""",
        "sources": ["historiaobrera.com.ar/efemerides", "Pérez Álvarez, Gonzalo — El Argentinazo. Clase obrera y pueblo rebelde", "Seoane, María — El Argentinazo. Crónica de un país colapsado"],
        "quotes": [],
        "grade_access": "open",
        "vigencia": "vigente",
        "image": "https://upload.wikimedia.org/wikipedia/commons/2/26/Obelisco_20Dic01.jpg",
        "imageSource": "https://es.wikipedia.org/wiki/Protestas_de_diciembre_de_2001_en_Argentina",
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

    chunks = [c for c in ALL_CHUNKS if c["id"] in chunk_ids]
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
        # Include image and source URL if available
        if chunk.get("image"):
            lines.append(f"Imagen: {chunk['image']}")
        if chunk.get("imageSource"):
            lines.append(f"Link: {chunk['imageSource']}")
        if chunk.get("pdf_url"):
            lines.append(f"PDF: {chunk['pdf_url']}")
        lines.append("")

    return "\n".join(lines)


# ===== Available PDF documents catalog =====
# Used to tell the LLM what documents exist, so it can list them when asked

DOCUMENTOS_CATALOG = {
    "convenios-colectivos": [
        {"name": "CCT 420/05", "desc": "Convenio Colectivo de Trabajo 420/05", "pdf": "/pdfs/convenios-colectivos/CCT-420-05.pdf", "tenant": "aceiteros"},
        {"name": "Paritaria acuerdo dic 2023", "desc": "Acuerdo paritario diciembre 2023", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2023-dic.pdf", "tenant": "aceiteros"},
        {"name": "Paritaria acuerdo sep 2024", "desc": "Acuerdo paritario septiembre 2024", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2024-sep.pdf", "tenant": "aceiteros"},
        {"name": "Paritaria revisión abr 2024", "desc": "Revisión paritaria abril 2024", "pdf": "/pdfs/convenios-colectivos/paritaria-revision-2024-abr.pdf", "tenant": "aceiteros"},
        {"name": "Paritaria reajuste ene 2024", "desc": "Reajuste paritario enero 2024", "pdf": "/pdfs/convenios-colectivos/paritaria-reajuste-2024-jan.pdf", "tenant": "aceiteros"},
        {"name": "Paritaria acuerdo abr 2025", "desc": "Acuerdo paritario abril 2025", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2025-abr.pdf", "tenant": "aceiteros"},
        {"name": "Paritaria acuerdo nov 2025", "desc": "Acuerdo paritario con aumentos escalonados a noviembre 2025", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2025-nov.pdf", "tenant": "aceiteros"},
        {"name": "Paritaria suma extraordinaria nov 2025", "desc": "Suma extraordinaria acordada para noviembre 2025", "pdf": "/pdfs/convenios-colectivos/paritaria-suma-extraordinaria-2025-nov.pdf", "tenant": "aceiteros"},
        {"name": "Acuerdo tercer y cuarto turno 2010", "desc": "Acuerdo de tercer y cuarto turno", "pdf": "/pdfs/convenios-colectivos/acuerdo-tercer-cuarto-turno-2010.pdf", "tenant": "aceiteros"},
        {"name": "Acta clasificación categorías 2014", "desc": "Clasificación de categorías laborales", "pdf": "/pdfs/convenios-colectivos/acta-clasificacion-categorias-2014.pdf", "tenant": "aceiteros"},
        {"name": "Actas comités mixtos 2016", "desc": "Actas de comités mixtos de salud y seguridad", "pdf": "/pdfs/convenios-colectivos/actas-comites-mixtos-2016.pdf", "tenant": "aceiteros"},
    ],
    "leyes-laborales": [
        {"name": "Ley 20744 — LCT", "desc": "Ley de Contrato de Trabajo", "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/25552/norma.htm", "source": "infoleg", "tenant": "shared"},
        {"name": "Ley 14250 — Convenciones colectivas", "desc": "Régimen de convenciones colectivas de trabajo", "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/45000-49999/46379/norma.htm", "source": "infoleg", "tenant": "shared"},
        {"name": "Ley 23551 — Asociaciones sindicales", "desc": "Régimen de asociaciones sindicales", "url": "https://servicios.infoleg.gob.ar/infolegInternet/verNorma.do?id=20993", "source": "infoleg", "tenant": "shared"},
        {"name": "Ley 23546 — Negociación colectiva", "desc": "Normas de procedimiento para negociaciones colectivas", "url": "https://servicios.infoleg.gob.ar/infolegInternet/verNorma.do?id=21112", "source": "infoleg", "tenant": "shared"},
        {"name": "Ley 24013 — Empleo", "desc": "Ley Nacional de Empleo", "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/412/texact.htm", "source": "infoleg", "tenant": "shared"},
        {"name": "Ley 24557 — Riesgos del trabajo", "desc": "Ley sobre Riesgos del Trabajo (LRT)", "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/27971/norma.htm", "source": "infoleg", "tenant": "shared"},
        {"name": "Ley 19587 — Higiene y seguridad", "desc": "Ley de Higiene y Seguridad en el Trabajo", "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/17612/norma.htm", "source": "infoleg", "tenant": "shared"},
        {"name": "Decreto 351/79 — Reglamentario Ley 19587", "desc": "Reglamentación de la Ley de Higiene y Seguridad", "url": "https://servicios.infoleg.gob.ar/infolegInternet/verNorma.do?id=32030", "source": "infoleg", "tenant": "shared"},
    ],
    "prensa-sindical": [
        {"name": "El Trabajador Aceitero y Desmotador N°5", "desc": "Noviembre 2016 — Periódico de la F.T.C.I.O.D y A.R.A.", "pdf": "/pdfs/prensa-sindical/el_trabajador_aceitero_y_desmotador_n05_noviembre_2016.pdf", "tenant": "aceiteros"},
        {"name": "El Trabajador Aceitero y Desmotador N°7", "desc": "Abril 2019 — Periódico de la F.T.C.I.O.D y A.R.A.", "pdf": "/pdfs/prensa-sindical/el_trabajador_aceitero_y_desmotador_7_abril_2019.pdf", "tenant": "aceiteros"},
    ],
}

# --- Extensiones del catálogo por tenant ---
_CATALOG_BY_TENANT = {
    "prensa": {
        "convenios-colectivos": [
            {"name": "CCT 301/75 — Prensa Escrita y Oral", "desc": "Convenio Colectivo de Prensa Escrita y Oral (Capital Federal)", "url": "https://www.sipreba.org/estatutos-y-convenios/convenio-de-prensa-escrita-y-oral-301-75/", "source": "sipreba"},
            {"name": "CCT 124/75 — Prensa Televisada", "desc": "Convenio Colectivo de Prensa Televisada (CABA y 60km)", "url": "https://www.sipreba.org/estatutos-y-convenios/convenio-de-prensa-televisada-124-75/", "source": "sipreba"},
            {"name": "CCT 541/08 — Diarios del Interior (FATPREN-ADIRA)", "desc": "Convenio Colectivo Nacional de Prensa para diarios del interior del país", "url": "https://www.sipreba.org/estatutos-y-convenios/convenio-colectivo-nacional-de-prensa-541-08/", "source": "sipreba"},
            {"name": "Escala salarial prensa escrita 2026 — Grupo 1 (Diarios, Digitales, Agencias)", "desc": "Escala salarial abril-noviembre 2026 para diarios, portales y agencias nacionales e internacionales — CCT 301/75", "url": "https://www.sipreba.org/paritarias/escala-salarial-prensa-escrita/", "source": "sipreba"},
            {"name": "Escala salarial prensa escrita 2026 — Grupo 2 (Revistas)", "desc": "Escala salarial abril-noviembre 2026 para revistas y revistas online — CCT 301/75", "url": "https://www.sipreba.org/paritarias/escala-salarial-prensa-escrita/", "source": "sipreba"},
            {"name": "Escala salarial prensa radial 2026", "desc": "Escala salarial mayo-agosto 2026 para trabajadores de radios de CABA — CCT 301/75 Rama Radio", "url": "https://www.sipreba.org/paritarias/escala-salarial-prensa-radial/", "source": "sipreba"},
        ],
        "leyes-laborales": [
            {"name": "Ley 12.908 — Estatuto del Periodista Profesional", "desc": "Estatuto del Periodista Profesional (1946) — marco legal específico del periodismo: jornada 6hs/36hs, estabilidad, indemnización especial, salario mínimo profesional, matrícula, carnet, libertad de prensa", "url": "https://servicios.infoleg.gob.ar/infolegInternet/anexos/10000-14999/11706/norma.htm", "source": "infoleg", "tenant": "prensa"},
            {"name": "Dec. Ley 13.839/46 — Estatuto del Empleado Administrativo de Empresas Periodísticas", "desc": "Estatuto del Personal Administrativo de Empresas Periodísticas (Ley 12.921) — empleados de publicidad, contaduría, circulación, expedición e intendencia", "url": "https://www.sipreba.org/estatutos-y-convenios/estatuto-del-empleado-administrativo-de-empresas-periodisticas/", "source": "sipreba", "tenant": "prensa"},
        ],
        "guia-sindical": [
            {"name": "Guía del Delegado y la Delegada SIPREBA (2024)", "desc": "Pautas gremiales, formularios, elección de comisión interna, fueros, asambleas, medidas de fuerza, licencia gremial", "url": "https://www.sipreba.org/gremial/guia-del-delegado-y-la-delegada/", "source": "sipreba"},
        ],
    },
}


def get_documentos_catalog_text(tenant: str = "aceiteros") -> str:
    """Format the documents catalog as text for system prompt injection.

    Used when the user asks about available documents/leyes/convenios.
    PDF URLs are absolute (pointing to the backend) so they work as clickable links in chat.
    Filters by tenant: shows shared documents + tenant-specific documents.
    """
    import os
    backend_url = os.getenv("APP_BACKEND_URL", "https://hornero-ia.onrender.com")
    # Remove trailing slash
    backend_url = backend_url.rstrip("/")

    # Build merged catalog: shared + tenant-specific
    # For non-aceiteros tenants, only include shared docs from the global catalog
    # (aceiteros-specific PDFs like CCT 420/05 should not appear for prensa)
    merged = {}
    for category, docs in DOCUMENTOS_CATALOG.items():
        if tenant == "aceiteros":
            # Aceiteros sees everything in the global catalog
            merged[category] = list(docs)
        else:
            # Other tenants: only docs without explicit tenant (shared) or matching tenant
            merged[category] = [d for d in docs if d.get("tenant", "shared") in ("shared", tenant)]

    # Add tenant-specific extensions
    if tenant in _CATALOG_BY_TENANT:
        for category, docs in _CATALOG_BY_TENANT[tenant].items():
            if category not in merged:
                merged[category] = []
            merged[category].extend(docs)

    # Filter prensa-sindical by tenant (if docs have tenant field)
    if "prensa-sindical" in merged:
        merged["prensa-sindical"] = [
            d for d in merged["prensa-sindical"]
            if d.get("tenant", "aceiteros") in (tenant, "shared")
        ]

    lines = ["=== DOCUMENTOS DISPONIBLES PARA CONSULTA ===", ""]
    for category, docs in merged.items():
        if category == "convenios-colectivos":
            lines.append("📋 CONVENIOS COLECTIVOS Y PARITARIAS:")
        elif category == "leyes-laborales":
            lines.append("⚖️ LEYES LABORALES:")
        elif category == "prensa-sindical":
            lines.append("📰 PRENSA SINDICAL:")
        elif category == "guia-sindical":
            lines.append("📕 GUÍA SINDICAL:")
        for doc in docs:
            if doc.get("source") == "infoleg":
                # Leyes: link directo a Infoleg
                lines.append(f"  • {doc['name']} — {doc['desc']} [Ver en Infoleg]({doc['url']})")
            elif doc.get("source") == "sipreba":
                # Documentos SiPreBA: link a sipreba.org
                lines.append(f"  • {doc['name']} — {doc['desc']} [Ver en SiPreBA]({doc['url']})")
            else:
                # PDFs locales: link al backend
                pdf_url = f"{backend_url}{doc['pdf']}"
                lines.append(f"  • {doc['name']} — {doc['desc']} [Ver PDF]({pdf_url})")
        lines.append("")
    lines.append("⚠️ REGLA OBLIGATORIA: Cuando un trabajador pregunte qué documentos o leyes hay disponibles, listá estos documentos con sus nombres y descripciones. PARA CADA DOCUMENTO, INCLUÍ SIEMPRE el enlace como link markdown — [Ver en Infoleg](url) para leyes o [Ver PDF](url) para convenios y prensa. El trabajador debe poder clickear y acceder al documento. NUNCA listes documentos sin el enlace.")
    return "\n".join(lines)


# ===== Categories metadata for UI =====

KB_CATEGORY_META = {
    "academico": {"label": "Académico", "icon": "📚", "desc": "Libros, artículos, papers, efemérides de Historia Obrera"},
    "prensa": {"label": "Prensa gremial", "icon": "📰", "desc": "Prensa oficial de cada gremio: periódicos, comunicados, volantes, editoriales, notas de opinión sindicales"},
    "noticias": {"label": "Noticias", "icon": "📋", "desc": "Noticias de actualidad y clipping: prensa comercial, agencias, medios de información"},
    "documentos": {"label": "Documentos", "icon": "📄", "desc": "Convenios, paritarias, CCT, SMVM, condiciones, org sindical"},
    "audiovisual": {"label": "Audiovisual", "icon": "🎬", "desc": "Podcasts, videos, docuficción, ilustraciones"},
}


# ===== Dynamic loading: merge manual + PDF-extracted chunks =====

def _load_pdf_chunks() -> list:
    """Load auto-extracted chunks from kb_chunks.json (PDF pipeline output).

    Assigns default tenant to PDF chunks that lack one:
    - Jasinski / La Forestal chunks → "shared"
    - All others → "aceiteros" (backward compat: existing PDFs are from aceitero sector)
    """
    json_path = os.path.join(os.path.dirname(__file__), "kb_chunks.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            pdf_chunks = json.load(f)
        # Assign default tenant to PDF chunks that lack one
        for chunk in pdf_chunks:
            if "tenant" not in chunk:
                # Jasinski / La Forestal chunks are shared history
                chunk_id = chunk.get("id", "")
                chunk_title = chunk.get("title", "")
                if "jasinski" in chunk_id.lower() or "forestal" in chunk_title.lower() or "tanino" in chunk_title.lower():
                    chunk["tenant"] = "shared"
                else:
                    chunk["tenant"] = "aceiteros"  # backward compat
        print(f"Loaded {len(pdf_chunks)} PDF-extracted chunks from {json_path}")
        return pdf_chunks
    except FileNotFoundError:
        print(f"No kb_chunks.json found at {json_path} — using only manual chunks")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing kb_chunks.json: {e}")
        return []


def get_all_chunks() -> list:
    """Return merged list: manual KB_CHUNKS + PDF-extracted chunks from kb_chunks.json.

    This is the canonical source for RAG retrieval and Archivo UI.
    """
    pdf_chunks = _load_pdf_chunks()
    return KB_CHUNKS + pdf_chunks


# ===== Lazy-loaded ALL_CHUNKS (populated on startup) =====

ALL_CHUNKS = []  # Populated by refresh() on startup


def refresh() -> int:
    """Reload ALL_CHUNKS from manual + PDF sources. Returns total chunk count.

    Uses in-place mutation (ALL_CHUNKS[:] = ...) instead of reassignment
    so that any module that imported ALL_CHUNKS directly still sees the
    updated contents — avoids stale-reference bug with Python imports.
    """
    global ALL_CHUNKS
    new_chunks = get_all_chunks()
    ALL_CHUNKS[:] = new_chunks  # in-place mutation, not reassignment
    # Update categories dynamically from all chunks
    new_categories = set(c["category"] for c in ALL_CHUNKS if c.get("category"))
    for cat in new_categories:
        if cat not in KB_CATEGORY_META:
            KB_CATEGORY_META[cat] = {"label": cat.replace("-", " ").title(), "icon": "📚", "desc": cat}
    return len(ALL_CHUNKS)
