import { NextRequest, NextResponse } from "next/server";
import { fetchMultipleEvents, isGA4Configured } from "@/lib/google-analytics";
import { FUNNEL_EVENTS } from "@/lib/event-mapping";

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
  if (!isGA4Configured()) {
    return NextResponse.json(
      {
        configured: false,
        error: "GA4 no configurado · falta GA4_PROPERTY_ID y/o GOOGLE_SA_KEY",
      },
      { status: 200, headers: CACHE_HEADERS },
    );
  }

  const days = parseDays(req);
  const ga4Events = FUNNEL_EVENTS.map((e) => e.ga4Event).filter(
    (e): e is string => typeof e === "string" && e.length > 0,
  );

  try {
    const results = await fetchMultipleEvents(ga4Events, days);
    return NextResponse.json(
      { configured: true, data: results, days },
      { status: 200, headers: CACHE_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido al consultar GA4";
    return NextResponse.json(
      { configured: false, error: message },
      { status: 200 },
    );
  }
}
