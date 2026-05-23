"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
