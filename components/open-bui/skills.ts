/**
 * Open Design · Bewe OS — definición de skills y brand kit.
 *
 * Inspirado en https://www.tododeia.com/community/open-design (nexu-io).
 * Local-first: cada skill describe un tipo de pieza con su aspect ratio
 * canónico y resolución de export. El AI consume estos metadatos para
 * generar HTML+CSS autocontenido.
 */

export interface Skill {
  id: string;
  label: string;
  /** Aspect ratio en formato "w:h" — controla el preview iframe. */
  aspect: string;
  /** Dimensión target en píxeles (informativa + se manda al prompt). */
  size: string;
  /** Width numérico del lienzo virtual (px). */
  width: number;
  /** Height numérico del lienzo virtual (px). */
  height: number;
  /** Sugerencia breve mostrada en la card. */
  hint: string;
}

export const SKILLS: Skill[] = [
  {
    id: "ig-post",
    label: "Instagram · Post",
    aspect: "1:1",
    size: "1080×1080",
    width: 1080,
    height: 1080,
    hint: "Feed cuadrado · alcance orgánico",
  },
  {
    id: "ig-story",
    label: "Instagram · Story",
    aspect: "9:16",
    size: "1080×1920",
    width: 1080,
    height: 1920,
    hint: "Vertical full · 24h",
  },
  {
    id: "ig-reel",
    label: "Instagram · Reel cover",
    aspect: "9:16",
    size: "1080×1920",
    width: 1080,
    height: 1920,
    hint: "Portada del Reel",
  },
  {
    id: "fb-feed",
    label: "Facebook · Feed",
    aspect: "1.91:1",
    size: "1200×630",
    width: 1200,
    height: 630,
    hint: "Link preview horizontal",
  },
  {
    id: "fb-ad",
    label: "Facebook · Ad creative",
    aspect: "1:1",
    size: "1080×1080",
    width: 1080,
    height: 1080,
    hint: "Anuncio cuadrado",
  },
  {
    id: "banner",
    label: "Banner web",
    aspect: "16:9",
    size: "1920×1080",
    width: 1920,
    height: 1080,
    hint: "Hero genérico",
  },
  {
    id: "landing-hero",
    label: "Landing hero",
    aspect: "16:9",
    size: "1440×600",
    width: 1440,
    height: 600,
    hint: "Above the fold",
  },
  {
    id: "email-header",
    label: "Email · Header",
    aspect: "3:1",
    size: "600×200",
    width: 600,
    height: 200,
    hint: "Cabecera de newsletter",
  },
  {
    id: "tiktok-cover",
    label: "TikTok · Cover",
    aspect: "9:16",
    size: "1080×1920",
    width: 1080,
    height: 1920,
    hint: "Reel cover · TikTok-style",
  },
  {
    id: "ig-carousel-1",
    label: "Carrusel IG · slide 1",
    aspect: "1:1",
    size: "1080×1080",
    width: 1080,
    height: 1080,
    hint: "Hook del carrusel",
  },
  {
    id: "x-post",
    label: "Twitter/X · Post",
    aspect: "16:9",
    size: "1200×675",
    width: 1200,
    height: 675,
    hint: "Imagen para tweet",
  },
  {
    id: "wa-status",
    label: "WhatsApp · Status",
    aspect: "9:16",
    size: "1080×1920",
    width: 1080,
    height: 1920,
    hint: "Estado vertical 24h",
  },
];

export function getSkill(id: string): Skill {
  return SKILLS.find((s) => s.id === id) ?? SKILLS[0];
}

/**
 * Brand kit Bewe — fuente de verdad para el AI generator.
 * Fuente: _docs/creative/IAparaPymes-Canva-Brief (2).md (Linda · pastel orgánico cálido).
 * NO usar violeta/cyan saturado · NO frío · NO Merriweather salvo IA/Linda.
 */
export const BRAND = {
  name: "Bewe",
  tagline: "Software de gestión para servicios profesionales",
  colors: {
    primary: "#60A5FA", // azul Bewe
    secondary: "#34D399", // verde emerald
    accentAi: "#FAD19E", // naranja cálido · accent IA
    inkDeep: "#0A2540", // navy texto
    surfaceAqua: "#CCFBF1", // mint pastel fondo
    surfaceCream: "#FEF3C7", // cream pastel fondo
    error: "#F87171", // rojo errores
    light: "#FAFAFC",
    dark: "#0A2540",
  },
  gradients: {
    linda: "linear-gradient(135deg, #B0D2FC 0%, #CCFBF1 45%, #FAD19E 100%)",
    lindaSoft: "linear-gradient(120deg, #DFEDFE 0%, #FFFFFF 40%, #D6F6EB 100%)",
    ctaLinda: "linear-gradient(90deg, #60A5FA 0%, #34D399 50%, #60A5FA 100%)",
    dawn: "linear-gradient(135deg, #FAD19E 0%, #FEF3C7 50%, #60A5FA 100%)",
  },
  fonts: {
    display: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    italic: "Merriweather, serif", // SOLO para palabras IA/Linda
  },
  voice:
    "Inteligente · proactivo · conciso · alentador · trato informal (tú) · español neutro LATAM/España",
  rules: [
    "Sin Merriweather italic excepto para palabras IA/Linda",
    "Inter siempre, ExtraBold para display, Regular para body",
    "Tipografía Inter ExtraBold con kerning -0.035em",
    "Sentence case en headlines (no ALL CAPS excepto micro-labels ≤14px)",
    "NO emojis en marketing/UI",
    "Esquinas redondeadas (cards 16px, botones pill 999px)",
    "Sombras navy-tinted suaves",
    "Arrow → como único decorativo en CTAs",
    "Whitespace generoso · aire",
    "Vibe orgánico pastel · cálido · NO frío violeta saturado",
  ],
} as const;

export type Brand = typeof BRAND;
