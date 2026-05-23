"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  RotateCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type State =
  | { kind: "idle" }
  | { kind: "validating" }
  | {
      kind: "success";
      user?: { id: string; name?: string };
      accountOk?: boolean;
      accountName?: string;
      restartNote?: string;
    }
  | { kind: "error"; error: string; step?: string };

export function MetaTokenSetup({
  initialConfigured,
  onConfigured,
}: {
  initialConfigured?: boolean;
  onConfigured?: () => void;
}) {
  const [token, setToken] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [state, setState] = React.useState<State>({ kind: "idle" });

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const t = token.trim();
    if (!t || t.length < 20) {
      setState({ kind: "error", error: "Pega el token completo (debe empezar con EAA…)." });
      return;
    }
    setState({ kind: "validating" });
    try {
      const r = await fetch("/api/setup/meta-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setState({
          kind: "error",
          error: data.error || `HTTP ${r.status}`,
          step: data.step,
        });
        return;
      }
      setState({
        kind: "success",
        user: data.user,
        accountOk: data.accountOk,
        accountName: data.accountName,
        restartNote: data.restartNote,
      });
      setToken("");
      onConfigured?.();
      toast.success("Token guardado", {
        description: data.user?.name
          ? `Validado como ${data.user.name}`
          : "Validado y persistido",
      });
    } catch (err) {
      setState({
        kind: "error",
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-[hsl(var(--brand-violet)/0.3)] bg-[hsl(var(--brand-violet)/0.04)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="size-4 text-[hsl(var(--brand-violet))]" />
        <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--brand-violet))]">
          Configurar token desde aquí
        </h4>
        {initialConfigured && (
          <Badge variant="success" className="!text-[9px]">
            Ya configurado
          </Badge>
        )}
      </div>

      <ol className="text-[11px] text-muted-foreground space-y-1 mb-4 list-decimal list-inside leading-relaxed">
        <li>
          Abre{" "}
          <a
            href="https://business.facebook.com/settings/system-users"
            target="_blank"
            rel="noreferrer"
            className="text-foreground/90 underline underline-offset-2 hover:text-foreground inline-flex items-center gap-0.5"
          >
            Business Manager · Usuarios del sistema
            <ExternalLink className="size-2.5" />
          </a>
        </li>
        <li>
          Elige tu System User → <b className="text-foreground/90">Generar nuevo token</b>
        </li>
        <li>
          Permisos mínimos: <code className="font-mono text-[hsl(var(--brand-lime))]">ads_read</code>{" "}
          · marca <b className="text-foreground/90">"Never expires"</b>
        </li>
        <li>Copia el token y pégalo abajo. Se valida contra Meta y se guarda en <code className="font-mono">.env.local</code>.</li>
      </ol>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label className="mb-1.5 block">System User Token</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="EAAaIVRk…"
              autoComplete="off"
              spellCheck={false}
              disabled={state.kind === "validating"}
              className="pr-20"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                tabIndex={-1}
                aria-label={show ? "Ocultar" : "Mostrar"}
              >
                {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const t = await navigator.clipboard.readText();
                    if (t) {
                      setToken(t.trim());
                      toast.success("Pegado del portapapeles");
                    }
                  } catch {
                    toast.error("No se pudo leer el portapapeles");
                  }
                }}
                className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                tabIndex={-1}
                aria-label="Pegar del portapapeles"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            Tu token nunca se envía al navegador después de guardar — se almacena en{" "}
            <code className="font-mono">.env.local</code> y solo lo usa el server.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="submit"
            variant="glow"
            size="sm"
            disabled={state.kind === "validating" || !token.trim()}
          >
            {state.kind === "validating" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Validando con Meta…
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5" /> Validar y guardar
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setToken("");
              setState({ kind: "idle" });
            }}
          >
            Limpiar
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {state.kind === "error" && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-md bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] p-2.5 text-[11px] text-[hsl(var(--destructive))]"
            >
              <XCircle className="size-3.5 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-semibold">No se pudo guardar</div>
                <div className="text-[10px] opacity-80 break-words">{state.error}</div>
                {state.step === "validate" && (
                  <div className="text-[10px] opacity-70 mt-1">
                    ↳ Asegúrate de que el token tenga permiso{" "}
                    <code className="font-mono">ads_read</code> y "Never expires".
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {state.kind === "success" && (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-md bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.35)] p-3 text-[11px] text-[hsl(var(--success))]"
            >
              <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-1">
                <div className="font-semibold">Token validado y guardado</div>
                {state.user && (
                  <div className="text-[10px] opacity-90">
                    Usuario: <b>{state.user.name || state.user.id}</b>
                  </div>
                )}
                {state.accountOk ? (
                  <div className="text-[10px] opacity-90">
                    Acceso confirmado a la cuenta{" "}
                    <b>{state.accountName || "Bewe"}</b>.
                  </div>
                ) : (
                  <div className="text-[10px] text-[hsl(var(--warning))] opacity-90">
                    ⚠ Sin acceso confirmado a la cuenta Bewe (faltan permisos{" "}
                    <code className="font-mono">ads_read</code>). El token quedó guardado igual.
                  </div>
                )}
                <div className="text-[10px] text-foreground/80 pt-1 flex items-center gap-1.5">
                  <RotateCw className="size-3" />
                  Reinicia el dev server para que cargue:{" "}
                  <code className="font-mono">Ctrl+C</code> →{" "}
                  <code className="font-mono">npm run dev</code>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
