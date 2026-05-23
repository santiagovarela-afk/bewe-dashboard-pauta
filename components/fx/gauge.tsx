"use client";
import * as React from "react";
import { motion, useSpring, useTransform, useInView } from "motion/react";
import { cn } from "@/lib/utils";

interface GaugeProps {
  /** 0..100 */
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  sub?: string;
  tone?: "violet" | "lime" | "ember" | "cyan" | "auto";
  className?: string;
}

const TONE_MAP = {
  violet: "var(--brand-violet)",
  lime: "var(--brand-lime)",
  ember: "var(--brand-ember)",
  cyan: "var(--brand-cyan)",
};

export function Gauge({
  value,
  size = 160,
  thickness = 10,
  label,
  sub,
  tone = "violet",
  className,
}: GaugeProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const clamped = Math.max(0, Math.min(100, value));

  const colorHsl =
    tone === "auto"
      ? clamped <= 33
        ? TONE_MAP.lime
        : clamped <= 66
          ? TONE_MAP.cyan
          : clamped <= 85
            ? TONE_MAP.ember
            : "var(--destructive)"
      : TONE_MAP[tone];

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 0.75); // 270° arc

  const spring = useSpring(0, { stiffness: 50, damping: 16, mass: 0.7 });
  React.useEffect(() => {
    if (inView) spring.set(clamped);
  }, [clamped, inView, spring]);

  const offset = useTransform(spring, (v) => arcLength - (arcLength * v) / 100);

  return (
    <div ref={ref} className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`hsl(${colorHsl})`}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          style={{ strokeDashoffset: offset, filter: `drop-shadow(0 0 12px hsl(${colorHsl} / 0.5))` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="font-mono text-3xl font-bold tabular"
          style={{ color: `hsl(${colorHsl})` }}
        >
          <GaugeNumber spring={spring} />
        </motion.div>
        {label && (
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
            {label}
          </div>
        )}
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function GaugeNumber({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spring,
}: { spring: any }) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => spring.on("change", (val: number) => setV(val)), [spring]);
  return <>{Math.round(v)}%</>;
}
