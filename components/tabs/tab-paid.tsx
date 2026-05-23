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
import { computeMetrics, fakeTrend } from "@/lib/selectors";
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
};

export function TabPaid() {
  const { campaigns } = useDashboard();
  const m = computeMetrics(campaigns);
  const [connectOpen, setConnectOpen] = React.useState<null | "google" | "tiktok">(null);

  // ── Cross-platform composite (Meta real + placeholders Google/TikTok) ──
  const metaSpend = m.spend;
  const googleSpendStub = 0;
  const tiktokSpendStub = 0;
  const totalSpend = metaSpend + googleSpendStub + tiktokSpendStub;
  const totalConv = m.totalConvCR + m.totalConvIC;
  const avgCpt = totalConv > 0 ? totalSpend / totalConv : null;
  // ROAS estimado · €60 ticket promedio
  const TICKET_EST = 60;
  const roasEst = totalSpend > 0 ? (totalConv * TICKET_EST) / totalSpend : 0;

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
    },
  ];

  // ── Top / Bottom Meta campaigns by CPT (excluyendo anomalía y sin conv) ──
  const ranked = campaigns
    .filter((c) => c.cpt !== null && c.flag !== "anomaly" && c.conversions > 0)
    .slice()
    .sort((a, b) => (a.cpt ?? 9999) - (b.cpt ?? 9999));
  const best3 = ranked.slice(0, 3);
  const worst3 = ranked.slice(-3).reverse();

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
            trend={fakeTrend(11, totalSpend)}
            delay={0.02}
          />
          <KpiCard
            label="Conversiones"
            value={totalConv}
            format={(v) => fmt.int(v)}
            sub={`${m.totalConvCR} CR · ${m.totalConvIC} IC`}
            tone="lime"
            trend={fakeTrend(12, totalConv)}
            delay={0.06}
          />
          <KpiCard
            label="CPT promedio"
            value={avgCpt ?? 0}
            format={(v) => fmt.eur(v)}
            sub={`obj. ≤ €${PLAN.cpt.target}`}
            tone={cptTone(avgCpt) === "success" ? "success" : cptTone(avgCpt) === "warning" ? "warning" : "danger"}
            trend={fakeTrend(13, avgCpt ?? 0)}
            delay={0.1}
          />
          <KpiCard
            label="ROAS estimado"
            value={roasEst}
            format={(v) => `${v.toFixed(2)}x`}
            sub={`asume ticket €${TICKET_EST}`}
            tone="cyan"
            trend={fakeTrend(14, roasEst)}
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
        <SectionHeader title="Comparativa cross-platform" sub="Plataforma × métrica · agregado del rango activo" />
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
          <Sparkline
            data={fakeTrend(platform.id.charCodeAt(0), platform.spend, 14, 0.16)}
            color={`hsl(${platform.accent})`}
            height={28}
            className="opacity-80 flex-1"
          />
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
