"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Target,
  TrendingUp,
  Wallet,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Globe2,
  Lightbulb,
} from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { StaggerGroup, StaggerItem } from "@/components/fx/reveal";

/**
 * Plan Junio · Pauta. NO calcula desde data viva · es propuesta basada en
 * los aprendizajes de mayo (handoff 23-may + KPIs validados).
 * Hardcodeo de cifras objetivo · ajustar en revisión semanal.
 */

interface JunioRec {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: "success" | "info" | "violet" | "ember";
}

interface JunioCampaign {
  name: string;
  vertical: string;
  geo: string;
  event: "CR" | "IC";
  dailyEur: number;
  totalEur: number;
  note?: string;
  status: "continuar" | "nueva" | "switch";
}

interface JunioImprovement {
  icon: React.ReactNode;
  text: string;
}

const RECOMMENDATIONS: JunioRec[] = [
  {
    icon: <CheckCircle2 className="size-3.5" />,
    title: "Continuar campañas que rindieron",
    detail:
      "MX Servicios (CR), LATAM Belleza y MX Belleza son los winners de mayo · mantener budget actual + escalar 15-20% en winning ad-sets.",
    tone: "success",
  },
  {
    icon: <ArrowRight className="size-3.5" />,
    title: "Switch de CR a IC en MX Comercio",
    detail:
      "CPR de mayo estuvo €25 (objetivo €3.50). El vertical Comercio en MX no rinde con CompleteRegistration · probar IC desde día 1 con audiencias LAL.",
    tone: "ember",
  },
  {
    icon: <Sparkles className="size-3.5" />,
    title: "Nueva campaña LATAM Servicios (CR)",
    detail:
      "Replicar la estructura de MX Servicios (mejor CPR del mes) en LATAM como expansión geográfica · arrancar con budget conservador de €15/día.",
    tone: "info",
  },
  {
    icon: <Wallet className="size-3.5" />,
    title: "Budget propuesto junio · €3.500",
    detail:
      "+17% vs mayo. Distribución: 60% winners (continuidad), 25% nueva LATAM Servicios, 15% test de IC en MX Comercio. Contingencia €500 día 14.",
    tone: "violet",
  },
];

const CAMPAIGNS: JunioCampaign[] = [
  {
    name: "MX Servicios · CR",
    vertical: "Servicios",
    geo: "MX",
    event: "CR",
    dailyEur: 35,
    totalEur: 1050,
    note: "Winner mayo · escalar CBO +15%",
    status: "continuar",
  },
  {
    name: "LATAM Belleza · CR",
    vertical: "Belleza",
    geo: "LATAM",
    event: "CR",
    dailyEur: 30,
    totalEur: 900,
    note: "Watch CO geo-leakage · bid cap €2 si >40%",
    status: "continuar",
  },
  {
    name: "MX Belleza · CR",
    vertical: "Belleza",
    geo: "MX",
    event: "CR",
    dailyEur: 25,
    totalEur: 750,
    note: "Concepto creativo nuevo antes 5-jun (anti-fatigue)",
    status: "continuar",
  },
  {
    name: "MX Comercio · IC",
    vertical: "Comercio",
    geo: "MX",
    event: "IC",
    dailyEur: 15,
    totalEur: 450,
    note: "Switch desde CR · test 14 días + kill rule",
    status: "switch",
  },
  {
    name: "LATAM Servicios · CR",
    vertical: "Servicios",
    geo: "LATAM",
    event: "CR",
    dailyEur: 15,
    totalEur: 350,
    note: "Replica MX Servicios · LAL desde 167 CR de mayo",
    status: "nueva",
  },
];

const KPIS_TARGET: Array<{ label: string; value: string; sub: string }> = [
  { label: "CR esperado", value: "200-250", sub: "basado en CPR €3-4" },
  { label: "IC esperado", value: "100-150", sub: "C. Comercio IC + spill" },
  { label: "CPR target", value: "€3,50", sub: "vs €4,80 mayo" },
  { label: "Budget total", value: "€3.500", sub: "+17% vs mayo" },
];

const IMPROVEMENTS: JunioImprovement[] = [
  {
    icon: <Sparkles className="size-3.5" />,
    text: "Implementar Plan B desde día 1 en campañas servicios — no esperar al día 7",
  },
  {
    icon: <Target className="size-3.5" />,
    text: "Audiencias lookalike construidas con los 167 CR de mayo · LAL 1% MX + LAL 2% LATAM",
  },
  {
    icon: <Lightbulb className="size-3.5" />,
    text: "Testear creativo nuevo cada 7 días · rotación obligatoria para evitar fatigue (validado en mayo)",
  },
  {
    icon: <Globe2 className="size-3.5" />,
    text: "Atribución 7d clic / 1d view mantenida · CAPI bewe.ai puro sin pixel duplicado",
  },
  {
    icon: <CheckCircle2 className="size-3.5" />,
    text: "Decisión kill: pausar ad-set si CPR >€8 día 5 · regla automática para evitar derrame",
  },
];

const STATUS_META: Record<
  JunioCampaign["status"],
  { label: string; badge: "success" | "violet" | "ember" }
