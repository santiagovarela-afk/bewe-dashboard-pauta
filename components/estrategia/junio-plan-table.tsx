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
import { type ScenarioKey } from "./junio-plan";

/**
 * Tabla operativa del plan junio · 3 vistas (campaña · etapa · conjunto).
 * Reactiva al escenario seleccionado en JunioPlan (conservador/base/agresivo).
 * Estilo: idéntico a "Estado completo" de tab-campanas.tsx (TextureCard,
 * thead sticky, filas clickeables, mono tabular, badges del sistema).
 * Vistas 1 y 2 cambian sus €/día y €/mes según escenario.
 * Vista 3 (por conjunto) es referencia histórica de CPL mayo · invariante.
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
  /** proporción del budget de la campaña (0-1) · suma 1 dentro de cada campaña */
  share: number;
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
  /** €/día base · se sustituye por el del escenario activo */
  perDay: number;
  perMonth: number;
  cplMeta: string;
  adsets: PlanAdset[];
  ads: string;
}

// ── Budget por escenario · €/día y €/mes por campaña ─────────────
// Ajustado con data REAL de PostHog (May 16-28 · 12 días):
//   conv_mx_belleza    50% conv lead→trial (mejor) → escalar (J1)
//   conv_latam_belleza 45% conv (alto)             → mantener/subir (J2)
//   conv_mx_servicios  42% conv (decente)          → escalar (J4)
//   conv_latam_rmkt    27% conv (mediocre · volumen) → BAJAR (J5)
//   conv_mx_comercio   40% pero pausada
//   conv_latam_comercio 0% pausada
// Resultado: RMKT pierde ~€90/mes (conservador) y se redistribuye
// a Belleza CP (J3) y Servicios (J4).
const BUDGET_BY_SCENARIO: Record<ScenarioKey, Record<string, { perDay: number; perMonth: number }>> = {
  // Conservador · total €3.100/mes (€103/día promedio)
  conservador: {
    J1: { perDay: 23, perMonth: 690 }, // MX Belleza · top converter
    J2: { perDay: 22, perMonth: 660 }, // LATAM Belleza · 2do mejor (era 620)
    J3: { perDay: 20, perMonth: 600 }, // Belleza CP · sube por audiencia (era 540)
    J4: { perDay: 14, perMonth: 420 }, // Servicios · sube por 42% conv (era 400)
    J5: { perDay: 12, perMonth: 360 }, // RMKT · BAJA por 27% conv (era 450)
    J6: { perDay: 12, perMonth: 370 }, // Tools · ajuste menor (era 400)
  },
  // Base · total €3.100/mes (€103/día promedio)
  base: {
    J1: { perDay: 22, perMonth: 660 },
    J2: { perDay: 22, perMonth: 660 }, // sube (era 600)
    J3: { perDay: 21, perMonth: 630 }, // sube (era 600)
    J4: { perDay: 14, perMonth: 420 }, // sube (era 400)
    J5: { perDay: 12, perMonth: 360 }, // BAJA (era 450)
    J6: { perDay: 12, perMonth: 370 }, // ajuste (era 390)
  },
  // Agresivo · total €3.500/mes (€117/día promedio)
  agresivo: {
    J1: { perDay: 26, perMonth: 780 }, // sube (era 750)
    J2: { perDay: 25, perMonth: 750 }, // sube (era 690)
    J3: { perDay: 23, perMonth: 690 },
    J4: { perDay: 16, perMonth: 480 }, // sube (era 450)
    J5: { perDay: 14, perMonth: 420 }, // BAJA (era 510)
    J6: { perDay: 13, perMonth: 380 }, // ajuste (era 410)
  },
};

const CPL_META_BY_SCENARIO: Record<ScenarioKey, Record<string, string>> = {
  conservador: { J1: "€5-6", J2: "€4-5", J3: "€4", J4: "€4", J5: "validar", J6: "tráfico" },
  base: { J1: "€4-5", J2: "€3.5-5", J3: "€3", J4: "€4", J5: "validar", J6: "tráfico" },
  agresivo: { J1: "€4-5", J2: "€3.5-5", J3: "€3", J4: "€4", J5: "validar", J6: "tráfico" },
};

const SCENARIO_LABEL: Record<ScenarioKey, string> = {
  conservador: "Conservador",
  base: "Base",
  agresivo: "Agresivo",
};

