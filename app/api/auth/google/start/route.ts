import { NextResponse } from "next/server";
import { buildConsentUrl, isOAuthConfigured } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET() {
  if (!isOAuthConfigured()) {
    return NextResponse.json(
      { error: "Cargá GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en Vercel" },
      { status: 503 },
    );
  }
  const url = buildConsentUrl();
  return NextResponse.redirect(url);
}
