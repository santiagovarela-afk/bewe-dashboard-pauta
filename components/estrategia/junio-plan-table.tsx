"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Table2,
  CalendarRange,
  Layers,
  Target,
  Video,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { cn } from "@/lib/utils";

/**
 * Tabla operativa del plan junio · 3 vistas (campaña · etapa · conjunto).
 * Versión tabular densa del desglose campaña → conjunto → anuncio.
 * Estilo: idéntico a "Estado completo" de tab-campanas.tsx (TextureCard,
 * thead sticky, filas clickeables, mono tabular, badges del sistema).
 * CERO data inventada salvo el front-load por etapa (estimaciones razonables
 * que respetan los totales semanales del brief: 115 / 150 / 55).
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

type BadgeVariant = "success" | "warning" | "ember" | "violet" | "cyan" | "danger";

const BADGE_VARIANT: Record<Tone, BadgeVariant> = {
  success: "success",
  warning: "warning",
  ember: "ember",
  violet: "violet",
  cyan: "cyan",
  destructive: "danger",
};

function tw(tone: Tone, alpha: number): string {
  return `hsl(${TOKEN[tone]} / ${alpha})`;
}

// ── Tipos del plan ───────────────────────────────────────────────
type Objetivo = "Ventas" | "Clientes Potenciales" | "Tráfico";
type EstadoPlan = "Activa" | "Nueva" | "Ajusta";
type AdsetAction = "ESCALAR" | "MANTENER" | "REVISAR" | "NUEVO" | "FUSIONAR";
type AudienceKind = "Lookalike" | "Interés" | "Custom" | "Remarketing" | "Multi";

const OBJETIVO_TONE: Record<Objetivo, Tone> = {
  Ventas: "cyan",
  "Clientes Potenciales": "violet",
  Tráfico: "success",
};

const ESTADO_TONE: Record<EstadoPlan, Tone> = {
  Activa: "success",
  Nueva: "violet",
  Ajusta: "cyan",
};

const ADSET_ACTION_TONE: Record<AdsetAction, Tone> = {
  ESCALAR: "success",
  MANTENER: "cyan",
  REVISAR: "ember",
  NUEVO: "violet",
  FUSIONAR: "warning",
};

const AUDIENCE_HINT: Record<AudienceKind, string> = {
  Lookalike: "audiencia similar a clientes",
  Interés: "gente por sus intereses",
  Custom: "lista propia (engagers)",
  Remarketing: "gente que ya nos conoce",
  Multi: "mezcla de audiencias",
};

interface PlanAdset {
  name: string;
  audience: AudienceKind;
  perDay: number;
  cplMay: number | null;
  action: AdsetAction;
  campaignCode: string;
  campaignName: string;
}

interface PlanCampaign {
  code: string;
  name: string;
  vertical: string;
  geo: string;
  objetivo: Objetivo;
  estado: EstadoPlan;
  perDay: number;
  perMonth: number;
  cplMeta: string;
  /** presupuesto €/día por etapa: [sem1 arranque, sem2-3 push, sem4 taper] */
  stage: [number, number, number];
  adsets: PlanAdset[];
  ads: string;
}

