"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Sparkles,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { fmt, cn, cptTone, daysUntil, CPT_THRESHOLDS } from "@/lib/utils";
import { computeMetrics, planBStatus } from "@/lib/selectors";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { Gauge } from "@/components/fx/gauge";
import { Badge } from "@/components/ui/badge";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { CampaignDeepAnalysis } from "@/components/estrategia/campaign-deep-analysis";
import { ProjectionCard } from "@/components/estrategia/projection-card";
import { CampaignExpandableCard } from "@/components/estrategia/campaign-expandable";
import { CountryPerformance } from "@/components/estrategia/country-performance";
import type { DailyRow } from "@/lib/types";

type ProjBase = "3d" | "7d" | "all";

export function TabEstrategia() {
  const { campaigns, daysElapsed, daily, hasDailyBreakdown } = useDashboard();
  const m = computeMetrics(campaigns);
  const [projBase, setProjBase] = React.useState<ProjBase>("3d");

  const cptCriticalPct = m.cptReg
    ? Math.min(100, (m.cptReg / PLAN.cpt.critical) * 100)
    : 0;
  const budgetPct = Math.min(100, m.budgetPct);

  // ── Pacing actual (ritmo del rango entero) ────────────────────────
  const dailyAvg = daysElapsed > 0 ? m.spend / daysElapsed : 0;

  // ── Ritmo según ventana elegida (últimos 3d / 7d / total) ─────────
  const recentDailyAvg = React.useMemo(
    () => computeRecentDailyAvg(daily, projBase, m.spend, daysElapsed),
    [daily, projBase, m.spend, daysElapsed],
  );
  const proj = recentDailyAvg * PLAN.totalDays;

  const dRem = PLAN.totalDays - daysElapsed;
  const reqDaily = dRem > 0 ? m.remaining / dRem : 0;

  // ¿Tenemos CPT IC con datos suficientes? Si no, no mostramos la card
  const showCptIc =
    m.cptIco !== null && m.totalConvIC >= 5; // pocos eventos · no mostrar

  return (
    <div className="space-y-7 max-w-[1500px]">
      <SectionHeader
        title="Semáforo de rendimiento"
        sub={`Día ${daysElapsed} / ${PLAN.totalDays} · Snapshot vivo`}
      />

      {/* Gauges semáforo */}
      <div className={cn("grid grid-cols-2 gap-3", showCptIc ? "md:grid-cols-4" : "md:grid-cols-3")}>
        <Reveal delay={0.02}>
          <SemaphoreCard
            title="CPT Registro"
            subtitle="Costo por registro completado"
            tone="auto"
            value={cptCriticalPct}
            mainSub={m.cptReg ? `€${m.cptReg.toFixed(2)} · obj €${PLAN.cpt.target}` : "—"}
            explanation={
              <>
                <b>CPT Registro</b> = gasto en campañas CR (MX_BELLEZA + MX_COMERCIO + LATAM_BELLEZA) dividido entre eventos <i>CompleteRegistration</i>.
                <br /><br />
                <b>Umbrales</b>:
                <ul className="mt-1 ml-3 list-disc">
                  <li><span className="text-[hsl(var(--success))]">Verde</span> ≤ €{CPT_THRESHOLDS.target} (objetivo)</li>
                  <li><span className="text-[hsl(var(--warning))]">Amarillo</span> €{CPT_THRESHOLDS.target}–€{CPT_THRESHOLDS.warn}</li>
                  <li><span className="text-[hsl(var(--destructive))]">Rojo</span> {">"} €{CPT_THRESHOLDS.critical}</li>
                </ul>
                <br />La barra del gauge muestra el % vs el umbral crítico — al 100% se cruzó la línea roja.
              </>
            }
          />
        </Reveal>

        {showCptIc && (
          <Reveal delay={0.07}>
            <SemaphoreCard
              title="CPT Pago"
              subtitle="Costo por inicio de pago"
              tone="auto"
              value={
                m.cptIco
                  ? Math.min(100, (m.cptIco / PLAN.cpt.critical) * 100)
                  : 0
              }
              mainSub={m.cptIco ? `€${m.cptIco.toFixed(2)}` : "—"}
              explanation={
                <>
                  <b>CPT InitiateCheckout</b> = gasto en C5/C6 dividido entre eventos IC.
                  <br />C3 se excluye por anomalía de pixel.
                  <br /><br />Solo se muestra si hay ≥5 eventos IC en el rango.
                </>
              }
            />
          </Reveal>
        )}

        <Reveal delay={0.12}>
          <SemaphoreCard
            title="Budget"
            subtitle={`${fmt.eur(m.spend, { decimals: 0 })} / €${PLAN.budget.toLocaleString("es")}`}
            tone="violet"
            value={budgetPct}
            mainSub={`${fmt.eur(m.spend, { decimals: 0 })} / €${PLAN.budget.toLocaleString("es")}`}
            explanation={
              <>
                <b>Budget</b> = gasto acumulado / €{PLAN.budget.toLocaleString("es")} del plan mes 1.
                <br />Contingencia adicional: €{PLAN.contingency.toLocaleString("es")} liberable día 14 si se cumplen umbrales.
                <br /><br />Comparar contra el gauge <b>Tiempo</b> para detectar bajo/sobre pacing.
              </>
            }
          />
        </Reveal>

        <Reveal delay={0.17}>
          <SemaphoreCard
            title="Tiempo transcurrido"
            subtitle={`día ${daysElapsed} de ${PLAN.totalDays} del plan`}
            tone="cyan"
            value={Math.round((daysElapsed / PLAN.totalDays) * 100)}
            mainSub={`día ${daysElapsed} / ${PLAN.totalDays}`}
            explanation={
              <>
                <b>Tiempo transcurrido</b> = días del plan ya completados (12–31 mayo · {PLAN.totalDays} días totales).
                <br /><br />Compará contra <b>Budget</b>:
                <ul className="mt-1 ml-3 list-disc">
                  <li>Budget {">"} Tiempo → sobre pacing (gastando rápido)</li>
                  <li>Budget {"<"} Tiempo → bajo pacing (gastando lento)</li>
                </ul>
              </>
            }
          />
        </Reveal>
      </div>

      {/* Pacing + Proyección con selector base */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TextureCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-2">
              <Wallet className="size-3.5" /> Pacing presupuesto
            </h3>
            <Badge variant={proj > PLAN.budget ? "danger" : "success"}>
              proj. {fmt.eur(proj, { decimals: 0 })}
            </Badge>
          </div>
          <div className="space-y-3">
            <Row k="Gastado" v={fmt.eur(m.spend, { decimals: 0 })} sub={`${Math.round(m.budgetPct)}%`} />
            <Row k="Ritmo medio (rango)" v={`${fmt.eur(dailyAvg, { decimals: 0 })}/día`} />
            <Row k="Ritmo reciente" v={`${fmt.eur(recentDailyAvg, { decimals: 0 })}/día`} />
            <Row k="Necesario ahora" v={`${fmt.eur(reqDaily, { decimals: 0 })}/día`} tone={reqDaily > dailyAvg ? "danger" : "success"} />
            <Row k={`Proyección al 31 may`} v={fmt.eur(proj, { decimals: 0 })} tone={proj > PLAN.budget ? "danger" : "success"} />
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-border/60 overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                background: budgetPct > 100
                  ? "hsl(var(--destructive))"
                  : budgetPct > 60
                    ? "hsl(var(--brand-violet))"
                    : "hsl(var(--success))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetPct, 100)}%` }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </TextureCard>

        <TextureCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-3.5" /> Proyección al 31 mayo
            </h3>
            <Badge variant="violet">objetivo 1.350 CR</Badge>
          </div>

          {/* Selector de base proyección */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mr-1">
              base:
            </span>
            <ProjBaseToggle current={projBase} onChange={setProjBase} hasDaily={hasDailyBreakdown} />
            <ExplainedMetric
              explanation={
                <>
                  <b>Base de cálculo</b> de la proyección:
                  <ul className="mt-1 ml-3 list-disc">
                    <li><b>3d</b> · ritmo de los últimos 3 días · sensible a cambios recientes</li>
                    <li><b>7d</b> · ritmo de la última semana · más estable</li>
                    <li><b>Total</b> · promedio del rango entero · referencia histórica</li>
                  </ul>
                  <br />Si no hay breakdown diario, se usa el ritmo total automáticamente.
                </>
              }
            >
              <span className="sr-only">qué base</span>
            </ExplainedMetric>
          </div>
          <p className="text-[10.5px] text-muted-foreground/80 mb-3 leading-relaxed">
            Calculada con ritmo {projBase === "3d" ? "diario de los últimos 3 días" : projBase === "7d" ? "diario de los últimos 7 días" : "promedio del rango activo"}
            {" "}× {PLAN.totalDays} días totales del plan.
          </p>
          <div className="space-y-3">
            <Row
              k="CR proyectados"
              v={
                <AnimatedNumber
                  value={Math.round((m.totalConvCR / Math.max(daysElapsed, 1)) * PLAN.totalDays)}
                  format={fmt.int}
                />
              }
            />
            <Row
              k="IC proyectados"
              v={
                <AnimatedNumber
                  value={Math.round((m.totalConvIC / Math.max(daysElapsed, 1)) * PLAN.totalDays)}
                  format={fmt.int}
                />
              }
            />
            <Row k="Gasto proyectado" v={fmt.eur(proj, { decimals: 0 })} />
            <Row k="CPT CR proyectado" v={m.cptReg ? fmt.eur(m.cptReg) : "—"} tone={cptTone(m.cptReg) as "success" | "warning" | "danger" | "default"} />
            <Row k="Día 14 (26 may)" v={<span className="text-[11px] text-muted-foreground">eval. C7 + contingencia</span>} />
          </div>
        </TextureCard>
      </div>

      {/* Reglas de Julián */}
      <section>
        <SectionHeader title="Reglas Julián — estado actual" sub={<NextDecisionSub daysElapsed={daysElapsed} />} />
        <RulesGrid />
      </section>

      {/* Análisis por campaña · DESGLOSABLE con nombres reales */}
      <section>
        <SectionHeader
          title="Análisis por campaña"
          sub="Click en cada card para desglose diario · justificación del status con datos"
        />
        <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map((c) => (
            <StaggerItem key={c.cid}>
              <CampaignExpandableCard campaign={c} allCampaigns={campaigns} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* NUEVA · Performance por país */}
      <section>
        <SectionHeader
          title="Performance por país"
          sub="Breakdown geográfico de toda la cuenta · qué países convierten más y dónde duele el CPT"
        />
        <Reveal>
          <CountryPerformance />
        </Reveal>
      </section>

      {/* Análisis profundo por campaña */}
      <section>
        <SectionHeader
          title="Análisis profundo por campaña"
          sub="Hipótesis original · estado actual · aprendizajes operativos del handoff 23-may"
        />
        <StaggerGroup className="grid lg:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <StaggerItem key={c.cid}>
              <CampaignDeepAnalysis campaign={c} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Proyección al 31-may + Realidad vs Objetivo */}
      <section>
        <SectionHeader
          title="Proyección al cierre"
          sub="Realidad vs objetivo Julián · brecha + palancas para cerrarla"
        />
        <Reveal>
          <ProjectionCard />
        </Reveal>
      </section>
    </div>
  );
}

/** Card de semáforo unificada con explicación inline + tooltip ?. */
function SemaphoreCard({
  title,
  subtitle,
  value,
  mainSub,
  tone,
  explanation,
}: {
  title: string;
  subtitle: string;
  value: number;
  mainSub: string;
  tone: "auto" | "violet" | "cyan" | "lime" | "ember";
  explanation: React.ReactNode;
}) {
  return (
    <TextureCard className="p-5 flex flex-col items-center text-center">
      <div className="w-full flex items-center justify-center gap-1.5 mb-1">
        <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-foreground">
          {title}
        </span>
        <ExplainedMetric explanation={explanation}>
          <span className="sr-only">Info {title}</span>
        </ExplainedMetric>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2 leading-tight">{subtitle}</p>
      <Gauge value={value} sub={mainSub} tone={tone} />
    </TextureCard>
  );
}

/** Toggle de base proyección. */
function ProjBaseToggle({
  current,
  onChange,
  hasDaily,
}: {
  current: ProjBase;
  onChange: (b: ProjBase) => void;
  hasDaily: boolean;
}) {
  const opts: Array<{ id: ProjBase; label: string }> = [
    { id: "3d", label: "3 días" },
    { id: "7d", label: "7 días" },
    { id: "all", label: "Total" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-background/40 p-0.5">
      {opts.map((o) => {
        const disabled = !hasDaily && o.id !== "all";
        const active = current === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className={cn(
              "px-2 py-0.5 text-[10px] uppercase tracking-[0.06em] font-semibold rounded transition-colors",
              active
                ? "bg-[hsl(var(--brand-violet)/0.16)] text-[hsl(var(--brand-violet))]"
                : "text-muted-foreground hover:text-foreground",
              disabled && "opacity-40 cursor-not-allowed",
            )}
            title={disabled ? "Sin breakdown diario disponible" : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function computeRecentDailyAvg(
  daily: DailyRow[],
  base: ProjBase,
  totalSpend: number,
  daysElapsed: number,
): number {
  if (base === "all" || daily.length === 0) {
    return daysElapsed > 0 ? totalSpend / daysElapsed : 0;
  }
  const n = base === "3d" ? 3 : 7;
  // sumar gasto por fecha (campaign-level rows · sin adsetId) y tomar últimos N
  const byDate = new Map<string, number>();
  for (const r of daily) {
    if (r.adsetId) continue;
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.spend);
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) => (a[0] > b[0] ? -1 : 1));
  const slice = sorted.slice(0, n);
  if (slice.length === 0) return daysElapsed > 0 ? totalSpend / daysElapsed : 0;
  const sum = slice.reduce((s, [, v]) => s + v, 0);
  return sum / slice.length;
}

function Row({
  k,
  v,
  sub,
  tone = "default",
}: {
  k: string;
  v: React.ReactNode;
  sub?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tmap = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
  };
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-[11px] text-muted-foreground">{k}</span>
      <span className={cn("font-mono font-semibold text-[12px] tabular", tmap[tone])}>
        {v}
        {sub && (
          <span className="ml-1.5 text-[10px] text-muted-foreground/60 font-normal">{sub}</span>
        )}
      </span>
    </div>
  );
}

/** Mini sub-header con la próxima fecha de decisión (día 7 / 14 / cierre). */
function NextDecisionSub({ daysElapsed }: { daysElapsed: number }) {
  const d7 = daysUntil(PLAN.day7ISO);
  const d14 = daysUntil(PLAN.day14ISO);
  const dEnd = daysUntil(PLAN.endISO);
  let label = "";
  let when = "";
  let dateLabel = "";
  if (d7 > 0) {
    label = "Día 7 · Plan B + Watchpoint CO";
    when = `en ${d7} día${d7 !== 1 ? "s" : ""}`;
    dateLabel = "19 mayo";
  } else if (d14 > 0) {
    label = "Día 14 · evaluar C7 + contingencia";
    when = `en ${d14} día${d14 !== 1 ? "s" : ""}`;
    dateLabel = "26 mayo";
  } else if (dEnd > 0) {
    label = "Cierre mes 1 · reporte + brief junio";
    when = `en ${dEnd} día${dEnd !== 1 ? "s" : ""}`;
    dateLabel = "31 mayo";
  } else {
    label = "Plan mes 1 cerrado";
    when = "completado";
    dateLabel = "";
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>Día {daysElapsed} / {PLAN.totalDays}.</span>
      <span className="text-foreground/80">Próxima decisión:</span>
      <span className="font-semibold text-[hsl(var(--brand-violet))]">{label}</span>
      {dateLabel && (
        <span className="font-mono text-[10px] text-muted-foreground/80">· {dateLabel} · {when}</span>
      )}
    </span>
  );
}

type RuleState = "done" | "pending" | "discarded" | "watch" | "active";

interface RuleEntry {
  icon: React.ReactNode;
  title: string;
  desc: string;
  state: RuleState;
  /** Etiqueta corta tipo "23-may" o "decidido" */
  stamp?: string;
}

function RulesGrid() {
  const { daysElapsed, campaigns } = useDashboard();
  const c7 = campaigns.find((c) => c.code === "C7");
  const d14 = daysUntil(PLAN.day14ISO);

  // ── Plan B C2 · estado real derivado de planBStatus ───────────────
  const planB = planBStatus(campaigns, daysElapsed);
  let planBState: RuleState;
  let planBTitle: string;
  let planBDesc: string;
  let planBStamp: string;
  switch (planB.status) {
    case "activated":
      planBState = "discarded";
      planBTitle = "Plan B C2 · switch a IC · DESCARTADO";
      planBDesc = `${planB.detail}. Regla obsoleta validada por C5/C6 (IC convierte 8× peor que CR).`;
      planBStamp = "descartado";
      break;
    case "pending":
      planBState = "pending";
      planBTitle = "Plan B C2 · revisar con Julián";
      planBDesc = `${planB.detail}. Regla original alcanzada · ahora descartada (IC no convierte). Confirmar con Julián.`;
      planBStamp = "pendiente";
      break;
    case "watch":
      planBState = "watch";
      planBTitle = "Plan B C2 · en watch";
      planBDesc = `${planB.detail}. Regla original: si C2 <20 CR día 7 → switch evento a IC.`;
      planBStamp = "vigilar";
      break;
    default:
      planBState = "discarded";
      planBTitle = "Plan B C2 · sin datos";
      planBDesc = "C2 no encontrada en el rango activo.";
      planBStamp = "sin datos";
  }

  // ── Pausa C3/C5/C6 · spend dinámico desde data viva ───────────────
  const c3 = campaigns.find((c) => c.code === "C3");
  const c5 = campaigns.find((c) => c.code === "C5");
  const c6 = campaigns.find((c) => c.code === "C6");
  const allICPaused = [c3, c5, c6].every((c) => !c || c.status === "PAUSED");
  const icPausedSpend = (c5?.spend ?? 0) + (c6?.spend ?? 0);
  const pauseDesc = allICPaused
    ? `Pausadas 3 campañas IC tras validar tasa IC→signup <1%. €${icPausedSpend.toFixed(
        0,
      )} gastados en C5+C6 sin output convertible. Aprendizaje: IC no convierte en Bewe.`
    : "Pendiente · revisar status real en Ads Manager.";

  // ── Escalados 23-may · texto narrativo del equipo (queda como nota) ─
  const c1 = campaigns.find((c) => c.code === "C1");
  const c4 = campaigns.find((c) => c.code === "C4");
  const escaladosDesc =
    c1 && c4
      ? `C1 ${c1.vertical} freq ${c1.freq.toFixed(2)}× · C4 ${c4.vertical} freq ${c4.freq.toFixed(
          2,
        )}×. Notas del equipo 23-may: C1 escalada CBO, A4.1 LOK escalado ABO. Vigilar fatigue.`
      : "Notas del equipo 23-may: C1 paraguas escalada CBO + A4.1 LOK Belleza escalado ABO.";

  // ── Anti-fatigue · listado dinámico desde data viva ─────────────────
  const fatigueCampaigns = campaigns.filter((c) => c.freq > 1.9 && c.status !== "PAUSED");
  const fatigueDesc =
    fatigueCampaigns.length > 0
      ? `Con freq >1.9: ${fatigueCampaigns
          .map((c) => `${c.code} freq ${c.freq.toFixed(2)}x`)
          .join(" · ")}. Producir concepto nuevo o el escalado pierde rendimiento.`
      : "Sin datos en el rango actual · ninguna campaña con freq >1.9 activa.";

  // ── C7 Retargeting · día 14 + nota PostHog ──────────────────────────
  let c7Title = "Día 14 (26 may) · evaluar C7 Retargeting";
  let c7Desc = "";
  let c7State: RuleState = "watch";
  let c7Stamp = `en ${Math.max(0, d14)}d`;
  if (d14 > 0) {
    c7Desc = `En ${d14}d. Bloqueada por Custom Audiences (Visitantes 30d · IC abandons · IG/FB eng). Condición: ≥1.000 visits + ≥30 trials. Métrica visits/trials requiere PostHog · check manual.`;
    c7State = "watch";
  } else if (c7) {
    const c7Conv = c7.conversions;
    if (c7Conv >= 30) {
      c7Title = "Día 14 · C7 cumple condición";
      c7Desc = `${c7Conv} conv ≥ 30 · contingencia €1.000 activable si ≥2 camps CPT<€3. Métrica visits/trials requiere PostHog · check manual.`;
      c7State = "done";
      c7Stamp = "validada";
    } else {
      c7Desc = `Pasado · C7 lleva ${c7Conv} conv (<30 trials). Métrica visits/trials requiere PostHog · check manual.`;
      c7State = "pending";
      c7Stamp = "pendiente";
    }
  } else {
    c7Desc =
      "Bloqueada por Custom Audiences · NO creada todavía. Métrica visits/trials requiere PostHog · check manual.";
    c7State = "pending";
    c7Stamp = "bloqueada";
  }

  // ── Plan junio · redirigido a CR ─────────────────────────────────
  const junioDesc =
    "Brief mes 2 · €4.500 redirigidos íntegros a CompleteRegistration (cero IC). Aprendizaje validado por C3/C5/C6.";

  // ── Watchpoint Colombia · pendiente lectura de country-performance ─
  const watchCODesc =
    "C4 LATAM_BELLEZA · pendiente lectura de country-performance. Si CO >40% del gasto → activar bid cap €2. Revisar en card Performance por país.";

  const rules: RuleEntry[] = [
    {
      icon: <CheckCircle2 className="size-4" />,
      title: "ABO · Reasignación libre hasta 20%",
      desc: "Cualquier movimiento >20% del budget requiere aprobación de Julián. Regla activa desde día 0.",
      state: "active",
      stamp: "activa",
    },
    {
      icon: <XCircle className="size-4" />,
      title: planBTitle,
      desc: planBDesc,
      state: planBState,
      stamp: planBStamp,
    },
    {
      icon: <Pause className="size-4" />,
      title: "Pausa C3 · C5 · C6 (IC LATAM/MX) — ejecutada",
      desc: pauseDesc,
      state: allICPaused ? "done" : "pending",
      stamp: "22-may",
    },
    {
      icon: <TrendingUp className="size-4" />,
      title: "Escalados · winners 23-may",
      desc: escaladosDesc,
      state: "done",
      stamp: "23-may",
    },
    {
      icon: <AlertOctagon className="size-4" />,
      title: "Anti-fatigue urgente · creativo paraguas nuevo",
      desc: fatigueDesc,
      state: fatigueCampaigns.length > 0 ? "pending" : "watch",
      stamp: "antes 26-may",
    },
    {
      icon: c7State === "done" ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />,
      title: c7Title,
      desc: c7Desc,
      state: c7State,
      stamp: c7Stamp,
    },
    {
      icon: <Sparkles className="size-4" />,
      title: "Plan junio · €4.500 redirigidos a CompleteRegistration",
      desc: junioDesc,
      state: "active",
      stamp: "brief",
    },
    {
      icon: <AlertTriangle className="size-4" />,
      title: "Watchpoint Colombia · geo leakage C4",
      desc: watchCODesc,
      state: "watch",
      stamp: "vigilar",
    },
    {
      icon: <CheckCircle2 className="size-4" />,
      title: "Atribución 7d clic / 1d view",
      desc: "Configurada correctamente desde lanzamiento (setup decision · no se modifica).",
      state: "done",
      stamp: "setup",
    },
    {
      icon: <CheckCircle2 className="size-4" />,
      title: "Dominio bewe.ai · CAPI puro desde 16-may",
      desc: "Pixel eliminado · CAPI sin duplicados. Datos limpios desde esa fecha (pre-16-may inflados).",
      state: "done",
      stamp: "16-may",
    },
  ];

  return (
    <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {rules.map((r, i) => {
        const meta = ruleStateMeta(r.state);
        return (
          <StaggerItem key={i}>
            <TextureCard
              className="p-4 h-full"
              style={{ borderLeftWidth: "3px", borderLeftColor: `hsl(${meta.color})` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="size-8 grid place-items-center rounded-lg border shrink-0"
                  style={{
                    background: `hsl(${meta.color} / 0.12)`,
                    borderColor: `hsl(${meta.color} / 0.4)`,
                    color: `hsl(${meta.color})`,
                  }}
                >
                  {r.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12px] font-semibold leading-tight">{r.title}</div>
                    <Badge
                      variant={meta.badge}
                      className="shrink-0 normal-case tracking-normal"
                    >
                      <span className="mr-1">{meta.glyph}</span>
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.desc}</div>
                  {r.stamp && (
                    <div className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
                      · {r.stamp}
                    </div>
                  )}
                </div>
              </div>
            </TextureCard>
          </StaggerItem>
        );
      })}
    </StaggerGroup>
  );
}

function ruleStateMeta(state: RuleState): {
  color: string;
  glyph: string;
  label: string;
  badge: "success" | "warning" | "danger" | "info" | "violet";
} {
  switch (state) {
    case "done":
      return { color: "var(--success)", glyph: "✓", label: "ejecutado", badge: "success" };
    case "pending":
      return { color: "var(--warning)", glyph: "⏳", label: "pendiente", badge: "warning" };
    case "discarded":
      return { color: "var(--destructive)", glyph: "✗", label: "descartado", badge: "danger" };
    case "watch":
      return { color: "var(--warning)", glyph: "👁", label: "vigilar", badge: "warning" };
    case "active":
    default:
      return { color: "var(--info)", glyph: "•", label: "activa", badge: "info" };
  }
}
