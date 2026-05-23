/**
 * Cache en memoria del proceso para respuestas de la Meta Graph API.
 *
 * Por qué: muchas tabs disparan el MISMO endpoint en seguidilla (insights,
 * ads, posts) — y los usuarios quieren cambiar filtros sin esperar otro
 * round-trip a Facebook. TTL corto evita stale, key compuesta por endpoint
 * + query ordenada evita colisiones.
 *
 * Sólo cachea GET. POST nunca pasa por acá.
 */

export type CacheStatus = "HIT" | "MISS" | "EXPIRED" | "BYPASS";

interface Entry {
  data: unknown;
  status: number;
  expiresAt: number;
  storedAt: number;
}

const STORE = new Map<string, Entry>();

function defaultTtlMs(): number {
  const v = process.env.META_CACHE_TTL_SECONDS;
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n * 1000 : 30_000;
}

export function buildCacheKey(endpoint: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "_nocache")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${endpoint}?${sorted}`;
}

export function readCache(key: string): { entry: Entry; status: CacheStatus } | null {
  const entry = STORE.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (entry.expiresAt <= now) {
    return { entry, status: "EXPIRED" };
  }
  return { entry, status: "HIT" };
}

export function writeCache(key: string, data: unknown, status: number, ttlMs?: number): Entry {
  const ttl = ttlMs ?? defaultTtlMs();
  const entry: Entry = {
    data,
    status,
    storedAt: Date.now(),
    expiresAt: Date.now() + ttl,
  };
  STORE.set(key, entry);
  return entry;
}

export function clearCache(): number {
  const n = STORE.size;
  STORE.clear();
  return n;
}

export function listCache(): Array<{
  key: string;
  status: number;
  storedAt: string;
  expiresAt: string;
  expiresInMs: number;
  expired: boolean;
}> {
  const now = Date.now();
  return Array.from(STORE.entries()).map(([key, e]) => ({
    key,
    status: e.status,
    storedAt: new Date(e.storedAt).toISOString(),
    expiresAt: new Date(e.expiresAt).toISOString(),
    expiresInMs: e.expiresAt - now,
    expired: e.expiresAt <= now,
  }));
}

export function getTtlMs() {
  return defaultTtlMs();
}
