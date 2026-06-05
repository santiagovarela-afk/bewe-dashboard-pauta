/**
 * Campaign lifecycle metadata · JUN26
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
  // ── Activas JUN26 ──────────────────────────────────────────────────────
  "52551556599886": {
    state: "active",
    reason: "J1 MX Belleza · continúa de mayo · top converter 50%",
    activatedAt: "2026-05-12",
  },
  "52551557046086": {
    state: "active",
    reason: "J2 LATAM Belleza · continúa de mayo · 2do mejor 45% conv",
    activatedAt: "2026-05-12",
  },
  "52575242767686": {
    state: "active",
    reason: "J3 Belleza Clientes Potenciales · Test A/B · B1 LOK ganador + B2 Advantage+ · objetivo CP",
    activatedAt: "2026-06-01",
  },
  "52567055064286": {
    state: "active",
    reason: "J4 MX Servicios · continúa de mayo · 42% conv · escalar",
    activatedAt: "2026-05-22",
  },
  "52568234737886": {
    state: "active",
    reason: "J5 Remarketing LATAM · fusión de conjuntos · ajustada a €13/día",
    activatedAt: "2026-05-23",
  },
  // ── Pausadas JUN26 ─────────────────────────────────────────────────────
  "52575253372686": {
    state: "active",
    reason: "J6 Academy + Tools · activa · Tráfico PYME · LPV · 47K impresiones",
    activatedAt: "2026-06-01",
  },
  "52579132474486": {
    state: "active",
    reason: "J7 Tools PYME · Calculadora ROI + IG Audit + Comparador · objetivo Clientes Potenciales · €17/día · ACTIVA",
    activatedAt: "2026-06-05",
  },
  // ── Archivadas (mayo · fuera del plan junio) ───────────────────────────
  "52551556733086": {
    state: "paused",
    reason: "MX Comercio · CPL €25 muy alto · apagada definitiva",
    pausedAt: "2026-05-25",
  },
  "52551556895286": {
    state: "paused",
    reason: "MX Servicios original · anomalía pixel · reemplazada por J4",
    pausedAt: "2026-05-22",
  },
  "52551557199886": {
    state: "paused",
    reason: "LATAM Comercio · IC saturada · apagada definitiva",
    pausedAt: "2026-05-22",
  },
  "52551557419286": {
    state: "paused",
    reason: "LATAM Servicios · IC saturada · apagada definitiva",
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
    // JUN26
    MX_LATAM_BELLEZA_CP_TEST_AB_JUN26: "Belleza CP · Test A/B",
    ACADEMY_TOOLS_PYME_JUN26: "Academy + Tools",
    tools_PYME_junio_2026: "Tools PYME · Jun26",
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
 * Regla (en orden de prioridad):
 *   1. Si está en CAMPAIGN_LIFECYCLE como "active" → activa
 *   2. Si Meta API dice status === "ACTIVE" → activa (data viva)
 *   3. Si tuvo gasto > 0 Y status !== "PAUSED" → activa (fallback)
 *   4. Caso contrario → no activa
 */
export function shouldShowAsActive(campaign: { cid: string; spend: number; status?: string }): boolean {
  const entry = CAMPAIGN_LIFECYCLE[campaign.cid];
  if (entry) return entry.state === "active";
  if (campaign.status === "ACTIVE") return true;
  if (campaign.spend > 0 && campaign.status !== "PAUSED") return true;
  return false;
}

/**
 * Severidad gradual de una campaña basada en su CPT vs thresholds.
 *
 * - "healthy": CPT <= warn (verde · todo OK)
 * - "monitor": CPT entre warn y critical (amarillo · monitorear)
 * - "attention": CPT entre critical y 1.5× critical (naranja · acción cercana)
 * - "critical": CPT > 1.5× critical (rojo · crítico real)
 * - "neutral": sin data o flag anomaly (gris)
 *
 * Esto reemplaza el binario "crítico/no crítico" que pintaba TODAS las cards
 * en rojo cuando el CPT estaba por encima del target.
 */
export type CampaignSeverity = "healthy" | "monitor" | "attention" | "critical" | "neutral";

export function getSeverity(
  campaign: { cpt: number | null; flag: string | null },
  thresholds: { warn: number; critical: number },
): CampaignSeverity {
  if (campaign.flag === "anomaly") return "neutral";
  if (campaign.cpt === null) return "neutral";
  if (campaign.cpt > thresholds.critical * 1.5) return "critical";
  if (campaign.cpt > thresholds.critical) return "attention";
  if (campaign.cpt > thresholds.warn) return "monitor";
  return "healthy";
}

/** Label legible para el badge. */
export function severityLabel(s: CampaignSeverity): string {
  switch (s) {
    case "healthy":
      return "OK";
    case "monitor":
      return "Monitorear";
    case "attention":
      return "Atención";
    case "critical":
      return "Crítico";
    case "neutral":
      return "—";
  }
}

/** Tone HSL var name para el styling. */
export function severityTone(s: CampaignSeverity): "success" | "warning" | "ember" | "destructive" | "muted-foreground" {
  switch (s) {
    case "healthy":
      return "success";
    case "monitor":
      return "warning";
    case "attention":
      return "ember";
    case "critical":
      return "destructive";
    case "neutral":
      return "muted-foreground";
  }
}
