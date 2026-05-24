/**
 * POST /api/aeo/run
 *
 * Corre los prompts de `lib/aeo.ts` contra **Groq (Llama 3.3 70B)** como
 * LLM primario · si Groq falla, fallback a Gemini 2.5 Flash. Analiza las
 * respuestas con heurística local y persiste el resultado en `.data/`.
 *
 * Por qué Groq como primario:
 * - Free tier 30 RPM (vs 20 RPM de Gemini) · alcanza para 30 prompts
 * - Llama 3.3 70B = calidad similar a Gemini 2.5 Flash
 * - Latencia <1s · vs ~3-5s de Gemini
 *
 * Body opcional: { ids?: string[] }  → corre solo un subset.
 * Devuelve: { run: AeoRun, stats: AeoStats, provider: "groq" | "gemini" | "mixed" }
 */
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import {
  AEO_PROMPTS,
  AEO_SYSTEM_PROMPT,
  analyzeResponse,
  computeStats,
  type AeoRun,
  type AeoStore,
  type AeoResult,
} from "@/lib/aeo";
import { resolveDataDir, resolveDataPath } from "@/lib/data-paths";
import { askGroq } from "@/lib/aeo-groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min · 30 prompts × ~3s = ~1.5 min margen

const DATA_DIR = resolveDataDir();
const DATA_FILE = resolveDataPath("aeo-results.json");

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
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!groqKey && !geminiKey) {
    return NextResponse.json(
      { error: "Falta GROQ_API_KEY o GEMINI_API_KEY · al menos uno requerido" },
      { status: 500 },
    );
  }
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  let groqWins = 0;
  let geminiWins = 0;
  let consecutiveGroqQuotas = 0;

  // Secuencial · Groq primario · si quota, espera o fallback a Gemini
  for (const p of prompts) {
    let text: string | null = null;
    let provider: "groq" | "gemini" | null = null;
    let errorMsg = "";

    // 1. Intentar Groq (Llama 3.3 70B · 30 RPM free)
    if (groqKey && consecutiveGroqQuotas < 3) {
      const groqRes = await askGroq(p.text, {
        system: AEO_SYSTEM_PROMPT,
        maxTokens: 600,
        temperature: 0.5,
      });
      if (groqRes.ok && groqRes.text) {
        text = groqRes.text;
        provider = "groq";
        groqWins++;
        consecutiveGroqQuotas = 0;
      } else if (groqRes.quotaExhausted) {
        consecutiveGroqQuotas++;
        errorMsg = groqRes.error || "Groq quota";
      } else {
        errorMsg = groqRes.error || "Groq error";
      }
    }

    // 2. Fallback a Gemini si Groq falló
    if (!text && geminiKey) {
      try {
        text = await askGemini(geminiKey, geminiModel, p.text);
        provider = "gemini";
        geminiWins++;
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : "Gemini error";
      }
    }

    if (text && provider) {
      results.push(analyzeResponse(p, text));
    } else {
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
        errorMessage: errorMsg || "ambos providers fallaron",
      });
    }
    // Throttle suave · Groq aguanta más pero no abusemos
    await new Promise((r) => setTimeout(r, 150));
  }

  const provider: "groq" | "gemini" | "mixed" | "failed" =
    groqWins > 0 && geminiWins > 0
      ? "mixed"
      : groqWins > 0
        ? "groq"
        : geminiWins > 0
          ? "gemini"
          : "failed";

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

  return NextResponse.json({
    run,
    stats: computeStats(run),
    provider,
    providerBreakdown: { groq: groqWins, gemini: geminiWins },
  });
}
