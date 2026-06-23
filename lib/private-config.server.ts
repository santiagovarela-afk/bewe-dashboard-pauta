/**
 * Private Config Loader · SERVER-ONLY
 *
 * Carga todos los datos sensibles desde env vars (no del repo):
 *  - USERS (passwords)
 *  - Meta account/page/IG IDs
 *  - Campaign IDs reales + budgets
 *  - Plan budget total / dates / thresholds
 *
 * El cliente NUNCA importa este archivo directamente. Recibe los datos
 * sanitizados via `/api/config` (sólo lo necesario para renderizar UI).
 *
 * En desarrollo, si las env vars faltan, devuelve placeholders inocuos
 * para que la app no rompa · pero todo es vacío.
 */
// Sufijo `.server.ts` indica intención · sólo importar desde API routes.

// ─── TYPES ──────────────────────────────────────────────────────────────

export interface PrivateUser {
  email: string;
  password: string;
  role: "admin" | "lead" | "content" | "social";
  name: string;
}

export interface PrivateCampaign {
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

export interface PrivateConfig {
  meta: {
    accountId: string;
    accountIdNumeric: string;
    pageId: string;
    igAccountId: string;
    apiVersion: string;
  };
  plan: {
    monthLabel: string;
    launchISO: string;
    endISO: string;
    day7ISO: string;
    day14ISO: string;
    totalDays: number;
    budget: number;
    contingency: number;
    cpt: {
      aggressive: number;
      target: number;
      warn: number;
      critical: number;
    };
  };
  campaigns: PrivateCampaign[];
  users: PrivateUser[];
}

// ─── DEFAULTS (placeholders inocuos · NO datos reales) ───────────────────

const FALLBACK: PrivateConfig = {
  meta: {
    accountId: "",
    accountIdNumeric: "",
    pageId: "",
    igAccountId: "",
    apiVersion: "v22.0",
  },
  plan: {
    monthLabel: "—",
    launchISO: "2026-01-01T00:00:00",
    endISO: "2026-01-31T23:59:59",
    day7ISO: "2026-01-08T00:00:00",
    day14ISO: "2026-01-15T00:00:00",
    totalDays: 30,
    budget: 0,
    contingency: 0,
    cpt: { aggressive: 1.5, target: 2.2, warn: 3.0, critical: 5.5 },
  },
  campaigns: [],
  users: [],
};

// ─── LOADERS ────────────────────────────────────────────────────────────

/**
 * Lee una env var por su nombre canónico. Si no existe, intenta también
 * con el prefijo `NEXT_PUBLIC_` para evitar duplicar variables en Vercel.
 * (En el repo público, sólo usamos NEXT_PUBLIC_ para Meta/plan IDs · este
 * loader server-side los lee igual sin duplicar.)
 */
function envVar(name: string): string | undefined {
  const direct = process.env[name];
  if (direct && direct.length > 0) return direct;
  const pub = process.env[`NEXT_PUBLIC_${name}`];
  if (pub && pub.length > 0) return pub;
  return undefined;
}

function parseJSON<T>(name: string, fallback: T): T {
  const raw = envVar(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseNumber(name: string, fallback: number): number {
  const raw = envVar(name);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function envStr(name: string, fallback: string): string {
  return envVar(name) ?? fallback;
}

let cache: PrivateConfig | null = null;

/** Devuelve la config privada · cachea en runtime. */
export function getPrivateConfig(): PrivateConfig {
  if (cache) return cache;

  cache = {
    meta: {
      accountId: envStr("META_ACCOUNT_ID", FALLBACK.meta.accountId),
      accountIdNumeric: envStr("META_ACCOUNT_ID_NUMERIC", FALLBACK.meta.accountIdNumeric),
      pageId: envStr("META_PAGE_ID", FALLBACK.meta.pageId),
      igAccountId: envStr("META_IG_ID", FALLBACK.meta.igAccountId),
      apiVersion: envStr("META_API_VERSION", FALLBACK.meta.apiVersion),
    },
    plan: {
      monthLabel: envStr("PLAN_MONTH_LABEL", FALLBACK.plan.monthLabel),
      launchISO: envStr("PLAN_LAUNCH_ISO", FALLBACK.plan.launchISO),
      endISO: envStr("PLAN_END_ISO", FALLBACK.plan.endISO),
      day7ISO: envStr("PLAN_DAY7_ISO", FALLBACK.plan.day7ISO),
      day14ISO: envStr("PLAN_DAY14_ISO", FALLBACK.plan.day14ISO),
      totalDays: parseNumber("PLAN_TOTAL_DAYS", FALLBACK.plan.totalDays),
      budget: parseNumber("PLAN_BUDGET", FALLBACK.plan.budget),
      contingency: parseNumber("PLAN_CONTINGENCY", FALLBACK.plan.contingency),
      cpt: {
        aggressive: parseNumber("PLAN_CPT_AGGRESSIVE", FALLBACK.plan.cpt.aggressive),
        target: parseNumber("PLAN_CPT_TARGET", FALLBACK.plan.cpt.target),
        warn: parseNumber("PLAN_CPT_WARN", FALLBACK.plan.cpt.warn),
        critical: parseNumber("PLAN_CPT_CRITICAL", FALLBACK.plan.cpt.critical),
      },
    },
    campaigns: parseJSON<PrivateCampaign[]>("CAMPAIGNS_JSON", FALLBACK.campaigns),
    users: parseJSON<PrivateUser[]>("AUTH_USERS_JSON", FALLBACK.users),
  };

  return cache;
}

/** Resetea cache (testing). */
export function resetPrivateConfigCache(): void {
  cache = null;
}

// ─── AUTH ───────────────────────────────────────────────────────────────

export interface AuthSessionUser {
  email: string;
  name: string;
  role: "admin" | "lead" | "content" | "social";
}

/** Valida login contra env-loaded USERS · timing-safe. */
export function validateLogin(
  email: string,
  password: string,
): AuthSessionUser | null {
  const cfg = getPrivateConfig();
  const normalized = email.trim().toLowerCase();
  const user = cfg.users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) return null;
  // Comparación constante (mitiga timing-attacks básicos)
  if (!constantTimeEqual(user.password, password)) return null;
  return { email: user.email, name: user.name, role: user.role };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}

// ─── PUBLIC SHAPE (para client) ─────────────────────────────────────────

/**
 * Devuelve config NO sensible para el cliente (después de login).
 * No incluye passwords ni el array completo de users.
 */
export function getClientSafeConfig() {
  const cfg = getPrivateConfig();
  return {
    meta: cfg.meta,
    plan: cfg.plan,
    campaigns: cfg.campaigns,
  };
}
