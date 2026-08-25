## ICE — Fórmula y metodología de cálculo

### Cambio organizativo

El Índice anterior (IVE) medía 6 tipos de VE con pesos fijos. El nuevo Índice de Comportamiento Empresarial (ICE) se organiza en **5 dimensiones**, cada una con violencia (negativo) y buenas prácticas (positivo), para balancear el espectro completo del comportamiento empresarial.

**IVE vs. ICE:**
- IVE: Índice de Violencia Empresarial — solo negativo, 6 categorías
- ICE: Índice de Comportamiento Empresarial — negativo + positivo, 5 dimensiones

El IVE se conserva como sub-componente (la parte "violencia" del ICE). El ICE = IVE + IBP (Índice de Buenas Prácticas).

---

### Formula base

```
ICE = IVE + IBP

IVE = Σ Dim_i (F_violencia_i × I_violencia_i × A_violencia_i × peso_i)
IBP = Σ Dim_i (F_buenas_i × I_buenas_i × A_buenas_i × peso_i)
```

Donde:
- **Dim_i** = cada dimensión (i = 1 a 5): Remuneración, Condiciones de trabajo, Estrategias de producción, Estrategias de realización, Medio social
- **F_violencia_i** = frecuencia de incidentes violentos en dimensión i
- **I_violencia_i** = intensidad de violencia en dimensión i (escala 1-5)
- **A_violencia_i** = amplitud de violencia en dimensión i (trabajadores afectados)
- **F_buenas_i** = frecuencia de buenas prácticas en dimensión i
- **I_buenas_i** = intensidad/impacto de buenas prácticas en dimensión i (escala 1-5)
- **A_buenas_i** = amplitud de buenas prácticas en dimensión i (trabajadores beneficiados)
- **peso_i** = peso relativo de la dimensión i

**Nota:** la metodología de ponderación aún no está definida. Se desarrollará con datos del piloto aceitero y revisión del Laboratorio.

---

### Pesos por dimensión (provisionales)

> **Pesos provisionales — se desarrollarán con datos del piloto aceitero.**

| Dimensión | Peso violencia | Peso buenas prácticas | Justificación |
|-----------|---------------|----------------------|---------------|
| Remuneración | **0.25** | **0.05** | La más cotidiana y extendida — incumplimiento salarial, salario por debajo de la canasta, discrecionalidad en recompensas. Las buenas prácticas (equidad remunerativa, salario digno) son obligaciones, no privilegios |
| Condiciones de trabajo | **0.25** | **0.05** | La más persistente — afecta la salud y seguridad cotidianamente: control externo del ritmo, accidentes, enfermedades, maltrato. Las buenas prácticas (consenso en producción, S&H) son obligaciones básicas |
| Estrategias de producción | **0.15** | **0.05** | Tercerización fraudulenta, cadena de proveedores sin responsabilidad. Las buenas prácticas (responsabilidad extendida, auditoría de cadena) son obligaciones |
| Estrategias de realización | **0.10** | **0.05** | Producto nocivo, publicidad engañosa, precios abusivos — violencia silente hacia el consumidor. Las buenas prácticas (juego limpio, calidad, trazabilidad) son obligaciones |
| Medio social | **0.15** | **0.05** | Daño al territorio, opacidad, captura de instituciones, dependencia económica local. Las buenas prácticas (protección ambiental, transparencia, integración social) son obligaciones |

**Total violencia: Σ = 0.90 | Total buenas prácticas: Σ = 0.25**

**Nota:** los pesos de buenas prácticas son bajos porque las "buenas prácticas" empresariales frecuentemente son también formas de control (VE-4c: control por repertorio de recompensas). No se tratan como equivalentes a la violencia — se registran para balancear, no para absolver.

**Total ICE: IVE_normalizado × 0.90 + IBP_normalizado × 0.25 → normalizado a [0, 100]**

La metodología de normalización se definirá con datos del piloto.

---

### Variables

#### Frecuencia (F)

```
F_violencia_i = incidentes_violentos_dim_i reportados en período / N_trabajadores_sector × 1000
F_buenas_i = incidentes_buenas_dim_i reportados en período / N_trabajadores_sector × 1000
```

