/**
 * Bewe Studio · Brand Kit
 *
 * Fuente única de verdad para todo el sistema visual de Bewe. Sincronizado
 * con el repo bewe-studio (https://github.com/santiagovarela-afk/bewe-studio
 * → SKILL.md · brand-kit.md Foundations v2.0).
 *
 * Estos valores se usan en:
 *  - BrandKitView (visual interactivo)
 *  - Templates (heredan paleta + tipografía)
 *  - Generator IA (se inyectan en el system prompt de Gemini/Nano Banana
 *    como guardrails — el modelo NO puede usar #000, #FFF, morado, etc.)
 *  - Library (filtros por tipo de contenido)
 *  - Canva deep links (preset de marca)
 */

export interface ColorDef {
  hex: string;
  name: string;
  role: string;
  notes?: string;
}

export const BRAND_COLORS: ColorDef[] = [
  {
    hex: "#0A2540",
    name: "Prussian Blue",
    role: "Navy fondo oscuro",
    notes: "Base oscura · texto + fondos densos",
  },
  {
    hex: "#102E4E",
    name: "Navy Soft",
    role: "Variante suave del navy",
  },
  {
    hex: "#355452",
    name: "Ink Forest",
    role: "Variante suave alternativa al navy",
  },
  {
    hex: "#67E8F9",
    name: "Electric Aqua",
    role: "Énfasis IA + palabra clave",
    notes: "Para resaltar 'Linda' y conceptos clave",
  },
  {
    hex: "#34D399",
    name: "Emerald",
    role: "Decorativo",
    notes: "⚠️ NUNCA usar en texto",
  },
  {
    hex: "#60A5FA",
    name: "Cool Horizon",
    role: "CTA / acento",
  },
  {
    hex: "#FEF3C7",
    name: "Lemon Chiffon",
    role: "Apoyo cálido oscuro",
  },
  {
    hex: "#FAD19E",
    name: "Apricot",
    role: "Asterisco oscuro / ámbar marca",
  },
  {
    hex: "#E8F9FB",
    name: "Aqua claro",
    role: "Fondo claro",
  },
  {
    hex: "#FAFAFA",
    name: "Blanco neutro",
    role: "Fondos claros",
  },
  {
    hex: "#F4F6F8",
    name: "Gris cálido",
    role: "Fondo alternativo claro",
  },
];

export interface GradientDef {
  name: string;
  angle: number;
  stops: string[];
  css: string;
  use: string;
}

export const BRAND_GRADIENTS: GradientDef[] = [
  {
    name: "Linda",
    angle: 135,
    stops: ["#B0D2FC", "#CCFBF1", "#FAD19E"],
    css: "linear-gradient(135deg, #B0D2FC 0%, #CCFBF1 50%, #FAD19E 100%)",
    use: "Fondos claros con personalidad · piezas warm",
  },
  {
    name: "Linda Soft",
    angle: 120,
    stops: ["#DFEDFE", "#FFFFFF", "#D6F6EB"],
    css: "linear-gradient(120deg, #DFEDFE 0%, #FFFFFF 50%, #D6F6EB 100%)",
    use: "Fondos light minimalistas",
  },
  {
    name: "CTA Linda",
    angle: 90,
    stops: ["#60A5FA", "#34D399", "#60A5FA"],
    css: "linear-gradient(90deg, #60A5FA 0%, #34D399 50%, #60A5FA 100%)",
    use: "Botones primarios · CTA",
  },
  {
    name: "Dawn",
    angle: 135,
    stops: ["#FAD19E", "#FEF3C7", "#60A5FA"],
    css: "linear-gradient(135deg, #FAD19E 0%, #FEF3C7 50%, #60A5FA 100%)",
    use: "Headers + portadas warm",
  },
];

export interface FontDef {
  family: string;
  use: string;
  weights: number[];
  letterSpacing: string;
  notes?: string;
}

