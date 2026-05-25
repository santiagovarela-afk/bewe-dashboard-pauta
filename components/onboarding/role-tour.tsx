"use client";
/**
 * Role Tour · spotlight inmersivo de 20+ pasos que recorre TODA la plataforma
 * en vivo. Cambia de tab automáticamente con `setTab()`, ilumina el elemento
 * clave con un overlay oscuro + spotlight, y muestra un tooltip al lado.
 *
 * Cada step:
 *   - selector  · CSS selector del elemento a iluminar (preferimos data-tour)
 *   - title     · título corto
 *   - body      · descripción breve (1-2 frases)
 *   - placement · "right" | "left" | "top" | "bottom" | "center"
 *   - tab       · (opcional) si está, navega a esa tab antes de mostrar el step
 *   - waitMs    · (opcional) espera tras cambiar de tab para que renderice
 *
 * Si un selector NO encuentra elemento (rol sin acceso a esa tab, viewport
 * pequeño, etc) el step se salta automáticamente.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/store";
import { ROLE_TABS } from "@/lib/config";
import { cn } from "@/lib/utils";

interface TourStep {
  selector: string;
  title: string;
  body: string;
  /** Acción sugerida concreta · "tu primer paso". Aparece destacada bajo el body. */
  action?: string;
  placement?: "right" | "left" | "top" | "bottom" | "center";
  /** Si está, fuerza un setTab() antes de buscar el selector. */
  tab?: string;
  /** ms a esperar tras cambiar de tab antes de medir el elemento. */
  waitMs?: number;
  /** Si está, el step solo se muestra si el rol tiene esta tab habilitada. */
  requiresTab?: string;
}

