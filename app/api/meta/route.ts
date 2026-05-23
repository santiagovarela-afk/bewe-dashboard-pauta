import { NextRequest, NextResponse } from "next/server";
import { metaCall } from "@/lib/meta-api";
import {
  buildCacheKey,
  readCache,
  writeCache,
  type CacheStatus,
} from "@/lib/meta-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readParams(req: NextRequest) {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "endpoint") params[k] = v;
  });
  return params;
}

/** Endpoints que SÍ se cachean en GET. Mantén la lista corta. */
function isCacheable(endpoint: string): boolean {
  return (
    /\/insights$/.test(endpoint) ||
    /\/ads$/.test(endpoint) ||
    /\/adsets$/.test(endpoint) ||
    /\/campaigns$/.test(endpoint) ||
    /\/media$/.test(endpoint) ||
    /\/posts$/.test(endpoint) ||
    /\/feed$/.test(endpoint) ||
    /\/photos$/.test(endpoint) ||
    /\/adcreatives$/.test(endpoint)
  );
}

export async function GET(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "Falta parámetro endpoint" }, { status: 400 });
  }
  const params = readParams(req);

  const bypass = params._nocache === "1" || !isCacheable(endpoint);
  const key = buildCacheKey(endpoint, params);

  if (!bypass) {
    const cached = readCache(key);
    if (cached && cached.status === "HIT") {
      return NextResponse.json(cached.entry.data, {
        status: cached.entry.status,
        headers: cacheHeaders("HIT", cached.entry.expiresAt - Date.now()),
      });
    }
  }

  const r = await metaCall({ endpoint, method: "GET", params });

  let cacheStatus: CacheStatus = bypass ? "BYPASS" : "MISS";
  if (!bypass && r.status >= 200 && r.status < 300) {
    const previous = readCache(key);
    if (previous && previous.status === "EXPIRED") cacheStatus = "EXPIRED";
    writeCache(key, r.data, r.status);
  }

  return NextResponse.json(r.data, {
    status: r.status,
    headers: cacheHeaders(cacheStatus),
  });
}

function cacheHeaders(status: CacheStatus, ageMs?: number): Record<string, string> {
  const h: Record<string, string> = { "X-Cache": status };
  if (ageMs != null && Number.isFinite(ageMs)) {
    h["X-Cache-Expires-In-Ms"] = String(Math.max(0, Math.round(ageMs)));
  }
  return h;
}

export async function POST(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "Falta parámetro endpoint" }, { status: 400 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const r = await metaCall({ endpoint, method: "POST", params: readParams(req), body });
  return NextResponse.json(r.data, { status: r.status });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "GET,POST,OPTIONS" },
  });
}
