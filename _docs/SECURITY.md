# Seguridad · controles e infiltraciones

> Checklist práctico para mantener el dashboard seguro. Lectura: 10 min.
> Aplicación: 30 min (varias cosas se hacen una sola vez).

---

## Riesgos reales que enfrentas

| Riesgo | Probabilidad | Impacto | Prioridad |
|---|---|---|---|
| **Token Meta filtrado en repo público** | Alta si no se cuidan secrets | Catastrófico (cualquiera puede leer/gastar tu ad account) | 🔴 P0 |
| **Persona externa adivina password de equipo** | Media (passwords son weak) | Alto (ven datos, no modifican Meta) | 🟡 P1 |
| **XSS en preview de Open Design** | Baja (iframe sandboxed) | Medio | 🟢 P2 |
| **Quota burn de Gemini por abuso** | Media (sin rate limit) | Bajo (max $5 extra) | 🟢 P2 |
| **Vercel deployment URL público sin auth real** | Alta | Alto (todo accesible si Google indexa) | 🟡 P1 |
| **Dependencias npm con vulnerabilidades** | Alta (siempre hay) | Variable | 🟡 P1 |

---

## P0 · Secrets management (HACER YA)

### Lo que ya está bien
- ✅ `.env.local` está en `.gitignore` (no se sube al repo)
- ✅ `META_TOKEN` y `GEMINI_API_KEY` solo se usan server-side (proxy `/api/meta` y `/api/gemini`)
- ✅ Nunca se exponen al navegador del cliente
- ✅ `vercel.json` tiene headers básicos de seguridad

### Lo que tienes que hacer

#### 1. Auditar histórico de Git por secrets filtrados

```bash
cd "C:\Users\Svare\OneDrive\Escritorio\Pauta new Bewe - OS\dashboard-meta"
# Busca tokens típicos de Meta (empiezan con EAA)
git log --all -p -S "EAA" | head -100
# Busca AIza (Google API keys)
git log --all -p -S "AIza" | head -100
```