**Fuente de datos:** observaciones de Inteligencia Sindical (Reporte Gremial 5b), re-etiquetadas con las 5 dimensiones (Remuneración, Condiciones de trabajo, Estrategias de producción, Estrategias de realización, Medio social). Informes grado 1-3, revisados por delegado y secretario. Carga espontánea de trabajadores.

#### Intensidad (I) — Violencia

Escala de gravedad, evaluada en informe grado 2 (delegado) y confirmada en grado 3 (secretario):

| Nivel | Denominación | Descripción | Ejemplo |
|-------|-------------|-------------|---------|
| 1 | Leve | VE detectada, impacto limitado | Cambio de directivas sin comunicación formal (CT) |
| 2 | Moderada | VE con impacto visible, afecta condiciones | Salario no cubre costo de vida (R), EPP insuficiente (CT) |
| 3 | Grave | VE que viola derechos, produce daño | Fuga 3 semanas + accidente (CT), amenaza sistemática (CT) |
| 4 | Muy grave | VE sistemática, violación DDHH | Precarización contractual masiva (EP), lockout ofensivo (CT) |
| 5 | Crítico | VE extrema, crimen de lesa humanidad | Represión industrial, masacre (MS) |

**Factor de naturalización (lente de violencia cultural):** si el evento VE está acompañado de naturalización/normalización (lectura de violencia cultural presente), la intensidad se incrementa +1 nivel. La naturalización no solo hace que la violencia se ejerza sino que se legitima → aumenta su impacto real.

#### Intensidad (I) — Buenas prácticas

| Nivel | Denominación | Descripción | Ejemplo |
|-------|-------------|-------------|---------|
| 1 | Básica | Práctica que cumple obligación mínima | Enfermería operativa (CT), salario según convenio (R) |
| 2 | Moderada | Práctica que va beyond obligación mínima | Programas de salud adicionales (CT), participación en ganancias (R) |
| 3 | Significativa | Práctica con impacto visible y sostenido | Certificación ISO seguridad (CT), contratación directa 100% (EP) |
| 4 | Destacada | Práctica reconocida, con impacto sectorial | RSE con participación sindical (CT), inversión en territorio (MS) |
| 5 | Excepcional | Práctica que establece precedente | Empresa modelo en sector, cambio de cultura empresarial |

**Nota:** las buenas prácticas de nivel 1 (básica) son obligaciones — no "bonus". Se registran para que el índice no penalice a empresas que cumplen lo mínimo.

#### Amplitud (A)

```
A_i = trabajadores afectados/beneficiados / N_trabajadores_sector
```

Valores: 0.01 (individual) → 0.10 (sección) → 0.30 (planta) → 0.50 (sector local) → 1.00 (sector nacional)

---

### Cálculo del ICE

```
IVE = Σ Dim_i (F_violencia_i × I_violencia_i × A_violencia_i × peso_violencia_i)
IBP = Σ Dim_i (F_buenas_i × I_buenas_i × A_buenas_i × peso_buenas_i)

ICE_sector = IVE_normalizado × 0.90 + IBP_normalizado × 0.25

ICE_sector_normalizado = ICE_sector / ICE_max × 100
```

**ICE_max** = valor teórico máximo. Se define empíricamente después de los primeros 3 meses de datos.

**Resultado:** ICE_sector_normalizado ∈ [0, 100]

| Rango ICE | Color | Interpretación |
|-----------|-------|----------------|
| 0-20 | 🟢 Verde | Comportamiento predominantemente positivo — buenas prácticas superan violencia |
| 21-40 | 🟡 Amarillo | Comportamiento mixto — violencia presente pero compensada |
| 41-60 | 🟠 Naranja | Comportamiento negativo — violencia supera buenas prácticas |
| 61-80 | 🔴 Rojo | Comportamiento violento — violencia sistemática, buenas prácticas insuficientes |
| 81-100 | ⚫ Negro | Comportamiento extremadamente violento — violencia extrema sin compensación |

**Nota:** el ICE permite ver si una empresa es predominantemente violenta, predominantemente "benigna", o mixta. Y en qué dimensiones es violenta y en cuáles no.

---

### Desglose por dimensión

El ICE se puede desglosar por dimensión para ver qué forma de comportamiento predomina:

