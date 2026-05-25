/**
 * Cliente server-side para Google Search Console.
 *
 * Autentica via Service Account · JSON encoded en base64 en GOOGLE_SA_KEY.
 * El SA tiene que estar dado de alta en Search Console (Owner o Full user)
 * sobre la propiedad `sc-domain:bewe.ai`.
 *
 * Docs API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
 */
import { google, type searchconsole_v1 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];
const DEFAULT_SITE_URL = "sc-domain:bewe.ai";

export interface GSCQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCDaily {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCOverview {
  clicks: number;
  impressions: number;
  avgCtr: number;
  avgPosition: number;
  daily: GSCDaily[];
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
    throw new Error("GSC no configurado · falta GOOGLE_SA_KEY env var");
  }
  let decoded: string;
  try {
    decoded = Buffer.from(raw, "base64").toString("utf-8");
  } catch {
    throw new Error("GSC no configurado · GOOGLE_SA_KEY no es base64 válido");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error("GSC no configurado · GOOGLE_SA_KEY decodificado no es JSON válido");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as ServiceAccountKey).client_email !== "string" ||
    typeof (parsed as ServiceAccountKey).private_key !== "string"
  ) {
    throw new Error("GSC no configurado · GOOGLE_SA_KEY JSON sin client_email/private_key");
  }
  return parsed as ServiceAccountKey;
}

let cachedClient: searchconsole_v1.Searchconsole | null = null;

export function getGSCClient(): searchconsole_v1.Searchconsole {
  if (cachedClient) return cachedClient;
  const key = decodeServiceAccountKey();
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: SCOPES,
  });
  cachedClient = google.searchconsole({ version: "v1", auth });
  return cachedClient;
}

function getSiteUrl(): string {
  return process.env.GSC_SITE_URL ?? DEFAULT_SITE_URL;
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

function safeNum(v: number | null | undefined): number {
  if (v === null || v === undefined || Number.isNaN(v)) return 0;
  return v;
}

interface FetchTopQueriesArgs {
  days?: number;
  limit?: number;
}

export async function fetchTopQueries(args: FetchTopQueriesArgs = {}): Promise<GSCQuery[]> {
  const days = args.days ?? 28;
  const limit = args.limit ?? 50;
  const client = getGSCClient();
  const { startDate, endDate } = buildDateRange(days);
  const res = await client.searchanalytics.query({
    siteUrl: getSiteUrl(),
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: limit,
      dataState: "final",
    },
  });
  const rows = res.data.rows ?? [];
  return rows
    .map<GSCQuery | null>((row) => {
      const key = row.keys?.[0];
      if (typeof key !== "string") return null;
      return {
        query: key,
        clicks: safeNum(row.clicks),
        impressions: safeNum(row.impressions),
        ctr: safeNum(row.ctr) * 100,
        position: safeNum(row.position),
      };
    })
    .filter((q): q is GSCQuery => q !== null);
}

interface FetchTopPagesArgs {
  days?: number;
  limit?: number;
}

export async function fetchTopPages(args: FetchTopPagesArgs = {}): Promise<GSCPage[]> {
  const days = args.days ?? 28;
  const limit = args.limit ?? 25;
  const client = getGSCClient();
  const { startDate, endDate } = buildDateRange(days);
  const res = await client.searchanalytics.query({
    siteUrl: getSiteUrl(),
    requestBody: {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: limit,
      dataState: "final",
    },
  });
  const rows = res.data.rows ?? [];
  return rows
    .map<GSCPage | null>((row) => {
      const key = row.keys?.[0];
      if (typeof key !== "string") return null;
      return {
        page: key,
        clicks: safeNum(row.clicks),
        impressions: safeNum(row.impressions),
        ctr: safeNum(row.ctr) * 100,
        position: safeNum(row.position),
      };
    })
    .filter((p): p is GSCPage => p !== null);
}

interface FetchOverviewArgs {
  days?: number;
}

export async function fetchOverview(args: FetchOverviewArgs = {}): Promise<GSCOverview> {
  const days = args.days ?? 28;
  const client = getGSCClient();
  const { startDate, endDate } = buildDateRange(days);

  const [totalsRes, dailyRes] = await Promise.all([
    client.searchanalytics.query({
      siteUrl: getSiteUrl(),
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
        dataState: "final",
      },
    }),
    client.searchanalytics.query({
      siteUrl: getSiteUrl(),
      requestBody: {
        startDate,
        endDate,
        dimensions: ["date"],
        rowLimit: days + 5,
        dataState: "final",
      },
    }),
  ]);

  const totalsRow = totalsRes.data.rows?.[0];
  const clicks = safeNum(totalsRow?.clicks);
  const impressions = safeNum(totalsRow?.impressions);
  const avgCtr = safeNum(totalsRow?.ctr) * 100;
  const avgPosition = safeNum(totalsRow?.position);

  const dailyRows = dailyRes.data.rows ?? [];
  const daily: GSCDaily[] = dailyRows
    .map<GSCDaily | null>((row) => {
      const date = row.keys?.[0];
      if (typeof date !== "string") return null;
      return {
        date,
        clicks: safeNum(row.clicks),
        impressions: safeNum(row.impressions),
        ctr: safeNum(row.ctr) * 100,
        position: safeNum(row.position),
      };
    })
    .filter((d): d is GSCDaily => d !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return { clicks, impressions, avgCtr, avgPosition, daily };
}

interface FetchKeywordsByPageArgs {
  page: string;
  days?: number;
  limit?: number;
}

export async function fetchKeywordsByPage(args: FetchKeywordsByPageArgs): Promise<GSCQuery[]> {
  const days = args.days ?? 28;
  const limit = args.limit ?? 50;
  const client = getGSCClient();
  const { startDate, endDate } = buildDateRange(days);
  const res = await client.searchanalytics.query({
    siteUrl: getSiteUrl(),
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: limit,
      dataState: "final",
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "equals",
              expression: args.page,
            },
          ],
        },
      ],
    },
  });
  const rows = res.data.rows ?? [];
  return rows
    .map<GSCQuery | null>((row) => {
      const key = row.keys?.[0];
      if (typeof key !== "string") return null;
      return {
        query: key,
        clicks: safeNum(row.clicks),
        impressions: safeNum(row.impressions),
        ctr: safeNum(row.ctr) * 100,
        position: safeNum(row.position),
      };
    })
    .filter((q): q is GSCQuery => q !== null);
}

export function isGSCConfigured(): boolean {
  const raw = process.env.GOOGLE_SA_KEY;
  return typeof raw === "string" && raw.trim() !== "";
}
