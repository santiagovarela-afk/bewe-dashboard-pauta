/**
 * Helpers compartidos entre la CLI (`scripts/setup-meta-token.mjs`)
 * y el API route (`app/api/setup/meta-token/route.ts`).
 *
 * Hace UNA cosa: valida un token Meta contra Graph API y persiste a .env.local
 * solo si el token funciona realmente.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PLAN } from "./config";

const META_GRAPH = `https://graph.facebook.com/${PLAN.meta.apiVersion}`;

export interface ValidationResult {
  ok: boolean;
  /** Detalles que se muestran al usuario */
  user?: { id: string; name?: string };
  /** Permisos efectivamente concedidos (best-effort) */
  scopes?: string[];
  /** Acceso comprobado a la cuenta del plan */
  accountOk?: boolean;
  accountName?: string;
  error?: string;
}

/** Llama a /me y a la ad account para confirmar que el token funciona. */
export async function validateMetaToken(token: string): Promise<ValidationResult> {
  if (!token || typeof token !== "string" || token.length < 20) {
    return { ok: false, error: "El token está vacío o es demasiado corto." };
  }
  if (token.includes("\n") || token.includes(" ")) {
    return { ok: false, error: "El token contiene espacios o saltos de línea — copia limpio." };
  }

  // 1. /me
  let meData: { id?: string; name?: string; error?: { message?: string } };
  try {
    const meRes = await fetch(
      `${META_GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`,
    );
    meData = await meRes.json();
    if (!meRes.ok || meData.error || !meData.id) {
      return {
        ok: false,
        error: meData.error?.message || `Meta /me devolvió ${meRes.status}`,
      };
    }
  } catch (e) {
    return {
      ok: false,
      error: `No se pudo contactar Graph API: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  // 2. Acceso a la cuenta del plan
  let accountOk = false;
  let accountName: string | undefined;
  try {
    const acctRes = await fetch(
      `${META_GRAPH}/${PLAN.meta.accountId}?fields=name,account_status&access_token=${encodeURIComponent(token)}`,
    );
    const acctData = (await acctRes.json()) as {
      name?: string;
      account_status?: number;
      error?: { message?: string };
    };
    if (acctRes.ok && !acctData.error && acctData.name) {
      accountOk = true;
      accountName = acctData.name;
    }
  } catch {
    /* non-fatal · solo informativo */
  }

  return {
    ok: true,
    user: { id: meData.id!, name: meData.name },
    accountOk,
    accountName,
  };
}

/** Reemplaza (o crea) la línea META_TOKEN= en un .env.local. */
export async function writeMetaTokenToEnv(token: string, envPath: string): Promise<void> {
  let body = "";
  try {
    body = await fs.readFile(envPath, "utf8");
  } catch {
    // archivo no existe — crear desde plantilla mínima
    body = `# Meta Graph API · System User Token (long-lived).\nMETA_TOKEN=\n\n# Google AI Studio · Gemini Flash\nGEMINI_API_KEY=\n`;
  }

  const lines = body.split(/\r?\n/);
  let found = false;
  const next = lines.map((ln) => {
    if (/^META_TOKEN\s*=/.test(ln)) {
      found = true;
      return `META_TOKEN=${token}`;
    }
    return ln;
  });
  if (!found) next.push(`META_TOKEN=${token}`);

  await fs.writeFile(envPath, next.join("\n"), "utf8");
}

export function defaultEnvPath(cwd: string) {
  return path.join(cwd, ".env.local");
}
