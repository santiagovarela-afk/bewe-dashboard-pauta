/**
 * GET /api/connector-status
 * Lee `.data/connector-status.json` y lo devuelve al cliente.
 * Si el archivo no existe, devuelve `{phase:"offline"}` indicando que el
 * connector daemon no está corriendo.
 */
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const filePath = path.join(process.cwd(), ".data", "connector-status.json");
  try {
    const txt = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(txt);
    // Si el último update tiene > 30s y el phase no es connected → considerar stalled
    const updatedAt = data.updatedAt ? Date.parse(data.updatedAt) : 0;
    const ageMs = Date.now() - updatedAt;
    const stalled = ageMs > 30_000 && data.phase !== "connected";
    return NextResponse.json({ ...data, ageMs, stalled });
  } catch {
    return NextResponse.json({
      phase: "offline",
      message:
        "Connector daemon no está corriendo. Inícialo con `npm run connector` en otra terminal.",
      updatedAt: new Date().toISOString(),
    });
  }
}
