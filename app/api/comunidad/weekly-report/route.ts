import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  stats?: {
    period: string;
    totalComments: number;
    totalMessages: number;
    answered: number;
    pending: number;
    contactsByStage: Record<string, number>;
    topKeywords?: string[];
  };
}

/**
 * POST /api/comunidad/weekly-report
 *
 * Recibe estadísticas agregadas de la semana y devuelve un reporte
 * narrativo generado por Gemini. Pensado para que Esneider/Santiago/Julián
 * lean cada lunes.
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
  const s = body.stats;
  if (!s) {
    return NextResponse.json({ ok: false, error: "Faltan stats" }, { status: 400 });
  }

  const systemPrompt = `Eres el editor del reporte semanal de Comunidad de Bewe (SaaS PYMEs). Escribes resúmenes ejecutivos cortos, accionables, en español. Tono profesional y directo, sin relleno. Usas Markdown ligero.`;

  const respRate =
    s.totalComments + s.totalMessages > 0
      ? Math.round(
          (s.answered / (s.totalComments + s.totalMessages)) * 100,
        )
      : 0;

  const userPrompt = `Genera el reporte semanal de Comunidad para esta data:

PERÍODO: ${s.period}

INTERACCIONES:
- Comentarios totales: ${s.totalComments}
- Mensajes Messenger: ${s.totalMessages}
- Respondidos: ${s.answered} (${respRate}%)
- Pendientes: ${s.pending}

CRM funnel:
- Registrados: ${s.contactsByStage.registrado ?? 0}
- Calificados: ${s.contactsByStage.calificado ?? 0}
- Convertidos: ${s.contactsByStage.convertido ?? 0}
- Spam/descartado: ${s.contactsByStage.spam ?? 0}

${s.topKeywords?.length ? `Palabras clave mencionadas: ${s.topKeywords.join(", ")}` : ""}

Estructura del reporte (Markdown):

## Resumen ejecutivo
2-3 frases. Lo más importante de la semana.

## Highlights
- 3 bullets con lo más relevante (positivo o de atención).

## Funnel
1 párrafo interpretando los números del CRM. Si la conversión es baja, sugerencias.

## Recomendaciones para la próxima semana
- 3-4 acciones concretas para Esneider/equipo.

Máximo 300 palabras. Concreto, accionable.`;

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
          temperature: 0.5,
          maxOutputTokens: 800,
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
    return NextResponse.json({ ok: true, report: text });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
