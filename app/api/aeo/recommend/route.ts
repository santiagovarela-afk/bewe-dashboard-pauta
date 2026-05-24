/**
 * POST /api/aeo/recommend
 *
 * Toma el último run de AEO (.data/aeo-results.json) y le pide a Groq que
 * genere 5 recomendaciones concretas accionables para mejorar visibility
 * en LLMs.
 *
 * El endpoint NO corre prompts nuevos contra LLMs · solo analiza el último
 * run existente y genera recomendaciones. Costo: 1 request a Groq.
 *
 * Devuelve:
 *   {
 *     recommendations: Array<{
 *       title: string;
 *       detail: string;
 *       category: "content" | "seo" | "partnership" | "pricing" | "other";
 *     }>,
 *     basedOn: { runAt: string; visibilityPct: number; totalPrompts: number },
 *   }
 */
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import {
  computeStats,
  type AeoStore,
  type AeoRun,
} from "@/lib/aeo";
import { resolveDataPath } from "@/lib/data-paths";
import { askGroq } from "@/lib/aeo-groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATA_FILE = resolveDataPath("aeo-results.json");

type RecCategory = "content" | "seo" | "partnership" | "pricing" | "other";

interface Recommendation {
  title: string;
  detail: string;
  category: RecCategory;
}

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

const SYSTEM_PROMPT =
  "Eres un consultor experto en Answer Engine Optimization (AEO) para SaaS B2B. " +
  "Analiza los datos de visibilidad de una marca en LLMs y genera recomendaciones " +
  "CONCRETAS Y ACCIONABLES, en español, en formato JSON. " +
  "Cada recomendación debe ser específica (con números, keywords, plataformas concretas), " +
  "no genérica. Categoriza cada una como: content, seo, partnership, pricing, other.";

function buildUserPrompt(run: AeoRun): string {
  const stats = computeStats(run);
  const missed = run.results.filter((r) => !r.mentionsBewe && !r.errored);
  const hits = run.results.filter((r) => r.mentionsBewe);
  const missedByCat = new Map<string, string[]>();
  for (const m of missed) {
    const arr = missedByCat.get(m.category) ?? [];
    arr.push(m.promptText);
    missedByCat.set(m.category, arr);
  }

  const missedSummary = [...missedByCat.entries()]
    .map(([cat, list]) => `· ${cat} (${list.length}): ${list.slice(0, 3).join(" | ")}`)
    .join("\n");

  const topCompText = stats.topCompetitors
    .slice(0, 5)
    .map((c) => `${c.name} (${c.count})`)
    .join(", ");

  const topIndText = stats.topIndustries
    .slice(0, 5)
    .map((i) => `${i.name} (${i.count})`)
    .join(", ");

  const catVis = stats.byCategory
    .map((c) => `${c.category}: ${c.visibilityPct}% (${c.n} prompts)`)
    .join(" · ");

  return `Datos del último análisis AEO de la marca "Bewe" (software de gestión para salones, barberías, comercio y servicios):

VISIBILITY GLOBAL: ${stats.visibilityPct}% (Bewe apareció en ${hits.length}/${stats.totalPrompts} prompts)
POSICIÓN MEDIA: ${stats.avgPosition ?? "n/a"}
POR CATEGORÍA: ${catVis}

COMPETIDORES QUE DOMINAN: ${topCompText || "ninguno detectado"}
INDUSTRIAS ADYACENTES MENCIONADAS: ${topIndText || "ninguna"}

PROMPTS DONDE NO APARECIÓ BEWE (por categoría):
${missedSummary || "—"}

Genera EXACTAMENTE 5 recomendaciones priorizadas. Cada una debe ser específica y ejecutable.
Ejemplos del nivel de concreción esperado:
- "Tu marca aparece 0% en preguntas de 'comercio MX' · publicá 3 posts/mes con keyword 'POS para tiendas en México'"
- "Shopify domina (8 menciones) · diferenciate haciendo contenido específico de 'gestión de citas para servicios'"

DEVOLVÉ SOLO un JSON array, sin markdown ni texto extra, con este formato exacto:
[
  { "title": "...", "detail": "...", "category": "content" },
  ...
]

Categorías válidas: content, seo, partnership, pricing, other.`;
}

function parseRecommendations(raw: string): Recommendation[] {
  // Permite markdown fences
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  // Intenta extraer el primer array JSON
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const validCats: ReadonlyArray<RecCategory> = [
    "content",
    "seo",
    "partnership",
    "pricing",
    "other",
  ];

  const out: Recommendation[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const title = typeof rec.title === "string" ? rec.title : "";
    const detail = typeof rec.detail === "string" ? rec.detail : "";
    const catRaw = typeof rec.category === "string" ? rec.category.toLowerCase() : "other";
    const category: RecCategory = (validCats as readonly string[]).includes(catRaw)
      ? (catRaw as RecCategory)
      : "other";
    if (title && detail) out.push({ title, detail, category });
  }
  return out;
}

export async function POST() {
  const store = await readStore();
  if (store.runs.length === 0) {
    return NextResponse.json(
      { error: "No hay runs previos de AEO · corré /api/aeo/run primero" },
      { status: 400 },
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Falta GROQ_API_KEY en env vars" },
      { status: 500 },
    );
  }

  const sorted = [...store.runs].sort((a, b) => a.runAt.localeCompare(b.runAt));
  const latest = sorted[sorted.length - 1];
  const userPrompt = buildUserPrompt(latest);

  const groqRes = await askGroq(userPrompt, {
    system: SYSTEM_PROMPT,
    maxTokens: 1200,
    temperature: 0.6,
  });

  if (!groqRes.ok || !groqRes.text) {
    return NextResponse.json(
      { error: groqRes.error || "Groq error" },
      { status: groqRes.status ?? 500 },
    );
  }

  const recommendations = parseRecommendations(groqRes.text);
  if (recommendations.length === 0) {
    return NextResponse.json(
      {
        error: "Groq devolvió respuesta no parseable como JSON",
        raw: groqRes.text.slice(0, 600),
      },
      { status: 500 },
    );
  }

  const stats = computeStats(latest);
  return NextResponse.json({
    recommendations,
    basedOn: {
      runAt: latest.runAt,
      visibilityPct: stats.visibilityPct,
      totalPrompts: stats.totalPrompts,
    },
  });
}
