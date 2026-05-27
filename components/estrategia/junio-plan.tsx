"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Calendar,
  TriangleAlert,
  FlaskConical,
  ImageIcon,
  Video,
  Wrench,
  Wallet,
  Gauge,
  ListChecks,
  CalendarDays,
  Layers,
  Repeat,
  ArrowUpRight,
  CircleDot,
} from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { StaggerGroup, StaggerItem } from "@/components/fx/reveal";

/**
 * Plan Junio 2026 · validado por Santiago contra mayo real (12-26 may).
 * Lead = CompleteRegistration (CR). CPL blend belleza real mayo = €7.66.
 * CERO data inventada: todas las cifras vienen del brief de requisitos finales.
 *
 * 8 bloques:
 *  1. Budget structure (techo €3.100 · contingencia €400 · máx €3.500)
 *  2. 3 escenarios (conservador / base / agresivo)
 *  3. Plan semanal (escenario base 570)
 *  4. Qué tiene que pasar cada semana para que baje el CPL
 *  5. Reglas para darle norte a la pauta
 *  6. A/B Ventas vs Cliente Potencial
 *  7. Plan de assets (actuales · nuevas · producción)
 *  8. Mejores anuncios mayo (replicar vs mejorar)
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
interface Scenario {
  key: string;
  name: string;
  tag: string;
  budget: string;
  cpl: string;
  leads: string;
  improve: string;
  improveNote: string;
  needs: string;
  tone: Tone;
}

const SCENARIOS: Scenario[] = [
  {
    key: "conservador",
    name: "Conservador",
    tag: "500 sí o sí",
    budget: "€3.100",
    cpl: "€6.20",
    leads: "500",
    improve: "-19%",
    improveNote: "optimización básica",
    needs: "Apagar perdedores a tiempo y escalar lo que ya rinde. Piso comprometido.",
    tone: "ember",
  },
  {
    key: "base",
    name: "Base",
    tag: "objetivo central",
    budget: "€3.300",
    cpl: "€5.79",
    leads: "570",
    improve: "-24%",
    improveNote: "optimización media",
    needs: "Refresh de video corriendo + adset interés amplio probado + LATAM escalando barato.",
    tone: "cyan",
  },
  {
    key: "agresivo",
    name: "Agresivo",
    tag: "todo funciona",
    budget: "€3.500",
    cpl: "€5.25",
    leads: "667",
    improve: "-31%",
    improveNote: "todo funciona",
    needs: "Cliente Potencial gana el A/B, videos nuevos baten a las imágenes y se activa contingencia.",
    tone: "success",
  },
];

const CPL_BASELINE = "€7.66";

// ── BLOQUE 3 · Plan semanal (base 570) ───────────────────────────
interface WeekRow {
  week: string;
  phase: string;
  days: string;
  leadsDay: string;
  cpl: string;
  perDay: string;
  perWeek: string;
  cumulative: string;
  tone: Tone;
}

const WEEKLY: WeekRow[] = [
  {
    week: "Sem 1",
    phase: "learning",
    days: "1-7",
    leadsDay: "15-22",
    cpl: "€7.00",
    perDay: "€115",
    perWeek: "€805",
    cumulative: "~126",
    tone: "warning",
  },
  {
    week: "Sem 2",
    phase: "push",
    days: "8-14",
    leadsDay: "28-30",
    cpl: "€5.50",
    perDay: "€150",
    perWeek: "€1.050",
    cumulative: "~329",
    tone: "cyan",
  },
  {
    week: "Sem 3",
    phase: "push max",
    days: "15-21",
    leadsDay: "30-32",
    cpl: "€5.00",
    perDay: "€150",
    perWeek: "€1.050",
    cumulative: "~546",
    tone: "violet",
  },
  {
    week: "Sem 4",
    phase: "taper",
    days: "22-30",
    leadsDay: "10-15",
    cpl: "€4.50",
    perDay: "€55",
    perWeek: "€495",
    cumulative: "~640",
    tone: "success",
  },
];

// ── BLOQUE 3b · Proyección diaria de leads (curva ramp) ──────────
type RampPhase = "learning" | "push" | "peak" | "taper";

interface DayProjection {
  day: number; // 1-30
  leads: number; // leads proyectados ese día
  phase: RampPhase;
}

const PHASE_TONE: Record<RampPhase, Tone> = {
  learning: "warning",
  push: "cyan",
  peak: "violet",
  taper: "success",
};

const PHASE_LABEL: Record<RampPhase, string> = {
  learning: "S1 · learning",
  push: "S2 · push",
  peak: "S3 · pico",
  taper: "S4 · taper",
};

const DAILY_RAMP: DayProjection[] = [
  // Semana 1 · learning · sube de a poco (total 126)
  { day: 1, leads: 12, phase: "learning" }, { day: 2, leads: 15, phase: "learning" },
  { day: 3, leads: 17, phase: "learning" }, { day: 4, leads: 18, phase: "learning" },
  { day: 5, leads: 19, phase: "learning" }, { day: 6, leads: 21, phase: "learning" },
  { day: 7, leads: 24, phase: "learning" },
  // Semana 2 · push (total 203)
  { day: 8, leads: 27, phase: "push" }, { day: 9, leads: 28, phase: "push" },
  { day: 10, leads: 29, phase: "push" }, { day: 11, leads: 29, phase: "push" },
  { day: 12, leads: 30, phase: "push" }, { day: 13, leads: 30, phase: "push" },
  { day: 14, leads: 30, phase: "push" },
  // Semana 3 · peak · estabiliza alto (total 217)
  { day: 15, leads: 32, phase: "peak" }, { day: 16, leads: 32, phase: "peak" },
  { day: 17, leads: 31, phase: "peak" }, { day: 18, leads: 31, phase: "peak" },
  { day: 19, leads: 31, phase: "peak" }, { day: 20, leads: 30, phase: "peak" },
  { day: 21, leads: 30, phase: "peak" },
  // Semana 4 · taper · baja pero con volumen (total 94, 9 días)
  { day: 22, leads: 16, phase: "taper" }, { day: 23, leads: 14, phase: "taper" },
  { day: 24, leads: 13, phase: "taper" }, { day: 25, leads: 11, phase: "taper" },
  { day: 26, leads: 10, phase: "taper" }, { day: 27, leads: 9, phase: "taper" },
  { day: 28, leads: 8, phase: "taper" }, { day: 29, leads: 7, phase: "taper" },
  { day: 30, leads: 6, phase: "taper" },
];

// ── BLOQUE 4 · Qué pasa cada semana para que baje el CPL ──────────
interface WeekPlan {
  week: string;
  days: string;
  /** Titular en lenguaje simple · lo que entiende cualquiera */
  headline: string;
  /** Costo por registro objetivo · en lenguaje claro */
  costTarget: string;
  actions: string[];
  tone: Tone;
}

