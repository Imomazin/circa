"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowRight, BadgeCheck, Star } from "lucide-react";
import { SelectField } from "@/components/ui/select";
import { EmptyState } from "@/components/primitives";
import { formatGBPCompact, formatTonnes } from "@/lib/format";
import { SECTOR_DEFS } from "@/domain/enterprise/vocab";
import { cn } from "@/lib/utils";
import type { OrgRosterRow } from "@/lib/view-types";

const ALL = "All";
type SortKey = "networkValue" | "opportunities" | "supplyTonnes" | "demandTonnes" | "name";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "networkValue", label: "Network value" },
  { value: "opportunities", label: "Opportunities" },
  { value: "supplyTonnes", label: "Supply volume" },
  { value: "demandTonnes", label: "Demand volume" },
  { value: "name", label: "Name (A–Z)" },
];
const SECTORS = SECTOR_DEFS.map((s) => s.name);
const PAGE = 40;

export function BusinessDirectory({ rows }: { rows: OrgRosterRow[] }) {
  const [q, setQ] = React.useState("");
  const [sector, setSector] = React.useState(ALL);
  const [sort, setSort] = React.useState<SortKey>("networkValue");
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [limit, setLimit] = React.useState(PAGE);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (sector === ALL || r.sector === sector) &&
        (!featuredOnly || r.featured) &&
        (!needle || r.name.toLowerCase().includes(needle) || r.sector.toLowerCase().includes(needle) || r.region.toLowerCase().includes(needle)),
    );
    out.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : (b[sort] as number) - (a[sort] as number)));
    return out;
  }, [rows, q, sector, sort, featuredOnly]);

  React.useEffect(() => setLimit(PAGE), [q, sector, sort, featuredOnly]);
  const shown = filtered.slice(0, limit);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="org-search" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Search</label>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              id="org-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Organisation, sector or region…"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-[420px]">
          <SelectField label="Sector" value={sector} onChange={(e) => setSector(e.target.value)} options={[{ value: ALL, label: "All sectors" }, ...SECTORS.map((s) => ({ value: s, label: s }))]} />
          <SelectField label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} options={SORTS} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} className="h-3.5 w-3.5 accent-evergreen-700" />
          Assessed only
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No organisations match your search" description="Clear the search or choose a different sector." />
      ) : (
        <>
          <ul className="flex flex-col">
            {shown.map((r) => (
              <li key={r.id}>
                <Link href={`/businesses/${r.id}`} className="group grid grid-cols-1 items-center gap-3 border-b border-border py-3.5 transition-colors hover:bg-surface/50 sm:grid-cols-[1.7fr_1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-[0.9rem] font-semibold tracking-tight text-foreground group-hover:text-evergreen-700 dark:group-hover:text-evergreen-300">{r.name}</h3>
                      {r.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-copper-300 text-copper-400" aria-label="Assessed" />}
                      {r.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-evergreen-500" aria-label="Verified" />}
                    </div>
                    <p className="mt-0.5 text-2xs text-muted-foreground">{r.sector} · {r.region} · {r.size}</p>
                  </div>
                  <div className="flex items-center gap-6 sm:justify-end">
                    <Metric label="Opportunities" value={String(r.opportunities)} />
                    <Metric label="Network value" value={r.networkValue ? formatGBPCompact(r.networkValue) : "—"} />
                    <Metric label="Supply" value={r.supplyTonnes ? formatTonnes(r.supplyTonnes) : "—"} />
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-evergreen-600 sm:block" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <p className="text-2xs text-muted-foreground">Showing {shown.length} of {filtered.length} organisations</p>
            {limit < filtered.length && (
              <button onClick={() => setLimit((l) => l + PAGE)} className={cn("rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface")}>
                Show more
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[0.9rem] font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
    </div>
  );
}
