# AEO · Answer Engine Optimization

> "Brand mention monitoring" explicado simple + la versión gratis que vamos a implementar.

## El problema

Hace 5 años, el 90% de búsquedas pasaban por Google. Hoy, cada vez más gente le pregunta directamente a **ChatGPT**, **Claude** o **Gemini** ("¿qué software me recomiendas para mi salón?") y nunca llega a Google.

Si Bewe **no es mencionado** en esas respuestas, **te están dejando de encontrar millones de potenciales clientes**. Y peor: cuando un LLM responde, suele recomendar 3-5 marcas concretas, ahí entran los competidores.

## ¿Qué hacen las herramientas pagas (Profound, PromptMonitor)?

Empresas como [Profound](https://www.tryprofound.com) y [PromptMonitor](https://promptmonitor.com) cobran $200-1000/mes para hacer lo mismo que vamos a hacer nosotros gratis:

1. Mantienen una lista de "prompts típicos" de tu industria
2. Cada día (o semana) corren esos prompts contra ChatGPT/Claude/Gemini
3. Analizan las respuestas: ¿menciona tu marca? ¿en qué orden? ¿con qué descripción? ¿qué competidores aparecen?
4. Te dan un dashboard con la evolución

## Versión gratis · cómo funciona en Bewe Pauta OS

### Estructura

```
┌─ Tab "AEO" en el dashboard ──────────────────────┐
│                                                  │
│  KPIs                                            │
│  ─────                                           │
│  Visibilidad Bewe: 47% (+5pp vs semana pasada)   │
│  Posición promedio: 2.3                          │
│  Competidores top: Booksy · Bewe · Mindbody     │
│                                                  │
│  Por categoría:                                  │
│  • Belleza: 62%  ↑                              │
│  • Comercio: 18% ↓                              │
│  • Servicios: 41% =                             │
│                                                  │
│  Industrias adyacentes detectadas:               │
│  - Centros médicos (35% menciones)               │
│  - Spas (27%)                                    │
│  - Gimnasios (12%)                               │
│                                                  │
│  [Ver detalles · 30 prompts]                     │
└──────────────────────────────────────────────────┘
```

### Flujo técnico

1. **Lista de prompts** (mantenida por María Paula): ~30-50 preguntas categorizadas:
   - Belleza · "¿Qué software uso para mi salón?"
   - Comercio · "POS para tienda pequeña"
   - Servicios · "Agenda profesional para freelancers"
   - Bewe directo · "¿Cómo es Bewe?", "Alternativas a Bewe"
   - Adyacentes · "Software para spa", "App para centros médicos"

2. **Modelos a probar**:
   - Gemini Flash (tu key ya está · gratis hasta cuota)
   - ChatGPT vía OpenAI (necesitas crear cuenta · primeros $5 free)
   - Claude vía Anthropic (necesitas crear cuenta · primeros $5 free)
   - DeepSeek (es open + super barato · 0.001$/1k tokens)

3. **Cron semanal** (domingo a la 1am):
   - Corre cada prompt × cada modelo = 30 × 3 = 90 calls
   - Cada call cuesta ~$0.0002 (en GPT) o gratis (Gemini)
   - **Costo semanal: ~$0.02. Mensual: ~$0.08. Sí, 8 centavos.**

4. **Análisis** (lo hace Mark OS automático):
   - Regex sobre la respuesta buscando "Bewe", "BeweAI", "bewe.ai"
   - Si lo encuentra: posición en la lista (1, 2, 3...), context (positivo/neutral/negativo)
   - Si NO lo encuentra: qué marcas SÍ menciona
   - Detecta industrias en la respuesta (centros médicos, spas, etc.)

5. **Dashboard**:
   - Trend semanal de visibility %
   - Posición promedio
   - Competidores que ganan / pierden visibility
   - Industrias adyacentes que el LLM asocia con la categoría
   - Recomendaciones de Mark: "tu visibility en 'belleza' subió 5pp porque ChatGPT te empezó a recomendar para 'salones grandes'. Recomendación: crea contenido específico para ese segmento."

### Costo real total

| Item | Costo |
|---|---|
| Gemini API (ya tienes key) | $0 |
| ChatGPT API (free tier $5) | $0 los primeros ~250k tokens |
| Claude API (free tier $5) | $0 los primeros ~250k tokens |
| Compute (corre en tu propio Node) | $0 |
| **Total mensual** | **$0** los primeros 3-6 meses |

Cuando agoten free tier:
- ChatGPT: $0.50/mes con uso normal de Bewe
- Claude: $0.50/mes
- **Total long-term: ~$1/mes**

### Industrias adyacentes (lo que pediste)

Cuando un LLM responde a "software para gestionar mi negocio", muchas veces lista herramientas de industrias adyacentes:
- Para Bewe (belleza/comercio/servicios) → adyacentes son: spas, centros médicos, gimnasios, escuelas de baile, peluquerías para mascotas, talleres mecánicos
- Si detectamos que el LLM nos asocia con esas industrias, es una **señal de oportunidad de expansión vertical**: marketing para esas verticales, landing pages específicas, partnerships.

**Mark OS automáticamente**:
- Detecta cada vez que el LLM menciona una industria en respuestas a prompts de Bewe
- Cuenta frecuencia
- Lista las top 10 industrias adyacentes mensualmente
- Recomienda: "Las industrias X e Y aparecen frecuentemente cuando los usuarios preguntan por tu vertical principal. Podríamos:
  - Crear landing dedicada
  - Hacer pauta a esa audiencia
  - Outreach a competidores indirectos para reseñas/listas comparativas"

### Roadmap del módulo

**Fase 1 · esta semana** (ya planificada):
- [x] Tab AEO en el dashboard (placeholder · ya existe)
- [ ] Lista inicial de 30 prompts hardcoded (yo los armo basándome en lo que sé de Bewe)
- [ ] Endpoint `/api/aeo/run` que corre los prompts contra Gemini (única API libre que ya tenemos)
- [ ] Persistencia en `.data/aeo-runs.json`
- [ ] UI con KPIs básicos

**Fase 2 · lunes con María Paula**:
- [ ] Ella refina los 30 prompts con conocimiento real del negocio
- [ ] Agregamos categorías y prioridades
- [ ] Configuramos cron semanal

**Fase 3 · más adelante**:
- [ ] Conectar ChatGPT API + Claude API (costo $0 inicial)
- [ ] Comparativo cross-LLM
- [ ] Alertas: "Bewe perdió 10pp de visibility esta semana en categoría Belleza"
- [ ] Reportar a Slack/email semanal

---

## TL;DR

- **Brand mention monitoring** = vigilar si tu marca sale mencionada cuando le preguntan cosas a ChatGPT/Claude/Gemini
- **Costo herramientas pagas**: $200-1000/mes
- **Nuestra versión**: $0-1/mes, mismo resultado, integrado al dashboard
- **Bonus**: detecta industrias adyacentes para oportunidades de expansión
- **Esfuerzo**: 1 día de implementación + 30 min/semana de María Paula refinando prompts

Esto le da a Bewe una ventaja real porque casi nadie está monitoreando AEO todavía. En 2-3 años va a ser estándar. Hoy es ventaja competitiva.
