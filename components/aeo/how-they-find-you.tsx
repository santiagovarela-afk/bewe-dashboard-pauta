"use client";
/**
 * components/aeo/how-they-find-you.tsx
 *
 * Sección que destaca los "hits" · prompts donde Bewe SÍ apareció.
 * Card por hit · gradient ember para destaque visual.
 *
 * Extrae el snippet de la respuesta que contiene "Bewe" (oración alrededor).
 */
import * as React from "react";
import { motion } from "motion/react";
import {
  Flame,
  Trophy,
  MessageSquareQuote,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { AeoRun } from "@/lib/aeo";
import { TextureCard } from "@/components/fx/texture-card";
import { Badge } from "@/components/ui/badge";

/** Devuelve un snippet centrado en la primera mención a "bewe". */
function extractBeweSnippet(response: string, contextChars: number = 140): {
  before: string;
  match: string;
  after: string;
} | null {
  const re = /\bbewe\b/i;
  const m = re.exec(response);
  if (!m) return null;
  const idx = m.index;
  const matched = m[0];
  const start = Math.max(0, idx - contextChars);
  const end = Math.min(response.length, idx + matched.length + contextChars);
  const before = (start > 0 ? "…" : "") + response.slice(start, idx);
  const after = response.slice(idx + matched.length, end) + (end < response.length ? "…" : "");
  return { before, match: matched, after };
}

export function AeoHowTheyFindYou({ run }: { run: AeoRun | null }) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const hits = React.useMemo(
    () => (run ? run.results.filter((r) => r.mentionsBewe) : []),
    [run],
  );

  return (
    <TextureCard className="p-0 overflow-hidden border-[hsl(var(--brand-ember)/0.25)]">
      <div
        className="relative px-5 py-4 border-b border-border"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--brand-ember) / 0.18) 0%, hsl(var(--brand-violet) / 0.10) 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-[hsl(var(--brand-ember))]" />
          <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Cómo te buscan · Bewe en respuestas
          </h3>
          <Badge variant="ember" className="font-mono ml-1">
            {hits.length} {hits.length === 1 ? "hit" : "hits"}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Los prompts donde Bewe SÍ apareció · contexto exacto en el que el LLM la
          recomendó.
        </p>
      </div>

      <div className="p-4">
        {!run && (
          <p className="text-[11px] text-muted-foreground">
            Sin run cargado.
          </p>
        )}

        {run && hits.length === 0 && (
          <div className="flex items-start gap-3 px-3 py-3 rounded-lg bg-secondary/30 border border-border/60">
            <Trophy className="size-4 text-[hsl(var(--brand-ember))] mt-0.5 shrink-0" />
            <div>
              <div className="text-[12px] font-semibold mb-0.5">
                Bewe aún no aparece
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                En el último run ninguno de los {run.results.length} prompts mencionó
                a Bewe. Seguí los próximos pasos en <strong className="text-foreground/85">Recomendaciones</strong>
                {" "}para mover este número.
              </p>
            </div>
          </div>
        )}

        {hits.length > 0 && (
          <ul className="space-y-2.5">
            {hits.map((r, i) => {
              const open = !!expanded[r.promptId];
              const snippet = extractBeweSnippet(r.response);
              return (
                <motion.li
                  key={r.promptId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-lg border border-[hsl(var(--brand-ember)/0.25)] bg-[hsl(var(--brand-ember)/0.04)] overflow-hidden"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="ember" className="font-mono">
                        {r.bewePosition ? `#${r.bewePosition} en lista` : "mencionado"}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[9px]">
                        {r.promptId}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[9px]">
                        {r.category}
                      </Badge>
                    </div>
                    <div className="text-[12px] font-medium mb-2 leading-snug">
                      <MessageSquareQuote className="size-3.5 inline-block mr-1 -mt-0.5 text-muted-foreground" />
                      {r.promptText}
                    </div>

                    {snippet && (
                      <div className="text-[11px] leading-relaxed text-muted-foreground bg-background/50 rounded-md px-3 py-2 border border-border/60">
                        {snippet.before}
                        <mark
                          className="px-1 py-0.5 rounded font-bold"
                          style={{
                            background: "hsl(var(--brand-ember) / 0.25)",
                            color: "hsl(var(--brand-ember))",
                          }}
                        >
                          {snippet.match}
                        </mark>
                        {snippet.after}
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setExpanded((e) => ({ ...e, [r.promptId]: !e[r.promptId] }))
                      }
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-[hsl(var(--brand-ember))] hover:underline"
                    >
                      {open ? (
                        <>
                          <ChevronDown className="size-3" /> ocultar respuesta completa
                        </>
                      ) : (
                        <>
                          <ChevronRight className="size-3" /> ver respuesta completa
                        </>
                      )}
                    </button>

                    {open && (
                      <motion.pre
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80 bg-background/70 rounded-lg border border-border/60 p-3 mt-2 max-h-[280px] overflow-y-auto"
                      >
                        {r.response}
                      </motion.pre>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </TextureCard>
  );
}
