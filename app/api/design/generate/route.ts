import { NextRequest, NextResponse } from "next/server";
import { SKILLS, BRAND } from "@/components/open-bui/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  skillId?: string;
  brief?: string;
  variant?: number;
}

/**
 * POST /api/design/generate
 * Body: { skillId, brief, variant? }
 * Devuelve: { html: string }
 *
 * Proxy a Gemini con prompt-engineering específico para piezas Bewe.
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

  const system = buildSystemPrompt(skill, variant);
  const userMsg = `Brief: "${brief}"\nVariante: ${variant}\n\nGenera el HTML.`;

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
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
          maxOutputTokens: 4096,
          temperature: variant > 0 ? 0.95 : 0.7,
          topP: 0.95,
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
    return NextResponse.json({ error: data.error.message }, { status: 500 });
  }
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    return NextResponse.json(
      { error: "Sin respuesta del modelo (¿safety block o cuota agotada?)" },
      { status: 500 },
    );
  }

  const html = extractHtml(raw, skill);
  if (!html) {
    return NextResponse.json(
      { error: "El modelo no devolvió HTML válido. Intenta de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ html, skillId: skill.id, variant });
}

function buildSystemPrompt(
  skill: (typeof SKILLS)[number],
  variant: number,
): string {
  const variantHint =
    variant > 0
      ? `IMPORTANTE: esta es la variante #${variant}. Hazla SIGNIFICATIVAMENTE distinta a un primer intento — usa otra estructura, otros gradientes, otra jerarquía visual.`
      : "";

  return `Eres un diseñador senior de ${BRAND.name}. Tu trabajo: generar HTML+CSS PURO (sin React, sin Tailwind) que renderice una pieza de tipo "${skill.label}" en formato ${skill.aspect}.

Brand kit ${BRAND.name}:
- Colores: primary ${BRAND.colors.primary} (violeta), secondary ${BRAND.colors.secondary} (cyan), accent ${BRAND.colors.accent} (lime), ember ${BRAND.colors.ember}
- Fondo dark sugerido: ${BRAND.colors.dark} · fondo light: ${BRAND.colors.light}
- Fuente principal: ${BRAND.fonts.display} (system fonts, ya disponible)
- Tono: ${BRAND.voice}
- Tagline: "${BRAND.tagline}"

REGLAS DURAS:
1. Devuelve SOLO un documento HTML válido auto-contenido (<!DOCTYPE html>...</html>) con un único <style> dentro de <head>. NADA de texto explicativo antes o después.
2. NO uses recursos externos: ni Google Fonts, ni imágenes URL, ni librerías JS, ni Tailwind.
3. NO incluyas <script>. NO incluyas event handlers inline.
4. Imágenes/iconos: SVG inline o placeholders con gradientes/figuras geométricas. Permitido <img> solo con data: URI si es estrictamente necesario.
5. El lienzo debe medir exactamente ${skill.width}px × ${skill.height}px. Aplica width/height fijos en html y body. overflow:hidden.
6. Diseño: moderno · gradient suave · tipografía bold · jerarquía clara · whitespace generoso · alto contraste. Evita aspecto "Paint" o flat aburrido.
7. Usa los colores del brand kit como protagonistas. Acepta acentos neutros (blanco/gris) para balance.
8. Si el brief sugiere CTA, inclúyelo como botón visualmente destacado (pill o rectangle, con sombra).
9. Logo: si el espacio lo permite, incluye un wordmark "${BRAND.name}" pequeño (texto, no imagen) en una esquina.

${variantHint}

Devuelve únicamente el HTML.`;
}

/**
 * Extrae el HTML útil de la respuesta del modelo.
 * - Si viene en bloque ```html ... ```, lo desempaqueta.
 * - Si viene crudo, busca <!DOCTYPE o <html.
 * - Como último recurso, lo envuelve en un esqueleto.
 */
function extractHtml(raw: string, skill: (typeof SKILLS)[number]): string | null {
  let s = raw.trim();
  // Quita fences
  const fence = s.match(/```(?:html)?\s*\n?([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Si arranca con <!DOCTYPE o <html, lo dejamos tal cual
  if (/^<!DOCTYPE/i.test(s) || /^<html[\s>]/i.test(s)) return s;
  // Si trae <html> embebido en medio, recorta
  const m = s.match(/<!DOCTYPE[\s\S]*?<\/html>/i) || s.match(/<html[\s\S]*?<\/html>/i);
  if (m) return m[0];
  // Plan B: envuelve fragmento
  if (s.length > 32 && /<\w+/.test(s)) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:${skill.width}px;height:${skill.height}px;font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${s}</body></html>`;
  }
  return null;
}
