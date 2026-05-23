/** Cliente del lado servidor para Meta Graph API. */
import { PLAN } from "./config";

const BASE = `https://graph.facebook.com/${PLAN.meta.apiVersion}`;

const ALLOWED_ENDPOINT_PATTERNS: RegExp[] = [
  new RegExp(`^${PLAN.meta.accountId}(/(insights|ads|adsets|campaigns|customaudiences|adcreatives))?$`),
  /^\d+\/insights$/,
  new RegExp(`^${PLAN.meta.igAccountId}(/media|/media_publish)?$`),
  new RegExp(`^${PLAN.meta.pageId}(/photos|/posts|/feed)?$`),
  /^\d+$/,
];

export function isEndpointAllowed(endpoint: string): boolean {
  if (!endpoint || typeof endpoint !== "string") return false;
  return ALLOWED_ENDPOINT_PATTERNS.some((re) => re.test(endpoint));
}

export interface MetaCallOptions {
  endpoint: string;
  method?: "GET" | "POST";
  params?: Record<string, string | number | undefined | null>;
  body?: Record<string, unknown>;
}

export async function metaCall({ endpoint, method = "GET", params = {}, body }: MetaCallOptions) {
  const token = process.env.META_TOKEN;
  if (!token) {
    return { ok: false, status: 500, data: { error: "META_TOKEN no configurado en .env.local" } };
  }
  if (!isEndpointAllowed(endpoint)) {
    return { ok: false, status: 403, data: { error: `Endpoint no permitido: ${endpoint}` } };
  }
  const url = new URL(`${BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });

  const init: RequestInit = { method };
  if (method === "POST") {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify({ ...(body ?? {}), access_token: token });
  } else {
    url.searchParams.set("access_token", token);
  }

  const r = await fetch(url.toString(), init);
  const data = await r.json();
  return { ok: r.ok, status: r.status, data };
}
