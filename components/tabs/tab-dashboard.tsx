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
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
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
import type { Campaign } from "@/lib/types";

/** Plan B CID · MX_SERVICIOS_WEB_MAY26_CONVERSION (reemplazó al pixel-anómalo). */
const PLAN_B_CID = "52567055064286";
/** C3 con pixel roto · excluida de IC. */
const ANOMALY_CID = "52551556895286";

type AttentionTone = "danger" | "warning" | "info";

interface AttentionItem {
  cid: string;
  /** Nombre legible (display name). */
  name: string;
  /** Mensaje concreto con valor actual. */
  reason: string;
  /** Valor numérico/string para la chip a la derecha. */
  value: string;
  tone: AttentionTone;
  Icon: React.ComponentType<{ className?: string }>;
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

function buildAttentionItems(
  campaigns: Campaign[],
  deltas: Map<string, CampaignDelta>,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  // Solo campañas activas · no alertamos sobre pausadas.
  const active = campaigns.filter((c) => isActive(c.cid) || c.status === "ACTIVE");

  for (const c of active) {
    const name = getDisplayName(c.name);

    // 1. CPL drift +25% vs semana pasada
    const d = deltas.get(c.cid);
    if (
      d?.cplChangePct !== null &&
      d?.cplChangePct !== undefined &&
      d.cplChangePct > 25 &&
      d.cpl7d !== null
    ) {
      items.push({
        cid: c.cid,
        name,
        reason: `CPL subió ${Math.round(d.cplChangePct)}% vs sem pasada`,
        value: fmt.eur(d.cpl7d),
        tone: d.cplChangePct > 60 ? "danger" : "warning",
        Icon: AlertTriangle,
      });
    }

    // 2. Frecuencia > 2.5
    if (c.freq > 2.5) {
      items.push({
        cid: c.cid,
        name,
        reason: "Frecuencia alta · audiencia cansada",
        value: `${c.freq.toFixed(2)}x`,
        tone: c.freq > 3.5 ? "danger" : "warning",
        Icon: Activity,
      });
    }

    // 3. Mucha impresión sin CR
    if (c.impressions > 10_000 && c.evCompleteReg < 5) {
      items.push({
        cid: c.cid,
        name,
        reason: "Mucha impresión sin convertir · revisar creativo",
        value: `${fmt.int(c.impressions)} imp · ${c.evCompleteReg} CR`,
        tone: "warning",
        Icon: Eye,
      });
    }

    // 4. CPM alto > €5
    if (c.cpm > 5) {
      items.push({
        cid: c.cid,
        name,
        reason: "CPM alto · costo de impresión sobre target",
        value: fmt.eur(c.cpm),
        tone: c.cpm > 9 ? "danger" : "warning",
        Icon: Wallet,
      });
    }
  }

  return items;
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

  // Métricas del día de HOY · siempre, independientes del rango activo.
  const todayMetrics = React.useMemo(() => {
    const today = isoToday();
    let spend = 0;
    let evCR = 0;
    let evIC = 0;
    let impressions = 0;
    let clicks = 0;
    for (const row of daily) {
      if (row.adsetId) continue;
      if (row.date !== today) continue;
      spend += row.spend;
      evCR += row.evCompleteReg;
      if (row.campaignId !== ANOMALY_CID) {
        evIC += row.evInitCheckout;
      }
      impressions += row.impressions;
      clicks += row.clicks;
    }
    const cpl = evCR > 0 ? spend / evCR : null;
    return { spend, evCR, evIC, impressions, clicks, cpl };
  }, [daily]);

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
                  Hoy · {new Date().toLocaleDateString("es", { day: "numeric", month: "short" })}
                </div>
                <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-5xl leading-[1.02] text-balance">
                  <span className="text-aurora">{fmt.eur(todayMetrics.spend, { decimals: 0 })}</span>{" "}
                  gastados ·{" "}
                  <span className="text-[hsl(var(--brand-lime))]">{todayMetrics.evCR}</span>{" "}
                  lead{todayMetrics.evCR === 1 ? "" : "s"}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:text-base text-muted-foreground">
                <span className="text-foreground/80 font-semibold">Mes:</span>
                <span>
                  <span className="font-mono text-foreground">
                    {fmt.eur(m.spend, { decimals: 0 })}
                  </span>{" "}
                  / €{PLAN.budget.toLocaleString("es")}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  <span className="font-mono text-foreground">{m.totalConvCR}</span> leads totales
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  CPL{" "}
                  <span className="font-mono text-foreground">
                    {m.cptReg === null ? "—" : fmt.eur(m.cptReg)}
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat
                label="Hoy · Gasto"
                value={todayMetrics.spend}
                format={(v) => fmt.eur(v, { decimals: 0 })}
                sub={`${
                  m.spend > 0 ? Math.round((todayMetrics.spend / m.spend) * 100) : 0
                }% del mes`}
                tone="lime"
              />
              <HeroStat
                label="Hoy · Leads"
                value={todayMetrics.evCR}
                format={(v) => fmt.int(v)}
                sub={`mes ${m.totalConvCR} · objetivo 1.350`}
              />
              <HeroStat
                label="Hoy · CPL"
                value={todayMetrics.cpl ?? 0}
                format={(v) => (todayMetrics.cpl === null ? "sin leads" : fmt.eur(v))}
                sub={`mes ${m.cptReg === null ? "—" : fmt.eur(m.cptReg)} · obj. ≤ €${PLAN.cpt.target}`}
                tone="cyan"
              />
              <HeroStat
                label="Hoy · IC"
                value={todayMetrics.evIC}
                format={(v) => fmt.int(v)}
                sub={`mes ${m.totalConvIC} · excluye anomalía`}
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
                    <strong>{GLOSSARY.ic.term}</strong> · {GLOSSARY.ic.short}
                    <br />
                    Cost per Initiate Checkout · excluye C3 (anomalía pixel).
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

      {/* FUNNEL CR · GRANDE · clickeable */}
      <section>
        <SectionHeader
          title="Embudo Completar Registro · adquisición"
          sub="Impresiones → Clicks → Landing → Lead · clickea cada paso para ver detalle por campaña"
        />
        <BigFunnelCR />
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
          <item.Icon className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-[13px] font-semibold leading-tight">{item.name}</h3>
            <span
              className="shrink-0 font-mono text-[11px] font-bold tabular px-2 py-0.5 rounded-md"
              style={{ background: `hsl(${color} / 0.12)`, color: `hsl(${color})` }}
            >
              {item.value}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{item.reason}</p>
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
          const heightPct = Math.max(8, (s.value / max) * 100);
          const isSelected = selectedStep === s.id;
          const conv = stepConv[i];
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
              {i > 0 && conv !== null && (
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
                  className="w-[70%] rounded-t-lg"
                  style={{
                    background: `linear-gradient(180deg, hsl(${s.color} / 0.9), hsl(${s.color} / 0.25))`,
                    boxShadow: `0 0 24px -8px hsl(${s.color} / 0.55), inset 0 1px 0 hsl(${s.color})`,
                  }}
                />
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
