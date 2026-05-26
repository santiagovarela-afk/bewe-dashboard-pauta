"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Target,
  TrendingUp,
  TriangleAlert,
  FlaskConical,
  ImageIcon,
  CalendarClock,
  Scale,
} from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { StaggerGroup, StaggerItem } from "@/components/fx/reveal";

/**
 * Plan Junio 2026 · VALIDADO contra mayo real (12-26).
 * Lead = CompleteRegistration solamente. CPL real mayo €7.66 blend.
 * Doble escenario honesto: piso (CPL real) + upside (si optimización baja a €3).
 * Cifras NO inventadas · derivadas de la data real de mayo y del plan validado.
 */

type Tone = "success" | "warning" | "ember" | "violet" | "info";

const TOKEN: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  ember: "var(--brand-ember)",
  violet: "var(--brand-violet)",
  info: "var(--brand-cyan)",
};

// ── 2. Doble escenario ───────────────────────────────────────────
interface Scenario {
  key: "piso" | "upside";
  label: string;
  cpl: string;
  leadsDay: string;
  leadsMonth: string;
  desc: string;
  tone: Tone;
}

const SCENARIOS: Scenario[] = [
  {
    key: "piso",
    label: "Piso · realista",
    cpl: "€7.66",
    leadsDay: "~13",
    leadsMonth: "~400",
    desc: "CPL blend real de mayo, sin mejora. Es lo esperable con la performance actual.",
    tone: "ember",
  },
  {
    key: "upside",
    label: "Upside · con optimización",
    cpl: "€3.00",
    leadsDay: "~31",
    leadsMonth: "~800",
    desc: "Si el experimento J3 (objetivo Leads) gana y los refresh anti-fatiga bajan el CPL.",
    tone: "success",
  },
];

// ── 3. Campañas junio (6) ────────────────────────────────────────
interface JunioCampaign {
  code: string;
  displayName: string;
  status: string;
  statusTone: Tone;
  objetivo: string;
  dailyEur: number;
  monthEur: number;
  cpl: string;
  cplNote?: string;
  badge: string;
  badgeTone: Tone;
}

const CAMPAIGNS: JunioCampaign[] = [
  {
    code: "J1",
    displayName: "MX_BELLEZA_WEB",
    status: "ON · sin tocar",
    statusTone: "success",
    objetivo: "Ventas",
    dailyEur: 26,
    monthEur: 780,
    cpl: "€8.37",
    cplNote: "(real may)",
    badge: "winner",
    badgeTone: "success",
  },
  {
    code: "J2",
    displayName: "CR_PA_CL_CO_BELLEZA",
    status: "ON · sin tocar",
    statusTone: "success",
    objetivo: "Ventas",
    dailyEur: 22,
    monthEur: 660,
    cpl: "€7.38",
    cplNote: "(real may)",
    badge: "winner",
    badgeTone: "success",
  },
  {
    code: "J3",
    displayName: "BELLEZA_LEADS_JUN26",
    status: "Crear pausada",
    statusTone: "violet",
    objetivo: "Clientes Potenciales",
    dailyEur: 20,
    monthEur: 600,
    cpl: "¿<€7?",
    cplNote: "experimento",
    badge: "experimento",
    badgeTone: "violet",
  },
  {
    code: "J4",
    displayName: "MX_SERVICIOS_CONV",
    status: "ON",
    statusTone: "success",
    objetivo: "Clientes Potenciales",
    dailyEur: 14,
    monthEur: 420,
    cpl: "€4.32",
    cplNote: "(real may)",
    badge: "mejor CPL",
    badgeTone: "info",
  },
  {
    code: "J5",
    displayName: "RETARGETING_LATAM",
    status: "ON · validar",
    statusTone: "warning",
    objetivo: "Ventas",
    dailyEur: 12,
    monthEur: 360,
    cpl: "€22",
    cplNote: "validar antes de escalar",
    badge: "validar",
    badgeTone: "warning",
  },
  {
    code: "J6",
    displayName: "TOOLS_ACADEMY_JUN26",
    status: "Crear pausada",
    statusTone: "violet",
    objetivo: "Tráfico / LPV",
    dailyEur: 6,
    monthEur: 180,
    cpl: "tráfico",
    cplNote: "no CR",
    badge: "top-funnel",
    badgeTone: "info",
  },
];

const SPLIT = "Belleza 68% · Servicios 14% · Retargeting 12% · Tools+Academy 6%";

