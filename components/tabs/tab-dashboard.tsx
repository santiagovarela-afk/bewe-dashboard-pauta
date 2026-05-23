"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Sparkles,
  TrendingUp,
  Wallet,
  Target,
  Activity,
  Calendar,
  Rocket,
  Search,
  Zap,
  BarChart3,
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
import { computeMetrics, fakeTrend } from "@/lib/selectors";
import { SectionHeader } from "@/components/shared/section-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import { Badge } from "@/components/ui/badge";
import { DailySummary } from "@/components/shared/daily-summary";

const ALERT_VARIANTS = {
  critical: { Icon: AlertOctagon, color: "var(--destructive)", badge: "danger" as const },
  warn:     { Icon: AlertTriangle, color: "var(--warning)",     badge: "warning" as const },
  info:     { Icon: Info,           color: "var(--info)",        badge: "info" as const },
};

export function TabDashboard() {
  const { campaigns, daysElapsed } = useDashboard();
  const m = computeMetrics(campaigns);

  const c1 = campaigns.find((c) => c.code === "C1");
  const c2 = campaigns.find((c) => c.code === "C2");

  const alerts: Array<{
    kind: keyof typeof ALERT_VARIANTS;
    title: string;
    desc: React.ReactNode;
  }> = [
    {
      kind: "critical",
      title: `C2 MX_COMERCIO — CPT €${c2?.cpt?.toFixed(2)} crítico`,
      desc: (
        <>
          {c2?.evCompleteReg} CompleteRegistration con €{c2?.spend.toFixed(2)} gastados.
          Plan B (switch a InitiateCheckout) ya debió activarse — revisar adsets A2.1/A2.2 con 0 conv.
        </>
      ),
    },
    {
      kind: "critical",
      title: `C1 MX_BELLEZA — CPT €${c1?.cpt?.toFixed(2)} cruzó umbral crítico`,
      desc: `A1.3_INT_BELLEZA acumula gran parte del gasto sin conversiones. Reasignar budget hacia A1.1_LOK o pausar.`,
    },
    {
      kind: "warn",
      title: "C3 MX_SERVICIOS — Anomalía pixel confirmada",
      desc: "InitiateCheckout dispara en page load. Excluida del CPT global. No pausar — genera señal de volumen.",
    },
    {
      kind: "info",
      title: `Día ${daysElapsed} — Reasignación libre disponible (≤20%)`,
      desc: `C5 (CPT €${campaigns.find((c) => c.code === "C5")?.cpt?.toFixed(2)}) y C6 (CPT €${campaigns.find((c) => c.code === "C6")?.cpt?.toFixed(2)}) están en objetivo. Mover budget de C2 sin requerir aprobación.`,
    },
  ];

  return (
    <div className="space-y-7 max-w-[1500px]">
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
              </div>
              <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-5xl leading-[1.02] mb-3 text-balance">
                Control de pauta{" "}
                <span className="text-aurora">mayo 2026.</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-[560px] leading-relaxed">
                6 campañas · €{PLAN.budget.toLocaleString("es")} de budget · Plan B activado en C2.
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
                label="Registros"
                value={m.totalConvCR}
                format={(v) => fmt.int(v)}
                sub={`obj. 1.350 al 31/5`}
              />
              <HeroStat
                label="Inicio pago"
                value={m.totalConvIC}
                format={(v) => fmt.int(v)}
                sub="excluye C3"
                tone="cyan"
              />
              <HeroStat
                label="CPT registro"
                value={m.cptReg ?? 0}
                format={(v) => fmt.eur(v)}
                sub={`obj. ≤ €${PLAN.cpt.target}`}
                tone={cptTone(m.cptReg) === "success" ? "lime" : cptTone(m.cptReg) === "warning" ? "ember" : "danger"}
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ALERTS */}
      <section>
        <SectionHeader
          title="Señales operativas"
          sub={`${alerts.filter((a) => a.kind === "critical").length} críticas · ${alerts.filter((a) => a.kind === "warn").length} en atención · ${alerts.filter((a) => a.kind === "info").length} informativas`}
        />
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
      </section>

      {/* KPI ROW */}
      <section>
        <SectionHeader title="Métricas clave" sub="Snapshot agregado de las 6 campañas" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="Gasto total"
            value={m.spend}
            format={(v) => fmt.eur(v, { decimals: 0 })}
            sub={`${Math.round(m.budgetPct)}% · ${fmt.eur(m.remaining, { decimals: 0 })} restante`}
            tone="default"
            trend={fakeTrend(1, m.spend)}
            badge={<Badge variant="outline" className="font-mono">€{PLAN.budget.toLocaleString("es")}</Badge>}
            delay={0.02}
          />
          <KpiCard
            label="CPT Registro"
            value={m.cptReg ?? 0}
            format={(v) => fmt.eur(v)}
            sub={`C1 + C2 + C4 · ${m.totalConvCR} CR`}
            tone={cptTone(m.cptReg) === "success" ? "success" : cptTone(m.cptReg) === "warning" ? "warning" : "danger"}
            trend={fakeTrend(2, m.cptReg ?? 0, 12, 0.12)}
            delay={0.06}
          />
          <KpiCard
            label="CPT Inicio pago"
            value={m.cptIco ?? 0}
            format={(v) => fmt.eur(v)}
            sub={`C5 + C6 · ${m.totalConvIC} IC`}
            tone={cptTone(m.cptIco) === "success" ? "lime" : "warning"}
            trend={fakeTrend(3, m.cptIco ?? 0)}
            delay={0.1}
          />
          <KpiCard
            label="CTR global"
            value={m.ctr}
            format={(v) => fmt.pct(v)}
            sub="objetivo 1.5 – 2.5 %"
            tone={ctrTone(m.ctr) === "success" ? "success" : ctrTone(m.ctr) === "warning" ? "warning" : "danger"}
            trend={fakeTrend(4, m.ctr)}
            delay={0.14}
          />
          <KpiCard
            label="CPM global"
            value={m.cpm}
            format={(v) => fmt.eur(v)}
            sub="objetivo < €9"
            tone={cpmTone(m.cpm) === "success" ? "cyan" : cpmTone(m.cpm) === "warning" ? "warning" : "danger"}
            trend={fakeTrend(5, m.cpm)}
            delay={0.18}
          />
          <KpiCard
            label="Días activo"
            value={daysElapsed}
            format={(v) => `${Math.round(v)}`}
            sub={`de ${PLAN.totalDays} · 12 – 31 mayo`}
            tone="violet"
            trend={fakeTrend(6, daysElapsed)}
            delay={0.22}
          />
        </div>
      </section>

      {/* DAILY SUMMARY (resumen del día · cambios vs ayer + highlights/risks + mensaje Julián) */}
      <Reveal>
        <DailySummary />
      </Reveal>

      {/* FUNNEL + TIMELINE */}
      <section className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <FunnelCard />
        <TimelineCard daysElapsed={daysElapsed} />
      </section>
    </div>
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

function FunnelCard() {
  const { campaigns } = useDashboard();
  const totC = campaigns.reduce((s, c) => s + (c.evContact || 0), 0);
  const totI = campaigns.reduce((s, c) => s + (c.evInitCheckout || 0), 0);
  const totR = campaigns.reduce((s, c) => s + (c.evCompleteReg || 0), 0);
  const max = Math.max(totC, totI, totR, 1);
  const cvr1 = totC > 0 ? ((totI / totC) * 100).toFixed(1) : "—";
  const cvr2 = totI > 0 ? ((totR / totI) * 100).toFixed(1) : "—";

  const steps = [
    {
      label: "Contactos",
      sub: "Linda · WhatsApp",
      value: totC,
      color: "var(--brand-cyan)",
      Icon: Sparkles,
    },
    {
      label: "Inicio pago",
      sub: '"Probar gratis" → onboarding',
      value: totI,
      color: "var(--brand-violet)",
      Icon: Activity,
    },
    {
      label: "Registro",
      sub: "trial confirmado",
      value: totR,
      color: "var(--brand-lime)",
      Icon: Target,
    },
  ];

  return (
    <TextureCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Embudo de conversión
        </h3>
        <Badge variant="outline" className="font-mono">6 campañas</Badge>
      </div>

      <div className="flex items-end gap-1 mb-3 h-[180px]">
        {steps.map((s, i) => {
          const heightPct = Math.max(8, (s.value / max) * 100);
          return (
            <React.Fragment key={i}>
              <div className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                {i > 0 && (
                  <div className="text-[11px] font-bold text-muted-foreground/80">
                    {i === 1 ? cvr1 : cvr2}%
                  </div>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-[70%] rounded-t-lg relative overflow-hidden"
                  style={{
                    background: `linear-gradient(180deg, hsl(${s.color} / 0.9), hsl(${s.color} / 0.35))`,
                    boxShadow: `0 0 30px -8px hsl(${s.color} / 0.6), inset 0 1px 0 hsl(${s.color})`,
                  }}
                />
                <div className="flex flex-col items-center">
                  <div
                    className="font-mono font-bold text-2xl tabular leading-none"
                    style={{ color: `hsl(${s.color})` }}
                  >
                    <AnimatedNumber value={s.value} format={(v) => fmt.int(v)} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1.5">
                    {s.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 text-center">{s.sub}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="self-center text-muted-foreground/40 text-2xl pb-12">→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </TextureCard>
  );
}

function TimelineCard({ daysElapsed }: { daysElapsed: number }) {
  const d7 = daysUntil(PLAN.day7ISO);
  const d14 = daysUntil(PLAN.day14ISO);
  const items = [
    {
      Icon: Rocket,
      date: "12 may",
      title: "Lanzamiento",
      desc: "6 campañas activas",
      status: "done" as const,
      sub: `✓ Día ${daysElapsed}`,
    },
    {
      Icon: Search,
      date: "19 may · día 7",
      title: "Plan B + Watchpoint CO",
      desc: "Switch evento si <20 CR",
      status: d7 < 0 ? "past" : d7 <= 1 ? "now" : "future" as const,
      sub: d7 < 0 ? `Hace ${Math.abs(d7)}d` : d7 === 0 ? "¡HOY!" : `En ${d7}d`,
    },
    {
      Icon: Zap,
      date: "26 may · día 14",
      title: "C7 + contingencia",
      desc: "Activar si ≥1k visits + 30 trials",
      status: d14 < 0 ? "past" : d14 <= 1 ? "now" : "future" as const,
      sub: d14 < 0 ? `Hace ${Math.abs(d14)}d` : d14 === 0 ? "¡HOY!" : `En ${d14}d`,
    },
    {
      Icon: BarChart3,
      date: "31 may",
      title: "Cierre mes 1",
      desc: "Reporte + brief junio",
      status: "future" as const,
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
