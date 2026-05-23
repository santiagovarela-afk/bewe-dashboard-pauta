/**
 * Prompts sugeridos contextuales por tab.
 * Se renderizan como chips clickables en el footer del AI Dock.
 */
export const CONTEXTUAL_PROMPTS: Record<string, string[]> = {
  dashboard: [
    "¿Cómo estamos con el CPT global?",
    "¿Qué necesito revisar el día 7?",
    "Dame un resumen para Julián",
  ],
  campanas: [
    "¿Por qué C2 está en crítico?",
    "¿Dónde reasigno budget?",
    "Compara C1 vs C4",
  ],
  estrategia: [
    "¿Qué decisión hay que tomar el día 14?",
    "Explica el semáforo CPT",
    "¿Cuándo se activa C7?",
  ],
  anuncios: [
    "¿Cuál creativo rinde mejor?",
    "¿Qué anuncio pausar primero?",
  ],
  organico: [
    "¿Qué post tuvo más engagement?",
    "¿IG o FB performa mejor?",
  ],
  parrilla: [
    "¿Qué publicar mañana?",
    "Dame 3 ideas para post de servicios",
  ],
  informe: [
    "Mensaje corto para Slack",
    "Email resumen para Julián",
  ],
  config: [
    "¿Cómo obtengo un token Meta?",
    "¿Cómo deployo a Vercel?",
  ],
  paid: [
    "¿Qué plataforma me da mejor CPT?",
    "¿Cuándo conviene activar Google Ads?",
  ],
  seo: [
    "¿Qué keywords priorizar este mes?",
    "Auditoría rápida on-page de bewe.ai",
  ],
  performance: [
    "¿Cuál es nuestro LTV/CAC objetivo?",
    "¿Qué campaña pausar primero por ROAS?",
  ],
  "open-bui": [
    "Sugiere copy para un post de Servicios",
    "Dame 3 ideas para banner C5",
  ],
};

/** Label legible por tab (para el header del chat / saludo). */
export const TAB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  campanas: "Campañas",
  estrategia: "Estrategia",
  anuncios: "Anuncios",
  organico: "Orgánico",
  parrilla: "Parrilla",
  informe: "Informe",
  config: "Config",
  paid: "Paid Media",
  seo: "SEO",
  performance: "Performance",
  "open-bui": "Open BUI",
};

export function promptsFor(tab: string): string[] {
  return CONTEXTUAL_PROMPTS[tab] ?? CONTEXTUAL_PROMPTS.dashboard;
}

export function labelFor(tab: string): string {
  return TAB_LABELS[tab] ?? tab;
}
