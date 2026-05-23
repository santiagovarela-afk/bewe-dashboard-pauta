import { NextResponse } from "next/server";
import { clearCache, getTtlMs, listCache } from "@/lib/meta-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const entries = listCache();
  return NextResponse.json({
    ttlMs: getTtlMs(),
    count: entries.length,
    active: entries.filter((e) => !e.expired).length,
    expired: entries.filter((e) => e.expired).length,
    entries,
  });
}

export async function DELETE() {
  const cleared = clearCache();
  return NextResponse.json({ cleared });
}
