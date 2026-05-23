import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground border-border",
        success:
          "border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
        warning:
          "border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
        danger:
          "border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.14)] text-[hsl(var(--destructive))]",
        info:
          "border-[hsl(var(--info)/0.4)] bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))]",
        violet:
          "border-[hsl(var(--brand-violet)/0.4)] bg-[hsl(var(--brand-violet)/0.16)] text-[hsl(var(--brand-violet))]",
        lime:
          "border-[hsl(var(--brand-lime)/0.4)] bg-[hsl(var(--brand-lime)/0.14)] text-[hsl(var(--brand-lime))]",
        ember:
          "border-[hsl(var(--brand-ember)/0.4)] bg-[hsl(var(--brand-ember)/0.14)] text-[hsl(var(--brand-ember))]",
        cyan:
          "border-[hsl(var(--brand-cyan)/0.4)] bg-[hsl(var(--brand-cyan)/0.12)] text-[hsl(var(--brand-cyan))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
