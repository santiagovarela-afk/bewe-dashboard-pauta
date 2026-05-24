# Deploy a Vercel · paso a paso

> Tiempo total: ~15 minutos. La primera vez tarda más por el setup de env vars.

## Pre-requisitos

- Cuenta GitHub con acceso al repo `santiagovarela-afk/bewe-dashboard-pauta`
- Email para crear cuenta Vercel (puede ser el mismo de GitHub)
- Tu **META_TOKEN** ya generado (lo tienes en `.env.local`)
- Tu **GEMINI_API_KEY** ya generada

---

## Paso 1 · Crear cuenta Vercel y conectar GitHub

1. Ve a [vercel.com/signup](https://vercel.com/signup)
2. Click **"Continue with GitHub"** · autorizar
3. Te lleva a tu dashboard de Vercel · skip el paso "Import" por ahora

---

## Paso 2 · Importar el proyecto

1. En el dashboard Vercel → botón **"Add New..."** → **"Project"**
2. Lista de repos de tu GitHub aparece. Busca `bewe-dashboard-pauta`
3. Click **"Import"**

### Configure Project

| Campo | Valor |
|---|---|
| **Framework Preset** | `Next.js` (auto-detectado) |
| **Root Directory** | `./` (default) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |
| **Install Command** | `npm install` (default) |
| **Node.js Version** | `22.x` o `20.x` (auto) |

**NO hagas click Deploy todavía.** Primero las env vars.

---

## Paso 3 · Configurar Environment Variables

Click en **"Environment Variables"** (en la misma pantalla de Configure Project).

Agrega estas 4 variables, una por una:

| Name | Value | Environment |
|---|---|---|
| `META_TOKEN` | `EAA0pv...tu-token` (el largo, el de `.env.local`) | **Production + Preview + Development** |
| `GEMINI_API_KEY` | `AIzaSy...` (la tuya · de `.env.local` · empieza con `AIza`) | **Production + Preview + Development** |
| `GEMINI_MODEL` | `gemini-2.5-flash` | **Production + Preview + Development** |
| `GEMINI_MAX_TOKENS` | `2048` | **Production + Preview + Development** |

**Importante**: marca las **3 environments** para cada variable (Production · Preview · Development). Si solo marcas Production, los previews fallan.

### ⚠️ Sobre los secrets

- **NUNCA** pegues tokens en commit messages o en código fuente
- Las env vars en Vercel quedan **cifradas at-rest** · solo accesibles al build/runtime
- Si en algún momento el token se filtra, **regéneralo en Meta Business** y actualízalo aquí

---

## Paso 4 · Deploy inicial

1. Click **"Deploy"**
2. Vercel arranca el build (tarda ~2-3 min la primera vez)
3. Si todo va bien, recibes un URL tipo:
   ```
   https://bewe-dashboard-pauta-abc123.vercel.app
   ```
4. **Verificar** que cargue:
   - Visita el URL
   - Login con tu cuenta admin
   - El connector pill arriba debe pasar a verde "Meta conectado"

### Si el build falla

Mira los logs de Build. Errores comunes:
- **`META_TOKEN no configurado`** · no agregaste la env var o marcaste sólo Production
- **`Module not found`** · falta una dep en `package.json` (raro · ya está completo)
- **`Type error`** · si pasaste algo localmente que no compila

Solución 99% de las veces: revisa env vars y haz click "Redeploy".

---

## Paso 5 · Custom domain (opcional)

Si quieres un dominio bonito (ej. `pauta.bewe.io`):

1. En Vercel proyecto → **Settings** → **Domains**
2. Agregar `pauta.bewe.io`
3. Vercel te muestra un CNAME · agrégalo en el DNS de bewe.io
4. Espera 5-30 min · auto SSL via Let's Encrypt

---

## Paso 6 · Auto-deploy desde GitHub

Vercel ya queda configurado para auto-deploy:
- **Push a `main`** → deploy a producción (URL principal)
- **Push a otra branch** o **PR abierto** → deploy preview (URL preview única)

Para deploy manual desde CLI (opcional):
```bash
npm install -g vercel
cd "C:\Users\Svare\OneDrive\Escritorio\Pauta new Bewe - OS\dashboard-meta"
vercel link            # primera vez
vercel --prod          # deploy a prod
vercel                 # deploy a preview
```

---

## Paso 7 · Compartir con el equipo

Cuando esté funcionando:
1. Comparte el URL de Vercel con tu equipo (los 6 usuarios)
2. Cada uno entra con su email + password (USERS hardcoded en `lib/config.ts`)
3. **Todos usan el mismo META_TOKEN** del backend · no tienen que configurar nada
4. Cada uno tiene su propio chat con Mark/Lúa (storage scopeado por email)

---

## Paso 8 · Vercel Analytics (opcional · gratis)

1. En proyecto → **Analytics** tab
2. Click **"Enable Analytics"**
3. Te muestra: visitas, top pages, source/medium, country
4. Útil para ver si el equipo realmente usa la herramienta

---

## Costos

Plan **Hobby (gratis)**:
- ✅ Suficiente para uso interno equipo Bewe (hasta 100k requests/mes)
- ✅ HTTPS automático
- ✅ 100 GB bandwidth/mes
- ⚠️ Limite de 10 segundos por serverless function (lo justo para Meta API)

Si necesitas más: Plan **Pro $20/mes** (mejora límites + analytics + soporte).

---

## Variables sensibles · checklist

✅ `META_TOKEN` está en Vercel (no en código)
✅ `GEMINI_API_KEY` está en Vercel (no en código)
✅ `.env.local` está en `.gitignore` (no se sube)
✅ `vercel.json` tiene headers de seguridad (X-Frame-Options, etc)
✅ La cuenta de Vercel tiene 2FA activado (Settings → Security)

---

## Si algo se rompe en prod

| Síntoma | Posible causa | Fix |
|---|---|---|
| 404 en `/` | Routing mal · variable `NEXT_PUBLIC_*` faltante | Revisar build logs |
| Meta pill rojo "Sin token" | env `META_TOKEN` no llegó a runtime | Revisar env vars en Vercel · re-deploy |
| Mark/Lúa no responde | Quota Gemini agotada o key incorrecta | Logs en Vercel → Functions → `/api/gemini` |
| 500 errors | Algo cambió en `lib/seed-data.ts` | Revisar logs de Functions |

Ver logs:
1. Vercel proyecto → **Logs** tab
2. Filtra por `Functions` para ver errores de API
3. Filtra por `Build` para ver errores de compile

---

## Rollback rápido

Si un deploy nuevo rompe algo:
1. Vercel → **Deployments**
2. Encuentra el último deploy que funcionaba
3. Click `···` → **"Promote to Production"**
4. Vuelve a producción en 30 seg

---

## Próximos pasos post-deploy

1. Compartir URL con Julián primero para review
2. Asegurar que el welcome tour funcione bien para nuevos usuarios
3. Validar que las 4 env vars están en producción
4. Activar Vercel Analytics para ver uso real
5. Considerar habilitar **Password Protection** (Settings → Deployment Protection) si NO quieres que el URL sea público
