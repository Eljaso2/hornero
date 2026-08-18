"""Carga inicial de la biblioteca: scrapea las normas de SOURCES → SQLite.
Corre búsquedas de prueba (incluida una con tenant, para ver la capa compartida).
    python3 seed.py
"""
import library
import scraper


def main():
    print("Ingesta (scrape InfoLeg → chunk por artículo → SQLite durable):")
    for nid in scraper.SOURCES:
        chunks = scraper.scrape(nid)
        n = library.upsert(chunks)
        print(f"  {nid}: {n} artículos → biblioteca")

    st = library.stats()
    print(f"\nEstado: {st['total']} chunks · {st['normas']} normas · {st['tenants']} tenants")
    print(f"  por norma: {st['por_norma']}")

    ne = library.embed_index()
    print(f"\nEmbeddings: {ne} chunks embebidos → SEMÁNTICO ON" if ne
          else "\nEmbeddings: sin proveedor → modo léxico")

    print("\nBúsquedas de prueba (tenant='aceiteros' → ve su capa + la 'shared'):")
    for q in ["¿me pueden obligar a hacer horas extra?",
              "indemnización por despido sin causa", "art. 245",
              "qué es el salario mínimo vital y móvil"]:
        r = library.search(q, k=2, filtros={"tenant": "aceiteros", "vigencia": "vigente"})
        hits = [f"Art.{x['articulo']}[{x['match']}]" for x in r]
        print(f"  \"{q}\"  →  {hits}")


if __name__ == "__main__":
    main()