export const BRAND_FONTS: FontDef[] = [
  {
    family: "Inter",
    use: "Para TODO el contenido",
    weights: [400, 600, 700, 800],
    letterSpacing: "-0.035em",
    notes: "Wordmark Bewe va en weight 800",
  },
  {
    family: "Merriweather Italic",
    use: "SOLO para 'Linda' (la IA de Bewe) o keywords aislados",
    weights: [400],
    letterSpacing: "0",
    notes: "Máximo 1-2 palabras. NUNCA texto corrido ni títulos. Color: #67E8F9 sobre fondo oscuro · #0A2540 sobre fondo claro",
  },
];

export interface RuleDef {
  type: "do" | "dont";
  text: string;
  example?: string;
}

export const BRAND_RULES: RuleDef[] = [
  // Reglas que SÍ
  { type: "do", text: "Usar subtítulos estilo casa: itálicas, word-pop, keyword/IA en aqua, dato en bold" },
  { type: "do", text: "Frase clave con círculo emerald dibujado (uno por pieza, no más)" },
  { type: "do", text: "Variar composición de letras: asimétrica, split, número héroe, ticket inclinado" },
  { type: "do", text: "Usar ✳ (asterisco) y subrayado ondulado como decorativos" },
  { type: "do", text: "Si el material es claro → fondo claro + gradientes Linda con texto navy" },
  { type: "do", text: "Equilibrar el navy con aqua/lemon/apricot — nunca abusar del navy" },
  { type: "do", text: "Trato 'tú' siempre · sentence case (no ALL CAPS salvo labels ≤14px)" },
  { type: "do", text: "Portadas con gancho fuerte LATAM, sin lavado blanco" },

  // Reglas que NO
  { type: "dont", text: "❌ NO usar morado/violeta dominante" },
  { type: "dont", text: "❌ NO usar naranja dominante" },
  { type: "dont", text: "❌ NO usar negro puro (#000000) ni blanco puro (#FFFFFF) como texto" },
  { type: "dont", text: "❌ NO usar gradientes mesh/aurora dominantes" },
  { type: "dont", text: "❌ NO usar emojis ni íconos de apps en la gráfica" },
  { type: "dont", text: "❌ NO usar stock corporativo lavado" },
  { type: "dont", text: "❌ NO usar grises (#5A6B7E) fuera de paleta" },
  { type: "dont", text: "❌ NO usar dorados oscuros (#C98A2B) — usar apricot (#FAD19E) o ámbar marca (#D99A3C)" },
  { type: "dont", text: "❌ NO usar Emerald (#34D399) en texto · solo decorativo" },
  { type: "dont", text: "❌ NO usar Merriweather Italic en texto largo · solo 1-2 palabras (Linda/keywords)" },
];

export interface FormatDef {
  id: string;
  name: string;
  description: string;
  aspectRatio: string;
  dimensions: string;
  duration?: string;
  icon: string;
  canvaTemplate?: string;
  beweStudioCommand?: string;
}

export const CONTENT_FORMATS: FormatDef[] = [
  {
    id: "reel",
    name: "Reel / Video corto",
    description: "Video vertical para IG Reels, TikTok, FB Reels",
    aspectRatio: "9:16",
    dimensions: "1080×1920",
    duration: "15-25s",
    icon: "🎬",
    canvaTemplate: "https://www.canva.com/design/play?category=tACFasH-mPo",
    beweStudioCommand: "npm run render",
  },
  {
    id: "carousel",
    name: "Carrusel",
    description: "Multi-slide para feed Instagram/Facebook",
    aspectRatio: "4:5",
    dimensions: "1080×1350",
    icon: "📐",
    canvaTemplate: "https://www.canva.com/design/play?category=tACFasH-Q9o",
  },
  {
    id: "story",
    name: "Historia interactiva",
    description: "Stories 24h para IG/FB con encuestas, stickers",
    aspectRatio: "9:16",
    dimensions: "1080×1920",
    icon: "📱",
    canvaTemplate: "https://www.canva.com/design/play?category=tACFasGoUjQ",
    beweStudioCommand: "npm run story1",
  },
  {
    id: "cover",
    name: "Portada de video",
    description: "Cover estática para Reels/YouTube (A/B/C variantes)",
    aspectRatio: "9:16",
    dimensions: "1080×1920",
    icon: "🖼️",
    beweStudioCommand: "npm run cover",
  },
  {
    id: "motion",
    name: "Motion graphics",
    description: "Animaciones horizontales para web/YouTube",
    aspectRatio: "16:9",
    dimensions: "1920×1080",
    icon: "🎞️",
  },
  {
    id: "post-feed",
    name: "Post feed cuadrado",
    description: "Imagen estática para feed IG/FB",
    aspectRatio: "1:1",
    dimensions: "1080×1080",
    icon: "📷",
    canvaTemplate: "https://www.canva.com/design/play?category=tACFasJWHrw",
  },
  {
    id: "ad-creative",
    name: "Creativo de anuncio",
    description: "Pieza pensada para pauta Meta (con CTA, UTM, copy)",
    aspectRatio: "1:1",
    dimensions: "1080×1080",
    icon: "🎯",
  },
  {
    id: "avatar",
    name: "Avatar AI",
    description: "Personajes generados con Higgsfield Soul",
    aspectRatio: "1:1",
    dimensions: "1024×1024",
    icon: "👤",
  },
];

