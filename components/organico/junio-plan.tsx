"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Target,
  Sparkles,
  CheckCircle2,
  Hash,
  Lightbulb,
  Clock,
  Film,
  Image as ImageIcon,
  Layers,
  ArrowRight,
} from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { StaggerGroup, StaggerItem } from "@/components/fx/reveal";

/**
 * Plan Editorial Junio · Orgánico. NO calcula desde data viva · es un
 * plan-propuesta hardcodeado basado en los aprendizajes de mayo.
 */

type DayFormat =
  | "Reel"
  | "Carrusel"
  | "Post"
  | "Story"
  | "—";

interface WeekTopic {
  label: string;
  detail: string;
  tone: "violet" | "cyan" | "lime" | "ember";
}

interface DailySlot {
  weekday: string;
  formats: DayFormat[]; // 4 semanas
}

const WEEK_TOPICS: WeekTopic[] = [
  {
    label: "Semana 1 · Onboarding nuevos clientes",
    detail: "Mostrar el flow de alta + primeros wins · empatía vs miedo",
    tone: "violet",
  },
  {
    label: "Semana 2 · Casos de éxito mayo",
    detail: "Testimonios reales · números visibles · before/after",
    tone: "cyan",
  },
  {
    label: "Semana 3 · Behind the scenes equipo Bewe",
    detail: "Humanizar el producto · team-stories · cultura empresa",
    tone: "lime",
  },
  {
    label: "Semana 4 · Tips de marketing para PyMEs",
    detail: "Long-form de valor · save-rate alto · autoridad de marca",
    tone: "ember",
  },
];

const DAILY_SLOTS: DailySlot[] = [
  { weekday: "Lunes", formats: ["Reel", "Story", "Reel", "Carrusel"] },
  { weekday: "Martes", formats: ["Post", "Reel", "Story", "Reel"] },
  { weekday: "Miércoles", formats: ["Reel", "Carrusel", "Reel", "Post"] },
  { weekday: "Jueves", formats: ["Carrusel", "Reel", "Carrusel", "Reel"] },
  { weekday: "Viernes", formats: ["Story", "Post", "Story", "Carrusel"] },
  { weekday: "Sábado", formats: ["—", "Story", "—", "Story"] },
  { weekday: "Domingo", formats: ["Post", "—", "Carrusel", "—"] },
];

const OBJECTIVES: Array<{ label: string; value: string; sub: string }> = [
  {
    label: "Posts feed (Reel + Carrusel + Post)",
    value: "24",
    sub: "6 por semana · vs ~16 en mayo",
  },
  {
    label: "Reels objetivo",
    value: "12",
    sub: "3 por semana · mid-week priorizado",
  },
  {
    label: "Carruseles",
    value: "8",
    sub: "2 por semana · serie save-bait",
  },
  {
    label: "Stories series",
    value: "4 semanales",
    sub: "Onboarding, casos, BTS, tips",
  },
  {
    label: "Engagement rate target",
    value: "3,2%",
    sub: "vs 2,1% media de mayo",
  },
  {
    label: "Save rate target",
    value: "+40%",
    sub: "vs baseline carruseles mayo",
  },
];

const LEARNINGS_MAY: Array<{ icon: React.ReactNode; text: string }> = [
  {
    icon: <Clock className="size-3.5" />,
    text: "Reels mid-week generan 2× engagement vs lun/vie · priorizar miércoles y jueves para Reels.",
  },
  {
    icon: <Sparkles className="size-3.5" />,
    text: "Hora pico 19:00 confirmada en mayo · mantener slot 18:30-19:30 para feed.",
  },
  {
    icon: <Layers className="size-3.5" />,
    text: "Carrusel + caso éxito generó save rate 4× promedio · explotar formato en semana 2.",
  },
  {
    icon: <Hash className="size-3.5" />,
    text: "Captions 80-150 palabras superaron a las cortas · long-form con bullets funciona.",
  },
  {
    icon: <Lightbulb className="size-3.5" />,
    text: "Stories series aumentan retención · serie de 5-7 stories en lugar de 1 aislada.",
  },
];

