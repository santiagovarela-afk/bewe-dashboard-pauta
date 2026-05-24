"use client";
/**
 * Slide Sections · render reutilizable de un grupo de tabs (Pauta · Contenido · Analítica)
 * mostrando una mini-card por tab con icon + nombre + descripción de qué hace.
 *
 * Usado por los slides 4, 5 y 6 del WelcomeTour.
 */
import * as React from "react";
import { motion } from "motion/react";
import {
  Bot,
  CalendarDays,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Palette,
  Search,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Icon registry para todas las tabs. */
const TAB_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  dashboard: LayoutDashboard,
  campanas: Megaphone,
  estrategia: Target,
  paid: TrendingUp,
  anuncios: ImageIcon,
  organico: Sparkles,
  parrilla: CalendarDays,
  seo: Search,
  performance: Gauge,
  "open-bui": Palette,
  informe: FileText,
  config: Settings2,
};

/** Descripción 1-2 líneas de cada tab — define qué muestra realmente. */
export const TAB_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  dashboard: {
    label: "Dashboard",
    desc: "KPIs globales · alertas operativas · embudo de conversión.",
  },
  campanas: {
    label: "Campañas",
    desc: "Estado de las 6 campañas · pacing · adsets expandibles.",
  },
  estrategia: {
    label: "Estrategia",
    desc: "Semáforos CPT · reglas Julián · proyecciones.",
  },
  paid: {
    label: "Paid Media",
    desc: "Cross-platform Meta + Google + TikTok (placeholders honestos).",
  },
  anuncios: {
    label: "Anuncios",
    desc: "Creativos pagados · sort por CTR · drawer con detalle.",
  },
  organico: {
    label: "Orgánico",
    desc: "Posts IG + FB · comparativo engagement.",
  },
  parrilla: {
    label: "Parrilla",
    desc: "Calendario editorial · composer con plantillas.",
  },
  seo: {
    label: "SEO",
    desc: "Keywords, on-page, AEO (cómo apareces en ChatGPT).",
  },
  performance: {
    label: "Performance",
    desc: "Funnel ejecutivo · CAC, LTV, ROAS.",
  },
  "open-bui": {
    label: "Open Design",
    desc: "Canvas Bewe OS para piezas y mockups.",
  },
  informe: {
    label: "Informe",
    desc: "3 formatos (Slack · Email · Julián completo).",
  },
  config: {
    label: "Config",
    desc: "Tokens · memoria del agente · sesión.",
  },
};

interface SlideSectionsProps {
  /** Heading principal del slide (ej: "Pauta · Inversión"). */
  title: string;
  /** Subtítulo corto (ej: "Donde vive la inversión Meta."). */
  subtitle: string;
  /** Color de acento del grupo (uno de los tokens HSL del theme). */
  accent: string;
  /** Lista de IDs de tabs a mostrar en este slide. */
  tabIds: string[];
  /** Icon principal del slide (header). */
  HeaderIcon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
}

export function SlideSections({
  title,
  subtitle,
  accent,
  tabIds,
  HeaderIcon,
}: SlideSectionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="size-11 rounded-2xl grid place-items-center text-white shrink-0 shadow-[0_8px_24px_-8px_var(--accent-shadow)]"
          style={{
            background: `linear-gradient(135deg, hsl(${accent}), hsl(${accent}/0.6))`,
            ["--accent-shadow" as string]: `hsl(${accent}/0.55)`,
          }}
        >
          <HeaderIcon className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {tabIds.map((id, i) => {
          const meta = TAB_DESCRIPTIONS[id];
          if (!meta) return null;
          const Icon = TAB_ICONS[id] ?? Bot;
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.3 }}
              className={cn(
                "rounded-xl border border-border bg-background/40 p-3",
                "hover:border-foreground/25 hover:bg-background/60 transition group",
              )}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="size-8 rounded-lg grid place-items-center shrink-0 mt-0.5"
                  style={{
                    background: `hsl(${accent}/0.14)`,
                    border: `1px solid hsl(${accent}/0.28)`,
                  }}
                >
                  <Icon
                    className="size-3.5"
                    style={{ color: `hsl(${accent})` }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold leading-tight mb-0.5">
                    {meta.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    {meta.desc}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
