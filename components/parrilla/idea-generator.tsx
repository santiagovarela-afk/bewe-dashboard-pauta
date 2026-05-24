"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Lightbulb,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface PostIdea {
  hook: string;
  copy: string;
  cta: string;
}

interface IdeaGeneratorProps {
  /** Plataforma destino sugerida. */
  platform?: "ig" | "fb" | "reel" | "story";
  /** Callback cuando el usuario aplica una idea al composer. */
  onUse?: (idea: PostIdea) => void;
}

type Goal = "engagement" | "leads" | "awareness" | "brand";

const GOALS: Array<{ value: Goal; label: string; desc: string }> = [
  { value: "engagement", label: "Engagement", desc: "Likes, comments, saves" },
  { value: "leads", label: "Leads", desc: "DMs, clicks, conversiones" },
  { value: "awareness", label: "Awareness", desc: "Alcance + impresiones" },
  { value: "brand", label: "Brand", desc: "Posicionamiento, autoridad" },
];

/**
 * Idea Generator · genera 5 ideas de post con Gemini/Mark-Lúa.
 * Cada idea = hook (1 línea) + copy (3-5 líneas) + CTA.
 */
export function IdeaGenerator({ platform = "ig", onUse }: IdeaGeneratorProps) {
  const [topic, setTopic] = React.useState("");
  const [goal, setGoal] = React.useState<Goal>("engagement");
  const [plat, setPlat] = React.useState(platform);
  const [ideas, setIdeas] = React.useState<PostIdea[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    setPlat(platform);
  }, [platform]);

  async function generate() {
    if (!topic.trim()) {
      toast.error("Escribe un tema");
      return;
    }
    setLoading(true);
    setError(null);
    setIdeas(null);

    const platformLabel: Record<typeof plat, string> = {
      ig: "Instagram (feed)",
      fb: "Facebook (feed)",
      reel: "Instagram Reels (video corto vertical)",
      story: "Instagram Story (efímero 24h, 9:16)",
    };

    const prompt = `Eres copywriter de Bewe (software gestión negocios servicios profesionales — belleza, salud, fitness, freelance LATAM).
Genera EXACTAMENTE 5 ideas de post para ${platformLabel[plat]} sobre el tema "${topic.trim()}" optimizadas para el objetivo "${goal}".

Devuelve EXCLUSIVAMENTE un JSON array (sin markdown, sin backticks, sin texto extra) con esta estructura:

[
  { "hook": "1 línea (máx 12 palabras, gancho viral)", "copy": "3-5 líneas separadas por \\n", "cta": "1 línea con acción concreta" },
  ...5 items
]

Reglas:
- Tono: profesional cálido · español neutro LATAM
- Sin tecnicismos · sin emojis excesivos (máx 2 por hook)
- Hook con verbo de acción o cifra concreta
- Copy con beneficio claro · sin claim vacío
- CTA con verbo + canal (ej "Reserva en bewe.io", "Escríbenos por DM")
- SOLO el JSON. NADA MÁS.`;

    try {
      const r = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          system:
            "Devuelves JSON array puro sin markdown ni explicaciones. Tono Bewe (cálido + profesional).",
          maxTokens: 2000,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.quotaExhausted) {
          throw new Error(
            "Cuota de Gemini agotada · activa billing o espera el reset.",
          );
        }
        throw new Error(data.error || `Error ${r.status}`);
      }
      const raw = (data.text || "").trim();
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      let parsed: PostIdea[];
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("Respuesta no es JSON · reintenta.");
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("La IA no devolvió ideas válidas.");
      }
      // Sanitizar cada idea
      const clean = parsed
        .filter((i) => i && typeof i.hook === "string" && typeof i.copy === "string")
        .slice(0, 5)
        .map((i) => ({
          hook: String(i.hook).slice(0, 200),
          copy: String(i.copy).slice(0, 800),
          cta: String(i.cta || "").slice(0, 200),
        }));
      if (clean.length === 0) {
        throw new Error("Ideas mal formadas · reintenta.");
      }
      setIdeas(clean);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      // Fallback offline · si Gemini falla por cuota o cualquier razón,
      // genera ideas a partir de templates.ts (no rompe el flujo del usuario)
      try {
        const { PARRILLA_TEMPLATES } = await import("./templates");
        const platformKey = platform === "ig" ? "ig" : "fb";
        const fallback: PostIdea[] = PARRILLA_TEMPLATES
          .filter((t) => t.platforms.includes(platformKey))
          .slice(0, 5)
          .map((t) => ({
            hook: t.label,
            copy: t.caption.split("\n").slice(0, 5).join("\n"),
            cta: t.tip || "Reserva ahora en bewe.io",
          }));
        if (fallback.length > 0) {
          setIdeas(fallback);
          setError(
            "⚠ Gemini no disponible · mostrando plantillas locales como respaldo. " + msg,
          );
          toast.info("Plantillas locales", {
            description: "Sin AI: te dejo 5 ideas de la biblioteca Bewe",
          });
          return;
        }
      } catch {
        /* fallback failed · usa el error original */
      }
      setError(msg);
      toast.error("No pude generar ideas", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  function use(idea: PostIdea) {
    onUse?.(idea);
    toast.success("Idea aplicada al composer", {
      description: idea.hook.slice(0, 60) + "…",
    });
  }

  async function copy(idea: PostIdea, idx: number) {
    const text = `${idea.hook}\n\n${idea.copy}\n\n${idea.cta}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1400);
    } catch {
      toast.error("No pude copiar");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block text-[11px] font-semibold">
          Tema base
        </Label>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ej. cómo digitalizar agenda de un salón"
          onKeyDown={(e) => {
            if (e.key === "Enter") generate();
          }}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
            Plataforma
          </Label>
          <select
            value={plat}
            onChange={(e) => setPlat(e.target.value as typeof plat)}
            className="w-full h-9 rounded-md border border-input bg-background/40 px-3 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={loading}
          >
            <option value="ig">Instagram feed</option>
            <option value="reel">Reel</option>
            <option value="story">Story</option>
            <option value="fb">Facebook</option>
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
            Objetivo
          </Label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            className="w-full h-9 rounded-md border border-input bg-background/40 px-3 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={loading}
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label} · {g.desc}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        onClick={generate}
        size="sm"
        variant="glow"
        disabled={loading || !topic.trim()}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Wand2 className="size-3.5" />
        )}
        {loading ? "Generando con Mark/Lúa…" : "Generar 5 ideas con Mark/Lúa"}
      </Button>

      {error && (
        <div className="rounded-md border border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)] p-2.5 text-[11px] text-[hsl(var(--destructive))] inline-flex items-start gap-2">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence>
        {ideas && (
          <div className="space-y-2.5">
            {ideas.map((idea, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="rounded-lg border border-border/60 bg-card/60 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <Badge variant="violet" className="!text-[8px] shrink-0">
                    #{i + 1}
                  </Badge>
                  <div className="text-[12px] font-semibold leading-snug">
                    {idea.hook}
                  </div>
                </div>
                <div className="text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {idea.copy}
                </div>
                <div className="text-[11px] font-semibold text-[hsl(var(--brand-cyan))]">
                  → {idea.cta}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => use(idea)}
                    size="sm"
                    variant="glow"
                    className="flex-1 !h-7 !text-[10px]"
                  >
                    <Sparkles className="size-3" />
                    Usar esta
                  </Button>
                  <Button
                    onClick={() => copy(idea, i)}
                    size="sm"
                    variant="outline"
                    className="!h-7 !text-[10px]"
                  >
                    {copiedIdx === i ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copiedIdx === i ? "OK" : "Copiar"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {!ideas && !loading && !error && (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-5 text-center">
          <Lightbulb className="size-7 mx-auto mb-2 text-muted-foreground/50" />
          <div className="text-[11px] text-muted-foreground leading-snug">
            Mark/Lúa generan ideas hechas a la medida del perfil Bewe.
            <br />
            Tono cálido + profesional · CTA medible.
          </div>
        </div>
      )}

      <div
        className={cn(
          "text-[9px] text-muted-foreground/70 leading-snug",
          !ideas && "hidden",
        )}
      >
        Tip: usá la idea como punto de partida · personaliza con datos de tu
        cuenta (nombres, fechas, ofertas reales).
      </div>
    </div>
  );
}
