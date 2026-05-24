"use client";
import * as React from "react";
import { motion, type Variants } from "motion/react";

/**
 * Reveal · masked editorial reveal
 *
 * Antes: fade + blur + y-translate (genérico).
 * Ahora: la región se "descubre" como cortina de izquierda a derecha
 * (clip-path inset desde 100% a 0%) + una sutil sombra ascendente.
 * Más editorial, más distintivo, sigue siendo respetuoso con motion-reduce.
 */
const maskedRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    clipPath: "inset(0 100% 0 0)",
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = motion[as as "div"] as any;
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ delay }}
      variants={maskedRevealVariants}
    >
      {children}
    </Component>
  );
}

export function StaggerGroup({
  children,
  delayChildren = 0,
  stagger = 0.08,
  className,
}: {
  children: React.ReactNode;
  delayChildren?: number;
  stagger?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren, staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={maskedRevealVariants}>
      {children}
    </motion.div>
  );
}
