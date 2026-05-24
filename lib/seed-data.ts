/**
 * Datos REALES verificados via Graph API el 2026-05-23 (período: 12-22 may 2026
 * de la batch MAY26 que arrancó el 12-may).
 *
 * Se usan como semilla mientras no hay fetch live desde el cliente.
 *
 * ESTADO al 23-may (confirmado por handoff Santi + Graph API):
 *  - 6 campañas MAY26 totales (C1-C6) · 3 ACTIVE · 3 PAUSED el 22-may
 *  - Solo C1, C2, C4 quedan vivas (todas CompleteRegistration)
 *  - C3 (IC) · C5 (IC) · C6 (IC) → pausadas por Plan B real del 22-may
 *  - C7 RETARGETING + C9 LATAM_SERVICIOS_CR · planeadas, NO creadas todavía
 *  - C8 LATAM_TOOLS · pospuesta a junio
 *
 * Cifras son MAY26 puras (no lifetime · lifetime API incluye períodos pre-may
 * con la marca anterior B2B que NO cuenta para este reporte).
 *
 * Fuente cifras: handoff 23-may (Santi + Mark OS chat anterior).
 */
import type { Adset, Campaign } from "./types";
import { CAMPAIGN_MAP } from "./config";
import { CPT_THRESHOLDS } from "./utils";

