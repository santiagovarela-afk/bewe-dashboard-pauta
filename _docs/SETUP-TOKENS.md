# Setup de Tokens · Guía paso a paso

> Esta es **tu** lista de hoy. Cuando termines cada uno, pégame el token y lo conecto al dashboard.

Orden recomendado por prioridad:

1. **Meta System User Token** ← lo más urgente · 10 min
2. **Google Search Console** ← gratis, necesario para SEO · 5 min
3. **Google Analytics 4** ← gratis · 5 min
4. **PageSpeed Insights API** ← Core Web Vitals · 2 min
5. **Posthog Personal API Key** ← solo si quieren analítica producto · 5 min · OPCIONAL
6. **TikTok Business** ← solo si tienen ads activos · 30 min · OPCIONAL
7. **LinkedIn Marketing** ← solo si tienen Company Page con ads · 1 h · OPCIONAL

---

## 1 · META SYSTEM USER TOKEN

**Por qué este y no el de tu usuario**: el del usuario expira a los 60 días. El System User Token NO expira (long-lived) y es el mismo para todo el equipo. Lo configuras 1 vez y olvidas.

### 1.1 · Crear la App de Meta (si no existe ya)

1. Ve a https://developers.facebook.com/apps
2. Botón verde **"Crear app"**
3. **"¿Qué quieres lograr con tu app?"** → marcar **"Otro"** → Siguiente
4. **Tipo de app** → marcar **"Empresa"** → Siguiente
5. **Detalles**:
   - Nombre: `Bewe Pauta OS`
   - Email de contacto: el tuyo (`santiago.varela@bewe.io`)
   - **Cuenta de Business Manager**: selecciona la de Bewe
6. **Crear app**
7. Te lleva al dashboard de la app. Anota el **App ID** (arriba a la izquierda, número largo).

### 1.2 · Añadir productos a la app

1. En el menú izquierdo del dashboard de la app → **"Añadir productos"**
2. Busca y añade:
   - ✅ **Marketing API**
   - ✅ **Facebook Login for Business**
3. **No** configures nada de momento · solo deben aparecer en el menú izquierdo.

### 1.3 · Configurar la App con tu Business Manager

1. Ve a https://business.facebook.com/settings
2. **Configuración del negocio** → **Cuentas** → **Apps**
3. Botón **"Añadir"** → **"Conectar una app existente"** → pega el App ID del paso 1.7
4. Si te pide aceptar términos, acepta.

### 1.4 · Crear (o usar) el System User

1. https://business.facebook.com/settings/system-users
2. Botón **"Añadir"**
3. **Nombre**: `bewe-pauta-os` (sin espacios, sin tildes)
4. **Rol del sistema**: **Administrador**
5. **Crear usuario del sistema**

### 1.5 · Asignar activos al System User

1. Estando en el System User recién creado, click en **"Añadir activos"**
2. Marca todos estos con **acceso completo (control total)**:
   - ✅ **Cuentas publicitarias** → `act_929824683759001`
   - ✅ **Páginas** → la página de Bewe (Facebook)
   - ✅ **Instagram** → cuenta business de Bewe
   - ✅ **Píxeles / datasets** → el de Bewe (el de eventos web)
   - ✅ **Catálogos** → si los tienen
   - ✅ **Apps** → la app que creaste en paso 1.1
3. **Guardar cambios**

### 1.6 · Generar el token

1. Sigue dentro del System User → botón **"Generar nuevo token"**
2. **App**: selecciona `Bewe Pauta OS`
3. **Caducidad del token**: ⚠ **NUNCA** ← MUY importante, no marques "60 días"
4. **Permisos** · marca TODOS estos (algunos no estarán en la lista hasta que añadas más productos en la app — empieza con los disponibles):

   **Ads · obligatorios**
   - ✅ `ads_read`
   - ✅ `ads_management`
   - ✅ `business_management`
   - ✅ `read_insights`

   **Páginas Facebook · publicar y leer**
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `pages_read_user_content`
   - ✅ `pages_manage_posts`
   - ✅ `pages_manage_metadata`

   **Instagram · publicar y métricas**
   - ✅ `instagram_basic`
   - ✅ `instagram_manage_insights`
   - ✅ `instagram_content_publish`
   - ✅ `instagram_manage_comments`

   **Catálogos · opcional**
   - ✅ `catalog_management` (si tienen catálogo)

5. **Generar token**
6. **COPIA EL TOKEN INMEDIATAMENTE** y guárdalo en tu password manager. Meta SOLO lo muestra esta vez. Si lo pierdes, regenerar.

### 1.7 · Pasármelo

3 opciones, elige la que prefieras:

**Opción A · UI** (más rápida)
- Abre el dashboard → tab **Config** → caja morada "Configurar token desde aquí"
- Pega → Validar y guardar
- Pill arriba pasa a verde "Meta conectado" ✓

**Opción B · CLI**
```bash
cd "C:\Users\Svare\OneDrive\Escritorio\Pauta new Bewe - OS\dashboard-meta"
npm run setup:meta
```

