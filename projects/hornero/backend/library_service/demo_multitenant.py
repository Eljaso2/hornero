"""Demuestra el aislamiento multi-sindicato: capa COMPARTIDA + capa SECTORIAL.

Inserta 2 chunks sectoriales de EJEMPLO (reemplazar por los CCT reales vía scraper
del Min. de Trabajo) para dos gremios, y prueba que:
  - cada tenant ve su capa sectorial + la 'shared' (leyes generales)
  - NINGÚN tenant ve la capa sectorial del otro
    python3 demo_multitenant.py   (requiere haber corrido seed.py antes)
"""
import library

# Fixtures sectoriales de EJEMPLO (claramente marcados — NO son el texto legal real)
SAMPLES = [
    {"id": "CCT_420_05-art-ejemplo", "tenant": "aceiteros", "capa": "fuentes",
     "tipo": "cct", "norma": "CCT 420/05 aceiteros [EJEMPLO]", "articulo": "X",
     "vigencia": "vigente", "titulo": "Jornada y recargos [ejemplo]",
     "texto": "[EJEMPLO — reemplazar por el CCT real] Recargo del 100% para "
              "sábados después de las 13, domingos y feriados.", "fuente": "EJEMPLO"},
    {"id": "CCT_130_75-art-ejemplo", "tenant": "comercio", "capa": "fuentes",
     "tipo": "cct", "norma": "CCT 130/75 comercio [EJEMPLO]", "articulo": "X",
     "vigencia": "vigente", "titulo": "Escala salarial [ejemplo]",
     "texto": "[EJEMPLO — reemplazar por el CCT real] Categorías y escalas del "
              "personal de comercio.", "fuente": "EJEMPLO"},
]


def main():
    library.upsert(SAMPLES)
    print("Insertados 2 CCT sectoriales de ejemplo (aceiteros, comercio).\n")

    print("¿Qué NORMAS ve cada sindicato? (comparte las leyes generales, aísla su CCT)")
    for tenant in ["aceiteros", "comercio"]:
        rows = library.fetch({"tenant": tenant})
        normas = sorted(set(r["norma"] for r in rows))
        propias = [n for n in normas if "[EJEMPLO]" in n]
        generales = [n for n in normas if "[EJEMPLO]" not in n]
        print(f"\n  ▸ tenant = {tenant}  ({len(rows)} chunks)")
        print(f"      generales (compartidas): {len(generales)} → {', '.join(generales)}")
        print(f"      sectorial (propia):      {propias}")

    print("\nPrueba de aislamiento — buscar el CCT del OTRO no debe aparecer:")
    r = library.search("recargo sábados aceiteros", k=5, filtros={"tenant": "comercio"})
    leak = [x for x in r if x["tenant"] == "aceiteros"]
    print(f"  comercio buscando algo aceitero → CCT aceitero visible: "
          f"{'❌ FUGA' if leak else '✅ no (aislado)'}")


if __name__ == "__main__":
    main()
