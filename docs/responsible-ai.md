# Responsible AI

## The core product uses no external LLM

Circa's core demonstration is **fully deterministic**. It does **not** depend on OpenAI, Anthropic, Gemini or any other external AI service. Scores, drivers, recommendations and financial scenarios are produced by transparent, testable rules in `src/domain/`:

- **Scoring** — weighted averages with fixed, documented weights (`domain/scoring`).
- **Recommendations** — explicit `when`/`rationale` rules (`domain/recommendations/engine.ts`).
- **Scenarios** — an explicit P&L and named single-variable shocks (`domain/scenarios`).

The same inputs always yield the same outputs. There is no model inference, no training data, and nothing is hidden behind a black box. This is a deliberate choice: for a commercial-decision tool aimed at funders and public programmes, **explainability and reproducibility** matter more than generative flair.

## We do not fake AI

Nothing in Circa is presented as AI-generated when it is not. Recommendations and narrative are rule-based and are described as such throughout the product and docs. There are no fabricated "AI insights".

## Where AI could add value later (future integration)

If introduced in a later Accelerator phase, AI would **augment** the deterministic core, never replace or obscure it, and would be clearly labelled and human-reviewed. Candidate features:

- **Commercial narrative summarisation** — draft plain-English summaries of an assessment or investment case from the deterministic scores (human-edited before use).
- **Evidence extraction** — pull structured evidence items (type, source, confidence) from uploaded documents to speed up assessment.
- **Scenario interpretation** — explain, in words, why a scenario or sensitivity result moved, grounded in the computed numbers.
- **Benchmark analysis** — surface patterns across a real cohort for programme teams.

## Principles for any future AI

1. **Augment, don't obscure.** The deterministic scores remain the source of truth; AI output is clearly separated and labelled.
2. **Human oversight.** AI never makes funding or policy decisions; a person reviews and owns the output.
3. **Grounding.** AI narrative must be grounded in the computed figures and cited evidence, not free-form speculation.
4. **Transparency.** Users are told when content is AI-assisted and can trace it back to underlying data.
5. **Privacy & security.** No sensitive or personal data is sent to third-party services without explicit consent and a lawful basis.

Until those guardrails are in place, Circa stays deterministic — and works completely without any AI API.
