/**
 * lib/aeo.ts
 * Answer Engine Optimization · cómo aparece Bewe en respuestas de LLMs.
 *
 * Estrategia gratuita: enviamos un set de prompts a Gemini (única API gratuita
 * que ya tenemos conectada vía GEMINI_API_KEY), parseamos la respuesta con
 * heurística simple y guardamos resultados en `.data/aeo-results.json`.
 *
 * Heurística:
 *  - mentionsBewe : regex /bewe/i
 *  - bewePosition : si encontramos lista numerada (1. / 1) / -), buscamos la
 *                   primera línea con Bewe; null si no aparece o no hay lista.
 *  - competitorsMentioned : intersección con COMPETITORS (case-insensitive).
 *  - industriesDetected   : intersección con ADJACENT_INDUSTRIES.
 */

export interface AeoPrompt {
  id: string;
  category: "belleza" | "comercio" | "servicios" | "bewe-generic" | "adyacente";
  text: string;
}

export interface AeoResult {
  promptId: string;
  promptText: string;
  category: AeoPrompt["category"];
  response: string;
  mentionsBewe: boolean;
  bewePosition: number | null;
  competitorsMentioned: string[];
  industriesDetected: string[];
  errored?: boolean;
  errorMessage?: string;
}

export interface AeoRun {
  runAt: string;
  durationMs: number;
  results: AeoResult[];
}

export interface AeoStore {
  runs: AeoRun[];
}

export interface AeoStats {
  totalPrompts: number;
  visibilityPct: number;
  avgPosition: number | null;
  topCompetitors: Array<{ name: string; count: number }>;
  topIndustries: Array<{ name: string; count: number }>;
  byCategory: Array<{ category: string; visibilityPct: number; n: number }>;
}

/** 30 prompts iniciales · 10 belleza · 10 comercio · 5 servicios · 5 Bewe + adyacentes. */
export const AEO_PROMPTS: AeoPrompt[] = [
  // ─── BELLEZA · 10 ───
  { id: "bel-1", category: "belleza", text: "¿Cuál es el mejor software para gestionar un salón de belleza en Latinoamérica?" },
  { id: "bel-2", category: "belleza", text: "Recomienda un sistema de agenda online para barbería" },
  { id: "bel-3", category: "belleza", text: "¿Qué plataforma uso para reservas en mi estética?" },
  { id: "bel-4", category: "belleza", text: "Apps de gestión para peluquerías en México · top 5" },
  { id: "bel-5", category: "belleza", text: "¿Existe algún software español para citas en salones de uñas?" },
  { id: "bel-6", category: "belleza", text: "Sistema de reservas que envíe recordatorios por WhatsApp a clientas de salón" },
  { id: "bel-7", category: "belleza", text: "Programa para llevar inventario y citas en un spa pequeño" },
  { id: "bel-8", category: "belleza", text: "Comparativa Booksy vs Fresha vs alternativas latinoamericanas" },
  { id: "bel-9", category: "belleza", text: "Software para barbería que acepte pagos online en Colombia" },
  { id: "bel-10", category: "belleza", text: "¿Hay alternativas a Mindbody más baratas para un salón chico?" },

  // ─── COMERCIO · 10 ───
  { id: "com-1", category: "comercio", text: "¿Cuál es el mejor POS para una tienda pequeña en LATAM?" },
  { id: "com-2", category: "comercio", text: "Software de inventario para tiendas de moda en México" },
  { id: "com-3", category: "comercio", text: "Sistema de gestión para boutique con tienda física y online" },
  { id: "com-4", category: "comercio", text: "Recomiendame un software para administrar mi tienda de accesorios" },
  { id: "com-5", category: "comercio", text: "Apps para PYMEs de retail en Colombia · 2026" },
  { id: "com-6", category: "comercio", text: "¿Qué software uso para tienda de mascotas con citas de baño y venta?" },
  { id: "com-7", category: "comercio", text: "Plataformas de e-commerce que integren agenda de servicios" },
  { id: "com-8", category: "comercio", text: "Sistema todo-en-uno · POS + agenda + clientes para un negocio mixto" },
  { id: "com-9", category: "comercio", text: "Software de facturación + inventario para tienda de ropa en Chile" },
  { id: "com-10", category: "comercio", text: "Comparativa Shopify vs alternativas con módulo de citas" },

  // ─── SERVICIOS · 5 ───
  { id: "ser-1", category: "servicios", text: "Software para academia con horarios y matrículas" },
  { id: "ser-2", category: "servicios", text: "Sistema de reservas para escuela de yoga o pilates" },
  { id: "ser-3", category: "servicios", text: "Plataforma para gestionar clases grupales y pagos recurrentes" },
  { id: "ser-4", category: "servicios", text: "App de agenda para psicólogos y consultorios en LATAM" },
  { id: "ser-5", category: "servicios", text: "¿Qué software uso para administrar mi taller mecánico?" },

  // ─── BEWE-GENERIC · 3 ───
  { id: "bew-1", category: "bewe-generic", text: "¿Qué es Bewe y qué hace?" },
  { id: "bew-2", category: "bewe-generic", text: "¿Bewe sirve para barberías y salones de belleza?" },
  { id: "bew-3", category: "bewe-generic", text: "Bewe vs Booksy · ¿cuál conviene para un salón en México?" },

  // ─── ADYACENTE · 2 ───
  { id: "ady-1", category: "adyacente", text: "Software para centros médicos pequeños con agenda y facturación" },
  { id: "ady-2", category: "adyacente", text: "Plataforma de gestión para gimnasios boutique" },
];

