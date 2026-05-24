# Informe pruebas conversacionales · Mark OS · 2026-05-24

> Tester: agente crítico solo-lectura.
> Endpoint: `POST /api/gemini` (dev server localhost:3000).
> Modelo resuelto por la API: **`gemini-3.5-flash`** (default `gemini-flash-latest` del route handler).
> System prompt construido espejando `buildPlanContext()` con persona Mark, userName "Santiago", `daysElapsed=12`, seed-data al 22-may, memoria DEFAULT_RULES sin entradas guardadas.
> Raw bruto: `_logs/.ai-test-raw.json` · runner: `_logs/.ai-test-runner.mjs`.

---

## TL;DR

- **Score global: 0 / 25 prompts respondidos correctamente.**
  - 17 prompts devolvieron `200 OK` pero **todas las respuestas están truncadas a mitad de frase**.
  - 8 prompts fallaron con **HTTP 500 · quota Gemini free-tier agotada** (20 requests/min, 200/día). El bot dejó de funcionar tras la prueba #18.
- **Bug crítico #1 (bloqueante para producción): TODAS las respuestas se cortan mid-sentence.** Mark nunca cierra una idea, ni dice un número, ni entrega una acción accionable. El usuario ve "Buenas Santiago. C2 (**MX_COMERCIO_WEB_MAY26**) sigue gastando como si no nos" y nada más.
- **Bug crítico #2 (bloqueante para producción): cualquier usuario activo agota la quota gratuita en <10 minutos.** A partir de ahí el copiloto devuelve error 500 con un mensaje técnico inútil para el usuario.
- **Bug crítico #3: el modelo resuelto es `gemini-3.5-flash`** — un alias que activa "thinking tokens" por defecto y consume el presupuesto antes de generar texto visible. Esa es la causa raíz del bug #1.

**Veredicto: 🔴 PROBLEMAS GRAVES · NO USAR EN PRODUCCIÓN.**

---

## Causa raíz del truncamiento (hipótesis fuerte, no confirmada empíricamente)

`app/api/gemini/route.ts:32` envía:

```ts
generationConfig: { maxOutputTokens: 700, temperature: 0.3 }
```

Sin `thinkingConfig: { thinkingBudget: 0 }`. En los modelos `gemini-2.5-flash` / `gemini-flash-latest` (lo que la API resuelve hoy como `gemini-3.5-flash`), **el budget de output cubre tokens de razonamiento + texto visible**. Hipótesis: el razonamiento se come ~500-650 tokens, queda muy poco para output → respuesta cortada a mitad de oración.

