"use client";
import * as React from "react";
import type { GA4TrialsSummary } from "@/lib/google-analytics";

interface TrialsApiResponse {
  data?: GA4TrialsSummary;
  configured: boolean;
  error?: string;
}

export interface UseTrialsResult {
  data: GA4TrialsSummary | null;
  loading: boolean;
  configured: boolean | null;
  error: string | null;
}

export function useTrials(days: number = 28): UseTrialsResult {
  const [data, setData] = React.useState<GA4TrialsSummary | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [configured, setConfigured] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/trials?days=${days}`)
      .then((r) => r.json() as Promise<TrialsApiResponse>)
      .then((res) => {
        if (cancelled) return;
        setConfigured(res.configured);
        if (res.configured && res.data) {
          setData(res.data);
        } else {
          setData(null);
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

  return { data, loading, configured, error };
}
