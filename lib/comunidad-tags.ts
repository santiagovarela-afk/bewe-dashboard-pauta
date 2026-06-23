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

export interface Template {
  id: string;
  name: string;
  text: string;
  icon: string;
  useCount: number;
  createdAt: string;
}

const TEMPLATES_KEY = "bewe_comunidad_templates_v1";

/** Plantillas iniciales (se cargan si no hay nada en localStorage). */
export const DEFAULT_TEMPLATES: Omit<Template, "useCount" | "createdAt">[] = [
  {
    id: "saludo",
    name: "Saludo inicial",
    icon: "👋",
    text: "¡Hola {{nombre}}! Gracias por escribirnos. Soy del equipo de Bewe y estaré encantado de ayudarte. ¿En qué te puedo apoyar?",
  },
  {
    id: "precios",
    name: "Info de precios",
    icon: "💰",
    text: "¡Buenísimo que preguntes! Los planes de Bewe arrancan desde €19/mes con todo incluido (agenda + CRM + automatizaciones). ¿Quieres que te agende una demo de 15 min con un asesor para mostrarte cómo se adapta a tu negocio?",
  },
  {
    id: "demo",
    name: "Agendar demo",
    icon: "📅",
    text: "Perfecto, te muestro cómo funciona en una demo de 15 minutos sin compromiso. Reserva el horario que mejor te quede aquí: https://bewe.ai/demo · ¿O prefieres que un asesor te llame? Pásame tu WhatsApp.",
  },
  {
    id: "info-producto",
    name: "Qué es Bewe",
    icon: "ℹ️",
    text: "Bewe es el sistema operativo para tu negocio: agenda inteligente, CRM con IA, automatización de mensajes, control de inventario y métricas — todo en una sola plataforma. Está diseñado para PYMEs que quieren crecer sin contratar más personal. ¿Te muestro un demo rápido?",
  },
  {
    id: "trial",
    name: "Prueba gratis",
    icon: "🎁",
    text: "Genial, tenemos 14 días gratis sin tarjeta de crédito para que pruebes Bewe con tu negocio real. Empezar acá toma 2 minutos: https://app.bewe.ai/onboarding · ¿Cuento contigo?",
  },
  {
    id: "agradecimiento",
    name: "Agradecer comentario",
    icon: "🙏",
    text: "¡Muchas gracias {{nombre}}! Nos motiva mucho leer esto. Si en algún momento quieres conocer cómo Bewe puede impulsar tu negocio, escríbenos por aquí o reserva una demo en bewe.ai.",
  },
  {
    id: "soporte",
    name: "Derivar a soporte",
    icon: "🛠️",
    text: "Para resolver esto lo más rápido te paso con nuestro equipo de soporte. Escríbenos a soporte@bewe.ai o chatea directo desde app.bewe.ai (icono burbuja). Te responderán en menos de 1 hora hábil.",
  },
  {
    id: "descartar",
    name: "Marcar descarte",
    icon: "🚫",
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
