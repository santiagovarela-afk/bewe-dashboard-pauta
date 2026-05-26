"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutGrid,
  PenLine,
  Palette,
  Lightbulb,
  Download,
  Sparkles,
  Loader2,
  Clock,
  Dice5,
  Wand2,
  Image as ImageIcon,
  X,
  History,
  FileCode,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SkillPicker } from "./skill-picker";
import { BrandKitPanel } from "./brand-kit-panel";
import { ReferencesPanel } from "./references-panel";
import { ExportButtons } from "./export-buttons";
import type { Skill } from "./skills";
import type { HistoryEntry } from "./history";
import type {
  OpenDesignAspect,
  OpenDesignMode,
} from "@/lib/open-design-templates";

export type ControlTab = "format" | "idea" | "brand" | "refs" | "export";

/** Variante de imagen para el grid de preview. */
interface ImageVariant {
  dataUri: string;
  mimeType: string;
  textResponse?: string;
}

interface ControlPanelProps {
  skillId: string;
  setSkillId: (id: string) => void;
  skill: Skill;
  brief: string;
  setBrief: (v: string) => void;
  onGenerate: () => void;
  onVariant: () => void;
  loading: boolean;
  html: string | null;
  error: string | null;
  variantCount: number;
  setVariantCount: (n: number) => void;
  cooldownRemainingMs: number;
  personaLabel: string;
  history: HistoryEntry[];
  onPickHistory: (h: HistoryEntry) => void;
  referenceImages: string[];
  setReferenceImages: (imgs: string[]) => void;
  onUseReference: (snippet: string) => void;
  /** Tab activa controlada desde el padre (templates → "idea"). */
  activeTab: ControlTab;
  setActiveTab: (t: ControlTab) => void;
  toast: (msg: string) => void;
  /** Modo de generación · html | image | hybrid. */
  genMode: OpenDesignMode;
  setGenMode: (m: OpenDesignMode) => void;
  /** Aspect ratio (solo image/hybrid). */
  aspectRatio: OpenDesignAspect;
  setAspectRatio: (a: OpenDesignAspect) => void;
  /** Variantes de imagen del último generate (modo image). */
  images: ImageVariant[];
  activeImageIdx: number;
  setActiveImageIdx: (i: number) => void;
}

const QUICK_PROMPTS = [
  "Lanzamiento de oferta 20% off · CTA Probar gratis",
  "Caso de éxito de salón de belleza · testimonio breve",
  "Recordatorio · agenda tu cita online en segundos",
  "Promo fin de mes · agenda · pagos · marketing en uno",
];

