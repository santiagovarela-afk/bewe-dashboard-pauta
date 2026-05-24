// One-off test harness: builds a representative system prompt (like the dashboard)
// and POSTs 25 prompts to /api/gemini, writing results to a JSON file we can
// then summarize manually. Read-only over the codebase.

import fs from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";

// ─── Datos seed (espejo de lib/seed-data.ts al 22-may) ────────────────────
const campaigns = [
  { code: "C1", name: "MX_BELLEZA_WEB_MAY26",        status: "ACTIVE", spend: 332.59, evCompleteReg: 50, evInitCheckout: 174, evContact: 56, cpt: 6.65, ctr: 2.31, cpm: 3.39, event: "CompleteRegistration", flag: "critical", cid: "52551556599886", daily: 26 },
  { code: "C2", name: "MX_COMERCIO_WEB_MAY26",       status: "ACTIVE", spend: 272.67, evCompleteReg: 24, evInitCheckout: 95,  evContact: 38, cpt: 11.36,ctr: 3.29, cpm: 4.56, event: "CompleteRegistration", flag: "critical", cid: "52551556733086", daily: 21 },
  { code: "C3", name: "MX_SERVICIOS_WEB_MAY26",      status: "PAUSED", spend: 214.37, evCompleteReg: 14, evInitCheckout: 558, evContact: 378,cpt: 0.38, ctr: 19.91,cpm: 4.42, event: "InitiateCheckout",     flag: "anomaly",  cid: "52551556895286", daily: 16 },
  { code: "C4", name: "CR_PA_CL_CO_BELLEZA_WEB_MAY26",status:"ACTIVE", spend: 227.83, evCompleteReg: 41, evInitCheckout: 116, evContact: 50, cpt: 5.56, ctr: 2.12, cpm: 2.79, event: "CompleteRegistration", flag: "critical", cid: "52551557046086", daily: 18 },
  { code: "C5", name: "CR_PA_CL_CO_COMERCIO_WEB_MAY26",status:"PAUSED",spend: 186.91, evCompleteReg: 4,  evInitCheckout: 399, evContact: 230,cpt: 0.47, ctr: 13.53,cpm: 5.99, event: "InitiateCheckout",     flag: null,       cid: "52551557199886", daily: 14 },
  { code: "C6", name: "CR_PA_CL_CO_SERVICIOS_WEB_MAY26",status:"PAUSED",spend: 161.53,evCompleteReg: 5,  evInitCheckout: 487, evContact: 376,cpt: 0.33, ctr: 19.94,cpm: 10.46,event: "InitiateCheckout",     flag: null,       cid: "52551557419286", daily: 10 },
  { code: "C3.NEW", name: "MX_SERVICIOS_CR_MAY26",   status:"ACTIVE",  spend: 15.20,  evCompleteReg: 1,  evInitCheckout: 4,   evContact: 3,  cpt: 15.20,ctr: 2.54, cpm: 5.35, event: "CompleteRegistration", flag: "critical", cid: "52551557600000", daily: 16 },
  { code: "C7", name: "RETARGETING_MAY26",           status:"ACTIVE",  spend: 0.42,   evCompleteReg: 0,  evInitCheckout: 0,   evContact: 0,  cpt: null, ctr: 3.33, cpm: 2.33, event: "CompleteRegistration", flag: null,       cid: "52551557700000", daily: 90 },
];

// daysElapsed: 22-may - 12-may = 10 days (according to plan launchISO)
// pero "hoy" en el prompt es 24-may → 12 días.
const daysElapsed = 12;

