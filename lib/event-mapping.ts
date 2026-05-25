/**
 * Mapeo canónico de eventos del funnel SaaS Bewe.
 * Cada acción puede medirse desde GA4, Meta CAPI, o ambos.
 */

export type FunnelStage =
  | "impression"
  | "click"
  | "pricing_visit"
  | "whatsapp"
  | "register_intent"
  | "signup"
  | "password"
  | "trial"
  | "subscription";

export interface FunnelEventMapping {
  stage: FunnelStage;
  label: string;
  ga4Event: string | null;
  metaCapiEvent: string | null;
  description: string;
  isConversion: boolean;
}

export const FUNNEL_EVENTS: FunnelEventMapping[] = [
  {
    stage: "impression",
    label: "Impresión",
    ga4Event: null,
    metaCapiEvent: null, // viene del nivel `impressions` no de actions
    description: "Vista del anuncio",
    isConversion: false,
  },
  {
    stage: "click",
    label: "Click al anuncio",
    ga4Event: null,
    metaCapiEvent: "link_click",
    description: "Clic en el anuncio que lleva al sitio",
    isConversion: false,
  },
  {
    stage: "pricing_visit",
    label: "Visita pricing",
    ga4Event: "pricing_page_visited",
    metaCapiEvent: null,
    description: "Interés en planes · no es conversión",
    isConversion: false,
  },
  {
    stage: "whatsapp",
    label: "Click WhatsApp",
    ga4Event: "contact_whatsapp",
    metaCapiEvent: "lead", // Contact en CAPI mapea a lead/contact_whatsapp action
    description: "Intención de contacto comercial",
    isConversion: false,
  },
  {
    stage: "register_intent",
    label: "Click CTA registro",
    ga4Event: "begin_checkout",
    metaCapiEvent: "initiate_checkout",
    description: "Intención de crear cuenta",
    isConversion: false,
  },
  {
    stage: "signup",
    label: "Registro exitoso",
    ga4Event: "sign_up",
    metaCapiEvent: "complete_registration",
    description: "Cuenta creada · PRIMERA CONVERSIÓN REAL",
    isConversion: true,
  },
  {
    stage: "password",
    label: "Contraseña creada",
    ga4Event: "password_created",
    metaCapiEvent: null,
    description: "Cuenta activada completamente",
    isConversion: true,
  },
  {
    stage: "trial",
    label: "Trial iniciado",
    ga4Event: "trial_started",
    metaCapiEvent: "start_trial",
    description: "Inicio del período de prueba",
    isConversion: true,
  },
  {
    stage: "subscription",
    label: "Conversión a pago",
    ga4Event: "subscription_converted",
    metaCapiEvent: "subscribe",
    description: "Cliente pagador · conversión final",
    isConversion: true,
  },
];

/** Devuelve el evento Meta CAPI raw que corresponde a una stage */
export function getMetaEvent(stage: FunnelStage): string | null {
  return FUNNEL_EVENTS.find((e) => e.stage === stage)?.metaCapiEvent ?? null;
}

/** Devuelve el evento GA4 que corresponde a una stage */
export function getGA4Event(stage: FunnelStage): string | null {
  return FUNNEL_EVENTS.find((e) => e.stage === stage)?.ga4Event ?? null;
}
