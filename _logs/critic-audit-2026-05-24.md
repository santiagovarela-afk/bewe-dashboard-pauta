# Auditoría crítica · 7 cambios · 2026-05-24

## Score por cambio

| # | Cambio | Score | Bugs |
|---|---|---|---|
| 1 | Sidebar reorg | A | 0 |
| 2 | Dashboard fixes | B | 1 menor |
| 3 | Anuncios Pro | A | 0 |
| 4 | Estrategia expandida | A | 0 |
| 5 | Parrilla Metricool | C | 1 (afirmación falsa del agente) |
| 6 | Open Design fix | B | 1 menor |
| 7 | Tour REAL | A | 0 |

## Bugs críticos encontrados

- **Parrilla · idea-generator NO funciona offline.** El agente afirmó "composer funciona sin Gemini". Falso: `components/parrilla/idea-generator.tsx:94` hace `fetch("/api/gemini", ...)` y si falla setea `error`. No hay fallback con `templates.ts`. Si `GEMINI_API_KEY` no está o cuota agotada → la UI muestra error y no genera nada. La afirmación del agente es engañosa.
- **Glossary incompleto vs Dashboard.** `lib/glossary.ts:12-105` define `cpt`, `cr`, `ic`, `ctr`, `cpm`, `roas`, etc., pero NO tiene entradas dedicadas para `cpl`, `cpic`, `cptrial`. En `tab-dashboard.tsx:232` el tooltip CPL reusa `GLOSSARY.cpt.long` (texto habla de "trial" no de "lead") → mensaje incorrecto al usuario. Bajo riesgo pero inconsistente con el cambio 2.

## Inconsistencias entre cambios

- **Persona Mark/Lúa no impacta la generación AI.** El agente cambio 6 dijo "usa correctamente el persona Mark/Lúa". `tab-open-bui.tsx:40` lee `aiPersona` del store y lo muestra como `personaLabel` en el botón, pero `app/api/design/generate/route.ts:29-60` NO recibe ni usa la persona. El prompt no cambia entre Mark y Lúa. Es decoración cosmética.
- **Sidebar reorg (cambio 1) coherente con Tour (cambio 7):** `lib/config.ts:181-194` define orden Pauta → Contenido → Analítica → Admin con "Anuncios" en Pauta, "Open Design" en Contenido, "SEO+AEO" en Analítica. `welcome-tour.tsx:325-338` (TAB_ORDER) replica el mismo orden. ✓ Coherente.
- **CPT vs CPL/CPIC label drift.** El cambio 2 introduce CPL/CPIC en KPIs (`tab-dashboard.tsx:226-265`) y embudo (`selectors.ts:278-321`), pero `selectors.ts` aún exporta el interface `DashboardMetrics` con campos `cptReg`/`cptIco` (no renombrados) y `selectors.ts:144-151` sigue mostrando "CPT €X" en `suggestedAction`. Inconsistencia de naming interno aunque la UI muestre los labels correctos.

## Endpoints en vivo

- `GET /` → 200 ✓
- `GET /api/health` → 200 ✓
- `GET /api/connector-status` → 200 ✓
- `GET /api/ai-memory` → 200 ✓
- `GET /api/meta?endpoint=act_929824683759001&fields=name` → 200 ✓

## Validaciones específicas

- **Dashboard banner pre-12-may:** `selectors.ts:373` (`includesPreLaunch: from < "2026-05-12"`) + `tab-dashboard.tsx:81-101` conditional. Funciona correctamente cuando `dateRange.from` < 12-may.
- **Anuncios `getAdAlerts()`:** `components/anuncios/ad-alerts.ts:86-184` cubre 7 casos: `freq_critical` (>3), `freq_high` (>2), `ctr_bot` (>15%), `ctr_low` (<1% c/ >1000 impr), `spend_no_conv` (>€50 sin conv), `cpr_high` (>€15), `cpm_high` (>€12), `winner` (≥5 conv y CPR ≤€6). ✓ Cubre los 7 + winner extra.
- **Open Design canvas CSS order:** `components/open-bui/canvas.tsx:23-32` carga `tldraw/tldraw.css` con `await` ANTES de importar el módulo `tldraw`. Orden correcto. ✓
- **Tour role filter:** `welcome-tour.tsx:355-361` filtra `TAB_ORDER` por `ROLE_TABS[role]`. Para `content` → solo 5 tabs (dashboard, anuncios, organico, parrilla, open-bui) → total 10 slides. ✓ Correcto.

## Recomendaciones top 5

1. **Parrilla:** agregar fallback offline en `idea-generator.tsx` (usar `templates.ts` cuando `/api/gemini` falle) — o quitar la afirmación falsa en el README del agente.
2. **Glossary:** añadir entradas `cpl`, `cpic`, `cptrial` en `lib/glossary.ts` para tooltips del dashboard fieles a la nueva taxonomía.
3. **Open Design:** propagar `aiPersona` a `/api/design/generate` para que el prompt cambie de tono Mark (cálido directo) vs Lúa (cálido femenino) — actualmente solo es etiqueta.
4. **Selectors:** renombrar `cptReg`/`cptIco` → `cpl`/`cpic` en `DashboardMetrics` para alinear naming interno con UI (refactor mecánico, no rompe lógica).
5. **`suggestedAction()`:** strings "CPT €X" en `lib/selectors.ts:144,151` deberían decir "CPL" / "CPIC" según evento de la campaña.

## Veredicto

🟡 **Amarillo**

5 de 7 cambios sólidos (sidebar, anuncios, estrategia, open-design canvas-fix, tour). 2 con detalles importantes: cambio 5 (Parrilla) tiene afirmación falsa del agente sobre offline mode, y cambio 6 (Open Design) tiene la persona desconectada del backend. Ningún bug compromete renderizado · todos los endpoints responden 200 · no hay imports rotos.
