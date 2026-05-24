"use client";
/**
 * components/aeo/model-comparison.tsx
 *
 * Compara visibility de Bewe en 4 modelos de Groq. Llama POST /api/aeo/compare-models
 * que corre 10 prompts × 4 modelos = 40 reqs (secuencial para respetar 30 RPM).
 *
 * NO auto-run · consume cuota · botón explícito.
 */
import * as React from "react";
import { motion } from "motion/react";
import { Cpu, Loader2, Layers, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ModelComparison {
  model: string;
  visibilityPct: number;
  avgLatencyMs: number;
  uniqueCompetitors: number;
  hits: number;
  total: number;
  errors: number;
}

interface CompareResponse {
  comparisons?: ModelComparison[];
  promptCount?: number;
  durationMs?: number;
  error?: string;
}

const MODEL_LABEL: Record<string, string> = {
  "llama-3.3-70b-versatile": "Llama 3.3 70B (actual)",
  "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
  "mixtral-8x7b-32768": "Mixtral 8x7B",
  "gemma2-9b-it": "Gemma 2 9B",
};

const MODEL_COLOR: Record<string, string> = {
  "llama-3.3-70b-versatile": "var(--brand-violet)",
  "llama-3.1-8b-instant": "var(--brand-cyan)",
  "mixtral-8x7b-32768": "var(--brand-ember)",
  "gemma2-9b-it": "var(--brand-lime)",
};

export function AeoModelComparison() {
  const [loading, setLoading] = React.useState(false);
  const [comparisons, setComparisons] = React.useState<ModelComparison[] | null>(null);
  const [promptCount, setPromptCount] = React.useState<number>(0);
  const [durationMs, setDurationMs] = React.useState<number>(0);

  async function runCompare() {
    if (loading) return;
    setLoading(true);
    toast.info("Comparando 4 modelos · 10 prompts cada uno · puede tardar 2–4 min");
    try {
      const r = await fetch("/api/aeo/compare-models", { method: "POST" });
      const j = (await r.json()) as CompareResponse;
      if (!r.ok || j.error) {
        toast.error(j.error || `Error ${r.status}`);
        return;
      }
      setComparisons(j.comparisons ?? []);
      setPromptCount(j.promptCount ?? 0);
      setDurationMs(j.durationMs ?? 0);
      toast.success(`Comparativa lista · ${(j.comparisons ?? []).length} modelos`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const maxVis = comparisons
    ? Math.max(1, ...comparisons.map((c) => c.visibilityPct))
    : 100;

  return (
    <TextureCard className="p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-[hsl(var(--brand-cyan))]" />
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Comparativa por modelo
          </h3>
        </div>
        <Button onClick={() => void runCompare()} size="sm" variant="outline" disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Layers className="size-3.5" />}
          {loading ? "Corriendo…" : "Comparar 4 modelos"}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 max-w-[700px]">
        Corre 10 prompts × 4 modelos de Groq para ver en cuál Bewe aparece mejor.
        Consume cuota (~40 requests) · secuencial para respetar 30 RPM · botón
        explícito porque no es auto.
      </p>

      {!comparisons && !loading && (
        <div className="text-[11px] text-muted-foreground/80">
          Pulsá <strong>Comparar 4 modelos</strong> para ver visibility + latencia
          por modelo.
        </div>
      )}

      {comparisons && comparisons.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4 text-[10px] font-mono text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {promptCount} prompts × {comparisons.length} modelos
            </Badge>
            <span>·</span>
            <span>{(durationMs / 1000).toFixed(1)}s total</span>
          </div>

          <div className="space-y-2.5">
            {comparisons.map((c, i) => {
              const color = MODEL_COLOR[c.model] ?? "var(--brand-violet)";
              const pct = (c.visibilityPct / maxVis) * 100;
              return (
                <motion.div
                  key={c.model}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: `hsl(${color})` }}
                        aria-hidden
                      />
                      <span className="text-[11px] font-medium">
                        {MODEL_LABEL[c.model] ?? c.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Target className="size-3" />
                        {c.hits}/{c.total}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {c.avgLatencyMs}ms
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3" />
                        {c.uniqueCompetitors} comp.
                      </span>
                      {c.errors > 0 && (
                        <Badge variant="warning" className="font-mono text-[9px]">
                          {c.errors} err
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `hsl(${color})` }}
                      />
                    </div>
                    <div
                      className="font-mono font-bold text-[12px] tabular w-12 text-right"
                      style={{ color: `hsl(${color})` }}
                    >
                      {c.visibilityPct}%
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 leading-snug">
            Sirve para entender en qué modelo la marca aparece mejor · si un modelo
            con menor cuota tiene mejor visibility, considerá optimizar contenido para
            su training data style.
          </p>
        </>
      )}
    </TextureCard>
  );
}
