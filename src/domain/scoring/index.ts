import type { AssessmentInputs, ScoreBundle } from "./types";
import { scoreEvidence } from "./evidence";
import { scoreViability } from "./viability";
import { scoreResilience } from "./resilience";
import { scoreInvestor } from "./investor";
import { scoreOpportunity } from "./opportunity";

export * from "./types";
export { scoreEvidence } from "./evidence";
export { scoreViability } from "./viability";
export { scoreResilience } from "./resilience";
export { scoreInvestor } from "./investor";
export { scoreOpportunity } from "./opportunity";

/**
 * Compute the full bundle of Circa prototype decision-support scores.
 *
 * Evidence confidence is computed first because it feeds the confidence level
 * attached to every other dimension. All scoring is deterministic: the same
 * inputs and timestamp always yield the same output.
 *
 * NOTE: These are prototype decision-support scores, not scientifically
 * validated measures. See docs/methodology.md.
 */
export function computeScores(
  inputs: AssessmentInputs,
  at: string = new Date().toISOString(),
): ScoreBundle {
  const evidence = scoreEvidence(inputs, at);
  const evidenceScore = evidence.score;
  return {
    evidence,
    viability: scoreViability(inputs, evidenceScore, at),
    resilience: scoreResilience(inputs, evidenceScore, at),
    investor: scoreInvestor(inputs, evidenceScore, at),
    opportunity: scoreOpportunity(inputs, evidenceScore, at),
  };
}

/** Convenience: overall headline score (weighted blend for list/sort views). */
export function headlineScore(bundle: ScoreBundle): number {
  return (
    Math.round(
      (bundle.viability.score * 0.4 +
        bundle.resilience.score * 0.2 +
        bundle.investor.score * 0.25 +
        bundle.opportunity.score * 0.15) *
        10,
    ) / 10
  );
}
