/**
 * Estado persistente de posts programados en la Parrilla.
 *
 * Storage: localStorage key `bw_parrilla_posts`.
 * Mantiene compatibilidad con el formato previo del tab-parrilla.tsx
 * (sin id ni createdAt → se generan al cargar).
 *
 * Todas las funciones son SSR-safe: chequean `typeof window`.
 */

export type ParrillaPlatform = "ig" | "fb" | "reel" | "story";

export interface ScheduledPost {
  id: string;
  /** ISO YYYY-MM-DD */
  date: string;
  /** Plataformas destino. IG y FB son los feeds; reel y story son sub-formatos de IG. */
  platforms: ParrillaPlatform[];
  caption: string;
  imageUrl?: string;
  /** Hora HH:MM (24h) sugerida — opcional, default 19:00 */
  time?: string;
  /** Objetivo del post (engagement, leads, awareness, brand). */
  goal?: "engagement" | "leads" | "awareness" | "brand";
  createdAt: string;
}

export const PARRILLA_STORAGE_KEY = "bw_parrilla_posts";

export function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface LegacyPost {
  id?: string;
  date: string;
  platforms: ParrillaPlatform[] | ("ig" | "fb")[];
  caption: string;
  imageUrl?: string;
  time?: string;
  goal?: ScheduledPost["goal"];
  createdAt?: string;
}

export function loadPosts(): ScheduledPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PARRILLA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: LegacyPost) => ({
      id: p.id ?? cryptoRandomId(),
      date: p.date,
      platforms: (p.platforms ?? ["ig"]) as ParrillaPlatform[],
      caption: p.caption ?? "",
      imageUrl: p.imageUrl,
      time: p.time,
      goal: p.goal,
      createdAt: p.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function savePosts(posts: ScheduledPost[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PARRILLA_STORAGE_KEY, JSON.stringify(posts));
  } catch {
    /* ignore quota errors */
  }
}

/** Agrupa por fecha → conteo. Útil para densidad de calendario. */
export function postsByDate(posts: ScheduledPost[]): Map<string, ScheduledPost[]> {
  const map = new Map<string, ScheduledPost[]>();
  for (const p of posts) {
    const list = map.get(p.date) ?? [];
    list.push(p);
    map.set(p.date, list);
  }
  return map;
}

/** Filtra a posts del mes (year/month 0-idx). */
export function postsForMonth(
  posts: ScheduledPost[],
  year: number,
  month: number,
): ScheduledPost[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return posts.filter((p) => p.date.startsWith(prefix));
}
