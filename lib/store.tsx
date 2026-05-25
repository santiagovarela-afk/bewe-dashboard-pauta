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
  /** Si el usuario ya eligió persona explícitamente. False = primer contacto, hay que mostrar picker. */
  aiPersonaChosen: boolean;

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

/** Action keys que matchean con la columna "Resultados" de Meta Ads Manager.
 *
 * Pre-16-may los eventos venían del pixel + CAPI duplicado · ahora solo CAPI.
 * Para matchear exactamente con Meta Ads Manager usamos las keys
 * canónicas (sin prefijo `offsite_conversion.fb_pixel_*` que era pixel viejo).
 */
const ACTION_KEYS = {
  link_click: "link_click",
  contact: "lead", // se mantiene compatible con el legacy "Contact"
  contactWhatsapp: "contact_whatsapp", // GA4 + Meta Contact alternativo
  initCheckout: "initiate_checkout",
  completeReg: "complete_registration",
  startTrial: "start_trial",
  subscribe: "subscribe",
} as const;

function getAction(actions: Array<{ action_type: string; value: string }> | undefined, type: string) {
  if (!actions) return 0;
  return parseInt(actions.find((a) => a.action_type === type)?.value ?? "0", 10);
}

/**
 * Infiere metadata de una campaña a partir de su nombre.
 * Convención Bewe: `{GEO}_{VERTICAL}_{TIPO}_{MES}{AÑO}[_CONVERSION]`
 * Ej: MX_BELLEZA_WEB_MAY26 / CR_PA_CL_CO_BELLEZA_WEB_MAY26 / MX_SERVICIOS_WEB_MAY26_CONVERSION
 *     RETARGETING_LATAM_ONB_MAY26
 */
