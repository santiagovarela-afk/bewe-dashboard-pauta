"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Search,
  AlertTriangle,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  MousePointerClick,
  Eye,
  Percent,
  Target,
  FileText,
} from "lucide-react";
import { fmt, cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/section-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { TextureCard } from "@/components/fx/texture-card";
import { Reveal } from "@/components/fx/reveal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  GSCDaily,
  GSCOverview,
  GSCPage,
  GSCQuery,
} from "@/lib/google-search-console";

type Period = 7 | 28 | 90;

interface ApiResponse<T> {
  data?: T;
  error?: string;
  configured: boolean;
}

type QuerySortKey = "query" | "clicks" | "impressions" | "ctr" | "position";
type PageSortKey = "page" | "clicks" | "impressions" | "ctr" | "position";
type SortDir = "asc" | "desc";

export function TabSeo() {
  const [period, setPeriod] = React.useState<Period>(28);

  const [overview, setOverview] = React.useState<GSCOverview | null>(null);
  const [queries, setQueries] = React.useState<GSCQuery[]>([]);
  const [pages, setPages] = React.useState<GSCPage[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [configured, setConfigured] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const [oRes, qRes, pRes] = await Promise.all([
          fetch(`/api/seo/overview?days=${period}`),
          fetch(`/api/seo/queries?days=${period}&limit=50`),
          fetch(`/api/seo/pages?days=${period}&limit=25`),
        ]);
        const oJson = (await oRes.json()) as ApiResponse<GSCOverview>;
        const qJson = (await qRes.json()) as ApiResponse<GSCQuery[]>;
        const pJson = (await pRes.json()) as ApiResponse<GSCPage[]>;

        if (cancelled) return;

        const allConfigured = oJson.configured && qJson.configured && pJson.configured;
        setConfigured(allConfigured);

        if (!allConfigured) {
          setErrorMsg(oJson.error ?? qJson.error ?? pJson.error ?? null);
          setOverview(null);
          setQueries([]);
          setPages([]);
        } else {
          setOverview(oJson.data ?? null);
          setQueries(qJson.data ?? []);
          setPages(pJson.data ?? []);
        }
      } catch (err) {
        if (cancelled) return;
        setConfigured(false);
        setErrorMsg(err instanceof Error ? err.message : "Error de red consultando GSC");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="space-y-7 max-w-[1500px]">
      <Header period={period} onPeriod={setPeriod} />

      {!configured && <NotConfiguredBanner message={errorMsg} />}

      {loading ? (
        <KpiRowSkeleton />
      ) : configured && overview ? (
        <KpiRow overview={overview} />
      ) : null}

      {loading ? (
        <ChartSkeleton />
      ) : configured && overview && overview.daily.length > 0 ? (
        <DailyChart daily={overview.daily} />
      ) : configured && overview && overview.daily.length === 0 ? (
        <EmptyState
          title="Sin datos diarios todavía"
          sub="GSC todavía no acumuló data suficiente · esperá 2-3 días tras conectar."
        />
      ) : null}

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {loading ? <TableSkeleton rows={10} /> : configured ? <QueriesTable rows={queries} /> : null}
        {loading ? <TableSkeleton rows={10} /> : configured ? <PagesTable rows={pages} /> : null}
      </section>

      <TipsFooter />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────
function Header({ period, onPeriod }: { period: Period; onPeriod: (p: Period) => void }) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />
        <div className="absolute -top-24 -right-16 w-[420px] h-[420px] bg-[hsl(var(--brand-cyan)/0.16)] rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] bg-[hsl(var(--brand-lime)/0.12)] rounded-full blur-3xl" />

        <div className="relative px-6 md:px-10 py-6 md:py-7 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              <Search className="size-3" />
              SEO · Google Search Console
            </div>
            <h1 className="font-display font-bold tracking-[-0.025em] text-2xl md:text-3xl leading-[1.05]">
              Data real de <span className="text-aurora">bewe.ai</span>
            </h1>
            <p className="text-[12px] text-muted-foreground mt-1.5">
              Últimos {period} días · datos directos de Google Search Console
            </p>
          </div>

          <PeriodSelector value={period} onChange={onPeriod} />
        </div>
      </div>
    </Reveal>
  );
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const options: Period[] = [7, 28, 90];
  return (
    <div className="inline-flex rounded-lg border border-border/60 bg-card/40 backdrop-blur p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-md text-[11px] font-semibold tabular transition-colors",
            value === opt
              ? "bg-[hsl(var(--brand-cyan)/0.18)] text-[hsl(var(--brand-cyan))] border border-[hsl(var(--brand-cyan)/0.4)]"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent",
          )}
        >
          {opt}d
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CONFIG BANNER
// ─────────────────────────────────────────────────────────────────────
function NotConfiguredBanner({ message }: { message: string | null }) {
  return (
    <Reveal>
      <div
        className="rounded-xl border px-4 py-3 flex items-start gap-3"
        style={{
          background: `hsl(var(--warning) / 0.15)`,
          borderColor: `hsl(var(--brand-ember) / 0.45)`,
        }}
      >
        <div
          className="size-9 grid place-items-center rounded-lg shrink-0"
          style={{
            background: `hsl(var(--brand-ember) / 0.18)`,
            border: `1px solid hsl(var(--brand-ember) / 0.45)`,
            color: `hsl(var(--brand-ember))`,
          }}
        >
          <AlertTriangle className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--brand-ember))] mb-0.5">
            Google Search Console no configurado
          </div>
          <p className="text-[12px] leading-relaxed text-foreground/85">
            Conectá tu Service Account en Vercel cargando las env vars{" "}
            <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-secondary/60">GOOGLE_SA_KEY</code>{" "}
            y{" "}
            <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-secondary/60">GSC_SITE_URL</code>{" "}
            para ver data real.{" "}
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-2 text-[hsl(var(--brand-cyan))] hover:opacity-80"
            >
              Abrir Search Console
              <ExternalLink className="size-3" />
            </a>
          </p>
          {message && (
            <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">{message}</p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────
// KPI ROW
// ─────────────────────────────────────────────────────────────────────
function KpiRow({ overview }: { overview: GSCOverview }) {
  const clicksTrend = overview.daily.map((d) => d.clicks);
  const imprTrend = overview.daily.map((d) => d.impressions);
  const ctrTrend = overview.daily.map((d) => d.ctr);
  const posTrend = overview.daily.map((d) => d.position);

  return (
    <section>
      <SectionHeader title="KPIs orgánicos" sub="Snapshot · totales del período" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Clicks"
          value={overview.clicks}
          format={(v) => fmt.int(v)}
          sub="Visitas desde Google"
          tone="cyan"
          trend={clicksTrend.length > 1 ? clicksTrend : undefined}
          badge={<Badge variant="cyan"><MousePointerClick className="size-2.5 mr-0.5" />GSC</Badge>}
          delay={0.02}
        />
        <KpiCard
          label="Impresiones"
          value={overview.impressions}
          format={(v) => fmt.short(v)}
          sub="Apariciones en SERP"
          tone="violet"
          trend={imprTrend.length > 1 ? imprTrend : undefined}
          badge={<Badge variant="violet"><Eye className="size-2.5 mr-0.5" />SERP</Badge>}
          delay={0.06}
        />
        <KpiCard
          label="CTR promedio"
          value={overview.avgCtr}
          format={(v) => fmt.pct(v, 2)}
          sub="Clicks / impresiones"
          tone={overview.avgCtr >= 3 ? "success" : overview.avgCtr >= 1.5 ? "lime" : "warning"}
          trend={ctrTrend.length > 1 ? ctrTrend : undefined}
          badge={<Badge variant="lime"><Percent className="size-2.5 mr-0.5" />CTR</Badge>}
          delay={0.1}
        />
        <KpiCard
          label="Posición media"
          value={overview.avgPosition}
          format={(v) => v.toFixed(1)}
          sub="1 = primer resultado"
          tone={overview.avgPosition <= 10 ? "success" : overview.avgPosition <= 20 ? "warning" : "danger"}
          trend={posTrend.length > 1 ? posTrend : undefined}
          badge={<Badge variant="ember"><Target className="size-2.5 mr-0.5" />POS</Badge>}
          delay={0.14}
        />
      </div>
    </section>
  );
}

function KpiRowSkeleton() {
  return (
    <section>
      <SectionHeader title="KPIs orgánicos" sub="Cargando data de Google Search Console..." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DAILY CHART
// ─────────────────────────────────────────────────────────────────────
function DailyChart({ daily }: { daily: GSCDaily[] }) {
  const width = 1200;
  const height = 220;
  const padX = 36;
  const padY = 20;

  if (daily.length < 2) return null;

  const clicks = daily.map((d) => d.clicks);
  const impressions = daily.map((d) => d.impressions);

  const maxClicks = Math.max(...clicks, 1);
  const maxImpr = Math.max(...impressions, 1);

  const stepX = (width - padX * 2) / (daily.length - 1);
  const usableY = height - padY * 2;

  const clicksPoints = daily.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + usableY - (d.clicks / maxClicks) * usableY;
    return [x, y] as const;
  });
  const imprPoints = daily.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + usableY - (d.impressions / maxImpr) * usableY;
    return [x, y] as const;
  });

  const toPath = (pts: readonly (readonly [number, number])[]): string => {
    if (pts.length === 0) return "";
    return (
      "M " +
      pts
        .map(([x, y], i, arr) => {
          if (i === 0) return `${x},${y}`;
          const [px, py] = arr[i - 1];
          const cx = (px + x) / 2;
          return `Q ${cx},${py} ${(cx + x) / 2},${(py + y) / 2} T ${x},${y}`;
        })
        .join(" ")
    );
  };

  const clicksPath = toPath(clicksPoints);
  const imprPath = toPath(imprPoints);

  const lastDate = daily[daily.length - 1].date;
  const firstDate = daily[0].date;

  return (
    <section>
      <SectionHeader
        title="Evolución diaria"
        sub={`Clicks e impresiones · ${firstDate} → ${lastDate}`}
        right={
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[hsl(var(--brand-cyan))]" />
              Clicks
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-[hsl(var(--brand-violet))]" />
              Impresiones
            </span>
          </div>
        }
      />
      <TextureCard className="p-5">
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: "220px" }}
          >
            {/* grid */}
            {[0.25, 0.5, 0.75].map((p) => (
              <line
                key={p}
                x1={padX}
                x2={width - padX}
                y1={padY + usableY * p}
                y2={padY + usableY * p}
                stroke="hsl(var(--border))"
                strokeOpacity={0.35}
                strokeDasharray="2 4"
              />
            ))}

            {/* impressions fill */}
            <motion.path
              d={`${imprPath} L ${width - padX},${height - padY} L ${padX},${height - padY} Z`}
              fill="hsl(var(--brand-violet))"
              opacity={0.1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 0.9 }}
            />
            {/* impressions line */}
            <motion.path
              d={imprPath}
              fill="none"
              stroke="hsl(var(--brand-violet))"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />

            {/* clicks fill */}
            <motion.path
              d={`${clicksPath} L ${width - padX},${height - padY} L ${padX},${height - padY} Z`}
              fill="hsl(var(--brand-cyan))"
              opacity={0.18}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              transition={{ duration: 0.9 }}
            />
            {/* clicks line */}
            <motion.path
              d={clicksPath}
              fill="none"
              stroke="hsl(var(--brand-cyan))"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </TextureCard>
    </section>
  );
}

