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
  Palette,
  Instagram,
  Brain,
  PencilRuler,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bw_open_design_onb_seen";

interface Slide {
  icon: React.ReactNode;
  badge: string;
  title: string;
  body: string;
  detail?: string;
  art: React.ReactNode;
}

const SLIDES: Slide[] = [
  // ─── 1. Welcome ────────────────────────────────────────────────
  {
    icon: <Sparkles className="size-4" />,
    badge: "Welcome",
    title: "Open Design · piezas con tu marca, generadas por AI",
    body:
      "No es Canva. Es tu generador local: brand kit Bewe pre-cargado, " +
      "Mark/Lúa OS leyendo tu memoria, y tus referentes orgánicos como ancla. " +
      "Output: HTML+CSS real · exportable a PNG 1080+ o pieza viva.",
    detail:
      "Inspirado en Open Design (nexu-io) · 100% local · sin enviar tu marca a terceros.",
    art: <ArtWelcome />,
  },

  // ─── 2. Skill picker ────────────────────────────────────────────
  {
    icon: <Wand2 className="size-4" />,
    badge: "1 · Skill",
    title: "12 formatos canónicos · uno por tipo de pieza",
    body:
      "Cada skill define el lienzo correcto: IG post 1080² · IG story 1080×1920 · " +
      "Reel cover · FB ad 1200×628 · banner web · email header · carrusel slide · " +
      "TikTok cover · WhatsApp status · X post · Linkedin · landing hero.",
    detail:
      "El AR y la resolución son exactos · lo que ves es lo que sale al publicar.",
    art: <ArtSkills />,
  },

  // ─── 3. Brand Kit ────────────────────────────────────────────────
  {
    icon: <Palette className="size-4" />,
    badge: "2 · Brand Kit",
    title: "Tu paleta Bewe ya está cargada · sin perder identidad",
    body:
      "Violet · Cyan · Lime · Ember. Inter ExtraBold para display, Inter " +
      "regular para body. Logos y tagline ya viven en el sistema. Todo lo que " +
      "generes respeta el design system Bewe out-of-the-box.",
    detail: "¿Cambian los colores? Editás un solo archivo y todo se actualiza.",
    art: <ArtBrandKit />,
  },

  // ─── 4. Brief ────────────────────────────────────────────────────
  {
    icon: <PenLine className="size-4" />,
    badge: "3 · Brief",
    title: "Describí tu idea como se la dirías a un diseñador",
    body:
      "Una línea o un párrafo. \"Anuncio promoviendo Black Friday 30% off para " +
      "salones de belleza · vibe festiva\" sirve. Si te quedaste en blanco, " +
      "tenés quick-prompts pre-armados según el skill que elegiste.",
    detail: "El brief se combina con tu brand kit + tu memoria del agente.",
    art: <ArtBrief />,
  },

  // ─── 5. Referentes orgánicos ─────────────────────────────────────
  {
    icon: <Instagram className="size-4" />,
    badge: "4 · Referentes",
    title: "Usá tus mejores posts orgánicos como ancla",
    body:
      "Panel lateral carga los posts top de @bewe_software · Facebook · Reels. " +
      "Click en cualquiera → su caption y vibe entra al brief automáticamente. " +
      "El AI genera una variante con tu estética real, no genérica.",
    detail: "Filtrá por likes, engagement, o formato. Hover muestra el caption.",
    art: <ArtReferences />,
  },

  // ─── 6. Generación ───────────────────────────────────────────────
  {
    icon: <Brain className="size-4" />,
    badge: "5 · Generación",
    title: "Mark o Lúa piensan y devuelven HTML+CSS real",
    body:
      "Gemini 2.5 Flash recibe brief + brand kit + memoria. " +
      "Genera HTML válido autocontenido (no markdown, no placeholder imagenes). " +
      "Preview en iframe sandboxed · ves tu pieza al instante.",
    detail:
      "Pedís variantes con un click · cada variante usa otra temperatura / " +
      "otra composición · podés guardar la que más te guste.",
    art: <ArtGeneration />,
  },

  // ─── 7. Canvas manual ────────────────────────────────────────────
  {
    icon: <PencilRuler className="size-4" />,
    badge: "6 · Manual",
    title: "Canvas tldraw v3 · ajustes finos a mano",
    body:
      "¿La AI no clavó algo? Toggle a modo Canvas. Pizarra completa: shapes, " +
      "texto, sticky notes, líneas, frames. Importás cualquier pieza generada " +
      "y la retocás con precisión píxel.",
    detail: "Mismo skill · mismas dimensiones · todo en el mismo flow.",
    art: <ArtCanvas />,
  },

  // ─── 8. Export ───────────────────────────────────────────────────
  {
    icon: <Download className="size-4" />,
    badge: "7 · Export",
    title: "Exportá PNG, HTML, o guardalo en tu librería",
    body:
      "PNG 1080+ vía html2canvas (offline, sin servicios externos). " +
      "HTML completo para meter en Wordpress, Webflow o un newsletter. " +
      "O guardalo en tu library del dashboard para reusar.",
    detail:
      "La pieza siempre es tuya · vive en .data local · no se sube a ningún cloud.",
    art: <ArtExport />,
  },
];

