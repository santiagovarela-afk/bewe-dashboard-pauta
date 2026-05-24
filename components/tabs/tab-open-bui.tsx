"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pencil, PenTool, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TldrawCanvas } from "@/components/open-bui/canvas";
import { SkillPicker } from "@/components/open-bui/skill-picker";
import { BriefInput } from "@/components/open-bui/brief-input";
import { DesignPreview } from "@/components/open-bui/design-preview";
import { ExportButtons } from "@/components/open-bui/export-buttons";
import { BrandKitPanel } from "@/components/open-bui/brand-kit-panel";
import { SKILLS, getSkill } from "@/components/open-bui/skills";
import { useDashboard } from "@/lib/store";

const STORAGE_KEY_SKILL = "bw_open_design_skill";
const STORAGE_KEY_BRIEF = "bw_open_design_brief";
const STORAGE_KEY_QUOTA_UNTIL = "bw_open_design_quota_until";
/** Cooldown tras un 429 Gemini (ms) — 5 min como pidió Santi. */
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Open Design · Bewe OS
 *
 * Inspirado en Open Design (nexu-io). Reemplaza el canvas tldraw como
 * default por un generador AI de piezas:
 *   1. Usuario elige skill (IG post, FB ad, banner…)
 *   2. Escribe brief en lenguaje natural
 *   3. Mark/Lúa genera HTML+CSS via /api/design/generate (Gemini)
 *   4. Preview en iframe sandboxed · export PNG / HTML
 *
 * El canvas tldraw queda como "modo manual" accesible por toggle.
 *
 * Manejo de errores:
 *   - 429 (quota Gemini) → mensaje claro + botón Generar deshabilitado 5min.
 *   - El estado de cooldown persiste en localStorage entre recargas.
 */
