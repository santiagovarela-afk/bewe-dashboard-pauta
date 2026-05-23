"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Palette, Terminal, ExternalLink, Sparkles, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";

/**
 * Fallback que se muestra si `tldraw` NO está instalado.
 * El usuario solo necesita ejecutar `npm install tldraw` y reiniciar.
 */
export function OpenBuiFallback() {
  const [copied, setCopied] = React.useState(false);
  const cmd = "npm install tldraw";

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-sm min-h-[480px] grid place-items-center"
    >
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />
      <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-[hsl(var(--brand-violet)/0.16)] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] bg-[hsl(var(--brand-cyan)/0.12)] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[560px] w-full p-8 text-center">
        <div className="inline-flex size-14 mx-auto mb-5 grid place-items-center rounded-2xl border border-[hsl(var(--brand-violet)/0.35)] bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))]">
          <Palette className="size-7" />
        </div>

        <Badge variant="violet" className="mb-3">
          <Sparkles className="size-2.5 mr-1" /> Canvas de diseño
        </Badge>

        <h2 className="font-display font-bold tracking-[-0.025em] text-2xl md:text-3xl mb-2">
          Activa <span className="text-aurora">Open BUI</span>
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-[420px] mx-auto">
          Canvas embebido para diseñar piezas dentro del dashboard.
          Una vez instalado <span className="font-mono text-foreground/90">tldraw</span> tendrás
          un editor completo aquí mismo, persistido en localStorage.
        </p>

        <TextureCard className="p-4 mb-5 text-left">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="size-3.5 text-[hsl(var(--brand-lime))]" />
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
                Pasos para activar
              </span>
            </div>
            <Badge variant="outline" className="font-mono">~30s</Badge>
          </div>
          <ol className="space-y-2 mb-4 text-[12px]">
            <li className="flex items-start gap-2">
              <span className="shrink-0 size-4 rounded-full grid place-items-center text-[9px] font-bold font-mono bg-[hsl(var(--brand-violet)/0.16)] text-[hsl(var(--brand-violet))] border border-[hsl(var(--brand-violet)/0.35)]">
                1
              </span>
              <span>
                Detén el dev server (<span className="font-mono">Ctrl+C</span>) en el terminal.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 size-4 rounded-full grid place-items-center text-[9px] font-bold font-mono bg-[hsl(var(--brand-violet)/0.16)] text-[hsl(var(--brand-violet))] border border-[hsl(var(--brand-violet)/0.35)]">
                2
              </span>
              <span>
                Ejecuta el comando de abajo en la raíz del proyecto.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 size-4 rounded-full grid place-items-center text-[9px] font-bold font-mono bg-[hsl(var(--brand-violet)/0.16)] text-[hsl(var(--brand-violet))] border border-[hsl(var(--brand-violet)/0.35)]">
                3
              </span>
              <span>
                Vuelve a iniciar con <span className="font-mono">npm run dev</span> y refresca esta pestaña.
              </span>
            </li>
          </ol>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/60 border border-border">
            <code className="flex-1 font-mono text-[12px] text-foreground/90 truncate">
              <span className="text-muted-foreground/60">$</span> {cmd}
            </code>
            <Button variant="ghost" size="sm" onClick={copy} className="shrink-0">
              {copied ? (
                <>
                  <Check className="size-3.5 text-[hsl(var(--success))]" />
                  <span className="text-[hsl(var(--success))]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </TextureCard>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <SpotlightCard spotlightColor="var(--brand-violet)" intensity={0.18} className="p-3 text-left">
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">Canvas</div>
            <div className="text-[12px] font-semibold">Infinito</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Zoom + pan suave</div>
          </SpotlightCard>
          <SpotlightCard spotlightColor="var(--brand-cyan)" intensity={0.18} className="p-3 text-left">
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">Persiste</div>
            <div className="text-[12px] font-semibold">Auto-save</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">localStorage</div>
          </SpotlightCard>
          <SpotlightCard spotlightColor="var(--brand-lime)" intensity={0.18} className="p-3 text-left">
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">Exporta</div>
            <div className="text-[12px] font-semibold">PNG / SVG</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">1-click</div>
          </SpotlightCard>
        </div>

        <Button asChild variant="outline" size="sm">
          <a href="https://tldraw.dev" target="_blank" rel="noreferrer">
            Sobre tldraw <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
