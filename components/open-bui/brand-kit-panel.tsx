"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Palette } from "lucide-react";
import { BRAND } from "./skills";

/**
 * Brand Kit Bewe · visible para el usuario.
 * Da confianza de que el AI generator va a respetar la identidad.
 * Se renderiza en el sidebar bajo el SkillPicker.
 */
export function BrandKitPanel() {
  const swatches: Array<{ name: string; hex: string; key: keyof typeof BRAND.colors }> = [
    { name: "Primary", hex: BRAND.colors.primary, key: "primary" },
    { name: "Secondary", hex: BRAND.colors.secondary, key: "secondary" },
    { name: "Accent IA", hex: BRAND.colors.accentAi, key: "accentAi" },
    { name: "Ink Deep", hex: BRAND.colors.inkDeep, key: "inkDeep" },
    { name: "Surface Aqua", hex: BRAND.colors.surfaceAqua, key: "surfaceAqua" },
    { name: "Surface Cream", hex: BRAND.colors.surfaceCream, key: "surfaceCream" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="mt-3 rounded-lg border border-border bg-card/40 p-2.5 space-y-2.5"
    >
      <div className="flex items-center gap-1.5">
        <Palette className="size-3 text-[hsl(var(--brand-violet))]" />
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Brand Kit Bewe
        </div>
      </div>

      <ul className="space-y-1">
        {swatches.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[10px]">
            <span
              className="inline-block size-3 rounded-sm border border-border shrink-0"
              style={{ background: s.hex }}
              aria-label={s.name}
            />
            <span className="text-foreground/80 font-medium w-[58px]">{s.name}</span>
            <span className="font-mono text-muted-foreground/70">{s.hex}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-border/60 pt-2 space-y-0.5">
        <div className="text-[10px] flex items-center gap-1.5">
          <span className="font-display text-foreground text-sm leading-none font-extrabold">Aa</span>
          <span className="text-muted-foreground/80">Inter ExtraBold</span>
        </div>
        <div className="text-[10px] flex items-center gap-1.5">
          <span className="font-serif text-foreground text-sm leading-none italic">IA</span>
          <span className="text-muted-foreground/80">Merriweather italic · solo IA/Linda</span>
        </div>
      </div>

      <div className="border-t border-border/60 pt-2">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-1">
          Tagline
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug italic">
          &ldquo;{BRAND.tagline}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}
