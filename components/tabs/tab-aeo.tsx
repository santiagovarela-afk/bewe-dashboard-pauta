"use client";
/**
 * Tab AEO · Answer Engine Optimization
 *
 * Tab dedicada (antes vivía dentro de SEO). Mide cómo aparece Bewe cuando
 * un cliente potencial pregunta a ChatGPT/Claude/Gemini por software de
 * gestión para su negocio.
 *
 * Flujo al entrar:
 *   1. POST /api/aeo/seed-prompts  → garantiza que existan ≥20 prompts.
 *      Si .data/aeo-prompts.json ya existe los devuelve.
 *      Si no, los autogenera con Gemini (fallback hardcoded si Gemini falla).
 *   2. GET /api/aeo/results        → último run + stats.
 *
 * NO depende de María Paula · es 100% automático con Gemini que ya está
 * conectado vía GEMINI_API_KEY.
 */
import * as React from "react";
import { motion } from "motion/react";
import {
  Brain,
  Sparkles,
  Loader2,
  RefreshCw,
  Bot,
  Building2,
  TrendingUp,
  ChartLine,
  FileText,
  ChevronDown,
  ChevronRight,
  MessageSquareCode,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadPromptsClient,
  type AeoPrompt,
  type AeoRun,
  type AeoStats,
} from "@/lib/aeo";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/section-header";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextureCard } from "@/components/fx/texture-card";
import { Reveal } from "@/components/fx/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ResultsPayload {
  hasData: boolean;
  latest: AeoRun | null;
  stats: AeoStats | null;
  history: Array<{
    runAt: string;
    visibilityPct: number;
    avgPosition: number | null;
    totalPrompts: number;
  }>;
}

const CATEGORY_LABEL: Record<AeoPrompt["category"], string> = {
  belleza: "Belleza",
  comercio: "Comercio",
  servicios: "Servicios",
  "bewe-generic": "Marca · Bewe",
  adyacente: "Industrias adyacentes",
};

const CATEGORY_ACCENT: Record<AeoPrompt["category"], string> = {
  belleza: "var(--brand-violet)",
  comercio: "var(--brand-cyan)",
  servicios: "var(--brand-lime)",
  "bewe-generic": "var(--brand-ember)",
  adyacente: "var(--warning)",
};

