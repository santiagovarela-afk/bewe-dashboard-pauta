"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Gauge,
  Pause,
  PlayCircle,
  Activity,
  Eye,
  MousePointerClick,
  ShoppingCart,
  UserCheck,
  Calendar,
  Layers,
  Info,
  AlertTriangle,
  Database,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import {
  computeMetrics,
  realDailySeries,
  crCampaignIds,
  suggestedAction,
  cptVsGroupAvg,
} from "@/lib/selectors";
import { fmt, cptTone } from "@/lib/utils";
import { PLAN } from "@/lib/config";
import { SectionHeader } from "@/components/shared/section-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { Badge } from "@/components/ui/badge";

// Tooltip "?" compatible con el slot `badge` de KpiCard.
// Pasa `children` vacíos al ExplainedMetric → solo renderiza el botón Info.
function KpiHint({ children }: { children: React.ReactNode }) {
  return (
    <ExplainedMetric explanation={children}>
      <span className="sr-only">Información</span>
    </ExplainedMetric>
  );
}

export function TabPerformance() {
  const { campaigns, daysElapsed, dateRange, daily } = useDashboard();
  const m = computeMetrics(campaigns);

  // ── Funnel completo (cross-funnel · mezcla campañas CR e IC) ──────────
  const impressions = m.impressions;
  const clicks = m.clicks;
  const trials = m.totalConvIC; // Initiate Checkout
  const activated = m.totalConvCR; // Complete Registration

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const clickToTrial = clicks > 0 ? (trials / clicks) * 100 : 0;
  const trialToActivated = trials > 0 ? (activated / trials) * 100 : 0;
  const overallCvr = impressions > 0 ? (activated / impressions) * 100 : 0;

  const funnel = [
    { label: "Impresiones", value: impressions, color: "var(--brand-cyan)", Icon: Eye, sub: "Alcance total" },
    { label: "Clicks", value: clicks, color: "var(--brand-violet)", Icon: MousePointerClick, sub: `CTR ${fmt.pct(ctr, 2)}` },
    { label: "IC (campañas IC)", value: trials, color: "var(--brand-ember)", Icon: ShoppingCart, sub: `Conv ${fmt.pct(clickToTrial, 1)}` },
    { label: "CR (campañas CR)", value: activated, color: "var(--brand-lime)", Icon: UserCheck, sub: `Conv ${fmt.pct(trialToActivated, 1)}` },
  ];
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);

  // ── Unit economics (solo CAC · resto requiere integraciones externas) ─
  const cac = m.cptReg ?? 0;

  // Serie diaria real del CAC (spend CR / convCR) para el sparkline
  const crIds = React.useMemo(() => crCampaignIds(campaigns), [campaigns]);
  const cacSeries = React.useMemo(
    () => realDailySeries(daily, dateRange, "cpl", crIds),
    [daily, dateRange, crIds],
  );

  // ── Eficiencia relativa por campaña (CPT vs promedio del grupo · real) ─
  const campaignsWithEfficiency = React.useMemo(() => {
    return campaigns
      .filter((c) => c.cpt !== null && c.flag !== "anomaly")
      .map((c) => {
        const { diffPct, groupAvg } = cptVsGroupAvg(c, campaigns);
        return { ...c, diffPct, groupAvg };
      })
      .sort((a, b) => a.diffPct - b.diffPct); // más negativo = mejor (CPT debajo del grupo)
  }, [campaigns]);

  // ── Decisión rápida: pausar/escalar ───────────────────────────────────
  const toPause = campaigns
    .filter((c) => c.flag === "critical" && c.status === "ACTIVE")
    .slice(0, 3);
  const toScale = campaigns
    .filter((c) => c.flag === null && c.cpt !== null && c.cpt <= PLAN.cpt.target && c.status === "ACTIVE")
    .slice(0, 3);

  return (
    <div className="space-y-7 max-w-[1500px]">
      {/* ─────── INTRO BANNER · qué es Performance ─────── */}
      <Reveal>
        <div
          className="rounded-xl border px-4 py-3.5 flex items-start gap-3"
          style={{
            background: `hsl(var(--brand-violet) / 0.10)`,
            borderColor: `hsl(var(--brand-violet) / 0.40)`,
          }}
        >
          <div
            className="size-9 grid place-items-center rounded-lg shrink-0"
            style={{
              background: `hsl(var(--brand-violet) / 0.16)`,
              border: `1px solid hsl(var(--brand-violet) / 0.40)`,
              color: `hsl(var(--brand-violet))`,
            }}
          >
            <Info className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--brand-violet))] mb-0.5">
              ¿Qué es Performance?
            </div>
            <p className="text-[12px] leading-relaxed text-foreground/85">
              Performance = <strong>vista cross-funnel</strong> · cómo se comporta cada campaña desde
              impresión hasta conversión. <strong>Pacing real vs presupuestado</strong>.
              Recomendaciones automáticas por campaña (pausar / escalar) según unit economics.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ─────── HERO ─────── */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />
          <div className="absolute -top-24 -right-16 w-[420px] h-[420px] bg-[hsl(var(--brand-lime)/0.16)] rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-[380px] h-[380px] bg-[hsl(var(--brand-violet)/0.14)] rounded-full blur-3xl" />

          <div className="relative px-6 md:px-10 py-7 md:py-9 grid md:grid-cols-[1.5fr_1fr] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                <Gauge className="size-3" />
                Performance · funnel + unit economics
              </div>
              <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-4xl leading-[1.05] mb-3">
                Embudo, CAC y <span className="text-aurora">eficiencia.</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-[520px] leading-relaxed">
                Vista para <strong className="text-foreground/90">Performance Lead</strong>: del impression al CR,
                con CAC real desde Meta y decisión rápida pausar/escalar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat label="CR (activados)" value={fmt.int(activated)} sub={`de ${fmt.int(impressions)} impr.`} accent="var(--brand-lime)" />
              <HeroStat label="CVR overall" value={fmt.pct(overallCvr, 3)} sub="impression → CR" accent="var(--brand-cyan)" />
              <HeroStat label="CAC" value={fmt.eur(cac)} sub={`obj. ≤ €${PLAN.cpt.target}`} accent={cptTone(cac) === "success" ? "var(--success)" : "var(--warning)"} />
              <HeroStat label="IC trustables" value={fmt.int(trials)} sub="excluye C3 (anomalía pixel)" accent="var(--brand-ember)" />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─────── FUNNEL EJECUTIVO ─────── */}
      <section>
        <SectionHeader
          title="Funnel ejecutivo · cross-funnel"
          sub="Impresiones → Clicks → IC → CR · agregado de las 6 campañas"
          right={<Badge variant="violet" className="font-mono">CVR {fmt.pct(overallCvr, 3)}</Badge>}
        />
        {/* Nota crítica · este funnel mezcla campañas con objetivos distintos */}
        <div
          className="rounded-lg border px-3 py-2 mb-3 flex items-start gap-2"
          style={{
            background: `hsl(var(--warning) / 0.08)`,
            borderColor: `hsl(var(--warning) / 0.30)`,
          }}
        >
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0 text-[hsl(var(--warning))]" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground/90">Cross-funnel</strong> mezcla campañas CR (C1·C2·C4) e IC (C3·C5·C6) que tienen objetivos
            distintos. Útil como vista agregada, pero el análisis real está separado en{" "}
            <strong className="text-foreground/90">Dashboard → Embudos por tipo de evento</strong>.
          </p>
        </div>
        <TextureCard className="p-6">
          <div className="grid md:grid-cols-4 gap-3 mb-6">
            {funnel.map((step, i) => {
              const widthPct = Math.max(8, (step.value / maxFunnel) * 100);
              const cvr = i === 0 ? null : ((step.value / Math.max(funnel[i - 1].value, 1)) * 100);
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.5 }}
                  className="relative"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="size-7 grid place-items-center rounded-md border"
                      style={{
                        background: `hsl(${step.color} / 0.14)`,
                        borderColor: `hsl(${step.color} / 0.35)`,
                        color: `hsl(${step.color})`,
                      }}
                    >
                      <step.Icon className="size-3.5" />
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{step.label}</div>
                  </div>
                  <div className="font-mono font-bold text-2xl tabular leading-none" style={{ color: `hsl(${step.color})` }}>
                    <AnimatedNumber value={step.value} format={(v) => fmt.int(v)} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{step.sub}</div>
                  <div className="mt-3 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ delay: 0.08 * i + 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, hsl(${step.color}), hsl(${step.color} / 0.4))` }}
                    />
                  </div>
                  {cvr !== null && (
                    <div className="absolute -top-1 right-0 text-[9px] font-mono font-bold text-muted-foreground/70 tabular">
                      {fmt.pct(cvr, 1)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CVR rail */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t border-border/60 pt-4">
            <Activity className="size-3.5 text-[hsl(var(--brand-violet))]" />
            <span className="font-semibold text-foreground/90">CVRs:</span>
            <span>CTR {fmt.pct(ctr, 2)}</span>
            <span className="opacity-40">·</span>
            <span>Click → Trial {fmt.pct(clickToTrial, 1)}</span>
            <span className="opacity-40">·</span>
            <span>Trial → Activated {fmt.pct(trialToActivated, 1)}</span>
            <span className="opacity-40">·</span>
            <span className="font-mono font-semibold">Overall {fmt.pct(overallCvr, 3)}</span>
          </div>
        </TextureCard>
      </section>

      {/* ─────── UNIT ECONOMICS · BANNER GRANDE PENDIENTE INTEGRAR ─────── */}
      <section>
        <SectionHeader
          title="Unit economics"
          sub="Solo CAC es real · LTV, ticket, payback y retention requieren integración externa"
        />
        <Reveal>
          <div
            className="rounded-xl border-2 px-5 py-5 mb-4 flex items-start gap-4"
            style={{
              background: `hsl(var(--warning) / 0.10)`,
              borderColor: `hsl(var(--warning) / 0.50)`,
            }}
          >
            <div
              className="size-12 grid place-items-center rounded-lg shrink-0"
              style={{
                background: `hsl(var(--warning) / 0.20)`,
                border: `1px solid hsl(var(--warning) / 0.45)`,
                color: `hsl(var(--warning))`,
              }}
            >
              <Database className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--warning))]">
                  Unit economics · pendiente integrar
                </div>
                <Badge variant="warning" className="font-mono">PostHog + Stripe/CRM</Badge>
              </div>
              <p className="text-[12px] leading-relaxed text-foreground/90">
                LTV, ticket promedio, payback period y retention requieren conectar{" "}
                <strong>PostHog</strong> (para trials y activación) +{" "}
                <strong>Stripe o CRM</strong> (para ingresos reales y churn). Sin esos datos no es
                honesto mostrar LTV/CAC ni payback. Aquí solo el <strong>CAC real</strong> calculado
                desde Meta (spend ÷ registros completos).
              </p>
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <KpiCard
            label="CAC (cost / reg)"
            value={cac}
            format={(v) => fmt.eur(v)}
            sub={`${activated} reg con ${fmt.eur(m.spend, { decimals: 0 })} · dato real Meta`}
            tone={cptTone(cac) === "success" ? "success" : cptTone(cac) === "warning" ? "warning" : "danger"}
            trend={cacSeries}
            badge={
              <KpiHint>
                <strong>CAC</strong> · Customer Acquisition Cost. Coste real para conseguir 1
                registro completo (spend total CR ÷ CR). Objetivo ≤ €{PLAN.cpt.target}.
              </KpiHint>
            }
            delay={0.02}
          />
          <div
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{
              background: `hsl(var(--muted) / 0.20)`,
              borderColor: `hsl(var(--border))`,
            }}
          >
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground/90">LTV · Payback · Ticket · Activation · Retention</strong>{" "}
              <br />
              No se muestran porque no se pueden calcular sin PostHog (trials) + Stripe/CRM (ingresos).
              Cualquier número aquí sería una estimación · ver banner.
            </div>
          </div>
        </div>
      </section>

      {/* ─────── COHORTS · EMPTY STATE HONESTO ─────── */}
      <section>
        <SectionHeader
          title="Cohortes · trial → activación → retención"
          sub="Sin cohort data · requiere PostHog para ver retention real"
          right={<Badge variant="outline">Sin datos</Badge>}
        />
        <TextureCard className="p-10">
          <div className="flex flex-col items-center justify-center text-center gap-3 max-w-[460px] mx-auto">
            <div
              className="size-14 grid place-items-center rounded-2xl border"
              style={{
                background: `hsl(var(--muted) / 0.30)`,
                borderColor: `hsl(var(--border))`,
                color: `hsl(var(--muted-foreground))`,
              }}
            >
              <Database className="size-6" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold mb-1">Sin cohort data</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Para ver cohortes de retención (semanas 1–4 post-registro) hay que conectar{" "}
                <strong className="text-foreground/90">PostHog</strong> a la web app.
                Una vez integrado, esta tabla muestra cohortes reales con activación W1/W4 y delta vs semana anterior.
              </p>
            </div>
            <Badge variant="warning" className="font-mono">PostHog · pendiente integrar</Badge>
          </div>
        </TextureCard>
      </section>

      {/* ─────── EFICIENCIA RELATIVA · solo datos reales ─────── */}
      <section>
        <SectionHeader
          title="Eficiencia relativa por campaña"
          sub="CPT real de cada campaña vs promedio de su grupo (mismo evento) · dato 100% Meta"
        />
        <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaignsWithEfficiency.map((c) => {
            // diffPct negativo = CPT debajo del promedio = mejor
            const isBetter = c.diffPct < -5;
            const isWorse = c.diffPct > 5;
            const tone = isBetter ? "success" : isWorse ? "danger" : "warning";
            const accent =
              tone === "success" ? "var(--success)" :
              tone === "warning" ? "var(--warning)" :
              "var(--destructive)";
            const label = isBetter ? "Debajo del grupo" : isWorse ? "Sobre el grupo" : "En línea";
            return (
              <StaggerItem key={c.cid}>
                <SpotlightCard spotlightColor={accent} intensity={0.22} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="size-5 grid place-items-center rounded-md font-mono text-[10px] font-bold"
                          style={{
                            background: `hsl(${accent} / 0.14)`,
                            color: `hsl(${accent})`,
                          }}
                        >
                          {c.code}
                        </span>
                        <Badge variant={tone === "success" ? "success" : tone === "warning" ? "warning" : "danger"}>
                          {label}
                        </Badge>
                      </div>
                      <div className="text-[11px] font-semibold truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.geo} · {c.vertical} · evento {c.event === "CompleteRegistration" ? "CR" : "IC"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">vs grupo</div>
                      <div className="font-mono font-bold text-xl tabular leading-none" style={{ color: `hsl(${accent})` }}>
                        <AnimatedNumber
                          value={c.diffPct}
                          format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                          duration={1.2}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-2 border-t border-border/40 mt-2">
                    <div>
                      <div className="text-muted-foreground">CPT</div>
                      <div className="font-mono font-semibold tabular">
                        {c.cpt !== null ? fmt.eur(c.cpt) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Grupo avg</div>
                      <div className="font-mono font-semibold tabular">
                        {c.groupAvg !== null ? fmt.eur(c.groupAvg) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conv</div>
                      <div className="font-mono font-semibold tabular">{fmt.int(c.conversions)}</div>
                    </div>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* ─────── DECISIÓN RÁPIDA: PAUSAR / ESCALAR ─────── */}
      <section className="grid md:grid-cols-2 gap-4">
        <ActionStack
          title="Qué pausar / ajustar"
          subtitle="CPT crítico · flagged"
          Icon={Pause}
          tone="danger"
          campaigns={toPause}
          emptyMsg="Sin campañas en estado crítico — todo dentro del semáforo."
        />
        <ActionStack
          title="Qué escalar"
          subtitle={`CPT ≤ €${PLAN.cpt.target} · sin flags`}
          Icon={PlayCircle}
          tone="success"
          campaigns={toScale}
          emptyMsg="Aún no hay campañas claramente escalables · revisa la tab de Estrategia."
        />
      </section>

      {/* ─────── CONTEXT FOOTER ─────── */}
      <Reveal>
        <TextureCard className="p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="size-9 grid place-items-center rounded-lg border border-border bg-secondary/40">
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Día activo</div>
                <div className="font-mono font-bold text-base tabular">{daysElapsed} / {PLAN.totalDays}</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[hsl(var(--brand-cyan))]" />
              <div className="text-[11px] text-muted-foreground">
                Datos 100% Meta · sin estimaciones ocultas. LTV / payback / retention requieren PostHog + Stripe.
              </div>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="font-mono">
                <Layers className="size-2.5 mr-1" /> Performance Lead view
              </Badge>
            </div>
          </div>
        </TextureCard>
      </Reveal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function HeroStat({
  label,
  value,
  sub,
  accent = "var(--foreground)",
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <TextureCard className="px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</div>
      <div className="font-mono font-bold text-lg tabular leading-none" style={{ color: `hsl(${accent})` }}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
    </TextureCard>
  );
}

function ActionStack({
  title,
  subtitle,
  Icon,
  tone,
  campaigns,
  emptyMsg,
}: {
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "danger";
  campaigns: ReturnType<typeof useDashboard>["campaigns"];
  emptyMsg: string;
}) {
  const accent = tone === "success" ? "var(--success)" : "var(--destructive)";
  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="size-9 grid place-items-center rounded-lg border"
            style={{
              background: `hsl(${accent} / 0.14)`,
              borderColor: `hsl(${accent} / 0.35)`,
              color: `hsl(${accent})`,
            }}
          >
            <Icon className="size-4" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.12em]">{title}</h3>
            <div className="text-[10px] text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <Badge variant={tone === "success" ? "success" : "danger"} className="font-mono">
          {campaigns.length}
        </Badge>
      </div>
      {campaigns.length === 0 ? (
        <div className="text-[12px] text-muted-foreground text-center py-8 leading-relaxed">
          {emptyMsg}
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c, i) => {
            const action = suggestedAction(c);
            return (
              <motion.div
                key={c.cid}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="px-3 py-2.5 rounded-lg border border-border/60 bg-card/60 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="size-5 grid place-items-center rounded font-mono text-[10px] font-bold"
                        style={{
                          background: `hsl(${accent} / 0.14)`,
                          color: `hsl(${accent})`,
                        }}
                      >
                        {c.code}
                      </span>
                      <div className="text-[11px] font-semibold truncate">{c.name}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-4 leading-snug" title={action.detail}>
                      {action.detail}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="font-mono font-bold text-[14px] tabular leading-none"
                      style={{ color: `hsl(${accent})` }}
                    >
                      {c.cpt !== null ? fmt.eur(c.cpt) : "—"}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">CPT</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </TextureCard>
  );
}
