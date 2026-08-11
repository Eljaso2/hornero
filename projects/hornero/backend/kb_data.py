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
    # --- ORGANIZACIÓN ---
    {
        "id": "kb-org-federacion",
        "tipo": "documento",
        "category": "documentos",
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
        "tags": ["Guaycurú", "desmotadora", "algodon", "planta auxiliar", "trabajadores temporales", "polvo algodon", "EPP", "Chaco", "condiciones"],
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
        "category": "documentos",
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
        "category": "documentos",
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
        "category": "documentos",
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

    # --- CONDICIONES ---
    {
        "id": "kb-condiciones-2026",
        "tipo": "documento",
        "category": "documentos",
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
        "category": "academico",
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

    # --- DISCURSOS CREMONTE ---
    {
        "id": "kb-discursos-cremonte",
        "tipo": "academico",
        "category": "academico",
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

    # --- JASINSKI: El encanto del tanino (La Forestal) ---
    {
        "id": "kb-jasinski-forestal-fenomeno",
        "tipo": "academico",
        "category": "academico",
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
        "id": "kb-jasinski-sindicalismo",
        "tipo": "academico",
        "category": "documentos",
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

    # ===== EFEMÉRIDES DE HISTORIA OBRERA =====

    {
        "id": "kb-efem-1-mayo",
        "tipo": "academico",
        "category": "academico",
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
        {"name": "CCT 420/05", "desc": "Convenio Colectivo de Trabajo 420/05", "pdf": "/pdfs/convenios-colectivos/CCT-420-05.pdf"},
        {"name": "Paritaria acuerdo dic 2023", "desc": "Acuerdo paritario diciembre 2023", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2023-dic.pdf"},
        {"name": "Paritaria acuerdo sep 2024", "desc": "Acuerdo paritario septiembre 2024", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2024-sep.pdf"},
        {"name": "Paritaria revisión abr 2024", "desc": "Revisión paritaria abril 2024", "pdf": "/pdfs/convenios-colectivos/paritaria-revision-2024-abr.pdf"},
        {"name": "Paritaria reajuste ene 2024", "desc": "Reajuste paritario enero 2024", "pdf": "/pdfs/convenios-colectivos/paritaria-reajuste-2024-jan.pdf"},
        {"name": "Paritaria acuerdo abr 2025", "desc": "Acuerdo paritario abril 2025", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2025-abr.pdf"},
        {"name": "Paritaria acuerdo nov 2026", "desc": "Acuerdo paritario noviembre 2026", "pdf": "/pdfs/convenios-colectivos/paritaria-acuerdo-2026-nov.pdf"},
        {"name": "Paritaria suma extraordinaria nov 2026", "desc": "Suma extraordinaria noviembre 2026", "pdf": "/pdfs/convenios-colectivos/paritaria-suma-extraordinaria-2026-nov.pdf"},
        {"name": "Acuerdo tercer y cuarto turno 2010", "desc": "Acuerdo de tercer y cuarto turno", "pdf": "/pdfs/convenios-colectivos/acuerdo-tercer-cuarto-turno-2010.pdf"},
        {"name": "Acta clasificación categorías 2014", "desc": "Clasificación de categorías laborales", "pdf": "/pdfs/convenios-colectivos/acta-clasificacion-categorias-2014.pdf"},
        {"name": "Actas comités mixtos 2016", "desc": "Actas de comités mixtos de salud y seguridad", "pdf": "/pdfs/convenios-colectivos/actas-comites-mixtos-2016.pdf"},
    ],
    "leyes-laborales": [
        {"name": "Ley 20744 — LCT", "desc": "Ley de Contrato de Trabajo", "pdf": "/pdfs/leyes-laborales/ley-20744-LCT.pdf"},
        {"name": "Ley 14250 — Convenciones colectivas", "desc": "Régimen de convenciones colectivas de trabajo", "pdf": "/pdfs/leyes-laborales/ley-14250-convenciones-colectivas.pdf"},
        {"name": "Ley 23551 — Asociaciones sindicales", "desc": "Régimen de asociaciones sindicales", "pdf": "/pdfs/leyes-laborales/ley-23551-asociaciones-sindicales.pdf"},
        {"name": "Ley 23546 — Negociación colectiva", "desc": "Negociación colectiva laboral", "pdf": "/pdfs/leyes-laborales/ley-23546-negociacion-colectiva.pdf"},
        {"name": "Ley 24013 — Empleo", "desc": "Ley Nacional de Empleo", "pdf": "/pdfs/leyes-laborales/ley-24013-empleo.pdf"},
        {"name": "Ley 24557 — Accidentes de trabajo", "desc": "Riesgos del trabajo y accidentes laborales", "pdf": "/pdfs/leyes-laborales/ley-24557-accidentes-trabajo.pdf"},
        {"name": "Ley 19587 + Dec 351/79 — Higiene y seguridad", "desc": "Higiene y seguridad en el trabajo", "pdf": "/pdfs/leyes-laborales/ley-19587-higiene-seguridad-Dec351-79.pdf"},
    ],
}


def get_documentos_catalog_text() -> str:
    """Format the documents catalog as text for system prompt injection.

    Used when the user asks about available documents/leyes/convenios.
    PDF URLs are absolute (pointing to the backend) so they work as clickable links in chat.
    """
    import os
    backend_url = os.getenv("APP_BACKEND_URL", "https://hornero-ia.onrender.com")
    # Remove trailing slash
    backend_url = backend_url.rstrip("/")

    lines = ["=== DOCUMENTOS DISPONIBLES PARA CONSULTA ===", ""]
    for category, docs in DOCUMENTOS_CATALOG.items():
        if category == "convenios-colectivos":
            lines.append("📋 CONVENIOS COLECTIVOS Y PARITARIAS:")
        elif category == "leyes-laborales":
            lines.append("⚖️ LEYES LABORALES:")
        for doc in docs:
            pdf_url = f"{backend_url}{doc['pdf']}"
            lines.append(f"  • {doc['name']} — {doc['desc']} [Ver PDF]({pdf_url})")
        lines.append("")
    lines.append("⚠️ REGLA OBLIGATORIA: Cuando un trabajador pregunte qué documentos o leyes hay disponibles, listá estos documentos con sus nombres y descripciones. PARA CADA DOCUMENTO, INCLUÍ SIEMPRE el enlace PDF como link markdown [Ver PDF](url) — el trabajador debe poder clickear y acceder al documento. NUNCA listes documentos sin el enlace PDF.")
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
    """Load auto-extracted chunks from kb_chunks.json (PDF pipeline output)."""
    json_path = os.path.join(os.path.dirname(__file__), "kb_chunks.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            pdf_chunks = json.load(f)
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