export function TabAeo() {
  const [prompts, setPrompts] = React.useState<AeoPrompt[]>([]);
  const [promptsSource, setPromptsSource] = React.useState<
    "existing" | "generated" | "fallback" | "defaults" | null
  >(null);
  const [seeding, setSeeding] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<ResultsPayload | null>(null);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [runProgress, setRunProgress] = React.useState<number>(0);
  const [quotaBlocked, setQuotaBlocked] = React.useState<string | null>(null);
  const didAutoRun = React.useRef(false);

  // Auto-seed al entrar a la tab
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setSeeding(true);
      try {
        const { prompts: list, source } = await loadPromptsClient();
        if (cancelled) return;
        setPrompts(list);
        setPromptsSource(source);
      } finally {
        if (!cancelled) setSeeding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadResults = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/aeo/results", { cache: "no-store" });
      const j = (await r.json()) as ResultsPayload;
      setResults(j);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadResults();
  }, [loadResults]);

  const runAnalysis = React.useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (running) return;
      setRunning(true);
      setRunProgress(0);
      setQuotaBlocked(null);
      if (!opts.silent) toast.info("Corriendo análisis AEO · puede tardar 1–2 min");
      // Progress simulado mientras Gemini procesa (no hay SSE en el endpoint)
      const total = prompts.length || 30;
      const tick = window.setInterval(() => {
        setRunProgress((p) => (p < total - 1 ? p + 1 : p));
      }, 2200);
      try {
        const r = await fetch("/api/aeo/run", { method: "POST" });
        const j = await r.json();
        window.clearInterval(tick);
        if (j.error) {
          const isQuota = /quota|rate.?limit|exceeded|429/i.test(String(j.error));
          if (isQuota) {
            setQuotaBlocked(
              "Cuota Gemini agotada · datos pendientes · reintentar mañana (reset ~24h)",
            );
            if (!opts.silent) toast.error("Cuota Gemini agotada · UI en modo preview");
          } else if (!opts.silent) {
            toast.error(j.error);
          }
        } else {
          if (!opts.silent)
            toast.success(`Análisis completado · ${j.run?.results?.length ?? 0} prompts`);
          await loadResults();
        }
      } catch (err) {
        window.clearInterval(tick);
        if (!opts.silent)
          toast.error(err instanceof Error ? err.message : "error desconocido");
      } finally {
        window.clearInterval(tick);
        setRunning(false);
        setRunProgress(0);
      }
    },
    [running, prompts.length, loadResults],
  );

  // Auto-run UNA vez si no hay results previos y los prompts ya cargaron
  React.useEffect(() => {
    if (didAutoRun.current) return;
    if (seeding) return;
    if (prompts.length === 0) return;
    if (loading) return;
    if (results === null) return; // esperar primera carga de results
    if (results.hasData) {
      didAutoRun.current = true;
      return;
    }
    didAutoRun.current = true;
    void runAnalysis({ silent: true });
  }, [seeding, prompts.length, loading, results, runAnalysis]);

  async function regeneratePrompts() {
    setSeeding(true);
    try {
      const r = await fetch("/api/aeo/seed-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const j = (await r.json()) as {
        prompts: AeoPrompt[];
        count: number;
        source: "generated" | "fallback";
      };
      setPrompts(j.prompts);
      setPromptsSource(j.source);
      toast.success(
        `${j.count} prompts ${j.source === "generated" ? "generados con Gemini" : "cargados (fallback)"}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "error desconocido");
    } finally {
      setSeeding(false);
    }
  }

  // Group prompts by category
  const grouped = React.useMemo(() => {
    const m = new Map<AeoPrompt["category"], AeoPrompt[]>();
    for (const p of prompts) {
      const arr = m.get(p.category) ?? [];
      arr.push(p);
      m.set(p.category, arr);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [prompts]);

  const stats = results?.stats ?? null;
  const lastRun = results?.latest?.runAt
    ? new Date(results.latest.runAt).toLocaleString("es", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const promptsRun = results?.latest?.results.length ?? 0;
  const promptsTotal = prompts.length;

  return (
    <div className="space-y-7 max-w-[1500px]">
      {/* ─────── HERO ─────── */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />
          <div className="absolute -top-24 -right-16 w-[420px] h-[420px] bg-[hsl(var(--brand-violet)/0.16)] rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-[380px] h-[380px] bg-[hsl(var(--brand-ember)/0.12)] rounded-full blur-3xl" />

          <div className="relative px-6 md:px-10 py-7 md:py-9">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <Brain className="size-3" />
                AEO · Answer Engine Optimization
              </div>
              <Badge variant="violet" className="font-mono">
                vía Gemini · gratuito
              </Badge>
              {promptsSource && (
                <Badge variant="outline" className="font-mono text-[9px]">
                  prompts: {promptsSource}
                </Badge>
              )}
            </div>
            <div className="grid md:grid-cols-[1.6fr_1fr] gap-6 items-center">
              <div>
                <h1 className="font-display font-bold tracking-[-0.025em] text-3xl md:text-4xl leading-[1.05] mb-3">
                  ¿Cómo aparece Bewe cuando alguien le pregunta a un{" "}
                  <span className="text-aurora">LLM?</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-[640px] leading-relaxed">
                  AEO mide la visibilidad de Bewe en ChatGPT, Claude y Gemini.
                  Corremos {promptsTotal || 30} prompts categorizados (belleza, comercio,
                  servicios, marca, adyacentes), detectamos menciones, posición en listas,
                  competidores mencionados e industrias que el LLM ya asocia al rubro.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <HeroStat
                  label="Visibility"
                  value={stats ? `${stats.visibilityPct}%` : "—"}
                  sub={stats ? `Bewe en ${Math.round((stats.visibilityPct / 100) * stats.totalPrompts)}/${stats.totalPrompts}` : "sin runs"}
                  accent="var(--brand-violet)"
                />
                <HeroStat
                  label="Pos. media"
                  value={stats?.avgPosition !== null && stats?.avgPosition !== undefined ? stats.avgPosition.toFixed(1) : "—"}
                  sub="en listas numeradas"
                  accent="var(--brand-cyan)"
                />
                <HeroStat
                  label="Prompts run"
                  value={
                    running
                      ? `${runProgress}/${promptsTotal || 30}`
                      : `${promptsRun}/${promptsTotal || 30}`
                  }
                  sub={
                    running
                      ? "Evaluando con Gemini…"
                      : lastRun
                        ? `último: ${lastRun}`
                        : seeding
                          ? "Cargando…"
                          : "Auto-run al entrar"
                  }
                  accent="var(--brand-lime)"
                />
                <HeroStat
                  label="Competidores"
                  value={String(stats?.topCompetitors.length ?? 0)}
                  sub={stats?.topCompetitors[0] ? `top: ${stats.topCompetitors[0].name}` : "—"}
                  accent="var(--brand-ember)"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={() => void runAnalysis()} size="sm" variant="glow" disabled={running || prompts.length === 0}>
                {running ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {running
                  ? `Corriendo… ${runProgress}/${promptsTotal || 30}`
                  : `Correr análisis · ${promptsTotal || 30} prompts × Gemini`}
              </Button>
              <Button onClick={loadResults} size="sm" variant="outline" disabled={loading}>
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
                Refrescar
              </Button>
              <Button onClick={regeneratePrompts} size="sm" variant="outline" disabled={seeding}>
                <RotateCcw className={cn("size-3.5", seeding && "animate-spin")} />
                Regenerar prompts
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─────── PROGRESS BAR (durante run) ─────── */}
      {running && (
        <TextureCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="size-4 animate-spin text-[hsl(var(--brand-violet))]" />
            <div className="text-[12px] font-semibold">
              Evaluando {runProgress}/{promptsTotal || 30} prompts con Gemini…
            </div>
          </div>
          <div className="h-1.5 w-full bg-secondary/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "hsl(var(--brand-violet))" }}
              animate={{
                width: `${Math.min(100, (runProgress / Math.max(1, promptsTotal || 30)) * 100)}%`,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">
            Tarda 1–2 min · puedes seguir navegando otras tabs.
          </div>
        </TextureCard>
      )}

      {/* ─────── QUOTA BLOCKED BANNER ─────── */}
      {quotaBlocked && !running && (
        <TextureCard className="p-4 border-[hsl(var(--brand-ember)/0.35)]">
          <div className="flex items-start gap-3">
            <div
              className="size-9 grid place-items-center rounded-xl shrink-0"
              style={{
                background: `hsl(var(--brand-ember) / 0.16)`,
                border: `1px solid hsl(var(--brand-ember) / 0.4)`,
                color: `hsl(var(--brand-ember))`,
              }}
            >
              <Bot className="size-4" />
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-semibold mb-0.5">
                Datos pendientes · quota agotada
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {quotaBlocked}. La UI muestra el formato esperado; los números reales
                aparecerán cuando se resetee la cuota gratuita de Gemini.
              </p>
            </div>
          </div>
        </TextureCard>
      )}

      {/* ─────── EMPTY STATE ─────── */}
      {!results?.hasData && !running && !quotaBlocked && (
        <TextureCard className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="size-10 grid place-items-center rounded-xl shrink-0"
              style={{
                background: `hsl(var(--brand-violet) / 0.14)`,
                border: `1px solid hsl(var(--brand-violet) / 0.35)`,
                color: `hsl(var(--brand-violet))`,
              }}
            >
              <Bot className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold mb-1">
                {seeding ? "Cargando prompts…" : "Preparando primer run automático…"}
              </h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed max-w-[680px]">
                Ya cargué {promptsTotal || "—"} prompts ({promptsSource ?? "cargando…"}). En cuanto
                terminen verás cómo aparece Bewe vs. competidores (Booksy, Mindbody, Fresha…) en
                respuestas de Gemini.
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-2">
                Coste · ~0€ (cuota gratuita de Gemini). Duración · 1–2 min por run · auto-run al entrar.
              </p>
            </div>
          </div>
        </TextureCard>
      )}

      {/* ─────── COMPETIDORES + INDUSTRIAS ─────── */}
      {stats && (
        <div className="grid lg:grid-cols-2 gap-3">
          <TextureCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="size-4 text-[hsl(var(--brand-ember))]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Competidores detectados
              </h3>
            </div>
            {stats.topCompetitors.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No se detectaron competidores en este run.</p>
            ) : (
              <div className="space-y-1.5">
                {stats.topCompetitors.map((c) => {
                  const max = stats.topCompetitors[0].count;
                  const pct = (c.count / max) * 100;
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="text-[11px] font-mono w-32 truncate">{c.name}</div>
                      <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "hsl(var(--brand-ember))" }}
                        />
                      </div>
                      <div className="text-[11px] font-mono tabular w-8 text-right">{c.count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </TextureCard>

          <TextureCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-[hsl(var(--brand-lime))]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Industrias adyacentes
              </h3>
            </div>
            {stats.topIndustries.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No se detectaron industrias adyacentes.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stats.topIndustries.map((i) => (
                  <Badge key={i.name} variant="lime" className="font-mono">
                    {i.name} · {i.count}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-3 leading-snug">
              Oportunidades · industrias que los LLMs ya asocian al rubro y donde Bewe podría expandirse.
            </p>
          </TextureCard>
        </div>
      )}

      {/* ─────── BY CATEGORY ─────── */}
      {stats && stats.byCategory.length > 0 && (
        <TextureCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ChartLine className="size-4 text-[hsl(var(--brand-cyan))]" />
            <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Visibility por categoría
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {stats.byCategory.map((c) => (
              <div key={c.category} className="px-3 py-2.5 rounded-lg bg-secondary/30 border border-border/60">
                <div className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{c.category}</div>
                <div className="font-mono font-bold text-lg tabular leading-none mt-1">{c.visibilityPct}%</div>
                <div className="text-[10px] text-muted-foreground mt-1">{c.n} prompts</div>
              </div>
            ))}
          </div>
        </TextureCard>
      )}

      {/* ─────── LISTA DE PROMPTS POR CATEGORÍA ─────── */}
      <section>
        <SectionHeader
          title="Lista de prompts"
          sub={
            seeding
              ? "Cargando prompts…"
              : `${prompts.length} prompts · agrupados por categoría · fuente: ${promptsSource ?? "—"}`
          }
          right={
            <Badge variant="outline" className="font-mono">
              {prompts.length} totales
            </Badge>
          }
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {grouped.map(([cat, list]) => (
            <SpotlightCard
              key={cat}
              spotlightColor={CATEGORY_ACCENT[cat]}
              intensity={0.22}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquareCode
                    className="size-3.5"
                    style={{ color: `hsl(${CATEGORY_ACCENT[cat]})` }}
                  />
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {CATEGORY_LABEL[cat]}
                  </h3>
                </div>
                <Badge variant="outline" className="font-mono">
                  {list.length}
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {list.map((p) => (
                  <li key={p.id} className="text-[11px] leading-snug text-foreground/85">
                    <span className="font-mono text-[9px] text-muted-foreground mr-1.5">{p.id}</span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ─────── DETALLE PER-PROMPT (cuando hay run) ─────── */}
      {results?.hasData && results.latest && (
        <TextureCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[hsl(var(--brand-violet))]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Detalle del último run
              </h3>
            </div>
            <Badge variant="outline" className="font-mono">
              {results.latest.results.length} prompts
            </Badge>
          </div>
          <ul className="divide-y divide-border/60">
            {results.latest.results.map((r) => {
              const open = !!expanded[r.promptId];
              return (
                <li key={r.promptId}>
                  <button
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [r.promptId]: !e[r.promptId] }))
                    }
                    className="w-full text-left px-5 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {open ? (
                        <ChevronDown className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="font-mono text-[9px]">
                            {r.promptId}
                          </Badge>
                          <Badge
                            variant={r.mentionsBewe ? "success" : "danger"}
                            className="font-mono text-[9px]"
                          >
                            {r.mentionsBewe
                              ? `Bewe ✓${r.bewePosition ? ` #${r.bewePosition}` : ""}`
                              : "Bewe ✗"}
                          </Badge>
                          {r.errored && (
                            <Badge variant="warning" className="font-mono text-[9px]">
                              error
                            </Badge>
                          )}
                        </div>
                        <div className="text-[12px] font-medium line-clamp-2 whitespace-normal" title={r.promptText}>{r.promptText}</div>
                        {r.competitorsMentioned.length > 0 && !open && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            competidores: {r.competitorsMentioned.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-5 pb-4 pl-12 space-y-2"
                    >
                      {r.competitorsMentioned.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-muted-foreground mr-1">competidores:</span>
                          {r.competitorsMentioned.map((c) => (
                            <Badge key={c} variant="ember" className="font-mono text-[9px]">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {r.industriesDetected.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-muted-foreground mr-1">industrias:</span>
                          {r.industriesDetected.map((i) => (
                            <Badge key={i} variant="lime" className="font-mono text-[9px]">
                              {i}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80 bg-background/60 rounded-lg border border-border/60 p-3 mt-2 max-h-[280px] overflow-y-auto">
                        {r.errored ? `[error] ${r.errorMessage ?? "sin detalle"}` : r.response}
                      </pre>
                    </motion.div>
                  )}
                </li>
              );
            })}
          </ul>
        </TextureCard>
      )}

      {/* ─────── HISTÓRICO ─────── */}
      {results && results.history.length > 1 && (
        <TextureCard className="p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Histórico · últimos {results.history.length} runs
          </div>
          <div className="flex flex-wrap gap-2">
            {results.history.map((h) => (
              <div
                key={h.runAt}
                className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-border/60 text-[10px] font-mono"
              >
                {new Date(h.runAt).toLocaleString("es", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                <span className="text-foreground/80 font-bold">{h.visibilityPct}%</span>
                {h.avgPosition !== null && (
                  <>
                    {" · pos "}
                    <span className="text-foreground/80">{h.avgPosition.toFixed(1)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </TextureCard>
      )}
    </div>
  );
}

function HeroStat({
  label,
  value,
  sub,
  accent = "var(--foreground)",
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <TextureCard className="px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</div>
      <div className="font-mono font-bold text-lg tabular leading-none" style={{ color: `hsl(${accent})` }}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
    </TextureCard>
  );
}
