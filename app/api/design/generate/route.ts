import { NextRequest, NextResponse } from "next/server";
import { SKILLS, BRAND } from "@/components/open-bui/skills";
import { buildCreativeContextBlock } from "@/lib/creative-docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  skillId?: string;
  brief?: string;
  variant?: number;
  persona?: "mark" | "lua";
}

/**
 * POST /api/design/generate
 * Body: { skillId, brief, variant? }
 * Devuelve: { html, skillId, variant, finishReason, usage, truncated }
 * Errores:
 *   - 400 · skillId/brief inválidos
 *   - 429 · { quotaExhausted: true, hint } cuando Gemini agotó cuota
 *   - 500/502 · resto
 *
 * Sincronizado con /api/gemini (commit 41eba5c):
 *   - Modelo fijo gemini-2.5-flash (NO el alias "latest" que rota)
 *   - thinkingConfig.thinkingBudget = 0 (evita que se coma el budget)
 *   - maxOutputTokens 4096 (HTML+CSS suele necesitar más)
 *   - Mensajes claros con flag quotaExhausted para que el cliente
 *     muestre instrucciones al usuario y deshabilite el botón.
 */
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no configurado en .env.local" },
      { status: 500 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const skill = SKILLS.find((s) => s.id === body.skillId);
  if (!skill) {
    return NextResponse.json(
      { error: `skillId inválido. Disponibles: ${SKILLS.map((s) => s.id).join(", ")}` },
      { status: 400 },
    );
  }
  const brief = (body.brief ?? "").trim();
  if (brief.length < 4) {
    return NextResponse.json(
      { error: "El brief es demasiado corto (min 4 caracteres)." },
      { status: 400 },
    );
  }
  const variant = Math.max(0, Math.floor(body.variant ?? 0));
  const persona: "mark" | "lua" = body.persona === "lua" ? "lua" : "mark";

  let system = buildSystemPrompt(skill, variant, persona);
  // Adjuntar contexto creativo (briefs + guías de marca) si existen docs
  try {
    const creative = await buildCreativeContextBlock();
    if (creative) {
      system = `${system}\n\n${creative}`;
    }
  } catch {
    // si falla, seguimos sin él
  }
  const userMsg = `Brief del usuario: "${brief}"\nVariante: ${variant}\n\nDevuelve SOLO el documento HTML completo, sin markdown, sin triple backticks, sin texto antes ni después.`;

  // Modelo fijo · NO usar "gemini-flash-latest" (alias que rota a 2.5+/3.x).
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const maxOutputTokens = Number(process.env.GEMINI_MAX_TOKENS ?? "4096");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  let geminiResp: Response;
  try {
    geminiResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: userMsg }] }],
        generationConfig: {
          maxOutputTokens,
          temperature: variant > 0 ? 0.95 : 0.7,
          topP: 0.95,
          // Desactiva tokens de "thinking" internos · si el modelo los
          // soporta, evita que el presupuesto se consuma antes del HTML.
          // Modelos antiguos ignoran esta key (no rompe).
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Network error contactando Gemini: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const data = await geminiResp.json();
  if (data.error) {
    const msg = String(data.error.message ?? "");
    const isQuota = /quota|rate.?limit|exceeded/i.test(msg);
    return NextResponse.json(
      {
        error: msg,
        quotaExhausted: isQuota,
        hint: isQuota
          ? "El tier gratuito de Gemini se agotó. Activa billing en Google AI Studio o espera el reset (~24h). Mientras tanto puedes usar el Canvas manual."
          : undefined,
      },
      { status: isQuota ? 429 : 500 },
    );
  }

  const candidate = data?.candidates?.[0];
  const raw: string | undefined = candidate?.content?.parts?.[0]?.text;
  const finishReason = candidate?.finishReason ?? "UNKNOWN";

  if (!raw) {
    const blocked = finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT";
    return NextResponse.json(
      {
        error: blocked
          ? `Respuesta bloqueada por safety filter (finishReason=${finishReason})`
          : `Sin respuesta del modelo (finishReason=${finishReason}). Reintenta o sube maxOutputTokens.`,
        finishReason,
        usage: data?.usageMetadata,
      },
      { status: 500 },
    );
  }

  const html = extractHtml(raw, skill);
  if (!html) {
    return NextResponse.json(
      {
        error: "El modelo no devolvió HTML válido. Intenta de nuevo o reformula el brief.",
        finishReason,
        usage: data?.usageMetadata,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    html,
    skillId: skill.id,
    variant,
    finishReason,
    usage: data?.usageMetadata,
    truncated: finishReason === "MAX_TOKENS",
  });
}

function buildSystemPrompt(
  skill: (typeof SKILLS)[number],
  variant: number,
  persona: "mark" | "lua" = "mark",
): string {
  const variantHint =
    variant > 0
      ? `IMPORTANTE: variante #${variant}. Hazla MUY distinta a un primer intento — otra estructura, otra paleta dentro del brand kit, otra jerarquía, otra disposición.`
      : "";

  const personaHint =
    persona === "lua"
      ? "Eres Lúa OS · sensibilidad cálida · prefieres composiciones más orgánicas, gradientes pastel azul→mint→cream y tipografía con más respiración (Inter ExtraBold + mucho aire)."
      : "Eres Mark OS · sensibilidad afilada · prefieres composiciones limpias y asimétricas, contrastes navy/azul sobre pastel cream/aqua y tipografía Inter ExtraBold densa.";

  return `${personaHint}

Eres diseñador senior de ${BRAND.name} (software de gestión para negocios de servicios profesionales).

BRAND KIT BEWE OFICIAL (Linda · pastel orgánico cálido) — OBLIGATORIO usarlo:
COLORES (hex EXACTOS):
- Primary:        ${BRAND.colors.primary} (azul Bewe) · color activo principal
- Secondary:      ${BRAND.colors.secondary} (verde emerald) · color activo soporte
- Accent IA:      ${BRAND.colors.accentAi} (naranja cálido pastel) · para acentos IA/Linda
- Ink Deep:       ${BRAND.colors.inkDeep} (navy) · TEXTO PRINCIPAL · NO uses negro puro
- Surface Aqua:   ${BRAND.colors.surfaceAqua} (mint pastel) · fondo claro
- Surface Cream:  ${BRAND.colors.surfaceCream} (cream pastel) · fondo claro alternativo
- Error:          ${BRAND.colors.error} (rojo) · solo errores

GRADIENTES OFICIALES (úsalos en hero/fondos/CTAs):
- --gradient-linda:      ${BRAND.gradients.linda}   → fondo hero principal
- --gradient-linda-soft: ${BRAND.gradients.lindaSoft} → fondo hero suave
- --gradient-cta-linda:  ${BRAND.gradients.ctaLinda}  → CTAs principales (botones)
- --gradient-dawn:       ${BRAND.gradients.dawn}     → fondo alternativo cálido

TIPOGRAFÍA:
- Display: ${BRAND.fonts.display} ExtraBold (800/900) · letter-spacing -0.035em
- Body:    ${BRAND.fonts.body} Regular (400) o Medium (500)
- Italic Merriweather: SOLO para las palabras "IA" o "Linda" · NUNCA para otros textos
- Carga Inter + Merriweather de Google Fonts:
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:ital@1&display=swap" rel="stylesheet">

REGLAS DE ESTILO (no negociables):
${BRAND.rules.map((r) => `- ${r}`).join("\n")}

VOZ: ${BRAND.voice}
TAGLINE: "${BRAND.tagline}"

ANTI-PATRONES (PROHIBIDOS):
- PROHIBIDO violeta saturado #8B5CF6 · ese era color de PRUEBA · el brand kit REAL usa azul #60A5FA + verde #34D399
- PROHIBIDO cyan/lime/ember saturados (#06B6D4, #A3E635, #FB923C)
- PROHIBIDO fondo dark/negro · el brand es CLARO · pastel orgánico cálido
- PROHIBIDO ALL CAPS en headlines (excepto micro-labels ≤14px)
- PROHIBIDO emojis decorativos
- PROHIBIDO esquinas cuadradas duras · usa border-radius 16px en cards, 999px (pill) en botones
- PROHIBIDO Merriweather italic fuera de palabras "IA"/"Linda"

PIEZA:
- Skill: "${skill.label}"
- Tamaño exacto del lienzo: ${skill.size} (${skill.aspect})
- Width × Height: ${skill.width}px × ${skill.height}px

REGLAS DURAS HTML:
1. Devuelve SOLO un documento HTML válido autocontenido empezando con <!DOCTYPE html>. NADA de markdown, NADA de triple backticks (\`\`\`), NADA de texto antes ni después del HTML.
2. CSS inline dentro de un único <style> en <head>. Permitido cargar Inter+Merriweather de Google Fonts.
3. Imágenes: SOLO SVG inline o gradientes CSS. PROHIBIDO <img src="http..."> o cualquier recurso de red salvo Google Fonts.
4. NO incluyas <script>. NO event handlers inline (onClick, onload…).
5. El <body> debe medir exactamente ${skill.width}px × ${skill.height}px · CSS obligatorio:
   html, body { width: ${skill.width}px; height: ${skill.height}px; margin: 0; padding: 0; overflow: hidden; box-sizing: border-box; }
   *, *::before, *::after { box-sizing: border-box; }
6. Fondo: usa --gradient-linda o --gradient-linda-soft o color sólido pastel (surfaceCream/surfaceAqua). NUNCA fondo oscuro salvo brief explícito.
7. Texto principal en color ${BRAND.colors.inkDeep} (navy). Texto secundario al 70% opacidad del navy.
8. Si el brief sugiere CTA, inclúyelo como pill button (border-radius 999px) con background --gradient-cta-linda y texto blanco + sombra navy suave + arrow "→" al final.
9. Si entra el wordmark "${BRAND.name}", úsalo en una esquina con Inter ExtraBold 800, color ink-deep.
10. Composición: jerarquía clara (1 titular grande Inter ExtraBold + soporte regular + CTA pill). Whitespace generoso · aire.

CRÍTICO · DIMENSIONES Y TIPOGRAFÍA (NO IGNORES ESTAS REGLAS):
${(() => {
  // Tabla de tamaños de fuente adecuados según el lienzo
  const isSquare = Math.abs(skill.width - skill.height) < 100;
  const isVertical = skill.height > skill.width * 1.2;
  const isHorizontal = skill.width > skill.height * 1.2;
  const isBanner = skill.height < skill.width * 0.4;
  let headlineMax = 96;
  let headlineSafe = 72;
  let bodyMax = 32;
  if (skill.width <= 600) {
    headlineMax = 48;
    headlineSafe = 38;
    bodyMax = 18;
  } else if (skill.width <= 1080) {
    headlineMax = 88;
    headlineSafe = 64;
    bodyMax = 28;
  } else if (skill.width <= 1440) {
    headlineMax = 112;
    headlineSafe = 80;
    bodyMax = 32;
  }
  if (isBanner) {
    headlineMax = Math.min(headlineMax, Math.floor(skill.height * 0.42));
    headlineSafe = Math.floor(headlineMax * 0.75);
  }
  return [
    `- Lienzo: ${skill.width}×${skill.height}px (${isSquare ? "cuadrado" : isVertical ? "vertical 9:16/3:4" : isHorizontal ? "horizontal" : "mixto"})`,
    `- TODO el contenido DEBE caber dentro del lienzo · prohibido texto que se sale.`,
    `- Headline máx: ${headlineMax}px · seguro: ${headlineSafe}px · usá clamp(${Math.floor(headlineSafe * 0.7)}px, 6vw, ${headlineMax}px) para auto-fit.`,
    `- Body/subtitulo: máx ${bodyMax}px.`,
    `- Si el texto del brief tiene más de 60 caracteres en el titular, DIVIDILO en 2-3 líneas con <br> y bajá font-size al "seguro".`,
    `- Aplicá line-height: 1.0 a 1.05 en el headline para evitar overflow vertical.`,
    `- Aplicá padding interno generoso: ${Math.round(skill.width * 0.06)}px mínimo en todos los lados.`,
    `- Si el headline es muy largo, considerá: (a) dividir en 2 piezas (carrusel), (b) cortar a 8-10 palabras, (c) usar variante con headline corto + body más extenso.`,
  ].join("\n");
})()}

COMPOSICIÓN OBLIGATORIA (todas las piezas):
- 3 zonas claras: TOP (logo/wordmark Bewe pequeño esquina) · CENTRO (hook + visual) · BOTTOM (CTA + accent)
- Al menos 1 elemento visual NO-TEXTO: SVG inline (icono, shape orgánico, blob, ilustración minimal) en color primary/secondary
- Wordmark "${BRAND.name}" Inter ExtraBold 800 visible siempre (esquina top-left o top-right · tamaño ~${Math.round(skill.width * 0.025)}px)
- Si la pieza es carrusel slide cover: agregá indicador "swipe →" o "1/N" en la esquina opuesta al wordmark
- NUNCA sólo texto sobre fondo · siempre composición con jerarquía visual

ENCODING UTF-8 (CRÍTICO · NO IGNORAR):
- Escribí los acentos como caracteres UTF-8 normales: á é í ó ú ñ ¿ ¡
- PROHIBIDO usar secuencias mojibake tipo Ã¡ Ã© Ã³ Â¿ Ã'  ‰ ³ ¡ (esos son bytes mal interpretados)
- Si el brief trae acentos, mantenelos EXACTAMENTE como vienen (á no Ã¡)
- Verificá tu output: si ves Ã o Â antes de un acento, está MAL · corregilo

EJEMPLO DE TÍTULO BIEN DIMENSIONADO (1080×1080):
- Brief largo: "¿Cuántas citas perdiste esta semana porque no pudiste responder a tiempo?"
- ❌ MAL: usar las 12 palabras como headline con font 96px → SE SALE DEL LIENZO
- ✅ BIEN: extraé los 2-4 conceptos clave · headline = "Citas perdidas." (2 palabras, font 120px, line-height 0.95) · subhead = "¿Cuántas no respondiste a tiempo esta semana?" (font 32px) · CTA = "Recuperá tu agenda →"
- Si el headline excede 5 palabras, REESCRIBÍ a versión corta · NUNCA pongas párrafos como headline
- Si el titular tiene >24 caracteres, usá clamp(${skill.width <= 600 ? "32px,3.5vw,48px" : "48px,7vw,96px"})
- Si tiene <12 caracteres, podés ir hasta clamp(${skill.width <= 600 ? "40px,5vw,72px" : "80px,10vw,144px"})

EJEMPLO COMPLETO (estructura · NO copies literal · adaptalo):
\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;800;900&family=Merriweather:ital@1&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after { box-sizing: border-box }
  html,body { width:${skill.width}px;height:${skill.height}px;margin:0;padding:0;overflow:hidden;font-family:Inter,system-ui,sans-serif;color:#0A2540 }
  .canvas { width:100%;height:100%;padding:${Math.round(skill.width * 0.07)}px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(135deg,#B0D2FC 0%,#CCFBF1 45%,#FAD19E 100%);position:relative }
  .wordmark { font-weight:800;font-size:${Math.round(skill.width * 0.024)}px;letter-spacing:-0.03em;color:#0A2540 }
  .hook { font-weight:900;font-size:clamp(56px,9vw,112px);letter-spacing:-0.035em;line-height:0.95;max-width:90% }
  .sub { font-weight:400;font-size:${Math.round(skill.width * 0.026)}px;opacity:0.72;line-height:1.4;max-width:80%;margin-top:24px }
  .cta { display:inline-flex;align-items:center;gap:10px;padding:18px 36px;border-radius:999px;background:linear-gradient(90deg,#60A5FA 0%,#34D399 50%,#60A5FA 100%);color:#fff;font-weight:700;font-size:${Math.round(skill.width * 0.022)}px;box-shadow:0 8px 24px rgba(10,37,64,0.18);align-self:flex-start;letter-spacing:-0.01em }
  .arrow { display:inline-block;transform:translateY(-1px) }
  .blob { position:absolute;width:${Math.round(skill.width * 0.4)}px;height:${Math.round(skill.width * 0.4)}px;border-radius:50%;background:radial-gradient(circle,#FAD19E 0%,transparent 70%);opacity:0.55;top:-10%;right:-12% }
  .ai-italic { font-family:Merriweather,serif;font-style:italic;font-weight:400 }
</style>
</head>
<body>
  <svg class="blob-svg" style="position:absolute;left:-8%;bottom:-12%;width:${Math.round(skill.width * 0.42)}px;height:${Math.round(skill.width * 0.42)}px" viewBox="0 0 200 200">
    <path fill="#34D399" fill-opacity="0.32" d="M48.5,-72.4C61.7,-65.8,70.6,-50.7,76.2,-35.2C81.7,-19.6,84,-3.6,80.4,10.4C76.7,24.4,67,36.4,55.7,46.8C44.4,57.3,31.4,66.4,16.4,72.4C1.4,78.4,-15.7,81.3,-29.6,76.1C-43.5,70.9,-54.3,57.6,-62.9,43.8C-71.5,30,-78.1,15.7,-79.2,1C-80.3,-13.6,-75.9,-28.5,-67.6,-40.2C-59.4,-51.9,-47.3,-60.3,-34.4,-67.1C-21.5,-73.9,-7.9,-79.1,5.6,-77.2C19.2,-75.4,35.3,-79,48.5,-72.4Z" transform="translate(100 100)" />
  </svg>
  <div class="canvas">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:2">
      <span class="wordmark">Bewe</span>
      <span style="font-weight:600;font-size:${Math.round(skill.width * 0.018)}px;opacity:0.55;letter-spacing:0.08em;text-transform:uppercase">Caso · 01</span>
    </div>
    <div style="position:relative;z-index:2">
      <div class="hook">Citas perdidas.</div>
      <div class="sub">¿Cuántas no respondiste a tiempo esta semana? Bewe responde por vos · agenda 24/7.</div>
    </div>
    <div style="position:relative;z-index:2;display:flex;justify-content:space-between;align-items:flex-end">
      <a class="cta">Recuperá tu agenda <span class="arrow">→</span></a>
      <span style="font-weight:600;font-size:${Math.round(skill.width * 0.016)}px;opacity:0.5;letter-spacing:0.1em;text-transform:uppercase">Desliza →</span>
    </div>
  </div>
</body>
</html>
\`\`\`

Notas del ejemplo:
- 3 zonas (top/middle/bottom) con flex justify-content space-between
- Wordmark + accent superior · headline grande pero CONTROLADO con clamp · subhead + CTA · footer con indicador
- 1-2 SVG blob orgánicos para textura
- Padding 7% del ancho
- Todo dentro de overflow:hidden

${variantHint}

Recuerda: SOLO HTML. Sin markdown. Brand kit OFICIAL pastel orgánico Linda.`;
}

/**
 * Arregla secuencias mojibake comunes (Latin-1 → UTF-8 mal codificado).
 * Gemini a veces devuelve "Ã¡" en lugar de "á" · este map cubre los típicos.
 */
const MOJIBAKE_MAP: Array<[string, string]> = [
  ["Ã¡", "á"],
  ["Ã©", "é"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ãº", "ú"],
  ["Ã±", "ñ"],
  ["Ã'", "ñ"],
  ["Ã€", "À"],
  ["Ã‰", "É"],
  ["ÃŒ", "Ì"],
  ["Ã“", "Ó"],
  ["Ãš", "Ú"],
  ["Ã‘", "Ñ"],
  ["Â¿", "¿"],
  ["Â¡", "¡"],
  ["Â°", "°"],
  ["Â·", "·"],
  ["Â", ""], // dangling Â antes de cualquier otro
  ["Ã‰", "É"],
  ["Ã®", "î"],
  ["Ã¤", "ä"],
  ["Ã¶", "ö"],
  ["Ã¼", "ü"],
  ["Ã¨", "è"],
  ["Ã ", "à"],
  ["Ã²", "ò"],
];

function fixMojibake(s: string): string {
  let out = s;
  for (const [bad, good] of MOJIBAKE_MAP) {
    if (out.includes(bad)) out = out.split(bad).join(good);
  }
  return out;
}

/**
 * Extrae el HTML útil de la respuesta del modelo.
 * - Quita fences ```html ... ``` si vinieron.
 * - Si arranca con <!DOCTYPE o <html, lo deja tal cual.
 * - Si trae <html> embebido en medio, recorta.
 * - Como último recurso, envuelve fragmento en esqueleto mínimo.
 * - Aplica fix de mojibake al final.
 */
function extractHtml(raw: string, skill: (typeof SKILLS)[number]): string | null {
  let s = raw.trim();
  const fence = s.match(/```(?:html)?\s*\n?([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  let html: string | null = null;
  if (/^<!DOCTYPE/i.test(s) || /^<html[\s>]/i.test(s)) {
    html = s;
  } else {
    const m = s.match(/<!DOCTYPE[\s\S]*?<\/html>/i) || s.match(/<html[\s\S]*?<\/html>/i);
    if (m) html = m[0];
    else if (s.length > 32 && /<\w+/.test(s)) {
      html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:${skill.width}px;height:${skill.height}px;font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${s}</body></html>`;
    }
  }
  if (!html) return null;
  return fixMojibake(html);
}
