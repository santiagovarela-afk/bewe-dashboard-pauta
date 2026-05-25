"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Trophy, TrendingDown, Heart, MessageCircle, ImageOff } from "lucide-react";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Badge } from "@/components/ui/badge";
import { topBottom, whyItWorked, whyItFailed, type AnalyticsPost } from "@/lib/organic-analytics";
import { fmt } from "@/lib/utils";

interface TopBottomAnalysisProps {
  posts: AnalyticsPost[];
  onPostClick?: (post: AnalyticsPost) => void;
}

/**
 * Top 3 + Bottom 3 con razones cualitativas calculadas.
 * Reemplaza al "Top 3" simple anterior · ahora con narrativa.
 */
export function TopBottomAnalysis({ posts, onPostClick }: TopBottomAnalysisProps) {
  const { top, bottom, avgEngagement } = React.useMemo(() => topBottom(posts, 3), [posts]);

  if (!top.length) return null;

  return (
    <div className="space-y-4">
      {/* TOP */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Trophy className="size-3.5 text-[hsl(var(--brand-ember))]" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Top 3 · qué funcionó y por qué
          </h3>
          <span className="text-[9px] text-muted-foreground/70 font-mono ml-auto">
            media: {avgEngagement.toFixed(1)} eng/post
          </span>
        </div>
        <div className="text-[9.5px] text-muted-foreground/80 leading-snug mb-3">
          Hipótesis cualitativa · basada en formato + métricas del post · validar con A/B.
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {top.map((p, i) => (
            <motion.button
              key={`top-${p.id}`}
              onClick={() => onPostClick?.(p)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="text-left"
            >
              <SpotlightCard
                className="overflow-hidden h-full hover:border-[hsl(var(--brand-ember)/0.5)]"
                spotlightColor="var(--brand-ember)"
              >
                <div className="flex">
                  <div className="size-24 shrink-0 bg-secondary/60 relative">
                    {p.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                    <div className="absolute -top-1.5 -left-1.5">
                      <Badge variant="ember" className="!text-[9px] !px-1.5">
                        #{i + 1}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 flex-1 min-w-0 flex flex-col">
                    <div
                      className="text-[11px] text-foreground line-clamp-2 mb-1.5 leading-snug"
                      title={p.text}
                    >
                      {p.text ?? "Sin texto"}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1.5">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Heart className="size-3" /> {fmt.short(p.likes)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <MessageCircle className="size-3" /> {fmt.short(p.comments)}
                      </span>
                    </div>
                    <div className="text-[9px] text-[hsl(var(--brand-lime))] font-medium leading-snug mt-auto pt-1 border-t border-border/40">
                      ✓ {whyItWorked(p, avgEngagement)}
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.button>
          ))}
        </div>
      </div>

      {/* BOTTOM */}
      {bottom.length > 0 && bottom[0]!.id !== top[0]!.id && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="size-3.5 text-[hsl(var(--destructive))]" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Bottom 3 · qué no performó y por qué
            </h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {bottom.map((p, i) => (
              <motion.button
                key={`bottom-${p.id}`}
                onClick={() => onPostClick?.(p)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="text-left"
              >
                <SpotlightCard
                  className="overflow-hidden h-full hover:border-[hsl(var(--destructive)/0.4)] opacity-90"
                  spotlightColor="var(--destructive)"
                >
                  <div className="flex">
                    <div className="size-24 shrink-0 bg-secondary/60 relative">
                      {p.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.thumb}
                          alt=""
                          className="w-full h-full object-cover grayscale-[40%]"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                          <ImageOff className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 min-w-0 flex flex-col">
                      <div
                        className="text-[11px] text-foreground/80 line-clamp-2 mb-1.5 leading-snug"
                        title={p.text}
                      >
                        {p.text ?? "Sin texto"}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1.5">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Heart className="size-3" /> {fmt.short(p.likes)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono">
                          <MessageCircle className="size-3" /> {fmt.short(p.comments)}
                        </span>
                      </div>
                      <div className="text-[9px] text-[hsl(var(--destructive))] font-medium leading-snug mt-auto pt-1 border-t border-border/40">
                        ✗ {whyItFailed(p, avgEngagement)}
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
