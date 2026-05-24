// Bypass the route and call Gemini directly to inspect finishReason + usageMetadata.
// This confirms (or refutes) the thinking-token vs maxOutputTokens hypothesis.
import fs from "node:fs/promises";
const key = "AIzaSyC0-zRm8vt1bMNin4qog0yZhbIi1fXX1rc";
const model = "gemini-flash-latest";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const raw = JSON.parse(await fs.readFile("_logs/.ai-test-raw.json", "utf8"));
const system = raw.system;

// Use a short, predictable question
const question = "¿Cómo va C2 hoy? Sé conciso, 2 líneas máximo.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Try up to 6 times across 6 minutes
for (let attempt = 1; attempt <= 6; attempt++) {
  console.log(`Attempt ${attempt}…`);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: question }] }],
      generationConfig: { maxOutputTokens: 700, temperature: 0.3 },
    }),
  });
  const data = await r.json();
  if (data.error) {
    console.log("  ERR:", data.error.message?.slice(0, 120));
    await sleep(60000);
    continue;
  }
  // Save the full raw response
  await fs.writeFile("_logs/.ai-confirm-raw.json", JSON.stringify(data, null, 2), "utf8");
  console.log("\n=== finishReason ===", data.candidates?.[0]?.finishReason);
  console.log("=== usageMetadata ===", JSON.stringify(data.usageMetadata, null, 2));
  console.log("=== response text ===");
  console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
  break;
}
