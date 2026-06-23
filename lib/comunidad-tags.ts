/**
 * Comunidad · etiquetas funnel + plantillas + estados
 *
 * Persistencia simple en localStorage (v1). Cuando el módulo escale, podemos
 * mover a backend con BD compartida — el shape de las funciones se mantiene
 * y solo se cambia la implementación interna.
 */

// ─── ETIQUETAS FUNNEL ──────────────────────────────────────────────────────

export type FunnelTag =
  | "nuevo"
  | "interesado"
  | "en-conversacion"
  | "caliente"
  | "pasado-comercial"
  | "cliente"
  | "descartado";

export interface FunnelTagDef {
  id: FunnelTag;
  label: string;
  icon: string; // emoji
  color: string; // tailwind text color
  bg: string; // tailwind bg color
  description: string;
}

export const FUNNEL_TAGS: FunnelTagDef[] = [
  {
    id: "nuevo",
    label: "Nuevo",
    icon: "🆕",
    color: "text-slate-300",
    bg: "bg-slate-500/15 border-slate-500/40",
    description: "Sin clasificar todavía",
  },
  {
    id: "interesado",
    label: "Interesado",
    icon: "👋",
    color: "text-blue-300",
    bg: "bg-blue-500/15 border-blue-500/40",
    description: "Mostró interés inicial",
  },
  {
    id: "en-conversacion",
    label: "En conversación",
    icon: "💬",
    color: "text-violet-300",
    bg: "bg-violet-500/15 border-violet-500/40",
    description: "Intercambio activo",
  },
  {
    id: "caliente",
    label: "Caliente",
    icon: "🔥",
    color: "text-orange-300",
    bg: "bg-orange-500/15 border-orange-500/40",
    description: "Listo para reservar o comprar",
  },
  {
    id: "pasado-comercial",
    label: "Pasado a comercial",
    icon: "📞",
    color: "text-amber-300",
    bg: "bg-amber-500/15 border-amber-500/40",
    description: "Escalado al CRM/equipo de ventas",
  },
  {
    id: "cliente",
    label: "Cliente",
    icon: "✅",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15 border-emerald-500/40",
    description: "Cerró conversión",
  },
  {
    id: "descartado",
    label: "Descartado",
    icon: "🚫",
    color: "text-rose-300",
    bg: "bg-rose-500/15 border-rose-500/40",
    description: "Spam o off-topic",
  },
];

export function getTagDef(id: FunnelTag): FunnelTagDef {
  return FUNNEL_TAGS.find((t) => t.id === id) ?? FUNNEL_TAGS[0];
}

const TAGS_KEY = "bewe_comunidad_tags_v1";
const STATUS_KEY = "bewe_comunidad_status_v1";

interface TagStore {
  [itemId: string]: FunnelTag;
}

interface StatusStore {
  [itemId: string]: "nuevo" | "leido" | "respondido";
}

export function loadTags(): TagStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TAGS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveTag(itemId: string, tag: FunnelTag) {
  if (typeof window === "undefined") return;
  const store = loadTags();
  store[itemId] = tag;
  localStorage.setItem(TAGS_KEY, JSON.stringify(store));
}

export function loadStatuses(): StatusStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveStatus(itemId: string, status: "nuevo" | "leido" | "respondido") {
  if (typeof window === "undefined") return;
  const store = loadStatuses();
  store[itemId] = status;
  localStorage.setItem(STATUS_KEY, JSON.stringify(store));
}

// ─── PLANTILLAS ────────────────────────────────────────────────────────────

export type Industry = "belleza" | "comercio" | "servicios" | "tools" | "general";
export type Intent = "demo" | "trial" | "precios" | "info" | "soporte" | "agradecimiento" | "descartar";

export interface Template {
  id: string;
  name: string;
  text: string;
  icon: string;
  industry: Industry;
  intent: Intent;
  /** URL base destino (sin UTMs). Si está vacía no se genera link. */
  urlBase?: string;
  useCount: number;
  createdAt: string;
}

