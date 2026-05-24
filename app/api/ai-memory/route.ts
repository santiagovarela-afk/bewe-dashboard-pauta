/**
 * /api/ai-memory · CRUD para la memoria del agente Gemini.
 * Persiste en `.data/ai-memory.json`.
 */
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RULES } from "@/lib/ai-memory";
import { readMemoryServer, writeMemoryServer } from "@/lib/ai-memory.server";
import type { AiMemoryEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "0", 10);
  const data = await readMemoryServer();
  if (limit > 0 && data.entries.length > limit) {
    data.entries = data.entries.slice(-limit);
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  let body: Partial<AiMemoryEntry> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!body.topic || !body.body) {
    return NextResponse.json({ error: "topic y body son requeridos" }, { status: 400 });
  }
  const entry: AiMemoryEntry = {
    id: uid(),
    ts: new Date().toISOString(),
    source: body.source ?? "user",
    topic: body.topic,
    body: body.body,
    ref: body.ref,
  };
  const mem = await readMemoryServer();
  mem.entries.push(entry);
  if (!mem.rules || mem.rules.length === 0) mem.rules = DEFAULT_RULES;
  await writeMemoryServer(mem);
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const mem = await readMemoryServer();
  const before = mem.entries.length;
  mem.entries = mem.entries.filter((e) => e.id !== id);
  await writeMemoryServer(mem);
  return NextResponse.json({ ok: true, removed: before - mem.entries.length });
}

export async function PUT(req: NextRequest) {
  // Reset rules to default (sólo si quien llama es admin · validado en UI)
  const body = await req.json().catch(() => ({}));
  if (body?.action === "reset-rules") {
    const mem = await readMemoryServer();
    mem.rules = DEFAULT_RULES;
    await writeMemoryServer(mem);
    return NextResponse.json({ ok: true, rules: DEFAULT_RULES });
  }
  return NextResponse.json({ error: "acción desconocida" }, { status: 400 });
}
