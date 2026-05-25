"use client";
import * as React from "react";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { TABS } from "@/lib/config";
import { useDashboard } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ConnectorPill } from "./connector-pill";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { RestartTourButton } from "@/components/shared/restart-tour-button";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { tab, snapshot, refresh, loading, error } = useDashboard();
  const pageTitle = TABS.find((t) => t.id === tab)?.label ?? "Dashboard";

  return (
    <header data-tour="topbar" className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="h-full flex items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] text-muted-foreground">Bewe</span>
          <span className="text-muted-foreground/50 text-[12px]">/</span>
          <motion.span
            key={tab}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="text-[13px] font-semibold tracking-tight"
          >
            {pageTitle}
          </motion.span>
        </div>

        <div className="flex items-center gap-2">
          <ConnectorPill />
          <DateRangePicker />
          <ThemeToggle />
          <RestartTourButton />

          <div
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] px-3 h-8 rounded-full border whitespace-nowrap",
              snapshot.isLive
                ? "border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))]"
                : "border-border bg-secondary/60 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                snapshot.isLive
                  ? "bg-[hsl(var(--success))] animate-pulse-glow"
                  : "bg-muted-foreground",
              )}
            />
            <span className="font-mono">{snapshot.label}</span>
          </div>

          <Button
            data-tour="refresh"
            variant={loading ? "ghost" : "outline"}
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            {loading ? "Cargando…" : "Actualizar"}
          </Button>
        </div>
      </div>
      {error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-6 py-1.5 bg-[hsl(var(--destructive)/0.1)] border-t border-[hsl(var(--destructive)/0.3)] text-[11px] text-[hsl(var(--destructive))] font-mono"
        >
          ⚠ {error}
        </motion.div>
      )}
    </header>
  );
}
