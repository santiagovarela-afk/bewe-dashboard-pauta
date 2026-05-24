# Checklist SEO para María Paula · lunes 26 may

> Documento para que María Paula traiga TODO listo el lunes para conectar SEO al dashboard.

## Contexto rápido

Estamos construyendo el módulo SEO del Bewe Pauta OS. Necesitamos integrar:
1. Google Search Console (queries + posición)
2. Google Analytics 4 (tráfico orgánico)
3. PageSpeed Insights (Core Web Vitals)
4. Ahrefs Webmaster Tools (gratis · backlinks)
5. AEO Monitor (custom · cómo aparece Bewe en ChatGPT/Claude/Gemini)

María Paula es el referente del proyecto. Necesitamos su ojo crítico para validar la data.

---

## Bloque A · Lo que SÍ o SÍ debe traer el lunes

### A.1 · Google Search Console

- [ ] ¿`bewe.ai` está verificado en GSC?
  - Si NO: verificar AHORA con DNS o HTML tag (5 min). Guía: https://support.google.com/webmasters/answer/9008080
- [ ] **Tipo de propiedad** registrada: ¿Domain (`sc-domain:bewe.ai`) o URL prefix (`https://bewe.ai/`)?
- [ ] **Quien es propietario/admin** de la propiedad
- [ ] Confirmar acceso de `santiago.varela@bewe.io` (o cuenta admin) como **Propietario** o **Usuario delegado · pleno**

### A.2 · Google Analytics 4

- [ ] **¿Hay GA4 propiedad activa en bewe.ai?**
- [ ] **Property ID** (número de 9-10 dígitos · Admin → Detalles de la propiedad)
- [ ] **Measurement ID** (formato `G-XXXXXXXXXX`)
- [ ] **Stream ID** del web stream
- [ ] **Eventos clave configurados** (conversions): cuáles son? `trial_started`, `signup_completed`, etc.

### A.3 · Tag Manager (si lo usan)

- [ ] **GTM Container ID** (formato `GTM-XXXXXXX`)
- [ ] ¿Qué tags están disparándose en bewe.ai?
- [ ] Lista de eventos personalizados que ya están en GTM

### A.4 · Inventario actual de SEO en bewe.ai

- [ ] **Sitemap.xml** existe y está accesible en `bewe.ai/sitemap.xml`?
- [ ] **Robots.txt** correctamente configurado?
- [ ] **Schema.org markup** (Organization, Product, Article, etc.) implementado?
- [ ] ¿Cuántas páginas indexadas tienen hoy según GSC?
- [ ] ¿Cuáles son las **top 10 keywords** que ya están rankeando?

---

## Bloque B · Estrategia SEO · información cualitativa

María Paula prepara para conversar el lunes:

### B.1 · Keywords objetivo

- [ ] Lista de **20-50 keywords prioritarias** que quieren rankear
- [ ] Por categoría: Belleza · Comercio · Servicios · Genéricas Bewe
- [ ] Idioma · español Latam, español ES, inglés?
- [ ] Países objetivo principales

### B.2 · Competencia SEO

- [ ] Top 5 competidores directos por categoría
- [ ] Quien rankea hoy en las keywords objetivo (Bewe + competidores)

### B.3 · Estado del contenido

- [ ] ¿Tienen blog activo? URL?
- [ ] Frecuencia de publicación
- [ ] Páginas top por tráfico orgánico (de GA4 últimos 30 días)
- [ ] Páginas problemáticas: bounce rate alto, time-on-page bajo

### B.4 · Backlinks

- [ ] ¿Cuál es el dominio rating actual (DR de Ahrefs · si lo saben)?
- [ ] Top 5 backlinks de calidad
- [ ] Lista de directorios donde están registrados (Crunchbase, G2, Capterra, etc.)

---

## Bloque C · Herramientas que vamos a conectar GRATIS

### C.1 · Ahrefs Webmaster Tools (GRATIS · ilimitado para tu dominio)

> Es el "modo gratis" de Ahrefs. Te da TOP 5000 keywords orgánicas + backlinks completos del dominio verificado. Sin tarjeta de crédito.

**María Paula hace antes del lunes**:
1. Crear cuenta en https://ahrefs.com/webmaster-tools (gratis)
2. Verificar bewe.ai (con DNS o HTML tag · ya tendremos lo de GSC, mismo flow)
3. Esperar 24-48h a que Ahrefs crawlee
4. Confirmar acceso `santiago.varela@bewe.io` como usuario

**Lunes**: extraemos via UI (Ahrefs no tiene API en tier gratis · descargamos CSVs semanales). Yo me llevo el script que lo procesa.

### C.2 · PageSpeed Insights API (GRATIS · ilimitado)

