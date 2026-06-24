/**
 * Comunidad · CRM de contactos en redes sociales
 *
 * V3 (jun-2026): stages basadas en SENTIMENT en vez de funnel ventas.
 * Más adecuado para social media porque la clasificación es automática
 * vía Gemini al cargar comentarios.
 *
 * Stages:
 *  - nuevo: sin clasificar (default al crear contacto)
 *  - positivo: muestra interés / elogia / pide info con intención
 *  - neutral: pregunta general / consulta / informativo
 *  - negativo: crítica / queja / hate
 *  - convertido: cliente / trial / conversión cerrada
 *  - descartado: spam / off-topic / promoción ajena
 *
 * Persistencia en localStorage. Cuando crezca el equipo, mover a BD.
 */

export type ContactStage =
  | "nuevo"
  | "positivo"
  | "neutral"
  | "negativo"
  | "convertido"
  | "descartado";

export interface ContactStageDef {
  id: ContactStage;
  label: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
  accent: string;
}

export const CONTACT_STAGES: ContactStageDef[] = [
  {
    id: "nuevo",
    label: "Nuevo",
    icon: "🆕",
    description: "Sin clasificar · acaba de interactuar",
    color: "text-slate-200",
    bg: "border-slate-500/40 bg-gradient-to-br from-slate-500/10 to-slate-500/[0.02]",
    accent: "from-slate-500 to-slate-400",
  },
  {
    id: "positivo",
    label: "Positivo",
    icon: "✨",
    description: "Interés real · elogio · pide info con intención",
    color: "text-emerald-200",
    bg: "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02]",
    accent: "from-emerald-500 to-green-400",
  },
  {
    id: "neutral",
    label: "Neutral",
    icon: "💬",
    description: "Pregunta general · consulta · informativo",
    color: "text-blue-200",
    bg: "border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-blue-500/[0.02]",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    id: "negativo",
    label: "Negativo",
    icon: "⚠️",
    description: "Crítica · queja · sentimiento adverso",
    color: "text-amber-200",
    bg: "border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02]",
    accent: "from-amber-500 to-orange-400",
  },
  {
    id: "convertido",
    label: "Convertido",
    icon: "✅",
    description: "Cliente · trial activo · conversión cerrada",
    color: "text-violet-200",
    bg: "border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-violet-500/[0.02]",
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "descartado",
    label: "Descartado",
    icon: "🚫",
    description: "Spam · off-topic · promoción ajena",
    color: "text-rose-200",
    bg: "border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-rose-500/[0.02]",
    accent: "from-rose-500 to-pink-400",
  },
];

/** Stages activos del funnel (sin contar descartado). Para porcentajes. */
export const FUNNEL_STAGES: ContactStage[] = [
  "nuevo",
  "positivo",
  "neutral",
  "negativo",
  "convertido",
];

/**
 * Migra contactos desde stages anteriores (v1/v2) al schema v3 (sentiment).
 * Mapping:
 *  - calificado, interesado, prospecto, lead, trial → positivo
 *  - convertido → convertido
 *  - spam → descartado
 *  - cualquier otro → nuevo
 */
function migrateStage(stage: string): ContactStage {
  // v3 stages (no requieren migración)
  if (CONTACT_STAGES.some((s) => s.id === stage)) return stage as ContactStage;
  // v1/v2 → v3
  if (["calificado", "interesado", "prospecto", "lead", "trial"].includes(stage)) return "positivo";
  if (stage === "convertido") return "convertido";
  if (stage === "spam" || stage === "pasado-comercial") return "descartado";
  return "nuevo";
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
  /** Plataformas donde nos ha escrito. */
  platforms: Array<"ig" | "fb" | "messenger">;
  stage: ContactStage;
  /** Notas internas. */
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
  /** Sentiment classification de IA (v3). */
  sentiment?: "positive" | "neutral" | "negative";
  /** Score de confianza de la clasificación 0-100. */
  sentimentScore?: number;
  /** Si la stage fue clasificada por IA o manualmente. */
  autoClassified?: boolean;
}

