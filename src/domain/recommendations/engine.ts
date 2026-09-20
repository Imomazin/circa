import type { RecommendationPriority } from "../constants";
import type { AssessmentInputs, ScoreBundle } from "../scoring/types";

/**
 * Recommendation engine.
 *
 * Transparent, deterministic rules over the assessment inputs and computed
 * scores. Every recommendation carries the rule that produced it, so nothing
 * is a black box. This is NOT LLM-generated (see docs/responsible-ai.md).
 */

export interface Recommendation {
  code: string;
  title: string;
  rationale: string;
  priority: RecommendationPriority;
  category: "Demand" | "Capital" | "Resilience" | "Evidence" | "Investment" | "Operations";
}

interface Rule {
  code: string;
  category: Recommendation["category"];
  title: string;
  priority: RecommendationPriority;
  when: (i: AssessmentInputs, s: ScoreBundle) => boolean;
  rationale: (i: AssessmentInputs, s: ScoreBundle) => string;
}

const RULES: Rule[] = [
  {
    code: "VALIDATE_DEMAND",
    category: "Demand",
    title: "Validate customer demand",
    priority: "High",
    when: (i) => i.customerDemand < 55 || i.customerEvidence < 50,
    rationale: (i) =>
      `Customer demand (${i.customerDemand}) and customer evidence (${i.customerEvidence}) are below the confidence threshold; validate willingness to pay before scaling investment.`,
  },
  {
    code: "REDUCE_SUPPLIER_CONCENTRATION",
    category: "Resilience",
    title: "Reduce supplier concentration",
    priority: "High",
    when: (i) => i.supplierConcentration > 60,
    rationale: (i) =>
      `Supplier concentration is high (${i.supplierConcentration}); qualify alternative suppliers to reduce single-source risk.`,
  },
  {
    code: "OBTAIN_SUPPLIER_PRICING",
    category: "Evidence",
    title: "Obtain supplier pricing evidence",
    priority: "Medium",
    when: (i) => i.resourcePriceVolatility > 55 && i.evidenceVerification < 60,
    rationale: () =>
      "Resource-price volatility is material and pricing evidence is only provisional; secure supplier quotes to firm up cost assumptions.",
  },
  {
    code: "IMPROVE_UNIT_ECONOMICS",
    category: "Investment",
    title: "Improve unit economics",
    priority: "High",
    when: (i) => i.unitEconomics < 55,
    rationale: (i) =>
      `Unit economics (${i.unitEconomics}) need strengthening before the case is fundable; model per-unit contribution explicitly.`,
  },
  {
    code: "TEST_SUBSCRIPTION_PRICING",
    category: "Resilience",
    title: "Test subscription / PaaS pricing",
    priority: "Medium",
    when: (i) => i.recurringRevenueShare < 40,
    rationale: (i) =>
      `Recurring revenue is only ${i.recurringRevenueShare}% of the mix; pilot subscription or product-as-a-service pricing to build durable revenue.`,
  },
  {
    code: "REDUCE_CAPEX",
    category: "Capital",
    title: "Reduce or phase capex requirement",
    priority: "High",
    when: (i) => i.paybackYears > 4 || i.capexRequirement > (i.annualRevenueUplift + i.annualCostSaving) * 5,
    rationale: (i) =>
      `Payback is ${i.paybackYears} years against capex of £${i.capexRequirement.toLocaleString()}; phase capital or explore asset-light entry to shorten payback.`,
  },
  {
    code: "CONDUCT_PILOT",
    category: "Evidence",
    title: "Conduct a commercial pilot",
    priority: "Medium",
    when: (i) => i.commercialTraction < 50,
    rationale: (i) =>
      `Commercial traction (${i.commercialTraction}) is limited; a paid pilot would generate the evidence funders expect.`,
  },
  {
    code: "COLLECT_MARKET_EVIDENCE",
    category: "Evidence",
    title: "Collect independent market evidence",
    priority: "Medium",
    when: (i, s) => s.evidence.score < 55 || i.marketValidation < 50,
    rationale: (i) =>
      `Evidence confidence is limited; commission independent market validation to raise the reliability of the commercial case. (market validation ${i.marketValidation})`,
  },
  {
    code: "STRENGTHEN_MANAGEMENT",
    category: "Operations",
    title: "Strengthen management capacity",
    priority: "Medium",
    when: (i) => i.managementCapability < 55,
    rationale: (i) =>
      `Management capability (${i.managementCapability}) may limit execution; add capacity or advisory support ahead of scale-up.`,
  },
  {
    code: "BUILD_IMPLEMENTATION_PLAN",
    category: "Operations",
    title: "Build a costed implementation plan",
    priority: "Low",
    when: (i) => i.operationalFeasibility < 60,
    rationale: () =>
      "Operational feasibility is not yet demonstrated; a costed, sequenced implementation plan will de-risk delivery.",
  },
  {
    code: "CLARIFY_CAPITAL_ASK",
    category: "Investment",
    title: "Sharpen the capital requirement and use of funds",
    priority: "Medium",
    when: (i) => i.capitalClarity < 55,
    rationale: (i) =>
      `Capital-requirement clarity (${i.capitalClarity}) is low; a clear ask with milestones improves investor readiness.`,
  },
];

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

/** Generate the ordered recommendation set for an assessment. */
export function generateRecommendations(
  inputs: AssessmentInputs,
  scores: ScoreBundle,
): Recommendation[] {
  const out: Recommendation[] = [];
  for (const rule of RULES) {
    if (rule.when(inputs, scores)) {
      out.push({
        code: rule.code,
        title: rule.title,
        rationale: rule.rationale(inputs, scores),
        priority: rule.priority,
        category: rule.category,
      });
    }
  }
  return out.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
