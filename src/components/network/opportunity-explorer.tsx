"use client";

import * as React from "react";
import { List, Grid2x2 } from "lucide-react";
import { DiscoveryBoard } from "@/components/network/discovery-board";
import { OpportunityMatrix } from "@/components/network/opportunity-matrix";
import { FamilyDot } from "@/components/network/elements";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { MATERIAL_FAMILIES } from "@/domain/network/types";
import { cn } from "@/lib/utils";
import type { MatchView } from "@/lib/view-types";

/** The opportunity landscape with two exploration modes: a filtered list and a
 *  value-vs-readiness matrix. */
export function OpportunityExplorer({ matches }: { matches: MatchView[] }) {
  const [view, setView] = React.useState<"list" | "matrix">("list");
  const [family, setFamily] = React.useState("All");

  const matrixMatches = family === "All" ? matches : matches.filter((m) => m.family === family);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-border-strong p-0.5">
          <ModeButton active={view === "list"} onClick={() => setView("list")} icon={<List className="h-3.5 w-3.5" />} label="List" />
          <ModeButton active={view === "matrix"} onClick={() => setView("matrix")} icon={<Grid2x2 className="h-3.5 w-3.5" />} label="Matrix" />
        </div>
        {view === "matrix" && (
          <p className="hidden text-2xs text-muted-foreground sm:block">
            Bubble size = annual volume · colour = material family
          </p>
        )}
      </div>

      {view === "list" ? (
        <DiscoveryBoard matches={matches} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <FamilyFilter label="All families" active={family === "All"} onClick={() => setFamily("All")} />
            {MATERIAL_FAMILIES.map((f) => (
              <FamilyFilter
                key={f}
                label={f}
                color={FAMILY_FACTORS[f].color}
                active={family === f}
                onClick={() => setFamily(f)}
              />
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <OpportunityMatrix matches={matrixMatches} height={480} />
          </div>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-2xs text-muted-foreground">
            {MATERIAL_FAMILIES.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <FamilyDot color={FAMILY_FACTORS[f].color} /> {f}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[0.3rem] px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-evergreen-700 text-white" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon} {label}
    </button>
  );
}

function FamilyFilter({
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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-2xs font-medium transition-colors",
        active
          ? "border-transparent bg-evergreen-700 text-white"
          : "border-border text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {color && <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}
