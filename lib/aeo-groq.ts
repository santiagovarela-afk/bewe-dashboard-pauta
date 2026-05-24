/**
 * AEO via Groq · Llama 3.3 70B Versatile (free tier · 30 req/min)
 *
 * Por qué Groq:
 * - Tier free generoso · 30 RPM con modelos grandes
 * - Sin tarjeta de crédito
 * - Llama 3.3 70B calidad similar a Gemini 2.5 Flash
 * - Latencia ultra baja (<1s)
 *
 * Por qué para AEO:
 * - El módulo AEO necesita correr 30 prompts en serie · 30 req/min cabe perfecto
 * - Tier free de Gemini (20 RPM) se agotaba con uso normal
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface GroqOptions {
  model?: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GroqResult {
  ok: boolean;
  text?: string;
  error?: string;
  /** Status code para que el caller decida si reintentar (429 = rate limit) */
  status?: number;
  /** True si la quota se agotó · el caller puede esperar y reintentar */
  quotaExhausted?: boolean;
}

/**
 * Llama a Groq con un prompt y devuelve la respuesta texto.
 * Manejo de errores con mensajes claros en español.
 */
export async function askGroq(
  prompt: string,
  opts: GroqOptions = {},
): Promise<GroqResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: "GROQ_API_KEY no configurado en env vars",
    };
  }

  const model = opts.model || DEFAULT_MODEL;
  const messages: Array<{ role: string; content: string }> = [];
  if (opts.system) {
    messages.push({ role: "system", content: opts.system });
  }
  messages.push({ role: "user", content: prompt });

  let resp: Response;
  try {
    resp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.4,
      }),
    });
  } catch (e) {
    return {
      ok: false,
      error: `Fetch a Groq falló: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  if (!resp.ok) {
    const isQuota = resp.status === 429;
    let bodyText = "";
    try {
      const j = await resp.json();
      bodyText = String(j.error?.message ?? JSON.stringify(j));
    } catch {
      bodyText = await resp.text().catch(() => "");
    }
    return {
      ok: false,
      status: resp.status,
      quotaExhausted: isQuota,
      error: isQuota
        ? "Groq rate limit alcanzado (30 req/min) · esperá 60s y reintentá"
        : `Groq HTTP ${resp.status}: ${bodyText.slice(0, 200)}`,
    };
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    return {
      ok: false,
      error: `Respuesta Groq sin texto · ${JSON.stringify(data).slice(0, 200)}`,
    };
  }
  return { ok: true, text };
}
