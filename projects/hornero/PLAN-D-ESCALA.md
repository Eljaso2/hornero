# Hornero — D: Escala multi-sindicato y protección de datos

> Parte D / Fase 4 del [PLAN maestro](PLAN-EXPANSION-MEJORA.md). Del **piloto** a **varios gremios**, con protección real.
> **[DECISIÓN]** = definición del equipo/dirección.

## D1 · Multi-tenant (varios sindicatos aislados)
**Objetivo:** que cada organización tenga **su corpus, su convenio, su config y sus usuarios**, aislados entre sí.

**Tareas:**
1. **Modelo de datos por `tenant`** (ya lo dejamos en el token en A1): corpus, taxonomía, usuarios, grados, territorios propios. Toda tabla lleva `tenant_id`.
2. **Aislamiento y permisos:** ningún dato cruza entre tenants (row-level security / filtros por `tenant_id` en cada query). El RAG recupera solo del corpus del tenant.
3. **Panel de administración por sindicato** (gestión de usuarios, corpus, config).
4. **Onboarding reproducible:** crear un tenant = correr un **playbook** (crear DB/esquema, seed de usuarios, cargar corpus base, configurar personas).

**Depende de:** A1 (auth/roles) + A2 (Postgres). **Hecho cuando:** dos sindicatos conviven en el sistema sin ver datos del otro, cada uno con su convenio.

## D2 · Adopción y codiseño
- **Kit de arranque** operativo (el que muestra la demo de Adopción): digitalización de archivos, carga/etiquetado de corpus (B2), configuración, capacitación "tu sindicato puede crear IA".
- **Proceso de codiseño** documentado: necesidades → specs → implementación → testeo → iteración.
- **Modelo de financiamiento B2B2C operativo:** membresía por tamaño + servicio mensual + subsidio cruzado. **[DECISIÓN] cerrar los números reales** de setup e infraestructura (hoy son estimadores preliminares — depende de A2/A3 para conocer el costo real).

## D3 · Protección de datos (implementar lo aspiracional)
**Estado:** hoy la protección es **por prompt** + filtros por grado; **falta lo técnico**.
**Tareas:**
1. **Consentimiento explícito** en la carga (el trabajador elige privado/anónimo/público).
2. **Anonimización real** (separar identidad del contenido en el pipeline).
3. **EXIF stripping efectivo** en fotos/videos (hoy aspiracional; la demo lo muestra, hay que implementarlo).
4. **Cifrado en reposo** (A2) + **retención/borrado** (derecho a borrar).
5. **Accesos auditables** (se cruza con A1): quién leyó/escribió qué.

**Hecho cuando:** un afiliado puede reportar con **garantía técnica** (no solo declarativa) de que la empresa no accede y su identidad está protegida.

## Dependencias (D)
- **Depende de:** A1 (auth/roles/tenant) + A2 (Postgres/cifrado) + B2 (corpus por sindicato).
- Es la fase de **escala**: se hace cuando A y B están sólidas.

## Decisiones abiertas [DECISIÓN]
- Números reales de financiamiento (tras conocer costos de A2/A3).
- Gobernanza multi-sindicato: quién administra qué, cómo se comparte/subsidia.
- Nivel de aislamiento (esquemas separados por tenant vs. tablas con `tenant_id`).

## Riesgos
- **Escalar sin A1/A2 = fuga de datos entre organizaciones.** No abrir a otros gremios antes.
- Protección "declarativa" sin implementación técnica es un riesgo reputacional serio para un proyecto que la pone como bandera → D3 no es opcional.
