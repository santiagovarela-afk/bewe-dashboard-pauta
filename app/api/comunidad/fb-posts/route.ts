import { NextRequest, NextResponse } from "next/server";
import { fetchFBPosts } from "@/lib/comunidad-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 25);
  try {
    const posts = await fetchFBPosts(limit);
    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
