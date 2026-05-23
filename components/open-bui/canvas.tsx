"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { OpenBuiFallback } from "./fallback";

/**
 * Carga `tldraw` SI está instalado.
 *
 * Truco para evitar que webpack falle si el paquete no existe todavía:
 * usamos `Function("...")` para construir la expresión `import("tldraw")`
 * en tiempo de ejecución — webpack no puede analizar el string estático
 * y por lo tanto NO intenta resolver el paquete en build time. Si en
 * runtime el módulo no existe, el promise rechaza y mostramos el fallback.
 *
 * Cuando el usuario haga `npm install tldraw`, este código encontrará
 * el módulo y montará el editor real.
 */
const TldrawCanvas = dynamic(
  async () => {
    try {
      // String-based dynamic import: invisible para el analizador estático.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-new-func
      const loader = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = (await loader("tldraw")) as any;

      // Intentar cargar los estilos también (no rompe si falla)
      try {
        await loader("tldraw/tldraw.css");
      } catch {
        /* css opcional */
      }

      const Tldraw = mod?.Tldraw ?? mod?.default?.Tldraw ?? mod?.default;
      if (!Tldraw) {
        const Missing: React.FC<{ persistenceKey: string }> = () => <OpenBuiFallback />;
        Missing.displayName = "TldrawCanvasMissing";
        return { default: Missing };
      }

      const Wrapped: React.FC<{ persistenceKey: string }> = ({ persistenceKey }) => (
        <div className="h-full w-full">
          <Tldraw persistenceKey={persistenceKey} />
        </div>
      );
      Wrapped.displayName = "TldrawCanvasReal";
      return { default: Wrapped };
    } catch {
      const Missing: React.FC<{ persistenceKey: string }> = () => <OpenBuiFallback />;
      Missing.displayName = "TldrawCanvasMissing";
      return { default: Missing };
    }
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full grid place-items-center rounded-2xl border border-border bg-card/30 backdrop-blur-sm min-h-[480px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin text-[hsl(var(--brand-violet))]" />
          <div className="text-[11px] uppercase tracking-[0.12em]">Cargando canvas…</div>
        </motion.div>
      </div>
    ),
  },
);

export { TldrawCanvas };
