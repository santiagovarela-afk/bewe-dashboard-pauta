import type { AiMemoryFile, Campaign } from "./types";
import { computeMetrics } from "./selectors";
import { memoryToPromptBlock, PERSONA_RULES, personaName, type AiPersonaKind } from "./ai-memory";
import { PLAN } from "./config";

interface PlanContextOptions {
  persona?: AiPersonaKind;
  userName?: string;
}

/**
 * PLAN JUNIO 2026 · validado contra mayo real (12-26 may).
 * Bloque de conocimiento para que el agente responda correcto cuando
 * pregunten por junio · NO inventa cifras. Todas las cifras vienen del
 * plan firmado con Santiago.
 */
const JUNE_PLAN_FACTS = `PLAN DE PAUTA · JUNIO 2026 (propuesta validada vs mayo real)
────────────────────────────────────────────────────────
Si te preguntan por el plan de junio, usa EXCLUSIVAMENTE estos datos. NO inventes cifras.

PERÍODO: 1 al 30 de junio (30 días).
BUDGET: €3.100 techo base + €400 contingencia (autoriza Julián) = €3.500 máximo absoluto.
LEAD = CompleteRegistration (registro completo). NO contamos Initiate Checkout como lead.
CPL REAL DE MAYO (punto de partida): €7.66 blend en belleza.

3 ESCENARIOS (se diferencian por cuánto baja el CPL):
- CONSERVADOR "500 sí o sí": budget €3.100 · CPL €6.20 · 500 leads · requiere -19% CPL (optimización básica). Se logra apagando lo caro a tiempo y escalando solo audiencias Lookalike (las baratas).
- BASE: budget €3.300 · CPL €5.79 · 570 leads · requiere -24% CPL. Se logra con lo anterior + videos nuevos bajan el CPL + adset de interés amplio rinde.
- AGRESIVO: budget €3.500 · CPL €5.25 · 667 leads · requiere -31% CPL. Se logra si Clientes Potenciales gana el A/B + se activa la contingencia.

PLAN SEMANAL (front-load → taper):
- Semana 1 (1-7 jun) ARRANQUE: 15-22 leads/día · CPL ~€7 · €115/día · ~126 leads. No escalar aún, dejar aprender.
- Semana 2 (8-14) PUSH: 28-30 leads/día · CPL ~€5.50 · €150/día · apagar perdedores, escalar ganadores.
- Semana 3 (15-21) PICO: 30-32 leads/día · CPL ~€5 · €150/día · máximo volumen. Acumulado ~546.
- Semana 4 (22-30) TAPER: 10-15 leads/día · CPL ~€4.50 · €55/día · bajar gasto, calidad. Cierre ~640.

6 CAMPAÑAS (€100/día base):
- J1 MX Belleza · objetivo Ventas · €26/día · meta CPL €4-5 · QUEDA ACTIVA
- J2 LATAM Belleza · objetivo Ventas · €22/día · meta CPL €3.5-5 · QUEDA ACTIVA
- J3 Belleza Clientes Potenciales · objetivo Clientes Potenciales · €20/día · meta CPL €3 · NUEVA (la prueba A/B)
- J4 Servicios · objetivo Clientes Potenciales · €14/día · meta CPL €4 · QUEDA ACTIVA
- J5 Retargeting · objetivo Ventas · €12/día · QUEDA pero se fusionan los 2 conjuntos en 1
- J6 Tools + Academy · objetivo Tráfico · €6/día · NUEVA (atracción)

QUÉ SE PRENDE/QUEDA/APAGA:
- Quedan activas (sin reiniciar aprendizaje): MX Belleza, LATAM Belleza, Servicios.
- Se prenden nuevas el lunes: Belleza Clientes Potenciales, Tools+Academy.
- Se ajusta: Retargeting (fusión de conjuntos).
- Quedan apagadas: MX Comercio (CPL €25), LATAM Comercio, LATAM Servicios (saturadas).

REPARTO: Belleza 75-80% · Servicios 8% · Retargeting + Tools 12%.

LA PRUEBA DEL MES (A/B): Ventas vs Clientes Potenciales. Bewe siempre usó Clientes Potenciales; en mayo se probó Ventas en belleza (CPL caro €7-8). Servicios en Clientes Potenciales dio €4.32. Junio valida cuál trae mejor calidad al menor costo. Lectura día 7.

APRENDIZAJE CLAVE: las audiencias Lookalike son las más baratas (€4-7). Los intereses más caros (€8-9). Mejores anuncios mayo: linda €3.88, paraguas LATAM €5.49, mkt LATAM €7.56 (volumen). Falta video (mayo fue casi todo imágenes).

REGLAS DE ORO: cada conjunto ≥€15-20/día para salir de aprendizaje · no cambiar budget >20-25%/día · matar CPL>€9 solo con ≥30 conversiones y tras día 5 · medir CR→Trial (calidad) no solo CPL barato.
`;

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
    JUNE_PLAN_FACTS +
    `\n\n` +
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
