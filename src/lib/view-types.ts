import type { ScoreBand, ConfidenceLevel } from "@/domain/constants";
import type { MaterialStream, OpportunityMatch } from "@/domain/network/types";

/** Compact, serialisable row shapes passed from server components to client
 * components (charts, filters). Keeping these lean avoids shipping full score
 * bundles to the browser. */

export interface DashboardRow {
  id: string;
  name: string;
  sector: string;
  companySize: string;
  region: string;
  stage: string;
  circularModels: string[];
  headline: number;
  viability: number;
  viabilityBand: ScoreBand;
  resilience: number;
  investor: number;
  investorBand: ScoreBand;
  opportunity: number;
  evidence: number;
  confidence: ConfidenceLevel;
  capex: number;
  projectedOpportunity: number;
  viabilityBarriers: string[];
  investorBarriers: string[];
}

/** An opportunity match enriched with organisation names for the client. */
export interface MatchView extends OpportunityMatch {
  supplierName: string;
  supplierRegion: string;
  supplierSector: string;
  buyerName: string;
  buyerRegion: string;
  buyerSector: string;
}

/** A material stream enriched with its organisation's identity. */
export interface StreamView extends MaterialStream {
  orgName: string;
  orgRegion: string;
  orgSector: string;
}