// ── Data del plan junio (exacta · del brief) ─────────────────────
const PLAN: PlanCampaign[] = [
  {
    code: "J1",
    name: "MX · Belleza",
    vertical: "Belleza",
    geo: "MX",
    objetivo: "Ventas",
    estado: "Activa",
    perDay: 26,
    perMonth: 780,
    cplMeta: "€4-5",
    stage: [26, 33, 20],
    adsets: [
      { name: "A1.1 Lookalike Belleza", audience: "Lookalike", perDay: 12, cplMay: 5.03, action: "ESCALAR", campaignCode: "J1", campaignName: "MX · Belleza" },
      { name: "A1.2 Custom Engagers", audience: "Custom", perDay: 6, cplMay: 9.16, action: "REVISAR", campaignCode: "J1", campaignName: "MX · Belleza" },
      { name: "A1.4 Interés amplio", audience: "Interés", perDay: 8, cplMay: null, action: "NUEVO", campaignCode: "J1", campaignName: "MX · Belleza" },
    ],
    ads: "paraguas (reemplazar por VIDEO · fatigado 68K impr) + mkt + 2 videos nuevos.",
  },
  {
    code: "J2",
    name: "LATAM · Belleza",
    vertical: "Belleza",
    geo: "CR+PA+CL+CO",
    objetivo: "Ventas",
    estado: "Activa",
    perDay: 22,
    perMonth: 660,
    cplMeta: "€3.5-5",
    stage: [22, 30, 12],
    adsets: [
      { name: "A4.1 Lookalike Belleza", audience: "Lookalike", perDay: 14, cplMay: 7.13, action: "MANTENER", campaignCode: "J2", campaignName: "LATAM · Belleza" },
      { name: "A4.2 Interés amplio", audience: "Interés", perDay: 8, cplMay: null, action: "NUEVO", campaignCode: "J2", campaignName: "LATAM · Belleza" },
    ],
    ads: "mkt_v1_dol (volumen 71K) + paraguas LATAM (CPL €5.49) + 2 videos.",
  },
  {
    code: "J3",
    name: "Belleza · Clientes Potenciales",
    vertical: "Belleza",
    geo: "LATAM",
    objetivo: "Clientes Potenciales",
    estado: "Nueva",
    perDay: 20,
    perMonth: 600,
    cplMeta: "€3",
    stage: [20, 30, 8],
    adsets: [
      { name: "Lookalike Belleza LATAM", audience: "Lookalike", perDay: 12, cplMay: null, action: "NUEVO", campaignCode: "J3", campaignName: "Belleza · Clientes Potenciales" },
      { name: "Interés amplio", audience: "Interés", perDay: 8, cplMay: null, action: "NUEVO", campaignCode: "J3", campaignName: "Belleza · Clientes Potenciales" },
    ],
    ads: "ganadores belleza (mkt, paraguas, linda) + 4 videos nuevos.",
  },
  {
    code: "J4",
    name: "MX · Servicios",
    vertical: "Servicios",
    geo: "MX",
    objetivo: "Clientes Potenciales",
    estado: "Activa",
    perDay: 14,
    perMonth: 420,
    cplMeta: "€4",
    stage: [14, 18, 10],
    adsets: [
      { name: "A3.1 Lookalike Servicios", audience: "Lookalike", perDay: 9, cplMay: 3.98, action: "ESCALAR", campaignCode: "J4", campaignName: "MX · Servicios" },
      { name: "A3.2 Interés Servicios", audience: "Interés", perDay: 5, cplMay: 5.49, action: "MANTENER", campaignCode: "J4", campaignName: "MX · Servicios" },
    ],
    ads: "linda (mejor de la cuenta €3.88) + variantes video.",
  },
  {
    code: "J5",
    name: "Remarketing LATAM",
    vertical: "Multi",
    geo: "LATAM",
    objetivo: "Ventas",
    estado: "Ajusta",
    perDay: 12,
    perMonth: 360,
    cplMeta: "validar",
    stage: [12, 24, 5],
    adsets: [
      { name: "RMKT Apilado (fusión de 2)", audience: "Remarketing", perDay: 12, cplMay: 12.97, action: "FUSIONAR", campaignCode: "J5", campaignName: "Remarketing LATAM" },
    ],
    ads: "2 piezas de recuperación (\"te extrañamos\", \"estás a un paso\").",
  },
  {
    code: "J6",
    name: "Tools + Academy",
    vertical: "PYME",
    geo: "MX+LATAM",
    objetivo: "Tráfico",
    estado: "Nueva",
    perDay: 6,
    perMonth: 180,
    cplMeta: "tráfico",
    stage: [6, 15, 0],
    adsets: [
      { name: "Interés PYME amplio", audience: "Interés", perDay: 6, cplMay: null, action: "NUEVO", campaignCode: "J6", campaignName: "Tools + Academy" },
    ],
    ads: "recortes 40M COP + perro mocho + 3 tools (calculadora ROI, auditoría IG, comparador).",
  },
];

const TOTAL_DAY = PLAN.reduce((s, c) => s + c.perDay, 0); // 100
const TOTAL_MONTH = PLAN.reduce((s, c) => s + c.perMonth, 0); // 3000
const STAGE_TOTALS: [number, number, number] = [115, 150, 55];

// Conjuntos planos · ordenados por CPL may ascendente · los sin CPL al final
const ALL_ADSETS: PlanAdset[] = PLAN.flatMap((c) => c.adsets).slice().sort((a, b) => {
  const av = a.cplMay ?? Number.POSITIVE_INFINITY;
  const bv = b.cplMay ?? Number.POSITIVE_INFINITY;
  return av - bv;
});

