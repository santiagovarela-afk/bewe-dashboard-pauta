/**
 * Comunidad · Métricas y analytics
 *
 * Helpers para calcular:
 *  - Tasa de respuesta por plantilla
 *  - Heatmap de horarios de actividad
 *  - Top keywords del periodo
 *  - SLA aggregate
 */

import { loadTemplates, loadRespondedAt, type Template } from "./comunidad-tags";

// ─── TASA DE CONVERSIÓN POR PLANTILLA ─────────────────────────────────────

export interface TemplateMetrics {
  template: Template;
  uses: number;
  responseTimes: number[]; // ms desde que se cargó hasta que se envió
  avgResponseTime: number;
}

export function computeTemplateMetrics(): TemplateMetrics[] {
  const templates = loadTemplates();
  return templates.map((t) => ({
    template: t,
    uses: t.useCount,
    responseTimes: [], // poblado por backend real con PostHog en v2
    avgResponseTime: 0,
  }));
}

// ─── HEATMAP DE HORARIOS (cuando llegan interacciones) ────────────────────

export interface HeatmapCell {
  day: number; // 0-6 (Dom-Sáb)
  hour: number; // 0-23
  count: number;
}

export function buildHeatmap(timestamps: string[]): HeatmapCell[] {
  const grid: Record<string, number> = {};
  timestamps.forEach((ts) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return;
    const key = `${d.getDay()}:${d.getHours()}`;
    grid[key] = (grid[key] ?? 0) + 1;
  });
  const out: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      out.push({ day, hour, count: grid[`${day}:${hour}`] ?? 0 });
    }
  }
  return out;
}

// ─── TOP KEYWORDS (extracción simple sin IA) ───────────────────────────────

const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "y", "o", "u", "a", "al",
  "en", "con", "por", "para", "que", "se", "es", "son", "ser", "no", "si", "sí", "me", "te",
  "lo", "le", "mi", "tu", "su", "yo", "tú", "él", "ella", "esto", "esa", "ese", "muy", "más",
  "pero", "como", "qué", "cuál", "cuándo", "dónde", "porque", "tan", "ya", "está", "están",
  "ha", "han", "hay", "fue", "soy", "fui", "será", "ser", "the", "and", "for", "you", "this",
]);

export function extractTopKeywords(texts: string[], top = 10): Array<{ word: string; count: number }> {
  const counts: Record<string, number> = {};
  texts.forEach((t) => {
    const words = t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
    words.forEach((w) => {
      counts[w] = (counts[w] ?? 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([word, count]) => ({ word, count }));
}

// ─── SLA AGGREGATE ─────────────────────────────────────────────────────────

export interface SLAMetrics {
  totalAttended: number;
  avgResponseMs: number;
  rapidPct: number; // <1h
  normalPct: number; // 1-4h
  slowPct: number; // 4-24h
  criticalPct: number; // >24h
}

/**
 * Calcula SLA agregado basado en `respondedAt` timestamps + el tiempo de
 * creación de cada interacción.
 */
export function computeSLA(interactions: Array<{ id: string; createdAt: string }>): SLAMetrics {
  const respondedAt = loadRespondedAt();
  const responseTimes: number[] = [];
  interactions.forEach((i) => {
    const respTs = respondedAt[i.id];
    if (!respTs) return;
    const createdTs = new Date(i.createdAt).getTime();
    if (isNaN(createdTs)) return;
    const diff = respTs - createdTs;
    if (diff > 0) responseTimes.push(diff);
  });
  if (responseTimes.length === 0) {
    return { totalAttended: 0, avgResponseMs: 0, rapidPct: 0, normalPct: 0, slowPct: 0, criticalPct: 0 };
  }
  const avg = responseTimes.reduce((s, n) => s + n, 0) / responseTimes.length;
  const hours = (ms: number) => ms / 3600000;
  const rapid = responseTimes.filter((ms) => hours(ms) < 1).length;
  const normal = responseTimes.filter((ms) => hours(ms) >= 1 && hours(ms) < 4).length;
  const slow = responseTimes.filter((ms) => hours(ms) >= 4 && hours(ms) < 24).length;
  const critical = responseTimes.filter((ms) => hours(ms) >= 24).length;
  return {
    totalAttended: responseTimes.length,
    avgResponseMs: avg,
    rapidPct: (rapid / responseTimes.length) * 100,
    normalPct: (normal / responseTimes.length) * 100,
    slowPct: (slow / responseTimes.length) * 100,
    criticalPct: (critical / responseTimes.length) * 100,
  };
}

export function formatDurationMs(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}
