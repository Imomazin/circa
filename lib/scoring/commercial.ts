import type {
  Baseline,
  Factors,
  ScenarioInput,
} from "../validation/assessment";

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const round = (n: number) => Math.round(n * 100) / 100;
export function modelScenario(b: Baseline, s: ScenarioInput) {
  const baseCosts =
    b.material + b.labour + b.energy + b.maintenance + b.overhead;
  const baseProfit = b.revenue - baseCosts;
  const revenue = b.revenue * (1 + s.revenueChange / 100) + s.recurringRevenue;
  const materials =
    b.material * (1 - s.materialSaving / 100) * (1 + s.supplierShock / 100);
  const costs =
    materials +
    b.labour +
    s.extraLabour +
    b.energy * (1 - s.energySaving / 100) +
    b.maintenance +
    b.overhead +
    s.extraOperating;
  const profit = revenue - costs;
  const uplift = profit - baseProfit;
  const cashRequirement = s.capex + s.workingCapital;
  // Simple undiscounted payback of incremental operating contribution.
  const paybackMonths =
    uplift > 0 ? round((cashRequirement / uplift) * 12) : null;
  const grossMargin =
    revenue > 0
      ? round(
          ((revenue - materials - b.labour - s.extraLabour) / revenue) * 100,
        )
      : 0;
  const threeYearNetValue = uplift * 3 - cashRequirement + s.residualValue;
  return {
    baseRevenue: b.revenue,
    baseCosts,
    baseProfit: round(baseProfit),
    revenue: round(revenue),
    costs: round(costs),
    profit: round(profit),
    uplift: round(uplift),
    cashRequirement,
    paybackMonths,
    grossMargin,
    threeYearNetValue: round(threeYearNetValue),
    cashflow: [0, 1, 2, 3].map((year) => ({
      year: `Year ${year}`,
      baseline: round(baseProfit * year),
      circular: round(
        profit * year - cashRequirement + (year === 3 ? s.residualValue : 0),
      ),
      incremental: round(
        uplift * year - cashRequirement + (year === 3 ? s.residualValue : 0),
      ),
    })),
  };
}
export type FinancialResult = ReturnType<typeof modelScenario>;
export type Component = {
  label: string;
  score: number;
  weight: number;
  explanation: string;
};
export type ScoreFamily = {
  key: string;
  label: string;
  score: number;
  band: string;
  confidence: string;
  components: Component[];
  positive: string[];
  weaknesses: string[];
  missing: string[];
  actions: string[];
};
export function scoreAssessment(
  f: Factors,
  b: Baseline,
  s: ScenarioInput,
): ScoreFamily[] {
  const result = modelScenario(b, s);
  const economics =
    result.uplift <= 0
      ? 10
      : clamp(35 + (result.uplift / Math.max(b.revenue, 1)) * 300);
  const payback =
    result.paybackMonths === null ? 0 : clamp(100 - result.paybackMonths * 1.2);
  const recurringShare =
    result.revenue > 0 ? clamp((s.recurringRevenue / result.revenue) * 250) : 0;
  const c = (
    label: string,
    value: number,
    weight: number,
    explanation: string,
  ): Component => ({ label, score: round(clamp(value)), weight, explanation });
  const confidence =
    f.evidence >= 75 ? "Higher" : f.evidence >= 45 ? "Moderate" : "Limited";
  const missing = [
    f.demand < 60 && "Independent customer commitments",
    f.market < 60 && "External market comparison",
    f.traction < 60 && "Observed trading results",
    f.evidence < 60 && "Source documents for assumptions",
  ].filter((x): x is string => !!x);
  const definitions = [
    {
      key: "viability",
      label: "Commercial viability",
      components: [
        c(
          "Incremental economics",
          economics,
          0.35,
          "Annual contribution uplift relative to current revenue.",
        ),
        c(
          "Customer demand",
          f.demand,
          0.25,
          "Declared strength of customer evidence.",
        ),
        c("Capital payback", payback, 0.2, "Simple payback, capped at 100."),
        c(
          "Delivery readiness",
          f.readiness,
          0.2,
          "Operating plan and readiness assessment.",
        ),
      ],
    },
    {
      key: "resilience",
      label: "Commercial resilience",
      components: [
        c(
          "Supplier diversity",
          100 - f.supplierConcentration,
          0.15,
          "Inverse of dependence on the largest supplier.",
        ),
        c(
          "Import independence",
          100 - f.importDependency,
          0.1,
          "Inverse of imported input exposure.",
        ),
        c(
          "Cost stability",
          100 - f.volatility,
          0.1,
          "Inverse of resource-price volatility.",
        ),
        c(
          "Substitution options",
          f.substitution,
          0.1,
          "Availability of alternative inputs.",
        ),
        c(
          "Repair & reuse",
          (f.repairability + f.reuse) / 2,
          0.15,
          "Average repairability and reuse potential.",
        ),
        c("Revenue diversity", f.diversity, 0.1, "Breadth of revenue sources."),
        c(
          "Recurring income",
          recurringShare,
          0.1,
          "Recurring revenue share scaled to a 40% reference point.",
        ),
        c(
          "Customer retention",
          s.retention,
          0.1,
          "Declared scenario retention assumption.",
        ),
        c(
          "Operating flexibility",
          f.flexibility,
          0.1,
          "Ability to adapt delivery.",
        ),
      ],
    },
    {
      key: "readiness",
      label: "Investor readiness",
      components: [
        c(
          "Customer & market evidence",
          (f.demand + f.market) / 2,
          0.2,
          "Mean customer and market evidence.",
        ),
        c(
          "Unit economics",
          economics,
          0.2,
          "Incremental economics under the selected scenario.",
        ),
        c(
          "Management & delivery",
          (f.capability + f.readiness) / 2,
          0.15,
          "Team capability and operating readiness.",
        ),
        c(
          "Scale & traction",
          (f.scalability + f.traction) / 2,
          0.15,
          "Scale potential and observed traction.",
        ),
        c(
          "Capital clarity",
          s.capex > 0 ? 75 : 35,
          0.1,
          "Capital estimate supplied; cost validation remains necessary.",
        ),
        c(
          "Resource security",
          f.resourceSecurity,
          0.1,
          "Continuity of critical resources.",
        ),
        c("Data quality", f.evidence, 0.1, "Declared evidence quality."),
      ],
    },
    {
      key: "circularity",
      label: "Circular opportunity",
      components: [
        c(
          "Reuse potential",
          f.reuse,
          0.35,
          "Scope to return products and materials to use.",
        ),
        c(
          "Repairability",
          f.repairability,
          0.25,
          "Ability to maintain usable product life.",
        ),
        c(
          "Material reduction",
          s.materialSaving,
          0.25,
          "Scenario reduction in material expenditure; not a physical circularity metric.",
        ),
        c(
          "Resource security",
          f.resourceSecurity,
          0.15,
          "Availability of circular feedstock.",
        ),
      ],
    },
    {
      key: "confidence",
      label: "Evidence confidence",
      components: [
        c(
          "Source quality",
          f.evidence,
          0.5,
          "User-assessed quality of evidence.",
        ),
        c(
          "Customer validation",
          f.demand,
          0.3,
          "Strength of customer evidence.",
        ),
        c(
          "Trading evidence",
          f.traction,
          0.2,
          "Observed traction, including pilots.",
        ),
      ],
    },
  ];
  return definitions.map((d) => {
    const score = Math.round(
      d.components.reduce((sum, x) => sum + x.score * x.weight, 0),
    );
    const positive = [...d.components]
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.label);
    const weaknesses = [...d.components]
      .filter((x) => x.score < 60)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.label);
    return {
      ...d,
      score,
      band:
        score >= 75
          ? "Strong"
          : score >= 55
            ? "Developing"
            : score >= 35
              ? "Needs evidence"
              : "High uncertainty",
      confidence,
      positive,
      weaknesses,
      missing,
      actions: weaknesses
        .slice(0, 3)
        .map((x) => `Validate ${x.toLowerCase()} with documented evidence.`),
    };
  });
}
export function scenarioVariants(base: ScenarioInput) {
  return [
    { name: "Circular base case", input: base },
    {
      name: "Upside case",
      input: {
        ...base,
        revenueChange: Math.min(100, base.revenueChange + 8),
        materialSaving: Math.min(100, base.materialSaving + 8),
        recurringRevenue: Math.round(base.recurringRevenue * 1.2),
      },
    },
    {
      name: "Downside case",
      input: {
        ...base,
        revenueChange: Math.max(-80, base.revenueChange - 12),
        materialSaving: Math.max(0, base.materialSaving - 10),
        recurringRevenue: Math.round(base.recurringRevenue * 0.7),
        supplierShock: Math.min(100, base.supplierShock + 20),
      },
    },
  ];
}
