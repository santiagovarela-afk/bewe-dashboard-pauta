/**
 * Campaign lifecycle metadata · MAY26
 *
 * Estado operativo real de las campañas (activas vs pausadas con razón
 * concreta). Hardcodeado acá porque la API de Meta no expone la "razón"
 * de pausa — es info que vive en el handoff con Julián.
 *
 * Lo del lado de la data viva (spend, conversions, etc.) sigue viniendo
 * del store. Este archivo es SOLO para:
 *   1. Saber por qué una campaña está pausada (sin tener que abrir Slack)
 *   2. Mostrar nombres legibles en lugar de los SKUs largos
 */
import type { Campaign } from "./types";

export type CampaignLifecycleState = "active" | "paused";

export interface CampaignLifecycleEntry {
  state: CampaignLifecycleState;
  /** Razón concreta de pausa o detalle de activación. */
  reason?: string;
  /** ISO YYYY-MM-DD · cuando se activó (si aplica). */
  activatedAt?: string;
  /** ISO YYYY-MM-DD · cuando se pausó (si aplica). */
  pausedAt?: string;
}

/** Estado lifecycle indexado por Meta campaign ID (cid). */
export const CAMPAIGN_LIFECYCLE: Record<string, CampaignLifecycleEntry> = {
  // ── Activas ────────────────────────────────────────────────────────────
  "52567055064286": {
    state: "active",
    reason: "Plan B activado · viernes 22-may · reemplazo de MX_SERVICIOS (anomalía pixel)",
    activatedAt: "2026-05-22",
  },
  "52551557046086": {
    state: "active",
    activatedAt: "2026-05-12",
  },
  "52551556599886": {
    state: "active",
    activatedAt: "2026-05-12",
  },
  // ── Pausadas esta semana ───────────────────────────────────────────────
  "52551556733086": {
    state: "paused",
    reason: "CPR €25 muy alto · pausada lun 25-may",
    pausedAt: "2026-05-25",
  },
  "52551556895286": {
    state: "paused",
    reason: "Anomalía pixel · reemplazada por CONVERSION",
    pausedAt: "2026-05-22",
  },
  "52551557199886": {
    state: "paused",
    reason: "Optimización IC saturada · pausada",
    pausedAt: "2026-05-22",
  },
  "52551557419286": {
    state: "paused",
    reason: "Optimización IC saturada · pausada",
    pausedAt: "2026-05-22",
  },
};

/**
 * Convierte el name técnico de Meta a un display name legible.
 *
 *   MX_BELLEZA_WEB_MAY26              → "MX · Belleza"
 *   CR_PA_CL_CO_BELLEZA_WEB_MAY26     → "LATAM · Belleza"
 *   MX_SERVICIOS_WEB_MAY26_CONVERSION → "MX · Servicios (Conv)"
 *   RETARGETING_LATAM_ONB_MAY26       → "Remarketing LATAM"
 *
 * Fallback: parsea geo + vertical del pattern; si no matchea devuelve name original.
 */
