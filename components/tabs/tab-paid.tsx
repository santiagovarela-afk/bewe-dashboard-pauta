"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Plug,
  CircleDashed,
  Facebook,
  Music2,
  Search as SearchIcon,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import {
  computeMetrics,
  describeRange,
  realDailySeries,
  crCampaignIds,
  icCampaignIds,
} from "@/lib/selectors";
import type { DailyRow } from "@/lib/types";
import { cn, fmt, cptTone } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/section-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ExplainedMetric } from "@/components/shared/explained-metric";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/fx/reveal";
import { Sparkline } from "@/components/fx/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectModal } from "@/components/paid/connect-modal";

type Platform = {
  id: "meta" | "google" | "tiktok";
  name: string;
  status: "live" | "stub";
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  spend: number;
  conv: number;
  cpt: number | null;
  ctr: number;
  share: number;
  /** Serie diaria real de spend para sparkline · vacío = no se renderiza */
  spendSeries: number[];
};

export function TabPaid() {
  // CRÍTICO: usamos `campaigns` (ya filtrado por dateRange en el store, NUNCA
  // `rawCampaigns`). Toda métrica derivada de esta variable respeta el rango
  // del topbar sin necesidad de re-fetch.
  const { campaigns, dateRange, daily, daysElapsed } = useDashboard();
  const m = React.useMemo(() => computeMetrics(campaigns), [campaigns]);
  const rangeCtx = React.useMemo(
    () => describeRange(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to],
  );
  const [connectOpen, setConnectOpen] = React.useState<null | "google" | "tiktok">(null);

  // ── Cross-platform composite (Meta real + placeholders Google/TikTok) ──
  const metaSpend = m.spend;
  const googleSpendStub = 0;
  const tiktokSpendStub = 0;
  const totalSpend = metaSpend + googleSpendStub + tiktokSpendStub;
  const totalConv = m.totalConvCR + m.totalConvIC;
  const avgCpt = totalConv > 0 ? totalSpend / totalConv : null;
  // ROAS estimado · €60 ticket promedio (no es revenue real · ver banner)
  const TICKET_EST = 60;
  const roasEst = totalSpend > 0 ? (totalConv * TICKET_EST) / totalSpend : 0;

  // Series reales por día para los KPIs del header
  const crIds = React.useMemo(() => crCampaignIds(campaigns), [campaigns]);
  const icIds = React.useMemo(() => icCampaignIds(campaigns), [campaigns]);
  const spendSeries = React.useMemo(
    () => realDailySeries(daily, dateRange, "spend"),
    [daily, dateRange],
  );
  // "Conversiones" = CR + IC reales · sumamos las dos series por día
  const convSeries = React.useMemo(() => {
    const cr = realDailySeries(daily, dateRange, "convCR", crIds);
    const ic = realDailySeries(daily, dateRange, "convIC", icIds);
    const len = Math.max(cr.length, ic.length);
    if (len === 0) return [];
    const out: number[] = [];
    for (let i = 0; i < len; i++) out.push((cr[i] ?? 0) + (ic[i] ?? 0));
    return out;
  }, [daily, dateRange, crIds, icIds]);
  // CPT promedio diario = spend / (CR + IC) por día
  const avgCptSeries = React.useMemo(() => {
    if (spendSeries.length === 0 || convSeries.length === 0) return [];
    const len = Math.min(spendSeries.length, convSeries.length);
    const out: number[] = [];
    for (let i = 0; i < len; i++) {
      out.push(convSeries[i] > 0 ? spendSeries[i] / convSeries[i] : 0);
    }
    return out;
  }, [spendSeries, convSeries]);

  const platforms: Platform[] = [
    {
      id: "meta",
      name: "Meta Ads",
      status: "live",
      Icon: Facebook,
      accent: "var(--brand-violet)",
      spend: metaSpend,
      conv: totalConv,
      cpt: m.cptReg,
      ctr: m.ctr,
      share: totalSpend > 0 ? (metaSpend / totalSpend) * 100 : 100,
      spendSeries,
    },
    {
      id: "google",
      name: "Google Ads",
      status: "stub",
      Icon: SearchIcon,
      accent: "var(--brand-ember)",
      spend: 0,
      conv: 0,
      cpt: null,
      ctr: 0,
      share: 0,
      spendSeries: [],
    },
    {
      id: "tiktok",
      name: "TikTok Ads",
      status: "stub",
      Icon: Music2,
      accent: "var(--brand-cyan)",
      spend: 0,
      conv: 0,
      cpt: null,
      ctr: 0,
      share: 0,
      spendSeries: [],
    },
  ];

  // ── Top / Bottom Meta campaigns by CPT (excluyendo anomalía y sin conv) ──
  // Memoizado contra `campaigns` para que cambie con el rango sin recomputar
  // todo el árbol.
  const { best3, worst3 } = React.useMemo(() => {
    const ranked = campaigns
      .filter((c) => c.cpt !== null && c.flag !== "anomaly" && c.conversions > 0)
      .slice()
      .sort((a, b) => (a.cpt ?? 9999) - (b.cpt ?? 9999));
    return {
      best3: ranked.slice(0, 3),
      worst3: ranked.slice(-3).reverse(),
    };
  }, [campaigns]);

  return (
    <div className="space-y-7 max-w-[1500px]">
      {/* ─────── HERO ─────── */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />
          <div className="absolute -top-24 -right-16 w-[420px] h-[420px] bg-[hsl(var(--brand-violet)/0.18)] rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-[380px] h-[380px] bg-[hsl(var(--brand-ember)/0.12)] rounded-full blur-3xl" />

          <div className="relative px-6 md:px-10 py-7 md:py-9 grid md:grid-cols-[1.5fr_1fr] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                <Layers className="size-3" />
                Paid Media · vista cross-platform
                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))] font-mono normal-case tracking-normal">
                  {rangeCtx.label}
                </span>
              </div>
              <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-4xl leading-[1.05] mb-3">
                Inversión paid <span className="text-aurora">multi-canal.</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-[520px] leading-relaxed">
                Vista unificada para perfil <strong className="text-foreground/90">Paid Media Lead</strong>.
                Meta Ads en vivo · Google y TikTok pendientes de conectar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroStat
                label="Total cross"
                value={fmt.eur(totalSpend, { decimals: 0 })}
                sub={`${platforms.filter((p) => p.status === "live").length}/3 canales`}
              />
              <HeroStat
                label="CPT prom."
                value={avgCpt !== null ? fmt.eur(avgCpt) : "—"}
                sub={`${totalConv} conv`}
                accent="var(--brand-cyan)"
              />
              <HeroStat
                label="ROAS est."
                value={`${roasEst.toFixed(2)}x`}
                sub={`ticket €${TICKET_EST}`}
                accent="var(--brand-lime)"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─────── KPI ROW ─────── */}
      <section>
        <SectionHeader title="Resumen consolidado" sub="Datos de Meta · placeholders para Google + TikTok" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Inversión total"
            value={totalSpend}
            format={(v) => fmt.eur(v, { decimals: 0 })}
            sub={`${Math.round((metaSpend / Math.max(totalSpend, 1)) * 100)}% en Meta`}
            tone="violet"
            trend={spendSeries}
            delay={0.02}
          />
          <KpiCard
            label="Conversiones"
            value={totalConv}
            format={(v) => fmt.int(v)}
            sub={`${m.totalConvCR} CR · ${m.totalConvIC} IC`}
            tone="lime"
            trend={convSeries}
            delay={0.06}
          />
          <KpiCard
            label="CPT promedio"
            value={avgCpt ?? 0}
            format={(v) => fmt.eur(v)}
            sub={`obj. ≤ €${PLAN.cpt.target}`}
            tone={cptTone(avgCpt) === "success" ? "success" : cptTone(avgCpt) === "warning" ? "warning" : "danger"}
            trend={avgCptSeries}
            delay={0.1}
          />
          <KpiCard
            label="ROAS estimado"
            value={roasEst}
            format={(v) => `${v.toFixed(2)}x`}
            sub={`asume ticket €${TICKET_EST} · estimación`}
            tone="cyan"
            badge={<Badge variant="warning" className="font-mono">Estimación</Badge>}
            delay={0.14}
          />
        </div>
      </section>

      {/* ─────── PLATFORMS ─────── */}
      <section>
        <SectionHeader
          title="Por plataforma"
          sub="Click para ver detalle · 2 conexiones por activar"
          right={
            <Badge variant="violet" className="font-mono">
              {platforms.filter((p) => p.status === "live").length} activas
            </Badge>
          }
        />
        <StaggerGroup className="grid md:grid-cols-3 gap-3">
          {platforms.map((p) => (
            <StaggerItem key={p.id}>
              <PlatformCard
                platform={p}
                onConnect={() => p.status === "stub" && setConnectOpen(p.id as "google" | "tiktok")}
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ─────── DISTRIBUCIÓN + PROYECCIÓN ─────── */}
      <section className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
        <SpendShareDonut
          metaSpend={metaSpend}
          googleStub={googleSpendStub}
          tiktokStub={tiktokSpendStub}
          total={totalSpend}
        />
        <MonthlyProjection daily={daily} totalSpend={metaSpend} daysElapsed={daysElapsed} />
      </section>

      {/* ─────── TOP CAMPAÑAS + CONVERSIONES POR CANAL ─────── */}
      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <TopCampaignsActive campaigns={campaigns} daily={daily} />
        <ConversionsByChannel
          metaConv={totalConv}
          metaCR={m.totalConvCR}
          metaIC={m.totalConvIC}
        />
      </section>

      {/* ─────── BEST / WORST META ─────── */}
      <section>
        <SectionHeader
          title="Meta · ranking de campañas"
          sub="Top 3 (mejor CPT) vs Bottom 3 — excluye anomalías"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <RankingCard
            title="Mejor rendimiento"
            tone="success"
            Icon={TrendingUp}
            campaigns={best3}
          />
          <RankingCard
            title="Atención inmediata"
            tone="danger"
            Icon={TrendingDown}
            campaigns={worst3}
          />
        </div>
      </section>

      {/* ─────── COMPARATIVE TABLE ─────── */}
      <section>
        <SectionHeader title="Comparativa cross-platform" sub={`Plataforma × métrica · ${rangeCtx.label.toLowerCase()}`} />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Plataforma</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    <ExplainedMetric explanation="Gasto total en el período activo">
                      <span>Spend</span>
                    </ExplainedMetric>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Conv</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    <ExplainedMetric explanation="Coste por trial / inicio de pago · más bajo = mejor">
                      <span>CPT</span>
                    </ExplainedMetric>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">CTR</th>
                  <th className="text-right px-4 py-3 font-semibold">Share</th>
                  <th className="text-right px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i }}
                    className="border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-7 grid place-items-center rounded-md border"
                          style={{
                            background: `hsl(${p.accent} / 0.12)`,
                            borderColor: `hsl(${p.accent} / 0.35)`,
                            color: `hsl(${p.accent})`,
                          }}
                        >
                          <p.Icon className="size-3.5" />
                        </div>
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {p.status === "live" ? fmt.eur(p.spend, { decimals: 0 }) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {p.status === "live" ? fmt.int(p.conv) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {p.status === "live" && p.cpt !== null ? fmt.eur(p.cpt) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {p.status === "live" ? fmt.pct(p.ctr) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular">
                      {p.status === "live" ? `${p.share.toFixed(0)}%` : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "live" ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Por conectar</Badge>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* ─────── CTA ─────── */}
      <section className="grid md:grid-cols-2 gap-3">
        <SpotlightCard spotlightColor="var(--brand-ember)" intensity={0.25} className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 size-10 grid place-items-center rounded-lg border"
              style={{
                background: `hsl(var(--brand-ember) / 0.14)`,
                borderColor: `hsl(var(--brand-ember) / 0.35)`,
                color: `hsl(var(--brand-ember))`,
              }}
            >
              <SearchIcon className="size-[18px]" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold mb-1">Activar Google Ads</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                Conecta tu cuenta de Google Ads para ver Search + Display + YouTube en este mismo panel.
              </p>
              <Button variant="elevated" size="sm" onClick={() => setConnectOpen("google")}>
                <Plug className="size-3.5" /> Conectar Google Ads
              </Button>
            </div>
          </div>
        </SpotlightCard>
        <SpotlightCard spotlightColor="var(--brand-cyan)" intensity={0.25} className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 size-10 grid place-items-center rounded-lg border"
              style={{
                background: `hsl(var(--brand-cyan) / 0.14)`,
                borderColor: `hsl(var(--brand-cyan) / 0.35)`,
                color: `hsl(var(--brand-cyan))`,
              }}
            >
              <Music2 className="size-[18px]" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold mb-1">Activar TikTok Ads</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                Sincroniza Spark Ads + In-Feed para complementar la pauta de Meta con LATAM joven.
              </p>
              <Button variant="elevated" size="sm" onClick={() => setConnectOpen("tiktok")}>
                <Plug className="size-3.5" /> Conectar TikTok Ads
              </Button>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* ─────── MODALS ─────── */}
      <ConnectModal
        open={connectOpen === "google"}
        onClose={() => setConnectOpen(null)}
        platform="Google Ads"
        accent="var(--brand-ember)"
        steps={[
          "Login con la cuenta admin que tenga acceso a Google Ads.",
          "Autorizar lectura del MCC + Customer ID elegido.",
          "Mapear conversiones de Google Ads → métricas internas (CR/IC).",
          "Esperar primera sincronización (~10 min) y verificar en este panel.",
        ]}
        docsHref="https://developers.google.com/google-ads/api/docs/start"
      />
      <ConnectModal
        open={connectOpen === "tiktok"}
        onClose={() => setConnectOpen(null)}
        platform="TikTok Ads"
        accent="var(--brand-cyan)"
        steps={[
          "Crear app en TikTok Business Center con permisos de Ads Reporting.",
          "Autorizar el Advertiser ID en el flujo OAuth.",
          "Definir mapeo de eventos pixel (CompleteRegistration / InitiateCheckout).",
          "Activar el connector y validar la primera carga.",
        ]}
        docsHref="https://business-api.tiktok.com/portal/docs"
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function HeroStat({
  label,
  value,
  sub,
  accent = "var(--foreground)",
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <TextureCard className="px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</div>
      <div className="font-mono font-bold text-lg tabular leading-none" style={{ color: `hsl(${accent})` }}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
    </TextureCard>
  );
}

function PlatformCard({ platform, onConnect }: { platform: Platform; onConnect: () => void }) {
  const isLive = platform.status === "live";
  return (
    <SpotlightCard
      spotlightColor={platform.accent}
      intensity={isLive ? 0.3 : 0.18}
      className={cn("p-5", !isLive && "opacity-90")}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="size-10 grid place-items-center rounded-lg border"
            style={{
              background: `hsl(${platform.accent} / 0.14)`,
              borderColor: `hsl(${platform.accent} / 0.35)`,
              color: `hsl(${platform.accent})`,
            }}
          >
            <platform.Icon className="size-5" />
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-tight">{platform.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isLive ? "Datos en vivo · Meta Marketing API" : "Pendiente · placeholder"}
            </div>
          </div>
        </div>
        {isLive ? (
          <Badge variant="success">Live</Badge>
        ) : (
          <Badge variant="outline">
            <CircleDashed className="size-2.5 mr-1" /> Stub
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Metric label="Spend" value={isLive ? fmt.eur(platform.spend, { decimals: 0 }) : "—"} />
        <Metric label="Conv" value={isLive ? fmt.int(platform.conv) : "—"} />
        <Metric label="CPT" value={isLive && platform.cpt !== null ? fmt.eur(platform.cpt) : "—"} />
        <Metric label="CTR" value={isLive ? fmt.pct(platform.ctr) : "—"} />
      </div>

      {isLive ? (
        <div className="flex items-center justify-between gap-2">
          {platform.spendSeries.length > 1 ? (
            <Sparkline
              data={platform.spendSeries}
              color={`hsl(${platform.accent})`}
              height={28}
              className="opacity-80 flex-1"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground flex-1">Sin breakdown diario en el rango</span>
          )}
          <Badge variant="violet" className="font-mono">{platform.share.toFixed(0)}% mix</Badge>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={onConnect}>
          <Plug className="size-3.5" /> Conectar {platform.name}
        </Button>
      )}
    </SpotlightCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-1.5 rounded-md bg-secondary/40">
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold text-[13px] tabular leading-tight mt-0.5">{value}</div>
    </div>
  );
}

/* ─── A · Distribución de gasto (donut SVG) ────────────────────────── */
function SpendShareDonut({
  metaSpend,
  googleStub,
  tiktokStub,
  total,
}: {
  metaSpend: number;
  googleStub: number;
  tiktokStub: number;
  total: number;
}) {
  const slices = [
    { id: "meta", label: "Meta Ads", value: metaSpend, color: "var(--brand-violet)", active: true },
    { id: "google", label: "Google Ads", value: googleStub > 0 ? googleStub : 0.001 * total || 1, color: "var(--brand-ember)", active: false },
    { id: "tiktok", label: "TikTok Ads", value: tiktokStub > 0 ? tiktokStub : 0.001 * total || 1, color: "var(--brand-cyan)", active: false },
  ];
  const safeTotal = slices.reduce((s, x) => s + x.value, 0);
  // Donut math · 360deg in conic-gradient
  let cursor = 0;
  const stops = slices.map((s) => {
    const start = cursor;
    const pct = (s.value / safeTotal) * 100;
    cursor += pct;
    return { ...s, start, end: cursor, pct };
  });
  const conic = stops
    .map((s) => `hsl(${s.color} / ${s.active ? 1 : 0.18}) ${s.start}% ${s.end}%`)
    .join(", ");

  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Distribución de gasto
          </h3>
          <div className="text-[10px] text-muted-foreground mt-0.5">Mix por plataforma · período actual</div>
        </div>
        <Badge variant="violet" className="font-mono">100% Meta</Badge>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div
            className="size-[120px] rounded-full"
            style={{ background: `conic-gradient(${conic})` }}
            aria-hidden
          />
          <div
            className="absolute inset-[14px] rounded-full bg-card flex flex-col items-center justify-center border border-border/60"
          >
            <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Total</div>
            <div className="font-mono font-bold text-[13px] tabular leading-none mt-0.5">
              {fmt.eur(total, { decimals: 0 })}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {stops.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-[11px]">
              <span
                className="size-2.5 rounded-sm shrink-0"
                style={{
                  background: `hsl(${s.color} / ${s.active ? 1 : 0.25})`,
                  border: `1px solid hsl(${s.color} / 0.5)`,
                }}
              />
              <span className="font-medium flex-1">{s.label}</span>
              <span className="font-mono tabular text-muted-foreground">
                {s.active ? `${s.pct.toFixed(0)}%` : "0%"}
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground mt-3 leading-snug">
            100% Meta · al conectar Google/TikTok verás el reparto real.
          </p>
        </div>
      </div>
    </TextureCard>
  );
}

/* ─── B · Proyección mensual (line chart SVG) ──────────────────────── */
function MonthlyProjection({
  daily,
  totalSpend,
  daysElapsed,
}: {
  daily: DailyRow[];
  totalSpend: number;
  daysElapsed: number;
}) {
  // Agregar spend por día (across campaigns) · solo días dentro de PLAN
  const dailyTotals = React.useMemo(() => {
    const byDate = new Map<string, number>();
    for (const d of daily) {
      byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.spend);
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [daily]);

  const totalDays = PLAN.totalDays || 30;
  const W = 480;
  const H = 160;
  const PADL = 32;
  const PADR = 12;
  const PADT = 14;
  const PADB = 22;
  const innerW = W - PADL - PADR;
  const innerH = H - PADT - PADB;

  // Cumulative real spend
  let acc = 0;
  const cumPoints = dailyTotals.map(([date, s], i) => {
    acc += s;
    return { i, date, day: i + 1, value: acc };
  });
  const lastVal = cumPoints.length > 0 ? cumPoints[cumPoints.length - 1].value : totalSpend;
  const planBudget = PLAN.budget > 0 ? PLAN.budget : Math.max(lastVal * (totalDays / Math.max(daysElapsed, 1)), lastVal * 1.2);
  const yMax = Math.max(planBudget, lastVal) * 1.1;

  const xForDay = (d: number) => PADL + ((d - 1) / Math.max(totalDays - 1, 1)) * innerW;
  const yForVal = (v: number) => PADT + innerH - (v / Math.max(yMax, 1)) * innerH;

  // Linea de presupuesto lineal · de (day1, 0) a (totalDays, planBudget)
  const planX1 = xForDay(1);
  const planY1 = yForVal(0);
  const planX2 = xForDay(totalDays);
  const planY2 = yForVal(planBudget);

  // Real cumulative path
  const realPath = cumPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xForDay(p.day).toFixed(1)} ${yForVal(p.value).toFixed(1)}`)
    .join(" ");

  const todayDay = Math.min(daysElapsed, totalDays);
  const todayX = xForDay(Math.max(todayDay, 1));

  // Y axis ticks (0, mid, max)
  const yTicks = [0, planBudget * 0.5, planBudget];

  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Proyección mensual
          </h3>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Gasto acumulado vs pacing lineal · día {todayDay} / {totalDays}
          </div>
        </div>
        <Badge
          variant={lastVal <= planBudget * (todayDay / totalDays) * 1.05 ? "success" : "warning"}
          className="font-mono"
        >
          {fmt.eur(lastVal, { decimals: 0 })} / {fmt.eur(planBudget, { decimals: 0 })}
        </Badge>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[180px]" role="img" aria-label="Proyección mensual">
          {/* grid */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={PADL}
                x2={W - PADR}
                y1={yForVal(t)}
                y2={yForVal(t)}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray={i === 0 ? "0" : "2 3"}
                opacity={0.6}
              />
              <text
                x={PADL - 4}
                y={yForVal(t) + 3}
                textAnchor="end"
                fontSize="8"
                fill="hsl(var(--muted-foreground))"
                fontFamily="ui-monospace, monospace"
              >
                €{fmt.short(t)}
              </text>
            </g>
          ))}

          {/* x-axis labels */}
          {[1, Math.round(totalDays / 2), totalDays].map((d) => (
            <text
              key={d}
              x={xForDay(d)}
              y={H - 6}
              textAnchor="middle"
              fontSize="8"
              fill="hsl(var(--muted-foreground))"
              fontFamily="ui-monospace, monospace"
            >
              d{d}
            </text>
          ))}

          {/* Plan line (linear expected) */}
          <line
            x1={planX1}
            y1={planY1}
            x2={planX2}
            y2={planY2}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.7}
          />

          {/* Today vertical line */}
          <line
            x1={todayX}
            y1={PADT}
            x2={todayX}
            y2={H - PADB}
            stroke="hsl(var(--brand-ember))"
            strokeWidth={1}
            strokeDasharray="2 2"
            opacity={0.8}
          />
          <text
            x={todayX + 3}
            y={PADT + 8}
            fontSize="8"
            fill="hsl(var(--brand-ember))"
            fontFamily="ui-monospace, monospace"
          >
            hoy
          </text>

          {/* Real cumulative line */}
          {cumPoints.length > 0 && (
            <>
              <path
                d={realPath}
                fill="none"
                stroke="hsl(var(--brand-violet))"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* area under */}
              <path
                d={`${realPath} L ${xForDay(cumPoints[cumPoints.length - 1].day).toFixed(1)} ${(H - PADB).toFixed(1)} L ${xForDay(cumPoints[0].day).toFixed(1)} ${(H - PADB).toFixed(1)} Z`}
                fill="hsl(var(--brand-violet) / 0.14)"
              />
            </>
          )}
        </svg>
      </div>

      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-0.5" style={{ background: `hsl(var(--brand-violet))` }} />
          Real acumulado
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-px border-t border-dashed border-muted-foreground" />
          Presupuesto lineal
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-px h-3 border-l border-dashed border-[hsl(var(--brand-ember))]" />
          Hoy
        </span>
      </div>
    </TextureCard>
  );
}

/* ─── C · Top 3 campañas activas ────────────────────────────────────── */
function TopCampaignsActive({
  campaigns,
  daily,
}: {
  campaigns: ReturnType<typeof useDashboard>["campaigns"];
  daily: DailyRow[];
}) {
  const top = React.useMemo(() => {
    return campaigns
      .filter((c) => c.status === "ACTIVE" && c.conversions > 0 && c.cpt !== null)
      .slice()
      .sort((a, b) => (a.cpt ?? 9999) - (b.cpt ?? 9999))
      .slice(0, 3);
  }, [campaigns]);

  // Trend 7d por campaña usando CPT diario · si no hay daily, usa fakeTrend.
  function trendArrow(cid: string, cptCur: number | null): "up" | "down" | "flat" {
    if (cptCur === null) return "flat";
    const rows = daily.filter((d) => d.campaignId === cid).slice(-7);
    if (rows.length < 4) return "flat";
    const half = Math.floor(rows.length / 2);
    const early = rows.slice(0, half);
    const late = rows.slice(half);
    const earlyConv = early.reduce((s, r) => s + r.evCompleteReg + r.evInitCheckout, 0);
    const lateConv = late.reduce((s, r) => s + r.evCompleteReg + r.evInitCheckout, 0);
    const earlySpend = early.reduce((s, r) => s + r.spend, 0);
    const lateSpend = late.reduce((s, r) => s + r.spend, 0);
    const earlyCpt = earlyConv > 0 ? earlySpend / earlyConv : null;
    const lateCpt = lateConv > 0 ? lateSpend / lateConv : null;
    if (earlyCpt === null || lateCpt === null) return "flat";
    const delta = (lateCpt - earlyCpt) / earlyCpt;
    if (delta < -0.05) return "down"; // CPT bajó · MEJOR
    if (delta > 0.05) return "up"; // CPT subió · PEOR
    return "flat";
  }

  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Top 3 campañas activas
          </h3>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Mejor CPT · con conversiones · tendencia 7 días
          </div>
        </div>
        <Badge variant="success" className="font-mono">live</Badge>
      </div>

      {top.length === 0 ? (
        <div className="text-[12px] text-muted-foreground text-center py-8">
          Sin campañas activas con conversiones aún.
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((c, i) => {
            const arr = trendArrow(c.cid, c.cpt);
            // arr "down" = CPT bajó = mejor (verde)
            const arrColor =
              arr === "down" ? "var(--success)" : arr === "up" ? "var(--destructive)" : "var(--muted-foreground)";
            const arrChar = arr === "down" ? "↓" : arr === "up" ? "↑" : "→";
            return (
              <motion.div
                key={c.cid}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 bg-card/60 hover:bg-secondary/30 transition-colors"
              >
                <span
                  className="size-7 grid place-items-center rounded-md font-mono text-[10px] font-bold shrink-0"
                  style={{
                    background: `hsl(var(--brand-violet) / 0.14)`,
                    color: `hsl(var(--brand-violet))`,
                    border: `1px solid hsl(var(--brand-violet) / 0.35)`,
                  }}
                >
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.code} · {c.geo} · {fmt.int(c.conversions)} conv · {fmt.eur(c.spend, { decimals: 0 })} spend
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-[14px] tabular leading-none">
                    {c.cpt !== null ? fmt.eur(c.cpt) : "—"}
                  </div>
                  <div className="text-[10px] mt-0.5 inline-flex items-center gap-1">
                    <span className="text-muted-foreground">CPT 7d</span>
                    <span className="font-mono font-bold" style={{ color: `hsl(${arrColor})` }}>
                      {arrChar}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </TextureCard>
  );
}

/* ─── D · Conversiones por canal (bar chart horizontal) ────────────── */
function ConversionsByChannel({
  metaConv,
  metaCR,
  metaIC,
}: {
  metaConv: number;
  metaCR: number;
  metaIC: number;
}) {
  const bars = [
    { id: "meta", label: "Meta Ads", value: metaConv, color: "var(--brand-violet)", active: true, sub: `${metaCR} CR · ${metaIC} IC` },
    { id: "google", label: "Google Ads", value: 0, color: "var(--brand-ember)", active: false, sub: "pendiente conectar" },
    { id: "tiktok", label: "TikTok Ads", value: 0, color: "var(--brand-cyan)", active: false, sub: "pendiente conectar" },
  ];
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Conversiones por canal
          </h3>
          <div className="text-[10px] text-muted-foreground mt-0.5">CR + IC · acumulado período</div>
        </div>
        <Badge variant="outline" className="font-mono">{fmt.int(metaConv)} total</Badge>
      </div>
      <div className="space-y-3">
        {bars.map((b, i) => {
          const pct = b.active ? (b.value / max) * 100 : 0;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{b.label}</span>
                  {!b.active && <Badge variant="outline" className="text-[9px]">pendiente conectar</Badge>}
                </div>
                <span className="font-mono tabular font-bold">
                  {b.active ? fmt.int(b.value) : "—"}
                </span>
              </div>
              <div className="h-2.5 bg-secondary/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, b.active ? 4 : 0)}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 + 0.05 * i }}
                  className="h-full rounded-full"
                  style={{
                    background: b.active
                      ? `linear-gradient(90deg, hsl(${b.color}), hsl(${b.color} / 0.55))`
                      : `repeating-linear-gradient(45deg, hsl(${b.color} / 0.1) 0 4px, transparent 4px 8px)`,
                  }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{b.sub}</div>
            </motion.div>
          );
        })}
      </div>
    </TextureCard>
  );
}

function RankingCard({
  title,
  tone,
  Icon,
  campaigns,
}: {
  title: string;
  tone: "success" | "danger";
  Icon: React.ComponentType<{ className?: string }>;
  campaigns: ReturnType<typeof useDashboard>["campaigns"];
}) {
  const accent = tone === "success" ? "var(--success)" : "var(--destructive)";
  return (
    <TextureCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="size-8 grid place-items-center rounded-md border"
            style={{
              background: `hsl(${accent} / 0.12)`,
              borderColor: `hsl(${accent} / 0.35)`,
              color: `hsl(${accent})`,
            }}
          >
            <Icon className="size-4" />
          </div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </h3>
        </div>
        <Badge variant={tone === "success" ? "success" : "danger"}>
          {tone === "success" ? "Escalar" : "Pausar/ajustar"}
        </Badge>
      </div>
      {campaigns.length === 0 ? (
        <div className="text-[12px] text-muted-foreground py-6 text-center">
          Sin datos suficientes para rankear.
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c, i) => {
            const ArrowIcon = tone === "success" ? ArrowUpRight : ArrowDownRight;
            return (
              <motion.div
                key={c.cid}
                initial={{ opacity: 0, x: tone === "success" ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/60 bg-card/50 hover:bg-secondary/30 transition-colors"
              >
                <span
                  className="size-6 grid place-items-center rounded-md font-mono text-[10px] font-bold"
                  style={{
                    background: `hsl(${accent} / 0.14)`,
                    color: `hsl(${accent})`,
                  }}
                >
                  {c.code}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.geo} · {c.vertical} · {c.conversions} conv
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="font-mono font-bold text-[14px] tabular leading-none"
                    style={{ color: `hsl(${accent})` }}
                  >
                    {c.cpt !== null ? fmt.eur(c.cpt) : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-0.5">
                    CTR <span className="font-mono">{fmt.pct(c.ctr, 1)}</span>
                    <ArrowIcon className="size-2.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </TextureCard>
  );
}
