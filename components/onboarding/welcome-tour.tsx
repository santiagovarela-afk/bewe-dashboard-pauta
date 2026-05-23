"use client";
/**
 * Welcome Tour · onboarding full-screen para usuarios recién logueados.
 *
 * - Aparece SOLO si `localStorage.bw_welcome_seen` no existe.
 * - 5 slides con motion entries.
 * - Botón "Saltar" en cada slide. Botón "Mostrarme alrededor" en el slide 3
 *   dispara el RoleTour (mini spotlight sobre el sidebar).
 * - Re-disparable desde Config vía `triggerWelcomeAgain()`.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChevronLeft,
  Gauge,
  LayoutDashboard,
  Megaphone,
  Palette,
  PartyPopper,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { ROLE_TABS, TABS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoleTour } from "./role-tour";

const STORAGE_KEY = "bw_welcome_seen";

/** Permite a otros componentes (Config) re-disparar el welcome. */
export function triggerWelcomeAgain() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("bw:show-welcome"));
}

const AREAS = [
  {
    id: "pauta",
    title: "Pauta · Inversión",
    desc: "Dashboard, campañas Meta, estrategia y paid media (Google · TikTok)",
    icon: TrendingUp,
    grad: "from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]",
  },
  {
    id: "contenido",
    title: "Contenido · Creativo",
    desc: "Anuncios, orgánico, parrilla editorial y SEO on-page",
    icon: Sparkles,
    grad: "from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))]",
  },
  {
    id: "analitica",
    title: "Analítica",
    desc: "Performance LTV/CAC, Open BUI (Brand) e informe ejecutivo",
    icon: Gauge,
    grad: "from-[hsl(var(--brand-lime))] to-[hsl(var(--brand-violet))]",
  },
  {
    id: "ai",
    title: "Copiloto IA",
    desc: "Gemini con memoria del plan Julián siempre a un Ctrl+K",
    icon: Bot,
    grad: "from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-lime))]",
  },
];

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  campanas: Megaphone,
  estrategia: Target,
  paid: TrendingUp,
  anuncios: Sparkles,
  organico: Sparkles,
  parrilla: CalendarDays,
  seo: Search,
  performance: Gauge,
  "open-bui": Palette,
  informe: Bot,
  config: Bot,
};

interface WelcomeTourProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeTour({ open, onClose }: WelcomeTourProps) {
  const { user } = useDashboard();
  const [step, setStep] = React.useState(0);
  const [showRoleTour, setShowRoleTour] = React.useState(false);
  const totalSteps = 5;

  // Reset to first step when opening
  React.useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // ESC = saltar
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && step < totalSteps - 1) setStep((s) => s + 1);
      else if (e.key === "ArrowLeft" && step > 0) setStep((s) => s - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    onClose();
  }

  function next() {
    if (step >= totalSteps - 1) finish();
    else setStep((s) => s + 1);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const displayName = user?.name ?? "tú";
  const role = user?.role ?? "admin";
  const allowed = ROLE_TABS[role] ?? [];
  const allowedTabs = TABS.filter((t) => allowed.includes(t.id));

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="welcome-tour"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] grid place-items-center p-4 md:p-8 bg-background/85 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Bienvenida a Bewe Pauta OS"
          >
            {/* Fondo aurora */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 20% 30%, hsl(var(--brand-violet)/0.35), transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--brand-cyan)/0.30), transparent 50%), radial-gradient(circle at 50% 100%, hsl(var(--brand-lime)/0.20), transparent 60%)",
              }}
            />

            {/* Botón saltar (top-right) */}
            <button
              type="button"
              onClick={finish}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-10 grid place-items-center size-9 rounded-full border border-border bg-card/80 backdrop-blur text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
              aria-label="Saltar onboarding"
              title="Saltar (Esc)"
            >
              <X className="size-4" />
            </button>

            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative w-full max-w-2xl rounded-2xl border border-border bg-card/95 backdrop-blur-2xl",
                "shadow-[0_40px_80px_-30px_hsl(var(--brand-violet)/0.5)] p-7 md:p-10",
              )}
            >
              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-6">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === step
                        ? "w-6 bg-[hsl(var(--brand-violet))]"
                        : i < step
                          ? "w-3 bg-[hsl(var(--brand-violet)/0.5)]"
                          : "w-3 bg-border",
                    )}
                  />
                ))}
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                  {step + 1} / {totalSteps}
                </span>
              </div>

              {/* Slide content */}
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <SlideWelcome key="s0" displayName={displayName} />
                )}
                {step === 1 && <SlideAreas key="s1" />}
                {step === 2 && (
                  <SlideRole
                    key="s2"
                    role={role}
                    tabs={allowedTabs.map((t) => ({ id: t.id, label: t.label }))}
                    onShowAround={() => {
                      setShowRoleTour(true);
                    }}
                  />
                )}
                {step === 3 && <SlideAi key="s3" />}
                {step === 4 && <SlideReady key="s4" displayName={displayName} />}
              </AnimatePresence>

              {/* Footer nav */}
              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={prev}
                  disabled={step === 0}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition",
                    step === 0
                      ? "opacity-30 cursor-not-allowed text-muted-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ChevronLeft className="size-3.5" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground underline-offset-4 hover:underline"
                >
                  Saltar tour
                </button>
                <Button
                  type="button"
                  variant="glow"
                  size="sm"
                  onClick={next}
                  className="gap-1.5"
                >
                  {step >= totalSteps - 1 ? "Empezar" : "Siguiente"}
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RoleTour open={showRoleTour} onClose={() => setShowRoleTour(false)} />
    </>
  );
}

