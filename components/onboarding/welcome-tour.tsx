"use client";
/**
 * Welcome Tour · onboarding full-screen para usuarios recién logueados.
 *
 * 10 slides:
 *   0. Welcome           — saludo personalizado
 *   1. Las 4 áreas       — grid Pauta · Contenido · Analítica · Copiloto
 *   2. Tu rol y tabs     — pills + botón "Mostrarme alrededor"
 *   3. Pauta · Inversión — mini cards (Dashboard, Campañas, Estrategia, Paid)
 *   4. Contenido         — mini cards (Anuncios, Orgánico, Parrilla, SEO)
 *   5. Analítica         — mini cards (Performance, Open Design, Informe)
 *   6. Copiloto IA       — Mark + Lúa lado a lado + memorias + Ctrl+K
 *   7. Tour visual       — botón opcional para lanzar role-tour
 *   8. Resumen           — wrap-up con bullets de "qué viste / qué falta"
 *   9. Cierre            — "Buena suerte · que tu CPT esté siempre bajo €2.20"
 *
 * Flow welcome ↔ role-tour:
 *   - El user puede lanzar el role-tour desde slide 2 o 7.
 *   - El welcome se cierra y queda con flag `cameFromRoleTour=true`.
 *   - Cuando el role-tour cierra, dispara `bw:role-tour-done` → re-abrimos
 *     el welcome saltando directo al slide 8 (Resumen).
 *
 * Re-disparable desde Config con `triggerWelcomeAgain()`.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Gauge,
  KeyRound,
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
import { SlideSections } from "./slide-sections";
import { SlideAgents } from "./slide-agents";

const STORAGE_KEY = "bw_welcome_seen";
const TOTAL_STEPS = 10;
const SUMMARY_STEP = 8; // Slide al que volvemos tras el role-tour

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
    desc: "Dashboard, campañas Meta, estrategia y paid media (Google · TikTok).",
    icon: TrendingUp,
    grad: "from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]",
  },
  {
    id: "contenido",
    title: "Contenido · Creativo",
    desc: "Anuncios, orgánico, parrilla editorial y SEO on-page.",
    icon: Sparkles,
    grad: "from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))]",
  },
  {
    id: "analitica",
    title: "Analítica",
    desc: "Performance LTV/CAC, Open Design e informe ejecutivo.",
    icon: Gauge,
    grad: "from-[hsl(var(--brand-lime))] to-[hsl(var(--brand-violet))]",
  },
  {
    id: "ai",
    title: "Copiloto IA",
    desc: "Mark o Lúa, con memoria del plan Julián, siempre a un Ctrl+K.",
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
  // Si el user lanzó el role-tour desde el welcome, esto evita el reset a slide 0
  // cuando re-abrimos el welcome al terminar el role-tour. Se consume una vez.
  const pendingReturnStepRef = React.useRef<number | null>(null);

  // Reset to first step when opening, salvo que vengamos del role-tour
  // (en cuyo caso pendingReturnStepRef tiene el slide al que queremos saltar).
  React.useEffect(() => {
    if (!open) return;
    if (pendingReturnStepRef.current != null) {
      setStep(pendingReturnStepRef.current);
      pendingReturnStepRef.current = null;
    } else {
      setStep(0);
    }
  }, [open]);

  // Cerrar welcome y, una vez la animación de salida termina, abrir el role tour.
  function launchRoleTour() {
    // Marcamos que al volver del role-tour saltamos al slide Resumen.
    pendingReturnStepRef.current = SUMMARY_STEP;
    onClose();
    window.setTimeout(() => setShowRoleTour(true), 420);
  }

  function closeRoleTour() {
    setShowRoleTour(false);
    // Si veníamos del welcome, re-abrirlo en el slide Resumen.
    if (pendingReturnStepRef.current != null) {
      // Emitir evento global para que el trigger nos vuelva a abrir.
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("bw:show-welcome"));
      }, 220);
    }
    // Notificar a posibles listeners (por consistencia con el contrato del evento).
    window.dispatchEvent(new CustomEvent("bw:role-tour-done"));
  }

  // ESC = saltar · ← / → = navegar
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && step < TOTAL_STEPS - 1)
        setStep((s) => s + 1);
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
    pendingReturnStepRef.current = null;
    onClose();
  }

  function next() {
    if (step >= TOTAL_STEPS - 1) finish();
    else setStep((s) => s + 1);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const displayName = user?.name ?? "tú";
  const role = user?.role ?? "admin";
  const allowed = ROLE_TABS[role] ?? [];
  const allowedTabs = TABS.filter((t) => allowed.includes(t.id));

  // Filtrar tabs por grupo (solo los que el rol puede ver)
  const pautaTabs = allowedTabs
    .filter((t) => t.group === "pauta")
    .map((t) => t.id);
  const contenidoTabs = allowedTabs
    .filter((t) => t.group === "contenido")
    .map((t) => t.id);
  const analiticaTabs = allowedTabs
    .filter((t) => t.group === "analítica")
    .map((t) => t.id);

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
                "max-h-[88vh] overflow-y-auto",
              )}
            >
              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-6">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === step
                        ? "w-5 bg-[hsl(var(--brand-violet))]"
                        : i < step
                          ? "w-2.5 bg-[hsl(var(--brand-violet)/0.5)]"
                          : "w-2.5 bg-border",
                    )}
                  />
                ))}
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                  {step + 1} / {TOTAL_STEPS}
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
                    onShowAround={launchRoleTour}
                  />
                )}
                {step === 3 && (
                  <SlideSections
                    key="s3"
                    title="Pauta · Inversión"
                    subtitle="Donde vive la inversión Meta y el plan diario."
                    accent="var(--brand-violet)"
                    tabIds={
                      pautaTabs.length > 0
                        ? pautaTabs
                        : ["dashboard", "campanas", "estrategia", "paid"]
                    }
                    HeaderIcon={TrendingUp}
                  />
                )}
                {step === 4 && (
                  <SlideSections
                    key="s4"
                    title="Contenido · Creativo"
                    subtitle="Anuncios pagados, orgánico, parrilla y SEO en un solo flujo."
                    accent="var(--brand-cyan)"
                    tabIds={
                      contenidoTabs.length > 0
                        ? contenidoTabs
                        : ["anuncios", "organico", "parrilla", "seo"]
                    }
                    HeaderIcon={Sparkles}
                  />
                )}
                {step === 5 && (
                  <SlideSections
                    key="s5"
                    title="Analítica"
                    subtitle="Cómo se ve el resultado del plan Julián."
                    accent="var(--brand-lime)"
                    tabIds={
                      analiticaTabs.length > 0
                        ? analiticaTabs
                        : ["performance", "open-bui", "informe"]
                    }
                    HeaderIcon={Gauge}
                  />
                )}
                {step === 6 && <SlideAgents key="s6" />}
                {step === 7 && (
                  <SlideTourOptional
                    key="s7"
                    onShowAround={launchRoleTour}
                  />
                )}
                {step === 8 && (
                  <SlideSummary
                    key="s8"
                    sectionsCount={allowedTabs.length}
                    role={role}
                  />
                )}
                {step === 9 && (
                  <SlideClosing key="s9" displayName={displayName} />
                )}
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
                  {step >= TOTAL_STEPS - 1 ? "Empezar" : "Siguiente"}
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RoleTour open={showRoleTour} onClose={closeRoleTour} />
    </>
  );
}

/* ──────── Slides ──────── */

