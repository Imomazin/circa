import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Compact status token. Low-chroma fills, hairline outlines, micro-caps —
 * used to label status and category, never as decoration. Variant keys are
 * kept stable; `amber`/`warn` now carry copper tones from the palette.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[0.3rem] border px-1.5 py-0.5 text-2xs font-medium leading-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-graphite-100 text-graphite-700 dark:bg-graphite-700 dark:text-graphite-100",
        evergreen:
          "border-transparent bg-evergreen-100 text-evergreen-800 dark:bg-evergreen-800/40 dark:text-evergreen-100",
        amber:
          "border-transparent bg-copper-100 text-copper-700 dark:bg-copper-400/15 dark:text-copper-200",
        copper:
          "border-transparent bg-copper-100 text-copper-700 dark:bg-copper-400/15 dark:text-copper-200",
        outline: "border-border-strong text-muted-foreground",
        strong: "border-transparent bg-evergreen-700 text-white",
        warn: "border-transparent bg-copper-400/90 text-white",
        danger:
          "border-transparent bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
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

export { badgeVariants };
