import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KeyValue } from "@/components/primitives";
import { StageTag, GradeChip, FamilyDot } from "@/components/network/elements";
import { getOrgNetwork } from "@/server/network";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { formatGBPCompact, formatTonnes } from "@/lib/format";
import type { StreamView } from "@/lib/view-types";

export function OrgNetworkPanel({ orgId }: { orgId: string }) {
  const net = getOrgNetwork(orgId);
  if (net.supply.length === 0 && net.demand.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 grid grid-cols-3 gap-4 border-b border-border pb-4">
          <KeyValue label="As supplier" value={`${net.asSupplier} match${net.asSupplier === 1 ? "" : "es"}`} mono={false} />
          <KeyValue label="As buyer" value={`${net.asBuyer} match${net.asBuyer === 1 ? "" : "es"}`} mono={false} />
          <KeyValue label="Network value" value={formatGBPCompact(net.networkValue)} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StreamColumn
            title="Supplies"
            icon={<ArrowUpRight className="h-3.5 w-3.5 text-evergreen-600" />}
            streams={net.supply}
          />
          <StreamColumn
            title="Seeks"
            icon={<ArrowDownLeft className="h-3.5 w-3.5 text-copper-500" />}
            streams={net.demand}
          />
        </div>

        {net.matches.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
              Opportunity matches
            </p>
            <div className="flex flex-col gap-1.5">
              {net.matches.map((m) => {
                const counterpart = m.supplierId === orgId ? m.buyerName : m.supplierName;
                const role = m.supplierId === orgId ? "supplies" : "buys from";
                return (
                  <Link
                    key={m.id}
                    href={`/opportunities/${m.id}`}
                    className="group flex items-center gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:border-evergreen-300"
                  >
                    <FamilyDot color={FAMILY_FACTORS[m.family].color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{m.material}</p>
                      <p className="truncate text-2xs text-muted-foreground">
                        {role} {counterpart}
                      </p>
                    </div>
                    <StageTag stage={m.stage} />
                    <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                      {formatGBPCompact(m.value)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StreamColumn({
  title,
  icon,
  streams,
}: {
  title: string;
  icon: React.ReactNode;
  streams: StreamView[];
}) {
  return (
    <div>
      <p className="mb-2 inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </p>
      {streams.length === 0 ? (
        <p className="text-2xs text-stone-400">None recorded</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {streams.map((s) => (
            <li key={s.id} className="flex items-start gap-2">
              <GradeChip grade={s.grade ?? s.minGrade} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{s.material}</p>
                <p className="text-2xs text-muted-foreground">
                  {formatTonnes(s.annualVolumeTonnes)} / yr ·{" "}
                  {s.direction === "supply" ? s.currentFate : s.specNeeded}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
