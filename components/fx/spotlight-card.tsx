"use client";
import * as React from "react";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** HSL var name (without var()) — e.g. "var(--brand-violet)" */
  spotlightColor?: string;
  /** Override radial gradient alpha. Si no se pasa, usa --fx-spotlight (0.32 dark, 0.18 light). */
  intensity?: number;
}

/** Card with mouse-following radial highlight (cult/ui style). */
export function SpotlightCard({
  className,
  children,
  spotlightColor = "var(--brand-violet)",
  intensity,
  ...props
}: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  // Si pasaron intensity explícita, la usamos. Si no, dejamos que CSS var maneje
  // el contraste por tema (--fx-spotlight): 0.32 dark · 0.18 light.
  const alpha = intensity !== undefined ? intensity : "var(--fx-spotlight, 0.32)";
  const bg = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, hsl(${spotlightColor} / ${alpha}), transparent 70%)`;

  return (
    <div
      onMouseMove={onMove}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-colors",
        className,
      )}
      {...props}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: bg }}
      />
      {children}
    </div>
  );
}
