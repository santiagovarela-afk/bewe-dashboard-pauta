"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExplainedMetricProps {
  children: React.ReactNode;
  explanation: React.ReactNode;
  className?: string;
  /** Anchura del tooltip en px (default 280). */
  width?: number;
}

const TOOLTIP_W_DEFAULT = 280;
const VIEWPORT_PAD = 12;
const GAP = 8;

/**
 * Tooltip portaleado al body para evitar problemas de z-index / overflow:hidden
 * dentro de cards o modales (caso reportado: tooltip tapado por el modal de
 * "Resumen para Julián").
 *
 * Posicionamiento automático: prefiere abajo, salta arriba si no cabe; clampea
 * lateralmente al viewport.
 */
export function ExplainedMetric({
  children,
  explanation,
  className,
  width = TOOLTIP_W_DEFAULT,
}: ExplainedMetricProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; placement: "top" | "bottom" }>(
    { top: 0, left: 0, placement: "bottom" },
  );

  React.useEffect(() => setMounted(true), []);

  // Recalcula posición cuando abre o al hacer resize/scroll
  React.useLayoutEffect(() => {
    if (!open) return;
    function compute() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const w = Math.min(width, vw - VIEWPORT_PAD * 2);
      // estimado de altura (se ajusta al render real, pero esto evita pop)
      const hEstimate = 120;
      const fitsBelow = r.bottom + GAP + hEstimate < vh - VIEWPORT_PAD;
      const placement: "top" | "bottom" = fitsBelow ? "bottom" : "top";
      const top =
        placement === "bottom" ? r.bottom + GAP : Math.max(VIEWPORT_PAD, r.top - GAP - hEstimate);
      // Centrar bajo el anchor lateralmente, clampear a viewport
      let left = r.left + r.width / 2 - w / 2;
      if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
      if (left + w > vw - VIEWPORT_PAD) left = vw - VIEWPORT_PAD - w;
      setPos({ top, left, placement });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, width]);

  // ESC cierra
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const tooltip =
    open && mounted
      ? createPortal(
          <AnimatePresence>
            <motion.div
              key="explained-tooltip"
              initial={{ opacity: 0, y: pos.placement === "bottom" ? -6 : 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pos.placement === "bottom" ? -6 : 6, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              role="tooltip"
              className="fixed z-[300] rounded-lg border border-border bg-popover/95 text-popover-foreground backdrop-blur-xl shadow-2xl p-3 text-[11px] leading-relaxed pointer-events-auto"
              style={{
                top: pos.top,
                left: pos.left,
                width: Math.min(width, typeof window !== "undefined" ? window.innerWidth - VIEWPORT_PAD * 2 : width),
              }}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              {explanation}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div
      ref={anchorRef}
      className={cn("relative inline-flex items-center gap-1", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <button
        type="button"
        className="size-3.5 grid place-items-center rounded-full text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Más información"
        aria-expanded={open}
      >
        <Info className="size-3" />
      </button>
      {tooltip}
    </div>
  );
}
