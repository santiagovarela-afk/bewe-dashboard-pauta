"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Flag,
  Mail,
  Palette,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { cn, fmt } from "@/lib/utils";
import {
  closingLevers,
  hasLiveBudgets,
  projectMonthEndScenarios,
  sumActiveDailyBudgets,
  TARGET_GOAL,
  type ActiveProjectionResult,
  type ClosingLever,
  type ScenarioKind,
  type ScenarioProjection,
} from "@/lib/selectors";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";

/**
 * Card de proyección al 31-may + Realidad vs Objetivo Julián.
 *
 * Cambios mayo 2026:
 *  - Proyección basada SÓLO en campañas ACTIVE (isActive cid)
 *  - Ritmo daily de los últimos 7 días (no del rango filtrado)
 *  - 3 escenarios: Pesimista (−20%) · Base · Optimista (+30%)
 *  - "Próximos N días" para responder cuántos CR esperar a corto plazo
 */
export function ProjectionCard({ className }: { className?: string }) {
  const { campaigns, daysElapsed, daily } = useDashboard();
  const result = projectMonthEndScenarios(campaigns, daily, daysElapsed, {
    shortHorizonDays: 5,
    windowDays: 7,
  });
  const levers = closingLevers();
  const base = result.scenarios.base;
  const liveBudgetsLoaded = hasLiveBudgets(campaigns);
  const aggregatedDaily = sumActiveDailyBudgets(campaigns);

  return (
    <TextureCard className={cn("p-5", className)}>
      <Header result={result} />

      {/* Nota sobre fuente de budgets · live (Meta API) vs plan original */}
      <Reveal>
        <div
          className="mb-3 rounded-md border px-3 py-2 text-[10.5px] leading-relaxed"
          style={{
            background: liveBudgetsLoaded
              ? "hsl(var(--success) / 0.06)"
              : "hsl(var(--warning) / 0.06)",
            borderColor: liveBudgetsLoaded
              ? "hsl(var(--success) / 0.3)"
              : "hsl(var(--warning) / 0.3)",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {liveBudgetsLoaded ? (
            <>
              Proyección basada en <b>budgets actuales de Meta</b> ·{" "}
              <span className="font-mono">
                {fmt.eur(aggregatedDaily, { decimals: 0 })}/día
              </span>{" "}
              agregado de las {result.activeCount} activas.
            </>
          ) : (
            <>
              Proyección basada en <b>plan original</b> · cargá los budgets reales en
              Meta para sincronizar.
            </>
          )}
        </div>
      </Reveal>

      {/* Próximos N días (responde "cuántos leads esperar en próximos 5 días") */}
      <Reveal>
        <NextDaysCallout result={result} />
      </Reveal>

      {/* Grid de escenarios */}
      <ScenariosGrid result={result} />

      {/* Métricas vivas del escenario base */}
      <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 mb-5">
        <StaggerItem>
          <ProjMetric
            icon={<Calendar className="size-3.5" />}
            k="Spend hoy"
            v={fmt.eur(result.spendToDate, { decimals: 0 })}
            sub={`solo ${result.activeCount} activas`}
            help="Gasto acumulado SOLO de las campañas activas hoy. Las pausadas se contabilizan aparte en la card de Pacing."
          />
        </StaggerItem>
        <StaggerItem>
          <ProjMetric
            icon={<Users className="size-3.5" />}
            k="CR hoy"
            v={<AnimatedNumber value={result.crToDate} format={fmt.int} />}
            sub={`CPL live ${result.liveCPL !== null ? fmt.eur(result.liveCPL) : "—"}`}
            help="CompleteRegistration acumulados de las activas hasta hoy. CPL live = spend hoy / CR hoy."
          />
        </StaggerItem>
        <StaggerItem>
          <ProjMetric
            icon={<Target className="size-3.5" />}
            k="CPL base proy."
            v={base.projectedCPL !== null ? fmt.eur(base.projectedCPL) : "—"}
            sub={`obj. €${TARGET_GOAL.cpa.toFixed(2)}`}
            tone={
              base.projectedCPL !== null && base.projectedCPL > TARGET_GOAL.cpa * 2
                ? "danger"
                : base.projectedCPL !== null && base.projectedCPL > TARGET_GOAL.cpa
                  ? "warning"
                  : "success"
            }
            help={
              <>
                <b>CPL final base</b> = spend final / CR final manteniendo el ritmo actual.
                <br />Objetivo Julián: ≤ €{TARGET_GOAL.cpa.toFixed(2)}.
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <ProjMetric
            icon={<Clock className="size-3.5" />}
            k="Ritmo 7d"
            v={`${fmt.eur(result.recentDailyAvg, { decimals: 0 })}/d`}
            sub={
              result.usedFallback
                ? "fallback config"
                : `${result.windowDaysUsed}d reales`
            }
            help={
              result.usedFallback ? (
                <>
                  <b>Fallback</b> · sin daily breakdown disponible para las activas. Se usa el `daily` config + tasa CR/€ live.
                </>
              ) : (
                <>
                  <b>Ritmo daily</b> calculado sobre los últimos {result.windowDaysUsed} días de las {result.activeCount} campañas activas.
                </>
              )
            }
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Barra horizontal Realidad vs Objetivo */}
      <Reveal delay={0.05}>
        <RealityVsGoalBar base={base} />
      </Reveal>

      {/* Brecha explicada */}
      <Reveal delay={0.1}>
        <GapExplainer base={base} />
      </Reveal>

      {/* Palancas */}
      <Reveal delay={0.15}>
        <div className="mt-5">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Palancas para cerrar la brecha
          </h4>
          <StaggerGroup className="grid sm:grid-cols-2 gap-2">
            {levers.map((l, i) => (
              <StaggerItem key={i}>
                <LeverCard lever={l} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </Reveal>
    </TextureCard>
  );
}

function Header({ result }: { result: ActiveProjectionResult }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[hsl(var(--brand-violet))]" aria-hidden />
          <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-foreground">
            Proyección al 31 mayo
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Día {result.daysElapsed} / {result.totalDays} ·{" "}
          {result.daysRemaining > 0
            ? `${result.daysRemaining} día${result.daysRemaining !== 1 ? "s" : ""} restantes`
            : "Plan cerrado"}{" "}
          · Sólo {result.activeCount} activas · Ritmo {fmt.eur(result.recentDailyAvg, { decimals: 0 })}/día
        </p>
      </div>
      <Badge variant="violet" className="shrink-0">
        objetivo {fmt.int(TARGET_GOAL.registrations)} CR
      </Badge>
    </div>
  );
}

/** Callout grande respondiendo "cuántos leads esperar en próximos N días". */
function NextDaysCallout({ result }: { result: ActiveProjectionResult }) {
  const base = result.scenarios.base;
  const pess = result.scenarios.pessimistic;
  const opt = result.scenarios.optimistic;
  const horizon = result.shortHorizonDays;
  return (
    <div
      className="rounded-lg border bg-background/40 p-4 mb-4"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: "hsl(var(--brand-violet))",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-4 text-[hsl(var(--brand-violet))]" aria-hidden />
        <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Próximos {horizon} días · qué esperar
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NextDaysScenario label="Pesimista" scenario={pess} tone="warning" />
        <NextDaysScenario label="Base" scenario={base} tone="violet" highlight />
        <NextDaysScenario label="Optimista" scenario={opt} tone="success" />
      </div>
      <p className="text-[10.5px] text-muted-foreground/80 mt-2.5 leading-relaxed">
        Calculado sobre el ritmo daily de las {result.activeCount} campañas activas en los últimos{" "}
        {result.windowDaysUsed > 0 ? `${result.windowDaysUsed} días` : "días config"}.
      </p>
    </div>
  );
}

function NextDaysScenario({
  label,
  scenario,
  tone,
  highlight,
}: {
  label: string;
  scenario: ScenarioProjection;
  tone: "warning" | "violet" | "success";
  highlight?: boolean;
}) {
  const color =
    tone === "warning"
      ? "var(--warning)"
      : tone === "success"
        ? "var(--success)"
        : "var(--brand-violet)";
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        highlight && "shadow-[0_0_0_1px_hsl(var(--brand-violet)/0.4)]",
      )}
      style={{
        background: `hsl(${color} / 0.08)`,
        borderColor: `hsl(${color} / 0.35)`,
      }}
    >
      <div
        className="text-[9px] uppercase tracking-[0.1em] font-bold mb-1"
        style={{ color: `hsl(${color})` }}
      >
        {label}
      </div>
      <div className="font-mono font-bold tabular text-[18px] leading-none text-foreground">
        <AnimatedNumber value={scenario.nextDaysCR} format={fmt.int} /> CR
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
        {fmt.eur(scenario.nextDaysSpend, { decimals: 0 })} esperados
      </div>
    </div>
  );
}

/** Grid de los 3 escenarios a cierre. */
function ScenariosGrid({ result }: { result: ActiveProjectionResult }) {
  const order: ScenarioKind[] = ["pessimistic", "base", "optimistic"];
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2 flex items-center gap-2">
        Escenarios al cierre
        <ExplainedMetric
          explanation={
            <>
              <b>Tres escenarios</b> al 31-may según cómo se mueve el daily:
              <ul className="mt-1 ml-3 list-disc">
                <li><b>Pesimista</b> · daily baja 20% el resto del mes</li>
                <li><b>Base</b> · sigue al ritmo actual</li>
                <li><b>Optimista</b> · subimos daily 30% en las que rentan</li>
              </ul>
              <br />Calculado sobre las {result.activeCount} campañas activas + sus últimos 7d de daily real.
            </>
          }
        >
          <span className="text-[10px] text-muted-foreground/60">cómo se calcula</span>
        </ExplainedMetric>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {order.map((k) => (
          <ScenarioCard key={k} scenario={result.scenarios[k]} />
        ))}
      </div>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: ScenarioProjection }) {
  const color =
    scenario.kind === "pessimistic"
      ? "var(--warning)"
      : scenario.kind === "optimistic"
        ? "var(--success)"
        : "var(--brand-violet)";
  const Arrow = scenario.kind === "pessimistic" ? TrendingDown : scenario.kind === "optimistic" ? TrendingUp : Target;
  const goalPct = Math.min(100, Math.max(0, scenario.goalAchievementPct));
  return (
    <div
      className="rounded-lg border bg-background/40 p-3"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: `hsl(${color})`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Arrow className="size-3.5" style={{ color: `hsl(${color})` }} aria-hidden />
        <span
          className="text-[10px] uppercase tracking-[0.1em] font-bold"
          style={{ color: `hsl(${color})` }}
        >
          {scenario.label}
        </span>
        <span className="text-[9px] text-muted-foreground ml-auto font-mono">
          ×{scenario.multiplier.toFixed(2)}
        </span>
      </div>
      <div className="text-[15px] font-mono font-bold tabular leading-none mt-1 mb-2">
        <AnimatedNumber value={scenario.projectedCR} format={fmt.int} /> CR
      </div>
      <div className="text-[10px] text-muted-foreground mb-2">
        Spend final {fmt.eur(scenario.projectedSpend, { decimals: 0 })} · CPL{" "}
        {scenario.projectedCPL !== null ? fmt.eur(scenario.projectedCPL) : "—"}
      </div>
      <div className="h-1 rounded-full bg-border/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${goalPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
          style={{ background: `hsl(${color})` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
        {goalPct.toFixed(0)}% del objetivo
      </div>
    </div>
  );
}

function ProjMetric({
  icon,
  k,
  v,
  sub,
  tone = "default",
  help,
}: {
  icon: React.ReactNode;
  k: string;
  v: React.ReactNode;
  sub?: string;
  tone?: "default" | "success" | "warning" | "danger";
  help?: React.ReactNode;
}) {
  const tmap = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
  };
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
        {icon}
        <span className="text-[9px] uppercase tracking-[0.1em] font-bold">{k}</span>
        {help && (
          <ExplainedMetric explanation={help}>
            <span className="sr-only">{k}</span>
          </ExplainedMetric>
        )}
      </div>
      <div className={cn("text-[15px] font-mono font-bold tabular leading-none", tmap[tone])}>
        {v}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground/70 mt-1 truncate">{sub}</div>
      )}
    </div>
  );
}

