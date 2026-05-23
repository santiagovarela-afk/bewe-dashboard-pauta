"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Pencil,
  X,
  Facebook,
  Instagram,
  Sparkles,
  Send,
  Trash2,
  Plus,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
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

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const STORAGE_KEY = "bw_parrilla_posts";

interface ScheduledPost {
  id: string;
  date: string; // ISO YYYY-MM-DD
  platforms: ("ig" | "fb")[];
  caption: string;
  imageUrl?: string;
  createdAt: string;
}

function loadPosts(): ScheduledPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Backwards compat: añadir id/createdAt si faltan
    return parsed.map((p: Partial<ScheduledPost> & { date: string; platforms: ("ig" | "fb")[]; caption: string }) => ({
      id: p.id ?? cryptoRandomId(),
      date: p.date,
      platforms: p.platforms,
      caption: p.caption,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function savePosts(posts: ScheduledPost[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    /* ignore */
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function TabParrilla() {
  const [posts, setPosts] = React.useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerDate, setComposerDate] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate on mount
  React.useEffect(() => {
    setPosts(loadPosts());
    setHydrated(true);
  }, []);

  // Persist on change (después de hidratar para no pisar con [])
  React.useEffect(() => {
    if (!hydrated) return;
    savePosts(posts);
  }, [posts, hydrated]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, iso });
  }

  const todayIso = now.toISOString().slice(0, 10);
  const monthPosts = posts.filter((p) => p.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));

  // Next scheduled post relative to today
  const nextPost = React.useMemo(() => {
    const upcoming = posts
      .filter((p) => p.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!upcoming) return null;
    const d = new Date(upcoming.date).getTime();
    const today = new Date(todayIso).getTime();
    const daysUntil = Math.round((d - today) / 864e5);
    return { post: upcoming, daysUntil };
  }, [posts, todayIso]);

  // Density max for color scale
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

  return (
    <div className="space-y-6 max-w-[1500px]">
      <OnboardingTip
        storageKey="parrilla"
        steps={[
          {
            title: "¿Qué es la Parrilla?",
            body: "Es tu calendario editorial del mes. Aquí planeas qué publicar y cuándo en Instagram y Facebook. Los posts se guardan localmente en tu navegador (no se publican aún en Meta).",
          },
          {
            title: "Programar un post",
            body: "Pulsa 'Nuevo post' o haz clic en cualquier día del calendario. Se abre el composer con plantillas listas (Promo semana, Tutorial Linda, Caso de éxito, Tip rápido).",
          },
          {
            title: "Ver el día completo",
            body: "Haz clic en un día para abrir el panel con todos los posts programados de esa fecha. Puedes eliminarlos individualmente o duplicar uno como base.",
          },
          {
            title: "Persistencia local",
            body: "Todo se guarda en localStorage de tu navegador. Si limpias caché o usas otro equipo, los posts no estarán. La publicación directa a Meta requerirá permisos pages_manage_posts (próxima fase).",
          },
        ]}
      />

      <SectionHeader
        title="Parrilla de contenido · mayo 2026"
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
                        background: `hsl(var(--brand-violet) / ${0.04 + density * 0.14})`,
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
                        <span className="text-[9px] font-mono font-bold text-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.15)] rounded-full px-1.5 py-0.5">
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
                            background: p.platforms.includes("ig")
                              ? "hsl(var(--brand-violet) / 0.18)"
                              : "hsl(var(--info) / 0.18)",
                            color: p.platforms.includes("ig")
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
            Instagram
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
            Click en día → ver detalle · Botón nuevo post → composer
          </span>
        </div>
      </TextureCard>

      {/* Empty state cuando no hay posts */}
      {hydrated && posts.length === 0 && (
        <TextureCard className="p-8 text-center border-dashed">
          <div className="size-12 rounded-2xl bg-[hsl(var(--brand-cyan)/0.12)] mx-auto mb-3 grid place-items-center border border-[hsl(var(--brand-cyan)/0.3)]">
            <Calendar className="size-5 text-[hsl(var(--brand-cyan))]" />
          </div>
          <div className="text-[13px] font-semibold mb-1">Sin posts programados todavía</div>
          <div className="text-[11px] text-muted-foreground max-w-md mx-auto mb-3">
            Empieza a planear tu mes editorial. Usa una plantilla para arrancar más rápido.
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

      {/* Composer drawer */}
      <Drawer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-3.5 text-[hsl(var(--brand-violet))]" /> Nuevo post
          </span>
        }
        subtitle={composerDate ? `Programar para ${composerDate}` : undefined}
        width={460}
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
                  variant={pl === "ig" ? "violet" : "info"}
                  className="!text-[9px]"
                >
                  {pl === "ig" ? (
                    <Instagram className="size-2.5 mr-0.5" />
                  ) : (
                    <Facebook className="size-2.5 mr-0.5" />
                  )}
                  {pl === "ig" ? "IG" : "FB"}
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
              Creado {new Date(p.createdAt).toLocaleDateString("es-ES")}
            </div>
          </motion.div>
        ))}
      </div>
    </Drawer>
  );
}

