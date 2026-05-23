"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  /** width in px */
  width?: number;
  className?: string;
  footer?: React.ReactNode;
}

/**
 * Right-side drawer with spring entrance + backdrop blur.
 * Used for detail panels (anuncio, post, día de parrilla).
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 420,
  className,
  footer,
}: DrawerProps) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            aria-hidden
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            initial={{ x: width + 40, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: width + 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.7 }}
            style={{ width }}
            className={cn(
              "fixed top-0 right-0 z-50 h-full bg-card border-l border-border shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.45)]",
              "flex flex-col",
              className,
            )}
          >
            <header className="flex items-start justify-between gap-3 p-5 border-b border-border/60 shrink-0">
              <div className="min-w-0">
                {title && (
                  <h3 className="text-[13px] font-semibold leading-tight truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">
                    {subtitle}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="size-8 shrink-0 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Cerrar"
              >
                <X className="size-3.5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5 min-h-0">{children}</div>
            {footer && (
              <div className="shrink-0 p-4 border-t border-border/60 bg-card/80">
                {footer}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
