import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/primitives";
import { buttonVariants } from "@/components/ui/button";
import { BusinessDirectory } from "@/components/businesses/directory";
import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";

export const metadata: Metadata = { title: "Businesses" };
export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const summaries = await getAllBusinessSummaries();
  const rows = summaries.map(summaryToRow);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Organisations"
        description="Scottish businesses exploring circular opportunities across ten sectors. Search, filter and sort by commercial standing, then open a profile for the full assessment and network position."
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
