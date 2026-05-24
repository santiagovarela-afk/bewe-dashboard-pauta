"use client";
/**
 * Persona selector · UI para elegir entre Mark OS y Lúa OS.
 * - 2 cards lado a lado · avatar gradient + descripción + frase ejemplo.
 * - Click → setAiPersona() (persiste en localStorage).
 * - Botón "Saludar" → abre el dock con saludo de muestra usando evento bw:ai-ask.
 */
import * as React from "react";
import { motion } from "motion/react";
import { Bot, Check, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useDashboard, type AiPersona } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { TextureCard } from "@/components/fx/texture-card";
import { INTRO_SEEN_KEY } from "@/components/ai-dock/intro-card";
import { cn } from "@/lib/utils";

interface PersonaMeta {
  id: AiPersona;
  name: string;
  tagline: string;
  description: string;
  example: string;
  greeting: (userName: string) => string;
  gradient: string;
  ring: string;
  chip: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const PERSONAS: PersonaMeta[] = [
  {
    id: "mark",
    name: "Mark OS",
    tagline: "Formal con humor seco",
    description:
      "Respeto, ironía elegante y comentarios afilados. Te avisa de los problemas con una ceja levantada.",
    example: "“C2 sigue gastando como si no nos importara · siento avisar.”",
    greeting: (n) =>
      `Buenas ${n} · soy Mark OS, tu copiloto de pauta. Pregúntame por CPT, pacing, o por C2 — que últimamente da que hablar.`,
    gradient:
      "from-[hsl(var(--brand-violet))] via-[hsl(var(--primary))] to-[hsl(var(--brand-cyan))]",
    ring: "ring-[hsl(var(--brand-violet)/0.6)]",
    chip:
      "bg-[hsl(var(--brand-violet)/0.15)] text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet)/0.4)]",
    Icon: Bot,
  },
  {
    id: "lua",
    name: "Lúa OS",
    tagline: "Cálida, atenta, conversacional",
    description:
      "Misma inteligencia técnica que Mark, con cercanía y empatía. Te lleva de la mano sin perder claridad.",
    example: "“Oye, C2 anda flojita esta semana · quizá toca pensar el switch.”",
    greeting: (n) =>
      `Hola ${n} · soy Lúa OS, tu copiloto de pauta. ¿Por dónde empezamos hoy? Te puedo dar el resumen del mes o revisar una campaña.`,
    gradient:
      "from-[hsl(var(--brand-ember))] via-[hsl(var(--primary))] to-[hsl(var(--brand-violet))]",
    ring: "ring-[hsl(var(--brand-ember)/0.6)]",
    chip:
      "bg-[hsl(var(--brand-ember)/0.15)] text-[hsl(var(--brand-ember))] border-[hsl(var(--brand-ember)/0.4)]",
    Icon: Sparkles,
  },
];

export function PersonaSelector() {
  const { aiPersona, setAiPersona, user } = useDashboard();

  const handleGreet = React.useCallback(
    (p: PersonaMeta) => {
      setAiPersona(p.id);
      try {
        localStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      const name = user?.name ?? "amigo";
      toast.success(`${p.name} listo`, { description: "Abriendo dock con un saludo…" });
      window.dispatchEvent(
        new CustomEvent("bw:ai-ask", { detail: { question: p.greeting(name) } }),
      );
    },
    [setAiPersona, user?.name],
  );

  const handleReplayIntro = React.useCallback(() => {
    try {
      localStorage.removeItem(INTRO_SEEN_KEY);
      toast.success("Tarjeta de presentación reactivada", {
        description: "Aparecerá la próxima vez que abras el copiloto.",
      });
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <TextureCard className="p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Wand2 className="size-4 text-[hsl(var(--brand-violet))]" />
          <h3 className="font-display font-semibold tracking-tight">
            Personalidad del copiloto
          </h3>
        </div>
        <button
          type="button"
          onClick={handleReplayIntro}
          className="text-[10px] font-mono text-muted-foreground hover:text-[hsl(var(--brand-violet))] transition underline-offset-4 hover:underline"
        >
          Ver tarjeta de presentación de nuevo
        </button>
      </div>
      <p className="text-[12px] text-muted-foreground mb-5 leading-relaxed">
        Elige cómo te habla el copiloto. Ambas opciones tienen el mismo conocimiento del
        plan Julián y los datos en vivo — solo cambia el tono.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {PERSONAS.map((p) => {
          const active = aiPersona === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setAiPersona(p.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className={cn(
                "group relative text-left rounded-2xl border p-4 transition",
                "bg-card/60 hover:bg-card",
                active
                  ? cn("border-transparent ring-2 ring-offset-2 ring-offset-background", p.ring)
                  : "border-border",
              )}
              aria-pressed={active}
              aria-label={`Elegir ${p.name}`}
            >
              {/* Halo gradient cuando activo */}
              {active && (
                <motion.span
                  layoutId="persona-active-halo"
                  aria-hidden
                  className={cn(
                    "absolute -inset-px rounded-2xl opacity-50 -z-10 blur-md bg-gradient-to-br",
                    p.gradient,
                  )}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "size-12 rounded-xl grid place-items-center text-white shadow-[0_8px_20px_-8px_hsl(var(--brand-violet)/0.6)] bg-gradient-to-br shrink-0",
                    p.gradient,
                  )}
                >
                  <p.Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display font-bold text-sm">{p.name}</span>
                    <span
                      className={cn(
                        "text-[9px] font-mono uppercase tracking-wider border rounded-full px-1.5 py-0.5",
                        p.chip,
                      )}
                    >
                      {p.tagline}
                    </span>
                    {active && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-[hsl(var(--success))]">
                        <Check className="size-3" />
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-muted-foreground mt-1.5 leading-relaxed">
                    {p.description}
                  </p>
                  <div className="mt-2.5 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 text-[11px] italic text-foreground/80">
                    {p.example}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGreet(p);
                      }}
                      className="gap-1.5 text-[11px] h-7 px-2.5"
                    >
                      <Sparkles className="size-3" />
                      Saludar
                    </Button>
                    {!active && (
                      <span className="text-[10px] font-mono text-muted-foreground/70">
                        Click la card para elegir
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </TextureCard>
  );
}
