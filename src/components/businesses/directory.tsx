"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { SelectField } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score";
import { EmptyState } from "@/components/primitives";
import { formatGBPCompact } from "@/lib/format";
import { SECTORS } from "@/domain/constants";
import type { DirectoryRow } from "@/lib/view-types";

const ALL = "All";
type SortKey = "headline" | "networkValue" | "opportunities" | "viability" | "investor" | "capex" | "name";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "networkValue", label: "Network value" },
  { value: "opportunities", label: "Opportunities" },
  { value: "headline", label: "Headline score" },
  { value: "viability", label: "Commercial viability" },
  { value: "investor", label: "Investor readiness" },
  { value: "capex", label: "Capital requirement" },
  { value: "name", label: "Name (A–Z)" },
];

/**
 * Organisation roster — an editorial intelligence index rather than a dense
 * table. Each row couples commercial standing with the organisation's position
 * in the circular network (opportunities and the value they carry).
 */
export function BusinessDirectory({ rows }: { rows: DirectoryRow[] }) {
  const [q, setQ] = React.useState("");
  const [sector, setSector] = React.useState(ALL);
  const [sort, setSort] = React.useState<SortKey>("networkValue");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (sector === ALL || r.sector === sector) &&
        (!needle ||
          r.name.toLowerCase().includes(needle) ||
          r.sector.toLowerCase().includes(needle) ||
          r.region.toLowerCase().includes(needle) ||
          r.circularModels.some((m) => m.toLowerCase().includes(needle))),
    );
    out.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : (b[sort] as number) - (a[sort] as number)));
    return out;
  }, [rows, q, sector, sort]);

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="org-search" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
            Search
          </label>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              id="org-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, sector, region or circular model…"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-[420px]">
          <SelectField
            label="Sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            options={[{ value: ALL, label: "All sectors" }, ...SECTORS.map((s) => ({ value: s, label: s }))]}
          />
          <SelectField
            label="Sort by"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            options={SORTS}
          />
        </div>
      </div>

      {/* Roster */}
      {filtered.length === 0 ? (
        <EmptyState title="No organisations match your search" description="Clear the search or choose a different sector." />
      ) : (
        <ul className="flex flex-col">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                href={`/businesses/${r.id}`}
                className="group grid grid-cols-1 items-center gap-3 border-b border-border py-4 transition-colors hover:bg-surface/50 sm:grid-cols-[1.6fr_1fr_auto]"
              >
                {/* Identity */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="truncate font-display text-[0.95rem] font-semibold tracking-tight text-foreground group-hover:text-evergreen-700 dark:group-hover:text-evergreen-300">
                      {r.name}
                    </h3>
                    <ScoreBadge score={r.headline} />
                  </div>
                  <p className="mt-0.5 text-2xs text-muted-foreground">
                    {r.sector} · {r.region} · {r.companySize}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.circularModels.map((m) => (
                      <Badge key={m} variant="outline">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Network position */}
                <div className="flex items-center gap-6 sm:justify-end">
                  <Metric label="Opportunities" value={String(r.opportunities)} />
                  <Metric label="Network value" value={formatGBPCompact(r.networkValue)} />
                  <Metric label="Viability" value={r.viability.toFixed(0)} />
                </div>

                <ArrowRight className="hidden h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-evergreen-600 sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-2xs text-muted-foreground">
        {filtered.length} of {rows.length} organisations · network value is the annual value of the
        opportunities each organisation participates in.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[0.95rem] font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
    </div>
  );
}