function RealityVsGoalBar({ base }: { base: ScenarioProjection }) {
  const pct = Math.min(100, Math.max(0, base.goalAchievementPct));
  const tone =
    pct >= 80
      ? "var(--success)"
      : pct >= 40
        ? "var(--warning)"
        : "var(--destructive)";
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Realidad vs Objetivo Julián (escenario base)
          </h4>
          <ExplainedMetric
            explanation={
              <>
                <b>Brecha</b> = diferencia entre lo proyectado al cierre (escenario base) y el objetivo formal de 1.350 CR · €2.20 CPA firmado.
                <br />La barra muestra qué % del objetivo se llegará a tocar manteniendo el ritmo actual.
              </>
            }
          >
            <span className="text-[10px] text-muted-foreground/60">qué es</span>
          </ExplainedMetric>
        </div>
        <span className="text-[11px] font-mono font-bold tabular text-foreground">
          {pct.toFixed(0)}%
        </span>
      </div>

      <div className="relative h-3 rounded-full bg-border/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0"
          style={{ background: `hsl(${tone})` }}
        />
        {pct > 1 && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="absolute top-0 bottom-0 w-[2px] bg-foreground"
            style={{ left: `${pct}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px]">
        <span className="text-muted-foreground">
          Proyección base:{" "}
          <span className="font-mono font-bold text-foreground">{fmt.int(base.projectedCR)} CR</span>
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <Flag className="size-2.5" aria-hidden />
          Objetivo:{" "}
          <span className="font-mono font-bold text-foreground">
            {fmt.int(TARGET_GOAL.registrations)} CR
          </span>
        </span>
      </div>
    </div>
  );
}

function GapExplainer({ base }: { base: ScenarioProjection }) {
  if (base.projectedCPL === null) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-[11px] text-muted-foreground">
        Sin datos suficientes para calcular brecha CPA · esperar a que las activas registren CR.
      </div>
    );
  }
  const gap = base.projectedCPL / TARGET_GOAL.cpa;
  const over = gap > 1;
  const color = over ? "destructive" : "success";
  const registrationsGap = TARGET_GOAL.registrations - base.projectedCR;
  return (
    <div
      className="mt-4 rounded-lg border p-3"
      style={{
        background: `hsl(var(--${color}) / 0.06)`,
        borderColor: `hsl(var(--${color}) / 0.35)`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className="size-4 mt-0.5 shrink-0"
          style={{ color: `hsl(var(--${color}))` }}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-[12px] leading-relaxed text-foreground">
            Estamos{" "}
            <span
              className="font-mono font-bold tabular"
              style={{ color: `hsl(var(--${color}))` }}
            >
              {gap.toFixed(1)}×
            </span>{" "}
            {over ? "sobre" : "bajo"} el target CPA. Faltan{" "}
            <span className="font-mono font-bold tabular text-foreground">
              {fmt.int(Math.max(0, registrationsGap))} CR
            </span>{" "}
            para tocar el objetivo de {fmt.int(TARGET_GOAL.registrations)} firmado por Julián.
          </p>
        </div>
      </div>
    </div>
  );
}

function leverIcon(title: string) {
  if (title.includes("Email")) return <Mail className="size-4" aria-hidden />;
  if (title.includes("Creativos")) return <Palette className="size-4" aria-hidden />;
  if (title.includes("Retargeting")) return <Users className="size-4" aria-hidden />;
  return <Target className="size-4" aria-hidden />;
}

function leverToneVar(tone: ClosingLever["tone"]) {
  switch (tone) {
    case "danger":
      return "var(--destructive)";
    case "warning":
      return "var(--warning)";
    case "success":
      return "var(--success)";
    default:
      return "var(--info)";
  }
}

function LeverCard({ lever }: { lever: ClosingLever }) {
  const color = leverToneVar(lever.tone);
  return (
    <div
      className="rounded-lg border bg-background/40 p-3 h-full"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: `hsl(${color})`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="size-7 grid place-items-center rounded-md border shrink-0"
          style={{
            background: `hsl(${color} / 0.12)`,
            borderColor: `hsl(${color} / 0.4)`,
            color: `hsl(${color})`,
          }}
        >
          {leverIcon(lever.title)}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-semibold leading-tight">{lever.title}</div>
          <p className="text-[10.5px] text-muted-foreground mt-1 leading-relaxed">
            {lever.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
