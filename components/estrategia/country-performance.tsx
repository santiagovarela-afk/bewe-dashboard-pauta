"use client";
import * as React from "react";
import { Globe2, TrendingUp, TrendingDown } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import { CAMPAIGN_LIFECYCLE } from "@/lib/campaign-metadata";
import { cn, fmt } from "@/lib/utils";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { ExplainedMetric } from "@/components/shared/explained-metric";

interface CountryRow {
  country: string;
  spend: number;
  conversions: number;
  cpt: number | null;
  ctr: number;
  clicks: number;
  impressions: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  MX: "México",
  CO: "Colombia",
  CL: "Chile",
  CR: "Costa Rica",
  PA: "Panamá",
  AR: "Argentina",
  PE: "Perú",
  EC: "Ecuador",
  UY: "Uruguay",
  GT: "Guatemala",
  HN: "Honduras",
  SV: "El Salvador",
  DO: "Rep. Dom.",
  BO: "Bolivia",
  PY: "Paraguay",
  ES: "España",
  US: "EE.UU.",
};

const COUNTRY_FLAGS: Record<string, string> = {
  MX: "🇲🇽",
  CO: "🇨🇴",
  CL: "🇨🇱",
  CR: "🇨🇷",
  PA: "🇵🇦",
  AR: "🇦🇷",
  PE: "🇵🇪",
  EC: "🇪🇨",
  UY: "🇺🇾",
  GT: "🇬🇹",
  HN: "🇭🇳",
  SV: "🇸🇻",
  DO: "🇩🇴",
  BO: "🇧🇴",
  PY: "🇵🇾",
  ES: "🇪🇸",
  US: "🇺🇸",
};

