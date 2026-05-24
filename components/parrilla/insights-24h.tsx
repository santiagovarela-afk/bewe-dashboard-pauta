"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Flame, TrendingUp, Clock, Sparkles, AlertCircle } from "lucide-react";
import { useOrganic, type IGMedia, type FBPost } from "@/lib/hooks/use-organic";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NormalizedPost {
  id: string;
  platform: "ig" | "fb";
  caption?: string;
  url?: string;
  imageUrl?: string;
  timestamp: number;
  engagement: number;
  ageHours: number;
}

interface PostStarred extends NormalizedPost {
  /** ratio del engagement de este post vs promedio de la cuenta */
  ratioVsAvg: number;
  /** velocidad estimada (engagement / hora). */
  velocity: number;
  /** flag · post en primeras 24h. */
  isFresh24h: boolean;
}

/**
 * Analytics primeras 24h · detecta "estrellas 24h" combinando posts IG y FB.
 *
 * Lógica:
 *   - Normalizamos IG/FB a {timestamp, engagement, ageHours}
 *   - Calculamos engagement promedio del conjunto (baseline)
 *   - Para posts publicados HOY (<24h), comparamos su engagement actual vs
 *     50% del promedio (no esperamos a que igualen el promedio porque aún
 *     les queda tiempo). Si ya pasaron ese threshold = "estrella 24h".
 *   - Para posts pasados (>24h) marcamos cuáles fueron estrellas su día.
 *
 * Limitación: la Meta Graph API no devuelve granularidad horaria por defecto.
 * Hay que aproximar con velocity = engagement / hoursLive. Cuando integremos
 * insights con `period=day, since, until` podremos hacer breakdown real.
 */
export function Insights24h() {
  const { ig, fb, loading } = useOrganic({ limit: 30 });

  const normalized = React.useMemo<NormalizedPost[]>(() => {
    const now = Date.now();
    const out: NormalizedPost[] = [];

    for (const p of ig.posts ?? []) {
      const eng = engagementForIG(p);
      const t = p.timestamp ? new Date(p.timestamp).getTime() : 0;
      if (!t) continue;
      out.push({
        id: p.id,
        platform: "ig",
        caption: p.caption,
        url: p.permalink,
        imageUrl: p.media_url || p.thumbnail_url,
        timestamp: t,
        engagement: eng,
        ageHours: (now - t) / 3.6e6,
      });
    }
    for (const p of fb.posts ?? []) {
      const eng = engagementForFB(p);
      const t = p.created_time ? new Date(p.created_time).getTime() : 0;
      if (!t) continue;
      out.push({
        id: p.id,
        platform: "fb",
        caption: p.message,
        url: p.permalink_url,
        imageUrl: p.full_picture,
        timestamp: t,
        engagement: eng,
        ageHours: (now - t) / 3.6e6,
      });
    }
    return out;
  }, [ig.posts, fb.posts]);

  const stats = React.useMemo(() => {
    if (normalized.length === 0) return null;
    const avgEng = avg(normalized.map((p) => p.engagement));
    const enriched: PostStarred[] = normalized.map((p) => {
      const velocity = p.ageHours > 0 ? p.engagement / Math.max(p.ageHours, 0.5) : 0;
      const ratio = avgEng > 0 ? p.engagement / avgEng : 0;
      const isFresh24h = p.ageHours <= 24;
      return { ...p, ratioVsAvg: ratio, velocity, isFresh24h };
    });

    // Top 5 anomalías 24h: posts frescos cuyo engagement YA supera el 50% del avg histórico
    const anomalies = enriched
      .filter((p) => p.isFresh24h && p.ratioVsAvg >= 0.5 && p.engagement > 0)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 5);

    // Si no hay frescas, fallback a top engagement absoluto
    const fallback = enriched
      .filter((p) => p.engagement > 0)
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    return {
      total: normalized.length,
      avgEng,
      anomalies: anomalies.length > 0 ? anomalies : fallback,
      hasFresh: anomalies.length > 0,
      fresh24hCount: enriched.filter((p) => p.isFresh24h).length,
    };
  }, [normalized]);

  if (loading) {
    return (
      <div className="text-[11px] text-muted-foreground flex items-center gap-2 py-6 justify-center">
        <Clock className="size-3.5 animate-pulse" /> Cargando insights de IG/FB…
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 p-5 text-center">
        <AlertCircle className="size-6 mx-auto mb-2 text-muted-foreground/50" />
        <div className="text-[11px] text-muted-foreground leading-snug">
          Sin posts cargados aún · revisa el token Meta en Config.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <MiniMetric
          icon={<Sparkles className="size-3" />}
          label="Posts analizados"
          value={String(stats.total)}
          tone="violet"
        />
        <MiniMetric
          icon={<Clock className="size-3" />}
          label="Últimas 24h"
          value={String(stats.fresh24hCount)}
          tone="cyan"
        />
        <MiniMetric
          icon={<TrendingUp className="size-3" />}
          label="Avg engagement"
          value={Math.round(stats.avgEng).toString()}
          tone="lime"
        />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-2 flex items-center gap-1.5">
          <Flame className="size-3 text-[hsl(var(--brand-ember))]" />
          {stats.hasFresh
            ? "Top 5 estrellas 24h"
            : "Top 5 posts (sin frescos)"}
        </div>
        <div className="space-y-1.5">
          {stats.anomalies.map((p, i) => (
            <StarRow key={p.id} post={p} rank={i + 1} />
          ))}
        </div>
      </div>

      <div className="text-[9px] text-muted-foreground/70 leading-snug border-t border-border/40 pt-2">
        Cálculo: ratio engagement vs promedio cuenta + velocidad eng/hora.
        Para breakdown horario real necesitamos Meta insights{" "}
        <code className="font-mono">period=day,since,until</code>.
      </div>
    </div>
  );
}

