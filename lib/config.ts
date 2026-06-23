/**
 * Bewe Pauta · Configuración PÚBLICA del dashboard
 *
 * Este archivo se commitea al repo. NO debe contener:
 *  - IDs reales de cuenta Meta / página / IG
 *  - IDs de campañas / presupuestos específicos
 *  - Passwords ni emails con role/access mapping
 *  - Cifras concretas del plan (budget, CPT thresholds reales)
 *
 * Los valores reales se cargan desde `NEXT_PUBLIC_*` env vars en runtime
 * (cliente) y desde `lib/private-config.server.ts` en el server.
 *
 * IMPORTANTE Next.js: las env vars `NEXT_PUBLIC_*` se inlinean en el bundle
 * SOLO si se acceden con literal estático (`process.env.NEXT_PUBLIC_X`).
 * Acceso dinámico tipo `process.env[varName]` da undefined en cliente.
 */

// ─── Helpers SOLO para JSON / coerciones ────────────────────────────────

function pickStr(v: string | undefined, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

function pickNum(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pickJSON<T>(v: string | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

// ─── PLAN · cargado desde env vars NEXT_PUBLIC_* (acceso literal) ──────

export const PLAN = {
  monthLabel: pickStr(process.env.NEXT_PUBLIC_PLAN_MONTH_LABEL, "—"),
  launchISO: pickStr(process.env.NEXT_PUBLIC_PLAN_LAUNCH_ISO, "2026-01-01T00:00:00"),
  endISO: pickStr(process.env.NEXT_PUBLIC_PLAN_END_ISO, "2026-01-31T23:59:59"),
  day7ISO: pickStr(process.env.NEXT_PUBLIC_PLAN_DAY7_ISO, "2026-01-08T00:00:00"),
  day14ISO: pickStr(process.env.NEXT_PUBLIC_PLAN_DAY14_ISO, "2026-01-15T00:00:00"),
  totalDays: pickNum(process.env.NEXT_PUBLIC_PLAN_TOTAL_DAYS, 30),
  budget: pickNum(process.env.NEXT_PUBLIC_PLAN_BUDGET, 0),
  contingency: pickNum(process.env.NEXT_PUBLIC_PLAN_CONTINGENCY, 0),
  cpt: {
    aggressive: pickNum(process.env.NEXT_PUBLIC_PLAN_CPT_AGGRESSIVE, 1.5),
    target: pickNum(process.env.NEXT_PUBLIC_PLAN_CPT_TARGET, 2.2),
    warn: pickNum(process.env.NEXT_PUBLIC_PLAN_CPT_WARN, 3.0),
    critical: pickNum(process.env.NEXT_PUBLIC_PLAN_CPT_CRITICAL, 5.5),
  },
  meta: {
    accountId: pickStr(process.env.NEXT_PUBLIC_META_ACCOUNT_ID, ""),
    accountIdNumeric: pickStr(process.env.NEXT_PUBLIC_META_ACCOUNT_ID_NUMERIC, ""),
    pageId: pickStr(process.env.NEXT_PUBLIC_META_PAGE_ID, ""),
    igAccountId: pickStr(process.env.NEXT_PUBLIC_META_IG_ID, ""),
    apiVersion: pickStr(process.env.NEXT_PUBLIC_META_API_VERSION, "v22.0"),
  },
};

// ─── CAMPAÑAS · cargadas desde NEXT_PUBLIC_CAMPAIGNS_JSON ──────────────

interface CampaignMapEntry {
  code: string;
  cid: string;
  name: string;
  event: "CompleteRegistration" | "InitiateCheckout";
  geo: string;
  vertical: "Belleza" | "Comercio" | "Servicios";
  daily: number;
  total: number;
  replacedBy?: string;
}

const CAMPAIGNS_ARRAY = pickJSON<CampaignMapEntry[]>(
  process.env.NEXT_PUBLIC_CAMPAIGNS_JSON,
  [],
);

/** Map de campañas indexado por cid (Meta campaign ID). */
export const CAMPAIGN_MAP: Record<string, CampaignMapEntry> = Object.fromEntries(
  CAMPAIGNS_ARRAY.map((c) => [c.cid, c]),
);

export const CAMPAIGN_CODES = CAMPAIGNS_ARRAY.map((c) => c.code);
export type CampaignCode = string;

export function getByCode(code: string): CampaignMapEntry | undefined {
  return CAMPAIGNS_ARRAY.find((c) => c.code === code);
}

// ─── ROLES & TABS · públicos, no sensibles ──────────────────────────────

export const ROLE_TABS: Record<string, string[]> = {
  admin: [
    "dashboard", "campanas", "estrategia", "paid", "anuncios", "organico",
    "parrilla", "seo", "aeo", "performance", "open-bui", "informe", "comunidad", "config",
  ],
  lead: [
    "dashboard", "campanas", "estrategia", "paid", "anuncios", "organico",
    "parrilla", "seo", "aeo", "performance", "open-bui", "informe", "comunidad",
  ],
  content: ["dashboard", "anuncios", "organico", "parrilla", "open-bui", "comunidad"],
  // Rol "social" (Esneider y similares): foco en redes sociales · sin pauta paga
  social: ["estrategia", "organico", "parrilla", "informe", "open-bui", "comunidad"],
};

// USERS se movió a env var `AUTH_USERS_JSON` (server-only)
// Validación de login pasa por /api/auth/login.
// Ver: lib/private-config.server.ts

export const TABS = [
  { id: "dashboard",   label: "Dashboard",   icon: "LayoutDashboard", group: "pauta" },
  { id: "campanas",    label: "Campañas",    icon: "Megaphone",        group: "pauta" },
  { id: "estrategia",  label: "Estrategia",  icon: "Target", badge: true, group: "pauta" },
  { id: "paid",        label: "Paid Media",  icon: "TrendingUp",       group: "pauta" },
  { id: "anuncios",    label: "Anuncios",    icon: "Image",            group: "pauta" },
  { id: "organico",    label: "Contenidos Orgánicos",    icon: "Sparkles",         group: "contenido" },
  { id: "parrilla",    label: "Parrilla",    icon: "CalendarDays",     group: "contenido" },
  { id: "open-bui",    label: "Bewe Studio",  icon: "Palette",          group: "contenido" },
  { id: "performance", label: "Performance", icon: "Gauge",            group: "analítica" },
  { id: "seo",         label: "SEO",         icon: "Search",           group: "analítica" },
  { id: "aeo",         label: "AEO · LLMs",  icon: "Brain",            group: "analítica" },
  { id: "informe",     label: "Informe",     icon: "FileText",         group: "analítica" },
  { id: "comunidad",   label: "Comunidad",   icon: "MessageCircle",    group: "contenido" },
  { id: "config",      label: "Config",      icon: "Settings2",        group: "admin" },
] as const;

export const TAB_GROUPS: Array<{ id: string; label: string }> = [
  { id: "pauta",      label: "Pauta · Inversión" },
  { id: "contenido",  label: "Contenido · Creativo" },
  { id: "analítica",  label: "Analítica" },
  { id: "admin",      label: "Configuración" },
];
