"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Flame,
  Camera,
  ArrowLeftRight,
  Clock,
  BookOpen,
  Users,
  Music2,
  HeartHandshake,
  Library,
} from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";

interface Trend {
  icon: React.ReactNode;
  title: string;
  desc: string;
  metric?: string;
  tone: "violet" | "ember" | "cyan" | "lime" | "info";
}

const TRENDS: Trend[] = [
  {
    icon: <Camera className="size-3.5" />,
    title: "Behind the scenes",
    desc: "Mostrá el detrás de cámara · setup del día · preparación · proceso real",
    metric: "+2.8× engagement vs producto",
    tone: "violet",
  },
  {
    icon: <ArrowLeftRight className="size-3.5" />,
    title: "Antes vs después",
    desc: "Resultado real de un cliente · clásico que siempre funciona en servicios",
    metric: "Save rate top 5%",
    tone: "ember",
  },
  {
    icon: <Clock className="size-3.5" />,
    title: "Reels < 30 segundos",
    desc: "Cortos superan a largos · hook en los primeros 3 segundos · loop al final",
    metric: "Retención 65%+ vs 30% en largos",
    tone: "cyan",
  },
  {
    icon: <BookOpen className="size-3.5" />,
    title: "Carruseles educativos",
    desc: "5-7 slides · 1 tip por slide · primer slide hook · último slide CTA",
    metric: "Save rate alto · IG empuja",
    tone: "lime",
  },
  {
    icon: <HeartHandshake className="size-3.5" />,
    title: "Storytelling de cliente",
    desc: "Caso real · problema → solución → resultado · más fuerza que feature",
    metric: "+3× shares vs producto",
    tone: "info",
  },
  {
    icon: <Users className="size-3.5" />,
    title: "Mostrá al equipo",
    desc: "Humanizá la marca · caras reales · personalidades · momentos cotidianos",
    metric: "Confianza +40% en PyMEs",
    tone: "violet",
  },
  {
    icon: <Music2 className="size-3.5" />,
    title: "Audios virales con contexto local",
    desc: "Usá trending sounds adaptados a tu nicho · regionalizá el copy",
    metric: "Alcance 5-10× orgánico",
    tone: "ember",
  },
];

const TONE_CLASSES: Record<Trend["tone"], { bg: string; fg: string; border: string }> = {
  violet: {
    bg: "bg-[hsl(var(--brand-violet)/0.08)]",
    fg: "text-[hsl(var(--brand-violet))]",
    border: "border-[hsl(var(--brand-violet)/0.25)]",
  },
  ember: {
    bg: "bg-[hsl(var(--brand-ember)/0.08)]",
    fg: "text-[hsl(var(--brand-ember))]",
    border: "border-[hsl(var(--brand-ember)/0.25)]",
  },
  cyan: {
    bg: "bg-[hsl(var(--brand-cyan)/0.08)]",
    fg: "text-[hsl(var(--brand-cyan))]",
    border: "border-[hsl(var(--brand-cyan)/0.25)]",
  },
  lime: {
    bg: "bg-[hsl(var(--brand-lime)/0.08)]",
    fg: "text-[hsl(var(--brand-lime))]",
    border: "border-[hsl(var(--brand-lime)/0.25)]",
  },
  info: {
    bg: "bg-[hsl(var(--info)/0.08)]",
    fg: "text-[hsl(var(--info))]",
    border: "border-[hsl(var(--info)/0.25)]",
  },
};

/**
 * Tendencias curadas (estáticas) para PyMEs de servicios profesionales.
 * No requiere API · contenido editorial basado en benchmarks 2026 LATAM.
 */
export function TrendsPymes() {
  return (
    <TextureCard className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="size-3.5 text-[hsl(var(--brand-ember))]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Playbook editorial · benchmarks LATAM
        </h3>
        <Badge variant="outline" className="!text-[9px] ml-auto">
          Bewe playbook 2026
        </Badge>
      </div>

      {/* Banner de honestidad · estos benchmarks NO son análisis de la cuenta */}
      <div className="rounded-lg border border-[hsl(var(--brand-violet)/0.35)] bg-[hsl(var(--brand-violet)/0.10)] p-3 flex items-start gap-2.5">
        <Library className="size-4 shrink-0 text-[hsl(var(--brand-violet))] mt-0.5" />
        <div className="min-w-0 text-[10.5px] leading-snug">
          <div className="font-bold text-foreground mb-0.5">
            Playbook editorial Bewe · benchmarks de industria, NO analizados sobre tu cuenta.
          </div>
          <div className="text-foreground/80">
            Estos son patrones observados en PyMEs LATAM 2025-2026 que recomendamos
            probar. No reemplazan el análisis de tu histórico (lo ves arriba en
            heatmap, formato y top/bottom).
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {TRENDS.map((t, i) => {
          const tone = TONE_CLASSES[t.tone];
          return (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className={`rounded-lg border ${tone.border} ${tone.bg} p-3`}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={tone.fg}>{t.icon}</span>
                <span className="text-[11px] font-semibold">{t.title}</span>
                <Badge
                  variant="outline"
                  className="!text-[8.5px] ml-auto !border-[hsl(var(--brand-violet)/0.45)] !text-[hsl(var(--brand-violet))] !bg-[hsl(var(--brand-violet)/0.08)] font-semibold"
                >
                  Playbook 2026
                </Badge>
              </div>
              <div className="text-[10px] text-foreground/80 leading-snug mb-1.5">
                {t.desc}
              </div>
              {t.metric && (
                <div className={`text-[9px] font-mono font-semibold ${tone.fg}`}>
                  → {t.metric}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="text-[9px] text-muted-foreground/70 leading-snug">
        Curado por el equipo de growth Bewe · adaptá cada formato a tu nicho específico
      </div>
    </TextureCard>
  );
}
