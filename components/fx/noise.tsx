import { cn } from "@/lib/utils";

/** Full-area subtle noise + radial vignette to add depth (premium feel).
 *  Si no se pasa opacity, usa --fx-grain (0.04 dark · 0.02 light). */
export function NoiseBackdrop({
  className,
  opacity,
}: {
  className?: string;
  opacity?: number;
}) {
  const style =
    opacity !== undefined
      ? { opacity }
      : ({ opacity: "var(--fx-grain, 0.05)" } as React.CSSProperties);
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 bg-grain-overlay mix-blend-overlay",
        className,
      )}
      style={style}
    />
  );
}
