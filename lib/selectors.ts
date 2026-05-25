import type { Campaign, DailyRow, DateRange } from "./types";
import { PLAN } from "./config";
import { CPT_THRESHOLDS } from "./utils";
import { isActive } from "./campaign-metadata";

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

/** Fake trend generator using the current value as the peak — looks alive without real history.
 *  DEPRECATED · solo se mantiene en uso para tab-seo (que ya está marcada como demo).
 *  Para datos reales usar `realDailySeries`.
 */
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
 *  Series reales por día · sparkline a partir de DailyRow[]
 *  Filtra campaign-level rows (sin adsetId) y respeta el dateRange activo.
 *  Si no hay datos en el rango → devuelve [] (el sparkline NO se renderiza).
 * ─────────────────────────────────────────────────────────────────────── */

export type DailyMetricKey = "spend" | "cpl" | "cpic" | "ctr" | "cpm" | "convCR" | "convIC";

interface DailyAccum {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  convCR: number;
  convIC: number;
}

/** C3 (cid `52551556895286`) tiene pixel roto · excluida de IC. */
const ANOMALY_CID = "52551556895286";

/**
 * Devuelve la serie real por día para una métrica dada, dentro del rango activo.
 * `campaignFilter` permite restringir a un subset (ej. solo CR o solo IC).
 *
 * Si `daily.length === 0` o no hay puntos en el rango → devuelve [].
 * El consumidor debe verificar `series.length > 1` antes de pintar el sparkline.
 */
export function realDailySeries(
  daily: DailyRow[],
  range: DateRange,
  key: DailyMetricKey,
  campaignFilter?: string[],
): number[] {
  if (!daily.length) return [];

  const filterSet = campaignFilter ? new Set(campaignFilter) : null;
  const byDate = new Map<string, DailyAccum>();

  for (const row of daily) {
    // Sólo rows campaign-level · evita la duplicación adset + campaign.
    if (row.adsetId) continue;
    if (row.date < range.from || row.date > range.to) continue;
    if (filterSet && !filterSet.has(row.campaignId)) continue;

    const acc = byDate.get(row.date) ?? {
      date: row.date,
      spend: 0,
      impressions: 0,
      clicks: 0,
      convCR: 0,
      convIC: 0,
    };
    acc.spend += row.spend;
    acc.impressions += row.impressions;
    acc.clicks += row.clicks;
    acc.convCR += row.evCompleteReg;
    // Igual que en computeMetrics: C3 fuera del IC global por anomalía pixel.
    if (row.campaignId !== ANOMALY_CID) {
      acc.convIC += row.evInitCheckout;
    }
    byDate.set(row.date, acc);
  }

  const sorted = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];

  return sorted.map((d) => {
    switch (key) {
      case "spend":
        return d.spend;
      case "convCR":
        return d.convCR;
      case "convIC":
        return d.convIC;
      case "ctr":
        return d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
      case "cpm":
        return d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0;
      case "cpl":
        return d.convCR > 0 ? d.spend / d.convCR : 0;
      case "cpic":
        return d.convIC > 0 ? d.spend / d.convIC : 0;
      default:
        return 0;
    }
  });
}

/** Devuelve los cids de campañas CR (CompleteRegistration) — útil para realDailySeries('cpl'). */
export function crCampaignIds(campaigns: Campaign[]): string[] {
  return campaigns.filter((c) => c.event === "CompleteRegistration").map((c) => c.cid);
}

