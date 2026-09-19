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
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-2xs font-semibold uppercase tracking-widest text-amber-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Compact executive stat tile. */
export function StatTile({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  accent?: "evergreen" | "amber" | "neutral";
}) {
  const bar =
    accent === "evergreen"
      ? "bg-evergreen-600"
      : accent === "amber"
        ? "bg-amber-400"
        : "bg-charcoal-300 dark:bg-charcoal-600";
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4">
      <div className={cn("absolute left-0 top-0 h-full w-1", bar)} />
      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{children}</h2>
      {hint && <span className="text-2xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** Prototype / synthetic-data disclaimer banner. */
export function DisclaimerBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-2xs text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
        className,
      )}
    >
      <strong className="font-semibold">Product demonstrator.</strong> All data is synthetic. Scores
      and recommendations are prototype decision-support outputs, not validated measures, and imply no
      Zero Waste Scotland or CivTech endorsement.
    </div>
  );
}

/** Definition list row for detail views. */
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-border py-2.5 last:border-0 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** "Future capability" chip for controls not yet wired up. */
export function FutureChip({ label = "Future capability" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded border border-dashed border-warmgrey-400 px-1.5 py-0.5 text-2xs text-muted-foreground">
      {label}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
