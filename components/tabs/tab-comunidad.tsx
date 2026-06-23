"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  MessageCircle,
  Instagram,
  Facebook,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Send,
  ExternalLink,
  Search,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Check,
  Tag,
  Clock,
  Inbox,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextureCard } from "@/components/fx/texture-card";
import { SectionHeader } from "@/components/shared/section-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { cn } from "@/lib/utils";
import {
  FUNNEL_TAGS,
  getTagDef,
  loadTags,
  saveTag,
  loadStatuses,
  saveStatus,
  loadTemplates,
  saveTemplates,
  incrementTemplateUse,
  applyTemplateVars,
  type FunnelTag,
  type Template,
} from "@/lib/comunidad-tags";
import { useDashboard } from "@/lib/store";
import { toast } from "sonner";
import { ComunidadTour } from "@/components/comunidad/comunidad-tour";

// ─── TIPOS LOCALES ─────────────────────────────────────────────────────────

interface IGPost {
  id: string;
  caption?: string;
  media_type: string;
  permalink?: string;
  timestamp: string;
  comments_count: number;
  like_count: number;
  thumbnail_url?: string;
  media_url?: string;
}
interface FBPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  comments_count: number;
  full_picture?: string;
}
interface Comment {
  id: string;
  text: string;
  username?: string;
  from?: { name?: string; id?: string };
  timestamp?: string;
  created_time?: string;
  platform: "ig" | "fb";
  post_id: string;
  post_caption?: string;
  post_permalink?: string;
}
interface Conversation {
  id: string;
  updated_time: string;
  message_count: number;
  unread_count: number;
  participants?: { data: Array<{ id: string; name?: string }> };
  snippet?: string;
}
interface MessengerMsg {
  id: string;
  message?: string;
  from?: { id: string; name?: string };
  created_time: string;
}

type SubTab = "resumen" | "comentarios" | "mensajes" | "plantillas";

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────

