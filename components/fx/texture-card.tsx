import * as React from "react";
import { cn } from "@/lib/utils";

/** Cult/ui-inspired textured card with subtle grain + gradient border.
 *  Grain opacity y top-line se ajustan según tema via CSS vars. */
export const TextureCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative isolate rounded-xl border border-border bg-card text-card-foreground overflow-hidden",
        // grain overlay opacity desde --fx-grain (0.04 dark · 0.02 light)
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-grain-overlay before:opacity-[var(--fx-grain,0.04)] before:mix-blend-overlay before:z-0",
        // hairline top — más sutil en light
        "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-foreground/15 after:to-transparent after:z-10",
        // soft tinted shadow en light, plana en dark
        "dark:shadow-none shadow-[0_1px_2px_hsl(var(--fx-shadow-tint)/0.05),0_8px_24px_-14px_hsl(var(--fx-shadow-tint)/0.18)]",
        className,
      )}
      style={style}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
});
TextureCard.displayName = "TextureCard";
