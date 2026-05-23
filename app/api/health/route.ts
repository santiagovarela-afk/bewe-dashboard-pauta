import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const tokenConfigured = Boolean(process.env.META_TOKEN);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  return NextResponse.json({
    ok: true,
    metaToken: tokenConfigured,
    gemini: geminiConfigured,
    ts: new Date().toISOString(),
  });
}
