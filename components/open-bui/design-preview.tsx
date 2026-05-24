"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Skill } from "./skills";

interface DesignPreviewProps {
  skill: Skill;
  html: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Iframe sandboxed con srcdoc. Responsive al aspect ratio del skill.
 * El iframe se sandboxea sin permisos peligrosos (no scripts, no top nav,
 * no forms) — solo allow-same-origin para que el CSS interno renderice.
 */
export const DesignPreview = React.forwardRef<HTMLDivElement, DesignPreviewProps>(
  function DesignPreview({ skill, html, loading, error }, ref) {
    const [w, h] = skill.aspect.split(":").map(Number);
    const aspectStyle = { aspectRatio: `${w} / ${h}` };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Preview
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
          {!loading && error && <PreviewError msg={error} />}
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
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-2 text-center px-6 max-w-[280px]">
        <div className="size-12 rounded-full grid place-items-center bg-secondary/60 border border-border">
          <ImageIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="text-sm font-semibold">Aún sin pieza</div>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
          Elige un skill, describe el brief y pulsa{" "}
          <span className="font-mono">Generar</span> para crear tu primera pieza.
        </p>
      </div>
    </div>
  );
}

function PreviewError({ msg }: { msg: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-card/80">
      <div className="flex flex-col items-center gap-2 text-center px-6 max-w-[300px]">
        <AlertCircle className="size-6 text-[hsl(var(--destructive))]" />
        <div className="text-sm font-semibold">No se pudo generar</div>
        <p className="text-[11px] text-muted-foreground/80 leading-snug">{msg}</p>
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
