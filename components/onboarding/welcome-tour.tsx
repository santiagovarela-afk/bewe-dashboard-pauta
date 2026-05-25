"use client";
/**
 * Welcome Tour · onboarding full-screen para usuarios recién logueados.
 *
 * Nueva estructura (hasta 17 slides para admin · menos para otros roles):
 *
 *   Fijas (4):
 *     0. Welcome           — saludo personalizado · "te llevo pestaña por pestaña"
 *     1. Las 4 áreas       — overview corto del agrupado del sidebar
 *     2. Mark + Lúa        — el slide doble agente (memoria + Ctrl+K)
 *     3. Tour visual       — botón opcional para lanzar role-tour
 *
 *   Dinámicas (12 max, filtradas por ROLE_TABS[role]):
 *     · Dashboard, Campañas, Estrategia, Paid Media, Anuncios,
 *       Orgánico, Parrilla, Open Design, SEO, Performance, Informe, Config
 *
 *   Cierre (1):
 *     · Resumen + cierre combinado · "Listo Santiago, que tu CPT < €2.20"
 *
 * Total real depende del rol:
 *   - admin   → 4 fijas + 12 tab + 1 cierre = 17
 *   - lead    → 4 fijas + 11 tab + 1 cierre = 16  (sin config)
 *   - content → 4 fijas + 5  tab + 1 cierre = 10
 *
 * Flow welcome ↔ role-tour:
 *   - El user puede lanzar el role-tour desde el slide 3 (Tour visual).
 *   - El welcome se cierra; al cerrar el role-tour, re-abre en el slide de cierre.
 *
 * Re-disparable desde Config con `triggerWelcomeAgain()`.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChevronLeft,
  Eye,
  FileText,
  Gauge,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  Palette,
  PartyPopper,
  Plug,
  Search,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useDashboard } from "@/lib/store";
import { ROLE_TABS, TABS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoleTour } from "./role-tour";
import { SlideAgents } from "./slide-agents";
import {
  MockAnuncios,
  MockCampanas,
  MockConfig,
  MockDashboard,
  MockEstrategia,
  MockInforme,
  MockOpenDesign,
  MockOrganico,
  MockPaid,
  MockParrilla,
  MockPerformance,
  MockSeo,
  SlideTabDetail,
  type TabDetailContent,
} from "./slide-tab-detail";

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
    desc: "Dashboard, campañas Meta, estrategia y paid media.",
    icon: TrendingUp,
    grad: "from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]",
  },
  {
    id: "contenido",
    title: "Contenido · Creativo",
    desc: "Anuncios, orgánico, parrilla y diseño AI.",
    icon: Sparkles,
    grad: "from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))]",
  },
  {
    id: "analitica",
    title: "Analítica",
    desc: "Performance LTV/CAC, SEO, AEO e informe ejecutivo.",
    icon: Gauge,
    grad: "from-[hsl(var(--brand-lime))] to-[hsl(var(--brand-violet))]",
  },
  {
    id: "ai",
    title: "Copiloto IA",
    desc: "Mark o Lúa, con memoria viva del plan Julián.",
    icon: Bot,
    grad: "from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-lime))]",
  },
];

/* ──────── Contenido detallado por tab ──────── */

/**
 * Slides per-tab simplificados · teasers cortos.
 *
 * Como ahora el TOUR VISUAL (25+ steps) explica cada tab en vivo navegando
 * por la plataforma, aquí solo dejamos un mini-mockup + 1 frase + 2 bullets.
 * El `firstStep` ahora apunta siempre al tour visual.
 */
const TOUR_HINT = "El Tour Visual te muestra esto en vivo · ábrelo desde el botón ? del topbar.";

