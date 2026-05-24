"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Image as ImageIcon, Video, Layers, FileQuestion, Trophy } from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { performanceByFormat, type AnalyticsPost } from "@/lib/organic-analytics";
import { cn, fmt } from "@/lib/utils";

interface FormatPerformanceProps {
  posts: AnalyticsPost[];
  onPostClick?: (post: AnalyticsPost) => void;
}

const FORMAT_ICON: Record<string, React.ReactNode> = {
  IMAGE: <ImageIcon className="size-3.5" />,
  VIDEO: <Video className="size-3.5" />,
  CAROUSEL_ALBUM: <Layers className="size-3.5" />,
  OTHER: <FileQuestion className="size-3.5" />,
};

const FORMAT_TONE: Record<string, { fg: string; bg: string; bar: string }> = {
  IMAGE: {
    fg: "text-[hsl(var(--info))]",
    bg: "bg-[hsl(var(--info)/0.08)] border-[hsl(var(--info)/0.3)]",
    bar: "bg-[hsl(var(--info))]",
  },
  VIDEO: {
    fg: "text-[hsl(var(--brand-violet))]",
    bg: "bg-[hsl(var(--brand-violet)/0.08)] border-[hsl(var(--brand-violet)/0.3)]",
    bar: "bg-[hsl(var(--brand-violet))]",
  },
  CAROUSEL_ALBUM: {
    fg: "text-[hsl(var(--brand-ember))]",
    bg: "bg-[hsl(var(--brand-ember)/0.08)] border-[hsl(var(--brand-ember)/0.3)]",
    bar: "bg-[hsl(var(--brand-ember))]",
  },
  OTHER: {
    fg: "text-muted-foreground",
    bg: "bg-secondary/40 border-border/40",
    bar: "bg-muted-foreground",
  },
};

export function FormatPerformance({ posts, onPostClick }: FormatPerformanceProps) {
  const stats = React.useMemo(() => performanceByFormat(posts), [posts]);
  if (!stats.length) return null;

  const maxAvg = Math.max(...stats.map((s) => s.avgEngagement), 1);

  return (
    <TextureCard className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="size-3.5 text-[hsl(var(--brand-ember))]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Performance por formato
        </h3>
      </div>

      <div className="space-y-2.5">
        {stats.map((s, i) => {
          const tone = FORMAT_TONE[s.format] ?? FORMAT_TONE.OTHER!;
          const widthPct = (s.avgEngagement / maxAvg) * 100;
          return (
            <motion.div
              key={s.format}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className={cn("rounded-lg border p-3", tone.bg)}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("inline-flex items-center", tone.fg)}>
                    {FORMAT_ICON[s.format]}
                  </span>
                  <span className="text-[12px] font-semibold">{s.label}</span>
                  <Badge variant="outline" className="!text-[9px]">
                    {s.count} {s.count === 1 ? "post" : "posts"}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono shrink-0">
                  <span className={cn("font-bold", tone.fg)}>{s.avgEngagement.toFixed(1)}</span>
                  <span className="text-muted-foreground/70"> eng/post</span>
                </div>
              </div>

              {/* Barra horizontal */}
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", tone.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/80">
                <span className="font-mono">
                  {fmt.int(s.totalLikes)} likes · {fmt.int(s.totalComments)} comentarios
                </span>
                {s.best && (
                  <button
                    onClick={() => s.best && onPostClick?.(s.best)}
                    className="ml-auto inline-flex items-center gap-1 hover:text-foreground transition-colors group"
                  >
                    <Trophy className="size-3 text-[hsl(var(--brand-ember))]" />
                    <span className="group-hover:underline">
                      Mejor: {s.best.likes + s.best.comments} eng
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-[9px] text-muted-foreground/70 leading-snug">
        Tip: el formato con mayor eng/post merece más inversión orgánica · IG favorece carruseles y reels
      </div>
    </TextureCard>
  );
}
