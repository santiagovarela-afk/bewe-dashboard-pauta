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
5. El <body> debe medir exactamente ${skill.width}px × ${skill.height}px (width/height fijos en html y body, overflow:hidden).
6. Fondo: usa --gradient-linda o --gradient-linda-soft o color sólido pastel (surfaceCream/surfaceAqua). NUNCA fondo oscuro salvo brief explícito.
7. Texto principal en color ${BRAND.colors.inkDeep} (navy). Texto secundario al 70% opacidad del navy.
8. Si el brief sugiere CTA, inclúyelo como pill button (border-radius 999px) con background --gradient-cta-linda y texto blanco + sombra navy suave + arrow "→" al final.
9. Si entra el wordmark "${BRAND.name}", úsalo en una esquina con Inter ExtraBold 800, color ink-deep.
10. Composición: jerarquía clara (1 titular grande Inter ExtraBold + soporte regular + CTA pill). Whitespace generoso · aire.

${variantHint}

Recuerda: SOLO HTML. Sin markdown. Brand kit OFICIAL pastel orgánico Linda.`;
}

/**
 * Extrae el HTML útil de la respuesta del modelo.
 * - Quita fences ```html ... ``` si vinieron.
 * - Si arranca con <!DOCTYPE o <html, lo deja tal cual.
 * - Si trae <html> embebido en medio, recorta.
 * - Como último recurso, envuelve fragmento en esqueleto mínimo.
 */
function extractHtml(raw: string, skill: (typeof SKILLS)[number]): string | null {
  let s = raw.trim();
  const fence = s.match(/```(?:html)?\s*\n?([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  if (/^<!DOCTYPE/i.test(s) || /^<html[\s>]/i.test(s)) return s;
  const m = s.match(/<!DOCTYPE[\s\S]*?<\/html>/i) || s.match(/<html[\s\S]*?<\/html>/i);
  if (m) return m[0];
  if (s.length > 32 && /<\w+/.test(s)) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:${skill.width}px;height:${skill.height}px;font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${s}</body></html>`;
  }
  return null;
}