Si encuentras algún match con un token real:
1. **Inmediatamente** rota el token en Meta Business (Generate new token)
2. Considera usar [git-filter-repo](https://github.com/newren/git-filter-repo) para borrar el commit del histórico
3. Push --force (con cuidado) para reescribir la historia remota
4. Actualiza el token nuevo en `.env.local` Y en Vercel env vars

#### 2. Rotar tokens cada 6 meses

Aunque el System User Token es "never expires", la mejor práctica es rotarlo cada 6 meses:
- Generas un nuevo token
- Lo actualizas en Vercel
- Revocas el anterior

Pon recordatorio: **"Rotar Meta token · noviembre 2026"**.

#### 3. Limitar el blast radius del token

Tu token actual tiene **20 permisos**. Para producción ideal, deberías tener **2 tokens**:
- **Token de lectura** (solo `ads_read`, `pages_read_engagement`, `instagram_basic`, `read_insights`) → para todo lo que sea ver/analizar
- **Token de escritura** (con `ads_management`, `pages_manage_posts`, `instagram_content_publish`) → solo para publicar/modificar

Si alguien roba el de lectura, no puede modificar nada en tu Meta. Hoy es 1 solo token con todos los permisos = más riesgo.

---

## P1 · Auth real (URGENTE antes de prod público)

### El problema actual

Las contraseñas viven en `lib/config.ts USERS` **en texto plano**, en código que se sirve al cliente. Cualquiera que abra DevTools → Sources → busca "BeweDash" puede ver todas las passwords del equipo. **Esto es solo "seguridad cosmética"**.

### Soluciones por nivel de paranoia

#### Nivel 1 · Vercel Password Protection (5 min, gratis Pro plan)

1. Vercel proyecto → Settings → **Deployment Protection** → **Password Protection**
2. Define UN password global
3. Solo quien lo tenga puede acceder al URL

Resuelve 80% del problema · útil si solo quieres que el URL no sea públicamente indexable.

#### Nivel 2 · Vercel Authentication SSO (Pro plan, gratis para teams ≤10)

1. Settings → **Authentication** → **Vercel Authentication**
2. Solo miembros de tu team de Vercel pueden acceder
3. Login con su Google/GitHub

Resuelve 95% del problema · profesional · zero código.

#### Nivel 3 · Auth real con NextAuth (4 horas de dev)

Reemplazar el login custom por **NextAuth.js** con:
- Magic links (email + click)
- O Google OAuth (más rápido)
- Sessions en cookies httpOnly + secure
- Server-side validation

Te lo monto cuando llegue ese momento.

#### Nivel 4 · Hashear las passwords actuales (1 hora)

Si quieres mantener el sistema actual pero quitar el riesgo de password en texto:
1. Hash con bcrypt cada password
2. Almacenar solo el hash en `lib/users.ts`
3. Verificar via `/api/auth/login` en backend

Más rápido que NextAuth pero todavía rudimentario.

---

## P1 · Rate limiting

### Sin rate limit, los APIs están abiertos

Hoy cualquiera con tu URL puede:
- Hacer 1000 requests/min a `/api/meta` (eventualmente Meta te bloquea)
- Hacer 1000 requests/min a `/api/gemini` (te agota la quota free en minutos)

### Fix · upstash-redis rate limiter (1 hora)

```bash
npm install @upstash/ratelimit @upstash/redis
```

1. Crea cuenta gratis en [upstash.com](https://upstash.com)
2. Crea Redis DB
3. Agrega 2 env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Wrap los endpoints sensibles con limiter:

```ts
// app/api/_helpers/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests por minuto
});

// En cada route:
const ip = req.headers.get("x-forwarded-for") ?? "unknown";
const { success } = await limiter.limit(ip);
if (!success) return new Response("Too many requests", { status: 429 });
```

Costo: Upstash free tier = 10k requests/día. Suficiente.

---

## P2 · Cabeceras de seguridad

Ya tienes `vercel.json` con lo básico:
- `X-Frame-Options: DENY` (anti-clickjacking)
- `X-Content-Type-Options: nosniff` (anti MIME confusion)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Lo que falta · Content Security Policy (CSP)

CSP es la cabecera más poderosa contra XSS. Vercel la deja en blanco por default. Para agregarla, edita `vercel.json`:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; img-src 'self' data: https://*.fbcdn.net https://scontent.cdninstagram.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://graph.facebook.com https://generativelanguage.googleapis.com; frame-src 'self' blob: data:;"
}
```

Esta CSP:
- Solo carga imágenes de Meta CDN + Google Fonts
- Solo scripts del propio dominio + unpkg (html2canvas)
- Bloquea cualquier script externo no autorizado

**Cuidado**: si tienes recursos externos (ej. Hotjar futuro), agrega su dominio. Empieza con la CSP de arriba y monitorea consola para ver qué se rompe.

---

## P2 · Monitoreo de infiltraciones

### Detección temprana

#### 1. Vercel logs activos

En Vercel proyecto → **Logs** → filtra `Status: 4xx` o `5xx`. Si ves:
- Muchos 401/403 desde una IP → alguien tratando passwords
- Muchos 429 de Gemini → uso abusivo o ataque

Configura **Notifications** (Vercel proyecto Settings) → email cuando hay fallos repetidos.

#### 2. Meta Business · alertas

1. business.facebook.com → Settings → Notifications
2. Activa "Unusual spending" + "Account changes"
3. Si alguien usa el token para gastar de más, te llega email a los 5 min

#### 3. GitHub · alerts de secrets

GitHub escanea automáticamente tus commits buscando tokens conocidos:
1. Repo Settings → Security → **Secret scanning** (activar)
2. Si commiteas un token por error, GitHub te alerta + Meta revoca automático

#### 4. Dependabot · vulnerabilidades npm

1. Repo Settings → Security → **Dependabot alerts** (activar)
2. Cada semana revisa tus deps y te alerta de CVEs
3. PRs automáticos con upgrades de seguridad

---

## P2 · Hardening adicional

### 1. Quitar `dangerouslySetInnerHTML` donde sea evitable

Búscalos:
```bash
grep -rn "dangerouslySetInnerHTML" components/ app/
```

Hoy se usa solo en `ai-dock/messages.tsx` para renderizar markdown. Es **seguro** porque:
- El input pasa por `escapeHtml` antes
- Luego se transforma a HTML controlado

Pero auditar regularmente.

### 2. iframe Open Design · sandbox estricto

Ya tiene `sandbox="allow-same-origin"`. Verifica que NO tenga `allow-scripts`:
```bash
grep -n "sandbox" components/open-bui/design-preview.tsx
```

Si en algún momento agregas `allow-scripts`, abre una puerta a XSS.

### 3. localStorage · no guardar secrets

NUNCA pongas tokens en localStorage. Hoy se guardan:
- `bw_session` (datos del user · ok)
- `bw_ai_messages:*` (chat history · ok)
- `bw_theme` (preferencia · ok)
- `bw_ai_persona:*` (preferencia · ok)

Verifica que ninguno tenga `META_TOKEN` etc.

---

## P2 · Plan de respuesta a incidentes

Si crees que tu token Meta se filtró:

### En los próximos 5 minutos
1. business.facebook.com → System Users → tu user → **Generar nuevo token**
2. Inmediatamente actualiza en Vercel env vars
3. Redeploy

### En los próximos 30 minutos
1. Ad Account → Activity → revisa "Spending" últimas 24h
2. Si hay actividad sospechosa: pausar todas las campañas
3. Contactar Meta Business Support si sospechas misuse

### En los próximos días
1. Revisar histórico Git por el token filtrado
2. `git filter-repo` para borrarlo del histórico
3. Force push (cuidadosamente)

---

## Checklist final · imprime y marca

- [ ] `.env.local` está en `.gitignore`
- [ ] Auditado el histórico Git con `git log -S "EAA"` · sin matches
- [ ] Vercel env vars marcadas en las 3 environments
- [ ] Vercel Password Protection o SSO activado
- [ ] Recordatorio "Rotar Meta token · Nov 2026" en calendario
- [ ] 2FA activado en cuentas: GitHub, Vercel, Meta Business
- [ ] CSP agregada a `vercel.json`
- [ ] Dependabot alerts activado en GitHub repo
- [ ] Secret scanning activado en GitHub repo
- [ ] Meta Business notifications "Unusual spending" activado
- [ ] Rate limiting via Upstash agregado (cuando tengas tiempo)
- [ ] Plan de respuesta a incidentes guardado en `_docs/SECURITY.md` (este archivo · ✓)

---

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) · vulnerabilidades web más comunes
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Meta Business Security](https://www.facebook.com/business/help/security)

---

## TL;DR · si solo lees 3 cosas

1. **Vercel env vars** para `META_TOKEN` y `GEMINI_API_KEY` · NUNCA en código
2. **Vercel Password Protection o SSO** activado · el URL no debe ser público y crawl-able
3. **Rotar token Meta** cada 6 meses · pon recordatorio
