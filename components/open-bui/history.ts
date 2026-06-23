/**
 * Bewe Studio · historial local de generaciones.
 * Solo metadata + preview · se guarda en localStorage.
 */

export interface HistoryEntry {
  id: string;
  timestamp: number;
  skillId: string;
  brief: string;
  html: string;
  previewDataUri?: string;
  persona?: "mark" | "lua";
  variant?: number;
}

const KEY = "bw_open_design_history_v2";
const MAX = 30;

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

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