const STEPS: TourStep[] = [
  // ── Intro centrado ─────────────────────────────────────────────────────
  {
    selector: "body",
    title: "Vamos a recorrer Bewe Pauta",
    body:
      "Te voy a llevar por las 13 pestañas, el topbar, el sidebar y el copiloto. Calcula ~2 min · puedes saltar cuando quieras con Esc.",
    placement: "center",
  },

  // ── TOPBAR ─────────────────────────────────────────────────────────────
  {
    selector: '[data-tour="topbar"]',
    title: "Topbar · tu centro de mando",
    body:
      "Estado del conector, fechas globales, tema, ayuda y refresh. Vive arriba siempre, en cualquier tab.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="connector-pill"]',
    title: "Estado del conector Meta",
    body:
      "Verde · todo OK. Si lo ves rojo, el token Meta caducó · click ahí para ver los smoke tests.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="date-range"]',
    title: "Rango de fechas · filtra TODO",
    body:
      "Hoy, ayer, 7d, mes en curso o rango personalizado. Filtra el dashboard entero al instante · sin re-fetch.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="theme-toggle"]',
    title: "Tema claro / oscuro",
    body:
      "Cambia a tu gusto. Te avisamos con un contador 3-2-1 para que la pupila se adapte (modo oscuro recomendado · cansa menos).",
    placement: "bottom",
  },
  {
    selector: '[data-tour="restart-tour"]',
    title: "Tour de bienvenida · siempre disponible",
    body:
      "Este botón ? re-abre el onboarding. Si olvidas algo, vuelves a aquí cuando quieras.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="refresh"]',
    title: "Refrescar datos en vivo",
    body:
      "Trae los últimos números de Meta API · campañas, insights, presupuestos. El resto de filtros se aplican sobre el snapshot fresco.",
    placement: "bottom",
  },

  // ── SIDEBAR + GRUPO PAUTA ──────────────────────────────────────────────
  {
    selector: '[data-tour="sidebar"]',
    title: "Sidebar · navegación agrupada",
    body:
      "13 tabs separadas en 4 áreas: Pauta · Contenido · Analítica · Config. Las tabs apagadas son las que tu rol no puede ver.",
    placement: "right",
  },
  {
    selector: '[data-tour-group="pauta"]',
    title: "Grupo Pauta · tu día a día",
    body:
      "Aquí vives cuando estás operando campañas Meta · 5 tabs: Dashboard, Campañas, Estrategia, Paid Media y Anuncios.",
    placement: "right",
  },

  // ── TABS PAUTA ─────────────────────────────────────────────────────────
  {
    selector: '[data-tour-tab="dashboard"]',
    tab: "dashboard",
    waitMs: 280,
    title: "Dashboard · resumen ejecutivo",
    body:
      "Esta sección sirve para tener el pulso del día en una sola pantalla · KPIs globales, atención requerida y daily summary.",
    action: "Tu primer paso · cambiá el periodo a 7 días y mirá si hay alguna campaña en atención.",
    placement: "right",
    requiresTab: "dashboard",
  },
  {
    selector: '[data-tour-tab="campanas"]',
    tab: "campanas",
    waitMs: 280,
    title: "Campañas · las 6 vivas",
    body:
      "Esta sección sirve para operar campañas Meta una a una · estado ACTIVE/PAUSED, pacing, drill-down a adsets y anuncios.",
    action: "Tu primer paso · click en cualquier card para ver detalle de adsets y CPL por adset.",
    placement: "right",
    requiresTab: "campanas",
  },
  {
    selector: '[data-tour-tab="estrategia"]',
    tab: "estrategia",
    waitMs: 280,
    title: "Estrategia · el porqué",
    body:
      "Esta sección sirve para entender la salud del plan · semáforos CPT/CPL/Budget, reglas Julián (día 7 · día 14) y proyección al cierre.",
    action: "Tu primer paso · mirá el gauge de CPT y el % de budget consumido vs días transcurridos.",
    placement: "right",
    requiresTab: "estrategia",
  },
  {
    selector: '[data-tour-tab="paid"]',
    tab: "paid",
    waitMs: 280,
    title: "Paid Media · cross-platform",
    body:
      "Meta hoy · Google Ads y TikTok en placeholder esperando credenciales. Una sola vista para comparar inversión real.",
    placement: "right",
    requiresTab: "paid",
  },
  {
    selector: '[data-tour-tab="anuncios"]',
    tab: "anuncios",
    waitMs: 280,
    title: "Anuncios · cada creativo",
    body:
      "Esta sección sirve para evaluar creativos uno a uno · grid con thumbnails HD, CPR, frecuencia y alertas automáticas.",
    action: "Tu primer paso · ordená por CPR descendente para detectar el creativo más caro.",
    placement: "right",
    requiresTab: "anuncios",
  },

  // ── GRUPO CONTENIDO ────────────────────────────────────────────────────
  {
    selector: '[data-tour-group="contenido"]',
    title: "Grupo Contenido · creatividad orgánica",
    body:
      "Esto NO es pauta · es tu IG/FB de Bewe, calendario editorial y generador AI de piezas.",
    placement: "right",
  },
  {
    selector: '[data-tour-tab="organico"]',
    tab: "organico",
    waitMs: 280,
    title: "Orgánico · IG + FB en vivo",
    body:
      "@bewe_software (50k) + Facebook (114k) con engagement real · likes, comments, shares, top 3 del período.",
    placement: "right",
    requiresTab: "organico",
  },
  {
    selector: '[data-tour-tab="parrilla"]',
    tab: "parrilla",
    waitMs: 280,
    title: "Parrilla · calendario editorial",
    body:
      "Estilo Metricool · programa posts con composer + preview real + hashtag finder asistido por Mark/Lúa.",
    placement: "right",
    requiresTab: "parrilla",
  },
  {
    selector: '[data-tour-tab="open-bui"]',
    tab: "open-bui",
    waitMs: 280,
    title: "Open Design · generador AI",
    body:
      "12 skill templates con brand kit Bewe pre-cargado. Describe la pieza y Mark/Lúa la maqueta en HTML+CSS exportable.",
    placement: "right",
    requiresTab: "open-bui",
  },

  // ── GRUPO ANALÍTICA ────────────────────────────────────────────────────
  {
    selector: '[data-tour-group="analítica"]',
    title: "Grupo Analítica · datos profundos",
    body:
      "Performance cross-funnel, SEO web, AEO en LLMs e informe ejecutivo para Julián.",
    placement: "right",
  },
  {
    selector: '[data-tour-tab="performance"]',
    tab: "performance",
    waitMs: 280,
    title: "Performance · LTV / CAC",
    body:
      "Esta sección sirve para validar unit economics · funnel Impresiones → Activated, CAC, LTV y ROAS por campaña.",
    action: "Tu primer paso · revisá el ratio LTV/CAC · sano ≥ 3× para escalar inversión.",
    placement: "right",
    requiresTab: "performance",
  },
  {
    selector: '[data-tour-tab="seo"]',
    tab: "seo",
    waitMs: 280,
    title: "SEO · Google Search Console",
    body:
      "Top keywords y posiciones, on-page audit y backlinks · sesión conjunta con María Paula para conectar GSC.",
    placement: "right",
    requiresTab: "seo",
  },
  {
    selector: '[data-tour-tab="aeo"]',
    tab: "aeo",
    waitMs: 280,
    title: "AEO · ¿Te ven los LLMs?",
    body:
      "Monitoreo de 30 prompts en ChatGPT, Claude, Gemini y Perplexity vía Groq · sabes si Bewe se menciona y cómo.",
    placement: "right",
    requiresTab: "aeo",
  },
  {
    selector: '[data-tour-tab="informe"]',
    tab: "informe",
    waitMs: 280,
    title: "Informe · 3 formatos",
    body:
      "Slack short (3 líneas), email ejecutivo (1 página) y reporte Julián completo (3 páginas). Exportable, pegable.",
    placement: "right",
    requiresTab: "informe",
  },

  // ── COPILOTO IA ────────────────────────────────────────────────────────
  {
    selector: '[data-tour="ai-fab"]',
    title: "Mark / Lúa · tu copiloto",
    body:
      "Disponible en TODAS las tabs · atajo Ctrl/Cmd+K. Conoce el plan Julián, los datos en vivo y aprende de cada conversación.",
    placement: "left",
  },

  // ── CONFIG (solo si admin) ─────────────────────────────────────────────
  {
    selector: '[data-tour-tab="config"]',
    tab: "config",
    waitMs: 280,
    title: "Config · token, memoria, personalidad",
    body:
      "Setup del token Meta, memoria viva del agente (ver/borrar/agregar) y elegir personalidad (Mark serio · Lúa cálida).",
    placement: "right",
    requiresTab: "config",
  },

  // ── CIERRE ─────────────────────────────────────────────────────────────
  {
    selector: "body",
    title: "Listo · ya conoces el OS",
    body:
      "Explora a tu ritmo. Si ves algo raro, díselo a Santiago. Para reabrir este tour, click el botón ? del topbar.",
    placement: "center",
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
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function RoleTour({ open, onClose }: RoleTourProps) {
  const { setTab, user } = useDashboard();
  const role = user?.role ?? "admin";
  const allowedTabs = React.useMemo(() => ROLE_TABS[role] ?? [], [role]);

  // Filtramos steps por rol (algunos requieren acceso a tabs específicas)
  const effectiveSteps = React.useMemo(
    () =>
      STEPS.filter((s) => !s.requiresTab || allowedTabs.includes(s.requiresTab)),
    [allowedTabs],
  );

  const [step, setStep] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);
  const [ready, setReady] = React.useState(false);

  // Aplica el step actual: cambia tab si toca, espera, mide el elemento.
  // Si el elemento no aparece, salta al siguiente.
  React.useEffect(() => {
    if (!open) {
      setStep(0);
      setRect(null);
      setReady(false);
      return;
    }
    const current = effectiveSteps[step];
    if (!current) {
      onClose();
      return;
    }
    setReady(false);

    let cancelled = false;
    let attempts = 0;

    function measureWithRetry() {
      if (cancelled) return;
      // Para placement "center" no necesitamos rect (lo simulamos en el centro)
      if (current.placement === "center") {
        if (typeof window !== "undefined") {
          setRect({
            top: window.innerHeight / 2 - 4,
            left: window.innerWidth / 2 - 4,
            width: 8,
            height: 8,
          });
        }
        setReady(true);
        return;
      }
      const r = getRect(current.selector);
      if (r) {
        setRect(r);
        setReady(true);
        return;
      }
      attempts += 1;
      if (attempts > 8) {
        // Saltamos este step → siguiente
        setStep((s) => Math.min(s + 1, effectiveSteps.length - 1));
        return;
      }
      window.setTimeout(measureWithRetry, 120);
    }

    if (current.tab) {
      setTab(current.tab);
      const delay = current.waitMs ?? 280;
      const id = window.setTimeout(measureWithRetry, delay);
      return () => {
        cancelled = true;
        window.clearTimeout(id);
      };
    } else {
      measureWithRetry();
      return () => {
        cancelled = true;
      };
    }
  }, [open, step, effectiveSteps, setTab, onClose]);

  // Re-mide en resize/scroll
  React.useEffect(() => {
    if (!open || !ready) return;
    const current = effectiveSteps[step];
    if (!current || current.placement === "center") return;
    function onResize() {
      const r = getRect(current.selector);
      if (r) setRect(r);
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, ready, step, effectiveSteps]);

  // Teclado: Esc cierra, ←/→ navega
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
  }, [open, step, effectiveSteps.length]);

  function next() {
    if (step >= effectiveSteps.length - 1) onClose();
    else setStep((s) => s + 1);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!open || !rect) return null;

  const current = effectiveSteps[step];
  if (!current) return null;

  const placement = current.placement ?? "right";
  const padding = placement === "center" ? 0 : 10;

  // Tooltip position
  const TIP_W = 320;
  // Aumentado de 170 a 220 porque ahora algunos steps incluyen un bloque
  // "Acción sugerida" debajo del body que añade ~50px.
  const TIP_H = current.action ? 230 : 180;
  let tipStyle: React.CSSProperties = {};
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  if (placement === "center") {
    tipStyle = {
      top: vh / 2 - TIP_H / 2,
      left: vw / 2 - TIP_W / 2,
    };
  } else if (placement === "right") {
    const left = rect.left + rect.width + 16;
    tipStyle = {
      top: Math.max(16, Math.min(vh - TIP_H - 16, rect.top + rect.height / 2 - TIP_H / 2)),
      left: Math.min(vw - TIP_W - 16, left),
    };
  } else if (placement === "left") {
    tipStyle = {
      top: Math.max(16, Math.min(vh - TIP_H - 16, rect.top + rect.height / 2 - TIP_H / 2)),
      left: Math.max(16, rect.left - TIP_W - 16),
    };
  } else if (placement === "top") {
    tipStyle = {
      top: Math.max(16, rect.top - TIP_H - 16),
      left: Math.max(16, Math.min(vw - TIP_W - 16, rect.left + rect.width / 2 - TIP_W / 2)),
    };
  } else {
    tipStyle = {
      top: Math.min(vh - TIP_H - 16, rect.top + rect.height + 16),
      left: Math.max(16, Math.min(vw - TIP_W - 16, rect.left + rect.width / 2 - TIP_W / 2)),
    };
  }

  const isCenter = placement === "center";

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
        aria-label="Tour visual del dashboard"
      >
        {/* Overlay con "agujero" usando 4 divs alrededor del spotlight.
            En modo center el agujero es invisible (rect 8x8 en el centro). */}
        <div
          className="absolute bg-background/85 backdrop-blur-[2px]"
          style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - padding) }}
          onClick={onClose}
        />
        <div
          className="absolute bg-background/85 backdrop-blur-[2px]"
          style={{
            top: Math.max(0, rect.top - padding),
            left: 0,
            width: Math.max(0, rect.left - padding),
            height: rect.height + padding * 2,
          }}
          onClick={onClose}
        />
        <div
          className="absolute bg-background/85 backdrop-blur-[2px]"
          style={{
            top: Math.max(0, rect.top - padding),
            left: rect.left + rect.width + padding,
            right: 0,
            height: rect.height + padding * 2,
          }}
          onClick={onClose}
        />
        <div
          className="absolute bg-background/85 backdrop-blur-[2px]"
          style={{
            top: rect.top + rect.height + padding,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onClick={onClose}
        />

        {/* Spotlight border · oculto en modo center */}
        {!isCenter && (
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
        )}

        {/* Botón cerrar fijo top-right (extra al X del tooltip) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Saltar tour"
          title="Saltar (Esc)"
          className="absolute top-4 right-4 z-10 grid place-items-center size-9 rounded-full border border-border bg-card/90 backdrop-blur text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
        >
          <X className="size-4" />
        </button>

        {/* Tooltip */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.94, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute rounded-xl border border-border bg-card p-4 shadow-[0_24px_60px_-20px_hsl(var(--brand-violet)/0.55)]",
            isCenter && "ring-1 ring-[hsl(var(--brand-violet)/0.3)]",
          )}
          style={{ ...tipStyle, width: TIP_W }}
        >
          <div className="flex items-start gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--brand-violet))]">
              <Sparkles className="size-3" />
              <span>
                Paso {step + 1} / {effectiveSteps.length}
              </span>
            </div>
            {/* Progress mini-dots */}
            <div className="flex items-center gap-0.5 ml-auto">
              <div className="h-1 w-16 rounded-full bg-border overflow-hidden">
                <motion.div
                  className="h-full bg-[hsl(var(--brand-violet))]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((step + 1) / effectiveSteps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </div>
          <div className="font-display font-semibold text-[14.5px] mb-1 leading-tight">
            {current.title}
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">
            {current.body}
          </p>
          {current.action && (
            <div className="mb-3 rounded-md border border-[hsl(var(--brand-violet)/0.3)] bg-[hsl(var(--brand-violet)/0.07)] px-2.5 py-1.5">
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-[hsl(var(--brand-violet))] mb-0.5">
                Acción sugerida
              </div>
              <p className="text-[11px] text-foreground/85 leading-snug">
                {current.action}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className={cn(
                "text-[11px] px-2 py-1 rounded-md transition",
                step === 0
                  ? "opacity-30 cursor-not-allowed text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[10.5px] text-muted-foreground/70 hover:text-muted-foreground underline-offset-4 hover:underline"
            >
              Saltar
            </button>
            <Button
              type="button"
              variant="glow"
              size="sm"
              onClick={next}
              className="ml-auto gap-1.5"
            >
              {step >= effectiveSteps.length - 1 ? "Cerrar" : "Siguiente"}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
