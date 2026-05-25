"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Bot, Sparkles } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";

interface DockButtonProps {
  onClick: () => void;
  unread: number;
}

/**
 * FAB de la esquina inferior derecha. Click → abre el dock con animación blossom.
 * Hover: scale + halo gradiente. Si hay unread > 0 → badge rojo numérico.
 * Gradiente y icono cambian según la persona seleccionada (Mark o Lúa).
 */
export function DockButton({ onClick, unread }: DockButtonProps) {
  const { aiPersona } = useDashboard();
  const isMark = aiPersona === "mark";
  const personaLabel = isMark ? "Mark OS" : "Lúa OS";

  return (
    <motion.button
      data-tour="ai-fab"
      type="button"
      onClick={onClick}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.2, opacity: 0, borderRadius: "50%" }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformOrigin: "100% 100%" }}
      className={cn(
        "group relative size-14 rounded-full",
        "bg-gradient-to-br",
        isMark
          ? "from-[hsl(var(--brand-violet))] via-[hsl(var(--primary))] to-[hsl(var(--brand-cyan))]"
          : "from-[hsl(var(--brand-ember))] via-[hsl(var(--primary))] to-[hsl(var(--brand-violet))]",
        "text-white shadow-[0_12px_32px_-8px_hsl(var(--brand-violet)/0.6)]",
        "grid place-items-center select-none",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      aria-label={`Abrir ${personaLabel}`}
      title={`${personaLabel} · Ctrl/Cmd + K`}
    >
      {/* Halo pulsante */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full opacity-50 blur-xl -z-10 animate-pulse-glow bg-gradient-to-br",
          isMark
            ? "from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]"
            : "from-[hsl(var(--brand-ember))] to-[hsl(var(--brand-violet))]",
        )}
      />
      {/* Ring giratorio sutil al hover */}
      <span
        aria-hidden
        className="absolute -inset-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: isMark
            ? "conic-gradient(from 0deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)), hsl(var(--brand-lime)), hsl(var(--brand-violet)))"
            : "conic-gradient(from 0deg, hsl(var(--brand-ember)), hsl(var(--brand-violet)), hsl(var(--brand-cyan)), hsl(var(--brand-ember)))",
          maskImage: "radial-gradient(circle, transparent 64%, black 65%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 64%, black 65%)",
          animation: "border-spin 5s linear infinite",
        }}
      />
      {isMark ? (
        <Bot className="size-6 relative z-10" />
      ) : (
        <Sparkles className="size-6 relative z-10" />
      )}
      {unread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[hsl(var(--destructive))] text-[10px] font-bold font-mono grid place-items-center border-2 border-background"
        >
          {unread > 9 ? "9+" : unread}
        </motion.span>
      )}
    </motion.button>
  );
}
