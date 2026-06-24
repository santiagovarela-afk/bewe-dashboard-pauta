/**
 * Comunidad · etiquetas funnel + plantillas + estados
 *
 * V3 (jun-2026): plantillas reescritas con URLs reales verificadas de bewe.ai:
 *  - /industries/{beauty|commerce|services|wellness|education}
 *  - /linda, /crm, /agenda, /sales-assistant, /marketing
 *  - /tools, /academy, /pricing, /agencias
 *
 * Sistema DOBLE para comentarios públicos:
 *  - publicText: respuesta CORTA sin link (Meta no muestra bien links públicos)
 *  - dmText: mensaje DM con link UTM completo
 *
 * UTMs contextuales (utm_medium varía):
 *  - comentario_publico_ig / comentario_publico_fb
 *  - dm_messenger / dm_instagram
 *  - mensaje_directo
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
  icon: string;
  color: string;
  bg: string;
  description: string;
}

export const FUNNEL_TAGS: FunnelTagDef[] = [
  { id: "nuevo", label: "Nuevo", icon: "🆕", color: "text-slate-300", bg: "bg-slate-500/15 border-slate-500/40", description: "Sin clasificar" },
  { id: "interesado", label: "Interesado", icon: "👋", color: "text-blue-300", bg: "bg-blue-500/15 border-blue-500/40", description: "Mostró interés inicial" },
  { id: "en-conversacion", label: "En conversación", icon: "💬", color: "text-violet-300", bg: "bg-violet-500/15 border-violet-500/40", description: "Intercambio activo" },
  { id: "caliente", label: "Caliente", icon: "🔥", color: "text-orange-300", bg: "bg-orange-500/15 border-orange-500/40", description: "Listo para reservar o comprar" },
  { id: "pasado-comercial", label: "Pasado a comercial", icon: "📞", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/40", description: "Escalado al CRM/equipo de ventas" },
  { id: "cliente", label: "Cliente", icon: "✅", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/40", description: "Cerró conversión" },
  { id: "descartado", label: "Descartado", icon: "🚫", color: "text-rose-300", bg: "bg-rose-500/15 border-rose-500/40", description: "Spam o off-topic" },
];

export function getTagDef(id: FunnelTag): FunnelTagDef {
  return FUNNEL_TAGS.find((t) => t.id === id) ?? FUNNEL_TAGS[0];
}

const TAGS_KEY = "bewe_comunidad_tags_v1";
const STATUS_KEY = "bewe_comunidad_status_v1";

export function loadTags(): Record<string, FunnelTag> {
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

export function loadStatuses(): Record<string, "nuevo" | "leido" | "respondido"> {
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

// ─── TIMESTAMP de respondido (para SLA) ────────────────────────────────────

const RESPONDED_AT_KEY = "bewe_comunidad_responded_at_v1";

export function saveRespondedAt(itemId: string) {
  if (typeof window === "undefined") return;
  try {
    const store = JSON.parse(localStorage.getItem(RESPONDED_AT_KEY) || "{}");
    store[itemId] = Date.now();
    localStorage.setItem(RESPONDED_AT_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function loadRespondedAt(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(RESPONDED_AT_KEY) || "{}");
  } catch {
    return {};
  }
}

// ─── PLANTILLAS ────────────────────────────────────────────────────────────

export type Industry = "belleza" | "comercio" | "servicios" | "wellness" | "educacion" | "tools" | "general";
export type Intent = "demo" | "trial" | "precios" | "info" | "soporte" | "agradecimiento" | "descartar" | "negativo";

/** Contexto donde se usa la plantilla — afecta utm_medium y comportamiento. */
export type ChannelContext =
  | "comentario_publico_ig"
  | "comentario_publico_fb"
  | "dm_messenger"
  | "dm_instagram"
  | "mensaje_directo";

export interface Template {
  id: string;
  name: string;
  icon: string;
  industry: Industry;
  intent: Intent;
  /** Respuesta CORTA sin link · para comentarios públicos (Meta no muestra bien links). */
  publicText?: string;
  /** Mensaje DM con link UTM completo · para conversaciones privadas. */
  dmText?: string;
  /** Texto único (fallback) si solo se usa en un contexto. */
  text: string;
  /** URL base destino (sin UTMs). El sistema agrega los UTMs según contexto. */
  urlBase?: string;
  useCount: number;
  createdAt: string;
  /** Notas internas sobre cuándo usarla. */
  notes?: string;
}

const TEMPLATES_KEY = "bewe_comunidad_templates_v3";