```
ICE_Remuneración = (IVE_R × 0.25 + IBP_R × 0.05) × 100 / ICE_max_R
ICE_CT = (IVE_CT × 0.25 + IBP_CT × 0.05) × 100 / ICE_max_CT
ICE_EP = (IVE_EP × 0.15 + IBP_EP × 0.05) × 100 / ICE_max_EP
ICE_ER = (IVE_ER × 0.10 + IBP_ER × 0.05) × 100 / ICE_max_ER
ICE_MS = (IVE_MS × 0.15 + IBP_MS × 0.05) × 100 / ICE_max_MS
```

Esto produce un **perfil de Comportamiento Empresarial** del sector: qué dimensión es más intensa/frecuente.

**Ejemplo (sector aceitero, simulación Vicentín):**

| Dimensión | F violencia (hip.) | I violencia | A | peso | Componente IVE | F buenas | I buenas | A | peso | Componente IBP |
|-----------|-------------------|-------------|---|------|---------------|---------|-----------|---|------|---------------|
| Remuneración | 0.050 (salario, discrecionalidad) | 2 | 0.30 | 0.25 | 0.0075 | 0.005 (salario convenio) | 1 | 0.30 | 0.05 | 0.00075 |
| Condiciones de trabajo | 0.030 (EPP, fuga, ritmo) | 3 | 0.10 | 0.25 | 0.00225 | 0.010 (enfermería) | 1 | 0.10 | 0.05 | 0.0005 |
| Estrategias de producción | 0.020 (tercerización, cadena) | 2 | 0.30 | 0.15 | 0.0018 | 0.005 (auditoría) | 1 | 0.30 | 0.05 | 0.00075 |
| Estrategias de realización | 0.010 (publicidad, producto) | 2 | 0.30 | 0.10 | 0.0006 | 0.002 (trazabilidad) | 1 | 0.10 | 0.05 | 0.0001 |
| Medio social | 0.040 (captura, dependencia, daño) | 3 | 0.30 | 0.15 | 0.0054 | 0.002 (RSE territorio) | 2 | 0.30 | 0.05 | 0.0006 |

**Perfil aceitero:** Remuneración y Medio social predominan como violencia → comportamiento negativo con compensación insuficiente. ICE probablemente en rango naranja (40-60).

---

### Índice por empresa, región, rama, general

El ICE se calcula a 4 niveles:

#### ICE-empresa

```
ICE_empresa = (IVE_empresa × 0.90 + IBP_empresa × 0.25) normalizado × 100
```

Calculado con datos de una empresa específica. Permite comparar empresas dentro de un sector.

**Ejemplo:**
- ICE_Vicentín ≈ 55 (naranja) — violencia en remuneración y medio social predominante, RSE insuficiente
- ICE_Dreyfus ≈ 45 (naranja) — similar pero con más buenas prácticas reportadas
- ICE_Local_pyme ≈ 30 (amarillo) — violencia en remuneración menor, condiciones aceptables

#### ICE-región

```
ICE_región = Σ ICE_empresa_j × N_trabajadores_empresa_j / Σ N_trabajadores_región
```

Agregación ponderada por número de trabajadores. Permite ver la violencia regional.

#### ICE-rama (sector)

```
ICE_sector = Σ ICE_empresa_j × peso_económico_j / Σ peso_económico_j
```

Agregación ponderada por participación económica. Permite comparar sectores.

#### ICE-general (país)

```
ICE_país = Σ ICE_sector_j × peso_económico_j / Σ peso_económico_j
```

Agregación nacional. Permite ver la tendencia general del comportamiento empresarial.

---

### Serie temporal del ICE

El ICE se calcula **mensualmente**. La serie temporal permite:

- **Tendencia:** ¿el comportamiento empresarial mejora, deteriora o se mantiene?
- **Ciclo:** ¿hay ciclos (paritarias → lockout → despidos → precarización)?
- **Evento:** ¿un evento específico dispara cambio?
- **Comparación:** ¿este sector/empresa es comparable a otros?

---

### Componente VDH (violaciones a derechos humanos)

El ICE incluye un **sub-índice VDH** que indica qué proporción del comportamiento violento constituye violaciones a derechos humanos:

```
VDH-sector = Σ incidentes_VDH_i / Σ incidentes_VE_total × ICE_violencia_sector
```

