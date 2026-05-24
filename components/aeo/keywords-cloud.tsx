"use client";
/**
 * components/aeo/keywords-cloud.tsx
 *
 * Cloud de keywords frecuentes en las respuestas LLM del último run.
 * Tamaño proporcional a frecuencia · color por categoría heurística
 * (tech, vertical, geo, neutral).
 *
 * Click en keyword → filtra y muestra debajo qué respuestas la mencionan.
 */
import * as React from "react";
import { motion } from "motion/react";
import { Hash, X, FileText } from "lucide-react";
import type { AeoRun } from "@/lib/aeo";
import {
  extractKeywords,
  type KeywordEntry,
  type KeywordCategory,
} from "@/lib/aeo-keywords";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";

const CAT_COLOR: Record<KeywordCategory, string> = {
  tech: "var(--brand-cyan)",
  vertical: "var(--brand-lime)",
  geo: "var(--brand-ember)",
  neutral: "var(--muted-foreground)",
};

const CAT_LABEL: Record<KeywordCategory, string> = {
  tech: "Tecnología",
  vertical: "Vertical",
  geo: "Geo",
  neutral: "Neutral",
};

export function AeoKeywordsCloud({ run }: { run: AeoRun | null }) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const keywords: KeywordEntry[] = React.useMemo(() => {
    if (!run) return [];
    return extractKeywords(run.results, 30);
  }, [run]);

  const max = keywords[0]?.count ?? 1;
  const min = keywords[keywords.length - 1]?.count ?? 1;

  const matchingResponses = React.useMemo(() => {
    if (!run || !selected) return [];
    const re = new RegExp(`\\b${selected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return run.results.filter((r) => re.test(r.response));
  }, [run, selected]);

  const counts = React.useMemo(() => {
    const c = { tech: 0, vertical: 0, geo: 0, neutral: 0 } as Record<KeywordCategory, number>;
    for (const k of keywords) c[k.category]++;
    return c;
  }, [keywords]);

  function fontSize(count: number): string {
    if (max === min) return "14px";
    const t = (count - min) / (max - min);
    const px = 11 + t * 14;
    return `${px.toFixed(1)}px`;
  }

  return (
    <TextureCard className="p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Hash className="size-4 text-[hsl(var(--brand-lime))]" />
        <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Keywords y temas frecuentes
        </h3>
        {keywords.length > 0 && (
          <div className="flex items-center gap-1 ml-auto flex-wrap">
            {(["tech", "vertical", "geo", "neutral"] as KeywordCategory[]).map((c) =>
              counts[c] > 0 ? (
                <div
                  key={c}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: `hsl(${CAT_COLOR[c]})` }}
                    aria-hidden
                  />
                  {CAT_LABEL[c]} · {counts[c]}
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>

      {!run && (
        <p className="text-[11px] text-muted-foreground">Sin run cargado.</p>
      )}

      {run && keywords.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          No se pudieron extraer keywords · revisá que el run tenga respuestas válidas.
        </p>
      )}

      {keywords.length > 0 && (
        <>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-4 max-w-[680px]">
            Los términos que más repiten los LLMs cuando responden sobre tu rubro ·
            tamaño = frecuencia · color = categoría. Inspirá tu contenido orgánico
            con estos términos · son las palabras que los LLMs ya asocian al rubro.
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3">
            {keywords.map((k, i) => {
              const isSelected = selected === k.word;
              return (
                <motion.button
                  key={k.word}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => setSelected(isSelected ? null : k.word)}
                  className={`inline-flex items-baseline gap-1 px-2 py-1 rounded-md transition-all hover:bg-secondary/50 ${
                    isSelected ? "bg-secondary/70 ring-1 ring-foreground/20" : ""
                  }`}
                  style={{
                    color: `hsl(${CAT_COLOR[k.category]})`,
                    fontSize: fontSize(k.count),
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                  title={`${CAT_LABEL[k.category]} · ${k.count} menciones`}
                >
                  {k.word}
                  <span
                    className="font-mono opacity-70"
                    style={{ fontSize: "9px" }}
                  >
                    {k.count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 pt-3 border-t border-border/60"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium">
                  Respuestas que mencionan{" "}
                  <span className="font-mono text-[hsl(var(--brand-lime))]">
                    {selected}
                  </span>
                </span>
                <Badge variant="outline" className="font-mono">
                  {matchingResponses.length}
                </Badge>
                <button
                  onClick={() => setSelected(null)}
                  className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                  limpiar
                </button>
              </div>
              {matchingResponses.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  Sin respuestas que la mencionen (puede pasar si filtra exact-match).
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-[280px] overflow-y-auto">
                  {matchingResponses.map((r) => (
                    <li
                      key={r.promptId}
                      className="text-[11px] px-3 py-2 rounded-md bg-secondary/30 border border-border/60"
                    >
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <Badge variant="outline" className="font-mono text-[9px]">
                          {r.promptId}
                        </Badge>
                        <Badge
                          variant={r.mentionsBewe ? "success" : "outline"}
                          className="font-mono text-[9px]"
                        >
                          {r.mentionsBewe ? "Bewe ✓" : "sin Bewe"}
                        </Badge>
                      </div>
                      <div className="text-foreground/85">{r.promptText}</div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </>
      )}
    </TextureCard>
  );
}
