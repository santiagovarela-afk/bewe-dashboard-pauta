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
        "inline-flex rounded-xl border border-border/40 bg-card/40 p-1 backdrop-blur",
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
              "px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex flex-col items-center leading-tight",
              active
                ? "bg-[hsl(var(--brand-violet))] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{opt.label}</span>
            {opt.hint && (
              <span
                className={cn(
                  "text-[9px] font-medium mt-0.5 opacity-80",
                  active ? "text-white/80" : "text-muted-foreground/70",
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
