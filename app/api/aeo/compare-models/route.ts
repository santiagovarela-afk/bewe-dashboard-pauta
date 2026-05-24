/**
 * POST /api/aeo/compare-models
 *
 * Corre un subset de 10 prompts contra varios modelos de Groq para comparar
 * en qué LLM la marca aparece mejor.
 *
 * Modelos (todos en Groq · ajustables vía body.models):
 *  - llama-3.3-70b-versatile  (el actual · 70B)
 *  - llama-3.1-8b-instant     (más rápido · 8B)
 *  - mixtral-8x7b-32768       (Mixtral)
 *  - gemma2-9b-it             (Google · 9B)
 *
 * SECUENCIAL · respeta la cuota de 30 RPM. 10 prompts × 4 modelos = 40 reqs.
 * Pausa ~150ms entre requests + maneja 429 reintentando con espera.
 *
 * Devuelve:
 *   {
 *     comparisons: Array<{
 *       model: string;
 *       visibilityPct: number;
 *       avgLatencyMs: number;
 *       uniqueCompetitors: number;
 *       hits: number;
 *       total: number;
 *       errors: number;
 *     }>,
 *     promptCount: number;
 *     durationMs: number;
 *   }
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  AEO_PROMPTS,
  AEO_SYSTEM_PROMPT,
  detectBewe,
  detectCompetitors,
  type AeoPrompt,
} from "@/lib/aeo";
import { askGroq } from "@/lib/aeo-groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_MODELS: string[] = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

interface ModelComparison {
  model: string;
  visibilityPct: number;
  avgLatencyMs: number;
  uniqueCompetitors: number;
  hits: number;
  total: number;
  errors: number;
}

/**
 * Selecciona un subset balanceado de prompts (uno por categoría hasta completar n).
 */
function pickSubset(n: number): AeoPrompt[] {
  const byCat = new Map<string, AeoPrompt[]>();
  for (const p of AEO_PROMPTS) {
    const arr = byCat.get(p.category) ?? [];
    arr.push(p);
    byCat.set(p.category, arr);
  }
  const result: AeoPrompt[] = [];
  const cats = [...byCat.keys()];
  let idx = 0;
  while (result.length < n) {
    const cat = cats[idx % cats.length];
    const arr = byCat.get(cat);
    if (arr && arr.length > 0) {
      const next = arr.shift();
      if (next) result.push(next);
    }
    idx++;
    // Si todas las categorías quedaron vacías, salir
    if (cats.every((c) => (byCat.get(c)?.length ?? 0) === 0)) break;
  }
  return result.slice(0, n);
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Falta GROQ_API_KEY en env vars" },
      { status: 500 },
    );
  }

  let promptCount = 10;
  let models: string[] = DEFAULT_MODELS;
  try {
    const body = (await req.json()) as { promptCount?: number; models?: string[] };
    if (typeof body?.promptCount === "number" && body.promptCount > 0) {
      promptCount = Math.min(20, Math.max(3, Math.floor(body.promptCount)));
    }
    if (Array.isArray(body?.models) && body.models.length > 0) {
      models = body.models.filter((m): m is string => typeof m === "string");
    }
  } catch {
    // body opcional
  }

  const subset = pickSubset(promptCount);
  if (subset.length === 0) {
    return NextResponse.json({ error: "Sin prompts disponibles" }, { status: 400 });
  }

  const t0 = Date.now();
  const comparisons: ModelComparison[] = [];

  // SECUENCIAL · un modelo a la vez · dentro de cada modelo, un prompt a la vez
  for (const model of models) {
    let hits = 0;
    let errors = 0;
    const latencies: number[] = [];
    const competitors = new Set<string>();

    for (const p of subset) {
      const reqStart = Date.now();
      let res = await askGroq(p.text, {
        model,
        system: AEO_SYSTEM_PROMPT,
        maxTokens: 500,
        temperature: 0.5,
      });

      // Si rate-limited, esperar 5s y reintentar UNA vez
      if (!res.ok && res.quotaExhausted) {
        await new Promise((r) => setTimeout(r, 5000));
        res = await askGroq(p.text, {
          model,
          system: AEO_SYSTEM_PROMPT,
          maxTokens: 500,
          temperature: 0.5,
        });
      }

      const dt = Date.now() - reqStart;
      latencies.push(dt);

      if (res.ok && res.text) {
        if (detectBewe(res.text)) hits++;
        for (const c of detectCompetitors(res.text)) competitors.add(c);
      } else {
        errors++;
      }

      // Throttle: 150ms entre prompts del mismo modelo
      await new Promise((r) => setTimeout(r, 150));
    }

    const total = subset.length;
    comparisons.push({
      model,
      visibilityPct: total > 0 ? Math.round((hits / total) * 100) : 0,
      avgLatencyMs:
        latencies.length > 0
          ? Math.round(latencies.reduce((s, n) => s + n, 0) / latencies.length)
          : 0,
      uniqueCompetitors: competitors.size,
      hits,
      total,
      errors,
    });
  }

  return NextResponse.json({
    comparisons,
    promptCount: subset.length,
    durationMs: Date.now() - t0,
  });
}