export function TabComunidad() {
  const { user } = useDashboard();
  const [sub, setSub] = React.useState<SubTab>("resumen");
  const [showTour, setShowTour] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("bewe_comunidad_tour_seen");
    if (!seen) setShowTour(true);
  }, []);

  const closeTour = () => {
    localStorage.setItem("bewe_comunidad_tour_seen", "1");
    setShowTour(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Comunidad"
        sub="Conversaciones, comentarios y mensajes de Bewe en redes sociales"
        accent="violet"
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTour(true)}
            className="gap-1.5"
          >
            <HelpCircle className="size-4" /> Ver tour
          </Button>
        }
      />

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-2">
        {(
          [
            { id: "resumen", label: "Resumen", icon: Inbox },
            { id: "comentarios", label: "Comentarios", icon: MessageSquare },
            { id: "mensajes", label: "Messenger", icon: Send },
            { id: "plantillas", label: "Plantillas", icon: Sparkles },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            id={`comunidad-subtab-${id}`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              sub === id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}

        <div className="ml-auto text-[10px] text-muted-foreground/70">
          Usuario: <span className="font-medium text-foreground/80">{user?.name}</span>
          {" · "}rol <span className="font-mono">{user?.role}</span>
        </div>
      </div>

      <motion.div
        key={sub}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {sub === "resumen" && <Resumen onJump={setSub} />}
        {sub === "comentarios" && <Comentarios />}
        {sub === "mensajes" && <Mensajes />}
        {sub === "plantillas" && <PlantillasView />}
      </motion.div>

      {showTour && <ComunidadTour onClose={closeTour} userName={user?.name ?? "amigo"} />}
    </div>
  );
}

// ─── RESUMEN ───────────────────────────────────────────────────────────────

function Resumen({ onJump }: { onJump: (s: SubTab) => void }) {
  const [igPosts, setIGPosts] = React.useState<IGPost[]>([]);
  const [fbPosts, setFBPosts] = React.useState<FBPost[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ig, fb, msg] = await Promise.all([
        fetch("/api/comunidad/ig-posts?limit=15").then((r) => r.json()),
        fetch("/api/comunidad/fb-posts?limit=15").then((r) => r.json()),
        fetch("/api/comunidad/messenger?limit=15").then((r) => r.json()),
      ]);
      if (ig.ok) setIGPosts(ig.posts ?? []);
      if (fb.ok) setFBPosts(fb.posts ?? []);
      if (msg.ok) setConversations(msg.conversations ?? []);
    } catch (e) {
      toast.error("Error cargando resumen");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const igComments = igPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0);
  const fbComments = fbPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0);
  const unread = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0);
  const activeConvs = conversations.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="ml-1.5">Actualizar</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Comentarios IG"
          value={loading ? 0 : igComments}
          sub={`${igPosts.length} posts recientes`}
          tone="ember"
        />
        <KpiCard
          label="Comentarios FB"
          value={loading ? 0 : fbComments}
          sub={`${fbPosts.length} posts recientes`}
          tone="info"
        />
        <KpiCard
          label="Conversaciones Messenger"
          value={loading ? 0 : activeConvs}
          sub={unread > 0 ? `${unread} sin leer` : "Sin pendientes"}
          tone={unread > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Total interacciones"
          value={loading ? 0 : igComments + fbComments + activeConvs}
          sub="Últimos posts + conversaciones"
          tone="violet"
        />
      </div>

      <TextureCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="size-4" /> Actividad reciente
          </h3>
          <Button variant="ghost" size="sm" onClick={() => onJump("mensajes")}>
            Ver Messenger →
          </Button>
        </div>
        {loading ? (
          <Skeleton className="h-24" />
        ) : conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin conversaciones recientes.</p>
        ) : (
          <ul className="space-y-2">
            {conversations.slice(0, 5).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-md border border-border/40 bg-card/40 px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {c.participants?.data?.[0]?.name ?? "Usuario sin nombre"}
                  </p>
                  <p className="text-muted-foreground truncate">
                    {c.snippet ?? `${c.message_count} mensaje(s)`}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{relativeTime(c.updated_time)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TextureCard>

      <div className="grid gap-3 md:grid-cols-2">
        <TextureCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Instagram className="size-4" /> Posts IG con más comentarios
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onJump("comentarios")}>
              Ver todos →
            </Button>
          </div>
          {loading ? (
            <Skeleton className="h-32" />
          ) : (
            <ul className="space-y-2">
              {[...igPosts]
                .sort((a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0))
                .slice(0, 4)
                .map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-md border border-border/40 bg-card/40 px-3 py-2 text-xs"
                  >
                    <div className="size-10 shrink-0 overflow-hidden rounded bg-muted/40">
                      {p.thumbnail_url || p.media_url ? (
                        <img
                          src={p.thumbnail_url || p.media_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{p.caption ?? "Sin caption"}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {relativeTime(p.timestamp)} · {p.comments_count} comments · {p.like_count} likes
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </TextureCard>

        <TextureCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Facebook className="size-4" /> Posts FB con más comentarios
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onJump("comentarios")}>
              Ver todos →
            </Button>
          </div>
          {loading ? (
            <Skeleton className="h-32" />
          ) : (
            <ul className="space-y-2">
              {[...fbPosts]
                .sort((a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0))
                .slice(0, 4)
                .map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-md border border-border/40 bg-card/40 px-3 py-2 text-xs"
                  >
                    <div className="size-10 shrink-0 overflow-hidden rounded bg-muted/40">
                      {p.full_picture ? (
                        <img src={p.full_picture} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{p.message ?? "Sin texto"}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {relativeTime(p.created_time)} · {p.comments_count} comments
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </TextureCard>
      </div>
    </div>
  );
}

// ─── COMENTARIOS ───────────────────────────────────────────────────────────

function Comentarios() {
  const [platform, setPlatform] = React.useState<"all" | "ig" | "fb">("all");
  const [igPosts, setIGPosts] = React.useState<IGPost[]>([]);
  const [fbPosts, setFBPosts] = React.useState<FBPost[]>([]);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Comment | null>(null);
  const [search, setSearch] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<FunnelTag | "all">("all");
  const [tagsMap, setTagsMap] = React.useState<Record<string, FunnelTag>>({});

  React.useEffect(() => {
    setTagsMap(loadTags());
  }, []);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Trae los posts (para tener captions + IDs)
      const [igRes, fbRes] = await Promise.all([
        fetch("/api/comunidad/ig-posts?limit=15").then((r) => r.json()),
        fetch("/api/comunidad/fb-posts?limit=15").then((r) => r.json()),
      ]);
      const igP: IGPost[] = igRes.ok ? igRes.posts ?? [] : [];
      const fbP: FBPost[] = fbRes.ok ? fbRes.posts ?? [] : [];
      setIGPosts(igP);
      setFBPosts(fbP);

      // 2. Trae comentarios de los posts que tengan comentarios
      const igWith = igP.filter((p) => (p.comments_count ?? 0) > 0).slice(0, 10);
      const fbWith = fbP.filter((p) => (p.comments_count ?? 0) > 0).slice(0, 10);

      const igCommentsRes = await Promise.all(
        igWith.map((p) =>
          fetch(`/api/comunidad/ig-comments?mediaId=${p.id}`)
            .then((r) => r.json())
            .then((d) => (d.ok ? d.comments : []) as Comment[])
            .catch(() => []),
        ),
      );
      const fbCommentsRes = await Promise.all(
        fbWith.map((p) =>
          fetch(`/api/comunidad/fb-comments?postId=${p.id}`)
            .then((r) => r.json())
            .then((d) => (d.ok ? d.comments : []) as Comment[])
            .catch(() => []),
        ),
      );

      // Inyectar caption del post a cada comment (ya lo hace el backend pero por si acaso)
      const allComments: Comment[] = [
        ...igCommentsRes.flatMap((cs, i) =>
          cs.map((c) => ({ ...c, post_caption: igWith[i].caption, post_permalink: igWith[i].permalink })),
        ),
        ...fbCommentsRes.flatMap((cs, i) =>
          cs.map((c) => ({
            ...c,
            post_caption: fbWith[i].message,
            post_permalink: fbWith[i].permalink_url,
          })),
        ),
      ];

      // Ordenar por fecha desc
      allComments.sort((a, b) => {
        const ta = new Date(a.timestamp ?? a.created_time ?? 0).getTime();
        const tb = new Date(b.timestamp ?? b.created_time ?? 0).getTime();
        return tb - ta;
      });
      setComments(allComments);
    } catch (e) {
      toast.error("Error cargando comentarios");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = comments.filter((c) => {
    if (platform !== "all" && c.platform !== platform) return false;
    if (search && !c.text.toLowerCase().includes(search.toLowerCase())) return false;
    if (tagFilter !== "all") {
      const tag = tagsMap[c.id] ?? "nuevo";
      if (tag !== tagFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={platform} onValueChange={(v) => setPlatform(v as "all" | "ig" | "fb")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="ig">Instagram</SelectItem>
            <SelectItem value="fb">Facebook</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={(v) => setTagFilter(v as FunnelTag | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Etiqueta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etiquetas</SelectItem>
            {FUNNEL_TAGS.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.icon} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="ml-1.5">Actualizar</span>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Lista */}
        <TextureCard className="p-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No hay comentarios para mostrar con los filtros actuales.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  tag={tagsMap[c.id]}
                  selected={selected?.id === c.id}
                  onClick={() => setSelected(c)}
                />
              ))}
            </ul>
          )}
        </TextureCard>

        {/* Detalle + Reply */}
        <div className="space-y-3">
          {selected ? (
            <CommentDetail
              comment={selected}
              tag={tagsMap[selected.id] ?? "nuevo"}
              onTagChange={(tag) => {
                saveTag(selected.id, tag);
                setTagsMap({ ...tagsMap, [selected.id]: tag });
              }}
            />
          ) : (
            <TextureCard className="p-6 text-center text-sm text-muted-foreground">
              Selecciona un comentario para verlo y responder.
            </TextureCard>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  tag,
  selected,
  onClick,
}: {
  comment: Comment;
  tag?: FunnelTag;
  selected?: boolean;
  onClick: () => void;
}) {
  const author =
    comment.username ?? comment.from?.name ?? "Usuario sin nombre";
  const time = comment.timestamp ?? comment.created_time ?? "";
  const tagDef = tag ? getTagDef(tag) : null;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "block w-full rounded-md border bg-card/40 px-3 py-2 text-left text-xs transition-colors",
          selected
            ? "border-primary/50 bg-primary/5"
            : "border-border/40 hover:bg-card/60",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {comment.platform === "ig" ? (
              <Instagram className="size-3 text-pink-400" />
            ) : (
              <Facebook className="size-3 text-blue-400" />
            )}
            <span className="font-medium">{author}</span>
            {tagDef && (
              <Badge variant="outline" className={cn("text-[9px] px-1.5", tagDef.bg)}>
                {tagDef.icon} {tagDef.label}
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{relativeTime(time)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-foreground/90">{comment.text}</p>
        {comment.post_caption && (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            En: {comment.post_caption.slice(0, 70)}…
          </p>
        )}
      </button>
    </li>
  );
}

function CommentDetail({
  comment,
  tag,
  onTagChange,
}: {
  comment: Comment;
  tag: FunnelTag;
  onTagChange: (t: FunnelTag) => void;
}) {
  const tagDef = getTagDef(tag);

  return (
    <TextureCard className="p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs">
          {comment.platform === "ig" ? (
            <Instagram className="size-4 text-pink-400" />
          ) : (
            <Facebook className="size-4 text-blue-400" />
          )}
          <span className="font-medium">
            {comment.username ?? comment.from?.name ?? "Anónimo"}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{relativeTime(comment.timestamp ?? comment.created_time ?? "")}</span>
          {comment.post_permalink && (
            <a
              href={comment.post_permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" /> Ver post
            </a>
          )}
        </div>
        <p className="mt-2 rounded-md bg-muted/30 p-3 text-sm">{comment.text}</p>
        {comment.post_caption && (
          <p className="mt-2 text-[11px] italic text-muted-foreground">
            Sobre: “{comment.post_caption.slice(0, 100)}…”
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Etiqueta del funnel
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FUNNEL_TAGS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTagChange(t.id)}
              className={cn(
                "rounded border px-2 py-1 text-[10px] transition-colors",
                tag === t.id
                  ? `${t.bg} ${t.color}`
                  : "border-border/40 text-muted-foreground hover:bg-muted/30",
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <ReplyBox
        platform={comment.platform}
        author={comment.username ?? comment.from?.name}
        sourceText={comment.text}
        onSend={async (message) => {
          const url =
            comment.platform === "ig"
              ? "/api/comunidad/ig-comments"
              : "/api/comunidad/fb-comments";
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentId: comment.id, message }),
          });
          const d = await r.json();
          if (d.ok) {
            toast.success("Respuesta enviada");
            saveStatus(comment.id, "respondido");
          } else {
            toast.error("Error: " + (d.error ?? "no se pudo enviar"));
          }
        }}
      />
    </TextureCard>
  );
}

// ─── MENSAJES (Messenger) ──────────────────────────────────────────────────

function Mensajes() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<MessengerMsg[]>([]);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);
  const [tagsMap, setTagsMap] = React.useState<Record<string, FunnelTag>>({});

  React.useEffect(() => {
    setTagsMap(loadTags());
  }, []);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/comunidad/messenger?limit=25").then((r) => r.json());
      if (r.ok) setConversations(r.conversations ?? []);
    } catch (e) {
      toast.error("Error cargando conversaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const loadMessages = async (conv: Conversation) => {
    setSelected(conv);
    setLoadingMsgs(true);
    try {
      const r = await fetch(`/api/comunidad/messenger?convId=${conv.id}`).then((r) => r.json());
      if (r.ok) setMessages(r.messages ?? []);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const otherParticipant = (c: Conversation) =>
    c.participants?.data?.find((p) => !!p.name)?.name ?? "Usuario";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="ml-1.5">Actualizar</span>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Lista de conversaciones */}
        <TextureCard className="p-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Sin conversaciones recientes.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {conversations.map((c) => {
                const tag = tagsMap[c.id];
                const tagDef = tag ? getTagDef(tag) : null;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => loadMessages(c)}
                      className={cn(
                        "block w-full rounded-md border bg-card/40 px-3 py-2 text-left text-xs transition-colors",
                        selected?.id === c.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/40 hover:bg-card/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{otherParticipant(c)}</span>
                        {c.unread_count > 0 && (
                          <Badge variant="default" className="text-[9px] h-4 px-1.5">
                            {c.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-muted-foreground">
                        {c.snippet ?? `${c.message_count} mensaje(s)`}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground">
                          {relativeTime(c.updated_time)}
                        </span>
                        {tagDef && (
                          <Badge variant="outline" className={cn("text-[9px] px-1.5", tagDef.bg)}>
                            {tagDef.icon}
                          </Badge>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </TextureCard>

        {/* Thread + Reply */}
        {selected ? (
          <TextureCard className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="size-4 text-violet-400" />
                {otherParticipant(selected)}
                <span className="ml-auto text-xs text-muted-foreground">
                  {selected.message_count} mensaje(s)
                </span>
              </div>
              <div className="mt-1.5 text-[10px] text-muted-foreground">
                Última actividad: {relativeTime(selected.updated_time)}
              </div>
            </div>

            {/* Etiquetas funnel */}
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Etiqueta del funnel
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FUNNEL_TAGS.map((t) => {
                  const active = (tagsMap[selected.id] ?? "nuevo") === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        saveTag(selected.id, t.id);
                        setTagsMap({ ...tagsMap, [selected.id]: t.id });
                      }}
                      className={cn(
                        "rounded border px-2 py-1 text-[10px] transition-colors",
                        active
                          ? `${t.bg} ${t.color}`
                          : "border-border/40 text-muted-foreground hover:bg-muted/30",
                      )}
                    >
                      {t.icon} {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thread */}
            <div className="max-h-[300px] space-y-1.5 overflow-y-auto rounded-md border border-border/40 bg-muted/10 p-3">
              {loadingMsgs ? (
                <Skeleton className="h-20" />
              ) : messages.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin mensajes en el thread.</p>
              ) : (
                [...messages].reverse().map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[80%] rounded-md px-3 py-1.5 text-xs",
                      m.from?.name === "Bewe Software"
                        ? "ml-auto bg-primary/15 text-foreground"
                        : "bg-muted/40 text-foreground",
                    )}
                  >
                    <p className="text-[9px] font-medium text-muted-foreground">
                      {m.from?.name ?? "Usuario"} · {relativeTime(m.created_time)}
                    </p>
                    <p>{m.message ?? ""}</p>
                  </div>
                ))
              )}
            </div>

            {/* Window 24h notice */}
            <Window24hNotice updated={selected.updated_time} />

            {/* Reply Box */}
            <ReplyBox
              platform="messenger"
              author={otherParticipant(selected)}
              sourceText={selected.snippet ?? ""}
              onSend={async (message) => {
                const recipientId = selected.participants?.data?.find(
                  (p) => p.name !== "Bewe Software",
                )?.id;
                if (!recipientId) {
                  toast.error("No se pudo identificar al destinatario");
                  return;
                }
                const r = await fetch("/api/comunidad/messenger", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ recipientId, message }),
                });
                const d = await r.json();
                if (d.ok) {
                  toast.success("Mensaje enviado");
                  saveStatus(selected.id, "respondido");
                  loadMessages(selected); // refrescar thread
                } else {
                  toast.error("Error: " + (d.error ?? "no se pudo enviar"));
                }
              }}
            />
          </TextureCard>
        ) : (
          <TextureCard className="p-6 text-center text-sm text-muted-foreground">
            Selecciona una conversación.
          </TextureCard>
        )}
      </div>
    </div>
  );
}

function Window24hNotice({ updated }: { updated: string }) {
  const hoursAgo = (Date.now() - new Date(updated).getTime()) / 3600000;
  const remaining = 24 - hoursAgo;
  if (remaining <= 0) {
    return (
      <div className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-[10px] text-rose-300">
        ⚠️ Ventana 24h cerrada. Meta no permite responder libremente. Solo con Message Tag específico.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-[10px] text-amber-200">
      ⏰ Ventana 24h: {Math.round(remaining)}h restantes para responder libremente.
    </div>
  );
}

// ─── REPLY BOX (compartido) ────────────────────────────────────────────────

function ReplyBox({
  platform,
  author,
  sourceText,
  onSend,
}: {
  platform: "ig" | "fb" | "messenger";
  author?: string;
  sourceText: string;
  onSend: (message: string) => Promise<void>;
}) {
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [suggesting, setSuggesting] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<{
    suggestedId?: string;
    confidence?: number;
    reason?: string;
    adjustment?: string;
  } | null>(null);

  React.useEffect(() => {
    setTemplates(loadTemplates());
    setText("");
    setSuggestion(null);
  }, [sourceText]);

  const useTemplate = (t: Template) => {
    const first = author?.split(" ")[0];
    setText(applyTemplateVars(t.text, { nombre: first }));
    incrementTemplateUse(t.id);
  };

  const requestSuggestion = async () => {
    setSuggesting(true);
    try {
      const r = await fetch("/api/comunidad/suggest-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: sourceText,
          platform,
          templates: templates.map((t) => ({ id: t.id, name: t.name, text: t.text })),
          author,
        }),
      });
      const d = await r.json();
      if (d.ok && d.suggestion) {
        setSuggestion(d.suggestion);
        const tpl = templates.find((x) => x.id === d.suggestion.suggestedId);
        if (tpl) useTemplate(tpl);
      } else {
        toast.error("No se pudo obtener sugerencia");
      }
    } catch (e) {
      toast.error("Error sugiriendo plantilla");
    } finally {
      setSuggesting(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText("");
      setSuggestion(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select onValueChange={(v) => {
          const tpl = templates.find((t) => t.id === v);
          if (tpl) useTemplate(tpl);
        }}>
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder="Insertar plantilla..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.icon} {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={requestSuggestion}
          disabled={suggesting || templates.length === 0}
          className="gap-1.5"
        >
          {suggesting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          Sugerir IA
        </Button>
      </div>

      {suggestion?.reason && (
        <div className="rounded-md border border-violet-500/30 bg-violet-500/5 px-3 py-1.5 text-[10px] text-violet-200">
          💡 <span className="font-medium">IA sugiere:</span> {suggestion.reason}
          {suggestion.confidence ? ` (${suggestion.confidence}% confianza)` : ""}
          {suggestion.adjustment ? ` · ajuste: ${suggestion.adjustment}` : ""}
        </div>
      )}

      <Textarea
        placeholder={
          platform === "messenger"
            ? "Escribe tu respuesta..."
            : "Escribe tu respuesta al comentario..."
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="text-xs"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{text.length} caracteres</span>
        <Button onClick={handleSend} disabled={sending || !text.trim()} size="sm">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          <span className="ml-1.5">Enviar</span>
        </Button>
      </div>
    </div>
  );
}

// ─── PLANTILLAS (CRUD) ─────────────────────────────────────────────────────

function PlantillasView() {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Template | null>(null);

  React.useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const saveAll = (next: Template[]) => {
    setTemplates(next);
    saveTemplates(next);
  };

  const startNew = () => {
    const id = "custom-" + Date.now();
    setDraft({
      id,
      name: "Nueva plantilla",
      icon: "💡",
      text: "",
      useCount: 0,
      createdAt: new Date().toISOString(),
    });
    setEditing(id);
  };

  const saveDraft = () => {
    if (!draft) return;
    const idx = templates.findIndex((t) => t.id === draft.id);
    let next: Template[];
    if (idx >= 0) {
      next = [...templates];
      next[idx] = draft;
    } else {
      next = [...templates, draft];
    }
    saveAll(next);
    setEditing(null);
    setDraft(null);
    toast.success("Plantilla guardada");
  };

  const deleteOne = (id: string) => {
    saveAll(templates.filter((t) => t.id !== id));
    toast.success("Plantilla eliminada");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {templates.length} plantilla(s) · ordenadas por uso. Pueden incluir variables{" "}
          <code className="rounded bg-muted/40 px-1">{"{{nombre}}"}</code>{" "}
          <code className="rounded bg-muted/40 px-1">{"{{producto}}"}</code>{" "}
          <code className="rounded bg-muted/40 px-1">{"{{negocio}}"}</code>
        </p>
        <Button onClick={startNew} size="sm" className="gap-1.5">
          <Plus className="size-3.5" /> Nueva
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[...templates]
          .sort((a, b) => b.useCount - a.useCount)
          .map((t) => (
            <TextureCard key={t.id} className="p-4 space-y-2">
              {editing === t.id && draft ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={draft.icon}
                      onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                      className="w-14 text-center"
                      maxLength={2}
                    />
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="Nombre"
                    />
                  </div>
                  <Textarea
                    value={draft.text}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                    rows={5}
                    placeholder="Texto..."
                    className="text-xs"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => {
                        setEditing(null);
                        setDraft(null);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveDraft} size="sm" className="gap-1.5">
                      <Check className="size-3.5" /> Guardar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-base">{t.icon}</span>
                        {t.name}
                      </h4>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Usada {t.useCount} {t.useCount === 1 ? "vez" : "veces"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => {
                          setDraft(t);
                          setEditing(t.id);
                        }}
                        variant="ghost"
                        size="icon"
                        className="size-7"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        onClick={() => deleteOne(t.id)}
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="rounded bg-muted/20 p-2 text-xs">{t.text}</p>
                </>
              )}
            </TextureCard>
          ))}
        {editing && draft && !templates.find((t) => t.id === draft.id) && (
          <TextureCard className="p-4 space-y-2">
            <div className="flex gap-2">
              <Input
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                className="w-14 text-center"
                maxLength={2}
              />
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nombre"
              />
            </div>
            <Textarea
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              rows={5}
              placeholder="Texto... usa {{nombre}} para personalizar"
              className="text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setEditing(null);
                  setDraft(null);
                }}
                variant="ghost"
                size="sm"
              >
                Cancelar
              </Button>
              <Button onClick={saveDraft} size="sm" className="gap-1.5">
                <Check className="size-3.5" /> Crear
              </Button>
            </div>
          </TextureCard>
        )}
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "—";
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.round(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}