export function ControlPanel(props: ControlPanelProps) {
  const {
    skillId,
    setSkillId,
    skill,
    brief,
    setBrief,
    onGenerate,
    onVariant,
    loading,
    html,
    variantCount,
    setVariantCount,
    cooldownRemainingMs,
    personaLabel,
    history,
    onPickHistory,
    referenceImages,
    setReferenceImages,
    onUseReference,
    activeTab,
    setActiveTab,
    toast,
    genMode,
    setGenMode,
    aspectRatio,
    setAspectRatio,
    images,
    activeImageIdx,
    setActiveImageIdx,
  } = props;

  const inCooldown = cooldownRemainingMs > 0;
  const cooldownMmSs = formatMmSs(cooldownRemainingMs);
  const briefRef = React.useRef<HTMLTextAreaElement | null>(null);

  const tabs: Array<{ id: ControlTab; label: string; icon: React.ReactNode }> = [
    { id: "format", label: "Formato", icon: <LayoutGrid className="size-3.5" /> },
    { id: "idea", label: "Idea", icon: <PenLine className="size-3.5" /> },
    { id: "brand", label: "Marca", icon: <Palette className="size-3.5" /> },
    { id: "refs", label: "Refs", icon: <Lightbulb className="size-3.5" /> },
    { id: "export", label: "Export", icon: <Download className="size-3.5" /> },
  ];

  // Cmd+Enter genera · Cmd+S export PNG (delegado al botón global)
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key === "Enter") {
        if (brief.trim().length >= 4 && !loading && !inCooldown) {
          e.preventDefault();
          onGenerate();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [brief, loading, inCooldown, onGenerate]);

  function onDropImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: string[] = [];
    let pending = files.length;
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .forEach((f) => {
        const r = new FileReader();
        r.onload = () => {
          if (typeof r.result === "string") next.push(r.result);
          pending--;
          if (pending <= 0) {
            setReferenceImages([...referenceImages, ...next].slice(0, 6));
            toast(`${next.length} ref agregada${next.length > 1 ? "s" : ""}`);
          }
        };
        r.readAsDataURL(f);
      });
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-border/60 bg-card/60">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "relative flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="ctrl-tab"
                  className="absolute inset-0 rounded-md bg-[hsl(var(--brand-violet)/0.12)] border border-[hsl(var(--brand-violet)/0.35)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative inline-flex items-center gap-1.5">
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Body · scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "format" && (
            <motion.div
              key="format"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <SkillPicker activeId={skillId} onSelect={setSkillId} />
            </motion.div>
          )}

          {activeTab === "idea" && (
            <motion.div
              key="idea"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Mode selector · HTML/Imagen IA/Híbrido */}
              <ModeSelector mode={genMode} onChange={setGenMode} loading={loading} />

              {/* Aspect ratio selector · solo image/hybrid */}
              <AnimatePresence>
                {(genMode === "image" || genMode === "hybrid") && (
                  <motion.div
                    key="aspect"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AspectRatioSelector
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      loading={loading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Image variants grid · solo cuando hay imágenes generadas */}
              <AnimatePresence>
                {genMode === "image" && images.length > 0 && (
                  <motion.div
                    key="imgrid"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <ImageVariantsGrid
                      images={images}
                      activeIdx={activeImageIdx}
                      onPick={setActiveImageIdx}
                      onEdit={() => {
                        // Vuelve el foco al textarea sin tocar el brief
                        toast("Editá el prompt y volvé a generar");
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PenLine className="size-3.5 text-[hsl(var(--brand-violet))]" />
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em]">
                    Describe tu idea
                  </div>
                </div>
                <Badge variant="violet" className="font-mono">
                  {skill.label}
                </Badge>
              </div>
              <div className="relative">
                <textarea
                  ref={briefRef}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Ej: anuncio para nuevos servicios de belleza · oferta 20% off · CTA Probar gratis"
                  rows={8}
                  disabled={loading}
                  className={cn(
                    "w-full rounded-lg border border-border bg-card/60 px-3 py-3 text-sm",
                    "placeholder:text-muted-foreground/50 leading-relaxed",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-violet)/0.4)] focus-visible:border-[hsl(var(--brand-violet))]",
                    "resize-none transition-all",
                    loading && "opacity-60",
                  )}
                />
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground/40">
                  {brief.length} chars
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mb-1.5 font-bold">
                  Quick prompts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setBrief(q)}
                      disabled={loading}
                      className="text-[10px] px-2 py-1 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variantes slider */}
              <div className="rounded-lg border border-border/60 bg-card/50 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
                    Variantes por click
                  </div>
                  <div className="text-[12px] font-bold font-mono text-[hsl(var(--brand-violet))]">
                    ×{variantCount}
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={variantCount}
                  onChange={(e) => setVariantCount(Number(e.target.value))}
                  disabled={loading}
                  className="w-full accent-[hsl(var(--brand-violet))]"
                />
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                </div>
              </div>

              {history.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-card/50 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
                    <History className="size-3" />
                    Historial · últimas {history.length}
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {history.map((h, i) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => onPickHistory(h)}
                        title={h.brief.slice(0, 80)}
                        className="shrink-0 size-12 rounded-md border border-border bg-secondary/40 grid place-items-center hover:border-[hsl(var(--brand-violet))] transition-colors relative"
                      >
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono text-muted-foreground/50">
                          {h.skillId.slice(0, 4)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "brand" && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <BrandKitPanel />
            </motion.div>
          )}

          {activeTab === "refs" && (
            <motion.div
              key="refs"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <DropZone
                files={referenceImages}
                onFiles={onDropImages}
                onRemove={(i) =>
                  setReferenceImages(referenceImages.filter((_, idx) => idx !== i))
                }
              />
              <ReferencesPanel onUseReference={onUseReference} />
            </motion.div>
          )}

          {activeTab === "export" && (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Download className="size-3.5 text-[hsl(var(--brand-cyan))]" />
                <div className="text-[11px] font-bold uppercase tracking-[0.14em]">
                  Export
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Descarga la pieza como PNG (tamaño nativo {skill.size}) o HTML
                autocontenido para editar/integrar.
              </p>
              <ExportButtons skill={skill} html={html} briefHint={brief} />
              {!html && (
                <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-[10px] text-muted-foreground">
                  Generá una pieza primero para habilitar los exports.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer · Generate CTA siempre visible */}
      <div className="border-t border-border/60 bg-card/60 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="glow"
            size="lg"
            onClick={onGenerate}
            disabled={loading || brief.trim().length < 4 || inCooldown}
            className="flex-1 font-display font-bold"
            title={
              inCooldown
                ? `Cooldown · vuelve en ${cooldownMmSs}`
                : "Generar pieza con AI · Cmd+Enter"
            }
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {personaLabel} está pensando…
              </>
            ) : inCooldown ? (
              <>
                <Clock className="size-4" />
                Espera {cooldownMmSs}
              </>
            ) : (
              <>
                <Wand2 className="size-4" />
                Generar con {personaLabel}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onVariant}
            disabled={loading || !html || inCooldown}
            title="Otra variante con el mismo brief"
          >
            <Dice5 className="size-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/60">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border bg-card">⌘</kbd>
            <kbd className="px-1 py-0.5 rounded border border-border bg-card">↵</kbd>
            <span>generar</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-2.5" />
            {variantCount > 1 ? `${variantCount} variantes` : "1 variante"}
          </span>
        </div>
      </div>
    </div>
  );
}

function DropZone({
  files,
  onFiles,
  onRemove,
}: {
  files: string[];
  onFiles: (fl: FileList | null) => void;
  onRemove: (i: number) => void;
}) {
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-3.5 text-[hsl(var(--brand-cyan))]" />
        <div className="text-[11px] font-bold uppercase tracking-[0.14em]">
          Imágenes de referencia
        </div>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-lg border-2 border-dashed transition-all px-4 py-5 text-center cursor-pointer",
          over
            ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.08)]"
            : "border-border/60 bg-card/40 hover:border-foreground/30",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <ImageIcon className="size-5 mx-auto mb-1.5 text-muted-foreground/70" />
        <div className="text-[11px] font-semibold text-foreground">
          Arrastra imágenes aquí
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          o click para seleccionar · máx 6
        </div>
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {files.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden border border-border bg-secondary/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`ref-${i}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 size-4 grid place-items-center rounded-full bg-black/70 hover:bg-black text-white"
                title="Quitar"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMmSs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ============= Mode selector · HTML / Image / Hybrid ============== */

function ModeSelector({
  mode,
  onChange,
  loading,
}: {
  mode: OpenDesignMode;
  onChange: (m: OpenDesignMode) => void;
  loading: boolean;
}) {
  const options: Array<{
    id: OpenDesignMode;
    label: string;
    sub: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: "html",
      label: "HTML/CSS",
      sub: "pieza web",
      icon: <FileCode className="size-3.5" />,
    },
    {
      id: "image",
      label: "Imagen IA",
      sub: "Nano Banana",
      icon: <Sparkles className="size-3.5" />,
      badge: "NEW",
    },
    {
      id: "hybrid",
      label: "Híbrido",
      sub: "imagen + HTML",
      icon: <Layers className="size-3.5" />,
      badge: "NEW",
    },
  ];
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
        Tipo de pieza
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((o) => {
          const active = mode === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              disabled={loading}
              className={cn(
                "relative rounded-lg border px-2 py-2 text-left transition-all overflow-hidden",
                active
                  ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.1)]"
                  : "border-border bg-card/40 hover:border-foreground/30",
                loading && "opacity-50 cursor-not-allowed",
              )}
              title={`Modo ${o.label} · ${o.sub}`}
            >
              {active && (
                <motion.div
                  layoutId="mode-active-bg"
                  className="absolute inset-0 -z-10"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--brand-violet)/0.18), hsl(var(--brand-cyan)/0.12))",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              {o.badge && (
                <span
                  className="absolute top-1 right-1 text-[8px] font-extrabold px-1 py-[1px] rounded text-white"
                  style={{
                    background:
                      "linear-gradient(90deg, #60A5FA 0%, #34D399 50%, #FAD19E 100%)",
                  }}
                >
                  {o.badge}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-[hsl(var(--brand-violet))]">
                {o.icon}
                <div className="text-[11px] font-bold text-foreground leading-tight">
                  {o.label}
                </div>
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                {o.sub}
              </div>
            </button>
          );
        })}
      </div>
      {mode === "image" && (
        <div className="text-[9.5px] text-muted-foreground/80 leading-snug px-1 italic">
          Nano Banana puede tardar 15-30s para imágenes detalladas.
        </div>
      )}
    </div>
  );
}

/* ============= Aspect ratio selector (image/hybrid) =============== */

function AspectRatioSelector({
  value,
  onChange,
  loading,
}: {
  value: OpenDesignAspect;
  onChange: (a: OpenDesignAspect) => void;
  loading: boolean;
}) {
  const options: Array<{ id: OpenDesignAspect; label: string; hint: string }> = [
    { id: "1:1", label: "1:1", hint: "Post cuadrado" },
    { id: "9:16", label: "9:16", hint: "Story/Reel" },
    { id: "16:9", label: "16:9", hint: "Landscape" },
    { id: "4:5", label: "4:5", hint: "IG portrait" },
  ];
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-2.5 space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
        Formato
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              disabled={loading}
              className={cn(
                "rounded-md border px-1 py-1.5 transition-all text-center",
                active
                  ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.1)]"
                  : "border-border bg-card/40 hover:border-foreground/30",
                loading && "opacity-50 cursor-not-allowed",
              )}
              title={`${o.label} · ${o.hint}`}
            >
              <div className="text-[11px] font-bold font-mono leading-tight">
                {o.label}
              </div>
              <div className="text-[8.5px] text-muted-foreground mt-0.5 leading-tight">
                {o.hint}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============= Image variants grid (image mode) =================== */

function ImageVariantsGrid({
  images,
  activeIdx,
  onPick,
  onEdit,
}: {
  images: ImageVariant[];
  activeIdx: number;
  onPick: (i: number) => void;
  onEdit: () => void;
}) {
  function download(idx: number) {
    const img = images[idx];
    if (!img) return;
    const a = document.createElement("a");
    a.href = img.dataUri;
    a.download = `bewe-nano-banana-${idx + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold">
          <Sparkles className="size-3" />
          Variantes · {images.length}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-[9.5px] font-semibold text-[hsl(var(--brand-violet))] hover:underline"
        >
          Editar prompt
        </button>
      </div>
      <div
        className={cn(
          "grid gap-1.5",
          images.length === 1
            ? "grid-cols-1"
            : images.length === 2
              ? "grid-cols-2"
              : "grid-cols-2",
        )}
      >
        {images.map((img, i) => {
          const active = i === activeIdx;
          return (
            <div
              key={i}
              className={cn(
                "relative rounded-md overflow-hidden border-2 transition-all cursor-zoom-in",
                active
                  ? "border-[hsl(var(--brand-violet))] shadow-[0_4px_18px_-4px_hsl(var(--brand-violet)/0.5)]"
                  : "border-border hover:border-foreground/30",
              )}
              onClick={() => onPick(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUri}
                alt={`Variante ${i + 1}`}
                className="block w-full aspect-square object-cover"
              />
              <div className="absolute top-1 left-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-card/85 backdrop-blur text-foreground">
                v{i + 1}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  download(i);
                }}
                className="absolute bottom-1 right-1 size-6 grid place-items-center rounded-md bg-card/90 backdrop-blur border border-border text-[hsl(var(--brand-violet))] hover:bg-card opacity-0 group-hover:opacity-100 transition-opacity"
                title="Descargar PNG"
              >
                <Download className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
      {images[activeIdx] && (
        <button
          type="button"
          onClick={() => download(activeIdx)}
          className="w-full inline-flex items-center justify-center gap-1.5 text-[10.5px] font-semibold px-2 py-1.5 rounded-md border border-border bg-card hover:bg-secondary transition-colors"
        >
          <Download className="size-3" />
          Descargar variante activa (PNG)
        </button>
      )}
    </div>
  );
}
