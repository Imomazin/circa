import * as React from "react";
import { formatTonnes } from "@/lib/format";

export interface FlowRow {
  family: string;
  color: string;
  matchedTonnes: number;
  supplyTonnes: number;
  demandTonnes: number;
}

/**
 * Material-flow ribbon — a Sankey-style read of material moving from recovered
 * supply, through each family, into circular demand. Ribbon thickness is
 * proportional to matched volume; supply/demand node heights reflect the
 * totals on each side. Pure inline SVG, legible in both themes.
 */
export function MaterialFlow({ rows }: { rows: FlowRow[] }) {
  const flows = rows.filter((r) => r.matchedTonnes > 0).sort((a, b) => b.matchedTonnes - a.matchedTonnes);
  if (flows.length === 0) return null;

  const W = 720;
  const H = Math.max(200, flows.length * 34 + 40);
  const gap = 6;
  const totalMatched = flows.reduce((n, r) => n + r.matchedTonnes, 0);
  const usable = H - 40 - gap * (flows.length - 1);

  const nodeX = { supply: 150, demand: W - 150 };
  let y = 20;
  const bands = flows.map((r) => {
    const h = Math.max(6, (r.matchedTonnes / totalMatched) * usable);
    const band = { ...r, y, h };
    y += h + gap;
    return band;
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[620px]" role="img" aria-label="Material flow from supply to demand by family">
        {/* Supply / demand anchors */}
        <rect x={nodeX.supply - 4} y={16} width={4} height={H - 32} rx={2} className="fill-evergreen-700" />
        <rect x={nodeX.demand} y={16} width={4} height={H - 32} rx={2} className="fill-copper-500" />
        <text x={nodeX.supply - 10} y={12} textAnchor="end" className="fill-current text-[10px] uppercase tracking-wider text-muted-foreground">
          Recovered supply
        </text>
        <text x={nodeX.demand + 10} y={12} className="fill-current text-[10px] uppercase tracking-wider text-muted-foreground">
          Circular demand
        </text>

        {bands.map((b) => {
          const cy = b.y + b.h / 2;
          const x1 = nodeX.supply;
          const x2 = nodeX.demand;
          const mid = (x1 + x2) / 2;
          const d = `M ${x1} ${cy} C ${mid} ${cy}, ${mid} ${cy}, ${x2} ${cy}`;
          return (
            <g key={b.family}>
              <path d={d} fill="none" stroke={b.color} strokeWidth={b.h} strokeOpacity={0.5} strokeLinecap="butt" />
              <text x={x1 - 10} y={cy + 3} textAnchor="end" className="fill-current text-[11px] text-foreground">
                {b.family}
              </text>
              <text x={x2 + 10} y={cy + 3} className="fill-current text-[11px] tabular-nums text-muted-foreground">
                {formatTonnes(b.matchedTonnes)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
