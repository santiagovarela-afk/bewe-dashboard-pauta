"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Activity,
  Target,
  Sparkles as SpkIcon,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingDown,
  MessageSquareText,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { fmt, cn, cptTone, ctrTone, cpmTone, CPT_THRESHOLDS } from "@/lib/utils";
import { PLAN } from "@/lib/config";
import {
  attentionCampaigns,
  bestCptCampaign,
  byGeo,
  byVertical,
  cptVsGroupAvg,
  criticalCampaigns,
  pacingPct,
  planBStatus,
  severityOf,
  suggestedAction,
  type GroupAggregate,
  type Severity,
} from "@/lib/selectors";
import { SectionHeader } from "@/components/shared/section-header";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { HealthPill, SeverityDot } from "@/components/shared/health-pill";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import type { Adset, Campaign, DailyRow } from "@/lib/types";

const VERT_COLOR = {
  Belleza: "var(--brand-violet)",
  Comercio: "var(--brand-cyan)",
  Servicios: "var(--brand-lime)",
} as const;

const SEV_BADGE: Record<Severity, { label: string; tone: "danger" | "warning" | "ember" | "success" }> = {
  critical: { label: "Crítico", tone: "danger" },
  warn: { label: "Atención", tone: "warning" },
  anomaly: { label: "Anomalía", tone: "ember" },
  ok: { label: "OK", tone: "success" },
};

type SortKey = "code" | "spend" | "cpt" | "conv" | "ctr" | "pacing";
type SortDir = "asc" | "desc";

/** Recorrido histórico ·  últimos 7 días vs 7 días anteriores · para contexto en cards de atención. */
interface CampaignTrail {
  spend7d: number;
  conv7d: number;
  cpt7d: number | null;
  cptPrev7d: number | null;
  cptTrend: "up" | "down" | "flat";
  freq: number;
}

function computeTrail(campaignId: string, event: Campaign["event"], daily: DailyRow[], freq: number): CampaignTrail {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const todayIso = iso(today);
  const d7Ago = new Date(today);
  d7Ago.setDate(d7Ago.getDate() - 6);
  const d7AgoIso = iso(d7Ago);
  const d14Ago = new Date(today);
  d14Ago.setDate(d14Ago.getDate() - 13);
  const d14AgoIso = iso(d14Ago);
  const d8Ago = new Date(today);
  d8Ago.setDate(d8Ago.getDate() - 7);
  const d8AgoIso = iso(d8Ago);

  // Solo rows campaign-level (sin adsetId) y de esta campaña
  const rows = daily.filter((r) => !r.adsetId && r.campaignId === campaignId);
  const last7 = rows.filter((r) => r.date >= d7AgoIso && r.date <= todayIso);
  const prev7 = rows.filter((r) => r.date >= d14AgoIso && r.date <= d8AgoIso);

  const sumSpend = (arr: DailyRow[]) => arr.reduce((s, r) => s + r.spend, 0);
  const sumConv = (arr: DailyRow[]) =>
    arr.reduce(
      (s, r) => s + (event === "CompleteRegistration" ? r.evCompleteReg : r.evInitCheckout),
      0,
    );

  const spend7d = sumSpend(last7);
  const conv7d = sumConv(last7);
  const spendPrev7 = sumSpend(prev7);
  const convPrev7 = sumConv(prev7);

  const cpt7d = conv7d > 0 ? spend7d / conv7d : null;
  const cptPrev7d = convPrev7 > 0 ? spendPrev7 / convPrev7 : null;

  let cptTrend: "up" | "down" | "flat" = "flat";
  if (cpt7d !== null && cptPrev7d !== null) {
    const diffPct = ((cpt7d - cptPrev7d) / cptPrev7d) * 100;
    if (diffPct > 8) cptTrend = "up";
    else if (diffPct < -8) cptTrend = "down";
  }
  return { spend7d, conv7d, cpt7d, cptPrev7d, cptTrend, freq };
}

