import * as React from "react";
import { cn } from "@/lib/utils";
import type { MatchConstraint, PipelineStage } from "@/domain/network/types";

/** Phase grouping drives the stage colour so the pipeline reads at a glance. */
const STAGE_PHASE: Record<PipelineStage, "early" | "mid" | "late" | "done"> = {
  Identified: "early",
  Matched: "early",
  Validated: "mid",
  Engagement: "mid",
  Feasibility: "mid",
  Pilot: "late",
  "Commercial agreement": "late",
  Implementation: "late",
  Realised: "done",
};

export function StageTag({ stage, className }: { stage: PipelineStage; className?: string }) {
  const phase = STAGE_PHASE[stage];
  const styles = {
    early: "border-border-strong text-muted-foreground",
    mid: "border-transparent bg-evergreen-100 text-evergreen-800 dark:bg-evergreen-800/40 dark:text-evergreen-100",
    late: "border-transparent bg-evergreen-700 text-white",
    done: "border-transparent bg-copper-500 text-white",
  }[phase];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[0.3rem] border px-1.5 py-0.5 text-2xs font-medium",
        styles,
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          phase === "early" && "bg-stone-400",
          phase === "mid" && "bg-evergreen-500",
          phase === "late" && "bg-white/80",
          phase === "done" && "bg-white/90",
        )}
      />
      {stage}
    </span>
  );
}

export function StrengthBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 68 ? "#185847" : value >= 55 ? "#3b8f76" : value >= 45 ? "#b87333" : "#b4472f";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export function FamilyDot({
  color,
  label,
  className,
}: {
  color: string;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
      {label && <span className="text-xs text-foreground">{label}</span>}
    </span>
  );
}

export function GradeChip({ grade }: { grade?: string }) {
  if (!grade) return null;
  const tone =
    grade === "A"
      ? "bg-evergreen-100 text-evergreen-800 dark:bg-evergreen-800/40 dark:text-evergreen-100"
      : grade === "B"
        ? "bg-surface-2 text-foreground"
        : "bg-copper-100 text-copper-700 dark:bg-copper-400/15 dark:text-copper-200";
  return (
    <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-2xs font-semibold", tone)}>
      {grade}
    </span>
  );
}

export function ConstraintList({ constraints }: { constraints: MatchConstraint[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {constraints.map((c, i) => (
        <li key={i} className="flex items-start gap-2 text-xs leading-snug">
          <span
            className={cn(
              "mt-[0.3rem] h-1.5 w-1.5 shrink-0 rounded-full",
              c.severity === "blocker" && "bg-red-500",
              c.severity === "caution" && "bg-copper-400",
              c.severity === "info" && "bg-stone-400",
            )}
          />
          <span className="text-muted-foreground">{c.label}</span>
        </li>
      ))}
    </ul>
  );
}
