"use client";

import * as React from "react";
import Link from "next/link";
import { X, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SelectField } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScoreMeter, ScoreBadge, scoreColor } from "@/components/score";
import { MultiRadar, CATEGORICAL } from "@/components/charts";
import { formatGBPCompact } from "@/lib/format";
import type { DashboardRow } from "@/lib/view-types";

const AXES = ["Viability", "Resilience", "Investor", "Opportunity", "Evidence"];
const DIM_KEYS = ["viability", "resilience", "investor", "opportunity", "evidence"] as const;

function rowValues(r: DashboardRow): number[] {
  return DIM_KEYS.map((k) => r[k] as number);
}

/**
 * Side-by-side comparison of up to three businesses: a radar overlay of the
 * five dimensions plus a figures table. Nothing is recomputed client-side — the
 * rows carry the engine's scores straight from the server.
 */
export function CompareBoard({ rows }: { rows: DashboardRow[] }) {
  const options = React.useMemo(
    () => rows.map((r) => ({ value: r.id, label: r.name })),
    [rows],
  );
  const [selected, setSelected] = React.useState<string[]>(() =>
    rows.slice(0, Math.min(2, rows.length)).map((r) => r.id),
  );

  const chosen = selected
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is DashboardRow => Boolean(r));

  function setSlot(index: number, id: string) {
    setSelected((prev) => {
      const next = [...prev];
      if (id === "") next.splice(index, 1);
      else next[index] = id;
      return next.filter((v, i, a) => v && a.indexOf(v) === i);
    });
  }

  function addSlot() {
    const unused = rows.find((r) => !selected.includes(r.id));
    if (unused) setSelected((prev) => [...prev, unused.id]);
  }

  const radarSeries = chosen.map((r) => ({ name: r.name, values: rowValues(r) }));

  const figureRows: { label: string; fmt: (r: DashboardRow) => React.ReactNode }[] = [
    { label: "Headline", fmt: (r) => <ScoreBadge score={r.headline} /> },
    { label: "Sector", fmt: (r) => <span className="text-muted-foreground">{r.sector}</span> },
    { label: "Stage", fmt: (r) => <span className="text-muted-foreground">{r.stage}</span> },
    { label: "Capital requirement", fmt: (r) => <span className="tabular-nums">{formatGBPCompact(r.capex)}</span> },
    {
      label: "Projected annual opportunity",
      fmt: (r) => <span className="tabular-nums">{formatGBPCompact(r.projectedOpportunity)}</span>,
    },
    { label: "Confidence", fmt: (r) => <span className="text-muted-foreground">{r.confidence}</span> },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Selectors */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          {selected.map((id, i) => (
            <div key={i} className="flex items-end gap-1">
              <div className="w-56">
                <SelectField
                  label={`Business ${i + 1}`}
                  value={id}
                  onChange={(e) => setSlot(i, e.target.value)}
                  options={options}
                />
              </div>
              {selected.length > 1 && (
                <button
                  onClick={() => setSlot(i, "")}
                  className="mb-1 rounded-md border border-border p-1.5 text-muted-foreground hover:text-red-600"
                  aria-label={`Remove business ${i + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {selected.length < 3 && selected.length < rows.length && (
            <button
              onClick={addSlot}
              className="mb-1 h-9 rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground hover:border-evergreen-500 hover:text-evergreen-600"
            >
              + Add business
            </button>
          )}
        </CardContent>
      </Card>

      {chosen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Select at least one business to compare.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
          {/* Radar overlay */}
          <Card>
            <CardHeader>
              <CardTitle>Dimension profile</CardTitle>
              <CardDescription>The five commercial dimensions, 0–100</CardDescription>
            </CardHeader>
            <CardContent>
              <MultiRadar axes={AXES} series={radarSeries} />
            </CardContent>
          </Card>

          {/* Per-dimension meters */}
          <Card>
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
              <CardDescription>Side-by-side across each dimension</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {AXES.map((axis, di) => (
                <div key={axis}>
                  <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">{axis}</p>
                  <div className="flex flex-col gap-2">
                    {chosen.map((r, ci) => {
                      const v = rowValues(r)[di];
                      return (
                        <div key={r.id} className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-sm"
                            style={{ background: CATEGORICAL[ci % CATEGORICAL.length] }}
                          />
                          <span className="w-28 shrink-0 truncate text-2xs text-foreground" title={r.name}>
                            {r.name}
                          </span>
                          <div className="flex-1">
                            <ScoreMeter value={v} showValue={false} />
                          </div>
                          <span
                            className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums"
                            style={{ color: scoreColor(v) }}
                          >
                            {v.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Figures table */}
      {chosen.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                    Metric
                  </th>
                  {chosen.map((r, i) => (
                    <th key={r.id} className="px-4 py-2.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{ background: CATEGORICAL[i % CATEGORICAL.length] }}
                        />
                        <Link
                          href={`/businesses/${r.id}`}
                          className="inline-flex items-center gap-0.5 font-medium text-foreground hover:text-evergreen-600 hover:underline"
                        >
                          {r.name} <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {figureRows.map((fr) => (
                  <tr key={fr.label} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{fr.label}</td>
                    {chosen.map((r) => (
                      <td key={r.id} className="px-4 py-2.5">
                        {fr.fmt(r)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">Circular models</td>
                  {chosen.map((r) => (
                    <td key={r.id} className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {r.circularModels.map((m) => (
                          <Badge key={m} variant="outline">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
