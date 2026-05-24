"use client";
import * as React from "react";
import { AlertCircle } from "lucide-react";

/**
 * Fallback minimal · NO se usa en el flujo normal (tldraw está instalado).
 * Queda como red de seguridad para escenarios futuros donde la carga del
 * editor falle de forma irrecuperable.
 */
export function OpenBuiFallback() {
  return (
    <div className="h-full w-full grid place-items-center min-h-[480px] bg-card/30">
      <div className="flex flex-col items-center gap-2 text-center max-w-[300px] px-6">
        <AlertCircle className="size-6 text-muted-foreground" />
        <div className="text-sm font-semibold">Canvas no disponible</div>
        <p className="text-[11px] text-muted-foreground">
          Recarga la página para volver a intentar.
        </p>
      </div>
    </div>
  );
}
