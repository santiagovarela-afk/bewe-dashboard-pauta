/**
 * Seed Data · estado inicial del dashboard antes de que cargue data live
 * desde el Meta Graph API.
 *
 * Estos arrays se mantienen VACÍOS en el repo público. Los datos reales
 * vienen de:
 *   1. La llamada en vivo a `/api/meta` (cuando hay token configurado)
 *   2. El snapshot persistido en `.data/diary-*.json` (gitignored)
 *
 * Si querés tener un snapshot inicial para desarrollo offline, ponelo en
 * `lib/seed-data.private.ts` y agregalo a .gitignore (la convención
 * `*.private.ts` ya está en .gitignore).
 */
import type { Adset, Campaign } from "./types";

/** Campañas semilla · vacío en repo público · live data llena esto. */
export const SEED_CAMPAIGNS: Campaign[] = [];

/** Adsets semilla · vacío en repo público. */
export const SEED_ADSETS: Adset[] = [];

/** Label del snapshot · genérico. */
export const SEED_SNAPSHOT_LABEL = "Snapshot · sin datos locales";

/** Ads pausados · placeholder. La UI carga estos en runtime si hay data. */
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
