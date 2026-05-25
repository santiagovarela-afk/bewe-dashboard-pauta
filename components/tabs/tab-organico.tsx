"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Loader2,
  RefreshCw,
  Instagram,
  Facebook,
  ImageOff,
  Heart,
  MessageCircle,
  ExternalLink,
  Calendar,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Flame,
  BookOpen,
  CalendarRange,
} from "lucide-react";
import { fmt } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
import { OnboardingTip } from "@/components/shared/onboarding-tip";
import { Drawer } from "@/components/shared/drawer";
import { useOrganic, type IGMedia, type FBPost } from "@/lib/hooks/use-organic";
import { TemporalHeatmap } from "@/components/organico/temporal-heatmap";
import { FormatPerformance } from "@/components/organico/format-performance";
import { VideoAnalytics } from "@/components/organico/video-analytics";
import { TopBottomAnalysis } from "@/components/organico/top-bottom-analysis";
import { RecommendationsAI } from "@/components/organico/recommendations-ai";
import { TrendsPymes } from "@/components/organico/trends-pymes";
import { WhyItWorkedModal } from "@/components/organico/why-it-worked-modal";
import { JunioOrganicoPlan } from "@/components/organico/junio-plan";
import { PeriodToggle } from "@/components/shared/period-toggle";
import { Insights24h } from "@/components/parrilla/insights-24h";
import { RULES_2026 } from "@/components/parrilla/best-time";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { useDashboard } from "@/lib/store";
import {
  filterPostsByDateRange,
  rangeDays,
  type AnalyticsPost,
} from "@/lib/organic-analytics";

type SortKey = "date" | "likes" | "comments" | "engagement";

interface NormalizedPost {
  id: string;
  source: "ig" | "fb";
  thumb?: string;
  text?: string;
  likes: number;
  comments: number;
  date?: string;
  permalink?: string;
  type?: string;
  video_views?: number;
  media_product_type?: string;
  raw: IGMedia | FBPost;
}

function normalizeIG(p: IGMedia): NormalizedPost {
  // Extraer reach/impressions de insights si vinieron (sirve como proxy de views)
  let videoViews: number | undefined;
  const insights = p.insights?.data;
  if (Array.isArray(insights)) {
    const reach = insights.find((i) => i.name === "reach");
    const impressions = insights.find((i) => i.name === "impressions");
    const v = reach?.values?.[0]?.value ?? impressions?.values?.[0]?.value;
    if (typeof v === "number" && v > 0) videoViews = v;
  }
  return {
    id: p.id,
    source: "ig",
    thumb: p.thumbnail_url || p.media_url,
    text: p.caption,
    likes: p.like_count ?? 0,
    comments: p.comments_count ?? 0,
    date: p.timestamp,
    permalink: p.permalink,
    type: p.media_type,
    video_views: videoViews,
    media_product_type: p.media_product_type,
    raw: p,
  };
}

function normalizeFB(p: FBPost): NormalizedPost {
  return {
    id: p.id,
    source: "fb",
    thumb: p.full_picture,
    text: p.message,
    likes: p.reactions?.summary?.total_count ?? 0,
    comments: p.comments?.summary?.total_count ?? 0,
    date: p.created_time,
    permalink: p.permalink_url,
    raw: p,
  };
}

type PlanView = "actual" | "junio";

