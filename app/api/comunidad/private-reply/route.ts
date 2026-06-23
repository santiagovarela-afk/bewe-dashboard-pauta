import { NextRequest, NextResponse } from "next/server";
import { sendFBPrivateReply } from "@/lib/comunidad-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comunidad/private-reply
 *
 * Envía un DM privado al autor de un comentario público.
 *
 * Para Facebook:
 *   - Usa Private Reply API (POST /{comment-id}/private_replies)
 *   - Sólo funciona dentro de los primeros 7 días del comentario
 *   - Solo UNA vez por comentario
 *
 * Para Instagram:
 *   - NO se puede vía API (requiere scope `instagram_manage_messages`)
 *   - El frontend debe abrir https://ig.me/m/{username} en lugar
 *
 * Body: { commentId, platform, message }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    commentId?: string;
    platform?: "ig" | "fb";
    message?: string;
  };
  if (!body.commentId || !body.platform || !body.message) {
    return NextResponse.json(
      { ok: false, error: "Faltan commentId, platform o message" },
      { status: 400 },
    );
  }
  if (body.platform === "ig") {
    return NextResponse.json({
      ok: false,
      error:
        "IG Private Reply no disponible — falta scope `instagram_manage_messages`. Usa el link ig.me en su lugar.",
    });
  }
  try {
    const res = await sendFBPrivateReply(body.commentId, body.message);
    return NextResponse.json(res, { status: res.ok ? 200 : res.status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
