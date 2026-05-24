"use client";
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Brain,
  Check,
  X,
  KeyRound,
  Bot,
  Database,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/lib/store";
import { PLAN } from "@/lib/config";
import {
  appendMemoryClient,
  deleteMemoryEntryClient,
  readMemoryClient,
} from "@/lib/ai-memory";
import type { AiMemoryFile } from "@/lib/types";
import { SectionHeader } from "@/components/shared/section-header";
import { TextureCard } from "@/components/fx/texture-card";
import { Button } from "@/components/ui/button";
import { MetaTokenSetup } from "@/components/config/meta-token-setup";
import { PersonaSelector } from "@/components/config/persona-selector";
import { triggerWelcomeAgain } from "@/components/onboarding/welcome-tour";
import { cn } from "@/lib/utils";

export function TabConfig() {
  const { user } = useDashboard();
  const [health, setHealth] = React.useState<{
    metaToken: boolean;
    gemini: boolean;
  } | null>(null);

  const refreshHealth = React.useCallback(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ metaToken: false, gemini: false }));
  }, []);

  React.useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6 max-w-[1100px]">
      <SectionHeader title="Configuración" sub="Tokens, integraciones y datos de cuenta" />

      {/* Persona selector — top of config */}
      <div data-persona-selector>
        <PersonaSelector />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {isAdmin ? (
          <TextureCard className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="size-4 text-[hsl(var(--brand-violet))]" />
              <h3 className="font-display font-semibold tracking-tight">Meta Graph API</h3>
              <span className="ml-auto text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[hsl(var(--brand-violet)/0.15)] text-[hsl(var(--brand-violet))] border border-[hsl(var(--brand-violet)/0.4)]">
                Admin
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
              El token se configura como variable de entorno{" "}
              <code className="font-mono text-[hsl(var(--brand-lime))]">META_TOKEN</code> en{" "}
              <code className="font-mono">.env.local</code>. Nunca se envía al cliente.
            </p>

            <StatusRow ok={health?.metaToken} label="Token configurado" />
            <StatusRow ok={true} label="Account ID" value={PLAN.meta.accountId} mono />
            <StatusRow ok={true} label="API version" value={PLAN.meta.apiVersion} mono />

            <MetaTokenSetup initialConfigured={health?.metaToken} onConfigured={refreshHealth} />

            <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <div className="font-bold mb-1 text-foreground/90">Alternativa por terminal:</div>
              <code className="font-mono text-[hsl(var(--brand-lime))]">npm run setup:meta</code>
              <div className="text-[10px] opacity-70 mt-1">
                CLI interactivo que te guía paso a paso y valida el token contra Graph API antes de guardar.
              </div>
            </div>
          </TextureCard>
        ) : (
          <TextureCard className="p-6 border-dashed">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="size-4 text-muted-foreground" />
              <h3 className="font-display font-semibold tracking-tight text-muted-foreground">
                Meta Graph API
              </h3>
              <span className="ml-auto text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border">
                Restringido
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Esta cuenta no tiene permisos para configurar tokens. Contacta a{" "}
              <strong className="text-foreground/85">Santi</strong>,{" "}
              <strong className="text-foreground/85">Julián</strong> o{" "}
              <strong className="text-foreground/85">Wendy</strong>.
            </p>
            <div className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground">
              Estado actual del token:{" "}
              {health?.metaToken ? (
                <span className="text-[hsl(var(--success))] font-mono">activo</span>
              ) : (
                <span className="text-[hsl(var(--destructive))] font-mono">no configurado</span>
              )}
            </div>
          </TextureCard>
        )}

        <TextureCard className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="size-4 text-[hsl(var(--brand-cyan))]" />
            <h3 className="font-display font-semibold tracking-tight">Cerebro IA · Gemini</h3>
          </div>
          <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
            Mark OS y Lúa OS corren sobre Gemini. Variable{" "}
            <code className="font-mono text-[hsl(var(--brand-lime))]">GEMINI_API_KEY</code> en{" "}
            <code className="font-mono">.env.local</code>. Gratis en{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline text-foreground/80 hover:text-foreground"
            >
              aistudio.google.com
            </a>.
          </p>

          <StatusRow ok={health?.gemini} label="API key configurada" />
          <StatusRow ok={true} label="Modelo" value="gemini-1.5-flash" mono />
        </TextureCard>

        <TextureCard className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Database className="size-4 text-[hsl(var(--brand-lime))]" />
            <h3 className="font-display font-semibold tracking-tight">Cuenta activa</h3>
          </div>
          <p className="text-[12px] text-muted-foreground mb-4">
            Detalles del plan mayo 2026.
          </p>
          <StatusRow ok={true} label="Período" value={PLAN.monthLabel} />
          <StatusRow ok={true} label="Budget" value={`€${PLAN.budget}`} mono />
          <StatusRow ok={true} label="Contingencia" value={`€${PLAN.contingency}`} mono />
          <StatusRow ok={true} label="Campañas" value="6 activas" />
          <StatusRow ok={true} label="Adsets" value="14" />
          <StatusRow ok={true} label="Page ID" value={PLAN.meta.pageId} mono />
          <StatusRow ok={true} label="IG ID" value={PLAN.meta.igAccountId} mono />
        </TextureCard>

        <TextureCard className="p-6">
          <h3 className="font-display font-semibold tracking-tight mb-1">Sesión</h3>
          <p className="text-[12px] text-muted-foreground mb-4">
            Acceso actual al dashboard.
          </p>
          <StatusRow ok={true} label="Usuario" value={user?.name ?? "—"} />
          <StatusRow ok={true} label="Correo" value={user?.email ?? "—"} mono />
          <StatusRow ok={true} label="Rol" value={user?.role ?? "—"} />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.clear();
                location.reload();
              }}
            >
              Limpiar caché local
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerWelcomeAgain}
              className="gap-1.5"
            >
              <Compass className="size-3.5" /> Ver tour de nuevo
            </Button>
          </div>
        </TextureCard>
      </div>

      <MemoryConfigSection />
    </div>
  );
}

