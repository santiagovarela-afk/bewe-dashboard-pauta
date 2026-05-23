"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ThemeAwareOverlay — utility wrapper that emits a CSS gradient overlay
 * tinted differently in light vs dark. Useful for hero sections, drawer
 * headers, or anywhere we need a subtle wash that adapts.
 *
 *  - dark: violet→cyan glow at ~14% alpha
 *  - light: violet→cyan wash at ~6% alpha (no quema)
 */
export function ThemeAwareOverlay({
  className,
  variant = "violet-cyan",
}: {
  className?: string;
  variant?: "violet-cyan" | "ember" | "lime";
}) {
  const grad =
    variant === "ember"
      ? "linear-gradient(135deg, hsl(var(--brand-ember) / var(--ov-a, 0.14)) 0%, transparent 60%)"
      : variant === "lime"
        ? "linear-gradient(135deg, hsl(var(--brand-lime) / var(--ov-a, 0.14)) 0%, transparent 60%)"
        : "linear-gradient(135deg, hsl(var(--brand-violet) / var(--ov-a, 0.14)) 0%, hsl(var(--brand-cyan) / calc(var(--ov-a, 0.14) * 0.7)) 60%, transparent 100%)";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        // alpha tuned per theme
        "[--ov-a:0.14] light:[--ov-a:0.06]",
        className,
      )}
      style={{ background: grad }}
    />
  );
}
