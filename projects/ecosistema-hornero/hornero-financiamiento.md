# Ecosistema Hornero — Esquema de financiamiento

> El financiamiento no es solo un mecanismo económico: es un contrato político. Cuando un sindicato se asocia, entra al ecosistema como co-constructor, no como consumidor. La estructura de costos refleja la filosofía Xiong: la organización crea IA, no la compra.

---

## 1. Dos componentes: membresía + servicio mensual

El esquema separa dos costos con lógica distinta:

| Componente | Naturaleza | Qué cubre | Cuándo se paga |
|---|---|---|---|
| **Membresía** | Única vez | Setup completo: trabajo con archivos, carga de datos, configuración del sector, capacitación IA | Al asociarse al ecosistema |
| **Servicio mensual** | Recurrente | Infraestructura: servidor soberano, hosting, mantenimiento, actualizaciones | Mensual, post-setup |

**Lógica:** la membresía paga el **trabajo humano** de hacer que Hornero funcione para ese sector específico (digitalización, etiquetado, configuración, capacitación). El servicio mensual paga el **costo de infraestructura** para que siga funcionando.

---

## 2. Nivel de asociación: federación como puerta, sindicato como implementación

### La decisión: tres niveles posibles

| Nivel | Ventajas | Problemas |
|---|---|---|
| **Centrales** (CGT, CTA) | Escala masiva, legitimidad política | Negociación lenta, burocracia, pierde autonomía sindicato-specific |
| **Federaciones** (Aceitera, etc.) | Equilibrio escala/especificidad, estructura existente, confianza | No todas las ramas tienen federaciones fuertes |
| **Sindicatos locales** | Autonomía máxima, entrada rápida | Scale-up lento, sindicatos chicos pueden no tener recursos |

### Estrategia: federación como puerta de entrada, sindicato como lugar de implementación

- La **federación** se asocia al proyecto → paga la membresía → coordina capacitación → facilita adopción
- Cada **sindicato local** de esa federación es donde Hornero se implementa con sus archivos específicos
- Las **centrales** se incorporan después, cuando hay pilotos validados que demuestran valor

**Coincide con el piloto aceitero:** se entra por la Federación Aceitera, pero el trabajo de archivos se hace en cada sindicato local.

---

## 3. Membresía única — qué incluye

### Servicios incluidos

1. **Procesamiento y digitalización de archivos** (Núcleo 4 — Centro de Documentación)
   - Escaneo/fotografía de documentos físicos del sindicato
   - Transcripción con Whisper (local, soberano)
   - Clasificación con categorías sindicales (no ISAD(G) genérico)
   - Organización en series documentales con lógica laboral

2. **Carga y etiquetado del corpus** (Núcleo 1 — Laboratorio de IA)
   - Etiquetado con las 9 familias de etiquetas del ecosistema
   - Fine-tuning inicial del modelo para el sector específico
   - Configuración de búsqueda semántica (Qdrant + BGE) para convenios y documentos del sector

3. **Configuración de la app para la rama**
   - Convenios colectivos del sector cargados e interactivos
   - Escalas salariales, categorías laborales específicas
   - Vinculación con Historia Obrera del sector
   - Clipping coyuntura filtrado por rama

4. **Capacitación en IA: *"Tu sindicato puede crear IA"* (Núcleo 5)**
   - Alfabetización tecnológica soberana: no aprender a usar, aprender a decidir
   - Módulo sobre los 6 eslabones de la cadena de valor de IA
   - Formación de correspondientes sindicales como data curators
   - Kit de arranque (starter kit): infraestructura mínima, modelos open-source accesibles

5. **Kit de arranque (Núcleo 1)**
   - Infraestructura mínima para empezar
   - Modelos open-source accesibles para el sector
   - Guías de codiseño: cómo organizar un proceso de codiseño entre organizaciones sociales y técnicos
   - Documentación metodológica del know-how del proceso

