"use client";
import * as React from "react";
import type {
  Adset,
  Campaign,
  DailyRow,
  DateRange,
  SessionUser,
  Snapshot,
  ThemeMode,
} from "./types";
import { SEED_ADSETS, SEED_CAMPAIGNS, SEED_SNAPSHOT_LABEL } from "./seed-data";
import { PLAN } from "./config";
import { CPT_THRESHOLDS, daysSince } from "./utils";

export type DatePreset = "last_3d" | "last_7d" | "last_14d" | "this_month";

export type AiPersona = "mark" | "lua";

interface DashboardState {
  /* auth */
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;

  /* AI persona · Mark OS o Lúa OS */
  aiPersona: AiPersona;
  setAiPersona: (p: AiPersona) => void;

  /* nav */
  tab: string;
  setTab: (t: string) => void;

  /* theme · light/dark con persistencia */
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;

  /* API window (controla cuánto se trae) — siempre this_month por defecto */
  datePreset: DatePreset;
  setDatePreset: (p: DatePreset) => void;

  /* Date range CLIENT-SIDE — filtra datos ya cargados sin re-fetch */
  dateRange: DateRange;
  setDateRange: (r: DateRange) => void;
  /** preset rápido del rango (ej. last_3d) calculado sobre los datos cargados */
  setRangePreset: (p: DatePreset) => void;

  /* Data principal */
  rawCampaigns: Campaign[];           // agregados período completo de la API
  rawAdsets: Adset[];                  // ídem para adsets
  daily: DailyRow[];                   // breakdown por día (cuando time_increment=1)
  campaigns: Campaign[];               // filtrado por dateRange (computed)
  adsets: Adset[];                     // filtrado por dateRange (computed)
  snapshot: Snapshot;

  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  daysElapsed: number;

  /** indica si la última carga incluyó breakdown diario (habilita filtros sin re-fetch) */
  hasDailyBreakdown: boolean;
}

const Ctx = React.createContext<DashboardState | null>(null);

const ACTION_KEYS = {
  link_click: "link_click",
  contact: "offsite_conversion.fb_pixel_contact",
  initCheckout: "offsite_conversion.fb_pixel_initiate_checkout",
  completeReg: "offsite_conversion.fb_pixel_complete_registration",
} as const;

function getAction(actions: Array<{ action_type: string; value: string }> | undefined, type: string) {
  if (!actions) return 0;
  return parseInt(actions.find((a) => a.action_type === type)?.value ?? "0", 10);
}

/** Devuelve un rango ISO basado en preset (relativo a hoy). */
function rangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const days = preset === "last_3d" ? 3 : preset === "last_7d" ? 7 : preset === "last_14d" ? 14 : 31;
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - days + 1);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

function inRange(iso: string, r: DateRange) {
  return iso >= r.from && iso <= r.to;
}

/**
 * Agrega filas DailyRow por campaña y devuelve un Campaign-array filtrado.
 * Sólo usable si daily[] tiene datos; si no, retorna baseCampaigns sin cambios.
 */
function aggregateCampaigns(
  baseCampaigns: Campaign[],
  daily: DailyRow[],
  range: DateRange,
): Campaign[] {
  if (!daily.length) return baseCampaigns;

  const byCid = new Map<string, DailyRow[]>();
  for (const row of daily) {
    if (!inRange(row.date, range)) continue;
    const arr = byCid.get(row.campaignId) ?? [];
    arr.push(row);
    byCid.set(row.campaignId, arr);
  }

  return baseCampaigns.map((c) => {
    const rows = byCid.get(c.cid) ?? [];
    if (!rows.length) {
      // si no hay rows en el rango, dejamos los valores 0
      return { ...c, spend: 0, impressions: 0, clicks: 0, reach: 0, ctr: 0, cpm: 0, freq: 0, evContact: 0, evInitCheckout: 0, evCompleteReg: 0, conversions: 0, cpt: null };
    }
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const reach = Math.max(...rows.map((r) => r.reach), 0);
    const evCR = rows.reduce((s, r) => s + r.evCompleteReg, 0);
    const evIC = rows.reduce((s, r) => s + r.evInitCheckout, 0);
    const evCT = rows.reduce((s, r) => s + r.evContact, 0);
    const conv = c.event === "CompleteRegistration" ? evCR : evIC;
    const cpt = conv > 0 ? +(spend / conv).toFixed(2) : null;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const flag: Campaign["flag"] =
      c.cid === "52551556895286"
        ? "anomaly"
        : cpt === null
          ? null
          : cpt > CPT_THRESHOLDS.critical
            ? "critical"
            : cpt > CPT_THRESHOLDS.warn
              ? "warn"
              : null;
    return {
      ...c,
      spend,
      impressions,
      clicks,
      reach,
      ctr,
      cpm,
      freq: c.freq,
      evContact: evCT,
      evInitCheckout: evIC,
      evCompleteReg: evCR,
      conversions: conv,
      cpt,
      flag,
    };
  });
}

