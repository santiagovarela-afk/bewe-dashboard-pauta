"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, AlertTriangle, X, Eye } from "lucide-react";
import { useDashboard } from "@/lib/store";

const WARN_STORAGE_KEY = "bw_theme_warn";

type WarningPhase = "alert" | "countdown" | null;

function readWarnPref(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(WARN_STORAGE_KEY);
  return v === null ? true : v === "1";
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useDashboard();
  const isDark = theme === "dark";
  const [transitioning, setTransitioning] = React.useState(false);
  const [phase, setPhase] = React.useState<WarningPhase>(null);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [warnPref, setWarnPref] = React.useState(true);

  React.useEffect(() => {
    setWarnPref(readWarnPref());
  }, []);

  /**
   * Soft cross-fade · sin destello.
   * Fase 1 (0→500ms): overlay del color del tema actual sube opacidad 0→1
   * Fase 2 (500ms): cambia el tema bajo el overlay
   * Fase 3 (500→1400ms): overlay baja opacidad revelando el tema nuevo
   */
  function runSoftSwitch() {
    setTransitioning(true);
    setTimeout(() => toggleTheme(), 500);
    setTimeout(() => setTransitioning(false), 1400);
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
      setPhase("alert");
    } else {
      runSoftSwitch();
    }
  }

  function confirmAndStartCountdown() {
    setPhase("countdown");
    setCountdown(3);
  }

  function cancelAll() {
    setPhase(null);
    setCountdown(null);
  }

  React.useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setPhase(null);
      runSoftSwitch();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 0) - 1), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  function toggleWarnPref() {
    const next = !warnPref;
    setWarnPref(next);
    try {
      localStorage.setItem(WARN_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  const overlayColor = isDark ? "hsl(240 10% 4%)" : "hsl(240 5% 96%)";

  return (
    <>
      <button
        data-tour="theme-toggle"
        onClick={handleClick}
        title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
        aria-label="Toggle theme"
        disabled={transitioning || phase !== null}
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

      {/* ── Fase 1 · ALERTA explicativa antes del countdown ─────────────── */}
      <AnimatePresence>
        {phase === "alert" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] grid place-items-center bg-background/85 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl border border-border bg-card p-7 max-w-md w-full shadow-2xl"
            >
              <button
                onClick={cancelAll}
                className="absolute top-3 right-3 size-7 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Cerrar"
              >
                <X className="size-3.5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="size-11 rounded-xl border border-[hsl(var(--brand-ember)/0.45)] bg-[hsl(var(--brand-ember)/0.12)] text-[hsl(var(--brand-ember))] grid place-items-center">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base">
                    Vas a cambiar el tema
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isDark ? "Oscuro → Claro" : "Claro → Oscuro"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-[12.5px] leading-relaxed text-foreground/85 mb-5">
                {isDark ? (
                  <>
                    <p>
                      <strong className="text-foreground">Dato curioso:</strong>{" "}
                      el modo claro{" "}
                      <strong className="text-[hsl(var(--brand-ember))]">
                        cansa más la vista
                      </strong>{" "}
                      en sesiones largas que el oscuro. Recomendamos quedarte en oscuro
                      si vas a trabajar más de 30 min seguidos.
                    </p>
                    <p className="text-muted-foreground">
                      Si igual quieres cambiar, vas a ver un contador 3-2-1.{" "}
                      <strong className="text-foreground">
                        Cierra los ojos esos 3 segundos
                      </strong>{" "}
                      para que tu pupila se adapte y no recibas el flash del blanco directo.
                    </p>
                  </>
                ) : (
                  <p>
                    El cambio de claro a oscuro es <strong className="text-[hsl(var(--success))]">más amable</strong>{" "}
                    para los ojos · igual te haremos un contador 3-2-1 con una transición
                    suave de ~1.4 segundos.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={cancelAll}
                  className="flex-1 px-4 py-2 rounded-md border border-border bg-secondary/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                >
                  Mantener {isDark ? "oscuro" : "claro"}
                </button>
                <button
                  onClick={confirmAndStartCountdown}
                  className="flex-1 px-4 py-2 rounded-md bg-[hsl(var(--brand-violet))] text-white text-sm font-medium hover:brightness-110 transition inline-flex items-center justify-center gap-1.5"
                >
                  <Eye className="size-3.5" />
                  Sí, cambiar
                </button>
              </div>

              <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer pt-3 border-t border-border/60 w-full">
                <input
                  type="checkbox"
                  checked={warnPref}
                  onChange={toggleWarnPref}
                  className="rounded accent-[hsl(var(--brand-violet))]"
                />
                <span>Avisarme con esta alerta antes del cambio (recomendado)</span>
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fase 2 · Countdown 3-2-1 ────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "countdown" && countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] grid place-items-center bg-background/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              className="relative rounded-2xl border border-border bg-card p-7 max-w-sm w-[92%] shadow-2xl text-center"
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Cierra los ojos
              </div>
              <div className="flex items-end justify-center py-4">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-8xl font-bold leading-none text-aurora tabular"
                >
                  {countdown}
                </motion.div>
              </div>
              <button
                onClick={cancelAll}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline mt-3"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Soft cross-fade overlay (mientras cambia el tema) ───────────── */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.4,
              times: [0, 0.36, 0.5, 1],
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
