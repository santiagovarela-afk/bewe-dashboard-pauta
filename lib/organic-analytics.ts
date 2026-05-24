/**
 * Funciones puras para análisis del contenido orgánico.
 *
 * Toma posts ya normalizados (IG/FB) y devuelve métricas derivadas:
 *  - mejor día/hora para postear (basado en engagement promedio)
 *  - heatmap día×hora
 *  - performance por formato (image/video/carousel)
 *  - razones (text) para top/bottom posts
 *
 * NO hace fetch · NO inventa datos. Si una métrica no se puede calcular
 * por falta de campos, devuelve null o un string claro.
 */

export interface AnalyticsPost {
  id: string;
  source: "ig" | "fb";
  thumb?: string;
  text?: string;
  likes: number;
  comments: number;
  date?: string;
  permalink?: string;
  type?: string;
  // IG-only enriquecidos:
  video_views?: number;
  media_product_type?: string;
}

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const DAY_NAMES_SHORT = ["D", "L", "M", "X", "J", "V", "S"];

/** Mejor día de la semana basado en engagement promedio por post */
export function bestDayOfWeek(posts: AnalyticsPost[]): {
  day: number;
  dayName: string;
  avgEngagement: number;
  count: number;
} | null {
  if (!posts.length) return null;
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const p of posts) {
    if (!p.date) continue;
    const d = new Date(p.date);
    if (Number.isNaN(d.getTime())) continue;
    const day = d.getDay();
    const eng = p.likes + p.comments;
    const b = buckets.get(day) ?? { sum: 0, count: 0 };
    b.sum += eng;
    b.count += 1;
    buckets.set(day, b);
  }
  if (!buckets.size) return null;
  let best: { day: number; avg: number; count: number } | null = null;
  for (const [day, b] of buckets) {
    const avg = b.sum / b.count;
    if (!best || avg > best.avg) best = { day, avg, count: b.count };
  }
  if (!best) return null;
  return {
    day: best.day,
    dayName: DAY_NAMES[best.day]!,
    avgEngagement: best.avg,
    count: best.count,
  };
}

/** Mejor hora del día (0-23) por engagement promedio */
export function bestHourOfDay(posts: AnalyticsPost[]): {
  hour: number;
  label: string;
  avgEngagement: number;
  count: number;
} | null {
  if (!posts.length) return null;
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const p of posts) {
    if (!p.date) continue;
    const d = new Date(p.date);
    if (Number.isNaN(d.getTime())) continue;
    const hr = d.getHours();
    const eng = p.likes + p.comments;
    const b = buckets.get(hr) ?? { sum: 0, count: 0 };
    b.sum += eng;
    b.count += 1;
    buckets.set(hr, b);
  }
  if (!buckets.size) return null;
  let best: { hour: number; avg: number; count: number } | null = null;
  for (const [hour, b] of buckets) {
    const avg = b.sum / b.count;
    if (!best || avg > best.avg) best = { hour, avg, count: b.count };
  }
  if (!best) return null;
  return {
    hour: best.hour,
    label: `${best.hour.toString().padStart(2, "0")}:00`,
    avgEngagement: best.avg,
    count: best.count,
  };
}

export interface HeatmapCell {
  day: number; // 0=Domingo
  hour: number; // 0..23
  avg: number;
  count: number;
}

/** Heatmap día×hora con engagement promedio. Devuelve 7×24 cells (solo los con count>0) */
export function buildHeatmap(posts: AnalyticsPost[]): {
  cells: HeatmapCell[];
  max: number;
  daysShort: string[];
} {
  const map = new Map<string, { sum: number; count: number; day: number; hour: number }>();
  for (const p of posts) {
    if (!p.date) continue;
    const d = new Date(p.date);
    if (Number.isNaN(d.getTime())) continue;
    const day = d.getDay();
    const hour = d.getHours();
    const k = `${day}-${hour}`;
    const eng = p.likes + p.comments;
    const b = map.get(k) ?? { sum: 0, count: 0, day, hour };
    b.sum += eng;
    b.count += 1;
    map.set(k, b);
  }
  const cells: HeatmapCell[] = [];
  let max = 0;
  for (const b of map.values()) {
    const avg = b.sum / b.count;
    cells.push({ day: b.day, hour: b.hour, avg, count: b.count });
    if (avg > max) max = avg;
  }
  return { cells, max, daysShort: DAY_NAMES_SHORT };
}

export interface FormatStats {
  format: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "OTHER";
  label: string;
  count: number;
  avgEngagement: number;
  totalLikes: number;
  totalComments: number;
  best: AnalyticsPost | null;
}

const FORMAT_LABEL: Record<FormatStats["format"], string> = {
  IMAGE: "Imagen",
  VIDEO: "Video / Reel",
  CAROUSEL_ALBUM: "Carrusel",
  OTHER: "Otros",
};

/** Performance agrupado por media_type (IG). FB cae en OTHER si no informa type. */
export function performanceByFormat(posts: AnalyticsPost[]): FormatStats[] {
  const groups = new Map<FormatStats["format"], AnalyticsPost[]>();
  for (const p of posts) {
    const t = (p.type ?? "").toUpperCase();
    const key: FormatStats["format"] =
      t === "IMAGE" || t === "VIDEO" || t === "CAROUSEL_ALBUM" ? t : "OTHER";
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }
  const out: FormatStats[] = [];
  for (const [format, arr] of groups) {
    const totalLikes = arr.reduce((s, p) => s + p.likes, 0);
    const totalComments = arr.reduce((s, p) => s + p.comments, 0);
    const total = totalLikes + totalComments;
    const avg = arr.length ? total / arr.length : 0;
    const best = arr.length
      ? [...arr].sort((a, b) => b.likes + b.comments - (a.likes + a.comments))[0] ?? null
      : null;
    out.push({
      format,
      label: FORMAT_LABEL[format],
      count: arr.length,
      avgEngagement: avg,
      totalLikes,
      totalComments,
      best,
    });
  }
  return out.sort((a, b) => b.avgEngagement - a.avgEngagement);
}

