# Deploy a Vercel · paso a paso

> Tiempo total: ~20 minutos. La primera vez tarda más por el setup de
> las **20+ env vars** (todo lo sensible está en env, NO en el código).

## Pre-requisitos

- Cuenta GitHub con acceso al repo `santiagovarela-afk/bewe-dashboard-pauta`
- Email para crear cuenta Vercel
- Tu **META_TOKEN** + **GEMINI_API_KEY**
- Las 6 contraseñas de usuarios (guardadas en `_docs/_internal/credentials.md` · local)
- IDs reales de Meta account / page / IG
- IDs reales de las 6 campañas activas

---

## Paso 1 · Crear cuenta Vercel y conectar GitHub

1. Ve a [vercel.com/signup](https://vercel.com/signup)
2. Click **"Continue with GitHub"** · autorizar
3. Te lleva a tu dashboard de Vercel

---

## Paso 2 · Importar el proyecto

1. **"Add New..."** → **"Project"**
2. Buscá `bewe-dashboard-pauta` → **"Import"**

### Configure Project

| Campo | Valor |
|---|---|
| **Framework Preset** | `Next.js` (auto) |
| **Root Directory** | `./` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Node.js Version** | `22.x` o `20.x` |

**NO hagas click Deploy todavía.**

---

## Paso 3 · Configurar las Environment Variables

Tenés 2 opciones:

### Opción A · Pegar TODAS de golpe (más rápido · recomendado)

1. En "Environment Variables", click el botón **"Import .env"** o el icono de hoja
2. Pegá el contenido completo de tu `.env.local`
3. Marcá las 3 environments (Production · Preview · Development) para TODAS

### Opción B · Una por una

Tenés que agregar **estas 20 variables** mínimo:

#### 🔒 Secretos (server-only · no se exponen al cliente)

| Variable | Qué es |
|---|---|
| `META_TOKEN` | System User Token de Meta · empieza con `EAA0pv...` |
| `GEMINI_API_KEY` | API key Google AI Studio · empieza con `AIzaSy...` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `GEMINI_MAX_TOKENS` | `2048` |
| `AUTH_USERS_JSON` | **Array JSON con los 6 users** (ver formato abajo) |
| `AI_MEMORY_RULES_JSON` | (opcional) Array JSON con reglas operativas vigentes |

**Formato exacto de `AUTH_USERS_JSON`** (pegalo en UNA sola línea sin saltos):
```
[{"email":"santiago.varela@bewe.io","password":"XXX","role":"admin","name":"Santiago"},{"email":"julian.varela@bewe.io","password":"XXX","role":"admin","name":"Julián"},{"email":"wendy.pamplona@bewe.io","password":"XXX","role":"admin","name":"Wendy"},{"email":"maria.chaparro@bewe.io","password":"XXX","role":"lead","name":"María"},{"email":"paula.gonzalez@bewe.io","password":"XXX","role":"content","name":"Paula"},{"email":"hernan.guzman@bewe.io","password":"XXX","role":"content","name":"Hernán"}]
```

#### 🌐 Públicos en el cliente (NEXT_PUBLIC_*)

| Variable | Ejemplo |
|---|---|
| `NEXT_PUBLIC_META_ACCOUNT_ID` | `act_929824683759001` |
| `NEXT_PUBLIC_META_ACCOUNT_ID_NUMERIC` | `929824683759001` |
| `NEXT_PUBLIC_META_PAGE_ID` | `225426867908315` |
| `NEXT_PUBLIC_META_IG_ID` | `17841404681419259` |
| `NEXT_PUBLIC_META_API_VERSION` | `v22.0` |
| `NEXT_PUBLIC_PLAN_MONTH_LABEL` | `Mayo 2026` |
| `NEXT_PUBLIC_PLAN_LAUNCH_ISO` | `2026-05-12T00:00:00` |
| `NEXT_PUBLIC_PLAN_END_ISO` | `2026-05-31T23:59:59` |
| `NEXT_PUBLIC_PLAN_DAY7_ISO` | `2026-05-19T00:00:00` |
| `NEXT_PUBLIC_PLAN_DAY14_ISO` | `2026-05-26T00:00:00` |
| `NEXT_PUBLIC_PLAN_TOTAL_DAYS` | `20` |
| `NEXT_PUBLIC_PLAN_BUDGET` | `3000` |
| `NEXT_PUBLIC_PLAN_CONTINGENCY` | `1000` |
| `NEXT_PUBLIC_PLAN_CPT_AGGRESSIVE` | `1.57` |
| `NEXT_PUBLIC_PLAN_CPT_TARGET` | `2.20` |
| `NEXT_PUBLIC_PLAN_CPT_WARN` | `3.00` |
| `NEXT_PUBLIC_PLAN_CPT_CRITICAL` | `5.50` |
| `NEXT_PUBLIC_CAMPAIGNS_JSON` | Array JSON con las 6 campañas |

**Formato `NEXT_PUBLIC_CAMPAIGNS_JSON`** (UNA sola línea):
```
[{"code":"C1","cid":"52551556599886","name":"MX_BELLEZA_WEB_MAY26","event":"CompleteRegistration","geo":"MX","vertical":"Belleza","daily":40,"total":520},{"code":"C2","cid":"52551556733086","name":"MX_COMERCIO_WEB_MAY26","event":"CompleteRegistration","geo":"MX","vertical":"Comercio","daily":21,"total":420},{"code":"C3","cid":"52551556895286","name":"MX_SERVICIOS_WEB_MAY26","event":"InitiateCheckout","geo":"MX","vertical":"Servicios","daily":16,"total":320,"replacedBy":"C3.NEW"},{"code":"C4","cid":"52551557046086","name":"CR_PA_CL_CO_BELLEZA_WEB_MAY26","event":"CompleteRegistration","geo":"CR+PA+CL+CO","vertical":"Belleza","daily":25,"total":360},{"code":"C5","cid":"52551557199886","name":"CR_PA_CL_CO_COMERCIO_WEB_MAY26","event":"InitiateCheckout","geo":"CR+PA+CL+CO","vertical":"Comercio","daily":14,"total":280},{"code":"C6","cid":"52551557419286","name":"CR_PA_CL_CO_SERVICIOS_WEB_MAY26","event":"InitiateCheckout","geo":"CR+PA+CL+CO","vertical":"Servicios","daily":10,"total":200}]
```

**Importante:** marcá las 3 environments para CADA variable.

---

## Paso 4 · Deploy

1. Click **"Deploy"**
2. Build dura 2-3 min
3. Te da un URL `https://bewe-dashboard-pauta-xxx.vercel.app`
4. **Verificá**: login con tu user · pill verde "Meta conectado" · Mark/Lúa responde

---

## Paso 5 · Activar Vercel Authentication (gratis en Hobby)

**CRÍTICO** · sin esto el URL es público y cualquiera lo crawlea.

1. Vercel proyecto → **Settings** → **Deployment Protection**
2. **Vercel Authentication** → toggle **ON** → **Standard Protection**
3. Solo gente con sesión Vercel (tu cuenta) puede entrar al URL antes del login

---

## Paso 6 · Custom domain (opcional)

1. Settings → **Domains** → Add `pauta.bewe.io`
2. Agregá el CNAME en DNS de bewe.io
3. SSL auto vía Let's Encrypt en 5-30 min

---

## Cuando cambien las campañas (mes nuevo)

NO hay que tocar código. Solo:
1. Vercel → Settings → Environment Variables
2. Editá `NEXT_PUBLIC_CAMPAIGNS_JSON` con las nuevas campañas
3. Editá `NEXT_PUBLIC_PLAN_*` con el nuevo budget/dates
4. Click **Redeploy** (no Use existing Build Cache)
5. Live en 3 min

---

## Variables sensibles · checklist

- ✅ `.env.local` está en `.gitignore`
- ✅ `META_TOKEN`, `GEMINI_API_KEY`, `AUTH_USERS_JSON` solo en Vercel · NO en repo
- ✅ IDs Meta solo en env vars · NO hardcoded en código
- ✅ Campañas solo en env vars · NO hardcoded
- ✅ Vercel Authentication activado
- ✅ 2FA activado en GitHub + Vercel + Meta Business
- ✅ Plan budget y CPT thresholds solo en env vars

---

## Si algo se rompe en prod

| Síntoma | Posible causa | Fix |
|---|---|---|
| Login dice "Auth no configurado" | Falta `AUTH_USERS_JSON` o tiene mal formato | Verificá JSON válido en Vercel env vars |
| 404 en `/` | Routing roto | Build logs |
| Pill rojo "Sin token" | Falta `META_TOKEN` | Vercel env vars → Redeploy |
| Mark no responde | Quota Gemini o key incorrecta | Logs `/api/gemini` |
| Dashboard vacío sin datos | Campañas JSON mal o vacío | Revisá `NEXT_PUBLIC_CAMPAIGNS_JSON` |

Logs: Vercel proyecto → **Logs** tab → filtrá por `Functions` o `Build`.

---

## Rollback rápido

1. Vercel → **Deployments**
2. Último deploy que funcionaba → `···` → **"Promote to Production"**
3. Vuelve a prod en 30 seg

---

## Costos

Plan **Hobby (gratis)** alcanza para uso interno equipo Bewe:
- 100k requests/mes
- HTTPS auto
- 100 GB bandwidth/mes
- Vercel Authentication incluido
- 10s timeout por serverless function

Si crece: **Pro $20/mes**.
