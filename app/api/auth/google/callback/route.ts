import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Sin code" }, { status: 400 });
  }
  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // OAuth no devolvió refresh · forzar reconsent
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;max-width:600px;margin:auto;background:#0a0a0a;color:#fff;">
        <h1 style="color:#ef4444">Falta refresh_token</h1>
        <p>Google no devolvió un refresh_token. Esto pasa cuando ya hiciste consent antes con esta app.</p>
        <p><strong>Solución</strong>: <a href="https://myaccount.google.com/permissions" style="color:#a78bfa">Revocá el acceso de "Bewe Pauta Dashboard" desde tu cuenta Google</a> y volvé a <a href="/api/auth/google/start" style="color:#a78bfa">/api/auth/google/start</a>.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html" } },
      );
    }
    // Mostrar el refresh_token al usuario para que lo cargue en Vercel
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;max-width:720px;margin:auto;background:#0a0a0a;color:#fff;">
      <h1 style="color:#a3e635;margin-bottom:24px">OAuth completado</h1>
      <p style="font-size:14px;color:#a1a1aa;margin-bottom:24px">Pegá este valor en Vercel como <code style="background:#1f1f1f;padding:2px 6px;border-radius:4px;color:#fff">GOOGLE_OAUTH_REFRESH_TOKEN</code> y redeploy.</p>
      <pre style="background:#1a1a1a;padding:20px;border-radius:8px;font-size:12px;word-break:break-all;white-space:pre-wrap;border:1px solid #27272a;line-height:1.5;">${tokens.refresh_token}</pre>
      <p style="font-size:13px;color:#71717a;margin-top:24px">Después del redeploy, las tabs SEO y los pasos del funnel GA4 traen data real.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
