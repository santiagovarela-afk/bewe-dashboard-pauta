"use client";
import * as React from "react";
import {
  ImageOff,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  Settings2,
  TrendingUp,
  Images,
  Play,
  Layers,
  AlertOctagon,
  ShieldAlert,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { fmt, cn, ctrTone } from "@/lib/utils";
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
} from "@/components/anuncios/ad-alerts";

type SortKey =
  | "spend"
  | "conversions"
  | "cpr"
  | "ctr"
  | "frequency"
  | "recent"
  | "alerts";
type StatusFilter = "all" | "ACTIVE" | "PAUSED" | "ARCHIVED";
type MediaFilter = "all" | "image" | "video" | "carousel";

export function TabAnuncios() {
  const [filter, setFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [mediaFilter, setMediaFilter] = React.useState<MediaFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("spend");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<MetaAd | null>(null);
  const { campaigns } = useDashboard();

  const { ads, loading, error, refresh, fetchedAt } = useAds();

  // Pre-compute media types + derived metrics once
  const enriched = React.useMemo(
    () =>
      ads.map((a) => ({
        ad: a,
        media: getMediaType(a),
        m: deriveAdMetrics(a.ins),
        alerts: getAdAlerts(a),
      })),
    [ads],
  );

  // Buckets by media (sobre TODOS los ads cargados, no filtered)
  const mediaBuckets = React.useMemo(() => {
    const b: Record<AdMediaType, number> = { image: 0, video: 0, carousel: 0, unknown: 0 };
    enriched.forEach((e) => (b[e.media] += 1));
    return b;
  }, [enriched]);

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
    const sortFn: Record<SortKey, (a: (typeof enriched)[number], b: (typeof enriched)[number]) => number> = {
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

  // KPI aggregates — SIEMPRE sobre TODOS los ads cargados (no filtrados)
  const kpis = React.useMemo(() => {
    const all = enriched;
    const active = all.filter(
      (e) => (e.ad.effective_status ?? e.ad.status) === "ACTIVE",
    ).length;
    const paused = all.filter(
      (e) => (e.ad.effective_status ?? e.ad.status) === "PAUSED",
    ).length;
    const totalSpend = all.reduce((s, e) => s + e.m.spend, 0);
    const totalConv = all.reduce((s, e) => s + e.m.conversions, 0);
    const totalClicks = all.reduce((s, e) => s + e.m.clicks, 0);
    const totalImpr = all.reduce((s, e) => s + e.m.impressions, 0);
    const avgCtr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
    const avgCpr = totalConv > 0 ? totalSpend / totalConv : null;
    const freqs = all
      .map((e) => e.m.frequency)
      .filter((v) => v > 0);
    const avgFreq = freqs.length
      ? freqs.reduce((s, v) => s + v, 0) / freqs.length
      : 0;

    // Winner: ≥5 CR and lowest CPR
    const winners = all
      .filter((e) => e.m.conversions >= 5 && e.m.cpr !== null)
      .sort((a, b) => (a.m.cpr ?? Infinity) - (b.m.cpr ?? Infinity));
    const winner = winners[0]?.ad ?? null;

    // Loser: highest spend with 0 conversions, OR worst CPR
    const zeroConvSpenders = all
      .filter((e) => e.m.conversions === 0 && e.m.spend > 5)
      .sort((a, b) => b.m.spend - a.m.spend);
    const worstCprs = all
      .filter((e) => e.m.cpr !== null && e.m.conversions > 0)
      .sort((a, b) => (b.m.cpr ?? 0) - (a.m.cpr ?? 0));
    const loser = zeroConvSpenders[0]?.ad ?? worstCprs[0]?.ad ?? null;

    return {
      active,
      paused,
      totalSpend,
      totalConv,
      avgCtr,
      avgCpr,
      avgFreq,
      winner,
      loser,
      totalCount: all.length,
    };
  }, [enriched]);

  const flaggedToPause = React.useMemo(
    () => adsToPause(ads, 1),
    [ads],
  );

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
    <div className="space-y-6 max-w-[1500px]">
      <OnboardingTip
        storageKey="anuncios"
        steps={[
          {
            title: "¿Qué es esta sección?",
            body: "Aquí ves cada anuncio individual de Meta con preview HD, alertas inteligentes y métricas explicadas. Cada card es un creativo de la cuenta con sus números del período.",
          },
          {
            title: "Imágenes y videos separados",
            body: "Usa los chips de tipo de medio (Imágenes / Videos / Carruseles) para revisar cada formato por separado y comparar rendimiento.",
          },
          {
            title: "Alertas inteligentes",
            body: "Cada anuncio se evalúa automáticamente: frecuencia, CTR bajo, gasto sin conversiones, CPR alto. Los iconos sobre el thumbnail resumen el diagnóstico.",
          },
          {
            title: "Detalle pro",
            body: "Haz clic en cualquier card para abrir el panel con preview full-size, alertas explicadas, métricas con tooltips, y acción rápida a Mark/Lúa para análisis.",
          },
        ]}
      />

      <SectionHeader
        title="Anuncios activos · mayo 2026"
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

      {/* KPI bar agregado (TODOS los ads, no filtered) */}
      {ads.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Anuncios"
              value={kpis.active}
              sub={`${kpis.active} activos · ${kpis.paused} pausados · ${kpis.totalCount} total`}
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
                  : kpis.avgCpr <= 5
                    ? "Dentro de target ≤€5"
                    : kpis.avgCpr <= 15
                      ? "Sobre target · revisar"
                      : "Crítico · pausar pérdidas"
              }
              tone={
                kpis.avgCpr === null
                  ? "default"
                  : kpis.avgCpr <= 5
                    ? "success"
                    : kpis.avgCpr <= 15
                      ? "warning"
                      : "danger"
              }
              delay={0.1}
              format={(v) =>
                kpis.avgCpr === null ? "—" : fmt.eur(v, { decimals: 2 })
              }
            />
            <KpiCard
              label="CTR promedio"
              value={kpis.avgCtr}
              sub={`Frecuencia media ${kpis.avgFreq.toFixed(2)}×`}
              tone={
                ctrTone(kpis.avgCtr) === "default" ? "info" : ctrTone(kpis.avgCtr)
              }
              delay={0.15}
              format={(v) => `${v.toFixed(2)}%`}
            />
          </div>

          {/* Winner / Loser / Flagged row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InsightChip
              tone="lime"
              icon={<Trophy className="size-4" />}
              label="Winner del período"
              ad={kpis.winner}
              detail={
                kpis.winner
                  ? `${fmt.int(deriveAdMetrics(kpis.winner.ins).conversions)} CR · CPR ${fmt.eur(deriveAdMetrics(kpis.winner.ins).cpr ?? 0, { decimals: 2 })}`
                  : "Necesita ≥5 conversiones"
              }
              onClick={() => kpis.winner && setSelected(kpis.winner)}
            />
            <InsightChip
              tone="danger"
              icon={<AlertOctagon className="size-4" />}
              label="Loser del período"
              ad={kpis.loser}
              detail={
                kpis.loser
                  ? (() => {
                      const lm = deriveAdMetrics(kpis.loser.ins);
                      return lm.conversions === 0
                        ? `${fmt.eur(lm.spend, { decimals: 2 })} · 0 CR`
                        : `CPR ${fmt.eur(lm.cpr ?? 0, { decimals: 2 })} · ${fmt.int(lm.conversions)} CR`;
                    })()
                  : "—"
              }
              onClick={() => kpis.loser && setSelected(kpis.loser)}
            />
            <InsightChip
              tone="warning"
              icon={<ShieldAlert className="size-4" />}
              label={`Pausar (${flaggedToPause.length})`}
              ad={flaggedToPause[0] ?? null}
              detail={
                flaggedToPause.length
                  ? `Top: ${flaggedToPause[0].name.slice(0, 28)}…`
                  : "Sin anuncios críticos"
              }
              onClick={() =>
                flaggedToPause[0] && setSelected(flaggedToPause[0])
              }
              extra={
                flaggedToPause.length > 1 ? (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {flaggedToPause.slice(1, 4).map((a) => (
                      <button
                        key={a.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelected(a);
                        }}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] hover:underline truncate max-w-[120px]"
                        title={a.name}
                      >
                        {a.name.slice(0, 14)}…
                      </button>
                    ))}
                    {flaggedToPause.length > 4 && (
                      <span className="text-[9px] text-muted-foreground self-center">
                        +{flaggedToPause.length - 4} más
                      </span>
                    )}
                  </div>
                ) : null
              }
            />
          </div>
        </>
      )}

      {/* Sticky filter bar */}
      {ads.length > 0 && (
        <div className="sticky top-[64px] z-20 -mx-1 px-1 py-2 backdrop-blur-md bg-background/70 border-y border-border/40">
          {/* Media type chips */}
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
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Solo activos</SelectItem>
                <SelectItem value="PAUSED">Solo pausados</SelectItem>
                <SelectItem value="ARCHIVED">Archivados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-8 text-[11px] min-w-[170px]">
                <TrendingUp className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spend">Orden: Gasto ↓</SelectItem>
                <SelectItem value="conversions">Orden: Conversiones ↓</SelectItem>
                <SelectItem value="cpr">Orden: CPR ↑ (mejor primero)</SelectItem>
                <SelectItem value="ctr">Orden: CTR ↓</SelectItem>
                <SelectItem value="frequency">Orden: Frecuencia ↓ (fatigue)</SelectItem>
                <SelectItem value="alerts">Orden: Más alertas ↓</SelectItem>
                <SelectItem value="recent">Orden: Recientes</SelectItem>
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

      {/* Empty state — no data */}
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

      {/* Empty state — filters demasiado restrictivos */}
      {ads.length > 0 && filteredAds.length === 0 && (
        <TextureCard className="p-8 text-center">
          <Search className="size-7 text-muted-foreground mx-auto mb-3" />
          <div className="text-[13px] font-medium mb-1">Ningún anuncio coincide</div>
          <div className="text-[11px] text-muted-foreground mb-3">
            Prueba a relajar los filtros o limpiar la búsqueda.
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFilter("all");
              setStatusFilter("all");
              setMediaFilter("all");
              setSearch("");
            }}
          >
            Limpiar filtros
          </Button>
        </TextureCard>
      )}

      {/* Grid */}
      {filteredAds.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAds.map((e, i) => {
            const camp = campaigns.find((c) => c.cid === e.ad.campaign_id);
            return (
              <AdCard
                key={e.ad.id}
                ad={e.ad}
                campaignCode={camp?.code}
                index={i}
                onOpen={setSelected}
              />
            );
          })}
        </div>
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

function InsightChip({
  tone,
  icon,
  label,
  ad,
  detail,
  onClick,
  extra,
}: {
  tone: "lime" | "danger" | "warning";
  icon: React.ReactNode;
  label: string;
  ad: MetaAd | null;
  detail: string;
  onClick: () => void;
  extra?: React.ReactNode;
}) {
  const toneClasses = {
    lime: "border-[hsl(var(--brand-lime)/0.4)] bg-[hsl(var(--brand-lime)/0.06)] text-[hsl(var(--brand-lime))]",
    danger:
      "border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.06)] text-[hsl(var(--destructive))]",
    warning:
      "border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.06)] text-[hsl(var(--warning))]",
  }[tone];
  return (
    <button
      disabled={!ad}
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border p-3 transition-colors",
        toneClasses,
        ad ? "hover:bg-foreground/[0.04] cursor-pointer" : "opacity-70 cursor-default",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <div className="text-[10px] font-bold uppercase tracking-[0.12em]">
          {label}
        </div>
      </div>
      <div className="text-[11px] font-mono text-foreground truncate" title={ad?.name}>
        {ad?.name ?? "—"}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{detail}</div>
      {extra}
    </button>
  );
}
