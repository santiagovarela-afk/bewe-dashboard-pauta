"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Sparkles,
  Wallet,
  Target,
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
  dynamicAlerts,
  realDailySeries,
  crCampaignIds,
  icCampaignIds,
  planBStatus,
  type AlertKind,
} from "@/lib/selectors";
import { GLOSSARY } from "@/lib/glossary";
import { SectionHeader } from "@/components/shared/section-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import { Badge } from "@/components/ui/badge";
import { DailySummary } from "@/components/shared/daily-summary";
import { ExplainedMetric } from "@/components/shared/explained-metric";

const ALERT_VARIANTS: Record<
  AlertKind,
  { Icon: React.ComponentType<{ className?: string }>; color: string; badge: "danger" | "warning" | "info" }
> = {
  critical: { Icon: AlertOctagon, color: "var(--destructive)", badge: "danger" },
  warn: { Icon: AlertTriangle, color: "var(--warning)", badge: "warning" },
  info: { Icon: Info, color: "var(--info)", badge: "info" },
};

export function TabDashboard() {
  const { campaigns, daysElapsed, dateRange, daily } = useDashboard();
  const m = computeMetrics(campaigns);
  const ctx = React.useMemo(
    () => describeRange(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to],
  );

  const alerts = React.useMemo(
    () => dynamicAlerts(campaigns, ctx, daysElapsed),
    [campaigns, ctx, daysElapsed],
  );

  // Plan B C2 · derivado en vivo (sin frase hardcoded "Plan B activado")
  const planB = React.useMemo(() => planBStatus(campaigns, daysElapsed), [campaigns, daysElapsed]);
  const c2 = campaigns.find((c) => c.code === "C2");
  const c2CR = c2?.evCompleteReg ?? 0;
  const planBHeroLabel =
    planB.status === "n/a"
      ? "Plan B C2 · sin datos"
      : c2CR >= 20
        ? `Plan B descartado · C2 CR ${c2CR} > 20`
        : daysElapsed >= 7
          ? `Plan B candidato · evaluar switch IC (${c2CR} CR)`
          : `Plan B en watch · día ${daysElapsed}/7 · C2 ${c2CR} CR`;

  // Campañas activas reales (no asumir 6)
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;

  // Series reales por día para los 5 KPIs · vacío = sparkline no se renderiza
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

  const critCount = alerts.filter((a) => a.kind === "critical").length;
  const warnCount = alerts.filter((a) => a.kind === "warn").length;
  const infoCount = alerts.filter((a) => a.kind === "info").length;

  return (
    <div className="space-y-7 max-w-[1500px]">
      {/* CONTEXT BANNERS · aclaraciones cruciales según el rango */}
      {(ctx.includesPreLaunch || ctx.includesPrePixelFix) && (
        <Reveal>
          <div className="space-y-2">
            {ctx.includesPreLaunch && (
              <ContextBanner
                tone="info"
                Icon={Info}
                title="Datos MAY26 arrancan el 12-may"
                desc="El lanzamiento de las 6 campañas nuevas fue el 12 de mayo. Pre-12-may había una marca B2B anterior con presupuesto pequeño que NO cuenta en este reporte."
              />
            )}
            {ctx.includesPrePixelFix && (
              <ContextBanner
                tone="warning"
                Icon={AlertTriangle}
                title="Tracking duplicado hasta 16-may"
                desc="Hasta el 16-may hubo duplicación de eventos (pixel + CAPI). Desde 16-may solo CAPI server-side. Comparaciones cross-período tienen que tener esto en cuenta."
              />
            )}
          </div>
        </Reveal>
      )}

      {/* HERO */}
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
                <span className="text-[hsl(var(--brand-violet))]">{ctx.label}</span>
              </div>
              <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-5xl leading-[1.02] mb-3 text-balance">
                Control de pauta{" "}
                <span className="text-aurora">mayo 2026.</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-[560px] leading-relaxed">
                {campaigns.length} campañas · €{PLAN.budget.toLocaleString("es")} de budget · {planBHeroLabel}.
                Decisiones operativas, alertas y proyección al 31 de mayo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat
                label="Gasto"
                value={m.spend}
                format={(v) => fmt.eur(v, { decimals: 0 })}
                sub={`${Math.round(m.budgetPct)}% del budget`}
              />
              <HeroStat
                label="Leads (CR)"
                value={m.totalConvCR}
                format={(v) => fmt.int(v)}
                sub="objetivo 1.350 al 31/5"
              />
              <HeroStat
                label="Inicio pago"
                value={m.totalConvIC}
                format={(v) => fmt.int(v)}
                sub="excluye C3 (anomalía)"
                tone="cyan"
              />
              <HeroStat
                label="CPL"
                value={m.cptReg ?? 0}
                format={(v) => fmt.eur(v)}
                sub={`obj. ≤ €${PLAN.cpt.target}`}
                tone={cptTone(m.cptReg) === "success" ? "lime" : cptTone(m.cptReg) === "warning" ? "ember" : "danger"}
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ALERTS · dinámicas según rango */}
      <section>
        <SectionHeader
          title={`Señales operativas · ${ctx.label.toLowerCase()}`}
          sub={`${critCount} críticas · ${warnCount} en atención · ${infoCount} informativas`}
        />
        {alerts.length === 0 ? (
          <TextureCard className="p-6 text-center text-[12px] text-muted-foreground">
            Sin señales operativas en {ctx.label.toLowerCase()}.
          </TextureCard>
        ) : (
          <StaggerGroup className="grid md:grid-cols-2 gap-3">
            {alerts.map((a, i) => {
              const v = ALERT_VARIANTS[a.kind];
              return (
                <StaggerItem key={i}>
                  <SpotlightCard
                    spotlightColor={v.color}
                    intensity={0.25}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 grid place-items-center size-9 rounded-lg border"
                        style={{
                          background: `hsl(${v.color} / 0.12)`,
                          borderColor: `hsl(${v.color} / 0.4)`,
                          color: `hsl(${v.color})`,
                        }}
                      >
                        <v.Icon className="size-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-[13px] font-semibold leading-tight">{a.title}</h3>
                          <Badge variant={v.badge} className="shrink-0">
                            {a.kind === "critical" ? "Acción" : a.kind === "warn" ? "Revisar" : "Info"}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{a.desc}</p>
                      </div>
                    </div>
                  </SpotlightCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        )}
      </section>

      {/* KPI ROW · terminología clarificada (CPL / CPIC / CPTrial) */}
      <section>
        <SectionHeader title="Métricas clave" sub="Snapshot agregado de las 6 campañas" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="Gasto total"
            value={m.spend}
            format={(v) => fmt.eur(v, { decimals: 0 })}
            sub={`${Math.round(m.budgetPct)}% · ${fmt.eur(m.remaining, { decimals: 0 })} restante`}
            tone="default"
            trend={spendSeries}
            badge={<Badge variant="outline" className="font-mono">€{PLAN.budget.toLocaleString("es")}</Badge>}
            delay={0.02}
          />
          <KpiCard
            label="CPL"
            value={m.cptReg ?? 0}
            format={(v) => fmt.eur(v)}
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
                <span className="text-[10px]">C1 + C2 + C4 · {m.totalConvCR} CR</span>
              </ExplainedMetric>
            }
            tone={cptTone(m.cptReg) === "success" ? "success" : cptTone(m.cptReg) === "warning" ? "warning" : "danger"}
            trend={cplSeries}
            delay={0.06}
          />
          <KpiCard
            label="CPIC"
            value={m.cptIco ?? 0}
            format={(v) => fmt.eur(v)}
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>{GLOSSARY.ic.term}</strong> · {GLOSSARY.ic.short}
                    <br />
                    Cost per Initiate Checkout · C5 + C6 (C3 excluido por anomalía pixel).
                  </div>
                }
              >
                <span className="text-[10px]">C5 + C6 · {m.totalConvIC} IC</span>
              </ExplainedMetric>
            }
            tone={cptTone(m.cptIco) === "success" ? "lime" : "warning"}
            trend={cpicSeries}
            delay={0.1}
          />
          <KpiCard
            label="CPTrial"
            value={0}
            format={() => "pendiente"}
            sub={
              <ExplainedMetric
                explanation={
                  <div>
                    <strong>CPTrial</strong> · costo por trial activado en app (registro
                    que efectivamente entró a Bewe). Depende de PostHog conectado a la
                    web app — métrica pendiente.
                  </div>
                }
              >
                <span className="text-[10px]">PostHog pendiente</span>
              </ExplainedMetric>
            }
            tone="violet"
            delay={0.14}
          />
          <KpiCard
            label="CTR global"
            value={m.ctr}
            format={(v) => fmt.pct(v)}
            sub="objetivo 1.5 – 2.5 %"
            tone={ctrTone(m.ctr) === "success" ? "success" : ctrTone(m.ctr) === "warning" ? "warning" : "danger"}
            trend={ctrSeries}
            delay={0.18}
          />
          <KpiCard
            label="CPM global"
            value={m.cpm}
            format={(v) => fmt.eur(v)}
            sub="objetivo < €9"
            tone={cpmTone(m.cpm) === "success" ? "cyan" : cpmTone(m.cpm) === "warning" ? "warning" : "danger"}
            trend={cpmSeries}
            delay={0.22}
          />
        </div>
      </section>

      {/* DAILY SUMMARY (resumen del día · cambios vs ayer + highlights/risks + mensaje Julián) */}
      <Reveal>
        <DailySummary />
      </Reveal>

      {/* FUNNELS · CR + IC lado a lado · TRIAL placeholder */}
      <section>
        <SectionHeader
          title="Embudos por tipo de evento"
          sub="CR (adquisición) e IC (pago) se miden por separado · Trial real pendiente de PostHog"
        />
        <div className="grid lg:grid-cols-2 gap-3">
          <FunnelCard kind="CR" />
          <FunnelCard kind="IC" />
        </div>
        <div className="mt-3">
          <TrialPlaceholderCard />
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
        <div className="text-[12px] font-semibold leading-tight" style={{ color: `hsl(${color})` }}>
          {title}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
      </div>
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

function FunnelCard({ kind }: { kind: "CR" | "IC" }) {
  const { campaigns, snapshot } = useDashboard();
  const data = kind === "CR" ? funnelCR(campaigns) : funnelIC(campaigns);
  const isCR = kind === "CR";

  const accent = isCR ? "var(--brand-lime)" : "var(--brand-cyan)";
  const title = isCR ? "Funnel CR · Adquisición" : "Funnel IC · Pago";
  const subtitle = isCR
    ? `C1 · C2 · C4 · objetivo CompleteRegistration`
    : `C3 · C5 · C6 · objetivo InitiateCheckout`;
  const eventLabel = isCR ? "CompleteRegistration" : "InitiateCheckout";
  const costLabel = isCR ? "CPL" : "CPIC";
  const max = Math.max(data.impressions, data.clicks, data.events, 1);

  const steps = [
    { label: "Impresiones", value: data.impressions, Icon: Eye, color: "var(--brand-violet)" },
    { label: "Clicks", value: data.clicks, Icon: MousePointerClick, color: "var(--brand-cyan)" },
    { label: eventLabel, value: data.events, Icon: Target, color: accent },
  ];

  // Fecha del snapshot (live) para mostrar en lugar de "22-may" hardcoded
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
            {title}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
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

      {/* Barras */}
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

      {/* Métricas resumen del funnel */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
        <FunnelStat label="CTR" value={fmt.pct(data.ctr)} tone={ctrTone(data.ctr)} />
        <FunnelStat
          label={costLabel}
          value={data.costPerEvent !== null ? fmt.eur(data.costPerEvent) : "—"}
          tone={cptTone(data.costPerEvent)}
        />
        <FunnelStat
          label="Click → Event"
          value={data.clicks > 0 ? fmt.pct(data.conversionPct) : "—"}
          tone="default"
        />
      </div>
    </TextureCard>
  );
}

function FunnelStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger" | "info" | "violet" | "lime" | "ember" | "cyan";
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
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className={cn("font-mono font-bold text-[15px] tabular leading-tight mt-1", colorMap[tone])}>
        {value}
      </div>
    </div>
  );
}