export const BRAND_VOICE = {
  tone: "Editorial, minimalista, tecnológica pero humana",
  rules: [
    "El texto manda · mucho aire",
    "Una idea por momento",
    "Tensión (oscuro) → alivio (claro)",
    "Trato 'tú' siempre",
    "Sentence case (no ALL CAPS salvo labels ≤14px)",
  ],
};

export const TYPICAL_CTAS = [
  "Pruébalo gratis 30 días",
  "Empieza gratis",
  "Comenta QUIERO",
  "Comenta AGENDA",
  "Comenta CALCULADORA",
  "Reserva tu demo",
];

export const UTM_STRUCTURE = {
  source: ["instagram", "tiktok", "facebook", "whatsapp"],
  medium: ["stories", "reel", "social", "video", "dm", "comunidad"],
  campaign: "concepto (ej. pymes_academy, belleza_salones)",
  content: "pieza concreta (ej. historia_nata, reel_julian)",
};

export const AUDIO_SPECS = {
  voice: "~1.1–1.2",
  music: "~0.10–0.15",
  sfx: "~0.07–0.16",
  master: "-14 LUFS · pico ~-1.5 dB",
  musicStyle: "Deep house cálido · lo-fi boom-bap",
  ffmpegChain:
    "highpass=f=80, afftdn=nf=-25, equalizer=f=3000:t=q:w=1.4:g=2.5, acompressor=threshold=-18dB:ratio=3:attack=15:release=200, alimiter=limit=0.9, loudnorm=I=-14:TP=-1.5:LRA=11",
};

/** Genera un system prompt para Gemini con todos los guardrails de marca. */
export function buildBrandGuardrailsPrompt(): string {
  return `Eres Bewe Studio, generador de contenido para Bewe (SaaS para PYMEs).
SIEMPRE respeta el brand kit:

PALETA OFICIAL (solo estos colores):
${BRAND_COLORS.map((c) => `- ${c.hex} ${c.name} (${c.role})`).join("\n")}

GRADIENTES PERMITIDOS:
${BRAND_GRADIENTS.map((g) => `- ${g.name}: ${g.css}`).join("\n")}

TIPOGRAFÍA:
- Inter (TODO el texto · pesos 400/600/700/800 · letter-spacing -0.035em)
- Merriweather Italic SOLO para "Linda" o 1 keyword aislada (NUNCA texto largo)

REGLAS NO-NEGOCIABLES:
${BRAND_RULES.filter((r) => r.type === "dont").map((r) => r.text).join("\n")}

REGLAS POSITIVAS:
${BRAND_RULES.filter((r) => r.type === "do").map((r) => `- ${r.text}`).join("\n")}

VOZ:
${BRAND_VOICE.tone}. ${BRAND_VOICE.rules.join(". ")}.

NUNCA inventes colores fuera de la paleta. NUNCA uses emojis en la gráfica.
NUNCA uses Merriweather en títulos largos. SIEMPRE trato "tú".`;
}
