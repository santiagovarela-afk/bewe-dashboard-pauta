"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Wand2,
  PenLine,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bw_open_design_onb_seen";

interface Slide {
  icon: React.ReactNode;
  badge: string;
  title: string;
  body: string;
  art: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    icon: <Sparkles className="size-4" />,
    badge: "Welcome",
    title: "Open Design · tu generador de piezas con AI",
    body: "Combina tu brand kit Bewe con un brief en lenguaje natural. Mark o Lúa devuelve HTML+CSS listo para exportar como PNG o pieza viva. Inspirado en Open Design (nexu-io), local-first.",
    art: <ArtWelcome />,
  },
  {
    icon: <Wand2 className="size-4" />,
    badge: "Step 1",
    title: "Elige un skill",
    body: "12 formatos canónicos · IG post, IG story, FB ad, banner web, email header, TikTok cover, X post, WhatsApp status, carrusel… El skill define aspect ratio y resolución target.",
    art: <ArtSkills />,
  },
  {
    icon: <PenLine className="size-4" />,
    badge: "Step 2",
    title: "Describe tu idea",
    body: "Escribe el brief en una línea o un párrafo. Usa los quick-prompts si te quedas en blanco. También puedes hacer click en uno de tus posts orgánicos recientes para usarlo como referencia.",
    art: <ArtBrief />,
  },
  {
    icon: <ImageIcon className="size-4" />,
    badge: "Step 3",
    title: "Preview live · exporta",
    body: "Mark/Lúa genera HTML+CSS respetando tu brand kit. Preview en iframe sandboxed. Pide variantes con un click. Exporta PNG (1080×1080+) o el HTML para meterlo en tu sitio.",
    art: <ArtExport />,
  },
];

interface Props {
  /** Permite forzar el tour abierto (botón "?"). */
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OpenDesignOnboarding({ forceOpen, onClose }: Props) {
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (forceOpen) {
      setIdx(0);
      setOpen(true);
      return;
    }
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      /* ignore */
    }
  }, [forceOpen]);

  function persistSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function dismiss() {
    persistSeen();
    setOpen(false);
    onClose?.();
  }

  function next() {
    if (idx < SLIDES.length - 1) setIdx(idx + 1);
    else dismiss();
  }

  function prev() {
    if (idx > 0) setIdx(idx - 1);
  }

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-md p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) dismiss();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-w-[720px] overflow-hidden rounded-2xl border border-[hsl(var(--brand-violet)/0.4)]",
              "bg-gradient-to-br from-card via-card to-[hsl(var(--brand-violet)/0.06)]",
              "shadow-[0_30px_80px_-20px_hsl(var(--brand-violet)/0.4)]",
            )}
          >
            {/* aurora bg */}
            <div className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full bg-[hsl(var(--brand-violet)/0.25)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-[hsl(var(--brand-cyan)/0.2)] blur-3xl" />

            <button
              type="button"
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 size-8 grid place-items-center rounded-md border border-border/60 bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              aria-label="Cerrar onboarding"
            >
              <X className="size-3.5" />
            </button>

            <div className="relative grid grid-cols-1 md:grid-cols-[1fr_240px] gap-0">
              {/* Texto */}
              <div className="p-7 md:p-9 flex flex-col min-h-[340px]">
                <div className="inline-flex items-center gap-1.5 self-start text-[10px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--brand-violet))] mb-3">
                  <span className="size-6 grid place-items-center rounded-md bg-[hsl(var(--brand-violet)/0.15)] border border-[hsl(var(--brand-violet)/0.4)]">
                    {slide.icon}
                  </span>
                  {slide.badge}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex-1"
                  >
                    <h2 className="font-display text-[20px] md:text-[22px] font-bold leading-tight mb-3">
                      {slide.title}
                    </h2>
                    <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[440px]">
                      {slide.body}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Dots + actions */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {SLIDES.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIdx(i)}
                          aria-label={`Ir al paso ${i + 1}`}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === idx
                              ? "w-6 bg-[hsl(var(--brand-violet))]"
                              : "w-1.5 bg-border hover:bg-muted-foreground/40",
                          )}
                        />
                      ))}
                      <span className="ml-2 text-[10px] font-mono text-muted-foreground/70">
                        {idx + 1}/{SLIDES.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={dismiss}
                        className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1"
                      >
                        Saltar
                      </button>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={prev}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        >
                          <ChevronLeft className="size-3" /> Anterior
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={next}
                        className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md bg-[hsl(var(--brand-violet))] text-white hover:brightness-110 font-semibold"
                      >
                        {isLast ? "Empezar a diseñar" : "Siguiente"}
                        {!isLast && <ChevronRight className="size-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Art lateral */}
              <div className="relative hidden md:block bg-gradient-to-br from-[hsl(var(--brand-violet)/0.08)] to-[hsl(var(--brand-cyan)/0.06)] border-l border-border/50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 grid place-items-center p-6"
                  >
                    {slide.art}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hook util para resetear el flag desde botón "?" del tab. */
export function clearOpenDesignOnboardingSeen() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- ARTS ---------- */

function ArtWelcome() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto max-w-[180px]">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand-violet))" />
          <stop offset="100%" stopColor="hsl(var(--brand-cyan))" />
        </linearGradient>
      </defs>
      <rect
        x="30"
        y="30"
        width="140"
        height="140"
        rx="18"
        fill="url(#g1)"
        opacity="0.18"
      />
      <rect
        x="30"
        y="30"
        width="140"
        height="140"
        rx="18"
        fill="none"
        stroke="url(#g1)"
        strokeWidth="1.5"
      />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 18, ease: "linear", repeat: Infinity }}
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx="100" cy="50" r="3" fill="hsl(var(--brand-violet))" />
        <circle cx="150" cy="100" r="3" fill="hsl(var(--brand-cyan))" />
        <circle cx="100" cy="150" r="3" fill="hsl(var(--brand-accent))" />
        <circle cx="50" cy="100" r="3" fill="hsl(var(--brand-ember))" />
      </motion.g>
      <text
        x="100"
        y="106"
        textAnchor="middle"
        fontSize="28"
        fontWeight="800"
        fill="hsl(var(--foreground))"
        fontFamily="Inter, sans-serif"
      >
        BW
      </text>
    </svg>
  );
}

