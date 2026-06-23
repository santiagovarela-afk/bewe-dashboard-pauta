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
  Clock,
  Inbox,
  HelpCircle,
  FileText,
  Users,
  TrendingUp,
  Link as LinkIcon,
  Copy as CopyIcon,
  Hash,
  Smile,
  Frown,
  Meh,
  BarChart3,
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
  saveStatus,
  loadStatuses,
  loadTemplates,
  saveTemplates,
  incrementTemplateUse,
  applyTemplateVars,
  buildUTMUrl,
  type FunnelTag,
  type Template,
  type Industry,
  type Intent,
} from "@/lib/comunidad-tags";
import {
  CONTACT_STAGES,
  getStageDef,
  loadContacts,
  saveContacts,
  upsertContact,
  moveContactToStage,
  updateContactNotes,
  deleteContact,
  computeStats,
  type Contact,
  type ContactStage,
} from "@/lib/comunidad-crm";
import { useDashboard } from "@/lib/store";
import { toast } from "sonner";
import { ComunidadTour } from "@/components/comunidad/comunidad-tour";

// ─── TIPOS ─────────────────────────────────────────────────────────────────

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

type SubTab = "resumen" | "comentarios" | "mensajes" | "crm" | "plantillas" | "reporte";

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
        sub="CRM, conversaciones y comentarios de Bewe en redes sociales"
        accent="violet"
        right={
          <Button variant="ghost" size="sm" onClick={() => setShowTour(true)} className="gap-1.5">
            <HelpCircle className="size-4" /> Ver tour
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-2">
        {(
          [
            { id: "resumen", label: "Resumen", icon: BarChart3 },
            { id: "comentarios", label: "Comentarios", icon: MessageSquare },
            { id: "mensajes", label: "Messenger", icon: Send },
            { id: "crm", label: "CRM Contactos", icon: Users },
            { id: "plantillas", label: "Plantillas", icon: Sparkles },
            { id: "reporte", label: "Reporte semanal", icon: FileText },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSub(id)}
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
          Usuario: <span className="font-medium text-foreground/80">{user?.name}</span> · rol{" "}
          <span className="font-mono">{user?.role}</span>
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
        {sub === "crm" && <CRMKanban />}
        {sub === "plantillas" && <PlantillasView />}
        {sub === "reporte" && <Reporte />}
      </motion.div>

      {showTour && <ComunidadTour onClose={closeTour} userName={user?.name ?? "amigo"} />}
    </div>
  );
}

// ─── RESUMEN ESTRATÉGICO ───────────────────────────────────────────────────

interface Insights {
  sentiment: { positive: number; neutral: number; negative: number };
  keywords: Array<{ word: string; count: number; context: string }>;
  themes: Array<{ name: string; mentions: number; examples: string[] }>;
  highlights: string[];
}

function Resumen({ onJump }: { onJump: (s: SubTab) => void }) {
  const [igPosts, setIGPosts] = React.useState<IGPost[]>([]);
  const [fbPosts, setFBPosts] = React.useState<FBPost[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [allComments, setAllComments] = React.useState<Comment[]>([]);
  const [insights, setInsights] = React.useState<Insights | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});
  const [contacts, setContacts] = React.useState<Contact[]>([]);

  React.useEffect(() => {
    setStatuses(loadStatuses());
    setContacts(loadContacts());
  }, []);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ig, fb, msg] = await Promise.all([
        fetch("/api/comunidad/ig-posts?limit=15").then((r) => r.json()),
        fetch("/api/comunidad/fb-posts?limit=15").then((r) => r.json()),
        fetch("/api/comunidad/messenger?limit=20").then((r) => r.json()),
      ]);
      if (ig.ok) setIGPosts(ig.posts ?? []);
      if (fb.ok) setFBPosts(fb.posts ?? []);
      if (msg.ok) setConversations(msg.conversations ?? []);

      // Cargar comentarios de los 5 posts con más interacción de cada plataforma
      const igTop = (ig.posts ?? [])
        .sort((a: IGPost, b: IGPost) => (b.comments_count ?? 0) - (a.comments_count ?? 0))
        .slice(0, 5);
      const fbTop = (fb.posts ?? [])
        .sort((a: FBPost, b: FBPost) => (b.comments_count ?? 0) - (a.comments_count ?? 0))
        .slice(0, 5);
      const [igC, fbC] = await Promise.all([
        Promise.all(
          igTop.map((p: IGPost) =>
            fetch(`/api/comunidad/ig-comments?mediaId=${p.id}`)
              .then((r) => r.json())
              .then((d) => (d.ok ? d.comments : []))
              .catch(() => []),
          ),
        ),
        Promise.all(
          fbTop.map((p: FBPost) =>
            fetch(`/api/comunidad/fb-comments?postId=${p.id}`)
              .then((r) => r.json())
              .then((d) => (d.ok ? d.comments : []))
              .catch(() => []),
          ),
        ),
      ]);
      const merged: Comment[] = [...igC.flat(), ...fbC.flat()];
      setAllComments(merged);
    } catch {
      toast.error("Error cargando resumen");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const analyze = async () => {
    if (allComments.length === 0) {
      toast.error("Sin comentarios para analizar");
      return;
    }
    setAnalyzing(true);
    try {
      const r = await fetch("/api/comunidad/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: allComments.map((c) => ({ text: c.text })) }),
      });
      const d = await r.json();
      if (d.ok) {
        setInsights(d.insights);
        toast.success("Análisis IA completado");
      } else {
        toast.error("Error: " + (d.error ?? "no se pudo analizar"));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // KPIs derivados
  const totalComments = igPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0) +
    fbPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0);
  const totalMessages = conversations.length;
  const respondedCount = Object.values(statuses).filter((s) => s === "respondido").length;
  const responseRate = totalComments + totalMessages > 0
    ? Math.round((respondedCount / (totalComments + totalMessages)) * 100)
    : 0;

  const crmStats = computeStats(contacts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Análisis basado en últimos posts y conversaciones de Bewe en IG y FB.
        </div>
        <div className="flex gap-2">
          <Button onClick={analyze} variant="outline" size="sm" disabled={analyzing || loading} className="gap-1.5">
            {analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            Analizar con IA
          </Button>
          <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-1.5">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* KPIs interacciones */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Comentarios IG + FB"
          value={loading ? 0 : totalComments}
          sub={`${igPosts.length + fbPosts.length} posts revisados`}
          tone="violet"
        />
        <KpiCard
          label="Conversaciones Messenger"
          value={loading ? 0 : totalMessages}
          sub="últimas 25"
          tone="info"
        />
        <KpiCard
          label="Tasa de respuesta"
          value={loading ? 0 : responseRate}
          format={(v) => `${v}%`}
          sub={`${respondedCount} respondidos / ${totalComments + totalMessages} total`}
          tone={responseRate >= 70 ? "success" : responseRate >= 40 ? "warning" : "danger"}
        />
        <KpiCard
          label="Contactos en CRM"
          value={loading ? 0 : crmStats.total}
          sub={`${crmStats.byStage.calificado + crmStats.byStage.convertido} calificados+`}
          tone="ember"
        />
      </div>

      {/* Funnel CRM compacto */}
      <TextureCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="size-4" /> Funnel del CRM
          </h3>
          <Button variant="ghost" size="sm" onClick={() => onJump("crm")}>
            Ver tablero →
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CONTACT_STAGES.map((s) => (
            <div
              key={s.id}
              className={cn("rounded-md border p-3 text-center", s.bg)}
            >
              <div className="text-2xl">{s.icon}</div>
              <div className={cn("text-2xl font-bold mt-1", s.color)}>
                {crmStats.byStage[s.id] ?? 0}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Tasa de calificación: <span className="font-medium text-foreground">{crmStats.qualificationRate.toFixed(0)}%</span>
          </span>
          <span className="text-muted-foreground">
            Conversión: <span className="font-medium text-emerald-400">{crmStats.conversionRate.toFixed(0)}%</span>
          </span>
        </div>
      </TextureCard>

      {/* Sentiment + Keywords (IA) */}
      {insights ? (
        <div className="grid gap-4 md:grid-cols-2">
          <TextureCard className="p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Smile className="size-4 text-emerald-400" /> Sentiment global
            </h3>
            <div className="space-y-2">
              <SentimentBar label="Positivo" value={insights.sentiment.positive} color="bg-emerald-500" icon={<Smile className="size-3" />} />
              <SentimentBar label="Neutro" value={insights.sentiment.neutral} color="bg-slate-500" icon={<Meh className="size-3" />} />
              <SentimentBar label="Negativo" value={insights.sentiment.negative} color="bg-rose-500" icon={<Frown className="size-3" />} />
            </div>
            {insights.highlights?.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <p className="mb-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Highlights</p>
                <ul className="space-y-1 text-xs">
                  {insights.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-400">→</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TextureCard>

          <TextureCard className="p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Hash className="size-4 text-violet-400" /> Top palabras clave
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {insights.keywords.slice(0, 12).map((k) => (
                <Badge key={k.word} variant="outline" className="text-[10px]">
                  {k.word} {k.count > 1 ? <span className="ml-1 text-muted-foreground">×{k.count}</span> : null}
                </Badge>
              ))}
              {insights.keywords.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin palabras clave detectadas.</p>
              )}
            </div>
            {insights.themes?.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <p className="mb-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Temas detectados</p>
                <ul className="space-y-1 text-xs">
                  {insights.themes.slice(0, 5).map((t, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground">{t.mentions} menciones</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TextureCard>
        </div>
      ) : (
        <TextureCard className="p-5 text-center">
          <Sparkles className="size-8 mx-auto mb-2 text-violet-400 opacity-60" />
          <p className="text-sm font-medium">Análisis con IA</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clic en <strong>"Analizar con IA"</strong> arriba para obtener sentiment, palabras
            clave y temas detectados en los comentarios.
          </p>
        </TextureCard>
      )}

      {/* Actividad reciente Messenger */}
      <TextureCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="size-4" /> Conversaciones recientes (Messenger)
          </h3>
          <Button variant="ghost" size="sm" onClick={() => onJump("mensajes")}>
            Ir a Messenger →
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
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className="size-3 text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {c.participants?.data?.find((p) => p.name !== "Bewe Software")?.name ?? "Usuario"}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {c.snippet ?? `${c.message_count} mensaje(s)`}
                    </p>
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-2 text-muted-foreground shrink-0">
                  <span className="text-[10px]">{formatDate(c.updated_time)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TextureCard>

      {/* Post estrella IG + FB */}
      <div className="grid gap-3 md:grid-cols-2">
        <TopPostCard
          posts={igPosts}
          loading={loading}
          platform="ig"
          onSeeMore={() => onJump("comentarios")}
        />
        <TopPostCard
          posts={fbPosts}
          loading={loading}
          platform="fb"
          onSeeMore={() => onJump("comentarios")}
        />
      </div>
    </div>
  );
}

function SentimentBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div className={cn("h-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TopPostCard<T extends IGPost | FBPost>({
  posts,
  loading,
  platform,
  onSeeMore,
}: {
  posts: T[];
  loading: boolean;
  platform: "ig" | "fb";
  onSeeMore: () => void;
}) {
  const top = [...posts].sort(
    (a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0),
  )[0];
  return (
    <TextureCard className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {platform === "ig" ? <Instagram className="size-4 text-pink-400" /> : <Facebook className="size-4 text-blue-400" />}
          Post con más interacción
        </h3>
        <Button variant="ghost" size="sm" onClick={onSeeMore}>
          Ver →
        </Button>
      </div>
      {loading ? (
        <Skeleton className="h-32" />
      ) : !top ? (
        <p className="text-xs text-muted-foreground">Sin posts cargados.</p>
      ) : (
        <div className="flex gap-3">
          <div className="size-24 shrink-0 overflow-hidden rounded bg-muted/40">
            {platform === "ig" && (top as IGPost).thumbnail_url ? (
              <img src={(top as IGPost).thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : platform === "fb" && (top as FBPost).full_picture ? (
              <img src={(top as FBPost).full_picture} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-medium line-clamp-3">
              {platform === "ig" ? (top as IGPost).caption ?? "Sin caption" : (top as FBPost).message ?? "Sin texto"}
            </p>
            <div className="mt-2 flex items-center gap-3 text-muted-foreground text-[10px]">
              <span>💬 {top.comments_count ?? 0} comentarios</span>
              {platform === "ig" && <span>❤️ {(top as IGPost).like_count ?? 0}</span>}
              <span>{formatDate(platform === "ig" ? (top as IGPost).timestamp : (top as FBPost).created_time)}</span>
            </div>
            {(platform === "ig" ? (top as IGPost).permalink : (top as FBPost).permalink_url) && (
              <a
                href={platform === "ig" ? (top as IGPost).permalink : (top as FBPost).permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[10px] text-violet-400 hover:underline"
              >
                Ver en {platform === "ig" ? "Instagram" : "Facebook"} <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </TextureCard>
  );
}

// ─── COMENTARIOS (con filtros iconos) ──────────────────────────────────────

function Comentarios() {
  const [platform, setPlatform] = React.useState<"all" | "ig" | "fb">("all");
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
      const [igRes, fbRes] = await Promise.all([
        fetch("/api/comunidad/ig-posts?limit=15").then((r) => r.json()),
        fetch("/api/comunidad/fb-posts?limit=15").then((r) => r.json()),
      ]);
      const igP: IGPost[] = igRes.ok ? igRes.posts ?? [] : [];
      const fbP: FBPost[] = fbRes.ok ? fbRes.posts ?? [] : [];

      const igWith = igP.filter((p) => (p.comments_count ?? 0) > 0).slice(0, 10);
      const fbWith = fbP.filter((p) => (p.comments_count ?? 0) > 0).slice(0, 10);

      const igCommentsRes = await Promise.all(
        igWith.map((p) =>
          fetch(`/api/comunidad/ig-comments?mediaId=${p.id}`)
            .then((r) => r.json())
            .then((d) => (d.ok ? (d.comments as Comment[]) : []))
            .then((cs) => cs.map((c) => ({ ...c, post_caption: p.caption, post_permalink: p.permalink })))
            .catch(() => [] as Comment[]),
        ),
      );
      const fbCommentsRes = await Promise.all(
        fbWith.map((p) =>
          fetch(`/api/comunidad/fb-comments?postId=${p.id}`)
            .then((r) => r.json())
            .then((d) => (d.ok ? (d.comments as Comment[]) : []))
            .then((cs) => cs.map((c) => ({ ...c, post_caption: p.message, post_permalink: p.permalink_url })))
            .catch(() => [] as Comment[]),
        ),
      );

      const all: Comment[] = [...igCommentsRes.flat(), ...fbCommentsRes.flat()];
      all.sort((a, b) => {
        const ta = new Date(a.timestamp ?? a.created_time ?? 0).getTime();
        const tb = new Date(b.timestamp ?? b.created_time ?? 0).getTime();
        return tb - ta;
      });
      setComments(all);

      // Auto-upsert contactos al CRM
      const cs = loadContacts();
      let next = cs;
      all.forEach((c) => {
        const name = c.username ?? c.from?.name;
        const ts = c.timestamp ?? c.created_time ?? new Date().toISOString();
        if (name) {
          const r = upsertContact(next, { name, platform: c.platform, interactionAt: ts });
          next = r.contacts;
        }
      });
      saveContacts(next);
    } catch {
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
      const t = tagsMap[c.id] ?? "nuevo";
      if (t !== tagFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtros con iconos (no dropdown) */}
        <div className="inline-flex items-center rounded-md border border-border/60 bg-card/40 p-0.5">
          <PlatformButton
            active={platform === "all"}
            onClick={() => setPlatform("all")}
            label="Todas"
          />
          <PlatformButton
            active={platform === "ig"}
            onClick={() => setPlatform("ig")}
            icon={<Instagram className="size-3.5 text-pink-400" />}
            label="Instagram"
          />
          <PlatformButton
            active={platform === "fb"}
            onClick={() => setPlatform("fb")}
            icon={<Facebook className="size-3.5 text-blue-400" />}
            label="Facebook"
          />
        </div>

        <Select value={tagFilter} onValueChange={(v) => setTagFilter(v as FunnelTag | "all")}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
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
            className="pl-8 text-xs h-8"
          />
        </div>

        <span className="text-xs text-muted-foreground">{filtered.length} comentarios</span>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="ml-1.5">Actualizar</span>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
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

function PlatformButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/40",
      )}
    >
      {icon}
      {label}
    </button>
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
  const author = comment.username ?? comment.from?.name ?? "Usuario sin nombre";
  const time = comment.timestamp ?? comment.created_time ?? "";
  const tagDef = tag ? getTagDef(tag) : null;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "block w-full rounded-md border bg-card/40 px-3 py-2 text-left text-xs transition-colors",
          selected ? "border-primary/50 bg-primary/5" : "border-border/40 hover:bg-card/60",
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
          <span className="text-[10px] text-muted-foreground">{formatDate(time)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-foreground/90">{comment.text}</p>
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
  return (
    <TextureCard className="p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs">
          {comment.platform === "ig" ? (
            <Instagram className="size-4 text-pink-400" />
          ) : (
            <Facebook className="size-4 text-blue-400" />
          )}
          <span className="font-medium">{comment.username ?? comment.from?.name ?? "Anónimo"}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{formatDate(comment.timestamp ?? comment.created_time ?? "")}</span>
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
            Sobre: "{comment.post_caption.slice(0, 100)}…"
          </p>
        )}
      </div>

      <TagPicker tag={tag} onChange={onTagChange} />

      <ReplyBox
        platform={comment.platform}
        author={comment.username ?? comment.from?.name}
        sourceText={comment.text}
        onSend={async (message) => {
          const url = comment.platform === "ig" ? "/api/comunidad/ig-comments" : "/api/comunidad/fb-comments";
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

function TagPicker({ tag, onChange }: { tag: FunnelTag; onChange: (t: FunnelTag) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Etiqueta funnel
      </p>
      <div className="flex flex-wrap gap-1.5">
        {FUNNEL_TAGS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded border px-2 py-1 text-[10px] transition-colors",
              tag === t.id ? `${t.bg} ${t.color}` : "border-border/40 text-muted-foreground hover:bg-muted/30",
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MENSAJES ──────────────────────────────────────────────────────────────

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
      if (r.ok) {
        const sorted = (r.conversations as Conversation[] ?? []).sort(
          (a, b) => new Date(b.updated_time).getTime() - new Date(a.updated_time).getTime(),
        );
        setConversations(sorted);

        // Upsert contactos al CRM
        const cs = loadContacts();
        let next = cs;
        sorted.forEach((c) => {
          const name = c.participants?.data?.find((p) => p.name !== "Bewe Software")?.name;
          if (name) {
            const u = upsertContact(next, {
              name,
              platform: "messenger",
              interactionAt: c.updated_time,
            });
            next = u.contacts;
          }
        });
        saveContacts(next);
      }
    } catch {
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
    c.participants?.data?.find((p) => p.name !== "Bewe Software")?.name ?? "Usuario";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 text-[10px]">
          <MessageSquare className="size-3 text-violet-400" /> Messenger Facebook
        </Badge>
        <span className="text-xs text-muted-foreground">
          {conversations.length} conversaciones · DMs Instagram pendiente (próxima versión)
        </span>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="ml-1.5">Actualizar</span>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <TextureCard className="p-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Sin conversaciones recientes.</p>
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
                        selected?.id === c.id ? "border-primary/50 bg-primary/5" : "border-border/40 hover:bg-card/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MessageSquare className="size-3 text-violet-400 shrink-0" />
                          <span className="font-medium truncate">{otherParticipant(c)}</span>
                        </div>
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
                        <span className="text-[9px] text-muted-foreground" title={c.updated_time}>
                          {formatDate(c.updated_time)}
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

        {selected ? (
          <TextureCard className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="size-4 text-violet-400" />
              {otherParticipant(selected)}
              <Badge variant="outline" className="text-[9px] ml-2">Messenger FB</Badge>
              <span className="ml-auto text-xs text-muted-foreground">
                {selected.message_count} mensaje(s) · {formatDate(selected.updated_time)}
              </span>
            </div>

            <TagPicker
              tag={tagsMap[selected.id] ?? "nuevo"}
              onChange={(t) => {
                saveTag(selected.id, t);
                setTagsMap({ ...tagsMap, [selected.id]: t });
              }}
            />

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
                      {m.from?.name ?? "Usuario"} · {formatDate(m.created_time)}
                    </p>
                    <p>{m.message ?? ""}</p>
                  </div>
                ))
              )}
            </div>

            <Window24hNotice updated={selected.updated_time} />

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
                  loadMessages(selected);
                } else {
                  toast.error("Error: " + (d.error ?? "no se pudo enviar"));
                }
              }}
            />
          </TextureCard>
        ) : (
          <TextureCard className="p-6 text-center text-sm text-muted-foreground">
            Selecciona una conversación para ver el thread y responder.
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
        ⚠️ Ventana 24h cerrada. Meta no permite responder libremente — solo con Message Tag específico.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-[10px] text-amber-200">
      ⏰ Ventana 24h: {Math.round(remaining)}h restantes para responder libremente.
    </div>
  );
}

// ─── CRM KANBAN ────────────────────────────────────────────────────────────

function CRMKanban() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [editingNotes, setEditingNotes] = React.useState("");

  React.useEffect(() => {
    setContacts(loadContacts());
  }, []);

  const moveTo = (contactId: string, stage: ContactStage) => {
    const next = moveContactToStage(contacts, contactId, stage);
    setContacts(next);
    saveContacts(next);
    toast.success(`Movido a ${getStageDef(stage).label}`);
  };

  const handleDrop = (stage: ContactStage) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId) {
      moveTo(draggedId, stage);
      setDraggedId(null);
    }
  };

  const stats = computeStats(contacts);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {stats.total} contactos · {stats.qualificationRate.toFixed(0)}% calificados · {stats.conversionRate.toFixed(0)}% convertidos
        </div>
        <div className="flex gap-2">
          {contacts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("¿Borrar TODOS los contactos del CRM? Esta acción no se puede deshacer.")) {
                  saveContacts([]);
                  setContacts([]);
                  toast.success("CRM limpio");
                }
              }}
              className="gap-1.5 text-rose-400 border-rose-500/30"
            >
              <Trash2 className="size-3.5" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {contacts.length === 0 && (
        <TextureCard className="p-8 text-center">
          <Users className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium">CRM vacío</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Los contactos se crean automáticamente cuando cargas comentarios o mensajes en las
            otras sub-tabs. Ve a "Comentarios" o "Messenger" para poblar el CRM.
          </p>
        </TextureCard>
      )}

      <div className="grid gap-3 lg:grid-cols-4">
        {CONTACT_STAGES.map((stage) => {
          const stageContacts = contacts.filter((c) => c.stage === stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop(stage.id)}
              className={cn(
                "min-h-[300px] rounded-lg border-2 border-dashed p-3 transition-colors",
                draggedId ? "border-primary/40 bg-primary/[0.02]" : "border-border/40",
              )}
            >
              <div className={cn("rounded-md border px-3 py-2 mb-3 flex items-center justify-between", stage.bg)}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{stage.icon}</span>
                  <span className={cn("text-xs font-semibold", stage.color)}>{stage.label}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {stageContacts.length}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2 px-1">{stage.description}</p>
              <ul className="space-y-2">
                {stageContacts.map((contact) => (
                  <li
                    key={contact.id}
                    draggable
                    onDragStart={() => setDraggedId(contact.id)}
                    onDragEnd={() => setDraggedId(null)}
                    onClick={() => {
                      setSelectedContact(contact);
                      setEditingNotes(contact.notes);
                    }}
                    className="cursor-grab rounded-md border border-border/40 bg-card/60 p-2.5 text-xs hover:bg-card/90 hover:border-primary/30 active:cursor-grabbing transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium truncate flex-1">{contact.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      {contact.platforms.map((p) =>
                        p === "ig" ? (
                          <Instagram key={p} className="size-3 text-pink-400" />
                        ) : p === "fb" ? (
                          <Facebook key={p} className="size-3 text-blue-400" />
                        ) : (
                          <MessageSquare key={p} className="size-3 text-violet-400" />
                        ),
                      )}
                      <span>·</span>
                      <span>{contact.interactionCount} mensajes</span>
                      <span>·</span>
                      <span>{formatDate(contact.lastInteraction)}</span>
                    </div>
                    {contact.notes && (
                      <p className="mt-1.5 line-clamp-2 text-[10px] italic text-muted-foreground">
                        {contact.notes}
                      </p>
                    )}
                  </li>
                ))}
                {stageContacts.length === 0 && (
                  <li className="rounded-md border border-dashed border-border/30 px-2 py-4 text-center text-[10px] text-muted-foreground">
                    Arrastra aquí
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Modal de detalle de contacto */}
      {selectedContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedContact(null);
          }}
        >
          <TextureCard className="w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                {selectedContact.name}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)}>
                ×
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-border/40 bg-muted/20 p-2">
                <p className="text-[9px] uppercase text-muted-foreground">Interacciones</p>
                <p className="text-lg font-semibold">{selectedContact.interactionCount}</p>
              </div>
              <div className="rounded-md border border-border/40 bg-muted/20 p-2">
                <p className="text-[9px] uppercase text-muted-foreground">Plataformas</p>
                <p className="text-lg font-semibold">{selectedContact.platforms.length}</p>
              </div>
              <div className="rounded-md border border-border/40 bg-muted/20 p-2">
                <p className="text-[9px] uppercase text-muted-foreground">Stage</p>
                <p className="text-base">{getStageDef(selectedContact.stage).icon}</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] uppercase text-muted-foreground">Notas internas</p>
              <Textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                rows={4}
                placeholder="Notas para el equipo... (no se ven en el chat)"
                className="text-xs"
              />
            </div>

            <div>
              <p className="mb-1 text-[10px] uppercase text-muted-foreground">Mover a</p>
              <div className="flex gap-1.5">
                {CONTACT_STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      const next = moveContactToStage(contacts, selectedContact.id, s.id);
                      setContacts(next);
                      saveContacts(next);
                      setSelectedContact({ ...selectedContact, stage: s.id });
                    }}
                    className={cn(
                      "flex-1 rounded border px-2 py-1.5 text-[10px] transition-colors",
                      selectedContact.stage === s.id ? `${s.bg} ${s.color}` : "border-border/40 text-muted-foreground hover:bg-muted/30",
                    )}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`¿Borrar contacto "${selectedContact.name}"?`)) {
                    const next = deleteContact(contacts, selectedContact.id);
                    setContacts(next);
                    saveContacts(next);
                    setSelectedContact(null);
                  }
                }}
                className="gap-1.5 text-rose-400"
              >
                <Trash2 className="size-3.5" /> Borrar
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)}>
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const next = updateContactNotes(contacts, selectedContact.id, editingNotes);
                    setContacts(next);
                    saveContacts(next);
                    toast.success("Notas guardadas");
                    setSelectedContact(null);
                  }}
                  className="gap-1.5"
                >
                  <Check className="size-3.5" /> Guardar notas
                </Button>
              </div>
            </div>
          </TextureCard>
        </div>
      )}
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

  const insertTemplate = (t: Template) => {
    const first = author?.split(" ")[0];
    let body = applyTemplateVars(t.text, { nombre: first });
    if (t.urlBase) {
      const link = buildUTMUrl(t.urlBase, { platform, industry: t.industry, intent: t.intent });
      body = body.replace(/\{\{link\}\}/g, link);
    } else {
      body = body.replace(/\{\{link\}\}/g, "");
    }
    setText(body);
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
        if (tpl) insertTemplate(tpl);
      } else {
        toast.error("No se pudo obtener sugerencia");
      }
    } catch {
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
      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(v) => {
            const tpl = templates.find((t) => t.id === v);
            if (tpl) insertTemplate(tpl);
          }}
        >
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
          {suggesting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
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
        placeholder={platform === "messenger" ? "Escribe tu respuesta..." : "Escribe tu respuesta al comentario..."}
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

// ─── PLANTILLAS (con UTMs) ─────────────────────────────────────────────────

const INDUSTRIES: Array<{ id: Industry; label: string }> = [
  { id: "general", label: "General" },
  { id: "belleza", label: "Belleza" },
  { id: "comercio", label: "Comercio" },
  { id: "servicios", label: "Servicios" },
  { id: "tools", label: "Tools" },
];
const INTENTS: Array<{ id: Intent; label: string }> = [
  { id: "info", label: "Info" },
  { id: "demo", label: "Demo" },
  { id: "trial", label: "Trial" },
  { id: "precios", label: "Precios" },
  { id: "soporte", label: "Soporte" },
  { id: "agradecimiento", label: "Agradecer" },
  { id: "descartar", label: "Descarte" },
];

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
    const newT: Template = {
      id,
      name: "Nueva plantilla",
      icon: "💡",
      industry: "general",
      intent: "info",
      urlBase: "",
      text: "",
      useCount: 0,
      createdAt: new Date().toISOString(),
    };
    setDraft(newT);
    setEditing(id);
  };

  const saveDraft = () => {
    if (!draft) return;
    const idx = templates.findIndex((t) => t.id === draft.id);
    const next = idx >= 0 ? templates.map((t, i) => (i === idx ? draft : t)) : [...templates, draft];
    saveAll(next);
    setEditing(null);
    setDraft(null);
    toast.success("Plantilla guardada");
  };

  const deleteOne = (id: string) => {
    saveAll(templates.filter((t) => t.id !== id));
    toast.success("Plantilla eliminada");
  };

  const renderItem = (t: Template) => {
    const isEditing = editing === t.id && draft?.id === t.id;
    const previewUrl = t.urlBase
      ? buildUTMUrl(t.urlBase, { platform: "ig", industry: t.industry, intent: t.intent })
      : "";

    return (
      <TextureCard key={t.id} className="p-4 space-y-2">
        {isEditing && draft ? (
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
            <div className="grid grid-cols-2 gap-2">
              <Select value={draft.industry} onValueChange={(v) => setDraft({ ...draft, industry: v as Industry })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={draft.intent} onValueChange={(v) => setDraft({ ...draft, intent: v as Intent })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENTS.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              value={draft.urlBase ?? ""}
              onChange={(e) => setDraft({ ...draft, urlBase: e.target.value })}
              placeholder="https://bewe.ai/... (opcional)"
              className="text-xs"
            />
            <Textarea
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              rows={5}
              placeholder="Texto... usa {{nombre}} para el nombre del usuario, {{link}} para insertar la URL con UTMs"
              className="text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => { setEditing(null); setDraft(null); }} variant="ghost" size="sm">
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
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
                  <Badge variant="outline" className="text-[9px]">{t.industry}</Badge>
                  <Badge variant="outline" className="text-[9px]">{t.intent}</Badge>
                  <span>· usada {t.useCount} {t.useCount === 1 ? "vez" : "veces"}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button onClick={() => { setDraft(t); setEditing(t.id); }} variant="ghost" size="icon" className="size-7">
                  <Edit3 className="size-3.5" />
                </Button>
                <Button onClick={() => deleteOne(t.id)} variant="ghost" size="icon" className="size-7 text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            <p className="rounded bg-muted/20 p-2 text-xs whitespace-pre-wrap">{t.text}</p>
            {previewUrl && (
              <div className="flex items-center gap-2 rounded border border-violet-500/20 bg-violet-500/5 p-2">
                <LinkIcon className="size-3 text-violet-400 shrink-0" />
                <code className="text-[10px] text-violet-200 truncate flex-1">{previewUrl}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => {
                    navigator.clipboard?.writeText(previewUrl);
                    toast.success("URL copiada");
                  }}
                >
                  <CopyIcon className="size-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </TextureCard>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {templates.length} plantilla(s) · variables:{" "}
            <code className="rounded bg-muted/40 px-1">{"{{nombre}}"}</code>{" "}
            <code className="rounded bg-muted/40 px-1">{"{{link}}"}</code>{" "}
            (URL con UTMs auto-generadas)
          </p>
        </div>
        <Button onClick={startNew} size="sm" className="gap-1.5">
          <Plus className="size-3.5" /> Nueva
        </Button>
      </div>

      <div className="rounded-md border border-violet-500/20 bg-violet-500/5 p-3 text-xs">
        <p className="font-medium text-violet-200 mb-1">🎯 UTMs auto-generados (junio · redes)</p>
        <p className="text-violet-200/70">
          Cada plantilla con <strong>URL base</strong> genera un link con{" "}
          <code>utm_source</code> (plataforma) · <code>utm_medium=comunidad</code> ·{" "}
          <code>utm_campaign=junio_redes_[industria]_2026</code> · <code>utm_content=[intent]</code>.{" "}
          Al insertar la plantilla en una respuesta, el <code>{"{{link}}"}</code> se reemplaza por la URL completa.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[...templates]
          .sort((a, b) => b.useCount - a.useCount)
          .map(renderItem)}
        {editing && draft && !templates.find((t) => t.id === draft.id) && renderItem(draft)}
      </div>
    </div>
  );
}

// ─── REPORTE SEMANAL ───────────────────────────────────────────────────────

function Reporte() {
  const [report, setReport] = React.useState<string>("");
  const [generating, setGenerating] = React.useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const statuses = loadStatuses();
      const contacts = loadContacts();
      const stats = computeStats(contacts);

      // Estimaciones de la semana (mejor que nada)
      const answered = Object.values(statuses).filter((s) => s === "respondido").length;
      const totalInteractions = Object.keys(statuses).length;
      const pending = Math.max(0, totalInteractions - answered);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const periodLabel = `${weekAgo.toLocaleDateString("es", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}`;

      const r = await fetch("/api/comunidad/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: {
            period: periodLabel,
            totalComments: Math.max(1, totalInteractions),
            totalMessages: 0,
            answered,
            pending,
            contactsByStage: stats.byStage,
          },
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setReport(d.report);
        toast.success("Reporte generado");
      } else {
        toast.error("Error: " + (d.error ?? "no se pudo generar"));
      }
    } catch (e) {
      toast.error("Error generando reporte");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Reporte narrativo de la semana, generado con IA a partir del estado del CRM y
          las interacciones. Útil para mandar cada lunes al equipo.
        </p>
        <Button onClick={generate} disabled={generating} size="sm" className="gap-1.5">
          {generating ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
          Generar reporte
        </Button>
      </div>

      {report ? (
        <TextureCard className="p-6">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReportMarkdown text={report} />
          </div>
          <div className="mt-4 flex justify-end gap-2 border-t border-border/40 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(report);
                toast.success("Reporte copiado");
              }}
              className="gap-1.5"
            >
              <CopyIcon className="size-3.5" /> Copiar
            </Button>
          </div>
        </TextureCard>
      ) : (
        <TextureCard className="p-8 text-center">
          <FileText className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium">Sin reporte generado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clic en <strong>"Generar reporte"</strong> para obtener un resumen narrativo
            de la última semana basado en los datos del CRM.
          </p>
        </TextureCard>
      )}
    </div>
  );
}

function ReportMarkdown({ text }: { text: string }) {
  // Renderer súper simple: maneja ## y - bullets
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`l-${elements.length}`} className="my-2 ml-4 list-disc space-y-1 text-sm">
          {listBuffer.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      listBuffer = [];
    }
  };
  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={i} className="mt-3 text-base font-semibold">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={i} className="text-lg font-bold">{line.slice(2)}</h1>);
    } else if (line.trim().startsWith("- ")) {
      listBuffer.push(line.trim().slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={i} className="my-1.5 text-sm">{renderInline(line)}</p>);
    }
  });
  flushList();
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Soporta **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    ),
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

/**
 * Formato de fecha contextual:
 * - <1h → "hace Xm"
 * - <24h → "hace Xh"
 * - <7d → "hace Xd"
 * - resto → "23 jun"
 */
function formatDate(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "—";
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.round(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.round(diff / 3600)}h`;
  if (diff < 86400 * 7) return `hace ${Math.round(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}
