"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { Campaign, DailyRow } from "@/lib/types";
import { useDashboard } from "@/lib/store";
import { cn, fmt, cptTone } from "@/lib/utils";
import { cptVsGroupAvg } from "@/lib/selectors";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Sparkline } from "@/components/fx/sparkline";
import { Badge } from "@/components/ui/badge";
import { computeSeverityContext } from "./severity-explainer";
import { PLAN } from "@/lib/config";

interface Props {
  campaign: Campaign;
  allCampaigns: Campaign[];
}

const VERTICAL_EMOJI: Record<string, string> = {
  Belleza: "💄",
  Comercio: "🛍️",
  Servicios: "🛠️",
};

function geoChip(geo: string): { label: string; emoji: string } {
  // ES_ES, MX, CR+PA+CL+CO, etc.
  if (geo === "MX") return { label: "México", emoji: "🇲🇽" };
  if (geo === "ES") return { label: "España", emoji: "🇪🇸" };
  if (geo.includes("+")) return { label: "LATAM", emoji: "🌎" };
  return { label: geo, emoji: "🌐" };
}

export function CampaignExpandableCard({ campaign: c, allCampaigns }: Props) {
  const { daily } = useDashboard();
  const [open, setOpen] = React.useState(false);

  const sev = computeSeverityContext(c, daily, 7);
  const vsAvg = cptVsGroupAvg(c, allCampaigns);
  const spPct = Math.round((c.spend / PLAN.budget) * 100);
  const cvr = c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(1) : "—";

  // rows del último N para sparkline + tabla
  const rows: DailyRow[] = React.useMemo(
    () =>
      daily
        .filter((r) => r.campaignId === c.cid && !r.adsetId)
        .sort((a, b) => (a.date > b.date ? 1 : -1))
        .slice(-7),
    [daily, c.cid],
  );

  const fColor =
    sev.effective === "critical"
      ? "var(--destructive)"
      : sev.effective === "warn"
        ? "var(--warning)"
        : sev.effective === "anomaly"
          ? "var(--brand-ember)"
          : "var(--success)";

  const geo = geoChip(c.geo);

  // Sparkline series (CPT por día · gasto/conv del día)
  const cptSeries = rows.map((r) => {
    const ev = c.event === "CompleteRegistration" ? r.evCompleteReg : r.evInitCheckout;
    return ev > 0 ? r.spend / ev : 0;
  });
  const spendSeries = rows.map((r) => r.spend);

  return (
    <SpotlightCard className="p-4" spotlightColor={fColor} intensity={0.25}>
      {/* Header con nombre real */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left group"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="font-mono text-[9px]">
                <span className="mr-1" aria-hidden>{geo.emoji}</span>
                {geo.label}
              </Badge>
              <Badge variant="outline" className="text-[9px]">
                <span className="mr-1" aria-hidden>{VERTICAL_EMOJI[c.vertical] ?? "📊"}</span>
                {c.vertical}
              </Badge>
              <Badge variant="outline" className="text-[9px]">
                {c.event === "CompleteRegistration" ? "CR" : "IC"}
              </Badge>
            </div>
            <div className="mt-1.5 font-mono text-[11.5px] font-bold leading-tight text-foreground break-all">
              {c.name}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={
                sev.effective === "critical"
                  ? "danger"
                  : sev.effective === "warn"
                    ? "warning"
                    : sev.effective === "anomaly"
                      ? "ember"
                      : "success"
              }
            >
              {sev.effective === "critical"
                ? "Crítico"
                : sev.effective === "warn"
                  ? "Atención"
                  : sev.effective === "anomaly"
                    ? "Anomalía"
                    : "OK"}
            </Badge>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform shrink-0",
                open && "rotate-180",
              )}
            />
          </div>
        </div>

        {/* Tag temporal con contexto */}
        <div className="mb-2 text-[10px] text-muted-foreground italic">{sev.label}</div>
      </button>

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
      {vsAvg.groupAvg !== null && c.cpt !== null && sev.effective !== "anomaly" && (
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

      {/* Bloque expansible */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3 border-t border-border/40 space-y-3">
              {/* Justificación del status */}
              <div
                className="rounded-md border p-2.5"
                style={{
                  background: `hsl(${fColor} / 0.06)`,
                  borderColor: `hsl(${fColor} / 0.35)`,
                }}
              >
                <div className="text-[9px] uppercase tracking-[0.1em] font-bold text-muted-foreground mb-1">
                  Por qué este status
                </div>
                <p className="text-[11px] leading-relaxed text-foreground/85">{sev.reason}</p>
              </div>

              {/* Sparklines */}
              {rows.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border/60 bg-background/30 p-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
                      CPT últimos {rows.length}d
                    </div>
                    <Sparkline
                      data={cptSeries.length ? cptSeries : [0]}
                      color={`hsl(${fColor})`}
                      height={26}
                      className="w-full"
                    />
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/30 p-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
                      Gasto últimos {rows.length}d
                    </div>
                    <Sparkline
                      data={spendSeries.length ? spendSeries : [0]}
                      color="hsl(var(--brand-violet))"
                      height={26}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Tabla diaria */}
              {rows.length > 0 && (
                <div className="rounded-md border border-border/60 bg-background/30 overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-2 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border/60 bg-background/50">
                    <span>Día</span>
                    <span className="text-right">Gasto</span>
                    <span className="text-right">{c.event === "CompleteRegistration" ? "CR" : "IC"}</span>
                    <span className="text-right">CPT</span>
                    <span className="text-right">CTR</span>
                  </div>
                  {rows.map((r) => {
                    const ev = c.event === "CompleteRegistration" ? r.evCompleteReg : r.evInitCheckout;
                    const cpt = ev > 0 ? r.spend / ev : null;
                    return (
                      <div
                        key={r.date}
                        className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-2 px-2.5 py-1 text-[10px] font-mono tabular border-b border-border/30 last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {r.date.slice(5)}
                        </span>
                        <span className="text-right text-foreground">{fmt.eur(r.spend, { decimals: 0 })}</span>
                        <span className="text-right text-foreground">{fmt.int(ev)}</span>
                        <span
                          className={cn(
                            "text-right",
                            cpt !== null && cpt > 5.5 && "text-[hsl(var(--destructive))]",
                            cpt !== null && cpt > 3 && cpt <= 5.5 && "text-[hsl(var(--warning))]",
                            cpt !== null && cpt <= 2.2 && "text-[hsl(var(--success))]",
                          )}
                        >
                          {cpt === null ? "—" : fmt.eur(cpt)}
                        </span>
                        <span className="text-right text-muted-foreground">
                          {r.ctr.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {rows.length === 0 && (
                <p className="text-[10.5px] text-muted-foreground italic">
                  Sin breakdown diario disponible para esta campaña en el rango activo.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SpotlightCard>
  );
}

function Row({
  k,
  v,
  tone = "default",
}: {
  k: string;
  v: React.ReactNode;
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
      </span>
    </div>
  );
}
