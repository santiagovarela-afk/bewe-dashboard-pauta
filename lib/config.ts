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

/** Mapeo lógico C1..C7 → campaign id Meta + evento de objetivo + geo + presupuesto.
 *  Estado al 22-may: las campañas IC (C3, C5, C6) quedaron pausadas; C3 reemplazada por C3.NEW (CR),
 *  y C7 Retargeting activada según plan. C8 LATAM_TOOLS no se crea hasta junio.
 *  Los IDs de C3.NEW y C7 son placeholders — se reemplazan con IDs reales cuando el token Meta esté conectado.
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
    daily: 26,
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
    daily: 18,
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
  // C3.NEW · creada 22-may para reemplazar C3 (la IC con anomalía pixel) — ahora optimiza CompleteRegistration.
  // ID placeholder hasta que el token Meta esté conectado.
  "52551557600000": {
    code: "C3.NEW",
    cid: "52551557600000",
    name: "MX_SERVICIOS_CR_MAY26",
    event: "CompleteRegistration",
    geo: "MX",
    vertical: "Servicios",
    daily: 16,
    total: 144,
  },
  // C7 RETARGETING · activada por día 14 (según plan Julián). Mixed CR+IC. €90/día × 6 días.
  // ID placeholder hasta que el token Meta esté conectado.
  "52551557700000": {
    code: "C7",
    cid: "52551557700000",
    name: "RETARGETING_MAY26",
    event: "CompleteRegistration",
    geo: "CR+PA+CL+CO+MX",
    vertical: "Belleza",
    daily: 90,
    total: 540,
  },
};

export const CAMPAIGN_CODES = ["C1", "C2", "C3", "C3.NEW", "C4", "C5", "C6", "C7"] as const;
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
  { id: "anuncios",    label: "Anuncios",    icon: "Image",            group: "contenido" },
  { id: "organico",    label: "Orgánico",    icon: "Sparkles",         group: "contenido" },
  { id: "parrilla",    label: "Parrilla",    icon: "CalendarDays",     group: "contenido" },
  { id: "seo",         label: "SEO",          icon: "Search",           group: "contenido" },
  { id: "performance", label: "Performance", icon: "Gauge",            group: "analítica" },
  { id: "open-bui",    label: "Open BUI",    icon: "Palette",          group: "analítica" },
  { id: "informe",     label: "Informe",     icon: "FileText",         group: "analítica" },
  { id: "config",      label: "Config",      icon: "Settings2",        group: "admin" },
] as const;

export const TAB_GROUPS: Array<{ id: string; label: string }> = [
  { id: "pauta",      label: "Pauta · Inversión" },
  { id: "contenido",  label: "Contenido · Creativo" },
  { id: "analítica",  label: "Analítica" },
  { id: "admin",      label: "Configuración" },
];
