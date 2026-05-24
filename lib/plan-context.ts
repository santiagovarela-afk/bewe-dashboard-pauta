import type { AiMemoryFile, Campaign } from "./types";
import { computeMetrics } from "./selectors";
import { memoryToPromptBlock, PERSONA_RULES, personaName, type AiPersonaKind } from "./ai-memory";
import { PLAN } from "./config";

interface PlanContextOptions {
  persona?: AiPersonaKind;
  userName?: string;
}

/**
 * Plantilla NEUTRA del system prompt. Las cifras y reglas específicas
 * del mes vienen de:
 *   - env var `AI_MEMORY_RULES_JSON`
 *   - entries en `.data/ai-memory.json` (server-only, gitignored)
 *   - PLAN cargado desde env vars NEXT_PUBLIC_PLAN_*
 *
 * Aquí solo va texto genérico que aplica a cualquier período.
 */

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

  const planHeader = PLAN.budget > 0
    ? `PLAN VIGENTE (${PLAN.monthLabel})\n────────────────────────\n` +
      `Período: ${PLAN.launchISO.slice(0, 10)} → ${PLAN.endISO.slice(0, 10)} (${PLAN.totalDays} días).\n` +
      `Budget: €${PLAN.budget} + €${PLAN.contingency} contingencia.\n` +
      `Thresholds CPT: agresivo €${PLAN.cpt.aggressive} · target €${PLAN.cpt.target} · warn €${PLAN.cpt.warn} · crítico €${PLAN.cpt.critical}.\n\n`
    : "";

  let output =
    personaHeader +
    planHeader +
    `DATOS EN VIVO:\n` +
    (lines.length > 0 ? lines.join("\n") : "(sin campañas cargadas todavía)") +
    `\n\nCPT Registro: ${m.cptReg ? "€" + m.cptReg.toFixed(2) : "—"} · CPT Inicio pago (excl anomalías): ${m.cptIco ? "€" + m.cptIco.toFixed(2) : "—"}\n` +
    `Días activo: ${daysElapsed}${PLAN.totalDays > 0 ? `/${PLAN.totalDays}` : ""}\n` +
    `Gasto total: €${m.spend.toFixed(2)}${PLAN.budget > 0 ? `/€${PLAN.budget} (${Math.round(m.budgetPct)}%)` : ""}\n\n` +
    `Responde en español, conciso y accionable. Usa datos concretos del plan vigente y los datos en vivo. Respeta SIEMPRE las reglas del Growth Lead que vengan en MEMORIA DEL AGENTE. Formato markdown con negritas y bullets cuando aporte claridad.`;

  if (memory) {
    output += "\n\n" + memoryToPromptBlock(memory, { lastN: 15 });
  }

  return output;
}
