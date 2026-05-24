"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pencil, PenTool, Sparkles, HelpCircle } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TldrawCanvas } from "@/components/open-bui/canvas";
import { SkillPicker } from "@/components/open-bui/skill-picker";
import { BriefInput } from "@/components/open-bui/brief-input";
import { DesignPreview } from "@/components/open-bui/design-preview";
import { ExportButtons } from "@/components/open-bui/export-buttons";
import { BrandKitPanel } from "@/components/open-bui/brand-kit-panel";
import { SKILLS, getSkill } from "@/components/open-bui/skills";
import {
  OpenDesignOnboarding,
  clearOpenDesignOnboardingSeen,
} from "@/components/open-bui/onboarding-tour";
import { ReferencesPanel } from "@/components/open-bui/references-panel";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";

const STORAGE_KEY_SKILL = "bw_open_design_skill";
const STORAGE_KEY_BRIEF = "bw_open_design_brief";
const STORAGE_KEY_QUOTA_UNTIL = "bw_open_design_quota_until";
/** Cooldown tras un 429 Gemini (ms) — 5 min como pidió Santi. */
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Open Design · Bewe OS
 *
 * Rebuild (Santi feedback may-2026): la visual anterior se veía desordenada.
 * Nuevo layout en steps numerados 1·2·3 con onboarding dedicado y panel
 * de referentes orgánicos (IG+FB) que el user puede usar como inspiración
 * directa en el brief.
 *
 *   1. Elige skill (sidebar izquierda)
 *   2. Describe brief en lenguaje natural (centro)
 *   3. Preview live + export (derecha)
 *   + Referentes orgánicos abajo · click → snippet al brief
 *
 * El canvas tldraw queda como "modo manual" accesible por toggle.
 */
