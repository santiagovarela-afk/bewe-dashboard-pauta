import { NextRequest, NextResponse } from "next/server";
import { SKILLS, BRAND } from "@/components/open-bui/skills";

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

  const system = buildSystemPrompt(skill, variant, persona);
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
      ? "Eres Lúa OS · sensibilidad cálida · prefieres composiciones más orgánicas, gradientes suaves cyan→lime y tipografía con más respiración."
      : "Eres Mark OS · sensibilidad afilada · prefieres composiciones angulares, contrastes fuertes violet/ember y tipografía bold densa.";

  return `${personaHint}

Eres diseñador senior de ${BRAND.name} (software de gestión para negocios de servicios profesionales).

BRAND KIT BEWE — OBLIGATORIO usarlo:
- Color primary:   ${BRAND.colors.primary} (violeta) · protagonista
- Color secondary: ${BRAND.colors.secondary} (cyan)
- Color accent:    ${BRAND.colors.accent} (lime)
- Color ember:     ${BRAND.colors.ember} (naranja cálido)
- Fondo dark:      ${BRAND.colors.dark}
- Fondo light:     ${BRAND.colors.light}
- Fuente: ${BRAND.fonts.display} (carga Inter de Google Fonts vía <link>)
- Tagline: "${BRAND.tagline}"
- Tono visual: gradient · tipografía bold · whitespace generoso · asimetría · alto contraste
- Estilo: moderno, profesional cálido, NO corporativo aburrido

PIEZA:
- Skill: "${skill.label}"
- Tamaño exacto del lienzo: ${skill.size} (${skill.aspect})
- Width × Height: ${skill.width}px × ${skill.height}px

REGLAS DURAS (no negociables):
1. Devuelve SOLO un documento HTML válido autocontenido empezando con <!DOCTYPE html>. NADA de markdown, NADA de triple backticks (\`\`\`), NADA de texto antes ni después del HTML.
2. CSS inline dentro de un único <style> en <head>. Permitido cargar Inter de Google Fonts con <link rel="preconnect"> + <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet"> en <head>.
3. Imágenes: SOLO SVG inline o gradientes CSS. PROHIBIDO <img src="http..."> o cualquier recurso de red salvo Google Fonts.
4. NO incluyas <script>. NO event handlers inline (onClick, onload…).
5. El <body> debe medir exactamente ${skill.width}px × ${skill.height}px (width/height fijos en html y body, overflow:hidden).
6. Usa los 4 colores del brand kit como protagonistas (primary violeta + 1 o 2 acentos). Acepta blanco/gris neutro para balance.
7. Si el brief sugiere CTA, inclúyelo como botón visualmente destacado (pill o rectángulo con sombra de color).
8. Si entra el wordmark "${BRAND.name}", úsalo en una esquina como texto (no logo de imagen).
9. Composición: jerarquía clara (1 titular grande + soporte + CTA). NO aspecto Paint, NO flat aburrido.

${variantHint}

Recuerda: SOLO HTML. Sin markdown.`;
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
