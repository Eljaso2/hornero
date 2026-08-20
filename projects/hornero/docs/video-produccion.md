# Hornero — Lista de Producción Video

**Videos:** V1 Conducción (2 min) + V2 Delegados (5 min)
**Formato:** Híbrido (screen recordings + animaciones)

---

## 1. Assets que ya tenemos ✅

| Asset | Ubicación | Uso |
|-------|-----------|-----|
| Ilustración Compañero/a | `app/assets/personajes/a02.png` | V1 escena 5, V2 escena 3 |
| Ilustración Abogado/a | `app/assets/personajes/a03.png` | V1 escena 5, V2 escena 6 |
| Ilustración Periodista | `app/assets/personajes/a04.png` | V1 escena 5, V2 escena 5 |
| Ilustración Historiador/a | `app/assets/personajes/a01.png` | V1 escena 5, V2 escena 8 |
| Ilustración Investigador/a | `app/assets/personajes/a05.png` | V1 escena 5, V2 escena 7 |
| Logo Hornero (sin fondo) | `app/assets/hornero-logo-nobg.png` | Cierre ambos videos |
| Logo Hornero (con fondo) | `app/assets/hornero-logo.png` | Apertura |
| App funcional | GitHub Pages (deploy automático) | Todos los screen recordings |
| Clipping con 9 ediciones | `app/data/clipping-*.json` | V1 escena 4, V2 escena 4 |
| InfoMate con 2 ediciones | `app/data/mate-*.json` | V2 escena 7 |
| Brand typography/creative | `app/assets/brand-*` | Posible uso en transiciones |

---

## 2. Screen recordings a grabar 🎥

Grabar en **iPhone o simulador macOS** en 16:9. La app debe estar funcionando con el backend activo.

| # | Clip | Qué grabar | Duración | Usado en |
|---|------|-----------|----------|----------|
| SR-1 | Home | Abrir app → pantalla inicio con esferas, carrusel clipping, tira de personajes | 15 seg | V1 escena 4, V2 escena 2 |
| SR-2 | Clipping | Home → Actualidad → desplazar carrusel → abrir noticia → ver etiquetas VD/VC → ver fuente | 25 seg | V1 escena 4, V2 escena 4 |
| SR-3 | Reporte Gremial | Compañero/a → activar micrófono → hablar → ver informe generado → aprobar → Mis Informes | 45 seg | V2 escena 3 |
| SR-4 | Comunicador | Periodista → escribir "volante para paro" → ver respuesta generada | 30 seg | V2 escena 5 |
| SR-5 | Consulta Legal | Abogada → escribir pregunta sobre CCT → ver respuesta | 20 seg | V2 escena 6 |
| SR-6 | Panorama | Panorama → CE index → SMVM → IFT | 20 seg | V1 escena 3, V2 escena 7 |
| SR-7 | Historiador/a | Historiador/a → pregunta sobre efeméride → respuesta vinculada | 15 seg | V2 escena 8 |
| SR-8 | Micrófono | Close-up del botón mic en chat → activar → hablar → ver transcripción | 10 seg | V2 escena 9 |

**Total screen recordings:** ~3 minutos de footage bruto → editado a ~2 min usable

### Antes de grabar

- [ ] Verificar backend activo: `https://hornero-ia.onrender.com/api/greeting` debe responder
- [ ] Loguear como `test2` (delegada, B.b) para demo realista
- [ ] Cerrar otras apps y notificaciones del dispositivo
- [ ] Modo oscuro activado (es el default y se ve mejor en video)
- [ ] Grabar en landscape (horizontal) para 16:9

---

## 3. Animaciones a producir 🎨

| # | Animación | Descripción | Duración | Usado en | Complejidad |
|---|-----------|-------------|----------|----------|-------------|
| AN-1 | Asimetría cognitiva | Pantalla dividida: oficina empresarial (izq) vs. WhatsApp (der) | 15 seg | V1 escena 1, V2 escena 1 | Media |
| AN-2 | Foto → Película | Índice CE estático → se convierte en línea temporal con puntos que se mueven | 10 seg | V1 escena 3, V2 escena 7 | Alta — **pieza clave** |
| AN-3 | 5 personajes | Ilustraciones entran una por una con nombre y rol | 15 seg | V1 escena 5 | Baja |
| AN-4 | Capas aditivas | Relato base → capas translúcidas de corrección se suman | 8 seg | V1 escena 6, V2 escena 9 | Baja |
| AN-5 | Soberanía | Íconos Google/Apple/Meta tachados + bandera argentina + VPS | 10 seg | V1 escena 7, V2 escena 10 | Baja |
| AN-6 | Acceso por grados | 4 círculos concéntricos: B.a → B.b → B.c → B.d | 5 seg | V1 escena 7, V2 escena 10 | Baja |
| AN-7 | Investigación → trabajador | Paper → Historiador/a → celular del delegado | 15 seg | V2 escena 8 | Media |
| AN-8 | Logo + slogan | Logo centrado + "El futuro, algo por lo que hay que luchar" aparece | 8 seg | V1 escena 8, V2 escena 11 | Baja |
| AN-9 | Convergencia | Fragmentos dispersos → celular (apertura Hornero) | 8 seg | V2 escena 2 | Baja |