export function TabOrganico() {
  const [tab, setTab] = React.useState<"ig" | "fb">("ig");
  const [sortKey, setSortKey] = React.useState<SortKey>("date");
  const [selected, setSelected] = React.useState<NormalizedPost | null>(null);
  /** Post seleccionado para modal "Por qué funcionó" (separado del drawer) */
  const [whyPost, setWhyPost] = React.useState<NormalizedPost | null>(null);
  const [planView, setPlanView] = React.useState<PlanView>("actual");
  const { setTab: setDashTab } = useDashboard();

  // Date range global del topbar · filtra TODO el tab Orgánico
  const { dateRange } = useDashboard();

  // Trae IG + FB en paralelo, ambos con cache local + revalidación
  const { ig, fb, loading, error, refresh } = useOrganic({ limit: 50 });

  const igPosts = ig.posts;
  const fbPosts = fb.posts;
  const insightsMissing = tab === "ig" ? ig.insightsMissing : fb.insightsMissing;

  /**
   * Normalizamos primero TODO el feed (sin filtrar), después aplicamos el
   * dateRange global. Así también podemos saber si el usuario filtró tan
   * estrecho que se queda sin posts (queja #2: "respetar fecha" + queja #4
   * "si filtro hoy debería ver solo hoy").
   */
  const allNormalized = React.useMemo<NormalizedPost[]>(() => {
    return tab === "ig" ? igPosts.map(normalizeIG) : fbPosts.map(normalizeFB);
  }, [tab, igPosts, fbPosts]);

  const normalized = React.useMemo<NormalizedPost[]>(() => {
    return filterPostsByDateRange(
      allNormalized as unknown as AnalyticsPost[],
      dateRange,
    ) as unknown as NormalizedPost[];
  }, [allNormalized, dateRange]);

  const rangeNarrow = rangeDays(dateRange) < 3;
  const filteredOut = allNormalized.length - normalized.length;
  const rangeLabel = React.useMemo(() => {
    const fmtES = (iso: string) => {
      const d = new Date(`${iso}T00:00:00`);
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    };
    return dateRange.from === dateRange.to
      ? fmtES(dateRange.from)
      : `${fmtES(dateRange.from)} → ${fmtES(dateRange.to)}`;
  }, [dateRange]);

  const sorted = React.useMemo(() => {
    const sortFn: Record<SortKey, (a: NormalizedPost, b: NormalizedPost) => number> = {
      date: (a, b) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
      likes: (a, b) => b.likes - a.likes,
      comments: (a, b) => b.comments - a.comments,
      engagement: (a, b) => b.likes + b.comments - (a.likes + a.comments),
    };
    return [...normalized].sort(sortFn[sortKey]);
  }, [normalized, sortKey]);

  // KPIs
  const kpis = React.useMemo(() => {
    const totalLikes = normalized.reduce((s, p) => s + p.likes, 0);
    const totalComments = normalized.reduce((s, p) => s + p.comments, 0);
    const totalPosts = normalized.length;
    const avgEng = totalPosts > 0 ? (totalLikes + totalComments) / totalPosts : 0;
    return { totalLikes, totalComments, totalPosts, avgEng };
  }, [normalized]);

  // Comparativo IG vs FB (engagement por post)
  const comparison = React.useMemo(() => {
    const igEng =
      igPosts.length > 0
        ? igPosts.reduce(
            (s, p) => s + (p.like_count ?? 0) + (p.comments_count ?? 0),
            0,
          ) / igPosts.length
        : 0;
    const fbEng =
      fbPosts.length > 0
        ? fbPosts.reduce(
            (s, p) =>
              s +
              (p.reactions?.summary?.total_count ?? 0) +
              (p.comments?.summary?.total_count ?? 0),
            0,
          ) / fbPosts.length
        : 0;
    return { igEng, fbEng, leader: igEng >= fbEng ? "ig" : "fb" };
  }, [igPosts, fbPosts]);

  return (
    <div className="space-y-6 max-w-[1500px]">
      {/* Toggle vista plan · estado actual vs plan junio */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Contenido creativo · orgánico
          </h1>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            {planView === "actual"
              ? "Estado actual · posts IG/FB del período + análisis top/bottom"
              : "Plan editorial futuro · propuesta basada en aprendizajes mayo"}
          </p>
        </div>
        <PeriodToggle
          options={[
            { id: "actual", label: "Estado actual", hint: "mayo" },
            { id: "junio", label: "Plan junio", hint: "propuesta" },
          ]}
          value={planView}
          onChange={(v) => setPlanView(v as PlanView)}
        />
      </div>

      {planView === "junio" && <JunioOrganicoPlan />}

      {planView === "actual" && (
        <>
      <OnboardingTip
        storageKey="organico"
        steps={[
          {
            title: "¿Qué es contenido orgánico?",
            body: "Aquí están todos los posts publicados sin pauta en Instagram (@bewe) y Facebook (Bewe Page). Te ayuda a medir qué contenido genera engagement de forma natural.",
          },
          {
            title: "Carga automática",
            body: "IG + FB se traen solos al entrar. El cache local te muestra los últimos posts al instante y revalida en background.",
          },
          {
            title: "Top 3 destacado",
            body: "Identificamos automáticamente los 3 mejores posts del período por engagement (likes + comentarios). Usa eso para encontrar contenido viralizable.",
          },
          {
            title: "Detalle por post",
            body: "Haz clic en cualquier post para ver caption completo, fecha exacta, breakdown y link directo a la red. Ordena por fecha, likes o engagement.",
          },
        ]}
      />

      <SectionHeader
        title={`Contenidos orgánicos · ${rangeLabel}`}
        sub={
          normalized.length
            ? (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <CalendarRange className="size-3 text-[hsl(var(--brand-cyan))]" />
                  <span>
                    {kpis.totalPosts} posts · {fmt.int(kpis.totalLikes)} likes ·{" "}
                    {fmt.int(kpis.totalComments)} comentarios
                  </span>
                  {filteredOut > 0 && (
                    <span className="text-[hsl(var(--brand-cyan))]">
                      · {filteredOut} fuera del rango
                    </span>
                  )}
                </span>
              )
            : loading
              ? "Cargando posts…"
              : allNormalized.length > 0
                ? `Sin posts en el rango ${rangeLabel} · expandí el filtro de fechas del topbar`
                : "Sin posts (o sin permisos del token)"
        }
        right={
          <>
            <div className="flex border border-border rounded-full p-0.5 bg-card">
              {(["ig", "fb"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full transition-colors",
                    tab === t
                      ? t === "ig"
                        ? "bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))]"
                        : "bg-[hsl(var(--info)/0.18)] text-[hsl(var(--info))]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "ig" ? (
                    <Instagram className="size-3" />
                  ) : (
                    <Facebook className="size-3" />
                  )}
                  {t === "ig" ? "Instagram" : "Facebook"}
                </button>
              ))}
            </div>
            <Button onClick={() => void refresh()} size="sm" variant="glow" disabled={loading}>
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {loading ? "Cargando…" : "Recargar"}
            </Button>
          </>
        }
      />

      {/* Warning · filtro muy estrecho */}
      {rangeNarrow && allNormalized.length > 0 && (
        <TextureCard className="p-3 border-[hsl(var(--brand-cyan)/0.4)] bg-[hsl(var(--brand-cyan)/0.05)]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3.5 text-[hsl(var(--brand-cyan))] mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground">
              <strong className="text-[hsl(var(--brand-cyan))]">Filtro de fechas chico</strong>{" "}
              ({rangeDays(dateRange)} día{rangeDays(dateRange) === 1 ? "" : "s"}). Para ver
              tendencias confiables expandí el rango en el topbar.
            </div>
          </div>
        </TextureCard>
      )}

      {/* KPIs · cada uno con ExplainedMetric "?" */}
      {normalized.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ExplainedMetric
            explanation={
              <>
                <strong>Posts del período</strong> · cuenta total de publicaciones de{" "}
                {tab === "ig" ? "Instagram" : "Facebook"} dentro del rango filtrado en el
                topbar. Cambia el rango para ver más o menos posts.
              </>
            }
            className="block w-full"
          >
            <KpiCard
              label="Posts del período"
              value={kpis.totalPosts}
              sub={tab === "ig" ? "Instagram" : "Facebook"}
              tone={tab === "ig" ? "violet" : "info"}
              format={(v) => fmt.int(v)}
            />
          </ExplainedMetric>
          <ExplainedMetric
            explanation={
              <>
                <strong>Total likes</strong> · suma de likes (IG) o reacciones (FB) en los
                posts del rango. La media se calcula dividiendo entre posts del período.
              </>
            }
            className="block w-full"
          >
            <KpiCard
              label="Total likes"
              value={kpis.totalLikes}
              sub={`media ${(kpis.totalPosts > 0 ? kpis.totalLikes / kpis.totalPosts : 0).toFixed(1)} por post`}
              tone="ember"
              delay={0.05}
              format={(v) => fmt.int(v)}
            />
          </ExplainedMetric>
          <ExplainedMetric
            explanation={
              <>
                <strong>Comentarios</strong> · total de comments recibidos en los posts del
                rango. El comentario pesa más que el like para el algoritmo: indica
                conversación activa.
              </>
            }
            className="block w-full"
          >
            <KpiCard
              label="Comentarios"
              value={kpis.totalComments}
              sub={`media ${(kpis.totalPosts > 0 ? kpis.totalComments / kpis.totalPosts : 0).toFixed(1)} por post`}
              tone="cyan"
              delay={0.1}
              format={(v) => fmt.int(v)}
            />
          </ExplainedMetric>
          <ExplainedMetric
            explanation={
              <>
                <strong>Engagement / post</strong> · (likes + comentarios) ÷ posts del
                rango. Es el proxy más robusto cuando no hay insights de reach disponibles.
                Compará vs benchmark de tu cuenta.
              </>
            }
            className="block w-full"
          >
            <KpiCard
              label="Engagement / post"
              value={kpis.avgEng}
              sub="likes + comentarios"
              tone="lime"
              delay={0.15}
              format={(v) => v.toFixed(1)}
            />
          </ExplainedMetric>
        </div>
      )}

      {/* Aviso de insights faltantes */}
      {insightsMissing && (
        <TextureCard className="p-3 border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.06)]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-3.5 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground">
              <strong className="text-[hsl(var(--warning))]">Insights orgánicos no disponibles.</strong>{" "}
              El token no tiene permisos de{" "}
              <code className="font-mono text-[10px]">
                {tab === "ig"
                  ? "instagram_manage_insights + pages_read_engagement"
                  : "pages_read_engagement"}
              </code>
              . Mostrando solo likes/comments públicos.
            </div>
          </div>
        </TextureCard>
      )}

      {/* IG vs FB comparativo (cuando hay datos de ambos) */}
      {igPosts.length > 0 && fbPosts.length > 0 && (
        <TextureCard className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[11px]">
            <TrendingUp className="size-3.5 text-[hsl(var(--brand-lime))]" />
            <span className="font-bold uppercase tracking-[0.12em] text-muted-foreground">
              IG vs FB
            </span>
          </div>
          <Badge variant={comparison.leader === "ig" ? "violet" : "outline"}>
            <Instagram className="size-2.5 mr-1" /> {comparison.igEng.toFixed(1)} eng/post
          </Badge>
          <Badge variant={comparison.leader === "fb" ? "info" : "outline"}>
            <Facebook className="size-2.5 mr-1" /> {comparison.fbEng.toFixed(1)} eng/post
          </Badge>
          <div className="text-[11px] text-muted-foreground ml-auto">
            <strong className="text-foreground">
              {comparison.leader === "ig" ? "Instagram" : "Facebook"}
            </strong>{" "}
            lidera este período (
            {(
              Math.max(comparison.igEng, comparison.fbEng) /
              Math.max(0.01, Math.min(comparison.igEng, comparison.fbEng))
            ).toFixed(1)}
            × más eng/post)
          </div>
        </TextureCard>
      )}

      {/* Error con detección de permisos */}
      {error && (
        <TextureCard className="p-4 border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)]">
          <div className="text-[12px] text-[hsl(var(--destructive))] font-mono">⚠ {error}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {/permission|scope|oauth/i.test(error)
              ? `El token no tiene permisos suficientes para ${tab === "ig" ? "instagram_basic + pages_read_engagement" : "pages_read_engagement"}.`
              : "Verifica META_TOKEN en .env.local y que la cuenta tenga posts."}
          </div>
        </TextureCard>
      )}

      {/* Skeletons */}
      {loading && !normalized.length && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <TextureCard key={i} className="overflow-hidden">
              <Skeleton className="aspect-square !rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
                <div className="flex gap-3 pt-1">
                  <Skeleton className="h-2.5 w-8" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
              </div>
            </TextureCard>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!normalized.length && !loading && !error && (
        <TextureCard className="p-10 text-center">
          <div
            className={cn(
              "size-14 rounded-2xl mx-auto mb-4 grid place-items-center border",
              tab === "ig"
                ? "bg-[hsl(var(--brand-violet)/0.12)] border-[hsl(var(--brand-violet)/0.3)] text-[hsl(var(--brand-violet))]"
                : "bg-[hsl(var(--info)/0.12)] border-[hsl(var(--info)/0.3)] text-[hsl(var(--info))]",
            )}
          >
            {tab === "ig" ? (
              <Instagram className="size-6" />
            ) : (
              <Facebook className="size-6" />
            )}
          </div>
          <div className="text-sm font-semibold mb-1">
            Sin posts cargados de {tab === "ig" ? "Instagram" : "Facebook"}
          </div>
          <div className="text-[12px] text-muted-foreground max-w-md mx-auto mb-4">
            Verifica permisos del token o pulsa Recargar.
          </div>
          <Button onClick={() => void refresh()} size="sm" variant="glow">
            <RefreshCw className="size-3.5" /> Recargar
          </Button>
        </TextureCard>
      )}

      {/* TOP 3 + BOTTOM 3 con análisis cualitativo · click top post → modal "Por qué funcionó" */}
      {normalized.length > 0 && (
        <TopBottomAnalysis
          posts={normalized as unknown as AnalyticsPost[]}
          onPostClick={(ap) => {
            const found = normalized.find((n) => n.id === ap.id);
            if (found) setWhyPost(found);
          }}
        />
      )}

      {/* Análisis temporal · día / hora / heatmap */}
      {normalized.length > 0 && (
        <TemporalHeatmap posts={normalized as unknown as AnalyticsPost[]} />
      )}

      {/* Performance por formato (image / video / carousel) */}
      {normalized.length > 0 && (
        <FormatPerformance
          posts={normalized as unknown as AnalyticsPost[]}
          onPostClick={(ap) => {
            const found = normalized.find((n) => n.id === ap.id);
            if (found) setSelected(found);
          }}
        />
      )}

      {/* Video analytics · solo si hay videos/reels */}
      {normalized.length > 0 && (
        <VideoAnalytics
          posts={normalized as unknown as AnalyticsPost[]}
          onPostClick={(ap) => {
            const found = normalized.find((n) => n.id === ap.id);
            if (found) setSelected(found);
          }}
        />
      )}

      {/* Recomendaciones con Mark/Lúa */}
      {normalized.length > 0 && (
        <RecommendationsAI
          posts={normalized as unknown as AnalyticsPost[]}
          platformLabel={tab === "ig" ? "Instagram" : "Facebook"}
        />
      )}

      {/* Insights 24h (movido desde Parrilla · queja #6) + Reglas 2026 (queja #7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TextureCard className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <Flame className="size-3 text-[hsl(var(--brand-ember))]" />
            Insights primeras 24h
          </div>
          <Insights24h />
        </TextureCard>

        <TextureCard className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1 flex items-center gap-1.5">
            <BookOpen className="size-3 text-[hsl(var(--brand-lime))]" />
            Reglas editoriales · best-practices que validamos
          </div>
          <div className="text-[10px] text-muted-foreground/80 leading-snug mb-2.5">
            Patrones generales de engagement IG/FB · ajustá según resultados de tu cuenta.
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {RULES_2026.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2 p-1.5 rounded hover:bg-secondary/40"
              >
                <span className="text-base leading-none mt-0.5">{r.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold">{r.title}</div>
                  <div className="text-[10px] text-muted-foreground leading-snug">
                    {r.detail}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TextureCard>
      </div>

      {/* Tendencias estáticas curadas para PyMEs */}
      <TrendsPymes />

      {/* Sort bar */}
      {normalized.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="size-3 text-muted-foreground" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Todos los posts
          </h3>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-7 text-[11px] min-w-[150px] ml-auto">
              <TrendingUp className="size-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Orden: Más reciente</SelectItem>
              <SelectItem value="likes">Orden: Más likes</SelectItem>
              <SelectItem value="comments">Orden: Más comentarios</SelectItem>
              <SelectItem value="engagement">Orden: Engagement total</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sorted.map((p, i) => (
          <PostCard
            key={p.id}
            post={p}
            delay={Math.min(i * 0.03, 0.4)}
            onClick={() => setSelected(p)}
          />
        ))}
      </div>

      {/* Drawer */}
      <PostDrawer post={selected} onClose={() => setSelected(null)} />
        </>
      )}

      {/* Modal "Por qué funcionó" · activo sólo cuando hay whyPost */}
      <WhyItWorkedModal
        open={!!whyPost}
        onClose={() => setWhyPost(null)}
        post={whyPost as unknown as AnalyticsPost | null}
        allPosts={normalized as unknown as AnalyticsPost[]}
        avgEngagement={kpis.avgEng}
        onCreateSimilar={() => {
          // Lleva al usuario al composer · tab Parrilla
          setDashTab("parrilla");
        }}
      />
    </div>
  );
}

