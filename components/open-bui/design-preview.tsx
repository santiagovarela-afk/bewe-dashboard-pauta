"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Loader2, AlertCircle, Clock, Sparkles, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Skill } from "./skills";

interface DesignPreviewProps {
  skill: Skill;
  html: string | null;
  loading: boolean;
  error: string | null;
  /** Optional · al click ofrece cambiar a Canvas Manual cuando quota agotada. */
  onSwitchToCanvas?: () => void;
  /** Persona label · para el loading state ("Mark está pensando…"). */
  personaLabel?: string;
  /** Si viene, preview de imagen pura · Nano Banana modo "image". */
  imageDataUri?: string | null;
  /** Aspect ratio para el preview de imagen (ignorado si html). */
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:5";
}

const ASPECT_DIMS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
};

/**
 * Preview Canva-style con scale-to-fit. El iframe se renderiza a tamaño NATIVO
 * del skill (ej 1080×1080) y se escala con `transform: scale()` para caber en
 * el contenedor disponible · así el HTML del AI mantiene fidelidad pixel-perfect.
 *
 * El iframe sandboxea sin permisos peligrosos (allow-same-origin solo).
 */
export const DesignPreview = React.forwardRef<HTMLDivElement, DesignPreviewProps>(
  function DesignPreview(
    {
      skill,
      html,
      loading,
      error,
      onSwitchToCanvas,
      personaLabel = "Mark OS",
      imageDataUri,
      aspectRatio,
    },
    ref,
  ) {
    const hasImage = Boolean(imageDataUri);
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-full rounded-2xl overflow-hidden",
          "bg-[radial-gradient(60%_50%_at_50%_50%,hsl(var(--brand-violet)/0.06),transparent),radial-gradient(40%_40%_at_85%_85%,hsl(var(--brand-cyan)/0.04),transparent)]",
          "border border-border/60",
        )}
      >
        {/* Canvas grid bg · suave */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--foreground)/0.08) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)/0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {loading && <PreviewLoading personaLabel={personaLabel} imageMode={!!imageDataUri || aspectRatio !== undefined} />}
        {!loading && error && (
          <PreviewError msg={error} onSwitchToCanvas={onSwitchToCanvas} />
        )}
        {!loading && !error && !html && !hasImage && <PreviewEmpty />}
        {!loading && !error && !html && hasImage && imageDataUri && (
          <ScaledImage src={imageDataUri} aspectRatio={aspectRatio ?? "1:1"} />
        )}
        {!loading && !error && html && <ScaledFrame html={html} skill={skill} />}
      </div>
    );
  },
);