// ── 4. Validación matemática ─────────────────────────────────────
interface MathRow {
  cpl: string;
  leadsDay: string;
  leadsMonth: string;
  tag?: string;
  tone: Tone;
  highlight: boolean;
}

const MATH_ROWS: MathRow[] = [
  { cpl: "€3.00", leadsDay: "33", leadsMonth: "~800", tag: "upside", tone: "success", highlight: true },
  { cpl: "€5.00", leadsDay: "20", leadsMonth: "~480", tone: "info", highlight: false },
  { cpl: "€7.66", leadsDay: "13", leadsMonth: "~390", tag: "piso real", tone: "ember", highlight: true },
];

// ── 5. Curva de rampa ────────────────────────────────────────────
interface RampRow {
  week: string;
  range: string;
  phase: string;
  leadsDay: string;
}

const RAMP: RampRow[] = [
  { week: "Sem 1", range: "1-7 jun", phase: "Aprendizaje", leadsDay: "8-15" },
  { week: "Sem 2", range: "8-14 jun", phase: "Saliendo", leadsDay: "12-22" },
  { week: "Sem 3", range: "15-21 jun", phase: "Madurez", leadsDay: "15-30" },
  { week: "Sem 4", range: "22-30 jun", phase: "Pleno", leadsDay: "18-35" },
];

// ── 6. Experimentos clave ────────────────────────────────────────
interface Experiment {
  code: string;
  title: string;
  detail: string;
  tone: Tone;
}

const EXPERIMENTS: Experiment[] = [
  {
    code: "J3",
    title: "Belleza-Leads · objetivo Clientes Potenciales",
    detail:
      "Prueba si el objetivo Leads baja el CPL vs Ventas (J1/J2). Lectura día 7. Si CPL(J3) < CPL(J1/J2) → julio migra todo a Leads.",
    tone: "violet",
  },
  {
    code: "J6",
    title: "Tools+Academy · top-funnel",
    detail:
      "Tráfico que alimenta el retargeting. Activa los 40M COP en videos que hoy están sin pautar.",
    tone: "info",
  },
];

// ── 7. Assets urgentes ───────────────────────────────────────────
interface AssetRow {
  text: string;
  tone: Tone;
}

const ASSETS: AssetRow[] = [
  {
    text: "12 imágenes refresh belleza · anti-fatiga (mkt/paraguas fatigan ~día 12)",
    tone: "ember",
  },
  { text: "4 videos refresh belleza · 15-20s", tone: "ember" },
  {
    text: "Resto: reciclaje de ganadores mayo · mkt_v1_dol (58K impr), paraguas_v2 (45K), linda_v1 (CTR 2.93%)",
    tone: "info",
  },
];

// ── 8. Watchpoints ───────────────────────────────────────────────
interface Watchpoint {
  when: string;
  text: string;
  tone: Tone;
}

const WATCHPOINTS: Watchpoint[] = [
  { when: "Día 7 · 9 jun", text: "Veredicto Leads vs Ventas (J3 vs J1/J2)", tone: "violet" },
  { when: "Día 10-12", text: "Refresh creativo por fatiga", tone: "ember" },
  { when: "Continuo", text: "CPL blend >€5 → reasignar a la mejor campaña", tone: "warning" },
];

