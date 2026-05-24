"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle } from "lucide-react";
import { triggerWelcomeAgain } from "@/components/onboarding/welcome-tour";

/**
 * Botón "?" en el topbar para re-disparar el welcome tour.
 * El usuario reportó que no encontraba forma de volver a ver el onboarding.
 */
export function RestartTourButton() {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        onClick={triggerWelcomeAgain}
        title="Ver tour de bienvenida"
        aria-label="Ver tour de bienvenida"
        className="inline-flex items-center justify-center size-8 rounded-full border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        <HelpCircle className="size-3.5" />
      </button>
      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-mono text-muted-foreground shadow-lg pointer-events-none"
          >
            Ver tour de bienvenida
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
