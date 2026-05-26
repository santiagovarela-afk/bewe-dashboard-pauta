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
import { HelpGuideTrigger, HELP_DASHBOARD } from "@/components/shared/help-guide";
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Período de análisis
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Cambia la ventana sin re-llamar la API · {ctx.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {detectPeriod(dateRange.from, dateRange.to) === "custom" && (
                <Badge variant="violet" className="font-mono text-[10px]">
                  {dateRange.from} → {dateRange.to}
                </Badge>
              )}
              <HelpGuideTrigger content={HELP_DASHBOARD} />
            </div>
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
          title="Métricas clave del plan"
          sub={`Snapshot agregado · ${PLAN.monthLabel} · día ${monthly.daysElapsed} de ${PLAN.totalDays}`}
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <KpiCard
            label="Gasto total"
            value={monthly.spend}
            format={(v) => fmt.eur(v, { decimals: 0 })}
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>Gasto total del plan</strong>
                    <br />
                    Suma del spend de todas las campañas del plan {PLAN.monthLabel}
                    {" "}desde {PLAN.launchISO.slice(0, 10)} hasta hoy.
                    Independiente del filtro de período de arriba (que solo afecta
                    los números del hero).
                    <br />
                    <br />
                    Target Julián · €{PLAN.budget.toLocaleString("es")} en {PLAN.totalDays} días.
                  </div>
                }
              >
                <span className="text-[10px]">{`${Math.round(monthly.budgetPct)}% del budget · ${fmt.eur(PLAN.budget - monthly.spend, { decimals: 0 })} restante`}</span>
              </ExplainedMetric>
            }
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
            value={monthly.cplCR}
            format={(v) => (monthly.leads === 0 ? "sin leads" : fmt.eur(v))}
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>Costo por Lead (CPL) · acumulado del plan</strong>
                    <br />
                    Spend total dividido por eventos CompleteRegistration de las
                    campañas optimizadas a CR desde {PLAN.launchISO.slice(0, 10)}.
                    <br />
                    <br />
                    <strong>{GLOSSARY.cr.term}</strong> · {GLOSSARY.cr.short}
                    <br />
                    {GLOSSARY.cpt.long}
                  </div>
                }
              >
                <span className="text-[10px]">{monthly.leads} leads · CR campañas</span>
              </ExplainedMetric>
            }
            tone={
              monthly.cplCR === 0
                ? "default"
                : cptTone(monthly.cplCR) === "success"
                  ? "success"
                  : cptTone(monthly.cplCR) === "warning"
                    ? "warning"
                    : "danger"
            }
            trend={cplSeries}
            delay={0.06}
          />
          <KpiCard
            label="Costo por IC"
            value={monthly.cpicIC}
            format={(v) => (monthly.ic === 0 ? "sin IC" : fmt.eur(v))}
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>Costo por Initiate Checkout (CPIC) · acumulado</strong>
                    <br />
                    Spend de campañas IC dividido por sus eventos initiate_checkout
                    desde {PLAN.launchISO.slice(0, 10)}.
                    Excluye MX_SERVICIOS original por anomalía de pixel.
                    <br />
                    <br />
                    <strong>{GLOSSARY.ic.term}</strong> · {GLOSSARY.ic.short}
                  </div>
                }
              >
                <span className="text-[10px]">{monthly.ic} IC · IC campañas</span>
              </ExplainedMetric>
            }
            tone={
              monthly.cpicIC === 0
                ? "default"
                : cptTone(monthly.cpicIC) === "success"
                  ? "lime"
                  : cptTone(monthly.cpicIC) === "warning"
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
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>Click-Through Rate (CTR)</strong>
                    <br />
                    clicks / impresiones × 100 · agregado de todas las campañas.
                    <br />
                    <br />
                    Healthy range · 1.5%-4% (display). Por debajo de 1% indica
                    creativo flojo o targeting mal calibrado.
                  </div>
                }
              >
                <span className="text-[10px]">objetivo 1.5 – 2.5 %</span>
              </ExplainedMetric>
            }
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
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>Costo por mil impresiones (CPM)</strong>
                    <br />
                    spend / impresiones × 1000.
                    <br />
                    <br />
                    Target LATAM · &lt; €9. Si supera €9 indica subasta cara o
                    audiencia muy estrecha. Por debajo de €3 es excelente.
                  </div>
                }
              >
                <span className="text-[10px]">objetivo &lt; €9</span>
              </ExplainedMetric>
            }
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

/** Orden lineal del embudo principal · sólo estas etapas se dibujan
 *  como trapezoides apilados en el SVG. El resto (pricing_visit, whatsapp,
 *  password) son ramas paralelas / sub-pasos · van en la columna detalle. */
const LINEAR_FUNNEL_STAGES: FunnelStage[] = [
  "impression",
  "click",
  "register_intent",
  "signup",
  "trial",
  "subscription",
];

