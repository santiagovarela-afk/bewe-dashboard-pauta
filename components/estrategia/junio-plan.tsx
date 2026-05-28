"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Calendar,
  TriangleAlert,
  ImageIcon,
  Video,
  Wrench,
  Wallet,
  Gauge,
  ListChecks,
  Layers,
  Repeat,
  ArrowUpRight,
  CircleDot,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  GraduationCap,
  Target,
  Ratio,
} from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import { JunioPlanTable } from "@/components/estrategia/junio-plan-table";
import { useDashboard } from "@/lib/store";
import { computeMonthlyTotals } from "@/lib/selectors";
import { fmt, cn } from "@/lib/utils";

/**
 * Plan Junio 2026 · validado por Santiago contra mayo real (12-28 may).
 * Lead = CompleteRegistration (CR). CPL blend belleza real mayo = €7.66.
 * Revisión profunda Santiago: nuevos escenarios, aprendizajes mayo,
 * plan semanal interactivo por escenario, refresh de assets.
 *
 * Bloques:
 *  1. Budget structure (techo €3.100 · contingencia €400 · máx €3.500)
 *  2. 3 escenarios (conservador 500 / base 620 / agresivo 778)
 *  3. Qué pasó en mayo · aprendizajes (nuevo)
 *  4. Por qué confiamos que el CPL baja
 *  5. Qué se prende / queda / apaga (lifecycle)
 *  6. Plan semanal interactivo (selector escenario)
 *  7. Reglas de learning + reglas operativas
 *  8. Plan de assets (cantidades exactas + formatos)
 *  9. Desglose campaña → conjunto → anuncio + tabla operativa
 *  10. Mejores anuncios mayo
 */

type Tone = "success" | "warning" | "ember" | "violet" | "cyan" | "destructive";

const TOKEN: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  ember: "var(--brand-ember)",
  violet: "var(--brand-violet)",
  cyan: "var(--brand-cyan)",
  destructive: "var(--destructive)",
};

type BadgeVariant =
  | "success"
  | "warning"
  | "ember"
  | "violet"
  | "cyan"
  | "danger";

const BADGE_VARIANT: Record<Tone, BadgeVariant> = {
  success: "success",
  warning: "warning",
  ember: "ember",
  violet: "violet",
  cyan: "cyan",
  destructive: "danger",
};

// ── BLOQUE 1 · Budget structure ──────────────────────────────────
interface BudgetItem {
  label: string;
  value: string;
  note: string;
  tone: Tone;
}

const BUDGET: BudgetItem[] = [
  {
    label: "Techo base",
    value: "€3.100",
    note: "presupuesto operativo del mes",
    tone: "cyan",
  },
  {
    label: "Contingencia",
    value: "€400",
    note: "se activa solo si no se llega a meta · requiere autorización de Julián",
    tone: "warning",
  },
  {
    label: "Máximo absoluto",
    value: "€3.500",
    note: "techo duro · no se supera bajo ningún escenario",
    tone: "ember",
  },
];

// ── BLOQUE 2 · 3 escenarios ──────────────────────────────────────
export type ScenarioKey = "conservador" | "base" | "agresivo";

interface Scenario {
  key: ScenarioKey;
  name: string;
  tag: string;
  budget: string;
  cpl: string;
  leads: string;
  /** Trials = 50% del total de leads (regla operativa fija de Bewe) */
  trials: string;
  /** CPT = budget / trials · cost per trial */
  cpt: string;
  improve: string;
  improveNote: string;
  needs: string;
  howTo: string;
  tone: Tone;
}

/**
 * Regla operativa Bewe: del total de leads, 50% deben convertir a trial.
 * Por eso cada escenario reporta también el nº de trials esperado y el CPT.
 *  Conservador  500 leads → 250 trials · CPT €12.40
 *  Base         620 leads → 310 trials · CPT €10.00
 *  Agresivo     778 leads → 389 trials · CPT €9.00
 */
const TRIAL_RATIO = 0.5;

const SCENARIOS: Scenario[] = [
  {
    key: "conservador",
    name: "Conservador",
    tag: "Piso 500",
    budget: "€3.100",
    cpl: "€6.20",
    leads: "500",
    trials: "250",
    cpt: "€12.40",
    improve: "-19%",
    improveNote: "optimización básica",
    needs: "Apagar perdedores a tiempo y escalar lo que ya rinde. Piso comprometido.",
    howTo: "Apagar lo caro a tiempo + escalar solo Lookalike (las baratas). Casi sin depender de los videos nuevos.",
    tone: "ember",
  },
  {
    key: "base",
    name: "Base",
    tag: "Objetivo central",
    budget: "€3.100",
    cpl: "€5.00",
    leads: "620",
    trials: "310",
    cpt: "€10.00",
    improve: "-35%",
    improveNote: "optimización media",
    needs: "Refresh creativo anti-fatiga + servicios escalando la última semana de mayo + comercio apagado.",
    howTo: "75-80% del budget concentrado en belleza (que ya validamos) + refresh creativo anti-fatiga + servicios escala lo que rindió la última semana de mayo. Comercio queda apagado.",
    tone: "cyan",
  },
  {
    key: "agresivo",
    name: "Agresivo",
    tag: "Con contingencia",
    budget: "€3.500",
    cpl: "€4.50",
    leads: "778",
    trials: "389",
    cpt: "€9.00",
    improve: "-41%",
    improveNote: "todo se alinea",
    needs: "Belleza Clientes Potenciales rinde + 6 videos perro-mucho funcionan + se activa contingencia €400.",
    howTo: "Belleza Clientes Potenciales rinde + 6 videos de 'perro mucho' funcionan + se activan €400 de contingencia. Es el escenario si todo se alinea.",
    tone: "success",
  },
];

const CPL_BASELINE = "€7.66";

// ── BLOQUE 2b · Qué pasó en mayo · aprendizajes ──────────────────
interface LearnNumber {
  label: string;
  value: string;
  note: string;
  tone: Tone;
}

/** Total CRM (PostHog) · hardcodeado hasta conectar la API real. */
const CRM_LEADS_TOTAL = 428;

/**
 * Computa los números reales del mes desde el store live (Meta API).
 * Antes estaban hardcodeados · ahora reflejan el dashboard en vivo.
 */
function buildMayNumbers(monthly: ReturnType<typeof computeMonthlyTotals>): LearnNumber[] {
  const spend = monthly.spend;
  const metaLeads = monthly.leads;
  const cplCRM = CRM_LEADS_TOTAL > 0 ? spend / CRM_LEADS_TOTAL : 0;
  const cplMeta = metaLeads > 0 ? spend / metaLeads : 0;
  return [
    {
      label: "Gasto acumulado",
      value: fmt.eur(spend, { decimals: 0 }),
      note: `día ${monthly.daysElapsed} del plan`,
      tone: "cyan",
    },
    {
      label: "Leads en CRM",
      value: String(CRM_LEADS_TOTAL),
      note: "totales (PostHog)",
      tone: "success",
    },
    {
      label: "Leads en Meta",
      value: String(metaLeads),
      note: "CompleteRegistration",
      tone: "violet",
    },
    {
      label: "CPL CRM (general)",
      value: cplCRM > 0 ? fmt.eur(cplCRM) : "—",
      note: `${fmt.eur(spend, { decimals: 0 })} / ${CRM_LEADS_TOTAL}`,
      tone: "success",
    },
    {
      label: "CPL Meta (puro)",
      value: cplMeta > 0 ? fmt.eur(cplMeta) : "—",
      note: `${fmt.eur(spend, { decimals: 0 })} / ${metaLeads}`,
      tone: "ember",
    },
  ];
}

interface LearnRow {
  text: string;
  detail?: string;
}

interface LearnBlock {
  title: string;
  icon: React.ReactNode;
  tone: Tone;
  rows: LearnRow[];
}

const MAY_LEARNINGS: LearnBlock[] = [
  {
    title: "Qué funcionó · replicar",
    icon: <CheckCircle2 className="size-3.5" />,
    tone: "success",
    rows: [
      { text: "linda_v1_asp", detail: "CPL €3.88 · CTR 2.20% · el mejor anuncio de toda la cuenta" },
      { text: "paraguas_v2_asp LATAM", detail: "CPL €5.49 (mismo creativo €9.72 en MX · LATAM más barato)" },
      { text: "Audiencias Lookalike", detail: "las más baratas (€3.98 - €7.13)" },
      { text: "Retargeting bajó el CPL blend la última semana" },
    ],
  },
  {
    title: "Qué pasó · por qué",
    icon: <Lightbulb className="size-3.5" />,
    tone: "warning",
    rows: [
      { text: "Belleza con objetivo Ventas dio CPL €7-8", detail: "caro para nosotros" },
      { text: "Servicios con objetivo Clientes Potenciales bajó a €4.32", detail: "señal clara" },
      { text: "Comercio CPL €25", detail: "pausada definitiva" },
      { text: "Mayo tuvo MUCHAS imágenes y POCOS videos", detail: "frecuencia subió rápido" },
    ],
  },
  {
    title: "Qué replicamos en junio",
    icon: <Repeat className="size-3.5" />,
    tone: "cyan",
    rows: [
      { text: "El ángulo de linda en belleza y servicios" },
      { text: "Audiencias Lookalike como núcleo" },
      { text: "Concentración en belleza 75-80%" },
    ],
  },
  {
    title: "Qué cambiamos",
    icon: <RefreshCw className="size-3.5" />,
    tone: "violet",
    rows: [
      { text: "Pausar comercio definitivo" },
      { text: "Refresh creativo (paraguas y mkt fatigados con 68-71K impresiones)" },
      { text: "Sumar adset de interés amplio" },
      { text: "Activar videos del perro-mucho (40M COP ya pagados)" },
    ],
  },
  {
    title: "Qué hacemos diferente",
    icon: <Sparkles className="size-3.5" />,
    tone: "ember",
    rows: [
      { text: "MÁS VIDEO que mayo", detail: "es lo que falta" },
      { text: "Formatos: 4:5 para feed/posts · 9:16 para stories y reels", detail: "volvemos al clásico para comparar vs cinematográfico" },
      { text: "Probar 2 estrategias de landing en paralelo", detail: "(A) seguir por industria · (B) llevar a funcionalidad específica con perro-mucho" },
    ],
  },
];

