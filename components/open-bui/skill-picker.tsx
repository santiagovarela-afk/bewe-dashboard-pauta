"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKILLS, type Skill } from "./skills";

interface SkillPickerProps {
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Sidebar izquierdo · grid de 8 skills clickables.
 * El skill activo se marca con check + ring violeta.
 */
export function SkillPicker({ activeId, onSelect }: SkillPickerProps) {
  const activeSkill = SKILLS.find((s) => s.id === activeId);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <div className="size-5 grid place-items-center rounded-md bg-[hsl(var(--brand-violet)/0.15)] border border-[hsl(var(--brand-violet)/0.4)] text-[10px] font-bold font-mono text-[hsl(var(--brand-violet))]">
            1
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
            Elige skill
          </div>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground/70">
          {SKILLS.length} formatos
        </div>
      </div>
      {activeSkill && (
        <div className="rounded-md border border-[hsl(var(--brand-violet)/0.3)] bg-[hsl(var(--brand-violet)/0.06)] px-2 py-1.5 text-[10px]">
          <span className="font-semibold text-foreground">
            {activeSkill.label}
          </span>{" "}
          <span className="font-mono text-muted-foreground/70">
            · {activeSkill.size}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 max-h-[42vh] lg:max-h-[44vh] overflow-y-auto pr-1 -mr-1">
        {SKILLS.map((s, i) => (
          <SkillCard
            key={s.id}
            skill={s}
            active={s.id === activeId}
            onClick={() => onSelect(s.id)}
            delay={i * 0.03}
          />
        ))}
      </div>
    </div>
  );
}

interface SkillCardProps {
  skill: Skill;
  active: boolean;
  onClick: () => void;
  delay: number;
}

function SkillCard({ skill, active, onClick, delay }: SkillCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-lg border p-2.5 transition-all",
        "hover:border-foreground/30 hover:bg-accent/40",
        active
          ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.08)] shadow-[0_0_0_1px_hsl(var(--brand-violet)/0.4)]"
          : "border-border bg-card/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold leading-tight truncate">
            {skill.label}
          </div>
          <div className="mt-0.5 text-[9px] text-muted-foreground/80 font-mono">
            {skill.aspect} · {skill.size}
          </div>
          <div className="mt-1 text-[9px] text-muted-foreground/60 leading-snug">
            {skill.hint}
          </div>
        </div>
        {active && (
          <div className="size-4 rounded-full bg-[hsl(var(--brand-violet))] grid place-items-center shrink-0">
            <Check className="size-2.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <AspectMini aspect={skill.aspect} active={active} />
    </motion.button>
  );
}

function AspectMini({ aspect, active }: { aspect: string; active: boolean }) {
  // Visual mini que representa la proporción del skill.
  const [w, h] = aspect.split(":").map(Number);
  const ratio = w / h;
  const maxSide = 18;
  const width = ratio >= 1 ? maxSide : maxSide * ratio;
  const height = ratio >= 1 ? maxSide / ratio : maxSide;
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <div
        className={cn(
          "rounded-sm border transition-colors",
          active
            ? "border-[hsl(var(--brand-violet))] bg-[hsl(var(--brand-violet)/0.2)]"
            : "border-border bg-secondary/40",
        )}
        style={{ width, height }}
      />
      <span className="text-[8px] text-muted-foreground/60 font-mono uppercase tracking-wider">
        {aspect}
      </span>
    </div>
  );
}
