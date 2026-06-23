import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  comments?: Array<{ text: string }>;
}

/**
 * POST /api/comunidad/insights
 *
 * Recibe lista de comentarios y devuelve análisis: sentiment global,
 * top palabras clave, temas detectados. Útil para el resumen estratégico.
 */
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY no configurado" },
      { status: 500 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as Body;
  const comments = body.comments ?? [];
  if (comments.length === 0) {
    return NextResponse.json({
      ok: true,
      insights: { sentiment: { positive: 0, neutral: 0, negative: 0 }, keywords: [], themes: [] },
    });
  }

  // Cap a 80 comentarios para no quemar tokens.
  const sample = comments.slice(0, 80).map((c, i) => `${i + 1}. ${c.text.slice(0, 200)}`);

  const systemPrompt = `Eres un analista de comunidad de Bewe (SaaS para PYMEs: salones de belleza, retail, servicios). Analizas comentarios de redes sociales y devuelves insights estructurados.

Responde SOLO con JSON válido sin markdown.`;

  const userPrompt = `Analiza estos ${sample.length} comentarios de redes sociales de Bewe:

${sample.join("\n")}

Devuelve un JSON con esta estructura exacta:
{
  "sentiment": {
    "positive": <porcentaje 0-100>,
    "neutral": <porcentaje 0-100>,
    "negative": <porcentaje 0-100>
  },
  "keywords": [
    { "word": "<palabra clave>", "count": <veces que aparece o se infiere>, "context": "<breve contexto>" }
  ],
  "themes": [
    { "name": "<tema/categoría>", "mentions": <cantidad>, "examples": ["<ejemplo corto>"] }
  ],
  "highlights": [
    "<insight relevante en 1 frase>"
  ]
}

Máximo 8 keywords, 5 themes, 3 highlights. Sentiment suma 100%.`;

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
          temperature: 0.2,
          maxOutputTokens: 1200,
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
      const insights = JSON.parse(text);
      return NextResponse.json({ ok: true, insights });
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
