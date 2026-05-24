"use client";
/**
 * Intro card · se muestra la PRIMERA vez que un usuario abre el AI dock.
 *  - localStorage key `bw_ai_intro_seen` controla la visibilidad.
 *  - Avatar grande con gradient de la persona seleccionada (Mark o Lúa).
 *  - 3 bullets de capacidades + mini sección "Cómo usarme".
 *  - Acciones: Empezar a chatear · Ver mi config.
 */
import * as React from "react";
import { motion } from "motion/react";
import { Bot, BookmarkPlus, Command, Compass, Settings, Sparkles } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const INTRO_SEEN_KEY = "bw_ai_intro_seen";

interface IntroCardProps {
  onDismiss: () => void;
  onOpenConfig: () => void;
}

export function IntroCard({ onDismiss, onOpenConfig }: IntroCardProps) {
  const { aiPersona, user } = useDashboard();
  const isMark = aiPersona === "mark";
  const displayName = user?.name ?? "amigo";
  const personaLabel = isMark ? "Mark OS" : "Lúa OS";
  const tagline = isMark
    ? "tu copiloto de pauta · formal con humor seco"
    : "tu copiloto de pauta · cálida y directa";

  return (
    <motion.div
      key="intro-card"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-full flex flex-col px-4 py-5 overflow-y-auto"
    >
      {/* Avatar grande con halo */}
      <div className="flex flex-col items-center text-center mb-4">
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.05 }}
          className="relative"
        >
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-2xl blur-xl opacity-70 -z-10",
              isMark
                ? "bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]"
                : "bg-gradient-to-br from-[hsl(var(--brand-ember))] to-[hsl(var(--brand-violet))]",
            )}
          />
          <div
            className={cn(
              "size-16 rounded-2xl grid place-items-center text-white shadow-[0_12px_32px_-8px_hsl(var(--brand-violet)/0.55)]",
              isMark
                ? "bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--primary))] to-[hsl(var(--brand-cyan))]"
                : "bg-gradient-to-br from-[hsl(var(--brand-ember))] via-[hsl(var(--primary))] to-[hsl(var(--brand-violet))]",
            )}
          >
            {isMark ? <Bot className="size-8" /> : <Sparkles className="size-8" />}
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-4 font-display text-lg font-bold tracking-tight"
        >
          Hola {displayName}, soy{" "}
          <span
            className={cn(
              "bg-clip-text text-transparent",
              isMark
                ? "bg-gradient-to-r from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]"
                : "bg-gradient-to-r from-[hsl(var(--brand-ember))] to-[hsl(var(--brand-violet))]",
            )}
          >
            {personaLabel}
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="text-[12px] text-muted-foreground mt-0.5"
        >
          {tagline}
        </motion.p>
      </div>

      {/* Bullets de capacidades */}
      <motion.ul
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 text-[12.5px] leading-relaxed mb-4"
      >
        {[
          "Leo el plan Julián, datos en vivo de Meta, y reglas inviolables al instante.",
          "Recomiendo movimientos por campaña con magnitud (€/día) y razón.",
          "Aviso si una camp se sale de CPT, pacing, o reglas de Julián.",
          "Recuerdo decisiones entre conversaciones — sin perder hilo.",
        ].map((line) => (
          <li
            key={line}
            className="flex gap-2.5 items-start rounded-lg border border-border/60 bg-background/40 px-3 py-2"
          >
            <span
              className={cn(
                "mt-1 size-1.5 rounded-full shrink-0",
                isMark ? "bg-[hsl(var(--brand-violet))]" : "bg-[hsl(var(--brand-ember))]",
              )}
            />
            <span className="text-foreground/90">{line}</span>
          </li>
        ))}
      </motion.ul>

      {/* Cómo usarme */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-card/70 p-3.5 mb-4"
      >
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Cómo usarme
        </div>
        <ul className="space-y-1.5 text-[12px]">
          <li className="flex items-center gap-2">
            <Command className="size-3.5 text-[hsl(var(--brand-violet))] shrink-0" />
            <span>
              <kbd className="font-mono text-[10.5px] px-1.5 py-0.5 rounded border border-border bg-muted/40">
                Ctrl/Cmd + K
              </kbd>{" "}
              abre o cierra esta ventana
            </span>
          </li>
          <li className="flex items-center gap-2">
            <BookmarkPlus className="size-3.5 text-[hsl(var(--brand-cyan))] shrink-0" />
            <span>
              Botón <strong className="text-foreground">Recordar</strong> guarda decisiones
              para futuras conversaciones
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-[hsl(var(--brand-lime))] shrink-0" />
            <span>Llevo contexto del plan Julián y de cada conversación</span>
          </li>
        </ul>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-auto flex flex-col gap-2"
      >
        <Button
          type="button"
          variant="glow"
          onClick={onDismiss}
          className="w-full gap-2"
        >
          <Sparkles className="size-4" />
          Empezar a chatear
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenConfig}
          className="w-full gap-2 text-[11.5px]"
        >
          <Settings className="size-3.5" />
          Ver mi config · cambiar persona
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70 mt-1">
          <Compass className="size-3" />
          <span>Esta tarjeta solo aparece una vez · puedes verla de nuevo desde Config</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Hook: lee y persiste si el usuario ya vio la intro card. */
export function useIntroSeen() {
  const [seen, setSeen] = React.useState(true); // optimista — evita flash en SSR
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(INTRO_SEEN_KEY);
      setSeen(raw === "1");
    } catch {
      setSeen(true);
    }
  }, []);
  const markSeen = React.useCallback(() => {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setSeen(true);
  }, []);
  const reset = React.useCallback(() => {
    try {
      localStorage.removeItem(INTRO_SEEN_KEY);
    } catch {
      /* ignore */
    }
    setSeen(false);
  }, []);
  return { seen, markSeen, reset };
}
