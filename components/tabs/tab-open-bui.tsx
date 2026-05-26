"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pencil, Sparkles, HelpCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TldrawCanvas } from "@/components/open-bui/canvas";
import { DesignPreview } from "@/components/open-bui/design-preview";
import { SKILLS, getSkill } from "@/components/open-bui/skills";
import {
  OpenDesignOnboarding,
  clearOpenDesignOnboardingSeen,
} from "@/components/open-bui/onboarding-tour";
import { TemplatesGrid } from "@/components/open-bui/templates-grid";
import {
  ControlPanel,
  type ControlTab,
} from "@/components/open-bui/control-panel";
import {
  loadHistory,
  pushHistory,
  type HistoryEntry,
} from "@/components/open-bui/history";
import { useDashboard } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  OpenDesignAspect,
  OpenDesignMode,
} from "@/lib/open-design-templates";

/** Variante de imagen devuelta por Nano Banana en el modo image. */
interface ImageVariant {
  dataUri: string;
  mimeType: string;
  textResponse?: string;
}

const STORAGE_KEY_SKILL = "bw_open_design_skill";
const STORAGE_KEY_BRIEF = "bw_open_design_brief";
const STORAGE_KEY_QUOTA_UNTIL = "bw_open_design_quota_until";
const STORAGE_KEY_GEN_MODE = "bw_open_design_gen_mode";
const STORAGE_KEY_ASPECT = "bw_open_design_aspect";
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Open Design · Bewe OS — rediseño Canva-style (may-2026).
 *
 * Layout:
 *   1. Header grande + categorías + templates grid
 *   2. Split horizontal:
 *      - LEFT  (60%) · canvas preview big con scale-to-fit
 *      - RIGHT (40%) · tabs Formato/Idea/Marca/Refs/Export con CTA pegado abajo
 *   3. Toggle "Canvas manual" tldraw queda en el header como modo alterno.
 *
 * Keyboard:
 *   - Cmd+Enter → generar
 *   - Cmd+S    → reservado (Export PNG · handled in ControlPanel/Export tab)
 *
 * Responsive: <1200px colapsa a single column (templates → preview → controls).
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
  const [variantCount, setVariantCount] = React.useState(1);
  const [quotaUntil, setQuotaUntil] = React.useState<number>(0);
  const [now, setNow] = React.useState<number>(() => Date.now());
  const [forceOnb, setForceOnb] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [referenceImages, setReferenceImages] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = React.useState<ControlTab>("idea");
  // Modo de generación · "html" Gemini text · "image" Nano Banana · "hybrid" mix
  const [genMode, setGenMode] = React.useState<OpenDesignMode>("html");
  const [aspectRatio, setAspectRatio] = React.useState<OpenDesignAspect>("1:1");
  // Resultados modo "image" · Nano Banana puede devolver 1-4 variantes
  const [images, setImages] = React.useState<ImageVariant[]>([]);
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);

  // Hidratar
  React.useEffect(() => {
    try {
      const sk = localStorage.getItem(STORAGE_KEY_SKILL);
      if (sk && SKILLS.some((s) => s.id === sk)) setSkillId(sk);
      const br = localStorage.getItem(STORAGE_KEY_BRIEF);
      if (br) setBrief(br);
      const qu = Number(localStorage.getItem(STORAGE_KEY_QUOTA_UNTIL) || "0");
      if (qu > Date.now()) setQuotaUntil(qu);
      const gm = localStorage.getItem(STORAGE_KEY_GEN_MODE);
      if (gm === "html" || gm === "image" || gm === "hybrid") setGenMode(gm);
      const ar = localStorage.getItem(STORAGE_KEY_ASPECT);
      if (ar === "1:1" || ar === "9:16" || ar === "16:9" || ar === "4:5") {
        setAspectRatio(ar);
      }
    } catch {
      /* ignore */
    }
    setHistory(loadHistory());
  }, []);

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
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GEN_MODE, genMode);
    } catch {
      /* ignore */
    }
  }, [genMode]);
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ASPECT, aspectRatio);
    } catch {
      /* ignore */
    }
  }, [aspectRatio]);

  React.useEffect(() => {
    if (quotaUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quotaUntil]);

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
      // Construir body según el modo activo
      const referenceImage = referenceImages[0];
      const body: Record<string, unknown> = {
        mode: genMode,
        skillId,
        brief,
        variant: nextVariant,
        persona: aiPersona,
      };
      if (genMode === "image" || genMode === "hybrid") {
        body.prompt = brief;
        body.aspectRatio = aspectRatio;
        if (genMode === "image") {
          body.variants = Math.min(4, Math.max(1, variantCount));
        }
        if (referenceImage) body.referenceImage = referenceImage;
      }

      const r = await fetch("/api/design/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
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
        setImages([]);
        return;
      }

      // Handler por modo
      if (genMode === "image") {
        const rawImages = Array.isArray(data.images) ? data.images : [];
        const next: ImageVariant[] = rawImages
          .filter(
            (i: unknown): i is ImageVariant =>
              typeof i === "object" &&
              i !== null &&
              typeof (i as ImageVariant).dataUri === "string",
          )
          .map((i: ImageVariant) => ({
            dataUri: i.dataUri,
            mimeType: i.mimeType ?? "image/png",
            textResponse: i.textResponse,
          }));
        setImages(next);
        setActiveImageIdx(0);
        setHtml(null);
        setVariant(nextVariant);
      } else if (genMode === "hybrid") {
        const hybridHtml = typeof data.html === "string" ? data.html : null;
        const dataUri = typeof data.dataUri === "string" ? data.dataUri : null;
        setHtml(hybridHtml);
        if (dataUri) {
          setImages([{ dataUri, mimeType: "image/png" }]);
          setActiveImageIdx(0);
        } else {
          setImages([]);
        }
        setVariant(nextVariant);
        if (hybridHtml) {
          const entry: HistoryEntry = {
            id: new Date().toISOString(),
            skillId,
            brief,
            variant: nextVariant,
            html: hybridHtml,
            persona: aiPersona,
          };
          setHistory(pushHistory(entry));
        }
      } else {
        // mode === "html"
        const htmlOut = typeof data.html === "string" ? data.html : null;
        setHtml(htmlOut);
        setImages([]);
        setVariant(nextVariant);
        if (htmlOut) {
          const entry: HistoryEntry = {
            id: new Date().toISOString(),
            skillId,
            brief,
            variant: nextVariant,
            html: htmlOut,
            persona: aiPersona,
          };
          setHistory(pushHistory(entry));
        }
      }
    } catch (e) {
      setError((e as Error).message || "Falló la generación");
    } finally {
      setLoading(false);
    }
  }

  function onGenerate() {
    if (variantCount > 1) {
      // Genera N variantes serial · solo retenemos la última como activa
      void (async () => {
        for (let i = 0; i < variantCount; i++) {
          await generate(variant + 1 + i);
        }
        setToast(`${variantCount} variantes generadas`);
      })();
      return;
    }
    setVariant(0);
    void generate(0);
  }
  function onVariant() {
    void generate(variant + 1);
  }

  function handleUseReference(snippet: string) {
    setBrief((prev) => (prev ? prev.trimEnd() + snippet : snippet.trimStart()));
    setToast("Referencia agregada al brief");
    setActiveTab("idea");
  }

  function openOnboarding() {
    clearOpenDesignOnboardingSeen();
    setForceOnb(true);
  }

  function pickTemplate(tpl: {
    skillId: string;
    brief: string;
    persona: "mark" | "lua";
    title: string;
    mode?: OpenDesignMode;
    aspect?: OpenDesignAspect;
  }) {
    setSkillId(tpl.skillId);
    setBrief(tpl.brief);
    setActiveTab("idea");
    if (tpl.mode) setGenMode(tpl.mode);
    if (tpl.aspect) setAspectRatio(tpl.aspect);
    setToast(`Plantilla "${tpl.title}" cargada`);
  }

  function pickHistory(h: HistoryEntry) {
    setSkillId(h.skillId);
    setBrief(h.brief);
    setHtml(h.html);
    setVariant(h.variant);
    setToast("Pieza del historial recuperada");
  }

  return (
    <div className="open-design-liquid relative -mx-4 -my-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 rounded-2xl">
      {/* Liquid bg pastel · brand kit Bewe */}
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

      <div className="relative max-w-[1600px] mx-auto space-y-5">
        <OpenDesignOnboarding
          forceOpen={forceOnb}
          onClose={() => setForceOnb(false)}
        />

        {/* HERO HEADER */}
        <DesignHeader
          mode={mode}
          setMode={setMode}
          personaLabel={personaLabel}
          onOnboarding={openOnboarding}
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
              {/* TEMPLATES */}
              <TemplatesGrid onPick={pickTemplate} />

              {/* MAIN SPLIT · Preview (LEFT) + Control Panel (RIGHT) */}
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(380px,2fr)] gap-4 min-h-[640px]">
                {/* LEFT · Preview big */}
                <div className="relative h-[640px] xl:h-[760px]">
                  <DesignPreview
                    skill={skill}
                    html={html}
                    loading={loading}
                    error={error}
                    onSwitchToCanvas={() => setMode("canvas")}
                    personaLabel={personaLabel}
                    imageDataUri={
                      genMode === "image" && images.length > 0
                        ? images[activeImageIdx]?.dataUri ?? null
                        : null
                    }
                    aspectRatio={aspectRatio}
                  />
                  <PreviewMeta
                    variant={variant}
                    html={html}
                    skillLabel={skill.label}
                    genMode={genMode}
                    imageCount={images.length}
                  />
                </div>

                {/* RIGHT · Control panel */}
                <div className="h-[640px] xl:h-[760px]">
                  <ControlPanel
                    skillId={skillId}
                    setSkillId={setSkillId}
                    skill={skill}
                    brief={brief}
                    setBrief={setBrief}
                    onGenerate={onGenerate}
                    onVariant={onVariant}
                    loading={loading}
                    html={html}
                    error={error}
                    variantCount={variantCount}
                    setVariantCount={setVariantCount}
                    cooldownRemainingMs={cooldownRemainingMs}
                    personaLabel={personaLabel}
                    history={history}
                    onPickHistory={pickHistory}
                    referenceImages={referenceImages}
                    setReferenceImages={setReferenceImages}
                    onUseReference={handleUseReference}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    toast={setToast}
                    genMode={genMode}
                    setGenMode={setGenMode}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    images={images}
                    activeImageIdx={activeImageIdx}
                    setActiveImageIdx={setActiveImageIdx}
                  />
                </div>
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
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-card/80 backdrop-blur px-2 py-1 rounded-md border border-border">
                  <Pencil className="size-3" />
                  Modo manual · tldraw v3
                </div>
              </div>
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

