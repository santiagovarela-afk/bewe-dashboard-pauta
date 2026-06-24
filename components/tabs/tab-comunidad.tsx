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
  Bot,
  Bell,
  Zap,
  AlertCircle,
  Filter,
  Eye,
  Power,
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
  FUNNEL_STAGES,
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
import {
  findMatchingRules,
  incrementTrigger,
  type AutomationRule,
} from "@/lib/comunidad-automations";
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
  parent_id?: string;
  platform: "ig" | "fb";
  post_id: string;
  post_caption?: string;
  post_permalink?: string;
  replies?: Comment[];
  respondedByBewe?: boolean;
  beweReplyText?: string;
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

type SubTab =
  | "resumen"
  | "comentarios-fb"
  | "comentarios-ig"
  | "comentarios-pauta"
  | "mensajes"
  | "crm"
  | "plantillas"
  | "automatizaciones"
  | "reporte";

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

      <NotificationsBanner onJump={setSub} />

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 pb-2">
        {(
          [
            { id: "resumen", label: "Resumen", icon: BarChart3, color: "text-foreground" },
            { id: "mensajes", label: "Messenger", icon: MessageSquare, color: "text-violet-400" },
            { id: "comentarios-fb", label: "Comentarios FB", icon: Facebook, color: "text-blue-400" },
            { id: "comentarios-ig", label: "Comentarios IG", icon: Instagram, color: "text-pink-400" },
            { id: "comentarios-pauta", label: "Comentarios Pauta", icon: TrendingUp, color: "text-amber-400" },
            { id: "crm", label: "CRM Contactos", icon: Users, color: "text-cyan-400" },
            { id: "plantillas", label: "Plantillas", icon: Sparkles, color: "text-fuchsia-400" },
            { id: "automatizaciones", label: "Automatizaciones", icon: Bot, color: "text-emerald-400" },
            { id: "reporte", label: "Reporte", icon: FileText, color: "text-muted-foreground" },
          ] as const
        ).map(({ id, label, icon: Icon, color }) => (
          <motion.button
            key={id}
            onClick={() => setSub(id)}
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
              sub === id
                ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/40 shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent",
            )}
          >
            <Icon className={cn("size-3.5 transition", sub === id ? color : color + " opacity-70")} />
            {label}
            {sub === id && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground/70">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/30 px-2 py-1">
            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Usuario: <span className="font-medium text-foreground/80">{user?.name}</span></span>
            <span className="text-muted-foreground/50">·</span>
            <span className="font-mono">{user?.role}</span>
          </div>
        </div>
      </div>

      <motion.div
        key={sub}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {sub === "resumen" && <Resumen onJump={setSub} />}
        {sub === "comentarios-fb" && <PostInbox platform="fb" />}
        {sub === "comentarios-ig" && <PostInbox platform="ig" />}
        {sub === "comentarios-pauta" && <PostInboxPauta />}
        {sub === "mensajes" && <Mensajes />}
        {sub === "crm" && <CRMKanban />}
        {sub === "plantillas" && <PlantillasView />}
        {sub === "automatizaciones" && <AutomatizacionesView />}
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
          sub={`${crmStats.byStage.lead + crmStats.byStage.trial + crmStats.byStage.convertido} en lead+`}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {CONTACT_STAGES.map((s) => (
            <div
              key={s.id}
              className={cn("rounded-md border p-2.5 text-center transition-transform hover:scale-[1.02]", s.bg)}
            >
              <div className="text-xl">{s.icon}</div>
              <div className={cn("text-xl font-bold mt-0.5", s.color)}>
                {crmStats.byStage[s.id] ?? 0}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">
            Calificación: <span className="font-medium text-foreground">{crmStats.qualificationRate.toFixed(0)}%</span>
          </span>
          <span className="text-muted-foreground">
            Trial: <span className="font-medium text-orange-400">{crmStats.trialRate.toFixed(0)}%</span>
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
          onSeeMore={() => onJump("comentarios-ig")}
        />
        <TopPostCard
          posts={fbPosts}
          loading={loading}
          platform="fb"
          onSeeMore={() => onJump("comentarios-fb")}
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

/**
 * Layout estilo Meta Business Suite:
 * - Lista de POSTS a la izquierda con miniatura, título, último comentario
 * - Detalle a la derecha con preview del post completo + lista de comentarios
 *   con composer inline por cada uno
 */
function PostInbox({ platform }: { platform: "ig" | "fb" }) {
  type AnyPost = (IGPost | FBPost) & { _comments?: Comment[]; _commentCount?: number };
  const { dateRange } = useDashboard();
  const [posts, setPosts] = React.useState<AnyPost[]>([]);
  const [selected, setSelected] = React.useState<AnyPost | null>(null);
  const [postComments, setPostComments] = React.useState<Comment[]>([]);
  const [loadingPosts, setLoadingPosts] = React.useState(true);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "no-respondidos" | "con-comments">("all");
  const [postFilter, setPostFilter] = React.useState<"all" | "con-pendientes">("all");
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});
  const [tagsMap, setTagsMap] = React.useState<Record<string, FunnelTag>>({});
  const [lastFetch, setLastFetch] = React.useState<number>(0);

  React.useEffect(() => {
    setStatuses(loadStatuses());
    setTagsMap(loadTags());
  }, []);

  const refreshPosts = React.useCallback(async () => {
    setLoadingPosts(true);
    try {
      const endpoint = platform === "ig" ? "/api/comunidad/ig-posts" : "/api/comunidad/fb-posts";
      // Limit 50 para tener suficientes posts para aplicar filtro por dateRange client-side
      const r = await fetch(`${endpoint}?limit=50&_t=${Date.now()}`).then((r) => r.json());
      if (r.ok) {
        setPosts(r.posts ?? []);
        setLastFetch(Date.now());
      }
    } catch {
      toast.error("Error cargando posts");
    } finally {
      setLoadingPosts(false);
    }
  }, [platform]);

  React.useEffect(() => {
    refreshPosts();
    setSelected(null);
    setPostComments([]);
  }, [refreshPosts]);

  const loadCommentsForPost = async (post: AnyPost) => {
    setSelected(post);
    setLoadingComments(true);
    try {
      const url =
        platform === "ig"
          ? `/api/comunidad/ig-comments?mediaId=${post.id}&_t=${Date.now()}`
          : `/api/comunidad/fb-comments?postId=${post.id}&_t=${Date.now()}`;
      const r = await fetch(url).then((r) => r.json());
      if (r.ok) {
        const cs = (r.comments as Comment[]) ?? [];
        const enriched = cs.map((c) => ({
          ...c,
          post_caption: platform === "ig" ? (post as IGPost).caption : (post as FBPost).message,
          post_permalink: platform === "ig" ? (post as IGPost).permalink : (post as FBPost).permalink_url,
        }));
        setPostComments(enriched);

        // Auto-upsert contactos al CRM
        const contacts = loadContacts();
        let next = contacts;
        enriched.forEach((c) => {
          const name = c.username ?? c.from?.name;
          const ts = c.timestamp ?? c.created_time ?? new Date().toISOString();
          if (name) {
            const u = upsertContact(next, { name, platform: c.platform, interactionAt: ts });
            next = u.contacts;
          }
        });
        saveContacts(next);
      }
    } catch {
      toast.error("Error cargando comentarios");
    } finally {
      setLoadingComments(false);
    }
  };

  // Filtros aplicados a la lista de posts (incluye dateRange global del dashboard)
  const filteredPosts = posts.filter((p) => {
    if (filter === "con-comments" && (p.comments_count ?? 0) === 0) return false;
    if (filter === "no-respondidos" && (p.comments_count ?? 0) === 0) return false;
    if (search) {
      const text = platform === "ig" ? (p as IGPost).caption ?? "" : (p as FBPost).message ?? "";
      if (!text.toLowerCase().includes(search.toLowerCase())) return false;
    }
    // Filtro por dateRange global (desde el selector superior del dashboard)
    const ts = platform === "ig" ? (p as IGPost).timestamp : (p as FBPost).created_time;
    if (ts && dateRange?.from && dateRange?.to) {
      const day = new Date(ts).toISOString().slice(0, 10);
      if (day < dateRange.from || day > dateRange.to) return false;
    }
    return true;
  });

  const platformDef = {
    ig: { label: "Instagram", Icon: Instagram, color: "text-pink-400", bgColor: "bg-pink-500/10" },
    fb: { label: "Facebook", Icon: Facebook, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  }[platform];

  const getPostThumb = (p: AnyPost) =>
    platform === "ig" ? (p as IGPost).thumbnail_url || (p as IGPost).media_url : (p as FBPost).full_picture;
  const getPostText = (p: AnyPost) => (platform === "ig" ? (p as IGPost).caption : (p as FBPost).message) ?? "Sin texto";
  const getPostTime = (p: AnyPost) => (platform === "ig" ? (p as IGPost).timestamp : (p as FBPost).created_time);
  const getPostLink = (p: AnyPost) => (platform === "ig" ? (p as IGPost).permalink : (p as FBPost).permalink_url);
  const getPostStats = (p: AnyPost) => {
    if (platform === "ig") {
      const ig = p as IGPost;
      return { likes: ig.like_count, comments: ig.comments_count };
    }
    return { likes: undefined, comments: (p as FBPost).comments_count };
  };

  return (
    <div className="space-y-3">
      {/* Header tipo Meta */}
      <div className="flex flex-wrap items-center gap-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("flex size-8 items-center justify-center rounded-md", platformDef.bgColor)}>
            <platformDef.Icon className={cn("size-4", platformDef.color)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Comentarios · {platformDef.label}</h3>
            <p className="text-[10px] text-muted-foreground">
              {posts.length} publicaciones · {posts.reduce((s, p) => s + (p.comments_count ?? 0), 0)} comentarios totales
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {lastFetch > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Actualizado <RelativeTime ts={lastFetch} />
            </span>
          )}
          <Button onClick={refreshPosts} variant="outline" size="sm" disabled={loadingPosts}>
            {loadingPosts ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-1.5">Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Layout 2-col */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr] min-h-[700px]">
        {/* Lista de posts (izquierda) */}
        <TextureCard className="p-3 space-y-2 flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar publicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>

          {/* Filtros chip */}
          <div className="flex flex-wrap gap-1.5">
            <ChipBtn active={filter === "all"} onClick={() => setFilter("all")} label="Todas" />
            <ChipBtn active={filter === "con-comments"} onClick={() => setFilter("con-comments")} label="Con comentarios" />
            <ChipBtn active={filter === "no-respondidos"} onClick={() => setFilter("no-respondidos")} label="🔴 Pendientes" />
          </div>

          {/* Lista */}
          <ul className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1 -mr-1">
            {loadingPosts ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : filteredPosts.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">Sin publicaciones que coincidan.</p>
            ) : (
              filteredPosts.map((p) => {
                const isSel = selected?.id === p.id;
                const thumb = getPostThumb(p);
                const text = getPostText(p);
                const stats = getPostStats(p);
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => loadCommentsForPost(p)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-md border bg-card/40 p-2 text-left transition-colors",
                        isSel ? "border-primary/50 bg-primary/5" : "border-border/40 hover:bg-card/60",
                      )}
                    >
                      <div className="size-12 shrink-0 overflow-hidden rounded bg-muted/40">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <platformDef.Icon className={cn("size-4", platformDef.color)} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium line-clamp-2 leading-snug">{text}</p>
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {formatDate(getPostTime(p) ?? "")}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <MessageCircle className="size-2.5" /> {stats.comments ?? 0}
                          </span>
                          {stats.likes !== undefined && (
                            <span className="flex items-center gap-0.5">❤️ {stats.likes}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </TextureCard>

        {/* Detalle del post + comentarios (derecha) */}
        {selected ? (
          <div className="space-y-3">
            {/* Preview del post */}
            <TextureCard className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", platformDef.bgColor)}>
                  <platformDef.Icon className={cn("size-5", platformDef.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">
                    {platform === "ig" ? "@bewe_software" : "Bewe Software"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>{formatDate(getPostTime(selected) ?? "")}</span>
                    {getPostLink(selected) && (
                      <a
                        href={getPostLink(selected)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Ver en {platformDef.label} <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {getPostThumb(selected) && (
                <div className="overflow-hidden rounded-md bg-muted/40">
                  <img
                    src={getPostThumb(selected)}
                    alt=""
                    className="max-h-[280px] w-full object-cover"
                  />
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap leading-relaxed">{getPostText(selected)}</p>

              {/* Stats del post */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-2">
                {getPostStats(selected).likes !== undefined && (
                  <span className="flex items-center gap-1">❤️ {getPostStats(selected).likes}</span>
                )}
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3" /> {getPostStats(selected).comments ?? 0} comentarios
                </span>
              </div>
            </TextureCard>

            {/* Lista de comentarios */}
            <TextureCard className="p-4">
              {/* Aviso de auto-detección */}
              <div className="mb-3 rounded-md border border-amber-500/20 bg-amber-500/[0.04] p-2.5 text-[10px] text-amber-200/80">
                <strong className="text-amber-100">ℹ️ Nota:</strong> Los comentarios que respondiste por <strong>DM privado</strong> aparecen como "sin responder" porque Meta no los registra como reply pública.
                Marca manualmente con <strong>✓</strong> los que ya atendiste por cualquier vía (DM, llamada, otro canal). El sistema solo auto-detecta respuestas tipo "reply" público.
              </div>

              <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="size-4" /> Comentarios ({postComments.length})
                </h4>
                {postComments.length > 0 && (() => {
                  const respondidos = postComments.filter((c) => c.respondedByBewe || statuses[c.id] === "respondido").length;
                  const pendientes = postComments.length - respondidos;
                  return (
                    <div className="flex items-center gap-2 text-[10px]">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                        ✓ {respondidos} respondidos
                      </Badge>
                      {pendientes > 0 && (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30">
                          🔴 {pendientes} pendientes
                        </Badge>
                      )}
                      {pendientes > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!confirm(`Marcar los ${pendientes} comentarios pendientes como respondidos?`)) return;
                            const next = { ...statuses };
                            postComments.forEach((c) => {
                              if (!c.respondedByBewe && next[c.id] !== "respondido") {
                                next[c.id] = "respondido";
                                saveStatus(c.id, "respondido");
                              }
                            });
                            setStatuses(next);
                            toast.success(`${pendientes} comentarios marcados como respondidos`);
                          }}
                          className="h-7 gap-1.5 text-[10px] border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
                        >
                          <Check className="size-3" /> Marcar todos
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
              {loadingComments ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : postComments.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Sin comentarios en este post.</p>
              ) : (
                <ul className="space-y-3">
                  {postComments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      tag={tagsMap[c.id]}
                      status={statuses[c.id]}
                      onTagChange={(t) => {
                        saveTag(c.id, t);
                        setTagsMap({ ...tagsMap, [c.id]: t });
                      }}
                      onStatusChange={(s) => {
                        saveStatus(c.id, s);
                        setStatuses({ ...statuses, [c.id]: s });
                      }}
                    />
                  ))}
                </ul>
              )}
            </TextureCard>
          </div>
        ) : (
          <TextureCard className="flex items-center justify-center p-12 text-center">
            <div>
              <platformDef.Icon className={cn("size-12 mx-auto mb-3 opacity-30", platformDef.color)} />
              <p className="text-sm font-medium">Selecciona una publicación</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                Elige un post de la lista para ver su contenido completo y todos los comentarios con sus respuestas.
              </p>
            </div>
          </TextureCard>
        )}
      </div>
    </div>
  );
}

/** Comentario individual con composer inline (estilo Meta). */
function CommentItem({
  comment,
  tag,
  status,
  onTagChange,
  onStatusChange,
}: {
  comment: Comment;
  tag?: FunnelTag;
  status?: string;
  onTagChange: (t: FunnelTag) => void;
  onStatusChange: (s: "nuevo" | "leido" | "respondido") => void;
}) {
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [showReply, setShowReply] = React.useState(false);
  const [showDM, setShowDM] = React.useState(false);
  const [dmText, setDmText] = React.useState("");
  const [sendingDM, setSendingDM] = React.useState(false);
  const tagDef = tag ? getTagDef(tag) : null;
  // Meta restringe from.name en comentarios públicos por privacy
  const rawAuthor = comment.username ?? comment.from?.name ?? "";
  const author = rawAuthor.trim() || (comment.platform === "ig" ? "Usuario Instagram" : "Usuario Facebook");
  const isAnonymous = !rawAuthor.trim();
  const time = comment.timestamp ?? comment.created_time ?? "";

  // ─── AUTOMATIZACIONES · matchear reglas configuradas ──────────────────
  const matchingRules = React.useMemo(() => {
    return findMatchingRules(comment.text, {
      platform: comment.platform,
      channel: "comment",
    });
  }, [comment.text, comment.platform]);

  const applyRuleAction = async (rule: AutomationRule) => {
    incrementTrigger(rule.id);
    const action = rule.action;
    if (action.type === "suggest-template") {
      const templates = loadTemplates();
      const target = templates.find((t) => t.id === action.templateId);
      if (target) {
        const firstName = author.split(" ")[0];
        let body = applyTemplateVars(target.text, { nombre: firstName });
        if (target.urlBase) {
          const link = buildUTMUrl(target.urlBase, {
            platform: comment.platform,
            industry: target.industry,
            intent: target.intent,
          });
          body = body.replace(/\{\{link\}\}/g, link);
        } else {
          body = body.replace(/\{\{link\}\}/g, "");
        }
        setReply(body);
        setShowReply(true);
        incrementTemplateUse(target.id);
        toast.success(`Plantilla "${target.name}" cargada (regla: ${rule.name})`);
      } else {
        toast.error(`Plantilla ${action.templateId} no encontrada`);
      }
    } else if (action.type === "move-stage") {
      const stage = action.stage;
      const contacts = loadContacts();
      const name = comment.username ?? comment.from?.name;
      if (name) {
        const upserted = upsertContact(contacts, {
          name,
          platform: comment.platform,
          interactionAt: time,
        });
        const moved = moveContactToStage(upserted.contacts, upserted.contact.id, stage);
        saveContacts(moved);
        toast.success(`Contacto movido a "${stage}" (regla: ${rule.name})`);
      } else {
        toast.error("Comentario anónimo · no se puede mover en CRM");
      }
    } else if (action.type === "notify-only") {
      toast.info(`Regla "${rule.name}" matcheó este comentario`);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const url = comment.platform === "ig" ? "/api/comunidad/ig-comments" : "/api/comunidad/fb-comments";
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id, message: reply.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        toast.success("Respuesta enviada");
        onStatusChange("respondido");
        setReply("");
        setShowReply(false);
      } else {
        toast.error("Error: " + (d.error ?? "no se pudo"));
      }
    } finally {
      setSending(false);
    }
  };

  const sendPrivateDM = async () => {
    if (!dmText.trim()) return;
    setSendingDM(true);
    try {
      if (comment.platform === "ig") {
        if (!comment.username) {
          toast.error("Sin username");
          return;
        }
        window.open(`https://ig.me/m/${comment.username}`, "_blank", "noopener,noreferrer");
        toast.success("Abriendo chat IG en pestaña nueva");
        setShowDM(false);
        return;
      }
      const r = await fetch("/api/comunidad/private-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id, platform: comment.platform, message: dmText.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        toast.success("DM privado enviado");
        onStatusChange("respondido");
        setDmText("");
        setShowDM(false);
      } else {
        toast.error("Error: " + (d.error ?? "no se pudo"));
      }
    } finally {
      setSendingDM(false);
    }
  };

  // Detecta si Bewe ya respondió a este comentario (replies anidadas desde Meta)
  // o si el usuario lo marcó manualmente como respondido
  const beweResponded = comment.respondedByBewe || status === "respondido";

  return (
    <li className={cn(
      "space-y-2 rounded-md border p-3 transition-colors",
      beweResponded
        ? "border-emerald-500/30 bg-emerald-500/[0.04]"
        : "border-border/40 bg-card/30",
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isAnonymous
            ? comment.platform === "ig"
              ? "bg-gradient-to-br from-pink-500/30 to-purple-500/10 text-pink-200"
              : "bg-gradient-to-br from-blue-500/30 to-cyan-500/10 text-blue-200"
            : "bg-gradient-to-br from-primary/30 to-primary/10 text-primary",
        )}>
          {isAnonymous ? (
            comment.platform === "ig" ? <Instagram className="size-4" /> : <Facebook className="size-4" />
          ) : (
            author.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium">{author}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDate(time)}</span>
            {comment.respondedByBewe && (
              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-emerald-500/15 text-emerald-300 border-emerald-500/40 gap-0.5">
                <Check className="size-2" /> Bewe respondió
              </Badge>
            )}
            {!comment.respondedByBewe && status === "respondido" && (
              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                <Check className="size-2 mr-0.5" /> marcado
              </Badge>
            )}
            {!comment.respondedByBewe && !status && (
              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-rose-500/10 text-rose-300 border-rose-500/30 gap-0.5">
                🔴 sin responder
              </Badge>
            )}
            {tagDef && (
              <Badge variant="outline" className={cn("text-[9px] py-0 h-4", tagDef.bg)}>
                {tagDef.icon}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed">{comment.text}</p>

          {/* Sugerencia IA por automatización (si alguna regla matchea el texto) */}
          {matchingRules.length > 0 && !status && !comment.respondedByBewe && (
            <div className="mt-2 rounded-md border border-violet-500/30 bg-gradient-to-r from-violet-500/[0.08] to-fuchsia-500/[0.06] p-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-200">
                <Sparkles className="size-2.5" /> Sugerencia IA · {matchingRules.length} regla{matchingRules.length === 1 ? "" : "s"} matchea{matchingRules.length === 1 ? "" : "n"}
              </div>
              <div className="flex flex-wrap gap-1">
                {matchingRules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => applyRuleAction(rule)}
                    className="rounded-md bg-violet-500/15 border border-violet-500/40 px-2 py-1 text-[10px] hover:bg-violet-500/25 transition flex items-center gap-1 text-violet-100"
                  >
                    <Zap className="size-2.5" />
                    {rule.name}
                    <span className="text-violet-300/60 ml-1">
                      →{rule.action.type === "suggest-template" ? " plantilla" : rule.action.type === "move-stage" ? " mover" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Respuestas de Bewe (replies anidadas desde Meta) */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-1.5 border-l-2 border-emerald-500/30 pl-3">
              {comment.replies.map((r) => {
                const isBewe = (r.username === "bewe_software") || (r.from?.name?.toLowerCase().includes("bewe") ?? false);
                return (
                  <div key={r.id} className={cn(
                    "rounded-md p-2 text-xs",
                    isBewe ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-muted/30",
                  )}>
                    <div className="flex items-center gap-1.5 text-[10px] mb-0.5">
                      {isBewe && <Check className="size-2.5 text-emerald-400" />}
                      <span className={cn("font-medium", isBewe ? "text-emerald-300" : "")}>
                        {isBewe ? "Bewe Software" : (r.from?.name ?? r.username ?? "Anónimo")}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{formatDate(r.timestamp ?? r.created_time ?? "")}</span>
                    </div>
                    <p className="text-foreground/90">{r.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Acciones estilo Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-medium">
            <button
              onClick={() => setShowReply((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition"
            >
              💬 Responder
            </button>
            <button
              onClick={() => setShowDM((v) => !v)}
              className="text-violet-400 hover:text-violet-300 transition"
            >
              ✉️ Enviar DM
            </button>
            <button
              onClick={() => onStatusChange("respondido")}
              className="text-emerald-400 hover:text-emerald-300 transition"
            >
              ✓ Marcar respondido
            </button>
            <div className="ml-auto flex items-center gap-1">
              {FUNNEL_TAGS.slice(0, 7).map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTagChange(t.id)}
                  title={t.label}
                  className={cn(
                    "size-5 rounded text-[10px] transition-colors",
                    tag === t.id ? t.bg : "opacity-40 hover:opacity-100",
                  )}
                >
                  {t.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Composer inline de respuesta */}
          {showReply && (
            <div className="mt-2 space-y-1.5 rounded-md border border-primary/20 bg-primary/[0.03] p-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Responder a ${author}...`}
                rows={2}
                className="text-xs"
              />
              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setShowReply(false)} variant="ghost" size="sm" className="h-7 text-[10px]">
                  Cancelar
                </Button>
                <Button onClick={sendReply} disabled={sending || !reply.trim()} size="sm" className="h-7 gap-1.5">
                  {sending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                  Responder
                </Button>
              </div>
            </div>
          )}

          {/* Composer inline de DM privado */}
          {showDM && (
            <div className="mt-2 space-y-1.5 rounded-md border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.08] to-violet-500/[0.02] p-2">
              <p className="text-[10px] text-violet-200">
                {comment.platform === "ig"
                  ? "Para IG el DM se abre en Instagram (limitación de scope)."
                  : "Envía UN DM privado al autor (válido hasta 7d después del comentario)."}
              </p>
              {comment.platform === "fb" && (
                <Textarea
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  placeholder={`Hola ${author.split(" ")[0]}! Te escribo en privado para...`}
                  rows={2}
                  className="text-xs"
                />
              )}
              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setShowDM(false)} variant="ghost" size="sm" className="h-7 text-[10px]">
                  Cancelar
                </Button>
                <Button
                  onClick={sendPrivateDM}
                  disabled={sendingDM || (comment.platform === "fb" && !dmText.trim())}
                  size="sm"
                  className="h-7 gap-1.5"
                >
                  {sendingDM ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                  {comment.platform === "ig" ? "Abrir chat IG" : "Enviar DM"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function ChipBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors",
        active
          ? "bg-primary/15 text-primary border-primary/40"
          : "border-border/40 text-muted-foreground hover:bg-muted/40",
      )}
    >
      {label}
    </button>
  );
}

function RelativeTime({ ts }: { ts: number }) {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const i = setInterval(() => force(), 15_000);
    return () => clearInterval(i);
  }, []);
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return <>hace {Math.max(1, Math.round(diff))}s</>;
  if (diff < 3600) return <>hace {Math.round(diff / 60)}m</>;
  return <>hace {Math.round(diff / 3600)}h</>;
}

// ─── BANNER NOTIFICACIONES ─────────────────────────────────────────────────

function NotificationsBanner({ onJump }: { onJump: (s: SubTab) => void }) {
  const [pendingComments, setPendingComments] = React.useState(0);
  const [pendingMessages, setPendingMessages] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const statuses = loadStatuses();
        const [igRes, fbRes, msgRes] = await Promise.all([
          fetch("/api/comunidad/ig-posts?limit=15&_t=" + Date.now()).then((r) => r.json()),
          fetch("/api/comunidad/fb-posts?limit=15&_t=" + Date.now()).then((r) => r.json()),
          fetch("/api/comunidad/messenger?limit=25&_t=" + Date.now()).then((r) => r.json()),
        ]);

        // Mensajes sin responder
        const convs: Conversation[] = msgRes.ok ? (msgRes.conversations ?? []) : [];
        const pendingMsgs = convs.filter((c) => statuses[c.id] !== "respondido").length;
        setPendingMessages(pendingMsgs);

        // Comentarios sin responder — aproximación basada en comments_count total
        const igTotal = (igRes.posts ?? []).reduce(
          (s: number, p: IGPost) => s + (p.comments_count ?? 0),
          0,
        );
        const fbTotal = (fbRes.posts ?? []).reduce(
          (s: number, p: FBPost) => s + (p.comments_count ?? 0),
          0,
        );
        const respondedComments = Object.entries(statuses).filter(
          ([id, s]) => s === "respondido" && !id.startsWith("t_"),
        ).length;
        setPendingComments(Math.max(0, igTotal + fbTotal - respondedComments));
      } catch {
        // silenciar
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  if (!loaded || (pendingComments === 0 && pendingMessages === 0)) {
    return null;
  }

  const total = pendingComments + pendingMessages;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.10] via-orange-500/[0.06] to-rose-500/[0.04] p-4 shadow-lg shadow-amber-500/5"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="relative flex items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 ring-2 ring-amber-500/30 shrink-0"
        >
          <Bell className="size-5 text-amber-200" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-50 flex items-center gap-2">
            <span className="text-lg tabular-nums">{total}</span>
            <span>pendiente{total === 1 ? "" : "s"} por responder</span>
          </p>
          <div className="text-xs text-amber-200/80 mt-1 flex items-center gap-3 flex-wrap">
            {pendingMessages > 0 && (
              <button
                onClick={() => onJump("mensajes")}
                className="flex items-center gap-1 hover:text-amber-50 transition group"
              >
                <MessageSquare className="size-3 group-hover:scale-110 transition" />
                <span className="font-medium">{pendingMessages}</span> Messenger
              </button>
            )}
            {pendingComments > 0 && (
              <button
                onClick={() => onJump("comentarios-fb")}
                className="flex items-center gap-1 hover:text-amber-50 transition group"
              >
                <MessageCircle className="size-3 group-hover:scale-110 transition" />
                <span className="font-medium">~{pendingComments}</span> comentarios
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {pendingMessages > 0 && (
            <Button
              size="sm"
              onClick={() => onJump("mensajes")}
              className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-amber-950 border-0 shadow-md shadow-amber-500/30"
            >
              <MessageSquare className="size-3.5" /> Ver Messenger
            </Button>
          )}
          {pendingComments > 0 && pendingMessages === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onJump("comentarios-fb")}
              className="gap-1.5 border-amber-500/40 hover:bg-amber-500/10"
            >
              <MessageCircle className="size-3.5" /> Ver comentarios
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── COMENTARIOS PAUTA (ads activos · dark posts) ─────────────────────────

interface AdPost {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  post_id: string;
  platform: "fb" | "ig";
  message?: string;
  caption?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  thumbnail_url?: string;
  comments_count?: number;
  like_count?: number;
}

function PostInboxPauta() {
  const [posts, setPosts] = React.useState<AdPost[]>([]);
  const [selected, setSelected] = React.useState<AdPost | null>(null);
  const [postComments, setPostComments] = React.useState<Comment[]>([]);
  const [loadingPosts, setLoadingPosts] = React.useState(true);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [platformFilter, setPlatformFilter] = React.useState<"all" | "ig" | "fb">("all");
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});
  const [tagsMap, setTagsMap] = React.useState<Record<string, FunnelTag>>({});
  const [lastFetch, setLastFetch] = React.useState<number>(0);

  React.useEffect(() => {
    setStatuses(loadStatuses());
    setTagsMap(loadTags());
  }, []);

  const refresh = React.useCallback(async () => {
    setLoadingPosts(true);
    try {
      const r = await fetch(`/api/comunidad/ad-posts?_t=${Date.now()}`).then((r) => r.json());
      if (r.ok) {
        setPosts(r.posts ?? []);
        setLastFetch(Date.now());
      } else {
        toast.error("Error: " + (r.error ?? "no se pudieron cargar ads"));
      }
    } catch {
      toast.error("Error cargando publicaciones de pauta");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const loadCommentsForPost = async (post: AdPost) => {
    setSelected(post);
    setLoadingComments(true);
    try {
      const url =
        post.platform === "ig"
          ? `/api/comunidad/ig-comments?mediaId=${post.post_id}&_t=${Date.now()}`
          : `/api/comunidad/fb-comments?postId=${post.post_id}&_t=${Date.now()}`;
      const r = await fetch(url).then((r) => r.json());
      if (r.ok) {
        const cs = (r.comments as Comment[]) ?? [];
        const enriched = cs.map((c) => ({
          ...c,
          post_caption: post.caption ?? post.message,
          post_permalink: post.permalink_url,
        }));
        setPostComments(enriched);

        // Auto-upsert al CRM
        const contacts = loadContacts();
        let next = contacts;
        enriched.forEach((c) => {
          const name = c.username ?? c.from?.name;
          const ts = c.timestamp ?? c.created_time ?? new Date().toISOString();
          if (name) {
            const u = upsertContact(next, { name, platform: c.platform, interactionAt: ts });
            next = u.contacts;
          }
        });
        saveContacts(next);
      }
    } catch {
      toast.error("Error cargando comentarios del anuncio");
    } finally {
      setLoadingComments(false);
    }
  };

  const filtered = posts.filter((p) => {
    if (platformFilter !== "all" && p.platform !== platformFilter) return false;
    if (search) {
      const text = (p.caption ?? p.message ?? "") + " " + p.campaign_name + " " + p.ad_name;
      if (!text.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const totalComments = posts.reduce((s, p) => s + (p.comments_count ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10">
            <TrendingUp className="size-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Comentarios en publicaciones de Pauta</h3>
            <p className="text-[10px] text-muted-foreground">
              {posts.length} anuncios activos · {totalComments} comentarios totales · Solo posts de ads ACTIVE
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {lastFetch > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Actualizado <RelativeTime ts={lastFetch} />
            </span>
          )}
          <Button onClick={refresh} variant="outline" size="sm" disabled={loadingPosts}>
            {loadingPosts ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-1.5">Actualizar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr] min-h-[700px]">
        {/* Lista de ad posts */}
        <TextureCard className="p-3 space-y-2 flex flex-col">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por campaña, anuncio o texto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <ChipBtn active={platformFilter === "all"} onClick={() => setPlatformFilter("all")} label="Todas" />
            <ChipBtn active={platformFilter === "fb"} onClick={() => setPlatformFilter("fb")} label="Facebook" />
            <ChipBtn active={platformFilter === "ig"} onClick={() => setPlatformFilter("ig")} label="Instagram" />
          </div>

          <ul className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1 -mr-1">
            {loadingPosts ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
            ) : filtered.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                Sin publicaciones de pauta activas con esos filtros.
              </p>
            ) : (
              filtered.map((p) => {
                const isSel = selected?.post_id === p.post_id;
                const thumb = p.thumbnail_url || p.full_picture;
                const text = p.caption ?? p.message ?? "Sin texto";
                return (
                  <li key={p.post_id}>
                    <button
                      onClick={() => loadCommentsForPost(p)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-md border bg-card/40 p-2 text-left transition-colors",
                        isSel ? "border-amber-500/50 bg-amber-500/5" : "border-border/40 hover:bg-card/60",
                      )}
                    >
                      <div className="size-12 shrink-0 overflow-hidden rounded bg-muted/40 relative">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {p.platform === "ig" ? (
                              <Instagram className="size-4 text-pink-400" />
                            ) : (
                              <Facebook className="size-4 text-blue-400" />
                            )}
                          </div>
                        )}
                        <div className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 flex items-center justify-center">
                          <TrendingUp className="size-2.5 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          {p.platform === "ig" ? (
                            <Instagram className="size-2.5 text-pink-400 shrink-0" />
                          ) : (
                            <Facebook className="size-2.5 text-blue-400 shrink-0" />
                          )}
                          <span className="text-[9px] text-amber-300 font-medium truncate">
                            {p.campaign_name}
                          </span>
                        </div>
                        <p className="text-xs font-medium line-clamp-2 leading-snug">{text}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <MessageCircle className="size-2.5" /> {p.comments_count ?? 0}
                          </span>
                          {p.like_count !== undefined && (
                            <span className="flex items-center gap-0.5">❤️ {p.like_count}</span>
                          )}
                          <span>·</span>
                          <span>{formatDate(p.created_time ?? "")}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </TextureCard>

        {/* Detalle del post + comentarios */}
        {selected ? (
          <div className="space-y-3">
            <TextureCard className="p-4 space-y-3">
              {/* Banner de pauta */}
              <div className="rounded-md border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-amber-500/[0.02] p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                  <TrendingUp className="size-3.5" /> Publicación en PAUTA activa
                </div>
                <div className="text-[10px] text-amber-200/70">
                  Campaña: <span className="font-mono">{selected.campaign_name}</span>
                </div>
                <div className="text-[10px] text-amber-200/70">
                  Anuncio: <span className="font-mono">{selected.ad_name}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", selected.platform === "ig" ? "bg-pink-500/10" : "bg-blue-500/10")}>
                  {selected.platform === "ig" ? (
                    <Instagram className="size-5 text-pink-400" />
                  ) : (
                    <Facebook className="size-5 text-blue-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">
                    {selected.platform === "ig" ? "@bewe_software" : "Bewe Software"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-2">
                    <span>{formatDate(selected.created_time ?? "")}</span>
                    {selected.permalink_url && (
                      <a
                        href={selected.permalink_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Ver post <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {(selected.thumbnail_url || selected.full_picture) && (
                <div className="overflow-hidden rounded-md bg-muted/40">
                  <img
                    src={selected.thumbnail_url || selected.full_picture}
                    alt=""
                    className="max-h-[280px] w-full object-cover"
                  />
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {selected.caption ?? selected.message ?? "Sin texto"}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-2">
                {selected.like_count !== undefined && <span className="flex items-center gap-1">❤️ {selected.like_count}</span>}
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3" /> {selected.comments_count ?? 0} comentarios
                </span>
              </div>
            </TextureCard>

            <TextureCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="size-4" /> Comentarios del anuncio ({postComments.length})
                </h4>
              </div>
              {loadingComments ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : postComments.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Sin comentarios en este anuncio todavía.
                </p>
              ) : (
                <ul className="space-y-3">
                  {postComments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      tag={tagsMap[c.id]}
                      status={statuses[c.id]}
                      onTagChange={(t) => {
                        saveTag(c.id, t);
                        setTagsMap({ ...tagsMap, [c.id]: t });
                      }}
                      onStatusChange={(s) => {
                        saveStatus(c.id, s);
                        setStatuses({ ...statuses, [c.id]: s });
                      }}
                    />
                  ))}
                </ul>
              )}
            </TextureCard>
          </div>
        ) : (
          <TextureCard className="flex items-center justify-center p-12 text-center">
            <div>
              <TrendingUp className="size-12 mx-auto mb-3 opacity-30 text-amber-400" />
              <p className="text-sm font-medium">Selecciona una publicación de pauta</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                Verás el anuncio completo, su campaña, y todos los comentarios que ha generado.
              </p>
            </div>
          </TextureCard>
        )}
      </div>
    </div>
  );
}

// ─── AUTOMATIZACIONES ──────────────────────────────────────────────────────

function AutomatizacionesView() {
  const [rules, setRules] = React.useState<import("@/lib/comunidad-automations").AutomationRule[]>([]);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<import("@/lib/comunidad-automations").AutomationRule | null>(null);

  React.useEffect(() => {
    import("@/lib/comunidad-automations").then((m) => setRules(m.loadAutomations()));
  }, []);

  const saveAll = async (next: typeof rules) => {
    setRules(next);
    const m = await import("@/lib/comunidad-automations");
    m.saveAutomations(next);
  };

  const toggleRule = (id: string) => {
    const next = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    saveAll(next);
  };

  const deleteRule = (id: string) => {
    if (!confirm("¿Borrar esta regla?")) return;
    const next = rules.filter((r) => r.id !== id);
    saveAll(next);
    toast.success("Regla eliminada");
  };

  const startNew = () => {
    const id = "custom-" + Date.now();
    setDraft({
      id,
      name: "Nueva automatización",
      enabled: false,
      matchType: "include",
      keywords: [],
      platforms: ["ig", "fb", "messenger"],
      channels: ["comment", "message"],
      action: { type: "notify-only" },
      triggeredCount: 0,
      createdAt: new Date().toISOString(),
    });
    setEditing(id);
  };

  const saveDraft = () => {
    if (!draft) return;
    if (draft.keywords.length === 0) {
      toast.error("Agrega al menos un keyword");
      return;
    }
    const idx = rules.findIndex((r) => r.id === draft.id);
    const next = idx >= 0 ? rules.map((r, i) => (i === idx ? draft : r)) : [...rules, draft];
    saveAll(next);
    setEditing(null);
    setDraft(null);
    toast.success("Regla guardada");
  };

  const activeCount = rules.filter((r) => r.enabled).length;
  const totalTriggers = rules.reduce((s, r) => s + (r.triggeredCount ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Bot className="size-5 text-emerald-400" /> Automatizaciones
          </h3>
          <p className="text-xs text-muted-foreground">
            Reglas de keyword → acción. Hoy <strong>solo sugieren</strong> (no responden solas).
            Cuando integremos webhooks de Meta, podremos ejecutar automáticamente.
          </p>
        </div>
        <Button onClick={startNew} size="sm" className="gap-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500">
          <Plus className="size-3.5" /> Nueva regla
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <TextureCard className="p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
          <div className="text-[10px] text-muted-foreground">Reglas activas</div>
        </TextureCard>
        <TextureCard className="p-3 text-center">
          <div className="text-2xl font-bold">{rules.length}</div>
          <div className="text-[10px] text-muted-foreground">Total configuradas</div>
        </TextureCard>
        <TextureCard className="p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{totalTriggers}</div>
          <div className="text-[10px] text-muted-foreground">Veces sugerida</div>
        </TextureCard>
      </div>

      {/* Lista de reglas */}
      <div className="grid gap-3 md:grid-cols-2">
        {rules.map((r) => {
          const isEditing = editing === r.id && draft?.id === r.id;
          if (isEditing && draft) {
            return <AutomationEditor key={r.id} draft={draft} setDraft={setDraft} onSave={saveDraft} onCancel={() => { setEditing(null); setDraft(null); }} />;
          }
          return (
            <TextureCard key={r.id} className={cn("p-4 space-y-3", r.enabled ? "" : "opacity-60")}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className={cn("flex size-8 items-center justify-center rounded-md", r.enabled ? "bg-emerald-500/15" : "bg-muted/40")}>
                    <Zap className={cn("size-4", r.enabled ? "text-emerald-400" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate">{r.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {r.triggeredCount > 0 ? `Activada ${r.triggeredCount} ${r.triggeredCount === 1 ? "vez" : "veces"}` : "Aún no se ha activado"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <Button onClick={() => toggleRule(r.id)} variant="ghost" size="icon" className="size-7" title={r.enabled ? "Desactivar" : "Activar"}>
                    <Power className={cn("size-3.5", r.enabled ? "text-emerald-400" : "text-muted-foreground")} />
                  </Button>
                  <Button onClick={() => { setDraft(r); setEditing(r.id); }} variant="ghost" size="icon" className="size-7">
                    <Edit3 className="size-3" />
                  </Button>
                  <Button onClick={() => deleteRule(r.id)} variant="ghost" size="icon" className="size-7 text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Si el mensaje contiene
                </p>
                <div className="flex flex-wrap gap-1">
                  {r.keywords.slice(0, 6).map((k) => (
                    <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>
                  ))}
                  {r.keywords.length > 6 && (
                    <Badge variant="outline" className="text-[10px]">+{r.keywords.length - 6}</Badge>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] p-2">
                <p className="text-[9px] uppercase tracking-wider text-emerald-300 mb-0.5">Acción</p>
                <p className="text-xs">
                  {r.action.type === "suggest-template" && (
                    <>💡 Sugerir plantilla <code className="font-mono">{r.action.templateId}</code></>
                  )}
                  {r.action.type === "move-stage" && (
                    <>🎯 Mover contacto a <code className="font-mono">{r.action.stage}</code></>
                  )}
                  {r.action.type === "auto-tag" && (
                    <>🏷️ Auto-etiquetar como <code className="font-mono">{r.action.tag}</code></>
                  )}
                  {r.action.type === "notify-only" && <>🔔 Solo notificar</>}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                <Badge variant="outline" className="text-[9px]">{r.matchType}</Badge>
                {r.platforms.map((p) => (
                  <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>
                ))}
                {r.channels.map((c) => (
                  <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>
                ))}
              </div>
            </TextureCard>
          );
        })}
        {editing && draft && !rules.find((r) => r.id === draft.id) && (
          <AutomationEditor draft={draft} setDraft={setDraft} onSave={saveDraft} onCancel={() => { setEditing(null); setDraft(null); }} />
        )}
      </div>
    </div>
  );
}

function AutomationEditor({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: import("@/lib/comunidad-automations").AutomationRule;
  setDraft: (d: import("@/lib/comunidad-automations").AutomationRule | null) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [kwInput, setKwInput] = React.useState("");
  const addKw = () => {
    const k = kwInput.trim();
    if (!k) return;
    if (draft.keywords.includes(k)) return;
    setDraft({ ...draft, keywords: [...draft.keywords, k] });
    setKwInput("");
  };
  const removeKw = (k: string) => setDraft({ ...draft, keywords: draft.keywords.filter((x) => x !== k) });

  return (
    <TextureCard className="p-4 space-y-3 md:col-span-2 border-emerald-500/40 bg-emerald-500/[0.03]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
        <Edit3 className="size-3" /> {draft.id.startsWith("custom-") ? "Nueva regla" : "Editando"}
      </div>

      <Input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="Nombre descriptivo (ej: Pregunta por precios)"
      />

      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Keywords (al menos 1)</label>
        <div className="mt-1 flex gap-1.5">
          <Input
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKw())}
            placeholder="precio, cuánto cuesta, info..."
            className="text-xs"
          />
          <Button onClick={addKw} size="sm" variant="outline">Agregar</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {draft.keywords.map((k) => (
            <button
              key={k}
              onClick={() => removeKw(k)}
              className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] hover:bg-rose-500/20 transition"
            >
              {k} ✕
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Match</label>
          <Select value={draft.matchType} onValueChange={(v) => setDraft({ ...draft, matchType: v as typeof draft.matchType })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="include">Contiene</SelectItem>
              <SelectItem value="exact">Exacto</SelectItem>
              <SelectItem value="regex">Regex</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Acción</label>
          <Select
            value={draft.action.type}
            onValueChange={(v) => {
              const t = v as "suggest-template" | "move-stage" | "auto-tag" | "notify-only";
              const newAction: import("@/lib/comunidad-automations").AutomationAction =
                t === "suggest-template"
                  ? { type: "suggest-template", templateId: "info-belleza" }
                  : t === "move-stage"
                    ? { type: "move-stage", stage: "interesado" }
                    : t === "auto-tag"
                      ? { type: "auto-tag", tag: "interesado" }
                      : { type: "notify-only" };
              setDraft({ ...draft, action: newAction });
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="suggest-template">Sugerir plantilla</SelectItem>
              <SelectItem value="move-stage">Mover en CRM</SelectItem>
              <SelectItem value="notify-only">Solo notificar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {draft.action.type === "suggest-template" && (
        <Input
          value={draft.action.templateId}
          onChange={(e) => setDraft({ ...draft, action: { type: "suggest-template", templateId: e.target.value } })}
          placeholder="ID de plantilla (ej: precios-belleza)"
          className="text-xs"
        />
      )}
      {draft.action.type === "move-stage" && (
        <Select
          value={draft.action.stage}
          onValueChange={(v) => setDraft({ ...draft, action: { type: "move-stage", stage: v as import("@/lib/comunidad-crm").ContactStage } })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_STAGES.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.icon} {s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors",
              draft.enabled
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                : "border-border/40 text-muted-foreground",
            )}
          >
            {draft.enabled ? "✓ Activa" : "○ Inactiva"}
          </button>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="ghost" size="sm">Cancelar</Button>
          <Button onClick={onSave} size="sm" className="gap-1.5">
            <Check className="size-3.5" /> Guardar
          </Button>
        </div>
      </div>
    </TextureCard>
  );
}

// ─── LEGACY: vista vieja de comentarios (mantengo refs por compatibilidad) ─

function ComentariosLegacy() {
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

      <DMShortcut comment={comment} />

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

/**
 * Atajo para iniciar conversación privada desde un comentario público.
 * - FB: usa Private Reply API (envía DM directo al autor, máx 7d post-comment)
 * - IG: abre ig.me/m/{username} en nueva pestaña (falta scope manage_messages)
 */
function DMShortcut({ comment }: { comment: Comment }) {
  const [dmText, setDmText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const sendFBPrivate = async () => {
    if (!dmText.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/comunidad/private-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: comment.id, platform: "fb", message: dmText.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        toast.success("DM privado enviado al autor del comentario");
        setDmText("");
        setExpanded(false);
        saveStatus(comment.id, "respondido");
      } else {
        toast.error(d.error ?? "No se pudo enviar el DM privado");
      }
    } finally {
      setSending(false);
    }
  };

  const openIGChat = () => {
    if (!comment.username) {
      toast.error("Sin username · no puedo abrir el chat IG");
      return;
    }
    window.open(`https://ig.me/m/${comment.username}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-md border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.08] to-violet-500/[0.02] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
          <Send className="size-3.5" />
          Mover a conversación privada
        </div>
        {!expanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (comment.platform === "ig" ? openIGChat() : setExpanded(true))}
            className="gap-1.5 h-7 text-[10px]"
          >
            {comment.platform === "ig" ? (
              <>
                <Instagram className="size-3 text-pink-400" /> Abrir chat IG ↗
              </>
            ) : (
              <>
                <MessageSquare className="size-3 text-violet-400" /> Enviar DM privado
              </>
            )}
          </Button>
        )}
      </div>
      {comment.platform === "fb" && expanded && (
        <>
          <p className="text-[10px] text-muted-foreground">
            Meta permite UN DM privado al autor del comentario (válido hasta 7d después del
            comentario). Se enviará desde la página de Bewe.
          </p>
          <Textarea
            value={dmText}
            onChange={(e) => setDmText(e.target.value)}
            placeholder={`Hola ${comment.from?.name?.split(" ")[0] ?? ""}! Te escribo en privado para...`}
            rows={3}
            className="text-xs"
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              Cancelar
            </Button>
            <Button onClick={sendFBPrivate} disabled={sending || !dmText.trim()} size="sm" className="gap-1.5">
              {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Enviar DM
            </Button>
          </div>
        </>
      )}
      {comment.platform === "ig" && (
        <p className="text-[10px] text-muted-foreground">
          Para Instagram el DM se abre en una pestaña nueva (limitación de permisos de Meta).
          Hablas con @{comment.username} directamente desde Instagram.
        </p>
      )}
    </div>
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
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});
  const [filter, setFilter] = React.useState<"all" | "no-respondidos" | "unread">("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setTagsMap(loadTags());
    setStatuses(loadStatuses());
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

  // Aplicar filtros: pendientes (no respondidos) + unread + búsqueda
  const filteredConvs = conversations.filter((c) => {
    if (filter === "no-respondidos" && statuses[c.id] === "respondido") return false;
    if (filter === "unread" && (c.unread_count ?? 0) === 0) return false;
    if (search) {
      const name = otherParticipant(c).toLowerCase();
      const snippet = (c.snippet ?? "").toLowerCase();
      const q = search.toLowerCase();
      if (!name.includes(q) && !snippet.includes(q)) return false;
    }
    return true;
  });

  const pendingCount = conversations.filter((c) => statuses[c.id] !== "respondido").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1.5 text-[10px]">
          <MessageSquare className="size-3 text-violet-400" /> Messenger Facebook
        </Badge>
        <span className="text-xs text-muted-foreground">
          {conversations.length} conversaciones · <strong className="text-rose-300">{pendingCount} pendientes</strong>
        </span>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="ml-1.5">Actualizar</span>
        </Button>
      </div>

      {/* Filtros chip + búsqueda */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-md border border-border/60 bg-card/40 p-0.5">
          <ChipBtn active={filter === "all"} onClick={() => setFilter("all")} label={`Todas (${conversations.length})`} />
          <ChipBtn active={filter === "no-respondidos"} onClick={() => setFilter("no-respondidos")} label={`🔴 Pendientes (${pendingCount})`} />
          <ChipBtn active={filter === "unread"} onClick={() => setFilter("unread")} label="Sin leer" />
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
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
              {filteredConvs.map((c) => {
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

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
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

type CategoryFilter =
  | "all"
  | "top"
  | "custom"
  | `industry:${Industry}`
  | `intent:${Intent}`;

function PlantillasView() {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Template | null>(null);
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const [search, setSearch] = React.useState("");
  const [previewPlatform, setPreviewPlatform] = React.useState<"ig" | "fb" | "messenger">("ig");

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
      industry: "general",
      intent: "info",
      urlBase: "",
      text: "",
      useCount: 0,
      createdAt: new Date().toISOString(),
    });
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

  // Filtros aplicados
  const filtered = React.useMemo(() => {
    let list = [...templates];
    if (category === "top") list = list.sort((a, b) => b.useCount - a.useCount).slice(0, 8);
    else if (category === "custom") list = list.filter((t) => t.id.startsWith("custom-"));
    else if (category.startsWith("industry:")) {
      const ind = category.slice("industry:".length) as Industry;
      list = list.filter((t) => t.industry === ind);
    } else if (category.startsWith("intent:")) {
      const intent = category.slice("intent:".length) as Intent;
      list = list.filter((t) => t.intent === intent);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.text.toLowerCase().includes(q) ||
          t.industry.toLowerCase().includes(q),
      );
    }
    if (category !== "top") list = list.sort((a, b) => b.useCount - a.useCount);
    return list;
  }, [templates, category, search]);

  const counts = React.useMemo(() => {
    const byInd: Record<string, number> = {};
    const byInt: Record<string, number> = {};
    templates.forEach((t) => {
      byInd[t.industry] = (byInd[t.industry] ?? 0) + 1;
      byInt[t.intent] = (byInt[t.intent] ?? 0) + 1;
    });
    return {
      total: templates.length,
      custom: templates.filter((t) => t.id.startsWith("custom-")).length,
      byInd,
      byInt,
    };
  }, [templates]);

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      {/* Sidebar de categorías */}
      <div className="space-y-3">
        <TextureCard className="p-3 space-y-3">
          <div className="space-y-1">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Vista
            </h4>
            <CatBtn active={category === "all"} onClick={() => setCategory("all")} icon="📚" label="Todas" count={counts.total} />
            <CatBtn active={category === "top"} onClick={() => setCategory("top")} icon="⭐" label="Top usadas" count={Math.min(8, counts.total)} />
            <CatBtn active={category === "custom"} onClick={() => setCategory("custom")} icon="✨" label="Personalizadas" count={counts.custom} />
          </div>

          <div className="space-y-1 pt-2 border-t border-border/40">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Por industria
            </h4>
            {INDUSTRIES.map((i) => (
              <CatBtn
                key={i.id}
                active={category === `industry:${i.id}`}
                onClick={() => setCategory(`industry:${i.id}`)}
                icon={
                  i.id === "belleza" ? "💄" : i.id === "comercio" ? "🛍️" : i.id === "servicios" ? "🔧" : i.id === "tools" ? "🧰" : "🌐"
                }
                label={i.label}
                count={counts.byInd[i.id] ?? 0}
              />
            ))}
          </div>

          <div className="space-y-1 pt-2 border-t border-border/40">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Por intent
            </h4>
            {INTENTS.map((i) => (
              <CatBtn
                key={i.id}
                active={category === `intent:${i.id}`}
                onClick={() => setCategory(`intent:${i.id}`)}
                icon={
                  i.id === "demo" ? "📅" : i.id === "trial" ? "🚀" : i.id === "precios" ? "💰" : i.id === "soporte" ? "🛠️" : i.id === "agradecimiento" ? "🙏" : i.id === "descartar" ? "🚫" : "ℹ️"
                }
                label={i.label}
                count={counts.byInt[i.id] ?? 0}
              />
            ))}
          </div>
        </TextureCard>

        {/* Info UTM */}
        <div className="rounded-md border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-violet-500/[0.02] p-3 text-[10px] space-y-1.5">
          <p className="font-semibold text-violet-200 flex items-center gap-1.5">
            <LinkIcon className="size-3" /> UTMs auto-generados
          </p>
          <p className="text-violet-200/70 leading-relaxed">
            Cada plantilla con URL base genera un link con{" "}
            <code className="rounded bg-violet-500/20 px-1">utm_source</code>{" "}
            <code className="rounded bg-violet-500/20 px-1">utm_medium=comunidad</code>{" "}
            <code className="rounded bg-violet-500/20 px-1">utm_campaign=junio_redes_[industria]</code>{" "}
            <code className="rounded bg-violet-500/20 px-1">utm_content=[intent]</code>
          </p>
        </div>
      </div>

      {/* Lista principal */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
          <div className="inline-flex items-center rounded-md border border-border/60 bg-card/40 p-0.5 ml-auto">
            <span className="px-2 text-[10px] text-muted-foreground">Preview UTM:</span>
            <PlatformButton active={previewPlatform === "ig"} onClick={() => setPreviewPlatform("ig")} icon={<Instagram className="size-3 text-pink-400" />} label="IG" />
            <PlatformButton active={previewPlatform === "fb"} onClick={() => setPreviewPlatform("fb")} icon={<Facebook className="size-3 text-blue-400" />} label="FB" />
            <PlatformButton active={previewPlatform === "messenger"} onClick={() => setPreviewPlatform("messenger")} icon={<MessageSquare className="size-3 text-violet-400" />} label="MSG" />
          </div>
          <Button onClick={startNew} size="sm" className="gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 border-0">
            <Plus className="size-3.5" /> Nueva plantilla
          </Button>
        </div>

        {/* Header de resultados */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
            {category !== "all" && ` · filtro activo`}
            {search && ` · buscando "${search}"`}
          </span>
          {(category !== "all" || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setCategory("all"); setSearch(""); }} className="text-[10px] h-6">
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Grid de plantillas */}
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              t={t}
              previewPlatform={previewPlatform}
              isEditing={editing === t.id && draft?.id === t.id}
              draft={draft}
              setDraft={setDraft}
              startEdit={() => { setDraft(t); setEditing(t.id); }}
              cancelEdit={() => { setEditing(null); setDraft(null); }}
              saveDraft={saveDraft}
              deleteOne={() => deleteOne(t.id)}
            />
          ))}
          {editing && draft && !templates.find((t) => t.id === draft.id) && (
            <TemplateCard
              t={draft}
              previewPlatform={previewPlatform}
              isEditing={true}
              draft={draft}
              setDraft={setDraft}
              startEdit={() => {}}
              cancelEdit={() => { setEditing(null); setDraft(null); }}
              saveDraft={saveDraft}
              deleteOne={() => {}}
            />
          )}
          {filtered.length === 0 && !editing && (
            <TextureCard className="p-8 text-center md:col-span-2">
              <Sparkles className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium">No hay plantillas en esta categoría</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crea una nueva o ajusta los filtros.
              </p>
            </TextureCard>
          )}
        </div>
      </div>
    </div>
  );
}

function CatBtn({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      <span className="text-[9px] tabular-nums">{count}</span>
    </button>
  );
}

function TemplateCard({
  t,
  previewPlatform,
  isEditing,
  draft,
  setDraft,
  startEdit,
  cancelEdit,
  saveDraft,
  deleteOne,
}: {
  t: Template;
  previewPlatform: "ig" | "fb" | "messenger";
  isEditing: boolean;
  draft: Template | null;
  setDraft: (d: Template | null) => void;
  startEdit: () => void;
  cancelEdit: () => void;
  saveDraft: () => void;
  deleteOne: () => void;
}) {
  const previewUrl = (isEditing && draft ? draft.urlBase : t.urlBase)
    ? buildUTMUrl(
        (isEditing && draft ? draft.urlBase : t.urlBase) || "",
        {
          platform: previewPlatform,
          industry: (isEditing && draft ? draft.industry : t.industry) as Industry,
          intent: (isEditing && draft ? draft.intent : t.intent) as Intent,
        },
      )
    : "";

  if (isEditing && draft) {
    return (
      <TextureCard className="p-4 space-y-3 border-violet-500/40 bg-violet-500/[0.03]">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-300 font-semibold">
          <Edit3 className="size-3" /> Editando
        </div>
        <div className="flex gap-2">
          <Input
            value={draft.icon}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            className="w-14 text-center text-lg"
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
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">URL base (sin UTMs):</div>
          <Input
            value={draft.urlBase ?? ""}
            onChange={(e) => setDraft({ ...draft, urlBase: e.target.value })}
            placeholder="https://bewe.ai/belleza/precios"
            className="text-xs"
          />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">
            Texto · variables: <code className="rounded bg-muted/40 px-1">{"{{nombre}}"}</code>{" "}
            <code className="rounded bg-muted/40 px-1">{"{{link}}"}</code>
          </div>
          <Textarea
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            rows={5}
            placeholder="Hola {{nombre}}!"
            className="text-xs"
          />
        </div>
        {previewUrl && (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] p-2 space-y-1">
            <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
              <LinkIcon className="size-2.5" /> Preview URL en vivo ({previewPlatform})
            </div>
            <code className="block text-[10px] text-emerald-200 break-all">{previewUrl}</code>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button onClick={cancelEdit} variant="ghost" size="sm">Cancelar</Button>
          <Button onClick={saveDraft} size="sm" className="gap-1.5">
            <Check className="size-3.5" /> Guardar
          </Button>
        </div>
      </TextureCard>
    );
  }

  // View mode
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <TextureCard className="p-4 space-y-3 h-full">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-xl shrink-0">
              {t.icon}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold leading-tight">{t.name}</h4>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <Badge variant="outline" className="text-[9px] py-0 h-4">{t.industry}</Badge>
                <Badge variant="outline" className="text-[9px] py-0 h-4 bg-amber-500/5">{t.intent}</Badge>
                {t.useCount > 0 && (
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                    <TrendingUp className="size-2.5" /> {t.useCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-0.5">
            <Button onClick={startEdit} variant="ghost" size="icon" className="size-7">
              <Edit3 className="size-3" />
            </Button>
            <Button
              onClick={() => {
                if (confirm(`¿Borrar "${t.name}"?`)) deleteOne();
              }}
              variant="ghost"
              size="icon"
              className="size-7 text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>

        <p className="rounded bg-muted/20 p-2.5 text-xs whitespace-pre-wrap leading-relaxed">
          {t.text}
        </p>

        {previewUrl && (
          <div className="rounded-md border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.06] to-fuchsia-500/[0.04] p-2 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] uppercase tracking-wider text-violet-300 font-semibold flex items-center gap-1">
                <LinkIcon className="size-2.5" /> URL con UTMs · {previewPlatform}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => {
                  navigator.clipboard?.writeText(previewUrl);
                  toast.success("URL copiada");
                }}
              >
                <CopyIcon className="size-2.5" />
              </Button>
            </div>
            <code className="block text-[10px] text-violet-200 break-all">{previewUrl}</code>
          </div>
        )}
      </TextureCard>
    </motion.div>
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
