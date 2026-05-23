"use client";
/**
 * Role Tour · mini spotlight con tooltips secuenciales destacando elementos
 * del shell (sidebar, topbar, AI dock).
 *
 * Usa selectores CSS (no `data-tour-id` ya que NO tocamos sidebar).
 * Si un selector no encuentra elemento, ese paso se salta automáticamente.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourStep {
  selector: string;
  title: string;
  body: string;
  placement?: "right" | "left" | "top" | "bottom";
}

const STEPS: TourStep[] = [
  {
    selector: "aside nav",
    title: "Sidebar",
    body: "Navega entre áreas. Las secciones a las que tu rol no tiene acceso aparecen apagadas.",
    placement: "right",
  },
  {
    selector: "main > div:first-of-type",
    title: "Topbar",
    body: "Atajos rápidos: theme, rango de fechas y refresh manual de la API de Meta.",
    placement: "bottom",
  },
  {
    selector: "[aria-label='Abrir asistente IA']",
    title: "Copiloto IA",
    body: "El chat flotante está disponible en todas las tabs. Atajo Ctrl/Cmd+K.",
    placement: "left",
  },
];

interface RoleTourProps {
  open: boolean;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getRect(selector: string): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function RoleTour({ open, onClose }: RoleTourProps) {
  const [step, setStep] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);

  React.useEffect(() => {
    if (!open) {
      setStep(0);
      return;
    }
    // localizar el primer elemento existente desde el step actual
    function locate(from: number) {
      for (let i = from; i < STEPS.length; i++) {
        const r = getRect(STEPS[i].selector);
        if (r) return { idx: i, rect: r };
      }
      return null;
    }
    const found = locate(step);
    if (!found) {
      // ningún elemento del tour disponible → cierra
      onClose();
      return;
    }
    if (found.idx !== step) setStep(found.idx);
    setRect(found.rect);

    function onResize() {
      const r = getRect(STEPS[step].selector);
      if (r) setRect(r);
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, step, onClose]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft" && step > 0) setStep((s) => s - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  function next() {
    if (step >= STEPS.length - 1) onClose();
    else setStep((s) => s + 1);
  }

  if (!open || !rect) return null;

  const current = STEPS[step];
  const placement = current.placement ?? "right";
  const padding = 10;

  // Tooltip position (relativo al spotlight)
  let tipStyle: React.CSSProperties = {};
  const TIP_W = 280;
  const TIP_H = 130;
  if (placement === "right") {
    tipStyle = {
      top: Math.max(16, rect.top + rect.height / 2 - TIP_H / 2),
      left: rect.left + rect.width + 16,
    };
  } else if (placement === "left") {
    tipStyle = {
      top: Math.max(16, rect.top + rect.height / 2 - TIP_H / 2),
      left: Math.max(16, rect.left - TIP_W - 16),
    };
  } else if (placement === "top") {
    tipStyle = {
      top: Math.max(16, rect.top - TIP_H - 16),
      left: Math.max(16, rect.left + rect.width / 2 - TIP_W / 2),
    };
  } else {
    tipStyle = {
      top: rect.top + rect.height + 16,
      left: Math.max(16, rect.left + rect.width / 2 - TIP_W / 2),
    };
  }

  return (
    <AnimatePresence>
      <motion.div
        key="role-tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[110]"
        role="dialog"
        aria-modal="true"
        aria-label="Tour guiado por el dashboard"
      >
        {/* Overlay con "agujero" usando 4 divs alrededor del spotlight */}
        <div
          className="absolute bg-background/80 backdrop-blur-[2px]"
          style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - padding) }}
          onClick={onClose}
        />
        <div
          className="absolute bg-background/80 backdrop-blur-[2px]"
          style={{
            top: Math.max(0, rect.top - padding),
            left: 0,
            width: Math.max(0, rect.left - padding),
            height: rect.height + padding * 2,
          }}
          onClick={onClose}
        />
        <div
          className="absolute bg-background/80 backdrop-blur-[2px]"
          style={{
            top: Math.max(0, rect.top - padding),
            left: rect.left + rect.width + padding,
            right: 0,
            height: rect.height + padding * 2,
          }}
          onClick={onClose}
        />
        <div
          className="absolute bg-background/80 backdrop-blur-[2px]"
          style={{
            top: rect.top + rect.height + padding,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onClick={onClose}
        />

        {/* Spotlight border */}
        <motion.div
          layout
          className="absolute rounded-xl border-2 border-[hsl(var(--brand-violet))] shadow-[0_0_0_4px_hsl(var(--brand-violet)/0.25),0_24px_60px_-12px_hsl(var(--brand-violet)/0.6)] pointer-events-none"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        />

        {/* Tooltip */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          className={cn(
            "absolute rounded-xl border border-border bg-card p-4 shadow-[0_24px_60px_-20px_hsl(var(--brand-violet)/0.55)]",
          )}
          style={{ ...tipStyle, width: TIP_W }}
        >
          <div className="flex items-start gap-2 mb-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--brand-violet))] mt-0.5">
              Paso {step + 1} / {STEPS.length}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar tour"
              className="ml-auto grid place-items-center size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="font-display font-semibold text-[14px] mb-1">
            {current.title}
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
            {current.body}
          </p>
          <Button
            type="button"
            variant="glow"
            size="sm"
            onClick={next}
            className="w-full gap-1.5"
          >
            {step >= STEPS.length - 1 ? "Cerrar" : "Siguiente"}
            <ArrowRight className="size-3.5" />
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
