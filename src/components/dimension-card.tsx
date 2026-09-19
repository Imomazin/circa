import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreMeter, BandBadge, ConfidenceBadge, scoreColor } from "@/components/score";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type { DimensionScore } from "@/domain/scoring/types";

/** Full explanation card for one score dimension — components, drivers and gaps. */
export function DimensionCard({ dim, compact = false }: { dim: DimensionScore; compact?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{dim.label}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <BandBadge band={dim.band} />
              <ConfidenceBadge level={dim.confidence} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold tabular-nums leading-none" style={{ color: scoreColor(dim.score) }}>
              {dim.score.toFixed(1)}
            </div>
            <div className="text-2xs text-muted-foreground">/ 100</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {dim.components.map((c) => (
            <ScoreMeter key={c.key} value={c.value} label={`${c.label} · w${Math.round(c.weight * 100)}%`} />
          ))}
        </div>

        {!compact && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {dim.positiveDrivers.length > 0 && (
              <DriverList title="Positive drivers" icon="up" items={dim.positiveDrivers} />
            )}
            {dim.negativeDrivers.length > 0 && (
              <DriverList title="Negative drivers" icon="down" items={dim.negativeDrivers} />
            )}
          </div>
        )}

        {!compact && dim.missingEvidence.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/30 dark:bg-amber-400/10">
            <p className="mb-1 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-200">
              <AlertCircle className="h-3.5 w-3.5" /> Missing evidence
            </p>
            <ul className="list-inside list-disc text-xs text-amber-800 dark:text-amber-100">
              {dim.missingEvidence.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {!compact && dim.recommendations.length > 0 && (
          <div>
            <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended actions
            </p>
            <ul className="flex flex-col gap-1">
              {dim.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-evergreen-600" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DriverList({ title, icon, items }: { title: string; icon: "up" | "down"; items: string[] }) {
  const Icon = icon === "up" ? TrendingUp : TrendingDown;
  const color = icon === "up" ? "text-evergreen-600" : "text-red-500";
  return (
    <div>
      <p className={`mb-1 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider ${color}`}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-foreground">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Compact five-dimension score strip. */
export function ScoreStrip({
  scores,
}: {
  scores: { label: string; value: number; href?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {scores.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-card p-3">
          <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: scoreColor(s.value) }}>
            {s.value.toFixed(1)}
          </p>
          <div className="mt-1.5">
            <ScoreMeter value={s.value} showValue={false} />
          </div>
        </div>
      ))}
    </div>
  );
}
