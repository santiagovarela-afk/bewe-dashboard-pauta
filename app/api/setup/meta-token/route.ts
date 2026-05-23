/**
 * POST /api/setup/meta-token
 *
 * Endpoint LOCAL-ONLY · valida un token Meta contra Graph API
 * y lo persiste en .env.local (en la raíz del proyecto).
 *
 * Permitido SOLO si:
 *   - Estamos en NODE_ENV=development O NEXT_PUBLIC_ALLOW_TOKEN_SETUP=1
 *   - El Origin/Host es localhost / 127.0.0.1
 *
 * En Vercel/prod NUNCA escribir tokens vía endpoint — el FS es read-only y
 * además sería un agujero. Esa parte se hace en el dashboard de Vercel.
 */
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import {
  defaultEnvPath,
  validateMetaToken,
  writeMetaTokenToEnv,
} from "@/lib/meta-token-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLocalRequest(req: NextRequest): boolean {
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin") || "";
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
  if (local.test(host)) return true;
  if (origin) {
    try {
      const u = new URL(origin);
      return local.test(u.host);
    } catch {
      return false;
    }
  }
  return false;
}

function isAllowed(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return isLocalRequest(req);
  if (process.env.NEXT_PUBLIC_ALLOW_TOKEN_SETUP === "1") return isLocalRequest(req);
  return false;
}

export async function POST(req: NextRequest) {
  if (!isAllowed(req)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "El setup del token solo está disponible en local. En producción, configura META_TOKEN en el dashboard de Vercel.",
      },
      { status: 403 },
    );
  }

  let body: { token?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const token = (body.token ?? "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Falta `token` en el body." }, { status: 400 });
  }

  // 1. Validar contra Meta
  const v = await validateMetaToken(token);
  if (!v.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: v.error || "Token inválido",
        step: "validate",
      },
      { status: 400 },
    );
  }

  // 2. Persistir a .env.local
  const envPath = defaultEnvPath(process.cwd());
  try {
    await writeMetaTokenToEnv(token, envPath);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: `No se pudo escribir ${envPath}: ${e instanceof Error ? e.message : "error desconocido"}`,
        step: "persist",
      },
      { status: 500 },
    );
  }

  // 3. Actualizar process.env del proceso vivo → el siguiente fetch ya funciona sin reinicio.
  process.env.META_TOKEN = token;

  return NextResponse.json({
    ok: true,
    user: v.user,
    accountOk: v.accountOk,
    accountName: v.accountName,
    envPath: path.relative(process.cwd(), envPath) || ".env.local",
    liveLoaded: true,
    restartNote:
      "Token cargado en caliente — el botón Actualizar ya debería traer datos en vivo. Reinicia solo si ves comportamientos raros.",
  });
}

export async function GET(req: NextRequest) {
  // health check rápido
  return NextResponse.json({
    allowed: isAllowed(req),
    cwd: process.cwd(),
    hint: "POST { token: 'EAA...' } para configurar.",
  });
}
