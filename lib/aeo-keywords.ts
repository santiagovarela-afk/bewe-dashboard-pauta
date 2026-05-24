/**
 * lib/aeo-keywords.ts
 *
 * Análisis textual puro sobre los resultados de un run AEO.
 *
 * extractKeywords(results):
 *  1. Concatena todas las respuestas en un texto.
 *  2. Tokeniza con regex \w+ (incluye acentos via flag unicode + clase letra).
 *  3. Filtra stopwords ES/EN y palabras <4 chars.
 *  4. Cuenta frecuencias y devuelve top 30 con categoría heurística.
 *
 * Categorías:
 *  - tech : palabras de software/tecnología (sistema, plataforma, software, app…)
 *  - vertical : verticales/rubros (salón, barbería, gym, spa…)
 *  - geo : países/regiones (mexico, colombia, latam, españa…)
 *  - neutral : el resto
 */
import type { AeoResult } from "./aeo";

/** Lista corta de stopwords ES + EN. */
const STOPWORDS = new Set<string>([
  // ES
  "de",
  "la",
  "el",
  "en",
  "y",
  "a",
  "un",
  "para",
  "con",
  "los",
  "las",
  "que",
  "es",
  "se",
  "al",
  "son",
  "una",
  "del",
  "lo",
  "por",
  "como",
  "más",
  "mas",
  "pero",
  "sus",
  "le",
  "ya",
  "o",
  "este",
  "esta",
  "esto",
  "esa",
  "ese",
  "eso",
  "han",
  "sin",
  "sobre",
  "entre",
  "cuando",
  "todo",
  "todos",
  "todas",
  "toda",
  "muy",
  "también",
  "tambien",
  "hasta",
  "desde",
  "donde",
  "quien",
  "puede",
  "pueden",
  "tiene",
  "tienen",
  "ser",
  "estar",
  "hay",
  "fue",
  "era",
  "son",
  "están",
  "estan",
  "tu",
  "su",
  "mi",
  "te",
  "me",
  "nos",
  // EN
  "the",
  "and",
  "for",
  "you",
  "are",
  "with",
  "this",
  "that",
  "from",
  "have",
  "your",
  "but",
  "not",
  "all",
  "can",
  "will",
  "they",
  "their",
  "what",
  "when",
  "which",
  "there",
  "more",
  "some",
  "any",
  "also",
  "into",
  "out",
  "about",
  "than",
  "then",
  "such",
  "very",
  "just",
  "only",
  "each",
  "other",
  "these",
  "those",
  // Conectores varios
  "porque",
  "cual",
  "cuál",
  "donde",
  "dónde",
  "cómo",
  "qué",
  "pero",
  "aunque",
  "mientras",
  "según",
  "segun",
  "uno",
  "dos",
  "tres",
]);

/** Vocabulario para categorizar palabras frecuentes. */
const TECH_HINTS = new Set<string>([
  "software",
  "sistema",
  "plataforma",
  "aplicacion",
  "aplicación",
  "app",
  "apps",
  "herramienta",
  "herramientas",
  "tecnologia",
  "tecnología",
  "online",
  "digital",
  "cloud",
  "nube",
  "saas",
  "movil",
  "móvil",
  "web",
  "integración",
  "integracion",
  "api",
  "automatizacion",
  "automatización",
  "datos",
  "dashboard",
]);

const VERTICAL_HINTS = new Set<string>([
  "salón",
  "salon",
  "salones",
  "barberia",
  "barbería",
  "barberias",
  "barberías",
  "estetica",
  "estética",
  "spa",
  "spas",
  "peluqueria",
  "peluquería",
  "tienda",
  "tiendas",
  "boutique",
  "boutiques",
  "comercio",
  "retail",
  "gimnasio",
  "gimnasios",
  "academia",
  "academias",
  "consultorio",
  "consultorios",
  "centro",
  "centros",
  "negocio",
  "negocios",
  "pyme",
  "pymes",
  "veterinaria",
  "yoga",
  "pilates",
  "moda",
  "ropa",
  "uñas",
  "unas",
]);

const GEO_HINTS = new Set<string>([
  "mexico",
  "méxico",
  "colombia",
  "argentina",
  "chile",
  "españa",
  "espana",
  "peru",
  "perú",
  "ecuador",
  "venezuela",
  "uruguay",
  "paraguay",
  "bolivia",
  "guatemala",
  "latam",
  "latinoamerica",
  "latinoamérica",
  "iberoamerica",
  "europa",
  "ee.uu",
  "eeuu",
  "estados",
  "unidos",
  "brasil",
]);

export type KeywordCategory = "tech" | "vertical" | "geo" | "neutral";

export interface KeywordEntry {
  word: string;
  count: number;
  category: KeywordCategory;
}

/**
 * Extrae las top N palabras (default 30) de un set de respuestas AEO.
 * Pure function · no I/O · safe para correr en cliente o servidor.
 */
export function extractKeywords(
  results: AeoResult[],
  topN: number = 30,
): KeywordEntry[] {
  const text = results
    .map((r) => r.response || "")
    .join(" ")
    .toLowerCase();

  // Tokenizar palabras (incluye letras con tilde y ñ via \p{L})
  const tokens = text.match(/[\p{L}][\p{L}'-]+/gu) ?? [];

  const counts = new Map<string, number>();
  for (const raw of tokens) {
    const w = raw.trim();
    if (w.length < 4) continue;
    if (STOPWORDS.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted.map(([word, count]) => ({
    word,
    count,
    category: categorize(word),
  }));
}

function categorize(word: string): KeywordCategory {
  if (TECH_HINTS.has(word)) return "tech";
  if (VERTICAL_HINTS.has(word)) return "vertical";
  if (GEO_HINTS.has(word)) return "geo";
  return "neutral";
}
