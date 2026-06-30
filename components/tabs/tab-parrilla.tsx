"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Pencil,
  Facebook,
  Instagram,
  Sparkles,
  Send,
  Trash2,
  Plus,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  Hash,
  Lightbulb,
  Eye,
  Clock4,
  Film,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Wand2,
  ExternalLink,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OnboardingTip } from "@/components/shared/onboarding-tip";
import { Drawer } from "@/components/shared/drawer";
import { PARRILLA_TEMPLATES, type ParrillaTemplate } from "@/components/parrilla/templates";
import {
  loadPosts,
  savePosts,
  cryptoRandomId,
  type ScheduledPost,
  type ParrillaPlatform,
} from "@/lib/parrilla-data";
import { HashtagFinder } from "@/components/parrilla/hashtag-finder";
import { IdeaGenerator, type PostIdea } from "@/components/parrilla/idea-generator";
import { PostPreview, type PreviewPlatform } from "@/components/parrilla/post-preview";
import { bestTimeForPlatform } from "@/components/parrilla/best-time";
import {
  seedJulio2026Semana1,
  JULIO_2026_SEMANA_1,
  hasSeedConflicts,
} from "@/lib/parrilla-seed-julio-2026";
import { useOrganic } from "@/lib/hooks/use-organic";
import { dailyPlan, performanceByFormat, type AnalyticsPost } from "@/lib/organic-analytics";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface PublishedPost {
  id: string;
  platform: "ig" | "fb";
  caption?: string;
  thumb?: string;
  likes: number;
  comments: number;
  permalink?: string;
  type?: string;
}

