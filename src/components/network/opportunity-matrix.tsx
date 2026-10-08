"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { formatGBPCompact, formatTonnes } from "@/lib/format";
import type { MatchView } from "@/lib/view-types";

/**
 * Opportunity matrix — the signature intelligence canvas. Each bubble is an
 * opportunity placed by implementation readiness (x) against annual commercial
 * value (y), sized by volume and coloured by material family. Quadrants frame
 * the strategic read; bubbles are clickable through to the dossier.
 */
export function OpportunityMatrix({ matches, height = 440 }: { matches: MatchView[]; height?: number }) {
  const router = useRouter();

  const byFamily = React.useMemo(() => {
    const groups = new Map<string, { x: number; y: number; z: number; id: string; material: string; supplier: string; buyer: string }[]>();
    for (const m of matches) {
      const arr = groups.get(m.family) ?? [];
      arr.push({
        x: m.strength,
        y: m.value,
        z: m.volumeTonnes,
        id: m.id,
        material: m.material,
        supplier: m.supplierName,
        buyer: m.buyerName,
      });
      groups.set(m.family, arr);
    }
    return groups;
  }, [matches]);

  const values = matches.map((m) => m.value);
  const strengths = matches.map((m) => m.strength);
  const medianValue = median(values);
  const xMin = Math.max(0, Math.min(...strengths) - 6);
  const xMax = Math.min(100, Math.max(...strengths) + 6);

  return (
    <div className="relative" style={{ width: "100%", height }}>
      {/* Quadrant captions */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <span className="absolute left-[12%] top-2 text-[0.625rem] uppercase tracking-[0.12em] text-stone-400">
          Build the case
        </span>
        <span className="absolute right-3 top-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-evergreen-600">
          Act now
        </span>
        <span className="absolute bottom-10 left-[12%] text-[0.625rem] uppercase tracking-[0.12em] text-stone-400">
          Monitor
        </span>
        <span className="absolute bottom-10 right-3 text-[0.625rem] uppercase tracking-[0.12em] text-copper-500">
          Quick wins
        </span>
      </div>

      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 28, left: 8 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.1} className="text-graphite-400" />
          <XAxis
            type="number"
            dataKey="x"
            name="Readiness"
            domain={[xMin, xMax]}
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
            label={{ value: "Implementation readiness →", position: "bottom", offset: 10, fontSize: 11, fill: "currentColor" }}
            className="text-muted-foreground"
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Value"
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatGBPCompact(v)}
            width={52}
            className="text-muted-foreground"
          />
          <ZAxis type="number" dataKey="z" range={[80, 620]} name="Volume" />
          <ReferenceLine x={65} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 4" className="text-graphite-400" />
          <ReferenceLine y={medianValue} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 4" className="text-graphite-400" />
          <Tooltip content={<MatrixTooltip />} cursor={{ strokeOpacity: 0.1 }} />
          {[...byFamily.entries()].map(([family, points]) => (
            <Scatter
              key={family}
              name={family}
              data={points}
              fill={FAMILY_FACTORS[family as keyof typeof FAMILY_FACTORS]?.color ?? "#185847"}
              fillOpacity={0.72}
              stroke="var(--card)"
              strokeWidth={1}
              onClick={(p: { id?: string }) => p?.id && router.push(`/opportunities/${p.id}`)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function MatrixTooltip({ active, payload }: { active?: boolean; payload?: { payload: { material: string; supplier: string; buyer: string; x: number; y: number; z: number } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-raised">
      <p className="font-medium text-foreground">{p.material}</p>
      <p className="mt-0.5 text-2xs text-muted-foreground">
        {p.supplier} → {p.buyer}
      </p>
      <div className="mt-1.5 flex gap-3 text-2xs text-muted-foreground">
        <span>Value <span className="font-medium text-foreground">{formatGBPCompact(p.y)}</span></span>
        <span>Readiness <span className="font-medium text-foreground">{p.x}</span></span>
        <span>Vol <span className="font-medium text-foreground">{formatTonnes(p.z)}</span></span>
      </div>
    </div>
  );
}

function median(ns: number[]): number {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
