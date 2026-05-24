"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, AlertTriangle, X } from "lucide-react";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";

const WARN_STORAGE_KEY = "bw_theme_warn";

/** Lee la preferencia "avisar antes del cambio". Default: ON la primera vez (para que no se asusten). */
function readWarnPref(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(WARN_STORAGE_KEY);
  return v === null ? true : v === "1";
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useDashboard();
  const isDark = theme === "dark";
  const [transitioning, setTransitioning] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [warnPref, setWarnPref] = React.useState(true);

  React.useEffect(() => {
    setWarnPref(readWarnPref());
  }, []);

  /**
   * Soft cross-fade · no más blanco quemado de golpe.
   *
   *  fase 1 (0 → 500ms): un overlay full-screen del color del tema ACTUAL
   *                       sube su opacidad de 0 → 1 (pantalla se "apaga")
   *  fase 2 (500 → 520ms): el tema cambia DEBAJO del overlay (no se ve)
   *  fase 3 (520 → 1400ms): el overlay baja su opacidad 1 → 0 revelando el tema nuevo
   *
   *  Total ~1.4s, sin destello porque el cambio de fondo ocurre con el overlay arriba.
   */
  function runSoftSwitch() {
    setTransitioning(true);
    // fase 1 — fade in del overlay (ver useEffect abajo)
    setTimeout(() => {
      toggleTheme(); // fase 2 · cambio silencioso
    }, 500);
    setTimeout(() => {
      setTransitioning(false); // fase 3 termina · desmontar overlay
    }, 1400);
  }

  function handleClick() {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      toggleTheme();
      return;
    }
    if (warnPref) {
      // Mostrar countdown · luego runSoftSwitch
      setCountdown(3);
    } else {
      runSoftSwitch();
    }
  }

  // Countdown cuando warnPref está activo
  React.useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      runSoftSwitch();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  function cancelCountdown() {
    setCountdown(null);
  }

  function toggleWarnPref() {
    const next = !warnPref;
    setWarnPref(next);
    try {
      localStorage.setItem(WARN_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  // El color del overlay depende del tema CURRENT (el que se está dejando)
  // En dark mode el overlay es negro suavizado (fade hacia negro · agradable)
  // En light mode el overlay es blanco-grisaceo (fade hacia neutro)
  const overlayColor = isDark ? "hsl(240 10% 4%)" : "hsl(240 5% 96%)";

  return (
    <>
      <button
        onClick={handleClick}
        title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
        aria-label="Toggle theme"
        disabled={transitioning || countdown !== null}
        className="relative inline-flex h-8 items-center justify-center rounded-full border border-border bg-card/40 px-2 transition-colors hover:border-foreground/30 disabled:opacity-60"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              className="text-[hsl(var(--brand-violet))]"
            >
              <Moon className="size-3.5" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              className="text-[hsl(var(--brand-ember))]"
            >
              <Sun className="size-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Countdown overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] grid place-items-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 8 }}
              className="relative rounded-2xl border border-border bg-card p-7 max-w-md w-[92%] shadow-2xl"
            >
              <button
                onClick={cancelCountdown}
                className="absolute top-3 right-3 size-7 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Cancelar"
              >
                <X className="size-3.5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl border border-[hsl(var(--brand-ember)/0.45)] bg-[hsl(var(--brand-ember)/0.12)] text-[hsl(var(--brand-ember))] grid place-items-center">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base">
                    Cambiando tema · cierra los ojos un segundo
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isDark ? "Vas a entrar a modo claro" : "Vas a entrar a modo oscuro"} ·
                    la transición suave dura ~1.4s
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-center gap-3 py-4">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-7xl font-bold leading-none text-aurora tabular"
                >
                  {countdown}
                </motion.div>
              </div>

              <div className="flex items-center justify-between text-[11px] gap-3 mt-2 pt-3 border-t border-border/60">
                <label className="inline-flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={warnPref}
                    onChange={toggleWarnPref}
                    className="rounded accent-[hsl(var(--brand-violet))]"
                  />
                  <span>Avisarme antes del cambio</span>
                </label>
                <button
                  onClick={cancelCountdown}
                  className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Soft cross-fade overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.4,
              times: [0, 0.36, 0.5, 1], // 0-500ms fade in · 500-700ms hold · 700-1400ms fade out
              ease: "easeInOut",
            }}
            style={{ background: overlayColor }}
            className="fixed inset-0 z-[400] pointer-events-none"
            aria-hidden
          />
        )}
      </AnimatePresence>
    </>
  );
}
