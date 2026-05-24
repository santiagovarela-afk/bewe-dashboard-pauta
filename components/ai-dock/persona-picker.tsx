"use client";
/**
 * Persona Picker · primera apertura del AI dock.
 *
 * El copiloto aparece SIN nombre, se presenta neutral, y le pide al usuario
 * que elija entre Mark (hombre · formal con humor) o Lúa (mujer · cálida).
 * Hasta que elija, el chat normal queda bloqueado.
 *
 * Una vez elige, `setAiPersona()` del store activa `aiPersonaChosen=true`
 * y desbloquea el flujo normal.
 */
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Bot, Sparkles, ChevronRight } from "lucide-react";
import { useDashboard, type AiPersona } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Choice {
  id: AiPersona;
  name: string;
  gender: "hombre" | "mujer";
  vibe: string;
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
  sample: string;
  letter: string;
}

const CHOICES: Choice[] = [
  {
    id: "mark",
    name: "Mark OS",
    gender: "hombre",
    vibe: "Formal con humor seco · directo · irónico cuando algo va mal",
    gradient: "from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-violet))]",
    Icon: Bot,
    letter: "M",
    sample: "C2 sigue gastando como si no nos importara · siento avisar, Santiago.",
  },
  {
    id: "lua",
    name: "Lúa OS",
    gender: "mujer",
    vibe: "Cálida · atenta · suaviza decisiones difíciles sin perder claridad",
    gradient: "from-[hsl(var(--brand-ember))] via-[hsl(var(--brand-violet))] to-[hsl(var(--brand-violet))]",
    Icon: Moon,
    letter: "L",
    sample: "Oye Santiago, C2 anda flojita esta semana · quizá toca pensar el switch.",
  },
];

interface PersonaPickerProps {
  /** Nombre del usuario · para personalizar la introducción */
  userName?: string;
}

export function PersonaPicker({ userName }: PersonaPickerProps) {
  const { setAiPersona } = useDashboard();
  const [phase, setPhase] = React.useState<"intro" | "choose" | "confirm">("intro");
  const [hovered, setHovered] = React.useState<AiPersona | null>(null);
  const [chosen, setChosen] = React.useState<Choice | null>(null);

  // Después de ~2s en intro, pasar a choose
  React.useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setPhase("choose"), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  function pick(c: Choice) {
    setChosen(c);
    setPhase("confirm");
    // Después de mostrar confirmación, aplica la persona (esto desbloquea el chat)
    setTimeout(() => {
      setAiPersona(c.id);
    }, 1800);
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      <AnimatePresence mode="wait">
        {/* ── Fase 1 · Intro neutral ──────────────────────────────────────── */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center py-6"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
              className="size-16 rounded-3xl bg-gradient-to-br from-muted-foreground/40 via-muted-foreground/20 to-muted-foreground/10 grid place-items-center mb-4 border border-border"
            >
              <Sparkles className="size-7 text-muted-foreground" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-display text-lg font-bold mb-1"
            >
              Hola{userName ? `, ${userName}` : ""}.
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px]"
            >
              Soy tu copiloto de pauta. Todavía no tengo nombre · vamos a elegirlo juntos.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="mt-5 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider"
            >
              <span className="size-1 rounded-full bg-muted-foreground/50 animate-pulse" />
              Pensando…
            </motion.div>
          </motion.div>
        )}

        {/* ── Fase 2 · Choose ─────────────────────────────────────────────── */}
        {phase === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h3 className="font-display text-lg font-bold mb-1">¿Quién quieres que sea?</h3>
              <p className="text-[12px] text-muted-foreground">
                Misma cabeza, distinta voz. Puedes cambiar cuando quieras desde Config.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CHOICES.map((c, i) => (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => pick(c)}
                  className={cn(
                    "group relative flex flex-col items-center text-center rounded-2xl border bg-card/60 px-3 py-5 transition-all overflow-hidden",
                    "hover:border-foreground/40 hover:scale-[1.02] hover:shadow-xl",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    hovered === c.id ? "border-foreground/30" : "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br pointer-events-none",
                      c.gradient,
                    )}
                    style={{ filter: "blur(40px)", transform: "scale(0.7)" }}
                  />
                  <div
                    className={cn(
                      "relative size-14 rounded-2xl bg-gradient-to-br grid place-items-center text-white shadow-lg mb-3 transition-transform group-hover:scale-110",
                      c.gradient,
                    )}
                  >
                    <c.Icon className="size-6" />
                    <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-card border border-border grid place-items-center text-[10px] font-display font-bold">
                      {c.letter}
                    </span>
                  </div>
                  <div className="relative text-[13px] font-semibold mb-0.5">{c.name}</div>
                  <div className="relative text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    {c.gender}
                  </div>
                  <p className="relative text-[11px] text-muted-foreground leading-relaxed mb-2">
                    {c.vibe}
                  </p>
                  <div className="relative text-[10px] italic text-foreground/70 bg-background/60 border border-border/60 rounded-md px-2 py-1.5 min-h-[44px]">
                    “{c.sample}”
                  </div>
                  <div className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--brand-violet))] opacity-0 group-hover:opacity-100 transition-opacity">
                    Elegir <ChevronRight className="size-3" />
                  </div>
                </motion.button>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground/70 text-center mt-2">
              Pista: puedes cambiar de copiloto en <strong className="text-foreground/80">Config → Personalidad del copiloto</strong>.
            </p>
          </motion.div>
        )}

        {/* ── Fase 3 · Confirm ────────────────────────────────────────────── */}
        {phase === "confirm" && chosen && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center py-6"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className={cn(
                "size-20 rounded-3xl bg-gradient-to-br grid place-items-center mb-4 shadow-[0_16px_48px_-8px_hsl(var(--brand-violet)/0.5)]",
                chosen.gradient,
              )}
            >
              <chosen.Icon className="size-9 text-white" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-xl font-bold mb-1"
            >
              Soy {chosen.name}.
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px]"
            >
              {chosen.id === "mark"
                ? "Listo · vamos a sacar esto adelante con la cabeza fría."
                : "Listo · cualquier duda me cuentas, vamos paso a paso."}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-5 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider"
            >
              <span className="size-1 rounded-full bg-[hsl(var(--brand-violet))] animate-pulse" />
              Conectándome al plan…
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
