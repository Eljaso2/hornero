# Sesión 2026-08-25 — Reorganización del proyecto Hornero

**Duración:** ~2 horas
**Estado:** Completada, con pendientes

---

## Qué hicimos

### 1. Entender la estructura del proyecto
Arrancamos mapeando las 5 carpetas y 3 archivos de `app/`, luego `backend/`, y finalmente `docs/` (que era la que necesitaba reorganización).

### 2. Decisiones de diseño
- `docs/` → **`biblioteca/`** (la biblioteca: fuentes + chunks + curación)
- Documentación del proyecto → **`taller/`** (fundación, planes, comunicación, sesiones)
- Chunks monolíticos → **por fuente** (cada `.chunks.json` junto a su PDF/MD)
- El backend lee chunks de `biblioteca/fuentes/` en vez de `backend/kb_chunks.json`
- Feedback se reorganiza: `visual/` (screenshots) + `ia/` (transcripciones de chat)
- ICE: 4 archivos → 1 solo `sistema-ice.md` (en progreso, agent falló)

### 3. Reorganización ejecutada (8 commits)

| Commit | Qué |
|--------|-----|
| `8fe9d0b` | Script `split_monolith.py` |
| `2deb15c` | 3.678 chunks → 21 archivos `.chunks.json` per-source |
| `11a3607` | `kb_data.py` lee per-source en vez del monolito |
| `02164e6` | Eliminado `kb_chunks.json` (11 MB) + relicto `.chunks/` |
| `05a0459` | `docs/` → `biblioteca/` + `taller/` creado |
| `eb022d5` | Scripts de backend actualizados |
| `8debc95` | CATALOGOs actualizados |
| `5639c38` | Feedback reorganizado + `rag/` eliminado |

### 4. .gitignore actualizado
- `*.db` (SQLite runtime) — des-trackeados `chat_history.db` e `informes.db`
- `.DS_Store` (macOS)

---

## Estructura final

```
hornero/
├── app/              ← frontend PWA
├── backend/          ← servidor Python (lee chunks de biblioteca/)
├── biblioteca/       ← LA BIBLIOTECA
│   ├── fuentes/      ← textos, leyes, PDFs, .chunks.json por fuente
│   └── curacion/     ← guías de curación (era docs/biblioteca/)
├── taller/           ← DOCUMENTACIÓN DEL PROYECTO
│   ├── fundacion/    ← diseño conceptual y arquitectura
│   ├── planes/       ← planes, núcleos, ICE
│   ├── comunicacion/ ← guías de construcción EN/ES
│   └── sesiones/     ← conversaciones guardadas
├── feedback/
│   ├── visual/       ← screenshots de bugs (23 PNGs)
│   └── ia/           ← transcripciones de prueba de IA
└── promo/            ← demos, presentaciones, video pitch
```

---

## Pendientes

### Merge ICE (en progreso cuando se cortó)
- 4 archivos ICE → 1 `taller/planes/sistema-ice.md`
- Base copiada (sistema-etiquetado-ice.md), sección Núcleo 11 agregada
- Falta: agregar tipología detallada (códigos D-1a etc.), fórmula del índice, espectro BHR
- Luego eliminar los 4 originales

### Organizar la biblioteca (próximo paso)
- Fuentes sin carpeta propia: jasinski, lorca, vogelmann (tienen .chunks.json pero no PDF/MD)
- Chunks manuales en kb_data.py (30 chunks: Cremonte, Yofra, SIPREBA, efemérides) — migrar a JSON
- CATALOGO.md desactualizado (referencia kb_chunks.json monolítico)
- INVENTARIO.md — posible duplicación con CATALOGO.md
- entrevistas-discursos/ sin índice ni catálogo
- prensa-sindical/ sin catálogo

### Limpieza menor
- `taller/planes/.DS_Store` eliminar
- Feedback README actualizar (ahora tiene subcarpetas visual/ia)
- 6 planes esqueleto vacío (<60 líneas): decidir si se eliminan o completan

---

## Cómo funciona el backend ahora

```python
# kb_data.py — _load_pdf_chunks() escanea:
fuentes_dir = "biblioteca/fuentes/"
# Lee todos los *.chunks.json recursivamente
# get_all_chunks() = KB_CHUNKS (manual, 36) + pdf_chunks (3,678)
# ALL_CHUNKS = 3,714 total
```
