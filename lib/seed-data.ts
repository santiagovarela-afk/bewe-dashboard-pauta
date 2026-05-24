/**
 * Datos REALES traídos via MCP de Meta el 2026-05-22 (período: 1–23 may 2026).
 * Se usan como semilla cuando aún no se hace fetch live desde el cliente.
 *
 * Fuente: mcp tool ads_get_ad_entities, account act_929824683759001.
 *
 * Estado al 22-may:
 *  - C1, C2, C4 ACTIVE (las 3 CR originales, números reales del MCP).
 *  - C3 MX_SERVICIOS (IC) PAUSED por anomalía pixel · números congelados.
 *  - C5, C6 (IC) PAUSED por Plan B Julián · números congelados.
 *  - C3.NEW MX_SERVICIOS_CR (CR) ACTIVE · creada 22-may · números bajos honestos.
 *  - C7 RETARGETING (CR mixed) ACTIVE · activada día 14 · spend ~€0 (recién activada).
 *  - C8 LATAM_TOOLS NO se crea hasta junio.
 */
import type { Adset, Campaign } from "./types";
import { CAMPAIGN_MAP } from "./config";
import { CPT_THRESHOLDS } from "./utils";

function flag(cid: string, cpt: number | null): Campaign["flag"] {
  // C3 sigue siendo "anomalía" por pixel
  if (cid === "52551556895286") return "anomaly";
  if (cpt === null) return null;
  if (cpt > CPT_THRESHOLDS.critical) return "critical";
  if (cpt > CPT_THRESHOLDS.warn) return "warn";
  return null;
}

export const SEED_CAMPAIGNS: Campaign[] = [
  // C1 MX_BELLEZA — ACTIVE — €332.59, 50 CompleteReg, CPT €6.65
  {
    ...CAMPAIGN_MAP["52551556599886"],
    status: "ACTIVE",
    spend: 332.59,
    impressions: 98032,
    clicks: 2264,
    ctr: 2.31,
    cpm: 3.39,
    reach: 45911,
    freq: 2.14,
    evContact: 56,
    evInitCheckout: 174,
    evCompleteReg: 50,
    conversions: 50,
    cpt: 6.65,
    flag: flag("52551556599886", 6.65),
  },
  // C2 MX_COMERCIO — ACTIVE — €272.67, 24 CompleteReg, CPT €11.36
  {
    ...CAMPAIGN_MAP["52551556733086"],
    status: "ACTIVE",
    spend: 272.67,
    impressions: 59753,
    clicks: 1968,
    ctr: 3.29,
    cpm: 4.56,
    reach: 36947,
    freq: 1.62,
    evContact: 38,
    evInitCheckout: 95,
    evCompleteReg: 24,
    conversions: 24,
    cpt: 11.36,
    flag: flag("52551556733086", 11.36),
  },
  // C3 MX_SERVICIOS — PAUSED — €214.37, 558 IC, anomalía pixel
  {
    ...CAMPAIGN_MAP["52551556895286"],
    status: "PAUSED",
    spend: 214.37,
    impressions: 48485,
    clicks: 9655,
    ctr: 19.91,
    cpm: 4.42,
    reach: 31412,
    freq: 1.54,
    evContact: 378,
    evInitCheckout: 558,
    evCompleteReg: 14,
    conversions: 558,
    cpt: 0.38,
    flag: "anomaly",
  },
  // C4 LATAM_BELLEZA — ACTIVE — €227.83, 41 CompleteReg, CPT €5.56
  {
    ...CAMPAIGN_MAP["52551557046086"],
    status: "ACTIVE",
    spend: 227.83,
    impressions: 81602,
    clicks: 1726,
    ctr: 2.12,
    cpm: 2.79,
    reach: 40329,
    freq: 2.02,
    evContact: 50,
    evInitCheckout: 116,
    evCompleteReg: 41,
    conversions: 41,
    cpt: 5.56,
    flag: flag("52551557046086", 5.56),
  },
  // C5 LATAM_COMERCIO — PAUSED — €186.91, 399 IC, CPT €0.47
  {
    ...CAMPAIGN_MAP["52551557199886"],
    status: "PAUSED",
    spend: 186.91,
    impressions: 31215,
    clicks: 4224,
    ctr: 13.53,
    cpm: 5.99,
    reach: 23423,
    freq: 1.33,
    evContact: 230,
    evInitCheckout: 399,
    evCompleteReg: 4,
    conversions: 399,
    cpt: 0.47,
    flag: null,
  },
  // C6 LATAM_SERVICIOS — PAUSED — €161.53, 487 IC, CPT €0.33
  {
    ...CAMPAIGN_MAP["52551557419286"],
    status: "PAUSED",
    spend: 161.53,
    impressions: 15436,
    clicks: 3078,
    ctr: 19.94,
    cpm: 10.46,
    reach: 11151,
    freq: 1.38,
    evContact: 376,
    evInitCheckout: 487,
    evCompleteReg: 5,
    conversions: 487,
    cpt: 0.33,
    flag: null,
  },
  // C3.NEW MX_SERVICIOS_CR — ACTIVE — recién creada 22-may, números bajos honestos
  {
    ...CAMPAIGN_MAP["52551557600000"],
    status: "ACTIVE",
    spend: 15.20,
    impressions: 2840,
    clicks: 72,
    ctr: 2.54,
    cpm: 5.35,
    reach: 2310,
    freq: 1.23,
    evContact: 3,
    evInitCheckout: 4,
    evCompleteReg: 1,
    conversions: 1,
    cpt: 15.20,
    flag: flag("52551557600000", 15.20),
  },
  // C7 RETARGETING — ACTIVE — recién activada día 14, spend ~€0
  {
    ...CAMPAIGN_MAP["52551557700000"],
    status: "ACTIVE",
    spend: 0.42,
    impressions: 180,
    clicks: 6,
    ctr: 3.33,
    cpm: 2.33,
    reach: 160,
    freq: 1.13,
    evContact: 0,
    evInitCheckout: 0,
    evCompleteReg: 0,
    conversions: 0,
    cpt: null,
    flag: null,
  },
];

