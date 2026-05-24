"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useDashboard } from "@/lib/store";

// Tipado mínimo para View Transitions API (TS no la incluye aún en lib.dom 2026)
type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useDashboard();
  const isDark = theme === "dark";

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const doc = document as DocumentWithVT;
    // Fallback en navegadores sin View Transitions o con prefers-reduced-motion
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) {
      toggleTheme();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy),
    );
    document.documentElement.style.setProperty("--vt-cx", `${cx}px`);
    document.documentElement.style.setProperty("--vt-cy", `${cy}px`);
    document.documentElement.style.setProperty("--vt-r", `${endRadius}px`);
    doc.startViewTransition(() => toggleTheme());
  }

  return (
    <button
      onClick={handleClick}
      title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
      aria-label="Toggle theme"
      className="relative inline-flex h-8 items-center justify-center rounded-full border border-border bg-card/40 px-2 transition-colors hover:border-foreground/30"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="text-[hsl(var(--brand-violet))]"
          >
            <Moon className="size-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="text-[hsl(var(--brand-ember))]"
          >
            <Sun className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