export function TabCampanas() {
  const { campaigns, adsets, daysElapsed, daily } = useDashboard();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<SortKey>("spend");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const crit = criticalCampaigns(campaigns);
  const attn = attentionCampaigns(campaigns);
  const best = bestCptCampaign(campaigns);
  const planB = planBStatus(campaigns, daysElapsed);

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalCR = campaigns.reduce((s, c) => s + c.evCompleteReg, 0);
  const totalIC = campaigns.reduce((s, c) => s + c.evInitCheckout, 0);

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "code" ? "asc" : "desc");
    }
  }

  const sorted = React.useMemo(() => {
    const arr = [...campaigns];
    arr.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortBy) {
        case "code":
          av = a.code;
          bv = b.code;
          break;
        case "spend":
          av = a.spend;
          bv = b.spend;
          break;
        case "cpt":
          av = a.cpt ?? Number.POSITIVE_INFINITY;
          bv = b.cpt ?? Number.POSITIVE_INFINITY;
          break;
        case "conv":
          av = a.conversions;
          bv = b.conversions;
          break;
        case "ctr":
          av = a.ctr;
          bv = b.ctr;
          break;
        case "pacing":
          av = pacingPct(a, daysElapsed);
          bv = pacingPct(b, daysElapsed);
          break;
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const diff = (av as number) - (bv as number);
      return sortDir === "asc" ? diff : -diff;
    });
    return arr;
  }, [campaigns, sortBy, sortDir, daysElapsed]);

  return (
    <div className="space-y-7 max-w-[1500px]">
      <SectionHeader
        title="Campañas · MAY26"
        sub={
          <>
            6 campañas · {fmt.eur(totalSpend, { decimals: 0 })} gastado · {fmt.int(totalCR)} CR ·{" "}
            {fmt.int(totalIC)} IC
          </>
        }
      />

      {/* ───────────────── 1 · TOP KPIs accionables ───────────────── */}
      <section className="grid md:grid-cols-3 gap-3">
        <Reveal delay={0}>
          <TopKpi
            label="Campañas en crítico"
            value={crit.length}
            sub={
              crit.length > 0
                ? `${crit.map((c) => c.code).join(" · ")} requieren acción`
                : "Sin críticos abiertos"
            }
            tone={crit.length > 0 ? "danger" : "success"}
            Icon={crit.length > 0 ? AlertOctagon : CheckCircle2}
          />
        </Reveal>
        <Reveal delay={0.06}>
          <TopKpi
            label="Mejor CPT del grupo"
            value={best?.cpt ?? 0}
            valueFormat={(v) => (best ? fmt.eur(v) : "—")}
            sub={
              best
                ? `${best.code} ${best.vertical} · ${best.conversions} conv`
                : "Sin datos suficientes"
            }
            tone="success"
            Icon={CheckCircle2}
          />
        </Reveal>
        <Reveal delay={0.12}>
          <TopKpi
            label="Plan B · C2"
            valueText={
              planB.status === "activated"
                ? "Activado"
                : planB.status === "pending"
                  ? "Pendiente"
                  : planB.status === "watch"
                    ? "Vigilando"
                    : "—"
            }
            sub={planB.detail}
            tone={
              planB.status === "pending"
                ? "danger"
                : planB.status === "activated"
                  ? "success"
                  : "warning"
            }
            Icon={
              planB.status === "pending"
                ? AlertOctagon
                : planB.status === "activated"
                  ? CheckCircle2
                  : AlertTriangle
            }
          />
        </Reveal>
      </section>

      {/* ───────────────── 2 · Atención requerida ───────────────── */}
      {attn.length > 0 && (
        <section>
          <SectionHeader
            title={`Atención requerida · ${attn.length}`}
            sub="Campañas que necesitan acción esta semana"
          />
          <StaggerGroup className="grid lg:grid-cols-2 gap-3" stagger={0.08}>
            {attn.map((c) => (
              <StaggerItem key={c.cid}>
                <AttentionCard
                  c={c}
                  onOpen={() => setSelected(c.cid)}
                  daysElapsed={daysElapsed}
                  daily={daily}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      )}

      {/* ───────────────── 3 · Status grid (tabla densa) ───────────────── */}
      <section>
        <SectionHeader
          title="Estado completo · todas las campañas"
          sub="Click en fila para ver adsets y métricas detalladas"
          right={
            <Badge variant="outline" className="font-mono">
              {sorted.length} campañas
            </Badge>
          }
        />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[920px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                <tr className="border-b border-border/60">
                  <Th onClick={() => toggleSort("code")} active={sortBy === "code"} dir={sortDir}>
                    Camp.
                  </Th>
                  <Th>Vertical · Geo</Th>
                  <Th>Estado</Th>
                  <Th onClick={() => toggleSort("spend")} active={sortBy === "spend"} dir={sortDir} align="right">
                    Gasto
                  </Th>
                  <Th onClick={() => toggleSort("conv")} active={sortBy === "conv"} dir={sortDir} align="right">
                    Conv.
                  </Th>
                  <Th onClick={() => toggleSort("cpt")} active={sortBy === "cpt"} dir={sortDir} align="right">
                    <ExplainedMetric
                      explanation={
                        <>
                          <b>CPT</b> = gasto / conversión del evento de la campaña.<br />
                          Objetivo ≤ €{CPT_THRESHOLDS.target} · Atención {">"} €{CPT_THRESHOLDS.warn} · Crítico {">"} €{CPT_THRESHOLDS.critical}.
                        </>
                      }
                    >
                      <span>CPT</span>
                    </ExplainedMetric>
                  </Th>
                  <Th onClick={() => toggleSort("ctr")} active={sortBy === "ctr"} dir={sortDir} align="right">
                    <ExplainedMetric
                      explanation={
                        <>
                          <b>CTR</b> = clicks / impresiones. Saludable entre 1,5% y 2,5%.
                        </>
                      }
                    >
                      <span>CTR</span>
                    </ExplainedMetric>
                  </Th>
                  <Th align="right">
                    <ExplainedMetric
                      explanation={
                        <>
                          <b>CPM</b> = costo por mil impresiones. Saludable ≤ €9. {">"} €12 indica audiencia cara.
                        </>
                      }
                    >
                      <span>CPM</span>
                    </ExplainedMetric>
                  </Th>
                  <Th onClick={() => toggleSort("pacing")} active={sortBy === "pacing"} dir={sortDir} align="right">
                    <ExplainedMetric
                      explanation={
                        <>
                          <b>Pacing</b> = gasto actual / (presupuesto diario × días transcurridos).
                          100% = al ritmo. {">"} 115% sobre-pacing · &lt; 70% lento (tras día 3).
                        </>
                      }
                    >
                      <span>Pacing</span>
                    </ExplainedMetric>
                  </Th>
                  <th className="text-right px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <CampaignRow
                    key={c.cid}
                    c={c}
                    daysElapsed={daysElapsed}
                    index={i}
                    expanded={selected === c.cid}
                    onClick={() => setSelected((s) => (s === c.cid ? null : c.cid))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* Detalle expandible */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 12, height: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <DetailPanel
              campaign={campaigns.find((c) => c.cid === selected)!}
              adsets={adsets.filter((a) => a.cid === selected)}
              daysElapsed={daysElapsed}
              allCampaigns={campaigns}
              onClose={() => setSelected(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────────────── 5 · Comparativos vertical / geo ───────────────── */}
      <section className="grid lg:grid-cols-2 gap-4">
        <GroupCard title="Por vertical" groups={byVertical(campaigns)} colorOf={(k) => VERT_COLOR[k as keyof typeof VERT_COLOR] ?? "var(--brand-violet)"} />
        <GroupCard title="Por geografía" groups={byGeo(campaigns)} colorOf={() => "var(--brand-cyan)"} />
      </section>
    </div>
  );
}

/* ─────────────── Top KPIs ─────────────── */

function TopKpi({
  label,
  value,
  valueText,
  valueFormat = fmt.int,
  sub,
  tone,
  Icon,
}: {
  label: string;
  value?: number;
  valueText?: string;
  valueFormat?: (v: number) => string;
  sub: string;
  tone: "success" | "danger" | "warning";
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const color =
    tone === "danger"
      ? "var(--destructive)"
      : tone === "warning"
        ? "var(--warning)"
        : "var(--success)";
  return (
    <SpotlightCard spotlightColor={color} intensity={0.28} className="p-4">
      <div className="flex items-start justify-between mb-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div
          className="size-7 grid place-items-center rounded-md border"
          style={{
            background: `hsl(${color} / 0.12)`,
            borderColor: `hsl(${color} / 0.4)`,
            color: `hsl(${color})`,
          }}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      <div
        className="font-mono font-bold text-[26px] leading-none tabular"
        style={{ color: `hsl(${color})` }}
      >
        {valueText ?? (
          <AnimatedNumber value={value ?? 0} format={valueFormat} duration={1.4} />
        )}
      </div>
      <div className="text-[11px] text-muted-foreground mt-2 leading-snug">{sub}</div>
    </SpotlightCard>
  );
}

/* ─────────────── Attention Card ─────────────── */

function AttentionCard({
  c,
  onOpen,
  daysElapsed,
  daily,
}: {
  c: Campaign;
  onOpen: () => void;
  daysElapsed: number;
  daily: DailyRow[];
}) {
  const sev = severityOf(c);
  const color =
    sev === "critical"
      ? "var(--destructive)"
      : sev === "warn"
        ? "var(--warning)"
        : sev === "anomaly"
          ? "var(--brand-ember)"
          : "var(--success)";
  const action = suggestedAction(c);
  const vertColor = VERT_COLOR[c.vertical];
  const pacing = pacingPct(c, daysElapsed);
  const trail = React.useMemo(
    () => computeTrail(c.cid, c.event, daily, c.freq),
    [c.cid, c.event, c.freq, daily],
  );
  const hasTrailData = daily.length > 0;

  return (
    <SpotlightCard spotlightColor={color} intensity={0.32} className="p-0 overflow-hidden">
      <div
        className="px-4 py-3 flex items-start justify-between gap-3 border-b border-border/40"
        style={{ background: `linear-gradient(135deg, hsl(${color} / 0.10), transparent 70%)` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded shrink-0"
            style={{
              background: `hsl(${vertColor} / 0.18)`,
              color: `hsl(${vertColor})`,
            }}
          >
            {c.code}
          </span>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold leading-tight truncate">
              {c.vertical} · {c.geo}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono truncate" title={c.name}>{c.name}</div>
          </div>
        </div>
        <HealthPill severity={sev} />
      </div>

      <div className="px-4 py-3 grid grid-cols-4 gap-3 border-b border-border/40 bg-background/30">
        <SmallStat label="Gasto" value={fmt.eur(c.spend, { decimals: 0 })} />
        <SmallStat
          label="Conv."
          value={fmt.int(c.conversions)}
          tone={c.conversions > 0 ? "success" : "muted"}
        />
        <SmallStat
          label="CPT"
          value={c.cpt === null ? "—" : fmt.eur(c.cpt)}
          tone={cptTone(c.cpt) === "success" ? "success" : cptTone(c.cpt) === "warning" ? "warning" : cptTone(c.cpt) === "danger" ? "danger" : "muted"}
        />
        <SmallStat
          label="Pacing"
          value={`${Math.round(pacing)}%`}
          tone={pacing > 115 ? "danger" : pacing < 70 && daysElapsed >= 3 ? "warning" : "success"}
        />
      </div>

      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="size-8 grid place-items-center rounded-lg border shrink-0 mt-0.5"
          style={{
            background: `hsl(${color} / 0.12)`,
            borderColor: `hsl(${color} / 0.4)`,
            color: `hsl(${color})`,
          }}
        >
          <ArrowRightCircle />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
            Acción sugerida
          </div>
          <div className="text-[12px] font-semibold leading-tight">{action.label}</div>
          <div className="text-[11px] text-muted-foreground leading-relaxed mt-1">
            {action.detail}
          </div>
        </div>
      </div>

      {/* Recorrido · contexto histórico antes de decidir */}
      <div className="px-4 py-3 border-t border-border/40 bg-background/40">
        <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80 mb-2 font-bold">
          Recorrido · últimos 7d
        </div>
        {hasTrailData ? (
          <div className="grid grid-cols-4 gap-2">
            <TrailMetric
              label="7d Gasto"
              value={fmt.eur(trail.spend7d, { decimals: 0 })}
            />
            <TrailMetric
              label={c.event === "CompleteRegistration" ? "7d CR" : "7d IC"}
              value={fmt.int(trail.conv7d)}
              tone={trail.conv7d > 0 ? "default" : "muted"}
            />
            <TrailMetric
              label="CPT trend"
              value={
                trail.cpt7d !== null
                  ? `${fmt.eur(trail.cpt7d)} ${trail.cptTrend === "up" ? "↑" : trail.cptTrend === "down" ? "↓" : "→"}`
                  : "—"
              }
              tone={
                trail.cptTrend === "down"
                  ? "success"
                  : trail.cptTrend === "up"
                    ? "danger"
                    : "muted"
              }
              sub={
                trail.cptPrev7d !== null
                  ? `vs €${trail.cptPrev7d.toFixed(2)} prev`
                  : "sin prev 7d"
              }
            />
            <TrailMetric
              label="Frecuencia"
              value={`${trail.freq.toFixed(2)}×`}
              tone={trail.freq > 1.9 ? "danger" : trail.freq > 1.5 ? "warning" : "default"}
            />
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground/70 italic">
            Sin breakdown diario · pulsá "Actualizar" para cargar histórico.
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 flex items-center justify-end gap-2 border-t border-border/40 bg-background/30">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px]"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("bw:ai-ask", { detail: { campaign: c.code, action: action.label } }),
            )
          }
        >
          <MessageSquareText className="size-3" /> Preguntar al AI
        </Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={onOpen}>
          Ver detalle <ChevronRight className="size-3" />
        </Button>
      </div>
    </SpotlightCard>
  );
}

function ArrowRightCircle() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="m12 16 4-4-4-4" />
      <path d="M8 12h8" />
    </svg>
  );
}

function SmallStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const cls = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
    muted: "text-muted-foreground/70",
  }[tone];
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
        {label}
      </div>
      <div className={cn("font-mono font-bold text-[13px] tabular leading-none", cls)}>
        {value}
      </div>
    </div>
  );
}

function TrailMetric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const cls = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
    muted: "text-muted-foreground/70",
  }[tone];
  return (
    <div className="px-2 py-1.5 rounded-md bg-secondary/40 border border-border/30">
      <div className="text-[8px] uppercase tracking-[0.1em] text-muted-foreground leading-none">
        {label}
      </div>
      <div className={cn("font-mono font-bold text-[12px] tabular leading-tight mt-1", cls)}>
        {value}
      </div>
      {sub && (
        <div className="text-[9px] text-muted-foreground/70 mt-0.5 font-mono leading-none">
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Status table ─────────────── */

function Th({
  children,
  onClick,
  active,
  dir,
  align = "left",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: SortDir;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] select-none",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        onClick && "cursor-pointer hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      onClick={onClick}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end w-full")}>
        {children}
        {onClick && (
          <span className="text-muted-foreground/40">
            {active ? (
              dir === "asc" ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )
            ) : (
              <ArrowUpDown className="size-2.5" />
            )}
          </span>
        )}
      </span>
    </th>
  );
}

function CampaignRow({
  c,
  daysElapsed,
  index,
  expanded,
  onClick,
}: {
  c: Campaign;
  daysElapsed: number;
  index: number;
  expanded: boolean;
  onClick: () => void;
}) {
  const sev = severityOf(c);
  const sevColor =
    sev === "critical"
      ? "var(--destructive)"
      : sev === "warn"
        ? "var(--warning)"
        : sev === "anomaly"
          ? "var(--brand-ember)"
          : "var(--success)";
  const vertColor = VERT_COLOR[c.vertical];
  const pacing = pacingPct(c, daysElapsed);
  const pacingTone: "danger" | "warning" | "success" =
    pacing > 115 ? "danger" : pacing < 70 && daysElapsed >= 3 ? "warning" : "success";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      onClick={onClick}
      className={cn(
        "border-b border-border/30 cursor-pointer transition-colors group",
        expanded ? "bg-secondary/60" : "hover:bg-secondary/40",
      )}
      style={{ borderLeft: `2px solid hsl(${sevColor} / ${sev === "ok" ? 0 : 0.7})` }}
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <SeverityDot severity={sev} pulse={sev === "critical"} />
          <span
            className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded"
            style={{
              background: `hsl(${vertColor} / 0.15)`,
              color: `hsl(${vertColor})`,
            }}
          >
            {c.code}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="text-[11px] text-foreground/90 leading-tight">{c.vertical}</div>
        <div className="text-[10px] text-muted-foreground font-mono">{c.geo}</div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col gap-1 items-start">
          <Badge
            variant={c.status === "ACTIVE" ? "success" : "outline"}
            className="!text-[8px] !py-0 !px-1.5"
          >
            {c.status}
          </Badge>
          <span className="text-[9px] text-muted-foreground/80 uppercase tracking-wider">
            {c.event === "CompleteRegistration" ? "CR" : "IC"}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="font-mono font-bold text-[12px] tabular">
          {fmt.eur(c.spend, { decimals: 0 })}
        </div>
        <div className="text-[9px] text-muted-foreground/70 font-mono">
          €{c.daily}/d · €{c.total} plan
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <div
          className={cn(
            "font-mono font-bold text-[12px] tabular",
            c.conversions > 0 ? "text-[hsl(var(--success))]" : "text-muted-foreground/50",
          )}
        >
          {fmt.int(c.conversions)}
        </div>
        <div className="text-[9px] text-muted-foreground/70">
          {c.event === "CompleteRegistration" ? "registros" : "init pay"}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <div
          className={cn(
            "font-mono font-bold text-[12px] tabular",
            cptTone(c.cpt) === "success" && "text-[hsl(var(--success))]",
            cptTone(c.cpt) === "warning" && "text-[hsl(var(--warning))]",
            cptTone(c.cpt) === "danger" && "text-[hsl(var(--destructive))]",
            cptTone(c.cpt) === "default" && "text-muted-foreground/60",
          )}
        >
          {c.cpt === null ? "—" : fmt.eur(c.cpt)}
        </div>
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right font-mono text-[11px] tabular",
          ctrTone(c.ctr) === "success" && "text-[hsl(var(--success))]",
          ctrTone(c.ctr) === "warning" && "text-[hsl(var(--warning))]",
          ctrTone(c.ctr) === "danger" && "text-[hsl(var(--destructive))]",
        )}
      >
        {fmt.pct(c.ctr)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right font-mono text-[11px] tabular",
          cpmTone(c.cpm) === "success" && "text-[hsl(var(--success))]",
          cpmTone(c.cpm) === "warning" && "text-[hsl(var(--warning))]",
          cpmTone(c.cpm) === "danger" && "text-[hsl(var(--destructive))]",
        )}
      >
        {fmt.eur(c.cpm)}
      </td>
      <td className="px-3 py-2.5 text-right">
        <div
          className={cn(
            "font-mono font-bold text-[11px] tabular inline-flex items-center gap-1",
            pacingTone === "danger" && "text-[hsl(var(--destructive))]",
            pacingTone === "warning" && "text-[hsl(var(--warning))]",
            pacingTone === "success" && "text-[hsl(var(--success))]",
          )}
        >
          {Math.round(pacing)}%
        </div>
        <div className="h-1 w-14 ml-auto mt-0.5 rounded-full bg-border/60 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(pacing, 100)}%`,
              background:
                pacingTone === "danger"
                  ? "hsl(var(--destructive))"
                  : pacingTone === "warning"
                    ? "hsl(var(--warning))"
                    : "hsl(var(--success))",
            }}
          />
        </div>
      </td>
      <td className="px-3 py-2.5 text-right text-muted-foreground/50">
        {expanded ? <ChevronUp className="size-3.5 inline" /> : <ChevronDown className="size-3.5 inline" />}
      </td>
    </motion.tr>
  );
}

