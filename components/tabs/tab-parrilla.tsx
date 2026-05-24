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
  BookOpen,
  Flame,
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
import { Insights24h } from "@/components/parrilla/insights-24h";
import { bestTimeForPlatform, RULES_2026 } from "@/components/parrilla/best-time";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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
            title: "Parrilla inteligente · piloto automático",
            body: "Planifica, organiza y optimiza tus redes desde un solo lugar. Calendario + ideas IA + hashtags clasificados + preview real + analítica primeras 24h.",
          },
          {
            title: "Composer Metricool-style",
            body: "Pulsa 'Nuevo post' o clic en un día. El composer tiene 5 pestañas: Compose (caption + imagen), Ideas (Mark/Lúa genera 5 ideas), Hashtags (HIGH/MID/NICHE), Preview (mockup real IG/FB/Reel/Story) y Best time (mejor hora para postear).",
          },
          {
            title: "Ideas instantáneas con tu tono Bewe",
            body: "Mark/Lúa conocen el perfil Bewe y generan posts con hook + copy + CTA según objetivo (engagement, leads, awareness, brand).",
          },
          {
            title: "Hashtags que funcionan",
            body: "Clasificación automática en HIGH (>1M), MID (100k-1M) y NICHE (<100k alta intención). Mix recomendado 2026: 3 high + 4 mid + 3 niche.",
          },
          {
            title: "Analytics primeras 24h",
            body: "Detectamos posts que en sus primeras horas ya superan el promedio de tu cuenta · esos son las 'estrellas 24h' que merecen amplificación.",
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
            const isToday = c.iso === todayIso;
            const isPast = c.iso != null && c.iso < todayIso;
            const density = dayPosts.length / maxDayCount;
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
                  isPast && c.iso && "opacity-55",
                  isToday &&
                    "!border-[hsl(var(--brand-violet))] ring-2 ring-[hsl(var(--brand-violet)/0.45)] bg-[hsl(var(--brand-violet)/0.08)]",
                  selectedDate === c.iso && !isToday && "ring-2 ring-[hsl(var(--brand-cyan)/0.6)]",
                )}
                style={
                  c.iso && !isToday && dayPosts.length > 0
                    ? {
                        background: `hsl(var(--brand-violet) / ${0.04 + density * 0.18})`,
                      }
                    : undefined
                }
              >
                {c.day && (
                  <>
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "text-[11px] font-bold",
                          isToday
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
                      {dayPosts.length > 0 && (
                        <span
                          className={cn(
                            "text-[9px] font-mono font-bold rounded-full px-1.5 py-0.5",
                            dayPosts.length >= 3
                              ? "bg-[hsl(var(--brand-violet))] text-white"
                              : "text-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.15)]",
                          )}
                        >
                          {dayPosts.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayPosts.slice(0, 2).map((p) => (
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
                      {dayPosts.length > 2 && (
                        <div className="text-[9px] text-muted-foreground">
                          +{dayPosts.length - 2} más
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[hsl(var(--brand-violet)/0.18)] border border-[hsl(var(--brand-violet)/0.3)]" />
            Instagram / Reel / Story
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[hsl(var(--info)/0.18)] border border-[hsl(var(--info)/0.3)]" />
            Facebook
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border-2 border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.08)]" />
            Hoy
          </span>
          <span className="ml-auto text-[9px] font-mono">
            Click día → ver detalle · 3+ posts = badge sólido
          </span>
        </div>
      </TextureCard>

      {/* Analítica + Reglas 2026 lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TextureCard className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <Flame className="size-3 text-[hsl(var(--brand-ember))]" />
            Insights primeras 24h
          </div>
          <Insights24h />
        </TextureCard>

        <TextureCard className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <BookOpen className="size-3 text-[hsl(var(--brand-lime))]" />
            Reglas 2026 · engagement orgánico
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
          onAdd={handleAddPost}
          onClose={() => setComposerOpen(false)}
        />
      </Drawer>
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
  onClose,
  onDelete,
  onAdd,
}: {
  date: string | null;
  posts: ScheduledPost[];
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
  return (
    <Drawer
      open={!!date}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Calendar className="size-3.5 text-[hsl(var(--brand-cyan))]" /> {longDate}
        </span>
      }
      subtitle={`${posts.length} post${posts.length === 1 ? "" : "s"} programado${posts.length === 1 ? "" : "s"}`}
      footer={
        <Button
          onClick={() => onAdd(date)}
          variant="glow"
          size="sm"
          className="w-full"
        >
          <Plus className="size-3.5" /> Agregar post a este día
        </Button>
      }
    >
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-8">
            <div className="size-10 rounded-xl bg-secondary mx-auto mb-3 grid place-items-center">
              <Calendar className="size-4 text-muted-foreground" />
            </div>
            <div className="text-[12px] text-muted-foreground mb-3">
              No hay posts programados para este día.
            </div>
          </div>
        )}
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
  onClose,
  onAdd,
}: {
  date: string;
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

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-1">
        Mejor hora para publicar
      </div>
      {normalized.map((pl) => {
        const rec = bestTimeForPlatform(pl);
        const platformLabel = pl === "ig" ? "Instagram (feed/reel/story)" : "Facebook";
        return (
          <div
            key={pl}
            className="rounded-lg border border-border/60 bg-card/60 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-semibold inline-flex items-center gap-1.5">
                {pl === "ig" ? (
                  <Instagram className="size-3.5 text-[hsl(var(--brand-violet))]" />
                ) : (
                  <Facebook className="size-3.5 text-[hsl(var(--info))]" />
                )}
                {platformLabel}
              </div>
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
              <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground font-bold mb-1">
                Alternativas
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
