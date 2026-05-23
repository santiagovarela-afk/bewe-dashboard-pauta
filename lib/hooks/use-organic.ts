"use client";
import * as React from "react";
import { useMetaFetch } from "./use-meta-fetch";
import { PLAN } from "@/lib/config";

/**
 * Trae IG media + FB posts en paralelo (dos useMetaFetch independientes).
 *
 * Sobre `insights.metric()`:
 *   En MUCHAS cuentas falla si faltan permisos (`instagram_basic` +
 *   `instagram_manage_insights` + `pages_read_engagement`). Como el campo
 *   no es de bloqueo, lo intentamos pero ignoramos errores parciales — la
 *   UI cae de pie sólo con likes/comments del campo público.
 *
 * NO scrapeamos. Si insights vienen vacíos hay que añadir permisos al token
 * (ver tab Config).
 */

export interface IGInsightValue {
  name: string;
  values: Array<{ value: number }>;
}

export interface IGMedia {
  id: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  permalink?: string;
  insights?: { data?: IGInsightValue[] };
}

export interface FBPost {
  id: string;
  message?: string;
  full_picture?: string;
  created_time?: string;
  permalink_url?: string;
  reactions?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  shares?: { count?: number };
  insights?: { data?: IGInsightValue[] };
}

interface ListResp<T> {
  data?: T[];
}

const IG_FIELDS = [
  "id",
  "media_type",
  "media_product_type",
  "media_url",
  "thumbnail_url",
  "caption",
  "timestamp",
  "like_count",
  "comments_count",
  "permalink",
  // insights puede romper si faltan permisos · el server tolera el error y
  // devuelve igual el resto, pero por si acaso pedimos las métricas safe.
  "insights.metric(reach,impressions,saved,shares){values,name}",
].join(",");

const FB_FIELDS = [
  "id",
  "message",
  "full_picture",
  "created_time",
  "permalink_url",
  "reactions.summary(true)",
  "comments.summary(true)",
  "shares",
  "insights.metric(post_impressions,post_engagements){values,name}",
].join(",");

export function useOrganicIG(opts?: { enabled?: boolean; limit?: number }) {
  const { enabled = true, limit = 50 } = opts ?? {};
  // Fallback: si el endpoint completo falla por permisos de insights,
  // re-pedimos sin insights. Hacemos la lógica acá para no romper UI.
  const primary = useMetaFetch<ListResp<IGMedia>>(
    `${PLAN.meta.igAccountId}/media`,
    { fields: IG_FIELDS, limit: String(limit) },
    { enabled, ttlMs: 5 * 60 * 1000 },
  );

  // Si el server reportó error que parezca de permisos · fallback sin insights.
  const fallbackEnabled =
    enabled && !!primary.error && /permission|scope|insights/i.test(primary.error ?? "");
  const fallback = useMetaFetch<ListResp<IGMedia>>(
    `${PLAN.meta.igAccountId}/media`,
    {
      fields:
        "id,media_type,media_product_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,permalink",
      limit: String(limit),
    },
    { enabled: fallbackEnabled, ttlMs: 5 * 60 * 1000 },
  );

  const posts = React.useMemo<IGMedia[]>(() => {
    if (fallback.data?.data) return fallback.data.data;
    return primary.data?.data ?? [];
  }, [primary.data, fallback.data]);

  return {
    posts,
    loading: primary.loading || fallback.loading,
    error: fallbackEnabled ? fallback.error : primary.error,
    isStale: primary.isStale,
    refresh: async () => {
      await primary.refresh();
      if (fallbackEnabled) await fallback.refresh();
    },
    fetchedAt: primary.fetchedAt,
    /** true si los datos vinieron sin insights por falta de permisos */
    insightsMissing: fallbackEnabled,
  };
}

export function useOrganicFB(opts?: { enabled?: boolean; limit?: number }) {
  const { enabled = true, limit = 50 } = opts ?? {};
  const primary = useMetaFetch<ListResp<FBPost>>(
    `${PLAN.meta.pageId}/posts`,
    { fields: FB_FIELDS, limit: String(limit) },
    { enabled, ttlMs: 5 * 60 * 1000 },
  );

  const fallbackEnabled =
    enabled && !!primary.error && /permission|scope|insights/i.test(primary.error ?? "");
  const fallback = useMetaFetch<ListResp<FBPost>>(
    `${PLAN.meta.pageId}/posts`,
    {
      fields:
        "id,message,full_picture,created_time,permalink_url,reactions.summary(true),comments.summary(true),shares",
      limit: String(limit),
    },
    { enabled: fallbackEnabled, ttlMs: 5 * 60 * 1000 },
  );

  const posts = React.useMemo<FBPost[]>(() => {
    if (fallback.data?.data) return fallback.data.data;
    return primary.data?.data ?? [];
  }, [primary.data, fallback.data]);

  return {
    posts,
    loading: primary.loading || fallback.loading,
    error: fallbackEnabled ? fallback.error : primary.error,
    isStale: primary.isStale,
    refresh: async () => {
      await primary.refresh();
      if (fallbackEnabled) await fallback.refresh();
    },
    fetchedAt: primary.fetchedAt,
    insightsMissing: fallbackEnabled,
  };
}

/** Hook combinado para tabs que quieren ambos en paralelo. */
export function useOrganic(opts?: { enabled?: boolean; limit?: number }) {
  const ig = useOrganicIG(opts);
  const fb = useOrganicFB(opts);
  return {
    ig,
    fb,
    loading: ig.loading || fb.loading,
    error: ig.error || fb.error,
    refresh: async () => {
      await Promise.all([ig.refresh(), fb.refresh()]);
    },
  };
}
