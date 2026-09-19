import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { bandForScore, type ScoreBand, type ConfidenceLevel } from "@/domain/constants";

/** Map a band to a badge variant. */
export function bandVariant(band: ScoreBand): React.ComponentProps<typeof Badge>["variant"] {
  switch (band) {
    case "Compelling":
      return "strong";
    case "Strong":
      return "evergreen";
    case "Developing":
      return "amber";
    case "Emerging":
      return "warn";
    default:
      return "danger";
  }
}

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const band = bandForScore(score);
  return (
    <Badge variant={bandVariant(band)} className={className}>
      {score.toFixed(1)} · {band}
    </Badge>
  );
}

export function BandBadge({ band }: { band: ScoreBand }) {
  return <Badge variant={bandVariant(band)}>{band}</Badge>;
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const variant = level === "High" ? "evergreen" : level === "Moderate" ? "amber" : "danger";
  return <Badge variant={variant}>{level} confidence</Badge>;
}

/** Colour for a score value, used by meters and rings. */
export function scoreColor(score: number): string {
  if (score >= 65) return "#1a594a"; // evergreen
  if (score >= 50) return "#3f8d78";
  if (score >= 35) return "#c98a2b"; // amber
  return "#b4472f"; // muted red
}

/** Horizontal meter for a 0-100 score. */
export function ScoreMeter({
  value,
  label,
  showValue = true,
  className,
}: {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-2xs text-muted-foreground">
          <span>{label}</span>
          {showValue && <span className="font-medium text-foreground">{value.toFixed(1)}</span>}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-charcoal-100 dark:bg-charcoal-700"
        role="meter"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "score"}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: scoreColor(value) }}
        />
      </div>
    </div>
  );
}
