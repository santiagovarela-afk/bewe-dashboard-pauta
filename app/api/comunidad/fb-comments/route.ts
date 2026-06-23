import { NextRequest, NextResponse } from "next/server";
import { fetchFBComments, replyToFBComment } from "@/lib/comunidad-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ ok: false, error: "Falta postId" }, { status: 400 });
  }
  try {
    const comments = await fetchFBComments(postId);
    return NextResponse.json({ ok: true, comments });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    commentId?: string;
    message?: string;
  };
  if (!body.commentId || !body.message) {
    return NextResponse.json(
      { ok: false, error: "Faltan commentId o message" },
      { status: 400 },
    );
  }
  const res = await replyToFBComment(body.commentId, body.message);
  return NextResponse.json(res, { status: res.ok ? 200 : res.status });
}
