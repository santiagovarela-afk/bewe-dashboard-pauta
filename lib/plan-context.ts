import type { AiMemoryFile, Campaign } from "./types";
import { computeMetrics } from "./selectors";
import { memoryToPromptBlock, PERSONA_RULES, personaName, type AiPersonaKind } from "./ai-memory";

interface PlanContextOptions {
  persona?: AiPersonaKind;
  userName?: string;
}

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

/**
 * Construye el system prompt completo para Gemini.
 * Si `memory` está presente, se concatena el bloque de reglas + historial reciente.
 */
export function buildPlanContext(
  campaigns: Campaign[],
  daysElapsed: number,
  memory?: AiMemoryFile,
  opts: PlanContextOptions = {},
): string {
  const persona: AiPersonaKind = opts.persona ?? "mark";
  const userName = opts.userName?.trim() || "el equipo";
  const m = computeMetrics(campaigns);
  const lines = campaigns.map(
    (c) =>
      `${c.code} ${c.name}: status ${c.status}, gasto €${c.spend.toFixed(2)}, CompleteReg=${c.evCompleteReg}, InitCheckout=${c.evInitCheckout}, contactos=${c.evContact}, CPT ${c.cpt ? "€" + c.cpt.toFixed(2) : "—"}, CTR ${c.ctr.toFixed(2)}%, CPM €${c.cpm.toFixed(2)}${c.flag ? " [" + c.flag + "]" : ""}`,
  );

  const personaHeader =
    `IDENTIDAD\n─────────\n` +
    `Eres ${personaName(persona)}, copiloto de pauta para el equipo Bewe.\n` +
    `Tu interlocutor actual se llama ${userName}.\n` +
    PERSONA_RULES[persona].map((r) => `- ${r}`).join("\n") +
    `\n\n`;

  let output =
    personaHeader +
    STATIC +
    `\nDATOS ACTUALES:\n` +
    lines.join("\n") +
    `\n\nCPT Registro (C1/C2/C4): ${m.cptReg ? "€" + m.cptReg.toFixed(2) : "—"} · CPT Inicio pago (C5/C6 excl C3): ${m.cptIco ? "€" + m.cptIco.toFixed(2) : "—"}\nDías activo: ${daysElapsed}/20\nGasto total: €${m.spend.toFixed(2)}/€3000 (${Math.round(m.budgetPct)}%)\n\nResponde en español, conciso y accionable. Usa datos concretos del plan. Respeta SIEMPRE las reglas Julián, los datos en vivo, y formato markdown con negritas y bullets cuando aporte claridad.`;

  if (memory) {
    output += "\n\n" + memoryToPromptBlock(memory, { lastN: 15 });
  }

  return output;
}