// ── BLOQUE 2c · Por qué confiamos que el CPL baja ─────────────────
const WHY_CPL_DROPS: string[] = [
  "Más push de belleza (75-80%): las 2 activas que rinden + servicios que se destacó la última semana",
  "Nuevas campañas en Clientes Potenciales (el objetivo histórico de Bewe que mejor convirtió en mayo · CPL €4.32 en servicios)",
  "Retargeting se ajusta · baja budget para alimentar más a belleza LATAM (más barato)",
  "Videos del perro-mucho (40M COP ya pagados) refrescan creativos",
  "Adset de interés amplio + Lookalike = audiencias más eficientes",
];

// ── BLOQUE 3 · Plan semanal interactivo por escenario ────────────
interface WeekRow {
  week: string;
  phase: string;
  days: string;
  leadsDay: string;
  cpl: string;
  perWeekLeads: string;
  /** Trials esperados (50% de leads de la semana) */
  perWeekTrials: string;
  /** CPT semanal = €/sem / trials de la semana */
  cpt: string;
  perWeek: string;
  tone: Tone;
}

interface WeeklyPlan {
  rows: WeekRow[];
  totalLeads: string;
  totalTrials: string;
  totalSpend: string;
  totalCpt: string;
}

/**
 * Distribución semanal · cada escenario suma EXACTO al budget y leads
 * declarados en SCENARIOS arriba (Conservador 500 · Base 620 · Agresivo 778).
 *
 *  Conservador  €3.100 · blend €6.20
 *    S1 €735  / 105 lds · S2 €1.085 / 175 lds · S3 €870 / 150 lds · S4 €410 / 75 lds
 *  Base         €3.100 · blend €5.00
 *    S1 €715  / 110 lds · S2 €1.000 / 200 lds · S3 €880 / 195 lds · S4 €505 / 115 lds
 *  Agresivo     €3.500 · blend €4.50
 *    S1 €770  / 140 lds · S2 €1.190 / 265 lds · S3 €1.030 / 245 lds · S4 €510 / 128 lds
 */
const WEEKLY_BY_SCENARIO: Record<ScenarioKey, WeeklyPlan> = {
  conservador: {
    rows: [
      { week: "Sem 1", phase: "arranque", days: "1-7", leadsDay: "15", cpl: "€7.00", perWeekLeads: "105", perWeekTrials: "52", cpt: "€14.10", perWeek: "€735", tone: "warning" },
      { week: "Sem 2", phase: "push", days: "8-14", leadsDay: "25", cpl: "€6.20", perWeekLeads: "175", perWeekTrials: "87", cpt: "€12.50", perWeek: "€1.085", tone: "cyan" },
      { week: "Sem 3", phase: "estabilizar", days: "15-21", leadsDay: "21", cpl: "€5.80", perWeekLeads: "150", perWeekTrials: "75", cpt: "€11.60", perWeek: "€870", tone: "violet" },
      { week: "Sem 4", phase: "taper", days: "22-30", leadsDay: "8", cpl: "€5.50", perWeekLeads: "75", perWeekTrials: "37", cpt: "€11.10", perWeek: "€410", tone: "success" },
    ],
    totalLeads: "~505 leads",
    totalTrials: "~250 trials",
    totalSpend: "€3.100",
    totalCpt: "€12.40",
  },
  base: {
    rows: [
      { week: "Sem 1", phase: "arranque", days: "1-7", leadsDay: "16", cpl: "€6.50", perWeekLeads: "110", perWeekTrials: "55", cpt: "€13.00", perWeek: "€715", tone: "warning" },
      { week: "Sem 2", phase: "push", days: "8-14", leadsDay: "29", cpl: "€5.00", perWeekLeads: "200", perWeekTrials: "100", cpt: "€10.00", perWeek: "€1.000", tone: "cyan" },
      { week: "Sem 3", phase: "estabilizar", days: "15-21", leadsDay: "28", cpl: "€4.50", perWeekLeads: "195", perWeekTrials: "97", cpt: "€9.10", perWeek: "€880", tone: "violet" },
      { week: "Sem 4", phase: "taper", days: "22-30", leadsDay: "13", cpl: "€4.40", perWeekLeads: "115", perWeekTrials: "57", cpt: "€8.85", perWeek: "€505", tone: "success" },
    ],
    totalLeads: "~620 leads",
    totalTrials: "~310 trials",
    totalSpend: "€3.100",
    totalCpt: "€10.00",
  },
  agresivo: {
    rows: [
      { week: "Sem 1", phase: "arranque", days: "1-7", leadsDay: "20", cpl: "€5.50", perWeekLeads: "140", perWeekTrials: "70", cpt: "€11.00", perWeek: "€770", tone: "warning" },
      { week: "Sem 2", phase: "push", days: "8-14", leadsDay: "38", cpl: "€4.50", perWeekLeads: "265", perWeekTrials: "132", cpt: "€9.00", perWeek: "€1.190", tone: "cyan" },
      { week: "Sem 3", phase: "estabilizar", days: "15-21", leadsDay: "35", cpl: "€4.20", perWeekLeads: "245", perWeekTrials: "122", cpt: "€8.45", perWeek: "€1.030", tone: "violet" },
      { week: "Sem 4", phase: "taper", days: "22-30", leadsDay: "14", cpl: "€4.00", perWeekLeads: "128", perWeekTrials: "64", cpt: "€7.95", perWeek: "€510", tone: "success" },
    ],
    totalLeads: "~778 leads",
    totalTrials: "~389 trials",
    totalSpend: "€3.500",
    totalCpt: "€9.00",
  },
};

// ── BLOQUE 3b · Proyección diaria de leads (curva ramp · base) ────
type RampPhase = "learning" | "push" | "peak" | "taper";

interface DayProjection {
  day: number;
  leads: number;
  phase: RampPhase;
}

const PHASE_TONE: Record<RampPhase, Tone> = {
  learning: "warning",
  push: "cyan",
  peak: "violet",
  taper: "success",
};

const PHASE_LABEL: Record<RampPhase, string> = {
  learning: "S1 · arranque",
  push: "S2 · push",
  peak: "S3 · estabilizar",
  taper: "S4 · taper",
};

/**
 * 3 curvas diarias · una por escenario. Cada una respeta el total semanal
 * declarado en WEEKLY_BY_SCENARIO.
 */
const DAILY_RAMP_BY_SCENARIO: Record<ScenarioKey, DayProjection[]> = {
  conservador: [
    // Sem 1 · 105 leads · 15/día
    { day: 1, leads: 10, phase: "learning" }, { day: 2, leads: 12, phase: "learning" },
    { day: 3, leads: 14, phase: "learning" }, { day: 4, leads: 15, phase: "learning" },
    { day: 5, leads: 16, phase: "learning" }, { day: 6, leads: 18, phase: "learning" },
    { day: 7, leads: 20, phase: "learning" },
    // Sem 2 · 175 leads · 25/día
    { day: 8, leads: 22, phase: "push" }, { day: 9, leads: 24, phase: "push" },
    { day: 10, leads: 25, phase: "push" }, { day: 11, leads: 25, phase: "push" },
    { day: 12, leads: 26, phase: "push" }, { day: 13, leads: 26, phase: "push" },
    { day: 14, leads: 27, phase: "push" },
    // Sem 3 · 150 leads · 21/día
    { day: 15, leads: 24, phase: "peak" }, { day: 16, leads: 23, phase: "peak" },
    { day: 17, leads: 22, phase: "peak" }, { day: 18, leads: 21, phase: "peak" },
    { day: 19, leads: 21, phase: "peak" }, { day: 20, leads: 20, phase: "peak" },
    { day: 21, leads: 19, phase: "peak" },
    // Sem 4 · 75 leads · 8/día (9 días: 22-30)
    { day: 22, leads: 12, phase: "taper" }, { day: 23, leads: 11, phase: "taper" },
    { day: 24, leads: 9, phase: "taper" }, { day: 25, leads: 8, phase: "taper" },
    { day: 26, leads: 8, phase: "taper" }, { day: 27, leads: 7, phase: "taper" },
    { day: 28, leads: 7, phase: "taper" }, { day: 29, leads: 7, phase: "taper" },
    { day: 30, leads: 6, phase: "taper" },
  ],
  base: [
    // Sem 1 · 110 leads · 16/día
    { day: 1, leads: 11, phase: "learning" }, { day: 2, leads: 13, phase: "learning" },
    { day: 3, leads: 15, phase: "learning" }, { day: 4, leads: 16, phase: "learning" },
    { day: 5, leads: 17, phase: "learning" }, { day: 6, leads: 18, phase: "learning" },
    { day: 7, leads: 20, phase: "learning" },
    // Sem 2 · 200 leads · 29/día
    { day: 8, leads: 26, phase: "push" }, { day: 9, leads: 27, phase: "push" },
    { day: 10, leads: 28, phase: "push" }, { day: 11, leads: 29, phase: "push" },
    { day: 12, leads: 30, phase: "push" }, { day: 13, leads: 30, phase: "push" },
    { day: 14, leads: 30, phase: "push" },
    // Sem 3 · 195 leads · 28/día
    { day: 15, leads: 30, phase: "peak" }, { day: 16, leads: 29, phase: "peak" },
    { day: 17, leads: 28, phase: "peak" }, { day: 18, leads: 28, phase: "peak" },
    { day: 19, leads: 28, phase: "peak" }, { day: 20, leads: 27, phase: "peak" },
    { day: 21, leads: 25, phase: "peak" },
    // Sem 4 · 115 leads · 13/día
    { day: 22, leads: 16, phase: "taper" }, { day: 23, leads: 15, phase: "taper" },
    { day: 24, leads: 14, phase: "taper" }, { day: 25, leads: 13, phase: "taper" },
    { day: 26, leads: 13, phase: "taper" }, { day: 27, leads: 12, phase: "taper" },
    { day: 28, leads: 11, phase: "taper" }, { day: 29, leads: 11, phase: "taper" },
    { day: 30, leads: 10, phase: "taper" },
  ],
  agresivo: [
    // Sem 1 · 140 leads · 20/día
    { day: 1, leads: 14, phase: "learning" }, { day: 2, leads: 17, phase: "learning" },
    { day: 3, leads: 19, phase: "learning" }, { day: 4, leads: 20, phase: "learning" },
    { day: 5, leads: 22, phase: "learning" }, { day: 6, leads: 23, phase: "learning" },
    { day: 7, leads: 25, phase: "learning" },
    // Sem 2 · 265 leads · 38/día
    { day: 8, leads: 34, phase: "push" }, { day: 9, leads: 36, phase: "push" },
    { day: 10, leads: 38, phase: "push" }, { day: 11, leads: 38, phase: "push" },
    { day: 12, leads: 39, phase: "push" }, { day: 13, leads: 40, phase: "push" },
    { day: 14, leads: 40, phase: "push" },
    // Sem 3 · 245 leads · 35/día
    { day: 15, leads: 38, phase: "peak" }, { day: 16, leads: 37, phase: "peak" },
    { day: 17, leads: 36, phase: "peak" }, { day: 18, leads: 35, phase: "peak" },
    { day: 19, leads: 34, phase: "peak" }, { day: 20, leads: 33, phase: "peak" },
    { day: 21, leads: 32, phase: "peak" },
    // Sem 4 · 128 leads · 14/día
    { day: 22, leads: 18, phase: "taper" }, { day: 23, leads: 17, phase: "taper" },
    { day: 24, leads: 15, phase: "taper" }, { day: 25, leads: 14, phase: "taper" },
    { day: 26, leads: 14, phase: "taper" }, { day: 27, leads: 13, phase: "taper" },
    { day: 28, leads: 13, phase: "taper" }, { day: 29, leads: 12, phase: "taper" },
    { day: 30, leads: 12, phase: "taper" },
  ],
};

