"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  ImageOff,
  Loader2,
  RefreshCw,
  ExternalLink,
  Search,
  Trophy,
  Settings2,
  TrendingUp,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { fmt, cn, ctrTone } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { SpotlightCard } from "@/components/fx/spotlight-card";
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
import { Drawer } from "@/components/shared/drawer";
import { useAds, type MetaAd } from "@/lib/hooks/use-ads";

type SortKey = "ctr" | "spend" | "clicks" | "impressions" | "name";
type StatusFilter = "all" | "ACTIVE" | "PAUSED" | "ARCHIVED";

function num(s: string | number | undefined): number {
  if (s === undefined || s === null) return 0;
  const n = typeof s === "number" ? s : parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function TabAnuncios() {
  const [filter, setFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("ctr");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<MetaAd | null>(null);
  const { campaigns } = useDashboard();

  // El hook hace stale-while-revalidate y persiste en localStorage,
  // así que cuando cambian filtros NO se vuelve a llamar a Meta.
  const { ads, loading, error, refresh, fetchedAt } = useAds();

  // Filtering + sorting pipeline
  const filteredAds = React.useMemo(() => {
    let out = ads;
    if (filter !== "all") {
      const c = campaigns.find((x) => x.code === filter);
      if (c) out = out.filter((a) => a.campaign_id === c.cid);
    }
    if (statusFilter !== "all") {
      out = out.filter(
        (a) => a.effective_status === statusFilter || a.status === statusFilter,
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.creative?.title ?? "").toLowerCase().includes(q) ||
          (a.creative?.body ?? "").toLowerCase().includes(q),
      );
    }
    const sortFn: Record<SortKey, (a: MetaAd, b: MetaAd) => number> = {
      ctr: (a, b) => num(b.ins?.ctr) - num(a.ins?.ctr),
      spend: (a, b) => num(b.ins?.spend) - num(a.ins?.spend),
      clicks: (a, b) => num(b.ins?.clicks) - num(a.ins?.clicks),
      impressions: (a, b) => num(b.ins?.impressions) - num(a.ins?.impressions),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...out].sort(sortFn[sortKey]);
  }, [ads, filter, statusFilter, sortKey, search, campaigns]);

  // KPI aggregates over filtered set
  const kpis = React.useMemo(() => {
    const active = filteredAds.filter(
      (a) => (a.effective_status ?? a.status) === "ACTIVE",
    ).length;
    const totalSpend = filteredAds.reduce((s, a) => s + num(a.ins?.spend), 0);
    const totalImpr = filteredAds.reduce((s, a) => s + num(a.ins?.impressions), 0);
    const totalClicks = filteredAds.reduce((s, a) => s + num(a.ins?.clicks), 0);
    const avgCtr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
    const best = [...filteredAds]
      .filter((a) => num(a.ins?.impressions) > 100)
      .sort((a, b) => num(b.ins?.ctr) - num(a.ins?.ctr))[0];
    return { active, totalSpend, avgCtr, best, totalCount: filteredAds.length };
  }, [filteredAds]);

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
            body: "Aquí ves todos los anuncios pagados (creativos) de la cuenta de Meta Ads. Cada card es un anuncio individual con su miniatura, status y métricas del mes actual.",
          },
          {
            title: "Carga automática",
            body: "Los anuncios se traen solos al entrar a la tab. Si tienes datos en caché local los verás al instante mientras revalidamos en background.",
          },
          {
            title: "Filtros y orden sin re-fetch",
            body: "Combina filtro por campaña + status + búsqueda libre. Ordena por CTR, gasto, clicks o impresiones — todo client-side, sin volver a llamar a Meta.",
          },
          {
            title: "Detalle por anuncio",
            body: "Haz clic en cualquier card para abrir el panel lateral con preview completo, copy del creativo, métricas detalladas y link directo a Meta Ads Manager.",
          },
        ]}
      />

      <SectionHeader
        title="Anuncios activos · mayo 2026"
        sub={subLabel}
        right={
          <Button onClick={() => void refresh()} size="sm" variant="glow" disabled={loading}>
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {loading ? "Cargando…" : "Recargar"}
          </Button>
        }
      />

      {/* KPI bar — solo si hay datos */}
      {ads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Anuncios activos"
            value={kpis.active}
            sub={`de ${kpis.totalCount} en filtro`}
            tone="lime"
            format={(v) => fmt.int(v)}
          />
          <KpiCard
            label="Gasto total"
            value={kpis.totalSpend}
            sub="período visible"
            tone="violet"
            delay={0.05}
            format={(v) => fmt.eur(v, { decimals: 0 })}
          />
          <KpiCard
            label="CTR promedio"
            value={kpis.avgCtr}
            sub={kpis.avgCtr >= 1.5 ? "Por encima del benchmark" : "Por debajo del 1.5%"}
            tone={ctrTone(kpis.avgCtr) === "default" ? "info" : ctrTone(kpis.avgCtr)}
            delay={0.1}
            format={(v) => `${v.toFixed(2)}%`}
          />
          <KpiCard
            label="Mejor anuncio"
            value={num(kpis.best?.ins?.ctr)}
            sub={
              kpis.best ? (
                <button
                  onClick={() => kpis.best && setSelected(kpis.best)}
                  className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--brand-ember))] hover:underline truncate max-w-[160px]"
                >
                  <Trophy className="size-3" /> {kpis.best.name.slice(0, 26)}…
                </button>
              ) : (
                "Sin datos suficientes"
              )
            }
            tone="ember"
            delay={0.15}
            format={(v) => `${v.toFixed(2)}%`}
          />
        </div>
      )}

      {/* Sticky filter bar */}
      {ads.length > 0 && (
        <div className="sticky top-[64px] z-20 -mx-1 px-1 py-2 backdrop-blur-md bg-background/70 border-y border-border/40">
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
              <SelectTrigger className="h-8 text-[11px] min-w-[150px]">
                <TrendingUp className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ctr">Orden: CTR ↓</SelectItem>
                <SelectItem value="spend">Orden: Gasto ↓</SelectItem>
                <SelectItem value="clicks">Orden: Clicks ↓</SelectItem>
                <SelectItem value="impressions">Orden: Impresiones ↓</SelectItem>
                <SelectItem value="name">Orden: Nombre A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <TextureCard className="p-4 border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)]">
          <div className="text-[12px] text-[hsl(var(--destructive))] font-mono">⚠ {error}</div>
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
              <Skeleton className="aspect-square !rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
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
          {filteredAds.map((a, i) => {
            const camp = campaigns.find((c) => c.cid === a.campaign_id);
            const thumb = a.creative?.thumbnail_url ?? a.creative?.image_url;
            const ctr = num(a.ins?.ctr);
            const liveStatus = a.effective_status ?? a.status;
            return (
              <motion.button
                key={a.id}
                onClick={() => setSelected(a)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.35 }}
                className="text-left"
              >
                <SpotlightCard className="overflow-hidden h-full hover:border-foreground/30 transition-colors">
                  <div className="aspect-square bg-secondary/60 relative overflow-hidden">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={a.name}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge
                        variant={liveStatus === "ACTIVE" ? "success" : "outline"}
                        className="!text-[9px]"
                      >
                        {liveStatus}
                      </Badge>
                      {camp && (
                        <Badge variant="violet" className="!text-[9px]">
                          {camp.code}
                        </Badge>
                      )}
                    </div>
                    {ctr >= 2 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="ember" className="!text-[9px] !px-1.5">
                          <Trophy className="size-2.5 mr-0.5" /> Top
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div
                      className="text-[11px] font-mono font-semibold truncate"
                      title={a.name}
                    >
                      {a.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 mb-2 truncate">
                      {camp?.name ?? "—"}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <Stat
                        label="Gasto"
                        value={
                          a.ins?.spend
                            ? fmt.eur(parseFloat(a.ins.spend), { decimals: 0 })
                            : "—"
                        }
                      />
                      <Stat
                        label="Impr."
                        value={
                          a.ins?.impressions
                            ? fmt.short(parseInt(a.ins.impressions, 10))
                            : "—"
                        }
                      />
                      <Stat
                        label="Clicks"
                        value={
                          a.ins?.clicks ? fmt.int(parseInt(a.ins.clicks, 10)) : "—"
                        }
                      />
                      <Stat
                        label="CTR"
                        value={
                          a.ins?.ctr ? `${parseFloat(a.ins.ctr).toFixed(2)}%` : "—"
                        }
                      />
                    </div>
                  </div>
                </SpotlightCard>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      <AdDrawer ad={selected} onClose={() => setSelected(null)} campaigns={campaigns} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-border/40 pt-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function AdDrawer({
  ad,
  onClose,
  campaigns,
}: {
  ad: MetaAd | null;
  onClose: () => void;
  campaigns: Array<{ cid: string; code: string; name: string; vertical: string }>;
}) {
  if (!ad) {
    return <Drawer open={false} onClose={onClose} />;
  }
  const camp = campaigns.find((c) => c.cid === ad.campaign_id);
  const thumb = ad.creative?.image_url ?? ad.creative?.thumbnail_url;
  const liveStatus = ad.effective_status ?? ad.status;
  const adsManagerUrl = `https://www.facebook.com/adsmanager/manage/ads/edit?act=${PLAN.meta.accountIdNumeric}&selected_ad_ids=${ad.id}`;

  return (
    <Drawer
      open={!!ad}
      onClose={onClose}
      title={ad.name}
      subtitle={camp ? `${camp.code} · ${camp.vertical}` : ad.id}
      footer={
        <a
          href={adsManagerUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full"
        >
          <Button variant="glow" size="sm" className="w-full">
            <ExternalLink className="size-3.5" /> Abrir en Meta Ads Manager
          </Button>
        </a>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge
            variant={liveStatus === "ACTIVE" ? "success" : "outline"}
            className="!text-[10px]"
          >
            {liveStatus}
          </Badge>
          {camp && (
            <Badge variant="violet" className="!text-[10px]">
              {camp.code}
            </Badge>
          )}
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
            ID {ad.id.slice(-10)}
          </span>
        </div>

        {/* Preview */}
        <div className="rounded-lg overflow-hidden border border-border bg-secondary/50">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt={ad.name} className="w-full h-auto block" />
          ) : (
            <div className="aspect-square grid place-items-center text-muted-foreground/40">
              <ImageOff className="size-10" />
            </div>
          )}
        </div>

        {/* Copy */}
        {(ad.creative?.title || ad.creative?.body) && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Copy del creativo
            </div>
            {ad.creative?.title && (
              <div className="text-[12px] font-semibold leading-snug">
                {ad.creative.title}
              </div>
            )}
            {ad.creative?.body && (
              <div className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {ad.creative.body}
              </div>
            )}
          </div>
        )}

        {/* Métricas */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Métricas this_month
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricCell
              label="Gasto"
              value={ad.ins?.spend ? fmt.eur(num(ad.ins.spend), { decimals: 2 }) : "—"}
              tone="violet"
            />
            <MetricCell
              label="Impresiones"
              value={ad.ins?.impressions ? fmt.int(num(ad.ins.impressions)) : "—"}
            />
            <MetricCell
              label="Clicks"
              value={ad.ins?.clicks ? fmt.int(num(ad.ins.clicks)) : "—"}
            />
            <MetricCell
              label="CTR"
              value={ad.ins?.ctr ? `${num(ad.ins.ctr).toFixed(2)}%` : "—"}
              tone={ctrTone(num(ad.ins?.ctr))}
            />
            <MetricCell
              label="CPM"
              value={ad.ins?.cpm ? fmt.eur(num(ad.ins.cpm), { decimals: 2 }) : "—"}
            />
            <MetricCell
              label="Frecuencia"
              value={ad.ins?.frequency ? num(ad.ins.frequency).toFixed(2) : "—"}
            />
            <MetricCell
              label="Reach"
              value={ad.ins?.reach ? fmt.int(num(ad.ins.reach)) : "—"}
              className="col-span-2"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function MetricCell({
  label,
  value,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  tone?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "violet"
    | "lime"
    | "ember"
    | "cyan";
  className?: string;
}) {
  const toneColor: Record<string, string> = {
    default: "text-foreground",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    danger: "text-[hsl(var(--destructive))]",
    info: "text-[hsl(var(--info))]",
    violet: "text-[hsl(var(--brand-violet))]",
    lime: "text-[hsl(var(--brand-lime))]",
    ember: "text-[hsl(var(--brand-ember))]",
    cyan: "text-[hsl(var(--brand-cyan))]",
  };
  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-card/60 px-3 py-2",
        className,
      )}
    >
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80 font-bold">
        {label}
      </div>
      <div className={cn("font-mono font-bold text-[14px] mt-0.5", toneColor[tone])}>
        {value}
      </div>
    </div>
  );
}
