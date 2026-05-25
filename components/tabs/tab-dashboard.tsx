"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Info,
  Wallet,
  Activity,
  Calendar,
  Rocket,
  Search,
  Zap,
  BarChart3,
  MousePointerClick,
  Eye,
  PauseCircle,
  FlaskConical,
  CheckCircle2,
  Target,
  ChevronRight,
  X,
  CreditCard,
  MessageCircle,
  KeyRound,
  Banknote,
  UserPlus,
  Tag,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { useFunnelEvents } from "@/lib/hooks/use-funnel-events";
import { PLAN } from "@/lib/config";
import { FUNNEL_EVENTS, type FunnelStage } from "@/lib/event-mapping";
import {
  cn,
  fmt,
  cptTone,
  ctrTone,
  cpmTone,
  daysUntil,
} from "@/lib/utils";
import {
  computeMetrics,
  computeMonthlyTotals,
  funnelCR,
  funnelIC,
  describeRange,
  realDailySeries,
  crCampaignIds,
  icCampaignIds,
  planBStatus,
} from "@/lib/selectors";
import {
  getDisplayName,
  getPausedReason,
  isActive,
  isPaused,
} from "@/lib/campaign-metadata";
import { GLOSSARY } from "@/lib/glossary";
import { SectionHeader } from "@/components/shared/section-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { Reveal } from "@/components/fx/reveal";
import { Badge } from "@/components/ui/badge";
import { DailySummary } from "@/components/shared/daily-summary";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import type { Campaign, DateRange } from "@/lib/types";

/** Plan B CID · MX_SERVICIOS_WEB_MAY26_CONVERSION (reemplazó al pixel-anómalo). */
const PLAN_B_CID = "52567055064286";
/** C3 con pixel roto · excluida de IC. */
const ANOMALY_CID = "52551556895286";

type AttentionTone = "danger" | "warning" | "info";

interface AttentionReason {
  /** Texto descriptivo del motivo. */
  text: string;
  /** Valor/chip asociado al motivo. */
  value: string;
  tone: AttentionTone;
  Icon: React.ComponentType<{ className?: string }>;
}

interface AttentionItem {
  cid: string;
  /** Nombre legible (display name). */
  name: string;
  /** Tono máximo (peor) entre todos los motivos. */
  tone: AttentionTone;
  /** CPL actual (7d) para mostrar en el header de la card. */
  cpl: number | null;
  /** Leads en el período. */
  leads: number;
  /** Status de la campaña (active/paused etc). */
  status: Campaign["status"];
  /** Lista de motivos por los que entra a atención. */
  reasons: AttentionReason[];
}

/* ─────────────────────────────────────────────────────────────────────────
 *  PERIOD SELECTOR (Día / 7d / Mes / Custom)
 * ─────────────────────────────────────────────────────────────────────── */

type PeriodId = "today" | "last_7d" | "this_month" | "custom";

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function detectPeriod(from: string, to: string): PeriodId {
  const today = isoToday();
  if (from === today && to === today) return "today";
  const m1 = new Date();
  const monthStart = new Date(m1.getFullYear(), m1.getMonth(), 1).toISOString().slice(0, 10);
  if (from === monthStart && to === today) return "this_month";
  if (from === isoDaysAgo(6) && to === today) return "last_7d";
  return "custom";
}

interface PeriodLabel {
  /** Identificador interno del periodo. */
  id: PeriodId;
  /** Etiqueta corta (UPPER) para chips de KPIs · ej "HOY", "7D", "MES", "RANGO". */
  short: string;
  /** Etiqueta larga para el banner del hero · ej "Hoy · 25 may". */
  long: string;
  /** Cantidad de días que cubre el rango (inclusivo from/to). */
  rangeDays: number;
}

/** Formato corto humano para una fecha ISO (YYYY-MM-DD). */
function fmtShortDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

/** Resuelve etiqueta corta + larga del periodo activo a partir del dateRange. */
function getPeriodLabel(dateRange: DateRange): PeriodLabel {
  const id = detectPeriod(dateRange.from, dateRange.to);
  const fromDate = new Date(dateRange.from + "T00:00:00");
  const toDate = new Date(dateRange.to + "T00:00:00");
  const rangeDays = Math.max(
    1,
    Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1,
  );
  if (id === "today") {
    return { id, short: "HOY", long: `Hoy · ${fmtShortDate(dateRange.from)}`, rangeDays };
  }
  if (id === "last_7d") {
    return { id, short: "7D", long: "Últimos 7 días", rangeDays };
  }
  if (id === "this_month") {
    return {
      id,
      short: "MES",
      long: `${PLAN.monthLabel} · acumulado`,
      rangeDays,
    };
  }
  return {
    id,
    short: "RANGO",
    long: `${fmtShortDate(dateRange.from)} → ${fmtShortDate(dateRange.to)}`,
    rangeDays,
  };
}

