# #IAparaPymes — Propuesta C2 (Solo wordmark)

> Brief de marca para producir el sistema visual del live show **#IAparaPymes** en Canva. Basado en el BeweOS Design System.

---

## 1. Contexto

- **Producto:** live show semanal de BeweOS sobre IA para dueños de PyMEs en Latam.
- **Hosts:** Paula Mariett + Julián Varela.
- **Canal:** YouTube Live, todos los miércoles.
- **Idioma:** Español (LATAM / España).
- **Tono:** inteligente, proactivo, conciso, alentador. Trato informal ("tú").

---

## 2. Wordmark

Logo tipográfico puro. **Sin símbolo separado.**

- **Tipografía:** Inter ExtraBold (800).
- **Kerning:** `-0.035em`.
- **Line-height:** 1.0.
- **Composición:** `#IA` + `paraPymes` en una sola línea, sin espacio entre las dos palabras.

### Color del wordmark

| Parte | Sobre fondo oscuro `#0A2540` | Sobre fondo claro `#FFFFFF` | Sobre gradientes pastel |
|---|---|---|---|
| `#IA` | Gradiente `#60A5FA → #34D399 → #60A5FA` (135°) | Mismo gradiente | `#0A2540` sólido |
| `paraPymes` | Blanco `#FFFFFF` | `#0A2540` | `#0A2540` |

> **Regla:** sobre gradientes pastel orgánicos (Linda gradients) el `#IA` se aplana a `#0A2540` para mantener legibilidad AAA.

---

## 3. Paleta de marca

| Token | Hex | Uso |
|---|---|---|
| Primary 400 | `#60A5FA` | CTA dominante, links, focus |
| Secondary 400 | `#34D399` | Éxito, automatizaciones |
| Ink Deep | `#0A2540` | Texto, secciones oscuras |
| Ink Forest | `#355452` | Cards oscuras alternativas |
| Surface Aqua | `#CCFBF1` | Fondos amplios, platform wash |
| Surface Cream | `#FEF3C7` | Contexto IA (Linda) |
| Accent AI | `#FAD19E` | Badges IA, micro-detalles |
| Teal Neutral | `#75C9C8` | Divisores, estados neutros |
| Error | `#F87171` | Badge "EN VIVO" |

### Gradientes oficiales

| Token | Definición | Uso |
|---|---|---|
| `--gradient-linda` | `135°, #B0D2FC 0% → #CCFBF1 45% → #FAD19E 100%` | Fondos hero orgánicos, mood Linda |
| `--gradient-linda-soft` | `120°, #DFEDFE 0% → #FFFFFF 40% → #D6F6EB 100%` | Hero claro, muy aireado |
| `--gradient-cta-linda` | `90°, #60A5FA 0% → #34D399 50% → #60A5FA 100%` | Aplicado al `#IA` del wordmark |
| `--gradient-dawn` | `135°, #FAD19E 0% → #FEF3C7 50% → #60A5FA 100%` | Edición "amanecer", episodios temáticos |
| `--gradient-cta-primary` | `90°, #88BCFB 0% → #A78BFA 50% → #88BCFB 100%` | CTA secundario |

---

## 4. Tipografía

- **Inter** para todo (headlines, body, UI, buttons).
- **Merriweather italic** reservado **exclusivamente** para palabras IA o el nombre "Linda" cuando aparezca en piezas BeweOS. **No usar en este logo.**
- Escala: H1 32 / H2 24 / H3 20 / Body 16 / Small 14.
- Display marketing: 72 / 56 / 44.
- Line-height: 1.5 body, 1.2 H1.

---

## 5. Sistema de espaciado

Múltiplos de 8 (4 para detalles).

| Token | Valor |
|---|---|
| xs / sm / md / lg | 4 / 8 / 16 / 24 px |
| xl / 2xl / 3xl / 4xl | 32 / 48 / 64 / 96 px |

- **Radios:** botones pill (999px), cards 16px, inputs 12px, icon containers 8–12px.
- **Sombras:** `--shadow-sm` (sutil), `--shadow-md` (cards), `--shadow-ai` (momentos Linda, glow azul+verde).

---

## 6. Las 4 piezas requeridas

