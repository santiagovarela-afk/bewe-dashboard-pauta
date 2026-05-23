import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no configurado en .env.local" },
      { status: 500 },
    );
  }
  let body: { question?: string; system?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!body.question) {
    return NextResponse.json({ error: "Falta question" }, { status: 400 });
  }
  // Modelo configurable. `gemini-flash-latest` apunta siempre al flash más reciente.
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: body.system ? { parts: [{ text: body.system }] } : undefined,
      contents: [{ parts: [{ text: body.question }] }],
      generationConfig: { maxOutputTokens: 700, temperature: 0.3 },
    }),
  });
  const data = await r.json();
  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json(
      { error: "Sin respuesta de Gemini (¿safety block o cuota agotada?)" },
      { status: 500 },
    );
  }
  return NextResponse.json({ text });
}