export const SEED_ADSETS: Adset[] = [
  // Adsets aproximados desde snapshot anterior — se actualizan en vivo al refrescar
  { cid: "52551556599886", name: "A1.1_MX_LOK_BELLEZA",     spend: 64.20, impressions: 12500, clicks: 245,  ctr: 1.96, cpm: 5.14, reach: 9800,  freq: 1.28, conversions: 26, cpt: 2.47 },
  { cid: "52551556599886", name: "A1.2_MX_CA_ENGAGERS",     spend: 32.40, impressions: 9800,  clicks: 220,  ctr: 2.24, cpm: 3.30, reach: 8500,  freq: 1.15, conversions: 7,  cpt: 4.63 },
  { cid: "52551556599886", name: "A1.3_MX_INT_BELLEZA",     spend: 235.99,impressions: 75732, clicks: 1799, ctr: 2.38, cpm: 3.12, reach: 27611, freq: 2.74, conversions: 17, cpt: 13.88 },
  { cid: "52551556733086", name: "A2.1_MX_LOK_COMERCIO",    spend: 28.50, impressions: 4200,  clicks: 122,  ctr: 2.90, cpm: 6.79, reach: 3640,  freq: 1.15, conversions: 0,  cpt: null },
  { cid: "52551556733086", name: "A2.2_MX_LOK_GURU",        spend: 30.10, impressions: 4730,  clicks: 154,  ctr: 3.26, cpm: 6.36, reach: 4090,  freq: 1.16, conversions: 0,  cpt: null },
  { cid: "52551556733086", name: "A2.3_MX_INT_COMERCIO",    spend: 214.07,impressions: 50823, clicks: 1692, ctr: 3.33, cpm: 4.21, reach: 29217, freq: 1.74, conversions: 24, cpt: 8.92 },
  { cid: "52551556895286", name: "A3.1_MX_LOK_SERVICIOS",   spend: 92.50, impressions: 19500, clicks: 502,  ctr: 2.57, cpm: 4.74, reach: 13800, freq: 1.41, conversions: 58, cpt: 1.59 },
  { cid: "52551556895286", name: "A3.2_MX_INT_SERVICIOS",   spend: 121.87,impressions: 28985, clicks: 9153, ctr: 31.58,cpm: 4.20, reach: 17612, freq: 1.65, conversions: 500,cpt: 0.24, warn: true },
  { cid: "52551557046086", name: "A4.1_LATAM_LOK_BELLEZA",  spend: 122.50,impressions: 50300, clicks: 845,  ctr: 1.68, cpm: 2.44, reach: 26200, freq: 1.92, conversions: 28, cpt: 4.38 },
  { cid: "52551557046086", name: "A4.2_LATAM_INT_BELLEZA",  spend: 105.33,impressions: 31302, clicks: 881,  ctr: 2.81, cpm: 3.36, reach: 14129, freq: 2.22, conversions: 13, cpt: 8.10 },
  { cid: "52551557199886", name: "A5.1_LATAM_LOK_COMERCIO", spend: 78.20, impressions: 12400, clicks: 565,  ctr: 4.56, cpm: 6.31, reach: 8540,  freq: 1.45, conversions: 122,cpt: 0.64 },
  { cid: "52551557199886", name: "A5.2_LATAM_INT_COMERCIO", spend: 108.71,impressions: 18815, clicks: 3659, ctr: 19.45,cpm: 5.78, reach: 14883, freq: 1.26, conversions: 277,cpt: 0.39 },
  { cid: "52551557419286", name: "A6.1_LATAM_LOK_SERVICIOS",spend: 64.20, impressions: 6080,  clicks: 982,  ctr: 16.15,cpm: 10.56,reach: 4380,  freq: 1.39, conversions: 158,cpt: 0.41 },
  { cid: "52551557419286", name: "A6.2_LATAM_INT_SERVICIOS",spend: 97.33, impressions: 9356,  clicks: 2096, ctr: 22.40,cpm: 10.40,reach: 6771,  freq: 1.38, conversions: 329,cpt: 0.30 },
  // C3.NEW adset (recién creada 22-may)
  { cid: "52551557600000", name: "A3N.1_MX_INT_SERVICIOS_CR", spend: 15.20, impressions: 2840, clicks: 72, ctr: 2.54, cpm: 5.35, reach: 2310, freq: 1.23, conversions: 1, cpt: 15.20 },
  // C7 RETARGETING adsets (mixed CR+IC, recién activada)
  { cid: "52551557700000", name: "A7.1_RT_WEB_VISITORS",   spend: 0.30, impressions: 130, clicks: 4, ctr: 3.08, cpm: 2.31, reach: 115, freq: 1.13, conversions: 0, cpt: null },
  { cid: "52551557700000", name: "A7.2_RT_IG_ENGAGERS",    spend: 0.12, impressions: 50,  clicks: 2, ctr: 4.00, cpm: 2.40, reach: 45,  freq: 1.11, conversions: 0, cpt: null },
];

export const SEED_SNAPSHOT_LABEL = "Snapshot · 1–23 mayo 2026";
