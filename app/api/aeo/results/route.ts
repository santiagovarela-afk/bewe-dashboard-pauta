/**
 * GET /api/aeo/results
 *
 * Devuelve el último run de AEO + estadísticas agregadas, más un
 * histórico ligero (timestamps y visibility%) para mostrar evolución.
 *
 * Query: ?n=5 → cuántos runs incluir en la lista de historia. Default 5.
 */
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { computeStats, type AeoStore, type AeoRun } from "@/lib/aeo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), ".data", "aeo-results.json");

async function readStore(): Promise<AeoStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.runs)) return parsed as AeoStore;
    return { runs: [] };
  } catch {
    return { runs: [] };
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const n = Math.max(1, Math.min(20, Number(url.searchParams.get("n") ?? 5) || 5));

  const store = await readStore();
  if (store.runs.length === 0) {
    return NextResponse.json({
      hasData: false,
      latest: null,
      stats: null,
      history: [],
    });
  }

  const sorted = [...store.runs].sort((a, b) => a.runAt.localeCompare(b.runAt));
  const latest: AeoRun = sorted[sorted.length - 1];
  const stats = computeStats(latest);

  const history = sorted.slice(-n).map((r) => {
    const s = computeStats(r);
    return {
      runAt: r.runAt,
      visibilityPct: s.visibilityPct,
      avgPosition: s.avgPosition,
      totalPrompts: s.totalPrompts,
    };
  });

  return NextResponse.json({
    hasData: true,
    latest,
    stats,
    history,
  });
}
