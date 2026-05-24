"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Video, Eye, Heart, MessageCircle, Trophy, Info } from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { videoStats, type AnalyticsPost } from "@/lib/organic-analytics";
import { cn, fmt } from "@/lib/utils";

interface VideoAnalyticsProps {
  posts: AnalyticsPost[];
  onPostClick?: (post: AnalyticsPost) => void;
}

/**
 * Métricas agregadas de videos/reels.
 * Si la API básica no devuelve video_views (sin permisos), mostramos solo
 * lo que tenemos (likes/comments) + nota clara sobre retención por segundo.
 */
export function VideoAnalytics({ posts, onPostClick }: VideoAnalyticsProps) {
  const stats = React.useMemo(() => videoStats(posts), [posts]);
  if (!stats.hasVideos) return null;

  const hasViews = stats.avgViews !== null && stats.avgViews > 0;

  return (
    <TextureCard className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Video className="size-3.5 text-[hsl(var(--brand-violet))]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Video / Reels analytics
        </h3>
        <Badge variant="violet" className="!text-[9px] ml-auto">
          {stats.totalVideos} {stats.totalVideos === 1 ? "video" : "videos"}
        </Badge>
      </div>

      {/* Hero · tus reels en promedio */}
      <div className="rounded-lg border border-[hsl(var(--brand-violet)/0.3)] bg-[hsl(var(--brand-violet)/0.06)] p-3">
        <div className="text-[9px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--brand-violet))] mb-2">
          Tus reels en promedio
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricBox
            icon={<Eye className="size-3" />}
            label="Views"
            value={hasViews ? fmt.short(stats.avgViews ?? 0) : "—"}
            tone="violet"
            sub={hasViews ? "promedio" : "sin datos públicos"}
          />
          <MetricBox
            icon={<Heart className="size-3" />}
            label="Likes"
            value={stats.avgLikes.toFixed(1)}
            tone="ember"
            sub="promedio / video"
          />
          <MetricBox
            icon={<MessageCircle className="size-3" />}
            label="Comments"
            value={stats.avgComments.toFixed(1)}
            tone="cyan"
            sub="promedio / video"
          />
          <MetricBox
            icon={<motion.span className="text-[10px] font-bold">%</motion.span>}
            label="Eng. rate"
            value={
              stats.engagementRate !== null ? `${stats.engagementRate.toFixed(2)}%` : "—"
            }
            tone="lime"
            sub={stats.engagementRate !== null ? "likes+com / views" : "requiere views"}
          />
        </div>
      </div>

      {/* Best video */}
      {stats.bestVideo && (
        <motion.button
          onClick={() => onPostClick?.(stats.bestVideo!)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="w-full text-left rounded-lg border border-[hsl(var(--brand-ember)/0.3)] bg-[hsl(var(--brand-ember)/0.05)] p-3 hover:border-[hsl(var(--brand-ember)/0.5)] transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Trophy className="size-3 text-[hsl(var(--brand-ember))]" />
            <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--brand-ember))]">
              Mejor video del período
            </span>
          </div>
          <div className="flex items-center gap-3">
            {stats.bestVideo.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stats.bestVideo.thumb}
                alt=""
                className="size-14 rounded object-cover shrink-0 border border-border"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] line-clamp-2 text-foreground leading-snug">
                {stats.bestVideo.text ?? "Sin texto"}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-2.5" /> {stats.bestVideo.likes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="size-2.5" /> {stats.bestVideo.comments}
                </span>
                {stats.bestVideo.video_views ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-2.5" /> {fmt.short(stats.bestVideo.video_views)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </motion.button>
      )}

      {/* Aviso de retención por segundo */}
      <div className="rounded-md border border-dashed border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.05)] p-2.5">
        <div className="flex items-start gap-2">
          <Info className="size-3 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
          <div className="text-[10px] text-muted-foreground leading-snug">
            <strong className="text-[hsl(var(--warning))]">Retención por segundo</strong> requiere
            Instagram Insights Pro · disponible con cuenta business verificada + scope{" "}
            <code className="font-mono text-[9px]">instagram_manage_insights</code>. Cuando esté
            activo, podrás ver en qué segundo mueren los videos.
          </div>
        </div>
      </div>
    </TextureCard>
  );
}

function MetricBox({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "violet" | "ember" | "cyan" | "lime";
}) {
  const toneColor: Record<string, string> = {
    violet: "text-[hsl(var(--brand-violet))]",
    ember: "text-[hsl(var(--brand-ember))]",
    cyan: "text-[hsl(var(--brand-cyan))]",
    lime: "text-[hsl(var(--brand-lime))]",
  };
  return (
    <div className="rounded-md border border-border/50 bg-card/60 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80 font-bold flex items-center gap-1">
        <span className={toneColor[tone]}>{icon}</span> {label}
      </div>
      <div className={cn("font-mono font-bold text-[14px] mt-0.5", toneColor[tone])}>
        {value}
      </div>
      {sub && (
        <div className="text-[9px] text-muted-foreground/70 mt-0.5 leading-tight">{sub}</div>
      )}
    </div>
  );
}
