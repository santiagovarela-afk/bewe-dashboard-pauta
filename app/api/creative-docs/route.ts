/**
 * /api/creative-docs
 *
 * GET   · lista los docs que Mark/Lúa están leyendo (sin contenido completo)
 * POST  · `{ action: "reload" }` invalida el cache · re-lee la carpeta
 *
 * Útil cuando subes un nuevo brief a `_docs/creative/` sin reiniciar el server.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  listCreativeDocs,
  invalidateCreativeDocsCache,
  loadCreativeDocs,
} from "@/lib/creative-docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const docs = await listCreativeDocs();
  return NextResponse.json({
    count: docs.length,
    docs,
    note:
      docs.length === 0
        ? "No hay docs .md/.txt en _docs/creative/. Sólo se leen estos formatos · .docx/.pdf se ignoran."
        : "Estos docs están inyectándose al system prompt de Mark/Lúa y Open Design.",
  });
}

export async function POST(req: NextRequest) {
  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.action !== "reload") {
    return NextResponse.json(
      { error: "action requerido · usa { \"action\": \"reload\" }" },
      { status: 400 },
    );
  }
  invalidateCreativeDocsCache();
  const docs = await loadCreativeDocs();
  return NextResponse.json({
    ok: true,
    reloaded: true,
    count: docs.length,
    docs: docs.map((d) => ({ name: d.name, size: d.size })),
  });
}
