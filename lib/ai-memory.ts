/**
 * AI Memory · sistema persistente de memoria para el agente Gemini.
 *
 * - Las **reglas** son inmutables del sistema · cargadas siempre en el prompt.
 * - Las **entradas** son cronológicas (decisiones, hallazgos, cambios de plan).
 * - Persiste en `.data/ai-memory.json` (vía `/api/ai-memory`).
 * - El agente puede SUGERIR nuevas entradas; el usuario las acepta para guardar.
 */
import type { AiMemoryEntry, AiMemoryFile } from "./types";

/** Reglas base del agente — siempre cargadas. */
export const DEFAULT_RULES: string[] = [
  "Hablas español neutro, conciso y accionable. No relleno.",
  "Tu contexto es la estrategia de pauta Bewe mayo 2026 plantead por Julián Varela (CGPO). Owner: Santiago Varela.",
  "Presupuesto: €3.000 base + €1.000 contingencia condicional. Período: 12–31 mayo 2026.",
  "Thresholds CPT: agresivo €1.57 · objetivo €2.20 · warn €3.00 · crítico €5.50.",
  "Reglas Julián: ABO por adset. Reasignación ≤20% libre · >20% requiere aprobación.",
  "Día 7 (19/5): si una campaña CR <20 → Plan B switch a InitiateCheckout.",
  "Día 14 (26/5): activar C7 Retargeting solo si ≥1.000 visits + ≥30 trials. Contingencia €1.000 si ≥2 camps CPT<€3.",
  "C3 MX_SERVICIOS tiene anomalía CAPI confirmada · pixel dispara en page load · EXCLUIR del CPT global · NO pausar (genera señal de volumen).",
  "Watchpoint Colombia: si CO >40% del gasto LATAM → activar bid cap €2.",
  "Si te preguntan algo fuera del plan, di que no lo sabes — no inventes datos.",
  "Cuando sugieras una acción, indica magnitud (€/día) y a qué campaña/adset aplica.",
  "Usa markdown con bullets y bold. Currency en € siempre.",
];

export interface MemoryReadOptions {
  limit?: number;
}

const FALLBACK: AiMemoryFile = { rules: DEFAULT_RULES, entries: [] };

/** Cliente: lee del endpoint /api/ai-memory. */
export async function readMemoryClient(opts: MemoryReadOptions = {}): Promise<AiMemoryFile> {
  try {
    const u = new URL("/api/ai-memory", typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    if (opts.limit) u.searchParams.set("limit", String(opts.limit));
    const r = await fetch(u.toString(), { cache: "no-store" });
    if (!r.ok) return FALLBACK;
    const data = (await r.json()) as AiMemoryFile;
    return data;
  } catch {
    return FALLBACK;
  }
}

export async function appendMemoryClient(entry: Omit<AiMemoryEntry, "id" | "ts">) {
  const r = await fetch("/api/ai-memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!r.ok) throw new Error("Error appendMemory");
  return (await r.json()) as { ok: boolean; entry: AiMemoryEntry };
}

export async function deleteMemoryEntryClient(id: string) {
  const r = await fetch(`/api/ai-memory?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Error deleteMemory");
  return (await r.json()) as { ok: boolean };
}

/** Server: lee desde disco (.data/ai-memory.json). */
export async function readMemoryServer(): Promise<AiMemoryFile> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const file = path.join(process.cwd(), ".data", "ai-memory.json");
  try {
    const txt = await fs.readFile(file, "utf8");
    const data = JSON.parse(txt) as AiMemoryFile;
    return {
      rules: data.rules?.length ? data.rules : DEFAULT_RULES,
      entries: Array.isArray(data.entries) ? data.entries : [],
    };
  } catch {
    return { ...FALLBACK };
  }
}

export async function writeMemoryServer(data: AiMemoryFile) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "ai-memory.json");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

/** Construye el bloque de memoria para meter en el system prompt. */
export function memoryToPromptBlock(mem: AiMemoryFile, opts: { lastN?: number } = {}): string {
  const lastN = opts.lastN ?? 20;
  const recent = (mem.entries ?? []).slice(-lastN).reverse();
  const rules = mem.rules.map((r, i) => `  ${i + 1}. ${r}`).join("\n");
  const entries = recent.length
    ? recent
        .map((e) => `  [${e.ts.slice(0, 16)} · ${e.source}] ${e.topic}${e.ref ? ` (${e.ref})` : ""}: ${e.body}`)
        .join("\n")
    : "  (sin entradas registradas todavía)";
  return `MEMORIA DEL AGENTE\n──────────────────\nReglas inviolables:\n${rules}\n\nHistorial reciente (más nuevo primero, máx ${lastN}):\n${entries}`;
}
