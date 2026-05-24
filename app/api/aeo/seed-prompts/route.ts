/**
 * GET/POST /api/aeo/seed-prompts
 *
 * Idempotente · garantiza que .data/aeo-prompts.json exista con ≥20 prompts.
 *  - Si el archivo ya existe y tiene ≥20 prompts → devuelve esos (source:"existing")
 *  - Si no → genera 30 con Gemini (autogenerateAeoPrompts), fallback hardcoded
 *    si Gemini falla, y persiste.
 *
 * GET y POST se comportan igual para conveniencia (smoke test desde browser).
 *
 * Respuesta:
 *   { prompts: AeoPrompt[], count: number, source: "existing"|"generated"|"fallback" }
 */
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { autogenerateAeoPrompts, type GeneratedAeoPrompt } from "@/lib/aeo-autogenerate";
import type { AeoPrompt } from "@/lib/aeo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "aeo-prompts.json");

interface PromptStore {
  generatedAt: string;
  source: "generated" | "fallback";
  prompts: GeneratedAeoPrompt[];
}

async function readStore(): Promise<PromptStore | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.prompts) &&
      parsed.prompts.length > 0
    ) {
      return parsed as PromptStore;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeStore(store: PromptStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

async function handle(force: boolean) {
  // 1) Existente
  if (!force) {
    const existing = await readStore();
    if (existing && existing.prompts.length >= 20) {
      return NextResponse.json({
        prompts: existing.prompts,
        count: existing.prompts.length,
        source: "existing" as const,
        generatedAt: existing.generatedAt,
      });
    }
  }

  // 2) Autogenerar
  const { prompts, source, error } = await autogenerateAeoPrompts();
  const store: PromptStore = {
    generatedAt: new Date().toISOString(),
    source,
    prompts,
  };
  try {
    await writeStore(store);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error desconocido";
    return NextResponse.json(
      { prompts, count: prompts.length, source, error: `Persist failed: ${msg}` },
      { status: 200 },
    );
  }

  return NextResponse.json({
    prompts: prompts as AeoPrompt[],
    count: prompts.length,
    source,
    generatedAt: store.generatedAt,
    ...(error ? { error } : {}),
  });
}

export async function POST(req: Request) {
  // body opcional · { force: true } regenera ignorando cache
  let force = false;
  try {
    const body = (await req.json()) as { force?: boolean };
    force = !!body?.force;
  } catch {
    // sin body, OK
  }
  return handle(force);
}

export async function GET() {
  return handle(false);
}
