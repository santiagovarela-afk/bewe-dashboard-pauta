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
    role: "control",
    campaigns: "MX_Belleza + LATAM_Belleza",
    objetivo: "ODAX Ventas",
    cplMay: "€7.66 blend",
    hypothesis: "El objetivo Ventas optimiza calidad de lead pero a CPL más alto.",
    tone: "cyan",
  },
  {
    key: "B",
    name: "Modelo B · Cliente Potencial",
    role: "experimento",
    campaigns: "Belleza_LEADS (nueva) + Servicios",
    objetivo: "Clientes Potenciales",
    cplMay: "por validar",
    hypothesis: "Mismo evento CR, objetivo Leads. Hipótesis: trae CR más barato y más cobertura.",
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
    name: "MX_Belleza (Ventas)",
    detail:
      "Refresh creativo: paraguas_v2 fatigado (68K impr) → nuevo video. Agregar adset de interés amplio.",
    tone: "ember",
  },
  {
    name: "LATAM_Belleza (Ventas)",
    detail:
      "Mantener mkt_v1_dol (volumen) + paraguas LATAM (CPL €5.49 bueno). Agregar adset de interés amplio.",
    tone: "cyan",
  },
  {
    name: "Servicios_Conv (Cliente Potencial)",
    detail:
      "Escalar linda_v1 (mejor performer €3.88). Sumar variantes de video.",
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
    code: "BELLEZA_LEADS_JUN26",
    objetivo: "Cliente Potencial",
    load: "Cargar ganadores (mkt_v1_dol, paraguas_v2_asp, linda_v1) + 4 videos nuevos.",
    tone: "violet",
  },
  {
    code: "TOOLS_ACADEMY_JUN26",
    objetivo: "Tráfico / LPV",
    load: "Cargar recortes de los 40M COP en videos + perro mocho + 3 tools.",
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
    text: "12 imágenes refresh belleza + 4 videos 15-20s (mayo tuvo muchas imágenes, pocos videos).",
    tone: "destructive",
  },
  {
    icon: <ImageIcon className="size-3.5" />,
    priority: "Servicios",
    text: "2 conceptos nuevos.",
    tone: "warning",
  },
  {
    icon: <Video className="size-3.5" />,
    priority: "Academy",
    text: "Recortes de los 40M COP.",
    tone: "warning",
  },
  {
    icon: <Wrench className="size-3.5" />,
    priority: "Tools",
    text: "3 piezas: calculadora ROI, auditoría IG, comparador local.",
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
          title="A/B · Ventas vs Cliente Potencial"
          sub="Mismo evento (CompleteRegistration) · solo cambia el objetivo de campaña"
        />
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
          title="Plan de assets"
          sub="Campañas actuales · campañas nuevas · producción nueva (más video que mayo)"
        />

        {/* 7a · Campañas actuales */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Repeat className="size-3.5 text-[hsl(var(--brand-cyan))]" />
            <span className="text-[11px] font-bold">7a · Campañas actuales · cómo se ajustan</span>
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
            <span className="text-[11px] font-bold">7b · Campañas nuevas · qué se crea + qué se carga</span>
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
            <span className="text-[11px] font-bold">7c · Producción nueva · prioridad: más video</span>
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