function PostCard({
  post: p,
  delay,
  onClick,
}: {
  post: NormalizedPost;
  delay: number;
  onClick: () => void;
}) {
  const isIg = p.source === "ig";
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="text-left"
    >
      <SpotlightCard className="overflow-hidden h-full hover:border-foreground/30 transition-colors">
        <div className="aspect-square bg-secondary/60 relative overflow-hidden">
          {p.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.thumb}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
              {isIg ? <ImageOff className="size-8" /> : <Facebook className="size-8" />}
            </div>
          )}
          {p.type && (
            <Badge
              variant={
                p.type === "VIDEO"
                  ? "violet"
                  : p.type === "CAROUSEL_ALBUM"
                    ? "ember"
                    : "info"
              }
              className="absolute top-2 left-2 !text-[9px]"
            >
              {p.type}
            </Badge>
          )}
        </div>
        <div className="p-3">
          <div className="text-[11px] text-muted-foreground line-clamp-3 mb-2 leading-snug" title={p.text}>
            {p.text ?? "—"}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3" /> {fmt.short(p.likes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3" /> {fmt.short(p.comments)}
            </span>
            {p.date && (
              <span className="ml-auto font-mono text-[9px] opacity-70">
                {new Date(p.date).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>
      </SpotlightCard>
    </motion.button>
  );
}

function PostDrawer({
  post,
  onClose,
}: {
  post: NormalizedPost | null;
  onClose: () => void;
}) {
  if (!post) {
    return <Drawer open={false} onClose={onClose} />;
  }
  const dateLong = post.date
    ? new Date(post.date).toLocaleString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Fecha desconocida";
  const engagement = post.likes + post.comments;

  return (
    <Drawer
      open={!!post}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          {post.source === "ig" ? (
            <Instagram className="size-3.5 text-[hsl(var(--brand-violet))]" />
          ) : (
            <Facebook className="size-3.5 text-[hsl(var(--info))]" />
          )}
          Post {post.source === "ig" ? "Instagram" : "Facebook"}
        </span>
      }
      subtitle={dateLong}
      footer={
        post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <Button variant="glow" size="sm" className="w-full">
              <ExternalLink className="size-3.5" /> Abrir en{" "}
              {post.source === "ig" ? "Instagram" : "Facebook"}
            </Button>
          </a>
        )
      }
    >
      <div className="space-y-4">
        {/* Imagen */}
        <div className="rounded-lg overflow-hidden border border-border bg-secondary/50">
          {post.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.thumb} alt="" className="w-full h-auto block" />
          ) : (
            <div className="aspect-square grid place-items-center text-muted-foreground/40">
              {post.source === "ig" ? (
                <Instagram className="size-10" />
              ) : (
                <Facebook className="size-10" />
              )}
            </div>
          )}
        </div>

        {/* Type badge */}
        {post.type && (
          <Badge
            variant={
              post.type === "VIDEO"
                ? "violet"
                : post.type === "CAROUSEL_ALBUM"
                  ? "ember"
                  : "info"
            }
            className="!text-[10px]"
          >
            {post.type}
          </Badge>
        )}

        {/* Caption completo */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            Caption / mensaje
          </div>
          <div className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap">
            {post.text ?? <span className="text-muted-foreground italic">Sin texto</span>}
          </div>
        </div>

        {/* Fecha */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Calendar className="size-3" /> Publicado
          </div>
          <div className="text-[12px] font-mono">{dateLong}</div>
        </div>

        {/* Métricas */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Engagement
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MetricCell
              icon={<Heart className="size-3.5" />}
              label="Likes"
              value={fmt.int(post.likes)}
              tone="ember"
            />
            <MetricCell
              icon={<MessageCircle className="size-3.5" />}
              label="Comentarios"
              value={fmt.int(post.comments)}
              tone="cyan"
            />
            <MetricCell
              icon={<TrendingUp className="size-3.5" />}
              label="Total"
              value={fmt.int(engagement)}
              tone="lime"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function MetricCell({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "violet" | "ember" | "cyan" | "lime";
}) {
  const toneColor: Record<string, string> = {
    default: "text-foreground",
    violet: "text-[hsl(var(--brand-violet))]",
    ember: "text-[hsl(var(--brand-ember))]",
    cyan: "text-[hsl(var(--brand-cyan))]",
    lime: "text-[hsl(var(--brand-lime))]",
  };
  return (
    <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80 font-bold flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={cn("font-mono font-bold text-[16px] mt-1", toneColor[tone])}>
        {value}
      </div>
    </div>
  );
}
