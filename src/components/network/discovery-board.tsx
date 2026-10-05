"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SelectField } from "@/components/ui/select";
import { EmptyState } from "@/components/primitives";
import { StageTag, StrengthBar, FamilyDot } from "@/components/network/elements";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { MATERIAL_FAMILIES } from "@/domain/network/types";
import { formatGBPCompact, formatTonnes, formatKm, formatCarbon } from "@/lib/format";
import type { MatchView } from "@/lib/view-types";

type SortKey = "value" | "strength" | "carbon" | "distance" | "volume";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "value", label: "Commercial value" },
  { value: "strength", label: "Match strength" },
  { value: "carbon", label: "Carbon benefit" },
  { value: "volume", label: "Volume" },
  { value: "distance", label: "Proximity" },
];
const STAGE_GROUPS = ["All stages", "Early", "In progress", "Advanced"] as const;
const ADVANCED = ["Pilot", "Commercial agreement", "Implementation", "Realised"];
const EARLY = ["Identified", "Matched"];

export function DiscoveryBoard({ matches }: { matches: MatchView[] }) {
  const [q, setQ] = React.useState("");
  const [family, setFamily] = React.useState("All");
  const [stageGroup, setStageGroup] = React.useState<(typeof STAGE_GROUPS)[number]>("All stages");
  const [minStrength, setMinStrength] = React.useState(0);
  const [sort, setSort] = React.useState<SortKey>("value");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = matches.filter((m) => {
      if (family !== "All" && m.family !== family) return false;
      if (m.strength < minStrength) return false;
      if (stageGroup === "Early" && !EARLY.includes(m.stage)) return false;
      if (stageGroup === "Advanced" && !ADVANCED.includes(m.stage)) return false;
      if (stageGroup === "In progress" && (EARLY.includes(m.stage) || ADVANCED.includes(m.stage)))
        return false;
      if (
        needle &&
        !(
          m.material.toLowerCase().includes(needle) ||
          m.supplierName.toLowerCase().includes(needle) ||
          m.buyerName.toLowerCase().includes(needle) ||
          m.family.toLowerCase().includes(needle)
        )
      )
        return false;
      return true;
    });
    out.sort((a, b) => {
      switch (sort) {
        case "strength":
          return b.strength - a.strength;
        case "carbon":
          return b.carbonTonnes - a.carbonTonnes;
        case "volume":
          return b.volumeTonnes - a.volumeTonnes;
        case "distance":
          return a.distanceKm - b.distanceKm;
        default:
          return b.value - a.value;
      }
    });
    return out;
  }, [matches, q, family, stageGroup, minStrength, sort]);

  const activeFilters = family !== "All" || stageGroup !== "All stages" || minStrength > 0 || q.trim();

  function reset() {
    setQ("");
    setFamily("All");
    setStageGroup("All stages");
    setMinStrength(0);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
      {/* Filter rail */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card variant="muted">
          <CardContent className="flex flex-col gap-5 p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Refine
              </span>
              {activeFilters && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="opp-search" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                Search
              </label>
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="opp-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Material, organisation…"
                  className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                Material family
              </p>
              <div className="flex flex-col gap-0.5">
                <FamilyOption label="All families" active={family === "All"} onClick={() => setFamily("All")} />
                {MATERIAL_FAMILIES.map((f) => (
                  <FamilyOption
                    key={f}
                    label={f}
                    color={FAMILY_FACTORS[f].color}
                    active={family === f}
                    onClick={() => setFamily(f)}
                  />
                ))}
              </div>
            </div>

            <SelectField
              label="Pipeline"
              value={stageGroup}
              onChange={(e) => setStageGroup(e.target.value as (typeof STAGE_GROUPS)[number])}
              options={STAGE_GROUPS.map((s) => ({ value: s, label: s }))}
            />

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="opp-strength" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                  Min. match strength
                </label>
                <span className="text-xs font-semibold tabular-nums text-foreground">{minStrength}</span>
              </div>
              <input
                id="opp-strength"
                type="range"
                min={0}
                max={80}
                step={5}
                value={minStrength}
                onChange={(e) => setMinStrength(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-evergreen-700"
              />
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Results */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> of {matches.length} opportunities
          </p>
          <div className="w-52">
            <SelectField
              label=""
              aria-label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              options={SORTS}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No opportunities match these filters" description="Relax the strength threshold or clear a filter." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {filtered.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/opportunities/${m.id}`}
                  className="group block rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-evergreen-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <FamilyDot color={FAMILY_FACTORS[m.family].color} />
                        <span className="text-2xs uppercase tracking-wider text-muted-foreground">{m.family}</span>
                        <StageTag stage={m.stage} />
                      </div>
                      <p className="font-display text-sm font-semibold tracking-tight text-foreground">
                        {m.material}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {m.supplierName} <span className="text-stone-400">→</span> {m.buyerName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-semibold tabular-nums text-foreground">
                        {formatGBPCompact(m.value)}
                      </p>
                      <p className="text-2xs text-muted-foreground">per year</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-2xs text-muted-foreground">
                    <Metric label="Volume" value={formatTonnes(m.volumeTonnes)} />
                    <Metric label="Carbon" value={formatCarbon(m.carbonTonnes)} />
                    <Metric label="Distance" value={formatKm(m.distanceKm)} />
                    <div className="ml-auto flex items-center gap-2">
                      <span className="hidden text-2xs sm:inline">Strength</span>
                      <StrengthBar value={m.strength} />
                      <ArrowRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-evergreen-600" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FamilyOption({
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
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
        active ? "bg-evergreen-700/10 font-medium text-evergreen-800 dark:text-evergreen-100" : "text-muted-foreground hover:bg-surface hover:text-foreground"
      }`}
    >
      <span
        className="h-2.5 w-2.5 rounded-[2px]"
        style={{ backgroundColor: color ?? "var(--border-strong)" }}
      />
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-stone-400">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </span>
  );
}