### 6.1 Versión principal — wordmark sobre `#0A2540`

- Fondo sólido `#0A2540`.
- Wordmark centrado, tamaño grande (≥ 80px en Canva 1920×1080).
- Padding mínimo alrededor: 0.5× la altura de cap-height del wordmark (zona de protección).
- Sin elementos decorativos.

### 6.2 Versión horizontal — compacta

Tres ambientes:

1. **Sobre `--gradient-linda`** (con grain sutil 8% opacity).
2. **Sobre `#0A2540`** sólido.
3. **Sobre `--gradient-linda-soft`** (alt hero).

- Wordmark a 46px aprox (proporción compacta).
- Centrado, padding generoso.

### 6.3 Símbolo solo — avatar de canal / favicon

Crop "#IA" como elemento cuadrado.

- **Forma:** cuadrado con bordes redondeados.
- **Radio:** 16px (≥ 80px), 12px (48px), 8px (32px).
- **Composición:** `#` blanco al 65% opacity + `IA` con gradiente `#60A5FA → #34D399`.
- **Fondo:** `#0A2540` sólido.
- **Variante sobre `--gradient-dawn`:** envolver el símbolo en un chip `#0A2540` para preservar contraste.
- **Reducciones a entregar:** 80px, 48px, 32px.

### 6.4 Overlay YouTube Live — composición 16:9

Posición: **esquina inferior izquierda** (28px, 28px desde la esquina).

Caja:
- Fondo `rgba(10, 37, 64, 0.55)`.
- `backdrop-filter: blur(14px) saturate(1.2)`.
- Border `1px rgba(255, 255, 255, 0.10)`.
- Border-radius 16px.
- Padding 16×22px.
- Wordmark a 28px dentro del overlay.

Acompañado de:
- Badge "EN VIVO" superior derecho — fondo `#F87171`, blanco, peso bold, letter-spacing 0.18em, dot pulsante.
- Contador de viewers superior izquierdo — fondo `rgba(10, 37, 64, 0.55)` + blur, icono ojo Solar (no emoji).
- Caption de hosts inferior derecho — Paula Mariett · Julián Varela + episodio.

---

## 7. Variantes de overlay (8 opciones — chip del logo)

| ID | Nombre | Tratamiento | Cuándo usar |
|---|---|---|---|
| A1 | Base ink-deep blur | Caja oscura translúcida con blur | Episodios estándar |
| A2 | Avatar + wordmark | Chip `#IA` + logo | Énfasis de identidad |
| A3 | Borde `--gradient-linda` animado | Border 2px con gradient-shift 5s | Momentos Linda (IA protagonista) |
| A4 | Barra lateral `--gradient-dawn` | Acento vertical 4px izquierda | Episodios temáticos cálidos |
| A5 | Pill claro `surface-aqua` | Caja aqua translúcida | Imágenes oscuras / nocturnas |
| A6 | Fill `--gradient-cta-linda` animado | Caja sólida con gradiente activo | Bienvenida y cierre del show |
| A7 | Naked minimal | Wordmark sin chip + tag EP | Tomas limpias, planos cerrados |
| A8 | Pastel banner superior | Pill `--gradient-linda-soft` arriba centrado | Firma del programa, intro |

---

## 8. Variantes de fondo completo (6 opciones — el "set" del stream)

El fondo azul oscuro `#0A2540` que ocupa toda la escena puede variarse:

