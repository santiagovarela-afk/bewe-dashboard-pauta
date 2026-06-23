import { NextRequest, NextResponse } from "next/server";
import {
  fetchMessengerConversations,
  fetchConversationMessages,
  sendMessengerMessage,
} from "@/lib/comunidad-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET sin params  → lista conversaciones
 * GET ?convId=…   → mensajes de una conversación
 */
export async function GET(req: NextRequest) {
  const convId = req.nextUrl.searchParams.get("convId");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 25);
  try {
    if (convId) {
      const messages = await fetchConversationMessages(convId);
      return NextResponse.json({ ok: true, messages });
    }
    const conversations = await fetchMessengerConversations(limit);
    return NextResponse.json({ ok: true, conversations });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}

/** POST { recipientId, message } envía mensaje al usuario via Messenger. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    recipientId?: string;
    message?: string;
  };
  if (!body.recipientId || !body.message) {
    return NextResponse.json(
      { ok: false, error: "Faltan recipientId o message" },
      { status: 400 },
    );
  }
  const res = await sendMessengerMessage(body.recipientId, body.message);
  return NextResponse.json(res, { status: res.ok ? 200 : res.status });
}
