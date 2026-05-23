"use client";
import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Animated aurora background — used in hero / login.
 *  Intensities scale via --fx-aurora (1 in dark, 0.45 in light)
 *  so light mode no vibra demasiado. */
export function AuroraBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        "[--aurora-violet:calc(0.55*var(--fx-aurora,1))]",
        "[--aurora-cyan:calc(0.5*var(--fx-aurora,1))]",
        "[--aurora-ember:calc(0.42*var(--fx-aurora,1))]",
        className,
      )}
    >
      <motion.div
        className="absolute -top-1/3 -left-1/4 h-[60vh] w-[60vw] rounded-full blur-3xl opacity-50 dark:opacity-50"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--brand-violet) / var(--aurora-violet)) 0%, transparent 60%)",
        }}
        animate={{ x: [0, 60, -40, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[55vh] w-[55vw] rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--brand-cyan) / var(--aurora-cyan)) 0%, transparent 60%)",
        }}
        animate={{ x: [0, -50, 40, 0], y: [0, 30, -30, 0] }}
        transition={{ duration: 26, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/4 left-1/2 h-[45vh] w-[45vw] rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--brand-ember) / var(--aurora-ember)) 0%, transparent 60%)",
        }}
        animate={{ x: [0, 30, -50, 0], y: [0, -20, 50, 0] }}
        transition={{ duration: 30, ease: "easeInOut", repeat: Infinity }}
      />
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
}
