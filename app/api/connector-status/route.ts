/**
 * GET /api/connector-status
 *
 * Lee `.data/connector-status.json` (estado del daemon local) y lo devuelve.
 * En PRODUCCIÓN (Vercel u otro serverless) el daemon NO existe · en ese caso
 * detectamos que META_TOKEN está cargado vía env var y devolvemos
 * `phase: "connected"` con un mensaje claro.
 */
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isServerlessProd(): boolean {
  // Vercel setea VERCEL=1 en producción y previews
  return Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
}

export async function GET() {
  const filePath = path.join(process.cwd(), ".data", "connector-status.json");
  try {
    const txt = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(txt);
    const updatedAt = data.updatedAt ? Date.parse(data.updatedAt) : 0;
    const ageMs = Date.now() - updatedAt;
    const stalled = ageMs > 30_000 && data.phase !== "connected";
    return NextResponse.json({ ...data, ageMs, stalled });
  } catch {
    // En serverless prod no hay daemon · si hay META_TOKEN en env vars,
    // reportamos "connected" porque las API routes lo van a usar directo.
    if (isServerlessProd()) {
      const hasToken = !!process.env.META_TOKEN;
      return NextResponse.json({
        phase: hasToken ? "connected" : "missing-token",
        message: hasToken
          ? "Meta conectado vía env vars (serverless · sin daemon)"
          : "Falta META_TOKEN en env vars del proyecto Vercel",
        updatedAt: new Date().toISOString(),
        serverless: true,
      });
    }
    // En dev local · el daemon es opcional pero recomendado
    return NextResponse.json({
      phase: "offline",
      message:
        "Connector daemon no está corriendo. Inícialo con `npm run connector` en otra terminal · OPCIONAL en local · innecesario en producción.",
      updatedAt: new Date().toISOString(),
    });
  }
}