const SCENARIO_TONE: Record<ScenarioKey, Tone> = {
  conservador: "ember",
  base: "cyan",
  agresivo: "success",
};

// ── Data del plan junio · estructura base ────────────────────────
const PLAN: PlanCampaign[] = [
  {
    code: "J1",
    name: "MX · Belleza",
    vertical: "Belleza",
    geo: "MX",
    objetivo: "Ventas",
    estado: "Activa",
    perDay: 22,
    perMonth: 660,
    cplMeta: "€4-5",
    adsets: [
      { name: "A1.1 LOK Belleza · Ganadores", audience: "Lookalike", share: 0.5, cplMay: 5.03, action: "ESCALAR", campaignCode: "J1", campaignName: "MX · Belleza" },
      { name: "A1.5 LOK Belleza · Test Creativos", audience: "Lookalike", share: 0.5, cplMay: null, action: "NUEVO", campaignCode: "J1", campaignName: "MX · Belleza" },
    ],
    ads: "Ganadores: mkt + paraguas (reemplazar por VIDEO · fatigado 68K impr). Test creativos: 3 videos perro-mucho + 2 videos nuevos belleza.",
  },
  {
    code: "J2",
    name: "LATAM · Belleza",
    vertical: "Belleza",
    geo: "CR+PA+CL+CO",
    objetivo: "Ventas",
    estado: "Activa",
    perDay: 20,
    perMonth: 600,
    cplMeta: "€3.5-5",
    adsets: [
      { name: "A4.1 LOK Belleza · Ganadores", audience: "Lookalike", share: 0.5, cplMay: 7.13, action: "MANTENER", campaignCode: "J2", campaignName: "LATAM · Belleza" },
      { name: "A4.5 LOK Belleza · Test Creativos", audience: "Lookalike", share: 0.5, cplMay: null, action: "NUEVO", campaignCode: "J2", campaignName: "LATAM · Belleza" },
    ],
    ads: "Ganadores: mkt_v1_dol (volumen 71K) + paraguas LATAM (CPL €5.49). Test creativos: 3 videos perro-mucho LATAM + 2 piezas refresh.",
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
    adsets: [
      { name: "LOK Belleza CP · Ganadores", audience: "Lookalike", share: 0.5, cplMay: null, action: "NUEVO", campaignCode: "J3", campaignName: "Belleza · Clientes Potenciales" },
      { name: "LOK Belleza CP · Test Creativos", audience: "Lookalike", share: 0.5, cplMay: null, action: "NUEVO", campaignCode: "J3", campaignName: "Belleza · Clientes Potenciales" },
    ],
    ads: "Ganadores: mkt + paraguas + linda (ángulos validados). Test creativos: 6 videos perro-mucho (refresh creativo).",
  },
  {
    code: "J4",
    name: "MX · Servicios",
    vertical: "Servicios",
    geo: "MX",
    objetivo: "Clientes Potenciales",
    estado: "Activa",
    perDay: 13,
    perMonth: 390,
    cplMeta: "€4",
    adsets: [
      { name: "A3.1 LOK Servicios · Concentrado", audience: "Lookalike", share: 1, cplMay: 3.98, action: "ESCALAR", campaignCode: "J4", campaignName: "MX · Servicios" },
    ],
    ads: "linda (€3.88 · mejor anuncio de la cuenta) + 3 videos servicios + 2 imágenes nuevas. Conjunto Interés se apaga (consolidación al LOK ganador).",
  },
  {
    code: "J5",
    name: "Remarketing LATAM",
    vertical: "Multi",
    geo: "LATAM",
    objetivo: "Ventas",
    estado: "Ajusta",
    perDay: 15,
    perMonth: 450,
    cplMeta: "validar",
    adsets: [
      { name: "RMKT Apilado (fusión de 2)", audience: "Remarketing", share: 1, cplMay: 12.97, action: "FUSIONAR", campaignCode: "J5", campaignName: "Remarketing LATAM" },
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
    perDay: 13,
    perMonth: 390,
    cplMeta: "tráfico",
    adsets: [
      { name: "Interés PYME amplio", audience: "Interés", share: 1, cplMay: null, action: "NUEVO", campaignCode: "J6", campaignName: "Tools + Academy" },
    ],
    ads: "recortes 40M COP + perro mocho + 3 tools (calculadora ROI, auditoría IG, comparador).",
  },
];

/** Resuelve el €/día y €/mes de cada campaña según el escenario activo. */
function resolveCampaign(c: PlanCampaign, scenario: ScenarioKey): PlanCampaign {
  const budget = BUDGET_BY_SCENARIO[scenario][c.code];
  const perDay = budget?.perDay ?? c.perDay;
  const perMonth = budget?.perMonth ?? c.perMonth;
  const cplMeta = CPL_META_BY_SCENARIO[scenario][c.code] ?? c.cplMeta;
  return { ...c, perDay, perMonth, cplMeta };
}

/** Devuelve [Sem 1 arranque, Sem 2-3 push, Sem 4 taper] en €/día. */
function stageFor(perDay: number): [number, number, number] {
  // Sem 1 ~85% · Sem 2-3 ~130% · Sem 4 ~50%
  return [Math.round(perDay * 0.85), Math.round(perDay * 1.3), Math.round(perDay * 0.5)];
}

// Conjuntos planos · ordenados por CPL may ascendente · referencia histórica
// invariable (no depende de escenario).
const ALL_ADSETS: PlanAdset[] = PLAN.flatMap((c) => c.adsets).slice().sort((a, b) => {
  const av = a.cplMay ?? Number.POSITIVE_INFINITY;
  const bv = b.cplMay ?? Number.POSITIVE_INFINITY;
  return av - bv;
});

// ── Helpers de formato ───────────────────────────────────────────
const eur = (n: number): string => `€${n.toLocaleString("es-ES")}`;
const eurDay = (n: number): string => `€${n}/día`;
const eurCpl = (n: number | null): string => (n === null ? "—" : `€${n.toFixed(2)}`);
const pct = (n: number): string => `${Math.round(n * 100)}%`;

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

export function JunioPlanTable({
  scenario = "base",
  onScenarioChange,
}: {
  scenario?: ScenarioKey;
  onScenarioChange?: (s: ScenarioKey) => void;
} = {}) {
  const [view, setView] = React.useState<ViewKey>("campaign");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const resolved = React.useMemo<PlanCampaign[]>(
    () => PLAN.map((c) => resolveCampaign(c, scenario)),
    [scenario],
  );

  const totalDay = resolved.reduce((s, c) => s + c.perDay, 0);
  const totalMonth = resolved.reduce((s, c) => s + c.perMonth, 0);
  const stageTotals: [number, number, number] = resolved.reduce<[number, number, number]>(
    (acc, c) => {
      const st = stageFor(c.perDay);
      return [acc[0] + st[0], acc[1] + st[1], acc[2] + st[2]];
    },
    [0, 0, 0],
  );

  const sTone = SCENARIO_TONE[scenario];
  const SCENARIO_KEYS: ScenarioKey[] = ["conservador", "base", "agresivo"];

  return (
    <section>
      <SectionHeader
        title="Tabla operativa del plan · todas las vistas"
        sub={`Vista operativa · escenario ${SCENARIO_LABEL[scenario]} · ${eur(totalMonth)}/mes (${eurDay(totalDay)})`}
        right={
          <Badge variant={BADGE_VARIANT[sTone]} className="font-mono">
            {PLAN.length} campañas · {ALL_ADSETS.length} conjuntos · {SCENARIO_LABEL[scenario]}
          </Badge>
        }
      />

      {/* Selector de escenario · pills · sincroniza con el resto del plan */}
      {onScenarioChange && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-muted-foreground mr-1">
            Escenario:
          </span>
          {SCENARIO_KEYS.map((k) => {
            const active = k === scenario;
            const tone = SCENARIO_TONE[k];
            const label = SCENARIO_LABEL[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => onScenarioChange(k)}
                aria-pressed={active}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold transition-all"
                style={{
                  borderColor: active ? `hsl(${TOKEN[tone]})` : "hsl(var(--border) / 0.5)",
                  background: active ? `hsl(${TOKEN[tone]} / 0.14)` : "transparent",
                  color: active ? `hsl(${TOKEN[tone]})` : "hsl(var(--muted-foreground))",
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{
                    background: `hsl(${TOKEN[tone]})`,
                    opacity: active ? 1 : 0.45,
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>
      )}

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
          key={`${view}-${scenario}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {view === "campaign" && (
            <CampaignView
              expanded={expanded}
              setExpanded={setExpanded}
              campaigns={resolved}
              totalDay={totalDay}
              totalMonth={totalMonth}
              scenario={scenario}
            />
          )}
          {view === "stage" && (
            <StageView campaigns={resolved} stageTotals={stageTotals} scenario={scenario} />
          )}
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
  campaigns,
  totalDay,
  totalMonth,
  scenario,
}: {
  expanded: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<string | null>>;
  campaigns: PlanCampaign[];
  totalDay: number;
  totalMonth: number;
  scenario: ScenarioKey;
}) {
  const sTone = SCENARIO_TONE[scenario];
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
            {campaigns.map((c, i) => (
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
                Total · {campaigns.length} campañas · {SCENARIO_LABEL[scenario]}
              </td>
              <td
                className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular"
                style={{ color: `hsl(${TOKEN[sTone]})` }}
              >
                {eurDay(totalDay)}
              </td>
              <td
                className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular"
                style={{ color: `hsl(${TOKEN[sTone]})` }}
              >
                {eur(totalMonth)}
              </td>
              <td className="px-3 py-3 text-right text-[10px] text-muted-foreground" colSpan={2}>
                escenario {SCENARIO_LABEL[scenario].toLowerCase()}
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
                    {c.adsets.map((a, idx) => {
                      const aTone = ADSET_ACTION_TONE[a.action];
                      // Reparto exacto: los primeros adsets floor(perDay × share),
                      // el último toma el residual para que la suma cuadre al
                      // perDay total. Piso mínimo €9/día por adset (regla nueva).
                      const isLast = idx === c.adsets.length - 1;
                      let adsetDay: number;
                      if (isLast) {
                        const sumPrevious = c.adsets
                          .slice(0, idx)
                          .reduce((s, prev) => s + Math.floor(c.perDay * prev.share), 0);
                        adsetDay = Math.max(9, c.perDay - sumPrevious);
                      } else {
                        adsetDay = Math.max(9, Math.floor(c.perDay * a.share));
                      }
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
                          <span className="font-mono tabular text-[11px] font-semibold">
                            {eurDay(adsetDay)} <span className="text-muted-foreground font-normal">· {pct(a.share)}</span>
                          </span>
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

function StageView({
  campaigns,
  stageTotals,
  scenario,
}: {
  campaigns: PlanCampaign[];
  stageTotals: [number, number, number];
  scenario: ScenarioKey;
}) {
  return (
    <>
      <TextureCard className="p-3 mb-3" style={{ borderColor: tw("cyan", 0.3) }}>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">
            Cómo leer esto · escenario {SCENARIO_LABEL[scenario].toLowerCase()}:
          </span>{" "}
          el presupuesto arranca al 85% del base (Sem 1 · {eurDay(stageTotals[0])}), sube ~30% a
          los ganadores en el push (Sem 2-3 · {eurDay(stageTotals[1])}) y baja al 50% en el cierre
          (Sem 4 · {eurDay(stageTotals[2])}). Las flechas marcan si la campaña sube, se mantiene o
          baja respecto a la etapa previa.
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
              {campaigns.map((c, i) => {
                const estadoTone = ESTADO_TONE[c.estado];
                const objetivoTone = OBJETIVO_TONE[c.objetivo];
                const stage = stageFor(c.perDay);
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
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular">{eurDay(stage[0])}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[12px] tabular">
                      {eurDay(stage[1])} <StageTrend from={stage[0]} to={stage[1]} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular text-muted-foreground">
                      {stage[2] === 0 ? "off" : eurDay(stage[2])} <StageTrend from={stage[1]} to={stage[2]} />
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
                  {eurDay(stageTotals[0])}
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular text-[hsl(var(--brand-cyan))]">
                  {eurDay(stageTotals[1])}
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-[12px] tabular text-[hsl(var(--success))]">
                  {eurDay(stageTotals[2])}
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
          <span className="font-semibold text-foreground">
            CPLs reales de mayo · referencia histórica · independiente del escenario.
          </span>{" "}
          Los Lookalike son los más baratos (audiencia similar a clientes) · priorizar escalar
          esos. Lista ordenada por costo por registro real de mayo · los conjuntos nuevos (sin
          CPL aún) van al final.
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
                <Th align="right">% campaña</Th>
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
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[12px] tabular">{pct(a.share)}</td>
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