export function JunioPlan() {
  const totalDaily = CAMPAIGNS.reduce((s, c) => s + c.dailyEur, 0);
  const totalMonth = CAMPAIGNS.reduce((s, c) => s + c.monthEur, 0);

  return (
    <div className="space-y-7">
      {/* 1. Header */}
      <TextureCard className="p-5 border-[hsl(var(--brand-violet)/0.4)] bg-gradient-to-br from-[hsl(var(--brand-violet)/0.08)] via-card to-card">
        <div className="flex items-start gap-3">
          <div className="size-11 grid place-items-center rounded-xl bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] shrink-0">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-[hsl(var(--brand-violet))] mb-0.5">
              Plan Junio 2026 · validado vs mayo real
            </div>
            <h2 className="text-base font-bold leading-tight">
              6 campañas · €100/día · €3.000/mes
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
              Lead = CompleteRegistration · CPL real mayo €7.66 blend (4 campañas
              activas 12-26 may, €1.034 spend, 135 CR, 33 trials).
            </p>
          </div>
        </div>
      </TextureCard>

      {/* 2. Doble escenario */}
      <section>
        <SectionHeader
          title="Objetivo · doble escenario"
          sub="Honesto: piso con CPL real + upside si la optimización funciona"
        />
        <div className="grid md:grid-cols-2 gap-3">
          {SCENARIOS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <TextureCard
                className="p-5 h-full"
                style={{
                  borderColor: `hsl(${TOKEN[s.tone]} / 0.4)`,
                  background: `linear-gradient(135deg, hsl(${TOKEN[s.tone]} / 0.08), hsl(var(--card)))`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant={s.tone === "ember" ? "ember" : "success"}
                    className="!text-[9px]"
                  >
                    {s.label}
                  </Badge>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    CPL {s.cpl}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-4xl font-bold"
                    style={{ color: `hsl(${TOKEN[s.tone]})` }}
                  >
                    {s.leadsMonth}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    leads/mes
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                  {s.leadsDay} leads/día
                </div>
                <div className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">
                  {s.desc}
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground/80 italic leading-relaxed mt-3 px-1">
          El upside requiere que el experimento J3 (objetivo Leads) y los refresh
          creativos bajen el CPL. Sin eso, el piso es lo esperable.
        </div>
      </section>

      {/* 3. Tabla campañas */}
      <section>
        <SectionHeader
          title="Campañas junio · 6 campañas"
          sub={SPLIT}
        />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-bold">Cód</th>
                  <th className="text-left p-3 font-bold">Campaña</th>
                  <th className="text-left p-3 font-bold">Estado</th>
                  <th className="text-left p-3 font-bold">Objetivo</th>
                  <th className="text-right p-3 font-bold">€/día</th>
                  <th className="text-right p-3 font-bold">€/mes</th>
                  <th className="text-left p-3 font-bold">CPL esperado</th>
                  <th className="text-left p-3 font-bold" />
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c, i) => (
                  <motion.tr
                    key={c.code}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-border/40 hover:bg-secondary/20"
                  >
                    <td className="p-3 font-mono font-bold text-[hsl(var(--brand-violet))]">
                      {c.code}
                    </td>
                    <td className="p-3 font-semibold text-foreground font-mono text-[10px]">
                      {c.displayName}
                    </td>
                    <td className="p-3">
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: `hsl(${TOKEN[c.statusTone]})` }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{c.objetivo}</td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      €{c.dailyEur}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums font-semibold">
                      €{c.monthEur.toLocaleString("es")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {c.code === "J5" && (
                          <TriangleAlert className="size-3 text-[hsl(var(--warning))] shrink-0" />
                        )}
                        <span className="font-mono font-semibold">{c.cpl}</span>
                        {c.cplNote && (
                          <span className="text-[9px] text-muted-foreground">
                            {c.cplNote}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          c.badgeTone === "info"
                            ? "cyan"
                            : c.badgeTone === "warning"
                              ? "warning"
                              : c.badgeTone === "violet"
                                ? "violet"
                                : "success"
                        }
                        className="!text-[9px] normal-case tracking-normal whitespace-nowrap"
                      >
                        {c.badge}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
                <tr className="border-t-2 border-border bg-secondary/30">
                  <td className="p-3 font-bold" colSpan={4}>
                    Total
                  </td>
                  <td className="p-3 text-right font-mono font-bold">
                    €{totalDaily}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[hsl(var(--brand-violet))]">
                    €{totalMonth.toLocaleString("es")}
                  </td>
                  <td className="p-3" colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* 4. Validación matemática */}
      <section>
        <SectionHeader
          title="Validación matemática"
          sub="€100/día ÷ CPL = leads/día · con rampa de aprendizaje"
        />
        <TextureCard className="p-5">
          <div className="font-mono text-[12px] font-bold text-foreground mb-4 flex items-center gap-2">
            <Scale className="size-4 text-[hsl(var(--brand-violet))]" />
            100€/día ÷ CPL = leads/día
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-2.5 font-bold">CPL</th>
                  <th className="text-right p-2.5 font-bold">Leads/día</th>
                  <th className="text-right p-2.5 font-bold">Leads/mes</th>
                  <th className="text-left p-2.5 font-bold" />
                </tr>
              </thead>
              <tbody>
                {MATH_ROWS.map((r) => (
                  <tr
                    key={r.cpl}
                    className="border-t border-border/40"
                    style={
                      r.highlight
                        ? { background: `hsl(${TOKEN[r.tone]} / 0.07)` }
                        : undefined
                    }
                  >
                    <td
                      className="p-2.5 font-mono font-bold"
                      style={{ color: `hsl(${TOKEN[r.tone]})` }}
                    >
                      {r.cpl}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums">
                      {r.leadsDay}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums font-semibold">
                      {r.leadsMonth}
                    </td>
                    <td className="p-2.5">
                      {r.tag && (
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: `hsl(${TOKEN[r.tone]})` }}
                        >
                          {r.tag}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* 5. Curva de rampa */}
      <section>
        <SectionHeader
          title="Curva de rampa · 4 semanas"
          sub="No arranca a tope · aprendizaje sem1, pleno sem4 (rango piso-upside)"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RAMP.map((r, i) => (
            <motion.div
              key={r.week}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TextureCard className="p-4 h-full">
                <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--brand-violet))] mb-1">
                  {r.week}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mb-2">
                  {r.range}
                </div>
                <div className="font-mono text-2xl font-bold text-foreground">
                  {r.leadsDay}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  leads/día · {r.phase}
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. Experimentos clave */}
      <section>
        <SectionHeader
          title="Los 2 experimentos clave"
          sub="Las apuestas que pueden mover el CPL hacia el upside"
        />
        <StaggerGroup className="grid md:grid-cols-2 gap-3">
          {EXPERIMENTS.map((e) => (
            <StaggerItem key={e.code}>
              <TextureCard
                className="p-4 h-full"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: `hsl(${TOKEN[e.tone]})`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="size-8 grid place-items-center rounded-lg shrink-0"
                    style={{
                      background: `hsl(${TOKEN[e.tone]} / 0.14)`,
                      color: `hsl(${TOKEN[e.tone]})`,
                    }}
                  >
                    <FlaskConical className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold leading-tight mb-1">
                      <span className="font-mono mr-1.5" style={{ color: `hsl(${TOKEN[e.tone]})` }}>
                        {e.code}
                      </span>
                      {e.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {e.detail}
                    </div>
                  </div>
                </div>
              </TextureCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* 7. Assets urgentes */}
      <section>
        <SectionHeader
          title="Assets · producción urgente"
          sub="Solo lo urgente · resto recicla ganadores de mayo"
        />
        <div className="grid md:grid-cols-1 gap-2.5">
          {ASSETS.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border/50 bg-card/50 p-3 flex items-start gap-2.5"
            >
              <div
                className="size-6 rounded-md grid place-items-center shrink-0"
                style={{
                  background: `hsl(${TOKEN[a.tone]} / 0.14)`,
                  color: `hsl(${TOKEN[a.tone]})`,
                }}
              >
                <ImageIcon className="size-3.5" />
              </div>
              <div className="text-[11px] text-foreground leading-relaxed">
                {a.text}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 8. Watchpoints */}
      <section>
        <SectionHeader
          title="Watchpoints"
          sub="Fechas de decisión y reglas de reasignación"
        />
        <div className="grid md:grid-cols-3 gap-3">
          {WATCHPOINTS.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TextureCard
                className="p-4 h-full"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: `hsl(${TOKEN[w.tone]})`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CalendarClock
                    className="size-3.5 shrink-0"
                    style={{ color: `hsl(${TOKEN[w.tone]})` }}
                  />
                  <span
                    className="text-[10px] uppercase tracking-[0.1em] font-bold"
                    style={{ color: `hsl(${TOKEN[w.tone]})` }}
                  >
                    {w.when}
                  </span>
                </div>
                <div className="text-[11px] text-foreground leading-relaxed">
                  {w.text}
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 9. Diferencia vs plan original */}
      <TextureCard
        className="p-4"
        style={{
          borderColor: `hsl(${TOKEN.warning} / 0.35)`,
          background: `linear-gradient(135deg, hsl(${TOKEN.warning} / 0.06), hsl(var(--card)))`,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="size-8 grid place-items-center rounded-lg bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))] shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-bold leading-tight mb-1">
              Diferencia vs plan original
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              El plan original asumía CPL €2.5-3 (proyectando 800 leads). La data
              real de mayo muestra CPL €7-8 en belleza. Por eso presentamos doble
              escenario: el piso (~400) es lo esperable con la performance actual;
              el upside (800) depende de que la optimización funcione.
            </p>
          </div>
        </div>
      </TextureCard>
    </div>
  );
}
