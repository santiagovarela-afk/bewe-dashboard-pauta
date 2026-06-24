import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook receiver para eventos en tiempo real de Meta.
 *
 * SETUP requerido en Meta App Dashboard:
 * 1. Webhooks → "Page" → URL: https://dashboard-pauta.vercel.app/api/comunidad/webhook
 * 2. Verify token (env var META_WEBHOOK_VERIFY_TOKEN)
 * 3. Suscribirse a fields: feed, comments, messages
 *
 * Este endpoint:
 *  - GET: handshake de verificación con Meta
 *  - POST: recibe eventos y los broadcast a clientes vía SSE/polling
 *
 * Por ahora SKELETON: registra el evento en memoria + log.
 * Próximo: agregar SSE/WebSocket para push real-time al dashboard.
 */

// Buffer en memoria de los últimos N eventos · accesible vía GET ?events=1
const EVENT_BUFFER: Array<{ ts: number; type: string; payload: unknown }> = [];
const MAX_BUFFER = 50;

interface MetaWebhookEntry {
  id: string;
  time: number;
  changes?: Array<{ field: string; value: unknown }>;
  messaging?: Array<{ sender?: { id: string }; recipient?: { id: string }; message?: { text?: string } }>;
}

/** GET — handshake de verificación de Meta + lectura de eventos buffereados. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  // Lectura de eventos (debug/polling)
  if (url.searchParams.get("events") === "1") {
    return NextResponse.json({ ok: true, events: EVENT_BUFFER });
  }

  // Handshake verificación de Meta
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN || "bewe-webhook-2026";

  if (mode === "subscribe" && token === expected) {
    return new Response(challenge ?? "ok", { status: 200 });
  }
  return NextResponse.json({ ok: false, error: "verify_token inválido" }, { status: 403 });
}

/** POST — recibe eventos de Meta · los registra en buffer + clasifica con sentiment. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { entry?: MetaWebhookEntry[]; object?: string };
    const entries = body.entry ?? [];

    for (const entry of entries) {
      // Comentarios y reacciones via changes (Page Feed)
      for (const change of entry.changes ?? []) {
        EVENT_BUFFER.push({
          ts: Date.now(),
          type: `change.${change.field}`,
          payload: change.value,
        });
      }
      // Mensajes via messaging (Messenger)
      for (const msg of entry.messaging ?? []) {
        EVENT_BUFFER.push({
          ts: Date.now(),
          type: "message",
          payload: msg,
        });
      }
    }
    while (EVENT_BUFFER.length > MAX_BUFFER) EVENT_BUFFER.shift();

    // Meta requiere 200 OK rápido (no procesar nada lento aquí)
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
