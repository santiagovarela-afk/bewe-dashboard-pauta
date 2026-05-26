"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Instagram,
  Facebook,
  Heart,
  MessageCircle,
  TrendingUp,
  Eye,
  Bookmark,
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  ImageOff,
  CheckCircle2,
  ArrowRight,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, fmt } from "@/lib/utils";
import {
  type AnalyticsPost,
  bestHourOfDay,
  performanceByFormat,
} from "@/lib/organic-analytics";

export interface WhyItWorkedModalProps {
  open: boolean;
  onClose: () => void;
  /** Post seleccionado · null oculta el modal */
  post: AnalyticsPost | null;
  /** Universo de posts del período · necesario para contextualizar el análisis */
  allPosts: AnalyticsPost[];
  /** Engagement promedio del período (para comparativas) */
  avgEngagement: number;
  /**
   * Callback "Crear nuevo post similar" → cierra el modal y delega a un
   * composer (parrilla) con preset. Si no se pasa, oculta el botón.
   */
  onCreateSimilar?: (post: AnalyticsPost) => void;
}

// ─── Helpers de análisis cualitativo ─────────────────────────────────────

interface AnalysisInsight {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: "success" | "info" | "violet" | "ember";
}

interface Recommendation {
  icon: React.ReactNode;
  text: string;
}

