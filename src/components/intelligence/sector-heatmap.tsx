import * as React from "react";
import Link from "next/link";
import { formatGBPCompact } from "@/lib/format";

export interface SectorHeatRow {
  sector: string;
  attractiveness: number;
  avgViability: number;
  avgReadiness: number;
  opportunityValue: number;
  topFamily: string;
}

/** Intensity fill for a 0–100 metric — a graphite→forest ramp, not traffic lights. */
function cell(value: number): React.CSSProperties {
  const t = Math.max(0, Math.min(1, value / 100));
  // forest green with intensity by value
  return {
    backgroundColor: `color-mix(in srgb, #185847 ${Math.round(12 + t * 68)}%, transparent)`,
    color: t > 0.62 ? "#f4f2ec" : "var(--foreground)",
  };
}

const COLS: { key: keyof SectorHeatRow; label: string }[] = [
  { key: "attractiveness", label: "Attractiveness" },
  { key: "avgViability", label: "Viability" },
  { key: "avgReadiness", label: "Readiness" },
];

/**
 * Sector attractiveness heatmap — a board-level read of where the commercial
 * case concentrates. Rows are sectors (most attractive first); cells are
 * intensity-coded scores; value is shown explicitly.
 */
export function SectorHeatmap({ rows }: { rows: SectorHeatRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr>
            <th className="pb-1 text-left text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Sector
            </th>
            {COLS.map((c) => (
              <th
                key={c.key}
                className="pb-1 text-center text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
              >
                {c.label}
              </th>
            ))}
            <th className="pb-1 text-right text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Value / yr
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sector} className="group">
              <td className="whitespace-nowrap py-1 pr-3">
                <Link href="/sectors" className="font-medium text-foreground hover:text-evergreen-600">
                  {r.sector}
                </Link>
                <span className="ml-1.5 hidden text-2xs text-muted-foreground sm:inline">{r.topFamily}</span>
              </td>
              {COLS.map((c) => (
                <td key={c.key} className="px-1">
                  <div
                    className="mx-auto flex h-8 w-full min-w-[3.5rem] items-center justify-center rounded text-xs font-semibold tabular-nums"
                    style={cell(r[c.key] as number)}
                  >
                    {Math.round(r[c.key] as number)}
                  </div>
                </td>
              ))}
              <td className="whitespace-nowrap py-1 pl-3 text-right text-xs font-semibold tabular-nums text-foreground">
                {formatGBPCompact(r.opportunityValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