**Opción C · Manual**
- Edita `.env.local` y agrega `META_TOKEN=EAA…tutoken`
- El connector daemon lo detecta en 4 s

---

## 2 · GOOGLE SEARCH CONSOLE (GSC)

**Para qué**: ver qué keywords te traen tráfico orgánico, qué páginas rankean, CTR, posición promedio. Esencial para SEO.

### 2.1 · Verificar bewe.ai

Si ya está verificado (María Paula te lo confirma), salta a 2.2.

Si no:
1. https://search.google.com/search-console
2. **Añadir propiedad** → **Dominio** → `bewe.ai`
3. Google te pide validar con DNS · te da un TXT record que pegas en el DNS de bewe.ai
4. Espera ~24h (a veces minutos) y verifica.

### 2.2 · Conectar al dashboard (cuando esté lista nuestra integración)

GSC tiene **API gratuita** pero requiere autenticación OAuth. Plan:
- Yo te genero un script `npm run setup:gsc` (lo voy a dejar listo) que te abre el navegador, te logueas con la cuenta admin de la propiedad, autoriza, y el token queda guardado en `.env.local` como `GSC_REFRESH_TOKEN`.
- Te paso instrucciones detalladas el lunes cuando lo tengas verificado.

**Lo que necesito YA de tu lado**:
- Confirmar que bewe.ai está verificado en GSC
- Que tu cuenta `santiago.varela@bewe.io` (o la de admin) tenga rol **"Propietario"** o **"Usuario delegado · pleno"** en la propiedad
- Pasarme la **URL exacta** de la propiedad como aparece en GSC (ej. `sc-domain:bewe.ai` o `https://bewe.ai`)

---

## 3 · GOOGLE ANALYTICS 4 (GA4)

**Para qué**: sessions, conversions, source/medium, bounce rate. Datos del comportamiento en bewe.ai.

### 3.1 · Tu cuenta GA4

1. https://analytics.google.com
2. Verifica que tienes propiedad GA4 (no Universal Analytics · ese ya murió).
3. Si NO la tienen: Admin → **"Crear propiedad"** → tipo Web → tag de measurement → instalar en bewe.ai (con GTM o directo).

### 3.2 · Datos que necesito

Ve a Admin → en la propiedad GA4 → **"Detalles de la propiedad"**:
- **Property ID** (un número de 9 dígitos · ej. `123456789`)
- **Measurement ID** (formato `G-XXXXXXXXXX`)

Pásamelos.

### 3.3 · Conectar (lunes)

Igual que GSC, va por OAuth con un script `npm run setup:ga`. Si no quieres OAuth, hay una alternativa con **Service Account** (más seguro, no expira):
- En Google Cloud Console creas un service account, le das role "GA4 Viewer", descargas el JSON.
- Me pasas ese JSON (es 1 archivo de 2 KB), lo pongo en `.env.local`.
- Listo · GA4 conectado para siempre.

Te guío el lunes en vivo si prefieres.

---

## 4 · PAGESPEED INSIGHTS API (Core Web Vitals)

**Para qué**: medir LCP, INP, CLS de bewe.ai. Métricas críticas de SEO.

### 4.1 · Sacar la API key (2 minutos)

1. https://console.cloud.google.com
2. Crea o selecciona el proyecto "Bewe"
3. APIs & Services → **"Library"** → busca **"PageSpeed Insights API"** → habilítala
4. APIs & Services → **"Credentials"** → **"Create credentials"** → **"API key"**
5. Te da una key tipo `AIzaSy…` — cópiala
6. (Opcional) restringe la key a solo la API de PageSpeed (más seguro)

### 4.2 · Pásamela

Pégala como `PAGESPEED_API_KEY` en `.env.local` o me la pasas y la pongo yo.

---

## 5 · POSTHOG · OPCIONAL · solo CONSULTOR (READ-ONLY)

> Como mencionaste que te daba miedo, esta integración es **estrictamente de lectura**. Ningún endpoint del dashboard puede modificar tu Posthog. Te lo explico paso a paso.

### 5.1 · Qué es Posthog y por qué quizás lo quieras

Posthog es un product analytics tool (open source) que captura eventos del usuario en bewe.ai (clicks, pageviews, signups, trial activations, etc.). Si ya lo usan, tu dashboard puede pull esos eventos para complementar el funnel real (más fiel que el Meta pixel).

**Si NO lo usan**: salta este paso. No es urgente.

### 5.2 · Sacar la Personal API Key (read-only)

1. Entra a tu Posthog (ej. `app.posthog.com` o el dominio self-hosted que tengan)
2. Click en tu avatar arriba a la derecha → **"Account settings"**
3. Pestaña **"Personal API keys"**
4. Botón **"Create personal API key"**
5. Configuración:
   - **Label**: `bewe-dashboard-readonly`
   - **Scopes** (esto es lo importante para que NO ejecute nada):
     - ✅ `insight:read` · leer insights
     - ✅ `query:read` · correr queries
     - ✅ `dashboard:read` · leer dashboards
     - ✅ `event_definition:read` · leer definiciones de eventos
     - ❌ NO marques ningún `:write`