function extractKeywords(caption?: string): string[] {
  if (!caption) return [];
  const stop = new Set([
    "the","and","a","an","de","la","los","las","el","en","y","o","con","para","por","un","una","unos","unas","como","es","que","del","al","se","tu","tus","mi","mis","sus","te","le","lo","ya","más","muy","sin","sí","no","si","this","that","is","of","to","for","with","on","in","at","be","but","or",
  ]);
  const tags = caption.match(/#[A-Za-zÀ-ÿ0-9_]+/g) ?? [];
  if (tags.length) return tags.slice(0, 6);
  const words = caption
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !stop.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

function buildAnalysis(
  post: AnalyticsPost,
  allPosts: AnalyticsPost[],
  avgEngagement: number,
): AnalysisInsight[] {
  const insights: AnalysisInsight[] = [];
  const eng = post.likes + post.comments;

  // 1 · engagement vs media
  if (avgEngagement > 0 && eng > avgEngagement * 1.2) {
    const ratio = (eng / avgEngagement).toFixed(1);
    insights.push({
      icon: <TrendingUp className="size-3.5" />,
      title: `Engagement ${ratio}× sobre la media de la cuenta`,
      detail: `Este post generó ${eng} interacciones vs ${avgEngagement.toFixed(0)} promedio del período. Está claramente por encima del benchmark.`,
      tone: "success",
    });
  }

  // 2 · hora de publicación vs hora pico de la audiencia
  if (post.date) {
    const d = new Date(post.date);
    const hr = d.getHours();
    const bestHr = bestHourOfDay(allPosts);
    if (bestHr) {
      const delta = Math.abs(bestHr.hour - hr);
      if (delta <= 1) {
        insights.push({
          icon: <Clock className="size-3.5" />,
          title: `Publicado en hora pico · ${String(hr).padStart(2, "0")}:00`,
          detail: `La audiencia responde mejor entre ${bestHr.label} según el histórico. Este post cayó dentro de esa ventana.`,
          tone: "info",
        });
      } else {
        insights.push({
          icon: <Clock className="size-3.5" />,
          title: `Publicado ${String(hr).padStart(2, "0")}:00 · pico real ${bestHr.label}`,
          detail: `Funcionó aún publicando fuera de la franja óptima · hipótesis: el hook del contenido pesó más que el horario.`,
          tone: "violet",
        });
      }
    }
  }

  // 3 · formato vs lo mejor del mes
  const t = (post.type ?? "").toUpperCase();
  const formats = performanceByFormat(allPosts);
  const topFormat = formats[0];
  const isReel = t === "VIDEO" || post.media_product_type === "REELS";
  const isCarousel = t === "CAROUSEL_ALBUM";
  const formatLabel = isReel
    ? "Reel / Video"
    : isCarousel
      ? "Carrusel"
      : t === "IMAGE"
        ? "Imagen"
        : "Otro";
  if (topFormat) {
    const isTopFormat =
      (topFormat.format === "VIDEO" && isReel) ||
      (topFormat.format === "CAROUSEL_ALBUM" && isCarousel) ||
      (topFormat.format === "IMAGE" && t === "IMAGE");
    if (isTopFormat) {
      insights.push({
        icon: <Sparkles className="size-3.5" />,
        title: `Formato ${formatLabel} · líder del período`,
        detail: `${topFormat.label} fue el formato top con ${topFormat.avgEngagement.toFixed(1)} eng/post de media. Replicar este patrón está validado por los datos.`,
        tone: "ember",
      });
    } else {
      insights.push({
        icon: <Sparkles className="size-3.5" />,
        title: `Formato ${formatLabel} · destacó pese a no ser el formato top`,
        detail: `${topFormat.label} lidera el período (${topFormat.avgEngagement.toFixed(1)} eng/post). Este post ganó por contenido específico, no por formato.`,
        tone: "violet",
      });
    }
  }

  // 4 · conversación vs likes
  if (post.comments >= 5) {
    const ratio = post.likes > 0 ? (post.comments / post.likes) * 100 : 0;
    insights.push({
      icon: <MessageCircle className="size-3.5" />,
      title: `Conversación activa · ${post.comments} comentarios`,
      detail:
        ratio > 5
          ? `Ratio comentarios/likes = ${ratio.toFixed(1)}%. El algoritmo prioriza este tipo de contenido conversacional sobre likes pasivos.`
          : `El comentario pesa más que el like para el algoritmo de IG/FB. Considerá usar CTAs explícitas en próximos posts.`,
      tone: "success",
    });
  }

  // 5 · keywords/tópico identificable
  const keywords = extractKeywords(post.text);
  if (keywords.length > 0) {
    insights.push({
      icon: <Hash className="size-3.5" />,
      title: `Tópico claro · ${keywords.slice(0, 3).join(" · ")}`,
      detail: `Caption con keywords concretas ayuda a la audiencia a entender el ángulo en el primer scroll. Usalo para definir series temáticas.`,
      tone: "info",
    });
  }

  return insights;
}

function buildRecommendations(
  post: AnalyticsPost,
  allPosts: AnalyticsPost[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const t = (post.type ?? "").toUpperCase();
  const isReel = t === "VIDEO" || post.media_product_type === "REELS";
  const isCarousel = t === "CAROUSEL_ALBUM";

  if (isReel) {
    recs.push({
      icon: <ArrowRight className="size-3.5" />,
      text: "Replicar el formato Reel en próximas publicaciones · empuja alcance",
    });
  } else if (isCarousel) {
    recs.push({
      icon: <ArrowRight className="size-3.5" />,
      text: "Convertir este tema en carrusel-serie de 3-5 posts · save rate alto",
    });
  } else {
    recs.push({
      icon: <ArrowRight className="size-3.5" />,
      text: "Probar el mismo ángulo en Reel · mismo mensaje + formato más viral",
    });
  }

  if (post.date) {
    const d = new Date(post.date);
    const hr = d.getHours();
    const wd = d.toLocaleDateString("es-ES", { weekday: "long" });
    recs.push({
      icon: <Clock className="size-3.5" />,
      text: `Mantener slot ${wd} ${String(hr).padStart(2, "0")}:00 — confirmado por la data`,
    });
  }

  const keywords = extractKeywords(post.text);
  if (keywords.length > 0) {
    recs.push({
      icon: <Hash className="size-3.5" />,
      text: `Profundizar el tópico "${keywords[0]}" en una serie de 3 posts próximas semanas`,
    });
  }

  if (post.comments >= 5) {
    recs.push({
      icon: <MessageCircle className="size-3.5" />,
      text: "Replicar la CTA conversacional · pregunta directa al final del caption",
    });
  } else {
    recs.push({
      icon: <MessageCircle className="size-3.5" />,
      text: "Añadir pregunta explícita al cierre para activar comentarios",
    });
  }

  // dedupe by text
  const seen = new Set<string>();
  return recs.filter((r) => {
    if (seen.has(r.text)) return false;
    seen.add(r.text);
    return true;
  }).slice(0, 4);
}

const TONE_COLOR: Record<AnalysisInsight["tone"], string> = {
  success: "var(--brand-lime)",
  info: "var(--brand-cyan)",
  violet: "var(--brand-violet)",
  ember: "var(--brand-ember)",
};

export function WhyItWorkedModal({
  open,
  onClose,
  post,
  allPosts,
  avgEngagement,
  onCreateSimilar,
}: WhyItWorkedModalProps) {
  // Lock body scroll + Esc
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const analysis = React.useMemo(
    () => (post ? buildAnalysis(post, allPosts, avgEngagement) : []),
    [post, allPosts, avgEngagement],
  );
  const recommendations = React.useMemo(
    () => (post ? buildRecommendations(post, allPosts) : []),
    [post, allPosts],
  );

  if (!post) {
    return null;
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
  const engagementRate =
    post.video_views && post.video_views > 0
      ? (engagement / post.video_views) * 100
      : null;

  // Bloquear scroll del body cuando el modal está abierto · escape para cerrar.
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Renderizar via portal a document.body para evitar problemas de
  // posicionamiento por containers con transform/filter que rompen `fixed`.
  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  if (!portalRoot) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center p-4 md:p-8"
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[920px] max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header sticky */}
            <header className="flex items-start justify-between gap-3 p-5 border-b border-border/60 shrink-0 bg-card/95 backdrop-blur">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "size-9 grid place-items-center rounded-lg shrink-0",
                    post.source === "ig"
                      ? "bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))]"
                      : "bg-[hsl(var(--info)/0.14)] text-[hsl(var(--info))]",
                  )}
                >
                  {post.source === "ig" ? (
                    <Instagram className="size-4" />
                  ) : (
                    <Facebook className="size-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold leading-tight">
                    Por qué funcionó este post
                  </h2>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {post.source === "ig" ? "Instagram" : "Facebook"} ·{" "}
                    {dateLong}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-8 shrink-0 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Cerrar"
              >
                <X className="size-3.5" />
              </button>
            </header>

            {/* Scroll body */}
            <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
              {/* Cabecera: thumbnail + caption + plataforma */}
              <div className="grid md:grid-cols-[260px_1fr] gap-4">
                <div className="rounded-xl overflow-hidden border border-border bg-secondary/60 aspect-square relative">
                  {post.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.thumb}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                      <ImageOff className="size-10" />
                    </div>
                  )}
                  {post.type && (
                    <Badge
                      variant={
                        post.type === "VIDEO"
                          ? "violet"
                          : post.type === "CAROUSEL_ALBUM"
                            ? "ember"
                            : "info"
                      }
                      className="absolute top-2 left-2 !text-[10px]"
                    >
                      {post.type}
                    </Badge>
                  )}
                </div>
                <div className="min-w-0 flex flex-col">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Calendar className="size-3" /> Caption completa
                  </div>
                  <div className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap mb-3 max-h-[180px] overflow-y-auto pr-1">
                    {post.text ?? (
                      <span className="text-muted-foreground italic">
                        Sin texto
                      </span>
                    )}
                  </div>

                  {/* Métricas grid */}
                  <div className="grid grid-cols-3 gap-2 mt-auto">
                    <MetricCell
                      icon={<Heart className="size-3" />}
                      label="Likes"
                      value={fmt.int(post.likes)}
                      tone="ember"
                    />
                    <MetricCell
                      icon={<MessageCircle className="size-3" />}
                      label="Comments"
                      value={fmt.int(post.comments)}
                      tone="cyan"
                    />
                    <MetricCell
                      icon={<TrendingUp className="size-3" />}
                      label="Total eng."
                      value={fmt.int(engagement)}
                      tone="lime"
                    />
                    <MetricCell
                      icon={<Eye className="size-3" />}
                      label="Reach / Views"
                      value={
                        post.video_views
                          ? fmt.short(post.video_views)
                          : "—"
                      }
                      tone="violet"
                    />
                    <MetricCell
                      icon={<Sparkles className="size-3" />}
                      label="Eng. rate"
                      value={
                        engagementRate !== null
                          ? `${engagementRate.toFixed(2)}%`
                          : "—"
                      }
                      tone="lime"
                    />
                    <MetricCell
                      icon={<Bookmark className="size-3" />}
                      label="Saves+Shares"
                      value="Sin info"
                      tone="default"
                    />
                  </div>
                </div>
              </div>

              {/* Análisis "Por qué funcionó" */}
              <section>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-[hsl(var(--brand-lime))]" />
                  Por qué funcionó · análisis
                </div>
                {analysis.length === 0 ? (
                  <div className="text-[12px] text-muted-foreground italic p-3 rounded-lg border border-dashed border-border/60">
                    No hay señales destacadas para este post · resultado sólido
                    para la media del período.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {analysis.map((a, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-lg border bg-card/60 p-3"
                        style={{
                          borderColor: `hsl(${TONE_COLOR[a.tone]} / 0.35)`,
                        }}
                      >
                        <div
                          className="flex items-center gap-1.5 text-[11px] font-bold mb-1"
                          style={{ color: `hsl(${TONE_COLOR[a.tone]})` }}
                        >
                          {a.icon}
                          {a.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {a.detail}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recomendaciones · Pasos para repetir el éxito */}
              <section>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <ArrowRight className="size-3 text-[hsl(var(--brand-violet))]" />
                  Pasos para repetir el éxito
                </div>
                <ol className="space-y-1.5">
                  {recommendations.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-card/50 p-2.5"
                    >
                      <div className="size-6 rounded-md grid place-items-center bg-[hsl(var(--brand-violet)/0.12)] text-[hsl(var(--brand-violet))] shrink-0 text-[10px] font-mono font-bold">
                        {i + 1}
                      </div>
                      <div className="text-[11px] text-foreground leading-relaxed flex items-start gap-1.5 min-w-0">
                        <span className="text-[hsl(var(--brand-violet))] mt-0.5 shrink-0">
                          {r.icon}
                        </span>
                        <span className="min-w-0">{r.text}</span>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </section>
            </div>

            {/* Footer sticky · CTAs */}
            <footer className="shrink-0 p-4 border-t border-border/60 bg-card/95 backdrop-blur flex flex-wrap items-center gap-2 justify-end">
              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="size-3.5" /> Abrir en{" "}
                    {post.source === "ig" ? "Instagram" : "Facebook"}
                  </Button>
                </a>
              )}
              {onCreateSimilar && (
                <Button
                  variant="glow"
                  size="sm"
                  onClick={() => {
                    onCreateSimilar(post);
                    onClose();
                  }}
                >
                  <Sparkles className="size-3.5" /> Crear nuevo post similar
                </Button>
              )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, portalRoot);
}

// ─── Sub-components ──────────────────────────────────────────────────────

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
    <div className="rounded-md border border-border/60 bg-card/60 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80 font-bold flex items-center gap-1">
        {icon} {label}
      </div>
      <div
        className={cn(
          "font-mono font-bold text-[14px] mt-0.5 truncate",
          toneColor[tone],
        )}
      >
        {value}
      </div>
    </div>
  );
}

