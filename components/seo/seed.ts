/**
 * Seed data SEO · 100% placeholder · honesto y bonito.
 * Cuando se conecte Google Search Console + Ahrefs reemplazaremos
 * estos arreglos por la respuesta real.
 */

export interface SeoKeyword {
  query: string;
  position: number;
  monthlySearches: number;
  clicks: number;
  impressions: number;
  ctr: number;
  intent: "info" | "comercial" | "transaccional" | "navegacional";
}

export interface SeoPage {
  url: string;
  title: string;
  avgPosition: number;
  clicks: number;
  impressions: number;
}

export interface OnPageCheck {
  label: string;
  status: "ok" | "warn" | "fail";
  detail: string;
}

export const SEO_SUMMARY = {
  organicVisits: 12_420,
  organicVisitsDeltaPct: 8.4,
  keywordsRanking: 184,
  keywordsTop10: 42,
  avgPosition: 14.6,
  avgPositionDelta: -1.8, // ↑ subimos en ranking
  organicCtr: 3.2,
  organicCtrDelta: 0.4,
  totalBacklinks: 312,
  referringDomains: 87,
  topRefDomain: "blog.shopify.es",
  domainRating: 32,
};

export const SEO_KEYWORDS: SeoKeyword[] = [
  { query: "software para salones de belleza", position: 4, monthlySearches: 2400, clicks: 240, impressions: 3200, ctr: 7.5, intent: "comercial" },
  { query: "agenda online peluqueria", position: 6, monthlySearches: 1800, clicks: 150, impressions: 2100, ctr: 7.1, intent: "comercial" },
  { query: "app reservas spa", position: 9, monthlySearches: 1100, clicks: 70, impressions: 980, ctr: 7.1, intent: "transaccional" },
  { query: "sistema de citas para barbería", position: 11, monthlySearches: 880, clicks: 38, impressions: 720, ctr: 5.3, intent: "transaccional" },
  { query: "programa de fidelización clientes", position: 14, monthlySearches: 1500, clicks: 32, impressions: 1100, ctr: 2.9, intent: "comercial" },
  { query: "facturación electrónica colombia", position: 17, monthlySearches: 3300, clicks: 28, impressions: 1450, ctr: 1.9, intent: "info" },
  { query: "bewe", position: 1, monthlySearches: 720, clicks: 480, impressions: 690, ctr: 69.6, intent: "navegacional" },
  { query: "crm para estéticas", position: 22, monthlySearches: 590, clicks: 11, impressions: 320, ctr: 3.4, intent: "comercial" },
  { query: "tpv para peluquería precio", position: 28, monthlySearches: 410, clicks: 5, impressions: 180, ctr: 2.8, intent: "transaccional" },
  { query: "como abrir un salón de belleza", position: 33, monthlySearches: 2100, clicks: 8, impressions: 410, ctr: 2.0, intent: "info" },
];

export const SEO_PAGES: SeoPage[] = [
  { url: "/", title: "Bewe · Software para salones", avgPosition: 2.4, clicks: 1840, impressions: 8400 },
  { url: "/blog/agenda-online", title: "Cómo elegir tu agenda online", avgPosition: 5.1, clicks: 920, impressions: 4100 },
  { url: "/blog/fidelizar-clientes", title: "10 ideas para fidelizar", avgPosition: 8.7, clicks: 480, impressions: 2900 },
  { url: "/precios", title: "Planes y precios · Bewe", avgPosition: 6.2, clicks: 410, impressions: 1850 },
  { url: "/funcionalidades/agenda", title: "Agenda con IA · Bewe", avgPosition: 9.4, clicks: 320, impressions: 1640 },
  { url: "/blog/marketing-belleza", title: "Marketing para tu salón", avgPosition: 12.1, clicks: 215, impressions: 1320 },
  { url: "/casos-de-exito", title: "Casos de éxito", avgPosition: 15.8, clicks: 140, impressions: 960 },
];

export const SEO_ONPAGE: OnPageCheck[] = [
  { label: "Title tags únicos", status: "ok", detail: "100% URLs con title único entre 30-60 caracteres" },
  { label: "Meta descriptions", status: "ok", detail: "92% URLs con meta description · 8% pendiente revisar" },
  { label: "H1 únicos por página", status: "ok", detail: "Auditoría Screaming Frog · sin duplicados" },
  { label: "Schema.org markup", status: "warn", detail: "Faltan Article schemas en /blog/* · Product schema OK" },
  { label: "sitemap.xml", status: "ok", detail: "Generado dinámicamente · ping a Google + Bing semanal" },
  { label: "robots.txt", status: "ok", detail: "Permite crawl de prod · bloquea /staging/ y /api/" },
  { label: "Core Web Vitals mobile", status: "warn", detail: "LCP 2.8s · target ≤2.5s · pendiente lazy-load hero" },
  { label: "Core Web Vitals desktop", status: "ok", detail: "LCP 1.4s · CLS 0.02 · INP 180ms" },
  { label: "Indexación", status: "ok", detail: "182/184 URLs indexadas · 2 con noindex intencional" },
  { label: "Canonical tags", status: "ok", detail: "100% URLs canonicalizadas correctamente" },
];

export const SEO_BACKLINK_TOPS = [
  { domain: "blog.shopify.es", dr: 76, links: 14, type: "Editorial" },
  { domain: "merca20.com", dr: 58, links: 8, type: "Editorial" },
  { domain: "entrepreneur.com/mx", dr: 88, links: 3, type: "Mención" },
  { domain: "estilismo.es", dr: 41, links: 22, type: "Guest post" },
  { domain: "salonblog.co", dr: 35, links: 18, type: "Listicle" },
];
