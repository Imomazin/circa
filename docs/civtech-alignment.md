# CivTech 12.3 alignment

**Challenge sponsor:** Zero Waste Scotland
**Challenge:** *How can technology demonstrate the commercial value of circular economy business practices?*
**Partnership:** Ambidexters Ltd × The DataKirk SCIO

This document maps the official challenge intent to Circa's response. The official CivTech challenge is the primary source of truth; Zero Waste Scotland requirements are not invented here. Status labels are used precisely:

- **Implemented** — working, database-backed, in this demonstrator.
- **Prototype** — working but deliberately simplified; not production-grade.
- **Simulated** — driven by synthetic data standing in for a real feed.
- **Future integration** — designed for, not yet built.
- **Future validation** — needs empirical calibration/expert review.

> This is a demonstrator. It does not imply Zero Waste Scotland or CivTech approval, endorsement or production deployment.

## Requirement → response

| Challenge requirement | Product response | Implemented feature | User journey | Required data | Status | Limitation | Future Accelerator work |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Demonstrate the **commercial value** of circular practices | A commercial-intelligence platform centred on "does this make commercial sense?" | Executive dashboard, viability scoring, financial modeller | Leader/adviser opens dashboard → business → assessment → scenario → investment case | Assessment inputs, financial baselines | Implemented (Prototype scoring) | Scores are prototype, not validated | Calibrate against realised outcomes |
| Make the value **legible to decision-makers** | Executive-grade dashboards, tables and scenario comparison | Overview, Programme intelligence | Filter by sector/stage/band; read distributions and pipeline | Scores, sector benchmarks | Implemented | Synthetic cohort | Live programme data feed |
| Assess **commercial viability** | Weighted, transparent viability score with drivers | `domain/scoring/viability.ts` | Assessment → viability card with components/drivers | Market, revenue, margin, capex, payback, risk | Implemented (Prototype) | Expert-set weights | Empirical weighting |
| Assess **commercial resilience / resource & supply-chain risk** | Resilience score covering supplier/material concentration, volatility, recurring revenue | `domain/scoring/resilience.ts`, resource & supplier tables | Business profile → resource dependencies, supplier risks, resilience card | Supplier shares, material dependencies | Implemented (Prototype) | Self-declared exposure | Integrate real supplier data |
| Assess **investment readiness** | Investor readiness score, radar, evidence gaps, actions | Investor readiness pages, investment case | Investor readiness → case (print-friendly) | Evidence, traction, unit economics, capability | Implemented (Prototype) | Prototype scoring | Investor co-design |
| Model **financial impact / capital requirement** | Baseline/circular/upside/downside modeller with sensitivity | `domain/scenarios/*`, scenario modeller | Scenarios → edit levers → save → sensitivity | Baseline P&L, assumption levers | Implemented (Prototype) | Annual, no discounting/tax | DCF, multi-year |
| Provide **evidence quality signalling** | Evidence Confidence dimension modifies all scores | `domain/scoring/evidence.ts`, evidence table | Assessment → evidence summary; dashboard scatter | Evidence items (type, source, status) | Implemented (Simulated data) | Synthetic evidence | Evidence capture workflow |
| Generate **recommendations / next steps** | Deterministic, transparent rules with rationale | `domain/recommendations/engine.ts` | Business/assessment → recommendations | Inputs + scores | Implemented | Rule-based, not exhaustive | Adviser-curated library |
| Support **programme / policy** oversight | Anonymised aggregate view | `app/programme` | Programme intelligence page | Aggregated scores, benchmarks | Implemented (Simulated) | Synthetic cohort | Real cohort, RBAC |
| Handle **data responsibly** | Synthetic data, audit trail, no secrets in repo | Governance page, `audit_events` | Governance → audit trail | Audit events | Implemented | No RBAC yet | RBAC, retention policy |
| Work **without dependence on external AI** | Fully deterministic core | Entire scoring/recommendation stack | All journeys | — | Implemented | — | Optional AI augmentation (see responsible-ai.md) |

## Target users addressed

SME business leader, business adviser, programme manager, commercial analyst, investor/funder, Zero Waste Scotland programme user, policy analyst. Formal RBAC is not yet enabled, but the data model and architecture are designed to add roles without rework.

## Honest gaps

- All data is **synthetic**; there is no live business, financial or supplier feed.
- Scores are **prototype decision-support**, not empirically validated.
- The financial model is intentionally simple.
- No authentication/RBAC in the demonstrator.

These are the natural focus of a 15-week Accelerator: co-design with Zero Waste Scotland and real SMEs, empirical calibration, evidence-capture workflows, live data integration and role-based access.