export const CURRENT_UTM_CAMPAIGN = "junio_redes_2026";

/**
 * Construye URL con UTMs estandarizadas. El utm_medium varía según el
 * contexto (comentario público vs DM) para que en PostHog/GA podamos
 * distinguir conversiones por canal.
 */
export function buildUTMUrl(
  urlBase: string,
  opts: { platform: "ig" | "fb" | "messenger"; industry: Industry; intent: Intent; context?: ChannelContext },
): string {
  if (!urlBase) return "";
  const source =
    opts.platform === "ig"
      ? "instagram"
      : opts.platform === "fb"
        ? "facebook"
        : "messenger";

  // utm_medium contextual
  let medium = "comunidad"; // default
  if (opts.context) {
    medium = opts.context;
  } else if (opts.platform === "messenger") {
    medium = "dm_messenger";
  }

  const campaign = `junio_redes_${opts.industry}_2026`;
  try {
    const u = new URL(urlBase);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", campaign);
    u.searchParams.set("utm_content", opts.intent);
    return u.toString();
  } catch {
    return urlBase;
  }
}

/** Plantillas DEFAULT — escritas con info real de bewe.ai (jun-2026). */
export const DEFAULT_TEMPLATES: Omit<Template, "useCount" | "createdAt">[] = [
  // ─── BELLEZA ─────────────────────────────────────────────────────────────
  {
    id: "belleza-info-publico",
    name: "Belleza · Info pública → te escribo al DM",
    icon: "💄",
    industry: "belleza",
    intent: "info",
    urlBase: "https://bewe.ai/industries/beauty",
    publicText: "¡Hola {{nombre}}! Gracias por escribirnos 💜 Te mando todo el detalle por DM en un momento.",
    dmText: "¡Hola {{nombre}}! Bewe es el sistema operativo para tu salón: agenda inteligente con IA, CRM, automatización de WhatsApp y reportes — todo en una sola plataforma. Mira cómo funciona acá: {{link}}",
    text: "¡Hola {{nombre}}! Gracias por escribirnos 💜 Te mando todo el detalle por DM en un momento.",
    notes: "Para comentarios públicos donde piden info de Bewe en una pieza de belleza.",
  },
  {
    id: "belleza-precios-publico",
    name: "Belleza · Precios → DM",
    icon: "💰",
    industry: "belleza",
    intent: "precios",
    urlBase: "https://bewe.ai/pricing",
    publicText: "Hola {{nombre}} 🌸 Te mando todos los planes por DM ahora mismo.",
    dmText: "¡Hola {{nombre}}! Los planes de Bewe para salones empiezan desde nuestro plan base. Mira las opciones completas acá: {{link}} · ¿Quieres que un asesor te muestre cómo se adaptaría a tu negocio?",
    text: "Hola {{nombre}} 🌸 Te mando todos los planes por DM ahora mismo.",
  },
  {
    id: "belleza-demo-publico",
    name: "Belleza · Demo → DM",
    icon: "📅",
    industry: "belleza",
    intent: "demo",
    urlBase: "https://bewe.ai/industries/beauty",
    publicText: "¡Hola {{nombre}}! Claro que sí, te paso info por DM 💌",
    dmText: "¡Hola {{nombre}}! Perfecto, te muestro cómo funciona Bewe para salones. Conoce más sobre la plataforma para belleza acá: {{link}} · ¿Cuándo te queda bien para una demo de 15 min con un asesor?",
    text: "¡Hola {{nombre}}! Claro que sí, te paso info por DM 💌",
  },
  // ─── COMERCIO ────────────────────────────────────────────────────────────
  {
    id: "comercio-info-publico",
    name: "Comercio · Info → DM",
    icon: "🛍️",
    industry: "comercio",
    intent: "info",
    urlBase: "https://bewe.ai/industries/commerce",
    publicText: "¡Hola {{nombre}}! Te escribo por DM con todo el detalle 🛍️",
    dmText: "Hola {{nombre}}! Bewe para comercios: inventario, CRM, ventas multicanal y automatización en un solo lugar. Mira cómo lo usan otros negocios como el tuyo: {{link}}",
    text: "¡Hola {{nombre}}! Te escribo por DM con todo el detalle 🛍️",
  },
  {
    id: "comercio-precios-publico",
    name: "Comercio · Precios → DM",
    icon: "💰",
    industry: "comercio",
    intent: "precios",
    urlBase: "https://bewe.ai/pricing",
    publicText: "Hola {{nombre}} 👋 Te mando los planes por DM 💌",
    dmText: "¡Hola {{nombre}}! Acá tienes los planes completos: {{link}} · Para comercios el plan más popular es el que incluye inventario + CRM + WhatsApp. ¿Quieres que un asesor te dé el contexto?",
    text: "Hola {{nombre}} 👋 Te mando los planes por DM 💌",
  },
  // ─── SERVICIOS ───────────────────────────────────────────────────────────
  {
    id: "servicios-info-publico",
    name: "Servicios · Info → DM",
    icon: "🔧",
    industry: "servicios",
    intent: "info",
    urlBase: "https://bewe.ai/industries/services",
    publicText: "¡Hola {{nombre}}! Te paso info detallada por DM ✉️",
    dmText: "¡Hola {{nombre}}! Bewe para empresas de servicios: agenda con recordatorios automáticos, CRM con histórico de clientes, facturación y reportes. Conoce todo acá: {{link}}",
    text: "¡Hola {{nombre}}! Te paso info detallada por DM ✉️",
  },
  // ─── WELLNESS (NUEVA · de bewe.ai/industries/wellness) ───────────────────
  {
    id: "wellness-info-publico",
    name: "Wellness · Info → DM",
    icon: "🌿",
    industry: "wellness",
    intent: "info",
    urlBase: "https://bewe.ai/industries/wellness",
    publicText: "¡Hola {{nombre}}! Te respondo en privado con todo 🌿",
    dmText: "¡Hola {{nombre}}! Bewe para centros de bienestar y salud: agenda con disponibilidad por profesional, fichas de pacientes con histórico, recordatorios automáticos y pagos. Detalles acá: {{link}}",
    text: "¡Hola {{nombre}}! Te respondo en privado con todo 🌿",
  },
  // ─── EDUCACIÓN / ACADEMY ────────────────────────────────────────────────
  {
    id: "academy-curso",
    name: "Academy · Pidió curso → DM",
    icon: "🎓",
    industry: "educacion",
    intent: "info",
    urlBase: "https://bewe.ai/academy",
    publicText: "¡Hola {{nombre}}! Perfecto, te mando el acceso por DM 🎓",
    dmText: "¡Hola {{nombre}}! Acá tienes acceso a Bewe Academy con todos los cursos paso a paso para sacarle máximo provecho a la plataforma: {{link}} · Cualquier duda escríbeme.",
    text: "¡Hola {{nombre}}! Perfecto, te mando el acceso por DM 🎓",
    notes: "Para cuando comentan 'quiero el curso', 'cómo aprendo', etc.",
  },
  // ─── LINDA (Asistente IA) ────────────────────────────────────────────────
  {
    id: "linda-explicacion",
    name: "Linda · Qué es la IA",
    icon: "🤖",
    industry: "general",
    intent: "info",
    urlBase: "https://bewe.ai/linda",
    publicText: "¡Hola {{nombre}}! Linda es nuestra asistente IA 🤖 Te mando detalles por DM.",
    dmText: "Linda es nuestra asistente con IA · automatiza WhatsApp, responde clientes 24/7, agenda citas y hace seguimiento por ti. Para que tú dejes de operar y empieces a dirigir. Conócela acá: {{link}}",
    text: "¡Hola {{nombre}}! Linda es nuestra asistente IA 🤖 Te mando detalles por DM.",
  },
  // ─── TOOLS ───────────────────────────────────────────────────────────────
  {
    id: "tool-calculadora-roi",
    name: "Tool · Calculadora ROI gratis",
    icon: "🧮",
    industry: "tools",
    intent: "trial",
    urlBase: "https://bewe.ai/tools",
    publicText: "¡Hola {{nombre}}! Pruébala gratis 🧮 Te paso el link por DM.",
    dmText: "Nuestra calculadora de ROI gratis te dice en 2 minutos cuánto puedes ahorrar/ganar implementando Bewe. Pruébala sin compromiso: {{link}}",
    text: "¡Hola {{nombre}}! Pruébala gratis 🧮 Te paso el link por DM.",
  },
  // ─── AGENCIAS (de bewe.ai/agencias) ──────────────────────────────────────
  {
    id: "agencias-info",
    name: "Agencias · Programa white label",
    icon: "🏢",
    industry: "general",
    intent: "info",
    urlBase: "https://bewe.ai/agencias",
    publicText: "¡Hola {{nombre}}! Tenemos programa para agencias 🏢 Detalles por DM.",
    dmText: "¡Hola {{nombre}}! Bewe para agencias: IA nativa, white label incluido, manejas múltiples clientes desde una sola plataforma. Conoce el programa: {{link}}",
    text: "¡Hola {{nombre}}! Tenemos programa para agencias 🏢 Detalles por DM.",
  },
  // ─── COMPARATIVAS (oro para responder objeciones) ────────────────────────
  {
    id: "fresha-vs-bewe",
    name: "Comparación · Fresha vs Bewe",
    icon: "⚖️",
    industry: "belleza",
    intent: "info",
    urlBase: "https://bewe.ai/fresha-vs-bewe",
    publicText: "Hola {{nombre}} 👋 Te paso comparación detallada por DM.",
    dmText: "¡Hola {{nombre}}! Acá la comparación detallada Fresha vs Bewe para que veas las diferencias claras: {{link}}",
    text: "Hola {{nombre}} 👋 Te paso comparación detallada por DM.",
  },
  {
    id: "hubspot-vs-bewe",
    name: "Comparación · HubSpot vs Bewe",
    icon: "⚖️",
    industry: "general",
    intent: "info",
    urlBase: "https://bewe.ai/hubspot-vs-bewe",
    publicText: "Hola {{nombre}} 👋 Te paso la comparación por DM.",
    dmText: "Acá la comparativa Bewe vs HubSpot enfocada en PYMEs: {{link}} · Bewe está diseñado específicamente para pequeños negocios.",
    text: "Hola {{nombre}} 👋 Te paso la comparación por DM.",
  },
  // ─── GENERALES (sin link · solo conversación) ────────────────────────────
  {
    id: "agradecimiento",
    name: "Agradecer comentario positivo",
    icon: "🙏",
    industry: "general",
    intent: "agradecimiento",
    publicText: "¡Muchas gracias {{nombre}}! 💜 Nos motiva un montón leer esto.",
    dmText: "¡Muchas gracias por tu mensaje {{nombre}}! 💜 Si en algún momento quieres conocer cómo Bewe puede ayudarte, escríbeme acá.",
    text: "¡Muchas gracias {{nombre}}! 💜 Nos motiva un montón leer esto.",
  },
  {
    id: "negativo-empatia",
    name: "Negativo / Queja · Empatía",
    icon: "🤝",
    industry: "general",
    intent: "negativo",
    publicText: "Hola {{nombre}}, te respondo por DM para entender bien la situación y ayudarte 🤝",
    dmText: "Hola {{nombre}}, gracias por contarnos. Queremos entender qué pasó y ver cómo podemos ayudarte. ¿Me cuentas más detalle por aquí?",
    text: "Hola {{nombre}}, te respondo por DM para entender bien la situación y ayudarte 🤝",
    notes: "Usar cuando el comentario es negativo o crítica. Nunca discutir en público.",
  },
  {
    id: "spam-marcar",
    name: "Spam · Solo marcar internamente",
    icon: "🚫",
    industry: "general",
    intent: "descartar",
    publicText: "",
    dmText: "",
    text: "[Nota interna · spam u off-topic · no responder]",
  },
];

