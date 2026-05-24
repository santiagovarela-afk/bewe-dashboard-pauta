// Retry remaining failures with long pacing & extracting retry-after from the error.
import fs from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const rawPath = path.join(process.cwd(), "_logs", ".ai-test-raw.json");
const raw = JSON.parse(await fs.readFile(rawPath, "utf8"));
const { system, results } = raw;

const failed = results.filter((r) => r.error);
console.log(`Reintentando ${failed.length}, pacing 45s entre cada uno`);

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
  let attempts = 0;
  while (attempts < 4) {
    attempts++;
    await sleep(attempts === 1 ? 45000 : 60000);
    process.stdout.write(`#${p.id} attempt ${attempts}…`);
    const start = Date.now();
    let resp;
    try {
      resp = await ask(p.q, system);
    } catch (e) {
      resp = { error: String(e) };
    }
    const ms = Date.now() - start;
    if (!resp.error) {
      const idx = results.findIndex((r) => r.id === p.id);
      results[idx] = { id: p.id, cat: p.cat, q: p.q, ms, text: resp.text };
      process.stdout.write(` ${ms}ms OK\n`);
      break;
    } else {
      process.stdout.write(` ${ms}ms ERR: ${(resp.error || "").slice(0, 90)}\n`);
      // If permanent (not quota), break
      if (!String(resp.error).includes("quota") && !String(resp.error).includes("Quota")) {
        const idx = results.findIndex((r) => r.id === p.id);
        results[idx] = { id: p.id, cat: p.cat, q: p.q, ms, error: resp.error };
        break;
      }
    }
  }
}

await fs.writeFile(rawPath, JSON.stringify({ system, results }, null, 2), "utf8");
console.log("\nFinalizado · errores restantes:", results.filter((r) => r.error).length);
