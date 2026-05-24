/**
 * Bewe Pauta · Configuración del plan mayo 2026
 * (datos de plan + IDs de cuenta + targets — NO secretos)
 */
export const PLAN = {
  monthLabel: "Mayo 2026",
  launchISO: "2026-05-12T00:00:00",
  endISO: "2026-05-31T23:59:59",
  day7ISO: "2026-05-19T00:00:00",
  day14ISO: "2026-05-26T00:00:00",
  totalDays: 20,
  budget: 3000,
  contingency: 1000,
  cpt: {
    aggressive: 1.57,
    target: 2.2,
    warn: 3.0,
    critical: 5.5,
  },
  meta: {
    accountId: "act_929824683759001",
    accountIdNumeric: "929824683759001",
    pageId: "225426867908315",
    igAccountId: "17841404681419259",
    apiVersion: "v22.0",
  },
};

/** Mapeo lógico C1..C6 → campaign id Meta + evento de objetivo + geo + presupuesto.
 *
 *  ESTADO al 23-may (verificado por handoff Santi + Graph API):
 *   - Solo 6 campañas reales en Meta (C1-C6). IDs confirmados via API.
 *   - C1 escalada de €26 a €40 el 23-may (CBO a nivel campaña)
 *   - C4 ABO: solo A4.1 activo escalado €10 → €25
 *   - C3, C5, C6 PAUSADAS el 22-may por bajo rendimiento (IC traía clicks sin signups)
 *   - C7 RETARGETING · planeada · NO creada todavía (bloqueada por Custom Audiences)
 *   - C9 LATAM_SERVICIOS_CR · planeada · NO creada
 *   - C8 LATAM_TOOLS · pospuesta a junio
 */
export const CAMPAIGN_MAP: Record<
  string,
  {
    code: string;
    cid: string;
    name: string;
    event: "CompleteRegistration" | "InitiateCheckout";
    geo: string;
    vertical: "Belleza" | "Comercio" | "Servicios";
    daily: number;
    total: number;
    replacedBy?: string;
  }
> = {
  "52551556599886": {
    code: "C1",
    cid: "52551556599886",
    name: "MX_BELLEZA_WEB_MAY26",
    event: "CompleteRegistration",
    geo: "MX",
    vertical: "Belleza",
    daily: 40, // escalado 23-may de €26 a €40
    total: 520,
  },
  "52551556733086": {
    code: "C2",
    cid: "52551556733086",
    name: "MX_COMERCIO_WEB_MAY26",
    event: "CompleteRegistration",
    geo: "MX",
    vertical: "Comercio",
    daily: 21,
    total: 420,
  },
  "52551556895286": {
    code: "C3",
    cid: "52551556895286",
    name: "MX_SERVICIOS_WEB_MAY26",
    event: "InitiateCheckout",
    geo: "MX",
    vertical: "Servicios",
    daily: 16,
    total: 320,
    replacedBy: "C3.NEW",
  },
  "52551557046086": {
    code: "C4",
    cid: "52551557046086",
    name: "CR_PA_CL_CO_BELLEZA_WEB_MAY26",
    event: "CompleteRegistration",
    geo: "CR+PA+CL+CO",
    vertical: "Belleza",
    daily: 25, // ABO · solo A4.1 activo escalado 23-may de €10 a €25
    total: 360,
  },
  "52551557199886": {
    code: "C5",
    cid: "52551557199886",
    name: "CR_PA_CL_CO_COMERCIO_WEB_MAY26",
    event: "InitiateCheckout",
    geo: "CR+PA+CL+CO",
    vertical: "Comercio",
    daily: 14,
    total: 280,
  },
  "52551557419286": {
    code: "C6",
    cid: "52551557419286",
    name: "CR_PA_CL_CO_SERVICIOS_WEB_MAY26",
    event: "InitiateCheckout",
    geo: "CR+PA+CL+CO",
    vertical: "Servicios",
    daily: 10,
    total: 200,
  },
};

export const CAMPAIGN_CODES = ["C1", "C2", "C3", "C4", "C5", "C6"] as const;
export type CampaignCode = (typeof CAMPAIGN_CODES)[number];

export function getByCode(code: CampaignCode) {
  return Object.values(CAMPAIGN_MAP).find((c) => c.code === code);
}

export const ROLE_TABS: Record<string, string[]> = {
  admin: [
    "dashboard",
    "campanas",
    "estrategia",
    "paid",
    "anuncios",
    "organico",
    "parrilla",
    "seo",
    "aeo",
    "performance",
    "open-bui",
    "informe",
    "config",
  ],
  lead: [
    "dashboard",
    "campanas",
    "estrategia",
    "paid",
    "anuncios",
    "organico",
    "parrilla",
    "seo",
    "aeo",
    "performance",
    "open-bui",
    "informe",
  ],
  content: [
    "dashboard",
    "anuncios",
    "organico",
    "parrilla",
    "open-bui",
  ],
};

export const USERS: Record<
  string,
  { pass: string; role: keyof typeof ROLE_TABS; name: string }
> = {
  "santiago.varela@bewe.io": {
    pass: "BeweDash!26",
    role: "admin",
    name: "Santiago",
  },
  "julian.varela@bewe.io": { pass: "BeweDash!26", role: "admin", name: "Julián" },
  "wendy.pamplona@bewe.io": { pass: "BeweDash!26", role: "admin", name: "Wendy" },
  "maria.chaparro@bewe.io": { pass: "BeweLead!26", role: "lead", name: "María" },
  "paula.gonzalez@bewe.io": { pass: "BeweRedes26", role: "content", name: "Paula" },
  "hernan.guzman@bewe.io": { pass: "BeweRedes26", role: "content", name: "Hernán" },
};

/**
 * Estructura del nav (sidebar). Los items con `group` se agrupan visualmente.
 * Groups: pauta · contenido · analítica · admin
 */
export const TABS = [
  { id: "dashboard",   label: "Dashboard",   icon: "LayoutDashboard", group: "pauta" },
  { id: "campanas",    label: "Campañas",    icon: "Megaphone",        group: "pauta" },
  { id: "estrategia",  label: "Estrategia",  icon: "Target", badge: true, group: "pauta" },
  { id: "paid",        label: "Paid Media",  icon: "TrendingUp",       group: "pauta" },
  { id: "anuncios",    label: "Anuncios",    icon: "Image",            group: "pauta" },
  { id: "organico",    label: "Orgánico",    icon: "Sparkles",         group: "contenido" },
  { id: "parrilla",    label: "Parrilla",    icon: "CalendarDays",     group: "contenido" },
  { id: "open-bui",    label: "Open Design",  icon: "Palette",          group: "contenido" },
  { id: "performance", label: "Performance", icon: "Gauge",            group: "analítica" },
  { id: "seo",         label: "SEO",         icon: "Search",           group: "analítica" },
  { id: "aeo",         label: "AEO · LLMs",  icon: "Brain",            group: "analítica" },
  { id: "informe",     label: "Informe",     icon: "FileText",         group: "analítica" },
  { id: "config",      label: "Config",      icon: "Settings2",        group: "admin" },
] as const;

export const TAB_GROUPS: Array<{ id: string; label: string }> = [
  { id: "pauta",      label: "Pauta · Inversión" },
  { id: "contenido",  label: "Contenido · Creativo" },
  { id: "analítica",  label: "Analítica" },
  { id: "admin",      label: "Configuración" },
];
