"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExplainedMetricProps {
  children: React.ReactNode;
  explanation: React.ReactNode;
  className?: string;
}

/**
 * Wrap any element to add an info icon that reveals an explanation on hover.
 * Used by KPIs, métricas, semáforos para que el equipo entienda cada número.
 */
export function ExplainedMetric({ children, explanation, className }: ExplainedMetricProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className={cn("relative inline-flex items-center gap-1", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <button
        type="button"
        className="size-3.5 grid place-items-center rounded-full text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-label="Más información"
      >
        <Info className="size-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full mt-1.5 z-50 w-[240px] rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-3 text-[11px] leading-relaxed text-muted-foreground"
            role="tooltip"
          >
            {explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