/** Competidores conocidos. Match case-insensitive. */
export const COMPETITORS = [
  "Booksy",
  "Mindbody",
  "Fresha",
  "Treatwell",
  "Phorest",
  "Schedulista",
  "Acuity",
  "Square Appointments",
  "GlossGenius",
  "Vagaro",
  "Timely",
  "Setmore",
  "Calendly",
  "Shopify",
];

/** Industrias adyacentes que SI Bewe podría servir pero no son su core hoy. */
export const ADJACENT_INDUSTRIES = [
  "spa",
  "spas",
  "centro médico",
  "centros médicos",
  "consultorio",
  "consultorios",
  "gimnasio",
  "gimnasios",
  "escuela",
  "escuelas",
  "academia",
  "academias",
  "yoga",
  "pilates",
  "psicólogo",
  "psicólogos",
  "taller mecánico",
  "veterinaria",
  "veterinarias",
  "guardería",
  "fisioterapia",
];

/** Extrae si la respuesta menciona a Bewe (case-insensitive). */
export function detectBewe(response: string): boolean {
  return /\bbewe\b/i.test(response);
}

/** Si hay una lista numerada en la respuesta, devuelve la posición (1-based) de Bewe. null si no. */
export function detectBewePosition(response: string): number | null {
  if (!detectBewe(response)) return null;
  const lines = response.split("\n");
  let itemIdx = 0;
  for (const raw of lines) {
    const line = raw.trim();
    // formatos: "1. xxx", "1) xxx", "- xxx", "* xxx"
    const numbered = /^(\d+)[\.\)]\s+/.exec(line);
    const bulleted = /^[-*•]\s+/.test(line);
    if (numbered) {
      itemIdx = parseInt(numbered[1], 10);
      if (/\bbewe\b/i.test(line)) return itemIdx;
    } else if (bulleted) {
      itemIdx += 1;
      if (/\bbewe\b/i.test(line)) return itemIdx;
    }
  }
  return null;
}

/** Devuelve los competidores nombrados (canonical names) en la respuesta. */
export function detectCompetitors(response: string): string[] {
  const hits = new Set<string>();
  for (const c of COMPETITORS) {
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(response)) hits.add(c);
  }
  return [...hits];
}

