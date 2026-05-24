import { NextRequest, NextResponse } from "next/server";
import { buildCreativeContextBlock } from "@/lib/creative-docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/gemini
 *
 * Proxy a Google Generative Language API. Configurable via env:
 *   - GEMINI_API_KEY  · obligatorio
 *   - GEMINI_MODEL    · default "gemini-2.5-flash" (estable, no usar el alias
 *                       "gemini-flash-latest" porque rota y los modelos
 *                       2.5+/3.x consumen tokens internos de "thinking" que
 *                       comen el maxOutputTokens si no lo deshabilitas).
 *   - GEMINI_MAX_TOKENS · default 2048 (suficiente para respuestas largas)
 *
 * Devuelve `{text, finishReason, usage}` para diagnosticar truncamientos
 * y quota desde el cliente.
 */
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no configurado en .env.local" },
      { status: 500 },
    );
  }
  let body: { question?: string; system?: string; maxTokens?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!body.question) {
    return NextResponse.json({ error: "Falta question" }, { status: 400 });
  }

  // Modelo fijo · NO usar "gemini-flash-latest" (alias que rota a 2.5+/3.x).
  // 2.5-flash es estable, rápido y ya gestiona thinking budget correctamente.
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const maxOutputTokens = body.maxTokens ?? Number(process.env.GEMINI_MAX_TOKENS ?? "2048");

  // Inyectar contexto creativo (briefs · brand guide · tono) si existen docs
  // en _docs/creative/. Si la carpeta está vacía devuelve "" y no contamina.
  let systemFinal = body.system || "";
  try {
    const creative = await buildCreativeContextBlock();
    if (creative) {
      systemFinal = systemFinal
        ? `${systemFinal}\n\n${creative}`
        : creative;
    }
  } catch {
    // si el loader falla, seguimos sin él · nunca tirar la request
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const payload: Record<string, unknown> = {
    system_instruction: systemFinal ? { parts: [{ text: systemFinal }] } : undefined,
    contents: [{ parts: [{ text: body.question }] }],
    generationConfig: {
      maxOutputTokens,
      temperature: 0.4,
      // Desactivar tokens de "thinking" internos · si el modelo los soporta,
      // evita que el presupuesto se consuma antes de escribir la respuesta.
      // Modelos antiguos ignoran esta key (no rompe).
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Fetch a Gemini falló: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 502 },
    );
  }

  const data = await r.json();
  if (data.error) {
    const msg = String(data.error.message ?? "");
    // Quota agotada → mensaje claro para el cliente
    const isQuota = /quota|rate.?limit|exceeded/i.test(msg);
    return NextResponse.json(
      {
        error: msg,
        quotaExhausted: isQuota,
        hint: isQuota
          ? "El tier gratuito de Gemini se agotó. Activa billing en Google AI Studio o espera el reset (~24h)."
          : undefined,
      },
      { status: isQuota ? 429 : 500 },
    );
  }

  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  const finishReason = candidate?.finishReason ?? "UNKNOWN";

  if (!text) {
    const blocked = finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT";
    return NextResponse.json(
      {
        error: blocked
          ? `Respuesta bloqueada por safety filter (finishReason=${finishReason})`
          : `Respuesta vacía (finishReason=${finishReason}). Revisa maxOutputTokens.`,
        finishReason,
        usage: data?.usageMetadata,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    text,
    finishReason,
    usage: data?.usageMetadata,
    // Warning para el cliente si la respuesta se cortó (no por contenido)
    truncated: finishReason === "MAX_TOKENS",
  });
}
