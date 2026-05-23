# Informe de validación · suplantación por rol · 2026-05-23

Agente E (validador / impersonador). Solo lectura. Dev server vivo en :3000.

---

## 1 · Smoke tests endpoints

| Endpoint | HTTP | Notas |
|---|---|---|
| `GET /` | 200 | Shell renderiza |
| `GET /api/health` | 200 | `{ok:true, metaToken:false, gemini:true}` — Gemini OK, Meta NO configurado |
| `GET /api/connector-status` | 200 | `phase:"idle"`, `stalled:true` (2h sin updates) · esperado sin token |
| `GET /api/diary` | 200 | |
| `GET /api/ai-memory` | 200 | |
| `GET /api/meta-cache` | 200 | |
| `POST /api/gemini` (hola/1 palabra) | 200 | `{"text":"Hola"}` |
| `GET /api/meta?endpoint=act_…` | 500 | `META_TOKEN no configurado` — OK, comportamiento esperado |

Veredicto endpoints: todos verdes salvo Meta (falta token, esperado).

---

## 2 · Inspección por rol

### admin (santiago / julián / wendy) · 12 tabs

| Tab | Qué muestra | Claro no-técnico | Jerga sin tooltip | Datos |
|---|---|---|---|---|
| dashboard | KPIs + alertas (C2, C1, C3, día N) + funnel + daily summary | parcial | "CPT", "Plan B", "InitiateCheckout", "A2.1/A2.2" sin tooltip | seed + live mezclado |
| campanas | jerarquía 6 cards C1-C6, adsets expandibles, severity badges, sort | parcial | "ABO", "CR", "IC", "pacing %", "atención vs grupo" | seed por defecto · live tras refresh |
| estrategia | semáforo CPT (gauge), pacing, presupuesto, reglas Julián | parcial | "CPT Reg", "CPT Ico", "pacing daily req" | derivado de campaigns |
| paid | KPIs por plataforma (Meta live · Google/TikTok stub) | sí — etiqueta clara "stub" | "ROAS", "CTR" sin tooltip | live Meta · placeholder honesto Google/TikTok |
| anuncios | grid de creativos Meta con drawer, filtros, sort | sí (visual) | "CTR", "CPM" | live Meta (vacío sin token) |
| organico | grid IG+FB con engagement, comparativo | sí (visual) | "engagement rate" | live Meta (vacío sin token) |
| parrilla | calendar composer · plantillas · localStorage | sí | — | UI local |
| seo | KPIs SEO + keywords + on-page + backlinks | sí — "stub GSC" visible | "backlinks", "DR" | seed (placeholder honesto) |
| performance | funnel + LTV/CAC + payback + ROAS | parcial | "LTV", "CAC", "payback months", "retention W1/W4" sin tooltip | constants placeholder + campaigns vivos |
| open-bui | tldraw embebido + toolbar (Nuevo/Exportar/Reset) | sí | — | localStorage |
| informe | informe ejecutivo + Slack short + copy | sí | — | derivado |
| config | token Meta setup + memoria del agente + re-tour | sí | — | live |

**Score UX admin: 7 / 10** · navegación clara, agrupación lógica en 4 secciones del sidebar, pero la **jerga de pauta** (CPT, ABO, CR/IC, Plan B, A1.x adset code) está sin tooltips en dashboard/campanas/estrategia/performance.

### lead (María) · 11 tabs · todo lo de admin menos `config`

Subset razonable. María no toca token / memoria — correcto. Mismas frictions de jerga.

**Score UX lead: 7 / 10**

### content (Paula / Hernán) · 6 tabs · dashboard, campanas, anuncios, organico, parrilla, open-bui

Aquí hay un **problema**: el rol content ve `campanas` (con toda la jerga CPT/ABO/severity) pero NO ve `estrategia` ni `performance`. Una creadora de contenido entra a Campañas y se enfrenta a Severity, CPT vs grupo, pacing — no tiene contexto. Debería:
  - O bien que `campanas` tenga modo "simple" para content (solo "qué post está corriendo donde"),
  - O bien sacar `campanas` del set de content y agregar una tab "Mis creativos en pauta" que filtre por adset.

`open-bui` y `parrilla` son perfectos para content. `anuncios` y `organico` también — son visuales.

**Score UX content: 5 / 10** · expuestos a jerga de pauta que no es su trabajo.

---

## 3 · Onboarding