/* ---------- Header ---------- */

function DesignHeader({
  mode,
  setMode,
  personaLabel,
  onOnboarding,
}: {
  mode: "design" | "canvas";
  setMode: (m: "design" | "canvas") => void;
  personaLabel: string;
  onOnboarding: () => void;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur px-5 py-4 sm:px-6 sm:py-5 overflow-hidden",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-10 size-56 rounded-full bg-[hsl(var(--brand-violet)/0.18)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-[hsl(var(--brand-cyan)/0.14)] blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold mb-2">
            <Sparkles className="size-3 text-[hsl(var(--brand-violet))]" />
            Open Design · Bewe OS
          </div>
          <h1 className="font-display text-[28px] sm:text-[34px] font-extrabold leading-[1.05] tracking-[-0.025em]">
            Genera piezas con AI{" "}
            <span className="bg-gradient-to-r from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] bg-clip-text text-transparent">
              en segundos
            </span>
          </h1>
          <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-[640px]">
            Elegí una plantilla o describí tu idea — {" "}
            <span className="text-foreground font-semibold">{personaLabel}</span>{" "}
            la diseñará respetando colores, tipografía y voz de marca Bewe.
            Previsualizá en vivo y exportá listo para publicar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="violet" className="font-mono">
            {mode === "design" ? `${personaLabel} · gen` : "tldraw v3"}
          </Badge>
          {mode === "design" && (
            <button
              type="button"
              onClick={onOnboarding}
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
        </div>
      </div>
    </motion.header>
  );
}

function PreviewMeta({
  variant,
  html,
  skillLabel,
  genMode,
  imageCount,
}: {
  variant: number;
  html: string | null;
  skillLabel: string;
  genMode: OpenDesignMode;
  imageCount: number;
}) {
  const showMode = genMode !== "html";
  const modeLabel =
    genMode === "image" ? "Nano Banana" : genMode === "hybrid" ? "Híbrido" : "HTML";
  return (
    <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/85 backdrop-blur border border-border/60 text-[10px] font-mono text-muted-foreground shadow-sm">
      <ChevronRight className="size-2.5 text-[hsl(var(--brand-violet))]" />
      <span className="text-foreground font-semibold">{skillLabel}</span>
      {showMode && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-[hsl(var(--brand-violet))] font-bold">{modeLabel}</span>
        </>
      )}
      {(html || imageCount > 0) && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span>v{variant}</span>
          {html && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{Math.round(html.length / 1024)}KB</span>
            </>
          )}
          {!html && imageCount > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>
                {imageCount} img
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
}
