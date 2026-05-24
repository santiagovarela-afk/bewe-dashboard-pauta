/**
 * Lógica de alertas inteligentes por anuncio. Detecta fatigue,
 * bajo rendimiento, tráfico bot, hard losses, CPR fuera de target.
 *
 * Targets (Bewe MAY26):
 *   CPR sano  ≤ €5   · warn €5-15 · crítico >€15
 *   CTR sano  ≥ 1.5% · low <1.0%   · bot-like >15%
 *   Freq sana ≤ 2.0  · warn 2-3    · crítico >3
 *   CPM sano  ≤ €9   · alto >€12
 */
import type { MetaAd, AdInsights } from "@/lib/hooks/use-ads";

export type AlertLevel = "critical" | "warning" | "info";

export interface AdAlert {
  level: AlertLevel;
  icon: string;
  /** Key estable para deduplicar / sortear. */
  code:
    | "freq_high"
    | "freq_critical"
    | "ctr_low"
    | "ctr_bot"
    | "spend_no_conv"
    | "cpr_high"
    | "cpm_high"
    | "winner";
  message: string;
  explanation: string;
}

const ACTION_TYPES = {
  cr: "offsite_conversion.fb_pixel_complete_registration",
  ic: "offsite_conversion.fb_pixel_initiate_checkout",
} as const;

function num(s: string | number | undefined | null): number {
  if (s === undefined || s === null) return 0;
  const n = typeof s === "number" ? s : parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export interface DerivedAdMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  frequency: number;
  reach: number;
  cr: number;
  ic: number;
  /** Mejor proxy de "conversiones" (CR si hay, else IC) */
  conversions: number;
  /** Cost per result (spend / conversions) */
  cpr: number | null;
  /** Cost per registro */
  cpl: number | null;
  /** Cost per InitiateCheckout */
  cpTrial: number | null;
}

export function deriveAdMetrics(ins: AdInsights | undefined): DerivedAdMetrics {
  const acts = ins?.actions ?? [];
  const cr = num(acts.find((a) => a.action_type === ACTION_TYPES.cr)?.value);
  const ic = num(acts.find((a) => a.action_type === ACTION_TYPES.ic)?.value);
  const conversions = cr || ic || 0;
  const spend = num(ins?.spend);
  return {
    spend,
    impressions: num(ins?.impressions),
    clicks: num(ins?.clicks),
    ctr: num(ins?.ctr),
    cpm: num(ins?.cpm),
    frequency: num(ins?.frequency),
    reach: num(ins?.reach),
    cr,
    ic,
    conversions,
    cpr: conversions > 0 ? spend / conversions : null,
    cpl: cr > 0 ? spend / cr : null,
    cpTrial: ic > 0 ? spend / ic : null,
  };
}

export function getAdAlerts(ad: MetaAd): AdAlert[] {
  const m = deriveAdMetrics(ad.ins);
  const alerts: AdAlert[] = [];

  // Frecuencia · saturación
  if (m.frequency > 3) {
    alerts.push({
      level: "critical",
      code: "freq_critical",
      icon: "🔁",
      message: `Frecuencia muy alta (${m.frequency.toFixed(2)}×)`,
      explanation:
        "Cada persona vio este anuncio +3 veces. Saturación fuerte · pausar y refrescar creativo o ampliar audiencia ya.",
    });
  } else if (m.frequency > 2) {
    alerts.push({
      level: "warning",
      code: "freq_high",
      icon: "🔁",
      message: `Frecuencia alta (${m.frequency.toFixed(2)}×)`,
      explanation:
        "Las personas vieron este anuncio +2 veces. Posible fatigue · considera refrescar creativo o ampliar audiencia.",
    });
  }

  // CTR bot-like
  if (m.ctr > 15 && m.impressions > 100) {
    alerts.push({
      level: "warning",
      code: "ctr_bot",
      icon: "🤖",
      message: `CTR sospechosamente alto (${m.ctr.toFixed(2)}%)`,
      explanation:
        "Posible tráfico bot o bug de tracking. Revisar en Eventos Manager · contrastar con la calidad de clicks.",
    });
  } else if (m.ctr > 0 && m.ctr < 1 && m.impressions > 1000) {
    // CTR bajo · solo si hay volumen estadísticamente útil
    alerts.push({
      level: "warning",
      code: "ctr_low",
      icon: "👎",
      message: `CTR bajo (${m.ctr.toFixed(2)}%)`,
      explanation:
        "Menos del 1% click-through · el copy o creativo no está enganchando. Target sano: 1.5–2.5%.",
    });
  }

  // Hard loss · gasto sin conversiones
  if (m.spend > 50 && m.conversions === 0) {
    alerts.push({
      level: "critical",
      code: "spend_no_conv",
      icon: "💸",
      message: `€${m.spend.toFixed(2)} gastado · 0 conversiones`,
      explanation:
        "Hard loss · pausar y mover budget a winners. Si el pixel falla, validar tracking antes de descartar el creativo.",
    });
  }

  // CPR sobre target
  if (m.cpr !== null) {
    if (m.cpr > 15) {
      alerts.push({
        level: "warning",
        code: "cpr_high",
        icon: "💰",
        message: `CPR €${m.cpr.toFixed(2)} (target ≤€5)`,
        explanation:
          "Costo por resultado 3× sobre objetivo. Pausar adset o iterar creativo · revisar audiencia + copy.",
      });
    }
  }

  // CPM alto
  if (m.cpm > 12) {
    alerts.push({
      level: "info",
      code: "cpm_high",
      icon: "📊",
      message: `CPM €${m.cpm.toFixed(2)}`,
      explanation:
        "Costo por mil impresiones alto · audiencia premium o competida. Considera ampliar segmentación.",
    });
  }

  // Winner detection · si tiene ≥5 CR y CPR ≤€6
  if (m.conversions >= 5 && m.cpr !== null && m.cpr <= 6) {
    alerts.push({
      level: "info",
      code: "winner",
      icon: "🏆",
      message: `Winner · ${m.conversions} CR @ €${m.cpr.toFixed(2)}`,
      explanation:
        "Anuncio rentable · considera escalar el adset 20% diario y duplicar el concepto creativo en nuevas variantes.",
    });
  }

  return alerts;
}

