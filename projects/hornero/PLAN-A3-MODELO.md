# Hornero — A3: Soberanía de modelo (self-hosted + fine-tuning)

> Parte A / Fase 2 del [PLAN maestro](PLAN-EXPANSION-MEJORA.md). La meta política central: **crear, no consumir** — un modelo bajo control del programa.
> **[DECISIÓN]** = definición del equipo.

## 1. Objetivo
Dejar de depender de **GLM-5.1 vía DashScope (Alibaba)** y correr un modelo **open, self-hosted**, con camino a un **modelo propio fine-tuneado** con perspectiva de clase.

## 2. Estado actual (auditado)
- LLM: **GLM-5.1 vía DashScope** (el adaptador se llama "deepseek" pero apunta a Alibaba). `ANTHROPIC_*`/Claude como alternativa.
- STT: **Groq Whisper** con fallback **DashScope Paraformer**.
- Buena noticia: existe la abstracción `backend/llm_providers/` → se puede cambiar el motor sin tocar el resto.

## 3. Etapas
1. **Consolidar la abstracción de proveedor:** un `provider` seleccionable por env; contrato claro (chat, chat_stream). Ya casi está.
2. **Servidor de inferencia open:** desplegar un modelo abierto con **vLLM** (o Ollama/llama.cpp para empezar chico). **[DECISIÓN] modelo base** (candidatos: Qwen2.5, Llama-3.x, DeepSeek-OSS, según español + tamaño + licencia). Exponer una API compatible OpenAI → el adaptador actual casi no cambia.
3. **STT soberano:** `faster-whisper` self-hosted (ya previsto en la arquitectura como "Whisper on-device"), para no mandar audios a terceros.
4. **Evaluación (clave):** armar un **set de eval** con casos reales por persona (abogado, compañero, investigador…) y criterios (fidelidad a la fuente, tono, anti-alucinación). Comparar modelo propio vs. GLM. **No migrar sin que iguale o supere.**
5. **Fine-tuning propio (meta):** dataset desde el **corpus soberano (B2)** + estilo de las personas + reportes reales anonimizados; técnica **LoRA/QLoRA** (barata en cómputo). Iterar con el comité.

## 4. Cómputo y costos
- Inferencia self-hosted de un modelo útil normalmente necesita **GPU** (en el VPS de A2 o un servicio de inferencia soberano). Modelos chicos corren en CPU pero lentos.
- **[DECISIÓN]** GPU propia vs. alquilada; presupuesto; si se arranca **sin fine-tuning** (solo open self-hosted) y se afina después.

## 5. Transición segura
- **Flag de fallback:** mantener DashScope como respaldo transitorio mientras se estabiliza el modelo propio.
- Cortar recién cuando la eval (§3.4) lo respalde.

## 6. Hecho cuando
- [ ] Las respuestas se generan con un modelo **bajo control del programa**.
- [ ] STT corre self-hosted (audios no salen a terceros).
- [ ] Calidad ≥ la actual en el set de eval.
- [ ] (Meta) modelo fine-tuneado con el corpus propio.

## 7. Dependencias
- **Depende de:** A2 (infra/GPU) + B2 (corpus para fine-tuning).
- **Cierra:** el eslabón "soberanía de modelo" del discurso (hoy ✗).

## 8. Riesgos
- Costo/complejidad de GPU e inferencia (el punto más caro del plan).
- Calidad: un modelo propio mal evaluado puede empeorar la experiencia → la eval es innegociable.
- Mantener dos caminos (propio + fallback) agrega trabajo temporal.
