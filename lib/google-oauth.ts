/**
 * Cliente OAuth 2.0 para acceder a Google Search Console + GA4 con
 * credenciales de usuario (cuando los Service Accounts están bloqueados
 * por políticas org).
 *
 * Flow:
 *   1. Admin hace login una vez · /api/auth/google/start → consent → callback
 *   2. Callback guarda el refresh_token (devolvemos al usuario para que lo
 *      cargue como env var GOOGLE_OAUTH_REFRESH_TOKEN en Vercel).
 *   3. Cada request a Google API instancia OAuth2Client con la triple:
 *      client_id, client_secret, refresh_token.
 *      googleapis se encarga de pedir un access_token fresh automáticamente.
 */

import { google, type Auth } from "googleapis";

const REDIRECT_PATH = "/api/auth/google/callback";

export function getRedirectUri(): string {
  // En server-side usar VERCEL_URL si existe (deploy preview/prod) o localhost
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}${REDIRECT_PATH}`;
  return `http://localhost:3001${REDIRECT_PATH}`;
}

/** Scopes que vamos a pedir · read-only para GSC + GA4. */
export const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
];

export function isOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );
}

export function isOAuthAuthenticated(): boolean {
  return isOAuthConfigured() && Boolean(process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
}

/** OAuth2Client autenticado · listo para pasar a google.searchconsole/analyticsdata. */
export function getAuthenticatedClient(): Auth.OAuth2Client {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret) {
    throw new Error("OAuth client no configurado · falta GOOGLE_OAUTH_CLIENT_ID/SECRET");
  }
  if (!refreshToken) {
    throw new Error("OAuth no autenticado · falta GOOGLE_OAUTH_REFRESH_TOKEN · hacer login en /api/auth/google/start");
  }
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    getRedirectUri(),
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

/** Genera la URL para que el admin haga consent. */
export function buildConsentUrl(): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("OAuth client no configurado");
  }
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    getRedirectUri(),
  );
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // fuerza refresh_token
    scope: OAUTH_SCOPES,
  });
}

/** Intercambia auth code por tokens · usado en el callback. */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string | null;
  refresh_token: string | null;
  expiry_date: number | null;
}> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("OAuth client no configurado");
  }
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    getRedirectUri(),
  );
  const { tokens } = await oAuth2Client.getToken(code);
  return {
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
  };
}
