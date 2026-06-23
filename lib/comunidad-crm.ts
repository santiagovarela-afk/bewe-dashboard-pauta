/**
 * Comunidad · CRM de contactos en redes sociales
 *
 * Modelo Kanban tipo HubSpot: cada persona que escribió (comentó o mandó
 * mensaje) tiene su tarjeta. Esneider la mueve entre columnas a medida que
 * conversa. Persistencia en localStorage v1 — cuando crezca el equipo,
 * mover a BD compartida.
 */

export type ContactStage =
  | "registrado"
  | "interesado"
  | "prospecto"
  | "lead"
  | "trial"
  | "convertido"
  | "spam";

export interface ContactStageDef {
  id: ContactStage;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
  /** Color del header del stage (Tailwind className). */
  accent: string;
}

export const CONTACT_STAGES: ContactStageDef[] = [
  {
    id: "registrado",
    label: "Registrado",
    icon: "🆕",
    description: "Primer contacto · acaba de escribir",
    color: "text-slate-200",
    bg: "border-slate-500/40 bg-gradient-to-br from-slate-500/10 to-slate-500/[0.02]",
    accent: "from-slate-500 to-slate-400",
  },
  {
    id: "interesado",
    label: "Interesado",
    icon: "👋",
    description: "Mostró interés inicial · primera respuesta",
    color: "text-blue-200",
    bg: "border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-blue-500/[0.02]",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    id: "prospecto",
    label: "Prospecto",
    icon: "💬",
    description: "Conversación activa · interés sostenido",
    color: "text-violet-200",
    bg: "border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-violet-500/[0.02]",
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "lead",
    label: "Lead / Demo",
    icon: "🎯",
    description: "Pidió precios / demo / información concreta",
    color: "text-amber-200",
    bg: "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02]",
    accent: "from-amber-500 to-orange-400",
  },
  {
    id: "trial",
    label: "Trial",
    icon: "🚀",
    description: "Inició trial · probando Bewe",
    color: "text-orange-200",
    bg: "border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-500/[0.02]",
    accent: "from-orange-500 to-red-400",
  },
  {
    id: "convertido",
    label: "Convertido",
    icon: "✅",
    description: "Cliente pagado · conversión cerrada",
    color: "text-emerald-200",
    bg: "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02]",
    accent: "from-emerald-500 to-green-400",
  },
  {
    id: "spam",
    label: "Descartado",
    icon: "🚫",
    description: "Spam, troll, off-topic, no relevante",
    color: "text-rose-200",
    bg: "border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-rose-500/[0.02]",
    accent: "from-rose-500 to-pink-400",
  },
];

/** Stages activos del funnel (sin contar spam/descartado). Para porcentajes. */
export const FUNNEL_STAGES: ContactStage[] = [
  "registrado",
  "interesado",
  "prospecto",
  "lead",
  "trial",
  "convertido",
];

/**
 * Migra contactos desde el schema v1 (4 stages) al v2 (7 stages).
 * "calificado" antiguo se mapea a "interesado".
 */
function migrateStage(stage: string): ContactStage {
  if (stage === "calificado") return "interesado";
  if (CONTACT_STAGES.some((s) => s.id === stage)) return stage as ContactStage;
  return "registrado";
}

export function getStageDef(id: ContactStage): ContactStageDef {
  return CONTACT_STAGES.find((s) => s.id === id) ?? CONTACT_STAGES[0];
}

// ─── CONTACT MODEL ─────────────────────────────────────────────────────────

export interface ContactInteraction {
  type: "comment" | "message";
  platform: "ig" | "fb" | "messenger";
  itemId: string;
  postId?: string;
  text: string;
  timestamp: string;
}

export interface Contact {
  id: string;
  name: string;
  /** Plataforma principal por la que llegó. */
  primaryPlatform: "ig" | "fb" | "messenger";
  /** Plataformas donde nos ha escrito (puede tener varias). */
  platforms: Array<"ig" | "fb" | "messenger">;
  stage: ContactStage;
  /** Notas internas que Esneider/Santiago agregan. */
  notes: string;
  /** Última vez que esa persona escribió algo. */
  lastInteraction: string;
  /** Cantidad total de interacciones registradas. */
  interactionCount: number;
  /** Fecha en que se creó la tarjeta en el CRM. */
  createdAt: string;
  /** Cuándo cambió de stage por última vez (para tiempos en el funnel). */
  stageChangedAt: string;
  /** Avatar opcional (URL). */
  avatar?: string;
}