function inferCampaignMetadata(campaignName: string, cid: string): Campaign {
  const isConversion = /_CONV(ERSION)?$/i.test(campaignName);

  // Geo · tomar prefijos compuestos o el primer token de 2-3 letras
  let geo = "MX";
  if (campaignName.startsWith("CR_PA_CL_CO_")) geo = "CR+PA+CL+CO";
  else if (campaignName.startsWith("MX_")) geo = "MX";
  else if (campaignName.startsWith("RETARGETING_LATAM")) geo = "LATAM";
  else {
    const first = campaignName.split("_")[0];
    if (/^[A-Z]{2,3}$/.test(first)) geo = first;
  }

  // Vertical · keywords conocidas
  let vertical: Campaign["vertical"] = "Servicios";
  if (/BELLEZA/i.test(campaignName)) vertical = "Belleza";
  else if (/COMERCIO/i.test(campaignName)) vertical = "Comercio";
  else if (/SERVICIOS|SERVICES/i.test(campaignName)) vertical = "Servicios";

  // Event · _CONVERSION optimiza a CR · _IC explícito a IC · default CR
  const event: Campaign["event"] = isConversion
    ? "CompleteRegistration"
    : /INICIAR_CHECKOUT|INIT_CHECKOUT|_IC$/i.test(campaignName)
      ? "InitiateCheckout"
      : "CompleteRegistration";

  const code = `META.${cid.slice(-6)}`;

  return {
    code,
    cid,
    name: campaignName,
    event,
    geo,
    vertical,
    status: "ACTIVE",
    daily: 0,
    total: 0,
    spend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpm: 0,
    reach: 0,
    freq: 0,
    conversions: 0,
    cpt: null,
    flag: null,
    evContact: 0,
    evInitCheckout: 0,
    evCompleteReg: 0,
    evStartTrial: 0,
    evSubscribe: 0,
  };
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
    // CRÍTICO: solo contar rows campaign-level (sin adsetId).
    // El array `daily` mezcla rows de cDaily (campaign-level · sin adsetId)
    // y aDaily (adset-level · con adsetId). Sin este filtro las métricas
    // se duplicaban exactamente 2× porque sumábamos el campaign aggregate
    // + la suma de todos sus adsets (que da el mismo total).
    if (row.adsetId) continue;
    const arr = byCid.get(row.campaignId) ?? [];
    arr.push(row);
    byCid.set(row.campaignId, arr);
  }

  return baseCampaigns.map((c) => {
    const rows = byCid.get(c.cid) ?? [];
    if (!rows.length) {
      // si no hay rows en el rango, dejamos las métricas en 0 PERO
      // preservamos status (PAUSED/ACTIVE) y meta del seed/API
      return { ...c, spend: 0, impressions: 0, clicks: 0, reach: 0, ctr: 0, cpm: 0, freq: 0, evContact: 0, evInitCheckout: 0, evCompleteReg: 0, evStartTrial: 0, evSubscribe: 0, conversions: 0, cpt: null };
    }
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const reach = Math.max(...rows.map((r) => r.reach), 0);
    const evCR = rows.reduce((s, r) => s + r.evCompleteReg, 0);
    const evIC = rows.reduce((s, r) => s + r.evInitCheckout, 0);
    const evCT = rows.reduce((s, r) => s + r.evContact, 0);
    const evST = rows.reduce((s, r) => s + r.evStartTrial, 0);
    const evSB = rows.reduce((s, r) => s + r.evSubscribe, 0);
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
      evStartTrial: evST,
      evSubscribe: evSB,
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
  const [aiPersonaChosen, setAiPersonaChosen] = React.useState<boolean>(false);
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
      const pc = localStorage.getItem("bw_ai_persona_chosen");
      if (pc === "1") setAiPersonaChosen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setAiPersona = React.useCallback((p: AiPersona) => {
    setAiPersonaState(p);
    setAiPersonaChosen(true);
    try {
      localStorage.setItem("bw_ai_persona", p);
      localStorage.setItem("bw_ai_persona_chosen", "1");
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

      // Endpoint para STATUS real de campaña (no viene en /insights)
      const statusUrl = (() => {
        const u = new URL("/api/meta", window.location.origin);
        u.searchParams.set("endpoint", `${PLAN.meta.accountId}/campaigns`);
        u.searchParams.set(
          "fields",
          "id,name,status,effective_status,daily_budget,lifetime_budget,objective,created_time,updated_time",
        );
        u.searchParams.set("limit", "50");
        return u.toString();
      })();

      // Endpoint para STATUS + BUDGET real de adsets (no viene en /insights)
      // Necesario para campañas sin CBO donde el budget vive en el adset.
      const adsetsStatusUrl = (() => {
        const u = new URL("/api/meta", window.location.origin);
        u.searchParams.set("endpoint", `${PLAN.meta.accountId}/adsets`);
        u.searchParams.set(
          "fields",
          "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget",
        );
        u.searchParams.set("limit", "200");
        return u.toString();
      })();

      const [cAgg, aAgg, cDaily, aDaily, statusResp, adsetsStatusResp] = await Promise.all([
        fetch(buildUrl({ level: "campaign", fields, limit: "30" })).then((r) => r.json()),
        fetch(buildUrl({ level: "adset", fields: adsetFields, limit: "200" })).then((r) => r.json()),
        fetch(buildUrl({ level: "campaign", fields, limit: "1000", time_increment: "1" })).then((r) => r.json()),
        fetch(buildUrl({ level: "adset", fields: adsetFields, limit: "1000", time_increment: "1" })).then((r) => r.json()),
        fetch(statusUrl).then((r) => r.json()),
        fetch(adsetsStatusUrl).then((r) => r.json()),
      ]);

      // Mapa de campaign_id → status real (ACTIVE / PAUSED / DELETED)
      const statusByCid = new Map<string, string>();
      // Mapa de campaign_id → budget real (daily/lifetime en EUR) + flag CBO
      const campaignBudgetByCid = new Map<
        string,
        { dailyBudgetEur: number; lifetimeBudgetEur: number | null; isCBO: boolean }
      >();
      if (Array.isArray(statusResp?.data)) {
        for (const c of statusResp.data as Array<{
          id: string;
          effective_status?: string;
          status?: string;
          daily_budget?: string;
          lifetime_budget?: string;
        }>) {
          // effective_status es lo que Meta realmente reporta (ej. CAMPAIGN_PAUSED).
          // Normalizamos a ACTIVE/PAUSED/DELETED.
          const raw = c.effective_status || c.status || "";
          const norm = /ACTIVE/i.test(raw)
            ? "ACTIVE"
            : /DELETED|ARCHIVED/i.test(raw)
              ? "DELETED"
              : "PAUSED";
          statusByCid.set(c.id, norm);

          // Budgets vienen en CENTAVOS desde Meta API · dividir por 100.
          const dailyCents = parseFloat(c.daily_budget ?? "0") || 0;
          const lifetimeCents = parseFloat(c.lifetime_budget ?? "0") || 0;
          const dailyEur = dailyCents / 100;
          const lifetimeEur = lifetimeCents > 0 ? lifetimeCents / 100 : null;
          campaignBudgetByCid.set(c.id, {
            dailyBudgetEur: dailyEur,
            lifetimeBudgetEur: lifetimeEur,
            // Si campaña tiene daily_budget > 0 entonces usa CBO
            isCBO: dailyEur > 0,
          });
        }
      }

      // Procesar adsets · status + budget por adset y agregado por campaña.
      const adsetBudgetByCampaign = new Map<
        string,
        { dailyTotal: number; lifetimeTotal: number | null }
      >();
      const adsetStatusByAid = new Map<string, string>();
      const adsetDailyByAid = new Map<string, number>();
      if (Array.isArray(adsetsStatusResp?.data)) {
        for (const ad of adsetsStatusResp.data as Array<{
          id: string;
          campaign_id: string;
          status?: string;
          effective_status?: string;
          daily_budget?: string;
          lifetime_budget?: string;
        }>) {
          const raw = ad.effective_status || ad.status || "";
          const norm = /ACTIVE/i.test(raw)
            ? "ACTIVE"
            : /DELETED|ARCHIVED/i.test(raw)
              ? "DELETED"
              : "PAUSED";
          adsetStatusByAid.set(ad.id, norm);

          const dailyEur = (parseFloat(ad.daily_budget ?? "0") || 0) / 100;
          adsetDailyByAid.set(ad.id, dailyEur);

          // Sólo sumar adsets ACTIVE al agregado de budget por campaña.
          if (norm !== "ACTIVE") continue;

          const lifetimeEur = (parseFloat(ad.lifetime_budget ?? "0") || 0) / 100;
          const current =
            adsetBudgetByCampaign.get(ad.campaign_id) ?? { dailyTotal: 0, lifetimeTotal: null };
          current.dailyTotal += dailyEur;
          if (lifetimeEur > 0) {
            current.lifetimeTotal = (current.lifetimeTotal ?? 0) + lifetimeEur;
          }
          adsetBudgetByCampaign.set(ad.campaign_id, current);
        }
      }

      // Errores resilientes: si un endpoint falla, dejamos warning pero
      // seguimos con los demás. Solo tiramos si AMBOS aggregates fallaron.
      const cAggOk = !cAgg?.error && Array.isArray(cAgg?.data);
      const aAggOk = !aAgg?.error && Array.isArray(aAgg?.data);
      if (!cAggOk && !aAggOk) {
        throw new Error(
          (cAgg?.error?.message ?? aAgg?.error?.message) || "Meta API error · revisa META_TOKEN",
        );
      }
      // Logging de warnings · no rompen flow
      if (!cAggOk && typeof window !== "undefined") {
        console.warn("[meta] cAgg failed:", cAgg?.error?.message);
      }
      if (!aAggOk && typeof window !== "undefined") {
        console.warn("[meta] aAgg failed:", aAgg?.error?.message);
      }
      // daily errores los toleramos: si el plan/cuenta no soporta time_increment seguimos con agregado
      const dailyCampOk = !cDaily?.error && Array.isArray(cDaily?.data);
      const dailyAdsetOk = !aDaily?.error && Array.isArray(aDaily?.data);

      // 1. Update rawCampaigns con el AGREGADO · procesar TODAS las campañas
      //    que devuelve Meta + cruzar con metadata del seed (vertical, geo,
      //    event optimization). Si no hay metadata en el seed, inferir desde
      //    el nombre. Esto evita perder campañas creadas después del env var.
      const cAggData = (cAggOk ? cAgg.data : []) as Array<{
        campaign_id: string;
        campaign_name?: string;
        spend: string;
        impressions: string;
        clicks: string;
        ctr: string;
        cpm: string;
        reach: string;
        frequency: string;
        actions?: Array<{ action_type: string; value: string }>;
      }>;

      // Mapa cid → metadata del seed (vertical, geo, event opt, budgets)
      const seedMetadataByCid = new Map<string, Campaign>();
      for (const c of rawCampaigns) seedMetadataByCid.set(c.cid, c);

      const nextCampaigns: Campaign[] = [];
      for (const row of cAggData) {
        const seed = seedMetadataByCid.get(row.campaign_id);
        const liveStatus = statusByCid.get(row.campaign_id) || seed?.status || "PAUSED";
        const inferred =
          seed ?? inferCampaignMetadata(row.campaign_name ?? row.campaign_id, row.campaign_id);

        const evCR = getAction(row.actions, ACTION_KEYS.completeReg);
        const evIC = getAction(row.actions, ACTION_KEYS.initCheckout);
        const evCT = getAction(row.actions, ACTION_KEYS.contact);
        const evStartTrial = getAction(row.actions, ACTION_KEYS.startTrial);
        const evSubscribe = getAction(row.actions, ACTION_KEYS.subscribe);
        const conv = inferred.event === "CompleteRegistration" ? evCR : evIC;
        const spend = parseFloat(row.spend) || 0;
        const cpt = conv > 0 ? +(spend / conv).toFixed(2) : null;

        const flag: Campaign["flag"] =
          row.campaign_id === "52551556895286"
            ? "anomaly"
            : cpt === null
              ? null
              : cpt > CPT_THRESHOLDS.critical
                ? "critical"
                : cpt > CPT_THRESHOLDS.warn
                  ? "warn"
                  : null;

        // Live budgets: si la campaña usa CBO → daily de la campaña.
        // Si NO usa CBO → suma de daily de adsets ACTIVE.
        const campBudget = campaignBudgetByCid.get(row.campaign_id);
        const adsetBudget = adsetBudgetByCampaign.get(row.campaign_id);
        const isCBO = (campBudget?.dailyBudgetEur ?? 0) > 0;
        const liveDailyBudget = isCBO
          ? (campBudget?.dailyBudgetEur ?? 0)
          : (adsetBudget?.dailyTotal ?? 0);
        const liveLifetimeBudget =
          campBudget?.lifetimeBudgetEur ?? adsetBudget?.lifetimeTotal ?? null;

        nextCampaigns.push({
          ...inferred,
          cid: row.campaign_id,
          name: row.campaign_name ?? inferred.name,
          status: liveStatus,
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
          evStartTrial,
          evSubscribe,
          conversions: conv,
          cpt,
          flag,
          liveDailyBudget,
          liveLifetimeBudget,
          isCBO,
        });
      }

      // Agregar también las campañas del seed que NO devolvió Meta API
      // (ej. viejas pausadas o con 0 spend en el período) para que el panel
      // siga listándolas con métricas en 0.
      for (const seed of rawCampaigns) {
        if (!nextCampaigns.find((c) => c.cid === seed.cid)) {
          const campBudget = campaignBudgetByCid.get(seed.cid);
          const adsetBudget = adsetBudgetByCampaign.get(seed.cid);
          const isCBO = (campBudget?.dailyBudgetEur ?? 0) > 0;
          const liveDailyBudget = isCBO
            ? (campBudget?.dailyBudgetEur ?? 0)
            : (adsetBudget?.dailyTotal ?? 0);
          const liveLifetimeBudget =
            campBudget?.lifetimeBudgetEur ?? adsetBudget?.lifetimeTotal ?? null;
          nextCampaigns.push({
            ...seed,
            status: statusByCid.get(seed.cid) || seed.status,
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpm: 0,
            reach: 0,
            freq: 0,
            evCompleteReg: 0,
            evInitCheckout: 0,
            evContact: 0,
            evStartTrial: 0,
            evSubscribe: 0,
            conversions: 0,
            cpt: null,
            flag: null,
            liveDailyBudget,
            liveLifetimeBudget,
            isCBO,
          });
        }
      }

      setRawCampaigns(nextCampaigns);

      // 2. Update rawAdsets · si la campaña padre no está en nextCampaigns
      //    (caso raro · cAgg falló pero aAgg ok), default a CompleteRegistration.
      const adsetRows = (aAggOk ? aAgg.data : []) as Array<{
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
        const campEvent: Campaign["event"] = camp?.event ?? "CompleteRegistration";
        const conv = campEvent === "CompleteRegistration" ? evCR : evIC;
        const spend = parseFloat(row.spend) || 0;
        const liveDailyBudget = adsetDailyByAid.get(row.adset_id);
        const adsetStatus = adsetStatusByAid.get(row.adset_id);
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
          liveDailyBudget,
          status: adsetStatus,
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
            evStartTrial: getAction(row.actions, ACTION_KEYS.startTrial),
            evSubscribe: getAction(row.actions, ACTION_KEYS.subscribe),
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
            evStartTrial: getAction(row.actions, ACTION_KEYS.startTrial),
            evSubscribe: getAction(row.actions, ACTION_KEYS.subscribe),
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

  // ── Auto-fetch en mount · cuando el usuario está logueado ────────────
  // Sin esto el dashboard arranca con métricas en 0 hasta que el usuario
  // clickea "Actualizar". Con el meta_token + IDs cargados en env vars,
  // disparamos un solo refresh al montar (o al loguear).
  const didInitialFetchRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitialFetchRef.current) return;
    if (!user) return;
    if (!PLAN.meta.accountId) return;
    didInitialFetchRef.current = true;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    aiPersonaChosen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
