"use client";
import * as React from "react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Sparkline } from "@/components/fx/sparkline";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  success: { num: "text-[hsl(var(--success))]", chip: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]", spotlight: "var(--success)" },
  warning: { num: "text-[hsl(var(--warning))]", chip: "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]", spotlight: "var(--warning)" },
  danger:  { num: "text-[hsl(var(--destructive))]", chip: "bg-[hsl(var(--destructive)/0.14)] text-[hsl(var(--destructive))]", spotlight: "var(--destructive)" },
  info:    { num: "text-[hsl(var(--info))]", chip: "bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))]", spotlight: "var(--info)" },
  default: { num: "text-foreground", chip: "bg-secondary text-muted-foreground", spotlight: "var(--brand-violet)" },
  violet:  { num: "text-[hsl(var(--brand-violet))]", chip: "bg-[hsl(var(--brand-violet)/0.14)] text-[hsl(var(--brand-violet))]", spotlight: "var(--brand-violet)" },
  lime:    { num: "text-[hsl(var(--brand-lime))]", chip: "bg-[hsl(var(--brand-lime)/0.14)] text-[hsl(var(--brand-lime))]", spotlight: "var(--brand-lime)" },
  ember:   { num: "text-[hsl(var(--brand-ember))]", chip: "bg-[hsl(var(--brand-ember)/0.14)] text-[hsl(var(--brand-ember))]", spotlight: "var(--brand-ember)" },
  cyan:    { num: "text-[hsl(var(--brand-cyan))]", chip: "bg-[hsl(var(--brand-cyan)/0.12)] text-[hsl(var(--brand-cyan))]", spotlight: "var(--brand-cyan)" },
};

export interface KpiCardProps {
  label: string;
  value: number;
  format?: (v: number) => string;
  sub?: React.ReactNode;
  tone?: keyof typeof TONE_CLASSES;
  trend?: number[];
  badge?: React.ReactNode;
  className?: string;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  format,
  sub,
  tone = "default",
  trend,
  badge,
  className,
  delay = 0,
}: KpiCardProps) {
  const t = TONE_CLASSES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <SpotlightCard
        className={cn("p-4", className)}
        spotlightColor={t.spotlight}
        intensity={0.28}
      >
        <div className="flex items-start justify-between mb-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </div>
          {badge}
        </div>
        <div className={cn("font-mono font-bold text-[26px] leading-none tabular", t.num)}>
          <AnimatedNumber value={value} format={format} duration={1.6} />
        </div>
        <div className="mt-2 flex items-end justify-between gap-2 min-h-[28px]">
          <div className="text-[11px] text-muted-foreground leading-snug">{sub}</div>
          {trend && trend.length > 1 && (
            <Sparkline
              data={trend}
              color={`hsl(${t.spotlight})`}
              height={28}
              className="opacity-80"
            />
          )}
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
