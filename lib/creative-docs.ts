/**
 * Creative Docs Loader · lee `_docs/creative/*.{md,txt}` y los expone como
 * un bloque de contexto que se inyecta server-side al system prompt de
 * Mark/Lúa (vía /api/gemini) y de Open Design (vía /api/design/generate).
 *
 * - Sólo lee archivos en server runtime (Node).
 * - Cachea el contenido 10 minutos para no leer disco en cada request.
 * - Llamar `invalidateCreativeDocsCache()` desde un endpoint para forzar reload.
 * - .docx / .pdf / imágenes se IGNORAN (sólo md/txt).
 */

import path from "node:path";
import { promises as fs } from "node:fs";

interface CreativeDoc {
  name: string;
  content: string;
  size: number;
}

interface CacheState {
  docs: CreativeDoc[];
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_DOC_CHARS = 12000; // truncar docs gigantes a 12k chars
const MAX_TOTAL_CHARS = 40000; // safety net global · si pasa de aquí truncamos
const ALLOWED_EXT = [".md", ".txt"];

let cache: CacheState | null = null;

/** Resetea el cache · usado por el endpoint /api/creative-docs/reload. */
export function invalidateCreativeDocsCache(): void {
  cache = null;
}

/**
 * Lee y cachea los docs creativos. Si la carpeta no existe, devuelve `[]`.
 */
export async function loadCreativeDocs(): Promise<CreativeDoc[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.docs;
  }

  const dir = path.join(process.cwd(), "_docs", "creative");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    cache = { docs: [], expiresAt: Date.now() + CACHE_TTL_MS };
    return [];
  }

  const docs: CreativeDoc[] = [];
  let totalChars = 0;

  for (const filename of entries) {
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) continue;
    if (filename.toUpperCase() === "README.MD") continue; // saltamos el README guía
    const full = path.join(dir, filename);
    try {
      const stat = await fs.stat(full);
      if (!stat.isFile()) continue;
      let content = await fs.readFile(full, "utf8");
      if (content.length > MAX_DOC_CHARS) {
        content = content.slice(0, MAX_DOC_CHARS) + "\n\n[...truncado · doc demasiado largo]";
      }
      if (totalChars + content.length > MAX_TOTAL_CHARS) {
        const room = Math.max(0, MAX_TOTAL_CHARS - totalChars);
        if (room < 200) break;
        content = content.slice(0, room) + "\n\n[...truncado · límite global]";
      }
      docs.push({ name: filename, content, size: stat.size });
      totalChars += content.length;
    } catch {
      // ignorar archivos rotos
    }
  }

  cache = { docs, expiresAt: Date.now() + CACHE_TTL_MS };
  return docs;
}

/**
 * Construye el bloque de contexto creativo para inyectar al system prompt.
 * Devuelve string vacío si no hay docs (no contamina el prompt).
 */
export async function buildCreativeContextBlock(): Promise<string> {
  const docs = await loadCreativeDocs();
  if (docs.length === 0) return "";

  const header =
    "CONTEXTO CREATIVO BEWE (briefs · guías de marca · tono de voz)\n" +
    "───────────────────────────────────────────────────────────────\n" +
    "Estos documentos definen la marca · respétalos al generar copies, " +
    "ideas, diseños y respuestas. Si una sugerencia choca con la guía, " +
    "prioriza la guía y avísalo.\n\n";

  const body = docs
    .map((d) => `### ${d.name}\n${d.content.trim()}`)
    .join("\n\n────────\n\n");

  return header + body;
}

/** Útil para diagnósticos · lista los docs cargados sin el contenido. */
export async function listCreativeDocs(): Promise<Array<Omit<CreativeDoc, "content">>> {
  const docs = await loadCreativeDocs();
  return docs.map(({ name, size }) => ({ name, size }));
}