/** Preview de imagen pura · Nano Banana modo "image". */
function ScaledImage({
  src,
  aspectRatio,
}: {
  src: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5";
}) {
  const dims = ASPECT_DIMS[aspectRatio];
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(0.4);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function recalc() {
      if (!el) return;
      const padding = 48;
      const availW = el.clientWidth - padding;
      const availH = el.clientHeight - padding;
      if (availW <= 0 || availH <= 0) return;
      const sx = availW / dims.w;
      const sy = availH / dims.h;
      const s = Math.min(sx, sy, 1);
      setScale(s);
    }
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    window.addEventListener("resize", recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [dims.w, dims.h]);

  return (
    <div ref={containerRef} className="absolute inset-0 grid place-items-center p-6">
      <motion.div
        key={src.slice(0, 64)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-xl overflow-hidden bg-white shadow-[0_24px_70px_-20px_hsl(220_50%_15%/0.35),0_8px_22px_-10px_hsl(220_50%_15%/0.2)] ring-1 ring-black/5"
        style={{
          width: dims.w * scale,
          height: dims.h * scale,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Pieza generada por Nano Banana"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur border border-border/60 text-[10px] font-mono text-muted-foreground shadow-sm">
        <Maximize2 className="size-2.5" />
        {`${dims.w}×${dims.h}`}
        <span className="text-muted-foreground/40">·</span>
        <span>{aspectRatio}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
}

/**
 * Renderiza el iframe a tamaño nativo (skill.width × skill.height) y lo escala
 * con transform: scale(...) para llenar el contenedor disponible.
 * Usa ResizeObserver · responsive a resize de la ventana / panel.
 */
function ScaledFrame({ html, skill }: { html: string; skill: Skill }) {
  const wrapped = React.useMemo(() => wrapHtml(html, skill), [html, skill]);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(0.4);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function recalc() {
      if (!el) return;
      const padding = 48; // padding interno del contenedor
      const availW = el.clientWidth - padding;
      const availH = el.clientHeight - padding;
      if (availW <= 0 || availH <= 0) return;
      const sx = availW / skill.width;
      const sy = availH / skill.height;
      const s = Math.min(sx, sy, 1); // nunca upscalear >100%
      setScale(s);
    }
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    window.addEventListener("resize", recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [skill.width, skill.height]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <motion.div
        key={html.slice(0, 32)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-xl overflow-hidden bg-white shadow-[0_24px_70px_-20px_hsl(220_50%_15%/0.35),0_8px_22px_-10px_hsl(220_50%_15%/0.2)] ring-1 ring-black/5"
        style={{
          width: skill.width * scale,
          height: skill.height * scale,
        }}
      >
        <iframe
          srcDoc={wrapped}
          sandbox="allow-same-origin"
          title={`Preview · ${skill.label}`}
          className="border-0 bg-white origin-top-left absolute top-0 left-0"
          style={{
            width: skill.width,
            height: skill.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </motion.div>

      {/* Floating dims badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur border border-border/60 text-[10px] font-mono text-muted-foreground shadow-sm">
        <Maximize2 className="size-2.5" />
        {skill.size}
        <span className="text-muted-foreground/40">·</span>
        <span>{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
}

function PreviewLoading({
  personaLabel,
  imageMode,
}: {
  personaLabel: string;
  imageMode?: boolean;
}) {
  const [phase, setPhase] = React.useState(0);
  const phases = React.useMemo(
    () =>
      imageMode
        ? [
            `Nano Banana renderizando`,
            `Aplicando brand kit Bewe`,
            `Componiendo escena editorial`,
            `Iluminando y enfocando`,
            `Casi listo · puede tardar 15-30s`,
          ]
        : [
            `${personaLabel} está pensando`,
            `Eligiendo paleta brand kit`,
            `Componiendo jerarquía visual`,
            `Inyectando tipografía Inter`,
            `Casi listo`,
          ],
    [personaLabel, imageMode],
  );
  React.useEffect(() => {
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % phases.length),
      1400,
    );
    return () => window.clearInterval(id);
  }, [phases.length]);

  return (
    <div className="absolute inset-0 grid place-items-center bg-card/30 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 text-center max-w-[280px] px-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          className="size-14 rounded-2xl grid place-items-center"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(var(--brand-violet)) 0%, hsl(var(--brand-cyan)) 50%, hsl(var(--brand-violet)) 100%)",
          }}
        >
          <div className="size-12 rounded-2xl bg-card grid place-items-center">
            <Sparkles className="size-5 text-[hsl(var(--brand-violet))]" />
          </div>
        </motion.div>
        <div className="space-y-1">
          <div className="text-sm font-bold">
            {imageMode ? "Generando con Nano Banana" : "Generando tu pieza"}
          </div>
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-[11px] text-muted-foreground font-mono"
          >
            {phases[phase]}…
          </motion.div>
        </div>
        <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-[hsl(var(--brand-violet))] to-transparent"
          />
        </div>
      </motion.div>
    </div>
  );
}

function PreviewEmpty() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-[360px]">
        <EmptyCanvasArt />
        <div className="space-y-1.5">
          <div className="text-base font-bold">Tu pieza aparecerá aquí</div>
          <p className="text-[12px] text-muted-foreground/80 leading-relaxed">
            Elige una plantilla, ajusta el brief y pulsa{" "}
            <span className="font-mono text-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
              Generar
            </span>
            . El AI usará tu brand kit Bewe para crear la pieza.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60">
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-card/60">
            ⌘
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-card/60">
            ↵
          </kbd>
          <span>para generar</span>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvasArt() {
  return (
    <svg viewBox="0 0 140 120" className="size-24" aria-hidden>
      <defs>
        <linearGradient id="emp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand-violet))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="hsl(var(--brand-cyan))" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect
        x="22"
        y="20"
        width="96"
        height="80"
        rx="12"
        fill="hsl(var(--brand-violet))"
        fillOpacity="0.05"
        stroke="url(#emp-g)"
        strokeWidth="1.6"
        strokeDasharray="5 5"
      />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "70px 60px" }}
      >
        <path
          d="M70 38 L72 56 L90 60 L72 64 L70 82 L68 64 L50 60 L68 56 Z"
          fill="hsl(var(--brand-violet))"
          fillOpacity="0.85"
        />
      </motion.g>
      <motion.circle
        cx="44"
        cy="36"
        r="2.5"
        fill="hsl(var(--brand-cyan))"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <motion.circle
        cx="98"
        cy="44"
        r="2"
        fill="hsl(var(--brand-accent))"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}
      />
      <motion.circle
        cx="96"
        cy="86"
        r="2.5"
        fill="hsl(var(--brand-ember))"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 1.2 }}
      />
    </svg>
  );
}

function PreviewError({
  msg,
  onSwitchToCanvas,
}: {
  msg: string;
  onSwitchToCanvas?: () => void;
}) {
  const isQuota = /quota|agot[oó]|cuota|rate.?limit|exceed/i.test(msg);
  return (
    <div className="absolute inset-0 grid place-items-center bg-card/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-center px-6 max-w-[360px]">
        {isQuota ? (
          <div className="size-12 grid place-items-center rounded-full bg-[hsl(var(--brand-ember)/0.15)] border border-[hsl(var(--brand-ember)/0.4)]">
            <Clock className="size-5 text-[hsl(var(--brand-ember))]" />
          </div>
        ) : (
          <div className="size-12 grid place-items-center rounded-full bg-[hsl(var(--destructive)/0.15)] border border-[hsl(var(--destructive)/0.4)]">
            <AlertCircle className="size-5 text-[hsl(var(--destructive))]" />
          </div>
        )}
        <div className="text-base font-bold">
          {isQuota ? "Cuota Gemini agotada" : "No se pudo generar"}
        </div>
        <p className="text-[12px] text-muted-foreground/85 leading-snug">
          {isQuota
            ? "Prueba con el canvas manual o espera 4h a que la cuota se renueve."
            : msg}
        </p>
        {isQuota && onSwitchToCanvas && (
          <button
            type="button"
            onClick={onSwitchToCanvas}
            className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-md bg-[hsl(var(--brand-violet))] text-white hover:brightness-110 transition-all"
          >
            Cambiar a Canvas Manual
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Sanea el HTML del AI:
 * - Quita <script> tags (defensa extra · el sandbox ya bloquea).
 * - Quita on* handlers inline.
 * - Mete un wrapper con tamaño base si falta html/body.
 */
function wrapHtml(raw: string, skill: Skill): string {
  let h = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
  if (!/<html[\s>]/i.test(h)) {
    h = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${skill.width}"><style>html,body{margin:0;padding:0;width:${skill.width}px;height:${skill.height}px;font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${h}</body></html>`;
  }
  return h;
}