const PARALLEL_BRANCH_STAGES: FunnelStage[] = [
  "pricing_visit",
  "whatsapp",
  "password",
];

function SaasJourneyFunnel() {
  // El funnel SIEMPRE usa rawCampaigns (acumulado del mes) en lugar de
  // campaigns (filtrado por dateRange). Un funnel necesita volumen para
  // que las conversion rates sean significativas · no tiene sentido
  // mostrar "0 conv" cuando el filtro es "Hoy" y aún no llegó la data.
  const { rawCampaigns } = useDashboard();
  const { events: ga4Events, configured: ga4Configured, loading: ga4Loading } =
    useFunnelEvents(28);

  // Totales Meta agregados del MES sobre todas las campañas (raw).
  const metaTotals = React.useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    let lead = 0;
    let initiateCheckout = 0;
    let completeReg = 0;
    let startTrial = 0;
    let subscribe = 0;
    for (const c of rawCampaigns) {
      impressions += c.impressions;
      clicks += c.clicks;
      lead += c.evContact;
      initiateCheckout += c.evInitCheckout;
      completeReg += c.evCompleteReg;
      startTrial += c.evStartTrial;
      subscribe += c.evSubscribe;
    }
    return { impressions, clicks, lead, initiateCheckout, completeReg, startTrial, subscribe };
  }, [rawCampaigns]);

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

  // Steps lineales (los que dibujan el trapecio).
  const linearSteps = React.useMemo<JourneyStepData[]>(() => {
    const arr: JourneyStepData[] = [];
    for (const stage of LINEAR_FUNNEL_STAGES) {
      const s = stepByStage.get(stage);
      if (s) arr.push(s);
    }
    return arr;
  }, [stepByStage]);

  // Geometría del SVG funnel.
  const FUNNEL_WIDTH = 320;
  const STEP_HEIGHT = 64;
  const MIN_WIDTH = 28;
  const FUNNEL_HEIGHT = STEP_HEIGHT * linearSteps.length;

  // Ancho computado por step · sqrt(value / impresiones) * FUNNEL_WIDTH
  // sqrt para que el embudo no colapse a 0 cuando los pasos finales
  // son chiquitos. Se fuerza monótono decreciente (cada step ≤ anterior).
  const stepWidths = React.useMemo<number[]>(() => {
    const widths: number[] = [];
    let prev = FUNNEL_WIDTH;
    linearSteps.forEach((step, i) => {
      let w: number;
      if (i === 0) {
        w = FUNNEL_WIDTH;
      } else if (step.value === null) {
        // Pendiente · usar 60% del anterior para mostrar el "hueco" sin colapsar
        w = Math.max(MIN_WIDTH, prev * 0.6);
      } else {
        const ratio = Math.sqrt((step.value ?? 0) / impressionsTotal);
        w = Math.max(MIN_WIDTH, Math.min(prev, ratio * FUNNEL_WIDTH));
      }
      widths.push(w);
      prev = w;
    });
    return widths;
  }, [linearSteps, impressionsTotal]);

  // Ramas paralelas para la columna detalle.
  const parallelSteps = React.useMemo<JourneyStepData[]>(() => {
    const arr: JourneyStepData[] = [];
    for (const stage of PARALLEL_BRANCH_STAGES) {
      const s = stepByStage.get(stage);
      if (s) arr.push(s);
    }
    return arr;
  }, [stepByStage]);

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

      {!ga4Loading && !ga4Configured && (
        <div
          className="rounded-xl border px-4 py-3 flex items-start gap-3 mb-5"
          style={{
            background: `hsl(var(--warning) / 0.15)`,
            borderColor: `hsl(var(--brand-ember) / 0.45)`,
          }}
        >
          <div
            className="size-9 grid place-items-center rounded-lg shrink-0"
            style={{
              background: `hsl(var(--brand-ember) / 0.18)`,
              border: `1px solid hsl(var(--brand-ember) / 0.45)`,
              color: `hsl(var(--brand-ember))`,
            }}
          >
            <AlertTriangle className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--brand-ember))] mb-0.5">
              GA4 pendiente · admin debe conectar Google
            </div>
            <p className="text-[12px] leading-relaxed text-foreground/85">
              Sin GA4 los pasos del funnel (pricing visit, signup, password, trial, subscription) muestran 0.{" "}
              <a
                href="/api/auth/google/start"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 underline underline-offset-2 text-[hsl(var(--brand-cyan))] hover:opacity-80 font-semibold"
              >
                Conectar ahora
                <ChevronRight className="size-3" />
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Layout · 2 columnas: SVG funnel + detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* ─── COLUMNA IZQ · SVG TRAPEZOIDAL FUNNEL ───────────────────── */}
        <div className="flex flex-col items-center justify-start">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-3 self-start">
            Funnel lineal · 6 etapas principales
          </div>
          <svg
            viewBox={`0 0 ${FUNNEL_WIDTH} ${FUNNEL_HEIGHT}`}
            width="100%"
            style={{ maxWidth: FUNNEL_WIDTH + 60 }}
            className="overflow-visible"
            aria-label="Funnel de conversión visual"
          >
            <defs>
              {linearSteps.map((step) => (
                <linearGradient
                  key={`grad-${step.stage}`}
                  id={`funnel-grad-${step.stage}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={`hsl(${step.color} / 0.35)`} />
                  <stop offset="50%" stopColor={`hsl(${step.color} / 0.85)`} />
                  <stop offset="100%" stopColor={`hsl(${step.color} / 0.35)`} />
                </linearGradient>
              ))}
              <pattern
                id="funnel-pending-pattern"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="6"
                  stroke="hsl(var(--brand-ember) / 0.55)"
                  strokeWidth="1.4"
                />
              </pattern>
            </defs>

            {linearSteps.map((step, i) => {
              const topW = i === 0 ? FUNNEL_WIDTH : stepWidths[i - 1] ?? FUNNEL_WIDTH;
              const botW = stepWidths[i] ?? MIN_WIDTH;
              const y0 = i * STEP_HEIGHT;
              const y1 = (i + 1) * STEP_HEIGHT;
              const xTopL = (FUNNEL_WIDTH - topW) / 2;
              const xTopR = (FUNNEL_WIDTH + topW) / 2;
              const xBotL = (FUNNEL_WIDTH - botW) / 2;
              const xBotR = (FUNNEL_WIDTH + botW) / 2;
              const path = `M ${xTopL} ${y0} L ${xTopR} ${y0} L ${xBotR} ${y1} L ${xBotL} ${y1} Z`;
              const isPending = step.value === null;
              const cx = FUNNEL_WIDTH / 2;
              const cy = y0 + STEP_HEIGHT / 2;

              // % vs padre lineal para el subtítulo del trapezoide
              const parentStage = STAGE_LINEAR_PARENT[step.stage];
              const parent = parentStage ? stepByStage.get(parentStage) : null;
              const linearConv =
                parent && parent.value !== null && parent.value > 0 && step.value !== null
                  ? (step.value / parent.value) * 100
                  : null;

              return (
                <motion.g
                  key={step.stage}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* trapezoide base · gradient o pattern dashed si pendiente */}
                  <path
                    d={path}
                    fill={
                      isPending
                        ? "url(#funnel-pending-pattern)"
                        : `url(#funnel-grad-${step.stage})`
                    }
                    stroke={
                      isPending
                        ? "hsl(var(--brand-ember) / 0.7)"
                        : `hsl(${step.color} / 0.85)`
                    }
                    strokeWidth={isPending ? 1.2 : 1}
                    strokeDasharray={isPending ? "4 3" : undefined}
                    style={{
                      filter: isPending
                        ? "none"
                        : `drop-shadow(0 4px 14px hsl(${step.color} / 0.25))`,
                    }}
                  />

                  {/* línea interna sutil para definir el separador entre steps */}
                  {i < linearSteps.length - 1 && (
                    <line
                      x1={xBotL}
                      y1={y1}
                      x2={xBotR}
                      y2={y1}
                      stroke="hsl(var(--background) / 0.6)"
                      strokeWidth="0.6"
                    />
                  )}

                  {/* Label del valor · centrado dentro del trapezoide */}
                  <text
                    x={cx}
                    y={cy - 4}
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--font-mono, ui-monospace)",
                      fontWeight: 700,
                      fontSize: botW > 90 ? 16 : botW > 50 ? 13 : 11,
                      fill: isPending
                        ? "hsl(var(--muted-foreground))"
                        : "hsl(var(--foreground))",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {isPending ? "—" : fmt.int(step.value ?? 0)}
                  </text>
                  <text
                    x={cx}
                    y={cy + 11}
                    textAnchor="middle"
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-mono, ui-monospace)",
                      fill: "hsl(var(--muted-foreground))",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {isPending
                      ? "pendiente"
                      : linearConv !== null
                        ? `${linearConv.toFixed(linearConv < 1 ? 2 : 1)}% step anterior`
                        : "base"}
                  </text>

                  {/* Label lateral con el nombre del step · a la derecha */}
                  <line
                    x1={xBotR + 4}
                    y1={cy}
                    x2={FUNNEL_WIDTH + 14}
                    y2={cy}
                    stroke={
                      isPending
                        ? "hsl(var(--muted) / 0.5)"
                        : `hsl(${step.color} / 0.5)`
                    }
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={FUNNEL_WIDTH + 18}
                    y={cy + 3}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fill: isPending
                        ? "hsl(var(--muted-foreground))"
                        : `hsl(${step.color})`,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {step.label}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* ─── COLUMNA DER · DETALLE POR ETAPA ───────────────────────── */}
        <div className="flex flex-col min-w-0">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
            Detalle por etapa
          </div>

          <div className="flex flex-col rounded-lg border border-border/40 overflow-hidden">
            {linearSteps.map((step, i) => (
              <FunnelStepRow
                key={step.stage}
                step={step}
                index={i}
                impressionsTotal={impressionsTotal}
                stepByStage={stepByStage}
              />
            ))}
          </div>

          {parallelSteps.length > 0 && (
            <>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-5 mb-3 flex items-center gap-2">
                <span>Ramas paralelas</span>
                <span className="text-muted-foreground/50 normal-case tracking-normal text-[10px]">
                  (no parte del flujo lineal)
                </span>
              </div>
              <div className="flex flex-col rounded-lg border border-border/40 border-dashed overflow-hidden">
                {parallelSteps.map((step, i) => (
                  <FunnelStepRow
                    key={step.stage}
                    step={step}
                    index={i + linearSteps.length}
                    impressionsTotal={impressionsTotal}
                    stepByStage={stepByStage}
                    isParallel
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </TextureCard>
  );
}

/** Una fila del detalle por etapa · usada por el embudo y por las ramas paralelas. */
function FunnelStepRow({
  step,
  index,
  impressionsTotal,
  stepByStage,
  isParallel = false,
}: {
  step: JourneyStepData;
  index: number;
  impressionsTotal: number;
  stepByStage: Map<FunnelStage, JourneyStepData>;
  isParallel?: boolean;
}) {
  const isPending = step.value === null;
  const value = step.value ?? 0;
  const pctOfImpressions = (value / impressionsTotal) * 100;
  const parentStage = STAGE_LINEAR_PARENT[step.stage];
  const parent = parentStage ? stepByStage.get(parentStage) : null;
  const linearConv =
    parent && parent.value !== null && parent.value > 0 && step.value !== null
      ? (step.value / parent.value) * 100
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="flex items-center gap-3 px-3 py-2.5 border-b border-border/30 last:border-b-0"
      style={{
        background: isPending
          ? "hsl(var(--muted) / 0.05)"
          : "transparent",
      }}
    >
      {/* dot color del step */}
      <div
        className="size-2 rounded-full shrink-0"
        style={{
          background: isPending
            ? "hsl(var(--muted-foreground) / 0.4)"
            : `hsl(${step.color})`,
          boxShadow: isPending ? "none" : `0 0 8px hsl(${step.color} / 0.6)`,
        }}
      />

      {/* icon */}
      <div
        className="size-8 shrink-0 grid place-items-center rounded-md border"
        style={{
          background: isPending
            ? "hsl(var(--muted) / 0.15)"
            : `hsl(${step.color} / 0.12)`,
          borderColor: isPending
            ? "hsl(var(--muted) / 0.25)"
            : `hsl(${step.color} / 0.35)`,
          color: isPending ? "hsl(var(--muted-foreground))" : `hsl(${step.color})`,
        }}
      >
        <step.Icon className="size-3.5" />
      </div>

      {/* Label + subtext */}
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold leading-tight truncate flex items-center gap-1.5">
          {step.label}
          {step.isConversion && !isPending && (
            <Badge variant="lime" className="text-[8px] py-0 px-1.5">
              conv
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <SourceBadge source={step.source} />
          {!isPending && (
            <span className="text-[9px] text-muted-foreground font-mono">
              {linearConv !== null ? (
                <>
                  <span style={{ color: `hsl(${step.color})` }}>
                    {linearConv.toFixed(linearConv < 1 ? 2 : 1)}%
                  </span>{" "}
                  vs paso anterior
                </>
              ) : index === 0 ? (
                "base del embudo"
              ) : (
                <>
                  {pctOfImpressions < 0.01
                    ? pctOfImpressions.toFixed(4)
                    : pctOfImpressions.toFixed(2)}
                  % de impresiones
                  {isParallel ? " · rama" : ""}
                </>
              )}
            </span>
          )}
          {isPending && (
            <span className="text-[9px] italic text-muted-foreground/70">
              Analytics pendiente · cargar GA4_PROPERTY_ID
            </span>
          )}
        </div>
      </div>

      {/* Valor */}
      <div className="text-right shrink-0">
        {isPending ? (
          <div className="font-mono text-[16px] text-muted-foreground/60 leading-none">
            —
          </div>
        ) : (
          <div
            className="font-mono font-bold text-[18px] tabular leading-none"
            style={{ color: `hsl(${step.color})` }}
          >
            <AnimatedNumber value={value} format={fmt.int} />
          </div>
        )}
      </div>
    </motion.div>
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