**Total animaciones:** ~94 seg → compartidas entre V1 y V2

### Producción de animaciones

**Opción A — Canva (más fácil):**
- Canva tiene plantillas de video con motion graphics
- Importar ilustraciones PNG de personajes
- Líneas temporales y transiciones disponibles
- Exportar como MP4 1080p
- Gratuito para uso básico

**Opción B — Figma + plugin (más control):**
- Diseñar cada frame en Figma
- Usar plugin "Smart Animate" o "Figma to Video"
- Más control visual, más tiempo

**Opción C — Código (para AN-2, la pieza clave):**
- AN-2 "Foto → Película" se puede hacer como HTML/CSS/JS animado y screen-grabear
- Permite iterar rápido, texto real, datos reales del índice
- Luego grabar la pantalla del navegador

---

## 4. Voz en off 🎙️

Dos grabaciones separadas:

| Versión | Duración estimada | Palabras | Tono |
|---------|-------------------|----------|------|
| V1 Conducción | ~2 min | ~300 | Estratégico, directo |
| V2 Delegados | ~5 min | ~750 | Compañero, operativo |

### Cómo grabar

- **Micrófono:** cualquier grabadora de celular en ambiente silencioso sirve. Para mejor calidad: mic USB (Blue Yeti, etc.)
- **Formato:** WAV o MP3, 44.1kHz mono
- **Ritmo:** leer con pausas naturales. ~150 palabras/minuto. Respirar entre frases.
- **Probar antes:** leer el guión completo con cronómetro para verificar duración
- **Toma múltiple:** grabar 2-3 tomas de cada sección, elegir la mejor en edición

### Alternativa: IA de voz

Si no querés grabar vos, se puede usar:
- **ElevenLabs** (mejor calidad, pago): clonar tu voz o elegir voz en español argentino
- **OpenAI TTS** (bueno, más económico): voces naturales en español
- **Warning:** la voz IA no tiene la cadencia natural del sindicalismo argentino. Si se nota que es IA, pierde credibilidad ante la audiencia.

---

## 5. Música y efectos 🎵

| Tipo | Qué buscar | Dónde | Libre de derechos |
|------|-----------|-------|-------------------|
| Música base | "Documentary minimal", "inspiring subtle" | Pixabay, Free Music Archive, Incompetech | Sí |
| Efectos: oficina | Teclado, reunión, teléfono | Freesound.org | Sí (atribución) |
| Efectos: planta | Máquinas, voces lejanas | Freesound.org | Sí |
| Efectos: app | Swipe, click, notificación | Freesound.org | Sí |
| Efectos: transición | Whoosh, riser | Pixabay | Sí |

**Criterio musical:** la música acompaña, no compite. Sin épica, sin corporativa. Algo que suene a documento honesto, no a spot publicitario.

---

## 6. Herramientas de edición 🛠️

| Herramienta | Costo | Nivel | Nota |
|-------------|-------|-------|------|
| **DaVinci Resolve** | Gratis | Alto | Profesional, curva de aprendizaje, pero gratis y potente |
| **iMovie** | Gratis | Bajo | Simple, suficiente para este proyecto |
| **CapCut** | Gratis | Medio | Bueno para textos animados y efectos rápidos |
| **Premiere Pro** | Pago | Alto | Estándar, pero innecesario para esto |

**Recomendación:** DaVinci Resolve si querés control total; CapCut si querés velocidad.

---

## 7. Plan de producción (orden de trabajo)

### Semana 1: Preparación
- [ ] Probar backend activo
- [ ] Loguear como test2 y verificar que todos los chats responden
- [ ] Preparar guiones finales (leer en voz alta con cronómetro)
- [ ] Descargar música y efectos de sonido

### Semana 2: Grabación
- [ ] Grabar 8 screen recordings (SR-1 a SR-8)
- [ ] Grabar voz en off V1 y V2
- [ ] Revisar footage y seleccionar mejores tomas

### Semana 3: Animación
- [ ] Producir AN-1 a AN-9 (prioridad: AN-2 "foto → película")
- [ ] Exportar como MP4 1080p

### Semana 4: Edición
- [ ] Armar V1 en timeline
- [ ] Armar V2 en timeline
- [ ] Ajustar ritmos, cortes, música
- [ ] Exportar: 16:9 (YouTube/reunión) + 9:16 (WhatsApp)
- [ ] Revisión final: leer guión mientras se ve el video para verificar sincro

---

## 8. Formatos de salida

| Formato | Resolución | Uso |
|---------|-----------|------|
| 16:9 landscape | 1920×1080 | YouTube, proyección en reunión, pantalla grande |
| 9:16 vertical | 1080×1920 | WhatsApp, Instagram Stories, Telegram |
| Square 1:1 | 1080×1080 | Instagram feed, LinkedIn |

Exportar en H.264, bitrate ~10 Mbps, audio AAC 256 kbps.
