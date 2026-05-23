"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/selectors";

const SEV_LABEL: Record<Severity, string> = {
  critical: "Crítico",
  warn: "Atención",
  anomaly: "Anomalía",
  ok: "OK",
};

const SEV_COLOR: Record<Severity, string> = {
  critical: "var(--destructive)",
  warn: "var(--warning)",
  anomaly: "var(--brand-ember)",
  ok: "var(--success)",
};

export function SeverityDot({
  severity,
  className,
  pulse = false,
}: {
  severity: Severity;
  className?: string;
  pulse?: boolean;
}) {
  const c = SEV_COLOR[severity];
  return (
    <span
      aria-label={SEV_LABEL[severity]}
      className={cn(
        "inline-block size-2 rounded-full shrink-0",
        pulse && severity !== "ok" && "animate-pulse-glow",
        className,
      )}
      style={{
        background: `hsl(${c})`,
        boxShadow: `0 0 8px hsl(${c} / 0.55)`,
      }}
    />
  );
}

export function HealthPill({
  severity,
  text,
  compact = false,
  className,
}: {
  severity: Severity;
  text?: string;
  compact?: boolean;
  className?: string;
}) {
  const c = SEV_COLOR[severity];
  const label = text ?? SEV_LABEL[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium tabular",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        className,
      )}
      style={{
        background: `hsl(${c} / 0.12)`,
        borderColor: `hsl(${c} / 0.42)`,
        color: `hsl(${c})`,
      }}
    >
      <SeverityDot severity={severity} pulse={severity === "critical"} />
      {label}
    </span>
  );
}