const TEMPLATES_KEY = "bewe_comunidad_templates_v2";

/** Campaña actual del mes para UTMs (sincronizar mensualmente). */
export const CURRENT_UTM_CAMPAIGN = "junio_redes_2026";

/**
 * Construye URL con UTMs estandarizadas según el plan de junio · redes.
 * - utm_source: plataforma (instagram | facebook | messenger)
 * - utm_medium: "comunidad" (todas las respuestas desde este módulo)
 * - utm_campaign: junio_redes_<industria>
 * - utm_content: <intent del template>
 */
export function buildUTMUrl(
  urlBase: string,
  opts: { platform: "ig" | "fb" | "messenger"; industry: Industry; intent: Intent },
): string {
  if (!urlBase) return "";
  const source =
    opts.platform === "ig"
      ? "instagram"
      : opts.platform === "fb"
        ? "facebook"
        : "messenger";
  const campaign = `${CURRENT_UTM_CAMPAIGN.replace(/_\d{4}$/, "")}_${opts.industry}_2026`;
  try {
    const u = new URL(urlBase);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "comunidad");
    u.searchParams.set("utm_campaign", campaign);
    u.searchParams.set("utm_content", opts.intent);
    return u.toString();
  } catch {
    // urlBase no válida; devolver tal cual
    return urlBase;
  }
}