function SlideWelcome({ displayName }: { displayName: string }) {
  return (
    <motion.div
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
        Julián montó para mayo 2026. Te tomará menos de un minuto.
      </p>
    </motion.div>
  );
}

function SlideAreas() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-2">
        Las 4 áreas
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
      <p className="text-[10.5px] text-muted-foreground/70 mt-2 leading-relaxed">
        Lanza un pequeño tour visual sobre sidebar, topbar y copiloto. Al terminar
        vuelves aquí con el resumen.
      </p>
    </motion.div>
  );
}

function SlideTourOptional({ onShowAround }: { onShowAround: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="size-11 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))] grid place-items-center shadow-[0_8px_24px_-8px_hsl(var(--brand-cyan)/0.65)]">
          <Target className="size-5 text-white" />
        </div>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">
            Tour visual (opcional)
          </h2>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            Un spotlight sobre los elementos clave del shell.
          </p>
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
        Si quieres ver dónde está cada cosa antes de empezar, lanza el tour visual:
        ilumina sidebar, topbar, theme toggle y copiloto, uno por uno. Cuando termine
        volverás aquí con el resumen final.
      </p>
      <button
        type="button"
        onClick={onShowAround}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[hsl(var(--brand-violet))] hover:underline underline-offset-4"
      >
        Hacer tour visual ahora →
      </button>
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-3">
        ¿Prefieres saltarlo? Continúa con <strong className="text-foreground/80">Siguiente</strong> para ver el resumen.
      </p>
    </motion.div>
  );
}

