import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";

export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Portfolio CSV export. Returns one row per business with its headline and
 * dimension scores, stage, circular models and capital figures — a quick way
 * for an analyst to pull the cohort into a spreadsheet.
 */
export async function GET() {
  const rows = (await getAllBusinessSummaries()).map(summaryToRow);
  const header = [
    "id",
    "name",
    "sector",
    "region",
    "company_size",
    "stage",
    "circular_models",
    "headline",
    "viability",
    "resilience",
    "investor",
    "opportunity",
    "evidence",
    "confidence",
    "capex_gbp",
    "projected_annual_opportunity_gbp",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.name,
        r.sector,
        r.region,
        r.companySize,
        r.stage,
        r.circularModels.join("; "),
        r.headline,
        r.viability,
        r.resilience,
        r.investor,
        r.opportunity,
        r.evidence,
        r.confidence,
        r.capex,
        r.projectedOpportunity,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const csv = lines.join("\n") + "\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="circa-portfolio.csv"',
      "Cache-Control": "no-store",
    },
  });
}
