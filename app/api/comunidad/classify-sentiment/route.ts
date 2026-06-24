import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClassifyRequest {
  items?: Array<{ id: string; text: string }>;
}

interface SentimentResult {
  id: string;
  sentiment: "positive" | "neutral" | "negative" | "spam";
  stage: "nuevo" | "positivo" | "neutral" | "negativo" | "convertido" | "descartado";
  confidence: number;
}

/**
 * POST /api/comunidad/classify-sentiment
 *
 * Recibe lista de textos (comentarios o mensajes) y devuelve clasificación
 * de sentiment + stage CRM sugerido para cada uno. Usa Gemini en batch.
 *
 * Para CRM auto-clasificación:
 *  - positive → positivo
 *  - neutral → neutral
 *  - negative → negativo
 *  - spam → descartado
 *
 * Body: { items: [{id, text}, ...] }
 * Returns: { ok, results: [{id, sentiment, stage, confidence}] }
 */
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY no configurado" }, { status: 500 });
  }
  const body = (await req.json().catch(() => ({}))) as ClassifyRequest;
  const items = body.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ ok: true, results: [] });
  }

  // Cap a 50 items por batch
  const sample = items.slice(0, 50);

  const systemPrompt = `Eres un clasificador de sentiment para comentarios y mensajes en redes sociales de Bewe (SaaS para PYMEs latinoamericanas).

Clasifica cada texto en UNA categoría:
- positive: muestra interés, elogio, pregunta con intención de comprar/probar, lead caliente
- neutral: pregunta general, consulta informativa, comentario neutro
- negative: crítica, queja, sentimiento adverso, decepción
- spam: promoción ajena, follow-me, off-topic, links sospechosos

Responde SOLO con JSON válido sin markdown.`;

  const userPrompt = `Clasifica estos ${sample.length} textos de redes sociales de Bewe:

${sample.map((it, i) => `${i + 1}. "${it.text.slice(0, 300)}"`).join("\n")}

Devuelve un JSON con esta estructura exacta:
{
  "results": [
    { "index": <número>, "sentiment": "positive|neutral|negative|spam", "confidence": <0-100> }
  ]
}

Sé estricto: solo "positive" si hay interés real (no neutro). "negative" para críticas reales (no preguntas).`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      }),
    });
    const data = (await r.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message: string };
    };
    if (data.error) {
      return NextResponse.json({ ok: false, error: data.error.message }, { status: 500 });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    try {
      const parsed = JSON.parse(text) as {
        results: Array<{ index: number; sentiment: string; confidence: number }>;
      };
      const results: SentimentResult[] = parsed.results.map((r) => {
        const item = sample[r.index - 1];
        if (!item) {
          return { id: "", sentiment: "neutral", stage: "neutral", confidence: 0 };
        }
        const sentiment = (["positive", "neutral", "negative", "spam"].includes(r.sentiment)
          ? r.sentiment
          : "neutral") as SentimentResult["sentiment"];
        const stage: SentimentResult["stage"] =
          sentiment === "positive" ? "positivo"
            : sentiment === "negative" ? "negativo"
              : sentiment === "spam" ? "descartado"
                : "neutral";
        return {
          id: item.id,
          sentiment,
          stage,
          confidence: typeof r.confidence === "number" ? r.confidence : 70,
        };
      });
      return NextResponse.json({ ok: true, results });
    } catch {
      return NextResponse.json({ ok: false, error: "Respuesta IA mal formada", raw: text });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
