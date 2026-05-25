export interface Campaign {
  code: string;
  cid: string;
  name: string;
  event: "CompleteRegistration" | "InitiateCheckout";
  geo: string;
  vertical: "Belleza" | "Comercio" | "Servicios";
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED" | string;
  daily: number;
  total: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  reach: number;
  freq: number;
  conversions: number;
  cpt: number | null;
  /**
   * Severidad gradual basada en CPT vs thresholds:
   * - "warn":     CPT entre warn y critical (amarillo · monitorear)
   * - "attention": CPT entre critical y 1.5× critical (naranja · acción cercana)
   * - "critical": CPT > 1.5× critical (rojo · acción inmediata)
   * - "anomaly": pixel/CAPI roto, no calcular CPT
   * - null:      OK (verde)
   */
  flag: "critical" | "attention" | "warn" | "anomaly" | null;
  evContact: number;
  evInitCheckout: number;
  evCompleteReg: number;
  /** Eventos Meta CAPI extra del funnel SaaS · vienen del action_type de Meta API */
  evStartTrial: number;
  evSubscribe: number;
  /** Daily budget REAL desde Meta API en EUROS. Suma de adsets si la campaña no usa CBO. */
  liveDailyBudget?: number;
  /** Lifetime budget REAL desde Meta API en EUROS. null si la campaña usa daily_budget. */
  liveLifetimeBudget?: number | null;
  /** Indica si la campaña usa Campaign Budget Optimization (CBO) */
  isCBO?: boolean;
}

export interface Adset {
  cid: string;
  adsetId?: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  reach: number;
  freq: number;
  conversions: number;
  cpt: number | null;
  warn?: boolean;
  /** Daily budget real del adset en EUROS (si la campaña no usa CBO) */
  liveDailyBudget?: number;
  /** Estado real del adset · ACTIVE/PAUSED */
  status?: string;
}

export interface SessionUser {
  email: string;
  name: string;
  role: "admin" | "lead" | "content";
}

export type Snapshot = {
  label: string;
  isLive: boolean;
  fetchedAt: string | null;
};

/** Per-day breakdown row for a single campaign (or adset). */
export interface DailyRow {
  /** ISO YYYY-MM-DD */
  date: string;
  campaignId: string;
  /** opcional · adset asociado */
  adsetId?: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpm: number;
  freq: number;
  evContact: number;
  evInitCheckout: number;
  evCompleteReg: number;
  evStartTrial: number;
  evSubscribe: number;
}

export type ThemeMode = "dark" | "light";

export interface DateRange {
  /** ISO YYYY-MM-DD inclusive */
  from: string;
  /** ISO YYYY-MM-DD inclusive */
  to: string;
}

/** Memoria persistente del agente IA. Vive en `.data/ai-memory.json`. */
export interface AiMemoryEntry {
  id: string;
  /** YYYY-MM-DDTHH:mm:ss */
  ts: string;
  /** quién la creó */
  source: "user" | "agent" | "system";
  /** rótulo corto */
  topic: string;
  /** cuerpo · markdown */
  body: string;
  /** referencia opcional a campaña/asset */
  ref?: string;
}

export interface AiMemoryFile {
  /** Reglas que el agente DEBE recordar — escritas por el sistema */
  rules: string[];
  /** Línea del tiempo de decisiones / observaciones */
  entries: AiMemoryEntry[];
}