/** Plantillas iniciales (se cargan si no hay nada en localStorage). */
export const DEFAULT_TEMPLATES: Omit<Template, "useCount" | "createdAt">[] = [
  {
    id: "saludo",
    name: "Saludo inicial",
    icon: "👋",
    industry: "general",
    intent: "info",
    text: "¡Hola {{nombre}}! Gracias por escribirnos. Soy del equipo de Bewe y estaré encantado de ayudarte. ¿En qué te puedo apoyar?",
  },
  {
    id: "precios-belleza",
    name: "Precios · Belleza",
    icon: "💰",
    industry: "belleza",
    intent: "precios",
    urlBase: "https://bewe.ai/belleza/precios",
    text: "¡Buenísimo que preguntes! Para salones de belleza, los planes de Bewe arrancan desde €19/mes con agenda + CRM + automatizaciones por WhatsApp. Mira los detalles aquí: {{link}} · ¿Te agendo una demo de 15 min?",
  },
  {
    id: "precios-comercio",
    name: "Precios · Comercio",
    icon: "💰",
    industry: "comercio",
    intent: "precios",
    urlBase: "https://bewe.ai/comercio/precios",
    text: "Para retail/comercio, los planes arrancan desde €19/mes con inventario + CRM + pagos. Mira los detalles aquí: {{link}} · ¿Te agendo una demo personalizada?",
  },
  {
    id: "precios-servicios",
    name: "Precios · Servicios",
    icon: "💰",
    industry: "servicios",
    intent: "precios",
    urlBase: "https://bewe.ai/servicios/precios",
    text: "Para servicios, los planes desde €19/mes con agenda inteligente + recordatorios + facturación. Detalles: {{link}} · ¿Demo de 15 min?",
  },
  {
    id: "demo-general",
    name: "Agendar demo",
    icon: "📅",
    industry: "general",
    intent: "demo",
    urlBase: "https://bewe.ai/demo",
    text: "Perfecto, te muestro cómo funciona en 15 min sin compromiso. Reserva el horario aquí: {{link}}",
  },
  {
    id: "trial-general",
    name: "Prueba gratis 14d",
    icon: "🎁",
    industry: "general",
    intent: "trial",
    urlBase: "https://app.bewe.ai/onboarding",
    text: "Tenemos 14 días gratis sin tarjeta de crédito para que pruebes Bewe con tu negocio real. Empieza acá en 2 minutos: {{link}} · ¿Cuento contigo?",
  },
  {
    id: "info-belleza",
    name: "Qué es Bewe · Belleza",
    icon: "ℹ️",
    industry: "belleza",
    intent: "info",
    urlBase: "https://bewe.ai/belleza",
    text: "Bewe es el sistema todo-en-uno para tu salón: agenda online, CRM con IA, WhatsApp automatizado, pagos y stock. Diseñado para que ahorres horas y atiendas más clientes. Conoce más: {{link}}",
  },
  {
    id: "info-comercio",
    name: "Qué es Bewe · Comercio",
    icon: "ℹ️",
    industry: "comercio",
    intent: "info",
    urlBase: "https://bewe.ai/comercio",
    text: "Bewe es el sistema operativo de tu tienda: inventario inteligente, ventas multicanal, CRM y pagos integrados. Crece sin contratar más personal. Conoce más: {{link}}",
  },
  {
    id: "tool-calculadora",
    name: "Tool · Calculadora ROI",
    icon: "🧮",
    industry: "tools",
    intent: "trial",
    urlBase: "https://bewe.ai/tools/calculadora-roi",
    text: "Te puede interesar nuestra calculadora gratis de ROI: en 2 min te dice cuánto puedes ahorrar/ganar implementando Bewe. Pruébala: {{link}}",
  },
  {
    id: "tool-auditoria",
    name: "Tool · Auditoría IG",
    icon: "🔍",
    industry: "tools",
    intent: "trial",
    urlBase: "https://bewe.ai/tools/auditoria-instagram",
    text: "Tenemos una auditoría gratis de tu Instagram con recomendaciones específicas. Sirve para ver oportunidades de crecimiento sin costo: {{link}}",
  },
  {
    id: "tool-comparador",
    name: "Tool · Comparador",
    icon: "📊",
    industry: "tools",
    intent: "trial",
    urlBase: "https://bewe.ai/tools/comparador-local",
    text: "Mira cómo está posicionado tu negocio vs la competencia local con nuestro comparador gratis: {{link}}",
  },
  {
    id: "agradecimiento",
    name: "Agradecer comentario",
    icon: "🙏",
    industry: "general",
    intent: "agradecimiento",
    text: "¡Muchas gracias {{nombre}}! Nos motiva mucho leer esto. Si en algún momento quieres conocer cómo Bewe puede impulsar tu negocio, escríbenos por aquí.",
  },
  {
    id: "soporte",
    name: "Derivar a soporte",
    icon: "🛠️",
    industry: "general",
    intent: "soporte",
    urlBase: "https://app.bewe.ai",
    text: "Para resolver esto lo más rápido te paso con soporte. Escribe a soporte@bewe.ai o chatea directo desde {{link}} (icono burbuja). Responden en <1h hábil.",
  },
  {
    id: "descartar",
    name: "Marcar descarte",
    icon: "🚫",
    industry: "general",
    intent: "descartar",
    text: "[Nota interna · spam u off-topic · no responder]",
  },
];

export function loadTemplates(): Template[] {
  if (typeof window === "undefined") {
    return DEFAULT_TEMPLATES.map((t) => ({
      ...t,
      useCount: 0,
      createdAt: "2026-01-01T00:00:00",
    }));
  }
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (!stored) {
      const fresh = DEFAULT_TEMPLATES.map((t) => ({
        ...t,
        useCount: 0,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveTemplates(templates: Template[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function incrementTemplateUse(templateId: string) {
  const templates = loadTemplates();
  const t = templates.find((x) => x.id === templateId);
  if (t) {
    t.useCount += 1;
    saveTemplates(templates);
  }
}

/** Sustituye {{nombre}} y variables comunes en el texto de plantilla. */
export function applyTemplateVars(
  text: string,
  vars: { nombre?: string; producto?: string; negocio?: string } = {},
): string {
  return text
    .replace(/\{\{nombre\}\}/g, vars.nombre || "")
    .replace(/\{\{producto\}\}/g, vars.producto || "Bewe")
    .replace(/\{\{negocio\}\}/g, vars.negocio || "tu negocio")
    .replace(/\s+/g, " ")
    .trim();
}
