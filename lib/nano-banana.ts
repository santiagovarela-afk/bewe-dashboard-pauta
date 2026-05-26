/**
 * Cliente para Gemini 2.5 Flash Image · alias "Nano Banana" usado por
 * el equipo de Google AI Studio. Mismo API key que Gemini text.
 *
 * Usage:
 *   const result = await generateImage({ prompt, brandKit });
 *   // result.imageBase64 listo para data: URI o save to disk
 *
 * Endpoint:
 *   https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent
 *
 * Response shape (simplified):
 *   {
 *     candidates: [{
 *       content: {
 *         parts: [
 *           { text?: "..." },
 *           { inlineData: { mimeType: "image/png", data: "<base64>" } }
 *         ]
 *       }
 *     }]
 *   }
 */

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface NanoBananaResult {
  /** Raw base64 (sin prefijo data:). */
  imageBase64: string;
  /** Normalmente "image/png". */
  mimeType: string;
  /** Texto explicativo opcional que Gemini puede devolver junto a la imagen. */
  textResponse?: string;
}

export interface BrandKitInput {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontFamily?: string;
  /** URL o base64 (con prefijo data:). */
  logo?: string;
  /** Voz/tono visual · ej "profesional · cálido · directo". */
  voice?: string;
}

export type ImageAspectRatio = "1:1" | "9:16" | "16:9" | "4:5";

export interface GenerateImageOptions {
  prompt: string;
  brandKit?: BrandKitInput;
  aspectRatio?: ImageAspectRatio;
  /** Imagen de referencia opcional (base64 SIN prefijo "data:image/png;base64,"). */
  referenceImage?: string;
  /** Override · default lee process.env.GEMINI_API_KEY. */
  apiKey?: string;
  /** Si true, NO aplicamos enrichPromptForMarketing automáticamente. */
  skipEnrichment?: boolean;
  /** Temperature override (default 0.85). */
  temperature?: number;
}

interface GeminiInlinePart {
  inline_data: { mime_type: string; data: string };
}
interface GeminiTextPart {
  text: string;
}
type GeminiPart = GeminiInlinePart | GeminiTextPart;

interface GeminiResponsePart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  inline_data?: { mime_type: string; data: string };
}
interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiResponsePart[] };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

/**
 * Genera UNA imagen llamando a Nano Banana (Gemini 2.5 Flash Image).
 * Lanza Error con mensaje legible si falla.
 */
export async function generateImage(
  opts: GenerateImageOptions,
): Promise<NanoBananaResult> {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY no configurado · agrega tu key en .env.local",
    );
  }

  const brandContext = opts.brandKit
    ? buildBrandContext(opts.brandKit)
    : "";

  const aspectInstruction = opts.aspectRatio
    ? `\n\nFormato: ${opts.aspectRatio} aspect ratio. Asegurate que la composición funcione en ese formato exacto. No agregues bordes ni letterbox.`
    : "";

  const enriched = opts.skipEnrichment
    ? opts.prompt
    : enrichPromptForMarketing(opts.prompt, opts.brandKit);

  const fullPrompt = `${brandContext}${enriched}${aspectInstruction}`;

  const parts: GeminiPart[] = [{ text: fullPrompt }];
  if (opts.referenceImage) {
    // La imagen de referencia va PRIMERO · Gemini la usa como "edit base".
    parts.unshift({
      inline_data: {
        mime_type: "image/png",
        data: opts.referenceImage,
      },
    });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: opts.temperature ?? 0.85,
    },
  };

  const url = `${ENDPOINT}?key=${apiKey}`;
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `Network error contactando Nano Banana: ${(e as Error).message}`,
    );
  }

  if (!resp.ok) {
    const errText = await resp.text();
    let errMsg = `Nano Banana HTTP ${resp.status}`;
    try {
      const errJson = JSON.parse(errText) as { error?: { message?: string } };
      if (errJson.error?.message) errMsg = errJson.error.message;
    } catch {
      errMsg = errText.slice(0, 240) || errMsg;
    }
    throw new Error(errMsg);
  }

  const json = (await resp.json()) as GeminiResponse;
  if (json.error?.message) {
    throw new Error(json.error.message);
  }

  const partsResp = json.candidates?.[0]?.content?.parts ?? [];
  let imageBase64 = "";
  let mimeType = "image/png";
  let textResponse: string | undefined;
  for (const p of partsResp) {
    if (typeof p.text === "string" && p.text.length > 0) {
      textResponse = p.text;
    }
    const camel = p.inlineData;
    const snake = p.inline_data;
    if (camel?.data) {
      imageBase64 = camel.data;
      mimeType = camel.mimeType ?? "image/png";
    } else if (snake?.data) {
      imageBase64 = snake.data;
      mimeType = snake.mime_type ?? "image/png";
    }
  }

  if (!imageBase64) {
    const finish = json.candidates?.[0]?.finishReason ?? "UNKNOWN";
    throw new Error(
      `Nano Banana no devolvió imagen (finishReason=${finish}) · revisar prompt o safety filter`,
    );
  }

  return { imageBase64, mimeType, textResponse };
}