function PeriodSelector({ onCustom }: { onCustom: () => void }) {
  const { dateRange, setDateRange } = useDashboard();
  const active = detectPeriod(dateRange.from, dateRange.to);

  const buttons: Array<{ id: PeriodId; label: string; sub: string }> = [
    { id: "today", label: "Hoy", sub: "snapshot del día" },
    { id: "last_7d", label: "7 días", sub: "ventana móvil" },
    { id: "this_month", label: "Este mes", sub: "acumulado MAY26" },
    { id: "custom", label: "Custom", sub: "rango libre" },
  ];

  function pick(id: PeriodId) {
    if (id === "today") {
      const t = isoToday();
      setDateRange({ from: t, to: t });
      return;
    }
    if (id === "last_7d") {
      setDateRange({ from: isoDaysAgo(6), to: isoToday() });
      return;
    }
    if (id === "this_month") {
      const d = new Date();
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      setDateRange({ from: monthStart, to: isoToday() });
      return;
    }
    onCustom();
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {buttons.map((b) => {
        const isOn = active === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => pick(b.id)}
            className={cn(
              "group relative text-left rounded-xl border px-4 py-3 transition-all",
              "hover:border-foreground/40 hover:bg-card/60",
              isOn
                ? "border-[hsl(var(--brand-violet)/0.55)] bg-[hsl(var(--brand-violet)/0.08)]"
                : "border-border bg-card/30",
            )}
          >
            <div
              className={cn(
                "text-[14px] font-bold leading-none tracking-tight",
                isOn ? "text-[hsl(var(--brand-violet))]" : "text-foreground",
              )}
            >
              {b.label}
            </div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1.5">
              {b.sub}
            </div>
            {isOn && (
              <motion.span
                layoutId="period-pill"
                className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full"
                style={{ background: "hsl(var(--brand-violet))" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  ATTENTION ENGINE · alertas concretas (no "todo crítico")
 * ─────────────────────────────────────────────────────────────────────── */

interface CampaignDelta {
  cpl7d: number | null;
  cplWeekAgo: number | null;
  cplChangePct: number | null;
}

/** Calcula CPL 7d vs sem anterior para detectar drift. */
function computeCampaignDeltas(
  campaigns: Campaign[],
  daily: Array<{
    date: string;
    campaignId: string;
    adsetId?: string;
    spend: number;
    evCompleteReg: number;
  }>,
): Map<string, CampaignDelta> {
  const out = new Map<string, CampaignDelta>();
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const d7 = new Date(today);
  d7.setDate(d7.getDate() - 6);
  const d7ISO = d7.toISOString().slice(0, 10);
  const d8 = new Date(today);
  d8.setDate(d8.getDate() - 13);
  const d8ISO = d8.toISOString().slice(0, 10);
  const d14 = new Date(today);
  d14.setDate(d14.getDate() - 7);
  const d14ISO = d14.toISOString().slice(0, 10);

  for (const c of campaigns) {
    let spendCur = 0;
    let convCur = 0;
    let spendPrev = 0;
    let convPrev = 0;
    for (const row of daily) {
      if (row.adsetId) continue;
      if (row.campaignId !== c.cid) continue;
      if (row.date >= d7ISO && row.date <= todayISO) {
        spendCur += row.spend;
        convCur += row.evCompleteReg;
      } else if (row.date >= d8ISO && row.date <= d14ISO) {
        spendPrev += row.spend;
        convPrev += row.evCompleteReg;
      }
    }
    const cpl7d = convCur > 0 ? spendCur / convCur : null;
    const cplWeekAgo = convPrev > 0 ? spendPrev / convPrev : null;
    const cplChangePct =
      cpl7d !== null && cplWeekAgo !== null && cplWeekAgo > 0
        ? ((cpl7d - cplWeekAgo) / cplWeekAgo) * 100
        : null;
    out.set(c.cid, { cpl7d, cplWeekAgo, cplChangePct });
  }
  return out;
}

const TONE_WEIGHT: Record<AttentionTone, number> = { info: 0, warning: 1, danger: 2 };

function worstTone(reasons: AttentionReason[]): AttentionTone {
  let worst: AttentionTone = "info";
  for (const r of reasons) {
    if (TONE_WEIGHT[r.tone] > TONE_WEIGHT[worst]) worst = r.tone;
  }
  return worst;
}

function buildAttentionItems(
  campaigns: Campaign[],
  deltas: Map<string, CampaignDelta>,
): AttentionItem[] {
  // Solo campañas activas · no alertamos sobre pausadas.
  const active = campaigns.filter((c) => isActive(c.cid) || c.status === "ACTIVE");

  // Acumular motivos por CID (una sola card por campaña).
  const byCid = new Map<string, AttentionItem>();
  function ensure(c: Campaign): AttentionItem {
    const existing = byCid.get(c.cid);
    if (existing) return existing;
    const d = deltas.get(c.cid);
    const created: AttentionItem = {
      cid: c.cid,
      name: getDisplayName(c.name),
      tone: "info",
      cpl: d?.cpl7d ?? c.cpt ?? null,
      leads: c.evCompleteReg,
      status: c.status,
      reasons: [],
    };
    byCid.set(c.cid, created);
    return created;
  }

  for (const c of active) {
    // 1. CPL drift +25% vs semana pasada
    const d = deltas.get(c.cid);
    if (
      d?.cplChangePct !== null &&
      d?.cplChangePct !== undefined &&
      d.cplChangePct > 25 &&
      d.cpl7d !== null
    ) {
      const item = ensure(c);
      item.reasons.push({
        text: `CPL subió ${Math.round(d.cplChangePct)}% vs sem pasada`,
        value: fmt.eur(d.cpl7d),
        tone: d.cplChangePct > 60 ? "danger" : "warning",
        Icon: AlertTriangle,
      });
    }

    // 2. Frecuencia > 2.5
    if (c.freq > 2.5) {
      const item = ensure(c);
      item.reasons.push({
        text: `Frecuencia alta ${c.freq.toFixed(2)}× · audiencia cansada`,
        value: `${c.freq.toFixed(2)}x`,
        tone: c.freq > 3.5 ? "danger" : "warning",
        Icon: Activity,
      });
    }

    // 3. Mucha impresión sin CR
    if (c.impressions > 10_000 && c.evCompleteReg < 5) {
      const item = ensure(c);
      item.reasons.push({
        text: "Mucha impresión sin convertir · revisar creativo",
        value: `${fmt.int(c.impressions)} imp · ${c.evCompleteReg} CR`,
        tone: "warning",
        Icon: Eye,
      });
    }

    // 4. CPM alto > €5
    if (c.cpm > 5) {
      const item = ensure(c);
      item.reasons.push({
        text: "CPM alto · costo de impresión sobre target",
        value: fmt.eur(c.cpm),
        tone: c.cpm > 9 ? "danger" : "warning",
        Icon: Wallet,
      });
    }
  }

  // Computar tone máximo por card y devolver ordenado (peor tono primero).
  const out: AttentionItem[] = [];
  for (const item of byCid.values()) {
    if (item.reasons.length === 0) continue;
    item.tone = worstTone(item.reasons);
    out.push(item);
  }
  out.sort((a, b) => TONE_WEIGHT[b.tone] - TONE_WEIGHT[a.tone] || b.reasons.length - a.reasons.length);
  return out;
}

/* ─────────────────────────────────────────────────────────────────────────
 *  COMPONENT PRINCIPAL
 * ─────────────────────────────────────────────────────────────────────── */

export function TabDashboard() {
  const { campaigns, daysElapsed, dateRange, daily } = useDashboard();
  const m = computeMetrics(campaigns);
  const ctx = React.useMemo(
    () => describeRange(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to],
  );

  // Etiqueta del periodo activo · usada por el hero + chips de KPIs.
  const period = React.useMemo(() => getPeriodLabel(dateRange), [dateRange]);

  // Totales del MES completo · NO dependen del dateRange filter.
  // Sirven como contexto persistente debajo del big number.
  const monthly = React.useMemo(
    () => computeMonthlyTotals(daily, campaigns),
    [daily, campaigns],
  );

  // Métricas del PERIODO activo · usa `m` (campaigns ya viene filtrado por dateRange).
  // Esto reemplaza al viejo `todayMetrics` (que siempre era hoy).
  const periodSpend = m.spend;
  const periodLeads = m.totalConvCR;
  const periodIC = m.totalConvIC;
  const periodCPL: number | null = m.cptReg;


  // Plan B status · derivado del CID hardcoded · live.
  const planBLive = React.useMemo(() => {
    const c = campaigns.find((x) => x.cid === PLAN_B_CID);
    if (!c || c.spend <= 0) {
      return { active: false, label: "Plan B no activado", campaign: null as Campaign | null };
    }
    const cpr = c.evCompleteReg > 0 ? c.spend / c.evCompleteReg : null;
    return {
      active: true,
      label: `Plan B ACTIVO · ${getDisplayName(c.name)} · ${c.evCompleteReg} CR · CPR ${
        cpr === null ? "—" : fmt.eur(cpr)
      }`,
      campaign: c,
    };
  }, [campaigns]);

  // Delta CPL · base de alertas.
  const deltas = React.useMemo(() => computeCampaignDeltas(campaigns, daily), [campaigns, daily]);
  const attention = React.useMemo(
    () => buildAttentionItems(campaigns, deltas),
    [campaigns, deltas],
  );

  // Series reales por día.
  const crIds = React.useMemo(() => crCampaignIds(campaigns), [campaigns]);
  const icIds = React.useMemo(() => icCampaignIds(campaigns), [campaigns]);
  const spendSeries = React.useMemo(
    () => realDailySeries(daily, dateRange, "spend"),
    [daily, dateRange],
  );
  const cplSeries = React.useMemo(
    () => realDailySeries(daily, dateRange, "cpl", crIds),
    [daily, dateRange, crIds],
  );
  const cpicSeries = React.useMemo(
    () => realDailySeries(daily, dateRange, "cpic", icIds),
    [daily, dateRange, icIds],
  );
  const ctrSeries = React.useMemo(
    () => realDailySeries(daily, dateRange, "ctr"),
    [daily, dateRange],
  );
  const cpmSeries = React.useMemo(
    () => realDailySeries(daily, dateRange, "cpm"),
    [daily, dateRange],
  );

  // Active/paused desde el lifecycle hardcoded.
  const activeCount = campaigns.filter((c) => isActive(c.cid)).length;
  const pausedCount = campaigns.filter((c) => isPaused(c.cid)).length;

  const planB = React.useMemo(() => planBStatus(campaigns, daysElapsed), [campaigns, daysElapsed]);

  const [customOpen, setCustomOpen] = React.useState(false);

  return (
    <div className="space-y-7 max-w-[1500px]">
      {/* CONTEXT BANNERS */}
      {(ctx.includesPreLaunch || ctx.includesPrePixelFix) && (
        <Reveal>
          <div className="space-y-2">
            {ctx.includesPreLaunch && (
              <ContextBanner
                tone="info"
                Icon={Info}
                title="Datos MAY26 arrancan el 12-may"
                desc="El lanzamiento fue el 12 de mayo. Pre-12-may había una marca B2B anterior con presupuesto pequeño que NO cuenta en este reporte."
              />
            )}
            {ctx.includesPrePixelFix && (
              <ContextBanner
                tone="warning"
                Icon={AlertTriangle}
                title="Tracking duplicado hasta 16-may"
                desc="Hasta el 16-may hubo duplicación de eventos (pixel + CAPI). Desde 16-may solo CAPI server-side. Las comparaciones cross-período deben tener esto en cuenta."
              />
            )}
          </div>
        </Reveal>
      )}

      {/* PERIOD SELECTOR · prominente arriba */}
      <Reveal>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Período de análisis
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Cambia la ventana sin re-llamar la API · {ctx.label}
              </p>
            </div>
            {detectPeriod(dateRange.from, dateRange.to) === "custom" && (
              <Badge variant="violet" className="font-mono text-[10px]">
                {dateRange.from} → {dateRange.to}
              </Badge>
            )}
          </div>
          <PeriodSelector onCustom={() => setCustomOpen(true)} />
          <AnimatePresence>
            {customOpen && <CustomRangePanel onClose={() => setCustomOpen(false)} />}
          </AnimatePresence>
        </div>
      </Reveal>

      {/* HERO · resumen del DÍA primero · luego mes */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40" />
          <div className="absolute -top-32 -right-24 w-[480px] h-[480px] bg-[hsl(var(--brand-violet)/0.18)] rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] bg-[hsl(var(--brand-cyan)/0.14)] rounded-full blur-3xl" />

          <div className="relative px-6 md:px-10 py-8 md:py-10 grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                <span className="size-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse-glow" />
                Operativo · día {daysElapsed} / {PLAN.totalDays}
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[hsl(var(--brand-violet))]">
                  {activeCount} activas · {pausedCount} pausadas
                </span>
              </div>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--brand-lime))] mb-1.5">
                  {period.long}
                </div>
                <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-5xl leading-[1.02] text-balance">
                  <span className="text-aurora">{fmt.eur(periodSpend, { decimals: 0 })}</span>{" "}
                  gastados ·{" "}
                  <span className="text-[hsl(var(--brand-lime))]">{periodLeads}</span>{" "}
                  lead{periodLeads === 1 ? "" : "s"}
                </h1>
              </div>

              {/* Contexto del MES · siempre visible, NO depende del filter.
                  Cuando el periodo es "this_month" mostramos el avance del plan
                  en su lugar para no repetir información. */}
              {period.id === "this_month" ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:text-base text-muted-foreground">
                  <span className="text-foreground/80 font-semibold">Plan:</span>
                  <span>
                    día{" "}
                    <span className="font-mono text-foreground">{monthly.daysElapsed}</span> de{" "}
                    <span className="font-mono text-foreground">{PLAN.totalDays}</span>
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    <span className="font-mono text-foreground">
                      {Math.round(monthly.budgetPct)}%
                    </span>{" "}
                    del budget
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    CPL{" "}
                    <span className="font-mono text-foreground">
                      {monthly.cplCR > 0 ? fmt.eur(monthly.cplCR) : "—"}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:text-base text-muted-foreground">
                  <span className="text-foreground/80 font-semibold">Mes:</span>
                  <span>
                    <span className="font-mono text-foreground">
                      {fmt.eur(monthly.spend, { decimals: 0 })}
                    </span>{" "}
                    / €{PLAN.budget.toLocaleString("es")}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    <span className="font-mono text-foreground">{monthly.leads}</span> leads totales
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    CPL mes{" "}
                    <span className="font-mono text-foreground">
                      {monthly.cplCR > 0 ? fmt.eur(monthly.cplCR) : "—"}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat
                label={`${period.short} · Gasto`}
                value={periodSpend}
                format={(v) => fmt.eur(v, { decimals: 0 })}
                sub={(() => {
                  // % del BUDGET (no del mes-acumulado) · evita "100% del mes"
                  // cuando filter = Hoy. Para Hoy/Custom mostramos % del budget;
                  // para 7d el delta vs 7d anteriores se omite por falta de data
                  // contigua confiable · fallback a % del budget también.
                  if (period.id === "this_month") {
                    const perDay = monthly.daysElapsed > 0 ? monthly.spend / monthly.daysElapsed : 0;
                    return `${monthly.daysElapsed} días · ${fmt.eur(perDay, { decimals: 0 })}/día`;
                  }
                  if (period.id === "custom") {
                    return `${period.rangeDays} día${period.rangeDays === 1 ? "" : "s"}`;
                  }
                  const pctBudget =
                    PLAN.budget > 0 ? Math.round((periodSpend / PLAN.budget) * 100) : 0;
                  return `${pctBudget}% del budget mes`;
                })()}
                tone="lime"
              />
              <HeroStat
                label={`${period.short} · Leads`}
                value={periodLeads}
                format={(v) => fmt.int(v)}
                sub={`mes ${monthly.leads} · objetivo 1.350`}
              />
              <HeroStat
                label={`${period.short} · CPL`}
                value={periodCPL ?? 0}
                format={(v) => (periodCPL === null ? "sin leads" : fmt.eur(v))}
                sub={`mes ${monthly.cplCR > 0 ? fmt.eur(monthly.cplCR) : "—"} · obj. ≤ €${PLAN.cpt.target}`}
                tone="cyan"
              />
              <HeroStat
                label={`${period.short} · IC`}
                value={periodIC}
                format={(v) => fmt.int(v)}
                sub={`mes ${monthly.ic} · excluye anomalía`}
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ATENCIÓN REQUERIDA · solo señales concretas */}
      <section>
        <SectionHeader
          title="Atención requerida"
          sub={
            attention.length === 0
              ? "Todas las campañas dentro de rango"
              : `${attention.length} señal${attention.length === 1 ? "" : "es"} concreta${attention.length === 1 ? "" : "s"}`
          }
        />
        {attention.length === 0 ? (
          <TextureCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-9 grid place-items-center rounded-lg border border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-tight">
                  Todas las campañas dentro de rango
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  No hay atención requerida. CPL estable, frecuencia bajo umbral, CPM en target.
                </p>
              </div>
            </div>
          </TextureCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {attention.map((a, i) => (
              <AttentionCard key={`${a.cid}-${i}`} item={a} />
            ))}
          </div>
        )}
      </section>

      {/* KPI ROW · Costo por lead */}
      <section>
        <SectionHeader
          title="Métricas clave"
          sub={`Snapshot agregado · ${ctx.label.toLowerCase()}`}
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <KpiCard
            label="Gasto total"
            value={m.spend}
            format={(v) => fmt.eur(v, { decimals: 0 })}
            sub={`${Math.round(m.budgetPct)}% · ${fmt.eur(m.remaining, { decimals: 0 })} restante`}
            tone="default"
            trend={spendSeries}
            badge={
              <Badge variant="outline" className="font-mono">
                €{PLAN.budget.toLocaleString("es")}
              </Badge>
            }
            delay={0.02}
          />
          <KpiCard
            label="Costo por lead"
            value={m.cptReg ?? 0}
            format={(v) => (m.cptReg === null ? "sin leads" : fmt.eur(v))}
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>Costo por Lead (CPL)</strong>
                    <br />
                    Spend total dividido por eventos CompleteRegistration de las
                    campañas optimizadas a CR (C1, C2, C4).
                    <br />
                    <br />
                    <strong>{GLOSSARY.cr.term}</strong> · {GLOSSARY.cr.short}
                    <br />
                    {GLOSSARY.cpt.long}
                  </div>
                }
              >
                <span className="text-[10px]">{m.totalConvCR} leads · CR campañas</span>
              </ExplainedMetric>
            }
            tone={
              m.cptReg === null
                ? "default"
                : cptTone(m.cptReg) === "success"
                  ? "success"
                  : cptTone(m.cptReg) === "warning"
                    ? "warning"
                    : "danger"
            }
            trend={cplSeries}
            delay={0.06}
          />
          <KpiCard
            label="Costo por IC"
            value={m.cptIco ?? 0}
            format={(v) => (m.cptIco === null ? "sin IC" : fmt.eur(v))}
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>Costo por Initiate Checkout (CPIC)</strong>
                    <br />
                    Spend de campañas IC dividido por sus eventos initiate_checkout.
                    Excluye C3 (CID 52551556895286) por anomalía de pixel.
                    <br />
                    <br />
                    <strong>{GLOSSARY.ic.term}</strong> · {GLOSSARY.ic.short}
                  </div>
                }
              >
                <span className="text-[10px]">{m.totalConvIC} IC · IC campañas</span>
              </ExplainedMetric>
            }
            tone={
              m.cptIco === null
                ? "default"
                : cptTone(m.cptIco) === "success"
                  ? "lime"
                  : cptTone(m.cptIco) === "warning"
                    ? "warning"
                    : "danger"
            }
            trend={cpicSeries}
            delay={0.1}
          />
          <KpiCard
            label="CTR global"
            value={m.ctr}
            format={(v) => fmt.pct(v)}
            sub="objetivo 1.5 – 2.5 %"
            tone={
              ctrTone(m.ctr) === "success"
                ? "success"
                : ctrTone(m.ctr) === "warning"
                  ? "warning"
                  : "default"
            }
            trend={ctrSeries}
            delay={0.14}
          />
          <KpiCard
            label="CPM global"
            value={m.cpm}
            format={(v) => fmt.eur(v)}
            sub="objetivo < €9"
            tone={
              cpmTone(m.cpm) === "success"
                ? "cyan"
                : cpmTone(m.cpm) === "warning"
                  ? "warning"
                  : "default"
            }
            trend={cpmSeries}
            delay={0.18}
          />
        </div>
      </section>

      {/* PLAN B STATUS · dinámico */}
      <section>
        <PlanBCard live={planBLive} />
      </section>

      {/* DAILY SUMMARY */}
      <Reveal>
        <DailySummary />
      </Reveal>

      {/* FUNNEL SAAS COMPLETO · journey impresión → suscripción */}
      <section>
        <SectionHeader
          title="Embudo SaaS completo · journey del usuario"
          sub="Impresión → Click → Pricing → WhatsApp → Registro → Trial → Subscripción · Meta CAPI + GA4"
        />
        <SaasJourneyFunnel />
      </section>

      {/* FUNNEL CR · GRANDE · clickeable */}
      <section>
        <SectionHeader
          title="Embudo Completar Registro · campañas CR"
          sub="Impresiones → Clicks → Landing → Lead · clickea cada paso para ver detalle por campaña"
        />
        <BigFunnelCR />
      </section>

      {/* TRIAL & SUBSCRIPTION KPIs · costo por conversión final */}
      <section>
        <SectionHeader
          title="Trial & Subscripción · costo de conversión"
          sub="Eventos del fondo del funnel · requieren Meta CAPI o GA4 con StartTrial / Subscribe"
        />
        <TrialSubscriptionKpis />
      </section>

      {/* FUNNEL IC */}
      <section>
        <SectionHeader
          title="Embudo Inicio de pago · downstream"
          sub="Campañas IC · pendiente analytics para CR → Trial real"
        />
        <div className="grid lg:grid-cols-[2fr_1fr] gap-3">
          <FunnelICCard />
          <TrialPendingCard />
        </div>
      </section>

      {/* TIMELINE */}
      <section>
        <TimelineCard daysElapsed={daysElapsed} activeCount={activeCount} planB={planB} />
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Subcomponentes
 * ─────────────────────────────────────────────────────────────────────── */

function ContextBanner({
  tone,
  Icon,
  title,
  desc,
}: {
  tone: "info" | "warning";
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  const color = tone === "info" ? "var(--info)" : "var(--warning)";
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl border"
      style={{
        background: `hsl(${color} / 0.08)`,
        borderColor: `hsl(${color} / 0.35)`,
      }}
    >
      <div
        className="size-7 grid place-items-center rounded-lg shrink-0"
        style={{ background: `hsl(${color} / 0.18)`, color: `hsl(${color})` }}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[12px] font-semibold leading-tight"
          style={{ color: `hsl(${color})` }}
        >
          {title}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
}

function CustomRangePanel({ onClose }: { onClose: () => void }) {
  const { dateRange, setDateRange } = useDashboard();
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden"
    >
      <TextureCard className="p-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
            Rango personalizado
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Cerrar"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-[10px] text-muted-foreground mb-1">Desde</div>
            <input
              type="date"
              value={dateRange.from}
              max={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full h-9 bg-background border border-border rounded-md px-2 text-[11px] font-mono"
            />
          </label>
          <label className="block">
            <div className="text-[10px] text-muted-foreground mb-1">Hasta</div>
            <input
              type="date"
              value={dateRange.to}
              min={dateRange.from}
              max={isoToday()}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full h-9 bg-background border border-border rounded-md px-2 text-[11px] font-mono"
            />
          </label>
        </div>
      </TextureCard>
    </motion.div>
  );
}

function HeroStat({
  label,
  value,
  format,
  sub,
  tone = "default",
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  sub: string;
  tone?: "default" | "cyan" | "lime" | "ember" | "danger";
}) {
  const colorMap = {
    default: "text-foreground",
    cyan: "text-[hsl(var(--brand-cyan))]",
    lime: "text-[hsl(var(--brand-lime))]",
    ember: "text-[hsl(var(--brand-ember))]",
    danger: "text-[hsl(var(--destructive))]",
  };
  return (
    <TextureCard className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
        {label}
      </div>
      <div className={cn("font-mono font-bold text-2xl tabular leading-none", colorMap[tone])}>
        <AnimatedNumber value={value} format={format} duration={1.4} />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1.5">{sub}</div>
    </TextureCard>
  );
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const color =
    item.tone === "danger"
      ? "var(--destructive)"
      : item.tone === "warning"
        ? "var(--warning)"
        : "var(--info)";
  const headerLabel = item.tone === "danger" ? "Crítico" : item.tone === "warning" ? "Atención" : "Aviso";
  const PrimaryIcon = item.reasons[0]?.Icon ?? AlertTriangle;
  return (
    <SpotlightCard spotlightColor={color} intensity={0.22} className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 grid place-items-center size-9 rounded-lg border"
          style={{
            background: `hsl(${color} / 0.12)`,
            borderColor: `hsl(${color} / 0.4)`,
            color: `hsl(${color})`,
          }}
        >
          <PrimaryIcon className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-[13px] font-semibold leading-tight">{item.name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="font-mono text-[10px] font-bold tabular px-2 py-0.5 rounded-md uppercase tracking-[0.06em]"
                style={{ background: `hsl(${color} / 0.14)`, color: `hsl(${color})` }}
              >
                {headerLabel}
              </span>
              {item.reasons.length > 1 && (
                <span
                  className="font-mono text-[10px] font-bold tabular px-1.5 py-0.5 rounded-md"
                  style={{ background: `hsl(${color} / 0.08)`, color: `hsl(${color})` }}
                >
                  {item.reasons.length}
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mb-2">
            CPT {item.cpl === null ? "—" : fmt.eur(item.cpl)} · {fmt.int(item.leads)} leads
          </div>
          <ul className="space-y-1.5">
            {item.reasons.map((r, idx) => {
              const reasonColor =
                r.tone === "danger"
                  ? "var(--destructive)"
                  : r.tone === "warning"
                    ? "var(--warning)"
                    : "var(--info)";
              return (
                <li
                  key={idx}
                  className="flex items-start justify-between gap-2 text-[12px] leading-snug"
                >
                  <div className="flex items-start gap-1.5 min-w-0">
                    <span
                      className="mt-1 inline-block size-1.5 rounded-full shrink-0"
                      style={{ background: `hsl(${reasonColor})` }}
                    />
                    <span className="text-foreground/80">{r.text}</span>
                  </div>
                  <span
                    className="shrink-0 font-mono text-[10.5px] font-bold tabular"
                    style={{ color: `hsl(${reasonColor})` }}
                  >
                    {r.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </SpotlightCard>
  );
}

function PlanBCard({
  live,
}: {
  live: { active: boolean; label: string; campaign: Campaign | null };
}) {
  const color = live.active ? "var(--brand-violet)" : "var(--muted-foreground)";
  return (
    <SpotlightCard spotlightColor={color} intensity={0.2} className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 grid place-items-center size-10 rounded-lg border"
          style={{
            background: `hsl(${color} / 0.12)`,
            borderColor: `hsl(${color} / 0.4)`,
            color: `hsl(${color})`,
          }}
        >
          <Zap className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[13px] font-semibold leading-tight">Plan B · MX Servicios</h3>
            <Badge variant={live.active ? "violet" : "outline"} className="shrink-0">
              {live.active ? "ACTIVO" : "no activado"}
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{live.label}</p>
          {live.active && live.campaign && (
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/40">
              <PlanBStat label="Gasto" value={fmt.eur(live.campaign.spend, { decimals: 0 })} />
              <PlanBStat label="Leads" value={fmt.int(live.campaign.evCompleteReg)} />
              <PlanBStat
                label="CPL"
                value={
                  live.campaign.evCompleteReg > 0
                    ? fmt.eur(live.campaign.spend / live.campaign.evCompleteReg)
                    : "—"
                }
              />
            </div>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}

function PlanBStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="font-mono font-bold text-[15px] tabular leading-tight mt-1 text-foreground">
        {value}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  BigFunnelCR · Funnel grande de Completar Registro
 *  Full width · clickeable · muestra detalle por campaña en panel inline
 * ─────────────────────────────────────────────────────────────────────── */

interface FunnelStep {
  id: "impressions" | "clicks" | "landing" | "leads";
  label: string;
  value: number;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function BigFunnelCR() {
  const { campaigns } = useDashboard();
  const data = funnelCR(campaigns);
  const [selectedStep, setSelectedStep] = React.useState<FunnelStep["id"] | null>(null);

  // Landing views ≈ link_clicks · proxy hasta GA4.
  const steps: FunnelStep[] = [
    {
      id: "impressions",
      label: "Impresiones",
      value: data.impressions,
      color: "var(--brand-violet)",
      Icon: Eye,
    },
    {
      id: "clicks",
      label: "Link clicks",
      value: data.clicks,
      color: "var(--brand-cyan)",
      Icon: MousePointerClick,
    },
    {
      id: "landing",
      label: "Landing views",
      value: data.clicks,
      color: "var(--info)",
      Icon: Target,
    },
    {
      id: "leads",
      label: "Leads",
      value: data.events,
      color: "var(--brand-lime)",
      Icon: CheckCircle2,
    },
  ];

  const max = Math.max(...steps.map((s) => s.value), 1);

  const stepConv: Array<number | null> = steps.map((s, i) => {
    if (i === 0) return null;
    const prev = steps[i - 1].value;
    return prev > 0 ? (s.value / prev) * 100 : 0;
  });

  // Detect si link_clicks ≈ landing_views · misma página · evita el "100%" confuso.
  // Hoy `landing.value` es proxy de `data.clicks` (GA4 pending) · por lo tanto siempre
  // son iguales. Cuando se conecte GA4 con un valor real, este flag se calculará
  // contra la diferencia <5%.
  const clicksValue = steps[1]?.value ?? 0;
  const landingValue = steps[2]?.value ?? 0;
  const sameLandingPage =
    clicksValue > 0 && Math.abs(clicksValue - landingValue) / clicksValue < 0.05;

  return (
    <TextureCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            CompleteRegistration · campañas CR
          </div>
          <div className="font-mono font-bold text-2xl tabular text-foreground leading-tight mt-1">
            {fmt.int(data.events)}{" "}
            <span className="text-muted-foreground font-normal text-base">leads</span>
            {" · "}
            <span className="text-[hsl(var(--brand-lime))]">
              {data.costPerEvent === null ? "—" : fmt.eur(data.costPerEvent)}
            </span>
            <span className="text-muted-foreground font-normal text-[10px] ml-1">CPL</span>
          </div>
        </div>
        <Badge variant="outline" className="font-mono">
          {data.activeCount} activa{data.activeCount === 1 ? "" : "s"} · {data.campaigns.length}{" "}
          total
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5" style={{ minHeight: 400 }}>
        {steps.map((s, i) => {
          // Escala sqrt para que las barras pequeñas no colapsen a nada
          // mantengamos monotonía: impresiones (max) = 100% · resto > 0.
          const ratio = s.value / max;
          const heightPct = Math.max(8, Math.sqrt(ratio) * 100);
          const isSelected = selectedStep === s.id;
          const conv = stepConv[i];
          // No mostrar "100%" entre Link Clicks y Landing si son iguales (misma página).
          const isLandingProxy =
            s.id === "landing" && sameLandingPage && conv !== null && Math.abs(conv - 100) < 0.5;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedStep(isSelected ? null : s.id)}
              className={cn(
                "relative group flex flex-col items-center gap-2 rounded-xl border transition-all p-3",
                "h-full justify-end",
                isSelected
                  ? "border-[hsl(var(--brand-violet)/0.6)] bg-[hsl(var(--brand-violet)/0.06)]"
                  : "border-border/60 hover:border-foreground/30 hover:bg-card/40",
              )}
            >
              {i > 0 && conv !== null && !isLandingProxy && (
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold tabular"
                  style={{
                    background: `hsl(${s.color} / 0.14)`,
                    color: `hsl(${s.color})`,
                  }}
                >
                  {conv.toFixed(1)}%
                </div>
              )}
              {isLandingProxy && (
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full font-mono text-[9px] font-semibold"
                  style={{
                    background: "hsl(var(--muted) / 0.4)",
                    color: "hsl(var(--muted-foreground))",
                  }}
                  title="Landing view se dispara junto al click · es la misma página"
                >
                  ≈ misma página
                </div>
              )}

              <div
                className="size-9 grid place-items-center rounded-lg border mt-7"
                style={{
                  background: `hsl(${s.color} / 0.12)`,
                  borderColor: `hsl(${s.color} / 0.35)`,
                  color: `hsl(${s.color})`,
                }}
              >
                <s.Icon className="size-4" />
              </div>

              <div className="flex-1 w-full flex items-end justify-center py-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                  className="w-[70%] rounded-t-lg relative"
                  style={{
                    background: `linear-gradient(180deg, hsl(${s.color} / 0.95), hsl(${s.color} / 0.35))`,
                    boxShadow: `0 0 24px -8px hsl(${s.color} / 0.6), inset 0 1px 0 hsl(${s.color})`,
                  }}
                >
                  {/* Lengüeta con número arriba de cada barra. */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold tabular whitespace-nowrap"
                    style={{
                      background: `hsl(${s.color} / 0.15)`,
                      color: `hsl(${s.color})`,
                      border: `1px solid hsl(${s.color} / 0.4)`,
                    }}
                  >
                    {fmt.int(s.value)}
                  </div>
                </motion.div>
              </div>

              <div
                className="font-mono font-bold text-3xl tabular leading-none"
                style={{ color: `hsl(${s.color})` }}
              >
                <AnimatedNumber value={s.value} format={(v) => fmt.int(v)} />
              </div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground text-center">
                {s.label}
              </div>

              <div className="text-[9px] text-muted-foreground/60 inline-flex items-center gap-0.5 mt-1">
                {isSelected ? "ocultar detalle" : "ver por campaña"}
                <ChevronRight
                  className={cn("size-2.5 transition-transform", isSelected && "rotate-90")}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border/40">
        <FunnelKpi label="CTR" value={fmt.pct(data.ctr)} tone={ctrTone(data.ctr)} />
        <FunnelKpi
          label="CPL"
          value={data.costPerEvent === null ? "—" : fmt.eur(data.costPerEvent)}
          tone={cptTone(data.costPerEvent)}
        />
        <FunnelKpi
          label="Click → Lead"
          value={data.clicks > 0 ? fmt.pct(data.conversionPct) : "—"}
          tone="default"
        />
        <FunnelKpi label="Gasto CR" value={fmt.eur(data.spend, { decimals: 0 })} tone="default" />
      </div>

      <AnimatePresence>
        {selectedStep && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <FunnelStepDetail
              step={steps.find((s) => s.id === selectedStep) as FunnelStep}
              campaigns={data.campaigns}
              onClose={() => setSelectedStep(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </TextureCard>
  );
}

function FunnelKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "violet"
    | "lime"
    | "ember"
    | "cyan";
}) {
  const colorMap: Record<string, string> = {
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
    default: "text-foreground",
    info: "text-[hsl(var(--info))]",
    violet: "text-[hsl(var(--brand-violet))]",
    lime: "text-[hsl(var(--brand-lime))]",
    ember: "text-[hsl(var(--brand-ember))]",
    cyan: "text-[hsl(var(--brand-cyan))]",
  };
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono font-bold text-[18px] tabular leading-tight mt-1",
          colorMap[tone],
        )}
      >
        {value}
      </div>
    </div>
  );
}

function FunnelStepDetail({
  step,
  campaigns,
  onClose,
}: {
  step: FunnelStep;
  campaigns: Campaign[];
  onClose: () => void;
}) {
  function getStepValue(c: Campaign, id: FunnelStep["id"]): number {
    switch (id) {
      case "impressions":
        return c.impressions;
      case "clicks":
        return c.clicks;
      case "landing":
        return c.clicks; // proxy · GA4 pendiente
      case "leads":
        return c.evCompleteReg;
    }
  }

  const sorted = [...campaigns].sort(
    (a, b) => getStepValue(b, step.id) - getStepValue(a, step.id),
  );
  const total = sorted.reduce((s, c) => s + getStepValue(c, step.id), 0);

  return (
    <div className="mt-5 pt-5 border-t border-border/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="size-7 grid place-items-center rounded-md"
            style={{
              background: `hsl(${step.color} / 0.12)`,
              color: `hsl(${step.color})`,
            }}
          >
            <step.Icon className="size-3.5" />
          </div>
          <div>
            <div className="text-[12px] font-semibold leading-tight">
              {step.label} · detalle por campaña
            </div>
            <div className="text-[10px] text-muted-foreground">
              Total {fmt.int(total)} · {sorted.length} campaña{sorted.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-7 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
          aria-label="Cerrar detalle"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map((c) => {
          const v = getStepValue(c, step.id);
          const pct = total > 0 ? (v / total) * 100 : 0;
          const reason = isPaused(c.cid) ? getPausedReason(c.cid) : null;
          const isActiveCid = isActive(c.cid);
          return (
            <div
              key={c.cid}
              className={cn(
                "rounded-lg border px-3 py-2.5",
                isActiveCid
                  ? "border-border/60 bg-card/40"
                  : "border-border/30 bg-card/15 opacity-80",
              )}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant={isActiveCid ? "outline" : "warning"}
                    className="shrink-0 text-[9px]"
                  >
                    {isActiveCid ? "ACTIVA" : "PAUSADA"}
                  </Badge>
                  <span className="text-[12px] font-semibold truncate">
                    {getDisplayName(c.name)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="font-mono font-bold text-[14px] tabular leading-none"
                    style={{ color: `hsl(${step.color})` }}
                  >
                    {fmt.int(v)}
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                    {pct.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                  style={{ background: `hsl(${step.color})` }}
                />
              </div>
              {reason && (
                <p className="text-[10px] text-muted-foreground mt-1.5 italic">{reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  FunnelICCard · queda igual
 * ─────────────────────────────────────────────────────────────────────── */

function FunnelICCard() {
  const { campaigns, snapshot } = useDashboard();
  const data = funnelIC(campaigns);

  const accent = "var(--brand-cyan)";
  const max = Math.max(data.impressions, data.clicks, data.events, 1);

  const steps = [
    { label: "Impresiones", value: data.impressions, Icon: Eye, color: "var(--brand-violet)" },
    { label: "Clicks", value: data.clicks, Icon: MousePointerClick, color: "var(--brand-cyan)" },
    { label: "InitiateCheckout", value: data.events, Icon: Target, color: accent },
  ];

  const allPaused = data.pausedCount === data.campaigns.length && data.campaigns.length > 0;
  const pausedLabel = (() => {
    if (!allPaused) return null;
    if (!snapshot.fetchedAt) return "Pausado";
    try {
      return `Pausado · snapshot ${new Date(snapshot.fetchedAt).toLocaleDateString("es", {
        day: "numeric",
        month: "short",
      })}`;
    } catch {
      return "Pausado";
    }
  })();

  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
            IC · Pago iniciado
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Campañas IC · excluye anomalía pixel C3
          </p>
        </div>
        {pausedLabel ? (
          <Badge variant="warning" className="shrink-0 gap-1">
            <PauseCircle className="size-3" />
            {pausedLabel}
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 font-mono">
            {data.activeCount} activa{data.activeCount === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      <div className="flex items-end gap-1 mb-4 h-[160px]">
        {steps.map((s, i) => {
          const heightPct = Math.max(6, (s.value / max) * 100);
          return (
            <React.Fragment key={i}>
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                  className="w-[68%] rounded-t-lg relative overflow-hidden"
                  style={{
                    background: `linear-gradient(180deg, hsl(${s.color} / 0.9), hsl(${s.color} / 0.3))`,
                    boxShadow: `0 0 24px -8px hsl(${s.color} / 0.55), inset 0 1px 0 hsl(${s.color})`,
                  }}
                />
                <div className="flex flex-col items-center">
                  <div
                    className="font-mono font-bold text-xl tabular leading-none"
                    style={{ color: `hsl(${s.color})` }}
                  >
                    <AnimatedNumber value={s.value} format={(v) => fmt.int(v)} />
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground mt-1 text-center">
                    {s.label}
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="self-center text-muted-foreground/40 text-xl pb-10">→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
        <FunnelKpi label="CTR" value={fmt.pct(data.ctr)} tone={ctrTone(data.ctr)} />
        <FunnelKpi
          label="CPIC"
          value={data.costPerEvent === null ? "—" : fmt.eur(data.costPerEvent)}
          tone={cptTone(data.costPerEvent)}
        />
        <FunnelKpi
          label="Click → IC"
          value={data.clicks > 0 ? fmt.pct(data.conversionPct) : "—"}
          tone="default"
        />
      </div>
    </TextureCard>
  );
}

function TrialPendingCard() {
  return (
    <TextureCard className="p-4 h-full">
      <div className="flex items-start gap-3">
        <div className="size-9 grid place-items-center rounded-lg border border-[hsl(var(--brand-violet)/0.4)] bg-[hsl(var(--brand-violet)/0.12)] text-[hsl(var(--brand-violet))]">
          <FlaskConical className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[12px] font-semibold leading-tight">
              Trial real · Lead → activación
            </h3>
            <Badge variant="violet" className="shrink-0">
              analytics pendiente
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Cuántos leads efectivamente activan trial en bewe.ai. Pendiente de conectar GA4 ·
            por ahora medimos leads (CompleteRegistration) y no la activación posterior.
          </p>
        </div>
      </div>
    </TextureCard>
  );
}

function TimelineCard({
  daysElapsed,
  activeCount,
  planB,
}: {
  daysElapsed: number;
  activeCount: number;
  planB: { status: "activated" | "pending" | "watch" | "n/a"; detail: string };
}) {
  const d7 = daysUntil(PLAN.day7ISO);
  const d14 = daysUntil(PLAN.day14ISO);
  const launchDesc =
    activeCount === 0
      ? "Sin campañas activas (todas pausadas)"
      : `${activeCount} ${activeCount === 1 ? "campaña activa" : "campañas activas"}`;
  const planBDesc =
    planB.status === "n/a"
      ? "Watchpoint CO · revisar geo-leakage"
      : `${planB.detail} · Watchpoint CO`;
  const items: Array<{
    Icon: React.ComponentType<{ className?: string }>;
    date: string;
    title: string;
    desc: string;
    descSub?: string;
    status: "done" | "now" | "past" | "future";
    sub: string;
  }> = [
    {
      Icon: Rocket,
      date: "12 may",
      title: "Lanzamiento",
      desc: launchDesc,
      status: "done",
      sub: `Día ${daysElapsed}`,
    },
    {
      Icon: Search,
      date: "19 may · día 7",
      title: "Plan B + Watchpoint CO",
      desc: planBDesc,
      status: d7 < 0 ? "past" : d7 <= 1 ? "now" : "future",
      sub: d7 < 0 ? `Hace ${Math.abs(d7)}d` : d7 === 0 ? "Hoy" : `En ${d7}d`,
    },
    {
      Icon: Zap,
      date: "26 may · día 14",
      title: "C7 + contingencia",
      desc: "Activar si ≥1k visits + 30 trials",
      descSub: "(visits/trials requieren analytics · pendiente)",
      status: d14 < 0 ? "past" : d14 <= 1 ? "now" : "future",
      sub: d14 < 0 ? `Hace ${Math.abs(d14)}d` : d14 === 0 ? "Hoy" : `En ${d14}d`,
    },
    {
      Icon: BarChart3,
      date: "31 may",
      title: "Cierre mes 1",
      desc: "Reporte + brief junio",
      status: "future",
      sub: `En ${daysUntil(PLAN.endISO)}d`,
    },
  ];

  return (
    <TextureCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Fechas clave
        </h3>
        <Calendar className="size-3.5 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {items.map((it, i) => {
          const color =
            it.status === "done"
              ? "var(--success)"
              : it.status === "now"
                ? "var(--brand-violet)"
                : it.status === "past"
                  ? "var(--warning)"
                  : "var(--muted-foreground)";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div
                className="size-9 grid place-items-center rounded-lg border shrink-0"
                style={{
                  background: `hsl(${color} / 0.1)`,
                  borderColor: `hsl(${color} / 0.35)`,
                  color: `hsl(${color})`,
                }}
              >
                <it.Icon className="size-[15px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {it.date}
                </div>
                <div className="text-[13px] font-semibold leading-tight">{it.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{it.desc}</div>
                {it.descSub && (
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5 italic">
                    {it.descSub}
                  </div>
                )}
              </div>
              <div
                className="text-[11px] font-bold font-mono shrink-0 tabular"
                style={{ color: `hsl(${color})` }}
              >
                {it.sub}
              </div>
            </motion.div>
          );
        })}
      </div>
    </TextureCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  SaasJourneyFunnel · funnel completo del viaje SaaS
 *  Combina Meta CAPI (impresiones, clicks, lead, IC, CR, trial, subscribe)
 *  con GA4 (pricing_page_visited, password_created, sign_up, etc).
 *  Etapas sin data se renderizan en gris con "Analytics pendiente".
 * ─────────────────────────────────────────────────────────────────────── */

interface JourneyStepData {
  stage: FunnelStage;
  label: string;
  value: number | null;
  source: "meta" | "ga4" | "both" | "none";
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  isConversion: boolean;
}

const STAGE_ICONS: Record<FunnelStage, React.ComponentType<{ className?: string }>> = {
  impression: Eye,
  click: MousePointerClick,
  pricing_visit: Tag,
  whatsapp: MessageCircle,
  register_intent: CreditCard,
  signup: UserPlus,
  password: KeyRound,
  trial: FlaskConical,
  subscription: Banknote,
};

const STAGE_COLORS: Record<FunnelStage, string> = {
  impression: "var(--brand-violet)",
  click: "var(--brand-cyan)",
  pricing_visit: "var(--info)",
  whatsapp: "var(--brand-lime)",
  register_intent: "var(--brand-cyan)",
  signup: "var(--brand-lime)",
  password: "var(--success)",
  trial: "var(--brand-ember)",
  subscription: "var(--brand-violet)",
};

/** Para cada stage indica cuál es el "paso anterior lógico" para
 *  computar conversión lineal. null = no aplica (rama paralela / info). */
const STAGE_LINEAR_PARENT: Record<FunnelStage, FunnelStage | null> = {
  impression: null,
  click: "impression",
  pricing_visit: null, // parallel info · solo % vs impresiones
  whatsapp: null, // parallel info · solo % vs impresiones
  register_intent: "click",
  signup: "register_intent",
  password: null, // sub-step de signup · solo % vs impresiones
  trial: "signup",
  subscription: "trial",
};

function SaasJourneyFunnel() {
  const { campaigns } = useDashboard();
  const { events: ga4Events, configured: ga4Configured, loading: ga4Loading } =
    useFunnelEvents(28);

  // Totales Meta agregados sobre todas las campañas del rango activo.
  const metaTotals = React.useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    let lead = 0;
    let initiateCheckout = 0;
    let completeReg = 0;
    let startTrial = 0;
    let subscribe = 0;
    for (const c of campaigns) {
      impressions += c.impressions;
      clicks += c.clicks;
      lead += c.evContact;
      initiateCheckout += c.evInitCheckout;
      completeReg += c.evCompleteReg;
      startTrial += c.evStartTrial;
      subscribe += c.evSubscribe;
    }
    return { impressions, clicks, lead, initiateCheckout, completeReg, startTrial, subscribe };
  }, [campaigns]);

  // Construir cada step del journey · prioriza Meta sobre GA4 para CAPI events
  const steps = React.useMemo<JourneyStepData[]>(() => {
    function resolve(stage: FunnelStage): { value: number | null; source: JourneyStepData["source"] } {
      const mapping = FUNNEL_EVENTS.find((e) => e.stage === stage);
      if (!mapping) return { value: null, source: "none" };

      let metaValue: number | null = null;
      if (stage === "impression") metaValue = metaTotals.impressions;
      else if (stage === "click") metaValue = metaTotals.clicks;
      else if (stage === "whatsapp") metaValue = metaTotals.lead;
      else if (stage === "register_intent") metaValue = metaTotals.initiateCheckout;
      else if (stage === "signup") metaValue = metaTotals.completeReg;
      else if (stage === "trial") metaValue = metaTotals.startTrial;
      else if (stage === "subscription") metaValue = metaTotals.subscribe;

      const ga4Value =
        mapping.ga4Event && ga4Configured === true
          ? (ga4Events[mapping.ga4Event] ?? 0)
          : null;

      const metaActive = metaValue !== null && metaValue > 0;
      const ga4Active = ga4Value !== null && ga4Value > 0;

      if (metaActive && ga4Active) {
        return { value: Math.max(metaValue ?? 0, ga4Value ?? 0), source: "both" };
      }
      if (metaActive) return { value: metaValue, source: "meta" };
      if (ga4Active) return { value: ga4Value, source: "ga4" };

      // Sin data positiva · si la etapa solo es GA4 y GA4 está config con 0 eventos · mostrar 0
      if (metaValue !== null) return { value: metaValue, source: "meta" };
      if (mapping.ga4Event && ga4Configured === true) return { value: 0, source: "ga4" };
      return { value: null, source: "none" };
    }

    return FUNNEL_EVENTS.map((mapping) => {
      const { value, source } = resolve(mapping.stage);
      return {
        stage: mapping.stage,
        label: mapping.label,
        value,
        source,
        Icon: STAGE_ICONS[mapping.stage],
        color: STAGE_COLORS[mapping.stage],
        isConversion: mapping.isConversion,
      };
    });
  }, [metaTotals, ga4Events, ga4Configured]);

  // Total de impresiones · base para % global y para ancho de barra.
  const impressionsTotal = metaTotals.impressions || 1;
  // Conversión global signup / impresiones.
  const signupTotal = metaTotals.completeReg;
  const globalConvPct = (signupTotal / impressionsTotal) * 100;

  // Lookup rápido stage → step para el padre lineal.
  const stepByStage = React.useMemo(() => {
    const map = new Map<FunnelStage, JourneyStepData>();
    for (const s of steps) map.set(s.stage, s);
    return map;
  }, [steps]);

  return (
    <TextureCard className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Journey completo · {FUNNEL_EVENTS.length} etapas
          </div>
          <div className="font-mono font-bold text-2xl tabular text-foreground leading-tight mt-1">
            <span className="text-aurora">{fmt.int(metaTotals.impressions)}</span>{" "}
            <span className="text-muted-foreground font-normal text-base">impresiones</span>
            {" → "}
            <span className="text-[hsl(var(--brand-lime))]">
              {fmt.int(signupTotal)}
            </span>{" "}
            <span className="text-muted-foreground font-normal text-base">
              registros · {globalConvPct < 0.01 ? globalConvPct.toFixed(3) : globalConvPct.toFixed(2)}% conv. global
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ga4Loading ? (
            <Badge variant="outline">GA4 cargando…</Badge>
          ) : ga4Configured ? (
            <Badge variant="success">GA4 conectado</Badge>
          ) : (
            <Badge variant="warning">GA4 pendiente</Badge>
          )}
          <Badge variant="violet">Meta CAPI</Badge>
        </div>
      </div>

      {/* Trapecio invertido · cada paso es una fila con barra centrada cuyo
          ancho = % vs impresiones · va angostándose hacia abajo. */}
      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => {
          const isPending = step.value === null;
          const value = step.value ?? 0;
          // Ancho de barra = sqrt(% vs impresiones) para que el embudo
          // no colapse a 0% cuando el valor es muy chico (sigue siendo monótono).
          const pctOfImpressions = (value / impressionsTotal) * 100;
          const widthPct = isPending
            ? 6
            : Math.max(6, Math.min(100, Math.sqrt(pctOfImpressions / 100) * 100));

          // % vs padre lineal (solo cuando aplica).
          const parentStage = STAGE_LINEAR_PARENT[step.stage];
          const parent = parentStage ? stepByStage.get(parentStage) : null;
          const linearConv =
            parent && parent.value !== null && parent.value > 0 && step.value !== null
              ? (step.value / parent.value) * 100
              : null;

          return (
            <motion.div
              key={step.stage}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="grid grid-cols-[200px_1fr_180px] items-center gap-3"
            >
              {/* IZQUIERDA · icon + label + source */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="size-9 shrink-0 grid place-items-center rounded-lg border"
                  style={{
                    background: isPending
                      ? "hsl(var(--muted) / 0.2)"
                      : `hsl(${step.color} / 0.14)`,
                    borderColor: isPending
                      ? "hsl(var(--muted) / 0.3)"
                      : `hsl(${step.color} / 0.4)`,
                    color: isPending ? "hsl(var(--muted-foreground))" : `hsl(${step.color})`,
                  }}
                >
                  <step.Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold leading-tight truncate">
                    {step.label}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {step.isConversion && !isPending && (
                      <Badge variant="lime" className="text-[9px] py-0">
                        conversión
                      </Badge>
                    )}
                    <SourceBadge source={step.source} />
                  </div>
                </div>
              </div>

              {/* CENTRO · barra horizontal del embudo (centrada · se angosta) */}
              <div className="relative h-10 flex items-center justify-center">
                {isPending ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${widthPct}%`, opacity: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                    className="h-7 rounded-md border border-dashed border-border/50 grid place-items-center"
                    style={{ background: "hsl(var(--muted) / 0.15)" }}
                  >
                    <span className="text-[10px] italic text-muted-foreground/70">
                      Analytics pendiente
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                    className="h-8 rounded-md relative overflow-hidden"
                    style={{
                      background: `linear-gradient(90deg, hsl(${step.color} / 0.85), hsl(${step.color} / 0.55), hsl(${step.color} / 0.85))`,
                      boxShadow: `0 0 24px -10px hsl(${step.color} / 0.7), inset 0 1px 0 hsl(${step.color} / 0.6)`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-20 mix-blend-overlay"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.4), transparent 60%)",
                      }}
                    />
                  </motion.div>
                )}
              </div>

              {/* DERECHA · valor + métricas */}
              <div className="text-right shrink-0">
                {isPending ? (
                  <div className="text-[11px] italic text-muted-foreground/60">
                    sin data
                  </div>
                ) : (
                  <>
                    <div
                      className="font-mono font-bold text-[18px] tabular leading-none"
                      style={{ color: `hsl(${step.color})` }}
                    >
                      <AnimatedNumber value={value} format={fmt.int} />
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono mt-1 leading-tight">
                      {linearConv !== null ? (
                        <>
                          <span style={{ color: `hsl(${step.color})` }}>
                            {linearConv.toFixed(linearConv < 1 ? 2 : 1)}%
                          </span>{" "}
                          del paso anterior
                        </>
                      ) : i === 0 ? (
                        "base del embudo"
                      ) : (
                        <>
                          {pctOfImpressions < 0.01
                            ? pctOfImpressions.toFixed(4)
                            : pctOfImpressions.toFixed(2)}
                          % de impresiones
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </TextureCard>
  );
}

function SourceBadge({ source }: { source: JourneyStepData["source"] }) {
  if (source === "none") {
    return (
      <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/50">
        sin fuente
      </span>
    );
  }
  if (source === "both") {
    return (
      <span className="text-[9px] uppercase tracking-[0.1em] text-[hsl(var(--brand-violet))] font-semibold">
        Meta + GA4
      </span>
    );
  }
  if (source === "meta") {
    return (
      <span className="text-[9px] uppercase tracking-[0.1em] text-[hsl(var(--brand-violet))]/80">
        Meta CAPI
      </span>
    );
  }
  return (
    <span className="text-[9px] uppercase tracking-[0.1em] text-[hsl(var(--brand-cyan))]/80">
      GA4
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 *  TrialSubscriptionKpis · KPIs costo por trial / subscription
 *  Combina datos de Meta CAPI (start_trial, subscribe) con GA4
 *  (trial_started, subscription_converted). Muestra estado si no hay data.
 * ─────────────────────────────────────────────────────────────────────── */

function TrialSubscriptionKpis() {
  const { campaigns } = useDashboard();
  const { events: ga4Events, configured: ga4Configured } = useFunnelEvents(28);

  const totals = React.useMemo(() => {
    let spend = 0;
    let metaTrials = 0;
    let metaSubs = 0;
    for (const c of campaigns) {
      spend += c.spend;
      metaTrials += c.evStartTrial;
      metaSubs += c.evSubscribe;
    }
    const ga4Trials =
      ga4Configured === true ? (ga4Events["trial_started"] ?? 0) : 0;
    const ga4Subs =
      ga4Configured === true
        ? (ga4Events["subscription_converted"] ?? 0)
        : 0;
    const trials = Math.max(metaTrials, ga4Trials);
    const subs = Math.max(metaSubs, ga4Subs);
    return {
      spend,
      trials,
      subs,
      cpTrial: trials > 0 ? spend / trials : null,
      cpSub: subs > 0 ? spend / subs : null,
      trialSource:
        metaTrials > 0 && ga4Trials > 0
          ? "Meta + GA4"
          : metaTrials > 0
            ? "Meta CAPI"
            : ga4Trials > 0
              ? "GA4"
              : "sin data",
      subSource:
        metaSubs > 0 && ga4Subs > 0
          ? "Meta + GA4"
          : metaSubs > 0
            ? "Meta CAPI"
            : ga4Subs > 0
              ? "GA4"
              : "sin data",
    };
  }, [campaigns, ga4Events, ga4Configured]);

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <ConversionKpi
        label="Costo por Trial"
        Icon={FlaskConical}
        color="var(--brand-ember)"
        value={totals.cpTrial}
        count={totals.trials}
        countLabel="trials"
        source={totals.trialSource}
        empty="Sin trials registrados aún · necesita evento start_trial (Meta) o trial_started (GA4)"
      />
      <ConversionKpi
        label="Costo por Subscription"
        Icon={Banknote}
        color="var(--brand-violet)"
        value={totals.cpSub}
        count={totals.subs}
        countLabel="suscripciones"
        source={totals.subSource}
        empty="Sin subscriptions registradas aún · necesita evento subscribe (Meta) o subscription_converted (GA4)"
      />
    </div>
  );
}

function ConversionKpi({
  label,
  Icon,
  color,
  value,
  count,
  countLabel,
  source,
  empty,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  value: number | null;
  count: number;
  countLabel: string;
  source: string;
  empty: string;
}) {
  const hasData = value !== null && count > 0;
  return (
    <TextureCard className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="size-10 shrink-0 grid place-items-center rounded-lg border"
          style={{
            background: hasData ? `hsl(${color} / 0.12)` : "hsl(var(--muted) / 0.2)",
            borderColor: hasData ? `hsl(${color} / 0.4)` : "hsl(var(--muted) / 0.3)",
            color: hasData ? `hsl(${color})` : "hsl(var(--muted-foreground))",
          }}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          {hasData ? (
            <>
              <div
                className="font-mono font-bold text-3xl tabular leading-none mt-1"
                style={{ color: `hsl(${color})` }}
              >
                {fmt.eur(value ?? 0)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">
                {fmt.int(count)} {countLabel} ·{" "}
                <span className="text-foreground/80">{source}</span>
              </div>
            </>
          ) : (
            <>
              <div className="font-mono font-bold text-xl tabular leading-tight mt-1 text-muted-foreground/80">
                —
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-1.5 leading-relaxed">
                {empty}
              </p>
            </>
          )}
        </div>
      </div>
    </TextureCard>
  );
}
