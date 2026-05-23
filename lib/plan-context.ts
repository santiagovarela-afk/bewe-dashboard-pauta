import type { AiMemoryFile, Campaign } from "./types";
import { computeMetrics } from "./selectors";
import { memoryToPromptBlock } from "./ai-memory";

const STATIC = `PLAN DE PAUTA BEWE MAYO 2026
Owner: Santiago Varela. Aprueba: Julián Varela (CGPO).
Período: 12 mayo – 31 mayo 2026. Presupuesto: €3.000 + €1.000 contingencia condicional.

CAMPAÑAS:
C1 MX_BELLEZA_WEB — €26/día, CompleteRegistration, México
C2 MX_COMERCIO_WEB — €21/día, CompleteRegistration, México
C3 MX_SERVICIOS_WEB — €16/día, InitiateCheckout, México [PIXEL SOSPECHOSO]
C4 CR_PA_CL_CO_BELLEZA_WEB — €18/día, CompleteRegistration, LATAM
C5 CR_PA_CL_CO_COMERCIO_WEB — €14/día, InitiateCheckout, LATAM
C6 CR_PA_CL_CO_SERVICIOS_WEB — €10/día, InitiateCheckout, LATAM
C7 RETARGETING — activación CONDICIONAL 26 mayo
C8 LATAM_TOOLS — InitiateTool [NO CREADA]

InitiateCheckout en Bewe = clic en "Probar gratis" → app.bewe.ai/onboarding.

BENCHMARKS: Agresivo €1.57 CPT · Medio €2.20 CPT · Conservador €5.50 CPT

REGLAS JULIÁN:
- ABO (por adset). Reasignación libre hasta 20%, >20% aprobación Julián.
- Día 7 (19 mayo): Plan B si CompleteReg <20 → switch a InitiateCheckout. Watchpoint CO.
- Día 14 (26 mayo): Activar C7 si ≥1000 visits + ≥30 trials. Contingencia €1000 si ≥2 camps CPT<€3.

C3 anomalía CAPI confirmada: excluir de CPT global.
`;

/**
 * Construye el system prompt completo para Gemini.
 * Si `memory` está presente, se concatena el bloque de reglas + historial reciente.
 */
export function buildPlanContext(
  campaigns: Campaign[],
  daysElapsed: number,
  memory?: AiMemoryFile,
): string {
  const m = computeMetrics(campaigns);
  const lines = campaigns.map(
    (c) =>
      `${c.code} ${c.name}: status ${c.status}, gasto €${c.spend.toFixed(2)}, CompleteReg=${c.evCompleteReg}, InitCheckout=${c.evInitCheckout}, contactos=${c.evContact}, CPT ${c.cpt ? "€" + c.cpt.toFixed(2) : "—"}, CTR ${c.ctr.toFixed(2)}%, CPM €${c.cpm.toFixed(2)}${c.flag ? " [" + c.flag + "]" : ""}`,
  );

  let output =
    STATIC +
    `\nDATOS ACTUALES:\n` +
    lines.join("\n") +
    `\n\nCPT Registro (C1/C2/C4): ${m.cptReg ? "€" + m.cptReg.toFixed(2) : "—"} · CPT Inicio pago (C5/C6 excl C3): ${m.cptIco ? "€" + m.cptIco.toFixed(2) : "—"}\nDías activo: ${daysElapsed}/20\nGasto total: €${m.spend.toFixed(2)}/€3000 (${Math.round(m.budgetPct)}%)\n\nResponde en español, conciso y accionable. Usa datos concretos del plan. Formato markdown con negritas y bullets cuando aporte claridad.`;

  if (memory) {
    output += "\n\n" + memoryToPromptBlock(memory, { lastN: 15 });
  }

  return output;
}
