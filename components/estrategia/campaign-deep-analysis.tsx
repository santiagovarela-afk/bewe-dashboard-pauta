"use client";
import * as React from "react";
import { motion } from "motion/react";
import { ArrowRight, Flag, Lightbulb, NotebookPen, TrendingDown, TrendingUp } from "lucide-react";
import type { Campaign } from "@/lib/types";
import { cn, fmt, cptTone } from "@/lib/utils";
import { resolveCampaignLearning } from "@/lib/selectors";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { StaggerItem } from "@/components/fx/reveal";
import { LearningCard } from "./learning-card";

export interface CampaignDeepAnalysisProps {
  campaign: Campaign;
  className?: string;
}

function flagColor(flag: Campaign["flag"]) {
  if (flag === "critical") return "var(--destructive)";
  if (flag === "warn") return "var(--warning)";
  if (flag === "anomaly") return "var(--brand-ember)";
  return "var(--success)";
}

function flagLabel(c: Campaign) {
  if (c.status === "PAUSED") return "Pausada";
  if (c.flag === "critical") return "Crítico";
  if (c.flag === "warn") return "Atención";
  if (c.flag === "anomaly") return "Anomalía";
  return "OK";
}

function flagVariant(c: Campaign): "danger" | "warning" | "ember" | "success" | "default" {
  if (c.status === "PAUSED") return "default";
  if (c.flag === "critical") return "danger";
  if (c.flag === "warn") return "warning";
  if (c.flag === "anomaly") return "ember";
  return "success";
}

/**
 * Card grande con análisis profundo por campaña.
 *
 * Estructura:
 *  - Header: code + nombre + status + flag + geo/vertical
 *  - Hipótesis original (por qué se lanzó)
 *  - Estado actual con tendencia
 *  - Métricas clave en grid
 *  - Aprendizajes (LearningCard stagger)
 *  - Próximo paso
 */
export function CampaignDeepAnalysis({ campaign: c, className }: CampaignDeepAnalysisProps) {
  const resolved = resolveCampaignLearning(c);
  const learning = resolved.learning;
  const accent = flagColor(c.flag);
  const cptToneClass = (() => {
    const t = cptTone(c.cpt);
    if (t === "success") return "text-[hsl(var(--success))]";
    if (t === "warning") return "text-[hsl(var(--warning))]";
    if (t === "danger") return "text-[hsl(var(--destructive))]";
    return "text-foreground";
  })();
  const isPaused = c.status === "PAUSED";
  const trendIcon = isPaused ? (
    <TrendingDown className="size-3.5 text-muted-foreground" aria-hidden />
  ) : c.flag === "critical" ? (
    <TrendingDown className="size-3.5 text-[hsl(var(--destructive))]" aria-hidden />
  ) : (
    <TrendingUp className="size-3.5 text-[hsl(var(--success))]" aria-hidden />
  );

  return (
    <TextureCard
      className={cn("p-5 relative overflow-visible", className)}
      style={{ borderLeftWidth: "3px", borderLeftColor: `hsl(${accent})` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-[12px] text-foreground">{c.code}</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[280px]">{c.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono">
              {c.geo}
            </Badge>
            <Badge variant="outline">{c.vertical}</Badge>
            <Badge variant="outline">
              {c.event === "CompleteRegistration" ? "CR" : "IC"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={flagVariant(c)}>{flagLabel(c)}</Badge>
          <Flag className="size-4" style={{ color: `hsl(${accent})` }} aria-hidden />
        </div>
      </div>

      {/* Banner · notas del equipo + freshness check */}
      <div
        className="mb-4 rounded-lg border px-3 py-2 flex items-start gap-2"
        style={{
          background: resolved.fresh
            ? "hsl(var(--info) / 0.06)"
            : "hsl(var(--warning) / 0.08)",
          borderColor: resolved.fresh
            ? "hsl(var(--info) / 0.3)"
            : "hsl(var(--warning) / 0.4)",
        }}
      >
        <NotebookPen
          className="size-3.5 mt-0.5 shrink-0"
          style={{
            color: resolved.fresh ? "hsl(var(--info))" : "hsl(var(--warning))",
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] font-semibold leading-tight"
            style={{
              color: resolved.fresh ? "hsl(var(--info))" : "hsl(var(--warning))",
            }}
          >
            Notas del equipo · capturadas 23-may
          </div>
          <p className="text-[10.5px] text-muted-foreground leading-relaxed mt-0.5">
            {resolved.fresh
              ? "Los datos vivos están arriba (Estado, CPT, freq). Las notas pueden referenciar cifras del momento del análisis."
              : resolved.staleNote}
          </p>
        </div>
      </div>

      {/* Hipótesis original */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Hipótesis original
          </h4>
          <ExplainedMetric
            explanation={
              <>
                <b>Hipótesis</b> = la razón por la que esta campaña se lanzó en mayo.
                <br />Sirve para validar si la apuesta sigue de pie o ya quedó invalidada por los datos.
              </>
            }
          >
            <span className="text-[10px] text-muted-foreground/60">por qué</span>
          </ExplainedMetric>
        </div>
        <p className="text-[12px] leading-relaxed text-foreground/85">{learning.hypothesis}</p>
      </div>

      {/* Estado actual + tendencia */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          {trendIcon}
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Estado actual
          </h4>
        </div>
        <p className="text-[12px] leading-relaxed text-foreground/85">{learning.currentState}</p>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Metric k="Spend" v={fmt.eur(c.spend, { decimals: 0 })} />
        <Metric k="CR / IC" v={`${fmt.int(c.evCompleteReg)} / ${fmt.int(c.evInitCheckout)}`} />
        <Metric
          k="CPT"
          v={c.cpt === null ? "—" : fmt.eur(c.cpt)}
          toneClass={cptToneClass}
        />
        <Metric k="Frecuencia" v={`${c.freq.toFixed(2)}×`} />
      </div>

      {/* Aprendizajes */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <LearningCard title="Aprendizajes" items={learning.learnings} accent={accent} />
      </motion.div>

      {/* Próximo paso */}
      <div className="mt-4 pt-3 border-t border-border/40">
        <div className="flex items-start gap-2">
          <Lightbulb
            className="size-3.5 mt-0.5 shrink-0"
            style={{ color: `hsl(${accent})` }}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Próximo paso
              </h4>
              <ArrowRight className="size-3 text-muted-foreground/60" aria-hidden />
            </div>
            <p className="text-[11.5px] leading-relaxed text-foreground/90">{learning.nextStep}</p>
          </div>
        </div>
      </div>
    </TextureCard>
  );
}

function Metric({
  k,
  v,
  toneClass,
}: {
  k: string;
  v: React.ReactNode;
  toneClass?: string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/30 px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{k}</div>
      <div className={cn("text-[12px] font-mono font-semibold tabular mt-0.5", toneClass)}>{v}</div>
    </div>
  );
}

/**
 * Wrapper en grid para una lista de campañas · usa StaggerItem para entrance.
 */
export function CampaignDeepAnalysisGrid({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {campaigns.map((c) => (
        <StaggerItem key={c.cid}>
          <CampaignDeepAnalysis campaign={c} />
        </StaggerItem>
      ))}
    </div>
  );
}