/* ──────── Slides ──────── */

function SlideWelcome({ displayName }: { displayName: string }) {
  return (
    <motion.div
      key="s0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] grid place-items-center shadow-[0_8px_24px_-8px_hsl(var(--brand-violet)/0.7)]">
          <Sparkles className="size-6 text-white" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[hsl(var(--brand-violet))]">
          Bewe · Pauta · OS
        </div>
      </div>
      <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
        Hola {displayName} · bienvenido al sistema de pauta de Bewe.
      </h1>
      <p className="text-[14px] text-muted-foreground leading-relaxed">
        Esto es <strong className="text-foreground">Bewe Pauta OS</strong>: un único panel
        donde conviven la <strong className="text-foreground">pauta paga</strong>, el{" "}
        <strong className="text-foreground">contenido orgánico</strong>, el{" "}
        <strong className="text-foreground">SEO</strong> y la{" "}
        <strong className="text-foreground">analítica de performance</strong> del plan que
        Julián montó para mayo 2026. Te tomará 30 segundos.
      </p>
    </motion.div>
  );
}

function SlideAreas() {
  return (
    <motion.div
      key="s1"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-2">
        Qué hay aquí
      </h2>
      <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
        Cuatro áreas. Una sola fuente de verdad.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {AREAS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
              className="rounded-xl border border-border bg-background/40 p-3.5 hover:border-foreground/25 transition"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={cn(
                    "size-7 rounded-md bg-gradient-to-br grid place-items-center text-white shrink-0",
                    a.grad,
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="text-[12.5px] font-semibold leading-tight">
                  {a.title}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                {a.desc}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function SlideRole({
  role,
  tabs,
  onShowAround,
}: {
  role: string;
  tabs: Array<{ id: string; label: string }>;
  onShowAround: () => void;
}) {
  return (
    <motion.div
      key="s2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Tu rol
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] border border-[hsl(var(--brand-violet)/0.35)]">
          {role}
        </span>
      </div>
      <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-2">
        Estas son las secciones a las que tienes acceso
      </h2>
      <p className="text-[13px] text-muted-foreground mb-4 leading-relaxed">
        El sidebar las agrupa por área. Cambia entre tabs en cualquier momento.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {tabs.map((t) => {
          const Icon = TAB_ICONS[t.id] ?? LayoutDashboard;
          return (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-border bg-background/40 text-foreground/85"
            >
              <Icon className="size-3 text-[hsl(var(--brand-violet))]" />
              {t.label}
            </span>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onShowAround}
        className="text-[12px] font-medium text-[hsl(var(--brand-violet))] hover:underline underline-offset-4"
      >
        Mostrarme alrededor →
      </button>
    </motion.div>
  );
}

function SlideAi() {
  return (
    <motion.div
      key="s3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] grid place-items-center shadow-[0_8px_24px_-8px_hsl(var(--brand-violet)/0.7)]">
          <Bot className="size-6 text-white" />
        </div>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight">
            Copiloto IA
          </h2>
          <p className="text-[11px] font-mono text-muted-foreground">
            Gemini · con memoria del plan Julián
          </p>
        </div>
      </div>
      <ul className="space-y-2.5 text-[13px] text-muted-foreground leading-relaxed">
        <li className="flex gap-2.5 items-start">
          <span className="mt-1 size-1.5 rounded-full bg-[hsl(var(--brand-violet))] shrink-0" />
          <span>
            Abre el chat con{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background/60 text-[10px] font-mono">
              Ctrl/Cmd+K
            </kbd>{" "}
            desde cualquier tab.
          </span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="mt-1 size-1.5 rounded-full bg-[hsl(var(--brand-cyan))] shrink-0" />
          <span>
            Conoce reglas Julián (ABO, CPT thresholds, día 7, día 14, C7) y datos en vivo
            de las campañas.
          </span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="mt-1 size-1.5 rounded-full bg-[hsl(var(--brand-lime))] shrink-0" />
          <span>
            Cada respuesta tiene un botón{" "}
            <strong className="text-foreground">Recordar</strong> para guardar hallazgos.
            Esa memoria se vuelve contexto del agente para futuras conversaciones.
          </span>
        </li>
        <li className="flex gap-2.5 items-start">
          <span className="mt-1 size-1.5 rounded-full bg-[hsl(var(--destructive))] shrink-0" />
          <span>
            Si te preguntan algo fuera del plan, dice que no lo sabe — no inventa datos.
          </span>
        </li>
      </ul>
    </motion.div>
  );
}

function SlideReady({ displayName }: { displayName: string }) {
  return (
    <motion.div
      key="s4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
      className="text-center py-4"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="mx-auto size-16 rounded-3xl bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))] grid place-items-center shadow-[0_16px_48px_-12px_hsl(var(--brand-violet)/0.8)] mb-4"
      >
        <PartyPopper className="size-8 text-white" />
      </motion.div>
      <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">
        Listo, {displayName}.
      </h2>
      <p className="text-[13px] text-muted-foreground leading-relaxed max-w-md mx-auto">
        Si necesitas ver este tour de nuevo, está en{" "}
        <strong className="text-foreground">Config → Memoria del agente</strong>.
      </p>
    </motion.div>
  );
}
