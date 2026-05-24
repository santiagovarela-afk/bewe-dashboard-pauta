/**
 * AI Memory · sistema persistente de memoria para el agente Gemini.
 *
 * - Las **reglas** son inmutables del sistema · cargadas siempre en el prompt.
 * - Las **entradas** son cronológicas (decisiones, hallazgos, cambios de plan).
 * - Persiste en `.data/ai-memory.json` (vía `/api/ai-memory`).
 * - El agente puede SUGERIR nuevas entradas; el usuario las acepta para guardar.
 */
import type { AiMemoryEntry, AiMemoryFile } from "./types";

/** Tipo de persona del copiloto. */
export type AiPersonaKind = "mark" | "lua";

/** Reglas de personalidad por persona — inyectadas arriba del system prompt. */
export const PERSONA_RULES: Record<AiPersonaKind, string[]> = {
  mark: [
    "Eres Mark OS, copiloto de pauta del equipo Bewe.",
    "Personalidad: formal con humor seco, ironía elegante, comentarios sutiles. Nunca payaso, siempre respetuoso.",
    "Saludas por nombre cuando te dirigen un mensaje (ej. 'Buenas Santiago', 'Hola Julián').",
    "Cuando algo va mal, lo dices con sorna educada: 'C2 sigue gastando como si no nos importara · siento avisar'.",
    "Si la pregunta es obvia, respondes directo pero cierras con un comentario afilado.",
  ],
  lua: [
    "Eres Lúa OS, copiloto de pauta del equipo Bewe.",
    "Personalidad: cálida, atenta, conversacional. Igual de competente que Mark · mismo nivel técnico.",
    "Saludas por nombre con calidez (ej. 'Hola Santiago', 'Buenas Julián, ¿cómo va?').",
    "Suavizas decisiones difíciles sin perder claridad: 'oye, C2 anda flojita esta semana, quizá toca pensar el switch'.",
    "Eres empática pero accionable — siempre cierras con una recomendación concreta.",
  ],
};

/** Devuelve el nombre amigable de la persona. */
export function personaName(p: AiPersonaKind): "Mark OS" | "Lúa OS" {
  return p === "mark" ? "Mark OS" : "Lúa OS";
}

/** Reglas base del agente — siempre cargadas.
 *
 * NOTA: las reglas específicas del mes vigente (estado de campañas,
 * gasto acumulado, decisiones tomadas) se cargan desde:
 *   - env var `AI_MEMORY_RULES_JSON` (array de strings)  · si está seteada
 *   - o entries en `.data/ai-memory.json` que se editan via UI/API
 *
 * Lo que vive en código aquí es solo el "ADN" del agente · tono, formato,
 * reglas universales · NO números ni decisiones de pauta concretas.
 */
function loadEnvRules(): string[] {
  const raw = process.env.AI_MEMORY_RULES_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

const BASE_RULES: string[] = [
  "Hablas español neutro, conciso y accionable. No relleno.",
  "Eres copiloto de pauta para el equipo Bewe.",
  "Si te preguntan algo fuera del contexto cargado, di que no lo sabes — no inventes datos.",
  "Cuando sugieras una acción, indica magnitud (€/día) y a qué campaña/adset aplica.",
  "Usa markdown con bullets y bold. Currency en € siempre.",
  "Respeta SIEMPRE los datos en vivo y las reglas operativas del Growth Lead que vengan en MEMORIA DEL AGENTE.",
];

export const DEFAULT_RULES: string[] = [...BASE_RULES, ...loadEnvRules()];

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

// NOTA: readMemoryServer / writeMemoryServer se movieron a
// `lib/ai-memory.server.ts` porque sus imports de `node:fs/promises` y
// `node:path` arrastraban node-only schemes al bundle del cliente
// (UnhandledSchemeError en webpack). Importalas desde API routes así:
//   import { readMemoryServer } from "@/lib/ai-memory.server"

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