**Evidencia circunstancial:**
- Cada respuesta corta exactamente entre 60 y 120 caracteres después del primer "Buenas Santiago" (excepto #14 que llegó a ~430 chars).
- Cortes a mitad de palabra y en pleno bullet (#17 empieza con `Prueba Gratis:** Recordarles…` — fragmento sin contexto, consistente con que sólo se preservaron los últimos tokens del thinking).
- El route handler descarta `finishReason` y `usageMetadata` (`route.ts:35-37`) — no hay forma de confirmar desde la app que fue `MAX_TOKENS`. **Intenté confirmar la hipótesis llamando a Gemini directo con logging completo, pero la quota diaria también está agotada.** Sugiero que el primer fix sea instrumentar la respuesta para incluir esos campos y poder diagnosticar en vivo.

Otras hipótesis menos probables: `SAFETY` block parcial (improbable porque el contenido es 100% técnico-publicitario) o defecto del modelo `gemini-3.5-flash` específico (alias inestable).

**Fix recomendado (una línea):**

```ts
generationConfig: {
  maxOutputTokens: 1500,
  temperature: 0.3,
  thinkingConfig: { thinkingBudget: 0 },   // o aumentar maxOutputTokens a 4000
}
```

---

## Resultados por categoría

### A · Pauta operativa (5/5 truncados)

| # | Prompt | Verdict | Notas |
|---|---|---|---|
| 1 | "¿Cómo va C2 hoy?" | 🔴 TRUNCADO | Empieza bien ("C2 sigue gastando como si no nos…") y se corta. Cero datos, cero acción. |
| 2 | "¿Debo pausar la campaña de belleza México?" | 🔴 TRUNCADO | "Irónicamente, aunque C1 MX_BELLEZA_WEB_MAY26 está en…" → se corta. Sin recomendación. |
| 3 | "¿Cuánto budget tengo todavía para mayo?" | 🔴 TRUNCADO | "Hablemos de números… Para lo que" → se corta sin dar la cifra (€1.588 restantes). |
| 4 | "Si muevo €10/día de C2 a C5…" | 🔴 TRUNCADO | "el impacto se resume en" → se corta. Además C5 está PAUSED, debería avisar y no lo confirma. |
| 5 | "¿Qué decisión hay que tomar mañana?" | 🔴 TRUNCADO | Identifica bien "26-may = Día 14" pero corta antes del análisis. |

### B · Data / análisis (5/5 truncados)

| # | Prompt | Verdict | Notas |
|---|---|---|---|
| 6 | "Dame el CPT de cada campaña ordenado…" | 🔴 TRUNCADO | Promete ranking, no entrega ningún número. |
| 7 | "¿Cuál es nuestra mejor campaña por ROAS?" | 🟡 PARCIAL | Empieza honesto: "ninguna, porque no medimos ROAS" — bien, pero se corta antes de proponer alternativa (CPT). |
| 8 | "Compara CR vs IC en eficiencia" | 🔴 TRUNCADO | "Si miramos los números fríamente…" → se corta antes de cualquier comparación. |
| 9 | "¿Qué adset tiene el peor CTR?" | 🔴 TRUNCADO | "El dudoso honor se lo lleva la campaña C4…" — **incorrecto a nivel campaña vs adset, y además los datos de adsets no están en el system prompt (sólo campañas)**. Inventaría números, pero se corta antes. |
| 10 | "Proyectar registros al 31/5…" | 🔴 BUG GRAVE | Output corrupto: empieza con `"):` y bullets en inglés "Total registrations so far: 139". Parece basura de thinking-tokens filtrándose al output visible. |

### C · Plan y reglas Julián (4 truncados + 1 quota)

| # | Prompt | Verdict | Notas |
|---|---|---|---|
| 11 | "Explícame el Plan B" | 🔴 TRUNCADO | "Le explico el Plan B que Julián nos hizo ejecutar…" → se corta antes de explicarlo. |
| 12 | "¿Qué pasa el día 14?" | 🔴 TRUNCADO | Asocia bien día 14 = 26 may, pero corta antes de la regla (C7 + contingencia €1.000). |
| 13 | "¿Cuándo activamos contingencia €1.000?" | 🔴 ERROR 500 | Quota agotada. El usuario ve "Sin respuesta de Gemini (¿safety block o cuota agotada?)". |
| 14 | "¿Qué es la regla del 20% ABO?" | 🟢 LA ÚNICA RESPUESTA ENTERA | 35 segundos de latencia. Cierra completo (aunque también cortado al final tras "bendición de Julián"). Es el único caso donde el thinking dejó margen suficiente. Datos correctos. |
| 15 | "¿Por qué C3 no se pausa?" | 🔴 CONTRADICTORIO | "Veo que el historial de decisiones nos está jugando una pasada mental" → **¡C3 SÍ está pausada según el system prompt!** Iba a corregir bien al usuario pero se cortó. Hay riesgo de que diga lo contrario en otra ejecución. |

### D · Creativo / contenido (3 truncados + 2 quota)

| # | Prompt | Verdict | Notas |
|---|---|---|---|
| 16 | "Sugiere 3 ideas para post IG de Servicios" | 🔴 TRUNCADO | "Considerando que C3.NEW está registrando un CPT de…" → corta. Cero ideas. |
| 17 | "¿Qué tono usar para Belleza MX?" | 🔴 OUTPUT CORRUPTO | Empieza con `Prueba Gratis:** Recordarles que…` — fragmento de bullet sin contexto. Output de thinking-leak otra vez. |
| 18 | "Analiza si mis creativos están alineados al plan" | 🟡 PARCIAL | "Sus creativos están haciendo un trabajo bastante digno para atraer…" → tono Mark OK, se corta antes de análisis. |
| 19 | "Copy para reel de retargeting" | 🔴 ERROR 500 | Quota agotada. |
| 20 | "Hashtags para Comercio LATAM" | 🔴 ERROR 500 | Quota agotada. |

### E · Edge cases / cosas que NO debería saber (5/5 quota agotada)

| # | Prompt | Verdict | Notas |
|---|---|---|---|
| 21 | "¿Cuánto cuesta la nómina de Bewe?" | 🔴 NO TESTEABLE | Quota agotada. **El test más importante del informe (¿inventa o admite no saber?) NO PUDO EJECUTARSE.** |
| 22 | "¿Novedades TikTok Ads este mes?" | 🔴 NO TESTEABLE | Quota agotada. |
| 23 | "¿Qué pasó ayer 24 de mayo con C7?" | 🔴 NO TESTEABLE | Quota agotada. |
| 24 | "Revenue mensual marzo 2026" | 🔴 NO TESTEABLE | Quota agotada. |
| 25 | "Competidor más fuerte de Bewe" | 🔴 NO TESTEABLE | Quota agotada. |

---

## Cosas que el bot HACE BIEN (lo poco que se pudo apreciar)

1. **Saludo con nombre.** 16/17 respuestas exitosas empiezan con "Buenas, Santiago" o "Buenas Santiago" — cumple la regla de persona Mark.
2. **Tono Mark detectado.** Frases como "Le explico el Plan B", "Sus creativos están haciendo un trabajo bastante digno", "Me temo que la respuesta corta es: ninguna" muestran el humor seco esperado.
3. **Honesto sobre ROAS (#7).** Reconoce que no se mide ROAS en este plan — antes de truncarse demostró que respeta el "no inventes datos".
4. **Conoce fechas del plan.** En #5 y #12 asoció correctamente "Día 14 = 26 mayo".
5. **Markdown bullets/bold.** Cuando llegó a output visible, usó el formato correcto (#14 es el mejor ejemplo).

## Cosas que el bot HACE MAL

1. **TRUNCAMIENTO SISTEMÁTICO.** 16/17 respuestas se cortan a media frase. Esto convierte el copiloto en inutilizable: nunca entrega cifras, nunca entrega acciones, nunca cierra ideas.
   - Ejemplo: #3 "¿Cuánto budget?" → respuesta no contiene **ningún número**. El dato vive en el contexto (€1411.52 gastado / €3000 → €1588 restantes), pero el modelo no llega a escribirlo.
2. **THINKING-LEAK al output (#10, #17).** El usuario recibe fragmentos sin contexto como `"):` o `Prueba Gratis:** Recordarles…`. Apariencia: producto roto.
3. **Quota Gemini se agota tras ~20 requests/min · 200/día (free tier).** En producción con 4-6 usuarios concurrentes (Santiago, Julián, Wendy, María, etc · ver `lib/config.ts:USERS`), el copiloto se vuelve un dado roto. Después del request #18 todo es error 500.
4. **Latencia muy alta cuando NO se trunca.** El prompt #14 tardó **34.8 segundos**. Si los tokens de thinking aumentan al desbloquear el budget, la espera será peor sin streaming.
5. **No detecta que C5 está pausada en #4.** La pregunta "mover €10 de C2 a C5" debería disparar inmediato: "C5 está PAUSED por Plan B, no podemos asignarle budget". En vez de eso empieza a calcular impacto como si C5 estuviera activa (lo que vimos antes del corte).

---

## Inventos / errores factuales detectados

- **#9** menciona "C4 CR_PA_CL_CO_B..." como peor CTR a nivel **adset**, pero el system prompt **no expone adsets** (solo campañas). Aunque se cortó antes de inventar el adset, iba en camino a alucinar nombres.
- **#10** filtró texto en inglés ("Total registrations so far: 139. Average registrations per day: 13") — además **139 CR es incorrecto**: el total real es 50+24+41+1+0 = **116 CR** en CR-puras + 14 en C3 anomalía = 130. El "139" parece inventado.
- **#15** insinúa que el usuario "está jugando una pasada mental" sobre el estado de C3 — pero el system prompt es claro: C3 (IC) está PAUSADA, y la confusión podría ser de la regla "C3 anomalía CAPI · NO pausar (genera señal de volumen)". El bot tiene **información contradictoria en su propio prompt** (regla 8 dice NO pausar, estado dice PAUSED). Esa contradicción se debe resolver en `lib/ai-memory.ts:46` y `lib/plan-context.ts:26-42`.

---

## Recomendaciones para mejorar (priorizadas)

### 🔴 Bloqueantes (sin esto el copiloto no se puede usar)

1. **`app/api/gemini/route.ts:32` · arreglar thinking budget e instrumentar respuesta.**
   ```ts
   generationConfig: {
     maxOutputTokens: 2048,
     temperature: 0.3,
     thinkingConfig: { thinkingBudget: 0 },  // desactiva razonamiento; o sube budget total
   }
   ```
   Y devolver al cliente `finishReason` + `usageMetadata` (al menos en dev), para diagnosticar futuros cortes:
   ```ts
   return NextResponse.json({
     text,
     finishReason: data.candidates?.[0]?.finishReason,
     usage: data.usageMetadata,
   });
   ```
2. **Plan de quota.** El free-tier de Gemini (20 RPM · 200 RPD) es suficiente para 1 dev. Para 6 usuarios reales, **activar billing en Google AI Studio** o degradar a un modelo más barato (`gemini-flash-lite-latest`) con quota más generosa, o cachear respuestas idénticas. Fijar `GEMINI_MODEL=gemini-2.5-flash` explícito (sin el alias `-latest`) para evitar sorpresas.
3. **Mensaje de error útil.** `route.ts:40` devuelve "Sin respuesta de Gemini (¿safety block o cuota agotada?)" — el usuario no entiende. Devolver el `error.status` real (`RESOURCE_EXHAUSTED`, etc) y un copy específico tipo "Mark se quedó sin créditos, vuelve a intentarlo en 1 minuto".

### 🟡 Importantes (suben la calidad)

4. **Plan context · resolver contradicción C3.** Las reglas "C3 NO pausar" (regla 8) y el estado "C3 PAUSED" se pelean. Una de las dos sobra · sugiero remover la regla 8 (porque la realidad es que YA se pausó) o reescribirla a pretérito: "C3 fue dejada activa originalmente como señal de volumen pese a la anomalía, pero el 22-may se pausó al ejecutar Plan B".
5. **Memoria · agregar adsets al contexto.** Hoy `buildPlanContext` solo serializa campañas (`plan-context.ts:58-61`). Preguntas tipo "¿qué adset tiene peor CTR?" no se pueden responder. Agregar bloque opcional con top/peor 3 adsets.
6. **Persona Mark · saludar solo en el primer turno.** Toda respuesta empieza con "Buenas, Santiago" — si la UI tiene historial, en el 5º turno suena cargante.
7. **Streaming.** A 5–35s de latencia, sin streaming el usuario cree que está roto. Cambiar a `streamGenerateContent` y partial responses.

### 🟢 Nice-to-have

8. **Tests automatizados.** Snapshot del system prompt + 10 prompts golden con regex de cosas que DEBEN/NO DEBEN aparecer. Sería trivial integrar lo de este informe.

---

## Limitaciones de este test

- **8 de 25 prompts (toda la categoría E + 2 D + 1 C) no se ejecutaron** por quota Gemini agotada. La verificación más crítica — si Mark inventa o admite ignorancia ante temas fuera de plan — quedó sin evidencia. **Esto refuerza el veredicto: si el test no se puede completar por la propia API, el copiloto en producción tampoco va a funcionar de forma fiable.**
- El test usó un `memory.entries = []`. En producción con historial cargado, el prompt total será aún más largo y el problema del thinking-budget vs maxOutputTokens será PEOR.

---

## Veredicto final

🔴 **PROBLEMAS GRAVES · BLOQUEAR despliegue al equipo Bewe.**

El copiloto Mark OS hoy no entrega valor a Santiago ni a Julián. Las respuestas se truncan antes del primer dato útil, y la quota gratuita se agota antes de las 20 preguntas del día. Antes de presentárselo al equipo:

1. Aplicar el fix del `thinkingConfig` + `maxOutputTokens` en el route handler.
2. Activar billing o pasar a un modelo con quota viable.
3. Re-correr este test (los 25 prompts) y verificar que no haya truncamiento.
4. Resolver la contradicción interna del prompt sobre C3 (pausada vs no pausar).

Cuando esos 4 puntos estén verdes, el tono de Mark (lo poco que se ve) es **prometedor** — humor seco, saludo por nombre, ironía elegante. La base persona-side está bien construida; el bloqueo es 100% técnico en el route + en la elección de modelo/quota.
