import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Template {
  id: string;
  name: string;
  text: string;
}

interface Body {
  message?: string;
  platform?: "ig" | "fb" | "messenger";
  templates?: Template[];
  author?: string;
}

const BEWE_CONTEXT = `Eres un asistente que ayuda al equipo de Bewe a responder mensajes y comentarios en redes sociales.

BEWE es un software SaaS para PYMEs latinoamericanas — principalmente peluquerías, salones de belleza, barberías, spa, retail y servicios. Funciona como agenda + CRM + IA + automatizaciones + pagos. Audiencia: dueños de negocio con 1-30 empleados.

Tu trabajo es analizar UN mensaje/comentario recibido y recomendar QUÉ plantilla usar para responder. Nunca respondes tú mismo — solo recomiendas.

Criterios:
- Si el mensaje pregunta precio o costo → plantilla de precios
- Si pide info general / "qué es Bewe" → plantilla de info producto
- Si quiere demo, prueba, registrarse → plantilla de demo o trial
- Si es saludo o consulta abierta → plantilla de saludo
- Si agradece o reacciona positivo → plantilla de agradecimiento
- Si es spam, promo de terceros, off-topic → plantilla de descarte / no responder
- Si pide soporte técnico → plantilla de derivación a soporte
- Si la situación no calza con ninguna → suggestedId="" y explica por qué

Responde SOLO con JSON válido, sin markdown, sin texto extra.`;

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY no configurado" },
      { status: 500 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.message || !body.templates || body.templates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Faltan message o templates" },
      { status: 400 },
    );
  }

  const platformLabel =
    body.platform === "ig"
      ? "Comentario en Instagram"
      : body.platform === "fb"
        ? "Comentario en Facebook"
        : body.platform === "messenger"
          ? "Mensaje en Messenger"
          : "Mensaje en redes sociales";

  const templatesList = body.templates
    .map((t) => `- id="${t.id}" · nombre="${t.name}" · texto="${t.text.slice(0, 200)}"`)
    .join("\n");

  const userPrompt = `${platformLabel} ${body.author ? `de ${body.author}` : ""}:
"${body.message}"

Plantillas disponibles:
${templatesList}

Responde con JSON:
{
  "suggestedId": "<id de la plantilla recomendada, o '' si ninguna calza>",
  "confidence": <número 0-100>,
  "reason": "<razón breve, máximo 1 frase>",
  "adjustment": "<opcional · sugerencia para personalizar el texto de la plantilla>"
}`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: BEWE_CONTEXT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400,
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
    let parsed: {
      suggestedId?: string;
      confidence?: number;
      reason?: string;
      adjustment?: string;
    } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // si Gemini devuelve texto suelto, lo dejamos como reason
      parsed = { reason: text, suggestedId: "", confidence: 0 };
    }
    return NextResponse.json({ ok: true, suggestion: parsed });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