/** Util · convierte el resultado en data URI listo para <img src>. */
export function toDataUri(result: NanoBananaResult): string {
  return `data:${result.mimeType};base64,${result.imageBase64}`;
}

/**
 * Convierte un data URI ("data:image/png;base64,XXXX") en base64 plano,
 * útil para pasar imágenes referencia al endpoint.
 */
export function stripDataUriPrefix(input: string): string {
  const m = input.match(/^data:[^;]+;base64,(.*)$/);
  return m ? m[1] : input;
}

/**
 * Enriquece prompts del usuario con guías de estilo para evitar el look
 * "AI obvio" / stock. Se aplica auto salvo que opts.skipEnrichment=true o
 * que el prompt contenga keywords técnicas (foto de producto, infografía,
 * mockup técnico, screenshot, render 3D, diagrama).
 */
export function enrichPromptForMarketing(
  userPrompt: string,
  brandKit?: BrandKitInput,
): string {
  if (isTechnicalPrompt(userPrompt)) {
    return userPrompt;
  }

  const paletteHint = brandKit
    ? `Mantené ESTRICTAMENTE la paleta de marca (primary ${brandKit.primaryColor}, secondary ${brandKit.secondaryColor}${
        brandKit.accentColor ? `, accent ${brandKit.accentColor}` : ""
      }).`
    : "";

  const styleGuide = `
ESTILO VISUAL:
- Diseño editorial · NO stock photography clichés
- Tipografía bold y legible · jerarquía clara
- Composición con respiro · evitar saturación
- Mood profesional pero humano · evitar look "AI obvio"
- Lighting natural si hay objetos · evitar lighting 3D fake
- Sin watermarks ni textos genéricos
${paletteHint}

EVITAR:
- Robots, gears, lightbulbs como metáforas obvias
- Manos genéricas tipo stock
- Plantillas tipo Canva
- Sobre-saturación de elementos
- Texto pixelado o mal compuesto`;

  return `${userPrompt}\n\n${styleGuide}`;
}

const TECHNICAL_KEYWORDS = [
  "foto producto",
  "foto de producto",
  "product shot",
  "infograf",
  "mockup",
  "screenshot",
  "render 3d",
  "diagrama",
  "schematic",
  "wireframe",
  "blueprint",
  "ui screenshot",
];
function isTechnicalPrompt(p: string): boolean {
  const lower = p.toLowerCase();
  return TECHNICAL_KEYWORDS.some((k) => lower.includes(k));
}

function buildBrandContext(brand: BrandKitInput): string {
  const lines: string[] = ["BRAND KIT:"];
  lines.push(`- Color primario: ${brand.primaryColor}`);
  lines.push(`- Color secundario: ${brand.secondaryColor}`);
  if (brand.accentColor) lines.push(`- Color acento: ${brand.accentColor}`);
  if (brand.fontFamily) lines.push(`- Tipografía: ${brand.fontFamily}`);
  if (brand.voice) lines.push(`- Tono visual: ${brand.voice}`);
  lines.push("");
  lines.push(
    "Mantené ESTRICTAMENTE esa paleta y estética. Sin elementos genéricos de stock.",
  );
  lines.push("");
  return lines.join("\n");
}