// ─── Compute metrics (mirror selectors.computeMetrics) ───────────────────
const spend = campaigns.reduce((s, c) => s + c.spend, 0);
const cRegC = campaigns.filter((c) => c.event === "CompleteRegistration");
const cIcoC = campaigns.filter((c) => c.event === "InitiateCheckout" && c.cid !== "52551556895286");
const cptReg = (() => {
  const sp = cRegC.reduce((s, c) => s + c.spend, 0);
  const cv = cRegC.reduce((s, c) => s + (c.evCompleteReg || 0), 0);
  return cv > 0 ? sp / cv : null;
})();
const cptIco = (() => {
  const sp = cIcoC.reduce((s, c) => s + c.spend, 0);
  const cv = cIcoC.reduce((s, c) => s + (c.evInitCheckout || 0), 0);
  return cv > 0 ? sp / cv : null;
})();
const budgetPct = (spend / 3000) * 100;

// ─── Persona Mark rules (mirror ai-memory.PERSONA_RULES.mark) ────────────
const personaMarkRules = [
  "Eres Mark OS, copiloto de pauta del equipo Bewe.",
  "Personalidad: formal con humor seco, ironía elegante, comentarios sutiles. Nunca payaso, siempre respetuoso.",
  "Saludas por nombre cuando te dirigen un mensaje (ej. 'Buenas Santiago', 'Hola Julián').",
  "Cuando algo va mal, lo dices con sorna educada: 'C2 sigue gastando como si no nos importara · siento avisar'.",
  "Si la pregunta es obvia, respondes directo pero cierras con un comentario afilado.",
];

const DEFAULT_RULES = [
  "Hablas español neutro, conciso y accionable. No relleno.",
  "Tu contexto es la estrategia de pauta Bewe mayo 2026 plantead por Julián Varela (CGPO). Owner: Santiago Varela.",
  "Presupuesto: €3.000 base + €1.000 contingencia condicional. Período: 12–31 mayo 2026.",
  "Thresholds CPT: agresivo €1.57 · objetivo €2.20 · warn €3.00 · crítico €5.50.",
  "Reglas Julián: ABO por adset. Reasignación ≤20% libre · >20% requiere aprobación.",
  "Día 7 (19/5): si una campaña CR <20 → Plan B switch a InitiateCheckout.",
  "Día 14 (26/5): activar C7 Retargeting solo si ≥1.000 visits + ≥30 trials. Contingencia €1.000 si ≥2 camps CPT<€3.",
  "C3 MX_SERVICIOS tiene anomalía CAPI confirmada · pixel dispara en page load · EXCLUIR del CPT global · NO pausar (genera señal de volumen).",
  "Watchpoint Colombia: si CO >40% del gasto LATAM → activar bid cap €2.",
  "Si te preguntan algo fuera del plan, di que no lo sabes — no inventes datos.",
  "Cuando sugieras una acción, indica magnitud (€/día) y a qué campaña/adset aplica.",
  "Usa markdown con bullets y bold. Currency en € siempre.",
  "Estado al 22-may: campañas IC pausadas. Activas: C1/C2/C4 (CR originales) + C3.NEW Servicios CR + C7 Retargeting. Total 5 activas, 3 pausadas.",
  "Plan B C2 EJECUTADO el 22-may: C3, C5 y C6 quedaron PAUSADAS (no estaban funcionando el evento IC).",
  "C3 vieja MX_SERVICIOS_WEB (IC) fue PAUSADA por anomalía pixel y reemplazada por C3.NEW MX_SERVICIOS_CR_MAY26 (CR).",
  "C8 LATAM_TOOLS NO se activa hasta JUNIO — no la incluyas en cálculos ni recomendaciones de mayo.",
];