function flag(cid: string, cpt: number | null): Campaign["flag"] {
  // C3 sigue con anomalía pixel histórica (CTR 20.54% bot territory)
  if (cid === "52551556895286") return "anomaly";
  if (cpt === null) return null;
  if (cpt > CPT_THRESHOLDS.critical) return "critical";
  if (cpt > CPT_THRESHOLDS.warn) return "warn";
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// CAMPAÑAS · datos puros MAY26 12-22 may
// ──────────────────────────────────────────────────────────────────────
export const SEED_CAMPAIGNS: Campaign[] = [
  // C1 MX_BELLEZA — ACTIVE · ganadora (escalada 23-may de €26 a €40)
  // Acum MAY26 ~€293 (177.78 del 16-22 + ~€115 del 12-15)
  {
    ...CAMPAIGN_MAP["52551556599886"],
    status: "ACTIVE",
    daily: 40, // escalado el 23-may de €26 a €40 (CBO)
    spend: 293,
    impressions: 85200,
    clicks: 2089,
    ctr: 2.45,
    cpm: 3.44,
    reach: 41800,
    freq: 2.04,
    evContact: 48,
    evInitCheckout: 142,
    evCompleteReg: 44,
    conversions: 44,
    cpt: 6.66,
    flag: flag("52551556599886", 6.66),
  },
  // C2 MX_COMERCIO — ACTIVE · CPT crítico pero NO se hizo switch (Plan B descartado)
  // Acum MAY26 ~€253
  {
    ...CAMPAIGN_MAP["52551556733086"],
    status: "ACTIVE",
    daily: 21,
    spend: 253,
    impressions: 55400,
    clicks: 1837,
    ctr: 3.31,
    cpm: 4.57,
    reach: 34800,
    freq: 1.59,
    evContact: 35,
    evInitCheckout: 88,
    evCompleteReg: 22,
    conversions: 22,
    cpt: 11.50,
    flag: flag("52551556733086", 11.50),
  },
  // C3 MX_SERVICIOS — PAUSED 22-may (IC · 154 IC vs 3 signups vs 1 trial)
  // Acum MAY26 ~€199 · ya no se mueve
  {
    ...CAMPAIGN_MAP["52551556895286"],
    status: "PAUSED",
    daily: 0,
    spend: 199,
    impressions: 45300,
    clicks: 8950,
    ctr: 19.76,
    cpm: 4.39,
    reach: 29400,
    freq: 1.54,
    evContact: 352,
    evInitCheckout: 521,
    evCompleteReg: 13,
    conversions: 521,
    cpt: 0.38,
    flag: "anomaly",
  },
  // C4 LATAM_BELLEZA — ACTIVE · A4.1 escalado 23-may de €10 a €25 (ABO)
  // Acum MAY26 ~€218
  {
    ...CAMPAIGN_MAP["52551557046086"],
    status: "ACTIVE",
    daily: 25, // A4.1 LOK €25 (A4.2 INT pausado)
    spend: 218,
    impressions: 76800,
    clicks: 1623,
    ctr: 2.11,
    cpm: 2.84,
    reach: 38900,
    freq: 1.97,
    evContact: 44,
    evInitCheckout: 108,
    evCompleteReg: 38,
    conversions: 38,
    cpt: 5.74,
    flag: flag("52551557046086", 5.74),
  },
  // C5 LATAM_COMERCIO — PAUSED 22-may (IC · 240 IC vs 3 signups vs 1 trial)
  // Acum MAY26 ~€172
  {
    ...CAMPAIGN_MAP["52551557199886"],
    status: "PAUSED",
    daily: 0,
    spend: 172,
    impressions: 28800,
    clicks: 3920,
    ctr: 13.61,
    cpm: 5.97,
    reach: 21500,
    freq: 1.34,
    evContact: 215,
    evInitCheckout: 372,
    evCompleteReg: 4,
    conversions: 372,
    cpt: 0.46,
    flag: null,
  },
  // C6 LATAM_SERVICIOS — PAUSED 22-may (IC · 265 IC vs 1 signup vs 0 trials)
  // Acum MAY26 ~€146
  {
    ...CAMPAIGN_MAP["52551557419286"],
    status: "PAUSED",
    daily: 0,
    spend: 146,
    impressions: 14200,
    clicks: 2860,
    ctr: 20.14,
    cpm: 10.28,
    reach: 10350,
    freq: 1.37,
    evContact: 348,
    evInitCheckout: 452,
    evCompleteReg: 4,
    conversions: 452,
    cpt: 0.32,
    flag: null,
  },
];

// ──────────────────────────────────────────────────────────────────────
// ADSETS · solo los que existen en Ads Manager (9 adsets verificados)
// IDs reales del handoff
// ──────────────────────────────────────────────────────────────────────
export const SEED_ADSETS: Adset[] = [
  // C1 · 3 adsets (1 ACTIVE A1.2)
  { cid: "52551556599886", adsetId: "52551564222286", name: "A1.1_MX_LOK_BELLEZA",       spend: 18.40,  impressions: 3580,  clicks: 69,   ctr: 1.93,  cpm: 5.14,  reach: 2800,  freq: 1.28, conversions: 9,  cpt: 2.04 },
  { cid: "52551556599886", adsetId: "52551565131286", name: "A1.2_MX_CA_ENGAGERS",       spend: 198.20, impressions: 60900, clicks: 1620, ctr: 2.66,  cpm: 3.25,  reach: 29800, freq: 2.04, conversions: 33, cpt: 6.01 },
  { cid: "52551556599886", adsetId: "52551565552886", name: "A1.3_MX_INT_BELLEZA",       spend: 76.40,  impressions: 20720, clicks: 400,  ctr: 1.93,  cpm: 3.69,  reach: 9560,  freq: 2.17, conversions: 2,  cpt: 38.20 },
  // C2 · 4 adsets (1 ACTIVE A2.1)
  { cid: "52551556733086", adsetId: "52551565907686", name: "A2.1_MX_LOK_COMERCIO",      spend: 165.30, impressions: 41200, clicks: 1402, ctr: 3.40,  cpm: 4.01,  reach: 28600, freq: 1.44, conversions: 18, cpt: 9.18 },
  { cid: "52551556733086", adsetId: "52551566340486", name: "A2.2_MX_LOK_GURU",          spend: 9.77,   impressions: 1295,  clicks: 39,   ctr: 3.01,  cpm: 7.54,  reach: 1145,  freq: 1.13, conversions: 0,  cpt: null },
  { cid: "52551556733086", adsetId: "52559490106886", name: "A2.2_MX_LOK_GURU_v2",       spend: 6.42,   impressions: 980,   clicks: 24,   ctr: 2.45,  cpm: 6.55,  reach: 870,   freq: 1.13, conversions: 0,  cpt: null },
  { cid: "52551556733086", adsetId: "52551566715686", name: "A2.3_MX_INT_COMERCIO",      spend: 71.50,  impressions: 11920, clicks: 392,  ctr: 3.29,  cpm: 6.00,  reach: 4280,  freq: 2.79, conversions: 4,  cpt: 17.88 },
  // C4 · 2 adsets (1 ACTIVE A4.1)
  { cid: "52551557046086", adsetId: "52551567093686", name: "A4.1_LATAM_LOK_BELLEZA",    spend: 178.50, impressions: 65200, clicks: 1340, ctr: 2.06,  cpm: 2.74,  reach: 33800, freq: 1.93, conversions: 33, cpt: 5.41 },
  { cid: "52551557046086", adsetId: "52551567381286", name: "A4.2_LATAM_INT_BELLEZA",    spend: 39.50,  impressions: 11600, clicks: 283,  ctr: 2.44,  cpm: 3.41,  reach: 5100,  freq: 2.27, conversions: 5,  cpt: 7.90 },
];

export const SEED_SNAPSHOT_LABEL = "Snapshot · 12-22 may 2026 (MAY26 batch)";

// ──────────────────────────────────────────────────────────────────────
// ADS PAUSADOS el 23-may (los 5 del handoff · referencia rápida)
// ──────────────────────────────────────────────────────────────────────
export const PAUSED_ADS_23MAY = [
  { id: "52551678471086", name: "paraguas_imagen_v2_dol",  adsetId: "52551565131286", campaignId: "52551556599886", spend: 11.39, cr: 0,  reason: "Loss · sin conversiones" },
  { id: "52551756184086", name: "linda_imagen_v1_asp",     adsetId: "52551566715686", campaignId: "52551556733086", spend: 54.92, cr: 3,  reason: "CPR €18.31 (4× sobre target)" },
  { id: "52551754863486", name: "paraguas_imagen_v1_fun",  adsetId: "52551566715686", campaignId: "52551556733086", spend: 7.49,  cr: 0,  reason: "Loss" },
  { id: "52551759740486", name: "crm_imagen_v1_dol",       adsetId: "52551566715686", campaignId: "52551556733086", spend: 6.84,  cr: 0,  reason: "Loss" },
  { id: "52559490107886", name: "linda_imagen_v1_fun",     adsetId: "52559490106886", campaignId: "52551556733086", spend: 6.42,  cr: 0,  reason: "Loss" },
];

// ──────────────────────────────────────────────────────────────────────
// WINNERS · los 2 que se escalaron
// ──────────────────────────────────────────────────────────────────────
export const SCALED_WINNERS_23MAY = [
  { name: "C1 (CBO)",                  before: "€26/día", after: "€40/día", winnerAd: "paraguas_imagen_v2_asp", cr: 10, cpr: 4.02 },
  { name: "A4.1 LATAM_LOK_BELLEZA",    before: "€10/día", after: "€25/día", winnerAd: "mkt_imagen_v1_dol",       cr: 7,  cpr: 5.31 },
];