export function TabOpenBui() {
  const { aiPersona } = useDashboard();
  const personaLabel = aiPersona === "lua" ? "Lúa OS" : "Mark OS";

  const [mode, setMode] = React.useState<"design" | "canvas">("design");
  const [skillId, setSkillId] = React.useState<string>(() => SKILLS[0].id);
  const [brief, setBrief] = React.useState("");
  const [html, setHtml] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [variant, setVariant] = React.useState(0);
  const [quotaUntil, setQuotaUntil] = React.useState<number>(0);
  const [now, setNow] = React.useState<number>(() => Date.now());

  // Hidratar último skill, brief, cooldown
  React.useEffect(() => {
    try {
      const sk = localStorage.getItem(STORAGE_KEY_SKILL);
      if (sk && SKILLS.some((s) => s.id === sk)) setSkillId(sk);
      const br = localStorage.getItem(STORAGE_KEY_BRIEF);
      if (br) setBrief(br);
      const qu = Number(localStorage.getItem(STORAGE_KEY_QUOTA_UNTIL) || "0");
      if (qu > Date.now()) setQuotaUntil(qu);
    } catch {
      /* ignore */
    }
  }, []);

  // Persistir cambios
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SKILL, skillId);
    } catch {
      /* ignore */
    }
  }, [skillId]);
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRIEF, brief);
    } catch {
      /* ignore */
    }
  }, [brief]);

  // Tick cada segundo mientras hay cooldown activo (para countdown UI)
  React.useEffect(() => {
    if (quotaUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quotaUntil]);

  const cooldownRemainingMs = Math.max(0, quotaUntil - now);
  const inCooldown = cooldownRemainingMs > 0;
  const skill = getSkill(skillId);

  async function generate(nextVariant: number) {
    if (inCooldown) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/design/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, brief, variant: nextVariant, persona: aiPersona }),
      });
      const data = await r.json();
      if (!r.ok) {
        // Quota agotada → activar cooldown y mensaje claro
        if (r.status === 429 || data?.quotaExhausted) {
          const until = Date.now() + QUOTA_COOLDOWN_MS;
          setQuotaUntil(until);
          try {
            localStorage.setItem(STORAGE_KEY_QUOTA_UNTIL, String(until));
          } catch {
            /* ignore */
          }
          setError(
            data?.hint ||
              "Gemini agotó cuota del día. El generador estará disponible cuando renueve (~24h) o si activas billing en Google AI Studio. Mientras tanto, usa el Canvas manual.",
          );
        } else {
          setError(data?.error || `Error ${r.status}`);
        }
        setHtml(null);
        return;
      }
      setHtml(data.html as string);
      setVariant(nextVariant);
    } catch (e) {
      setError((e as Error).message || "Falló la generación");
    } finally {
      setLoading(false);
    }
  }

  function onGenerate() {
    setVariant(0);
    void generate(0);
  }
  function onVariant() {
    void generate(variant + 1);
  }

  return (
    <div className="space-y-4 max-w-[1600px]">
      <SectionHeader
        title="Open Design · Bewe OS"
        sub={
          mode === "design"
            ? "Brief → AI genera HTML/CSS → preview → export"
            : "Canvas manual · tldraw para dibujar a mano"
        }
        right={
          <>
            <Badge variant="violet" className="font-mono">
              {mode === "design" ? `${personaLabel} · gen` : "tldraw v3"}
            </Badge>
            <Button
              variant={mode === "design" ? "outline" : "default"}
              size="sm"
              onClick={() => setMode(mode === "design" ? "canvas" : "design")}
              title={
                mode === "design"
                  ? "Abrir canvas manual tldraw"
                  : "Volver al generador AI"
              }
            >
              {mode === "design" ? (
                <>
                  <Pencil className="size-3.5" /> Canvas manual
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" /> Volver al generador
                </>
              )}
            </Button>
          </>
        }
      />

      <AnimatePresence mode="wait">
        {mode === "design" ? (
          <motion.div
            key="design"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1.1fr)] gap-4"
          >
            {/* Sidebar: skills + brand kit */}
            <aside className="lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
              <SkillPicker activeId={skillId} onSelect={setSkillId} />
              <BrandKitPanel />
            </aside>

            {/* Centro: brief */}
            <section>
              <BriefInput
                skill={skill}
                value={brief}
                onChange={setBrief}
                onGenerate={onGenerate}
                onVariant={onVariant}
                loading={loading}
                hasResult={html !== null}
                personaLabel={personaLabel}
                cooldownRemainingMs={cooldownRemainingMs}
              />
              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-2 font-bold">
                  Sobre Open Design
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Inspirado en{" "}
                  <span className="text-foreground font-semibold">Open Design</span>{" "}
                  (nexu-io). Replica local-first: 12 skills, brief en lenguaje
                  natural, AI senior de Bewe te devuelve HTML+CSS listo para
                  exportar. Si Gemini está caído, puedes dibujar en el Canvas
                  manual.
                </p>
              </div>
            </section>

            {/* Derecha: preview + export */}
            <section>
              <DesignPreview
                skill={skill}
                html={html}
                loading={loading}
                error={error}
              />
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[10px] text-muted-foreground/70 font-mono">
                  {html
                    ? `Variante ${variant} · ${Math.round(html.length / 1024)} KB`
                    : "Sin pieza · pulsa Generar"}
                </div>
                <ExportButtons skill={skill} html={html} briefHint={brief} />
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="w-full h-[calc(100vh-220px)] min-h-[560px] rounded-xl border border-border bg-card overflow-hidden relative"
          >
            <CanvasModeHint />
            <TldrawCanvas persistenceKey="bw_open_bui_doc" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CanvasModeHint() {
  return (
    <div className="absolute top-2 left-2 z-10 pointer-events-none">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-card/80 backdrop-blur px-2 py-1 rounded-md border border-border">
        <PenTool className="size-3" />
        Modo manual · tldraw v3
      </div>
    </div>
  );
}
