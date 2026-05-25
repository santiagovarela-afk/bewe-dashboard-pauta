import { NextRequest, NextResponse } from "next/server";
import { fetchOverview, isGSCConfigured } from "@/lib/google-search-console";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "s-maxage=3600, stale-while-revalidate=300",
};

function parseDays(req: NextRequest): number {
  const raw = req.nextUrl.searchParams.get("days");
  const n = raw ? Number(raw) : 28;
  if (!Number.isFinite(n) || n <= 0 || n > 365) return 28;
  return Math.floor(n);
}

export async function GET(req: NextRequest) {
  if (!isGSCConfigured()) {
    return NextResponse.json(
      { error: "GSC no configurado · falta GOOGLE_SA_KEY env var", configured: false },
      { status: 200, headers: CACHE_HEADERS },
    );
  }
  const days = parseDays(req);
  try {
    const data = await fetchOverview({ days });
    return NextResponse.json({ data, configured: true }, { status: 200, headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al consultar GSC";
    return NextResponse.json({ error: message, configured: false }, { status: 200 });
  }
}
