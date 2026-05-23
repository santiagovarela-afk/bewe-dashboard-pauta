# Bewe Dashboard de Pauta · v2 (OS)

Next.js 15 + Tailwind + Motion + GSAP + Lenis · cult-ui-inspired UI · dark-first.

## Inicio rápido

```bash
# 1. (Solo la primera vez) instalar deps
npm install

# 2. añadir tokens en .env.local
#    META_TOKEN=EAA...   (System User Token de Meta Business)
#    GEMINI_API_KEY=...  (opcional, agente IA)

# 3. arrancar dev
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) e iniciar sesión con cualquier cuenta de `lib/config.ts → USERS`.

## Estructura

```
app/
  layout.tsx          · root layout · fonts · Lenis · Toaster
  page.tsx            · DashboardProvider + AppShell
  globals.css         · tokens + utilidades (.text-aurora, .glass, .bg-grid…)
  api/
    meta/route.ts     · proxy seguro Graph API (whitelist endpoints)
    gemini/route.ts   · proxy Gemini Flash
    health/route.ts   · GET → estado de tokens

components/
  shell/              · sidebar + topbar + app-shell (animaciones de transición)
  auth/login-screen   · login premium con aurora + glass
  tabs/               · 9 tabs (Dashboard, Campañas, Estrategia, …)
  shared/             · SectionHeader, KpiCard
  ui/                 · shadcn primitives (Button, Card, Input, Badge, Select, …)
  fx/                 · cult-ui style: SpotlightCard, TextureCard, AnimatedNumber,
                       Sparkline, Gauge, Reveal/Stagger, Magnetic, AuroraBg

lib/
  config.ts           · plan, mapeo campañas, USERS, ROLE_TABS, TABS
  types.ts            · interfaces Campaign / Adset
  seed-data.ts        · snapshot real (via MCP, 1–23 may 2026)
  store.tsx           · React Context: estado + refresh() de Meta
  meta-api.ts         · cliente server-side
  selectors.ts        · computeMetrics + sparkline trend
  plan-context.ts     · system prompt Gemini (plan + datos vivos)
  utils.ts            · cn, fmt.eur/pct/int/short, cptTone, ctrTone…

_legacy/              · backup del v1 (index.html + api/meta.js + vercel.json)
```

## Tokens

| Variable | Dónde se usa | Cómo obtener |
|---|---|---|
| `META_TOKEN` | `app/api/meta/route.ts` | Meta Business → Configuración → Usuarios del sistema → "Generar token" con permisos `ads_read`, `ads_management`, `pages_read_engagement`, `pages_show_list`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`. Marcar "Never expires". |
| `GEMINI_API_KEY` | `app/api/gemini/route.ts` | Gratis en [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). |

Ambos viven sólo en `.env.local`, nunca se envían al navegador. El cliente llama a `/api/meta` y `/api/gemini`; el proxy adjunta el token y reenvía a Graph/Gemini.

## Diseño

- **Dark first** (`html.dark` siempre activo).
- Paleta: violeta eléctrico · cyan · lime · ember (definidos en `globals.css`).
- Tipografía: Inter (sans) + JetBrains Mono (números, IDs, código).
- Animaciones: Motion (entrance + AnimatePresence + spring counts), GSAP disponible, Lenis (smooth scroll global).
- Componentes premium estilo cult/ui: SpotlightCard (radial-gradient seguidor de cursor), TextureCard (grain overlay + gradient line), GradientHeading aurora, Gauge SVG con stroke-dashoffset spring, Sparklines animados, Aurora background en login.

## Tabs

| Tab | Notas |
|---|---|
| **Dashboard** | Hero con aurora · 4 stats grandes · 6 KPI cards con count-up + sparklines · alertas con spotlight · funnel de barras animadas · timeline lateral. |
| **Campañas** | 6 cards con spotlight + mini-funnel + pacing bar. Click expande tabla de adsets (rows con stagger). |
| **Estrategia** | 4 gauges (CPT Reg/IC, Budget, Tiempo). Pacing + proyección. Reglas de Julián con tarjetas codificadas por estado. Análisis por campaña. |
| **Anuncios** | Grid de creativos con thumb hover-zoom. Filtro por campaña. "Cargar desde Meta" hace fetch via `/api/meta`. |
| **Orgánico** | Toggle IG/FB. Grid de posts con permalink. Stats agregadas en header. |
| **Parrilla** | Calendario mes actual, drawer composer (IG/FB toggle, caption, fecha). Toast al programar. |
| **Informe** | Texto generado automáticamente al entrar. Copiar / regenerar / descargar `.txt`. |
| **Agente IA** | Chat con bubbles, chips de preguntas, typing dots, Gemini en server-side. |
| **Config** | Estado de `META_TOKEN` y `GEMINI_API_KEY` via `/api/health`. IDs de cuenta. Sesión. |

## Datos semilla

`lib/seed-data.ts` contiene el snapshot real traído via MCP el 2026-05-22 (período 1–23 may 2026). Hasta que pulses "Actualizar" en el topbar (que requiere `META_TOKEN`), el dashboard muestra estos números:

