// Retry only the failed prompts (rate-limited) with pacing, then merge.
import fs from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const rawPath = path.join(process.cwd(), "_logs", ".ai-test-raw.json");
const raw = JSON.parse(await fs.readFile(rawPath, "utf8"));
const { system, results } = raw;

const failed = results.filter((r) => r.error);
console.log(`Reintentando ${failed.length} fallidos…`);

async function ask(question, system) {
  const r = await fetch(`${BASE}/api/gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, system }),
  });
  return await r.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const p of failed) {
  // Pace at 20 seconds between requests to dodge the free-tier 20 RPM cap
  await sleep(20000);
  process.stdout.write(`Retry #${p.id} [${p.cat}]…`);
  const start = Date.now();
  let resp;
  try {
    resp = await ask(p.q, system);
  } catch (e) {
    resp = { error: String(e) };
  }
  const ms = Date.now() - start;
  // Merge in-place
  const idx = results.findIndex((r) => r.id === p.id);
  if (resp.error) {
    results[idx] = { id: p.id, cat: p.cat, q: p.q, ms, error: resp.error };
  } else {
    results[idx] = { id: p.id, cat: p.cat, q: p.q, ms, text: resp.text };
  }
  process.stdout.write(` ${ms}ms ${resp.error ? "ERR" : "OK"}\n`);
}

await fs.writeFile(rawPath, JSON.stringify({ system, results }, null, 2), "utf8");
console.log("\nFinalizado · errores restantes:", results.filter((r) => r.error).length);
