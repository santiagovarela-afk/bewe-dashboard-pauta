"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hash, Search, Sparkles, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface HashtagBundle {
  high: string[];
  mid: string[];
  niche: string[];
}

interface HashtagFinderProps {
  /** Tema inicial sugerido (ej. desde caption). */
  initialTopic?: string;
  /** Callback cuando el usuario inserta hashtags al composer. */
  onInsert?: (hashtags: string) => void;
}

/**
 * Hashtag Finder · clasifica hashtags en HIGH / MID / NICHE usando Gemini.
 *
 * Prompt diseñado para devolver JSON estricto. Si falla parse, mostramos
 * mensaje claro sin romper la UI.
 */
export function HashtagFinder({ initialTopic = "", onInsert }: HashtagFinderProps) {
  const [topic, setTopic] = React.useState(initialTopic);
  const [bundle, setBundle] = React.useState<HashtagBundle | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  async function search() {
    if (!topic.trim()) {
      toast.error("Escribe un tema primero");
      return;
    }
    setLoading(true);
    setError(null);
    setBundle(null);

    const prompt = `Eres experto en marketing de Instagram para negocios LATAM. Para el tema "${topic.trim()}", devuelve EXCLUSIVAMENTE un JSON válido con esta estructura:

{
  "high": ["#hashtag1", "#hashtag2", ...10 items],
  "mid": ["#hashtag1", ...10 items],
  "niche": ["#hashtag1", ...10 items]
}

Reglas:
- HIGH volume: >1M posts (genéricos amplios)
- MID volume: 100k-1M (más específicos)
- NICHE: <100k posts, alta intención (long-tail)
- Todos en español o spanglish que use la audiencia LATAM
- Cada hashtag empieza con # · sin espacios · camelCase ok
- 10 exactos por categoría
- SOLO el JSON, sin markdown, sin explicación.`;

    try {
      const r = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          system:
            "Devuelves JSON puro sin markdown ni backticks. Eres preciso y conciso.",
          maxTokens: 1500,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.quotaExhausted) {
          throw new Error(
            "Cuota de Gemini agotada · activa billing o espera el reset (~24h).",
          );
        }
        throw new Error(data.error || `Error ${r.status}`);
      }
      const raw = (data.text || "").trim();
      // Limpiar posibles ``` markdown wrappers
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      let parsed: HashtagBundle;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("Respuesta no es JSON válido · reintenta.");
      }
      if (!parsed.high || !parsed.mid || !parsed.niche) {
        throw new Error("JSON incompleto · faltan categorías.");
      }
      setBundle(parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      toast.error("No pude generar hashtags", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  async function copyOne(tag: string) {
    try {
      await navigator.clipboard.writeText(tag);
      setCopied(tag);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      toast.error("No pude copiar");
    }
  }

  async function copyAll(category: keyof HashtagBundle) {
    if (!bundle) return;
    const text = bundle[category].join(" ");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${category.toUpperCase()} copiado`, {
        description: `${bundle[category].length} hashtags al portapapeles`,
      });
    } catch {
      toast.error("No pude copiar");
    }
  }

  function insertAll() {
    if (!bundle) return;
    const text = [...bundle.high.slice(0, 3), ...bundle.mid.slice(0, 4), ...bundle.niche.slice(0, 3)].join(
      " ",
    );
    onInsert?.(text);
    toast.success("10 hashtags insertados al caption");
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block text-[11px] font-semibold">
          Tema o nicho
        </Label>
        <div className="flex gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej. salones de belleza Latam"
            onKeyDown={(e) => {
              if (e.key === "Enter") search();
            }}
            disabled={loading}
          />
          <Button
            onClick={search}
            size="sm"
            variant="glow"
            disabled={loading || !topic.trim()}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            {loading ? "Buscando…" : "Buscar"}
          </Button>
        </div>
        <div className="mt-1.5 text-[10px] text-muted-foreground leading-snug">
          Mark/Lúa clasifican en HIGH (&gt;1M), MID (100k-1M) y NICHE (&lt;100k).
          Mix recomendado para 2026: 3 high + 4 mid + 3 niche.
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)] p-2.5 text-[11px] text-[hsl(var(--destructive))] inline-flex items-start gap-2">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence>
        {bundle && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {(["high", "mid", "niche"] as const).map((cat) => (
              <HashtagColumn
                key={cat}
                category={cat}
                tags={bundle[cat]}
                copied={copied}
                onCopyOne={copyOne}
                onCopyAll={() => copyAll(cat)}
              />
            ))}

            {onInsert && (
              <Button
                onClick={insertAll}
                size="sm"
                variant="glow"
                className="w-full"
              >
                <Sparkles className="size-3.5" />
                Insertar mix 3+4+3 al caption
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!bundle && !loading && !error && (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-5 text-center">
          <Hash className="size-7 mx-auto mb-2 text-muted-foreground/50" />
          <div className="text-[11px] text-muted-foreground">
            Escribe tu tema y pulsa <strong>Buscar</strong> para ver hashtags
            clasificados.
          </div>
        </div>
      )}
    </div>
  );
}

function HashtagColumn({
  category,
  tags,
  copied,
  onCopyOne,
  onCopyAll,
}: {
  category: "high" | "mid" | "niche";
  tags: string[];
  copied: string | null;
  onCopyOne: (t: string) => void;
  onCopyAll: () => void;
}) {
  const meta = {
    high: {
      label: "HIGH",
      desc: ">1M posts",
      color: "violet",
    },
    mid: {
      label: "MID",
      desc: "100k–1M",
      color: "cyan",
    },
    niche: {
      label: "NICHE",
      desc: "<100k · alta intención",
      color: "lime",
    },
  }[category];

  const colorVar = `hsl(var(--brand-${meta.color}))`;

  return (
    <div
      className="rounded-lg border bg-card/60 p-2.5"
      style={{ borderColor: `${colorVar.replace(")", "/0.4)")}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: colorVar }}
          >
            {meta.label}
          </span>
          <span className="text-[9px] text-muted-foreground ml-2">
            {meta.desc} · {tags.length} tags
          </span>
        </div>
        <button
          onClick={onCopyAll}
          className="text-[9px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          aria-label={`Copiar todos ${meta.label}`}
        >
          <Copy className="size-2.5" /> Copiar todos
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => onCopyOne(t)}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full border bg-background/40 transition-colors hover:bg-secondary/60 font-mono inline-flex items-center gap-1",
            )}
            style={{ borderColor: `${colorVar.replace(")", "/0.3)")}`, color: colorVar }}
          >
            {copied === t ? <Check className="size-2.5" /> : null}
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
