#!/usr/bin/env python3
"""
Transforma la Guía del Delegado SIPREBA (MD) en chunks para el RAG.
Cada ley/estatuto/CCT se procesa como unidad independiente,
dividiendo por artículo para citación precisa.
"""

import json
import os
import re

MD_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "biblioteca", "fuentes", "prensa-sindical", "SIPREBA-guia-delegado", "2024-guia-del-delegado-sipreba.md")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "biblioteca", "fuentes", "prensa-sindical", "SIPREBA-guia-delegado", "sipreba-guia-delegado.chunks.json")

# ── Definición de las unidades legislativas ──
# start_marker / end_marker: texto único que aparece en el MD
LAWS = [
    {
        "id_prefix": "prensa-ley12908",
        "title": "Ley 12.908 — Estatuto del Periodista Profesional",
        "tipo": "ley",
        "norma": "Ley 12.908",
        "tags": ["estatuto del periodista", "Ley 12.908", "periodista profesional", "jornada 36hs", "estabilidad", "salario mínimo", "matrícula", "carnet profesional", "indemnización especial", "libertad de prensa", "previsión", "vacaciones", "horas extras", "despido", "preaviso", "enfermedad inculpable", "accidente trabajo", "comisiones paritarias"],
        "vigencia": "vigente",
        "capa": "sectorial",
        # El Art. 1º) está antes del heading de MATRICULA en el MD
        "start_marker": "Art. 1º)– Quedan comprendidos",
        "end_marker": "(Dec. Ley 13.839/46, ratificado por la ley 12.291",
    },
    {
        "id_prefix": "prensa-dec13839",
        "title": "Dec. Ley 13.839/46 — Estatuto del Empleado Administrativo de Empresas Periodísticas (Ley 12.921)",
        "tipo": "ley",
        "norma": "Dec. Ley 13.839/46 (Ley 12.921)",
        "tags": ["empleado administrativo", "estatuto administrativo", "Dec. Ley 13.839", "Ley 12.921", "escalafón administrativo", "intendencia", "jornada 6.30hs", "preaviso", "indemnización", "cadete", "ayudante", "capataz"],
        "vigencia": "vigente",
        "capa": "sectorial",
        "start_marker": "(Dec. Ley 13.839/46, ratificado por la ley 12.291",
        "end_marker": "Convenio de Prensa Escrita y Oral Nº 301/75",
    },
    {
        "id_prefix": "prensa-cct301",
        "title": "CCT 301/75 — Convenio Colectivo de Prensa Escrita y Oral",
        "tipo": "cct",
        "norma": "CCT 301/75",
        "tags": ["CCT 301/75", "prensa escrita", "prensa oral", "radio", "escalafón periodístico", "escalafón administrativo", "vacaciones", "licencias", "antigüedad", "bonificación", "vale de comida", "horas extras", "reemplazos", "categorización", "higiene seguridad", "formación profesional", "carteleras gremiales", "vacantes promociones"],
        "vigencia": "vigente",
        "capa": "sectorial",
        "start_marker": "Convenio de Prensa Escrita y Oral Nº 301/75",
        "end_marker": "Convenio de Prensa Televisada Nº 124/75",
    },
    {
        "id_prefix": "prensa-cct124",
        "title": "CCT 124/75 — Convenio de Prensa Televisada",
        "tipo": "cct",
        "norma": "CCT 124/75",
        "tags": ["CCT 124/75", "prensa televisada", "noticiero TV", "televisión", "cámaras", "compaginación", "auriconista", "redactor TV", "licencias TV", "horas extras TV", "misión riesgosa", "viajes servicio", "bonificación título", "salario móvil", "laboratorio", "archivo TV", "escalafón TV"],
        "vigencia": "vigente",
        "capa": "sectorial",
        "start_marker": "Convenio de Prensa Televisada Nº 124/75",
        "end_marker": "Convenio Colectivo Nacional de los trabajadores de Prensa N° 541/08",
    },
    {
        "id_prefix": "prensa-cct541",
        "title": "CCT 541/08 — Convenio Colectivo Nacional de Prensa (FATPREN-ADIRA, diarios del interior)",
        "tipo": "cct",
        "norma": "CCT 541/08",
        "tags": ["CCT 541/08", "FATPREN", "ADIRA", "diarios del interior", "prensa gráfica interior", "escalafón interior", "zona desfavorable", "zona patagónica", "adicional por título", "espacios de cuidados", "día del trabajador de prensa", "comisión paritaria", "corresponsal"],
        "vigencia": "vigente",
        "capa": "sectorial",
        # El contenido real empieza con "PARTES CONTRATANTES" y la mención de FATPREN/ADIRA
        "start_marker": "PARTES CONTRATANTES:Representación sindical",
        "end_marker": "Convocatoria a Asambleas",  # Inicio de la guía práctica
    },
    {
        "id_prefix": "prensa-guia-delegados",
        "title": "Guía del Delegado y la Delegada SIPREBA — Pautas gremiales y formularios",
        "tipo": "guia_sindical",
        "norma": "Guía SIPREBA 2024",
        "tags": ["guía del delegado", "SIPREBA", "comisión interna", "elección delegados", "fueros gremiales", "asamblea", "medida de fuerza", "paro", "notificación empresa", "licencia gremial", "formularios", "nota a empresa", "tutela sindical"],
        "vigencia": "vigente",
        "capa": "sectorial",
        "start_marker": "Convocatoria a Asambleas",
        "end_marker": None,  # hasta el final
    },
]


