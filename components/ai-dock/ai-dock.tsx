"use client";
/**
 * AI Dock · Chat flotante persistente disponible en todas las tabs.
 *  - FAB en bottom-right cuando está cerrado
 *  - Panel 420x640 cuando está abierto (fullscreen en móvil)
 *  - Prompts contextuales según la tab activa (lib/store → useDashboard)
 *  - Persistencia local de mensajes en localStorage (key: bw_ai_messages)
 *  - Atajos: Ctrl/Cmd+K abre, Esc cierra, Enter envía, Shift+Enter newline
 *  - Llama a /api/gemini con el plan-context dinámico (campañas + díasElapsed)
 */
import * as React from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import {
  Bot,
  ChevronDown,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/lib/store";
import { buildPlanContext } from "@/lib/plan-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Message, TypingIndicator, type Msg } from "./messages";
import { DockButton } from "./dock-button";
import { labelFor, promptsFor } from "./contextual-prompts";
import { MemoryPill } from "./memory-pill";
import { IntroCard, useIntroSeen } from "./intro-card";
import {
  appendMemoryClient,
  DEFAULT_RULES,
  personaName,
  readMemoryClient,
} from "@/lib/ai-memory";
import type { AiMemoryFile } from "@/lib/types";

const STORAGE_KEY = "bw_ai_messages";
const MAX_PERSISTED = 50;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeGreeting(
  tab: string,
  persona: "mark" | "lua" = "mark",
  userName?: string,
): Msg {
  const who = userName ?? "ahí";
  const head =
    persona === "mark"
      ? `Buenas ${who} · soy **Mark OS**. Estás en **${labelFor(tab)}** — disparas tú o uso una sugerencia. Sin presión.`
      : `Hola ${who} · soy **Lúa OS** ✦ estás en **${labelFor(tab)}**. Cuéntame en qué andas o toca una sugerencia abajo.`;
  return {
    id: "greeting",
    role: "bot",
    ts: Date.now(),
    text: head,
  };
}

function loadPersisted(): Msg[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Msg[];
    if (!Array.isArray(parsed)) return null;
    return parsed.slice(-MAX_PERSISTED);
  } catch {
    return null;
  }
}