// ── Helpers de formato ───────────────────────────────────────────
const eur = (n: number): string => `€${n.toLocaleString("es-ES")}`;
const eurDay = (n: number): string => `€${n}/día`;
const eurCpl = (n: number | null): string => (n === null ? "—" : `€${n.toFixed(2)}`);

type ViewKey = "campaign" | "stage" | "adset";

const VIEWS: { key: ViewKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "campaign", label: "Por campaña", Icon: Table2 },
  { key: "stage", label: "Por etapa (semanas)", Icon: CalendarRange },
  { key: "adset", label: "Por conjunto", Icon: Layers },
];

// ── Th genérico (estilo tab-campanas) ────────────────────────────
function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] select-none text-muted-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function JunioPlanTable() {
  const [view, setView] = React.useState<ViewKey>("campaign");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <section>
      <SectionHeader
        title="Tabla operativa del plan · todas las vistas"
        sub="Campañas, conjuntos y anuncios · presupuesto diario y mensual · cómo evoluciona por etapa"
        right={
          <Badge variant="outline" className="font-mono">
            {PLAN.length} campañas · {ALL_ADSETS.length} conjuntos
          </Badge>
        }
      />

      {/* Switcher de vistas · pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {VIEWS.map((v) => {
          const active = view === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-colors",
                active
                  ? "border-[hsl(var(--brand-violet)/0.5)] bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))]"
                  : "border-border/60 bg-background/40 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
              aria-pressed={active}
            >
              <v.Icon className="size-3.5" />
              {v.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {view === "campaign" && (
            <CampaignView expanded={expanded} setExpanded={setExpanded} />
          )}
          {view === "stage" && <StageView />}
          {view === "adset" && <AdsetView />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ── VISTA 1 · Por campaña ────────────────────────────────────────
function CampaignView({
  expanded,
  setExpanded,
}: {
  expanded: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <TextureCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] min-w-[860px]">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
            <tr className="border-b border-border/60">
              <Th>Cód · Campaña</Th>
              <Th>Vertical · Geo</Th>
              <Th>Objetivo</Th>
              <Th>Estado</Th>
              <Th align="right">€/día</Th>
              <Th align="right">€/mes</Th>
              <Th align="right">CPL meta</Th>
              <Th align="right" className="w-8" />
            </tr>
          </thead>
          <tbody>
            {PLAN.map((c, i) => (
              <CampaignRows
                key={c.code}
                c={c}
                index={i}
                expanded={expanded === c.code}
                onToggle={() => setExpanded((s) => (s === c.code ? null : c.code))}
              />
            ))}
            {/* Fila total */}
            <tr className="border-t-2 border-border/70 bg-secondary/30">
              <td className="px-3 py-3 font-bold text-[11px] uppercase tracking-[0.08em]" colSpan={4}>
                Total · 6 campañas
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular text-[hsl(var(--success))]">
                {eurDay(TOTAL_DAY)}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular text-[hsl(var(--success))]">
                {eur(TOTAL_MONTH)}
              </td>
              <td className="px-3 py-3 text-right text-[10px] text-muted-foreground" colSpan={2}>
                base · escala a {eur(3500)} en push
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </TextureCard>
  );
}