export function loadTemplates(): Template[] {
  if (typeof window === "undefined") {
    return DEFAULT_TEMPLATES.map((t) => ({ ...t, useCount: 0, createdAt: "2026-06-23T00:00:00" }));
  }
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (!stored) {
      const fresh = DEFAULT_TEMPLATES.map((t) => ({ ...t, useCount: 0, createdAt: new Date().toISOString() }));
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

/** Sustituye {{nombre}}, {{link}}, {{producto}}, {{negocio}}. */
export function applyTemplateVars(
  text: string,
  vars: { nombre?: string; producto?: string; negocio?: string; link?: string } = {},
): string {
  return text
    .replace(/\{\{nombre\}\}/g, vars.nombre || "")
    .replace(/\{\{producto\}\}/g, vars.producto || "Bewe")
    .replace(/\{\{negocio\}\}/g, vars.negocio || "tu negocio")
    .replace(/\{\{link\}\}/g, vars.link || "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Elige el texto apropiado según el contexto:
 * - Si es comentario público y hay publicText → usa publicText (sin link)
 * - Si es DM y hay dmText → usa dmText (con link)
 * - Si no, fallback a text
 */
export function pickTemplateText(t: Template, context: ChannelContext): string {
  const isPublic = context.startsWith("comentario_publico");
  if (isPublic && t.publicText) return t.publicText;
  if (!isPublic && t.dmText) return t.dmText;
  return t.text;
}