// ── BLOQUE 4 · Reglas para darle norte a la pauta ────────────────
interface Rule {
  text: string;
  tone: Tone;
}

const RULES: Rule[] = [
  { text: "No cambiar el presupuesto de golpe. Subimos de a poco para no romper lo que Facebook ya venía haciendo bien.", tone: "warning" },
  { text: "Si un anuncio trae registros a más de €9 cada uno (tras unos días de prueba), lo apagamos.", tone: "ember" },
  { text: "El 75-80% de la plata va a Belleza siempre. Es lo que mejor convierte · es el motor de leads.", tone: "success" },
  { text: "No miramos solo registros baratos: miramos cuáles llegan a probar el producto. Un registro que no prueba, no sirve.", tone: "violet" },
  { text: "Chequeo del día 7: si el costo por registro sigue alto (más de €6.5), decidimos: traer menos por día, o pedir el presupuesto extra de €400.", tone: "destructive" },
  { text: "El resto se reparte: un poco a Servicios (otro nicho) y a recuperar gente que ya nos conoce.", tone: "cyan" },
];

// ── BLOQUE 5 · Plan de assets (cantidades exactas) ───────────────
interface AssetGroup {
  label: string;
  tagline: string;
  tone: Tone;
  icon: React.ReactNode;
  items: AssetItem[];
}

interface AssetItem {
  count: number;
  kind: "imagen" | "video";
  format: string;
  description: string;
  highlight?: boolean;
}

const ASSETS: AssetGroup[] = [
  {
    label: "Belleza",
    tagline: "refuerzo aprendizaje + funcionalidad + perro-mucho",
    tone: "ember",
    icon: <Sparkles className="size-3.5" />,
    items: [
      { count: 12, kind: "imagen", format: "4:5", description: "refresh para TODAS las campañas de belleza (J1 MX, J2 LATAM, J3 Belleza CP)" },
      { count: 3, kind: "video", format: "9:16", description: "funcionalidad + beneficio en centros de belleza/barberías + linda · stories/reels" },
      { count: 6, kind: "video", format: "9:16", description: "editados con el contenido del perro-mucho · atribuidos a funcionalidades · stories/reels", highlight: true },
    ],
  },
  {
    label: "Servicios",
    tagline: "refuerzan campaña actual",
    tone: "success",
    icon: <Target className="size-3.5" />,
    items: [
      { count: 2, kind: "imagen", format: "4:5", description: "imágenes nuevas que refuerzan la campaña actual" },
    ],
  },
  {
    label: "Tools",
    tagline: "una pieza por tool gratis",
    tone: "cyan",
    icon: <Wrench className="size-3.5" />,
    items: [
      { count: 3, kind: "imagen", format: "4:5", description: "una por cada tool (calculadora ROI, auditoría IG, comparador local)" },
      { count: 3, kind: "video", format: "9:16", description: "alta conversión, llevan a tool específica" },
    ],
  },
  {
    label: "Remarketing",
    tagline: "recuperación + onboarding directo",
    tone: "violet",
    icon: <RefreshCw className="size-3.5" />,
    items: [
      { count: 2, kind: "imagen", format: "4:5", description: "recuperación / cuenta a un paso" },
      { count: 1, kind: "video", format: "9:16", description: "funcionalidad PII concreta · redirige directo a ONBOARDING (no a registro)", highlight: true },
    ],
  },
  {
    label: "Academy",
    tagline: "cortes 40M COP + curso IA PYMES",
    tone: "warning",
    icon: <GraduationCap className="size-3.5" />,
    items: [
      { count: 3, kind: "video", format: "9:16", description: "cortes de los 40M COP en videos ya pagados" },
      {
        count: 1,
        kind: "video",
        format: "9:16",
        description: "Curso IA para PYMES · gancho: \"Bienvenidos al primer curso de inteligencia artificial enfocado en pequeños negocios. Búscalo en YouTube o haz click e inicia de 0 a 100 para entender la IA hoy en 2026.\"",
        highlight: true,
      },
    ],
  },
];

const LANDING_STRATEGIES: { letter: "A" | "B"; title: string; detail: string; tone: Tone }[] = [
  {
    letter: "A",
    title: "Seguir por industria",
    detail: "UTMs e industria como hoy (belleza, servicios). La estrategia que veníamos usando.",
    tone: "cyan",
  },
  {
    letter: "B",
    title: "Llevar a funcionalidad",
    detail: "Usar videos perro-mucho para llevar a funcionalidades concretas (linda, CRM, agenda, marketing automatizado) y ver cómo convierten esas landings.",
    tone: "violet",
  },
];

// ── BLOQUE 6 · Mejores anuncios mayo ─────────────────────────────
interface AdRow {
  ad: string;
  campaign: string;
  impr: string;
  ctr: string;
  cpm: string;
  cpl: string;
  action: string;
  tone: Tone;
}

const BEST_ADS: AdRow[] = [
  {
    ad: "linda_imagen_v1_asp",
    campaign: "Servicios MX",
    impr: "11.735",
    ctr: "2.20%",
    cpm: "€3.64",
    cpl: "€3.88",
    action: "REPLICAR",
    tone: "success",
  },
  {
    ad: "paraguas_imagen_v2_asp",
    campaign: "LATAM Belleza",
    impr: "23.131",
    ctr: "1.62%",
    cpm: "€1.90",
    cpl: "€5.49",
    action: "REPLICAR",
    tone: "success",
  },
  {
    ad: "mkt_imagen_v1_dol",
    campaign: "LATAM Belleza",
    impr: "71.528",
    ctr: "1.33%",
    cpm: "€2.11",
    cpl: "€7.56",
    action: "VOLUMEN",
    tone: "cyan",
  },
  {
    ad: "paraguas_imagen_v2_asp",
    campaign: "MX Belleza",
    impr: "68.654",
    ctr: "1.59%",
    cpm: "€2.55",
    cpl: "€9.72",
    action: "MEJORAR",
    tone: "ember",
  },
];

// ── BLOQUE 7 · Lifecycle (qué se prende / queda / nuevo / apagado) ─
type LifecycleAction = "activa" | "nueva" | "ajusta" | "apagada";

interface LifecycleItem {
  name: string;
  objetivo: string;
  why: string;
}

interface LifecycleGroup {
  action: LifecycleAction;
  title: string;
  caption: string;
  tone: Tone;
  items: LifecycleItem[];
}

const LIFECYCLE_LABEL: Record<LifecycleAction, string> = {
  activa: "QUEDAN ACTIVAS",
  nueva: "SE PRENDEN NUEVAS",
  ajusta: "SE AJUSTA",
  apagada: "QUEDAN APAGADAS",
};

const LIFECYCLE: LifecycleGroup[] = [
  {
    action: "activa",
    title: "Quedan activas",
    caption: "sin reiniciar aprendizaje · venían corriendo",
    tone: "success",
    items: [
      {
        name: "MX Belleza",
        objetivo: "Ventas",
        why: "Venía corriendo · no la tocamos para no reiniciar el aprendizaje de Facebook.",
      },
      {
        name: "LATAM Belleza",
        objetivo: "Ventas",
        why: "Venía corriendo · es el motor de volumen de leads, se mantiene viva.",
      },
      {
        name: "Servicios",
        objetivo: "Clientes Potenciales",
        why: "Venía corriendo y trae el registro más barato de la cuenta. Se mantiene.",
      },
    ],
  },
  {
    action: "nueva",
    title: "Se prenden nuevas",
    caption: "arrancan lunes 1 jun",
    tone: "violet",
    items: [
      {
        name: "Belleza · Clientes Potenciales",
        objetivo: "Clientes Potenciales",
        why: "Mismo perfil de belleza con el objetivo histórico de Bewe (Clientes Potenciales) · CBO para que Meta decida qué adset prioriza.",
      },
      {
        name: "Tools + Academy",
        objetivo: "Tráfico / atracción",
        why: "Atrae gente nueva que todavía no nos conoce, con videos ya pagados y herramientas gratis de gancho.",
      },
    ],
  },
  {
    action: "ajusta",
    title: "Se ajusta",
    caption: "cambio de estructura",
    tone: "cyan",
    items: [
      {
        name: "Retargeting",
        objetivo: "Ventas",
        why: "Fusionamos los 2 conjuntos actuales en 1 solo para concentrar el presupuesto y que salga de aprendizaje. En mayo, partido en dos, daba registros caros (€13).",
      },
    ],
  },
  {
    action: "apagada",
    title: "Quedan apagadas",
    caption: "no rinden · no las prendemos",
    tone: "ember",
    items: [
      {
        name: "MX Comercio",
        objetivo: "Ventas",
        why: "Registro a €25, demasiado caro · pausada definitiva.",
      },
      {
        name: "LATAM Comercio",
        objetivo: "Ventas",
        why: "Audiencia saturada · ya no rinde.",
      },
      {
        name: "LATAM Servicios IC",
        objetivo: "Clientes Potenciales",
        why: "Audiencia saturada · la pausamos para no quemar plata.",
      },
    ],
  },
];