/** Devuelve los cids de campañas IC trustables (InitiateCheckout sin C3). */
export function icCampaignIds(campaigns: Campaign[]): string[] {
  return campaigns
    .filter((c) => c.event === "InitiateCheckout" && c.cid !== ANOMALY_CID)
    .map((c) => c.cid);
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

/* ─────────────────────────────────────────────────────────────────────────
 *  Funnel por tipo de evento · separar CR (Adquisición) e IC (Pago)
 *  Permite mostrar CPL y CPIC sin mezclar campañas de objetivos distintos.
 * ─────────────────────────────────────────────────────────────────────── */

export interface FunnelEventMetrics {
  campaigns: Campaign[];
  impressions: number;
  clicks: number;
  events: number;
  ctr: number;
  costPerEvent: number | null;
  conversionPct: number;
  spend: number;
  activeCount: number;
  pausedCount: number;
}

/** Funnel CR · solo campañas cuyo objetivo es CompleteRegistration (C1, C2, C4). */
export function funnelCR(campaigns: Campaign[]): FunnelEventMetrics {
  const pool = campaigns.filter((c) => c.event === "CompleteRegistration");
  const impressions = pool.reduce((s, c) => s + c.impressions, 0);
  const clicks = pool.reduce((s, c) => s + c.clicks, 0);
  const events = pool.reduce((s, c) => s + (c.evCompleteReg || 0), 0);
  const spend = pool.reduce((s, c) => s + c.spend, 0);
  return {
    campaigns: pool,
    impressions,
    clicks,
    events,
    spend,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    costPerEvent: events > 0 ? spend / events : null,
    conversionPct: clicks > 0 ? (events / clicks) * 100 : 0,
    activeCount: pool.filter((c) => c.status === "ACTIVE").length,
    pausedCount: pool.filter((c) => c.status === "PAUSED").length,
  };
}

/** Funnel IC · solo campañas cuyo objetivo es InitiateCheckout (C3, C5, C6).
 *  Excluye C3 (cid 52551556895286) del cómputo de eventos por anomalía pixel,
 *  pero la deja visible para conteo de pausadas/activas.
 */
export function funnelIC(campaigns: Campaign[]): FunnelEventMetrics {
  const pool = campaigns.filter((c) => c.event === "InitiateCheckout");
  const trustable = pool.filter((c) => c.cid !== "52551556895286");
  const impressions = trustable.reduce((s, c) => s + c.impressions, 0);
  const clicks = trustable.reduce((s, c) => s + c.clicks, 0);
  const events = trustable.reduce((s, c) => s + (c.evInitCheckout || 0), 0);
  const spend = trustable.reduce((s, c) => s + c.spend, 0);
  return {
    campaigns: pool,
    impressions,
    clicks,
    events,
    spend,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    costPerEvent: events > 0 ? spend / events : null,
    conversionPct: clicks > 0 ? (events / clicks) * 100 : 0,
    activeCount: pool.filter((c) => c.status === "ACTIVE").length,
    pausedCount: pool.filter((c) => c.status === "PAUSED").length,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Helpers de rango · etiquetas humanas + flags de pre-lanzamiento/pre-pixel
 * ─────────────────────────────────────────────────────────────────────── */

/** Lanzamiento real MAY26 (6 campañas nuevas). */
export const SEED_LAUNCH_ISO = "2026-05-12";
/** Fecha desde la cual el tracking pasó a CAPI puro (sin duplicados pixel). */
export const PIXEL_FIX_ISO = "2026-05-16";

export interface RangeContext {
  label: string;
  scope: "today" | "single" | "week" | "month" | "custom";
  days: number;
  includesPreLaunch: boolean;
  includesPrePixelFix: boolean;
}

export function describeRange(from: string, to: string): RangeContext {
  const sameDay = from === to;
  const today = new Date().toISOString().slice(0, 10);
  const fromTime = new Date(from + "T00:00:00").getTime();
  const toTime = new Date(to + "T00:00:00").getTime();
  const days = Math.max(1, Math.round((toTime - fromTime) / 86_400_000) + 1);

  let scope: RangeContext["scope"] = "custom";
  let label = `${from} → ${to}`;
  if (sameDay) {
    if (from === today) {
      scope = "today";
      label = "Hoy";
    } else {
      scope = "single";
      const d = new Date(from + "T00:00:00");
      label = d.toLocaleDateString("es", { day: "numeric", month: "short" });
    }
  } else if (days <= 7) {
    scope = "week";
    label = `Últimos ${days} días`;
  } else if (days <= 14) {
    scope = "week";
    label = `Últimos ${days} días`;
  } else {
    scope = "month";
    label = "Este mes";
  }

  return {
    label,
    scope,
    days,
    includesPreLaunch: from < SEED_LAUNCH_ISO,
    includesPrePixelFix: from < PIXEL_FIX_ISO,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Señales operativas dinámicas · alertas que dependen del rango y datos
 * ─────────────────────────────────────────────────────────────────────── */

export type AlertKind = "critical" | "warn" | "info";
export interface DynamicAlert {
  kind: AlertKind;
  title: string;
  desc: string;
}

/** Genera señales operativas calculadas sobre las campañas del rango activo. */
export function dynamicAlerts(
  campaigns: Campaign[],
  ctx: RangeContext,
  daysElapsed: number,
): DynamicAlert[] {
  const alerts: DynamicAlert[] = [];
  const active = campaigns.filter((c) => c.status === "ACTIVE");

  // Top performer (mejor CPT entre las activas con conversiones reales)
  const valid = active.filter(
    (c) => c.cpt !== null && c.conversions > 0 && c.flag !== "anomaly",
  );
  if (valid.length > 0) {
    const best = valid.reduce((b, c) => (c.cpt! < b.cpt! ? c : b));
    alerts.push({
      kind: "info",
      title: `Top performer · ${best.code} ${best.vertical}`,
      desc: `CPT €${best.cpt?.toFixed(2)} · ${best.conversions} conv en ${ctx.label.toLowerCase()}`,
    });
  }

  // Peor CPL (campañas CR con CPT > critical)
  const worstCR = active
    .filter((c) => c.event === "CompleteRegistration" && c.cpt !== null)
    .sort((a, b) => (b.cpt ?? 0) - (a.cpt ?? 0))[0];
  if (worstCR && (worstCR.cpt ?? 0) > CPT_THRESHOLDS.critical) {
    alerts.push({
      kind: "critical",
      title: `Peor CPL · ${worstCR.code} ${worstCR.vertical} €${worstCR.cpt?.toFixed(2)}`,
      desc: `${worstCR.evCompleteReg} CR con €${worstCR.spend.toFixed(0)} gastados · revisar adsets`,
    });
  }

  // Frecuencia alta detectada (>1.9)
  const fatigue = active.filter((c) => c.freq > 1.9);
  if (fatigue.length > 0) {
    alerts.push({
      kind: "warn",
      title: `Frecuencia alta · ${fatigue.map((c) => c.code).join(", ")}`,
      desc: `${fatigue[0].freq.toFixed(2)} promedio · refrescar creativos para evitar saturación`,
    });
  }

  // Pacing del período (esperado vs gastado)
  const totalSpend = active.reduce((s, c) => s + c.spend, 0);
  const totalDaily = active.reduce((s, c) => s + c.daily, 0);
  const expected = totalDaily * Math.max(1, ctx.scope === "today" ? 1 : ctx.days);
  if (expected > 0) {
    const pacing = (totalSpend / expected) * 100;
    const scopeLabel =
      ctx.scope === "today"
        ? "hoy"
        : ctx.scope === "single"
          ? "ese día"
          : ctx.scope === "week"
            ? "esta semana"
            : "este mes";
    alerts.push({
      kind: pacing > 115 ? "warn" : pacing < 70 ? "warn" : "info",
      title: `Pacing ${scopeLabel} · ${Math.round(pacing)}% del expected`,
      desc: `€${totalSpend.toFixed(0)} gastados de €${expected.toFixed(0)} previstos · día ${daysElapsed}/20`,
    });
  }

  // Anomalía pixel pre-16-may
  if (ctx.includesPrePixelFix) {
    alerts.push({
      kind: "info",
      title: "Datos pre-16-may con tracking duplicado",
      desc: "Pixel + CAPI estuvieron activos juntos · números inflados hasta 16-may",
    });
  }

  // C3 anomaly siempre que aparezca en el rango con eventos
  const c3 = campaigns.find((c) => c.cid === "52551556895286");
  if (c3 && (c3.evInitCheckout || 0) > 0) {
    alerts.push({
      kind: "warn",
      title: "C3 MX_SERVICIOS · IC excluido del cómputo",
      desc: "Pixel dispara en page load · pausada desde 22-may · no afecta CPIC global",
    });
  }

  return alerts;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Proyección al 31-may · Realidad vs Objetivo Julián
 *  Aditivos · no rompen exports existentes.
 * ─────────────────────────────────────────────────────────────────────── */

/** Objetivo formal Julián para mes 1 (lo que se firmó en el plan). */
export const TARGET_GOAL = {
  /** Trials/registros totales objetivo. */
  registrations: 1350,
  /** CPA objetivo (€/registro). */
  cpa: 2.2,
} as const;

/** Histórico de cohortes anteriores · NO medido en runtime · fuente: handoff abril 2026. */
export const HISTORIC_CR_TO_TRIAL_RATE = 0.247;

export interface ProjectionResult {
  /** Días transcurridos del plan (1..20). */
  daysElapsed: number;
  /** Días restantes hasta el 31-may. */
  daysRemaining: number;
  /** Total del plan (PLAN.totalDays · 20). */
  totalDays: number;
  /** Ritmo de gasto actual (€/día). */
  dailyAvg: number;
  /** Spend proyectado al cierre. */
  projectedSpend: number;
  /** CR proyectados manteniendo la tasa actual. */
  projectedCR: number;
  /** IC proyectados (excluye C3 anómala). */
  projectedIC: number;
  /** CPL/CPT final proyectado al cierre (spend total / CR total). */
  projectedCPL: number | null;
  /** Trials esperados aplicando la tasa CR→trial 24.7% vista en pauta. */
  expectedTrials: number;
  /** Gap multiplier vs el objetivo CPA Julián (cuántas veces sobre target). */
  gapMultiplier: number | null;
  /** Brecha en registros: cuántos CR faltan vs objetivo Julián. */
  registrationsGap: number;
  /** % cumplimiento del objetivo (CR proyectados / 1.350). */
  goalAchievementPct: number;
}

/**
 * Proyecta el cierre del mes manteniendo la tasa actual de spend y conversión.
 * Conservative: usa los datos puros MAY26 sin asumir winners escalados que
 * todavía no se reflejan en el agregado.
 */
export function projectMonthEnd(campaigns: Campaign[], daysElapsed: number): ProjectionResult {
  const m = computeMetrics(campaigns);
  const safeDays = Math.max(1, daysElapsed);
  const dailyAvg = m.spend / safeDays;
  const daysRemaining = Math.max(0, PLAN.totalDays - daysElapsed);
  const projectedSpend = dailyAvg * PLAN.totalDays;
  const projectedCR = Math.round((m.totalConvCR / safeDays) * PLAN.totalDays);
  const projectedIC = Math.round((m.totalConvIC / safeDays) * PLAN.totalDays);
  const projectedCPL = projectedCR > 0 ? projectedSpend / projectedCR : null;
  // Tasa observada CR→trial pauta (~24.7% según ai-memory aprendizaje #2 · handoff abril 2026).
  // Supuesto histórico · si se conecta PostHog y mide trials reales, preferir esos.
  const expectedTrials = Math.round(projectedCR * HISTORIC_CR_TO_TRIAL_RATE);
  const gapMultiplier = projectedCPL !== null ? projectedCPL / TARGET_GOAL.cpa : null;
  const registrationsGap = TARGET_GOAL.registrations - projectedCR;
  const goalAchievementPct = (projectedCR / TARGET_GOAL.registrations) * 100;
  return {
    daysElapsed,
    daysRemaining,
    totalDays: PLAN.totalDays,
    dailyAvg,
    projectedSpend,
    projectedCR,
    projectedIC,
    projectedCPL,
    expectedTrials,
    gapMultiplier,
    registrationsGap,
    goalAchievementPct,
  };
}

/** Tipo de aprendizaje asociado a una campaña (mostrar en card grande). */
export interface CampaignLearning {
  /** Hipótesis original que justificó el lanzamiento. */
  hypothesis: string;
  /** Estado actual narrado (tendencia · evento clave). */
  currentState: string;
  /** Lista de aprendizajes operativos (winners, pausas, escalados). */
  learnings: string[];
  /** Próximo paso recomendado. */
  nextStep: string;
}

/**
 * Devuelve la narrativa de aprendizaje por código de campaña (C1..C6).
 * Fuente: handoff 23-may + ai-memory + seed-data (PAUSED_ADS_23MAY · SCALED_WINNERS_23MAY).
 */
export function getCampaignLearning(code: string): CampaignLearning {
  switch (code) {
    case "C1":
      return {
        hypothesis:
          "MX_BELLEZA optimizada a CompleteRegistration con CBO. Vertical core de Bewe · audiencia probada. Apuesta principal del mes.",
        currentState:
          "Ganadora del mes. Escalada de €26 a €40/día el 23-may (CBO a nivel campaña).",
        learnings: [
          "Winner creativo: paraguas_imagen_v2_asp · 10 CR · CPR €4.02",
          "A1.2 CA_ENGAGERS freq 1.64× · cerca de fatigue (techo 2.0)",
          "Adset A1.3 INT pausado: CPR €38.20 (7× sobre target)",
          "A1.1 LOK €18 spend · 9 CR · CPR €2.04 (mejor adset)",
        ],
        nextStep:
          "Producir creativo nuevo concepto paraguas antes del 26-may · vigilar freq A1.2 y subir a €60/día si winner aguanta.",
      };
    case "C2":
      return {
        hypothesis:
          "MX_COMERCIO_WEB · CompleteRegistration. Hipótesis: vertical comercio funciona igual que belleza en MX si bajamos CPR con LOK puro.",
        currentState:
          "CPT crítico €11.50 · 5× sobre target. Plan B descartado: la regla decía switch a IC pero IC NO funciona (validado por C5/C6).",
        learnings: [
          "Plan B Julián evaluado · NO ejecutado (IC no convierte)",
          "Solo queda A2.1 LOK activo · 18 CR · CPR €9.18",
          "4 ads pausados el 23-may (linda_v1_asp CPR €18.31 4× target · +3 losses)",
          "A2.2/A2.3 INT pausados por 0 CR · gasto €17.86 perdido",
        ],
        nextStep:
          "Creativo nuevo concepto paraguas/mkt en vertical comercio · si no baja CPR a €6 antes del 28-may → pausar y reasignar a C1.",
      };
    case "C3":
      return {
        hypothesis:
          "MX_SERVICIOS_WEB optimizando InitiateCheckout. Hipótesis: capturar volumen upstream del CR para baratos.",
        currentState:
          "PAUSADA el 22-may. Anomalía pixel histórica (CTR 20.54% · 521 IC vs 13 CR vs 3 signups vs 1 trial).",
        learnings: [
          "Pixel disparaba IC en page load · no en click del CTA (corregido CAPI 16-may)",
          "Tasa IC→signup <1% · invalida la hipótesis IC-cheaper",
          "CPL real €38.81 si se contabilizan trials (peor del paid mix)",
          "Reemplazo C9 LATAM_SERVICIOS_CR · planeada NO creada todavía",
        ],
        nextStep:
          "Crear C9 LATAM_SERVICIOS_CR con CompleteRegistration · presupuesto €15/día · arrancar 26-may si Julián firma.",
      };
    case "C4":
      return {
        hypothesis:
          "LATAM_BELLEZA (CR/PA/CL/CO) optimizando CompleteRegistration con ABO. Hipótesis: LATAM convierte trial real más barato que MX por CPM bajo.",
        currentState:
          "Mejor CPA trial real €14.41 del mix. A4.1 escalado €10 → €25/día el 23-may (ABO).",
        learnings: [
          "Winner creativo: mkt_imagen_v1_dol · 7 CR · CPR €5.31",
          "A4.1 LOK BELLEZA: €178 spend · 33 CR · CPR €5.41 (mejor adset LATAM)",
          "A4.2 INT pausado · CPR €7.90 vs LOK €5.41",
          "Watchpoint Colombia pendiente: revisar % gasto CO antes del 26-may",
        ],
        nextStep:
          "Escalar A4.1 a €40/día si CPR <€6 al cierre · activar bid cap €2 si CO >40% del gasto.",
      };
    case "C5":
      return {
        hypothesis:
          "LATAM_COMERCIO optimizando IC. Hipótesis: igual que C3 · capturar volumen upstream barato.",
        currentState:
          "PAUSADA el 22-may. 240 IC vs 3 signups vs 1 trial. CPL real €33.56.",
        learnings: [
          "Confirma aprendizaje: IC no funciona en Bewe · convierte 8× peor que CR",
          "€172 gastados con 1 trial real · LTV potencial no recuperable",
          "CTR 13.61% · misma anomalía que C3 (clics sin intención)",
        ],
        nextStep:
          "Mantener pausada · no reactivar en mayo. Junio: solo CompleteRegistration en LATAM comercio.",
      };
    case "C6":
      return {
        hypothesis:
          "LATAM_SERVICIOS optimizando IC. Hipótesis: vertical servicios LATAM viable si IC convierte.",
        currentState:
          "PAUSADA el 22-may. 265 IC vs 1 signup vs 0 trials. CPL real €90.61 (el peor del mix).",
        learnings: [
          "0 trials en 11 días · invalida la vertical Servicios LATAM en IC",
          "CTR 20.14% · CPM €10.28 (más caro del mix LATAM)",
          "€146 gastados sin ningún output medible",
        ],
        nextStep:
          "Mantener pausada · evaluar C9 LATAM_SERVICIOS_CR como reemplazo en junio.",
      };
    default:
      return {
        hypothesis: "Sin hipótesis registrada en el handoff.",
        currentState: "Estado por confirmar.",
        learnings: [],
        nextStep: "Pendiente de definición.",
      };
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Wrapper de aprendizaje · detección de cifras hardcoded desactualizadas
 *  El texto base lo escribió el equipo el 23-may con cifras del momento.
 *  Si los datos vivos cambiaron > ±15% en spend → marcar el bloque como
 *  "notas del equipo capturadas · pueden estar desactualizadas".
 * ─────────────────────────────────────────────────────────────────────── */

/** Cifra ancla por campaña tomada del handoff 23-may (spend acumulado a esa fecha). */
const HANDOFF_SPEND_23MAY: Record<string, number> = {
  C1: 110,
  C2: 165,
  C3: 380,
  C4: 178,
  C5: 172,
  C6: 146,
};

/** Tolerancia de desviación antes de considerar las notas como "potencialmente desactualizadas". */
const HANDOFF_TOLERANCE = 0.15;

export interface CampaignLearningResolved {
  /** Narrativa hardcoded del handoff. */
  learning: CampaignLearning;
  /** True si los números actuales coinciden con los del 23-may dentro del ±15%. */
  fresh: boolean;
  /** Mensaje de fallback si los datos no coinciden. */
  staleNote: string | null;
  /** Cifras vivas resumidas (para mostrar al lado del texto). */
  live: {
    spend: number;
    conversions: number;
    cpt: number | null;
  };
}

/**
 * Wrapper sobre `getCampaignLearning(code)` que compara las cifras citadas
 * en el texto del handoff con los datos vivos. Si difieren > tolerancia,
 * marca `fresh = false` y aporta un mensaje de fallback honesto.
 */
export function resolveCampaignLearning(c: Campaign): CampaignLearningResolved {
  const learning = getCampaignLearning(c.code);
  const anchor = HANDOFF_SPEND_23MAY[c.code];
  const live = {
    spend: c.spend,
    conversions: c.conversions,
    cpt: c.cpt,
  };
  if (typeof anchor !== "number" || anchor <= 0) {
    return { learning, fresh: true, staleNote: null, live };
  }
  const diff = Math.abs(c.spend - anchor) / anchor;
  const fresh = diff <= HANDOFF_TOLERANCE;
  const staleNote = fresh
    ? null
    : `Notas del equipo capturadas el 23-may · pueden estar desactualizadas. Estado actual: spend €${c.spend.toFixed(
        0,
      )}, conv ${c.conversions}, CPT ${c.cpt === null ? "—" : `€${c.cpt.toFixed(2)}`} (data viva).`;
  return { learning, fresh, staleNote, live };
}

/** Palancas explícitas del informe de cierre · alineadas con ai-memory aprendizajes 1-5. */
export interface ClosingLever {
  title: string;
  detail: string;
  tone: "danger" | "warning" | "info" | "success";
}

export function closingLevers(): ClosingLever[] {
  return [
    {
      title: "Solo CompleteRegistration",
      detail:
        "IC convierte 8× peor en CPA trial. C3/C5/C6 ya pausadas. Junio: arrancar todo en CR · cero IC.",
      tone: "danger",
    },
    {
      title: "Email Loops desde día 0",
      detail:
        "Pauta CR convierte lead→trial 24.7% · orgánico 45%. Si pauta entra al loop al ritmo orgánico → +20 trials/sem sin gasto extra.",
      tone: "info",
    },
    {
      title: "Creativos nuevos anti-fatigue",
      detail:
        "A1.2 freq 1.64 · A4.1 freq 1.66 cerca del techo 2.0. Producir concepto paraguas/mkt antes del 26-may o el escalado pierde rendimiento.",
      tone: "warning",
    },
    {
      title: "Reactivar C7 Retargeting",
      detail:
        "Bloqueada por Custom Audiences (Visitantes 30d · IC abandons · IG/FB eng). Si se desbloquea día 14 + €1.000 contingencia → +50 CR estimados.",
      tone: "success",
    },
  ];
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Proyección multi-escenario (Pesimista · Base · Optimista)
 *  Aditivos · usa SOLO campañas activas + ritmo últimos 7d.
 * ─────────────────────────────────────────────────────────────────────── */

export type ScenarioKind = "pessimistic" | "base" | "optimistic";

export interface ScenarioProjection {
  kind: ScenarioKind;
  /** Etiqueta humana. */
  label: string;
  /** Multiplicador aplicado al daily promedio (0.8 / 1.0 / 1.3). */
  multiplier: number;
  /** Daily promedio esperado (€/día) en este escenario. */
  expectedDaily: number;
  /** Spend total proyectado al 31-may. */
  projectedSpend: number;
  /** CR proyectados al cierre. */
  projectedCR: number;
  /** CPL final esperado (spend / CR), null si CR == 0. */
  projectedCPL: number | null;
  /** % vs objetivo Julián (1.350 CR). */
  goalAchievementPct: number;
  /** CR esperados solo en los próximos N días. */
  nextDaysCR: number;
  /** Spend esperado en los próximos N días. */
  nextDaysSpend: number;
}

export interface ActiveProjectionResult {
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  /** Spend acumulado hoy (sólo campañas activas). */
  spendToDate: number;
  /** CR acumulados hoy (sólo campañas activas). */
  crToDate: number;
  /** Ritmo daily de los últimos 7 días sólo de las activas. */
  recentDailyAvg: number;
  /** CPL live (spend hoy / CR hoy de las activas). */
  liveCPL: number | null;
  /** Cuántos días reales de daily se usaron (1..7) · 0 = fallback config. */
  windowDaysUsed: number;
  /** Cantidad de campañas activas consideradas. */
  activeCount: number;
  /** True si no había daily breakdown y usamos `daily` config como fallback. */
  usedFallback: boolean;
  /** Tres escenarios proyectados al cierre. */
  scenarios: Record<ScenarioKind, ScenarioProjection>;
  /** Ventana corta · cuántos CR esperar en los próximos `shortHorizonDays`. */
  shortHorizonDays: number;
}

const SCENARIO_MULTIPLIERS: Record<ScenarioKind, number> = {
  pessimistic: 0.8,
  base: 1.0,
  optimistic: 1.3,
};

const SCENARIO_LABELS: Record<ScenarioKind, string> = {
  pessimistic: "Pesimista",
  base: "Base",
  optimistic: "Optimista",
};

function recentDailyForCids(
  daily: DailyRow[],
  cids: Set<string>,
  windowDays = 7,
): { dailyAvg: number; windowDaysUsed: number; dailyCR: number } {
  if (daily.length === 0 || cids.size === 0) {
    return { dailyAvg: 0, windowDaysUsed: 0, dailyCR: 0 };
  }
  const byDate = new Map<string, { spend: number; crConv: number }>();
  for (const row of daily) {
    if (row.adsetId) continue;
    if (!cids.has(row.campaignId)) continue;
    const acc = byDate.get(row.date) ?? { spend: 0, crConv: 0 };
    acc.spend += row.spend;
    acc.crConv += row.evCompleteReg;
    byDate.set(row.date, acc);
  }
  const sortedDesc = Array.from(byDate.entries()).sort((a, b) =>
    a[0] > b[0] ? -1 : 1,
  );
  const slice = sortedDesc.slice(0, windowDays);
  if (slice.length === 0) return { dailyAvg: 0, windowDaysUsed: 0, dailyCR: 0 };
  const sumSpend = slice.reduce((s, [, v]) => s + v.spend, 0);
  const sumCR = slice.reduce((s, [, v]) => s + v.crConv, 0);
  return {
    dailyAvg: sumSpend / slice.length,
    dailyCR: sumCR / slice.length,
    windowDaysUsed: slice.length,
  };
}

/**
 * Proyecta 3 escenarios al cierre del plan usando ÚNICAMENTE las campañas
 * activas + ritmo daily de los últimos 7d. Si no hay daily breakdown, cae
 * al `daily` config de cada activa + tasa CR/€ live (o 1/€2.20 si no hay
 * live data).
 *
 * Para responder "¿cuántos CR esperar en próximos N días?" usar
 * `result.scenarios.base.nextDaysCR`.
 */
export function projectMonthEndScenarios(
  campaigns: Campaign[],
  daily: DailyRow[],
  daysElapsed: number,
  opts: { shortHorizonDays?: number; windowDays?: number } = {},
): ActiveProjectionResult {
  const shortHorizonDays = opts.shortHorizonDays ?? 5;
  const windowDays = opts.windowDays ?? 7;
  const activeOnly = campaigns.filter((c) => isActive(c.cid));
  const activeCids = new Set(activeOnly.map((c) => c.cid));
  const daysRemaining = Math.max(0, PLAN.totalDays - daysElapsed);

  const spendToDate = activeOnly.reduce((s, c) => s + c.spend, 0);
  const crToDate = activeOnly.reduce((s, c) => s + (c.evCompleteReg || 0), 0);
  const liveCPL = crToDate > 0 ? spendToDate / crToDate : null;

  const { dailyAvg: recentDailyAvg, windowDaysUsed, dailyCR: recentDailyCR } =
    recentDailyForCids(daily, activeCids, windowDays);

  let usedDailyAvg = recentDailyAvg;
  let usedDailyCR = recentDailyCR;
  let usedFallback = false;
  if (windowDaysUsed === 0) {
    usedFallback = true;
    const configDaily = activeOnly.reduce((s, c) => s + (c.daily || 0), 0);
    usedDailyAvg = configDaily;
    const crPerEur =
      spendToDate > 0 && crToDate > 0 ? crToDate / spendToDate : 1 / 2.2;
    usedDailyCR = configDaily * crPerEur;
  }

  const buildScenario = (kind: ScenarioKind): ScenarioProjection => {
    const multiplier = SCENARIO_MULTIPLIERS[kind];
    const expectedDaily = usedDailyAvg * multiplier;
    const expectedDailyCR = usedDailyCR * multiplier;
    const futureSpend = expectedDaily * daysRemaining;
    const projectedSpend = spendToDate + futureSpend;
    const futureCR = expectedDailyCR * daysRemaining;
    const projectedCR = Math.round(crToDate + futureCR);
    const projectedCPL = projectedCR > 0 ? projectedSpend / projectedCR : null;
    const horizon = Math.min(shortHorizonDays, daysRemaining);
    const nextDaysSpend = expectedDaily * horizon;
    const nextDaysCR = Math.round(expectedDailyCR * horizon);
    return {
      kind,
      label: SCENARIO_LABELS[kind],
      multiplier,
      expectedDaily,
      projectedSpend,
      projectedCR,
      projectedCPL,
      goalAchievementPct: (projectedCR / TARGET_GOAL.registrations) * 100,
      nextDaysCR,
      nextDaysSpend,
    };
  };

  return {
    daysElapsed,
    daysRemaining,
    totalDays: PLAN.totalDays,
    spendToDate,
    crToDate,
    recentDailyAvg: usedDailyAvg,
    liveCPL,
    windowDaysUsed,
    activeCount: activeOnly.length,
    usedFallback,
    scenarios: {
      pessimistic: buildScenario("pessimistic"),
      base: buildScenario("base"),
      optimistic: buildScenario("optimistic"),
    },
    shortHorizonDays,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Pacing real vs esperado · gasto acumulado vs ritmo ideal por días corridos
 * ─────────────────────────────────────────────────────────────────────── */

export interface PacingState {
  /** Gasto acumulado total (TODAS las campañas · activas + pausadas que gastaron). */
  spendTotal: number;
  /** Budget plan (€3.000). */
  budget: number;
  /** Días corridos desde launchISO hasta hoy (clamped 1..totalDays). */
  daysElapsed: number;
  /** Días totales del plan (20). */
  totalDays: number;
  /** % real = spend / budget × 100. */
  realPct: number;
  /** % esperado = daysElapsed / totalDays × 100. */
  expectedPct: number;
  /** Diferencia (real − expected). Positivo = sobre-pacing. */
  deltaPct: number;
  /** Estado · "on-track" si |delta| ≤ 5pp. */
  status: "on-track" | "over" | "under";
  /** Ritmo medio diario hasta hoy. */
  dailyAvg: number;
  /** Ritmo requerido para gastar exactamente budget en los días restantes. */
  requiredDailyToFinish: number;
}

/** Calcula pacing real vs esperado del plan completo. */
export function computePacing(
  campaigns: Campaign[],
  daysElapsed: number,
): PacingState {
  const spendTotal = campaigns.reduce((s, c) => s + c.spend, 0);
  const budget = PLAN.budget;
  const totalDays = PLAN.totalDays;
  const safeDays = Math.max(1, daysElapsed);
  const realPct = budget > 0 ? (spendTotal / budget) * 100 : 0;
  const expectedPct = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
  const deltaPct = realPct - expectedPct;
  const status: PacingState["status"] =
    Math.abs(deltaPct) <= 5 ? "on-track" : deltaPct > 0 ? "over" : "under";
  const dailyAvg = spendTotal / safeDays;
  const daysLeft = Math.max(1, totalDays - daysElapsed);
  const requiredDailyToFinish = Math.max(0, (budget - spendTotal) / daysLeft);
  return {
    spendTotal,
    budget,
    daysElapsed,
    totalDays,
    realPct,
    expectedPct,
    deltaPct,
    status,
    dailyAvg,
    requiredDailyToFinish,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Reglas Julián vivas · evaluadas contra data viva
 * ─────────────────────────────────────────────────────────────────────── */

export type LiveRuleStatus = "pass" | "fail" | "watch" | "historic";

export interface LiveRule {
  /** Agrupación operativa. */
  category: "active-pass" | "active-fail" | "historic";
  /** Enunciado de la regla. */
  title: string;
  /** Detalle con cifras vivas. */
  detail: string;
  /** Estado evaluado dinámicamente. */
  status: LiveRuleStatus;
}

interface AdsetLite {
  cid: string;
  name: string;
  cpt: number | null;
  conversions: number;
  spend: number;
}

/**
 * Evalúa las reglas operativas de Julián contra la data viva.
 * Reglas aplicadas a campañas ACTIVE · las pausadas pasan a la sección
 * histórica con su razón documentada.
 */
export function evaluateLiveRules(
  campaigns: Campaign[],
  adsets: AdsetLite[],
): LiveRule[] {
  const rules: LiveRule[] = [];
  const active = campaigns.filter((c) => isActive(c.cid));

  // ── Regla 1 · CPR < critical en todas las activas ──────────────────
  const overCritical = active.filter(
    (c) =>
      c.cpt !== null && c.cpt > CPT_THRESHOLDS.critical && c.flag !== "anomaly",
  );
  rules.push({
    category: overCritical.length === 0 ? "active-pass" : "active-fail",
    title: `CPR < €${CPT_THRESHOLDS.critical} en todas las activas`,
    detail:
      overCritical.length === 0
        ? `Todas las ${active.length} activas con CPR bajo umbral crítico.`
        : `${overCritical.length} campaña${overCritical.length !== 1 ? "s" : ""} excede: ${overCritical
            .map((c) => `${c.code} (€${c.cpt?.toFixed(2)})`)
            .join(" · ")}`,
    status: overCritical.length === 0 ? "pass" : "fail",
  });

  // ── Regla 2 · Frecuencia < 2.5 ─────────────────────────────────────
  const overFreq = active.filter((c) => c.freq >= 2.5);
  const maxFreq =
    active.length > 0 ? Math.max(...active.map((c) => c.freq)) : 0;
  rules.push({
    category: overFreq.length === 0 ? "active-pass" : "active-fail",
    title: "Frecuencia < 2.5× en todas las activas",
    detail:
      overFreq.length === 0
        ? `Freq máxima ${maxFreq.toFixed(2)}× · dentro del límite.`
        : `${overFreq.map((c) => `${c.code} freq ${c.freq.toFixed(2)}×`).join(" · ")} · refrescar creativos.`,
    status: overFreq.length === 0 ? "pass" : "fail",
  });

  // ── Regla 3 · No gastar > 5× target sin conv (CR) ──────────────────
  const wastingCR = active.filter(
    (c) =>
      c.event === "CompleteRegistration" &&
      c.spend >= CPT_THRESHOLDS.target * 5 &&
      (c.evCompleteReg || 0) === 0,
  );
  rules.push({
    category: wastingCR.length === 0 ? "active-pass" : "active-fail",
    title: `Sin gasto > €${(CPT_THRESHOLDS.target * 5).toFixed(0)} sin conv (CR)`,
    detail:
      wastingCR.length === 0
        ? "Todas las activas CR registran conversiones."
        : `${wastingCR.map((c) => `${c.code} €${c.spend.toFixed(0)} / 0 CR`).join(" · ")}`,
    status: wastingCR.length === 0 ? "pass" : "fail",
  });

  // ── Regla 4 · Atribución 7d clic / 1d view ─────────────────────────
  rules.push({
    category: "active-pass",
    title: "Atribución 7d clic / 1d view",
    detail: "Configurada en setup · no se modifica durante el plan.",
    status: "pass",
  });

  // ── Regla 5 · CAPI puro desde 16-may ───────────────────────────────
  rules.push({
    category: "active-pass",
    title: "CAPI puro · dominio bewe.ai",
    detail:
      "Pixel eliminado 16-may · sin duplicados. Datos limpios desde esa fecha.",
    status: "pass",
  });

  // ── Regla 6 · Histórica · IC pausado ───────────────────────────────
  const icHistoric = campaigns.filter(
    (c) => c.event === "InitiateCheckout" && !isActive(c.cid),
  );
  if (icHistoric.length > 0) {
    rules.push({
      category: "historic",
      title: "IC pausado · validación 8× peor que CR",
      detail: `${icHistoric.map((c) => c.code).join(" · ")} pausadas tras validar tasa IC→signup <1%. Junio: cero IC.`,
      status: "historic",
    });
  }

  // ── Regla 7 · Adsets activos con CPR ≤ crítico ─────────────────────
  const activeCids = new Set(active.map((c) => c.cid));
  const overCriticalAdsets = adsets.filter(
    (a) =>
      activeCids.has(a.cid) &&
      a.cpt !== null &&
      a.cpt > CPT_THRESHOLDS.critical &&
      a.conversions > 0,
  );
  const evaluatedAdsets = adsets.filter((a) => activeCids.has(a.cid)).length;
  rules.push({
    category: overCriticalAdsets.length === 0 ? "active-pass" : "active-fail",
    title: `Adsets activos con CPR ≤ €${CPT_THRESHOLDS.critical}`,
    detail:
      overCriticalAdsets.length === 0
        ? `Sin adsets activos sobre umbral crítico (${evaluatedAdsets} evaluados).`
        : `${overCriticalAdsets.length} adset${overCriticalAdsets.length !== 1 ? "s" : ""} sobre €${CPT_THRESHOLDS.critical} · pausar.`,
    status: overCriticalAdsets.length === 0 ? "pass" : "fail",
  });

  return rules;
}
