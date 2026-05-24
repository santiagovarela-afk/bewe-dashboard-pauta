"use client";
import * as React from "react";
import { useMetaFetch } from "./use-meta-fetch";
import { PLAN } from "@/lib/config";

/**
 * Trae TODOS los ads de la cuenta this_month con creative completo + insights agregados.
 *
 * `effective_status` ∈ {ACTIVE, PAUSED, ARCHIVED} para excluir DELETED.
 * Si el plan no tiene visibilidad de creative (permisos) los campos vendrán
 * vacíos — la UI degrada graceful.
 */

export interface AdInsights {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpm?: string;
  frequency?: string;
  reach?: string;
  actions?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
}

export interface AdCreative {
  id?: string;
  thumbnail_url?: string;
  image_url?: string;
  image_hash?: string;
  title?: string;
  body?: string;
  call_to_action_type?: string;
  object_type?: string;
  effective_object_story_id?: string;
  video_id?: string;
  asset_feed_spec?: {
    images?: Array<{ url?: string; hash?: string }>;
    videos?: Array<{ video_id?: string; thumbnail_url?: string }>;
  };
  object_story_spec?: {
    link_data?: {
      image_hash?: string;
      picture?: string;
      message?: string;
      name?: string;
      description?: string;
      call_to_action?: { type?: string };
    };
    video_data?: {
      video_id?: string;
      image_url?: string;
      message?: string;
      title?: string;
      call_to_action?: { type?: string };
    };
  };
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  effective_status?: string;
  campaign_id: string;
  adset_id?: string;
  created_time?: string;
  creative?: AdCreative;
  ins?: AdInsights;
}

interface AdsApiRow {
  id: string;
  name: string;
  status: string;
  effective_status?: string;
  campaign_id: string;
  adset_id?: string;
  created_time?: string;
  creative?: AdCreative;
  insights?: { data?: AdInsights[] };
}

interface AdsApiResponse {
  data?: AdsApiRow[];
}

const FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "campaign_id",
  "adset_id",
  "created_time",
  "creative{id,thumbnail_url,image_url,image_hash,title,body,call_to_action_type,object_type,effective_object_story_id,video_id,asset_feed_spec,object_story_spec}",
  "insights.date_preset(this_month){spend,impressions,clicks,ctr,cpm,frequency,reach,actions,date_start,date_stop}",
].join(",");

const FILTERING = JSON.stringify([
  { field: "effective_status", operator: "IN", value: ["ACTIVE", "PAUSED", "ARCHIVED"] },
]);

export function useAds(opts?: { enabled?: boolean }) {
  const { enabled = true } = opts ?? {};
  const res = useMetaFetch<AdsApiResponse>(
    `${PLAN.meta.accountId}/ads`,
    {
      fields: FIELDS,
      filtering: FILTERING,
      limit: "200",
      date_preset: "this_month",
    },
    { enabled, ttlMs: 5 * 60 * 1000 },
  );

  const ads = React.useMemo<MetaAd[]>(() => {
    const rows = res.data?.data ?? [];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      effective_status: r.effective_status,
      campaign_id: r.campaign_id,
      adset_id: r.adset_id,
      created_time: r.created_time,
      creative: r.creative,
      ins: r.insights?.data?.[0],
    }));
  }, [res.data]);

  return {
    ads,
    loading: res.loading,
    error: res.error,
    isStale: res.isStale,
    refresh: res.refresh,
    fetchedAt: res.fetchedAt,
  };
}
