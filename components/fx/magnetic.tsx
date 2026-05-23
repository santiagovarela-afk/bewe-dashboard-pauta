"use client";
import * as React from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface MagneticProps extends React.HTMLAttributes<HTMLDivElement> {
  strength?: number;
}

/** Subtle magnetic-pull hover for buttons / nav items. */
export function Magnetic({
  strength = 0.35,
  children,
  ...props
}: MagneticProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 18, mass: 0.4 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - (rect.left + rect.width / 2);
    const py = e.clientY - (rect.top + rect.height / 2);
    x.set(px * strength);
    y.set(py * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }
  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      {...(props as object)}
    >
      {children}
    </motion.div>
  );
}
