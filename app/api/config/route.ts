/**
 * GET /api/config
 *
 * Devuelve la config "client-safe" para que el cliente la consuma después
 * de login. Incluye Meta IDs, plan budget/dates/cpt, y campaigns map.
 * NO incluye passwords ni el array de users.
 *
 * En producción debería estar gated por sesión · por ahora confiamos en
 * Vercel Authentication (gate del URL) + el login app-level.
 */
import { NextResponse } from "next/server";
import { getClientSafeConfig } from "@/lib/private-config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getClientSafeConfig());
}
