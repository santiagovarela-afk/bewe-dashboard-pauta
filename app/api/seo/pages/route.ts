import { NextRequest, NextResponse } from "next/server";
import { fetchTopPages, isGSCConfigured } from "@/lib/google-search-console";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "s-maxage=3600, stale-while-revalidate=300",
};

function parseInt32(value: string | null, fallback: number, max: number): number {
  const n = value ? Number(value) : fallback;
  if (!Number.isFinite(n) || n <= 0 || n > max) return fallback;
  return Math.floor(n);
}

export async function GET(req: NextRequest) {
  if (!isGSCConfigured()) {
    return NextResponse.json(
      { error: "GSC no configurado · falta GOOGLE_SA_KEY env var", configured: false },
      { status: 200, headers: CACHE_HEADERS },
    );
  }
  const days = parseInt32(req.nextUrl.searchParams.get("days"), 28, 365);
  const limit = parseInt32(req.nextUrl.searchParams.get("limit"), 25, 1000);
  try {
    const data = await fetchTopPages({ days, limit });
    return NextResponse.json({ data, configured: true }, { status: 200, headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al consultar GSC";
    return NextResponse.json({ error: message, configured: false }, { status: 200 });
  }
}
