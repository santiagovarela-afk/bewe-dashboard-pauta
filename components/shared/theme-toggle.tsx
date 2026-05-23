"use client";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useDashboard } from "@/lib/store";

export function ThemeToggle() {
  const { theme, toggleTheme } = useDashboard();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
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