const HASHTAG_GROUPS: Array<{
  label: string;
  hashtags: string[];
  tone: "violet" | "cyan" | "lime" | "ember";
}> = [
  {
    label: "Grupo Bewe · brand",
    hashtags: ["#bewe", "#bewesoftware", "#bewecrm", "#bewegestión"],
    tone: "violet",
  },
  {
    label: "Grupo industria · SaaS PyME",
    hashtags: [
      "#saas",
      "#crmparapymes",
      "#softwarepyme",
      "#emprendedoresLATAM",
      "#digitalizaciónPyME",
    ],
    tone: "cyan",
  },
  {
    label: "Grupo verticales · clientes",
    hashtags: [
      "#salondebelleza",
      "#barberíadigital",
      "#comerciodigital",
      "#serviciosadomicilio",
      "#agendaonline",
    ],
    tone: "lime",
  },
  {
    label: "Grupo nicho · alta intención",
    hashtags: ["#agendaautomatizada", "#cobromóvil", "#reservaonline"],
    tone: "ember",
  },
];

const TONE_HSL: Record<WeekTopic["tone"], string> = {
  violet: "var(--brand-violet)",
  cyan: "var(--brand-cyan)",
  lime: "var(--brand-lime)",
  ember: "var(--brand-ember)",
};

const FORMAT_META: Record<
  DayFormat,
  { icon: React.ReactNode; tone: "violet" | "ember" | "cyan" | "lime" | "default" }
> = {
  Reel: { icon: <Film className="size-3" />, tone: "violet" },
  Carrusel: { icon: <Layers className="size-3" />, tone: "ember" },
  Post: { icon: <ImageIcon className="size-3" />, tone: "cyan" },
  Story: { icon: <Sparkles className="size-3" />, tone: "lime" },
  "—": { icon: <span className="text-muted-foreground/60">—</span>, tone: "default" },
};

const FORMAT_TONE_CLASS: Record<string, string> = {
  violet:
    "bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet)/0.3)]",
  ember:
    "bg-[hsl(var(--brand-ember)/0.14)] text-[hsl(var(--brand-ember))] border-[hsl(var(--brand-ember)/0.3)]",
  cyan:
    "bg-[hsl(var(--brand-cyan)/0.12)] text-[hsl(var(--brand-cyan))] border-[hsl(var(--brand-cyan)/0.3)]",
  lime:
    "bg-[hsl(var(--brand-lime)/0.14)] text-[hsl(var(--brand-lime))] border-[hsl(var(--brand-lime)/0.3)]",
  default: "bg-secondary/40 text-muted-foreground border-border/40",
};

