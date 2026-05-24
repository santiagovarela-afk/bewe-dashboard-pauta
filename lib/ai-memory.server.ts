/**
 * AI Memory · funciones SOLO para server runtime (Node).
 *
 * Este archivo se separó de `lib/ai-memory.ts` porque los `import` de
 * `node:fs/promises` y `node:path` arrastraban el módulo al bundle del
 * cliente (vía tab-config.tsx → ai-memory.ts), reventando el build de
 * webpack (`UnhandledSchemeError: node:`). Ahora sólo lo importan
 * API routes y otras funciones server-side.
 */
// Sufijo `.server.ts` indica intención · sólo importar desde API routes
// u otras funciones que corran en runtime Node.
import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_RULES } from "./ai-memory";
import type { AiMemoryFile } from "./types";

const FALLBACK: AiMemoryFile = { rules: DEFAULT_RULES, entries: [] };

/** Lee desde `.data/ai-memory.json`. */
export async function readMemoryServer(): Promise<AiMemoryFile> {
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

/** Escribe a `.data/ai-memory.json` (crea la carpeta si falta). */
export async function writeMemoryServer(data: AiMemoryFile): Promise<void> {
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "ai-memory.json");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}