- C1 MX_BELLEZA · ACTIVE · €332.59 · 50 CR · CPT €6.65 · 🚨 crítico
- C2 MX_COMERCIO · ACTIVE · €272.67 · 24 CR · CPT €11.36 · 🚨 crítico
- C3 MX_SERVICIOS · PAUSED · €214.37 · 558 IC · ⚠ anomalía pixel
- C4 LATAM_BELLEZA · ACTIVE · €227.83 · 41 CR · CPT €5.56 · 🚨 crítico
- C5 LATAM_COMERCIO · PAUSED · €186.91 · 399 IC · CPT €0.47 · ✓
- C6 LATAM_SERVICIOS · PAUSED · €161.53 · 487 IC · CPT €0.33 · ✓

## Para tu equipo · onboarding del token Meta

Sigue estos pasos exactos cuando tu equipo (o tú) ya tengan el token Meta listo para conectarlo:

1. **Genera el System User Token** en [business.facebook.com](https://business.facebook.com) → **Configuración del negocio** → **Usuarios del sistema** → selecciona el usuario → **Generar token nuevo**.
   - Permisos mínimos: `ads_read`.
   - Permisos opcionales recomendados: `ads_management`, `pages_read_engagement`, `pages_show_list`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.
   - Marca la opción **"Never expires"** para evitar renovaciones manuales.
2. **Copia el token** (empieza con `EAA…`). Guárdalo en tu gestor de contraseñas — Meta sólo lo muestra una vez.
3. **Abre el archivo `.env.local`** en la raíz del proyecto. Si no existe, créalo a partir de la plantilla:
   ```bash
   cp .env.local.example .env.local
   ```
4. **Pega el token** en la línea `META_TOKEN=`:
   ```
   META_TOKEN=EAA...el-token-completo
   ```
   Guarda el archivo. `.env.local` está en `.gitignore` — no se sube al repo.
5. **Reinicia el servidor de desarrollo**: en la terminal donde corre `npm run dev`, pulsa `Ctrl+C` y vuelve a ejecutar:
   ```bash
   npm run dev
   ```
6. **Abre el dashboard** en [http://localhost:3000](http://localhost:3000) e inicia sesión. Pulsa el botón **"Actualizar"** en la barra superior. Deberías ver los datos en vivo.

Si algo falla, abre la tab **Config** del dashboard — muestra el estado actual de `META_TOKEN` y `GEMINI_API_KEY` consultando `/api/health`. Si el token aparece como no configurado, repite el paso 5.

## Deploy a Vercel (opcional)

Cuando decidan publicar el dashboard:

1. **Instala el CLI** (una sola vez por máquina):
   ```bash
   npm install -g vercel
   ```
2. **Linkea el proyecto** desde la raíz:
   ```bash
   vercel link
   ```
3. **Configura las variables de entorno** en el dashboard de Vercel → **Project Settings** → **Environment Variables**. Para cada una marca los tres entornos (**Production**, **Preview**, **Development**):
   - `META_TOKEN`
   - `GEMINI_API_KEY`
4. **Deploy a producción**:
   ```bash
   vercel --prod
   ```

Las route handlers en `app/api/**` corren como funciones serverless Node. Los headers de seguridad están en `vercel.json` (X-Frame-Options DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy sin cámara/mic/geo). HSTS lo añade Vercel automáticamente — no lo dupliques.

> Aviso: `/api/diary` persiste en disco bajo `.data/diary.json`. En Vercel ese filesystem es **efímero** (no se garantiza entre invocaciones). Si quieren histórico persistente en producción, migrar a KV/Postgres/Blob — para uso local o cron en un VPS funciona tal cual.

## Endpoint diario · `/api/diary`

Server-side · persistencia en `.data/diary.json` (creado automáticamente, en `.gitignore`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/diary` | Devuelve `{ entries: DiaryEntry[] }` ordenado por fecha descendente. |
| `POST` | `/api/diary` | Body JSON `{ date: "YYYY-MM-DD", spend, totalCR, totalIC, cptReg, cptIco, notes? }`. Crea o sobrescribe la entrada del día. |
| `DELETE` | `/api/diary?date=YYYY-MM-DD` | Borra la entrada de esa fecha (idempotente). |

Útil para automatizar el snapshot del día desde un cron job (`curl -X POST localhost:3000/api/diary -H 'content-type: application/json' -d '{…}'`). El cliente del dashboard sigue usando `lib/diary.ts` con localStorage — son almacenes paralelos.

## Comandos

```bash
npm run dev          # dev local (Turbopack, puerto 3000)
npm run build        # build de producción
npm run start        # corre el build (puerto 3000)
npm run typecheck    # TypeScript check sin emitir
npm run lint         # ESLint
npm run clean        # borra .next y .data (cross-platform)
```

## Verificado

- ✅ Compila sin errores (`npx tsc --noEmit`)
- ✅ Sirve HTTP 200 en `/`
- ✅ `/api/health` responde con estado de tokens
- ✅ `/api/meta?endpoint=…` responde 500 con mensaje claro si no hay token
- ✅ `/api/diary` GET/POST/DELETE operativo con persistencia en `.data/diary.json`
- ✅ Hot reload activo (Turbopack)
