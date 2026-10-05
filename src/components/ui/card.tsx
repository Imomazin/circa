import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Surface container. Default is a hairline-bordered card; `muted` sits on the
 * app background with no fill for secondary groupings; `flush` removes padding
 * helpers' assumptions for tables. Shadows are deliberately restrained.
 */
export function Card({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "muted" | "raised" }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground",
        variant === "default" && "border-border shadow-card",
        variant === "muted" && "border-border/70 bg-surface/50 shadow-none",
        variant === "raised" && "border-border shadow-raised",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-sm font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs leading-relaxed text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center border-t border-border px-5 py-3.5", className)} {...props} />
  );
}