const TAB_DETAIL: Record<string, TabDetailContent> = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
    accent: "var(--brand-violet)",
    emoji: "🎯",
    whatIs: "Tu panel ejecutivo · resumen de pauta.",
    achievements: [
      "KPIs globales del rango: gasto, CPL, CTR, leads",
      "Señales críticas + daily summary",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockDashboard,
  },
  campanas: {
    id: "campanas",
    label: "Campañas",
    Icon: Megaphone,
    accent: "var(--brand-violet)",
    emoji: "📣",
    whatIs: "Las 6 campañas con estado en vivo.",
    achievements: [
      "ACTIVE/PAUSED + pacing en barras",
      "Drill-down a adsets y anuncios",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockCampanas,
  },
  estrategia: {
    id: "estrategia",
    label: "Estrategia",
    Icon: Target,
    accent: "var(--brand-cyan)",
    emoji: "🎯",
    whatIs: "El porqué · semáforos + reglas Julián.",
    achievements: [
      "Gauges CPT/CPL/Budget",
      "Proyección al cierre de mes",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockEstrategia,
  },
  paid: {
    id: "paid",
    label: "Paid Media",
    Icon: TrendingUp,
    accent: "var(--brand-cyan)",
    emoji: "📈",
    whatIs: "Vista cross-platform: Meta + Google + TikTok.",
    achievements: [
      "Comparativo de inversión",
      "Google/TikTok en placeholder esperando credenciales",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockPaid,
  },
  anuncios: {
    id: "anuncios",
    label: "Anuncios",
    Icon: ImageIcon,
    accent: "var(--brand-lime)",
    emoji: "🖼",
    whatIs: "Cada creativo individual con CPR y alertas.",
    achievements: [
      "Grid con thumbnails HD",
      "Drawer pro al click",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockAnuncios,
  },
  organico: {
    id: "organico",
    label: "Orgánico",
    Icon: Sparkles,
    accent: "var(--brand-lime)",
    emoji: "✨",
    whatIs: "IG @bewe_software (50k) + FB (114k) en vivo.",
    achievements: [
      "Engagement real · likes, comments, shares",
      "Top 3 posts del período",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockOrganico,
  },
  parrilla: {
    id: "parrilla",
    label: "Parrilla",
    Icon: CalendarDays,
    accent: "var(--brand-cyan)",
    emoji: "📅",
    whatIs: "Calendario editorial estilo Metricool.",
    achievements: [
      "Composer con preview real",
      "Hashtag finder asistido por IA",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockParrilla,
  },
  "open-bui": {
    id: "open-bui",
    label: "Open Design",
    Icon: Palette,
    accent: "var(--brand-violet)",
    emoji: "🎨",
    whatIs: "Generador AI de piezas con brand kit Bewe.",
    achievements: [
      "12 skill templates listos",
      "Export HTML/PNG",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockOpenDesign,
  },
  seo: {
    id: "seo",
    label: "SEO",
    Icon: Search,
    accent: "var(--brand-lime)",
    emoji: "🔍",
    whatIs: "Ranking orgánico web · Google Search Console.",
    achievements: [
      "Top keywords + posiciones",
      "On-page audit checklist",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockSeo,
  },
  performance: {
    id: "performance",
    label: "Performance",
    Icon: Gauge,
    accent: "var(--brand-violet)",
    emoji: "📊",
    whatIs: "Funnel + unit economics LTV/CAC.",
    achievements: [
      "Impresiones → Activated",
      "ROAS y payback por campaña",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockPerformance,
  },
  informe: {
    id: "informe",
    label: "Informe",
    Icon: FileText,
    accent: "var(--brand-cyan)",
    emoji: "📄",
    whatIs: "Reporte ejecutivo en 3 formatos.",
    achievements: [
      "Slack short · email exec · Julián full",
      "Pegable y exportable",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockInforme,
  },
  config: {
    id: "config",
    label: "Config",
    Icon: Settings2,
    accent: "var(--brand-violet)",
    emoji: "⚙️",
    whatIs: "Tokens, memoria del agente y personalidad.",
    achievements: [
      "Setup Meta + memoria del copiloto",
      "Elegir Mark o Lúa",
    ],
    firstStep: TOUR_HINT,
    Mockup: MockConfig,
  },
};

/** Orden canónico en el que mostramos las tabs durante el tour. */
const TAB_ORDER: string[] = [
  "dashboard",
  "campanas",
  "estrategia",
  "paid",
  "anuncios",
  "organico",
  "parrilla",
  "open-bui",
  "seo",
  "performance",
  "informe",
  "config",
];

interface WelcomeTourProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeTour({ open, onClose }: WelcomeTourProps) {
  const { user, setTab } = useDashboard();
  const [step, setStep] = React.useState(0);
  const [showRoleTour, setShowRoleTour] = React.useState(false);
  // Si el user lanzó el role-tour desde el welcome, esto evita el reset a slide 0
  // cuando re-abrimos el welcome al terminar el role-tour. Se consume una vez.
  const pendingReturnStepRef = React.useRef<number | null>(null);

  const role = user?.role ?? "admin";
  const displayName = user?.name ?? "tú";
  const allowed = ROLE_TABS[role] ?? [];

  // Tabs ordenadas y filtradas por rol (para los slides per-tab)
  const visibleTabIds = React.useMemo(
    () => TAB_ORDER.filter((id) => allowed.includes(id) && TAB_DETAIL[id]),
    [allowed],
  );

  // Estructura final de slides: [fijas-pre] + [per-tab] + [cierre]
  // Identificamos cada slide por un kind para renderizar.
  type Slide =
    | { kind: "welcome" }
    | { kind: "areas" }
    | { kind: "data-sources" }
    | { kind: "agents" }
    | { kind: "tour-optional" }
    | { kind: "tab"; tabId: string }
    | { kind: "closing" };

  const slides = React.useMemo<Slide[]>(() => {
    const list: Slide[] = [
      { kind: "welcome" },
      { kind: "areas" },
      { kind: "data-sources" },
      { kind: "agents" },
      { kind: "tour-optional" },
      ...visibleTabIds.map<Slide>((id) => ({ kind: "tab", tabId: id })),
      { kind: "closing" },
    ];
    return list;
  }, [visibleTabIds]);

  const totalSteps = slides.length;
  const closingStep = totalSteps - 1;

  // Allowed tabs ordenados (para SlideAreas)
  const allowedTabs = TABS.filter((t) => allowed.includes(t.id));

  // Reset to first step when opening, salvo que vengamos del role-tour
  React.useEffect(() => {
    if (!open) return;
    if (pendingReturnStepRef.current != null) {
      // Clamp por seguridad (si el rol cambia entre sesiones)
      setStep(
        Math.min(Math.max(0, pendingReturnStepRef.current), totalSteps - 1),
      );
      pendingReturnStepRef.current = null;
    } else {
      setStep(0);
    }
  }, [open, totalSteps]);

  // Cerrar welcome y, una vez la animación de salida termina, abrir el role tour.
  function launchRoleTour() {
    pendingReturnStepRef.current = Math.min(step + 1, closingStep);
    onClose();
    window.setTimeout(() => setShowRoleTour(true), 420);
  }

  function closeRoleTour() {
    setShowRoleTour(false);
    if (pendingReturnStepRef.current != null) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("bw:show-welcome"));
      }, 220);
    }
    window.dispatchEvent(new CustomEvent("bw:role-tour-done"));
  }

  // ESC = saltar · ← / → = navegar
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && step < totalSteps - 1)
        setStep((s) => s + 1);
      else if (e.key === "ArrowLeft" && step > 0) setStep((s) => s - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, totalSteps]);

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
    if (step >= totalSteps - 1) finish();
    else setStep((s) => s + 1);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const current = slides[step] ?? slides[0];

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
                "shadow-[0_40px_80px_-30px_hsl(var(--brand-violet)/0.5)]",
                "max-h-[92vh] flex flex-col",
              )}
            >
              {/* Progress dots · fijo arriba */}
              <div className="flex items-center gap-1.5 px-5 md:px-8 pt-5 md:pt-8 pb-3 shrink-0">
                {slides.map((_, i) => (
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
                  {step + 1} / {totalSteps}
                </span>
              </div>

              {/* Slide content · area scrolleable */}
              <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-4 min-h-0">
              <AnimatePresence mode="wait">
                {current.kind === "welcome" && (
                  <SlideWelcome
                    key="welcome"
                    displayName={displayName}
                    tabsCount={visibleTabIds.length}
                  />
                )}
                {current.kind === "areas" && <SlideAreas key="areas" />}
                {current.kind === "data-sources" && <SlideDataSources key="data-sources" />}
                {current.kind === "agents" && <SlideAgents key="agents" />}
                {current.kind === "tour-optional" && (
                  <SlideTourOptional
                    key="tour-optional"
                    onShowAround={launchRoleTour}
                  />
                )}
                {current.kind === "tab" && (
                  <SlideTabDetail
                    key={`tab-${current.tabId}`}
                    content={TAB_DETAIL[current.tabId]!}
                  />
                )}
                {current.kind === "closing" && (
                  <SlideClosingCombined
                    key="closing"
                    displayName={displayName}
                    sectionsCount={allowedTabs.length}
                    role={role}
                  />
                )}
              </AnimatePresence>
              </div>

              {/* Footer nav · SIEMPRE visible (sticky bottom del modal) */}
              <div className="shrink-0 border-t border-border/60 bg-card/95 backdrop-blur-xl px-5 md:px-8 py-4 flex items-center justify-between gap-3 rounded-b-2xl">
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={finish}
                    className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Saltar tour
                  </button>
                  {current.kind === "tab" && (
                    <button
                      type="button"
                      onClick={() => {
                        // Navega al tab actual y cierra el tour para que el user
                        // explore en vivo. Re-abrirable desde el botón "?"
                        if (current.tabId) setTab(current.tabId);
                        finish();
                      }}
                      className="text-[11px] text-[hsl(var(--brand-violet))] hover:text-[hsl(var(--brand-violet))]/80 underline-offset-4 hover:underline font-semibold"
                      title="Cierra el tour y lleva al tab para explorar"
                    >
                      Probar esta tab →
                    </button>
                  )}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RoleTour open={showRoleTour} onClose={closeRoleTour} />
    </>
  );
}

/* ──────── Slides fijas ──────── */

function SlideWelcome({
  displayName,
  tabsCount,
}: {
  displayName: string;
  tabsCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          initial={{ scale: 0.7, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="size-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))] grid place-items-center shadow-[0_12px_30px_-8px_hsl(var(--brand-violet)/0.7)]"
        >
          <Sparkles className="size-7 text-white" />
        </motion.div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[hsl(var(--brand-violet))]">
            Bewe · Pauta · OS
          </div>
          <div className="text-[10.5px] text-muted-foreground mt-0.5">
            control center · mayo 2026
          </div>
        </div>
      </div>
      <h1 className="font-display text-2xl md:text-[34px] font-bold tracking-[-0.02em] leading-[1.05] mb-3">
        Hola {displayName} ·{" "}
        <span className="text-aurora">bienvenido al control center</span> de
        Bewe Pauta.
      </h1>
      <p className="text-[14px] text-muted-foreground leading-relaxed">
        Este es el panel operativo del plan de Julián. En 5 minutos te muestro{" "}
        <strong className="text-foreground">las {tabsCount} pestañas</strong>, las
        fuentes de datos en vivo, y los dos copilotos IA · qué hace cada uno y
        cómo apoyarte en ellos.
      </p>

      {/* Stats rápidas */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <MiniStat label="Pestañas" value={String(tabsCount)} accent="var(--brand-violet)" />
        <MiniStat label="Fuentes live" value="4" accent="var(--brand-cyan)" />
        <MiniStat label="Copilotos IA" value="2" accent="var(--brand-lime)" />
      </div>

      <div className="mt-5 text-[11px] text-muted-foreground/80 leading-relaxed flex items-start gap-2">
        <span aria-hidden className="text-[13px] leading-none mt-0.5">⏱</span>
        <span>
          Saltá con{" "}
          <kbd className="px-1 py-0.5 rounded border border-border bg-background/60 text-[10px] font-mono">
            Esc
          </kbd>{" "}
          o navegá con{" "}
          <kbd className="px-1 py-0.5 rounded border border-border bg-background/60 text-[10px] font-mono">
            ← →
          </kbd>{" "}
          · siempre podés reabrir desde el botón{" "}
          <strong className="text-foreground/85">?</strong> del topbar.
        </span>
      </div>
    </motion.div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card/40 backdrop-blur px-3 py-2.5"
      style={{
        background: `linear-gradient(135deg, hsl(${accent}/0.06), hsl(var(--card)/0.4))`,
      }}
    >
      <div
        className="font-mono font-bold text-[22px] leading-none tabular"
        style={{ color: `hsl(${accent})` }}
      >
        {value}
      </div>
      <div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground mt-1.5">
        {label}
      </div>
    </div>
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
        Vista rápida antes de entrar tab por tab. Una sola fuente de verdad.
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

/* ──────── Data sources · diagrama de conectores ──────── */

interface DataSource {
  id: string;
  name: string;
  desc: string;
  status: "connected" | "pending" | "partial";
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const DATA_SOURCES: DataSource[] = [
  {
    id: "meta",
    name: "Meta Ads API",
    desc: "Campañas, insights, CAPI events · live",
    status: "connected",
    Icon: TrendingUp,
    accent: "var(--brand-violet)",
  },
  {
    id: "gsc",
    name: "Google Search Console",
    desc: "Keywords, posiciones, impresiones orgánicas",
    status: "pending",
    Icon: Search,
    accent: "var(--brand-cyan)",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    desc: "Pricing visits, trial, signup, subscription",
    status: "partial",
    Icon: Eye,
    accent: "var(--brand-lime)",
  },
  {
    id: "groq",
    name: "Groq AI · AEO",
    desc: "Monitoreo en ChatGPT, Claude, Gemini, Perplexity",
    status: "connected",
    Icon: Zap,
    accent: "var(--brand-ember)",
  },
];

function SlideDataSources() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="size-11 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-violet))] grid place-items-center shadow-[0_8px_24px_-8px_hsl(var(--brand-cyan)/0.6)]">
          <Plug className="size-5 text-white" />
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[hsl(var(--brand-violet))]">
            Sin manualidad · todo live
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">
            Cómo está conectada la data
          </h2>
        </div>
      </div>
      <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-4">
        Todo se actualiza en tiempo real desde las plataformas oficiales. Nada
        se digita a mano, nada se sube en CSV.
      </p>

      {/* Diagrama: 4 sources → flecha animada → Bewe Pauta */}
      <div className="relative rounded-2xl border border-border bg-background/30 p-4 mb-3 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(180px 100px at 80% 50%, hsl(var(--brand-violet)/0.35), transparent 70%)",
          }}
        />
        <div className="relative grid grid-cols-[1fr_auto_auto] items-center gap-3">
          {/* Columna fuentes */}
          <div className="space-y-1.5">
            {DATA_SOURCES.map((src, i) => (
              <motion.div
                key={src.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.35 }}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-2.5 py-1.5"
              >
                <div
                  className="size-7 rounded-md grid place-items-center shrink-0 border"
                  style={{
                    background: `hsl(${src.accent}/0.14)`,
                    borderColor: `hsl(${src.accent}/0.4)`,
                    color: `hsl(${src.accent})`,
                  }}
                >
                  <src.Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold leading-tight truncate">
                    {src.name}
                  </div>
                  <div className="text-[9.5px] text-muted-foreground leading-snug truncate">
                    {src.desc}
                  </div>
                </div>
                <StatusBadge status={src.status} />
              </motion.div>
            ))}
          </div>

          {/* Flecha animada */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center px-1"
          >
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="text-[hsl(var(--brand-violet))]"
            >
              <ArrowRight className="size-5" />
            </motion.div>
          </motion.div>

          {/* Bewe Pauta · destino */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 240, damping: 18 }}
            className="relative rounded-xl p-3 min-w-[120px] text-center bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))] shadow-[0_14px_36px_-10px_hsl(var(--brand-violet)/0.7)]"
          >
            <div className="text-[9px] uppercase tracking-[0.16em] text-white/80 mb-1">
              Destino
            </div>
            <div className="font-display text-[13px] font-bold leading-tight text-white">
              Bewe Pauta
            </div>
            <div className="text-[9px] text-white/80 mt-0.5">Dashboard</div>
          </motion.div>
        </div>
      </div>

      <div className="rounded-lg border border-[hsl(var(--brand-violet)/0.3)] bg-[hsl(var(--brand-violet)/0.06)] px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
        <span className="text-foreground/90 font-semibold">Live = al toque.</span>{" "}
        Si Meta cambia un número, lo verás aquí en el siguiente refresh manual o
        cuando navegues entre tabs.
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: DataSource["status"] }) {
  if (status === "connected") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]">
        <span className="size-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse-glow" />
        Conectado
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[hsl(var(--info)/0.14)] text-[hsl(var(--info))]">
        Parcial
      </span>
    );
  }
  return (
    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]">
      Pendiente
    </span>
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
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[hsl(var(--brand-violet))]">
            Recomendado · 2 min
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight leading-tight">
            Tour visual en vivo
          </h2>
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
        En vez de leer slides, te llevo de la mano por <strong className="text-foreground">cada rincón</strong> de
        Bewe Pauta · topbar, las <strong className="text-foreground">13 tabs</strong>, sidebar y copiloto, con un spotlight
        encima del elemento exacto y una explicación corta.
      </p>

      {/* CTA BIG · tentador */}
      <motion.button
        type="button"
        onClick={onShowAround}
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl p-5 text-left",
          "border border-[hsl(var(--brand-violet)/0.45)]",
          "bg-gradient-to-br from-[hsl(var(--brand-violet)/0.18)] via-[hsl(var(--brand-cyan)/0.12)] to-[hsl(var(--brand-lime)/0.12)]",
          "shadow-[0_18px_44px_-18px_hsl(var(--brand-violet)/0.55)]",
          "hover:border-[hsl(var(--brand-violet)/0.75)] hover:shadow-[0_24px_56px_-18px_hsl(var(--brand-violet)/0.7)]",
          "transition-shadow",
        )}
      >
        {/* halo animado */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-60"
          animate={{
            background: [
              "radial-gradient(120px 60px at 10% 50%, hsl(var(--brand-violet)/0.55), transparent 70%)",
              "radial-gradient(120px 60px at 90% 50%, hsl(var(--brand-cyan)/0.55), transparent 70%)",
              "radial-gradient(120px 60px at 10% 50%, hsl(var(--brand-violet)/0.55), transparent 70%)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 8, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="size-14 shrink-0 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))] grid place-items-center shadow-[0_10px_30px_-8px_hsl(var(--brand-violet)/0.75)]"
          >
            <Sparkles className="size-6 text-white" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[17px] font-bold leading-tight mb-0.5">
              Hacer tour visual ahora
            </div>
            <div className="text-[12px] text-foreground/80 leading-snug">
              <strong className="text-[hsl(var(--brand-violet))]">25+ pasos</strong> con spotlight · navegando tab por tab en vivo.
            </div>
          </div>
          <ArrowRight className="size-5 text-[hsl(var(--brand-violet))] shrink-0 transition-transform group-hover:translate-x-1" />
        </div>
        <div className="relative mt-4 pt-3 border-t border-[hsl(var(--brand-violet)/0.25)] grid grid-cols-3 gap-2 text-[10.5px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[hsl(var(--brand-violet))]" />
            Topbar + atajos
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[hsl(var(--brand-cyan))]" />
            13 tabs en vivo
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[hsl(var(--brand-lime))]" />
            Copiloto IA
          </div>
        </div>
      </motion.button>

      <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-4 text-center">
        ¿Prefieres ver el resumen escrito? Continúa con{" "}
        <strong className="text-foreground/80">Siguiente</strong> · son teasers
        cortos de cada tab.
      </p>
    </motion.div>
  );
}