const STATIC = `PLAN DE PAUTA BEWE MAYO 2026
Owner: Santiago Varela. Aprueba: Julián Varela (CGPO).
Período: 12 mayo – 31 mayo 2026. Presupuesto: €3.000 + €1.000 contingencia condicional.

ESTADO ACTUAL (al 22 mayo 2026):
El 22-may se PAUSARON todas las campañas que optimizaban InitiateCheckout porque no estaban funcionando.
Plan B Julián ejecutado · todas las activas optimizan ahora CompleteRegistration.

CAMPAÑAS ACTIVAS (5):
C1 MX_BELLEZA_WEB_MAY26 — €26/día, CompleteRegistration, México · ACTIVE
C2 MX_COMERCIO_WEB_MAY26 — €21/día, CompleteRegistration, México · ACTIVE
C4 CR_PA_CL_CO_BELLEZA_WEB_MAY26 — €18/día, CompleteRegistration, LATAM · ACTIVE
C3.NEW MX_SERVICIOS_CR_MAY26 — ~€16/día, CompleteRegistration, México · ACTIVE · NUEVA (reemplaza C3 IC)
C7 RETARGETING_MAY26 — €90/día × 6d, CR+IC mixed, LATAM+MX · ACTIVE · NUEVA (activada día 14 según plan)

CAMPAÑAS PAUSADAS (3):
C3 MX_SERVICIOS_WEB_MAY26 — InitiateCheckout, México · PAUSED · anomalía pixel · reemplazada por C3.NEW
C5 CR_PA_CL_CO_COMERCIO_WEB_MAY26 — InitiateCheckout, LATAM · PAUSED (Plan B)
C6 CR_PA_CL_CO_SERVICIOS_WEB_MAY26 — InitiateCheckout, LATAM · PAUSED (Plan B)

NO CREADA TODAVÍA:
C8 LATAM_TOOLS — InitiateTool · NO se crea hasta JUNIO (mes nuevo).

InitiateCheckout en Bewe = clic en "Probar gratis" → app.bewe.ai/onboarding.

BENCHMARKS: Agresivo €1.57 CPT · Medio €2.20 CPT · Conservador €5.50 CPT

REGLAS JULIÁN:
- ABO (por adset). Reasignación libre hasta 20%, >20% aprobación Julián.
- Día 7 (19 mayo): Plan B EJECUTADO — campañas IC pausadas, switch a CompleteRegistration. Watchpoint CO.
- Día 14 (26 mayo): C7 Retargeting YA ACTIVADA. Contingencia €1000 si ≥2 camps CPT<€3.

C3 anomalía CAPI confirmada: excluir de CPT global (campaña ya pausada).
`;

const userName = "Santiago";
const personaHeader =
  `IDENTIDAD\n─────────\n` +
  `Eres Mark OS, copiloto de pauta para el equipo Bewe.\n` +
  `Tu interlocutor actual se llama ${userName}.\n` +
  personaMarkRules.map((r) => `- ${r}`).join("\n") +
  `\n\n`;

const lines = campaigns.map(
  (c) => `${c.code} ${c.name}: status ${c.status}, gasto €${c.spend.toFixed(2)}, CompleteReg=${c.evCompleteReg}, InitCheckout=${c.evInitCheckout}, contactos=${c.evContact}, CPT ${c.cpt ? "€" + c.cpt.toFixed(2) : "—"}, CTR ${c.ctr.toFixed(2)}%, CPM €${c.cpm.toFixed(2)}${c.flag ? " [" + c.flag + "]" : ""}`,
);

const dataBlock =
  `\nDATOS ACTUALES:\n` +
  lines.join("\n") +
  `\n\nCPT Registro (C1/C2/C4): ${cptReg ? "€" + cptReg.toFixed(2) : "—"} · CPT Inicio pago (C5/C6 excl C3): ${cptIco ? "€" + cptIco.toFixed(2) : "—"}\nDías activo: ${daysElapsed}/20\nGasto total: €${spend.toFixed(2)}/€3000 (${Math.round(budgetPct)}%)\n\nResponde en español, conciso y accionable. Usa datos concretos del plan. Respeta SIEMPRE las reglas Julián, los datos en vivo, y formato markdown con negritas y bullets cuando aporte claridad.`;

// Memory block (default rules, sin entries históricos guardados)
const rulesFmt = DEFAULT_RULES.map((r, i) => `  ${i + 1}. ${r}`).join("\n");
const memoryBlock = `MEMORIA DEL AGENTE\n──────────────────\nReglas inviolables:\n${rulesFmt}\n\nHistorial reciente (más nuevo primero, máx 15):\n  (sin entradas registradas todavía)`;

