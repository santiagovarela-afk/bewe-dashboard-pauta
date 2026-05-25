/**
 * Open Design · Templates pre-armados (estilo Canva).
 *
 * Cada template engancha a un skill existente en `components/open-bui/skills.ts`
 * y trae un brief sugerido + persona recomendada. El thumbnail es SVG inline
 * para zero deps · se renderiza directo desde la grilla.
 *
 * Click → carga skill + brief en el editor y abre la tab "Idea".
 */

import type { Skill } from "@/components/open-bui/skills";

export type OpenDesignCategory =
  | "post"
  | "reel"
  | "story"
  | "banner"
  | "carrusel"
  | "email";

export interface OpenDesignTemplate {
  id: string;
  /** Skill id (debe existir en SKILLS). */
  skillId: Skill["id"] | string;
  category: OpenDesignCategory;
  title: string;
  description: string;
  brief: string;
  persona: "mark" | "lua";
  /** Render del thumbnail · recibe className para tamaño. */
  thumb: (className?: string) => string;
}

/** Util: genera un thumb SVG inline string · listo para dangerouslySetInnerHTML */
const svg = (body: string, bg = "#FEF3C7") =>
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="${bg}"/>${body}</svg>`;

export const OPEN_DESIGN_TEMPLATES: OpenDesignTemplate[] = [
  {
    id: "tpl-post-caso-exito",
    skillId: "ig-post",
    category: "post",
    title: "Caso de éxito",
    description: "Post cuadrado con testimonio y resultado en números",
    persona: "mark",
    brief:
      "Caso de éxito · salón de belleza ahorró 8h/semana automatizando agenda con Bewe. Mostrar el número grande, testimonio breve, CTA Probar gratis.",
    thumb: () =>
      svg(
        `
        <circle cx="20" cy="22" r="6" fill="#34D399"/>
        <rect x="30" y="18" width="40" height="3" rx="1.5" fill="#0A2540"/>
        <rect x="30" y="23" width="28" height="2" rx="1" fill="#0A2540" opacity="0.5"/>
        <text x="14" y="68" font-family="Inter, sans-serif" font-weight="900" font-size="26" fill="#0A2540">+8h</text>
        <rect x="14" y="74" width="50" height="2" rx="1" fill="#0A2540" opacity="0.6"/>
        <rect x="14" y="78" width="40" height="2" rx="1" fill="#0A2540" opacity="0.4"/>
        <rect x="14" y="85" width="36" height="8" rx="4" fill="#60A5FA"/>
        `,
        "#CCFBF1",
      ),
  },
  {
    id: "tpl-reel-tip-semana",
    skillId: "ig-reel",
    category: "reel",
    title: "Tip de la semana",
    description: "Reel cover vertical con tip educativo y hook fuerte",
    persona: "lua",
    brief:
      "Cover de Reel · tip de la semana para profesionales del bienestar · 3 maneras de fidelizar clientes con recordatorios automáticos. Hook tipo pregunta arriba, número grande al centro.",
    thumb: () =>
      svg(
        `
        <rect x="14" y="10" width="72" height="80" rx="6" fill="url(#g1)"/>
        <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#B0D2FC"/>
          <stop offset="100%" stop-color="#FAD19E"/>
        </linearGradient></defs>
        <text x="50" y="32" font-family="Inter" font-weight="800" font-size="6" fill="#0A2540" text-anchor="middle">TIP #03</text>
        <text x="50" y="56" font-family="Inter" font-weight="900" font-size="22" fill="#0A2540" text-anchor="middle">3X</text>
        <rect x="22" y="64" width="56" height="2.5" rx="1" fill="#0A2540" opacity="0.7"/>
        <rect x="28" y="69" width="44" height="2" rx="1" fill="#0A2540" opacity="0.5"/>
        <rect x="32" y="80" width="36" height="6" rx="3" fill="#0A2540"/>
        `,
        "#FAD19E",
      ),
  },
  {
    id: "tpl-story-promo-flash",
    skillId: "ig-story",
    category: "story",
    title: "Promo flash 24h",
    description: "Story vertical · oferta limitada con countdown visual",
    persona: "mark",
    brief:
      "Story · promo flash 24h · 30% off en primer mes de Bewe. Sentido de urgencia, número grande, CTA Reservar mi cupo. Vertical 9:16.",
    thumb: () =>
      svg(
        `
        <circle cx="50" cy="38" r="22" fill="#60A5FA"/>
        <text x="50" y="42" font-family="Inter" font-weight="900" font-size="14" fill="white" text-anchor="middle">30%</text>
        <text x="50" y="51" font-family="Inter" font-weight="700" font-size="4" fill="white" text-anchor="middle" opacity="0.9">OFF</text>
        <rect x="20" y="68" width="60" height="3" rx="1.5" fill="#0A2540"/>
        <rect x="28" y="74" width="44" height="2" rx="1" fill="#0A2540" opacity="0.6"/>
        <rect x="30" y="84" width="40" height="7" rx="3.5" fill="#F87171"/>
        `,
        "#FEF3C7",
      ),
  },
  {
    id: "tpl-banner-hero",
    skillId: "banner",
    category: "banner",
    title: "Hero principal",
    description: "Banner web 16:9 con titular + CTA + ilustración orgánica",
    persona: "lua",
    brief:
      "Banner hero web · titular fuerte sobre la propuesta de valor de Bewe · agenda, pagos, marketing en uno. CTA Probar gratis 7 días. Layout horizontal.",
    thumb: () =>
      svg(
        `
        <rect x="6" y="32" width="50" height="4" rx="1" fill="#0A2540"/>
        <rect x="6" y="40" width="42" height="4" rx="1" fill="#0A2540"/>
        <rect x="6" y="52" width="36" height="2" rx="1" fill="#0A2540" opacity="0.5"/>
        <rect x="6" y="57" width="30" height="2" rx="1" fill="#0A2540" opacity="0.5"/>
        <rect x="6" y="70" width="28" height="8" rx="4" fill="#34D399"/>
        <circle cx="78" cy="50" r="20" fill="#FAD19E"/>
        <circle cx="78" cy="50" r="10" fill="#60A5FA" opacity="0.8"/>
        `,
        "#CCFBF1",
      ),
  },
  {
    id: "tpl-carrusel-hook",
    skillId: "ig-carousel-1",
    category: "carrusel",
    title: "Carrusel · Hook educativo",
    description: "Slide 1 de un carrusel · pregunta que engancha al lector",
    persona: "mark",
    brief:
      "Slide 1 de carrusel educativo · hook tipo pregunta '¿Sabías que el 60% de las citas se pierden por no responder a tiempo?'. Indicador 'Desliza →' abajo. Mostrar 1/5.",
    thumb: () =>
      svg(
        `
        <text x="14" y="32" font-family="Inter" font-weight="900" font-size="11" fill="#0A2540">¿Sabías</text>
        <text x="14" y="46" font-family="Inter" font-weight="900" font-size="11" fill="#0A2540">que el 60%</text>
        <text x="14" y="60" font-family="Inter" font-weight="900" font-size="11" fill="#0A2540">se pierde?</text>
        <rect x="14" y="68" width="44" height="1.5" rx="0.5" fill="#0A2540" opacity="0.4"/>
        <text x="14" y="90" font-family="Inter" font-weight="700" font-size="5" fill="#60A5FA">Desliza →</text>
        <text x="78" y="90" font-family="Inter" font-weight="700" font-size="5" fill="#0A2540" opacity="0.5">1/5</text>
        `,
        "#FEF3C7",
      ),
  },
  {
    id: "tpl-email-header",
    skillId: "email-header",
    category: "email",
    title: "Newsletter mensual",
    description: "Header de email 3:1 · wordmark + título del envío",
    persona: "lua",
    brief:
      "Email header newsletter mensual · 'Lo nuevo en Bewe · Mayo'. Wordmark a la izquierda, título centrado, fondo gradient pastel.",
    thumb: () =>
      svg(
        `
        <rect x="0" y="0" width="100" height="100" fill="url(#g2)"/>
        <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#B0D2FC"/>
          <stop offset="50%" stop-color="#CCFBF1"/>
          <stop offset="100%" stop-color="#FAD19E"/>
        </linearGradient></defs>
        <text x="10" y="55" font-family="Inter" font-weight="900" font-size="9" fill="#0A2540">Bewe</text>
        <text x="50" y="40" font-family="Inter" font-weight="800" font-size="7" fill="#0A2540" text-anchor="middle">Lo nuevo en Bewe</text>
        <text x="50" y="56" font-family="Inter" font-weight="500" font-size="5" fill="#0A2540" opacity="0.6" text-anchor="middle">Mayo · 2026</text>
        <circle cx="88" cy="50" r="4" fill="#60A5FA"/>
        `,
      ),
  },
  {
    id: "tpl-tiktok-tutorial",
    skillId: "tiktok-cover",
    category: "reel",
    title: "TikTok · Tutorial corto",
    description: "Cover vertical · pasos numerados para hook educativo",
    persona: "mark",
    brief:
      "Cover de TikTok · tutorial 'Cómo automatizar tu agenda en 3 pasos'. Pasos numerados grandes, fondo cream, CTA implícito.",
    thumb: () =>
      svg(
        `
        <text x="50" y="22" font-family="Inter" font-weight="700" font-size="5" fill="#60A5FA" text-anchor="middle">TUTORIAL</text>
        <text x="50" y="38" font-family="Inter" font-weight="900" font-size="12" fill="#0A2540" text-anchor="middle">Agenda</text>
        <text x="50" y="52" font-family="Inter" font-weight="900" font-size="12" fill="#0A2540" text-anchor="middle">en 3 pasos</text>
        <circle cx="26" cy="74" r="6" fill="#60A5FA"/>
        <text x="26" y="77" font-family="Inter" font-weight="900" font-size="7" fill="white" text-anchor="middle">1</text>
        <circle cx="50" cy="74" r="6" fill="#34D399"/>
        <text x="50" y="77" font-family="Inter" font-weight="900" font-size="7" fill="white" text-anchor="middle">2</text>
        <circle cx="74" cy="74" r="6" fill="#FAD19E"/>
        <text x="74" y="77" font-family="Inter" font-weight="900" font-size="7" fill="#0A2540" text-anchor="middle">3</text>
        `,
        "#FEF3C7",
      ),
  },
  {
    id: "tpl-post-cliente",
    skillId: "fb-ad",
    category: "post",
    title: "Anuncio · Caso cliente",
    description: "Ad cuadrado FB · foto del cliente + métrica + CTA",
    persona: "lua",
    brief:
      "Anuncio Facebook · caso real de cliente · 'María duplicó su agenda en 30 días con Bewe'. Métrica grande, testimonio breve, CTA Probar gratis. Composición lateral con avatar/foto a la derecha.",
    thumb: () =>
      svg(
        `
        <text x="10" y="26" font-family="Inter" font-weight="900" font-size="14" fill="#0A2540">2X</text>
        <text x="10" y="38" font-family="Inter" font-weight="500" font-size="5" fill="#0A2540" opacity="0.7">agenda en 30 días</text>
        <rect x="10" y="48" width="40" height="2" rx="1" fill="#0A2540" opacity="0.4"/>
        <rect x="10" y="53" width="34" height="2" rx="1" fill="#0A2540" opacity="0.4"/>
        <rect x="10" y="58" width="38" height="2" rx="1" fill="#0A2540" opacity="0.4"/>
        <rect x="10" y="76" width="34" height="8" rx="4" fill="#60A5FA"/>
        <circle cx="76" cy="50" r="18" fill="#FAD19E"/>
        <circle cx="76" cy="44" r="6" fill="#0A2540" opacity="0.6"/>
        <path d="M64 60 Q76 52 88 60 L88 68 L64 68 Z" fill="#0A2540" opacity="0.6"/>
        `,
        "#CCFBF1",
      ),
  },
];

export const CATEGORY_LABELS: Record<OpenDesignCategory, string> = {
  post: "Posts",
  reel: "Reels",
  story: "Stories",
  banner: "Banners",
  carrusel: "Carruseles",
  email: "Emails",
};

export const CATEGORY_ORDER: OpenDesignCategory[] = [
  "post",
  "reel",
  "story",
  "banner",
  "carrusel",
  "email",
];

export function getTemplatesByCategory(
  cat: OpenDesignCategory | "all",
): OpenDesignTemplate[] {
  if (cat === "all") return OPEN_DESIGN_TEMPLATES;
  return OPEN_DESIGN_TEMPLATES.filter((t) => t.category === cat);
}
