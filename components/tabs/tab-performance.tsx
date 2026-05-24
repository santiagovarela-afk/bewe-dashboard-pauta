"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Pause,
  PlayCircle,
  Activity,
  Eye,
  MousePointerClick,
  ShoppingCart,
  UserCheck,
  Users,
  Coins,
  Calendar,
  Layers,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { computeMetrics, fakeTrend, suggestedAction } from "@/lib/selectors";
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

// Constantes de modelo de unit economics (placeholders honestos)
const TICKET_EST = 60;          // € · ticket promedio estimado
const LTV_EST = 180;            // € · LTV estimado (3 mes prom)
const PAYBACK_MONTHS = 4;       // meses · payback period
const ACTIVATION_RATE = 0.62;   // 62% · trial → activated week1
const RETENTION_W1 = 0.78;      // 78% · retención semana 1
const RETENTION_W4 = 0.46;      // 46% · retención mes 1

export function TabPerformance() {
  const { campaigns, daysElapsed } = useDashboard();
  const m = computeMetrics(campaigns);

  // ── Funnel completo ───────────────────────────────────────────────────
  const impressions = m.impressions;
  const clicks = m.clicks;
  const trials = m.totalConvIC; // Initiate Checkout = trial start
  const activated = m.totalConvCR; // Complete Registration = activación

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const clickToTrial = clicks > 0 ? (trials / clicks) * 100 : 0;
  const trialToActivated = trials > 0 ? (activated / trials) * 100 : 0;
  const overallCvr = impressions > 0 ? (activated / impressions) * 100 : 0;

  const funnel = [
    { label: "Impresiones", value: impressions, color: "var(--brand-cyan)", Icon: Eye, sub: "Alcance total" },
    { label: "Clicks", value: clicks, color: "var(--brand-violet)", Icon: MousePointerClick, sub: `CTR ${fmt.pct(ctr, 2)}` },
    { label: "Trials", value: trials, color: "var(--brand-ember)", Icon: ShoppingCart, sub: `CVR ${fmt.pct(clickToTrial, 1)}` },
    { label: "Activados", value: activated, color: "var(--brand-lime)", Icon: UserCheck, sub: `CVR ${fmt.pct(trialToActivated, 1)}` },
  ];
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);

  // ── Unit economics ────────────────────────────────────────────────────
  const cac = m.cptReg ?? 0;
  const ltvCacRatio = cac > 0 ? LTV_EST / cac : 0;
  const ltvCacTone = ltvCacRatio >= 3 ? "success" : ltvCacRatio >= 2 ? "warning" : "danger";

  // ── ROAS por campaña (revenue estimado = activated × LTV/3 ≈ ticket inicial) ─
  const campaignsWithRoas = campaigns
    .map((c) => {
      const conv = c.conversions;
      const revenue = conv * TICKET_EST;
      const roas = c.spend > 0 ? revenue / c.spend : 0;
      return { ...c, revenue, roas };
    })
    .sort((a, b) => b.roas - a.roas);

  // ── Decisión rápida: pausar/escalar ───────────────────────────────────
  const toPause = campaigns
    .filter((c) => c.flag === "critical" && c.status === "ACTIVE")
    .slice(0, 3);
  const toScale = campaigns
    .filter((c) => c.flag === null && c.cpt !== null && c.cpt <= PLAN.cpt.target && c.status === "ACTIVE")
    .slice(0, 3);

  return (
    <div className="space-y-7 max-w-[1500px]">
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
                Embudo, CAC, LTV y <span className="text-aurora">ROAS.</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-[520px] leading-relaxed">
                Vista para <strong className="text-foreground/90">Performance Lead</strong>: del impression al activated,
                con economía por canal y decisión rápida pausar/escalar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat label="Activados" value={fmt.int(activated)} sub={`de ${fmt.int(impressions)} impr.`} accent="var(--brand-lime)" />
              <HeroStat label="CVR overall" value={fmt.pct(overallCvr, 3)} sub="impression → activated" accent="var(--brand-cyan)" />
              <HeroStat label="CAC" value={fmt.eur(cac)} sub={`obj. ≤ €${PLAN.cpt.target}`} accent={cptTone(cac) === "success" ? "var(--success)" : "var(--warning)"} />
              <HeroStat label="LTV/CAC" value={`${ltvCacRatio.toFixed(1)}x`} sub="≥3x es sano" accent="var(--brand-violet)" />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─────── FUNNEL EJECUTIVO ─────── */}
      <section>
        <SectionHeader
          title="Funnel ejecutivo"
          sub="Impresiones → Clicks → Trials → Activados · agregado de las 6 campañas"
          right={<Badge variant="violet" className="font-mono">CVR {fmt.pct(overallCvr, 3)}</Badge>}
        />
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

      {/* ─────── UNIT ECONOMICS ─────── */}
      <section>
        <SectionHeader
          title="Unit economics"
          sub="CAC real · LTV/Payback estimados (placeholder)"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="CAC (cost / reg)"
            value={cac}
            format={(v) => fmt.eur(v)}
            sub={`${activated} reg con ${fmt.eur(m.spend, { decimals: 0 })}`}
            tone={cptTone(cac) === "success" ? "success" : cptTone(cac) === "warning" ? "warning" : "danger"}
            trend={fakeTrend(41, cac)}
            badge={<Badge variant="outline" className="font-mono">obj €{PLAN.cpt.target}</Badge>}
            delay={0.02}
          />
          <KpiCard
            label="LTV estimado"
            value={LTV_EST}
            format={(v) => fmt.eur(v, { decimals: 0 })}
            sub="3 meses prom · ticket €60"
            tone="violet"
            trend={fakeTrend(42, LTV_EST)}
            delay={0.06}
          />
          <KpiCard
            label="LTV / CAC"
            value={ltvCacRatio}
            format={(v) => `${v.toFixed(1)}x`}
            sub={ltvCacRatio >= 3 ? "Sano · escalar" : ltvCacRatio >= 2 ? "Aceptable" : "Riesgo unit economic"}
            tone={ltvCacTone}
            trend={fakeTrend(43, ltvCacRatio)}
            delay={0.1}
          />
          <KpiCard
            label="Payback"
            value={PAYBACK_MONTHS}
            format={(v) => `${v.toFixed(1)}m`}
            sub="meses para recuperar CAC"
            tone="cyan"
            trend={fakeTrend(44, PAYBACK_MONTHS)}
            delay={0.14}
          />
        </div>
      </section>

      {/* ─────── COHORTS PLACEHOLDER ─────── */}
      <section>
        <SectionHeader
          title="Cohortes · trial → activación → retención"
          sub="Placeholder honesto · pendiente integrar product analytics (Mixpanel/Amplitude)"
          right={<Badge variant="warning">Demo</Badge>}
        />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Cohorte</th>
                  <th className="text-right px-4 py-3 font-semibold">Trials</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    <ExplainedMetric explanation="% que completa registro la primera semana">
                      <span>Activación W1</span>
                    </ExplainedMetric>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Retención W1</th>
                  <th className="text-right px-4 py-3 font-semibold">Retención W4</th>
                  <th className="text-right px-4 py-3 font-semibold">Δ vs anterior</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Sem 18 · 28 abr", trials: 92, act: 0.58, w1: 0.74, w4: 0.41, delta: -2 },
                  { label: "Sem 19 · 05 may", trials: 124, act: 0.62, w1: 0.78, w4: 0.46, delta: +4 },
                  { label: "Sem 20 · 12 may", trials: 168, act: 0.65, w1: 0.81, w4: null, delta: +3 },
                  { label: "Sem 21 · 19 may", trials: 142, act: 0.61, w1: null, w4: null, delta: -4 },
                  { label: "En curso · 22 may", trials: 38, act: null, w1: null, w4: null, delta: null },
                ].map((row, i) => (
                  <motion.tr
                    key={row.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i }}
                    className="border-b border-border/40 last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-right font-mono tabular">{fmt.int(row.trials)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {row.act !== null ? <span className={row.act >= ACTIVATION_RATE ? "text-[hsl(var(--success))]" : "text-foreground"}>{fmt.pct(row.act * 100, 0)}</span> : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {row.w1 !== null ? fmt.pct(row.w1 * 100, 0) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {row.w4 !== null ? fmt.pct(row.w4 * 100, 0) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.delta !== null ? (
                        <span className={`inline-flex items-center gap-0.5 font-mono tabular text-[11px] ${row.delta > 0 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"}`}>
                          {row.delta > 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                          {Math.abs(row.delta)}pp
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* ─────── ROAS POR CAMPAÑA ─────── */}
      <section>
        <SectionHeader
          title="ROAS por campaña"
          sub={`Revenue estimado = conversiones × ticket €${TICKET_EST} · ROAS = revenue / spend`}
        />
        <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaignsWithRoas.map((c, i) => {
            const tone = c.roas >= 1.5 ? "success" : c.roas >= 1 ? "warning" : "danger";
            const accent =
              tone === "success" ? "var(--success)" :
              tone === "warning" ? "var(--warning)" :
              "var(--destructive)";
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
                          {tone === "success" ? "Profitable" : tone === "warning" ? "Break-even" : "Negative"}
                        </Badge>
                      </div>
                      <div className="text-[11px] font-semibold truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.geo} · {c.vertical}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">ROAS</div>
                      <div className="font-mono font-bold text-xl tabular leading-none" style={{ color: `hsl(${accent})` }}>
                        <AnimatedNumber value={c.roas} format={(v) => `${v.toFixed(2)}x`} duration={1.2} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-2 border-t border-border/40 mt-2">
                    <div>
                      <div className="text-muted-foreground">Spend</div>
                      <div className="font-mono font-semibold tabular">{fmt.eur(c.spend, { decimals: 0 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rev. est.</div>
                      <div className="font-mono font-semibold tabular">{fmt.eur(c.revenue, { decimals: 0 })}</div>
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
              <Coins className="size-4 text-[hsl(var(--brand-ember))]" />
              <div className="text-[11px] text-muted-foreground">
                Modelo: ticket <span className="font-mono text-foreground/90">€{TICKET_EST}</span> ·
                LTV <span className="font-mono text-foreground/90">€{LTV_EST}</span> ·
                payback <span className="font-mono text-foreground/90">{PAYBACK_MONTHS}m</span>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[hsl(var(--brand-cyan))]" />
              <div className="text-[11px] text-muted-foreground">
                Activación W1 <span className="font-mono text-foreground/90">{Math.round(ACTIVATION_RATE * 100)}%</span> ·
                Ret W1 <span className="font-mono text-foreground/90">{Math.round(RETENTION_W1 * 100)}%</span> ·
                Ret W4 <span className="font-mono text-foreground/90">{Math.round(RETENTION_W4 * 100)}%</span>
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
