"use client";
import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LearningCardProps {
  title: string;
  items: string[];
  /** Color HSL var sin var() · ej. "var(--brand-violet)" */
  accent?: string;
  className?: string;
}

/**
 * Card compacta para listar aprendizajes operativos de una campaña.
 * Cada item se anima en stagger desde la izquierda · respeta motion-reduce.
 */
export function LearningCard({
  title,
  items,
  accent = "var(--brand-violet)",
  className,
}: LearningCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-background/40 p-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles
          className="size-3.5"
          style={{ color: `hsl(${accent})` }}
          aria-hidden
        />
        <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h4>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 italic">Sin aprendizajes registrados.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-2 text-[11px] leading-relaxed"
            >
              <CheckCircle2
                className="size-3 mt-0.5 shrink-0"
                style={{ color: `hsl(${accent})` }}
                aria-hidden
              />
              <span className="text-foreground/85">{item}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
