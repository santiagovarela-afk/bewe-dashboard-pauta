import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-display font-bold tracking-[-0.02em]", {
  variants: {
    size: {
      xs: "text-sm",
      sm: "text-base",
      md: "text-2xl md:text-3xl",
      lg: "text-3xl md:text-5xl",
      xl: "text-5xl md:text-7xl leading-[0.95]",
      xxl: "text-6xl md:text-8xl leading-[0.92]",
    },
    variant: {
      aurora: "text-aurora",
      pixel:
        "bg-gradient-to-br from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent",
      ember:
        "bg-gradient-to-br from-[hsl(var(--brand-ember))] via-[hsl(var(--warning))] to-[hsl(var(--destructive))] bg-clip-text text-transparent",
      violet:
        "bg-gradient-to-br from-[hsl(var(--brand-violet))] to-[hsl(var(--brand-cyan))] bg-clip-text text-transparent",
      mono: "text-foreground",
    },
  },
  defaultVariants: { size: "lg", variant: "pixel" },
});

export interface GradientHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4";
}

export function GradientHeading({
  as = "h2",
  size,
  variant,
  className,
  children,
  ...props
}: GradientHeadingProps) {
  const Comp = as;
  return (
    <Comp className={cn(headingVariants({ size, variant }), className)} {...props}>
      {children}
    </Comp>
  );
}
