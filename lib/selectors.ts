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
  // Tasa observada CR→trial pauta (~24.7% según ai-memory aprendizaje #2).
  const expectedTrials = Math.round(projectedCR * 0.247);
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