function persist(messages: Msg[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = messages.slice(-MAX_PERSISTED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota / private mode → ignore */
  }
}

export function AiDock() {
  const { tab, campaigns, daysElapsed, user, aiPersona, setTab } = useDashboard();
  const { seen: introSeen, markSeen: markIntroSeen } = useIntroSeen();

  const [open, setOpen] = React.useState(false);
  const [minimized, setMinimized] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>(() => [
    makeGreeting("dashboard", "mark"),
  ]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const [hydrated, setHydrated] = React.useState(false);
  const [memory, setMemory] = React.useState<AiMemoryFile>({
    rules: DEFAULT_RULES,
    entries: [],
  });
  const [saveModal, setSaveModal] = React.useState<{
    topic: string;
    body: string;
    sourceId: string;
  } | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

  // Hydration: cargar mensajes persistidos solo en cliente
  React.useEffect(() => {
    const persisted = loadPersisted();
    if (persisted && persisted.length > 0) {
      setMessages(persisted);
    } else {
      setMessages([makeGreeting(tab, aiPersona, user?.name)]);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar memoria persistente del agente
  const refreshMemory = React.useCallback(async () => {
    const mem = await readMemoryClient();
    setMemory(mem);
  }, []);

  React.useEffect(() => {
    void refreshMemory();
    // Re-cargar si otro componente (config) modifica la memoria
    const handler = () => void refreshMemory();
    window.addEventListener("bw:memory-changed", handler);
    return () => window.removeEventListener("bw:memory-changed", handler);
  }, [refreshMemory]);

  // Persistir cada cambio
  React.useEffect(() => {
    if (hydrated) persist(messages);
  }, [messages, hydrated]);

  // Atajos globales
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "/")) {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) {
            setMinimized(false);
            setUnread(0);
          }
          return next;
        });
      } else if (e.key === "Escape" && open && !minimized) {
        // Solo cerrar si el foco no está en otro input importante
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, minimized]);

  // Autoscroll
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, thinking, open]);

  // External "ask the AI" events from other tabs (e.g. Campañas)
  React.useEffect(() => {
    function onAsk(e: Event) {
      const detail = (e as CustomEvent<{ campaign?: string; action?: string; question?: string }>).detail ?? {};
      const question =
        detail.question ??
        (detail.campaign
          ? `Sobre ${detail.campaign}${detail.action ? ` y la acción "${detail.action}"` : ""}: ¿qué recomiendas hacer y por qué?`
          : "Resúmeme el estado de la campaña actual.");
      setOpen(true);
      setMinimized(false);
      setUnread(0);
      // Pequeño delay para que el panel se monte antes de auto-enviar
      setTimeout(() => {
        send(question);
      }, 280);
    }
    window.addEventListener("bw:ai-ask", onAsk as EventListener);
    return () => window.removeEventListener("bw:ai-ask", onAsk as EventListener);
    // send es estable a través de useCallback, no agregar al deps array por ciclo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autofocus al abrir
  React.useEffect(() => {
    if (open && !minimized) {
      const t = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [open, minimized]);

  // Reset unread al abrir
  React.useEffect(() => {
    if (open && !minimized) setUnread(0);
  }, [open, minimized]);

  const send = React.useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || thinking) return;
      setInput("");

      const userMsg: Msg = { id: uid(), role: "user", ts: Date.now(), text };
      setMessages((prev) => [...prev, userMsg]);
      setThinking(true);

      try {
        const system = buildPlanContext(campaigns, daysElapsed, memory, {
          persona: aiPersona,
          userName: user?.name,
        });
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, system }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const botMsg: Msg = {
          id: uid(),
          role: "bot",
          ts: Date.now(),
          text: String(data.text ?? "").trim() || "_(sin respuesta)_",
        };
        setMessages((prev) => [...prev, botMsg]);
        if (!open || minimized) {
          setUnread((u) => u + 1);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        toast.error("Error consultando Gemini", { description: msg });
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "bot",
            ts: Date.now(),
            text: `**Error:** ${msg}\n\nRevisa que \`GEMINI_API_KEY\` esté en \`.env.local\`.`,
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [input, thinking, campaigns, daysElapsed, open, minimized, memory, aiPersona, user?.name],
  );

  // Abrir modal "Guardar en memoria" pre-rellenado con el contenido del mensaje
  const openSaveModal = React.useCallback((msg: Msg) => {
    const body = msg.text.replace(/\*\*/g, "").trim();
    // Tomar la primera línea como topic, máx 60 chars
    const firstLine =
      body.split(/\n/).find((l) => l.trim().length > 0)?.trim() ?? "Nota del agente";
    const topic = firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine;
    setSaveModal({ topic, body, sourceId: msg.id });
  }, []);

  const confirmSaveMemory = React.useCallback(async () => {
    if (!saveModal) return;
    const topic = saveModal.topic.trim();
    const body = saveModal.body.trim();
    if (!topic || !body) {
      toast.error("Topic y cuerpo son obligatorios");
      return;
    }
    try {
      await appendMemoryClient({ source: "agent", topic, body });
      toast.success("Guardado en memoria del agente");
      setSaveModal(null);
      await refreshMemory();
      window.dispatchEvent(new CustomEvent("bw:memory-changed"));
    } catch (err) {
      toast.error("No se pudo guardar", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }, [saveModal, refreshMemory]);

  // ESC cierra el modal de guardar
  React.useEffect(() => {
    if (!saveModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSaveModal(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveModal]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function clearChat() {
    setMessages([makeGreeting(tab, aiPersona, user?.name)]);
    toast.success("Conversación limpiada");
  }

  function openConfigPersona() {
    setTab("config");
    setOpen(false);
    markIntroSeen();
    // Pequeño hint visual
    setTimeout(() => {
      const el = document.querySelector("[data-persona-selector]");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 240);
  }

  const prompts = promptsFor(tab);
  const tabLabel = labelFor(tab);
  const displayName = user?.name ?? "tú";
  const isMark = aiPersona === "mark";
  const personaLabel = personaName(aiPersona);

  // Tamaño según expanded
  const widthClass = expanded ? "md:w-[520px]" : "md:w-[420px]";
  const heightClass = expanded ? "md:h-[720px]" : "md:h-[640px]";

  // Easing y duración para la animación blossom (FAB ↔ panel)
  const BLOSSOM_TRANSITION = {
    duration: 0.35,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  };

  return (
    <>
      {/* FAB cerrado */}
      <div className="fixed bottom-6 right-6 z-[60] pointer-events-none">
        <AnimatePresence>
          {!open && (
            <div className="pointer-events-auto">
              <DockButton
                onClick={() => {
                  setOpen(true);
                  setMinimized(false);
                  setUnread(0);
                }}
                unread={unread}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Panel abierto — animación "blossom" desde la esquina del FAB */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dock-panel"
            drag={!minimized}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.04}
            initial={{
              opacity: 0,
              scale: 0.18,
              borderRadius: "50%",
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              scale: 1,
              borderRadius: "1rem",
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              scale: 0.22,
              borderRadius: "50%",
              filter: "blur(4px)",
            }}
            transition={BLOSSOM_TRANSITION}
            className={cn(
              "fixed z-[60] flex flex-col overflow-hidden",
              "bottom-4 right-4 md:bottom-6 md:right-6",
              "inset-x-4 md:inset-x-auto",
              minimized
                ? "md:w-[300px] md:h-12 h-12"
                : `top-4 md:top-auto ${widthClass} ${heightClass}`,
              "rounded-2xl border border-border bg-card/95 backdrop-blur-xl",
              "shadow-[0_24px_60px_-20px_hsl(var(--brand-violet)/0.45),0_8px_24px_-12px_hsl(var(--background)/0.8)]",
            )}
            style={{
              touchAction: minimized ? "auto" : "none",
              transformOrigin: "100% 100%",
            }}
          >
            {/* Border gradient halo */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--brand-violet)/0.18), transparent 40%, hsl(var(--brand-cyan)/0.16))",
                mixBlendMode: "screen",
              }}
            />

            {/* Header — drag handle */}
            <div
              onPointerDown={(e) => {
                if (!minimized) dragControls.start(e);
              }}
              className={cn(
                "relative flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/60",
                isMark
                  ? "bg-gradient-to-r from-[hsl(var(--brand-violet)/0.18)] via-transparent to-[hsl(var(--brand-cyan)/0.14)]"
                  : "bg-gradient-to-r from-[hsl(var(--brand-ember)/0.18)] via-transparent to-[hsl(var(--brand-violet)/0.14)]",
                !minimized && "cursor-grab active:cursor-grabbing",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative">
                  <div
                    className={cn(
                      "size-8 rounded-lg grid place-items-center shadow-[0_4px_12px_-4px_hsl(var(--brand-violet)/0.6)] bg-gradient-to-br",
                      isMark
                        ? "from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))]"
                        : "from-[hsl(var(--brand-ember))] to-[hsl(var(--brand-violet))]",
                    )}
                  >
                    {isMark ? (
                      <Bot className="size-4 text-white" />
                    ) : (
                      <Sparkles className="size-4 text-white" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[hsl(var(--success))] border-2 border-card" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-sm font-semibold leading-tight truncate flex items-center gap-1.5">
                    {personaLabel}
                    <MemoryPill
                      count={memory.entries.length}
                      rulesCount={memory.rules.length}
                    />
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono leading-tight truncate">
                    en {tabLabel} · online
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!minimized && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="hidden md:grid place-items-center size-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition"
                    title={expanded ? "Reducir" : "Ampliar"}
                  >
                    {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMinimized((v) => !v)}
                  className="grid place-items-center size-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition"
                  title={minimized ? "Restaurar" : "Minimizar"}
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", minimized && "rotate-180")} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid place-items-center size-7 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-[hsl(var(--destructive))] transition"
                  title="Cerrar (Esc)"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Cuerpo + footer · oculto si minimized */}
            {!minimized && (
              <>
                {!introSeen ? (
                  <div className="relative flex-1 overflow-hidden">
                    <IntroCard
                      onDismiss={markIntroSeen}
                      onOpenConfig={openConfigPersona}
                    />
                  </div>
                ) : (
                  <div
                    ref={scrollRef}
                    className="relative flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin"
                    style={{
                      scrollbarColor: "hsl(var(--border)) transparent",
                      scrollbarWidth: "thin",
                    }}
                  >
                    {messages.map((m, i) => (
                      <Message
                        key={m.id}
                        msg={m}
                        showTime={i === messages.length - 1 && m.role === "bot"}
                        onSaveMemory={openSaveModal}
                      />
                    ))}
                    <AnimatePresence>{thinking && <TypingIndicator key="typing" />}</AnimatePresence>
                  </div>
                )}

                {/* Footer · oculto durante la intro card */}
                {introSeen && (
                <div className="relative shrink-0 border-t border-border/60 bg-background/40 backdrop-blur-sm">
                  {/* Chips contextuales */}
                  {prompts.length > 0 && (
                    <div className="px-3 pt-2.5 pb-1.5 flex flex-wrap gap-1.5">
                      {prompts.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => void send(p)}
                          disabled={thinking}
                          className={cn(
                            "text-[11px] px-2.5 py-1 rounded-full border transition select-none",
                            "border-border bg-card/60 hover:bg-card hover:border-[hsl(var(--brand-violet)/0.5)]",
                            "text-foreground/85 hover:text-foreground",
                            "disabled:opacity-40 disabled:cursor-not-allowed",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={clearChat}
                        title="Limpiar conversación"
                        className="ml-auto text-[11px] px-2 py-1 rounded-full border border-border/60 bg-transparent hover:bg-destructive/10 text-muted-foreground hover:text-[hsl(var(--destructive))] transition inline-flex items-center gap-1"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 pt-2 flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          // auto-resize
                          const t = e.currentTarget;
                          t.style.height = "auto";
                          t.style.height = Math.min(t.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={onKeyDown}
                        placeholder={`Pregunta algo, ${displayName}…`}
                        disabled={thinking}
                        className={cn(
                          "w-full resize-none rounded-xl border border-border bg-background/60",
                          "px-3 py-2 pr-8 text-sm leading-relaxed",
                          "placeholder:text-muted-foreground/70",
                          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-violet)/0.5)] focus:border-[hsl(var(--brand-violet)/0.6)]",
                          "transition disabled:opacity-50",
                          "max-h-[120px] overflow-y-auto",
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="glow"
                      onClick={() => void send()}
                      disabled={thinking || !input.trim()}
                      className="size-10 shrink-0 rounded-xl"
                      title="Enviar (Enter)"
                    >
                      {thinking ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                  <div className="px-3 pb-2 -mt-1">
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      Enter envía · Shift+Enter nueva línea · Ctrl/Cmd+K abre/cierra
                    </span>
                  </div>
                </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: guardar mensaje en memoria del agente */}
      <AnimatePresence>
        {saveModal && (
          <motion.div
            key="save-memory-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-background/70 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Guardar en memoria del agente"
            onClick={() => setSaveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-[0_24px_60px_-20px_hsl(var(--brand-violet)/0.55)]",
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-lg bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] grid place-items-center">
                  <Sparkles className="size-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Guardar en memoria del agente</div>
                  <div className="text-[11px] text-muted-foreground">
                    El agente recordará este hallazgo en futuras conversaciones.
                  </div>
                </div>
              </div>

              <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Topic
              </label>
              <input
                type="text"
                value={saveModal.topic}
                onChange={(e) =>
                  setSaveModal((s) => (s ? { ...s, topic: e.target.value } : s))
                }
                className="w-full mb-3 rounded-md border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-violet)/0.5)]"
                placeholder="Ej: C2 saturada · subir a €30/día"
                autoFocus
              />

              <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Cuerpo
              </label>
              <textarea
                rows={6}
                value={saveModal.body}
                onChange={(e) =>
                  setSaveModal((s) => (s ? { ...s, body: e.target.value } : s))
                }
                className="w-full mb-4 rounded-md border border-border bg-background/60 px-3 py-2 text-sm resize-y leading-relaxed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-violet)/0.5)]"
              />

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveModal(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="glow"
                  size="sm"
                  onClick={() => void confirmSaveMemory()}
                >
                  Guardar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