interface MetaInsightRow {
  country?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

/**
 * Card de Performance por país.
 *
 * Hace fetch directo a /api/meta?endpoint=act_xxx/insights&breakdowns=country
 * porque el agregado normal no trae breakdown geo · el user lo pidió textual.
 */
export function CountryPerformance() {
  const { dateRange } = useDashboard();
  const [rows, setRows] = React.useState<CountryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!PLAN.meta.accountId) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const u = new URL("/api/meta", window.location.origin);
        u.searchParams.set("endpoint", `${PLAN.meta.accountId}/insights`);
        // Usar time_range con la ventana exacta del plan (launchISO → hoy)
        // en lugar de date_preset=this_month que incluye los primeros días
        // del mes ANTES del lanzamiento del plan (ej. 1-11 may con spend
        // de campañas viejas).
        const launchISO = PLAN.launchISO.slice(0, 10); // YYYY-MM-DD
        const todayISO = new Date().toISOString().slice(0, 10);
        u.searchParams.set(
          "time_range",
          JSON.stringify({ since: launchISO, until: todayISO }),
        );
        u.searchParams.set("level", "account");
        u.searchParams.set("breakdowns", "country");
        u.searchParams.set(
          "fields",
          "spend,impressions,clicks,ctr,actions",
        );
        // Filtrar solo campañas del plan vigente (CAMPAIGN_LIFECYCLE) para
        // evitar contaminar el breakdown con campañas viejas o tests.
        const planCids = Object.keys(CAMPAIGN_LIFECYCLE);
        u.searchParams.set(
          "filtering",
          JSON.stringify([
            { field: "campaign.id", operator: "IN", value: planCids },
          ]),
        );
        u.searchParams.set("limit", "500");
        const resp = await fetch(u.toString(), { signal: ctrl.signal });
        const json = await resp.json();
        if (json?.error) {
          setError(json.error?.message ?? "Error meta");
          setLoading(false);
          return;
        }
        const data: MetaInsightRow[] = Array.isArray(json?.data) ? json.data : [];
        const mapped: CountryRow[] = data
          .map((r) => {
            const evCR = getAction(r.actions, "complete_registration");
            const evIC = getAction(r.actions, "initiate_checkout");
            // Sumamos CR + IC para no perder volumen por evento mixto.
            const conv = evCR + evIC;
            const spend = parseFloat(r.spend ?? "0") || 0;
            return {
              country: (r.country ?? "??").toUpperCase(),
              spend,
              conversions: conv,
              cpt: conv > 0 ? spend / conv : null,
              ctr: parseFloat(r.ctr ?? "0") || 0,
              clicks: parseInt(r.clicks ?? "0", 10) || 0,
              impressions: parseInt(r.impressions ?? "0", 10) || 0,
            };
          })
          // filtramos ruido: <€5 gasto
          .filter((r) => r.spend >= 5)
          .sort((a, b) => b.spend - a.spend);
        setRows(mapped);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, [dateRange.from, dateRange.to]);

  const bestCpt = React.useMemo(() => {
    const pool = rows.filter((r) => r.cpt !== null && r.conversions >= 3);
    if (pool.length === 0) return null;
    return pool.reduce((b, r) => (r.cpt! < b.cpt! ? r : b));
  }, [rows]);

  const worstCpt = React.useMemo(() => {
    const pool = rows.filter((r) => r.cpt !== null && r.conversions >= 3);
    if (pool.length === 0) return null;
    return pool.reduce((b, r) => (r.cpt! > b.cpt! ? r : b));
  }, [rows]);

  return (
    <TextureCard className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Globe2 className="size-4 text-[hsl(var(--brand-cyan))]" aria-hidden />
          <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-foreground">
            Performance por país
          </h3>
          <ExplainedMetric
            explanation={
              <>
                <b>Breakdown geográfico</b> de toda la cuenta · datos del rango activo desde Meta.
                <br />Suma <i>CompleteRegistration + InitiateCheckout</i> como conversiones totales.
                <br />Países con menos de €5 gastados se ocultan para evitar ruido.
              </>
            }
          >
            <span className="sr-only">Info</span>
          </ExplainedMetric>
        </div>
        <Badge variant="cyan">{rows.length} países activos</Badge>
      </div>

      {loading && (
        <p className="text-[11px] text-muted-foreground py-4">Cargando breakdown geográfico…</p>
      )}
      {error && (
        <p className="text-[11px] text-[hsl(var(--destructive))] py-2">Error: {error}</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-[11px] text-muted-foreground py-4">
          Sin datos por país en el rango actual.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="space-y-2">
          {/* Resumen mejor/peor */}
          {bestCpt && worstCpt && bestCpt.country !== worstCpt.country && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <HighlightCard
                tone="success"
                icon={<TrendingUp className="size-3.5" />}
                label="Mejor CPA"
                row={bestCpt}
              />
              <HighlightCard
                tone="danger"
                icon={<TrendingDown className="size-3.5" />}
                label="Peor CPA"
                row={worstCpt}
              />
            </div>
          )}

          {/* Tabla */}
          <div className="rounded-lg border border-border bg-background/30 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 py-2 text-[9px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border bg-background/50">
              <span>País</span>
              <span className="text-right">Gasto</span>
              <span className="text-right">Conv</span>
              <span className="text-right">CPT</span>
              <span className="text-right">CTR</span>
            </div>
            {rows.map((r) => {
              const flagBest = r.country === bestCpt?.country;
              const flagWorst = r.country === worstCpt?.country;
              return (
                <div
                  key={r.country}
                  className={cn(
                    "grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 py-1.5 text-[11px] border-b border-border/30 last:border-0 font-mono tabular",
                    flagBest && "bg-[hsl(var(--success)/0.06)]",
                    flagWorst && "bg-[hsl(var(--destructive)/0.06)]",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-foreground font-normal not-italic">
                    <span aria-hidden>{COUNTRY_FLAGS[r.country] ?? "🌐"}</span>
                    <span>{COUNTRY_NAMES[r.country] ?? r.country}</span>
                  </span>
                  <span className="text-right">{fmt.eur(r.spend, { decimals: 0 })}</span>
                  <span className="text-right">{fmt.int(r.conversions)}</span>
                  <span
                    className={cn(
                      "text-right",
                      flagBest && "text-[hsl(var(--success))]",
                      flagWorst && "text-[hsl(var(--destructive))]",
                    )}
                  >
                    {r.cpt === null ? "—" : fmt.eur(r.cpt)}
                  </span>
                  <span className="text-right text-muted-foreground">
                    {r.ctr.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-2 leading-relaxed">
            Conv = CompleteRegistration + InitiateCheckout · CPT = gasto / conv. Países con menos de €5
            ocultos. Highlights requieren ≥3 conv para evitar falsos positivos.
          </p>
        </div>
      )}
    </TextureCard>
  );
}

function HighlightCard({
  tone,
  icon,
  label,
  row,
}: {
  tone: "success" | "danger";
  icon: React.ReactNode;
  label: string;
  row: CountryRow;
}) {
  const color = tone === "success" ? "var(--success)" : "var(--destructive)";
  return (
    <div
      className="rounded-lg border p-2.5"
      style={{
        background: `hsl(${color} / 0.06)`,
        borderColor: `hsl(${color} / 0.35)`,
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] font-bold mb-1"
        style={{ color: `hsl(${color})` }}
      >
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-1.5 text-[13px] font-mono font-bold">
        <span aria-hidden>{COUNTRY_FLAGS[row.country] ?? "🌐"}</span>
        <span className="text-foreground">{COUNTRY_NAMES[row.country] ?? row.country}</span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
        CPT {row.cpt === null ? "—" : fmt.eur(row.cpt)} · {fmt.int(row.conversions)} conv
      </div>
    </div>
  );
}

function getAction(actions: Array<{ action_type: string; value: string }> | undefined, key: string) {
  if (!actions) return 0;
  return parseInt(actions.find((a) => a.action_type === key)?.value ?? "0", 10);
}
