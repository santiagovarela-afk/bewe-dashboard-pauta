"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Skill } from "./skills";

interface DesignPreviewProps {
  skill: Skill;
  html: string | null;
  loading: boolean;
  error: string | null;
  /** Optional · al click ofrece cambiar a Canvas Manual cuando quota agotada. */
  onSwitchToCanvas?: () => void;
}

/**
 * Iframe sandboxed con srcdoc. Responsive al aspect ratio del skill.
 * El iframe se sandboxea sin permisos peligrosos (no scripts, no top nav,
 * no forms) — solo allow-same-origin para que el CSS interno renderice.
 */
export const DesignPreview = React.forwardRef<HTMLDivElement, DesignPreviewProps>(
  function DesignPreview({ skill, html, loading, error, onSwitchToCanvas }, ref) {
    const [w, h] = skill.aspect.split(":").map(Number);
    const aspectStyle = { aspectRatio: `${w} / ${h}` };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-5 grid place-items-center rounded-md bg-[hsl(var(--brand-violet)/0.15)] border border-[hsl(var(--brand-violet)/0.4)] text-[10px] font-bold font-mono text-[hsl(var(--brand-violet))]">
              3
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
              Preview · Export
            </div>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/70">
            {skill.size}
          </div>
        </div>

        <div
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-border bg-card/40 overflow-hidden relative",
            "shadow-[0_8px_30px_-12px_hsl(var(--brand-violet)/0.25)]",
          )}
          style={aspectStyle}
        >
          {loading && <PreviewLoading />}
          {!loading && error && (
            <PreviewError msg={error} onSwitchToCanvas={onSwitchToCanvas} />
          )}
          {!loading && !error && !html && <PreviewEmpty />}
          {!loading && !error && html && <PreviewFrame html={html} skill={skill} />}
        </div>
      </div>
    );
  },
);

function PreviewFrame({ html, skill }: { html: string; skill: Skill }) {
  // Inyectamos meta viewport + base layout para que el HTML del AI llene
  // el iframe a 100% sin scroll. El scale-to-fit lo logra el contenedor
  // padre con aspect-ratio.
  const wrapped = React.useMemo(() => wrapHtml(html, skill), [html, skill]);

  return (
    <motion.iframe
      key={html.slice(0, 32)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      srcDoc={wrapped}
      sandbox="allow-same-origin"
      title={`Preview · ${skill.label}`}
      className="absolute inset-0 w-full h-full border-0 bg-white"
    />
  );
}

function PreviewLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-7 animate-spin text-[hsl(var(--brand-violet))]" />
        <div className="text-[11px] uppercase tracking-[0.12em]">Generando…</div>
        <ProgressBar />
      </div>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="w-40 h-1 rounded-full bg-secondary overflow-hidden">
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="h-full w-1/2 bg-gradient-to-r from-transparent via-[hsl(var(--brand-violet))] to-transparent"
      />
    </div>
  );
}

function PreviewEmpty() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-card/40 to-[hsl(var(--brand-violet)/0.04)]">
      <div className="flex flex-col items-center gap-3 text-center px-6 max-w-[320px]">
        <EmptyCanvasArt />
        <div className="text-sm font-bold">Tu pieza aparecerá aquí</div>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
          Elige un skill, describe tu idea y pulsa{" "}
          <span className="font-mono text-foreground">Generar</span>. El AI usará
          tu brand kit Bewe para crear la pieza.
        </p>
      </div>
    </div>
  );
}

function EmptyCanvasArt() {
  return (
    <svg viewBox="0 0 120 120" className="size-20" aria-hidden>
      <defs>
        <linearGradient id="emp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand-violet))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(var(--brand-cyan))" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect
        x="18"
        y="22"
        width="84"
        height="76"
        rx="10"
        fill="hsl(var(--brand-violet))"
        fillOpacity="0.06"
        stroke="url(#emp-g)"
        strokeWidth="1.4"
        strokeDasharray="4 4"
      />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "60px 60px" }}
      >
        <path
          d="M60 38 L62 56 L80 60 L62 64 L60 82 L58 64 L40 60 L58 56 Z"
          fill="hsl(var(--brand-violet))"
          fillOpacity="0.85"
        />
      </motion.g>
      <motion.circle
        cx="38"
        cy="38"
        r="2"
        fill="hsl(var(--brand-cyan))"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <motion.circle
        cx="86"
        cy="42"
        r="1.5"
        fill="hsl(var(--brand-accent))"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}
      />
      <motion.circle
        cx="84"
        cy="84"
        r="2"
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
  // Detectar quota Gemini para mostrar mensaje distinto + sugerencia canvas
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
          {isQuota
            ? "Cuota Gemini agotada"
            : "No se pudo generar"}
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
  // Si el AI devolvió un fragmento sin <html>, lo envolvemos.
  if (!/<html[\s>]/i.test(h)) {
    h = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${skill.width}"><style>html,body{margin:0;padding:0;width:${skill.width}px;height:${skill.height}px;font-family:Inter,system-ui,sans-serif;overflow:hidden}</style></head><body>${h}</body></html>`;
  }
  return h;
}
