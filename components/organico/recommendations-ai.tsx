"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { TextureCard } from "@/components/fx/texture-card";
import { Button } from "@/components/ui/button";
import { topBottom, performanceByFormat, type AnalyticsPost } from "@/lib/organic-analytics";

interface RecommendationsAIProps {
  posts: AnalyticsPost[];
  /** Etiqueta de plataforma para el prompt (IG/FB) */
  platformLabel: string;
}

/**
 * Pide a Mark/Lúa 3-5 recomendaciones concretas basadas en top/bottom + métricas de formato.
 * Render bullets · maneja error de cuota Gemini limpiamente.
 */
export function RecommendationsAI({ posts, platformLabel }: RecommendationsAIProps) {
  const [recs, setRecs] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    if (!posts.length) return;
    setLoading(true);
    setError(null);
    setRecs(null);

    // Construir payload compacto para no quemar tokens
    const { top, bottom, avgEngagement } = topBottom(posts, 3);
    const formats = performanceByFormat(posts);

    const summary = {
      platform: platformLabel,
      totalPosts: posts.length,
      avgEngagement: Number(avgEngagement.toFixed(1)),
      topPosts: top.map((p) => ({
        text: p.text?.slice(0, 160) ?? null,
        type: p.type ?? "unknown",
        likes: p.likes,
        comments: p.comments,
      })),
      bottomPosts: bottom.map((p) => ({
        text: p.text?.slice(0, 160) ?? null,
        type: p.type ?? "unknown",
        likes: p.likes,
        comments: p.comments,
      })),
      formatStats: formats.map((f) => ({
        format: f.label,
        count: f.count,
        avgEngagement: Number(f.avgEngagement.toFixed(1)),
      })),
    };

    const prompt = `Eres analista de contenido orgánico para PyMEs LATAM (Bewe · software gestión negocios de servicios).
Acá están las métricas reales del período:

${JSON.stringify(summary, null, 2)}

Da EXACTAMENTE 5 recomendaciones específicas y accionables para mejorar el contenido orgánico de esta cuenta.

Reglas:
- Tono profesional cálido · español neutro LATAM
- Cada recomendación = 1-2 líneas · concreta · accionable HOY
- Apóyate en los datos reales (cita números cuando aplique)
- Foco PyME servicios profesionales (belleza · salud · fitness · freelance)
- Devuelve EXCLUSIVAMENTE un JSON array de strings · sin markdown · sin backticks · sin texto extra
- Formato: ["Recomendación 1.", "Recomendación 2.", ...5 items]
- SOLO el JSON. NADA MÁS.`;

    try {
      const r = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          system:
            "Devuelves JSON array de strings · sin markdown · sin explicaciones. Analista de contenido PyME LATAM.",
          maxTokens: 1500,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.quotaExhausted) {
          throw new Error("Cuota de Gemini agotada · activa billing o espera el reset (~24h).");
        }
        throw new Error(data.error || `Error ${r.status}`);
      }
      const raw = String(data.text || "").trim();
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("Respuesta no es JSON válido · reintenta.");
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Respuesta sin recomendaciones.");
      }
      const clean = parsed
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .slice(0, 5)
        .map((s) => s.slice(0, 400));
      if (!clean.length) throw new Error("Recomendaciones mal formadas.");
      setRecs(clean);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TextureCard className="p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="size-3.5 text-[hsl(var(--brand-violet))]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Recomendaciones de Mark / Lúa
        </h3>
        <Button
          onClick={() => void run()}
          size="sm"
          variant="glow"
          disabled={loading || !posts.length}
          className="ml-auto !h-7 !text-[10px]"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : recs ? (
            <RefreshCw className="size-3" />
          ) : (
            <Sparkles className="size-3" />
          )}
          {loading ? "Pensando…" : recs ? "Regenerar" : "Pedir análisis"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)] p-2.5 text-[11px] text-[hsl(var(--destructive))] inline-flex items-start gap-2">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {recs ? (
          <motion.ul
            key="recs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {recs.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                className="rounded-md border border-border/50 bg-card/60 p-2.5 text-[11px] leading-relaxed flex gap-2"
              >
                <span className="text-[hsl(var(--brand-violet))] font-bold shrink-0">
                  {i + 1}.
                </span>
                <span className="text-foreground/90">{r}</span>
              </motion.li>
            ))}
          </motion.ul>
        ) : !loading && !error ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-dashed border-border bg-card/40 p-4 text-center"
          >
            <Sparkles className="size-6 mx-auto mb-1.5 text-muted-foreground/50" />
            <div className="text-[11px] text-muted-foreground leading-snug">
              Mark/Lúa analizan tus posts top/bottom y formato para sugerir cómo mejorar tu contenido orgánico
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </TextureCard>
  );
}