function TrialPlaceholderCard() {
  return (
    <TextureCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="size-9 grid place-items-center rounded-lg border border-[hsl(var(--brand-violet)/0.4)] bg-[hsl(var(--brand-violet)/0.12)] text-[hsl(var(--brand-violet))]">
          <FlaskConical className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[12px] font-semibold leading-tight">
              Trial real · Lead → Trial activado en app
            </h3>
            <Badge variant="violet" className="shrink-0">PostHog pendiente</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Una vez conectado PostHog vamos a poder medir cuántos de los CompleteRegistration
            realmente activan trial en bewe.ai (no solo registran email). El CPTrial real es
            la métrica clave para validar la calidad de los leads, no solo el volumen.
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
  // Plan B regla "switch evento" descartada: la regla obsoleta ya no se muestra.
  // Mostramos el estado real desde planBStatus + watchpoint CO.
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
      sub: `✓ Día ${daysElapsed}`,
    },
    {
      Icon: Search,
      date: "19 may · día 7",
      title: "Plan B + Watchpoint CO",
      desc: planBDesc,
      status: d7 < 0 ? "past" : d7 <= 1 ? "now" : "future",
      sub: d7 < 0 ? `Hace ${Math.abs(d7)}d` : d7 === 0 ? "¡HOY!" : `En ${d7}d`,
    },
    {
      Icon: Zap,
      date: "26 may · día 14",
      title: "C7 + contingencia",
      desc: "Activar si ≥1k visits + 30 trials",
      descSub: "(visits/trials requieren PostHog · pendiente)",
      status: d14 < 0 ? "past" : d14 <= 1 ? "now" : "future",
      sub: d14 < 0 ? `Hace ${Math.abs(d14)}d` : d14 === 0 ? "¡HOY!" : `En ${d14}d`,
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
                ? "var(--destructive)"
                : it.status === "past"
                  ? "var(--warning)"
                  : "var(--brand-violet)";
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