const WEEK_PLANS: WeekPlan[] = [
  {
    week: "Semana 1 · Arranque",
    days: "1-7 jun",
    headline: "Probamos y miramos qué engancha",
    costTarget: "Costo por registro: ~€7",
    actions: [
      "Lanzamos los anuncios nuevos sin gastar de más",
      "Vemos cuáles llaman más la atención de la gente",
      "Todavía no metemos toda la plata · dejamos que Facebook aprenda",
    ],
    tone: "warning",
  },
  {
    week: "Semana 2 · Limpieza",
    days: "desde lunes 8",
    headline: "Apagamos lo caro, alimentamos lo bueno",
    costTarget: "Bajamos a ~€6 por registro",
    actions: [
      "Apagamos los anuncios que salen caros (más de €9 por registro)",
      "Le metemos más plata a los que están funcionando",
      "Concentramos el presupuesto en los ganadores",
    ],
    tone: "ember",
  },
  {
    week: "Semana 3 · Empujón fuerte",
    days: "15-21 jun",
    headline: "Máxima inversión · acá traemos el grueso",
    costTarget: "El mejor costo del mes: €5-5.5",
    actions: [
      "Solo quedan corriendo los anuncios ganadores",
      "Probamos una audiencia más amplia para llegar a más gente",
      "Es la semana donde traemos más registros",
    ],
    tone: "violet",
  },
  {
    week: "Semana 4 · Cierre tranquilo",
    days: "22-30 jun",
    headline: "Bajamos el gasto, priorizamos calidad",
    costTarget: "Registros baratos: ~€4.5",
    actions: [
      "Bajamos el presupuesto · dejamos solo lo mejor",
      "Priorizamos registros de calidad (los que prueban el producto)",
      "Cerramos el mes sin quemar plata",
    ],
    tone: "success",
  },
];

