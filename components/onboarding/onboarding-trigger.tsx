"use client";
/**
 * Onboarding Trigger · cliente, montar UNA vez dentro del shell (después de
 * que el user está logueado). Decide cuándo mostrar el WelcomeTour:
 *
 *  - Primer login (no existe `localStorage.bw_welcome_seen`) → abrir.
 *  - Custom event `bw:show-welcome` → abrir manualmente (re-disparado desde
 *    Config con `triggerWelcomeAgain()`).
 *
 * NOTA: este componente debe ir DENTRO de <AppShell> después de que `user`
 * está cargado, para que `useDashboard()` resuelva al user real.
 */
import * as React from "react";
import { useDashboard } from "@/lib/store";
import { WelcomeTour } from "./welcome-tour";

const STORAGE_KEY = "bw_welcome_seen";

export function OnboardingTrigger() {
  const { user } = useDashboard();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    // Pequeño delay para que el shell termine de animar entrada
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      try {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) setOpen(true);
      } catch {
        /* private mode → no abrir */
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [user]);

  React.useEffect(() => {
    function onShow() {
      setOpen(true);
    }
    window.addEventListener("bw:show-welcome", onShow);
    return () => window.removeEventListener("bw:show-welcome", onShow);
  }, []);

  if (!user) return null;
  return <WelcomeTour open={open} onClose={() => setOpen(false)} />;
}
