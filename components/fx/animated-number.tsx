"use client";
import * as React from "react";
import { useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { motion } from "motion/react";

export interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Animation only triggers when in view (default true) */
  triggerOnView?: boolean;
}

export function AnimatedNumber({
  value,
  format,
  duration = 1.6,
  decimals = 0,
  className,
  prefix = "",
  suffix = "",
  triggerOnView = true,
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  const mv = useMotionValue(0);
  const spring = useSpring(mv, {
    duration: duration * 1000,
    stiffness: 60,
    damping: 18,
    mass: 1,
  });
  const display = useTransform(spring, (latest) => {
    const n = Number.isFinite(latest) ? latest : 0;
    if (format) return format(n);
    return `${prefix}${n.toFixed(decimals)}${suffix}`;
  });

  React.useEffect(() => {
    if (!triggerOnView || inView) mv.set(value);
  }, [value, inView, triggerOnView, mv]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
