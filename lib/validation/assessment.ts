import { z } from "zod";

export const sectors = [
  "Textiles",
  "Manufacturing",
  "Food",
  "Construction",
  "Electronics",
  "Furniture",
  "Equipment rental",
  "Consumer goods",
  "Packaging",
  "Industrial services",
] as const;
export const models = [
  "Reuse",
  "Repair",
  "Refurbishment",
  "Remanufacturing",
  "Take-back",
  "Leasing",
  "Subscription",
  "Product-as-a-Service",
  "Sharing",
  "Closed-loop material use",
  "Waste-to-value",
  "Lifetime extension",
] as const;
export const stages = [
  "Discovery",
  "Assessment",
  "Validation",
  "Investment case",
] as const;
const score = z.number().finite().min(0).max(100);
const money = z.number().finite().min(0).max(1_000_000_000);
export const factorsSchema = z.object({
  demand: score,
  market: score,
  capability: score,
  readiness: score,
  supplierConcentration: score,
  importDependency: score,
  volatility: score,
  substitution: score,
  repairability: score,
  reuse: score,
  diversity: score,
  retention: score,
  flexibility: score,
  scalability: score,
  traction: score,
  resourceSecurity: score,
  evidence: score,
});
export const baselineSchema = z.object({
  revenue: money,
  material: money,
  labour: money,
  energy: money,
  maintenance: money,
  overhead: money,
});
export const scenarioSchema = z
  .object({
    revenueChange: z.number().finite().min(-80).max(100),
    materialSaving: score,
    energySaving: score,
    recurringRevenue: money,
    extraLabour: money,
    extraOperating: money,
    capex: money,
    workingCapital: money,
    residualValue: money,
    retention: score,
    supplierShock: score,
  })
  .refine((v) => v.residualValue <= v.capex, {
    path: ["residualValue"],
    message: "Residual value cannot exceed initial capital expenditure.",
  });
export const assessmentSchema = z.object({
  name: z.string().trim().min(3).max(100),
  sector: z.enum(sectors),
  region: z.enum(["Central Scotland", "North & Islands", "South Scotland"]),
  size: z.enum(["Micro", "Small", "Medium"]),
  businessModel: z.array(z.enum(models)).min(1).max(5),
  summary: z.string().trim().min(20).max(1200),
  operatingModel: z.string().trim().min(10).max(1000),
  opportunity: z.string().trim().min(15).max(1200),
  customerEvidence: z.string().trim().min(10).max(1000),
  resourceDependencies: z.string().trim().min(5).max(1000),
  barriers: z
    .array(
      z.enum([
        "Customer evidence",
        "Capital access",
        "Supplier concentration",
        "Operating capacity",
        "Unit economics",
        "Skills & capability",
      ]),
    )
    .max(6),
  factors: factorsSchema,
  baseline: baselineSchema,
  scenario: scenarioSchema,
});
export type Factors = z.infer<typeof factorsSchema>;
export type Baseline = z.infer<typeof baselineSchema>;
export type ScenarioInput = z.infer<typeof scenarioSchema>;
export type AssessmentInput = z.infer<typeof assessmentSchema>;
export type Stage = (typeof stages)[number];
