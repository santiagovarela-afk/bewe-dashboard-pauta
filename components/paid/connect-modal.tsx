"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
  platform: string;
  /** Color HSL var name without var() · ej "var(--brand-cyan)" */
  accent: string;
  steps: string[];
  docsHref?: string;
}

/**
 * Modal genérico para "Conectar X" — usado por Paid (Google/TikTok Ads) y SEO (GSC).
 * Solo informativo · explica los pasos para integrar una plataforma futura.
 */
export function ConnectModal({ open, onClose, platform, accent, steps, docsHref }: ConnectModalProps) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center p-4"
        >
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[460px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div
              className="absolute inset-x-0 top-0 h-24 opacity-40 pointer-events-none"
              style={{
                background: `radial-gradient(60% 100% at 50% 0%, hsl(${accent} / 0.5), transparent 70%)`,
              }}
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 size-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary transition-colors z-10"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
            <div className="relative p-6">
              <Badge variant="outline" className="mb-3">
                <ShieldCheck className="size-3 mr-1" /> Conexión segura · OAuth
              </Badge>
              <h2 className="text-xl font-display font-bold tracking-[-0.02em] mb-1">
                Conectar <span style={{ color: `hsl(${accent})` }}>{platform}</span>
              </h2>
              <p className="text-[12px] text-muted-foreground mb-5 leading-relaxed">
                Esta sección aún es un placeholder. Cuando se integre, los pasos serán:
              </p>
              <ol className="space-y-2.5 mb-5">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-[12px] text-foreground/90 leading-relaxed">
                    <span
                      className="shrink-0 size-5 rounded-full grid place-items-center text-[10px] font-bold font-mono"
                      style={{
                        background: `hsl(${accent} / 0.16)`,
                        color: `hsl(${accent})`,
                        border: `1px solid hsl(${accent} / 0.35)`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                  Entendido
                </Button>
                {docsHref && (
                  <Button asChild variant="ghost" size="sm">
                    <a href={docsHref} target="_blank" rel="noreferrer">
                      Docs <ExternalLink className="size-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
