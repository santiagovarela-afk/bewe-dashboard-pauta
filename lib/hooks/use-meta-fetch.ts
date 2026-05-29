"use client";
import * as React from "react";

/**
 * Hook genérico stale-while-revalidate sobre /api/meta.
 *
 * 1. Construye `/api/meta?endpoint=...&...params` (NO incluyas `endpoint` en `params`).
 * 2. Devuelve datos cacheados en localStorage inmediatamente (TTL configurable).
 * 3. Revalida en background contra el server (que tiene su propio cache en memoria).
 * 4. `refresh()` fuerza bypass del server-cache (`_nocache=1`) y re-fetch.
 *
 * NO bloquea la UI mientras revalida — el caller sólo ve `loading=true` la primera
 * vez (sin cache local) o tras `refresh()` explícito.
 */

interface UseMetaFetchOpts {
  enabled?: boolean;
  /** TTL local en milisegundos · default 5 minutos */
  ttlMs?: number;
  /** Auto refresh interval. 0 = nunca */
  refreshMs?: number;
  /** Override de la cache key (sino se compone de endpoint + params) */
  cacheKey?: string;
}

interface UseMetaFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  refresh: () => Promise<void>;
  fetchedAt: number | null;
}

interface CacheEntry<T> {
  data: T;
  storedAt: number;
}

// Reducido de 5 min → 2 min · Meta agrega data c/30-90 min, pero el cache
// más corto reduce el lag percibido y la confusión "no se actualiza".
// Para forzar refresh inmediato usa el botón Actualizar del dashboard.
const DEFAULT_TTL_MS = 2 * 60 * 1000;
const STORAGE_PREFIX = "bw_meta_cache:";

function readLocal<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, storedAt: Date.now() };
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* localStorage full / disabled · ignora */
  }
}

function buildUrl(endpoint: string, params: Record<string, string>, bypass = false) {
  const u = new URL("/api/meta", window.location.origin);
  u.searchParams.set("endpoint", endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
  });
  if (bypass) u.searchParams.set("_nocache", "1");
  return u.toString();
}

function buildKey(endpoint: string, params: Record<string, string>) {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return `${endpoint}?${sorted}`;
}

export function useMetaFetch<T = unknown>(
  endpoint: string,
  params: Record<string, string>,
  opts: UseMetaFetchOpts = {},
): UseMetaFetchReturn<T> {
  const { enabled = true, ttlMs = DEFAULT_TTL_MS, refreshMs = 0, cacheKey } = opts;
  const key = cacheKey ?? buildKey(endpoint, params);

  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fetchedAt, setFetchedAt] = React.useState<number | null>(null);

  // Para evitar set-state en componente desmontado
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Hidrata desde localStorage al montar o al cambiar la key
  React.useEffect(() => {
    const cached = readLocal<T>(key);
    if (cached) {
      setData(cached.data);
      setFetchedAt(cached.storedAt);
    } else {
      setData(null);
      setFetchedAt(null);
    }
    setError(null);
    // sólo cuando cambia la key
  }, [key]);

  const isStale = React.useMemo(() => {
    if (!fetchedAt) return true;
    return Date.now() - fetchedAt > ttlMs;
  }, [fetchedAt, ttlMs]);

  const doFetch = React.useCallback(
    async (bypass: boolean) => {
      if (!enabled) return;
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(buildUrl(endpoint, params, bypass));
        const j = (await r.json()) as T & { error?: { message?: string } };
        if (!r.ok || (j as { error?: { message?: string } })?.error) {
          const msg =
            (j as { error?: { message?: string } })?.error?.message ??
            `HTTP ${r.status}`;
          throw new Error(msg);
        }
        if (!mountedRef.current) return;
        setData(j);
        const now = Date.now();
        setFetchedAt(now);
        writeLocal<T>(key, j);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    // Importante: serializa params para que cambios disparen revalidación
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, JSON.stringify(params), enabled, key],
  );

  // Initial / param change · stale-while-revalidate
  React.useEffect(() => {
    if (!enabled) return;
    const cached = readLocal<T>(key);
    if (!cached || Date.now() - cached.storedAt > ttlMs) {
      void doFetch(false);
    }
  }, [enabled, key, ttlMs, doFetch]);

  // Auto refresh periódico
  React.useEffect(() => {
    if (!enabled || !refreshMs) return;
    const id = window.setInterval(() => {
      void doFetch(false);
    }, refreshMs);
    return () => window.clearInterval(id);
  }, [enabled, refreshMs, doFetch]);

  const refresh = React.useCallback(() => doFetch(true), [doFetch]);

  return { data, loading, error, isStale, refresh, fetchedAt };
}

/** Helpers para invalidar manualmente el cache local · útil tras publish/edit */
export function invalidateLocalMetaCache(prefix?: string) {
  if (typeof window === "undefined") return;
  const all = Object.keys(window.localStorage);
  for (const k of all) {
    if (k.startsWith(STORAGE_PREFIX) && (!prefix || k.includes(prefix))) {
      window.localStorage.removeItem(k);
    }
  }
}
