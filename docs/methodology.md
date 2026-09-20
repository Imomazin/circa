# Methodology

Circa turns an assessment into **prototype decision-support scores**. This document is the written companion to the in-product Methodology page and to the code in `src/domain/scoring` and `src/domain/scenarios`.

> Scores are prototype decision-support outputs, not scientifically validated measures.

## Scores

Five dimensions, each a **transparent weighted average** of component sub-scores on a 0–100 scale. Component weights sum to 1 within a dimension and are fixed in code. Inputs where "higher is worse" are inverted so every component points the same way (higher is better).

### Commercial Viability (`viability.ts`) — 40% of headline
Components and weights: market attractiveness (0.13), customer demand (0.13), revenue potential (0.12), margin potential (0.12), capital efficiency (0.13, derived), payback (0.10, derived), operational feasibility (0.10), scalability (0.07), commercial risk inverted (0.06), resource exposure inverted (0.04).

- **Capital efficiency** maps `capex ÷ (annualRevenueUplift + annualCostSaving)` (years of benefit to repay capex) onto 0–100: ≤1yr → 95, ≥10yr → 10, linear between.
- **Payback** maps expected payback years onto 0–100: ≤1yr → 100, ≥8yr → 5, decaying between.

### Commercial Resilience (`resilience.ts`) — 20% of headline
Supplier diversification (0.12, inverted concentration), material independence (0.10, inverted), import exposure inverted (0.08), resource-price stability (0.10, inverted volatility), substitution options (0.08), repairability (0.07), reuse opportunity (0.07), revenue diversity (0.09), recurring revenue (0.11), customer retention (0.08), operational flexibility (0.10).

### Investor Readiness (`investor.ts`) — 25% of headline
Customer evidence (0.13), market validation (0.10), commercial traction (0.12), unit economics (0.13), management capability (0.10), operating capability (0.08), scalability (0.08), capital-requirement clarity (0.08), risk understanding (0.06), resource security (0.04), circular proposition clarity (0.04), data quality (0.04).

### Circular Opportunity (`opportunity.ts`) — 15% of headline
Material recovery potential (0.22), lifetime extension potential (0.20), circular revenue-model strength (0.24), supply-chain benefit (0.17), resource-security benefit (0.17).

### Evidence Confidence (`evidence.ts`) — modifier
Evidence coverage (0.30), recency (0.20), source independence (0.25), verification status (0.25). Computed first; its score maps to a confidence level (Low < 45 ≤ Moderate < 70 ≤ High) that is attached to every other dimension.

### Headline
`headline = 0.40·viability + 0.20·resilience + 0.25·investor + 0.15·opportunity` (see `headlineScore`). Evidence acts as a confidence lens, not a headline weight.

### Banding
| Band | Range |
| --- | --- |
| Compelling | 80–100 |
| Strong | 65–79.9 |
| Developing | 50–64.9 |
| Emerging | 35–49.9 |
| Weak | 0–34.9 |

## Drivers, gaps and recommendations

For each dimension the engine surfaces the most decisive components as **positive drivers** (≥70) and **negative drivers** (≤45), plus dimension-specific **missing-evidence** flags. A separate deterministic recommendation engine (`recommendations/engine.ts`) applies transparent rules across the whole assessment, each carrying its own rationale and priority.

## Financial scenarios

`scenarios/model.ts` is an explicit annual P&L:

```
revenue      = baseline.revenue      × (1 + revenueDeltaPct/100)
materialCost = baseline.materialCost × (1 + materialCostDeltaPct/100)   (energy, labour likewise)
cogs         = materialCost + energyCost + labourCost
grossProfit  = revenue − cogs
opex'        = baseline.opex × (1 + opexDeltaPct/100)   (maintenance likewise)
ebitda       = grossProfit − (opex' + maintenance')
benefit      = ebitda − baselineEbitda
payback      = capex / benefit           (if capex > 0 and benefit > 0, else n/a)
cashReq      = capex + workingCapitalDelta
recurringRev = revenue × recurringRevenueSharePct/100
```

Four scenarios are modelled: **baseline** (do-nothing), **circular base**, **upside** and **downside**. Sensitivity (`scenarios/sensitivity.ts`) applies single-variable shocks (material +10%, uptake −10%, capex +15%, retention +5pts, recurring +10pts, energy +20%) and reports the change in EBITDA, margin and payback.

## Determinism

The same inputs (and timestamp) always produce the same scores and scenarios. There is no randomness and no ML model in the core product. This is what makes the numbers explainable and reproducible.

## Limitations & future validation

Weights are expert-set defaults, not empirically calibrated; the model is annual and omits discounting and tax; all data is synthetic. Future validation: calibrate weights against realised outcomes, add DCF and multi-year modelling, and run an independent expert review of the framework. See `docs/known-limitations.md`.