function SlideClosingCombined({
  displayName,
  sectionsCount,
  role,
}: {
  displayName: string;
  sectionsCount: number;
  role: string;
}) {
  const recommendedActions: Array<{
    Icon: React.ComponentType<{ className?: string }>;
    title: string;
    sub: string;
    accent: string;
  }> = [
    {
      Icon: LayoutDashboard,
      title: "Revisá el estado de hoy",
      sub: "Dashboard · KPIs, atención requerida, daily summary.",
      accent: "var(--brand-violet)",
    },
    {
      Icon: Target,
      title: "Mirá quién está en atención",
      sub: "Campañas drifteando · CPL, frecuencia, CPM fuera de rango.",
      accent: "var(--brand-cyan)",
    },
    {
      Icon: Gauge,
      title: "Tomá decisiones con Estrategia",
      sub: "Semáforos, reglas Julián y proyección al cierre de mes.",
      accent: "var(--brand-lime)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div className="text-center mb-5">
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="mx-auto size-14 rounded-3xl bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))] grid place-items-center shadow-[0_16px_48px_-12px_hsl(var(--brand-violet)/0.8)] mb-3"
        >
          <PartyPopper className="size-7 text-white" />
        </motion.div>
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-1.5">
          Listo, {displayName}.
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed max-w-md mx-auto">
          {sectionsCount} pestañas a tu alcance ({role}) · CPT objetivo{" "}
          <strong className="text-[hsl(var(--brand-violet))]">€2.20</strong>.
        </p>
      </div>

      {/* 3 acciones recomendadas */}
      <div className="mb-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2 text-center">
          Por dónde empezar
        </div>
        <div className="space-y-2">
          {recommendedActions.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/40 backdrop-blur p-3"
              style={{
                background: `linear-gradient(135deg, hsl(${a.accent}/0.05), hsl(var(--card)/0.4))`,
              }}
            >
              <div
                className="size-8 rounded-lg grid place-items-center shrink-0 border"
                style={{
                  background: `hsl(${a.accent}/0.14)`,
                  borderColor: `hsl(${a.accent}/0.4)`,
                  color: `hsl(${a.accent})`,
                }}
              >
                <a.Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold leading-tight">
                  {i + 1}. {a.title}
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  {a.sub}
                </div>
              </div>
              <span
                className="shrink-0 font-mono text-[10px] font-bold tabular tracking-wider"
                style={{ color: `hsl(${a.accent})` }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(var(--brand-ember)/0.3)] bg-[hsl(var(--brand-ember)/0.08)] p-3 text-left">
        <div className="flex items-start gap-2.5">
          <div className="size-7 rounded-md bg-[hsl(var(--brand-ember)/0.18)] grid place-items-center shrink-0">
            <KeyRound className="size-3.5 text-[hsl(var(--brand-ember))]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold text-foreground/90 mb-0.5">
              ¿Ves algo raro?
            </div>
            <p className="text-[11.5px] text-muted-foreground leading-relaxed">
              Díselo a <strong className="text-foreground">Santiago</strong> y lo
              corregimos al toque · este dashboard está vivo.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/70 leading-relaxed text-center mt-4">
        Re-abrí el tour cuando quieras desde el botón{" "}
        <strong className="text-foreground/85">?</strong> del topbar.
      </p>
    </motion.div>
  );
}
