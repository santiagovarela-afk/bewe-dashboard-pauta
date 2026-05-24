"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Clock, CalendarDays, TrendingUp } from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import {
  bestDayOfWeek,
  bestHourOfDay,
  buildHeatmap,
  type AnalyticsPost,
} from "@/lib/organic-analytics";
import { cn } from "@/lib/utils";

interface TemporalHeatmapProps {
  posts: AnalyticsPost[];
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * Heatmap día-de-semana × hora-del-día con engagement promedio.
 * Bucket vacío = celda apagada. Mejor día y mejor hora se highlightean arriba.
 */
export function TemporalHeatmap({ posts }: TemporalHeatmapProps) {
  const bestDay = React.useMemo(() => bestDayOfWeek(posts), [posts]);
  const bestHour = React.useMemo(() => bestHourOfDay(posts), [posts]);
  const heatmap = React.useMemo(() => buildHeatmap(posts), [posts]);

  if (!posts.length) return null;

  // Lookup rápido por día-hora
  const lookup = new Map<string, { avg: number; count: number }>();
  for (const c of heatmap.cells) {
    lookup.set(`${c.day}-${c.hour}`, { avg: c.avg, count: c.count });
  }

  // Agrupamos horas en buckets de 3 para no saturar visualmente (8 columnas)
  const HOUR_BUCKETS = [
    { label: "00-02", range: [0, 1, 2] },
    { label: "03-05", range: [3, 4, 5] },
    { label: "06-08", range: [6, 7, 8] },
    { label: "09-11", range: [9, 10, 11] },
    { label: "12-14", range: [12, 13, 14] },
    { label: "15-17", range: [15, 16, 17] },
    { label: "18-20", range: [18, 19, 20] },
    { label: "21-23", range: [21, 22, 23] },
  ];

  // Recalcular agregados por bucket
  const bucketLookup = new Map<string, { sum: number; count: number; postCount: number }>();
  for (const c of heatmap.cells) {
    const bucket = HOUR_BUCKETS.find((b) => b.range.includes(c.hour));
    if (!bucket) continue;
    const k = `${c.day}-${bucket.label}`;
    const ex = bucketLookup.get(k) ?? { sum: 0, count: 0, postCount: 0 };
    ex.sum += c.avg * c.count;
    ex.count += c.count;
    ex.postCount += c.count;
    bucketLookup.set(k, ex);
  }
  let maxBucket = 0;
  for (const b of bucketLookup.values()) {
    const avg = b.count ? b.sum / b.count : 0;
    if (avg > maxBucket) maxBucket = avg;
  }

  function cellTone(avg: number, count: number) {
    if (!count) return { bg: "bg-secondary/30", text: "text-muted-foreground/40" };
    const ratio = maxBucket > 0 ? avg / maxBucket : 0;
    if (ratio >= 0.8)
      return {
        bg: "bg-[hsl(var(--brand-lime)/0.6)] border-[hsl(var(--brand-lime)/0.8)]",
        text: "text-background dark:text-foreground font-bold",
      };
    if (ratio >= 0.5)
      return {
        bg: "bg-[hsl(var(--brand-cyan)/0.4)] border-[hsl(var(--brand-cyan)/0.5)]",
        text: "text-foreground font-semibold",
      };
    if (ratio >= 0.25)
      return {
        bg: "bg-[hsl(var(--info)/0.25)] border-[hsl(var(--info)/0.3)]",
        text: "text-foreground/80",
      };
    return { bg: "bg-secondary/50 border-border/30", text: "text-muted-foreground" };
  }

  return (
    <TextureCard className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-3.5 text-[hsl(var(--brand-cyan))]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Análisis temporal · cuándo postear
        </h3>
      </div>

      {/* Mejor día / mejor hora */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bestDay && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg border border-[hsl(var(--brand-lime)/0.3)] bg-[hsl(var(--brand-lime)/0.06)] p-3"
          >
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--brand-lime))] mb-1">
              <CalendarDays className="size-3" /> Mejor día
            </div>
            <div className="text-xl font-bold capitalize">{bestDay.dayName}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {bestDay.avgEngagement.toFixed(1)} eng/post · {bestDay.count} posts
            </div>
          </motion.div>
        )}
        {bestHour && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-lg border border-[hsl(var(--brand-cyan)/0.3)] bg-[hsl(var(--brand-cyan)/0.06)] p-3"
          >
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--brand-cyan))] mb-1">
              <Clock className="size-3" /> Mejor hora
            </div>
            <div className="text-xl font-bold font-mono">{bestHour.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {bestHour.avgEngagement.toFixed(1)} eng/post · {bestHour.count} posts
            </div>
          </motion.div>
        )}
      </div>

      {/* Heatmap */}
      <div>
        <div className="text-[9px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
          <TrendingUp className="size-3" /> Heatmap día × hora · engagement promedio
        </div>
        <div className="overflow-x-auto">
          <div className="inline-grid grid-cols-[auto_repeat(8,minmax(40px,1fr))] gap-1 min-w-full">
            {/* Header */}
            <div></div>
            {HOUR_BUCKETS.map((h) => (
              <div
                key={h.label}
                className="text-[8px] font-mono text-center text-muted-foreground/70 py-1"
              >
                {h.label}
              </div>
            ))}
            {/* Rows: días */}
            {DAY_LABELS.map((dayLabel, dayIdx) => (
              <React.Fragment key={dayIdx}>
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground self-center pr-2">
                  {dayLabel}
                </div>
                {HOUR_BUCKETS.map((h) => {
                  const b = bucketLookup.get(`${dayIdx}-${h.label}`);
                  const avg = b && b.count ? b.sum / b.count : 0;
                  const count = b?.postCount ?? 0;
                  const tone = cellTone(avg, count);
                  return (
                    <div
                      key={`${dayIdx}-${h.label}`}
                      className={cn(
                        "h-9 rounded border text-[9px] grid place-items-center font-mono transition-colors",
                        tone.bg,
                        tone.text,
                      )}
                      title={
                        count
                          ? `${DAY_LABELS[dayIdx]} ${h.label} · ${avg.toFixed(1)} eng/post · ${count} posts`
                          : `${DAY_LABELS[dayIdx]} ${h.label} · sin posts`
                      }
                    >
                      {count > 0 ? avg.toFixed(0) : ""}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="text-[9px] text-muted-foreground/70 mt-2 leading-snug">
          Hora local · engagement = likes + comentarios · celdas vacías = sin posts en ese rango
        </div>
      </div>
    </TextureCard>
  );
}
