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
  flag: "critical" | "warn" | "anomaly" | null;
  evContact: number;
  evInitCheckout: number;
  evCompleteReg: number;
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
