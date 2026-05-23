#!/usr/bin/env node
/**
 * Bewe Pauta · CLI para configurar el META_TOKEN
 *
 * Uso:
 *   npm run setup:meta
 *   # o pasando el token como argumento:
 *   npm run setup:meta -- EAA...
 *
 * Hace:
 *   1. Te guía a generar el token en Meta Business
 *   2. Lo recibe (stdin o argv)
 *   3. Llama Graph API /me + a tu cuenta Bewe para validar
 *   4. Si funciona, escribe META_TOKEN= en .env.local
 *   5. Te avisa que reinicies el dev server
 */
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(SELF_DIR, "..");
const ENV_PATH = path.join(PROJECT_DIR, ".env.local");

// Constantes alineadas con lib/config.ts
const META_API_VERSION = "v22.0";
const META_ACCOUNT_ID = "act_929824683759001";
const META_GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

// ── colores ANSI ────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};
const log = {
  step: (n, t) => console.log(`\n${c.bold}${c.magenta}[${n}]${c.reset} ${c.bold}${t}${c.reset}`),
  info: (t) => console.log(`  ${c.dim}${t}${c.reset}`),
  ok: (t) => console.log(`  ${c.green}✔${c.reset} ${t}`),
  warn: (t) => console.log(`  ${c.yellow}⚠${c.reset} ${t}`),
  fail: (t) => console.log(`  ${c.red}✘${c.reset} ${t}`),
  hint: (t) => console.log(`    ${c.dim}↳ ${t}${c.reset}`),
};

function banner() {
  console.log(`
${c.magenta}${c.bold}┌─────────────────────────────────────────────┐
│  Bewe Pauta · Setup del token Meta          │
│  Configura META_TOKEN en .env.local         │
└─────────────────────────────────────────────┘${c.reset}
`);
}