// ── BLOQUE 5 · Reglas para darle norte a la pauta ────────────────
interface Rule {
  text: string;
  tone: Tone;
}

const RULES: Rule[] = [
  { text: "Cada anuncio necesita un mínimo de plata por día (€15-20). Si le damos menos, Facebook no lo muestra bien y no aprende.", tone: "cyan" },
  { text: "No cambiar el presupuesto de golpe. Subimos de a poco para no romper lo que Facebook ya venía haciendo bien.", tone: "warning" },
  { text: "Si un anuncio trae registros a más de €9 cada uno (tras unos días de prueba), lo apagamos.", tone: "ember" },
  { text: "El 75-80% de la plata va a Belleza siempre. Es lo que mejor convierte · es el motor de leads.", tone: "success" },
  { text: "No miramos solo registros baratos: miramos cuáles llegan a probar el producto. Un registro que no prueba, no sirve.", tone: "violet" },
  { text: "Chequeo del día 7: si el costo por registro sigue alto (más de €6.5), decidimos: traer menos por día, o pedir el presupuesto extra de €400.", tone: "destructive" },
  { text: "El resto se reparte: un poco a Servicios (otro nicho) y a recuperar gente que ya nos conoce.", tone: "cyan" },
];

// ── BLOQUE 6 · A/B Ventas vs Cliente Potencial ───────────────────
interface AbModel {
  key: "A" | "B";
  name: string;
  role: string;
  campaigns: string;
  objetivo: string;
  cplMay: string;
  hypothesis: string;
  tone: Tone;
}

const AB_MODELS: AbModel[] = [
  {
    key: "A",
    name: "Modelo A · Ventas",
    role: "lo nuevo de mayo",
    campaigns: "MX_Belleza + LATAM_Belleza",
    objetivo: "Ventas",
    cplMay: "€7.66 registro",
    hypothesis: "En mayo pasamos belleza a este objetivo (nuevo para nosotros). Trajo registros pero caros (€7-8). ¿Será que la calidad compensa el precio? Eso es lo que vamos a medir.",
    tone: "cyan",
  },
  {
    key: "B",
    name: "Modelo B · Cliente Potencial",
    role: "lo de siempre + la prueba que funcionó",
    campaigns: "Belleza_LEADS (nueva) + Servicios",
    objetivo: "Clientes Potenciales",
    cplMay: "€4.32 (servicios)",
    hypothesis: "Es el objetivo que Bewe usó toda la vida. En mayo lo dejamos solo en Servicios y el registro bajó a €4.32 (mucho más barato que belleza). Ahora probamos si en belleza también baja.",
    tone: "violet",
  },
];

// ── BLOQUE 7 · Plan de assets ────────────────────────────────────
interface AdjustItem {
  name: string;
  detail: string;
  tone: Tone;
}

const CURRENT_CAMPAIGNS: AdjustItem[] = [
  {
    name: "MX Belleza",
    detail:
      "El anuncio 'paraguas' ya lo vio mucha gente (68 mil veces) y empezó a cansarse → lo reemplazamos por un video nuevo. Sumamos un grupo con audiencia más amplia para llegar a gente nueva.",
    tone: "ember",
  },
  {
    name: "LATAM Belleza",
    detail:
      "Mantenemos los 2 que funcionan: 'mkt' (trae mucho volumen) y 'paraguas LATAM' (registros baratos a €5.49). Sumamos audiencia más amplia.",
    tone: "cyan",
  },
  {
    name: "Servicios",
    detail:
      "Le metemos más plata a 'linda', que fue el mejor anuncio del mes (registros a €3.88). Le hacemos versiones en video.",
    tone: "success",
  },
];

interface NewCampaign {
  code: string;
  objetivo: string;
  load: string;
  tone: Tone;
}