interface Props {
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

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx]);

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
          className="fixed inset-0 z-[100] grid place-items-center bg-background/85 backdrop-blur-md p-4"
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
              "relative w-full max-w-[820px] max-h-[92vh] overflow-hidden rounded-2xl border border-[hsl(var(--brand-violet)/0.4)]",
              "bg-gradient-to-br from-card via-card to-[hsl(var(--brand-violet)/0.06)]",
              "shadow-[0_30px_80px_-20px_hsl(var(--brand-violet)/0.45)]",
            )}
          >
            {/* aurora bg */}
            <div className="pointer-events-none absolute -top-40 -right-40 size-[420px] rounded-full bg-[hsl(var(--brand-violet)/0.22)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-40 size-[420px] rounded-full bg-[hsl(var(--brand-cyan)/0.18)] blur-3xl" />

            <button
              type="button"
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 size-8 grid place-items-center rounded-md border border-border/60 bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              aria-label="Cerrar onboarding"
              title="Cerrar (Esc)"
            >
              <X className="size-3.5" />
            </button>

            <div className="relative grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0">
              {/* Texto */}
              <div className="p-6 md:p-8 flex flex-col min-h-[400px]">
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
                    className="flex-1 min-w-0"
                  >
                    <h2 className="font-display text-[20px] md:text-[22px] font-bold leading-tight mb-3">
                      {slide.title}
                    </h2>
                    <p className="text-[13px] text-foreground/85 leading-relaxed max-w-[460px] mb-3">
                      {slide.body}
                    </p>
                    {slide.detail && (
                      <p className="text-[11.5px] text-muted-foreground leading-relaxed max-w-[460px] border-l-2 border-[hsl(var(--brand-violet)/0.4)] pl-3 italic">
                        {slide.detail}
                      </p>
                    )}
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
                              : i < idx
                                ? "w-1.5 bg-[hsl(var(--brand-violet)/0.5)]"
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
                        className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md bg-[hsl(var(--brand-violet))] text-white hover:brightness-110 font-semibold shadow-[0_4px_14px_-4px_hsl(var(--brand-violet)/0.6)]"
                      >
                        {isLast ? "Empezar a diseñar" : "Siguiente"}
                        {!isLast && <ChevronRight className="size-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Art lateral */}
              <div className="relative hidden md:block bg-gradient-to-br from-[hsl(var(--brand-violet)/0.10)] via-card/40 to-[hsl(var(--brand-cyan)/0.08)] border-l border-border/50 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 grid place-items-center p-5"
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

export function clearOpenDesignOnboardingSeen() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ──────────────────────────────────────────────────────────────────
   ARTS · una ilustración por slide · cohesivas con la marca
   ────────────────────────────────────────────────────────────────── */

function ArtWelcome() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto max-w-[200px]">
      <defs>
        <linearGradient id="ow-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand-violet))" />
          <stop offset="100%" stopColor="hsl(var(--brand-cyan))" />
        </linearGradient>
      </defs>
      <rect x="20" y="20" width="160" height="160" rx="22" fill="url(#ow-g1)" opacity="0.18" />
      <rect x="20" y="20" width="160" height="160" rx="22" fill="none" stroke="url(#ow-g1)" strokeWidth="1.6" />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
        style={{ transformOrigin: "100px 100px" }}
      >
        <circle cx="100" cy="45" r="4" fill="hsl(var(--brand-violet))" />
        <circle cx="155" cy="100" r="4" fill="hsl(var(--brand-cyan))" />
        <circle cx="100" cy="155" r="4" fill="hsl(var(--brand-accent))" />
        <circle cx="45" cy="100" r="4" fill="hsl(var(--brand-ember))" />
      </motion.g>
      <text x="100" y="108" textAnchor="middle" fontSize="34" fontWeight="800" fill="hsl(var(--foreground))" fontFamily="Inter, sans-serif">
        BW
      </text>
      <text x="100" y="128" textAnchor="middle" fontSize="9" fontWeight="600" letterSpacing="2" fill="hsl(var(--muted-foreground))" fontFamily="Inter, sans-serif">
        OPEN · DESIGN
      </text>
    </svg>
  );
}