async function validateToken(token) {
  if (!token || token.length < 20) {
    return { ok: false, error: "Token vacío o muy corto." };
  }
  if (token.includes(" ") || token.includes("\n")) {
    return { ok: false, error: "El token contiene espacios o saltos de línea." };
  }
  try {
    const res = await fetch(
      `${META_GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`,
    );
    const data = await res.json();
    if (!res.ok || data.error || !data.id) {
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    // Cuenta Bewe
    let acctOk = false;
    let acctName;
    try {
      const a = await fetch(
        `${META_GRAPH}/${META_ACCOUNT_ID}?fields=name,account_status&access_token=${encodeURIComponent(token)}`,
      );
      const ad = await a.json();
      if (a.ok && !ad.error && ad.name) {
        acctOk = true;
        acctName = ad.name;
      }
    } catch {
      /* informativo */
    }
    return { ok: true, user: { id: data.id, name: data.name }, acctOk, acctName };
  } catch (e) {
    return { ok: false, error: `Conexión a Graph API falló: ${e.message}` };
  }
}

async function writeEnv(token) {
  let body = "";
  try {
    body = await fs.readFile(ENV_PATH, "utf8");
  } catch {
    body = `# Meta Graph API · System User Token\nMETA_TOKEN=\n\n# Google AI Studio · Gemini Flash\nGEMINI_API_KEY=\n`;
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
  await fs.writeFile(ENV_PATH, next.join("\n"), "utf8");
}

function intro() {
  console.log(`${c.bold}¿Cómo conseguir el token?${c.reset}

${c.cyan}1.${c.reset} Abre ${c.blue}https://business.facebook.com${c.reset}
${c.cyan}2.${c.reset} Menú → ${c.bold}Configuración del negocio${c.reset} → ${c.bold}Usuarios${c.reset} → ${c.bold}Usuarios del sistema${c.reset}
${c.cyan}3.${c.reset} Elige (o crea) un usuario del sistema con rol ${c.bold}Admin${c.reset}
${c.cyan}4.${c.reset} Click en ${c.bold}"Generar nuevo token"${c.reset}
${c.cyan}5.${c.reset} Selecciona la app de Meta vinculada
${c.cyan}6.${c.reset} Marca permisos:
        ${c.green}• ads_read${c.reset}             ${c.dim}(obligatorio · leer campañas, métricas)${c.reset}
        ${c.dim}• ads_management        (opcional · modificar)${c.reset}
        ${c.dim}• pages_read_engagement (opcional · FB orgánico)${c.reset}
        ${c.dim}• pages_show_list       (opcional · FB orgánico)${c.reset}
        ${c.dim}• pages_manage_posts    (opcional · publicar en FB)${c.reset}
        ${c.dim}• instagram_basic       (opcional · IG)${c.reset}
        ${c.dim}• instagram_content_publish (opcional · publicar IG)${c.reset}
${c.cyan}7.${c.reset} ${c.bold}IMPORTANTE${c.reset}: marca ${c.yellow}"Never expires"${c.reset} (long-lived).
${c.cyan}8.${c.reset} Copia el token completo (empieza con ${c.dim}EAA…${c.reset})

${c.dim}─────────────────────────────────────────────${c.reset}
`);
}

async function readToken() {
  // 1. argv
  const argvToken = process.argv.slice(2).find((a) => a && !a.startsWith("-"));
  if (argvToken) {
    log.info("Token recibido vía argumento.");
    return argvToken.trim();
  }
  // 2. stdin (solo se abre readline si realmente lo necesitamos)
  const rl = readline.createInterface({ input, output });
  try {
    const ans = await rl.question(
      `${c.bold}Pega el token aquí${c.reset} ${c.dim}(o ENTER para abortar)${c.reset}: `,
    );
    return ans.trim();
  } finally {
    rl.close();
  }
}

async function main() {
  banner();
  intro();
  const token = await readToken();

  if (!token) {
    log.warn("Sin token — saliendo. Cuando lo tengas, vuelve a correr:");
    log.hint("npm run setup:meta");
    process.exit(1);
  }

  log.step(1, "Validando token contra Meta Graph API…");
  const v = await validateToken(token);
  if (!v.ok) {
    log.fail(`Token inválido: ${v.error}`);
    log.hint("Verifica que copiaste el token completo, sin espacios, y que tiene permiso ads_read.");
    process.exit(2);
  }
  log.ok(`Token válido para ${c.bold}${v.user.name || v.user.id}${c.reset} (id ${v.user.id})`);
  if (v.acctOk) {
    log.ok(`Acceso confirmado a la cuenta Bewe: ${c.bold}${v.acctName}${c.reset}`);
  } else {
    log.warn(`Sin acceso confirmado a la cuenta ${META_ACCOUNT_ID} (¿permisos ads_read?)`);
    log.hint("El token quedará guardado igual — añade ads_read si quieres ver campañas.");
  }

  log.step(2, "Guardando en .env.local…");
  try {
    await writeEnv(token);
    log.ok(`Escrito en ${c.cyan}${path.relative(PROJECT_DIR, ENV_PATH)}${c.reset}`);
  } catch (e) {
    log.fail(`No se pudo escribir el archivo: ${e.message}`);
    process.exit(3);
  }

  log.step(3, "¡Listo! Reinicia el dev server");
  console.log(`
  ${c.bold}En la terminal donde corre el dev server:${c.reset}
    ${c.dim}1.${c.reset} ${c.bold}Ctrl+C${c.reset} para detenerlo
    ${c.dim}2.${c.reset} ${c.bold}npm run dev${c.reset} para volver a arrancarlo

  Luego abre ${c.blue}http://localhost:3000${c.reset}, pulsa ${c.bold}"Actualizar"${c.reset} arriba a la derecha
  y verás los datos en vivo de tu cuenta Meta.

  ${c.green}${c.bold}✓ Token configurado correctamente.${c.reset}
`);
}

main().catch((e) => {
  console.error(`${c.red}Error inesperado:${c.reset}`, e);
  process.exit(99);
});
