"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Loader2, AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * tldraw v3 — instalado en package.json (^3.15.6).
 * Importamos el módulo y su CSS dinámicamente para evitar SSR
 * (tldraw usa APIs de browser: window, IndexedDB, ResizeObserver).
 */
const TldrawDynamic = dynamic(
  async () => {
    const mod = await import("tldraw");
    // @ts-expect-error — side-effect CSS import (no type declarations)
    await import("tldraw/tldraw.css");
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
 * Canvas tldraw que ocupa 100% del contenedor padre (height debe estar
 * definido por el wrapper — tldraw colapsa si no lo hereda).
 */
export function TldrawCanvas({
  persistenceKey = "bw_open_bui_doc",
  onMount,
}: TldrawCanvasProps) {
  const [errored, setErrored] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Si el chunk falla (network), exponemos retry
  React.useEffect(() => {
    function onError(ev: ErrorEvent) {
      if (ev.message?.toLowerCase().includes("tldraw")) setErrored(true);
    }
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);

  if (errored) {
    return (
      <CanvasError
        onRetry={() => {
          setErrored(false);
          setReloadKey((n) => n + 1);
        }}
      />
    );
  }

  return (
    <div className="h-full w-full">
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
        <div className="text-[11px] uppercase tracking-[0.12em]">Cargando canvas…</div>
      </motion.div>
    </div>
  );
}

function CanvasError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="h-full w-full grid place-items-center bg-card/30 min-h-[480px]">
      <div className="flex flex-col items-center gap-3 text-center max-w-[320px] px-6">
        <AlertCircle className="size-7 text-[hsl(var(--destructive))]" />
        <div className="text-sm font-semibold">No se pudo cargar el canvas</div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Revisa tu conexión y vuelve a intentarlo.
        </p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCw className="size-3.5" /> Reintentar
        </Button>
      </div>
    </div>
  );
}
