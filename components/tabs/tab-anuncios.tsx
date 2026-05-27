"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ImageOff,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  Settings2,
  TrendingUp,
  TrendingDown,
  Images,
  Play,
  Layers,
  AlertOctagon,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Activity,
  BarChart3,
  Sparkles,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { fmt, cn, ctrTone } from "@/lib/utils";
import { PLAN } from "@/lib/config";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/shared/kpi-card";
import { OnboardingTip } from "@/components/shared/onboarding-tip";
import { useAds, type MetaAd } from "@/lib/hooks/use-ads";
import { AdCard } from "@/components/anuncios/ad-card";
import { AdDetailDrawer } from "@/components/anuncios/ad-detail-drawer";
import {
  deriveAdMetrics,
  getAdAlerts,
  getMediaType,
  adsToPause,
  alertWeight,
  type AdMediaType,
  type DerivedAdMetrics,
} from "@/components/anuncios/ad-alerts";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
type SortKey =
  | "engagement"
  | "spend"
  | "conversions"
  | "cpr"
  | "ctr"
  | "frequency"
  | "recent"
  | "alerts";
type StatusFilter = "ACTIVE" | "PAUSED" | "all";
type MediaFilter = "all" | "image" | "video" | "carousel";
type SubTab = "activos" | "metricas" | "mejores" | "cambios";

interface EnrichedAd {
  ad: MetaAd;
  media: AdMediaType;
  m: DerivedAdMetrics;
  alerts: ReturnType<typeof getAdAlerts>;
  /** (likes + comments) / impressions — proxy de calidad creativa. */
  engagementRate: number;
}

// CPR target Bewe (target plan = 2.2 → loss threshold 4× = €8.8). Si no hay target, default 5.
const CPR_TARGET = PLAN.cpt.target || 5;
const CPR_LOSS_FACTOR = 4;

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function getEngagementRate(ad: MetaAd, m: DerivedAdMetrics): number {
  // Meta no expone likes/comments en `insights` por default; usamos CTR como proxy
  // robusto + bonus si hay conversiones. Es seek-determinista y no nulo.
  if (m.impressions === 0) return 0;
  const ctrPart = m.ctr; // 0-15 típico
  const convBonus = m.conversions > 0 ? Math.min(m.conversions * 0.5, 5) : 0;
  return ctrPart + convBonus;
}

/** Data mínima para que un creativo sea "evaluable" · evita que ads con
 *  €0 gasto o pocas impresiones se cuelen como "mejores" por un CTR fluke. */
function hasSignificantData(m: DerivedAdMetrics): boolean {
  return m.impressions >= 800 && m.spend >= 3;
}

/**
 * Score real de "mejor creativo". Prioriza RESULTADOS sobre CTR vacío:
 *  - conversiones pesan fuerte (cada CR/lead = mucho)
 *  - eficiencia (CPR bajo) suma
 *  - CTR aporta pero acotado · no puede ganar solo
 * Ads sin data significativa → score 0 (quedan fuera del top).
 */
function creativeScore(m: DerivedAdMetrics): number {
  if (!hasSignificantData(m)) return 0;
  const convScore = m.conversions * 10;
  const cprScore = m.cpr && m.cpr > 0 ? Math.min(20 / m.cpr, 10) : 0;
  const ctrScore = Math.min(m.ctr, 8);
  return convScore + cprScore + ctrScore;
}

function isLoss(m: DerivedAdMetrics): boolean {
  if (m.cpr === null) return m.spend > 30 && m.conversions === 0;
  return m.cpr > CPR_TARGET * CPR_LOSS_FACTOR;
}

