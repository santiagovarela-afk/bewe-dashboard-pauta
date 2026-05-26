/**
 * Cliente server-side para Google Search Console.
 *
 * Autentica via OAuth 2.0 user-based (Bewe org bloquea Service Accounts).
 * Las credenciales viven en GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN
 * (ver lib/google-oauth.ts). El usuario que generó el refresh_token tiene
 * que tener acceso a la propiedad `sc-domain:bewe.ai` en Search Console.
 *
 * Docs API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
 */
import { google, type searchconsole_v1 } from "googleapis";
import { getAuthenticatedClient, isOAuthAuthenticated } from "./google-oauth";

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

export function getGSCClient(): searchconsole_v1.Searchconsole {
  const auth = getAuthenticatedClient();
  return google.searchconsole({ version: "v1", auth });
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
  return isOAuthAuthenticated();
}