function ArtSkills() {
  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-[180px]">
      <div className="aspect-square rounded-md border border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.15)]" />
      <div className="aspect-[9/16] rounded-md border border-border bg-card/60" />
      <div className="aspect-[16/9] rounded-md border border-border bg-card/60 col-span-2" />
      <div className="aspect-square rounded-md border border-border bg-card/60" />
      <div className="aspect-[3/1] rounded-md border border-border bg-card/60 col-span-1 self-center" />
    </div>
  );
}

function ArtBrief() {
  return (
    <div className="w-full max-w-[180px] rounded-lg border border-border bg-card/70 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <div className="size-1.5 rounded-full bg-[hsl(var(--brand-violet))]" />
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
          Brief
        </div>
      </div>
      <div className="space-y-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "90%" }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="h-1.5 rounded-full bg-foreground/70"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "70%" }}
          transition={{ duration: 1.1, delay: 0.4 }}
          className="h-1.5 rounded-full bg-foreground/40"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "55%" }}
          transition={{ duration: 1, delay: 0.6 }}
          className="h-1.5 rounded-full bg-foreground/25"
        />
      </div>
      <div className="pt-1.5 flex items-center gap-1">
        <div className="text-[8px] px-1.5 py-0.5 rounded bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))] border border-[hsl(var(--brand-violet)/0.4)] font-mono">
          Generar
        </div>
      </div>
    </div>
  );
}

function ArtExport() {
  return (
    <div className="relative w-full max-w-[180px]">
      <div className="aspect-square rounded-lg border border-[hsl(var(--brand-violet))] bg-gradient-to-br from-[hsl(var(--brand-violet)/0.2)] to-[hsl(var(--brand-cyan)/0.15)] grid place-items-center overflow-hidden relative">
        <div className="absolute top-2 left-2 right-2 flex gap-1">
          <div className="h-1 flex-1 rounded-full bg-white/30" />
          <div className="h-1 flex-1 rounded-full bg-white/20" />
        </div>
        <div className="text-center px-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/70 mb-1">
            Bewe
          </div>
          <div className="font-display text-[14px] font-bold leading-tight">
            Tu pieza
            <br />
            live preview
          </div>
        </div>
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
      </div>
      <div className="mt-2 flex gap-1.5 text-[9px] font-mono">
        <div className="px-1.5 py-0.5 rounded bg-card/60 border border-border text-muted-foreground">
          PNG
        </div>
        <div className="px-1.5 py-0.5 rounded bg-card/60 border border-border text-muted-foreground">
          HTML
        </div>
      </div>
    </div>
  );
}