def extract_law_text(full_text, law_def):
    """Extrae el texto de una unidad legislativa del documento completo."""
    start_idx = full_text.find(law_def["start_marker"])
    if start_idx == -1:
        # Intentar buscar sin ##
        alt = law_def["start_marker"].replace("## ", "")
        start_idx = full_text.find(alt)
        if start_idx == -1:
            print(f"  ⚠️ No encontré marker de inicio: {law_def['start_marker'][:60]}")
            return None

    # Retroceder para capturar el título de la ley (máx 500 chars antes del marker)
    preamble_start = max(0, start_idx - 500)
    # Buscar hacia atrás un salto de línea + texto que parezca título
    pre_text = full_text[preamble_start:start_idx]
    # Si hay "Estatuto del Periodista" o similar antes, capturarlo
    for title_hint in ["Estatuto del Periodista", "Estatuto del empleado", "Convenio", "Guía"]:
        idx = pre_text.rfind(title_hint)
        if idx != -1:
            preamble_start = preamble_start + idx
            break

    start_idx = preamble_start

    # Buscar el final
    if law_def.get("end_marker"):
        end_idx = full_text.find(law_def["end_marker"], start_idx + 100)
        if end_idx == -1:
            end_idx = len(full_text)
    else:
        end_idx = len(full_text)

    return full_text[start_idx:end_idx].strip()


