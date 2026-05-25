"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PowerOff,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Phase =
  | "offline"
  | "idle"
  | "detected"
  | "validating"
  | "smoke-testing"
  | "connected"
  | "error";

interface ConnectorStatus {
  phase: Phase;
  message: string;
  updatedAt: string;
  user?: { id?: string; name?: string };
  accountOk?: boolean;
  accountName?: string;
  smoke?: Record<string, { ok: boolean; detail?: string }>;
  error?: string;
  tokenPreview?: string;
  stalled?: boolean;
}

const PHASE_META: Record<
  Phase,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string; // hsl variable
    dotPulse: boolean;
  }
> = {
  offline:        { label: "Conector apagado", Icon: PowerOff,       color: "var(--muted-foreground)", dotPulse: false },
  idle:           { label: "Sin token",         Icon: Activity,       color: "var(--muted-foreground)", dotPulse: true  },
  detected:       { label: "Token detectado",   Icon: Sparkles,       color: "var(--brand-cyan)",       dotPulse: true  },
  validating:     { label: "Validando",         Icon: Loader2,        color: "var(--brand-violet)",     dotPulse: true  },
  "smoke-testing":{ label: "Probando APIs",     Icon: Loader2,        color: "var(--brand-violet)",     dotPulse: true  },
  connected:      { label: "Meta conectado",    Icon: CheckCircle2,   color: "var(--success)",          dotPulse: false },
  error:          { label: "Error",             Icon: XCircle,        color: "var(--destructive)",      dotPulse: true  },
};

export function ConnectorPill() {
  const [status, setStatus] = React.useState<ConnectorStatus | null>(null);
  const [open, setOpen] = React.useState(false);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const r = await fetch("/api/connector-status", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as ConnectorStatus;
        if (cancelled) return;
        setStatus(data);
        setErrored(false);
      } catch {
        if (!cancelled) setErrored(true);
      } finally {
        if (!cancelled) timer = setTimeout(tick, 4000);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!status) return null;
  // Si el connector reporta stalled (>30s sin update) y no estaba conectado, lo tratamos como offline
  const phase: Phase = status.stalled && status.phase !== "connected" ? "offline" : status.phase;
  const meta = PHASE_META[phase] ?? PHASE_META.offline;
  const Icon = meta.Icon;
  const isSpinning = phase === "validating" || phase === "smoke-testing";

  return (
    <div className="relative">
      <button
        data-tour="connector-pill"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 h-8 px-3 rounded-full border text-[11px] whitespace-nowrap transition-colors",
          "hover:border-foreground/30",
        )}
        style={{
          borderColor: `hsl(${meta.color} / 0.4)`,
          background: `hsl(${meta.color} / 0.08)`,
          color: `hsl(${meta.color})`,
        }}
        title="Estado del conector Meta · click para detalles"
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            meta.dotPulse && "animate-pulse-glow",
          )}
          style={{ background: `hsl(${meta.color})` }}
        />
        <Icon className={cn("size-3", isSpinning && "animate-spin")} />
        <span className="font-mono">{meta.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 z-50 w-[340px] rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl p-4"
            role="dialog"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Conector Meta
              </div>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: `hsl(${meta.color} / 0.14)`,
                  color: `hsl(${meta.color})`,
                }}
              >
                {phase}
              </span>
            </div>

            <p className="text-[12px] text-foreground/90 leading-relaxed mb-3">
              {status.message}
            </p>

            {status.user && (
              <div className="text-[11px] text-muted-foreground mb-2">
                <span className="text-foreground/80 font-semibold">
                  {status.user.name || status.user.id}
                </span>{" "}
                · token <code className="font-mono">{status.tokenPreview}</code>
              </div>
            )}

            {status.smoke && (
              <div className="border-t border-border/60 pt-3 space-y-1.5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80 font-bold">
                  Smoke tests
                </div>
                {Object.entries(status.smoke).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-[11px]">
                    {v.ok ? (
                      <CheckCircle2 className="size-3 text-[hsl(var(--success))]" />
                    ) : (
                      <AlertTriangle className="size-3 text-[hsl(var(--warning))]" />
                    )}
                    <span className="font-mono text-foreground/80 w-16">{k}</span>
                    <span className="text-muted-foreground truncate">
                      {v.detail || (v.ok ? "ok" : "—")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {phase === "offline" && (
              <div className="mt-3 pt-3 border-t border-border/60 text-[10px] text-muted-foreground leading-relaxed">
                Para activar la vigilancia automática del token, abre otra terminal y corre:
                <pre className="mt-1 font-mono text-[hsl(var(--brand-lime))] bg-background/60 rounded px-2 py-1 text-[10px]">
                  npm run connector
                </pre>
              </div>
            )}

            {phase === "idle" && (
              <div className="mt-3 pt-3 border-t border-border/60 text-[10px] text-muted-foreground leading-relaxed">
                Ve a la pestaña <b>Config</b> · pega tu token Meta · el connector lo detecta y valida automáticamente.
              </div>
            )}

            {errored && (
              <div className="mt-2 text-[10px] text-[hsl(var(--destructive))]">
                ⚠ No se puede leer el endpoint /api/connector-status
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-border/40 text-[9px] text-muted-foreground/60 font-mono">
              Actualizado: {new Date(status.updatedAt).toLocaleTimeString("es")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