const NEW_CAMPAIGNS: NewCampaign[] = [
  {
    code: "Belleza · Clientes Potenciales",
    objetivo: "la prueba del mes",
    load: "Campaña nueva de belleza con el objetivo 'Clientes Potenciales' (la prueba A/B). Le cargamos los anuncios ganadores de mayo + 4 videos nuevos.",
    tone: "violet",
  },
  {
    code: "Tools + Academy",
    objetivo: "atraer gente nueva",
    load: "Campaña para atraer gente que todavía no nos conoce. Aprovechamos los videos que ya pagamos (40M COP), el del 'perro mocho' y 3 herramientas gratis.",
    tone: "cyan",
  },
];

interface ProductionItem {
  icon: React.ReactNode;
  priority: "URGENTE" | "Servicios" | "Academy" | "Tools";
  text: string;
  tone: Tone;
}

const PRODUCTION: ProductionItem[] = [
  {
    icon: <Video className="size-3.5" />,
    priority: "URGENTE",
    text: "12 imágenes nuevas de belleza + 4 videos cortos (15-20s). En mayo hicimos muchas imágenes y pocos videos · hay que equilibrar porque el video llega a más gente.",
    tone: "destructive",
  },
  {
    icon: <ImageIcon className="size-3.5" />,
    priority: "Servicios",
    text: "2 conceptos nuevos para la campaña de servicios.",
    tone: "warning",
  },
  {
    icon: <Video className="size-3.5" />,
    priority: "Academy",
    text: "Cortar los videos largos que ya pagamos (40M COP) en piezas cortas.",
    tone: "warning",
  },
  {
    icon: <Wrench className="size-3.5" />,
    priority: "Tools",
    text: "3 herramientas gratis como gancho: calculadora de ROI, auditoría de Instagram, comparador local.",
    tone: "warning",
  },
];

// ── BLOQUE 8 · Mejores anuncios mayo ─────────────────────────────
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

function tw(tone: Tone, alpha: number): string {
  return `hsl(${TOKEN[tone]} / ${alpha})`;
}