/** Genera razón cualitativa por la cual un post top funcionó. */
export function whyItWorked(post: AnalyticsPost, avgEngagement: number): string {
  const reasons: string[] = [];
  const eng = post.likes + post.comments;

  if (avgEngagement > 0 && eng > avgEngagement * 1.5) {
    const ratio = (eng / avgEngagement).toFixed(1);
    reasons.push(`Engagement ${ratio}× sobre la media (${eng} vs ${avgEngagement.toFixed(0)})`);
  }
  if (post.type === "VIDEO" || post.media_product_type === "REELS") {
    if (post.video_views && post.video_views > 0) {
      reasons.push(`Formato video · ${post.video_views.toLocaleString("es-ES")} views`);
    } else {
      reasons.push("Formato video · empuja alcance orgánico");
    }
  }
  if (post.type === "CAROUSEL_ALBUM") {
    reasons.push("Carrusel · save rate alto · IG favorece este formato");
  }
  if (post.comments >= 5) {
    reasons.push(`Conversación activa · ${post.comments} comentarios`);
  }
  if (post.likes >= 80) {
    reasons.push(`Likes altos · ${post.likes}`);
  }
  if (post.text) {
    const words = post.text.trim().split(/\s+/).length;
    if (words >= 80 && words <= 150) {
      reasons.push(`Long-form que convierte · ${words} palabras`);
    } else if (words < 15) {
      reasons.push("Texto breve · directo al hook");
    }
  }
  if (reasons.length === 0) {
    return "Resultado sólido para la media del período";
  }
  return reasons.slice(0, 3).join(" · ");
}

/** Razón por la cual un bottom-post no performó */
export function whyItFailed(post: AnalyticsPost, avgEngagement: number): string {
  const reasons: string[] = [];
  const eng = post.likes + post.comments;

  if (avgEngagement > 0 && eng < avgEngagement * 0.5) {
    const pct = ((1 - eng / avgEngagement) * 100).toFixed(0);
    reasons.push(`Engagement ${pct}% bajo la media`);
  }
  if (post.likes < 10) {
    reasons.push("Likes muy bajos · hook no enganchó");
  }
  if (post.comments === 0) {
    reasons.push("Sin comentarios · falta llamada a conversación");
  }
  if (post.text) {
    const words = post.text.trim().split(/\s+/).length;
    if (words > 200) {
      reasons.push(`Texto muy largo · ${words} palabras (ideal 80-150)`);
    } else if (words < 5) {
      reasons.push("Caption casi vacío · sin contexto");
    }
  } else {
    reasons.push("Sin caption · IG penaliza por SEO interno");
  }
  if (!post.thumb) {
    reasons.push("Sin imagen principal");
  }
  if (reasons.length === 0) {
    return "Performance bajo la media · revisar hook visual";
  }
  return reasons.slice(0, 3).join(" · ");
}

/** Top N + Bottom N por engagement, ignorando los con eng=0 si hay alternativas */
export function topBottom(
  posts: AnalyticsPost[],
  n = 3,
): { top: AnalyticsPost[]; bottom: AnalyticsPost[]; avgEngagement: number } {
  if (!posts.length) return { top: [], bottom: [], avgEngagement: 0 };
  const sorted = [...posts].sort(
    (a, b) => b.likes + b.comments - (a.likes + a.comments),
  );
  const total = sorted.reduce((s, p) => s + p.likes + p.comments, 0);
  const avg = total / sorted.length;
  const top = sorted.slice(0, n);
  const bottom = sorted.slice(-n).reverse();
  return { top, bottom, avgEngagement: avg };
}

/** Estadísticas agregadas de videos (cuando hay) */
export function videoStats(posts: AnalyticsPost[]): {
  hasVideos: boolean;
  totalVideos: number;
  avgViews: number | null;
  totalViews: number;
  bestVideo: AnalyticsPost | null;
  /** Engagement-rate sobre views si tenemos views */
  engagementRate: number | null;
  /** Avg likes/comments por video */
  avgLikes: number;
  avgComments: number;
} {
  const videos = posts.filter(
    (p) => (p.type ?? "").toUpperCase() === "VIDEO" || p.media_product_type === "REELS",
  );
  if (!videos.length) {
    return {
      hasVideos: false,
      totalVideos: 0,
      avgViews: null,
      totalViews: 0,
      bestVideo: null,
      engagementRate: null,
      avgLikes: 0,
      avgComments: 0,
    };
  }
  const withViews = videos.filter((v) => typeof v.video_views === "number" && v.video_views! > 0);
  const totalViews = withViews.reduce((s, v) => s + (v.video_views ?? 0), 0);
  const avgViews = withViews.length ? totalViews / withViews.length : null;
  const totalLikes = videos.reduce((s, v) => s + v.likes, 0);
  const totalComments = videos.reduce((s, v) => s + v.comments, 0);
  const avgLikes = totalLikes / videos.length;
  const avgComments = totalComments / videos.length;
  const engagementRate =
    avgViews && avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : null;
  const best = [...videos].sort(
    (a, b) => b.likes + b.comments - (a.likes + a.comments),
  )[0] ?? null;
  return {
    hasVideos: true,
    totalVideos: videos.length,
    avgViews,
    totalViews,
    bestVideo: best,
    engagementRate,
    avgLikes,
    avgComments,
  };
}
