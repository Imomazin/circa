"use client";

import * as React from "react";
import Link from "next/link";
import { PIPELINE_STAGES } from "@/domain/network/types";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { MATERIAL_FAMILIES } from "@/domain/network/types";
import { FamilyDot } from "@/components/network/elements";
import { formatGBPCompact } from "@/lib/format";
import type { MatchView } from "@/lib/view-types";

const PHASE_OF: Record<string, string> = {
  Identified: "Origination",
  Matched: "Origination",
  Validated: "Development",
  Engagement: "Development",
  Feasibility: "Development",
  Pilot: "Delivery",
  "Commercial agreement": "Delivery",
  Implementation: "Delivery",
  Realised: "Realised",
};

export function PipelineBoard({ matches }: { matches: MatchView[] }) {
  const [family, setFamily] = React.useState("All");
  const shown = family === "All" ? matches : matches.filter((m) => m.family === family);

  const byStage = PIPELINE_STAGES.map((stage) => ({
    stage,
    phase: PHASE_OF[stage],
    items: shown
      .filter((m) => m.stage === stage)
      .sort((a, b) => b.value - a.value),
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Family filter */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip label="All families" active={family === "All"} onClick={() => setFamily("All")} />
        {MATERIAL_FAMILIES.map((f) => (
          <FilterChip
            key={f}
            label={f}
            color={FAMILY_FACTORS[f].color}
            active={family === f}
            onClick={() => setFamily(f)}
          />
        ))}
      </div>

      {/* Board */}
      <div className="scrollbar-thin -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {byStage.map(({ stage, phase, items }) => (
          <div key={stage} className="flex w-[15rem] shrink-0 flex-col">
            <div className="mb-2 flex items-baseline justify-between border-b-2 border-border-strong pb-1.5">
              <div>
                <p className="text-[0.625rem] uppercase tracking-[0.12em] text-stone-400">{phase}</p>
                <p className="text-xs font-semibold text-foreground">{stage}</p>
              </div>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-2xs font-medium tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="flex min-h-[4rem] flex-col gap-2">
              {items.map((m) => (
                <Link
                  key={m.id}
                  href={`/opportunities/${m.id}`}
                  className="block rounded-md border border-border bg-card p-2.5 shadow-card transition-colors hover:border-evergreen-300"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <FamilyDot color={FAMILY_FACTORS[m.family].color} />
                    <span className="truncate text-2xs text-muted-foreground">{m.family}</span>
                  </div>
                  <p className="text-xs font-medium leading-snug text-foreground">{m.material}</p>
                  <p className="mt-1 truncate text-2xs text-muted-foreground">
                    {m.supplierName} → {m.buyerName}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatGBPCompact(m.value)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            m.strength >= 68 ? "#185847" : m.strength >= 55 ? "#3b8f76" : "#b87333",
                        }}
                      />
                      {m.strength}
                    </span>
                  </div>
                </Link>
              ))}
              {items.length === 0 && (
                <div className="rounded-md border border-dashed border-border py-4 text-center text-2xs text-stone-400">
                  —
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-2xs font-medium transition-colors ${
        active
          ? "border-transparent bg-evergreen-700 text-white"
          : "border-border text-muted-foreground hover:bg-surface hover:text-foreground"
      }`}
    >
      {color && <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}