function Composer({
  date,
  onClose,
  onAdd,
}: {
  date: string;
  onClose: () => void;
  onAdd: (p: Omit<ScheduledPost, "id" | "createdAt">) => void;
}) {
  const [imgUrl, setImgUrl] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [platforms, setPlatforms] = React.useState<("ig" | "fb")[]>(["ig"]);
  const [publishing, setPublishing] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [dateValue, setDateValue] = React.useState(date);

  function toggle(p: "ig" | "fb") {
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

  const captionLen = caption.trim().length;
  const captionTooShort = captionLen > 0 && captionLen < 10;
  const captionEmpty = captionLen === 0;
  const noPlatform = platforms.length === 0;
  const igLimit = 2200;
  const overLimit = caption.length > igLimit;

  async function publishNow() {
    if (captionEmpty) {
      toast.error("Caption vacío", {
        description: "Escribe al menos 10 caracteres.",
      });
      return;
    }
    if (captionTooShort) {
      toast.error("Caption demasiado corto", {
        description: "Mínimo 10 caracteres.",
      });
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
      });
    } finally {
      setPublishing(false);
    }
  }

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
            >
              <div className="text-[12px] font-semibold flex items-center gap-1.5 mb-1">
                <span>{t.emoji}</span> {t.label}
              </div>
              <div className="text-[9px] text-muted-foreground leading-snug">
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
        <div className="flex gap-2">
          {(["ig", "fb"] as const).map((p) => (
            <button
              key={p}
              onClick={() => toggle(p)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-full border transition-colors",
                platforms.includes(p)
                  ? p === "ig"
                    ? "bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet)/0.4)]"
                    : "bg-[hsl(var(--info)/0.18)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.4)]"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "ig" ? <Instagram className="size-3" /> : <Facebook className="size-3" />}
              {p === "ig" ? "Instagram" : "Facebook"}
            </button>
          ))}
        </div>
      </div>

      {/* Fecha */}
      <div>
        <Label className="mb-1.5 block">Fecha de publicación</Label>
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
        />
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
            {caption.length}/{igLimit}
          </span>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escribe el copy del post o usa una plantilla arriba…"
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

      {/* Preview */}
      {(caption.trim() || imgUrl.trim()) && (
        <div>
          <Label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
            Vista previa
          </Label>
          <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
              <div className="size-6 rounded-full bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]" />
              <div className="text-[11px] font-semibold">@bewe</div>
              <div className="ml-auto flex gap-1">
                {platforms.map((p) => (
                  <Badge key={p} variant={p === "ig" ? "violet" : "info"} className="!text-[8px]">
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
        </div>
      )}

      <div className="flex gap-2 pt-2">
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

