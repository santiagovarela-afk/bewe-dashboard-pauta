import type { Campaign } from "./types";
import { PLAN } from "./config";
import { CPT_THRESHOLDS } from "./utils";

export interface DashboardMetrics {
  spend: number;
  budget: number;
  budgetPct: number;
  remaining: number;
  totalConvCR: number;
  totalConvIC: number;
  totalContact: number;
  cptReg: number | null;
  cptIco: number | null;
  ctr: number;
  cpm: number;
  impressions: number;
  clicks: number;
  reach: number;
}

export function computeMetrics(campaigns: Campaign[]): DashboardMetrics {
  const spend = campaigns.reduce((s, c) => s + c.spend, 0);
  const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const reach = campaigns.reduce((s, c) => s + c.reach, 0);
  const totalConvCR = campaigns.reduce((s, c) => s + (c.evCompleteReg || 0), 0);
  // Exclude C3 from IC because of pixel anomaly
  const totalConvIC = campaigns.reduce(
    (s, c) => s + (c.cid !== "52551556895286" ? c.evInitCheckout || 0 : 0),
    0,
  );
  const totalContact = campaigns.reduce((s, c) => s + (c.evContact || 0), 0);

  const cRegC = campaigns.filter((c) => c.event === "CompleteRegistration");
  const cIcoC = campaigns.filter(
    (c) => c.event === "InitiateCheckout" && c.cid !== "52551556895286",
  );
  const spReg = cRegC.reduce((s, c) => s + c.spend, 0);
  const cvReg = cRegC.reduce((s, c) => s + (c.evCompleteReg || 0), 0);
  const cptReg = cvReg > 0 ? spReg / cvReg : null;
  const spIco = cIcoC.reduce((s, c) => s + c.spend, 0);
  const cvIco = cIcoC.reduce((s, c) => s + (c.evInitCheckout || 0), 0);
  const cptIco = cvIco > 0 ? spIco / cvIco : null;

  return {
    spend,
    budget: PLAN.budget,
    budgetPct: PLAN.budget > 0 ? (spend / PLAN.budget) * 100 : 0,
    remaining: PLAN.budget - spend,
    totalConvCR,
    totalConvIC,
    totalContact,
    cptReg,
    cptIco,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    impressions,
    clicks,
    reach,
  };
}

