/**
 * POST /api/auth/login
 *
 * Body:  { email: string, password: string }
 * 200:   { ok: true, user: { email, name, role } }
 * 401:   { ok: false, error: "Credenciales inválidas" }
 * 500:   { ok: false, error: "Auth no configurado" }
 *
 * Las credenciales se validan SERVER-SIDE contra el env var
 * `AUTH_USERS_JSON` (cargado por lib/private-config.server.ts).
 * Las passwords nunca llegan al cliente.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateLogin, getPrivateConfig } from "@/lib/private-config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Falta email o password" },
      { status: 400 },
    );
  }

  // Si no hay users configurados en env, devolver 500 claro para diagnosticar
  const cfg = getPrivateConfig();
  if (cfg.users.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Auth no configurado · falta AUTH_USERS_JSON en env vars (Vercel / .env.local)",
      },
      { status: 500 },
    );
  }

  const user = validateLogin(email, password);
  if (!user) {
    // Pequeño delay para reducir efectividad de brute force
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return NextResponse.json(
      { ok: false, error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true, user });
}
