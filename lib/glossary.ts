/**
 * Glossary · términos técnicos de pauta y performance.
 * Usado por `ExplainedMetric` para mostrar tooltips contextuales.
 */
export interface GlossaryTerm {
  term: string;
  short: string;
  long?: string;
  example?: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  cpt: {
    term: "CPT",
    short: "Costo Por Trial (genérico · evita usarlo solo · prefiere CPL o CPTrial)",
    long:
      "Término ambiguo · puede significar Costo Por Registro o Costo Por Trial real. En Bewe Pauta OS preferimos CPL (registro) y CPTrial (activación real en app).",
  },
  cpl: {
    term: "CPL",
    short: "Cost Per Lead · costo por registro completo (CompleteRegistration)",
    long:
      "El KPI principal de pauta paga Bewe. Spend ÷ CompleteRegistration. Lo que medimos día a día. Target ≤ €2.20, crítico > €5.50.",
    example: "C1 gastó €293 y tuvo 44 CR → CPL €6.66 → 🚨 crítico",
  },
  cpic: {
    term: "CPIC",
    short: "Cost Per Initiate Checkout · costo del click en 'Probar gratis'",
    long:
      "Spend ÷ InitiateCheckout. Históricamente bajo (clicks baratos · €0.30-€0.50) pero NO representa intención real. Demostrado mayo 2026: campañas optimizadas a IC convierten <1% a signup.",
    example: "C5 gastó €172 y tuvo 372 IC → CPIC €0.46 (engañoso · solo 4 signups reales)",
  },
  cptrial: {
    term: "CPTrial",
    short: "Cost Per Trial · costo de cada usuario que ACTIVA un trial real en la app",
    long:
      "El KPI definitivo de calidad. Spend ÷ trials activados. Más fiable que CPL porque mide el evento de valor real (no solo registro). Requiere integración con PostHog/Mixpanel. Target Bewe: ≤ €8.20 para junio.",
    example: "C4 gastó €218 y tuvo 38 trials → CPTrial €14.41",
  },
  cpr: {
    term: "CPR",
    short: "Cost Per Result · costo por evento objetivo del adset",
    long:
      "Genérico · depende de qué optimiza el adset. Si optimiza CR → CPR = CPL. Si optimiza IC → CPR = CPIC.",
  },
  cr: {
    term: "CR",
    short: "CompleteRegistration · registros completos en la web",
    long: "Evento de conversión: alguien creó cuenta en bewe.ai y confirmó su email.",
  },
  ic: {
    term: "IC",
    short: "InitiateCheckout · clic en 'Probar gratis' → onboarding",
    long: "Evento upstream del CR. Una persona inició el flujo pero no terminó registro.",
  },
  abo: {
    term: "ABO",
    short: "Ad Set Budget Optimization",
    long:
      "Modo de Meta donde el presupuesto se asigna a NIVEL de adset (no campaña). Permite control fino pero requiere más manos. Regla Julián: reasignación ≤20% sin aprobación.",
  },
  cbo: {
    term: "CBO",
    short: "Campaign Budget Optimization",
    long: "Modo donde Meta reparte el presupuesto automáticamente entre adsets. Más automático, menos control.",
  },
  ctr: {
    term: "CTR",
    short: "Click-Through Rate",
    long: "Porcentaje de impresiones que terminan en click. Objetivo 1.5%–2.5% en pauta de adquisición.",
    example: "100 impresiones · 2 clicks → CTR 2%",
  },
  cpm: {
    term: "CPM",
    short: "Costo Por Mil impresiones",
    long: "Cuánto cuesta llegar a 1.000 personas. Objetivo ≤ €9 en LATAM.",
  },
  roas: {
    term: "ROAS",
    short: "Return On Ad Spend",
    long: "Ingreso generado por cada euro gastado. ROAS 3x = €3 ingreso por cada €1 invertido. 3x es mínimo sano.",
    example: "Spend €1.000 · revenue €3.500 → ROAS 3.5x",
  },
  cac: {
    term: "CAC",
    short: "Customer Acquisition Cost",
    long: "Costo de adquirir un cliente activado. Similar a CPT pero a nivel de cliente real (no solo registro).",
  },
  ltv: {
    term: "LTV",
    short: "Lifetime Value",
    long: "Valor total que un cliente genera durante toda su relación con Bewe. LTV/CAC ≥ 3x es la regla.",
  },
  cvr: {
    term: "CVR",
    short: "Conversion Rate",
    long: "% de personas que avanzan al siguiente paso del funnel. Ej: clicks → trials, trials → activated.",
  },
  pacing: {
    term: "Pacing",
    short: "Ritmo de gasto",
    long:
      "% del budget esperado que se ha consumido al día X. 100% = on track. >115% = sobre-gastando. <70% en día 3+ = sub-gastando.",
  },
  "plan-b": {
    term: "Plan B",
    short: "Switch de evento de conversión",
    long:
      "Regla Julián: si al día 7 (19 mayo) una campaña tiene <20 CompleteRegistration → cambiar el evento objetivo a InitiateCheckout (más permisivo · captura más volumen). Se ejecuta automáticamente cuando aplica.",
  },
  capi: {
    term: "CAPI",
    short: "Conversions API · server-side tracking",
    long: "Envío de eventos desde el servidor de Bewe (no del navegador) a Meta. Más fiable que el pixel. Activado 15 may.",
  },
  pixel: {
    term: "Pixel",
    short: "Meta Pixel · client-side tracking",
    long: "Script de Meta en la web que dispara eventos desde el navegador. Sujeto a ad-blockers y errores de implementación.",
    example: "C3 tiene anomalía: pixel dispara IC en page load · NO al click del CTA.",
  },
  bid_cap: {
    term: "Bid Cap",
    short: "Tope máximo de puja por conversión",
    long: "Le dice a Meta 'no pagues más de €X por una conversión'. Se usa para forzar eficiencia.",
  },
  frecuencia: {
    term: "Frecuencia",
    short: "Veces promedio que cada persona vio el anuncio",
    long: "Frec > 2 sostenida indica saturación · refrescar creativos.",
  },
};

export function lookup(key: string): GlossaryTerm | null {
  return GLOSSARY[key.toLowerCase()] ?? null;
}