function aggregateAdsets(baseAdsets: Adset[], daily: DailyRow[], range: DateRange): Adset[] {
  if (!daily.length) return baseAdsets;
  const byAdsetId = new Map<string, DailyRow[]>();
  for (const row of daily) {
    if (!row.adsetId) continue;
    if (!inRange(row.date, range)) continue;
    const arr = byAdsetId.get(row.adsetId) ?? [];
    arr.push(row);
    byAdsetId.set(row.adsetId, arr);
  }
  if (byAdsetId.size === 0) return baseAdsets; // sin daily breakdown de adsets
  return baseAdsets.map((a) => {
    if (!a.adsetId) return a;
    const rows = byAdsetId.get(a.adsetId) ?? [];
    if (!rows.length) return { ...a, spend: 0, impressions: 0, clicks: 0, conversions: 0, cpt: null };
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const evCR = rows.reduce((s, r) => s + r.evCompleteReg, 0);
    const evIC = rows.reduce((s, r) => s + r.evInitCheckout, 0);
    // si no sabemos el evento del adset, sumamos ambos preferiendo IC
    const conv = evIC || evCR;
    return {
      ...a,
      spend,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      conversions: conv,
      cpt: conv > 0 ? +(spend / conv).toFixed(2) : null,
    };
  });
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [tab, setTab] = React.useState<string>("dashboard");
  const [theme, setThemeState] = React.useState<ThemeMode>("dark");
  const [aiPersona, setAiPersonaState] = React.useState<AiPersona>("mark");
  const [datePreset, setDatePreset] = React.useState<DatePreset>("this_month");
  const [dateRange, setDateRangeState] = React.useState<DateRange>(() => rangeFromPreset("this_month"));

  const [rawCampaigns, setRawCampaigns] = React.useState<Campaign[]>(SEED_CAMPAIGNS);
  const [rawAdsets, setRawAdsets] = React.useState<Adset[]>(SEED_ADSETS);
  const [daily, setDaily] = React.useState<DailyRow[]>([]);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({
    label: SEED_SNAPSHOT_LABEL,
    isLive: false,
    fetchedAt: null,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Hydration ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("bw_session");
      if (raw) setUser(JSON.parse(raw));
      const t = localStorage.getItem("bw_theme");
      if (t === "light" || t === "dark") setThemeState(t);
      const r = localStorage.getItem("bw_date_range");
      if (r) {
        const parsed = JSON.parse(r) as DateRange;
        if (parsed?.from && parsed?.to) setDateRangeState(parsed);
      }
      const p = localStorage.getItem("bw_ai_persona");
      if (p === "mark" || p === "lua") setAiPersonaState(p);
    } catch {
      /* ignore */
    }
  }, []);

  const setAiPersona = React.useCallback((p: AiPersona) => {
    setAiPersonaState(p);
    try {
      localStorage.setItem("bw_ai_persona", p);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Sincroniza clase html con el theme ────────────────────────────────
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("light");
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    } else {
      html.classList.add("dark");
      html.classList.remove("light");
      html.style.colorScheme = "dark";
    }
  }, [theme]);

  const setTheme = React.useCallback((t: ThemeMode) => {
    setThemeState(t);
    try {
      localStorage.setItem("bw_theme", t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const setDateRange = React.useCallback((r: DateRange) => {
    setDateRangeState(r);
    try {
      localStorage.setItem("bw_date_range", JSON.stringify(r));
    } catch {
      /* ignore */
    }
  }, []);

  const setRangePreset = React.useCallback(
    (p: DatePreset) => {
      const r = rangeFromPreset(p);
      setDateRange(r);
    },
    [setDateRange],
  );

  // ── Refresh API ───────────────────────────────────────────────────────
  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fields =
        "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpm,reach,frequency,actions,date_start,date_stop";
      const adsetFields =
        "adset_id,adset_name,campaign_id,spend,impressions,clicks,ctr,cpm,reach,frequency,actions,date_start,date_stop";

      const buildUrl = (extra: Record<string, string>) => {
        const u = new URL("/api/meta", window.location.origin);
        u.searchParams.set("endpoint", `${PLAN.meta.accountId}/insights`);
        // Siempre cargamos el mes completo para permitir filtrado client-side.
        u.searchParams.set("date_preset", "this_month");
        Object.entries(extra).forEach(([k, v]) => u.searchParams.set(k, v));
        return u.toString();
      };

      const [cAgg, aAgg, cDaily, aDaily] = await Promise.all([
        // Aggregate (resumen del mes)
        fetch(buildUrl({ level: "campaign", fields, limit: "30" })).then((r) => r.json()),
        fetch(buildUrl({ level: "adset", fields: adsetFields, limit: "200" })).then((r) => r.json()),
        // Daily breakdown · time_increment=1
        fetch(buildUrl({ level: "campaign", fields, limit: "1000", time_increment: "1" })).then((r) => r.json()),
        fetch(buildUrl({ level: "adset", fields: adsetFields, limit: "1000", time_increment: "1" })).then((r) => r.json()),
      ]);

      if (cAgg.error) throw new Error(cAgg.error.message ?? "Meta API error");
      if (aAgg.error) throw new Error(aAgg.error.message ?? "Meta API error");
      // daily errores los toleramos: si el plan/cuenta no soporta time_increment seguimos con agregado
      const dailyCampOk = !cDaily?.error && Array.isArray(cDaily?.data);
      const dailyAdsetOk = !aDaily?.error && Array.isArray(aDaily?.data);

      // 1. Update rawCampaigns con el AGREGADO
      const nextCampaigns = rawCampaigns.map((c) => {
        const row = (cAgg.data as Array<{
          campaign_id: string;
          spend: string;
          impressions: string;
          clicks: string;
          ctr: string;
          cpm: string;
          reach: string;
          frequency: string;
          actions?: Array<{ action_type: string; value: string }>;
        }>).find((r) => r.campaign_id === c.cid);
        if (!row) return c;
        const evCR = getAction(row.actions, ACTION_KEYS.completeReg);
        const evIC = getAction(row.actions, ACTION_KEYS.initCheckout);
        const evCT = getAction(row.actions, ACTION_KEYS.contact);
        const conv = c.event === "CompleteRegistration" ? evCR : evIC;
        const spend = parseFloat(row.spend) || 0;
        const cpt = conv > 0 ? +(spend / conv).toFixed(2) : null;
        const flag: Campaign["flag"] =
          c.cid === "52551556895286"
            ? "anomaly"
            : cpt === null
              ? null
              : cpt > CPT_THRESHOLDS.critical
                ? "critical"
                : cpt > CPT_THRESHOLDS.warn
                  ? "warn"
                  : null;
        return {
          ...c,
          spend,
          impressions: parseInt(row.impressions, 10) || 0,
          clicks: parseInt(row.clicks, 10) || 0,
          ctr: parseFloat(row.ctr) || 0,
          cpm: parseFloat(row.cpm) || 0,
          reach: parseInt(row.reach, 10) || 0,
          freq: parseFloat(row.frequency) || 0,
          evCompleteReg: evCR,
          evInitCheckout: evIC,
          evContact: evCT,
          conversions: conv,
          cpt,
          flag,
        };
      });
      setRawCampaigns(nextCampaigns);

      // 2. Update rawAdsets
      const adsetRows = aAgg.data as Array<{
        adset_id: string;
        adset_name: string;
        campaign_id: string;
        spend: string;
        impressions: string;
        clicks: string;
        ctr: string;
        cpm: string;
        reach: string;
        frequency: string;
        actions?: Array<{ action_type: string; value: string }>;
      }>;
      const newAdsets: Adset[] = adsetRows.map((row) => {
        const camp = nextCampaigns.find((c) => c.cid === row.campaign_id);
        const evCR = getAction(row.actions, ACTION_KEYS.completeReg);
        const evIC = getAction(row.actions, ACTION_KEYS.initCheckout);
        const conv = camp?.event === "CompleteRegistration" ? evCR : evIC;
        const spend = parseFloat(row.spend) || 0;
        return {
          cid: row.campaign_id,
          adsetId: row.adset_id,
          name: row.adset_name,
          spend,
          impressions: parseInt(row.impressions, 10) || 0,
          clicks: parseInt(row.clicks, 10) || 0,
          ctr: parseFloat(row.ctr) || 0,
          cpm: parseFloat(row.cpm) || 0,
          reach: parseInt(row.reach, 10) || 0,
          freq: parseFloat(row.frequency) || 0,
          conversions: conv,
          cpt: conv > 0 ? +(spend / conv).toFixed(2) : null,
        };
      });
      setRawAdsets(newAdsets);

      // 3. Update daily breakdown
      const dailyRows: DailyRow[] = [];
      if (dailyCampOk) {
        for (const row of cDaily.data as Array<{
          campaign_id: string;
          date_start: string;
          spend: string;
          impressions: string;
          clicks: string;
          reach: string;
          ctr: string;
          cpm: string;
          frequency: string;
          actions?: Array<{ action_type: string; value: string }>;
        }>) {
          dailyRows.push({
            date: row.date_start,
            campaignId: row.campaign_id,
            spend: parseFloat(row.spend) || 0,
            impressions: parseInt(row.impressions, 10) || 0,
            clicks: parseInt(row.clicks, 10) || 0,
            reach: parseInt(row.reach, 10) || 0,
            ctr: parseFloat(row.ctr) || 0,
            cpm: parseFloat(row.cpm) || 0,
            freq: parseFloat(row.frequency) || 0,
            evContact: getAction(row.actions, ACTION_KEYS.contact),
            evInitCheckout: getAction(row.actions, ACTION_KEYS.initCheckout),
            evCompleteReg: getAction(row.actions, ACTION_KEYS.completeReg),
          });
        }
      }
      if (dailyAdsetOk) {
        for (const row of aDaily.data as Array<{
          campaign_id: string;
          adset_id: string;
          date_start: string;
          spend: string;
          impressions: string;
          clicks: string;
          reach: string;
          ctr: string;
          cpm: string;
          frequency: string;
          actions?: Array<{ action_type: string; value: string }>;
        }>) {
          dailyRows.push({
            date: row.date_start,
            campaignId: row.campaign_id,
            adsetId: row.adset_id,
            spend: parseFloat(row.spend) || 0,
            impressions: parseInt(row.impressions, 10) || 0,
            clicks: parseInt(row.clicks, 10) || 0,
            reach: parseInt(row.reach, 10) || 0,
            ctr: parseFloat(row.ctr) || 0,
            cpm: parseFloat(row.cpm) || 0,
            freq: parseFloat(row.frequency) || 0,
            evContact: getAction(row.actions, ACTION_KEYS.contact),
            evInitCheckout: getAction(row.actions, ACTION_KEYS.initCheckout),
            evCompleteReg: getAction(row.actions, ACTION_KEYS.completeReg),
          });
        }
      }
      setDaily(dailyRows);

      const now = new Date();
      setSnapshot({
        label: `Live · este mes · ${now.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`,
        isLive: true,
        fetchedAt: now.toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [rawCampaigns]);

  // ── Computed: filtrado por dateRange ─────────────────────────────────
  const campaigns = React.useMemo(
    () => aggregateCampaigns(rawCampaigns, daily, dateRange),
    [rawCampaigns, daily, dateRange],
  );
  const adsets = React.useMemo(
    () => aggregateAdsets(rawAdsets, daily, dateRange),
    [rawAdsets, daily, dateRange],
  );

  const daysElapsed = daysSince(PLAN.launchISO, PLAN.totalDays);
  const hasDailyBreakdown = daily.length > 0;

  const value: DashboardState = {
    user,
    setUser: (u) => {
      setUser(u);
      if (u) localStorage.setItem("bw_session", JSON.stringify(u));
      else localStorage.removeItem("bw_session");
    },
    tab,
    setTab,
    theme,
    setTheme,
    toggleTheme,
    datePreset,
    setDatePreset,
    dateRange,
    setDateRange,
    setRangePreset,
    rawCampaigns,
    rawAdsets,
    daily,
    campaigns,
    adsets,
    snapshot,
    loading,
    error,
    refresh,
    daysElapsed,
    hasDailyBreakdown,
    aiPersona,
    setAiPersona,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