// ── BLOQUE 8 · Desglose campaña → conjunto → anuncio ─────────────
type AdsetAction =
  | "ESCALAR"
  | "MANTENER"
  | "REVISAR"
  | "NUEVO"
  | "FUSIONAR";

const ADSET_ACTION_TONE: Record<AdsetAction, Tone> = {
  ESCALAR: "success",
  MANTENER: "cyan",
  REVISAR: "ember",
  NUEVO: "violet",
  FUSIONAR: "warning",
};

type AudienceKind =
  | "Lookalike"
  | "Interés"
  | "Custom"
  | "Remarketing";

const AUDIENCE_HINT: Record<AudienceKind, string> = {
  Lookalike: "audiencia similar a clientes",
  Interés: "gente por sus intereses",
  Custom: "lista propia (engagers)",
  Remarketing: "gente que ya nos conoce",
};

interface Adset {
  name: string;
  audience: AudienceKind;
  perDay: string;
  cplMay: string | null;
  action: AdsetAction;
  note: string;
}

type CampaignRole = "motor" | "apoyo" | "atraccion";

interface CampaignBreakdown {
  code: string;
  name: string;
  objetivo: string;
  objetivoTone: Tone;
  /** perDay/cplMeta legacy · ya no se renderizan en desglose
   * (los números viven en la tabla operativa scenario-aware) */
  perDay: string;
  cplMeta: string;
  tagline: string;
  adsets: Adset[];
  ads: string;
  /** Rol estratégico · agrupa el desglose por función */
  role: CampaignRole;
  /** Status de lifecycle · activa/nueva/ajusta */
  status: "Activa" | "Nueva" | "Ajusta";
}

const ROLE_META: Record<
  CampaignRole,
  { title: string; sub: string; share: string; tone: Tone; icon: React.ReactNode }
> = {
  motor: {
    title: "Motor de leads · BELLEZA",
    sub: "75-80% del budget · el vertical que ya validamos en mayo",
    share: "75-80%",
    tone: "ember",
    icon: <Sparkles className="size-3.5" />,
  },
  apoyo: {
    title: "Apoyos · SERVICIOS + REMARKETING",
    sub: "15-20% del budget · diversificación con CPL bajo + recuperación",
    share: "15-20%",
    tone: "cyan",
    icon: <Target className="size-3.5" />,
  },
  atraccion: {
    title: "Atracción nueva · TOOLS + ACADEMY",
    sub: "5-10% del budget · gente nueva con contenido ya pagado",
    share: "5-10%",
    tone: "violet",
    icon: <Wrench className="size-3.5" />,
  },
};

const STATUS_TONE: Record<CampaignBreakdown["status"], Tone> = {
  Activa: "success",
  Nueva: "violet",
  Ajusta: "cyan",
};

const BREAKDOWN: CampaignBreakdown[] = [
  {
    code: "J1",
    name: "MX Belleza",
    objetivo: "Ventas",
    objetivoTone: "cyan",
    perDay: "€26/día",
    cplMeta: "meta CPL €4-5",
    tagline: "Recuperar el conjunto barato que estaba pausado.",
    adsets: [
      {
        name: "A1.1 LOK Belleza",
        audience: "Lookalike",
        perDay: "€12/día",
        cplMay: "€5.03",
        action: "ESCALAR",
        note: "Era el mejor de MX y estaba pausado · lo prendemos fuerte.",
      },
      {
        name: "A1.2 CA Engagers",
        audience: "Custom",
        perDay: "€6/día",
        cplMay: "€9.16",
        action: "REVISAR",
        note: "El peor ROI de mayo (gastó €293 caro) · bajamos budget + refresh creativo.",
      },
      {
        name: "A1.4 Interés amplio",
        audience: "Interés",
        perDay: "€8/día",
        cplMay: null,
        action: "NUEVO",
        note: "Probar cobertura amplia para llegar a gente nueva.",
      },
    ],
    ads: "paraguas (reemplazar por VIDEO nuevo · fatigado 68K impresiones) + mkt + videos nuevos.",
    role: "motor",
    status: "Activa",
  },
  {
    code: "J2",
    name: "LATAM Belleza",
    objetivo: "Ventas",
    objetivoTone: "cyan",
    perDay: "€22/día",
    cplMeta: "meta CPL €3.5-5",
    tagline: "Mantener el rey del volumen y probar interés amplio.",
    adsets: [
      {
        name: "A4.1 LOK Belleza",
        audience: "Lookalike",
        perDay: "€14/día",
        cplMay: "€7.13",
        action: "MANTENER",
        note: "Rey del volumen · es el conjunto que más leads trae.",
      },
      {
        name: "A4.2 Interés amplio",
        audience: "Interés",
        perDay: "€8/día",
        cplMay: null,
        action: "NUEVO",
        note: "Reemplaza el conjunto de interés pausado · probar audiencia amplia.",
      },
    ],
    ads: "mkt_v1_dol (volumen 71K impresiones) + paraguas LATAM (€5.49 bueno) + videos perro-mucho.",
    role: "motor",
    status: "Activa",
  },
  {
    code: "J3",
    name: "Belleza Clientes Potenciales",
    objetivo: "Clientes Potenciales",
    objetivoTone: "violet",
    perDay: "€20/día",
    cplMeta: "meta CPL €3 · CBO",
    tagline: "Campaña nueva CBO · Meta decide qué adset prioriza.",
    adsets: [
      {
        name: "LOK Belleza LATAM",
        audience: "Lookalike",
        perDay: "€12/día",
        cplMay: null,
        action: "NUEVO",
        note: "Mismo perfil Lookalike que funciona en Ventas, ahora con objetivo Clientes Potenciales.",
      },
      {
        name: "Interés amplio",
        audience: "Interés",
        perDay: "€8/día",
        cplMay: null,
        action: "NUEVO",
        note: "Cobertura amplia · CBO decide cuánto le da según rendimiento.",
      },
    ],
    ads: "ganadores de belleza (mkt, paraguas, linda) + 6 videos perro-mucho.",
    role: "motor",
    status: "Nueva",
  },
  {
    code: "J4",
    name: "Servicios",
    objetivo: "Clientes Potenciales",
    objetivoTone: "violet",
    perDay: "€14/día",
    cplMeta: "meta CPL €4",
    tagline: "Escalar el mejor conjunto de toda la cuenta.",
    adsets: [
      {
        name: "A3.1 LOK Servicios",
        audience: "Lookalike",
        perDay: "€9/día",
        cplMay: "€3.98",
        action: "ESCALAR",
        note: "El MEJOR de toda la cuenta · le metemos más plata.",
      },
      {
        name: "A3.2 INT Servicios",
        audience: "Interés",
        perDay: "€5/día",
        cplMay: "€5.49",
        action: "MANTENER",
        note: "Rinde bien · lo sostenemos como está.",
      },
    ],
    ads: "linda (€3.88 · el mejor anuncio de todos) + 3 videos servicios + 2 imágenes nuevas.",
    role: "apoyo",
    status: "Activa",
  },
  {
    code: "J5",
    name: "Retargeting",
    objetivo: "Ventas",
    objetivoTone: "cyan",
    perDay: "€12/día",
    cplMeta: "validar CPL",
    tagline: "Fusionar todo en un solo conjunto para que salga de aprendizaje.",
    adsets: [
      {
        name: "RMKT Apilado (fusión)",
        audience: "Remarketing",
        perDay: "€12/día",
        cplMay: "€12.97",
        action: "FUSIONAR",
        note: "Juntamos Visitantes 30d + Checkout + Engagers + Tool users en 1 solo conjunto · concentrar para salir de aprendizaje. En mayo, partido en 2, daba CPL €13.",
      },
    ],
    ads: "2 imágenes recuperación + 1 video PII a ONBOARDING directo.",
    role: "apoyo",
    status: "Ajusta",
  },
  {
    code: "J6",
    name: "Tools + Academy",
    objetivo: "Tráfico / LPV",
    objetivoTone: "cyan",
    perDay: "€6/día",
    cplMeta: "atracción",
    tagline: "Atraer gente nueva con contenido ya pagado.",
    adsets: [
      {
        name: "Interés PYME amplio",
        audience: "Interés",
        perDay: "€6/día",
        cplMay: null,
        action: "NUEVO",
        note: "Cobertura amplia de pequeñas y medianas empresas.",
      },
    ],
    ads: "3 cortes 40M COP + 1 video curso IA PYMES + 3 tools (calculadora ROI, auditoría IG, comparador).",
    role: "atraccion",
    status: "Nueva",
  },
];

function tw(tone: Tone, alpha: number): string {
  return `hsl(${TOKEN[tone]} / ${alpha})`;
}