function StarRow({ post, rank }: { post: PostStarred; rank: number }) {
  const ageLabel =
    post.ageHours < 1
      ? `${Math.round(post.ageHours * 60)}m`
      : post.ageHours < 24
        ? `${Math.round(post.ageHours)}h`
        : `${Math.round(post.ageHours / 24)}d`;
  return (
    <motion.a
      href={post.url}
      target="_blank"
      rel="noreferrer noopener"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md border bg-card/60 hover:bg-card transition-colors",
        post.isFresh24h
          ? "border-[hsl(var(--brand-ember)/0.5)]"
          : "border-border/60",
      )}
    >
      <div className="text-[10px] font-bold w-5 text-center text-muted-foreground">
        #{rank}
      </div>
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          className="size-9 rounded-md object-cover bg-secondary shrink-0"
        />
      ) : (
        <div className="size-9 rounded-md bg-secondary shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] truncate font-medium">
          {post.caption?.slice(0, 60) || "(sin caption)"}…
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge
            variant={post.platform === "ig" ? "violet" : "info"}
            className="!text-[8px]"
          >
            {post.platform.toUpperCase()}
          </Badge>
          <span className="text-[9px] text-muted-foreground">
            {ageLabel} · {Math.round(post.engagement)} eng ·{" "}
            <strong className="text-foreground">
              {Math.round(post.velocity)}/h
            </strong>
          </span>
          {post.isFresh24h && (
            <Flame className="size-2.5 text-[hsl(var(--brand-ember))]" />
          )}
        </div>
      </div>
      <div
        className={cn(
          "text-[10px] font-mono font-bold shrink-0",
          post.ratioVsAvg >= 1.5
            ? "text-[hsl(var(--brand-lime))]"
            : post.ratioVsAvg >= 1
              ? "text-[hsl(var(--brand-cyan))]"
              : "text-muted-foreground",
        )}
      >
        {post.ratioVsAvg.toFixed(1)}×
      </div>
    </motion.a>
  );
}

function MiniMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "violet" | "cyan" | "lime";
}) {
  const c = {
    violet: "text-[hsl(var(--brand-violet))]",
    cyan: "text-[hsl(var(--brand-cyan))]",
    lime: "text-[hsl(var(--brand-lime))]",
  }[tone];
  return (
    <div className="rounded-md border border-border/60 bg-card/60 p-2">
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground inline-flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={cn("text-[16px] font-mono font-bold", c)}>{value}</div>
    </div>
  );
}

// ---------- helpers ----------

function engagementForIG(p: IGMedia): number {
  return (p.like_count ?? 0) + (p.comments_count ?? 0);
}

function engagementForFB(p: FBPost): number {
  const r = p.reactions?.summary?.total_count ?? 0;
  const c = p.comments?.summary?.total_count ?? 0;
  const s = p.shares?.count ?? 0;
  return r + c + s;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