// ──────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────
export function TabAnuncios() {
  const [subTab, setSubTab] = React.useState<SubTab>("activos");
  const [filter, setFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ACTIVE");
  const [mediaFilter, setMediaFilter] = React.useState<MediaFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("engagement");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<MetaAd | null>(null);
  const [groupByCampaign, setGroupByCampaign] = React.useState<boolean>(true);
  const { campaigns } = useDashboard();

  const { ads, loading, error, refresh, fetchedAt } = useAds();

  // Pre-compute media types + derived metrics once
  const enriched = React.useMemo<EnrichedAd[]>(
    () =>
      ads.map((a) => {
        const m = deriveAdMetrics(a.ins);
        return {
          ad: a,
          media: getMediaType(a),
          m,
          alerts: getAdAlerts(a),
          engagementRate: getEngagementRate(a, m),
        };
      }),
    [ads],
  );

  // Buckets by media (sobre TODOS los ads cargados, no filtered)
  const mediaBuckets = React.useMemo(() => {
    const b: Record<AdMediaType, number> = { image: 0, video: 0, carousel: 0, unknown: 0 };
    enriched.forEach((e) => (b[e.media] += 1));
    return b;
  }, [enriched]);

  // Filtros aplican a TODAS las sub-tabs salvo "mejores" y "cambios" que tienen lógica propia
  const filteredAds = React.useMemo(() => {
    let out = enriched;
    if (filter !== "all") {
      const c = campaigns.find((x) => x.code === filter);
      if (c) out = out.filter((e) => e.ad.campaign_id === c.cid);
    }
    if (statusFilter !== "all") {
      out = out.filter(
        (e) =>
          e.ad.effective_status === statusFilter ||
          e.ad.status === statusFilter,
      );
    }
    if (mediaFilter !== "all") {
      out = out.filter((e) => e.media === mediaFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (e) =>
          e.ad.name.toLowerCase().includes(q) ||
          (e.ad.creative?.title ?? "").toLowerCase().includes(q) ||
          (e.ad.creative?.body ?? "").toLowerCase().includes(q),
      );
    }
    const sortFn: Record<SortKey, (a: EnrichedAd, b: EnrichedAd) => number> = {
      engagement: (a, b) => b.engagementRate - a.engagementRate,
      spend: (a, b) => b.m.spend - a.m.spend,
      conversions: (a, b) => b.m.conversions - a.m.conversions,
      cpr: (a, b) => {
        const av = a.m.cpr ?? Infinity;
        const bv = b.m.cpr ?? Infinity;
        return av - bv;
      },
      ctr: (a, b) => b.m.ctr - a.m.ctr,
      frequency: (a, b) => b.m.frequency - a.m.frequency,
      recent: (a, b) => {
        const at = a.ad.created_time ? new Date(a.ad.created_time).getTime() : 0;
        const bt = b.ad.created_time ? new Date(b.ad.created_time).getTime() : 0;
        return bt - at;
      },
      alerts: (a, b) => alertWeight(b.alerts) - alertWeight(a.alerts),
    };
    return [...out].sort(sortFn[sortKey]);
  }, [enriched, filter, statusFilter, mediaFilter, sortKey, search, campaigns]);

  // KPI HEADER — basado en el filtro (no en TODOS) para que sea contextual
  const kpis = React.useMemo(() => {
    // Para el header usamos los ads del filtro vigente
    const base = filteredAds.length ? filteredAds : enriched;
    const active = base.filter(
      (e) => (e.ad.effective_status ?? e.ad.status) === "ACTIVE",
    );
    const paused = base.filter(
      (e) => (e.ad.effective_status ?? e.ad.status) === "PAUSED",
    );
    const totalSpend = base.reduce((s, e) => s + e.m.spend, 0);
    const totalConv = base.reduce((s, e) => s + e.m.conversions, 0);
    const totalClicks = base.reduce((s, e) => s + e.m.clicks, 0);
    const totalImpr = base.reduce((s, e) => s + e.m.impressions, 0);
    const avgCtr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
    const avgCpr = totalConv > 0 ? totalSpend / totalConv : null;
    const freqs = base.map((e) => e.m.frequency).filter((v) => v > 0);
    const avgFreq = freqs.length
      ? freqs.reduce((s, v) => s + v, 0) / freqs.length
      : 0;

    // Mejor ad: ≥3 CR y menor CPR; fallback a mayor engagement
    const winners = base
      .filter((e) => e.m.conversions >= 3 && e.m.cpr !== null)
      .sort((a, b) => (a.m.cpr ?? Infinity) - (b.m.cpr ?? Infinity));
    const fallback = [...base].sort((a, b) => b.engagementRate - a.engagementRate);
    const winner = winners[0]?.ad ?? fallback[0]?.ad ?? null;

    // Loser
    const zeroConvSpenders = base
      .filter((e) => e.m.conversions === 0 && e.m.spend > 5)
      .sort((a, b) => b.m.spend - a.m.spend);
    const worstCprs = base
      .filter((e) => e.m.cpr !== null && e.m.conversions > 0)
      .sort((a, b) => (b.m.cpr ?? 0) - (a.m.cpr ?? 0));
    const loser = zeroConvSpenders[0]?.ad ?? worstCprs[0]?.ad ?? null;

    return {
      activeCount: active.length,
      pausedCount: paused.length,
      totalSpend,
      totalConv,
      avgCtr,
      avgCpr,
      avgFreq,
      winner,
      loser,
      totalCount: base.length,
    };
  }, [filteredAds, enriched]);

  const flaggedToPause = React.useMemo(
    () => adsToPause(ads, 1),
    [ads],
  );

  // Top 3 IDs (para los pins TOP) por SCORE real · solo ads con data
  // significativa · evita pinear ads de €0 con CTR fluke.
  const topIds = React.useMemo(() => {
    const sorted = enriched
      .filter((e) => creativeScore(e.m) > 0)
      .sort((a, b) => creativeScore(b.m) - creativeScore(a.m));
    return new Map(sorted.slice(0, 3).map((e, i) => [e.ad.id, i + 1] as const));
  }, [enriched]);

  // IDs de losses
  const lossIds = React.useMemo(() => {
    return new Set(enriched.filter((e) => isLoss(e.m)).map((e) => e.ad.id));
  }, [enriched]);

  // Agrupado por campaña
  const byCampaign = React.useMemo(() => {
    const map = new Map<string, { camp: typeof campaigns[number] | undefined; items: EnrichedAd[] }>();
    filteredAds.forEach((e) => {
      const key = e.ad.campaign_id || "unknown";
      const existing = map.get(key);
      if (existing) {
        existing.items.push(e);
      } else {
        map.set(key, {
          camp: campaigns.find((c) => c.cid === e.ad.campaign_id),
          items: [e],
        });
      }
    });
    // ordenar por spend total del grupo desc
    return Array.from(map.entries())
      .map(([cid, v]) => {
        const spend = v.items.reduce((s, e) => s + e.m.spend, 0);
        const conv = v.items.reduce((s, e) => s + e.m.conversions, 0);
        return { cid, ...v, spend, conv };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [filteredAds, campaigns]);

  const subLabel = ads.length
    ? `${ads.length} anuncios cargados · ${filteredAds.length} mostrados${
        fetchedAt
          ? ` · actualizado ${new Date(fetchedAt).toLocaleTimeString("es", {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : ""
      }`
    : loading
      ? "Cargando creativos…"
      : "Sin token o sin ads en la cuenta";

  return (
    <div className="space-y-5 max-w-[1500px]">
      <OnboardingTip
        storageKey="anuncios"
        steps={[
          {
            title: "¿Qué es esta sección?",
            body: "Aquí ves cada anuncio individual de Meta con preview HD, alertas inteligentes y métricas explicadas. Cada card es un creativo de la cuenta con sus números del período.",
          },
          {
            title: "Sub-tabs",
            body: "Activos = grid de creativos por campaña · Métricas = tabla densa sortable · Mejores creativos = top 5 · Cambios recientes = ads pausados o escalados últimos 7 días.",
          },
          {
            title: "Pins TOP y LOSS",
            body: "Los 3 mejores anuncios por engagement llevan pin TOP. Los que tienen CPR > 4× target llevan pin LOSS. Sirven para escanear visualmente sin leer números.",
          },
          {
            title: "Detalle pro",
            body: "Haz clic en cualquier card para abrir el panel con preview full-size, alertas explicadas, métricas con tooltips, y acción rápida a Mark/Lúa para análisis.",
          },
        ]}
      />

      <SectionHeader
        title="Anuncios · mayo 2026"
        sub={subLabel}
        right={
          <Button
            onClick={() => void refresh()}
            size="sm"
            variant="glow"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {loading ? "Cargando…" : "Recargar"}
          </Button>
        }
      />

      {/* KPI HEADER · 4 cards principales sobre el filtro vigente */}
      {ads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Activos hoy"
            value={kpis.activeCount}
            sub={`${kpis.pausedCount} pausados · ${kpis.totalCount} en filtro`}
            tone="lime"
            format={(v) => fmt.int(v)}
          />
          <KpiCard
            label="Gasto total"
            value={kpis.totalSpend}
            sub={`${fmt.int(kpis.totalConv)} conversiones`}
            tone="violet"
            delay={0.05}
            format={(v) => fmt.eur(v, { decimals: 0 })}
          />
          <KpiCard
            label="CPR promedio"
            value={kpis.avgCpr ?? 0}
            sub={
              kpis.avgCpr === null
                ? "Sin conversiones aún"
                : kpis.avgCpr <= CPR_TARGET
                  ? `Target ≤€${CPR_TARGET.toFixed(2)} ✓`
                  : kpis.avgCpr <= CPR_TARGET * 3
                    ? "Sobre target · revisar"
                    : "Crítico · pausar pérdidas"
            }
            tone={
              kpis.avgCpr === null
                ? "default"
                : kpis.avgCpr <= CPR_TARGET
                  ? "success"
                  : kpis.avgCpr <= CPR_TARGET * 3
                    ? "warning"
                    : "danger"
            }
            delay={0.1}
            format={(v) =>
              kpis.avgCpr === null ? "—" : fmt.eur(v, { decimals: 2 })
            }
          />
          <KpiCard
            label="Mejor anuncio"
            value={kpis.winner ? 1 : 0}
            sub={
              kpis.winner
                ? kpis.winner.name.slice(0, 30) +
                  (kpis.winner.name.length > 30 ? "…" : "")
                : "—"
            }
            tone="info"
            delay={0.15}
            format={() => {
              if (!kpis.winner) return "—";
              const wm = deriveAdMetrics(kpis.winner.ins);
              return wm.cpr ? fmt.eur(wm.cpr, { decimals: 2 }) : "—";
            }}
          />
        </div>
      )}

      {/* SUB-TABS */}
      {ads.length > 0 && (
        <div className="border-b border-border/40 flex items-center gap-1 overflow-x-auto">
          <SubTabButton
            active={subTab === "activos"}
            icon={<Activity className="size-3.5" />}
            label="Activos"
            count={
              enriched.filter(
                (e) => (e.ad.effective_status ?? e.ad.status) === "ACTIVE",
              ).length
            }
            onClick={() => setSubTab("activos")}
          />
          <SubTabButton
            active={subTab === "metricas"}
            icon={<BarChart3 className="size-3.5" />}
            label="Métricas"
            count={filteredAds.length}
            onClick={() => setSubTab("metricas")}
          />
          <SubTabButton
            active={subTab === "mejores"}
            icon={<Sparkles className="size-3.5" />}
            label="Mejores creativos"
            count={Math.min(5, enriched.length)}
            onClick={() => setSubTab("mejores")}
          />
          <SubTabButton
            active={subTab === "cambios"}
            icon={<History className="size-3.5" />}
            label="Cambios recientes"
            onClick={() => setSubTab("cambios")}
          />
        </div>
      )}

      {/* Filter bar sticky (excepto en cambios/mejores que tienen lógica propia) */}
      {ads.length > 0 && (subTab === "activos" || subTab === "metricas") && (
        <div className="sticky top-[64px] z-20 -mx-1 px-1 py-2 backdrop-blur-md bg-background/70 border-y border-border/40">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <MediaChip
              active={mediaFilter === "all"}
              onClick={() => setMediaFilter("all")}
              icon={<Layers className="size-3" />}
              label="Todos"
              count={ads.length}
            />
            <MediaChip
              active={mediaFilter === "image"}
              onClick={() => setMediaFilter("image")}
              icon={<Images className="size-3" />}
              label="Imágenes"
              count={mediaBuckets.image}
            />
            <MediaChip
              active={mediaFilter === "video"}
              onClick={() => setMediaFilter("video")}
              icon={<Play className="size-3" />}
              label="Videos"
              count={mediaBuckets.video}
            />
            {mediaBuckets.carousel > 0 && (
              <MediaChip
                active={mediaFilter === "carousel"}
                onClick={() => setMediaFilter("carousel")}
                icon={<Layers className="size-3" />}
                label="Carruseles"
                count={mediaBuckets.carousel}
              />
            )}
            {subTab === "activos" && (
              <button
                onClick={() => setGroupByCampaign((v) => !v)}
                className={cn(
                  "ml-auto inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border text-[10px] font-semibold uppercase tracking-[0.07em] transition-colors",
                  groupByCampaign
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 bg-card/60 hover:bg-secondary text-muted-foreground",
                )}
              >
                {groupByCampaign ? "Agrupado por campaña" : "Lista plana"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nombre, copy…"
                className="h-8 text-[11px] pl-7"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-8 text-[11px] min-w-[170px]">
                <SelectValue placeholder="Todas las campañas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las campañas</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.cid} value={c.code}>
                    {c.code} · {c.vertical}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-8 text-[11px] min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="PAUSED">Pausados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-8 text-[11px] min-w-[180px]">
                <TrendingUp className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engagement">Mejores creativos ↓</SelectItem>
                <SelectItem value="spend">Gasto ↓</SelectItem>
                <SelectItem value="conversions">Conversiones ↓</SelectItem>
                <SelectItem value="cpr">CPR ↑ (mejor primero)</SelectItem>
                <SelectItem value="ctr">CTR ↓</SelectItem>
                <SelectItem value="frequency">Frecuencia ↓ (fatigue)</SelectItem>
                <SelectItem value="alerts">Más alertas ↓</SelectItem>
                <SelectItem value="recent">Recientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <TextureCard className="p-4 border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)]">
          <div className="text-[12px] text-[hsl(var(--destructive))] font-mono">
            ⚠ {error}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
            Verifica que META_TOKEN esté configurado.{" "}
            <a
              href="#config"
              className="inline-flex items-center gap-1 text-[hsl(var(--brand-violet))] hover:underline"
            >
              <Settings2 className="size-3" /> Ir a Config
            </a>
          </div>
        </TextureCard>
      )}

      {/* Loading skeleton */}
      {loading && !ads.length && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <TextureCard key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/5] !rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </TextureCard>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!ads.length && !loading && !error && (
        <TextureCard className="p-10 text-center">
          <div className="size-14 rounded-2xl bg-[hsl(var(--brand-violet)/0.12)] mx-auto mb-4 grid place-items-center border border-[hsl(var(--brand-violet)/0.3)]">
            <ImageOff className="size-6 text-[hsl(var(--brand-violet))]" />
          </div>
          <div className="text-sm font-semibold mb-1">Sin anuncios cargados</div>
          <div className="text-[12px] text-muted-foreground max-w-md mx-auto mb-4">
            Verifica que META_TOKEN esté configurado y que la cuenta tenga ads
            activos del mes en curso.
          </div>
          <Button onClick={() => void refresh()} size="sm" variant="glow">
            <RefreshCw className="size-3.5" /> Reintentar
          </Button>
        </TextureCard>
      )}

      {/* ─── SUB-TAB: ACTIVOS ─── */}
      {ads.length > 0 && subTab === "activos" && (
        <ActivosView
          filteredAds={filteredAds}
          byCampaign={byCampaign}
          groupByCampaign={groupByCampaign}
          topIds={topIds}
          lossIds={lossIds}
          campaigns={campaigns}
          onSelect={setSelected}
          onResetFilters={() => {
            setFilter("all");
            setStatusFilter("all");
            setMediaFilter("all");
            setSearch("");
          }}
        />
      )}

      {/* ─── SUB-TAB: MÉTRICAS ─── */}
      {ads.length > 0 && subTab === "metricas" && (
        <MetricsTable
          rows={filteredAds}
          campaigns={campaigns}
          sortKey={sortKey}
          onSort={(k) => setSortKey(k)}
          onSelect={setSelected}
        />
      )}

      {/* ─── SUB-TAB: MEJORES ─── */}
      {ads.length > 0 && subTab === "mejores" && (
        <BestCreativesView
          enriched={enriched}
          campaigns={campaigns}
          onSelect={setSelected}
        />
      )}

      {/* ─── SUB-TAB: CAMBIOS ─── */}
      {ads.length > 0 && subTab === "cambios" && (
        <RecentChangesView
          enriched={enriched}
          flaggedToPause={flaggedToPause}
          campaigns={campaigns}
          onSelect={setSelected}
        />
      )}

      {/* Detail drawer pro */}
      <AdDetailDrawer
        ad={selected}
        onClose={() => setSelected(null)}
        campaigns={campaigns}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// SUB-TAB VIEWS
// ──────────────────────────────────────────────────────────
function ActivosView({
  filteredAds,
  byCampaign,
  groupByCampaign,
  topIds,
  lossIds,
  campaigns,
  onSelect,
  onResetFilters,
}: {
  filteredAds: EnrichedAd[];
  byCampaign: Array<{
    cid: string;
    camp: ReturnType<typeof useDashboard>["campaigns"][number] | undefined;
    items: EnrichedAd[];
    spend: number;
    conv: number;
  }>;
  groupByCampaign: boolean;
  topIds: Map<string, number>;
  lossIds: Set<string>;
  campaigns: ReturnType<typeof useDashboard>["campaigns"];
  onSelect: (ad: MetaAd) => void;
  onResetFilters: () => void;
}) {
  if (filteredAds.length === 0) {
    return (
      <TextureCard className="p-8 text-center">
        <Search className="size-7 text-muted-foreground mx-auto mb-3" />
        <div className="text-[13px] font-medium mb-1">Ningún anuncio coincide</div>
        <div className="text-[11px] text-muted-foreground mb-3">
          Prueba a relajar los filtros o limpiar la búsqueda.
        </div>
        <Button size="sm" variant="outline" onClick={onResetFilters}>
          Limpiar filtros
        </Button>
      </TextureCard>
    );
  }

  if (!groupByCampaign) {
    // Lista plana paginada simple (cap a 60 visibles)
    const visible = filteredAds.slice(0, 60);
    return (
      <>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {visible.map((e, i) => {
            const camp = campaigns.find((c) => c.cid === e.ad.campaign_id);
            return (
              <AdCard
                key={e.ad.id}
                ad={e.ad}
                campaignCode={camp?.code}
                campaignName={camp?.vertical}
                topRank={topIds.get(e.ad.id)}
                loss={lossIds.has(e.ad.id)}
                index={i}
                onOpen={onSelect}
              />
            );
          })}
        </div>
        {filteredAds.length > 60 && (
          <div className="text-center text-[11px] text-muted-foreground py-3">
            Mostrando 60 de {filteredAds.length}. Usa filtros para refinar.
          </div>
        )}
      </>
    );
  }

  // Agrupado por campaña · colapsable
  return (
    <div className="space-y-3">
      {byCampaign.map((grp, gi) => (
        <CampaignGroup
          key={grp.cid}
          campaignCode={grp.camp?.code ?? "?"}
          campaignName={grp.camp?.name ?? "Campaña sin nombre"}
          vertical={grp.camp?.vertical}
          spend={grp.spend}
          conv={grp.conv}
          totalAds={grp.items.length}
          defaultOpen={gi < 2}
        >
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
            {grp.items.map((e, i) => (
              <AdCard
                key={e.ad.id}
                ad={e.ad}
                campaignCode={grp.camp?.code}
                campaignName={grp.camp?.vertical}
                topRank={topIds.get(e.ad.id)}
                loss={lossIds.has(e.ad.id)}
                index={i}
                onOpen={onSelect}
              />
            ))}
          </div>
        </CampaignGroup>
      ))}
    </div>
  );
}

function MetricsTable({
  rows,
  campaigns,
  sortKey,
  onSort,
  onSelect,
}: {
  rows: EnrichedAd[];
  campaigns: ReturnType<typeof useDashboard>["campaigns"];
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
  onSelect: (ad: MetaAd) => void;
}) {
  if (rows.length === 0) {
    return (
      <TextureCard className="p-6 text-center text-[12px] text-muted-foreground">
        Sin anuncios para mostrar.
      </TextureCard>
    );
  }

  const visible = rows.slice(0, 100);

  return (
    <TextureCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr className="text-left">
              <th className="py-2 px-3 font-semibold uppercase tracking-[0.06em] text-[10px]">
                Anuncio
              </th>
              <th className="py-2 px-3 font-semibold uppercase tracking-[0.06em] text-[10px]">
                Campaña
              </th>
              <th className="py-2 px-3 text-[10px]">Status</th>
              <SortableTH label="Gasto" k="spend" current={sortKey} onSort={onSort} align="right" />
              <SortableTH label="CR" k="conversions" current={sortKey} onSort={onSort} align="right" />
              <SortableTH label="CPR" k="cpr" current={sortKey} onSort={onSort} align="right" dir="asc" />
              <SortableTH label="CTR" k="ctr" current={sortKey} onSort={onSort} align="right" />
              <SortableTH label="Freq" k="frequency" current={sortKey} onSort={onSort} align="right" />
              <th className="py-2 px-3 text-[10px]">Alertas</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => {
              const camp = campaigns.find((c) => c.cid === e.ad.campaign_id);
              const live = e.ad.effective_status ?? e.ad.status;
              const cprTone =
                e.m.cpr === null
                  ? "text-muted-foreground"
                  : e.m.cpr <= CPR_TARGET
                    ? "text-[hsl(var(--success))]"
                    : e.m.cpr <= CPR_TARGET * 3
                      ? "text-[hsl(var(--warning))]"
                      : "text-[hsl(var(--destructive))]";
              return (
                <tr
                  key={e.ad.id}
                  onClick={() => onSelect(e.ad)}
                  className="border-t border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 max-w-[260px]">
                    <div className="font-mono font-semibold truncate" title={e.ad.name}>
                      {e.ad.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {e.ad.creative?.title ?? e.ad.creative?.body?.slice(0, 50) ?? ""}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {camp ? (
                      <Badge variant="violet" className="!text-[9px]">
                        {camp.code}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <Badge
                      variant={live === "ACTIVE" ? "success" : "outline"}
                      className="!text-[9px]"
                    >
                      {live}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {fmt.eur(e.m.spend, { decimals: 0 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {fmt.int(e.m.conversions)}
                  </td>
                  <td className={cn("py-2 px-3 text-right font-mono font-semibold", cprTone)}>
                    {e.m.cpr === null ? "—" : fmt.eur(e.m.cpr, { decimals: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {e.m.ctr ? `${e.m.ctr.toFixed(2)}%` : "—"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {e.m.frequency ? `${e.m.frequency.toFixed(1)}×` : "—"}
                  </td>
                  <td className="py-2 px-3">
                    {e.alerts.length > 0 ? (
                      <span
                        className={cn(
                          "font-mono text-[10px] px-1.5 py-0.5 rounded",
                          e.alerts.some((a) => a.level === "critical")
                            ? "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]"
                            : "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
                        )}
                      >
                        {e.alerts.length}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 100 && (
        <div className="text-center text-[11px] text-muted-foreground py-2 border-t border-border/30">
          Mostrando 100 de {rows.length}. Usa filtros para refinar.
        </div>
      )}
    </TextureCard>
  );
}

function BestCreativesView({
  enriched,
  campaigns,
  onSelect,
}: {
  enriched: EnrichedAd[];
  campaigns: ReturnType<typeof useDashboard>["campaigns"];
  onSelect: (ad: MetaAd) => void;
}) {
  // Top 5 por SCORE real de creativo · solo ads con data significativa
  // (≥800 impresiones y ≥€3 gasto). Excluye los €0 que ganaban por CTR fluke.
  const ranked = React.useMemo(() => {
    const qualified = enriched
      .filter((e) => creativeScore(e.m) > 0)
      .sort((a, b) => creativeScore(b.m) - creativeScore(a.m));
    return qualified.slice(0, 5);
  }, [enriched]);

  if (ranked.length === 0) {
    return (
      <TextureCard className="p-6 text-center text-[12px] text-muted-foreground">
        Sin creativos con data suficiente todavía · se necesitan ≥800 impresiones
        y ≥€3 de gasto para evaluar un anuncio.
      </TextureCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-muted-foreground px-1">
        Top 5 anuncios por <span className="text-foreground font-semibold">resultados reales</span> ·
        conversiones + eficiencia (CPR) + CTR. Solo creativos con data significativa
        (≥800 impresiones · ≥€3 gasto). Replicá estos conceptos.
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {ranked.map((e, i) => {
          const camp = campaigns.find((c) => c.cid === e.ad.campaign_id);
          return (
            <AdCard
              key={e.ad.id}
              ad={e.ad}
              campaignCode={camp?.code}
              campaignName={camp?.vertical}
              topRank={i + 1}
              index={i}
              onOpen={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

function RecentChangesView({
  enriched,
  flaggedToPause,
  campaigns,
  onSelect,
}: {
  enriched: EnrichedAd[];
  flaggedToPause: MetaAd[];
  campaigns: ReturnType<typeof useDashboard>["campaigns"];
  onSelect: (ad: MetaAd) => void;
}) {
  const sevenDaysAgo = Date.now() - 7 * 86400000;

  // Ads creados últimos 7d
  const recentlyCreated = React.useMemo(() => {
    return enriched
      .filter((e) => {
        const t = e.ad.created_time ? new Date(e.ad.created_time).getTime() : 0;
        return t >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const at = a.ad.created_time ? new Date(a.ad.created_time).getTime() : 0;
        const bt = b.ad.created_time ? new Date(b.ad.created_time).getTime() : 0;
        return bt - at;
      })
      .slice(0, 10);
  }, [enriched, sevenDaysAgo]);

  // Ads pausados (PAUSED) — Meta no expone fecha de pausa así que usamos status actual
  const paused = React.useMemo(() => {
    return enriched
      .filter((e) => (e.ad.effective_status ?? e.ad.status) === "PAUSED")
      .sort((a, b) => b.m.spend - a.m.spend)
      .slice(0, 10);
  }, [enriched]);

  // Críticos sugeridos a pausar
  const toPause = flaggedToPause.slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Sugeridos para pausar */}
      <ChangesSection
        title="Sugeridos para pausar"
        icon={<ShieldAlert className="size-4 text-[hsl(var(--destructive))]" />}
        tone="danger"
        emptyMsg="Sin anuncios críticos a pausar"
        items={toPause.map((ad) => {
          const m = deriveAdMetrics(ad.ins);
          const camp = campaigns.find((c) => c.cid === ad.campaign_id);
          const alerts = getAdAlerts(ad);
          const reason =
            alerts.find((a) => a.level === "critical")?.message ??
            alerts[0]?.message ??
            "Múltiples alertas";
          return {
            id: ad.id,
            name: ad.name,
            campaignCode: camp?.code,
            reason,
            metric: m.cpr ? `CPR €${m.cpr.toFixed(2)}` : `€${m.spend.toFixed(0)} · 0 CR`,
            onClick: () => onSelect(ad),
          };
        })}
      />

      {/* Pausados actualmente */}
      <ChangesSection
        title="Pausados recientemente"
        icon={<History className="size-4 text-muted-foreground" />}
        tone="default"
        emptyMsg="Sin anuncios pausados"
        items={paused.map((e) => {
          const camp = campaigns.find((c) => c.cid === e.ad.campaign_id);
          return {
            id: e.ad.id,
            name: e.ad.name,
            campaignCode: camp?.code,
            reason: e.m.conversions === 0 ? "0 conversiones" : `CPR €${(e.m.cpr ?? 0).toFixed(2)}`,
            metric: `€${e.m.spend.toFixed(0)} · ${fmt.int(e.m.conversions)} CR`,
            onClick: () => onSelect(e.ad),
          };
        })}
      />

      {/* Nuevos lanzados últimos 7d */}
      <ChangesSection
        title="Nuevos · últimos 7 días"
        icon={<Sparkles className="size-4 text-[hsl(var(--brand-lime))]" />}
        tone="lime"
        emptyMsg="Sin lanzamientos esta semana"
        items={recentlyCreated.map((e) => {
          const camp = campaigns.find((c) => c.cid === e.ad.campaign_id);
          const days = e.ad.created_time
            ? Math.max(
                1,
                Math.floor(
                  (Date.now() - new Date(e.ad.created_time).getTime()) /
                    86400000,
                ),
              )
            : null;
          return {
            id: e.ad.id,
            name: e.ad.name,
            campaignCode: camp?.code,
            reason: days ? `Hace ${days}d` : "Reciente",
            metric: `€${e.m.spend.toFixed(0)} · ${fmt.int(e.m.conversions)} CR`,
            onClick: () => onSelect(e.ad),
          };
        })}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────
function SubTabButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-9 text-[11px] font-semibold uppercase tracking-[0.07em] border-b-2 transition-colors whitespace-nowrap",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "text-[9px] font-mono px-1 rounded",
            active ? "bg-foreground text-background" : "bg-secondary",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function CampaignGroup({
  campaignCode,
  campaignName,
  vertical,
  spend,
  conv,
  totalAds,
  defaultOpen,
  children,
}: {
  campaignCode: string;
  campaignName: string;
  vertical?: string;
  spend: number;
  conv: number;
  totalAds: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean>(defaultOpen ?? true);
  const cpr = conv > 0 ? spend / conv : null;

  return (
    <TextureCard className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="size-7 grid place-items-center text-muted-foreground shrink-0">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="violet" className="!text-[10px]">
              {campaignCode}
            </Badge>
            {vertical && (
              <Badge variant="outline" className="!text-[9px]">
                {vertical}
              </Badge>
            )}
            <span className="text-[12px] font-semibold font-mono truncate">
              {campaignName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono shrink-0">
          <div>
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              Ads
            </div>
            <div className="font-semibold text-foreground">{totalAds}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              Gasto
            </div>
            <div className="font-semibold text-foreground">
              {fmt.eur(spend, { decimals: 0 })}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              CR
            </div>
            <div className="font-semibold text-foreground">{fmt.int(conv)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
              CPR
            </div>
            <div
              className={cn(
                "font-semibold",
                cpr === null
                  ? "text-muted-foreground"
                  : cpr <= CPR_TARGET
                    ? "text-[hsl(var(--success))]"
                    : cpr <= CPR_TARGET * 3
                      ? "text-[hsl(var(--warning))]"
                      : "text-[hsl(var(--destructive))]",
              )}
            >
              {cpr === null ? "—" : fmt.eur(cpr, { decimals: 2 })}
            </div>
          </div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border/30">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </TextureCard>
  );
}

function SortableTH({
  label,
  k,
  current,
  onSort,
  align = "left",
  dir = "desc",
}: {
  label: string;
  k: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  dir?: "asc" | "desc";
}) {
  const active = current === k;
  return (
    <th
      className={cn(
        "py-2 px-3 text-[10px] cursor-pointer select-none",
        align === "right" && "text-right",
      )}
      onClick={() => onSort(k)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold uppercase tracking-[0.06em]",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </span>
    </th>
  );
}

interface ChangeRow {
  id: string;
  name: string;
  campaignCode?: string;
  reason: string;
  metric: string;
  onClick: () => void;
}

function ChangesSection({
  title,
  icon,
  tone,
  emptyMsg,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "danger" | "lime" | "default";
  emptyMsg: string;
  items: ChangeRow[];
}) {
  const toneBorder = {
    danger: "border-[hsl(var(--destructive)/0.3)]",
    lime: "border-[hsl(var(--brand-lime)/0.3)]",
    default: "border-border/40",
  }[tone];

  return (
    <TextureCard className={cn("overflow-hidden", toneBorder)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-secondary/30">
        {icon}
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em]">
          {title}
        </div>
        <div className="ml-auto text-[10px] font-mono text-muted-foreground">
          {items.length}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="p-4 text-center text-[11px] text-muted-foreground">
          {emptyMsg}
        </div>
      ) : (
        <ul className="divide-y divide-border/30">
          {items.map((it) => (
            <li key={it.id}>
              <button
                onClick={it.onClick}
                className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-secondary/30 transition-colors"
              >
                {it.campaignCode && (
                  <Badge variant="violet" className="!text-[9px] shrink-0">
                    {it.campaignCode}
                  </Badge>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[11px] font-semibold truncate">
                    {it.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {it.reason}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground shrink-0">
                  {it.metric}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </TextureCard>
  );
}

function MediaChip({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border text-[10px] font-semibold uppercase tracking-[0.07em] transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border/60 bg-card/60 hover:bg-secondary text-muted-foreground",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "ml-0.5 text-[9px] font-mono px-1 rounded",
          active ? "bg-background/20" : "bg-secondary",
        )}
      >
        {count}
      </span>
    </button>
  );
}