/* ─────────────── Detail Panel ─────────────── */

function DetailPanel({
  campaign,
  adsets,
  daysElapsed,
  allCampaigns,
  onClose,
}: {
  campaign: Campaign;
  adsets: Adset[];
  daysElapsed: number;
  allCampaigns: Campaign[];
  onClose: () => void;
}) {
  const sev = severityOf(campaign);
  const sevColor =
    sev === "critical"
      ? "var(--destructive)"
      : sev === "warn"
        ? "var(--warning)"
        : sev === "anomaly"
          ? "var(--brand-ember)"
          : "var(--success)";
  const vertColor = VERT_COLOR[campaign.vertical];
  const action = suggestedAction(campaign);
  const pacing = pacingPct(campaign, daysElapsed);
  const cvr = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : "—";
  const vsAvg = cptVsGroupAvg(campaign, allCampaigns);

  return (
    <TextureCard className="overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40"
        style={{ borderLeft: `3px solid hsl(${sevColor})` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="font-mono font-bold text-[11px] px-2 py-0.5 rounded"
            style={{
              background: `hsl(${vertColor} / 0.18)`,
              color: `hsl(${vertColor})`,
            }}
          >
            {campaign.code}
          </span>
          <span className="font-mono text-[12px] font-medium truncate" title={campaign.name}>{campaign.name}</span>
          <HealthPill severity={sev} />
          <Badge variant="outline" className="!text-[9px]">
            {adsets.length} adsets
          </Badge>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="size-7 grid place-items-center rounded-md border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="p-5 grid lg:grid-cols-[1.4fr_1fr] gap-5">
        {/* Métricas + acción */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <DetailMetric label="Gasto" value={fmt.eur(campaign.spend, { decimals: 0 })} sub={`€${campaign.daily}/día`} />
            <DetailMetric
              label={campaign.event === "CompleteRegistration" ? "CompleteReg" : "InitCheckout"}
              value={fmt.int(campaign.conversions)}
              sub={`${cvr}% CVR`}
            />
            <DetailMetric
              label="CPT"
              value={campaign.cpt === null ? "—" : fmt.eur(campaign.cpt)}
              sub={`obj. ≤ €${CPT_THRESHOLDS.target}`}
              tone={cptTone(campaign.cpt) === "success" ? "success" : cptTone(campaign.cpt) === "warning" ? "warning" : cptTone(campaign.cpt) === "danger" ? "danger" : "muted"}
            />
            <DetailMetric
              label="CTR"
              value={fmt.pct(campaign.ctr)}
              sub="obj. 1.5 – 2.5%"
              tone={ctrTone(campaign.ctr) === "success" ? "success" : ctrTone(campaign.ctr) === "warning" ? "warning" : "danger"}
            />
            <DetailMetric
              label="CPM"
              value={fmt.eur(campaign.cpm)}
              sub="obj. ≤ €9"
              tone={cpmTone(campaign.cpm) === "success" ? "success" : cpmTone(campaign.cpm) === "warning" ? "warning" : "danger"}
            />
            <DetailMetric
              label="Pacing"
              value={`${Math.round(pacing)}%`}
              sub={`día ${daysElapsed}`}
              tone={pacing > 115 ? "danger" : pacing < 70 && daysElapsed >= 3 ? "warning" : "success"}
            />
          </div>

          {/* Comparativo CPT vs promedio */}
          {vsAvg.groupAvg !== null && campaign.cpt !== null && (
            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingDown className="size-3" /> CPT vs. promedio del grupo (
                {campaign.event === "CompleteRegistration" ? "CR" : "IC"})
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                <span className="text-muted-foreground">Esta campaña:</span>
                <span
                  className={cn(
                    "font-bold tabular",
                    vsAvg.diffPct > 30
                      ? "text-[hsl(var(--destructive))]"
                      : vsAvg.diffPct < -10
                        ? "text-[hsl(var(--success))]"
                        : "text-foreground",
                  )}
                >
                  {fmt.eur(campaign.cpt)} ({vsAvg.diffPct > 0 ? "+" : ""}
                  {vsAvg.diffPct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] font-mono mt-1">
                <span className="text-muted-foreground">Promedio grupo:</span>
                <span className="text-muted-foreground tabular">{fmt.eur(vsAvg.groupAvg)}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-border/60 overflow-hidden relative">
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-foreground/50 z-10"
                  style={{ left: "50%" }}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, 50 + vsAvg.diffPct / 2)}%`,
                  }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                  style={{
                    background:
                      vsAvg.diffPct > 0 ? "hsl(var(--destructive))" : "hsl(var(--success))",
                  }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-1.5 leading-snug">
                {vsAvg.diffPct > 30
                  ? "Muy por encima del grupo. Reasignar o pausar adsets caros."
                  : vsAvg.diffPct < -10
                    ? "Mejor que el promedio. Considerar subir presupuesto."
                    : "En línea con el resto del grupo."}
              </div>
            </div>
          )}

          {/* Acción sugerida */}
          <div
            className="rounded-lg border p-4"
            style={{
              borderColor: `hsl(${sevColor} / 0.4)`,
              background: `hsl(${sevColor} / 0.06)`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="size-9 grid place-items-center rounded-lg border shrink-0"
                style={{
                  background: `hsl(${sevColor} / 0.14)`,
                  borderColor: `hsl(${sevColor} / 0.45)`,
                  color: `hsl(${sevColor})`,
                }}
              >
                {sev === "ok" ? <CheckCircle2 className="size-4" /> : <AlertOctagon className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
                  Acción sugerida
                </div>
                <div className="text-[13px] font-semibold leading-tight">{action.label}</div>
                <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                  {action.detail}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[10px]"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("bw:ai-ask", {
                          detail: { campaign: campaign.code, action: action.label },
                        }),
                      )
                    }
                  >
                    <MessageSquareText className="size-3" /> Preguntar al AI sobre esta campaña
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Funnel + meta */}
        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
              Embudo de la campaña
            </div>
            <FunnelStep label="Contacto" value={campaign.evContact} color="var(--brand-cyan)" Icon={SpkIcon} />
            <FunnelStep label="Inicio pago" value={campaign.evInitCheckout} color="var(--brand-violet)" Icon={Activity} />
            <FunnelStep label="Registro" value={campaign.evCompleteReg} color="var(--brand-lime)" Icon={Target} />
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1.5">
            <KV k="Alcance" v={fmt.short(campaign.reach)} />
            <KV k="Frecuencia" v={`${campaign.freq.toFixed(2)}×`} />
            <KV k="Impresiones" v={fmt.int(campaign.impressions)} />
            <KV k="Clicks" v={fmt.int(campaign.clicks)} />
            <KV k="Plan total" v={fmt.eur(campaign.total, { decimals: 0 })} />
            <KV k="Plan diario" v={fmt.eur(campaign.daily, { decimals: 0 })} />
          </div>
        </div>
      </div>

      {/* Adsets table */}
      <div className="border-t border-border">
        <div className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground bg-background/40">
          Adsets · {adsets.length}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-background/60">
                {["Conjunto", "Gasto", "Impr.", "Clicks", "CTR", "CPM", "Conv.", "CPT"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adsets.map((a, i) => (
                <motion.tr
                  key={a.name}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="border-b border-border/30 hover:bg-secondary/60 transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-[11px] text-foreground/90 max-w-[260px] truncate" title={a.name}>
                    <span className="flex items-center gap-1.5">
                      {a.warn && (
                        <AlertOctagon className="size-3 text-[hsl(var(--warning))] shrink-0" />
                      )}
                      {a.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px]">{fmt.eur(a.spend)}</td>
                  <td className="px-4 py-2 font-mono text-muted-foreground text-[11px]">
                    {fmt.int(a.impressions)}
                  </td>
                  <td className="px-4 py-2 font-mono text-muted-foreground text-[11px]">
                    {fmt.int(a.clicks)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2 font-mono text-[11px]",
                      ctrTone(a.ctr) === "success" && "text-[hsl(var(--success))]",
                      ctrTone(a.ctr) === "warning" && "text-[hsl(var(--warning))]",
                      ctrTone(a.ctr) === "danger" && "text-[hsl(var(--destructive))]",
                    )}
                  >
                    {fmt.pct(a.ctr)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2 font-mono text-[11px]",
                      cpmTone(a.cpm) === "success" && "text-[hsl(var(--success))]",
                      cpmTone(a.cpm) === "warning" && "text-[hsl(var(--warning))]",
                      cpmTone(a.cpm) === "danger" && "text-[hsl(var(--destructive))]",
                    )}
                  >
                    {fmt.eur(a.cpm)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2 font-mono text-[11px]",
                      a.conversions > 0 ? "text-[hsl(var(--success))]" : "text-muted-foreground/50",
                    )}
                  >
                    {a.conversions > 0 ? fmt.int(a.conversions) : "—"}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2 font-mono font-bold text-[11px]",
                      cptTone(a.cpt) === "success" && "text-[hsl(var(--success))]",
                      cptTone(a.cpt) === "warning" && "text-[hsl(var(--warning))]",
                      cptTone(a.cpt) === "danger" && "text-[hsl(var(--destructive))]",
                    )}
                  >
                    {a.cpt === null ? "—" : fmt.eur(a.cpt)}
                  </td>
                </motion.tr>
              ))}
              {adsets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground/70 text-[11px]">
                    Sin adsets cargados para esta campaña.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TextureCard>
  );
}

function DetailMetric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const cls = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
    muted: "text-muted-foreground/60",
  }[tone];
  return (
    <div className="rounded-lg border border-border/60 bg-background/30 p-3">
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className={cn("font-mono font-bold text-[18px] tabular leading-none", cls)}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70 mt-1.5">{sub}</div>}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between text-[11px]">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono font-semibold tabular">{v}</span>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  color,
  Icon,
}: {
  label: string;
  value: number;
  color: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div
        className="size-7 grid place-items-center rounded-md border shrink-0"
        style={{
          background: `hsl(${color} / 0.12)`,
          borderColor: `hsl(${color} / 0.35)`,
          color: `hsl(${color})`,
        }}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0 text-[11px] text-muted-foreground">{label}</div>
      <div className="font-mono font-bold text-[14px] tabular" style={{ color: `hsl(${color})` }}>
        {fmt.int(value)}
      </div>
    </div>
  );
}

/* ─────────────── Group cards (vertical / geo) ─────────────── */

function GroupCard({
  title,
  groups,
  colorOf,
}: {
  title: string;
  groups: GroupAggregate[];
  colorOf: (key: string) => string;
}) {
  const maxSpend = Math.max(...groups.map((g) => g.spend), 1);
  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h3>
        <Badge variant="outline" className="font-mono">
          {groups.length} grupos
        </Badge>
      </div>
      <div className="space-y-3">
        {groups.map((g, i) => {
          const color = colorOf(g.key);
          const pct = (g.spend / maxSpend) * 100;
          return (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: `hsl(${color})` }}
                  />
                  <span className="font-semibold">{g.key}</span>
                  <span className="text-muted-foreground/70 font-mono text-[10px]">
                    {g.campaigns} camps · {g.critical > 0 ? `${g.critical} crítica${g.critical > 1 ? "s" : ""}` : "ok"}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-foreground">{fmt.eur(g.spend, { decimals: 0 })}</span>
                  <span className="text-muted-foreground tabular w-[68px] text-right">
                    {g.conversions} conv
                  </span>
                  <span
                    className={cn(
                      "tabular font-bold w-[60px] text-right",
                      cptTone(g.cpt) === "success" && "text-[hsl(var(--success))]",
                      cptTone(g.cpt) === "warning" && "text-[hsl(var(--warning))]",
                      cptTone(g.cpt) === "danger" && "text-[hsl(var(--destructive))]",
                      cptTone(g.cpt) === "default" && "text-muted-foreground/60",
                    )}
                  >
                    {g.cpt === null ? "—" : fmt.eur(g.cpt)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `hsl(${color})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.06 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </TextureCard>
  );
}
