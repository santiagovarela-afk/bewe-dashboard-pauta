/**
 * lib/aeo-autogenerate.ts
 *
 * Helper SERVER-SIDE para autogenerar 30 prompts AEO con Gemini.
 * Si Gemini falla / no hay key / cuota agotada → fallback hardcoded (los
 * prompts seed de `lib/aeo.ts` extendidos a 30, mismo schema).
 *
 * Uso:
 *   const prompts = await autogenerateAeoPrompts();
 *
 * No toca filesystem · solo devuelve el array. El caller (route) persiste.
 */
import { AEO_PROMPTS, type AeoPrompt } from "./aeo";

export interface GeneratedAeoPrompt extends AeoPrompt {
  priority?: "high" | "mid" | "low";
}

const GENERATION_SYSTEM = "Eres experto en SEO conversacional / Answer Engine Optimization (AEO).";

const GENERATION_USER = `Genera 30 prompts categorizados que un cliente potencial preguntaría a ChatGPT/Claude/Gemini sobre estos rubros para encontrar herramientas como Bewe (software de gestión, agenda, POS para negocios de servicios):

- 10 prompts BELLEZA (salones, barberías, manicuristas, spas)
- 8 prompts COMERCIO (POS, inventario, tiendas)
- 8 prompts SERVICIOS (freelancers, profesionales, academias, agencias)
- 2 prompts BEWE-GENERIC (Bewe específico · "qué es", "para qué sirve")
- 2 prompts ADYACENTE (centros médicos, gimnasios, veterinarias, fisioterapia)

Devuelve JSON estricto (array), sin markdown, sin backticks, sin texto extra:

[{"id":"bel-1","category":"belleza","text":"...","priority":"high"}]

Categorías permitidas: "belleza" | "comercio" | "servicios" | "bewe-generic" | "adyacente".
Prioridades permitidas: "high" | "mid" | "low".
IDs con prefijo por categoría: bel-1..bel-10, com-1..com-8, ser-1..ser-8, bew-1..bew-2, ady-1..ady-2.`;

/** Llamada cruda a Gemini · NO captura errores (que el caller decida fallback). */
async function callGemini(key: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: GENERATION_SYSTEM }] },
      contents: [{ parts: [{ text: GENERATION_USER }] }],
      generationConfig: {
        maxOutputTokens: 2200,
        temperature: 0.55,
        responseMimeType: "application/json",
      },
    }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message ?? "Gemini error");
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Respuesta vacía de Gemini");
  }
  return text;
}

/** Sanea + valida la respuesta JSON. Devuelve null si no parsea bien. */
function parsePrompts(raw: string): GeneratedAeoPrompt[] | null {
  // Strip markdown code fences si los hubiera
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let arr: unknown;
  try {
    arr = JSON.parse(cleaned);
  } catch {
    // Intento extraer primer array
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      arr = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(arr)) return null;

  const validCats = new Set(["belleza", "comercio", "servicios", "bewe-generic", "adyacente"]);
  const out: GeneratedAeoPrompt[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const id = typeof obj.id === "string" ? obj.id : null;
    const category = typeof obj.category === "string" ? obj.category : null;
    const text = typeof obj.text === "string" ? obj.text : null;
    const priority = typeof obj.priority === "string" ? obj.priority : "mid";
    if (!id || !category || !text) continue;
    if (!validCats.has(category)) continue;
    out.push({
      id,
      category: category as AeoPrompt["category"],
      text,
      priority: (["high", "mid", "low"].includes(priority) ? priority : "mid") as
        | "high"
        | "mid"
        | "low",
    });
  }
  return out;
}

/** 30 prompts fallback hardcoded · usados si Gemini falla. Extiende AEO_PROMPTS base. */
const _EXTRA: GeneratedAeoPrompt[] = [
  { id: "ser-6", category: "servicios", text: "Software para freelancers que cobran por hora y agendan clientes", priority: "high" },
  { id: "ser-7", category: "servicios", text: "Plataforma SaaS para agencias de marketing pequeñas en LATAM", priority: "mid" },
  { id: "ser-8", category: "servicios", text: "Sistema para gestionar clientes recurrentes en negocios de servicios profesionales", priority: "mid" },
];

export const FALLBACK_PROMPTS: GeneratedAeoPrompt[] = [
  ...AEO_PROMPTS.map<GeneratedAeoPrompt>((p) => ({ ...p, priority: "mid" })),
  ..._EXTRA,
].slice(0, 30);

/** Genera 30 prompts AEO · intenta Gemini, cae a fallback si falla. */
export async function autogenerateAeoPrompts(opts?: {
  apiKey?: string;
  model?: string;
}): Promise<{ prompts: GeneratedAeoPrompt[]; source: "generated" | "fallback"; error?: string }> {
  const key = opts?.apiKey ?? process.env.GEMINI_API_KEY;
  const model = opts?.model ?? process.env.GEMINI_MODEL ?? "gemini-flash-latest";

  if (!key) {
    return {
      prompts: FALLBACK_PROMPTS,
      source: "fallback",
      error: "GEMINI_API_KEY no configurado · usando fallback",
    };
  }

  try {
    const raw = await callGemini(key, model);
    const parsed = parsePrompts(raw);
    if (!parsed || parsed.length < 20) {
      return {
        prompts: FALLBACK_PROMPTS,
        source: "fallback",
        error: `Gemini devolvió ${parsed?.length ?? 0} prompts · usando fallback`,
      };
    }
    return { prompts: parsed.slice(0, 30), source: "generated" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error desconocido";
    return {
      prompts: FALLBACK_PROMPTS,
      source: "fallback",
      error: `Gemini falló (${msg}) · usando fallback`,
    };
  }
}
