"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { fmt, cn, cptTone, daysUntil, CPT_THRESHOLDS } from "@/lib/utils";
import { computeMetrics, cptVsGroupAvg } from "@/lib/selectors";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Gauge } from "@/components/fx/gauge";
import { Badge } from "@/components/ui/badge";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { CampaignDeepAnalysis } from "@/components/estrategia/campaign-deep-analysis";
import { ProjectionCard } from "@/components/estrategia/projection-card";

export function TabEstrategia() {
  const { campaigns, daysElapsed } = useDashboard();
  const m = computeMetrics(campaigns);

  const cptCriticalPct = m.cptReg
    ? Math.min(100, (m.cptReg / PLAN.cpt.critical) * 100)
    : 0;
  const cptIcoPct = m.cptIco
    ? Math.min(100, (m.cptIco / PLAN.cpt.critical) * 100)
    : 0;
  const budgetPct = Math.min(100, m.budgetPct);

  // pacing
  const dailyAvg = daysElapsed > 0 ? m.spend / daysElapsed : 0;
  const proj = dailyAvg * PLAN.totalDays;
  const dRem = PLAN.totalDays - daysElapsed;
  const reqDaily = dRem > 0 ? m.remaining / dRem : 0;

  return (
    <div className="space-y-7 max-w-[1500px]">
      <SectionHeader
        title="Semáforo de rendimiento"
        sub={`Día ${daysElapsed} / ${PLAN.totalDays} · Snapshot vivo`}
      />

      {/* Gauges semáforo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Reveal delay={0.02}>
          <TextureCard className="p-5 flex flex-col items-center text-center">
            <Gauge
              value={cptCriticalPct}
              label="CPT Reg"
              sub={m.cptReg ? `€${m.cptReg.toFixed(2)} · obj €${PLAN.cpt.target}` : "—"}
              tone="auto"
            />
            <div className="mt-3">
              <ExplainedMetric
                explanation={
                  <>
                    <b>CPT Registro</b> = gasto en C1 + C2 + C4 dividido entre <i>CompleteRegistration</i>.
                    <br />Objetivo: ≤ €{CPT_THRESHOLDS.target}. Atención: {">"} €{CPT_THRESHOLDS.warn}. Crítico: {">"} €{CPT_THRESHOLDS.critical}.
                    <br /><br />La barra del gauge muestra el % vs el umbral crítico — al 100% se cruzó la línea roja.
                  </>
                }
              >
                <span className="text-[10px] text-muted-foreground">qué significa</span>
              </ExplainedMetric>
            </div>
          </TextureCard>
        </Reveal>
        <Reveal delay={0.07}>
          <TextureCard className="p-5 flex flex-col items-center text-center">
            <Gauge
              value={cptIcoPct}
              label="CPT IC"
              sub={m.cptIco ? `€${m.cptIco.toFixed(2)}` : "—"}
              tone="auto"
            />
            <div className="mt-3">
              <ExplainedMetric
                explanation={
                  <>
                    <b>CPT Inicio de pago</b> = gasto en C5 + C6 dividido entre <i>InitiateCheckout</i>.
                    C3 se excluye por anomalía de pixel.
                    <br />Objetivo informativo ≤ €{CPT_THRESHOLDS.target} — sirve para validar el funnel antes del registro.
                  </>
                }
              >
                <span className="text-[10px] text-muted-foreground">qué significa</span>
              </ExplainedMetric>
            </div>
          </TextureCard>
        </Reveal>
        <Reveal delay={0.12}>
          <TextureCard className="p-5 flex flex-col items-center text-center">
            <Gauge value={budgetPct} label="Budget" sub={`${fmt.eur(m.spend, { decimals: 0 })} / €${PLAN.budget.toLocaleString("es")}`} tone="violet" />
            <div className="mt-3">
              <ExplainedMetric
                explanation={
                  <>
                    <b>Budget</b> = gasto acumulado / €{PLAN.budget.toLocaleString("es")} del plan mes 1.
                    <br />Contingencia adicional: €{PLAN.contingency.toLocaleString("es")} liberable día 14 si se cumplen umbrales.
                  </>
                }
              >
                <span className="text-[10px] text-muted-foreground">qué significa</span>
              </ExplainedMetric>
            </div>
          </TextureCard>
        </Reveal>
        <Reveal delay={0.17}>
          <TextureCard className="p-5 flex flex-col items-center text-center">
            <Gauge
              value={Math.round((daysElapsed / PLAN.totalDays) * 100)}
              label="Tiempo"
              sub={`día ${daysElapsed} / ${PLAN.totalDays}`}
              tone="cyan"
            />
            <div className="mt-3">
              <ExplainedMetric
                explanation={
                  <>
                    <b>Tiempo</b> = días transcurridos / {PLAN.totalDays} del periodo del plan (12 – 31 mayo).
                    Compara contra Budget para detectar bajo/sobre pacing.
                  </>
                }
              >
                <span className="text-[10px] text-muted-foreground">qué significa</span>
              </ExplainedMetric>
            </div>
          </TextureCard>
        </Reveal>
      </div>

      {/* Pacing + Proyección */}
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
            <Row k="Ritmo actual" v={`${fmt.eur(dailyAvg, { decimals: 0 })}/día`} />
            <Row k="Necesario ahora" v={`${fmt.eur(reqDaily, { decimals: 0 })}/día`} tone={reqDaily > dailyAvg ? "danger" : "success"} />
            <Row k="Proyección día 20" v={fmt.eur(proj, { decimals: 0 })} tone={proj > PLAN.budget ? "danger" : "success"} />
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-3.5" /> Proyección al 31 mayo
            </h3>
            <Badge variant="violet">objetivo 1.350 CR</Badge>
          </div>
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

      {/* Análisis por campaña */}
      <section>
        <SectionHeader title="Análisis por campaña" sub="Estado, conversión y desviación frente al promedio del grupo" />
        <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map((c) => {
            const fColor =
              c.flag === "critical"
                ? "var(--destructive)"
                : c.flag === "warn"
                  ? "var(--warning)"
                  : c.flag === "anomaly"
                    ? "var(--brand-ember)"
                    : "var(--success)";
            const spPct = Math.round((c.spend / PLAN.budget) * 100);
            const cvr = c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(1) : "—";
            const vsAvg = cptVsGroupAvg(c, campaigns);
            return (
              <StaggerItem key={c.cid}>
                <SpotlightCard className="p-4" spotlightColor={fColor} intensity={0.25}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] text-foreground">
                        {c.code}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {c.event === "CompleteRegistration" ? "Completar Reg." : "Iniciar Pago"}
                      </span>
                    </div>
                    <Badge
                      variant={
                        c.flag === "critical"
                          ? "danger"
                          : c.flag === "warn"
                            ? "warning"
                            : c.flag === "anomaly"
                              ? "ember"
                              : "success"
                      }
                    >
                      {c.flag === "critical"
                        ? "Crítico"
                        : c.flag === "warn"
                          ? "Atención"
                          : c.flag === "anomaly"
                            ? "Anomalía"
                            : "OK"}
                    </Badge>
                  </div>
                  <Row k="Gasto" v={`${fmt.eur(c.spend, { decimals: 0 })} · ${spPct}%`} />
                  <Row k="Conversiones" v={`${fmt.int(c.conversions)} ${c.event === "CompleteRegistration" ? "CR" : "IC"}`} />
                  <Row
                    k="CPT"
                    v={c.cpt === null ? "—" : fmt.eur(c.cpt)}
                    tone={cptTone(c.cpt) as "success" | "warning" | "danger" | "default"}
                  />
                  <Row k="CVR (click→conv)" v={`${cvr}%`} />
                  <Row k="Frecuencia" v={`${c.freq.toFixed(2)}×`} />

                  {/* Mini comparativo CPT vs promedio del grupo */}
                  {vsAvg.groupAvg !== null && c.cpt !== null && c.flag !== "anomaly" && (
                    <div className="mt-3 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">CPT vs. promedio grupo</span>
                        <span
                          className={cn(
                            "font-mono font-bold tabular",
                            vsAvg.diffPct > 30
                              ? "text-[hsl(var(--destructive))]"
                              : vsAvg.diffPct > 10
                                ? "text-[hsl(var(--warning))]"
                                : vsAvg.diffPct < -10
                                  ? "text-[hsl(var(--success))]"
                                  : "text-muted-foreground",
                          )}
                        >
                          {vsAvg.diffPct > 0 ? "+" : ""}
                          {vsAvg.diffPct.toFixed(0)}% vs €{vsAvg.groupAvg.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative h-1 rounded-full bg-border/60 overflow-hidden">
                        <div
                          className="absolute top-0 bottom-0 w-[2px] bg-foreground/50 z-10"
                          style={{ left: "50%" }}
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(2, 50 + vsAvg.diffPct / 2))}%` }}
                          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full"
                          style={{
                            background:
                              vsAvg.diffPct > 0
                                ? "hsl(var(--destructive))"
                                : "hsl(var(--success))",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Análisis profundo por campaña (sección A · handoff 22-may) */}
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

      {/* Proyección al 31-may + Realidad vs Objetivo (sección B · handoff 22-may) */}
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

function RulesGrid() {
  const { daysElapsed, campaigns } = useDashboard();
  const c2 = campaigns.find((c) => c.code === "C2");
  const c4 = campaigns.find((c) => c.code === "C4");
  const c7 = campaigns.find((c) => c.code === "C7");
  const d14 = daysUntil(PLAN.day14ISO);

  // ── Plan B C2 · dinámico ────────────────────────────────────────────
  // Trigger Julián: si C2 lleva <20 CR al día 7+ → switch a IC.
  // Estado real:
  //   · C2 PAUSED  → switch NO ejecutado, regla descartada (IC tampoco convierte · ver C3/C5/C6)
  //   · C2 ACTIVE + CR<20 + día≥7 → pendiente
  //   · C2 ACTIVE + CR≥20 → trigger no alcanzado, regla OK
  const c2CR = c2?.evCompleteReg ?? 0;
  const c2Paused = c2?.status === "PAUSED";
  let planBTitle = "Plan B C2 — switch a InitiateCheckout";
  let planBDesc = "C2 no encontrada en el rango activo.";
  let planBState: "ok" | "alert" | "watch" = "watch";
  if (c2) {
    if (c2Paused) {
      planBTitle = "Plan B C2 — descartado";
      planBDesc = `C2 PAUSED · regla NO ejecutada (aprendizaje: IC convierte 8× peor). ${c2CR} CR acumulados antes de pausar.`;
      planBState = "ok";
    } else if (daysElapsed >= 7 && c2CR < 20) {
      planBDesc = `Día ${daysElapsed} · ${c2CR} CR < 20. Trigger alcanzado · revisar con Julián antes del switch.`;
      planBState = "alert";
    } else if (c2CR >= 20) {
      planBTitle = "Plan B C2 — trigger no alcanzado";
      planBDesc = `${c2CR} CR ≥ 20 · regla OK, mantener objetivo CompleteRegistration.`;
      planBState = "ok";
    } else {
      planBDesc = `Día ${daysElapsed} · ${c2CR} CR · evaluación día 7.`;
      planBState = "watch";
    }
  }

  // ── Día 14 · evaluar C7 Retargeting · condición ≥1.000 visits + ≥30 trials
  // Sin breakdown de visitas en client. Si tenemos C7 con conversiones reales,
  // mostramos lo que sabemos; sino dejamos "pendiente data".
  let c7Title = "Día 14 (26 may) — evaluar C7 Retargeting";
  let c7Desc = "";
  let c7State: "ok" | "alert" | "watch" = "watch";
  if (d14 > 0) {
    c7Desc = `En ${d14}d. Condición: ≥1.000 visits + ≥30 trials. Pendiente data de visitas (revisar en Ads Manager).`;
    c7State = "watch";
  } else if (c7) {
    const c7Conv = c7.conversions;
    if (c7Conv >= 30) {
      c7Title = "Día 14 — C7 cumple condición";
      c7Desc = `${c7Conv} conv ≥ 30 · contingencia €1.000 activable si ≥2 camps CPT<€3.`;
      c7State = "ok";
    } else {
      c7Desc = `Pasado · C7 lleva ${c7Conv} conv (< 30 trials). Visitas pendientes de revisar en Ads Manager.`;
      c7State = "alert";
    }
  } else {
    c7Desc = "Pasado · C7 no creada todavía. Visitas pendientes manual en Ads Manager.";
    c7State = "alert";
  }

  // ── Watchpoint Colombia · pendiente data (no tenemos breakdown por país) ──
  const c4Spend = c4?.spend ?? 0;
  const watchCODesc = c4
    ? `C4 LATAM_BELLEZA lleva ${fmt.eur(c4Spend, { decimals: 0 })} en el rango. Breakdown CO no disponible en client · revisar manual en Ads Manager.`
    : "Pendiente · revisar % gasto CO en Ads Manager (no tenemos breakdown por país aquí).";

  // ── ABO · Reasignación libre hasta 20% · regla estática (límite operativo) ──
  const aboDesc = "Cualquier movimiento >20% del budget requiere aprobación de Julián. Regla activa.";

  const rules: Array<{
    icon: React.ReactNode;
    title: string;
    desc: string;
    state: "ok" | "alert" | "watch";
  }> = [
    {
      icon: <CheckCircle2 className="size-4" />,
      title: "ABO · Reasignación libre hasta 20%",
      desc: aboDesc,
      state: "ok",
    },
    {
      icon: planBState === "alert" ? <AlertOctagon className="size-4" /> : <CheckCircle2 className="size-4" />,
      title: planBTitle,
      desc: planBDesc,
      state: planBState,
    },
    {
      icon: c7State === "alert" ? <AlertOctagon className="size-4" /> : <AlertTriangle className="size-4" />,
      title: c7Title,
      desc: c7Desc,
      state: c7State,
    },
    {
      icon: <AlertTriangle className="size-4" />,
      title: "Watchpoint Colombia — geo leakage",
      desc: watchCODesc,
      state: "watch",
    },
    {
      icon: <CheckCircle2 className="size-4" />,
      title: "Atribución 7d clic / 1d view",
      desc: "Configurada correctamente en todas las campañas desde el lanzamiento (setup decision · no se modifica).",
      state: "ok",
    },
    {
      icon: <CheckCircle2 className="size-4" />,
      title: "Dominio verificado bewe.ai · CAPI activo",
      desc: "Pixel eliminado · CAPI puro desde 16 mayo. Setup histórico · datos limpios desde esa fecha.",
      state: "ok",
    },
  ];

  return (
    <StaggerGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {rules.map((r, i) => {
        const color =
          r.state === "ok" ? "var(--success)" : r.state === "alert" ? "var(--destructive)" : "var(--warning)";
        return (
          <StaggerItem key={i}>
            <TextureCard
              className="p-4"
              style={{ borderLeftWidth: "3px", borderLeftColor: `hsl(${color})` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="size-8 grid place-items-center rounded-lg border shrink-0"
                  style={{
                    background: `hsl(${color} / 0.12)`,
                    borderColor: `hsl(${color} / 0.4)`,
                    color: `hsl(${color})`,
                  }}
                >
                  {r.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold leading-tight">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.desc}</div>
                </div>
              </div>
            </TextureCard>
          </StaggerItem>
        );
      })}
    </StaggerGroup>
  );
}
