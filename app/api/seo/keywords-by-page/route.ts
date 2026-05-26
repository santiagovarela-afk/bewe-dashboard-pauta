import { NextRequest, NextResponse } from "next/server";
import { fetchKeywordsByPage, isGSCConfigured } from "@/lib/google-search-console";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "s-maxage=3600, stale-while-revalidate=300",
};

interface KeywordsByPageBody {
  page?: unknown;
  days?: unknown;
  limit?: unknown;
}

export async function POST(req: NextRequest) {
  if (!isGSCConfigured()) {
    return NextResponse.json(
      { error: "GSC no configurado · admin debe conectar Google en /api/auth/google/start", configured: false },
      { status: 200, headers: CACHE_HEADERS },
    );
  }

  let body: KeywordsByPageBody = {};
  try {
    body = (await req.json()) as KeywordsByPageBody;
  } catch {
    return NextResponse.json(
      { error: "Body JSON inválido", configured: true },
      { status: 400 },
    );
  }

  const page = typeof body.page === "string" ? body.page : "";
  if (!page) {
    return NextResponse.json(
      { error: "Falta el campo 'page' (URL completa)", configured: true },
      { status: 400 },
    );
  }

  const days = typeof body.days === "number" && body.days > 0 && body.days <= 365
    ? Math.floor(body.days)
    : 28;
  const limit = typeof body.limit === "number" && body.limit > 0 && body.limit <= 1000
    ? Math.floor(body.limit)
    : 50;

  try {
    const data = await fetchKeywordsByPage({ page, days, limit });
    return NextResponse.json({ data, configured: true }, { status: 200, headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al consultar GSC";
    return NextResponse.json({ error: message, configured: false }, { status: 200 });
  }
}
