/**
 * Mejor hora para publicar — helper.
 *
 * V1: hardcoded best-practices 2026 con foco audiencia LATAM/MX.
 * Cuando llegue audiencia real (IG audience demographics + lifetime online),
 * podemos calcular ventana real con activity peak. Por ahora exponemos un
 * objeto explicado para que la UI muestre "por qué".
 */

export type Platform = "ig" | "fb";

export interface AudienceData {
  /** Distribución horaria 0-23 (suma = 1 idealmente). */
  hourlyActivity?: number[];
  /** Distribución diaria 0=lunes..6=domingo. */
  weekdayActivity?: number[];
  /** Timezone IANA del seguidor mayoritario · ej "America/Mexico_City". */
  primaryTimezone?: string;
}

export interface BestTimeRecommendation {
  weekday: string;
  hour: string;
  rationale: string;
  /** Score 0-100 confidence en la recomendación. */
  confidence: number;
  /** Top 3 ventanas alternativas. */
  alternatives: Array<{ label: string; reason: string }>;
}

const HARDCODED: Record<Platform, BestTimeRecommendation> = {
  ig: {
    weekday: "Martes y Jueves",
    hour: "19:00 – 21:00 (hora local audiencia)",
    rationale:
      "Pico engagement IG audiencia LATAM en evenings (post-trabajo) + mid-week (no se mezcla con tráfico de finde). Reels en este slot tienen 30-40% más alcance.",
    confidence: 72,
    alternatives: [
      {
        label: "Domingo 11:00 – 13:00",
        reason: "Brunch scroll · alto save rate para contenido aspiracional.",
      },
      {
        label: "Miércoles 12:30 – 13:30",
        reason: "Pausa de almuerzo workdays · bueno para tips cortos.",
      },
      {
        label: "Sábado 20:00 – 22:00",
        reason: "Prime time entretenimiento · ideal Reels virales.",
      },
    ],
  },
  fb: {
    weekday: "Miércoles y Domingo",
    hour: "13:00 – 16:00 (hora local audiencia)",
    rationale:
      "FB tiene pico mediodía workdays + sunday afternoons. Audiencia 35+ activa en lunch break y descanso dominical.",
    confidence: 68,
    alternatives: [
      {
        label: "Jueves 19:00 – 21:00",
        reason: "Final de jornada · alta interacción en grupos locales.",
      },
      {
        label: "Sábado 10:00 – 12:00",
        reason: "Mañana relajada · contenido informativo y community.",
      },
      {
        label: "Lunes 09:00 – 10:00",
        reason: "Inicio de semana · anuncios corporativos rinden bien.",
      },
    ],
  },
};

/**
 * Obtiene la mejor hora recomendada para una plataforma.
 * Si llegan datos reales de audiencia, calcula el pico horario y combina con
 * baseline hardcoded. Si no hay datos, retorna baseline puro.
 */
export function bestTimeForPlatform(
  platform: Platform,
  audience?: AudienceData,
): BestTimeRecommendation {
  const base = HARDCODED[platform];

  if (!audience?.hourlyActivity || audience.hourlyActivity.length !== 24) {
    return base;
  }

  // Calcular pico real
  let peakHour = 0;
  let peakVal = -1;
  audience.hourlyActivity.forEach((v, h) => {
    if (v > peakVal) {
      peakVal = v;
      peakHour = h;
    }
  });
  const peakStart = String(peakHour).padStart(2, "0");
  const peakEnd = String((peakHour + 2) % 24).padStart(2, "0");

  return {
    ...base,
    hour: `${peakStart}:00 – ${peakEnd}:00 (calculado de tu audiencia real)`,
    rationale: `Pico de actividad de tus seguidores en ${peakStart}:00. ${base.rationale}`,
    confidence: Math.min(95, base.confidence + 18),
  };
}

/** Devuelve recomendación para múltiples plataformas. */
export function bestTimeMulti(
  platforms: Platform[],
  audience?: AudienceData,
): Record<Platform, BestTimeRecommendation | undefined> {
  return {
    ig: platforms.includes("ig") ? bestTimeForPlatform("ig", audience) : undefined,
    fb: platforms.includes("fb") ? bestTimeForPlatform("fb", audience) : undefined,
  };
}

/** Reglas 2026 generales para engagement orgánico. */
export const RULES_2026: Array<{ icon: string; title: string; detail: string }> = [
  {
    icon: "🎬",
    title: "Reels > posts estáticos",
    detail: "Meta priorizó video en feed. Reels tienen 2× alcance orgánico vs foto.",
  },
  {
    icon: "📚",
    title: "Carruseles ganan",
    detail: "Carrusel genera 1.5× más engagement que single image · más tiempo en pantalla.",
  },
  {
    icon: "✂️",
    title: "Hook en 7 palabras",
    detail: 'IG corta el caption al "Ver más". El gancho viral va al inicio.',
  },
  {
    icon: "#️⃣",
    title: "5-10 hashtags",
    detail: "Más de 10 te bajan a la categoría spam. Mix high-volume + nicho.",
  },
  {
    icon: "📆",
    title: "Frecuencia ideal",
    detail: "1 post/día IG · 3-5/semana FB · Stories diarios sostienen alcance del feed.",
  },
  {
    icon: "💾",
    title: "Saves > likes",
    detail: 'El save es la señal #1 del algoritmo. Pide explícitamente "guarda este post".',
  },
  {
    icon: "🤝",
    title: "DMs cuentan",
    detail: 'CTA "DM" cuenta como conversación de alto valor para el ranking.',
  },
  {
    icon: "⏱️",
    title: "Primeros 60 min",
    detail: "Engagement en la primera hora determina el alcance las siguientes 24h.",
  },
];