export function JunioOrganicoPlan() {
  return (
    <div className="space-y-7">
      {/* Header */}
      <TextureCard className="p-5 border-[hsl(var(--brand-violet)/0.4)] bg-gradient-to-br from-[hsl(var(--brand-violet)/0.08)] via-card to-card">
        <div className="flex items-start gap-3">
          <div className="size-11 grid place-items-center rounded-xl bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] shrink-0">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-[hsl(var(--brand-violet))] mb-0.5">
              Plan Editorial Junio 2026
            </div>
            <h2 className="text-base font-bold leading-tight">
              Plan de contenido orgánico · basado en mayo
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
              Calendario propuesto + tópicos semanales + objetivos editoriales.
              Cifras objetivo · no son lo que ya pasó. Revisión cada lunes.
            </p>
          </div>
        </div>
      </TextureCard>

      {/* Calendario 4 semanas × 7 días */}
      <section>
        <SectionHeader
          title="Calendario propuesto · 4 semanas × 7 días"
          sub="Formato sugerido por slot · base para producción semanal"
        />
        <TextureCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-bold">Día</th>
                  {[1, 2, 3, 4].map((w) => (
                    <th key={w} className="text-left p-3 font-bold">
                      Semana {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAILY_SLOTS.map((slot, i) => (
                  <motion.tr
                    key={slot.weekday}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-t border-border/40 hover:bg-secondary/20"
                  >
                    <td className="p-3 font-semibold text-foreground">
                      {slot.weekday}
                    </td>
                    {slot.formats.map((f, w) => {
                      const meta = FORMAT_META[f];
                      return (
                        <td key={w} className="p-2.5">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold ${FORMAT_TONE_CLASS[meta.tone]}`}
                          >
                            {meta.icon}
                            <span>{f}</span>
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TextureCard>
      </section>

      {/* Tópicos por semana */}
      <section>
        <SectionHeader
          title="Tópicos por semana · narrativa editorial"
          sub="Un ángulo claro cada 7 días · evita dispersión y mejora recall"
        />
        <StaggerGroup className="grid sm:grid-cols-2 gap-3">
          {WEEK_TOPICS.map((t, i) => (
            <StaggerItem key={t.label}>
              <TextureCard
                className="p-4 h-full"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: `hsl(${TONE_HSL[t.tone]})`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="size-8 grid place-items-center rounded-lg shrink-0 font-mono font-bold text-[11px]"
                    style={{
                      background: `hsl(${TONE_HSL[t.tone]} / 0.14)`,
                      color: `hsl(${TONE_HSL[t.tone]})`,
                    }}
                  >
                    S{i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold leading-tight">
                      {t.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {t.detail}
                    </div>
                  </div>
                </div>
              </TextureCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Objetivos editoriales */}
      <section>
        <SectionHeader
          title="Objetivos editoriales junio"
          sub="Metas mensurables · validar a fin de mes contra realidad"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {OBJECTIVES.map((o, i) => (
            <motion.div
              key={o.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TextureCard className="p-4 h-full">
                <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Target className="size-3 text-[hsl(var(--brand-violet))]" />
                  {o.label}
                </div>
                <div className="font-mono text-2xl font-bold text-foreground">
                  {o.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {o.sub}
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Aprendizajes mayo aplicados */}
      <section>
        <SectionHeader
          title="Aprendizajes mayo aplicados"
          sub="Lo que validamos en mayo y aplicamos en junio"
        />
        <div className="space-y-2">
          {LEARNINGS_MAY.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border/50 bg-card/50 p-3 flex items-start gap-2.5"
            >
              <div className="size-6 rounded-md grid place-items-center bg-[hsl(var(--brand-lime)/0.14)] text-[hsl(var(--brand-lime))] shrink-0">
                {l.icon}
              </div>
              <div className="text-[11px] text-foreground leading-relaxed flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="size-3 text-[hsl(var(--brand-lime))] shrink-0" />
                <span className="min-w-0">{l.text}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hashtags target */}
      <section>
        <SectionHeader
          title="Hashtags target · grupos rotativos"
          sub="Combinar 1 brand + 2 industria + 2 vertical en cada post"
        />
        <div className="grid md:grid-cols-2 gap-3">
          {HASHTAG_GROUPS.map((g, i) => (
            <motion.div
              key={g.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TextureCard
                className="p-4 h-full"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: `hsl(${TONE_HSL[g.tone]})`,
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.12em] font-bold mb-2 flex items-center gap-1.5"
                  style={{ color: `hsl(${TONE_HSL[g.tone]})` }}
                >
                  <Hash className="size-3" />
                  {g.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.hashtags.map((h) => (
                    <Badge
                      key={h}
                      variant={g.tone}
                      className="!text-[10px] normal-case tracking-normal font-mono"
                    >
                      {h}
                    </Badge>
                  ))}
                </div>
              </TextureCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer disclaimer */}
      <div className="text-[10px] text-muted-foreground/60 italic leading-relaxed border-t border-border/40 pt-3 flex items-center gap-1.5">
        <ArrowRight className="size-3" />
        Plan vivo · ajustable. Revisión cada lunes en sync editorial. Hard-rule:
        si una pieza no se postea, mover al backlog · no improvisar.
      </div>
    </div>
  );
}