> = {
  continuar: { label: "continuar", badge: "success" },
  nueva: { label: "nueva", badge: "violet" },
  switch: { label: "switch CR→IC", badge: "ember" },
};

const TONE_HSL: Record<JunioRec["tone"], string> = {
  success: "var(--brand-lime)",
  info: "var(--brand-cyan)",
  violet: "var(--brand-violet)",
  ember: "var(--brand-ember)",
};

export function JunioPlan() {
  const totalBudget = CAMPAIGNS.reduce((s, c) => s + c.totalEur, 0);

  return (
    <div className="space-y-7">
      {/* Header */}
      <TextureCard className="p-5 border-[hsl(var(--brand-violet)/0.4)] bg-gradient-to-br from-[hsl(var(--brand-violet)/0.08)] via-card to-card">
        <div className="flex items-start gap-3">
          <div className="size-11 grid place-items-center rounded-xl bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] shrink-0">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-[hsl(var(--brand-violet))] mb-0.5">
              Plan Junio 2026
            </div>
            <h2 className="text-base font-bold leading-tight">
              Estrategia de pauta · basada en aprendizajes mayo
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
              Propuesta sujeta a revisión con Julián. Cifras objetivo · no son
              proyección directa de la data viva. Validación final tras cierre
              31-may.
            </p>
          </div>
        </div>
      </TextureCard>

      {/* Recomendaciones */}
      <section>
        <SectionHeader
          title="Recomendaciones de pauta junio"
          sub="Acciones concretas derivadas del cierre mes 1"
        />
        <StaggerGroup className="grid md:grid-cols-2 gap-3">
          {RECOMMENDATIONS.map((r, i) => (
            <StaggerItem key={i}>
              <TextureCard
                className="p-4 h-full"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: `hsl(${TONE_HSL[r.tone]})`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="size-8 grid place-items-center rounded-lg shrink-0"
                    style={{
                      background: `hsl(${TONE_HSL[r.tone]} / 0.14)`,
                      color: `hsl(${TONE_HSL[r.tone]})`,
                    }}
                  >
                    {r.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold leading-tight mb-1">
                      {r.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {r.detail}
                    </div>
                  </div>
                </div>
              </TextureCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Tabla campañas propuestas */}
      <section>
        <SectionHeader
          title="Campañas propuestas · 5 ad-accounts"
          sub={`Total estimado · €${totalBudget.toLocaleString("es")} · ${CAMPAIGNS.length} campañas`}
        />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-bold">Campaña</th>
                  <th className="text-left p-3 font-bold">Vertical</th>
                  <th className="text-left p-3 font-bold">Geo</th>
                  <th className="text-left p-3 font-bold">Evento</th>
                  <th className="text-right p-3 font-bold">€/día</th>
                  <th className="text-right p-3 font-bold">€ total</th>
                  <th className="text-left p-3 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c, i) => {
                  const meta = STATUS_META[c.status];
                  return (
                    <motion.tr
                      key={c.name}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-t border-border/40 hover:bg-secondary/20"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-foreground">
                          {c.name}
                        </div>
                        {c.note && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {c.note}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {c.vertical}
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {c.geo}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={c.event === "CR" ? "success" : "warning"}
                          className="!text-[9px]"
                        >
                          {c.event}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums">
                        €{c.dailyEur}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums font-semibold">
                        €{c.totalEur.toLocaleString("es")}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={meta.badge}
                          className="!text-[9px] normal-case tracking-normal"
                        >
                          {meta.label}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
                <tr className="border-t-2 border-border bg-secondary/30">
                  <td className="p-3 font-bold" colSpan={5}>
                    Total budget mes
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[hsl(var(--brand-violet))]">
                    €{totalBudget.toLocaleString("es")}
                  </td>
                  <td className="p-3" />
                </tr>
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* KPIs target */}
      <section>
        <SectionHeader
          title="KPIs target junio"
          sub="Objetivos · validar contra realidad en revisión semanal"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPIS_TARGET.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TextureCard className="p-4 h-full">
                <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Target className="size-3 text-[hsl(var(--brand-violet))]" />
                  {k.label}
                </div>
                <div className="font-mono text-2xl font-bold text-foreground">
                  {k.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {k.sub}
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mejoras propuestas */}
      <section>
        <SectionHeader
          title="Mejoras operativas propuestas"
          sub="Reglas y automatismos para junio"
        />
        <div className="grid md:grid-cols-2 gap-2.5">
          {IMPROVEMENTS.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border/50 bg-card/50 p-3 flex items-start gap-2.5"
            >
              <div className="size-6 rounded-md grid place-items-center bg-[hsl(var(--brand-lime)/0.14)] text-[hsl(var(--brand-lime))] shrink-0">
                {m.icon}
              </div>
              <div className="text-[11px] text-foreground leading-relaxed">
                {m.text}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer disclaimer */}
      <div className="text-[10px] text-muted-foreground/60 italic leading-relaxed border-t border-border/40 pt-3">
        <TrendingUp className="size-3 inline mr-1" />
        Plan vivo · ajustable. Revisión semanal de winners. Hard-kill rule:
        pausar ad-set si CPR &gt;€8 al día 5.
      </div>
    </div>
  );
}
