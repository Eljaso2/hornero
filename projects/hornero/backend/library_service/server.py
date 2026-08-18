"""Servicio HTTP de la Biblioteca de Hornero — stdlib (sin dependencias).

Endpoints:
  GET  /health
  GET  /library/stats
  POST /library/search   { query, tenant?, filtros?, k? }
  POST /library/ingest   { norma_id }        → scrapea e indexa una norma

Correr:  python3 server.py   (default puerto 8010, como bib_search_local)
En producción esto puede ser FastAPI; el contrato es el mismo.
"""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import library
import scraper

PORT = int(os.getenv("LIBRARY_PORT", "8010"))


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}") if n else {}

    def log_message(self, *a):  # silencio
        pass

    def do_GET(self):
        if self.path == "/health":
            return self._send(200, {"ok": True})
        if self.path == "/library/stats":
            return self._send(200, library.stats())
        self._send(404, {"error": "not found"})

    def do_POST(self):
        try:
            b = self._body()
        except Exception as e:
            return self._send(400, {"error": f"bad json: {e}"})

        if self.path == "/library/search":
            filtros = b.get("filtros", {}) or {}
            if b.get("tenant"):
                filtros["tenant"] = b["tenant"]
            res = library.search(b.get("query", ""), k=b.get("k", 5), filtros=filtros)
            return self._send(200, {"results": res})

        if self.path == "/library/ingest":
            nid = b.get("norma_id")
            if nid not in scraper.SOURCES:
                return self._send(400, {"error": f"norma_id desconocido: {nid}"})
            chunks = scraper.scrape(nid)
            n = library.upsert(chunks)
            return self._send(200, {"ingested": n, "norma": scraper.SOURCES[nid]["norma"]})

        self._send(404, {"error": "not found"})


if __name__ == "__main__":
    print(f"Biblioteca Hornero escuchando en http://localhost:{PORT}")
    print("  GET  /library/stats   ·   POST /library/search   ·   POST /library/ingest")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
