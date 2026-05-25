/**
 * Cliente server-side para Google Analytics 4 · Data API (v1beta).
 *
 * Reutiliza el mismo Service Account JSON usado para Google Search Console
 * (env var GOOGLE_SA_KEY, base64 del JSON). El SA tiene que tener acceso
 * "Viewer" sobre la propiedad GA4 cuyo Property ID se carga en
 * GA4_PROPERTY_ID.
 *
 * Captura el evento de "trial iniciado" definido en GA4 (nombre exacto
 * configurable vía GA4_TRIAL_EVENT_NAME · default `trial_started`).
 *
 * Docs API: https://developers.google.com/analytics/devguides/reporting/data/v1
 */
import { google, type analyticsdata_v1beta } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];
const DEFAULT_EVENT_NAME = "trial_started";

export interface GA4Trial {
  date: string;
  trials: number;
  source: string;
  medium: string;
}

export interface GA4TrialsSummary {
  total: number;
  daily: Array<{ date: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  eventName: string;
  rangeDays: number;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
  type?: string;
}

function decodeServiceAccountKey(): ServiceAccountKey {
  const raw = process.env.GOOGLE_SA_KEY;
  if (!raw || raw.trim() === "") {
    throw new Error("GA4 no configurado · falta GOOGLE_SA_KEY env var");
  }
  let decoded: string;
  try {
    decoded = Buffer.from(raw, "base64").toString("utf-8");
  } catch {
    throw new Error("GA4 no configurado · GOOGLE_SA_KEY no es base64 válido");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error("GA4 no configurado · GOOGLE_SA_KEY decodificado no es JSON válido");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as ServiceAccountKey).client_email !== "string" ||
    typeof (parsed as ServiceAccountKey).private_key !== "string"
  ) {
    throw new Error("GA4 no configurado · GOOGLE_SA_KEY JSON sin client_email/private_key");
  }
  return parsed as ServiceAccountKey;
}

let cachedClient: analyticsdata_v1beta.Analyticsdata | null = null;

function getGA4Client(): analyticsdata_v1beta.Analyticsdata {
  if (cachedClient) return cachedClient;
  const key = decodeServiceAccountKey();
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: SCOPES,
  });
  cachedClient = google.analyticsdata({ version: "v1beta", auth });
  return cachedClient;
}

function getPropertyId(): string {
  const raw = process.env.GA4_PROPERTY_ID;
  if (!raw || raw.trim() === "") {
    throw new Error("GA4 no configurado · falta GA4_PROPERTY_ID");
  }
  const cleaned = raw.trim();
  if (!/^\d+$/.test(cleaned)) {
    throw new Error("GA4 no configurado · GA4_PROPERTY_ID debe ser numérico (sin prefijo 'properties/')");
  }
  return cleaned;
}

function getEventName(): string {
  const raw = process.env.GA4_TRIAL_EVENT_NAME;
  if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
  return DEFAULT_EVENT_NAME;
}

function toISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return { startDate: toISO(start), endDate: toISO(end) };
}

/** GA4 devuelve fechas en formato YYYYMMDD · normalizamos a YYYY-MM-DD. */
function normalizeDate(raw: string): string {
  if (raw.length === 8 && /^\d+$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

function safeInt(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export function isGA4Configured(): boolean {
  const propId = process.env.GA4_PROPERTY_ID;
  const saKey = process.env.GOOGLE_SA_KEY;
  return (
    typeof propId === "string" &&
    propId.trim() !== "" &&
    typeof saKey === "string" &&
    saKey.trim() !== ""
  );
}

interface FetchTrialsArgs {
  days?: number;
}

export async function fetchTrials(daysOrArgs: number | FetchTrialsArgs = 28): Promise<GA4TrialsSummary> {
  const days = typeof daysOrArgs === "number" ? daysOrArgs : daysOrArgs.days ?? 28;
  const eventName = getEventName();
  const propertyId = getPropertyId();
  const client = getGA4Client();
  const { startDate, endDate } = buildDateRange(days);

  const [dailyRes, sourceRes] = await Promise.all([
    client.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: { value: eventName, matchType: "EXACT" },
          },
        },
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: String(days + 5),
      },
    }),
    client.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: { value: eventName, matchType: "EXACT" },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "25",
      },
    }),
  ]);

  const dailyRows = dailyRes.data.rows ?? [];
  const daily = dailyRows
    .map((row) => {
      const rawDate = row.dimensionValues?.[0]?.value;
      const rawCount = row.metricValues?.[0]?.value;
      if (typeof rawDate !== "string") return null;
      return {
        date: normalizeDate(rawDate),
        count: safeInt(rawCount),
      };
    })
    .filter((d): d is { date: string; count: number } => d !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const total = daily.reduce((s, d) => s + d.count, 0);

  const sourceRows = sourceRes.data.rows ?? [];
  const bySource = sourceRows
    .map((row) => {
      const src = row.dimensionValues?.[0]?.value ?? "(not set)";
      const med = row.dimensionValues?.[1]?.value ?? "(not set)";
      const count = safeInt(row.metricValues?.[0]?.value);
      const label = med && med !== "(not set)" ? `${src} / ${med}` : src;
      return { source: label, count };
    })
    .filter((s) => s.count > 0);

  return {
    total,
    daily,
    bySource,
    eventName,
    rangeDays: days,
  };
}

export async function fetchTrialsBySource(days: number = 28): Promise<Array<{ source: string; count: number }>> {
  const summary = await fetchTrials({ days });
  return summary.bySource;
}

/**
 * Fetchea múltiples eventos del funnel desde GA4 en una sola query.
 * Acepta array de event names y devuelve totales + daily breakdown por cada uno.
 */
export interface MultiEventResult {
  eventName: string;
  total: number;
  daily: Array<{ date: string; count: number }>;
}

export async function fetchMultipleEvents(
  eventNames: string[],
  days: number = 28,
): Promise<MultiEventResult[]> {
  if (eventNames.length === 0) return [];
  const propertyId = getPropertyId();
  const client = getGA4Client();
  const { startDate, endDate } = buildDateRange(days);

  const response = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: eventNames },
        },
      },
    },
  });

  // Agrupar por eventName
  const byEvent = new Map<string, MultiEventResult>();
  for (const name of eventNames) {
    byEvent.set(name, { eventName: name, total: 0, daily: [] });
  }

  for (const row of response.data.rows ?? []) {
    const rawDate = row.dimensionValues?.[0]?.value;
    const eventName = row.dimensionValues?.[1]?.value;
    const count = safeInt(row.metricValues?.[0]?.value);
    if (typeof rawDate !== "string" || typeof eventName !== "string") continue;

    const entry = byEvent.get(eventName);
    if (!entry) continue;
    entry.total += count;
    entry.daily.push({ date: normalizeDate(rawDate), count });
  }

  // ordenar daily por fecha asc
  for (const entry of byEvent.values()) {
    entry.daily.sort((a, b) => a.date.localeCompare(b.date));
  }

  return Array.from(byEvent.values());
}
