"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Calendar,
  Flag,
  Mail,
  Palette,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { cn, fmt } from "@/lib/utils";
import {
  closingLevers,
  projectMonthEnd,
  TARGET_GOAL,
  type ClosingLever,
  type ProjectionResult,
} from "@/lib/selectors";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";

/**
 * Card de proyección al 31-may + Realidad vs Objetivo Julián.
 *
 * Estructura:
 *  - Header con días restantes y badge de objetivo
 *  - Grid de proyecciones (spend, CR, CPL, trials)
 *  - Barra horizontal Realidad vs Objetivo con marker actual + proyección
 *  - Brecha explicada con multiplier
 *  - Palancas para cerrar la brecha (closingLevers)
 */
export function ProjectionCard({ className }: { className?: string }) {
  const { campaigns, daysElapsed } = useDashboard();
  const proj = projectMonthEnd(campaigns, daysElapsed);
  const levers = closingLevers();

  return (
    <TextureCard className={cn("p-5", className)}>
      <Header proj={proj} />

      {/* Grid de proyecciones */}
      <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <StaggerItem>
          <ProjMetric
            icon={<Calendar className="size-3.5" />}
            k="Spend proyectado"
            v={fmt.eur(proj.projectedSpend, { decimals: 0 })}
            sub={`${fmt.eur(proj.dailyAvg, { decimals: 0 })}/día × ${PLAN.totalDays}d`}
            help="Ritmo de gasto actual extrapolado al cierre del 31-may. Asume que el mix activo se mantiene."
          />
        </StaggerItem>
        <StaggerItem>
          <ProjMetric
            icon={<Users className="size-3.5" />}
            k="CR proyectados"
            v={<AnimatedNumber value={proj.projectedCR} format={fmt.int} />}
            sub={`${fmt.int(proj.projectedIC)} IC esperados`}
            help={
              <>
                <b>CR (CompleteRegistration)</b> proyectados a 31-may manteniendo la tasa actual.
                <br />Solo cuentan C1 + C2 + C4 (las activas en CR).
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <ProjMetric
            icon={<Target className="size-3.5" />}
            k="CPL final"
            v={proj.projectedCPL !== null ? fmt.eur(proj.projectedCPL) : "—"}
            sub={`obj. €${TARGET_GOAL.cpa.toFixed(2)}`}
            tone={
              proj.projectedCPL !== null && proj.projectedCPL > TARGET_GOAL.cpa * 2
                ? "danger"
                : proj.projectedCPL !== null && proj.projectedCPL > TARGET_GOAL.cpa
                  ? "warning"
                  : "success"
            }
            help={
              <>
                <b>CPL (Costo Por Lead)</b> proyectado = spend final ÷ CR final.
                <br />Objetivo Julián: ≤ €{TARGET_GOAL.cpa.toFixed(2)}. Crítico {">"} €5.50.
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <ProjMetric
            icon={<Sparkles className="size-3.5" />}
            k="Trials esperados"
            v={<AnimatedNumber value={proj.expectedTrials} format={fmt.int} />}
            sub="tasa 24.7% CR→trial"
            help="Trials reales estimados aplicando la tasa observada CR→trial en pauta (24.7%). Orgánico convierte al 45% — palanca pendiente."
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Barra horizontal Realidad vs Objetivo */}
      <Reveal delay={0.05}>
        <RealityVsGoalBar proj={proj} />
      </Reveal>

      {/* Brecha explicada */}
      <Reveal delay={0.1}>
        <GapExplainer proj={proj} />
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

function Header({ proj }: { proj: ProjectionResult }) {
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
          Día {proj.daysElapsed} / {proj.totalDays} ·{" "}
          {proj.daysRemaining > 0
            ? `${proj.daysRemaining} día${proj.daysRemaining !== 1 ? "s" : ""} restantes`
            : "Plan cerrado"}{" "}
          · Ritmo {fmt.eur(proj.dailyAvg, { decimals: 0 })}/día
        </p>
      </div>
      <Badge variant="violet" className="shrink-0">
        objetivo {fmt.int(TARGET_GOAL.registrations)} CR
      </Badge>
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

/**
 * Barra horizontal "Realidad vs Objetivo":
 * - El track entero representa el objetivo Julián (1.350 CR).
 * - El fill verde representa los CR proyectados al 31-may.
 * - Marker vertical en la posición % cumplimiento.
 */
function RealityVsGoalBar({ proj }: { proj: ProjectionResult }) {
  const pct = Math.min(100, Math.max(0, proj.goalAchievementPct));
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
            Realidad vs Objetivo Julián
          </h4>
          <ExplainedMetric
            explanation={
              <>
                <b>Brecha</b> = diferencia entre lo proyectado al cierre y el objetivo formal
                de 1.350 CR · €2.20 CPA firmado en el plan mayo.
                <br />La barra muestra qué % del objetivo se llegará a tocar manteniendo el ritmo.
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

      {/* Track con marker proyección + flag objetivo */}
      <div className="relative h-3 rounded-full bg-border/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0"
          style={{ background: `hsl(${tone})` }}
        />
        {/* Marker del actual (sólo si > 0) */}
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
          Proyección: <span className="font-mono font-bold text-foreground">{fmt.int(proj.projectedCR)} CR</span>
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

function GapExplainer({ proj }: { proj: ProjectionResult }) {
  const gap = proj.gapMultiplier;
  if (gap === null) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-[11px] text-muted-foreground">
        Sin datos suficientes para calcular brecha CPA.
      </div>
    );
  }
  const over = gap > 1;
  const color = over ? "destructive" : "success";
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
              {fmt.int(Math.max(0, proj.registrationsGap))} CR
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