/* ─────── Memoria del agente ─────── */

function MemoryConfigSection() {
  const [mem, setMem] = React.useState<AiMemoryFile | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [addTopic, setAddTopic] = React.useState("");
  const [addBody, setAddBody] = React.useState("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const m = await readMemoryClient();
      setMem(m);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
    function onChange() {
      void reload();
    }
    window.addEventListener("bw:memory-changed", onChange);
    return () => window.removeEventListener("bw:memory-changed", onChange);
  }, [reload]);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta entrada de la memoria?")) return;
    try {
      await deleteMemoryEntryClient(id);
      toast.success("Entrada eliminada");
      await reload();
      window.dispatchEvent(new CustomEvent("bw:memory-changed"));
    } catch (err) {
      toast.error("No se pudo eliminar", {
        description: err instanceof Error ? err.message : "Error",
      });
    }
  }

  async function handleResetRules() {
    if (!confirm("¿Resetear las reglas inviolables a sus valores por defecto?")) return;
    try {
      const r = await fetch("/api/ai-memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-rules" }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      toast.success("Reglas reseteadas");
      await reload();
      window.dispatchEvent(new CustomEvent("bw:memory-changed"));
    } catch (err) {
      toast.error("No se pudo resetear", {
        description: err instanceof Error ? err.message : "Error",
      });
    }
  }

  async function handleAdd() {
    const topic = addTopic.trim();
    const body = addBody.trim();
    if (!topic || !body) {
      toast.error("Topic y cuerpo son obligatorios");
      return;
    }
    try {
      await appendMemoryClient({ source: "user", topic, body });
      toast.success("Entrada agregada a memoria");
      setAddTopic("");
      setAddBody("");
      setShowAdd(false);
      await reload();
      window.dispatchEvent(new CustomEvent("bw:memory-changed"));
    } catch (err) {
      toast.error("No se pudo agregar", {
        description: err instanceof Error ? err.message : "Error",
      });
    }
  }

  const recent = React.useMemo(() => {
    const list = mem?.entries ?? [];
    return [...list].reverse().slice(0, 20);
  }, [mem]);

  return (
    <TextureCard className="p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-[hsl(var(--brand-violet))]" />
          <h3 className="font-display font-semibold tracking-tight">
            Memoria del agente
          </h3>
          {mem && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 border border-border px-1.5 py-0.5 rounded-full">
              {mem.rules.length} reglas · {mem.entries.length} entradas
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void reload()}
            disabled={loading}
            className="gap-1.5"
            title="Recargar"
          >
            <RefreshCcw className={cn("size-3.5", loading && "animate-spin")} />
            Recargar
          </Button>
          <Button
            type="button"
            variant="glow"
            size="sm"
            onClick={() => setShowAdd((v) => !v)}
            className="gap-1.5"
          >
            <Plus className="size-3.5" /> Nueva entrada
          </Button>
        </div>
      </div>

      <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
        Estas reglas y notas se inyectan en cada conversación con Gemini. El agente las
        usa como contexto persistente — siempre sabe el norte de la estrategia que Julián
        planteó.
      </p>

      {/* Form de agregar */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  value={addTopic}
                  onChange={(e) => setAddTopic(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-violet)/0.5)]"
                  placeholder="Ej: C2 saturada · subir a €30/día"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Cuerpo (markdown ok)
                </label>
                <textarea
                  rows={4}
                  value={addBody}
                  onChange={(e) => setAddBody(e.target.value)}
                  className="w-full rounded-md border border-border bg-background/60 px-3 py-1.5 text-sm resize-y leading-relaxed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-violet)/0.5)]"
                  placeholder="Descripción detallada de la decisión o hallazgo…"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdd(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="glow"
                  size="sm"
                  onClick={() => void handleAdd()}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reglas (read-only) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Reglas inviolables (system)
          </div>
          <button
            type="button"
            onClick={() => void handleResetRules()}
            className="text-[10px] text-muted-foreground hover:text-[hsl(var(--destructive))] transition inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <RefreshCcw className="size-3" /> Resetear reglas
          </button>
        </div>
        <ul className="space-y-1 text-[12px] leading-relaxed">
          {(mem?.rules ?? []).map((r, i) => (
            <li
              key={i}
              className="flex gap-2 px-2.5 py-1.5 rounded-md bg-background/30 border border-border/50"
            >
              <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0 mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground/85">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Entries (timeline) */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Historial reciente ({recent.length}/{mem?.entries.length ?? 0})
        </div>
        {recent.length === 0 ? (
          <div className="text-[12px] text-muted-foreground/70 italic px-2 py-3">
            Sin entradas todavía. Guarda hallazgos desde el chat con el botón{" "}
            <strong>Recordar</strong>.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {e.ts.slice(0, 16).replace("T", " ")}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase border",
                        e.source === "agent"
                          ? "bg-[hsl(var(--brand-cyan)/0.15)] text-[hsl(var(--brand-cyan))] border-[hsl(var(--brand-cyan)/0.4)]"
                          : e.source === "system"
                            ? "bg-muted/40 text-muted-foreground border-border"
                            : "bg-[hsl(var(--brand-violet)/0.15)] text-[hsl(var(--brand-violet))] border-[hsl(var(--brand-violet)/0.4)]",
                      )}
                    >
                      {e.source}
                    </span>
                    {e.ref && (
                      <span className="text-[10px] font-mono text-[hsl(var(--brand-lime))]">
                        {e.ref}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(e.id)}
                    aria-label="Eliminar entrada"
                    className="grid place-items-center size-6 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-[hsl(var(--destructive))] transition shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="text-[12.5px] font-semibold text-foreground/95 mb-0.5 break-words">
                  {e.topic}
                </div>
                <div className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap break-words">
                  {e.body}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 rounded-lg border border-border/60 bg-background/30 p-3 text-[11px] leading-relaxed text-muted-foreground flex items-start gap-2">
        <Sparkles className="size-3.5 text-[hsl(var(--brand-violet))] shrink-0 mt-0.5" />
        <span>
          La memoria persiste en{" "}
          <code className="font-mono text-[hsl(var(--brand-lime))]">.data/ai-memory.json</code>{" "}
          y se inyecta en cada prompt de Gemini. Las reglas no se editan; sólo se resetean.
        </span>
      </div>
    </TextureCard>
  );
}

function StatusRow({
  ok,
  label,
  value,
  mono = false,
}: {
  ok?: boolean;
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        {value ? (
          <span className={mono ? "font-mono text-[11px] text-foreground/80" : "font-semibold"}>
            {value}
          </span>
        ) : ok === true ? (
          <span className="inline-flex items-center gap-1 text-[hsl(var(--success))] font-mono text-[11px]">
            <Check className="size-3" /> Activo
          </span>
        ) : ok === false ? (
          <span className="inline-flex items-center gap-1 text-[hsl(var(--destructive))] font-mono text-[11px]">
            <X className="size-3" /> Falta
          </span>
        ) : (
          <span className="text-muted-foreground/50 font-mono text-[11px]">—</span>
        )}
      </span>
    </div>
  );
}
