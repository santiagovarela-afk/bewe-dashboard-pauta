"use client";
/**
 * components/aeo/recommendations.tsx
 *
 * Sección de recomendaciones AEO generadas con IA · llama POST /api/aeo/recommend.
 * El endpoint toma el último run y construye un prompt con visibility, gaps,
 * competidores y categorías; Groq devuelve 5 recos categorizadas.
 *
 * Render: lista con ✦ y un Badge de categoría.
 */
import * as React from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Loader2,
  Lightbulb,
  PenLine,
  Search,
  Handshake,
  Tag,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RecCategory = "content" | "seo" | "partnership" | "pricing" | "other";

interface Recommendation {
  title: string;
  detail: string;
  category: RecCategory;
}

interface BasedOn {
  runAt: string;
  visibilityPct: number;
  totalPrompts: number;
}

interface RecommendationsResponse {
  recommendations?: Recommendation[];
  basedOn?: BasedOn;
  error?: string;
}

const CAT_META: Record<
  RecCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; variant: "violet" | "cyan" | "lime" | "ember" | "outline" }
> = {
  content: { label: "Contenido", icon: PenLine, variant: "violet" },
  seo: { label: "SEO", icon: Search, variant: "cyan" },
  partnership: { label: "Partnership", icon: Handshake, variant: "lime" },
  pricing: { label: "Pricing", icon: Tag, variant: "ember" },
  other: { label: "Otros", icon: HelpCircle, variant: "outline" },
};

export function AeoRecommendations({ hasData }: { hasData: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const [recs, setRecs] = React.useState<Recommendation[] | null>(null);
  const [basedOn, setBasedOn] = React.useState<BasedOn | null>(null);

  async function generate() {
    if (loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/aeo/recommend", { method: "POST" });
      const j = (await r.json()) as RecommendationsResponse;
      if (!r.ok || j.error) {
        toast.error(j.error || `Error ${r.status}`);
        return;
      }
      const list = j.recommendations ?? [];
      setRecs(list);
      setBasedOn(j.basedOn ?? null);
      toast.success(`${list.length} recomendaciones generadas con Groq`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TextureCard className="p-5">
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-[hsl(var(--brand-violet))]" />
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Recomendaciones automáticas
          </h3>
        </div>
        <Button
          onClick={() => void generate()}
          size="sm"
          variant="glow"
          disabled={loading || !hasData}
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {loading
            ? "Generando…"
            : recs
              ? "Regenerar con IA"
              : "Generar recomendaciones con IA"}
        </Button>
      </div>

      {!hasData && (
        <p className="text-[11px] text-muted-foreground">
          Primero corré un análisis AEO para tener datos sobre los que generar recomendaciones.
        </p>
      )}

      {hasData && !recs && !loading && (
        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[680px]">
          Groq analiza los gaps · prompts donde Bewe NO apareció, competidores
          dominantes, industrias adyacentes · y devuelve 5 acciones concretas
          (no genéricas) para mejorar visibility en LLMs.
        </p>
      )}

      {basedOn && (
        <div className="text-[10px] text-muted-foreground/80 mb-3 font-mono">
          basado en run {new Date(basedOn.runAt).toLocaleString("es", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })} · {basedOn.visibilityPct}% visibility · {basedOn.totalPrompts} prompts
        </div>
      )}

      {recs && (
        <ul className="space-y-2.5 mt-1">
          {recs.map((rec, i) => {
            const meta = CAT_META[rec.category] ?? CAT_META.other;
            const Icon = meta.icon;
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-secondary/30 border border-border/60"
              >
                <div
                  className="size-7 grid place-items-center rounded-md shrink-0 text-[hsl(var(--brand-violet))]"
                  style={{ background: `hsl(var(--brand-violet) / 0.12)` }}
                  aria-hidden
                >
                  <span className="text-[14px] leading-none">✦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={meta.variant} className="font-mono">
                      <Icon className="size-3 mr-1" />
                      {meta.label}
                    </Badge>
                    <span className="text-[12px] font-semibold">{rec.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {rec.detail}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </TextureCard>
  );
}