export function TabOpenBui() {
  const { aiPersona } = useDashboard();
  const personaLabel = aiPersona === "lua" ? "Lúa OS" : "Mark OS";

  const [mode, setMode] = React.useState<"design" | "canvas">("design");
  const [skillId, setSkillId] = React.useState<string>(() => SKILLS[0].id);
  const [brief, setBrief] = React.useState("");
  const [html, setHtml] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [variant, setVariant] = React.useState(0);
  const [quotaUntil, setQuotaUntil] = React.useState<number>(0);
  const [now, setNow] = React.useState<number>(() => Date.now());
  const [forceOnb, setForceOnb] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const briefRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Hidratar último skill, brief, cooldown
  React.useEffect(() => {
    try {
      const sk = localStorage.getItem(STORAGE_KEY_SKILL);
      if (sk && SKILLS.some((s) => s.id === sk)) setSkillId(sk);
      const br = localStorage.getItem(STORAGE_KEY_BRIEF);
      if (br) setBrief(br);
      const qu = Number(localStorage.getItem(STORAGE_KEY_QUOTA_UNTIL) || "0");
      if (qu > Date.now()) setQuotaUntil(qu);
    } catch {
      /* ignore */
    }
  }, []);

  // Persistir cambios
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SKILL, skillId);
    } catch {
      /* ignore */
    }
  }, [skillId]);
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRIEF, brief);
    } catch {
      /* ignore */
    }
  }, [brief]);

  // Tick cada segundo mientras hay cooldown activo (para countdown UI)
  React.useEffect(() => {
    if (quotaUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quotaUntil]);

  // Toast auto-dismiss
  React.useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const cooldownRemainingMs = Math.max(0, quotaUntil - now);
  const inCooldown = cooldownRemainingMs > 0;
  const skill = getSkill(skillId);

  async function generate(nextVariant: number) {
    if (inCooldown) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/design/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, brief, variant: nextVariant, persona: aiPersona }),
      });
      const data = await r.json();
      if (!r.ok) {
        // Quota agotada → activar cooldown y mensaje claro
        if (r.status === 429 || data?.quotaExhausted) {
          const until = Date.now() + QUOTA_COOLDOWN_MS;
          setQuotaUntil(until);
          try {
            localStorage.setItem(STORAGE_KEY_QUOTA_UNTIL, String(until));
          } catch {
            /* ignore */
          }
          setError(
            data?.hint ||
              "Cuota Gemini agotada · prueba con el canvas manual o espera 4h",
          );
        } else {
          setError(data?.error || `Error ${r.status}`);
        }
        setHtml(null);
        return;
      }
      setHtml(data.html as string);
      setVariant(nextVariant);
    } catch (e) {
      setError((e as Error).message || "Falló la generación");
    } finally {
      setLoading(false);
    }
  }

  function onGenerate() {
    setVariant(0);
    void generate(0);
  }
  function onVariant() {
    void generate(variant + 1);
  }

  function handleUseReference(snippet: string) {
    setBrief((prev) => (prev ? prev.trimEnd() + snippet : snippet.trimStart()));
    setToast("Referencia agregada al brief");
    // Scroll suave al textarea para que el user vea el cambio
    window.requestAnimationFrame(() => {
      briefRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      briefRef.current?.focus({ preventScroll: true });
    });
  }

  function openOnboarding() {
    clearOpenDesignOnboardingSeen();
    setForceOnb(true);
  }

  function switchToCanvas() {
    setMode("canvas");
  }

  return (
    <div className="open-design-liquid relative -mx-4 -my-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 rounded-2xl">
      {/* Liquid glass theme override · brand kit Bewe pastel · NO toca theme global */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-90 dark:opacity-60"
        style={{
          background:
            "linear-gradient(135deg, rgba(176,210,252,0.25) 0%, rgba(204,251,241,0.18) 45%, rgba(250,209,158,0.22) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-70 dark:opacity-30"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, rgba(96,165,250,0.18), transparent 70%), radial-gradient(50% 50% at 90% 80%, rgba(52,211,153,0.16), transparent 70%)",
        }}
      />
      <div className="space-y-5 max-w-[1600px] relative">
      <OpenDesignOnboarding
        forceOpen={forceOnb}
        onClose={() => setForceOnb(false)}
      />

      <SectionHeader
        title="Open Design · Bewe OS"
        sub={
          mode === "design"
            ? "Brief → AI genera HTML/CSS → preview → export"
            : "Canvas manual · tldraw para dibujar a mano"
        }
        right={
          <>
            <Badge variant="violet" className="font-mono">
              {mode === "design" ? `${personaLabel} · gen` : "tldraw v3"}
            </Badge>
            {mode === "design" && (
              <button
                type="button"
                onClick={openOnboarding}
                title="Ver tutorial Open Design"
                aria-label="Ver tutorial Open Design"
                className="inline-flex items-center justify-center size-8 rounded-md border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <HelpCircle className="size-3.5" />
              </button>
            )}
            <Button
              variant={mode === "design" ? "outline" : "default"}
              size="sm"
              onClick={() => setMode(mode === "design" ? "canvas" : "design")}
              title={
                mode === "design"
                  ? "Abrir canvas manual tldraw"
                  : "Volver al generador AI"
              }
            >
              {mode === "design" ? (
                <>
                  <Pencil className="size-3.5" /> Canvas manual
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" /> Volver al generador
                </>
              )}
            </Button>
          </>
        }
      />

      <AnimatePresence mode="wait">
        {mode === "design" ? (
          <motion.div
            key="design"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Hero strip */}
            <DesignHero personaLabel={personaLabel} />

            {/* Steps grid */}
            <div className="relative grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,1.05fr)] gap-4">
              <StepConnector />

              {/* STEP 1 — Skill picker + brand kit */}
              <StepCard tone="step1">
                <SkillPicker activeId={skillId} onSelect={setSkillId} />
                <div className="mt-3">
                  <BrandKitPanel />
                </div>
              </StepCard>

              {/* STEP 2 — Brief */}
              <StepCard tone="step2">
                <BriefInput
                  skill={skill}
                  value={brief}
                  onChange={setBrief}
                  onGenerate={onGenerate}
                  onVariant={onVariant}
                  loading={loading}
                  hasResult={html !== null}
                  personaLabel={personaLabel}
                  cooldownRemainingMs={cooldownRemainingMs}
                  textareaRef={briefRef}
                />
              </StepCard>

              {/* STEP 3 — Preview + Export */}
              <StepCard tone="step3">
                <DesignPreview
                  skill={skill}
                  html={html}
                  loading={loading}
                  error={error}
                  onSwitchToCanvas={switchToCanvas}
                />
                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-[10px] text-muted-foreground/70 font-mono">
                    {html
                      ? `Variante ${variant} · ${Math.round(html.length / 1024)} KB`
                      : "Sin pieza · pulsa Generar"}
                  </div>
                  <ExportButtons skill={skill} html={html} briefHint={brief} />
                </div>
              </StepCard>
            </div>

            {/* References panel */}
            <ReferencesPanel onUseReference={handleUseReference} />

            {/* About footer (compact) */}
            <div className="rounded-lg border border-border/60 bg-card/30 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1 font-bold">
                Sobre Open Design
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Inspirado en{" "}
                <span className="text-foreground font-semibold">Open Design</span>{" "}
                (nexu-io). Local-first: 12 skills, brief en lenguaje natural, AI
                senior de Bewe te devuelve HTML+CSS listo para exportar. Si Gemini
                está caído, puedes dibujar en el Canvas manual.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="w-full h-[calc(100vh-220px)] min-h-[560px] rounded-xl border border-border bg-card overflow-hidden relative"
          >
            <CanvasModeHint />
            <TldrawCanvas persistenceKey="bw_open_bui_doc" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-white text-[12px] font-semibold shadow-[0_10px_30px_-10px_rgba(10,37,64,0.4)]"
              style={{
                background:
                  "linear-gradient(90deg, #60A5FA 0%, #34D399 50%, #60A5FA 100%)",
              }}
            >
              <Sparkles className="size-3.5" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

function DesignHero({ personaLabel }: { personaLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-[hsl(var(--brand-violet)/0.3)]",
        "bg-gradient-to-r from-[hsl(var(--brand-violet)/0.08)] via-card to-[hsl(var(--brand-cyan)/0.07)]",
        "px-5 py-4",
      )}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[hsl(var(--brand-violet)/0.18)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-[hsl(var(--brand-cyan)/0.14)] blur-3xl" />
      <div className="relative flex items-start gap-3 flex-wrap">
        <div className="size-9 grid place-items-center rounded-lg border border-[hsl(var(--brand-violet)/0.4)] bg-[hsl(var(--brand-violet)/0.15)] text-[hsl(var(--brand-violet))] shrink-0">
          <Sparkles className="size-4" />
        </div>
        <div className="flex-1 min-w-[260px]">
          <div className="font-display text-[16px] font-bold leading-tight">
            Genera piezas con AI · brand kit Bewe
          </div>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-relaxed max-w-[640px]">
            Elige un skill, describe tu idea en lenguaje natural y deja que{" "}
            <span className="text-foreground font-semibold">{personaLabel}</span>{" "}
            la diseñe respetando colores, tipografía y voz de marca. Usa tus
            posts orgánicos recientes como referencia visual.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function StepCard({
  tone,
  children,
}: {
  tone: "step1" | "step2" | "step3";
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: tone === "step1" ? 0 : tone === "step2" ? 0.06 : 0.12 }}
      className={cn(
        "relative rounded-xl border border-border bg-card/40 p-4",
        "shadow-[0_2px_10px_-4px_hsl(var(--foreground)/0.08)]",
      )}
    >
      {children}
    </motion.section>
  );
}

function StepConnector() {
  // Línea punteada decorativa entre los 3 step cards en desktop.
  return (
    <div
      className="pointer-events-none absolute hidden lg:block left-0 right-0 top-[44px] h-px z-0"
      aria-hidden
    >
      <div className="mx-[130px] h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-violet)/0.35)] to-transparent" />
    </div>
  );
}

function CanvasModeHint() {
  return (
    <div className="absolute top-2 left-2 z-10 pointer-events-none">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-card/80 backdrop-blur px-2 py-1 rounded-md border border-border">
        <PenTool className="size-3" />
        Modo manual · tldraw v3
      </div>
    </div>
  );
}
