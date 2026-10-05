import * as React from "react";
import { cn } from "@/lib/utils";

/** Page header with title, optional eyebrow and description + actions slot. */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-copper-500">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Executive metric: label, large tabular figure, optional sub-figure + trend. */
export function StatTile({
  label,
  value,
  sublabel,
  accent,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  accent?: "evergreen" | "copper" | "amber" | "neutral";
  delta?: { value: string; direction: "up" | "down" | "flat" };
}) {
  const accentText =
    accent === "evergreen"
      ? "text-evergreen-700 dark:text-evergreen-300"
      : accent === "copper" || accent === "amber"
        ? "text-copper-600 dark:text-copper-300"
        : "text-foreground";
  const deltaColor =
    delta?.direction === "up"
      ? "text-evergreen-600"
      : delta?.direction === "down"
        ? "text-red-600"
        : "text-muted-foreground";
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 shadow-card">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className={cn("font-display text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums", accentText)}>
          {value}
        </p>
        {delta && (
          <span className={cn("mb-0.5 text-xs font-medium tabular-nums", deltaColor)}>
            {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—"} {delta.value}
          </span>
        )}
      </div>
      {sublabel && <p className="mt-1.5 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-[0.9375rem] font-semibold tracking-tight text-foreground">
        {children}
      </h2>
      {action ?? (hint && <span className="text-2xs text-muted-foreground">{hint}</span>)}
    </div>
  );
}

/** Quiet, unobtrusive demonstrator disclosure — a footnote, not a warning. */
export function DisclaimerBanner({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "border-t border-border pt-3 text-2xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      Illustrative dataset for the CivTech 12.3 demonstrator. Scores and recommendations are
      decision-support outputs for evaluation, and imply no Zero Waste Scotland or CivTech endorsement.
    </p>
  );
}

/** Definition list row for detail views. */
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-border py-2.5 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-relaxed text-foreground">{children}</dd>
    </div>
  );
}

/** Label / value pair for compact intelligence read-outs. */
export function KeyValue({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", mono && "tabular-nums")}>{value}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface/40 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-stone-500">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Skeleton shimmer block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} aria-hidden />;
}
