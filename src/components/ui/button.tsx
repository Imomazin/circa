import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-evergreen-700 text-white shadow-card hover:bg-evergreen-600",
        secondary:
          "border border-border-strong bg-card text-foreground hover:bg-surface",
        outline: "border border-border-strong bg-transparent text-foreground hover:bg-surface",
        ghost: "text-foreground hover:bg-surface",
        copper: "bg-copper-500 text-white shadow-card hover:bg-copper-400",
        amber: "bg-copper-500 text-white shadow-card hover:bg-copper-400",
        danger: "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        default: "h-9 px-4 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
