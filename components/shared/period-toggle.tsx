"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Toggle visual reusable para alternar entre "estado actual" y "plan futuro"
 * en distintos tabs (Estrategia, Orgánico). Pill style coherente con el
 * resto del dashboard (border + bg-card translucent + brand-violet activo).
 */
export interface PeriodToggleOption {
  id: string;
  label: string;
  /** Texto pequeño debajo del label, opcional · ej "mayo" / "plan junio". */
  hint?: string;
}

export interface PeriodToggleProps {
  options: PeriodToggleOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function PeriodToggle({
  options,
  value,
  onChange,
  className,
}: PeriodToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-2xl border border-border/60 bg-card/60 p-1.5 backdrop-blur-md shadow-lg",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "px-7 py-3 text-sm font-bold rounded-xl transition-all duration-200 flex flex-col items-center leading-tight min-w-[160px]",
              active
                ? "bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-violet))]/85 text-white shadow-lg shadow-[hsl(var(--brand-violet))]/30 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40",
            )}
          >
            <span className="text-[15px]">{opt.label}</span>
            {opt.hint && (
              <span
                className={cn(
                  "text-[11px] font-medium mt-1 uppercase tracking-wide",
                  active ? "text-white/85" : "text-muted-foreground/60",
                )}
              >
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
