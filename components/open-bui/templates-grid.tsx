"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Sparkles, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OPEN_DESIGN_TEMPLATES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type OpenDesignCategory,
  type OpenDesignTemplate,
} from "@/lib/open-design-templates";

interface TemplatesGridProps {
  onPick: (tpl: OpenDesignTemplate) => void;
}

/**
 * Grid de templates pre-armados estilo Canva. Click → carga skill + brief + persona.
 * Filtro por categoría con pill bar arriba.
 */
export function TemplatesGrid({ onPick }: TemplatesGridProps) {
  const [cat, setCat] = React.useState<OpenDesignCategory | "all">("all");
  const items = React.useMemo(
    () =>
      cat === "all"
        ? OPEN_DESIGN_TEMPLATES
        : OPEN_DESIGN_TEMPLATES.filter((t) => t.category === cat),
    [cat],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur"
    >
      <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-bold">
            <LayoutTemplate className="size-3.5 text-[hsl(var(--brand-violet))]" />
            Plantillas
          </div>
          <div className="text-[18px] font-display font-extrabold mt-1 leading-tight">
            Empezá con una plantilla
          </div>
          <div className="text-[12px] text-muted-foreground/80">
            Carga skill + brief sugerido · luego personalizá
          </div>
        </div>

        <CategoryPills active={cat} onChange={setCat} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((tpl, i) => (
          <TemplateCard
            key={tpl.id}
            tpl={tpl}
            onClick={() => onPick(tpl)}
            delay={i * 0.04}
          />
        ))}
      </div>
    </motion.section>
  );
}

function CategoryPills({
  active,
  onChange,
}: {
  active: OpenDesignCategory | "all";
  onChange: (c: OpenDesignCategory | "all") => void;
}) {
  const all: Array<{ id: OpenDesignCategory | "all"; label: string }> = [
    { id: "all", label: "Todas" },
    ...CATEGORY_ORDER.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
  ];
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-full border border-border/60 bg-card/60">
      {all.map((p) => {
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={cn(
              "relative px-3 py-1 rounded-full text-[11px] font-semibold transition-colors",
              isActive
                ? "text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="cat-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, hsl(var(--brand-violet)), hsl(var(--brand-cyan)))",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TemplateCard({
  tpl,
  onClick,
  delay,
}: {
  tpl: OpenDesignTemplate;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative rounded-xl border border-border bg-card overflow-hidden text-left transition-all",
        "hover:border-[hsl(var(--brand-violet))] hover:shadow-[0_12px_30px_-12px_hsl(var(--brand-violet)/0.35)]",
      )}
    >
      <div
        className="aspect-square w-full"
        dangerouslySetInnerHTML={{ __html: tpl.thumb() }}
      />
      <div className="px-2.5 py-2 space-y-0.5 border-t border-border/60 bg-card/80">
        <div className="text-[11px] font-bold leading-tight truncate">
          {tpl.title}
        </div>
        <div className="text-[9.5px] text-muted-foreground leading-snug line-clamp-2">
          {tpl.description}
        </div>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-card/95 border border-border text-[9px] font-bold text-[hsl(var(--brand-violet))]">
          <Sparkles className="size-2.5" /> Usar
        </div>
      </div>
    </motion.button>
  );
}