### Contrato político de la membresía

La membresía no es solo una fee — incluye **derechos y obligaciones** que definen la relación política:

- **Soberanía de datos:** cláusula garantizando que los archivos del sindicato se procesan dentro del ecosistema, nunca se venden ni comparten sin autorización explícita
- **Gobernanza:** el sindicato tiene voz en el comité editorial (qué se publica, qué se reserva, qué categorías se priorizan)
- **Codiseño:** el sindicato participa en el ciclo de codiseño del Núcleo 1 — define necesidades, testea, corrige
- **Capacitación:** el módulo *"Tu sindicato puede crear IA"* — aprender a decidir sobre las herramientas que te afectan

---

## 4. Membresía única — cálculo del precio

### Dos modelos base

| Modelo | Cálculo | Ventaja | Problema |
|---|---|---|---|
| **2 salarios básicos del sector** | Variable según CCT | Proporcional a capacidad económica | Administración compleja, sindicatos con básico bajo pagan poco pero el setup es igual de costoso |
| **Igual para todos** | Fixed | Simple, transparente, predecible | Sindicatos grandes pagan "barato" relativamente, chicos puede ser mucho |

### Propuesta: banda escalonada por tamaño

Escalonar por **cantidad de afiliados**, manteniendo proporcionalidad al salario básico del sector:

| Nivel | Organización | Afiliados | Membresía |
|---|---|---|---|
| **Local** | Sindicato local | < 5.000 | 1 salario básico del sector |
| **Medio** | Federación / sindicato regional | 5.000-50.000 | 2 salarios básicos del sector |
| **Grande** | Organización nacional / central | > 50.000 | 3-4 salarios básicos del sector |

**Razón:** el trabajo de setup no es igual para un sindicato de 500 afiliados (un convenio, un archivo) que para una federación con 20 sindicatos (20 convenios, 20 archivos, 20 configuraciones). La banda refleja eso.

---

## 5. Servicio mensual — tiers

El servicio mensual cubre **infraestructura soberana + mantenimiento continuo** (Núcleo 2 — Estructura). No es solo server: es el costo de mantener el ecosistema vivo.

### Tres tiers

| Tier | Costo estimado (ARS/mes) | Incluye | Organización objetivo |
|---|---|---|---|
| **Básico** | ~30.000 | Server + app funcional, convenios del sector, Historia Obrera, clipping coyuntura básico | Sindicato local |
| **Sectorial** | ~80.000-100.000 | Convenios de toda la rama, IS grado 1-2, clipping coyuntura completo, Comunicador, Argumento | Federación |
| **Completo** | ~150.000+ | Todos los núcleos activos: IS grado 1-4, VE, Cómo Somos, búsqueda federada, soporte continuo, actualizaciones | Federación grande / central |

### Qué cubre el servicio mensual

- **Servidor soberano** (Núcleo 2): hosting, encriptación, backup
- **Stack técnico:** Qdrant (vectorial), Neo4j (conocimiento), MinIO + Postgres (archivos), Whisper (audio), LangGraph + Dify (orquestación)
- **Actualización de convenios:** cuando se firma una nueva paritaria, el CCT se actualiza en el sistema
- **Mantenimiento:** corrección de bugs, mejoras de interfaz, nuevas funcionalidades según feedback del sindicato
- **Soporte:** canal directo para consultas técnicas y problemas de uso

### Preguntas abiertas

- ¿El costo escala con uso (más consultas = más server) o es flat? → **Inicialmente flat**, revisar cuando haya datos de uso real
- ¿Qué incluye exactamente "soporte continuo"? → **Definir scope en contrato de membresía**
- ¿Cómo se actualiza el precio con inflación? → **Revisión trimestral vinculada a índice de salarios**, no a dólar

---

## 6. Accesibilidad para sindicatos pequeños

30.000 ARS/mes es accesible para sindicatos medianos/grandes, pero puede ser barrera para sindicatos pequeños.

