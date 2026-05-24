"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Instagram,
  Facebook,
  Heart,
  MessageCircle,
  Loader2,
  Download,
  RefreshCcw,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { useOrganic, type IGMedia, type FBPost } from "@/lib/hooks/use-organic";
import { cn } from "@/lib/utils";

interface RefItem {
  id: string;
  platform: "IG" | "FB";
  thumb: string | null;
  caption: string;
  likes: number;
  comments: number;
  date: string; // ISO
  permalink?: string;
}

interface Props {
  /** Callback cuando el user clickea un post · debe agregar al brief. */
  onUseReference: (snippet: string) => void;
}

/**
 * Panel de Inspiración · carga últimos posts orgánicos IG + FB y los muestra
 * como grid clickable. Click → agrega snippet al brief input.
 *
 * No carga datos automáticamente — hay que pulsar el botón. Esto evita
 * rate-limits si el user no abre el panel.
 */
export function ReferencesPanel({ onUseReference }: Props) {
  const [enabled, setEnabled] = React.useState(false);
  const { ig, fb, loading, error, refresh } = useOrganic({ enabled, limit: 12 });

  const items = React.useMemo<RefItem[]>(() => {
    const igItems: RefItem[] = (ig.posts ?? []).map((p) => mapIG(p));
    const fbItems: RefItem[] = (fb.posts ?? []).map((p) => mapFB(p));
    return [...igItems, ...fbItems]
      .filter((it) => it.thumb) // sin thumb no aporta
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 12);
  }, [ig.posts, fb.posts]);

  function handleClick(it: RefItem) {
    const dt = it.date ? new Date(it.date).toLocaleDateString("es-CO") : "reciente";
    const shortCap = (it.caption || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const snippet = `\n\nInspirado en mi post del ${dt} (${it.platform})${shortCap ? `: ${shortCap}` : ""} · mantener el mismo estilo visual y tono.`;
    onUseReference(snippet);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl border border-border bg-card/40 p-4"
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-7 grid place-items-center rounded-md bg-[hsl(var(--brand-cyan)/0.15)] border border-[hsl(var(--brand-cyan)/0.4)]">
            <Lightbulb className="size-3.5 text-[hsl(var(--brand-cyan))]" />
          </div>
          <div>
            <div className="text-[12px] font-bold leading-tight">
              Inspiración · tus posts recientes
            </div>
            <div className="text-[10px] text-muted-foreground/80 leading-tight">
              Click en un post para usarlo como referencia en el brief
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enabled && (
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
              title="Recargar posts"
            >
              <RefreshCcw
                className={cn("size-3", loading && "animate-spin")}
              />
              Recargar
            </button>
          )}
          {!enabled && (
            <button
              type="button"
              onClick={() => setEnabled(true)}
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md bg-[hsl(var(--brand-cyan))] text-white hover:brightness-110 font-semibold transition-all"
            >
              <Download className="size-3" /> Cargar mis posts recientes
            </button>
          )}
        </div>
      </div>

      {/* Estados */}
      {!enabled && <EmptyState />}
      {enabled && loading && items.length === 0 && <LoadingGrid />}
      {enabled && !loading && error && <ErrorBox msg={error} />}
      {enabled && !loading && !error && items.length === 0 && <NoPostsFound />}

      {/* Grid */}
      {enabled && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <AnimatePresence>
            {items.map((it, i) => (
              <ReferenceCard
                key={`${it.platform}-${it.id}`}
                item={it}
                onClick={() => handleClick(it)}
                delay={i * 0.04}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}

function ReferenceCard({
  item,
  onClick,
  delay,
}: {
  item: RefItem;
  onClick: () => void;
  delay: number;
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "group relative aspect-square rounded-lg overflow-hidden border bg-card/40 text-left transition-all",
        "hover:border-[hsl(var(--brand-violet))] hover:shadow-[0_0_0_1px_hsl(var(--brand-violet)/0.4)]",
        "border-border",
      )}
      title={`Usar como referencia · ${item.platform}`}
    >
      {item.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumb}
          alt={item.caption.slice(0, 40) || "post"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-secondary/40">
          <span className="text-[9px] text-muted-foreground">sin imagen</span>
        </div>
      )}

      {/* Overlay gradient bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

      {/* Platform badge */}
      <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-[9px] font-bold text-white">
        {item.platform === "IG" ? (
          <Instagram className="size-2.5" />
        ) : (
          <Facebook className="size-2.5" />
        )}
        {item.platform}
      </div>

      {/* Likes + comments */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-2 text-[9px] font-mono text-white">
        <span className="inline-flex items-center gap-0.5">
          <Heart className="size-2.5" />
          {fmtCount(item.likes)}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MessageCircle className="size-2.5" />
          {fmtCount(item.comments)}
        </span>
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 grid place-items-center bg-[hsl(var(--brand-violet)/0.75)] backdrop-blur-sm"
          >
            <div className="text-center px-2">
              <Sparkles className="size-4 text-white mx-auto mb-1" />
              <div className="text-[10px] font-bold text-white leading-tight">
                Usar como
                <br />
                referencia
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ---------- States ---------- */

function EmptyState() {
  return (
    <div className="grid place-items-center py-8 px-4 text-center">
      <div className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-md">
        Aún no has cargado tus posts orgánicos. Cárgalos para usarlos como
        inspiración visual y guiar el estilo del AI.
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-secondary/40 animate-pulse"
        />
      ))}
    </div>
  );
}

function NoPostsFound() {
  return (
    <div className="grid place-items-center py-6 px-4 text-center">
      <div className="text-[11px] text-muted-foreground">
        No encontramos posts recientes. Revisa el token de Meta en{" "}
        <span className="font-mono text-foreground">Config</span>.
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--destructive)/0.35)] bg-[hsl(var(--destructive)/0.08)] px-3 py-2 text-[11px] text-muted-foreground">
      <div className="flex items-start gap-2">
        <Loader2 className="size-3 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">
            No se pudieron cargar posts
          </div>
          <div className="leading-snug">{msg}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- mappers ---------- */

function mapIG(p: IGMedia): RefItem {
  return {
    id: p.id,
    platform: "IG",
    thumb: p.thumbnail_url || p.media_url || null,
    caption: p.caption || "",
    likes: p.like_count ?? 0,
    comments: p.comments_count ?? 0,
    date: p.timestamp || "",
    permalink: p.permalink,
  };
}

function mapFB(p: FBPost): RefItem {
  return {
    id: p.id,
    platform: "FB",
    thumb: p.full_picture || null,
    caption: p.message || "",
    likes: p.reactions?.summary?.total_count ?? 0,
    comments: p.comments?.summary?.total_count ?? 0,
    date: p.created_time || "",
    permalink: p.permalink_url,
  };
}

function fmtCount(n: number): string {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
