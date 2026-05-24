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
];

export function getSkill(id: string): Skill {
  return SKILLS.find((s) => s.id === id) ?? SKILLS[0];
}

/**
 * Brand kit Bewe — fuente de verdad para el AI generator.
 * Mantener sincronizado con tokens CSS en globals.css.
 */
export const BRAND = {
  name: "Bewe",
  tagline: "Software de gestión para servicios profesionales",
  colors: {
    primary: "#8B5CF6", // violeta
    secondary: "#06B6D4", // cyan
    accent: "#A3E635", // lime
    ember: "#FB923C", // ember
    dark: "#0F0F12",
    light: "#FAFAFC",
  },
  fonts: {
    display: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
  voice: "Profesional · cálido · accionable · sin tecnicismos innecesarios",
} as const;

export type Brand = typeof BRAND;
