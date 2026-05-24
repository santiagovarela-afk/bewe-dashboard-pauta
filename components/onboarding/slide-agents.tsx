"use client";
/**
 * Slide Agents · presentación dual de Mark + Lúa con cards lado a lado.
 *
 * Menciona:
 *  - Memoria del plan Julián (presupuesto, reglas, fechas clave)
 *  - Memoria creativa (sabe los mejores posts, copy, ideas)
 *  - Botón Recordar en cada respuesta
 *  - Atajo Ctrl/Cmd + K desde cualquier tab
 */
import * as React from "react";
import { motion } from "motion/react";
import { Bot, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentCard {
  id: "mark" | "lua";
  name: string;
  vibe: string;
  sample: string;
  letter: string;
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const AGENTS: AgentCard[] = [
  {
    id: "mark",
    name: "Mark",
    vibe: "Formal con humor seco · directo · irónico cuando algo va mal.",
    sample:
      "“C2 sigue gastando como si no nos importara · siento avisar, Santiago.”",
    letter: "M",
    gradient:
      "from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-violet))]",
    Icon: Bot,
    accent: "var(--brand-violet)",
  },
  {
    id: "lua",
    name: "Lúa",
    vibe: "Cálida · atenta · suaviza decisiones difíciles sin perder claridad.",
    sample:
      "“Oye Santiago, C2 anda flojita esta semana · quizá toca pensar el switch.”",
    letter: "L",
    gradient:
      "from-[hsl(var(--brand-ember))] via-[hsl(var(--brand-violet))] to-[hsl(var(--brand-violet))]",
    Icon: Moon,
    accent: "var(--brand-ember)",
  },
];

const FEATURES = [
  {
    icon: "📊",
    text: "Memoria del plan Julián (presupuesto, reglas, fechas clave).",
  },
  {
    icon: "🎨",
    text: "Memoria creativa: conoce tus mejores posts, copy e ideas.",
  },
  {
    icon: "💾",
    text: "Botón Recordar en cada respuesta para guardar hallazgos.",
  },
  {
    icon: "⌨️",
    text: "Atajo Ctrl/Cmd + K desde cualquier tab.",
  },
];

export function SlideAgents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="size-11 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-ember))] grid place-items-center shadow-[0_8px_24px_-8px_hsl(var(--brand-violet)/0.65)] shrink-0">
          <Bot className="size-5 text-white" />
        </div>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">
            Copiloto IA
          </h2>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            Tu copiloto tiene dos formas. Misma cabeza, distinta voz.
          </p>
        </div>
      </div>

      {/* Cards lado a lado */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {AGENTS.map((a, i) => {
          const Icon = a.Icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + 0.1 * i, duration: 0.32 }}
              className="relative rounded-xl border border-border bg-background/40 p-3 overflow-hidden"
            >
              {/* Glow background */}
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 opacity-25 pointer-events-none bg-gradient-to-br",
                  a.gradient,
                )}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "size-9 rounded-xl grid place-items-center bg-gradient-to-br shrink-0 text-white font-bold text-[14px] shadow-[0_4px_14px_-4px_hsl(var(--brand-violet)/0.5)]",
                      a.gradient,
                    )}
                  >
                    {a.letter}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight flex items-center gap-1.5">
                      {a.name}
                      <Icon
                        className="size-3 text-muted-foreground/70"
                        aria-hidden
                      />
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                      {a.id === "mark" ? "Hombre" : "Mujer"}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                  {a.vibe}
                </p>
                <div
                  className="text-[10.5px] italic text-foreground/75 leading-snug border-l-2 pl-2 py-0.5"
                  style={{ borderColor: `hsl(${a.accent}/0.5)` }}
                >
                  {a.sample}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Features list */}
      <ul className="space-y-1.5 text-[12px] text-muted-foreground leading-relaxed">
        {FEATURES.map((f, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + 0.06 * i, duration: 0.28 }}
            className="flex gap-2 items-start"
          >
            <span className="text-[13px] leading-none mt-0.5" aria-hidden>
              {f.icon}
            </span>
            <span>{f.text}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
