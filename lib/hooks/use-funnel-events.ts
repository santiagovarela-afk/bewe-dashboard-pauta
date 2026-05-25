"use client";
import * as React from "react";
import type { MultiEventResult } from "@/lib/google-analytics";

interface FunnelApiResponse {
  data?: MultiEventResult[];
  configured: boolean;
  error?: string;
  days?: number;
}

export interface UseFunnelEventsResult {
  events: Record<string, number>;
  loading: boolean;
  configured: boolean | null;
  error: string | null;
}

/**
 * Lee /api/analytics/funnel y devuelve un map { eventName: total } listo para
 * consumir en componentes. configured = null mientras carga.
 */
export function useFunnelEvents(days: number = 28): UseFunnelEventsResult {
  const [events, setEvents] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [configured, setConfigured] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/funnel?days=${days}`)
      .then((r) => r.json() as Promise<FunnelApiResponse>)
      .then((res) => {
        if (cancelled) return;
        setConfigured(res.configured);
        if (res.configured && res.data) {
          const next: Record<string, number> = {};
          for (const item of res.data) {
            next[item.eventName] = item.total;
          }
          setEvents(next);
        } else {
          setEvents({});
          if (res.error) setError(res.error);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setConfigured(false);
        setError(e instanceof Error ? e.message : "Error desconocido");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return { events, loading, configured, error };
}