def split_by_articles(text, id_prefix, law_info):
    """
    Divide el texto de una ley/CCT en chunks por artículo.
    El MD extraído del PDF tiene líneas corridas sin \\n antes de Art.
    así que usamos finditer para ubicar cada artículo.
    """
    chunks = []

    # Patrón para detectar artículos:
    # "Art. 1º)" / "Art. 10º)–" / "Artículo 1º:" / "Artículo 55º"
    article_pattern = re.compile(
        r'(?:Art\.?\s*\d+[º°]\)?|Artículo\s+\d+[º°]?\)?)'
    )

    matches = list(article_pattern.finditer(text))

    if not matches:
        # Sin artículos → chunk por tamaño ~400 palabras
        words = text.split()
        chunk_idx = 0
        for i in range(0, len(words), 400):
            chunk_text = " ".join(words[i:i+400])
            chunk_idx += 1
            chunks.append({
                "id": f"{id_prefix}-sec{chunk_idx}",
                "articulo": f"sección {chunk_idx}",
                "text": chunk_text,
            })
        return chunks

    # Preamble: texto antes del primer artículo
    preamble = text[:matches[0].start()].strip()
    chunk_idx = 0

    if len(preamble) > 80:
        chunk_idx += 1
        chunks.append({
            "id": f"{id_prefix}-preamble",
            "articulo": "preámbulo",
            "text": preamble[:3000],
        })

    # Cada artículo = texto desde este match hasta el siguiente
    for i, match in enumerate(matches):
        art_text = match.group()
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()

        # Extraer número de artículo
        art_match = re.match(
            r'(?:Art\.?\s*|Artículo\s+)(\d+)[º°]?\)?',
            art_text, re.IGNORECASE
        )
        art_num = art_match.group(1) if art_match else str(i + 1)

        chunk_idx += 1
        chunks.append({
            "id": f"{id_prefix}-art{art_num}",
            "articulo": f"Art. {art_num}",
            "text": content[:5000],
        })

    return chunks


def main():
    # Verificar que el MD fuente existe
    if not os.path.exists(MD_PATH):
        print(f"❌ No encuentro el MD fuente en: {MD_PATH}")
        print(f"   Los 423 chunks SIPREBA ya están en kb_chunks.json (cargados manualmente).")
        print(f"   Si necesitás regenerar, colocá el MD en esa ruta y re-ejecutá.")
        return

    # Leer MD
    with open(MD_PATH, 'r', encoding='utf-8') as f:
        full_text = f.read()

    print(f"📄 MD cargado: {len(full_text):,} caracteres")

    all_chunks = []

    for law_def in LAWS:
        print(f"\n⚖️ Procesando: {law_def['title']}")

        law_text = extract_law_text(full_text, law_def)
        if not law_text:
            continue

        print(f"   Texto extraído: {len(law_text):,} caracteres")

        chunks = split_by_articles(law_text, law_def["id_prefix"], law_def)
        print(f"   Chunks generados: {len(chunks)}")

        # Agregar metadata a cada chunk
        for chunk in chunks:
            chunk.update({
                "tipo": law_def["tipo"],
                "category": "documentos",
                "tenant": "prensa",
                "norma": law_def["norma"],
                "capa": law_def.get("capa", "sectorial"),
                "tags": law_def["tags"],
                "title": law_def["title"],
                "sources": [law_def["norma"], "Guía del Delegado SIPREBA 2024"],
                "grade_access": "open",
                "vigencia": law_def["vigencia"],
                "book_ref": "SiPreBA, Guía del Delegado y la Delegada, 2024",
            })

        all_chunks.extend(chunks)

    print(f"\n✅ Total chunks generados: {len(all_chunks)}")

    # Cargar kb_chunks.json existente y agregar (append)
    try:
        with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
            existing = json.load(f)
        print(f"📋 kb_chunks.json existente: {len(existing)} chunks")
    except (FileNotFoundError, json.JSONDecodeError):
        existing = []
        print("📋 kb_chunks.json no existe, creando nuevo")

    # Remover chunks viejos con los mismos prefixes (evitar duplicados si re-ejecutamos)
    new_prefixes = {law["id_prefix"] for law in LAWS}
    existing = [c for c in existing if not any(c.get("id", "").startswith(p) for p in new_prefixes)]

    # Agregar nuevos
    existing.extend(all_chunks)

    # Guardar
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"💾 Guardado: {len(existing)} chunks totales en kb_chunks.json")

    # Estadísticas
    print("\n📊 Resumen por norma:")
    for law_def in LAWS:
        count = sum(1 for c in all_chunks if c["id"].startswith(law_def["id_prefix"]))
        print(f"   {law_def['norma']}: {count} chunks")


if __name__ == "__main__":
    main()
