#!/usr/bin/env node
/**
 * Verifica rápidamente que el META_TOKEN actual de .env.local funciona.
 *
 * Uso:  npm run validate:meta
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(SELF_DIR, "..");
const ENV_PATH = path.join(PROJECT_DIR, ".env.local");
const META_ACCOUNT_ID = "act_929824683759001";
const META_GRAPH = "https://graph.facebook.com/v22.0";

async function readEnv(envPath) {
  const txt = await fs.readFile(envPath, "utf8");
  const m = {};
  txt.split(/\r?\n/).forEach((ln) => {
    const eq = ln.indexOf("=");
    if (eq < 0 || ln.startsWith("#")) return;
    const k = ln.slice(0, eq).trim();
    const v = ln.slice(eq + 1).trim();
    if (k) m[k] = v;
  });
  return m;
}

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

async function main() {
  let env;
  try {
    env = await readEnv(ENV_PATH);
  } catch {
    console.log(`${c.red}✘ No existe ${ENV_PATH}${c.reset}`);
    console.log(`${c.dim}  Crea uno con: cp .env.local.example .env.local${c.reset}`);
    process.exit(1);
  }
  const token = env.META_TOKEN;
  if (!token) {
    console.log(`${c.red}✘ META_TOKEN está vacío en .env.local${c.reset}`);
    console.log(`${c.dim}  Ejecuta:  npm run setup:meta${c.reset}`);
    process.exit(2);
  }
  console.log(`${c.dim}Token detectado · ${token.length} chars · empieza con ${token.slice(0, 6)}…${c.reset}`);

  // /me
  const meRes = await fetch(`${META_GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
  const meData = await meRes.json();
  if (!meRes.ok || meData.error) {
    console.log(`${c.red}✘ Token rechazado por Meta: ${meData.error?.message || meRes.status}${c.reset}`);
    process.exit(3);
  }
  console.log(`${c.green}✔${c.reset} Usuario: ${c.bold}${meData.name || meData.id}${c.reset} (id ${meData.id})`);

  // cuenta
  const acctRes = await fetch(
    `${META_GRAPH}/${META_ACCOUNT_ID}?fields=name,account_status,currency&access_token=${encodeURIComponent(token)}`,
  );
  const acctData = await acctRes.json();
  if (!acctRes.ok || acctData.error) {
    console.log(`${c.yellow}⚠${c.reset} No se puede leer la cuenta ${META_ACCOUNT_ID}: ${acctData.error?.message || acctRes.status}`);
    console.log(`${c.dim}  El token funciona, pero NO tiene permiso ads_read sobre tu cuenta Bewe.${c.reset}`);
    process.exit(4);
  }
  console.log(`${c.green}✔${c.reset} Cuenta: ${c.bold}${acctData.name}${c.reset} (${acctData.currency || "?"})`);

  // sample insights call
  const insRes = await fetch(
    `${META_GRAPH}/${META_ACCOUNT_ID}/insights?level=campaign&fields=campaign_id,spend,impressions&date_preset=this_month&limit=1&access_token=${encodeURIComponent(token)}`,
  );
  const insData = await insRes.json();
  if (!insRes.ok || insData.error) {
    console.log(`${c.yellow}⚠${c.reset} No se pudo leer insights: ${insData.error?.message || insRes.status}`);
    process.exit(5);
  }
  console.log(`${c.green}✔${c.reset} Insights ok · ${insData.data?.length ?? 0} fila(s) en este mes`);

  console.log(`\n${c.green}${c.bold}TODO BIEN${c.reset} · el dashboard debería ver datos en vivo al pulsar "Actualizar".`);
}

main().catch((e) => {
  console.log(`${c.red}Error: ${e.message}${c.reset}`);
  process.exit(99);
});
