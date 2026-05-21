# TODO — Dashboard Bewe Pauta

> Estado al 21-may-2026 después de la auditoría completa. Lo que requiere tu intervención está arriba. Lo que es mejora opcional, abajo.

---

## ⚡ Para ti (lo que solo tú puedes hacer)

### 1. Generar `META_TOKEN` (System User Access Token)
Necesario para que el proxy `/api/meta` funcione en producción.

1. Ir a https://business.facebook.com → **Configuración del negocio** → **Usuarios** → **Usuarios del sistema**
2. Crear o usar un System User existente (rol Admin)
3. Click **"Generar token"** → seleccionar la app de Meta + asignar permisos:
   - `ads_read` — para campañas, adsets, ads, insights
   - `ads_management` — si quieres modificar (opcional)
   - `pages_read_engagement` + `pages_show_list` — para Facebook orgánico
   - `pages_manage_posts` — para publicar en FB desde Parrilla
   - `instagram_basic` + `instagram_content_publish` — para Instagram (orgánico + publicación)
4. Marcar **"Never expires"** (long-lived token)
5. Copiar el token (empieza con `EAA…`)

### 2. Conectar Vercel al repo y configurar la env var
1. Ir a https://vercel.com/new
2. Importar repo `santiagovarela-afk/bewe-dashboard-pauta` (si no aparece, "Adjust GitHub App Permissions" → añadir el repo)
3. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./` (default)
   - Build & Output: dejar todo en default — `vercel.json` se encarga
4. **Antes de "Deploy"** → expandir **"Environment Variables"** y añadir:

   | Name | Value |
   |---|---|
   | `META_TOKEN` | (el token del paso 1) |

5. Click **Deploy**. Espera 30–60 seg. Te dará un URL `https://bewe-dashboard-pauta-xxx.vercel.app`.

### 3. Probar el deploy
- Abre el URL de Vercel
- Login con `santiago.varela@bewe.io` / `BeweDash!26`
- En Dashboard → click **"Actualizar datos"** (arriba derecha) → debería traer datos live de Meta
- Si ves errores 403 "Origen no permitido" → el `Origin` check del proxy está siendo estricto. Avísame y aflojo la regla.

### 4. Decidir sobre la auth en cliente (importante)
Las contraseñas de los 6 usuarios están **en texto plano en el HTML servido al cliente** (líneas 614–621 de `index.html`). Cualquiera con DevTools las puede ver. Es seguridad cosmética, no real.

**Opciones (elegir una):**
- (A) Aceptar como está — solo el equipo Bewe conoce el URL del dashboard (privado, no indexado). Suficiente para uso interno.
- (B) Mover auth a `/api/auth` con bcrypt en server. Te lo implemento si decides ir por aquí, tarda ~20 min.

---

## 🔧 Mejoras que puedo aplicar cuando vuelvas (opcional)

Priorizadas. Ninguna bloquea el deploy. Dime cuáles atacar y las hago.

### P1 — vale la pena pronto
- [ ] **Alertas dinámicas**: hoy `renderAlerts()` tiene texto hardcoded. Cuando `fetchMetaLive()` actualiza CAMPS, las alertas deberían regenerarse desde reglas (CPT crítico, Plan B C2, etc.).
- [ ] **Textos hardcoded inconsistentes** con `CAMPS` actuales — el chip de "C6 €0.41" dice eso pero `CAMPS` dice `0.37`. Hacer todos los chips de Agente IA dinámicos.
- [ ] **PLAN_CONTEXT del Agente IA** sigue describiendo "datos 12-15 may" cuando hoy es 21 may. Actualizar al snapshot 16-20.
- [ ] **Tokens en localStorage con TTL** (30 días) — hoy persisten para siempre.
- [ ] **Paginación de insights**: `fetchMetaLive` trae max 100 adsets. Si en algún momento tienes más, se truncan.

### P2 — pueden esperar
- [ ] Eliminar funciones muertas `renderAnalysis()` (línea 948) y `renderPlan()` (línea 1067) + sus divs `t-analisis`/`t-plan`. ~180 líneas de código sin uso.
- [ ] CSP (Content-Security-Policy) en `vercel.json`.
- [ ] Rate limiting básico en `api/meta.js` (en memory map por IP, ventana 1 min).
- [ ] Refinar umbrales de pacing en `renderCamps` (hoy verde aunque pac=110% del plan).
- [ ] Logs estructurados en proxy para auditar quién llama a qué endpoint.
- [ ] Documentar en README el comportamiento del calendario Parrilla (siempre del mes actual del navegador, no de `LAUNCH`).
- [ ] Mostrar mensaje claro cuando `fetchMetaLive` devuelve 0 datos (hoy queda silencioso con snapshot estático).
- [ ] Botón "Limpiar caché" en Config que haga `localStorage.clear()` sin recargar.

---

## ✅ Lo que ya está hecho (commit `1e3a159`)

- Proxy seguro con whitelist de endpoints, validación de Origin, soporte POST
- `vercel.json` configurado correctamente (sin runtime edge incompatible)
- Botones "Cerrar" de modales funcionando
- Publicación IG/FB desde Parrilla unificada por proxy (requiere token con permisos correctos)
- `escapeHtml` aplicado en todos los puntos donde se inyectan datos de Meta API
- Botón "Cerrar sesión" en sidebar
- Login con Enter en email + password
- alertBadge oculto para roles sin acceso a Estrategia
- Guards contra `undefined` y división por cero
- Gemini con guard ante respuestas vacías/safety block

---

## 🔑 Credenciales (recordatorio rápido)

| Email | Pass | Rol |
|---|---|---|
| santiago.varela@bewe.io | `BeweDash!26` | admin |
| julian.varela@bewe.io | `BeweDash!26` | admin |
| wendy.pamplona@bewe.io | `BeweDash!26` | admin |
| maria.chaparro@bewe.io | `BeweLead!26` | lead |
| paula.gonzalez@bewe.io | `BeweRedes26` | content |
| hernan.guzman@bewe.io | `BeweRedes26` | content |

Para limpiar sesión en local y ver de nuevo la pantalla de login:
```js
localStorage.clear(); location.reload()
```
(En DevTools Console, F12)