function ChartSkeleton() {
  return (
    <section>
      <SectionHeader title="Evolución diaria" sub="Cargando..." />
      <Skeleton className="h-[260px] rounded-2xl" />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// QUERIES TABLE
// ─────────────────────────────────────────────────────────────────────
function QueriesTable({ rows }: { rows: GSCQuery[] }) {
  const [sortKey, setSortKey] = React.useState<QuerySortKey>("clicks");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr.slice(0, 25);
  }, [rows, sortKey, sortDir]);

  const onSort = (key: QuerySortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "query" ? "asc" : "desc");
    }
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin queries todavía"
        sub="GSC necesita 2-3 días para mostrar keywords con clicks."
      />
    );
  }

  return (
    <section>
      <SectionHeader
        title="Top 25 keywords"
        sub="Sortable · click en columna"
        right={<Badge variant="outline" className="font-mono">{rows.length} total</Badge>}
      />
      <TextureCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
              <tr>
                <Th label="Query" sortKey="query" current={sortKey} dir={sortDir} onSort={onSort} align="left" />
                <Th label="Clicks" sortKey="clicks" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                <Th label="Impr." sortKey="impressions" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                <Th label="CTR" sortKey="ctr" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                <Th label="Pos" sortKey="position" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((k, i) => {
                const posTone =
                  k.position <= 3 ? "var(--success)" :
                  k.position <= 10 ? "var(--brand-lime)" :
                  k.position <= 20 ? "var(--warning)" :
                  "var(--destructive)";
                return (
                  <motion.tr
                    key={`${k.query}-${i}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.015 * i }}
                    className="border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground/90 truncate max-w-[260px]" title={k.query}>
                      {k.query}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular font-semibold">
                      {fmt.int(k.clicks)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular text-muted-foreground">
                      {fmt.short(k.impressions)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular">
                      {fmt.pct(k.ctr, 1)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className="inline-flex items-center justify-center min-w-[28px] px-1.5 h-6 rounded-md font-mono font-bold text-[11px] tabular"
                        style={{
                          background: `hsl(${posTone} / 0.14)`,
                          color: `hsl(${posTone})`,
                          border: `1px solid hsl(${posTone} / 0.35)`,
                        }}
                      >
                        {k.position.toFixed(1)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TextureCard>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PAGES TABLE
// ─────────────────────────────────────────────────────────────────────
function PagesTable({ rows }: { rows: GSCPage[] }) {
  const [sortKey, setSortKey] = React.useState<PageSortKey>("clicks");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr.slice(0, 15);
  }, [rows, sortKey, sortDir]);

  const onSort = (key: PageSortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "page" ? "asc" : "desc");
    }
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin páginas todavía"
        sub="GSC necesita 2-3 días para mostrar URLs con tráfico."
      />
    );
  }

  return (
    <section>
      <SectionHeader
        title="Top 15 pages"
        sub="Sortable · click en columna"
        right={<Badge variant="outline" className="font-mono">{rows.length} total</Badge>}
      />
      <TextureCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
              <tr>
                <Th label="Page" sortKey="page" current={sortKey} dir={sortDir} onSort={onSort} align="left" />
                <Th label="Clicks" sortKey="clicks" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                <Th label="Impr." sortKey="impressions" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                <Th label="CTR" sortKey="ctr" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                <Th label="Pos" sortKey="position" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const display = shortenUrl(p.page);
                return (
                  <motion.tr
                    key={`${p.page}-${i}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.015 * i }}
                    className="border-b border-border/40 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] truncate max-w-[240px]" title={p.page}>
                      {display}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular font-semibold">
                      {fmt.int(p.clicks)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular text-muted-foreground">
                      {fmt.short(p.impressions)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular">
                      {fmt.pct(p.ctr, 1)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular text-muted-foreground">
                      {p.position.toFixed(1)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TextureCard>
    </section>
  );
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path === "/" ? u.hostname : path;
  } catch {
    return url;
  }
}

// ─────────────────────────────────────────────────────────────────────
// TH · sortable
// ─────────────────────────────────────────────────────────────────────
function Th<K extends string>({
  label,
  sortKey,
  current,
  dir,
  onSort,
  align,
}: {
  label: string;
  sortKey: K;
  current: K;
  dir: SortDir;
  onSort: (k: K) => void;
  align: "left" | "right";
}) {
  const active = current === sortKey;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold cursor-pointer select-none",
        align === "right" ? "text-right" : "text-left",
        active ? "text-foreground" : "",
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" ? "justify-end" : "")}>
        {label}
        <Icon className="size-3 opacity-60" />
      </span>
    </th>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TIPS FOOTER
// ─────────────────────────────────────────────────────────────────────
function TipsFooter() {
  const tips: { title: string; body: string; tone: "lime" | "cyan" | "ember" }[] = [
    {
      title: "Quick wins",
      body: "Keywords con posición 11-20 son los próximos a empujar · están a un cambio de title/H1 de entrar al top 10.",
      tone: "lime",
    },
    {
      title: "CTR bajo en top",
      body: "CTR < 2% en posiciones 1-3 significa que el title/meta no convence · A/B test el copy.",
      tone: "cyan",
    },
    {
      title: "Intent mismatch",
      body: "Pages con muchas impresiones pero cero clicks suelen tener canibalización o desalineación con la query.",
      tone: "ember",
    },
  ];
  return (
    <section>
      <SectionHeader title="¿Cómo usar esto?" sub="3 lecturas accionables de los números" />
      <div className="grid md:grid-cols-3 gap-3">
        {tips.map((t) => (
          <TextureCard key={t.title} className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="size-8 grid place-items-center rounded-lg"
                style={{
                  background: `hsl(var(--brand-${t.tone}) / 0.16)`,
                  border: `1px solid hsl(var(--brand-${t.tone}) / 0.4)`,
                  color: `hsl(var(--brand-${t.tone}))`,
                }}
              >
                <Lightbulb className="size-4" />
              </div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-foreground/90">
                {t.title}
              </h3>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{t.body}</p>
          </TextureCard>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EMPTY · SKELETONS
// ─────────────────────────────────────────────────────────────────────
function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <TextureCard className="p-8 text-center">
      <FileText className="size-6 mx-auto mb-2 text-muted-foreground/60" />
      <div className="text-[13px] font-semibold mb-1">{title}</div>
      <p className="text-[11px] text-muted-foreground max-w-[440px] mx-auto">{sub}</p>
    </TextureCard>
  );
}

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <TextureCard className="p-4 space-y-2">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </TextureCard>
  );
}
