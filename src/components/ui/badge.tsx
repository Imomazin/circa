import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-100",
        evergreen: "border-transparent bg-evergreen-100 text-evergreen-800 dark:bg-evergreen-800/40 dark:text-evergreen-100",
        amber: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200",
        outline: "border-border text-muted-foreground",
        strong: "border-transparent bg-evergreen-600 text-white",
        warn: "border-transparent bg-amber-400 text-charcoal-900",
        danger: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