- **Welcome tour** (`components/onboarding/welcome-tour.tsx`): 5 slides — Welcome, Areas (4 grupos), Role (tabs visibles según rol), AI, Ready. Cubre las 4 áreas (Pauta / Contenido / Analítica / + Copiloto IA, falta "Configuración" pero solo admin la ve).
- **Botón Saltar**: presente en cada slide + Esc + X top-right. Funciona, escribe `bw_welcome_seen=1` en localStorage.
- **Persistencia**: correcta (storage key `bw_welcome_seen`). Re-disparable desde Config vía `triggerWelcomeAgain()`.
- **Role tour** (mini spotlight tras "Mostrarme alrededor"): apunta a `aside nav`, `main > div:first-of-type`, `[aria-label='Abrir asistente IA']`. Si un selector no existe lo salta — defensivo.
- **Orientado a no-técnicos**: parcial. Habla de "C7 Retargeting", "CPT thresholds", "ABO" como si todos los entendieran. El slide AI menciona "C2 saturada · subir a €30/día" en el ejemplo de memoria — no es accesible para alguien que recién aterriza.
- **Falta**: ningún slide explica qué es CPT / ABO / Plan B en lenguaje llano. Para `content` (Paula/Hernán) un mini-glosario sería oro.

---

## 4 · AI Dock + Memoria

- Dock se monta en `app/layout.tsx` (no condicional) → presente en TODAS las tabs ✔
- `contextual-prompts.ts` cubre las **12 tabs** (`dashboard, campanas, estrategia, anuncios, organico, parrilla, informe, config, paid, seo, performance, open-bui`) ✔
- `buildPlanContext(campaigns, daysElapsed, memory)` inyecta **reglas + entradas** al system prompt ✔
- Botón "Recordar" presente: cada mensaje bot tiene `onSaveMemory` → modal con topic+body → POST `/api/ai-memory` → re-emite `bw:memory-changed` ✔
- **Test C2 / Plan B**: enviado `question` + `system` simulando contexto, respuesta:
  > "C2 es la campaña MX_COMERCIO_WEB_MAY26 y su plan B para el día 7 es cambiar la optimización a InitiateCheckout si el CR es menor a 20."

  ✔ Gemini respeta el system prompt, menciona C2, Plan B y la regla del día 7.

---

## 5 · Theme

`app/globals.css` define `:root` (dark) y `.light`. Variables completas para light: contraste alto (background `240 5% 98%` vs foreground `240 10% 12%`), brand colors -5% saturación, sombras tinted con `--fx-shadow-tint`, overlays con `--fx-aurora`, `--fx-spotlight`, `--fx-selection` por theme.

Grep `text-white|bg-black|bg-white` → 15 hits / 9 archivos. **Todos** sobre fondos con gradient violeta-cyan (badges, buttons gradient, AI dock avatar, logo "b") — son correctos en ambos temas. **No hay riesgo de elementos perdidos en light.** ✔

---

## 6 · Meta API caching + date range

- `lib/store.tsx`: dos capas — `rawCampaigns/rawAdsets/daily` (período completo) y `campaigns/adsets` (filtrados client-side por `dateRange`). El picker no re-fetchea ✔
- `lib/hooks/use-meta-fetch.ts`: SWR pattern · localStorage TTL 5min · server cache aparte · `refresh()` añade `_nocache=1` para bypass servidor ✔
- `app/api/meta/route.ts`: cachea solo endpoints estables (`/insights`, `/ads`, `/adsets`, `/campaigns`, `/media`, `/posts`, `/feed`, `/photos`, `/adcreatives`), responde `X-Cache: HIT/MISS/BYPASS` ✔

Veredicto: caché doble correcta, filtro de fecha sin re-fetch correcto.

---

## 7 · Open BUI

- `package.json`: `tldraw ^3.15.6` instalado ✔
- `canvas.tsx`: dynamic import con `Function("m", "return import(m)")` para evitar fallo de build si el paquete falta — defensivo y robusto. Si tldraw existe monta `<Tldraw persistenceKey="bw_open_bui_doc" />` ✔
- Auto-save: tldraw v3 lo hace nativamente vía `persistenceKey` en localStorage. UI muestra "Auto-save activo · localStorage" ✔
- Botones presentes: Nuevo (confirm + limpia `TLDRAW_*` y `bw_open_bui_doc`), Exportar (alert con instrucciones para click derecho → Export as), Reset (re-usa newDoc) ✔
- ⚠ "Exportar" no exporta directamente — es un alert con instrucciones manuales. Funcional pero no auto-mático.

---

## 8 · Qué jala / qué no