| Proporción VDH | Interpretación |
|----------------|----------------|
| < 20% | La VE es predominantemente no-DDHH |
| 20-50% | Mixta |
| > 50% | Predominantemente VDH → requiere intervención judicial/organizativa |

---

### Flujo de datos desde Reporte Gremial

**Principio:** la información cargada por los trabajadores en Reporte Gremial (5b) y revisada por instancias superiores se procesa y aparece por empresa y sector en el Índice de Comportamiento Empresarial.

```
Reporte Gremial (5b)                    Índice de Comportamiento Empresarial
─────────────────────                  ──────────────────────────────────
Observación grado 1 (trabajador)        │
    → etiquetado automático             │
        → tags: Remuneración, CT,       │
          EP, ER, Medio social          │
        → violencia o buena práctica    │
                                        ↓
Informe grado 2 (delegado)              │
    → confirma, modifica,               │
      agrega intensidad                 │ → ICE-empresa
                                        │ → ICE-sector
Informe grado 3 (secretario general)    │ → ICE-región
    → consolida, interpreta             │ → ICE-general
                                        │
Carga espontánea de trabajadores        │
    → revisa delegado/secretario        │
    → se integra al Índice              │
```

Las 5 dimensiones se etiquetan en Reporte Gremial. Cuando un trabajador carga una observación, la IA propone:
- **Dimensión** (Remuneración, Condiciones de trabajo, Estrategias de producción, Estrategias de realización, Medio social)
- **Tipo** (violencia o buena práctica)
- **Sub-tipo** (incumplimiento salarial, accidente, tercerización fraudulenta, publicidad engañosa, daño ambiental, etc.)
- **Intensidad** (1-5)

El delegado/secretario confirma, modifica o rechaza. Luego alimenta el Índice.

---

### Conexión con IVE×SMVM

La dimensión **Remuneración** se articula directamente con el IVE×SMVM (Índice de Violencia Empresarial × Salario Mínimo Vital y Móvil):

- **ICE_Remuneración-SMVM directo:** relación entre el componente Remuneración del ICE y la posición salarial respecto al SMVM
- **ICE_Remuneración-SMVM dinámico:** cómo evoluciona el componente Remuneración cuando el SMVM cambia
- **Sub-índice de violencia económica salarial:** salario real vs. SMVM, horas trabajadas para llegar a SMVM, tercerización que oculta salario real

**Articulación con IFT (N13):** ICE_Remuneración×SMVM alimenta directamente el Índice de Felicidad del Trabajador — la misma data que muestra lo que daña (ICE) alimenta el diagnóstico de lo que importa (IFT).

---

### Limitaciones y notas

1. **Datos incompletos:** el ICE solo refleja lo que la APP recibe. VE no reportada no se cuenta. La cobertura del sector es un factor que se debe reportar junto al ICE.

2. **Pesos provisionales:** los pesos no son universales. Son definidos por el campo y revisables. Un ICE con diferentes pesos da resultados diferentes → siempre reportar pesos usados.

3. **Buenas prácticas como control:** las "buenas prácticas" (paternalismo, RSE, filantropismo) son frecuentemente también formas de control. Se registran como "positivo" para balancear, pero su peso es deliberadamente menor que el de la violencia.

4. **Metodología en desarrollo:** la fórmula, los pesos, y la normalización aún no están completamente definidos. Se desarrollarán con datos del piloto aceitero y revisión periódica del Laboratorio.

5. **No es índice de conflicto:** el ICE no mide conflicto laboral (ya medido por Coyuntura). Mide **comportamiento empresarial** — lo que la empresa hace.

6. **El ICE es una herramienta, no un juicio:** no pretende ser una medida objetiva. Es una lectura procesada con categorías definidas por el campo. Su valor está en hacer visible, comparar y seguir tendencias.

---

### Próximos pasos

- **Definir metodología completa:** fórmula final, pesos, normalización, escala — con datos del piloto aceitero
- **Testear con datos de Vicentín:** clasificar casos observados en las 5 dimensiones, calcular ICE provisional
- **Integrar etiquetas de Reporte Gremial:** las 5 dimensiones como tags en el flujo de observaciones
- **Desarrollar ICE×SMVM:** primer cálculo con datos salariales aceiteros
- **Diseñar visualización en App:** ICE por empresa/sector/región, desglose por dimensión, serie temporal
