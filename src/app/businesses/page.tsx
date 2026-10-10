import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/primitives";
import { buttonVariants } from "@/components/ui/button";
import { BusinessDirectory } from "@/components/businesses/directory";
import { getOrgRoster } from "@/server/network";

export const metadata: Metadata = { title: "Organisations" };

export default function BusinessesPage() {
  const rows = getOrgRoster();
  const assessed = rows.filter((r) => r.featured).length;

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Organisations"
        description={`${rows.length} organisations in the Scottish circular network across 14 sectors — ${assessed} fully assessed, the rest verified and mapped by material position. Search, filter and open a profile for the Organisation 360.`}
        actions={
          <>
            <a
              href="/api/export/portfolio"
              download
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
            <Link href="/businesses/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="h-4 w-4" /> New business
            </Link>
          </>
        }
      />
      <BusinessDirectory rows={rows} />
    </div>
  );
}