Te explico en `SETUP-TOKENS.md` cómo sacar la key. Daré métricas LCP, INP, CLS, FCP, Speed Index de las páginas que registremos.

### C.3 · Google Search Console API (GRATIS · ilimitado)

Una vez verificada, conectamos vía OAuth (lunes).

### C.4 · GA4 Reporting API (GRATIS · 50,000 requests/día)

Más que suficiente. Conectamos vía Service Account (lunes).

---

## Bloque D · AEO (NUEVO · cómo aparece Bewe en LLMs)

> El SEO tradicional rastrea Google. **AEO = Answer Engine Optimization** rastrea LLMs (ChatGPT, Claude, Gemini).

**Lo que vamos a hacer**:
- Lista de 30-50 "prompts típicos" que un usuario potencial preguntaría a un LLM
- Ejemplos:
  - "¿Cuál es el mejor software para gestionar un salón de belleza en Latam?"
  - "¿Qué app puedo usar para agendar citas en mi peluquería?"
  - "Sistema para comercios pequeños con WhatsApp integrado"
  - "App de reservas para servicios profesionales 2026"
- Corremos cada prompt semanalmente contra ChatGPT (API), Claude (API), Gemini (API ya tienes)
- Medimos:
  - ¿Bewe se menciona? (sí/no)
  - ¿En qué posición de la lista de recomendaciones?
  - ¿Con qué descripción?
  - ¿Qué competidores aparecen?
  - **Industrias adyacentes**: qué OTRAS industrias el LLM relaciona con Bewe (puede revelar oportunidades)

**Lo que María Paula prepara**:
- [ ] **Lista de 30 prompts** que un cliente ideal preguntaría a un LLM. Yo te doy template para que sea fácil de armar.
- [ ] **Lista de 5-10 competidores directos** para trackear menciones
- [ ] **3-5 industrias adyacentes** que potencialmente quisiéramos atacar (ej. "centros médicos", "gimnasios", "escuelas")

**Template de prompts** (que María Paula completa):

```
Categoría: BELLEZA
1. "¿Qué software uso para mi salón de belleza?"
2. "Sistema de agenda para barbería"
3. "App para gestionar citas de manicuristas"
4. ...

Categoría: COMERCIO
5. "Plataforma POS para tienda pequeña"
6. "App de inventario para comercio minorista"
7. ...

Categoría: SERVICIOS
8. "Software para agendar servicios profesionales"
9. "Plataforma para freelancers que ofrecen servicios"
10. ...

Categoría: GENÉRICAS BEWE
11. "Reviews de Bewe"
12. "Alternativas a Bewe"
13. "Bewe vs [competidor X]"
14. ...
```

**Costo**: $0. Usamos la API de Gemini que ya tienes + APIs gratis de ChatGPT/Claude vía sus tiers gratuitos (limitados a ~100 prompts/día gratis, suficiente para correr 30 prompts × 3 modelos × 1 vez/semana = 90 prompts/semana).

---

## Bloque E · Para el lunes · agenda propuesta

1. **30 min** · María Paula presenta SEO actual: keywords objetivo, top competidores, blog/contenido
2. **30 min** · Conectamos GSC + GA4 + Ahrefs en vivo
3. **15 min** · Validamos data en el dashboard tab SEO
4. **30 min** · Construimos los 30 prompts de AEO (con apoyo de Mark OS · el asistente del dashboard)
5. **15 min** · Lanzamos primer AEO Monitor (corre los 30 prompts) y vemos resultados iniciales

---

## Bloque F · Para María Paula · referencias útiles antes del lunes

- Ahrefs free Webmaster Tools: https://ahrefs.com/webmaster-tools
- GSC docs: https://search.google.com/search-console/about
- GA4 setup: https://support.google.com/analytics/answer/9304153
- AEO concept (read): https://www.searchenginejournal.com/answer-engine-optimization/

---

## Ya sabe / no sabe

Cuando termines este checklist, María Paula manda esta tabla rellenada:

| Item | Tengo | No tengo | Notas |
|---|---|---|---|
| GSC verificado bewe.ai | | | |
| GSC property type | | | sc-domain o URL prefix |
| GA4 Property ID | | | |
| GA4 Measurement ID | | | |
| GTM Container ID | | | si aplica |
| Ahrefs Webmaster Tools cuenta | | | |
| Sitemap.xml | | | URL |
| Robots.txt | | | URL |
| Schema.org | | | qué tipos |
| Lista 30 keywords objetivo | | | |
| Lista 30 prompts AEO | | | |
| Lista 10 competidores | | | |

Con esto el lunes en 2 horas dejamos SEO + AEO funcionando completo en el dashboard. 💪
