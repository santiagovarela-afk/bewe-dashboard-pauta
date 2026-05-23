"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Link2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe2,
  Plug,
  FileText,
  Eye,
  MousePointerClick,
  ChartLine,
  Building2,
} from "lucide-react";
import { fmt, cn } from "@/lib/utils";
import { fakeTrend } from "@/lib/selectors";
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
import {
  SEO_SUMMARY,
  SEO_KEYWORDS,
  SEO_PAGES,
  SEO_ONPAGE,
  SEO_BACKLINK_TOPS,
  type OnPageCheck,
} from "@/components/seo/seed";

const STATUS_MAP: Record<OnPageCheck["status"], { Icon: typeof CheckCircle2; color: string; badge: "success" | "warning" | "danger" }> = {
  ok: { Icon: CheckCircle2, color: "var(--success)", badge: "success" },
  warn: { Icon: AlertTriangle, color: "var(--warning)", badge: "warning" },
  fail: { Icon: XCircle, color: "var(--destructive)", badge: "danger" },
};

const INTENT_VARIANT: Record<string, "default" | "violet" | "cyan" | "lime" | "ember"> = {
  comercial: "violet",
  transaccional: "lime",
  info: "cyan",
  navegacional: "ember",
};

export function TabSeo() {
  const [connectOpen, setConnectOpen] = React.useState(false);

  const okCount = SEO_ONPAGE.filter((c) => c.status === "ok").length;
  const warnCount = SEO_ONPAGE.filter((c) => c.status === "warn").length;
  const failCount = SEO_ONPAGE.filter((c) => c.status === "fail").length;
  const healthPct = Math.round((okCount / SEO_ONPAGE.length) * 100);

  return (
    <div className="space-y-7 max-w-[1500px]">
      {/* ─────── HERO + DEMO BANNER ─────── */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />
          <div className="absolute -top-24 -right-16 w-[420px] h-[420px] bg-[hsl(var(--brand-cyan)/0.16)] rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] bg-[hsl(var(--brand-lime)/0.12)] rounded-full blur-3xl" />

          <div className="relative px-6 md:px-10 py-7 md:py-9">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <Search className="size-3" />
                SEO · posicionamiento orgánico
              </div>
              <Badge variant="warning" className="font-mono">
                Demo · pendiente conectar GSC
              </Badge>
            </div>
            <div className="grid md:grid-cols-[1.5fr_1fr] gap-6 items-center">
              <div>
                <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-4xl leading-[1.05] mb-3">
                  Orgánico, contenido y <span className="text-aurora">authority.</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-[520px] leading-relaxed">
                  Vista para perfil <strong className="text-foreground/90">SEO / Content Lead</strong>.
                  Datos placeholder hasta integrar Google Search Console y Ahrefs.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <HeroStat label="Visitas org." value={fmt.short(SEO_SUMMARY.organicVisits)} sub={`+${SEO_SUMMARY.organicVisitsDeltaPct}% MoM`} accent="var(--brand-cyan)" />
                <HeroStat label="Keywords" value={fmt.int(SEO_SUMMARY.keywordsRanking)} sub={`${SEO_SUMMARY.keywordsTop10} en top 10`} accent="var(--brand-lime)" />
                <HeroStat label="Pos. media" value={SEO_SUMMARY.avgPosition.toFixed(1)} sub={`${SEO_SUMMARY.avgPositionDelta > 0 ? "+" : ""}${SEO_SUMMARY.avgPositionDelta} vs ayer`} accent="var(--brand-violet)" />
                <HeroStat label="DR Ahrefs" value={String(SEO_SUMMARY.domainRating)} sub={`${SEO_SUMMARY.referringDomains} ref. domains`} accent="var(--brand-ember)" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─────── KPI ROW ─────── */}
      <section>
        <SectionHeader title="KPIs orgánicos" sub="Snapshot · últimos 30 días (placeholder)" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Tráfico orgánico"
            value={SEO_SUMMARY.organicVisits}
            format={(v) => fmt.short(v)}
            sub={`+${SEO_SUMMARY.organicVisitsDeltaPct}% vs mes anterior`}
            tone="cyan"
            trend={fakeTrend(31, SEO_SUMMARY.organicVisits, 14, 0.12)}
            badge={<Badge variant="success"><TrendingUp className="size-2.5 mr-0.5" />MoM</Badge>}
            delay={0.02}
          />
          <KpiCard
            label="Keywords ranking"
            value={SEO_SUMMARY.keywordsRanking}
            format={(v) => fmt.int(v)}
            sub={`${SEO_SUMMARY.keywordsTop10} en TOP 10 · ${SEO_SUMMARY.keywordsRanking - SEO_SUMMARY.keywordsTop10} a empujar`}
            tone="lime"
            trend={fakeTrend(32, SEO_SUMMARY.keywordsRanking)}
            delay={0.06}
          />
          <KpiCard
            label="Posición media"
            value={SEO_SUMMARY.avgPosition}
            format={(v) => v.toFixed(1)}
            sub={`${SEO_SUMMARY.avgPositionDelta > 0 ? "↓" : "↑"} ${Math.abs(SEO_SUMMARY.avgPositionDelta)} vs ayer`}
            tone={SEO_SUMMARY.avgPosition <= 10 ? "success" : SEO_SUMMARY.avgPosition <= 20 ? "warning" : "danger"}
            trend={fakeTrend(33, SEO_SUMMARY.avgPosition)}
            delay={0.1}
          />
          <KpiCard
            label="CTR orgánico"
            value={SEO_SUMMARY.organicCtr}
            format={(v) => fmt.pct(v)}
            sub={`+${SEO_SUMMARY.organicCtrDelta}pp vs último ciclo`}
            tone="violet"
            trend={fakeTrend(34, SEO_SUMMARY.organicCtr)}
            delay={0.14}
          />
        </div>
      </section>

      {/* ─────── KEYWORDS TABLE ─────── */}
      <section>
        <SectionHeader
          title="Top keywords"
          sub="Mejores 10 queries ordenadas por clicks · placeholder"
          right={
            <Badge variant="outline" className="font-mono">
              {SEO_KEYWORDS.length} de {SEO_SUMMARY.keywordsRanking}
            </Badge>
          }
        />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Query</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    <ExplainedMetric explanation="Posición media en SERP (1 = primer resultado)">
                      <span>Pos</span>
                    </ExplainedMetric>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Vol./mes</th>
                  <th className="text-right px-4 py-3 font-semibold">Clicks</th>
                  <th className="text-right px-4 py-3 font-semibold">Impr.</th>
                  <th className="text-right px-4 py-3 font-semibold">CTR</th>
                  <th className="text-left px-4 py-3 font-semibold">Intent</th>
                </tr>
              </thead>
              <tbody>
                {SEO_KEYWORDS.map((k, i) => {
                  const posTone =
                    k.position <= 3 ? "var(--success)" :
                    k.position <= 10 ? "var(--brand-lime)" :
                    k.position <= 20 ? "var(--warning)" :
                    "var(--destructive)";
                  return (
                    <motion.tr
                      key={k.query}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                      className="border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground/90">{k.query}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="inline-block size-7 grid place-items-center rounded-md font-mono font-bold text-[11px] tabular"
                          style={{
                            background: `hsl(${posTone} / 0.14)`,
                            color: `hsl(${posTone})`,
                            border: `1px solid hsl(${posTone} / 0.35)`,
                          }}
                        >
                          {k.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular text-muted-foreground">
                        {fmt.short(k.monthlySearches)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular font-semibold">{fmt.int(k.clicks)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular text-muted-foreground">
                        {fmt.short(k.impressions)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular">{fmt.pct(k.ctr, 1)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={INTENT_VARIANT[k.intent]}>{k.intent}</Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* ─────── PAGES + AUDIT ─────── */}
      <section className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
        {/* TOP PAGES */}
        <TextureCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[hsl(var(--brand-violet))]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Páginas top · clicks
              </h3>
            </div>
            <Badge variant="outline" className="font-mono">{SEO_PAGES.length} URLs</Badge>
          </div>
          <div className="space-y-2">
            {SEO_PAGES.map((p, i) => {
              const max = Math.max(...SEO_PAGES.map((x) => x.clicks));
              const widthPct = (p.clicks / max) * 100;
              return (
                <motion.div
                  key={p.url}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="group"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold truncate">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">bewe.ai{p.url}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-mono font-bold tabular">{fmt.int(p.clicks)}</div>
                      <div className="text-[10px] text-muted-foreground">pos {p.avgPosition.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ delay: 0.06 * i + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TextureCard>

        {/* ON-PAGE AUDIT */}
        <TextureCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChartLine className="size-4 text-[hsl(var(--brand-lime))]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Auditoría on-page
              </h3>
            </div>
            <Badge variant={healthPct >= 80 ? "success" : healthPct >= 60 ? "warning" : "danger"} className="font-mono">
              {healthPct}% salud
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-4 text-[11px]">
            <span className="inline-flex items-center gap-1 text-[hsl(var(--success))]">
              <CheckCircle2 className="size-3" /> {okCount}
            </span>
            <span className="inline-flex items-center gap-1 text-[hsl(var(--warning))]">
              <AlertTriangle className="size-3" /> {warnCount}
            </span>
            <span className="inline-flex items-center gap-1 text-[hsl(var(--destructive))]">
              <XCircle className="size-3" /> {failCount}
            </span>
          </div>

          <ul className="space-y-1.5">
            {SEO_ONPAGE.map((c, i) => {
              const s = STATUS_MAP[c.status];
              return (
                <motion.li
                  key={c.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * i }}
                  className="flex items-start gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary/30 transition-colors"
                  title={c.detail}
                >
                  <s.Icon className="size-3.5 mt-0.5 shrink-0" style={{ color: `hsl(${s.color})` }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium leading-tight">{c.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                      {c.detail}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </TextureCard>
      </section>

      {/* ─────── BACKLINKS ─────── */}
      <section>
        <SectionHeader
          title="Authority · backlinks"
          sub="Top dominios que enlazan a bewe.ai · placeholder Ahrefs"
        />
        <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
          <SpotlightCard spotlightColor="var(--brand-ember)" intensity={0.28} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="size-9 grid place-items-center rounded-lg border"
                style={{
                  background: `hsl(var(--brand-ember) / 0.14)`,
                  borderColor: `hsl(var(--brand-ember) / 0.35)`,
                  color: `hsl(var(--brand-ember))`,
                }}
              >
                <Link2 className="size-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total backlinks</div>
                <div className="text-2xl font-mono font-bold tabular leading-none mt-1">
                  {fmt.int(SEO_SUMMARY.totalBacklinks)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="px-2 py-2 rounded-md bg-secondary/40">
                <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Ref. domains</div>
                <div className="font-mono font-bold text-[15px] tabular mt-0.5">{SEO_SUMMARY.referringDomains}</div>
              </div>
              <div className="px-2 py-2 rounded-md bg-secondary/40">
                <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">DR</div>
                <div className="font-mono font-bold text-[15px] tabular mt-0.5">{SEO_SUMMARY.domainRating}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 text-[10px] text-muted-foreground">
              Top referente: <span className="font-mono text-foreground/90">{SEO_SUMMARY.topRefDomain}</span>
            </div>
          </SpotlightCard>

          <TextureCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-[hsl(var(--brand-violet))]" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Top dominios referentes
                </h3>
              </div>
              <Badge variant="outline">Demo</Badge>
            </div>
            <div className="space-y-1.5">
              {SEO_BACKLINK_TOPS.map((b, i) => (
                <motion.div
                  key={b.domain}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.04 * i }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/30 transition-colors"
                >
                  <Globe2 className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-mono truncate">{b.domain}</div>
                    <div className="text-[10px] text-muted-foreground">{b.type}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono font-bold tabular">DR {b.dr}</div>
                    <div className="text-[10px] text-muted-foreground">{b.links} links</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TextureCard>
        </div>
      </section>

      {/* ─────── CTA ─────── */}
      <StaggerGroup className="grid md:grid-cols-3 gap-3">
        <StaggerItem>
          <SpotlightCard spotlightColor="var(--brand-cyan)" intensity={0.25} className="p-5">
            <Eye className="size-5 text-[hsl(var(--brand-cyan))] mb-2" />
            <h3 className="text-[13px] font-semibold mb-1">Google Search Console</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Para sustituir estos datos demo por tráfico orgánico real.
            </p>
            <Button variant="elevated" size="sm" onClick={() => setConnectOpen(true)}>
              <Plug className="size-3.5" /> Conectar GSC
            </Button>
          </SpotlightCard>
        </StaggerItem>
        <StaggerItem>
          <SpotlightCard spotlightColor="var(--brand-lime)" intensity={0.22} className="p-5">
            <MousePointerClick className="size-5 text-[hsl(var(--brand-lime))] mb-2" />
            <h3 className="text-[13px] font-semibold mb-1">Ahrefs / SEMrush</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Habilita ranking tracker + backlinks · API key requerida.
            </p>
            <Button variant="elevated" size="sm" disabled>
              <Plug className="size-3.5" /> Próximamente
            </Button>
          </SpotlightCard>
        </StaggerItem>
        <StaggerItem>
          <SpotlightCard spotlightColor="var(--brand-ember)" intensity={0.22} className="p-5">
            <TrendingDown className="size-5 text-[hsl(var(--brand-ember))] mb-2" />
            <h3 className="text-[13px] font-semibold mb-1">Lighthouse · CWV</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Auditoría automática mensual de Core Web Vitals por plantilla.
            </p>
            <Button variant="elevated" size="sm" disabled>
              <Plug className="size-3.5" /> Próximamente
            </Button>
          </SpotlightCard>
        </StaggerItem>
      </StaggerGroup>

      {/* Trend strip · fun visual */}
      <Reveal>
        <TextureCard className="p-4 flex items-center gap-4">
          <div className="shrink-0">
            <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Visitas org. · 14d</div>
            <div className="font-mono font-bold text-lg tabular leading-none mt-0.5">
              {fmt.short(SEO_SUMMARY.organicVisits)}
            </div>
          </div>
          <Sparkline
            data={fakeTrend(99, SEO_SUMMARY.organicVisits, 14, 0.22)}
            color="hsl(var(--brand-cyan))"
            height={36}
            className="flex-1"
          />
          <Badge variant="cyan">+{SEO_SUMMARY.organicVisitsDeltaPct}% MoM</Badge>
        </TextureCard>
      </Reveal>

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        platform="Google Search Console"
        accent="var(--brand-cyan)"
        steps={[
          "Verifica la propiedad de bewe.ai en Search Console.",
          "Genera un service account en Google Cloud con acceso a la API.",
          "Sube el JSON de credenciales al panel Config → Conectores.",
          "Espera la primera carga (≈5 min) y refresca esta vista.",
        ]}
        docsHref="https://developers.google.com/webmaster-tools"
      />
    </div>
  );
}

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
      <div className={cn("font-mono font-bold text-lg tabular leading-none")} style={{ color: `hsl(${accent})` }}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
    </TextureCard>
  );
}