### Estrategias de accesibilidad

1. **Subsidio cruzado:** federaciones grandes financian parte del costo de sindicatos pequeños de la misma rama. La federación paga el tier Sectorial; los sindicatos locales que la componen pagan un costo reducido (o nada si la federación lo cubre).

2. **Fase gratuita post-membresía:** los primeros 3-6 meses después de pagar la membresía, el servicio mensual es gratis. El sindicato valida la herramienta con uso real antes de comprometerse con un pago sostenido.

3. **Modo comunidad:** sindicatos que no pueden pagar el servicio mensual completo pueden participar como **nodos comunitarios** — contribuyen datos y capacitación, reciben funcionalidad básica, y se incorporan al tier completo cuando su situación económica lo permite.

4. **Financiamiento externo:** investigar subsidios de programas de innovación social, derechos digitales, cooperación internacional (Tricontinental, Mondes Américains) para cubrir costos de sindicatos con menos recursos.

---

## 7. Flujo financiero completo

```
Sindicato/Federación se asocia
        │
        ▼
┌─────────────────────────┐
│ Paga MEMBRESÍA ÚNICA    │
│ (1-4 salarios básicos)  │
│                         │
│ Incluye:                │
│ · Digitalización archivos│
│ · Carga corpus sector   │
│ · Configuración app     │
│ · Capacitación IA       │
│ · Kit de arranque       │
│ · Contrato político     │
│ · Derechos de gobernanza│
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ 3-6 meses GRATIS        │
│ (validación con uso real)│
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Paga SERVICIO MENSUAL   │
│ (30K-150K ARS/mes)      │
│                         │
│ Incluye:                │
│ · Server soberano       │
│ · Hosting + backup      │
│ · Actualizaciones       │
│ · Soporte continuo      │
│ · Nuevos núcleos        │
│  activos progresivamente│
└─────────────────────────┘
```

---

## 8. El financiamiento como expresión de la filosofía del proyecto

| Aspecto corporativo (Silicon Valley) | Aspecto Hornero (Xiong) |
|---|---|---|
| Freemium: gratis para capturar datos, pago para funcionalidad | Membresía: pago para entrar como co-constructor, servicio mensual para sostener |
| Pricing uniforme, maximizar revenue | Banda escalonada, proporcional a capacidad económica |
| Lock-in: datos en la plataforma, difícil salir | Soberanía: los datos son del sindicato, puede salir si decide |
| Soporte como "customer service" | Capacitación como formación política — aprender a decidir sobre IA |
| Updates impuestas | Actualizaciones decididas por comité editorial con representación sindical |
| Subsidio cruzado = loss leader para capturar market | Subsidio cruzado = federaciones grandes apoyan sindicatos pequeños de su rama |

**El esquema de financiamiento no es neutro:** refleja la relación política entre el ecosistema y las organizaciones. Cada sindicato que se asocia no compra un producto — entra a una construcción colectiva donde aporta datos, define categorías, testea herramientas y participa en gobernanza. El costo es la contribución a esa construcción común.

---

## 9. Proximos pasos financieros

1. **Calcular costo real del setup** para el piloto aceitero — cuánto trabajo humano implica digitalizar archivos, cargar convenios, configurar la app para aceiteros. Esto define si "1-2 salarios básicos" es suficiente o necesita ajuste.
2. **Calcular costo real de infraestructura mensual** — server, stack técnico, mantenimiento. Validar si 30.000 ARS/mes cubre el costo real o si es un estimador preliminar.
3. **Definir el contrato político de membresía** — documento formal que establece derechos (soberanía, gobernanza, codiseño) y obligaciones (aportar datos, participar en capacitación, feedback continuo).
4. **Presentar esquema a Federación Aceitera** — validar si los costos son aceptables para el piloto, ajustar según feedback.
5. **Investigar financiamiento externo** — programas de innovación social, cooperación internacional, subsidios para derechos digitales.