6. **Create**
7. Te muestra la key una sola vez · cópiala

### 5.3 · Adicional

Necesito también:
- **Project ID** (número · está en URL cuando ves un dashboard de Posthog: `app.posthog.com/project/12345`)
- **Host** (es `https://us.i.posthog.com` o `https://eu.i.posthog.com` · mira la URL al loguearte)

### 5.4 · Pásamelo

Te dejo `_docs/POSTHOG.md` el lunes con instrucciones si decides activarlo. Mientras tanto, si me lo pasas, configuro `POSTHOG_API_KEY` + `POSTHOG_HOST` + `POSTHOG_PROJECT_ID` en el dashboard, **NUNCA con scopes de escritura**.

---

## 6 · TIKTOK BUSINESS · OPCIONAL · solo si tienen ads activos

### 6.1 · Pre-requisitos
- Cuenta TikTok Ads activa
- Ser admin en TikTok Business Center

### 6.2 · Crear la app (30 min, requiere aprobación)

1. https://business-api.tiktok.com/portal
2. Loguéate con tu cuenta TikTok Business
3. **"My Apps"** → **"Create new app"**
4. Completa info: nombre `Bewe Pauta OS`, descripción `Internal dashboard for Bewe ad performance tracking`, categoría `Reporting & Analytics`
5. **Scopes** que necesitas:
   - `Advertiser Read` (ver campañas y métricas)
   - `Audience Read` (ver audiencias)
   - `Creative Read` (ver creativos)
   - `Report Read` (analytics)
6. **App URL**: pon `http://localhost:3000` (más adelante cambiamos al dominio del deploy)
7. **Redirect URL**: `http://localhost:3000/api/setup/tiktok-callback` (yo lo construyo después)
8. Envía a revisión. TikTok tarda **24-72 h** en aprobar.
9. Una vez aprobada, te dan un **App ID** y un **App Secret**. Me los pasas y construyo el flujo OAuth.

### 6.3 · Pásame YA si los tienen

- **Advertiser ID** de TikTok Business (en business.tiktok.com → la cuenta de ads → Settings)
- Confirmación de que hay ads activos (si no, no vale la pena meter trabajo aquí)

---

## 7 · LINKEDIN MARKETING · OPCIONAL · solo si tienen Company Page con ads

> LinkedIn es el más friccionoso de todos. Solo si tienen ads B2B activos. Si no, **skip**.

### 7.1 · Pre-requisitos
- Company Page de Bewe en LinkedIn
- LinkedIn Ad Account vinculado
- Ser admin de ambas

### 7.2 · Crear LinkedIn Developer App (1 h, requiere review)

1. https://www.linkedin.com/developers/apps
2. **"Create app"**
3. Completa:
   - App name: `Bewe Pauta OS`
   - Company: selecciona la Company Page de Bewe (DEBE estar vinculada)
   - Privacy policy URL: ponemos `https://bewe.ai/privacy` (María Paula confirma URL)
   - App logo
4. **Auth** tab → agregar `http://localhost:3000/api/setup/linkedin-callback` como Redirect URL
5. **Products** tab → solicitar acceso a:
   - **Marketing Developer Platform**
   - **Advertising API**
6. LinkedIn pide info adicional sobre uso. Responder honestamente: dashboard interno read-only para reporting.
7. Espera **3-10 días** de review.

### 7.3 · Si ya tienen acceso

Pásame:
- **Client ID** + **Client Secret**
- **Organization URN** (el ID de la Company Page: `urn:li:organization:XXXXXXXX`)

Y construyo el OAuth flow el lunes.

### 7.4 · Si no tienen acceso

**Skip por ahora**. Lo activamos cuando esté el approval o si LinkedIn pasa a ser relevante. No vale la pena bloquear todo por esto.

---

## RESUMEN · qué tienes que sacar hoy/lunes

| # | Token | Tiempo | Quien | Estado |
|---|---|---|---|---|
| 1 | **Meta System User Token** | 10 min | Tú | ⏳ HACER YA |
| 2 | **GSC verificación** | 5 min | Tú + María Paula | ⏳ HACER YA (verificar bewe.ai) |
| 3 | **GA4 Property/Measurement ID** | 2 min | Tú o María Paula | ⏳ HACER YA |
| 4 | **PageSpeed API Key** | 2 min | Tú | ⏳ HACER YA |
| 5 | **Posthog Personal Key** | 5 min | Tú | 🟡 Si lo usan |
| 6 | **TikTok app + Advertiser ID** | 30 min + 72h review | Tú | 🟡 Solo si hay ads activos |
| 7 | **LinkedIn app + Org URN** | 1 h + 10 días review | Tú | 🟡 Solo si hay ads activos |

**Lo no urgente puede esperar al lunes** cuando hablemos con María Paula. Lo esencial hoy es **el Meta token**.
