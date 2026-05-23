import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, sub, right, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between mb-4 gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {sub && <div className="mt-1 text-xs text-muted-foreground/70">{sub}</div>}
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  );
}