/** Fake trend generator using the current value as the peak — looks alive without real history. */
export function fakeTrend(seed: number, value: number, points = 12, volatility = 0.18): number[] {
  const arr: number[] = [];
  let v = value * 0.55;
  for (let i = 0; i < points; i++) {
    const noise = (((Math.sin(seed * (i + 1) * 1.7) + 1) / 2) - 0.5) * volatility * value;
    v = v + (value - v) * (0.12 + Math.random() * 0.05) + noise;
    arr.push(Math.max(0, v));
  }
  arr[points - 1] = value;
  return arr;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Extensiones · resumen diario, severidad, acciones sugeridas, agregados
 *  Estos exports son ADITIVOS — no rompen computeMetrics ni fakeTrend.
 * ─────────────────────────────────────────────────────────────────────── */

export type Severity = "critical" | "warn" | "anomaly" | "ok";

export function severityOf(c: Campaign): Severity {
  if (c.flag === "critical") return "critical";
  if (c.flag === "warn") return "warn";
  if (c.flag === "anomaly") return "anomaly";
  return "ok";
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 3,
  warn: 2,
  anomaly: 1,
  ok: 0,
};

/** Pacing % vs ritmo esperado del plan (daily × días transcurridos). */
export function pacingPct(c: Campaign, daysElapsed: number): number {
  const expected = c.daily * Math.max(1, daysElapsed);
  return expected > 0 ? (c.spend / expected) * 100 : 0;
}

export type ActionTone = "danger" | "warning" | "info" | "success";
export interface SuggestedAction {
  label: string;
  detail: string;
  tone: ActionTone;
}

/** Acción sugerida para una campaña según su estado actual + reglas Julián. */
export function suggestedAction(c: Campaign): SuggestedAction {
  if (c.cid === "52551556895286") {
    return {
      label: "Verificar pixel en Eventos Manager",
      detail: "IC dispara en page load · excluida de CPT global · no pausar",
      tone: "info",
    };
  }
  if (c.flag === "critical") {
    if (c.code === "C2") {
      return {
        label: "Switch evento → InitiateCheckout (Plan B)",
        detail: `${c.evCompleteReg} CR a día actual · umbral <20 · pausar A2.1/A2.2 (0 conv)`,
        tone: "danger",
      };
    }
    if (c.code === "C1") {
      return {
        label: "Reasignar budget de A1.3_INT_BELLEZA",
        detail: "Adset acumula gasto sin conversiones · mover hacia A1.1_LOK o pausar",
        tone: "danger",
      };
    }
    if (c.code === "C4") {
      return {
        label: "Revisar A4.2_INT y geo-leakage Colombia",
        detail: "Si CO >40% de las conv → activar bid cap €2",
        tone: "danger",
      };
    }
    return {
      label: "Revisar adsets con peor CPT",
      detail: `CPT €${c.cpt?.toFixed(2)} > umbral crítico €${CPT_THRESHOLDS.critical}`,
      tone: "danger",
    };
  }
  if (c.flag === "warn") {
    return {
      label: "Vigilar evolución 48h",
      detail: `CPT €${c.cpt?.toFixed(2)} entre €${CPT_THRESHOLDS.target} y €${CPT_THRESHOLDS.critical}`,
      tone: "warning",
    };
  }
  if (c.status === "PAUSED") {
    return {
      label: "En pausa — mantener observación",
      detail: "Reactivar si rendimiento global cae por debajo del plan",
      tone: "info",
    };
  }
  return {
    label: "Sin acción requerida",
    detail: "CPT en objetivo · seguir aprendizaje",
    tone: "success",
  };
}

/** Agregado por dimensión (vertical/geo). */
export interface GroupAggregate {
  key: string;
  spend: number;
  conversions: number;
  cpt: number | null;
  campaigns: number;
  critical: number;
}

function groupBy(campaigns: Campaign[], get: (c: Campaign) => string): GroupAggregate[] {
  const map = new Map<string, GroupAggregate>();
  for (const c of campaigns) {
    const k = get(c);
    if (!map.has(k)) {
      map.set(k, { key: k, spend: 0, conversions: 0, cpt: null, campaigns: 0, critical: 0 });
    }
    const g = map.get(k)!;
    g.spend += c.spend;
    g.conversions += c.conversions;
    g.campaigns += 1;
    if (c.flag === "critical") g.critical += 1;
  }
  for (const g of map.values()) {
    g.cpt = g.conversions > 0 ? +(g.spend / g.conversions).toFixed(2) : null;
  }
  return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
}

export function byVertical(campaigns: Campaign[]): GroupAggregate[] {
  return groupBy(campaigns, (c) => c.vertical);
}

export function byGeo(campaigns: Campaign[]): GroupAggregate[] {
  return groupBy(campaigns, (c) => c.geo);
}

/** Mejor CPT (entre las que tengan CPT válido y no anómalas). */
export function bestCptCampaign(campaigns: Campaign[]): Campaign | null {
  const pool = campaigns.filter(
    (c) => c.cpt !== null && c.flag !== "anomaly" && c.conversions > 0,
  );
  if (pool.length === 0) return null;
  return pool.reduce((best, c) => (c.cpt! < best.cpt! ? c : best));
}

export function criticalCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((c) => c.flag === "critical");
}

export function attentionCampaigns(campaigns: Campaign[]): Campaign[] {
  // critical first, then warn, then anomaly
  return campaigns
    .filter((c) => c.flag !== null)
    .sort((a, b) => SEVERITY_WEIGHT[severityOf(b)] - SEVERITY_WEIGHT[severityOf(a)]);
}

/** Plan B status del C2 (si CR < 20 después de día 7 → debió activarse). */
export function planBStatus(campaigns: Campaign[], daysElapsed: number): {
  status: "activated" | "pending" | "watch" | "n/a";
  detail: string;
} {
  const c2 = campaigns.find((c) => c.code === "C2");
  if (!c2) return { status: "n/a", detail: "C2 no encontrada" };
  if (daysElapsed < 7) {
    return { status: "watch", detail: `${c2.evCompleteReg} CR · evaluar día 7` };
  }
  if (c2.evCompleteReg < 20) {
    return {
      status: "pending",
      detail: `${c2.evCompleteReg} CR < 20 · switch evento pendiente`,
    };
  }
  return { status: "activated", detail: `${c2.evCompleteReg} CR · objetivo superado` };
}

/** Mini comparativo: cuánto más alto/bajo está el CPT vs el promedio del grupo. */
export function cptVsGroupAvg(c: Campaign, group: Campaign[]): {
  diffPct: number;
  groupAvg: number | null;
} {
  const pool = group.filter(
    (g) => g.cpt !== null && g.flag !== "anomaly" && g.event === c.event && g.cid !== c.cid,
  );
  if (pool.length === 0 || c.cpt === null) return { diffPct: 0, groupAvg: null };
  const avg = pool.reduce((s, g) => s + (g.cpt ?? 0), 0) / pool.length;
  if (avg === 0) return { diffPct: 0, groupAvg: avg };
  return { diffPct: ((c.cpt - avg) / avg) * 100, groupAvg: avg };
}
