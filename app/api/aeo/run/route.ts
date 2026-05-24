/**
 * POST /api/aeo/run
 *
 * Corre los prompts de `lib/aeo.ts` contra Gemini, los analiza con la
 * heurística local y persiste el resultado en `.data/aeo-results.json`.
 *
 * Body opcional: { ids?: string[] }  → corre solo un subset.
 *
 * Devuelve: { run: AeoRun, stats: AeoStats }
 */
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  AEO_PROMPTS,
  AEO_SYSTEM_PROMPT,
  analyzeResponse,
  computeStats,
  type AeoRun,
  type AeoStore,
  type AeoResult,
} from "@/lib/aeo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min · 30 prompts × ~3s = ~1.5 min margen

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "aeo-results.json");

async function readStore(): Promise<AeoStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.runs)) return parsed as AeoStore;
    return { runs: [] };
  } catch {
    return { runs: [] };
  }
}

async function writeStore(store: AeoStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  // Limitamos a últimos 10 runs para no inflar el archivo
  const trimmed: AeoStore = { runs: store.runs.slice(-10) };
  await fs.writeFile(tmp, JSON.stringify(trimmed, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

async function askGemini(key: string, model: string, question: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: AEO_SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: question }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
    }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message ?? "Gemini error");
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Respuesta vacía (¿safety block o cuota?)");
  }
  return text;
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no configurado en .env.local" },
      { status: 500 },
    );
  }
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  let ids: string[] | undefined;
  try {
    const body = (await req.json()) as { ids?: string[] };
    if (Array.isArray(body?.ids)) ids = body.ids;
  } catch {
    // body opcional, ignorar
  }

  const prompts = ids
    ? AEO_PROMPTS.filter((p) => ids!.includes(p.id))
    : AEO_PROMPTS;

  if (prompts.length === 0) {
    return NextResponse.json({ error: "Sin prompts a correr" }, { status: 400 });
  }

  const t0 = Date.now();
  const results: AeoResult[] = [];
  // Secuencial para no saturar la cuota gratuita
  for (const p of prompts) {
    try {
      const text = await askGemini(key, model, p.text);
      results.push(analyzeResponse(p, text));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error desconocido";
      results.push({
        promptId: p.id,
        promptText: p.text,
        category: p.category,
        response: "",
        mentionsBewe: false,
        bewePosition: null,
        competitorsMentioned: [],
        industriesDetected: [],
        errored: true,
        errorMessage: msg,
      });
    }
    // Pequeño throttle para no quemar la cuota gratuita (60 RPM aprox.)
    await new Promise((r) => setTimeout(r, 250));
  }

  const run: AeoRun = {
    runAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    results,
  };

  try {
    const store = await readStore();
    store.runs.push(run);
    await writeStore(store);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error desconocido";
    return NextResponse.json(
      { error: `Corrida OK pero no se pudo persistir: ${msg}`, run },
      { status: 500 },
    );
  }

  return NextResponse.json({ run, stats: computeStats(run) });
}
