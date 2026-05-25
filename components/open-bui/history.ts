/**
 * Open Design · historial local de las últimas 10 piezas generadas.
 * Solo metadata + HTML · se guarda en localStorage. Reusable en el control panel.
 */

export interface HistoryEntry {
  id: string; // ISO timestamp
  skillId: string;
  brief: string;
  variant: number;
  html: string;
  persona: "mark" | "lua";
}

const KEY = "bw_open_design_history_v1";
const MAX = 10;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return (arr as HistoryEntry[]).slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const prev = loadHistory();
  const next = [entry, ...prev.filter((p) => p.id !== entry.id)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota · ignore */
  }
  return next;
}
