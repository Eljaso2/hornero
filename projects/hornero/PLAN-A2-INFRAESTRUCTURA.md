# Hornero — A2: Infraestructura soberana (VPS + Postgres)

> Parte A / Fase 1 del [PLAN maestro](PLAN-EXPANSION-MEJORA.md). Salir de la nube comercial hacia infraestructura del programa.
> **[DECISIÓN]** = definición del equipo.

## 1. Objetivo
Que Hornero corra **end-to-end en infraestructura controlada por el programa**, con persistencia robusta, backups y TLS — condición de la soberanía y prerequisito de A3 (modelo propio) y de B1 (vector DB).

## 2. Estado actual (auditado)
- Backend **FastAPI en Render** (plan que se duerme por inactividad → cold start ~30-60s).
- Frontend en **GitHub Pages** (`eljaso2.github.io/hornero`).
- Persistencia: **3 SQLite** locales al proceso (`chat_history.db`, `informes.db`, `push_subscriptions.db`) — no sirven para réplicas ni backups serios.
- Ya hay `Dockerfile` + `docker-compose.yml` (dev) → base para contenerizar.

## 3. Diseño
1. **[DECISIÓN] Infraestructura:** VPS argentino (proveedor local) vs. servidor físico del programa/federación. Definir specs. Si se autohospeda el modelo (A3) → **GPU**; si no, CPU alcanza para el proxy.
2. **Contenerización:** empaquetar backend + Postgres + Redis + (futuro) Qdrant/Neo4j con `docker-compose` (o k8s si escala mucho — probablemente overkill al inicio).
3. **Reverse proxy + TLS:** Caddy o Nginx con Let's Encrypt; dominio propio (**[DECISIÓN]** dominio).
4. **Persistencia → PostgreSQL:** migrar las 3 SQLite a Postgres (tablas `chat_messages`, `informes`, `correcciones`, `subscriptions`, + `users` de A1). Los `sync` con `ON CONFLICT ... WHERE excluded.timestamp > ...` se traducen 1:1 a Postgres.
5. **Redis:** para rate-limit compartido y refresh/revocación de tokens (A1).
6. **Backups** automáticos (pg_dump programado) + **cifrado en reposo** + retención.
7. **Observabilidad:** logs centralizados, healthcheck (`/api/health` ya existe), alertas básicas (caído / disco / errores).
8. **CI/CD:** deploy reproducible (push → build → deploy), con `.env` fuera del repo.

## 4. Migración de datos (sin perder lo del piloto)
- Exportar cada SQLite → importar a Postgres (script de migración; validar counts y esquema, incluidas las columnas agregadas en runtime `image`/`source_url` en chat).
- Congelar escrituras durante la migración o hacerla con doble-escritura transitoria.

## 5. Frontend
- Cambiar la URL del backend: hoy `https://hornero-ia.onrender.com` (en `db.js` y cada componente de chat) → **dominio propio**. Centralizar esa URL en un solo lugar (hoy está repetida) para no volver a tener que tocar 8 archivos.
- **[DECISIÓN]** ¿el frontend sigue en GitHub Pages o también se mueve al VPS? (GitHub Pages es cómodo pero es infraestructura de terceros; para soberanía plena, servirlo desde el VPS).

## 6. Hecho cuando
- [ ] El sistema corre en infra del programa (no Render), con TLS y dominio propio.
- [ ] Postgres con backups automáticos y cifrado.
- [ ] Redis operativo (habilita rate-limit/refresh de A1).
- [ ] La app piloto funciona igual apuntando a la nueva URL.

## 7. Dependencias
- **Depende de:** A1 (auth) para no exponer datos al mover.
- **Bloquea/Habilita:** A3 (GPU/infra), B1 (vector DB + grafo), D (multi-tenant necesita Postgres).

## 8. Riesgos
- Costo mensual del VPS/GPU (**[DECISIÓN]** presupuesto).
- Ventana de migración: coordinar para no perder datos del piloto.
- Sysadmin: alguien tiene que mantener el server (parte del "acompañamiento" del modelo de adopción).