// ── Sub-componente · Curva diaria de leads ───────────────────────
function DailyRampChart({ scenario }: { scenario: ScenarioKey }) {
  const W = 800;
  const H = 300;
  const M = { top: 36, right: 56, bottom: 34, left: 40 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const days = DAILY_RAMP_BY_SCENARIO[scenario];
  const n = days.length;

  // Eje Y dinámico según escenario · agresivo llega a ~41/día, base a 31, conservador a 27
  const maxDayLeads = Math.max(...days.map((d) => d.leads));
  const yMaxLeads = Math.ceil((maxDayLeads + 5) / 5) * 5;
  const yLeads = (v: number): number => M.top + plotH - (v / yMaxLeads) * plotH;

  let running = 0;
  const cumulative = days.map((d) => {
    running += d.leads;
    return running;
  });
  const total = running;
  const yMaxCum = Math.max(640, Math.ceil((total + 50) / 100) * 100);
  const yCum = (v: number): number => M.top + plotH - (v / yMaxCum) * plotH;

  const slot = plotW / n;
  const barGap = slot * 0.22;
  const barW = slot - barGap;
  const barX = (i: number): number => M.left + i * slot + barGap / 2;

  const cumX = (i: number): number => barX(i) + barW / 2;
  const cumPath = cumulative
    .map((c, i) => `${i === 0 ? "M" : "L"} ${cumX(i).toFixed(1)} ${yCum(c).toFixed(1)}`)
    .join(" ");

  const crossIdx = cumulative.findIndex((c) => c >= 500);
  const crossDay = crossIdx >= 0 ? days[crossIdx].day : null;

  const goalY = yCum(500);

  const weekStarts = [0, 7, 14, 21];
  const weekDivX = (startIdx: number): number => M.left + startIdx * slot;

  const xTicks = [1, 7, 14, 21, 30];
  // Eje Y · ticks proporcionales al máximo (cada ~yMaxLeads/4)
  const yTicks = (() => {
    const step = Math.max(5, Math.round(yMaxLeads / 4 / 5) * 5);
    const out: number[] = [];
    for (let v = 0; v <= yMaxLeads; v += step) out.push(v);
    return out;
  })();

  const peakDay = days.reduce((a, b) => (b.leads > a.leads ? b : a));
  const day22Cum = cumulative[21];

  const scenarioLabel: Record<ScenarioKey, string> = {
    conservador: "conservador",
    base: "base",
    agresivo: "agresivo",
  };

  const day22Note = day22Cum >= 500 ? "supera la meta de 500" : `${500 - day22Cum} para meta`;

  const stats = [
    { label: "Pico", value: `${peakDay.leads} leads/día`, note: "sem 2-3", tone: "violet" as Tone },
    { label: "Al día 22", value: `~${day22Cum} acum`, note: day22Note, tone: "cyan" as Tone },
    { label: "Cierre", value: `~${total} leads`, note: `total · escenario ${scenarioLabel[scenario]}`, tone: "success" as Tone },
  ];

  const legend: { label: string; tone: Tone }[] = [
    { label: "Sem 1 · arranque", tone: PHASE_TONE.learning },
    { label: "Sem 2 · push", tone: PHASE_TONE.push },
    { label: "Sem 3 · estabilizar", tone: PHASE_TONE.peak },
    { label: "Sem 4 · taper", tone: PHASE_TONE.taper },
  ];

  return (
    <TextureCard className="p-5">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-3"
            style={{
              borderColor: tw(s.tone, 0.35),
              background: `linear-gradient(135deg, ${tw(s.tone, 0.08)}, hsl(var(--card)))`,
            }}
          >
            <div className="text-[9px] uppercase tracking-[0.1em] font-bold text-muted-foreground">
              {s.label}
            </div>
            <div
              className="font-mono text-xl font-bold tabular-nums leading-tight"
              style={{ color: `hsl(${TOKEN[s.tone]})` }}
            >
              {s.value}
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          role="img"
          aria-label="Proyección diaria de leads durante junio · escenario base"
        >
          {yTicks.map((t) => (
            <g key={`gy-${t}`}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={yLeads(t)}
                y2={yLeads(t)}
                stroke="hsl(var(--border) / 0.35)"
                strokeWidth={1}
              />
              <text
                x={M.left - 6}
                y={yLeads(t) + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: 9, fontFamily: "var(--font-mono, monospace)" }}
              >
                {t}
              </text>
            </g>
          ))}

          {weekStarts.map((startIdx, wi) => {
            const phase = days[startIdx].phase;
            const x = weekDivX(startIdx);
            const labelX = x + (startIdx === 21 ? slot * 4.5 : slot * 3.5);
            return (
              <g key={`wk-${wi}`}>
                {wi > 0 && (
                  <line
                    x1={x}
                    x2={x}
                    y1={M.top - 8}
                    y2={M.top + plotH}
                    stroke="hsl(var(--border) / 0.6)"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                )}
                <text
                  x={labelX}
                  y={M.top - 14}
                  textAnchor="middle"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}
                  fill={`hsl(${TOKEN[PHASE_TONE[phase]]})`}
                >
                  {PHASE_LABEL[phase]}
                </text>
              </g>
            );
          })}

          <line
            x1={M.left}
            x2={W - M.right}
            y1={goalY}
            y2={goalY}
            stroke="hsl(var(--destructive) / 0.7)"
            strokeWidth={1.25}
            strokeDasharray="6 4"
          />
          <text
            x={W - M.right - 2}
            y={goalY - 5}
            textAnchor="end"
            style={{ fontSize: 9, fontWeight: 700 }}
            fill="hsl(var(--destructive))"
          >
            Meta mínima · 500 leads
          </text>

          {days.map((d, i) => {
            const tone = PHASE_TONE[d.phase];
            const fullY = yLeads(d.leads);
            const fullH = M.top + plotH - fullY;
            const showLabel = d.day % 3 === 1 || d.leads === peakDay.leads;
            return (
              <g key={`bar-${d.day}`} className="group">
                <motion.rect
                  x={barX(i)}
                  width={barW}
                  rx={2}
                  initial={{ height: 0, y: M.top + plotH }}
                  animate={{ height: fullH, y: fullY }}
                  transition={{ delay: 0.2 + i * 0.022, duration: 0.5, ease: "easeOut" }}
                  fill={tw(tone, 0.78)}
                  className="transition-opacity hover:opacity-100 group-hover:opacity-100"
                >
                  <title>{`Día ${d.day} · ${d.leads} leads · ${d.phase}`}</title>
                </motion.rect>
                {showLabel && (
                  <motion.text
                    x={barX(i) + barW / 2}
                    y={fullY - 4}
                    textAnchor="middle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.022 }}
                    style={{ fontSize: 8, fontWeight: 700 }}
                    fill={`hsl(${TOKEN[tone]})`}
                  >
                    {d.leads}
                  </motion.text>
                )}
              </g>
            );
          })}

          <motion.path
            d={cumPath}
            fill="none"
            stroke="hsl(var(--brand-cyan) / 0.85)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 1.4, ease: "easeInOut" }}
          />

          {crossIdx >= 0 && crossDay !== null && (
            <g>
              <motion.circle
                cx={cumX(crossIdx)}
                cy={yCum(cumulative[crossIdx])}
                r={4}
                fill="hsl(var(--brand-cyan))"
                stroke="hsl(var(--card))"
                strokeWidth={1.5}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.6, type: "spring", stiffness: 300 }}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
              />
              <text
                x={cumX(crossIdx)}
                y={yCum(cumulative[crossIdx]) - 9}
                textAnchor="middle"
                style={{ fontSize: 8.5, fontWeight: 700 }}
                fill="hsl(var(--brand-cyan))"
              >
                {`día ${crossDay} · +500`}
              </text>
            </g>
          )}

          {[0, 160, 320, 480, 640].map((t) => (
            <text
              key={`yc-${t}`}
              x={W - M.right + 6}
              y={yCum(t) + 3}
              textAnchor="start"
              className="fill-muted-foreground"
              style={{ fontSize: 9, fontFamily: "var(--font-mono, monospace)" }}
            >
              {t}
            </text>
          ))}

          {xTicks.map((dayNum) => {
            const i = dayNum - 1;
            return (
              <text
                key={`xt-${dayNum}`}
                x={cumX(i)}
                y={M.top + plotH + 16}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 9, fontFamily: "var(--font-mono, monospace)" }}
              >
                {dayNum}
              </text>
            );
          })}
          <text
            x={M.left}
            y={H - 4}
            textAnchor="start"
            className="fill-muted-foreground"
            style={{ fontSize: 8.5, letterSpacing: "0.08em" }}
          >
            DÍA DE JUNIO
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border/40">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: `hsl(${TOKEN[l.tone]})` }}
            />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-px bg-[hsl(var(--brand-cyan))]" />
          <span className="text-[10px] text-muted-foreground">Leads acumulados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-4 h-px"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, hsl(var(--destructive)) 0 4px, transparent 4px 8px)",
            }}
          />
          <span className="text-[10px] text-muted-foreground">Meta mínima 500</span>
        </div>
      </div>
    </TextureCard>
  );
}