| Feature | Estado | Notas |
|---|---|---|
| Login multi-rol | ✅ | 6 usuarios · 3 roles · gating por ROLE_TABS |
| Welcome tour | ✅ | 5 slides · Saltar / Esc / re-trigger desde Config |
| Role tour | ⚠ | spotlight sobre sidebar/topbar/dock · selectores frágiles ("aside nav") |
| AI Dock + contextual prompts | ✅ | FAB · 12 tabs cubiertas · drag · Ctrl/Cmd+K |
| AI Memory (reglas + entradas) | ✅ | persiste en `.data/ai-memory.json` · inyecta en system prompt |
| Theme toggle dark/light | ✅ | light con contraste y overlays adaptados |
| Date range picker client-side | ✅ | no re-fetch · filtra rawCampaigns/adsets |
| Connector daemon + pill | ⚠ | idle/stalled sin token — esperado, pero `stalled:true` puede confundir |
| Meta API caching (cliente + servidor) | ✅ | SWR cliente + cache servidor + `_nocache=1` |
| /api/diary | ✅ | 200 |
| /api/ai-memory | ✅ | GET / POST / DELETE |
| /api/setup/meta-token | ⚠ | no probado en este pase (no quise tocar token); endpoint existe |
| Campañas (KPIs + atención + tabla + comparativos) | ✅ | rico pero con jerga sin tooltips |
| Anuncios drawer + cache | ✅ | cache vía use-ads · drawer con detalle |
| Orgánico IG + FB + comparativo | ✅ | use-organic hook |
| Parrilla composer + plantillas + persistencia | ✅ | localStorage `bw_parrilla_posts` |
| Informe + Slack short | ✅ | regenera on change · botón copy |
| Paid Media (Google / TikTok) | 🔵 | placeholder honesto con badge `stub` y ConnectModal |
| SEO (GSC / Ahrefs) | 🔵 | placeholder · seed visible |
| Performance (funnel · unit econ · ROAS) | ⚠ | constantes hardcoded (TICKET_EST=60, LTV=180, etc.) sin marcar como "estimación" suficientemente fuerte |
| Open BUI tldraw | ✅ | montado · auto-save · botones presentes |
| Config (token + memoria + re-tour) | ✅ | |

---

## 9 · Top 5 recomendaciones (orden de prioridad)

1. **Glosario / tooltips de jerga en dashboard, campanas, estrategia, performance**. Términos a cubrir mínimo: CPT (Reg / Ico), ABO, Plan B, C7, pacing %, atención vs grupo, LTV/CAC, payback, ROAS. Componente `ExplainedMetric` ya existe — extenderlo a cada KPI y cada cell de tabla.
2. **Re-mapear acceso del rol `content`**: sacar `campanas` o agregar un modo "simple" sin severity/ABO/CPT — Paula y Hernán no necesitan ver "C2 atención vs grupo +18%". Suficiente con "C2 está activa, tu post X corre en C2.adset3".
3. **Welcome tour slide nuevo**: "Glosario rápido" entre slide Areas y slide Role · 6 chips (CPT, ABO, Plan B, CR, IC, Pacing) con micro-definición · 30 segundos extra.
4. **Performance: marcar fuerte que `TICKET_EST/LTV/PAYBACK/RETENTION` son estimaciones**. Hoy son constantes en código. Agregar un badge "Estimación · editar en Config" y permitir override desde Config (sería 30 min de trabajo).
5. **Open BUI: implementar "Exportar" real** (tldraw v3 expone `editor.exportAs(...)` para PNG/SVG). Hoy es alert con instrucciones — funcional pero ruidoso.

---

## Veredicto

🟡 **LISTO CON FRICCIONES**

El sistema funciona end-to-end: endpoints verdes, roles bien gateados, theme limpio, AI Dock con memoria y contextual prompts, tldraw montado, caching doble, date range sin re-fetch. Onboarding cubre las áreas.

Lo que arrastra:
- Jerga de pauta sin tooltips para usuarios no-técnicos (impacta sobre todo a `content`)
- Rol `content` ve `campanas` con datos que no le tocan
- Welcome tour usa jerga ("C7 Retargeting", "CPT thresholds") como si fueran obvios
- Performance con constantes hardcoded sin override
- Open BUI export es manual (alert)
- Connector daemon stalled cuando no hay token (mensaje puede confundir)

Sin token Meta no se puede validar el path live de campañas / anuncios / orgánico — solo seed. Una vez Santiago cargue el token, recomendable un segundo pase para confirmar caching real y refresh().
