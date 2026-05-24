"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Sparkles, Dice5, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Skill } from "./skills";

interface BriefInputProps {
  skill: Skill;
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onVariant: () => void;
  loading: boolean;
  hasResult: boolean;
  personaLabel: string;
}

const PLACEHOLDER =
  "Ej: anuncio para nuevos servicios de belleza · oferta 20% off · CTA Probar gratis";

const QUICK_PROMPTS = [
  "Lanzamiento de oferta 20% off · CTA Probar gratis",
  "Caso de éxito de salón de belleza · testimonio breve",
  "Recordatorio · agenda tu cita online en segundos",
  "Promo fin de mes · agenda · pagos · marketing en uno",
];

export function BriefInput({
  skill,
  value,
  onChange,
  onGenerate,
  onVariant,
  loading,
  hasResult,
  personaLabel,
}: BriefInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Brief
        </div>
        <Badge variant="violet" className="font-mono">
          {skill.label}
        </Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={6}
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
          {value.length} chars
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(q)}
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="glow"
          size="sm"
          onClick={onGenerate}
          disabled={loading || value.trim().length < 4}
          className="font-display"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Generar con {personaLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onVariant}
          disabled={loading || !hasResult}
        >
          <Dice5 className="size-3.5" /> Variante
        </Button>
      </div>
    </div>
  );
}