const CONTACTS_KEY = "bewe_comunidad_contacts_v1";

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]") as Contact[];
    // Auto-migración: stages v1 ("calificado") → v2 ("interesado")
    return raw.map((c) => ({ ...c, stage: migrateStage(c.stage as string) }));
  } catch {
    return [];
  }
}

export function saveContacts(contacts: Contact[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

/** Genera ID de contacto desde nombre + plataforma para ser estable. */
export function contactKey(name: string, platform: "ig" | "fb" | "messenger"): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${platform}:${slug || "sin-nombre"}`;
}

/**
 * Upsert un contacto a partir de una interacción nueva (comentario o
 * mensaje). Si ya existe, actualiza lastInteraction y suma al contador.
 */
export function upsertContact(
  contacts: Contact[],
  data: {
    name: string;
    platform: "ig" | "fb" | "messenger";
    interactionAt: string;
  },
): { contacts: Contact[]; contact: Contact; created: boolean } {
  const id = contactKey(data.name, data.platform);
  const existing = contacts.find((c) => c.id === id);
  if (existing) {
    const lastT = new Date(existing.lastInteraction).getTime();
    const newT = new Date(data.interactionAt).getTime();
    if (newT > lastT) existing.lastInteraction = data.interactionAt;
    existing.interactionCount += 1;
    if (!existing.platforms.includes(data.platform)) {
      existing.platforms.push(data.platform);
    }
    return { contacts: [...contacts], contact: existing, created: false };
  }
  const now = new Date().toISOString();
  const contact: Contact = {
    id,
    name: data.name,
    primaryPlatform: data.platform,
    platforms: [data.platform],
    stage: "registrado",
    notes: "",
    lastInteraction: data.interactionAt || now,
    interactionCount: 1,
    createdAt: now,
    stageChangedAt: now,
  };
  return { contacts: [...contacts, contact], contact, created: true };
}

export function moveContactToStage(
  contacts: Contact[],
  contactId: string,
  stage: ContactStage,
): Contact[] {
  return contacts.map((c) =>
    c.id === contactId
      ? { ...c, stage, stageChangedAt: new Date().toISOString() }
      : c,
  );
}

export function updateContactNotes(
  contacts: Contact[],
  contactId: string,
  notes: string,
): Contact[] {
  return contacts.map((c) => (c.id === contactId ? { ...c, notes } : c));
}

export function deleteContact(contacts: Contact[], contactId: string): Contact[] {
  return contacts.filter((c) => c.id !== contactId);
}

// ─── INSIGHTS / SUMMARIES ──────────────────────────────────────────────────

export interface CRMStats {
  total: number;
  byStage: Record<ContactStage, number>;
  conversionRate: number; // % convertidos / (total - spam)
  qualificationRate: number; // % >=interesado / total
  trialRate: number; // % trial+convertido / total
}

export function computeStats(contacts: Contact[]): CRMStats {
  const byStage: Record<ContactStage, number> = {
    registrado: 0,
    interesado: 0,
    prospecto: 0,
    lead: 0,
    trial: 0,
    convertido: 0,
    spam: 0,
  };
  contacts.forEach((c) => {
    byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;
  });
  const total = contacts.length;
  const activeFunnel = total - byStage.spam;
  const qualified = byStage.interesado + byStage.prospecto + byStage.lead + byStage.trial + byStage.convertido;
  const trial = byStage.trial + byStage.convertido;
  return {
    total,
    byStage,
    qualificationRate: total > 0 ? (qualified / total) * 100 : 0,
    trialRate: total > 0 ? (trial / total) * 100 : 0,
    conversionRate: activeFunnel > 0 ? (byStage.convertido / activeFunnel) * 100 : 0,
  };
}