/** Top-N anuncios para pausar (≥3 alertas o ≥1 crítica). */
export function adsToPause(ads: MetaAd[], min = 1): MetaAd[] {
  return ads
    .map((a) => ({ ad: a, alerts: getAdAlerts(a) }))
    .filter(({ alerts }) =>
      alerts.some((al) => al.level === "critical") || alerts.length >= 3,
    )
    .sort((x, y) => {
      const cx = x.alerts.filter((a) => a.level === "critical").length;
      const cy = y.alerts.filter((a) => a.level === "critical").length;
      if (cy !== cx) return cy - cx;
      return y.alerts.length - x.alerts.length;
    })
    .slice(0, min === 0 ? Infinity : Math.max(min, 6))
    .map(({ ad }) => ad);
}

/** Cuenta máxima criticidad para ordenar/badge. */
export function alertWeight(alerts: AdAlert[]): number {
  return alerts.reduce(
    (s, a) =>
      s + (a.level === "critical" ? 100 : a.level === "warning" ? 10 : 1),
    0,
  );
}

/** Detecta tipo de creativo a partir de los campos del creative. */
export type AdMediaType = "image" | "video" | "carousel" | "unknown";

export function getMediaType(ad: MetaAd): AdMediaType {
  const c = ad.creative;
  if (!c) return "unknown";
  if (c.video_id || c.object_story_spec?.video_data?.video_id) return "video";
  if (c.asset_feed_spec?.videos && c.asset_feed_spec.videos.length > 0)
    return "video";
  // Carrusel: link_data con child_attachments (no expuesto aún). Heurística:
  if (c.object_type === "SHARE" && c.asset_feed_spec?.images && c.asset_feed_spec.images.length > 1)
    return "carousel";
  if (c.image_url || c.image_hash || c.object_story_spec?.link_data?.image_hash)
    return "image";
  if (c.thumbnail_url) return "image";
  return "unknown";
}

/** Mejor thumbnail HD disponible. Reescribe params para forzar resolución. */
export function getBestThumb(ad: MetaAd): string | undefined {
  const c = ad.creative;
  if (!c) return undefined;
  // 1. image_url (HD original de Meta)
  if (c.image_url) return upscaleMetaUrl(c.image_url);
  // 2. story spec image
  if (c.object_story_spec?.link_data?.picture)
    return upscaleMetaUrl(c.object_story_spec.link_data.picture);
  // 3. video preview image HD
  if (c.object_story_spec?.video_data?.image_url)
    return upscaleMetaUrl(c.object_story_spec.video_data.image_url);
  // 4. asset feed first image url
  if (c.asset_feed_spec?.images?.[0]?.url)
    return upscaleMetaUrl(c.asset_feed_spec.images[0].url);
  // 5. video thumbnail from asset feed
  if (c.asset_feed_spec?.videos?.[0]?.thumbnail_url)
    return upscaleMetaUrl(c.asset_feed_spec.videos[0].thumbnail_url);
  // 6. low-res fallback
  return c.thumbnail_url ? upscaleMetaUrl(c.thumbnail_url) : undefined;
}

/** Reescribe URLs scontent/fbcdn quitando el `?p64x64` o forzando preset HD. */
function upscaleMetaUrl(url: string): string {
  try {
    const u = new URL(url);
    // El thumbnail_url legacy viene con ?p64x64 o &d=AQI. Eliminamos límites de tamaño.
    u.searchParams.delete("p64x64");
    u.searchParams.delete("preset");
    return u.toString();
  } catch {
    return url;
  }
}