function SlideSummary({
  sectionsCount,
  role,
}: {
  sectionsCount: number;
  role: string;
}) {
  const items = [
    {
      icon: CheckCircle2,
      tone: "ok" as const,
      text: (
        <>
          Tienes acceso a{" "}
          <strong className="text-foreground">{sectionsCount} secciones</strong> según
          tu rol{" "}
          <span className="font-mono text-[10.5px] text-[hsl(var(--brand-violet))]">
            ({role})
          </span>
          .
        </>
      ),
    },
    {
      icon: CheckCircle2,
      tone: "ok" as const,
      text: (
        <>
          Tu copiloto{" "}
          <strong className="text-foreground">Mark</strong> /{" "}
          <strong className="text-foreground">Lúa</strong> entiende el plan, los datos en vivo
          y la memoria creativa.
        </>
      ),
    },
    {
      icon: CheckCircle2,
      tone: "ok" as const,
      text: (
        <>
          El conector vigila el token Meta · status visible como{" "}
          <strong className="text-foreground">pill</strong> en el topbar.
        </>
      ),
    },
    {
      icon: KeyRound,
      tone: "warn" as const,
      text: (
        <>
          Pendiente:{" "}
          <strong className="text-foreground">conecta tu Meta System User Token</strong>{" "}
          (ver{" "}
          <code className="px-1 py-0.5 rounded bg-background/60 border border-border text-[10.5px] font-mono">
            _docs/SETUP-TOKENS.md
          </code>
          ).
        </>
      ),
    },
    {
      icon: Sparkles,
      tone: "tip" as const,
      text: (
        <>
          Tip: usa{" "}
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-background/60 text-[10px] font-mono">
            Ctrl/Cmd+K
          </kbd>{" "}
          para abrir el copiloto desde donde estés.
        </>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="size-11 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-lime))] grid place-items-center shadow-[0_8px_24px_-8px_hsl(var(--brand-violet)/0.65)]">
          <CheckCircle2 className="size-5 text-white" />
        </div>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">
            Resumen
          </h2>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            Qué acabas de ver y qué hacer primero.
          </p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {items.map((it, i) => {
          const Icon = it.icon;
          const toneClass =
            it.tone === "ok"
              ? "text-[hsl(var(--brand-lime))]"
              : it.tone === "warn"
                ? "text-[hsl(var(--brand-ember,38_92%_50%))]"
                : "text-[hsl(var(--brand-cyan))]";
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.28 }}
              className="flex gap-2.5 items-start text-[12.5px] text-muted-foreground leading-relaxed"
            >
              <Icon className={cn("size-4 shrink-0 mt-0.5", toneClass)} />
              <span>{it.text}</span>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}

function SlideClosing({ displayName }: { displayName: string }) {
  return (
    <motion.div
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
      <p className="text-[14px] text-foreground/85 leading-relaxed max-w-md mx-auto mb-1">
        Buena suerte.
      </p>
      <p className="text-[13px] text-muted-foreground leading-relaxed max-w-md mx-auto mb-4 italic">
        Que tu CPT esté siempre bajo{" "}
        <strong className="text-[hsl(var(--brand-violet))] not-italic">€2.20</strong>.
      </p>
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-md mx-auto">
        Puedes re-disparar este tour desde{" "}
        <strong className="text-foreground/85">Config → Memoria del agente</strong>.
      </p>
    </motion.div>
  );
}