export function JunioPlan() {
  const [selectedScenario, setSelectedScenario] =
    React.useState<ScenarioKey>("base");

  // Datos LIVE del store · "Qué pasó en mayo" usa estos en lugar de hardcoded.
  const { rawCampaigns, daily } = useDashboard();
  const monthly = React.useMemo(
    () => computeMonthlyTotals(daily, rawCampaigns),
    [daily, rawCampaigns],
  );
  const mayNumbers = React.useMemo(() => buildMayNumbers(monthly), [monthly]);

  const activeScenario =
    SCENARIOS.find((s) => s.key === selectedScenario) ?? SCENARIOS[1];
  const activeWeekly = WEEKLY_BY_SCENARIO[selectedScenario];

  const totalImages = ASSETS.reduce(
    (sum, g) => sum + g.items.filter((i) => i.kind === "imagen").reduce((a, b) => a + b.count, 0),
    0,
  );
  const totalVideos = ASSETS.reduce(
    (sum, g) => sum + g.items.filter((i) => i.kind === "video").reduce((a, b) => a + b.count, 0),
    0,
  );

  return (
    <div className="space-y-7">
      {/* ── BLOQUE 1 · Budget structure (header) ── */}
      <TextureCard className="p-5 border-[hsl(var(--brand-violet)/0.4)] bg-gradient-to-br from-[hsl(var(--brand-violet)/0.08)] via-card to-card">
        <div className="flex items-start gap-3 mb-4">
          <div className="size-11 grid place-items-center rounded-xl bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] shrink-0">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-[hsl(var(--brand-violet))] mb-0.5">
              Plan Junio 2026 · revisión profunda Santiago
            </div>
            <h2 className="text-base font-bold leading-tight">
              Techo €3.100 · contingencia €400 · máximo absoluto €3.500
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
              Lead = CompleteRegistration. CPL blend belleza real mayo (12-28)
              = {CPL_BASELINE}. Objetivo: bajar el CPL semana a semana con
              concentración en belleza (75-80%) + refresh creativo anti-fatiga
              + más video.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {BUDGET.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border p-4"
              style={{
                borderColor: tw(b.tone, 0.4),
                background: `linear-gradient(135deg, ${tw(b.tone, 0.08)}, hsl(var(--card)))`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wallet className="size-3.5" style={{ color: `hsl(${TOKEN[b.tone]})` }} />
                <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-muted-foreground">
                  {b.label}
                </span>
              </div>
              <div
                className="font-mono text-3xl font-bold tabular-nums"
                style={{ color: `hsl(${TOKEN[b.tone]})` }}
              >
                {b.value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                {b.note}
              </div>
            </motion.div>
          ))}
        </div>
      </TextureCard>

      {/* ── BLOQUE 2 · 3 escenarios ── */}
      <section>
        <SectionHeader
          title="3 escenarios"
          sub={`Budget · CPL blend objetivo · leads · % de mejora vs ${CPL_BASELINE} (CPL real mayo)`}
        />
        <div className="grid md:grid-cols-3 gap-3">
          {SCENARIOS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <TextureCard
                className="p-5 h-full flex flex-col"
                style={{
                  borderColor: tw(s.tone, 0.4),
                  background: `linear-gradient(135deg, ${tw(s.tone, 0.08)}, hsl(var(--card)))`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div
                      className="text-[13px] font-bold leading-tight"
                      style={{ color: `hsl(${TOKEN[s.tone]})` }}
                    >
                      {s.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground italic mt-0.5">
                      “{s.tag}”
                    </div>
                  </div>
                  <Badge variant={BADGE_VARIANT[s.tone]} className="!text-[9px] normal-case tracking-normal">
                    {s.improve} CPL
                  </Badge>
                </div>

                {/* Leads + Trials side by side · narrativa principal */}
                <div className="flex items-end justify-between gap-3 mb-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-mono text-4xl font-bold tabular-nums leading-none"
                      style={{ color: `hsl(${TOKEN[s.tone]})` }}
                    >
                      {s.leads}
                    </span>
                    <span className="text-[11px] text-muted-foreground">leads</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 text-muted-foreground">
                    <span className="text-[11px]">→</span>
                    <span
                      className="font-mono text-2xl font-bold tabular-nums leading-none"
                      style={{ color: `hsl(${TOKEN[s.tone]} / 0.85)` }}
                    >
                      {s.trials}
                    </span>
                    <span className="text-[10px]">trials</span>
                  </div>
                </div>
                <div className="text-[9px] text-muted-foreground/70 italic mb-2">
                  50% lead → trial · regla operativa Bewe
                </div>

                {/* 4 KPIs · budget · CPL blend · CPT · mejora */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                  <div className="rounded-lg bg-card/60 border border-border/40 p-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      Budget
                    </div>
                    <div className="font-mono font-bold tabular-nums">{s.budget}</div>
                  </div>
                  <div className="rounded-lg bg-card/60 border border-border/40 p-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      CPL blend
                    </div>
                    <div className="font-mono font-bold tabular-nums">{s.cpl}</div>
                  </div>
                  <div
                    className="rounded-lg p-2"
                    style={{
                      background: tw(s.tone, 0.1),
                      border: `1px solid ${tw(s.tone, 0.35)}`,
                    }}
                  >
                    <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      CPT (costo/trial)
                    </div>
                    <div
                      className="font-mono font-bold tabular-nums"
                      style={{ color: `hsl(${TOKEN[s.tone]})` }}
                    >
                      {s.cpt}
                    </div>
                  </div>
                  <div className="rounded-lg bg-card/60 border border-border/40 p-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      Mejora CPL
                    </div>
                    <div className="font-mono font-bold tabular-nums">{s.improve}</div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                  {s.improveNote}
                </div>

                <div
                  className="mt-3 rounded-lg p-2.5"
                  style={{
                    background: tw(s.tone, 0.1),
                    border: `1px solid ${tw(s.tone, 0.3)}`,
                  }}
                >
                  <span
                    className="text-[9px] uppercase tracking-[0.1em] font-bold block mb-1"
                    style={{ color: `hsl(${TOKEN[s.tone]})` }}
                  >
                    Cómo se logra
                  </span>
                  <span className="text-[11px] text-foreground leading-relaxed">
                    {s.howTo}
                  </span>
                </div>

                <div className="mt-auto pt-3 text-[11px] text-foreground leading-relaxed border-t border-border/40 mt-3">
                  <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-muted-foreground block mb-1">
                    Qué necesita
                  </span>
                  {s.needs}
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BLOQUE 2b · QUÉ PASÓ EN MAYO · APRENDIZAJES ── */}
      <section>
        <SectionHeader
          title="Qué pasó en mayo · aprendizajes"
          sub="La foto cerrada del mes para entender por qué junio se planea así"
        />
        <TextureCard
          className="p-5"
          style={{
            borderColor: tw("violet", 0.4),
            background: `linear-gradient(135deg, ${tw("violet", 0.07)}, hsl(var(--card)))`,
          }}
        >
          {/* Sub 1 · los números del mes */}
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Ratio className="size-3.5 text-[hsl(var(--brand-violet))]" />
              <span className="text-[11px] uppercase tracking-[0.1em] font-bold text-[hsl(var(--brand-violet))]">
                Los números del mes · live de Meta API
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {mayNumbers.map((n) => (
                <div
                  key={n.label}
                  className="rounded-lg border bg-card/50 p-3"
                  style={{ borderColor: tw(n.tone, 0.3) }}
                >
                  <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground font-bold mb-0.5">
                    {n.label}
                  </div>
                  <div
                    className="font-mono text-xl font-bold tabular-nums leading-tight"
                    style={{ color: `hsl(${TOKEN[n.tone]})` }}
                  >
                    {n.value}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                    {n.note}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-1.5 mt-3 px-1">
              <TriangleAlert className="size-3.5 text-[hsl(var(--warning))] mt-px shrink-0" />
              <span className="text-[10.5px] text-muted-foreground/90 italic leading-relaxed">
                El CPL real depende de cuál fuente cuentes. Junio bajamos AMBOS.
              </span>
            </div>
          </div>

          {/* Sub 2-6 · learnings en grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {MAY_LEARNINGS.map((b) => (
              <div
                key={b.title}
                className="rounded-lg border bg-card/40 p-3.5"
                style={{
                  borderColor: tw(b.tone, 0.3),
                  borderLeftWidth: "3px",
                  borderLeftColor: `hsl(${TOKEN[b.tone]})`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span style={{ color: `hsl(${TOKEN[b.tone]})` }}>{b.icon}</span>
                  <span
                    className="text-[11px] uppercase tracking-[0.08em] font-bold"
                    style={{ color: `hsl(${TOKEN[b.tone]})` }}
                  >
                    {b.title}
                  </span>
                </div>
                <ul className="space-y-2">
                  {b.rows.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px]">
                      <CircleDot
                        className="size-3 mt-px shrink-0"
                        style={{ color: `hsl(${TOKEN[b.tone]})` }}
                      />
                      <div className="min-w-0">
                        <span className="text-foreground leading-snug">{r.text}</span>
                        {r.detail && (
                          <span className="text-muted-foreground leading-snug">
                            {" · "}
                            {r.detail}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TextureCard>
      </section>

      {/* ── BLOQUE 2c · Por qué confiamos que el CPL va a bajar ── */}
      <section>
        <TextureCard
          className="p-5"
          style={{
            borderColor: tw("success", 0.4),
            background: `linear-gradient(135deg, ${tw("success", 0.08)}, hsl(var(--card)))`,
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="size-10 grid place-items-center rounded-xl bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))] shrink-0">
              <TrendingDown className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-[hsl(var(--success))] mb-0.5">
                Por qué confiamos
              </div>
              <h3 className="text-[14px] font-bold leading-tight">
                Por qué el CPL va a bajar de {CPL_BASELINE} a €5-6 en junio
              </h3>
            </div>
          </div>
          <ol className="space-y-2">
            {WHY_CPL_DROPS.map((reason, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <span
                  className="size-6 rounded-md grid place-items-center shrink-0 font-mono text-[11px] font-bold"
                  style={{
                    background: tw("success", 0.14),
                    color: "hsl(var(--success))",
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-[11.5px] text-foreground leading-relaxed pt-0.5">
                  {reason}
                </span>
              </motion.li>
            ))}
          </ol>
        </TextureCard>
      </section>

      {/* ── BLOQUE 7 · Lifecycle ── */}
      <section>
        <SectionHeader
          title="Qué se prende, qué queda y qué se apaga"
          sub="Estado de cada campaña al arrancar junio · lunes 1 jun"
        />
        <StaggerGroup className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {LIFECYCLE.map((g) => (
            <StaggerItem key={g.action}>
              <TextureCard
                className="p-4 h-full flex flex-col"
                style={{
                  borderColor: tw(g.tone, 0.4),
                  background: `linear-gradient(135deg, ${tw(g.tone, 0.07)}, hsl(var(--card)))`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CircleDot
                    className="size-3.5 shrink-0"
                    style={{ color: `hsl(${TOKEN[g.tone]})` }}
                  />
                  <span
                    className="text-[10px] uppercase tracking-[0.1em] font-bold"
                    style={{ color: `hsl(${TOKEN[g.tone]})` }}
                  >
                    {LIFECYCLE_LABEL[g.action]}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground italic mb-3">
                  {g.caption}
                </div>
                <div className="space-y-2.5">
                  {g.items.map((it) => (
                    <div
                      key={it.name}
                      className="rounded-lg border bg-card/50 p-2.5"
                      style={{ borderColor: tw(g.tone, 0.25) }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold leading-tight">
                          {it.name}
                        </span>
                        <Badge
                          variant={BADGE_VARIANT[g.tone]}
                          className="!text-[8px] normal-case tracking-normal whitespace-nowrap shrink-0"
                        >
                          {it.objetivo}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {it.why}
                      </p>
                    </div>
                  ))}
                </div>
              </TextureCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
        <div className="flex items-center gap-1.5 mt-3 px-1">
          <CircleDot className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground/80 italic">
            Las que venían corriendo no se tocan para no reiniciar el aprendizaje de Facebook · las nuevas arrancan en learning.
          </span>
        </div>
      </section>

      {/* ── BLOQUE 3 · Plan semanal INTERACTIVO ── */}
      <section>
        <SectionHeader
          title="Plan semanal · interactivo"
          sub="Selecciona un escenario · la tabla se ajusta a sus números"
        />

        {/* Pills selector */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {SCENARIOS.map((s) => {
            const active = selectedScenario === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedScenario(s.key)}
                aria-pressed={active}
                className="group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold transition-all"
                style={{
                  borderColor: active ? `hsl(${TOKEN[s.tone]})` : "hsl(var(--border) / 0.5)",
                  background: active ? tw(s.tone, 0.14) : "transparent",
                  color: active ? `hsl(${TOKEN[s.tone]})` : "hsl(var(--muted-foreground))",
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{
                    background: `hsl(${TOKEN[s.tone]})`,
                    opacity: active ? 1 : 0.45,
                  }}
                />
                <span>{s.name}</span>
                <span className="font-mono text-[10px] opacity-80">
                  {s.leads}L → {s.trials}T · {s.budget}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mini-callout · regla 50% lead→trial */}
        <div
          className="rounded-lg border px-3 py-2 mb-3 flex items-start gap-2"
          style={{ borderColor: tw("violet", 0.3), background: tw("violet", 0.05) }}
        >
          <Ratio className="size-3.5 mt-0.5 shrink-0 text-[hsl(var(--brand-violet))]" />
          <p className="text-[10.5px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Regla 50% lead → trial</span>: del total de leads, la mitad debe convertir a trial. El CPT (cost per trial) por escenario es {SCENARIOS.map((s) => `${s.name} ${s.cpt}`).join(" · ")}.
          </p>
        </div>

        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-bold">Semana</th>
                  <th className="text-left p-3 font-bold">Días</th>
                  <th className="text-right p-3 font-bold">Leads/día</th>
                  <th className="text-right p-3 font-bold">CPL</th>
                  <th className="text-right p-3 font-bold">Leads sem</th>
                  <th className="text-right p-3 font-bold">Trials sem</th>
                  <th className="text-right p-3 font-bold">CPT</th>
                  <th className="text-right p-3 font-bold">€/sem</th>
                </tr>
              </thead>
              <tbody>
                {activeWeekly.rows.map((w, i) => (
                  <motion.tr
                    key={`${selectedScenario}-${w.week}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-border/40 hover:bg-secondary/20"
                  >
                    <td className="p-3">
                      <div
                        className="font-bold"
                        style={{ color: `hsl(${TOKEN[w.tone]})` }}
                      >
                        {w.week}
                      </div>
                      <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                        {w.phase}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{w.days}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{w.leadsDay}</td>
                    <td className="p-3 text-right font-mono tabular-nums font-semibold">{w.cpl}</td>
                    <td
                      className="p-3 text-right font-mono tabular-nums font-bold"
                      style={{ color: `hsl(${TOKEN[w.tone]})` }}
                    >
                      {w.perWeekLeads}
                    </td>
                    <td
                      className="p-3 text-right font-mono tabular-nums font-bold"
                      style={{ color: `hsl(${TOKEN[w.tone]} / 0.85)` }}
                    >
                      {w.perWeekTrials}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums font-semibold text-muted-foreground">{w.cpt}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{w.perWeek}</td>
                  </motion.tr>
                ))}
                <tr
                  className="border-t-2 bg-secondary/30"
                  style={{ borderTopColor: tw(activeScenario.tone, 0.5) }}
                >
                  <td className="p-3 font-bold text-[11px]" colSpan={4}>
                    Total {activeScenario.name.toLowerCase()}
                  </td>
                  <td
                    className="p-3 text-right font-mono tabular-nums font-bold"
                    style={{ color: `hsl(${TOKEN[activeScenario.tone]})` }}
                  >
                    {activeWeekly.totalLeads}
                  </td>
                  <td
                    className="p-3 text-right font-mono tabular-nums font-bold"
                    style={{ color: `hsl(${TOKEN[activeScenario.tone]} / 0.85)` }}
                  >
                    {activeWeekly.totalTrials}
                  </td>
                  <td
                    className="p-3 text-right font-mono tabular-nums font-bold"
                  >
                    {activeWeekly.totalCpt}
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums font-bold">
                    {activeWeekly.totalSpend}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* ── BLOQUE 3b · Proyección diaria de leads · sigue el escenario seleccionado ── */}
      <section>
        <SectionHeader
          title={`Proyección diaria de leads · junio (${activeScenario.name.toLowerCase()} ${activeScenario.leads})`}
          sub="Sigue el escenario seleccionado arriba · línea guía a 500 leads"
        />
        <DailyRampChart scenario={selectedScenario} />
      </section>

      {/* ── BLOQUE 4 · Reglas de learning + reglas operativas ── */}
      <section>
        <SectionHeader
          title="Reglas de learning · darle norte a la pauta"
          sub="Cómo cuidamos el aprendizaje de Facebook · cero adsets famélicos"
        />

        {/* Cards destacadas de learning */}
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <TextureCard
            className="p-4"
            style={{
              borderColor: tw("destructive", 0.4),
              background: `linear-gradient(135deg, ${tw("destructive", 0.08)}, hsl(var(--card)))`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <div className="size-9 grid place-items-center rounded-lg bg-[hsl(var(--destructive)/0.14)] text-[hsl(var(--destructive))] shrink-0">
                <Gauge className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-[hsl(var(--destructive))] mb-1">
                  Mínimo por adset · €11-15/día
                </div>
                <p className="text-[11.5px] text-foreground leading-relaxed">
                  Cada conjunto de anuncios necesita mínimo €11-15/día para
                  salir de aprendizaje. No vamos a tener adsets de €6 o €8 ·
                  sería tirar plata.
                </p>
              </div>
            </div>
          </TextureCard>
          <TextureCard
            className="p-4"
            style={{
              borderColor: tw("violet", 0.4),
              background: `linear-gradient(135deg, ${tw("violet", 0.08)}, hsl(var(--card)))`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <div className="size-9 grid place-items-center rounded-lg bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))] shrink-0">
                <Layers className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-[hsl(var(--brand-violet))] mb-1">
                  Belleza · Clientes Potenciales con CBO
                </div>
                <p className="text-[11.5px] text-foreground leading-relaxed">
                  La campaña nueva va con presupuesto por CAMPAÑA (CBO), no
                  por adset. Meta decide qué adset prioriza · es lo que mejor
                  nos funcionó meses atrás.
                </p>
              </div>
            </div>
          </TextureCard>
        </div>

        {/* Reglas operativas */}
        <div className="grid md:grid-cols-2 gap-2.5">
          {RULES.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg border bg-card/50 p-3 flex items-start gap-2.5"
              style={{ borderColor: tw(r.tone, 0.3) }}
            >
              <div
                className="size-6 rounded-md grid place-items-center shrink-0 font-mono text-[11px] font-bold"
                style={{ background: tw(r.tone, 0.14), color: `hsl(${TOKEN[r.tone]})` }}
              >
                {i + 1}
              </div>
              <div className="text-[11px] text-foreground leading-relaxed">{r.text}</div>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 px-1">
          <Gauge className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground/80 italic">
            En resumen: cada adset con plata suficiente para aprender, cambios graduales, plata concentrada en lo que funciona.
          </span>
        </div>
      </section>

      {/* ── BLOQUE 5 · Plan de assets ── */}
      <section>
        <SectionHeader
          title="Plan de assets · cantidades exactas"
          sub={`Total junio: ${totalImages} imágenes + ${totalVideos} videos = ${totalImages + totalVideos} piezas · MÁS VIDEO que mayo`}
        />

        {/* Formatos destacados */}
        <TextureCard className="p-4 mb-3" style={{ borderColor: tw("ember", 0.3) }}>
          <div className="flex items-start gap-3">
            <div className="size-9 grid place-items-center rounded-lg bg-[hsl(var(--brand-ember)/0.14)] text-[hsl(var(--brand-ember))] shrink-0">
              <Video className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-[hsl(var(--brand-ember))] mb-1">
                Formatos importantes
              </div>
              <p className="text-[11.5px] text-foreground leading-relaxed">
                <span className="font-mono font-bold">4:5</span> para posts /
                feed · <span className="font-mono font-bold">9:16</span> para
                stories / reels. Volvemos a los formatos clásicos para
                comparar contra los videos cinematográficos · veremos cuál
                convierte mejor.
              </p>
            </div>
          </div>
        </TextureCard>

        {/* Grupos de assets */}
        <StaggerGroup className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ASSETS.map((g) => {
            const groupTotal = g.items.reduce((s, i) => s + i.count, 0);
            return (
              <StaggerItem key={g.label}>
                <TextureCard
                  className="p-4 h-full flex flex-col"
                  style={{
                    borderLeftWidth: "3px",
                    borderLeftColor: `hsl(${TOKEN[g.tone]})`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: `hsl(${TOKEN[g.tone]})` }}>{g.icon}</span>
                      <span
                        className="text-[12.5px] font-bold leading-tight"
                        style={{ color: `hsl(${TOKEN[g.tone]})` }}
                      >
                        {g.label}
                      </span>
                    </div>
                    <Badge
                      variant={BADGE_VARIANT[g.tone]}
                      className="!text-[8px] normal-case tracking-normal whitespace-nowrap shrink-0"
                    >
                      {groupTotal} piezas
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground italic mb-3">
                    {g.tagline}
                  </div>
                  <div className="space-y-2">
                    {g.items.map((it, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-card/50 p-2.5"
                        style={{
                          borderColor: it.highlight
                            ? tw(g.tone, 0.45)
                            : "hsl(var(--border) / 0.4)",
                          background: it.highlight ? tw(g.tone, 0.06) : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="size-6 grid place-items-center rounded-md shrink-0"
                            style={{
                              background: tw(g.tone, 0.14),
                              color: `hsl(${TOKEN[g.tone]})`,
                            }}
                          >
                            {it.kind === "imagen" ? (
                              <ImageIcon className="size-3" />
                            ) : (
                              <Video className="size-3" />
                            )}
                          </span>
                          <span
                            className="font-mono font-bold text-[12px] tabular-nums"
                            style={{ color: `hsl(${TOKEN[g.tone]})` }}
                          >
                            {it.count}
                          </span>
                          <span className="text-[10.5px] text-foreground capitalize">
                            {it.kind}
                            {it.count > 1 ? "es" : ""}
                          </span>
                          <span className="ml-auto font-mono text-[9px] text-muted-foreground px-1.5 py-0.5 rounded border border-border/40">
                            {it.format}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-muted-foreground leading-snug">
                          {it.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </TextureCard>
              </StaggerItem>
            );
          })}
        </StaggerGroup>

        {/* 2 estrategias de landing en paralelo */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Target className="size-3.5 text-[hsl(var(--brand-violet))]" />
            <span className="text-[11px] font-bold">
              2 estrategias de landing en paralelo · decisión pendiente
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {LANDING_STRATEGIES.map((l, i) => (
              <motion.div
                key={l.letter}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <TextureCard
                  className="p-4 h-full"
                  style={{
                    borderLeftWidth: "3px",
                    borderLeftColor: `hsl(${TOKEN[l.tone]})`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="size-9 grid place-items-center rounded-lg shrink-0 font-mono text-base font-bold"
                      style={{
                        background: tw(l.tone, 0.14),
                        color: `hsl(${TOKEN[l.tone]})`,
                      }}
                    >
                      {l.letter}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[12px] font-bold mb-1"
                        style={{ color: `hsl(${TOKEN[l.tone]})` }}
                      >
                        Opción {l.letter} · {l.title}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {l.detail}
                      </p>
                    </div>
                  </div>
                </TextureCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Total / nota */}
        <TextureCard
          className="p-4 mt-4"
          style={{
            borderColor: tw("success", 0.4),
            background: `linear-gradient(135deg, ${tw("success", 0.08)}, hsl(var(--card)))`,
          }}
        >
          <div className="flex items-start gap-3">
            <div className="size-10 grid place-items-center rounded-lg bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))] shrink-0">
              <Video className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold mb-0.5">
                Total piezas junio:{" "}
                <span
                  className="font-mono tabular-nums"
                  style={{ color: `hsl(${TOKEN.success})` }}
                >
                  {totalImages} imágenes + {totalVideos} videos = {totalImages + totalVideos} piezas
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                Producción de oficina con personas reales · refrescamos los
                creativos fatigados (paraguas, mkt con 68-71K impresiones) y
                volvemos a formatos clásicos 4:5 y 9:16.
              </p>
            </div>
          </div>
        </TextureCard>
      </section>

      {/* ── BLOQUE 8 · Desglose campaña → conjunto → anuncio ── */}
      <section>
        <SectionHeader
          title="Por qué cada campaña · qué hace cada conjunto"
          sub="Agrupado por rol estratégico · narrativa de mayo + acción de junio · los €/día viven en la tabla operativa de abajo"
        />
        <TextureCard className="p-4 mb-4" style={{ borderColor: tw("violet", 0.3) }}>
          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Cómo leer esto:</span>{" "}
            3 grupos · <span className="font-semibold text-[hsl(var(--brand-ember))]">Motor de leads (Belleza)</span>,{" "}
            <span className="font-semibold text-[hsl(var(--brand-cyan))]">Apoyos (Servicios + Remarketing)</span> y{" "}
            <span className="font-semibold text-[hsl(var(--brand-violet))]">Atracción nueva (Tools + Academy)</span>.
            Cada conjunto trae el CPL real de mayo (si venía corriendo) + la
            acción de junio (ESCALAR/MANTENER/REVISAR/NUEVO/FUSIONAR).
          </p>
        </TextureCard>

        <div className="space-y-6">
          {(["motor", "apoyo", "atraccion"] as const).map((role) => {
            const group = BREAKDOWN.filter((b) => b.role === role);
            const meta = ROLE_META[role];
            return (
              <div key={role}>
                {/* Header del grupo */}
                <div
                  className="flex items-center justify-between mb-2 pb-2 border-b"
                  style={{ borderColor: tw(meta.tone, 0.35) }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-7 grid place-items-center rounded-md shrink-0"
                      style={{
                        background: tw(meta.tone, 0.16),
                        color: `hsl(${TOKEN[meta.tone]})`,
                      }}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[12px] font-extrabold leading-tight tracking-tight uppercase"
                        style={{ color: `hsl(${TOKEN[meta.tone]})` }}
                      >
                        {meta.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">
                        {meta.sub}
                      </div>
                    </div>
                  </div>
                  <Badge variant={BADGE_VARIANT[meta.tone]} className="!text-[9px] font-mono shrink-0">
                    {meta.share} budget · {group.length} {group.length === 1 ? "campaña" : "campañas"}
                  </Badge>
                </div>

                {/* Campañas del grupo · 1 columna · full width */}
                <StaggerGroup className="space-y-3">
                  {group.map((c) => {
                    const sTone = STATUS_TONE[c.status];
                    return (
                      <StaggerItem key={c.code}>
                        <TextureCard
                          className="p-4"
                          style={{ borderLeft: `3px solid hsl(${TOKEN[meta.tone]} / 0.65)` }}
                        >
                          {/* Header campaña */}
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span
                              className="font-mono text-[11px] px-1.5 py-0.5 rounded font-bold shrink-0"
                              style={{
                                background: tw(c.objetivoTone, 0.14),
                                color: `hsl(${TOKEN[c.objetivoTone]})`,
                              }}
                            >
                              {c.code}
                            </span>
                            <span className="text-[14px] font-extrabold tracking-tight">
                              {c.name}
                            </span>
                            <Badge
                              variant={BADGE_VARIANT[c.objetivoTone]}
                              className="!text-[8px] normal-case tracking-normal"
                            >
                              {c.objetivo}
                            </Badge>
                            <Badge
                              variant={BADGE_VARIANT[sTone]}
                              className="!text-[8px]"
                            >
                              {c.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground italic leading-snug mb-3">
                            “{c.tagline}”
                          </p>

                          {/* Adsets · tabla compacta */}
                          <div className="rounded-md border border-border/40 overflow-hidden mb-3">
                            <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 px-3 py-1.5 bg-secondary/40 text-[9px] uppercase tracking-[0.1em] font-bold text-muted-foreground border-b border-border/40">
                              <span>Acción · conjunto</span>
                              <span>Audiencia · estrategia</span>
                              <span className="text-right">CPL mayo</span>
                            </div>
                            {c.adsets.map((a) => {
                              const aTone = ADSET_ACTION_TONE[a.action];
                              return (
                                <div
                                  key={a.name}
                                  className="grid grid-cols-[auto_1fr_auto] gap-x-3 px-3 py-2.5 border-b border-border/30 last:border-b-0 hover:bg-secondary/20 transition-colors"
                                  style={{ borderLeft: `2px solid hsl(${TOKEN[aTone]} / 0.6)` }}
                                >
                                  <div className="flex flex-col gap-0.5 min-w-[140px]">
                                    <Badge
                                      variant={BADGE_VARIANT[aTone]}
                                      className="!text-[8px] w-fit"
                                    >
                                      {a.action}
                                    </Badge>
                                    <span className="text-[11px] font-bold leading-tight">
                                      {a.name}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[10px] text-foreground/90 font-semibold">
                                      {a.audience}
                                      <span className="text-muted-foreground/70 font-normal">
                                        {" "}· {AUDIENCE_HINT[a.audience]}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">
                                      {a.note}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {a.cplMay ? (
                                      <span
                                        className={cn(
                                          "font-mono tabular-nums text-[11px] font-bold",
                                          parseFloat(a.cplMay.replace("€", "")) <= 5 &&
                                            "text-[hsl(var(--success))]",
                                          parseFloat(a.cplMay.replace("€", "")) > 5 &&
                                            parseFloat(a.cplMay.replace("€", "")) <= 9 &&
                                            "text-[hsl(var(--warning))]",
                                          parseFloat(a.cplMay.replace("€", "")) > 9 &&
                                            "text-[hsl(var(--destructive))]",
                                        )}
                                      >
                                        {a.cplMay}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground/50 italic">
                                        sin data
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Anuncios */}
                          <div className="flex items-start gap-2">
                            <Video className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-muted-foreground">
                                Anuncios cargados
                              </span>
                              <p className="text-[11px] text-foreground leading-snug">
                                {c.ads}
                              </p>
                            </div>
                          </div>
                        </TextureCard>
                      </StaggerItem>
                    );
                  })}
                </StaggerGroup>
              </div>
            );
          })}
        </div>

        {/* Pie · pointer a la tabla operativa */}
        <TextureCard
          className="p-3 mt-4 flex items-start gap-2"
          style={{ borderColor: tw("cyan", 0.3) }}
        >
          <Wallet className="size-3.5 mt-0.5 shrink-0 text-[hsl(var(--brand-cyan))]" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Para ver los €/día y €/mes por campaña</span>{" "}
            mirá la tabla operativa abajo · cambia automáticamente al escenario
            que selecciones arriba (Conservador / Base / Agresivo).
          </p>
        </TextureCard>
      </section>

      {/* ── BLOQUE 9 · Tabla operativa del plan · 3 vistas ── */}
      <JunioPlanTable scenario={selectedScenario} />

      {/* ── BLOQUE 10 · Mejores anuncios mayo ── */}
      <section>
        <SectionHeader
          title="Mejores anuncios mayo · qué replicar vs mejorar"
          sub="CPL real 12-28 may · linda (Linda 24/7) es el mejor performer"
        />
        <div className="rounded-lg border border-border/50 bg-card/40 p-3 mb-3 flex items-start gap-2">
          <TriangleAlert className="size-3.5 text-[hsl(var(--warning))] mt-px shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            linda (ángulo “Linda 24/7”) es el mejor performer · replicar el ángulo.
            El mismo creativo paraguas rinde €5.49 en LATAM vs €9.72 en MX → LATAM
            más barato. Todos son imágenes → falta video.
          </p>
        </div>
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-bold">Anuncio</th>
                  <th className="text-left p-3 font-bold">Campaña</th>
                  <th className="text-right p-3 font-bold">Impresiones</th>
                  <th className="text-right p-3 font-bold">CTR</th>
                  <th className="text-right p-3 font-bold">CPM</th>
                  <th className="text-right p-3 font-bold">CPL</th>
                  <th className="text-left p-3 font-bold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {BEST_ADS.map((a, i) => (
                  <motion.tr
                    key={`${a.ad}-${a.campaign}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-border/40 hover:bg-secondary/20"
                  >
                    <td className="p-3 font-mono text-[10px] font-semibold text-foreground">
                      {a.ad}
                    </td>
                    <td className="p-3 text-muted-foreground">{a.campaign}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{a.impr}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{a.ctr}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{a.cpm}</td>
                    <td
                      className="p-3 text-right font-mono tabular-nums font-bold"
                      style={{ color: `hsl(${TOKEN[a.tone]})` }}
                    >
                      {a.cpl}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={BADGE_VARIANT[a.tone]}
                        className="!text-[9px] normal-case tracking-normal whitespace-nowrap"
                      >
                        {a.action === "REPLICAR" && (
                          <ArrowUpRight className="size-2.5 mr-0.5 inline" />
                        )}
                        {a.action}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>
        <div className="flex items-center gap-1.5 mt-3 px-1">
          <ListChecks className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground/80 italic">
            REPLICAR: mejor CPL+CTR · VOLUMEN: trae cantidad, mejorar CPL · MEJORAR: caro, refrescar creativo.
          </span>
        </div>
      </section>
    </div>
  );
}
