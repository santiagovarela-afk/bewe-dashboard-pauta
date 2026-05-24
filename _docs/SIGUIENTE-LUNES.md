# Checklist del Lunes 26 may · qué conectamos

> Lista de verificación para el lunes. Tu job: traer los items del Bloque A listos. Mi job: lo del Bloque B implementado.

## Bloque A · TU homework antes del lunes

### Crítico (hacer hoy si puedes)

- [ ] **Meta System User Token** generado (ver `SETUP-TOKENS.md` sección 1)
- [ ] Pegado en el dashboard (Config → caja morada)
- [ ] Pill arriba indica "Meta conectado" ✓

### Necesario para SEO/lunes

- [ ] María Paula ya tiene `SEO-CHECKLIST-MARIAPAULA.md` y armó el doc con su info
- [ ] **GSC verificado** bewe.ai (María Paula confirma)
- [ ] **GA4 Property ID** + **Measurement ID** identificados
- [ ] **Ahrefs Webmaster Tools** cuenta creada + dominio verificado (24-48h para crawlear, hacer hoy)
- [ ] **PageSpeed Insights API key** sacada (2 min, ver `SETUP-TOKENS.md` sección 4)

### Opcionales (decisión)

- [ ] Posthog Personal API Key · solo si usan Posthog · scopes READ-ONLY
- [ ] TikTok app · solo si tienen ads activos · empezar HOY (72h review)
- [ ] LinkedIn app · solo si tienen ads B2B · empezar HOY (10 días review)

### Para AEO

- [ ] María Paula prepara su lista de 30 prompts (template en `SEO-CHECKLIST-MARIAPAULA.md` Bloque D)
- [ ] Lista de 10 competidores directos
- [ ] Lista de 5 industrias adyacentes para explorar

---

## Bloque B · MI homework (ejecutado este fin de semana)

### Implementado (sin necesitar tu token)

- [x] **Mark OS** · rename del asistente, selector Mark/Lúa OS en Config, personalidad formal-humor
- [x] **Animaciones más distintivas** · theme switch circular desde el botón, reveals editoriales
- [x] **AI dock animado** · abre desde el FAB con spring, intro card primera vez
- [x] **Role-gating** · tokens visibles solo para Santi/Julián/Wendy
- [x] **Data update** · seed-data.ts refleja estado 22-may (IC pausadas + 3 CR + Servicios CR + Retargeting + Tools junio)
- [x] **AI memory** · reglas actualizadas con el nuevo plan
- [x] **Open BUI** · tldraw embebido directo (sin fallback técnico confuso)
- [x] **Informe 3 formatos** · Slack short + Email ejecutivo + Reporte Julián (tono humano)
- [x] **AEO module v1** · tab funcionando con 30 prompts hardcoded + run contra Gemini
- [x] **UI bugs** · tooltip z-index + modal z-index + botón reset onboarding visible
- [x] **Docs** · este pack (`_docs/`) explicando todo

### Pendiente para el lunes (depende de tu token + GSC + GA4)

- [ ] **Campañas tab restructure** con datos reales (espera token)
- [ ] **Funnel correcto separado CR vs IC** con datos reales (espera token)
- [ ] **Estrategia tab desaturada** con datos reales (espera token)
- [ ] **GSC integración** OAuth + UI keywords (lunes con María Paula)
- [ ] **GA4 integración** Service Account + UI tráfico (lunes)
- [ ] **PageSpeed Insights** widget Core Web Vitals (cuando me pases la key)
- [ ] **Ahrefs CSV processor** (lunes)
- [ ] **AEO refinement** con prompts reales de María Paula
- [ ] **Posthog/TikTok/LinkedIn** según decisiones del lunes

---

## Agenda del lunes 26 may

### Mañana · 9:00 - 11:30 · Conexiones live

| Hora | Item | Quien |
|---|---|---|
| 9:00 - 9:30 | Review del dashboard con token Meta conectado · qué jala, qué no | Santi |
| 9:30 - 10:00 | María Paula presenta SEO actual (keywords, competidores) | María Paula |
| 10:00 - 10:30 | Conectamos GSC + GA4 + PageSpeed | Santi + María Paula + yo |
| 10:30 - 11:00 | Conectamos Ahrefs CSV processor | yo + María Paula |
| 11:00 - 11:30 | Validamos data en tab SEO | María Paula crítica · yo ajusto |

### Mediodía · 11:30 - 12:30 · AEO setup

| Hora | Item | Quien |
|---|---|---|
| 11:30 - 12:00 | María Paula refina los 30 prompts | María Paula + Mark OS |
| 12:00 - 12:30 | Primer run de AEO Monitor · vemos resultados iniciales | Todos |

### Tarde · 14:00 - 16:00 · Pendientes y deploy

| Hora | Item | Quien |
|---|---|---|
| 14:00 - 14:30 | Decisión Posthog (¿lo activamos?) | Equipo |
| 14:30 - 15:00 | Decisión TikTok / LinkedIn (¿vale la pena ahora?) | Equipo |
| 15:00 - 15:30 | Día 14 review · ¿se activa C7? · ¿contingencia €1.000? | Santi + Julián |
| 15:30 - 16:00 | Deploy a Vercel · staging | yo |

---

## Día 14 · 26 may · decisiones del plan original

Hoy es **día 14** del plan Julián. Decisiones que la pauta requiere:

| Decisión | Condición | Acción si SÍ |
|---|---|---|
| **C7 Retargeting** | ≥ 1.000 visits + ≥ 30 trials acumulados | Activar €90/día × 6 días |
| **Contingencia €1.000** | ≥ 2 campañas CPT < €3 | Santi propone, Julián aprueba en 24h |
| **Pausar campañas CPT 2x promedio** | Si alguna campaña tiene CPT 2× promedio del grupo | Pausar y reasignar |

(Cuando el token esté conectado, el dashboard te dirá automáticamente qué condiciones se cumplen).

---

## Después del lunes

Si todo va bien el lunes:
- **Martes**: deploy producción + invitamos al resto del equipo
- **Miércoles**: María Paula corre primer informe semanal con datos reales
- **Jueves**: Julián review · ajustes
- **Viernes**: cierre de mayo · reporte oficial · planning junio

---

## Si algo se daña

- Connector daemon caído: `npm run connector` en otra terminal
- Token Meta revocado: regenerar System User token (5 min)
- Dashboard no carga: `npm run dev` desde `dashboard-meta/`
- Logs: `_logs/` + `.data/connector.log`

---

## Cosas de seguridad

- Todos los tokens viven en `.env.local` (gitignored)
- Posthog / Ahrefs / GSC / GA4 son **READ-ONLY** · ninguna integración tiene permiso de modificar
- Meta Graph API solo lo ven Santi/Julián/Wendy en Config (rol admin estricto)
- Cuando deployemos a Vercel, las env vars van al dashboard de Vercel (no al repo)

---

Buen fin de semana. El lunes tenemos un sistema completo de pauta · SEO · AEO · contenido orgánico · diseño en una sola pantalla. 🚀
