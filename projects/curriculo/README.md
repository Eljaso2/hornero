# Proyecto Currículo — Dr. Alejandro Jasinski

Repositorio centralizado de datos curriculares para generar CV a pedido según el destino (becas, postulaciones académicas, consultorías, prensa, etc.).

---

## 📂 Estructura

```
curriculo/
├── README.md                    ← Este archivo (instrucciones de uso y workflow)
├── reservorio/                  ← Datos fuente
│   ├── 01-repositorio-completo.md    ← CV Repositorio (acumulativo, el más completo)
│   ├── 02-cv-actualizado.md          ← CV Actualizado (versión en uso, siempre al día)
│   └── 05-guia-perfiles-digitales-2026.md ← Guía de perfiles académicos (Google Scholar, ORCID, LinkedIn, etc.)
├── templates/                   ← Plantillas de CV por tipo de destino
│   ├── academico.md              ← Plantilla CV académico completo
│   ├── profesional.md            ← Plantilla CV profesional (consultoría, DDHH, Estado)
│   ├── corto.md                  ← Plantilla CV abreviado (1-2 páginas)
│   ├── becas.md                  ← Plantilla CV para postulaciones a becas
│   └── perfil-digital.md         ← Plantilla para perfiles online (LinkedIn, ORCID, etc.)
└── cv-generados/                ← CV generados a pedido (se crean cuando se necesita)
```

---

## 🗂️ Reservorio: los dos CV clave

| Archivo | Rol | Uso |
|---------|-----|------|
| `01-repositorio-completo.md` | **Acumulativo** — registro total de todo lo hecho. No se elimina nada; solo se agrega. | Consulta de profundidad, armado de CV específicos, referencia histórica. |
| `02-cv-actualizado.md` | **En uso** — versión presentable y al día. Se actualiza agregando lo importante. | Base para generar CV a pedido, consultas rápidas, lo que se usa por lo general. |

> **Nota:** `05-guia-perfiles-digitales-2026.md` es una guía independiente (textos listos para copiar en plataformas). No es un CV, pero se mantiene como referencia.

---

## ⚡ Workflow: agregar datos nuevos

Cuando Alejandro hace algo nuevo (publicación, conferencia, cargo, etc.), indica cómo se registra:

### Opción A — «Agregalo a Repositorio + CV actualizado»
→ Se agrega el dato **a ambos archivos**: `01-repositorio-completo.md` y `02-cv-actualizado.md`.
→ Se usa cuando el dato es **importante**: nuevo cargo, nueva publicación, nuevo proyecto de investigación, distinción, etc.

### Opción B — «Agregalo sólo al Repositorio»
→ Se agrega el dato **solo a** `01-repositorio-completo.md`.
→ Se usa cuando el dato **no es tan importante** pero se quiere que quede el registro: conferencia menor, participación en panel, nota de prensa breve, etc.
→ Si después se necesita armar un CV específico, se consulta el Repositorio y se incluye lo relevante.

### Para armar un CV puntual
→ Se toma `02-cv-actualizado.md` como base y se adapta según la plantilla elegida.
→ Si se necesita más detalle, se consulta `01-repositorio-completo.md`.
→ Se guarda en `cv-generados/` con fecha y destino (e.g. `2026-07-beca-conicet.md`).

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

## 🔧 Comandos útiles

```bash
# Convertir un .md a .docx (requiere pandoc)
pandoc cv-generados/2026-07-beca-conicet.md -o cv-generados/2026-07-beca-conicet.docx

# Convertir con textutil (macOS, formato más simple)
textutil -convert docx cv-generados/2026-07-beca-conicet.md -output cv-generados/2026-07-beca-conicet.docx

# Buscar una sección específica en el reservorio
grep -n "Publicaciones" reservorio/02-cv-actualizado.md
```

---

## 📝 Reglas

- **Solo dos CV clave** en el reservorio: Repositorio (acumulativo) y Actualizado (en uso). No se crean versiones intermedias.
- **El Repositorio nunca se elimina contenido** — solo se agrega.
- **El Actualizado se mantiene al día** — se agrega lo importante y se actualiza información existente si cambia.
- Los archivos originales .docx siguen en `/Users/eljaso/Documents/Currículos/` — no se modifican.
- Los CV generados a pedido se guardan en `cv-generados/` y se pueden eliminar cuando ya no se necesitan.

---

*Proyecto creado: junio 2026 · Reorganizado: julio 2026*
