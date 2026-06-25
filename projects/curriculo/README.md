# Proyecto Currículo — Dr. Alejandro Jasinski

Repositorio centralizado de datos curriculares para generar CV a pedido según el destino (becas, postulaciones académicas, consultorías, prensa, etc.).

---

## 📂 Estructura

```
curriculo/
├── README.md                    ← Este archivo (instrucciones de uso)
├── reservorio/                  ← Datos fuente (CV completos convertidos a .md)
│   ├── 01-repositorio-completo.md    ← CV Repositorio (el más completo, dic 2024)
│   ├── 02-cv-largo-2025.md           ← CV Largo 2025
│   ├── 03-cv-corto-2025.md           ← CV Corto / Abreviado 2025
│   ├── 04-cv-actualizado-2026.md     ← CV actualizado 2026 (Konstanz, Zapallar, etc.)
│   └── 05-guia-perfiles-digitales-2026.md ← Guía de perfiles académicos (Google Scholar, ORCID, LinkedIn, etc.)
├── templates/                   ← Plantillas de CV por tipo de destino
│   ├── academico.md              ← Plantilla CV académico completo (conferencias, jurado, referee)
│   ├── profesional.md            ← Plantilla CV profesional (consultoría, DDHH, Estado)
│   ├── corto.md                  ← Plantilla CV abreviado (1-2 páginas)
│   ├── becas.md                  ← Plantilla CV para postulación a becas
│   └── perfil-digital.md         ← Plantilla para perfiles online (LinkedIn, ORCID, Academia.edu)
└── cv-generados/                ← CV generados a pedido (se crean cuando se necesita)
    └ (vacío — se llena con cada CV armado)
```

---

## 🗂️ Reservorio: datos fuente

| Archivo | Contenido | Actualización |
|---------|-----------|---------------|
| `01-repositorio-completo.md` | El CV más extenso: todo el detalle de publicaciones, conferencias, entrevistas, docencia secundaria, experiencia periodística. | Dic 2024 |
| `02-cv-largo-2025.md` | Versión larga con más detalle que el cortó pero menos que el repositorio. Bilingüe (es/en). | Dic 2024→2025 |
| `03-cv-corto-2025.md` | Versión abreviada: educación, inserción institucional (selección), publicaciones (selección), conferencias (selección), idiomas. | Dic 2024→2025 |
| `04-cv-actualizado-2026.md` | Versión más actualizada: incluye Konstanz (2026), Zapallar (2026), seminario permanente, docencia en grado. | Feb 2026 |
| `05-guia-perfiles-digitales-2026.md` | Guía paso a paso para configurar Google Scholar, ORCID, Academia.edu, ResearchGate, LinkedIn. Incluye textos listos para copiar. | Feb 2026 |

**Fuente original:** `/Users/eljaso/Documents/Currículos/` (archivos .docx)

---

## 🔧 Cómo generar un CV a pedido

### Flujo de trabajo

1. **Identificar el destino**: ¿Para qué se necesita el CV? (beca CONICET, postulación internacional, consultoría, ponencia, prensa, etc.)
2. **Elegir la plantilla base**: Ver sección "Plantillas" abajo.
3. **Completar con datos del reservorio**: Tomar los bloques relevantes del `04-cv-actualizado-2026.md` (la versión más actual) y complementar con detalle del `01-repositorio-completo.md` si se necesita más profundidad.
4. **Guardar en `cv-generados/`**: Nombrar el archivo con fecha y destino, e.g. `2026-06-beca-conicet.md`, `2026-07-konstanz-visiting.md`.
5. **Exportar**: Convertir a .docx o PDF según necesidad (usar `textutil`, `pandoc`, o copiar a Google Docs/Word).

### Ejemplo rápido

```
"Necesito un CV para postular a una beca de investigación en Alemania"
→ Usar plantilla templates/becas.md
→ Completar con datos de reservorio/04-cv-actualizado-2026.md
→ Guardar en cv-generados/2026-07-beca-alemania.md
→ Pedir a Claude que lo genere
```

---

## 📋 Plantillas disponibles

### 1. `academico.md` — CV Académico Completo
Destino: postulaciones académicas, concursos universitarios, evaluaciones CONICET.
Secciones: Datos personales, Perfil, Formación, Inserción institucional, Docencia, Publicaciones (todas), Evaluación académica, Conferencias/paneles, Seminarios cursados, Idiomas, Membresías, Distinciones.

### 2. `profesional.md` — CV Profesional
Destino: consultorías, organismos de DDHH, Estado, ONGs internacionales.
Secciones: Datos personales, Resumen profesional, Experiencia laboral (SDH, Tricontinental), Investigaciones aplicadas (informes judiciales), Publicaciones relevantes, Idiomas, Contacto.

### 3. `corto.md` — CV Abreviado (1-2 páginas)
Destino: ponencias, coloquios, reuniones, presentaciones rápidas.
Secciones: Datos personales, Educación, Inserción institucional (selección), Publicaciones (selección: 2 libros + 3 artículos), Idiomas.

### 4. `becas.md` — CV para Becas
Destino: CONICET, Fulbright, DAAD, estancias internacionales.
Secciones: Datos personales, Formación (detallada con calificaciones), Plan de investigación, Antecedentes investigativos, Publicaciones (todas), Docencia, Evaluación académica, Idiomas (certificaciones), Referencias.

### 5. `perfil-digital.md` — Perfil Online
Destino: LinkedIn, ORCID, Academia.edu, ResearchGate, Google Scholar.
Secciones: Nombre, Afiliación, Bio (español e inglés), Palabras clave, URLs. Textos listos para copiar y pegar.

---

## ⚡ Comandos útiles

```bash
# Convertir un .md a .docx (requiere pandoc)
pandoc cv-generados/2026-06-beca-conicet.md -o cv-generados/2026-06-beca-conicet.docx

# Convertir con textutil (macOS, formato más simple)
textutil -convert docx cv-generados/2026-06-beca-conicet.md -output cv-generados/2026-06-beca-conicet.docx

# Buscar una sección específica en el reservorio
grep -n "Publicaciones" reservorio/04-cv-actualizado-2026.md
```

---

## 📝 Notas

- El archivo **más actualizado** es `04-cv-actualizado-2026.md` — siempre usar ese como base.
- El **repositorio completo** (`01-repositorio-completo.md`) tiene el mayor nivel de detalle (conferencias por ciudad, experiencia periodística, entrevistas recibidas) — usar cuando se necesita profundidad.
- La **Guía de Perfiles** (`05-guia-perfiles-digitales-2026.md`) es independiente: textos listos para copiar en plataformas online.
- Los archivos originales .docx siguen en `/Users/eljaso/Documents/Currículos/` — no se modifican.

---

*Proyecto creado: junio 2026*
