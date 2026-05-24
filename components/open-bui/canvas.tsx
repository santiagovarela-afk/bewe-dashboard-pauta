"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Loader2, AlertCircle, RotateCw, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * tldraw v3 — instalado en package.json (^3.15.6).
 * Importamos el módulo y su CSS dinámicamente para evitar SSR
 * (tldraw usa APIs de browser: window, IndexedDB, ResizeObserver).
 *
 * Notas:
 *   - El CSS de tldraw es OBLIGATORIO · si no se carga, el editor sale
 *     en blanco aunque el módulo monte.
 *   - El contenedor padre debe tener altura > 0; aquí forzamos `h-full`
 *     y exigimos que el wrapper externo defina la altura concreta.
 *   - Si el chunk no se puede cargar (ej. tldraw no instalado o ruta
 *     bloqueada), mostramos un mensaje claro con instrucción de instalar.
 */
const TldrawDynamic = dynamic(
  async () => {
    // Cargar CSS PRIMERO · si esto falla, el editor se monta sin estilos
    // y se ve como un cuadro vacío. Hacemos await del CSS antes del módulo.
    try {
      // @ts-expect-error — side-effect CSS import (no type declarations)
      await import("tldraw/tldraw.css");
    } catch (e) {
      console.error("[open-design] no se pudo cargar tldraw/tldraw.css", e);
    }
    const mod = await import("tldraw");
    return { default: mod.Tldraw };
  },
  {
    ssr: false,
    loading: () => <CanvasSkeleton />,
  },
);

export interface TldrawCanvasProps {
  persistenceKey?: string;
  onMount?: (editor: unknown) => void;
}

/**
 * Canvas tldraw que ocupa 100% del contenedor padre.
 *
 * IMPORTANTE: el wrapper externo debe definir altura (ej.
 * `h-[calc(100vh-220px)]`). Si la altura del padre es 0, tldraw
 * se monta pero no se ve nada — es la causa #1 del bug "canvas roto".
 */
export function TldrawCanvas({
  persistenceKey = "bw_open_bui_doc",
  onMount,
}: TldrawCanvasProps) {
  const [errored, setErrored] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Capturar errores de chunk loading (network, paquete faltante…)
  React.useEffect(() => {
    function onError(ev: ErrorEvent) {
      const msg = ev.message?.toLowerCase() ?? "";
      if (msg.includes("tldraw") || msg.includes("chunk")) {
        setErrored(ev.message || "Error desconocido cargando tldraw");
      }
    }
    function onRejection(ev: PromiseRejectionEvent) {
      const reason = String(ev.reason ?? "");
      if (reason.toLowerCase().includes("tldraw")) {
        setErrored(reason);
      }
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (errored) {
    return (
      <CanvasError
        message={errored}
        onRetry={() => {
          setErrored(null);
          setReloadKey((n) => n + 1);
        }}
      />
    );
  }

  return (
    // h-full + w-full + position:relative · tldraw requiere parent dimensionado
    <div
      className="h-full w-full relative"
      // Fallback inline · si Tailwind no aplica (CSS cache), tldraw colapsa.
      style={{ minHeight: 480 }}
    >
      <TldrawDynamic
        key={`tld-${reloadKey}`}
        persistenceKey={persistenceKey}
        onMount={onMount}
      />
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div className="h-full w-full grid place-items-center bg-card/30 min-h-[480px]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 text-muted-foreground"
      >
        <Loader2 className="size-6 animate-spin text-[hsl(var(--brand-violet))]" />
        <div className="text-[11px] uppercase tracking-[0.12em]">
          Cargando canvas tldraw…
        </div>
        <div className="text-[10px] text-muted-foreground/60 font-mono">
          chunk + tldraw.css
        </div>
      </motion.div>
    </div>
  );
}

function CanvasError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  // Detectar "modulo no encontrado" → mostrar comando de instalación
  const isMissing = /cannot find module|module not found|tldraw/i.test(message) &&
    /not.found|not.installed|missing/i.test(message);
  const installCmd = "npm install tldraw@^3.15.6";

  async function copyInstallCmd() {
    try {
      await navigator.clipboard.writeText(installCmd);
    } catch {
      /* ignore — UI ya muestra el comando */
    }
  }

  return (
    <div className="h-full w-full grid place-items-center bg-card/30 min-h-[480px] p-6">
      <div className="flex flex-col items-center gap-3 text-center max-w-[400px]">
        <AlertCircle className="size-7 text-[hsl(var(--destructive))]" />
        <div className="text-sm font-semibold">No se pudo cargar el canvas</div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {isMissing
            ? "El paquete tldraw no está instalado. Corre el comando de abajo en la raíz del proyecto y reinicia el dev server."
            : "Falló la carga del chunk · revisa tu conexión y reintenta."}
        </p>
        {isMissing && (
          <div className="w-full">
            <code className="block text-[11px] font-mono bg-secondary/60 border border-border rounded-md px-3 py-2 text-foreground">
              {installCmd}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={copyInstallCmd}
            >
              <PackageOpen className="size-3.5" /> Copiar comando
            </Button>
          </div>
        )}
        <div className="text-[10px] text-muted-foreground/60 font-mono break-all max-w-full">
          {message}
        </div>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCw className="size-3.5" /> Reintentar
        </Button>
      </div>
    </div>
  );
}