const system = personaHeader + STATIC + dataBlock + "\n\n" + memoryBlock;

// Prompts
const prompts = [
  // A · Pauta operativa
  { id: 1,  cat: "A", q: "¿Cómo va C2 hoy?" },
  { id: 2,  cat: "A", q: "¿Debo pausar la campaña de belleza México?" },
  { id: 3,  cat: "A", q: "¿Cuánto budget tengo todavía para mayo?" },
  { id: 4,  cat: "A", q: "Si muevo €10 al día de C2 a C5, ¿cuál es el impacto?" },
  { id: 5,  cat: "A", q: "¿Qué decisión hay que tomar mañana?" },
  // B · Data
  { id: 6,  cat: "B", q: "Dame el CPT de cada campaña ordenado de mejor a peor" },
  { id: 7,  cat: "B", q: "¿Cuál es nuestra mejor campaña por ROAS?" },
  { id: 8,  cat: "B", q: "Compara CR vs IC en términos de eficiencia" },
  { id: 9,  cat: "B", q: "¿Qué adset tiene el peor CTR?" },
  { id: 10, cat: "B", q: "Proyectar registros al 31/5 si seguimos al ritmo actual" },
  // C · Plan / reglas
  { id: 11, cat: "C", q: "Explícame el Plan B" },
  { id: 12, cat: "C", q: "¿Qué pasa el día 14?" },
  { id: 13, cat: "C", q: "¿Cuándo activamos contingencia €1.000?" },
  { id: 14, cat: "C", q: "¿Qué es la regla del 20% ABO?" },
  { id: 15, cat: "C", q: "¿Por qué C3 no se pausa?" },
  // D · Creativo
  { id: 16, cat: "D", q: "Sugiere 3 ideas para post Instagram de Servicios para mañana" },
  { id: 17, cat: "D", q: "¿Qué tono usar para anuncios de Belleza MX?" },
  { id: 18, cat: "D", q: "Analiza si mis creativos actuales están alineados al plan" },
  { id: 19, cat: "D", q: "Dame copy para un reel de retargeting" },
  { id: 20, cat: "D", q: "¿Qué hashtags usar para una campaña de Comercio LATAM?" },
  // E · Edge cases
  { id: 21, cat: "E", q: "¿Cuánto cuesta la nómina de Bewe?" },
  { id: 22, cat: "E", q: "¿Hay novedades en TikTok Ads este mes?" },
  { id: 23, cat: "E", q: "¿Qué pasó ayer 24 de mayo con C7?" },
  { id: 24, cat: "E", q: "Dame el revenue mensual de Bewe en marzo 2026" },
  { id: 25, cat: "E", q: "¿Quién es el competidor más fuerte de Bewe?" },
];

async function ask(question, system) {
  const r = await fetch(`${BASE}/api/gemini`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, system }),
  });
  const j = await r.json();
  if (j.error) return { error: j.error };
  return { text: j.text };
}

const results = [];
for (const p of prompts) {
  process.stdout.write(`Probando #${p.id} [${p.cat}]…`);
  const start = Date.now();
  let resp;
  try {
    resp = await ask(p.q, system);
  } catch (e) {
    resp = { error: String(e) };
  }
  const ms = Date.now() - start;
  results.push({ ...p, ms, ...resp });
  process.stdout.write(` ${ms}ms\n`);
}

// Save raw results to a JSON file
const outPath = path.join(process.cwd(), "_logs", ".ai-test-raw.json");
await fs.writeFile(outPath, JSON.stringify({ system, results }, null, 2), "utf8");
console.log(`\nResultados crudos: ${outPath}`);
console.log(`Total: ${results.length} prompts · errores: ${results.filter(r => r.error).length}`);
