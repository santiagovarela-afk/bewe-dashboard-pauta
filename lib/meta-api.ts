/**
 * Cliente del lado servidor para Meta Graph API.
 *
 * Maneja dos tipos de token transparentemente:
 *  1. System User Token (META_TOKEN) — para ad account + Instagram + lookups
 *  2. Page Access Token — derivado del system user al vuelo via /me/accounts,
 *     cacheado en memoria, usado para llamadas a la página FB (/posts /feed
 *     /published_posts) que Meta exige desde la "nueva experiencia para páginas".
 */
import { PLAN } from "./config";

const BASE = `https://graph.facebook.com/${PLAN.meta.apiVersion}`;

const ALLOWED_ENDPOINT_PATTERNS: RegExp[] = [
  // Cuenta publicitaria
  new RegExp(`^${PLAN.meta.accountId}(/(insights|ads|adsets|campaigns|customaudiences|adcreatives))?$`),
  /^\d+\/insights$/,
  // Instagram · media + comentarios + replies a comments IG
  new RegExp(`^${PLAN.meta.igAccountId}(/(media|media_publish|insights))?$`),
  // Página Facebook · paths de lectura/publicación + conversations (Messenger)
  new RegExp(`^${PLAN.meta.pageId}(/(photos|posts|feed|published_posts|tagged|videos|insights|conversations))?$`),
  // Lookups por ID (creative · adset · ad · IG media · FB post · comment)
  // Incluye /comments (FB post + IG media) · /replies (responder IG comment)
  /^\d+(\/(insights|comments|replies))?$/,
  // Conversations Messenger · IDs tipo "t_2048315332430427"
  /^t_\d+(\/messages)?$/,
  // Envío de mensajes via página (POST /me/messages usando Page Token)
  /^me\/messages$/,
  // Diagnóstico
  /^me(\/permissions|\/accounts)?$/,
  /^debug_token$/,
];

/** Endpoints que requieren Page Access Token (no System User). */
const PAGE_ENDPOINT_PATTERNS: RegExp[] = [
  new RegExp(`^${PLAN.meta.pageId}(/(posts|feed|published_posts|photos|tagged|videos|insights|conversations))?$`),
  // FB post comments — los post IDs FB tienen formato pageId_postId
  new RegExp(`^${PLAN.meta.pageId}_\\d+(/comments)?$`),
  // Conversations IDs (t_XXXXX) y sus mensajes
  /^t_\d+(\/messages)?$/,
  // Enviar mensaje desde página
  /^me\/messages$/,
  // Responder a comentario FB (los comment IDs FB también tienen formato pageId_commentId)
  new RegExp(`^${PLAN.meta.pageId}_\\d+\\/comments$`),
];

export function isEndpointAllowed(endpoint: string): boolean {
  if (!endpoint || typeof endpoint !== "string") return false;
  return ALLOWED_ENDPOINT_PATTERNS.some((re) => re.test(endpoint));
}

function needsPageToken(endpoint: string): boolean {
  return PAGE_ENDPOINT_PATTERNS.some((re) => re.test(endpoint));
}

// ── Cache en memoria del Page Access Token ─────────────────────────────
let pageTokenCache: { token: string; expiresAt: number } | null = null;
const PAGE_TOKEN_TTL_MS = 50 * 60 * 1000; // 50 min · refresca antes de la hora

export async function getPageAccessToken(systemToken: string): Promise<string | null> {
  if (pageTokenCache && pageTokenCache.expiresAt > Date.now()) {
    return pageTokenCache.token;
  }
  try {
    const url = new URL(`${BASE}/me/accounts`);
    url.searchParams.set("fields", "id,name,access_token");
    url.searchParams.set("access_token", systemToken);
    const r = await fetch(url.toString());
    const data = (await r.json()) as {
      data?: Array<{ id: string; name: string; access_token: string }>;
      error?: { message: string };
    };
    if (data.error || !data.data) return null;
    const page = data.data.find((p) => p.id === PLAN.meta.pageId);
    if (!page?.access_token) return null;
    pageTokenCache = { token: page.access_token, expiresAt: Date.now() + PAGE_TOKEN_TTL_MS };
    return page.access_token;
  } catch {
    return null;
  }
}

export interface MetaCallOptions {
  endpoint: string;
  method?: "GET" | "POST";
  params?: Record<string, string | number | undefined | null>;
  body?: Record<string, unknown>;
}

export async function metaCall({ endpoint, method = "GET", params = {}, body }: MetaCallOptions) {
  const systemToken = process.env.META_TOKEN;
  if (!systemToken) {
    return { ok: false, status: 500, data: { error: "META_TOKEN no configurado en .env.local" } };
  }
  if (!isEndpointAllowed(endpoint)) {
    return { ok: false, status: 403, data: { error: `Endpoint no permitido: ${endpoint}` } };
  }

  // Decide qué token usar
  let token = systemToken;
  if (needsPageToken(endpoint)) {
    const pageToken = await getPageAccessToken(systemToken);
    if (pageToken) {
      token = pageToken;
    } else {
      // Sin page token, el system user token va a fallar con 400 OAuthException
      return {
        ok: false,
        status: 500,
        data: {
          error:
            "No se pudo derivar Page Access Token desde /me/accounts. Verifica que el System User tenga la página de Bewe asignada con rol Admin.",
        },
      };
    }
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