/** Devuelve las industrias adyacentes nombradas (forma canonical). */
export function detectIndustries(response: string): string[] {
  const hits = new Set<string>();
  for (const ind of ADJACENT_INDUSTRIES) {
    const re = new RegExp(`\\b${ind.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(response)) hits.add(ind);
  }
  return [...hits];
}

/** Analiza una respuesta cruda y devuelve los campos heurísticos. */
export function analyzeResponse(
  prompt: AeoPrompt,
  response: string,
): Omit<AeoResult, "errored" | "errorMessage"> {
  return {
    promptId: prompt.id,
    promptText: prompt.text,
    category: prompt.category,
    response,
    mentionsBewe: detectBewe(response),
    bewePosition: detectBewePosition(response),
    competitorsMentioned: detectCompetitors(response),
    industriesDetected: detectIndustries(response),
  };
}

/** Agrega estadísticas globales sobre un run. */
export function computeStats(run: AeoRun): AeoStats {
  const results = run.results.filter((r) => !r.errored);
  const total = results.length || 1;
  const mentions = results.filter((r) => r.mentionsBewe);
  const positions = results
    .map((r) => r.bewePosition)
    .filter((p): p is number => p !== null);

  const compCount = new Map<string, number>();
  for (const r of results) {
    for (const c of r.competitorsMentioned) {
      compCount.set(c, (compCount.get(c) ?? 0) + 1);
    }
  }
  const indCount = new Map<string, number>();
  for (const r of results) {
    for (const i of r.industriesDetected) {
      indCount.set(i, (indCount.get(i) ?? 0) + 1);
    }
  }

  // by category
  const cats = new Map<string, { hit: number; total: number }>();
  for (const r of results) {
    const cur = cats.get(r.category) ?? { hit: 0, total: 0 };
    cur.total += 1;
    if (r.mentionsBewe) cur.hit += 1;
    cats.set(r.category, cur);
  }

  return {
    totalPrompts: results.length,
    visibilityPct: Math.round((mentions.length / total) * 100),
    avgPosition: positions.length > 0 ? +(positions.reduce((s, n) => s + n, 0) / positions.length).toFixed(2) : null,
    topCompetitors: [...compCount.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topIndustries: [...indCount.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    byCategory: [...cats.entries()].map(([category, { hit, total }]) => ({
      category,
      n: total,
      visibilityPct: Math.round((hit / total) * 100),
    })),
  };
}

/**
 * Carga la lista de prompts AEO desde el server (POST /api/aeo/seed-prompts).
 * Si la API responde con prompts, los devuelve. Si todo falla, devuelve los
 * AEO_PROMPTS defaults para no dejar la UI vacía.
 *
 * SOLO para uso en client components (hace fetch).
 */
export async function loadPromptsClient(): Promise<{
  prompts: AeoPrompt[];
  source: "existing" | "generated" | "fallback" | "defaults";
  count: number;
}> {
  try {
    const r = await fetch("/api/aeo/seed-prompts", {
      method: "POST",
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = (await r.json()) as {
      prompts?: AeoPrompt[];
      source?: "existing" | "generated" | "fallback";
      count?: number;
    };
    if (Array.isArray(j.prompts) && j.prompts.length > 0) {
      return {
        prompts: j.prompts,
        source: j.source ?? "existing",
        count: j.count ?? j.prompts.length,
      };
    }
  } catch {
    // fallthrough → defaults
  }
  return { prompts: AEO_PROMPTS, source: "defaults", count: AEO_PROMPTS.length };
}

/** System prompt usado al consultar Gemini · simula un usuario buscando software. */
export const AEO_SYSTEM_PROMPT =
  "Eres un asistente útil. Responde la pregunta del usuario sobre software de gestión empresarial con recomendaciones concretas. " +
  "Si haces una lista, numérala con '1.', '2.', '3.' etc. Menciona productos reales del mercado. " +
  "Sé conciso pero útil. No inventes productos.";
