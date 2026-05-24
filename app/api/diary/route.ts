/**
 * app/api/diary/route.ts
 * Endpoint server-side para persistir snapshots diarios del diario de pauta.
 *
 * Persistencia: archivo JSON local en `.data/diary.json` (relativo al cwd).
 * Útil para cron jobs o equipos que quieran un histórico server-side.
 *
 * Forma de DiaryEntry reusada desde `@/lib/diary` para mantener consistencia
 * con el cliente (que persiste en localStorage). Este endpoint NO interfiere
 * con la persistencia en navegador — son almacenes paralelos opcionales.
 */
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import type { DiaryEntry } from "@/lib/diary";
import { resolveDataDir, resolveDataPath } from "@/lib/data-paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = resolveDataDir();
const DATA_FILE = resolveDataPath("diary.json");

/** Lee el archivo de diario; devuelve [] si no existe o está corrupto. */
async function readAll(): Promise<DiaryEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DiaryEntry[]) : [];
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return [];
    // archivo corrupto o no legible — devolver vacío en lugar de explotar
    return [];
  }
}

/** Escribe el array completo de entradas, creando `.data/` si hace falta. */
async function writeAll(entries: DiaryEntry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(entries, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

/** Normaliza una fecha ISO (acepta "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss…") a "YYYY-MM-DD". */
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Valida el body POST y construye un DiaryEntry mínimo. */
function buildEntryFromBody(body: unknown): DiaryEntry | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Body inválido: se esperaba JSON" };
  }
  const b = body as Record<string, unknown>;
  const dateISO = typeof b.date === "string" ? b.date : typeof b.dateISO === "string" ? b.dateISO : null;
  if (!dateISO) return { error: "Campo `date` requerido (YYYY-MM-DD)" };
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateISO)) {
    return { error: "Formato de `date` inválido. Esperado YYYY-MM-DD" };
  }

  const num = (v: unknown, def = 0): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
    return def;
  };
  const numOrNull = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && Number.isFinite(Number(v))) return Number(v);
    return null;
  };

  const entry: DiaryEntry = {
    dateISO: dateISO.length === 10 ? new Date(dateISO + "T12:00:00Z").toISOString() : dateISO,
    daysElapsed: num(b.daysElapsed, 0),
    spend: num(b.spend),
    cr: num(b.totalCR ?? b.cr),
    ic: num(b.totalIC ?? b.ic),
    contact: num(b.contact),
    cptReg: numOrNull(b.cptReg),
    cptIco: numOrNull(b.cptIco ?? b.cptIC),
    ctr: num(b.ctr),
    cpm: num(b.cpm),
    perCampaign: Array.isArray(b.perCampaign) ? (b.perCampaign as DiaryEntry["perCampaign"]) : [],
  };

  // Campo opcional `notes` — lo guardamos junto si viene, pero no rompe el tipo
  if (typeof b.notes === "string" && b.notes.trim() !== "") {
    (entry as DiaryEntry & { notes?: string }).notes = b.notes;
  }

  return entry;
}

export async function GET() {
  try {
    const entries = await readAll();
    const sorted = [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
    return NextResponse.json({ entries: sorted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido leyendo el diario";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON malformado" }, { status: 400 });
  }
  const built = buildEntryFromBody(body);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }
  try {
    const current = await readAll();
    const key = dayKey(built.dateISO);
    const filtered = current.filter((e) => dayKey(e.dateISO) !== key);
    const next = [...filtered, built].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    await writeAll(next);
    return NextResponse.json({ ok: true, entry: built, total: next.length }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido escribiendo el diario";
    return NextResponse.json({ error: `No se pudo persistir: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Query `?date=YYYY-MM-DD` requerida" },
      { status: 400 },
    );
  }
  try {
    const current = await readAll();
    const next = current.filter((e) => dayKey(e.dateISO) !== date);
    if (next.length === current.length) {
      return NextResponse.json({ ok: true, deleted: 0 });
    }
    await writeAll(next);
    return NextResponse.json({ ok: true, deleted: current.length - next.length, total: next.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido borrando entrada";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