| ID | Fondo | Mood |
|---|---|---|
| B1 | `--gradient-linda` (pastel orgánico) | Mood Linda pleno |
| B2 | `--gradient-linda-soft` | Hero claro, conversacional |
| B3 | `--gradient-dawn` | Edición amanecer / matinal |
| B4 | `--gradient-cta-linda` animado | Momento energía (uso puntual) |
| B5 | `surface-aqua` (#CCFBF1) | Platform wash limpio |
| B6 | `ink-forest` (#355452) | Dark cálido alternativo |

> **Regla de combinación:** sobre fondos claros (B1, B2, B3, B5) usar overlay claro (A5) o dark blur estándar (A1) según contraste. Sobre fondos oscuros (B4, B6) usar siempre el chip ink-deep estándar.

---

## 9. Reglas estrictas

✅ **Hacer**
- Inter siempre.
- Sentence case en headlines y botones.
- Espaciado generoso, mucho aire.
- Esquinas redondeadas (cards 16px, botones pill).
- Sombras navy-tinted suaves.
- Arrow `→` como único decorativo en CTAs.

❌ **No hacer**
- ❌ Emoji en marketing/UI (sí en toasts internos del producto).
- ❌ ALL CAPS excepto micro-labels ≤14px.
- ❌ Merriweather fuera de palabras IA / Linda.
- ❌ Itálicas en `#IAparaPymes` (es marca tipográfica, no IA literal).
- ❌ Inner shadows, neumorphism, drop shadows duros.
- ❌ Gradientes morados, parallax, bounces.
- ❌ Photography stock corporativa.

---

## 10. Recomendaciones para Canva

1. **Crear elementos:** subir el wordmark como SVG/PNG con transparencia para reusar en cualquier composición.
2. **Brand kit Canva:**
   - Colores: pegar los 9 hex de la sección 3.
   - Fuentes: Inter (peso 800 para wordmark, 600 para CTAs).
   - Logos: principal (oscuro), principal (claro), avatar `#IA` cuadrado (3 tamaños).
3. **Plantillas a generar:**
   - Cover de YouTube 1280×720 (versión horizontal).
   - Avatar de canal 800×800 (símbolo solo).
   - Overlay 1920×1080 con espacio para los hosts y bloque del logo abajo izquierda.
   - Thumbnail de episodio (variante con título de episodio + episodio #).
   - Stories 1080×1920 para promo en redes (Instagram / TikTok).
   - Post cuadrado 1080×1080 para anuncio del próximo episodio.
4. **Texto editable en plantillas:** dejar como variables el número de episodio y el título — Paula y Julián los editan cada semana.
5. **Versiones a exportar:**
   - SVG (escalable, redes y web).
   - PNG transparente (overlays).
   - PNG con fondo (avatares de plataformas que no aceptan transparencia).
   - Favicon `.ico` 32×32 desde el símbolo solo.

---

## 11. Checklist de aprobación

- [ ] Wordmark legible a 24px de altura.
- [ ] Avatar `#IA` legible a 32px.
- [ ] Contraste AAA del `paraPymes` sobre fondo oscuro y claro.
- [ ] Badge "EN VIVO" visible sobre cualquier fondo de cámara.
- [ ] Logo no compite con caras de hosts en el overlay 16:9.
- [ ] Versión SVG sin texturas pesadas (< 20kb).
- [ ] Brand kit cargado en Canva con los 9 colores y dos fuentes.

---

## 12. Anexo — CSS tokens para desarrolladores

```css
:root {
  --primary-400: #60A5FA;
  --secondary-400: #34D399;
  --ink-deep: #0A2540;
  --surface-aqua: #CCFBF1;
  --surface-cream: #FEF3C7;
  --accent-ai: #FAD19E;

  --gradient-linda: linear-gradient(135deg, #B0D2FC 0%, #CCFBF1 45%, #FAD19E 100%);
  --gradient-linda-soft: linear-gradient(120deg, #DFEDFE 0%, #FFFFFF 40%, #D6F6EB 100%);
  --gradient-cta-linda: linear-gradient(90deg, #60A5FA 0%, #34D399 50%, #60A5FA 100%);
  --gradient-dawn: linear-gradient(135deg, #FAD19E 0%, #FEF3C7 50%, #60A5FA 100%);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  --shadow-sm: 0 2px 6px rgba(10,37,64,0.05), 0 1px 2px rgba(10,37,64,0.04);
  --shadow-md: 0 8px 24px rgba(10,37,64,0.07), 0 2px 6px rgba(10,37,64,0.04);
  --shadow-ai: 0 10px 40px rgba(96,165,250,0.18), 0 4px 12px rgba(52,211,153,0.10);
}

.wordmark {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}
.wordmark .ia {
  background: linear-gradient(90deg, #60A5FA 0%, #34D399 50%, #60A5FA 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

---

**Fuente del sistema:** BeweOS Design System (Foundations v2.0).
**Versión del brief:** C2 · v4 · abril 2026.
