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
TRIAL = el 50% de los leads debe convertir a trial (regla operativa fija Bewe).
CPL REAL DE MAYO (punto de partida): €7.66 blend en belleza.

3 ESCENARIOS (cada uno reporta budget, CPL blend, leads, trials esperados y CPT):
- CONSERVADOR "Piso 500": budget €3.100 · CPL €6.20 · 500 leads · 250 trials · CPT €12.40 · requiere -19% CPL (optimización básica). Se logra apagando lo caro a tiempo y escalando solo audiencias Lookalike (las baratas).
- BASE: budget €3.100 · CPL €5.00 · 620 leads · 310 trials · CPT €10.00 · requiere -35% CPL. Se logra concentrando 75-80% en belleza + refresh creativo anti-fatiga + servicios escala la última semana de mayo.
- AGRESIVO: budget €3.500 · CPL €4.50 · 778 leads · 389 trials · CPT €9.00 · requiere -41% CPL. Se logra si Belleza Clientes Potenciales rinde + 6 videos perro-mucho funcionan + se activa contingencia €400.

PLAN SEMANAL POR ESCENARIO (front-load → taper · cada escenario suma EXACTO al budget):

CONSERVADOR (€3.100 · 505 leads · 250 trials · blend €6.20 · CPT €12.40):
- Sem 1 (1-7) arranque: 15 lds/día · CPL €7.00 · 105 lds · 52 trials · €735 · CPT €14.10
- Sem 2 (8-14) push: 25 lds/día · CPL €6.20 · 175 lds · 87 trials · €1.085 · CPT €12.50
- Sem 3 (15-21) estabilizar: 21 lds/día · CPL €5.80 · 150 lds · 75 trials · €870 · CPT €11.60
- Sem 4 (22-30) taper: 8 lds/día · CPL €5.50 · 75 lds · 37 trials · €410 · CPT €11.10

BASE (€3.100 · 620 leads · 310 trials · blend €5.00 · CPT €10.00):
- Sem 1 arranque: 16 lds/día · CPL €6.50 · 110 lds · 55 trials · €715 · CPT €13.00
- Sem 2 push: 29 lds/día · CPL €5.00 · 200 lds · 100 trials · €1.000 · CPT €10.00
- Sem 3 estabilizar: 28 lds/día · CPL €4.50 · 195 lds · 97 trials · €880 · CPT €9.10
- Sem 4 taper: 13 lds/día · CPL €4.40 · 115 lds · 57 trials · €505 · CPT €8.85

AGRESIVO (€3.500 · 778 leads · 389 trials · blend €4.50 · CPT €9.00):
- Sem 1 arranque: 20 lds/día · CPL €5.50 · 140 lds · 70 trials · €770 · CPT €11.00
- Sem 2 push: 38 lds/día · CPL €4.50 · 265 lds · 132 trials · €1.190 · CPT €9.00
- Sem 3 estabilizar: 35 lds/día · CPL €4.20 · 245 lds · 122 trials · €1.030 · CPT €8.45
- Sem 4 taper: 14 lds/día · CPL €4.00 · 128 lds · 64 trials · €510 · CPT €7.95

6 CAMPAÑAS · €/día y €/mes varían por escenario (Conservador/Base/Agresivo):
- J1 MX Belleza · objetivo Ventas · €23/€22/€25 día · €690/€660/€750 mes · meta CPL €4-5 · ACTIVA · MOTOR BELLEZA
- J2 LATAM Belleza · objetivo Ventas · €21/€20/€23 día · €620/€600/€690 mes · meta CPL €3.5-5 · ACTIVA · MOTOR BELLEZA
- J3 Belleza Clientes Potenciales · objetivo Clientes Potenciales · €18/€20/€23 día · €540/€600/€690 mes · meta CPL €3 · NUEVA · MOTOR BELLEZA
- J4 Servicios · objetivo Clientes Potenciales · €13/€13/€15 día · €400/€400/€450 mes · meta CPL €4 · ACTIVA · APOYO
- J5 Remarketing LATAM · objetivo Ventas · €15/€15/€17 día · €450/€450/€510 mes · validar CPL · AJUSTA · APOYO
- J6 Tools + Academy · objetivo Tráfico · €13/€13/€14 día · €400/€390/€410 mes · tráfico · NUEVA · ATRACCIÓN

ESTRUCTURA DE ADSETS (regla nueva fija):
- MÍNIMO €9/día por adset · ningún conjunto puede quedar por debajo de ese piso.
- BELLEZA siempre con 2 LOK adsets por campaña:
  · LOK Ganadores (50% del budget): carga los creativos validados de mayo (mkt, paraguas, linda).
  · LOK Test Creativos (50%): adset paralelo con los videos perro-mucho + creativos nuevos. Misma audiencia LOK pero adset separado para no contaminar el de ganadores.
- J1, J2, J3 cada una con 2 LOK adsets (Ganadores + Test Creativos).
- J4 Servicios consolidado en 1 LOK ganador (CPL €3.98 · concentramos budget · el adset de Interés se apaga).
- J5 Remarketing: 1 conjunto fusionado de los 2 que había.
- J6 Tools+Academy: 1 conjunto Interés PYME amplio.
- Adsets eliminados (vs mayo): A1.2 Custom Engagers (CPL €9.16 caro), A1.4/A4.2 Interés amplio (no validados), A3.2 Interés Servicios (consolidado en LOK ganador).
- TOTAL: 9 adsets (antes 11) · todos ≥€9/día.

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
