/**
 * Seed Data · esqueleto inicial del dashboard.
 *
 * IMPORTANTE: el `refresh()` del store (`lib/store.tsx`) hace
 * `rawCampaigns.map(...)` para enriquecer las campañas con datos en vivo
 * de la API Meta. Si `rawCampaigns` arranca vacío, el map devuelve vacío
 * y el dashboard muestra TODO en cero aunque la API responda OK.
 *
 * Por eso construimos el esqueleto a partir de `CAMPAIGN_MAP` (env var
 * `NEXT_PUBLIC_CAMPAIGNS_JSON`): mismas 6 campañas, con métricas en 0,
 * status "PAUSED" como default. Cuando llega la respuesta de la API
 * (vía /api/meta), el map encuentra cada campaign_id y llena los números.
 *
 * Los datos "puros MAY26" privados (paused ads, scaled winners, daily
 * timeline) viven en `.data/` (gitignored) si querés tenerlos locales.
 */
import type { Adset, Campaign } from "./types";
import { CAMPAIGN_MAP } from "./config";

/** Esqueleto · 6 campañas con métricas en 0 · listo para enriquecer con API. */
export const SEED_CAMPAIGNS: Campaign[] = Object.values(CAMPAIGN_MAP).map((c) => ({
  code: c.code,
  cid: c.cid,
  name: c.name,
  event: c.event,
  geo: c.geo,
  vertical: c.vertical,
  daily: c.daily,
  total: c.total,
  status: "PAUSED",
  spend: 0,
  impressions: 0,
  clicks: 0,
  ctr: 0,
  cpm: 0,
  reach: 0,
  freq: 0,
  conversions: 0,
  cpt: null,
  flag: c.cid === "52551556895286" ? "anomaly" : null,
  evContact: 0,
  evInitCheckout: 0,
  evCompleteReg: 0,
  evStartTrial: 0,
  evSubscribe: 0,
}));

/** Adsets · vacío en repo público · se enriquece con API. */
export const SEED_ADSETS: Adset[] = [];

/** Label del snapshot · genérico. */
export const SEED_SNAPSHOT_LABEL = "Cargando datos en vivo…";

/** Ads pausados · placeholder · llena con datos en vivo cuando aplique. */
export const PAUSED_ADS_23MAY: Array<{
  id: string;
  name: string;
  adsetId: string;
  campaignId: string;
  spend: number;
  cr: number;
  reason: string;
}> = [];

/** Ads escalados · placeholder. */
export const SCALED_WINNERS_23MAY: Array<{
  name: string;
  before: string;
  after: string;
  winnerAd: string;
  cr: number;
  cpr: number;
}> = [];
