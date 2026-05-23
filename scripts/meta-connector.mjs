#!/usr/bin/env node
/**
 * Bewe Pauta · Meta Connector Daemon
 *
 * Agente persistente que:
 *  1. Vigila `.env.local` en busca de cambios en META_TOKEN.
 *  2. Cuando aparece un token (no-vacío), lo valida contra Graph API.
 *  3. Si es válido, corre smoke tests: /me → cuenta → insights → ads → IG → FB.
 *  4. Escribe estado a `.data/connector-status.json` (leído por el dashboard).
 *  5. También intenta empujar el token al dev server vía /api/setup/meta-token
 *     (que actualiza process.env en caliente) para no requerir reinicio.
 *  6. Loguea a `.data/connector.log`.
 *
 * Uso:
 *    npm run connector
 *
 * Idempotente: puedes correrlo cuando ya hay token configurado y sólo
 * reporta "connected".
 */
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(SELF_DIR, "..");
const ENV_PATH = path.join(PROJECT_DIR, ".env.local");
const DATA_DIR = path.join(PROJECT_DIR, ".data");
const STATUS_PATH = path.join(DATA_DIR, "connector-status.json");
const LOG_PATH = path.join(DATA_DIR, "connector.log");

const META_API_VERSION = "v22.0";
const META_GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;
const ACCOUNT_ID = "act_929824683759001";
const PAGE_ID = "225426867908315";
const IG_ID = "17841404681419259";

const DEV_SERVER = "http://localhost:3000";
const POLL_MS = 4000; // intervalo de polling del .env.local
const STAMP = () => new Date().toISOString();

// ── log ─────────────────────────────────────────────────────────────────
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}
async function logLine(msg) {
  const line = `[${STAMP()}] ${msg}\n`;
  process.stdout.write(line);
  try {
    await fs.appendFile(LOG_PATH, line, "utf8");
  } catch {
    /* ignore */
  }
}

