"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryPillProps {
  count: number;
  rulesCount: number;
  className?: string;
}

/**
 * Chip compacto que muestra cuántas entradas hay en la memoria persistente del agente.
 * Renderiza en el header del AI Dock junto al título.
 */
export function MemoryPill({ count, rulesCount, className }: MemoryPillProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      title={`${rulesCount} reglas · ${count} entradas guardadas`}
      aria-label={`Memoria del agente: ${rulesCount} reglas, ${count} entradas`}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full",
        "bg-[hsl(var(--brand-violet)/0.18)] border border-[hsl(var(--brand-violet)/0.35)]",
        "text-[9.5px] font-mono font-semibold text-[hsl(var(--brand-violet))]",
        className,
      )}
    >
      <Brain className="size-2.5" />
      {rulesCount}+{count}
    </motion.span>
  );
}