function ArtSkills() {
  // Mini-grid de los 12 formatos en sus aspect ratios reales
  const formats = [
    { ar: "aspect-square",  label: "IG" },
    { ar: "aspect-[9/16]",  label: "STORY" },
    { ar: "aspect-[9/16]",  label: "REEL" },
    { ar: "aspect-[16/9]",  label: "BANNER" },
    { ar: "aspect-square",  label: "X" },
    { ar: "aspect-square",  label: "LI" },
    { ar: "aspect-[3/1]",   label: "EMAIL" },
    { ar: "aspect-square",  label: "FB" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5 w-full max-w-[220px]">
      {formats.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
          className={cn(
            f.ar,
            "rounded-md border text-[7px] font-mono font-bold uppercase tracking-wider flex items-center justify-center",
            i === 0
              ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.18)] text-[hsl(var(--brand-violet))]"
              : "border-border bg-card/50 text-muted-foreground/70",
          )}
        >
          {f.label}
        </motion.div>
      ))}
    </div>
  );
}

function ArtBrandKit() {
  const swatches = [
    { color: "hsl(var(--brand-violet))", label: "Violet" },
    { color: "hsl(var(--brand-cyan))",   label: "Cyan"   },
    { color: "hsl(var(--brand-accent))", label: "Lime"   },
    { color: "hsl(var(--brand-ember))",  label: "Ember"  },
  ];
  return (
    <div className="w-full max-w-[220px] space-y-3">
      <div className="rounded-lg border border-border bg-card/70 p-3">
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
          Paleta
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {swatches.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="size-9 rounded-md shadow-sm border border-white/20"
                style={{ background: s.color }}
              />
              <span className="text-[8px] font-mono text-muted-foreground">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card/70 p-3 space-y-1">
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
          Tipografía
        </div>
        <div className="font-display text-[18px] font-extrabold leading-tight">
          Inter Bold
        </div>
        <div className="text-[11px] text-muted-foreground">
          Inter Regular · 400
        </div>
      </div>
    </div>
  );
}

function ArtBrief() {
  return (
    <div className="w-full max-w-[220px] rounded-lg border border-border bg-card/70 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-[hsl(var(--brand-violet))]" />
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
            Tu brief
          </div>
        </div>
        <div className="text-[8px] font-mono text-muted-foreground/60">
          IG · 1080²
        </div>
      </div>
      <div className="space-y-1.5">
        <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} transition={{ duration: 1.2, delay: 0.15 }} className="h-2 rounded-full bg-foreground/80" />
        <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 1.1, delay: 0.4 }} className="h-2 rounded-full bg-foreground/55" />
        <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 1.0, delay: 0.65 }} className="h-2 rounded-full bg-foreground/35" />
        <motion.div initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 0.9, delay: 0.85 }} className="h-2 rounded-full bg-foreground/20" />
      </div>
      <div className="pt-2 flex items-center gap-1 flex-wrap">
        {["#promo", "#beauty", "#cta"].map((t, i) => (
          <span
            key={i}
            className="text-[8px] px-1.5 py-0.5 rounded bg-[hsl(var(--brand-cyan)/0.12)] text-[hsl(var(--brand-cyan))] border border-[hsl(var(--brand-cyan)/0.35)] font-mono"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="pt-1.5">
        <div className="text-[8px] px-2 py-1 inline-block rounded bg-[hsl(var(--brand-violet))] text-white font-bold">
          ✨ Generar
        </div>
      </div>
    </div>
  );
}

function ArtReferences() {
  // Mock 3 mini posts del feed organico
  return (
    <div className="w-full max-w-[220px] space-y-2">
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Instagram className="size-3" /> Tus posts · top
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "12k", g: "from-pink-400 to-rose-500" },
          { label: "8.4k", g: "from-violet-500 to-cyan-500" },
          { label: "5.2k", g: "from-amber-400 to-orange-500" },
          { label: "4.1k", g: "from-cyan-400 to-emerald-500" },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 * i }}
            whileHover={{ scale: 1.04 }}
            className={cn(
              "aspect-square rounded-md bg-gradient-to-br relative overflow-hidden border-2",
              p.g,
              i === 0
                ? "border-[hsl(var(--brand-violet))] shadow-[0_0_0_2px_hsl(var(--brand-violet)/0.3)]"
                : "border-transparent",
            )}
          >
            <div className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-black/40 px-1 rounded">
              ❤ {p.label}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="text-[9px] text-muted-foreground/70 italic leading-tight">
        Click → enchufa el caption + vibe al brief
      </div>
    </div>
  );
}

