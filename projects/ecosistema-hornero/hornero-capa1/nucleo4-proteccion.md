# Capa 1 — Núcleo 4: Protección

> Soberanía, uso ético, protección de datos y privacidad. No es solo "technical feature" — es una dimensión política y ética que merece tratamiento explícito. Va junto con Filosofía, Metodología y Estructura porque define las reglas que todo el ecosistema aplica.

---

## Principios de protección de datos

1. **Consentimiento explícito:** los datos personales del trabajador nunca se envían al backend sin consentimiento explícito. El trabajador sabe qué datos se recogen, para qué, y con qué alcance.
2. **Anonimización por defecto:** las observaciones a IS se anonimizan ("observación del sector X", no "de Juan Pérez de la planta Y"). En contextos de conflicto, la app no puede ser herramienta de identificación.
3. **Encriptación:** datos sensibles encriptados en base y transmisión (TLS + AES-256). Solo usuarios autorizados pueden acceder.
4. **Acceso por grados:** sistema de visibilidad (trabajador grado 1, delegado grado 2, secretario grado 3, directivo grado 4) — quién ve qué, qué información le corresponde.
5. **Protección contra identificación:** denuncias de salud laboral pueden ser anónimas. Testimonios de Tu historia se publican solo si el testimoniant decide explícitamente.

---

## Qué datos se recogen, cómo, y con qué consentimiento

| Tipo de dato | Cómo se recoge | Consentimiento | Protección |
|---|---|---|---|
| Observaciones IS | Correspondiente ingresa voluntariamente | Explícito | Anonimizado + encriptado |
| Consultas Documentación | Trabajador busca información | Implicit: busca info pública | No almacena datos personales |
| Testimonios Tu historia | Trabajador elige compartir voluntariamente | Explícito: decide visibilidad | Encriptado + visibilidad por niveles |
| Datos IFT | Agregados de múltiples fuentes | Implicit: datos agregados | Anonimizado por sector |
| Datos de uso app | Qué subsecciones usa, qué busca | Implicit: uso interno | No monetizado, no compartido |
| Informes CE / ICE×SMVM | Datos de comportamiento empresarial + salario | Implicit: fuentes públicas + IS | Agregado por sector, anonimizado |

---

## Uso ético de datos

- Datos de uso **no se monetizan** — se usan para mejorar el sistema y investigación, bajo control del comité
- Observaciones IS **solo se usan dentro del ecosistema** — no se envían a plataformas externas
- Testimonios **solo se publican con consentimiento explícito** — el sistema nunca publica sin autorización
- Datos IFT **son agregados por sector** — no datos individuales
- Corpus de entrenamiento **pertenece al programa** — no se usa para entrenar modelos de terceros
- Sindicatos **deciden qué se digitaliza, qué se publica, qué se reserva**

---

## Dato privado vs. producto público

- **Dato privado:** nunca sale del ecosistema. Observaciones grado 1, testimonios privados, datos individuales de uso, deliberación sindical. Protegido en todo el flujo.
- **Producto público:** decisión política deliberada — qué se comunica, cuándo, con qué nivel de detalle. Coyunturas grado 4, IFT por sector, ICE por empresa, narrativas colectivas autorizadas.

---

## Protección específica de testimonios (Tu historia)

- **Encriptados** en almacenamiento y transmisión
- **Visibilidad por niveles definidos por el testimoniant:** privado / compartido con investigadores (anonimizado) / público (nombre visible)
- **El testimoniant controla su historia:** editar, agregar, cambiar visibilidad, eliminar
- **El sistema nunca publica sin consentimiento explícito** — ni resúmenes ni citas
- **Anonimización reversible solo para el testimoniant**

## Repositorio y documentación

> N4 (Protección) **define reglas** — no consume repositorio de datos. Define los principios de protección que todo el ecosistema aplica: consentimiento explícito, anonimización por defecto, encriptación TLS+AES-256, acceso por grados, dato privado vs. producto público, uso ético. Las reglas de protección son componente de la librería base (N2) — cada núcleo las aplica.

---

## Articulación con otros núcleos

- **Núcleo 1 (Filosofía):** soberanía como posición política — Protección implementa esa posición en cada dato
- **Núcleo 2 (Metodología):** datasets etiquetados con reglas de protección — quién puede acceder a qué
- **Núcleo 3 (Estructura):** encriptación, backup, acceso por grados — se implementa técnicamente aquí
- **Núcleos 6-13 (Backend):** cada núcleo aplica las reglas de protección definidas aquí
- **Núcleo 5 (App):** local-first, privacidad por diseño, datos personales nunca sin consentimiento