export function TabParrilla() {
  const [posts, setPosts] = React.useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerDate, setComposerDate] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  // Mes que se está viendo (puede no ser el actual)
  const today = React.useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  /**
   * Histórico real publicado (queja #1 · "voy al día 22 y no me dice qué se
   * publicó"). Traemos IG + FB de Meta API y los indexamos por fecha ISO para
   * pintar el calendario.
   */
  const { ig, fb } = useOrganic({ limit: 100 });
  const publishedByDate = React.useMemo(() => {
    const map = new Map<string, PublishedPost[]>();
    for (const p of ig.posts) {
      if (!p.timestamp) continue;
      const iso = new Date(p.timestamp).toISOString().slice(0, 10);
      const arr = map.get(iso) ?? [];
      arr.push({
        id: p.id,
        platform: "ig",
        caption: p.caption,
        thumb: p.thumbnail_url || p.media_url,
        likes: p.like_count ?? 0,
        comments: p.comments_count ?? 0,
        permalink: p.permalink,
        type: p.media_type,
      });
      map.set(iso, arr);
    }
    for (const p of fb.posts) {
      if (!p.created_time) continue;
      const iso = new Date(p.created_time).toISOString().slice(0, 10);
      const arr = map.get(iso) ?? [];
      arr.push({
        id: p.id,
        platform: "fb",
        caption: p.message,
        thumb: p.full_picture,
        likes: p.reactions?.summary?.total_count ?? 0,
        comments: p.comments?.summary?.total_count ?? 0,
        permalink: p.permalink_url,
      });
      map.set(iso, arr);
    }
    return map;
  }, [ig.posts, fb.posts]);

  /** Posts orgánicos normalizados (para el análisis del plan próxima semana). */
  const analyticsPosts = React.useMemo<AnalyticsPost[]>(() => {
    const out: AnalyticsPost[] = [];
    for (const p of ig.posts) {
      out.push({
        id: p.id,
        source: "ig",
        thumb: p.thumbnail_url || p.media_url,
        text: p.caption,
        likes: p.like_count ?? 0,
        comments: p.comments_count ?? 0,
        date: p.timestamp,
        type: p.media_type,
        media_product_type: p.media_product_type,
      });
    }
    for (const p of fb.posts) {
      out.push({
        id: p.id,
        source: "fb",
        thumb: p.full_picture,
        text: p.message,
        likes: p.reactions?.summary?.total_count ?? 0,
        comments: p.comments?.summary?.total_count ?? 0,
        date: p.created_time,
      });
    }
    return out;
  }, [ig.posts, fb.posts]);

  // Hydrate on mount
  React.useEffect(() => {
    setPosts(loadPosts());
    setHydrated(true);
  }, []);

  // Persist
  React.useEffect(() => {
    if (!hydrated) return;
    savePosts(posts);
  }, [posts, hydrated]);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, iso });
  }

  const todayIso = today.toISOString().slice(0, 10);
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthPosts = posts.filter((p) => p.date.startsWith(monthPrefix));

  const nextPost = React.useMemo(() => {
    const upcoming = posts
      .filter((p) => p.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!upcoming) return null;
    const d = new Date(upcoming.date).getTime();
    const todayTs = new Date(todayIso).getTime();
    const daysUntil = Math.round((d - todayTs) / 864e5);
    return { post: upcoming, daysUntil };
  }, [posts, todayIso]);

  const dayCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      map.set(p.date, (map.get(p.date) ?? 0) + 1);
    }
    return map;
  }, [posts]);
  const maxDayCount = Math.max(1, ...Array.from(dayCounts.values()));

  function handleAddPost(p: Omit<ScheduledPost, "id" | "createdAt">) {
    const newPost: ScheduledPost = {
      ...p,
      id: cryptoRandomId(),
      createdAt: new Date().toISOString(),
    };
    setPosts((curr) => [...curr, newPost]);
    setComposerOpen(false);
    toast.success("Post programado", {
      description: `${p.platforms.join(", ").toUpperCase()} · ${p.date}`,
    });
  }

  function handleDeletePost(id: string) {
    setPosts((curr) => curr.filter((p) => p.id !== id));
    toast.info("Post eliminado");
  }

  function handleClearAll() {
    if (!posts.length) return;
    if (
      !window.confirm(
        `¿Eliminar TODOS los ${posts.length} posts programados? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setPosts([]);
    toast.success("Parrilla limpiada");
  }

  /** Inyecta los 4 posts de la semana 1-4 jul 2026 (Estrategia Julio · plan cliente). */
  function handleSeedJulio() {
    // Navegar a julio primero (más robusto que hardcodear el mes)
    const firstSeedDate = JULIO_2026_SEMANA_1[0]?.date ?? "2026-07-01";
    const [targetY, targetM] = firstSeedDate.split("-").map(Number);
    setViewYear(targetY);
    setViewMonth((targetM ?? 7) - 1);

    // Si ya hay posts en los días del seed o legacy, preguntar si reemplazar
    const replace =
      hasSeedConflicts(posts) &&
      window.confirm(
        "Ya tienes posts programados en la primera semana de julio.\n\n" +
          "¿Cargar el plan validado y limpiar lo viejo?\n\n" +
          "Se REEMPLAZA: mié 1 · jue 2 · vie 3 · sáb 4 con el plan nuevo\n" +
          "Se LIMPIA: dom 5 · lun 6 · mar 7 (eran del plan viejo)\n\n" +
          "OK = aplicar · Cancelar = mantener lo que tienes",
      );

    const { merged, added, skipped, removed } = seedJulio2026Semana1(posts, { replace });

    if (added === 0) {
      toast.info("Esos días ya estaban cargados. Te llevo a julio para que los veas.");
      return;
    }
    setPosts(merged);
    const parts = [`✨ ${added} posts cargados (1-4 jul)`];
    if (removed) parts.push(`${removed} viejos eliminados`);
    if (skipped) parts.push(`${skipped} días ya tenían contenido`);
    toast.success(parts.join(" · "));
  }

  function openComposerForDate(iso: string | null) {
    setComposerDate(iso ?? todayIso);
    setComposerOpen(true);
  }

  function openDayDrawer(iso: string) {
    setSelectedDate(iso);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const monthLabel = firstDay.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-[1500px]">
      <OnboardingTip
        storageKey="parrilla"
        steps={[
          {
            title: "Parrilla · solo planificación",
            body: "Acá organizás qué publicar. El análisis 24h y las reglas 2026 viven en Orgánico (tab Contenidos Orgánicos).",
          },
          {
            title: "Calendario con histórico real",
            body: "Verde = ya publicado (viene de Meta API) · Azul = hoy · Violeta = programado futuro. Click cualquier día para ver detalle.",
          },
          {
            title: "Composer con sugerencia automática",
            body: "Al seleccionar un día futuro, te sugerimos formato y mejor hora basado en histórico real. Tab Ideas: Mark/Lúa genera 5 posts con tu tono Bewe.",
          },
          {
            title: "Plan próxima semana",
            body: "Te decimos qué publicar cada uno de los próximos 7 días, basado en el día de la semana y el formato top de tu cuenta.",
          },
          {
            title: "Persistencia local",
            body: "Posts guardados en localStorage. La publicación directa requerirá pages_manage_posts + instagram_content_publish (próxima fase).",
          },
        ]}
      />

      <SectionHeader
        title={`Parrilla · ${monthLabel}`}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              <strong className="text-foreground">{monthPosts.length}</strong> posts este mes
            </span>
            {nextPost && (
              <span className="text-[hsl(var(--brand-violet))]">
                · próximo en{" "}
                <strong>
                  {nextPost.daysUntil === 0
                    ? "hoy"
                    : nextPost.daysUntil === 1
                      ? "1 día"
                      : `${nextPost.daysUntil} días`}
                </strong>
              </span>
            )}
          </span>
        }
        right={
          <>
            <Button
              onClick={handleSeedJulio}
              size="sm"
              variant="outline"
              className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10"
              title="Carga los 7 posts de la Estrategia Julio 2026 (1-7 jul)"
            >
              <Sparkles className="size-3.5" /> Cargar planeación Julio
            </Button>
            {posts.length > 0 && (
              <Button onClick={handleClearAll} size="sm" variant="outline">
                <Trash2 className="size-3.5" /> Limpiar todo
              </Button>
            )}
            <Button
              onClick={() => openComposerForDate(selectedDate)}
              size="sm"
              variant="glow"
            >
              <Pencil className="size-3.5" />
              Nuevo post
            </Button>
          </>
        }
      />

      {/* Mini stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MiniStat label="Programados mes" value={monthPosts.length.toString()} tone="violet" />
        <MiniStat
          label="Días con posts"
          value={new Set(monthPosts.map((p) => p.date)).size.toString()}
          tone="cyan"
        />
        <MiniStat
          label="Instagram"
          value={monthPosts.filter((p) => p.platforms.includes("ig")).length.toString()}
          tone="violet"
          icon={<Instagram className="size-3" />}
        />
        <MiniStat
          label="Facebook"
          value={monthPosts.filter((p) => p.platforms.includes("fb")).length.toString()}
          tone="info"
          icon={<Facebook className="size-3" />}
        />
      </div>

      {/* Calendar full width */}
      <TextureCard className="p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Button
              onClick={prevMonth}
              size="sm"
              variant="outline"
              className="!h-7 !w-7 !px-0"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              onClick={nextMonth}
              size="sm"
              variant="outline"
              className="!h-7 !w-7 !px-0"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              onClick={goToday}
              size="sm"
              variant="ghost"
              className="!h-7 !text-[10px] ml-1"
            >
              Hoy
            </Button>
          </div>
          <div className="text-[11px] font-semibold capitalize">{monthLabel}</div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground text-center py-1.5"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => {
            const dayPosts = c.iso ? posts.filter((p) => p.date === c.iso) : [];
            const dayPublished = c.iso ? publishedByDate.get(c.iso) ?? [] : [];
            const isToday = c.iso === todayIso;
            const isPast = c.iso != null && c.iso < todayIso;
            const isFuture = c.iso != null && c.iso > todayIso;
            const hasPublished = dayPublished.length > 0;
            const hasScheduledFuture = isFuture && dayPosts.length > 0;
            const density = (dayPosts.length + dayPublished.length) / maxDayCount;
            return (
              <motion.button
                key={i}
                onClick={() => c.iso && openDayDrawer(c.iso)}
                disabled={!c.iso}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.008, duration: 0.3 }}
                whileHover={c.iso ? { y: -2 } : undefined}
                className={cn(
                  "min-h-[88px] rounded-lg border text-left p-2 transition-all relative",
                  c.iso
                    ? "border-border bg-card/60 hover:border-foreground/40 cursor-pointer"
                    : "border-transparent cursor-default",
                  // PAST publicado · verde
                  isPast &&
                    hasPublished &&
                    "!border-[hsl(var(--brand-lime)/0.6)] !bg-[hsl(var(--brand-lime)/0.06)]",
                  // PAST sin publicar · gris desaturado
                  isPast && !hasPublished && "opacity-55",
                  // HOY · azul (queja #1)
                  isToday &&
                    "!border-[hsl(var(--brand-cyan))] ring-2 ring-[hsl(var(--brand-cyan)/0.45)] !bg-[hsl(var(--brand-cyan)/0.08)]",
                  // FUTURO programado · morado
                  hasScheduledFuture &&
                    !isToday &&
                    "!border-[hsl(var(--brand-violet)/0.5)] !bg-[hsl(var(--brand-violet)/0.06)]",
                  selectedDate === c.iso && !isToday && "ring-2 ring-[hsl(var(--brand-cyan)/0.6)]",
                )}
                style={
                  c.iso && !isToday && !hasPublished && dayPosts.length > 0
                    ? {
                        background: `hsl(var(--brand-violet) / ${0.04 + density * 0.18})`,
                      }
                    : undefined
                }
                title={
                  hasPublished
                    ? `${dayPublished.length} publicado · click para ver detalle`
                    : hasScheduledFuture
                      ? `${dayPosts.length} programado · click para ver detalle`
                      : isToday
                        ? "Hoy"
                        : c.iso ?? ""
                }
              >
                {c.day && (
                  <>
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "text-[11px] font-bold",
                          isToday
                            ? "text-[hsl(var(--brand-cyan))]"
                            : hasPublished
                              ? "text-[hsl(var(--brand-lime))]"
                              : hasScheduledFuture
                                ? "text-[hsl(var(--brand-violet))]"
                                : "text-muted-foreground",
                        )}
                      >
                        {c.day}
                        {isToday && (
                          <span className="ml-1 text-[8px] font-normal uppercase opacity-80">
                            hoy
                          </span>
                        )}
                      </div>
                      <div className="inline-flex items-center gap-1">
                        {hasPublished && (
                          <span
                            className="text-[9px] font-mono font-bold rounded-full px-1.5 py-0.5 bg-[hsl(var(--brand-lime)/0.18)] text-[hsl(var(--brand-lime))]"
                            title={`${dayPublished.length} publicado`}
                          >
                            ✓{dayPublished.length}
                          </span>
                        )}
                        {dayPosts.length > 0 && (
                          <span
                            className={cn(
                              "text-[9px] font-mono font-bold rounded-full px-1.5 py-0.5",
                              dayPosts.length >= 3
                                ? "bg-[hsl(var(--brand-violet))] text-white"
                                : "text-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.15)]",
                            )}
                            title={`${dayPosts.length} programado`}
                          >
                            {dayPosts.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {/* Publicados primero (verde) */}
                      {dayPublished.slice(0, 2).map((p) => (
                        <div
                          key={`pub-${p.id}`}
                          className="text-[9px] truncate px-1 py-0.5 rounded leading-snug bg-[hsl(var(--brand-lime)/0.18)] text-[hsl(var(--brand-lime))]"
                          title={p.caption ?? "Publicado"}
                        >
                          ✓ {p.caption?.slice(0, 14) || "(sin texto)"}…
                        </div>
                      ))}
                      {/* Programados después (violeta o azul) */}
                      {dayPosts.slice(0, Math.max(0, 2 - dayPublished.length)).map((p) => (
                        <div
                          key={p.id}
                          className="text-[9px] truncate px-1 py-0.5 rounded leading-snug"
                          style={{
                            background: p.platforms.includes("ig") || p.platforms.includes("reel") || p.platforms.includes("story")
                              ? "hsl(var(--brand-violet) / 0.18)"
                              : "hsl(var(--info) / 0.18)",
                            color: p.platforms.includes("ig") || p.platforms.includes("reel") || p.platforms.includes("story")
                              ? "hsl(var(--brand-violet))"
                              : "hsl(var(--info))",
                          }}
                        >
                          {p.caption.slice(0, 16) || "(sin texto)"}…
                        </div>
                      ))}
                      {dayPosts.length + dayPublished.length > 2 && (
                        <div className="text-[9px] text-muted-foreground">
                          +{dayPosts.length + dayPublished.length - 2} más
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Leyenda · pasado publicado / hoy / futuro programado */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[hsl(var(--brand-lime)/0.18)] border border-[hsl(var(--brand-lime)/0.6)]" />
            Publicado (✓)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[hsl(var(--brand-cyan)/0.18)] border-2 border-[hsl(var(--brand-cyan))]" />
            Hoy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[hsl(var(--brand-violet)/0.18)] border border-[hsl(var(--brand-violet)/0.5)]" />
            Programado futuro
          </span>
          <span className="ml-auto text-[9px] font-mono">
            Click día → ver detalle · histórico desde Meta API
          </span>
        </div>
      </TextureCard>

      {/* Plan próxima semana · qué publicar (queja Parrilla #9) */}
      <NextWeekPlan
        posts={analyticsPosts}
        onScheduleDay={(iso) => openComposerForDate(iso)}
      />

      {/* Empty state */}
      {hydrated && posts.length === 0 && (
        <TextureCard className="p-8 text-center border-dashed">
          <div className="size-12 rounded-2xl bg-[hsl(var(--brand-cyan)/0.12)] mx-auto mb-3 grid place-items-center border border-[hsl(var(--brand-cyan)/0.3)]">
            <Calendar className="size-5 text-[hsl(var(--brand-cyan))]" />
          </div>
          <div className="text-[13px] font-semibold mb-1">Sin posts programados todavía</div>
          <div className="text-[11px] text-muted-foreground max-w-md mx-auto mb-3">
            Empieza a planear tu mes editorial. Usa una plantilla, genera ideas con Mark/Lúa o pega tu propio caption.
          </div>
          <Button
            onClick={() => openComposerForDate(todayIso)}
            size="sm"
            variant="glow"
          >
            <Plus className="size-3.5" /> Crear primer post
          </Button>
        </TextureCard>
      )}

      {/* Day drawer */}
      <DayDrawer
        date={selectedDate}
        posts={selectedDate ? posts.filter((p) => p.date === selectedDate) : []}
        published={selectedDate ? publishedByDate.get(selectedDate) ?? [] : []}
        todayIso={todayIso}
        onClose={() => setSelectedDate(null)}
        onDelete={handleDeletePost}
        onAdd={(iso) => openComposerForDate(iso)}
      />

      {/* Composer drawer · Metricool-style con tabs */}
      <Drawer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-3.5 text-[hsl(var(--brand-violet))]" /> Nuevo post
          </span>
        }
        subtitle={composerDate ? `Programar para ${composerDate}` : undefined}
        width={520}
      >
        <Composer
          date={composerDate ?? todayIso}
          analyticsPosts={analyticsPosts}
          onAdd={handleAddPost}
          onClose={() => setComposerOpen(false)}
        />
      </Drawer>

      {/* Botón flotante · "Nuevo post" siempre visible (queja Parrilla #5) */}
      <button
        onClick={() => openComposerForDate(selectedDate)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-[hsl(var(--brand-violet))] text-white shadow-[0_10px_40px_-10px_hsl(var(--brand-violet)/0.6)] hover:scale-105 transition-transform font-semibold text-[12px]"
        aria-label="Nuevo post"
      >
        <Pencil className="size-4" />
        Nuevo post
      </button>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "violet" | "info" | "cyan";
  icon?: React.ReactNode;
}) {
  const toneColors: Record<typeof tone, string> = {
    violet: "text-[hsl(var(--brand-violet))]",
    info: "text-[hsl(var(--info))]",
    cyan: "text-[hsl(var(--brand-cyan))]",
  };
  return (
    <TextureCard className="px-3 py-2.5 flex items-center justify-between">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground inline-flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={cn("text-[18px] font-mono font-bold", toneColors[tone])}>
        {value}
      </div>
    </TextureCard>
  );
}

function DayDrawer({
  date,
  posts,
  published,
  todayIso,
  onClose,
  onDelete,
  onAdd,
}: {
  date: string | null;
  posts: ScheduledPost[];
  published: PublishedPost[];
  todayIso: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAdd: (iso: string) => void;
}) {
  if (!date) {
    return <Drawer open={false} onClose={onClose} />;
  }
  const longDate = new Date(date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isPast = date < todayIso;
  const isToday = date === todayIso;
  const isFuture = date > todayIso;
  const subtitleParts: string[] = [];
  if (published.length)
    subtitleParts.push(`${published.length} publicado${published.length === 1 ? "" : "s"}`);
  if (posts.length)
    subtitleParts.push(`${posts.length} programado${posts.length === 1 ? "" : "s"}`);
  return (
    <Drawer
      open={!!date}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Calendar className="size-3.5 text-[hsl(var(--brand-cyan))]" /> {longDate}
        </span>
      }
      subtitle={
        subtitleParts.length
          ? subtitleParts.join(" · ")
          : isPast
            ? "Día pasado · sin publicaciones registradas"
            : "Sin posts programados"
      }
      footer={
        !isPast && (
          <Button
            onClick={() => onAdd(date)}
            variant="glow"
            size="sm"
            className="w-full"
          >
            <Plus className="size-3.5" /> {isToday ? "Publicar hoy" : "Programar este día"}
          </Button>
        )
      }
    >
      <div className="space-y-3">
        {/* Publicados reales (queja #1) */}
        {published.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--brand-lime))] font-bold mb-2 inline-flex items-center gap-1.5">
              <Sparkles className="size-3" /> Publicado este día
            </div>
            <div className="space-y-2">
              {published.map((p) => (
                <motion.a
                  key={`pub-${p.id}`}
                  href={p.permalink}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="block rounded-lg border border-[hsl(var(--brand-lime)/0.4)] bg-[hsl(var(--brand-lime)/0.05)] p-3 hover:bg-[hsl(var(--brand-lime)/0.08)] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={p.platform === "fb" ? "info" : "violet"}
                      className="!text-[9px]"
                    >
                      {p.platform === "fb" ? (
                        <Facebook className="size-2.5 mr-0.5" />
                      ) : (
                        <Instagram className="size-2.5 mr-0.5" />
                      )}
                      {p.platform.toUpperCase()}
                    </Badge>
                    {p.type && (
                      <Badge variant="outline" className="!text-[8px]">
                        {p.type}
                      </Badge>
                    )}
                    {p.permalink && (
                      <ExternalLink className="size-3 text-muted-foreground ml-auto" />
                    )}
                  </div>
                  {p.thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumb}
                      alt=""
                      className="w-full rounded-md mb-2 border border-border/40 max-h-40 object-cover"
                    />
                  )}
                  <div className="text-[11px] text-foreground leading-relaxed line-clamp-4">
                    {p.caption ?? <span className="italic text-muted-foreground">Sin caption</span>}
                  </div>
                  <div className="mt-1.5 text-[9px] font-mono text-muted-foreground inline-flex gap-3">
                    <span>❤ {p.likes}</span>
                    <span>💬 {p.comments}</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {posts.length === 0 && published.length === 0 && (
          <div className="text-center py-8">
            <div className="size-10 rounded-xl bg-secondary mx-auto mb-3 grid place-items-center">
              <Calendar className="size-4 text-muted-foreground" />
            </div>
            <div className="text-[12px] text-muted-foreground mb-3">
              {isPast
                ? "No hay publicaciones registradas este día."
                : isFuture
                  ? "Sin posts programados para este día · usá el composer."
                  : "No hay posts programados para hoy."}
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--brand-violet))] font-bold mb-2 inline-flex items-center gap-1.5">
              <Calendar className="size-3" /> Programados
            </div>
            <div className="space-y-2">
              {posts.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-border/60 bg-card/60 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {p.platforms.map((pl) => (
                      <Badge
                        key={pl}
                        variant={pl === "fb" ? "info" : "violet"}
                        className="!text-[9px]"
                      >
                        {platformIcon(pl)}
                        {pl.toUpperCase()}
                      </Badge>
                    ))}
                    <button
                      onClick={() => onDelete(p.id)}
                      className="ml-auto size-6 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-[hsl(var(--destructive))] hover:border-[hsl(var(--destructive)/0.4)]"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="w-full rounded-md mb-2 border border-border/40"
                    />
                  )}
                  <div className="text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">
                    {p.caption}
                  </div>
                  <div className="mt-2 text-[9px] font-mono text-muted-foreground/70">
                    {p.time && `⏰ ${p.time} · `}Creado {new Date(p.createdAt).toLocaleDateString("es-ES")}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function platformIcon(p: ParrillaPlatform) {
  switch (p) {
    case "ig":
      return <Instagram className="size-2.5 mr-0.5" />;
    case "fb":
      return <Facebook className="size-2.5 mr-0.5" />;
    case "reel":
      return <Film className="size-2.5 mr-0.5" />;
    case "story":
      return <Smartphone className="size-2.5 mr-0.5" />;
  }
}

// ===== COMPOSER METRICOOL-STYLE =====

type ComposerTab = "compose" | "ideas" | "hashtags" | "preview" | "besttime";

function Composer({
  date,
  analyticsPosts,
  onClose,
  onAdd,
}: {
  date: string;
  analyticsPosts: AnalyticsPost[];
  onClose: () => void;
  onAdd: (p: Omit<ScheduledPost, "id" | "createdAt">) => void;
}) {
  const [tab, setTab] = React.useState<ComposerTab>("compose");
  const [imgUrl, setImgUrl] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [platforms, setPlatforms] = React.useState<ParrillaPlatform[]>(["ig"]);
  const [publishing, setPublishing] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [dateValue, setDateValue] = React.useState(date);
  const [timeValue, setTimeValue] = React.useState("19:00");
  const [goal, setGoal] = React.useState<ScheduledPost["goal"]>("engagement");

  /**
   * Sugerencia automática del composer (queja Parrilla #2):
   * Cuando el user clickea un día futuro, leemos el dailyPlan() para ese
   * weekday y prefilleamos formato sugerido + hora pico histórica.
   */
  const dailySuggestion = React.useMemo(() => {
    if (!analyticsPosts.length) return null;
    const plan = dailyPlan(analyticsPosts);
    const targetWeekday = new Date(`${dateValue}T00:00:00`).getDay();
    const match = plan.find((p) => p.weekday === targetWeekday);
    return match ?? null;
  }, [analyticsPosts, dateValue]);

  // Si la sugerencia trae una hora pico distinta del default, prefill (una vez)
  const didPrefillRef = React.useRef(false);
  React.useEffect(() => {
    if (didPrefillRef.current) return;
    if (dailySuggestion?.bestHour) {
      setTimeValue(dailySuggestion.bestHour);
      didPrefillRef.current = true;
    }
  }, [dailySuggestion]);

  function toggle(p: ParrillaPlatform) {
    setPlatforms((curr) =>
      curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p],
    );
  }

  function applyTemplate(t: ParrillaTemplate) {
    setCaption(t.caption);
    setPlatforms(t.platforms);
    setSelectedTemplate(t.id);
    toast.info(`Plantilla "${t.label}" aplicada`);
  }

  function useIdea(idea: PostIdea) {
    const text = `${idea.hook}\n\n${idea.copy}\n\n${idea.cta}`;
    setCaption(text);
    setTab("compose");
  }

  function insertHashtags(text: string) {
    setCaption((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text));
    setTab("compose");
  }

  const captionLen = caption.trim().length;
  const captionTooShort = captionLen > 0 && captionLen < 10;
  const captionEmpty = captionLen === 0;
  const noPlatform = platforms.length === 0;
  const igLimit = 2200;
  const overLimit = caption.length > igLimit;

  async function publishNow() {
    if (captionEmpty) {
      toast.error("Caption vacío", { description: "Escribe al menos 10 caracteres." });
      return;
    }
    if (captionTooShort) {
      toast.error("Caption demasiado corto");
      return;
    }
    if (noPlatform) {
      toast.error("Selecciona al menos una plataforma");
      return;
    }
    setPublishing(true);
    try {
      onAdd({
        date: dateValue,
        platforms,
        caption: caption.trim(),
        imageUrl: imgUrl.trim() || undefined,
        time: timeValue,
        goal,
      });
    } finally {
      setPublishing(false);
    }
  }

  // Plataforma de preview = primera seleccionada (o IG por defecto)
  const previewPlatform: PreviewPlatform =
    (platforms[0] as PreviewPlatform) ?? "ig";

  // Tema para idea/hashtag generator (caption truncado o palabra inicial)
  const baseTopic = caption.trim().split(/[.\n]/)[0]?.slice(0, 80) ?? "";

  const TABS: Array<{ id: ComposerTab; label: string; icon: React.ReactNode }> = [
    { id: "compose", label: "Compose", icon: <Pencil className="size-3" /> },
    { id: "ideas", label: "Ideas", icon: <Lightbulb className="size-3" /> },
    { id: "hashtags", label: "Hashtags", icon: <Hash className="size-3" /> },
    { id: "preview", label: "Preview", icon: <Eye className="size-3" /> },
    { id: "besttime", label: "Best time", icon: <Clock4 className="size-3" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Sugerencia automática del día (queja Parrilla #2) */}
      {dailySuggestion && (
        <div className="rounded-lg border border-[hsl(var(--brand-cyan)/0.4)] bg-[hsl(var(--brand-cyan)/0.05)] p-3">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] font-bold text-[hsl(var(--brand-cyan))] mb-1.5">
            <Sparkles className="size-3" /> Sugerencia para{" "}
            <span className="capitalize">{dailySuggestion.weekdayName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="outline" className="!text-[9px]">
              {dailySuggestion.suggestedFormat}
            </Badge>
            <Badge variant="cyan" className="!text-[9px]">
              <Clock4 className="size-2.5 mr-0.5" /> {dailySuggestion.bestHour}
            </Badge>
            {dailySuggestion.count > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {dailySuggestion.avgEngagement.toFixed(1)} eng/post histórico
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground leading-snug">
            {dailySuggestion.rationale}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg border border-border/60 bg-card/40">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold px-1.5 py-1.5 rounded-md transition-all",
              tab === t.id
                ? "bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "compose" && (
            <ComposePanel
              caption={caption}
              setCaption={setCaption}
              imgUrl={imgUrl}
              setImgUrl={setImgUrl}
              platforms={platforms}
              toggle={toggle}
              dateValue={dateValue}
              setDateValue={setDateValue}
              timeValue={timeValue}
              setTimeValue={setTimeValue}
              goal={goal}
              setGoal={setGoal}
              selectedTemplate={selectedTemplate}
              applyTemplate={applyTemplate}
              captionTooShort={captionTooShort}
              overLimit={overLimit}
              captionLen={caption.length}
              igLimit={igLimit}
            />
          )}
          {tab === "ideas" && (
            <IdeaGenerator
              platform={(platforms[0] as PreviewPlatform) ?? "ig"}
              onUse={useIdea}
            />
          )}
          {tab === "hashtags" && (
            <HashtagFinder initialTopic={baseTopic} onInsert={insertHashtags} />
          )}
          {tab === "preview" && (
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
                Vista previa · {previewPlatform.toUpperCase()}
              </div>
              {!caption.trim() && !imgUrl.trim() ? (
                <div className="rounded-lg border border-dashed border-border bg-card/40 p-5 text-center">
                  <Eye className="size-7 mx-auto mb-2 text-muted-foreground/50" />
                  <div className="text-[11px] text-muted-foreground">
                    Añade caption o imagen en <strong>Compose</strong> para ver el mockup.
                  </div>
                </div>
              ) : (
                <PostPreview
                  platform={previewPlatform}
                  caption={caption}
                  imageUrl={imgUrl}
                />
              )}
              <div className="text-[9px] text-muted-foreground/70 leading-snug">
                Mockup visual · no publica en Meta. Confirma el formato y vuelve a Compose para programar.
              </div>
            </div>
          )}
          {tab === "besttime" && <BestTimePanel platforms={platforms} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 pt-2 border-t border-border/40">
        <Button onClick={onClose} variant="outline" size="sm" className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={publishNow}
          disabled={publishing || captionEmpty || noPlatform || overLimit}
          variant="glow"
          size="sm"
          className="flex-[2]"
        >
          <Send className="size-3.5" />
          {publishing ? "Programando…" : "Programar post"}
        </Button>
      </div>

      <div className="text-[10px] text-muted-foreground/70 leading-relaxed">
        Se guarda localmente. La publicación directa via Graph API requiere{" "}
        <code className="font-mono">pages_manage_posts</code> e{" "}
        <code className="font-mono">instagram_content_publish</code>.
      </div>
    </div>
  );
}

function ComposePanel({
  caption,
  setCaption,
  imgUrl,
  setImgUrl,
  platforms,
  toggle,
  dateValue,
  setDateValue,
  timeValue,
  setTimeValue,
  goal,
  setGoal,
  selectedTemplate,
  applyTemplate,
  captionTooShort,
  overLimit,
  captionLen,
  igLimit,
}: {
  caption: string;
  setCaption: (s: string) => void;
  imgUrl: string;
  setImgUrl: (s: string) => void;
  platforms: ParrillaPlatform[];
  toggle: (p: ParrillaPlatform) => void;
  dateValue: string;
  setDateValue: (s: string) => void;
  timeValue: string;
  setTimeValue: (s: string) => void;
  goal: ScheduledPost["goal"];
  setGoal: (g: ScheduledPost["goal"]) => void;
  selectedTemplate: string | null;
  applyTemplate: (t: ParrillaTemplate) => void;
  captionTooShort: boolean;
  overLimit: boolean;
  captionLen: number;
  igLimit: number;
}) {
  return (
    <div className="space-y-4">
      {/* Plantillas */}
      <div>
        <Label className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
          Plantillas rápidas
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {PARRILLA_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className={cn(
                "text-left rounded-lg border p-2.5 transition-all",
                selectedTemplate === t.id
                  ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.08)]"
                  : "border-border/60 bg-card/60 hover:border-foreground/30",
              )}
              title={t.tip}
            >
              <div className="text-[12px] font-semibold flex items-center gap-1.5 mb-1">
                <span>{t.emoji}</span> {t.label}
              </div>
              <div className="text-[9px] text-muted-foreground leading-snug line-clamp-2">
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Plataformas */}
      <div>
        <Label className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
          Plataformas
        </Label>
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { id: "ig" as const, label: "IG", icon: <Instagram className="size-3" /> },
              { id: "fb" as const, label: "FB", icon: <Facebook className="size-3" /> },
              { id: "reel" as const, label: "Reel", icon: <Film className="size-3" /> },
              { id: "story" as const, label: "Story", icon: <Smartphone className="size-3" /> },
            ]
          ).map((p) => {
            const active = platforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex items-center justify-center gap-1 text-[10px] font-semibold px-2 py-2 rounded-md border transition-colors",
                  active
                    ? p.id === "fb"
                      ? "bg-[hsl(var(--info)/0.18)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.4)]"
                      : "bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet)/0.4)]"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {p.icon} {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fecha / Hora */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1.5 block">Fecha</Label>
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Hora</Label>
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
          />
        </div>
      </div>

      {/* Objetivo */}
      <div>
        <Label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
          Objetivo
        </Label>
        <select
          value={goal ?? "engagement"}
          onChange={(e) => setGoal(e.target.value as ScheduledPost["goal"])}
          className="w-full h-9 rounded-md border border-input bg-background/40 px-3 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="engagement">Engagement (likes/comments/saves)</option>
          <option value="leads">Leads (DMs/clicks)</option>
          <option value="awareness">Awareness (alcance)</option>
          <option value="brand">Brand (posicionamiento)</option>
        </select>
      </div>

      {/* Image URL */}
      <div>
        <Label className="mb-1.5 block">URL de imagen (opcional)</Label>
        <Input
          type="url"
          placeholder="https://…"
          value={imgUrl}
          onChange={(e) => setImgUrl(e.target.value)}
        />
      </div>

      {/* Caption */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Caption</Label>
          <span
            className={cn(
              "text-[10px] font-mono",
              overLimit
                ? "text-[hsl(var(--destructive))]"
                : captionLen > 0
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50",
            )}
          >
            {captionLen}/{igLimit}
          </span>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escribe el copy o pulsa la tab Ideas para que Mark/Lúa generen 5…"
          className={cn(
            "w-full min-h-[140px] resize-y rounded-md border bg-background/40 px-3 py-2 text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            captionTooShort || overLimit
              ? "border-[hsl(var(--destructive)/0.5)]"
              : "border-input",
          )}
        />
        {captionTooShort && (
          <div className="mt-1 text-[10px] text-[hsl(var(--warning))] inline-flex items-center gap-1">
            <AlertCircle className="size-3" /> Mínimo 10 caracteres.
          </div>
        )}
      </div>

      {/* Mini-preview inline */}
      {(caption.trim() || imgUrl.trim()) && (
        <div>
          <Label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
            Vista previa rápida
          </Label>
          <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
              <div className="size-6 rounded-full bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]" />
              <div className="text-[11px] font-semibold">@bewe_software</div>
              <div className="ml-auto flex gap-1">
                {platforms.map((p) => (
                  <Badge
                    key={p}
                    variant={p === "fb" ? "info" : "violet"}
                    className="!text-[8px]"
                  >
                    {p.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
            {imgUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt="preview"
                className="w-full aspect-square object-cover bg-secondary"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="aspect-square bg-secondary/40 grid place-items-center text-muted-foreground/40">
                <ImageIcon className="size-8" />
              </div>
            )}
            <div className="p-3 text-[11px] leading-relaxed whitespace-pre-wrap line-clamp-6">
              {caption || "Tu caption aparecerá aquí…"}
            </div>
          </div>
          <div className="mt-1.5 text-[9px] text-muted-foreground/70">
            Para ver mockup completo con UI real → tab <strong>Preview</strong>.
          </div>
        </div>
      )}
    </div>
  );
}

function BestTimePanel({ platforms }: { platforms: ParrillaPlatform[] }) {
  // Normalizar reel/story a "ig" para el helper
  const normalized: Array<"ig" | "fb"> = [];
  for (const p of platforms) {
    if (p === "ig" || p === "reel" || p === "story") {
      if (!normalized.includes("ig")) normalized.push("ig");
    } else if (p === "fb") {
      if (!normalized.includes("fb")) normalized.push("fb");
    }
  }
  if (normalized.length === 0) normalized.push("ig");

  // Por ahora no tenemos hourlyActivity de la audiencia · siempre fallback genérico.
  // Cuando lleguen insights de audiencia (instagram_business_insights) sacar este flag.
  const hasAudienceInsights = false;

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-1">
        Mejor hora para publicar
      </div>

      {/* Banner de honestidad cuando no hay audiencia real */}
      {!hasAudienceInsights && (
        <div className="rounded-lg border border-[hsl(var(--brand-violet)/0.35)] bg-[hsl(var(--brand-violet)/0.10)] p-3 flex items-start gap-2.5">
          <Clock4 className="size-4 shrink-0 text-[hsl(var(--brand-violet))] mt-0.5" />
          <div className="min-w-0 text-[10.5px] leading-snug">
            <div className="font-bold text-foreground mb-0.5">
              Mejor hora para tu audiencia · requiere Instagram Business + permiso
              {" "}<span className="font-mono">instagram_business_insights</span>.
            </div>
            <div className="text-foreground/80">
              Mientras tanto te mostramos best-practices LATAM:
            </div>
          </div>
        </div>
      )}

      {normalized.map((pl) => {
        const rec = bestTimeForPlatform(pl);
        const platformLabel = pl === "ig" ? "Instagram (feed/reel/story)" : "Facebook";
        return (
          <div
            key={pl}
            className="rounded-lg border border-border/60 bg-card/60 p-3"
          >
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div className="text-[12px] font-semibold inline-flex items-center gap-1.5">
                {pl === "ig" ? (
                  <Instagram className="size-3.5 text-[hsl(var(--brand-violet))]" />
                ) : (
                  <Facebook className="size-3.5 text-[hsl(var(--info))]" />
                )}
                {platformLabel}
              </div>
              {!hasAudienceInsights && (
                <Badge
                  variant="outline"
                  className="!text-[8.5px] !border-[hsl(var(--brand-violet)/0.45)] !text-[hsl(var(--brand-violet))] !bg-[hsl(var(--brand-violet)/0.08)] font-semibold"
                >
                  Genérico LATAM · no de tu cuenta
                </Badge>
              )}
              <Badge variant="outline" className="!text-[8px]">
                {rec.confidence}% confianza
              </Badge>
            </div>
            <div className="text-[11px] font-mono font-semibold text-[hsl(var(--brand-cyan))]">
              {rec.weekday}
            </div>
            <div className="text-[11px] font-mono">{rec.hour}</div>
            <div className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
              {rec.rationale}
            </div>
            <div className="mt-2 pt-2 border-t border-border/40">
              <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-1 flex items-center gap-1.5 flex-wrap">
                <span>Alternativas</span>
                {!hasAudienceInsights && (
                  <Badge
                    variant="outline"
                    className="!text-[8px] !border-[hsl(var(--brand-violet)/0.4)] !text-[hsl(var(--brand-violet))] !bg-[hsl(var(--brand-violet)/0.06)]"
                  >
                    Genérico LATAM
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {rec.alternatives.map((a) => (
                  <div key={a.label} className="text-[10px] leading-snug">
                    <span className="font-mono font-semibold">{a.label}</span>{" "}
                    <span className="text-muted-foreground">· {a.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div className="text-[9px] text-muted-foreground/70 leading-snug">
        Recomendaciones basadas en best-practices 2026 + audiencia LATAM/MX.
        Cuando Meta API entregue actividad horaria de tus seguidores, el cálculo será personalizado.
      </div>
    </div>
  );
}

// ===== PLAN PRÓXIMA SEMANA (queja Parrilla #9) =====

/**
 * Sugiere qué publicar cada día de los próximos 7 días basado en:
 *  - dailyPlan() · histórico de qué día performó mejor
 *  - performanceByFormat() · formato top de la cuenta
 *  - lista corta de topics (carrusel, reel, behind-the-scenes…)
 *
 * Render como tabla compacta · click en un día → abre composer con esa fecha.
 */
function NextWeekPlan({
  posts,
  onScheduleDay,
}: {
  posts: AnalyticsPost[];
  onScheduleDay: (iso: string) => void;
}) {
  const plan = React.useMemo(() => dailyPlan(posts), [posts]);
  const formatStats = React.useMemo(() => performanceByFormat(posts), [posts]);

  const TOPICS = [
    "Tip rápido del rubro",
    "Behind the scenes",
    "Caso de éxito de cliente",
    "Promo o descuento",
    "Reel educativo",
    "Pregunta a la audiencia",
    "Comparativa antes/después",
  ];

  const nextDays = React.useMemo(() => {
    const out: Array<{
      iso: string;
      weekday: number;
      label: string;
      topic: string;
      planEntry: (typeof plan)[number] | null;
    }> = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const weekday = d.getDay();
      const planEntry = plan.find((p) => p.weekday === weekday) ?? null;
      const label = d.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });
      out.push({
        iso,
        weekday,
        label,
        topic: TOPICS[i - 1] ?? "Contenido",
        planEntry,
      });
    }
    return out;
  }, [plan]);

  const topFormat = formatStats[0]?.label ?? null;

  return (
    <TextureCard className="p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Wand2 className="size-3.5 text-[hsl(var(--brand-violet))]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Sugerencia editorial · próxima semana
        </h3>
        {topFormat && (
          <Badge variant="violet" className="!text-[9px]">
            Formato top: {topFormat}
          </Badge>
        )}
        <span className="text-[9px] text-muted-foreground/70 ml-auto">
          Click día → abrir composer
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {nextDays.map((d, i) => {
          const fmtSugg = d.planEntry?.suggestedFormat ?? "Mix";
          const bestHour = d.planEntry?.bestHour ?? "19:00";
          const hasHistory = (d.planEntry?.count ?? 0) > 0;
          return (
            <motion.button
              key={d.iso}
              onClick={() => onScheduleDay(d.iso)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="text-left rounded-lg border border-border/60 bg-card/60 p-2.5 hover:border-[hsl(var(--brand-violet)/0.5)] hover:bg-[hsl(var(--brand-violet)/0.04)] transition-colors"
            >
              <div className="text-[11px] font-bold capitalize mb-1">
                {d.label}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <Badge variant="outline" className="!text-[9px]">
                  {fmtSugg}
                </Badge>
                <Badge variant="cyan" className="!text-[9px]">
                  <Clock4 className="size-2.5 mr-0.5" />
                  {bestHour}
                </Badge>
              </div>
              <div
                className="text-[10px] text-foreground/90 leading-snug font-medium mb-1"
                title="Rotación editorial sugerida · ajustá según calendario propio"
              >
                {d.topic}
              </div>
              <div className="text-[9px] text-muted-foreground/70 leading-tight">
                {hasHistory ? (
                  `${d.planEntry?.avgEngagement.toFixed(1)} eng/post histórico`
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block px-1 py-[1px] rounded-sm border border-[hsl(var(--brand-violet)/0.45)] bg-[hsl(var(--brand-violet)/0.08)] text-[hsl(var(--brand-violet))] font-semibold uppercase tracking-wide text-[8px]">
                      Sin histórico · default LATAM
                    </span>
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="text-[9px] text-muted-foreground/70 leading-snug border-t border-border/40 pt-2 space-y-0.5">
        <div>
          Topics: rotación recomendada Bewe · formato y hora derivados de tu histórico IG/FB.
        </div>
        <div>
          Combiná con Mark/Lúa (tab Ideas del composer) para copy listo para publicar.
        </div>
      </div>
    </TextureCard>
  );
}