// ── env file parsing ────────────────────────────────────────────────────
/** Parse .env-style content línea a línea, evitando comentarios. */
function extractMetaToken(txt) {
  const lines = txt.split(/\r?\n/);
  for (const raw of lines) {
    const ln = raw.trimStart();
    if (!ln || ln.startsWith("#")) continue;
    const eq = ln.indexOf("=");
    if (eq < 0) continue;
    const key = ln.slice(0, eq).trim();
    if (key !== "META_TOKEN") continue;
    let val = ln.slice(eq + 1).trim();
    // strip rodeo de comillas si las hubo
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return "";
}

async function readEnvToken() {
  try {
    // Quita BOM si existe
    const buf = await fs.readFile(ENV_PATH, "utf8");
    const txt = buf.charCodeAt(0) === 0xfeff ? buf.slice(1) : buf;
    return extractMetaToken(txt);
  } catch {
    return "";
  }
}

// ── status state machine ────────────────────────────────────────────────
/**
 * @typedef {Object} Status
 * @property {"idle"|"detected"|"validating"|"connected"|"error"|"smoke-testing"} phase
 * @property {string} message
 * @property {string} updatedAt
 * @property {{id?:string,name?:string}|null} [user]
 * @property {boolean} [accountOk]
 * @property {string} [accountName]
 * @property {string} [error]
 * @property {Object<string,{ok:boolean,detail?:string}>} [smoke]
 * @property {string} [tokenPreview]
 */

let lastWritten = null;
async function writeStatus(/** @type {Status} */ status) {
  const body = JSON.stringify(status, null, 2);
  if (body === lastWritten) return;
  lastWritten = body;
  await fs.writeFile(STATUS_PATH, body, "utf8");
  await logLine(`status → ${status.phase} · ${status.message}`);
}

// ── validation ──────────────────────────────────────────────────────────
async function fetchJson(url, init) {
  const r = await fetch(url, init);
  let data;
  try {
    data = await r.json();
  } catch {
    data = {};
  }
  return { res: r, data };
}

async function validateToken(token) {
  const { res, data } = await fetchJson(
    `${META_GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok || data.error || !data.id) {
    return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, user: { id: data.id, name: data.name } };
}

async function smokeAccount(token) {
  const { res, data } = await fetchJson(
    `${META_GRAPH}/${ACCOUNT_ID}?fields=name,account_status,currency&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok || data.error) {
    return { ok: false, detail: data.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, detail: `${data.name} (${data.currency || "?"})` };
}

async function smokeInsights(token) {
  const { res, data } = await fetchJson(
    `${META_GRAPH}/${ACCOUNT_ID}/insights?level=campaign&fields=campaign_id,spend,impressions&date_preset=this_month&limit=20&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok || data.error) {
    return { ok: false, detail: data.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, detail: `${data.data?.length ?? 0} campaña(s) este mes` };
}

async function smokeAds(token) {
  const { res, data } = await fetchJson(
    `${META_GRAPH}/${ACCOUNT_ID}/ads?fields=id,name&limit=5&date_preset=this_month&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok || data.error) {
    return { ok: false, detail: data.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, detail: `${data.data?.length ?? 0} anuncio(s)` };
}

async function smokeInstagram(token) {
  const { res, data } = await fetchJson(
    `${META_GRAPH}/${IG_ID}/media?fields=id,media_type&limit=5&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok || data.error) {
    return { ok: false, detail: data.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, detail: `${data.data?.length ?? 0} post(s) IG` };
}

async function smokeFacebook(token) {
  const { res, data } = await fetchJson(
    `${META_GRAPH}/${PAGE_ID}/posts?fields=id&limit=5&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok || data.error) {
    return { ok: false, detail: data.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, detail: `${data.data?.length ?? 0} post(s) FB` };
}

// ── push live to dev server ─────────────────────────────────────────────
async function pushTokenToDevServer(token) {
  try {
    const r = await fetch(`${DEV_SERVER}/api/setup/meta-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!r.ok) {
      const t = await r.text();
      await logLine(`pushTokenToDevServer · HTTP ${r.status} · ${t.slice(0, 120)}`);
      return false;
    }
    const data = await r.json();
    if (data.liveLoaded) {
      await logLine("pushTokenToDevServer · token cargado en caliente · sin reinicio necesario");
      return true;
    }
    return Boolean(data.ok);
  } catch (e) {
    await logLine(`pushTokenToDevServer · dev server inaccesible (${e.message})`);
    return false;
  }
}

// ── ciclo principal ─────────────────────────────────────────────────────
async function checkOnce(prevToken) {
  const token = await readEnvToken();
  const preview = token ? `${token.slice(0, 8)}…${token.slice(-4)}` : "";

  if (!token) {
    if (prevToken !== "") {
      await writeStatus({
        phase: "idle",
        message: "Esperando que pegues el META_TOKEN en .env.local o en la tab Config…",
        updatedAt: STAMP(),
        tokenPreview: "",
      });
    }
    return "";
  }

  // Token changed → revalidar
  if (token === prevToken) return token;

  await writeStatus({
    phase: "detected",
    message: `Token nuevo detectado (${preview}) — validando con Meta…`,
    updatedAt: STAMP(),
    tokenPreview: preview,
  });

  const v = await validateToken(token);
  if (!v.ok) {
    await writeStatus({
      phase: "error",
      message: `Token rechazado por Meta: ${v.error}`,
      updatedAt: STAMP(),
      tokenPreview: preview,
      error: v.error,
    });
    return token;
  }

  await writeStatus({
    phase: "smoke-testing",
    message: `Token válido para ${v.user.name || v.user.id} · corriendo smoke tests…`,
    updatedAt: STAMP(),
    tokenPreview: preview,
    user: v.user,
  });

  // Run smokes in parallel
  const [acct, ins, ads, ig, fb] = await Promise.all([
    smokeAccount(token),
    smokeInsights(token),
    smokeAds(token),
    smokeInstagram(token),
    smokeFacebook(token),
  ]);
  const smoke = { account: acct, insights: ins, ads, instagram: ig, facebook: fb };

  // Push to dev server (process.env hot reload)
  await pushTokenToDevServer(token);

  const failedKeys = Object.entries(smoke)
    .filter(([, r]) => !r.ok)
    .map(([k]) => k);

  if (acct.ok && ins.ok) {
    await writeStatus({
      phase: "connected",
      message:
        failedKeys.length === 0
          ? `Conectado · ${v.user.name || v.user.id} · todos los smoke tests verdes ✓`
          : `Conectado · ${v.user.name || v.user.id} · ${failedKeys.join(", ")} fallaron (no bloquea pauta)`,
      updatedAt: STAMP(),
      tokenPreview: preview,
      user: v.user,
      accountOk: true,
      accountName: acct.detail,
      smoke,
    });
  } else {
    await writeStatus({
      phase: "error",
      message: `Token válido pero sin permisos suficientes — acct: ${acct.detail || "?"} · insights: ${ins.detail || "?"}`,
      updatedAt: STAMP(),
      tokenPreview: preview,
      user: v.user,
      accountOk: acct.ok,
      smoke,
      error: "Faltan permisos ads_read sobre la cuenta Bewe",
    });
  }

  return token;
}

async function main() {
  await ensureDataDir();
  await logLine("connector iniciado · vigilando .env.local cada " + POLL_MS / 1000 + "s");

  // initial idle status
  await writeStatus({
    phase: "idle",
    message: "Connector iniciado · esperando token…",
    updatedAt: STAMP(),
  });

  let prevToken = "";
  let watchTriggered = false;

  // fs.watch (rápido) + polling (fallback robusto en Windows)
  try {
    fsSync.watch(ENV_PATH, () => {
      watchTriggered = true;
    });
  } catch {
    /* fs.watch puede fallar si el archivo no existe aún */
  }

  // Loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const newToken = await checkOnce(prevToken);
      prevToken = newToken;
    } catch (e) {
      await logLine(`checkOnce error · ${e.message}`);
    }
    watchTriggered = false;
    // sleep
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

// graceful shutdown
let shuttingDown = false;
async function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  await logLine(`shutdown · señal ${sig}`);
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch(async (e) => {
  await logLine(`fatal · ${e?.stack || e}`);
  process.exit(99);
});