function CampaignRows({
  c,
  index,
  expanded,
  onToggle,
}: {
  c: PlanCampaign;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const estadoTone = ESTADO_TONE[c.estado];
  const objetivoTone = OBJETIVO_TONE[c.objetivo];
  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.4 }}
        onClick={onToggle}
        className={cn(
          "border-b border-border/30 cursor-pointer transition-colors",
          expanded ? "bg-secondary/60" : "hover:bg-secondary/40",
        )}
        style={{ borderLeft: `3px solid hsl(${TOKEN[estadoTone]} / 0.7)` }}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-[200px]">
            <span
              className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 font-bold"
              style={{ background: tw(objetivoTone, 0.16), color: `hsl(${TOKEN[objetivoTone]})` }}
            >
              {c.code}
            </span>
            <span className="text-[12px] font-semibold leading-tight truncate" title={c.name}>
              {c.name}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <div className="text-[11px] text-foreground/90 leading-tight">{c.vertical}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{c.geo}</div>
        </td>
        <td className="px-3 py-2.5">
          <Badge variant={BADGE_VARIANT[objetivoTone]} className="!text-[8px] normal-case tracking-normal whitespace-nowrap">
            {c.objetivo}
          </Badge>
        </td>
        <td className="px-3 py-2.5">
          <Badge variant={BADGE_VARIANT[estadoTone]} className="!text-[8px]">
            {c.estado}
          </Badge>
        </td>
        <td className="px-3 py-2.5 text-right font-mono font-bold text-[12px] tabular">{eurDay(c.perDay)}</td>
        <td className="px-3 py-2.5 text-right font-mono text-[11px] tabular text-muted-foreground">{eur(c.perMonth)}</td>
        <td className="px-3 py-2.5 text-right font-mono text-[11px] tabular">{c.cplMeta}</td>
        <td className="px-3 py-2.5 text-right text-muted-foreground/50">
          {expanded ? <ChevronUp className="size-3.5 inline" /> : <ChevronDown className="size-3.5 inline" />}
        </td>
      </motion.tr>
      <AnimatePresence initial={false}>
        {expanded && (
          <tr>
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
                style={{ background: tw(estadoTone, 0.04) }}
              >
                <div className="px-4 py-3 border-b border-border/40">
                  {/* Conjuntos */}
                  <div className="text-[9px] uppercase tracking-[0.1em] font-bold text-muted-foreground flex items-center gap-1 mb-2">
                    <Layers className="size-3" /> Conjuntos · {c.adsets.length}
                  </div>
                  <div className="space-y-1.5">
                    {c.adsets.map((a) => {
                      const aTone = ADSET_ACTION_TONE[a.action];
                      return (
                        <div
                          key={a.name}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-card/50 px-3 py-2"
                          style={{ borderLeftWidth: "3px", borderLeftColor: `hsl(${TOKEN[aTone]})` }}
                        >
                          <span className="text-[11px] font-bold leading-tight min-w-[160px]">{a.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {a.audience}
                            <span className="text-muted-foreground/60"> ({AUDIENCE_HINT[a.audience]})</span>
                          </span>
                          <span className="font-mono tabular text-[11px] font-semibold">{eurDay(a.perDay)}</span>
                          {a.cplMay !== null && (
                            <span className="font-mono tabular text-[10px] text-muted-foreground">
                              CPL may {eurCpl(a.cplMay)}
                            </span>
                          )}
                          <Badge variant={BADGE_VARIANT[aTone]} className="!text-[8px] ml-auto">
                            {a.action}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  {/* Anuncios */}
                  <div className="mt-3 flex items-start gap-1.5">
                    <Video className="size-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-muted-foreground">
                        Anuncios cargados
                      </span>
                      <p className="text-[10.5px] text-foreground leading-snug">{c.ads}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ── VISTA 2 · Por etapa (semanas) ────────────────────────────────
function StageTrend({ from, to }: { from: number; to: number }) {
  if (to > from)
    return <TrendingUp className="size-3 inline text-[hsl(var(--success))]" />;
  if (to < from)
    return <TrendingDown className="size-3 inline text-[hsl(var(--warning))]" />;
  return <Minus className="size-3 inline text-muted-foreground/50" />;
}

function StageView() {
  return (
    <>
      <TextureCard className="p-3 mb-3" style={{ borderColor: tw("cyan", 0.3) }}>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Cómo leer esto:</span> el presupuesto
          arranca equilibrado (Sem 1 · {eurDay(STAGE_TOTALS[0])}), sube fuerte a los ganadores
          de belleza y servicios en el push (Sem 2-3 · {eurDay(STAGE_TOTALS[1])}) y baja a solo
          top performers en el cierre (Sem 4 · {eurDay(STAGE_TOTALS[2])}). Las flechas marcan si
          la campaña sube, se mantiene o baja respecto a la etapa previa.
        </p>
      </TextureCard>
      <TextureCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[720px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
              <tr className="border-b border-border/60">
                <Th>Cód · Campaña</Th>
                <Th>Objetivo</Th>
                <Th align="right">Sem 1 · arranque</Th>
                <Th align="right">Sem 2-3 · push</Th>
                <Th align="right">Sem 4 · taper</Th>
              </tr>
            </thead>
            <tbody>
              {PLAN.map((c, i) => {
                const estadoTone = ESTADO_TONE[c.estado];
                const objetivoTone = OBJETIVO_TONE[c.objetivo];
                return (
                  <motion.tr
                    key={c.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="border-b border-border/30 hover:bg-secondary/40 transition-colors"
                    style={{ borderLeft: `3px solid hsl(${TOKEN[estadoTone]} / 0.7)` }}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-[190px]">
                        <span
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 font-bold"
                          style={{ background: tw(objetivoTone, 0.16), color: `hsl(${TOKEN[objetivoTone]})` }}
                        >
                          {c.code}
                        </span>
                        <span className="text-[12px] font-semibold leading-tight truncate" title={c.name}>
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={BADGE_VARIANT[objetivoTone]} className="!text-[8px] normal-case tracking-normal whitespace-nowrap">
                        {c.objetivo}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular">{eurDay(c.stage[0])}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[12px] tabular">
                      {eurDay(c.stage[1])} <StageTrend from={c.stage[0]} to={c.stage[1]} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular text-muted-foreground">
                      {c.stage[2] === 0 ? "off" : eurDay(c.stage[2])} <StageTrend from={c.stage[1]} to={c.stage[2]} />
                    </td>
                  </motion.tr>
                );
              })}
              {/* Total por semana */}
              <tr className="border-t-2 border-border/70 bg-secondary/30">
                <td className="px-3 py-3 font-bold text-[11px] uppercase tracking-[0.08em]" colSpan={2}>
                  Total por etapa
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular text-[hsl(var(--warning))]">
                  {eurDay(STAGE_TOTALS[0])}
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular text-[hsl(var(--brand-cyan))]">
                  {eurDay(STAGE_TOTALS[1])}
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular text-[hsl(var(--success))]">
                  {eurDay(STAGE_TOTALS[2])}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TextureCard>
    </>
  );
}

// ── VISTA 3 · Por conjunto ───────────────────────────────────────
function AdsetView() {
  return (
    <>
      <TextureCard className="p-3 mb-3" style={{ borderColor: tw("success", 0.3) }}>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Los Lookalike son los más baratos</span>{" "}
          (audiencia similar a clientes) · priorizar escalar esos. Lista ordenada por costo por
          registro real de mayo · los conjuntos nuevos (sin CPL aún) van al final.
        </p>
      </TextureCard>
      <TextureCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[820px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
              <tr className="border-b border-border/60">
                <Th>Conjunto</Th>
                <Th>Campaña</Th>
                <Th>Tipo audiencia</Th>
                <Th align="right">€/día</Th>
                <Th align="right">CPL may</Th>
                <Th>Acción</Th>
              </tr>
            </thead>
            <tbody>
              {ALL_ADSETS.map((a, i) => {
                const aTone = ADSET_ACTION_TONE[a.action];
                const cplTone: Tone | null =
                  a.cplMay === null ? null : a.cplMay <= 5 ? "success" : a.cplMay <= 9 ? "warning" : "destructive";
                return (
                  <motion.tr
                    key={`${a.campaignCode}-${a.name}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.35 }}
                    className="border-b border-border/30 hover:bg-secondary/40 transition-colors"
                    style={{ borderLeft: `3px solid hsl(${TOKEN[aTone]} / 0.7)` }}
                  >
                    <td className="px-3 py-2.5">
                      <span className="text-[12px] font-semibold leading-tight">{a.name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-muted-foreground">
                      <span className="font-mono">{a.campaignCode}</span> · {a.campaignName}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-[11px] text-foreground/90">{a.audience}</div>
                      <div className="text-[9px] text-muted-foreground/70">{AUDIENCE_HINT[a.audience]}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[12px] tabular">{eurDay(a.perDay)}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right font-mono font-bold text-[12px] tabular",
                        cplTone === "success" && "text-[hsl(var(--success))]",
                        cplTone === "warning" && "text-[hsl(var(--warning))]",
                        cplTone === "destructive" && "text-[hsl(var(--destructive))]",
                        cplTone === null && "text-muted-foreground/50",
                      )}
                    >
                      {eurCpl(a.cplMay)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={BADGE_VARIANT[aTone]} className="!text-[8px]">
                        {a.action}
                      </Badge>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TextureCard>
      <div className="flex items-center gap-1.5 mt-3 px-1">
        <Target className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground/80 italic">
          Verde = CPL ≤ €5 (barato, escalar) · ámbar = €5-9 · rojo = {">"} €9 (caro, revisar) · gris = sin data (nuevo).
        </span>
      </div>
    </>
  );
}