const CONTACTS_KEY = "bewe_comunidad_contacts_v1";

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]") as Contact[];
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
    stage: "nuevo",
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
  meta?: { autoClassified?: boolean; sentimentScore?: number },
): Contact[] {
  return contacts.map((c) =>
    c.id === contactId
      ? {
          ...c,
          stage,
          stageChangedAt: new Date().toISOString(),
          autoClassified: meta?.autoClassified ?? false,
          sentimentScore: meta?.sentimentScore,
        }
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
  conversionRate: number;
  positiveRate: number;
  negativeRate: number;
}

export function computeStats(contacts: Contact[]): CRMStats {
  const byStage: Record<ContactStage, number> = {
    nuevo: 0,
    positivo: 0,
    neutral: 0,
    negativo: 0,
    convertido: 0,
    descartado: 0,
  };
  contacts.forEach((c) => {
    byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;
  });
  const total = contacts.length;
  const activeFunnel = total - byStage.descartado;
  return {
    total,
    byStage,
    positiveRate: total > 0 ? ((byStage.positivo + byStage.convertido) / total) * 100 : 0,
    negativeRate: total > 0 ? (byStage.negativo / total) * 100 : 0,
    conversionRate: activeFunnel > 0 ? (byStage.convertido / activeFunnel) * 100 : 0,
  };
}

// ─── DUPLICADOS ────────────────────────────────────────────────────────────

/**
 * Detecta contactos potencialmente duplicados:
 * - Mismo nombre en distintas plataformas → probable misma persona
 * - Devuelve clusters de IDs candidatos a unificar
 */
export function findDuplicates(contacts: Contact[]): Array<{ name: string; ids: string[] }> {
  const byNormalizedName = new Map<string, Contact[]>();
  contacts.forEach((c) => {
    const norm = c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
    if (!norm) return;
    if (!byNormalizedName.has(norm)) byNormalizedName.set(norm, []);
    byNormalizedName.get(norm)!.push(c);
  });
  const dups: Array<{ name: string; ids: string[] }> = [];
  byNormalizedName.forEach((arr, key) => {
    if (arr.length > 1) {
      dups.push({ name: arr[0].name, ids: arr.map((c) => c.id) });
    }
  });
  return dups;
}

/** Merge contactos duplicados manteniendo el más antiguo y sumando interacciones. */
export function mergeContacts(contacts: Contact[], ids: string[]): Contact[] {
  if (ids.length < 2) return contacts;
  const toMerge = contacts.filter((c) => ids.includes(c.id));
  if (toMerge.length < 2) return contacts;

  // Mantener el contacto más antiguo
  const primary = toMerge.reduce((oldest, c) =>
    new Date(c.createdAt) < new Date(oldest.createdAt) ? c : oldest,
  );
  // Acumular interactions + platforms del resto
  toMerge.forEach((c) => {
    if (c.id === primary.id) return;
    primary.interactionCount += c.interactionCount;
    c.platforms.forEach((p) => {
      if (!primary.platforms.includes(p)) primary.platforms.push(p);
    });
    if (new Date(c.lastInteraction) > new Date(primary.lastInteraction)) {
      primary.lastInteraction = c.lastInteraction;
    }
    if (c.notes && !primary.notes.includes(c.notes)) {
      primary.notes = primary.notes ? `${primary.notes}\n${c.notes}` : c.notes;
    }
  });

  // Promover al stage más avanzado entre todos (convertido > positivo > neutral > nuevo > negativo > descartado)
  const order: ContactStage[] = ["convertido", "positivo", "neutral", "nuevo", "negativo", "descartado"];
  primary.stage = toMerge.reduce((bestStage, c) => {
    return order.indexOf(c.stage) < order.indexOf(bestStage) ? c.stage : bestStage;
  }, primary.stage);

  return contacts.filter((c) => !ids.includes(c.id) || c.id === primary.id);
}

// ─── SLA TRACKING ──────────────────────────────────────────────────────────

/**
 * Calcula tiempo desde la última interacción del usuario hasta ahora.
 * Si está respondido, devuelve null. Si no, devuelve ms.
 */
export function timeSinceLastInteraction(lastInteractionISO: string): number {
  return Date.now() - new Date(lastInteractionISO).getTime();
}

/**
 * Color SLA según tiempo desde la interacción:
 *  - <1h: verde (rápido)
 *  - 1-4h: amarillo
 *  - 4-24h: naranja
 *  - >24h: rojo (lento)
 */
export function slaLevel(ms: number): "rapid" | "normal" | "slow" | "critical" {
  const hours = ms / 3600000;
  if (hours < 1) return "rapid";
  if (hours < 4) return "normal";
  if (hours < 24) return "slow";
  return "critical";
}

export function slaColor(level: ReturnType<typeof slaLevel>): string {
  return {
    rapid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    normal: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    slow: "text-orange-300 bg-orange-500/10 border-orange-500/30",
    critical: "text-rose-300 bg-rose-500/10 border-rose-500/30",
  }[level];
}

export function slaLabel(level: ReturnType<typeof slaLevel>): string {
  return {
    rapid: "⚡ Rápido",
    normal: "🕐 OK",
    slow: "⏰ Lento",
    critical: "🚨 Crítico",
  }[level];
}
