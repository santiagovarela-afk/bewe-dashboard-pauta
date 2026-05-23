"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  title: string;
  body: string;
  /** Optional element selector to highlight visually */
  target?: string;
}

export interface OnboardingTipProps {
  /** Unique storage key per tab — only shows once */
  storageKey: string;
  steps: OnboardingStep[];
  /** Force show ignoring localStorage (dev / "ver de nuevo") */
  forceOpen?: boolean;
  onClose?: () => void;
}

/**
 * OnboardingTip — multi-step intro card.
 * Auto-hides after dismissed (localStorage). Re-show via Settings → "Ver tutorial".
 */
export function OnboardingTip({ storageKey, steps, forceOpen, onClose }: OnboardingTipProps) {
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    try {
      const seen = localStorage.getItem(`bw_onb_${storageKey}`);
      if (!seen) setOpen(true);
    } catch {
      /* ignore */
    }
  }, [storageKey, forceOpen]);

  function dismiss() {
    try {
      localStorage.setItem(`bw_onb_${storageKey}`, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    onClose?.();
  }

  if (!steps.length) return null;
  const step = steps[idx];
  const isLast = idx === steps.length - 1;
  const isFirst = idx === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "relative mb-5 overflow-hidden rounded-xl border border-[hsl(var(--brand-violet)/0.35)]",
            "bg-gradient-to-br from-[hsl(var(--brand-violet)/0.08)] via-card to-[hsl(var(--brand-cyan)/0.06)]",
            "shadow-[0_8px_30px_-12px_hsl(var(--brand-violet)/0.35)]",
          )}
        >
          {/* aurora overlay */}
          <div className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-[hsl(var(--brand-violet)/0.18)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-60 rounded-full bg-[hsl(var(--brand-cyan)/0.15)] blur-3xl" />

          <div className="relative flex items-start gap-4 p-5">
            <div className="size-9 shrink-0 grid place-items-center rounded-lg border border-[hsl(var(--brand-violet)/0.4)] bg-[hsl(var(--brand-violet)/0.15)] text-[hsl(var(--brand-violet))]">
              <Sparkles className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[13px] font-semibold leading-tight">{step.title}</h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {idx + 1}/{steps.length}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{step.body}</p>

              <div className="mt-3 flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={() => setIdx((i) => Math.max(0, i - 1))}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  >
                    <ChevronLeft className="size-3" /> Anterior
                  </button>
                )}
                {!isLast ? (
                  <button
                    onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
                    className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-md bg-[hsl(var(--brand-violet))] text-white hover:brightness-110"
                  >
                    Siguiente <ChevronRight className="size-3" />
                  </button>
                ) : (
                  <button
                    onClick={dismiss}
                    className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-md bg-[hsl(var(--brand-violet))] text-white hover:brightness-110"
                  >
                    Entendido
                  </button>
                )}
                <button
                  onClick={dismiss}
                  className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  No mostrar más
                </button>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="size-7 shrink-0 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label="Cerrar"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
