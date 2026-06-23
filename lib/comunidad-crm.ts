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
  | "calificado"
  | "convertido"
  | "spam";

export interface ContactStageDef {
  id: ContactStage;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
}

export const CONTACT_STAGES: ContactStageDef[] = [
  {
    id: "registrado",
    label: "Registrado",
    icon: "🆕",
    description: "Primer contacto · acaba de escribir",
    color: "text-slate-300",
    bg: "border-slate-500/40 bg-slate-500/10",
  },
  {
    id: "calificado",
    label: "Calificado",
    icon: "👋",
    description: "Mostró interés real · conversamos algo",
    color: "text-blue-300",
    bg: "border-blue-500/40 bg-blue-500/10",
  },
  {
    id: "convertido",
    label: "Convertido",
    icon: "✅",
    description: "Cerró trial, demo o conversión",
    color: "text-emerald-300",
    bg: "border-emerald-500/40 bg-emerald-500/10",
  },
  {
    id: "spam",
    label: "Spam / Descartado",
    icon: "🚫",
    description: "Spam, troll, off-topic, problemas",
    color: "text-rose-300",
    bg: "border-rose-500/40 bg-rose-500/10",
  },
];

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
    return JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]");
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
  conversionRate: number; // % convertidos / total
  qualificationRate: number; // % calificados (≥calificado) / total
}

export function computeStats(contacts: Contact[]): CRMStats {
  const byStage: Record<ContactStage, number> = {
    registrado: 0,
    calificado: 0,
    convertido: 0,
    spam: 0,
  };
  contacts.forEach((c) => {
    byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;
  });
  const total = contacts.length;
  const qualified = byStage.calificado + byStage.convertido;
  return {
    total,
    byStage,
    qualificationRate: total > 0 ? (qualified / total) * 100 : 0,
    conversionRate: total > 0 ? (byStage.convertido / total) * 100 : 0,
  };
}