function ArtGeneration() {
  return (
    <div className="w-full max-w-[220px] space-y-2">
      <div className="rounded-lg border border-[hsl(var(--brand-violet)/0.4)] bg-card/80 p-2.5">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="size-4 rounded-full border-2 border-[hsl(var(--brand-violet))] border-t-transparent"
          />
          <div className="text-[10px] font-mono text-[hsl(var(--brand-violet))]">
            Mark OS pensando
          </div>
        </div>
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              className="h-1 rounded bg-[hsl(var(--brand-violet)/0.6)]"
              style={{ width: `${50 + i * 12}%` }}
            />
          ))}
        </div>
        <div className="mt-2 text-[8px] font-mono text-muted-foreground/70">
          {"<!DOCTYPE html>"}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square rounded border border-border bg-gradient-to-br from-[hsl(var(--brand-violet)/0.18)] to-[hsl(var(--brand-cyan)/0.12)] grid place-items-center text-[8px] font-mono font-bold text-muted-foreground"
          >
            v{i}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtCanvas() {
  return (
    <div className="w-full max-w-[220px] aspect-[4/3] rounded-lg border border-border bg-card/70 relative overflow-hidden">
      {/* dots grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />
      {/* Mock shapes */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 40, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="absolute top-4 left-4 w-16 h-12 rounded bg-[hsl(var(--brand-violet)/0.4)] border-2 border-[hsl(var(--brand-violet))]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="absolute top-3 right-5 px-2 py-1 rounded bg-yellow-200 text-yellow-900 text-[8px] font-bold rotate-[3deg] shadow-md"
      >
        sticky 💡
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-[hsl(var(--brand-cyan))]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-2 right-3 text-[8px] font-mono text-muted-foreground"
      >
        tldraw v3
      </motion.div>
    </div>
  );
}

function ArtExport() {
  return (
    <div className="w-full max-w-[220px] space-y-2.5">
      <div className="aspect-square rounded-lg border border-[hsl(var(--brand-violet))] bg-gradient-to-br from-[hsl(var(--brand-violet)/0.22)] to-[hsl(var(--brand-cyan)/0.18)] relative overflow-hidden grid place-items-center">
        <div className="absolute top-2 left-2 right-2 flex gap-1">
          <div className="h-1 flex-1 rounded-full bg-white/30" />
          <div className="h-1 flex-1 rounded-full bg-white/20" />
        </div>
        <div className="text-center px-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/80 mb-1">
            Bewe
          </div>
          <div className="font-display text-[15px] font-bold leading-tight text-white">
            Tu pieza
            <br />
            lista
          </div>
        </div>
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
      </div>
      <div className="flex gap-1.5 text-[9px] font-mono">
        <div className="flex-1 px-1.5 py-1 rounded bg-[hsl(var(--brand-violet)/0.18)] border border-[hsl(var(--brand-violet)/0.4)] text-[hsl(var(--brand-violet))] text-center font-bold">
          PNG 1080+
        </div>
        <div className="flex-1 px-1.5 py-1 rounded bg-card/60 border border-border text-muted-foreground text-center">
          HTML
        </div>
        <div className="flex-1 px-1.5 py-1 rounded bg-card/60 border border-border text-muted-foreground text-center">
          Library
        </div>
      </div>
    </div>
  );
}