// ── Sub-componente · Curva diaria de leads (estilo HubSpot) ──────
function DailyRampChart() {
  // Geometría del SVG
  const W = 800;
  const H = 300;
  const M = { top: 36, right: 56, bottom: 34, left: 40 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const days = DAILY_RAMP;
  const n = days.length;

  // Escala Y izquierda · leads/día (0-35)
  const yMaxLeads = 35;
  const yLeads = (v: number): number => M.top + plotH - (v / yMaxLeads) * plotH;

  // Acumulado + escala Y derecha (0-640)
  let running = 0;
  const cumulative = days.map((d) => {
    running += d.leads;
    return running;
  });
  const total = running; // 640
  const yMaxCum = 640;
  const yCum = (v: number): number => M.top + plotH - (v / yMaxCum) * plotH;

  // Barras
  const slot = plotW / n;
  const barGap = slot * 0.22;
  const barW = slot - barGap;
  const barX = (i: number): number => M.left + i * slot + barGap / 2;

  // Línea acumulado · centro de cada barra
  const cumX = (i: number): number => barX(i) + barW / 2;
  const cumPath = cumulative
    .map((c, i) => `${i === 0 ? "M" : "L"} ${cumX(i).toFixed(1)} ${yCum(c).toFixed(1)}`)
    .join(" ");

  // Punto donde el acumulado cruza 500 (meta mínima)
  const crossIdx = cumulative.findIndex((c) => c >= 500);
  const crossDay = crossIdx >= 0 ? days[crossIdx].day : null;

  // Líneas Y guía: meta 500 sobre eje derecho (acumulado)
  const goalY = yCum(500);

  // Separadores de semana (entre día 7/8, 14/15, 21/22) y etiquetas de fase
  const weekStarts = [0, 7, 14, 21]; // índices de inicio de cada semana
  const weekDivX = (startIdx: number): number => M.left + startIdx * slot;

  // Ticks eje X
  const xTicks = [1, 7, 14, 21, 30];

  // Ticks eje Y izquierdo
  const yTicks = [0, 10, 20, 30];

  // Mini-stats
  const peakDay = days.reduce((a, b) => (b.leads > a.leads ? b : a));
  const day22Cum = cumulative[21]; // día 22 = índice 21

  const stats = [
    { label: "Pico", value: `${peakDay.leads} leads/día`, note: "sem 3", tone: "violet" as Tone },
    { label: "Al día 22", value: `~${day22Cum} acum`, note: "supera la meta de 500", tone: "cyan" as Tone },
    { label: "Cierre", value: `~${total} leads`, note: "total del mes", tone: "success" as Tone },
  ];

  const legend: { label: string; tone: Tone }[] = [
    { label: "Sem 1 · learning", tone: PHASE_TONE.learning },
    { label: "Sem 2 · push", tone: PHASE_TONE.push },
    { label: "Sem 3 · pico", tone: PHASE_TONE.peak },
    { label: "Sem 4 · taper", tone: PHASE_TONE.taper },
  ];

  return (
    <TextureCard className="p-5">
      {/* Mini-stats */}
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

      {/* Gráfico SVG */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          role="img"
          aria-label="Proyección diaria de leads durante junio"
        >
          {/* Gridlines horizontales + eje Y izquierdo */}
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

          {/* Separadores de semana + labels de fase */}
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

          {/* Línea guía meta mínima · 500 leads (dashed) */}
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

          {/* Barras verticales */}
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

          {/* Línea de acumulado (eje derecho) · motion path */}
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

          {/* Marca donde el acumulado cruza 500 */}
          {crossIdx >= 0 && (
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

          {/* Eje Y derecho · acumulado */}
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

          {/* Eje X · días */}
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

      {/* Leyenda */}
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
              Plan Junio 2026 · validado por Santiago
            </div>
            <h2 className="text-base font-bold leading-tight">
              Techo €3.100 · contingencia €400 · máximo absoluto €3.500
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
              Lead = CompleteRegistration. CPL blend belleza real mayo (12-26)
              = {CPL_BASELINE}. Objetivo: bajar el CPL semana a semana con
              optimización y más contenidos rotativos.
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

                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-4xl font-bold tabular-nums"
                    style={{ color: `hsl(${TOKEN[s.tone]})` }}
                  >
                    {s.leads}
                  </span>
                  <span className="text-[11px] text-muted-foreground">leads</span>
                </div>

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
                </div>

                <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                  Mejora {s.improve} · {s.improveNote}
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

      {/* ── BLOQUE 3 · Plan semanal (base 570) ── */}
      <section>
        <SectionHeader
          title="Plan semanal"
          sub="Escenario base 570 leads como referencia · ramp learning → push → taper"
        />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-bold">Semana</th>
                  <th className="text-left p-3 font-bold">Días</th>
                  <th className="text-right p-3 font-bold">Leads/día</th>
                  <th className="text-right p-3 font-bold">CPL</th>
                  <th className="text-right p-3 font-bold">€/día</th>
                  <th className="text-right p-3 font-bold">€/sem</th>
                  <th className="text-right p-3 font-bold">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {WEEKLY.map((w, i) => (
                  <motion.tr
                    key={w.week}
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
                    <td className="p-3 text-right font-mono tabular-nums">{w.perDay}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{w.perWeek}</td>
                    <td
                      className="p-3 text-right font-mono tabular-nums font-bold"
                      style={{ color: `hsl(${TOKEN[w.tone]})` }}
                    >
                      {w.cumulative}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* ── BLOQUE 3b · Proyección diaria de leads ── */}
      <section>
        <SectionHeader
          title="Proyección diaria de leads · junio"
          sub="Cómo arranca, sube, se estabiliza y cierra · línea guía a 500 leads"
        />
        <DailyRampChart />
      </section>

      {/* ── BLOQUE 4 · Qué pasa cada semana para que baje el CPL ── */}
      <section>
        <SectionHeader
          title="El plan semana a semana · en simple"
          sub="Qué hacemos cada semana y por qué · sin tecnicismos"
        />
        <StaggerGroup className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {WEEK_PLANS.map((p) => (
            <StaggerItem key={p.week}>
              <TextureCard
                className="p-4 h-full"
                style={{
                  borderTopWidth: "3px",
                  borderTopColor: `hsl(${TOKEN[p.tone]})`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: `hsl(${TOKEN[p.tone]})` }}
                  >
                    {p.week}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {p.days}
                  </span>
                </div>
                <div className="text-[13px] font-bold leading-snug mb-1.5">
                  {p.headline}
                </div>
                <div
                  className="text-[10px] font-semibold mb-3 inline-block px-2 py-0.5 rounded"
                  style={{ background: tw(p.tone, 0.14), color: `hsl(${TOKEN[p.tone]})` }}
                >
                  {p.costTarget}
                </div>
                <ul className="space-y-1.5">
                  {p.actions.map((a, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[10.5px] text-muted-foreground leading-snug">
                      <CircleDot
                        className="size-3 mt-px shrink-0"
                        style={{ color: `hsl(${TOKEN[p.tone]})` }}
                      />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </TextureCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ── BLOQUE 5 · Reglas para darle norte a la pauta ── */}
      <section>
        <SectionHeader
          title="Las reglas de oro de la pauta"
          sub="Qué respetamos sí o sí durante el mes · en palabras simples"
        />
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
            En resumen: cada anuncio con plata suficiente, cambios graduales, plata concentrada en lo que funciona.
          </span>
        </div>
      </section>

      {/* ── BLOQUE 6 · A/B Ventas vs Cliente Potencial ── */}
      <section>
        <SectionHeader
          title="La prueba del mes · ¿Ventas o Clientes Potenciales?"
          sub="Dos formas de configurar las campañas · vamos a validar cuál trae leads de mejor calidad y más baratos"
        />
        <TextureCard className="p-4 mb-3" style={{ borderColor: tw("warning", 0.3) }}>
          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">La historia:</span>{" "}
            Bewe siempre usó campañas de <span className="text-[hsl(var(--brand-violet))] font-semibold">Clientes Potenciales</span>.
            En mayo probamos pasar belleza a <span className="text-[hsl(var(--brand-cyan))] font-semibold">Ventas</span> (algo nuevo) —
            trajo registros pero más caros (€7-8). Al mismo tiempo dejamos la campaña
            de Servicios en Clientes Potenciales y el registro nos salió a €4.32, mucho
            más barato. <span className="font-semibold text-foreground">Junio:</span> corremos las dos formas en
            paralelo para validar de una vez por todas cuál nos trae leads de mejor
            calidad al menor costo. No asumimos nada · lo probamos con data.
          </p>
        </TextureCard>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          {AB_MODELS.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <TextureCard
                className="p-4 h-full"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: `hsl(${TOKEN[m.tone]})`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="size-9 grid place-items-center rounded-lg shrink-0 font-mono text-base font-bold"
                    style={{ background: tw(m.tone, 0.14), color: `hsl(${TOKEN[m.tone]})` }}
                  >
                    {m.key}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-bold">{m.name}</span>
                      <Badge variant={BADGE_VARIANT[m.tone]} className="!text-[9px] normal-case tracking-normal">
                        {m.role}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {m.hypothesis}
                    </div>
                  </div>
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>

        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-bold">Modelo</th>
                  <th className="text-left p-3 font-bold">Campañas</th>
                  <th className="text-left p-3 font-bold">Objetivo</th>
                  <th className="text-left p-3 font-bold">CPL may</th>
                  <th className="text-left p-3 font-bold">Hipótesis</th>
                </tr>
              </thead>
              <tbody>
                {AB_MODELS.map((m) => (
                  <tr key={m.key} className="border-t border-border/40 hover:bg-secondary/20">
                    <td className="p-3 font-bold" style={{ color: `hsl(${TOKEN[m.tone]})` }}>
                      {m.name}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-foreground">{m.campaigns}</td>
                    <td className="p-3 text-muted-foreground">{m.objetivo}</td>
                    <td className="p-3 font-mono tabular-nums">{m.cplMay}</td>
                    <td className="p-3 text-muted-foreground leading-snug max-w-[260px]">
                      {m.hypothesis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <TextureCard className="p-4" style={{ borderColor: tw("violet", 0.35) }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FlaskConical className="size-3.5 text-[hsl(var(--brand-violet))]" />
              <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-[hsl(var(--brand-violet))]">
                Qué medimos
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ¿Cuál trae el CR más barato? ¿Cuál convierte mejor a trial? El A/B
              compara CPL y calidad de lead entre los dos objetivos.
            </p>
          </TextureCard>
          <TextureCard className="p-4" style={{ borderColor: tw("success", 0.35) }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <CalendarDays className="size-3.5 text-[hsl(var(--success))]" />
              <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-[hsl(var(--success))]">
                Lectura día 7
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Si Cliente Potencial gana → julio migra todo a ese modelo para más
              cobertura de leads.
            </p>
          </TextureCard>
        </div>
      </section>

      {/* ── BLOQUE 7 · Plan de assets ── */}
      <section>
        <SectionHeader
          title="Qué hacemos con los anuncios"
          sub="Qué ajustamos en lo que ya tenemos · qué creamos nuevo · qué hay que producir"
        />

        {/* 7a · Campañas actuales */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Repeat className="size-3.5 text-[hsl(var(--brand-cyan))]" />
            <span className="text-[11px] font-bold">1 · Lo que ya tenemos corriendo · cómo lo ajustamos</span>
          </div>
          <StaggerGroup className="grid md:grid-cols-3 gap-3">
            {CURRENT_CAMPAIGNS.map((c) => (
              <StaggerItem key={c.name}>
                <TextureCard
                  className="p-4 h-full"
                  style={{ borderLeftWidth: "3px", borderLeftColor: `hsl(${TOKEN[c.tone]})` }}
                >
                  <div
                    className="text-[12px] font-bold mb-1.5"
                    style={{ color: `hsl(${TOKEN[c.tone]})` }}
                  >
                    {c.name}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{c.detail}</p>
                </TextureCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>

        {/* 7b · Campañas nuevas */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Layers className="size-3.5 text-[hsl(var(--brand-violet))]" />
            <span className="text-[11px] font-bold">2 · Campañas nuevas · qué creamos y qué le cargamos</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {NEW_CAMPAIGNS.map((c, i) => (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <TextureCard
                  className="p-4 h-full"
                  style={{
                    borderColor: tw(c.tone, 0.4),
                    background: `linear-gradient(135deg, ${tw(c.tone, 0.07)}, hsl(var(--card)))`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="font-mono text-[12px] font-bold"
                      style={{ color: `hsl(${TOKEN[c.tone]})` }}
                    >
                      {c.code}
                    </span>
                    <Badge variant={BADGE_VARIANT[c.tone]} className="!text-[9px] normal-case tracking-normal">
                      {c.objetivo}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{c.load}</p>
                </TextureCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 7c · Producción nueva */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Video className="size-3.5 text-[hsl(var(--destructive))]" />
            <span className="text-[11px] font-bold">3 · Lo que hay que producir · prioridad: más video</span>
          </div>
          <div className="grid md:grid-cols-2 gap-2.5">
            {PRODUCTION.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg border bg-card/50 p-3 flex items-start gap-2.5"
                style={{ borderColor: tw(p.tone, 0.3) }}
              >
                <div
                  className="size-7 rounded-md grid place-items-center shrink-0"
                  style={{ background: tw(p.tone, 0.14), color: `hsl(${TOKEN[p.tone]})` }}
                >
                  {p.icon}
                </div>
                <div className="min-w-0">
                  <Badge
                    variant={BADGE_VARIANT[p.tone]}
                    className="!text-[8px] normal-case tracking-normal mb-1"
                  >
                    {p.priority}
                  </Badge>
                  <div className="text-[11px] text-foreground leading-relaxed">{p.text}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground/80 italic leading-relaxed mt-3 px-1">
            Estilo: producción de oficina con personas reales (como “Bivi anterior”) · formato que ya sabemos que funciona.
          </div>
        </div>
      </section>

      {/* ── BLOQUE 8 · Mejores anuncios mayo ── */}
      <section>
        <SectionHeader
          title="Mejores anuncios mayo · qué replicar vs mejorar"
          sub="CPL real 12-26 may · linda (Linda 24/7) es el mejor performer"
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