export function getDisplayName(campaignName: string): string {
  if (!campaignName) return campaignName;

  // ── Patrones específicos primero (mejor que regex genérica) ──────────
  const specific: Record<string, string> = {
    MX_BELLEZA_WEB_MAY26: "MX · Belleza",
    MX_COMERCIO_WEB_MAY26: "MX · Comercio",
    MX_SERVICIOS_WEB_MAY26: "MX · Servicios",
    MX_SERVICIOS_WEB_MAY26_CONVERSION: "MX · Servicios (Conv)",
    CR_PA_CL_CO_BELLEZA_WEB_MAY26: "LATAM · Belleza",
    CR_PA_CL_CO_COMERCIO_WEB_MAY26: "LATAM · Comercio",
    CR_PA_CL_CO_SERVICIOS_WEB_MAY26: "LATAM · Servicios",
    RETARGETING_LATAM_ONB_MAY26: "Remarketing LATAM",
  };
  if (campaignName in specific) return specific[campaignName];

  // ── Retargeting/remarketing genérico ─────────────────────────────────
  if (/^RETARGETING/i.test(campaignName) || /^REMARKETING/i.test(campaignName)) {
    if (/LATAM|CR_PA_CL_CO/i.test(campaignName)) return "Remarketing LATAM";
    if (/MX/i.test(campaignName)) return "Remarketing MX";
    return "Remarketing";
  }

  // ── Heurística geo + vertical ────────────────────────────────────────
  const geo = /^MX/i.test(campaignName)
    ? "MX"
    : /CR_PA_CL_CO/i.test(campaignName)
      ? "LATAM"
      : null;
  const vertical = /BELLEZA/i.test(campaignName)
    ? "Belleza"
    : /COMERCIO/i.test(campaignName)
      ? "Comercio"
      : /SERVICIOS/i.test(campaignName)
        ? "Servicios"
        : null;
  const conv = /CONVERSION/i.test(campaignName) ? " (Conv)" : "";

  if (geo && vertical) return `${geo} · ${vertical}${conv}`;

  // Sin match · devolver original
  return campaignName;
}

/** Variante que toma el cid y resuelve el name desde el store de campañas. */
export function getDisplayNameByCid(cid: string, campaigns: Campaign[]): string {
  const c = campaigns.find((x) => x.cid === cid);
  if (!c) return cid;
  return getDisplayName(c.name);
}

/** True si la campaña está en estado active según el lifecycle hardcoded. */
export function isActive(cid: string): boolean {
  return CAMPAIGN_LIFECYCLE[cid]?.state === "active";
}

/** True si la campaña está en estado paused según el lifecycle hardcoded. */
export function isPaused(cid: string): boolean {
  return CAMPAIGN_LIFECYCLE[cid]?.state === "paused";
}

/** Razón concreta de pausa · null si la campaña no está pausada o no tiene razón. */
export function getPausedReason(cid: string): string | null {
  const entry = CAMPAIGN_LIFECYCLE[cid];
  if (!entry || entry.state !== "paused") return null;
  return entry.reason ?? null;
}

/** Tipo operativo de la campaña: CR (CompleteRegistration) · IC (InitiateCheckout) · Retargeting. */
export type CampaignType = "CR" | "IC" | "Retargeting";

/** Infiere el tipo operativo de la campaña desde su `name` y su `event`. */
export function getCampaignType(campaign: { name: string; event?: Campaign["event"] }): CampaignType {
  if (campaign.name && /^RETARGETING|^REMARKETING/i.test(campaign.name)) return "Retargeting";
  if (campaign.event === "InitiateCheckout") return "IC";
  return "CR";
}

/** Etiqueta humana del tipo (para badges en UI). */
export function campaignTypeLabel(type: CampaignType): string {
  switch (type) {
    case "CR":
      return "Completar Registro";
    case "IC":
      return "Pago Iniciado";
    case "Retargeting":
      return "Remarketing";
  }
}

/** Variante de Badge component para el tipo. */
export function campaignTypeBadgeVariant(type: CampaignType): "violet" | "cyan" | "ember" {
  switch (type) {
    case "CR":
      return "violet";
    case "IC":
      return "cyan";
    case "Retargeting":
      return "ember";
  }
}

/**
 * Devuelve true si una campaña debe considerarse "activa" para mostrarse
 * en la sección activa del tab, incluso si no tuvo gasto en el rango.
 *
 * Regla:
 *   1. Si está en CAMPAIGN_LIFECYCLE como "active" → activa
 *   2. Si no está en lifecycle PERO tuvo gasto > 0 → activa (live fallback)
 *   3. Caso contrario → no activa
 */
export function shouldShowAsActive(campaign: { cid: string; spend: number; status?: string }): boolean {
  const entry = CAMPAIGN_LIFECYCLE[campaign.cid];
  if (entry) return entry.state === "active";
  if (campaign.spend > 0 && campaign.status !== "PAUSED") return true;
  return false;
}
