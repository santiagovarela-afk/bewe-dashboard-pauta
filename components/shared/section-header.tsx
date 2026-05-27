import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  /** Muestra la línea divisoria arriba del título. Default true. */
  divider?: boolean;
  /** Color del acento de la barra · default brand-violet. */
  accent?: "violet" | "cyan" | "lime" | "ember" | "success";
}

const ACCENT: Record<NonNullable<SectionHeaderProps["accent"]>, string> = {
  violet: "var(--brand-violet)",
  cyan: "var(--brand-cyan)",
  lime: "var(--brand-lime)",
  ember: "var(--brand-ember)",
  success: "var(--success)",
};

export function SectionHeader({
  title,
  sub,
  right,
  className,
  divider = true,
  accent = "violet",
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-5", className)}>
      {divider && (
        <div
          className="h-px mb-4"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--border)/0.7), hsl(var(--border)/0.15) 60%, transparent)",
          }}
        />
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex items-start gap-3">
          <div
            className="w-[3px] self-stretch min-h-[28px] rounded-full shrink-0"
            style={{
              background: `linear-gradient(180deg, hsl(${ACCENT[accent]}), hsl(${ACCENT[accent]}/0.3))`,
              boxShadow: `0 0 12px -2px hsl(${ACCENT[accent]}/0.5)`,
            }}
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="text-[14px] font-extrabold tracking-tight text-foreground leading-tight">
              {title}
            </h2>
            {sub && (
              <div className="mt-1 text-[11.5px] text-muted-foreground/70 leading-relaxed">
                {sub}
              </div>
            )}
          </div>
        </div>
        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </div>
  );
}
