# Known limitations

Circa is a **product demonstrator**. This document is an honest inventory of what it is not, so no one over-reads the prototype.

## Data

- **All data is synthetic.** The 12 businesses, their financials, evidence and suppliers are illustrative and do not represent real companies. Example names (Caledon Furniture Works, Forth Equipment Services, North Coast Textiles, etc.) are invented.
- There is **no live data feed** — no real business, financial, supplier or market integration.

## Scoring

- Scores are **prototype decision-support outputs**, not scientifically validated measures.
- Component **weights are expert-set defaults**, not empirically calibrated against realised outcomes.
- The score bands (Weak → Compelling) are indicative thresholds, not statistically derived.

## Financial model

- The scenario modeller is **annual and single-period**: it computes EBITDA and a **simple payback**, with **no discounting (NPV/IRR), no tax and no multi-year projection**.
- Working capital is treated as a single delta, not a phased cash-flow.
- Sensitivity covers **single-variable** shocks only, not correlated/multivariate stress.

## Product scope

- **No authentication or role-based access control (RBAC).** The data model includes a users concept and the architecture is designed to add roles, but they are not enabled.
- **No multi-tenant separation.** All users of the demonstrator share one dataset.
- **Assessment editing** persists inputs and recalculated scores for existing businesses; **creating a brand-new business** from scratch in the UI is out of scope for the demonstrator.
- **PDF** is produced via reliable browser printing of the investment case, not a bespoke server-side PDF pipeline.
- **Evidence items** are displayed and drive Evidence Confidence, but there is no upload/verification workflow.

## Operational

- The demonstrator is `noindex` and not hardened for production traffic.
- The demo-data reset is intentionally destructive (guarded by a typed confirmation) and restores the deterministic seed.

## What a 15-week Accelerator would address

- Co-design with Zero Waste Scotland and real SMEs; user research led by The DataKirk.
- Empirical **calibration** of weights against real programme and investment outcomes.
- **DCF / multi-year** financial modelling and richer sensitivity.
- **Evidence-capture** workflow and (optional, labelled) AI augmentation per `responsible-ai.md`.
- **RBAC**, multi-tenancy and live data integration.
- Independent expert **review** of the scoring framework.
